# Deployment Hardening Reference (Visionary Edition)

This reference covers everything needed for the application to survive in production: server configuration, monitoring, scaling, CI/CD, and disaster recovery — enhanced with autonomous chaos engineering for proactive resilience validation.

## 8A: Environment & Configuration

### Env Var Completeness

```bash
# Extract all env vars used in code
grep -rn "process\.env\.\|os\.environ\|os\.getenv\|env\.\|Env\.\|import\.meta\.env\." --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" --include="*.py" | grep -v node_modules | grep -v test | grep -v ".d.ts" > /tmp/audit_env_usage.txt

# Extract unique var names
cat /tmp/audit_env_usage.txt | grep -oP "process\.env\.([A-Z_a-z0-9]+)" | sort | uniq > /tmp/audit_env_vars_code.txt
cat /tmp/audit_env_usage.txt | grep -oP "import\.meta\.env\.([A-Z_a-z0-9]+)" | sort | uniq >> /tmp/audit_env_vars_code.txt 2>/dev/null

# Extract vars from .env.example
cat .env.example 2>/dev/null | grep -v "^#" | grep -v "^$" | cut -d= -f1 | sort | uniq > /tmp/audit_env_vars_doc.txt

# Show vars in code but not in .env.example
comm -23 /tmp/audit_env_vars_code.txt /tmp/audit_env_vars_doc.txt 2>/dev/null
```

### Checklist
- [ ] **Completeness**: Match every env var used in code against `.env.example` — each must have a description/default value
- [ ] **Env var validation at startup** — App crashes immediately with a clear error if required vars are missing
  ```bash
  grep -rn "validateEnv\|envalid\|env\.parse\|assert.*env\|if.*!.*process\.env\|required.*env\|throw.*env\|missing.*env" --include="*.ts" --include="*.js" --include="*.py" | grep -v node_modules | grep -v test
  ```
- [ ] **No hardcoded localhost** without env fallback
  ```bash
  grep -rn "localhost\|127\.0\.0\.1\|0\.0\.0\.0" --include="*.ts" --include="*.js" --include="*.py" | grep -v node_modules | grep -v test | grep -v "\.env\|process\.env\|os\.environ\|fallback\|default\|//"
  ```
- [ ] **Separate configs per environment** — dev/staging/production don't share secrets
- [ ] **Secrets**: Ensure `.env` is in `.gitignore` — verify `.env`, `.env.local`, `.env.production` are all excluded
  ```bash
  cat .gitignore | grep -i "\.env"
  git status --porcelain | grep "\.env" 2>/dev/null  # Should return nothing
  ```
- [ ] **No secrets in version control history**
  ```bash
  git log --all --diff-filter=A -- ".env" ".env.local" ".env.production" 2>/dev/null | head -5
  ```

---

## 8B: Server & Runtime Hardening

### Health Check Endpoint

```bash
grep -rn "health\|/ping\|/ready\|/status\|readiness\|liveness" --include="*.ts" --include="*.js" --include="*.py" | grep -v node_modules | grep -v test
```

A proper health check should:
- [ ] **Health Checks**: `/api/health` or `/healthz` endpoint exists
- [ ] Verify database connectivity (not just return 200 unconditionally)
- [ ] Return fast (< 1 second)
- [ ] Return structured response: `{ status: "healthy", db: "connected", timestamp: ... }`
- [ ] Return 503 when unhealthy

### Graceful Shutdown

```bash
grep -rn "SIGTERM\|SIGINT\|graceful\|shutdown\|beforeExit\|on_shutdown\|process\.on.*signal\|atexit" --include="*.ts" --include="*.js" --include="*.py" | grep -v node_modules | grep -v test
```

- [ ] **Graceful Shutdown**: Handle `SIGTERM` in the app — SIGTERM handler registered
- [ ] On shutdown: stop accepting new requests
- [ ] On shutdown: finish in-flight requests (with timeout)
- [ ] On shutdown: close database connections
- [ ] On shutdown: flush logs and metrics

