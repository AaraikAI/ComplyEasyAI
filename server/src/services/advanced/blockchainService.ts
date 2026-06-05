/**
 * Blockchain Verification Service
 * Real blockchain integration for immutable audit logs and compliance verification
 * Supports both Ethereum and Hyperledger Fabric
 *
 * Extended with ComplianceRegistry integration for:
 * - Certificate lifecycle management (issue, verify, revoke, renew)
 * - Framework compliance scoring with history tracking
 * - Evidence chain-of-custody tracking
 * - Policy change audit trail
 * - Real-time blockchain event processing
 *
 * ============================================================================
 * FIPS 140-2 BOUNDARY NOTICE
 * ============================================================================
 * This service operates OUTSIDE the FIPS cryptographic module boundary.
 *
 * Non-FIPS algorithms used:
 *   - Keccak-256 (used by ethers.js keccak256) — Ethereum address/tx hashing
 *   - secp256k1 (ECDSA) — Ethereum transaction signing
 *
 * These algorithms are REQUIRED by the Ethereum protocol specification (EIP-155,
 * Yellow Paper §4.1) and CANNOT be substituted with FIPS-approved alternatives
 * while maintaining blockchain interoperability.
 *
 * Note: Hyperledger Fabric integration uses ECDSA P-256 (prime256v1) with
 * SHA-256, which ARE FIPS 140-2 approved algorithms.
 *
 * This service is isolated from the application's core security boundary
 * and does NOT handle:
 *   - User authentication or session management
 *   - Encryption of personally identifiable information (PII)
 *   - Password hashing or credential storage
 *   - TLS/transport security
 *
 * Reference: docs/FIPS_CRYPTOGRAPHIC_MODULE_BOUNDARY.md
 * ============================================================================
 */

import { ethers } from 'ethers';
import crypto from 'crypto';
import logger from '../../config/logger';
import prisma from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
import { connect, Gateway, Network, Contract, signers } from '@hyperledger/fabric-gateway';
import { Wallets } from 'fabric-network';
import * as grpc from '@grpc/grpc-js';
import * as fs from 'fs';
import * as path from 'path';

// Import compiled contract artifacts for on-chain integration. ABIs are loaded
// from the build output so the runtime selectors always match the deployed
// contracts (server/src/blockchain/contracts/*.sol).
import ComplianceRegistryArtifact from '../../blockchain/artifacts/ComplianceRegistry.json';
import ComplianceAuditLogArtifact from '../../blockchain/artifacts/contracts/ComplianceAuditLog.sol/ComplianceAuditLog.json';

type BlockchainNetwork = 'ethereum' | 'polygon' | 'hyperledger';

interface BlockchainRecord {
  id: string;
  organizationId: string;
  recordType: 'audit_log' | 'compliance_proof' | 'certificate' | 'policy_change';
  dataHash: string;
  transactionHash: string;
  blockNumber: number;
  network: BlockchainNetwork;
  timestamp: Date;
  verified: boolean;
}

interface SmartContractConfig {
  network: BlockchainNetwork;
  contractAddress: string;
  abi: any[];
  providerUrl: string;
}

interface ComplianceProof {
  organizationId: string;
  framework: string;
  score: number;
  evidenceHash: string;
  timestamp: Date;
  auditorSignature?: string;
}

// ---------------------------------------------------------------------------
// ComplianceRegistry types
// ---------------------------------------------------------------------------

/** Certificate status enum matching the Solidity contract. */
enum RegistryCertificateStatus {
  None = 0,
  Issued = 1,
  Active = 2,
  Revoked = 3,
  Expired = 4,
  Renewed = 5,
}

/** Parameters for issuing a certificate via the registry contract. */
interface RegistryIssueCertificateParams {
  certId: string;
  orgId: string;
  framework: string;
  score: number;
  expiresAt: number;
  dataHash: string;
  metadataHash: string;
}

/** Parameters for renewing a certificate via the registry contract. */
interface RegistryRenewCertificateParams {
  oldCertId: string;
  newCertId: string;
  newScore: number;
  newExpiresAt: number;
  newDataHash: string;
  newMetadataHash: string;
}

/** On-chain certificate data returned by getCertificate. */
interface RegistryCertificateData {
  orgId: string;
  framework: string;
  issuer: string;
  status: RegistryCertificateStatus;
  score: number;
  issuedAt: number;
  expiresAt: number;
  renewedFrom: string;
  dataHash: string;
  metadataHash: string;
}

/** On-chain evidence node data returned by getEvidence. */
interface RegistryEvidenceData {
  certId: string;
  evidenceHash: string;
  submitter: string;
  timestamp: number;
  prevNodeId: string;
  evidenceType: string;
}

/** On-chain framework score data. */
interface RegistryFrameworkScoreData {
  score: number;
  assessor: string;
  timestamp: number;
  historyLen: number;
}

/** On-chain policy change record. */
interface RegistryPolicyChangeData {
  policyId: string;
  author: string;
  timestamp: number;
  oldHash: string;
  newHash: string;
  diffHash: string;
}

/** Result wrapper for registry contract write transactions. */
interface RegistryTxResult {
  transactionHash: string;
  blockNumber: number;
  gasUsed: string;
}

/** Callback for registry contract event listeners. */
type RegistryEventCallback = (...args: any[]) => void;

/**
 * Blockchain Service for immutable verification
 *
 * Features:
 * 1. Record audit logs on blockchain (immutable)
 * 2. Verify compliance certificates on-chain
 * 3. Smart contract for automated verification
 * 4. Multi-chain support (Ethereum, Polygon, Hyperledger)
 * 5. Proof of existence for documents
 */
class BlockchainService {
  private ethereumProvider: ethers.JsonRpcProvider | null = null;
  private polygonProvider: ethers.JsonRpcProvider | null = null;
  private wallet: ethers.Wallet | null = null;
  private auditContract: ethers.Contract | null = null;
  private hyperledgerGateway: Gateway | null = null;
  private hyperledgerNetwork: Network | null = null;
  private hyperledgerContract: Contract | null = null;

  // ComplianceRegistry contract instance (new)
  private registryContract: ethers.Contract | null = null;
  // Track active event listener unsubscribe functions for cleanup
  private registryEventListeners: Array<() => void> = [];

  // ABI for the deployed ComplianceAuditLog contract, loaded from its compiled
  // artifact so the selectors (createAuditLog / storeEvidence / verifyAuditLog /
  // getAuditLog / getOrganizationLogs) always match the on-chain bytecode.
  private readonly COMPLIANCE_CONTRACT_ABI = ComplianceAuditLogArtifact.abi;

  /**
   * Initialize blockchain providers
   */
  async initialize(): Promise<void> {
    try {
      // Initialize Ethereum provider.
      // Require an explicit RPC endpoint in production (mirrors the
      // COMPLIANCE_CONTRACT_BYTECODE guard below) rather than constructing a
      // provider against a non-functional default that fails on first use.
      let ethereumRpc = process.env.ETHEREUM_RPC_URL;
      if (!ethereumRpc) {
        if (process.env.NODE_ENV === 'production') {
          throw new AppError('ETHEREUM_RPC_URL environment variable required in production', 500);
        }
        // Public, keyless gateway for local/dev use only.
        ethereumRpc = 'https://ethereum-rpc.publicnode.com';
      }
      this.ethereumProvider = new ethers.JsonRpcProvider(ethereumRpc);

      // Initialize Polygon provider
      const polygonRpc = process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com';
      this.polygonProvider = new ethers.JsonRpcProvider(polygonRpc);

      // Initialize wallet (for signing transactions)
      const privateKey = process.env.BLOCKCHAIN_PRIVATE_KEY;
      if (privateKey) {
        this.wallet = new ethers.Wallet(privateKey, this.ethereumProvider);
      }

      // Initialize smart contract
      const contractAddress = process.env.COMPLIANCE_CONTRACT_ADDRESS;
      if (contractAddress && this.wallet) {
        this.auditContract = new ethers.Contract(
          contractAddress,
          this.COMPLIANCE_CONTRACT_ABI,
          this.wallet
        );
      }

      // Initialize ComplianceRegistry contract
      const registryAddress = process.env.COMPLIANCE_REGISTRY_ADDRESS;
      if (registryAddress && this.wallet) {
        this.registryContract = new ethers.Contract(
          registryAddress,
          ComplianceRegistryArtifact.abi,
          this.wallet
        );
        logger.info(`[Blockchain] ComplianceRegistry connected at ${registryAddress}`);
      } else {
        logger.warn('[Blockchain] ComplianceRegistry not configured (set COMPLIANCE_REGISTRY_ADDRESS)');
      }

      // Initialize Hyperledger Fabric
      await this.initializeHyperledger();

      logger.info('Blockchain service initialized');
    } catch (error) {
      logger.error('Error initializing blockchain service', error);
      throw new AppError('Blockchain initialization failed', 500);
    }
  }

  /**
   * Record audit log on blockchain
   */
  async recordAuditLog(
    organizationId: string,
    action: string,
    details: any,
    network: BlockchainNetwork = 'polygon'
  ): Promise<BlockchainRecord> {
    try {
      // Create hash of audit log data
      const dataToHash = JSON.stringify({
        organizationId,
        action,
        details,
        timestamp: new Date().toISOString(),
      });

      const dataHash = crypto.createHash('sha256').update(dataToHash).digest('hex');
      const bytes32Hash = '0x' + dataHash;

      // Record on blockchain
      let txHash: string;
      let blockNumber: number;

      if (network === 'ethereum' || network === 'polygon') {
        const result = await this.recordOnEthereum(bytes32Hash, action, network);
        txHash = result.transactionHash;
        blockNumber = result.blockNumber;
      } else {
        const result = await this.recordOnHyperledger(bytes32Hash, action);
        txHash = result.transactionId;
        blockNumber = result.blockHeight;
      }

      const record: BlockchainRecord = {
        id: crypto.randomBytes(16).toString('hex'),
        organizationId,
        recordType: 'audit_log',
        dataHash: bytes32Hash,
        transactionHash: txHash,
        blockNumber,
        network,
        timestamp: new Date(),
        verified: true,
      };

      // Store blockchain record metadata
      await this.storeBlockchainRecord(record);

      logger.info(`Audit log recorded on ${network}: ${txHash}`);

      return record;
    } catch (error) {
      logger.error('Error recording audit log on blockchain', error);
      throw new AppError('Blockchain audit log recording failed', 500);
    }
  }

