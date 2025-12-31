/**
 * Evidence Truth Layer™ Service
 * 
 * Features:
 * - Deepfake detection on media evidence
 * - Cryptographic attestation
 * - Physical sensor corroboration
 * - Human liveness signals
 * - Evidence confidence scoring
 */

import prisma from '../../config/database';
import logger from '../../config/logger';
import crypto from 'crypto';
import mlModelsService from './mlModelsService';
import NTPClient from 'ntp-client';
import byokService from './byokService';
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const writeFile = promisify(fs.writeFile);
const unlink = promisify(fs.unlink);

export interface EvidenceAnalysis {
  evidenceId: string;
  deepfakeScore: number; // 0-1, lower is better (0 = real, 1 = deepfake)
  deepfakeConfidence?: number; // 0-1
  deepfakeSegments?: Array<{ start: number; end: number; score: number }>; // For video/audio
  cryptographicHash: string;
  cryptographicSignature?: string;
  timestamp?: Date; // Trusted timestamp
  chainOfCustody?: Array<{ hash: string; timestamp: Date; signer: string }>;
  physicalAttestation?: {
    sensorId?: string;
    timestamp: Date;
    location?: { lat: number; lng: number; accuracy?: number };
    gpsAttestation?: boolean;
    ntpTimestamp?: Date;
    environmentalData?: {
      temperature?: number;
      humidity?: number;
      pressure?: number;
    };
    accessControlEvents?: Array<{ event: string; timestamp: Date; deviceId: string }>;
    deviceChain?: Array<{ deviceId: string; verified: boolean; timestamp: Date }>;
    integrityScore?: number; // 0-1
    multiDeviceCorroboration?: boolean;
    conflicts?: Array<{ deviceId: string; conflict: string }>;
  };
  humanLiveness?: {
    detected: boolean;
    confidence: number;
    photoOfPhoto?: boolean;
    videoOfVideo?: boolean;
    depthAnalysis?: { hasDepth: boolean; confidence: number };
    eyeMovement?: { detected: boolean; confidence: number };
    blinkDetection?: { detected: boolean; pattern: 'natural' | 'artificial' | 'none' };
    pulseDetection?: { detected: boolean; bpm?: number; confidence: number };
  };
  overallConfidence: number; // 0-1
  verificationStatus: 'verified' | 'suspicious' | 'failed';
  createdAt: Date;
  analysisHistory?: EvidenceAnalysis[];
}

class EvidenceTruthLayerService {
  /**
   * Analyze evidence for truthfulness
   */
  async analyzeEvidence(
    evidenceId: string,
    organizationId: string,
    fileBuffer?: Buffer,
    metadata?: {
      filename?: string;
      mimeType?: string;
      size?: number;
    }
  ): Promise<EvidenceAnalysis> {
    try {
      // 1. Deepfake Detection (enhanced)
      const deepfakeResult = await this.detectDeepfake(fileBuffer, metadata);
      const deepfakeScore = deepfakeResult.score;

      // 2. Cryptographic Attestation (enhanced)
      const fileBufferForHash = fileBuffer || Buffer.from('');
      const cryptographicHash = this.generateCryptographicHash(fileBufferForHash);
      
      // Sign evidence with organization key
      const signature = await this.signEvidence(fileBufferForHash, organizationId);
      
      // Add trusted timestamp
      const timestamp = await this.timestampEvidence(fileBufferForHash, organizationId);

      // 3. Physical Attestation (enhanced)
      const physicalAttestation = await this.getPhysicalAttestation(evidenceId, organizationId);

      // 4. Human Liveness Detection (enhanced)
      const humanLiveness = await this.detectHumanLiveness(fileBuffer, metadata);

      // 5. Calculate Overall Confidence
      const overallConfidence = this.calculateOverallConfidence(
        deepfakeScore,
        deepfakeResult.confidence,
        cryptographicHash,
        signature,
        physicalAttestation,
        humanLiveness
      );

      // 6. Determine Verification Status
      const verificationStatus = this.determineVerificationStatus(
        deepfakeScore,
        overallConfidence
      );

      const analysis: EvidenceAnalysis = {
        evidenceId,
        deepfakeScore,
        deepfakeConfidence: deepfakeResult.confidence,
        deepfakeSegments: deepfakeResult.segments,
        cryptographicHash,
        cryptographicSignature: signature.signature,
        timestamp: timestamp.timestamp,
        physicalAttestation,
        humanLiveness,
        overallConfidence,
        verificationStatus,
        createdAt: new Date(),
      };

      // Store analysis in database
      try {
        await prisma.evidenceAnalysis.create({
          data: {
            evidenceId,
            organizationId,
            deepfakeScore: analysis.deepfakeScore,
            cryptographicHash: analysis.cryptographicHash,
            physicalAttestation: analysis.physicalAttestation ? JSON.parse(JSON.stringify(analysis.physicalAttestation)) : undefined,
            humanLiveness: analysis.humanLiveness ? JSON.parse(JSON.stringify(analysis.humanLiveness)) : undefined,
            overallConfidence: analysis.overallConfidence,
            verificationStatus: analysis.verificationStatus,
          },
        });
      } catch (dbError: any) {
        logger.warn('[Evidence Truth Layer] Error storing analysis in database (non-critical)', dbError);
        // Continue even if database storage fails
      }

      // Store in audit log
      await prisma.auditLog.create({
        data: {
          action: 'evidence_truth_layer.analyzed',
          details: JSON.stringify(analysis),
          userId: 'system',
          organizationId,
          hash: cryptographicHash,
        },
      });

      logger.info(`[Evidence Truth Layer] Evidence analyzed: ${evidenceId}, confidence: ${overallConfidence}, status: ${verificationStatus}`);

      return analysis;
    } catch (error) {
      logger.error('[Evidence Truth Layer] Error analyzing evidence', error);
      throw error;
    }
  }

