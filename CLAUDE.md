# govdoc — Local Project Notes

Local-only file (gitignored). Things this project has taught me that I want to remember next session.

## Quick start

```bash
npm install                # always run first when arriving at this repo (see safeguard below)
npm run dev                # Next.js dev server on :3000 (Turbopack)
npm run build              # production build
npm run lint               # ESLint
npx tsc --noEmit           # type-check only (no emit)
npm test                   # vitest run — full suite, hits real LLM keys via integration tests
```

**Scoped tests (no LLM calls):** `npx vitest run components lib/usecases/cmgc-pde lib/usecases/cucp-reevals lib/usecases/row-appraisal/parsing lib/usecases/row-appraisal/exporters lib/usecases/row-appraisal/pipeline`

**Issue tracking:** No external tracker. Open follow-ups are kept in the "Open follow-ups" section at the bottom of this file.

## Before you commit

Run as a pair — both must be clean:

```bash
npm run lint && npx tsc --noEmit
```

If either is dirty, fix before committing. CI will catch it otherwise; better to catch locally.

## Project shape

- Next.js 16 App Router (Turbopack) + React 19 + Tailwind v4 + TypeScript strict (`noUncheckedIndexedAccess` is ON).
- Tests: Vitest unit/component (`*.test.ts[x]`) + Playwright `@e2e` against the deployed URL.
- Pipeline: async-generator steps that yield `StepEvent` to a Zustand store via SSE. See `lib/usecases/types.ts:21` for the event shape and `store/use-pipeline.ts` for the consumer.
- Three use cases live in `lib/usecases/registry.ts`: `cmgc-pde` (indigo tone), `cucp-reevals` (blue tone), `row-appraisal` (green tone). Tone registry: `components/work/use-case-tone.ts`.
- HITL gate exists **only** for `cucp-reevals` (rendezvous in `lib/runs/needs-input-rendezvous.ts`). CMGC and ROW never block on review — caltrans doesn't either.
- Reference Streamlit app: `~/Downloads/caltrans/`. **Status palette** (2026-05-13: user explicitly chose theme-toned over caltrans saturated red/green): soft `emerald-50/700` Pass / `amber-50/800` Warning / `rose-50/700` Fail / `muted/muted-foreground` N/A. The semantic *meaning* (Pass / Warning / Fail / N/A) is the contract, not the original hex values. Codified in `components/work/row/status-tone.ts`. Original caltrans hexes (`#d4edda / #fff3cd / #f8d7da / #e2e3e5`) are kept as a comment paper trail.

## Read caltrans before touching a use case

The Streamlit reference at `~/Downloads/caltrans/` is the source of truth for HITL UX. Don't approximate it — match it column-by-column, dropdown-by-dropdown, button-by-button. The methodology lives in `caltrans/src/cucp_reevals.py`, `caltrans/src/<use-case>_evaluator.py`, and the rendering lives in `caltrans/app.py`.

**Why:** A prior session shipped a CUCP override panel where the reason field was a single-line `<input>` (caltrans: required multi-line `text_area`), Level 2 was an unstyled `<ul>` list (caltrans: sortable `st.dataframe` with `Fact #` / `Legal Category` / `Summary` / `AI Reasoning` columns + Back / Approve buttons), Level 3 disappeared after override submission (caltrans: keeps the styled L3 dataframe with Pass/Fail color-coding visible until "Approve Final"), and the `request_info` field had no UI semantics (caltrans: when `Yes`, it flips `final_decision` to "Not eligible at this time (pending additional information)"). User had to call all of this out. The shape was copy-pasted; the methodology wasn't.

**How to apply — every time, before writing or modifying UI under `app/work/<use-case>/` or `components/work/<use-case>/`:**

