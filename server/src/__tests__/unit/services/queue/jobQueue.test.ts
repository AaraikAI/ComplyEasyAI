/**
 * JobQueueService — BullMQ path.
 *
 * BullMQ 6 removed the `repeat` option from Queue.add (it is ignored, so a
 * recurring job would run once). Recurring jobs must be registered as Job
 * Schedulers; one-off jobs keep using Queue.add without a `repeat` key.
 *
 * bullmq is replaced by plain classes that record their calls (not jest.fn), so
 * jest's resetMocks/restoreMocks cannot wipe their behaviour.
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

interface RecordedCall {
  queue: string;
  method: 'add' | 'upsertJobScheduler';
  args: unknown[];
}

const mockCalls: RecordedCall[] = [];

jest.mock('bullmq', () => {
  class FakeQueue {
    constructor(public name: string, public opts: unknown) {}
    async add(...args: unknown[]) {
      mockCalls.push({ queue: this.name, method: 'add', args });
      return { id: 'bull-job-1' };
    }
    async upsertJobScheduler(...args: unknown[]) {
      mockCalls.push({ queue: this.name, method: 'upsertJobScheduler', args });
      return { id: 'repeat:scheduler:1' };
    }
    async drain() {}
    async close() {}
  }
  class FakeWorker {
    on() { return this; }
    async close() {}
  }
  return { __esModule: true, Queue: FakeQueue, Worker: FakeWorker, Job: class {} };
});

type JobQueueModule = typeof import('../../../../services/queue/jobQueue');

describe('JobQueueService (BullMQ)', () => {
  const originalRedisUrl = process.env.REDIS_URL;
  let mod: JobQueueModule;

  beforeEach(async () => {
    mockCalls.length = 0;
    process.env.REDIS_URL = 'redis://127.0.0.1:6379/0';
    jest.resetModules();
    mod = require('../../../../services/queue/jobQueue') as JobQueueModule;
    await mod.default.initialize();
  });

  afterEach(() => {
    if (originalRedisUrl === undefined) delete process.env.REDIS_URL;
    else process.env.REDIS_URL = originalRedisUrl;
  });

  it('adds a one-off job with Queue.add and no repeat option', async () => {
    const job = await mod.default.addJob(mod.QUEUE_NAMES.EMAIL, 'send', { to: 'a@example.com' }, {
      jobId: 'email-1',
      delay: 5000,
    });

    expect(mockCalls).toHaveLength(1);
    const [call] = mockCalls;
    expect(call.method).toBe('add');
    expect(call.queue).toBe('email');
    const [name, data, opts] = call.args as [string, unknown, Record<string, unknown>];
    expect(name).toBe('send');
    expect(data).toEqual({ to: 'a@example.com' });
    expect(opts).toMatchObject({ jobId: 'email-1', delay: 5000, attempts: 3 });
    expect(opts).not.toHaveProperty('repeat');
    expect(job).toMatchObject({ id: 'bull-job-1', status: 'delayed' });
  });

  it('omits jobId when none is given', async () => {
    await mod.default.addJob(mod.QUEUE_NAMES.EMAIL, 'send', {});

    const opts = mockCalls[0].args[2] as Record<string, unknown>;
    expect(opts).not.toHaveProperty('jobId');
    expect(opts).not.toHaveProperty('repeat');
  });

  it('registers a cron job as a Job Scheduler instead of Queue.add', async () => {
    const job = await mod.default.addJob(mod.QUEUE_NAMES.MONITORING, 'health-sweep', { scope: 'all' }, {
      repeat: { cron: '*/15 * * * *', tz: 'UTC', limit: 10 },
      attempts: 5,
    });

    expect(mockCalls.map((c) => c.method)).toEqual(['upsertJobScheduler']);
    const [schedulerId, repeatOpts, template] = mockCalls[0].args as [
      string,
      Record<string, unknown>,
      { name: string; data: unknown; opts: Record<string, unknown> },
    ];
    expect(mockCalls[0].queue).toBe('monitoring');
    expect(schedulerId).toBe('health-sweep:*/15 * * * *');
    expect(repeatOpts).toEqual({ pattern: '*/15 * * * *', tz: 'UTC', limit: 10 });
    expect(template.name).toBe('health-sweep');
    expect(template.data).toEqual({ scope: 'all' });
    expect(template.opts).toMatchObject({ attempts: 5 });
    // A scheduler template may not carry jobId, repeat or delay.
    expect(template.opts).not.toHaveProperty('jobId');
    expect(template.opts).not.toHaveProperty('repeat');
    expect(template.opts).not.toHaveProperty('delay');
    expect(job).toMatchObject({ id: 'repeat:scheduler:1', status: 'delayed' });
  });

  it('keys the Job Scheduler by jobId when one is given', async () => {
    await mod.default.addJob(mod.QUEUE_NAMES.CLEANUP, 'purge', {}, {
      jobId: 'nightly-purge',
      repeat: { cron: '0 3 * * *' },
    });

    const [schedulerId, repeatOpts] = mockCalls[0].args as [string, Record<string, unknown>];
    expect(schedulerId).toBe('nightly-purge');
    expect(repeatOpts).toEqual({ pattern: '0 3 * * *', tz: undefined, limit: undefined });
  });
});
