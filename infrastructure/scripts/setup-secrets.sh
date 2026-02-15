#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# setup-secrets.sh — Interactive helper to populate AWS Secrets Manager
#
# Stores the Supabase DATABASE_URL and all application API keys.
#
# Usage:
#   ./infrastructure/scripts/setup-secrets.sh
# ---------------------------------------------------------------------------

set -euo pipefail

AWS_REGION="${AWS_REGION:-us-east-1}"
ENV_NAME="${ENV_NAME:-production}"
PREFIX="complyeasy-${ENV_NAME}"

echo "============================================"
echo " ComplyEasyAI — Secrets Setup"
echo " Environment: $ENV_NAME | Region: $AWS_REGION"
echo " Database:    Supabase (external)"
echo "============================================"
echo ""

# Verify AWS credentials
aws sts get-caller-identity > /dev/null 2>&1 || { echo "ERROR: AWS credentials not configured."; exit 1; }

# Find the app secret ARN
APP_SECRET_ARN=$(aws secretsmanager list-secrets \
  --filter Key=name,Values="${PREFIX}/app-secrets" \
  --query 'SecretList[0].ARN' --output text --region "$AWS_REGION")

if [ "$APP_SECRET_ARN" = "None" ] || [ -z "$APP_SECRET_ARN" ]; then
  echo "ERROR: App secret '${PREFIX}/app-secrets' not found."
  echo "Deploy infrastructure first: ./infrastructure/scripts/deploy.sh infra"
  exit 1
fi

echo "Secret ARN: $APP_SECRET_ARN"
echo ""

# Generate secure defaults
JWT_SECRET_DEFAULT=$(openssl rand -base64 32 2>/dev/null || echo "CHANGE_ME")
JWT_REFRESH_DEFAULT=$(openssl rand -base64 32 2>/dev/null || echo "CHANGE_ME")
ENCRYPTION_KEY_DEFAULT=$(openssl rand -hex 32 2>/dev/null || echo "CHANGE_ME")

# Prompt for Supabase DATABASE_URL
echo "--- Supabase Database ---"
echo "Get your connection string from: Supabase Dashboard > Settings > Database > Connection string (URI)"
echo "Format: postgresql://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres?pgbouncer=true"
echo ""
read -rp "DATABASE_URL: " DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL is required."
  exit 1
fi

echo ""
echo "--- Authentication ---"
read -rp "JWT_SECRET [$JWT_SECRET_DEFAULT]: " JWT_SECRET
JWT_SECRET="${JWT_SECRET:-$JWT_SECRET_DEFAULT}"

read -rp "JWT_REFRESH_SECRET [$JWT_REFRESH_DEFAULT]: " JWT_REFRESH_SECRET
JWT_REFRESH_SECRET="${JWT_REFRESH_SECRET:-$JWT_REFRESH_DEFAULT}"

read -rp "ENCRYPTION_KEY [$ENCRYPTION_KEY_DEFAULT]: " ENCRYPTION_KEY
ENCRYPTION_KEY="${ENCRYPTION_KEY:-$ENCRYPTION_KEY_DEFAULT}"

echo ""
echo "--- API Keys ---"
read -rp "GEMINI_API_KEY: " GEMINI_API_KEY
read -rp "SENDGRID_API_KEY: " SENDGRID_API_KEY
read -rp "SENDGRID_FROM_EMAIL [noreply@complyeasyai.com]: " SENDGRID_FROM_EMAIL
SENDGRID_FROM_EMAIL="${SENDGRID_FROM_EMAIL:-noreply@complyeasyai.com}"

read -rp "STRIPE_SECRET_KEY: " STRIPE_SECRET_KEY
read -rp "STRIPE_WEBHOOK_SECRET: " STRIPE_WEBHOOK_SECRET

echo ""
echo "Writing secrets to AWS Secrets Manager..."

aws secretsmanager put-secret-value \
  --secret-id "$APP_SECRET_ARN" \
  --secret-string "$(cat <<EOF
{
  "DATABASE_URL": "${DATABASE_URL}",
  "JWT_SECRET": "${JWT_SECRET}",
  "JWT_REFRESH_SECRET": "${JWT_REFRESH_SECRET}",
  "ENCRYPTION_KEY": "${ENCRYPTION_KEY}",
  "GEMINI_API_KEY": "${GEMINI_API_KEY}",
  "SENDGRID_API_KEY": "${SENDGRID_API_KEY}",
  "SENDGRID_FROM_EMAIL": "${SENDGRID_FROM_EMAIL}",
  "STRIPE_SECRET_KEY": "${STRIPE_SECRET_KEY}",
  "STRIPE_WEBHOOK_SECRET": "${STRIPE_WEBHOOK_SECRET}"
}
EOF
)" \
  --region "$AWS_REGION"

echo ""
echo "Secrets populated successfully!"
echo ""
echo "Next steps:"
echo "  1. Build and push Docker image:  ./infrastructure/scripts/deploy.sh build"
echo "  2. Run database migrations:      ./infrastructure/scripts/deploy.sh migrate"
echo "  3. Deploy frontend:              ./infrastructure/scripts/deploy.sh frontend"
