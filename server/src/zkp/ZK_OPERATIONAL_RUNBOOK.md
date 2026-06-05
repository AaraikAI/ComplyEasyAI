# ZK Operational Runbook — Post-Circuit-Change Procedure

**Scope:** the three production circuits under `server/src/zkp/circuits/`:
`compliance_check.circom`, `credential_verification.circom`, `data_ownership.circom`.

> ⚠️ **READ FIRST — soundness depends on the steps below.**
> The circuit `.circom` source changes alone do **NOT** make ZK trustworthy.
> A change to any circuit invalidates every previously-generated key, witness,
> and verifier contract. Until the operational steps in this runbook are
> completed against the *new* circuits — and in particular until a **genuine
> multi-party trusted-setup ceremony** has been run — **any proofs the system
> produces or verifies are potentially forgeable and MUST NOT be relied upon
> for any security or compliance decision.**

---

## 0. Why this runbook exists

These changes were just landed in the circuits:

- **`data_ownership.circom`** — `ownershipVerified` was a hardcoded constant
  (`ownershipVerified <== 1;`), so the output was a tautology that asserted
  nothing. It is now a genuinely *derived* boolean: three `IsEqual` components
  compare each recomputed Poseidon hash against its public commitment, an AND
  combines them, and the circuit now asserts `ownershipVerified === 1`, so a
  satisfying witness must actually know `sk` and own the data.
- **`compliance_check.circom`** — added `thresholdMet.out === 1;` so a valid
  proof asserts the org genuinely meets the threshold.
- **`credential_verification.circom`** — added `isValid === 1;` so a valid proof
  asserts the credential is genuinely valid (role ok AND not expired AND
  already issued AND issued-before-expiry).

Changing the constraint system changes the R1CS, the proving key (`.zkey`), the
verification key (`verification_key.json`), and the on-chain `*_verifier.sol`.
**All existing artifacts in `compiled/`, `keys/`, and `verifiers/` are now
stale and will fail verification or silently accept wrong proofs. They MUST be
regenerated.** This cannot be done from the repo state alone — it requires the
operational ceremony below.

---

## 1. Recompile the circuits (`circom`)

From `server/src/zkp/`:

```bash
# circom v2.1.6 (matches the `pragma circom 2.1.6;` in every circuit)
for c in compliance_check credential_verification data_ownership; do
  circom "circuits/$c.circom" \
    --r1cs --wasm --sym \
    -o compiled/ \
    -l ../../../node_modules
done
```

Verify each new `.r1cs` reports a **non-zero constraint count** and that the
count *increased* versus the old artifacts (the new `===` / `IsEqual` /
`GreaterEqThan` assertions add constraints). Note the new constraint counts —
they determine the minimum Powers-of-Tau size required in step 2.

`setup-circuits.sh` automates compile + setup, but it performs a **single-party**
phase-2 contribution (one `/dev/urandom` draw on the machine that runs it). That
is acceptable only for local development. **For production, do NOT trust a
single-party setup — run the real ceremony in step 2.**

---

## 2. Run a REAL multi-party trusted-setup ceremony (mandatory for production)

A Groth16 trusted setup is only sound if **at least one** participant honestly
destroyed their secret "toxic waste." A single-party setup means **one machine
held all the toxic waste**, so whoever controlled it can forge proofs. The
historical hardcoded-entropy setups (literal `"random text"`, `date +%s`) are
strictly worse — the toxic waste is *publicly recomputable*, making every proof
trivially forgeable.

### Phase 1 — Powers of Tau (circuit-independent, multi-party)

Either (a) **reuse a reputable existing Phase-1 ceremony** of sufficient size
(e.g. the Hermez `powersOfTau28_hez_final_NN.ptau`, see
`POWERS_OF_TAU_SOURCES.md`), choosing an `NN` whose `2^NN` exceeds the largest
new circuit's constraint count; **and verify its hash** against the published
transcript before use — or (b) **run your own** multi-contributor Phase 1:

```bash
snarkjs powersoftau new bn128 <NN> pot_0000.ptau -v
# Each independent contributor, on their OWN machine, in sequence:
snarkjs powersoftau contribute pot_000k.ptau pot_000{k+1}.ptau \
  --name="contributor-k" -v        # entropy prompted interactively — never scripted
# Apply a public, unpredictable random beacon to finalize:
snarkjs powersoftau beacon pot_final_in.ptau pot_beacon.ptau \
  <PUBLIC_BEACON_HASH> 10 -n="final beacon"
snarkjs powersoftau prepare phase2 pot_beacon.ptau pot_final.ptau -v
```

