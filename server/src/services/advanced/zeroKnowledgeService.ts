/**
 * Zero-Knowledge Proof Service (zk-SNARKs)
 * Enables privacy-preserving data verification without revealing the actual data
 * Use cases: Prove compliance without exposing sensitive data, verify credentials without disclosure
 */

import * as snarkjs from 'snarkjs';
import crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import logger from '../../config/logger';
import prisma from '../../config/database';
import { AppError } from '../../middleware/errorHandler';

interface ZKProof {
  proof: any;
  publicSignals: string[];
}

interface ZKVerificationResult {
  isValid: boolean;
  proofId?: string;
  timestamp?: Date;
}

interface CircuitPaths {
  wasm: string;
  zkey: string;
  vkey: string;
}

/**
 * ZK-SNARK Service for privacy-preserving proofs
 *
 * Implemented circuits:
 * 1. compliance_check - Prove compliance status without revealing details
 * 2. credential_verification - Verify credentials without exposing them
 * 3. data_ownership - Prove ownership of data without revealing the data
 */
class ZeroKnowledgeService {
  private circuitsPath: string;
  private proofsPath: string;
  private compiledPath: string;
  private keysPath: string;
  private circuitPaths: Map<string, CircuitPaths> = new Map();

  constructor() {
    this.circuitsPath = path.join(__dirname, '../../zkp/circuits');
    this.proofsPath = path.join(__dirname, '../../zkp/proofs');
    this.compiledPath = path.join(__dirname, '../../zkp/compiled');
    this.keysPath = path.join(__dirname, '../../zkp/keys');
    this.ensureDirectories();
    this.loadCircuitPaths();
  }

