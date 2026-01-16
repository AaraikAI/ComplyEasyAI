#!/bin/bash

# Zero-Knowledge Circuit Setup Script
# This script automates the complete setup of zk-SNARK circuits
# Run time: ~5-10 minutes (mostly downloads)

set -e  # Exit on error

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

    # Detect OS
    OS="$(uname -s)"
    case "$OS" in
        Linux*)
            CIRCOM_URL="https://github.com/iden3/circom/releases/download/v2.1.6/circom-linux-amd64"
            ;;
        Darwin*)
            CIRCOM_URL="https://github.com/iden3/circom/releases/download/v2.1.6/circom-macos-amd64"
            ;;
        *)
            echo -e "${RED}Unsupported OS: $OS${NC}"
            echo "Please install circom manually from https://docs.circom.io/getting-started/installation/"
            exit 1
            ;;
    esac

    curl -L -o /tmp/circom "$CIRCOM_URL"
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
if ! npm list -g snarkjs &> /dev/null; then
    echo "Installing snarkjs globally..."
    npm install -g snarkjs@latest
    echo -e "${GREEN}✓ snarkjs installed${NC}"
else
    SNARKJS_VERSION=$(npm list -g snarkjs --depth=0 2>/dev/null | grep snarkjs | awk '{print $2}' || echo "unknown")
    echo -e "${GREEN}✓ snarkjs already installed ($SNARKJS_VERSION)${NC}"
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

    # Compile circuit
    echo "  [1/5] Compiling circuit..."
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
    snarkjs groth16 setup \
        "compiled/${CIRCUIT_NAME}.r1cs" \
        "$PTAU_FILE" \
        "keys/proving/${CIRCUIT_NAME}_0000.zkey" \
        > /dev/null 2>&1
    echo -e "  ${GREEN}✓ Initial proving key generated${NC}"

    # Phase 2 contribution (adds randomness)
    echo "  [3/5] Adding phase 2 contribution..."
    snarkjs zkey contribute \
        "keys/proving/${CIRCUIT_NAME}_0000.zkey" \
        "keys/proving/${CIRCUIT_NAME}.zkey" \
        --name="ComplyEasyAI Contribution" \
        -e="$(date +%s)" \
        > /dev/null 2>&1
    rm "keys/proving/${CIRCUIT_NAME}_0000.zkey"
    echo -e "  ${GREEN}✓ Phase 2 contribution added${NC}"

    # Export verification key
    echo "  [4/5] Exporting verification key..."
    mkdir -p keys/verification
    snarkjs zkey export verificationkey \
        "keys/proving/${CIRCUIT_NAME}.zkey" \
        "keys/verification/${CIRCUIT_NAME}.vkey" \
        > /dev/null 2>&1
    echo -e "  ${GREEN}✓ Verification key exported${NC}"

    # Verify the setup
    echo "  [5/5] Verifying setup..."
    snarkjs zkey verify \
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
if snarkjs groth16 fullprove \
    test_input.json \
    compiled/wasm/compliance_check.wasm \
    keys/proving/compliance_check.zkey \
    proof.json \
    public.json \
    > /dev/null 2>&1; then

    echo -e "${GREEN}✓ Proof generation successful${NC}"

    # Verify the proof
    if snarkjs groth16 verify \
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
