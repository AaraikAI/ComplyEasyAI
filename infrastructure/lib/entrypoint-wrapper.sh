#!/bin/sh
# ---------------------------------------------------------------------------
# entrypoint-wrapper.sh
#
# This script runs BEFORE the Node.js server starts in ECS Fargate.
# It composes the DATABASE_URL from individual secret fields injected by
# ECS task definition secrets (DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_NAME).
# ---------------------------------------------------------------------------

set -e

# Compose DATABASE_URL from individual fields if not already set
if [ -z "$DATABASE_URL" ] && [ -n "$DB_HOST" ]; then
  export DATABASE_URL="postgresql://${DB_USERNAME}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}?schema=public"
  echo "[entrypoint] DATABASE_URL composed from secret fields"
fi

# Compose CLIENT_URL from CloudFront domain if not set
if [ -z "$CLIENT_URL" ] && [ -n "$CLOUDFRONT_DOMAIN" ]; then
  export CLIENT_URL="https://${CLOUDFRONT_DOMAIN}"
  echo "[entrypoint] CLIENT_URL set to ${CLIENT_URL}"
fi

# Run Prisma migrations (optional — controlled by RUN_MIGRATIONS env var)
if [ "${RUN_MIGRATIONS}" = "true" ]; then
  echo "[entrypoint] Running Prisma migrations..."
  npx prisma migrate deploy
  echo "[entrypoint] Migrations complete"
fi

# Start the application
echo "[entrypoint] Starting Node.js server..."
exec node dist/index.js
