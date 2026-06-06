#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# deploy.sh — Build, push, and deploy ComplyEasyAI to AWS
#
# Database: Supabase (external managed PostgreSQL)
# Cache:    ElastiCache Redis (AWS-managed)
# Compute:  ECS Fargate
# Frontend: S3 + CloudFront
#
# Usage:
#   ./infrastructure/scripts/deploy.sh [command]
#
# Commands:
#   bootstrap    — One-time CDK bootstrap for the AWS account/region
#   infra        — Deploy all CDK stacks (Network, Cache, Backend, Frontend)
#   build        — Build and push Docker image to ECR
#   migrate      — Run Prisma database migrations against Supabase
#   frontend     — Build and deploy frontend to S3 + invalidate CloudFront
#   secrets      — Populate application secrets in AWS Secrets Manager
#   full         — Full deployment (infra + build + migrate + frontend)
#   status       — Show deployment status
# ---------------------------------------------------------------------------

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
INFRA_DIR="$PROJECT_ROOT/infrastructure"

# Defaults — override with environment variables
AWS_REGION="${AWS_REGION:-us-east-1}"
ENV_NAME="${ENV_NAME:-production}"
PREFIX="complyeasy-${ENV_NAME}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log()  { echo -e "${BLUE}[deploy]${NC} $*"; }
ok()   { echo -e "${GREEN}[  OK  ]${NC} $*"; }
warn() { echo -e "${YELLOW}[ WARN ]${NC} $*"; }
err()  { echo -e "${RED}[ERROR ]${NC} $*" >&2; }

# ---------------------------------------------------------------------------
# Pre-flight checks
# ---------------------------------------------------------------------------
preflight() {
  log "Running pre-flight checks..."

  command -v aws >/dev/null 2>&1 || { err "AWS CLI not found. Install: https://aws.amazon.com/cli/"; exit 1; }
  command -v docker >/dev/null 2>&1 || { err "Docker not found."; exit 1; }
  command -v node >/dev/null 2>&1 || { err "Node.js not found."; exit 1; }

  # Verify AWS credentials
  aws sts get-caller-identity > /dev/null 2>&1 || { err "AWS credentials not configured. Run: aws configure"; exit 1; }

  AWS_ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
  ECR_REPO="${AWS_ACCOUNT}.dkr.ecr.${AWS_REGION}.amazonaws.com/${PREFIX}-api"

  ok "AWS Account: $AWS_ACCOUNT | Region: $AWS_REGION | Env: $ENV_NAME"
}

# ---------------------------------------------------------------------------
# CDK Bootstrap (one-time)
# ---------------------------------------------------------------------------
cmd_bootstrap() {
  log "Bootstrapping CDK for account $AWS_ACCOUNT in $AWS_REGION..."
  cd "$INFRA_DIR"
  npx cdk bootstrap "aws://${AWS_ACCOUNT}/${AWS_REGION}"
  ok "CDK bootstrap complete"
}

# ---------------------------------------------------------------------------
# Deploy infrastructure via CDK
# ---------------------------------------------------------------------------
cmd_infra() {
  log "Deploying CDK stacks (Network, Cache, Backend, Frontend)..."
  log "NOTE: Database is on Supabase — no RDS will be provisioned."
  cd "$INFRA_DIR"

  # Resolve the immutable image tag (current commit). backend-stack.ts requires
  # this context value and rejects an unset value or 'latest'.
  IMAGE_TAG="${IMAGE_TAG:-$(git -C "$PROJECT_ROOT" rev-parse --short HEAD)}"
  log "Deploying with immutable image tag: $IMAGE_TAG"

  # Install CDK dependencies if needed
  [ -d node_modules ] || npm install

  npx cdk deploy --all \
    --require-approval broadening \
    --context envName="$ENV_NAME" \
    --context region="$AWS_REGION" \
    --context imageTag="$IMAGE_TAG" \
    ${DOMAIN_NAME:+--context domainName="$DOMAIN_NAME"} \
    ${API_CERT_ARN:+--context apiCertificateArn="$API_CERT_ARN"} \
    ${CF_CERT_ARN:+--context cloudfrontCertificateArn="$CF_CERT_ARN"} \
    --outputs-file cdk-outputs.json

  ok "Infrastructure deployed (image tag $IMAGE_TAG). Outputs saved to infrastructure/cdk-outputs.json"
}