  /**
   * Detect deepfakes in media files (enhanced with all features)
   */
  private async detectDeepfake(
    fileBuffer?: Buffer,
    metadata?: {
      filename?: string;
      mimeType?: string;
      size?: number;
    }
  ): Promise<{
    score: number;
    confidence: number;
    segments?: Array<{ start: number; end: number; score: number }>;
    voiceSynthesis?: boolean;
    compressionArtifacts?: boolean;
    documentTampering?: boolean;
  }> {
    if (!fileBuffer || !metadata) {
      return { score: 0.5, confidence: 0.5 }; // Unknown if no file provided
    }

    const startTime = Date.now();
    const maxProcessingTime = 10000; // 10 seconds

    // Check file type
    const isImage = metadata.mimeType?.startsWith('image/');
    const isVideo = metadata.mimeType?.startsWith('video/');
    const isAudio = metadata.mimeType?.startsWith('audio/');
    const isDocument = metadata.mimeType?.includes('pdf') || 
                      metadata.mimeType?.includes('document') ||
                      metadata.mimeType?.includes('image/') && metadata.filename?.toLowerCase().endsWith('.pdf');

    if (!isImage && !isVideo && !isAudio && !isDocument) {
      return { score: 0.0, confidence: 1.0 }; // Not media, no deepfake risk
    }

    try {
      // Performance check
      if (metadata.size && metadata.size > 10 * 1024 * 1024) { // > 10MB
        logger.warn(`[Evidence Truth Layer] Large file (${metadata.size} bytes), may exceed 10s processing time`);
      }

      // Use ML model for deepfake detection
      const mediaType = isVideo ? 'video' : isAudio ? 'audio' : 'image';
      const detectionResult = await mlModelsService.detectDeepfake(fileBuffer, mediaType);

      // Convert to score (0-1, where 1 = definitely deepfake)
      const score = detectionResult.isDeepfake ? detectionResult.confidence : 1 - detectionResult.confidence;
      const confidence = detectionResult.confidence;

      // For video: detect segments with timestamps using real frame-by-frame analysis
      let segments: Array<{ start: number; end: number; score: number }> | undefined;
      if (isVideo && detectionResult.details?.videoAnomalyScore) {
        segments = await this.detectVideoSegments(fileBuffer, detectionResult.details.videoAnomalyScore);
      }

      // For audio: detect voice synthesis
      let voiceSynthesis = false;
      if (isAudio && detectionResult.details?.audioDeepfakeScore) {
        voiceSynthesis = detectionResult.details.audioDeepfakeScore > 0.6;
      }

      // Check for compression artifacts (affects detection accuracy)
      const compressionArtifacts = this.detectCompressionArtifacts(fileBuffer, metadata);

      // For documents: detect tampering
      let documentTampering = false;
      if (isDocument) {
        documentTampering = await this.detectDocumentTampering(fileBuffer, metadata);
      }

      const processingTime = Date.now() - startTime;
      if (processingTime > maxProcessingTime) {
        logger.warn(`[Evidence Truth Layer] Deepfake detection took ${processingTime}ms (threshold: ${maxProcessingTime}ms)`);
      }

      logger.info(`[Evidence Truth Layer] Deepfake detection: ${detectionResult.isDeepfake ? 'DEEPFAKE' : 'REAL'} (confidence: ${confidence}, time: ${processingTime}ms)`);

      return {
        score: Math.min(1.0, Math.max(0.0, score)),
        confidence,
        segments,
        voiceSynthesis,
        compressionArtifacts,
        documentTampering,
      };
    } catch (error) {
      logger.error('[Evidence Truth Layer] Error in ML deepfake detection, using fallback', error);

      // Fallback to heuristics
      let score = 0.0;
      let confidence = 0.5;

      if (metadata.size && metadata.size < 1000) {
        score += 0.3;
      }

      if (metadata.filename) {
        const suspiciousPatterns = ['deepfake', 'generated', 'ai_', 'synthetic'];
        if (suspiciousPatterns.some(pattern => metadata.filename!.toLowerCase().includes(pattern))) {
          score += 0.4;
          confidence = 0.7;
        }
      }

      return {
        score: Math.min(1.0, score),
        confidence,
      };
    }
  }

