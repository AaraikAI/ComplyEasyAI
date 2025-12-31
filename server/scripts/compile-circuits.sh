#!/bin/bash

# Circuit Compilation Script
# Compiles Circom circuits to WebAssembly and generates R1CS

set -e

CIRCUITS_DIR="src/zkp/circuits"
OUTPUT_DIR="src/zkp/compiled"
WASM_DIR="$OUTPUT_DIR/wasm"
R1CS_DIR="$OUTPUT_DIR/r1cs"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting circuit compilation...${NC}"

# Check if circom is installed
if ! command -v circom &> /dev/null; then
    echo -e "${RED}Error: circom is not installed${NC}"
    echo "Install with: npm install -g circom"
    exit 1
fi

# Create output directories
mkdir -p "$WASM_DIR"
mkdir -p "$R1CS_DIR"

# Compile each circuit
circuits=("compliance_check" "credential_verification" "data_ownership")

for circuit in "${circuits[@]}"; do
    echo -e "${YELLOW}Compiling $circuit...${NC}"
    
    # circom 0.5 uses -r for R1CS, -w for WASM, -s for SYM
    npx circom "$CIRCUITS_DIR/${circuit}.circom" \
        -r "$R1CS_DIR/${circuit}.r1cs" \
        -w "$WASM_DIR/${circuit}.wasm" \
        -s "$OUTPUT_DIR/${circuit}.sym" 2>&1
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Compiled $circuit successfully${NC}"
    else
        echo -e "${RED}✗ Failed to compile $circuit${NC}"
        exit 1
    fi
done

echo -e "${GREEN}All circuits compiled successfully!${NC}"
echo "Output files:"
echo "  - WASM: $WASM_DIR"
echo "  - R1CS: $R1CS_DIR"

