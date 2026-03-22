# Feature Completeness Verification (Visionary Edition)

This reference covers how to systematically verify that every feature in the application is fully implemented across all layers, with correct data flow and no gaps — enhanced with VLM-driven flow simulation for autonomous visual verification.

## Step 1: Discover All Features

Don't just look at routes — features can be hidden in tabs, modals, dropdown menus, and background processes.

### Frontend Route Discovery (adapt to detected framework)
```bash
# React Router v6
grep -rn "path=" --include="*.tsx" --include="*.jsx" --include="*.ts" | grep -v node_modules | grep -v test

# Next.js App Router — directory structure IS the routing
find app/ -type f -name "page.tsx" -o -name "page.jsx" -o -name "page.ts" -o -name "page.js" 2>/dev/null | sort

# Next.js Pages Router
find pages/ -type f \( -name "*.tsx" -o -name "*.jsx" \) 2>/dev/null | grep -v _app | grep -v _document | sort

# Vue Router
grep -rn "path:" --include="*.ts" --include="*.js" | grep -i "router\|route" | grep -v node_modules

# Angular
grep -rn "path:" --include="*.ts" | grep -i "routing\|routes" | grep -v node_modules

# Svelte/SvelteKit — directory-based routing
find src/routes/ -type f 2>/dev/null | sort
```

### Navigation/Menu Discovery
```bash
# Sidebar, navbar, menu items — often contain links to features
grep -rn "href=\|to=\|navigate\|router\.push\|Link " --include="*.tsx" --include="*.jsx" --include="*.vue" --include="*.svelte" | grep -v node_modules | grep -v test | grep -i "nav\|sidebar\|menu\|header\|drawer" 

# Look for feature flag references (features that might be hidden)
grep -rn "featureFlag\|feature_flag\|isEnabled\|isActive\|canAccess\|showFeature" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" | grep -v node_modules | grep -v test
```

- [ ] **Menu Discovery**: Scan all Navbars, Sidebars, Drawers, and Tab components for feature links — these often reveal features that aren't top-level routes.

### Backend Endpoint Discovery
```bash
# Express/Fastify/Koa routes
grep -rn "router\.\(get\|post\|put\|patch\|delete\|all\)\|app\.\(get\|post\|put\|patch\|delete\|all\)" --include="*.ts" --include="*.js" | grep -v node_modules | grep -v test

# NestJS decorators
grep -rn "@Get\|@Post\|@Put\|@Patch\|@Delete\|@Controller" --include="*.ts" | grep -v node_modules | grep -v test

# FastAPI/Flask/Django (Python)
grep -rn "@app\.route\|@router\.\|@api_view\|path(\|url(" --include="*.py" | grep -v test | grep -v __pycache__

# tRPC procedures
grep -rn "\.query\|\.mutation\|\.subscription" --include="*.ts" | grep -i "trpc\|router\|procedure" | grep -v node_modules | grep -v test
```

### Background Processes & Cron Jobs
```bash
# Scheduled tasks, cron jobs, queue workers
grep -rn "cron\|schedule\|setInterval\|queue\|worker\|job\|bull\|agenda\|celery\|crontab" --include="*.ts" --include="*.js" --include="*.py" | grep -v node_modules | grep -v test
```

## Step 2: Build the Feature Inventory & Trace Layers

Create a table of EVERY feature discovered:

```
| # | Feature Name | Frontend Route | API Endpoints | Service Files | DB Tables | Auth Required |
|---|-------------|----------------|---------------|---------------|-----------|---------------|
| 1 | User Dashboard | /dashboard | GET /api/dashboard | dashboard.service.ts | users, activities | Yes |
| 2 | Create Invoice | /invoices/new | POST /api/invoices | invoice.service.ts | invoices, line_items | Yes |
| ...
```

### Vertical Slice Verification

- [ ] **Vertical Slice**: For each feature (e.g., "Create Invoice"), verify the complete stack — Page exists, calls the API, which calls the Service, which writes to the correct DB table. Any missing layer = incomplete feature.

## Step 3: Trace Each Feature Through All Layers

For EACH feature in the inventory, verify every layer. This is the most critical and time-consuming step — do not skip any feature.

### Layer 1: UI/Page Verification

Open the page/component file and check:

- [ ] **Renders real data** — Does it fetch from an API, or show hardcoded/static data?
  ```bash
  # Check for API calls in the component
  grep -n "fetch\|axios\|useSWR\|useQuery\|api\.\|supabase\." COMPONENT_FILE
  ```
- [ ] **Loading state** — Is there a loading indicator while data fetches?
  ```bash
  grep -n "isLoading\|loading\|Spinner\|Skeleton\|pending" COMPONENT_FILE
  ```
- [ ] **Error state** — Does it handle and display fetch errors?
  ```bash
  grep -n "isError\|error\|Error\|catch\|onError" COMPONENT_FILE
  ```
- [ ] **Empty state** — What shows when there's no data? (not just blank space)
  ```bash
  grep -n "empty\|no.*data\|no.*results\|length.*0\|!.*data" COMPONENT_FILE
  ```
