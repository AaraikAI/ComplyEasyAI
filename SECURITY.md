# Security Policy

## Reporting a Vulnerability

If you discover a security issue in ComplyEasyAI, please email **security@aaraik.ai** with:

- A description of the issue
- Reproduction steps (or proof-of-concept)
- The affected component / file path
- Your assessment of impact

We will acknowledge within **48 hours** and aim to provide a remediation timeline within **5 business days** for confirmed issues. Do not publicly disclose until we have shipped a fix or 90 days have elapsed, whichever is sooner.

## Supported Versions

| Version | Status            |
|---------|-------------------|
| `main`  | Supported         |
| Tagged releases ≥ v2 | Supported (12 months) |
| Anything older | Not supported    |

## Security Posture (Reference)

The canonical production-readiness assessment is the latest `PRODUCTION_READINESS_REPORT.md` (refreshed each audit cycle); refer to it for the current score and finding counts rather than a pinned figure here. Highlights of the current posture:

- **Auth:** JWT in httpOnly cookies, PBKDF2-SHA256 (600k iterations), passport-jwt, refresh-token rotation, token blacklist on logout/rotate.
- **Multi-tenant:** every user-scoped query is filtered by `organizationId` at the service layer; v9–v11 audits verified parent-child entity scope on writes.
- **SSRF:** `isUrlSafe()` / `isWebhookUrlSafe()` block private IP ranges + DNS-rebinding; F7 audit reviewed 97 outbound call-sites.
- **ReDoS:** `safeRegexTest` wrapper backed by `re2` (linear-time engine); call-site verified per v10/v11 T25.
- **Crypto-at-rest:** AES-256-GCM for OAuth tokens, integration credentials, webhook secrets.
- **Rate limiting:** every API mount is covered by a Redis-backed limiter (auth/SSO/SCIM use generous mode-specific limiters).
- **Headers:** Helmet, strict CSP, HSTS, frame-ancestors deny.
- **Logging:** Winston JSON to Elasticsearch + Sentry conditional on `SENTRY_ENABLED`.

## Known Unfixable Upstream Vulnerabilities

Current `npm audit`: **root = 0 vulnerabilities; server = 29 (0 critical, 0 high, 15 moderate, 14 low).** The previously-flagged `dompurify` and `tmp` HIGH advisories are now fixed. Every remaining advisory below requires a breaking-major upgrade of a toolchain dependency (ethers v6 / aws-sdk v3 / circom / fabric-network majors), which is out-of-scope dependency-replacement work rather than a code fix. We have triaged each one and accepted the residual risk because the exposure is build-time / dev-time / library-internal — not runtime user-exposed surface. Tracked here for diligence-disclosure reasons; revisited weekly via the dependency-scan workflow.

| Package | Severity | Used By | Why Unfixable | Exploit Profile |
|---------|----------|---------|---------------|-----------------|
| `elliptic *` | Low | `fabric-network` (Hyperledger Fabric crypto) → `fabric-common`; also via `aws-sdk` | All published versions are flagged for ECDSA signature-malleability and timing variants. No fixed release upstream; a fix requires a `fabric-network` major. | **Low for our usage.** `fabric-network` is wired only for the optional federated-evidence ledger feature (off by default). The crypto path is server-internal; signatures are not attacker-supplied at runtime. |
| `aws-sdk v2` (→ `uuid`) | Moderate | residual code paths still on v2 (most code migrated to v3) | Migration to AWS SDK v3 is its own tracked project. Already in flight: `@aws-sdk/client-s3`, `client-cloudwatch`, `client-secrets-manager`, etc. are v3. | **Low.** v2 only used by a small number of legacy modules; no known direct-RCE or data-exfil exploit, only deprecation warnings + minor parser issues. |
| `ws 8.0.0–8.20.0` | Moderate | `ethers` / `@ethersproject/providers` | Fix requires the ethers v6 major (breaking). | **Low.** Used by the optional blockchain-anchoring path; not on the request-handling hot path. |
| `@ethersproject/*` / `ethers` | Low/Moderate | ethers v5 line | Fix requires the ethers v6 major (breaking). | **Low.** Optional blockchain-anchoring feature; server-internal. |
| `serialize-javascript` | Moderate | `mocha` ← `ffjavascript` ← `circom_runtime` (test-time only) | `mocha`/`circom` pin it transitively; a fix needs a circom major (breaking). Overridden to `7.0.4` where allowed. | **Build-time only.** `mocha` and `circom_runtime` are devDependencies; never reach production. The XSS surface requires attacker-controlled JSON serialized into `<script>` — no such path in our test suite. |
| `uuid` (via `@azure/ms-rest-js`, `exceljs`, `jest-junit`) | Moderate | reporting / Azure SDK toolchain | Needs major bumps of those parents (breaking). | **Low.** Library-internal ID generation; not a runtime user-exposed surface. |
| `circom` / `circom_runtime` / `ffjavascript` / `mocha` | Moderate | ZK-circuit toolchain (dev/build only) | A fix requires a circom major (breaking). | **Build-time only.** ZK toolchain devDependencies; never bundled into the runtime server. |
| `fabric-common` / `fabric-network` | Low | Hyperledger SDK | A fix requires a fabric major (breaking). | **Low.** Optional federated-evidence ledger feature (off by default). |

### Re-evaluation Cadence

A weekly GitHub Actions workflow (`.github/workflows/dependency-scan.yml`) re-runs `npm audit` and posts a delta against this list. Any *new* high/critical that is **fixable** triggers a P1 ticket. The unfixable set above is suppressed from the alert but not from the scan output.

## Static Analysis Gating (CodeQL)

CodeQL runs from a single canonical workflow (`.github/workflows/codeql.yml`,
"CodeQL Advanced"): all actions are SHA-pinned, the top-level token is
least-privilege (`contents: read`), and it scans both the `actions` and
`javascript-typescript` query packs (`security-and-quality`) on push, pull
request, and a weekly cron.

**Operational requirement (set in GitHub, not in source):** the
`Analyze (javascript-typescript)` status check MUST be configured as a *required*
status check in branch-protection for `main`. The workflow itself cannot enforce
merge-gating; without the branch-protection rule, a failing CodeQL run does not
block merges. Verify this rule remains enabled whenever branch-protection is changed.

## Cryptography Inventory

| Use case | Algorithm | Library |
|----------|-----------|---------|
| Password hashing | PBKDF2-SHA256, 600k iterations | Node `crypto` |
| Session tokens | JWT HS256 (rotated) | `jsonwebtoken` |
| At-rest field encryption | AES-256-GCM | Node `crypto` |
| TLS termination | TLS 1.2+ (1.3 preferred) | nginx / ALB |
| File integrity | SHA-256 | Node `crypto` |
| SAML signature verification | XML-DSig (xml-crypto) | `xml-crypto` |

## Secret Management

Production secrets are loaded from AWS Secrets Manager via the IAM role attached to the runtime task; nothing is committed to the repo. `.env.example` documents the required variable surface. CI/CD does not have access to production secrets — staging and production each use scoped IAM roles.

## Incident Response

- On-call rotation pages via PagerDuty.
- Post-incident review within 5 business days.
- GDPR Art. 33 / HIPAA Breach Notification Rule timers (72h / 60d) are tracked in the platform itself (see `IncidentManagement` + `breach` module).
