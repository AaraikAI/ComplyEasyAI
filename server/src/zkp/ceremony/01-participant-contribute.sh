#!/bin/bash

# =============================================================================
# Distributed Phase-2 Ceremony — Step 1: Participant Contribution
# =============================================================================
# Run by EACH PARTICIPANT, on their OWN independently-controlled machine, in
# sequence. You receive the previous participant's (or the coordinator's) zkey
# and its expected SHA-256, verify it, add YOUR fresh secret randomness, and
# hand the result + its SHA-256 to the next participant.
#
# >>> SECURITY — READ BEFORE RUNNING <<<
#  * Your secret randomness ("toxic waste") is what makes this ceremony sound.
#    Groth16 is sound as long as AT LEAST ONE participant honestly drew strong
#    entropy and DESTROYED it. Be that honest participant.
#  * Entropy here is drawn FRESH from the OS CSPRNG (/dev/urandom) on THIS run.
#    NEVER reuse entropy across runs/circuits. NEVER use a constant, a timestamp
#    (date +%s), or any predictable value — that makes proofs forgeable.
#  * Do NOT write the entropy to disk, do NOT commit it, do NOT send it to
#    anyone. Only the OUTPUT .zkey leaves this machine. After contributing,
#    securely discard the entropy (this script holds it only in a shell variable
#    and unsets it; also close this shell when done).
#  * VERIFY THE CHAIN: confirm the input zkey's SHA-256 matches what the previous
#    holder published, and `snarkjs zkey verify` passes, BEFORE contributing.
#
# Usage:
#   ceremony/01-participant-contribute.sh <circuit> <in.zkey> <out.zkey> <participant_name>
# Example:
#   ceremony/01-participant-contribute.sh compliance_check \
#       compliance_check_0000.zkey compliance_check_0001.zkey "Alice (laptop-A)"
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
    echo -e "${RED}Usage: $0 <circuit> <in.zkey> <out.zkey> <participant_name>${NC}" >&2
    exit 1
fi
CIRCUIT_NAME="$1"
IN_ZKEY="$2"
OUT_ZKEY="$3"
PARTICIPANT_NAME="$4"

R1CS_FILE="compiled/${CIRCUIT_NAME}.r1cs"

echo "=========================================="
echo "Phase-2 Ceremony — Contribution: $CIRCUIT_NAME"
echo "  Participant: $PARTICIPANT_NAME"
echo "=========================================="
echo -e "${YELLOW}Working directory: $ZKP_DIR${NC}"
echo ""

# --- Preconditions --------------------------------------------------------
if [ ! -f "$IN_ZKEY" ]; then
    echo -e "${RED}Error: input zkey '$IN_ZKEY' not found.${NC}" >&2
    exit 1
fi
if [ ! -f "$R1CS_FILE" ]; then
    echo -e "${RED}Error: $R1CS_FILE not found (needed to verify the input zkey).${NC}" >&2
    exit 1
fi
if [ ! -f "$PTAU_FILE" ]; then
    echo -e "${RED}Error: $PTAU_FILE not found (needed to verify the input zkey).${NC}" >&2
    exit 1
fi
if [ -e "$OUT_ZKEY" ]; then
    echo -e "${RED}Error: output '$OUT_ZKEY' already exists; refusing to overwrite.${NC}" >&2
    exit 1
fi

# --- Show the input hash so the participant can match it to the hand-off --
IN_SHA="$(compute_sha256 "$IN_ZKEY")"
echo "Input zkey SHA-256 (confirm this equals the previous holder's published hash):"
echo "  $IN_SHA"
echo ""

# --- Verify the input zkey BEFORE building on top of it -------------------
echo "Verifying input zkey against r1cs + ptau..."
echo "Running: $SNARKJS_CMD zkey verify $R1CS_FILE $PTAU_FILE $IN_ZKEY"
$SNARKJS_CMD zkey verify "$R1CS_FILE" "$PTAU_FILE" "$IN_ZKEY"
echo -e "${GREEN}✓ Input zkey verified${NC}"
echo ""

# --- Draw FRESH entropy from the OS CSPRNG --------------------------------
# 64 bytes (512 bits) of OS CSPRNG randomness, base64-encoded. Held only in a
# shell variable for the duration of one `zkey contribute`, then unset. This is
# the participant's toxic waste — it is never written to disk or transmitted.
CONTRIB_ENTROPY="$(head -c 64 /dev/urandom | base64 | tr -d '\n')"

# A unique, human-readable contribution name aids transcript auditing. We append
# a fresh CSPRNG-derived hex nonce so the label itself is non-predictable too.
CONTRIB_NONCE="$(head -c 8 /dev/urandom | od -An -tx1 | tr -d ' \n')"
CONTRIB_LABEL="${PARTICIPANT_NAME} | ${CIRCUIT_NAME} | ${CONTRIB_NONCE}"

echo "Contributing fresh OS-CSPRNG entropy (toxic waste held in memory only)..."
echo "Running: $SNARKJS_CMD zkey contribute $IN_ZKEY $OUT_ZKEY --name=\"$CONTRIB_LABEL\" -v"
$SNARKJS_CMD zkey contribute "$IN_ZKEY" "$OUT_ZKEY" \
    --name="$CONTRIB_LABEL" \
    -e="$CONTRIB_ENTROPY" \
    -v

# Discard the toxic waste from this shell's memory immediately.
unset CONTRIB_ENTROPY
unset CONTRIB_NONCE

echo -e "${GREEN}✓ Contribution complete${NC}"
echo ""

# --- Publish the output hash for the next participant ---------------------
OUT_SHA="$(compute_sha256 "$OUT_ZKEY")"
echo "=========================================="
echo -e "${GREEN}Hand-off to the NEXT participant${NC}"
echo "=========================================="
echo "  Circuit:        $CIRCUIT_NAME"
echo "  Contribution by: $PARTICIPANT_NAME"
echo "  Contribution label (record in transcript): $CONTRIB_LABEL"
echo "  File to send:   $ZKP_DIR/$OUT_ZKEY"
echo "  Output SHA256 (next participant MUST verify this before contributing):"
echo "    $OUT_SHA"
echo ""
echo -e "${YELLOW}REMINDER — discard your toxic waste:${NC}"
echo "  * This script already unset the in-memory entropy."
echo "  * Close this shell session; do not save scrollback containing entropy."
echo "  * If you exported entropy anywhere manually, securely delete it now."
echo "  * Send ONLY the output .zkey + its SHA-256 to the next participant"
echo "    (the LAST participant sends it back to the coordinator)."
echo "  * Fill in and sign ceremony/ATTESTATION_TEMPLATE.md."