Use a **public, future-unpredictable** beacon value (e.g. a future Bitcoin/Ethereum
block hash, or a drand randomness round) — not a locally chosen number.

### Phase 2 — circuit-specific, multi-party (per circuit)

For **each** of the three circuits:

```bash
C=compliance_check   # repeat for credential_verification, data_ownership
snarkjs groth16 setup compiled/$C.r1cs pot_final.ptau ${C}_0000.zkey

# >=2 INDEPENDENT contributors, each on their own machine, in sequence.
# Each MUST supply fresh, high-entropy randomness and then DESTROY it.
snarkjs zkey contribute ${C}_000k.zkey ${C}_000{k+1}.zkey \
  --name="phase2-contributor-k" -v        # entropy prompted, NOT from a script/env

# Finalize with a public random beacon:
snarkjs zkey beacon ${C}_final_in.zkey ${C}_final.zkey \
  <PUBLIC_BEACON_HASH> 10 -n="phase2 final beacon"

# Export the verification key and the Solidity verifier:
snarkjs zkey export verificationkey ${C}_final.zkey keys/verification/${C}_vkey.json
snarkjs zkey export solidityverifier ${C}_final.zkey verifiers/${C}_verifier.sol
```

### Ceremony integrity requirements (all mandatory)

- **Multiple independent participants** on **separate machines** — never one
  operator running every round.
- **Entropy is interactive / hardware-sourced** — never a hardcoded string,
  never `date +%s`, never a single scripted `/dev/urandom` draw committed to a
  file. Each participant destroys their toxic waste after contributing.
- **Finalize with a public, unpredictable beacon.**
- **Publish the full transcript** (every intermediate `.zkey`/`.ptau` hash and
  each contributor's attestation) so anyone can verify the ceremony:
  ```bash
  snarkjs zkey verify compiled/$C.r1cs pot_final.ptau ${C}_final.zkey
  ```
- Record contributor identities, machine details, beacon source, and final
  hashes in a ceremony attestation document checked in alongside the keys.

---

## 3. Replace artifacts and redeploy verifiers

1. Move the new `*_final.zkey` proving keys into `keys/proving/` and the new
   `*_vkey.json` into `keys/verification/`, replacing the stale ones.
2. Replace the stale `verifiers/*_verifier.sol` with the freshly exported ones.
3. **If on-chain verification is adopted:** recompile and **redeploy** each
   `*_verifier.sol` to the target chain(s). Update every contract address /
   ABI reference in the app and infra config to point at the new deployments.
   The old verifier contracts correspond to the old constraint system and will
   reject valid new proofs (and could accept invalid ones for the old layout) —
   they must be retired.
4. Invalidate/rotate any cached verification keys or pinned key hashes held by
   services or clients.

---

## 4. Re-test end-to-end

1. Generate a witness + proof for each circuit with a **valid** input set
   (`test-end-to-end.js`, `test-zk-service.ts`) and confirm it **verifies**.
2. **Negative tests (these are the whole point of the new constraints):**
   - `compliance_check`: an input where the org does **not** meet the threshold
     must now **fail to produce a satisfying witness / fail verification**.
   - `credential_verification`: an expired, not-yet-issued, or under-privileged
     credential must **fail**.
   - `data_ownership`: a witness that does **not** know `sk` / whose recomputed
     commitments don't match the public ones must **fail** (previously this
     wrongly succeeded because the output was a constant `1`).
3. If on-chain: run the verifier-contract verification path against the redeployed
   contracts for both the valid (accept) and invalid (reject) cases.

---

## 5. Until the ceremony is complete

State this explicitly to stakeholders: **the circuit fixes close the logical
soundness holes (constant output / missing assertions), but cryptographic
soundness still depends on the trusted setup.** Until a genuine multi-party
ceremony (step 2) has been run and its transcript published, the proving keys
are not trustworthy and **generated proofs remain potentially forgeable**.
Do not gate any real security or compliance decision on ZK verification until
steps 1–4 are complete with a real ceremony.
