/**
 * Security Features Routes
 * Zero Trust, Zero-Knowledge Proofs, BYOK, Compliance-as-Code
 * All security features require Visionary tier
 */

import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { asyncHandler } from '../types/express';
import securityController from '../controllers/securityController';
import { requireVisionaryFeature } from '../middleware/tierMiddleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Zero Trust Security (Visionary tier)
router.post('/zero-trust/verify-device', ...requireVisionaryFeature('zeroTrustSecurity'), asyncHandler(securityController.verifyDeviceTrust));
router.post('/zero-trust/evaluate-access', ...requireVisionaryFeature('zeroTrustSecurity'), asyncHandler(securityController.evaluateAccessRequest));
router.post('/zero-trust/policies', ...requireVisionaryFeature('zeroTrustSecurity'), authorize('admin'), asyncHandler(securityController.createZeroTrustPolicy));
router.get('/zero-trust/policies', ...requireVisionaryFeature('zeroTrustSecurity'), asyncHandler(securityController.getZeroTrustPolicies));
router.get('/zero-trust/policies/:policyId', ...requireVisionaryFeature('zeroTrustSecurity'), asyncHandler(securityController.getZeroTrustPolicy));
router.patch('/zero-trust/policies/:policyId', ...requireVisionaryFeature('zeroTrustSecurity'), authorize('admin'), asyncHandler(securityController.updateZeroTrustPolicy));
router.delete('/zero-trust/policies/:policyId', ...requireVisionaryFeature('zeroTrustSecurity'), authorize('admin'), asyncHandler(securityController.deleteZeroTrustPolicy));
router.get('/zero-trust/devices', ...requireVisionaryFeature('zeroTrustSecurity'), asyncHandler(securityController.getDeviceTrusts));
router.get('/zero-trust/devices/:deviceId', ...requireVisionaryFeature('zeroTrustSecurity'), asyncHandler(securityController.getDeviceTrust));
router.post('/zero-trust/network-segments', ...requireVisionaryFeature('zeroTrustSecurity'), authorize('admin'), asyncHandler(securityController.createNetworkSegment));
router.get('/zero-trust/network-segments', ...requireVisionaryFeature('zeroTrustSecurity'), asyncHandler(securityController.getNetworkSegments));
router.post('/zero-trust/continuous-verify', ...requireVisionaryFeature('zeroTrustSecurity'), asyncHandler(securityController.continuousVerification));

// Zero-Knowledge Proofs (Visionary tier)
router.post('/zkp/compliance-proof/generate', ...requireVisionaryFeature('zkProofs'), authorize('admin', 'editor'), asyncHandler(securityController.generateComplianceProof));
router.post('/zkp/compliance-proof/verify', ...requireVisionaryFeature('zkProofs'), asyncHandler(securityController.verifyComplianceProof));
router.post('/zkp/credential-proof/generate', ...requireVisionaryFeature('zkProofs'), authorize('admin', 'editor'), asyncHandler(securityController.generateCredentialProof));
router.post('/zkp/credential-proof/verify', ...requireVisionaryFeature('zkProofs'), asyncHandler(securityController.verifyCredentialProof));
router.post('/zkp/ownership-proof/generate', ...requireVisionaryFeature('zkProofs'), authorize('admin', 'editor'), asyncHandler(securityController.generateOwnershipProof));
router.post('/zkp/ownership-proof/verify', ...requireVisionaryFeature('zkProofs'), asyncHandler(securityController.verifyOwnershipProof));
router.get('/zkp/proofs', ...requireVisionaryFeature('zkProofs'), asyncHandler(securityController.getZKProofs));
router.get('/zkp/proofs/:proofId', ...requireVisionaryFeature('zkProofs'), asyncHandler(securityController.getZKProof));

