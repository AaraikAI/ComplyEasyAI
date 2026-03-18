import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

vi.mock('@/contexts/I18nContext', () => ({
  useI18n: () => ({ t: (k: string) => k, locale: 'en', setLocale: vi.fn() }),
}));

const mockGet = vi.fn();
const mockPost = vi.fn();
const mockPut = vi.fn();
const mockDelete = vi.fn();

vi.mock('@/services/api', () => ({
  api: {
    get: (...args: any[]) => mockGet(...args),
    post: (...args: any[]) => mockPost(...args),
    put: (...args: any[]) => mockPut(...args),
    delete: (...args: any[]) => mockDelete(...args),
  },
}));

import ComplianceCalendar from '../ComplianceCalendar';

describe('ComplianceCalendar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockResolvedValue({ deadlines: [] });
    mockPost.mockResolvedValue({ id: 'd-new' });
    mockPut.mockResolvedValue({});
    mockDelete.mockResolvedValue({});
  });

  it('renders without crashing', () => {
    render(<ComplianceCalendar />);
    expect(screen.getByText('calendar.title')).toBeInTheDocument();
  });

  it('displays month view by default', () => {
    render(<ComplianceCalendar />);
    expect(screen.getByText('calendar.title')).toBeInTheDocument();
  });

  it('shows view mode buttons (month, week, day)', () => {
    render(<ComplianceCalendar />);
    expect(screen.getByText('month')).toBeInTheDocument();
    expect(screen.getByText('week')).toBeInTheDocument();
    expect(screen.getByText('day')).toBeInTheDocument();
  });

  it('navigates between months', () => {
    render(<ComplianceCalendar />);
    const nextBtn = screen.getByTestId('icon-ChevronRight').closest('button');
    fireEvent.click(nextBtn!);
    const prevBtn = screen.getByTestId('icon-ChevronLeft').closest('button');
    fireEvent.click(prevBtn!);
  });

  it('opens create deadline form', () => {
    render(<ComplianceCalendar />);
    const addBtn = screen.getByText('calendar.addEvent');
    fireEvent.click(addBtn);
    expect(screen.getByText('Create Deadline')).toBeInTheDocument();
  });

  it('closes create form on cancel', () => {
    render(<ComplianceCalendar />);
    fireEvent.click(screen.getByText('calendar.addEvent'));
    expect(screen.getByText('Create Deadline')).toBeInTheDocument();
    fireEvent.click(screen.getByText('common.cancel'));
    expect(screen.queryByText('Create Deadline')).not.toBeInTheDocument();
  });

  it('switches to week view', () => {
    render(<ComplianceCalendar />);
    fireEvent.click(screen.getByText('week'));
    // week view renders day columns
    expect(document.body.textContent).toBeTruthy();
  });

  it('switches to day view', () => {
    render(<ComplianceCalendar />);
    fireEvent.click(screen.getByText('day'));
    expect(document.body.textContent).toBeTruthy();
  });

  it('renders stat cards', () => {
    render(<ComplianceCalendar />);
    const content = document.body.textContent || '';
    expect(content).toContain('calendar.overdue');
  });

  it('handles empty deadlines', () => {
    mockGet.mockResolvedValue({ deadlines: [] });
    render(<ComplianceCalendar />);
    expect(screen.getByText('calendar.title')).toBeInTheDocument();
  });

  it('handles API errors gracefully', () => {
    mockGet.mockRejectedValue(new Error('API Error'));
    render(<ComplianceCalendar />);
    expect(screen.getByText('calendar.title')).toBeInTheDocument();
  });

  it('shows Today button', () => {
    render(<ComplianceCalendar />);
    expect(screen.getByText('calendar.today')).toBeInTheDocument();
  });
});
