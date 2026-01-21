/**
 * Seed DMAObligationTracking rows for each (gatekeeper, obligation).
 *
 * This script is idempotent: it only creates tracking rows that do not
 * already exist. It uses the canonical obligation descriptions from
 * DMAService to ensure consistency between runtime logic and stored data.
 *
 * Usage:
 *   cd server
 *   npx ts-node scripts/seedDMAObligations.ts
 */

import path from 'path';
import dotenv from 'dotenv';
import prisma from '../src/config/database';
import dmaService from '../src/services/euRegulations/dmaService';
import logger from '../src/config/logger';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function seedDMAObligations(): Promise<void> {
  logger.info('Starting DMA obligation tracking seeding...');

  const gatekeepers = await prisma.dMAGatekeeper.findMany({
    include: {
      obligationsTracking: true,
    },
  });

  let createdCount = 0;

  for (const gatekeeper of gatekeepers) {
    const obligations: string[] = Array.isArray(gatekeeper.obligations)
      ? (gatekeeper.obligations as string[])
      : [];

    for (const obligationType of obligations) {
      const alreadyTracked = gatekeeper.obligationsTracking.some(
        (tracking) => tracking.obligationType === obligationType,
      );

      if (alreadyTracked) {
        continue;
      }

      const description = dmaService.getObligationDescription(
        obligationType as any,
      );

      await prisma.dMAObligationTracking.create({
        data: {
          gatekeeperId: gatekeeper.id,
          organizationId: gatekeeper.organizationId,
          obligationType,
          obligationDescription: description,
          complianceStatus: 'pending',
        },
      });

      createdCount += 1;
      logger.info('Created DMAObligationTracking record', {
        gatekeeperId: gatekeeper.id,
        obligationType,
      });
    }
  }

  logger.info('DMA obligation tracking seeding completed', {
    gatekeepers: gatekeepers.length,
    created: createdCount,
  });
}

seedDMAObligations()
  .then(() => {
    logger.info('seedDMAObligations.ts finished successfully');
    return prisma.$disconnect();
  })
  .catch((error) => {
    logger.error('seedDMAObligations.ts failed', { error });
    return prisma.$disconnect().finally(() => {
      process.exit(1);
    });
  });

