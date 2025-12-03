
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AIReportGenerator } from '../AIReportGenerator';
import { generateComplianceReport } from '../../services/geminiService';

declare const describe: any;
declare const test: any;
declare const expect: any;
declare const jest: any;

jest.mock('../../services/geminiService', () => ({
  generateComplianceReport: jest.fn()
}));

describe('AIReportGenerator', () => {
  test('renders form inputs', () => {
    render(<AIReportGenerator />);
    expect(screen.getByText('Report Configuration')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Acme Corp')).toBeInTheDocument();
  });

  test('disables generate button if context empty', () => {
    render(<AIReportGenerator />);
    const btn = screen.getByText('Generate Report');
    // Initially disabled or check logic? The component disables if !context
    // context starts empty
    expect(btn).toBeDisabled(); // Or checking class for disabled style
  });

  test('triggers generation', async () => {
    (generateComplianceReport as any).mockResolvedValue('## Executive Summary\nLooks good.');
    render(<AIReportGenerator />);
    
    const contextArea = screen.getByPlaceholderText(/E.g., We have migrated/i);
    fireEvent.change(contextArea, { target: { value: 'My context data' } });
    
    const btn = screen.getByText('Generate Report');
    expect(btn).not.toBeDisabled();
    
    fireEvent.click(btn);
    
    expect(screen.getByText('Analyzing with AI...')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('Executive Summary')).toBeInTheDocument();
    });
  });
});