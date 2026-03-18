import { describe, it, expect } from '@jest/globals';
import {
  // Governance Manager
  createGovernanceBodySchema,
  updateGovernanceBodySchema,
  createMeetingSchema,
  updateMeetingSchema,
  createDecisionSchema,
  updateDecisionSchema,
  createEscalationPathSchema,
  upsertDPOProfileSchema,
  // Breach Notification
  createBreachIncidentSchema,
  updateBreachIncidentSchema,
  createBreachNotificationSchema,
  createBreachTemplateSchema,
  createRegulatoryContactSchema,
  // CE Marking
  createCEProductSchema,
  updateCEProductSchema,
  // Digital Product Passport
  createDPPSchema,
  updateDPPSchema,
  // ESG Reporting
  createESGMetricSchema,
  updateESGMetricSchema,
  createMaterialityAssessmentSchema,
  // SBOM Manager
  createSBOMEntrySchema,
  bulkCreateSBOMEntriesSchema,
  createSBOMRepositorySchema,
  // Post-Market Surveillance
  createSurveillancePlanSchema,
  createSurveillanceIncidentSchema,
  createProductRecallSchema,
  // Product Decommissioning
  createProductDecommissionSchema,
  // Environmental Lifecycle
  createLifecycleAssessmentSchema,
  updateLifecycleAssessmentSchema,
  // Product Lifecycle Tracker
  createProductLifecycleSchema,
  updateProductLifecycleSchema,
  // Process Mapper
  createProcessMapSchema,
  updateProcessMapSchema,
} from '../../../validators/featureModulesSchemas';

const JOI_OPTS = { abortEarly: false, stripUnknown: true, convert: true } as const;
const STRICT_OPTS = { abortEarly: false, convert: true } as const;

const XSS = '<script>alert(1)</script>';
const SQL_INJ = "' OR 1=1; --";
const UUID = '550e8400-e29b-41d4-a716-446655440000';

