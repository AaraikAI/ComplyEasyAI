# Test Environment Setup Guide

This guide explains how to set up the test environment for running all tests in the ComplyEasyAI backend.

## Prerequisites

1. **Node.js** (v20 or higher)
2. **PostgreSQL** (v14 or higher) - for integration and E2E tests
3. **npm** or **yarn**

## Quick Start

### 1. Install Dependencies

```bash
cd server
npm install
```

### 2. Set Up Test Database

The test setup uses a separate test database. You can either:

#### Option A: Use Docker (Recommended)

```bash
# Start PostgreSQL in Docker
docker run --name complyeasy-test-db \
  -e POSTGRES_USER=test \
  -e POSTGRES_PASSWORD=test \
  -e POSTGRES_DB=test_db \
  -p 5433:5432 \
  -d postgres:14

# Update DATABASE_URL in test setup if using different port
```

#### Option B: Use Local PostgreSQL

```bash
# Create test database
createdb test_db -U postgres

# Or using psql
psql -U postgres -c "CREATE DATABASE test_db;"
psql -U postgres -c "CREATE USER test WITH PASSWORD 'test';"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE test_db TO test;"
```

### 3. Run Database Migrations

```bash
# Generate Prisma Client
npm run prisma:generate

# Run migrations on test database
DATABASE_URL="postgresql://test:test@localhost:5432/test_db" npx prisma migrate deploy
```

### 4. Environment Variables

The test setup automatically configures environment variables in `src/__tests__/setup.ts`. 

For local testing, you can create a `.env.test` file (optional):

```bash
cp src/__tests__/test.env.example .env.test
```

**Note:** The test setup file (`src/__tests__/setup.ts`) already sets all required test environment variables, so creating `.env.test` is optional.

## Running Tests

### All Tests

```bash
npm test
```

### Test Categories

```bash
# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# E2E tests only
npm run test:e2e

# All test types
npm run test:all
```

### With Coverage

```bash
npm run test:coverage
```

### Watch Mode

```bash
npm run test:watch
```

## Test Structure

```
server/src/__tests__/
├── setup.ts              # Global test setup and environment configuration
├── mocks/
│   └── prisma.ts         # Prisma client mock
├── unit/                 # Unit tests (no database required)
│   └── services/
│       └── advanced/     # Advanced feature service tests
├── integration/          # Integration tests (requires database)
│   └── api/              # API endpoint tests
└── e2e/                  # End-to-end tests (requires full stack)
    ├── auth-flow.test.ts
    └── risk-management-flow.test.ts
```

## CI/CD Configuration

The GitHub Actions workflow (`.github/workflows/ci.yml`) automatically:

1. Sets up PostgreSQL service
2. Configures test environment variables
3. Runs database migrations
4. Executes all test suites

### CI Environment Variables

The CI workflow sets these environment variables:

```yaml
env:
  NODE_ENV: test
  JWT_SECRET: test-jwt-secret-key-for-testing-purposes-only-min-32-chars
  JWT_REFRESH_SECRET: test-refresh-secret-key-for-testing-purposes-only-min-32-chars
  ENCRYPTION_KEY: test-encryption-key-32-chars-minimum-length-required!!!
  DATABASE_URL: postgresql://test:test@localhost:5432/test
```

## Troubleshooting

### Database Connection Errors

If tests fail with database connection errors:

1. **Check PostgreSQL is running:**
   ```bash
   psql -U test -d test_db -c "SELECT 1;"
   ```

2. **Verify DATABASE_URL in test setup:**
   ```bash
   grep DATABASE_URL server/src/__tests__/setup.ts
   ```

3. **Check database permissions:**
   ```bash
   psql -U postgres -c "\du test"
   ```

### Memory Issues

If tests fail with "JavaScript heap out of memory":

- Tests are configured with `NODE_OPTIONS=--max-old-space-size=4096`
- This is already set in `package.json` test scripts
- If issues persist, increase the memory limit

### TypeScript Compilation Errors

If you see TypeScript errors in test files:

1. **Regenerate Prisma Client:**
   ```bash
   npm run prisma:generate
   ```

2. **Check for missing dependencies:**
   ```bash
   npm install
   ```

3. **Verify test mocks match service signatures:**
   - Check actual service method signatures
   - Update test mocks accordingly

### Test Timeouts

If tests timeout:

- Default timeout is 30 seconds (set in `src/__tests__/setup.ts`)
- For slow tests, increase timeout:
  ```typescript
  jest.setTimeout(60000); // 60 seconds
  ```

## Test Database Cleanup

Tests should clean up after themselves, but if needed:

```bash
# Drop and recreate test database
psql -U postgres -c "DROP DATABASE IF EXISTS test_db;"
psql -U postgres -c "CREATE DATABASE test_db;"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE test_db TO test;"

# Run migrations again
DATABASE_URL="postgresql://test:test@localhost:5432/test_db" npx prisma migrate deploy
```

## Advanced Configuration

### Custom Test Database URL

Override the default test database URL:

```bash
DATABASE_URL="postgresql://user:pass@host:port/db" npm test
```

### Parallel Test Execution

Tests run in parallel by default (50% of CPU cores). To run serially:

```bash
npm run test:single
```

### Debugging Tests

Run tests with Node.js debugger:

```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

Then open Chrome DevTools at `chrome://inspect`

## Best Practices

1. **Isolate Tests:** Each test should be independent
2. **Clean Up:** Use `beforeEach`/`afterEach` to reset state
3. **Mock External Services:** Don't make real API calls in tests
4. **Use Test Database:** Never use production database for tests
5. **Fast Tests:** Keep unit tests fast (< 100ms each)
6. **Clear Mocks:** Reset mocks between tests

## Support

For issues or questions:
- Check test logs for detailed error messages
- Review `src/__tests__/setup.ts` for configuration
- Verify database connectivity
- Check GitHub Actions logs for CI failures

