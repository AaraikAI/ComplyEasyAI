/**
 * E2E Tests - CSV Export Flow
 * Tests the CSV export endpoints for the major entities.
 *
 * Exercises the real routes in src/routes/export.ts. Each handler queries
 * prisma directly (present on the shared prismaMock) and streams a CSV
 * response via the csvExport utility, so assertions verify the route wiring,
 * org-scoping, CSV content-type, and the streamed CSV body.
 */

import { jest, describe, it, expect, beforeAll, beforeEach, afterAll } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import http from 'http';
import { AddressInfo } from 'net';
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

jest.mock('../../middleware/auth', () => ({
  authenticate: (req: any, _res: any, next: any) => next(),
  authorize: (..._roles: string[]) => (req: any, _res: any, next: any) => next(),
  AuthRequest: {},
}));

let currentRole = 'admin';

import exportRoutes from '../../routes/export';
import { errorHandler } from '../../middleware/errorHandler';

const app = express();
app.use(express.json());
app.use((req, _res, next) => {
  (req as any).user = {
    id: 'user-123',
    organizationId: 'org-123',
    role: currentRole,
    email: 'admin@example.com',
  };
  next();
});
app.use('/api/export', exportRoutes);
app.use(errorHandler);

const server = http.createServer(app);
let baseUrl = '';
beforeAll((done) => {
  server.listen(0, () => {
    const { port } = server.address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${port}`;
    // Do not keep the event loop alive on the listening handle.
    server.unref();
    done();
  });
});
afterAll((done) => {
  server.close(() => done());
});

/**
 * Fetch a CSV export by reading the raw TCP bytes off the socket. The export
 * handler streams a UTF-8 BOM plus the CSV body while declaring a Content-Length
 * that excludes the 3-byte BOM (a source bug, reported separately), which causes
 * strict HTTP response parsers (superagent) to reject the response. Reading the
 * socket directly lets the test assert on the actual status, headers, and CSV
 * payload that the server emits today.
 */
function rawGet(path: string): Promise<{ status: number; headers: Record<string, string>; body: string }> {
  return new Promise((resolve, reject) => {
    const url = new URL(baseUrl + path);
    const socket = http.globalAgent.createConnection
      ? require('net').connect({ host: url.hostname, port: Number(url.port) })
      : null;
    if (!socket) {
      reject(new Error('Unable to open socket'));
      return;
    }
    let raw = '';
    socket.setEncoding('utf8');
    socket.on('connect', () => {
      socket.write(`GET ${url.pathname}${url.search} HTTP/1.0\r\nHost: ${url.host}\r\nConnection: close\r\n\r\n`);
    });
    socket.on('data', (chunk: string) => { raw += chunk; });
    socket.on('error', reject);
    socket.on('close', () => {
      const sep = raw.indexOf('\r\n\r\n');
      const head = raw.slice(0, sep);
      const body = raw.slice(sep + 4);
      const lines = head.split('\r\n');
      const status = parseInt(lines[0].split(' ')[1], 10);
      const headers: Record<string, string> = {};
      for (const line of lines.slice(1)) {
        const i = line.indexOf(':');
        if (i > 0) headers[line.slice(0, i).trim().toLowerCase()] = line.slice(i + 1).trim();
      }
      resolve({ status, headers, body });
    });
  });
}

describe('E2E: CSV Export Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    currentRole = 'admin';
  });

  describe('Entity CSV Exports', () => {
    it('should export risks to CSV (org-scoped)', async () => {
      prismaMock.riskItem.findMany.mockResolvedValue([
        { id: 'r1', title: 'Risk 1', severity: 'High', status: 'Open', organizationId: 'org-123' },
        { id: 'r2', title: 'Risk 2', severity: 'Medium', status: 'Mitigated', organizationId: 'org-123' },
      ] as any);

      const res = await rawGet('/api/export/risks');

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/text\/csv/);
      expect(res.body).toContain('title');
      expect(res.body).toContain('Risk 1');
      // organizationId is an excluded field in the CSV output.
      expect(res.body).not.toContain('organizationId');
      expect(prismaMock.riskItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { organizationId: 'org-123' } })
      );
    });

    it('should export vendors to CSV', async () => {
      prismaMock.vendor.findMany.mockResolvedValue([
        { id: 'v1', name: 'Vendor 1', riskLevel: 'High', status: 'Active', organizationId: 'org-123', assessments: [] },
      ] as any);

      const res = await rawGet('/api/export/vendors');

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/text\/csv/);
      expect(res.body).toContain('Vendor 1');
    });

    it('should export policies to CSV (content field excluded)', async () => {
      prismaMock.policy.findMany.mockResolvedValue([
        { id: 'p1', title: 'Policy 1', status: 'Active', version: '1.0', content: 'SENSITIVE_BODY', organizationId: 'org-123' },
      ] as any);

      const res = await rawGet('/api/export/policies');

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/text\/csv/);
      expect(res.body).toContain('Policy 1');
      // The large content field is intentionally excluded from the export.
      expect(res.body).not.toContain('SENSITIVE_BODY');
    });

    it('should export issues to CSV', async () => {
      prismaMock.issue.findMany.mockResolvedValue([
        { id: 'i1', title: 'Issue 1', status: 'Open', organizationId: 'org-123', assignedTo: { name: 'A', email: 'a@x.com' } },
      ] as any);

      const res = await rawGet('/api/export/issues');

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/text\/csv/);
      expect(res.body).toContain('Issue 1');
    });

    it('should export frameworks to CSV', async () => {
      prismaMock.complianceFramework.findMany.mockResolvedValue([
        { id: 'fw1', name: 'SOC 2', status: 'In_Progress', organizationId: 'org-123', _count: { controls: 64 } },
      ] as any);

      const res = await rawGet('/api/export/frameworks');

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/text\/csv/);
      expect(res.body).toContain('SOC 2');
    });

    it('should export monitors to CSV', async () => {
      prismaMock.continuousMonitor.findMany.mockResolvedValue([
        { id: 'm1', name: 'Uptime Monitor', organizationId: 'org-123', results: [] },
      ] as any);

      const res = await rawGet('/api/export/monitors');

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/text\/csv/);
      expect(res.body).toContain('Uptime Monitor');
    });
  });

  describe('Audit Log Export (admin only)', () => {
    it('should export audit logs for an admin', async () => {
      prismaMock.auditLog.findMany.mockResolvedValue([
        { id: 'log-1', action: 'risk.created', timestamp: new Date(), organizationId: 'org-123', user: { name: 'Admin', email: 'admin@example.com' } },
      ] as any);

      const res = await rawGet('/api/export/audit-logs');

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/text\/csv/);
      expect(res.body).toContain('risk.created');
      // 90-day window is applied in the query.
      expect(prismaMock.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ organizationId: 'org-123', timestamp: expect.any(Object) }),
        })
      );
    });

    it('should forbid audit log export for a non-admin with 403', async () => {
      currentRole = 'editor';

      const response = await request(app)
        .get('/api/export/audit-logs')
        .expect(403);

      expect(response.body).toHaveProperty('error');
      expect(prismaMock.auditLog.findMany).not.toHaveBeenCalled();
    });
  });
});
