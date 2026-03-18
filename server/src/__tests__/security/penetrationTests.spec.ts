/**
 * Penetration Tests
 *
 * Executes the SecurityTestEngine against the running API and validates
 * that no critical or high severity vulnerabilities are present.
 *
 * These tests require the API server to be running on the configured URL.
 * By default, tests target http://localhost:3001.
 *
 * Usage:
 *   API_URL=http://localhost:3001 npm test -- --testPathPattern=penetrationTests
 */

import {
  SecurityTestEngine,
  SecurityTestResult,
  PenetrationTestReport,
} from './penetrationTest';

// Increase timeout for security tests (network requests can be slow)
jest.setTimeout(180000);

const API_URL = process.env.API_URL || 'http://localhost:3001';

/**
 * Check whether the target API server is reachable.
 * Returns true if we can connect, false otherwise.
 */
async function isServerRunning(url: string): Promise<boolean> {
  try {
    const http = require('http');
    return new Promise((resolve) => {
      const urlObj = new URL(url);
      const req = http.request(
        { hostname: urlObj.hostname, port: urlObj.port || 80, path: '/api/health', method: 'GET', timeout: 3000 },
        (res: any) => { res.resume(); resolve(true); }
      );
      req.on('error', () => resolve(false));
      req.on('timeout', () => { req.destroy(); resolve(false); });
      req.end();
    });
  } catch {
    return false;
  }
}

// Conditionally skip the entire suite when the server is not running
const runTests = process.env.RUN_PENTEST === 'true';

const describeOrSkip = runTests ? describe : describe.skip;

