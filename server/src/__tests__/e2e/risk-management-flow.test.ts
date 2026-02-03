/**
 * E2E Tests - Risk Management Flow
 * Tests the complete risk management workflow
 */

import { jest, describe, it, expect, beforeAll } from '@jest/globals';
import request from 'supertest';
import { prismaMock } from '../mocks/prisma';

jest.mock('../../config/database', () => ({
  __esModule: true,
  default: prismaMock,
  testConnection: (jest.fn() as jest.Mock<any>).mockResolvedValue(true),
}));

jest.mock('../../config/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

jest.mock('../../services/geminiService', () => ({
  __esModule: true,
  default: {
    prioritizeRisks: (jest.fn() as jest.Mock<any>).mockResolvedValue([
      { id: 'r1', score: 95, rationale: 'High severity' },
    ]),
    generateRemediationPlan: (jest.fn() as jest.Mock<any>).mockResolvedValue('Remediation plan'),
  },
}));

import app from '../../index';

describe('E2E: Risk Management Flow', () => {
  let authToken: string;

  beforeAll(async () => {
    // Authenticate and get token
    // In a real E2E test, this would use actual authentication
    authToken = 'mock-token-for-testing';
  });

  describe('Complete Risk Management Workflow', () => {
    it('should complete full risk lifecycle', async () => {
      // Step 1: Create a risk
      const createResponse = await request(app)
        .post('/api/risks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'E2E Test Risk',
          description: 'Test risk for E2E testing',
          severity: 'High',
          likelihood: 4,
          impact: 5,
          organizationId: 'org-123',
        })
        .expect(201);

      expect(createResponse.body).toHaveProperty('id');
      const riskId = createResponse.body.id;

      // Step 2: Get the risk
      const getResponse = await request(app)
        .get(`/api/risks/${riskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(getResponse.body).toHaveProperty('id', riskId);

      // Step 3: Prioritize risks
      const prioritizeResponse = await request(app)
        .post('/api/risks/prioritize')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          riskIds: [riskId],
        })
        .expect(200);

      expect(prioritizeResponse.body).toHaveProperty('prioritizedRisks');

      // Step 4: Generate remediation plan
      const remediationResponse = await request(app)
        .post(`/api/risks/${riskId}/remediation`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(remediationResponse.body).toHaveProperty('remediationPlan');

      // Step 5: Update risk status
      const updateResponse = await request(app)
        .patch(`/api/risks/${riskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          status: 'In Progress',
        })
        .expect(200);

      expect(updateResponse.body).toHaveProperty('status', 'In Progress');
    });
  });

  describe('Risk Scanning Workflow', () => {
    it('should perform risk scan and process results', async () => {
      const scanResponse = await request(app)
        .post('/api/risks/scan')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          organizationId: 'org-123',
          scanType: 'full',
        })
        .expect(200);

      expect(scanResponse.body).toHaveProperty('risks');
      expect(Array.isArray(scanResponse.body.risks)).toBe(true);
    });
  });
});

