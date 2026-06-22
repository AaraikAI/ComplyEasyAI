#!/bin/bash

# =============================================================================
# Distributed Phase-2 Ceremony — Step 2: Finalize with a Public Random Beacon
# =============================================================================
# Run by the COORDINATOR, once per circuit, AFTER the last participant has
# contributed and sent their final zkey back.
#
# Applies a PUBLIC, future-unpredictable random beacon to the last participant's
# zkey (`snarkjs zkey beacon`) to produce the final `keys/proving/<name>.zkey`,
# then exports the verification key to `keys/verification/<name>.vkey` and runs
# `snarkjs zkey verify`.
#
# Why a beacon: it makes the final secret depend on a value NO participant could
# predict at contribution time, eliminating any "last contributor" advantage and
# letting anyone confirm the finalization was not cherry-picked.
#
# Choosing the beacon (document the choice in the transcript):
#   * A FUTURE Bitcoin block hash at a pre-announced height, OR
#   * A drand randomness round (https://drand.love) at a pre-announced round, OR
#   * A FUTURE Ethereum block hash at a pre-announced height.
#   Announce the source in advance, then take the resulting value once fixed.
#   Pass it as a 64-hex string (strip any leading 0x). `iterations` is the number
#   of hash iterations applied to the beacon (10 is the snarkjs-documented value).
#   The beacon is PUBLIC — it is not secret and carries no toxic waste.
#
# Usage:
#   ceremony/02-finalize-beacon.sh <circuit> <last_participant.zkey> <beacon_hex> <iterations>
# Example:
#   ceremony/02-finalize-beacon.sh compliance_check compliance_check_0003.zkey \
#       000000000000000000034f... 10
# =============================================================================

set -euo pipefail  # Exit on error, unset vars, and pipeline failures

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

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
if [ "$#" -ne 4 ]; then
    echo -e "${RED}Usage: $0 <circuit> <last_participant.zkey> <beacon_hex> <iterations>${NC}" >&2
    exit 1
fi
CIRCUIT_NAME="$1"
LAST_ZKEY="$2"
BEACON_HEX="$3"
BEACON_ITERS="$4"

R1CS_FILE="compiled/${CIRCUIT_NAME}.r1cs"
FINAL_ZKEY="keys/proving/${CIRCUIT_NAME}.zkey"
VKEY_FILE="keys/verification/${CIRCUIT_NAME}.vkey"

echo "=========================================="
echo "Phase-2 Ceremony — Finalize (beacon): $CIRCUIT_NAME"
echo "=========================================="
echo -e "${YELLOW}Working directory: $ZKP_DIR${NC}"
echo ""

# --- Preconditions --------------------------------------------------------
if [ ! -f "$LAST_ZKEY" ]; then
    echo -e "${RED}Error: last participant zkey '$LAST_ZKEY' not found.${NC}" >&2
    exit 1
fi
if [ ! -f "$R1CS_FILE" ]; then
    echo -e "${RED}Error: $R1CS_FILE not found.${NC}" >&2
    exit 1
fi
if [ ! -f "$PTAU_FILE" ]; then
    echo -e "${RED}Error: $PTAU_FILE not found.${NC}" >&2
    exit 1
fi
# Beacon must be a non-empty hex string (snarkjs expects hex; strip 0x yourself).
if ! printf '%s' "$BEACON_HEX" | grep -Eq '^[0-9a-fA-F]+$'; then
    echo -e "${RED}Error: beacon '$BEACON_HEX' is not a hex string (strip any 0x prefix).${NC}" >&2
    exit 1
fi
# Iterations must be a positive integer.
if ! printf '%s' "$BEACON_ITERS" | grep -Eq '^[1-9][0-9]*$'; then
    echo -e "${RED}Error: iterations '$BEACON_ITERS' must be a positive integer.${NC}" >&2
    exit 1
fi

# --- Verify the incoming (last participant) zkey before finalizing --------
echo "Verifying last participant zkey before applying the beacon..."
echo "Running: $SNARKJS_CMD zkey verify $R1CS_FILE $PTAU_FILE $LAST_ZKEY"
$SNARKJS_CMD zkey verify "$R1CS_FILE" "$PTAU_FILE" "$LAST_ZKEY"
echo -e "${GREEN}✓ Last participant zkey verified${NC}"
echo ""

# --- Apply the public random beacon to produce the FINAL key --------------
mkdir -p keys/proving keys/verification
echo "Applying public random beacon (iterations=$BEACON_ITERS)..."
echo "Running: $SNARKJS_CMD zkey beacon $LAST_ZKEY $FINAL_ZKEY $BEACON_HEX $BEACON_ITERS -n=\"phase2 final beacon\""
$SNARKJS_CMD zkey beacon "$LAST_ZKEY" "$FINAL_ZKEY" "$BEACON_HEX" "$BEACON_ITERS" \
    -n="phase2 final beacon: $CIRCUIT_NAME"
echo -e "${GREEN}✓ Final proving key written: $FINAL_ZKEY${NC}"
echo ""

# --- Export the verification key ------------------------------------------
echo "Exporting verification key..."
echo "Running: $SNARKJS_CMD zkey export verificationkey $FINAL_ZKEY $VKEY_FILE"
$SNARKJS_CMD zkey export verificationkey "$FINAL_ZKEY" "$VKEY_FILE"
echo -e "${GREEN}✓ Verification key exported: $VKEY_FILE${NC}"
echo ""

# --- Verify the final key -------------------------------------------------
echo "Verifying final proving key..."
echo "Running: $SNARKJS_CMD zkey verify $R1CS_FILE $PTAU_FILE $FINAL_ZKEY"
$SNARKJS_CMD zkey verify "$R1CS_FILE" "$PTAU_FILE" "$FINAL_ZKEY"
echo -e "${GREEN}✓ Final proving key verified${NC}"
echo ""

# --- Publish final hashes for the transcript ------------------------------
FINAL_ZKEY_SHA="$(compute_sha256 "$FINAL_ZKEY")"
VKEY_SHA="$(compute_sha256 "$VKEY_FILE")"
echo "=========================================="
echo -e "${GREEN}Finalized: $CIRCUIT_NAME${NC}"
echo "=========================================="
echo "  Beacon value:    $BEACON_HEX"
echo "  Beacon iters:    $BEACON_ITERS"
echo "  Final zkey:      $ZKP_DIR/$FINAL_ZKEY"
echo "    SHA256:        $FINAL_ZKEY_SHA"
echo "  Verification key: $ZKP_DIR/$VKEY_FILE"
echo "    SHA256:        $VKEY_SHA"
echo ""
echo "Record the beacon source/height/round, beacon value, iterations, and both"
echo "SHA-256s above in the published ceremony transcript. Run"
echo "  ceremony/03-verify-transcript.sh"
echo "to independently confirm all three circuits."
