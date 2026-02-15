#!/bin/sh
# ---------------------------------------------------------------------------
# entrypoint-wrapper.sh
#
# This script runs BEFORE the Node.js server starts in ECS Fargate.
# DATABASE_URL is injected directly from Secrets Manager (Supabase URL).
# ---------------------------------------------------------------------------

set -e

# Compose CLIENT_URL from CloudFront domain if not set
if [ -z "$CLIENT_URL" ] && [ -n "$CLOUDFRONT_DOMAIN" ]; then
  export CLIENT_URL="https://${CLOUDFRONT_DOMAIN}"
  echo "[entrypoint] CLIENT_URL set to ${CLIENT_URL}"
fi

# Run Prisma migrations (optional — controlled by RUN_MIGRATIONS env var)
if [ "${RUN_MIGRATIONS}" = "true" ]; then
  echo "[entrypoint] Running Prisma migrations against Supabase..."
  npx prisma migrate deploy
  echo "[entrypoint] Migrations complete"
fi

# Start the application
echo "[entrypoint] Starting Node.js server..."
exec node dist/index.js
