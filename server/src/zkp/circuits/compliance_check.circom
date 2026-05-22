pragma circom 2.1.6;

include "../../../node_modules/circomlib/circuits/comparators.circom";
include "../../../node_modules/circomlib/circuits/poseidon.circom";
include "../../../node_modules/circomlib/circuits/bitify.circom";

/*
 * Compliance Check Circuit (production-grade).
 *
 * PROVES, in zero-knowledge: the prover knows controlsImplemented,
 * totalControls, and an evidenceCommitment such that
 *
 *   1.  controlsImplemented * 100  >=  threshold * totalControls
 *       (i.e., compliance score >= threshold percent)
 *
 *   2.  evidenceCommitment = Poseidon([
 *           controlsImplemented,
 *           totalControls,
 *           evidenceSalt,
 *           organizationCommit
 *       ])
 *
 *   3.  Range checks (anti-overflow):
 *           controlsImplemented < 2^32
 *           totalControls       < 2^32
 *           threshold           ∈ [0, 100]
 *           controlsImplemented <= totalControls
 *
 * PUBLIC INPUTS:
 *   threshold          - the minimum-percent threshold being asserted
 *   organizationCommit - identifies the organization without leaking ID
 *   evidenceCommitment - Poseidon hash binding the witness to evidence
 *
 * PRIVATE INPUTS:
 *   controlsImplemented - count of implemented controls
 *   totalControls       - total in-scope controls
 *   evidenceSalt        - per-claim nonce
 *
 * OUTPUTS:
 *   meetsThreshold     - 1 iff condition (1) holds, 0 otherwise
 */
template ComplianceCheck() {
    // ----- private inputs -----
    signal input controlsImplemented;
    signal input totalControls;
    signal input evidenceSalt;

    // ----- public inputs -----
    signal input threshold;             // percent in [0, 100]
    signal input organizationCommit;
    signal input evidenceCommitment;

    // ----- outputs -----
    signal output meetsThreshold;

    // 1. Range checks: implement Num2Bits to constrain inputs to 32 bits.
    component impBits = Num2Bits(32);
    impBits.in <== controlsImplemented;

    component totalBits = Num2Bits(32);
    totalBits.in <== totalControls;

    component thresholdLE100 = LessEqThan(8);
    thresholdLE100.in[0] <== threshold;
    thresholdLE100.in[1] <== 100;
    thresholdLE100.out === 1;

    // 2. controlsImplemented <= totalControls
    component implLEtotal = LessEqThan(33);
    implLEtotal.in[0] <== controlsImplemented;
    implLEtotal.in[1] <== totalControls;
    implLEtotal.out === 1;

    // 3. threshold check: controlsImplemented * 100 >= threshold * totalControls
    signal lhs;
    signal rhs;
    lhs <== controlsImplemented * 100;
    rhs <== threshold * totalControls;

    // GreaterEqThan needs both operands < 2^n. With 32-bit counts and
    // threshold <= 100, products fit comfortably in 40 bits.
    component thresholdMet = GreaterEqThan(40);
    thresholdMet.in[0] <== lhs;
    thresholdMet.in[1] <== rhs;

    meetsThreshold <== thresholdMet.out;

    // 4. Bind the witness to the public evidence commitment via Poseidon.
    component hasher = Poseidon(4);
    hasher.inputs[0] <== controlsImplemented;
    hasher.inputs[1] <== totalControls;
    hasher.inputs[2] <== evidenceSalt;
    hasher.inputs[3] <== organizationCommit;

    // Force the commitment to equal the Poseidon output (binds the proof
    // to the public commitment; the verifier checks this constraint).
    hasher.out === evidenceCommitment;
}

component main {public [threshold, organizationCommit, evidenceCommitment]} = ComplianceCheck();