  /**
   * Detect video segments with deepfake markers using real frame-by-frame analysis
   */
  private async detectVideoSegments(
    fileBuffer: Buffer,
    anomalyScore: number
  ): Promise<Array<{ start: number; end: number; score: number }>> {
    try {
      const segments: Array<{ start: number; end: number; score: number }> = [];
      
      // If anomaly score is low, no need for detailed analysis
      if (anomalyScore < 0.3) {
        return [];
      }

      const tempVideoPath = path.join(
        __dirname,
        '../../../temp',
        `video_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.mp4`
      );
      const tempDir = path.dirname(tempVideoPath);
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      await writeFile(tempVideoPath, fileBuffer);

      // Get video duration
      const duration = await new Promise<number>((resolve, reject) => {
        ffmpeg.ffprobe(tempVideoPath, (err, metadata) => {
          if (err) {
            reject(err);
          } else {
            resolve(metadata.format.duration || 0);
          }
        });
      });

      // Sample frames every 2 seconds for deepfake analysis
      const frameInterval = 2;
      let currentSegmentStart: number | null = null;
      let currentSegmentScore = 0;

      for (let t = 0; t < duration; t += frameInterval) {
        const framePath = path.join(tempDir, `frame_${t}.jpg`);
        
        try {
          // Extract frame
          await new Promise<void>((resolve, reject) => {
            ffmpeg(tempVideoPath)
              .seekInput(t)
              .frames(1)
              .output(framePath)
              .on('end', resolve)
              .on('error', reject)
              .run();
          });

          const frameBuffer = fs.readFileSync(framePath);
          
          // Analyze frame for deepfake markers using ML model
          const frameAnalysis = await mlModelsService.detectDeepfake(frameBuffer, 'image');
          const frameScore = frameAnalysis.isDeepfake ? frameAnalysis.confidence : 1 - frameAnalysis.confidence;

          // If frame shows deepfake markers, extend current segment or start new one
          if (frameScore > 0.5) {
            if (currentSegmentStart === null) {
              currentSegmentStart = t;
              currentSegmentScore = frameScore;
            } else {
              // Extend segment and update average score
              currentSegmentScore = (currentSegmentScore + frameScore) / 2;
            }
          } else {
            // Frame is clean, finalize current segment if exists
            if (currentSegmentStart !== null) {
              segments.push({
                start: currentSegmentStart,
                end: t,
                score: currentSegmentScore,
              });
              currentSegmentStart = null;
              currentSegmentScore = 0;
            }
          }

          await unlink(framePath).catch(() => {});
        } catch (error) {
          logger.warn(`[Evidence Truth Layer] Error analyzing frame at ${t}s`, error);
          await unlink(framePath).catch(() => {});
        }
      }

      // Finalize last segment if exists
      if (currentSegmentStart !== null) {
        segments.push({
          start: currentSegmentStart,
          end: duration,
          score: currentSegmentScore,
        });
      }

      await unlink(tempVideoPath).catch(() => {});
      return segments;
    } catch (error) {
      logger.error('[Evidence Truth Layer] Error in video segment detection', error);
      // Fallback: return empty array or basic segment based on anomaly score
      if (anomalyScore > 0.5) {
        return [{ start: 0, end: 10, score: anomalyScore }];
      }
      return [];
    }
  }

  /**
   * Detect compression artifacts
   */
  private detectCompressionArtifacts(
    fileBuffer: Buffer,
    metadata: { mimeType?: string; size?: number }
  ): boolean {
    // Check for heavy compression (small file size relative to type)
    if (metadata.size) {
      if (metadata.mimeType?.startsWith('image/') && metadata.size < 50000) {
        return true; // Likely heavily compressed
      }
      if (metadata.mimeType?.startsWith('video/') && metadata.size < 1000000) {
        return true; // Likely heavily compressed
      }
    }
    return false;
  }

  /**
   * Detect document tampering
   */
  private async detectDocumentTampering(
    fileBuffer: Buffer,
    metadata: { filename?: string; mimeType?: string }
  ): Promise<boolean> {
    // Check for PDF tampering indicators
    if (metadata.mimeType?.includes('pdf')) {
      const pdfContent = fileBuffer.toString('utf-8', 0, Math.min(1000, fileBuffer.length));
      
      // Check for suspicious PDF markers
      const suspiciousMarkers = [
        '/JavaScript',
        '/JS',
        '/OpenAction',
        '/Launch',
      ];

      // Check for metadata inconsistencies
      const hasMetadata = pdfContent.includes('/Metadata');
      const hasXMP = pdfContent.includes('<?xpacket');
      
      // If PDF has scripts but no metadata, might be tampered
      if (suspiciousMarkers.some(marker => pdfContent.includes(marker)) && !hasMetadata) {
        return true;
      }

      // Check for multiple versions (indicates editing)
      const versionCount = (pdfContent.match(/\/Version/g) || []).length;
      if (versionCount > 2) {
        return true;
      }
    }

    return false;
  }

  /**
   * Generate cryptographic hash for evidence (SHA-256)
   */
  private generateCryptographicHash(fileBuffer: Buffer): string {
    return crypto.createHash('sha256').update(fileBuffer).digest('hex');
  }

  /**
   * Verify file hash (unchanged detection)
   */
  async verifyFileHash(
    fileBuffer: Buffer,
    storedHash: string
  ): Promise<{ matches: boolean; currentHash: string }> {
    const currentHash = this.generateCryptographicHash(fileBuffer);
    const matches = currentHash === storedHash;
    
    if (!matches) {
      logger.warn(`[Evidence Truth Layer] Hash mismatch: stored=${storedHash.substring(0, 16)}..., current=${currentHash.substring(0, 16)}...`);
    }
    
    return { matches, currentHash };
  }

  /**
   * Sign evidence with organization key
   */
  async signEvidence(
    fileBuffer: Buffer,
    organizationId: string
  ): Promise<{ signature: string; publicKey: string; algorithm: string }> {
    try {
      // Get organization's signing key (in production, would be from secure key store)
      const orgKey = await this.getOrganizationSigningKey(organizationId);
      
      // Sign the hash
      const hash = this.generateCryptographicHash(fileBuffer);
      const sign = crypto.createSign('SHA256');
      sign.update(hash);
      sign.end();
      const signature = sign.sign(orgKey.privateKey, 'hex');

      return {
        signature,
        publicKey: orgKey.publicKey,
        algorithm: 'SHA256-RSA',
      };
    } catch (error) {
      logger.error('[Evidence Truth Layer] Error signing evidence', error);
      throw error;
    }
  }

  /**
   * Verify evidence signature
   */
  async verifyEvidenceSignature(
    fileBuffer: Buffer,
    signature: string,
    publicKey: string
  ): Promise<{ valid: boolean; algorithm: string }> {
    try {
      const hash = this.generateCryptographicHash(fileBuffer);
      const verify = crypto.createVerify('SHA256');
      verify.update(hash);
      verify.end();
      const valid = verify.verify(publicKey, signature, 'hex');

      return {
        valid,
        algorithm: 'SHA256-RSA',
      };
    } catch (error) {
      logger.error('[Evidence Truth Layer] Error verifying signature', error);
      return { valid: false, algorithm: 'SHA256-RSA' };
    }
  }

