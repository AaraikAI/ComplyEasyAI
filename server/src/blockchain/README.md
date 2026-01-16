# Blockchain Integration for Immutable Audit Logs

This directory contains smart contracts and setup instructions for blockchain-based immutable audit logging.

## Status: OPTIONAL (Production Guard Enabled)

The blockchain service has production guards in place:
- **Development**: Uses mock/simulated blockchain operations
- **Production**: Requires `COMPLIANCE_CONTRACT_BYTECODE` environment variable OR will throw error

## Overview

ComplyEasyAI can optionally store audit logs on blockchain for immutability and tamper-proof compliance evidence. This is particularly useful for:

- Regulatory audits requiring immutable records
- Legal compliance where data integrity is critical
- Industries with strict audit trail requirements (healthcare, finance, defense)

## Smart Contract

The `ComplianceAuditLog.sol` contract provides:

- **Immutable Audit Logs**: Once written, cannot be modified
- **Evidence Storage**: Link evidence hashes to audit entries
- **Verification**: Verify data integrity using on-chain hashes
- **Access Control**: Only authorized addresses can write
- **Efficient Retrieval**: Query logs by organization or ID

## Prerequisites

```bash
# Install Hardhat (Solidity development environment)
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox

# Initialize Hardhat (if not already done)
npx hardhat init
```

## Compilation

### Step 1: Compile the Contract

```bash
# Copy contract to Hardhat contracts directory
cp contracts/ComplianceAuditLog.sol ../../hardhat/contracts/

# Compile with Hardhat
cd ../../hardhat
npx hardhat compile
```

The compiled bytecode will be in:
```
artifacts/contracts/ComplianceAuditLog.sol/ComplianceAuditLog.json
```

### Step 2: Extract Bytecode

```bash
# Extract just the bytecode
cat artifacts/contracts/ComplianceAuditLog.sol/ComplianceAuditLog.json | jq -r '.bytecode' > ComplianceAuditLog.bytecode
```

### Step 3: Set Environment Variable

Add to your `.env` file:

```bash
COMPLIANCE_CONTRACT_BYTECODE=<paste bytecode here>
```

**Note**: The bytecode will be very long (several KB). This is normal.

## Deployment

### Local Development (Hardhat Network)

```bash
# Start local Hardhat node
npx hardhat node

# Deploy contract (in another terminal)
npx hardhat run scripts/deploy.js --network localhost

# Note the deployed contract address
# Add to .env:
# BLOCKCHAIN_CONTRACT_ADDRESS=0x...
```

### Testnet Deployment (Recommended for Testing)

**Polygon Mumbai Testnet** (free):

