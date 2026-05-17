/**
 * Worker registration entry point.
 *
 * Called once at server boot, after the job queue is initialized. Each worker
 * file exports a register*Worker() function that subscribes to its queue.
 */

import logger from '../config/logger';

export async function registerAllWorkers(): Promise<void> {
  const { registerBlockchainAnchorWorker } = await import('./blockchainAnchorWorker');
  registerBlockchainAnchorWorker();
  logger.info('[Workers] All workers registered');
}
