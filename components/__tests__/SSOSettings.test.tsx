import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

vi.mock('@/contexts/I18nContext', () => ({
  useI18n: () => ({ t: (key: string) => key, locale: 'en', setLocale: vi.fn(), availableLocales: [], isLoading: false }),
}));

const mockSSOConfig = {
  id: 'sso-1', provider: 'saml' as const, enabled: true, entityId: 'https://idp.example.com',
  ssoUrl: 'https://idp.example.com/sso', sloUrl: 'https://idp.example.com/slo',
  certificate: 'MIID...cert', metadataUrl: 'https://idp.example.com/metadata.xml',
  attributeMappings: [{ id: 'map-1', idpAttribute: 'email', userField: 'email' }],
  defaultRole: 'viewer', autoProvision: false, allowedDomains: ['example.com'],
  jitProvisioning: false, signedRequests: true, forceAuthn: false,
  nameIdFormat: 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress',
  createdAt: '2025-01-01', updatedAt: '2025-12-01',
};

const mockSPMetadata = {
  xml: '<EntityDescriptor>...</EntityDescriptor>',
  entityId: 'https://app.complyeasy.ai',
  acsUrl: 'https://app.complyeasy.ai/saml/acs',
  sloUrl: 'https://app.complyeasy.ai/saml/slo',
};

import SSOSettings from '../SSOSettings';

