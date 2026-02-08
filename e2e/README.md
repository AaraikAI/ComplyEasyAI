# E2E Tests (Playwright)

Critical user flows and smoke tests for ComplyEasy AI.

## Prerequisites

- Node 18+
- Backend optional for full flows (frontend-only smoke test will run without it)

## Run locally

**Option A – Let Playwright start the app**

```bash
npm run e2e
```

Playwright will run `npm run dev` and wait for `http://localhost:3000` before running tests.

**Option B – Run app and tests separately**

```bash
# Terminal 1
npm run dev

# Terminal 2 (optional: point to existing app)
E2E_BASE_URL=http://localhost:3000 npm run e2e
```

## Run a subset

- Chromium only: `npx playwright test --project=chromium`
- Smoke test only: `npx playwright test -g "App loads"`
- One file: `npx playwright test e2e/critical-flows.spec.ts`

## Auth

For flows that require login, set:

- `TEST_USER_EMAIL`
- `TEST_USER_PASSWORD`

Use `e2e/auth.setup.ts` and add a project that depends on the auth setup (see [Playwright auth](https://playwright.dev/docs/auth)).

## CI

Set `CI=1` so Playwright uses one worker and does not start the web server (start it in the pipeline). Set `E2E_BASE_URL` to the deployed or staged app URL.