- [ ] **Form validation** — If there's a form, are inputs validated before submission?
  ```bash
  grep -n "required\|validate\|zod\|yup\|formik\|react-hook-form\|useForm" COMPONENT_FILE
  ```
- [ ] **User feedback** — Are success/error toasts/messages shown after actions?
  ```bash
  grep -n "toast\|notification\|alert\|snackbar\|message\.\(success\|error\)" COMPONENT_FILE
  ```
- [ ] **Error Boundaries** — Is there a React Error Boundary (or framework equivalent) wrapping major UI sections for friendly crash recovery?

### Edge Case Implementation Checklist

For every feature with async operations, verify these three critical states exist:

- [ ] **Loading States**: Every async action needs a spinner, skeleton, or progress indicator — no blank white screens during fetch.
- [ ] **Empty States**: All lists, tables, and data views show a helpful "No results found" message when empty — not a blank container.
- [ ] **Error Boundaries**: Friendly UI crash recovery wraps all major sections — users never see a white screen of death.

### Layer 2: API Endpoint Verification

Open the route/controller file and check:

- [ ] **Endpoint exists** and uses the correct HTTP method
- [ ] **Input validation** — Request body/params validated before processing
  ```bash
  grep -n "validate\|schema\|zod\|joi\|class-validator\|pydantic\|parse" CONTROLLER_FILE
  ```
- [ ] **Auth check** — Protected endpoints verify authentication
  ```bash
  grep -n "auth\|protect\|guard\|middleware\|requireAuth\|isAuthenticated" ROUTE_FILE
  ```
- [ ] **Error responses** — Returns proper HTTP status codes (400, 401, 403, 404, 500), not just 200
  ```bash
  grep -n "status\|statusCode\|res\.\(json\|send\|status\)" CONTROLLER_FILE
  ```
- [ ] **Response shape** — Returns data in the format the frontend expects

### Layer 3: Service/Business Logic Verification

Open the service file and check:

- [ ] **Real implementation** — Not a stub, mock, or passthrough
  ```bash
  # Check file size — very small files are suspicious
  wc -l SERVICE_FILE
  # Check for mock/stub indicators
  grep -n "mock\|stub\|fake\|TODO\|placeholder\|sample\|hardcode" SERVICE_FILE
  ```
- [ ] **Business rules applied** — Calculations, validations, permissions checked
- [ ] **Error handling** — Errors caught and wrapped with meaningful messages
- [ ] **Edge cases** — What happens with empty input, null values, duplicate data?

### Layer 4: Database Verification

- [ ] **Table/collection exists** — Check migration files or schema
- [ ] **Schema matches code** — Column names/types match what the service expects
  ```bash
  # Find the table definition
  grep -rn "TABLE_NAME\|table_name" --include="*.sql" --include="*.prisma" | grep -v node_modules
  ```
- [ ] **Migrations current** — All migrations have been run
- [ ] **Indexes exist** — For columns used in WHERE/ORDER BY clauses
- [ ] **Constraints enforced** — NOT NULL, UNIQUE, FK where needed

### Layer 5: Auth/Permissions Verification

- [ ] **Route protection** — Is this feature behind auth? Should it be?
- [ ] **Role-based access** — If roles exist, is access restricted to the right roles?
- [ ] **Data scoping** — Does the query filter by the current user's ID/org?
- [ ] **RLS policies** — For Supabase, does the table have appropriate RLS policies?

## Step 4: Data Flow Verification

For each feature with data input (forms, uploads, etc.), trace the complete data lifecycle:

```
EXAMPLE: Create Invoice Feature

1. UI Form Fields:
   - customer_id (dropdown), amount (number), description (text), due_date (date)
   
2. Frontend Submission:
   POST /api/invoices { customer_id: string, amount: number, description: string, due_date: string }
   
3. API Validation:
   - customer_id: required, must exist in customers table ✅/❌
   - amount: required, positive number ✅/❌
   - description: required, max 500 chars ✅/❌
   - due_date: required, valid ISO date, must be future ✅/❌

4. Service Processing:
   - Calculates tax ✅/❌
   - Generates invoice number ✅/❌
   - Creates line items ✅/❌

5. DB Write:
   INSERT INTO invoices (customer_id, amount, description, due_date, invoice_number, tax, status)
   - All fields mapped correctly ✅/❌
   - Constraints enforced ✅/❌

6. Response to Frontend:
   { id, invoice_number, status, ... }
   - Frontend receives and displays the created invoice ✅/❌
   - UI updates (redirect, toast, list refresh) ✅/❌
```

**Common data flow issues to watch for:**
- Field name mismatch: Frontend sends `customerId`, API expects `customer_id`
- Type mismatch: Frontend sends string "100", API expects number 100
- Missing fields: Frontend sends 4 fields, API accepts but DB requires 6
- Missing refresh: UI doesn't re-fetch list after creating a new item
- Missing redirect: Form submits but user stays on the form page
- Optimistic update failure: UI shows success before API confirms, doesn't roll back on error

## Step 5: API Contract Verification

For every frontend → backend API call:

