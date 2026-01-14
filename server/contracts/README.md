# Compliance Audit Log Smart Contract

## Overview

This Solidity contract enables ComplyEasyAI to store critical audit logs on the blockchain (Ethereum/Polygon) for immutable compliance tracking.

## Contract Details

- **Contract Name:** ComplianceAuditLog
- **Solidity Version:** 0.8.20
- **Network Support:** Ethereum, Polygon, and other EVM-compatible chains

## Features

1. **Audit Log Submission:** Submit audit log entries with SHA-256 hash
2. **Verification:** Owner can verify audit log entries
3. **Organization Tracking:** Track all audit logs per organization
4. **Immutable Storage:** Once submitted, audit logs cannot be modified

## Deployment

### Prerequisites

1. Install Hardhat or Truffle:
```bash
npm install --save-dev hardhat
# or
npm install --save-dev truffle
```

2. Configure network settings in `hardhat.config.js` or `truffle-config.js`

3. Set up environment variables:
```env
PRIVATE_KEY=your_private_key
INFURA_API_KEY=your_infura_key
POLYGON_RPC_URL=your_polygon_rpc_url
```

### Compile Contract

```bash
npx hardhat compile
# or
truffle compile
```

### Deploy Contract

```bash
npx hardhat run scripts/deploy.js --network polygon
# or
truffle migrate --network polygon
```

### Get Contract Bytecode

After deployment, extract the bytecode:

```bash
npx hardhat verify --network polygon <CONTRACT_ADDRESS>
```

Or get bytecode from compilation artifacts:
```bash
cat artifacts/contracts/ComplianceAuditLog.sol/ComplianceAuditLog.json | jq .bytecode
```

## Environment Variable

After deployment, set the contract bytecode in your `.env` file:

```env
COMPLIANCE_CONTRACT_BYTECODE=0x608060405234801561001057600080fd5b50...
```

## Usage

The contract is automatically used by `blockchainService.ts` when submitting audit logs. The service will:

1. Calculate SHA-256 hash of audit log data
2. Submit to blockchain using the deployed contract
3. Store transaction hash in audit log metadata
4. Generate explorer links (Etherscan/Polygonscan)

## Gas Costs

- **submitAuditLog:** ~50,000 gas
- **verifyAuditLog:** ~30,000 gas
- **getAuditLog:** Free (view function)

## Security Considerations

1. Only contract owner can verify logs
2. Audit logs are immutable once submitted
3. Uses SHA-256 for hash verification
4. Supports multiple organizations

## Testing

```bash
npx hardhat test
# or
truffle test
```

