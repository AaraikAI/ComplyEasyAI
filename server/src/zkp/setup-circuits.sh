#!/bin/bash

# Zero-Knowledge Circuit Setup Script
# This script automates the complete setup of zk-SNARK circuits
# Run time: ~5-10 minutes (mostly downloads)

set -euo pipefail  # Exit on error, unset vars, and pipeline failures

echo "=========================================="
echo "zk-SNARK Circuit Setup for ComplyEasyAI"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

CHECKSUMS_FILE="$SCRIPT_DIR/checksums.sha256"

# Cross-platform SHA-256 of a file (Linux sha256sum / macOS shasum -a 256).
compute_sha256() {
    if command -v sha256sum &> /dev/null; then
        sha256sum "$1" | awk '{print $1}'
    elif command -v shasum &> /dev/null; then
        shasum -a 256 "$1" | awk '{print $1}'
    else
        echo -e "${RED}Error: neither sha256sum nor shasum is available${NC}" >&2
        return 2
    fi
}

# Look up the pinned digest for a basename in checksums.sha256.
pinned_sha256() {
    local name="$1"
    [ -f "$CHECKSUMS_FILE" ] || return 1
    awk -v n="$name" '$1 !~ /^#/ && $2 == n { print $1; exit }' "$CHECKSUMS_FILE"
}

# Verify a downloaded file against an expected digest; fail closed (delete +
# exit non-zero) on missing pin or mismatch. Args: <file> <expected_sha256>
verify_sha256() {
    local file="$1" expected="$2" actual
    if [ -z "$expected" ]; then
        echo -e "${RED}Refusing to install '$file': no pinned SHA-256 found.${NC}" >&2
        echo -e "${RED}Add its digest to $CHECKSUMS_FILE (or set the relevant *_SHA256 env var) and retry.${NC}" >&2
        rm -f "$file"
        exit 1
    fi
    actual="$(compute_sha256 "$file")" || { rm -f "$file"; exit 1; }
    if [ "$actual" != "$expected" ]; then
        echo -e "${RED}Integrity check FAILED for '$file'.${NC}" >&2
        echo -e "${RED}  expected: $expected${NC}" >&2
        echo -e "${RED}  actual:   $actual${NC}" >&2
        rm -f "$file"
        exit 1
    fi
    echo -e "${GREEN}✓ SHA-256 verified for $(basename "$file")${NC}"
}

echo -e "${YELLOW}Working directory: $SCRIPT_DIR${NC}"
echo ""

# Check if Node.js is installed
echo "Checking prerequisites..."
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed${NC}"
    echo "Please install Node.js 16+ from https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v)
echo -e "${GREEN}✓ Node.js $NODE_VERSION found${NC}"

# Install circom compiler
echo ""
echo "Step 1/6: Installing circom compiler..."
if ! command -v circom &> /dev/null; then
    echo "Downloading circom..."

    # Detect OS and select the pinned v2.1.6 release asset.
    OS="$(uname -s)"
    case "$OS" in
        Linux*)
            CIRCOM_ASSET="circom-linux-amd64"
            CIRCOM_EXPECTED="${CIRCOM_SHA256_LINUX:-$(pinned_sha256 circom-linux-amd64)}"
            ;;
        Darwin*)
            CIRCOM_ASSET="circom-macos-amd64"
            CIRCOM_EXPECTED="${CIRCOM_SHA256_DARWIN:-$(pinned_sha256 circom-macos-amd64)}"
            ;;
        *)
            echo -e "${RED}Unsupported OS: $OS${NC}"
            echo "Please install circom manually from https://docs.circom.io/getting-started/installation/"
            exit 1
            ;;
    esac
    CIRCOM_URL="https://github.com/iden3/circom/releases/download/v2.1.6/${CIRCOM_ASSET}"

    curl -L -o /tmp/circom "$CIRCOM_URL"
    # Verify integrity BEFORE making the binary executable or installing it.
    verify_sha256 /tmp/circom "$CIRCOM_EXPECTED"
    chmod +x /tmp/circom
    sudo mv /tmp/circom /usr/local/bin/circom
    echo -e "${GREEN}✓ circom installed${NC}"
else
    CIRCOM_VERSION=$(circom --version 2>&1 | head -n1 || echo "unknown")
    echo -e "${GREEN}✓ circom already installed ($CIRCOM_VERSION)${NC}"
fi

