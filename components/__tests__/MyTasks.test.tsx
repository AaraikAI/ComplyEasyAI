
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MyTasks } from '../MyTasks';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

declare const describe: any;
declare const test: any;
declare const expect: any;
declare const jest: any;
declare const beforeEach: any;

// Mock dependencies
jest.mock('../../services/api', () => ({
  api: {
    risks: {
      list: jest.fn(),
      update: jest.fn()
    },
    audit: {
      log: jest.fn()
    }
  }
}));

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: jest.fn()
}));

jest.mock('../../services/geminiService', () => ({
  generateRemediationPlan: jest.fn().mockResolvedValue('AI Fix Plan')
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

  test('renders tasks assigned to user', async () => {
    render(<MyTasks />);
    await waitFor(() => {
      expect(screen.getByText('High Severity Task')).toBeInTheDocument();
      expect(screen.getByText('Low Severity Task')).toBeInTheDocument();
    });
  });

  test('filters tasks by severity', async () => {
    render(<MyTasks />);
    await waitFor(() => screen.getByText('High Severity Task'));

    const filter = screen.getByDisplayValue('All Severities');
    fireEvent.change(filter, { target: { value: 'High' } });

    expect(screen.getByText('High Severity Task')).toBeInTheDocument();
    expect(screen.queryByText('Low Severity Task')).not.toBeInTheDocument();
  });

  test('opens action modal and updates task', async () => {
    render(<MyTasks />);
    await waitFor(() => screen.getByText('High Severity Task'));

    const actionBtns = screen.getAllByText('Action');
    fireEvent.click(actionBtns[0]);

    await waitFor(() => screen.getByText('Update Task'));
    
    // Change status
    fireEvent.click(screen.getByText('Resolved'));
    fireEvent.click(screen.getByText('Save Update'));

    await waitFor(() => {
      expect(api.risks.update).toHaveBeenCalledWith(expect.objectContaining({
        id: 't1',
        status: 'Resolved'
      }));
    });
  });
});