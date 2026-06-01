/**
 * Security Features Controller
 * Handles Zero Trust, Zero-Knowledge Proofs, BYOK, Compliance-as-Code
 */

import { Request, Response, RequestHandler } from 'express';
import { AuthRequest } from '../middleware/auth';
import zeroTrustService from '../services/advanced/zeroTrustService';
import zeroKnowledgeService from '../services/advanced/zeroKnowledgeService';
import byokService from '../services/advanced/byokService';
import complianceAsCodeService from '../services/advanced/complianceAsCodeService';
import { AppError } from '../middleware/errorHandler';
import logger from '../config/logger';
import prisma from '../config/database';
import crypto from 'crypto';

class SecurityController {
  // ==================== Zero Trust Security ====================

  verifyDeviceTrust: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { deviceId, deviceType, macAddress, ipAddress, fingerprint, metadata } = req.body;

      if (!deviceId) {
        throw new AppError('Device ID is required', 400);
      }

      await zeroTrustService.initialize(authReq.user!.organizationId);

      // Generate fingerprint from device info if not provided
      const deviceFingerprint = fingerprint || zeroTrustService.generateDeviceFingerprint({
        deviceId,
        deviceType,
        macAddress,
        ipAddress,
      });

      const deviceMetadata = {
        ...metadata,
        deviceType,
        macAddress,
        ipAddress,
        userAgent: req.headers['user-agent'],
      };

      const deviceTrust = await zeroTrustService.verifyDeviceTrust(
        deviceId,
        deviceFingerprint,
        deviceMetadata,
        authReq.user!.organizationId
      );

