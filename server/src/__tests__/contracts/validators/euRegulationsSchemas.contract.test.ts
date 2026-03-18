import { describe, it, expect } from '@jest/globals';
import {
  // EU AI Act (4)
  registerAISystemSchema,
  updateAISystemSchema,
  conductAIRiskAssessmentSchema,
  generateTransparencyReportSchema,
  // DMA (4)
  registerGatekeeperSchema,
  updateGatekeeperSchema,
  updateObligationComplianceSchema,
  generateDMAComplianceReportSchema,
  // DSA (8 + 2 extra = 10 total)
  registerPlatformSchema,
  updatePlatformSchema,
  recordContentModerationSchema,
  reportIllegalContentSchema,
  processIllegalContentReportSchema,
  addAdToRepositorySchema,
  generateDSATransparencyReportSchema,
  conductDSARiskAssessmentSchema,
  updateDSARiskAssessmentSchema,
  configureNonPersonalizedFeedSchema,
  updateNonPersonalizedFeedStatusSchema,
} from '../../../validators/euRegulationsSchemas';

const JOI_OPTS = { abortEarly: false, stripUnknown: true, convert: true } as const;
const STRICT_OPTS = { abortEarly: false, convert: true } as const;

const XSS = '<script>alert(1)</script>';
const SQL_INJ = "' OR 1=1; DROP TABLE users; --";

