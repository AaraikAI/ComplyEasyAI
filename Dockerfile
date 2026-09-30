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
# Node 24 is the Active LTS line. Keep this major in step with NODE_VERSION in
# .github/workflows/ci.yml and "engines" in package.json / server/package.json.
# `apk upgrade` applies Alpine security fixes published after the node image
# was built, so an OS-package CVE fixed upstream does not wait for the next
# node image refresh.
FROM node:24-alpine AS base
WORKDIR /app
RUN apk upgrade --no-cache \
 && apk add --no-cache libc6-compat openssl

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
# Stage 6: Production backend dependencies
# ---------------------------------------------------------------------------
# Resolved in a stage of its own so the runtime image receives node_modules
# without the npm CLI that installed them (see backend-production below).
FROM base AS backend-prod-deps
WORKDIR /app/server

# Install only production dependencies
COPY server/package.json server/package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts

# `--ignore-scripts` above is a supply-chain control, but it also skips the
# install script that produces re2's native binding, and zeroTrustService
# imports re2 at module load — so without this the container throws
# "Cannot find module .../re2.node" before the server ever listens. Rebuild only
# this one vetted package, with the toolchain added and removed in the same
# layer.
#
# `npm rebuild re2` has TWO paths and both must work. re2's npm tarball carries
# no binding (its `files` list has no build/), so the install script first tries
# to download a prebuilt from the project's GitHub releases — normally
# linux-musl-x64-<abi>.br, which does exist for this version — and only compiles
# locally when that download fails. That fallback is not optional: a single blip
# against the GitHub release CDN drops every image build into it (run
# 31634528095). Compiling needs `linux-headers`, because re2 vendors abseil,
# whose direct_mmap.h includes <linux/unistd.h>; musl does not provide it and
# python3/make/g++ alone leave the build dying on
# "fatal error: linux/unistd.h: No such file or directory".
RUN apk add --no-cache --virtual .native-build-deps python3 make g++ linux-headers \
 && npm rebuild re2 \
 && node -e "new (require('re2'))('^ok')" \
 && apk del .native-build-deps

# The Prisma CLI is in the production tree as the peer dependency of
# @prisma/client, so the locked local binary is called directly. `npx` would
# silently download an unpinned CLI from the registry if it were ever missing.
COPY server/prisma ./prisma
RUN ./node_modules/.bin/prisma generate

# ---------------------------------------------------------------------------
# Stage 7 (default): Production backend image
# ---------------------------------------------------------------------------
FROM base AS backend-production

# The container runs `node dist/index.js` (via entrypoint.sh) and never calls a
# package manager, so npm, npx, corepack and yarn are removed. Each carries its
# own bundled dependency tree (tar, undici, brace-expansion, ip-address, ...)
# that the image scan reports as CVEs while serving no purpose at runtime. The
# loop fails the build if any of them is still on PATH.
RUN rm -rf /usr/local/lib/node_modules/npm /usr/local/lib/node_modules/corepack \
      /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack \
      /usr/local/bin/yarn /usr/local/bin/yarnpkg /opt/yarn-v* \
 && for tool in npm npx corepack yarn yarnpkg; do \
      if command -v "$tool" >/dev/null 2>&1; then echo "$tool is still present" >&2; exit 1; fi; \
    done \
 && addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 complyeasy

WORKDIR /app/server

# package.json, package-lock.json, node_modules (with the rebuilt re2 binding)
# and the generated Prisma client from the stage above.
COPY --from=backend-prod-deps /app/server ./

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
# them into server/src/zkp/ before `docker build`. The wasm and verification keys
# are committed, so the COPYs also succeed without that step (the PR build relies
# on this), but the image then has no proving keys: run
# `server/src/zkp/setup-circuits.sh` first for an image that can generate proofs.
COPY server/src/zkp/compiled ./dist/zkp/compiled
COPY server/src/zkp/keys ./dist/zkp/keys

# Copy frontend build so Express can serve it (optional — when NOT using Nginx)
COPY --from=frontend-build /app/dist ./public

# Copy the entrypoint wrapper. DATABASE_URL is injected directly by ECS from
# Secrets Manager; the wrapper only derives CLIENT_URL from CLOUDFRONT_DOMAIN
# when unset, optionally runs migrations under RUN_MIGRATIONS, then execs node.
COPY infrastructure/lib/entrypoint-wrapper.sh /app/server/entrypoint.sh
RUN chmod +x /app/server/entrypoint.sh

# Runtime-writable directories, handed to the user the process actually runs as.
# Every COPY above lands root-owned and /app/server is mode 755, so a non-root
# mkdir throws EACCES. Several services create these paths at module load
# (zeroKnowledgeService, complianceAsCodeService), which means that EACCES kills
# the container during import — ECS reports only "Essential container in task
# exited" with no application log to explain it.
RUN mkdir -p logs dist/policies dist/zkp/circuits dist/zkp/proofs \
 && chown -R complyeasy:nodejs logs dist/policies dist/zkp

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
# Stage 8: Production frontend via Nginx
# ---------------------------------------------------------------------------
FROM nginx:1.31-alpine AS frontend-production

# `apk upgrade` applies Alpine security fixes published after the nginx image
# was built (the image scan reported util-linux/libuuid 2.42.1-r0; Alpine 3.24
# ships the fixed 2.42.3-r1). nginx and its modules come from nginx.org and are
# version-pinned in the image's apk world file, so the upgrade leaves them as is.
RUN apk upgrade --no-cache \
 && rm /etc/nginx/conf.d/default.conf

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
# Stage 9: Development (hot-reload for both frontend & backend)
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