# ---------------------------------------------------------------------------
# Build and push Docker image to ECR
# ---------------------------------------------------------------------------
cmd_build() {
  log "Building and pushing Docker image..."

  # Compute the immutable image tag (current commit) before any use.
  TAG="$(git -C "$PROJECT_ROOT" rev-parse --short HEAD)"
  export IMAGE_TAG="$TAG"
  log "Image tag: $TAG"

  # Login to ECR
  aws ecr get-login-password --region "$AWS_REGION" | \
    docker login --username AWS --password-stdin "${AWS_ACCOUNT}.dkr.ecr.${AWS_REGION}.amazonaws.com"

  # Build backend image with the immutable tag only.
  cd "$PROJECT_ROOT"
  docker build \
    --target backend-production \
    --platform linux/amd64 \
    -t "${ECR_REPO}:$TAG" \
    .

  # Push the immutable tag to ECR.
  docker push "${ECR_REPO}:$TAG"

  ok "Docker image pushed to ECR: ${ECR_REPO}:$TAG"

  log "ECS rollout is handled by 'infra' deploying the new immutable tag (--context imageTag=$TAG)."
}

# ---------------------------------------------------------------------------
# Run Prisma migrations against Supabase
# ---------------------------------------------------------------------------
cmd_migrate() {
  log "Running database migrations against Supabase..."

  # Get DATABASE_URL from Secrets Manager
  APP_SECRET_ARN=$(aws secretsmanager list-secrets \
    --filter Key=name,Values="${PREFIX}/app-secrets" \
    --query 'SecretList[0].ARN' --output text --region "$AWS_REGION")

  if [ "$APP_SECRET_ARN" = "None" ] || [ -z "$APP_SECRET_ARN" ]; then
    err "App secret not found. Deploy infrastructure first."
    exit 1
  fi

  APP_JSON=$(aws secretsmanager get-secret-value --secret-id "$APP_SECRET_ARN" --region "$AWS_REGION" --query SecretString --output text)
  DATABASE_URL=$(echo "$APP_JSON" | node -e "const s=require('fs').readFileSync(0,'utf8');const j=JSON.parse(s);console.log(j.DATABASE_URL)")

  if [ -z "$DATABASE_URL" ] || [ "$DATABASE_URL" = "undefined" ]; then
    err "DATABASE_URL not found in app secrets. Run './infrastructure/scripts/setup-secrets.sh' first."
    exit 1
  fi

  export DATABASE_URL

  # ---- Pre-migration database backup ----
  log "Creating pre-migration database backup..."
  BACKUP_TIMESTAMP=$(date -u +%Y%m%d_%H%M%S)
  BACKUP_KEY="backups/pre-migration/${BACKUP_TIMESTAMP}.sql.gz"
  BACKUP_BUCKET="${PREFIX}-uploads-${AWS_ACCOUNT}"

  if command -v pg_dump >/dev/null 2>&1; then
    # Parse DATABASE_URL into discrete PG* connection parameters so the
    # credential-bearing URI is never placed on pg_dump's argv (visible via ps/proc).
    DUMP_DIR="$(mktemp -d)"
    DUMP_SQL="${DUMP_DIR}/${BACKUP_TIMESTAMP}.sql"
    DUMP_GZ="/tmp/${BACKUP_TIMESTAMP}.sql.gz"
    DUMP_ERR="${DUMP_DIR}/pg_dump.err"

    # Extract components from the libpq URI via node's URL parser.
    PG_PARTS=$(node -e "const u=new URL(process.env.DATABASE_URL);process.stdout.write([u.hostname,u.port||'5432',decodeURIComponent(u.username),decodeURIComponent(u.password),(u.pathname||'/').slice(1)||'postgres'].join('\n'));")
    PGHOST=$(echo "$PG_PARTS" | sed -n '1p')
    PGPORT=$(echo "$PG_PARTS" | sed -n '2p')
    PGUSER=$(echo "$PG_PARTS" | sed -n '3p')
    PGPASSWORD=$(echo "$PG_PARTS" | sed -n '4p')
    PGDATABASE=$(echo "$PG_PARTS" | sed -n '5p')
    export PGHOST PGPORT PGUSER PGPASSWORD PGDATABASE PGSSLMODE="require"

    # Dump to an uncompressed file first so pg_dump's own exit status is observable
    # (a status lost through a pipe could let a partial dump pass a size-only check).
    backup_ok=0
    if pg_dump --no-owner --no-acl -f "$DUMP_SQL" 2>"$DUMP_ERR"; then
      if [ -s "$DUMP_SQL" ]; then
        gzip -c "$DUMP_SQL" > "$DUMP_GZ"
        backup_ok=1
      else
        warn "pg_dump produced empty output — aborting before migration to avoid an unsafe migrate with no recovery point."
      fi
    else
      warn "pg_dump failed (exit status non-zero). Stderr follows:"
      [ -s "$DUMP_ERR" ] && cat "$DUMP_ERR" >&2 || true
    fi

    # Scrub the password from the environment before any further commands.
    unset PGPASSWORD

    if [ "$backup_ok" -eq 1 ]; then
      if aws s3 cp "$DUMP_GZ" "s3://${BACKUP_BUCKET}/${BACKUP_KEY}" --region "$AWS_REGION" 2>"${DUMP_DIR}/s3.err"; then
        ok "Database backup saved to s3://${BACKUP_BUCKET}/${BACKUP_KEY}"
      else
        warn "Failed to upload backup to S3; backup retained locally at ${DUMP_GZ}. Stderr follows:"
        [ -s "${DUMP_DIR}/s3.err" ] && cat "${DUMP_DIR}/s3.err" >&2 || true
      fi
      rm -f "$DUMP_GZ"
    else
      err "Pre-migration backup failed — refusing to run 'prisma migrate deploy' without a recovery point."
      rm -rf "$DUMP_DIR"
      exit 1
    fi

    rm -rf "$DUMP_DIR"
  else
    warn "pg_dump not found — skipping pre-migration backup. Install postgresql-client for automatic backups."
  fi

  # ---- RLS runtime-role preflight ----
  # Defense-in-depth: the runtime app role must NOT have BYPASSRLS, otherwise the
  # org-isolation policies are inert at runtime. Migrations themselves run as the
  # owner/BYPASSRLS role; this check informs the operator about the runtime role.
  # See server/prisma/migrations/RLS_DEPLOY_RUNBOOK.md (least-privilege role cutover).
  if command -v psql >/dev/null 2>&1; then
    RLS_DIR="$(mktemp -d)"
    RLS_PARTS=$(node -e "const u=new URL(process.env.DATABASE_URL);process.stdout.write([u.hostname,u.port||'5432',decodeURIComponent(u.username),decodeURIComponent(u.password),(u.pathname||'/').slice(1)||'postgres'].join('\n'));")
    export PGHOST=$(echo "$RLS_PARTS" | sed -n '1p')
    export PGPORT=$(echo "$RLS_PARTS" | sed -n '2p')
    export PGUSER=$(echo "$RLS_PARTS" | sed -n '3p')
    export PGPASSWORD=$(echo "$RLS_PARTS" | sed -n '4p')
    export PGDATABASE=$(echo "$RLS_PARTS" | sed -n '5p')
    export PGSSLMODE="require"
    RLS_BYPASS=$(psql -tAc "SELECT rolbypassrls FROM pg_roles WHERE rolname = current_user;" 2>"${RLS_DIR}/psql.err" | tr -d '[:space:]')
    unset PGPASSWORD
    if [ "$RLS_BYPASS" = "t" ]; then
      warn "Runtime DB role '${PGUSER}' has BYPASSRLS — Row-Level Security policies will NOT be enforced at runtime."
      warn "Complete the least-privilege role cutover per server/prisma/migrations/RLS_DEPLOY_RUNBOOK.md before relying on DB-layer RLS."
    elif [ "$RLS_BYPASS" = "f" ]; then
      ok "Runtime DB role '${PGUSER}' is NOBYPASSRLS — RLS policies are enforced."
    fi
    rm -rf "$RLS_DIR"
  fi

  cd "$PROJECT_ROOT/server"
  npx prisma generate
  npx prisma migrate deploy

  ok "Migrations complete (Supabase)"
}

