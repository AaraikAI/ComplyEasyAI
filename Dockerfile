# ============================================
# ComplyEasy AI - Multi-stage Docker Build
# ============================================

# ============================================
# Stage 1: Base
# ============================================
FROM node:20-alpine AS base
WORKDIR /app

# Install dependencies for native modules
RUN apk add --no-cache libc6-compat openssl

# ============================================
# Stage 2: Dependencies
# ============================================
FROM base AS deps

# Copy package files
COPY package*.json ./
COPY server/package*.json ./server/

# Install root dependencies (for frontend build)
RUN npm ci --only=production

# Install server dependencies
WORKDIR /app/server
RUN npm ci

# ============================================
# Stage 3: Build Frontend
# ============================================
FROM base AS frontend-builder

COPY --from=deps /app/node_modules ./node_modules
COPY package*.json ./
COPY tsconfig.json ./
COPY vite.config.ts ./
COPY index.html ./
COPY App.tsx ./
COPY index.tsx ./
COPY types.ts ./
COPY constants.ts ./
COPY components ./components
COPY services ./services
COPY contexts ./contexts

# Build frontend
RUN npm run build

# ============================================
# Stage 4: Build Backend
# ============================================
FROM base AS backend-builder

COPY --from=deps /app/server/node_modules ./server/node_modules
COPY server/package*.json ./server/
COPY server/tsconfig.json ./server/
COPY server/prisma ./server/prisma
COPY server/src ./server/src

WORKDIR /app/server

# Generate Prisma client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# ============================================
# Stage 5: Production
# ============================================
FROM base AS production

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 complyeasy

# Set environment
ENV NODE_ENV=production
ENV PORT=5000

WORKDIR /app

# Copy server production files
COPY --from=backend-builder --chown=complyeasy:nodejs /app/server/dist ./server/dist
COPY --from=backend-builder --chown=complyeasy:nodejs /app/server/node_modules ./server/node_modules
COPY --from=backend-builder --chown=complyeasy:nodejs /app/server/prisma ./server/prisma
COPY --from=backend-builder --chown=complyeasy:nodejs /app/server/package.json ./server/package.json

# Copy frontend build
COPY --from=frontend-builder --chown=complyeasy:nodejs /app/dist ./dist

# Switch to non-root user
USER complyeasy

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/health || exit 1

# Start server
WORKDIR /app/server
CMD ["node", "dist/index.js"]

# ============================================
# Stage 6: Development
# ============================================
FROM base AS development

# Install all dependencies (including devDependencies)
COPY package*.json ./
RUN npm install

COPY server/package*.json ./server/
WORKDIR /app/server
RUN npm install

# Copy source code
WORKDIR /app
COPY . .

# Generate Prisma client
WORKDIR /app/server
RUN npx prisma generate

ENV NODE_ENV=development

# Expose ports for both frontend dev server and backend
EXPOSE 3000 5000

# Default command (can be overridden)
CMD ["npm", "run", "dev"]
