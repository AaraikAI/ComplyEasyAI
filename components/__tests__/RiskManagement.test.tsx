
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RiskManagement } from '../RiskManagement';



import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// Mock dependencies
vi.mock('../../services/geminiService', () => ({
  prioritizeRisks: vi.fn().mockResolvedValue([
    { id: 'r1', score: 99, rationale: 'Test Rationale' }
  ]),
  generateRemediationPlan: vi.fn().mockResolvedValue('Fix it now.')
}));

describe('RiskManagement Component', () => {
  it('renders risk table with mock data', () => {
    render(<RiskManagement onBack={vi.fn()} />);
    expect(screen.getByText('Risk Management')).toBeInTheDocument();
    expect(screen.getByText('Unencrypted S3 Bucket detected in production environment.')).toBeInTheDocument();
  });

  it('filters risks by severity', () => {
    render(<RiskManagement onBack={vi.fn()} />);
    const filterSelect = screen.getByDisplayValue('All Severities');
    
    fireEvent.change(filterSelect, { target: { value: 'High' } });
    
    // Should show High risk
    expect(screen.getByText('Unencrypted S3 Bucket detected in production environment.')).toBeInTheDocument();
    // Should NOT show Medium risk (assuming r2 is medium in constants)
    const mediumRisk = screen.queryByText('3 employees have not completed mandatory security training.');
    expect(mediumRisk).not.toBeInTheDocument();
  });

  it('opens remediation modal on manage click', async () => {
    render(<RiskManagement onBack={vi.fn()} />);
    
    const manageButtons = screen.getAllByText('Manage');
    fireEvent.click(manageButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Remediation & Task')).toBeInTheDocument();
      expect(screen.getByText('Technical Remediation Plan')).toBeInTheDocument();
    });
  });
});
