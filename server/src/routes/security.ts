/**
 * Security Features Routes
 * Zero Trust, Zero-Knowledge Proofs, BYOK, Compliance-as-Code
 */

import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { asyncHandler } from '../types/express';
import securityController from '../controllers/securityController';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Zero Trust Security
router.post('/zero-trust/verify-device', asyncHandler(securityController.verifyDeviceTrust));
router.post('/zero-trust/evaluate-access', asyncHandler(securityController.evaluateAccessRequest));
router.post('/zero-trust/policies', authorize('admin'), asyncHandler(securityController.createZeroTrustPolicy));
router.get('/zero-trust/policies', asyncHandler(securityController.getZeroTrustPolicies));
router.get('/zero-trust/policies/:policyId', asyncHandler(securityController.getZeroTrustPolicy));
router.patch('/zero-trust/policies/:policyId', authorize('admin'), asyncHandler(securityController.updateZeroTrustPolicy));
router.delete('/zero-trust/policies/:policyId', authorize('admin'), asyncHandler(securityController.deleteZeroTrustPolicy));
router.get('/zero-trust/devices', asyncHandler(securityController.getDeviceTrusts));
router.get('/zero-trust/devices/:deviceId', asyncHandler(securityController.getDeviceTrust));
router.post('/zero-trust/network-segments', authorize('admin'), asyncHandler(securityController.createNetworkSegment));
router.get('/zero-trust/network-segments', asyncHandler(securityController.getNetworkSegments));
router.post('/zero-trust/continuous-verify', asyncHandler(securityController.continuousVerification));

// Zero-Knowledge Proofs
router.post('/zkp/compliance-proof/generate', authorize('admin', 'editor'), asyncHandler(securityController.generateComplianceProof));
router.post('/zkp/compliance-proof/verify', asyncHandler(securityController.verifyComplianceProof));
router.post('/zkp/credential-proof/generate', authorize('admin', 'editor'), asyncHandler(securityController.generateCredentialProof));
router.post('/zkp/credential-proof/verify', asyncHandler(securityController.verifyCredentialProof));
router.post('/zkp/ownership-proof/generate', authorize('admin', 'editor'), asyncHandler(securityController.generateOwnershipProof));
router.post('/zkp/ownership-proof/verify', asyncHandler(securityController.verifyOwnershipProof));
router.get('/zkp/proofs', asyncHandler(securityController.getZKProofs));
router.get('/zkp/proofs/:proofId', asyncHandler(securityController.getZKProof));

// BYOK (Bring Your Own Key)
router.post('/byok/keys/generate', authorize('admin'), asyncHandler(securityController.generateBYOKKey));
router.post('/byok/keys/import', authorize('admin'), asyncHandler(securityController.importBYOKKey));
router.get('/byok/keys', authorize('admin'), asyncHandler(securityController.getBYOKKeys));
router.get('/byok/keys/:keyId', authorize('admin'), asyncHandler(securityController.getBYOKKey));
router.post('/byok/keys/:keyId/rotate', authorize('admin'), asyncHandler(securityController.rotateBYOKKey));
router.delete('/byok/keys/:keyId', authorize('admin'), asyncHandler(securityController.deleteBYOKKey));
router.post('/byok/encrypt', authorize('admin', 'editor'), asyncHandler(securityController.encryptWithBYOK));
router.post('/byok/decrypt', authorize('admin', 'editor'), asyncHandler(securityController.decryptWithBYOK));
router.get('/byok/config', authorize('admin'), asyncHandler(securityController.getBYOKConfig));
router.post('/byok/config', authorize('admin'), asyncHandler(securityController.updateBYOKConfig));

// Compliance-as-Code
router.post('/compliance-as-code/policies', authorize('admin', 'editor'), asyncHandler(securityController.createCompliancePolicy));
router.get('/compliance-as-code/policies', asyncHandler(securityController.getCompliancePolicies));
router.get('/compliance-as-code/policies/:policyId', asyncHandler(securityController.getCompliancePolicy));
router.patch('/compliance-as-code/policies/:policyId', authorize('admin', 'editor'), asyncHandler(securityController.updateCompliancePolicy));
router.delete('/compliance-as-code/policies/:policyId', authorize('admin'), asyncHandler(securityController.deleteCompliancePolicy));
router.post('/compliance-as-code/policies/:policyId/evaluate', authorize('admin', 'editor'), asyncHandler(securityController.evaluateCompliancePolicy));
router.post('/compliance-as-code/policies/evaluate-batch', authorize('admin', 'editor'), asyncHandler(securityController.evaluateCompliancePoliciesBatch));
router.post('/compliance-as-code/reports/generate', authorize('admin', 'editor'), asyncHandler(securityController.generateComplianceReport));
router.get('/compliance-as-code/reports', asyncHandler(securityController.getComplianceReports));
router.get('/compliance-as-code/reports/:reportId', asyncHandler(securityController.getComplianceReport));
router.post('/compliance-as-code/ci-cd/webhook', asyncHandler(securityController.handleCICDWebhook));
router.get('/compliance-as-code/ci-cd/integrations', authorize('admin'), asyncHandler(securityController.getCICDIntegrations));
router.post('/compliance-as-code/ci-cd/integrations', authorize('admin'), asyncHandler(securityController.createCICDIntegration));
router.delete('/compliance-as-code/ci-cd/integrations/:integrationId', authorize('admin'), asyncHandler(securityController.deleteCICDIntegration));
router.post('/compliance-as-code/drift/detect', authorize('admin', 'editor'), asyncHandler(securityController.detectDrift));

export default router;

