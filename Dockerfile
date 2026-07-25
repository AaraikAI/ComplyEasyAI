# =============================================================================
# ComplyEasyAI — Multi-stage Production Dockerfile
# =============================================================================
# Targets:
#   backend-production  — Node.js API server (default)
#   frontend-production — Nginx serving static frontend + API reverse proxy
#   development         — Full dev environment with hot-reload
#
# Build examples:
#   docker build --target backend-production  -t complyeasy-api .
#   docker build --target frontend-production -t complyeasy-web .
#   docker build --target development         -t complyeasy-dev .
# =============================================================================

# ---------------------------------------------------------------------------
# Stage 1: Base — shared Node.js layer
# ---------------------------------------------------------------------------
FROM node:22-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl

# ---------------------------------------------------------------------------
# Stage 2: Install frontend dependencies
# ---------------------------------------------------------------------------
FROM base AS frontend-deps
COPY package.json package-lock.json ./
# Puppeteer's bundled Chromium is a glibc build that cannot run on alpine/musl,
# so skip the download here; the prerender step uses the system chromium package
# installed in the frontend-build stage instead.
ENV PUPPETEER_SKIP_DOWNLOAD=true
RUN npm ci

# ---------------------------------------------------------------------------
# Stage 3: Install backend dependencies
# ---------------------------------------------------------------------------
FROM base AS backend-deps
WORKDIR /app/server
COPY server/package.json server/package-lock.json ./
# Copy files needed by postinstall (prisma generate + patch-express-types) BEFORE npm ci
COPY server/prisma ./prisma
COPY server/scripts ./scripts
RUN npm ci

# ---------------------------------------------------------------------------
# Stage 4: Build frontend (Vite → static assets)
# ---------------------------------------------------------------------------
FROM base AS frontend-build
# The build runs scripts/prerender.mjs, which drives a headless browser over each
# public route to capture prerendered HTML for SEO. Install the system Chromium
# (puppeteer's bundled glibc build won't run on alpine/musl) plus the fonts/libs
# it needs, and point puppeteer at it.
RUN apk add --no-cache chromium nss freetype harfbuzz ca-certificates ttf-freefont
ENV PUPPETEER_SKIP_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
COPY --from=frontend-deps /app/node_modules ./node_modules
COPY package.json package-lock.json tsconfig.json vite.config.ts index.html ./
COPY App.tsx App.test.tsx index.tsx types.ts constants.ts setupTests.ts ./
COPY components/ ./components/
COPY contexts/ ./contexts/
COPY constants/ ./constants/
COPY services/ ./services/
COPY hooks/ ./hooks/
COPY styles/ ./styles/
COPY routes/ ./routes/
COPY i18n/ ./i18n/
COPY public/ ./public/
COPY utils/ ./utils/
COPY data/ ./data/
COPY scripts/ ./scripts/
RUN npm run build

# ---------------------------------------------------------------------------
# Stage 5: Build backend (TypeScript → JavaScript)
# ---------------------------------------------------------------------------
FROM base AS backend-build
WORKDIR /app/server
COPY --from=backend-deps /app/server/node_modules ./node_modules
COPY server/ ./
# Re-run the TFJS type augmentation patch now that src/ is present (the
# initial `npm ci` in the deps stage couldn't run it because src/types/
# didn't exist there). Then regenerate Prisma client (COPY server/ may
# overwrite generated/ dir) and build.
RUN node scripts/patch-tfjs-types.js
RUN npx prisma generate
# Capture tsc output so CI annotations surface the actual error (annotations are
# limited to the last ~400 chars of output, so we tail tsc's emit to that tail).
RUN set -o pipefail; npm run build 2>&1 | tee /tmp/tsc-build.log; ec=$?; \
    if [ $ec -ne 0 ]; then \
      echo "===== TSC BUILD FAILED (exit $ec) — tail of output: ====="; \
      tail -c 3500 /tmp/tsc-build.log; \
      echo "===== END TSC BUILD OUTPUT ====="; \
    fi; \
    exit $ec

# ---------------------------------------------------------------------------
# Stage 6 (default): Production backend image
# ---------------------------------------------------------------------------
FROM base AS backend-production

RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 complyeasy

WORKDIR /app/server

# Install only production dependencies
COPY server/package.json server/package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts
COPY server/prisma ./prisma
RUN npx prisma generate

