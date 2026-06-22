#!/bin/bash

# =============================================================================
# Distributed Phase-2 Ceremony — Step 3: Independent Transcript Verification
# =============================================================================
# Run by ANYONE (no secrets required) to independently confirm the ceremony
# output. For each of the three circuits it:
#   1. Runs `snarkjs zkey verify <r1cs> <ptau> <final.zkey>`.
#   2. Re-exports the verification key from the final zkey to a temp file and
#      diffs it against the published keys/verification/<name>.vkey.
#   3. Prints PASS/FAIL.
#
# Exit code is non-zero if ANY circuit fails, so this is CI/transcript-gate safe.
#
# Usage:
#   ceremony/03-verify-transcript.sh
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
CIRCUITS=(compliance_check credential_verification data_ownership)

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

echo "=========================================="
echo "Phase-2 Ceremony — Transcript Verification"
echo "=========================================="
echo -e "${YELLOW}Working directory: $ZKP_DIR${NC}"
echo ""

if [ ! -f "$PTAU_FILE" ]; then
    echo -e "${RED}Error: $PTAU_FILE not found (needed to verify final keys).${NC}" >&2
    exit 1
fi

# Temp dir for re-exported vkeys; cleaned up on exit (fire-and-forget).
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR" 2>/dev/null || true' EXIT

OVERALL_RC=0

for CIRCUIT_NAME in "${CIRCUITS[@]}"; do
    echo "------------------------------------------"
    echo "Circuit: $CIRCUIT_NAME"
    echo "------------------------------------------"

    R1CS_FILE="compiled/${CIRCUIT_NAME}.r1cs"
    FINAL_ZKEY="keys/proving/${CIRCUIT_NAME}.zkey"
    PUBLISHED_VKEY="keys/verification/${CIRCUIT_NAME}.vkey"

    CIRCUIT_RC=0

    # Presence checks.
    for f in "$R1CS_FILE" "$FINAL_ZKEY" "$PUBLISHED_VKEY"; do
        if [ ! -f "$f" ]; then
            echo -e "${RED}  Missing: $f${NC}"
            CIRCUIT_RC=1
        fi
    done

    if [ "$CIRCUIT_RC" -eq 0 ]; then
        # 1) zkey verify against r1cs + ptau.
        echo "  [1/2] $SNARKJS_CMD zkey verify $R1CS_FILE $PTAU_FILE $FINAL_ZKEY"
        if $SNARKJS_CMD zkey verify "$R1CS_FILE" "$PTAU_FILE" "$FINAL_ZKEY"; then
            echo -e "  ${GREEN}✓ zkey verify passed${NC}"
        else
            echo -e "  ${RED}✗ zkey verify FAILED${NC}"
            CIRCUIT_RC=1
        fi

        # 2) Re-export the vkey and diff it against the published one.
        REEXPORT_VKEY="$TMP_DIR/${CIRCUIT_NAME}.reexport.vkey"
        echo "  [2/2] Re-exporting vkey and diffing against $PUBLISHED_VKEY"
        if $SNARKJS_CMD zkey export verificationkey "$FINAL_ZKEY" "$REEXPORT_VKEY" > /dev/null 2>&1; then
            PUB_SHA="$(compute_sha256 "$PUBLISHED_VKEY")"
            RE_SHA="$(compute_sha256 "$REEXPORT_VKEY")"
            if diff -q "$PUBLISHED_VKEY" "$REEXPORT_VKEY" > /dev/null 2>&1; then
                echo -e "  ${GREEN}✓ vkey matches published (SHA256 $RE_SHA)${NC}"
            else
                echo -e "  ${RED}✗ vkey MISMATCH${NC}"
                echo -e "  ${RED}    published:  $PUB_SHA${NC}"
                echo -e "  ${RED}    re-derived: $RE_SHA${NC}"
                CIRCUIT_RC=1
            fi
        else
            echo -e "  ${RED}✗ vkey re-export failed${NC}"
            CIRCUIT_RC=1
        fi
    fi

    if [ "$CIRCUIT_RC" -eq 0 ]; then
        echo -e "${GREEN}RESULT: $CIRCUIT_NAME — PASS${NC}"
    else
        echo -e "${RED}RESULT: $CIRCUIT_NAME — FAIL${NC}"
        OVERALL_RC=1
    fi
    echo ""
done

echo "=========================================="
if [ "$OVERALL_RC" -eq 0 ]; then
    echo -e "${GREEN}TRANSCRIPT VERIFICATION: ALL CIRCUITS PASS${NC}"
else
    echo -e "${RED}TRANSCRIPT VERIFICATION: ONE OR MORE CIRCUITS FAILED${NC}"
fi
echo "=========================================="
exit "$OVERALL_RC"
