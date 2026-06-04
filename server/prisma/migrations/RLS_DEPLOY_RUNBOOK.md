# RLS Deploy Runbook — Organization Row-Level Security (Finding A1/A2)

This runbook makes PostgreSQL row-level security (RLS) a **real, enforced**
second layer of multi-tenant isolation behind the existing application-layer
`organizationId` filtering. It is sequenced so it **cannot break the running
app**: every step before the final cutover is inert/no-op against the current
BYPASSRLS application role.

## Components

| Piece | Location | Role |
|---|---|---|
| Org-context accessor + ENABLE + policies (additive-safe) | `server/prisma/migrations/rls_policies_all_tables.sql` | Defines `public.get_current_organization_id()`, enables RLS, and creates the `org_isolation` policy on every tenant table. **No FORCE.** |
| FORCE lockdown (breaking) | `server/prisma/migrations/20260604_enforce_rls/migration.sql` | `FORCE ROW LEVEL SECURITY` on every tenant table so policies apply to the table owner too. |
| Async org context | `server/src/config/orgContext.ts` | `runWithOrg()` / `getCurrentOrg()` over `AsyncLocalStorage`. |
| Org injection into auth | `server/src/middleware/auth.ts` | Runs the rest of each authenticated request inside `runWithOrg(organizationId, next)`. |
| GUC injection into Prisma | `server/src/config/database.ts` | `$allOperations` extension wraps each query in a transaction that runs `SELECT set_config('app.current_org', $org, true)` first. |

## How org context flows at runtime

1. `auth.ts` resolves `req.user.organizationId`, then calls
   `runWithOrg(organizationId, () => next())`.
2. Any Prisma call in that request reads the org via `getCurrentOrg()` in the
   `database.ts` extension.
3. The extension opens an interactive transaction, sets the **transaction-local**
   GUC `app.current_org`, then runs the query on that transaction connection.
4. The `org_isolation` policy predicate
   `"organizationId" = public.get_current_organization_id()` reads that GUC.

The GUC is transaction-local (`set_config(..., true)`), so it cannot leak across
pooled connections.

## Tenant tables

The 202 tenant tables are derived from `server/prisma/schema.prisma` — every
model that has an `organizationId` field, using its `@@map` table name. Both SQL
files are generated from that same source so they stay reproducible. If a new
tenant model is added, regenerate both files from the schema.

## Ordered deploy steps (zero-downtime, fail-closed only at the end)

### Step 0 — Apply the additive-safe policies (safe any time)
Apply `rls_policies_all_tables.sql` to the database. This defines the function,
enables RLS, and creates policies. **It changes nothing observable** while the
app role still has `BYPASSRLS` (or owns the tables), because non-FORCE RLS is
bypassed by owners/bypass roles. Reads and writes continue exactly as before.

### Step 1 — Ship the org-context application code
Deploy the app containing `orgContext.ts`, the `auth.ts` wiring, and the
`database.ts` GUC-injection extension. Still no behavior change: the GUC is set
but ignored because the role bypasses RLS.

### Step 2 — Create a least-privilege application role (NO bypassrls)
The app currently connects as a superuser/`BYPASSRLS` role (e.g. `postgres`),
which defeats RLS. Create a dedicated non-bypass role that does **not** own the
tenant tables:

```sql
-- Run as a superuser / table owner.
CREATE ROLE app_runtime LOGIN PASSWORD '<<strong-secret>>';
-- Explicitly ensure it never bypasses RLS:
ALTER ROLE app_runtime NOBYPASSRLS;

-- Grant only the DML it needs (no ownership):
GRANT USAGE ON SCHEMA public TO app_runtime;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_runtime;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_runtime;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_runtime;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO app_runtime;
GRANT EXECUTE ON FUNCTION public.get_current_organization_id() TO app_runtime;
```

> Supabase note: the default `postgres` role has `BYPASSRLS = true` and owns the
> tables. The app **must** stop connecting as that role for RLS to take effect.

### Step 3 — Apply the FORCE migration
Apply `20260604_enforce_rls/migration.sql`. With FORCE, policies now apply even
to table owners. The currently-deployed app (Step 1) already sets the GUC, so as
long as it still connects with a role subject to RLS it will continue to work;
the BYPASSRLS admin role (used for migrations) is unaffected.

### Step 4 — Cut DATABASE_URL over to the least-privilege role
Point the application's `DATABASE_URL` at `app_runtime` (from Step 2) and
redeploy/restart. From this moment:
- Every authenticated request sets `app.current_org`, and RLS scopes all rows to
  that org — **DB-enforced** tenant isolation.
- A request with no org context (bug, public route touching tenant tables)
  matches **no** tenant rows (fail-closed) rather than leaking cross-tenant data.

Keep a separate admin/migration connection string on the owner/`BYPASSRLS` role
for schema migrations and maintenance — do **not** use it for app traffic.

## Verification

After Step 4, with two orgs A and B:

```sql
-- As app_runtime, without any org set: expect 0 rows.
SELECT count(*) FROM "RiskItem";

-- With org A bound: expect only org A rows.
SELECT set_config('app.current_org', '<orgA-id>', false);
SELECT count(*) FROM "RiskItem" WHERE "organizationId" <> '<orgA-id>'; -- expect 0
```

Also run an authenticated end-to-end request for org A and confirm it cannot
read or mutate org B data.

## Rollback

- Behavioral rollback without dropping policies: point `DATABASE_URL` back at the
  `BYPASSRLS`/owner role (reverts to Step 1 state — policies inert again).
- To fully remove: `ALTER TABLE "<T>" NO FORCE ROW LEVEL SECURITY;` then
  `ALTER TABLE "<T>" DISABLE ROW LEVEL SECURITY;` per table, and
  `DROP POLICY IF EXISTS org_isolation ON "<T>";`.
