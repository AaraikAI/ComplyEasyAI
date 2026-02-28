/**
 * E2E Tests - Audit & Evidence Management Flow
 * Tests complete audit workflows including evidence collection,
 * version control, auditor access, and audit report generation.
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { prismaMock } from '../mocks/prisma';

jest.mock('../../config/database', () => ({
  __esModule: true,
  default: prismaMock,
  testConnection: jest.fn().mockResolvedValue(true),
}));

jest.mock('../../config/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('../../utils/auditLogger', () => ({
  AuditLogger: { log: jest.fn() },
}));

jest.mock('../../middleware/auth', () => ({
  authenticate: (req: any, res: any, next: any) => next(),
  authorize: (..._roles: string[]) => (req: any, res: any, next: any) => next(),
  AuthRequest: {},
}));

jest.mock('../../middleware/rateLimiter', () => ({
  authLimiter: (req: any, res: any, next: any) => next(),
  apiLimiter: (req: any, res: any, next: any) => next(),
  aiLimiter: (req: any, res: any, next: any) => next(),
  frameworkLimiter: (req: any, res: any, next: any) => next(),
}));

import auditRoutes from '../../routes/audit';
import evidenceVersionsRoutes from '../../routes/evidenceVersions';
import { errorHandler } from '../../middleware/errorHandler';

const app = express();
app.use(express.json());
app.use((req, _res, next) => {
  (req as any).user = {
    id: 'user-123',
    organizationId: 'org-123',
    role: 'Admin',
    email: 'admin@example.com',
  };
  next();
});
app.use('/api/audit', auditRoutes);
app.use('/api/evidence-versions', evidenceVersionsRoutes);
app.use(errorHandler);

describe('E2E: Audit & Evidence Management Flow', () => {
  const mockAudit = {
    id: 'audit-123',
    name: 'SOC 2 Type II Annual Audit',
    type: 'External',
    status: 'Planning',
    frameworkId: 'fw-123',
    organizationId: 'org-123',
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    auditorName: 'Big Four Auditor',
    createdAt: new Date(),
  };

  const mockEvidence = {
    id: 'ev-123',
    title: 'Access Control Policy',
    type: 'Document',
    controlId: 'ctrl-123',
    status: 'Approved',
    fileUrl: 'https://storage.example.com/evidence/policy.pdf',
    organizationId: 'org-123',
    collectedAt: new Date(),
    collectedBy: 'user-123',
  };

  const mockEvidenceVersion = {
    id: 'ev-v-123',
    evidenceId: 'ev-123',
    version: 2,
    fileUrl: 'https://storage.example.com/evidence/policy-v2.pdf',
    changes: 'Updated access levels',
    createdBy: 'user-123',
    createdAt: new Date(),
  };

  const mockFinding = {
    id: 'find-123',
    auditId: 'audit-123',
    title: 'Missing access review documentation',
    severity: 'Medium',
    status: 'Open',
    description: 'Quarterly access reviews not documented',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Audit Planning Workflow', () => {
    it('should complete full audit planning lifecycle', async () => {
      // Step 1: Create audit
      prismaMock.audit.create.mockResolvedValue(mockAudit as any);

      const createResponse = await request(app)
        .post('/api/audit')
        .send({
          name: 'SOC 2 Type II Annual Audit',
          type: 'External',
          frameworkId: 'fw-123',
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          auditorName: 'Big Four Auditor',
        })
        .expect(201);

      expect(createResponse.body).toHaveProperty('id');
      const auditId = createResponse.body.id;

      // Step 2: Define audit scope
      prismaMock.audit.findFirst.mockResolvedValue(mockAudit as any);
      prismaMock.audit.update.mockResolvedValue({
        ...mockAudit,
        scope: ['Access Control', 'Data Protection', 'Incident Response'],
      } as any);

      const scopeResponse = await request(app)
        .patch(`/api/audit/${auditId}/scope`)
        .send({
          scope: ['Access Control', 'Data Protection', 'Incident Response'],
          exclusions: ['Physical Security'],
        })
        .expect(200);

      expect(scopeResponse.body.scope).toHaveLength(3);

      // Step 3: Generate evidence request list
      prismaMock.auditEvidenceRequest.createMany.mockResolvedValue({ count: 25 } as any);

      const evidenceReqResponse = await request(app)
        .post(`/api/audit/${auditId}/evidence-requests`)
        .send({
          controls: ['ctrl-1', 'ctrl-2', 'ctrl-3'],
        })
        .expect(201);

      expect(evidenceReqResponse.body).toHaveProperty('count');

      // Step 4: Start audit
      prismaMock.audit.update.mockResolvedValue({
        ...mockAudit,
        status: 'In Progress',
        startedAt: new Date(),
      } as any);

      const startResponse = await request(app)
        .post(`/api/audit/${auditId}/start`)
        .expect(200);

      expect(startResponse.body.status).toBe('In Progress');
    });
  });

  describe('Evidence Collection Workflow', () => {
    it('should upload and manage evidence', async () => {
      // Step 1: Upload evidence
      prismaMock.evidence.create.mockResolvedValue(mockEvidence as any);

      const uploadResponse = await request(app)
        .post('/api/audit/evidence')
        .send({
          title: 'Access Control Policy',
          type: 'Document',
          controlId: 'ctrl-123',
          fileUrl: 'https://storage.example.com/evidence/policy.pdf',
          description: 'Current access control policy document',
        })
        .expect(201);

      expect(uploadResponse.body).toHaveProperty('id');
      const evidenceId = uploadResponse.body.id;

      // Step 2: Review evidence
      prismaMock.evidence.findFirst.mockResolvedValue(mockEvidence as any);
      prismaMock.evidence.update.mockResolvedValue({
        ...mockEvidence,
        status: 'Under Review',
        reviewedBy: 'user-456',
      } as any);

      const reviewResponse = await request(app)
        .post(`/api/audit/evidence/${evidenceId}/review`)
        .send({ status: 'Under Review' })
        .expect(200);

      expect(reviewResponse.body.status).toBe('Under Review');

      // Step 3: Approve evidence
      prismaMock.evidence.update.mockResolvedValue({
        ...mockEvidence,
        status: 'Approved',
        approvedBy: 'user-789',
        approvedAt: new Date(),
      } as any);

      const approveResponse = await request(app)
        .post(`/api/audit/evidence/${evidenceId}/approve`)
        .expect(200);

      expect(approveResponse.body.status).toBe('Approved');
    });

    it('should request additional evidence', async () => {
      prismaMock.evidenceRequest.create.mockResolvedValue({
        id: 'req-123',
        auditId: 'audit-123',
        controlId: 'ctrl-123',
        description: 'Need screenshots of access review process',
        status: 'Pending',
        requestedBy: 'auditor-123',
      } as any);

      const response = await request(app)
        .post('/api/audit/audit-123/request-evidence')
        .send({
          controlId: 'ctrl-123',
          description: 'Need screenshots of access review process',
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
    });
  });

  describe('Evidence Version Control', () => {
    it('should create new evidence version', async () => {
      prismaMock.evidenceVersion.create.mockResolvedValue(mockEvidenceVersion as any);
      prismaMock.evidence.update.mockResolvedValue({
        ...mockEvidence,
        currentVersion: 2,
      } as any);

      const response = await request(app)
        .post('/api/evidence-versions')
        .send({
          evidenceId: 'ev-123',
          fileUrl: 'https://storage.example.com/evidence/policy-v2.pdf',
          changes: 'Updated access levels',
        })
        .expect(201);

      expect(response.body.version).toBe(2);
    });

    it('should list version history', async () => {
      prismaMock.evidenceVersion.findMany.mockResolvedValue([
        mockEvidenceVersion,
        { ...mockEvidenceVersion, id: 'ev-v-122', version: 1 },
      ] as any);

      const response = await request(app)
        .get('/api/evidence-versions')
        .query({ evidenceId: 'ev-123' })
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(1);
    });

    it('should compare versions', async () => {
      prismaMock.evidenceVersion.findMany.mockResolvedValue([
        mockEvidenceVersion,
        { ...mockEvidenceVersion, id: 'ev-v-122', version: 1 },
      ] as any);

      const response = await request(app)
        .get('/api/evidence-versions/compare')
        .query({ version1: 1, version2: 2, evidenceId: 'ev-123' })
        .expect(200);

      expect(response.body).toHaveProperty('differences');
    });

    it('should rollback to previous version', async () => {
      prismaMock.evidenceVersion.findFirst.mockResolvedValue(mockEvidenceVersion as any);
      prismaMock.evidence.update.mockResolvedValue({
        ...mockEvidence,
        currentVersion: 1,
      } as any);

      const response = await request(app)
        .post('/api/evidence-versions/ev-123/rollback')
        .send({ targetVersion: 1 })
        .expect(200);

      expect(response.body.currentVersion).toBe(1);
    });
  });

  describe('Audit Findings Management', () => {
    it('should record audit finding', async () => {
      prismaMock.auditFinding.create.mockResolvedValue(mockFinding as any);

      const response = await request(app)
        .post('/api/audit/audit-123/findings')
        .send({
          title: 'Missing access review documentation',
          severity: 'Medium',
          description: 'Quarterly access reviews not documented',
          controlId: 'ctrl-123',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
    });

    it('should respond to finding', async () => {
      prismaMock.auditFinding.findFirst.mockResolvedValue(mockFinding as any);
      prismaMock.auditFinding.update.mockResolvedValue({
        ...mockFinding,
        managementResponse: 'Will implement automated documentation',
        remediationPlan: 'Implement access review tool by Q2',
        status: 'Remediation Planned',
      } as any);

      const response = await request(app)
        .patch('/api/audit/audit-123/findings/find-123')
        .send({
          managementResponse: 'Will implement automated documentation',
          remediationPlan: 'Implement access review tool by Q2',
          targetDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        })
        .expect(200);

      expect(response.body.status).toBe('Remediation Planned');
    });

    it('should track finding remediation', async () => {
      prismaMock.auditFinding.findFirst.mockResolvedValue({
        ...mockFinding,
        status: 'Remediation Planned',
      } as any);
      prismaMock.auditFinding.update.mockResolvedValue({
        ...mockFinding,
        status: 'Remediated',
        remediatedAt: new Date(),
        evidence: ['ev-456'],
      } as any);

      const response = await request(app)
        .post('/api/audit/audit-123/findings/find-123/remediate')
        .send({
          evidenceIds: ['ev-456'],
          notes: 'Access review tool implemented',
        })
        .expect(200);

      expect(response.body.status).toBe('Remediated');
    });
  });

  describe('Audit Report Generation', () => {
    it('should generate audit report', async () => {
      prismaMock.audit.findFirst.mockResolvedValue({
        ...mockAudit,
        findings: [mockFinding],
        evidence: [mockEvidence],
      } as any);

      const response = await request(app)
        .post('/api/audit/audit-123/report')
        .send({
          format: 'pdf',
          includeFindings: true,
          includeEvidence: true,
        })
        .expect(200);

      expect(response.body).toHaveProperty('reportUrl');
    });

    it('should complete audit', async () => {
      prismaMock.audit.findFirst.mockResolvedValue({
        ...mockAudit,
        status: 'In Progress',
      } as any);
      prismaMock.audit.update.mockResolvedValue({
        ...mockAudit,
        status: 'Completed',
        completedAt: new Date(),
        opinion: 'Unqualified',
      } as any);

      const response = await request(app)
        .post('/api/audit/audit-123/complete')
        .send({
          opinion: 'Unqualified',
          summary: 'All controls operating effectively',
        })
        .expect(200);

      expect(response.body.status).toBe('Completed');
      expect(response.body.opinion).toBe('Unqualified');
    });
  });

  describe('Auditor Portal Access', () => {
    it('should create auditor access', async () => {
      prismaMock.auditorAccess.create.mockResolvedValue({
        id: 'access-123',
        auditId: 'audit-123',
        auditorEmail: 'auditor@bigfour.com',
        permissions: ['view_evidence', 'add_findings'],
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      } as any);

      const response = await request(app)
        .post('/api/audit/audit-123/auditor-access')
        .send({
          auditorEmail: 'auditor@bigfour.com',
          permissions: ['view_evidence', 'add_findings'],
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
    });

    it('should revoke auditor access', async () => {
      prismaMock.auditorAccess.update.mockResolvedValue({
        id: 'access-123',
        revokedAt: new Date(),
      } as any);

      const response = await request(app)
        .delete('/api/audit/audit-123/auditor-access/access-123')
        .expect(200);

      expect(response.body).toHaveProperty('revokedAt');
    });
  });

  describe('Audit Dashboard', () => {
    it('should get audit status dashboard', async () => {
      prismaMock.audit.findMany.mockResolvedValue([
        { ...mockAudit, status: 'Completed' },
        { ...mockAudit, id: 'audit-2', status: 'In Progress' },
      ] as any);

      const response = await request(app)
        .get('/api/audit/dashboard')
        .expect(200);

      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('byStatus');
    });
  });
});