### Global Error Handler

```bash
grep -rn "errorHandler\|error.*middleware\|app\.use.*err\|process\.on.*uncaughtException\|process\.on.*unhandledRejection\|exception_handler\|@app\.exception_handler" --include="*.ts" --include="*.js" --include="*.py" | grep -v node_modules | grep -v test
```

- [ ] Express/Fastify/etc. has a global error middleware (4-arg function in Express)
- [ ] Unhandled promise rejections caught (`process.on('unhandledRejection')`)
- [ ] Uncaught exceptions caught (`process.on('uncaughtException')`)
- [ ] Error responses are sanitized (no stack traces in production)
- [ ] Errors are logged with request context (request ID, user ID, path)

### Request Hardening

```bash
# Body parser limits
grep -rn "limit\|bodyParser\|body-parser\|json()\|urlencoded\|express\.json\|express\.urlencoded\|max_content_length" --include="*.ts" --include="*.js" --include="*.py" | grep -v node_modules | grep -v test

# Request timeouts
grep -rn "timeout\|keepAlive\|request_timeout\|server_timeout\|TIMEOUT" --include="*.ts" --include="*.js" --include="*.py" --include="*.yaml" --include="*.yml" | grep -v node_modules | grep -v test

# CORS configuration
grep -rn "cors\|CORS\|Access-Control" --include="*.ts" --include="*.js" --include="*.py" | grep -v node_modules | grep -v test
```

