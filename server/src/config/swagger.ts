/**
 * Swagger/OpenAPI Configuration
 * API Documentation for ComplyEasy AI
 */

import swaggerJsdoc from 'swagger-jsdoc';
import { version } from '../../package.json';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'ComplyEasy AI API',
      version,
      description: `
## Overview

ComplyEasy AI is an enterprise-grade GRC (Governance, Risk & Compliance) platform powered by AI.

## Features

- **10 Enterprise Modules**: Personnel, Vendors, Risk Management, Questionnaires, Policies, Trust Center, Multi-Workspace, Reporting, Monitoring, Issues
- **5 Visionary AI Features**: AI Co-Pilot, Predictive Risk, Policy Generation, Compliance Autopilot, Benchmarking
- **6 Advanced Security Services**: Blockchain Audit, Homomorphic AI, Zero-Knowledge Proofs, JIT Access, BYOK, Compliance-as-Code

## Authentication

All endpoints (except auth) require a valid JWT token in the Authorization header:

\`\`\`
Authorization: Bearer <your-jwt-token>
\`\`\`

## Rate Limiting

API requests are rate-limited:
- Standard endpoints: 100 requests per 15 minutes
- AI endpoints: 20 requests per minute
      `,
      contact: {
        name: 'ComplyEasy AI Support',
        url: 'https://complyeasy.ai/support',
        email: 'support@complyeasy.ai',
      },
      license: {
        name: 'Proprietary',
        url: 'https://complyeasy.ai/license',
      },
    },
    servers: [
      {
        url: 'http://localhost:5000/api',
        description: 'Development server',
      },
      {
        url: 'https://api.complyeasy.ai',
        description: 'Production server',
      },
      {
        url: 'https://staging-api.complyeasy.ai',
        description: 'Staging server',
      },
    ],
    tags: [
      { name: 'Auth', description: 'Authentication endpoints' },
      { name: '2FA', description: 'Two-factor authentication' },
      { name: 'Risks', description: 'Risk management' },
      { name: 'Frameworks', description: 'Compliance frameworks' },
      { name: 'AI', description: 'AI-powered features' },
      { name: 'Billing', description: 'Subscription and payments' },
      { name: 'Personnel', description: 'Personnel management' },
      { name: 'Vendors', description: 'Vendor risk management' },
      { name: 'Enterprise', description: 'Enterprise modules' },
      { name: 'Integrations', description: 'Third-party integrations' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT authorization token',
        },
      },
      schemas: {
        // Common schemas
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string', description: 'Error message' },
            code: { type: 'string', description: 'Error code' },
            details: { type: 'object', description: 'Additional error details' },
          },
          required: ['error'],
        },
        Pagination: {
          type: 'object',
          properties: {
            total: { type: 'integer', description: 'Total number of items' },
            limit: { type: 'integer', description: 'Items per page' },
            offset: { type: 'integer', description: 'Offset from start' },
            hasMore: { type: 'boolean', description: 'More items available' },
          },
        },
        // User schemas
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string', format: 'email' },
            name: { type: 'string' },
            role: { type: 'string', enum: ['Admin', 'Editor', 'Viewer'] },
            organizationId: { type: 'string', format: 'uuid' },
            twoFactorEnabled: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        // Risk schemas
        RiskItem: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            title: { type: 'string' },
            description: { type: 'string' },
            category: { type: 'string' },
            severity: { type: 'string', enum: ['Critical', 'High', 'Medium', 'Low'] },
            likelihood: { type: 'integer', minimum: 1, maximum: 5 },
            impact: { type: 'integer', minimum: 1, maximum: 5 },
            status: { type: 'string', enum: ['Open', 'Mitigated', 'Accepted', 'Closed'] },
            organizationId: { type: 'string', format: 'uuid' },
            assignedToId: { type: 'string', format: 'uuid', nullable: true },
            mitigationPlan: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        CreateRiskInput: {
          type: 'object',
          required: ['title', 'description', 'category', 'likelihood', 'impact'],
          properties: {
            title: { type: 'string', minLength: 1, maxLength: 255 },
            description: { type: 'string', minLength: 1 },
            category: { type: 'string' },
            likelihood: { type: 'integer', minimum: 1, maximum: 5 },
            impact: { type: 'integer', minimum: 1, maximum: 5 },
            assignedToId: { type: 'string', format: 'uuid' },
          },
        },
        // Vendor schemas
        Vendor: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            category: { type: 'string' },
            status: { type: 'string', enum: ['Active', 'Inactive', 'Under_Review', 'Terminated'] },
            riskLevel: { type: 'string', enum: ['Critical', 'High', 'Medium', 'Low'] },
            riskScore: { type: 'integer', minimum: 0, maximum: 100 },
            hasDataAccess: { type: 'boolean' },
            dataTypes: { type: 'array', items: { type: 'string' } },
            soc2Report: { type: 'boolean' },
            iso27001Certified: { type: 'boolean' },
            gdprCompliant: { type: 'boolean' },
            hipaaBaa: { type: 'boolean' },
            organizationId: { type: 'string', format: 'uuid' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        // Framework schemas
        ComplianceFramework: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            description: { type: 'string', nullable: true },
            status: { type: 'string', enum: ['Not_Started', 'In_Progress', 'Compliant', 'Non_Compliant'] },
            organizationId: { type: 'string', format: 'uuid' },
            nextAuditDate: { type: 'string', format: 'date', nullable: true },
            controls: {
              type: 'array',
              items: { $ref: '#/components/schemas/FrameworkControl' },
            },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        FrameworkControl: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            description: { type: 'string', nullable: true },
            status: { type: 'string', enum: ['Pending', 'Implemented', 'Not_Implemented', 'Not_Applicable'] },
            evidence: { type: 'string', nullable: true },
            frameworkId: { type: 'string', format: 'uuid' },
          },
        },
        // Issue schemas
        Issue: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            title: { type: 'string' },
            description: { type: 'string' },
            status: { type: 'string', enum: ['Open', 'In_Progress', 'Resolved', 'Closed'] },
            priority: { type: 'string', enum: ['Critical', 'High', 'Medium', 'Low'] },
            category: { type: 'string' },
            slaTarget: { type: 'string', format: 'date-time', nullable: true },
            assigneeId: { type: 'string', format: 'uuid', nullable: true },
            reporterId: { type: 'string', format: 'uuid' },
            organizationId: { type: 'string', format: 'uuid' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        // Auth schemas
        LoginRequest: {
          type: 'object',
          required: ['email'],
          properties: {
            email: { type: 'string', format: 'email' },
          },
        },
        RegisterRequest: {
          type: 'object',
          required: ['name', 'email'],
          properties: {
            name: { type: 'string', minLength: 1 },
            email: { type: 'string', format: 'email' },
            organizationName: { type: 'string' },
          },
        },
        AuthResponse: {
          type: 'object',
          properties: {
            accessToken: { type: 'string' },
            refreshToken: { type: 'string' },
            user: { $ref: '#/components/schemas/User' },
          },
        },
        // AI schemas
        AIReportRequest: {
          type: 'object',
          required: ['framework', 'companyName'],
          properties: {
            framework: { type: 'string' },
            companyName: { type: 'string' },
            context: { type: 'string' },
          },
        },
        AIPolicyRequest: {
          type: 'object',
          required: ['type', 'company'],
          properties: {
            type: { type: 'string' },
            company: { type: 'string' },
            tone: { type: 'string', enum: ['formal', 'professional', 'casual'] },
          },
        },
      },
      responses: {
        UnauthorizedError: {
          description: 'Authentication required',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: { error: 'Authentication required' },
            },
          },
        },
        ForbiddenError: {
          description: 'Access denied',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: { error: 'Access denied' },
            },
          },
        },
        NotFoundError: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: { error: 'Resource not found' },
            },
          },
        },
        ValidationError: {
          description: 'Validation failed',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: { error: 'Validation failed', details: { field: 'error message' } },
            },
          },
        },
      },
    },
    security: [
      { bearerAuth: [] },
    ],
  },
  apis: [
    './src/routes/*.ts',
    './src/controllers/*.ts',
  ],
};

export const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
