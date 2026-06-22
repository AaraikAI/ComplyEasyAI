#!/bin/bash

# =============================================================================
# Distributed Phase-2 Ceremony — Step 0: Coordinator Initialization
# =============================================================================
# Run by the COORDINATOR, once per circuit, on the coordinator's machine.
#
# Produces the initial Groth16 phase-2 proving key (`<name>_0000.zkey`) from the
# compiled R1CS and the pinned Powers-of-Tau file, then prints the SHA-256 that
# the FIRST participant must expect before contributing on top of it.
#
# This step contains NO secret randomness — `groth16 setup` is deterministic.
# All entropy enters the ceremony via the participants' `zkey contribute` rounds
# (01-participant-contribute.sh) and the final public beacon (02-finalize-beacon.sh).
#
# Usage:
#   ceremony/00-coordinator-init.sh <circuit_name>
# Example:
#   ceremony/00-coordinator-init.sh compliance_check
# =============================================================================

set -euo pipefail  # Exit on error, unset vars, and pipeline failures

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Resolve paths relative to server/src/zkp/ (this script lives in ceremony/).
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ZKP_DIR="$( cd "$SCRIPT_DIR/.." && pwd )"
cd "$ZKP_DIR"

PTAU_FILE="powersOfTau28_hez_final_12.ptau"

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

# snarkjs detection — mirror setup-circuits.sh: prefer a global binary, else npx.
if command -v snarkjs &> /dev/null; then
    SNARKJS_CMD="snarkjs"
else
    SNARKJS_CMD="npx snarkjs"
fi

# --- Argument validation --------------------------------------------------
if [ "$#" -ne 1 ]; then
    echo -e "${RED}Usage: $0 <circuit_name>${NC}" >&2
    echo "  circuit_name: compliance_check | credential_verification | data_ownership" >&2
    exit 1
fi
CIRCUIT_NAME="$1"

R1CS_FILE="compiled/${CIRCUIT_NAME}.r1cs"
INIT_ZKEY="${CIRCUIT_NAME}_0000.zkey"

echo "=========================================="
echo "Phase-2 Ceremony — Coordinator init: $CIRCUIT_NAME"
echo "=========================================="
echo -e "${YELLOW}Working directory: $ZKP_DIR${NC}"
echo ""

# --- Preconditions --------------------------------------------------------
if [ ! -f "$R1CS_FILE" ]; then
    echo -e "${RED}Error: $R1CS_FILE not found.${NC}" >&2
    echo "Compile the circuit first (see ../ZK_OPERATIONAL_RUNBOOK.md §1)." >&2
    exit 1
fi
if [ ! -f "$PTAU_FILE" ]; then
    echo -e "${RED}Error: $PTAU_FILE not found.${NC}" >&2
    echo "Obtain + verify it first (see ../POWERS_OF_TAU_SOURCES.md)." >&2
    exit 1
fi

# --- Produce the initial phase-2 key --------------------------------------
echo "Running: $SNARKJS_CMD groth16 setup $R1CS_FILE $PTAU_FILE $INIT_ZKEY"
$SNARKJS_CMD groth16 setup "$R1CS_FILE" "$PTAU_FILE" "$INIT_ZKEY"
echo -e "${GREEN}✓ Initial phase-2 key written: $INIT_ZKEY${NC}"
echo ""

INIT_SHA="$(compute_sha256 "$INIT_ZKEY")"
echo "=========================================="
echo -e "${GREEN}Hand-off to Participant 1${NC}"
echo "=========================================="
echo "  Circuit:        $CIRCUIT_NAME"
echo "  File to send:   $ZKP_DIR/$INIT_ZKEY"
echo "  Expected SHA256 (participant 1 MUST verify this before contributing):"
echo "    $INIT_SHA"
echo ""
echo "Next: send $INIT_ZKEY and the SHA-256 above to Participant 1, who runs"
echo "  ceremony/01-participant-contribute.sh $CIRCUIT_NAME $INIT_ZKEY ${CIRCUIT_NAME}_0001.zkey \"<their name>\""
echo "on their OWN machine. Record this hash in the ceremony transcript."