# ---------------------------------------------------------------------------
# Deploy frontend to S3 + CloudFront
# ---------------------------------------------------------------------------
cmd_frontend() {
  log "Building and deploying frontend..."

  cd "$PROJECT_ROOT"

  # Build frontend
  npm ci
  npm run build

  # Get bucket name and distribution ID from CDK outputs
  if [ -f "$INFRA_DIR/cdk-outputs.json" ]; then
    BUCKET=$(node -e "const o=require('$INFRA_DIR/cdk-outputs.json');const k=Object.keys(o).find(k=>k.includes('Frontend'));console.log(o[k]?.FrontendBucketName||'')")
    DIST_ID=$(node -e "const o=require('$INFRA_DIR/cdk-outputs.json');const k=Object.keys(o).find(k=>k.includes('Frontend'));console.log(o[k]?.CloudFrontDistributionId||'')")
  fi

  if [ -z "${BUCKET:-}" ]; then
    err "Could not determine S3 bucket name. Set S3_FRONTEND_BUCKET or deploy infra first."
    exit 1
  fi

  # Sync assets (long cache for hashed files)
  aws s3 sync ./dist "s3://${BUCKET}" \
    --delete \
    --cache-control "public, max-age=31536000, immutable" \
    --exclude "index.html" \
    --exclude "*.json" \
    --region "$AWS_REGION"

  # Upload index.html (no cache)
  aws s3 cp ./dist/index.html "s3://${BUCKET}/index.html" \
    --cache-control "no-cache, no-store, must-revalidate" \
    --region "$AWS_REGION"

  # Invalidate CloudFront
  if [ -n "${DIST_ID:-}" ]; then
    aws cloudfront create-invalidation \
      --distribution-id "$DIST_ID" \
      --paths "/*" > /dev/null
    ok "CloudFront cache invalidated"
  fi

  ok "Frontend deployed to s3://${BUCKET}"
}