1. Get test MATIC from [Mumbai Faucet](https://faucet.polygon.technology/)
2. Configure `hardhat.config.js`:

```javascript
module.exports = {
  networks: {
    mumbai: {
      url: "https://rpc-mumbai.maticvigil.com",
      accounts: [process.env.BLOCKCHAIN_PRIVATE_KEY]
    }
  }
};
```

3. Deploy:

```bash
npx hardhat run scripts/deploy.js --network mumbai
```

### Mainnet Deployment (Production)

**⚠️ Warning**: Mainnet deployment costs real money (gas fees)

**Ethereum Mainnet**:
- Gas fees: $10-$100+ per deployment
- Suitable for high-value compliance data
- Maximum security

**Polygon Mainnet** (Recommended):
- Gas fees: <$1 per deployment
- Fast and cost-effective
- Good security for compliance use cases

Configuration:

```bash
# .env
ETHEREUM_RPC_URL=https://mainnet.infura.io/v3/YOUR_INFURA_KEY
POLYGON_RPC_URL=https://polygon-rpc.com
BLOCKCHAIN_PRIVATE_KEY=your_private_key_here
COMPLIANCE_CONTRACT_BYTECODE=<compiled bytecode>
```

Deploy:

```bash
npx hardhat run scripts/deploy.js --network polygon
```

## Deployment Script

Create `scripts/deploy.js`:

```javascript
const hre = require("hardhat");

async function main() {
  console.log("Deploying ComplianceAuditLog contract...");

  const ComplianceAuditLog = await hre.ethers.getContractFactory("ComplianceAuditLog");
  const contract = await ComplianceAuditLog.deploy();

  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("ComplianceAuditLog deployed to:", address);
  console.log("Add this to your .env:");
  console.log(`BLOCKCHAIN_CONTRACT_ADDRESS=${address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

## Environment Variables

Required for blockchain features:

```bash
# Network RPC URLs
ETHEREUM_RPC_URL=https://mainnet.infura.io/v3/YOUR_KEY
POLYGON_RPC_URL=https://polygon-rpc.com

# Private key for signing transactions (keep secure!)
BLOCKCHAIN_PRIVATE_KEY=0x...

# Compiled contract bytecode
COMPLIANCE_CONTRACT_BYTECODE=0x608060405234801561001...

# Deployed contract address
BLOCKCHAIN_CONTRACT_ADDRESS=0x...

# Network to use (ethereum or polygon)
BLOCKCHAIN_NETWORK=polygon
```

## Usage in Application

Once deployed, the blockchain service will automatically:

1. Store audit logs on-chain when `storeOnBlockchain: true` is specified
2. Generate transaction hashes for verification
3. Allow verification of audit log integrity
4. Link evidence to audit logs with cryptographic proofs

Example API call:

```typescript
const result = await blockchainService.storeAuditLog({
  organizationId: 'org_123',
  userId: 'user_456',
  action: 'compliance.assessment.completed',
  data: { /* audit data */ },
  network: 'polygon',
  storeOnBlockchain: true
});

console.log('Transaction hash:', result.transactionHash);
console.log('Block number:', result.blockNumber);
```

## Cost Estimation

### Polygon Mainnet (Recommended)
- Contract deployment: ~$0.50-$2
- Per audit log: ~$0.01-$0.05
- Per evidence: ~$0.005-$0.02

### Ethereum Mainnet
- Contract deployment: ~$50-$200
- Per audit log: ~$5-$20
- Per evidence: ~$2-$10

**Note**: Costs vary based on gas prices. Use Polygon for cost-effective compliance logging.

## Security Best Practices

1. **Private Key Management**:
   - Never commit private keys to Git
   - Use environment variables
   - Consider hardware wallets for mainnet
   - Use separate keys for dev/test/prod

2. **Access Control**:
   - Only authorize trusted backend services
   - Rotate authorized addresses periodically
   - Monitor unauthorized access attempts

3. **Data Privacy**:
   - Only store hashes on-chain, not raw data
   - Keep sensitive data off-chain
   - Use encryption for data stored in database

4. **Gas Management**:
   - Set reasonable gas limits
   - Monitor gas prices before transactions
   - Batch operations when possible

## Verification

### Verify Contract on Block Explorer

For transparency, verify your contract source on:
- Etherscan (Ethereum): https://etherscan.io/verifyContract
- Polygonscan (Polygon): https://polygonscan.com/verifyContract

Benefits:
- Public verification of contract code
- Builds trust with auditors
- Enables third-party verification

### Verify Audit Data

Anyone can verify audit data integrity:

```bash
# Using ethers.js
const contract = new ethers.Contract(address, abi, provider);
const isValid = await contract.verifyAuditLog(logId, dataHash);
console.log('Data integrity verified:', isValid);
```

## Troubleshooting

### "Insufficient funds for gas"
- Ensure wallet has enough ETH/MATIC
- Check gas price is reasonable

### "Nonce too low"
- Transaction already processed
- Wait for pending transactions

### "Contract deployment failed"
- Check bytecode is correct
- Ensure sufficient gas limit
- Verify RPC URL is accessible

## Alternative: Disable Blockchain Features

If you don't need blockchain immutability:

1. Don't set `COMPLIANCE_CONTRACT_BYTECODE` in production
2. Service will throw error if blockchain operations are attempted
3. Audit logs will be stored in PostgreSQL only
4. This is a valid production configuration

## Further Resources

- Hardhat Documentation: https://hardhat.org/docs
- Ethers.js Documentation: https://docs.ethers.org/
- Polygon Documentation: https://docs.polygon.technology/
- Smart Contract Security: https://consensys.github.io/smart-contract-best-practices/

## Support

For blockchain integration support, consult:
- Blockchain development team
- Smart contract auditors
- Web3 community forums
