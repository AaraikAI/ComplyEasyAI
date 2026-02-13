---
name: comprehensive-testing
description: Autonomous E2E, integration, and unit testing using Playwright. Generates comprehensive test plans, auto-fixes failing tests, discovers untested paths, includes database verification, API testing, visual regression, performance/load testing, and compliance/security testing. Covers all edge cases with minimal human intervention.
---

# Comprehensive Testing Skill (Autonomous Multi-Layer QA)

## 1. Goal and Scope

This skill uses an AI-assisted Playwright testing framework to achieve **100% test completion** across all layers of an application—from UI flows to database state to API contracts to security compliance—with **minimal human intervention**.

The system autonomously:
- **Generates comprehensive test plans** covering all user journeys, edge cases, and failure scenarios
- **Writes, executes, debugs, and fixes tests** across frontend, backend, database, and API layers
- **Explores the application** to discover untested paths and suggest missing coverage
- **Auto-fixes failing tests** when code changes occur
- **Performs visual regression**, performance/load, and compliance/security testing

---

## 2. Core Testing Capabilities

### 2.1 Unit Testing
- **Component-level isolation**: Tests individual functions, methods, and components in isolation
- **Mock dependencies**: Automatically mocks external dependencies, APIs, and database calls
- **Edge case coverage**: Systematically tests boundary conditions, null/undefined values, empty arrays, invalid inputs
- **Code coverage tracking**: Monitors and reports code coverage, identifies untested branches
- **Fast execution**: Optimized for rapid feedback during development

### 2.2 Integration Testing
- **API contract testing**: Validates request/response schemas, status codes, error handling
- **Service-to-service communication**: Tests interactions between microservices, third-party APIs
- **Database integration**: Verifies data flows through application layers, transaction handling
- **Authentication flows**: Tests OAuth, JWT, session management, role-based access
- **Error propagation**: Ensures errors are properly caught, logged, and handled across layers

### 2.3 End-to-End (E2E) Testing
- **Critical user journeys**: Sign-up, login, checkout, admin workflows, data management
- **Multi-step workflows**: Tests complex sequences with dependencies between steps
- **Cross-browser testing**: Chrome, Firefox, Safari (WebKit), Edge in headless and headed modes
- **Responsive design validation**: Tests across mobile, tablet, desktop breakpoints
- **Real user simulation**: Mimics actual user behavior including delays, navigation patterns
- **Form validation**: Input validation, error messages, field constraints, autocomplete
- **Navigation flows**: Menu navigation, deep linking, breadcrumbs, back/forward buttons
- **CRUD operations**: Create, Read, Update, Delete with full lifecycle verification
- **Screenshot and video capture**: Visual verification and regression review

### 2.4 Database Verification
- **Multi-database support**: PostgreSQL, MySQL, SQLite, MongoDB, Redis, and others
- **Schema validation**: Verifies tables, columns, indexes, constraints, foreign keys
- **Data integrity checks**: Ensures referential integrity, cascade deletes, transactional consistency
- **CRUD verification**: Confirms UI actions correctly create/update/delete database records
- **Soft vs hard delete validation**: Distinguishes between logical and physical deletes
- **Query performance**: Uses EXPLAIN to validate query execution plans and index usage
- **Migration verification**: Tests database migrations for correctness and rollback safety
- **Concurrent access**: Tests for race conditions, deadlocks, locking behavior

### 2.5 API Testing
- **RESTful API validation**: GET, POST, PUT, PATCH, DELETE endpoints
- **GraphQL testing**: Query, mutation, subscription validation with schema checks
- **Request/response validation**: JSON schema validation, content-type verification
- **Authentication/authorization**: API key, OAuth, JWT token validation
- **Rate limiting**: Tests throttling, quota enforcement, retry logic
- **Error handling**: 4xx and 5xx status codes, error message clarity
- **Pagination**: Tests cursor-based and offset-based pagination
- **Filtering and sorting**: Query parameter validation
- **API versioning**: Tests compatibility across API versions

---

## 3. Autonomous Capabilities

