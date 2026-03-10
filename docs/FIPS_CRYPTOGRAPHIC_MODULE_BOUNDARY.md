# ComplyEasyAI -- FIPS 140-3 / ISO 19790 Cryptographic Module Boundary Documentation

> **Document Classification:** Confidential -- Internal
> **Version:** 3.0
> **Owner:** Chief Information Security Officer (CISO), AARAIK LLC
> **Effective Date:** 2026-03-09
> **Next Review Date:** 2026-06-09
> **Review Cadence:** Quarterly
> **Approval:** [CISO Signature] | [CTO Signature]
> **Regulatory Mapping:** FIPS 140-3 (ISO 19790), NIST SP 800-131A Rev 2, SP 800-140 (A-F), FedRAMP

---

## Table of Contents

1. [Module Overview](#1-module-overview)
2. [Boundary Definition](#2-boundary-definition)
3. [Algorithm Inventory](#3-algorithm-inventory)
4. [Key Management Procedures](#4-key-management-procedures)
5. [Non-FIPS Boundary Justification](#5-non-fips-boundary-justification)
6. [FIPS Mode Configuration](#6-fips-mode-configuration)
7. [Compliance Verification Procedures](#7-compliance-verification-procedures)
8. [Document Control](#8-document-control)
9. [Self-Tests (ISO 19790 §7.10)](#9-self-tests-iso-19790-710)
10. [Entropy Source (SP 800-90B)](#10-entropy-source-sp-800-90b)
11. [Key Zeroization (ISO 19790 §7.8)](#11-key-zeroization-iso-19790-78)
12. [Software Integrity (SP 800-140D)](#12-software-integrity-sp-800-140d)

---

## 1. Module Overview

### 1.1 Module Name

**ComplyEasyAI Cryptographic Module**

### 1.2 Module Description

The ComplyEasyAI Cryptographic Module defines the boundary within which all cryptographic operations conform to FIPS 140-3 (ISO 19790) approved algorithms and key management practices. This module governs the cryptographic security of:

- User authentication and session management
- Data encryption at rest and in transit
- Password hashing and credential storage
- HMAC-based message authentication and integrity verification
- Pseudorandom number generation for tokens, keys, and nonces
- Digital signatures for webhook verification and API authentication
- Data anonymization and pseudonymization (GDPR Recital 26)
- Pre-operational and conditional self-tests
- Entropy source health monitoring
- Software integrity verification

### 1.3 Security Level

| ISO 19790 (FIPS 140-3) Area | Security Level |
|------------------------------|---------------|
| Cryptographic Module Specification | Level 1 |
| Cryptographic Module Interfaces | Level 1 |
| Roles, Services, and Authentication | Level 2 |
| Software/Firmware Security | Level 1 |
| Operational Environment | Level 1 |
| Physical Security | N/A (software module) |
| Non-Invasive Security | N/A (software module) |
| Sensitive Security Parameter Management | Level 2 |
| Self-Tests | Level 2 |
| Life-Cycle Assurance | Level 1 |
| Mitigation of Other Attacks | N/A |

### 1.4 Module Type

Software-only cryptographic module running on a general-purpose computing platform (Node.js on AWS ECS Fargate with Amazon Linux 2).

### 1.5 Cryptographic Library

The module relies on **Node.js OpenSSL** (via the `crypto` built-in module), which supports FIPS 140-3 validated operation when configured with `--force-fips` or `--enable-fips` flags. The underlying OpenSSL version must be FIPS 140-3 validated (OpenSSL 3.0+ with FIPS provider enabled).

---

## 2. Boundary Definition

### 2.1 What Is INSIDE the FIPS Boundary

All cryptographic operations that protect ComplyEasyAI core security functions fall within the FIPS boundary:

| Component | Description | Cryptographic Operations |
|-----------|-------------|-------------------------|
| **Authentication System** | JWT token generation, verification, and refresh | HMAC-SHA256 (JWT signing), crypto.randomBytes (token generation) |
| **Password Hashing** | User password storage and verification | PBKDF2-SHA256 (via `fipsPasswordHashing.ts`) |
| **Data Encryption at Rest** | Encryption of sensitive fields in database | AES-256-GCM (via `credentialEncryption.ts`) |
| **BYOK (Bring Your Own Key)** | Customer-managed encryption key support | AES-256-GCM envelope encryption (via `byokService.ts`) |
| **Session Management** | Session token generation and CSRF protection | crypto.randomBytes, HMAC-SHA256 (CSRF double-submit cookie) |
| **Webhook Signatures** | Outbound webhook payload signing and verification | HMAC-SHA256 (via `webhookService.ts`) |
| **Two-Factor Auth** | TOTP secret encryption and verification | AES-256-GCM (via `twoFactorService.ts`), HMAC-SHA256 |
| **Data Anonymization** | Pseudonymization for GDPR compliance | HMAC-SHA256 (via `dataAnonymizationService.ts`) |
| **TLS Termination** | Transport encryption for all API communications | TLS 1.2+ with FIPS-approved cipher suites (at nginx/ALB layer) |
| **Secrets Manager Integration** | Retrieval and caching of secrets | AES-256-GCM (AWS KMS managed, FIPS 140-3 Level 3 HSM-backed) |
| **Self-Tests** | Pre-operational KATs + conditional tests | AES-256-GCM, SHA-256, HMAC-SHA256, PBKDF2-SHA256, RSA-2048 KATs (via `fipsSelfTests.ts`) |
| **Entropy Health Testing** | SP 800-90B health tests at startup + hourly | Repetition Count Test, Adaptive Proportion Test (via `fipsEntropyHealthTest.ts`) |
| **Software Integrity** | HMAC-SHA256 integrity verification of module files | HMAC-SHA256 (via `fipsIntegrityCheck.ts`) |

### 2.2 What Is OUTSIDE the FIPS Boundary

The following components use non-FIPS cryptographic algorithms and are explicitly excluded from the FIPS boundary:

| Component | Description | Non-FIPS Algorithm | Justification |
|-----------|-------------|-------------------|---------------|
| **Blockchain Service** (Ethereum) | Immutable audit log anchoring on Ethereum | Keccak-256 (SHA-3 variant) | Required by Ethereum protocol (EIP-155, Yellow Paper) |
| **Blockchain Service** (Ethereum) | Transaction signing for Ethereum | secp256k1 (ECDSA) | Required by Ethereum protocol specification |

### 2.3 Boundary Diagram

```
+=========================================================================+
|               FIPS 140-3 / ISO 19790 CRYPTOGRAPHIC MODULE BOUNDARY      |
|                                                                         |
|  +-------------------+  +---------------------+  +------------------+  |
|  | Authentication    |  | Data Encryption     |  | Session Mgmt     |  |
|  | - JWT (HMAC-256)  |  | - AES-256-GCM       |  | - CSRF tokens    |  |
|  | - Password hash   |  | - BYOK envelope enc |  | - Session tokens |  |
|  |   (PBKDF2-SHA256) |  |                     |  | - HMAC-SHA256    |  |
|  +-------------------+  +---------------------+  +------------------+  |
|                                                                         |
|  +-------------------+  +---------------------+  +------------------+  |
|  | Webhook Signing   |  | Two-Factor Auth     |  | Anonymization    |  |
|  | - HMAC-SHA256     |  | - AES-256-GCM       |  | - HMAC-SHA256    |  |
|  |                   |  | - crypto.randomBytes|  |   pseudonymize   |  |
|  +-------------------+  +---------------------+  +------------------+  |
|                                                                         |
|  +-------------------+  +---------------------+  +------------------+  |
|  | TLS Termination   |  | AWS KMS / Secrets   |  | Self-Tests       |  |
|  | - TLS 1.2+        |  | - AES-256-GCM       |  | - KATs (5 algos) |  |
|  | - FIPS ciphers    |  | - HSM-backed (L3)   |  | - Conditional    |  |
|  +-------------------+  +---------------------+  +------------------+  |
|                                                                         |
|  +-------------------+  +---------------------+                        |
|  | Entropy Health    |  | Software Integrity  |                        |
|  | - SP 800-90B      |  | - HMAC-SHA256       |                        |
|  | - Hourly monitor  |  | - SP 800-140D       |                        |
|  +-------------------+  +---------------------+                        |
+=========================================================================+

+-------------------------------------------------------------------------+
|                   OUTSIDE FIPS BOUNDARY (Isolated)                      |
|                                                                         |
|  +-------------------------------------------------------------------+ |
|  | Blockchain Service (blockchainService.ts)                         | |
|  | - Keccak-256 (Ethereum hashing, non-FIPS SHA-3 variant)           | |
|  | - secp256k1 (Ethereum ECDSA signing, non-NIST curve)              | |
|  |                                                                   | |
|  | NOTE: This service does NOT handle user auth, PII encryption,     | |
|  | password hashing, or transport security. It is used solely for    | |
|  | anchoring audit hashes to the Ethereum blockchain.                | |
|  +-------------------------------------------------------------------+ |
+-------------------------------------------------------------------------+
```

---

## 3. Algorithm Inventory

### 3.1 Complete Algorithm Table

| Algorithm | FIPS 140-3 Status | Module Boundary | File Location | Purpose |
|-----------|------------------|----------------|---------------|---------|
| **AES-256-GCM** | Approved (FIPS 197, SP 800-38D) | Inside | `credentialEncryption.ts`, `byokService.ts`, `twoFactorService.ts` | Authenticated encryption of sensitive data at rest, BYOK envelope encryption, 2FA secret encryption |
| **AES-256-CBC** | Deprecated (transitional) | Inside | `twoFactorService.ts` (legacy decrypt only) | Legacy 2FA secret decryption only. All new encryptions use AES-256-GCM. Will be removed after full migration. |
| **SHA-256** | Approved (FIPS 180-4) | Inside | `auth.ts`, `sessionManagementService.ts`, `fipsSelfTests.ts` | Token hashing, session ID derivation, integrity checks, KAT self-tests |
| **HMAC-SHA256** | Approved (FIPS 198-1) | Inside | `csrf.ts`, `webhookService.ts`, `dataAnonymizationService.ts`, `fipsIntegrityCheck.ts`, `fipsSelfTests.ts` | JWT signing, CSRF token validation, webhook signatures, data pseudonymization, software integrity verification |
| **PBKDF2-SHA256** | Approved (SP 800-132) | Inside | `fipsPasswordHashing.ts`, `credentialEncryption.ts`, `twoFactorService.ts` | Password hashing (600,000 iterations), encryption key derivation |
| **RSA-2048** | Approved (FIPS 186-5) | Inside | `evidenceTruthLayerService.ts`, `fipsSelfTests.ts` | Digital signatures for evidence integrity, pairwise consistency self-test |
| **crypto.randomBytes** | Approved (SP 800-90A, DRBG) | Inside | Multiple files (auth, CSRF, 2FA, sessions) | Cryptographically secure PRNG for tokens, keys, nonces, and IVs. Wrapped by `fipsRandomBytes()` for continuous RNG testing. |
| **Keccak-256** | **NOT Approved** | **Outside** | `blockchainService.ts` | Ethereum address derivation and transaction hashing (Ethereum protocol requirement) |
| **secp256k1** | **NOT Approved** | **Outside** | `blockchainService.ts` | Ethereum transaction signing via ECDSA (Ethereum protocol requirement) |

### 3.2 Algorithm Usage Summary

| Category | Algorithms Used | FIPS Status |
|----------|----------------|-------------|
| Symmetric Encryption | AES-256-GCM, AES-256-CBC | All Approved |
| Hash Functions | SHA-256 | All Approved |
| Message Authentication | HMAC-SHA256 | Approved |
| Password Hashing | PBKDF2-SHA256 | Approved |
| Digital Signatures | RSA-2048 | Approved |
| Random Number Generation | crypto.randomBytes (OpenSSL DRBG) | Approved |
| Blockchain (isolated) | Keccak-256, secp256k1 | NOT Approved (outside boundary) |

---

## 4. Key Management Procedures

### 4.1 Key Hierarchy

```
AWS KMS Master Key (CMK)
  |-- FIPS 140-3 Level 3 HSM-backed
  |-- Region: us-east-1
  |-- Automatic annual rotation enabled
  |
  +-- Data Encryption Keys (DEKs)
  |     |-- Generated per-encryption via KMS GenerateDataKey
  |     |-- AES-256 keys
  |     |-- Encrypted (wrapped) DEKs stored alongside ciphertext
  |     |-- Plaintext DEKs never persisted to disk
  |
  +-- BYOK Customer Keys
  |     |-- Customer-provided AES-256 keys
  |     |-- Wrapped with organization-specific KEK
  |     |-- KEK derived from KMS CMK via envelope encryption
  |     |-- Customer can rotate keys via API
  |
  +-- Application Secrets
        |-- JWT signing key (HMAC-SHA256)
        |-- CSRF secret key
        |-- Webhook signing keys
        |-- Anonymization HMAC key
        |-- Stored in AWS Secrets Manager (KMS-encrypted)
        |-- Rotated per SECRET_ROTATION_RUNBOOK.md
```

### 4.2 Key Types and Lifecycle

| Key Type | Algorithm | Length | Storage | Rotation Period | Destruction |
|----------|-----------|--------|---------|----------------|-------------|
| KMS Master Key (CMK) | AES-256 | 256-bit | AWS KMS HSM (FIPS 140-3 L3) | Annual (automatic) | AWS-managed |
| Data Encryption Key (DEK) | AES-256-GCM | 256-bit | Encrypted in database (envelope encryption) | Per-encryption (ephemeral) | Overwritten on re-encryption |
| JWT Signing Key | HMAC-SHA256 | 256-bit | AWS Secrets Manager | 90 days | Previous key retained for 24h grace period |
| CSRF Secret | HMAC-SHA256 | 256-bit | AWS Secrets Manager | 90 days | Immediate on rotation |
| Password Hash Salt | crypto.randomBytes | 128-bit | Database (per-user) | On password change | Overwritten |
| BYOK Customer Key | AES-256 | 256-bit | Encrypted in database | Customer-controlled | On customer request or account deletion |
| Webhook Signing Key | HMAC-SHA256 | 256-bit | AWS Secrets Manager | 90 days | Previous key retained for 1h grace period |
| Anonymization HMAC Key | HMAC-SHA256 | 256-bit | AWS Secrets Manager / env var | 365 days | N/A (pseudonymized data becomes non-reversible) |
| Blockchain Wallet Key | secp256k1 | 256-bit | AWS Secrets Manager | As needed | N/A (outside FIPS boundary) |

### 4.3 BYOK (Bring Your Own Key) Envelope Encryption

The BYOK system uses envelope encryption to support customer-managed keys:

1. **Customer provides** an AES-256 key via the BYOK API
2. **System generates** a random DEK for each encryption operation
3. **Data is encrypted** with the DEK using AES-256-GCM
4. **DEK is encrypted** (wrapped) with the customer's BYOK key
5. **Wrapped DEK + ciphertext** are stored together
6. **Decryption** reverses the process: unwrap DEK with BYOK key, then decrypt data

All BYOK operations use FIPS-approved algorithms exclusively.

### 4.4 Key Rotation Procedures

Key rotation follows the procedures documented in `docs/SECRET_ROTATION_RUNBOOK.md`. Summary:

| Step | Action | Owner |
|------|--------|-------|
| 1 | Generate new key using approved CSPRNG | Platform Engineering |
| 2 | Store new key in AWS Secrets Manager | Platform Engineering |
| 3 | Update application configuration (zero-downtime) | Platform Engineering |
| 4 | Verify new key is active (health checks, test encryption/decryption) | Platform Engineering |
| 5 | Grace period for old key (duration varies by key type) | Automatic |
| 6 | Revoke old key after grace period | Platform Engineering |
| 7 | Audit log rotation event | Automatic |

---

## 5. Non-FIPS Boundary Justification

### 5.1 Keccak-256 (SHA-3 Variant)

**Algorithm:** Keccak-256 (NOT the NIST SHA-3 standard; uses different padding)

**Used By:** `server/src/services/advanced/blockchainService.ts` (via `ethers.js` library)

**Purpose:** Ethereum address derivation and transaction hash computation

**Justification:**
- Keccak-256 is **mandated by the Ethereum protocol specification** (Ethereum Yellow Paper, Section 4.1)
- The Ethereum Virtual Machine (EVM) uses Keccak-256 as its native hash function
- Substituting SHA-256 or NIST SHA-3 would make the application **incompatible with the Ethereum blockchain**
- This algorithm is used exclusively for blockchain audit anchoring and does NOT protect:
  - User authentication or session data
  - Personally identifiable information (PII)
  - Encryption keys or credentials
  - Transport-layer security

### 5.2 secp256k1 (ECDSA)

**Algorithm:** ECDSA over the secp256k1 elliptic curve

**Used By:** `server/src/services/advanced/blockchainService.ts` (via `ethers.js` library)

**Purpose:** Signing Ethereum transactions for audit log anchoring

**Justification:**
- secp256k1 is **mandated by the Ethereum protocol specification** (EIP-155)
- NIST-approved curves (P-256, P-384, P-521) are NOT supported by the Ethereum network
- Using a different curve would prevent transaction signing and submission to Ethereum
- This algorithm is used exclusively for blockchain transaction signing and does NOT protect:
  - User authentication or session data
  - Personally identifiable information (PII)
  - Encryption keys or credentials
  - Transport-layer security

### 5.3 Isolation Controls

The blockchain service is architecturally isolated from the FIPS boundary:

| Control | Implementation |
|---------|---------------|
| **Code Isolation** | `blockchainService.ts` is in a separate `advanced/` directory, not imported by core security modules |
| **No PII Handling** | The blockchain service only receives pre-hashed audit digests (SHA-256 hashes), never raw PII |
| **No Auth Involvement** | The blockchain service does not participate in authentication, authorization, or session management |
| **No Key Sharing** | Blockchain wallet keys are separate from application encryption keys |
| **Boundary Documentation** | The service file contains a FIPS 140-3 Boundary Notice header comment |
| **Optional Feature** | Blockchain anchoring is an optional enterprise feature; disabling it does not affect core security |

### 5.4 Hyperledger Fabric Exception

The blockchain service also supports **Hyperledger Fabric**, which uses:
- **ECDSA P-256 (prime256v1)** with **SHA-256** -- both are FIPS 140-3 approved
- Organizations requiring strict FIPS compliance may use Hyperledger Fabric instead of Ethereum

---

## 6. FIPS Mode Configuration

### 6.1 Node.js FIPS Mode

Enable FIPS mode for the Node.js runtime to restrict the `crypto` module to FIPS-approved algorithms only:

```bash
# Environment variable (recommended for containers)
NODE_OPTIONS="--force-fips"

# Or via command line
node --force-fips server/dist/index.js

# Or programmatically (must be called before any crypto operations)
# crypto.setFips(1);
```

**Effect:** When `--force-fips` is enabled, any attempt to use a non-FIPS algorithm via the Node.js `crypto` module will throw an error. The blockchain service uses `ethers.js` which has its own cryptographic implementation independent of Node.js `crypto`, so it remains functional.

### 6.2 OpenSSL FIPS Provider

For Node.js 18+ with OpenSSL 3.0+:

```bash
# Enable the FIPS provider in OpenSSL configuration
export OPENSSL_CONF=/etc/ssl/openssl-fips.cnf
export OPENSSL_MODULES=/usr/lib64/ossl-modules
```

Example `openssl-fips.cnf`:
```ini
[openssl_init]
providers = provider_sect

[provider_sect]
fips = fips_sect
base = base_sect

[fips_sect]
activate = 1

[base_sect]
activate = 1
```

### 6.3 Nginx FIPS Cipher Suites

Configure nginx (or ALB) to use only FIPS-approved TLS cipher suites:

```nginx
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers 'ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES128-GCM-SHA256';
ssl_prefer_server_ciphers on;
ssl_ecdh_curve secp384r1;
```

### 6.4 AWS ALB FIPS Configuration

For AWS Application Load Balancer:

```
# Use FIPS-compliant security policy
Security Policy: ELBSecurityPolicy-TLS13-1-2-FIPS-2023-04

# Supported cipher suites (all FIPS-approved):
# TLS_AES_128_GCM_SHA256
# TLS_AES_256_GCM_SHA384
# ECDHE-RSA-AES128-GCM-SHA256
# ECDHE-RSA-AES256-GCM-SHA384
```

### 6.5 Container Configuration

Dockerfile additions for FIPS mode:

```dockerfile
# Set FIPS mode for Node.js
ENV NODE_OPTIONS="--force-fips"

# Verify FIPS mode on startup
RUN node -e "console.log('FIPS mode:', require('crypto').getFips())"
```

---

## 7. Compliance Verification Procedures

### 7.1 Automated Verification

The following automated checks are integrated into the CI/CD pipeline:

| Check | Tool | Stage | Description |
|-------|------|-------|-------------|
| FIPS algorithm audit | Custom script | Build | Scans source code for non-FIPS algorithm usage outside the blockchain service |
| Cipher suite validation | SSL Labs API | Deploy | Verifies TLS configuration uses only FIPS-approved cipher suites |
| Key length validation | Unit tests | Test | Verifies all encryption keys meet minimum length requirements (256-bit for AES, 2048-bit for RSA) |
| Dependency audit | Trivy | Build | Scans dependencies for known vulnerabilities in cryptographic libraries |

### 7.2 Manual Verification Procedures

Perform these checks quarterly:

| # | Verification Step | Expected Result | Verified By | Date |
|---|------------------|-----------------|-------------|------|
| 1 | Run `node -e "console.log(require('crypto').getFips())"` on production container | Output: `1` (FIPS enabled) | | |
| 2 | Run `openssl version` on production container | Output includes "fips" | | |
| 3 | Check ALB security policy in AWS Console | Policy: `ELBSecurityPolicy-TLS13-1-2-FIPS-2023-04` | | |
| 4 | Run SSL Labs test on `api.complyeasy.ai` | Grade: A+ with no non-FIPS ciphers | | |
| 5 | Review `blockchainService.ts` FIPS boundary notice | Header comment present and accurate | | |
| 6 | Verify no new crypto imports outside FIPS boundary | No new non-FIPS algorithms introduced | | |
| 7 | Verify AWS KMS CMK rotation status | Automatic rotation enabled, last rotation within 365 days | | |
| 8 | Review key rotation audit logs | All application keys rotated per schedule | | |

### 7.3 Compliance Testing Script

```bash
#!/bin/bash
# FIPS 140-3 Compliance Verification Script
# Run quarterly as part of compliance verification

echo "=== ComplyEasyAI FIPS 140-3 Compliance Check ==="
echo ""

# 1. Check Node.js FIPS mode
echo "[1/5] Checking Node.js FIPS mode..."
FIPS_STATUS=$(node -e "console.log(require('crypto').getFips())")
if [ "$FIPS_STATUS" = "1" ]; then
  echo "  PASS: FIPS mode enabled"
else
  echo "  FAIL: FIPS mode NOT enabled (got: $FIPS_STATUS)"
fi

# 2. Check OpenSSL version
echo "[2/5] Checking OpenSSL version..."
OPENSSL_VERSION=$(openssl version)
echo "  OpenSSL: $OPENSSL_VERSION"

# 3. Scan for non-FIPS algorithms in FIPS boundary
echo "[3/5] Scanning for non-FIPS algorithms inside FIPS boundary..."
NON_FIPS_HITS=$(grep -rn "keccak\|secp256k1\|md5\|sha1[^-]" \
  server/src/ \
  --include="*.ts" \
  --exclude-dir="advanced" \
  --exclude-dir="__tests__" \
  --exclude-dir="blockchain" | wc -l)
if [ "$NON_FIPS_HITS" -eq "0" ]; then
  echo "  PASS: No non-FIPS algorithms found inside boundary"
else
  echo "  WARN: $NON_FIPS_HITS potential non-FIPS algorithm references found"
fi

# 4. Verify minimum key lengths
echo "[4/5] Checking encryption key configurations..."
grep -rn "aes-128\|aes-192" server/src/ --include="*.ts" | grep -v test | grep -v __tests__
if [ $? -ne 0 ]; then
  echo "  PASS: No sub-256-bit AES keys found"
else
  echo "  FAIL: Sub-256-bit AES keys detected"
fi

# 5. Check TLS configuration
echo "[5/5] Checking TLS cipher configuration..."
echo "  (Run external SSL Labs scan for full verification)"

echo ""
echo "=== Verification Complete ==="
```

### 7.4 Non-Compliance Response

If any verification check fails:

| Severity | Response | Timeline |
|----------|----------|----------|
| FIPS mode disabled in production | P1 incident; immediate remediation | 4 hours |
| Non-FIPS algorithm used inside boundary | P2 incident; code fix required | 24 hours |
| Weak cipher suite detected | P2 incident; configuration fix | 24 hours |
| Key rotation overdue | P3 issue; scheduled rotation | 7 days |
| Documentation out of date | P4 issue; update documentation | 30 days |

---

## 8. Document Control

### 8.1 Version History

| Version | Date | Author | Changes | Approved By |
|---------|------|--------|---------|-------------|
| 1.0 | 2026-03-01 | CISO, AARAIK LLC | Initial release | [CISO], [CTO] |
| 2.0 | 2026-03-08 | CISO, AARAIK LLC | Comprehensive rewrite with full algorithm inventory, boundary diagram, key management, verification procedures | [CISO], [CTO] |
| 3.0 | 2026-03-09 | CISO, AARAIK LLC | Upgrade to FIPS 140-3 / ISO 19790: added self-tests (KATs, conditional), entropy health monitoring, key zeroization, software integrity, AES-CBC-to-GCM migration | [CISO], [CTO] |

### 8.2 Related Documents

| Document | Location | Relationship |
|----------|----------|-------------|
| Secret Rotation Runbook | [docs/SECRET_ROTATION_RUNBOOK.md](SECRET_ROTATION_RUNBOOK.md) | Key rotation procedures |
| Vendor Security Assessment | [docs/VENDOR_SECURITY_ASSESSMENT.md](VENDOR_SECURITY_ASSESSMENT.md) | Vendor cryptographic requirements |
| Change Management Procedure | [docs/CHANGE_MANAGEMENT_PROCEDURE.md](CHANGE_MANAGEMENT_PROCEDURE.md) | Changes to cryptographic configuration |
| Disaster Recovery Plan | [docs/DISASTER_RECOVERY.md](DISASTER_RECOVERY.md) | Key backup and recovery |

### 8.3 Approval Signatures

| Role | Name | Signature | Date |
|------|------|-----------|------|
| CISO | __________________ | __________________ | __________ |
| CTO | __________________ | __________________ | __________ |

---

## 9. Self-Tests (ISO 19790 §7.10)

FIPS 140-3 requires pre-operational self-tests (Known Answer Tests) and conditional self-tests to verify the correct operation of all FIPS-approved algorithms before and during use.

### 9.1 Pre-Operational Self-Tests (KATs)

Executed at server startup via `runPreOperationalSelfTests()` in `server/src/utils/fipsSelfTests.ts`. The module enters an error state and refuses to start if any KAT fails.

| Algorithm | Test Vector Source | Test Description |
|-----------|-------------------|------------------|
| **AES-256-GCM** | NIST SP 800-38D Test Case 16 | Encrypt known plaintext, verify ciphertext + auth tag match expected values |
| **SHA-256** | FIPS 180-4 (empty string + "abc") | Hash known inputs, verify digests match published NIST vectors |
| **HMAC-SHA256** | RFC 4231 Test Case 2 | HMAC with key="Jefe", data="what do ya want for nothing?", verify output |
| **PBKDF2-SHA256** | RFC 6070 | Derive key from password="password", salt="salt", iterations=1, verify output |
| **RSA-2048** | Runtime roundtrip | Sign test message with hardcoded test keypair, verify signature |

### 9.2 Conditional Self-Tests

| Test | Trigger | Implementation |
|------|---------|---------------|
| **Continuous RNG Test** | Every call to `fipsRandomBytes()` | Compares SHA-256 hash of current output to previous output; throws on match (stuck RNG) |
| **RSA Pairwise Consistency Test** | After `crypto.generateKeyPairSync('rsa')` | Immediately signs+verifies a test message with the new keypair; throws on failure |

### 9.3 Startup Sequence

```
1. validateConfig()                        — environment validation
2. verifyModuleIntegrity()                 — SP 800-140D software integrity check
3. runPreOperationalSelfTests()            — KATs for all 5 algorithms + entropy health test
4. startPeriodicHealthMonitoring()         — hourly SP 800-90B entropy tests (production only)
5. ... middleware and route initialization
```

If steps 2 or 3 fail, the process exits with code 1 (error state per ISO 19790 §7.10.2).

---

## 10. Entropy Source (SP 800-90B)

### 10.1 Entropy Chain

```
Operating System TRNG → OpenSSL DRBG → Node.js crypto.randomBytes() → Application
```

### 10.2 Health Tests

Implemented in `server/src/utils/fipsEntropyHealthTest.ts` per NIST SP 800-90B §4.4.

| Test | Standard | Parameters | Failure Condition |
|------|----------|------------|-------------------|
| **Repetition Count Test** | SP 800-90B §4.4.1 | Cutoff C = 21 | Any byte value repeats 21+ times consecutively in a 1024-byte sample |
| **Adaptive Proportion Test** | SP 800-90B §4.4.2 | Window W = 512, Cutoff = 384 | Any single byte value appears 384+ times in a 512-byte window |

### 10.3 Monitoring Schedule

| When | Action |
|------|--------|
| Server startup | Run both tests as part of pre-operational self-tests |
| Every 1 hour (production) | Run both tests via `startPeriodicHealthMonitoring()` |
| Test failure | Log error; module continues but alerts for investigation |

---

## 11. Key Zeroization (ISO 19790 §7.8)

### 11.1 Zeroization Locations

| File | Key Material | Zeroization Method |
|------|-------------|-------------------|
| `fipsPasswordHashing.ts` | PBKDF2 derived key + salt | `buffer.fill(0)` in `finally` blocks after hash/verify |
| `credentialEncryption.ts` | Cached derived encryption key | `destroyKey()` export; called during graceful shutdown |
| `twoFactorService.ts` | AES-256-GCM encryption key | `key.fill(0)` in `finally` block after each encrypt/decrypt |
| `index.ts` (shutdown) | All cached key material | Calls `destroyKey()` on SIGTERM/SIGINT |

### 11.2 Known Limitation

V8 JavaScript engine manages string memory via garbage collection; environment variable strings (e.g., `JWT_SECRET`, `ENCRYPTION_KEY`) cannot be zeroed from application code. **Mitigation**: Use AWS Secrets Manager or HashiCorp Vault in production, which store secrets in memory-mapped regions with controlled lifecycle.

### 11.3 Key Lifecycle

```
Generation → Storage → Use → Zeroization
    |            |        |        |
    |            |        |        +-- buffer.fill(0) / destroyKey()
    |            |        +-- decrypt/encrypt/sign/verify
    |            +-- AWS Secrets Manager / env var
    +-- crypto.randomBytes / PBKDF2 derivation
```

---

## 12. Software Integrity (SP 800-140D)

### 12.1 Mechanism

HMAC-SHA256 based integrity verification of all files within the cryptographic module boundary.

### 12.2 Two-Phase Process

| Phase | When | Action |
|-------|------|--------|
| **Build-time** | `npm run fips:integrity` or Docker build | Computes HMAC-SHA256 over all boundary files (sorted by path), saves digest to `fips-integrity.json` |
| **Runtime** | Server startup (before self-tests) | Recomputes HMAC and compares to stored manifest. Mismatch = refuse to start. |

### 12.3 Files in Integrity Scope

```
utils/fipsPasswordHashing.js
utils/credentialEncryption.js
utils/fipsSelfTests.js
utils/fipsEntropyHealthTest.js
middleware/auth.js
middleware/csrf.js
services/webhookService.js
services/dataAnonymizationService.js
services/twoFactorService.js
services/advanced/byokService.js
services/advanced/evidenceTruthLayerService.js
```

### 12.4 Configuration

| Environment Variable | Purpose | Required |
|---------------------|---------|----------|
| `FIPS_INTEGRITY_KEY` | HMAC key for integrity computation/verification | Production only (skipped if not set in dev) |

### 12.5 Docker Build Integration

```dockerfile
ARG FIPS_INTEGRITY_KEY=""
RUN if [ -n "$FIPS_INTEGRITY_KEY" ]; then \
      FIPS_INTEGRITY_KEY="$FIPS_INTEGRITY_KEY" node -e \
        "require('./dist/utils/fipsIntegrityCheck').computeAndSaveIntegrity('./dist')"; \
    fi
```

Pass the key at build time: `docker build --build-arg FIPS_INTEGRITY_KEY=<key> ...`

---

*End of Document*
