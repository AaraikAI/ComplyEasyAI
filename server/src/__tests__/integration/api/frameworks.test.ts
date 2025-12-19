/**
 * Frameworks API Integration Tests
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { prismaMock, createMockUser, createMockOrganization } from '../../mocks/prisma';

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
  },
}));

jest.mock('../../../utils/auditLogger', () => ({
  AuditLogger: {
    log: jest.fn(),
  },
}));

import frameworksRoutes from '../../../routes/frameworks';
import { errorHandler } from '../../../middleware/errorHandler';
import { authenticate } from '../../../middleware/auth';

const app = express();
app.use(express.json());

// Mock auth middleware
app.use((req, res, next) => {
  (req as any).user = {
    id: 'user-123',
    organizationId: 'org-123',
    role: 'admin',
  };
  next();
});

app.use('/api/frameworks', frameworksRoutes);
app.use(errorHandler);

describe('Frameworks API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should list frameworks', async () => {
    const mockFrameworks = [
      {
        id: 'fw-1',
        name: 'SOC2',
        organizationId: 'org-123',
        status: 'Active',
      },
    ];

    prismaMock.complianceFramework.findMany.mockResolvedValue(mockFrameworks);

    const response = await request(app)
      .get('/api/frameworks')
      .expect(200);

    expect(response.body).toBeDefined();
    expect(Array.isArray(response.body)).toBe(true);
  });

  it('should get framework by ID', async () => {
    const mockFramework = {
      id: 'fw-1',
      name: 'SOC2',
      organizationId: 'org-123',
      status: 'Active',
    };

    prismaMock.complianceFramework.findUnique.mockResolvedValue(mockFramework);

    const response = await request(app)
      .get('/api/frameworks/fw-1')
      .expect(200);

    expect(response.body).toHaveProperty('id', 'fw-1');
  });

  it('should create framework', async () => {
    const newFramework = {
      name: 'ISO27001',
      organizationId: 'org-123',
    };

    const createdFramework = {
      id: 'fw-2',
      ...newFramework,
      status: 'Active',
      createdAt: new Date(),
    };

    prismaMock.complianceFramework.create.mockResolvedValue(createdFramework);

    const response = await request(app)
      .post('/api/frameworks')
      .send(newFramework)
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('name', 'ISO27001');
  });
});