### 3.1 Comprehensive Test Plan Generation
The system **automatically generates test plans** by:

1. **Application exploration**:
   - Crawls the application to map all pages, components, and API endpoints
   - Identifies interactive elements (forms, buttons, modals, dropdowns)
   - Discovers navigation paths and user flows

2. **Risk assessment**:
   - Prioritizes critical paths based on business impact
   - Identifies high-risk areas (payment processing, authentication, data manipulation)
   - Considers compliance and security requirements

3. **Coverage analysis**:
   - Identifies gaps in existing test coverage
   - Suggests new test cases for untested code paths
   - Maps edge cases and boundary conditions

4. **Test plan output**:
   - Structured test plan with priorities (P0/P1/P2)
   - User journeys grouped by feature area
   - Acceptance criteria for each test
   - Data requirements and test environments

### 3.2 Auto-Fix Failing Tests
When tests fail due to code changes, the system **autonomously fixes them**:

1. **Intelligent debugging**:
   - Analyzes stack traces, console logs, network logs, screenshots
   - Examines database state before/after failures
   - Identifies root cause: code change, timing issue, or environment drift

2. **Automated repairs**:
   - **Selector updates**: Fixes broken CSS/XPath selectors after UI refactors
   - **Timing adjustments**: Adds proper waits, retries for async operations
   - **Assertion updates**: Adjusts expectations to match new behavior
   - **Test data fixes**: Updates test data when schemas change
   - **Flakiness elimination**: Refactors brittle patterns, removes race conditions

3. **Verification loop**:
   - Re-runs fixed tests to confirm resolution
   - Runs related tests to ensure no regression
   - Updates test documentation with changes made

### 3.3 Application Exploration & Coverage Discovery
The system **actively explores the application** to find untested areas:

1. **UI crawling**:
   - Systematically navigates through all pages and components
   - Clicks through menus, tabs, accordions, modals
   - Discovers hidden or conditional UI elements

2. **API discovery**:
   - Inspects network traffic to identify API endpoints
   - Analyzes OpenAPI/Swagger specs if available
   - Maps API dependencies and data flows

3. **Coverage gaps**:
   - Compares application structure to existing tests
   - Identifies untested features, pages, or API endpoints
   - Suggests new test cases with rationale

4. **Edge case identification**:
   - Generates boundary value tests (min/max, empty, overflow)
   - Creates negative tests (invalid inputs, unauthorized access)
   - Tests error scenarios (network failures, timeouts)

### 3.4 Missing Test Coverage Suggestions
The system **proactively suggests improvements**:

1. **Code coverage analysis**:
   - Identifies untested functions, branches, statements
   - Highlights complex logic lacking coverage
   - Reports coverage metrics (line, branch, function coverage)

2. **User journey gaps**:
   - Detects incomplete workflows (started but not finished)
   - Identifies untested user personas or roles
   - Suggests accessibility testing (keyboard navigation, screen readers)

3. **Security and compliance gaps**:
   - Flags missing authentication/authorization tests
   - Identifies untested sensitive data flows
   - Suggests GDPR, HIPAA, PCI-DSS compliance tests

---

## 4. Specialized Testing

### 4.1 Visual Regression Testing
**Purpose**: Detect unintended visual changes across deployments

1. **Baseline capture**:
   - Takes screenshots of all pages/components in stable state
   - Stores baseline images with naming conventions
   - Supports multiple viewports and browsers

2. **Comparison engine**:
   - Pixel-by-pixel comparison of current vs baseline
   - Handles anti-aliasing, font rendering differences
   - Generates diff images highlighting changes

3. **Approval workflow**:
   - Flags visual changes for human review
   - Supports automatic approval for expected changes
   - Updates baselines after approval

4. **Coverage**:
   - All pages at multiple breakpoints (mobile, tablet, desktop)
   - Interactive states (hover, focus, active)
   - Dynamic content (modals, tooltips, dropdowns)

### 4.2 Performance & Load Testing
**Purpose**: Ensure application performs under realistic and stress conditions

