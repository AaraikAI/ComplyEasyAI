/**
 * Script to apply templates to all frameworks that don't have controls
 * Run with: npx ts-node scripts/applyAllTemplates.ts
 */

import prisma from '../src/config/database';
import { FrameworkTemplateService } from '../src/services/frameworkTemplateService';

async function applyAllTemplates() {
  const service = new FrameworkTemplateService();

  // Get all frameworks without controls
  const frameworks = await prisma.$queryRaw<Array<{
    id: string;
    name: string;
    organizationId: string;
    org_name: string;
  }>>`
    SELECT cf.id, cf.name, cf."organizationId", o.name as org_name
    FROM "ComplianceFramework" cf
    JOIN "Organization" o ON cf."organizationId" = o.id
    LEFT JOIN (
      SELECT "frameworkId", COUNT(*) as cnt
      FROM "FrameworkControl"
      GROUP BY "frameworkId"
    ) fc_count ON cf.id = fc_count."frameworkId"
    WHERE COALESCE(fc_count.cnt, 0) = 0
    ORDER BY o.name, cf.name
  `;

  console.log(`Found ${frameworks.length} frameworks without controls`);

  let successCount = 0;
  let errorCount = 0;

  for (const fw of frameworks) {
    try {
      console.log(`Applying template to ${fw.name} (${fw.org_name})...`);

      // Get the first user from the organization for audit purposes
      const user = await prisma.user.findFirst({
        where: { organizationId: fw.organizationId }
      });

      const result = await service.applyTemplateToFramework(
        fw.organizationId,  // organizationId
        fw.id,              // frameworkId
        fw.name,            // frameworkType
        user?.id            // userId
      );

      console.log(`  -> Applied ${result.applied} controls (${result.skipped} skipped)`);
      successCount++;
    } catch (error: any) {
      console.error(`  -> ERROR: ${error.message}`);
      errorCount++;
    }
  }

  console.log(`\nComplete: ${successCount} successful, ${errorCount} errors`);
  await prisma.$disconnect();
}

applyAllTemplates().catch(console.error);
