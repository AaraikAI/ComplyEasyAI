import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFetch = vi.fn();
(globalThis as any).fetch = mockFetch;
(globalThis as any).localStorage = { getItem: vi.fn(), setItem: vi.fn(), removeItem: vi.fn(), clear: vi.fn() };

import { api, __clearCsrfCacheForTest } from '../../../services/api';

function mockOkResponse(data: any = {}) {
  return {
    ok: true, status: 200,
    json: async () => data,
    text: async () => JSON.stringify(data),
    headers: new Headers({ 'content-type': 'application/json' }),
  };
}

function getCalls() {
  return mockFetch.mock.calls.filter(([u]: any) => !u.includes('/csrf-token'));
}

describe('api.billing contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    __clearCsrfCacheForTest();
    mockFetch.mockImplementation(async (url: string) => {
      if (url.includes('/csrf-token')) return mockOkResponse({ csrfToken: 'csrf-tok' });
      return mockOkResponse({});
    });
  });

  describe('createCheckout', () => {
    it('should call POST /api/billing/checkout', async () => {
      await api.billing.createCheckout('pro' as any, 'annual');
      const [url, options] = getCalls()[0];
      expect(url).toContain('/api/billing/checkout');
      expect(options.method).toBe('POST');
      const body = JSON.parse(options.body);
      expect(body).toEqual({ tier: 'pro', billingCycle: 'annual' });
      expect(options.headers['X-CSRF-Token']).toBe('csrf-tok');
    });
  });

  describe('createPortalSession', () => {
    it('should call POST /api/billing/portal', async () => {
      await api.billing.createPortalSession();
      const [url, options] = getCalls()[0];
      expect(url).toContain('/api/billing/portal');
      expect(options.method).toBe('POST');
    });
  });

  describe('getSubscription', () => {
    it('should call GET /api/billing/subscription', async () => {
      await api.billing.getSubscription();
      const [url, options] = getCalls()[0];
      expect(url).toContain('/api/billing/subscription');
      expect(options.method || 'GET').toBe('GET');
    });
  });

  describe('getAvailableTiers', () => {
    it('should call GET /api/billing/tiers', async () => {
      await api.billing.getAvailableTiers();
      const [url] = getCalls()[0];
      expect(url).toContain('/api/billing/tiers');
    });
  });

  describe('previewTierChange', () => {
    it('should call POST /api/billing/preview-change', async () => {
      await api.billing.previewTierChange('enterprise' as any, 'monthly');
      const [url, options] = getCalls()[0];
      expect(url).toContain('/api/billing/preview-change');
      expect(options.method).toBe('POST');
      expect(JSON.parse(options.body)).toEqual({ tier: 'enterprise', billingCycle: 'monthly' });
    });
  });

  describe('changeTier', () => {
    it('should call POST /api/billing/change-tier', async () => {
      await api.billing.changeTier('enterprise' as any);
      const [url, options] = getCalls()[0];
      expect(url).toContain('/api/billing/change-tier');
      expect(options.method).toBe('POST');
      expect(JSON.parse(options.body)).toEqual({ targetTier: 'enterprise' });
    });
  });

  describe('cancelSubscription', () => {
    it('should call POST /api/billing/cancel', async () => {
      await api.billing.cancelSubscription(false);
      const [url, options] = getCalls()[0];
      expect(url).toContain('/api/billing/cancel');
      expect(options.method).toBe('POST');
      expect(JSON.parse(options.body)).toEqual({ atPeriodEnd: true });
    });

    it('should set atPeriodEnd=false when cancelImmediately=true', async () => {
      await api.billing.cancelSubscription(true);
      const [, options] = getCalls()[0];
      expect(JSON.parse(options.body)).toEqual({ atPeriodEnd: false });
    });
  });

  describe('reactivateSubscription', () => {
    it('should call POST /api/billing/reactivate', async () => {
      await api.billing.reactivateSubscription();
      const [url, options] = getCalls()[0];
      expect(url).toContain('/api/billing/reactivate');
      expect(options.method).toBe('POST');
    });
  });

  describe('getUsageMetrics', () => {
    it('should call GET /api/billing/usage', async () => {
      await api.billing.getUsageMetrics();
      const [url] = getCalls()[0];
      expect(url).toContain('/api/billing/usage');
    });
  });

  describe('compareTiers', () => {
    it('should call GET /api/billing/compare/:tier', async () => {
      await api.billing.compareTiers('pro' as any);
      const [url] = getCalls()[0];
      expect(url).toContain('/api/billing/compare/pro');
    });
  });

  describe('addAddOn', () => {
    it('should call POST /api/billing/addons', async () => {
      await api.billing.addAddOn('addon-1');
      const [url, options] = getCalls()[0];
      expect(url).toContain('/api/billing/addons');
      expect(options.method).toBe('POST');
      expect(JSON.parse(options.body)).toEqual({ addOnId: 'addon-1' });
    });
  });

  describe('removeAddOn', () => {
    it('should call DELETE /api/billing/addons/:id', async () => {
      await api.billing.removeAddOn('addon-1');
      const [url, options] = getCalls()[0];
      expect(url).toContain('/api/billing/addons/addon-1');
      expect(options.method).toBe('DELETE');
    });
  });

  describe('requestQuote', () => {
    it('should call POST /api/billing/quote', async () => {
      await api.billing.requestQuote('enterprise' as any, { seats: 100 });
      const [url, options] = getCalls()[0];
      expect(url).toContain('/api/billing/quote');
      expect(options.method).toBe('POST');
      const body = JSON.parse(options.body);
      expect(body).toEqual({ tier: 'enterprise', requirements: { seats: 100 } });
    });
  });

  describe('getFeatureSubscriptions', () => {
    it('should call GET /api/billing/features/subscriptions', async () => {
      await api.billing.getFeatureSubscriptions();
      const [url] = getCalls()[0];
      expect(url).toContain('/api/billing/features/subscriptions');
    });
  });

  describe('cancelFeatureSubscription', () => {
    it('should call DELETE /api/billing/features/:featureId/unsubscribe', async () => {
      await api.billing.cancelFeatureSubscription('feat-1');
      const [url, options] = getCalls()[0];
      expect(url).toContain('/api/billing/features/feat-1/unsubscribe');
      expect(options.method).toBe('DELETE');
    });
  });
});
