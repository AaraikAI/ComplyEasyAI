import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RiskManagement } from '../RiskManagement';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock the API service
const mockRisksList = vi.fn().mockResolvedValue([
  {
    id: 'r1',
    title: 'Unencrypted S3 Bucket',
    description: 'Unencrypted S3 Bucket detected in production environment.',
    severity: 'High',
    status: 'Open',
    detectedAt: '2024-12-01',
    aiScore: 95
  },
  {
    id: 'r2',
    title: 'Security Training Gap',
    description: '3 employees have not completed mandatory security training.',
    severity: 'Medium',
    status: 'Open',
    detectedAt: '2024-12-02',
    aiScore: 75
  }
]);

vi.mock('../services/api', () => ({
  api: {
    risks: {
      list: mockRisksList
    }
  }
}));

// Mock Gemini service
vi.mock('../services/geminiService', () => ({
  prioritizeRisks: vi.fn().mockResolvedValue([
    { id: 'r1', score: 99, rationale: 'Test Rationale' }
  ]),
  generateRemediationPlan: vi.fn().mockResolvedValue('Fix it now.')
}));

describe('RiskManagement Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders risk table with mock data', async () => {
    render(<RiskManagement onBack={vi.fn()} />);
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Risk Management')).toBeInTheDocument();
    });
    
    // Wait for risks to appear
    await waitFor(() => {
      expect(screen.getByText('Unencrypted S3 Bucket detected in production environment.')).toBeInTheDocument();
    });
    
    expect(mockRisksList).toHaveBeenCalled();
  });

  it('filters risks by severity', async () => {
    render(<RiskManagement onBack={vi.fn()} />);
    
    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('Risk Management')).toBeInTheDocument();
    });
    
    // Find and change severity filter
    await waitFor(() => {
      const filterSelect = screen.getByDisplayValue('All Severities');
      expect(filterSelect).toBeInTheDocument();
      
      fireEvent.change(filterSelect, { target: { value: 'High' } });
    });
    
    // Verify High risk is shown
    await waitFor(() => {
      expect(screen.getByText('Unencrypted S3 Bucket detected in production environment.')).toBeInTheDocument();
    });
  });

  it('opens remediation modal on manage click', async () => {
    render(<RiskManagement onBack={vi.fn()} />);
    
    // Wait for risks to load
    await waitFor(() => {
      expect(screen.getByText('Risk Management')).toBeInTheDocument();
    });
    
    // Find and click Manage button
    await waitFor(() => {
      const manageButtons = screen.getAllByText('Manage');
      expect(manageButtons.length).toBeGreaterThan(0);
      fireEvent.click(manageButtons[0]);
    });

    // Wait for modal to appear
    await waitFor(() => {
      expect(screen.getByText(/Remediation/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});
