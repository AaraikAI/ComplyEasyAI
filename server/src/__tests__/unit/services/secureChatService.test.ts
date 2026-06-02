/**
 * Secure Chat Service Unit Tests
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { prismaMock, createMockOrganization, createMockUser } from '../../mocks/prisma';

// Add missing models to prismaMock
const createMockFn = (): jest.Mock<(...args: any[]) => any> => jest.fn() as jest.Mock<(...args: any[]) => any>;

(prismaMock as any).chatConversation = {
  findUnique: createMockFn(),
  findFirst: createMockFn(),
  findMany: createMockFn(),
  create: createMockFn(),
  update: createMockFn(),
  delete: createMockFn(),
};

// Mock the database
jest.mock('../../../config/database', () => ({
  __esModule: true,
  default: prismaMock,
}));

jest.mock('../../../config/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('../../../services/advanced/homomorphicAIService', () => ({
  __esModule: true,
  default: {
    encrypt: jest.fn(),
    decrypt: jest.fn(),
  },
}));

jest.mock('../../../config/tiers', () => ({
  TIERS: {
    Foundation: {
      name: 'Foundation',
      features: {
        aiPolicyGeneration: true,
        aiGapAnalysis: true,
        aiContractAnalyzer: false,
        aiRfpGenerator: false,
        acosGoals: false,
        euAiAct: false,
        dma: false,
        dsa: false,
        nistAiRmf: false,
        zeroTrustSecurity: false,
        zkProofs: false,
        byokEncryption: false,
        complianceAsCode: false,
        aiVendorScorer: false,
        aiDataMapper: false,
        aiPhishingSimulator: false,
        aiBcpGenerator: false,
        vendorRiskManagement: false,
        personnelManagement: false,
        policyLibrary: false,
        trustCenter: false,
        multiWorkspace: false,
        issueManagement: false,
        continuousMonitoring: false,
        advancedReporting: false,
      },
      limits: { maxFrameworks: 3, maxUsers: 10 },
      highlights: ['Basic AI Policy Generation', 'Gap Analysis'],
    },
    Essentials: {
      name: 'Essentials',
      features: { aiContractAnalyzer: true, aiRfpGenerator: true, acosGoals: false },
      limits: { maxFrameworks: 10, maxUsers: 100 },
      highlights: ['Contract Analyzer', 'RFP Generator'],
    },
    Growth: {
      name: 'Growth',
      features: { acosGoals: true, acosControlLoops: true, acosDigitalTwin: true, acosRedTeam: true },
      limits: { maxFrameworks: 50, maxUsers: 1000 },
      highlights: ['aCOS Goals', 'Digital Twin'],
    },
    Visionary: {
      name: 'Visionary',
      features: { euAiAct: true, dma: true, dsa: true, nistAiRmf: true, zeroTrustSecurity: true, zkProofs: true, byokEncryption: true, complianceAsCode: true },
      limits: { maxFrameworks: -1, maxUsers: -1 },
      highlights: ['EU AI Act', 'Zero Trust'],
    },
  },
  hasFeature: jest.fn().mockImplementation((tier: string, feature: string) => {
    const tierFeatures: Record<string, Record<string, boolean>> = {
      Foundation: { aiPolicyGeneration: true, aiGapAnalysis: true },
      Essentials: { aiPolicyGeneration: true, aiGapAnalysis: true, aiContractAnalyzer: true, aiRfpGenerator: true },
      Growth: { acosGoals: true, acosControlLoops: true, acosDigitalTwin: true, acosRedTeam: true },
      Visionary: { euAiAct: true, dma: true, dsa: true, nistAiRmf: true, zeroTrustSecurity: true, zkProofs: true, byokEncryption: true, complianceAsCode: true },
    };
    return tierFeatures[tier]?.[feature] ?? false;
  }),
  TierName: {},
  TierFeatures: {},
}));

// Import after mocking
import secureChatService from '../../../services/secureChatService';

// Helpers
const setupChatMocks = (tier: string = 'Foundation', frameworks: any[] = [], risks: any[] = []) => {
  prismaMock.complianceFramework.findMany.mockResolvedValue(frameworks as any);
  (prismaMock as any).riskItem.findMany.mockResolvedValue(risks);
  prismaMock.organization.findUnique.mockResolvedValue(
    createMockOrganization({ plan: tier }) as any
  );
  prismaMock.user.findUnique.mockResolvedValue(
    createMockUser({ role: 'Admin' }) as any
  );
  (prismaMock as any).chatConversation.findFirst.mockResolvedValue({
    id: 'conv-1',
    userId: 'user-123',
    organizationId: 'org-123',
    messages: [],
    fileContext: {},
    updatedAt: new Date(),
  });
  (prismaMock as any).chatConversation.update.mockResolvedValue({});
  prismaMock.auditLog.create.mockResolvedValue({} as any);
};

describe('SecureChatService', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Re-set hasFeature mock (cleared by jest config resetMocks: true)
    const tiersConfig = require('../../../config/tiers');
    tiersConfig.hasFeature.mockImplementation((tier: string, feature: string) => {
      const tierFeatures: Record<string, Record<string, boolean>> = {
        Foundation: { aiPolicyGeneration: true, aiGapAnalysis: true },
        Essentials: { aiPolicyGeneration: true, aiGapAnalysis: true, aiContractAnalyzer: true, aiRfpGenerator: true },
        Growth: { acosGoals: true, acosControlLoops: true, acosDigitalTwin: true, acosRedTeam: true },
        Visionary: { euAiAct: true, dma: true, dsa: true, nistAiRmf: true, zeroTrustSecurity: true, zkProofs: true, byokEncryption: true, complianceAsCode: true },
      };
      return tierFeatures[tier]?.[feature] ?? false;
    });
  });

  // ======================================================================
  // chatWithUser - basic behavior
  // ======================================================================
  describe('chatWithUser()', () => {
    it('should return a response with sources and accurate processing flags', async () => {
      setupChatMocks();

      const result = await secureChatService.chatWithUser(
        'What is my compliance status?',
        'user-123',
        'org-123'
      );

      expect(result).toHaveProperty('response');
      expect(result).toHaveProperty('sources');
      // This path is local rule-based matching on plaintext context, not encrypted
      // (homomorphic) compute, so it must accurately report encrypted=false /
      // locallyProcessed=true rather than overstating an encryption guarantee.
      expect(result.encrypted).toBe(false);
      expect(result.locallyProcessed).toBe(true);
      expect(result.sources).toContain('Local AI Processing');
      expect(result.sources).toContain('User Account Data');
    });

    it('should update conversation with new messages', async () => {
      setupChatMocks();

      await secureChatService.chatWithUser('Hello', 'user-123', 'org-123');

      expect((prismaMock as any).chatConversation.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'conv-1' },
          data: expect.objectContaining({
            messages: expect.arrayContaining([
              expect.objectContaining({ sender: 'user', text: 'Hello' }),
              expect.objectContaining({ sender: 'assistant' }),
            ]),
          }),
        })
      );
    });

    it('should create audit log for chat interaction', async () => {
      setupChatMocks();

      await secureChatService.chatWithUser('Hello', 'user-123', 'org-123');

      expect(prismaMock.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'Secure Chat Query',
            userId: 'user-123',
            organizationId: 'org-123',
          }),
        })
      );
    });

    it('should include file context in sources when provided', async () => {
      setupChatMocks();

      const result = await secureChatService.chatWithUser(
        'Analyze this file',
        'user-123',
        'org-123',
        [{ filename: 'policy.pdf', content: 'Policy content', type: 'pdf' }]
      );

      expect(result.sources).toContain('File Context');
    });

    it('should create a new conversation if none exists', async () => {
      setupChatMocks();
      (prismaMock as any).chatConversation.findFirst.mockResolvedValue(null);
      (prismaMock as any).chatConversation.create.mockResolvedValue({
        id: 'conv-new',
        userId: 'user-123',
        organizationId: 'org-123',
        messages: [],
        fileContext: {},
      });

      const result = await secureChatService.chatWithUser('Hello', 'user-123', 'org-123');

      expect(result).toHaveProperty('response');
    });

    it('should return error response on unhandled exception', async () => {
      prismaMock.complianceFramework.findMany.mockRejectedValue(new Error('DB error'));
      prismaMock.organization.findUnique.mockRejectedValue(new Error('DB error'));
      prismaMock.user.findUnique.mockRejectedValue(new Error('DB error'));
      (prismaMock as any).riskItem.findMany.mockRejectedValue(new Error('DB error'));
      (prismaMock as any).chatConversation.findFirst.mockRejectedValue(new Error('DB error'));

      const result = await secureChatService.chatWithUser('Hello', 'user-123', 'org-123');

      expect(result.response).toContain('error');
      // The error path also runs locally and performs no encrypted compute.
      expect(result.encrypted).toBe(false);
      expect(result.locallyProcessed).toBe(true);
    });
  });

  // ======================================================================
  // Pricing queries
  // ======================================================================
  describe('pricing queries', () => {
    it('should respond to pricing questions', async () => {
      setupChatMocks('Foundation');

      const result = await secureChatService.chatWithUser(
        'What is the pricing?',
        'user-123',
        'org-123'
      );

      expect(result.response).toContain('Pricing');
      expect(result.response).toContain('Foundation');
      expect(result.response).toContain('Essentials');
      expect(result.response).toContain('Growth');
      expect(result.response).toContain('Visionary');
    });

    it('should include current tier in pricing response', async () => {
      setupChatMocks('Essentials');

      const result = await secureChatService.chatWithUser(
        'How much does it cost?',
        'user-123',
        'org-123'
      );

      expect(result.response).toContain('Essentials');
    });
  });

  // ======================================================================
  // Framework queries
  // ======================================================================
  describe('framework queries', () => {
    it('should show framework status when frameworks exist', async () => {
      setupChatMocks('Foundation', [
        {
          name: 'SOC 2',
          progress: 60,
          status: 'In_Progress',
          controls: [
            { id: 'c1', name: 'CC1.1', status: 'Compliant' },
            { id: 'c2', name: 'CC1.2', status: 'Not Started' },
          ],
        },
      ]);

      const result = await secureChatService.chatWithUser(
        'What is my compliance framework status?',
        'user-123',
        'org-123'
      );

      expect(result.response).toContain('SOC 2');
      expect(result.response).toContain('60%');
    });

    it('should suggest frameworks when none configured', async () => {
      setupChatMocks('Foundation', []);

      const result = await secureChatService.chatWithUser(
        'Tell me about my compliance frameworks',
        'user-123',
        'org-123'
      );

      expect(result.response).toContain("don't have any compliance frameworks");
    });
  });

  // ======================================================================
  // Risk queries
  // ======================================================================
  describe('risk queries', () => {
    it('should show risk summary when risks exist', async () => {
      setupChatMocks('Foundation', [], [
        { id: 'r1', title: 'Critical Risk', description: 'High risk desc', severity: 'Critical', status: 'Open' },
        { id: 'r2', title: 'Low Risk', description: 'Low desc', severity: 'Low', status: 'Resolved' },
      ]);

      const result = await secureChatService.chatWithUser(
        'What are my risks?',
        'user-123',
        'org-123'
      );

      expect(result.response).toContain('2 total risk');
      expect(result.response).toContain('Critical');
    });

    it('should show no risks message when none exist', async () => {
      setupChatMocks('Foundation', [], []);

      const result = await secureChatService.chatWithUser(
        'Tell me about my risks',
        'user-123',
        'org-123'
      );

      expect(result.response).toContain("don't have any open risks");
    });
  });

  // ======================================================================
  // Status queries
  // ======================================================================
  describe('status queries', () => {
    it('should show overall compliance status', async () => {
      setupChatMocks('Foundation', [
        { name: 'SOC 2', progress: 80, status: 'In_Progress', controls: [] },
        { name: 'ISO 27001', progress: 60, status: 'In_Progress', controls: [] },
      ], [
        { severity: 'High', status: 'Open' },
      ]);

      const result = await secureChatService.chatWithUser(
        'How am I doing?',
        'user-123',
        'org-123'
      );

      expect(result.response).toContain('Compliance Status');
      expect(result.response).toContain('2 active');
    });
  });

  // ======================================================================
  // aCOS queries (tier-restricted)
  // ======================================================================
  describe('aCOS queries', () => {
    it('should show upgrade message for Foundation tier', async () => {
      setupChatMocks('Foundation');

      const result = await secureChatService.chatWithUser(
        'Tell me about aCOS',
        'user-123',
        'org-123'
      );

      expect(result.response).toContain('aCOS');
      expect(result.response).toContain('Autonomous Compliance');
    });
  });

  // ======================================================================
  // Support queries
  // ======================================================================
  describe('support queries', () => {
    it('should show tier-appropriate support information', async () => {
      setupChatMocks('Foundation');

      const result = await secureChatService.chatWithUser(
        'How can I contact support?',
        'user-123',
        'org-123'
      );

      expect(result.response).toContain('Support');
      expect(result.response).toContain('Foundation');
    });
  });

  // ======================================================================
  // Troubleshooting queries
  // ======================================================================
  describe('troubleshooting queries', () => {
    it('should respond to login troubleshooting', async () => {
      setupChatMocks();

      const result = await secureChatService.chatWithUser(
        "I'm having trouble with login and password",
        'user-123',
        'org-123'
      );

      expect(result.response).toContain('Troubleshooting');
      expect(result.response).toContain('Login');
    });

    it('should respond to SSO troubleshooting', async () => {
      setupChatMocks();

      const result = await secureChatService.chatWithUser(
        'SSO is not working, having a problem with single sign on',
        'user-123',
        'org-123'
      );

      expect(result.response).toContain('SSO');
    });

    it('should respond to integration troubleshooting', async () => {
      setupChatMocks();

      const result = await secureChatService.chatWithUser(
        'My AWS integration is not working',
        'user-123',
        'org-123'
      );

      expect(result.response).toContain('Integration');
    });
  });

  // ======================================================================
  // Tutorial queries
  // ======================================================================
  describe('tutorial queries', () => {
    it('should show getting started tutorial', async () => {
      setupChatMocks();

      const result = await secureChatService.chatWithUser(
        'How do I get started? Tutorial please',
        'user-123',
        'org-123'
      );

      expect(result.response).toContain('Getting Started');
    });

    it('should show SOC 2 timeline', async () => {
      setupChatMocks();

      const result = await secureChatService.chatWithUser(
        'Show me the SOC 2 timeline tutorial',
        'user-123',
        'org-123'
      );

      expect(result.response).toContain('SOC 2');
      expect(result.response).toContain('Timeline');
    });
  });

  // ======================================================================
  // Tier/plan queries
  // ======================================================================
  describe('tier queries', () => {
    it('should show current tier information', async () => {
      setupChatMocks('Foundation');

      const result = await secureChatService.chatWithUser(
        'What is my current tier plan?',
        'user-123',
        'org-123'
      );

      expect(result.response).toContain('Foundation');
      expect(result.response).toContain('Current Plan');
    });
  });

  // ======================================================================
  // Help queries
  // ======================================================================
  describe('help queries', () => {
    it('should show help information', async () => {
      setupChatMocks();

      const result = await secureChatService.chatWithUser(
        'What can you do for me?',
        'user-123',
        'org-123'
      );

      expect(result.response).toContain('Compliance Frameworks');
      expect(result.response).toContain('Risk Management');
    });
  });

  // ======================================================================
  // Default response
  // ======================================================================
  describe('default response', () => {
    it('should provide contextual default response for unmatched queries', async () => {
      setupChatMocks('Foundation', [
        { name: 'SOC 2', progress: 50, status: 'In_Progress', controls: [] },
      ]);

      const result = await secureChatService.chatWithUser(
        'Tell me about quantum computing theoretical implications',
        'user-123',
        'org-123'
      );

      expect(result.response).toContain('Foundation');
    });
  });
});
