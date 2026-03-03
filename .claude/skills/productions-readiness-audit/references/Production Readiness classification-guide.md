# Classification Guide (Visionary Edition)

When reviewing scan findings, every single result must be classified. This guide helps make consistent, accurate classifications by providing decision trees, AST-level context resolution, and examples.

## The Four Classifications

| Classification | Meaning | Action |
|---|---|---|
| `INTENTIONAL_FEATURE` | Code IS the product (e.g., a mock interview tool, simulation engine, red team tool, Monte Carlo, test generator, digital twin, phishing simulator, placeholder UI text that is the actual content). | No action. Note in report as confirmed intentional. |
| `DEV_FALLBACK` | Has a production guard — `process.env.NODE_ENV`, feature flag, config switch, or conditional that disables it in prod. | Note in report. Verify the guard works. Low priority. |
| `PRODUCTION_GAP` | Missing real implementation. Code that needs to change before production. | **Must be in the fix list with full instructions and a patch.** |
| `FALSE_POSITIVE` | Grep matched but context shows it's fine. Keyword appears in a variable name, comment about completed work, documentation, etc. | Exclude from report. |

## Decision Trees

### "mock" keyword found
```
Is it in a test file? → Skip (should have been excluded)
Is "mock" part of a word like "mockup", "mockingbird"? → FALSE_POSITIVE
Is it a mock service/function in production code?
  → Does it have a NODE_ENV/feature flag guard? → DEV_FALLBACK
  → Is it the product (e.g., mock interview app)? → INTENTIONAL_FEATURE
  → Neither? → PRODUCTION_GAP
```

### "TODO" found
```
Does the comment say "TODO: done" or "TODO: completed in PR #X"? → FALSE_POSITIVE
Is it "TODO" in a string literal (UI text "TODO list app")? → FALSE_POSITIVE
Is it a genuine work item that needs doing? → PRODUCTION_GAP
  Priority depends on what's TODO:
  - "TODO: implement auth" → Critical
  - "TODO: add telemetry" → Medium
  - "TODO: optimize query" → Low (unless perf is critical)
```

### "return null" / "return []" found
```
Read the full function:
Is this the "not found" / "no results" path of a function that also has a success path? → FALSE_POSITIVE
Is this the ONLY return in the function (function always returns empty)? → PRODUCTION_GAP
Is it a placeholder return at the end of an unfinished function? → PRODUCTION_GAP
Is it behind a feature flag / env check? → DEV_FALLBACK
```

#### AST Context Resolution (VISIONARY)

When `return null` or `return []` is found, go beyond the function itself — trace its callers:

1. **AST Check**: Use AST resolution (or grep-based call graph) to trace all callers of the function. Do they expect real data (e.g., mapping over results, rendering lists, computing totals)?
2. **Caller Expectation Analysis**: If callers iterate, render, or compute from the return value, a stub return is a **silent failure** — the feature appears to work but produces empty/broken output.
3. **Healer Action**: If callers expect data but the function is a stub, classify as `PRODUCTION_GAP`. The fix instruction MUST synthesize the real implementation — the actual DB query, API call, or computation — not just flag it for later.

```bash
# Example: Find all callers of a suspected stub function
grep -rn "functionName(" --include="*.ts" --include="*.tsx" --include="*.js" | grep -v node_modules | grep -v test | grep -v "function functionName\|const functionName"
# Then read each caller to see what it does with the return value
```

### "placeholder" found
```
Is it an HTML/JSX input placeholder attribute? → Usually FALSE_POSITIVE
Is it placeholder text like "Lorem ipsum" in a content area? → PRODUCTION_GAP (unless it's a template)
Is it "placeholder" in a variable/function name? → Read context, likely FALSE_POSITIVE
Is it a placeholder implementation? → PRODUCTION_GAP
```

### "localhost" / "127.0.0.1" found
```
Is it in a .env file or .env.example? → FALSE_POSITIVE (that's where it belongs)
Is it in code with a process.env/config fallback?
  e.g., `const url = process.env.API_URL || 'http://localhost:3000'`
  → DEV_FALLBACK (acceptable, but verify the env var is set in production)
Is it hardcoded without any env var reference?
  → PRODUCTION_GAP (Critical if it's an API URL, Medium if it's a dev tool URL)
```

### "console.log" found
```
Is it in a logger configuration file? → FALSE_POSITIVE
Is it in a development-only utility? → DEV_FALLBACK
Is it in a service/controller/route handler? → PRODUCTION_GAP (Medium severity)
  Note: This is a code quality issue, not usually a deployment blocker.
  But excessive console.log can leak sensitive data and hurt performance.
```

### "Math.random()" found
```
Is it in a simulation/testing feature that IS the product? → INTENTIONAL_FEATURE
Is it generating UUIDs or session IDs? → PRODUCTION_GAP (use crypto.randomUUID())
Is it in a seed/faker file for test data? → FALSE_POSITIVE
Is it in business logic that should use deterministic or crypto-secure randomness? → PRODUCTION_GAP
```

## Writing Fix Instructions

For every PRODUCTION_GAP, the fix instruction must be **implementable without guessing**. Here's the template:

### Bad fix instruction:
> "Implement proper error handling"

### Good fix instruction:
> Replace the empty catch block at line 45 with:
> ```typescript
> catch (error) {
>   logger.error('Failed to process invoice', { 
>     invoiceId, 
>     error: error instanceof Error ? error.message : String(error),
>     stack: error instanceof Error ? error.stack : undefined
>   });
>   throw new AppError('INVOICE_PROCESSING_FAILED', 'Failed to process invoice', 500, error);
> }
> ```
> This requires the `AppError` class from `src/utils/errors.ts` and the `logger` from `src/utils/logger.ts`. If these don't exist yet, create them as part of the deployment blockers fixes.

### Fix instruction checklist:
- [ ] Exact file path and line number
- [ ] The current problematic code (so the developer can find it)
- [ ] The replacement code or detailed specification
- [ ] Any dependencies the fix requires (other files, packages, DB changes)
- [ ] Whether this fix depends on another fix being done first

## Severity Guidelines

| Severity | Criteria | Examples |
|----------|----------|---------|
| **Critical** | App will crash, data will be lost, security vulnerability, core feature completely non-functional | Missing auth on sensitive endpoints, SQL injection, empty service that should return real data, missing DB table |
| **High** | Feature significantly broken, poor user experience, missing important validation | Mock data shown to users, missing error handling that causes silent failures, missing input validation |
| **Medium** | Feature works but has issues, code quality problems, missing best practices | Console.log in production, missing rate limiting, hardcoded URLs with env fallback, missing indexes |
| **Low** | Nice-to-have improvements, minor code quality | Outdated TODO comments, minor naming inconsistencies, missing optional optimizations |
