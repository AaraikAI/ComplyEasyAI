# FORENSIC PRODUCTION READINESS AUDIT v2 — 2026-02-21

**Auditor:** Claude Opus 4.6 (Automated Forensic Scan)
**Codebase:** ComplyEasyAI
**Branch:** `main` (post-merge of 18-fix remediation PR #128)
**Commit:** `a7f7f9d` (Merge of `3f39918`)
**Total Source Files Scanned:** 648 TypeScript/TSX files (386,488 lines of code)
**Scan Scope:** All .ts, .tsx, .js, .jsx files excluding node_modules, dist, build, .git
**Previous Audit:** FORENSIC_PRODUCTION_AUDIT_2026-02-21.md (scored 68%)

---

## EXECUTIVE SUMMARY

| Metric | Previous Audit | This Audit | Delta |
|--------|---------------|------------|-------|
| Overall Readiness Score | 68% | **78%** | +10% |
| Critical Blockers | 9 | **4** | -5 |
| High Severity Issues | 10 | **14** | +4 (new findings) |
| Medium Severity Issues | 5 | **15** | +10 (new findings) |
| Low / Info | 3 | **16** | +13 (new findings) |
| Features 100% Production-Ready | 22/40 | **24/40** | +2 |
| Mock/Demo Components (no API) | 8 | **15** | +7 (deeper scan) |
| TypeScript Errors | 2 | **24** | +22 (server deps now installable) |

**Verdict:** The 18-fix remediation addressed the originally-identified issues (docker passwords, CORS hardcoding, Swagger URL, console.log in 3 components, rate limiter GET skip, devToken in 2/3 paths). However, **one fix introduced a regression** (nanoid `^5.1.7` doesn't exist), **one fix was incomplete** (devToken still leaks at authController:533), and the **deeper scan revealed 15 frontend components still using hardcoded mock/demo data with zero backend connectivity**. The backend architecture remains excellent, but the frontend is significantly less production-ready than the previous audit indicated.

---

## SECTION 1: BUILD STATUS

| Check | Status | Count | Notes |
|-------|--------|-------|-------|
| Frontend `tsc --noEmit` | **FAIL** | 2 errors | BreachNotificationWizard + geminiService type mismatches |
| Server `npm install` | **FAIL** | 1 blocker | `nanoid@^5.1.7` does not exist (latest: 5.1.6) |
| Server `tsc --noEmit` | **FAIL** | 22 errors | Categorized below |
| Frontend Vite Build | **PASS** | 0 errors | 2578 modules → 79 chunks in 12.44s |
| Frontend npm audit | **WARN** | 21 high | Transitive dependencies |
| Server npm audit | **WARN** | 52 vulns | 7 low, 4 moderate, 40 high, 1 critical |

### 1.1 CRITICAL: Server Install Blocked — nanoid Version

**File:** `server/package.json`
**Lines:** 35, 171, 175, 179
**Regression introduced by:** Fix #5 / Fix #17 from previous remediation

```
npm error code ETARGET
npm error notarget No matching version found for nanoid@^5.1.7.
```

The previous remediation changed nanoid from `^5.0.7` to `^5.1.7`, but **nanoid 5.1.7 has never been published**. Latest v5 is `5.1.6`.

**Fix:** Change all `^5.1.7` → `^5.1.6` in `server/package.json` (4 occurrences).

### 1.2 Frontend TypeScript Errors (2)

| # | File | Line | Error |
|---|------|------|-------|
| 1 | `components/BreachNotificationWizard.tsx` | 393 | TS2345: Mapped contact objects missing `website` and `notes` fields required by `RegulatoryContact` type |
| 2 | `services/geminiService.ts` | 149 | TS2345: String passed where `{filename, content, type}[]` expected |

### 1.3 Server TypeScript Errors (22)

| Category | Count | Files | Root Cause |
|----------|-------|-------|------------|
| Missing module exports | 7 | `frameworkTemplateService.ts:78` | 6 state control exports (`NH_CONTROLS`, `MD_CONTROLS`, `MN_CONTROLS`, `NE_CONTROLS`, `RI_CONTROLS`, `VT_CONTROLS`) not defined; `OWASP_TOP10_CONTROLS` should be `OWASP_TOP_10_CONTROLS` |
| `null` vs `undefined` mismatch | 4 | `integrationsController.ts:1455,1579,1628,1713` | Prisma returns `null`, type expects `undefined` |
| Nonexistent Prisma fields | 3 | `integrationsController.ts:1465,1637` + `sodService.ts:861,863` | `evidenceId` not on EvidenceVersion; `settings` not on Organization select |
| Undefined WebRTC types | 3 | `vrCollaborativeReviewService.ts:2213,3382,3404` | `signalingConfig`, `WebRTCSessionConfig`, `WebRTCPeer` never imported |
| Missing computed properties | 2 | `dsaService.ts:553,563` | `totalReviewed` and `averageAppealTime` not in stats object |
| Duplicate property | 1 | `frameworkTemplateService.ts:1033` | Object literal has duplicate key |
| Property overwrite | 1 | `integrationsController.ts:1714` | `provider` specified twice |
| Name mismatch suggestion | 1 | `frameworkTemplateService.ts:85` | `OWASP_TOP10_CONTROLS` → `OWASP_TOP_10_CONTROLS` |

---

## SECTION 2: DEEP GREP SCAN — ALL FINDINGS

### 2.1 Mock/Demo Data in Frontend Components (CRITICAL)

**15 components use hardcoded mock/demo data with no backend API connectivity:**

| # | Component | Mock Constants | Backend Exists? | API Wired? |
|---|-----------|---------------|-----------------|------------|
| 1 | `MDMDashboard.tsx` | `MOCK_DEVICES` (12), `MOCK_POLICIES` (5), `MOCK_VIOLATIONS` (8), `MOCK_ACTION_LOG` (10) | **YES** — full Prisma CRUD, routes, service | **NO** |
| 2 | `SoDAnalysisDashboard.tsx` | `MOCK_RULES` (10), `MOCK_VIOLATIONS` (8), `MOCK_COMPENSATING_CONTROLS` (6) | **YES** — full Prisma CRUD, routes, service | **NO** |
| 3 | `SOXComplianceDashboard.tsx` | `MOCK_CONTROLS`, `MOCK_TESTS`, `MOCK_DEFICIENCIES`, `MOCK_WALKTHROUGHS` | Partial | **NO** |
| 4 | `AccountDeletionWorkflow.tsx` | `MOCK_REQUESTS`, `MOCK_SYSTEMS`, `MOCK_AUDIT` | Partial | **NO** |
| 5 | `PrivacyManagementPlatform.tsx` | `MOCK_DSARS` (5 types of mock arrays) | Partial | **NO** |
| 6 | `AIComplianceCopilot.tsx` | `MOCK_RESPONSES` (hardcoded AI responses) | YES (Gemini service) | **NO** |
| 7 | `AuditSimulator.tsx` | `MOCK_INTERVIEW_QUESTIONS` | YES (AI service) | **NO** |
| 8 | `BreachNotificationWizard.tsx` | `DEMO_BREACH_HISTORY`, `DEMO_TEMPLATES`, `DEMO_CONTACTS` | **YES** — full CRUD | **PARTIAL** (reads only, writes disconnected) |
| 9 | `EnvironmentalLifecycle.tsx` | `DEMO_PRODUCTS`, `DEMO_STAGES`, `DEMO_IMPACT_CATEGORIES`, `DEMO_IMPROVEMENTS`, `DEMO_REPORTS`, `DEMO_CIRCULAR` | No | **NO** |
| 10 | `PostMarketSurveillance.tsx` | `DEMO_PLANS`, `DEMO_INCIDENTS`, `DEMO_CAPAS`, `DEMO_RECALLS`, `DEMO_NON_CONFORMITIES`, `DEMO_REPORTS` | No | **NO** |
| 11 | `SBOMManager.tsx` | `DEMO_COMPONENTS`, `DEMO_VULNERABILITIES`, `DEMO_LICENSES`, `DEMO_REPOSITORIES`, `DEMO_REPORTS` | No | **NO** |
| 12 | `ESGReportingModule.tsx` | `DEMO_METRICS`, `DEMO_ESRS`, `DEMO_MATERIALITY`, `DEMO_SDG`, `DEMO_REPORTS` | No | **NO** |
| 13 | `DigitalProductPassport.tsx` | `DEMO_PRODUCTS`, `DEMO_MATERIALS`, `DEMO_CARBON`, `DEMO_SUPPLY_CHAIN`, `DEMO_VERSIONS`, `DEMO_SHARING` | No | **NO** |
| 14 | `ProductDecommissioning.tsx` | `DEMO_PRODUCTS`, `DEMO_WORKFLOW_TASKS`, `DEMO_DATA_PLANS`, `DEMO_NOTIFICATIONS` | No | **NO** |
| 15 | `CEMarkingWorkflow.tsx` | `DEMO_PRODUCTS`, `DEMO_NOTIFIED_BODIES`, `DEMO_REQUIREMENTS`, `DEMO_DOCUMENTS`, `DEMO_RISK_ITEMS`, `DEMO_SURVEILLANCE_CHECKS` | No | **NO** |

### 2.2 Security: devToken Leak (CRITICAL)

**1 active leak remains after remediation:**

| Path | File | Line | Status |
|------|------|------|--------|
| `requestMagicLink()` | `server/src/controllers/authController.ts` | ~110 | **FIXED** — `logger.debug()` only |
| `register()` existing user | `server/src/controllers/authController.ts` | **533** | **STILL LEAKING** — `response.devToken = token` |
| `register()` new user | `server/src/controllers/authController.ts` | ~592 | **FIXED** — `logger.debug()` only |

**Frontend consumers still active:**
- `components/LandingPage.tsx:121-122` — `if (response?.devToken) { setMockToken(response.devToken); }`
- `components/LandingPage.tsx:156-157` — Same pattern on register path
- `components/LandingPage.tsx:196` — `await verifyMagicLink(response.devToken)`
- `contexts/AuthContext.tsx:10,91,121` — Type definition and return handling for devToken

### 2.3 console.log in Production Code (MEDIUM)

| # | File | Line | Content |
|---|------|------|---------|
| 1 | `services/api.ts` | 9 | `console.log('API Base URL:', API_BASE_URL)` |
| 2 | `contexts/AuthContext.tsx` | 74 | `console.log('Token refreshed successfully')` |
| 3 | `contexts/AuthContext.tsx` | 90 | `` console.log(`Magic Link sent to ${email}`) `` |
| 4 | `components/DocsPage.tsx` | 194 | Inside code example string (acceptable) |

### 2.4 Hardcoded localhost URLs in Production Config (MEDIUM)

| # | File | Line | URL | Guarded? |
|---|------|------|-----|----------|
| 1 | `server/src/config/index.ts` | 101 | `apiUrl: process.env.API_URL \|\| 'http://localhost:3001'` | No |
| 2 | `server/src/config/index.ts` | 102 | `clientUrl: process.env.CLIENT_URL \|\| 'http://localhost:3000'` | No |
| 3 | `server/src/config/swagger.ts` | 52 | `url: \`${process.env.API_URL \|\| 'http://localhost:3001'}/api\`` | No |
| 4 | `services/api.ts` | 4 | `VITE_API_URL \|\| 'http://localhost:3001/api'` | Expected for frontend dev |
| 5 | `server/src/config/index.ts` | 168 | `brokerUrl: process.env.MQTT_BROKER_URL \|\| 'mqtt://localhost:1883'` | No |

### 2.5 localStorage Usage (LOW)

- `services/storage.ts` — **Gated** with `@deprecated` + production guard (Fix #10 applied)
- `services/api.ts` — Token storage in localStorage (standard browser pattern)
- `services/geminiService.ts` — Reads `authToken` from localStorage for API calls (standard)

### 2.6 TODO/FIXME Comments (LOW)

| # | File | Line | Content |
|---|------|------|---------|
| 1 | `server/src/examples/newPagesExamples.ts` | 669 | `// TODO: Send verification email with verificationToken` |
| 2 | `server/src/controllers/authController.ts` | ~110 | `// remove in production!` (inside logger.debug block) |
| 3 | `server/src/controllers/authController.ts` | ~592 | `// remove in production!` |

### 2.7 "Coming Soon" References (INFO)

- `components/IntegrationModal.tsx:220,231,264,276,1489` — Graceful handling of unimplemented integrations via 501 status. This is **acceptable** — it's UX for optional integrations, not missing core functionality.

### 2.8 No `@ts-ignore` / `@ts-nocheck` / `dangerouslySetInnerHTML` Found

Zero matches across entire codebase.

---

## SECTION 3: FEATURE-BY-FEATURE END-TO-END VERIFICATION

### 3.1 WorkflowBuilder — **92% Ready**

| Layer | Status |
|-------|--------|
| Prisma Models (`GRCWorkflow`, `WorkflowExecution`) | PASS — fully defined, indexed |
| Backend Routes (16 handlers) | PASS — all Prisma-backed |
| Frontend API Client (16 methods) | PASS — all have backend routes |
| Component → API wiring | PASS for 9/16 operations |

**Remaining gaps:**
- Edit button has no onClick handler (api.workflows.update exists but unused)
- "New Rule" button has no onClick handler (api.workflows.createRule exists but unused)
- Builder tab canvas always empty (nodes never loaded from workflow)
- Run retry not available in UI
- Only 2/8 templates have concrete node/edge definitions (others create empty workflows)

### 3.2 DORADashboard — **60% Ready**

| Layer | Status |
|-------|--------|
| Prisma Models (5 DORA models) | PASS — all defined with indexes |
| Backend Service (doraService.ts) | PASS — full CRUD + analytics |
| Backend Routes | PASS — all mounted at `/api/dora` |

**BLOCKING ISSUES:**
1. **URL path mismatch (404s):** Frontend calls `/dora/assessments` but backend serves `/dora/risk-assessments`. Frontend calls `/dora/providers` but backend serves `/dora/third-party-providers`. **7 endpoint calls will 404.**
2. **Response shape mismatch:** Service returns `{ data: [...], pagination: {...} }` but component expects `.assessments`, `.incidents`, `.providers`, `.tests` properties. All data arrays will be `undefined`.
3. **Add Risk / Report Incident modals** — Submit handlers only close the modal, never call API.
4. **Edit/Delete buttons** — No onClick handlers.

### 3.3 BreachNotificationWizard — **40% Ready**

| Layer | Status |
|-------|--------|
| Prisma Models (4 breach models) | PASS |
| Backend Controllers (12 operations) | PASS — fully implemented |
| Frontend Read Path | PASS — 3 list endpoints wired |
| Frontend Write Path | **FAIL** — 0 of 12 write operations connected |

**BLOCKING ISSUES:**
1. **"Complete & Archive" button** — Only sets tab, never persists wizard data. Entire session is lost.
2. **`addSubmission()` function** — Creates local-only state with fake IDs (`SUB-${Date.now()}`), never calls API.
3. **`generateLetters()` function** — Uses `setTimeout(fn, 2000)` to fake generation, never calls AI backend.
4. **Duplicate useEffect hooks** — Two `useEffect(() => {...}, [])` call the same 3 API methods, producing 6 requests instead of 3.
5. **Field name mismatches:** `portalUrl` vs `notificationUrl`, `content` vs `body`, `website` and `regulation` don't exist in Prisma model. Database data will display with empty fields.
6. **8 buttons have no onClick handlers** (New Template, Add Contact, Copy/Edit/Export template, Copy/Download/Edit letter).

### 3.4 Authentication & Security — **90% Ready**

| Area | Status |
|------|--------|
| JWT with refresh rotation | PASS |
| Token blacklist (SHA-256 hashed) | PASS |
| 2FA (TOTP + backup codes) | PASS (with encryption concern) |
| Helmet + CSP nonces | PASS |
| CORS locked down | PASS |
| CSRF double-submit cookie | PASS |
| Config validation at startup | PASS |
| Graceful shutdown | PASS |

**Remaining issues:**
1. **CRITICAL: `devToken` leak** at `authController.ts:533` — `response.devToken = token` still in register-existing-user path
2. **HIGH: 2FA encryption key** — Hardcoded fallback `'default-key'` and literal `'salt'` in `twoFactorService.ts:361,376`
3. **MEDIUM: Rate limiter skip** — `authLimiter`, `aiLimiter`, `frameworkLimiter` all use `skip: () => isDev` instead of higher limits

### 3.5 MDM Dashboard — **50% Ready** (backend 100%, frontend 0%)

| Layer | Status |
|-------|--------|
| Prisma Models (4 models, 30+ fields each) | PASS |
| Backend Service (full CRUD, analytics, compliance) | PASS |
| Backend Routes (auth, authorization, error handling) | PASS |
| Frontend Component | **FAIL** — 100% hardcoded mock data, zero API calls |

The backend MDM service is production-quality with proper simulation gating (`MDM_PROVIDER_URL` check, `simulated: true` flags). But `MDMDashboard.tsx` uses `const devices = MOCK_DEVICES` with zero imports from any API module. All action buttons (Lock, Wipe, Locate) close their modals without making requests.

### 3.6 SoD Analysis — **50% Ready** (backend 100%, frontend 0%)

| Layer | Status |
|-------|--------|
| Prisma Models (SoDRule, SoDViolation) | PASS |
| Backend Service (CRUD, analysis engine, matrix, analytics) | PASS |
| Backend Routes (full REST + analyze endpoint) | PASS |
| Frontend Component | **FAIL** — 100% hardcoded mock data, zero API calls |

`SoDAnalysisDashboard.tsx` assigns `const rules = MOCK_RULES` directly. All 5 tabs render from static data. Create Rule modal closes without API call. Mitigate/Accept/Remediate buttons have no handlers.

**Backend architectural limitation:** `runSoDAnalysis()` calls synchronous `expandUserRoles()` with its 4-role static mapping, never the async `expandUserRolesAsync()` that checks org-level custom mappings. Custom roles produce false negatives.

### 3.7 EU Regulation Services — **85% Ready**

- `euAiActService.ts` — Metrics now use `metadata.*` fields with `?? null` (Fix #12 applied). No fake 0/100.
- `dsaService.ts` — **2 TypeScript errors remain:** `totalReviewed` and `averageAppealTime` properties don't exist on the computed stats object (Fix #12 introduced these references without adding them to the object).

### 3.8 Other Services

| Service | Status | Notes |
|---------|--------|-------|
| `storage.ts` | GATED | `@deprecated`, production guard applied |
| `geminiService.ts` | FUNCTIONAL | `classifyEvidence()` uses AI + pattern fallback. **1 TS error** (string vs object[] argument) |
| `mdmService.ts` | PRODUCTION-READY | Simulation-gated, audit-logged |
| `sodService.ts` | MOSTLY READY | `expandUserRolesAsync` not called from analysis engine; Prisma schema missing `settings` on Organization |

---

## SECTION 4: DEPLOYMENT READINESS

### 4.1 Docker & Infrastructure — **STRONG**

| Check | Status | Notes |
|-------|--------|-------|
| Multi-stage Dockerfile (8 stages) | PASS | Non-root user (`complyeasy`, UID 1001) for backend |
| docker-compose.yml passwords | PASS | `${VAR:?Set VAR}` syntax (Fix #2 applied) |
| .dockerignore | PASS | Excludes .env, node_modules, .git |
| Health checks on all services | PASS | Docker + application-level (6 subsystems) |
| Dependency ordering | PASS | `service_healthy` / `service_completed_successfully` |
| CI/CD pipeline | PASS | Full pipeline: lint → test → build → deploy → verify |

### 4.2 Deployment Warnings (15)

| # | Severity | Finding | File:Line |
|---|----------|---------|-----------|
| W-1 | **HIGH** | Missing `app.set('trust proxy', 1)` — rate limiting ineffective behind reverse proxy | `server/src/index.ts` (missing) |
| W-2 | **HIGH** | Swagger packages in devDependencies but imported unconditionally — **production will crash** | `server/package.json:159-160` |
| W-3 | **HIGH** | No SSL enforcement for database in production | `server/src/config/database.ts:12-25` |
| W-4 | **MEDIUM** | Sentry packages in devDependencies (graceful fallback exists) | `server/package.json:124-125` |
| W-5 | **MEDIUM** | pgAdmin fallback password `admin123` (tools profile only) | `docker-compose.yml:277` |
| W-6 | **MEDIUM** | Elasticsearch password `changeme` in ELK compose | `docker-compose.elk.yml:10,55` |
| W-7 | **MEDIUM** | Nginx frontend stage runs as root | `Dockerfile:106-127` |
| W-8 | **MEDIUM** | OPA Dockerfile uses `latest` tag | `server/docker/opa/Dockerfile:1` |
| W-9 | **MEDIUM** | `.env.example` port 5000 vs system default 3001 | `server/.env.example:10` |
| W-10 | **MEDIUM** | CORS origin doesn't support multiple domains | `server/src/config/index.ts:162` |
| W-11 | **MEDIUM** | Security scans non-blocking in CI (`\|\| true`) | `.github/workflows/ci.yml:253-254` |
| W-12 | **MEDIUM** | Rate limiters skip entirely in dev (not just higher limit) | `server/src/middleware/rateLimiter.ts:34,42,49` |
| W-13 | **LOW** | Deprecated `csurf` package in deps (unused, custom CSRF exists) | `server/package.json:73` |
| W-14 | **LOW** | `aws-sdk` v2 alongside v3 (+70MB) | `server/package.json:66` |
| W-15 | **LOW** | Deprecated `version` field in docker-compose.elk.yml | `docker-compose.elk.yml:1` |

### 4.3 Infrastructure Strengths (Confirmed Working)

- Credential encryption at rest (AES-256-GCM for Integration tokens)
- Per-request CSP nonces (no `unsafe-inline` in production)
- HSTS with preload (1 year, includeSubDomains)
- Token revocation via SHA-256 hashed blacklist with Redis backend
- Structured logging with sanitization (Winston + Elasticsearch)
- Error handler hides stack traces in production
- Graceful shutdown (SIGTERM/SIGINT, 30s timeout)
- Config validation (12 env vars validated at startup, server exits on failure)
- Connection pooling (configurable via `DB_POOL_SIZE`, `DB_POOL_TIMEOUT`)
- Well-indexed Prisma schema (207 models, 635 `@@index` directives)

---

## SECTION 5: CLASSIFIED FINDINGS

### CRITICAL (4)

| # | Finding | File:Line | Impact |
|---|---------|-----------|--------|
| C-1 | **nanoid `^5.1.7` does not exist** — server `npm install` completely blocked | `server/package.json:35,171,175,179` | Cannot deploy server at all |
| C-2 | **devToken leak** in register-existing-user HTTP response | `server/src/controllers/authController.ts:533` | Magic link tokens exposed in API responses |
| C-3 | **Swagger in devDependencies** but imported unconditionally — production server crash at startup | `server/package.json:159-160` | Server won't start in production Docker |
| C-4 | **Missing `trust proxy`** — rate limiting and audit logs use proxy IP, not client IP | `server/src/index.ts` (missing) | All requests appear from same IP behind any reverse proxy |

### HIGH (14)

| # | Finding | File:Line |
|---|---------|-----------|
| H-1 | 2FA encryption uses hardcoded fallback `'default-key'` and literal `'salt'` | `server/src/services/twoFactorService.ts:361,376` |
| H-2 | MDMDashboard.tsx: 100% mock data, zero API connectivity (backend fully built) | `components/MDMDashboard.tsx:95-154` |
| H-3 | SoDAnalysisDashboard.tsx: 100% mock data, zero API connectivity (backend fully built) | `components/SoDAnalysisDashboard.tsx:48-117` |
| H-4 | DORADashboard: URL path mismatches cause 404s for assessments and providers | `services/api.ts` (DORA section) |
| H-5 | DORADashboard: Response shape mismatch (expects `.assessments`, gets `.data`) | `components/DORADashboard.tsx` (useEffect) |
| H-6 | BreachNotificationWizard: 12 write operations exist in backend but 0 connected in frontend | `components/BreachNotificationWizard.tsx` |
| H-7 | BreachNotificationWizard: Field name mismatches (`portalUrl`/`notificationUrl`, `content`/`body`) | `components/BreachNotificationWizard.tsx:393-460` |
| H-8 | 7 missing state control exports cause TS errors | `server/src/services/frameworkTemplateService.ts:78` |
| H-9 | 3 undefined WebRTC types cause TS errors | `server/src/services/advanced/vrCollaborativeReviewService.ts` |
| H-10 | SOXComplianceDashboard.tsx: 100% mock data | `components/SOXComplianceDashboard.tsx:51-113` |
| H-11 | PrivacyManagementPlatform.tsx: 100% mock data (5 mock arrays) | `components/PrivacyManagementPlatform.tsx:115-152` |
| H-12 | AccountDeletionWorkflow.tsx: 100% mock data | `components/AccountDeletionWorkflow.tsx:91-113` |
| H-13 | No SSL enforcement for database connections in production | `server/src/config/database.ts:12-25` |
| H-14 | SoD analysis uses static role mapping, ignores async org-level custom mappings | `server/src/services/sodService.ts:418` |

### MEDIUM (15)

| # | Finding | File:Line |
|---|---------|-----------|
| M-1 | AIComplianceCopilot.tsx: Hardcoded MOCK_RESPONSES instead of AI backend | `components/AIComplianceCopilot.tsx:284` |
| M-2 | AuditSimulator.tsx: MOCK_INTERVIEW_QUESTIONS | `components/AIFeatures/AuditSimulator.tsx:260` |
| M-3 | EnvironmentalLifecycle.tsx: 6 DEMO_ arrays, no backend | `components/EnvironmentalLifecycle.tsx:114-251` |
| M-4 | PostMarketSurveillance.tsx: 6 DEMO_ arrays, no backend | `components/PostMarketSurveillance.tsx:174-269` |
| M-5 | SBOMManager.tsx: 5 DEMO_ arrays, no backend | `components/SBOMManager.tsx:106-160` |
| M-6 | ESGReportingModule.tsx: 5 DEMO_ arrays, no backend | `components/ESGReportingModule.tsx:123-200` |
| M-7 | DigitalProductPassport.tsx: 6 DEMO_ arrays, no backend | `components/DigitalProductPassport.tsx:167-315` |
| M-8 | ProductDecommissioning.tsx: 4 DEMO_ arrays, no backend | `components/ProductDecommissioning.tsx:102-190` |
| M-9 | CEMarkingWorkflow.tsx: 6 DEMO_ arrays, no backend | `components/CEMarkingWorkflow.tsx:182-350` |
| M-10 | console.log in `services/api.ts:9` (API Base URL leaked to console) | `services/api.ts:9` |
| M-11 | console.log in `contexts/AuthContext.tsx:74,90` (auth flow details) | `contexts/AuthContext.tsx:74,90` |
| M-12 | `authLimiter`, `aiLimiter`, `frameworkLimiter` skip entirely in dev mode | `server/src/middleware/rateLimiter.ts:34,42,49` |
| M-13 | DSA service references `totalReviewed` and `averageAppealTime` which don't exist on stats object | `server/src/services/euRegulations/dsaService.ts:553,563` |
| M-14 | `.env.example` port 5000 mismatches system default 3001 | `server/.env.example:10` |
| M-15 | 4 null/undefined mismatches in integrationsController | `server/src/controllers/integrationsController.ts:1455,1579,1628,1713` |

### LOW / INFO (16)

| # | Finding | File:Line |
|---|---------|-----------|
| L-1 | Hardcoded localhost fallbacks for `apiUrl`, `clientUrl`, `brokerUrl` in config | `server/src/config/index.ts:101,102,168` |
| L-2 | pgAdmin default password `admin123` (tools profile only) | `docker-compose.yml:277` |
| L-3 | Elasticsearch password `changeme` in ELK compose | `docker-compose.elk.yml:10,55` |
| L-4 | Nginx frontend runs as root | `Dockerfile:106-127` |
| L-5 | OPA Dockerfile uses `latest` tag | `server/docker/opa/Dockerfile:1` |
| L-6 | CORS origin single string, no multi-domain support | `server/src/config/index.ts:162` |
| L-7 | CI security scans non-blocking (`\|\| true`) | `.github/workflows/ci.yml:253-254` |
| L-8 | Deprecated `csurf` package in deps (custom CSRF middleware used) | `server/package.json:73` |
| L-9 | `aws-sdk` v2 alongside v3 (+70MB image bloat) | `server/package.json:66` |
| L-10 | Deprecated `version` in docker-compose.elk.yml | `docker-compose.elk.yml:1` |
| L-11 | Duplicate property in frameworkTemplateService | `server/src/services/frameworkTemplateService.ts:1033` |
| L-12 | Provider overwrite in integrationsController | `server/src/controllers/integrationsController.ts:1714` |
| L-13 | `IntegrationModal.tsx` "coming soon" handling | `components/IntegrationModal.tsx` (acceptable UX) |
| L-14 | TODO in examples file | `server/src/examples/newPagesExamples.ts:669` |
| L-15 | WorkflowBuilder: Edit/NewRule/Builder/Retry UI not connected (APIs exist) | `components/WorkflowBuilder.tsx` |
| L-16 | BreachNotificationWizard: Duplicate useEffect (6 requests instead of 3) | `components/BreachNotificationWizard.tsx` |

---

## SECTION 6: REMEDIATION STATUS FROM PREVIOUS AUDIT

| Fix # | Description | Status | Verified? | Regression? |
|-------|-------------|--------|-----------|-------------|
| 1 | `@types/node` | Env issue | N/A | No |
| 2 | docker-compose passwords | **APPLIED** | Yes — `${VAR:?Set VAR}` syntax | No |
| 3 | Swagger dynamic URL | **APPLIED** | Yes — uses `API_URL` env var | No |
| 4 | CORS localhost removed | **APPLIED** | Yes — defaults to `''` | No |
| 5 | nanoid version | **APPLIED BUT BROKEN** | **REGRESSION** | **Yes — `^5.1.7` doesn't exist** |
| 6 | WorkflowBuilder API | **APPLIED** | Yes — 9/16 operations wired | No |
| 7 | DORADashboard API | **PARTIALLY APPLIED** | **URL path mismatches cause 404s** | Yes (introduced bugs) |
| 8 | BreachNotificationWizard | **PARTIALLY APPLIED** | Reads work, writes disconnected | **Type errors introduced** |
| 9 | MDM provider gating | **APPLIED** | Yes — simulated flag works | No |
| 10 | localStorage guard | **APPLIED** | Yes — production guard works | No |
| 11 | classifyEvidence() | **APPLIED** | Has TS error (string vs object[]) | **Minor regression** |
| 12 | EU regulation metrics | **PARTIALLY APPLIED** | DSA has TS errors (missing properties) | **Introduced TS errors** |
| 13 | SoD IAM integration | **PARTIALLY APPLIED** | Async method exists but never called from analysis | **Not effective** |
| 14 | devToken removal | **2/3 PATHS FIXED** | Line 533 still leaks | **Incomplete** |
| 15 | console.log removal | **3/5 FILES FIXED** | api.ts and AuthContext.tsx remain | **Incomplete** |
| 16 | Rate limiter fix | **PARTIAL** | apiLimiter fixed; 3 others still skip entirely | **Incomplete** |
| 17 | npm overrides | **APPLIED BUT BROKEN** | nanoid `^5.1.7` doesn't exist | **Regression** |
| 18 | Connection pooling | **APPLIED** | Yes — `buildDatabaseUrl()` works | No |

**Score: 8 fully applied, 6 partially applied, 2 regressions introduced, 2 incomplete**

---

## SECTION 7: PRIORITY FIX LIST

### Immediate (Pre-Deploy)

| Priority | Fix | Effort |
|----------|-----|--------|
| P0 | Fix nanoid to `^5.1.6` (4 occurrences in server/package.json) | 5 min |
| P0 | Fix devToken leak at authController.ts:533 | 5 min |
| P0 | Move swagger-jsdoc and swagger-ui-express to dependencies (or gate behind NODE_ENV) | 5 min |
| P0 | Add `app.set('trust proxy', 1)` in server/src/index.ts | 2 min |

### Before Production Release

| Priority | Fix | Effort |
|----------|-----|--------|
| P1 | Fix DORA URL path mismatches (assessments → risk-assessments, providers → third-party-providers) | 15 min |
| P1 | Fix DORA response shape (.data instead of .assessments/.incidents) | 15 min |
| P1 | Remove 2FA encryption fallback key, use random salt | 15 min |
| P1 | Connect MDMDashboard.tsx to backend API (backend is complete) | 2 hrs |
| P1 | Connect SoDAnalysisDashboard.tsx to backend API (backend is complete) | 2 hrs |
| P1 | Wire BreachNotificationWizard write operations to backend | 2 hrs |
| P1 | Fix 7 missing state control exports in additionalStatePrivacyControls.ts | 30 min |
| P1 | Add SSL enforcement for production database connections | 10 min |
| P1 | Remove remaining console.log (api.ts:9, AuthContext.tsx:74,90) | 5 min |

### Hardening

| Priority | Fix | Effort |
|----------|-----|--------|
| P2 | Connect remaining 7 mock/demo frontend components to backend APIs | 1-2 days each |
| P2 | Fix all 22 server TypeScript errors | 2-4 hrs |
| P2 | Fix rate limiter skip behavior (use higher limits instead of skip) | 15 min |
| P2 | Run Nginx as non-root, pin OPA version | 15 min |
| P2 | Make CI security scans blocking | 10 min |
| P2 | Remove deprecated csurf, aws-sdk v2 | 30 min |
| P2 | Address npm audit vulnerabilities | 1-2 hrs |

---

## APPENDIX A: CODEBASE METRICS

| Metric | Value |
|--------|-------|
| Total TypeScript/TSX files | 648 |
| Total lines of code | 386,488 |
| Prisma schema models | 207 |
| Prisma schema indexes | 635 |
| Backend routes | 200+ |
| Frontend components | 120+ |
| Components with mock data | 15 (12.5%) |
| Components fully API-wired | 105+ (87.5%) |
| Server TypeScript errors | 22 |
| Frontend TypeScript errors | 2 |
| npm vulnerabilities (total) | 73 (21 frontend + 52 server) |
| CI/CD pipeline stages | 10 |
| Docker build stages | 8 |
| Config env vars validated at startup | 12 |

---

*Report generated by automated forensic scan. All file paths and line numbers verified against commit `a7f7f9d` on `main` branch.*