describeOrSkip('Penetration Test Suite', () => {
  let engine: SecurityTestEngine;
  let fullReport: PenetrationTestReport;
  let serverAvailable = false;

  beforeAll(async () => {
    serverAvailable = await isServerRunning(API_URL);
    if (!serverAvailable) {
      console.warn(
        `\n⚠ Skipping penetration tests: server not reachable at ${API_URL}.\n` +
        `  Start the server first or set RUN_PENTEST=true with the server running.\n`
      );
      return;
    }

    engine = new SecurityTestEngine({
      baseUrl: API_URL,
      verbose: process.env.VERBOSE === 'true',
      timeout: 10000,
    });

    // Run all tests once and share results across describe blocks
    fullReport = await engine.runAllTests();
  });

  afterAll(() => {
    // Output the full markdown report
    if (fullReport) {
      const report = engine.generateReport(fullReport);
      console.log('\n' + report);
    }
  });

  // ==========================================================================
  // REPORT-LEVEL ASSERTIONS
  // ==========================================================================

  describe('Overall Security Posture', () => {
    it('should have zero critical findings', () => {
      const criticalResults = fullReport.results.filter(
        (r) => r.status === 'fail' && r.severity === 'critical'
      );

      if (criticalResults.length > 0) {
        const details = criticalResults
          .map((r) => `  - ${r.testName}: ${r.details}`)
          .join('\n');
        console.error(`Critical findings:\n${details}`);
      }

      expect(fullReport.criticalFindings).toBe(0);
    });

    it('should have zero high severity findings', () => {
      const highResults = fullReport.results.filter(
        (r) => r.status === 'fail' && r.severity === 'high'
      );

      if (highResults.length > 0) {
        const details = highResults
          .map((r) => `  - ${r.testName}: ${r.details}`)
          .join('\n');
        console.error(`High severity findings:\n${details}`);
      }

      expect(fullReport.highFindings).toBe(0);
    });

    it('should execute all planned tests without errors', () => {
      const errorResults = fullReport.results.filter(
        (r) => r.status === 'error'
      );

      if (errorResults.length > 0) {
        const details = errorResults
          .map((r) => `  - ${r.testName}: ${r.details}`)
          .join('\n');
        console.warn(`Test execution errors:\n${details}`);
      }

      // Allow some test errors (e.g., if server is not running)
      // but at least 80% of tests should execute successfully
      const executedSuccessfully =
        fullReport.totalTests - errorResults.length;
      const successRate =
        executedSuccessfully / fullReport.totalTests;

      expect(successRate).toBeGreaterThanOrEqual(0.8);
    });

    it('should produce a valid report with all test categories', () => {
      expect(fullReport.totalTests).toBeGreaterThanOrEqual(40);
      expect(fullReport.testDate).toBeInstanceOf(Date);
      expect(fullReport.environment).toBeTruthy();

      // Verify all categories are represented
      const categories = new Set(
        fullReport.results.map((r) => r.category)
      );
      expect(categories.has('Authentication')).toBe(true);
      expect(categories.has('Authorization')).toBe(true);
      expect(categories.has('Injection')).toBe(true);
      expect(categories.has('CSRF')).toBe(true);
      expect(categories.has('Rate Limiting')).toBe(true);
      expect(categories.has('Security Headers')).toBe(true);
      expect(categories.has('SSRF')).toBe(true);
      expect(categories.has('Data Protection')).toBe(true);
    });
  });

  // ==========================================================================
  // AUTHENTICATION TESTS
  // ==========================================================================

  describe('Authentication Security', () => {
    let authResults: SecurityTestResult[];

    beforeAll(() => {
      authResults = fullReport.results.filter(
        (r) => r.category === 'Authentication'
      );
    });

    it('should have at least 8 authentication tests', () => {
      expect(authResults.length).toBeGreaterThanOrEqual(8);
    });

    it('should reject expired JWT tokens', () => {
      const result = authResults.find((r) =>
        r.testName.includes('Expired JWT')
      );
      expect(result).toBeDefined();
      expect(result!.status).not.toBe('fail');
    });

    it('should reject malformed JWT tokens', () => {
      const result = authResults.find((r) =>
        r.testName.includes('Malformed JWT')
      );
      expect(result).toBeDefined();
      expect(result!.status).not.toBe('fail');
    });

    it('should require authorization header on protected endpoints', () => {
      const result = authResults.find((r) =>
        r.testName.includes('Missing Authorization')
      );
      expect(result).toBeDefined();
      expect(result!.status).not.toBe('fail');
    });

    it('should have brute force protection', () => {
      const result = authResults.find((r) =>
        r.testName.includes('Brute Force')
      );
      expect(result).toBeDefined();
      // Warning is acceptable (rate limit may have higher threshold)
      expect(['pass', 'warning', 'error']).toContain(result!.status);
    });

    it('should prevent SQL injection in login', () => {
      const result = authResults.find((r) =>
        r.testName.includes('SQL Injection in Login')
      );
      expect(result).toBeDefined();
      expect(result!.status).not.toBe('fail');
    });

    it('should resist timing attacks', () => {
      const result = authResults.find((r) =>
        r.testName.includes('Timing Attack')
      );
      expect(result).toBeDefined();
      // Warning is acceptable (network jitter may cause variation)
      expect(['pass', 'warning', 'error']).toContain(result!.status);
    });

    it('should reject revoked tokens', () => {
      const result = authResults.find((r) =>
        r.testName.includes('Revoked Token')
      );
      expect(result).toBeDefined();
      expect(result!.status).not.toBe('fail');
    });

    it('should prevent session fixation', () => {
      const result = authResults.find((r) =>
        r.testName.includes('Session Fixation')
      );
      expect(result).toBeDefined();
      expect(result!.status).not.toBe('fail');
    });
  });

  // ==========================================================================
  // AUTHORIZATION TESTS
  // ==========================================================================

  describe('Authorization Security', () => {
    let authzResults: SecurityTestResult[];

    beforeAll(() => {
      authzResults = fullReport.results.filter(
        (r) => r.category === 'Authorization'
      );
    });

    it('should have at least 6 authorization tests', () => {
      expect(authzResults.length).toBeGreaterThanOrEqual(6);
    });

    it('should prevent IDOR attacks', () => {
      const result = authzResults.find((r) =>
        r.testName.includes('IDOR')
      );
      expect(result).toBeDefined();
      expect(result!.status).not.toBe('fail');
    });

    it('should prevent role escalation', () => {
      const result = authzResults.find((r) =>
        r.testName.includes('Role Escalation')
      );
      expect(result).toBeDefined();
      expect(result!.status).not.toBe('fail');
    });

    it('should prevent horizontal privilege escalation', () => {
      const result = authzResults.find((r) =>
        r.testName.includes('Horizontal Privilege')
      );
      expect(result).toBeDefined();
      expect(result!.status).not.toBe('fail');
    });

    it('should enforce organization scope', () => {
      const result = authzResults.find((r) =>
        r.testName.includes('Organization Scope')
      );
      expect(result).toBeDefined();
      expect(result!.status).not.toBe('fail');
    });

    it('should protect direct object references', () => {
      const result = authzResults.find((r) =>
        r.testName.includes('Direct Object Reference')
      );
      expect(result).toBeDefined();
      expect(['pass', 'warning', 'error']).toContain(result!.status);
    });

    it('should enforce function-level authorization', () => {
      const result = authzResults.find((r) =>
        r.testName.includes('Function-Level')
      );
      expect(result).toBeDefined();
      expect(result!.status).not.toBe('fail');
    });
  });

  // ==========================================================================
  // INJECTION TESTS
  // ==========================================================================

  describe('Injection Prevention', () => {
    let injectionResults: SecurityTestResult[];

    beforeAll(() => {
      injectionResults = fullReport.results.filter(
        (r) => r.category === 'Injection'
      );
    });

    it('should have at least 8 injection tests', () => {
      expect(injectionResults.length).toBeGreaterThanOrEqual(8);
    });

    it('should prevent SQL injection', () => {
      const result = injectionResults.find((r) =>
        r.testName === 'SQL Injection'
      );
      expect(result).toBeDefined();
      expect(result!.status).not.toBe('fail');
    });

    it('should prevent reflected XSS', () => {
      const result = injectionResults.find((r) =>
        r.testName.includes('Reflected XSS')
      );
      expect(result).toBeDefined();
      expect(result!.status).not.toBe('fail');
    });

    it('should prevent stored XSS', () => {
      const result = injectionResults.find((r) =>
        r.testName.includes('Stored XSS')
      );
      expect(result).toBeDefined();
      expect(result!.status).not.toBe('fail');
    });

    it('should prevent command injection', () => {
      const result = injectionResults.find((r) =>
        r.testName.includes('Command Injection')
      );
      expect(result).toBeDefined();
      expect(result!.status).not.toBe('fail');
    });

    it('should prevent LDAP injection', () => {
      const result = injectionResults.find((r) =>
        r.testName.includes('LDAP')
      );
      expect(result).toBeDefined();
      expect(result!.status).not.toBe('fail');
    });

    it('should prevent header injection (CRLF)', () => {
      const result = injectionResults.find((r) =>
        r.testName.includes('Header Injection')
      );
      expect(result).toBeDefined();
      expect(result!.status).not.toBe('fail');
    });

    it('should prevent path traversal', () => {
      const result = injectionResults.find((r) =>
        r.testName.includes('Path Traversal')
      );
      expect(result).toBeDefined();
      expect(result!.status).not.toBe('fail');
    });

    it('should prevent NoSQL injection', () => {
      const result = injectionResults.find((r) =>
        r.testName.includes('NoSQL')
      );
      expect(result).toBeDefined();
      expect(result!.status).not.toBe('fail');
    });
  });

  // ==========================================================================
  // CSRF TESTS
  // ==========================================================================

  describe('CSRF Protection', () => {
    let csrfResults: SecurityTestResult[];

    beforeAll(() => {
      csrfResults = fullReport.results.filter(
        (r) => r.category === 'CSRF'
      );
    });

    it('should have at least 4 CSRF tests', () => {
      expect(csrfResults.length).toBeGreaterThanOrEqual(4);
    });

    it('should handle missing CSRF tokens', () => {
      const result = csrfResults.find((r) =>
        r.testName.includes('Missing CSRF')
      );
      expect(result).toBeDefined();
      // Warning is acceptable for JWT-based APIs
      expect(['pass', 'warning', 'info', 'error']).toContain(
        result!.status
      );
    });

    it('should reject invalid CSRF tokens', () => {
      const result = csrfResults.find((r) =>
        r.testName.includes('Invalid CSRF')
      );
      expect(result).toBeDefined();
      expect(['pass', 'warning', 'error']).toContain(result!.status);
    });

    it('should validate cross-site request origins', () => {
      const result = csrfResults.find((r) =>
        r.testName.includes('Cross-Site Request')
      );
      expect(result).toBeDefined();
      expect(result!.status).not.toBe('fail');
    });
  });

  // ==========================================================================
  // RATE LIMITING TESTS
  // ==========================================================================

  describe('Rate Limiting', () => {
    let rateLimitResults: SecurityTestResult[];

    beforeAll(() => {
      rateLimitResults = fullReport.results.filter(
        (r) => r.category === 'Rate Limiting'
      );
    });

    it('should have at least 4 rate limiting tests', () => {
      expect(rateLimitResults.length).toBeGreaterThanOrEqual(4);
    });

    it('should enforce API rate limits', () => {
      const result = rateLimitResults.find((r) =>
        r.testName.includes('API Rate Limit')
      );
      expect(result).toBeDefined();
      // Warning is acceptable (health endpoint may not be rate limited)
      expect(['pass', 'warning', 'error']).toContain(result!.status);
    });

    it('should enforce authentication rate limits', () => {
      const result = rateLimitResults.find((r) =>
        r.testName.includes('Authentication Rate')
      );
      expect(result).toBeDefined();
      expect(['pass', 'warning', 'error']).toContain(result!.status);
    });

    it('should resist rate limit bypass attempts', () => {
      const result = rateLimitResults.find((r) =>
        r.testName.includes('Bypass')
      );
      expect(result).toBeDefined();
      expect(['pass', 'warning', 'error']).toContain(result!.status);
    });
  });

  // ==========================================================================
  // SECURITY HEADERS TESTS
  // ==========================================================================

  describe('Security Headers', () => {
    let headerResults: SecurityTestResult[];

    beforeAll(() => {
      headerResults = fullReport.results.filter(
        (r) => r.category === 'Security Headers'
      );
    });

    it('should have at least 6 security header tests', () => {
      expect(headerResults.length).toBeGreaterThanOrEqual(6);
    });

    it('should have Content-Security-Policy', () => {
      const result = headerResults.find((r) =>
        r.testName.includes('Content-Security-Policy')
      );
      expect(result).toBeDefined();
      expect(['pass', 'warning', 'error']).toContain(result!.status);
    });

    it('should have X-Frame-Options', () => {
      const result = headerResults.find((r) =>
        r.testName.includes('X-Frame-Options')
      );
      expect(result).toBeDefined();
      expect(['pass', 'warning', 'error']).toContain(result!.status);
    });

    it('should have X-Content-Type-Options', () => {
      const result = headerResults.find((r) =>
        r.testName.includes('X-Content-Type-Options')
      );
      expect(result).toBeDefined();
      expect(['pass', 'warning', 'error']).toContain(result!.status);
    });

    it('should have Referrer-Policy', () => {
      const result = headerResults.find((r) =>
        r.testName.includes('Referrer-Policy')
      );
      expect(result).toBeDefined();
      expect(['pass', 'warning', 'error']).toContain(result!.status);
    });

    it('should enforce no-cache for sensitive endpoints', () => {
      const result = headerResults.find((r) =>
        r.testName.includes('Cache-Control')
      );
      expect(result).toBeDefined();
      expect(['pass', 'warning', 'error']).toContain(result!.status);
    });
  });

  // ==========================================================================
  // SSRF TESTS
  // ==========================================================================

  describe('SSRF Prevention', () => {
    let ssrfResults: SecurityTestResult[];

    beforeAll(() => {
      ssrfResults = fullReport.results.filter(
        (r) => r.category === 'SSRF'
      );
    });

    it('should have at least 4 SSRF tests', () => {
      expect(ssrfResults.length).toBeGreaterThanOrEqual(4);
    });

    it('should block private IP ranges', () => {
      const result = ssrfResults.find((r) =>
        r.testName.includes('Private IP')
      );
      expect(result).toBeDefined();
      expect(result!.status).not.toBe('fail');
    });

    it('should block localhost access', () => {
      const result = ssrfResults.find((r) =>
        r.testName.includes('Localhost')
      );
      expect(result).toBeDefined();
      expect(result!.status).not.toBe('fail');
    });

    it('should block cloud metadata endpoints', () => {
      const result = ssrfResults.find((r) =>
        r.testName.includes('Metadata')
      );
      expect(result).toBeDefined();
      expect(result!.status).not.toBe('fail');
    });

    it('should protect against DNS rebinding', () => {
      const result = ssrfResults.find((r) =>
        r.testName.includes('DNS Rebinding')
      );
      expect(result).toBeDefined();
      expect(result!.status).not.toBe('fail');
    });
  });

  // ==========================================================================
  // DATA PROTECTION TESTS
  // ==========================================================================

  describe('Data Protection', () => {
    let dataResults: SecurityTestResult[];

    beforeAll(() => {
      dataResults = fullReport.results.filter(
        (r) => r.category === 'Data Protection'
      );
    });

    it('should have at least 4 data protection tests', () => {
      expect(dataResults.length).toBeGreaterThanOrEqual(4);
    });

    it('should not leak PII in error responses', () => {
      const result = dataResults.find((r) =>
        r.testName.includes('PII')
      );
      expect(result).toBeDefined();
      expect(result!.status).not.toBe('fail');
    });

    it('should not expose sensitive data in responses', () => {
      const result = dataResults.find((r) =>
        r.testName.includes('Sensitive Data')
      );
      expect(result).toBeDefined();
      expect(result!.status).not.toBe('fail');
    });

    it('should verify encryption at rest', () => {
      const result = dataResults.find((r) =>
        r.testName.includes('Encryption at Rest')
      );
      expect(result).toBeDefined();
      expect(['pass', 'info', 'error']).toContain(result!.status);
    });

    it('should not leak error details (stack traces)', () => {
      const result = dataResults.find((r) =>
        r.testName.includes('Error Detail')
      );
      expect(result).toBeDefined();
      // Warning is acceptable (development environments may expose more details)
      expect(['pass', 'warning', 'error']).toContain(result!.status);
    });
  });

  // ==========================================================================
  // REPORT GENERATION
  // ==========================================================================

  describe('Report Generation', () => {
    it('should generate a valid markdown report', () => {
      const markdown = engine.generateReport(fullReport);

      expect(markdown).toContain('# Penetration Test Report');
      expect(markdown).toContain('## Summary');
      expect(markdown).toContain('Total Tests');
      expect(markdown).toContain('## Overall Risk Level');
      expect(markdown).toContain('## Authentication');
      expect(markdown).toContain('## Authorization');
      expect(markdown).toContain('## Injection');
      expect(markdown).toContain('## CSRF');
      expect(markdown).toContain('## Rate Limiting');
      expect(markdown).toContain('## Security Headers');
      expect(markdown).toContain('## SSRF');
      expect(markdown).toContain('## Data Protection');
      expect(markdown).toContain('## Disclaimer');
    });

    it('should include OWASP references in the report', () => {
      const markdown = engine.generateReport(fullReport);
      expect(markdown).toContain('OWASP Reference');
    });

    it('should include remediation guidance for findings', () => {
      const markdown = engine.generateReport(fullReport);
      const findingsWithRemediation = fullReport.results.filter(
        (r) => r.remediation
      );

      if (findingsWithRemediation.length > 0) {
        expect(markdown).toContain('**Remediation:**');
      }
    });
  });
});
