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

# Create package.json if it doesn't exist
if [ ! -f "package.json" ]; then
    cat > package.json << 'EOF'
{
  "name": "complyeasy-blockchain",
  "version": "1.0.0",
  "type": "module",
  "private": true,
  "description": "Smart contracts for ComplyEasyAI",
  "scripts": {
    "compile": "hardhat compile",
    "test": "hardhat test"
  }
}
EOF
else
    # Update existing package.json to include type: module if not present
    if ! grep -q '"type": "module"' package.json; then
        # Use node to add type: module to package.json
        node -e "
        const fs = require('fs');
        const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        pkg.type = 'module';
        fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
        "
    fi
fi

# Install Hardhat and dependencies
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox @openzeppelin/contracts &> /dev/null
echo -e "${GREEN}✓ Dependencies installed${NC}"

# Create Hardhat config
echo ""
echo "Step 2/4: Configuring Hardhat..."

cat > hardhat.config.js << 'EOF'
import "@nomicfoundation/hardhat-toolbox";

export default {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  paths: {
    sources: "./contracts",
    artifacts: "./artifacts"
  }
};
EOF

echo -e "${GREEN}✓ Hardhat configured${NC}"

# Compile contract
echo ""
echo "Step 3/4: Compiling smart contract..."
npx hardhat compile 2>&1 | grep -v "warning" || true
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

# Save bytecode to file
echo "$BYTECODE" > compiled/ComplianceAuditLog.bytecode
echo "$ABI" > compiled/ComplianceAuditLog.abi.json

echo -e "${GREEN}✓ Bytecode extracted${NC}"

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
