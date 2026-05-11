# Audit-Log Immutability Smart Contract

`ComplianceAuditLog.sol` is an **optional** on-chain anchor for ComplyEasyAI audit logs. When enabled, every meaningful state-changing service call publishes a SHA-256 hash of the audit-log entry to an EVM-compatible chain, producing a tamper-evident receipt that auditors can independently verify.

This is **not required for normal operation.** The platform's primary audit trail lives in PostgreSQL (`AuditLog` table) and is signed via append-only S3 storage. Blockchain anchoring is a customer-requestable enterprise add-on.

---

## Why on-chain?

Some enterprise customers — particularly in fintech and federated-evidence contexts — request a third-party-verifiable anchor that doesn't depend on AARAIK LLC remaining in business. Posting a hash chain to a public ledger satisfies that requirement without exposing any PII or customer content.

| What goes on-chain | What stays off-chain |
|--------------------|----------------------|
| SHA-256 hash of the log entry | The entry itself |
| Organization ID (UUID) | Customer name, email, business context |
| Timestamp | Anything user-content-bearing |

The chain stores no recoverable customer data; the hash is one-way.

## Contract

- **Name:** `ComplianceAuditLog`
- **Solidity:** `0.8.20`
- **Networks:** Polygon mainnet (recommended for cost), Ethereum mainnet, any EVM-compatible chain. Testnet: Polygon Amoy.
- **Storage:** `mapping(bytes32 => AuditEntry) entries; mapping(address => bytes32[]) byOrg;`
- **Gas profile:**
  - `submitAuditLog`: ~50k gas
  - `verifyAuditLog`: ~30k gas (owner-only)
  - `getAuditLog`: free (view)

## Build

```bash
cd server/contracts
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
npx hardhat compile
```

## Deploy

Configure `hardhat.config.js` with the target network, then:

```bash
# Required env (deployment wallet — NEVER commit)
export PRIVATE_KEY=<deployer-private-key>
export INFURA_API_KEY=<your-key>
export POLYGON_RPC_URL=<https://polygon-rpc.com>

npx hardhat run scripts/deploy.js --network polygon
```

After deployment, extract the deployed bytecode and address:

```bash
# Address — emit to env
echo "COMPLIANCE_CONTRACT_ADDRESS=0x..." >> ../.env

# Bytecode — for clients that re-instantiate via factory
cat artifacts/contracts/ComplianceAuditLog.sol/ComplianceAuditLog.json | jq -r .bytecode
echo "COMPLIANCE_CONTRACT_BYTECODE=0x..." >> ../.env
```

Verify on Polygonscan / Etherscan:

```bash
npx hardhat verify --network polygon <CONTRACT_ADDRESS>
```

## Enable in the platform

Set in `server/.env`:

```env
BLOCKCHAIN_AUDIT_ENABLED=true
COMPLIANCE_CONTRACT_ADDRESS=0x...
COMPLIANCE_CONTRACT_BYTECODE=0x...
WEB3_PROVIDER_URL=https://polygon-rpc.com
WEB3_SUBMIT_WALLET_PRIVATE_KEY=<submit-only-wallet>   # rotate quarterly
```

`server/src/services/blockchainService.ts` reads these on boot, refuses to submit if any are missing, and gates every submit through a per-org rate limiter to keep gas costs bounded.

## How it's used

When a state change is captured by `AuditLogger.log(...)`:

1. The entry is written to the `AuditLog` Postgres table (always).
2. If blockchain anchoring is enabled for the organization's tier, `blockchainService.submitHash(orgId, sha256(entry))` is queued.
3. The queue worker submits the hash via `submitAuditLog(orgId, hash, timestamp)`.
4. The resulting transaction hash + block number are stored in `AuditLog.blockchainTxHash`.
5. The UI shows a "View on chain" link (Etherscan / Polygonscan).

The submission is async and best-effort — a chain submission failure does NOT block the original audit-log write.

## Verifying a log entry off-chain

```ts
const hashOnChain = await contract.getAuditLog(orgId, entryHash);
const hashLocal = sha256(JSON.stringify(localEntry));
const valid = hashOnChain === hashLocal;
```

Any third party with the contract address and the (off-chain) entry can verify integrity without contacting AARAIK.

## Security considerations

- The submit wallet is **submit-only** — it never holds customer funds. Rotate the private key quarterly via the standard wallet-rotation runbook.
- Only the contract owner can call `verifyAuditLog` (mark an entry as auditor-verified). The owner key lives in AWS KMS in production.
- `submitAuditLog` is open by design — anyone can submit *their own* hashes. The contract verifies `msg.sender == org.submitWalletAddress` before recording the entry against an organization, so a third party cannot inject hashes claiming to be from your org.
- Audit logs are immutable once submitted — there is no `delete` or `update` function. This is the property auditors want.

## Testing

```bash
npx hardhat test                                    # full suite
npx hardhat test --grep "submitAuditLog"            # one test
npx hardhat coverage                                # coverage report
```

## Status

- **Default:** disabled (`BLOCKCHAIN_AUDIT_ENABLED=false`)
- **Customer tier:** Enterprise add-on
- **Production deployments:** Polygon mainnet (active enterprise pilots)