// BYOK (Bring Your Own Key) (Visionary tier)
router.post('/byok/keys/generate', ...requireVisionaryFeature('byokEncryption'), authorize('admin'), asyncHandler(securityController.generateBYOKKey));
router.post('/byok/keys/import', ...requireVisionaryFeature('byokEncryption'), authorize('admin'), asyncHandler(securityController.importBYOKKey));
router.get('/byok/keys', ...requireVisionaryFeature('byokEncryption'), authorize('admin'), asyncHandler(securityController.getBYOKKeys));
router.get('/byok/keys/:keyId', ...requireVisionaryFeature('byokEncryption'), authorize('admin'), asyncHandler(securityController.getBYOKKey));
router.post('/byok/keys/:keyId/rotate', ...requireVisionaryFeature('byokEncryption'), authorize('admin'), asyncHandler(securityController.rotateBYOKKey));
router.delete('/byok/keys/:keyId', ...requireVisionaryFeature('byokEncryption'), authorize('admin'), asyncHandler(securityController.deleteBYOKKey));
router.post('/byok/encrypt', ...requireVisionaryFeature('byokEncryption'), authorize('admin', 'editor'), asyncHandler(securityController.encryptWithBYOK));
router.post('/byok/decrypt', ...requireVisionaryFeature('byokEncryption'), authorize('admin', 'editor'), asyncHandler(securityController.decryptWithBYOK));
router.get('/byok/config', ...requireVisionaryFeature('byokEncryption'), authorize('admin'), asyncHandler(securityController.getBYOKConfig));
router.post('/byok/config', ...requireVisionaryFeature('byokEncryption'), authorize('admin'), asyncHandler(securityController.updateBYOKConfig));

// Compliance-as-Code (Visionary tier)
router.post('/compliance-as-code/policies', ...requireVisionaryFeature('complianceAsCode'), authorize('admin', 'editor'), asyncHandler(securityController.createCompliancePolicy));
router.get('/compliance-as-code/policies', ...requireVisionaryFeature('complianceAsCode'), asyncHandler(securityController.getCompliancePolicies));
router.get('/compliance-as-code/policies/:policyId', ...requireVisionaryFeature('complianceAsCode'), asyncHandler(securityController.getCompliancePolicy));
router.patch('/compliance-as-code/policies/:policyId', ...requireVisionaryFeature('complianceAsCode'), authorize('admin', 'editor'), asyncHandler(securityController.updateCompliancePolicy));
router.delete('/compliance-as-code/policies/:policyId', ...requireVisionaryFeature('complianceAsCode'), authorize('admin'), asyncHandler(securityController.deleteCompliancePolicy));
router.post('/compliance-as-code/policies/:policyId/evaluate', ...requireVisionaryFeature('complianceAsCode'), authorize('admin', 'editor'), asyncHandler(securityController.evaluateCompliancePolicy));
router.post('/compliance-as-code/policies/evaluate-batch', ...requireVisionaryFeature('complianceAsCode'), authorize('admin', 'editor'), asyncHandler(securityController.evaluateCompliancePoliciesBatch));
router.post('/compliance-as-code/reports/generate', ...requireVisionaryFeature('complianceAsCode'), authorize('admin', 'editor'), asyncHandler(securityController.generateComplianceReport));
router.get('/compliance-as-code/reports', ...requireVisionaryFeature('complianceAsCode'), asyncHandler(securityController.getComplianceReports));
router.get('/compliance-as-code/reports/:reportId', ...requireVisionaryFeature('complianceAsCode'), asyncHandler(securityController.getComplianceReport));
router.post('/compliance-as-code/ci-cd/webhook', ...requireVisionaryFeature('complianceAsCode'), asyncHandler(securityController.handleCICDWebhook));
router.get('/compliance-as-code/ci-cd/integrations', ...requireVisionaryFeature('complianceAsCode'), authorize('admin'), asyncHandler(securityController.getCICDIntegrations));
router.post('/compliance-as-code/ci-cd/integrations', ...requireVisionaryFeature('complianceAsCode'), authorize('admin'), asyncHandler(securityController.createCICDIntegration));
router.delete('/compliance-as-code/ci-cd/integrations/:integrationId', ...requireVisionaryFeature('complianceAsCode'), authorize('admin'), asyncHandler(securityController.deleteCICDIntegration));
router.post('/compliance-as-code/drift/detect', ...requireVisionaryFeature('complianceAsCode'), authorize('admin', 'editor'), asyncHandler(securityController.detectDrift));

export default router;
