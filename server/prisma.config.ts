import 'dotenv/config';
import { defineConfig } from 'prisma/config';

// DATABASE_URL must come from the environment. We deliberately do NOT fall back to
// a usable connection string — that would let a misconfigured deploy silently connect
// to an unintended database. Schema-only CLI commands (generate/format/validate) never
// open a connection, so for those we supply a non-routable sentinel; any command that
// actually connects (migrate/db/studio) requires the real URL and fails closed without it.
const SCHEMA_ONLY = /\b(generate|format|validate)\b/.test(process.argv.join(' '));
const databaseUrl =
  process.env.DATABASE_URL ??
  (SCHEMA_ONLY
    ? 'postgresql://unset:unset@127.0.0.1:1/unset?schema=public'
    : (() => { throw new Error('DATABASE_URL is required'); })());

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: databaseUrl,
  },
});