1. **Performance metrics**:
   - **Page load time**: First Contentful Paint, Largest Contentful Paint, Time to Interactive
   - **API response time**: p50, p95, p99 latencies
   - **Resource utilization**: CPU, memory, network bandwidth
   - **Core Web Vitals**: LCP, FID, CLS tracking

2. **Load testing scenarios**:
   - **Ramp-up**: Gradually increase concurrent users (1 → 100 → 1000)
   - **Sustained load**: Maintain constant load for extended period
   - **Spike testing**: Sudden traffic surge (Black Friday scenario)
   - **Stress testing**: Push beyond expected capacity to find breaking point

3. **Bottleneck identification**:
   - Identifies slow database queries
   - Detects memory leaks and resource exhaustion
   - Flags inefficient API calls (N+1 queries)
   - Analyzes frontend bundle sizes

4. **Performance budgets**:
   - Sets thresholds for acceptable performance (e.g., page load < 3s)
   - Fails tests if performance degrades
   - Tracks performance trends over time

### 4.3 Compliance & Security Testing
**Purpose**: Validate security posture and regulatory compliance

1. **Authentication & authorization**:
   - **Unauthorized access**: Attempts to access protected resources without authentication
   - **Privilege escalation**: Tests for vertical/horizontal privilege escalation
   - **Session management**: Validates session timeout, logout, token expiration
   - **Password policies**: Enforces complexity, rotation, storage (hashing)

2. **Input validation & sanitization**:
   - **SQL injection**: Tests for SQL injection vulnerabilities
   - **XSS (Cross-Site Scripting)**: Attempts to inject malicious scripts
   - **CSRF (Cross-Site Request Forgery)**: Validates CSRF token implementation
   - **Command injection**: Tests for OS command injection
   - **Path traversal**: Attempts to access files outside allowed directories

3. **Data protection**:
   - **Encryption in transit**: Verifies HTTPS/TLS for all sensitive data
   - **Encryption at rest**: Validates database encryption, encrypted backups
   - **PII handling**: Tests GDPR compliance (right to be forgotten, data portability)
   - **Sensitive data exposure**: Checks for credentials, tokens in logs or responses

4. **Compliance frameworks**:
   - **GDPR**: Data consent, deletion, export capabilities
   - **HIPAA**: PHI protection, audit logging, access controls
   - **PCI-DSS**: Credit card data handling, tokenization, logging
   - **SOC 2**: Access controls, monitoring, incident response

5. **Security headers**:
   - **Content-Security-Policy**: Tests CSP implementation
   - **X-Frame-Options**: Validates clickjacking protection
   - **Strict-Transport-Security**: Ensures HSTS headers
   - **X-Content-Type-Options**: Prevents MIME sniffing

6. **Dependency scanning**:
   - Checks for known vulnerabilities in npm/pip packages
   - Validates secure dependency versions
   - Tests for supply chain attacks

---

## 5. Complete Development Loop (Playwright-Centric)

The autonomous testing workflow follows this loop:

### 5.1 Build the Application
- Generate or extend an application (e.g., Express.js backend with SQLite and web frontend)
- Follow specification or PRD
- Set up development environment

### 5.2 Generate Test Plan
- **Analyze application**: Explore pages, API endpoints, database schema
- **Identify user journeys**: Map critical paths and edge cases
- **Prioritize tests**: Assign P0 (critical), P1 (important), P2 (nice-to-have)
- **Create test plan document**: Structured plan with acceptance criteria

### 5.3 Generate Tests
**Unit tests**:
- Write tests for individual functions and components
- Mock external dependencies
- Cover edge cases and error conditions

**Integration tests**:
- Write API contract tests
- Test service integrations
- Verify database interactions

**E2E tests**:
- Write Playwright tests for all key user journeys
- Include authentication, navigation, CRUD operations
- Cover responsive design and cross-browser scenarios

**Specialized tests**:
- Visual regression baselines
- Performance benchmarks
- Security and compliance checks

### 5.4 Run Tests
- Execute tests in isolated browser sessions
- Run across multiple environments (local, staging, CI)
- Capture screenshots, videos, network logs
- Record performance metrics