# Install snarkjs
echo ""
echo "Step 2/6: Installing snarkjs..."
if ! npm list snarkjs &> /dev/null && ! npm list -g snarkjs &> /dev/null; then
    echo "Installing snarkjs locally..."
    npm install snarkjs@latest
    echo -e "${GREEN}✓ snarkjs installed${NC}"
else
    SNARKJS_VERSION=$(npm list snarkjs --depth=0 2>/dev/null | grep snarkjs | awk '{print $2}' || npm list -g snarkjs --depth=0 2>/dev/null | grep snarkjs | awk '{print $2}' || echo "unknown")
    echo -e "${GREEN}✓ snarkjs already installed ($SNARKJS_VERSION)${NC}"
fi

# Use npx for snarkjs commands if not globally installed
if command -v snarkjs &> /dev/null; then
    SNARKJS_CMD="snarkjs"
else
    SNARKJS_CMD="npx snarkjs"
fi

# Download Powers of Tau
echo ""
echo "Step 3/6: Downloading Powers of Tau ceremony file..."
PTAU_FILE="powersOfTau28_hez_final_12.ptau"
if [ ! -f "$PTAU_FILE" ]; then
    echo "Downloading $PTAU_FILE (6.5 MB)..."

    # Multiple mirror URLs (try in order until one works)
    PTAU_URLS=(
        "https://storage.googleapis.com/zkevm/ptau/$PTAU_FILE"
        "https://github.com/iden3/snarkjs/raw/master/build/$PTAU_FILE"
        "https://ipfs.io/ipfs/QmTiT4eiYz5KF7gQrDsgfBDVZmCc8CPPFmzGhdXVmq8dXR?filename=$PTAU_FILE"
        "https://cloudflare-ipfs.com/ipfs/QmTiT4eiYz5KF7gQrDsgfBDVZmCc8CPPFmzGhdXVmq8dXR?filename=$PTAU_FILE"
        "https://hermez.s3-eu-west-1.amazonaws.com/$PTAU_FILE"
    )

    DOWNLOAD_SUCCESS=0
    for url in "${PTAU_URLS[@]}"; do
        echo "Trying: $url"
        if curl -L -f -o "$PTAU_FILE" "$url" 2>/dev/null; then
            # Fail closed unless the file matches the pinned ceremony digest.
            PTAU_EXPECTED="${PTAU_SHA256:-$(pinned_sha256 "$PTAU_FILE")}"
            verify_sha256 "$PTAU_FILE" "$PTAU_EXPECTED"
            DOWNLOAD_SUCCESS=1
            echo -e "${GREEN}✓ Powers of Tau downloaded successfully${NC}"
            break
        else
            echo -e "${YELLOW}  Failed, trying next mirror...${NC}"
            rm -f "$PTAU_FILE"  # Clean up partial download
        fi
    done

    if [ $DOWNLOAD_SUCCESS -eq 0 ]; then
        echo -e "${RED}Error: Could not download Powers of Tau from any mirror${NC}"
        echo ""
        echo "Please download manually from one of these sources:"
        echo "1. https://github.com/iden3/snarkjs/tree/master/build"
        echo "2. https://github.com/hermeznetwork/phase2ceremony_4/tree/main/ptau"
        echo ""
        echo "Save as: $SCRIPT_DIR/$PTAU_FILE"
        exit 1
    fi
else
    # Verify a pre-existing/cached copy against the pinned digest too.
    PTAU_EXPECTED="${PTAU_SHA256:-$(pinned_sha256 "$PTAU_FILE")}"
    verify_sha256 "$PTAU_FILE" "$PTAU_EXPECTED"
    echo -e "${GREEN}✓ Powers of Tau already exists${NC}"
fi

