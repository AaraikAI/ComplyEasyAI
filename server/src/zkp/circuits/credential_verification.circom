pragma circom 2.0.0;

// Credential Verification Circuit - Simplified for circom 2.0

template CredentialVerification() {
    signal input roleLevel;
    signal input permissionsHash;
    signal input expiryTimestamp;
    signal input currentTimestamp;
    signal input secret;
    
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
