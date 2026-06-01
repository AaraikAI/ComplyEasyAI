/**
 * E2E Tests - Compliance Regulations Flow
 * Tests DORA, SOX, SoD, MDM, and Personnel compliance modules.
 *
 * Exercises the real routes in src/routes/{dora,sox,sod,mdm,personnel}.ts. Each
 * route module delegates to its service layer, which is mocked here so the
 * assertions verify route wiring (path + method + status + response shape)
 * deterministically. Request bodies satisfy the real Joi validation schemas.
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';

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

// Personnel routes are gated by requireEnterpriseFeature; provide all exports.
jest.mock('../../middleware/tierMiddleware', () => {
  const pass = (_req: any, _res: any, next: any) => next();
  const passArr = () => [pass];
  return {
    __esModule: true,
    requireFeature: () => pass,
    requireTier: () => pass,
    enforceLimit: () => pass,
    attachTierInfo: () => pass,
    trackUsage: () => pass,
    requireFeatureAndLimit: () => pass,
    requireActiveSubscription: () => pass,
    requireAiFeature: passArr,
    requireResourceCreation: passArr,
    requireEnterpriseFeature: passArr,
    requireAcosFeature: passArr,
    requireVisionaryFeature: passArr,
    default: {},
  };
});

// doraService is a namespace import (import * as doraService).
jest.mock('../../services/doraService', () => ({
  __esModule: true,
  getDORADashboard: jest.fn(),
  createICTRiskAssessment: jest.fn(),
  listICTRiskAssessments: jest.fn(),
  createICTIncident: jest.fn(),
  getICTIncident: jest.fn(),
  updateICTIncident: jest.fn(),
  createThirdPartyProvider: jest.fn(),
  createResilienceTest: jest.fn(),
}));

const defaultSvc = (methods: string[]) => {
  const obj: Record<string, jest.Mock> = {};
  for (const m of methods) obj[m] = jest.fn();
  return { __esModule: true, default: obj };
};

jest.mock('../../services/soxService', () =>
  defaultSvc(['getSOXDashboard', 'getSOXControls', 'createSOXControl', 'getSOXTestResults', 'createSOXTestResult', 'getSOXAssessments', 'createSOXAssessment', 'generateSOXReport']));
jest.mock('../../services/sodService', () =>
  defaultSvc(['getSoDDashboard', 'getSoDRules', 'createSoDRule', 'getSoDViolations', 'getSoDMatrix', 'runSoDAnalysis']));
jest.mock('../../services/mdmService', () =>
  defaultSvc(['getMDMDashboard', 'getDevices', 'enrollDevice', 'getPolicies', 'createPolicy', 'checkDeviceCompliance', 'getDeviceActions', 'createDeviceAction']));
jest.mock('../../services/personnelService', () =>
  defaultSvc(['createPersonnel', 'getPersonnelByOrganization', 'getComplianceSummary', 'startOffboarding', 'createAccessReview']));

import doraRoutes from '../../routes/dora';
import soxRoutes from '../../routes/sox';
import sodRoutes from '../../routes/sod';
import mdmRoutes from '../../routes/mdm';
import personnelRoutes from '../../routes/personnel';
import { errorHandler } from '../../middleware/errorHandler';
import * as doraServiceImport from '../../services/doraService';
import soxService from '../../services/soxService';
import sodService from '../../services/sodService';
import mdmService from '../../services/mdmService';
import personnelService from '../../services/personnelService';

const dora = doraServiceImport as unknown as Record<string, jest.Mock>;
const sox = soxService as unknown as Record<string, jest.Mock>;
const sod = sodService as unknown as Record<string, jest.Mock>;
const mdm = mdmService as unknown as Record<string, jest.Mock>;
const personnel = personnelService as unknown as Record<string, jest.Mock>;

const app = express();
app.use(express.json());
app.use((req, _res, next) => {
  (req as any).user = {
    id: 'user-123',
    organizationId: 'org-123',
    role: 'admin',
    email: 'admin@example.com',
  };
  next();
});
app.use('/api/dora', doraRoutes);
app.use('/api/sox', soxRoutes);
app.use('/api/sod', sodRoutes);
app.use('/api/mdm', mdmRoutes);
app.use('/api/personnel', personnelRoutes);
app.use(errorHandler);

describe('E2E: Compliance Regulations Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ===========================================================================
  // DORA
  // ===========================================================================
  describe('DORA Compliance Flow', () => {
    it('should create an ICT risk assessment', async () => {
      dora.createICTRiskAssessment.mockResolvedValue({ id: 'ra-123', title: 'Core Banking Risk' });

      const response = await request(app)
        .post('/api/dora/risk-assessments')
        .send({ title: 'Core Banking Risk', assessmentType: 'Initial', riskLevel: 'High' })
        .expect(201);

      expect(response.body).toHaveProperty('id', 'ra-123');
      expect(dora.createICTRiskAssessment).toHaveBeenCalledWith(
        expect.objectContaining({ organizationId: 'org-123', assessedBy: 'user-123' })
      );
    });

    it('should report and update an ICT incident', async () => {
      dora.createICTIncident.mockResolvedValue({ id: 'inc-123', title: 'Database Outage', status: 'Open' });

      const reportResponse = await request(app)
        .post('/api/dora/incidents')
        .send({ title: 'Database Outage', severity: 'Major', description: 'Primary DB unavailable' })
        .expect(201);

      expect(reportResponse.body).toHaveProperty('id', 'inc-123');

      dora.updateICTIncident.mockResolvedValue({ id: 'inc-123', status: 'Resolved' });

      const updateResponse = await request(app)
        .patch('/api/dora/incidents/inc-123')
        .send({ status: 'Resolved' })
        .expect(200);

      expect(updateResponse.body).toHaveProperty('status', 'Resolved');
    });

    it('should register an ICT third-party provider', async () => {
      dora.createThirdPartyProvider.mockResolvedValue({ id: 'prov-123', name: 'Cloud Provider' });

      const response = await request(app)
        .post('/api/dora/third-party-providers')
        .send({ name: 'Cloud Provider', providerType: 'CloudService', criticality: 'Critical' })
        .expect(201);

      expect(response.body).toHaveProperty('id', 'prov-123');
    });

    it('should get the DORA dashboard', async () => {
      dora.getDORADashboard.mockResolvedValue({ ictAssets: 5, openIncidents: 1 });

      const response = await request(app)
        .get('/api/dora/dashboard')
        .expect(200);

      expect(response.body).toHaveProperty('ictAssets', 5);
      expect(response.body).toHaveProperty('openIncidents', 1);
    });
  });

  // ===========================================================================
  // SOX
  // ===========================================================================
  describe('SOX Compliance Flow', () => {
    it('should create a SOX control', async () => {
      sox.createSOXControl.mockResolvedValue({ id: 'sox-ctrl-123', name: 'Financial Reporting Controls' });

      const response = await request(app)
        .post('/api/sox/controls')
        .send({ name: 'Financial Reporting Controls', type: 'Key', frequency: 'Quarterly' })
        .expect(201);

      expect(response.body).toHaveProperty('id', 'sox-ctrl-123');
    });

    it('should create a SOX test result', async () => {
      sox.createSOXTestResult.mockResolvedValue({ id: 'sox-test-123', result: 'Effective' });

      const response = await request(app)
        .post('/api/sox/test-results')
        .send({ controlId: 'sox-ctrl-123', testType: 'Design', sampleSize: 25 })
        .expect(201);

      expect(response.body).toHaveProperty('result', 'Effective');
    });

    it('should generate the full SOX report', async () => {
      sox.generateSOXReport.mockResolvedValue({ controls: [], testResults: [] });

      const response = await request(app)
        .get('/api/sox/reports/full')
        .query({ fiscalYear: '2024' })
        .expect(200);

      expect(response.body).toHaveProperty('controls');
      expect(response.body).toHaveProperty('testResults');
    });
  });

  // ===========================================================================
  // SoD
  // ===========================================================================
  describe('SoD Compliance Flow', () => {
    it('should create a SoD rule', async () => {
      sod.createSoDRule.mockResolvedValue({ id: 'sod-rule-123', name: 'Payment Segregation' });

      const response = await request(app)
        .post('/api/sod/rules')
        .send({
          name: 'Payment Segregation',
          severity: 'High',
          conflictingRoles: ['Payment Approver', 'Payment Initiator'],
        })
        .expect(201);

      expect(response.body).toHaveProperty('id', 'sod-rule-123');
    });

    it('should run a SoD analysis', async () => {
      sod.runSoDAnalysis.mockResolvedValue({ violations: [], scanned: 42 });

      const response = await request(app)
        .post('/api/sod/analyze')
        .expect(200);

      expect(response.body).toHaveProperty('violations');
      expect(sod.runSoDAnalysis).toHaveBeenCalledWith('org-123', 'user-123');
    });

    it('should list SoD violations', async () => {
      sod.getSoDViolations.mockResolvedValue([{ id: 'sod-viol-123', status: 'Open' }]);

      const response = await request(app)
        .get('/api/sod/violations')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body[0]).toHaveProperty('status', 'Open');
    });

    it('should get the SoD matrix', async () => {
      sod.getSoDMatrix.mockResolvedValue({ matrix: [], systems: [] });

      const response = await request(app)
        .get('/api/sod/matrix')
        .expect(200);

      expect(response.body).toHaveProperty('matrix');
    });
  });

  // ===========================================================================
  // MDM
  // ===========================================================================
  describe('MDM Compliance Flow', () => {
    it('should enroll a device', async () => {
      mdm.enrollDevice.mockResolvedValue({ id: 'dev-123', deviceName: 'iPhone 15' });

      const response = await request(app)
        .post('/api/mdm/devices')
        .send({ deviceName: 'iPhone 15', platform: 'iOS', ownershipType: 'Corporate' })
        .expect(201);

      expect(response.body).toHaveProperty('id', 'dev-123');
      expect(mdm.enrollDevice).toHaveBeenCalledWith(
        expect.objectContaining({ organizationId: 'org-123', enrolledBy: 'user-123' })
      );
    });

    it('should create an MDM policy', async () => {
      mdm.createPolicy.mockResolvedValue({ id: 'pol-123', name: 'Encryption Required' });

      const response = await request(app)
        .post('/api/mdm/policies')
        .send({ name: 'Encryption Required', platform: 'iOS', enforced: true })
        .expect(201);

      expect(response.body).toHaveProperty('id', 'pol-123');
    });

    it('should evaluate device compliance', async () => {
      mdm.checkDeviceCompliance.mockResolvedValue({ compliant: 8, nonCompliant: 2 });

      const response = await request(app)
        .get('/api/mdm/compliance')
        .expect(200);

      expect(response.body).toHaveProperty('compliant', 8);
    });

    it('should lock a device', async () => {
      mdm.createDeviceAction.mockResolvedValue({ id: 'act-1' });

      const response = await request(app)
        .post('/api/mdm/devices/dev-123/lock')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.message).toContain('lock');
    });
  });

  // ===========================================================================
  // Personnel
  // ===========================================================================
  describe('Personnel Compliance Flow', () => {
    it('should create a personnel record', async () => {
      personnel.createPersonnel.mockResolvedValue({ id: 'pers-123', firstName: 'John', lastName: 'Doe' });

      const response = await request(app)
        .post('/api/personnel')
        .send({ firstName: 'John', lastName: 'Doe', email: 'john.doe@example.com', department: 'Engineering' })
        .expect(201);

      expect(response.body).toHaveProperty('id', 'pers-123');
      expect(personnel.createPersonnel).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'user-123' })
      );
    });

    it('should list personnel for the organization', async () => {
      personnel.getPersonnelByOrganization.mockResolvedValue([{ id: 'pers-123' }]);

      const response = await request(app)
        .get('/api/personnel')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should create an access review', async () => {
      personnel.createAccessReview.mockResolvedValue({ id: 'rev-123', reviewType: 'Periodic' });

      const response = await request(app)
        .post('/api/personnel/access-reviews')
        .send({ personnelId: 'pers-123', reviewType: 'Periodic' })
        .expect(201);

      expect(response.body).toHaveProperty('id', 'rev-123');
      expect(personnel.createAccessReview).toHaveBeenCalledWith(
        expect.objectContaining({ reviewerId: 'user-123', organizationId: 'org-123' })
      );
    });

    it('should get the personnel compliance summary', async () => {
      personnel.getComplianceSummary.mockResolvedValue({ totalPersonnel: 10, trainingCompliant: 9 });

      const response = await request(app)
        .get('/api/personnel/compliance-summary')
        .expect(200);

      expect(response.body).toHaveProperty('totalPersonnel', 10);
    });

    it('should start offboarding for a personnel record', async () => {
      personnel.startOffboarding.mockResolvedValue({ id: 'pers-123', status: 'Offboarding' });

      const response = await request(app)
        .post('/api/personnel/pers-123/start-offboarding')
        .send({ reason: 'Resignation' })
        .expect(200);

      expect(response.body).toHaveProperty('status', 'Offboarding');
    });
  });
});