### 5.5 Detect Failures
- Collect detailed error reports:
  - Stack traces
  - Screenshots at failure point
  - Network request/response logs
  - Console errors and warnings
  - Database state snapshots

### 5.6 Fix Issues
**Analyze failures**:
- Categorize failure type (UI change, timing, logic error, environment)
- Identify root cause using logs and stack traces

**Apply fixes**:
- Modify frontend/backend code as needed
- Update test selectors, waits, assertions
- Refactor flaky tests
- Update test data

### 5.7 Verify Database
- Run SQL queries to verify data operations
- Confirm row creation/update/deletion
- Validate referential integrity
- Check for orphaned records

### 5.8 Re-Test
- Re-run failed tests to confirm fixes
- Run full test suite to detect regressions
- Verify all tests pass before marking complete

### 5.9 Report Results
- Generate test report with pass/fail summary
- Highlight coverage gaps and suggestions
- Provide performance metrics
- Flag security or compliance issues

---

## 6. Specialized Testing Agents

To scale and stabilize testing, conceptualize three specialized AI-assisted roles:

### 6.1 Planner Agent
**Role**: Strategic test planning and prioritization

**Responsibilities**:
- **Application exploration**: Maps all pages, components, API endpoints, database tables
- **User journey identification**: Identifies critical paths based on business value
- **Risk assessment**: Prioritizes high-risk areas (payment, authentication, data manipulation)
- **Test plan creation**: Produces structured test plans with priorities, environments, data requirements
- **Coverage gap analysis**: Identifies untested features and suggests new tests

**Outputs**:
- Structured test plan document (JSON or Markdown)
- Prioritized list of user journeys
- Edge case catalog
- Acceptance criteria per test

### 6.2 Generator Agent
**Role**: Writing robust, maintainable test code

**Responsibilities**:
- **Test code generation**: Translates test plan into Playwright test code
- **Best practices**: Uses Page Object Model, reusable helpers, fixtures
- **Selector strategy**: Prefers accessible selectors (role, label) over brittle CSS
- **Data factories**: Creates reusable test data generators
- **Maintainability**: Keeps tests readable, DRY, aligned with project conventions

**Outputs**:
- Playwright test files (*.spec.ts)
- Page Object classes
- Test fixtures and helpers
- Test data factories

### 6.3 Healer Agent
**Role**: Maintaining test health and fixing failures

**Responsibilities**:
- **Failure monitoring**: Continuously monitors test runs for failures and flakiness
- **Root cause analysis**: Diagnoses failures (UI change, timing, environment drift)
- **Automated fixes**: Updates selectors, waits, assertions to adapt to code changes
- **Flakiness reduction**: Refactors brittle patterns, adds proper synchronization
- **Test health metrics**: Tracks test stability, execution time, flakiness rate

**Outputs**:
- Updated test files with fixes
- Flakiness reports
- Selector update logs
- Improvement recommendations

---

## 7. Test Organization & Best Practices

### 7.1 Test Structure
```
tests/
├── unit/
│   ├── components/
│   ├── utils/
│   └── services/
├── integration/
│   ├── api/
│   ├── database/
│   └── auth/
├── e2e/
│   ├── auth/
│   │   ├── login.spec.ts
│   │   └── signup.spec.ts
│   ├── checkout/
│   └── admin/
├── visual/
│   ├── baselines/
│   └── visual.spec.ts
├── performance/
│   └── load.spec.ts
├── security/
│   └── security.spec.ts
└── fixtures/
    ├── test-data.ts
    └── page-objects.ts
```

### 7.2 Naming Conventions
- **Test files**: `feature-name.spec.ts`
- **Test descriptions**: Use clear, behavior-driven descriptions
  - ❌ "Test login"
  - ✅ "User can log in with valid credentials"
  - ✅ "Login fails with invalid password"
- **Selectors**: Prefer accessible selectors
  - ✅ `page.getByRole('button', { name: 'Submit' })`
  - ✅ `page.getByLabel('Email address')`
  - ⚠️ `page.locator('.submit-btn')` (brittle)

