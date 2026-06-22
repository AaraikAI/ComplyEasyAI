# Distributed Multi-Party Phase-2 Trusted-Setup Ceremony (Groth16)

**Scope:** the three production circuits under `server/src/zkp/circuits/`:
`compliance_check`, `credential_verification`, `data_ownership`.

This directory contains the tooling for a **real distributed** Groth16 phase-2
trusted-setup ceremony, in which several **independent participants on separate,
independently-controlled machines** each contribute fresh secret randomness to
each circuit's proving key, in sequence, and then a **public random beacon**
finalizes the key.

> ⚠️ **This complements — it does NOT replace — the soundness narrative in
> `../ZK_OPERATIONAL_RUNBOOK.md`.** The local automated path (`../setup-circuits.sh`)
> performs a **single-party** phase-2 contribution: one `/dev/urandom` draw on one
> machine. That is acceptable for local development only. For production you MUST
> run the distributed ceremony described here, because a single-party setup means
> **one machine held all the toxic waste** and whoever controlled it can forge proofs.

---

## 1. Why a distributed phase-2 ceremony

A Groth16 proving key is only **cryptographically sound** if **at least one**
phase-2 contributor honestly generated high-entropy secret randomness and then
**destroyed it** ("discarded the toxic waste"). The contributions compose: the
combined secret is a function of every participant's secret, so an attacker would
have to compromise **every** participant simultaneously to reconstruct it.

Therefore:

- **N independent participants on N separate machines** ⇒ an attacker must defeat
  all N. Even if N−1 are malicious or compromised, the **single honest** participant
  who discarded their toxic waste makes the final key sound. This is the
  **"1-of-N honest"** guarantee.
- A **single-party** setup collapses to "1-of-1 honest" — there is no safety margin,
  and the operator of that one machine can forge proofs.
- **Predictable entropy is catastrophic.** Historical setups that used literal
  `"random text"` or `date +%s` make the toxic waste *publicly recomputable*, so
  every proof is trivially forgeable. **All scripts here draw entropy ONLY from the
  OS CSPRNG (`/dev/urandom`)** — never a constant, never a timestamp, never a
  committed file.

### Phase 1 vs Phase 2

- **Phase 1 (Powers of Tau)** is circuit-independent. We **reuse** the reputable
  Hermez ceremony file `powersOfTau28_hez_final_12.ptau`, whose SHA-256 is pinned in
  `../checksums.sha256` and whose blake2b transcript hash is documented in
  `../POWERS_OF_TAU_SOURCES.md`. Verify it (`snarkjs powersoftau verify`) before use.
  Running your own Phase 1 is out of scope for this directory (see the runbook).
- **Phase 2** is **circuit-specific** and is what this ceremony performs: starting
  from the initial `<name>_0000.zkey` produced by `snarkjs groth16 setup`, each
  participant runs `snarkjs zkey contribute` in turn, then the coordinator applies
  `snarkjs zkey beacon`.

---

## 2. Roles

| Role | Count | Responsibility |
|------|-------|----------------|
| **Coordinator** | 1 | Produces the initial `_0000.zkey` (`00-coordinator-init.sh`), relays the intermediate `.zkey` between participants, applies the final public beacon (`02-finalize-beacon.sh`), publishes the transcript. The coordinator **never** sees any participant's secret entropy. |
| **Participants** | N ≥ 2 (more is better) | Each runs `01-participant-contribute.sh` on their **own** machine, draws fresh `/dev/urandom` entropy, contributes, **destroys** their toxic waste, and signs an attestation (`ATTESTATION_TEMPLATE.md`). |
| **Verifiers** | ≥ 1 (anyone) | Independently re-verifies the published transcript with `03-verify-transcript.sh`. |

The coordinator may also be a participant, but the ceremony's safety comes from the
participants being **independent** — do not let one person run every round.

---

## 3. The sequential hand-off

The intermediate `.zkey` is passed from participant to participant **in sequence**.
Only the `.zkey` file travels — **never** the entropy.

```
coordinator: groth16 setup            -> compliance_check_0000.zkey
                                          |  (hand off .zkey + its SHA-256)
participant 1 (own machine): contribute -> compliance_check_0001.zkey
                                          |  (hand off .zkey + its SHA-256)
participant 2 (own machine): contribute -> compliance_check_0002.zkey
                                          |  ...
participant N (own machine): contribute -> compliance_check_000N.zkey
                                          |  (hand off .zkey + its SHA-256)
coordinator: zkey beacon              -> compliance_check.zkey   (FINAL)
coordinator: export verificationkey   -> keys/verification/compliance_check.vkey
```

At every hand-off the **sender publishes the SHA-256** of the file they produced and
the **receiver re-computes it** before contributing on top. This chains the
transcript so any tampering in transit is detected. Repeat the entire chain
independently for each of the three circuits.

---

## 4. Step-by-step runbook

All commands assume the working directory `server/src/zkp/` and that the circuits
have already been compiled (`compiled/<name>.r1cs` exists — see
`../ZK_OPERATIONAL_RUNBOOK.md` §1) and the pinned `powersOfTau28_hez_final_12.ptau`
is present and verified.

### Step 0 — Coordinator: initialize each circuit

On the coordinator machine, for each circuit:

```bash
ceremony/00-coordinator-init.sh compliance_check
ceremony/00-coordinator-init.sh credential_verification
ceremony/00-coordinator-init.sh data_ownership
```

