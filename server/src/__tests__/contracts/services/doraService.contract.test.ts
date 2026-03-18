/**
 * DORA Service Contract Tests
 *
 * Verifies the contract for DORA compliance including ICT risk assessments,
 * incident management, third-party providers, and resilience testing.
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import {
  prismaMock,
  createMockDoraIctRiskAssessment,
  createMockDoraIncident,
  createMockDoraThirdPartyProvider,
} from '../../mocks/prisma';

jest.mock('../../../config/database', () => ({
  __esModule: true,
  default: prismaMock,
}));

jest.mock('../../../config/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

import {
  createICTRiskAssessment,
  listICTRiskAssessments,
  createICTIncident,
  listICTIncidents,
  createThirdPartyProvider,
  listThirdPartyProviders,
  createResilienceTest,
  createInformationRegisterEntry,
} from '../../../services/doraService';

describe('DORAService contract', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // ICT Risk Assessment
  // ---------------------------------------------------------------------------
  describe('createICTRiskAssessment', () => {
    it('should call prisma.dORAICTRiskAssessment.create with correct shape', async () => {
      const mockAssessment = createMockDoraIctRiskAssessment();
      prismaMock.dORAICTRiskAssessment.create.mockResolvedValue(mockAssessment);

      await createICTRiskAssessment({
        organizationId: 'org-123',
        name: 'Q1 ICT Risk Assessment',
        description: 'Quarterly assessment',
      });

      expect(prismaMock.dORAICTRiskAssessment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          organizationId: 'org-123',
          name: 'Q1 ICT Risk Assessment',
          status: 'Draft',
          assessmentDate: expect.any(Date),
        }),
      });
    });

    it('should default scope to organization_wide', async () => {
      prismaMock.dORAICTRiskAssessment.create.mockResolvedValue(
        createMockDoraIctRiskAssessment()
      );

      await createICTRiskAssessment({
        organizationId: 'org-123',
        name: 'Test',
      });

      expect(prismaMock.dORAICTRiskAssessment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          scope: 'organization_wide',
        }),
      });
    });

    it('should default empty arrays for ictAssets, threats, vulnerabilities', async () => {
      prismaMock.dORAICTRiskAssessment.create.mockResolvedValue(
        createMockDoraIctRiskAssessment()
      );

      await createICTRiskAssessment({
        organizationId: 'org-123',
        name: 'Test',
      });

      expect(prismaMock.dORAICTRiskAssessment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          ictAssets: [],
          threats: [],
          vulnerabilities: [],
          riskTreatmentPlan: {},
        }),
      });
    });

    it('should propagate database errors', async () => {
      prismaMock.dORAICTRiskAssessment.create.mockRejectedValue(
        new Error('Database timeout')
      );

      await expect(
        createICTRiskAssessment({
          organizationId: 'org-123',
          name: 'Test',
        })
      ).rejects.toThrow();
    });
  });

  // ---------------------------------------------------------------------------
  // listICTRiskAssessments
  // ---------------------------------------------------------------------------
  describe('listICTRiskAssessments', () => {
    it('should call prisma.dORAICTRiskAssessment.findMany with organization filter', async () => {
      prismaMock.dORAICTRiskAssessment.findMany.mockResolvedValue([]);
      prismaMock.dORAICTRiskAssessment.count.mockResolvedValue(0);

      await listICTRiskAssessments('org-123');

      expect(prismaMock.dORAICTRiskAssessment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organizationId: 'org-123',
          }),
        })
      );
    });

    it('should apply status filter when provided', async () => {
      prismaMock.dORAICTRiskAssessment.findMany.mockResolvedValue([]);
      prismaMock.dORAICTRiskAssessment.count.mockResolvedValue(0);

      await listICTRiskAssessments('org-123', { status: 'completed' });

      expect(prismaMock.dORAICTRiskAssessment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'completed',
          }),
        })
      );
    });
  });

  // ---------------------------------------------------------------------------
  // ICT Incident
  // ---------------------------------------------------------------------------
  describe('createICTIncident', () => {
    it('should call prisma.dORAICTIncident.create with correct shape', async () => {
      prismaMock.dORAICTIncident.create.mockResolvedValue(createMockDoraIncident());

      await createICTIncident({
        organizationId: 'org-123',
        title: 'Ransomware Attack',
        incidentType: 'cyber_attack',
        severity: 'critical',
        description: 'Ransomware detected on production servers',
      });

      expect(prismaMock.dORAICTIncident.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          organizationId: 'org-123',
          title: 'Ransomware Attack',
          severity: 'critical',
          status: 'detected',
          classification: 'major_ict_incident',
          detectedAt: expect.any(Date),
        }),
      });
    });
  });

  // ---------------------------------------------------------------------------
  // Third-Party Provider
  // ---------------------------------------------------------------------------
  describe('createThirdPartyProvider', () => {
    it('should call prisma.dORAThirdPartyProvider.create with correct shape', async () => {
      prismaMock.dORAThirdPartyProvider.create.mockResolvedValue(
        createMockDoraThirdPartyProvider()
      );

      await createThirdPartyProvider({
        organizationId: 'org-123',
        providerName: 'AWS',
        providerType: 'cloud_service',
        criticality: 'critical',
      });

      expect(prismaMock.dORAThirdPartyProvider.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          organizationId: 'org-123',
          name: 'AWS',
          providerType: 'cloud_service',
          status: 'Active',
        }),
      });
    });
  });

  // ---------------------------------------------------------------------------
  // Resilience Testing
  // ---------------------------------------------------------------------------
  describe('createResilienceTest', () => {
    it('should call prisma.dORAResilienceTest.create with correct shape', async () => {
      prismaMock.dORAResilienceTest.create.mockResolvedValue({
        id: 'test-1',
        name: 'TLPT Test',
        testType: 'tlpt',
        status: 'planned',
      });

      await createResilienceTest({
        organizationId: 'org-123',
        testName: 'Annual TLPT',
        testType: 'tlpt',
        scope: 'Full infrastructure',
      });

      expect(prismaMock.dORAResilienceTest.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          organizationId: 'org-123',
          name: 'Annual TLPT',
          testType: 'tlpt',
          status: 'planned',
        }),
      });
    });
  });

  // ---------------------------------------------------------------------------
  // Information Register
  // ---------------------------------------------------------------------------
  describe('createInformationRegisterEntry', () => {
    it('should call prisma.dORAInformationRegister.create with correct shape', async () => {
      prismaMock.dORAInformationRegister.create.mockResolvedValue({
        id: 'reg-1',
        assetName: 'Production DB',
        assetType: 'database',
      });

      await createInformationRegisterEntry({
        organizationId: 'org-123',
        assetName: 'Production DB',
        assetType: 'database',
      });

      expect(prismaMock.dORAInformationRegister.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          organizationId: 'org-123',
          assetName: 'Production DB',
          assetType: 'database',
          status: 'Active',
          owner: 'unassigned',
          classification: 'Internal',
          businessImpact: 'Medium',
        }),
      });
    });
  });
});
