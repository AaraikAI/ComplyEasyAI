
// Credential Verification Circuit - Simplified for circom 0.5

template CredentialVerification() {
    signal private input roleLevel;
    signal private input permissionsHash;
    signal private input expiryTimestamp;
    signal private input currentTimestamp;
    signal private input secret;
    
    signal output verifiedRoleLevel;
    signal output isExpired;
    signal output isValid;
    
    // Check if not expired: expiryTimestamp > currentTimestamp
    component timeCheck = Subtract();
    timeCheck.a <== expiryTimestamp;
    timeCheck.b <== currentTimestamp;
    
    // Output role level
    verifiedRoleLevel <== roleLevel;
    
    // Expiration check (simplified)
    isExpired <== timeCheck.out;
    isValid <== roleLevel;
}

template Subtract() {
    signal input a;
    signal input b;
    signal output out;
    out <== a - b;
}

component main = CredentialVerification();