### 7.3 Page Object Model
Encapsulate page interactions in reusable classes:

```typescript
class LoginPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/login');
  }

  async login(email: string, password: string) {
    await this.page.getByLabel('Email').fill(email);
    await this.page.getByLabel('Password').fill(password);
    await this.page.getByRole('button', { name: 'Log in' }).click();
  }

  async expectLoginSuccess() {
    await expect(this.page).toHaveURL('/dashboard');
  }
}
```

### 7.4 Test Data Management
- **Fixtures**: Use Playwright fixtures for test setup/teardown
- **Factories**: Create data factories for generating test data
- **Isolation**: Each test should create its own data to avoid dependencies
- **Cleanup**: Clean up test data after each run
- **Seed data**: Use consistent seed data for predictable tests

### 7.5 Synchronization
- **Auto-waiting**: Leverage Playwright's auto-waiting for elements
- **Explicit waits**: Use `waitForSelector`, `waitForResponse` when needed
- **Avoid hardcoded delays**: Never use `page.waitForTimeout()` unless absolutely necessary
- **Network idle**: Wait for network idle state when appropriate

---

## 8. Execution Strategy

### 8.1 Test Execution Modes
- **Local development**: Fast feedback for developers
  - Run affected tests only
  - Use headed mode for debugging
  - Skip slow tests (performance, visual)

- **CI/CD pipeline**: Comprehensive validation
  - Run full test suite
  - Parallel execution across workers
  - Generate detailed reports
  - Upload artifacts (screenshots, videos)

- **Scheduled runs**: Regular health checks
  - Nightly runs on staging/production
  - Visual regression comparison
  - Performance benchmark tracking

### 8.2 Parallelization
- **Worker allocation**: Distribute tests across multiple workers
- **Test sharding**: Split test suite across CI jobs
- **Browser contexts**: Isolate tests with separate browser contexts
- **Database isolation**: Use separate test databases per worker

### 8.3 Retry Strategy
- **Flaky test retry**: Retry failed tests up to 2 times
- **Categorize failures**: Distinguish flakiness from real failures
- **Quarantine**: Mark consistently flaky tests for investigation
- **Healer intervention**: Automatically fix flaky tests

### 8.4 Reporting
- **Test results**: Pass/fail summary with execution time
- **Coverage reports**: Code coverage metrics with gaps highlighted
- **Visual diffs**: Side-by-side comparison of visual changes
- **Performance trends**: Charts showing performance over time
- **Security findings**: List of vulnerabilities with severity
- **Artifact links**: Screenshots, videos, trace files

---

## 9. Database Testing Deep Dive

### 9.1 Connection Management
```typescript
import { Pool } from 'pg';

const pool = new Pool({
  host: 'localhost',
  database: 'test_db',
  user: 'test_user',
  password: 'test_pass',
});

async function query(sql: string, params?: any[]) {
  const client = await pool.connect();
  try {
    return await client.query(sql, params);
  } finally {
    client.release();
  }
}
```

### 9.2 Verification Patterns
**After creating a user**:
```typescript
// UI action
await page.getByLabel('Name').fill('John Doe');
await page.getByLabel('Email').fill('john@example.com');
await page.getByRole('button', { name: 'Create User' }).click();

// Database verification
const result = await query('SELECT * FROM users WHERE email = $1', ['john@example.com']);
expect(result.rows).toHaveLength(1);
expect(result.rows[0].name).toBe('John Doe');
expect(result.rows[0].created_at).toBeTruthy();
```

**After soft delete**:
```typescript
await page.getByRole('button', { name: 'Delete' }).click();

// Verify soft delete (deleted_at set, record still exists)
const result = await query('SELECT * FROM users WHERE id = $1', [userId]);
expect(result.rows[0].deleted_at).toBeTruthy();
```

**Referential integrity**:
```typescript
// Verify cascade delete
await query('DELETE FROM users WHERE id = $1', [userId]);
const orders = await query('SELECT * FROM orders WHERE user_id = $1', [userId]);
expect(orders.rows).toHaveLength(0);
```

