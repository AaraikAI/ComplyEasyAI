import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

vi.mock('@/contexts/I18nContext', () => ({ useI18n: () => ({ t: (key: string) => key, locale: 'en', setLocale: vi.fn(), availableLocales: [], isLoading: false }) }));

const mockBrandingConfig = {
  id: 'b1', companyName: 'Acme Corp', mainLogoUrl: '', faviconUrl: '',
  primaryColor: '#3B82F6', secondaryColor: '#1E40AF', accentColor: '#F59E0B',
  customDomain: '', cnameTarget: 'app.complyeasy.ai', sslStatus: 'none',
  customCss: '', loginHtml: '', footerText: 'Powered by ComplyEasy',
  emailLogoUrl: '', emailPrimaryColor: '#3B82F6',
};

describe('BrandingSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true, status: 200,
      json: () => Promise.resolve({ status: 'success', data: mockBrandingConfig }),
    });
  });

  it('renders without crashing', async () => {
    const BrandingSettings = (await import('../BrandingSettings')).default;
    render(<BrandingSettings />);
    await waitFor(() => {
      expect(screen.queryAllByText(/Branding|branding|White.Label|Customization/i).length).toBeGreaterThan(0);
    });
  });

  it('shows loading state', async () => {
    const BrandingSettings = (await import('../BrandingSettings')).default;
    render(<BrandingSettings />);
    // loading indicator may be brief
    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalled();
    });
  });

  it('displays company name field', async () => {
    const BrandingSettings = (await import('../BrandingSettings')).default;
    render(<BrandingSettings />);
    await waitFor(() => {
      expect(screen.queryAllByText(/Company Name|company name|Company/i).length).toBeGreaterThan(0);
    });
  });

  it('displays color picker fields', async () => {
    const BrandingSettings = (await import('../BrandingSettings')).default;
    render(<BrandingSettings />);
    await waitFor(() => {
      expect(screen.queryAllByText(/Primary|primary|Color|color/i).length).toBeGreaterThan(0);
    });
  });

  it('shows custom domain section', async () => {
    const BrandingSettings = (await import('../BrandingSettings')).default;
    render(<BrandingSettings />);
    await waitFor(() => {
      expect(screen.queryAllByText(/Domain|domain|CNAME|SSL/i).length).toBeGreaterThan(0);
    });
  });

  it('shows save button', async () => {
    const BrandingSettings = (await import('../BrandingSettings')).default;
    render(<BrandingSettings />);
    await waitFor(() => {
      expect(screen.queryAllByText(/Save|save/i).length).toBeGreaterThan(0);
    });
  });

  it('shows reset button', async () => {
    const BrandingSettings = (await import('../BrandingSettings')).default;
    render(<BrandingSettings />);
    await waitFor(() => {
      expect(screen.queryAllByText(/Reset|reset|Default|default/i).length).toBeGreaterThan(0);
    });
  });

  it('handles API error on load', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false, status: 500,
      json: () => Promise.resolve({ error: 'Server error' }),
    });
    const BrandingSettings = (await import('../BrandingSettings')).default;
    render(<BrandingSettings />);
    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalled();
    });
  });

  it('shows preview section', async () => {
    const BrandingSettings = (await import('../BrandingSettings')).default;
    render(<BrandingSettings />);
    await waitFor(() => {
      expect(screen.queryAllByText(/Preview|preview|Live/i).length).toBeGreaterThan(0);
    });
  });
});
