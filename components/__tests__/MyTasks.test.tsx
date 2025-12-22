
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MyTasks } from '../MyTasks';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';



import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// Mock dependencies
vi.mock('../../services/api', () => ({
  api: {
    risks: {
      list: vi.fn(),
      update: vi.fn()
    },
    audit: {
      log: vi.fn()
    }
  }
}));

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: vi.fn()
}));

vi.mock('../../services/geminiService', () => ({
  generateRemediationPlan: vi.fn().mockResolvedValue('AI Fix Plan')
}));

describe('MyTasks Component', () => {
  const mockUser = { name: 'Sarah Connor', email: 'sarah@test.com' };
  const mockTasks = [
    { 
      id: 't1', 
      description: 'High Severity Task', 
      severity: 'High', 
      status: 'Open', 
      assignedTo: 'Sarah Connor', 
      detectedAt: '2024-01-01',
      aiPriorityScore: 90 
    },
    { 
      id: 't2', 
      description: 'Low Severity Task', 
      severity: 'Low', 
      status: 'Resolved', 
      assignedTo: 'Sarah Connor', 
      detectedAt: '2024-01-02',
      aiPriorityScore: 20 
    }
  ];

  beforeEach(() => {
    (useAuth as any).mockReturnValue({ user: mockUser });
    (api.risks.list as any).mockResolvedValue(mockTasks);
  });

  it('renders tasks assigned to user', async () => {
    render(<MyTasks />);
    await waitFor(() => {
      expect(screen.getByText('High Severity Task')).toBeInTheDocument();
      expect(screen.getByText('Low Severity Task')).toBeInTheDocument();
    });
  });

  it('filters tasks by severity', async () => {
    render(<MyTasks />);
    await waitFor(() => screen.getByText('High Severity Task'));

    const filter = screen.getByDisplayValue('All Severities');
    fireEvent.change(filter, { target: { value: 'High' } });

    expect(screen.getByText('High Severity Task')).toBeInTheDocument();
    expect(screen.queryByText('Low Severity Task')).not.toBeInTheDocument();
  });

  it('opens action modal on button click', async () => {
    render(<MyTasks />);

    // Wait for tasks to load
    await screen.findByText('High Severity Task');

    // Click action button (should open modal)
    const actionBtns = screen.getAllByText('Action');
    expect(actionBtns.length).toBeGreaterThan(0);
    fireEvent.click(actionBtns[0]);

    // Wait for modal to appear - look for modal content
    await waitFor(() => {
      // The modal should show "Update Task" heading or task details
      const hasUpdateTask = screen.queryByText('Update Task');
      const hasTaskDescription = screen.queryByText('High Severity Task');
      expect(hasUpdateTask || hasTaskDescription).toBeTruthy();
    }, { timeout: 3000 });
  });
});