### 9.3 Migration Testing
- **Up migration**: Apply migration, verify schema changes
- **Down migration**: Rollback migration, verify revert
- **Data migration**: Verify data transformed correctly
- **Constraints**: Ensure constraints enforced after migration

---

## 10. API Testing Deep Dive

### 10.1 REST API Testing
```typescript
test('GET /api/users returns user list', async ({ request }) => {
  const response = await request.get('/api/users');
  expect(response.status()).toBe(200);

  const users = await response.json();
  expect(users).toBeInstanceOf(Array);
  expect(users[0]).toHaveProperty('id');
  expect(users[0]).toHaveProperty('email');
});

test('POST /api/users creates new user', async ({ request }) => {
  const response = await request.post('/api/users', {
    data: { name: 'Jane Doe', email: 'jane@example.com' }
  });

  expect(response.status()).toBe(201);
  const user = await response.json();
  expect(user.id).toBeTruthy();
  expect(user.name).toBe('Jane Doe');

  // Verify in database
  const dbUser = await query('SELECT * FROM users WHERE id = $1', [user.id]);
  expect(dbUser.rows[0].email).toBe('jane@example.com');
});
```

### 10.2 Authentication Testing
```typescript
test('API requires authentication', async ({ request }) => {
  const response = await request.get('/api/protected');
  expect(response.status()).toBe(401);
});

test('API accepts valid JWT token', async ({ request }) => {
  const token = await getAuthToken();
  const response = await request.get('/api/protected', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  expect(response.status()).toBe(200);
});
```

### 10.3 Error Handling
```typescript
test('API returns 400 for invalid input', async ({ request }) => {
  const response = await request.post('/api/users', {
    data: { email: 'invalid-email' } // Missing name, invalid email
  });

  expect(response.status()).toBe(400);
  const error = await response.json();
  expect(error.message).toContain('validation');
  expect(error.errors).toContain('name is required');
});
```

---

## 11. Visual Regression Testing Deep Dive

### 11.1 Baseline Creation
```typescript
test('capture homepage baseline', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveScreenshot('homepage.png');
});

test('capture homepage mobile', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('/');
  await expect(page).toHaveScreenshot('homepage-mobile.png');
});
```

### 11.2 Component-Level Visual Testing
```typescript
test('button hover state', async ({ page }) => {
  await page.goto('/components');
  const button = page.getByRole('button', { name: 'Submit' });

  await expect(button).toHaveScreenshot('button-default.png');
  await button.hover();
  await expect(button).toHaveScreenshot('button-hover.png');
});
```

### 11.3 Handling Dynamic Content
```typescript
test('modal with dynamic content', async ({ page }) => {
  await page.goto('/');

  // Mask dynamic elements
  await expect(page).toHaveScreenshot({
    mask: [page.locator('.timestamp'), page.locator('.user-avatar')]
  });
});
```

---

## 12. Performance Testing Deep Dive

### 12.1 Page Performance
```typescript
import { test, expect } from '@playwright/test';

test('homepage loads within 3 seconds', async ({ page }) => {
  const startTime = Date.now();
  await page.goto('/');
  await page.waitForLoadState('load');
  const loadTime = Date.now() - startTime;

  expect(loadTime).toBeLessThan(3000);
});

test('measure Core Web Vitals', async ({ page }) => {
  await page.goto('/');

  const metrics = await page.evaluate(() => {
    return new Promise((resolve) => {
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lcp = entries.find(e => e.entryType === 'largest-contentful-paint');
        resolve({ lcp: lcp?.startTime });
      }).observe({ entryTypes: ['largest-contentful-paint'] });
    });
  });

  expect(metrics.lcp).toBeLessThan(2500); // Good LCP threshold
});
```

### 12.2 API Performance
```typescript
test('API response time < 200ms', async ({ request }) => {
  const startTime = Date.now();
  const response = await request.get('/api/users');
  const responseTime = Date.now() - startTime;

  expect(response.status()).toBe(200);
  expect(responseTime).toBeLessThan(200);
});
```

### 12.3 Load Testing (with external tools)
Integrate k6 or Artillery for load testing:

