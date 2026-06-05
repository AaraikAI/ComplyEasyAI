pragma circom 2.1.6;

include "../../../node_modules/circomlib/circuits/comparators.circom";
include "../../../node_modules/circomlib/circuits/poseidon.circom";
include "../../../node_modules/circomlib/circuits/bitify.circom";

/*
 * Credential Verification Circuit (production-grade).
 *
 * PROVES, in zero-knowledge: the prover holds a credential C such that
 *
 *   1.  C.roleLevel >= requiredRoleLevel
 *   2.  C.expiryTimestamp >= currentTimestamp        (not expired)
 *   3.  C.issuedTimestamp <= currentTimestamp        (already issued)
 *   4.  credentialCommitment = Poseidon([
 *           roleLevel,
 *           permissionsHash,
 *           issuedTimestamp,
 *           expiryTimestamp,
 *           subjectSecret
 *       ])
 *   5.  nullifier = Poseidon([subjectSecret, currentTimestamp])
 *       (binds proof to a specific use-instant, prevents replay)
 *
 * PUBLIC INPUTS:
 *   currentTimestamp        - epoch seconds at proof-time
 *   requiredRoleLevel       - minimum role level being asserted
 *   credentialCommitment    - Poseidon commitment binding the credential
 *   nullifier               - replay-prevention nullifier
 *
 * PRIVATE INPUTS:
 *   roleLevel               - role tier (0..255)
 *   permissionsHash         - opaque permissions identifier
 *   issuedTimestamp         - credential issuance time
 *   expiryTimestamp         - credential expiry time
 *   subjectSecret           - per-subject random secret
 *
 * OUTPUTS:
 *   isValid                 - 1 iff all conditions hold
 */
template CredentialVerification() {
    // ----- private inputs -----
    signal input roleLevel;
    signal input permissionsHash;
    signal input issuedTimestamp;
    signal input expiryTimestamp;
    signal input subjectSecret;

    // ----- public inputs -----
    signal input currentTimestamp;
    signal input requiredRoleLevel;
    signal input credentialCommitment;
    signal input nullifier;

    // ----- output -----
    signal output isValid;

    // 1. Range checks
    component roleBits = Num2Bits(8);
    roleBits.in <== roleLevel;
    component reqRoleBits = Num2Bits(8);
    reqRoleBits.in <== requiredRoleLevel;
    component issuedBits = Num2Bits(64);
    issuedBits.in <== issuedTimestamp;
    component expiryBits = Num2Bits(64);
    expiryBits.in <== expiryTimestamp;
    component nowBits = Num2Bits(64);
    nowBits.in <== currentTimestamp;

    // 2. roleLevel >= requiredRoleLevel
    component roleOk = GreaterEqThan(8);
    roleOk.in[0] <== roleLevel;
    roleOk.in[1] <== requiredRoleLevel;

    // 3. expiryTimestamp >= currentTimestamp (not expired)
    component notExpired = GreaterEqThan(64);
    notExpired.in[0] <== expiryTimestamp;
    notExpired.in[1] <== currentTimestamp;

    // 4. issuedTimestamp <= currentTimestamp (already issued)
    component alreadyIssued = LessEqThan(64);
    alreadyIssued.in[0] <== issuedTimestamp;
    alreadyIssued.in[1] <== currentTimestamp;

    // 5. issuedTimestamp <= expiryTimestamp (sanity: issued before it expires)
    component issuedBeforeExpiry = LessEqThan(64);
    issuedBeforeExpiry.in[0] <== issuedTimestamp;
    issuedBeforeExpiry.in[1] <== expiryTimestamp;

    // Conjunction: all four must hold
    signal v1;
    signal v2;
    signal v3;
    v1 <== roleOk.out * notExpired.out;
    v2 <== v1 * alreadyIssued.out;
    v3 <== v2 * issuedBeforeExpiry.out;
    isValid <== v3;

    // A valid proof MUST assert the credential is genuinely valid: role ok AND
    // not expired AND already issued AND issued-before-expiry. Without this the
    // proof asserts nothing — a witness with isValid == 0 would still verify.
    isValid === 1;

    // 6. Bind to credential commitment via Poseidon
    component credHash = Poseidon(5);
    credHash.inputs[0] <== roleLevel;
    credHash.inputs[1] <== permissionsHash;
    credHash.inputs[2] <== issuedTimestamp;
    credHash.inputs[3] <== expiryTimestamp;
    credHash.inputs[4] <== subjectSecret;
    credHash.out === credentialCommitment;

    // 7. Bind to nullifier via Poseidon (anti-replay)
    component nullHash = Poseidon(2);
    nullHash.inputs[0] <== subjectSecret;
    nullHash.inputs[1] <== currentTimestamp;
    nullHash.out === nullifier;
}

component main {public [currentTimestamp, requiredRoleLevel, credentialCommitment, nullifier]} = CredentialVerification();
