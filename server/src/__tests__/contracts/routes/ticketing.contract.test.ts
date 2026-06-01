/**
 * Ticketing Integration Routes — Contract Tests
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import { prismaMock } from '../../mocks/prisma';

jest.mock('../../../config/database', () => ({ __esModule: true, default: prismaMock }));
jest.mock('../../../config/logger', () => ({
  __esModule: true, default: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));
jest.mock('../../../utils/auditLogger', () => ({ AuditLogger: { log: jest.fn() } }));
jest.mock('../../../middleware/auth', () => ({
  authenticate: (req: any, res: any, next: any) => {
    if ((req as any).user) { next(); return; }
    res.status(401).json({ error: 'No token provided' });
  },
  authorize: (..._roles: string[]) => (req: any, res: any, next: any) => {
    if (!(req as any).user) { res.status(401).json({ error: 'Authentication required' }); return; }
    next();
  },
  AuthRequest: {},
}));

// Mock the ticketing provider services. These stub the EXACT methods the route
// invokes (jiraService.listProjects/createComplianceTicket/getIntegration/
// disconnect/syncComplianceIssues/getSyncStatus/processWebhookEvent, etc.) so
// the handlers run to completion against deterministic provider responses and
// the assertions reflect the real route contract rather than a 500 from a
// missing method.
// The mock fns are referenced from beforeEach to re-seed implementations: the
// jest config sets resetMocks:true, which wipes every fn's implementation
// before each test, so resolved values declared here would otherwise be lost.
const jiraServiceMock = {
  testConnection: jest.fn(),
  listProjects: jest.fn(),
  saveIntegration: jest.fn(),
  getIntegration: jest.fn(),
  createComplianceTicket: jest.fn(),
  disconnect: jest.fn(),
  syncComplianceIssues: jest.fn(),
  getSyncStatus: jest.fn(),
  processWebhookEvent: jest.fn(),
};
const servicenowServiceMock = {
  testConnection: jest.fn(),
  saveIntegration: jest.fn(),
  disconnect: jest.fn(),
  createComplianceIncident: jest.fn(),
  getIncident: jest.fn(),
  syncIncidents: jest.fn(),
  getSyncStatus: jest.fn(),
  syncStatus: jest.fn(),
  processWebhookEvent: jest.fn(),
};
const azureDevOpsServiceMock = {
  testConnection: jest.fn(),
  saveIntegration: jest.fn(),
  disconnect: jest.fn(),
  createComplianceWorkItem: jest.fn(),
  getWorkItem: jest.fn(),
  syncWorkItems: jest.fn(),
  getSyncStatus: jest.fn(),
  syncStatus: jest.fn(),
  processWebhookEvent: jest.fn(),
};
jest.mock('../../../services/integrations/jiraService', () => ({
  __esModule: true,
  default: jiraServiceMock,
}));
jest.mock('../../../services/integrations/servicenowService', () => ({
  __esModule: true,
  default: servicenowServiceMock,
}));
jest.mock('../../../services/integrations/azureDevOpsService', () => ({
  __esModule: true,
  default: azureDevOpsServiceMock,
}));

// Re-seed provider-service implementations the route invokes. Called from
// beforeEach because resetMocks:true clears implementations between tests.
const seedTicketingServiceMocks = () => {
  jiraServiceMock.testConnection.mockResolvedValue({ success: true, message: 'Connected to Jira.' });
  jiraServiceMock.listProjects.mockResolvedValue([{ id: '10000', key: 'COMP', name: 'Compliance' }]);
  jiraServiceMock.saveIntegration.mockResolvedValue({ id: 'int-1', provider: 'jira' });
  jiraServiceMock.getIntegration.mockResolvedValue({ id: 'int-1', provider: 'jira', config: { projectKey: 'COMP' } });
  jiraServiceMock.createComplianceTicket.mockResolvedValue({ id: 'JIRA-1', key: 'COMP-1', url: 'https://jira/COMP-1' });
  jiraServiceMock.disconnect.mockResolvedValue(undefined);
  jiraServiceMock.syncComplianceIssues.mockResolvedValue({ pushed: 2, pulled: 1, updated: 0, errors: [] });
  jiraServiceMock.getSyncStatus.mockResolvedValue({ lastSync: new Date(), totalSynced: 3, pendingSync: 0, syncErrors: 0 });
  jiraServiceMock.processWebhookEvent.mockResolvedValue({ processed: true });

  servicenowServiceMock.testConnection.mockResolvedValue({ success: true, message: 'Connected to ServiceNow.' });
  servicenowServiceMock.saveIntegration.mockResolvedValue({ id: 'int-2', provider: 'servicenow' });
  servicenowServiceMock.disconnect.mockResolvedValue(undefined);
  servicenowServiceMock.createComplianceIncident.mockResolvedValue({ id: 'INC001' });
  servicenowServiceMock.getIncident.mockResolvedValue({ id: 'INC001' });
  servicenowServiceMock.syncIncidents.mockResolvedValue({ pushed: 0, pulled: 0, updated: 0, errors: [] });
  servicenowServiceMock.getSyncStatus.mockResolvedValue({ lastSync: null, totalSynced: 0, pendingSync: 0, syncErrors: 0 });
  servicenowServiceMock.syncStatus.mockResolvedValue({ status: 'synced' });
  servicenowServiceMock.processWebhookEvent.mockResolvedValue({ processed: true });

  azureDevOpsServiceMock.testConnection.mockResolvedValue({ success: true, message: 'Connected to Azure DevOps.' });
  azureDevOpsServiceMock.saveIntegration.mockResolvedValue({ id: 'int-3', provider: 'azure_devops' });
  azureDevOpsServiceMock.disconnect.mockResolvedValue(undefined);
  azureDevOpsServiceMock.createComplianceWorkItem.mockResolvedValue({ id: 1 });
  azureDevOpsServiceMock.getWorkItem.mockResolvedValue({ id: 1 });
  azureDevOpsServiceMock.syncWorkItems.mockResolvedValue({ pushed: 0, pulled: 0, updated: 0, errors: [] });
  azureDevOpsServiceMock.getSyncStatus.mockResolvedValue({ lastSync: null, totalSynced: 0, pendingSync: 0, syncErrors: 0 });
  azureDevOpsServiceMock.syncStatus.mockResolvedValue({ status: 'synced' });
  azureDevOpsServiceMock.processWebhookEvent.mockResolvedValue({ processed: true });
};

import ticketingRoutes from '../../../routes/ticketing';
import { errorHandler } from '../../../middleware/errorHandler';

const app = express();
app.use(express.json());
app.use((req, _res, next): void => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    try { (req as any).user = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET || 'test-secret') as any; } catch {}
  }
  next();
});
app.use('/api/ticketing', ticketingRoutes);
app.use(errorHandler);

const generateTestToken = (userId = 'user-123', organizationId = 'org-123', role = 'Admin') =>
  jwt.sign({ id: userId, organizationId, role, email: 'test@example.com', name: 'Test User' }, process.env.JWT_SECRET || 'test-secret', { expiresIn: '1h' });

describe('Ticketing API — Contract Tests', () => {
  const authToken = generateTestToken();
  beforeEach(() => {
    jest.clearAllMocks();
    seedTicketingServiceMocks();
    // The /sync route stamps lastSync via prisma.integration.updateMany, which is
    // not predefined on the shared prisma mock; attach a fresh fn each test.
    (prismaMock.integration as Record<string, unknown>).updateMany = jest.fn();
  });

  // GET /config
  describe('GET /api/ticketing/config', () => {
    it('should return ticketing config', async () => {
      prismaMock.integration.findMany.mockResolvedValue([
        { id: 'int-1', provider: 'jira', organizationId: 'org-123', config: { provider: 'jira' }, status: 'active' },
      ]);

      const res = await request(app).get('/api/ticketing/config').set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
    });

    it('should return 401 without auth', async () => {
      const res = await request(app).get('/api/ticketing/config');
      expect(res.status).toBe(401);
    });
  });

  // POST /config
  describe('POST /api/ticketing/config', () => {
    it('should save ticketing config', async () => {
      prismaMock.integration.upsert.mockResolvedValue({ id: 'int-1', provider: 'jira', config: {} });

      const res = await request(app)
        .post('/api/ticketing/config')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ provider: 'jira', instanceUrl: 'https://jira.test', authType: 'pat', pat: 'token123' });
      expect(res.status).toBe(200);
    });

    it('should return 400 when provider missing', async () => {
      const res = await request(app)
        .post('/api/ticketing/config')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});
      expect(res.status).toBe(400);
    });
  });

  // DELETE /config — provider is read from the query string and is required.
  describe('DELETE /api/ticketing/config', () => {
    it('should disconnect the provider integration', async () => {
      const res = await request(app)
        .delete('/api/ticketing/config?provider=jira')
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ success: true });
      // The route delegates teardown to the provider service for the caller's org.
      expect(jiraServiceMock.disconnect).toHaveBeenCalledWith('org-123');
    });

    it('should return 400 when the provider query param is missing', async () => {
      const res = await request(app)
        .delete('/api/ticketing/config')
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(400);
      expect(jiraServiceMock.disconnect).not.toHaveBeenCalled();
    });
  });

  // POST /test — provider is required in the body (testTicketingConnectionSchema).
  describe('POST /api/ticketing/test', () => {
    it('should test the Jira connection by listing projects', async () => {
      const res = await request(app)
        .post('/api/ticketing/test')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ provider: 'jira' });
      expect(res.status).toBe(200);
      // The jira test path lists projects and reports the count in the message.
      expect(jiraServiceMock.listProjects).toHaveBeenCalledWith('org-123');
      expect(res.body).toMatchObject({ success: true });
      expect(res.body.message).toMatch(/1 project/);
    });

    it('should return 400 when provider is missing', async () => {
      const res = await request(app)
        .post('/api/ticketing/test')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});
      expect(res.status).toBe(400);
    });
  });

  // POST /sync — provider is required (syncTicketingSchema).
  describe('POST /api/ticketing/sync', () => {
    it('should trigger a Jira sync and report the result', async () => {
      prismaMock.integration.updateMany.mockResolvedValue({ count: 1 } as any);

      const res = await request(app)
        .post('/api/ticketing/sync')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ provider: 'jira', direction: 'bidirectional' });
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ success: true });
      // The route forwards org + direction and returns the provider sync result.
      expect(jiraServiceMock.syncComplianceIssues).toHaveBeenCalledWith(
        'org-123',
        expect.objectContaining({ direction: 'bidirectional' }),
      );
      expect(res.body.syncResult).toMatchObject({ pushed: 2, pulled: 1 });
      // lastSync is stamped for the org's provider integration.
      expect(prismaMock.integration.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { organizationId: 'org-123', provider: 'jira' } }),
      );
    });

    it('should return 400 when provider is missing', async () => {
      const res = await request(app)
        .post('/api/ticketing/sync')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});
      expect(res.status).toBe(400);
    });
  });

  // POST /create-ticket — createTicketSchema requires provider + title.
  describe('POST /api/ticketing/create-ticket', () => {
    it('should create a Jira ticket and write an audit log', async () => {
      prismaMock.auditLog.create.mockResolvedValue({ id: 'al-1' } as any);

      const res = await request(app)
        .post('/api/ticketing/create-ticket')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ provider: 'jira', title: 'Fix issue', description: 'Details here', severity: 'High', sourceType: 'risk', sourceId: 'r-1' });
      // The route responds via res.json (HTTP 200) with the created ticket.
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ success: true, provider: 'jira' });
      expect(res.body.ticket).toMatchObject({ key: 'COMP-1' });
      // The ticket is created under the resolved project key (from getIntegration config).
      expect(jiraServiceMock.createComplianceTicket).toHaveBeenCalledWith(
        'org-123',
        'COMP',
        expect.objectContaining({ title: 'Fix issue', severity: 'High' }),
      );
      // The creation is recorded in the audit log for the caller's org.
      expect(prismaMock.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ action: 'ticketing.ticket_created', organizationId: 'org-123' }),
        }),
      );
    });

    it('should return 400 when title missing', async () => {
      const res = await request(app)
        .post('/api/ticketing/create-ticket')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ provider: 'jira' });
      expect(res.status).toBe(400);
      expect(jiraServiceMock.createComplianceTicket).not.toHaveBeenCalled();
    });

    it('should return 400 when provider missing', async () => {
      const res = await request(app)
        .post('/api/ticketing/create-ticket')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Fix issue' });
      expect(res.status).toBe(400);
    });
  });

  // GET /tickets — sourced from ticketing audit-log records, org-scoped + paginated.
  describe('GET /api/ticketing/tickets', () => {
    it('should list synced tickets from the audit log', async () => {
      prismaMock.auditLog.findMany.mockResolvedValue([
        {
          id: 'al-1', action: 'jira_sync.pushed', hash: 'jira:risk:r-1',
          details: JSON.stringify({ jiraIssueKey: 'COMP-1', sourceType: 'risk', sourceId: 'r-1' }),
          timestamp: new Date(), userId: 'user-123',
        },
      ] as any);
      prismaMock.auditLog.count.mockResolvedValue(1);

      const res = await request(app).get('/api/ticketing/tickets').set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
      expect(res.body.pagination).toMatchObject({ page: 1, totalCount: 1 });
      expect(res.body.tickets).toHaveLength(1);
      expect(res.body.tickets[0]).toMatchObject({ provider: 'jira', externalId: 'COMP-1' });
      // The listing must be scoped to the caller's organization.
      expect(prismaMock.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ organizationId: 'org-123' }) }),
      );
    });
  });

  // GET /sync-status — provider is read from the query string and required.
  describe('GET /api/ticketing/sync-status', () => {
    it('should return the provider sync status', async () => {
      const res = await request(app)
        .get('/api/ticketing/sync-status?provider=jira')
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ provider: 'jira', totalSynced: 3, pendingSync: 0, syncErrors: 0 });
      expect(jiraServiceMock.getSyncStatus).toHaveBeenCalledWith('org-123');
    });

    it('should return 400 when the provider query param is missing', async () => {
      const res = await request(app)
        .get('/api/ticketing/sync-status')
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(400);
    });
  });

  // GET /connections
  describe('GET /api/ticketing/connections', () => {
    it('should list connections', async () => {
      prismaMock.integration.findMany.mockResolvedValue([]);

      const res = await request(app).get('/api/ticketing/connections').set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
    });
  });

  // POST /connections — upserts the integration (basic-auth path) then returns
  // the persisted connection via res.json (HTTP 200).
  describe('POST /api/ticketing/connections', () => {
    it('should create a Jira connection and return the persisted record', async () => {
      prismaMock.integration.upsert.mockResolvedValue({ id: 'int-new', provider: 'jira' } as any);
      prismaMock.integration.findUnique.mockResolvedValue({
        id: 'int-new', provider: 'jira', name: 'Jira', connected: true, lastSync: new Date(),
        config: { instanceUrl: 'https://jira.test', authType: 'basic', projectKey: 'COMP' },
      } as any);

      const res = await request(app)
        .post('/api/ticketing/connections')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ provider: 'jira', username: 'svc@test', password: 'token', instanceUrl: 'https://jira.test', projectKey: 'COMP' });
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ success: true });
      expect(res.body.connection).toMatchObject({ id: 'int-new', provider: 'jira', connected: true });
      // Credentials are persisted via upsert keyed by org+provider.
      expect(prismaMock.integration.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { organizationId_provider: { organizationId: 'org-123', provider: 'jira' } },
        }),
      );
      // Sanitized response must never echo the raw secret back.
      expect(res.body.connection.config?.password).toBeUndefined();
    });

    it('should return 400 for an invalid provider', async () => {
      const res = await request(app)
        .post('/api/ticketing/connections')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ provider: 'gitlab' });
      expect(res.status).toBe(400);
    });
  });

  // POST /tickets/bulk-sync
  describe('POST /api/ticketing/tickets/bulk-sync', () => {
    it('should trigger bulk sync', async () => {
      prismaMock.integration.findFirst.mockResolvedValue({
        id: 'int-1', provider: 'jira', config: { provider: 'jira', syncEnabled: true },
      });

      const res = await request(app)
        .post('/api/ticketing/tickets/bulk-sync')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});
      expect(res.status).toBe(200);
    });
  });

  // POST /webhook/:provider — receiver verifies org context + HMAC signature before any side effect.
  // The route is mounted under authenticate, so a valid token is required to reach the handler;
  // beyond that, org context and a configured webhook secret gate any payload processing.
  describe('POST /api/ticketing/webhook/:provider', () => {
    it('should reject with 400 when organization context is missing', async () => {
      // Authenticated, but no x-complyeasy-org-id header and no ?orgId — refuse before any DB work.
      const res = await request(app)
        .post('/api/ticketing/webhook/jira')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ event: 'issue_updated' });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
      // Org is resolved before the integration lookup, so no secret/HMAC work happens.
      expect(prismaMock.integration.findFirst).not.toHaveBeenCalled();
    });

    it('should reject with 400 for an unknown provider', async () => {
      const res = await request(app)
        .post('/api/ticketing/webhook/notaprovider')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-complyeasy-org-id', 'org-123')
        .send({ event: 'issue_updated' });

      expect(res.status).toBe(400);
    });

    it('should reject with 401 when no webhook secret is configured for the integration', async () => {
      // Org context present and provider valid, but the integration has no webhookSecret →
      // the receiver cannot verify HMAC and must refuse (no payload processing).
      prismaMock.integration.findFirst.mockResolvedValue({ id: 'int-1', config: {} } as any);

      const res = await request(app)
        .post('/api/ticketing/webhook/jira')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-complyeasy-org-id', 'org-123')
        .send({ event: 'issue_updated' });

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error');
      expect(prismaMock.integration.findFirst).toHaveBeenCalled();
    });
  });
});
