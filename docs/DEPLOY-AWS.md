# GovDoc — AWS Production Deploy Runbook

How the live app is deployed. **This is the real process** (the older `docs/DEPLOY.md` describes a
Cloud Run setup that is **not** used).

**Pipeline:** `zip source → S3 → EB application version → EB builds the Docker image on the
instance → ALB → CloudFront`. There is **no ECR / CodeBuild / CodePipeline** — Elastic Beanstalk's
single-container Docker platform builds the image itself from the `Dockerfile` in the bundle.

---

## 1. Resources (all in AWS account `881490114847`, region `us-west-2`)

| Resource | Name / ID |
|---|---|
| Deploy IAM user | `danish-llm` (keys in `danish-llm_accessKeys.csv`, gitignored) |
| EB application | `govdoc` |
| EB environment | `govdoc-prod` |
| EB CNAME (ALB origin) | `govdoc-prod.eba-qudrjs6i.us-west-2.elasticbeanstalk.com` |
| Source-bundle S3 bucket | `govdoc-build-881490114847` (objects: `vNN-<name>.zip`) |
| CloudFront distribution | `E2S5JFHZNM4AMQ` → `https://d2lhoz37jxbg1w.cloudfront.net` |
| RDS Postgres (pgvector) | `govdoc-poc-db.cx4gmc20awoc.us-west-2.rds.amazonaws.com`, db `govdoc` |
| S3 (council captions, ingest only) | `sunnyvale-captionnotes` / prefix `sunnyvale/caption-notes/` |

> The default AWS CLI profile on the build machine may point at a **different** account
> (`539880710917`, DMV) with no EB envs. Always deploy with the **`danish-llm`** creds (below).

---

## 2. How runtime config/secrets reach the app (important)

Secrets are **baked into the image**: the `Dockerfile` does `COPY .env.local ./.env.local` and
`start.sh` loads it at boot. **EB environment properties are NOT injected into the container**, so
`.env.local` is the source of truth at runtime.

- `.env.local` must be present at the repo root at build time and contain at least:
  `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GROQ_API_KEY`, `GOVDOC_DEV_USER`, `GOVDOC_DEV_PASS`,
  `GOVDOC_SESSION_SECRET` (≥32 bytes), and `DATABASE_URL`. (AWS S3 vars are only needed for
  council ingestion, not at runtime.)
