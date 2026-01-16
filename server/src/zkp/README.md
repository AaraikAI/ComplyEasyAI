# Zero-Knowledge Proof (zk-SNARK) Circuit Setup

This directory contains zk-SNARK circuits for privacy-preserving compliance verification.

## Status: OPTIONAL (Production Guard Enabled)

The zero-knowledge proof service has production guards in place:
- **Development**: Uses simulated proofs (for testing only)
- **Production**: Requires real circuit files OR will throw error if attempted

## Required Circuits

The service expects the following circuits:

1. **compliance_check** - Prove compliance status without revealing details
2. **credential_verification** - Verify credentials without exposing them
3. **data_ownership** - Prove ownership of data without revealing the data

## Directory Structure

```
zkp/
├── circuits/           # Circom circuit source files (.circom)
├── compiled/
│   ├── wasm/          # Compiled WASM files
│   └── r1cs/          # R1CS constraint files
├── keys/
│   ├── proving/       # Proving keys (.zkey)
│   └── verification/  # Verification keys (.vkey)
└── proofs/            # Generated proofs (runtime)
```

## Setup Instructions

### Prerequisites

```bash
npm install -g circom
npm install -g snarkjs
```

### Step 1: Write Circuit (Example)

Create `circuits/compliance_check.circom`:

```circom
pragma circom 2.0.0;

template ComplianceCheck() {
    signal input complianceScore;
    signal input threshold;
    signal output isCompliant;

    isCompliant <== complianceScore >= threshold;
}

component main = ComplianceCheck();
```

### Step 2: Compile Circuit

```bash
cd circuits
circom compliance_check.circom --r1cs --wasm --sym -o ../compiled
```

### Step 3: Trusted Setup (Powers of Tau)

```bash
# Download powers of tau (or generate your own)
wget https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_15.ptau

# Generate zkey
snarkjs groth16 setup compiled/r1cs/compliance_check.r1cs powersOfTau28_hez_final_15.ptau keys/proving/compliance_check.zkey

# Export verification key
snarkjs zkey export verificationkey keys/proving/compliance_check.zkey keys/verification/compliance_check.vkey
```

### Step 4: Repeat for All Circuits

Repeat steps 1-3 for:
- `credential_verification.circom`
- `data_ownership.circom`

## Production Deployment

### Option 1: Pre-compile Circuits (Recommended)

1. Compile circuits locally
2. Include compiled files in deployment
3. Set `NODE_ENV=production`

### Option 2: Disable Feature

If you don't need zero-knowledge proofs:
- The service will throw errors if accessed
- This is by design (fail-safe behavior)
- No action needed

## Development Mode

In development (`NODE_ENV=development`):
- Service uses simulated proofs
- No circuit files required
- For testing/demo purposes only

## Security Notes

- **Never use simulated proofs in production**
- Trusted setup must be performed securely
- Consider multi-party computation (MPC) for setup
- Keep proving keys secure
- Verification keys can be public

## Circuit File Sizes

Expected file sizes:
- `.wasm`: ~50-500 KB
- `.zkey`: ~5-50 MB
- `.vkey`: ~1-5 KB

## Verification

Check if circuit files are loaded:

```bash
ls -lh compiled/wasm/
ls -lh keys/proving/
ls -lh keys/verification/
```

All three files must exist for each circuit:
- `{circuit_name}.wasm`
- `{circuit_name}.zkey`
- `{circuit_name}.vkey`

## Further Resources

- Circom documentation: https://docs.circom.io/
- SnarkJS documentation: https://github.com/iden3/snarkjs
- ZK-SNARK explainer: https://z.cash/technology/zksnarks/

## Support

If you need help setting up zk-SNARK circuits, contact your development team or refer to the Circom community.