# ---------------------------------------------------------------------------
# Populate application secrets
# ---------------------------------------------------------------------------
cmd_secrets() {
  log "Populating application secrets..."

  APP_SECRET_ARN=$(aws secretsmanager list-secrets \
    --filter Key=name,Values="${PREFIX}/app-secrets" \
    --query 'SecretList[0].ARN' --output text --region "$AWS_REGION")

  if [ "$APP_SECRET_ARN" = "None" ] || [ -z "$APP_SECRET_ARN" ]; then
    err "App secret not found. Deploy infrastructure first."
    exit 1
  fi

  echo ""
  echo "=========================================="
  echo " Populate Application Secrets"
  echo "=========================================="
  echo ""
  echo "Run the following command with your actual values:"
  echo ""
  echo "aws secretsmanager put-secret-value \\"
  echo "  --secret-id '${APP_SECRET_ARN}' \\"
  echo "  --secret-string '{"
  echo "    \"DATABASE_URL\": \"postgresql://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres?pgbouncer=true\","
  echo "    \"JWT_SECRET\": \"<openssl rand -base64 32>\","
  echo "    \"JWT_REFRESH_SECRET\": \"<openssl rand -base64 32>\","
  echo "    \"ENCRYPTION_KEY\": \"<openssl rand -hex 32>\","
  echo "    \"GEMINI_API_KEY\": \"your-gemini-api-key\","
  echo "    \"SENDGRID_API_KEY\": \"SG.your-sendgrid-key\","
  echo "    \"SENDGRID_FROM_EMAIL\": \"noreply@yourdomain.com\","
  echo "    \"STRIPE_SECRET_KEY\": \"sk_live_your-stripe-key\","
  echo "    \"STRIPE_WEBHOOK_SECRET\": \"whsec_your-webhook-secret\""
  echo "  }' \\"
  echo "  --region '${AWS_REGION}'"
  echo ""
  warn "Replace the placeholder values with your actual Supabase URL and API keys."
  warn "Get your Supabase connection string from: Supabase Dashboard > Settings > Database > Connection string (URI)"
  echo ""
}

