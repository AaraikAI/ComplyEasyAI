
// Data Ownership Circuit - Simplified for circom 0.5

template DataOwnership() {
    signal private input dataHash;
    signal private input privateKey;
    signal private input userId;
    
    signal output userIdHash;
    signal output ownershipVerified;
    
    // Hash userId for public output
    component hashUserId = Hash();
    hashUserId.in <== userId;
    
    // Verify ownership
    component hashOwnership = Hash();
    hashOwnership.in <== privateKey + dataHash;
    
    userIdHash <== hashUserId.out;
    ownershipVerified <== hashOwnership.out;
}

template Hash() {
    signal input in;
    signal output out;
    // Simplified hash: just pass through (in production use proper hash)
    out <== in;
}

component main = DataOwnership();
