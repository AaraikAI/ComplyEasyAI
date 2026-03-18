import { describe, it, expect } from '@jest/globals';
import {
  createRiskAssessmentSchema,
  createQuestionnaireSchema,
  questionnaireFromTemplateSchema,
  updateQuestionnaireSchema,
  questionnaireQuestionsSchema,
  questionnaireResponseSchema,
  createPolicySchema,
  updatePolicySchema,
  bulkImportPoliciesSchema,
  createCertificateSchema,
  generateCertificateSchema,
  createChildOrganizationSchema,
  moveUserSchema,
  cloneFrameworkSchema,
  createReportSchema,
  createMonitorSchema,
  updateMonitorSchema,
  toggleMonitorSchema,
  createIssueSchema,
  assignIssueSchema,
  issueCommentSchema,
  updateIssueSchema,
  issueStatusSchema,
  predictRisksSchema,
  autopilotOptionsSchema,
} from '../../../validators/enterpriseSchemas';

const JOI_OPTS = { abortEarly: false, stripUnknown: true, convert: true } as const;
const STRICT_OPTS = { abortEarly: false, convert: true } as const;

// ---------------------------------------------------------------------------
// Helper: XSS / SQL payloads
// ---------------------------------------------------------------------------
const XSS_STRING = '<script>alert("xss")</script>';
const SQL_INJECTION = "'; DROP TABLE users; --";

