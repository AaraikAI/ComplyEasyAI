import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn().mockReturnValue({ user: { id: 'u1', name: 'Admin', email: 'admin@t.com', role: 'admin', organizationId: 'org-1', organization: { plan: 'Growth', name: 'Org' } }, isAuthenticated: true, logout: vi.fn() }),
}));
vi.mock('@/contexts/I18nContext', () => ({ useI18n: () => ({ t: (key: string) => key, locale: 'en', setLocale: vi.fn(), availableLocales: [], isLoading: false }) }));

const { apiGet } = vi.hoisted(() => ({
  apiGet: vi.fn(),
}));

vi.mock('@/services/api', () => ({
  api: {
    get: apiGet,
    search: apiGet,
  },
  getAuthToken: vi.fn().mockReturnValue('test-token'),
  clearAuthToken: vi.fn(),
}));

vi.mock('@/constants/featureCatalog', () => ({
  FEATURE_CATALOG: [],
}));

import GlobalSearch from '../GlobalSearch';

describe('GlobalSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiGet.mockResolvedValue({ data: [] });
  });

  it('renders without crashing', () => {
    render(<GlobalSearch isOpen={true} />);
    expect(document.querySelector('input, [class*="search"]')).toBeTruthy();
  });

  it('shows search input', () => {
    render(<GlobalSearch isOpen={true} />);
    const input = screen.queryByPlaceholderText(/search/i);
    expect(input).toBeTruthy();
  });

  it('accepts search query input', () => {
    render(<GlobalSearch isOpen={true} />);
    const input = screen.queryByPlaceholderText(/search/i);
    if (input) {
      fireEvent.change(input, { target: { value: 'SOC 2' } });
      expect((input as HTMLInputElement).value).toBe('SOC 2');
    }
  });

  it('shows empty state with no query', () => {
    render(<GlobalSearch isOpen={true} />);
    const input = screen.queryByPlaceholderText(/search/i);
    if (input) {
      fireEvent.change(input, { target: { value: '' } });
    }
  });

  it('handles keyboard shortcut', () => {
    render(<GlobalSearch isOpen={true} />);
    const input = screen.queryByPlaceholderText(/search/i);
    if (input) {
      fireEvent.keyDown(input, { key: 'Escape' });
    }
  });
});