describe('euRegulationsSchemas contract tests', () => {
  // ==========================================================================
  // EU AI ACT
  // ==========================================================================

  // --- 1. registerAISystemSchema ---
  describe('registerAISystemSchema', () => {
    const valid = {
      name: 'Face Recognition System',
      description: 'Biometric identification for access control.',
      useCase: 'Building security access',
      targetUsers: ['Security Staff'],
      dataTypes: ['Biometric'],
      decisionMaking: true,
      biometricProcessing: true,
    };

    it('should accept valid payload', () => {
      const { error } = registerAISystemSchema.validate(valid, JOI_OPTS);
      expect(error).toBeUndefined();
    });

    it('should reject missing name', () => {
      const { name, ...rest } = valid;
      const { error } = registerAISystemSchema.validate(rest, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should reject missing description', () => {
      const { description, ...rest } = valid;
      const { error } = registerAISystemSchema.validate(rest, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should reject missing useCase', () => {
      const { useCase, ...rest } = valid;
      const { error } = registerAISystemSchema.validate(rest, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should reject missing targetUsers', () => {
      const { targetUsers, ...rest } = valid;
      const { error } = registerAISystemSchema.validate(rest, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should reject empty targetUsers array', () => {
      const { error } = registerAISystemSchema.validate({ ...valid, targetUsers: [] }, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should reject missing dataTypes', () => {
      const { dataTypes, ...rest } = valid;
      const { error } = registerAISystemSchema.validate(rest, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should reject empty dataTypes array', () => {
      const { error } = registerAISystemSchema.validate({ ...valid, dataTypes: [] }, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should reject missing decisionMaking', () => {
      const { decisionMaking, ...rest } = valid;
      const { error } = registerAISystemSchema.validate(rest, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should reject missing biometricProcessing', () => {
      const { biometricProcessing, ...rest } = valid;
      const { error } = registerAISystemSchema.validate(rest, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should reject name > 300 chars', () => {
      const { error } = registerAISystemSchema.validate({ ...valid, name: 'x'.repeat(301) }, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should reject description > 5000 chars', () => {
      const { error } = registerAISystemSchema.validate({ ...valid, description: 'x'.repeat(5001) }, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should reject useCase > 1000 chars', () => {
      const { error } = registerAISystemSchema.validate({ ...valid, useCase: 'x'.repeat(1001) }, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should reject targetUsers item > 200 chars', () => {
      const { error } = registerAISystemSchema.validate({ ...valid, targetUsers: ['x'.repeat(201)] }, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should reject unknown fields even with stripUnknown (unknown(false))', () => {
      const { error } = registerAISystemSchema.validate({ ...valid, extra: 'bad' }, JOI_OPTS);
      expect(error).toBeDefined();
      expect(error!.details.some((d) => d.type === 'object.unknown')).toBe(true);
    });

    it('should reject unknown fields in strict mode', () => {
      const { error } = registerAISystemSchema.validate({ ...valid, extra: 'bad' }, STRICT_OPTS);
      expect(error).toBeDefined();
    });

    it('should handle XSS in name', () => {
      const { error } = registerAISystemSchema.validate({ ...valid, name: XSS }, JOI_OPTS);
      expect(error).toBeUndefined();
    });
  });

  // --- 2. updateAISystemSchema ---
  describe('updateAISystemSchema (EU)', () => {
    it('should accept partial update', () => {
      const { error } = updateAISystemSchema.validate({ name: 'Updated' }, JOI_OPTS);
      expect(error).toBeUndefined();
    });

    it('should reject empty object', () => {
      const { error } = updateAISystemSchema.validate({}, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it.each(['compliant', 'non_compliant', 'in_review', 'at_risk'])(
      'should accept complianceStatus=%s',
      (complianceStatus) => {
        const { error } = updateAISystemSchema.validate({ complianceStatus }, JOI_OPTS);
        expect(error).toBeUndefined();
      },
    );

    it('should reject invalid complianceStatus', () => {
      const { error } = updateAISystemSchema.validate({ complianceStatus: 'pending' }, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should accept euDatabaseRegistrationId', () => {
      const { error } = updateAISystemSchema.validate({ euDatabaseRegistrationId: 'EU-2026-001' }, JOI_OPTS);
      expect(error).toBeUndefined();
    });
  });

  // --- 3. conductAIRiskAssessmentSchema ---
  describe('conductAIRiskAssessmentSchema', () => {
    it('should accept empty object (all fields default to [])', () => {
      const { error, value } = conductAIRiskAssessmentSchema.validate({}, JOI_OPTS);
      expect(error).toBeUndefined();
      expect(value!.safetyRisks).toEqual([]);
      expect(value!.fundamentalRightsRisks).toEqual([]);
    });

    it('should accept full payload', () => {
      const { error } = conductAIRiskAssessmentSchema.validate({
        safetyRisks: ['Physical harm'],
        fundamentalRightsRisks: ['Privacy violation'],
        discriminationRisks: ['Bias in hiring'],
        privacyRisks: ['Data leak'],
        mitigationMeasures: ['Encrypt data'],
        recommendations: ['Annual review'],
      }, JOI_OPTS);
      expect(error).toBeUndefined();
    });

    it('should reject array item > 500 chars', () => {
      const { error } = conductAIRiskAssessmentSchema.validate({
        safetyRisks: ['x'.repeat(501)],
      }, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should reject unknown fields (unknown(false))', () => {
      const { error } = conductAIRiskAssessmentSchema.validate({ extra: 'bad' }, JOI_OPTS);
      expect(error).toBeDefined();
      expect(error!.details.some((d) => d.type === 'object.unknown')).toBe(true);
    });
  });

  // --- 4. generateTransparencyReportSchema ---
  describe('generateTransparencyReportSchema', () => {
    const valid = {
      reportingPeriod: {
        start: '2026-01-01T00:00:00.000Z',
        end: '2026-06-30T00:00:00.000Z',
      },
    };

    it('should accept valid payload', () => {
      const { error } = generateTransparencyReportSchema.validate(valid, JOI_OPTS);
      expect(error).toBeUndefined();
    });

    it('should reject missing reportingPeriod', () => {
      const { error } = generateTransparencyReportSchema.validate({}, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should reject missing start date', () => {
      const { error } = generateTransparencyReportSchema.validate({
        reportingPeriod: { end: '2026-06-30T00:00:00.000Z' },
      }, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should reject missing end date', () => {
      const { error } = generateTransparencyReportSchema.validate({
        reportingPeriod: { start: '2026-01-01T00:00:00.000Z' },
      }, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should reject end date before start date', () => {
      const { error } = generateTransparencyReportSchema.validate({
        reportingPeriod: {
          start: '2026-06-30T00:00:00.000Z',
          end: '2026-01-01T00:00:00.000Z',
        },
      }, JOI_OPTS);
      expect(error).toBeDefined();
    });
  });

  // ==========================================================================
  // DMA
  // ==========================================================================

  // --- 5. registerGatekeeperSchema ---
  describe('registerGatekeeperSchema', () => {
    const valid = {
      platformName: 'SuperPlatform',
      corePlatformServices: ['online_search'],
    };

    it('should accept valid payload', () => {
      const { error } = registerGatekeeperSchema.validate(valid, JOI_OPTS);
      expect(error).toBeUndefined();
    });

    it('should reject missing platformName', () => {
      const { error } = registerGatekeeperSchema.validate({ corePlatformServices: ['online_search'] }, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should reject missing corePlatformServices', () => {
      const { error } = registerGatekeeperSchema.validate({ platformName: 'X' }, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should reject empty corePlatformServices', () => {
      const { error } = registerGatekeeperSchema.validate({ platformName: 'X', corePlatformServices: [] }, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it.each([
      'online_intermediation', 'online_search', 'social_networking', 'video_sharing',
      'number_independent_communications', 'operating_systems', 'web_browsers',
      'virtual_assistants', 'cloud_computing', 'online_advertising',
    ])('should accept corePlatformService=%s', (svc) => {
      const { error } = registerGatekeeperSchema.validate({ platformName: 'X', corePlatformServices: [svc] }, JOI_OPTS);
      expect(error).toBeUndefined();
    });

    it('should reject invalid corePlatformService value', () => {
      const { error } = registerGatekeeperSchema.validate({ platformName: 'X', corePlatformServices: ['invalid_service'] }, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should accept optional annualRevenue', () => {
      const { error } = registerGatekeeperSchema.validate({ ...valid, annualRevenue: 1000000 }, JOI_OPTS);
      expect(error).toBeUndefined();
    });

    it('should reject negative annualRevenue', () => {
      const { error } = registerGatekeeperSchema.validate({ ...valid, annualRevenue: -1 }, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should reject negative monthlyActiveUsers', () => {
      const { error } = registerGatekeeperSchema.validate({ ...valid, monthlyActiveUsers: -1 }, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should accept monthlyActiveUsers = 0', () => {
      const { error } = registerGatekeeperSchema.validate({ ...valid, monthlyActiveUsers: 0 }, JOI_OPTS);
      expect(error).toBeUndefined();
    });
  });

  // --- 6. updateGatekeeperSchema ---
  describe('updateGatekeeperSchema', () => {
    it('should accept partial update', () => {
      const { error } = updateGatekeeperSchema.validate({ platformName: 'Updated' }, JOI_OPTS);
      expect(error).toBeUndefined();
    });

    it('should reject empty object', () => {
      const { error } = updateGatekeeperSchema.validate({}, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it.each(['not_designated', 'designated', 'under_review'])(
      'should accept designationStatus=%s',
      (designationStatus) => {
        const { error } = updateGatekeeperSchema.validate({ designationStatus }, JOI_OPTS);
        expect(error).toBeUndefined();
      },
    );

    it('should reject invalid designationStatus', () => {
      const { error } = updateGatekeeperSchema.validate({ designationStatus: 'unknown' }, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it.each(['compliant', 'non_compliant', 'in_review'])(
      'should accept complianceStatus=%s',
      (complianceStatus) => {
        const { error } = updateGatekeeperSchema.validate({ complianceStatus }, JOI_OPTS);
        expect(error).toBeUndefined();
      },
    );
  });

  // --- 7. updateObligationComplianceSchema ---
  describe('updateObligationComplianceSchema', () => {
    it('should accept valid payload', () => {
      const { error } = updateObligationComplianceSchema.validate({ status: 'compliant' }, JOI_OPTS);
      expect(error).toBeUndefined();
    });

    it('should reject missing status', () => {
      const { error } = updateObligationComplianceSchema.validate({}, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it.each(['pending', 'compliant', 'non_compliant', 'in_progress'])(
      'should accept status=%s',
      (status) => {
        const { error } = updateObligationComplianceSchema.validate({ status }, JOI_OPTS);
        expect(error).toBeUndefined();
      },
    );

    it('should reject invalid status', () => {
      const { error } = updateObligationComplianceSchema.validate({ status: 'done' }, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should accept evidence as any type', () => {
      const { error } = updateObligationComplianceSchema.validate({ status: 'compliant', evidence: 'doc.pdf' }, JOI_OPTS);
      expect(error).toBeUndefined();
    });

    it('should accept null lastVerified', () => {
      const { error } = updateObligationComplianceSchema.validate({ status: 'compliant', lastVerified: null }, JOI_OPTS);
      expect(error).toBeUndefined();
    });
  });

  // --- 8. generateDMAComplianceReportSchema ---
  describe('generateDMAComplianceReportSchema', () => {
    const valid = {
      reportingPeriod: {
        start: '2026-01-01T00:00:00.000Z',
        end: '2026-12-31T00:00:00.000Z',
      },
    };

    it('should accept valid payload', () => {
      const { error } = generateDMAComplianceReportSchema.validate(valid, JOI_OPTS);
      expect(error).toBeUndefined();
    });

    it('should reject end before start', () => {
      const { error } = generateDMAComplianceReportSchema.validate({
        reportingPeriod: { start: '2026-12-31T00:00:00Z', end: '2026-01-01T00:00:00Z' },
      }, JOI_OPTS);
      expect(error).toBeDefined();
    });
  });

  // ==========================================================================
  // DSA
  // ==========================================================================

  // --- 9. registerPlatformSchema ---
  describe('registerPlatformSchema', () => {
    const valid = { platformName: 'MySocialApp', platformType: 'online_platform' };

    it('should accept valid payload', () => {
      const { error } = registerPlatformSchema.validate(valid, JOI_OPTS);
      expect(error).toBeUndefined();
    });

    it('should reject missing platformName', () => {
      const { error } = registerPlatformSchema.validate({ platformType: 'online_platform' }, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should reject missing platformType', () => {
      const { error } = registerPlatformSchema.validate({ platformName: 'X' }, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it.each([
      'online_platform', 'very_large_online_platform', 'online_search_engine',
      'very_large_online_search_engine', 'hosting_service', 'intermediary_service',
    ])('should accept platformType=%s', (platformType) => {
      const { error } = registerPlatformSchema.validate({ platformName: 'X', platformType }, JOI_OPTS);
      expect(error).toBeUndefined();
    });

    it('should reject invalid platformType', () => {
      const { error } = registerPlatformSchema.validate({ platformName: 'X', platformType: 'blog' }, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should accept optional monthlyActiveUsers', () => {
      const { error } = registerPlatformSchema.validate({ ...valid, monthlyActiveUsers: 1000000 }, JOI_OPTS);
      expect(error).toBeUndefined();
    });
  });

  // --- 10. updatePlatformSchema ---
  describe('updatePlatformSchema', () => {
    it('should accept partial update', () => {
      const { error } = updatePlatformSchema.validate({ platformName: 'Updated' }, JOI_OPTS);
      expect(error).toBeUndefined();
    });

    it('should reject empty object', () => {
      const { error } = updatePlatformSchema.validate({}, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it.each(['compliant', 'non_compliant', 'in_review'])(
      'should accept complianceStatus=%s',
      (complianceStatus) => {
        const { error } = updatePlatformSchema.validate({ complianceStatus }, JOI_OPTS);
        expect(error).toBeUndefined();
      },
    );
  });

  // --- 11. recordContentModerationSchema ---
  describe('recordContentModerationSchema', () => {
    const valid = {
      actionType: 'content_removal',
      contentType: 'post',
      reason: 'Hate speech violation',
      automatedDecision: false,
    };

    it('should accept valid payload', () => {
      const { error } = recordContentModerationSchema.validate(valid, JOI_OPTS);
      expect(error).toBeUndefined();
    });

    it('should reject missing actionType', () => {
      const { actionType, ...rest } = valid;
      const { error } = recordContentModerationSchema.validate(rest, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should reject missing contentType', () => {
      const { contentType, ...rest } = valid;
      const { error } = recordContentModerationSchema.validate(rest, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should reject missing reason', () => {
      const { reason, ...rest } = valid;
      const { error } = recordContentModerationSchema.validate(rest, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should reject missing automatedDecision', () => {
      const { automatedDecision, ...rest } = valid;
      const { error } = recordContentModerationSchema.validate(rest, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it.each([
      'content_removal', 'content_demotion', 'content_labeling', 'account_suspension',
      'account_termination', 'monetary_penalty', 'feature_restriction', 'no_action',
    ])('should accept actionType=%s', (actionType) => {
      const { error } = recordContentModerationSchema.validate({ ...valid, actionType }, JOI_OPTS);
      expect(error).toBeUndefined();
    });

    it('should reject invalid actionType', () => {
      const { error } = recordContentModerationSchema.validate({ ...valid, actionType: 'ban' }, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should reject reason > 2000 chars', () => {
      const { error } = recordContentModerationSchema.validate({ ...valid, reason: 'x'.repeat(2001) }, JOI_OPTS);
      expect(error).toBeDefined();
    });
  });

  // --- 12. reportIllegalContentSchema ---
  describe('reportIllegalContentSchema', () => {
    const valid = {
      reportedBy: 'John Doe',
      isTrustedFlagger: true,
      contentType: 'video',
      reason: 'Contains illegal content',
    };

    it('should accept valid payload', () => {
      const { error } = reportIllegalContentSchema.validate(valid, JOI_OPTS);
      expect(error).toBeUndefined();
    });

    it('should reject missing reportedBy', () => {
      const { reportedBy, ...rest } = valid;
      const { error } = reportIllegalContentSchema.validate(rest, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should reject missing isTrustedFlagger', () => {
      const { isTrustedFlagger, ...rest } = valid;
      const { error } = reportIllegalContentSchema.validate(rest, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should accept optional contentUrl as valid URI', () => {
      const { error } = reportIllegalContentSchema.validate({ ...valid, contentUrl: 'https://example.com/post/123' }, JOI_OPTS);
      expect(error).toBeUndefined();
    });

    it('should reject invalid contentUrl', () => {
      const { error } = reportIllegalContentSchema.validate({ ...valid, contentUrl: 'not-a-url' }, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should accept null contentUrl', () => {
      const { error } = reportIllegalContentSchema.validate({ ...valid, contentUrl: null }, JOI_OPTS);
      expect(error).toBeUndefined();
    });

    it('should handle SQL injection in reason', () => {
      const { error } = reportIllegalContentSchema.validate({ ...valid, reason: SQL_INJ }, JOI_OPTS);
      expect(error).toBeUndefined();
    });
  });

  // --- 13. processIllegalContentReportSchema ---
  describe('processIllegalContentReportSchema', () => {
    it('should accept valid payload', () => {
      const { error } = processIllegalContentReportSchema.validate({ status: 'reviewed' }, JOI_OPTS);
      expect(error).toBeUndefined();
    });

    it('should reject missing status', () => {
      const { error } = processIllegalContentReportSchema.validate({}, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it.each(['reviewed', 'action_taken', 'dismissed'])('should accept status=%s', (status) => {
      const { error } = processIllegalContentReportSchema.validate({ status }, JOI_OPTS);
      expect(error).toBeUndefined();
    });

    it('should reject invalid status', () => {
      const { error } = processIllegalContentReportSchema.validate({ status: 'pending' }, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should accept optional actionTaken', () => {
      const { error } = processIllegalContentReportSchema.validate({ status: 'action_taken', actionTaken: 'Content removed' }, JOI_OPTS);
      expect(error).toBeUndefined();
    });

    it('should accept optional responseTime >= 0', () => {
      const { error } = processIllegalContentReportSchema.validate({ status: 'reviewed', responseTime: 0 }, JOI_OPTS);
      expect(error).toBeUndefined();
    });

    it('should reject negative responseTime', () => {
      const { error } = processIllegalContentReportSchema.validate({ status: 'reviewed', responseTime: -1 }, JOI_OPTS);
      expect(error).toBeDefined();
    });
  });

  // --- 14. addAdToRepositorySchema ---
  describe('addAdToRepositorySchema', () => {
    const valid = {
      adId: 'ad-001',
      advertiserName: 'Acme Corp',
      adContent: { text: 'Buy our product!' },
    };

    it('should accept valid payload', () => {
      const { error } = addAdToRepositorySchema.validate(valid, JOI_OPTS);
      expect(error).toBeUndefined();
    });

    it('should reject missing adId', () => {
      const { adId, ...rest } = valid;
      const { error } = addAdToRepositorySchema.validate(rest, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should reject missing advertiserName', () => {
      const { advertiserName, ...rest } = valid;
      const { error } = addAdToRepositorySchema.validate(rest, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should reject missing adContent', () => {
      const { adContent, ...rest } = valid;
      const { error } = addAdToRepositorySchema.validate(rest, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should accept adContent with images as URIs', () => {
      const { error } = addAdToRepositorySchema.validate({
        ...valid,
        adContent: { images: ['https://example.com/img.png'] },
      }, JOI_OPTS);
      expect(error).toBeUndefined();
    });

    it('should reject adContent image that is not a URI', () => {
      const { error } = addAdToRepositorySchema.validate({
        ...valid,
        adContent: { images: ['not-a-uri'] },
      }, STRICT_OPTS);
      expect(error).toBeDefined();
    });

    it('should accept adContent with video URI', () => {
      const { error } = addAdToRepositorySchema.validate({
        ...valid,
        adContent: { video: 'https://example.com/video.mp4' },
      }, JOI_OPTS);
      expect(error).toBeUndefined();
    });

    it('should accept optional targetingCriteria', () => {
      const { error } = addAdToRepositorySchema.validate({ ...valid, targetingCriteria: { age: '18-35' } }, JOI_OPTS);
      expect(error).toBeUndefined();
    });

    it('should accept optional startDate and endDate', () => {
      const { error } = addAdToRepositorySchema.validate({
        ...valid,
        startDate: '2026-01-01T00:00:00Z',
        endDate: '2026-12-31T00:00:00Z',
      }, JOI_OPTS);
      expect(error).toBeUndefined();
    });
  });

  // --- 15. generateDSATransparencyReportSchema ---
  describe('generateDSATransparencyReportSchema', () => {
    it('should accept valid payload', () => {
      const { error } = generateDSATransparencyReportSchema.validate({
        reportingPeriod: { start: '2026-01-01T00:00:00Z', end: '2026-06-30T00:00:00Z' },
      }, JOI_OPTS);
      expect(error).toBeUndefined();
    });

    it('should reject end before start', () => {
      const { error } = generateDSATransparencyReportSchema.validate({
        reportingPeriod: { start: '2026-12-01T00:00:00Z', end: '2026-01-01T00:00:00Z' },
      }, JOI_OPTS);
      expect(error).toBeDefined();
    });
  });

  // --- 16. conductDSARiskAssessmentSchema ---
  describe('conductDSARiskAssessmentSchema', () => {
    const valid = { riskCategory: 'illegal_content' };

    it('should accept valid payload', () => {
      const { error } = conductDSARiskAssessmentSchema.validate(valid, JOI_OPTS);
      expect(error).toBeUndefined();
    });

    it('should reject missing riskCategory', () => {
      const { error } = conductDSARiskAssessmentSchema.validate({}, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it.each(['illegal_content', 'fundamental_rights', 'public_security', 'protection_of_minors'])(
      'should accept riskCategory=%s',
      (riskCategory) => {
        const { error } = conductDSARiskAssessmentSchema.validate({ riskCategory }, JOI_OPTS);
        expect(error).toBeUndefined();
      },
    );

    it('should reject invalid riskCategory', () => {
      const { error } = conductDSARiskAssessmentSchema.validate({ riskCategory: 'financial' }, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should accept risk blocks with severity', () => {
      const { error } = conductDSARiskAssessmentSchema.validate({
        riskCategory: 'illegal_content',
        illegalContentRisks: {
          risks: ['Spam'],
          severity: 'high',
          description: 'High volume of spam',
        },
      }, JOI_OPTS);
      expect(error).toBeUndefined();
    });

    it.each(['low', 'medium', 'high', 'critical'])('should accept risk severity=%s', (severity) => {
      const { error } = conductDSARiskAssessmentSchema.validate({
        riskCategory: 'illegal_content',
        illegalContentRisks: { severity },
      }, JOI_OPTS);
      expect(error).toBeUndefined();
    });

    it('should reject invalid risk severity', () => {
      const { error } = conductDSARiskAssessmentSchema.validate({
        riskCategory: 'illegal_content',
        illegalContentRisks: { severity: 'extreme' },
      }, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should accept mitigationMeasures array', () => {
      const { error } = conductDSARiskAssessmentSchema.validate({
        riskCategory: 'public_security',
        mitigationMeasures: [{
          measure: 'Deploy content filter',
          status: 'planned',
          targetDate: '2026-06-01T00:00:00Z',
          responsibleParty: 'Security Team',
        }],
      }, JOI_OPTS);
      expect(error).toBeUndefined();
    });

    it('should reject mitigationMeasure with invalid status', () => {
      const { error } = conductDSARiskAssessmentSchema.validate({
        riskCategory: 'public_security',
        mitigationMeasures: [{ measure: 'X', status: 'done' }],
      }, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it.each(['planned', 'in_progress', 'implemented', 'verified'])(
      'should accept mitigationMeasure status=%s',
      (status) => {
        const { error } = conductDSARiskAssessmentSchema.validate({
          riskCategory: 'illegal_content',
          mitigationMeasures: [{ measure: 'Fix', status }],
        }, JOI_OPTS);
        expect(error).toBeUndefined();
      },
    );
  });

  // --- 17. updateDSARiskAssessmentSchema ---
  describe('updateDSARiskAssessmentSchema', () => {
    it('should accept partial update with status', () => {
      const { error } = updateDSARiskAssessmentSchema.validate({ status: 'approved' }, JOI_OPTS);
      expect(error).toBeUndefined();
    });

    it('should reject empty object', () => {
      const { error } = updateDSARiskAssessmentSchema.validate({}, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it.each(['draft', 'in_review', 'approved', 'requires_action'])(
      'should accept status=%s',
      (status) => {
        const { error } = updateDSARiskAssessmentSchema.validate({ status }, JOI_OPTS);
        expect(error).toBeUndefined();
      },
    );

    it('should reject invalid status', () => {
      const { error } = updateDSARiskAssessmentSchema.validate({ status: 'pending' }, JOI_OPTS);
      expect(error).toBeDefined();
    });
  });

  // --- 18. configureNonPersonalizedFeedSchema ---
  describe('configureNonPersonalizedFeedSchema', () => {
    const valid = {
      isEnabled: true,
      userOptInMethod: 'toggle',
      feedAlgorithmType: 'chronological',
    };

    it('should accept valid payload', () => {
      const { error } = configureNonPersonalizedFeedSchema.validate(valid, JOI_OPTS);
      expect(error).toBeUndefined();
    });

    it('should reject missing isEnabled', () => {
      const { isEnabled, ...rest } = valid;
      const { error } = configureNonPersonalizedFeedSchema.validate(rest, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should reject missing userOptInMethod', () => {
      const { userOptInMethod, ...rest } = valid;
      const { error } = configureNonPersonalizedFeedSchema.validate(rest, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should reject missing feedAlgorithmType', () => {
      const { feedAlgorithmType, ...rest } = valid;
      const { error } = configureNonPersonalizedFeedSchema.validate(rest, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it.each(['toggle', 'settings_page', 'onboarding'])('should accept userOptInMethod=%s', (m) => {
      const { error } = configureNonPersonalizedFeedSchema.validate({ ...valid, userOptInMethod: m }, JOI_OPTS);
      expect(error).toBeUndefined();
    });

    it('should reject invalid userOptInMethod', () => {
      const { error } = configureNonPersonalizedFeedSchema.validate({ ...valid, userOptInMethod: 'popup' }, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it.each(['chronological', 'popularity', 'random'])('should accept feedAlgorithmType=%s', (t) => {
      const { error } = configureNonPersonalizedFeedSchema.validate({ ...valid, feedAlgorithmType: t }, JOI_OPTS);
      expect(error).toBeUndefined();
    });

    it('should reject invalid feedAlgorithmType', () => {
      const { error } = configureNonPersonalizedFeedSchema.validate({ ...valid, feedAlgorithmType: 'ai_powered' }, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should accept optional description, userDocumentationUrl, technicalSpecs, implementationDate', () => {
      const { error } = configureNonPersonalizedFeedSchema.validate({
        ...valid,
        description: 'A non-personalized feed',
        userDocumentationUrl: 'https://docs.example.com/feed',
        technicalSpecs: { algorithm: 'reverse-chron' },
        implementationDate: '2026-06-01T00:00:00Z',
      }, JOI_OPTS);
      expect(error).toBeUndefined();
    });

    it('should reject invalid userDocumentationUrl', () => {
      const { error } = configureNonPersonalizedFeedSchema.validate({ ...valid, userDocumentationUrl: 'not-url' }, JOI_OPTS);
      expect(error).toBeDefined();
    });
  });

  // --- 19. updateNonPersonalizedFeedStatusSchema ---
  describe('updateNonPersonalizedFeedStatusSchema', () => {
    it('should accept partial update', () => {
      const { error } = updateNonPersonalizedFeedStatusSchema.validate({ complianceStatus: 'implemented' }, JOI_OPTS);
      expect(error).toBeUndefined();
    });

    it('should reject empty object', () => {
      const { error } = updateNonPersonalizedFeedStatusSchema.validate({}, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it.each(['not_implemented', 'in_progress', 'implemented', 'compliant'])(
      'should accept complianceStatus=%s',
      (complianceStatus) => {
        const { error } = updateNonPersonalizedFeedStatusSchema.validate({ complianceStatus }, JOI_OPTS);
        expect(error).toBeUndefined();
      },
    );

    it('should reject invalid complianceStatus', () => {
      const { error } = updateNonPersonalizedFeedStatusSchema.validate({ complianceStatus: 'pending' }, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should accept notes and lastAuditDate', () => {
      const { error } = updateNonPersonalizedFeedStatusSchema.validate({
        notes: 'Audit passed',
        lastAuditDate: '2026-03-15T00:00:00Z',
      }, JOI_OPTS);
      expect(error).toBeUndefined();
    });

    it('should accept null lastAuditDate', () => {
      const { error } = updateNonPersonalizedFeedStatusSchema.validate({ lastAuditDate: null, notes: 'x' }, JOI_OPTS);
      expect(error).toBeUndefined();
    });

    it('should handle XSS in notes', () => {
      const { error } = updateNonPersonalizedFeedStatusSchema.validate({ notes: XSS }, JOI_OPTS);
      expect(error).toBeUndefined();
    });
  });
});
