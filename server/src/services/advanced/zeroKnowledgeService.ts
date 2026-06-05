/**
 * Zero-Knowledge Proof Service (zk-SNARKs)
 * Enables privacy-preserving data verification without revealing the actual data
 * Use cases: Prove compliance without exposing sensitive data, verify credentials without disclosure
 */

import * as snarkjs from 'snarkjs';
import { buildPoseidon, type Poseidon } from 'circomlibjs';
import crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import logger from '../../config/logger';
import prisma from '../../config/database';
import { AppError } from '../../middleware/errorHandler';

// BN254 / alt_bn128 scalar field order. Every field element fed to a circuit
// (or compared against a public signal) must be reduced modulo this prime.
const BN128_FIELD_ORDER = BigInt(
  '21888242871839275222246405745257275088548364400416034343698204186575808495617'
);

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
  private poseidonPromise: Promise<Poseidon> | null = null;

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
   * Whether development-only simulated proofs are permitted. Defaults to OFF.
   * Must be explicitly opted into via ZK_ALLOW_SIMULATED='true' AND must never
   * be honored in production. This intentionally does NOT key off NODE_ENV so
   * that staging/test environments fail closed unless the operator opts in.
   */
  private simulatedProofsAllowed(): boolean {
    return (
      process.env.NODE_ENV !== 'production' &&
      process.env.ZK_ALLOW_SIMULATED === 'true'
    );
  }

  /**
   * Lazily build and cache the Poseidon hasher (same hash the circuits use).
   */
  private async getPoseidon(): Promise<Poseidon> {
    if (!this.poseidonPromise) {
      this.poseidonPromise = buildPoseidon();
    }
    return this.poseidonPromise;
  }

  /**
   * Compute Poseidon(inputs) and return the result as a decimal field-element
   * string, matching the value snarkjs emits in publicSignals.
   */
  private async poseidonHash(inputs: Array<bigint | number | string>): Promise<string> {
    const poseidon = await this.getPoseidon();
    const normalized = inputs.map((v) => {
      const big = typeof v === 'bigint' ? v : BigInt(v);
      return ((big % BN128_FIELD_ORDER) + BN128_FIELD_ORDER) % BN128_FIELD_ORDER;
    });
    const out = poseidon(normalized);
    return poseidon.F.toObject(out).toString();
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
      // Derive the salt and organization commitment as field elements, then
      // compute the evidence commitment with the SAME Poseidon the circuit
      // enforces: Poseidon([controlsImplemented, totalControls, evidenceSalt,
      // organizationCommit]) === evidenceCommitment.
      const evidenceSalt = this.hashToFieldElement(privateData.evidenceHash);
      const organizationCommit = this.hashToFieldElement(organizationId);
      const evidenceCommitment = await this.poseidonHash([
        privateData.controlsImplemented,
        privateData.totalControls,
        evidenceSalt,
        organizationCommit,
      ]);

      // Witness input keyed to the circuit's declared signal names.
      const input = {
        controlsImplemented: privateData.controlsImplemented,
        totalControls: privateData.totalControls,
        evidenceSalt: evidenceSalt.toString(),
        threshold: 80, // 80% compliance threshold
        organizationCommit: organizationCommit.toString(),
        evidenceCommitment,
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
      if (this.carriesDevMarker(proof)) {
        logger.warn('Rejected compliance proof carrying a development marker');
        return { isValid: false };
      }

      const isValid = await this.verifyProofInternal('compliance_check', proof);

      if (!isValid) {
        return { isValid: false };
      }

      // publicSignals ordering for compliance_check:
      //   [0] meetsThreshold (circuit OUTPUT)
      //   [1] threshold, [2] organizationCommit, [3] evidenceCommitment
      // The cryptographic verify only proves the public signals are consistent
      // with SOME witness; it does not assert the claim. The decision must
      // require the boolean output to be 1.
      const meetsThreshold = proof.publicSignals[0];
      if (meetsThreshold !== '1') {
        logger.info('Compliance proof verified but threshold not met (meetsThreshold=0)');
        return { isValid: false };
      }

      const threshold = proof.publicSignals[1];
      logger.info(`Verified compliance proof: meetsThreshold=1, threshold=${threshold}`);

      return {
        isValid: true,
        proofId: this.generateProofId(proof),
        timestamp: new Date(),
      };
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
      // Map service inputs to the circuit's declared signals.
      //   sk        (private) <- privateKey
      //   userIdSalt(public)  <- field-element of userId (anchors identity commit)
      //   dataHash  (public)  <- field-element of the data hash
      //   dataSalt  (public)  <- per-claim randomness
      //   claimContext(public)<- context tag (here: the user identity anchor)
      const sk = this.hashToFieldElement(privateKey);
      const userIdSalt = this.hashToFieldElement(userId);
      const dataHashField = this.hashToFieldElement(dataHash);
      const dataSalt = BigInt('0x' + crypto.randomBytes(31).toString('hex')) % BN128_FIELD_ORDER;
      const claimContext = userIdSalt;

      // Compute the three Poseidon commitments exactly as the circuit enforces.
      const ownerCommitment = await this.poseidonHash([sk, userIdSalt]);
      const dataCommitment = await this.poseidonHash([sk, dataHashField, dataSalt]);
      const nullifier = await this.poseidonHash([sk, claimContext]);

      const input = {
        sk: sk.toString(),
        userIdSalt: userIdSalt.toString(),
        dataHash: dataHashField.toString(),
        dataSalt: dataSalt.toString(),
        ownerCommitment,
        dataCommitment,
        claimContext: claimContext.toString(),
        nullifier,
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
      if (this.carriesDevMarker(proof)) {
        logger.warn('Rejected ownership proof carrying a development marker');
        return false;
      }

      const isValid = await this.verifyProofInternal('data_ownership', proof);
      if (!isValid) {
        return false;
      }

      // publicSignals ordering for data_ownership:
      //   [0] ownershipVerified (circuit OUTPUT)
      //   [1] userIdSalt, [2] dataHash, [3] dataSalt, [4] ownerCommitment,
      //   [5] dataCommitment, [6] claimContext, [7] nullifier
      const ownershipVerified = proof.publicSignals[0];
      if (ownershipVerified !== '1') {
        return false;
      }

      // Bind the proof to the expected user via the userIdSalt public input,
      // which is derived from the user identity at generation time.
      const proofUserIdSalt = proof.publicSignals[1];
      const expectedUserIdHash = this.hashToFieldElement(expectedUserId);

      return proofUserIdSalt === expectedUserIdHash.toString();
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
    secret: string,
    requiredRoleLevel?: number
  ): Promise<ZKProof> {
    try {
      const permissionsHash = this.hashToFieldElement(
        credentialData.permissions.join(',')
      );
      const roleLevel = this.roleToLevel(credentialData.role);
      // When the caller does not assert a specific minimum, the proof attests
      // the holder's actual role level (roleLevel >= roleLevel always holds),
      // so verifiers can confirm the credential is at least that tier.
      const assertedRoleLevel =
        requiredRoleLevel !== undefined ? requiredRoleLevel : roleLevel;
      const expiryTimestamp = Math.floor(credentialData.expiryDate.getTime() / 1000);
      // Treat the credential as issued now; the circuit asserts
      // issuedTimestamp <= currentTimestamp <= expiryTimestamp.
      const currentTimestamp = Math.floor(Date.now() / 1000);
      const issuedTimestamp = currentTimestamp;
      const subjectSecret = this.hashToFieldElement(secret);

      // Compute the credential commitment and nullifier with the SAME Poseidon
      // the circuit enforces:
      //   credentialCommitment = Poseidon([roleLevel, permissionsHash,
      //       issuedTimestamp, expiryTimestamp, subjectSecret])
      //   nullifier = Poseidon([subjectSecret, currentTimestamp])
      const credentialCommitment = await this.poseidonHash([
        roleLevel,
        permissionsHash,
        issuedTimestamp,
        expiryTimestamp,
        subjectSecret,
      ]);
      const nullifier = await this.poseidonHash([subjectSecret, currentTimestamp]);

      // Witness input keyed to the circuit's declared signal names.
      const input = {
        roleLevel,
        permissionsHash: permissionsHash.toString(),
        issuedTimestamp,
        expiryTimestamp,
        subjectSecret: subjectSecret.toString(),
        currentTimestamp,
        requiredRoleLevel: assertedRoleLevel,
        credentialCommitment,
        nullifier,
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
      if (this.carriesDevMarker(proof)) {
        logger.warn('Rejected credential proof carrying a development marker');
        return false;
      }

      const isValid = await this.verifyProofInternal('credential_verification', proof);
      if (!isValid) {
        return false;
      }

      // publicSignals ordering for credential_verification:
      //   [0] isValid (circuit OUTPUT)
      //   [1] currentTimestamp, [2] requiredRoleLevel,
      //   [3] credentialCommitment, [4] nullifier
      // The circuit's isValid output is 1 only when roleLevel >=
      // requiredRoleLevel AND the credential is unexpired/issued. The decision
      // must require that boolean to be 1.
      const isValidSignal = proof.publicSignals[0];
      if (isValidSignal !== '1') {
        return false;
      }

      // The role threshold the proof actually attests to is the public
      // requiredRoleLevel signal; it must be at least the caller's requirement.
      const provedRequiredLevel = parseInt(proof.publicSignals[2], 10);
      return Number.isFinite(provedRequiredLevel) && provedRequiredLevel >= requiredLevel;
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
        if (this.simulatedProofsAllowed()) {
          // Simulated proofs are an explicit, opt-in development aid only.
          logger.warn(
            `Circuit files not found for ${circuitName}; ZK_ALLOW_SIMULATED is set, ` +
            `using a development-only simulated proof.`
          );
          return this.createSimulatedProof(circuitName, input);
        }
        throw new AppError(
          `Circuit files not found for ${circuitName}. Run compilation and trusted setup.`,
          404
        );
      }

      // Generate zk-SNARK proof using Groth16.
      // snarkjs.groth16.fullProve handles witness generation internally and
      // expects the WASM and zkey as file paths (or Uint8Array buffers) — NOT
      // base64-encoded strings, which it would treat as bogus file paths.
      const { proof, publicSignals } = await snarkjs.groth16.fullProve(
        input,
        circuitPaths.wasm,
        circuitPaths.zkey
      );

      logger.info(`Generated real zk-SNARK proof for ${circuitName}`);

      return { proof, publicSignals: publicSignals.map((s: any) => s.toString()) };
    } catch (error) {
      logger.error(`Error in generateProofInternal for ${circuitName}`, error);

      // Fall back to a simulated proof only when explicitly opted in; never by
      // default, so non-production environments fail closed.
      if (this.simulatedProofsAllowed()) {
        logger.warn(`Falling back to development-only simulated proof for ${circuitName}`);
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

      // Reject any proof carrying a development/simulated marker. These are
      // never cryptographically sound and must not pass verification.
      if (this.carriesDevMarker(proof)) {
        logger.warn(`Rejected ${circuitName} proof carrying a development marker`);
        return false;
      }

      // Check if verification key exists. A missing key means verification
      // cannot be performed cryptographically; fail closed (reject) rather than
      // accepting based on proof shape.
      const vkeyExists = fs.existsSync(circuitPaths.vkey);

      if (!vkeyExists) {
        logger.error(
          `Verification key not found for ${circuitName}. Run trusted setup. Rejecting proof.`
        );
        return false;
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
      // A verification error means the proof could not be cryptographically
      // confirmed; fail closed.
      logger.error(`Error in verifyProofInternal for ${circuitName}`, error);
      return false;
    }
  }

  /**
   * Whether a proof object carries a development/simulated marker. Such proofs
   * are forged placeholders and must always be rejected by verification.
   */
  private carriesDevMarker(proof: ZKProof): boolean {
    const p = proof?.proof;
    if (!p || typeof p !== 'object') {
      return false;
    }
    return p._devMode === true || p._simulated === true;
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
    if (!this.simulatedProofsAllowed()) {
      throw new AppError(
        'Development-mode proofs are disabled. They require ZK_ALLOW_SIMULATED=true ' +
        'and a non-production NODE_ENV. Compile circuits and run trusted setup to ' +
        'generate real proving/verification keys.',
        403
      );
    }

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
      _simulated: true,
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
   * Extract public signals from input based on circuit type.
   * Mirrors snarkjs ordering: [circuit output, ...declared public inputs].
   */
  private extractPublicSignals(circuitName: string, input: any): string[] {
    switch (circuitName) {
      case 'compliance_check': {
        // [meetsThreshold, threshold, organizationCommit, evidenceCommitment]
        const meetsThreshold =
          input.controlsImplemented * 100 >= input.threshold * input.totalControls
            ? '1'
            : '0';
        return [
          meetsThreshold,
          input.threshold.toString(),
          input.organizationCommit.toString(),
          input.evidenceCommitment.toString(),
        ];
      }

      case 'data_ownership':
        // [ownershipVerified, userIdSalt, dataHash, dataSalt,
        //  ownerCommitment, dataCommitment, claimContext, nullifier]
        return [
          '1',
          input.userIdSalt.toString(),
          input.dataHash.toString(),
          input.dataSalt.toString(),
          input.ownerCommitment.toString(),
          input.dataCommitment.toString(),
          input.claimContext.toString(),
          input.nullifier.toString(),
        ];

      case 'credential_verification': {
        // [isValid, currentTimestamp, requiredRoleLevel,
        //  credentialCommitment, nullifier]
        const isValid =
          input.roleLevel >= input.requiredRoleLevel &&
          input.expiryTimestamp >= input.currentTimestamp &&
          input.issuedTimestamp <= input.currentTimestamp &&
          input.issuedTimestamp <= input.expiryTimestamp
            ? '1'
            : '0';
        return [
          isValid,
          input.currentTimestamp.toString(),
          input.requiredRoleLevel.toString(),
          input.credentialCommitment.toString(),
          input.nullifier.toString(),
        ];
      }

      default:
        return [];
    }
  }

  /**
   * Convert hash string to field element
   */
  private hashToFieldElement(data: string): bigint {
    const hash = crypto.createHash('sha256').update(data).digest();
    // Convert to bigint and reduce modulo the bn128 field order
    return BigInt('0x' + hash.toString('hex')) % BN128_FIELD_ORDER;
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
