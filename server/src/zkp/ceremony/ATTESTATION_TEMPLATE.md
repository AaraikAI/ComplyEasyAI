# Phase-2 Ceremony — Participant Attestation

> One signed copy per participant, per circuit (or one copy listing all three
> circuit rows if a participant contributed to each). Check the completed,
> signed attestations into the published ceremony transcript alongside the keys.

## Participant identity

- **Participant name / handle:** ______________________________________________
- **Affiliation / role:** ____________________________________________________
- **Contact (email or key fingerprint):** ____________________________________

## Machine & environment

- **Machine description (host, OS, owner):** _________________________________
- **OS version (`uname -a`):** _______________________________________________
- **Date/time of contribution (UTC):** _______________________________________
- **snarkjs version (`snarkjs --version` or `npx snarkjs --version`):** _______
- **Node.js version (`node -v`):** ___________________________________________

## Contribution chain (per circuit)

| Circuit | Input zkey SHA-256 | Output zkey SHA-256 | Contribution label |
|---------|--------------------|---------------------|--------------------|
| compliance_check          |  |  |  |
| credential_verification   |  |  |  |
| data_ownership            |  |  |  |

> The **input** SHA-256 must equal the SHA-256 published by the previous holder
> (the coordinator for participant 1). The **output** SHA-256 is what this
> participant published to the next holder. These come from
> `01-participant-contribute.sh`'s printed hand-off block.

## Entropy & toxic-waste statement

I attest that, for each contribution above:

- [ ] The secret randomness ("toxic waste") was drawn **fresh** from the OS
      cryptographically-secure RNG (`/dev/urandom`) on **my own machine**, via
      `ceremony/01-participant-contribute.sh`.
- [ ] I did **NOT** use any predictable, hardcoded, derived, or reused value
      (no constant string, no `date`/timestamp, no value reused across runs or
      circuits).
- [ ] The entropy was held only in process memory and was **NOT** written to
      disk, committed, logged, or transmitted to anyone.
- [ ] I have **securely destroyed** the toxic waste (closed the shell session,
      cleared scrollback, and deleted any incidental copies). I no longer possess
      it and cannot reconstruct it.
- [ ] I verified the **input** zkey (`snarkjs zkey verify`) and confirmed its
      SHA-256 matched the previous holder's published hash **before** contributing.
- [ ] I transmitted **only** the output `.zkey` (and its SHA-256) onward — never
      the entropy.

## Beacon awareness (informational)

- [ ] I understand the ceremony is finalized by the coordinator with a **public,
      future-unpredictable random beacon**, and that soundness requires **at least
      one** participant (this attestation supports that guarantee) to have honestly
      destroyed their toxic waste.

## Signature

- **Signature (PGP-signed text, wet signature image, or org-verified attestation):**

  ____________________________________________________________________________

- **Date:** _______________________
