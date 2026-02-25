# Application Logic Verification

This reference covers how to verify that the application's business logic, state management, data validation, and error handling are correct and production-ready.

## 5A: Business Rule Verification

### Discovering Business Rules

Business rules aren't always obvious from code alone. Look for:

```bash
# Pricing, billing, subscription logic
grep -rn "price\|cost\|fee\|discount\|tax\|billing\|invoice\|subscription\|plan\|tier" --include="*.ts" --include="*.js" --include="*.py" | grep -v node_modules | grep -v test | grep -v "\.d\.ts"

# Permission and role logic
grep -rn "role\|permission\|canAccess\|isAllowed\|authorize\|isAdmin\|isMember\|isOwner" --include="*.ts" --include="*.js" --include="*.py" | grep -v node_modules | grep -v test

# Workflow/state machine logic
grep -rn "status\|state\|workflow\|transition\|stage\|step\|phase\|approve\|reject\|submit\|draft\|publish" --include="*.ts" --include="*.js" --include="*.py" | grep -v node_modules | grep -v test | grep -v "useState\|setState"

# Calculation/formula logic
grep -rn "calculate\|compute\|total\|sum\|average\|percentage\|ratio\|formula" --include="*.ts" --include="*.js" --include="*.py" | grep -v node_modules | grep -v test

# Limit/threshold logic
grep -rn "limit\|max\|min\|threshold\|quota\|cap\|ceiling\|floor\|exceed\|overflow" --include="*.ts" --include="*.js" --include="*.py" | grep -v node_modules | grep -v test
```

### Verification Checklist per Business Rule

For each business rule found:

1. **Is it implemented or stubbed?**
   - Read the function — does it contain real logic or return hardcoded values?
   - Check for TODO/FIXME comments within the function

2. **Edge cases handled?**
   - Zero values: What happens when amount = 0? When quantity = 0?
   - Negative numbers: Can someone submit a negative price/quantity?
   - Empty strings: Are empty required fields caught?
   - Null/undefined: Are optional fields handled gracefully?
   - Boundary conditions: What about MAX_INT, very long strings, dates in the past/far future?
   - Division by zero: Any calculations that could divide by zero?

3. **Calculations correct?**
   - Currency: Is rounding handled? (Use integer cents, not floating point dollars)
   - Percentages: Is it percentage OF or percentage OFF?
   - Date math: Timezone handling, daylight saving time, leap years?
   - Precision: Are floating-point errors possible in financial calculations?

4. **Status/workflow transitions valid?**
   - Can you go from any status to any other status? Or are transitions restricted?
   - What happens if you try an invalid transition?
   - Are completed/cancelled/deleted items properly locked from further changes?

### Common Business Logic Red Flags

```bash
# Floating-point currency (should use integers/cents)
grep -rn "parseFloat.*price\|parseFloat.*amount\|parseFloat.*cost\|toFixed(2)" --include="*.ts" --include="*.js" | grep -v node_modules | grep -v test

# Missing null checks before operations
grep -rn "\.\(length\|map\|filter\|reduce\|forEach\|split\|trim\|toLowerCase\)" --include="*.ts" --include="*.tsx" | grep -v node_modules | grep -v test | grep -v "?\." > /tmp/audit_null_risk.txt
# Then check if these have optional chaining or null guards

# Unrestricted status transitions
grep -rn "status.*=\|\.update.*status\|setState.*status" --include="*.ts" --include="*.js" --include="*.py" | grep -v node_modules | grep -v test
# Check if there's validation before status changes
```

---

## 5B: State Management Audit

### Frontend State

```bash
# State management libraries in use
grep -rn "useContext\|createContext\|useReducer\|zustand\|redux\|recoil\|jotai\|mobx\|pinia\|vuex\|signal" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" | grep -v node_modules | grep -v test | head -5

# All useState hooks (track what state exists)
grep -rn "useState\|useRef\|useMemo\|useCallback" --include="*.tsx" --include="*.jsx" | grep -v node_modules | grep -v test > /tmp/audit_state.txt
```

**For each stateful component, verify:**

- [ ] **Loading state**: Is there an `isLoading` / `loading` state that's set during async operations?
- [ ] **Error state**: Is there an `error` state? Is it cleared on retry?
- [ ] **Empty state**: When data array is empty, does the UI show a helpful message (not blank)?
- [ ] **Stale data**: After a mutation (create/update/delete), does the list/view re-fetch or update?
- [ ] **Race conditions**: If user clicks submit twice, what happens? Is the button disabled during submission?
- [ ] **Cleanup**: Do components clean up subscriptions/timers on unmount?

```bash
# Check for missing cleanup
grep -rn "useEffect\|addEventListener\|setInterval\|setTimeout\|subscribe" --include="*.tsx" --include="*.jsx" | grep -v node_modules | grep -v test > /tmp/audit_effects.txt
# Then verify each has a cleanup/return function
```

### Backend State

```bash
# In-memory state that won't survive restart or scale horizontally
grep -rn "const.*=.*new Map\|const.*=.*new Set\|const.*=.*{}\|let.*=.*\[\]\|global\.\|app\.locals" --include="*.ts" --include="*.js" | grep -v node_modules | grep -v test | grep -v "\.d\.ts"

# Session storage
grep -rn "session\|req\.session\|express-session\|cookie-session" --include="*.ts" --include="*.js" | grep -v node_modules | grep -v test
```

**Red flags:**
- In-memory cache without TTL or size limit → memory leak risk
- In-memory sessions → won't work with multiple server instances
- Global mutable state → race conditions under concurrent requests
- Missing cache invalidation → stale data served to users

