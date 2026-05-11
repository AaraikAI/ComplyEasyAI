# Server Scripts

Utility scripts for setup, validation, and maintenance. All scripts are TypeScript, invoked via `ts-node`. See the [backend README](../README.md) for product context.

## Scripts

### `setupOAuth.ts` — OAuth app provisioning wizard

```bash
npm run setup:oauth
```

Interactive CLI that walks through creating OAuth apps with Google, GitHub, Slack, and Jira, then writes the client IDs / secrets / callback URLs into `server/.env` (preserves existing variables).

**Use when:** first-time setup, adding a new provider, rotating OAuth credentials.

### `validateEnv.ts` — Environment contract validator

```bash
npm run validate:env
```

Hard-fails (exit code 1) if any required env var is missing or malformed. Runs in CI before deploy so a broken config never reaches production. Critical vars cause a startup crash if missing — this script surfaces the same failure modes earlier.

Validation rules:
- **URLs:** valid `http(s)://`
- **Emails:** RFC 5322 surface
- **JWT secrets:** ≥32 hex chars
- **`ENCRYPTION_KEY`:** 32 bytes hex (AES-256 requirement)
- **`SENDGRID_API_KEY`:** must start with `SG.`
- **API keys:** provider-specific format check
- **`DATABASE_URL`:** must start with `postgresql://`

**Exit codes:** `0` = all valid, `1` = missing or invalid.

### `patch-express-types.js` — Express 5 type patch

```bash
npm run postinstall   # runs automatically
```

Augments `@types/express-serve-static-core` to match Express 5's runtime contract. Load-bearing — without it, the codebase produces ~700 TypeScript errors. See `../../FOUNDER_NARRATIVE.md` §5.1 for the why.

**Do not delete.** This is the canonical solution after we tried (and reverted) several alternatives.

### Database utilities

```bash
npm run db:seed              # seed reference framework catalog (SOC 2 / ISO 27001 / HIPAA / etc. controls)
npm run prisma:generate      # regenerate Prisma client after schema edits
npm run prisma:migrate       # run pending migrations against the configured DATABASE_URL
npm run prisma:studio        # open Prisma Studio (dev-only)
```

For Supabase-hosted DBs, prefer applying migrations via the Supabase MCP `apply_migration` tool (registers in the `supabase_migrations.schema_migrations` table). See `../prisma/migrations/MIGRATION_ROLLBACK.md` for rollback procedure.

### Test helpers

```bash
npm run test:performance     # k6 / artillery load profiles
npm run test:integration     # integration suite (DB required)
```

## Typical first-time setup

```bash
# 1. Configure secrets
cp .env.example .env

# 2. Provision OAuth apps (or skip if not using integrations yet)
npm run setup:oauth

# 3. Validate
npm run validate:env

# 4. Generate Prisma client + apply migrations
npm run prisma:generate
npm run prisma:migrate

# 5. Boot
npm run dev
```

## CI integration

`.github/workflows/ci.yml` runs `validate:env` before the build step, with secrets injected from GitHub repository secrets:

```yaml
- name: Validate environment
  run: npm run validate:env
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
    JWT_SECRET: ${{ secrets.JWT_SECRET }}
    JWT_REFRESH_SECRET: ${{ secrets.JWT_REFRESH_SECRET }}
    ENCRYPTION_KEY: ${{ secrets.ENCRYPTION_KEY }}
    SENDGRID_API_KEY: ${{ secrets.SENDGRID_API_KEY }}
    STRIPE_SECRET_KEY: ${{ secrets.STRIPE_SECRET_KEY }}
```

## Troubleshooting

| Symptom | Likely cause |
|---------|-------------|
| `validate:env` fails but vars are set | trailing whitespace / quotes in `.env` (vars shouldn't be quoted) |
| OAuth callbacks redirect to `error=` | callback URL in provider console doesn't exactly match `server/.env` |
| `Cannot find module` from a script | run `npm install` |
| Postinstall script fails | check `node_modules/@types/express-serve-static-core/index.d.ts` was written — see `patch-express-types.js` |
| `ENCRYPTION_KEY must be 32 bytes` | hex-encode 32 bytes: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |

## Security notes

- **Never commit `.env`** — covered by root `.gitignore`. The `validate:env` script does NOT write secrets to logs.
- **Rotate secrets quarterly** in production. AWS Secrets Manager versions automatically.
- **Use different secrets per environment** — dev / staging / prod must not share any sensitive value.
- **CI uses ephemeral env** — never write secrets to artifacts. The build runs in a sandboxed runner.

## Modifying scripts

Scripts run directly via `ts-node` — no compile step. Test edits with:

```bash
npx ts-node scripts/<name>.ts
```

Dependencies are: `chalk` (terminal styling), `inquirer` (prompts), `dotenv` (env loader). Stay minimal — scripts must not grow into a framework.