  /**
   * Record on Ethereum/Polygon
   */
  private async recordOnEthereum(
    dataHash: string,
    metadata: string,
    network: BlockchainNetwork
  ): Promise<{ transactionHash: string; blockNumber: number; logId: string }> {
    try {
      if (!this.auditContract) {
        // Fallback: Use direct transaction if contract not available
        const fallback = await this.recordViaTransaction(dataHash, metadata, network);
        return { ...fallback, logId: '' };
      }

      // Derive a unique on-chain log identifier. The deployed ComplianceAuditLog
      // contract rejects duplicate logIds, so it must be unique per anchor.
      const logId = ethers.keccak256(
        ethers.toUtf8Bytes(`${dataHash}|${metadata}|${Date.now()}|${crypto.randomBytes(8).toString('hex')}`)
      );

      // Call the deployed contract: createAuditLog(logId, organizationId, userId, action, dataHash).
      // The cryptographic anchor is dataHash; metadata is recorded as the action label.
      const tx = await this.auditContract.createAuditLog(logId, '', '', metadata, dataHash);
      const receipt = await tx.wait();

      logger.info(`Ethereum transaction confirmed: ${receipt.hash} (block ${receipt.blockNumber})`);

      return {
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        logId,
      };
    } catch (error) {
      logger.error('Error recording on Ethereum', error);
      throw error;
    }
  }

  /**
   * Record via direct transaction (fallback)
   */
  private async recordViaTransaction(
    dataHash: string,
    metadata: string,
    network: BlockchainNetwork
  ): Promise<{ transactionHash: string; blockNumber: number }> {
    try {
      if (!this.wallet) {
        throw new AppError('Wallet not initialized', 500);
      }

      const provider = network === 'ethereum' ? this.ethereumProvider : this.polygonProvider;

      if (!provider) {
        throw new AppError('Provider not initialized', 500);
      }

      // Create transaction with data hash in input data
      const tx = await this.wallet.sendTransaction({
        to: this.wallet.address, // Send to self
        value: 0,
        data: ethers.hexlify(ethers.toUtf8Bytes(dataHash + '|' + metadata)),
      });

      const receipt = await tx.wait();

      if (!receipt) {
        throw new AppError('Transaction receipt not available', 500);
      }

      return {
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
      };
    } catch (error) {
      logger.error('Error in direct transaction', error);
      throw error;
    }
  }

  /**
   * Initialize Hyperledger Fabric connection
   */
  private async initializeHyperledger(): Promise<void> {
    try {
      const peerEndpoint = process.env.HYPERLEDGER_PEER_ENDPOINT;
      const peerTlsCertPath = process.env.HYPERLEDGER_PEER_TLS_CERT_PATH;
      const peerTlsKeyPath = process.env.HYPERLEDGER_PEER_TLS_KEY_PATH;
      const peerTlsCaCertPath = process.env.HYPERLEDGER_PEER_TLS_CA_CERT_PATH;
      const mspId = process.env.HYPERLEDGER_MSP_ID || 'Org1MSP';
      const channelName = process.env.HYPERLEDGER_CHANNEL_NAME || 'mychannel';
      const chaincodeName = process.env.HYPERLEDGER_CHAINCODE_NAME || 'compliance';
      const walletPath = process.env.HYPERLEDGER_WALLET_PATH || path.join(__dirname, '../../../wallet');

      if (!peerEndpoint) {
        logger.warn('[Blockchain] Hyperledger configuration not found, skipping initialization');
        return;
      }

      // Create wallet
      const wallet = await Wallets.newFileSystemWallet(walletPath);
      const identity = await wallet.get('appUser');

      if (!identity) {
        logger.warn('[Blockchain] Hyperledger identity not found in wallet');
        return;
      }

      // Create gRPC connection
      const tlsCredentials = grpc.credentials.createSsl(
        peerTlsCaCertPath ? fs.readFileSync(peerTlsCaCertPath) : undefined
      );
      const peer = new grpc.Client(peerEndpoint, tlsCredentials);

      // Create gateway connection using fabric-gateway connect() function
      // The fabric-gateway v1.x API uses connect() to create a Gateway instance
      const gateway = await connect({
        client: peer,
        identity: identity as any,
        signer: async (digest: Uint8Array) => {
          // Load the private key from env var or PEM file for ECDSA signing
          let privateKeyPem: string | undefined;

          if (process.env.HYPERLEDGER_PRIVATE_KEY) {
            // Private key provided directly as env var (PEM-encoded string)
            privateKeyPem = process.env.HYPERLEDGER_PRIVATE_KEY;
          } else if (process.env.HYPERLEDGER_USER_PRIVATE_KEY_PEM) {
            // Private key provided as a file path
            try {
              privateKeyPem = fs.readFileSync(process.env.HYPERLEDGER_USER_PRIVATE_KEY_PEM, 'utf8');
            } catch (err) {
              logger.error('[Blockchain] Failed to read private key PEM file', err);
            }
          }

          if (privateKeyPem) {
            try {
              const privateKey = crypto.createPrivateKey({
                key: privateKeyPem,
                format: 'pem',
              });
              // Delegate to the fabric-gateway P-256/SHA-256 signer. The callback
              // receives an already-computed digest; this signer signs it directly
              // (no re-hashing) and emits a low-S canonical DER signature, which is
              // the encoding Fabric's MSP verifies. A hand-rolled crypto.createSign
              // would both re-hash the digest and skip low-S normalization, causing
              // the peer to reject otherwise-valid signatures.
              const sign = signers.newPrivateKeySigner(privateKey);
              return await sign(digest);
            } catch (err) {
              logger.error('[Blockchain] ECDSA signing failed', err);
              throw new AppError(`Hyperledger signer failed: ${err instanceof Error ? err.message : 'Unknown error'}`, 500);
            }
          }

          // No private key available
          if (process.env.NODE_ENV === 'production') {
            throw new AppError('Hyperledger private key required in production: set HYPERLEDGER_PRIVATE_KEY or HYPERLEDGER_USER_PRIVATE_KEY_PEM', 500);
          }

          logger.warn('[Blockchain] No private key configured for Hyperledger signer; returning empty signature (non-production only)');
          return new Uint8Array();
        },
      });
      this.hyperledgerGateway = gateway;

      // Get network and contract
      if (this.hyperledgerGateway) {
        this.hyperledgerNetwork = this.hyperledgerGateway.getNetwork(channelName);
        if (this.hyperledgerNetwork) {
          this.hyperledgerContract = this.hyperledgerNetwork.getContract(chaincodeName);
        }
      }

      logger.info('[Blockchain] Hyperledger Fabric initialized');
    } catch (error) {
      logger.warn('[Blockchain] Hyperledger initialization failed (may not be configured)', error);
      // Don't throw - Hyperledger is optional
    }
  }

  /**
   * Record on Hyperledger Fabric
   */
  private async recordOnHyperledger(
    dataHash: string,
    metadata: string
  ): Promise<{ transactionId: string; blockHeight: number }> {
    try {
      if (!this.hyperledgerContract) {
        throw new AppError('Hyperledger Fabric not initialized. Configure HYPERLEDGER_* environment variables.', 500);
      }

      // Submit transaction to Hyperledger Fabric
      const result = await this.hyperledgerContract.submitTransaction(
        'RecordAuditLog',
        dataHash,
        metadata
      );

      // Parse result (assuming it returns JSON with transactionId and blockHeight)
      const resultJson = JSON.parse(result.toString());
      const transactionId = resultJson.transactionId || resultJson.txId || crypto.randomBytes(32).toString('hex');
      const blockHeight = resultJson.blockHeight || resultJson.blockNumber || Math.floor(Date.now() / 1000);

      logger.info(`[Blockchain] Hyperledger transaction recorded: ${transactionId} at block ${blockHeight}`);

      return {
        transactionId,
        blockHeight,
      };
    } catch (error) {
      logger.error('[Blockchain] Error recording on Hyperledger', error);
      if (process.env.NODE_ENV === 'production') {
        throw new AppError('Hyperledger Fabric transaction failed', 500);
      }
      // In development, provide more details
      throw error;
    }
  }

  /**
   * Verify audit log on blockchain
   */
  async verifyAuditLog(
    dataHash: string,
    network: BlockchainNetwork
  ): Promise<{
    exists: boolean;
    blockNumber?: number;
    timestamp?: Date;
    recorder?: string;
  }> {
    try {
      if (network === 'ethereum' || network === 'polygon') {
        return await this.verifyOnEthereum(dataHash);
      } else {
        return await this.verifyOnHyperledger(dataHash);
      }
    } catch (error) {
      logger.error('Error verifying audit log', error);
      return { exists: false };
    }
  }

  /**
   * Verify on Ethereum
   */
  private async verifyOnEthereum(
    dataHash: string,
    logId?: string
  ): Promise<{ exists: boolean; blockNumber?: number; timestamp?: Date; recorder?: string }> {
    try {
      if (!this.auditContract) {
        return { exists: false };
      }

      // The deployed ComplianceAuditLog contract verifies by (logId, dataHash);
      // it has no lookup-by-dataHash-alone selector. Without a logId we cannot
      // resolve the on-chain entry, so report not-verified rather than calling a
      // selector that does not exist on the contract.
      if (!logId) {
        logger.warn('[Blockchain] verifyOnEthereum requires a logId; on-chain verification skipped');
        return { exists: false };
      }

      const matches: boolean = await this.auditContract.verifyAuditLog(logId, dataHash);

      if (matches) {
        // Read the stored entry to recover its timestamp.
        try {
          const entry = await this.auditContract.getAuditLog(logId);
          const timestamp = new Date(Number(entry[4]) * 1000);
          return { exists: true, timestamp };
        } catch {
          return { exists: true };
        }
      }

      return { exists: false };
    } catch (error) {
      logger.error('Error verifying on Ethereum', error);
      return { exists: false };
    }
  }

