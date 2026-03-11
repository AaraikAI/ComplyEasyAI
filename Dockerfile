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
FROM node:25-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl

# ---------------------------------------------------------------------------
# Stage 2: Install frontend dependencies
# ---------------------------------------------------------------------------
FROM base AS frontend-deps
COPY package.json package-lock.json ./
RUN npm ci

# ---------------------------------------------------------------------------
# Stage 3: Install backend dependencies
# ---------------------------------------------------------------------------
FROM base AS backend-deps
WORKDIR /app/server
COPY server/package.json server/package-lock.json ./
RUN npm ci
COPY server/prisma ./prisma
RUN npx prisma generate

# ---------------------------------------------------------------------------
# Stage 4: Build frontend (Vite → static assets)
# ---------------------------------------------------------------------------
FROM base AS frontend-build
COPY --from=frontend-deps /app/node_modules ./node_modules
COPY package.json package-lock.json tsconfig.json vite.config.ts index.html ./
COPY App.tsx App.test.tsx index.tsx types.ts constants.ts setupTests.ts ./
COPY components/ ./components/
COPY contexts/ ./contexts/
COPY constants/ ./constants/
COPY services/ ./services/
COPY hooks/ ./hooks/
RUN npm run build

# ---------------------------------------------------------------------------
# Stage 5: Build backend (TypeScript → JavaScript)
# ---------------------------------------------------------------------------
FROM base AS backend-build
WORKDIR /app/server
COPY --from=backend-deps /app/server/node_modules ./node_modules
COPY server/ ./
RUN npm run build

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

# Copy frontend build so Express can serve it (optional — when NOT using Nginx)
COPY --from=frontend-build /app/dist ./public

# Copy entrypoint wrapper that composes DATABASE_URL from ECS secret fields
COPY infrastructure/lib/entrypoint-wrapper.sh /app/server/entrypoint.sh
RUN chmod +x /app/server/entrypoint.sh

USER complyeasy

ENV NODE_ENV=production
ENV PORT=3001
# FIPS 140-3 (ISO 19790): Enable OpenSSL FIPS mode in Node.js
# Requires all crypto operations to use FIPS-approved algorithms only.
# DEPENDENCY: SHA-1 HMAC, bcrypt, and scrypt migrations must be complete
# before enabling this flag — non-FIPS algorithms will cause runtime crashes.
ENV NODE_OPTIONS="--force-fips"

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:3001/health || exit 1

CMD ["/app/server/entrypoint.sh"]

# ---------------------------------------------------------------------------
# Stage 7: Production frontend via Nginx
# ---------------------------------------------------------------------------
FROM nginx:1.29-alpine AS frontend-production

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
