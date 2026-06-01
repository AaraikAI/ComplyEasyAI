import 'dotenv/config';
import { defineConfig } from 'prisma/config';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl || databaseUrl.trim() === '') {
  // Fail fast: a missing DATABASE_URL would otherwise let migration/CLI
  // commands silently target an unintended database.
  throw new Error('DATABASE_URL environment variable is required but was not set.');
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: databaseUrl,
  },
});