- [ ] Body size limit configured (default Express limit is 100kb — appropriate for your app?)
- [ ] Request timeout configured (don't let requests hang forever)
- [ ] CORS origins explicitly listed (not wildcard `*` in production)
- [ ] File upload size limits configured
- [ ] Keep-alive timeout appropriate

---

## 8C: Database Hardening

### Connection Management
```bash
# Connection pooling
grep -rn "pool\|poolSize\|pool_size\|max_connections\|connectionLimit\|min_connections\|idle_timeout\|connection_timeout" --include="*.ts" --include="*.js" --include="*.py" --include="*.yaml" --include="*.yml" | grep -v node_modules | grep -v test

# Connection retry logic
grep -rn "retry\|reconnect\|backoff\|connection.*error\|connection.*fail" --include="*.ts" --include="*.js" --include="*.py" | grep -v node_modules | grep -v test
```

- [ ] Connection pool configured with min/max connections
- [ ] Pool size appropriate for deployment (serverless needs smaller pools)
- [ ] Connection timeout configured
- [ ] Retry logic for transient connection failures
- [ ] Idle connections cleaned up

### Migration Status
```bash
# List migration files
find . -path "*/migrations/*" -o -path "*/prisma/migrations/*" -o -name "*.sql" | grep -i migrat | grep -v node_modules | sort

# Check for pending migrations
npx prisma migrate status 2>/dev/null
npx knex migrate:status 2>/dev/null
python manage.py showmigrations 2>/dev/null
alembic current 2>/dev/null
```

- [ ] All migrations have been applied
- [ ] Migration files are in version control
- [ ] Migrations are reversible (can roll back if deploy fails)
- [ ] No manual schema changes outside of migrations

### Query Performance
```bash
# Find queries that might be slow
grep -rn "\.select\|\.find\|\.query\|\.where\|\.filter\|SELECT.*FROM" --include="*.ts" --include="*.js" --include="*.py" --include="*.sql" | grep -v node_modules | grep -v test > /tmp/audit_queries.txt

# Check for N+1 patterns (queries inside loops)
grep -rn -B5 "await.*\(select\|find\|query\|from\)" --include="*.ts" --include="*.js" --include="*.py" | grep -v node_modules | grep -v test | grep -B3 "for \|\.map(\|\.forEach(\|while " > /tmp/audit_n_plus_1.txt

# Check for missing indexes
# Cross-reference: columns used in WHERE/ORDER BY/JOIN should have indexes
grep -rn "\.eq(\|\.match(\|\.filter(\|\.where(\|\.orderBy(\|\.order(\|WHERE\|ORDER BY\|JOIN.*ON" --include="*.ts" --include="*.js" --include="*.py" --include="*.sql" | grep -v node_modules | grep -v test > /tmp/audit_filtered_columns.txt
```

- [ ] Indexes exist for all columns used in WHERE, JOIN, ORDER BY clauses
- [ ] No N+1 query patterns in list/dashboard views
- [ ] Large queries are paginated (not fetching unbounded result sets)
- [ ] Expensive queries are cached where appropriate
- [ ] **DB Backups**: Verify backup script/config exists and is automated (see 8I for full checklist)

---

## 8D: Monitoring & Observability

### Structured Logging
```bash
# Check for logging framework
grep -rn "winston\|pino\|bunyan\|morgan\|structlog\|loguru\|log4j\|slog\.\|logging\.\|Logger" --include="*.ts" --include="*.js" --include="*.py" | grep -v node_modules | grep -v test | head -10

# Count console.log vs structured logger usage
echo "console.log count: $(grep -rn 'console\.log' --include="*.ts" --include="*.js" | grep -v node_modules | grep -v test | wc -l)"
echo "structured logger count: $(grep -rn 'logger\.\|log\.\(info\|warn\|error\|debug\)' --include="*.ts" --include="*.js" | grep -v node_modules | grep -v test | wc -l)"
```

- [ ] **Structured Logs**: JSON format for production — structured logging library configured (not console.log)
- [ ] Log levels used appropriately (error/warn/info/debug)
- [ ] Logs include context: timestamp, request ID, user ID, operation
- [ ] Sensitive data not logged (passwords, tokens, PII)
- [ ] Log destination configured for production (file, stdout for container, cloud service)

### Error Tracking
```bash
grep -rn "sentry\|Sentry\|bugsnag\|Bugsnag\|rollbar\|Rollbar\|datadog\|newrelic\|honeybadger\|errorTracking\|captureException\|captureMessage" --include="*.ts" --include="*.js" --include="*.py" | grep -v node_modules | grep -v test
```

- [ ] **Error Tracking**: Sentry/LogRocket/Bugsnag integration verified — service integrated OR documented plan for setup
- [ ] Source maps uploaded for frontend error context
- [ ] Error grouping/deduplication configured
- [ ] Alert rules set for error rate spikes

### Application Metrics
```bash
grep -rn "metrics\|prometheus\|statsd\|datadog\|newrelic\|opentelemetry\|otlp\|tracing\|span\|histogram\|counter\|gauge" --include="*.ts" --include="*.js" --include="*.py" | grep -v node_modules | grep -v test
```

Minimum metrics for production:
- [ ] Request rate (requests per second)
- [ ] Error rate (4xx, 5xx per second)
- [ ] Response time (p50, p95, p99)
- [ ] Database query time
- [ ] Queue depth (if queues are used)

### Uptime Monitoring
- [ ] External health check monitoring configured (Uptime Robot, Pingdom, etc.) — OR plan documented
- [ ] Alerts configured for downtime

---

## 8E: Scaling & Performance

### Stateless Design
```bash
# In-memory state that won't survive restart
grep -rn "const.*=.*new Map()\|const.*=.*new Set()\|global\.\|app\.locals\.\|let.*cache.*=\|const.*cache.*=" --include="*.ts" --include="*.js" | grep -v node_modules | grep -v test

# In-memory sessions
grep -rn "express-session\|session({\|MemoryStore\|in-memory.*session" --include="*.ts" --include="*.js" | grep -v node_modules | grep -v test
```

- [ ] No in-memory sessions (use Redis, DB, or JWTs)
- [ ] No in-memory caches that can't be lost (use Redis/Memcached for persistent cache)
- [ ] No file-system state (uploaded files go to S3/cloud storage, not local disk)
- [ ] Application can run as multiple instances without conflicts

### Static Assets
```bash
# Frontend build output
find . -name "vite.config.*" -o -name "next.config.*" -o -name "webpack.config.*" -o -name "nuxt.config.*" | grep -v node_modules
```

- [ ] Frontend built in production mode (minified, optimized)
- [ ] Static assets served via CDN or reverse proxy (not the app server)
- [ ] Asset caching headers configured (Cache-Control, ETag)
- [ ] Image optimization in place

### Resource Limits
```bash
# File upload config
grep -rn "multer\|upload\|multipart\|file.*size\|maxSize\|max_size\|max_file\|fileSize\|file_upload" --include="*.ts" --include="*.js" --include="*.py" | grep -v node_modules | grep -v test
```

- [ ] File uploads have size limits
- [ ] File uploads validate file type (not just extension — check MIME type)
- [ ] Large file uploads use streaming (not loading entire file into memory)
- [ ] Background/long-running tasks use queues (not blocking request handlers)

---

## 8F: CI/CD Pipeline

```bash
# CI/CD configuration
find . -path "*/.github/workflows/*" -o -path "*/.gitlab-ci*" -o -name "Jenkinsfile" -o -name "bitbucket-pipelines.yml" -o -path "*/.circleci/*" 2>/dev/null

# Read CI config
cat .github/workflows/*.yml 2>/dev/null
cat .gitlab-ci.yml 2>/dev/null
```

- [ ] Build process defined in CI/CD (not manual builds)
- [ ] Tests run in CI before deployment
- [ ] Linting/type checking runs in CI
- [ ] Environment-specific build configurations (dev/staging/prod)
- [ ] Database migrations run as part of deployment (or documented manual step)
- [ ] Rollback strategy exists (previous version can be redeployed quickly)
- [ ] Post-deploy health check (verify the new version is actually working)
- [ ] Deployment doesn't cause downtime (rolling deploy, blue-green, canary)

### CI Security Scanning

```bash
# Check for security scanning in CI pipelines
grep -rn "snyk\|Snyk\|codeql\|CodeQL\|semgrep\|Semgrep\|sonarqube\|SonarQube\|sonar-scanner\|trivy\|Trivy\|grype\|Grype\|bandit\|safety\|npm.*audit\|SAST\|DAST\|security.*scan\|scan.*security\|vulnerability.*scan\|dependabot\|renovate" .github/workflows/*.yml .gitlab-ci.yml Jenkinsfile bitbucket-pipelines.yml .circleci/config.yml 2>/dev/null

# Check for Dependabot/Renovate configuration
find . -name "dependabot.yml" -o -name "renovate.json" -o -name "renovate.json5" -o -name ".renovaterc" | head -5
```

- [ ] **SAST (Static Application Security Testing)** in CI: CodeQL, Semgrep, SonarQube, or Snyk Code
- [ ] **Dependency scanning** in CI: `npm audit`, Snyk, or Dependabot/Renovate for auto-PRs
- [ ] **Container image scanning** in CI: Trivy, Grype, or Snyk Container (see Docker section)
- [ ] **Secret scanning** in CI: GitHub secret scanning, GitLeaks, or TruffleHog
- [ ] Scan results block deployment on critical/high findings (not just warnings)
- [ ] Automated dependency update PRs (Dependabot or Renovate configured)

### Deployment Gates & Promotion Strategy

```bash
# Check for environment/deployment protection rules
grep -rn "environment:\|approval\|manual\|gate\|promote\|staging\|production" .github/workflows/*.yml .gitlab-ci.yml 2>/dev/null

# Check for multi-stage deployment (staging → production)
grep -rn "staging\|canary\|blue.green\|rolling\|gradual\|percentage\|weight" .github/workflows/*.yml .gitlab-ci.yml Dockerfile* docker-compose* *.yaml *.yml 2>/dev/null | grep -v node_modules
```

- [ ] **Staging environment** exists and matches production configuration
- [ ] **Manual approval gate** required before production deployment (GitHub environment protection, GitLab manual jobs)
- [ ] **Smoke tests** run in staging before promotion to production
- [ ] **Canary / blue-green / rolling** deployment strategy (not all-at-once replacement)
- [ ] **Rollback procedure** documented and tested (can revert in < 5 minutes)
- [ ] **Feature flags** for risky features (can disable without redeployment)
- [ ] **Deploy freeze** capability (can halt deployments during incidents)
- [ ] Deployment notifications sent to team (Slack, email, etc.)

---

## 8G: Docker & Container Hardening

```bash
# Find all Dockerfiles
find . -name "Dockerfile*" -o -name ".dockerignore" | grep -v node_modules | sort

# Analyze Dockerfile security
for df in $(find . -name "Dockerfile*" -not -path "*/node_modules/*"); do
  echo "=== $df ==="
  cat "$df"
  echo ""
  echo "--- Security checks for $df ---"
  
  # Check for non-root user
  grep -n "USER\|user " "$df" || echo "  ❌ No USER directive — runs as root"
  
  # Check base image
  grep -n "^FROM" "$df"
  grep -n "FROM.*:latest" "$df" && echo "  ❌ Uses :latest tag — non-reproducible"
  
  # Check for secrets in build
  grep -n "ARG.*SECRET\|ARG.*KEY\|ARG.*PASSWORD\|ARG.*TOKEN\|ENV.*SECRET\|ENV.*KEY\|ENV.*PASSWORD" "$df" && echo "  ❌ Secret in build args/env — will be in image layers"
  
  # Check for multi-stage build
  stages=$(grep -c "^FROM" "$df")
  [ "$stages" -gt 1 ] && echo "  ✅ Multi-stage build ($stages stages)" || echo "  ⚠️ Single-stage build — image may be larger than necessary"
  
  # Check for .dockerignore
  dir=$(dirname "$df")
  [ -f "$dir/.dockerignore" ] && echo "  ✅ .dockerignore exists" || echo "  ❌ No .dockerignore — node_modules/secrets may be in image"
done

# Check .dockerignore contents
cat .dockerignore 2>/dev/null
```

### Dockerfile Security Checklist

- [ ] **Docker Hardening — No `root` users**: Dockerfile includes `USER node` or `USER appuser` (never runs as root in production)
- [ ] **Pinned base image tags**: Uses specific version tags (`node:20.11-alpine`), NOT `:latest`
  - IMAGE_TAG should be pinned in Dockerfile AND in docker-compose/k8s manifests
  - Check: `grep -rn ":latest" Dockerfile* docker-compose* *.yaml *.yml | grep "image:"` — should return nothing
- [ ] **Multi-stage build**: Build dependencies not in final image (separate build and runtime stages)
- [ ] **Minimal base image**: Uses alpine, distroless, or slim variants (not full Ubuntu/Debian)
- [ ] **.dockerignore exists** and excludes: `node_modules`, `.env`, `.git`, `*.pem`, `*.key`, test files, docs
- [ ] **No secrets in image**: No `ARG SECRET_KEY`, no `ENV API_KEY=`, no `COPY .env`
  - Secrets passed at runtime via environment variables or mounted secrets
- [ ] **COPY specific files** (not `COPY . .` without .dockerignore)
- [ ] **Health check in Dockerfile**: `HEALTHCHECK CMD curl -f http://localhost:3000/health || exit 1`
- [ ] **Read-only filesystem** where possible: `--read-only` flag in docker run
- [ ] **No package manager caches** in final image: `RUN npm ci --omit=dev && npm cache clean --force`

### Container Image Scanning (Trivy / Grype)

```bash
# Check if Trivy/Grype scanning is in CI
grep -rn "trivy\|Trivy\|grype\|Grype\|aquasecurity\|anchore\|snyk.*container\|docker.*scan\|scout" .github/workflows/*.yml .gitlab-ci.yml 2>/dev/null

# Check for Trivy config
find . -name "trivy.yaml" -o -name ".trivyignore" 2>/dev/null
```

- [ ] **Container image scanning** configured in CI (Trivy, Grype, Snyk Container, or Docker Scout)
- [ ] Scan runs on every build (not just periodically)
- [ ] Critical and high CVEs block image push to registry
- [ ] Base image updated regularly (stale base images accumulate CVEs)
- [ ] Scan results reviewed and triaged (not just running and ignoring)
- [ ] For Trivy specifically: `trivy image --severity CRITICAL,HIGH --exit-code 1 your-image:tag`

### IMAGE_TAG Strategy

```bash
# Check how images are tagged
grep -rn "IMAGE_TAG\|image.*tag\|docker.*tag\|container.*tag\|:latest\|:\${" Dockerfile* docker-compose* .github/workflows/*.yml .gitlab-ci.yml *.yaml *.yml 2>/dev/null | grep -v node_modules

# Check for tag in deployment manifests
grep -rn "image:" *.yaml *.yml 2>/dev/null | grep -v node_modules | grep -v ".github"
```

- [ ] **Never use `:latest` in production** — always pin to specific version or commit SHA
- [ ] IMAGE_TAG derived from git commit SHA or semantic version (reproducible builds)
- [ ] Same image promoted through environments (don't rebuild for production)
- [ ] Image registry uses immutable tags (can't overwrite a tag with different content)
- [ ] Old images cleaned up (retention policy on registry)

---

## 8H: Mobile Deployment (if applicable)

Only audit this section if the project includes a mobile app (React Native, Flutter, Expo, native iOS/Android).

```bash
# Detect mobile project
find . -name "app.json" -o -name "app.config.js" -o -name "expo.json" -o -name "Info.plist" -o -name "AndroidManifest.xml" -o -name "pubspec.yaml" -o -name "Podfile" -o -name "build.gradle" | grep -v node_modules | grep -v ".build" | head -10

# Check for mobile-specific config
grep -rn "expo\|react-native\|flutter\|capacitor\|ionic\|cordova" package.json pubspec.yaml 2>/dev/null
```

### Mobile Build & Distribution
- [ ] **App signing configured**: iOS provisioning profiles and Android keystore set up
- [ ] **Signing keys secured**: Not in git, stored in CI secrets or dedicated key management
- [ ] **Build variants**: Separate debug/staging/release builds with different API endpoints
- [ ] **Version management**: Version code/number incremented on each release
- [ ] **Store listing**: App store metadata (screenshots, description, privacy policy) prepared

### Mobile Security
- [ ] **Token storage**: Using platform secure storage (iOS Keychain, Android EncryptedSharedPreferences/Keystore) — NOT AsyncStorage/SharedPreferences for tokens
  ```bash
  # React Native
  grep -rn "AsyncStorage\|SecureStore\|Keychain\|EncryptedStorage\|keychain" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" | grep -v node_modules | grep -v test
  
  # Flutter
  grep -rn "SharedPreferences\|flutter_secure_storage\|keychain" --include="*.dart" | grep -v test
  ```
- [ ] **Certificate pinning** implemented for API calls (see Security section 6H)
- [ ] **Root/jailbreak detection** for high-security apps
- [ ] **Code obfuscation** enabled for release builds (ProGuard/R8 for Android, Xcode bitcode for iOS)
- [ ] **No sensitive data in app bundle**: API keys not hardcoded, secrets not in Info.plist/AndroidManifest
- [ ] **Deep link validation**: Universal links / App Links verified, no open redirect via deep links
- [ ] **Biometric auth** (if applicable): Properly integrated with platform APIs, fallback to PIN

### Mobile CI/CD
- [ ] Automated builds for both platforms (Fastlane, Bitrise, Codemagic, EAS Build, GitHub Actions)
- [ ] Automated testing (unit + E2E with Detox/Maestro/Patrol)
- [ ] App store submission automated or semi-automated
- [ ] OTA updates configured (for Expo/CodePush apps — with versioning and rollback)
- [ ] Beta distribution channel (TestFlight, Firebase App Distribution, Internal Testing)

---

## 8I: Pre-Migration Database Backup & Safe Deployment

```bash
# Check for backup before migration in deployment scripts
grep -rn "backup\|pg_dump\|mysqldump\|mongodump\|snapshot\|export.*database" .github/workflows/*.yml .gitlab-ci.yml Makefile scripts/ deploy/ bin/ 2>/dev/null

# Check for migration scripts
find . -name "migrate*" -o -name "migration*" | grep -v node_modules | grep -v __pycache__ | sort

# Check deployment scripts for migration ordering
grep -rn "migrate\|migration\|schema\|seed\|rollback" scripts/ deploy/ bin/ Makefile .github/workflows/*.yml 2>/dev/null
```

### Pre-Migration Backup Checklist
- [ ] **Automated backup BEFORE every migration** — CI/CD pipeline takes a DB snapshot/dump before running migrations
  ```yaml
  # Example GitHub Actions step (before migration):
  # - name: Backup database
  #   run: pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
  #   # Or for managed services: trigger point-in-time snapshot via API
  ```
- [ ] **Backup verified**: Backup completion confirmed before migration proceeds (not fire-and-forget)
- [ ] **Backup retention**: At least the last 3 migration backups retained
- [ ] **Restore tested**: Team has successfully restored from a backup at least once
- [ ] **Migration is reversible**: Down/rollback migrations exist for every up migration
  ```bash
  # Check for rollback migrations
  find . -path "*/migrations/*" -name "*down*" -o -name "*rollback*" -o -name "*revert*" | grep -v node_modules
  # For Prisma: prisma migrate reset capability
  # For Knex: knex migrate:rollback
  ```
- [ ] **Migration tested in staging first**: Migrations run against staging DB before production
- [ ] **Data migration safety**: If migration transforms data (not just schema), it handles:
  - Null values in existing data
  - Large tables (batched updates, not single UPDATE on millions of rows)
  - Concurrent reads during migration (zero-downtime migration strategy)
- [ ] **Point-in-time recovery** enabled on production database (managed services usually offer this)
- [ ] **Deployment order**: Backup → Run migration → Verify migration → Deploy new code → Health check
  - If migration fails: Restore from backup, abort deployment
  - If health check fails: Roll back code, optionally roll back migration

---

## 8J: Disaster Recovery

### Database Backups
```bash
# Backup configuration
grep -rn "backup\|pg_dump\|mysqldump\|mongodump\|cron.*backup\|snapshot" --include="*.ts" --include="*.js" --include="*.py" --include="*.sh" --include="*.yaml" --include="*.yml" | grep -v node_modules | grep -v test
```

- [ ] Automated database backups configured (or managed by cloud provider — verify it's enabled)
- [ ] Backup retention period defined
- [ ] Point-in-time recovery available (for critical data)
- [ ] Backup restoration has been tested at least once

### Data Export
- [ ] User data can be exported (GDPR compliance if applicable)
- [ ] System configuration can be recreated from version control + env vars

### Recovery Documentation
- [ ] Recovery procedure documented (even a brief README section)
- [ ] List of all services/APIs the app depends on
- [ ] Steps to recreate the environment from scratch
- [ ] Secrets rotation procedure (what to do if a key is compromised)
- [ ] Incident response contact list

---

## 8K: Autonomous Chaos Engineering (VISIONARY)

Go beyond static configuration checks — actively verify the system's resilience by injecting real failures and observing behavior.

### Chaos Protocol

#### 1. Orchestration
Spin up the full app architecture via Docker Compose (or equivalent local stack). Ensure the test environment mirrors production topology: app server(s), database, cache, message queue, and any external service dependencies (mocked or stubbed).

```bash
# Verify Docker Compose can bring up the full stack
docker compose up -d 2>/dev/null || docker-compose up -d 2>/dev/null
docker compose ps 2>/dev/null || docker-compose ps 2>/dev/null

# Verify all services are healthy before injecting faults
curl -sf http://localhost:3000/health || echo "❌ App health check failed before chaos testing"
```

#### 2. Fault Injection Scenarios

Execute each fault while the app is under simulated traffic:

- [ ] **DB Outage**: Kill the database container during active traffic. Observe: Does the app return 503s gracefully or crash entirely? Do connection retries work? Does the app recover automatically when DB comes back?
  ```bash
  # Example: Kill DB, observe, then restore
  docker compose stop db
  # Hit the app with requests, capture status codes
  for i in $(seq 1 10); do curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health; echo; done
  docker compose start db
  ```

- [ ] **Latency Injection**: Inject 5-second network lag on the DB or external service connection. Observe: Does the app timeout gracefully? Are users shown appropriate messages? Do request timeouts trigger correctly?
  ```bash
  # Example using tc (traffic control) or toxiproxy
  # docker exec app-container tc qdisc add dev eth0 root netem delay 5000ms
  ```

- [ ] **Resource Pressure**: Spike CPU to 99% or exhaust memory. Observe: Does the app degrade gracefully under load? Are there circuit breakers or backpressure mechanisms? Does the health check start failing appropriately?
  ```bash
  # Example: CPU stress inside app container
  # docker exec app-container stress --cpu 4 --timeout 30s
  ```

#### 3. Observation Criteria

For each fault injection, verify:
- Does the app return appropriate HTTP status codes (503 Service Unavailable, 504 Gateway Timeout)?
- Do retry mechanisms activate correctly (with exponential backoff, not thundering herd)?
- Are errors logged with sufficient context for debugging?
- Does the app auto-recover when the fault is removed?
- Are in-flight requests handled gracefully (not silently dropped)?

#### 4. Auto-Healing Implementation

If chaos testing reveals failures, autonomously implement resilience patterns:

- [ ] **Circuit Breakers**: Implement using libraries like `opossum` (Node.js), `resilience4j` (Java), or `pybreaker` (Python) to prevent cascade failures.
- [ ] **Retry Logic**: Add retry with exponential backoff for transient failures (DB connections, external API calls).
- [ ] **Timeout Configuration**: Set appropriate timeouts at every integration point (DB queries, HTTP calls, queue operations).
- [ ] **Graceful Degradation**: Implement fallback responses when dependencies are unavailable (cached data, default values, feature flags to disable affected features).
- [ ] **Backpressure**: Add request queuing or load shedding when the system is overwhelmed.

### Chaos Test Results Output

For each fault scenario:
- Fault type injected
- Duration of fault
- App behavior observed (status codes, error messages, logs)
- Recovery time after fault removed
- Resilience patterns implemented (with code diffs)
- Pass/fail per observation criterion

---

## Infrastructure Severity Classification

| Severity | Criteria | Examples |
|----------|----------|---------|
| **Critical** | App will crash or lose data in production | Missing global error handler, no DB connection retry, no health check, secrets in git |
| **High** | Significant operational risk, hard to debug issues | No structured logging, no error tracking, missing graceful shutdown, no CORS config |
| **Medium** | Operational inconvenience, reduced resilience | No rate limiting, missing monitoring, no CI/CD, in-memory sessions |
| **Low** | Best practice, nice-to-have | Missing CDN, no cache headers, no uptime monitoring, missing metrics |
