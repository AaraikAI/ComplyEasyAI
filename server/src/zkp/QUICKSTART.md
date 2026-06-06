# 🚀 Quick Start: Generate zk-SNARK Circuit Files

This guide will help you generate the required circuit files (.wasm, .zkey, .vkey) in **5-10 minutes**.

---

## ⚡ Automated Setup (RECOMMENDED)

### Step 1: Navigate to zkp directory

```bash
cd /home/user/ComplyEasyAI/server/src/zkp
```

### Step 2: Run the automated setup script

```bash
./setup-circuits.sh
```

**That's it!** The script will:
- ✅ Install circom compiler
- ✅ Install snarkjs
- ✅ Download Powers of Tau
- ✅ Compile all 3 circuits
- ✅ Generate proving keys (.zkey)
- ✅ Export verification keys (.vkey)
- ✅ Test the circuits

**Time:** 5-10 minutes (mostly downloads)

---

## 📋 What You'll Get

After running the script, you'll have:

```
zkp/
├── compiled/
│   ├── wasm/
│   │   ├── compliance_check.wasm           (~50 KB)
│   │   ├── credential_verification.wasm    (~45 KB)
│   │   └── data_ownership.wasm             (~40 KB)
│   └── r1cs/ (constraint files)
├── keys/
│   ├── proving/
│   │   ├── compliance_check.zkey           (~5-10 MB)
│   │   ├── credential_verification.zkey    (~5-10 MB)
│   │   └── data_ownership.zkey             (~5-10 MB)
│   └── verification/
│       ├── compliance_check.vkey           (~1 KB)
│       ├── credential_verification.vkey    (~1 KB)
│       └── data_ownership.vkey             (~1 KB)
```

**Total disk space:** ~20-30 MB

---

## 🔧 Manual Setup (If Automated Fails)

### Prerequisites

Install circom and snarkjs:

```bash
# Install circom (Linux)
curl -L -o /tmp/circom https://github.com/iden3/circom/releases/download/v2.1.6/circom-linux-amd64
chmod +x /tmp/circom
sudo mv /tmp/circom /usr/local/bin/circom

# Install circom (macOS)
curl -L -o /tmp/circom https://github.com/iden3/circom/releases/download/v2.1.6/circom-macos-amd64
chmod +x /tmp/circom
sudo mv /tmp/circom /usr/local/bin/circom

# Install snarkjs
npm install -g snarkjs
```

### Download Powers of Tau

```bash
cd /home/user/ComplyEasyAI/server/src/zkp
curl -L -o powersOfTau28_hez_final_12.ptau https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_12.ptau

# MANDATORY: verify integrity before consuming the file. The pinned hash is
# published in POWERS_OF_TAU_SOURCES.md and enforced by setup-circuits.sh.
echo "dcf4ea473bf14b971ce5f7b7c1d6ce1c41a8ed042cdb75b65ca9178e3a3c7c17  powersOfTau28_hez_final_12.ptau" | sha256sum -c -
# Abort the setup if the checksum does not match (sha256sum -c exits non-zero).
```

### Compile Each Circuit

```bash
# Circuit 1: compliance_check
circom circuits/compliance_check.circom --r1cs --wasm --sym -o compiled/
mkdir -p compiled/wasm
cp compiled/compliance_check_js/compliance_check.wasm compiled/wasm/
rm -rf compiled/compliance_check_js

# Circuit 2: credential_verification
circom circuits/credential_verification.circom --r1cs --wasm --sym -o compiled/
cp compiled/credential_verification_js/credential_verification.wasm compiled/wasm/
rm -rf compiled/credential_verification_js

# Circuit 3: data_ownership
circom circuits/data_ownership.circom --r1cs --wasm --sym -o compiled/
cp compiled/data_ownership_js/data_ownership.wasm compiled/wasm/
rm -rf compiled/data_ownership_js
```

### Generate Keys for Each Circuit (development / local only)

> ⚠️ **Single-party setup — NOT for production.** The contribute steps below run
> `snarkjs zkey contribute` interactively, which prompts for keyboard entropy. Do
> **not** seed entropy from a recomputable source such as a clock value — anyone
> who knows the contribution time can recover the toxic waste and forge proofs.
> The `-e` flag is omitted so snarkjs collects interactive entropy; supply
> hardware/CSPRNG entropy when you script it (e.g. `-e="$(head -c 64 /dev/urandom | base64)"`).
>
> For any deployment that verifies real user data, you **must** run the
> multi-party trusted-setup ceremony described in
> [`ZK_OPERATIONAL_RUNBOOK.md`](./ZK_OPERATIONAL_RUNBOOK.md) instead of this
> single-party flow.

