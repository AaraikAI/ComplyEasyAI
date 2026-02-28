/**
 * MDM (Mobile Device Management) Service Tests
 *
 * Comprehensive tests for device enrollment, policy management,
 * device actions, compliance checking, and dashboard functionality.
 */
import { MDMService } from '../../../services/mdmService';
import prisma from '../../../config/database';
import { AuditLogger } from '../../../utils/auditLogger';

// Mock dependencies
jest.mock('../../../config/database', () => ({
  __esModule: true,
  default: {
    managedDevice: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    mDMPolicy: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    deviceAction: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    deviceComplianceCheck: {
      create: jest.fn(),
    },
  },
}));

jest.mock('../../../utils/auditLogger', () => ({
  AuditLogger: {
    log: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('../../../config/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

// Mock data factories
const createMockDevice = (overrides: Record<string, unknown> = {}) => ({
  id: 'device-001',
  organizationId: 'org-123',
  deviceName: 'John\'s iPhone',
  deviceType: 'Mobile',
  platform: 'iOS',
  osVersion: '17.0',
  serialNumber: 'ABC123DEF456',
  imei: '123456789012345',
  macAddress: 'AA:BB:CC:DD:EE:FF',
  enrolledAt: new Date('2024-01-15'),
  lastCheckIn: new Date('2024-01-20'),
  assignedUserId: 'user-001',
  assignedUserName: 'John Doe',
  compliance: 'Compliant',
  encryptionEnabled: true,
  passcodeSet: true,
  jailbroken: false,
  vpnEnabled: true,
  antivirusInstalled: true,
  antivirusUpToDate: true,
  osUpToDate: true,
  firewallEnabled: true,
  autoUpdateEnabled: true,
  screenLockTimeout: 300,
  installedApps: ['Slack', 'Teams', 'Outlook'],
  blockedApps: [],
  networkProfiles: [],
  location: null,
  batteryLevel: 85,
  storageUsed: 32000,
  storageTotal: 128000,
  status: 'Active',
  riskScore: 15,
  lastSecurityScan: new Date('2024-01-19'),
  policies: [],
  tags: ['corporate', 'sales'],
  metadata: {},
  createdAt: new Date('2024-01-15'),
  updatedAt: new Date('2024-01-20'),
  ...overrides,
});

const createMockPolicy = (overrides: Record<string, unknown> = {}) => ({
  id: 'policy-001',
  organizationId: 'org-123',
  name: 'Corporate Security Policy',
  description: 'Standard security requirements for corporate devices',
  policyType: 'Security',
  platform: ['iOS', 'Android'],
  settings: {
    rules: [
      { id: 'rule-1', ruleType: 'RequireEncryption', parameter: '', value: '', severity: 'Critical', enforcementAction: 'Block' },
      { id: 'rule-2', ruleType: 'RequirePasscode', parameter: '', value: '', severity: 'High', enforcementAction: 'Warn' },
    ],
  },
  priority: 1,
  enforced: true,
  assignedGroups: null,
  assignedDeviceCount: 50,
  status: 'Active',
  version: 1,
  createdBy: 'admin-001',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-10'),
  ...overrides,
});

const createMockDeviceAction = (overrides: Record<string, unknown> = {}) => ({
  id: 'action-001',
  deviceId: 'device-001',
  actionType: 'Lock',
  initiatedBy: 'admin-001',
  status: 'Completed',
  result: { message: 'Device locked successfully', simulated: true },
  error: null,
  scheduledAt: null,
  executedAt: new Date('2024-01-20'),
  completedAt: new Date('2024-01-20'),
  createdAt: new Date('2024-01-20'),
  ...overrides,
});

describe('MDMService', () => {
  let mdmService: MDMService;

  beforeEach(() => {
    jest.clearAllMocks();
    mdmService = new MDMService();
  });

  // ===========================================================================
  // Device CRUD Tests
  // ===========================================================================
  describe('Device CRUD', () => {
    describe('enrollDevice()', () => {
      it('should enroll a new device with all fields', async () => {
        const mockDevice = createMockDevice();
        (prisma.managedDevice.create as jest.Mock).mockResolvedValue(mockDevice);

        const result = await mdmService.enrollDevice({
          organizationId: 'org-123',
          deviceName: 'John\'s iPhone',
          deviceType: 'Mobile',
          platform: 'iOS',
          osVersion: '17.0',
          serialNumber: 'ABC123DEF456',
          imei: '123456789012345',
          assignedUserId: 'user-001',
          assignedUserName: 'John Doe',
          macAddress: 'AA:BB:CC:DD:EE:FF',
          tags: ['corporate', 'sales'],
          metadata: { department: 'Sales' },
          enrolledBy: 'admin-001',
        });

        expect(result).toBeDefined();
        expect(result.deviceName).toBe('John\'s iPhone');
        expect(prisma.managedDevice.create).toHaveBeenCalled();
        expect(AuditLogger.log).toHaveBeenCalledWith(
          expect.objectContaining({
            action: 'mdm_device.enrolled',
            resourceType: 'ManagedDevice',
          })
        );
      });

      it('should enroll a device with minimal required fields', async () => {
        const minimalDevice = createMockDevice({
          osVersion: null,
          serialNumber: null,
          imei: null,
          tags: [],
        });
        (prisma.managedDevice.create as jest.Mock).mockResolvedValue(minimalDevice);

        const result = await mdmService.enrollDevice({
          organizationId: 'org-123',
          deviceName: 'Test Device',
          deviceType: 'Tablet',
          platform: 'Android',
        });

        expect(result).toBeDefined();
        expect(prisma.managedDevice.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              status: 'Active',
              compliance: 'Unknown',
            }),
          })
        );
      });

      it('should use userId when enrolledBy is not provided', async () => {
        const mockDevice = createMockDevice();
        (prisma.managedDevice.create as jest.Mock).mockResolvedValue(mockDevice);

        await mdmService.enrollDevice({
          organizationId: 'org-123',
          deviceName: 'Test Device',
          deviceType: 'Mobile',
          platform: 'iOS',
          userId: 'user-alt-001',
        });

        expect(AuditLogger.log).toHaveBeenCalledWith(
          expect.objectContaining({
            userId: 'user-alt-001',
          })
        );
      });

      it('should default to system user when no user ID provided', async () => {
        const mockDevice = createMockDevice();
        (prisma.managedDevice.create as jest.Mock).mockResolvedValue(mockDevice);

        await mdmService.enrollDevice({
          organizationId: 'org-123',
          deviceName: 'Test Device',
          deviceType: 'Mobile',
          platform: 'iOS',
        });

        expect(AuditLogger.log).toHaveBeenCalledWith(
          expect.objectContaining({
            userId: 'system',
          })
        );
      });
    });

    describe('listDevices()', () => {
      it('should list all devices for an organization', async () => {
        const devices = [
          createMockDevice({ id: 'device-001' }),
          createMockDevice({ id: 'device-002', deviceName: 'Jane\'s Android' }),
        ];
        (prisma.managedDevice.findMany as jest.Mock).mockResolvedValue(devices);

        const result = await mdmService.listDevices('org-123');

        expect(result).toHaveLength(2);
        expect(prisma.managedDevice.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { organizationId: 'org-123' },
          })
        );
      });

      it('should filter devices by status', async () => {
        const devices = [createMockDevice({ status: 'Active' })];
        (prisma.managedDevice.findMany as jest.Mock).mockResolvedValue(devices);

        await mdmService.listDevices('org-123', { status: 'Active' });

        expect(prisma.managedDevice.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({ status: 'Active' }),
          })
        );
      });

      it('should filter devices by compliance status', async () => {
        const devices = [createMockDevice({ compliance: 'NonCompliant' })];
        (prisma.managedDevice.findMany as jest.Mock).mockResolvedValue(devices);

        await mdmService.listDevices('org-123', { compliance: 'NonCompliant' });

        expect(prisma.managedDevice.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({ compliance: 'NonCompliant' }),
          })
        );
      });

      it('should filter devices by platform', async () => {
        const devices = [createMockDevice({ platform: 'Android' })];
        (prisma.managedDevice.findMany as jest.Mock).mockResolvedValue(devices);

        await mdmService.listDevices('org-123', { platform: 'Android' });

        expect(prisma.managedDevice.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({ platform: 'Android' }),
          })
        );
      });

      it('should filter devices by assigned user', async () => {
        (prisma.managedDevice.findMany as jest.Mock).mockResolvedValue([createMockDevice()]);

        await mdmService.listDevices('org-123', { assignedUserId: 'user-001' });

        expect(prisma.managedDevice.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({ assignedUserId: 'user-001' }),
          })
        );
      });

      it('should support pagination', async () => {
        (prisma.managedDevice.findMany as jest.Mock).mockResolvedValue([]);

        await mdmService.listDevices('org-123', { page: 2, pageSize: 25 });

        expect(prisma.managedDevice.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            skip: 25,
            take: 25,
          })
        );
      });

      it('should use default pagination when not specified', async () => {
        (prisma.managedDevice.findMany as jest.Mock).mockResolvedValue([]);

        await mdmService.listDevices('org-123');

        expect(prisma.managedDevice.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            skip: 0,
            take: 100,
          })
        );
      });
    });

    describe('getDevice()', () => {
      it('should return a device by ID', async () => {
        const mockDevice = createMockDevice();
        (prisma.managedDevice.findFirst as jest.Mock).mockResolvedValue(mockDevice);

        const result = await mdmService.getDevice('device-001', 'org-123');

        expect(result).toBeDefined();
        expect(result?.id).toBe('device-001');
        expect(prisma.managedDevice.findFirst).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { id: 'device-001', organizationId: 'org-123' },
          })
        );
      });

      it('should return null for non-existent device', async () => {
        (prisma.managedDevice.findFirst as jest.Mock).mockResolvedValue(null);

        const result = await mdmService.getDevice('nonexistent', 'org-123');

        expect(result).toBeNull();
      });

      it('should include recent actions with device', async () => {
        const mockDevice = createMockDevice();
        (prisma.managedDevice.findFirst as jest.Mock).mockResolvedValue(mockDevice);

        await mdmService.getDevice('device-001', 'org-123');

        expect(prisma.managedDevice.findFirst).toHaveBeenCalledWith(
          expect.objectContaining({
            include: { actions: expect.objectContaining({ take: 10 }) },
          })
        );
      });
    });

    describe('updateDevice()', () => {
      it('should update device fields', async () => {
        const existingDevice = createMockDevice();
        const updatedDevice = { ...existingDevice, deviceName: 'Updated iPhone' };
        (prisma.managedDevice.findFirst as jest.Mock).mockResolvedValue(existingDevice);
        (prisma.managedDevice.update as jest.Mock).mockResolvedValue(updatedDevice);

        const result = await mdmService.updateDevice(
          'device-001',
          'admin-001',
          'org-123',
          { deviceName: 'Updated iPhone' }
        );

        expect(result).toBeDefined();
        expect(result?.deviceName).toBe('Updated iPhone');
        expect(AuditLogger.log).toHaveBeenCalledWith(
          expect.objectContaining({
            action: 'mdm_device.updated',
          })
        );
      });

      it('should return null for non-existent device', async () => {
        (prisma.managedDevice.findFirst as jest.Mock).mockResolvedValue(null);

        const result = await mdmService.updateDevice(
          'nonexistent',
          'admin-001',
          'org-123',
          { deviceName: 'Updated' }
        );

        expect(result).toBeNull();
        expect(prisma.managedDevice.update).not.toHaveBeenCalled();
      });

      it('should update compliance status', async () => {
        const existingDevice = createMockDevice({ compliance: 'Unknown' });
        const updatedDevice = { ...existingDevice, compliance: 'Compliant' };
        (prisma.managedDevice.findFirst as jest.Mock).mockResolvedValue(existingDevice);
        (prisma.managedDevice.update as jest.Mock).mockResolvedValue(updatedDevice);

        const result = await mdmService.updateDevice(
          'device-001',
          'admin-001',
          'org-123',
          { compliance: 'Compliant' }
        );

        expect(result?.compliance).toBe('Compliant');
      });
    });

    describe('unenrollDevice()', () => {
      it('should unenroll (retire) a device', async () => {
        const existingDevice = createMockDevice();
        const retiredDevice = { ...existingDevice, status: 'Retired', compliance: 'Unknown' };
        (prisma.managedDevice.findFirst as jest.Mock).mockResolvedValue(existingDevice);
        (prisma.managedDevice.update as jest.Mock).mockResolvedValue(retiredDevice);

        const result = await mdmService.unenrollDevice('device-001', 'admin-001', 'org-123');

        expect(result).toBeDefined();
        expect(result?.status).toBe('Retired');
        expect(prisma.managedDevice.update).toHaveBeenCalledWith(
          expect.objectContaining({
            data: { status: 'Retired', compliance: 'Unknown' },
          })
        );
        expect(AuditLogger.log).toHaveBeenCalledWith(
          expect.objectContaining({
            action: 'mdm_device.unenrolled',
          })
        );
      });

      it('should return null for non-existent device', async () => {
        (prisma.managedDevice.findFirst as jest.Mock).mockResolvedValue(null);

        const result = await mdmService.unenrollDevice('nonexistent', 'admin-001', 'org-123');

        expect(result).toBeNull();
      });
    });

    describe('deleteDevice()', () => {
      it('should delete a device permanently', async () => {
        const existingDevice = createMockDevice();
        (prisma.managedDevice.findFirst as jest.Mock).mockResolvedValue(existingDevice);
        (prisma.managedDevice.delete as jest.Mock).mockResolvedValue(existingDevice);

        const result = await mdmService.deleteDevice('device-001', 'admin-001', 'org-123');

        expect(result).toBe(true);
        expect(prisma.managedDevice.delete).toHaveBeenCalledWith({ where: { id: 'device-001' } });
        expect(AuditLogger.log).toHaveBeenCalledWith(
          expect.objectContaining({
            action: 'mdm_device.deleted',
          })
        );
      });

      it('should return false for non-existent device', async () => {
        (prisma.managedDevice.findFirst as jest.Mock).mockResolvedValue(null);

        const result = await mdmService.deleteDevice('nonexistent', 'admin-001', 'org-123');

        expect(result).toBe(false);
        expect(prisma.managedDevice.delete).not.toHaveBeenCalled();
      });
    });

    describe('reassignDevice()', () => {
      it('should reassign a device to a new user', async () => {
        const existingDevice = createMockDevice();
        const reassignedDevice = { ...existingDevice, assignedUserId: 'user-002', assignedUserName: 'Jane Doe' };
        (prisma.managedDevice.findFirst as jest.Mock).mockResolvedValue(existingDevice);
        (prisma.managedDevice.update as jest.Mock).mockResolvedValue(reassignedDevice);

        const result = await mdmService.reassignDevice(
          'device-001',
          'admin-001',
          'org-123',
          { newUserId: 'user-002', newUserName: 'Jane Doe', reason: 'Employee transfer' }
        );

        expect(result).toBeDefined();
        expect(result?.assignedUserId).toBe('user-002');
        expect(AuditLogger.log).toHaveBeenCalledWith(
          expect.objectContaining({
            action: 'mdm_device.reassigned',
            metadata: expect.objectContaining({
              previousUserId: 'user-001',
              newUserId: 'user-002',
              reason: 'Employee transfer',
            }),
          })
        );
      });

      it('should return null for non-existent device', async () => {
        (prisma.managedDevice.findFirst as jest.Mock).mockResolvedValue(null);

        const result = await mdmService.reassignDevice(
          'nonexistent',
          'admin-001',
          'org-123',
          { newUserId: 'user-002' }
        );

        expect(result).toBeNull();
      });
    });
  });

  // ===========================================================================
  // Policy CRUD Tests
  // ===========================================================================
  describe('Policy CRUD', () => {
    describe('createPolicy()', () => {
      it('should create a new MDM policy with rules', async () => {
        const mockPolicy = createMockPolicy();
        (prisma.mDMPolicy.create as jest.Mock).mockResolvedValue(mockPolicy);

        const result = await mdmService.createPolicy({
          organizationId: 'org-123',
          name: 'Corporate Security Policy',
          policyType: 'Security',
          platform: ['iOS', 'Android'],
          rules: [
            { id: 'rule-1', ruleType: 'RequireEncryption', parameter: '', value: '', severity: 'Critical', enforcementAction: 'Block' },
          ],
          createdBy: 'admin-001',
        });

        expect(result).toBeDefined();
        expect(result.name).toBe('Corporate Security Policy');
        expect(prisma.mDMPolicy.create).toHaveBeenCalled();
        expect(AuditLogger.log).toHaveBeenCalledWith(
          expect.objectContaining({
            action: 'mdm_policy.created',
          })
        );
      });

      it('should normalize single platform to array', async () => {
        const mockPolicy = createMockPolicy({ platform: ['iOS'] });
        (prisma.mDMPolicy.create as jest.Mock).mockResolvedValue(mockPolicy);

        await mdmService.createPolicy({
          organizationId: 'org-123',
          name: 'iOS Policy',
          policyType: 'Security',
          platform: 'iOS',
          createdBy: 'admin-001',
        });

        expect(prisma.mDMPolicy.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              platform: ['iOS'],
            }),
          })
        );
      });

      it('should default platform to All when not specified', async () => {
        const mockPolicy = createMockPolicy({ platform: ['All'] });
        (prisma.mDMPolicy.create as jest.Mock).mockResolvedValue(mockPolicy);

        await mdmService.createPolicy({
          organizationId: 'org-123',
          name: 'Universal Policy',
          policyType: 'Security',
          createdBy: 'admin-001',
        });

        expect(prisma.mDMPolicy.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              platform: ['All'],
            }),
          })
        );
      });

      it('should store rules inside settings JSON', async () => {
        const mockPolicy = createMockPolicy();
        (prisma.mDMPolicy.create as jest.Mock).mockResolvedValue(mockPolicy);

        await mdmService.createPolicy({
          organizationId: 'org-123',
          name: 'Test Policy',
          policyType: 'Security',
          rules: [
            { id: 'rule-1', ruleType: 'RequireEncryption', parameter: '', value: '', severity: 'Critical', enforcementAction: 'Block' },
          ],
          createdBy: 'admin-001',
        });

        expect(prisma.mDMPolicy.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              settings: expect.objectContaining({
                rules: expect.arrayContaining([
                  expect.objectContaining({ ruleType: 'RequireEncryption' }),
                ]),
              }),
            }),
          })
        );
      });
    });

    describe('listPolicies()', () => {
      it('should list all policies for an organization', async () => {
        const policies = [createMockPolicy(), createMockPolicy({ id: 'policy-002', name: 'App Policy' })];
        (prisma.mDMPolicy.findMany as jest.Mock).mockResolvedValue(policies);

        const result = await mdmService.listPolicies('org-123');

        expect(result).toHaveLength(2);
      });

      it('should filter by policy type', async () => {
        (prisma.mDMPolicy.findMany as jest.Mock).mockResolvedValue([]);

        await mdmService.listPolicies('org-123', { policyType: 'Security' });

        expect(prisma.mDMPolicy.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({ policyType: 'Security' }),
          })
        );
      });

      it('should filter by platform using has operator', async () => {
        (prisma.mDMPolicy.findMany as jest.Mock).mockResolvedValue([]);

        await mdmService.listPolicies('org-123', { platform: 'iOS' });

        expect(prisma.mDMPolicy.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({ platform: { has: 'iOS' } }),
          })
        );
      });

      it('should filter by enforced status', async () => {
        (prisma.mDMPolicy.findMany as jest.Mock).mockResolvedValue([]);

        await mdmService.listPolicies('org-123', { enforced: true });

        expect(prisma.mDMPolicy.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({ enforced: true }),
          })
        );
      });

      it('should order by priority then by creation date', async () => {
        (prisma.mDMPolicy.findMany as jest.Mock).mockResolvedValue([]);

        await mdmService.listPolicies('org-123');

        expect(prisma.mDMPolicy.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
          })
        );
      });
    });

    describe('getPolicy()', () => {
      it('should return a policy by ID', async () => {
        const mockPolicy = createMockPolicy();
        (prisma.mDMPolicy.findFirst as jest.Mock).mockResolvedValue(mockPolicy);

        const result = await mdmService.getPolicy('policy-001', 'org-123');

        expect(result).toBeDefined();
        expect(result?.id).toBe('policy-001');
      });

      it('should return null for non-existent policy', async () => {
        (prisma.mDMPolicy.findFirst as jest.Mock).mockResolvedValue(null);

        const result = await mdmService.getPolicy('nonexistent', 'org-123');

        expect(result).toBeNull();
      });
    });

    describe('updatePolicy()', () => {
      it('should update policy fields', async () => {
        const existingPolicy = createMockPolicy();
        const updatedPolicy = { ...existingPolicy, name: 'Updated Policy' };
        (prisma.mDMPolicy.findFirst as jest.Mock).mockResolvedValue(existingPolicy);
        (prisma.mDMPolicy.update as jest.Mock).mockResolvedValue(updatedPolicy);

        const result = await mdmService.updatePolicy(
          'policy-001',
          'admin-001',
          'org-123',
          { name: 'Updated Policy' }
        );

        expect(result?.name).toBe('Updated Policy');
        expect(AuditLogger.log).toHaveBeenCalledWith(
          expect.objectContaining({
            action: 'mdm_policy.updated',
          })
        );
      });

      it('should set status to Active when enforced is true', async () => {
        const existingPolicy = createMockPolicy({ enforced: false, status: 'Inactive' });
        const updatedPolicy = { ...existingPolicy, enforced: true, status: 'Active' };
        (prisma.mDMPolicy.findFirst as jest.Mock).mockResolvedValue(existingPolicy);
        (prisma.mDMPolicy.update as jest.Mock).mockResolvedValue(updatedPolicy);

        await mdmService.updatePolicy(
          'policy-001',
          'admin-001',
          'org-123',
          { enforced: true }
        );

        expect(prisma.mDMPolicy.update).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              enforced: true,
              status: 'Active',
            }),
          })
        );
      });

      it('should set status to Inactive when enforced is false', async () => {
        const existingPolicy = createMockPolicy({ enforced: true, status: 'Active' });
        const updatedPolicy = { ...existingPolicy, enforced: false, status: 'Inactive' };
        (prisma.mDMPolicy.findFirst as jest.Mock).mockResolvedValue(existingPolicy);
        (prisma.mDMPolicy.update as jest.Mock).mockResolvedValue(updatedPolicy);

        await mdmService.updatePolicy(
          'policy-001',
          'admin-001',
          'org-123',
          { enforced: false }
        );

        expect(prisma.mDMPolicy.update).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              enforced: false,
              status: 'Inactive',
            }),
          })
        );
      });

      it('should return null for non-existent policy', async () => {
        (prisma.mDMPolicy.findFirst as jest.Mock).mockResolvedValue(null);

        const result = await mdmService.updatePolicy(
          'nonexistent',
          'admin-001',
          'org-123',
          { name: 'Updated' }
        );

        expect(result).toBeNull();
      });
    });

    describe('deletePolicy()', () => {
      it('should delete a policy', async () => {
        const existingPolicy = createMockPolicy();
        (prisma.mDMPolicy.findFirst as jest.Mock).mockResolvedValue(existingPolicy);
        (prisma.mDMPolicy.delete as jest.Mock).mockResolvedValue(existingPolicy);

        const result = await mdmService.deletePolicy('policy-001', 'admin-001', 'org-123');

        expect(result).toBe(true);
        expect(AuditLogger.log).toHaveBeenCalledWith(
          expect.objectContaining({
            action: 'mdm_policy.deleted',
          })
        );
      });

      it('should return false for non-existent policy', async () => {
        (prisma.mDMPolicy.findFirst as jest.Mock).mockResolvedValue(null);

        const result = await mdmService.deletePolicy('nonexistent', 'admin-001', 'org-123');

        expect(result).toBe(false);
      });
    });
  });

  // ===========================================================================
  // Device Action Tests
  // ===========================================================================
  describe('Device Actions', () => {
    describe('executeAction()', () => {
      it('should execute a lock action', async () => {
        const mockDevice = createMockDevice();
        const mockAction = createMockDeviceAction({ actionType: 'Lock' });
        (prisma.managedDevice.findFirst as jest.Mock).mockResolvedValue(mockDevice);
        (prisma.deviceAction.create as jest.Mock).mockResolvedValue(mockAction);
        (prisma.deviceAction.update as jest.Mock).mockResolvedValue({ ...mockAction, status: 'Completed' });
        (prisma.managedDevice.update as jest.Mock).mockResolvedValue({ ...mockDevice, passcodeSet: true });
        (prisma.deviceAction.findUnique as jest.Mock).mockResolvedValue({ ...mockAction, status: 'Completed' });

        const result = await mdmService.executeAction({
          organizationId: 'org-123',
          deviceId: 'device-001',
          actionType: 'Lock',
          initiatedBy: 'admin-001',
        });

        expect(result).toBeDefined();
        expect(result.actionType).toBe('Lock');
        expect(AuditLogger.log).toHaveBeenCalledWith(
          expect.objectContaining({
            action: 'mdm_device_action.created',
          })
        );
      });

      it('should execute a wipe action', async () => {
        const mockDevice = createMockDevice();
        const mockAction = createMockDeviceAction({ actionType: 'Wipe' });
        (prisma.managedDevice.findFirst as jest.Mock).mockResolvedValue(mockDevice);
        (prisma.deviceAction.create as jest.Mock).mockResolvedValue(mockAction);
        (prisma.deviceAction.update as jest.Mock).mockResolvedValue({ ...mockAction, status: 'Completed' });
        (prisma.managedDevice.update as jest.Mock).mockResolvedValue({ ...mockDevice, status: 'Wiped' });
        (prisma.deviceAction.findUnique as jest.Mock).mockResolvedValue({ ...mockAction, status: 'Completed' });

        const result = await mdmService.executeAction({
          organizationId: 'org-123',
          deviceId: 'device-001',
          action: 'Wipe', // Using 'action' instead of 'actionType'
          initiatedBy: 'admin-001',
        });

        expect(result).toBeDefined();
      });

      it('should throw error for non-existent device', async () => {
        (prisma.managedDevice.findFirst as jest.Mock).mockResolvedValue(null);

        await expect(
          mdmService.executeAction({
            organizationId: 'org-123',
            deviceId: 'nonexistent',
            actionType: 'Lock',
            initiatedBy: 'admin-001',
          })
        ).rejects.toThrow('Device not found');
      });

      it('should use userId when initiatedBy is not provided', async () => {
        const mockDevice = createMockDevice();
        const mockAction = createMockDeviceAction();
        (prisma.managedDevice.findFirst as jest.Mock).mockResolvedValue(mockDevice);
        (prisma.deviceAction.create as jest.Mock).mockResolvedValue(mockAction);
        (prisma.deviceAction.update as jest.Mock).mockResolvedValue(mockAction);
        (prisma.deviceAction.findUnique as jest.Mock).mockResolvedValue(mockAction);

        await mdmService.executeAction({
          organizationId: 'org-123',
          deviceId: 'device-001',
          actionType: 'Lock',
          userId: 'user-alt-001',
        });

        expect(prisma.deviceAction.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              initiatedBy: 'user-alt-001',
            }),
          })
        );
      });
    });

    describe('listActions()', () => {
      it('should list all device actions for an organization', async () => {
        const actions = [createMockDeviceAction(), createMockDeviceAction({ id: 'action-002' })];
        (prisma.deviceAction.findMany as jest.Mock).mockResolvedValue(actions);

        const result = await mdmService.listActions('org-123');

        expect(result).toHaveLength(2);
      });

      it('should filter by device ID', async () => {
        (prisma.deviceAction.findMany as jest.Mock).mockResolvedValue([]);

        await mdmService.listActions('org-123', { deviceId: 'device-001' });

        expect(prisma.deviceAction.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({ deviceId: 'device-001' }),
          })
        );
      });

      it('should filter by action type', async () => {
        (prisma.deviceAction.findMany as jest.Mock).mockResolvedValue([]);

        await mdmService.listActions('org-123', { actionType: 'Lock' });

        expect(prisma.deviceAction.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({ actionType: 'Lock' }),
          })
        );
      });

      it('should filter by status', async () => {
        (prisma.deviceAction.findMany as jest.Mock).mockResolvedValue([]);

        await mdmService.listActions('org-123', { status: 'Pending' });

        expect(prisma.deviceAction.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({ status: 'Pending' }),
          })
        );
      });
    });

    describe('bulkDeviceAction()', () => {
      it('should execute action on multiple devices', async () => {
        const mockDevice1 = createMockDevice({ id: 'device-001', deviceName: 'Device 1' });
        const mockDevice2 = createMockDevice({ id: 'device-002', deviceName: 'Device 2' });
        const mockAction = createMockDeviceAction();

        (prisma.managedDevice.findFirst as jest.Mock)
          .mockResolvedValueOnce(mockDevice1)
          .mockResolvedValueOnce(mockDevice2);
        (prisma.managedDevice.findUnique as jest.Mock)
          .mockResolvedValueOnce(mockDevice1)
          .mockResolvedValueOnce(mockDevice2);
        (prisma.deviceAction.create as jest.Mock).mockResolvedValue(mockAction);
        (prisma.deviceAction.update as jest.Mock).mockResolvedValue(mockAction);
        (prisma.deviceAction.findUnique as jest.Mock).mockResolvedValue(mockAction);

        const result = await mdmService.bulkDeviceAction({
          organizationId: 'org-123',
          deviceIds: ['device-001', 'device-002'],
          actionType: 'Lock',
          initiatedBy: 'admin-001',
        });

        expect(result.totalDevices).toBe(2);
        expect(result.successful).toBe(2);
        expect(result.failed).toBe(0);
        expect(AuditLogger.log).toHaveBeenCalledWith(
          expect.objectContaining({
            action: 'mdm_device_action.bulk_executed',
          })
        );
      });

      it('should handle partial failures', async () => {
        const mockDevice = createMockDevice({ id: 'device-001' });
        const mockAction = createMockDeviceAction();

        (prisma.managedDevice.findFirst as jest.Mock)
          .mockResolvedValueOnce(mockDevice)
          .mockResolvedValueOnce(null); // Second device not found
        (prisma.managedDevice.findUnique as jest.Mock).mockResolvedValue(mockDevice);
        (prisma.deviceAction.create as jest.Mock).mockResolvedValue(mockAction);
        (prisma.deviceAction.update as jest.Mock).mockResolvedValue(mockAction);
        (prisma.deviceAction.findUnique as jest.Mock).mockResolvedValue(mockAction);

        const result = await mdmService.bulkDeviceAction({
          organizationId: 'org-123',
          deviceIds: ['device-001', 'device-002'],
          actionType: 'Lock',
          initiatedBy: 'admin-001',
        });

        expect(result.successful).toBe(1);
        expect(result.failed).toBe(1);
        expect(result.results.find(r => r.deviceId === 'device-002')?.error).toBeDefined();
      });
    });
  });

  // ===========================================================================
  // Compliance Tests
  // ===========================================================================
  describe('Compliance', () => {
    describe('getComplianceStatus()', () => {
      it('should calculate compliance status correctly', async () => {
        const devices = [
          createMockDevice({ compliance: 'Compliant' }),
          createMockDevice({ id: 'device-002', compliance: 'Compliant' }),
          createMockDevice({ id: 'device-003', compliance: 'NonCompliant' }),
          createMockDevice({ id: 'device-004', compliance: 'Unknown' }),
        ];
        (prisma.managedDevice.findMany as jest.Mock).mockResolvedValue(devices);

        const result = await mdmService.getComplianceStatus('org-123');

        expect(result.total).toBe(4);
        expect(result.compliant).toBe(2);
        expect(result.nonCompliant).toBe(1);
        expect(result.unknown).toBe(1);
        expect(result.complianceRate).toBe(50);
      });

      it('should exclude retired and wiped devices', async () => {
        (prisma.managedDevice.findMany as jest.Mock).mockResolvedValue([]);

        await mdmService.getComplianceStatus('org-123');

        expect(prisma.managedDevice.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              status: { notIn: ['Retired', 'Wiped'] },
            }),
          })
        );
      });

      it('should return 0% compliance when no devices exist', async () => {
        (prisma.managedDevice.findMany as jest.Mock).mockResolvedValue([]);

        const result = await mdmService.getComplianceStatus('org-123');

        expect(result.total).toBe(0);
        expect(result.complianceRate).toBe(0);
      });
    });

    describe('runComplianceCheck()', () => {
      it('should run compliance check against policies', async () => {
        const mockDevice = createMockDevice({ encryptionEnabled: true, passcodeSet: true });
        const mockPolicy = createMockPolicy();
        const mockCheck = { id: 'check-001', deviceId: 'device-001', checkType: 'FullCompliance', passed: true, checkedAt: new Date() };

        (prisma.managedDevice.findFirst as jest.Mock).mockResolvedValue(mockDevice);
        (prisma.mDMPolicy.findMany as jest.Mock).mockResolvedValue([mockPolicy]);
        (prisma.deviceComplianceCheck.create as jest.Mock).mockResolvedValue(mockCheck);
        (prisma.managedDevice.update as jest.Mock).mockResolvedValue({ ...mockDevice, compliance: 'Compliant' });

        const result = await mdmService.runComplianceCheck('device-001', 'org-123', 'admin-001');

        expect(result.complianceStatus).toBe('Compliant');
        expect(result.compliancePercentage).toBe(100);
        expect(AuditLogger.log).toHaveBeenCalledWith(
          expect.objectContaining({
            action: 'mdm_compliance_check.completed',
          })
        );
      });

      it('should identify non-compliant device with violations', async () => {
        const mockDevice = createMockDevice({ encryptionEnabled: false, passcodeSet: false });
        const mockPolicy = createMockPolicy();
        const mockCheck = { id: 'check-001', deviceId: 'device-001', checkType: 'FullCompliance', passed: false, checkedAt: new Date() };

        (prisma.managedDevice.findFirst as jest.Mock).mockResolvedValue(mockDevice);
        (prisma.mDMPolicy.findMany as jest.Mock).mockResolvedValue([mockPolicy]);
        (prisma.deviceComplianceCheck.create as jest.Mock).mockResolvedValue(mockCheck);
        (prisma.managedDevice.update as jest.Mock).mockResolvedValue({ ...mockDevice, compliance: 'NonCompliant' });

        const result = await mdmService.runComplianceCheck('device-001', 'org-123', 'admin-001');

        expect(result.complianceStatus).toBe('NonCompliant');
        expect(result.nonCompliantRules).toBeGreaterThan(0);
        expect(result.criticalViolations).toBeGreaterThan(0);
      });

      it('should throw error for non-existent device', async () => {
        (prisma.managedDevice.findFirst as jest.Mock).mockResolvedValue(null);

        await expect(
          mdmService.runComplianceCheck('nonexistent', 'org-123', 'admin-001')
        ).rejects.toThrow('Device not found');
      });

      it('should return 100% compliance when no policies exist', async () => {
        const mockDevice = createMockDevice();
        const mockCheck = { id: 'check-001', deviceId: 'device-001', checkType: 'FullCompliance', passed: true, checkedAt: new Date() };

        (prisma.managedDevice.findFirst as jest.Mock).mockResolvedValue(mockDevice);
        (prisma.mDMPolicy.findMany as jest.Mock).mockResolvedValue([]);
        (prisma.deviceComplianceCheck.create as jest.Mock).mockResolvedValue(mockCheck);
        (prisma.managedDevice.update as jest.Mock).mockResolvedValue({ ...mockDevice, compliance: 'Compliant' });

        const result = await mdmService.runComplianceCheck('device-001', 'org-123', 'admin-001');

        expect(result.compliancePercentage).toBe(100);
        expect(result.totalRules).toBe(0);
      });

      it('should evaluate different rule types correctly', async () => {
        const mockDevice = createMockDevice({
          encryptionEnabled: true,
          passcodeSet: true,
          firewallEnabled: false,
          antivirusInstalled: false,
          jailbroken: true,
        });
        const mockPolicy = createMockPolicy({
          settings: {
            rules: [
              { id: 'r1', ruleType: 'RequireEncryption', parameter: '', value: '', severity: 'Critical', enforcementAction: 'Block' },
              { id: 'r2', ruleType: 'RequirePasscode', parameter: '', value: '', severity: 'High', enforcementAction: 'Warn' },
              { id: 'r3', ruleType: 'RequireFirewall', parameter: '', value: '', severity: 'High', enforcementAction: 'Warn' },
              { id: 'r4', ruleType: 'RequireAntivirus', parameter: '', value: '', severity: 'High', enforcementAction: 'Warn' },
              { id: 'r5', ruleType: 'BlockJailbreak', parameter: '', value: '', severity: 'Critical', enforcementAction: 'Wipe' },
            ],
          },
        });
        const mockCheck = { id: 'check-001', deviceId: 'device-001', checkType: 'FullCompliance', passed: false, checkedAt: new Date() };

        (prisma.managedDevice.findFirst as jest.Mock).mockResolvedValue(mockDevice);
        (prisma.mDMPolicy.findMany as jest.Mock).mockResolvedValue([mockPolicy]);
        (prisma.deviceComplianceCheck.create as jest.Mock).mockResolvedValue(mockCheck);
        (prisma.managedDevice.update as jest.Mock).mockResolvedValue(mockDevice);

        const result = await mdmService.runComplianceCheck('device-001', 'org-123', 'admin-001');

        expect(result.totalRules).toBe(5);
        expect(result.compliantRules).toBe(2); // Encryption and Passcode pass
        expect(result.nonCompliantRules).toBe(3); // Firewall, Antivirus, Jailbreak fail
      });
    });
  });

  // ===========================================================================
  // Dashboard Tests
  // ===========================================================================
  describe('Dashboard', () => {
    describe('getDashboard()', () => {
      it('should return comprehensive dashboard data', async () => {
        // Mock all the count and findMany calls
        (prisma.managedDevice.count as jest.Mock)
          .mockResolvedValueOnce(100) // total
          .mockResolvedValueOnce(5)   // enrolled
          .mockResolvedValueOnce(80)  // active
          .mockResolvedValueOnce(10)  // nonCompliant status
          .mockResolvedValueOnce(2)   // lost
          .mockResolvedValueOnce(8)   // retired
          .mockResolvedValueOnce(5)   // wiped
          .mockResolvedValueOnce(70)  // compliant
          .mockResolvedValueOnce(15)  // nonCompliant compliance
          .mockResolvedValueOnce(5)   // unknown
          .mockResolvedValueOnce(10)  // pending
          .mockResolvedValueOnce(85)  // encryption
          .mockResolvedValueOnce(75)  // firewall
          .mockResolvedValueOnce(80)  // antivirus
          .mockResolvedValueOnce(90)  // autoUpdate
          .mockResolvedValueOnce(95)  // passcode
          .mockResolvedValueOnce(3);  // jailbroken

        (prisma.managedDevice.findMany as jest.Mock).mockResolvedValue([
          { platform: 'iOS', deviceType: 'Mobile' },
          { platform: 'iOS', deviceType: 'Tablet' },
          { platform: 'Android', deviceType: 'Mobile' },
        ]);

        (prisma.mDMPolicy.count as jest.Mock)
          .mockResolvedValueOnce(10)  // total policies
          .mockResolvedValueOnce(8);  // enforced policies

        (prisma.mDMPolicy.findMany as jest.Mock).mockResolvedValue([
          { policyType: 'Security' },
          { policyType: 'Security' },
          { policyType: 'AppManagement' },
        ]);

        (prisma.deviceAction.findMany as jest.Mock).mockResolvedValue([
          { id: 'action-001', actionType: 'Lock', status: 'Completed', createdAt: new Date(), device: { deviceName: 'Test Device' } },
        ]);

        const result = await mdmService.getDashboard('org-123');

        expect(result.deviceStats).toBeDefined();
        expect(result.deviceStats.total).toBe(100);
        expect(result.complianceOverview).toBeDefined();
        expect(result.platformDistribution).toBeDefined();
        expect(result.deviceTypeDistribution).toBeDefined();
        expect(result.securityPosture).toBeDefined();
        expect(result.policyStats).toBeDefined();
        expect(result.recentActions).toBeDefined();
      });

      it('should calculate compliance rate correctly', async () => {
        (prisma.managedDevice.count as jest.Mock)
          .mockResolvedValueOnce(100)
          .mockResolvedValueOnce(0)
          .mockResolvedValueOnce(90)
          .mockResolvedValueOnce(0)
          .mockResolvedValueOnce(0)
          .mockResolvedValueOnce(10)
          .mockResolvedValueOnce(0)
          .mockResolvedValueOnce(80)  // compliant
          .mockResolvedValueOnce(10)  // nonCompliant
          .mockResolvedValueOnce(0)
          .mockResolvedValueOnce(0)
          .mockResolvedValueOnce(0)
          .mockResolvedValueOnce(0)
          .mockResolvedValueOnce(0)
          .mockResolvedValueOnce(0)
          .mockResolvedValueOnce(0)
          .mockResolvedValueOnce(0);

        (prisma.managedDevice.findMany as jest.Mock).mockResolvedValue([]);
        (prisma.mDMPolicy.count as jest.Mock).mockResolvedValue(0);
        (prisma.mDMPolicy.findMany as jest.Mock).mockResolvedValue([]);
        (prisma.deviceAction.findMany as jest.Mock).mockResolvedValue([]);

        const result = await mdmService.getDashboard('org-123');

        // 80 compliant out of 90 active devices = 89%
        expect(result.complianceOverview.complianceRate).toBe(89);
      });

      it('should handle empty organization', async () => {
        (prisma.managedDevice.count as jest.Mock).mockResolvedValue(0);
        (prisma.managedDevice.findMany as jest.Mock).mockResolvedValue([]);
        (prisma.mDMPolicy.count as jest.Mock).mockResolvedValue(0);
        (prisma.mDMPolicy.findMany as jest.Mock).mockResolvedValue([]);
        (prisma.deviceAction.findMany as jest.Mock).mockResolvedValue([]);

        const result = await mdmService.getDashboard('org-123');

        expect(result.deviceStats.total).toBe(0);
        expect(result.complianceOverview.complianceRate).toBe(0);
      });
    });
  });

  // ===========================================================================
  // Edge Cases and Error Handling
  // ===========================================================================
  describe('Edge Cases', () => {
    describe('OS Version Comparison', () => {
      it('should correctly compare major versions', async () => {
        const mockDevice = createMockDevice({ osVersion: '17.0' });
        const mockPolicy = createMockPolicy({
          settings: {
            rules: [
              { id: 'r1', ruleType: 'RequireOSVersion', parameter: '', value: '16.0', severity: 'High', enforcementAction: 'Warn' },
            ],
          },
        });
        const mockCheck = { id: 'check-001', deviceId: 'device-001', checkType: 'FullCompliance', passed: true, checkedAt: new Date() };

        (prisma.managedDevice.findFirst as jest.Mock).mockResolvedValue(mockDevice);
        (prisma.mDMPolicy.findMany as jest.Mock).mockResolvedValue([mockPolicy]);
        (prisma.deviceComplianceCheck.create as jest.Mock).mockResolvedValue(mockCheck);
        (prisma.managedDevice.update as jest.Mock).mockResolvedValue(mockDevice);

        const result = await mdmService.runComplianceCheck('device-001', 'org-123', 'admin-001');

        expect(result.complianceStatus).toBe('Compliant');
      });

      it('should correctly identify outdated OS version', async () => {
        const mockDevice = createMockDevice({ osVersion: '15.0' });
        const mockPolicy = createMockPolicy({
          settings: {
            rules: [
              { id: 'r1', ruleType: 'RequireOSVersion', parameter: '', value: '16.0', severity: 'High', enforcementAction: 'Warn' },
            ],
          },
        });
        const mockCheck = { id: 'check-001', deviceId: 'device-001', checkType: 'FullCompliance', passed: false, checkedAt: new Date() };

        (prisma.managedDevice.findFirst as jest.Mock).mockResolvedValue(mockDevice);
        (prisma.mDMPolicy.findMany as jest.Mock).mockResolvedValue([mockPolicy]);
        (prisma.deviceComplianceCheck.create as jest.Mock).mockResolvedValue(mockCheck);
        (prisma.managedDevice.update as jest.Mock).mockResolvedValue(mockDevice);

        const result = await mdmService.runComplianceCheck('device-001', 'org-123', 'admin-001');

        expect(result.complianceStatus).toBe('NonCompliant');
      });

      it('should handle null OS version', async () => {
        const mockDevice = createMockDevice({ osVersion: null });
        const mockPolicy = createMockPolicy({
          settings: {
            rules: [
              { id: 'r1', ruleType: 'RequireOSVersion', parameter: '', value: '16.0', severity: 'High', enforcementAction: 'Warn' },
            ],
          },
        });
        const mockCheck = { id: 'check-001', deviceId: 'device-001', checkType: 'FullCompliance', passed: false, checkedAt: new Date() };

        (prisma.managedDevice.findFirst as jest.Mock).mockResolvedValue(mockDevice);
        (prisma.mDMPolicy.findMany as jest.Mock).mockResolvedValue([mockPolicy]);
        (prisma.deviceComplianceCheck.create as jest.Mock).mockResolvedValue(mockCheck);
        (prisma.managedDevice.update as jest.Mock).mockResolvedValue(mockDevice);

        const result = await mdmService.runComplianceCheck('device-001', 'org-123', 'admin-001');

        // Null OS version defaults to '0' which is below minimum
        expect(result.nonCompliantRules).toBeGreaterThan(0);
      });
    });

    describe('Blocked App Detection', () => {
      it('should detect blocked apps', async () => {
        const mockDevice = createMockDevice({ installedApps: ['TikTok', 'Slack', 'Teams'] });
        const mockPolicy = createMockPolicy({
          settings: {
            rules: [
              { id: 'r1', ruleType: 'BlockApp', parameter: '', value: 'TikTok', severity: 'High', enforcementAction: 'Warn' },
            ],
          },
        });
        const mockCheck = { id: 'check-001', deviceId: 'device-001', checkType: 'FullCompliance', passed: false, checkedAt: new Date() };

        (prisma.managedDevice.findFirst as jest.Mock).mockResolvedValue(mockDevice);
        (prisma.mDMPolicy.findMany as jest.Mock).mockResolvedValue([mockPolicy]);
        (prisma.deviceComplianceCheck.create as jest.Mock).mockResolvedValue(mockCheck);
        (prisma.managedDevice.update as jest.Mock).mockResolvedValue(mockDevice);

        const result = await mdmService.runComplianceCheck('device-001', 'org-123', 'admin-001');

        expect(result.complianceStatus).toBe('NonCompliant');
      });

      it('should pass when blocked app is not installed', async () => {
        const mockDevice = createMockDevice({ installedApps: ['Slack', 'Teams'] });
        const mockPolicy = createMockPolicy({
          settings: {
            rules: [
              { id: 'r1', ruleType: 'BlockApp', parameter: '', value: 'TikTok', severity: 'High', enforcementAction: 'Warn' },
            ],
          },
        });
        const mockCheck = { id: 'check-001', deviceId: 'device-001', checkType: 'FullCompliance', passed: true, checkedAt: new Date() };

        (prisma.managedDevice.findFirst as jest.Mock).mockResolvedValue(mockDevice);
        (prisma.mDMPolicy.findMany as jest.Mock).mockResolvedValue([mockPolicy]);
        (prisma.deviceComplianceCheck.create as jest.Mock).mockResolvedValue(mockCheck);
        (prisma.managedDevice.update as jest.Mock).mockResolvedValue(mockDevice);

        const result = await mdmService.runComplianceCheck('device-001', 'org-123', 'admin-001');

        expect(result.complianceStatus).toBe('Compliant');
      });
    });

    describe('Backward Compatibility Aliases', () => {
      it('getDevices should alias to listDevices', async () => {
        (prisma.managedDevice.findMany as jest.Mock).mockResolvedValue([]);

        const result = await mdmService.getDevices('org-123', { status: 'Active' });

        expect(Array.isArray(result)).toBe(true);
        expect(prisma.managedDevice.findMany).toHaveBeenCalled();
      });

      it('getDeviceById should alias to getDevice', async () => {
        const mockDevice = createMockDevice();
        (prisma.managedDevice.findFirst as jest.Mock).mockResolvedValue(mockDevice);

        const result = await mdmService.getDeviceById('device-001', 'org-123');

        expect(result).toBeDefined();
      });

      it('getPolicies should alias to listPolicies', async () => {
        (prisma.mDMPolicy.findMany as jest.Mock).mockResolvedValue([]);

        const result = await mdmService.getPolicies('org-123', { enforced: true });

        expect(Array.isArray(result)).toBe(true);
      });

      it('getPolicyById should alias to getPolicy', async () => {
        const mockPolicy = createMockPolicy();
        (prisma.mDMPolicy.findFirst as jest.Mock).mockResolvedValue(mockPolicy);

        const result = await mdmService.getPolicyById('policy-001', 'org-123');

        expect(result).toBeDefined();
      });

      it('createDeviceAction should alias to executeAction', async () => {
        const mockDevice = createMockDevice();
        const mockAction = createMockDeviceAction();
        (prisma.managedDevice.findFirst as jest.Mock).mockResolvedValue(mockDevice);
        (prisma.deviceAction.create as jest.Mock).mockResolvedValue(mockAction);
        (prisma.deviceAction.update as jest.Mock).mockResolvedValue(mockAction);
        (prisma.deviceAction.findUnique as jest.Mock).mockResolvedValue(mockAction);

        const result = await mdmService.createDeviceAction({
          organizationId: 'org-123',
          deviceId: 'device-001',
          actionType: 'Lock',
          userId: 'admin-001',
        });

        expect(result).toBeDefined();
      });

      it('getDeviceActions should alias to listActions', async () => {
        (prisma.deviceAction.findMany as jest.Mock).mockResolvedValue([]);

        const result = await mdmService.getDeviceActions('org-123', { status: 'Pending' });

        expect(Array.isArray(result)).toBe(true);
      });

      it('checkDeviceCompliance should alias to getComplianceStatus', async () => {
        (prisma.managedDevice.findMany as jest.Mock).mockResolvedValue([]);

        const result = await mdmService.checkDeviceCompliance('org-123');

        expect(result).toHaveProperty('total');
        expect(result).toHaveProperty('complianceRate');
      });

      it('getMDMDashboard should alias to getDashboard', async () => {
        (prisma.managedDevice.count as jest.Mock).mockResolvedValue(0);
        (prisma.managedDevice.findMany as jest.Mock).mockResolvedValue([]);
        (prisma.mDMPolicy.count as jest.Mock).mockResolvedValue(0);
        (prisma.mDMPolicy.findMany as jest.Mock).mockResolvedValue([]);
        (prisma.deviceAction.findMany as jest.Mock).mockResolvedValue([]);

        const result = await mdmService.getMDMDashboard('org-123');

        expect(result).toHaveProperty('deviceStats');
        expect(result).toHaveProperty('complianceOverview');
      });
    });
  });
});
