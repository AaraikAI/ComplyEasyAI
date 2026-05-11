# E2E Tests — ComplyEasyAI

Playwright suite covering critical user flows. Runs against the frontend (and optionally a running backend) to catch UX regressions that unit + integration tests miss.

See the [root README](../README.md) for product context.

## Prerequisites

- Node 18+
- Backend optional — frontend-only smoke runs without it; framework-/billing-/evidence-flow tests need the backend reachable

## Run

**Auto-start the app**

```bash
npm run e2e
```

Playwright runs `npm run dev` and waits for `http://localhost:3000` before executing the spec set.

**Against an already-running app**

```bash
# Terminal 1
npm run dev

# Terminal 2
E2E_BASE_URL=http://localhost:3000 npm run e2e
```

**Against staging / production**

```bash
E2E_BASE_URL=https://staging.complyeasyai.com \
  TEST_USER_EMAIL=qa@aaraik.ai \
  TEST_USER_PASSWORD=$STAGING_QA_PASS \
  npm run e2e -- --grep @prod-safe
```

Only tests tagged `@prod-safe` are non-mutating and safe to run against production.

## Run a subset

```bash
npx playwright test --project=chromium                    # chromium only
npx playwright test -g "App loads"                        # by name
npx playwright test e2e/critical-flows.spec.ts            # one file
npx playwright test --grep "@smoke" --workers=2           # tagged + concurrency
```

> **Workers note:** the full suite uses `--workers=2` to avoid CPU exhaustion on Apple Silicon. Adjust as needed.

## Auth

Flows that require login read `TEST_USER_EMAIL` + `TEST_USER_PASSWORD` from the environment. The `auth.setup.ts` project produces a logged-in browser-state file that downstream specs depend on (see [Playwright auth](https://playwright.dev/docs/auth)).

## Test taxonomy

| Suite | Coverage |
|-------|----------|
| `critical-flows.spec.ts` | login → first-framework → first-evidence → dashboard |
| `auth.spec.ts` | signup, login, password reset, 2FA, SSO |
| `compliance.spec.ts` | SOC 2 / ISO 27001 / HIPAA / PCI-DSS / NIST CSF setup |
| `evidence.spec.ts` | upload, review, approve workflow |
| `governance.spec.ts` | DPO, committees, escalation paths |
| `breach.spec.ts` | breach notification wizard + jurisdiction detection |
| `billing.spec.ts` | subscription tier upgrade/downgrade |
| `smoke.spec.ts` | top-line health (always tagged `@smoke @prod-safe`) |

## CI

Set `CI=1` so Playwright uses one worker and does NOT start the web server (the CI pipeline starts it). Set `E2E_BASE_URL` to the deployed/staged URL. The full e2e suite runs on every PR; the `@smoke` subset also runs on `main` push as a post-deploy sanity check. Failures block merge.

## Debugging

```bash
npm run e2e -- --debug                  # Playwright Inspector
npm run e2e -- --headed                 # see the browser
npm run e2e -- --trace on               # capture traces
npx playwright show-trace test-results/<spec>/trace.zip
```

## Reporting & artifacts

- HTML report: `test-results/html/index.html`
- Traces, screenshots, videos: `test-results/<spec-name>/`
- CI uploads `test-results/` as a workflow artifact on failure

## Writing new tests

- Prefer the `apiClient` fixture in `fixtures/` for state setup — faster than UI-driving every prereq.
- Use page object models in `pages/` for stable selectors; avoid raw `data-testid` in spec bodies.
- Tag tests: `@smoke` for fast happy paths, `@prod-safe` for non-mutating, `@flaky` for known flakes (auto-retried 3x).
- Set up state in `beforeEach`; clean up in `afterEach`. The Postgres test DB is wiped before each suite run.

## Known gotchas

- Vite dev server takes ~10s to compile on first run — `webServer.timeout` is set to 120s in `playwright.config.ts`.
- File-upload tests need `evidence-fixtures/` populated; CI restores it from S3 before the suite runs.
- WebSocket-driven tests use the `waitForRealtimeEvent` helper rather than arbitrary timeouts.