```bash
mkdir -p keys/proving keys/verification

# For compliance_check
snarkjs groth16 setup compiled/compliance_check.r1cs powersOfTau28_hez_final_12.ptau keys/proving/compliance_check_0000.zkey
snarkjs zkey contribute keys/proving/compliance_check_0000.zkey keys/proving/compliance_check.zkey --name="ComplyEasyAI"
snarkjs zkey export verificationkey keys/proving/compliance_check.zkey keys/verification/compliance_check.vkey
rm keys/proving/compliance_check_0000.zkey

# For credential_verification
snarkjs groth16 setup compiled/credential_verification.r1cs powersOfTau28_hez_final_12.ptau keys/proving/credential_verification_0000.zkey
snarkjs zkey contribute keys/proving/credential_verification_0000.zkey keys/proving/credential_verification.zkey --name="ComplyEasyAI"
snarkjs zkey export verificationkey keys/proving/credential_verification.zkey keys/verification/credential_verification.vkey
rm keys/proving/credential_verification_0000.zkey

# For data_ownership
snarkjs groth16 setup compiled/data_ownership.r1cs powersOfTau28_hez_final_12.ptau keys/proving/data_ownership_0000.zkey
snarkjs zkey contribute keys/proving/data_ownership_0000.zkey keys/proving/data_ownership.zkey --name="ComplyEasyAI"
snarkjs zkey export verificationkey keys/proving/data_ownership.zkey keys/verification/data_ownership.vkey
rm keys/proving/data_ownership_0000.zkey
```

---

## ✅ Verify Setup

Check all files are present:

```bash
cd /home/user/ComplyEasyAI/server/src/zkp

# Check WASM files
ls -lh compiled/wasm/

# Check proving keys
ls -lh keys/proving/

# Check verification keys
ls -lh keys/verification/
```

You should see 3 files in each directory.

---

## 🧪 Test the Circuits

Create a test input file:

```bash
cat > test_input.json << 'EOF'
{
    "controlsImplemented": "90",
    "totalControls": "100",
    "evidenceHash": "12345",
    "threshold": "80"
}
EOF
```

Generate and verify a proof:

```bash
# Generate proof
snarkjs groth16 fullprove \
    test_input.json \
    compiled/wasm/compliance_check.wasm \
    keys/proving/compliance_check.zkey \
    proof.json \
    public.json

# Verify proof
snarkjs groth16 verify \
    keys/verification/compliance_check.vkey \
    public.json \
    proof.json
```

If you see "OK!" then it worked! 🎉

Clean up test files:
```bash
rm test_input.json proof.json public.json
```

---

## 🔐 Security Considerations

### For Development/Testing:
- ✅ The automated script is fine
- ✅ Single-party trusted setup is acceptable

### For Production (High Security):
Consider a **multi-party trusted setup**:
1. Multiple parties contribute randomness
2. Only one party needs to be honest
3. Prevents single point of compromise

See: https://docs.circom.io/getting-started/proving-circuits/#powers-of-tau

---

## 🚀 Using in Your Application

Once setup is complete:

1. **Development Mode** (`NODE_ENV=development`):
   - Falls back to simulated proofs if files missing
   - Useful for testing UI/UX

2. **Production Mode** (`NODE_ENV=production`):
   - Uses real zk-SNARK proofs with these files
   - Throws error if files are missing (fail-safe)

The `zeroKnowledgeService.ts` automatically detects and loads these files.

---

## 🆘 Troubleshooting

### "circom: command not found"
```bash
# Make sure you have Node.js installed
node --version

# Install circom manually
curl -L -o /tmp/circom https://github.com/iden3/circom/releases/download/v2.1.6/circom-linux-amd64
chmod +x /tmp/circom
sudo mv /tmp/circom /usr/local/bin/circom
```

### "snarkjs: command not found"
```bash
npm install -g snarkjs
```

### "Compilation failed"
- Check that the circuit files exist in `circuits/`
- Verify circom version: `circom --version` (should be 2.0+)

### "Out of memory"
- The setup requires ~2GB RAM
- Close other applications
- Or use a smaller Powers of Tau file (ptau10 instead of ptau12)

### Script permission denied
```bash
chmod +x setup-circuits.sh
```

---

## 📚 Additional Resources

- **Circom Documentation**: https://docs.circom.io/
- **snarkjs Documentation**: https://github.com/iden3/snarkjs
- **ZK Learning Resources**: https://zkp.science/

---

## ⏱️ Time Estimates

| Task | Time |
|------|------|
| Install dependencies | 1-2 min |
| Download Powers of Tau | 30 sec |
| Compile circuits | 1 min |
| Generate keys | 2-3 min |
| Test circuits | 30 sec |
| **Total** | **5-10 min** |

---

## ✨ Next Steps

After generating the circuit files:

1. ✅ Commit the generated files to your repository (optional)
2. ✅ Set `NODE_ENV=production` in your `.env`
3. ✅ The zero-knowledge service is now fully operational!

Test it out:
```typescript
import zeroKnowledgeService from './services/advanced/zeroKnowledgeService';

// Generate a compliance proof
const proof = await zeroKnowledgeService.generateComplianceProof(
  'org_123',
  'framework_456',
  {
    controlsImplemented: 90,
    totalControls: 100,
    evidenceHash: 'abc123...'
  }
);

console.log('Proof generated:', proof);
```

🎉 **Your zk-SNARK circuits are compiled and working for local development.**

> **Before production:** the single-party setup above is for development only.
> Replace the proving/verification keys with the output of the multi-party
> trusted-setup ceremony in [`ZK_OPERATIONAL_RUNBOOK.md`](./ZK_OPERATIONAL_RUNBOOK.md)
> before deploying. Proofs generated from a single-party, locally-seeded setup
> are not production-safe.