```bash
# Find all API calls in frontend code
grep -rn "fetch\|axios\|api\.\|useMutation\|useQuery\|supabase\." --include="*.tsx" --include="*.jsx" --include="*.ts" --include="*.js" | grep -v node_modules | grep -v test | grep -v "\.d\.ts"
```

For each call found:
1. What URL/endpoint does it hit?
2. What method (GET/POST/PUT/DELETE)?
3. What body/params does it send?
4. What response shape does it expect?
5. Does the backend endpoint match on all four?

If there's a shared types file or API client, verify it matches both sides.

## Step 6: Navigation Completeness

```bash
# Find all navigation links
grep -rn "href=\|to=\|Link\|navigate\|push\|replace" --include="*.tsx" --include="*.jsx" --include="*.vue" | grep -v node_modules | grep -v test > /tmp/audit_nav_links.txt

# Find all route definitions
grep -rn "path=\|Route\|route" --include="*.tsx" --include="*.ts" --include="*.js" | grep -v node_modules | grep -v test > /tmp/audit_route_defs.txt
```

Cross-reference: Every link should point to a route that exists. Every route should be reachable from navigation.

Check auth redirects:
- Unauthenticated user visits protected page → redirect to login
- After login → redirect back to intended page
- Unauthorized user (wrong role) → redirect to appropriate page with message

---

## Step 7: VLM-Driven Flow Simulation (VISIONARY)

Go beyond static code analysis — use Vision Language Models to verify the app looks and behaves correctly at runtime.

### Action Plan

1. **Synthesize Playwright Tests**: Autonomously write E2E scripts for every discovered route from Step 1. Each script should navigate to the route, interact with key elements, and capture state transitions.

2. **Execute & Capture**: Run the app locally. Capture screenshots at every meaningful state change — initial load, loading state, loaded state, empty state, error state, and post-action state.

3. **VLM Evaluation**: Use Vision to analyze captured screenshots and verify:
   - Does the loading spinner/skeleton actually appear during data fetch?
   - Is the UI responsive and properly laid out (no overlapping elements, broken layouts)?
   - Are error messages user-friendly and visible (not hidden, not raw stack traces)?
   - Do empty states show helpful messaging, not blank containers?
   - Are interactive elements (buttons, forms) visually accessible and properly styled?

4. **End-to-End Integrity**: After each Playwright script run, verify that the UI success state matches a verified DB mutation — e.g., after "Create Invoice" completes in the UI, query the database to confirm the row was actually written with correct data.

### VLM Evaluation Criteria

For each screenshot captured:
- **Visual completeness**: All expected elements are rendered
- **State correctness**: The displayed state matches the expected state at that point in the flow
- **Accessibility**: Text is readable, contrast is sufficient, interactive elements are identifiable
- **Error handling**: Error states show actionable messaging, not technical jargon

---

## Scoring

For each feature, assign completion percentages per layer:

| Score | Meaning |
|-------|---------|
| 100% | Fully implemented, all checks pass (including VLM verification if run) |
| 75% | Core functionality works, missing edge case handling or minor validation |
| 50% | Basic structure exists but missing significant implementation (logic is mock/stub) |
| 25% | Skeleton/stub only — file exists but logic is mock/placeholder |
| 0% | Not started, file doesn't exist |

A feature is **production ready** only when ALL present layers are at 100%.

---

## CRITICAL UPDATE (v2): Full-File Read Protocol for Component Classification

**Do NOT use grep alone to determine if a component fetches data.** Grep misses:

- **Custom hooks**: `useExecutiveDashboard()`, `useComplianceData()`, `useRisks()`
- **Namespaced API calls**: `api.sox.getControls()`, `api.regulationData.getAll('csrd')`, `api.enterprise.monitoring.getDashboard()`
- **React Query with custom keys**: `useQuery(['dashboard'], fetchDashboard)`
- **Data passed via props** from a parent that fetches
- **Context providers** that supply fetched data

**REQUIRED PROTOCOL for every page-level component:**

1. **Read the FULL component file** using the Read tool (not grep)
2. **Check imports** (top of file): Look for imports from `services/api`, `hooks/`, `queries/`
3. **Check all `useEffect` blocks**: Look for any data-fetching calls
4. **Check custom hooks called**: If component calls `useExecutiveDashboard()`, trace that hook
5. **Check props interface**: If component receives data props, check parent
6. **Check conditional patterns**: `useState(INITIAL_DATA)` + `useEffect(() => { fetchReal().then(setData) })` = WIRED, not hardcoded

**Classification rules (STRICT):**

| Pattern Found | Classification |
|---|---|
| Zero fetch/hook patterns AND data from `const` arrays | `HARDCODED_ONLY` → PRODUCTION_GAP |
| `const` array + useEffect/hook that replaces it | `WIRED_WITH_FALLBACK` → DEV_FALLBACK |
| API calls via any mechanism, no static data | `FULLY_WIRED` → No issue |
| Static reference page (in `.claude/CLAUDE.md`) | `INTENTIONAL_STATIC` → FALSE_POSITIVE |

**This codebase had 37 components misclassified in a previous scan due to grep-only detection. Full-file reads are mandatory.**
