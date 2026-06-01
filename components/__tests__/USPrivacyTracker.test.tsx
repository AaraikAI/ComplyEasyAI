import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

vi.mock('@/contexts/I18nContext', () => ({
  useI18n: () => ({ t: (k: string) => k, locale: 'en', setLocale: vi.fn() }),
}));

const mockGet = vi.fn();
const mockPost = vi.fn();

vi.mock('@/services/api', () => ({
  api: {
    get: (...args: any[]) => mockGet(...args),
    post: (...args: any[]) => mockPost(...args),
    put: vi.fn().mockResolvedValue({}),
    delete: vi.fn().mockResolvedValue({}),
  },
}));

import { USPrivacyTracker } from '../USPrivacyTracker';

describe('USPrivacyTracker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockResolvedValue({ data: [] });
    mockPost.mockResolvedValue({});
  });

  it('renders without crashing', () => {
    render(<USPrivacyTracker />);
    // The page title renders synchronously.
    expect(screen.getByText('Privacy Management')).toBeInTheDocument();
  });

  it('displays US Privacy Tracker content', () => {
    render(<USPrivacyTracker />);
    expect(
      screen.getByText('Comprehensive tracking of all US state privacy laws and multi-state compliance')
    ).toBeInTheDocument();
    expect(screen.getByText('Export Report')).toBeInTheDocument();
  });

  it('shows tab navigation for overview, map, comparison, gap analysis, tracker', () => {
    render(<USPrivacyTracker />);
    ['Overview', 'State Map', 'Comparison', 'Gap Analysis', 'Compliance Tracker'].forEach(label => {
      expect(screen.getByText(label)).toBeInTheDocument();
    });
  });

  it('switches to the state map tab when clicked', () => {
    render(<USPrivacyTracker />);
    fireEvent.click(screen.getByText('State Map'));
    // The map tab renders its dedicated heading.
    expect(screen.getByText('US State Privacy Law Map')).toBeInTheDocument();
  });

  it('renders with state privacy law data', () => {
    render(<USPrivacyTracker />);
    // The overview shows the count card backed by the loaded law catalog.
    expect(screen.getByText('State Laws Tracked')).toBeInTheDocument();
    expect(screen.getByText('States with Private Right of Action')).toBeInTheDocument();
  });

  it('handles empty data', () => {
    render(<USPrivacyTracker />);
    // Even without server data the overview summary cards render.
    expect(screen.getByText('Compliance Rate')).toBeInTheDocument();
    expect(screen.getByText('Pending Tasks')).toBeInTheDocument();
  });

  it('handles API errors', async () => {
    mockGet.mockRejectedValue(new Error('API Error'));
    render(<USPrivacyTracker />);
    // When the data load fails, the component surfaces a specific banner and
    // falls back to its reference template instead of rendering blank.
    expect(
      await screen.findByText('Unable to connect to server. Showing reference template data.')
    ).toBeInTheDocument();
    expect(screen.getByText('State Laws Tracked')).toBeInTheDocument();
  });

  it('renders stat cards', () => {
    render(<USPrivacyTracker />);
    expect(screen.getByText('Open Gaps')).toBeInTheDocument();
    expect(screen.getByText('Effective Date Timeline')).toBeInTheDocument();
  });

  it('shows search functionality', () => {
    render(<USPrivacyTracker />);
    // The search box lives on the State Map tab's law list.
    fireEvent.click(screen.getByText('State Map'));
    expect(screen.getByPlaceholderText('Search state or law...')).toBeInTheDocument();
  });
});
