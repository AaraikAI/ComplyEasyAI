#!/usr/bin/env bash
# Preflight check for `docker compose -f docker-compose.prod.yml up`.
#
# The prod nginx service bind-mounts two host paths that are NOT in the repo:
#   - ./dist                      (built SPA webroot; gitignored build artifact)
#   - ./nginx/ssl/{cert,key}.pem  (TLS material; provisioned out-of-band)
#
# Without them nginx serves an empty webroot (404s) and `nginx -t` fails to load
# the certs. This script fails closed so a misconfigured deploy errors loudly
# instead of starting a broken stack.
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_root"

fail=0

if [ ! -d ./dist ] || [ -z "$(ls -A ./dist 2>/dev/null)" ]; then
  echo "ERROR: ./dist is missing or empty. Run 'npm run build' before starting the prod stack." >&2
  fail=1
fi

for f in cert.pem key.pem; do
  if [ ! -f "./nginx/ssl/$f" ]; then
    echo "ERROR: ./nginx/ssl/$f is missing. Provision TLS material before starting the prod stack." >&2
    fail=1
  fi
done

if [ "$fail" -ne 0 ]; then
  echo "Preflight failed. See errors above." >&2
  exit 1
fi

echo "Preflight OK: ./dist populated and ./nginx/ssl/{cert,key}.pem present."
