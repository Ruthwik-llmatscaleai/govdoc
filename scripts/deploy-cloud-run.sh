#!/usr/bin/env bash
# Deploy GovDoc to Cloud Run.
# Usage: scripts/deploy-cloud-run.sh [--dry-run] [--help]
set -euo pipefail

PROJECT="genai-poc-424806"
REGION="us-central1"
SERVICE="govdoc"
SA="govdoc-runtime@${PROJECT}.iam.gserviceaccount.com"

DRY_RUN=0
for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=1 ;;
    --help|-h)
      cat <<EOF
Usage: scripts/deploy-cloud-run.sh [--dry-run] [--help]

Deploys the govdoc Next.js service to Cloud Run.

Flags:
  --dry-run   Print the gcloud command without executing it.
  --help      Show this message.

Required env vars (read from Secret Manager at runtime, not by this script):
  OPENAI_API_KEY ANTHROPIC_API_KEY GROQ_API_KEY
  GOVDOC_DEV_USER GOVDOC_DEV_PASS GOVDOC_SESSION_SECRET

See docs/DEPLOY.md for first-time setup (service account + secret creation).
EOF
      exit 0
      ;;
    *) echo "Unknown arg: $arg (try --help)" >&2; exit 2 ;;
  esac
done

GIT_COMMIT="$(git rev-parse --short HEAD 2>/dev/null || echo unknown)"

CMD=(
  gcloud run deploy "$SERVICE"
  --source .
  --region="$REGION"
  --project="$PROJECT"
  --no-cpu-throttling
  --cpu-boost
  --memory=2Gi
  --timeout=900s
  --concurrency=10
  --max-instances=5
  --service-account="$SA"
  --update-secrets=OPENAI_API_KEY=govdoc-openai:latest,ANTHROPIC_API_KEY=govdoc-anthropic:latest,GROQ_API_KEY=govdoc-groq:latest,GOVDOC_DEV_USER=govdoc-dev-user:latest,GOVDOC_DEV_PASS=govdoc-dev-pass:latest,GOVDOC_SESSION_SECRET=govdoc-session-secret:latest
  --set-env-vars=NODE_ENV=production,NEXT_TELEMETRY_DISABLED=1,LOG_LEVEL=info,GIT_COMMIT="$GIT_COMMIT"
)

if [[ "$DRY_RUN" -eq 1 ]]; then
  printf '%s\n' "${CMD[*]}"
  exit 0
fi

"${CMD[@]}"
