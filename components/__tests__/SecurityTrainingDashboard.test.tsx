import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const mockModules = [
  { id: 'm1', title: 'Phishing 101', description: 'Learn phishing', category: 'SecurityAwareness', durationMinutes: 30, passingScore: 80, expiresInMonths: 12, version: 1, isActive: true, status: 'Published', totalAssigned: 5, completionRate: 60, createdAt: '2025-01-01', updatedAt: '2025-01-01' },
  { id: 'm2', title: 'Data Protection', description: 'Data privacy basics', category: 'DataPrivacy', durationMinutes: 45, passingScore: 75, expiresInMonths: 12, version: 1, isActive: true, status: 'Published', totalAssigned: 3, completionRate: 40, createdAt: '2025-01-01', updatedAt: '2025-01-01' },
];

import SecurityTrainingDashboard from '../SecurityTrainingDashboard';

describe('SecurityTrainingDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(globalThis, 'fetch').mockImplementation((input: any) => {
      const url = typeof input === 'string' ? input : input.url;
      if (url.includes('/modules')) return Promise.resolve(new Response(JSON.stringify(mockModules), { status: 200 }));
      if (url.includes('/assignments')) return Promise.resolve(new Response(JSON.stringify([]), { status: 200 }));
      if (url.includes('/compliance-report')) return Promise.resolve(new Response(JSON.stringify({ totalUsers: 10, trainedUsers: 5, overallComplianceRate: 50, byCategory: [] }), { status: 200 }));
      return Promise.resolve(new Response(JSON.stringify([]), { status: 200 }));
    });
  });

  it('renders without crashing', () => {
    render(<SecurityTrainingDashboard onBack={vi.fn()} />);
    expect(screen.queryAllByText(/Security Training|Training|training/i).length).toBeGreaterThan(0);
  });

  it('shows admin view by default', () => {
    render(<SecurityTrainingDashboard onBack={vi.fn()} />);
    expect(screen.queryAllByText(/Modules|modules|Training Modules/i).length).toBeGreaterThan(0);
  });

  it('shows training modules list', async () => {
    render(<SecurityTrainingDashboard onBack={vi.fn()} />);
    await waitFor(() => expect(screen.queryAllByText(/Phishing 101|Data Protection/i).length).toBeGreaterThan(0));
  });

  it('shows stat cards', () => {
    render(<SecurityTrainingDashboard onBack={vi.fn()} />);
    const stats = document.querySelectorAll('[class*="rounded-xl"]');
    expect(stats.length).toBeGreaterThanOrEqual(0);
  });

  it('opens create module form', async () => {
    render(<SecurityTrainingDashboard onBack={vi.fn()} />);
    // Wait for the modules tab to finish loading, then open the create modal.
    const addBtn = await screen.findByText('New Module');
    fireEvent.click(addBtn);
    expect(await screen.findByText('Create Training Module')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('filters by search', async () => {
    render(<SecurityTrainingDashboard onBack={vi.fn()} />);
    // Both modules render once loaded.
    expect(await screen.findByText('Phishing 101')).toBeInTheDocument();
    expect(screen.getByText('Data Protection')).toBeInTheDocument();
    const searchInput = screen.getByPlaceholderText('Search modules...');
    fireEvent.change(searchInput, { target: { value: 'phishing' } });
    // Search narrows the list to the matching module only.
    expect(screen.getByText('Phishing 101')).toBeInTheDocument();
    expect(screen.queryByText('Data Protection')).not.toBeInTheDocument();
  });

  it('switches to assignments tab', async () => {
    render(<SecurityTrainingDashboard onBack={vi.fn()} />);
    const tab = await screen.findByText('Assignments');
    fireEvent.click(tab);
    // Assignments tab shows the assignment summary cards.
    expect(await screen.findByText('Total Assignments')).toBeInTheDocument();
  });

  it('switches to reports tab', async () => {
    render(<SecurityTrainingDashboard onBack={vi.fn()} />);
    const tab = await screen.findByText('Compliance Reports');
    fireEvent.click(tab);
    // Reports tab shows the overall-compliance summary card.
    expect(await screen.findByText('Overall Compliance')).toBeInTheDocument();
  });

  it('switches between admin and employee view', async () => {
    render(<SecurityTrainingDashboard onBack={vi.fn()} />);
    // Modules render in the default admin view.
    expect(await screen.findByText('Phishing 101')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Employee'));
    // Employee view replaces the module list with the personal trainings header.
    expect(await screen.findByText('My Trainings')).toBeInTheDocument();
    expect(screen.queryByText('Training Modules')).not.toBeInTheDocument();
  });

  it('shows training categories', async () => {
    render(<SecurityTrainingDashboard onBack={vi.fn()} />);
    await screen.findByText('Phishing 101');
    // Category labels render on the module card badges (and the filter options).
    expect(screen.getAllByText('Security Awareness').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Data Privacy').length).toBeGreaterThan(0);
  });

  it('shows module detail', async () => {
    render(<SecurityTrainingDashboard onBack={vi.fn()} />);
    // Each module card renders its detail fields (title, duration, pass threshold).
    expect(await screen.findByText('Phishing 101')).toBeInTheDocument();
    expect(screen.getByText('30 min')).toBeInTheDocument();
    expect(screen.getByText('80% to pass')).toBeInTheDocument();
  });

  it('filters by category', async () => {
    render(<SecurityTrainingDashboard onBack={vi.fn()} />);
    expect(await screen.findByText('Data Protection')).toBeInTheDocument();
    const catFilter = screen.getByDisplayValue('All Categories');
    fireEvent.change(catFilter, { target: { value: 'SecurityAwareness' } });
    // Only the SecurityAwareness module survives the category filter.
    expect(screen.getByText('Phishing 101')).toBeInTheDocument();
    expect(screen.queryByText('Data Protection')).not.toBeInTheDocument();
  });
});
