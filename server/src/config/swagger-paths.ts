/**
 * Comprehensive Swagger Path Definitions
 * ComplyEasyAI API Documentation
 *
 * This file provides OpenAPI path definitions for all major API endpoints.
 * These can be imported into the main swagger configuration.
 */

export const swaggerPaths = {
  // ============================================================================
  // AUTHENTICATION
  // ============================================================================
  '/v1/auth/magic-link': {
    post: {
      summary: 'Request magic link',
      description: 'Send a magic link to the user email for passwordless authentication',
      tags: ['Auth'],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['email'],
              properties: {
                email: { type: 'string', format: 'email' },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Magic link sent successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  message: { type: 'string' },
                },
              },
            },
          },
        },
        400: { $ref: '#/components/responses/ValidationError' },
        429: { description: 'Too many requests' },
      },
    },
  },
  '/v1/auth/verify': {
    post: {
      summary: 'Verify magic link token',
      description: 'Verify the magic link token and return authentication tokens',
      tags: ['Auth'],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['token'],
              properties: {
                token: { type: 'string' },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Authentication successful',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AuthResponse' },
            },
          },
        },
        401: { $ref: '#/components/responses/UnauthorizedError' },
      },
    },
  },
  '/v1/auth/refresh': {
    post: {
      summary: 'Refresh access token',
      description: 'Get a new access token using the refresh token',
      tags: ['Auth'],
      responses: {
        200: {
          description: 'Token refreshed successfully',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AuthResponse' },
            },
          },
        },
        401: { $ref: '#/components/responses/UnauthorizedError' },
      },
    },
  },
  '/v1/auth/logout': {
    post: {
      summary: 'Logout',
      description: 'Invalidate the current session and tokens',
      tags: ['Auth'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: { description: 'Logged out successfully' },
      },
    },
  },

  // ============================================================================
  // TWO-FACTOR AUTHENTICATION
  // ============================================================================
  '/v1/2fa/setup': {
    post: {
      summary: 'Setup 2FA',
      description: 'Initialize two-factor authentication setup',
      tags: ['2FA'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: '2FA setup initialized',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  secret: { type: 'string' },
                  qrCode: { type: 'string', description: 'Base64 encoded QR code' },
                  backupCodes: {
                    type: 'array',
                    items: { type: 'string' },
                    description: '8 backup codes',
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  '/v1/2fa/verify': {
    post: {
      summary: 'Verify 2FA code',
      description: 'Verify the TOTP code during login or setup',
      tags: ['2FA'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['code'],
              properties: {
                code: { type: 'string', pattern: '^[0-9]{6}$' },
              },
            },
          },
        },
      },
      responses: {
        200: { description: '2FA verified successfully' },
        401: { $ref: '#/components/responses/UnauthorizedError' },
      },
    },
  },

  // ============================================================================
  // FRAMEWORKS
  // ============================================================================
  '/v1/frameworks': {
    get: {
      summary: 'List compliance frameworks',
      description: 'Get all compliance frameworks for the organization',
      tags: ['Frameworks'],
      security: [{ bearerAuth: [] }],
      parameters: [
        { in: 'query', name: 'status', schema: { type: 'string', enum: ['Not_Started', 'In_Progress', 'Compliant', 'Non_Compliant'] } },
        { in: 'query', name: 'page', schema: { type: 'integer', default: 0 } },
        { in: 'query', name: 'pageSize', schema: { type: 'integer', default: 20 } },
      ],
      responses: {
        200: {
          description: 'List of frameworks',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: { type: 'string' },
                  data: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/ComplianceFramework' },
                  },
                },
              },
            },
          },
        },
      },
    },
    post: {
      summary: 'Create framework',
      description: 'Create a new compliance framework',
      tags: ['Frameworks'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['name'],
              properties: {
                name: { type: 'string' },
                description: { type: 'string' },
                templateId: { type: 'string', description: 'Use a predefined template' },
              },
            },
          },
        },
      },
      responses: {
        201: { description: 'Framework created' },
        400: { $ref: '#/components/responses/ValidationError' },
      },
    },
  },
  '/v1/frameworks/{id}': {
    get: {
      summary: 'Get framework',
      description: 'Get a specific compliance framework with controls',
      tags: ['Frameworks'],
      security: [{ bearerAuth: [] }],
      parameters: [
        { in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } },
      ],
      responses: {
        200: {
          description: 'Framework details',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ComplianceFramework' },
            },
          },
        },
        404: { $ref: '#/components/responses/NotFoundError' },
      },
    },
    patch: {
      summary: 'Update framework',
      description: 'Update a compliance framework',
      tags: ['Frameworks'],
      security: [{ bearerAuth: [] }],
      parameters: [
        { in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } },
      ],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                description: { type: 'string' },
                status: { type: 'string', enum: ['Not_Started', 'In_Progress', 'Compliant', 'Non_Compliant'] },
                nextAuditDate: { type: 'string', format: 'date' },
              },
            },
          },
        },
      },
      responses: {
        200: { description: 'Framework updated' },
        404: { $ref: '#/components/responses/NotFoundError' },
      },
    },
    delete: {
      summary: 'Delete framework',
      description: 'Delete a compliance framework (Admin only)',
      tags: ['Frameworks'],
      security: [{ bearerAuth: [] }],
      parameters: [
        { in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } },
      ],
      responses: {
        204: { description: 'Framework deleted' },
        404: { $ref: '#/components/responses/NotFoundError' },
      },
    },
  },
  '/v1/frameworks/templates': {
    get: {
      summary: 'List framework templates',
      description: 'Get available compliance framework templates (SOC2, HIPAA, GDPR, etc.)',
      tags: ['Frameworks'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'Available templates',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                    description: { type: 'string' },
                    controlCount: { type: 'integer' },
                  },
                },
              },
            },
          },
        },
      },
    },
  },

  // ============================================================================
  // VENDORS
  // ============================================================================
  '/v1/vendors': {
    get: {
      summary: 'List vendors',
      description: 'Get all vendors for the organization',
      tags: ['Vendors'],
      security: [{ bearerAuth: [] }],
      parameters: [
        { in: 'query', name: 'status', schema: { type: 'string', enum: ['Active', 'Inactive', 'Under_Review', 'Terminated'] } },
        { in: 'query', name: 'riskLevel', schema: { type: 'string', enum: ['Critical', 'High', 'Medium', 'Low'] } },
        { in: 'query', name: 'page', schema: { type: 'integer' } },
        { in: 'query', name: 'pageSize', schema: { type: 'integer' } },
      ],
      responses: {
        200: {
          description: 'List of vendors',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: { $ref: '#/components/schemas/Vendor' },
              },
            },
          },
        },
      },
    },
    post: {
      summary: 'Create vendor',
      description: 'Add a new vendor',
      tags: ['Vendors'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['name', 'category'],
              properties: {
                name: { type: 'string' },
                category: { type: 'string' },
                contactEmail: { type: 'string', format: 'email' },
                hasDataAccess: { type: 'boolean' },
                dataTypes: { type: 'array', items: { type: 'string' } },
              },
            },
          },
        },
      },
      responses: {
        201: { description: 'Vendor created' },
      },
    },
  },
  '/v1/vendors/{id}/assess': {
    post: {
      summary: 'Assess vendor',
      description: 'Perform a security assessment on a vendor',
      tags: ['Vendors'],
      security: [{ bearerAuth: [] }],
      parameters: [
        { in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } },
      ],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                assessmentType: { type: 'string', enum: ['initial', 'periodic', 'triggered'] },
                questionnaire: { type: 'object' },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Assessment results',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  riskScore: { type: 'integer', minimum: 0, maximum: 100 },
                  riskLevel: { type: 'string', enum: ['Critical', 'High', 'Medium', 'Low'] },
                  findings: { type: 'array', items: { type: 'object' } },
                },
              },
            },
          },
        },
      },
    },
  },

  // ============================================================================
  // TEAM
  // ============================================================================
  '/v1/team': {
    get: {
      summary: 'List team members',
      description: 'Get all team members in the organization',
      tags: ['Team'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'List of team members',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: { $ref: '#/components/schemas/User' },
              },
            },
          },
        },
      },
    },
  },
  '/v1/team/invite': {
    post: {
      summary: 'Invite team member',
      description: 'Send an invitation to a new team member',
      tags: ['Team'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['email', 'role'],
              properties: {
                email: { type: 'string', format: 'email' },
                role: { type: 'string', enum: ['Admin', 'Editor', 'Viewer'] },
                name: { type: 'string' },
              },
            },
          },
        },
      },
      responses: {
        200: { description: 'Invitation sent' },
        400: { $ref: '#/components/responses/ValidationError' },
      },
    },
  },
  '/v1/team/bulk-invite': {
    post: {
      summary: 'Bulk invite team members',
      description: 'Send invitations to multiple team members at once (max 100)',
      tags: ['Team'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['invitations'],
              properties: {
                invitations: {
                  type: 'array',
                  maxItems: 100,
                  items: {
                    type: 'object',
                    required: ['email', 'role'],
                    properties: {
                      email: { type: 'string', format: 'email' },
                      role: { type: 'string', enum: ['Admin', 'Editor', 'Viewer'] },
                      name: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Bulk invitation results',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  successful: { type: 'integer' },
                  failed: { type: 'integer' },
                  errors: { type: 'array', items: { type: 'object' } },
                },
              },
            },
          },
        },
      },
    },
  },

  // ============================================================================
  // AUDIT LOGS
  // ============================================================================
  '/v1/audit': {
    get: {
      summary: 'List audit logs',
      description: 'Get audit logs for the organization',
      tags: ['Audit'],
      security: [{ bearerAuth: [] }],
      parameters: [
        { in: 'query', name: 'action', schema: { type: 'string' }, description: 'Filter by action type' },
        { in: 'query', name: 'userId', schema: { type: 'string', format: 'uuid' } },
        { in: 'query', name: 'startDate', schema: { type: 'string', format: 'date-time' } },
        { in: 'query', name: 'endDate', schema: { type: 'string', format: 'date-time' } },
        { in: 'query', name: 'limit', schema: { type: 'integer', default: 100 } },
        { in: 'query', name: 'offset', schema: { type: 'integer', default: 0 } },
      ],
      responses: {
        200: {
          description: 'Audit log entries',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  logs: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'string', format: 'uuid' },
                        action: { type: 'string' },
                        userId: { type: 'string', format: 'uuid' },
                        timestamp: { type: 'string', format: 'date-time' },
                        ipAddress: { type: 'string' },
                        details: { type: 'object' },
                      },
                    },
                  },
                  total: { type: 'integer' },
                },
              },
            },
          },
        },
      },
    },
  },
  '/v1/audit/export': {
    get: {
      summary: 'Export audit logs',
      description: 'Export audit logs as JSON or CSV',
      tags: ['Audit'],
      security: [{ bearerAuth: [] }],
      parameters: [
        { in: 'query', name: 'format', schema: { type: 'string', enum: ['json', 'csv'], default: 'json' } },
        { in: 'query', name: 'startDate', schema: { type: 'string', format: 'date-time' } },
        { in: 'query', name: 'endDate', schema: { type: 'string', format: 'date-time' } },
      ],
      responses: {
        200: {
          description: 'Exported audit logs',
          content: {
            'application/json': { schema: { type: 'object' } },
            'text/csv': { schema: { type: 'string' } },
          },
        },
      },
    },
  },

  // ============================================================================
  // AI FEATURES
  // ============================================================================
  '/v1/ai/policy': {
    post: {
      summary: 'Generate policy',
      description: 'Use AI to generate a compliance policy document',
      tags: ['AI'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/AIPolicyRequest' },
          },
        },
      },
      responses: {
        200: {
          description: 'Generated policy',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  policy: { type: 'string' },
                  sections: { type: 'array', items: { type: 'object' } },
                },
              },
            },
          },
        },
      },
    },
  },
  '/v1/ai/gap-analysis': {
    post: {
      summary: 'Perform gap analysis',
      description: 'AI-powered gap analysis for compliance frameworks',
      tags: ['AI'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['frameworkId'],
              properties: {
                frameworkId: { type: 'string', format: 'uuid' },
                context: { type: 'string' },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Gap analysis results',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  gaps: { type: 'array', items: { type: 'object' } },
                  recommendations: { type: 'array', items: { type: 'string' } },
                  complianceScore: { type: 'number' },
                },
              },
            },
          },
        },
      },
    },
  },

  // ============================================================================
  // WEBHOOKS
  // ============================================================================
  '/v1/webhooks': {
    get: {
      summary: 'List webhooks',
      description: 'Get all configured webhooks',
      tags: ['Webhooks'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'List of webhooks',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', format: 'uuid' },
                    url: { type: 'string', format: 'uri' },
                    events: { type: 'array', items: { type: 'string' } },
                    active: { type: 'boolean' },
                  },
                },
              },
            },
          },
        },
      },
    },
    post: {
      summary: 'Create webhook',
      description: 'Create a new webhook endpoint',
      tags: ['Webhooks'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['url', 'events'],
              properties: {
                url: { type: 'string', format: 'uri' },
                events: { type: 'array', items: { type: 'string' } },
                secret: { type: 'string', description: 'Webhook signing secret' },
              },
            },
          },
        },
      },
      responses: {
        201: { description: 'Webhook created' },
      },
    },
  },
  '/v1/webhooks/api-keys': {
    get: {
      summary: 'List API keys',
      description: 'Get all API keys for the organization',
      tags: ['Webhooks'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'List of API keys',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                    prefix: { type: 'string' },
                    scopes: { type: 'array', items: { type: 'string' } },
                    lastUsed: { type: 'string', format: 'date-time' },
                    expiresAt: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
          },
        },
      },
    },
    post: {
      summary: 'Create API key',
      description: 'Generate a new API key',
      tags: ['Webhooks'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['name', 'scopes'],
              properties: {
                name: { type: 'string' },
                scopes: { type: 'array', items: { type: 'string', enum: ['read', 'write', 'admin'] } },
                expiresIn: { type: 'integer', description: 'Expiration in days' },
              },
            },
          },
        },
      },
      responses: {
        201: {
          description: 'API key created',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  key: { type: 'string', description: 'The API key (only shown once)' },
                  id: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
  },

  // ============================================================================
  // INTEGRATIONS
  // ============================================================================
  '/v1/integrations': {
    get: {
      summary: 'List integrations',
      description: 'Get all configured integrations',
      tags: ['Integrations'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'List of integrations',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    provider: { type: 'string' },
                    connected: { type: 'boolean' },
                    connectedAt: { type: 'string', format: 'date-time' },
                    scopes: { type: 'array', items: { type: 'string' } },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  '/v1/integrations/{provider}/connect': {
    get: {
      summary: 'Connect integration',
      description: 'Initiate OAuth flow for a provider',
      tags: ['Integrations'],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'provider',
          required: true,
          schema: { type: 'string', enum: ['google', 'github', 'slack', 'jira', 'aws', 'azure'] },
        },
      ],
      responses: {
        302: { description: 'Redirect to OAuth provider' },
      },
    },
  },
  '/v1/integrations/{provider}/disconnect': {
    post: {
      summary: 'Disconnect integration',
      description: 'Disconnect an integration',
      tags: ['Integrations'],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'provider',
          required: true,
          schema: { type: 'string' },
        },
      ],
      responses: {
        200: { description: 'Integration disconnected' },
      },
    },
  },

  // ============================================================================
  // BILLING
  // ============================================================================
  '/v1/billing/subscription': {
    get: {
      summary: 'Get subscription',
      description: 'Get current subscription details',
      tags: ['Billing'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'Subscription details',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  tier: { type: 'string', enum: ['Foundation', 'Essentials', 'Growth', 'Visionary'] },
                  status: { type: 'string' },
                  currentPeriodEnd: { type: 'string', format: 'date-time' },
                  features: { type: 'array', items: { type: 'string' } },
                },
              },
            },
          },
        },
      },
    },
  },
  '/v1/billing/checkout': {
    post: {
      summary: 'Create checkout session',
      description: 'Create a Stripe checkout session for subscription',
      tags: ['Billing'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['priceId'],
              properties: {
                priceId: { type: 'string' },
                successUrl: { type: 'string', format: 'uri' },
                cancelUrl: { type: 'string', format: 'uri' },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Checkout session created',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  sessionId: { type: 'string' },
                  url: { type: 'string', format: 'uri' },
                },
              },
            },
          },
        },
      },
    },
  },

  // ============================================================================
  // PERSONNEL
  // ============================================================================
  '/v1/personnel': {
    get: {
      summary: 'List personnel',
      description: 'Get all personnel records',
      tags: ['Personnel'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'List of personnel',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', format: 'uuid' },
                    userId: { type: 'string', format: 'uuid' },
                    onboardingStatus: { type: 'string', enum: ['In_Progress', 'Completed', 'Offboarding'] },
                    backgroundCheck: { type: 'boolean' },
                    securityTraining: { type: 'boolean' },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  '/v1/personnel/{id}/onboard': {
    post: {
      summary: 'Complete onboarding',
      description: 'Mark personnel onboarding as complete',
      tags: ['Personnel'],
      security: [{ bearerAuth: [] }],
      parameters: [
        { in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } },
      ],
      responses: {
        200: { description: 'Onboarding completed' },
      },
    },
  },
  '/v1/personnel/{id}/offboard': {
    post: {
      summary: 'Start offboarding',
      description: 'Start the offboarding process for personnel',
      tags: ['Personnel'],
      security: [{ bearerAuth: [] }],
      parameters: [
        { in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['reason'],
              properties: {
                reason: { type: 'string' },
                lastDay: { type: 'string', format: 'date' },
              },
            },
          },
        },
      },
      responses: {
        200: { description: 'Offboarding started' },
      },
    },
  },

  // ============================================================================
  // HEALTH & METRICS
  // ============================================================================
  '/health': {
    get: {
      summary: 'Health check',
      description: 'Check API health status',
      tags: ['System'],
      responses: {
        200: {
          description: 'System healthy',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: { type: 'string', enum: ['healthy', 'degraded', 'unhealthy'] },
                  timestamp: { type: 'string', format: 'date-time' },
                  uptime: { type: 'number' },
                  checks: { type: 'object' },
                },
              },
            },
          },
        },
        503: { description: 'System unhealthy' },
      },
    },
  },

  // ============================================================================
  // SECURITY MONITORING (Falco Integration)
  // ============================================================================
  '/v1/security/alerts': {
    get: {
      summary: 'Get security alerts',
      description: 'Get security alerts from runtime monitoring (Falco)',
      tags: ['Security'],
      security: [{ bearerAuth: [] }],
      parameters: [
        { in: 'query', name: 'priority', schema: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] } },
        { in: 'query', name: 'startDate', schema: { type: 'string', format: 'date-time' } },
        { in: 'query', name: 'endDate', schema: { type: 'string', format: 'date-time' } },
        { in: 'query', name: 'limit', schema: { type: 'integer', default: 50 } },
      ],
      responses: {
        200: {
          description: 'List of security alerts',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  alerts: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        timestamp: { type: 'string', format: 'date-time' },
                        priority: { type: 'string' },
                        rule: { type: 'string' },
                        output: { type: 'string' },
                        container: { type: 'object' },
                      },
                    },
                  },
                  total: { type: 'integer' },
                },
              },
            },
          },
        },
      },
    },
    post: {
      summary: 'Receive security alert',
      description: 'Webhook endpoint for Falco alerts',
      tags: ['Security'],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                priority: { type: 'string' },
                rule: { type: 'string' },
                output: { type: 'string' },
                time: { type: 'string', format: 'date-time' },
              },
            },
          },
        },
      },
      responses: {
        201: { description: 'Alert received' },
      },
    },
  },

  // ============================================================================
  // SECRETS MANAGEMENT
  // ============================================================================
  '/v1/secrets': {
    get: {
      summary: 'List secrets',
      description: 'List all secret names (values are not returned)',
      tags: ['Secrets'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'List of secret metadata',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    lastRotated: { type: 'string', format: 'date-time' },
                    rotationEnabled: { type: 'boolean' },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  '/v1/secrets/{name}/rotate': {
    post: {
      summary: 'Rotate secret',
      description: 'Trigger immediate rotation of a secret',
      tags: ['Secrets'],
      security: [{ bearerAuth: [] }],
      parameters: [
        { in: 'path', name: 'name', required: true, schema: { type: 'string' } },
      ],
      responses: {
        200: { description: 'Secret rotation triggered' },
        404: { $ref: '#/components/responses/NotFoundError' },
      },
    },
  },

  // ============================================================================
  // CIRCUIT BREAKER STATUS
  // ============================================================================
  '/v1/system/circuit-breakers': {
    get: {
      summary: 'Get circuit breaker status',
      description: 'Get status of all circuit breakers',
      tags: ['System'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'Circuit breaker statuses',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    state: { type: 'string', enum: ['CLOSED', 'OPEN', 'HALF_OPEN'] },
                    failures: { type: 'integer' },
                    successes: { type: 'integer' },
                    lastFailure: { type: 'string', format: 'date-time' },
                    totalRequests: { type: 'integer' },
                  },
                },
              },
            },
          },
        },
      },
    },
  },

  // ============================================================================
  // DORA COMPLIANCE
  // ============================================================================
  '/v1/dora/incidents': {
    get: {
      summary: 'List DORA incidents',
      description: 'Get all ICT incidents for DORA compliance',
      tags: ['DORA'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'List of DORA incidents',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', format: 'uuid' },
                    incidentType: { type: 'string' },
                    severity: { type: 'string' },
                    status: { type: 'string' },
                    reportedAt: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
          },
        },
      },
    },
    post: {
      summary: 'Create DORA incident',
      description: 'Report a new ICT incident',
      tags: ['DORA'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['incidentType', 'description', 'severity'],
              properties: {
                incidentType: { type: 'string' },
                description: { type: 'string' },
                severity: { type: 'string', enum: ['Critical', 'High', 'Medium', 'Low'] },
              },
            },
          },
        },
      },
      responses: {
        201: { description: 'Incident created' },
      },
    },
  },

  // ============================================================================
  // MDM (Master Data Management)
  // ============================================================================
  '/v1/mdm/entities': {
    get: {
      summary: 'List master data entities',
      description: 'Get all master data entities',
      tags: ['MDM'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'List of master data entities',
        },
      },
    },
  },
  '/v1/mdm/data-quality': {
    get: {
      summary: 'Get data quality metrics',
      description: 'Get data quality metrics for master data',
      tags: ['MDM'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'Data quality metrics',
        },
      },
    },
  },

  // ============================================================================
  // SOD (Segregation of Duties)
  // ============================================================================
  '/v1/sod/conflicts': {
    get: {
      summary: 'Get SOD conflicts',
      description: 'Get all segregation of duties conflicts',
      tags: ['SOD'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'List of SOD conflicts',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', format: 'uuid' },
                    userId: { type: 'string', format: 'uuid' },
                    conflictType: { type: 'string' },
                    roles: { type: 'array', items: { type: 'string' } },
                    status: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
  },

  // ============================================================================
  // FEATURE MODULES
  // ============================================================================
  '/v1/feature-modules': {
    get: {
      summary: 'List feature modules',
      description: 'Get all available feature modules and their status',
      tags: ['Features'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'List of feature modules',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                    enabled: { type: 'boolean' },
                    tier: { type: 'string', enum: ['Foundation', 'Essentials', 'Growth', 'Visionary'] },
                  },
                },
              },
            },
          },
        },
      },
    },
  },

  // ============================================================================
  // CONTROL MAPPINGS
  // ============================================================================
  '/v1/control-mappings': {
    get: {
      summary: 'List control mappings',
      description: 'Get all control mappings between frameworks',
      tags: ['Controls'],
      security: [{ bearerAuth: [] }],
      parameters: [
        { in: 'query', name: 'sourceFramework', schema: { type: 'string' } },
        { in: 'query', name: 'targetFramework', schema: { type: 'string' } },
      ],
      responses: {
        200: {
          description: 'List of control mappings',
        },
      },
    },
    post: {
      summary: 'Create control mapping',
      description: 'Create a new control mapping',
      tags: ['Controls'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['sourceControlId', 'targetControlId'],
              properties: {
                sourceControlId: { type: 'string' },
                targetControlId: { type: 'string' },
                mappingType: { type: 'string', enum: ['equivalent', 'partial', 'related'] },
              },
            },
          },
        },
      },
      responses: {
        201: { description: 'Mapping created' },
      },
    },
  },

  // ============================================================================
  // EVIDENCE VERSIONING
  // ============================================================================
  '/v1/evidence/{id}/versions': {
    get: {
      summary: 'List evidence versions',
      description: 'Get all versions of an evidence record',
      tags: ['Evidence'],
      security: [{ bearerAuth: [] }],
      parameters: [
        { in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } },
      ],
      responses: {
        200: {
          description: 'List of evidence versions',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    version: { type: 'integer' },
                    createdAt: { type: 'string', format: 'date-time' },
                    createdBy: { type: 'string' },
                    changes: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
  },

  // ============================================================================
  // AUDIT LOGS
  // ============================================================================
  '/v1/audit/logs': {
    get: {
      summary: 'Get audit logs',
      description: 'Get audit logs with filtering options',
      tags: ['Audit'],
      security: [{ bearerAuth: [] }],
      parameters: [
        { in: 'query', name: 'userId', schema: { type: 'string', format: 'uuid' } },
        { in: 'query', name: 'action', schema: { type: 'string' } },
        { in: 'query', name: 'resourceType', schema: { type: 'string' } },
        { in: 'query', name: 'startDate', schema: { type: 'string', format: 'date-time' } },
        { in: 'query', name: 'endDate', schema: { type: 'string', format: 'date-time' } },
        { in: 'query', name: 'limit', schema: { type: 'integer', default: 50 } },
        { in: 'query', name: 'offset', schema: { type: 'integer', default: 0 } },
      ],
      responses: {
        200: {
          description: 'List of audit logs',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  logs: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'string', format: 'uuid' },
                        timestamp: { type: 'string', format: 'date-time' },
                        userId: { type: 'string', format: 'uuid' },
                        action: { type: 'string' },
                        resourceType: { type: 'string' },
                        resourceId: { type: 'string' },
                        details: { type: 'object' },
                        ipAddress: { type: 'string' },
                        userAgent: { type: 'string' },
                      },
                    },
                  },
                  pagination: { $ref: '#/components/schemas/Pagination' },
                },
              },
            },
          },
        },
      },
    },
  },
};

export default swaggerPaths;