describe('enterpriseSchemas contract tests', () => {
  // ==========================================================================
  // 1. createRiskAssessmentSchema
  // ==========================================================================
  describe('createRiskAssessmentSchema', () => {
    const valid = { name: 'Risk Assessment Q1' };

    it('should accept a valid payload', () => {
      const { error, value } = createRiskAssessmentSchema.validate(valid, JOI_OPTS);
      expect(error).toBeUndefined();
      expect(value).toBeDefined();
    });

    it('should accept a full payload with all optional fields', () => {
      const full = {
        name: 'Full Assessment',
        description: 'A detailed description',
        assessmentType: 'Annual',
        scope: 'Company-wide',
        methodology: 'NIST',
      };
      const { error } = createRiskAssessmentSchema.validate(full, JOI_OPTS);
      expect(error).toBeUndefined();
    });

    it('should reject missing name', () => {
      const { error } = createRiskAssessmentSchema.validate({ description: 'test' }, JOI_OPTS);
      expect(error).toBeDefined();
      expect(error!.details.some((d) => d.message.includes('name'))).toBe(true);
    });

    it('should reject name exceeding 300 chars', () => {
      const { error } = createRiskAssessmentSchema.validate({ name: 'x'.repeat(301) }, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should reject description exceeding 2000 chars', () => {
      const { error } = createRiskAssessmentSchema.validate(
        { name: 'Test', description: 'x'.repeat(2001) },
        JOI_OPTS,
      );
      expect(error).toBeDefined();
    });

    it('should allow empty string for description', () => {
      const { error } = createRiskAssessmentSchema.validate({ name: 'Test', description: '' }, JOI_OPTS);
      expect(error).toBeUndefined();
    });

    it('should allow null for description', () => {
      const { error } = createRiskAssessmentSchema.validate({ name: 'Test', description: null }, JOI_OPTS);
      expect(error).toBeUndefined();
    });

    it('should reject unknown fields even with stripUnknown (unknown(false))', () => {
      const { error } = createRiskAssessmentSchema.validate({ name: 'Test', extra: 1 }, JOI_OPTS);
      expect(error).toBeDefined();
      expect(error!.details.some((d) => d.type === 'object.unknown')).toBe(true);
    });

    it('should reject unknown fields in strict mode', () => {
      const { error } = createRiskAssessmentSchema.validate({ name: 'Test', extra: 1 }, STRICT_OPTS);
      expect(error).toBeDefined();
    });

    it('should trim name', () => {
      const { value } = createRiskAssessmentSchema.validate({ name: '  trimmed  ' }, JOI_OPTS);
      expect(value!.name).toBe('trimmed');
    });
  });

  // ==========================================================================
  // 2. createQuestionnaireSchema
  // ==========================================================================
  describe('createQuestionnaireSchema', () => {
    const valid = { title: 'Q4 Vendor Assessment' };

    it('should accept valid payload', () => {
      const { error } = createQuestionnaireSchema.validate(valid, JOI_OPTS);
      expect(error).toBeUndefined();
    });

    it('should accept full payload', () => {
      const { error } = createQuestionnaireSchema.validate({
        title: 'Full',
        description: 'Desc',
        questionnaireType: 'Security',
        dueDate: '2026-12-31T00:00:00.000Z',
        requestedBy: 'admin@co.com',
      }, JOI_OPTS);
      expect(error).toBeUndefined();
    });

    it('should default questionnaireType to General', () => {
      const { value } = createQuestionnaireSchema.validate(valid, JOI_OPTS);
      expect(value!.questionnaireType).toBe('General');
    });

    it('should reject missing title', () => {
      const { error } = createQuestionnaireSchema.validate({ description: 'x' }, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should reject title > 300', () => {
      const { error } = createQuestionnaireSchema.validate({ title: 'x'.repeat(301) }, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should reject invalid ISO date for dueDate', () => {
      const { error } = createQuestionnaireSchema.validate({ title: 'T', dueDate: 'not-a-date' }, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should allow null dueDate', () => {
      const { error } = createQuestionnaireSchema.validate({ title: 'T', dueDate: null }, JOI_OPTS);
      expect(error).toBeUndefined();
    });
  });

  // ==========================================================================
  // 3. questionnaireFromTemplateSchema
  // ==========================================================================
  describe('questionnaireFromTemplateSchema', () => {
    const valid = { templateId: 'tmpl-001' };

    it('should accept valid payload', () => {
      const { error } = questionnaireFromTemplateSchema.validate(valid, JOI_OPTS);
      expect(error).toBeUndefined();
    });

    it('should reject missing templateId', () => {
      const { error } = questionnaireFromTemplateSchema.validate({}, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should reject templateId > 100 chars', () => {
      const { error } = questionnaireFromTemplateSchema.validate({ templateId: 'x'.repeat(101) }, JOI_OPTS);
      expect(error).toBeDefined();
    });
  });

  // ==========================================================================
  // 4. updateQuestionnaireSchema
  // ==========================================================================
  describe('updateQuestionnaireSchema', () => {
    it('should accept partial update with title', () => {
      const { error } = updateQuestionnaireSchema.validate({ title: 'Updated' }, JOI_OPTS);
      expect(error).toBeUndefined();
    });

    it('should reject empty object', () => {
      const { error } = updateQuestionnaireSchema.validate({}, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should reject unknown fields in strict mode', () => {
      const { error } = updateQuestionnaireSchema.validate({ title: 'X', hack: true }, STRICT_OPTS);
      expect(error).toBeDefined();
    });
  });

  // ==========================================================================
  // 5. questionnaireQuestionsSchema
  // ==========================================================================
  describe('questionnaireQuestionsSchema', () => {
    const valid = {
      questions: [
        { questionText: 'What is your name?', questionType: 'text' },
      ],
    };

    it('should accept valid questions array', () => {
      const { error } = questionnaireQuestionsSchema.validate(valid, JOI_OPTS);
      expect(error).toBeUndefined();
    });

    it('should reject missing questions', () => {
      const { error } = questionnaireQuestionsSchema.validate({}, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should reject empty questions array', () => {
      const { error } = questionnaireQuestionsSchema.validate({ questions: [] }, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should reject questions array > 500 items', () => {
      const items = Array.from({ length: 501 }, (_, i) => ({
        questionText: `Q${i}`,
        questionType: 'text',
      }));
      const { error } = questionnaireQuestionsSchema.validate({ questions: items }, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should reject a question missing questionText', () => {
      const { error } = questionnaireQuestionsSchema.validate({
        questions: [{ questionType: 'text' }],
      }, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should reject a question missing questionType', () => {
      const { error } = questionnaireQuestionsSchema.validate({
        questions: [{ questionText: 'Q?' }],
      }, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should accept optional fields in questions', () => {
      const { error } = questionnaireQuestionsSchema.validate({
        questions: [{
          questionText: 'Q?',
          questionType: 'multi',
          category: 'Security',
          required: true,
          options: ['a', 'b'],
          order: 1,
        }],
      }, JOI_OPTS);
      expect(error).toBeUndefined();
    });
  });

  // ==========================================================================
  // 6. questionnaireResponseSchema
  // ==========================================================================
  describe('questionnaireResponseSchema', () => {
    const valid = { questionId: 'q-001' };

    it('should accept valid payload', () => {
      const { error } = questionnaireResponseSchema.validate(valid, JOI_OPTS);
      expect(error).toBeUndefined();
    });

    it('should reject missing questionId', () => {
      const { error } = questionnaireResponseSchema.validate({ responseText: 'yes' }, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should reject responseText > 5000', () => {
      const { error } = questionnaireResponseSchema.validate(
        { questionId: 'q1', responseText: 'x'.repeat(5001) },
        JOI_OPTS,
      );
      expect(error).toBeDefined();
    });

    it('should accept responseData as object', () => {
      const { error } = questionnaireResponseSchema.validate(
        { questionId: 'q1', responseData: { key: 'val' } },
        JOI_OPTS,
      );
      expect(error).toBeUndefined();
    });

    it('should accept responseData as array', () => {
      const { error } = questionnaireResponseSchema.validate(
        { questionId: 'q1', responseData: [1, 2] },
        JOI_OPTS,
      );
      expect(error).toBeUndefined();
    });
  });

  // ==========================================================================
  // 7. createPolicySchema
  // ==========================================================================
  describe('createPolicySchema', () => {
    const valid = {
      title: 'Data Protection Policy',
      category: 'Privacy',
      content: 'Policy content goes here.',
    };

    it('should accept valid payload', () => {
      const { error } = createPolicySchema.validate(valid, JOI_OPTS);
      expect(error).toBeUndefined();
    });

    it('should reject missing title', () => {
      const { error } = createPolicySchema.validate({ category: 'A', content: 'B' }, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should reject missing category', () => {
      const { error } = createPolicySchema.validate({ title: 'A', content: 'B' }, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should reject missing content', () => {
      const { error } = createPolicySchema.validate({ title: 'A', category: 'B' }, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should reject content > 500000 chars', () => {
      const { error } = createPolicySchema.validate(
        { title: 'A', category: 'B', content: 'x'.repeat(500001) },
        JOI_OPTS,
      );
      expect(error).toBeDefined();
    });

    it('should accept tags as array', () => {
      const { error } = createPolicySchema.validate({ ...valid, tags: ['gdpr', 'hipaa'] }, JOI_OPTS);
      expect(error).toBeUndefined();
    });

    it('should accept tags as null', () => {
      const { error } = createPolicySchema.validate({ ...valid, tags: null }, JOI_OPTS);
      expect(error).toBeUndefined();
    });
  });

  // ==========================================================================
  // 8. updatePolicySchema
  // ==========================================================================
  describe('updatePolicySchema', () => {
    it('should accept partial update', () => {
      const { error } = updatePolicySchema.validate({ title: 'Updated' }, JOI_OPTS);
      expect(error).toBeUndefined();
    });

    it('should reject empty object', () => {
      const { error } = updatePolicySchema.validate({}, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should accept status field', () => {
      const { error } = updatePolicySchema.validate({ status: 'active' }, JOI_OPTS);
      expect(error).toBeUndefined();
    });
  });

  // ==========================================================================
  // 9. bulkImportPoliciesSchema
  // ==========================================================================
  describe('bulkImportPoliciesSchema', () => {
    const valid = { policies: [{ title: 'P1', category: 'Security' }] };

    it('should accept valid payload', () => {
      const { error } = bulkImportPoliciesSchema.validate(valid, JOI_OPTS);
      expect(error).toBeUndefined();
    });

    it('should reject missing policies', () => {
      const { error } = bulkImportPoliciesSchema.validate({}, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should reject empty policies array', () => {
      const { error } = bulkImportPoliciesSchema.validate({ policies: [] }, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should reject policies array > 200', () => {
      const items = Array.from({ length: 201 }, () => ({ title: 'P' }));
      const { error } = bulkImportPoliciesSchema.validate({ policies: items }, JOI_OPTS);
      expect(error).toBeDefined();
    });
  });

  // ==========================================================================
  // 10. createCertificateSchema
  // ==========================================================================
  describe('createCertificateSchema', () => {
    const valid = {
      certificateType: 'SOC2',
      issuer: 'AICPA',
      issueDate: '2026-01-01T00:00:00.000Z',
      expiryDate: '2027-01-01T00:00:00.000Z',
    };

    it('should accept valid payload', () => {
      const { error } = createCertificateSchema.validate(valid, JOI_OPTS);
      expect(error).toBeUndefined();
    });

    it('should reject missing certificateType', () => {
      const { issuer, issueDate, expiryDate } = valid;
      const { error } = createCertificateSchema.validate({ issuer, issueDate, expiryDate }, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should reject missing issuer', () => {
      const { certificateType, issueDate, expiryDate } = valid;
      const { error } = createCertificateSchema.validate({ certificateType, issueDate, expiryDate }, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should reject missing issueDate', () => {
      const { error } = createCertificateSchema.validate({
        certificateType: 'SOC2',
        issuer: 'AICPA',
        expiryDate: '2027-01-01T00:00:00.000Z',
      }, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should reject missing expiryDate', () => {
      const { error } = createCertificateSchema.validate({
        certificateType: 'SOC2',
        issuer: 'AICPA',
        issueDate: '2026-01-01T00:00:00.000Z',
      }, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should reject invalid URI for documentUrl', () => {
      const { error } = createCertificateSchema.validate({ ...valid, documentUrl: 'not-a-url' }, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should accept valid documentUrl', () => {
      const { error } = createCertificateSchema.validate(
        { ...valid, documentUrl: 'https://example.com/cert.pdf' },
        JOI_OPTS,
      );
      expect(error).toBeUndefined();
    });

    it('should accept metadata as object', () => {
      const { error } = createCertificateSchema.validate({ ...valid, metadata: { scope: 'full' } }, JOI_OPTS);
      expect(error).toBeUndefined();
    });

    it('should accept publiclyVisible boolean', () => {
      const { error } = createCertificateSchema.validate({ ...valid, publiclyVisible: true }, JOI_OPTS);
      expect(error).toBeUndefined();
    });
  });

  // ==========================================================================
  // 11. generateCertificateSchema
  // ==========================================================================
  describe('generateCertificateSchema', () => {
    it('should accept valid frameworkId', () => {
      const { error } = generateCertificateSchema.validate({ frameworkId: 'fw-001' }, JOI_OPTS);
      expect(error).toBeUndefined();
    });

    it('should reject missing frameworkId', () => {
      const { error } = generateCertificateSchema.validate({}, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should reject frameworkId > 100 chars', () => {
      const { error } = generateCertificateSchema.validate({ frameworkId: 'x'.repeat(101) }, JOI_OPTS);
      expect(error).toBeDefined();
    });
  });

  // ==========================================================================
  // 12. createChildOrganizationSchema
  // ==========================================================================
  describe('createChildOrganizationSchema', () => {
    const valid = { name: 'Child Org' };

    it('should accept valid payload', () => {
      const { error } = createChildOrganizationSchema.validate(valid, JOI_OPTS);
      expect(error).toBeUndefined();
    });

    it('should reject missing name', () => {
      const { error } = createChildOrganizationSchema.validate({ industry: 'Tech' }, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should accept optional industry and companySize', () => {
      const { error } = createChildOrganizationSchema.validate({
        name: 'Child',
        industry: 'Finance',
        companySize: '100-500',
      }, JOI_OPTS);
      expect(error).toBeUndefined();
    });

    it('should reject name > 300', () => {
      const { error } = createChildOrganizationSchema.validate({ name: 'x'.repeat(301) }, JOI_OPTS);
      expect(error).toBeDefined();
    });
  });

  // ==========================================================================
  // 13. moveUserSchema
  // ==========================================================================
  describe('moveUserSchema', () => {
    const valid = { userId: 'u-001', targetOrganizationId: 'org-002' };

    it('should accept valid payload', () => {
      const { error } = moveUserSchema.validate(valid, JOI_OPTS);
      expect(error).toBeUndefined();
    });

    it('should reject missing userId', () => {
      const { error } = moveUserSchema.validate({ targetOrganizationId: 'org-002' }, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should reject missing targetOrganizationId', () => {
      const { error } = moveUserSchema.validate({ userId: 'u-001' }, JOI_OPTS);
      expect(error).toBeDefined();
    });
  });

  // ==========================================================================
  // 14. cloneFrameworkSchema
  // ==========================================================================
  describe('cloneFrameworkSchema', () => {
    const valid = { frameworkId: 'fw-001', targetOrganizationIds: ['org-1'] };

    it('should accept valid payload', () => {
      const { error } = cloneFrameworkSchema.validate(valid, JOI_OPTS);
      expect(error).toBeUndefined();
    });

    it('should reject missing frameworkId', () => {
      const { error } = cloneFrameworkSchema.validate({ targetOrganizationIds: ['org-1'] }, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should reject empty targetOrganizationIds', () => {
      const { error } = cloneFrameworkSchema.validate({ frameworkId: 'fw-001', targetOrganizationIds: [] }, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should reject targetOrganizationIds > 50 items', () => {
      const ids = Array.from({ length: 51 }, (_, i) => `org-${i}`);
      const { error } = cloneFrameworkSchema.validate({ frameworkId: 'fw', targetOrganizationIds: ids }, JOI_OPTS);
      expect(error).toBeDefined();
    });
  });

  // ==========================================================================
  // 15. createReportSchema
  // ==========================================================================
  describe('createReportSchema', () => {
    const valid = {
      name: 'Monthly Report',
      reportType: 'compliance',
      template: { sections: ['overview'] },
    };

    it('should accept valid payload', () => {
      const { error } = createReportSchema.validate(valid, JOI_OPTS);
      expect(error).toBeUndefined();
    });

    it('should reject missing name', () => {
      const { error } = createReportSchema.validate({ reportType: 'a', template: {} }, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should reject missing reportType', () => {
      const { error } = createReportSchema.validate({ name: 'R', template: {} }, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should reject missing template', () => {
      const { error } = createReportSchema.validate({ name: 'R', reportType: 'a' }, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should accept template as array', () => {
      const { error } = createReportSchema.validate({ name: 'R', reportType: 'a', template: ['sec1'] }, JOI_OPTS);
      expect(error).toBeUndefined();
    });

    it('should accept filters, schedule, recipients as null', () => {
      const { error } = createReportSchema.validate(
        { ...valid, filters: null, schedule: null, recipients: null },
        JOI_OPTS,
      );
      expect(error).toBeUndefined();
    });
  });

  // ==========================================================================
  // 16. createMonitorSchema
  // ==========================================================================
  describe('createMonitorSchema', () => {
    const valid = {
      name: 'Uptime Check',
      monitorType: 'http',
      configuration: { url: 'https://api.example.com' },
    };

    it('should accept valid payload', () => {
      const { error } = createMonitorSchema.validate(valid, JOI_OPTS);
      expect(error).toBeUndefined();
    });

    it('should reject missing name', () => {
      const { error } = createMonitorSchema.validate({ monitorType: 'a', configuration: {} }, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should reject missing configuration', () => {
      const { error } = createMonitorSchema.validate({ name: 'M', monitorType: 'http' }, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should reject testScript > 10000 chars', () => {
      const { error } = createMonitorSchema.validate(
        { ...valid, testScript: 'x'.repeat(10001) },
        JOI_OPTS,
      );
      expect(error).toBeDefined();
    });
  });

  // ==========================================================================
  // 17. updateMonitorSchema
  // ==========================================================================
  describe('updateMonitorSchema', () => {
    it('should accept partial update', () => {
      const { error } = updateMonitorSchema.validate({ name: 'Updated' }, JOI_OPTS);
      expect(error).toBeUndefined();
    });

    it('should reject empty object', () => {
      const { error } = updateMonitorSchema.validate({}, JOI_OPTS);
      expect(error).toBeDefined();
    });
  });

  // ==========================================================================
  // 18. toggleMonitorSchema
  // ==========================================================================
  describe('toggleMonitorSchema', () => {
    it('should accept active=true', () => {
      const { error } = toggleMonitorSchema.validate({ active: true }, JOI_OPTS);
      expect(error).toBeUndefined();
    });

    it('should accept active=false', () => {
      const { error } = toggleMonitorSchema.validate({ active: false }, JOI_OPTS);
      expect(error).toBeUndefined();
    });

    it('should reject missing active', () => {
      const { error } = toggleMonitorSchema.validate({}, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should reject non-boolean active', () => {
      const { error } = toggleMonitorSchema.validate({ active: 'yes' }, STRICT_OPTS);
      expect(error).toBeDefined();
    });
  });

  // ==========================================================================
  // 19. createIssueSchema
  // ==========================================================================
  describe('createIssueSchema', () => {
    const valid = {
      title: 'Missing Encryption',
      description: 'Data at rest is not encrypted.',
      issueType: 'Finding',
    };

    it('should accept valid payload', () => {
      const { error } = createIssueSchema.validate(valid, JOI_OPTS);
      expect(error).toBeUndefined();
    });

    it('should reject missing title', () => {
      const { error } = createIssueSchema.validate({ description: 'x', issueType: 'y' }, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should reject missing description', () => {
      const { error } = createIssueSchema.validate({ title: 'x', issueType: 'y' }, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should reject missing issueType', () => {
      const { error } = createIssueSchema.validate({ title: 'x', description: 'y' }, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it.each(['Low', 'Medium', 'High', 'Critical'])('should accept priority=%s', (priority) => {
      const { error } = createIssueSchema.validate({ ...valid, priority }, JOI_OPTS);
      expect(error).toBeUndefined();
    });

    it('should reject invalid priority', () => {
      const { error } = createIssueSchema.validate({ ...valid, priority: 'Urgent' }, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should reject description > 10000', () => {
      const { error } = createIssueSchema.validate(
        { ...valid, description: 'x'.repeat(10001) },
        JOI_OPTS,
      );
      expect(error).toBeDefined();
    });

    it('should accept remediationSteps as array', () => {
      const { error } = createIssueSchema.validate(
        { ...valid, remediationSteps: ['Step 1', 'Step 2'] },
        JOI_OPTS,
      );
      expect(error).toBeUndefined();
    });

    it('should handle security XSS payload in title', () => {
      const { error } = createIssueSchema.validate(
        { ...valid, title: XSS_STRING },
        JOI_OPTS,
      );
      expect(error).toBeUndefined(); // schema does not reject HTML
    });

    it('should handle SQL injection payload in description', () => {
      const { error } = createIssueSchema.validate(
        { ...valid, description: SQL_INJECTION },
        JOI_OPTS,
      );
      expect(error).toBeUndefined(); // schema validates length/type only
    });
  });

  // ==========================================================================
  // 20. assignIssueSchema
  // ==========================================================================
  describe('assignIssueSchema', () => {
    it('should accept valid assignedToId', () => {
      const { error } = assignIssueSchema.validate({ assignedToId: 'user-123' }, JOI_OPTS);
      expect(error).toBeUndefined();
    });

    it('should accept null assignedToId (unassign)', () => {
      const { error } = assignIssueSchema.validate({ assignedToId: null }, JOI_OPTS);
      expect(error).toBeUndefined();
    });

    it('should reject missing assignedToId', () => {
      const { error } = assignIssueSchema.validate({}, JOI_OPTS);
      expect(error).toBeDefined();
    });
  });

  // ==========================================================================
  // 21. issueCommentSchema
  // ==========================================================================
  describe('issueCommentSchema', () => {
    it('should accept valid comment', () => {
      const { error } = issueCommentSchema.validate({ comment: 'Looks good.' }, JOI_OPTS);
      expect(error).toBeUndefined();
    });

    it('should reject missing comment', () => {
      const { error } = issueCommentSchema.validate({}, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should reject comment > 5000 chars', () => {
      const { error } = issueCommentSchema.validate({ comment: 'x'.repeat(5001) }, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should trim comment', () => {
      const { value } = issueCommentSchema.validate({ comment: '  trimmed  ' }, JOI_OPTS);
      expect(value!.comment).toBe('trimmed');
    });
  });

  // ==========================================================================
  // 22. updateIssueSchema
  // ==========================================================================
  describe('updateIssueSchema', () => {
    it('should accept partial update', () => {
      const { error } = updateIssueSchema.validate({ title: 'Updated Title' }, JOI_OPTS);
      expect(error).toBeUndefined();
    });

    it('should reject empty object', () => {
      const { error } = updateIssueSchema.validate({}, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it.each(['Low', 'Medium', 'High', 'Critical'])('should accept priority=%s', (priority) => {
      const { error } = updateIssueSchema.validate({ priority }, JOI_OPTS);
      expect(error).toBeUndefined();
    });

    it('should reject invalid priority', () => {
      const { error } = updateIssueSchema.validate({ priority: 'Extreme' }, JOI_OPTS);
      expect(error).toBeDefined();
    });
  });

  // ==========================================================================
  // 23. issueStatusSchema
  // ==========================================================================
  describe('issueStatusSchema', () => {
    it('should accept valid status', () => {
      const { error } = issueStatusSchema.validate({ status: 'Open' }, JOI_OPTS);
      expect(error).toBeUndefined();
    });

    it('should reject missing status', () => {
      const { error } = issueStatusSchema.validate({}, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should reject status > 50 chars', () => {
      const { error } = issueStatusSchema.validate({ status: 'x'.repeat(51) }, JOI_OPTS);
      expect(error).toBeDefined();
    });
  });

  // ==========================================================================
  // 24. predictRisksSchema
  // ==========================================================================
  describe('predictRisksSchema', () => {
    it('should accept valid timeHorizonDays', () => {
      const { error } = predictRisksSchema.validate({ timeHorizonDays: 30 }, JOI_OPTS);
      expect(error).toBeUndefined();
    });

    it('should accept empty object', () => {
      const { error } = predictRisksSchema.validate({}, JOI_OPTS);
      expect(error).toBeUndefined();
    });

    it('should reject timeHorizonDays < 1', () => {
      const { error } = predictRisksSchema.validate({ timeHorizonDays: 0 }, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should reject timeHorizonDays > 365', () => {
      const { error } = predictRisksSchema.validate({ timeHorizonDays: 366 }, JOI_OPTS);
      expect(error).toBeDefined();
    });

    it('should accept boundary value 1', () => {
      const { error } = predictRisksSchema.validate({ timeHorizonDays: 1 }, JOI_OPTS);
      expect(error).toBeUndefined();
    });

    it('should accept boundary value 365', () => {
      const { error } = predictRisksSchema.validate({ timeHorizonDays: 365 }, JOI_OPTS);
      expect(error).toBeUndefined();
    });
  });

  // ==========================================================================
  // 25. autopilotOptionsSchema
  // ==========================================================================
  describe('autopilotOptionsSchema', () => {
    it('should accept empty object', () => {
      const { error } = autopilotOptionsSchema.validate({}, JOI_OPTS);
      expect(error).toBeUndefined();
    });

    it('should accept options object', () => {
      const { error } = autopilotOptionsSchema.validate({ options: { mode: 'auto' } }, JOI_OPTS);
      expect(error).toBeUndefined();
    });

    it('should accept unknown fields (unknown: true)', () => {
      const { error } = autopilotOptionsSchema.validate({ anything: 'goes', extra: 123 }, STRICT_OPTS);
      expect(error).toBeUndefined();
    });
  });
});