```typescript
// k6 script example
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '2m', target: 100 },  // Ramp up to 100 users
    { duration: '5m', target: 100 },  // Stay at 100 users
    { duration: '2m', target: 0 },    // Ramp down
  ],
};

export default function () {
  let res = http.get('https://example.com/api/users');
  check(res, { 'status is 200': (r) => r.status === 200 });
  sleep(1);
}
```

---

## 13. Security Testing Deep Dive

### 13.1 SQL Injection Testing
```typescript
test('prevents SQL injection in search', async ({ page, request }) => {
  // Attempt SQL injection
  const maliciousInput = "'; DROP TABLE users; --";

  await page.goto('/search');
  await page.getByLabel('Search').fill(maliciousInput);
  await page.getByRole('button', { name: 'Search' }).click();

  // Verify table still exists
  const result = await query('SELECT COUNT(*) FROM users');
  expect(result.rows[0].count).toBeGreaterThan(0);

  // Verify API also protects
  const response = await request.get(`/api/search?q=${encodeURIComponent(maliciousInput)}`);
  expect(response.status()).not.toBe(500); // Should handle gracefully
});
```

### 13.2 XSS Testing
```typescript
test('prevents XSS in user input', async ({ page }) => {
  const xssPayload = '<script>alert("XSS")</script>';

  await page.goto('/profile');
  await page.getByLabel('Bio').fill(xssPayload);
  await page.getByRole('button', { name: 'Save' }).click();

  // Reload and check if script is rendered as text, not executed
  await page.reload();
  const bio = await page.getByTestId('user-bio').innerHTML();
  expect(bio).not.toContain('<script>');
  expect(bio).toContain('&lt;script&gt;'); // Should be escaped
});
```

### 13.3 Authentication & Authorization
```typescript
test('unauthorized user cannot access admin page', async ({ page }) => {
  await page.goto('/admin');
  await expect(page).toHaveURL('/login'); // Should redirect
});

test('regular user cannot perform admin actions', async ({ page, request }) => {
  // Login as regular user
  await loginAsUser(page, 'user@example.com');

  // Attempt admin API call
  const response = await request.delete('/api/admin/users/123');
  expect(response.status()).toBe(403); // Forbidden
});
```

### 13.4 CSRF Protection
```typescript
test('API rejects requests without CSRF token', async ({ request }) => {
  const response = await request.post('/api/transfer', {
    data: { amount: 1000, to: 'attacker' }
    // Missing CSRF token
  });

  expect(response.status()).toBe(403);
});
```

---

## 14. Debugging & Troubleshooting

### 14.1 Debug Mode
Run tests in headed mode with slow motion:
```bash
npx playwright test --headed --slow-mo=1000
```

### 14.2 Screenshots on Failure
```typescript
test('login with invalid credentials', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill('wrong@example.com');
  await page.getByLabel('Password').fill('wrongpass');
  await page.getByRole('button', { name: 'Log in' }).click();

  // Auto-screenshot on failure
  await expect(page.locator('.error')).toBeVisible();
});
```

### 14.3 Trace Files
```typescript
import { test } from '@playwright/test';

test.use({ trace: 'on-first-retry' });

test('complex workflow', async ({ page }) => {
  // Trace will be recorded if test fails and retries
  // View with: npx playwright show-trace trace.zip
});
```

### 14.4 Console Logs
```typescript
test('check console for errors', async ({ page }) => {
  const messages: string[] = [];

  page.on('console', msg => {
    if (msg.type() === 'error') {
      messages.push(msg.text());
    }
  });

  await page.goto('/');

  expect(messages).toHaveLength(0); // No console errors
});
```

---

## 15. CI/CD Integration

### 15.1 GitHub Actions Example
```yaml
name: Playwright Tests
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        browser: [chromium, firefox, webkit]

    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright Browsers
        run: npx playwright install --with-deps

      - name: Run Playwright tests
        run: npx playwright test --project=${{ matrix.browser }}

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report-${{ matrix.browser }}
          path: playwright-report/
```

