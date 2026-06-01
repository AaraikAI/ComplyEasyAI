import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

vi.mock('@/contexts/I18nContext', () => ({
  useI18n: () => ({ t: (k: string) => k, locale: 'en', setLocale: vi.fn() }),
}));

vi.mock('@/services/api', () => ({
  api: {
    get: vi.fn().mockResolvedValue({ data: [] }),
    post: vi.fn().mockResolvedValue({}),
  },
}));

import MaturityAssessment from '../MaturityAssessment';

// The component gates tab content behind an initial load; wait for the loading
// spinner to clear before asserting on rendered content.
async function waitForLoaded() {
  await waitFor(() => {
    expect(screen.queryByText('common.loading')).not.toBeInTheDocument();
  });
}

describe('MaturityAssessment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the header and overall score banner', async () => {
    render(<MaturityAssessment />);
    // Title is rendered via the (key-returning) i18n mock.
    expect(screen.getByRole('heading', { name: 'maturity.title' })).toBeInTheDocument();
    await waitForLoaded();
    // The "/ 5" denominator next to the overall score is always present.
    expect(screen.getByText('/ 5')).toBeInTheDocument();
  });

  it('shows the tab navigation', () => {
    render(<MaturityAssessment />);
    expect(screen.getByRole('button', { name: /Overview/i })).toBeInTheDocument();
    // Anchored so it matches the "Assessment" tab, not the "Save Assessment" button.
    expect(screen.getByRole('button', { name: /^Assessment$/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /History/i })).toBeInTheDocument();
  });

  it('displays the radar chart and domain scores on the overview tab', async () => {
    render(<MaturityAssessment />);
    await waitForLoaded();
    // Overview is the default tab: assert the radar + domain panels and a domain row.
    expect(screen.getByText('Maturity Radar')).toBeInTheDocument();
    expect(screen.getByText('Maturity Scale Reference')).toBeInTheDocument();
    expect(document.querySelector('svg')).toBeTruthy();
    // Governance is one of the five assessed domains rendered in the scores panel.
    expect(screen.getAllByText('Governance').length).toBeGreaterThan(0);
  });

  it('navigates to the assessment (questionnaire) tab', async () => {
    render(<MaturityAssessment />);
    await waitForLoaded();
    fireEvent.click(screen.getByRole('button', { name: /^Assessment$/ }));
    // The first Governance question from the default question set is shown.
    expect(screen.getByText(/Is there a formal information security policy approved by management/i)).toBeInTheDocument();
    expect(screen.getByText(/Question 1 of/i)).toBeInTheDocument();
  });

  it('navigates to the gap analysis tab', async () => {
    render(<MaturityAssessment />);
    await waitForLoaded();
    // The gap tab label comes from the i18n key 'maturity.gap'.
    fireEvent.click(screen.getByRole('button', { name: 'maturity.gap' }));
    expect(screen.getByText('Gap Analysis: Current vs Target')).toBeInTheDocument();
    expect(screen.getByText(/AI-Generated Recommendations/i)).toBeInTheDocument();
  });

  it('navigates to the history tab and shows the empty state', async () => {
    render(<MaturityAssessment />);
    await waitForLoaded();
    fireEvent.click(screen.getByRole('button', { name: /History/i }));
    // With no persisted assessments the history empty-state message renders.
    expect(screen.getByText('No historical assessments found')).toBeInTheDocument();
  });

  it('records an answer in the questionnaire and reflects completion progress', async () => {
    render(<MaturityAssessment />);
    await waitForLoaded();
    fireEvent.click(screen.getByRole('button', { name: /^Assessment$/ }));
    // Initially question 1 is unanswered.
    expect(screen.getByText('Unanswered')).toBeInTheDocument();
    // Answer it by choosing a maturity level option.
    fireEvent.click(screen.getByRole('button', { name: /Level 3 - Defined/i }));
    expect(screen.getByText('Answered')).toBeInTheDocument();
  });

  it('renders the maturity scale levels reference', async () => {
    render(<MaturityAssessment />);
    await waitForLoaded();
    // The five maturity level labels are part of the scale reference.
    expect(screen.getAllByText(/Initial/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Optimizing/).length).toBeGreaterThan(0);
  });

  it('exposes the save assessment action', async () => {
    render(<MaturityAssessment />);
    await waitForLoaded();
    // The save button is present (disabled until questions are answered).
    expect(screen.getByRole('button', { name: /Save Assessment/i })).toBeInTheDocument();
  });
});
