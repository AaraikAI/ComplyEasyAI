/**
 * Azure Service Unit Tests
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { prismaMock } from '../../../mocks/prisma';

// ---------- Mock Azure SDK ----------
const mockSubscriptionGet = jest.fn() as jest.Mock<any>;
const mockResourcesList = jest.fn() as jest.Mock<any>;
const mockResourceGroupsList = jest.fn() as jest.Mock<any>;
const mockAssessmentsList = jest.fn() as jest.Mock<any>;
const mockAlertsList = jest.fn() as jest.Mock<any>;
const mockPolicyAssignmentsList = jest.fn() as jest.Mock<any>;
const mockGraphUsersList = jest.fn() as jest.Mock<any>;

// Named constructor mocks (so we can re-apply implementations in beforeEach)
const MockClientSecretCredential = jest.fn() as jest.Mock<any>;
const MockResourceManagementClient = jest.fn() as jest.Mock<any>;
const MockSubscriptionClient = jest.fn() as jest.Mock<any>;
const MockSecurityCenter = jest.fn() as jest.Mock<any>;
const MockPolicyClient = jest.fn() as jest.Mock<any>;
const MockGraphRbacManagementClient = jest.fn() as jest.Mock<any>;

jest.mock('@azure/identity', () => ({
  __esModule: true,
  ClientSecretCredential: MockClientSecretCredential,
}));

jest.mock('@azure/arm-resources', () => ({
  __esModule: true,
  ResourceManagementClient: MockResourceManagementClient,
}));

jest.mock('@azure/arm-subscriptions', () => ({
  __esModule: true,
  SubscriptionClient: MockSubscriptionClient,
}));

jest.mock('@azure/arm-security', () => ({
  __esModule: true,
  SecurityCenter: MockSecurityCenter,
}));

jest.mock('@azure/arm-policy', () => ({
  __esModule: true,
  PolicyClient: MockPolicyClient,
}));

jest.mock('@azure/graph', () => ({
  __esModule: true,
  GraphRbacManagementClient: MockGraphRbacManagementClient,
}));

jest.mock('../../../../config/database', () => ({
  __esModule: true,
  default: prismaMock,
}));

jest.mock('../../../../config/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

// ---------- Import after mocks ----------
import azureService from '../../../../services/integrations/azureService';

// Helper: create an async iterable from an array
function asyncIterable<T>(items: T[]): AsyncIterable<T> {
  return {
    [Symbol.asyncIterator]() {
      let i = 0;
      return {
        async next() {
          if (i < items.length) return { value: items[i++], done: false };
          return { value: undefined as any, done: true };
        },
      };
    },
  };
}

describe('AzureService', () => {
  const orgId = 'org-123';

  const mockIntegration = {
    id: 'int-1',
    organizationId: orgId,
    provider: 'azure',
    connected: true,
    config: {
      tenantId: 'tenant-abc',
      clientId: 'client-abc',
      clientSecret: 'secret-abc',
      subscriptionId: 'sub-abc',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Re-apply constructor implementations after resetMocks clears them
    MockClientSecretCredential.mockImplementation(() => ({}));
    MockResourceManagementClient.mockImplementation(() => ({
      resources: { list: mockResourcesList },
      resourceGroups: { list: mockResourceGroupsList },
    }));
    MockSubscriptionClient.mockImplementation(() => ({
      subscriptions: { get: mockSubscriptionGet },
    }));
    MockSecurityCenter.mockImplementation(() => ({
      assessments: { list: mockAssessmentsList },
      alerts: { list: mockAlertsList },
    }));
    MockPolicyClient.mockImplementation(() => ({
      policyAssignments: { list: mockPolicyAssignmentsList },
    }));
    MockGraphRbacManagementClient.mockImplementation(() => ({
      users: { list: mockGraphUsersList },
    }));
  });

  // -------------------------------------------------------------------
  // getIntegration
  // -------------------------------------------------------------------
  describe('getIntegration()', () => {
    it('should query prisma for azure integration', async () => {
      prismaMock.integration.findUnique.mockResolvedValue(mockIntegration as any);
      const result = await azureService.getIntegration(orgId);
      expect(result).toBeDefined();
      expect(prismaMock.integration.findUnique).toHaveBeenCalledWith({
        where: {
          organizationId_provider: {
            organizationId: orgId,
            provider: 'azure',
          },
        },
      });
    });
  });

  // -------------------------------------------------------------------
  // validateCredentials
  // -------------------------------------------------------------------
  describe('validateCredentials()', () => {
    const creds = {
      tenantId: 'tenant-abc',
      clientId: 'client-abc',
      clientSecret: 'secret-abc',
      subscriptionId: 'sub-abc',
    };

    it('should return valid: true with subscription name', async () => {
      mockSubscriptionGet.mockResolvedValue({
        displayName: 'My Azure Subscription',
      });

      const result = await azureService.validateCredentials(creds);
      expect(result.valid).toBe(true);
      expect(result.subscriptionName).toBe('My Azure Subscription');
    });

    it('should return valid: false on SDK error', async () => {
      mockSubscriptionGet.mockRejectedValue(new Error('Invalid credentials'));

      const result = await azureService.validateCredentials(creds);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid credentials');
    });
  });

  // -------------------------------------------------------------------
  // getResources
  // -------------------------------------------------------------------
  describe('getResources()', () => {
    it('should throw when integration is not connected', async () => {
      prismaMock.integration.findUnique.mockResolvedValue({
        ...mockIntegration,
        connected: false,
      } as any);

      await expect(azureService.getResources(orgId)).rejects.toThrow(
        'Azure integration not connected',
      );
    });

    it('should throw when credentials are incomplete', async () => {
      prismaMock.integration.findUnique.mockResolvedValue({
        ...mockIntegration,
        config: { tenantId: 'abc' },
      } as any);

      await expect(azureService.getResources(orgId)).rejects.toThrow(
        'Azure credentials incomplete',
      );
    });

    it('should return fetched resources', async () => {
      prismaMock.integration.findUnique.mockResolvedValue(mockIntegration as any);
      prismaMock.integration.update.mockResolvedValue({} as any);

      mockResourcesList.mockReturnValue(
        asyncIterable([
          {
            id: '/subscriptions/sub-abc/rg/test-rg/resources/vm-1',
            name: 'vm-1',
            type: 'Microsoft.Compute/virtualMachines',
            location: 'eastus',
            tags: { env: 'test' },
            provisioningState: 'Succeeded',
          },
        ]),
      );

      const result = await azureService.getResources(orgId);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('vm-1');
    });

    it('should respect the limit parameter', async () => {
      prismaMock.integration.findUnique.mockResolvedValue(mockIntegration as any);
      prismaMock.integration.update.mockResolvedValue({} as any);

      mockResourcesList.mockReturnValue(
        asyncIterable([
          { id: '1', name: 'r1', type: 't', location: 'l' },
          { id: '2', name: 'r2', type: 't', location: 'l' },
          { id: '3', name: 'r3', type: 't', location: 'l' },
        ]),
      );

      const result = await azureService.getResources(orgId, undefined, 2);
      expect(result).toHaveLength(2);
    });

    it('should throw auth error on 401', async () => {
      prismaMock.integration.findUnique.mockResolvedValue(mockIntegration as any);
      const error: any = new Error('Auth failed');
      error.statusCode = 401;
      mockResourcesList.mockReturnValue(
        (async function* () {
          throw error;
        })(),
      );

      await expect(azureService.getResources(orgId)).rejects.toThrow(
        'Authentication failed',
      );
    });
  });

  // -------------------------------------------------------------------
  // getResourceGroups
  // -------------------------------------------------------------------
  describe('getResourceGroups()', () => {
    it('should return resource groups', async () => {
      prismaMock.integration.findUnique.mockResolvedValue(mockIntegration as any);
      mockResourceGroupsList.mockReturnValue(
        asyncIterable([
          { id: 'rg-1', name: 'test-rg', location: 'eastus', properties: { provisioningState: 'Succeeded' } },
        ]),
      );

      const result = await azureService.getResourceGroups(orgId);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('test-rg');
    });
  });

  // -------------------------------------------------------------------
  // getSecurityRecommendations
  // -------------------------------------------------------------------
  describe('getSecurityRecommendations()', () => {
    it('should return security recommendations', async () => {
      prismaMock.integration.findUnique.mockResolvedValue(mockIntegration as any);
      mockAssessmentsList.mockReturnValue(
        asyncIterable([
          {
            id: 'assess-1',
            name: 'MFA recommendation',
            displayName: 'Enable MFA',
            metadata: { severity: 'High', description: 'Enable MFA for all accounts' },
            status: { code: 'Unhealthy' },
            resourceDetails: { source: '/subscriptions/sub-abc' },
          },
        ]),
      );

      const result = await azureService.getSecurityRecommendations(orgId);
      expect(result).toHaveLength(1);
      expect(result[0].severity).toBe('High');
    });

    it('should return empty array when Security Center is not enabled', async () => {
      prismaMock.integration.findUnique.mockResolvedValue(mockIntegration as any);
      const error: any = new Error('Not found');
      error.statusCode = 404;
      mockAssessmentsList.mockReturnValue(
        (async function* () {
          throw error;
        })(),
      );

      const result = await azureService.getSecurityRecommendations(orgId);
      expect(result).toEqual([]);
    });
  });

  // -------------------------------------------------------------------
  // getSecurityAlerts
  // -------------------------------------------------------------------
  describe('getSecurityAlerts()', () => {
    it('should return security alerts', async () => {
      prismaMock.integration.findUnique.mockResolvedValue(mockIntegration as any);
      mockAlertsList.mockReturnValue(
        asyncIterable([
          {
            id: 'alert-1',
            alertDisplayName: 'Suspicious activity',
            severity: 'High',
            status: 'Active',
            description: 'Unusual login detected',
            alertType: 'Security',
          },
        ]),
      );

      const result = await azureService.getSecurityAlerts(orgId);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Suspicious activity');
    });
  });

  // -------------------------------------------------------------------
  // getPolicyCompliance
  // -------------------------------------------------------------------
  describe('getPolicyCompliance()', () => {
    it('should return policy assignments', async () => {
      prismaMock.integration.findUnique.mockResolvedValue(mockIntegration as any);
      mockPolicyAssignmentsList.mockReturnValue(
        asyncIterable([
          {
            policyDefinitionId: 'policy-def-1',
            displayName: 'Require tags',
            name: 'require-tags',
          },
        ]),
      );

      const result = await azureService.getPolicyCompliance(orgId);
      expect(result).toHaveLength(1);
      expect(result[0].policyDefinitionName).toBe('Require tags');
    });
  });

  // -------------------------------------------------------------------
  // getUsers
  // -------------------------------------------------------------------
  describe('getUsers()', () => {
    it('should return users from Graph API', async () => {
      prismaMock.integration.findUnique.mockResolvedValue(mockIntegration as any);
      mockGraphUsersList.mockReturnValue(
        asyncIterable([
          {
            objectId: 'user-1',
            displayName: 'John Doe',
            userPrincipalName: 'john@contoso.com',
            accountEnabled: true,
          },
        ]),
      );

      const result = await azureService.getUsers(orgId);
      expect(result).toHaveLength(1);
      expect(result[0].displayName).toBe('John Doe');
    });

    it('should return empty array on 403 (Graph API access denied)', async () => {
      prismaMock.integration.findUnique.mockResolvedValue(mockIntegration as any);
      const error: any = new Error('Forbidden');
      error.statusCode = 403;
      mockGraphUsersList.mockReturnValue(
        (async function* () {
          throw error;
        })(),
      );

      const result = await azureService.getUsers(orgId);
      expect(result).toEqual([]);
    });
  });

  // -------------------------------------------------------------------
  // getSubscriptionDetails
  // -------------------------------------------------------------------
  describe('getSubscriptionDetails()', () => {
    it('should return subscription details', async () => {
      prismaMock.integration.findUnique.mockResolvedValue(mockIntegration as any);
      mockSubscriptionGet.mockResolvedValue({
        subscriptionId: 'sub-abc',
        displayName: 'My Subscription',
        state: 'Enabled',
        tenantId: 'tenant-abc',
        authorizationSource: 'Legacy',
      });

      const result = await azureService.getSubscriptionDetails(orgId);
      expect(result.displayName).toBe('My Subscription');
      expect(result.state).toBe('Enabled');
    });
  });

  // -------------------------------------------------------------------
  // runComplianceScan
  // -------------------------------------------------------------------
  describe('runComplianceScan()', () => {
    it('should aggregate data from all sources', async () => {
      prismaMock.integration.findUnique.mockResolvedValue(mockIntegration as any);
      prismaMock.integration.update.mockResolvedValue({} as any);

      mockResourcesList.mockReturnValue(
        asyncIterable([
          { id: '1', name: 'r1', type: 't', location: 'l' },
        ]),
      );
      mockAssessmentsList.mockReturnValue(asyncIterable([]));
      mockAlertsList.mockReturnValue(asyncIterable([]));
      mockPolicyAssignmentsList.mockReturnValue(asyncIterable([]));

      const result = await azureService.runComplianceScan(orgId);

      expect(result.resources).toBe(1);
      expect(result.securityRecommendations).toBe(0);
      expect(result.securityAlerts).toBe(0);
      expect(result.policyAssignments).toBe(0);
      expect(result.overallRisk).toBe('Low');
      expect(result.scanTimestamp).toBeDefined();
    });

    it('should calculate correct risk levels', async () => {
      prismaMock.integration.findUnique.mockResolvedValue(mockIntegration as any);
      prismaMock.integration.update.mockResolvedValue({} as any);

      mockResourcesList.mockReturnValue(asyncIterable([]));

      // 6 high-severity recommendations
      const highRecs = Array.from({ length: 6 }, (_, i) => ({
        id: `assess-${i}`,
        name: `Rec ${i}`,
        metadata: { severity: 'High', description: `desc ${i}` },
        status: { code: 'Unhealthy' },
      }));
      mockAssessmentsList.mockReturnValue(asyncIterable(highRecs));
      mockAlertsList.mockReturnValue(asyncIterable([]));
      mockPolicyAssignmentsList.mockReturnValue(asyncIterable([]));

      const result = await azureService.runComplianceScan(orgId);
      expect(result.overallRisk).toBe('High');
    });
  });

  // -------------------------------------------------------------------
  // disconnect
  // -------------------------------------------------------------------
  describe('disconnect()', () => {
    it('should update integration to disconnected', async () => {
      (prismaMock.integration as any).updateMany = jest.fn().mockResolvedValue({ count: 1 });

      await azureService.disconnect(orgId);

      expect((prismaMock.integration as any).updateMany).toHaveBeenCalledWith({
        where: { organizationId: orgId, provider: 'azure' },
        data: expect.objectContaining({ connected: false }),
      });
    });

    it('should throw on database error', async () => {
      (prismaMock.integration as any).updateMany = jest
        .fn()
        .mockRejectedValue(new Error('db error'));

      await expect(azureService.disconnect(orgId)).rejects.toThrow(
        'Failed to disconnect Azure integration',
      );
    });
  });
});
