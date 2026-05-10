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

The current production-readiness score is **97.51%** (see `PRODUCTION_READINESS_REPORT.md` v16). Highlights:

- **Auth:** JWT in httpOnly cookies, PBKDF2-SHA256 (600k iterations), passport-jwt, refresh-token rotation, token blacklist on logout/rotate.
- **Multi-tenant:** every user-scoped query is filtered by `organizationId` at the service layer; v9–v11 audits verified parent-child entity scope on writes.
- **SSRF:** `isUrlSafe()` / `isWebhookUrlSafe()` block private IP ranges + DNS-rebinding; F7 audit reviewed 97 outbound call-sites.
- **ReDoS:** `safeRegexTest` wrapper backed by `re2` (linear-time engine); call-site verified per v10/v11 T25.
- **Crypto-at-rest:** AES-256-GCM for OAuth tokens, integration credentials, webhook secrets.
- **Rate limiting:** 70/70 mounts covered after the v16 patch (auth/SSO/SCIM use generous mode-specific limiters).
- **Headers:** Helmet, strict CSP, HSTS, frame-ancestors deny.
- **Logging:** Winston JSON to Elasticsearch + Sentry conditional on `SENTRY_ENABLED`.

## Known Unfixable Upstream Vulnerabilities

These vulnerabilities live in transitive dependencies for which **no patched upstream version exists** at this writing. We have triaged each one and accepted the residual risk because the exposure is build-time / dev-time / library-internal — not runtime user-exposed surface. Tracked here for diligence-disclosure reasons; revisited weekly via the dependency-scan workflow.

| Package | Severity | Used By | Why Unfixable | Exploit Profile |
|---------|----------|---------|---------------|-----------------|
| `lodash 4.x` | Moderate | `chevrotain`, `prisma` (transitive) | No `lodash` 5.x exists. Prototype-pollution variants require attacker-controlled keys passed to `_.set` / `_.merge` paths. | **Low.** lodash methods here are called on internal AST/schema objects that never receive untrusted input. No reachable user-controlled call path. |
| `elliptic *` | High | `fabric-network` (Hyperledger Fabric crypto) | All published versions are flagged for ECDSA signature-malleability and timing variants. No fixed release upstream. | **Low for our usage.** `fabric-network` is wired only for the optional federated-evidence ledger feature (off by default). The crypto path is server-internal; signatures are not attacker-supplied at runtime. |
| `aws-sdk v2` | Low | residual code paths still on v2 (most code migrated to v3) | Migration to AWS SDK v3 is its own project. Already in flight: `@aws-sdk/client-s3`, `client-cloudwatch`, `client-secrets-manager`, etc. are v3. | **Low.** v2 only used by a small number of legacy modules; no known direct-RCE or data-exfil exploit, only deprecation warnings + minor parser issues. |
| `serialize-javascript ≤7.0.2` | High | `mocha@8.4.0` ← `circom_runtime` (test-time only) | `mocha@8.4.0` pins an exact `serialize-javascript@5.0.1`. npm `overrides` cannot relax an exact-version pin from a parent. | **Build-time only.** `mocha` and `circom_runtime` are devDependencies; never reach production. The XSS surface in `serialize-javascript` requires attacker-controlled JSON serialized into `<script>` — no such path in our test suite. |
| `effect <3.20.0` | High | `@prisma/config` ← `prisma` | Prisma's own `@prisma/config` requires older `effect`. Awaiting Prisma upstream upgrade. | **Build-time only.** `effect` used during Prisma schema generation / config evaluation. Not bundled into the runtime server. |

### Re-evaluation Cadence

A weekly GitHub Actions workflow (`.github/workflows/dependency-scan.yml`) re-runs `npm audit` and posts a delta against this list. Any *new* high/critical that is **fixable** triggers a P1 ticket. The unfixable set above is suppressed from the alert but not from the scan output.

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