  /**
   * Verify on Hyperledger Fabric
   */
  private async verifyOnHyperledger(
    dataHash: string
  ): Promise<{ exists: boolean; blockNumber?: number; timestamp?: Date }> {
    try {
      if (!this.hyperledgerContract) {
        return { exists: false };
      }

      // Query Hyperledger Fabric chaincode
      const result = await this.hyperledgerContract.evaluateTransaction(
        'VerifyAuditLog',
        dataHash
      );

      const resultJson = JSON.parse(result.toString());
      
      if (resultJson.exists) {
        return {
          exists: true,
          blockNumber: resultJson.blockNumber || resultJson.blockHeight,
          timestamp: resultJson.timestamp ? new Date(resultJson.timestamp) : new Date(),
        };
      }

      return { exists: false };
    } catch (error) {
      logger.error('[Blockchain] Error verifying on Hyperledger', error);
      return { exists: false };
    }
  }

  /**
   * Record compliance proof on blockchain
   */
  async recordComplianceProof(
    proof: ComplianceProof,
    network: BlockchainNetwork = 'polygon'
  ): Promise<BlockchainRecord> {
    try {
      // Convert org ID and evidence hash to bytes32
      const orgIdHash = ethers.keccak256(ethers.toUtf8Bytes(proof.organizationId));
      const evidenceHash = '0x' + proof.evidenceHash;

      let txHash: string;
      let blockNumber: number;

      if (network === 'ethereum' || network === 'polygon') {
        // Framework compliance scores are stored on the ComplianceRegistry
        // contract (recordFrameworkScore), not on ComplianceAuditLog.
        if (!this.registryContract) {
          throw new AppError(
            'Compliance scoring requires the ComplianceRegistry contract. Set COMPLIANCE_REGISTRY_ADDRESS and BLOCKCHAIN_PRIVATE_KEY.',
            501
          );
        }

        const frameworkHash = ethers.keccak256(ethers.toUtf8Bytes(proof.framework));
        const result = await this.executeRegistryTx('recordFrameworkScore', [
          orgIdHash,
          frameworkHash,
          proof.score,
          evidenceHash,
        ]);
        txHash = result.transactionHash;
        blockNumber = result.blockNumber;
      } else {
        const result = await this.recordComplianceOnHyperledger(proof);
        txHash = result.transactionId;
        blockNumber = result.blockHeight;
      }

      const record: BlockchainRecord = {
        id: crypto.randomBytes(16).toString('hex'),
        organizationId: proof.organizationId,
        recordType: 'compliance_proof',
        dataHash: evidenceHash,
        transactionHash: txHash,
        blockNumber,
        network,
        timestamp: new Date(),
        verified: true,
      };

      await this.storeBlockchainRecord(record);

      logger.info(`Compliance proof recorded on ${network}: ${txHash}`);

      return record;
    } catch (error) {
      logger.error('Error recording compliance proof', error);
      throw new AppError('Blockchain compliance proof recording failed', 500);
    }
  }

  /**
   * Record compliance on Hyperledger Fabric
   */
  private async recordComplianceOnHyperledger(
    proof: ComplianceProof
  ): Promise<{ transactionId: string; blockHeight: number }> {
    try {
      if (!this.hyperledgerContract) {
        throw new AppError('Hyperledger Fabric contract not initialized', 500);
      }

      // Prepare compliance proof data
      const complianceData = {
        organizationId: proof.organizationId,
        framework: proof.framework,
        score: proof.score,
        evidenceHash: proof.evidenceHash,
        timestamp: proof.timestamp.toISOString(),
        auditorSignature: proof.auditorSignature || '',
      };

      // Submit transaction to Hyperledger Fabric
      const result = await this.hyperledgerContract.submitTransaction(
        'RecordCompliance',
        JSON.stringify(complianceData)
      );

      const resultJson = JSON.parse(result.toString());

      logger.info(`[Blockchain] Compliance proof recorded on Hyperledger: ${resultJson.transactionId}`);

      return {
        transactionId: resultJson.transactionId || resultJson.txId,
        blockHeight: resultJson.blockHeight || resultJson.blockNumber || 0,
      };
    } catch (error) {
      logger.error('[Blockchain] Error recording compliance on Hyperledger', error);
      throw new AppError('Hyperledger compliance recording failed', 500);
    }
  }

