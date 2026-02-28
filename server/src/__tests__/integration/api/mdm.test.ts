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
  requireRole: () => (req: any, res: any, next: any) => next(),
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
        const mockDevices = [createMockDevice(), createMockDevice({ id: 'device-2' })];
        prismaMock.managedDevice.findMany.mockResolvedValue(mockDevices as any);

        const response = await request(app)
          .get('/api/mdm/devices')
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body).toHaveLength(2);
      });

      it('should filter devices by status', async () => {
        prismaMock.managedDevice.findMany.mockResolvedValue([]);

        await request(app)
          .get('/api/mdm/devices?status=Active')
          .expect(200);

        expect(prismaMock.managedDevice.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              status: 'Active',
            }),
          })
        );
      });

      it('should filter devices by platform', async () => {
        prismaMock.managedDevice.findMany.mockResolvedValue([]);

        await request(app)
          .get('/api/mdm/devices?platform=iOS')
          .expect(200);

        expect(prismaMock.managedDevice.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              platform: 'iOS',
            }),
          })
        );
      });
    });

    describe('POST /api/mdm/devices', () => {
      it('should enroll new device', async () => {
        const mockDevice = createMockDevice();
        prismaMock.managedDevice.create.mockResolvedValue(mockDevice as any);

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

      it('should require device name', async () => {
        const response = await request(app)
          .post('/api/mdm/devices')
          .send({
            deviceType: 'Mobile',
            platform: 'iOS',
          })
          .expect(400);

        expect(response.body).toHaveProperty('error');
      });
    });

    describe('GET /api/mdm/devices/:id', () => {
      it('should get device by ID', async () => {
        const mockDevice = createMockDevice();
        prismaMock.managedDevice.findFirst.mockResolvedValue(mockDevice as any);

        const response = await request(app)
          .get('/api/mdm/devices/device-123')
          .expect(200);

        expect(response.body.id).toBe('device-123');
      });

      it('should return 404 for non-existent device', async () => {
        prismaMock.managedDevice.findFirst.mockResolvedValue(null);

        await request(app)
          .get('/api/mdm/devices/nonexistent')
          .expect(404);
      });
    });

    describe('PUT /api/mdm/devices/:id', () => {
      it('should update device', async () => {
        const existingDevice = createMockDevice();
        const updatedDevice = { ...existingDevice, deviceName: 'Updated iPhone' };

        prismaMock.managedDevice.findFirst.mockResolvedValue(existingDevice as any);
        prismaMock.managedDevice.update.mockResolvedValue(updatedDevice as any);

        const response = await request(app)
          .put('/api/mdm/devices/device-123')
          .send({ deviceName: 'Updated iPhone' })
          .expect(200);

        expect(response.body.deviceName).toBe('Updated iPhone');
      });
    });

    describe('DELETE /api/mdm/devices/:id', () => {
      it('should delete device', async () => {
        const mockDevice = createMockDevice();
        prismaMock.managedDevice.findFirst.mockResolvedValue(mockDevice as any);
        prismaMock.managedDevice.delete.mockResolvedValue(mockDevice as any);

        const response = await request(app)
          .delete('/api/mdm/devices/device-123')
          .expect(200);

        expect(response.body).toHaveProperty('message');
      });
    });
  });

  // ===========================================================================
  // Policy Management Tests
  // ===========================================================================
  describe('Policy Management', () => {
    describe('GET /api/mdm/policies', () => {
      it('should list policies', async () => {
        const mockPolicies = [createMockPolicy(), createMockPolicy({ id: 'policy-2' })];
        prismaMock.mDMPolicy.findMany.mockResolvedValue(mockPolicies as any);

        const response = await request(app)
          .get('/api/mdm/policies')
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
      });

      it('should filter by policy type', async () => {
        prismaMock.mDMPolicy.findMany.mockResolvedValue([]);

        await request(app)
          .get('/api/mdm/policies?policyType=Security')
          .expect(200);

        expect(prismaMock.mDMPolicy.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              policyType: 'Security',
            }),
          })
        );
      });
    });

    describe('POST /api/mdm/policies', () => {
      it('should create policy', async () => {
        const mockPolicy = createMockPolicy();
        prismaMock.mDMPolicy.create.mockResolvedValue(mockPolicy as any);

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
    describe('POST /api/mdm/devices/:id/actions', () => {
      it('should execute lock action', async () => {
        const mockDevice = createMockDevice();
        const mockAction = {
          id: 'action-123',
          deviceId: 'device-123',
          actionType: 'Lock',
          status: 'Completed',
        };

        prismaMock.managedDevice.findFirst.mockResolvedValue(mockDevice as any);
        prismaMock.deviceAction.create.mockResolvedValue(mockAction as any);
        prismaMock.deviceAction.update.mockResolvedValue(mockAction as any);
        prismaMock.deviceAction.findUnique.mockResolvedValue(mockAction as any);

        const response = await request(app)
          .post('/api/mdm/devices/device-123/actions')
          .send({ actionType: 'Lock' })
          .expect(200);

        expect(response.body.actionType).toBe('Lock');
      });

      it('should return 404 for non-existent device', async () => {
        prismaMock.managedDevice.findFirst.mockResolvedValue(null);

        await request(app)
          .post('/api/mdm/devices/nonexistent/actions')
          .send({ actionType: 'Lock' })
          .expect(404);
      });
    });

    describe('GET /api/mdm/actions', () => {
      it('should list device actions', async () => {
        const mockActions = [
          { id: 'action-1', actionType: 'Lock', status: 'Completed' },
          { id: 'action-2', actionType: 'Wipe', status: 'Pending' },
        ];

        prismaMock.deviceAction.findMany.mockResolvedValue(mockActions as any);

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
        const mockDevices = [
          createMockDevice({ compliance: 'Compliant' }),
          createMockDevice({ id: 'device-2', compliance: 'Compliant' }),
          createMockDevice({ id: 'device-3', compliance: 'NonCompliant' }),
        ];

        prismaMock.managedDevice.findMany.mockResolvedValue(mockDevices as any);

        const response = await request(app)
          .get('/api/mdm/compliance')
          .expect(200);

        expect(response.body).toHaveProperty('total');
        expect(response.body).toHaveProperty('compliant');
        expect(response.body).toHaveProperty('complianceRate');
      });
    });

    describe('POST /api/mdm/devices/:id/compliance-check', () => {
      it('should run compliance check on device', async () => {
        const mockDevice = createMockDevice();
        const mockPolicy = createMockPolicy();
        const mockCheck = { id: 'check-123', passed: true };

        prismaMock.managedDevice.findFirst.mockResolvedValue(mockDevice as any);
        prismaMock.mDMPolicy.findMany.mockResolvedValue([mockPolicy] as any);
        prismaMock.deviceComplianceCheck.create.mockResolvedValue(mockCheck as any);
        prismaMock.managedDevice.update.mockResolvedValue(mockDevice as any);

        const response = await request(app)
          .post('/api/mdm/devices/device-123/compliance-check')
          .expect(200);

        expect(response.body).toHaveProperty('complianceStatus');
      });
    });
  });

  // ===========================================================================
  // Dashboard Tests
  // ===========================================================================
  describe('Dashboard', () => {
    describe('GET /api/mdm/dashboard', () => {
      it('should return MDM dashboard data', async () => {
        prismaMock.managedDevice.count.mockResolvedValue(100);
        prismaMock.managedDevice.findMany.mockResolvedValue([]);
        prismaMock.mDMPolicy.count.mockResolvedValue(10);
        prismaMock.mDMPolicy.findMany.mockResolvedValue([]);
        prismaMock.deviceAction.findMany.mockResolvedValue([]);

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