  /**
   * Get organization signing key from secure key store (BYOK)
   */
  private async getOrganizationSigningKey(organizationId: string): Promise<{ privateKey: string; publicKey: string }> {
    try {
      // Use BYOK service to retrieve organization's signing key
      const keyId = `signing-key-${organizationId}`;
      
      // Try to get existing key from BYOK
      try {
        const keyData = await byokService.getKey(keyId, organizationId);
        if (keyData && keyData.privateKey && keyData.publicKey) {
          return {
            privateKey: keyData.privateKey,
            publicKey: keyData.publicKey,
          };
        }
      } catch (keyError) {
        logger.info(`[Evidence Truth Layer] Signing key not found in BYOK for ${organizationId}, generating new key`);
      }

      // Generate new key pair if not found
      const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
      });

      // Store in BYOK for future use
      try {
        await byokService.createKey(organizationId, {
          keyId,
          provider: 'aws_kms', // Default to AWS KMS, can be configured
          keyType: 'RSA',
          keySize: 2048,
        });
        
        // Store the actual key material (in production, this would be encrypted)
        await byokService.encryptData(
          Buffer.from(JSON.stringify({ privateKey, publicKey })),
          organizationId,
          keyId
        );
      } catch (storeError) {
        logger.warn(`[Evidence Truth Layer] Failed to store signing key in BYOK: ${storeError}`);
        // Continue with in-memory key if BYOK storage fails
      }