  /**
   * Issue compliance certificate on blockchain
   */
  async issueComplianceCertificate(
    organizationId: string,
    framework: string,
    validUntil: Date,
    network: BlockchainNetwork = 'polygon'
  ): Promise<{
    certificateId: string;
    transactionHash: string;
    blockNumber: number;
  }> {
    // Certificate lifecycle lives on the ComplianceRegistry contract, not on
    // ComplianceAuditLog. The `network` argument is retained for API
    // compatibility; certificates are issued on whichever EVM network the
    // registry is deployed to.
    void network;
    try {
      const validUntilTimestamp = Math.floor(validUntil.getTime() / 1000);

      if (!this.registryContract) {
        throw new AppError(
          'Compliance certificates require the ComplianceRegistry contract. Set COMPLIANCE_REGISTRY_ADDRESS and BLOCKCHAIN_PRIVATE_KEY.',
          501
        );
      }

      // The registry keys certificates by a caller-supplied bytes32 id.
      const certId = ethers.keccak256(
        ethers.toUtf8Bytes(`${organizationId}|${framework}|${validUntilTimestamp}|${crypto.randomBytes(8).toString('hex')}`)
      );
      const orgIdHash = ethers.keccak256(ethers.toUtf8Bytes(organizationId));
      const zeroHash = '0x' + '0'.repeat(64);

      const result = await this.executeRegistryTx('issueCertificate', [
        certId,
        orgIdHash,
        framework,
        0, // score (not provided by this entrypoint)
        validUntilTimestamp,
        zeroHash, // dataHash
        zeroHash, // metadataHash
      ]);

      logger.info(`Compliance certificate issued: ${certId} (${framework})`);

      return {
        certificateId: certId,
        transactionHash: result.transactionHash,
        blockNumber: result.blockNumber,
      };
    } catch (error) {
      logger.error('Error issuing compliance certificate', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Certificate issuance failed', 500);
    }
  }

  /**
   * Verify compliance certificate
   */
  async verifyComplianceCertificate(
    certificateId: string
  ): Promise<{
    valid: boolean;
    framework?: string;
    validUntil?: Date;
  }> {
    try {
      // Certificates are verified against the ComplianceRegistry contract.
      if (!this.registryContract) {
        return { valid: false };
      }

      // Read-only verification (no lazy-expiry state mutation) via staticCall.
      const [valid, , , expiresAt] =
        await this.registryContract.verifyCertificate.staticCall(certificateId);

      if (valid) {
        let framework: string | undefined;
        try {
          const cert = await this.registryContract.getCertificate(certificateId);
          framework = cert[1];
        } catch {
          // Framework lookup is best-effort; validity is already established.
        }
        return {
          valid: true,
          framework,
          validUntil: new Date(Number(expiresAt) * 1000),
        };
      }

      return { valid: false };
    } catch (error) {
      logger.error('Error verifying compliance certificate', error);
      return { valid: false };
    }
  }

  /**
   * Get blockchain transaction details
   */
  async getTransactionDetails(
    transactionHash: string,
    network: BlockchainNetwork
  ): Promise<{
    blockNumber: number;
    timestamp: Date;
    from: string;
    status: string;
  } | null> {
    try {
      const provider = network === 'ethereum' ? this.ethereumProvider : this.polygonProvider;

      if (!provider) {
        return null;
      }

      const tx = await provider.getTransaction(transactionHash);
      const receipt = await provider.getTransactionReceipt(transactionHash);

      if (!tx || !receipt) {
        return null;
      }

      const block = await provider.getBlock(receipt.blockNumber);

      return {
        blockNumber: receipt.blockNumber,
        timestamp: block ? new Date(block.timestamp * 1000) : new Date(),
        from: tx.from,
        status: receipt.status === 1 ? 'success' : 'failed',
      };
    } catch (error) {
      logger.error('Error getting transaction details', error);
      return null;
    }
  }

  /**
   * Create proof of existence for document
   */
  async createProofOfExistence(
    organizationId: string,
    documentHash: string,
    documentType: string,
    network: BlockchainNetwork = 'polygon'
  ): Promise<BlockchainRecord> {
    try {
      const metadata = `PoE:${documentType}:${new Date().toISOString()}`;
      const bytes32Hash = '0x' + documentHash;

      const result = await this.recordOnEthereum(bytes32Hash, metadata, network);

      const record: BlockchainRecord = {
        id: crypto.randomBytes(16).toString('hex'),
        organizationId,
        recordType: 'certificate',
        dataHash: bytes32Hash,
        transactionHash: result.transactionHash,
        blockNumber: result.blockNumber,
        network,
        timestamp: new Date(),
        verified: true,
      };

      await this.storeBlockchainRecord(record);

      logger.info(`Proof of existence created: ${documentHash} on ${network}`);

      return record;
    } catch (error) {
      logger.error('Error creating proof of existence', error);
      throw new AppError('Proof of existence creation failed', 500);
    }
  }

  /**
   * Get blockchain records for organization
   */
  async getOrganizationRecords(
    organizationId: string,
    recordType?: BlockchainRecord['recordType']
  ): Promise<BlockchainRecord[]> {
    try {
      const records = await prisma.auditLog.findMany({
        where: {
          organizationId,
          action: {
            startsWith: 'Blockchain:',
          },
        },
        orderBy: {
          timestamp: 'desc',
        },
        take: 100,
      });

      // Parse blockchain records from audit logs
      const blockchainRecords: BlockchainRecord[] = records
        .map((log) => {
          try {
            const details = JSON.parse(log.details || '{}');
            if (details.blockchainRecord) {
              return details.blockchainRecord as BlockchainRecord;
            }
          } catch {
            return null;
          }
          return null;
        })
        .filter((r): r is BlockchainRecord => r !== null);

      if (recordType) {
        return blockchainRecords.filter((r) => r.recordType === recordType);
      }

      return blockchainRecords;
    } catch (error) {
      logger.error('Error getting organization blockchain records', error);
      return [];
    }
  }

  /**
   * Store blockchain record metadata in database
   */
  private async storeBlockchainRecord(record: BlockchainRecord): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          action: `Blockchain: ${record.recordType}`,
          organizationId: record.organizationId,
          hash: record.dataHash,
          details: JSON.stringify({
            blockchainRecord: record,
            network: record.network,
            transactionHash: record.transactionHash,
            blockNumber: record.blockNumber,
          }),
        },
      });
    } catch (error) {
      logger.error('Error storing blockchain record', error);
    }
  }

  /**
   * Deploy compliance smart contract (for initial setup)
   * Production-ready: Deploys actual smart contract with bytecode
   */
  async deployComplianceContract(network: BlockchainNetwork = 'polygon'): Promise<string> {
    try {
      if (!this.wallet) {
        throw new AppError('Wallet not initialized', 500);
      }

      const provider = network === 'ethereum' ? this.ethereumProvider : this.polygonProvider;
      if (!provider) {
        throw new AppError(`Provider not initialized for ${network}`, 500);
      }

      // Deploy the compiled ComplianceAuditLog bytecode (the contract whose ABI
      // backs COMPLIANCE_CONTRACT_ABI). An override may be supplied via
      // COMPLIANCE_CONTRACT_BYTECODE, but it must remain ABI-compatible.
      const contractBytecode =
        process.env.COMPLIANCE_CONTRACT_BYTECODE || ComplianceAuditLogArtifact.bytecode;
      if (!contractBytecode || contractBytecode === '0x') {
        throw new AppError('ComplianceAuditLog bytecode not available for deployment', 500);
      }

      // Contract factory for deployment
      const factory = new ethers.ContractFactory(
        this.COMPLIANCE_CONTRACT_ABI,
        contractBytecode,
        this.wallet
      );

      // Deploy the contract
      logger.info(`[Blockchain] Deploying compliance contract to ${network}...`);
      const contract = await factory.deploy();
      
      // Wait for deployment confirmation
      await contract.waitForDeployment();
      const contractAddress = await contract.getAddress();

      // Verify deployment
      const code = await provider.getCode(contractAddress);
      if (code === '0x') {
        throw new AppError('Contract deployment verification failed - no code at address', 500);
      }

      logger.info(`[Blockchain] Compliance contract deployed to ${network}: ${contractAddress}`);

      // Wire deployed contract into this service instance (production uses COMPLIANCE_CONTRACT_ADDRESS env on restart)
      if (this.wallet) {
        this.auditContract = new ethers.Contract(
          contractAddress,
          this.COMPLIANCE_CONTRACT_ABI,
          this.wallet.connect(provider)
        );
      }

      // System-level contract deployment event. AuditLog rows require an
      // organizationId, so this admin/system event is persisted to structured
      // logs only (logger.info below). Per-org compliance events are still
      // audited via the standard auditLog flow from controllers.
      logger.info('[Blockchain] Compliance contract deployed', {
        network,
        contractAddress,
        hash: crypto.randomBytes(16).toString('hex'),
      });

      logger.info(
        `[Blockchain] Set COMPLIANCE_CONTRACT_ADDRESS=${contractAddress} in environment for persistent use after restart`
      );

      return contractAddress;
    } catch (error) {
      logger.error('[Blockchain] Error deploying compliance contract]', error);
      throw new AppError(`Contract deployment failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 500);
    }
  }

  /**
   * Get gas price estimation
   */
  async estimateGasPrice(network: BlockchainNetwork): Promise<{
    gasPrice: string;
    maxFeePerGas: string;
    maxPriorityFeePerGas: string;
  }> {
    try {
      const provider = network === 'ethereum' ? this.ethereumProvider : this.polygonProvider;

      if (!provider) {
        throw new AppError('Provider not initialized', 500);
      }

      const feeData = await provider.getFeeData();

      return {
        gasPrice: ethers.formatUnits(feeData.gasPrice || 0n, 'gwei'),
        maxFeePerGas: ethers.formatUnits(feeData.maxFeePerGas || 0n, 'gwei'),
        maxPriorityFeePerGas: ethers.formatUnits(feeData.maxPriorityFeePerGas || 0n, 'gwei'),
      };
    } catch (error) {
      logger.error('Error estimating gas price', error);
      throw new AppError('Gas price estimation failed', 500);
    }
  }

  // ===========================================================================
  //  ComplianceRegistry Integration - New Methods
  // ===========================================================================

  /**
   * Ensure the ComplianceRegistry contract is available.
   * @throws Error if the registry contract is not initialized.
   */
  private ensureRegistryContract(): ethers.Contract {
    if (!this.registryContract) {
      throw new AppError(
        'ComplianceRegistry contract not initialized. Set COMPLIANCE_REGISTRY_ADDRESS and BLOCKCHAIN_PRIVATE_KEY environment variables.', 500
      );
    }
    return this.registryContract;
  }

  /**
   * Helper: execute a registry contract write call and wait for receipt.
   */
  private async executeRegistryTx(
    method: string,
    args: any[]
  ): Promise<RegistryTxResult> {
    const contract = this.ensureRegistryContract();
    const tx = await contract[method](...args);
    const receipt = await tx.wait();
    return {
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
    };
  }

  // ---- Deploy ComplianceRegistry ----

  /**
   * Deploy the ComplianceRegistry contract from its compiled artifact.
   * Returns the deployed contract address.
   *
   * @param network The target EVM network ('ethereum' or 'polygon').
   */
  async deployRegistryContract(
    network: BlockchainNetwork = 'polygon'
  ): Promise<{ contractAddress: string; transactionHash: string; blockNumber: number }> {
    try {
      if (!this.wallet) {
        throw new AppError('Wallet not initialized', 500);
      }
      const provider = network === 'ethereum' ? this.ethereumProvider : this.polygonProvider;
      if (!provider) {
        throw new AppError(`Provider not initialized for ${network}`, 500);
      }

      const abi = ComplianceRegistryArtifact.abi;
      const bytecode = ComplianceRegistryArtifact.bytecode;
      if (!bytecode) {
        throw new AppError('ComplianceRegistry bytecode not found in artifact', 500);
      }

      const walletWithProvider = this.wallet.connect(provider);
      const factory = new ethers.ContractFactory(abi, bytecode, walletWithProvider);

      logger.info(`[Blockchain] Deploying ComplianceRegistry to ${network}...`);

      // Estimate gas
      const deployTx = await factory.getDeployTransaction();
      const estimatedGas = await provider.estimateGas(deployTx);
      logger.info(`[Blockchain] Estimated deployment gas: ${estimatedGas.toString()}`);

      const contract = await factory.deploy({
        gasLimit: (estimatedGas * 120n) / 100n, // 20% safety buffer
      });

      await contract.waitForDeployment();
      const contractAddress = await contract.getAddress();

      // Verify bytecode was deployed
      const code = await provider.getCode(contractAddress);
      if (code === '0x' || code === '0x0') {
        throw new AppError('Contract deployment verification failed - no code at deployed address', 500);
      }

      const txHash = contract.deploymentTransaction()?.hash || '';
      const receipt = txHash ? await provider.getTransactionReceipt(txHash) : null;
      const blockNumber = receipt?.blockNumber ?? 0;

      // Wire up the newly deployed contract for immediate use
      this.registryContract = new ethers.Contract(contractAddress, abi, this.wallet);

      logger.info(
        `[Blockchain] ComplianceRegistry deployed to ${network}: ${contractAddress} (block ${blockNumber})`
      );

      return { contractAddress, transactionHash: txHash, blockNumber };
    } catch (error) {
      logger.error('[Blockchain] Error deploying ComplianceRegistry', error);
      throw new AppError(
        `ComplianceRegistry deployment failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 500
      );
    }
  }

  // ---- Certificate Lifecycle ----

  /**
   * Issue a compliance certificate on the ComplianceRegistry contract.
   */
  async registryIssueCertificate(
    params: RegistryIssueCertificateParams
  ): Promise<RegistryTxResult> {
    try {
      const result = await this.executeRegistryTx('issueCertificate', [
        params.certId,
        params.orgId,
        params.framework,
        params.score,
        params.expiresAt,
        params.dataHash,
        params.metadataHash,
      ]);

      logger.info(`[Blockchain] Certificate issued: ${params.certId} (tx: ${result.transactionHash})`);
      return result;
    } catch (error) {
      logger.error('[Blockchain] Error issuing registry certificate', error);
      throw new AppError('Registry certificate issuance failed', 500);
    }
  }

  /**
   * Activate an issued certificate (transition Issued -> Active).
   */
  async registryActivateCertificate(certId: string): Promise<RegistryTxResult> {
    try {
      const result = await this.executeRegistryTx('activateCertificate', [certId]);
      logger.info(`[Blockchain] Certificate activated: ${certId}`);
      return result;
    } catch (error) {
      logger.error('[Blockchain] Error activating registry certificate', error);
      throw new AppError('Registry certificate activation failed', 500);
    }
  }

  /**
   * Revoke a certificate on the ComplianceRegistry.
   * @param certId Certificate to revoke.
   * @param reason bytes32 hash of the revocation reason.
   */
  async registryRevokeCertificate(
    certId: string,
    reason: string
  ): Promise<RegistryTxResult> {
    try {
      const result = await this.executeRegistryTx('revokeCertificate', [certId, reason]);
      logger.info(`[Blockchain] Certificate revoked: ${certId}`);
      return result;
    } catch (error) {
      logger.error('[Blockchain] Error revoking registry certificate', error);
      throw new AppError('Registry certificate revocation failed', 500);
    }
  }

  /**
   * Renew a certificate, creating a successor and marking the old one Renewed.
   */
  async registryRenewCertificate(
    params: RegistryRenewCertificateParams
  ): Promise<RegistryTxResult> {
    try {
      const result = await this.executeRegistryTx('renewCertificate', [
        params.oldCertId,
        params.newCertId,
        params.newScore,
        params.newExpiresAt,
        params.newDataHash,
        params.newMetadataHash,
      ]);
      logger.info(
        `[Blockchain] Certificate renewed: ${params.oldCertId} -> ${params.newCertId}`
      );
      return result;
    } catch (error) {
      logger.error('[Blockchain] Error renewing registry certificate', error);
      throw new AppError('Registry certificate renewal failed', 500);
    }
  }

  /**
   * Verify a certificate on-chain (performs lazy expiry if needed).
   * This is a state-mutating call. Use `registryGetCertificate` for read-only.
   */
  async registryVerifyCertificate(
    certId: string
  ): Promise<{
    valid: boolean;
    status: RegistryCertificateStatus;
    score: number;
    expiresAt: number;
    transactionHash: string;
  }> {
    try {
      const contract = this.ensureRegistryContract();

      // Use staticCall to read return values without sending a transaction
      const staticResult = await contract.verifyCertificate.staticCall(certId);
      const valid: boolean = staticResult[0];
      const status = Number(staticResult[1]) as RegistryCertificateStatus;
      const score = Number(staticResult[2]);
      const expiresAt = Number(staticResult[3]);

      // Now execute the actual state-changing transaction (lazy expiry)
      const tx = await contract.verifyCertificate(certId);
      const receipt = await tx.wait();

      logger.info(
        `[Blockchain] Certificate verified: ${certId} valid=${valid} status=${RegistryCertificateStatus[status]}`
      );

      return {
        valid,
        status,
        score,
        expiresAt,
        transactionHash: receipt.hash,
      };
    } catch (error) {
      logger.error('[Blockchain] Error verifying registry certificate', error);
      throw new AppError('Registry certificate verification failed', 500);
    }
  }

  /**
   * Get certificate data from the registry (read-only, no lazy expiry).
   */
  async registryGetCertificate(certId: string): Promise<RegistryCertificateData> {
    try {
      const contract = this.ensureRegistryContract();
      const result = await contract.getCertificate(certId);
      return {
        orgId: result[0],
        framework: result[1],
        issuer: result[2],
        status: Number(result[3]) as RegistryCertificateStatus,
        score: Number(result[4]),
        issuedAt: Number(result[5]),
        expiresAt: Number(result[6]),
        renewedFrom: result[7],
        dataHash: result[8],
        metadataHash: result[9],
      };
    } catch (error) {
      logger.error('[Blockchain] Error reading registry certificate', error);
      throw new AppError('Failed to read registry certificate', 500);
    }
  }

  /**
   * Check whether a certificate exists on-chain.
   */
  async registryCertificateExists(certId: string): Promise<boolean> {
    try {
      const contract = this.ensureRegistryContract();
      return contract.certificateExists(certId);
    } catch (error) {
      logger.error('[Blockchain] Error checking certificate existence', error);
      return false;
    }
  }

  /**
   * Get all certificate IDs for an organisation from the registry.
   */
  async registryGetOrgCertificates(orgId: string): Promise<string[]> {
    try {
      const contract = this.ensureRegistryContract();
      return contract.getOrgCertificates(orgId);
    } catch (error) {
      logger.error('[Blockchain] Error fetching org certificates', error);
      return [];
    }
  }

  // ---- Framework Compliance Scoring ----

  /**
   * Record a framework compliance score on-chain.
   * @param orgId       Organisation identifier hash (bytes32).
   * @param framework   Framework identifier hash (bytes32).
   * @param score       Score in basis points (0-10000).
   * @param evidenceHash Hash of supporting evidence (bytes32).
   */
  async registryRecordFrameworkScore(
    orgId: string,
    framework: string,
    score: number,
    evidenceHash: string
  ): Promise<RegistryTxResult> {
    try {
      const result = await this.executeRegistryTx('recordFrameworkScore', [
        orgId,
        framework,
        score,
        evidenceHash,
      ]);
      logger.info(
        `[Blockchain] Framework score recorded: org=${orgId.slice(0, 10)}... framework=${framework.slice(0, 10)}... score=${score}`
      );
      return result;
    } catch (error) {
      logger.error('[Blockchain] Error recording framework score', error);
      throw new AppError('Registry framework score recording failed', 500);
    }
  }

  /**
   * Get the latest framework score for an organisation.
   */
  async registryGetLatestFrameworkScore(
    orgId: string,
    framework: string
  ): Promise<RegistryFrameworkScoreData> {
    try {
      const contract = this.ensureRegistryContract();
      const result = await contract.getLatestFrameworkScore(orgId, framework);
      return {
        score: Number(result[0]),
        assessor: result[1],
        timestamp: Number(result[2]),
        historyLen: Number(result[3]),
      };
    } catch (error) {
      logger.error('[Blockchain] Error reading latest framework score', error);
      throw new AppError('Failed to read latest framework score', 500);
    }
  }

  /**
   * Get paginated framework score history.
   */
  async registryGetFrameworkScoreHistory(
    orgId: string,
    framework: string,
    offset: number = 0,
    limit: number = 50
  ): Promise<{
    assessors: string[];
    scores: number[];
    timestamps: number[];
    evidenceHashes: string[];
  }> {
    try {
      const contract = this.ensureRegistryContract();
      const result = await contract.getFrameworkScoreHistory(orgId, framework, offset, limit);
      return {
        assessors: result[0] as string[],
        scores: (result[1] as bigint[]).map(Number),
        timestamps: (result[2] as bigint[]).map(Number),
        evidenceHashes: result[3] as string[],
      };
    } catch (error) {
      logger.error('[Blockchain] Error reading framework score history', error);
      throw new AppError('Failed to read framework score history', 500);
    }
  }

  // ---- Evidence Chain-of-Custody ----

  /**
   * Submit evidence linked to a certificate on the ComplianceRegistry.
   * @param evidenceId   Unique evidence identifier (bytes32).
   * @param certId       Certificate the evidence relates to (bytes32).
   * @param evidenceHash Hash of the evidence artefact (bytes32).
   * @param evidenceType Hash of the evidence type label (bytes32).
   */
  async registrySubmitEvidence(
    evidenceId: string,
    certId: string,
    evidenceHash: string,
    evidenceType: string
  ): Promise<RegistryTxResult> {
    try {
      const result = await this.executeRegistryTx('submitEvidence', [
        evidenceId,
        certId,
        evidenceHash,
        evidenceType,
      ]);
      logger.info(
        `[Blockchain] Evidence submitted: ${evidenceId} -> cert ${certId} (tx: ${result.transactionHash})`
      );
      return result;
    } catch (error) {
      logger.error('[Blockchain] Error submitting evidence', error);
      throw new AppError('Registry evidence submission failed', 500);
    }
  }

  /**
   * Retrieve a single evidence node from the registry.
   */
  async registryGetEvidence(evidenceId: string): Promise<RegistryEvidenceData> {
    try {
      const contract = this.ensureRegistryContract();
      const result = await contract.getEvidence(evidenceId);
      return {
        certId: result[0],
        evidenceHash: result[1],
        submitter: result[2],
        timestamp: Number(result[3]),
        prevNodeId: result[4],
        evidenceType: result[5],
      };
    } catch (error) {
      logger.error('[Blockchain] Error reading evidence', error);
      throw new AppError('Failed to read evidence from registry', 500);
    }
  }

  /**
   * Walk the evidence chain for a certificate, returning up to `limit` entries.
   */
  async registryGetEvidenceChain(
    certId: string,
    limit: number = 0
  ): Promise<{ hashes: string[]; nodeIds: string[] }> {
    try {
      const contract = this.ensureRegistryContract();
      const result = await contract.getEvidenceChain(certId, limit);
      return {
        hashes: result[0] as string[],
        nodeIds: result[1] as string[],
      };
    } catch (error) {
      logger.error('[Blockchain] Error reading evidence chain', error);
      throw new AppError('Failed to read evidence chain from registry', 500);
    }
  }

  // ---- Policy Change Audit Trail ----

  /**
   * Record a policy change on-chain.
   */
  async registryRecordPolicyChange(
    orgId: string,
    policyId: string,
    oldHash: string,
    newHash: string,
    diffHash: string
  ): Promise<RegistryTxResult> {
    try {
      const result = await this.executeRegistryTx('recordPolicyChange', [
        orgId,
        policyId,
        oldHash,
        newHash,
        diffHash,
      ]);
      logger.info(
        `[Blockchain] Policy change recorded: org=${orgId.slice(0, 10)}... policy=${policyId.slice(0, 10)}...`
      );
      return result;
    } catch (error) {
      logger.error('[Blockchain] Error recording policy change', error);
      throw new AppError('Registry policy change recording failed', 500);
    }
  }

  /**
   * Get the count of policy changes for an organisation.
   */
  async registryGetPolicyChangeCount(orgId: string): Promise<number> {
    try {
      const contract = this.ensureRegistryContract();
      const count = await contract.getPolicyChangeCount(orgId);
      return Number(count);
    } catch (error) {
      logger.error('[Blockchain] Error getting policy change count', error);
      return 0;
    }
  }

  /**
   * Get a single policy change record by index.
   */
  async registryGetPolicyChange(
    orgId: string,
    index: number
  ): Promise<RegistryPolicyChangeData> {
    try {
      const contract = this.ensureRegistryContract();
      const result = await contract.getPolicyChange(orgId, index);
      return {
        policyId: result[0],
        author: result[1],
        timestamp: Number(result[2]),
        oldHash: result[3],
        newHash: result[4],
        diffHash: result[5],
      };
    } catch (error) {
      logger.error('[Blockchain] Error reading policy change', error);
      throw new AppError('Failed to read policy change from registry', 500);
    }
  }

  /**
   * Get paginated policy changes for an organisation.
   */
  async registryGetPolicyChanges(
    orgId: string,
    offset: number = 0,
    limit: number = 50
  ): Promise<{
    policyIds: string[];
    authors: string[];
    timestamps: number[];
    diffHashes: string[];
  }> {
    try {
      const contract = this.ensureRegistryContract();
      const result = await contract.getPolicyChanges(orgId, offset, limit);
      return {
        policyIds: result[0] as string[],
        authors: result[1] as string[],
        timestamps: (result[2] as bigint[]).map(Number),
        diffHashes: result[3] as string[],
      };
    } catch (error) {
      logger.error('[Blockchain] Error reading policy changes', error);
      throw new AppError('Failed to read policy changes from registry', 500);
    }
  }

  // ---- Role Management ----

  /**
   * Check whether an account holds a specific role on the registry.
   */
  async registryHasRole(role: string, account: string): Promise<boolean> {
    try {
      const contract = this.ensureRegistryContract();
      return contract.hasRole(role, account);
    } catch (error) {
      logger.error('[Blockchain] Error checking role', error);
      return false;
    }
  }

  /**
   * Grant a role to an account on the registry.
   */
  async registryGrantRole(role: string, account: string): Promise<RegistryTxResult> {
    try {
      const result = await this.executeRegistryTx('grantRole', [role, account]);
      logger.info(`[Blockchain] Role granted: role=${role.slice(0, 10)}... account=${account}`);
      return result;
    } catch (error) {
      logger.error('[Blockchain] Error granting role', error);
      throw new AppError('Registry role grant failed', 500);
    }
  }

  /**
   * Revoke a role from an account on the registry.
   */
  async registryRevokeRole(role: string, account: string): Promise<RegistryTxResult> {
    try {
      const result = await this.executeRegistryTx('revokeRole', [role, account]);
      logger.info(`[Blockchain] Role revoked: role=${role.slice(0, 10)}... account=${account}`);
      return result;
    } catch (error) {
      logger.error('[Blockchain] Error revoking role', error);
      throw new AppError('Registry role revocation failed', 500);
    }
  }

  // ---- Pause / Unpause ----

  /**
   * Pause the ComplianceRegistry (circuit breaker).
   */
  async registryPause(): Promise<RegistryTxResult> {
    try {
      const result = await this.executeRegistryTx('pause', []);
      logger.warn('[Blockchain] ComplianceRegistry PAUSED');
      return result;
    } catch (error) {
      logger.error('[Blockchain] Error pausing registry', error);
      throw new AppError('Registry pause failed', 500);
    }
  }

  /**
   * Unpause the ComplianceRegistry.
   */
  async registryUnpause(): Promise<RegistryTxResult> {
    try {
      const result = await this.executeRegistryTx('unpause', []);
      logger.info('[Blockchain] ComplianceRegistry UNPAUSED');
      return result;
    } catch (error) {
      logger.error('[Blockchain] Error unpausing registry', error);
      throw new AppError('Registry unpause failed', 500);
    }
  }

  /**
   * Check if the registry is paused.
   */
  async registryIsPaused(): Promise<boolean> {
    try {
      const contract = this.ensureRegistryContract();
      return contract.paused();
    } catch (error) {
      logger.error('[Blockchain] Error checking paused state', error);
      return false;
    }
  }

  // ---- Batch Operations ----

  /**
   * Batch-issue multiple certificates in a single transaction.
   */
  async registryBatchIssueCertificates(
    certs: RegistryIssueCertificateParams[]
  ): Promise<RegistryTxResult> {
    try {
      const result = await this.executeRegistryTx('batchIssueCertificates', [
        certs.map((c) => c.certId),
        certs.map((c) => c.orgId),
        certs.map((c) => c.framework),
        certs.map((c) => c.score),
        certs.map((c) => c.expiresAt),
        certs.map((c) => c.dataHash),
        certs.map((c) => c.metadataHash),
      ]);
      logger.info(`[Blockchain] Batch issued ${certs.length} certificates`);
      return result;
    } catch (error) {
      logger.error('[Blockchain] Error batch issuing certificates', error);
      throw new AppError('Registry batch certificate issuance failed', 500);
    }
  }

  /**
   * Batch-submit multiple evidence nodes in a single transaction.
   */
  async registryBatchSubmitEvidence(
    evidence: Array<{
      evidenceId: string;
      certId: string;
      evidenceHash: string;
      evidenceType: string;
    }>
  ): Promise<RegistryTxResult> {
    try {
      const result = await this.executeRegistryTx('batchSubmitEvidence', [
        evidence.map((e) => e.evidenceId),
        evidence.map((e) => e.certId),
        evidence.map((e) => e.evidenceHash),
        evidence.map((e) => e.evidenceType),
      ]);
      logger.info(`[Blockchain] Batch submitted ${evidence.length} evidence nodes`);
      return result;
    } catch (error) {
      logger.error('[Blockchain] Error batch submitting evidence', error);
      throw new AppError('Registry batch evidence submission failed', 500);
    }
  }

  /**
   * Batch-record multiple framework scores in a single transaction.
   */
  async registryBatchRecordScores(
    scores: Array<{
      orgId: string;
      framework: string;
      score: number;
      evidenceHash: string;
    }>
  ): Promise<RegistryTxResult> {
    try {
      const result = await this.executeRegistryTx('batchRecordScores', [
        scores.map((s) => s.orgId),
        scores.map((s) => s.framework),
        scores.map((s) => s.score),
        scores.map((s) => s.evidenceHash),
      ]);
      logger.info(`[Blockchain] Batch recorded ${scores.length} framework scores`);
      return result;
    } catch (error) {
      logger.error('[Blockchain] Error batch recording scores', error);
      throw new AppError('Registry batch score recording failed', 500);
    }
  }

  // ---- Registry Statistics ----

  /**
   * Get aggregate statistics from the registry contract.
   */
  async registryGetStats(): Promise<{
    certificateCount: number;
    evidenceCount: number;
    policyChangeCount: number;
    paused: boolean;
    deployer: string;
  }> {
    try {
      const contract = this.ensureRegistryContract();
      const [certCount, evidCount, policyCount, paused, deployer] = await Promise.all([
        contract.certificateCount(),
        contract.evidenceCount(),
        contract.policyChangeCount(),
        contract.paused(),
        contract.deployer(),
      ]);
      return {
        certificateCount: Number(certCount),
        evidenceCount: Number(evidCount),
        policyChangeCount: Number(policyCount),
        paused,
        deployer,
      };
    } catch (error) {
      logger.error('[Blockchain] Error fetching registry stats', error);
      throw new AppError('Failed to fetch registry statistics', 500);
    }
  }

  // ---- Event Listener Integration ----

  /**
   * Start listening to ComplianceRegistry events in real-time.
   * Logs events and stores records in the database.
   *
   * Call `stopRegistryEventListeners()` to clean up.
   */
  async startRegistryEventListeners(): Promise<void> {
    const contract = this.ensureRegistryContract();
    // Fallback org for events that do not include organizationId (CertificateRevoked, CertificateRenewed, EvidenceSubmitted)
    const fallbackOrgId =
      process.env.BLOCKCHAIN_AUDIT_ORG_ID ||
      (await prisma.organization.findFirst({ select: { id: true } }))?.id ||
      '';

    // CertificateIssued
    const onIssued = async (
      certId: string,
      orgId: string,
      framework: string,
      issuer: string,
      score: bigint,
      issuedAt: bigint,
      expiresAt: bigint,
      event: ethers.EventLog
    ) => {
      logger.info(
        `[Blockchain Event] CertificateIssued: certId=${certId} org=${orgId.slice(0, 10)}... score=${Number(score)}`
      );
      try {
        await prisma.auditLog.create({
          data: {
            action: 'Blockchain: registry_certificate_issued',
            organizationId: orgId,
            hash: certId,
            details: JSON.stringify({
              event: 'CertificateIssued',
              certId,
              orgId,
              framework,
              issuer,
              score: Number(score),
              issuedAt: Number(issuedAt),
              expiresAt: Number(expiresAt),
              transactionHash: event.transactionHash,
              blockNumber: event.blockNumber,
            }),
          },
        });
      } catch (err) {
        logger.error('[Blockchain Event] Failed to persist CertificateIssued event', err);
      }
    };
    contract.on('CertificateIssued', onIssued);
    this.registryEventListeners.push(() => contract.off('CertificateIssued', onIssued));

    // CertificateRevoked
    const onRevoked = async (
      certId: string,
      revoker: string,
      reason: string,
      event: ethers.EventLog
    ) => {
      logger.info(`[Blockchain Event] CertificateRevoked: certId=${certId} revoker=${revoker}`);
      try {
        await prisma.auditLog.create({
          data: {
            action: 'Blockchain: registry_certificate_revoked',
            organizationId: fallbackOrgId,
            hash: certId,
            details: JSON.stringify({
              event: 'CertificateRevoked',
              certId,
              revoker,
              reason,
              transactionHash: event.transactionHash,
              blockNumber: event.blockNumber,
            }),
          },
        });
      } catch (err) {
        logger.error('[Blockchain Event] Failed to persist CertificateRevoked event', err);
      }
    };
    contract.on('CertificateRevoked', onRevoked);
    this.registryEventListeners.push(() => contract.off('CertificateRevoked', onRevoked));

    // CertificateRenewed
    const onRenewed = async (
      oldCertId: string,
      newCertId: string,
      renewer: string,
      event: ethers.EventLog
    ) => {
      logger.info(
        `[Blockchain Event] CertificateRenewed: ${oldCertId} -> ${newCertId} by ${renewer}`
      );
      try {
        await prisma.auditLog.create({
          data: {
            action: 'Blockchain: registry_certificate_renewed',
            organizationId: fallbackOrgId,
            hash: newCertId,
            details: JSON.stringify({
              event: 'CertificateRenewed',
              oldCertId,
              newCertId,
              renewer,
              transactionHash: event.transactionHash,
              blockNumber: event.blockNumber,
            }),
          },
        });
      } catch (err) {
        logger.error('[Blockchain Event] Failed to persist CertificateRenewed event', err);
      }
    };
    contract.on('CertificateRenewed', onRenewed);
    this.registryEventListeners.push(() => contract.off('CertificateRenewed', onRenewed));

    // EvidenceSubmitted
    const onEvidence = async (
      evidenceId: string,
      certId: string,
      evidenceHash: string,
      evidenceType: string,
      submitter: string,
      event: ethers.EventLog
    ) => {
      logger.info(
        `[Blockchain Event] EvidenceSubmitted: ${evidenceId} -> cert ${certId} by ${submitter}`
      );
      try {
        await prisma.auditLog.create({
          data: {
            action: 'Blockchain: registry_evidence_submitted',
            organizationId: fallbackOrgId,
            hash: evidenceId,
            details: JSON.stringify({
              event: 'EvidenceSubmitted',
              evidenceId,
              certId,
              evidenceHash,
              evidenceType,
              submitter,
              transactionHash: event.transactionHash,
              blockNumber: event.blockNumber,
            }),
          },
        });
      } catch (err) {
        logger.error('[Blockchain Event] Failed to persist EvidenceSubmitted event', err);
      }
    };
    contract.on('EvidenceSubmitted', onEvidence);
    this.registryEventListeners.push(() => contract.off('EvidenceSubmitted', onEvidence));

    // FrameworkScoreRecorded
    const onScore = async (
      orgId: string,
      framework: string,
      score: bigint,
      assessor: string,
      event: ethers.EventLog
    ) => {
      logger.info(
        `[Blockchain Event] FrameworkScoreRecorded: org=${orgId.slice(0, 10)}... score=${Number(score)}`
      );
      try {
        await prisma.auditLog.create({
          data: {
            action: 'Blockchain: registry_score_recorded',
            organizationId: orgId,
            hash: `score_${orgId}_${framework}_${event.blockNumber}`,
            details: JSON.stringify({
              event: 'FrameworkScoreRecorded',
              orgId,
              framework,
              score: Number(score),
              assessor,
              transactionHash: event.transactionHash,
              blockNumber: event.blockNumber,
            }),
          },
        });
      } catch (err) {
        logger.error('[Blockchain Event] Failed to persist FrameworkScoreRecorded event', err);
      }
    };
    contract.on('FrameworkScoreRecorded', onScore);
    this.registryEventListeners.push(() => contract.off('FrameworkScoreRecorded', onScore));

    // PolicyChangeRecorded
    const onPolicy = async (
      orgId: string,
      policyId: string,
      diffHash: string,
      author: string,
      event: ethers.EventLog
    ) => {
      logger.info(
        `[Blockchain Event] PolicyChangeRecorded: org=${orgId.slice(0, 10)}... policy=${policyId.slice(0, 10)}...`
      );
      try {
        await prisma.auditLog.create({
          data: {
            action: 'Blockchain: registry_policy_change',
            organizationId: orgId,
            hash: policyId,
            details: JSON.stringify({
              event: 'PolicyChangeRecorded',
              orgId,
              policyId,
              diffHash,
              author,
              transactionHash: event.transactionHash,
              blockNumber: event.blockNumber,
            }),
          },
        });
      } catch (err) {
        logger.error('[Blockchain Event] Failed to persist PolicyChangeRecorded event', err);
      }
    };
    contract.on('PolicyChangeRecorded', onPolicy);
    this.registryEventListeners.push(() => contract.off('PolicyChangeRecorded', onPolicy));

    // Paused / Unpaused
    const onPaused = (account: string) => {
      logger.warn(`[Blockchain Event] Registry PAUSED by ${account}`);
    };
    const onUnpaused = (account: string) => {
      logger.info(`[Blockchain Event] Registry UNPAUSED by ${account}`);
    };
    contract.on('Paused', onPaused);
    contract.on('Unpaused', onUnpaused);
    this.registryEventListeners.push(() => contract.off('Paused', onPaused));
    this.registryEventListeners.push(() => contract.off('Unpaused', onUnpaused));

    logger.info('[Blockchain] Registry event listeners started');
  }

  /**
   * Stop all ComplianceRegistry event listeners.
   */
  stopRegistryEventListeners(): void {
    for (const unsub of this.registryEventListeners) {
      try {
        unsub();
      } catch {
        // Ignore errors on cleanup
      }
    }
    this.registryEventListeners = [];
    logger.info('[Blockchain] Registry event listeners stopped');
  }

  // ---- Utility Helpers ----

  /**
   * Hash a human-readable string to a bytes32 value (keccak256).
   */
  static toBytes32(value: string): string {
    return ethers.keccak256(ethers.toUtf8Bytes(value));
  }

  /**
   * Convert a Date to a Solidity-compatible uint64 timestamp (seconds).
   */
  static toTimestamp(date: Date): number {
    return Math.floor(date.getTime() / 1000);
  }

  /**
   * Well-known ComplianceRegistry role hashes.
   */
  static readonly REGISTRY_ADMIN_ROLE = ethers.keccak256(ethers.toUtf8Bytes('ADMIN_ROLE'));
  static readonly REGISTRY_AUDITOR_ROLE = ethers.keccak256(ethers.toUtf8Bytes('AUDITOR_ROLE'));
  static readonly REGISTRY_OPERATOR_ROLE = ethers.keccak256(ethers.toUtf8Bytes('OPERATOR_ROLE'));

  // ---- Evidence Anchoring & Tamper Detection ----

  /**
   * Anchor an evidence hash to the blockchain, creating an immutable record
   * that can later be used for tamper detection.
   */
  async anchorEvidenceHash(
    organizationId: string,
    evidenceId: string,
    fileBuffer: Buffer,
    metadata: {
      filename?: string;
      mimeType?: string;
      controlId?: string;
      frameworkId?: string;
    },
    network: BlockchainNetwork = 'polygon'
  ): Promise<{
    evidenceHash: string;
    transactionHash: string;
    blockNumber: number;
    anchoredAt: Date;
    network: BlockchainNetwork;
  }> {
    try {
      // Generate SHA-256 hash of the evidence file
      const evidenceHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
      const bytes32Hash = '0x' + evidenceHash;

      // Create metadata hash for additional context
      const metadataStr = JSON.stringify({
        evidenceId,
        organizationId,
        filename: metadata.filename,
        mimeType: metadata.mimeType,
        controlId: metadata.controlId,
        frameworkId: metadata.frameworkId,
        fileSize: fileBuffer.length,
        anchoredAt: new Date().toISOString(),
      });
      const metadataHash = crypto.createHash('sha256').update(metadataStr).digest('hex');

      let txHash: string;
      let blockNumber: number;

      // Try registry contract first for structured evidence storage
      if (this.registryContract) {
        try {
          const evidenceIdBytes32 = ethers.keccak256(ethers.toUtf8Bytes(evidenceId));
          const certId = ethers.keccak256(ethers.toUtf8Bytes(`${organizationId}:${metadata.frameworkId || 'general'}`));
          const evidenceTypeHash = ethers.keccak256(ethers.toUtf8Bytes(metadata.mimeType || 'document'));

          const result = await this.executeRegistryTx('submitEvidence', [
            evidenceIdBytes32,
            certId,
            bytes32Hash,
            evidenceTypeHash,
          ]);
          txHash = result.transactionHash;
          blockNumber = result.blockNumber;
        } catch (registryError) {
          logger.warn('[Blockchain] Registry evidence submission failed, falling back to audit log', registryError);
          // Fall back to audit log recording
          const result = await this.recordOnEthereum(bytes32Hash, `evidence:${evidenceId}:${metadataHash}`, network);
          txHash = result.transactionHash;
          blockNumber = result.blockNumber;
        }
      } else if (network === 'hyperledger') {
        const result = await this.recordOnHyperledger(bytes32Hash, `evidence:${evidenceId}:${metadataHash}`);
        txHash = result.transactionId;
        blockNumber = result.blockHeight;
      } else {
        const result = await this.recordOnEthereum(bytes32Hash, `evidence:${evidenceId}:${metadataHash}`, network);
        txHash = result.transactionHash;
        blockNumber = result.blockNumber;
      }

      // Store the anchoring record in the database
      const record: BlockchainRecord = {
        id: crypto.randomBytes(16).toString('hex'),
        organizationId,
        recordType: 'audit_log',
        dataHash: bytes32Hash,
        transactionHash: txHash,
        blockNumber,
        network,
        timestamp: new Date(),
        verified: true,
      };
      await this.storeBlockchainRecord(record);

      // Store evidence anchor metadata for tamper detection
      await prisma.auditLog.create({
        data: {
          action: 'Blockchain: evidence_anchored',
          organizationId,
          hash: evidenceHash,
          details: JSON.stringify({
            evidenceId,
            evidenceHash,
            metadataHash,
            transactionHash: txHash,
            blockNumber,
            network,
            filename: metadata.filename,
            mimeType: metadata.mimeType,
            fileSize: fileBuffer.length,
            controlId: metadata.controlId,
            frameworkId: metadata.frameworkId,
          }),
        },
      });

      logger.info(`[Blockchain] Evidence anchored: ${evidenceId} hash=${evidenceHash.substring(0, 16)}... tx=${txHash}`);

      return {
        evidenceHash,
        transactionHash: txHash,
        blockNumber,
        anchoredAt: new Date(),
        network,
      };
    } catch (error) {
      logger.error('[Blockchain] Error anchoring evidence hash', error);
      throw new AppError(`Evidence anchoring failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 500);
    }
  }

  /**
   * Detect tampering by comparing a file's current hash against its blockchain-anchored hash.
   * Returns detailed information about whether the evidence has been modified.
   */
  async detectTampering(
    organizationId: string,
    evidenceId: string,
    currentFileBuffer: Buffer
  ): Promise<{
    tampered: boolean;
    currentHash: string;
    anchoredHash: string | null;
    anchoredAt: Date | null;
    transactionHash: string | null;
    blockNumber: number | null;
    network: BlockchainNetwork | null;
    onChainVerified: boolean;
    details: string;
  }> {
    try {
      const currentHash = crypto.createHash('sha256').update(currentFileBuffer).digest('hex');

      // Find the anchored record from the database
      const anchorRecord = await prisma.auditLog.findFirst({
        where: {
          organizationId,
          action: 'Blockchain: evidence_anchored',
          details: { contains: evidenceId },
        },
        orderBy: { timestamp: 'desc' },
      });

      if (!anchorRecord) {
        return {
          tampered: false,
          currentHash,
          anchoredHash: null,
          anchoredAt: null,
          transactionHash: null,
          blockNumber: null,
          network: null,
          onChainVerified: false,
          details: 'No blockchain anchor found for this evidence. Evidence has not been anchored yet.',
        };
      }

      const anchorDetails = JSON.parse(anchorRecord.details || '{}');
      const anchoredHash = anchorDetails.evidenceHash;
      const transactionHash = anchorDetails.transactionHash;
      const blockNumber = anchorDetails.blockNumber;
      const network = anchorDetails.network as BlockchainNetwork;

      // Compare hashes
      const hashesMatch = currentHash === anchoredHash;

      // Verify the hash is still on-chain
      let onChainVerified = false;
      if (transactionHash && network) {
        try {
          if (network === 'ethereum' || network === 'polygon') {
            const onChainResult = await this.verifyOnEthereum('0x' + anchoredHash);
            onChainVerified = onChainResult.exists;
          } else {
            const onChainResult = await this.verifyOnHyperledger('0x' + anchoredHash);
            onChainVerified = onChainResult.exists;
          }
        } catch {
          logger.warn('[Blockchain] On-chain verification failed during tamper detection');
        }
      }

      const tampered = !hashesMatch;

      let details: string;
      if (tampered) {
        details = `TAMPERING DETECTED: Evidence hash mismatch. Current hash (${currentHash.substring(0, 16)}...) does not match anchored hash (${anchoredHash.substring(0, 16)}...) recorded at block ${blockNumber} on ${network}.`;
      } else if (onChainVerified) {
        details = `Evidence integrity verified. Hash matches blockchain anchor at block ${blockNumber} on ${network}. On-chain verification successful.`;
      } else {
        details = `Evidence hash matches anchored record but on-chain verification could not be completed. Hash: ${currentHash.substring(0, 16)}...`;
      }

      // Log the tamper detection check
      await prisma.auditLog.create({
        data: {
          action: tampered ? 'Blockchain: tampering_detected' : 'Blockchain: integrity_verified',
          organizationId,
          hash: currentHash,
          details: JSON.stringify({
            evidenceId,
            currentHash,
            anchoredHash,
            tampered,
            onChainVerified,
            transactionHash,
            blockNumber,
            network,
          }),
        },
      });

      if (tampered) {
        logger.warn(`[Blockchain] TAMPERING DETECTED for evidence ${evidenceId}: hash mismatch`);
      } else {
        logger.info(`[Blockchain] Evidence integrity verified for ${evidenceId}`);
      }

      return {
        tampered,
        currentHash,
        anchoredHash,
        anchoredAt: anchorRecord.timestamp,
        transactionHash,
        blockNumber,
        network,
        onChainVerified,
        details,
      };
    } catch (error) {
      logger.error('[Blockchain] Error detecting tampering', error);
      throw new AppError(`Tamper detection failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 500);
    }
  }

  /**
   * Verify a chain of blockchain transactions for an organization,
   * ensuring the audit trail is complete and sequential.
   */
  async verifyTransactionChain(
    organizationId: string,
    options?: {
      network?: BlockchainNetwork;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
    }
  ): Promise<{
    valid: boolean;
    totalTransactions: number;
    verifiedTransactions: number;
    failedVerifications: number;
    gaps: Array<{ afterBlock: number; beforeBlock: number; missingCount: number }>;
    details: string;
  }> {
    try {
      // Fetch all blockchain records for the organization
      const auditLogs = await prisma.auditLog.findMany({
        where: {
          organizationId,
          action: { startsWith: 'Blockchain:' },
          ...(options?.startDate && { timestamp: { gte: options.startDate } }),
          ...(options?.endDate && { timestamp: { lte: options.endDate } }),
        },
        orderBy: { timestamp: 'asc' },
        take: options?.limit || 1000,
      });

      if (auditLogs.length === 0) {
        return {
          valid: true,
          totalTransactions: 0,
          verifiedTransactions: 0,
          failedVerifications: 0,
          gaps: [],
          details: 'No blockchain transactions found for this organization.',
        };
      }

      let verifiedCount = 0;
      let failedCount = 0;
      const gaps: Array<{ afterBlock: number; beforeBlock: number; missingCount: number }> = [];
      let previousBlockNumber: number | null = null;

      for (const log of auditLogs) {
        try {
          const details = JSON.parse(log.details || '{}');
          const txHash = details.transactionHash || details.blockchainRecord?.transactionHash;
          const blockNumber = details.blockNumber || details.blockchainRecord?.blockNumber;
          const network = (details.network || details.blockchainRecord?.network || options?.network || 'polygon') as BlockchainNetwork;

          if (!txHash) {
            failedCount++;
            continue;
          }

          // Verify transaction exists on-chain
          if (network === 'ethereum' || network === 'polygon') {
            const provider = network === 'ethereum' ? this.ethereumProvider : this.polygonProvider;
            if (provider) {
              const receipt = await provider.getTransactionReceipt(txHash);
              if (receipt && receipt.status === 1) {
                verifiedCount++;
              } else {
                failedCount++;
              }
            } else {
              failedCount++;
            }
          } else {
            // For Hyperledger, trust the stored record
            verifiedCount++;
          }

          // Check for gaps in block numbers
          if (previousBlockNumber !== null && blockNumber) {
            const gap = blockNumber - previousBlockNumber;
            if (gap > 100) {
              gaps.push({
                afterBlock: previousBlockNumber,
                beforeBlock: blockNumber,
                missingCount: gap - 1,
              });
            }
          }
          if (blockNumber) {
            previousBlockNumber = blockNumber;
          }
        } catch {
          failedCount++;
        }
      }

      const valid = failedCount === 0 && gaps.length === 0;
      const details = valid
        ? `All ${verifiedCount} transactions verified successfully. Audit trail is complete.`
        : `Verification complete: ${verifiedCount} verified, ${failedCount} failed, ${gaps.length} gaps detected.`;

      logger.info(`[Blockchain] Transaction chain verification for ${organizationId}: ${details}`);

      return {
        valid,
        totalTransactions: auditLogs.length,
        verifiedTransactions: verifiedCount,
        failedVerifications: failedCount,
        gaps,
        details,
      };
    } catch (error) {
      logger.error('[Blockchain] Error verifying transaction chain', error);
      throw new AppError(`Transaction chain verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 500);
    }
  }

  /**
   * Get the complete audit trail history from blockchain for an organization.
   */
  async getAuditTrailHistory(
    organizationId: string,
    options?: {
      page?: number;
      pageSize?: number;
      recordType?: BlockchainRecord['recordType'];
      network?: BlockchainNetwork;
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<{
    records: Array<{
      id: string;
      action: string;
      dataHash: string;
      transactionHash: string;
      blockNumber: number;
      network: string;
      timestamp: Date;
      metadata: any;
    }>;
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    try {
      const page = options?.page || 1;
      const pageSize = options?.pageSize || 50;
      const skip = (page - 1) * pageSize;

      const where: any = {
        organizationId,
        action: { startsWith: 'Blockchain:' },
      };

      if (options?.startDate || options?.endDate) {
        where.timestamp = {};
        if (options.startDate) where.timestamp.gte = options.startDate;
        if (options.endDate) where.timestamp.lte = options.endDate;
      }

      const [auditLogs, total] = await Promise.all([
        prisma.auditLog.findMany({
          where,
          orderBy: { timestamp: 'desc' },
          skip,
          take: pageSize,
        }),
        prisma.auditLog.count({ where }),
      ]);

      const records = auditLogs.map((log) => {
        const details = JSON.parse(log.details || '{}');
        const blockchainRecord = details.blockchainRecord || {};
        return {
          id: log.id,
          action: log.action,
          dataHash: log.hash || blockchainRecord.dataHash || '',
          transactionHash: details.transactionHash || blockchainRecord.transactionHash || '',
          blockNumber: details.blockNumber || blockchainRecord.blockNumber || 0,
          network: details.network || blockchainRecord.network || 'unknown',
          timestamp: log.timestamp,
          metadata: details,
        };
      });

      // Apply additional filters
      let filteredRecords = records;
      if (options?.network) {
        filteredRecords = records.filter(r => r.network === options.network);
      }
      if (options?.recordType) {
        filteredRecords = records.filter(r => {
          const meta = r.metadata?.blockchainRecord;
          return meta?.recordType === options.recordType;
        });
      }

      return {
        records: filteredRecords,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      };
    } catch (error) {
      logger.error('[Blockchain] Error getting audit trail history', error);
      throw new AppError('Failed to get audit trail history', 500);
    }
  }

  /**
   * Get health status of all configured blockchain networks.
   */
  async getBlockchainHealth(): Promise<{
    ethereum: { connected: boolean; blockNumber: number | null; latency: number };
    polygon: { connected: boolean; blockNumber: number | null; latency: number };
    hyperledger: { connected: boolean; chaincodeName: string | null };
    registry: { connected: boolean; address: string | null; paused: boolean | null };
    wallet: { configured: boolean; address: string | null };
  }> {
    const health: any = {
      ethereum: { connected: false, blockNumber: null, latency: 0 },
      polygon: { connected: false, blockNumber: null, latency: 0 },
      hyperledger: { connected: false, chaincodeName: null },
      registry: { connected: false, address: null, paused: null },
      wallet: { configured: false, address: null },
    };

    // Check Ethereum
    if (this.ethereumProvider) {
      try {
        const start = Date.now();
        const blockNumber = await this.ethereumProvider.getBlockNumber();
        health.ethereum = { connected: true, blockNumber, latency: Date.now() - start };
      } catch {
        health.ethereum.connected = false;
      }
    }

    // Check Polygon
    if (this.polygonProvider) {
      try {
        const start = Date.now();
        const blockNumber = await this.polygonProvider.getBlockNumber();
        health.polygon = { connected: true, blockNumber, latency: Date.now() - start };
      } catch {
        health.polygon.connected = false;
      }
    }

    // Check Hyperledger
    if (this.hyperledgerContract) {
      health.hyperledger = {
        connected: true,
        chaincodeName: process.env.HYPERLEDGER_CHAINCODE_NAME || 'compliance',
      };
    }

    // Check Registry Contract
    if (this.registryContract) {
      try {
        const paused = await this.registryContract.paused();
        const address = await this.registryContract.getAddress();
        health.registry = { connected: true, address, paused };
      } catch {
        health.registry.connected = false;
      }
    }

    // Check Wallet
    if (this.wallet) {
      health.wallet = { configured: true, address: this.wallet.address };
    }

    return health;
  }
}

export default new BlockchainService();
