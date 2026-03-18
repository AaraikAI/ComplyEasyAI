
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('../../contexts/I18nContext', () => ({
  useI18n: () => ({ t: (key: string) => key, locale: 'en', setLocale: vi.fn(), availableLocales: [], isLoading: false }),
}));

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: vi.fn().mockReturnValue({
    user: { id: '1', name: 'Test User', email: 'test@test.com', role: 'admin', organizationId: 'org-1', organization: { plan: 'Growth', name: 'Test Org' } },
    isAuthenticated: true,
    logout: vi.fn(),
  }),
  AuthProvider: ({ children }: any) => <>{children}</>,
}));

vi.mock('../../services/api', () => ({
  api: {
    frameworks: { list: vi.fn().mockResolvedValue([]) },
  },
  getAuthToken: vi.fn().mockReturnValue('test-token'),
  clearAuthToken: vi.fn(),
}));

vi.mock('../../services/geminiService', () => ({
  generateComplianceReport: vi.fn(),
}));

vi.mock('react-markdown', () => ({ default: ({ children }: any) => <div>{children}</div> }));

import { AIReportGenerator } from '../AIReportGenerator';
import { generateComplianceReport } from '../../services/geminiService';

describe('AIReportGenerator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders form inputs', async () => {
    render(<AIReportGenerator />);
    expect(screen.getByText('Report Configuration')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Acme Corp')).toBeInTheDocument();
  });

  it('disables generate button if context empty', () => {
    render(<AIReportGenerator />);
    // Button text is t('ai.generating') = 'ai.generating'
    const btn = screen.getByText('ai.generating');
    expect(btn.closest('button')).toBeDisabled();
  });

  it('triggers generation', async () => {
    const mockReport = '## Executive Summary\nLooks good.';
    (generateComplianceReport as ReturnType<typeof vi.fn>).mockResolvedValue(mockReport);
    render(<AIReportGenerator />);

    const contextArea = screen.getByPlaceholderText(/E.g., We have migrated/i);
    fireEvent.change(contextArea, { target: { value: 'My context data' } });

    const btn = screen.getByText('ai.generating');
    expect(btn.closest('button')).not.toBeDisabled();

    fireEvent.click(btn.closest('button')!);

    await waitFor(() => {
      expect(generateComplianceReport).toHaveBeenCalled();
    }, { timeout: 3000 });
  });
});