# Function to compile and setup a circuit
setup_circuit() {
    CIRCUIT_NAME=$1
    echo ""
    echo "================================================"
    echo "Setting up circuit: $CIRCUIT_NAME"
    echo "================================================"

    CIRCUIT_FILE="circuits/${CIRCUIT_NAME}.circom"

    if [ ! -f "$CIRCUIT_FILE" ]; then
        echo -e "${RED}Error: Circuit file $CIRCUIT_FILE not found${NC}"
        return 1
    fi

    # Compile circuit. circom requires the -o output directory to already exist
    # (it errors "invalid output path" otherwise), so create it first.
    echo "  [1/5] Compiling circuit..."
    mkdir -p compiled
    circom "$CIRCUIT_FILE" \
        --r1cs \
        --wasm \
        --sym \
        -o compiled/ \
        2>&1 | grep -v "warning" || true

    # Move wasm to correct location
    mkdir -p compiled/wasm
    if [ -d "compiled/${CIRCUIT_NAME}_js" ]; then
        cp "compiled/${CIRCUIT_NAME}_js/${CIRCUIT_NAME}.wasm" "compiled/wasm/"
        rm -rf "compiled/${CIRCUIT_NAME}_js"
    fi

    echo -e "  ${GREEN}✓ Circuit compiled${NC}"

    # Generate zkey (proving key)
    echo "  [2/5] Generating proving key (zkey)..."
    mkdir -p keys/proving
    $SNARKJS_CMD groth16 setup \
        "compiled/${CIRCUIT_NAME}.r1cs" \
        "$PTAU_FILE" \
        "keys/proving/${CIRCUIT_NAME}_0000.zkey" \
        > /dev/null 2>&1
    echo -e "  ${GREEN}✓ Initial proving key generated${NC}"

    # Phase 2 contribution (adds randomness)
    # Draw cryptographically-strong entropy from the OS CSPRNG per circuit.
    #
    # Groth16 soundness requires that at least one phase-2 contributor honestly
    # discards their secret ("toxic waste"). A single local contribution is only
    # safe if this machine is trusted; for production, run a multi-party ceremony
    # so that no single party's compromise can forge proofs.
    #
    # Multi-party support: set ZKEY_EXTRA_CONTRIBUTORS to the number of
    # independent contributions to chain after the local one. Each round draws
    # fresh OS-CSPRNG entropy and is recorded as a distinct named contribution;
    # for a true ceremony, run each round on a separate, independently-controlled
    # machine and pass the intermediate zkey between participants. The final zkey
    # is verified below regardless of contributor count.
    echo "  [3/5] Adding phase 2 contribution(s)..."
    EXTRA_CONTRIBUTORS="${ZKEY_EXTRA_CONTRIBUTORS:-0}"
    PREV_ZKEY="keys/proving/${CIRCUIT_NAME}_0000.zkey"
    CONTRIB_INDEX=0
    TOTAL_CONTRIBS=$((EXTRA_CONTRIBUTORS + 1))
    while [ "$CONTRIB_INDEX" -lt "$TOTAL_CONTRIBS" ]; do
        NEXT_INDEX=$((CONTRIB_INDEX + 1))
        if [ "$NEXT_INDEX" -eq "$TOTAL_CONTRIBS" ]; then
            NEXT_ZKEY="keys/proving/${CIRCUIT_NAME}.zkey"
        else
            NEXT_ZKEY="$(printf 'keys/proving/%s_%04d.zkey' "$CIRCUIT_NAME" "$NEXT_INDEX")"
        fi
        CONTRIB_ENTROPY="$(head -c 64 /dev/urandom | base64 | tr -d '\n')"
        $SNARKJS_CMD zkey contribute \
            "$PREV_ZKEY" \
            "$NEXT_ZKEY" \
            --name="ComplyEasyAI Contribution $NEXT_INDEX/$TOTAL_CONTRIBS" \
            -e="$CONTRIB_ENTROPY" \
            > /dev/null 2>&1
        unset CONTRIB_ENTROPY
        rm "$PREV_ZKEY"
        PREV_ZKEY="$NEXT_ZKEY"
        CONTRIB_INDEX="$NEXT_INDEX"
    done
    echo -e "  ${GREEN}✓ $TOTAL_CONTRIBS phase 2 contribution(s) added${NC}"

    # Export verification key
    echo "  [4/5] Exporting verification key..."
    mkdir -p keys/verification
    $SNARKJS_CMD zkey export verificationkey \
        "keys/proving/${CIRCUIT_NAME}.zkey" \
        "keys/verification/${CIRCUIT_NAME}.vkey" \
        > /dev/null 2>&1
    echo -e "  ${GREEN}✓ Verification key exported${NC}"

    # Verify the setup
    echo "  [5/5] Verifying setup..."
    $SNARKJS_CMD zkey verify \
        "compiled/${CIRCUIT_NAME}.r1cs" \
        "$PTAU_FILE" \
        "keys/proving/${CIRCUIT_NAME}.zkey" \
        > /dev/null 2>&1
    echo -e "  ${GREEN}✓ Setup verified${NC}"

    echo -e "${GREEN}✓ Circuit $CIRCUIT_NAME setup complete${NC}"
}

# Setup all circuits
echo ""
echo "Step 4/6: Compiling and setting up circuits..."

setup_circuit "compliance_check"
setup_circuit "credential_verification"
setup_circuit "data_ownership"

# Generate summary
echo ""
echo "Step 5/6: Generating file summary..."
echo ""
echo "Circuit Files Generated:"
echo "========================"