### 15.2 Docker Integration
```dockerfile
FROM mcr.microsoft.com/playwright:v1.40.0-jammy

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

CMD ["npx", "playwright", "test"]
```

---

## 16. Reporting & Metrics

### 16.1 HTML Report
Generate comprehensive HTML reports:
```bash
npx playwright test --reporter=html
```

### 16.2 JUnit XML (for CI)
```typescript
// playwright.config.ts
export default {
  reporter: [
    ['html'],
    ['junit', { outputFile: 'results.xml' }],
    ['json', { outputFile: 'results.json' }],
  ],
};
```

### 16.3 Custom Metrics
Track custom metrics in tests:
```typescript
test('track test metrics', async ({ page }) => {
  const startTime = Date.now();

  await page.goto('/');
  const navigationTime = Date.now() - startTime;

  // Log metrics
  console.log(JSON.stringify({
    metric: 'navigation_time',
    value: navigationTime,
    url: '/',
  }));
});
```

---

## 17. Best Practices Summary

### 17.1 Test Independence
- Each test should run independently
- No shared state between tests
- Clean up test data after each run
- Use fixtures for setup/teardown

### 17.2 Readability
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)
- Keep tests focused on single behavior
- Avoid long, complex tests

### 17.3 Maintainability
- Use Page Object Model
- Extract reusable helpers
- Keep selectors in one place
- Document complex test logic

### 17.4 Reliability
- Avoid hardcoded waits
- Use proper synchronization
- Handle flakiness proactively
- Retry transient failures

### 17.5 Speed
- Run tests in parallel
- Skip slow tests in development
- Use test.skip() for broken tests (temporarily)
- Optimize database queries

---

## 18. Autonomous Testing Workflow Summary

When Claude Code uses this skill, it follows this workflow:

1. **Analyze the application**:
   - Explore pages, API endpoints, database schema
   - Identify user journeys and critical paths

2. **Generate test plan**:
   - Create structured test plan with priorities
   - Identify edge cases and acceptance criteria

3. **Write tests**:
   - Generate unit, integration, E2E tests
   - Include database verification, API testing
   - Add visual regression, performance, security tests

4. **Execute tests**:
   - Run tests across browsers and environments
   - Capture screenshots, videos, logs

5. **Analyze failures**:
   - Categorize failures (code change, timing, environment)
   - Identify root cause using logs and traces

6. **Auto-fix issues**:
   - Update selectors, waits, assertions
   - Refactor flaky tests
   - Fix timing and synchronization issues

7. **Verify fixes**:
   - Re-run failed tests
   - Run full suite to prevent regressions

8. **Report results**:
   - Generate comprehensive test report
   - Highlight coverage gaps
   - Suggest improvements

9. **Continuous improvement**:
   - Monitor test health over time
   - Identify and eliminate flakiness
   - Expand test coverage based on gaps

---

## 19. When to Use This Skill

Use this comprehensive testing skill when:
- Building a new application that needs complete test coverage
- Improving test coverage on an existing application
- Setting up automated testing in CI/CD pipeline
- Validating critical business flows (e.g., checkout, payments)
- Ensuring database integrity across CRUD operations
- Testing API contracts and integrations
- Performing security and compliance audits
- Monitoring application performance and visual regressions
- Debugging failing tests and eliminating flakiness

The skill is designed for **autonomous operation** with minimal human intervention, making it ideal for rapid development cycles and maintaining high-quality standards.

---

## 20. Conclusion

This comprehensive testing skill empowers Claude Code to deliver **production-ready test coverage** across all layers of an application. By combining unit, integration, E2E, database, API, visual, performance, and security testing with **autonomous capabilities** (test plan generation, auto-fixing, exploration, coverage suggestions), it ensures **100% test completion** with minimal manual effort.

The skill follows industry best practices (Page Object Model, proper synchronization, test isolation) while providing specialized agents (Planner, Generator, Healer) to scale and stabilize testing efforts.

With this skill, Claude Code can independently test applications from end to end, catch regressions early, identify security vulnerabilities, and maintain test health over time—delivering confidence in code quality and accelerating development velocity.
