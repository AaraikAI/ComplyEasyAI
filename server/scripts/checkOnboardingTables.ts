#!/usr/bin/env ts-node
/**
 * Verify we can see and access onboarding tables in the database.
 * Run from server directory: npx ts-node scripts/checkOnboardingTables.ts
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import { PrismaClient } from '@prisma/client';

dotenv.config({ path: path.join(__dirname, '../.env') });

const prisma = new PrismaClient();

async function main() {
  console.log('Checking onboarding tables (using DATABASE_URL from .env)...\n');

  const results: { table: string; accessible: boolean; count?: number; error?: string }[] = [];

  try {
    const progressCount = await prisma.onboardingProgress.count();
    results.push({ table: 'OnboardingProgress', accessible: true, count: progressCount });
  } catch (e: any) {
    results.push({ table: 'OnboardingProgress', accessible: false, error: e?.message || String(e) });
  }

  try {
    const checklistCount = await prisma.onboardingChecklist.count();
    results.push({ table: 'OnboardingChecklist', accessible: true, count: checklistCount });
  } catch (e: any) {
    results.push({ table: 'OnboardingChecklist', accessible: false, error: e?.message || String(e) });
  }

  try {
    const eventCount = await prisma.onboardingEvent.count();
    results.push({ table: 'OnboardingEvent', accessible: true, count: eventCount });
  } catch (e: any) {
    results.push({ table: 'OnboardingEvent', accessible: false, error: e?.message || String(e) });
  }

  console.log('Results:');
  results.forEach((r) => {
    if (r.accessible) {
      console.log(`  ✓ ${r.table}: accessible (${r.count} row(s))`);
    } else {
      console.log(`  ✗ ${r.table}: ${r.error}`);
    }
  });

  const allOk = results.every((r) => r.accessible);
  process.exit(allOk ? 0 : 1);
}

main()
  .catch((e) => {
    console.error('Script failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
