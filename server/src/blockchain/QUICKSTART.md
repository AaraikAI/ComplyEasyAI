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
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
```

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
module.exports = {
  networks: {
    mumbai: {
      url: "https://rpc-mumbai.maticvigil.com",
      accounts: [process.env.BLOCKCHAIN_PRIVATE_KEY]
    },
    polygon: {
      url: "https://polygon-rpc.com",
      accounts: [process.env.BLOCKCHAIN_PRIVATE_KEY]
    }
  }
};
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
