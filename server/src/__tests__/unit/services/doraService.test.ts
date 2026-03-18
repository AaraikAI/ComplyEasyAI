/**
 * DORA Service Unit Tests
 * Comprehensive tests for Digital Operational Resilience Act compliance
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { prismaMock } from '../../mocks/prisma';

// Mock the database - MUST be before importing modules that use it
jest.mock('../../../config/database', () => ({
  __esModule: true,
  default: prismaMock,
}));

// Mock dependencies
jest.mock('../../../config/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

// Import after mocking
import * as doraService from '../../../services/doraService';

// =============================================================================
// Mock Data Factories
// =============================================================================

const createMockICTRiskAssessment = (overrides: Record<string, unknown> = {}) => ({
  id: 'risk-assessment-123',
  organizationId: 'org-123',
  name: 'Q1 2024 ICT Risk Assessment',
  description: 'Quarterly ICT risk assessment',
  scope: 'organization_wide',
  assessorName: 'John Smith',
  status: 'completed',
  riskClassification: 'Medium',
  residualRisk: 'Low',
  ictAssets: [{ name: 'Core Banking', type: 'application', criticality: 'critical' }],
  threats: [{ name: 'Ransomware', likelihood: 4 }],
  vulnerabilities: [{ name: 'Unpatched servers', severity: 'high' }],
  riskTreatmentPlan: { controls: [{ name: 'Patch Management', effectiveness: 'effective' }] },
  assessmentDate: new Date(),
  nextReviewDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
  approvedBy: null,
  approvedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

const createMockICTIncident = (overrides: Record<string, unknown> = {}) => ({
  id: 'incident-123',
  organizationId: 'org-123',
  incidentId: 'INC-1234567890',
  title: 'Ransomware Attempt Detected',
  description: 'Attempted ransomware attack blocked by endpoint protection',
  severity: 'major',
  status: 'contained',
  classification: 'major_ict_incident',
  affectedSystems: ['Email', 'File Server'],
  timeline: [
    { event: 'Incident detected', timestamp: new Date().toISOString(), actor: 'system' },
  ],
  rootCause: 'Phishing email',
  remediationActions: ['Enhanced email filtering'],
  lessonsLearned: ['Need better user awareness training'],
  regulatoryNotified: false,
  notificationDate: null,
  notificationAuthority: null,
  detectedAt: new Date(),
  resolvedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

const createMockThirdPartyProvider = (overrides: Record<string, unknown> = {}) => ({
  id: 'provider-123',
  organizationId: 'org-123',
  name: 'Cloud Provider XYZ',
  providerType: 'cloud_service',
  criticality: 'critical',
  status: 'Active',
  serviceDescription: JSON.stringify(['Cloud hosting', 'Data storage']),
  dataProcessed: ['Customer PII', 'Financial data'],
  locationOfProcessing: 'EU',
  exitStrategy: JSON.stringify({ plan: 'Migration to alternative', transitionPeriod: '90 days' }),
  subcontractors: [],
  alternativeProviders: ['Provider ABC', 'Provider DEF'],
  riskScore: 75,
  complianceStatus: 'compliant',
  lastAuditDate: new Date(),
  nextAuditDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
  concentrationRisk: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

const createMockResilienceTest = (overrides: Record<string, unknown> = {}) => ({
  id: 'test-123',
  organizationId: 'org-123',
  name: 'Annual Penetration Test',
  testType: 'penetration_test',
  scope: 'organization_wide',
  methodology: 'OWASP',
  status: 'planned',
  scenarioDescription: JSON.stringify([{ name: 'External attack simulation' }]),
  participants: [{ name: 'Security Firm XYZ', role: 'tester' }],
  findings: [],
  remediationPlan: [],
  scheduledDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  executedDate: null,
  approvedBy: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

const createMockInformationRegisterEntry = (overrides: Record<string, unknown> = {}) => ({
  id: 'asset-123',
  organizationId: 'org-123',
  assetName: 'Core Banking System',
  assetType: 'application',
  owner: 'IT Department',
  classification: 'Confidential',
  businessImpact: 'Critical',
  dependencies: ['Database Server', 'Payment Gateway'],
  location: 'EU Data Center',
  recoveryTimeObjective: 4,
  recoveryPointObjective: 1,
  status: 'Active',
  metadata: {
    description: 'Main banking application',
    department: 'Operations',
    thirdPartyProvider: 'Cloud Provider XYZ',
  },
  lastReviewDate: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe('DORAService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ===========================================================================
  // ICT Risk Assessment Tests - Articles 6-16
  // ===========================================================================

  describe('ICT Risk Assessment (Articles 6-16)', () => {
    describe('createICTRiskAssessment()', () => {
      it('should create a new ICT risk assessment', async () => {
        const mockAssessment = createMockICTRiskAssessment();
        prismaMock.dORAICTRiskAssessment.create.mockResolvedValue(mockAssessment);

        const result = await doraService.createICTRiskAssessment({
          organizationId: 'org-123',
          name: 'Q1 2024 ICT Risk Assessment',
          description: 'Quarterly assessment',
          scope: 'organization_wide',
        });

        expect(result.name).toBe('Q1 2024 ICT Risk Assessment');
        expect(prismaMock.dORAICTRiskAssessment.create).toHaveBeenCalledTimes(1);
      });

      it('should use default values for optional fields', async () => {
        const mockAssessment = createMockICTRiskAssessment();
        prismaMock.dORAICTRiskAssessment.create.mockResolvedValue(mockAssessment);

        await doraService.createICTRiskAssessment({
          organizationId: 'org-123',
          name: 'Basic Assessment',
        });

        expect(prismaMock.dORAICTRiskAssessment.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              scope: 'organization_wide',
              assessorName: 'unassigned',
              status: 'Draft',
              ictAssets: [],
              threats: [],
              vulnerabilities: [],
            }),
          })
        );
      });
    });

    describe('listICTRiskAssessments()', () => {
      it('should return paginated assessments', async () => {
        const mockAssessments = [createMockICTRiskAssessment()];
        prismaMock.dORAICTRiskAssessment.findMany.mockResolvedValue(mockAssessments);
        prismaMock.dORAICTRiskAssessment.count.mockResolvedValue(1);

        const result = await doraService.listICTRiskAssessments('org-123');

        expect(result.data).toHaveLength(1);
        expect(result.pagination.total).toBe(1);
      });

      it('should filter by status', async () => {
        prismaMock.dORAICTRiskAssessment.findMany.mockResolvedValue([]);
        prismaMock.dORAICTRiskAssessment.count.mockResolvedValue(0);

        await doraService.listICTRiskAssessments('org-123', { status: 'completed' });

        expect(prismaMock.dORAICTRiskAssessment.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              status: 'completed',
            }),
          })
        );
      });

      it('should limit page size to 100', async () => {
        prismaMock.dORAICTRiskAssessment.findMany.mockResolvedValue([]);
        prismaMock.dORAICTRiskAssessment.count.mockResolvedValue(0);

        await doraService.listICTRiskAssessments('org-123', { limit: 500 });

        expect(prismaMock.dORAICTRiskAssessment.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            take: 100, // Capped at 100
          })
        );
      });
    });

    describe('getICTRiskAssessment()', () => {
      it('should return assessment by ID', async () => {
        const mockAssessment = createMockICTRiskAssessment();
        prismaMock.dORAICTRiskAssessment.findFirst.mockResolvedValue(mockAssessment);

        const result = await doraService.getICTRiskAssessment('org-123', 'risk-assessment-123');

        expect(result.id).toBe('risk-assessment-123');
      });

      it('should throw error when assessment not found', async () => {
        prismaMock.dORAICTRiskAssessment.findFirst.mockResolvedValue(null);

        await expect(
          doraService.getICTRiskAssessment('org-123', 'non-existent')
        ).rejects.toThrow('ICT risk assessment not found');
      });
    });

    describe('updateICTRiskAssessment()', () => {
      it('should update assessment', async () => {
        const existing = createMockICTRiskAssessment({ status: 'draft' });
        const updated = { ...existing, status: 'completed' };

        prismaMock.dORAICTRiskAssessment.findFirst.mockResolvedValue(existing);
        prismaMock.dORAICTRiskAssessment.update.mockResolvedValue(updated);

        const result = await doraService.updateICTRiskAssessment('org-123', 'risk-assessment-123', {
          status: 'completed',
        });

        expect(result.status).toBe('completed');
      });

      it('should auto-calculate risk classification from likelihood and impact', async () => {
        const existing = createMockICTRiskAssessment();
        prismaMock.dORAICTRiskAssessment.findFirst.mockResolvedValue(existing);
        prismaMock.dORAICTRiskAssessment.update.mockResolvedValue({ ...existing, riskClassification: 'High' });

        await doraService.updateICTRiskAssessment('org-123', 'risk-assessment-123', {
          likelihood: 4,
          impact: 4,
        });

        expect(prismaMock.dORAICTRiskAssessment.update).toHaveBeenCalled();
      });

      it('should set approvedAt when status changes to approved', async () => {
        const existing = createMockICTRiskAssessment({ status: 'completed', approvedAt: null });
        prismaMock.dORAICTRiskAssessment.findFirst.mockResolvedValue(existing);
        prismaMock.dORAICTRiskAssessment.update.mockResolvedValue({ ...existing, status: 'approved' });

        await doraService.updateICTRiskAssessment('org-123', 'risk-assessment-123', {
          status: 'approved',
          approvedBy: 'Manager',
        });

        expect(prismaMock.dORAICTRiskAssessment.update).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              approvedAt: expect.any(Date),
            }),
          })
        );
      });
    });

    describe('deleteICTRiskAssessment()', () => {
      it('should delete assessment', async () => {
        const existing = createMockICTRiskAssessment();
        prismaMock.dORAICTRiskAssessment.findFirst.mockResolvedValue(existing);
        prismaMock.dORAICTRiskAssessment.delete.mockResolvedValue(existing);

        const result = await doraService.deleteICTRiskAssessment('org-123', 'risk-assessment-123');

        expect(result.success).toBe(true);
        expect(prismaMock.dORAICTRiskAssessment.delete).toHaveBeenCalled();
      });
    });

    describe('scoreICTRiskAssessment()', () => {
      it('should calculate risk score based on threats and vulnerabilities', async () => {
        const mockAssessment = createMockICTRiskAssessment({
          threats: [{ likelihood: 4 }, { likelihood: 3 }],
          vulnerabilities: [{ severity: 'high' }, { severity: 'medium' }],
          riskTreatmentPlan: { controls: [{ effectiveness: 'effective' }] },
        });
        prismaMock.dORAICTRiskAssessment.findFirst.mockResolvedValue(mockAssessment);
        prismaMock.dORAICTRiskAssessment.update.mockResolvedValue({
          ...mockAssessment,
          riskClassification: 'Medium',
        });

        const result = await doraService.scoreICTRiskAssessment('org-123', 'risk-assessment-123');

        expect(result).toHaveProperty('scoring');
        expect(result.scoring).toHaveProperty('threatScore');
        expect(result.scoring).toHaveProperty('vulnerabilityScore');
        expect(result.scoring).toHaveProperty('controlEffectiveness');
      });

      it('should handle empty threats and vulnerabilities', async () => {
        const mockAssessment = createMockICTRiskAssessment({
          threats: [],
          vulnerabilities: [],
          riskTreatmentPlan: {},
        });
        prismaMock.dORAICTRiskAssessment.findFirst.mockResolvedValue(mockAssessment);
        prismaMock.dORAICTRiskAssessment.update.mockResolvedValue(mockAssessment);

        const result = await doraService.scoreICTRiskAssessment('org-123', 'risk-assessment-123');

        expect(result.scoring.threatScore).toBe(3); // Default value
      });
    });
  });

  // ===========================================================================
  // ICT Incident Management Tests - Articles 17-23
  // ===========================================================================

  describe('ICT Incident Management (Articles 17-23)', () => {
    describe('createICTIncident()', () => {
      it('should create a new incident', async () => {
        const mockIncident = createMockICTIncident();
        prismaMock.dORAICTIncident.create.mockResolvedValue(mockIncident);

        const result = await doraService.createICTIncident({
          organizationId: 'org-123',
          title: 'Security Incident',
          incidentType: 'cyber_attack',
          severity: 'major',
        });

        expect(result.title).toBe('Ransomware Attempt Detected');
        expect(prismaMock.dORAICTIncident.create).toHaveBeenCalled();
      });

      it('should auto-classify incident based on severity', async () => {
        const mockIncident = createMockICTIncident({ classification: 'major_ict_incident' });
        prismaMock.dORAICTIncident.create.mockResolvedValue(mockIncident);

        await doraService.createICTIncident({
          organizationId: 'org-123',
          title: 'Critical Incident',
          incidentType: 'data_breach',
          severity: 'critical',
        });

        expect(prismaMock.dORAICTIncident.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              classification: 'major_ict_incident',
            }),
          })
        );
      });

      it('should generate timeline entry on creation', async () => {
        const mockIncident = createMockICTIncident();
        prismaMock.dORAICTIncident.create.mockResolvedValue(mockIncident);

        await doraService.createICTIncident({
          organizationId: 'org-123',
          title: 'New Incident',
          incidentType: 'system_failure',
          reportedBy: 'analyst@company.com',
        });

        expect(prismaMock.dORAICTIncident.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              timeline: expect.arrayContaining([
                expect.objectContaining({
                  event: 'Incident detected',
                }),
              ]),
            }),
          })
        );
      });
    });

    describe('listICTIncidents()', () => {
      it('should return paginated incidents', async () => {
        const mockIncidents = [createMockICTIncident()];
        prismaMock.dORAICTIncident.findMany.mockResolvedValue(mockIncidents);
        prismaMock.dORAICTIncident.count.mockResolvedValue(1);

        const result = await doraService.listICTIncidents('org-123');

        expect(result.data).toHaveLength(1);
      });

      it('should filter by severity and status', async () => {
        prismaMock.dORAICTIncident.findMany.mockResolvedValue([]);
        prismaMock.dORAICTIncident.count.mockResolvedValue(0);

        await doraService.listICTIncidents('org-123', {
          severity: 'critical',
          status: 'detected',
        });

        expect(prismaMock.dORAICTIncident.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              severity: 'critical',
              status: 'detected',
            }),
          })
        );
      });
    });

    describe('updateICTIncident()', () => {
      it('should track status transitions in timeline', async () => {
        const existing = createMockICTIncident({ status: 'detected', timeline: [] });
        const updated = { ...existing, status: 'contained' };

        prismaMock.dORAICTIncident.findFirst.mockResolvedValue(existing);
        prismaMock.dORAICTIncident.update.mockResolvedValue(updated);

        await doraService.updateICTIncident('org-123', 'incident-123', {
          status: 'contained',
        });

        expect(prismaMock.dORAICTIncident.update).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              timeline: expect.arrayContaining([
                expect.objectContaining({
                  event: 'Status changed to contained',
                }),
              ]),
            }),
          })
        );
      });

      it('should set resolvedAt when status becomes recovered or closed', async () => {
        const existing = createMockICTIncident({ status: 'eradicated', resolvedAt: null });
        prismaMock.dORAICTIncident.findFirst.mockResolvedValue(existing);
        prismaMock.dORAICTIncident.update.mockResolvedValue({ ...existing, status: 'recovered' });

        await doraService.updateICTIncident('org-123', 'incident-123', {
          status: 'recovered',
        });

        expect(prismaMock.dORAICTIncident.update).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              resolvedAt: expect.any(Date),
            }),
          })
        );
      });

      it('should re-classify incident when severity changes', async () => {
        const existing = createMockICTIncident({ severity: 'minor', classification: 'minor_incident' });
        prismaMock.dORAICTIncident.findFirst.mockResolvedValue(existing);
        prismaMock.dORAICTIncident.update.mockResolvedValue({ ...existing, severity: 'critical' });

        await doraService.updateICTIncident('org-123', 'incident-123', {
          severity: 'critical',
        });

        expect(prismaMock.dORAICTIncident.update).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              classification: 'major_ict_incident',
            }),
          })
        );
      });
    });

    describe('deleteICTIncident()', () => {
      it('should archive incident instead of hard delete (DORA compliance)', async () => {
        const existing = createMockICTIncident({ timeline: [] });
        prismaMock.dORAICTIncident.findFirst.mockResolvedValue(existing);
        prismaMock.dORAICTIncident.update.mockResolvedValue({ ...existing, status: 'archived' });

        const result = await doraService.deleteICTIncident('org-123', 'incident-123', 'admin@company.com');

        expect(result.success).toBe(true);
        expect(result.message).toContain('archived');
        expect(prismaMock.dORAICTIncident.update).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              status: 'archived',
            }),
          })
        );
      });
    });

    describe('escalateIncident()', () => {
      it('should add escalation to timeline', async () => {
        const existing = createMockICTIncident({ timeline: [] });
        prismaMock.dORAICTIncident.findFirst.mockResolvedValue(existing);
        prismaMock.dORAICTIncident.update.mockResolvedValue(existing);

        await doraService.escalateIncident('org-123', 'incident-123', {
          escalationLevel: 3,
          reason: 'Requires management attention',
          escalatedBy: 'analyst@company.com',
        });

        expect(prismaMock.dORAICTIncident.update).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              timeline: expect.arrayContaining([
                expect.objectContaining({
                  event: 'Escalated to level 3',
                }),
              ]),
            }),
          })
        );
      });

      it('should mark as reported when escalated to regulator level (4+)', async () => {
        const existing = createMockICTIncident({ timeline: [], regulatoryNotified: false });
        prismaMock.dORAICTIncident.findFirst.mockResolvedValue(existing);
        prismaMock.dORAICTIncident.update.mockResolvedValue({ ...existing, regulatoryNotified: true });

        await doraService.escalateIncident('org-123', 'incident-123', {
          escalationLevel: 4,
          reason: 'Major incident - regulatory reporting required',
          escalatedBy: 'ciso@company.com',
        });

        expect(prismaMock.dORAICTIncident.update).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              regulatoryNotified: true,
              notificationDate: expect.any(Date),
              status: 'reported',
            }),
          })
        );
      });
    });
  });

  // ===========================================================================
  // Third-Party Provider Tests - Articles 28-44
  // ===========================================================================

  describe('Third-Party Providers (Articles 28-44)', () => {
    describe('createThirdPartyProvider()', () => {
      it('should create a new provider', async () => {
        const mockProvider = createMockThirdPartyProvider();
        prismaMock.dORAThirdPartyProvider.create.mockResolvedValue(mockProvider);

        const result = await doraService.createThirdPartyProvider({
          organizationId: 'org-123',
          providerName: 'Cloud Provider XYZ',
          providerType: 'cloud_service',
          criticality: 'critical',
        });

        expect(result.name).toBe('Cloud Provider XYZ');
      });

      it('should use default criticality of standard', async () => {
        const mockProvider = createMockThirdPartyProvider({ criticality: 'standard' });
        prismaMock.dORAThirdPartyProvider.create.mockResolvedValue(mockProvider);

        await doraService.createThirdPartyProvider({
          organizationId: 'org-123',
          providerName: 'Standard Provider',
          providerType: 'software_provider',
        });

        expect(prismaMock.dORAThirdPartyProvider.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              criticality: 'standard',
            }),
          })
        );
      });
    });

    describe('listThirdPartyProviders()', () => {
      it('should return paginated providers', async () => {
        const mockProviders = [createMockThirdPartyProvider()];
        prismaMock.dORAThirdPartyProvider.findMany.mockResolvedValue(mockProviders);
        prismaMock.dORAThirdPartyProvider.count.mockResolvedValue(1);

        const result = await doraService.listThirdPartyProviders('org-123');

        expect(result.data).toHaveLength(1);
      });

      it('should filter by criticality', async () => {
        prismaMock.dORAThirdPartyProvider.findMany.mockResolvedValue([]);
        prismaMock.dORAThirdPartyProvider.count.mockResolvedValue(0);

        await doraService.listThirdPartyProviders('org-123', { criticality: 'critical' });

        expect(prismaMock.dORAThirdPartyProvider.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              criticality: 'critical',
            }),
          })
        );
      });
    });

    describe('assessConcentrationRisk()', () => {
      it('should identify high critical provider ratio', async () => {
        const providers = [
          createMockThirdPartyProvider({ criticality: 'critical' }),
          createMockThirdPartyProvider({ id: 'p2', criticality: 'critical' }),
          createMockThirdPartyProvider({ id: 'p3', criticality: 'standard' }),
        ];
        prismaMock.dORAThirdPartyProvider.findMany.mockResolvedValue(providers);

        const result = await doraService.assessConcentrationRisk('org-123');

        expect(result.findings).toContainEqual(
          expect.objectContaining({
            type: 'high_critical_ratio',
          })
        );
      });

      it('should identify single points of failure', async () => {
        const providers = [
          createMockThirdPartyProvider({
            providerType: 'cloud_service',
            criticality: 'critical',
          }),
        ];
        prismaMock.dORAThirdPartyProvider.findMany.mockResolvedValue(providers);

        const result = await doraService.assessConcentrationRisk('org-123');

        expect(result.findings).toContainEqual(
          expect.objectContaining({
            type: 'single_point_of_failure',
            severity: 'critical',
          })
        );
      });

      it('should identify jurisdictional concentration', async () => {
        const providers = [
          createMockThirdPartyProvider({ locationOfProcessing: 'US' }),
          createMockThirdPartyProvider({ id: 'p2', locationOfProcessing: 'US' }),
          createMockThirdPartyProvider({ id: 'p3', locationOfProcessing: 'US' }),
        ];
        prismaMock.dORAThirdPartyProvider.findMany.mockResolvedValue(providers);

        const result = await doraService.assessConcentrationRisk('org-123');

        expect(result.findings).toContainEqual(
          expect.objectContaining({
            type: 'jurisdictional_concentration',
          })
        );
      });

      it('should identify missing exit strategies', async () => {
        const providers = [
          createMockThirdPartyProvider({ exitStrategy: '' }),
          createMockThirdPartyProvider({ id: 'p2', exitStrategy: null }),
        ];
        prismaMock.dORAThirdPartyProvider.findMany.mockResolvedValue(providers);

        const result = await doraService.assessConcentrationRisk('org-123');

        expect(result.findings).toContainEqual(
          expect.objectContaining({
            type: 'missing_exit_strategies',
          })
        );
      });

      it('should return low risk for no providers', async () => {
        prismaMock.dORAThirdPartyProvider.findMany.mockResolvedValue([]);

        const result = await doraService.assessConcentrationRisk('org-123');

        expect(result.overallConcentrationRisk).toBe('low');
        expect(result.recommendations).toContainEqual(
          expect.stringContaining('No active ICT third-party providers')
        );
      });
    });
  });

  // ===========================================================================
  // Resilience Testing Tests - Articles 24-27
  // ===========================================================================

  describe('Resilience Testing (Articles 24-27)', () => {
    describe('createResilienceTest()', () => {
      it('should create a new resilience test', async () => {
        const mockTest = createMockResilienceTest();
        prismaMock.dORAResilienceTest.create.mockResolvedValue(mockTest);

        const result = await doraService.createResilienceTest({
          organizationId: 'org-123',
          testName: 'Annual Penetration Test',
          testType: 'penetration_test',
        });

        expect(result.name).toBe('Annual Penetration Test');
      });

      it('should use TIBER_EU methodology for TLPT tests', async () => {
        const mockTest = createMockResilienceTest({ testType: 'tlpt', methodology: 'TIBER_EU' });
        prismaMock.dORAResilienceTest.create.mockResolvedValue(mockTest);

        await doraService.createResilienceTest({
          organizationId: 'org-123',
          testName: 'TLPT 2024',
          testType: 'tlpt',
        });

        expect(prismaMock.dORAResilienceTest.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              methodology: 'TIBER_EU',
            }),
          })
        );
      });
    });

    describe('executeResilienceTest()', () => {
      it('should transition test to in_progress', async () => {
        const existing = createMockResilienceTest({ status: 'planned', participants: [{ name: 'Tester' }] });
        prismaMock.dORAResilienceTest.findFirst.mockResolvedValue(existing);
        prismaMock.dORAResilienceTest.update.mockResolvedValue({ ...existing, status: 'in_progress' });

        const result = await doraService.executeResilienceTest('org-123', 'test-123', {
          executedBy: 'analyst@company.com',
        });

        expect(result.status).toBe('in_progress');
      });

      it('should throw error if test is not in planned status', async () => {
        const existing = createMockResilienceTest({ status: 'completed' });
        prismaMock.dORAResilienceTest.findFirst.mockResolvedValue(existing);

        await expect(
          doraService.executeResilienceTest('org-123', 'test-123', { executedBy: 'analyst@company.com' })
        ).rejects.toThrow('Cannot execute test in status "completed"');
      });

      it('should require external testers for TLPT per Article 26(8)', async () => {
        const existing = createMockResilienceTest({ testType: 'tlpt', status: 'planned', participants: [] });
        prismaMock.dORAResilienceTest.findFirst.mockResolvedValue(existing);

        await expect(
          doraService.executeResilienceTest('org-123', 'test-123', { executedBy: 'analyst@company.com' })
        ).rejects.toThrow('TLPT requires qualified external testers');
      });

      it('should generate preliminary findings', async () => {
        const existing = createMockResilienceTest({
          status: 'planned',
          participants: [{ name: 'External Tester' }],
          scenarioDescription: JSON.stringify([{ name: 'Attack Scenario 1' }]),
        });
        prismaMock.dORAResilienceTest.findFirst.mockResolvedValue(existing);
        prismaMock.dORAResilienceTest.update.mockResolvedValue({ ...existing, findings: [] });

        await doraService.executeResilienceTest('org-123', 'test-123', {
          executedBy: 'analyst@company.com',
        });

        expect(prismaMock.dORAResilienceTest.update).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              findings: expect.any(Array),
              executedDate: expect.any(Date),
            }),
          })
        );
      });
    });

    describe('listResilienceTests()', () => {
      it('should filter by test type', async () => {
        prismaMock.dORAResilienceTest.findMany.mockResolvedValue([]);
        prismaMock.dORAResilienceTest.count.mockResolvedValue(0);

        await doraService.listResilienceTests('org-123', { testType: 'tlpt' });

        expect(prismaMock.dORAResilienceTest.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              testType: 'tlpt',
            }),
          })
        );
      });
    });
  });

  // ===========================================================================
  // Information Register Tests - Article 28(3)
  // ===========================================================================

  describe('Information Register (Article 28(3))', () => {
    describe('createInformationRegisterEntry()', () => {
      it('should create a new asset entry', async () => {
        const mockEntry = createMockInformationRegisterEntry();
        prismaMock.dORAInformationRegister.create.mockResolvedValue(mockEntry);

        const result = await doraService.createInformationRegisterEntry({
          organizationId: 'org-123',
          assetName: 'Core Banking System',
          assetType: 'application',
          criticality: 'Critical',
        });

        expect(result.assetName).toBe('Core Banking System');
      });

      it('should include RTO/RPO values', async () => {
        const mockEntry = createMockInformationRegisterEntry();
        prismaMock.dORAInformationRegister.create.mockResolvedValue(mockEntry);

        await doraService.createInformationRegisterEntry({
          organizationId: 'org-123',
          assetName: 'Payment Gateway',
          assetType: 'api',
          recoveryTimeObjective: 4,
          recoveryPointObjective: 1,
        });

        expect(prismaMock.dORAInformationRegister.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              recoveryTimeObjective: 4,
              recoveryPointObjective: 1,
            }),
          })
        );
      });
    });

    describe('listInformationRegister()', () => {
      it('should filter by asset type', async () => {
        prismaMock.dORAInformationRegister.findMany.mockResolvedValue([]);
        prismaMock.dORAInformationRegister.count.mockResolvedValue(0);

        await doraService.listInformationRegister('org-123', { assetType: 'database' });

        expect(prismaMock.dORAInformationRegister.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              assetType: 'database',
            }),
          })
        );
      });

      it('should filter by criticality (businessImpact)', async () => {
        prismaMock.dORAInformationRegister.findMany.mockResolvedValue([]);
        prismaMock.dORAInformationRegister.count.mockResolvedValue(0);

        await doraService.listInformationRegister('org-123', { criticality: 'Critical' });

        expect(prismaMock.dORAInformationRegister.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              businessImpact: 'Critical',
            }),
          })
        );
      });
    });
  });

  // ===========================================================================
  // Dashboard & Compliance Scoring Tests
  // ===========================================================================

  describe('Dashboard & Compliance Scoring', () => {
    describe('getDORADashboard()', () => {
      beforeEach(() => {
        // Setup default mocks for all dashboard queries
        prismaMock.dORAICTRiskAssessment.count.mockResolvedValue(5);
        prismaMock.dORAICTIncident.count.mockResolvedValue(10);
        prismaMock.dORAThirdPartyProvider.count.mockResolvedValue(8);
        prismaMock.dORAResilienceTest.count.mockResolvedValue(3);
        prismaMock.dORAInformationRegister.count.mockResolvedValue(20);
        prismaMock.dORAICTIncident.findMany.mockResolvedValue([]);
        prismaMock.dORAResilienceTest.findMany.mockResolvedValue([]);
        prismaMock.dORAICTRiskAssessment.findMany.mockResolvedValue([]);
        prismaMock.dORAThirdPartyProvider.findMany.mockResolvedValue([]);
        prismaMock.dORAInformationRegister.findMany.mockResolvedValue([]);
      });

      it('should return comprehensive dashboard data', async () => {
        const result = await doraService.getDORADashboard('org-123');

        expect(result).toHaveProperty('complianceScore');
        expect(result).toHaveProperty('ictRiskManagement');
        expect(result).toHaveProperty('incidentManagement');
        expect(result).toHaveProperty('thirdPartyRisk');
        expect(result).toHaveProperty('resilienceTesting');
        expect(result).toHaveProperty('informationRegister');
      });

      it('should include recent incidents', async () => {
        const mockIncidents = [createMockICTIncident()];
        prismaMock.dORAICTIncident.findMany.mockResolvedValue(mockIncidents);

        const result = await doraService.getDORADashboard('org-123');

        expect(result.incidentManagement.recentIncidents).toBeDefined();
      });

      it('should include upcoming tests', async () => {
        const mockTests = [createMockResilienceTest()];
        prismaMock.dORAResilienceTest.findMany.mockResolvedValue(mockTests);

        const result = await doraService.getDORADashboard('org-123');

        expect(result.resilienceTesting.upcomingTests).toBeDefined();
      });
    });

    describe('calculateDORAComplianceScore()', () => {
      it('should calculate weighted compliance score', async () => {
        const mockAssessments = [createMockICTRiskAssessment({ status: 'completed' })];
        const mockIncidents = [createMockICTIncident({ status: 'closed', rootCause: 'identified' })];
        const mockProviders = [createMockThirdPartyProvider({ riskScore: 80 })];
        const mockTests = [createMockResilienceTest({ status: 'completed', testType: 'tlpt' })];
        const mockAssets = [createMockInformationRegisterEntry()];

        prismaMock.dORAICTRiskAssessment.findMany.mockResolvedValue(mockAssessments);
        prismaMock.dORAICTIncident.findMany.mockResolvedValue(mockIncidents);
        prismaMock.dORAThirdPartyProvider.findMany.mockResolvedValue(mockProviders);
        prismaMock.dORAResilienceTest.findMany.mockResolvedValue(mockTests);
        prismaMock.dORAInformationRegister.findMany.mockResolvedValue(mockAssets);

        const result = await doraService.calculateDORAComplianceScore('org-123');

        expect(result).toHaveProperty('overallScore');
        expect(result).toHaveProperty('complianceLevel');
        expect(result).toHaveProperty('pillarScores');
        expect(result.overallScore).toBeGreaterThanOrEqual(0);
        expect(result.overallScore).toBeLessThanOrEqual(100);
      });

      it('should return non_compliant for low scores', async () => {
        prismaMock.dORAICTRiskAssessment.findMany.mockResolvedValue([]);
        prismaMock.dORAICTIncident.findMany.mockResolvedValue([]);
        prismaMock.dORAThirdPartyProvider.findMany.mockResolvedValue([]);
        prismaMock.dORAResilienceTest.findMany.mockResolvedValue([]);
        prismaMock.dORAInformationRegister.findMany.mockResolvedValue([]);

        const result = await doraService.calculateDORAComplianceScore('org-123');

        expect(result.complianceLevel).toBe('non_compliant');
      });

      it('should identify missing TLPT tests', async () => {
        prismaMock.dORAICTRiskAssessment.findMany.mockResolvedValue([]);
        prismaMock.dORAICTIncident.findMany.mockResolvedValue([]);
        prismaMock.dORAThirdPartyProvider.findMany.mockResolvedValue([]);
        prismaMock.dORAResilienceTest.findMany.mockResolvedValue([
          createMockResilienceTest({ testType: 'penetration_test', status: 'completed' }),
        ]);
        prismaMock.dORAInformationRegister.findMany.mockResolvedValue([]);

        const result = await doraService.calculateDORAComplianceScore('org-123');

        expect(result.pillarScores.resilienceTesting.details).toContainEqual(
          expect.stringContaining('No completed TLPT found')
        );
      });

      it('should identify unreported major incidents', async () => {
        prismaMock.dORAICTRiskAssessment.findMany.mockResolvedValue([]);
        prismaMock.dORAICTIncident.findMany.mockResolvedValue([
          createMockICTIncident({
            severity: 'critical',
            classification: 'major_ict_incident',
            regulatoryNotified: false,
          }),
        ]);
        prismaMock.dORAThirdPartyProvider.findMany.mockResolvedValue([]);
        prismaMock.dORAResilienceTest.findMany.mockResolvedValue([]);
        prismaMock.dORAInformationRegister.findMany.mockResolvedValue([]);

        const result = await doraService.calculateDORAComplianceScore('org-123');

        expect(result.pillarScores.incidentManagement.details).toContainEqual(
          expect.stringContaining('not reported to authority')
        );
      });

      it('should identify critical providers without exit strategies', async () => {
        prismaMock.dORAICTRiskAssessment.findMany.mockResolvedValue([]);
        prismaMock.dORAICTIncident.findMany.mockResolvedValue([]);
        prismaMock.dORAThirdPartyProvider.findMany.mockResolvedValue([
          createMockThirdPartyProvider({ criticality: 'critical', exitStrategy: '' }),
        ]);
        prismaMock.dORAResilienceTest.findMany.mockResolvedValue([]);
        prismaMock.dORAInformationRegister.findMany.mockResolvedValue([]);

        const result = await doraService.calculateDORAComplianceScore('org-123');

        expect(result.pillarScores.thirdPartyRisk.details).toContainEqual(
          expect.stringContaining('lack exit strategies')
        );
      });
    });
  });

  // ===========================================================================
  // Edge Cases and Error Handling
  // ===========================================================================

  describe('Edge Cases and Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      prismaMock.dORAICTRiskAssessment.create.mockRejectedValue(new Error('Database connection failed'));

      await expect(
        doraService.createICTRiskAssessment({
          organizationId: 'org-123',
          name: 'Test',
        })
      ).rejects.toThrow('Database connection failed');
    });

    it('should throw not found errors correctly', async () => {
      prismaMock.dORAThirdPartyProvider.findFirst.mockResolvedValue(null);

      await expect(
        doraService.getThirdPartyProvider('org-123', 'non-existent')
      ).rejects.toThrow('Third-party provider not found');
    });

    it('should handle empty arrays in calculations', async () => {
      const mockAssessment = createMockICTRiskAssessment({
        threats: [],
        vulnerabilities: [],
        ictAssets: [],
        riskTreatmentPlan: {},
      });
      prismaMock.dORAICTRiskAssessment.findFirst.mockResolvedValue(mockAssessment);
      prismaMock.dORAICTRiskAssessment.update.mockResolvedValue(mockAssessment);

      const result = await doraService.scoreICTRiskAssessment('org-123', 'risk-assessment-123');

      expect(result.scoring.threatScore).toBe(3); // Default
      expect(result.scoring.vulnerabilityScore).toBe(2); // Default
    });
  });
});