1. Open `~/Downloads/caltrans/app.py`. Find the section for the use case using grep: `grep -n "run_level_\|st.dataframe\|selectbox\|text_area" app.py | head -50`.
2. Read the relevant `caltrans/src/*.py` evaluator file. Note the **schema** of every level's output (field names, enums, how `request_info` / `final_decision` / `confidence` are typed).
3. From `app.py`, mirror exactly: column names, column types, sortable/selectable behavior, color coding rules, back-button targets, forward-button labels, dropdown options **verbatim** (these are legal category names under 49 CFR §26.67 — don't paraphrase), text-area labels, validation rules, `final_decision` strings.
4. Grep for `st.session_state.staged_precedents`, `commit_staged_precedents`, `memory_manager` to understand override semantics: in caltrans, an override re-runs the level immediately with the override staged as a precedent, and only commits to persistent memory at "Approve Final".
5. If our port deviates intentionally (e.g. SSE pipeline instead of Streamlit re-runs), document why in a top-of-file comment.

**The HITL invariants table below is the pre-flight checklist.** If a user complaint says "X feels off in <use-case>", the FIRST file to open is `caltrans/app.py`, not our component.

## HITL invariants — CUCP / CMGC / ROW

Load-bearing rules our port must match. Failing any of them means the methodology is broken even if tests pass.

### CUCP-reevals (3 levels, mandatory stepper)

| Invariant | Caltrans source | Status in our port |
|---|---|---|
| 3 explicit levels each with their own table view (L1 facts → L2 classifications → L3 7-criteria) | `app.py:730, 896, 1029` | ✅ resolved 2026-05-09 — `components/work/cucp/cucp-stepper.tsx` renders `L1FactsTable` → `L2ClassificationsTable` → `L3CriteriaTable` |
| Each level has Back-to-prior + Approve-and-continue button | `app.py:900, 1006, 1075, 1175` | ✅ resolved 2026-05-09 — per-level Back / Approve & Continue / Submit & Finalize buttons in `cucp-stepper.tsx:174-243` |
| Override **reason** field is multi-line `<textarea>`, **required** (block submit) | `app.py:823, 966, 1138` | ✅ resolved 2026-05-09 — `l2-classifications-table.tsx` and `l3-override-form.tsx` both use multi-line `<textarea>` with a ≥15-char floor (intentionally stricter than caltrans's non-empty rule). Old `criteria-table.tsx` is dead. |
| Override **target** uses dropdown (which fact / field) | `app.py:786` | ➖ N/A in current form-below-table pattern (the Save Override button operates on the form's selected fact_id) |
| Override **new value** uses dropdown of fixed options (L2: 5 legal categories; L3: Pass / Fail / Request Additional Information) | `app.py:957, 1129` | ✅ `L2_LEGAL_CATEGORIES` + `VERDICTS` arrays match caltrans verbatim |
| `request_info=Yes` flips `final_decision` to "Not eligible at this time (pending additional information)" — visible in UI as banner or label | `cucp_reevals.py:207` | ✅ resolved 2026-05-09 — `RequestInfoBanner` mounted in `cucp-stepper.tsx:218,247`, driven by `criteria.some(c => c.request_info === "Yes")` |
| L3 styled table (color-coded Pass/Fail/Confidence) stays visible on Done screen | `app.py:1029, 1192` | ✅ matches caltrans — both ports show only the markdown report after finalize (`page.tsx:438-451`); per Explore audit caltrans does the same |
| Theme-toned status palette (Pass `emerald-50/700` / Warning `amber-50/800` / Fail `rose-50/700` / N/A `muted/muted-foreground`) — caltrans hexes intentionally swapped 2026-05-13 for theme consistency | `app.py` `.style.map()` (semantic only) | ✅ codified in `components/work/row/status-tone.ts` — reuse for CUCP/CMGC too |
| Apply Override **re-runs the level** with override staged as precedent | caltrans re-eval loop | ✅ resolved 2026-05-09: L2 and L3 steps are now evaluate-pause-(override-or-approve) loops driven by `lib/runs/level-rendezvous.ts`; staged precedents commit at Submit & Finalize |
| L1 has structured override surface (target/field dropdowns, undo, clear, 36/45 limits, ≥15-char reason) — `app.py:730-870` | spec `2026-05-09-cucp-l1-override-design.md` | ✅ resolved 2026-05-10 — `components/work/cucp/l1-override-form.tsx` + `level-1-step.ts` evaluate-pause loop (override-fact / override-field / override-incident / undo / clear / approve) + 4 API routes under `app/api/usecases/cucp-reevals/run/[runId]/level/[n]/{override,approve,undo,clear}`. firm_name + narrative_pnw are post-LLM patches via `ctx.staged.l1_field_overrides` (matches caltrans `analyst_overrides` channel); fact-field + specific-incident go through the standard precedents stream. `l1_action_log` is a LIFO stack so Undo handles both channels. |
| Stepper handlers surface POST failures via `actionError` alert instead of swallowing | n/a (UX bug from earlier session) | ✅ resolved 2026-05-09 — `cucp-stepper.tsx` `postJson` helper sets `actionError` on `!res.ok`; alert renders above the stepper |

### CMGC-pde

| Invariant | Source | Status |
|---|---|---|
| `AI Rating` and `Effective` columns render `—` for missing data, never a silently-blank cell | `app.py` PDE rating table | ✅ `score-table.tsx` uses `\|\|` (not `??`) so empty-string ratings collapse to `—` alongside null/undefined; `composeCmgcResult` accepts `"A"\|"B"\|"C"\|""\|null\|undefined` (empty is legitimate when narrative info is missing) and rejects anything else (e.g. `"D"`, numbers) as `kind: "debug"` |
| Override capture must persist a **reason** | `app.py` PDE override flow | ✅ `OverrideCard` requires ≥15-char reason; `useOverridesStore.push` persists it; ScoreTable inline-select dead path was removed (single source of truth = `HiflWizard` → `OverrideCard`) |
| Confidence uses the same Pass/Warning/Fail palette | `app.py` styled dataframe | ⚠️ unverified — audit |

### ROW-appraisal

| Invariant | Source | Status |
|---|---|---|
| 3 result tabs: Executive Summary / Detailed / Action Items | caltrans ROW tabs | ✅ `components/work/row/result-tabs.tsx` |
| Status palette as visual contract | `components/work/row/status-tone.ts` | ✅ |
| Tabs jump to failing categories first when present | caltrans default tab logic | ✅ `result-tabs.tsx` defaults to "Detailed Findings" when any row has Fail status / score < 3; otherwise "Executive Summary" |
| Status column tinted to match Score column | `app.py` styled dataframe | ✅ `results-table.tsx` applies `STATUS_TONE[status].cell` to both Score and Status `<td>`s |
| Long unbreakable rule/evidence text wraps inside `max-w-md` cells | n/a (rendering bug) | ✅ `findings-table.tsx` Rule + Evidence cells use `max-w-md break-words` |

## Deploy

- Cloud Run service `govdoc` in project `genai-poc-424806`, region `us-central1`. URL: `https://govdoc-398219119144.us-central1.run.app`.
- Runbook: `docs/DEPLOY.md`. Production script: `scripts/deploy-cloud-run.sh`.
- **CRITICAL DEPLOYMENT RULE:** Do NOT upload the Anthropic API key to Secret Manager.
- Because of this, **always deploy to Cloud Run using the `--legacy-env-vars` flag** (e.g., `scripts/deploy-cloud-run.sh --legacy-env-vars`). This flag reads the valid API keys from `.env.local` and passes them inline to the Cloud Run revision as environment variables, bypassing Secret Manager.
- The default service account used is the default Compute SA.
- Current active/valid LLM provider keys are stored locally in `.env.local`. Do not share them publicly.

## Safeguards — things to ALWAYS do

### Talk to the user in plain English — and never put internal acronyms in user-facing copy

- **Why:** Two related slips in one session. (1) I used phrases like "scale legend placement" and "period on markers" when explaining a UI design choice — the user had to ask me what those meant. (2) I drafted rubric-page headers that said "Caltrans CMGC — Project Delivery Evaluator" with the acronym in plain view; the user pushed back: no `CMGC`, no `CUCP`, no `ROW` visible to humans. The internal IDs (`cmgc-pde`, `cucp-reevals`, `row-appraisal`) are URL/code routes only.
- **How to apply:**
  - When asking the user a decision question, write the way a designer would talk to a client: name the thing in concrete terms ("the small box that explains what A/B/C means"), and follow with the actual choice ("put it under the title, or hide it behind a `?` icon"). No invented terminology. If a word is a term of art and you have to use it, define it in the same sentence. Same rule for plans and summaries.
  - In any visible UI string (tab labels, headers, eyebrows, descriptions, buttons, banners, alerts, exporter filenames the user sees): use the friendly names from `lib/usecases/metadata.ts` ("Project Review" / "Narrative Review" / "Appraisal Review") and the spelled-out manual/regulation names ("Caltrans Project Delivery Manual", "49 CFR §26.67", "Caltrans Appraisal Manual"). Never `CMGC` / `CUCP` / `ROW`.
  - "Right-of-Way" spelled out is borderline acceptable (it's the legal name in the Caltrans manual). When in doubt, prefer a friendly substitute and let the user redirect.

### Never deploy from a dirty working tree — let the script enforce it

- **Why:** On 2026-05-13 the cloud was running 88 files of design work (cream/9-tile rebrand, "LLM at Scale.AI" top bar, ConfirmDialog, new exporters) that lived nowhere in git — only in `stash@{0}` plus untracked files. A prior session had run `gcloud run deploy --source .` from a dirty working tree, baking everything into the image and tagging `GIT_COMMIT=fc35c96-dirty`. The next local `npm run dev` showed the OLD landing page, the user said "ice ages," and recovering the deployed state required reconstructing from stash + reflog + the deployed image. Hours lost.
- **How to apply:**
  1. ALWAYS deploy via `scripts/deploy-cloud-run.sh`. NEVER call `gcloud run deploy --source .` directly — that command silently includes uncommitted edits and untracked files.
  2. The script now refuses to run when `git status --porcelain` is non-empty (exit code 3 with the changes printed). If you see that error, commit (or stash with explicit intent to revisit) and re-run.
  3. If you genuinely need a throw-away WIP build (rare), pass `--allow-dirty`. The script will tag `GIT_COMMIT=<sha>-dirty` and `/api/health` will return `"dirty": true` + a warning string. Any dirty deploy is by definition not reproducible from git — treat it as ephemeral.
  4. At session end, if `git status --porcelain` shows substantial untracked or modified files (say >5), don't end the session quietly. Either commit, push to a WIP branch, or tell the user explicitly "I'm leaving this in stash@{0}, here's what's in it." Silent stashes are how the 2026-05-13 incident started.

### Verify subagent claims before believing them

- **Why:** Two implementer subagents this session described file changes that didn't match `git show --stat`. One claimed "Updated `form-fields.tsx` to add disabled prop" but the diff only touched the 2 CUCP files (`disabled` already existed). One claimed "Updated 5 existing tests" when the actual delta was only assertion strings.
- **How to apply:** After every subagent commit, run `git show --stat <sha>` and compare to what they reported. Don't pass implementer claims into the spec reviewer's prompt as fact — quote the diff instead.

### Check `node_modules` matches `package.json` before debugging "module not found"

- **Why:** Spent time tracing a `Module not found: Can't resolve 'pino'` runtime error before realizing `pino` and `pdf-lib` were declared in `package.json` and locked in `package-lock.json` but missing from `node_modules`. A plain `npm install` fixed it instantly.
- **How to apply:** First check on any "module not found" in this repo: `ls node_modules/<pkg>/package.json`. If absent, run `npm install` before anything else.

### Confirm a custom service account exists before passing `--service-account=...`

- **Why:** Deploy failed with `iam.serviceaccounts.actAs denied` on `govdoc-runtime@...` because the SA doesn't exist. The error message says "or it may not exist" — easy to miss the second clause.
- **How to apply:** Before any `gcloud run deploy --service-account=<sa>`, run `gcloud iam service-accounts describe <sa> --project=<proj>`. If `NOT_FOUND`, either run the one-time setup in `docs/DEPLOY.md` or omit the flag (default Compute SA).

### Never add `--allow-unauthenticated` on an UPDATE

- **Why:** Sandbox blocked a deploy retry because `--allow-unauthenticated` was a privilege change. For an update, omitting the flag preserves existing IAM, which is what was wanted.
- **How to apply:** `--allow-unauthenticated` belongs only on first-deploy of a service that should be public. For updates, leave it off.

### Add `--clear-secrets` when switching to `--set-env-vars`

- **Why:** Cloud Run rejects deploys where the same key (e.g. `OPENAI_API_KEY`) is bound both via `--update-secrets` and `--set-env-vars`. The govdoc service had previously been deployed with secret bindings (per `scripts/deploy-cloud-run.sh`), so direct `--set-env-vars` would conflict.
- **How to apply:** When deploying with `--set-env-vars`, always include `--clear-secrets` unless you're certain the previous revision had no secret bindings.

### Confirm `.env.local` is gitignored before assuming

- **Why:** I write secrets to `.env.local` from caltrans's `.env`. If it ever weren't gitignored, those keys would commit publicly.
- **How to apply:** `git check-ignore -v .env.local` should print `.gitignore:13:.env.local`. If it doesn't, **stop** and fix `.gitignore` before continuing.

### Wait for monitor events; don't poll

- **Why:** Cloud Run deploys take 5-8 minutes. Polling burns cache and tokens. The Monitor tool fires once per stdout line.
- **How to apply:** Use `Monitor` with a `tail -f | grep --line-buffered -E "Building|Uploading|Pushing|Creating|Routing|Service URL|Done\.|ERROR|FAIL|denied"` filter. Resume on each event; don't sleep.

## Anti-patterns I fell into

### Following reviewer suggestions blindly violates "Surgical Changes"

- **Why:** Two quality-reviewer subagents flagged "DRY violation between `use-case-tone.ts` and `landing/tile.tsx` — extract shared `lib/tones.ts`" as a minor issue. Acting on it would have been an unrequested refactor. Global CLAUDE.md is explicit: don't improve adjacent code.
- **How to apply:** Treat reviewer subagent output as a list of *candidates*. Filter through "did the user ask for this?" and "is it a real bug or a refactor opportunity?" before action. ⚠️ MINOR_ISSUES output ≠ must-fix.

### Running the full vitest suite when integration tests will hit real LLM keys

- **Why:** With `.env.local` populated, `npx vitest run` would have made real OpenAI/Anthropic/Groq calls via `tests/integration/row-pipeline.test.ts`. Sandbox correctly denied this.
- **How to apply:** Default to scoped runs: `npx vitest run components lib/usecases/cmgc-pde lib/usecases/cucp-reevals lib/usecases/row-appraisal/parsing lib/usecases/row-appraisal/exporters lib/usecases/row-appraisal/pipeline`. The full suite is for CI environments with mock LLM keys.

### Trusting a `tsc --noEmit` "0 errors" claim before the deps are synced

- **Why:** Pre-existing tsc errors hid behind "module not found" failures (pino, pdf-lib). Once `npm install` ran, ~15 new errors became visible. Cleaning them was 23 files.
- **How to apply:** Always run `npm install` first when arriving at a repo. Then run `tsc` to get the real picture. Don't trust earlier "clean" reports.

### Approximating caltrans instead of reading it

- **Why:** Shipped a CUCP override panel where Level 2 was an unstyled list (caltrans: dataframe with 4 named columns), Level 3 disappeared after submission (caltrans: stays visible with color-coded Pass/Fail), override reason was single-line text (caltrans: required multi-line `text_area`), and `request_info` had no UI semantics (caltrans: drives `final_decision` text). The implementation looked done but was disconnected from the methodology. The user had to call this out across CUCP and CMGC in one frustrated message.
- **How to apply:** Before any UI work in `app/work/<use-case>/` or `components/work/<use-case>/`, open `~/Downloads/caltrans/app.py` and the matching `caltrans/src/<use-case>_*.py` file. Use the "HITL invariants" table above as a pre-flight checklist. If you can't tell me which line of `caltrans/app.py` your component is mirroring, you haven't read enough yet — stop and re-read.

### Stashing major work instead of committing — git stash is invisible to deploy

- **Why:** A prior session stashed an 88-file rebrand as `stash@{0}` ("pre-rubric-header WIP + rubric-header experiment") with the intention of returning to it later. The session ended. The next deploy (`gcloud run deploy --source .`) silently included the stash-restored working tree, baking it into Cloud Run. The next local checkout reverted to the older `main` state, producing a confusing divergence: cloud had the design, github did not, local did not. Recovery required reflog archeology.
- **How to apply:** `git stash` is for context-switching within a session, not for "save this for later." If you have a working tree you want to revisit, **commit it to a WIP branch** (`git checkout -b wip/<topic> && git add -A && git commit -m "WIP: ..."`) — even a single throw-away commit makes the work *visible* in `git log`, *traceable* across machines, and *invisible* to `gcloud run deploy --source .` from other branches. Stash entries also expire silently from gc; commits don't.

### Trusting a "review pass" subagent without comparing to caltrans

- **Why:** The spec/code-quality reviewer subagents on this session approved every CUCP/CMGC change because the implementation matched the **spec**. They were never asked to compare against `caltrans/app.py`. Result: spec-compliant ports of the wrong UX.
- **How to apply:** When the work is on a `caltrans`-derived use case, every reviewer-subagent prompt must include "compare to `caltrans/app.py:<line-range>` and report any divergence in column shape, button label, dropdown options, color coding, or override semantics." Spec-compliance and caltrans-fidelity are two separate gates.

## Small tips

### `@base-ui/react/tabs` API

- `Tabs.Root`, `Tabs.List`, `Tabs.Tab`, `Tabs.Panel`, `Tabs.Indicator`. Verify with `node -e "console.log(Object.keys(require('@base-ui/react/tabs').Tabs))"`.
- `Tabs.Tab` emits `data-active=""` (empty string), **not** `data-selected="true"`. To get `data-selected="true"` for Tailwind variants like `data-[selected=true]:border-primary`, pass a `render` prop to `Tabs.Tab` that injects `data-selected={state.active ? "true" : undefined}`. See `components/work/row/result-tabs.tsx` for the pattern.

### ExcelJS Buffer typing in Node 22

- `buildEvaluationXlsx` returns `Buffer<ArrayBufferLike>` (Node 22's generic Buffer). ExcelJS's `wb.xlsx.load()` parameter is the older non-generic `Buffer`. They don't unify. In tests use `await wb.xlsx.load(buf as any)` — runtime is fine.

### `noUncheckedIndexedAccess` strictness

- Array indexing in this repo returns `T | undefined`. In test fixtures where the index is provably safe (e.g. regex capture group, fixed-length cycle), use `!` after the access: `expect(results[0]!.score).toBe(5)`.
- For real runtime code, prefer a length-check or `??` fallback over `!`.

### `gcloud` formatting strings

- Don't put `.` inside parentheses in a `--format="value(...)"` projection. `metadata.annotations.run.googleapis.com/ingress` will break the parser. Either escape or simplify.

### Defensive rendering of pipeline result fields

- Pipeline result objects (`r.evaluate.ratings`, `r.criteria`, etc.) are loosely typed at the boundary. `composeCmgcResult` (`lib/usecases/cmgc-pde/compose-result.ts`) now does real shape-validation and returns `{ kind: "debug" }` instead of blindly casting; CUCP API routes still pass payloads as `unknown`. When rendering nested fields in a table, ALWAYS guard with `?? "—"` or a length-check.
- Pattern to use everywhere:
  ```tsx
  <td>{r.selected_rating ?? "—"}</td>
  <td>{overrideMap[r.question_id] ?? r.selected_rating ?? "—"}</td>
  ```
- An empty cell in a result table is a code smell, not a UI choice — chase it upstream to a data-shape mismatch every time. The CMGC "both blank" bug shipped because `selected_rating: ""` passed `typeof === "string"` validation; compose-result now rejects anything outside `{"A","B","C"}` to make the failure mode explicit.

## Quick smoke after a deploy

```
URL=https://govdoc-398219119144.us-central1.run.app
curl -s "$URL/api/health"   # expect {"ok":true,"service":"govdoc",...}
open "$URL/login"            # log in dev/dev (or whatever .env.local has)
```

The `commit` field in `/api/health` should match `git rev-parse --short HEAD` of the revision that was deployed.

## Open follow-ups

Caltrans-fidelity gaps — these are methodology bugs, not polish. Each links to the caltrans line that defines the contract.

### Resolved — caltrans-fidelity sweep 2026-05-09

1. ~~**Override reason is a single-line `<input>`, not required**~~ — resolved by `l2-classifications-table.tsx` + `l3-override-form.tsx` (multi-line textarea, ≥15-char floor — intentionally stricter than caltrans's non-empty rule). Old `criteria-table.tsx` is dead code.
2. ~~**Level 2 is an unstyled `<ul>`**~~ — resolved; `l2-classifications-table.tsx` is a styled 4-column table.
3. ~~**Level 3 disappears after override submit**~~ — not a bug; caltrans does the same (only the markdown report is shown after finalize).
4. ~~**No per-level Back / Approve & Continue navigation**~~ — resolved by `cucp-stepper.tsx` (L1 → L2 → L3 → Done with explicit per-level buttons).
5. ~~**`request_info=Yes` has no UI surface**~~ — resolved; `RequestInfoBanner` displays the legal "pending additional information" string when any criterion has `request_info=Yes`.
6. ~~**"Apply Override" doesn't re-run the level**~~ — resolved 2026-05-09. Per-project precedents store at `data/cucp-precedents/<projectId>.json`, repeatable per-(runId, level) rendezvous, L2/L3 evaluate-pause loops, three new API routes (`/level/[n]/override`, `/level/[n]/approve`, `/finalize`), per-step counter chip, admin page at `/work/admin/precedents/[projectId]`. See `docs/superpowers/specs/2026-05-09-cucp-precedents-and-reeval-design.md` and `docs/superpowers/plans/2026-05-09-cucp-precedents-and-reeval.md`. Cloud Run still uses ephemeral local-disk storage — GCS/Firestore migration tracked separately (spec §10.2).
7. ~~**AI reasoning truncated at 160 chars in CUCP HITL panel**~~ — could not reproduce; CUCP L2/L3 tables render reasoning in full with `max-w-* break-words`. CMGC `score-table.tsx` truncates `source_reasoning` at 200 chars but no equivalent in CUCP.
8. ~~**CMGC `AI Rating` / `Effective` columns render empty**~~ — fixed in two places: `score-table.tsx` switched from `??` to `||` so empty-string ratings now display `—` (previously `?? "—"` only fired on null/undefined); `compose-result.ts` validates `selected_rating` ∈ {"A","B","C","",null,undefined} — empty is *legitimate* when narrative lacks evidence (paired with `missing_info: true`); only out-of-domain values like `"D"` or `2` are rejected as `kind: "debug"`.
9. ~~**Override store drops the `reason`**~~ — store always persisted reason; the only writer that passed empty was a dead inline-select path in `score-table.tsx`. Removed in this sweep — `HiflWizard` → `OverrideCard` is now the single write path with mandatory ≥15-char reason. `viewMode` prop on `ScoreTable` removed.
10. ~~**Untinted `r.status` column**~~ — fixed; Status `<td>` in `results-table.tsx` now applies `STATUS_TONE[status].cell` to match the Score column.
11. ~~**`max-w-md` without `break-words`**~~ — fixed in `findings-table.tsx` Rule + Evidence cells.
12. ~~**Tabs default to "Executive Summary"**~~ — fixed; `result-tabs.tsx` defaults to "Detailed Findings" when any row has Fail status / score < 3.

### Infra

13. **Plaintext API keys in revision metadata** — switch back to Secret Manager via `scripts/deploy-cloud-run.sh` once the one-time SA setup runs.

### Deferred features (spec exists, work not yet done)

14. **Rubric Edit + auto-apply (v2)** — spec at `docs/superpowers/specs/2026-05-09-rubric-preview-design.md` §10. Requires refactoring CMGC `system-prompt.ts` and the two CUCP prompt builders to take `rubric` as a parameter (per-run), plus a `data/rubrics/<usecase>/<projectId>.json` write layer mirroring the existing `data/cucp-precedents/` pattern. Edits to the new structured `lib/usecases/cucp-reevals/rubric.ts` would propagate live.
15. **PDF rubric ingest (v3)** — same spec, same section. `pdfjs-dist` + `pdf-lib` are already installed. v1 explicitly does not handle "rubric in arbitrary PDF" upload.

## Files to know about

| Path | What |
|---|---|
| `lib/usecases/registry.ts` | Three use-case registrations |
| `components/work/use-case-tone.ts` | Per-usecase color registry (CMGC indigo, CUCP blue, ROW green) — independent of theme primary |
| `components/work/row/status-tone.ts` | Caltrans-palette `STATUS_TONE` + `statusFromScore` |
| `components/work/row/result-tabs.tsx` | ROW result tabs (caltrans-style Exec / Detailed / Action Items) |
| `components/work/cucp/criteria-table.tsx` | CUCP HITL override panel |
| `components/work/rubric/` | Read-only Preview Rubric views — `rubric-view.tsx` dispatcher + cmgc/cucp/row sibling renderers |
| `lib/usecases/cucp-reevals/rubric.ts` | Structured CUCP L2 categories + L3 criteria for UI consumption (parallel to the prompt strings; drift-guard at `rubric.test.ts`) |
| `app/work/review/[usecase]/rubric/page.tsx` | Server route for the rubric preview |
| `components/brand/app-logo.tsx` | "LLM at Scale.AI" logo (Next/Image wrapper, replaces deleted `ca-seal.tsx`) — asset at `public/llm-at-scale-logo.png` |
| `components/login/capability-pill.tsx` | Static capability pill primitive used on the login left panel |
| `app/globals.css` | Warm "Claude-like" theme tokens — terracotta `--primary`, cream `--background`, Fraunces `--font-display` |
| `lib/runs/needs-input-rendezvous.ts` | Promise-based pipeline pause for HITL |
| `lib/runs/level-rendezvous.ts` | Per-level rendezvous (L2/L3 evaluate-pause loops) |
| `scripts/deploy-cloud-run.sh` | Production deploy (Secret Manager based; needs one-time setup) |
| `docs/DEPLOY.md` | Runbook for first-deploy, rollback, smoke |
| `docs/superpowers/plans/` | Implementation plans (gitignored) |
| `docs/superpowers/specs/` | Design specs (gitignored) |
