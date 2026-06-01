/**
 * SOX Service Unit Tests
 * Comprehensive tests for Sarbanes-Oxley compliance functionality
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

jest.mock('../../../utils/auditLogger', () => ({
  AuditLogger: {
    log: jest.fn(),
  },
}));

// Import after mocking
import { SOXService } from '../../../services/soxService';
import { AuditLogger } from '../../../utils/auditLogger';

// Create instance
const soxService = new SOXService();

// =============================================================================
// Mock Data Factories
// =============================================================================

const createMockSOXControl = (overrides: Record<string, unknown> = {}) => ({
  id: 'sox-ctrl-123',
  organizationId: 'org-123',
  controlNumber: 'SOX-001',
  title: 'Revenue Recognition Control',
  description: 'Control to ensure proper revenue recognition',
  category: 'TransactionLevel',
  assertion: ['Existence', 'Completeness', 'Valuation'],
  processArea: 'RevenueRecognition',
  controlType: 'Preventive',
  frequency: 'Monthly',
  automationType: 'SemiAutomated',
  owner: 'Finance Manager',
  reviewer: 'Controller',
  materialityThreshold: 100000,
  keyControl: true,
  status: 'NotTested',
  lastTestDate: null,
  nextTestDate: null,
  deficiencyType: null,
  evidence: null,
  walkthrough: null,
  riskOfMaterialMisstatement: 'High',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

const createMockSOXTestResult = (overrides: Record<string, unknown> = {}) => ({
  id: 'test-123',
  controlId: 'sox-ctrl-123',
  testDate: new Date(),
  tester: 'Internal Auditor',
  testType: 'OperatingEffectiveness',
  sampleSize: 25,
  exceptionsFound: 0,
  testProcedure: 'Selected sample of 25 transactions and verified revenue recognition criteria',
  conclusion: 'Effective',
  evidence: { samples: ['TXN-001', 'TXN-002'] },
  deficiencyLevel: null,
  compensatingControls: null,
  managementResponse: null,
  remediationDeadline: null,
  status: 'Draft',
  reviewedBy: null,
  reviewDate: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  control: createMockSOXControl(),
  ...overrides,
});

const createMockSOXAssessment = (overrides: Record<string, unknown> = {}) => ({
  id: 'assessment-123',
  organizationId: 'org-123',
  assessmentYear: 2024,
  assessmentType: 'Section404',
  status: 'InProgress',
  overallConclusion: null,
  scopedProcesses: { processes: ['Revenue', 'Procurement'] },
  materialAccounts: { accounts: ['Cash', 'Receivables', 'Revenue'] },
  significantLocations: { locations: ['US HQ', 'EU Operations'] },
  riskAssessment: { overallRisk: 'Medium' },
  managementCertification: null,
  auditorAttestation: null,
  filingDeadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
  filedDate: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe('SOXService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ===========================================================================
  // SOX Control CRUD Tests
  // ===========================================================================

  describe('SOX Control CRUD', () => {
    describe('createSOXControl()', () => {
      it('should create a new SOX control', async () => {
        const mockControl = createMockSOXControl();
        prismaMock.sOXControl.create.mockResolvedValue(mockControl);

        const result = await soxService.createSOXControl({
          organizationId: 'org-123',
          controlNumber: 'SOX-001',
          title: 'Revenue Recognition Control',
          description: 'Control for revenue recognition',
          category: 'TransactionLevel',
          processArea: 'RevenueRecognition',
          controlType: 'Preventive',
          frequency: 'Monthly',
          owner: 'Finance Manager',
          userId: 'admin-123',
        });

        expect(result.controlNumber).toBe('SOX-001');
        expect(prismaMock.sOXControl.create).toHaveBeenCalledTimes(1);
        expect(AuditLogger.log).toHaveBeenCalledWith(
          expect.objectContaining({
            action: 'sox_control.created',
            resourceType: 'SOXControl',
          })
        );
      });

      it('should normalize assertion to array', async () => {
        const mockControl = createMockSOXControl();
        prismaMock.sOXControl.create.mockResolvedValue(mockControl);

        await soxService.createSOXControl({
          organizationId: 'org-123',
          title: 'Test Control',
          description: 'Test',
          category: 'EntityLevel',
          processArea: 'FinancialClose',
          controlType: 'Detective',
          frequency: 'Quarterly',
          owner: 'Controller',
          assertion: 'Completeness', // Single string
        });

        expect(prismaMock.sOXControl.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              assertion: ['Completeness'], // Converted to array
            }),
          })
        );
      });

      it('should use default values for optional fields', async () => {
        const mockControl = createMockSOXControl();
        prismaMock.sOXControl.create.mockResolvedValue(mockControl);

        await soxService.createSOXControl({
          organizationId: 'org-123',
          title: 'Minimal Control',
          description: 'Minimal',
          category: 'ITGeneral',
          processArea: 'ITOperations',
          controlType: 'Preventive',
          frequency: 'Daily',
          owner: 'IT Manager',
        });

        expect(prismaMock.sOXControl.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              automationType: 'Manual',
              keyControl: false,
              status: 'NotTested',
            }),
          })
        );
      });

      it('should handle legacy field aliases', async () => {
        const mockControl = createMockSOXControl();
        prismaMock.sOXControl.create.mockResolvedValue(mockControl);

        await soxService.createSOXControl({
          organizationId: 'org-123',
          controlId: 'LEGACY-001', // Legacy alias for controlNumber
          title: 'Legacy Control',
          description: 'Test',
          category: 'TransactionLevel',
          processArea: 'Procurement',
          controlType: 'Detective',
          frequency: 'Weekly',
          owner: 'Procurement Manager',
          automationLevel: 'FullyAutomated', // Legacy alias for automationType
          riskLevel: 'Critical', // Legacy alias for riskOfMaterialMisstatement
        });

        expect(prismaMock.sOXControl.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              controlNumber: 'LEGACY-001',
              automationType: 'FullyAutomated',
              riskOfMaterialMisstatement: 'Critical',
            }),
          })
        );
      });
    });

    describe('getSOXControls()', () => {
      it('should return controls for organization', async () => {
        const mockControls = [createMockSOXControl()];
        prismaMock.sOXControl.findMany.mockResolvedValue(mockControls);

        const result = await soxService.getSOXControls('org-123');

        expect(result).toHaveLength(1);
        expect(prismaMock.sOXControl.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { organizationId: 'org-123' },
          })
        );
      });

      it('should filter by category', async () => {
        prismaMock.sOXControl.findMany.mockResolvedValue([]);

        await soxService.getSOXControls('org-123', { category: 'ITGeneral' });

        expect(prismaMock.sOXControl.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              category: 'ITGeneral',
            }),
          })
        );
      });

      it('should filter by processArea', async () => {
        prismaMock.sOXControl.findMany.mockResolvedValue([]);

        await soxService.getSOXControls('org-123', { processArea: 'RevenueRecognition' });

        expect(prismaMock.sOXControl.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              processArea: 'RevenueRecognition',
            }),
          })
        );
      });

      it('should filter by keyControl', async () => {
        prismaMock.sOXControl.findMany.mockResolvedValue([]);

        await soxService.getSOXControls('org-123', { keyControl: true });

        expect(prismaMock.sOXControl.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              keyControl: true,
            }),
          })
        );
      });

      it('should handle legacy effectivenessRating filter', async () => {
        prismaMock.sOXControl.findMany.mockResolvedValue([]);

        await soxService.getSOXControls('org-123', { effectivenessRating: 'Effective' });

        expect(prismaMock.sOXControl.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              status: 'Effective',
            }),
          })
        );
      });
    });

    describe('getSOXControlById()', () => {
      it('should return control by ID', async () => {
        const mockControl = createMockSOXControl();
        prismaMock.sOXControl.findFirst.mockResolvedValue(mockControl);

        const result = await soxService.getSOXControlById('sox-ctrl-123', 'org-123');

        expect(result?.id).toBe('sox-ctrl-123');
      });

      it('should return null when not found', async () => {
        prismaMock.sOXControl.findFirst.mockResolvedValue(null);

        const result = await soxService.getSOXControlById('non-existent', 'org-123');

        expect(result).toBeNull();
      });
    });

    describe('updateSOXControl()', () => {
      it('should update control', async () => {
        const existingControl = createMockSOXControl();
        const updatedControl = { ...existingControl, status: 'Effective' };

        prismaMock.sOXControl.findFirst.mockResolvedValue(existingControl);
        prismaMock.sOXControl.update.mockResolvedValue(updatedControl);

        const result = await soxService.updateSOXControl(
          'sox-ctrl-123',
          'admin-123',
          'org-123',
          { status: 'Effective' }
        );

        expect(result?.status).toBe('Effective');
        expect(AuditLogger.log).toHaveBeenCalledWith(
          expect.objectContaining({
            action: 'sox_control.updated',
          })
        );
      });

      it('should return null when control not found', async () => {
        prismaMock.sOXControl.findFirst.mockResolvedValue(null);

        const result = await soxService.updateSOXControl(
          'non-existent',
          'admin-123',
          'org-123',
          { status: 'Effective' }
        );

        expect(result).toBeNull();
      });
    });

    describe('deleteSOXControl()', () => {
      it('should delete control', async () => {
        const existingControl = createMockSOXControl();
        prismaMock.sOXControl.findFirst.mockResolvedValue(existingControl);
        prismaMock.sOXControl.deleteMany.mockResolvedValue({ count: 1 });

        const result = await soxService.deleteSOXControl('sox-ctrl-123', 'admin-123', 'org-123');

        expect(result).toBe(true);
        expect(AuditLogger.log).toHaveBeenCalledWith(
          expect.objectContaining({
            action: 'sox_control.deleted',
          })
        );
      });

      it('should return false when control not found', async () => {
        prismaMock.sOXControl.findFirst.mockResolvedValue(null);

        const result = await soxService.deleteSOXControl('non-existent', 'admin-123', 'org-123');

        expect(result).toBe(false);
      });
    });
  });

  // ===========================================================================
  // SOX Test Result CRUD Tests
  // ===========================================================================

  describe('SOX Test Result CRUD', () => {
    describe('createSOXTestResult()', () => {
      it('should create a new test result', async () => {
        const mockResult = createMockSOXTestResult();
        const mockControl = createMockSOXControl();
        prismaMock.sOXTestResult.create.mockResolvedValue(mockResult);
        prismaMock.sOXControl.findFirst.mockResolvedValue(mockControl);
        prismaMock.sOXControl.update.mockResolvedValue(mockControl);

        const result = await soxService.createSOXTestResult({
          organizationId: 'org-123',
          controlId: 'sox-ctrl-123',
          testProcedure: 'Selected sample and verified criteria',
          testType: 'OperatingEffectiveness',
          sampleSize: 25,
          exceptionsFound: 0,
          conclusion: 'Effective',
          tester: 'Internal Auditor',
          userId: 'admin-123',
        });

        expect(result.conclusion).toBe('Effective');
        // The parent control (the org-owned entity this child test result attaches to)
        // must be looked up scoped to the caller's organization, so a controlId from
        // another tenant cannot have a test result attached to it.
        expect(prismaMock.sOXControl.findFirst).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { id: 'sox-ctrl-123', organizationId: 'org-123' },
          })
        );
        expect(AuditLogger.log).toHaveBeenCalledWith(
          expect.objectContaining({
            action: 'sox_test_result.created',
          })
        );
      });

      it('should throw 404 when the parent control is not in the caller org (cross-tenant guard)', async () => {
        // findFirst scoped by org returns nothing for a control owned by another tenant.
        prismaMock.sOXControl.findFirst.mockResolvedValue(null);

        await expect(
          soxService.createSOXTestResult({
            organizationId: 'org-123',
            controlId: 'sox-ctrl-foreign',
            testProcedure: 'Test procedure',
            testType: 'OperatingEffectiveness',
            conclusion: 'Effective',
          })
        ).rejects.toThrow('SOX control not found');

        expect(prismaMock.sOXControl.findFirst).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { id: 'sox-ctrl-foreign', organizationId: 'org-123' },
          })
        );
        // No child test result may be written when the parent ownership check fails.
        expect(prismaMock.sOXTestResult.create).not.toHaveBeenCalled();
      });

      it('should update parent control status on test completion', async () => {
        const mockResult = createMockSOXTestResult({ conclusion: 'Effective' });
        const mockControl = createMockSOXControl();
        prismaMock.sOXTestResult.create.mockResolvedValue(mockResult);
        prismaMock.sOXControl.findFirst.mockResolvedValue(mockControl);
        prismaMock.sOXControl.findUnique.mockResolvedValue(mockControl);
        prismaMock.sOXControl.update.mockResolvedValue({ ...mockControl, status: 'Effective' });

        await soxService.createSOXTestResult({
          organizationId: 'org-123',
          controlId: 'sox-ctrl-123',
          testProcedure: 'Test procedure',
          testType: 'OperatingEffectiveness',
          conclusion: 'Effective',
        });

        // Parent lookup is org-scoped even on the status-update path.
        expect(prismaMock.sOXControl.findFirst).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { id: 'sox-ctrl-123', organizationId: 'org-123' },
          })
        );

        expect(prismaMock.sOXControl.update).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              status: 'Effective',
              lastTestDate: expect.any(Date),
            }),
          })
        );
      });

      it('should auto-classify deficiency based on exceptions', async () => {
        const mockResult = createMockSOXTestResult({ exceptionsFound: 5 });
        prismaMock.sOXTestResult.create.mockResolvedValue(mockResult);
        prismaMock.sOXControl.findFirst.mockResolvedValue(createMockSOXControl());
        prismaMock.sOXControl.update.mockResolvedValue(createMockSOXControl());

        await soxService.createSOXTestResult({
          controlId: 'sox-ctrl-123',
          testProcedure: 'Test',
          testType: 'SampleTest',
          sampleSize: 25,
          exceptionsFound: 5, // 20% exception rate
          conclusion: 'Ineffective',
        });

        expect(prismaMock.sOXTestResult.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              deficiencyLevel: 'SignificantDeficiency', // 5/25 = 20% >= 10%
            }),
          })
        );
      });

      it('should handle legacy field aliases', async () => {
        const mockResult = createMockSOXTestResult();
        prismaMock.sOXTestResult.create.mockResolvedValue(mockResult);
        prismaMock.sOXControl.findFirst.mockResolvedValue(createMockSOXControl());
        prismaMock.sOXControl.update.mockResolvedValue(createMockSOXControl());

        await soxService.createSOXTestResult({
          controlId: 'sox-ctrl-123',
          testProcedure: 'Test',
          testType: 'OperatingEffectiveness',
          conclusion: 'Effective',
          testerName: 'John Doe', // Legacy alias for tester
          sampleMethod: 'Random', // Legacy field stored in evidence
          findings: 'No issues', // Legacy field stored in evidence
          workpaperRef: 'WP-001', // Legacy field stored in evidence
        });

        expect(prismaMock.sOXTestResult.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              tester: 'John Doe',
              evidence: expect.objectContaining({
                sampleMethod: 'Random',
                findings: 'No issues',
                workpaperRef: 'WP-001',
              }),
            }),
          })
        );
      });
    });

    describe('getSOXTestResults()', () => {
      it('should return test results for organization', async () => {
        const mockResults = [createMockSOXTestResult()];
        prismaMock.sOXTestResult.findMany.mockResolvedValue(mockResults);

        const result = await soxService.getSOXTestResults('org-123');

        expect(result).toHaveLength(1);
      });

      it('should filter by controlId', async () => {
        prismaMock.sOXTestResult.findMany.mockResolvedValue([]);

        await soxService.getSOXTestResults('org-123', { controlId: 'sox-ctrl-123' });

        expect(prismaMock.sOXTestResult.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              controlId: 'sox-ctrl-123',
            }),
          })
        );
      });

      it('should filter by conclusion', async () => {
        prismaMock.sOXTestResult.findMany.mockResolvedValue([]);

        await soxService.getSOXTestResults('org-123', { conclusion: 'Ineffective' });

        expect(prismaMock.sOXTestResult.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              conclusion: 'Ineffective',
            }),
          })
        );
      });
    });
  });

  // ===========================================================================
  // SOX Assessment CRUD Tests
  // ===========================================================================

  describe('SOX Assessment CRUD', () => {
    describe('createSOXAssessment()', () => {
      it('should create a new assessment', async () => {
        const mockAssessment = createMockSOXAssessment();
        prismaMock.sOXAssessment.create.mockResolvedValue(mockAssessment);

        const result = await soxService.createSOXAssessment({
          organizationId: 'org-123',
          assessmentType: 'Section404',
          assessmentYear: 2024,
          userId: 'admin-123',
        });

        expect(result.assessmentType).toBe('Section404');
        expect(result.status).toBe('InProgress');
        expect(AuditLogger.log).toHaveBeenCalledWith(
          expect.objectContaining({
            action: 'sox_assessment.created',
          })
        );
      });

      it('should use current year as default assessment year', async () => {
        const mockAssessment = createMockSOXAssessment();
        prismaMock.sOXAssessment.create.mockResolvedValue(mockAssessment);

        await soxService.createSOXAssessment({
          organizationId: 'org-123',
          assessmentType: 'Section302',
        });

        expect(prismaMock.sOXAssessment.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              assessmentYear: new Date().getFullYear(),
            }),
          })
        );
      });

      it('should handle legacy fiscalYear field', async () => {
        const mockAssessment = createMockSOXAssessment({ assessmentYear: 2023 });
        prismaMock.sOXAssessment.create.mockResolvedValue(mockAssessment);

        await soxService.createSOXAssessment({
          organizationId: 'org-123',
          assessmentType: 'IntegratedAudit',
          fiscalYear: '2023', // Legacy field
        });

        expect(prismaMock.sOXAssessment.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              assessmentYear: 2023,
            }),
          })
        );
      });
    });

    describe('getSOXAssessments()', () => {
      it('should return assessments for organization', async () => {
        const mockAssessments = [createMockSOXAssessment()];
        prismaMock.sOXAssessment.findMany.mockResolvedValue(mockAssessments);

        const result = await soxService.getSOXAssessments('org-123');

        expect(result).toHaveLength(1);
      });

      it('should filter by assessmentType', async () => {
        prismaMock.sOXAssessment.findMany.mockResolvedValue([]);

        await soxService.getSOXAssessments('org-123', { assessmentType: 'Section404' });

        expect(prismaMock.sOXAssessment.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              assessmentType: 'Section404',
            }),
          })
        );
      });

      it('should filter by status', async () => {
        prismaMock.sOXAssessment.findMany.mockResolvedValue([]);

        await soxService.getSOXAssessments('org-123', { status: 'Completed' });

        expect(prismaMock.sOXAssessment.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              status: 'Completed',
            }),
          })
        );
      });
    });

    describe('updateSOXAssessment()', () => {
      it('should update assessment', async () => {
        const existingAssessment = createMockSOXAssessment();
        const updatedAssessment = { ...existingAssessment, status: 'Completed' };

        prismaMock.sOXAssessment.findFirst.mockResolvedValue(existingAssessment);
        prismaMock.sOXAssessment.update.mockResolvedValue(updatedAssessment);

        const result = await soxService.updateSOXAssessment(
          'assessment-123',
          'admin-123',
          'org-123',
          { status: 'Completed', overallConclusion: 'Effective' }
        );

        expect(result?.status).toBe('Completed');
      });
    });

    describe('deleteSOXAssessment()', () => {
      it('should delete assessment', async () => {
        const existingAssessment = createMockSOXAssessment();
        prismaMock.sOXAssessment.findFirst.mockResolvedValue(existingAssessment);
        prismaMock.sOXAssessment.deleteMany.mockResolvedValue({ count: 1 });

        const result = await soxService.deleteSOXAssessment('assessment-123', 'admin-123', 'org-123');

        expect(result).toBe(true);
      });
    });
  });

  // ===========================================================================
  // Automated Control Testing Tests
  // ===========================================================================

  describe('automateControlTesting()', () => {
    it('should run automated testing for semi-automated controls', async () => {
      const mockControl = createMockSOXControl({
        automationType: 'SemiAutomated',
        category: 'ITGeneral',
      });
      const mockTestResult = createMockSOXTestResult();

      prismaMock.sOXControl.findFirst.mockResolvedValue(mockControl);
      prismaMock.sOXTestResult.create.mockResolvedValue(mockTestResult);
      prismaMock.sOXControl.findFirst.mockResolvedValue(mockControl);
      prismaMock.sOXControl.update.mockResolvedValue(mockControl);
      prismaMock.evidenceAnalysis.findMany.mockResolvedValue([
        { id: 'ev-1', verificationStatus: 'completed' },
      ] as any);
      prismaMock.auditLog.findMany.mockResolvedValue([
        { id: 'log-1', action: 'SOX-001' },
      ] as any);

      const result = await soxService.automateControlTesting('org-123', 'sox-ctrl-123', 'admin-123');

      expect(result.control).toBe('SOX-001');
      expect(result.conclusion).toBe('Effective');
      expect(result.checksPerformed).toBeInstanceOf(Array);
    });

    it('should throw error for manual controls', async () => {
      const mockControl = createMockSOXControl({ automationType: 'Manual' });
      prismaMock.sOXControl.findFirst.mockResolvedValue(mockControl);

      await expect(
        soxService.automateControlTesting('org-123', 'sox-ctrl-123', 'admin-123')
      ).rejects.toThrow('Cannot automate testing for manual controls');
    });

    it('should throw error when control not found', async () => {
      prismaMock.sOXControl.findFirst.mockResolvedValue(null);

      await expect(
        soxService.automateControlTesting('org-123', 'non-existent', 'admin-123')
      ).rejects.toThrow('Control not found');
    });

    it('should perform ITGC-specific checks', async () => {
      const mockControl = createMockSOXControl({
        automationType: 'FullyAutomated',
        category: 'ITGeneral',
      });
      const mockTestResult = createMockSOXTestResult();

      prismaMock.sOXControl.findFirst.mockResolvedValue(mockControl);
      prismaMock.sOXTestResult.create.mockResolvedValue(mockTestResult);
      prismaMock.sOXControl.findFirst.mockResolvedValue(mockControl);
      prismaMock.sOXControl.update.mockResolvedValue(mockControl);
      prismaMock.evidenceAnalysis.findMany.mockResolvedValue([
        { id: 'ev-1', verificationStatus: 'completed' },
      ] as any);
      prismaMock.auditLog.findMany.mockResolvedValue([
        { id: 'log-1', action: 'SOX-001' },
      ] as any);

      const result = await soxService.automateControlTesting('org-123', 'sox-ctrl-123', 'admin-123');

      const checkNames = result.checksPerformed.map((c: any) => c.check);
      expect(checkNames).toContain('AccessControlVerification');
      expect(checkNames).toContain('ChangeManagementReview');
      expect(checkNames).toContain('BackupVerification');
    });

    it('should perform application control-specific checks', async () => {
      const mockControl = createMockSOXControl({
        automationType: 'FullyAutomated',
        category: 'ITApplication',
      });
      const mockTestResult = createMockSOXTestResult();

      prismaMock.sOXControl.findFirst.mockResolvedValue(mockControl);
      prismaMock.sOXTestResult.create.mockResolvedValue(mockTestResult);
      prismaMock.sOXControl.findFirst.mockResolvedValue(mockControl);
      prismaMock.sOXControl.update.mockResolvedValue(mockControl);
      prismaMock.evidenceAnalysis.findMany.mockResolvedValue([
        { id: 'ev-1', verificationStatus: 'completed', createdAt: new Date('2026-01-15'), analyzedAt: new Date('2026-01-15') },
        { id: 'ev-2', verificationStatus: 'completed', createdAt: new Date('2026-02-15'), analyzedAt: new Date('2026-02-15') },
        { id: 'ev-3', verificationStatus: 'completed', createdAt: new Date('2026-03-15'), analyzedAt: new Date('2026-03-15') },
        { id: 'ev-4', verificationStatus: 'completed', createdAt: new Date('2025-10-15'), analyzedAt: new Date('2025-10-15') },
        { id: 'ev-5', verificationStatus: 'completed', createdAt: new Date('2025-11-15'), analyzedAt: new Date('2025-11-15') },
        { id: 'ev-6', verificationStatus: 'completed', createdAt: new Date('2025-12-15'), analyzedAt: new Date('2025-12-15') },
      ] as any);
      prismaMock.auditLog.findMany.mockResolvedValue([
        { id: 'log-1', action: 'SOX-001' },
      ] as any);

      const result = await soxService.automateControlTesting('org-123', 'sox-ctrl-123', 'admin-123');

      const checkNames = result.checksPerformed.map((c: any) => c.check);
      expect(checkNames).toContain('SystemConfigValidation');
      expect(checkNames).toContain('DataIntegrityCheck');
    });
  });

  // ===========================================================================
  // Deficiency Classification Tests
  // ===========================================================================

  describe('Deficiency Classification', () => {
    describe('autoClassifyDeficiency()', () => {
      it('should classify as MaterialWeakness for high exception rate', () => {
        const result = soxService.classifyDeficiency(20, 6, 'Ineffective'); // 30% exception rate

        expect(result).toBe('MaterialWeakness');
      });

      it('should classify as SignificantDeficiency for moderate exception rate', () => {
        const result = soxService.classifyDeficiency(25, 3, 'Ineffective'); // 12% exception rate

        expect(result).toBe('SignificantDeficiency');
      });

      it('should classify as Deficiency for low exception rate', () => {
        const result = soxService.classifyDeficiency(50, 2, 'Ineffective'); // 4% exception rate

        expect(result).toBe('Deficiency');
      });

      it('should return None when no exceptions', () => {
        const result = soxService.classifyDeficiency(25, 0, 'Effective');

        expect(result).toBe('None');
      });

      it('should handle zero sample size', () => {
        const result = soxService.classifyDeficiency(0, 0, 'Effective');

        expect(result).toBe('None');
      });

      it('should respect explicit MaterialWeakness conclusion', () => {
        const result = soxService.classifyDeficiency(100, 5, 'MaterialWeakness');

        expect(result).toBe('MaterialWeakness');
      });
    });
  });

  // ===========================================================================
  // ICFR Assessment Tests
  // ===========================================================================

  describe('getICFRAssessment()', () => {
    it('should return comprehensive ICFR assessment', async () => {
      const mockControls = [
        createMockSOXControl({ status: 'Effective', keyControl: true }),
        createMockSOXControl({ id: 'c2', status: 'Effective', keyControl: false }),
        createMockSOXControl({ id: 'c3', status: 'Ineffective', keyControl: true }),
      ];
      const mockTestResults = [
        createMockSOXTestResult({ conclusion: 'Effective', deficiencyLevel: null }),
        createMockSOXTestResult({ id: 't2', conclusion: 'Ineffective', deficiencyLevel: 'Deficiency' }),
      ];
      const mockAssessments = [createMockSOXAssessment()];

      prismaMock.sOXControl.findMany.mockResolvedValue(mockControls);
      prismaMock.sOXTestResult.findMany.mockResolvedValue(mockTestResults);
      prismaMock.sOXAssessment.findMany.mockResolvedValue(mockAssessments);

      const result = await soxService.getICFRAssessment('org-123');

      expect(result.summary.totalControls).toBe(3);
      expect(result.summary.effectiveControls).toBe(2);
      expect(result.summary.ineffectiveControls).toBe(1);
      expect(result.keyControlEffectiveness.total).toBe(2);
      expect(result.deficiencySummary.deficiencies).toBe(1);
    });

    it('should return Adverse opinion when material weaknesses exist', async () => {
      const mockControls = [createMockSOXControl({ status: 'Ineffective' })];
      const mockTestResults = [
        createMockSOXTestResult({ deficiencyLevel: 'MaterialWeakness' }),
      ];

      prismaMock.sOXControl.findMany.mockResolvedValue(mockControls);
      prismaMock.sOXTestResult.findMany.mockResolvedValue(mockTestResults);
      prismaMock.sOXAssessment.findMany.mockResolvedValue([]);

      const result = await soxService.getICFRAssessment('org-123');

      expect(result.icfrOpinion).toBe('Adverse');
    });

    it('should return Effective opinion when no deficiencies', async () => {
      const mockControls = [
        createMockSOXControl({ status: 'Effective' }),
        createMockSOXControl({ id: 'c2', status: 'Effective' }),
      ];
      const mockTestResults = [
        createMockSOXTestResult({ deficiencyLevel: null }),
      ];

      prismaMock.sOXControl.findMany.mockResolvedValue(mockControls);
      prismaMock.sOXTestResult.findMany.mockResolvedValue(mockTestResults);
      prismaMock.sOXAssessment.findMany.mockResolvedValue([]);

      const result = await soxService.getICFRAssessment('org-123');

      expect(result.icfrOpinion).toBe('Effective');
    });

    it('should return InsufficientEvidence when all controls not tested', async () => {
      const mockControls = [
        createMockSOXControl({ status: 'NotTested' }),
        createMockSOXControl({ id: 'c2', status: 'NotTested' }),
      ];

      prismaMock.sOXControl.findMany.mockResolvedValue(mockControls);
      prismaMock.sOXTestResult.findMany.mockResolvedValue([]);
      prismaMock.sOXAssessment.findMany.mockResolvedValue([]);

      const result = await soxService.getICFRAssessment('org-123');

      expect(result.icfrOpinion).toBe('InsufficientEvidence');
    });

    it('should calculate process area breakdown', async () => {
      const mockControls = [
        createMockSOXControl({ processArea: 'RevenueRecognition', status: 'Effective' }),
        createMockSOXControl({ id: 'c2', processArea: 'RevenueRecognition', status: 'Ineffective' }),
        createMockSOXControl({ id: 'c3', processArea: 'Procurement', status: 'Effective' }),
      ];

      prismaMock.sOXControl.findMany.mockResolvedValue(mockControls);
      prismaMock.sOXTestResult.findMany.mockResolvedValue([]);
      prismaMock.sOXAssessment.findMany.mockResolvedValue([]);

      const result = await soxService.getICFRAssessment('org-123');

      expect(result.processAreaBreakdown.RevenueRecognition.total).toBe(2);
      expect(result.processAreaBreakdown.RevenueRecognition.effective).toBe(1);
      expect(result.processAreaBreakdown.Procurement.total).toBe(1);
    });
  });

  // ===========================================================================
  // Control Walkthrough Tests
  // ===========================================================================

  describe('Control Walkthroughs', () => {
    describe('getControlWalkthroughs()', () => {
      it('should return controls with walkthrough information', async () => {
        const mockControls = [
          createMockSOXControl({ walkthrough: { documented: true } }),
          createMockSOXControl({ id: 'c2', walkthrough: null }),
        ];
        prismaMock.sOXControl.findMany.mockResolvedValue(mockControls);

        const result = await soxService.getControlWalkthroughs('org-123');

        expect(result).toHaveLength(2);
        expect(result[0].hasWalkthrough).toBe(true);
        expect(result[1].hasWalkthrough).toBe(false);
      });
    });

    describe('scoreWalkthrough()', () => {
      it('should score walkthrough based on completeness', async () => {
        const mockControl = createMockSOXControl();
        prismaMock.sOXControl.findFirst.mockResolvedValue(mockControl);

        const result = await soxService.scoreWalkthrough('sox-ctrl-123', 'org-123', {
          processNarrative: 'This is a comprehensive narrative describing the revenue recognition process in detail.',
          controlPointIdentified: true,
          riskIdentified: true,
          assertionsCovered: ['Existence', 'Completeness', 'Valuation'],
          evidenceObtained: true,
          exceptionsTested: true,
          informationFlowDocumented: true,
          personnelInterviewed: ['Finance Manager', 'Controller'],
        });

        expect(result.score).toBeGreaterThan(80);
        expect(result.scoringDetails).toBeDefined();
      });

      it('should return low score for incomplete walkthrough', async () => {
        const mockControl = createMockSOXControl();
        prismaMock.sOXControl.findFirst.mockResolvedValue(mockControl);

        const result = await soxService.scoreWalkthrough('sox-ctrl-123', 'org-123', {
          processNarrative: 'Short',
          controlPointIdentified: false,
          riskIdentified: false,
        });

        expect(result.score).toBeLessThan(50);
      });

      it('should throw error when control not found', async () => {
        prismaMock.sOXControl.findFirst.mockResolvedValue(null);

        await expect(
          soxService.scoreWalkthrough('non-existent', 'org-123', {})
        ).rejects.toThrow('Control not found');
      });
    });
  });
});
