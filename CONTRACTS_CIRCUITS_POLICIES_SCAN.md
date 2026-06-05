# Focused Audit — Smart Contracts (.sol), ZK Circuits (.circom), OPA Policies (.rego)

**Date:** 2026-06-05 · **Scope:** the 23 security-critical files never read by any prior scan (the `.ts/.sql/...`
file lists omitted these extensions). Read end-to-end by three specialized expert agents.

## Verdict
All three surfaces have real defects. None are classic fund-theft/`default allow=true` holes, but the
**ZK proof layer does not actually gate on the claims it proves**, the **on-chain audit-log feature is
non-functional + has a stale unauthenticated duplicate contract**, and the **stored OPA policies are
corrupted/dead** (Compliance-as-Code silently denies/zeros everything). Severity is bounded by the fact
that blockchain/ZK are largely optional/dead-code paths today (contract address unset → no-op; ZK verify
is off-chain) — but as features they are broken and, where used for authz, bypassable.

---

## A. Solidity (`*.sol`) — 6 files
- **HIGH — Broken runtime ABI:** `services/advanced/blockchainService.ts:196-206` declares `recordAuditLog`/
  `recordCompliance`/`issueComplianceCertificate` — **none exist** in either `ComplianceAuditLog.sol`
  (which expose `createAuditLog`/`submitAuditLog`). Any call reverts → on-chain audit log non-functional.
  *Fix:* regenerate ABI from the compiled artifact (as `ComplianceRegistry` already does), or rename fns.
- **HIGH — Stale unauthenticated duplicate:** `server/contracts/ComplianceAuditLog.sol` (122 LOC) has a
  **public `submitAuditLog` with no access modifier** — anyone can forge audit entries for any org. It's a
  divergent copy of the hardened `server/src/blockchain/contracts/ComplianceAuditLog.sol` (258 LOC,
  `onlyAuthorized`). *Fix:* delete the stale `server/contracts/` copy.
- **MED — No on-chain tenant binding:** authorized writers / `ComplianceRegistry.issueCertificate` accept
  `orgId` as a free param (not derived from a per-org credential) → cross-tenant forgery by any one backend key.
- **MED — ZK verifier `.sol` are dead + soundness moot:** the 3 `*_verifier.sol` are unmodified snarkjs
  Groth16 verifiers, never deployed/called (verification is off-chain), and their keys derive from the
  weak trusted setup → forgeable.
- **MED — Off-chain ZK verify fails open in non-prod** (`zeroKnowledgeService.ts:362-374`).
- **LOW:** `verifyCertificate` lazy-expiry is event-spam/grief-able; unbounded arrays (`getOrgCertificates`)
  gas-DoS over time; floating pragma `^0.8.20`.
- **✓ Sound:** `ComplianceRegistry.sol` — roles, `nonReentrant`, bounded batches, events, no
  delegatecall/selfdestruct/tx.origin, immutable deployer.

## B. ZK circuits (`*.circom`) — 7 files (3 real + 4 dead test scaffolds)
- **HIGH — `data_ownership.circom:80` `ownershipVerified <== 1`** is a hardcoded tautology (output proves nothing).
- **HIGH — `compliance_check`/`credential_verification`: boolean outputs never asserted true** — a valid
  proof is produced whether or not the org is compliant / the credential is valid (`meetsThreshold`/`isValid`
  computed but no `=== 1`).
- **HIGH — `zeroKnowledgeService.ts:156,213,273` reads the WRONG public-signal index** — snarkjs orders
  `publicSignals` as `[outputs…, public inputs…]`, so `publicSignals[0]` is the boolean output, not
  score/roleLevel/userId. The authz decisions check the wrong field and never assert the output `=== 1`.
- **HIGH — Dev-mode fallback fabricates fake proofs** + verify falls back to a structure check; bypass if
  `NODE_ENV` is ever unset in a deployed env.
- **HIGH — Service witness input keys don't match circuit signal names** → real `fullProve` throws → drops
  into the fake dev path; the real proving path can never succeed.
- **MED:** `credential_verification` never checks `permissionsHash` against required permissions.
- **LOW:** `data_ownership` `Num2Bits(254)` aliasing; `test_circuit*.circom` are invalid circom-1.x dead
  scaffolds in the source tree (delete); `QUICKSTART.md` still documents `-e="$(date +%s)"` entropy even
  though `setup-circuits.sh` was fixed to `/dev/urandom`.

## C. OPA policies (`*.rego`) — 10 files
- **HIGH — All 8 hash-named stored policies are corrupted single-line stubs** (8–14 bytes, e.g. `pck.soc2`,
  `pkg.HIPAATest`, `pck. ISO 27001`) — no `package compliance.<id>`, no `allow`, no `violation`, 6/8 not even
  valid Rego. The Compliance-as-Code feature is **shipped-but-dead**: every eval → `allow=undefined` → false
  (fails closed, so no cross-tenant grant, but non-functional + false assurance).
- **HIGH — Package/query mismatch:** service queries `data/compliance/<policyId>`; no stored file declares
  that package.
- **HIGH — `validateRegoSyntax` (complianceAsCodeService.ts:162-192) doesn't validate the submitted Rego**
  (it compiles a hardcoded query) — which is how 8-byte garbage got persisted.
- **MED — `examples/soc2_access_control.rego`** trusts caller-supplied `input.role`/`input.mfa_enabled` with
  no role allowlist and no org scoping (currently an inert, non-queried demo).
- **✓ No `default allow = true`, no unconditional grant, no positive cross-tenant hole** in any policy.

---

## Remediation notes (effort/risk varies)
- **Tractable code fixes:** delete stale `server/contracts/ComplianceAuditLog.sol`; regenerate the
  blockchain ABI from artifacts; delete `test_circuit*.circom`; fix `validateRegoSyntax` to actually compile
  the submitted Rego + enforce the `compliance.<id>` package + `default allow=false`; regenerate the 8
  corrupted stored policies from the valid generator template; fail ZK verify closed regardless of `NODE_ENV`.
- **Deeper correctness:** rewrite `zeroKnowledgeService` public-signal indexing + witness input mapping to
  match the circuits; assert the boolean outputs in-circuit (`=== 1`) or in the verifier; fix the
  `data_ownership` constant output.
- **Operational (cannot be done from the repo alone):** a real multi-party trusted-setup ceremony (the
  entropy fix alone doesn't replace an MPC ceremony); deploying/wiring contracts if on-chain anchoring is
  intended. Until then, ZK proofs remain forgeable and the on-chain features are effectively off.
