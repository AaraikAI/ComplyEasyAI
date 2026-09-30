# 🚀 Quick Start: Blockchain Contract Deployment

Get your smart contract deployed in **5-10 minutes**.

---

## ⚡ FASTEST WAY (Automated)

### Step 1: Compile the Contract

```bash
cd /home/user/ComplyEasyAI/server/src/blockchain
./compile-contract.sh
```

This generates:
- `compiled/ComplianceAuditLog.bytecode` - Contract bytecode for deployment
- `compiled/ComplianceAuditLog.abi.json` - Contract ABI for interaction

### Step 2: Add to .env

```bash
# Copy the bytecode
export COMPLIANCE_CONTRACT_BYTECODE=$(cat compiled/ComplianceAuditLog.bytecode)

# Or add to .env file
echo "COMPLIANCE_CONTRACT_BYTECODE=\"$(cat compiled/ComplianceAuditLog.bytecode)\"" >> ../../../.env
```

### Step 3: Deploy to Blockchain

```bash
# For Polygon Mumbai (testnet - free)
npx hardhat run scripts/deploy.js --network mumbai

# For Polygon Mainnet (production)
npx hardhat run scripts/deploy.js --network polygon
```

---

## 📋 Manual Compilation

### Prerequisites

```bash
# Installs the Hardhat 3 toolchain pinned in package-lock.json
# (hardhat + @nomicfoundation/hardhat-ethers)
npm ci
```

Do not install `@nomicfoundation/hardhat-toolbox`: 6.x targets Hardhat 2, and
7.0.0 (its `latest` tag) exits the process when imported.

### Compile

```bash
npx hardhat compile
```

### Extract Bytecode

```bash
node -e "console.log(require('./artifacts/contracts/ComplianceAuditLog.sol/ComplianceAuditLog.json').bytecode)" > compiled/ComplianceAuditLog.bytecode
```

---

## 🌐 Network Configuration

Edit `hardhat.config.js`:

```javascript
// hardhat.config.js is an ES module; Hardhat 3 network entries need a `type`
import { configVariable, defineConfig } from "hardhat/config";

export default defineConfig({
  // ...existing plugins / solidity / paths...
  networks: {
    mumbai: {
      type: "http",
      url: "https://rpc-mumbai.maticvigil.com",
      accounts: [configVariable("BLOCKCHAIN_PRIVATE_KEY")]
    },
    polygon: {
      type: "http",
      url: "https://polygon-rpc.com",
      accounts: [configVariable("BLOCKCHAIN_PRIVATE_KEY")]
    }
  }
});
```

Add to `.env`:
```bash
BLOCKCHAIN_PRIVATE_KEY=your_private_key_here
```

---

## ✅ Verify Deployment

After deployment, verify on block explorer:

**Polygon Mumbai:**
https://mumbai.polygonscan.com/address/YOUR_CONTRACT_ADDRESS

**Polygon Mainnet:**
https://polygonscan.com/address/YOUR_CONTRACT_ADDRESS

---

## 💰 Cost Estimates

**Mumbai Testnet:** FREE (use faucet)
**Polygon Mainnet:** ~$0.50-$2 for deployment

---

## 🎉 Complete Setup

Once deployed, update your `.env`:

```bash
COMPLIANCE_CONTRACT_BYTECODE=<bytecode from compiled/>
BLOCKCHAIN_CONTRACT_ADDRESS=<deployed contract address>
ETHEREUM_RPC_URL=https://polygon-rpc.com
BLOCKCHAIN_NETWORK=polygon
BLOCKCHAIN_PRIVATE_KEY=<your private key>
```

The blockchain service is now fully operational!

---

## 🆘 Troubleshooting

**"Insufficient funds"**: Add MATIC to your wallet
**"Nonce too low"**: Wait for pending transactions
**"Gas estimation failed"**: Check contract code

Get free MATIC: https://faucet.polygon.technology/