# Security: patch npm's bundled tar (CVE-2026-59873 — node-tar gzip-bomb DoS).
# node:22-alpine ships npm 10.9.8 whose bundled tar is 7.5.11 (vulnerable);
# npm 12.0.1 bundles tar 7.5.19, which fixes it. Runs after `npm ci` so the
# dependency install keeps using the base npm, and this global npm is never
# invoked at runtime (the app runs `node dist/index.js`) — it solely clears the
# Trivy container image scan. Pinned for reproducible builds.
RUN npm install -g npm@12.0.1

# Copy compiled backend code
COPY --from=backend-build /app/server/dist ./dist

# FIPS 140-3 (SP 800-140D): Compute software integrity manifest over crypto module files
# Requires FIPS_INTEGRITY_KEY to be set as a build arg (skips if not set)
ARG FIPS_INTEGRITY_KEY=""
RUN if [ -n "$FIPS_INTEGRITY_KEY" ]; then \
      FIPS_INTEGRITY_KEY="$FIPS_INTEGRITY_KEY" node -e "require('./dist/utils/fipsIntegrityCheck').computeAndSaveIntegrity('./dist')"; \
    fi

# Copy runtime data files (framework templates, control definitions)
COPY --from=backend-build /app/server/src/data ./dist/data

# Real zk-SNARK circuit artifacts (regenerated in CI before this build) so the
# runtime can generate/verify real Groth16 proofs. Paths match
# zeroKnowledgeService.ts (dist/zkp/{compiled,keys}). These are COPY'd from the
# build context, not a build stage: the CI "Generate ZK proving keys" step writes
# them into server/src/zkp/ before `docker build`. A local `docker build` must
# first run `server/src/zkp/setup-circuits.sh`, or these COPYs will fail.
COPY server/src/zkp/compiled ./dist/zkp/compiled
COPY server/src/zkp/keys ./dist/zkp/keys

# Copy frontend build so Express can serve it (optional — when NOT using Nginx)
COPY --from=frontend-build /app/dist ./public

# Copy entrypoint wrapper that composes DATABASE_URL from ECS secret fields
COPY infrastructure/lib/entrypoint-wrapper.sh /app/server/entrypoint.sh
RUN chmod +x /app/server/entrypoint.sh

USER complyeasy

ENV NODE_ENV=production
ENV PORT=3001
# FIPS 140-3 (ISO 19790): Enable OpenSSL FIPS mode in Node.js when ENABLE_FIPS=1.
# Only activate when the base image includes a FIPS-certified OpenSSL module.
# Alpine's default OpenSSL is NOT FIPS-certified — set ENABLE_FIPS only on
# FIPS-capable images (e.g., UBI, RHEL-based) to avoid container startup crash.
ENV NODE_OPTIONS="${ENABLE_FIPS:+--force-fips}"

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:3001/health || exit 1

CMD ["/app/server/entrypoint.sh"]

# ---------------------------------------------------------------------------
# Stage 7: Production frontend via Nginx
# ---------------------------------------------------------------------------
FROM nginx:1.31-alpine AS frontend-production

RUN rm /etc/nginx/conf.d/default.conf

COPY nginx/nginx.conf  /etc/nginx/nginx.conf
COPY nginx/default.conf /etc/nginx/conf.d/default.conf

COPY --from=frontend-build /app/dist /usr/share/nginx/html

# Allow non-root Nginx to write to cache/log dirs
RUN chown -R nginx:nginx /usr/share/nginx/html \
 && chown -R nginx:nginx /var/cache/nginx \
 && chown -R nginx:nginx /var/log/nginx \
 && touch /var/run/nginx.pid \
 && chown -R nginx:nginx /var/run/nginx.pid

USER nginx

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]

# ---------------------------------------------------------------------------
# Stage 8: Development (hot-reload for both frontend & backend)
# ---------------------------------------------------------------------------
FROM base AS development

COPY package.json package-lock.json ./
RUN npm install

COPY server/package.json server/package-lock.json ./server/
WORKDIR /app/server
RUN npm install

COPY server/prisma ./prisma
RUN npx prisma generate

WORKDIR /app
COPY . .

ENV NODE_ENV=development

EXPOSE 3000 3001

CMD ["npm", "run", "dev"]
