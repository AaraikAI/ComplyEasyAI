# Security Exceptions Register

**Project:** ComplyEasyAI
**Version:** 3.0.0 Enterprise Edition
**Last Updated:** 2026-03-11
**Review Cadence:** Quarterly (next review: 2026-06-11)

---

## SEC-EX-001: Blockchain / zk-SNARK Transitive Dependency Vulnerabilities

| Field | Value |
|-------|-------|
| **Status** | ACCEPTED |
| **Risk Level** | Medium |
| **Owner** | Engineering Lead |
| **Accepted By** | [Name / Date] |
| **Expires** | 2026-06-11 (re-evaluate quarterly) |

### Affected Packages

| Package | Severity | Advisory | CVE / GHSA |
|---------|----------|----------|------------|
| `circom` (>=0.5.38) | High | Depends on vulnerable `circom_runtime` | Transitive |
| `circom_runtime` (0.1.10 - 0.1.12) | High | Depends on vulnerable `ffjavascript` | Transitive |
| `ffjavascript` (0.2.33 - 0.2.34) | High | Depends on vulnerable `mocha` | Transitive |
| `serialize-javascript` (<=7.0.2) | High | RCE via RegExp.flags and Date.prototype.toISOString() | [GHSA-5c6j-r48x-rmvq](https://github.com/advisories/GHSA-5c6j-r48x-rmvq) |
| `mocha` (8.0.0 - 12.0.0-beta-2) | High | Depends on vulnerable `serialize-javascript` | Transitive |
| `fabric-network` (>=1.4.21-snapshot.1) | Low | Depends on vulnerable `fabric-common` | Transitive |
| `fabric-common` (>=1.4.21-snapshot.1) | Low | Depends on vulnerable `elliptic` | Transitive |
| `elliptic` (<=6.6.1) | Low | Risky cryptographic implementation | [GHSA-848j-6mx2-7j84](https://github.com/advisories/GHSA-848j-6mx2-7j84) |
| `aws-sdk` (>=2.0.0) | Low | Region parameter validation | [GHSA-j965-2qgj-vjmq](https://github.com/advisories/GHSA-j965-2qgj-vjmq) |
| `@tootallnate/once` (<3.0.1) | Low | Incorrect control flow scoping | [GHSA-vpq2-c234-7xj6](https://github.com/advisories/GHSA-vpq2-c234-7xj6) |
| `@google-cloud/kms` (>=5.0.0) | Low | Transitive via `google-gax` | Transitive |
| `@google-cloud/vision` (>=5.0.0) | Low | Transitive via `google-gax` | Transitive |

### Risk Assessment

1. **Not in the request-handling path.** The blockchain/zk-SNARK packages (`circom`, `circom_runtime`, `ffjavascript`, `snarkjs`) are used exclusively for zero-knowledge proof features. These features are opt-in and gated behind the Visionary tier. Standard GRC compliance workflows do not invoke these code paths.

2. **No exploitable attack surface for standard API usage.** The vulnerable `serialize-javascript` package is a transitive dependency of `mocha` (a test runner), which is itself a transitive dependency of `ffjavascript`. It is not used in the application's serialization logic.

3. **Fabric/Hyperledger packages** are used for blockchain-based audit trail features. The `elliptic` vulnerability relates to a risky implementation pattern, not a known exploitable attack. These packages are only invoked when blockchain integration is explicitly configured via environment variables.

4. **AWS SDK v2** is used for legacy AWS integrations. The vulnerability requires an attacker to control the `region` parameter, which is set via server-side configuration, not user input.

### Mitigations

- All blockchain features are behind feature tier gates (`requireVisionaryFeature` middleware)
- Blockchain endpoints require authentication and authorization
- No user-supplied input flows directly into vulnerable code paths
- Rate limiting is applied to all API endpoints

### Monitoring Plan

- [ ] Monitor upstream `snarkjs` and `circom` repos for new releases with updated transitive dependencies
- [ ] Monitor `fabric-network` for a release that updates `elliptic`
- [ ] Track `serialize-javascript` v8.0.0+ availability
- [ ] Re-run `npm audit` on each release cycle
- [ ] Consider migrating to `@aws-sdk/client-*` (v3) to resolve `aws-sdk` v2 advisory

### Long-Term Remediation

Consider isolating blockchain features into a separate microservice or optional npm package to decouple the vulnerability surface from the core GRC platform. This would allow the core platform to pass `npm audit` with zero findings.

---

## SEC-EX-002: Rollup Path Traversal in Source Maps (Frontend Dev Dependency)

| Field | Value |
|-------|-------|
| **Status** | ACCEPTED |
| **Risk Level** | Low |
| **Advisory** | [GHSA-mw96-cpmx-2vgc](https://github.com/advisories/GHSA-mw96-cpmx-2vgc) |

### Assessment

Rollup (4.0.0 - 4.58.0) has an arbitrary file write vulnerability via path traversal in source maps. This is a **build-time dependency** only (transitive via Vite). It does not ship in the production Docker image and is not present at runtime. The vulnerability requires a malicious plugin or crafted input during the build process.

### Mitigation

- Only trusted Vite/Rollup plugins are used
- CI/CD builds run in isolated containers
- Production images use multi-stage builds that exclude all dev dependencies
- Monitor for Vite update that bumps Rollup past 4.58.0

---

*This document should be reviewed and signed off by the security team before each audit cycle.*