This runs `snarkjs groth16 setup <name>.r1cs <ptau> <name>_0000.zkey` and prints the
SHA-256 of each `_0000.zkey`. Send `<name>_0000.zkey` **and** its printed SHA-256 to
**Participant 1**.

### Step 1 — Each participant contributes (own machine, in sequence)

Participant *k* receives `<name>_<k-1 padded>.zkey` from the previous holder, along
with its expected SHA-256, then runs:

```bash
# args: <circuit> <input.zkey> <output.zkey> <participant-name>
ceremony/01-participant-contribute.sh \
  compliance_check \
  compliance_check_0000.zkey \
  compliance_check_0001.zkey \
  "Alice (Org Security, laptop-A)"
```

The script:
1. **Verifies** the input zkey against the ptau + r1cs (`snarkjs zkey verify`).
2. Draws **fresh** entropy from `/dev/urandom` (never reused, never a constant).
3. Runs `snarkjs zkey contribute` with a unique `--name`.
4. Prints the **output SHA-256** to hand to the next participant.
5. Reminds the participant to **securely discard** their machine's entropy and fill in
   `ATTESTATION_TEMPLATE.md`.

Participant *k* sends `<name>_<k>.zkey` + its SHA-256 to participant *k+1*. The last
participant sends their output back to the **coordinator**.

### Step 2 — Coordinator: finalize with a public random beacon

Choose a **public, future-unpredictable** beacon (see §6) and apply it:

```bash
# args: <circuit> <last-participant.zkey> <beacon-hash-hex> <iterations>
ceremony/02-finalize-beacon.sh \
  compliance_check \
  compliance_check_0003.zkey \
  0000000000000000000... \
  10
```

This runs `snarkjs zkey beacon` to produce the final `keys/proving/<name>.zkey`,
exports `keys/verification/<name>.vkey`, and runs `snarkjs zkey verify`.

### Step 3 — Anyone: verify the transcript

```bash
ceremony/03-verify-transcript.sh
```

Loops over all three circuits, runs `snarkjs zkey verify`, re-exports each vkey and
diffs it against the published one, and prints **PASS/FAIL** per circuit.

### Step 4 — Publish the transcript

Check in alongside the keys: every intermediate `.zkey` SHA-256, each participant's
completed `ATTESTATION_TEMPLATE.md`, the beacon source + value + iteration count, and
the final `.zkey`/`.vkey` SHA-256s. Anyone can then re-run Step 3 to verify.

---

## 5. snarkjs command reference

| Purpose | Command |
|---------|---------|
| Initial phase-2 key | `snarkjs groth16 setup <name>.r1cs <ptau> <name>_0000.zkey` |
| Participant contribution | `snarkjs zkey contribute <in>.zkey <out>.zkey --name="..." -v` |
| Apply public beacon (finalize) | `snarkjs zkey beacon <in>.zkey <final>.zkey <BEACON_HEX> <ITERS> -n="..."` |
| Verify a key against r1cs+ptau | `snarkjs zkey verify <name>.r1cs <ptau> <name>.zkey` |
| Export verification key | `snarkjs zkey export verificationkey <final>.zkey <name>.vkey` |

> The contribute scripts pass entropy via `-e=` drawn from `/dev/urandom`. snarkjs also
> supports interactive entropy prompts; either is acceptable **as long as the entropy is
> never a predictable constant**. These scripts use a fresh per-run OS-CSPRNG draw.

---

## 6. Choosing a public random beacon

The beacon makes the final secret depend on a value **no participant could predict**
when they contributed, removing any "last contributor" advantage. Pick a
**publicly-verifiable future** value, announce it in advance, then use it once it is
fixed:

- A **future Bitcoin block hash** at a pre-announced height (e.g. "the hash of the
  first Bitcoin block mined after 2026-07-01 00:00 UTC"). Strip the `0x`; pass the
  64-hex string.
- A **drand** randomness round (https://drand.love) at a pre-announced round number.
- A future **Ethereum** block hash at a pre-announced height.

Document the exact source, height/round, and resulting hex in the transcript so a
verifier can independently confirm the beacon was not cherry-picked.

---

## 7. Verification checklist

Before trusting the ceremony output, confirm **all** of the following:

- [ ] Phase-1 `powersOfTau28_hez_final_12.ptau` SHA-256 matches `../checksums.sha256`
      and `snarkjs powersoftau verify` passes.
- [ ] `<name>_0000.zkey` was produced by `snarkjs groth16 setup` (coordinator step).
- [ ] **≥ 2 independent participants** contributed, each on a **separate machine**.
- [ ] The intermediate `.zkey` SHA-256 chain is unbroken: each participant's input
      hash equals the previous participant's published output hash.
- [ ] Every participant attests (signed `ATTESTATION_TEMPLATE.md`) that entropy came
      from `/dev/urandom` and toxic waste was **destroyed**. No predictable entropy.
- [ ] The final beacon is a **public, future-unpredictable** value, announced in
      advance, with source documented.
- [ ] `snarkjs zkey verify <name>.r1cs <ptau> <name>.zkey` passes for **all three**
      circuits (run `03-verify-transcript.sh`).
- [ ] The exported `<name>.vkey` re-derived from the final `.zkey` matches the
      published vkey (byte-for-byte; the verify script diffs this).
- [ ] The full transcript (hashes + attestations + beacon) is published/checked in.

If any box is unchecked, the proving keys are **not** trustworthy and generated
proofs remain potentially forgeable — do not gate any security or compliance
decision on ZK verification.
