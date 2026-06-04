#!/bin/bash

# Trusted Setup Script
# Generates proving keys (.zkey) and verification keys (.vkey) for circuits
# Uses snarkjs for Groth16 trusted setup

set -euo pipefail

CIRCUITS_DIR="src/zkp/circuits"
COMPILED_DIR="src/zkp/compiled"
WASM_DIR="$COMPILED_DIR/wasm"
R1CS_DIR="$COMPILED_DIR/r1cs"
KEYS_DIR="src/zkp/keys"
PROVING_KEYS_DIR="$KEYS_DIR/proving"
VERIFICATION_KEYS_DIR="$KEYS_DIR/verification"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}Starting trusted setup...${NC}"

# Check if snarkjs is installed
if ! command -v snarkjs &> /dev/null; then
    echo -e "${RED}Error: snarkjs is not installed${NC}"
    echo "Install with: npm install -g snarkjs"
    exit 1
fi

# Create output directories
mkdir -p "$PROVING_KEYS_DIR"
mkdir -p "$VERIFICATION_KEYS_DIR"

# Circuits to process
circuits=("compliance_check" "credential_verification" "data_ownership")

# Powers-of-tau (phase 1) is circuit-independent, so it is generated once and
# reused across all circuits. Regenerating it per circuit wastes work and risks
# reusing randomness. Each contribution draws fresh entropy from the OS CSPRNG.
# For production, a real multi-party ceremony is strongly preferred over this
# single-party setup.
POT_FINAL="$KEYS_DIR/pot14_final.ptau"

echo -e "${YELLOW}Phase 1: Generating powers of tau (once for all circuits)...${NC}"
snarkjs powersoftau new bn128 14 "$KEYS_DIR/pot14_0000.ptau" -v

# Draw cryptographically-strong entropy from the OS CSPRNG for this contribution.
POT_ENTROPY="$(head -c 64 /dev/urandom | base64 | tr -d '\n')"
snarkjs powersoftau contribute "$KEYS_DIR/pot14_0000.ptau" "$KEYS_DIR/pot14_0001.ptau" \
    --name="First contribution" -v -e="$POT_ENTROPY"
unset POT_ENTROPY

snarkjs powersoftau prepare phase2 "$KEYS_DIR/pot14_0001.ptau" "$POT_FINAL" -v

for circuit in "${circuits[@]}"; do
    echo -e "${YELLOW}Generating keys for $circuit...${NC}"

    R1CS_FILE="$R1CS_DIR/${circuit}.r1cs"
    WASM_FILE="$WASM_DIR/${circuit}.wasm"
    ZKEY_FILE="$PROVING_KEYS_DIR/${circuit}.zkey"
    VKEY_FILE="$VERIFICATION_KEYS_DIR/${circuit}.vkey"

    # Check if R1CS file exists
    if [ ! -f "$R1CS_FILE" ]; then
        echo -e "${RED}Error: R1CS file not found: $R1CS_FILE${NC}"
        echo "Run compile-circuits.sh first"
        exit 1
    fi

    # Phase 2: Generate proving key from the shared powers-of-tau file
    echo "  Phase 2: Generating proving key..."
    snarkjs groth16 setup "$R1CS_FILE" "$POT_FINAL" "$ZKEY_FILE"

    # Contribute to the zkey with fresh CSPRNG entropy per circuit.
    # For production, a real multi-party ceremony is strongly preferred.
    ZKEY_ENTROPY="$(head -c 64 /dev/urandom | base64 | tr -d '\n')"
    snarkjs zkey contribute "$ZKEY_FILE" "$ZKEY_FILE" --name="1st Contributor" -v -e="$ZKEY_ENTROPY"
    unset ZKEY_ENTROPY

    # Export verification key
    echo "  Phase 3: Exporting verification key..."
    if ! snarkjs zkey export verificationkey "$ZKEY_FILE" "$VKEY_FILE"; then
        echo -e "${RED}✗ Failed to generate keys for $circuit${NC}"
        exit 1
    fi

    echo -e "${GREEN}✓ Generated keys for $circuit successfully${NC}"
    echo "    Proving key: $ZKEY_FILE"
    echo "    Verification key: $VKEY_FILE"
done

echo -e "${GREEN}Trusted setup completed successfully!${NC}"
echo ""
echo -e "${YELLOW}IMPORTANT: In production, use a multi-party trusted setup ceremony${NC}"
echo "This script uses a single-party setup for development only."