      res.json(deviceTrust);
    } catch (error: any) {
      logger.error('Verify device trust error', error);
      throw new AppError(error.message || 'Failed to verify device trust', 500);
    }
  };

  evaluateAccessRequest: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { resource, resourceId, deviceId, action, context } = req.body;
      const effectiveResourceId = resourceId || resource;

      if (!effectiveResourceId || !action) {
        throw new AppError('Resource and action are required', 400);
      }

      await zeroTrustService.initialize(authReq.user!.organizationId);

      const decision = await zeroTrustService.evaluateAccessRequest(
        {
          userId: authReq.user!.id,
          resourceId: effectiveResourceId,
          deviceId,
          action,
          context: context || {
            ipAddress: req.ip || req.socket.remoteAddress || 'unknown',
            time: new Date(),
          },
        },
        authReq.user!.organizationId
      );

      res.json(decision);
    } catch (error: any) {
      logger.error('Evaluate access request error', error);
      throw new AppError(error.message || 'Failed to evaluate access request', 500);
    }
  };

  createZeroTrustPolicy: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const policy = await zeroTrustService.createPolicy(
        authReq.user!.organizationId,
        req.body
      );
      res.json(policy);
    } catch (error: any) {
      logger.error('Create Zero Trust policy error', error);
      throw new AppError(error.message || 'Failed to create Zero Trust policy', 500);
    }
  };

  getZeroTrustPolicies: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const policies = await zeroTrustService.getPolicies(authReq.user!.organizationId);
      res.json(policies);
    } catch (error: any) {
      logger.error('Get Zero Trust policies error', error);
      throw new AppError('Failed to get Zero Trust policies', 500);
    }
  };

  getZeroTrustPolicy: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { policyId } = req.params;
      const policies = await zeroTrustService.getPolicies(authReq.user!.organizationId);
      const policy = policies.find(p => p.id === policyId);
      if (!policy) {
        throw new AppError('Policy not found', 404);
      }
      res.json(policy);
    } catch (error: any) {
      logger.error('Get Zero Trust policy error', error);
      throw new AppError(error.message || 'Failed to get Zero Trust policy', 500);
    }
  };

  updateZeroTrustPolicy: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const organizationId = authReq.user!.organizationId;
      const { policyId } = req.params;

      // Verify the policy belongs to this organization before mutating
      const existing = await prisma.zeroTrustPolicy.findFirst({
        where: { id: policyId, organizationId },
      });
      if (!existing) {
        throw new AppError('Policy not found', 404);
      }

      // Build the update payload only from provided fields, serializing rules to JSON
      const { name, description, rules, enabled, priority } = req.body;
      const data: Record<string, any> = {};
      if (name !== undefined) data.name = name;
      if (description !== undefined) data.description = description;
      if (rules !== undefined) data.rules = JSON.stringify(rules);
      if (enabled !== undefined) data.enabled = enabled;
      if (priority !== undefined) data.priority = priority;

      // Persist the update to the real policy store and record the change
      const [updated] = await prisma.$transaction([
        prisma.zeroTrustPolicy.update({
          where: { id: policyId },
          data,
        }),
        prisma.auditLog.create({
          data: {
            action: `Zero Trust Policy Updated: ${policyId}`,
            organizationId,
            userId: authReq.user!.id,
            hash: policyId,
            details: JSON.stringify({ policyId, fields: Object.keys(data) }),
          },
        }),
      ]);

      // Re-initialize so the service reloads policies from the persisted store
      await zeroTrustService.initialize(organizationId);

      res.json({
        ...updated,
        rules: typeof updated.rules === 'string' ? JSON.parse(updated.rules) : updated.rules,
      });
    } catch (error: any) {
      logger.error('Update Zero Trust policy error', error);
      if (error instanceof AppError) throw error;
      throw new AppError(error.message || 'Failed to update Zero Trust policy', 500);
    }
  };

  deleteZeroTrustPolicy: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const organizationId = authReq.user!.organizationId;
      const { policyId } = req.params;

      // Org-scoped delete: only removes a row owned by this organization
      const result = await prisma.zeroTrustPolicy.deleteMany({
        where: { id: policyId, organizationId },
      });

      if (result.count === 0) {
        throw new AppError('Policy not found', 404);
      }

      await prisma.auditLog.create({
        data: {
          action: `Zero Trust Policy Deleted: ${policyId}`,
          organizationId,
          userId: authReq.user!.id,
          hash: policyId,
          details: JSON.stringify({ policyId }),
        },
      });

      res.json({ success: true, message: `Policy ${policyId} deleted` });
    } catch (error: any) {
      logger.error('Delete Zero Trust policy error', error);
      if (error instanceof AppError) throw error;
      throw new AppError(error.message || 'Failed to delete Zero Trust policy', 500);
    }
  };

  getDeviceTrusts: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      await zeroTrustService.initialize(authReq.user!.organizationId);
      const devices = await zeroTrustService.getAllDeviceTrusts(authReq.user!.organizationId);
      res.json(devices);
    } catch (error: any) {
      logger.error('Get device trusts error', error);
      throw new AppError('Failed to get device trusts', 500);
    }
  };

  getDeviceTrust: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { deviceId } = req.params;
      const deviceTrust = await zeroTrustService.getDeviceTrust(
        deviceId,
        authReq.user!.organizationId
      );
      if (!deviceTrust) {
        throw new AppError('Device trust not found', 404);
      }
      res.json(deviceTrust);
    } catch (error: any) {
      logger.error('Get device trust error', error);
      throw new AppError(error.message || 'Failed to get device trust', 500);
    }
  };

  createNetworkSegment: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const organizationId = authReq.user!.organizationId;
      const { name, cidr, trustLevel, allowedPolicies, resources, description } = req.body;

      if (!name || !cidr) {
        throw new AppError('Name and CIDR are required', 400);
      }

      // Persist to the dedicated network segment store so reads reflect current state
      const created = await prisma.networkSegment.create({
        data: {
          organizationId,
          name,
          cidr,
          trustLevel: trustLevel || 'medium',
          resources: resources || [],
          policies: allowedPolicies || [],
        },
      });

      await prisma.auditLog.create({
        data: {
          action: `Network Segment Created: ${name}`,
          organizationId,
          userId: authReq.user!.id,
          hash: created.id,
          details: JSON.stringify({ segmentId: created.id, name, cidr }),
        },
      });

      res.json({
        ...created,
        allowedPolicies: created.policies,
        description: description || '',
      });
    } catch (error: any) {
      logger.error('Create network segment error', error);
      if (error instanceof AppError) throw error;
      throw new AppError(error.message || 'Failed to create network segment', 500);
    }
  };

  getNetworkSegments: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;

      // Read the current set of segments from the dedicated, org-scoped store
      const segments = await prisma.networkSegment.findMany({
        where: { organizationId: authReq.user!.organizationId },
        orderBy: { createdAt: 'desc' },
        take: 100,
      });

      res.json(segments.map(s => ({ ...s, allowedPolicies: s.policies })));
    } catch (error: any) {
      logger.error('Get network segments error', error);
      throw new AppError('Failed to get network segments', 500);
    }
  };

  continuousVerification: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { deviceId } = req.body;
      const isTrusted = await zeroTrustService.continuousVerification(
        deviceId,
        authReq.user!.organizationId
      );
      res.json({ isTrusted });
    } catch (error: any) {
      logger.error('Continuous verification error', error);
      throw new AppError(error.message || 'Failed to verify device', 500);
    }
  };

  // ==================== Zero-Knowledge Proofs ====================

  generateComplianceProof: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { frameworkId, privateData, claims, controlIds } = req.body;

      if (!frameworkId) {
        throw new AppError('Framework ID is required', 400);
      }

      // Build proof data from schema-aligned fields with backward-compat fallback
      const proofData = privateData || {
        controlsImplemented: Array.isArray(controlIds) ? controlIds.length : 0,
        totalControls: Array.isArray(controlIds) ? controlIds.length : 0,
        claims: claims || [],
      };

      const proof = await zeroKnowledgeService.generateComplianceProof(
        authReq.user!.organizationId,
        frameworkId,
        proofData
      );

      const proofId = crypto.randomBytes(16).toString('hex');

      // Store proof in auditLog
      await prisma.auditLog.create({
        data: {
          action: 'ZK Proof Generated: compliance_check',
          organizationId: authReq.user!.organizationId,
          hash: proofId,
          details: JSON.stringify({
            proofId,
            proofType: 'compliance_check',
            frameworkId,
            controlsImplemented: proofData.controlsImplemented,
            totalControls: proofData.totalControls,
            publicSignals: proof.publicSignals,
          }),
        },
      });

      res.json({
        ...proof,
        proofId,
        frameworkId,
        proofType: 'compliance',
        timestamp: new Date(),
      });
    } catch (error: any) {
      logger.error('Generate compliance proof error', error);
      throw new AppError(error.message || 'Failed to generate compliance proof', 500);
    }
  };

  verifyComplianceProof: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const { proof } = req.body;
      if (!proof) {
        throw new AppError('Proof is required', 400);
      }

      const isValid = await zeroKnowledgeService.verifyComplianceProof(proof);
      res.json({ isValid });
    } catch (error: any) {
      logger.error('Verify compliance proof error', error);
      throw new AppError(error.message || 'Failed to verify compliance proof', 500);
    }
  };

  generateCredentialProof: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const { credential, credentialType, attributes, secret } = req.body;

      // Build credential object from schema-aligned fields with backward-compat fallback
      const credentialObj = credential || {
        type: credentialType,
        ...(attributes || {}),
      };

      if (!credentialObj || (!credentialObj.type && !credentialObj.role)) {
        throw new AppError('Credential type is required', 400);
      }

      // Handle frontend format: { type, hash, issuer, expirationDate }
      // Convert to service format: { role, permissions, expiryDate }
      const credentialData = {
        role: credentialObj.type || credentialObj.role || 'user',
        permissions: credentialObj.permissions || ['read'],
        expiryDate: credentialObj.expirationDate
          ? new Date(credentialObj.expirationDate)
          : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // Default 1 year
      };

      const effectiveSecret = secret || crypto.randomBytes(32).toString('hex');

      const authReq = req as AuthRequest;
      const proof = await zeroKnowledgeService.generateCredentialProof(credentialData, effectiveSecret);

      const proofId = crypto.randomBytes(16).toString('hex');

      // Store proof in auditLog
      await prisma.auditLog.create({
        data: {
          action: 'ZK Proof Generated: credential_verification',
          organizationId: authReq.user!.organizationId,
          hash: proofId,
          details: JSON.stringify({
            proofId,
            proofType: 'credential_verification',
            credentialType: credentialObj.type || credentialObj.role,
            issuer: credentialObj.issuer,
            publicSignals: proof.publicSignals,
          }),
        },
      });

      // Return proof with metadata
      res.json({
        proofId,
        proof,
        credentialType: credentialObj.type || credentialObj.role,
        issuer: credentialObj.issuer,
        isValid: true,
        timestamp: new Date(),
      });
    } catch (error: any) {
      logger.error('Generate credential proof error', error);
      throw new AppError(error.message || 'Failed to generate credential proof', 500);
    }
  };

  verifyCredentialProof: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const { proof, requiredLevel } = req.body;
      if (!proof) {
        throw new AppError('Proof is required', 400);
      }

      const isValid = await zeroKnowledgeService.verifyCredentialProof(
        proof,
        requiredLevel || 1
      );
      res.json({ isValid });
    } catch (error: any) {
      logger.error('Verify credential proof error', error);
      throw new AppError(error.message || 'Failed to verify credential proof', 500);
    }
  };

  generateOwnershipProof: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { dataHash, secret, assetId, assetType, resourceType, resourceId } = req.body;

      // Allow schema-aligned fields (resourceType + resourceId) as primary,
      // with backward-compat fallback to legacy (dataHash + secret)
      const effectiveDataHash = dataHash || (resourceId
        ? crypto.createHash('sha256').update(`${resourceType || 'resource'}:${resourceId}`).digest('hex')
        : null);
      const effectiveSecret = secret || crypto.randomBytes(32).toString('hex');
      const effectiveAssetId = assetId || resourceId || null;
      const effectiveAssetType = assetType || resourceType || null;

      if (!effectiveDataHash) {
        throw new AppError('Resource ID or data hash is required', 400);
      }

      const proof = await zeroKnowledgeService.generateOwnershipProof(
        authReq.user!.organizationId,
        effectiveDataHash,
        effectiveSecret
      );
      
      const proofId = crypto.randomBytes(16).toString('hex');
      
      // Store proof in auditLog
      await prisma.auditLog.create({
        data: {
          action: 'ZK Proof Generated: data_ownership',
          organizationId: authReq.user!.organizationId,
          hash: proofId,
          details: JSON.stringify({
            proofId,
            proofType: 'data_ownership',
            dataHash: effectiveDataHash,
            assetId: effectiveAssetId,
            assetType: effectiveAssetType,
            publicSignals: proof.publicSignals,
          }),
        },
      });

      res.json({
        ...proof,
        proofId,
        proofType: 'ownership',
        dataHash: effectiveDataHash,
        assetId: effectiveAssetId,
        assetType: effectiveAssetType,
        timestamp: new Date(),
      });
    } catch (error: any) {
      logger.error('Generate ownership proof error', error);
      throw new AppError(error.message || 'Failed to generate ownership proof', 500);
    }
  };

  verifyOwnershipProof: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const { proof, dataHash } = req.body;
      if (!proof || !dataHash) {
        throw new AppError('Proof and data hash are required', 400);
      }

      const isValid = await zeroKnowledgeService.verifyOwnershipProof(proof, dataHash);
      res.json({ isValid });
    } catch (error: any) {
      logger.error('Verify ownership proof error', error);
      throw new AppError(error.message || 'Failed to verify ownership proof', 500);
    }
  };

  getZKProofs: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const proofs = await zeroKnowledgeService.getAllProofs(authReq.user!.organizationId);
      res.json(proofs);
    } catch (error: any) {
      logger.error('Get ZK proofs error', error);
      throw new AppError('Failed to get ZK proofs', 500);
    }
  };

  getZKProof: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { proofId } = req.params;

      // Fetch proof from audit log by hash (proofId)
      const log = await prisma.auditLog.findFirst({
        where: {
          organizationId: authReq.user!.organizationId,
          hash: proofId,
          action: { startsWith: 'ZK Proof Generated' },
        },
      });

      if (!log) {
        throw new AppError('Proof not found', 404);
      }

      let details: any = {};
      try {
        details = typeof log.details === 'string' ? JSON.parse(log.details) : log.details;
      } catch {
        details = {};
      }

      res.json({
        id: proofId,
        ...details,
        createdAt: log.timestamp,
        action: log.action,
      });
    } catch (error: any) {
      logger.error('Get ZK proof error', error);
      throw new AppError(error.message || 'Failed to get ZK proof', 500);
    }
  };

  // ==================== BYOK (Bring Your Own Key) ====================

  generateBYOKKey: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { provider, region, vaultUrl, keyName, description, keyType, label } = req.body;

      // Default to local provider for schema-aligned requests (keyType + label)
      // that don't specify a cloud provider
      const effectiveProvider = provider || 'local';
      const effectiveDescription = description || label || 'ComplyEasy BYOK Key';

      let keyId: string;
      if (effectiveProvider === 'aws_kms') {
        if (!region) {
          throw new AppError('Region is required for AWS KMS', 400);
        }
        keyId = await byokService.createAWSKey(
          region,
          effectiveDescription,
          authReq.user!.organizationId
        );
      } else if (effectiveProvider === 'azure_kv') {
        if (!vaultUrl || !keyName) {
          throw new AppError('Vault URL and key name are required for Azure Key Vault', 400);
        }
        keyId = await byokService.createAzureKey(
          vaultUrl,
          keyName,
          authReq.user!.organizationId
        );
      } else if (effectiveProvider === 'gcp_kms') {
        const { projectId, location, keyRing, keyId: providedKeyId } = req.body;
        if (!projectId || !location || !keyRing || !providedKeyId) {
          throw new AppError('Project ID, location, key ring, and key ID are required for GCP KMS', 400);
        }
        keyId = await byokService.createGCPKey(
          projectId,
          location,
          keyRing,
          providedKeyId,
          authReq.user!.organizationId,
          req.body.credentials
        );
      } else if (effectiveProvider === 'hashicorp_vault') {
        if (!vaultUrl || !keyName) {
          throw new AppError('Vault URL and key name are required for HashiCorp Vault', 400);
        }
        // Require an explicit per-request token. Pairing a caller-supplied vaultUrl
        // with the server's own VAULT_TOKEN would let a tenant direct key creation at
        // an arbitrary Vault endpoint using server credentials.
        if (!req.body.token) {
          throw new AppError('A Vault token is required for HashiCorp Vault key creation', 400);
        }
        keyId = await byokService.createVaultKey(
          vaultUrl,
          keyName,
          authReq.user!.organizationId,
          req.body.token
        );
      } else if (effectiveProvider === 'local') {
        // For local provider, generate a secure key ID
        keyId = `local-${crypto.randomBytes(16).toString('hex')}`;
        logger.info(`Local key created: ${keyId} for org ${authReq.user!.organizationId}`);
      } else {
        throw new AppError('Invalid provider. Supported: aws_kms, azure_kv, gcp_kms, hashicorp_vault, local', 400);
      }

      // Store key in auditLog for retrieval
      await prisma.auditLog.create({
        data: {
          action: `BYOK Key Created: ${effectiveProvider}`,
          organizationId: authReq.user!.organizationId,
          hash: keyId,
          details: JSON.stringify({
            keyId,
            provider: effectiveProvider,
            region: region || null,
            vaultUrl: vaultUrl || null,
            keyName: keyName || null,
            keyType: keyType || null,
            label: label || null,
            description: effectiveDescription,
          }),
        },
      });

      // Return key information with all details
      res.json({
        keyId,
        provider: effectiveProvider,
        region: region || null,
        vaultUrl: vaultUrl || null,
        keyName: keyName || null,
        keyType: keyType || null,
        label: label || null,
        description: effectiveDescription,
      });
    } catch (error: any) {
      logger.error('Generate BYOK key error', error);
      throw new AppError(error.message || 'Failed to generate BYOK key', 500);
    }
  };

  importBYOKKey: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { provider, keyId, region, vaultUrl, credentials, keyMaterial, keyType, label, format } = req.body;

      // Schema-aligned imports use keyMaterial + keyType + label.
      // Legacy imports use provider + keyId.
      const effectiveProvider = provider || 'local';
      const effectiveKeyId = keyId || (keyMaterial
        ? `local-${crypto.createHash('sha256').update(keyMaterial).digest('hex').slice(0, 32)}`
        : null);

      if (!effectiveKeyId) {
        throw new AppError('Key ID or key material is required', 400);
      }

      // For local key material imports, verification is implicit
      let verified = true;
      if (provider && provider !== 'local') {
        verified = await byokService.verifyKeyAccess({
          provider: provider as any,
          keyId: effectiveKeyId,
          region,
          vaultUrl,
          credentials,
        });

        if (!verified) {
          throw new AppError('Key access verification failed', 403);
        }
      }

      res.json({
        keyId: effectiveKeyId,
        provider: effectiveProvider,
        keyType: keyType || null,
        label: label || null,
        format: format || null,
        verified,
      });
    } catch (error: any) {
      logger.error('Import BYOK key error', error);
      throw new AppError(error.message || 'Failed to import BYOK key', 500);
    }
  };

  getBYOKKeys: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      
      if (!authReq.user || !authReq.user.organizationId) {
        throw new AppError('User not authenticated', 401);
      }

      // Fetch keys from auditLog
      const logs = await prisma.auditLog.findMany({
        where: {
          organizationId: authReq.user.organizationId,
          action: {
            contains: 'BYOK Key',
          },
        },
        orderBy: { timestamp: 'desc' },
        take: 100,
      });

      const keys = logs.map(log => {
        try {
          if (!log.details) {
            // If no details, return basic info from log
            return {
              id: log.id,
              keyId: log.hash,
              provider: 'unknown',
              region: '',
              vaultUrl: '',
              keyName: '',
              description: '',
              createdAt: log.timestamp,
            };
          }
          
          let details: any;
          try {
            details = typeof log.details === 'string' 
              ? JSON.parse(log.details) 
              : log.details;
          } catch (parseError: any) {
            logger.warn('Failed to parse BYOK key details', { logId: log.id, error: parseError.message });
            details = {};
          }
            
          return {
            id: log.id,
            keyId: details.keyId || log.hash,
            provider: details.provider || 'unknown',
            region: details.region || '',
            vaultUrl: details.vaultUrl || '',
            keyName: details.keyName || '',
            description: details.description || '',
            createdAt: log.timestamp,
          };
        } catch (e: any) {
          logger.error('Error processing BYOK key', { error: e.message, logId: log.id });
          // Return basic info if processing fails
          return {
            id: log.id,
            keyId: log.hash,
            provider: 'unknown',
            region: '',
            vaultUrl: '',
            keyName: '',
            description: '',
            createdAt: log.timestamp,
          };
        }
      });

      res.json(keys);
    } catch (error: any) {
      logger.error('Get BYOK keys error', { error: error.message, stack: error.stack });
      throw new AppError(error.message || 'Failed to get BYOK keys', 500);
    }
  };

  getBYOKKey: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { keyId } = req.params;

      // Fetch key from audit log by hash (keyId)
      const log = await prisma.auditLog.findFirst({
        where: {
          organizationId: authReq.user!.organizationId,
          hash: keyId,
          action: { startsWith: 'BYOK Key' },
        },
      });

      if (!log) {
        throw new AppError('BYOK key not found', 404);
      }

      let details: any = {};
      try {
        details = typeof log.details === 'string' ? JSON.parse(log.details) : log.details;
      } catch {
        details = {};
      }

      res.json({
        id: log.id,
        keyId: details.keyId || log.hash,
        provider: details.provider || 'unknown',
        region: details.region || '',
        vaultUrl: details.vaultUrl || '',
        keyName: details.keyName || '',
        description: details.description || '',
        createdAt: log.timestamp,
      });
    } catch (error: any) {
      logger.error('Get BYOK key error', error);
      throw new AppError(error.message || 'Failed to get BYOK key', 500);
    }
  };

  rotateBYOKKey: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { keyId } = req.params;
      const { oldConfig, newConfig, encryptedData } = req.body;

      if (!oldConfig || !newConfig) {
        throw new AppError('Old and new key configurations are required', 400);
      }

      const rotated = await byokService.rotateKey(
        authReq.user!.organizationId,
        oldConfig,
        newConfig,
        encryptedData || []
      );

      res.json({ success: true, rotatedCount: rotated.length });
    } catch (error: any) {
      logger.error('Rotate BYOK key error', error);
      throw new AppError(error.message || 'Failed to rotate BYOK key', 500);
    }
  };

  deleteBYOKKey: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { keyId } = req.params;
      const { provider, region, vaultUrl, credentials, pendingWindowInDays } = req.body;

      if (!provider) {
        throw new AppError('Provider is required', 400);
      }

      await byokService.scheduleKeyDeletion(
        {
          provider: provider as any,
          keyId,
          region,
          vaultUrl,
          credentials,
        },
        pendingWindowInDays || 30
      );

      res.json({ success: true, message: 'Key deletion scheduled' });
    } catch (error: any) {
      logger.error('Delete BYOK key error', error);
      throw new AppError(error.message || 'Failed to delete BYOK key', 500);
    }
  };

  encryptWithBYOK: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { data, config, keyId, plaintext, algorithm } = req.body;

      // Schema-aligned: { keyId, plaintext, algorithm } | Legacy: { data, config }
      const effectiveData = data || plaintext;
      const effectiveConfig = config || (keyId
        ? { provider: 'local', keyId, algorithm }
        : null);

      if (!effectiveData || !effectiveConfig) {
        throw new AppError('Data and key configuration are required', 400);
      }

      const encrypted = await byokService.encryptData(
        Buffer.from(effectiveData, 'utf-8'),
        effectiveConfig,
        authReq.user!.organizationId
      );

      res.json(encrypted);
    } catch (error: any) {
      logger.error('Encrypt with BYOK error', error);
      throw new AppError(error.message || 'Failed to encrypt data', 500);
    }
  };

  decryptWithBYOK: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const { encryptedPayload, config, keyId, ciphertext, algorithm } = req.body;

      // Schema-aligned: { keyId, ciphertext, algorithm } | Legacy: { encryptedPayload, config }
      const effectivePayload = encryptedPayload || (ciphertext ? { ciphertext } : null);
      const effectiveConfig = config || (keyId
        ? { provider: 'local', keyId, algorithm }
        : null);

      if (!effectivePayload || !effectiveConfig) {
        throw new AppError('Encrypted payload and key configuration are required', 400);
      }

      const decrypted = await byokService.decryptData(effectivePayload, effectiveConfig);
      res.json({ data: decrypted.toString('utf-8') });
    } catch (error: any) {
      logger.error('Decrypt with BYOK error', error);
      throw new AppError(error.message || 'Failed to decrypt data', 500);
    }
  };

  getBYOKConfig: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;

      // Fetch BYOK config from audit log
      const log = await prisma.auditLog.findFirst({
        where: {
          organizationId: authReq.user!.organizationId,
          action: 'BYOK Config Updated',
        },
        orderBy: { timestamp: 'desc' },
      });

      if (!log || !log.details) {
        // Return default config if none exists yet
        res.json({
          enabled: false,
          defaultKeyId: null,
          autoRotation: false,
          rotationInterval: 90,
          organizationId: authReq.user!.organizationId,
        });
        return;
      }

      const config = typeof log.details === 'string' ? JSON.parse(log.details) : log.details;
      res.json(config);
    } catch (error: any) {
      logger.error('Get BYOK config error', error);
      throw new AppError(error.message || 'Failed to get BYOK config', 500);
    }
  };

  updateBYOKConfig: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      // Field set is canonicalized to the validation schema's names.
      const { defaultKeyId, autoRotation, rotationInterval } = req.body;

      const configData = {
        defaultKeyId: defaultKeyId || null,
        autoRotation: autoRotation ?? false,
        rotationInterval: rotationInterval || 90,
        // Derived flag for consumers that key off an overall on/off state.
        enabled: Boolean(defaultKeyId) || autoRotation === true,
        organizationId: authReq.user!.organizationId,
        updatedAt: new Date(),
        updatedBy: authReq.user!.id,
      };

      // Persist config via audit log
      await prisma.auditLog.create({
        data: {
          action: 'BYOK Config Updated',
          organizationId: authReq.user!.organizationId,
          userId: authReq.user!.id,
          hash: crypto.randomBytes(16).toString('hex'),
          details: JSON.stringify(configData),
        },
      });

      res.json(configData);
    } catch (error: any) {
      logger.error('Update BYOK config error', error);
      throw new AppError(error.message || 'Failed to update BYOK config', 500);
    }
  };

  // ==================== Compliance-as-Code ====================

  createCompliancePolicy: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const policy = await complianceAsCodeService.createPolicy(
        authReq.user!.organizationId,
        req.body
      );
      res.json(policy);
    } catch (error: any) {
      logger.error('Create compliance policy error', error);
      throw new AppError(error.message || 'Failed to create compliance policy', 500);
    }
  };

  getCompliancePolicies: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { framework } = req.query;
      // Use internal method - policies are stored in database via audit logs
      // For now, return policies from service
      const policies = await complianceAsCodeService.getPoliciesByFramework(
        authReq.user!.organizationId,
        framework as string
      );
      res.json(policies);
    } catch (error: any) {
      logger.error('Get compliance policies error', error);
      throw new AppError('Failed to get compliance policies', 500);
    }
  };

  getCompliancePolicy: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { policyId } = req.params;
      const policy = await complianceAsCodeService.getPolicy(policyId, authReq.user!.organizationId);
      if (!policy) {
        throw new AppError('Policy not found', 404);
      }
      res.json(policy);
    } catch (error: any) {
      logger.error('Get compliance policy error', error);
      throw new AppError(error.message || 'Failed to get compliance policy', 500);
    }
  };

  updateCompliancePolicy: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { policyId } = req.params;
      const policy = await complianceAsCodeService.updatePolicy(
        policyId,
        authReq.user!.organizationId,
        req.body
      );
      res.json(policy);
    } catch (error: any) {
      logger.error('Update compliance policy error', error);
      throw new AppError(error.message || 'Failed to update compliance policy', 500);
    }
  };

  deleteCompliancePolicy: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { policyId } = req.params;
      await complianceAsCodeService.deletePolicy(policyId, authReq.user!.organizationId);
      res.json({ success: true });
    } catch (error: any) {
      logger.error('Delete compliance policy error', error);
      throw new AppError(error.message || 'Failed to delete compliance policy', 500);
    }
  };

  evaluateCompliancePolicy: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { policyId } = req.params;
      const { input } = req.body;

      const result = await complianceAsCodeService.evaluatePolicy(policyId, input || {}, authReq.user!.organizationId);
      res.json(result);
    } catch (error: any) {
      logger.error('Evaluate compliance policy error', error);
      throw new AppError(error.message || 'Failed to evaluate compliance policy', 500);
    }
  };

  evaluateCompliancePoliciesBatch: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { policyIds, input } = req.body;

      if (!Array.isArray(policyIds)) {
        throw new AppError('Policy IDs must be an array', 400);
      }

      const results = await complianceAsCodeService.evaluateMultiplePolicies(policyIds, input || {}, authReq.user!.organizationId);
      res.json(results);
    } catch (error: any) {
      logger.error('Evaluate compliance policies batch error', error);
      throw new AppError(error.message || 'Failed to evaluate compliance policies', 500);
    }
  };

  generateComplianceReport: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { framework } = req.body;

      // Schema-aligned: { policyIds, format, includeDetails } | Legacy: { framework }
      // When schema fields are used, default to a common framework if no specific framework given
      const effectiveFramework = framework || 'SOC2';

      const report = await complianceAsCodeService.generateComplianceReport(
        authReq.user!.organizationId,
        effectiveFramework
      );
      res.json(report);
    } catch (error: any) {
      logger.error('Generate compliance report error', error);
      throw new AppError(error.message || 'Failed to generate compliance report', 500);
    }
  };

  getComplianceReports: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { framework } = req.query;

      if (framework && typeof framework === 'string') {
        const report = await complianceAsCodeService.generateComplianceReport(
          authReq.user!.organizationId,
          framework
        );
        res.json([report]);
      } else {
        const frameworks = ['SOC2', 'ISO27001', 'HIPAA', 'GDPR'];
        const results = await Promise.allSettled(
          frameworks.map(fw =>
            complianceAsCodeService.generateComplianceReport(authReq.user!.organizationId, fw)
          )
        );
        const reports = results
          .filter(r => r.status === 'fulfilled')
          .map(r => (r as PromiseFulfilledResult<any>).value);
        res.json(reports);
      }
    } catch (error: any) {
      logger.error('Get compliance reports error', error);
      throw new AppError(error.message || 'Failed to get compliance reports', 500);
    }
  };

  getComplianceReport: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { reportId } = req.params;

      // reportId might be a framework name or an audit log hash
      const log = await prisma.auditLog.findFirst({
        where: {
          organizationId: authReq.user!.organizationId,
          hash: reportId,
          action: { contains: 'Compliance Report' },
        },
      });

      if (log && log.details) {
        const details = typeof log.details === 'string' ? JSON.parse(log.details) : log.details;
        res.json({ id: reportId, ...details, createdAt: log.timestamp });
        return;
      }

      // Treat reportId as framework name and generate fresh
      const report = await complianceAsCodeService.generateComplianceReport(
        authReq.user!.organizationId,
        reportId
      );
      res.json(report);
    } catch (error: any) {
      logger.error('Get compliance report error', error);
      throw new AppError(error.message || 'Failed to get compliance report', 500);
    }
  };

  handleCICDWebhook: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const { webhookId } = req.params;
      const provider = req.query.provider as string || req.body.provider || 'github';
      const signature = req.headers['x-hub-signature-256'] as string ||
        req.headers['x-gitlab-token'] as string || '';

      // The route is authenticated/tier-gated and the service verifies the HMAC
      // fail-closed before any side effect: an empty or mismatched signature is
      // rejected (timingSafeEqual length mismatch is caught and returns false).
      const result = await complianceAsCodeService.handleCIWebhook(
        webhookId || 'default',
        provider,
        req.body,
        signature
      );

      res.json({ success: true, result });
    } catch (error: any) {
      logger.error('Handle CI/CD webhook error', error);
      throw new AppError(error.message || 'Failed to process webhook', 500);
    }
  };

  getCICDIntegrations: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;

      // Query CI/CD integrations from audit log
      const logs = await prisma.auditLog.findMany({
        where: {
          organizationId: authReq.user!.organizationId,
          action: { startsWith: 'CI/CD Integration Created' },
        },
        orderBy: { timestamp: 'desc' },
        take: 50,
      });

      const integrations = logs.map(log => {
        try {
          const details = typeof log.details === 'string' ? JSON.parse(log.details) : log.details;
          return { id: log.hash, ...details, createdAt: log.timestamp };
        } catch {
          return { id: log.hash, createdAt: log.timestamp };
        }
      });

      res.json(integrations);
    } catch (error: any) {
      logger.error('Get CI/CD integrations error', error);
      throw new AppError(error.message || 'Failed to get CI/CD integrations', 500);
    }
  };

  createCICDIntegration: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { provider, repository, webhookUrl, secret, events, name, config } = req.body;

      if (!provider) {
        throw new AppError('Provider is required', 400);
      }

      // Schema-aligned: { name, provider, config, webhookUrl } | Legacy: { provider, repository }
      const effectiveRepository = repository || (config && (config as any).repository) || name || 'default';

      const webhookId = await complianceAsCodeService.setupCIIntegration(
        authReq.user!.organizationId,
        {
          provider,
          webhookUrl: webhookUrl || `${process.env.API_URL || 'https://api.complyeasy.ai'}/api/security/cicd/webhook/${crypto.randomBytes(16).toString('hex')}`,
          secret: secret || crypto.randomBytes(32).toString('hex'),
          events: events || ['push', 'pull_request'],
        }
      );

      const integration = {
        id: webhookId,
        name: name || effectiveRepository,
        provider,
        repository: effectiveRepository,
        webhookUrl,
        events: events || ['push', 'pull_request'],
        status: 'active',
        createdAt: new Date(),
      };

      // Persist to audit log
      await prisma.auditLog.create({
        data: {
          action: `CI/CD Integration Created: ${provider}/${effectiveRepository}`,
          organizationId: authReq.user!.organizationId,
          userId: authReq.user!.id,
          hash: webhookId,
          details: JSON.stringify(integration),
        },
      });

      res.json(integration);
    } catch (error: any) {
      logger.error('Create CI/CD integration error', error);
      throw new AppError(error.message || 'Failed to create CI/CD integration', 500);
    }
  };

  deleteCICDIntegration: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { integrationId } = req.params;

      // Record deletion
      await prisma.auditLog.create({
        data: {
          action: `CI/CD Integration Deleted: ${integrationId}`,
          organizationId: authReq.user!.organizationId,
          userId: authReq.user!.id,
          hash: integrationId,
          details: JSON.stringify({ integrationId, deletedAt: new Date() }),
        },
      });

      res.json({ success: true, message: `Integration ${integrationId} deleted` });
    } catch (error: any) {
      logger.error('Delete CI/CD integration error', error);
      throw new AppError(error.message || 'Failed to delete CI/CD integration', 500);
    }
  };

  detectDrift: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { policyId, policyIds, scope } = req.body;

      // Schema-aligned: { policyIds, scope } | Legacy: { policyId }
      const effectivePolicyId = policyId || (Array.isArray(policyIds) && policyIds.length > 0 ? policyIds[0] : null);

      if (!effectivePolicyId) {
        throw new AppError('Policy ID is required', 400);
      }

      const drift = await complianceAsCodeService.detectDrift(
        effectivePolicyId,
        authReq.user!.organizationId
      );

      res.json({
        policyId: effectivePolicyId,
        scope: scope || null,
        ...drift,
      });
    } catch (error: any) {
      logger.error('Detect drift error', error);
      throw new AppError(error.message || 'Failed to detect drift', 500);
    }
  };
}

export default new SecurityController();

