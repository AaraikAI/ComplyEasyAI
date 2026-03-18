/**
 * AI Routes — Contract Tests
 * 19 POST endpoints, each with Joi validation via validateBody middleware
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';

jest.mock('../../../config/database', () => ({ __esModule: true, default: {} }));
jest.mock('../../../config/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));
jest.mock('../../../utils/auditLogger', () => ({ AuditLogger: { log: jest.fn() } }));

jest.mock('../../../middleware/auth', () => ({
  authenticate: (req: any, res: any, next: any) => {
    if ((req as any).user) return next();
    res.status(401).json({ error: 'No token provided' });
  },
  authorize: (..._roles: string[]) => (req: any, res: any, next: any) => {
    if (!(req as any).user) return res.status(401).json({ error: 'Authentication required' });
    next();
  },
  AuthRequest: {},
}));

// Mock rate limiter to pass through
jest.mock('../../../middleware/rateLimiter', () => ({
  aiLimiter: (_req: any, _res: any, next: any) => next(),
}));

// Mock tier middleware to pass through
jest.mock('../../../middleware/tierMiddleware', () => ({
  requireFeature: () => (_req: any, _res: any, next: any) => next(),
  enforceLimit: () => (_req: any, _res: any, next: any) => next(),
  requireAiFeature: () => [(_req: any, _res: any, next: any) => next()],
}));

// Mock AI controller with simple handlers
const mockController = {
  generateReport: jest.fn<any>().mockImplementation((_req: any, res: any) => res.json({ result: 'report' })),
  generatePolicy: jest.fn<any>().mockImplementation((_req: any, res: any) => res.json({ result: 'policy' })),
  performGapAnalysis: jest.fn<any>().mockImplementation((_req: any, res: any) => res.json({ result: 'gap' })),
  chat: jest.fn<any>().mockImplementation((_req: any, res: any) => res.json({ result: 'chat' })),
  analyzeContract: jest.fn<any>().mockImplementation((_req: any, res: any) => res.json({ result: 'contract' })),
  generateRFPResponse: jest.fn<any>().mockImplementation((_req: any, res: any) => res.json({ result: 'rfp' })),
  generatePhishing: jest.fn<any>().mockImplementation((_req: any, res: any) => res.json({ result: 'phishing' })),
  scoreVendor: jest.fn<any>().mockImplementation((_req: any, res: any) => res.json({ result: 'vendor' })),
  generateDataMap: jest.fn<any>().mockImplementation((_req: any, res: any) => res.json({ result: 'datamap' })),
  generateBCP: jest.fn<any>().mockImplementation((_req: any, res: any) => res.json({ result: 'bcp' })),
  crossFrameworkMapping: jest.fn<any>().mockImplementation((_req: any, res: any) => res.json({ result: 'mapping' })),
  regulatoryAutoRemediation: jest.fn<any>().mockImplementation((_req: any, res: any) => res.json({ result: 'remediation' })),
  checkEvidenceCompleteness: jest.fn<any>().mockImplementation((_req: any, res: any) => res.json({ result: 'evidence' })),
  agenticVendorRisk: jest.fn<any>().mockImplementation((_req: any, res: any) => res.json({ result: 'agentic' })),
  simulateAudit: jest.fn<any>().mockImplementation((_req: any, res: any) => res.json({ result: 'audit' })),
  naturalLanguageQuery: jest.fn<any>().mockImplementation((_req: any, res: any) => res.json({ result: 'nlq' })),
  complianceCopilot: jest.fn<any>().mockImplementation((_req: any, res: any) => res.json({ result: 'copilot' })),
  forecastComplianceScore: jest.fn<any>().mockImplementation((_req: any, res: any) => res.json({ result: 'forecast' })),
  analyzeProcess: jest.fn<any>().mockImplementation((_req: any, res: any) => res.json({ result: 'process' })),
};

jest.mock('../../../controllers/aiController', () => ({
  __esModule: true,
  default: mockController,
}));

import aiRoutes from '../../../routes/ai';
import { errorHandler } from '../../../middleware/errorHandler';

const app = express();
app.use(express.json());
app.use((req, _res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    try { (req as any).user = jwt.verify(authHeader.split(' ')[1], 'test-secret'); } catch { /* no-op */ }
  }
  next();
});
app.use('/api/ai', aiRoutes);
app.use(errorHandler);

const generateToken = (role = 'Admin') =>
  jwt.sign({ id: 'user-1', organizationId: 'org-1', role, email: 't@t.com', name: 'T' }, 'test-secret', { expiresIn: '1h' });

describe('AI Routes Contract Tests', () => {
  const token = generateToken();

  beforeEach(() => jest.clearAllMocks());

  // Helper for testing validation endpoints
  const testEndpoint = (
    path: string,
    validPayload: Record<string, any>,
    invalidPayload: Record<string, any> = {}
  ) => {
    describe(`POST /api/ai${path}`, () => {
      it('returns 200 with valid payload', async () => {
        const res = await request(app)
          .post(`/api/ai${path}`)
          .set('Authorization', `Bearer ${token}`)
          .send(validPayload);
        expect(res.status).toBe(200);
      });

      it('returns 401 without auth', async () => {
        const res = await request(app).post(`/api/ai${path}`).send(validPayload);
        expect(res.status).toBe(401);
      });

      it('returns 400 with invalid payload', async () => {
        const res = await request(app)
          .post(`/api/ai${path}`)
          .set('Authorization', `Bearer ${token}`)
          .send(invalidPayload);
        expect(res.status).toBe(400);
      });
    });
  };

  // Test all 19 endpoints with valid and invalid payloads
  testEndpoint('/report', { framework: 'SOC2', companyName: 'Test Co', context: 'Annual compliance' }, {});
  testEndpoint('/policy', { type: 'DataPrivacy', company: 'Test Co', tone: 'formal' }, {});
  testEndpoint('/gap-analysis', { current: 'Current state', target: 'ISO 27001' }, {});
  testEndpoint('/chat', { message: 'What is SOC 2?' }, {});
  testEndpoint('/contract', { text: 'Contract text here' }, {});
  testEndpoint('/rfp', { question: 'Describe your security posture' }, {});
  testEndpoint('/phishing', {}, {}); // phishing has all optional fields — still valid empty
  testEndpoint('/vendor-score', { vendor: 'AWS', service: 'Cloud', dataAccess: 'PII data' }, {});
  testEndpoint('/data-map', { process: 'Employee onboarding' }, {});
  testEndpoint('/bcp', { scenario: 'Data center outage' }, {});

  // Cross-framework needs current + target
  testEndpoint('/cross-framework-mapping', { current: 'SOC2', target: 'ISO27001' }, {});

  // Auto-remediation
  testEndpoint('/auto-remediation', { framework: 'SOC2', gaps: ['CC1.1'] }, {});

  // Evidence completeness
  testEndpoint('/evidence-completeness', { controlId: 'ctrl-1', evidence: ['doc1'] }, {});

  // Agentic vendor risk
  testEndpoint('/agentic-vendor-risk', { vendorName: 'AWS', vendorId: 'v-1' }, {});

  // Audit simulation
  testEndpoint('/audit-simulation', { framework: 'SOC2', scope: 'Full' }, {});

  // NL Query
  testEndpoint('/nl-query', { query: 'Show me all critical risks' }, {});

  // Copilot
  testEndpoint('/copilot', { message: 'Help me fix this gap' }, {});

  // Forecast
  testEndpoint('/forecast', { framework: 'SOC2', timeframe: '6months' }, {});

  // Analyze process
  testEndpoint('/analyze-process', { processDescription: 'PII collection flow' }, {});
});