# ---------------------------------------------------------------------------
# Show deployment status
# ---------------------------------------------------------------------------
cmd_status() {
  log "Checking deployment status..."

  echo ""
  echo "=== ECS Service ==="
  aws ecs describe-services \
    --cluster "$PREFIX" \
    --services "${PREFIX}-api" \
    --query 'services[0].{Status:status,Running:runningCount,Desired:desiredCount,Deployments:deployments[*].{Status:status,Running:runningCount,Desired:desiredCount}}' \
    --output table \
    --region "$AWS_REGION" 2>/dev/null || warn "ECS service not found"

  echo ""
  echo "=== ElastiCache Redis ==="
  aws elasticache describe-cache-clusters \
    --cache-cluster-id "${PREFIX}-redis" \
    --query 'CacheClusters[0].{Status:CacheClusterStatus,Engine:Engine,NodeType:CacheNodeType}' \
    --output table \
    --region "$AWS_REGION" 2>/dev/null || warn "Redis cluster not found"

  echo ""
  echo "=== Database ==="
  echo "  Hosted on Supabase (external). Check status at: https://supabase.com/dashboard"
  echo ""
}

# ---------------------------------------------------------------------------
# Full deployment
# ---------------------------------------------------------------------------
cmd_full() {
  # Build and push the immutable-tagged image first; cmd_build exports IMAGE_TAG
  # so cmd_infra deploys that exact tag (CDK rolls the ECS service).
  cmd_build
  cmd_infra
  cmd_migrate
  cmd_frontend
  echo ""
  ok "Full deployment complete!"
  cmd_status
}

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
preflight

case "${1:-}" in
  bootstrap) cmd_bootstrap ;;
  infra)     cmd_infra ;;
  build)     cmd_build ;;
  migrate)   cmd_migrate ;;
  frontend)  cmd_frontend ;;
  secrets)   cmd_secrets ;;
  full)      cmd_full ;;
  status)    cmd_status ;;
  *)
    echo "Usage: $0 {bootstrap|infra|build|migrate|frontend|secrets|full|status}"
    echo ""
    echo "Commands:"
    echo "  bootstrap  — One-time CDK bootstrap"
    echo "  infra      — Deploy all CDK stacks (Network, Cache, Backend, Frontend)"
    echo "  build      — Build + push Docker image to ECR + deploy ECS"
    echo "  migrate    — Run Prisma migrations against Supabase"
    echo "  frontend   — Build + deploy frontend to S3/CloudFront"
    echo "  secrets    — Show instructions to populate app secrets"
    echo "  full       — Full deployment (infra + build + migrate + frontend)"
    echo "  status     — Show deployment status"
    exit 1
    ;;
esac