---

## 5C: Data Validation Pipeline

The same data validation should happen at every layer, and they must be consistent. Verification pattern:

### Layer 1: Frontend Validation
```bash
# Find form components
grep -rn "onSubmit\|handleSubmit\|form\." --include="*.tsx" --include="*.jsx" | grep -v node_modules | grep -v test

# Check for validation libraries
grep -rn "zod\|yup\|joi\|validate\|schema\|formik\|useForm\|react-hook-form\|vee-validate" --include="*.tsx" --include="*.jsx" --include="*.ts" | grep -v node_modules | grep -v test
```

For each form: Are ALL fields validated? Are error messages shown inline?

### Layer 2: API Validation
```bash
# Find request body parsing
grep -rn "req\.body\|request\.json\|request\.form\|Body()\|@Body" --include="*.ts" --include="*.js" --include="*.py" | grep -v node_modules | grep -v test

# Check for validation middleware/decorators
grep -rn "validate\|schema\|zod\|joi\|class-validator\|pydantic\|@IsString\|@IsNumber\|@IsEmail\|parse" --include="*.ts" --include="*.js" --include="*.py" | grep -v node_modules | grep -v test
```

**Common validation gaps:**
- Frontend validates but API doesn't (attacker bypasses browser)
- API validates some fields but not all
- API validates types but not business rules (e.g., amount > 0)
- Different max lengths between frontend and DB
- File upload: type checked in frontend but not backend

### Layer 3: Database Constraints
```bash
# Check migration files for constraints
grep -rn "NOT NULL\|UNIQUE\|CHECK\|REFERENCES\|FOREIGN KEY\|DEFAULT\|CONSTRAINT" --include="*.sql" --include="*.prisma" | grep -v node_modules

# Check ORM model definitions
grep -rn "@Column\|@IsNotEmpty\|@IsUnique\|nullable\|unique\|required\|default" --include="*.ts" --include="*.py" | grep -v node_modules | grep -v test
```

### Cross-Layer Consistency Check

For each validated field, verify:
- Frontend max length = API max length = DB column size
- Frontend required fields = API required fields = DB NOT NULL columns
- Frontend type (number/string/date) = API type = DB column type
- Enum values in frontend dropdowns = API accepted values = DB CHECK constraint

---

## 5D: Error Propagation & User Feedback

### Trace the Error Path

For each major operation, verify errors propagate correctly:

```
DB error (connection lost, constraint violation, etc.)
  → Service catches it, wraps with context
    → Controller returns proper HTTP status + error body
      → Frontend catches the error
        → User sees a helpful message (not "Something went wrong" or a stack trace)
```

### Verification Commands

```bash
# Find all error handling in services
grep -rn "catch\|throw\|Error(\|reject\|raise " --include="*.ts" --include="*.js" --include="*.py" | grep -v node_modules | grep -v test | grep -v "\.d\.ts" > /tmp/audit_error_handling.txt

# Find all user-facing error messages
grep -rn "toast\.\(error\|warning\)\|setError\|showError\|notification\.\(error\|warn\)\|alert(" --include="*.tsx" --include="*.jsx" | grep -v node_modules | grep -v test

# Find endpoints that might swallow errors
grep -rn "catch.*{}\|catch.*console\|except:.*pass\|except.*pass" --include="*.ts" --include="*.js" --include="*.py" | grep -v node_modules | grep -v test
```

### Error Handling Checklist

- [ ] No empty catch blocks in service/controller code
- [ ] No errors swallowed with only console.log (must re-throw or return error response)
- [ ] API returns structured error format: `{ error: { code, message } }` (consistent across all endpoints)
- [ ] Frontend shows user-friendly error messages (not raw error.message from API)
- [ ] 400-level errors vs 500-level errors are distinguished (client error vs server error)
- [ ] Timeout handling: What happens when an API call takes too long? Does the frontend hang?
- [ ] Network failure: What happens when the API is unreachable?

---

## 5E: Transaction & Data Consistency

### Find Multi-Step Operations

```bash
# Database transactions
grep -rn "transaction\|BEGIN\|COMMIT\|ROLLBACK\|\.transaction\|@Transaction\|atomic\|savepoint" --include="*.ts" --include="*.js" --include="*.py" --include="*.sql" | grep -v node_modules | grep -v test

# Multi-step service operations (multiple DB writes in one function)
grep -rn "\.insert\|\.create\|\.update\|\.delete\|\.save\|\.remove" --include="*.ts" --include="*.js" --include="*.py" | grep -v node_modules | grep -v test > /tmp/audit_db_writes.txt
# Group by file — files with multiple DB writes in one function need transaction review
```

### Verification Checklist

For each multi-step operation:

- [ ] **Wrapped in transaction?** If step 2 fails, does step 1 roll back?
- [ ] **Idempotent?** If the operation runs twice (user double-click, network retry), does it produce correct results?
- [ ] **Concurrent safety?** If two users edit the same resource simultaneously:
  - Is there optimistic locking (version/timestamp check)?
  - Or pessimistic locking (SELECT ... FOR UPDATE)?
  - Or does last-write-win silently overwrite?
- [ ] **Cleanup on failure?** If a file upload succeeds but the DB write fails, is the uploaded file cleaned up?

### Common Consistency Issues

- Create user + send welcome email: If email fails, user exists but never gets email
- Create order + charge payment + update inventory: Any step can fail
- Delete parent record without cleaning up child records (orphaned data)
- Updating denormalized data in one place but not the other (counter caches, aggregates)
