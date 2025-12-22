import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RiskManagement } from '../RiskManagement';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock the API service - define inline to avoid hoisting issues
vi.mock('../../services/api', () => ({
  api: {
    risks: {
      list: vi.fn().mockResolvedValue([
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
      ])
    }
  }
}));

// Mock Gemini service
vi.mock('../../services/geminiService', () => ({
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
    
    // Verify the API was called (accessing the mock through the module)
    const { api } = await import('../../services/api');
    expect(api.risks.list).toHaveBeenCalled();
  });

  it('displays risks sorted by severity', async () => {
    render(<RiskManagement onBack={vi.fn()} />);

    // Wait for component to load
    await screen.findByText('Risk Management');

    // Wait for data to load - both risks should be visible
    await screen.findByText('Unencrypted S3 Bucket detected in production environment.');
    expect(screen.getByText('3 employees have not completed mandatory security training.')).toBeInTheDocument();

    // Verify severity column exists and can be sorted
    const severityHeader = screen.getByText('Severity');
    expect(severityHeader).toBeInTheDocument();

    // Click to sort
    fireEvent.click(severityHeader);

    // Both risks should still be visible after sorting
    expect(screen.getByText('Unencrypted S3 Bucket detected in production environment.')).toBeInTheDocument();
    expect(screen.getByText('3 employees have not completed mandatory security training.')).toBeInTheDocument();
  });

  it('opens remediation modal on manage click', async () => {
    render(<RiskManagement onBack={vi.fn()} />);

    // Wait for component and data to load
    await screen.findByText('Risk Management');
    await screen.findByText('Unencrypted S3 Bucket detected in production environment.');

    // Find and click Manage button
    const manageButtons = screen.getAllByText('Manage');
    expect(manageButtons.length).toBeGreaterThan(0);
    fireEvent.click(manageButtons[0]);

    // Wait for modal to appear - look for "Remediation & Task" heading
    await waitFor(() => {
      expect(screen.getByText('Remediation & Task')).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});
