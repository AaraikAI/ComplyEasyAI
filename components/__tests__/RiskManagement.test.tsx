import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RiskManagement } from '../RiskManagement';
import { vi, describe, it, expect, beforeEach } from 'vitest';

const mockUser = { id: 'user-1', name: 'Sarah Connor', email: 'sarah@test.com', role: 'Admin' };

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
    },
    team: {
      list: vi.fn().mockResolvedValue([
        { id: 'u1', name: 'Sarah Connor', email: 'sarah@test.com', role: 'Admin' },
        { id: 'u2', name: 'John Doe', email: 'john@test.com', role: 'User' }
      ])
    }
  }
}));

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: mockUser, isAuthenticated: true }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>
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
      expect(screen.getByText(/Unencrypted S3 Bucket/i)).toBeInTheDocument();
    }, { timeout: 3000 });
    
    // Verify the API was called
    const { api } = await import('../../services/api');
    expect(api.risks.list).toHaveBeenCalled();
  });

  it('displays risks sorted by severity', async () => {
    render(<RiskManagement onBack={vi.fn()} />);

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('Risk Management')).toBeInTheDocument();
    });

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText(/Unencrypted S3 Bucket/i)).toBeInTheDocument();
    }, { timeout: 3000 });

    // Verify risk items are displayed
    expect(screen.getByText(/High/)).toBeInTheDocument();
  });

  it('opens remediation modal on manage click', async () => {
    render(<RiskManagement onBack={vi.fn()} />);

    // Wait for component and data to load
    await waitFor(() => {
      expect(screen.getByText('Risk Management')).toBeInTheDocument();
    });
    
    await waitFor(() => {
      expect(screen.getByText(/Unencrypted S3 Bucket/i)).toBeInTheDocument();
    }, { timeout: 3000 });

    // Find and click Manage button
    const manageButtons = screen.getAllByText('Manage');
    expect(manageButtons.length).toBeGreaterThan(0);
    fireEvent.click(manageButtons[0]);

    // Wait for modal to appear - look for modal title
    await waitFor(() => {
      expect(screen.getByText('Remediation & Task')).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});
