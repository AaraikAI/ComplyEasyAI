# 📋 NPM Audit Vulnerabilities Report

**Date:** 2026-01-16  
**Total Vulnerabilities:** 25  
**Breakdown:** 3 Critical, 5 High, 3 Moderate, 14 Low

---

## 🔴 CRITICAL SEVERITY (3 vulnerabilities)

### 1. form-data <2.5.4
- **Package:** `form-data` (via `postman-request`)
- **Vulnerability:** Uses unsafe random function in form-data for choosing boundary
- **CVE/GHSA:** [GHSA-fjxv-7rqg-78g4](https://github.com/advisories/GHSA-fjxv-7rqg-78g4)
- **Location:** `node_modules/postman-request/node_modules/form-data`
- **Fix Available:** Yes (via `npm audit fix --force`)
- **Breaking Change:** Will install `node-vault@0.9.22`
- **Impact:** Security weakness in random number generation for form boundaries

### 2. node-vault
- **Package:** `node-vault` (0.9.22-canary.0 || >=0.9.23-canary.1)
- **Vulnerability:** Depends on vulnerable `postman-request`
- **Location:** `node_modules/node-vault`
- **Fix Available:** Yes (via `npm audit fix --force`)
- **Breaking Change:** Will install `node-vault@0.9.22`
- **Impact:** Inherits vulnerabilities from `postman-request` (form-data, qs, tough-cookie)

### 3. postman-request
- **Package:** `postman-request` (all versions)
- **Vulnerability:** Depends on multiple vulnerable packages:
  - `form-data` (critical)
  - `qs` (high)
  - `tough-cookie` (moderate)
- **Location:** `node_modules/postman-request`
- **Fix Available:** Yes (via `npm audit fix --force`)
- **Breaking Change:** Will install `node-vault@0.9.22`
- **Impact:** Multiple security vulnerabilities in HTTP request library

---

## 🟠 HIGH SEVERITY (5 vulnerabilities)

### 4. jsrsasign <11.0.0
- **Package:** `jsrsasign`
- **Vulnerability:** Marvin Attack of RSA and RSAOAEP decryption
- **CVE/GHSA:** [GHSA-rh63-9qcf-83gf](https://github.com/advisories/GHSA-rh63-9qcf-83gf)
- **Location:** `node_modules/jsrsasign`
- **Fix Available:** Yes (via `npm audit fix --force`)
- **Breaking Change:** Will install `fabric-network@1.4.20`
- **Impact:** Cryptographic vulnerability in RSA decryption

### 5. minimatch <3.0.5
- **Package:** `minimatch` (via `mocha`)
- **Vulnerability:** ReDoS (Regular Expression Denial of Service)
- **CVE/GHSA:** [GHSA-f8q6-p94x-37v3](https://github.com/advisories/GHSA-f8q6-p94x-37v3)
- **Location:** `node_modules/mocha/node_modules/minimatch`
- **Fix Available:** Yes (via `npm audit fix`)
- **Impact:** Potential DoS attack through malicious regex patterns

### 6. qs <6.14.1
- **Package:** `qs` (via `postman-request`)
- **Vulnerability:** arrayLimit bypass in bracket notation allows DoS via memory exhaustion
- **CVE/GHSA:** [GHSA-6rw7-vpxm-498p](https://github.com/advisories/GHSA-6rw7-vpxm-498p)
- **Location:** `node_modules/postman-request/node_modules/qs`
- **Fix Available:** Yes (via `npm audit fix`)
- **Impact:** Memory exhaustion attack through query string parsing

### 7. fabric-common >=1.4.21-snapshot.1
- **Package:** `fabric-common`
- **Vulnerability:** Depends on vulnerable versions of:
  - `elliptic` (low - risky crypto implementation)
  - `jsrsasign` (high - Marvin Attack)
- **Location:** `node_modules/fabric-common`
- **Fix Available:** Yes (via `npm audit fix --force`)
- **Breaking Change:** Will install `fabric-network@1.4.20`
- **Impact:** Inherits cryptographic vulnerabilities

### 8. fabric-network >=1.4.21-snapshot.1
- **Package:** `fabric-network`
- **Vulnerability:** Depends on vulnerable `fabric-common`
- **Location:** `node_modules/fabric-network`
- **Fix Available:** Yes (via `npm audit fix --force`)
- **Breaking Change:** Will install `fabric-network@1.4.20`
- **Impact:** Inherits vulnerabilities from `fabric-common`

---

## 🟡 MODERATE SEVERITY (3 vulnerabilities)

### 9. js-yaml 4.0.0 - 4.1.0
- **Package:** `js-yaml` (via `mocha`)
- **Vulnerability:** Prototype pollution in merge (<<)
- **CVE/GHSA:** [GHSA-mh29-5h37-fv8m](https://github.com/advisories/GHSA-mh29-5h37-fv8m)
- **Location:** `node_modules/mocha/node_modules/js-yaml`
- **Fix Available:** Yes (via `npm audit fix`)
- **Impact:** Prototype pollution vulnerability in YAML parsing

### 10. nanoid <=3.3.7
- **Package:** `nanoid` (via `mocha`)
- **Vulnerabilities:**
  1. Predictable results in nanoid generation when given non-integer values
  2. Exposure of Sensitive Information to an Unauthorized Actor
- **CVE/GHSA:** 
  - [GHSA-mwcw-c2x4-8c55](https://github.com/advisories/GHSA-mwcw-c2x4-8c55)
  - [GHSA-qrpm-p2h7-hrv2](https://github.com/advisories/GHSA-qrpm-p2h7-hrv2)
- **Location:** `node_modules/nanoid`
- **Fix Available:** Yes (via `npm audit fix`)
- **Impact:** Weak random ID generation and potential information disclosure

### 11. tough-cookie <4.1.3
- **Package:** `tough-cookie` (via `postman-request`)
- **Vulnerability:** Prototype Pollution vulnerability
- **CVE/GHSA:** [GHSA-72xf-g2v4-qvf3](https://github.com/advisories/GHSA-72xf-g2v4-qvf3)
- **Location:** `node_modules/tough-cookie`
- **Fix Available:** Yes (via `npm audit fix`)
- **Impact:** Prototype pollution in cookie handling

---

## 🔵 LOW SEVERITY (14 vulnerabilities)

### 12. aws-sdk >=2.0.1
- **Package:** `aws-sdk`
- **Vulnerability:** JavaScript SDK v2 users should add validation to the region parameter value or migrate to v3
- **CVE/GHSA:** [GHSA-j965-2qgj-vjmq](https://github.com/advisories/GHSA-j965-2qgj-vjmq)
- **Location:** `node_modules/aws-sdk`
- **Fix Available:** Yes (via `npm audit fix --force`)
- **Breaking Change:** Will install `aws-sdk@1.18.0`
- **Impact:** Missing validation on region parameter
- **Recommendation:** Migrate to AWS SDK v3

### 13. diff <8.0.3
- **Package:** `diff` (via `mocha`, `ts-node`)
- **Vulnerability:** jsdiff has a Denial of Service vulnerability in parsePatch and applyPatch
- **CVE/GHSA:** [GHSA-73rr-hh4g-fpgx](https://github.com/advisories/GHSA-73rr-hh4g-fpgx)
- **Location:** 
  - `node_modules/diff`
  - `node_modules/mocha/node_modules/diff`
- **Fix Available:** Yes (via `npm audit fix --force`)
- **Breaking Change:** Will install `jest@26.5.3`
- **Impact:** DoS vulnerability in patch parsing

### 14. mocha 0.14.0 - 12.0.0-beta.3
- **Package:** `mocha`
- **Vulnerability:** Depends on vulnerable versions of:
  - `diff` (low)
  - `js-yaml` (moderate)
  - `minimatch` (high)
  - `nanoid` (moderate)
- **Location:** `node_modules/mocha`
- **Fix Available:** Partial (via `npm audit fix`)
- **Impact:** Inherits multiple vulnerabilities from dependencies

### 15. ts-node <=1.4.3 || >=1.7.2
- **Package:** `ts-node`
- **Vulnerability:** Depends on vulnerable versions of `diff`
- **Location:** `node_modules/ts-node`
- **Fix Available:** Yes (via `npm audit fix --force`)
- **Breaking Change:** Will install `jest@26.5.3`
- **Impact:** Inherits DoS vulnerability from `diff`

### 16. jest-config >=26.6.0
- **Package:** `jest-config`
- **Vulnerability:** Depends on vulnerable versions of `ts-node`
- **Location:** `node_modules/jest-config`
- **Fix Available:** Yes (via `npm audit fix --force`)
- **Breaking Change:** Will install `jest@26.5.3`
- **Impact:** Inherits vulnerabilities from `ts-node`

### 17. @jest/core >=26.6.0
- **Package:** `@jest/core`
- **Vulnerability:** Depends on vulnerable versions of `jest-config`
- **Location:** `node_modules/@jest/core`
- **Fix Available:** Yes (via `npm audit fix --force`)
- **Breaking Change:** Will install `jest@26.5.3`
- **Impact:** Inherits vulnerabilities from `jest-config`

### 18. jest >=26.6.0
- **Package:** `jest`
- **Vulnerability:** Depends on vulnerable versions of:
  - `@jest/core`
  - `jest-cli`
- **Location:** `node_modules/jest`
- **Fix Available:** Yes (via `npm audit fix --force`)
- **Breaking Change:** Will install `jest@26.5.3`
- **Impact:** Inherits vulnerabilities from Jest ecosystem

### 19. ts-jest >=27.0.0-alpha.0
- **Package:** `ts-jest`
- **Vulnerability:** Depends on vulnerable versions of `jest`
- **Location:** `node_modules/ts-jest`
- **Fix Available:** Yes (via `npm audit fix --force`)
- **Breaking Change:** Will install `jest@26.5.3`
- **Impact:** Inherits vulnerabilities from `jest`

### 20. create-jest >=29.7.0
- **Package:** `create-jest`
- **Vulnerability:** Depends on vulnerable versions of `jest-config`
- **Location:** `node_modules/create-jest`
- **Fix Available:** Yes (via `npm audit fix --force`)
- **Breaking Change:** Will install `jest@26.5.3`
- **Impact:** Inherits vulnerabilities from `jest-config`

### 21. jest-cli >=26.6.0
- **Package:** `jest-cli`
- **Vulnerability:** Depends on vulnerable versions of:
  - `@jest/core`
  - `create-jest`
  - `jest-config`
- **Location:** `node_modules/jest-cli`
- **Fix Available:** Yes (via `npm audit fix --force`)
- **Breaking Change:** Will install `jest@26.5.3`
- **Impact:** Inherits multiple vulnerabilities from Jest ecosystem

### 22. ts-node-dev
- **Package:** `ts-node-dev` (all versions)
- **Vulnerability:** Depends on vulnerable versions of `ts-node`
- **Location:** `node_modules/ts-node-dev`
- **Fix Available:** Yes (via `npm audit fix --force`)
- **Breaking Change:** Will install `jest@26.5.3`
- **Impact:** Inherits vulnerabilities from `ts-node`

### 23. elliptic (all versions)
- **Package:** `elliptic`
- **Vulnerability:** Uses a Cryptographic Primitive with a Risky Implementation
- **CVE/GHSA:** [GHSA-848j-6mx2-7j84](https://github.com/advisories/GHSA-848j-6mx2-7j84)
- **Location:** `node_modules/elliptic`
- **Fix Available:** Yes (via `npm audit fix --force`)
- **Breaking Change:** Will install `fabric-network@1.4.20`
- **Impact:** Risky cryptographic implementation

### 24. tmp <=0.2.3
- **Package:** `tmp`
- **Vulnerability:** Allows arbitrary temporary file/directory write via symbolic link `dir` parameter
- **CVE/GHSA:** [GHSA-52f5-9888-hmc6](https://github.com/advisories/GHSA-52f5-9888-hmc6)
- **Location:** `node_modules/tmp`
- **Fix Available:** Yes (via `npm audit fix`)
- **Impact:** Symbolic link attack vulnerability

### 25. tmp-promise <=2.0.2 || 2.1.1
- **Package:** `tmp-promise`
- **Vulnerability:** Depends on vulnerable versions of `tmp`
- **Location:** `node_modules/tmp-promise`
- **Fix Available:** Yes (via `npm audit fix`)
- **Impact:** Inherits symbolic link vulnerability from `tmp`

---

## 📊 Summary by Category

### Production Dependencies (High Priority)
- **Critical:** `form-data`, `postman-request`, `node-vault`
- **High:** `jsrsasign`, `minimatch`, `qs`, `fabric-common`, `fabric-network`
- **Moderate:** `js-yaml`, `nanoid`, `tough-cookie`
- **Low:** `aws-sdk`, `tmp`, `tmp-promise`, `elliptic`

### Development Dependencies (Lower Priority)
- **Low:** All Jest ecosystem packages (`jest`, `@jest/core`, `jest-config`, `jest-cli`, `create-jest`, `ts-jest`)
- **Low:** `mocha`, `ts-node`, `ts-node-dev`, `diff`

---

## 🔧 Recommended Actions

### Immediate (Production Dependencies)
1. **Critical:** Update `postman-request` or replace with `axios`/`node-fetch`
2. **High:** Update `jsrsasign` to >=11.0.0
3. **High:** Update `minimatch` to >=3.0.5
4. **High:** Update `qs` to >=6.14.1
5. **Moderate:** Update `js-yaml`, `nanoid`, `tough-cookie`
6. **Low:** Consider migrating `aws-sdk` to v3

### Development Dependencies (Can be deferred)
- Update Jest ecosystem packages (may require testing)
- Update `mocha` and related packages

### Commands
```bash
# Fix non-breaking changes
npm audit fix

# Review breaking changes before applying
npm audit fix --force

# Manual updates for critical packages
npm update postman-request
npm update jsrsasign
npm update minimatch
npm update qs
```

---

## ⚠️ Notes

1. **Breaking Changes:** Several fixes require `--force` flag and may introduce breaking changes
2. **Testing Required:** After applying fixes, run full test suite
3. **Production Impact:** Critical and High severity vulnerabilities should be addressed before production deployment
4. **Dependency Chain:** Many vulnerabilities are in dependency chains (e.g., Jest ecosystem, Fabric network)

---

**Last Updated:** 2026-01-16  
**Next Review:** Monthly or before production deployment