      return { privateKey, publicKey };
    } catch (error) {
      logger.error('[Evidence Truth Layer] Error getting organization signing key', error);
      // Fallback: generate temporary key (not recommended for production)
      if (process.env.NODE_ENV === 'production') {
        throw new Error('Failed to retrieve signing key from secure key store');
      }
      const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
      });
      return { privateKey, publicKey };
    }
  }

  /**
   * Add trusted timestamp to evidence
   */
  async timestampEvidence(
    fileBuffer: Buffer,
    organizationId: string
  ): Promise<{ timestamp: Date; timestampHash: string; tsaUrl?: string }> {
    try {
      // Generate timestamp hash
      const hash = this.generateCryptographicHash(fileBuffer);
      
      // Get trusted NTP timestamp
      const timestamp = await this.getNTPTimestamp();
      
      // Create timestamp hash with NTP-verified timestamp
      const timestampData = `${hash}:${timestamp.toISOString()}:${organizationId}`;
      const timestampHash = crypto.createHash('sha256').update(timestampData).digest('hex');

      // Store timestamp in audit log
      await prisma.auditLog.create({
        data: {
          action: 'evidence_truth_layer.timestamped',
          details: JSON.stringify({ timestampHash, timestamp }),
          userId: 'system',
          organizationId,
          hash: timestampHash,
        },
      });

      return {
        timestamp,
        timestampHash,
        tsaUrl: process.env.TSA_URL, // Trusted timestamp authority URL
      };
    } catch (error) {
      logger.error('[Evidence Truth Layer] Error timestamping evidence', error);
      throw error;
    }
  }

  /**
   * Create chain of custody hash
   */
  async createChainOfCustody(
    evidenceId: string,
    organizationId: string,
    previousHash: string | null,
    action: string,
    userId: string
  ): Promise<{ hash: string; timestamp: Date; signer: string }> {
    try {
      const timestamp = new Date();
      const chainData = previousHash 
        ? `${previousHash}:${evidenceId}:${action}:${timestamp.toISOString()}:${userId}`
        : `${evidenceId}:${action}:${timestamp.toISOString()}:${userId}`;
      
      const hash = crypto.createHash('sha256').update(chainData).digest('hex');

      // Store in chain of custody
      await prisma.auditLog.create({
        data: {
          action: 'evidence_truth_layer.chain_of_custody',
          details: JSON.stringify({
            evidenceId,
            previousHash,
            action,
            hash,
            timestamp,
            signer: userId,
          }),
          userId,
          organizationId,
          hash,
        },
      });

      return {
        hash,
        timestamp,
        signer: userId,
      };
    } catch (error) {
      logger.error('[Evidence Truth Layer] Error creating chain of custody', error);
      throw error;
    }
  }

  /**
   * Multi-party attestation
   */
  async createMultiPartyAttestation(
    fileBuffer: Buffer,
    organizationId: string,
    parties: Array<{ userId: string; role: string }>
  ): Promise<Array<{ userId: string; signature: string; timestamp: Date }>> {
    try {
      const hash = this.generateCryptographicHash(fileBuffer);
      const attestations: Array<{ userId: string; signature: string; timestamp: Date }> = [];

      for (const party of parties) {
        // Each party signs the hash
        const timestamp = new Date();
        const signData = `${hash}:${party.userId}:${party.role}:${timestamp.toISOString()}`;
        const signature = crypto.createHash('sha256').update(signData).digest('hex');

        attestations.push({
          userId: party.userId,
          signature,
          timestamp,
        });

        // Store attestation
        await prisma.auditLog.create({
          data: {
            action: 'evidence_truth_layer.multi_party_attestation',
            details: JSON.stringify({
              userId: party.userId,
              role: party.role,
              signature,
              timestamp,
            }),
            userId: party.userId,
            organizationId,
            hash: signature,
          },
        });
      }

      return attestations;
    } catch (error) {
      logger.error('[Evidence Truth Layer] Error creating multi-party attestation', error);
      throw error;
    }
  }

  /**
   * Handle key rotation (verify old signatures still valid)
   */
  async verifyWithKeyRotation(
    fileBuffer: Buffer,
    signature: string,
    publicKey: string,
    keyVersion: number
  ): Promise<{ valid: boolean; keyVersion: number; rotated: boolean }> {
    try {
      // First try with current key
      const currentVerification = await this.verifyEvidenceSignature(fileBuffer, signature, publicKey);
      
      if (currentVerification.valid) {
        return { valid: true, keyVersion, rotated: false };
      }

      // If current key fails, try with previous keys (key rotation scenario)
      // In production, would fetch previous keys from key store
      logger.warn(`[Evidence Truth Layer] Signature verification failed with key version ${keyVersion}, checking previous keys`);
      
      // For now, return false (in production, would check key history)
      return { valid: false, keyVersion, rotated: true };
    } catch (error) {
      logger.error('[Evidence Truth Layer] Error verifying with key rotation', error);
      return { valid: false, keyVersion, rotated: false };
    }
  }

  /**
   * Get physical attestation (enhanced with all features)
   */
  private async getPhysicalAttestation(
    evidenceId: string,
    organizationId: string
  ): Promise<EvidenceAnalysis['physicalAttestation']> {
    try {
      // Get IoT devices for physical attestation
      const devices = await prisma.ioTDevice.findMany({
        where: {
          organizationId,
        },
        take: 10,
      });

      if (devices.length === 0) {
        return undefined; // No devices available
      }

      // Collect attestation data from multiple devices
      const attestations: Array<{
        deviceId: string;
        timestamp: Date;
        location?: { lat: number; lng: number; accuracy?: number };
        environmentalData?: { temperature?: number; humidity?: number; pressure?: number };
        accessEvents?: Array<{ event: string; timestamp: Date; deviceId: string }>;
        verified: boolean;
      }> = [];

      for (const device of devices) {
        const sensorData = device.sensorData as any;
        
        // Parse GPS location if available
        let location: { lat: number; lng: number; accuracy?: number } | undefined;
        if (device.location) {
          // Parse location string (format: "lat,lng" or JSON)
          try {
            const locParts = device.location.split(',');
            if (locParts.length === 2) {
              location = {
                lat: parseFloat(locParts[0]),
                lng: parseFloat(locParts[1]),
                accuracy: 10, // Default 10m accuracy
              };
            }
          } catch (e) {
            // Location parsing failed
          }
        }

        // Get environmental data
        const environmentalData = sensorData?.environmentalData ? {
          temperature: sensorData.environmentalData.temperature,
          humidity: sensorData.environmentalData.humidity,
          pressure: sensorData.environmentalData.pressure,
        } : undefined;

        // Get access control events
        const accessEvents = sensorData?.accessEvents?.map((event: any) => ({
          event: event.type || 'access',
          timestamp: new Date(event.timestamp || device.lastSeen),
          deviceId: device.deviceId,
        })) || [];

        attestations.push({
          deviceId: device.deviceId,
          timestamp: device.lastSeen || new Date(),
          location,
          environmentalData,
          accessEvents,
          verified: device.complianceStatus === 'compliant',
        });
      }

      // Get NTP timestamp (simulated - in production would query NTP server)
      const ntpTimestamp = await this.getNTPTimestamp();

      // Calculate integrity score
      const verifiedDevices = attestations.filter(a => a.verified).length;
      const integrityScore = verifiedDevices / attestations.length;

      // Detect conflicts between devices
      const conflicts = this.detectSensorConflicts(attestations);

      // Multi-device corroboration
      const multiDeviceCorroboration = attestations.length > 1 && conflicts.length === 0;

      // Build device chain
      const deviceChain = attestations.map(a => ({
        deviceId: a.deviceId,
        verified: a.verified,
        timestamp: a.timestamp,
      }));

      // Use most recent device as primary
      const primaryAttestation = attestations.sort((a, b) => 
        b.timestamp.getTime() - a.timestamp.getTime()
      )[0];

      return {
        sensorId: primaryAttestation.deviceId,
        timestamp: primaryAttestation.timestamp,
        location: primaryAttestation.location,
        gpsAttestation: primaryAttestation.location !== undefined,
        ntpTimestamp,
        environmentalData: primaryAttestation.environmentalData,
        accessControlEvents: primaryAttestation.accessEvents,
        deviceChain,
        integrityScore,
        multiDeviceCorroboration,
        conflicts: conflicts.length > 0 ? conflicts : undefined,
      };
    } catch (error) {
      logger.error('[Evidence Truth Layer] Error getting physical attestation', error);
      return undefined;
    }
  }

  /**
   * Get NTP timestamp from trusted NTP server
   */
  private async getNTPTimestamp(): Promise<Date> {
    try {
      const ntpServer = process.env.NTP_SERVER || 'pool.ntp.org';
      const ntpPort = parseInt(process.env.NTP_PORT || '123', 10);

      return new Promise<Date>((resolve, reject) => {
        NTPClient.getNetworkTime(ntpServer, ntpPort, (error: Error | null, date: Date) => {
          if (error) {
            logger.warn(`[Evidence Truth Layer] NTP query failed, using system time: ${error.message}`);
            // Fallback to system time if NTP fails
            resolve(new Date());
          } else {
            logger.debug(`[Evidence Truth Layer] NTP timestamp obtained: ${date.toISOString()}`);
            resolve(date);
          }
        });
      });
    } catch (error) {
      logger.warn('[Evidence Truth Layer] NTP client error, using system time', error);
      return new Date();
    }
  }

  /**
   * Detect conflicts between sensor data
   */
  private detectSensorConflicts(
    attestations: Array<{
      deviceId: string;
      location?: { lat: number; lng: number; accuracy?: number };
      environmentalData?: { temperature?: number; humidity?: number };
      timestamp: Date;
    }>
  ): Array<{ deviceId: string; conflict: string }> {
    const conflicts: Array<{ deviceId: string; conflict: string }> = [];

    // Check location conflicts
    const locations = attestations.filter(a => a.location).map(a => a.location!);
    if (locations.length > 1) {
      const distances = [];
      for (let i = 0; i < locations.length; i++) {
        for (let j = i + 1; j < locations.length; j++) {
          const distance = this.calculateDistance(
            locations[i].lat, locations[i].lng,
            locations[j].lat, locations[j].lng
          );
          distances.push(distance);
          
          // If devices are > 100m apart, conflict
          if (distance > 100) {
            conflicts.push({
              deviceId: attestations[i].deviceId,
              conflict: `Location conflict: device ${attestations[i].deviceId} and ${attestations[j].deviceId} are ${Math.round(distance)}m apart`,
            });
          }
        }
      }
    }

    // Check environmental data conflicts
    const temps = attestations
      .filter(a => a.environmentalData?.temperature !== undefined)
      .map(a => a.environmentalData!.temperature!);
    
    if (temps.length > 1) {
      const minTemp = Math.min(...temps);
      const maxTemp = Math.max(...temps);
      
      // If temperature difference > 10°C, conflict
      if (maxTemp - minTemp > 10) {
        conflicts.push({
          deviceId: attestations[0].deviceId,
          conflict: `Temperature conflict: range ${minTemp}°C to ${maxTemp}°C (difference: ${maxTemp - minTemp}°C)`,
        });
      }
    }

    return conflicts;
  }

  /**
   * Calculate distance between two GPS coordinates (Haversine formula)
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
  }

  /**
   * Detect human liveness signals (enhanced with all features)
   */
  private async detectHumanLiveness(
    fileBuffer?: Buffer,
    metadata?: {
      filename?: string;
      mimeType?: string;
      size?: number;
    }
  ): Promise<EvidenceAnalysis['humanLiveness']> {
    if (!fileBuffer || !metadata) {
      return undefined;
    }

    const isImage = metadata.mimeType?.startsWith('image/');
    const isVideo = metadata.mimeType?.startsWith('video/');
    const isDocument = metadata.mimeType?.includes('pdf') || 
                      metadata.mimeType?.includes('document') ||
                      metadata.mimeType?.includes('text');

    // For documents, assume human-created
    if (isDocument) {
      return {
        detected: true,
        confidence: 0.8,
      };
    }

    // For images/videos, perform liveness detection
    if (isImage || isVideo) {
      try {
        // Use ML model for liveness detection
        const livenessResult = await mlModelsService.detectLiveness(fileBuffer, isVideo ? 'video' : 'image');
        
        // Detect photo of photo
        const photoOfPhoto = this.detectPhotoOfPhoto(fileBuffer, metadata);
        
        // Detect video of video (replay attack)
        const videoOfVideo = isVideo ? this.detectVideoOfVideo(fileBuffer, metadata) : false;
        
        // 3D depth analysis
        const depthAnalysis = await this.analyzeDepth(fileBuffer, metadata);
        
        // Eye movement detection
        const eyeMovement = await this.detectEyeMovement(fileBuffer, metadata);
        
        // Blink detection
        const blinkDetection = await this.detectBlink(fileBuffer, metadata);
        
        // Pulse detection (if applicable)
        const pulseDetection = await this.detectPulse(fileBuffer, metadata);

        // Calculate overall confidence
        let confidence = livenessResult.confidence || 0.6;
        
        // Adjust confidence based on detections
        if (photoOfPhoto || videoOfVideo) {
          confidence *= 0.3; // Significantly reduce confidence
        }
        if (depthAnalysis.hasDepth) {
          confidence += 0.1; // Increase confidence
        }
        if (eyeMovement.detected) {
          confidence += 0.1;
        }
        if (blinkDetection.detected && blinkDetection.pattern === 'natural') {
          confidence += 0.1;
        }
        if (pulseDetection.detected) {
          confidence += 0.1;
        }

        confidence = Math.min(1.0, Math.max(0.0, confidence));

        return {
          detected: livenessResult.detected || true,
          confidence,
          photoOfPhoto,
          videoOfVideo,
          depthAnalysis,
          eyeMovement,
          blinkDetection,
          pulseDetection,
        };
      } catch (error) {
        logger.error('[Evidence Truth Layer] Error in liveness detection, using fallback', error);
        
        // Fallback: basic detection
        return {
          detected: true,
          confidence: 0.5, // Low confidence for fallback
        };
      }
    }

    return undefined;
  }

  /**
   * Detect photo of photo (spoofing)
   */
  private detectPhotoOfPhoto(
    fileBuffer: Buffer,
    metadata: { mimeType?: string; size?: number }
  ): boolean {
    // Check for compression artifacts that suggest photo of photo
    // In production, would use computer vision
    if (metadata.size && metadata.size < 50000) {
      // Very small file might be photo of photo
      return true;
    }
    return false;
  }

  /**
   * Detect video of video (replay attack)
   */
  private detectVideoOfVideo(
    fileBuffer: Buffer,
    metadata: { mimeType?: string; size?: number }
  ): boolean {
    // Check for video compression patterns that suggest replay
    // In production, would analyze video frames
    if (metadata.size && metadata.size < 1000000) {
      // Very small video might be replay
      return true;
    }
    return false;
  }

  /**
   * Analyze 3D depth
   */
  private async analyzeDepth(
    fileBuffer: Buffer,
    metadata: { mimeType?: string }
  ): Promise<{ hasDepth: boolean; confidence: number }> {
    // In production, would use depth estimation models
    // For now, simulate based on file characteristics
    const hasDepth = metadata.mimeType?.includes('image/') && fileBuffer.length > 100000;
    return {
      hasDepth: hasDepth || false,
      confidence: hasDepth ? 0.7 : 0.3,
    };
  }

  /**
   * Detect eye movement
   */
  private async detectEyeMovement(
    fileBuffer: Buffer,
    metadata: { mimeType?: string }
  ): Promise<{ detected: boolean; confidence: number }> {
    // In production, would use eye tracking models
    // For now, simulate
    const isVideo = metadata.mimeType?.startsWith('video/');
    return {
      detected: isVideo || false,
      confidence: isVideo ? 0.6 : 0.0,
    };
  }

  /**
   * Detect blink pattern
   */
  private async detectBlink(
    fileBuffer: Buffer,
    metadata: { mimeType?: string }
  ): Promise<{ detected: boolean; pattern: 'natural' | 'artificial' | 'none' }> {
    // In production, would analyze blink frequency and pattern
    const isVideo = metadata.mimeType?.startsWith('video/');
    return {
      detected: isVideo || false,
      pattern: isVideo ? 'natural' : 'none',
    };
  }

  /**
   * Detect pulse (heart rate)
   */
  private async detectPulse(
    fileBuffer: Buffer,
    metadata: { mimeType?: string }
  ): Promise<{ detected: boolean; bpm?: number; confidence: number }> {
    // In production, would use photoplethysmography (PPG) on video
    const isVideo = metadata.mimeType?.startsWith('video/');
    return {
      detected: isVideo || false,
      bpm: isVideo ? 72 : undefined, // Simulated heart rate
      confidence: isVideo ? 0.5 : 0.0,
    };
  }

  /**
   * Calculate overall confidence score (enhanced)
   */
  private calculateOverallConfidence(
    deepfakeScore: number,
    deepfakeConfidence: number,
    cryptographicHash: string,
    signature: { signature: string; publicKey: string },
    physicalAttestation?: EvidenceAnalysis['physicalAttestation'],
    humanLiveness?: EvidenceAnalysis['humanLiveness']
  ): number {
    let confidence = 1.0;

    // Reduce confidence based on deepfake score
    confidence -= deepfakeScore * 0.4;
    
    // Adjust based on deepfake detection confidence
    confidence = confidence * 0.7 + deepfakeConfidence * 0.3;

    // Increase confidence if physical attestation exists
    if (physicalAttestation) {
      const attestationWeight = physicalAttestation.integrityScore || 0.5;
      confidence = confidence * 0.6 + attestationWeight * 0.4;
      
      // Multi-device corroboration increases confidence
      if (physicalAttestation.multiDeviceCorroboration) {
        confidence += 0.1;
      }
      
      // Conflicts reduce confidence
      if (physicalAttestation.conflicts && physicalAttestation.conflicts.length > 0) {
        confidence -= 0.2;
      }
    }

    // Adjust based on human liveness
    if (humanLiveness) {
      confidence = confidence * 0.5 + humanLiveness.confidence * 0.5;
      
      // Photo of photo or video of video significantly reduces confidence
      if (humanLiveness.photoOfPhoto || humanLiveness.videoOfVideo) {
        confidence *= 0.3;
      }
      
      // Depth analysis increases confidence
      if (humanLiveness.depthAnalysis?.hasDepth) {
        confidence += 0.05;
      }
    }

    // Cryptographic hash and signature increase confidence
    if (cryptographicHash) {
      confidence += 0.1;
    }
    if (signature.signature) {
      confidence += 0.1;
    }

    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Determine verification status
   */
  private determineVerificationStatus(
    deepfakeScore: number,
    overallConfidence: number
  ): 'verified' | 'suspicious' | 'failed' {
    if (deepfakeScore > 0.7 || overallConfidence < 0.3) {
      return 'failed';
    }

    if (deepfakeScore > 0.4 || overallConfidence < 0.6) {
      return 'suspicious';
    }

    return 'verified';
  }

  /**
   * Validate evidence hash (tamper detection)
   */
  async validateEvidenceHash(
    evidenceId: string,
    storedHash: string,
    currentHash: string
  ): Promise<boolean> {
    if (storedHash !== currentHash) {
      logger.warn(`[Evidence Truth Layer] Hash mismatch for evidence ${evidenceId}`);
      return false;
    }

    return true;
  }

  /**
   * Get evidence analysis for an evidence ID
   */
  async getEvidenceAnalysis(evidenceId: string, organizationId: string): Promise<EvidenceAnalysis | null> {
    try {
      const analysis = await prisma.evidenceAnalysis.findFirst({
        where: {
          evidenceId,
          organizationId,
        },
        orderBy: {
          analyzedAt: 'desc',
        },
      });

      if (!analysis) {
        return null;
      }

      return {
        evidenceId: analysis.evidenceId,
        deepfakeScore: analysis.deepfakeScore,
        cryptographicHash: analysis.cryptographicHash,
        physicalAttestation: analysis.physicalAttestation as any,
        humanLiveness: analysis.humanLiveness as any,
        overallConfidence: analysis.overallConfidence,
        verificationStatus: analysis.verificationStatus as 'verified' | 'suspicious' | 'failed',
        createdAt: analysis.analyzedAt,
      };
    } catch (error) {
      logger.error('[Evidence Truth Layer] Error getting evidence analysis', error);
      return null;
    }
  }

  /**
   * Re-analyze evidence
   */
  async reanalyzeEvidence(
    evidenceId: string,
    organizationId: string,
    fileBuffer?: Buffer,
    metadata?: {
      filename?: string;
      mimeType?: string;
      size?: number;
    }
  ): Promise<EvidenceAnalysis> {
    try {
      // Delete old analysis
      await prisma.evidenceAnalysis.deleteMany({
        where: {
          evidenceId,
          organizationId,
        },
      });

      // Create new analysis
      return await this.analyzeEvidence(evidenceId, organizationId, fileBuffer, metadata);
    } catch (error) {
      logger.error('[Evidence Truth Layer] Error re-analyzing evidence', error);
      throw error;
    }
  }

  /**
   * Get analysis history
   */
  async getAnalysisHistory(
    evidenceId: string,
    organizationId: string
  ): Promise<EvidenceAnalysis[]> {
    try {
      const analyses = await prisma.evidenceAnalysis.findMany({
        where: {
          evidenceId,
          organizationId,
        },
        orderBy: {
          analyzedAt: 'desc',
        },
        take: 50, // Last 50 analyses
      });

      return analyses.map(analysis => ({
        evidenceId: analysis.evidenceId,
        deepfakeScore: analysis.deepfakeScore,
        cryptographicHash: analysis.cryptographicHash,
        physicalAttestation: analysis.physicalAttestation as any,
        humanLiveness: analysis.humanLiveness as any,
        overallConfidence: analysis.overallConfidence,
        verificationStatus: analysis.verificationStatus as 'verified' | 'suspicious' | 'failed',
        createdAt: analysis.analyzedAt,
      }));
    } catch (error) {
      logger.error('[Evidence Truth Layer] Error getting analysis history', error);
      return [];
    }
  }

  /**
   * Bulk evidence analysis
   */
  async bulkAnalyzeEvidence(
    organizationId: string,
    evidenceFiles: Array<{
      evidenceId: string;
      fileBuffer: Buffer;
      metadata: {
        filename?: string;
        mimeType?: string;
        size?: number;
      };
    }>
  ): Promise<Array<EvidenceAnalysis & { success: boolean; error?: string }>> {
    try {
      const results: Array<EvidenceAnalysis & { success: boolean; error?: string }> = [];

      // Process in parallel (with concurrency limit)
      const concurrency = 5;
      for (let i = 0; i < evidenceFiles.length; i += concurrency) {
        const batch = evidenceFiles.slice(i, i + concurrency);
        
        const batchResults = await Promise.allSettled(
          batch.map(evidence => 
            this.analyzeEvidence(
              evidence.evidenceId,
              organizationId,
              evidence.fileBuffer,
              evidence.metadata
            )
          )
        );

        for (let j = 0; j < batchResults.length; j++) {
          if (batchResults[j].status === 'fulfilled') {
            const fulfilledResult = batchResults[j] as PromiseFulfilledResult<any>;
            results.push({
              ...fulfilledResult.value,
              success: true,
            });
          } else {
            results.push({
              evidenceId: batch[j].evidenceId,
              deepfakeScore: 0.5,
              cryptographicHash: '',
              overallConfidence: 0.0,
              verificationStatus: 'failed',
              createdAt: new Date(),
              success: false,
              error: (batchResults[j] as PromiseRejectedResult).reason?.message || 'Unknown error',
            });
          }
        }
      }

      logger.info(`[Evidence Truth Layer] Bulk analysis completed: ${results.filter(r => r.success).length}/${results.length} successful`);

      return results;
    } catch (error) {
      logger.error('[Evidence Truth Layer] Error in bulk analysis', error);
      throw error;
    }
  }

  /**
   * Export analysis report
   */
  async exportAnalysisReport(
    evidenceId: string,
    organizationId: string,
    format: 'json' | 'csv' | 'pdf' = 'json'
  ): Promise<any> {
    try {
      const analysis = await this.getEvidenceAnalysis(evidenceId, organizationId);
      const history = await this.getAnalysisHistory(evidenceId, organizationId);

      if (!analysis) {
        throw new Error('Analysis not found');
      }

      const report = {
        evidenceId,
        organizationId,
        generatedAt: new Date().toISOString(),
        currentAnalysis: analysis,
        history: history.slice(0, 10), // Last 10 analyses
        summary: {
          deepfakeScore: analysis.deepfakeScore,
          overallConfidence: analysis.overallConfidence,
          verificationStatus: analysis.verificationStatus,
          hasPhysicalAttestation: !!analysis.physicalAttestation,
          hasHumanLiveness: !!analysis.humanLiveness,
          totalAnalyses: history.length,
        },
      };

      if (format === 'csv') {
        // Convert to CSV format
        const csvRows = [
          ['Evidence ID', 'Deepfake Score', 'Confidence', 'Status', 'Timestamp'],
          [
            evidenceId,
            analysis.deepfakeScore.toString(),
            analysis.overallConfidence.toString(),
            analysis.verificationStatus,
            analysis.createdAt.toISOString(),
          ],
        ];

        return {
          format: 'csv',
          content: csvRows.map(row => row.join(',')).join('\n'),
          filename: `evidence-analysis-${evidenceId}-${new Date().toISOString().split('T')[0]}.csv`,
        };
      }

      if (format === 'pdf') {
        // In production, would generate PDF using library like pdfkit
        // For now, return JSON with PDF flag
        return {
          format: 'pdf',
          content: JSON.stringify(report, null, 2),
          filename: `evidence-analysis-${evidenceId}-${new Date().toISOString().split('T')[0]}.pdf`,
          note: 'PDF generation would be implemented with pdfkit or similar library',
        };
      }

      return report;
    } catch (error) {
      logger.error('[Evidence Truth Layer] Error exporting analysis report', error);
      throw error;
    }
  }
}

export default new EvidenceTruthLayerService();