  /**
   * Ensure ZKP directories exist
   */
  private ensureDirectories(): void {
    [
      this.circuitsPath,
      this.proofsPath,
      this.compiledPath,
      path.join(this.compiledPath, 'wasm'),
      path.join(this.compiledPath, 'r1cs'),
      this.keysPath,
      path.join(this.keysPath, 'proving'),
      path.join(this.keysPath, 'verification'),
    ].forEach((dir) => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  /**
   * Load circuit file paths
   */
  private loadCircuitPaths(): void {
    const circuits = ['compliance_check', 'credential_verification', 'data_ownership'];
    
    circuits.forEach((circuitName) => {
      const wasmPath = path.join(this.compiledPath, 'wasm', `${circuitName}.wasm`);
      const zkeyPath = path.join(this.keysPath, 'proving', `${circuitName}.zkey`);
      const vkeyPath = path.join(this.keysPath, 'verification', `${circuitName}.vkey`);

      // Check if files exist, if not, log warning but continue (for development)
      const filesExist = fs.existsSync(wasmPath) && fs.existsSync(zkeyPath) && fs.existsSync(vkeyPath);
      
      if (!filesExist && process.env.NODE_ENV === 'production') {
        logger.warn(`Circuit files not found for ${circuitName}. Run compilation and trusted setup.`);
      }

      this.circuitPaths.set(circuitName, {
        wasm: wasmPath,
        zkey: zkeyPath,
        vkey: vkeyPath,
      });
    });
  }

  /**
   * Generate a zero-knowledge proof for compliance status
   * Proves that data meets compliance requirements without revealing the data
   */
  async generateComplianceProof(
    organizationId: string,
    frameworkId: string,
    privateData: {
      controlsImplemented: number;
      totalControls: number;
      evidenceHash: string;
    }
  ): Promise<ZKProof> {
    try {
      // Create input for the circuit
      const input = {
        controlsImplemented: privateData.controlsImplemented,
        totalControls: privateData.totalControls,
        evidenceHash: this.hashToFieldElement(privateData.evidenceHash),
        threshold: 80, // 80% compliance threshold
      };

      // Generate real zk-SNARK proof
      const { proof, publicSignals } = await this.generateProofInternal(
        'compliance_check',
        input
      );

      // Store proof metadata
      await this.storeProofMetadata({
        organizationId,
        frameworkId,
        proofType: 'compliance_check',
        publicSignals,
      });

      logger.info(`Generated compliance ZK proof for org ${organizationId}`);

      return { proof, publicSignals };
    } catch (error) {
      logger.error('Error generating compliance proof', error);
      throw new AppError('Failed to generate zero-knowledge compliance proof', 500);
    }
  }

  /**
   * Verify a zero-knowledge compliance proof
   */
  async verifyComplianceProof(proof: ZKProof): Promise<ZKVerificationResult> {
    try {
      const isValid = await this.verifyProofInternal('compliance_check', proof);

      if (isValid) {
        // Extract public signals (compliance score without private data)
        const complianceScore = parseInt(proof.publicSignals[0]);

        logger.info(`Verified compliance proof: score=${complianceScore}`);

        return {
          isValid: true,
          proofId: this.generateProofId(proof),
          timestamp: new Date(),
        };
      }

      return { isValid: false };
    } catch (error) {
      logger.error('Error verifying compliance proof', error);
      return { isValid: false };
    }
  }

  /**
   * Generate proof of data ownership without revealing the data
   * Useful for proving you have certain data without exposing it
   */
  async generateOwnershipProof(
    userId: string,
    dataHash: string,
    privateKey: string
  ): Promise<ZKProof> {
    try {
      const input = {
        dataHash: this.hashToFieldElement(dataHash),
        privateKey: this.hashToFieldElement(privateKey),
        userId: this.hashToFieldElement(userId),
      };

      const { proof, publicSignals } = await this.generateProofInternal(
        'data_ownership',
        input
      );

      logger.info(`Generated ownership ZK proof for user ${userId}`);

      return { proof, publicSignals };
    } catch (error) {
      logger.error('Error generating ownership proof', error);
      throw new AppError('Failed to generate zero-knowledge ownership proof', 500);
    }
  }

  /**
   * Verify data ownership proof
   */
  async verifyOwnershipProof(proof: ZKProof, expectedUserId: string): Promise<boolean> {
    try {
      const isValid = await this.verifyProofInternal('data_ownership', proof);

      if (isValid) {
        // Verify the public signal matches expected user
        const proofUserId = proof.publicSignals[0];
        const expectedUserIdHash = this.hashToFieldElement(expectedUserId);

        return proofUserId === expectedUserIdHash.toString();
      }

      return false;
    } catch (error) {
      logger.error('Error verifying ownership proof', error);
      return false;
    }
  }

  /**
   * Generate credential verification proof
   * Prove you have valid credentials without revealing them
   */
  async generateCredentialProof(
    credentialData: {
      role: string;
      permissions: string[];
      expiryDate: Date;
    },
    secret: string
  ): Promise<ZKProof> {
    try {
      const permissionsHash = this.hashToFieldElement(
        credentialData.permissions.join(',')
      );

      const input = {
        roleLevel: this.roleToLevel(credentialData.role),
        permissionsHash,
        expiryTimestamp: Math.floor(credentialData.expiryDate.getTime() / 1000),
        currentTimestamp: Math.floor(Date.now() / 1000),
        secret: this.hashToFieldElement(secret),
      };

      const { proof, publicSignals } = await this.generateProofInternal(
        'credential_verification',
        input
      );

      logger.info('Generated credential verification ZK proof');

      return { proof, publicSignals };
    } catch (error) {
      logger.error('Error generating credential proof', error);
      throw new AppError('Failed to generate zero-knowledge credential proof', 500);
    }
  }

  /**
   * Verify credential proof
   */
  async verifyCredentialProof(proof: ZKProof, requiredLevel: number): Promise<boolean> {
    try {
      const isValid = await this.verifyProofInternal('credential_verification', proof);

      if (isValid) {
        const roleLevel = parseInt(proof.publicSignals[0]);
        return roleLevel >= requiredLevel;
      }

      return false;
    } catch (error) {
      logger.error('Error verifying credential proof', error);
      return false;
    }
  }

  /**
   * Internal: Generate proof using snarkjs with real circuits
   * Uses pre-compiled circuits and keys for production
   */
  private async generateProofInternal(
    circuitName: string,
    input: any
  ): Promise<ZKProof> {
    try {
      const circuitPaths = this.circuitPaths.get(circuitName);
      
      if (!circuitPaths) {
        throw new AppError(`Circuit paths not found for ${circuitName}`, 404);
      }

      // Check if circuit files exist
      const wasmExists = fs.existsSync(circuitPaths.wasm);
      const zkeyExists = fs.existsSync(circuitPaths.zkey);

      if (!wasmExists || !zkeyExists) {
        if (process.env.NODE_ENV === 'production') {
          throw new AppError(
            `Circuit files not found for ${circuitName}. Run compilation and trusted setup.`,
            404
          );
        } else {
          // In development, use simulated proof if files don't exist
          logger.warn(
            `Circuit files not found for ${circuitName}, using simulated proof (development mode)`
          );
          return this.createSimulatedProof(circuitName, input);
        }
      }

      // Load circuit WASM and proving key
      const wasmBuffer = fs.readFileSync(circuitPaths.wasm);
      const zkeyBuffer = fs.readFileSync(circuitPaths.zkey);

      // Generate zk-SNARK proof using Groth16
      // snarkjs.groth16.fullProve handles witness generation internally
      // It accepts input object, WASM buffer, and zkey buffer
      const { proof, publicSignals } = await snarkjs.groth16.fullProve(
        input,
        wasmBuffer.toString('base64'),
        zkeyBuffer.toString('base64')
      );

      logger.info(`Generated real zk-SNARK proof for ${circuitName}`);

      return { proof, publicSignals: publicSignals.map((s: any) => s.toString()) };
    } catch (error) {
      logger.error(`Error in generateProofInternal for ${circuitName}`, error);
      
      // In development, fallback to simulated proof
      if (process.env.NODE_ENV !== 'production') {
        logger.warn(`Falling back to simulated proof for ${circuitName}`);
        return this.createSimulatedProof(circuitName, input);
      }
      
      throw error;
    }
  }

  /**
   * Internal: Verify proof using snarkjs with real verification keys
   */
  private async verifyProofInternal(circuitName: string, proof: ZKProof): Promise<boolean> {
    try {
      const circuitPaths = this.circuitPaths.get(circuitName);
      
      if (!circuitPaths) {
        throw new AppError(`Circuit paths not found for ${circuitName}`, 404);
      }

      // Check if verification key exists
      const vkeyExists = fs.existsSync(circuitPaths.vkey);

      if (!vkeyExists) {
        if (process.env.NODE_ENV === 'production') {
          throw new AppError(
            `Verification key not found for ${circuitName}. Run trusted setup.`,
            404
          );
        } else {
          // In development, validate proof structure
          logger.warn(
            `Verification key not found for ${circuitName}, validating structure (development mode)`
          );
          return this.validateProofStructure(proof);
        }
      }

      // Load verification key
      const vkey = JSON.parse(fs.readFileSync(circuitPaths.vkey, 'utf-8'));

      // Verify the proof using Groth16
      const isValid = await snarkjs.groth16.verify(
        vkey,
        proof.publicSignals,
        proof.proof
      );

      logger.info(`Verified zk-SNARK proof for ${circuitName}: ${isValid ? 'VALID' : 'INVALID'}`);

      return isValid;
    } catch (error) {
      logger.error(`Error in verifyProofInternal for ${circuitName}`, error);
      
      // In development, validate proof structure
      if (process.env.NODE_ENV !== 'production') {
        logger.warn(`Falling back to structure validation for ${circuitName}`);
        return this.validateProofStructure(proof);
      }
      
      return false;
    }
  }

  /**
   * Create development-mode zk-SNARK proof (development only)
   * Generates deterministic, input-derived proofs using cryptographic hashing.
   * Proofs are unique to the input data and structurally valid for Groth16 over bn128.
   * WARNING: These are NOT cryptographically sound ZK proofs - they are structurally
   * correct development placeholders. In production, real circuit compilation and
   * trusted setup are required.
   */
  private createSimulatedProof(circuitName: string, input: any): ZKProof {
    if (process.env.NODE_ENV === 'production') {
      throw new AppError(
        'Development-mode proofs are not allowed in production. ' +
        'Compile circuits and run trusted setup to generate real proving/verification keys.',
        403
      );
    }

    // bn128 curve order (also known as alt_bn128 / BN254)
    // All field elements must be reduced modulo this prime
    const BN128_FIELD_ORDER = BigInt(
      '21888242871839275222246405745257275088548364400416034343698204186575808495617'
    );

    // Derive a deterministic field element from a seed using HMAC-SHA256.
    // Each element is unique to the (circuitName, input, index) tuple.
    const inputSeed = JSON.stringify({ circuit: circuitName, input });
    const deriveFieldElement = (index: number): string => {
      const hmac = crypto.createHmac('sha256', `zkp-dev-${index}`);
      hmac.update(inputSeed);
      const hash = hmac.digest('hex');
      const value = BigInt('0x' + hash) % BN128_FIELD_ORDER;
      return value.toString();
    };

    // Derive curve point representations for Groth16 proof components.
    // In a full implementation, these are elliptic curve points on bn128.
    // Here we derive deterministic hex values from the input hash to produce
    // structurally valid and input-unique proof elements.
    const deriveG1Point = (baseIndex: number): string[] => {
      // G1 points on bn128 have 3 coordinates (x, y, z in projective form)
      return [
        deriveFieldElement(baseIndex),
        deriveFieldElement(baseIndex + 1),
        '1', // z-coordinate = 1 for affine representation
      ];
    };

    const deriveG2Point = (baseIndex: number): string[][] => {
      // G2 points on bn128 have 3 pairs of coordinates (extension field Fp2)
      return [
        [deriveFieldElement(baseIndex), deriveFieldElement(baseIndex + 1)],
        [deriveFieldElement(baseIndex + 2), deriveFieldElement(baseIndex + 3)],
        ['1', '0'], // z-coordinate = (1, 0) for affine representation in Fp2
      ];
    };

    // Groth16 proof structure: pi_a (G1), pi_b (G2), pi_c (G1)
    const proof = {
      pi_a: deriveG1Point(0),
      pi_b: deriveG2Point(10),
      pi_c: deriveG1Point(20),
      protocol: 'groth16',
      curve: 'bn128',
      _devMode: true,
      _warning: 'DEVELOPMENT ONLY - This proof was generated without real circuits and is not cryptographically valid',
    };

    // Public signals (outputs visible to verifier)
    const publicSignals = this.extractPublicSignals(circuitName, input);

    logger.warn(
      `[ZKP] Generated DEVELOPMENT-ONLY proof for circuit "${circuitName}". ` +
      `This proof is deterministic and input-derived but NOT cryptographically valid. ` +
      `Deploy compiled circuits for production use.`
    );

    return { proof, publicSignals };
  }

  /**
   * Extract public signals from input based on circuit type
   */
  private extractPublicSignals(circuitName: string, input: any): string[] {
    switch (circuitName) {
      case 'compliance_check': {
        // Public output: compliance score (0-100)
        const score = Math.floor(
          (input.controlsImplemented / input.totalControls) * 100
        );
        return [score.toString()];
      }

      case 'data_ownership':
        // Public output: user ID hash
        return [input.userId.toString()];

      case 'credential_verification':
        // Public output: role level
        return [input.roleLevel.toString()];

      default:
        return [];
    }
  }

  /**
   * Validate proof structure
   */
  private validateProofStructure(proof: ZKProof): boolean {
    if (!proof.proof || !proof.publicSignals) {
      return false;
    }

    const p = proof.proof;
    if (!p.pi_a || !p.pi_b || !p.pi_c) {
      return false;
    }

    // Validate Groth16 structure
    if (p.pi_a.length !== 3 || p.pi_c.length !== 3) {
      return false;
    }

    if (p.pi_b.length !== 3 || p.pi_b[0].length !== 2) {
      return false;
    }

    return true;
  }

  /**
   * Convert hash string to field element
   */
  private hashToFieldElement(data: string): bigint {
    const hash = crypto.createHash('sha256').update(data).digest();
    // Convert to bigint and mod by bn128 field size
    const fieldSize = BigInt(
      '21888242871839275222246405745257275088548364400416034343698204186575808495617'
    );
    return BigInt('0x' + hash.toString('hex')) % fieldSize;
  }

  /**
   * Convert role to numeric level
   */
  private roleToLevel(role: string): number {
    const levels: { [key: string]: number } = {
      viewer: 1,
      editor: 2,
      admin: 3,
    };
    return levels[role] || 0;
  }

  /**
   * Generate unique proof ID
   */
  private generateProofId(proof: ZKProof): string {
    const proofString = JSON.stringify(proof.proof);
    return crypto.createHash('sha256').update(proofString).digest('hex');
  }

  /**
   * Store proof metadata in database
   */
  private async storeProofMetadata(metadata: {
    organizationId: string;
    frameworkId: string;
    proofType: string;
    publicSignals: string[];
  }): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          action: `ZK Proof Generated: ${metadata.proofType}`,
          organizationId: metadata.organizationId,
          hash: crypto.randomBytes(32).toString('hex'),
          details: JSON.stringify({
            proofType: metadata.proofType,
            publicSignals: metadata.publicSignals,
            frameworkId: metadata.frameworkId,
          }),
        },
      });
    } catch (error) {
      logger.error('Error storing proof metadata', error);
    }
  }

  /**
   * Get all proofs for an organization
   */
  async getAllProofs(organizationId: string): Promise<any[]> {
    try {
      const logs = await prisma.auditLog.findMany({
        where: {
          organizationId,
          action: {
            startsWith: 'ZK Proof Generated:',
          },
        },
        orderBy: { timestamp: 'desc' },
        take: 100, // Limit to recent 100 proofs
      });

      return logs.map(log => {
        try {
          const details = typeof log.details === 'string' 
            ? JSON.parse(log.details) 
            : log.details || {};
          return {
            id: log.id,
            proofType: details.proofType,
            frameworkId: details.frameworkId,
            publicSignals: details.publicSignals,
            createdAt: log.timestamp,
            action: log.action,
          };
        } catch (e: any) {
          logger.error('Error parsing proof details', { error: e.message, logId: log.id });
          return {
            id: log.id,
            proofType: 'unknown',
            frameworkId: '',
            publicSignals: [],
            createdAt: log.timestamp,
            action: log.action,
          };
        }
      });
    } catch (error) {
      logger.error('Error getting all proofs', error);
      return [];
    }
  }
}

export default new ZeroKnowledgeService();
