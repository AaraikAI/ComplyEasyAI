#!/bin/bash

# Blockchain Smart Contract Compilation Script
# Generates contract bytecode for production deployment

set -e

echo "=========================================="
echo "Blockchain Contract Setup - ComplyEasyAI"
echo "=========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo -e "${YELLOW}Working directory: $SCRIPT_DIR${NC}"
echo ""

# Check Node.js
echo "Checking prerequisites..."
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node.js $(node -v) found${NC}"

# Check if we're in the blockchain directory
if [ ! -f "contracts/ComplianceAuditLog.sol" ]; then
    echo -e "${RED}Error: ComplianceAuditLog.sol not found${NC}"
    echo "Please run this script from server/src/blockchain/"
    exit 1
fi

echo ""
echo "Step 1/4: Installing Hardhat and dependencies..."

if [ ! -f "package.json" ] || [ ! -f "package-lock.json" ]; then
    echo -e "${RED}Error: package.json or package-lock.json not found${NC}"
    exit 1
fi

# Install exactly what package-lock.json pins. An unpinned install here would
# pull @nomicfoundation/hardhat-toolbox@latest (7.0.0), which exits the process
# as soon as it is imported.
npm ci
echo -e "${GREEN}✓ Dependencies installed${NC}"

echo ""
echo "Step 2/4: Checking Hardhat configuration..."

if [ ! -f "hardhat.config.js" ]; then
    echo -e "${RED}Error: hardhat.config.js not found${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Using the committed hardhat.config.js${NC}"

# Compile contract. A failed compile stops the script (set -e) instead of
# falling through to extract a previously committed artifact.
echo ""
echo "Step 3/4: Compiling smart contract..."
npx hardhat compile
echo -e "${GREEN}✓ Contract compiled${NC}"

# Extract bytecode
echo ""
echo "Step 4/4: Extracting bytecode..."

ARTIFACT_FILE="artifacts/contracts/ComplianceAuditLog.sol/ComplianceAuditLog.json"

if [ ! -f "$ARTIFACT_FILE" ]; then
    echo -e "${RED}Error: Compilation artifact not found${NC}"
    exit 1
fi

# Extract bytecode and ABI
BYTECODE=$(node -e "console.log(require('./$ARTIFACT_FILE').bytecode)")
ABI=$(node -e "console.log(JSON.stringify(require('./$ARTIFACT_FILE').abi, null, 2))")

# Save bytecode to file (compiled/ is git-ignored: it is a build product
# regenerated from contracts/ via this script).
mkdir -p compiled
echo "$BYTECODE" > compiled/ComplianceAuditLog.bytecode
echo "$ABI" > compiled/ComplianceAuditLog.abi.json

# Record build provenance so the bytecode can be reproduced/verified: solc
# version + optimizer settings and the SHA-256 of both the source and the
# emitted bytecode. CI can recompile and diff this manifest to detect tamper.
if command -v sha256sum &> /dev/null; then
    SRC_SHA=$(sha256sum contracts/ComplianceAuditLog.sol | awk '{print $1}')
    BYTECODE_SHA=$(sha256sum compiled/ComplianceAuditLog.bytecode | awk '{print $1}')
else
    SRC_SHA=$(shasum -a 256 contracts/ComplianceAuditLog.sol | awk '{print $1}')
    BYTECODE_SHA=$(shasum -a 256 compiled/ComplianceAuditLog.bytecode | awk '{print $1}')
fi
cat > compiled/ComplianceAuditLog.provenance.json << EOF
{
  "contract": "ComplianceAuditLog",
  "source": "contracts/ComplianceAuditLog.sol",
  "solcVersion": "0.8.20",
  "optimizer": { "enabled": true, "runs": 200 },
  "sourceSha256": "$SRC_SHA",
  "bytecodeSha256": "$BYTECODE_SHA"
}
EOF

echo -e "${GREEN}✓ Bytecode extracted${NC}"
echo -e "${GREEN}✓ Provenance recorded (compiled/ComplianceAuditLog.provenance.json)${NC}"

# Display results
echo ""
echo "=========================================="
echo -e "${GREEN}Compilation Complete!${NC}"
echo "=========================================="
echo ""
echo "Files created:"
echo "  - compiled/ComplianceAuditLog.bytecode"
echo "  - compiled/ComplianceAuditLog.abi.json"
echo ""
echo "Bytecode length: ${#BYTECODE} characters"
echo ""
echo "To use in production:"
echo "  1. Copy the bytecode to your .env file:"
echo ""
echo "     COMPLIANCE_CONTRACT_BYTECODE=\"$BYTECODE\""
echo ""
echo "  2. Or read from the file:"
echo ""
echo "     export COMPLIANCE_CONTRACT_BYTECODE=\$(cat server/src/blockchain/compiled/ComplianceAuditLog.bytecode)"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "  - Deploy contract: npx hardhat run scripts/deploy.js --network <network>"
echo "  - Verify on Etherscan/Polygonscan for transparency"
echo "  - Update .env with deployed contract address"
echo ""