describe('featureModulesSchemas contract tests', () => {
  // ==========================================================================
  // GOVERNANCE MANAGER
  // ==========================================================================

  // --- 1. createGovernanceBodySchema ---
  describe('createGovernanceBodySchema', () => {
    const valid = { name: 'Risk Committee', type: 'Committee' };

    it('should accept valid payload', () => {
      const { error } = createGovernanceBodySchema.validate(valid, JOI_OPTS);
      expect(error).toBeUndefined();
    });

    it('should reject missing name', () => {
      const { error } = createGovernanceBodySchema.validate({ type: 'Board' }, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should reject missing type', () => {
      const { error } = createGovernanceBodySchema.validate({ name: 'X' }, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it.each(['Board', 'Committee', 'Council', 'Steering Committee', 'Working Group', 'Task Force'])(
      'should accept type=%s',
      (type) => {
        const { error } = createGovernanceBodySchema.validate({ name: 'X', type }, JOI_OPTS);
        expect(error).toBeUndefined();
      },
    );

    it('should reject invalid type', () => {
      const { error } = createGovernanceBodySchema.validate({ name: 'X', type: 'Team' }, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it.each(['Weekly', 'Biweekly', 'Monthly', 'Quarterly', 'Annual', 'Ad-hoc'])(
      'should accept meetingFrequency=%s',
      (meetingFrequency) => {
        const { error } = createGovernanceBodySchema.validate({ ...valid, meetingFrequency }, JOI_OPTS);
        expect(error).toBeUndefined();
      },
    );

    it('should reject invalid meetingFrequency', () => {
      const { error } = createGovernanceBodySchema.validate({ ...valid, meetingFrequency: 'Daily' }, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should reject name > 200 chars', () => {
      const { error } = createGovernanceBodySchema.validate({ name: 'x'.repeat(201), type: 'Board' }, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should reject charter > 5000 chars', () => {
      const { error } = createGovernanceBodySchema.validate({ ...valid, charter: 'x'.repeat(5001) }, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should accept members as null', () => {
      const { error } = createGovernanceBodySchema.validate({ ...valid, members: null }, JOI_OPTS);
      expect(error).toBeUndefined();
    });

    it('should reject unknown fields even with stripUnknown (unknown(false))', () => {
      const { error } = createGovernanceBodySchema.validate({ ...valid, extra: true }, JOI_OPTS);
      expect(error).toBeDefined();
      expect(error!.details.some((d) => d.type === 'object.unknown')).toBe(true);
    });

    it('should reject unknown fields in strict mode', () => {
      const { error } = createGovernanceBodySchema.validate({ ...valid, extra: true }, STRICT_OPTS);
      expect(error).toBeDefined();
    });
  });

  // --- 2. updateGovernanceBodySchema ---
  describe('updateGovernanceBodySchema', () => {
    it('should accept partial update', () => {
      const { error } = updateGovernanceBodySchema.validate({ name: 'Updated' }, JOI_OPTS);
      expect(error).toBeUndefined();
    });

    it('should reject empty object', () => {
      const { error } = updateGovernanceBodySchema.validate({}, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it.each(['active', 'inactive', 'dissolved'])('should accept status=%s', (status) => {
      const { error } = updateGovernanceBodySchema.validate({ status }, JOI_OPTS);
      expect(error).toBeUndefined();
    });

    it('should reject invalid status', () => {
      const { error } = updateGovernanceBodySchema.validate({ status: 'pending' }, JOI_OPTS);
      expect(error).toBeDefined();
    });
  });

  // --- 3. createMeetingSchema ---
  describe('createMeetingSchema', () => {
    const valid = {
      governanceBodyId: UUID,
      title: 'Q1 Review',
      date: '2026-04-01T10:00:00Z',
    };

    it('should accept valid payload', () => {
      const { error } = createMeetingSchema.validate(valid, JOI_OPTS);
      expect(error).toBeUndefined();
    });

    it('should reject missing governanceBodyId', () => {
      const { error } = createMeetingSchema.validate({ title: 'X', date: '2026-01-01T00:00:00Z' }, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should reject non-UUID governanceBodyId', () => {
      const { error } = createMeetingSchema.validate({ ...valid, governanceBodyId: 'not-uuid' }, STRICT_OPTS);
      expect(error).toBeDefined();
    });

    it('should reject missing title', () => {
      const { error } = createMeetingSchema.validate({ governanceBodyId: UUID, date: '2026-01-01T00:00:00Z' }, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should reject missing date', () => {
      const { error } = createMeetingSchema.validate({ governanceBodyId: UUID, title: 'X' }, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should accept optional duration within bounds', () => {
      const { error } = createMeetingSchema.validate({ ...valid, duration: 60 }, JOI_OPTS);
      expect(error).toBeUndefined();
    });

    it('should reject duration < 1', () => {
      const { error } = createMeetingSchema.validate({ ...valid, duration: 0 }, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should reject duration > 480', () => {
      const { error } = createMeetingSchema.validate({ ...valid, duration: 481 }, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should accept boundary duration=1', () => {
      const { error } = createMeetingSchema.validate({ ...valid, duration: 1 }, JOI_OPTS);
      expect(error).toBeUndefined();
    });

    it('should accept boundary duration=480', () => {
      const { error } = createMeetingSchema.validate({ ...valid, duration: 480 }, JOI_OPTS);
      expect(error).toBeUndefined();
    });

    it('should accept meetingUrl as valid URI', () => {
      const { error } = createMeetingSchema.validate({ ...valid, meetingUrl: 'https://zoom.us/j/123' }, JOI_OPTS);
      expect(error).toBeUndefined();
    });

    it('should reject invalid meetingUrl', () => {
      const { error } = createMeetingSchema.validate({ ...valid, meetingUrl: 'not-a-url' }, STRICT_OPTS);
      expect(error).toBeDefined();
    });
  });

  // --- 4. updateMeetingSchema ---
  describe('updateMeetingSchema', () => {
    it('should accept partial update', () => {
      const { error } = updateMeetingSchema.validate({ title: 'Updated' }, JOI_OPTS);
      expect(error).toBeUndefined();
    });

    it('should reject empty object', () => {
      const { error } = updateMeetingSchema.validate({}, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it.each(['scheduled', 'in_progress', 'completed', 'cancelled'])('should accept status=%s', (status) => {
      const { error } = updateMeetingSchema.validate({ status }, JOI_OPTS);
      expect(error).toBeUndefined();
    });

    it('should reject invalid status', () => {
      const { error } = updateMeetingSchema.validate({ status: 'pending' }, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should accept minutes up to 10000 chars', () => {
      const { error } = updateMeetingSchema.validate({ minutes: 'x'.repeat(10000) }, JOI_OPTS);
      expect(error).toBeUndefined();
    });

    it('should reject minutes > 10000 chars', () => {
      const { error } = updateMeetingSchema.validate({ minutes: 'x'.repeat(10001) }, JOI_OPTS);
      expect(error).toBeDefined();
    });
  });

  // --- 5. createDecisionSchema ---
  describe('createDecisionSchema', () => {
    const valid = {
      governanceBodyId: UUID,
      title: 'Adopt NIST Framework',
      decisionType: 'Policy',
    };

    it('should accept valid payload', () => {
      const { error } = createDecisionSchema.validate(valid, JOI_OPTS);
      expect(error).toBeUndefined();
    });

    it('should reject missing governanceBodyId', () => {
      const { error } = createDecisionSchema.validate({ title: 'X', decisionType: 'Policy' }, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should reject missing title', () => {
      const { error } = createDecisionSchema.validate({ governanceBodyId: UUID, decisionType: 'Policy' }, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should reject missing decisionType', () => {
      const { error } = createDecisionSchema.validate({ governanceBodyId: UUID, title: 'X' }, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it.each(['Policy', 'Process', 'Budget', 'Strategic', 'Operational', 'Technical', 'Compliance'])(
      'should accept decisionType=%s',
      (decisionType) => {
        const { error } = createDecisionSchema.validate({ ...valid, decisionType }, JOI_OPTS);
        expect(error).toBeUndefined();
      },
    );

    it('should reject invalid decisionType', () => {
      const { error } = createDecisionSchema.validate({ ...valid, decisionType: 'HR' }, JOI_OPTS);
      expect(error).toBeDefined();
    });
  });

  // --- 6. updateDecisionSchema ---
  describe('updateDecisionSchema', () => {
    it('should accept partial update', () => {
      const { error } = updateDecisionSchema.validate({ title: 'New Title' }, JOI_OPTS);
      expect(error).toBeUndefined();
    });

    it('should reject empty object', () => {
      const { error } = updateDecisionSchema.validate({}, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it.each(['proposed', 'under_review', 'approved', 'rejected', 'implemented', 'superseded'])(
      'should accept status=%s',
      (status) => {
        const { error } = updateDecisionSchema.validate({ status }, JOI_OPTS);
        expect(error).toBeUndefined();
      },
    );

    it('should reject invalid status', () => {
      const { error } = updateDecisionSchema.validate({ status: 'draft' }, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should accept effectiveDate and reviewDate', () => {
      const { error } = updateDecisionSchema.validate({
        effectiveDate: '2026-06-01T00:00:00Z',
        reviewDate: '2026-12-01T00:00:00Z',
      }, JOI_OPTS);
      expect(error).toBeUndefined();
    });
  });

  // --- 7. createEscalationPathSchema ---
  describe('createEscalationPathSchema', () => {
    const valid = { governanceBodyId: UUID, name: 'Critical Incident Path' };

    it('should accept valid payload', () => {
      const { error } = createEscalationPathSchema.validate(valid, JOI_OPTS);
      expect(error).toBeUndefined();
    });

    it('should reject missing governanceBodyId', () => {
      const { error } = createEscalationPathSchema.validate({ name: 'X' }, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should reject missing name', () => {
      const { error } = createEscalationPathSchema.validate({ governanceBodyId: UUID }, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should accept triggerCriteria and levels as null', () => {
      const { error } = createEscalationPathSchema.validate({ ...valid, triggerCriteria: null, levels: null }, JOI_OPTS);
      expect(error).toBeUndefined();
    });
  });

  // --- 8. upsertDPOProfileSchema ---
  describe('upsertDPOProfileSchema', () => {
    const valid = { name: 'Jane Smith', email: 'jane@company.com' };

    it('should accept valid payload', () => {
      const { error } = upsertDPOProfileSchema.validate(valid, JOI_OPTS);
      expect(error).toBeUndefined();
    });

    it('should reject missing name', () => {
      const { error } = upsertDPOProfileSchema.validate({ email: 'a@b.com' }, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should reject missing email', () => {
      const { error } = upsertDPOProfileSchema.validate({ name: 'X' }, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should reject invalid email', () => {
      const { error } = upsertDPOProfileSchema.validate({ name: 'X', email: 'not-email' }, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should accept full optional fields', () => {
      const { error } = upsertDPOProfileSchema.validate({
        ...valid,
        phone: '+1234567890',
        certifications: ['CIPP/E', 'CIPM'],
        appointmentDate: '2026-01-15T00:00:00Z',
        registeredWithDPA: true,
        dpaRegistrationRef: 'DPA-2026-001',
        tasks: [{ name: 'Review DPIA' }],
        activityLog: [{ action: 'Created profile' }],
      }, JOI_OPTS);
      expect(error).toBeUndefined();
    });

    it('should handle XSS in name', () => {
      const { error } = upsertDPOProfileSchema.validate({ name: XSS, email: 'a@b.com' }, JOI_OPTS);
      expect(error).toBeUndefined();
    });
  });

  // ==========================================================================
  // BREACH NOTIFICATION
  // ==========================================================================

  // --- 9. createBreachIncidentSchema ---
  describe('createBreachIncidentSchema', () => {
    const valid = {
      title: 'Data Breach Q1',
      breachType: 'Data Loss',
      severity: 'High',
      discoveryDate: '2026-03-01T08:00:00Z',
    };

    it('should accept valid payload', () => {
      const { error } = createBreachIncidentSchema.validate(valid, JOI_OPTS);
      expect(error).toBeUndefined();
    });

    it('should reject missing title', () => {
      const { title, ...rest } = valid;
      const { error } = createBreachIncidentSchema.validate(rest, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should reject missing breachType', () => {
      const { breachType, ...rest } = valid;
      const { error } = createBreachIncidentSchema.validate(rest, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should reject missing severity', () => {
      const { severity, ...rest } = valid;
      const { error } = createBreachIncidentSchema.validate(rest, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should reject missing discoveryDate', () => {
      const { discoveryDate, ...rest } = valid;
      const { error } = createBreachIncidentSchema.validate(rest, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it.each(['Confidentiality', 'Integrity', 'Availability', 'Unauthorized Access', 'Data Loss', 'Ransomware', 'Phishing', 'Other'])(
      'should accept breachType=%s',
      (breachType) => {
        const { error } = createBreachIncidentSchema.validate({ ...valid, breachType }, JOI_OPTS);
        expect(error).toBeUndefined();
      },
    );

    it('should reject invalid breachType', () => {
      const { error } = createBreachIncidentSchema.validate({ ...valid, breachType: 'Hacking' }, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it.each(['Critical', 'High', 'Medium', 'Low'])('should accept severity=%s', (severity) => {
      const { error } = createBreachIncidentSchema.validate({ ...valid, severity }, JOI_OPTS);
      expect(error).toBeUndefined();
    });

    it('should reject invalid severity', () => {
      const { error } = createBreachIncidentSchema.validate({ ...valid, severity: 'Extreme' }, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should accept optional affectedRecords >= 0', () => {
      const { error } = createBreachIncidentSchema.validate({ ...valid, affectedRecords: 0 }, JOI_OPTS);
      expect(error).toBeUndefined();
    });

    it('should reject negative affectedRecords', () => {
      const { error } = createBreachIncidentSchema.validate({ ...valid, affectedRecords: -1 }, JOI_OPTS);
      expect(error).toBeDefined();
    });
  });

  // --- 10. updateBreachIncidentSchema ---
  describe('updateBreachIncidentSchema', () => {
    it('should accept partial update', () => {
      const { error } = updateBreachIncidentSchema.validate({ title: 'Updated' }, JOI_OPTS);
      expect(error).toBeUndefined();
    });

    it('should reject empty object', () => {
      const { error } = updateBreachIncidentSchema.validate({}, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it.each(['detected', 'investigating', 'contained', 'remediated', 'closed'])(
      'should accept status=%s',
      (status) => {
        const { error } = updateBreachIncidentSchema.validate({ status }, JOI_OPTS);
        expect(error).toBeUndefined();
      },
    );

    it('should reject invalid status', () => {
      const { error } = updateBreachIncidentSchema.validate({ status: 'resolved' }, JOI_OPTS);
      expect(error).toBeDefined();
    });
  });

  // --- 11. createBreachNotificationSchema ---
  describe('createBreachNotificationSchema', () => {
    const valid = { breachId: UUID, recipientType: 'DPA' };

    it('should accept valid payload', () => {
      const { error } = createBreachNotificationSchema.validate(valid, JOI_OPTS);
      expect(error).toBeUndefined();
    });

    it('should reject missing breachId', () => {
      const { error } = createBreachNotificationSchema.validate({ recipientType: 'DPA' }, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should reject non-UUID breachId', () => {
      const { error } = createBreachNotificationSchema.validate({ breachId: 'bad', recipientType: 'DPA' }, STRICT_OPTS);
      expect(error).toBeDefined();
    });

    it.each(['DPA', 'Data Subjects', 'Supervisory Authority', 'Other'])(
      'should accept recipientType=%s',
      (recipientType) => {
        const { error } = createBreachNotificationSchema.validate({ breachId: UUID, recipientType }, JOI_OPTS);
        expect(error).toBeUndefined();
      },
    );

    it('should reject invalid recipientType', () => {
      const { error } = createBreachNotificationSchema.validate({ breachId: UUID, recipientType: 'Press' }, JOI_OPTS);
      expect(error).toBeDefined();
    });
  });

  // --- 12. createBreachTemplateSchema ---
  describe('createBreachTemplateSchema', () => {
    const valid = {
      name: 'GDPR 72hr Template',
      jurisdiction: 'EU',
      recipientType: 'DPA',
      body: 'Dear Authority, we are reporting...',
    };

    it('should accept valid payload', () => {
      const { error } = createBreachTemplateSchema.validate(valid, JOI_OPTS);
      expect(error).toBeUndefined();
    });

    it('should reject missing name', () => {
      const { name, ...rest } = valid;
      const { error } = createBreachTemplateSchema.validate(rest, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should reject missing jurisdiction', () => {
      const { jurisdiction, ...rest } = valid;
      const { error } = createBreachTemplateSchema.validate(rest, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should reject missing body', () => {
      const { body, ...rest } = valid;
      const { error } = createBreachTemplateSchema.validate(rest, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should reject body > 20000 chars', () => {
      const { error } = createBreachTemplateSchema.validate({ ...valid, body: 'x'.repeat(20001) }, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should accept optional variables', () => {
      const { error } = createBreachTemplateSchema.validate({ ...valid, variables: ['{{org_name}}', '{{date}}'] }, JOI_OPTS);
      expect(error).toBeUndefined();
    });
  });

  // --- 13. createRegulatoryContactSchema ---
  describe('createRegulatoryContactSchema', () => {
    const valid = { name: 'ICO', authority: 'ICO UK', jurisdiction: 'UK' };

    it('should accept valid payload', () => {
      const { error } = createRegulatoryContactSchema.validate(valid, JOI_OPTS);
      expect(error).toBeUndefined();
    });

    it('should reject missing name', () => {
      const { error } = createRegulatoryContactSchema.validate({ authority: 'X', jurisdiction: 'UK' }, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should reject missing authority', () => {
      const { error } = createRegulatoryContactSchema.validate({ name: 'X', jurisdiction: 'UK' }, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should reject missing jurisdiction', () => {
      const { error } = createRegulatoryContactSchema.validate({ name: 'X', authority: 'Y' }, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should reject invalid email', () => {
      const { error } = createRegulatoryContactSchema.validate({ ...valid, email: 'bad' }, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should accept valid email', () => {
      const { error } = createRegulatoryContactSchema.validate({ ...valid, email: 'info@ico.org.uk' }, JOI_OPTS);
      expect(error).toBeUndefined();
    });

    it('should accept valid website URI', () => {
      const { error } = createRegulatoryContactSchema.validate({ ...valid, website: 'https://ico.org.uk' }, JOI_OPTS);
      expect(error).toBeUndefined();
    });

    it('should reject invalid website', () => {
      const { error } = createRegulatoryContactSchema.validate({ ...valid, website: 'not-url' }, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should reject negative notificationDeadline', () => {
      const { error } = createRegulatoryContactSchema.validate({ ...valid, notificationDeadline: -1 }, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should accept notificationDeadline = 0', () => {
      const { error } = createRegulatoryContactSchema.validate({ ...valid, notificationDeadline: 0 }, JOI_OPTS);
      expect(error).toBeUndefined();
    });
  });

  // ==========================================================================
  // CE MARKING
  // ==========================================================================

  // --- 14. createCEProductSchema ---
  describe('createCEProductSchema', () => {
    const valid = { name: 'Widget X', category: 'Machinery' };

    it('should accept valid payload', () => {
      const { error } = createCEProductSchema.validate(valid, JOI_OPTS);
      expect(error).toBeUndefined();
    });

    it('should reject missing name', () => {
      const { error } = createCEProductSchema.validate({ category: 'Machinery' }, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should reject missing category', () => {
      const { error } = createCEProductSchema.validate({ name: 'X' }, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it.each(['Machinery', 'Electrical', 'Medical Devices', 'Toys', 'PPE', 'Construction', 'Radio', 'Other'])(
      'should accept category=%s',
      (category) => {
        const { error } = createCEProductSchema.validate({ name: 'X', category }, JOI_OPTS);
        expect(error).toBeUndefined();
      },
    );

    it('should reject invalid category', () => {
      const { error } = createCEProductSchema.validate({ name: 'X', category: 'Automotive' }, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should accept optional arrays', () => {
      const { error } = createCEProductSchema.validate({
        ...valid,
        applicableDirectives: ['2006/42/EC'],
        harmonizedStandards: ['EN ISO 12100'],
      }, JOI_OPTS);
      expect(error).toBeUndefined();
    });
  });

  // --- 15. updateCEProductSchema ---
  describe('updateCEProductSchema', () => {
    it('should accept partial update', () => {
      const { error } = updateCEProductSchema.validate({ name: 'Updated' }, JOI_OPTS);
      expect(error).toBeUndefined();
    });

    it('should reject empty object', () => {
      const { error } = updateCEProductSchema.validate({}, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it.each(['draft', 'assessment', 'testing', 'documentation', 'marked', 'expired'])(
      'should accept status=%s',
      (status) => {
        const { error } = updateCEProductSchema.validate({ status }, JOI_OPTS);
        expect(error).toBeUndefined();
      },
    );

    it('should reject invalid status', () => {
      const { error } = updateCEProductSchema.validate({ status: 'approved' }, JOI_OPTS);
      expect(error).toBeDefined();
    });
  });

  // ==========================================================================
  // DIGITAL PRODUCT PASSPORT
  // ==========================================================================

  // --- 16. createDPPSchema ---
  describe('createDPPSchema', () => {
    const valid = { productName: 'EcoWidget' };

    it('should accept valid payload', () => {
      const { error } = createDPPSchema.validate(valid, JOI_OPTS);
      expect(error).toBeUndefined();
    });

    it('should reject missing productName', () => {
      const { error } = createDPPSchema.validate({ manufacturer: 'Acme' }, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should accept all optional fields', () => {
      const { error } = createDPPSchema.validate({
        ...valid,
        productId: 'PROD-001',
        manufacturer: 'GreenCo',
        category: 'Electronics',
        materials: [{ name: 'Aluminum', weight: 0.5 }],
        manufacturingDate: '2026-01-01T00:00:00Z',
        countryOfOrigin: 'Germany',
      }, JOI_OPTS);
      expect(error).toBeUndefined();
    });
  });

  // --- 17. updateDPPSchema ---
  describe('updateDPPSchema', () => {
    it('should accept partial update', () => {
      const { error } = updateDPPSchema.validate({ productName: 'Updated' }, JOI_OPTS);
      expect(error).toBeUndefined();
    });

    it('should reject empty object', () => {
      const { error } = updateDPPSchema.validate({}, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should accept carbonFootprint >= 0', () => {
      const { error } = updateDPPSchema.validate({ carbonFootprint: 0 }, JOI_OPTS);
      expect(error).toBeUndefined();
    });

    it('should reject negative carbonFootprint', () => {
      const { error } = updateDPPSchema.validate({ carbonFootprint: -1 }, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should accept recyclability 0-100', () => {
      const { error: e0 } = updateDPPSchema.validate({ recyclability: 0 }, JOI_OPTS);
      expect(e0).toBeUndefined();
      const { error: e100 } = updateDPPSchema.validate({ recyclability: 100 }, JOI_OPTS);
      expect(e100).toBeUndefined();
    });

    it('should reject recyclability > 100', () => {
      const { error } = updateDPPSchema.validate({ recyclability: 101 }, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should reject negative recyclability', () => {
      const { error } = updateDPPSchema.validate({ recyclability: -1 }, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should accept repairabilityScore 0-100', () => {
      const { error } = updateDPPSchema.validate({ repairabilityScore: 50 }, JOI_OPTS);
      expect(error).toBeUndefined();
    });

    it('should reject repairabilityScore > 100', () => {
      const { error } = updateDPPSchema.validate({ repairabilityScore: 101 }, JOI_OPTS);
      expect(error).toBeDefined();
    });
  });

  // ==========================================================================
  // ESG REPORTING
  // ==========================================================================

  // --- 18. createESGMetricSchema ---
  describe('createESGMetricSchema', () => {
    const valid = {
      category: 'Environmental',
      subcategory: 'Emissions',
      name: 'CO2 Scope 1',
      value: 1500,
      unit: 'tCO2e',
    };

    it('should accept valid payload', () => {
      const { error } = createESGMetricSchema.validate(valid, JOI_OPTS);
      expect(error).toBeUndefined();
    });

    it('should reject missing category', () => {
      const { category, ...rest } = valid;
      const { error } = createESGMetricSchema.validate(rest, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should reject missing subcategory', () => {
      const { subcategory, ...rest } = valid;
      const { error } = createESGMetricSchema.validate(rest, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should reject missing name', () => {
      const { name, ...rest } = valid;
      const { error } = createESGMetricSchema.validate(rest, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should reject missing value', () => {
      const { value, ...rest } = valid;
      const { error } = createESGMetricSchema.validate(rest, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should reject missing unit', () => {
      const { unit, ...rest } = valid;
      const { error } = createESGMetricSchema.validate(rest, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it.each(['Environmental', 'Social', 'Governance'])('should accept category=%s', (category) => {
      const { error } = createESGMetricSchema.validate({ ...valid, category }, JOI_OPTS);
      expect(error).toBeUndefined();
    });

    it('should reject invalid category', () => {
      const { error } = createESGMetricSchema.validate({ ...valid, category: 'Financial' }, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should accept optional verified boolean', () => {
      const { error } = createESGMetricSchema.validate({ ...valid, verified: true }, JOI_OPTS);
      expect(error).toBeUndefined();
    });
  });

  // --- 19. updateESGMetricSchema ---
  describe('updateESGMetricSchema', () => {
    it('should accept partial update', () => {
      const { error } = updateESGMetricSchema.validate({ value: 2000 }, JOI_OPTS);
      expect(error).toBeUndefined();
    });

    it('should reject empty object', () => {
      const { error } = updateESGMetricSchema.validate({}, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should accept verified update', () => {
      const { error } = updateESGMetricSchema.validate({ verified: true }, JOI_OPTS);
      expect(error).toBeUndefined();
    });
  });

  // --- 20. createMaterialityAssessmentSchema ---
  describe('createMaterialityAssessmentSchema', () => {
    const valid = { topic: 'Climate Change' };

    it('should accept valid payload', () => {
      const { error } = createMaterialityAssessmentSchema.validate(valid, JOI_OPTS);
      expect(error).toBeUndefined();
    });

    it('should reject missing topic', () => {
      const { error } = createMaterialityAssessmentSchema.validate({}, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should accept stakeholderImpact 0-100', () => {
      const { error } = createMaterialityAssessmentSchema.validate({ ...valid, stakeholderImpact: 50 }, JOI_OPTS);
      expect(error).toBeUndefined();
    });

    it('should reject stakeholderImpact > 100', () => {
      const { error } = createMaterialityAssessmentSchema.validate({ ...valid, stakeholderImpact: 101 }, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should accept sdgAlignment with valid SDG numbers 1-17', () => {
      const { error } = createMaterialityAssessmentSchema.validate({ ...valid, sdgAlignment: [1, 13, 17] }, JOI_OPTS);
      expect(error).toBeUndefined();
    });

    it('should reject sdgAlignment with number > 17', () => {
      const { error } = createMaterialityAssessmentSchema.validate({ ...valid, sdgAlignment: [18] }, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should reject sdgAlignment with number < 1', () => {
      const { error } = createMaterialityAssessmentSchema.validate({ ...valid, sdgAlignment: [0] }, JOI_OPTS);
      expect(error).toBeDefined();
    });
  });

  // ==========================================================================
  // SBOM MANAGER
  // ==========================================================================

  // --- 21. createSBOMEntrySchema ---
  describe('createSBOMEntrySchema', () => {
    const valid = { componentName: 'lodash', componentVersion: '4.17.21' };

    it('should accept valid payload', () => {
      const { error } = createSBOMEntrySchema.validate(valid, JOI_OPTS);
      expect(error).toBeUndefined();
    });

    it('should reject missing componentName', () => {
      const { error } = createSBOMEntrySchema.validate({ componentVersion: '1.0' }, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should reject missing componentVersion', () => {
      const { error } = createSBOMEntrySchema.validate({ componentName: 'X' }, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it.each(['critical', 'high', 'medium', 'low', 'none'])('should accept licenseRisk=%s', (licenseRisk) => {
      const { error } = createSBOMEntrySchema.validate({ ...valid, licenseRisk }, JOI_OPTS);
      expect(error).toBeUndefined();
    });

    it('should reject invalid licenseRisk', () => {
      const { error } = createSBOMEntrySchema.validate({ ...valid, licenseRisk: 'unknown' }, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should accept purl', () => {
      const { error } = createSBOMEntrySchema.validate({ ...valid, purl: 'pkg:npm/lodash@4.17.21' }, JOI_OPTS);
      expect(error).toBeUndefined();
    });

    it('should handle SQL injection in componentName', () => {
      const { error } = createSBOMEntrySchema.validate({ componentName: SQL_INJ, componentVersion: '1.0' }, JOI_OPTS);
      expect(error).toBeUndefined();
    });
  });

  // --- 22. bulkCreateSBOMEntriesSchema ---
  describe('bulkCreateSBOMEntriesSchema', () => {
    const valid = {
      entries: [{ componentName: 'react', componentVersion: '18.2.0' }],
    };

    it('should accept valid payload', () => {
      const { error } = bulkCreateSBOMEntriesSchema.validate(valid, JOI_OPTS);
      expect(error).toBeUndefined();
    });

    it('should reject missing entries', () => {
      const { error } = bulkCreateSBOMEntriesSchema.validate({}, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should reject empty entries array', () => {
      const { error } = bulkCreateSBOMEntriesSchema.validate({ entries: [] }, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should reject entry missing componentName', () => {
      const { error } = bulkCreateSBOMEntriesSchema.validate({
        entries: [{ componentVersion: '1.0' }],
      }, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should reject entry missing componentVersion', () => {
      const { error } = bulkCreateSBOMEntriesSchema.validate({
        entries: [{ componentName: 'X' }],
      }, JOI_OPTS);
      expect(error).toBeDefined();
    });
  });

  // --- 23. createSBOMRepositorySchema ---
  describe('createSBOMRepositorySchema', () => {
    const valid = { name: 'main-app' };

    it('should accept valid payload', () => {
      const { error } = createSBOMRepositorySchema.validate(valid, JOI_OPTS);
      expect(error).toBeUndefined();
    });

    it('should reject missing name', () => {
      const { error } = createSBOMRepositorySchema.validate({}, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should accept optional url as valid URI', () => {
      const { error } = createSBOMRepositorySchema.validate({ name: 'X', url: 'https://github.com/org/repo' }, JOI_OPTS);
      expect(error).toBeUndefined();
    });

    it('should reject invalid url', () => {
      const { error } = createSBOMRepositorySchema.validate({ name: 'X', url: 'not-url' }, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should accept optional lastScan date', () => {
      const { error } = createSBOMRepositorySchema.validate({ name: 'X', lastScan: '2026-03-15T00:00:00Z' }, JOI_OPTS);
      expect(error).toBeUndefined();
    });
  });

  // ==========================================================================
  // POST-MARKET SURVEILLANCE
  // ==========================================================================

  // --- 24. createSurveillancePlanSchema ---
  describe('createSurveillancePlanSchema', () => {
    const valid = { productName: 'Widget Y', planType: 'Proactive', frequency: 'Monthly' };

    it('should accept valid payload', () => {
      const { error } = createSurveillancePlanSchema.validate(valid, JOI_OPTS);
      expect(error).toBeUndefined();
    });

    it('should reject missing productName', () => {
      const { error } = createSurveillancePlanSchema.validate({ planType: 'Proactive', frequency: 'Monthly' }, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should reject missing planType', () => {
      const { error } = createSurveillancePlanSchema.validate({ productName: 'X', frequency: 'Monthly' }, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should reject missing frequency', () => {
      const { error } = createSurveillancePlanSchema.validate({ productName: 'X', planType: 'Proactive' }, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it.each(['Proactive', 'Reactive', 'Continuous', 'Periodic'])('should accept planType=%s', (planType) => {
      const { error } = createSurveillancePlanSchema.validate({ ...valid, planType }, JOI_OPTS);
      expect(error).toBeUndefined();
    });

    it('should reject invalid planType', () => {
      const { error } = createSurveillancePlanSchema.validate({ ...valid, planType: 'Manual' }, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it.each(['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Annual', 'Continuous'])(
      'should accept frequency=%s',
      (frequency) => {
        const { error } = createSurveillancePlanSchema.validate({ ...valid, frequency }, JOI_OPTS);
        expect(error).toBeUndefined();
      },
    );

    it('should reject invalid frequency', () => {
      const { error } = createSurveillancePlanSchema.validate({ ...valid, frequency: 'Hourly' }, JOI_OPTS);
      expect(error).toBeDefined();
    });
  });

  // --- 25. createSurveillanceIncidentSchema ---
  describe('createSurveillanceIncidentSchema', () => {
    const valid = {
      planId: UUID,
      type: 'safety_incident',
      severity: 'High',
      title: 'Overheating Issue',
      reportedDate: '2026-03-10T00:00:00Z',
    };

    it('should accept valid payload', () => {
      const { error } = createSurveillanceIncidentSchema.validate(valid, JOI_OPTS);
      expect(error).toBeUndefined();
    });

    it('should reject missing planId', () => {
      const { planId, ...rest } = valid;
      const { error } = createSurveillanceIncidentSchema.validate(rest, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should reject non-UUID planId', () => {
      const { error } = createSurveillanceIncidentSchema.validate({ ...valid, planId: 'bad' }, STRICT_OPTS);
      expect(error).toBeDefined();
    });

    it.each(['safety_incident', 'complaint', 'adverse_event', 'field_safety', 'trend_report'])(
      'should accept type=%s',
      (type) => {
        const { error } = createSurveillanceIncidentSchema.validate({ ...valid, type }, JOI_OPTS);
        expect(error).toBeUndefined();
      },
    );

    it('should reject invalid type', () => {
      const { error } = createSurveillanceIncidentSchema.validate({ ...valid, type: 'bug' }, JOI_OPTS);
      expect(error).toBeDefined();
    });
  });

  // --- 26. createProductRecallSchema ---
  describe('createProductRecallSchema', () => {
    const valid = { productName: 'Widget Z', recallType: 'Voluntary', reason: 'Safety defect found' };

    it('should accept valid payload', () => {
      const { error } = createProductRecallSchema.validate(valid, JOI_OPTS);
      expect(error).toBeUndefined();
    });

    it('should reject missing productName', () => {
      const { error } = createProductRecallSchema.validate({ recallType: 'Voluntary', reason: 'x' }, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should reject missing recallType', () => {
      const { error } = createProductRecallSchema.validate({ productName: 'X', reason: 'x' }, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should reject missing reason', () => {
      const { error } = createProductRecallSchema.validate({ productName: 'X', recallType: 'Voluntary' }, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it.each(['Voluntary', 'Mandatory', 'Field Safety Corrective Action'])(
      'should accept recallType=%s',
      (recallType) => {
        const { error } = createProductRecallSchema.validate({ ...valid, recallType }, JOI_OPTS);
        expect(error).toBeUndefined();
      },
    );

    it('should reject invalid recallType', () => {
      const { error } = createProductRecallSchema.validate({ ...valid, recallType: 'Suggested' }, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should reject negative affectedUnits', () => {
      const { error } = createProductRecallSchema.validate({ ...valid, affectedUnits: -1 }, JOI_OPTS);
      expect(error).toBeDefined();
    });
  });

  // ==========================================================================
  // PRODUCT DECOMMISSIONING
  // ==========================================================================

  // --- 27. createProductDecommissionSchema ---
  describe('createProductDecommissionSchema', () => {
    const valid = { productName: 'Legacy System' };

    it('should accept valid payload', () => {
      const { error } = createProductDecommissionSchema.validate(valid, JOI_OPTS);
      expect(error).toBeUndefined();
    });

    it('should reject missing productName', () => {
      const { error } = createProductDecommissionSchema.validate({}, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it.each(['active', 'end_of_sale', 'end_of_support', 'end_of_life', 'decommissioned'])(
      'should accept lifecycleStage=%s',
      (lifecycleStage) => {
        const { error } = createProductDecommissionSchema.validate({ ...valid, lifecycleStage }, JOI_OPTS);
        expect(error).toBeUndefined();
      },
    );

    it('should reject invalid lifecycleStage', () => {
      const { error } = createProductDecommissionSchema.validate({ ...valid, lifecycleStage: 'retired' }, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should accept optional date fields', () => {
      const { error } = createProductDecommissionSchema.validate({
        ...valid,
        endOfSaleDate: '2026-06-01T00:00:00Z',
        endOfSupportDate: '2027-01-01T00:00:00Z',
        endOfLifeDate: '2027-06-01T00:00:00Z',
      }, JOI_OPTS);
      expect(error).toBeUndefined();
    });

    it('should accept migrationPath', () => {
      const { error } = createProductDecommissionSchema.validate({ ...valid, migrationPath: 'Migrate to v2' }, JOI_OPTS);
      expect(error).toBeUndefined();
    });
  });

  // ==========================================================================
  // ENVIRONMENTAL LIFECYCLE
  // ==========================================================================

  // --- 28. createLifecycleAssessmentSchema ---
  describe('createLifecycleAssessmentSchema', () => {
    const valid = { productName: 'EcoProduct' };

    it('should accept valid payload', () => {
      const { error } = createLifecycleAssessmentSchema.validate(valid, JOI_OPTS);
      expect(error).toBeUndefined();
    });

    it('should reject missing productName', () => {
      const { error } = createLifecycleAssessmentSchema.validate({}, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should accept phases with valid lifecycle values', () => {
      const { error } = createLifecycleAssessmentSchema.validate({
        ...valid,
        phases: ['Raw Materials', 'Manufacturing', 'Use'],
      }, JOI_OPTS);
      expect(error).toBeUndefined();
    });

    it.each(['Raw Materials', 'Manufacturing', 'Distribution', 'Use', 'End of Life'])(
      'should accept phase=%s',
      (phase) => {
        const { error } = createLifecycleAssessmentSchema.validate({ ...valid, phases: [phase] }, JOI_OPTS);
        expect(error).toBeUndefined();
      },
    );

    it('should reject invalid phase', () => {
      const { error } = createLifecycleAssessmentSchema.validate({ ...valid, phases: ['Disposal'] }, JOI_OPTS);
      expect(error).toBeDefined();
    });
  });

  // --- 29. updateLifecycleAssessmentSchema ---
  describe('updateLifecycleAssessmentSchema', () => {
    it('should accept partial update', () => {
      const { error } = updateLifecycleAssessmentSchema.validate({ totalCarbonFootprint: 100 }, JOI_OPTS);
      expect(error).toBeUndefined();
    });

    it('should reject empty object', () => {
      const { error } = updateLifecycleAssessmentSchema.validate({}, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should reject negative totalCarbonFootprint', () => {
      const { error } = updateLifecycleAssessmentSchema.validate({ totalCarbonFootprint: -1 }, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should reject negative waterUsage', () => {
      const { error } = updateLifecycleAssessmentSchema.validate({ waterUsage: -1 }, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should reject negative energyConsumption', () => {
      const { error } = updateLifecycleAssessmentSchema.validate({ energyConsumption: -1 }, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should accept recommendations as string array', () => {
      const { error } = updateLifecycleAssessmentSchema.validate({ recommendations: ['Reduce waste'] }, JOI_OPTS);
      expect(error).toBeUndefined();
    });
  });

  // ==========================================================================
  // PRODUCT LIFECYCLE TRACKER
  // ==========================================================================

  // --- 30. createProductLifecycleSchema ---
  describe('createProductLifecycleSchema', () => {
    const valid = { productName: 'Smart Sensor' };

    it('should accept valid payload', () => {
      const { error } = createProductLifecycleSchema.validate(valid, JOI_OPTS);
      expect(error).toBeUndefined();
    });

    it('should reject missing productName', () => {
      const { error } = createProductLifecycleSchema.validate({}, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it.each(['Concept', 'Development', 'Testing', 'Production', 'Active', 'Declining', 'End of Life'])(
      'should accept currentStage=%s',
      (currentStage) => {
        const { error } = createProductLifecycleSchema.validate({ ...valid, currentStage }, JOI_OPTS);
        expect(error).toBeUndefined();
      },
    );

    it('should reject invalid currentStage', () => {
      const { error } = createProductLifecycleSchema.validate({ ...valid, currentStage: 'Launch' }, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should accept targetMarkets as array', () => {
      const { error } = createProductLifecycleSchema.validate({ ...valid, targetMarkets: ['EU', 'US'] }, JOI_OPTS);
      expect(error).toBeUndefined();
    });
  });

  // --- 31. updateProductLifecycleSchema ---
  describe('updateProductLifecycleSchema', () => {
    it('should accept partial update', () => {
      const { error } = updateProductLifecycleSchema.validate({ currentStage: 'Active' }, JOI_OPTS);
      expect(error).toBeUndefined();
    });

    it('should reject empty object', () => {
      const { error } = updateProductLifecycleSchema.validate({}, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should accept marketExit date', () => {
      const { error } = updateProductLifecycleSchema.validate({ marketExit: '2028-01-01T00:00:00Z' }, JOI_OPTS);
      expect(error).toBeUndefined();
    });
  });

  // ==========================================================================
  // PROCESS MAPPER
  // ==========================================================================

  // --- 32. createProcessMapSchema ---
  describe('createProcessMapSchema', () => {
    const valid = {
      name: 'Incident Response',
      nodes: [{ id: '1', label: 'Start' }],
      edges: [{ from: '1', to: '2' }],
    };

    it('should accept valid payload', () => {
      const { error } = createProcessMapSchema.validate(valid, JOI_OPTS);
      expect(error).toBeUndefined();
    });

    it('should reject missing name', () => {
      const { error } = createProcessMapSchema.validate({ nodes: [{ id: '1' }], edges: [] }, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should reject missing nodes', () => {
      const { error } = createProcessMapSchema.validate({ name: 'X', edges: [] }, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should reject empty nodes array', () => {
      const { error } = createProcessMapSchema.validate({ name: 'X', nodes: [], edges: [] }, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should reject missing edges', () => {
      const { error } = createProcessMapSchema.validate({ name: 'X', nodes: [{ id: '1' }] }, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should accept empty edges array', () => {
      const { error } = createProcessMapSchema.validate({ name: 'X', nodes: [{ id: '1' }], edges: [] }, JOI_OPTS);
      expect(error).toBeUndefined();
    });

    it('should accept optional description, category, version', () => {
      const { error } = createProcessMapSchema.validate({
        ...valid,
        description: 'Process map for incident response',
        category: 'Security',
        version: '1.0',
      }, JOI_OPTS);
      expect(error).toBeUndefined();
    });

    it('should reject version > 20 chars', () => {
      const { error } = createProcessMapSchema.validate({ ...valid, version: 'x'.repeat(21) }, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should handle XSS in name', () => {
      const { error } = createProcessMapSchema.validate({ ...valid, name: XSS }, JOI_OPTS);
      expect(error).toBeUndefined();
    });
  });

  // --- 33. updateProcessMapSchema ---
  describe('updateProcessMapSchema', () => {
    it('should accept partial update', () => {
      const { error } = updateProcessMapSchema.validate({ name: 'Updated' }, JOI_OPTS);
      expect(error).toBeUndefined();
    });

    it('should reject empty object', () => {
      const { error } = updateProcessMapSchema.validate({}, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it.each(['draft', 'active', 'archived'])('should accept status=%s', (status) => {
      const { error } = updateProcessMapSchema.validate({ status }, JOI_OPTS);
      expect(error).toBeUndefined();
    });

    it('should reject invalid status', () => {
      const { error } = updateProcessMapSchema.validate({ status: 'deleted' }, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should reject empty nodes array when provided', () => {
      const { error } = updateProcessMapSchema.validate({ nodes: [] }, JOI_OPTS);
      expect(error).toBeDefined();
    });
  });
});
