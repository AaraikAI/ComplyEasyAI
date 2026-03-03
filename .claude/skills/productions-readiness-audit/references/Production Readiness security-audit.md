# Security Audit Reference (Visionary Edition)

This reference provides a comprehensive security checklist for production readiness. Every item must be verified and, where possible, **dynamically exploited** to confirm severity.

## 6A: Authentication Flow Verification

### Discover Auth Implementation
```bash
# Auth provider detection
grep -rn "supabase.*auth\|createClient\|@supabase\|clerk\|nextauth\|next-auth\|passport\|jsonwebtoken\|jwt\|bcrypt\|argon2\|auth0\|firebase.*auth\|lucia\|better-auth" --include="*.ts" --include="*.js" --include="*.py" | grep -v node_modules | grep -v test | head -20

# Auth routes/endpoints
grep -rn "login\|signin\|sign-in\|signup\|sign-up\|register\|logout\|sign-out\|forgot.*password\|reset.*password\|verify.*email\|confirm\|refresh.*token\|callback" --include="*.ts" --include="*.js" --include="*.py" | grep -v node_modules | grep -v test
```

### Authentication Checklist

**Sign Up Flow:**
- [ ] Email validation (format + optionally domain restrictions)
- [ ] Password strength enforcement (minimum length, complexity)
- [ ] Duplicate email/username handling (error message doesn't leak existence)
- [ ] Email verification sent and enforced before full access
- [ ] Rate limiting on registration endpoint

**Sign In Flow:**
- [ ] Credentials validated against stored hash (bcrypt/argon2, NOT MD5/SHA1/SHA256)
- [ ] Generic error message on failure ("Invalid credentials" not "User not found" or "Wrong password")
- [ ] Account lockout or progressive delay after N failed attempts
- [ ] Successful login creates proper session/token
- [ ] Rate limiting on login endpoint

**Password Reset Flow:**
- [ ] Reset link sent to email (not displayed in response)
- [ ] Token is single-use and expires (typically 1 hour)
- [ ] Old sessions invalidated after password change
- [ ] Rate limiting on reset request endpoint

**Token Handling:**
```bash
# JWT creation and verification
grep -rn "jwt\.sign\|jwt\.verify\|jsonwebtoken\|jose\|JWT\|createToken\|generateToken\|verifyToken" --include="*.ts" --include="*.js" --include="*.py" | grep -v node_modules | grep -v test

# Token storage (frontend)
grep -rn "localStorage\|sessionStorage\|cookie\|setCookie\|httpOnly\|secure\|sameSite" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" | grep -v node_modules | grep -v test
```

- [ ] JWTs have appropriate expiry (15min-1hr for access, longer for refresh)
- [ ] Refresh token rotation (old refresh token invalidated on use)
- [ ] Tokens stored securely (httpOnly cookies preferred over localStorage)
- [ ] Token validation on every protected request (not just checking existence)
- [ ] JWT secret is strong and from environment variable (not hardcoded)

**Session Management:**
- [ ] Sessions invalidated on logout (server-side, not just client-side token deletion)
- [ ] Session fixation prevention (new session ID on login)
- [ ] Session timeout for inactivity
- [ ] Secure/HttpOnly cookie flags set on session cookies
- [ ] CSRF protection on state-changing endpoints

---

## 6B: Authorization & Access Control

### Endpoint Protection Audit

```bash
# Find all API routes
grep -rn "router\.\(get\|post\|put\|patch\|delete\)\|app\.\(get\|post\|put\|patch\|delete\)\|@Get\|@Post\|@Put\|@Delete\|@app\.route" --include="*.ts" --include="*.js" --include="*.py" | grep -v node_modules | grep -v test > /tmp/audit_all_endpoints.txt

# Find auth middleware usage
grep -rn "auth\|protect\|guard\|requireAuth\|isAuthenticated\|authenticate\|checkToken\|verifyToken\|requireLogin" --include="*.ts" --include="*.js" --include="*.py" | grep -v node_modules | grep -v test > /tmp/audit_auth_middleware.txt
```

**Cross-reference: Every non-public endpoint must have auth middleware.** Check for:
- [ ] All CRUD endpoints for user data are protected
- [ ] Admin-only endpoints check admin role
- [ ] Public endpoints are intentionally public (health check, login, public pages)
- [ ] File upload/download endpoints are protected
- [ ] Webhook endpoints have their own verification (signature validation)

**RBAC/ABAC Verification:**
- [ ] Verify every sensitive endpoint has a middleware check (e.g., `isAdmin`, `requireRole('manager')`)
- [ ] Role hierarchy is enforced (admin > manager > user), not just checked at individual endpoints
- [ ] Role assignments cannot be self-elevated (user cannot set their own role to admin)

### Horizontal Privilege Escalation (CRITICAL)

This is the #1 most common authorization bug: User A can access User B's data by changing an ID in the URL or request body.

```bash
# Find all places where IDs come from request
grep -rn "req\.params\.\(id\|userId\|orgId\|teamId\)\|req\.query\.\(id\|userId\)\|req\.body\.\(id\|userId\)" --include="*.ts" --include="*.js" | grep -v node_modules | grep -v test

# Check if queries are scoped to authenticated user
grep -rn "\.eq.*user_id\|\.eq.*userId\|\.eq.*org_id\|\.where.*user_id\|\.filter.*user_id\|WHERE.*user_id" --include="*.ts" --include="*.js" --include="*.py" | grep -v node_modules | grep -v test
```

For every endpoint that accepts an ID parameter:
- [ ] Is the query filtered by the authenticated user's ID/org?
- [ ] Can user A request user B's resource by changing the ID?
- [ ] For update/delete: Is ownership verified before modification?

### RLS Policies (Supabase-specific)

```bash
# Find all tables
grep -rn "CREATE TABLE\|create table" --include="*.sql" | grep -v node_modules

# Find RLS enablement
grep -rn "ENABLE ROW LEVEL SECURITY\|enable row level security" --include="*.sql" | grep -v node_modules

# Find all policies
grep -rn "CREATE POLICY\|create policy" --include="*.sql" | grep -v node_modules
```

- [ ] Every table with user data has RLS enabled
- [ ] SELECT policies filter by `auth.uid()`
- [ ] INSERT policies verify `auth.uid()` matches the user_id being inserted
- [ ] UPDATE policies verify ownership before allowing changes
- [ ] DELETE policies verify ownership
- [ ] Service role bypass is intentional and documented
- [ ] Organization-scoped data uses org_id checks in policies

### Frontend Route Protection
```bash
# Protected route components
grep -rn "ProtectedRoute\|PrivateRoute\|AuthGuard\|requireAuth\|isAuthenticated\|redirect.*login\|router\.beforeEach" --include="*.tsx" --include="*.jsx" --include="*.ts" --include="*.vue" | grep -v node_modules | grep -v test
```

- [ ] Admin pages are not accessible by non-admin users
- [ ] Typing a protected URL directly redirects to login
- [ ] After auth redirect, user returns to intended page

---

## 6C: Data Protection

### Password Storage
```bash
# Check hashing algorithm
grep -rn "bcrypt\|argon2\|scrypt\|pbkdf2\|hashPassword\|hash(" --include="*.ts" --include="*.js" --include="*.py" | grep -v node_modules | grep -v test

# Check for weak hashing (RED FLAG)
grep -rn "md5\|sha1\|sha256\|createHash\|hashlib\.md5\|hashlib\.sha1" --include="*.ts" --include="*.js" --include="*.py" | grep -v node_modules | grep -v test
```

- [ ] Passwords hashed with bcrypt (cost ≥ 10), argon2, or scrypt — not MD5/SHA1/SHA256
- [ ] Salt is per-user (bcrypt handles this automatically)
- [ ] Passwords are never logged or returned in API responses

### Data in Transit
```bash
# HTTP vs HTTPS in API calls
grep -rn "http://" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" --include="*.py" | grep -v node_modules | grep -v test | grep -v localhost | grep -v "127\.0\.0\.1"

# HTTPS enforcement
grep -rn "https\|ssl\|tls\|redirect.*https\|HSTS\|Strict-Transport" --include="*.ts" --include="*.js" --include="*.py" --include="*.yaml" --include="*.yml" | grep -v node_modules | grep -v test
```

### Sensitive Data Exposure
```bash
# Check what's returned in API responses — are there fields that shouldn't be there?
grep -rn "password\|secret\|token\|ssn\|social_security\|credit_card\|card_number" --include="*.ts" --include="*.js" --include="*.py" | grep -v node_modules | grep -v test | grep -i "select\|return\|response\|res\.json\|send"

# Check logging for sensitive data
grep -rn "console\.log\|logger\.\|log\.\|print(" --include="*.ts" --include="*.js" --include="*.py" | grep -v node_modules | grep -v test | grep -i "password\|secret\|token\|key"
```

- [ ] API responses don't include password hashes, tokens, or secrets
- [ ] Logs don't contain sensitive data (passwords, tokens, PII)
- [ ] Error responses don't expose internal paths, stack traces, or DB schema
- [ ] Secrets scanned via `scan-patterns.md` — check for hardcoded keys

---

## 6D: Input Security (OWASP Top 10)

### SQL Injection
```bash
# String concatenation in queries (HIGH RISK)
grep -rn "query.*\`.*\${\|query.*' *+\|query.*\" *+\|execute.*f\"\|execute.*%s\|\.raw(\|\.rawQuery(" --include="*.ts" --include="*.js" --include="*.py" | grep -v node_modules | grep -v test

# Safe patterns (parameterized queries) — these are OK
# Prisma: .findMany({ where: { ... } })
# Supabase: .from('table').select().eq('col', value)
# Knex: .where('col', value)
# SQLAlchemy: session.query().filter_by()
```

### Cross-Site Scripting (XSS)
```bash
# Dangerous HTML rendering
grep -rn "dangerouslySetInnerHTML\|v-html\|innerHTML\|\[innerHTML\]\|{!! .*!!}\|safe\|mark_safe\|Markup(" --include="*.tsx" --include="*.jsx" --include="*.vue" --include="*.html" --include="*.py" | grep -v node_modules | grep -v test

# Check for CSP headers
grep -rn "Content-Security-Policy\|contentSecurityPolicy\|csp\|helmet" --include="*.ts" --include="*.js" | grep -v node_modules | grep -v test
```

### Cross-Site Request Forgery (CSRF)
```bash
# CSRF token handling
grep -rn "csrf\|CSRF\|xsrf\|XSRF\|csrfToken\|_token" --include="*.ts" --include="*.js" --include="*.py" --include="*.html" | grep -v node_modules | grep -v test

# SameSite cookie attribute
grep -rn "sameSite\|same_site\|SameSite" --include="*.ts" --include="*.js" --include="*.py" | grep -v node_modules | grep -v test
```

### Mass Assignment
```bash
# Check if entire request body is passed to DB operations
grep -rn "\.create(req\.body)\|\.update(req\.body)\|\.insert(req\.body)\|\*\*request\.json\|\.create(\*\*" --include="*.ts" --include="*.js" --include="*.py" | grep -v node_modules | grep -v test
```

- [ ] Request bodies are destructured/filtered to allowed fields only
- [ ] Users cannot set `role: "admin"` or `verified: true` by adding fields to the request

### Rate Limiting
```bash
grep -rn "rateLimit\|rate-limit\|rate_limit\|throttle\|RateLimiter\|slowDown\|express-rate-limit\|bottleneck" --include="*.ts" --include="*.js" --include="*.py" | grep -v node_modules | grep -v test
```

- [ ] Login endpoint rate-limited (prevent brute force)
- [ ] Registration endpoint rate-limited (prevent spam)
- [ ] Password reset rate-limited (prevent abuse)
- [ ] API endpoints rate-limited per user/IP (prevent DoS)
- [ ] File upload endpoints rate-limited (prevent resource exhaustion)

### Security Headers
```bash
grep -rn "helmet\|X-Frame-Options\|X-Content-Type-Options\|X-XSS-Protection\|Strict-Transport\|Content-Security-Policy\|Referrer-Policy\|Permissions-Policy" --include="*.ts" --include="*.js" --include="*.py" --include="*.yaml" --include="*.yml" --include="*.conf" | grep -v node_modules | grep -v test
```

Required headers for production:
- [ ] `X-Frame-Options: DENY` or `SAMEORIGIN` (clickjacking protection)
- [ ] `X-Content-Type-Options: nosniff` (MIME type sniffing protection)
- [ ] `Strict-Transport-Security` with `max-age` and `includeSubDomains` (HSTS)
- [ ] `Content-Security-Policy` (XSS protection)
- [ ] `Referrer-Policy: strict-origin-when-cross-origin` or stricter
- [ ] Server header removed or generic (don't expose Express/Nginx version)

---

## 6D-V: Autonomous Red Teaming & Fuzzing (VISIONARY)

After completing the static OWASP checks above, **actively attempt exploitation** against a locally running instance to verify severity and eliminate false positives.

### Step 1: Endpoint Fuzzing

For every discovered API endpoint, generate and inject adversarial payloads:

```bash
# Collect all API endpoints for fuzzing
grep -rn "router\.\(get\|post\|put\|patch\|delete\)\|app\.\(get\|post\|put\|patch\|delete\)" --include="*.ts" --include="*.js" -h | grep -oP "['\"]/[^'\"]+['\"]" | tr -d "'\""  | sort -u > /tmp/audit_fuzz_endpoints.txt
cat /tmp/audit_fuzz_endpoints.txt
```

**Payload Categories:**
- [ ] **SQL Injection:** `' OR 1=1--`, `'; DROP TABLE users;--`, `UNION SELECT` variants
- [ ] **NoSQL Injection:** `{"$gt": ""}`, `{"$ne": null}`, `{"$regex": ".*"}`
- [ ] **XSS:** `<script>alert(1)</script>`, `<img onerror=alert(1) src=x>`, event handler payloads
- [ ] **Command Injection:** `; ls -la`, `| cat /etc/passwd`, `` `whoami` ``
- [ ] **Path Traversal:** `../../etc/passwd`, `..%2f..%2f`, URL-encoded variants

For each payload:
1. Inject into query parameters, request body fields, and URL path segments.
2. If the payload executes or returns unexpected data, flag as **CRITICAL** and generate a patch.
3. Capture the request/response pair as evidence.

### Step 2: Privilege Escalation Simulation

```bash
# Identify all user-scoped endpoints
grep -rn "req\.params\.id\|req\.user\|currentUser\|auth\.uid" --include="*.ts" --include="*.js" | grep -v node_modules | grep -v test
```

- [ ] Simulate "User A" and "User B" with separate tokens/sessions.
- [ ] Attempt to fetch User B's data with User A's token by substituting IDs.
- [ ] If successful: flag as **CRITICAL IDOR**, generate a controller rewrite that enforces ownership checks.
- [ ] Test both direct ID substitution (`/api/users/USER_B_ID`) and nested resources (`/api/users/USER_A_ID/items/ITEM_OWNED_BY_B`).

### Step 3: Mass Assignment Exploitation

```bash
# Find endpoints that pass req.body directly to ORM
grep -rn "\.create(req\.body)\|\.update(req\.body)\|\.insert(req\.body)\|Object\.assign.*req\.body\|spread.*req\.body\|\.save(req\.body)" --include="*.ts" --include="*.js" | grep -v node_modules | grep -v test
```

- [ ] Inject `{"role": "admin"}` into POST/PATCH requests that map `req.body` directly to ORMs.
- [ ] Inject `{"verified": true}`, `{"is_active": true}`, `{"balance": 999999}` into user update endpoints.
- [ ] If any injected field is accepted and persisted: flag as **HIGH**, generate a strict Zod/Joi/Pydantic schema patch.

### Step 4: Authentication Bypass Attempts

- [ ] Send requests to protected endpoints without any auth header — verify 401 returned.
- [ ] Send expired/malformed JWTs — verify rejection (not silent pass-through).
- [ ] If using API keys: test with empty string, `null`, `undefined`, and another user's key.
- [ ] Test JWT `none` algorithm attack: forge a token with `alg: "none"` and no signature.

### Step 5: Fuzzing Edge Cases

- [ ] **Malformed JSON bodies:** Send `{invalid json`, empty body `{}`, deeply nested objects (100+ levels).
- [ ] **Oversized payloads:** Send 10MB+ request bodies — verify size limits reject them.
- [ ] **Unicode edge cases:** Null bytes (`\u0000`), RTL override characters, homoglyph attacks.
- [ ] **Boundary values:** Integer overflow (`2^53+1` in JS), negative IDs, zero-length strings, arrays where strings expected.
- [ ] **Content-Type mismatch:** Send `text/plain` where `application/json` expected.

**IMPORTANT:** All red teaming runs against **LOCAL instances only**. Never target production or external systems.

---

## 6E: Dependency Security

```bash
# JavaScript
npm audit 2>&1 | tee /tmp/audit_npm_security.txt
npx better-npm-audit audit 2>/dev/null

# Python
pip-audit 2>&1 | tee /tmp/audit_pip_security.txt 2>/dev/null
safety check 2>&1 | tee /tmp/audit_safety.txt 2>/dev/null

# Find outdated packages
npm outdated 2>&1 | tee /tmp/audit_npm_outdated.txt
pip list --outdated 2>&1 | tee /tmp/audit_pip_outdated.txt 2>/dev/null

# Unused dependencies (expanding attack surface unnecessarily)
npx depcheck 2>&1 | tee /tmp/audit_unused_deps.txt 2>/dev/null
```

- [ ] No critical or high severity CVEs in dependencies
- [ ] All patches available for known CVEs are applied
- [ ] Unused dependencies removed
- [ ] Lock files (package-lock.json, yarn.lock, Pipfile.lock) committed to version control

---

## 6F: Secrets Management

```bash
# Check for secrets management integration
grep -rn "vault\|Vault\|VAULT\|HashiCorp\|aws.*secretsmanager\|SecretManager\|secret.*manager\|doppler\|infisical\|1password.*cli\|op run\|chamber\|sops\|sealed-secret\|external-secret" --include="*.ts" --include="*.js" --include="*.py" --include="*.yaml" --include="*.yml" --include="*.toml" | grep -v node_modules | grep -v test

# Check for .env files that might be committed
git ls-files | grep -i "\.env" | grep -v "\.example\|\.sample\|\.template" 2>/dev/null

# Check git history for accidentally committed secrets
git log --all --diff-filter=A --name-only -- "*.env" "*.pem" "*.key" "*.p12" "*.pfx" "*.keystore" 2>/dev/null | head -20

# Check .gitignore completeness for secrets
cat .gitignore 2>/dev/null | grep -i "env\|secret\|key\|pem\|credential\|token\|\.p12\|\.pfx\|keystore"
```

- [ ] Secrets loaded from env vars or secrets manager (not hardcoded, not in config files)
- [ ] Secret rotation plan exists (what if an API key is compromised?)
- [ ] No .env files committed to git (check history too — once committed, it's in history forever)
- [ ] .gitignore covers: `.env`, `.env.local`, `.env.production`, `*.pem`, `*.key`, `*.p12`, `*.pfx`, `*.keystore`
- [ ] For production: Secrets manager recommended (AWS Secrets Manager, HashiCorp Vault, Doppler, Infisical, 1Password)
- [ ] Service account keys / API keys scoped to minimum required permissions
- [ ] Secrets not passed via command-line arguments (visible in process list)
- [ ] No secrets in Docker build args or layers

---

## 6G: Token & Credential Memory Security

```bash
# Token storage in frontend
grep -rn "localStorage\.setItem\|localStorage\.getItem\|sessionStorage\.setItem" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" | grep -v node_modules | grep -v test | grep -i "token\|jwt\|auth\|session\|credential\|key"

# Token clearing on logout
grep -rn "localStorage\.removeItem\|localStorage\.clear\|sessionStorage\.removeItem\|sessionStorage\.clear" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" | grep -v node_modules | grep -v test

# In-memory token handling
grep -rn "let.*token\|var.*token\|const.*token\|this\.token\|self\.token\|_token" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" | grep -v node_modules | grep -v test | grep -v "\.d\.ts"

# Check for secure cookie flags
grep -rn "httpOnly\|HttpOnly\|http_only\|secure:\|secure=\|Secure\|sameSite\|SameSite\|same_site" --include="*.ts" --include="*.js" --include="*.py" | grep -v node_modules | grep -v test
```

- [ ] Tokens NOT stored in localStorage (vulnerable to XSS — prefer httpOnly cookies)
- [ ] If localStorage must be used: tokens cleared on logout, on tab close (for sensitive apps)
- [ ] Refresh tokens stored in httpOnly secure cookies (not accessible to JavaScript)
- [ ] In-memory tokens cleared/nulled after use where possible
- [ ] Token variables not exposed to global scope (window.token, global.token)
- [ ] Mobile apps: tokens stored in platform secure storage (iOS Keychain, Android EncryptedSharedPreferences / Keystore), NOT in AsyncStorage/SharedPreferences
- [ ] Sensitive data cleared from memory on logout (not just UI state — clear token variables, cached user data)
- [ ] No tokens in URL query parameters (visible in logs, browser history, referrer headers)

---

## 6H: TLS & Certificate Security

```bash
# TLS/SSL configuration
grep -rn "https\|ssl\|tls\|TLS\|SSL\|certificate\|cert\|\.pem\|\.crt\|\.key" --include="*.ts" --include="*.js" --include="*.py" --include="*.yaml" --include="*.yml" --include="*.conf" --include="*.toml" | grep -v node_modules | grep -v test | grep -v "package-lock\|yarn\.lock"

# Certificate pinning (mobile apps and API clients)
grep -rn "pin\|pinning\|pinnedCertificates\|ssl.*pin\|certificate.*pin\|public.*key.*pin\|sha256/" --include="*.ts" --include="*.js" --include="*.py" --include="*.swift" --include="*.kt" --include="*.java" --include="*.xml" | grep -v node_modules | grep -v test

# Disabled SSL verification (RED FLAG)
grep -rn "rejectUnauthorized.*false\|verify.*false\|VERIFY_SSL.*false\|SSL_VERIFY.*False\|verify_ssl.*False\|InsecureSkipVerify\|check_hostname.*False\|NODE_TLS_REJECT_UNAUTHORIZED.*0" --include="*.ts" --include="*.js" --include="*.py" --include="*.go" --include="*.yaml" --include="*.yml" | grep -v node_modules | grep -v test

# HTTP (non-TLS) API calls to external services
grep -rn "http://" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" --include="*.py" | grep -v node_modules | grep -v test | grep -v localhost | grep -v "127\.0\.0\.1" | grep -v "\.env\|process\.env"
```

- [ ] All external API calls use HTTPS (no http:// to production services)
- [ ] SSL/TLS verification NOT disabled in production (rejectUnauthorized: false is Critical)
- [ ] HSTS header configured (Strict-Transport-Security with max-age ≥ 31536000)
- [ ] HTTP → HTTPS redirect configured (at load balancer or app level)
- [ ] TLS 1.2+ enforced (TLS 1.0/1.1 deprecated)
- [ ] Certificate expiry monitoring in place (or managed by cloud provider)
- [ ] **Certificate pinning** (for mobile apps or high-security API clients):
  - Pin against public key hash, not full certificate (survives cert rotation)
  - Backup pins configured (in case primary cert is rotated)
  - Pin validation tested for both valid and invalid scenarios
  - If not using pinning: document why (e.g., web-only app where browser handles TLS)

---

## Security Severity Classification

| Severity | Criteria | Examples |
|----------|----------|---------|
| **Critical** | Exploitable by unauthenticated attacker, data breach risk | SQL injection, missing auth on sensitive endpoints, hardcoded secrets, broken RLS, command injection |
| **High** | Exploitable by authenticated attacker, privilege escalation | Horizontal access (user A sees user B's data), mass assignment, missing role checks, JWT `none` algorithm bypass |
| **Medium** | Weakens defense-in-depth, needs specific conditions to exploit | Missing rate limiting, missing security headers, weak password requirements, CORS misconfiguration, CSRF without state changes |
| **Low** | Best practice violation, minimal direct risk | Missing CSP nonce, verbose error messages, outdated non-vulnerable dependencies, missing HSTS preload |

### Red Team Finding Format

Every red team finding must include:

```
FINDING: [Title]
SEVERITY: Critical | High | Medium | Low
VECTOR: [Attack type — SQLi, IDOR, XSS, Mass Assignment, etc.]
ENDPOINT: [Method] [Path]
PAYLOAD: [Exact payload used]
EVIDENCE: [Request/Response showing exploitation]
IMPACT: [What data/access was gained]
FIX: [Exact code patch with imports and dependencies]
```
