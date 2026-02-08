# NPM Audit – Remaining Advisories After `npm audit fix`

**Last updated:** After running `npm audit fix` (without `--force`) in server and root.

## Server (complyeasy-server)

**Remaining:** 11 vulnerabilities (8 low, 3 moderate).

| Package / issue | Severity | Fix | Notes |
|-----------------|----------|-----|--------|
| **aws-sdk** (region validation) | High | `npm audit fix --force` → aws-sdk@1.18.0 | Breaking; prefer validating `region` in code or migrating to AWS SDK v3. |
| **cookie** (csurf, elastic-apm-node) | Low | `npm audit fix --force` → csurf@1.2.2 | Breaking; app uses custom CSRF (csrf.ts) and cookie-parser. |
| **elliptic** (fabric-network) | Low | `npm audit fix --force` → fabric-network@1.4.20 | Breaking; only relevant if using Hyperledger Fabric. |
| **js-yaml, nanoid** (circom/mocha) | Moderate | In nested circom/mocha | Dev/test dependency tree; low runtime impact. |

**Recommendation:** Do not run `npm audit fix --force` on server without a change request; validate region for aws-sdk in code and plan v3 migration. Document fabric-network/cookie usage for security reviews.

---

## Root (complyeasy-ai frontend + tooling)

**Remaining:** 13 vulnerabilities (9 moderate, 4 high).

| Package / issue | Severity | Fix | Notes |
|-----------------|----------|-----|--------|
| **path-to-regexp** (via @vercel/node) | High | `npm audit fix --force` → vercel@32.0.1 | Breaking; Vercel is a dev/build dependency. |
| **undici** (via @vercel/node) | Moderate | Same as above | Same Vercel upgrade path. |

**Recommendation:** Upgrade Vercel in a separate change; test build and deploy before merging. Remaining advisories are in the Vercel toolchain, not application runtime code.

---

## Checklist

- [x] Run `npm audit fix` (no `--force`) in server and root.
- [ ] Plan aws-sdk region validation or v3 migration (server).
- [ ] Plan Vercel upgrade for path-to-regexp/undici (root).
- [ ] Re-run `npm audit` after any dependency upgrade and update this file.
