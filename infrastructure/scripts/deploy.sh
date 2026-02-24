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

  # Install CDK dependencies if needed
  [ -d node_modules ] || npm install

  npx cdk deploy --all \
    --require-approval broadening \
    --context envName="$ENV_NAME" \
    --context region="$AWS_REGION" \
    ${DOMAIN_NAME:+--context domainName="$DOMAIN_NAME"} \
    ${API_CERT_ARN:+--context apiCertificateArn="$API_CERT_ARN"} \
    ${CF_CERT_ARN:+--context cloudfrontCertificateArn="$CF_CERT_ARN"} \
    --outputs-file cdk-outputs.json

  ok "Infrastructure deployed. Outputs saved to infrastructure/cdk-outputs.json"
}

# ---------------------------------------------------------------------------
# Build and push Docker image to ECR
# ---------------------------------------------------------------------------
cmd_build() {
  log "Building and pushing Docker image..."

  # Login to ECR
  aws ecr get-login-password --region "$AWS_REGION" | \
    docker login --username AWS --password-stdin "${AWS_ACCOUNT}.dkr.ecr.${AWS_REGION}.amazonaws.com"

  # Build backend image
  cd "$PROJECT_ROOT"
  docker build \
    --target backend-production \
    --platform linux/amd64 \
    -t "${ECR_REPO}:latest" \
    -t "${ECR_REPO}:$(git rev-parse --short HEAD)" \
    .

  # Push to ECR
  docker push "${ECR_REPO}:latest"
  docker push "${ECR_REPO}:$(git rev-parse --short HEAD)"

  ok "Docker image pushed to ECR: ${ECR_REPO}:latest"

  # Force new ECS deployment
  log "Triggering ECS deployment..."
  aws ecs update-service \
    --cluster "$PREFIX" \
    --service "${PREFIX}-api" \
    --force-new-deployment \
    --region "$AWS_REGION" > /dev/null

  ok "ECS deployment triggered"
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
    pg_dump "$DATABASE_URL" --no-owner --no-acl 2>/dev/null | gzip > "/tmp/${BACKUP_TIMESTAMP}.sql.gz"
    if [ -s "/tmp/${BACKUP_TIMESTAMP}.sql.gz" ]; then
      aws s3 cp "/tmp/${BACKUP_TIMESTAMP}.sql.gz" "s3://${BACKUP_BUCKET}/${BACKUP_KEY}" --region "$AWS_REGION" 2>/dev/null && \
        ok "Database backup saved to s3://${BACKUP_BUCKET}/${BACKUP_KEY}" || \
        warn "Failed to upload backup to S3; backup saved locally at /tmp/${BACKUP_TIMESTAMP}.sql.gz"
      rm -f "/tmp/${BACKUP_TIMESTAMP}.sql.gz"
    else
      warn "pg_dump produced empty output — skipping backup upload"
    fi
  else
    warn "pg_dump not found — skipping pre-migration backup. Install postgresql-client for automatic backups."
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
  cmd_infra
  cmd_build
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