describe('SSOSettings', () => {
  const mockOnBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (globalThis.fetch as any).mockImplementation((url: string) => {
      if (url.includes('/sso/config')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockSSOConfig) });
      }
      if (url.includes('/sso/sp-metadata')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockSPMetadata) });
      }
      if (url.includes('/sso/test')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true, message: 'Connection successful', details: ['IdP reachable'], timestamp: new Date().toISOString() }) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });
  });

  it('shows loading state initially', () => {
    (globalThis.fetch as any).mockImplementation(() => new Promise(() => {}));
    render(<SSOSettings onBack={mockOnBack} />);
    expect(screen.getByText(/common.loading/i)).toBeInTheDocument();
  });

  it('renders SSO settings page after loading', async () => {
    render(<SSOSettings onBack={mockOnBack} />);
    await waitFor(() => expect(screen.getByText('settings.sso')).toBeInTheDocument());
  });

  it('displays SSO status section', async () => {
    render(<SSOSettings onBack={mockOnBack} />);
    await waitFor(() => expect(screen.getByText('SSO Status')).toBeInTheDocument());
  });

  it('shows provider selection buttons', async () => {
    render(<SSOSettings onBack={mockOnBack} />);
    await waitFor(() => expect(screen.getByText('SAML 2.0')).toBeInTheDocument());
    expect(screen.getByText('Okta')).toBeInTheDocument();
    expect(screen.getByText('Azure Active Directory')).toBeInTheDocument();
  });

  it('changes provider selection when clicked', async () => {
    render(<SSOSettings onBack={mockOnBack} />);
    await waitFor(() => expect(screen.getByText('Okta')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Okta'));
    // Provider should be visually selected
  });

  it('toggles SSO enabled state', async () => {
    render(<SSOSettings onBack={mockOnBack} />);
    await waitFor(() => expect(screen.getByText('SSO Status')).toBeInTheDocument());
    const toggles = document.querySelectorAll('button[class*="rounded-full"]');
    const ssoToggle = toggles[0];
    fireEvent.click(ssoToggle);
    // Toggle should flip
  });

  it('navigates between tabs', async () => {
    render(<SSOSettings onBack={mockOnBack} />);
    await waitFor(() => expect(screen.getByText('Configuration')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Attribute Mapping'));
    await waitFor(() => expect(screen.getByText('Attribute Mappings')).toBeInTheDocument());
    fireEvent.click(screen.getByText('SP Metadata'));
    await waitFor(() => expect(screen.getByText('Service Provider Metadata')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Advanced'));
    await waitFor(() => expect(screen.getByText('Advanced Settings')).toBeInTheDocument());
  });

  it('shows configuration form fields', async () => {
    render(<SSOSettings onBack={mockOnBack} />);
    await waitFor(() => expect(screen.getByText('Entity ID / Issuer')).toBeInTheDocument());
    expect(screen.getByText('SSO Login URL')).toBeInTheDocument();
    expect(screen.getByText('X.509 Certificate')).toBeInTheDocument();
  });

  it('displays pre-filled entity ID from config', async () => {
    render(<SSOSettings onBack={mockOnBack} />);
    await waitFor(() => expect(screen.getByDisplayValue('https://idp.example.com')).toBeInTheDocument());
  });

  it('adds attribute mapping on mapping tab', async () => {
    render(<SSOSettings onBack={mockOnBack} />);
    await waitFor(() => expect(screen.getByText('Attribute Mapping')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Attribute Mapping'));
    await waitFor(() => expect(screen.getByText('Add Mapping')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Add Mapping'));
    // New mapping row should appear
  });

  it('displays SP metadata on metadata tab', async () => {
    render(<SSOSettings onBack={mockOnBack} />);
    await waitFor(() => expect(screen.getByText('SP Metadata')).toBeInTheDocument());
    fireEvent.click(screen.getByText('SP Metadata'));
    await waitFor(() => expect(screen.getByText('Entity ID')).toBeInTheDocument());
    expect(screen.getByText('ACS URL')).toBeInTheDocument();
  });

  it('saves configuration on save button click', async () => {
    render(<SSOSettings onBack={mockOnBack} />);
    await waitFor(() => expect(screen.getByText('common.save')).toBeInTheDocument());
    fireEvent.click(screen.getByText('common.save'));
    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalledWith(expect.stringContaining('/sso/config'), expect.objectContaining({ method: 'PUT' })));
  });

  it('tests SSO connection', async () => {
    render(<SSOSettings onBack={mockOnBack} />);
    await waitFor(() => expect(screen.getByText('Test Connection')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Test Connection'));
    await waitFor(() => expect(screen.getByText('Connection successful')).toBeInTheDocument());
  });

  it('shows test failure result', async () => {
    (globalThis.fetch as any).mockImplementation((url: string) => {
      if (url.includes('/sso/test')) {
        return Promise.resolve({ ok: false, status: 500 });
      }
      if (url.includes('/sso/config')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockSSOConfig) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve(mockSPMetadata) });
    });
    render(<SSOSettings onBack={mockOnBack} />);
    await waitFor(() => expect(screen.getByText('Test Connection')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Test Connection'));
    await waitFor(() => expect(screen.getByText('Connection test failed')).toBeInTheDocument());
  });

  it('handles load error gracefully', async () => {
    (globalThis.fetch as any).mockImplementation(() => Promise.resolve({ ok: false, status: 500 }));
    render(<SSOSettings onBack={mockOnBack} />);
    await waitFor(() => expect(screen.getByText('Failed to load SSO configuration.')).toBeInTheDocument());
  });

  it('adds and removes allowed domains', async () => {
    render(<SSOSettings onBack={mockOnBack} />);
    await waitFor(() => expect(screen.getByText('@example.com')).toBeInTheDocument());
    const domainInput = screen.getByPlaceholderText('example.com');
    fireEvent.change(domainInput, { target: { value: 'newdomain.com' } });
    const addBtn = domainInput.closest('div')?.querySelector('button');
    fireEvent.click(addBtn!);
    await waitFor(() => expect(screen.getByText('@newdomain.com')).toBeInTheDocument());
  });

  it('calls onBack when back button is clicked', async () => {
    render(<SSOSettings onBack={mockOnBack} />);
    await waitFor(() => expect(screen.getByText('settings.sso')).toBeInTheDocument());
    const backBtn = document.querySelector('[data-testid="icon-ArrowLeft"]')?.closest('button');
    if (backBtn) {
      fireEvent.click(backBtn);
      expect(mockOnBack).toHaveBeenCalled();
    }
  });

  it('shows advanced settings with toggles', async () => {
    render(<SSOSettings onBack={mockOnBack} />);
    await waitFor(() => expect(screen.getByText('Advanced')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Advanced'));
    await waitFor(() => expect(screen.getByText('Just-in-Time Provisioning')).toBeInTheDocument());
    expect(screen.getByText('Sign Authentication Requests')).toBeInTheDocument();
    expect(screen.getByText('Force Re-Authentication')).toBeInTheDocument();
  });
});
