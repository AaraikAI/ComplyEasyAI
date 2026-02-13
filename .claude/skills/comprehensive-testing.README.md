# Comprehensive Testing Skill

An autonomous, AI-powered testing skill for Playwright that delivers 100% test coverage across unit, integration, E2E, database, API, visual regression, performance, and security testing layers.

## What This Skill Does

This skill empowers Claude Code to:

- **Generate comprehensive test plans** automatically by exploring your application
- **Write robust tests** covering all test types (unit, integration, E2E)
- **Auto-fix failing tests** when code changes break selectors or assertions
- **Discover untested paths** and suggest missing test coverage
- **Verify database state** after UI actions (CRUD operations, soft deletes, constraints)
- **Test APIs** alongside UI (REST, GraphQL, authentication, error handling)
- **Perform visual regression testing** across multiple breakpoints
- **Run performance/load tests** and track Core Web Vitals
- **Execute security testing** (SQL injection, XSS, CSRF, authentication)

## Key Features

### Autonomous Testing
- **Zero-configuration test generation**: Analyzes your app and writes appropriate tests
- **Intelligent auto-fixing**: Detects and repairs broken tests after refactors
- **Adaptive exploration**: Discovers new features and suggests test coverage
- **Self-healing**: Eliminates flakiness by fixing timing issues and brittle patterns

### Comprehensive Coverage
- **Unit tests**: Component isolation, mocking, edge cases
- **Integration tests**: API contracts, service communication, database flows
- **E2E tests**: User journeys, cross-browser, responsive design
- **Database tests**: Schema validation, integrity checks, transaction behavior
- **API tests**: REST/GraphQL endpoints, auth, error handling, rate limiting
- **Visual tests**: Screenshot comparison, responsive layouts, component states
- **Performance tests**: Load time, Core Web Vitals, API latency, load testing
- **Security tests**: Injection attacks, XSS, CSRF, authorization, compliance

### Best Practices Built-In
- **Page Object Model** for maintainable E2E tests
- **Accessible selectors** (getByRole, getByLabel) over brittle CSS
- **Proper synchronization** using Playwright's auto-waiting
- **Test isolation** with independent data and cleanup
- **Parallel execution** for faster CI/CD pipelines

## Usage Examples

### Generate E2E Tests for User Registration

**Prompt to Claude Code:**
```
Using the comprehensive-testing skill, create E2E tests for our user registration flow at /signup.
The form has name, email, password, and confirm password fields. Test successful registration,
validation errors, and verify the user is created in the database with a hashed password.
```

**What Claude Code Will Do:**
1. Generate a Playwright test file with multiple test cases
2. Use accessible selectors (getByRole, getByLabel)
3. Test happy path and all error scenarios
4. Include database verification queries
5. Validate password hashing
6. Use Page Object Model for reusable code

### API Testing with Database Verification

**Prompt to Claude Code:**
```
Using the comprehensive-testing skill, write API tests for our /api/products endpoints (GET, POST, PUT, DELETE).
Include authentication tests, validation errors, and database verification for each CRUD operation.
```

**What Claude Code Will Do:**
1. Create API test file testing all endpoints
2. Test with/without authentication tokens
3. Validate request/response schemas
4. Test error scenarios (400, 401, 404, 500)
5. Query database to confirm operations succeeded
6. Clean up test data after each test

### Visual Regression Testing

**Prompt to Claude Code:**
```
Using the comprehensive-testing skill, set up visual regression tests for the /pricing page.
Test at mobile, tablet, and desktop breakpoints. Include hover states and modal interactions.
```

**What Claude Code Will Do:**
1. Create visual regression test file
2. Configure multiple viewport sizes
3. Capture baseline screenshots
4. Test component states (default, hover, modal)
5. Set up comparison logic for future runs
6. Handle dynamic content with masking

### Auto-Fix Broken Tests

**Prompt to Claude Code:**
```
Using the comprehensive-testing skill, fix our failing login tests. The selectors broke after
a UI refactor. The test uses .login-btn, #email-input, and .error-msg selectors.
```

**What Claude Code Will Do:**
1. Analyze test failures
2. Identify broken selectors
3. Replace with accessible alternatives (getByRole, getByLabel, getByTestId)
4. Re-run tests to verify fixes
5. Explain changes and why they're more resilient

### Generate Comprehensive Test Plan

**Prompt to Claude Code:**
```
Using the comprehensive-testing skill, analyze our todo application and generate a comprehensive
test plan covering unit, integration, and E2E tests. Prioritize by business impact.
```

**What Claude Code Will Do:**
1. Explore the application structure
2. Identify all user journeys and features
3. Create structured test plan with priorities (P0/P1/P2)
4. Categorize by test type (unit/integration/E2E)
5. Include acceptance criteria
6. Suggest edge cases and test data requirements

## Test Structure

The skill organizes tests following this structure:

```
tests/
├── unit/                     # Unit tests (components, utils, services)
├── integration/              # Integration tests (API, database, auth)
├── e2e/                      # E2E tests (user journeys, flows)
│   ├── auth/
│   ├── checkout/
│   └── admin/
├── visual/                   # Visual regression tests
│   ├── baselines/
│   └── visual.spec.ts
├── performance/              # Performance & load tests
└── security/                 # Security & compliance tests
```

