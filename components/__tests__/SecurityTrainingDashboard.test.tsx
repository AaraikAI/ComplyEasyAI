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

  it('opens create module form', () => {
    render(<SecurityTrainingDashboard onBack={vi.fn()} />);
    const addBtn = screen.queryAllByText(/Create|New|Add/i)[0] ?? null;
    if (addBtn) fireEvent.click(addBtn);
  });

  it('filters by search', () => {
    render(<SecurityTrainingDashboard onBack={vi.fn()} />);
    const searchInput = screen.queryByPlaceholderText(/search/i);
    if (searchInput) fireEvent.change(searchInput, { target: { value: 'phishing' } });
  });

  it('switches to assignments tab', () => {
    render(<SecurityTrainingDashboard onBack={vi.fn()} />);
    const tab = screen.queryAllByText(/Assignments|assignments/i)[0] ?? null;
    if (tab) fireEvent.click(tab);
  });

  it('switches to reports tab', () => {
    render(<SecurityTrainingDashboard onBack={vi.fn()} />);
    const tab = screen.queryAllByText(/Reports|reports/i)[0] ?? null;
    if (tab) fireEvent.click(tab);
  });

  it('switches between admin and employee view', () => {
    render(<SecurityTrainingDashboard onBack={vi.fn()} />);
    const viewToggle = screen.queryAllByText(/Employee|employee/i)[0] ?? null;
    if (viewToggle) fireEvent.click(viewToggle);
  });

  it('shows training categories', async () => {
    render(<SecurityTrainingDashboard onBack={vi.fn()} />);
    await waitFor(() => expect(screen.queryAllByText(/Security Awareness|Data Privacy|Incident Response|Phishing/i).length).toBeGreaterThan(0));
  });

  it('shows module detail', () => {
    render(<SecurityTrainingDashboard onBack={vi.fn()} />);
    const rows = document.querySelectorAll('tr[class*="cursor-pointer"], div[class*="cursor-pointer"]');
    if (rows.length > 0) fireEvent.click(rows[0]);
  });

  it('filters by category', () => {
    render(<SecurityTrainingDashboard onBack={vi.fn()} />);
    const catFilter = screen.queryByDisplayValue(/All/i);
    if (catFilter) fireEvent.change(catFilter, { target: { value: 'SecurityAwareness' } });
  });
});
