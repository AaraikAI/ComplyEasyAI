
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AIReportGenerator } from '../AIReportGenerator';
import { AuthProvider } from '../../contexts/AuthContext';
import { generateComplianceReport } from '../../services/geminiService';



import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

vi.mock('../../services/geminiService', () => ({
  generateComplianceReport: vi.fn()
}));

describe('AIReportGenerator', () => {
  it('renders form inputs', () => {
    render(
      <AuthProvider>
        <AIReportGenerator />
      </AuthProvider>
    );
    expect(screen.getByText('Report Configuration')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Acme Corp')).toBeInTheDocument();
  });

  it('disables generate button if context empty', () => {
    render(
      <AuthProvider>
        <AIReportGenerator />
      </AuthProvider>
    );
    const btn = screen.getByText('Generate Report');
    // Initially disabled or check logic? The component disables if !context
    // context starts empty
    expect(btn).toBeDisabled(); // Or checking class for disabled style
  });

  it('triggers generation', async () => {
    const mockReport = '## Executive Summary\nLooks good.';
    (generateComplianceReport as ReturnType<typeof vi.fn>).mockResolvedValue(mockReport);
    render(
      <AuthProvider>
        <AIReportGenerator />
      </AuthProvider>
    );

    const contextArea = screen.getByPlaceholderText(/E.g., We have migrated/i);
    fireEvent.change(contextArea, { target: { value: 'My context data' } });

    const btn = screen.getByText('Generate Report');
    expect(btn).not.toBeDisabled();

    fireEvent.click(btn);

    // Wait for loading state or result
    await waitFor(() => {
      // Check if either loading is shown or report content appears
      const hasLoading = screen.queryByText('Analyzing with AI...');
      const hasReport = screen.queryByText(/Executive Summary/i) || screen.queryByText(/Looks good/i);
      expect(hasLoading || hasReport).toBeTruthy();
    }, { timeout: 3000 });

    // Wait for final result
    await waitFor(() => {
      expect(generateComplianceReport).toHaveBeenCalled();
    }, { timeout: 3000 });
  });
});