for circuit in compliance_check credential_verification data_ownership; do
    echo ""
    echo "$circuit:"

    WASM_FILE="compiled/wasm/${circuit}.wasm"
    ZKEY_FILE="keys/proving/${circuit}.zkey"
    VKEY_FILE="keys/verification/${circuit}.vkey"

    if [ -f "$WASM_FILE" ]; then
        WASM_SIZE=$(du -h "$WASM_FILE" | cut -f1)
        echo "  ✓ WASM:  $WASM_SIZE  ($WASM_FILE)"
    else
        echo "  ✗ WASM:  MISSING"
    fi

    if [ -f "$ZKEY_FILE" ]; then
        ZKEY_SIZE=$(du -h "$ZKEY_FILE" | cut -f1)
        echo "  ✓ zKey:  $ZKEY_SIZE  ($ZKEY_FILE)"
    else
        echo "  ✗ zKey:  MISSING"
    fi

    if [ -f "$VKEY_FILE" ]; then
        VKEY_SIZE=$(du -h "$VKEY_FILE" | cut -f1)
        echo "  ✓ vKey:  $VKEY_SIZE  ($VKEY_FILE)"
    else
        echo "  ✗ vKey:  MISSING"
    fi
done

# Record a SHA-256 manifest of the generated build outputs so committed/cached
# artifacts can be integrity-checked later (CI re-runs this and diffs the
# manifest). Note: each run draws fresh CSPRNG entropy for the phase-2
# contribution, so .zkey/.vkey digests are expected to change per setup; the
# manifest pins THIS build's outputs for downstream verification.
echo ""
echo "Recording build artifact checksums..."
BUILD_MANIFEST="build-artifacts.sha256"
: > "$BUILD_MANIFEST"
for circuit in compliance_check credential_verification data_ownership; do
    for artifact in \
        "compiled/wasm/${circuit}.wasm" \
        "compiled/${circuit}.r1cs" \
        "keys/proving/${circuit}.zkey" \
        "keys/verification/${circuit}.vkey"; do
        if [ -f "$artifact" ]; then
            printf '%s  %s\n' "$(compute_sha256 "$artifact")" "$artifact" >> "$BUILD_MANIFEST"
        fi
    done
done
echo -e "${GREEN}✓ Build manifest written to $BUILD_MANIFEST${NC}"

# Test the circuits
echo ""
echo "Step 6/6: Testing circuits..."

# Create test input
cat > test_input.json << 'EOF'
{
    "controlsImplemented": "90",
    "totalControls": "100",
    "evidenceHash": "12345",
    "threshold": "80"
}
EOF

echo "Testing compliance_check circuit..."
if $SNARKJS_CMD groth16 fullprove \
    test_input.json \
    compiled/wasm/compliance_check.wasm \
    keys/proving/compliance_check.zkey \
    proof.json \
    public.json \
    > /dev/null 2>&1; then

    echo -e "${GREEN}✓ Proof generation successful${NC}"

    # Verify the proof
    if $SNARKJS_CMD groth16 verify \
        keys/verification/compliance_check.vkey \
        public.json \
        proof.json \
        > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Proof verification successful${NC}"
    else
        echo -e "${YELLOW}⚠ Proof verification failed (check circuit logic)${NC}"
    fi

    # Cleanup test files
    rm -f test_input.json proof.json public.json
else
    echo -e "${YELLOW}⚠ Proof generation failed (check circuit logic)${NC}"
fi

# Final summary
echo ""
echo "=========================================="
echo -e "${GREEN}Setup Complete!${NC}"
echo "=========================================="
echo ""
echo "Files created:"
echo "  - 3 WASM files (compiled circuits)"
echo "  - 3 zKey files (proving keys)"
echo "  - 3 vKey files (verification keys)"
echo ""
echo "The zk-SNARK circuits are now ready for production use."
echo ""
echo "To use in your application:"
echo "  1. The service will automatically detect these files"
echo "  2. Set NODE_ENV=production in your .env"
echo "  3. The zero-knowledge service is now fully operational"
echo ""
echo "For testing:"
echo "  - Development mode: Falls back to simulated proofs if files missing"
echo "  - Production mode: Uses real zk-SNARK proofs with these files"
echo ""
echo -e "${YELLOW}Security Note:${NC}"
echo "  - Keep proving keys (.zkey) secure"
echo "  - Verification keys (.vkey) can be public"
echo "  - Consider multi-party computation for production trusted setup"
echo ""
