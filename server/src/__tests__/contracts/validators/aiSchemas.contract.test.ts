import { describe, it, expect } from '@jest/globals';
import {
  aiReportSchema,
  aiPolicySchema,
  aiGapAnalysisSchema,
  aiChatSchema,
  aiContractSchema,
  aiRfpSchema,
  aiPhishingSchema,
  aiVendorScoreSchema,
  aiDataMapSchema,
  aiBcpSchema,
  aiCrossFrameworkSchema,
  aiAutoRemediationSchema,
  aiEvidenceCompletenessSchema,
  aiAgenticVendorRiskSchema,
  aiAuditSimulationSchema,
  aiNlQuerySchema,
  aiCopilotSchema,
  aiForecastSchema,
  aiAnalyzeProcessSchema,
  aiPromptSchema,
} from '../../../validators/aiSchemas';

const opts = { abortEarly: false, stripUnknown: true, convert: true };

// ---------------------------------------------------------------------------
// aiReportSchema
// ---------------------------------------------------------------------------
describe('aiReportSchema contract', () => {
  const valid = { framework: 'SOC2', companyName: 'Acme', context: 'We do security' };

  it('should accept valid payload', () => {
    const { error, value } = aiReportSchema.validate(valid, opts);
    expect(error).toBeUndefined();
    expect(value).toBeDefined();
  });

  it('should reject empty payload', () => {
    const { error } = aiReportSchema.validate({}, opts);
    expect(error).toBeDefined();
  });

  it('should require framework', () => {
    const { error } = aiReportSchema.validate({ companyName: 'A', context: 'C' }, opts);
    expect(error).toBeDefined();
  });

  it('should require companyName', () => {
    const { error } = aiReportSchema.validate({ framework: 'SOC2', context: 'C' }, opts);
    expect(error).toBeDefined();
  });

  it('should require context', () => {
    const { error } = aiReportSchema.validate({ framework: 'SOC2', companyName: 'A' }, opts);
    expect(error).toBeDefined();
  });

  it('should enforce companyName max length of 500', () => {
    const { error } = aiReportSchema.validate(
      { ...valid, companyName: 'a'.repeat(501) }, opts,
    );
    expect(error).toBeDefined();
  });

  it('should enforce context max length of 10000', () => {
    const { error } = aiReportSchema.validate(
      { ...valid, context: 'a'.repeat(10001) }, opts,
    );
    expect(error).toBeDefined();
  });

  it('should strip unknown fields', () => {
    const { value } = aiReportSchema.validate({ ...valid, extra: 'x' }, opts);
    expect((value as any).extra).toBeUndefined();
  });

  it('should handle SQL injection', () => {
    const r = aiReportSchema.validate({ ...valid, companyName: "'; DROP TABLE--" }, opts);
    expect(r).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// aiPolicySchema
// ---------------------------------------------------------------------------
describe('aiPolicySchema contract', () => {
  const valid = { type: 'Privacy', company: 'Acme', tone: 'professional' };

  it('should accept valid payload', () => {
    const { error } = aiPolicySchema.validate(valid, opts);
    expect(error).toBeUndefined();
  });

  it('should reject empty payload', () => {
    const { error } = aiPolicySchema.validate({}, opts);
    expect(error).toBeDefined();
  });

  it('should require type', () => {
    const { error } = aiPolicySchema.validate({ company: 'A', tone: 't' }, opts);
    expect(error).toBeDefined();
  });

  it('should require company', () => {
    const { error } = aiPolicySchema.validate({ type: 'T', tone: 't' }, opts);
    expect(error).toBeDefined();
  });

  it('should require tone', () => {
    const { error } = aiPolicySchema.validate({ type: 'T', company: 'A' }, opts);
    expect(error).toBeDefined();
  });

  it('should enforce company max length of 500', () => {
    const { error } = aiPolicySchema.validate({ ...valid, company: 'a'.repeat(501) }, opts);
    expect(error).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// aiGapAnalysisSchema
// ---------------------------------------------------------------------------
describe('aiGapAnalysisSchema contract', () => {
  const valid = { current: 'We have basic controls', target: 'SOC2' };

  it('should accept valid payload with string target', () => {
    const { error } = aiGapAnalysisSchema.validate(valid, opts);
    expect(error).toBeUndefined();
  });

  it('should accept array target', () => {
    const { error } = aiGapAnalysisSchema.validate(
      { current: 'desc', target: ['SOC2', 'ISO27001'] }, opts,
    );
    expect(error).toBeUndefined();
  });

  it('should reject empty payload', () => {
    const { error } = aiGapAnalysisSchema.validate({}, opts);
    expect(error).toBeDefined();
  });

  it('should require current', () => {
    const { error } = aiGapAnalysisSchema.validate({ target: 'SOC2' }, opts);
    expect(error).toBeDefined();
  });

  it('should require target', () => {
    const { error } = aiGapAnalysisSchema.validate({ current: 'desc' }, opts);
    expect(error).toBeDefined();
  });

  it('should enforce current max length of 10000', () => {
    const { error } = aiGapAnalysisSchema.validate(
      { current: 'a'.repeat(10001), target: 'SOC2' }, opts,
    );
    expect(error).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// aiChatSchema
// ---------------------------------------------------------------------------
describe('aiChatSchema contract', () => {
  const valid = { message: 'What is SOC2?' };

  it('should accept valid payload', () => {
    const { error } = aiChatSchema.validate(valid, opts);
    expect(error).toBeUndefined();
  });

  it('should accept optional fileContext', () => {
    const { error } = aiChatSchema.validate(
      { message: 'Q', fileContext: 'Some doc content' }, opts,
    );
    expect(error).toBeUndefined();
  });

  it('should reject empty payload', () => {
    const { error } = aiChatSchema.validate({}, opts);
    expect(error).toBeDefined();
  });

  it('should require message', () => {
    const { error } = aiChatSchema.validate({ fileContext: 'ctx' }, opts);
    expect(error).toBeDefined();
  });

  it('should enforce message min length of 1', () => {
    const { error } = aiChatSchema.validate({ message: '' }, opts);
    expect(error).toBeDefined();
  });

  it('should enforce message max length of 10000', () => {
    const { error } = aiChatSchema.validate({ message: 'a'.repeat(10001) }, opts);
    expect(error).toBeDefined();
  });

  it('should enforce fileContext max length of 50000', () => {
    const { error } = aiChatSchema.validate(
      { message: 'Q', fileContext: 'a'.repeat(50001) }, opts,
    );
    expect(error).toBeDefined();
  });

  it('should handle XSS in message', () => {
    const r = aiChatSchema.validate({ message: '<script>alert(1)</script>' }, opts);
    expect(r).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// aiContractSchema
// ---------------------------------------------------------------------------
describe('aiContractSchema contract', () => {
  const valid = { text: 'Contract text here' };

  it('should accept valid payload', () => {
    const { error } = aiContractSchema.validate(valid, opts);
    expect(error).toBeUndefined();
  });

  it('should reject empty payload', () => {
    const { error } = aiContractSchema.validate({}, opts);
    expect(error).toBeDefined();
  });

  it('should require text', () => {
    const { error } = aiContractSchema.validate({}, opts);
    expect(error!.details.some((d) => d.path.includes('text'))).toBe(true);
  });

  it('should enforce text min length of 1', () => {
    const { error } = aiContractSchema.validate({ text: '' }, opts);
    expect(error).toBeDefined();
  });

  it('should enforce text max length of 100000', () => {
    const { error } = aiContractSchema.validate({ text: 'a'.repeat(100001) }, opts);
    expect(error).toBeDefined();
  });

  it('should accept text at max length', () => {
    const { error } = aiContractSchema.validate({ text: 'a'.repeat(100000) }, opts);
    expect(error).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// aiRfpSchema
// ---------------------------------------------------------------------------
describe('aiRfpSchema contract', () => {
  const valid = { question: 'Do you support encryption at rest?' };

  it('should accept valid payload', () => {
    const { error } = aiRfpSchema.validate(valid, opts);
    expect(error).toBeUndefined();
  });

  it('should accept optional context', () => {
    const { error } = aiRfpSchema.validate(
      { question: 'Q', context: 'We use AES-256' }, opts,
    );
    expect(error).toBeUndefined();
  });

  it('should reject empty payload', () => {
    const { error } = aiRfpSchema.validate({}, opts);
    expect(error).toBeDefined();
  });

  it('should require question', () => {
    const { error } = aiRfpSchema.validate({ context: 'ctx' }, opts);
    expect(error).toBeDefined();
  });

  it('should enforce question min length of 1', () => {
    const { error } = aiRfpSchema.validate({ question: '' }, opts);
    expect(error).toBeDefined();
  });

  it('should enforce question max length of 10000', () => {
    const { error } = aiRfpSchema.validate({ question: 'a'.repeat(10001) }, opts);
    expect(error).toBeDefined();
  });

  it('should enforce context max length of 10000', () => {
    const { error } = aiRfpSchema.validate(
      { question: 'Q', context: 'a'.repeat(10001) }, opts,
    );
    expect(error).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// aiPhishingSchema
// ---------------------------------------------------------------------------
describe('aiPhishingSchema contract', () => {
  it('should accept empty payload (all fields optional)', () => {
    const { error } = aiPhishingSchema.validate({}, opts);
    expect(error).toBeUndefined();
  });

  it('should accept all optional fields', () => {
    const { error } = aiPhishingSchema.validate(
      { type: 'email', theme: 'Finance', department: 'HR', difficulty: 'Hard' }, opts,
    );
    expect(error).toBeUndefined();
  });

  it('should accept valid difficulty enum values', () => {
    for (const d of ['Easy', 'Medium', 'Hard']) {
      const { error } = aiPhishingSchema.validate({ difficulty: d }, opts);
      expect(error).toBeUndefined();
    }
  });

  it('should reject invalid difficulty value', () => {
    const { error } = aiPhishingSchema.validate({ difficulty: 'Impossible' }, opts);
    expect(error).toBeDefined();
  });

  it('should enforce theme max length of 500', () => {
    const { error } = aiPhishingSchema.validate({ theme: 'a'.repeat(501) }, opts);
    expect(error).toBeDefined();
  });

  it('should enforce department max length of 200', () => {
    const { error } = aiPhishingSchema.validate({ department: 'a'.repeat(201) }, opts);
    expect(error).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// aiVendorScoreSchema
// ---------------------------------------------------------------------------
describe('aiVendorScoreSchema contract', () => {
  const valid = { vendor: 'AWS', service: 'EC2', dataAccess: 'Customer PII' };

  it('should accept valid payload', () => {
    const { error } = aiVendorScoreSchema.validate(valid, opts);
    expect(error).toBeUndefined();
  });

  it('should reject empty payload', () => {
    const { error } = aiVendorScoreSchema.validate({}, opts);
    expect(error).toBeDefined();
  });

  it('should require all three fields', () => {
    const { error } = aiVendorScoreSchema.validate({ vendor: 'A' }, opts);
    expect(error).toBeDefined();
    expect(error!.details.length).toBeGreaterThanOrEqual(2);
  });

  it('should enforce vendor max length of 500', () => {
    const { error } = aiVendorScoreSchema.validate(
      { ...valid, vendor: 'a'.repeat(501) }, opts,
    );
    expect(error).toBeDefined();
  });

  it('should enforce service max length of 500', () => {
    const { error } = aiVendorScoreSchema.validate(
      { ...valid, service: 'a'.repeat(501) }, opts,
    );
    expect(error).toBeDefined();
  });

  it('should enforce dataAccess max length of 2000', () => {
    const { error } = aiVendorScoreSchema.validate(
      { ...valid, dataAccess: 'a'.repeat(2001) }, opts,
    );
    expect(error).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// aiDataMapSchema
// ---------------------------------------------------------------------------
describe('aiDataMapSchema contract', () => {
  const valid = { process: 'Customer onboarding flow' };

  it('should accept valid payload', () => {
    const { error } = aiDataMapSchema.validate(valid, opts);
    expect(error).toBeUndefined();
  });

  it('should reject empty payload', () => {
    const { error } = aiDataMapSchema.validate({}, opts);
    expect(error).toBeDefined();
  });

  it('should require process', () => {
    const { error } = aiDataMapSchema.validate({}, opts);
    expect(error!.details.some((d) => d.path.includes('process'))).toBe(true);
  });

  it('should enforce process min length of 1', () => {
    const { error } = aiDataMapSchema.validate({ process: '' }, opts);
    expect(error).toBeDefined();
  });

  it('should enforce process max length of 10000', () => {
    const { error } = aiDataMapSchema.validate({ process: 'a'.repeat(10001) }, opts);
    expect(error).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// aiBcpSchema
// ---------------------------------------------------------------------------
describe('aiBcpSchema contract', () => {
  const valid = { scenario: 'Data center outage' };

  it('should accept valid payload', () => {
    const { error } = aiBcpSchema.validate(valid, opts);
    expect(error).toBeUndefined();
  });

  it('should accept optional rto and rpo', () => {
    const { error } = aiBcpSchema.validate(
      { scenario: 'Outage', rto: '4 hours', rpo: '1 hour' }, opts,
    );
    expect(error).toBeUndefined();
  });

  it('should reject empty payload', () => {
    const { error } = aiBcpSchema.validate({}, opts);
    expect(error).toBeDefined();
  });

  it('should require scenario', () => {
    const { error } = aiBcpSchema.validate({ rto: '4h' }, opts);
    expect(error).toBeDefined();
  });

  it('should enforce scenario min length of 1', () => {
    const { error } = aiBcpSchema.validate({ scenario: '' }, opts);
    expect(error).toBeDefined();
  });

  it('should enforce scenario max length of 10000', () => {
    const { error } = aiBcpSchema.validate({ scenario: 'a'.repeat(10001) }, opts);
    expect(error).toBeDefined();
  });

  it('should enforce rto max length of 200', () => {
    const { error } = aiBcpSchema.validate(
      { scenario: 'S', rto: 'a'.repeat(201) }, opts,
    );
    expect(error).toBeDefined();
  });

  it('should enforce rpo max length of 200', () => {
    const { error } = aiBcpSchema.validate(
      { scenario: 'S', rpo: 'a'.repeat(201) }, opts,
    );
    expect(error).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// aiCrossFrameworkSchema
// ---------------------------------------------------------------------------
describe('aiCrossFrameworkSchema contract', () => {
  const valid = { sourceFramework: 'SOC2', targetFramework: 'ISO27001' };

  it('should accept valid payload', () => {
    const { error } = aiCrossFrameworkSchema.validate(valid, opts);
    expect(error).toBeUndefined();
  });

  it('should accept optional arrays', () => {
    const { error } = aiCrossFrameworkSchema.validate(
      { ...valid, sourceControls: [{ id: 'c1' }], targetControls: [{ id: 'c2' }] }, opts,
    );
    expect(error).toBeUndefined();
  });

  it('should reject empty payload', () => {
    const { error } = aiCrossFrameworkSchema.validate({}, opts);
    expect(error).toBeDefined();
  });

  it('should require sourceFramework', () => {
    const { error } = aiCrossFrameworkSchema.validate({ targetFramework: 'ISO' }, opts);
    expect(error).toBeDefined();
  });

  it('should require targetFramework', () => {
    const { error } = aiCrossFrameworkSchema.validate({ sourceFramework: 'SOC2' }, opts);
    expect(error).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// aiAutoRemediationSchema
// ---------------------------------------------------------------------------
describe('aiAutoRemediationSchema contract', () => {
  const valid = { framework: 'SOC2', gaps: [{ controlId: 'CC1.1', gap: 'Missing policy' }] };

  it('should accept valid payload', () => {
    const { error } = aiAutoRemediationSchema.validate(valid, opts);
    expect(error).toBeUndefined();
  });

  it('should accept optional organizationContext', () => {
    const { error } = aiAutoRemediationSchema.validate(
      { ...valid, organizationContext: 'We are a startup' }, opts,
    );
    expect(error).toBeUndefined();
  });

  it('should reject empty payload', () => {
    const { error } = aiAutoRemediationSchema.validate({}, opts);
    expect(error).toBeDefined();
  });

  it('should require framework', () => {
    const { error } = aiAutoRemediationSchema.validate({ gaps: [{ x: 1 }] }, opts);
    expect(error).toBeDefined();
  });

  it('should require gaps', () => {
    const { error } = aiAutoRemediationSchema.validate({ framework: 'SOC2' }, opts);
    expect(error).toBeDefined();
  });

  it('should require gaps to have at least 1 item', () => {
    const { error } = aiAutoRemediationSchema.validate(
      { framework: 'SOC2', gaps: [] }, opts,
    );
    expect(error).toBeDefined();
  });

  it('should enforce organizationContext max length of 10000', () => {
    const { error } = aiAutoRemediationSchema.validate(
      { ...valid, organizationContext: 'a'.repeat(10001) }, opts,
    );
    expect(error).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// aiEvidenceCompletenessSchema
// ---------------------------------------------------------------------------
describe('aiEvidenceCompletenessSchema contract', () => {
  const valid = { framework: 'SOC2', controls: [{ id: 'CC1.1' }] };

  it('should accept valid payload', () => {
    const { error } = aiEvidenceCompletenessSchema.validate(valid, opts);
    expect(error).toBeUndefined();
  });

  it('should reject empty payload', () => {
    const { error } = aiEvidenceCompletenessSchema.validate({}, opts);
    expect(error).toBeDefined();
  });

  it('should require framework', () => {
    const { error } = aiEvidenceCompletenessSchema.validate({ controls: [{ id: 'c' }] }, opts);
    expect(error).toBeDefined();
  });

  it('should require controls', () => {
    const { error } = aiEvidenceCompletenessSchema.validate({ framework: 'SOC2' }, opts);
    expect(error).toBeDefined();
  });

  it('should require controls to have at least 1 item', () => {
    const { error } = aiEvidenceCompletenessSchema.validate(
      { framework: 'SOC2', controls: [] }, opts,
    );
    expect(error).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// aiAgenticVendorRiskSchema
// ---------------------------------------------------------------------------
describe('aiAgenticVendorRiskSchema contract', () => {
  const valid = { vendor: { name: 'AWS' } };

  it('should accept valid payload', () => {
    const { error } = aiAgenticVendorRiskSchema.validate(valid, opts);
    expect(error).toBeUndefined();
  });

  it('should accept vendor with extra fields (unknown true on vendor obj)', () => {
    const { error } = aiAgenticVendorRiskSchema.validate(
      { vendor: { name: 'AWS', id: '123', website: 'https://aws.com' } }, opts,
    );
    expect(error).toBeUndefined();
  });

  it('should accept optional assessmentScope', () => {
    const { error } = aiAgenticVendorRiskSchema.validate(
      { vendor: { name: 'V' }, assessmentScope: ['security', 'privacy'] }, opts,
    );
    expect(error).toBeUndefined();
  });

  it('should reject empty payload', () => {
    const { error } = aiAgenticVendorRiskSchema.validate({}, opts);
    expect(error).toBeDefined();
  });

  it('should require vendor', () => {
    const { error } = aiAgenticVendorRiskSchema.validate({}, opts);
    expect(error!.details.some((d) => d.path.includes('vendor'))).toBe(true);
  });

  it('should require vendor.name', () => {
    const { error } = aiAgenticVendorRiskSchema.validate({ vendor: {} }, opts);
    expect(error).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// aiAuditSimulationSchema
// ---------------------------------------------------------------------------
describe('aiAuditSimulationSchema contract', () => {
  const valid = { framework: 'SOC2', controlDomain: 'CC1 - Control Environment' };

  it('should accept valid payload', () => {
    const { error } = aiAuditSimulationSchema.validate(valid, opts);
    expect(error).toBeUndefined();
  });

  it('should accept optional controlsToAudit and previousAnswers', () => {
    const { error } = aiAuditSimulationSchema.validate(
      { ...valid, controlsToAudit: [{ id: 'c1' }], previousAnswers: { q1: 'yes' } }, opts,
    );
    expect(error).toBeUndefined();
  });

  it('should reject empty payload', () => {
    const { error } = aiAuditSimulationSchema.validate({}, opts);
    expect(error).toBeDefined();
  });

  it('should require framework', () => {
    const { error } = aiAuditSimulationSchema.validate({ controlDomain: 'CC1' }, opts);
    expect(error).toBeDefined();
  });

  it('should require controlDomain', () => {
    const { error } = aiAuditSimulationSchema.validate({ framework: 'SOC2' }, opts);
    expect(error).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// aiNlQuerySchema
// ---------------------------------------------------------------------------
describe('aiNlQuerySchema contract', () => {
  const valid = { query: 'Show me all open risks' };

  it('should accept valid payload', () => {
    const { error } = aiNlQuerySchema.validate(valid, opts);
    expect(error).toBeUndefined();
  });

  it('should accept optional context object', () => {
    const { error } = aiNlQuerySchema.validate(
      { query: 'Q', context: { org: 'Acme' } }, opts,
    );
    expect(error).toBeUndefined();
  });

  it('should reject empty payload', () => {
    const { error } = aiNlQuerySchema.validate({}, opts);
    expect(error).toBeDefined();
  });

  it('should require query', () => {
    const { error } = aiNlQuerySchema.validate({ context: {} }, opts);
    expect(error).toBeDefined();
  });

  it('should enforce query min length of 1', () => {
    const { error } = aiNlQuerySchema.validate({ query: '' }, opts);
    expect(error).toBeDefined();
  });

  it('should enforce query max length of 10000', () => {
    const { error } = aiNlQuerySchema.validate({ query: 'a'.repeat(10001) }, opts);
    expect(error).toBeDefined();
  });

  it('should handle SQL injection in query', () => {
    const r = aiNlQuerySchema.validate({ query: "'; DROP TABLE risks; --" }, opts);
    expect(r).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// aiCopilotSchema
// ---------------------------------------------------------------------------
describe('aiCopilotSchema contract', () => {
  const valid = { message: 'Help me with my SOC2 audit' };

  it('should accept valid payload', () => {
    const { error } = aiCopilotSchema.validate(valid, opts);
    expect(error).toBeUndefined();
  });

  it('should accept optional conversationHistory and context', () => {
    const { error } = aiCopilotSchema.validate(
      {
        message: 'Follow up',
        conversationHistory: [{ role: 'user', content: 'Hi' }],
        context: { page: 'risks' },
      },
      opts,
    );
    expect(error).toBeUndefined();
  });

  it('should reject empty payload', () => {
    const { error } = aiCopilotSchema.validate({}, opts);
    expect(error).toBeDefined();
  });

  it('should require message', () => {
    const { error } = aiCopilotSchema.validate({ conversationHistory: [] }, opts);
    expect(error).toBeDefined();
  });

  it('should enforce message min length of 1', () => {
    const { error } = aiCopilotSchema.validate({ message: '' }, opts);
    expect(error).toBeDefined();
  });

  it('should enforce message max length of 10000', () => {
    const { error } = aiCopilotSchema.validate({ message: 'a'.repeat(10001) }, opts);
    expect(error).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// aiForecastSchema
// ---------------------------------------------------------------------------
describe('aiForecastSchema contract', () => {
  const valid = { currentScores: [{ framework: 'SOC2', score: 80 }] };

  it('should accept valid payload', () => {
    const { error } = aiForecastSchema.validate(valid, opts);
    expect(error).toBeUndefined();
  });

  it('should accept optional arrays', () => {
    const { error } = aiForecastSchema.validate(
      {
        currentScores: [{ f: 'SOC2', s: 80 }],
        upcomingChanges: [{ change: 'New regulation' }],
        historicalData: [{ date: '2025-01-01', score: 70 }],
      },
      opts,
    );
    expect(error).toBeUndefined();
  });

  it('should reject empty payload', () => {
    const { error } = aiForecastSchema.validate({}, opts);
    expect(error).toBeDefined();
  });

  it('should require currentScores', () => {
    const { error } = aiForecastSchema.validate({ upcomingChanges: [] }, opts);
    expect(error).toBeDefined();
  });

  it('should require currentScores to have at least 1 item', () => {
    const { error } = aiForecastSchema.validate({ currentScores: [] }, opts);
    expect(error).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// aiAnalyzeProcessSchema
// ---------------------------------------------------------------------------
describe('aiAnalyzeProcessSchema contract', () => {
  const valid = { processDescription: 'Customer data collection via web form' };

  it('should accept valid payload', () => {
    const { error } = aiAnalyzeProcessSchema.validate(valid, opts);
    expect(error).toBeUndefined();
  });

  it('should accept optional category and complianceFrameworks', () => {
    const { error } = aiAnalyzeProcessSchema.validate(
      { processDescription: 'P', category: 'HR', complianceFrameworks: ['GDPR'] }, opts,
    );
    expect(error).toBeUndefined();
  });

  it('should reject empty payload', () => {
    const { error } = aiAnalyzeProcessSchema.validate({}, opts);
    expect(error).toBeDefined();
  });

  it('should require processDescription', () => {
    const { error } = aiAnalyzeProcessSchema.validate({ category: 'HR' }, opts);
    expect(error).toBeDefined();
  });

  it('should enforce processDescription min length of 1', () => {
    const { error } = aiAnalyzeProcessSchema.validate({ processDescription: '' }, opts);
    expect(error).toBeDefined();
  });

  it('should enforce processDescription max length of 10000', () => {
    const { error } = aiAnalyzeProcessSchema.validate(
      { processDescription: 'a'.repeat(10001) }, opts,
    );
    expect(error).toBeDefined();
  });

  it('should enforce category max length of 200', () => {
    const { error } = aiAnalyzeProcessSchema.validate(
      { processDescription: 'P', category: 'a'.repeat(201) }, opts,
    );
    expect(error).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// aiPromptSchema (legacy catch-all)
// ---------------------------------------------------------------------------
describe('aiPromptSchema contract', () => {
  it('should accept empty payload (all fields optional)', () => {
    const { error } = aiPromptSchema.validate({}, opts);
    expect(error).toBeUndefined();
  });

  it('should accept all fields', () => {
    const { error } = aiPromptSchema.validate(
      { prompt: 'Do X', context: { key: 'val' }, frameworkId: 'fw1', message: 'msg', query: 'q' },
      opts,
    );
    expect(error).toBeUndefined();
  });

  it('should enforce prompt max length of 10000', () => {
    const { error } = aiPromptSchema.validate({ prompt: 'a'.repeat(10001) }, opts);
    expect(error).toBeDefined();
  });

  it('should enforce message max length of 10000', () => {
    const { error } = aiPromptSchema.validate({ message: 'a'.repeat(10001) }, opts);
    expect(error).toBeDefined();
  });

  it('should enforce query max length of 10000', () => {
    const { error } = aiPromptSchema.validate({ query: 'a'.repeat(10001) }, opts);
    expect(error).toBeDefined();
  });

  it('should allow unknown fields (unknown: true)', () => {
    const { error } = aiPromptSchema.validate({ prompt: 'X', extra: 'allowed' }, opts);
    expect(error).toBeUndefined();
  });

  it('should handle XSS in prompt', () => {
    const r = aiPromptSchema.validate({ prompt: '<script>alert(1)</script>' }, opts);
    expect(r).toBeDefined();
  });

  it('should handle SQL injection in query', () => {
    const r = aiPromptSchema.validate({ query: "' OR 1=1 --" }, opts);
    expect(r).toBeDefined();
  });
});