## Configuration

### Playwright Config (Auto-Generated)
The skill will generate or update your `playwright.config.ts` with:
- Multi-browser support (Chromium, Firefox, WebKit)
- Parallel execution configuration
- Screenshot/video capture on failure
- HTML/JUnit/JSON reporters
- Retry logic for flaky tests
- Viewport configurations for responsive testing

### Database Connection (Auto-Configured)
The skill will set up database connections for:
- PostgreSQL, MySQL, SQLite, MongoDB
- Test database isolation
- Transaction rollback between tests
- Connection pooling

## Test Reports

The skill generates comprehensive reports including:
- **Pass/fail summary** with execution time
- **Code coverage** metrics with gaps highlighted
- **Visual diffs** for regression testing
- **Performance trends** over time
- **Security findings** with severity levels
- **Screenshots/videos** on failure
- **Database state** before/after operations

## Test Patterns

### Page Object Model
```typescript
class CheckoutPage {
  constructor(private page: Page) {}

  async addToCart(productId: string) {
    await this.page.getByRole('button', { name: `Add ${productId}` }).click();
  }

  async proceedToCheckout() {
    await this.page.getByRole('button', { name: 'Checkout' }).click();
  }

  async expectCartCount(count: number) {
    await expect(this.page.getByTestId('cart-count')).toHaveText(String(count));
  }
}
```

### Database Verification
```typescript
test('user creation updates database', async ({ page }) => {
  await page.goto('/signup');
  await page.getByLabel('Email').fill('test@example.com');
  await page.getByRole('button', { name: 'Sign Up' }).click();

  // Verify in database
  const user = await db.query('SELECT * FROM users WHERE email = $1', ['test@example.com']);
  expect(user.rows).toHaveLength(1);
  expect(user.rows[0].email).toBe('test@example.com');
  expect(user.rows[0].password).not.toContain('plaintext');
});
```

### API Testing
```typescript
test('POST /api/users validates input', async ({ request }) => {
  const response = await request.post('/api/users', {
    data: { email: 'invalid-email' }
  });

  expect(response.status()).toBe(400);
  const error = await response.json();
  expect(error.errors).toContain('valid email required');
});
```

## When to Use This Skill

Use the comprehensive-testing skill when:

- Building a new application needing complete test coverage
- Improving test coverage on an existing application
- Setting up automated testing in CI/CD pipeline
- Validating critical business flows (checkout, payments, auth)
- Ensuring database integrity across CRUD operations
- Testing API contracts and integrations
- Performing security and compliance audits
- Monitoring application performance and visual regressions
- Debugging failing tests and eliminating flakiness
- Discovering untested code paths and edge cases

## Autonomous Workflow

When Claude Code uses this skill, it follows this workflow:

1. **Analyze**: Explore the application structure (pages, APIs, database)
2. **Plan**: Generate comprehensive test plan with priorities
3. **Write**: Create unit, integration, E2E, and specialized tests
4. **Execute**: Run tests across browsers and environments
5. **Debug**: Analyze failures using logs, screenshots, database state
6. **Fix**: Auto-fix broken selectors, timing issues, flaky tests
7. **Verify**: Re-run tests to confirm fixes and prevent regressions
8. **Report**: Generate comprehensive test results with metrics
9. **Improve**: Suggest coverage gaps and test improvements

## Evaluation Test Cases

The skill includes 12 comprehensive evaluation test cases covering:

1. **E2E User Registration**: Complete user signup flow with validation
2. **API CRUD Testing**: RESTful API testing with database verification
3. **Database Integrity**: Foreign keys, cascades, transactions
4. **Visual Regression**: Multi-breakpoint screenshot comparison
5. **Performance Testing**: Load time, Core Web Vitals, concurrent requests
6. **Security Testing**: SQL injection, XSS, CSRF, authentication
7. **Auto-Fix Selectors**: Intelligent test repair after UI changes
8. **Test Plan Generation**: Comprehensive test planning for todo app
9. **Coverage Gap Analysis**: Identifying untested features in blog app
10. **Integration Auth Flow**: OAuth 2.0 authentication testing
11. **Responsive Design**: Multi-breakpoint layout verification
12. **Flaky Test Fix**: Eliminating race conditions with proper waits

## Getting Started

**For New Projects:**
```
Claude Code, use the comprehensive-testing skill to set up testing for my [app type] application.
Generate a test plan, write initial tests, and configure Playwright.
```

**For Existing Projects:**
```
Claude Code, use the comprehensive-testing skill to analyze my application at [URL/path].
Identify coverage gaps and suggest priority test cases.
```

**For Failing Tests:**
```
Claude Code, use the comprehensive-testing skill to debug and fix the failing tests in [test file].
The tests are failing with [error description].
```

## License

This skill is provided as-is for use with Claude Code and Anthropic's testing frameworks.

## Contributing

To improve this skill:
1. Add new evaluation test cases to `evals/evals.json`
2. Extend the SKILL.md with additional testing patterns
3. Test with real-world applications
4. Provide feedback on autonomous capabilities

---

**Built for Claude Code** | **Powered by Playwright** | **Autonomous Testing at Scale**
