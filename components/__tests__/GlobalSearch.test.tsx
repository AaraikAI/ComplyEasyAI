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
    // The search input must always render when the modal is open; assert it
    // exists unconditionally so the test fails (not silently passes) if it disappears.
    const input = screen.getByPlaceholderText(/search/i) as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'SOC 2' } });
    expect(input.value).toBe('SOC 2');
  });

  it('shows empty state with no query', () => {
    render(<GlobalSearch isOpen={true} />);
    const input = screen.getByPlaceholderText(/search/i) as HTMLInputElement;
    fireEvent.change(input, { target: { value: '' } });
    expect(input.value).toBe('');
    // With no query the modal shows its empty-state prompt rather than results.
    expect(screen.getByText(/Start typing to search across all resources/i)).toBeInTheDocument();
  });

  it('handles keyboard shortcut', () => {
    const onClose = vi.fn();
    render(<GlobalSearch isOpen={true} onClose={onClose} />);
    const input = screen.getByPlaceholderText(/search/i);
    // Escape closes the modal, invoking onClose.
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });
});
