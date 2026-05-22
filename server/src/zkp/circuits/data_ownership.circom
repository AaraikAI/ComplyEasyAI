pragma circom 2.1.6;

include "../../../node_modules/circomlib/circuits/poseidon.circom";
include "../../../node_modules/circomlib/circuits/bitify.circom";

/*
 * Data Ownership Circuit (production-grade).
 *
 * PROVES, in zero-knowledge: the prover knows a private key sk such that
 *
 *   1.  ownerCommitment   = Poseidon([sk, userIdSalt])     (public commit to identity)
 *   2.  dataCommitment    = Poseidon([sk, dataHash, dataSalt])
 *                                                          (binds sk to dataHash without revealing sk)
 *   3.  nullifier         = Poseidon([sk, claimContext])   (prevents double-claim
 *                                                          across the same context)
 *   4.  ownerCommitment is the same one previously registered for the user
 *       (the chain's registry stores ownerCommitment; the verifier checks it
 *       matches the public input here, so no off-chain key reveal is needed).
 *
 * Crucially, the proof reveals NOTHING about sk to anyone — neither the
 * verifier nor the data's hash holder learns sk. This is the property the
 * old skeleton-circuit (`out <== privateKey + dataHash`) catastrophically
 * failed to provide.
 *
 * PUBLIC INPUTS:
 *   userIdSalt           - per-user randomness anchoring the identity commit
 *   dataHash             - hash of the data being claimed
 *   dataSalt             - per-claim randomness
 *   ownerCommitment      - identity commitment previously registered on-chain
 *   dataCommitment       - the claim being attested
 *   claimContext         - a context tag (e.g. policy id, jurisdiction)
 *   nullifier            - anti-replay
 *
 * PRIVATE INPUTS:
 *   sk                   - 254-bit private key (field element)
 *
 * OUTPUTS:
 *   ownershipVerified    - 1 if all commitments match
 */
template DataOwnership() {
    // ----- private input -----
    signal input sk;

    // ----- public inputs -----
    signal input userIdSalt;
    signal input dataHash;
    signal input dataSalt;
    signal input ownerCommitment;
    signal input dataCommitment;
    signal input claimContext;
    signal input nullifier;

    // ----- output -----
    signal output ownershipVerified;

    // 1. Range-check sk to 254 bits (field-size minus margin for BN254)
    component skBits = Num2Bits(254);
    skBits.in <== sk;

    // 2. Owner commitment: Poseidon(sk, userIdSalt)
    component ownerHash = Poseidon(2);
    ownerHash.inputs[0] <== sk;
    ownerHash.inputs[1] <== userIdSalt;
    ownerHash.out === ownerCommitment;

    // 3. Data commitment: Poseidon(sk, dataHash, dataSalt)
    component dataHasher = Poseidon(3);
    dataHasher.inputs[0] <== sk;
    dataHasher.inputs[1] <== dataHash;
    dataHasher.inputs[2] <== dataSalt;
    dataHasher.out === dataCommitment;

    // 4. Nullifier: Poseidon(sk, claimContext)
    component nullHash = Poseidon(2);
    nullHash.inputs[0] <== sk;
    nullHash.inputs[1] <== claimContext;
    nullHash.out === nullifier;

    // All three Poseidon constraints simultaneously satisfied => ownership proven
    ownershipVerified <== 1;
}

component main {public [userIdSalt, dataHash, dataSalt, ownerCommitment, dataCommitment, claimContext, nullifier]} = DataOwnership();
