/**
 * MDM Routes Integration Tests
 *
 * Tests for device management, policies, actions, and compliance routes.
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import express, { Express } from 'express';
import { prismaMock } from '../../mocks/prisma';

// Mock dependencies
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

jest.mock('../../../utils/auditLogger', () => ({
  AuditLogger: {
    log: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('../../../middleware/auth', () => ({
  authenticate: (req: any, res: any, next: any) => {
    req.user = {
      id: 'user-123',
      email: 'test@example.com',
      organizationId: 'org-123',
      role: 'Admin',
    };
    next();
  },
  authorize: (..._roles: string[]) => (req: any, res: any, next: any) => next(),
  requireRole: () => (req: any, res: any, next: any) => next(),
  AuthRequest: {},
}));

// Mock MDM service
jest.mock('../../../services/mdmService', () => ({
  __esModule: true,
  default: {
    getMDMDashboard: jest.fn().mockResolvedValue({
      deviceStats: { total: 100, active: 90, inactive: 10 },
      complianceOverview: { compliant: 80, nonCompliant: 20 },
      policyStats: { total: 10, active: 8 },
    }),
    getDevices: jest.fn().mockResolvedValue([]),
    enrollDevice: jest.fn().mockResolvedValue({
      id: 'device-123',
      deviceName: "John's iPhone",
      deviceType: 'Mobile',
      platform: 'iOS',
      osVersion: '17.0',
      status: 'Active',
      compliance: 'Compliant',
    }),
    getDeviceById: jest.fn().mockResolvedValue(null),
    updateDevice: jest.fn().mockResolvedValue({ id: 'device-123', deviceName: 'Updated iPhone' }),
    createDeviceAction: jest.fn().mockResolvedValue({ success: true }),
    unenrollDevice: jest.fn().mockResolvedValue(undefined),
    reassignDevice: jest.fn().mockResolvedValue({ id: 'device-123' }),
    getPolicies: jest.fn().mockResolvedValue([]),
    createPolicy: jest.fn().mockResolvedValue({
      id: 'policy-123',
      name: 'Corporate Security Policy',
      policyType: 'Security',
    }),
    getPolicyById: jest.fn().mockResolvedValue(null),
    updatePolicy: jest.fn().mockResolvedValue({ id: 'policy-123' }),
    deletePolicy: jest.fn().mockResolvedValue(undefined),
    checkDeviceCompliance: jest.fn().mockResolvedValue({
      total: 3,
      compliant: 2,
      nonCompliant: 1,
      complianceRate: 66.7,
    }),
    getDeviceActions: jest.fn().mockResolvedValue([]),
    bulkDeviceAction: jest.fn().mockResolvedValue({ processed: 0, failed: 0 }),
  },
}));

// Mock data factories
const createMockDevice = (overrides: Record<string, unknown> = {}) => ({
  id: 'device-123',
  organizationId: 'org-123',
  deviceName: "John's iPhone",
  deviceType: 'Mobile',
  platform: 'iOS',
  osVersion: '17.0',
  status: 'Active',
  compliance: 'Compliant',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

const createMockPolicy = (overrides: Record<string, unknown> = {}) => ({
  id: 'policy-123',
  organizationId: 'org-123',
  name: 'Corporate Security Policy',
  policyType: 'Security',
  platform: ['iOS', 'Android'],
  enforced: true,
  status: 'Active',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

// Setup app
let app: Express;

beforeEach(async () => {
  jest.clearAllMocks();

  // Re-setup mdmService mocks (resetMocks: true clears implementations)
  const mdmService = require('../../../services/mdmService').default;
  mdmService.getMDMDashboard.mockResolvedValue({
    deviceStats: { total: 100, active: 90, inactive: 10 },
    complianceOverview: { compliant: 80, nonCompliant: 20 },
    policyStats: { total: 10, active: 8 },
  });
  mdmService.getDevices.mockResolvedValue([
    createMockDevice(),
    createMockDevice({ id: 'device-2' }),
  ]);
  mdmService.enrollDevice.mockResolvedValue(createMockDevice());
  mdmService.getDeviceById.mockResolvedValue(null);
  mdmService.updateDevice.mockResolvedValue({ ...createMockDevice(), deviceName: 'Updated iPhone' });
  mdmService.createDeviceAction.mockResolvedValue({ success: true });
  mdmService.getPolicies.mockResolvedValue([
    createMockPolicy(),
    createMockPolicy({ id: 'policy-2' }),
  ]);
  mdmService.createPolicy.mockResolvedValue(createMockPolicy());
  mdmService.checkDeviceCompliance.mockResolvedValue({
    total: 3,
    compliant: 2,
    nonCompliant: 1,
    complianceRate: 66.7,
  });
  mdmService.getDeviceActions.mockResolvedValue([
    { id: 'action-1', actionType: 'Lock', status: 'Completed' },
    { id: 'action-2', actionType: 'Wipe', status: 'Pending' },
  ]);

  app = express();
  app.use(express.json());

  const mdmRoutes = (await import('../../../routes/mdm')).default;
  app.use('/api/mdm', mdmRoutes);
});

describe('MDM Routes Integration', () => {
  // ===========================================================================
  // Device Management Tests
  // ===========================================================================
  describe('Device Management', () => {
    describe('GET /api/mdm/devices', () => {
      it('should list devices', async () => {
        const response = await request(app)
          .get('/api/mdm/devices')
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body).toHaveLength(2);
      });
    });

    describe('POST /api/mdm/devices', () => {
      it('should enroll new device', async () => {
        const response = await request(app)
          .post('/api/mdm/devices')
          .send({
            deviceName: "John's iPhone",
            deviceType: 'Mobile',
            platform: 'iOS',
            osVersion: '17.0',
          })
          .expect(201);

        expect(response.body).toHaveProperty('id');
        expect(response.body.deviceName).toBe("John's iPhone");
      });
    });

    describe('GET /api/mdm/devices/:id', () => {
      it('should get device by ID', async () => {
        const mdmService = require('../../../services/mdmService').default;
        mdmService.getDeviceById.mockResolvedValue(createMockDevice());

        const response = await request(app)
          .get('/api/mdm/devices/device-123')
          .expect(200);

        expect(response.body.id).toBe('device-123');
      });

      it('should return 404 for non-existent device', async () => {
        const mdmService = require('../../../services/mdmService').default;
        mdmService.getDeviceById.mockResolvedValue(null);

        await request(app)
          .get('/api/mdm/devices/nonexistent')
          .expect(404);
      });
    });

    describe('PATCH /api/mdm/devices/:id', () => {
      it('should update device', async () => {
        const mdmService = require('../../../services/mdmService').default;
        mdmService.updateDevice.mockResolvedValue({
          ...createMockDevice(),
          deviceName: 'Updated iPhone',
        });

        const response = await request(app)
          .patch('/api/mdm/devices/device-123')
          .send({ deviceName: 'Updated iPhone' })
          .expect(200);

        expect(response.body.deviceName).toBe('Updated iPhone');
      });
    });
  });

  // ===========================================================================
  // Policy Management Tests
  // ===========================================================================
  describe('Policy Management', () => {
    describe('GET /api/mdm/policies', () => {
      it('should list policies', async () => {
        const response = await request(app)
          .get('/api/mdm/policies')
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
      });
    });

    describe('POST /api/mdm/policies', () => {
      it('should create policy', async () => {
        const response = await request(app)
          .post('/api/mdm/policies')
          .send({
            name: 'Corporate Security Policy',
            policyType: 'Security',
            platform: ['iOS', 'Android'],
            rules: [],
          })
          .expect(201);

        expect(response.body).toHaveProperty('id');
      });
    });
  });

  // ===========================================================================
  // Device Actions Tests
  // ===========================================================================
  describe('Device Actions', () => {
    describe('POST /api/mdm/devices/:id/lock', () => {
      it('should execute lock action', async () => {
        const response = await request(app)
          .post('/api/mdm/devices/device-123/lock')
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
      });
    });

    describe('GET /api/mdm/actions', () => {
      it('should list device actions', async () => {
        const response = await request(app)
          .get('/api/mdm/actions')
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
      });
    });
  });

  // ===========================================================================
  // Compliance Tests
  // ===========================================================================
  describe('Compliance', () => {
    describe('GET /api/mdm/compliance', () => {
      it('should return compliance status', async () => {
        const response = await request(app)
          .get('/api/mdm/compliance')
          .expect(200);

        expect(response.body).toBeDefined();
      });
    });
  });

  // ===========================================================================
  // Dashboard Tests
  // ===========================================================================
  describe('Dashboard', () => {
    describe('GET /api/mdm/dashboard', () => {
      it('should return MDM dashboard data', async () => {
        const response = await request(app)
          .get('/api/mdm/dashboard')
          .expect(200);

        expect(response.body).toHaveProperty('deviceStats');
        expect(response.body).toHaveProperty('complianceOverview');
        expect(response.body).toHaveProperty('policyStats');
      });
    });
  });
});