- `.env.local`, `env`, and `danish-llm_accessKeys.csv` are gitignored and must **never** be
  committed. They ARE included in the deploy zip (that's how secrets reach the image) — keep the
  bundle private (it lives in `govdoc-build-881490114847`).

---

## 3. Hard requirements for a successful build (lessons learned)

A deploy fails unless ALL of these hold (each caused a real failed deploy):

1. **`npm run build` passes locally** — EB runs the same build; a parse/compile error fails the
   image build. (Watch for non-ASCII "smart quotes" in `.tsx` — they break the build.)
2. **`artifacts/` exists in the bundle** — the Dockerfile does `COPY --from=build /app/artifacts`.
   A tracked `artifacts/.gitkeep` keeps the (otherwise gitignored) folder present.
3. **`start.sh` is LF, not CRLF** — CRLF makes the container exit **127** at startup. Enforced by
   `.gitattributes` (`*.sh text eol=lf`) and defensively by the Dockerfile
   (`sed -i 's/\r$//' start.sh`). `CMD ["/bin/sh","start.sh"]`.
4. **`.env.local` present** — otherwise the container exits at boot (env validation in
   `instrumentation.ts`).

No Prisma migration is needed for normal deploys (the app reuses existing columns).

---

## 4. Deploy steps

Pick the next version label, e.g. `v25-<short-name>`. From the repo root:

### 4.0 Load the deploy credentials (bash)
```bash
K=$(sed -n '2p' danish-llm_accessKeys.csv | tr -d '\r' | cut -d, -f1)
S=$(sed -n '2p' danish-llm_accessKeys.csv | tr -d '\r' | cut -d, -f2)
export AWS_ACCESS_KEY_ID="$K" AWS_SECRET_ACCESS_KEY="$S" AWS_REGION=us-west-2
aws sts get-caller-identity   # must show Account 881490114847
```

### 4.1 Verify the build (gate)
```bash
npm run typecheck && npm run lint && npm run build
```

### 4.2 Build the source zip (PowerShell — `zip` isn't installed)
Include everything EXCEPT `node_modules`, `.next`, `.git`, `finance/`, `tests`, `docs`,
`.worktrees`, the bare `env` file, the AWS CSV, and prior `*.zip`. **Include `.env.local`,
`Dockerfile`, `start.sh`, `.ebextensions/`, `.platform/`, `prisma/`, `artifacts/`.** Resulting zip
is ~1.2 MB (source only; EB runs `npm ci` + build).
```powershell
$src='C:\Users\danis\Documents\govdoc_git\GovDoc'; $zip="$src\v25-x.zip"
if(Test-Path $zip){Remove-Item -Force $zip}
$exclDirs=@('node_modules','.next','.git','finance','tests','docs','.worktrees','coverage','playwright-report','test-results')
$exclFiles=@('env','danish-llm_accessKeys.csv') + (Get-ChildItem $src -Filter *.zip | ForEach-Object Name)
$bs=[char]92;$fs=[char]47;$srcLen=$src.Length+1
Add-Type -AssemblyName System.IO.Compression.FileSystem
$a=[System.IO.Compression.ZipFile]::Open($zip,'Create')
Get-ChildItem -LiteralPath $src -Force | Where-Object { $exclDirs -notcontains $_.Name -and $exclFiles -notcontains $_.Name } | ForEach-Object {
  if($_.PSIsContainer){ Get-ChildItem $_.FullName -Recurse -File -Force | ForEach-Object { [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($a,$_.FullName,$_.FullName.Substring($srcLen).Replace($bs,$fs))|Out-Null } }
  else { [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($a,$_.FullName,$_.Name)|Out-Null }
}
$a.Dispose(); "built $zip"
```

### 4.3 Upload → create version → deploy (bash)
```bash
VER=v25-x
aws s3 cp "$VER.zip" "s3://govdoc-build-881490114847/$VER.zip"
aws elasticbeanstalk create-application-version --application-name govdoc \
  --version-label "$VER" \
  --source-bundle S3Bucket=govdoc-build-881490114847,S3Key="$VER.zip"
aws elasticbeanstalk update-environment --environment-name govdoc-prod --version-label "$VER"
```

### 4.4 Wait until Ready, then invalidate CloudFront
```bash
# poll (Ctrl-C once Status=Ready)
aws elasticbeanstalk describe-environments --environment-names govdoc-prod \
  --query "Environments[0].[Status,Health,VersionLabel]" --output text
# success looks like:  Ready  Green  v25-x
aws cloudfront create-invalidation --distribution-id E2S5JFHZNM4AMQ --paths "/*"
```

---

## 5. Verify
```bash
curl -s https://d2lhoz37jxbg1w.cloudfront.net/api/health    # {"ok":true,"service":"govdoc",...}
```
Then log in (GOVDOC_DEV_USER / GOVDOC_DEV_PASS from `.env.local`) and smoke-test a chat prompt.

A successful deploy = EB `Ready / Green` with `VersionLabel` equal to the new label. If
`VersionLabel` stays on the previous version, the deploy **failed and EB kept the old one**
(the site keeps serving the old version — no outage).

---

## 6. Rollback
```bash
aws elasticbeanstalk describe-application-versions --application-name govdoc \
  --query "ApplicationVersions[:8].VersionLabel" --output text     # list versions
aws elasticbeanstalk update-environment --environment-name govdoc-prod \
  --version-label v24-multi-kb                                     # redeploy a known-good
```

---

## 7. Troubleshooting (observed failure modes)

| Symptom (EB events / `docker ps`) | Cause | Fix |
|---|---|---|
| `failed to build the Docker image ... "/app/artifacts": not found` | `artifacts/` missing from bundle | ensure `artifacts/.gitkeep` is included |
| Container `Exited (127)` · "container unexpectedly ended after started" | CRLF in `start.sh` (interpreter not found) | LF line endings; Dockerfile `sed`+`CMD ["/bin/sh","start.sh"]` |
| Container ends at boot, env error in logs | missing `.env.local` / required env var | bake a complete `.env.local` |
| `npm ci` fails during build | `package.json`/`package-lock.json` out of sync | commit a matching lockfile |
| Site 502 after a failed deploy | new container crashed | roll back (§6) to restore, then fix |

### Reading the failing container's logs
```bash
aws elasticbeanstalk request-environment-info  --environment-name govdoc-prod --info-type bundle
aws elasticbeanstalk retrieve-environment-info --environment-name govdoc-prod --info-type bundle \
  --query "EnvironmentInfo[-1].Message" --output text     # -> S3 URL; download + unzip
# container stdout: var/log/eb-docker/containers/eb-current-app/*-stdouterr.log
# build/deploy log: var/log/eb-engine.log
```

---

## 8. Knowledge-base data (one-time / when sources change)

KB chunks live in the shared RDS, so a code deploy does **not** touch them. To (re)ingest, run
locally against the same `DATABASE_URL` (env from `.env.local`):
```bash
node --env-file=.env.local --import tsx scripts/ingest-finance-kb.ts            # Sunnyvale budget (both volumes)
node --env-file=.env.local --import tsx scripts/ingest-finance-kb.ts --city=fremont
node --env-file=.env.local --import tsx scripts/ingest-council-kb.ts            # council caption notes from S3
```
