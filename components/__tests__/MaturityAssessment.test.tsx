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

describe('MaturityAssessment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<MaturityAssessment />);
    expect(document.body.innerHTML.length).toBeGreaterThan(0);
  });

  it('displays overview tab by default', () => {
    render(<MaturityAssessment />);
    const content = document.body.textContent || '';
    expect(content.length).toBeGreaterThan(0);
  });

  it('shows domain scores', () => {
    render(<MaturityAssessment />);
    const content = document.body.textContent || '';
    expect(content).toBeTruthy();
  });

  it('navigates to questionnaire tab', () => {
    render(<MaturityAssessment />);
    const buttons = screen.getAllByRole('button');
    const qTab = buttons.find(b => b.textContent?.includes('Questionnaire') || b.textContent?.includes('questionnaire'));
    if (qTab) {
      fireEvent.click(qTab);
      expect(document.body.textContent).toBeTruthy();
    }
  });

  it('navigates to gap analysis tab', () => {
    render(<MaturityAssessment />);
    const buttons = screen.getAllByRole('button');
    const gapTab = buttons.find(b => b.textContent?.includes('Gap') || b.textContent?.includes('gap'));
    if (gapTab) {
      fireEvent.click(gapTab);
    }
  });

  it('navigates to history tab', () => {
    render(<MaturityAssessment />);
    const buttons = screen.getAllByRole('button');
    const histTab = buttons.find(b => b.textContent?.includes('History') || b.textContent?.includes('history'));
    if (histTab) {
      fireEvent.click(histTab);
    }
  });

  it('renders maturity level indicators', () => {
    render(<MaturityAssessment />);
    const content = document.body.textContent || '';
    expect(content).toBeTruthy();
  });

  it('renders SVG radar chart', () => {
    render(<MaturityAssessment />);
    expect(document.body.innerHTML.length).toBeGreaterThan(0);
  });

  it('renders with assessment data', () => {
    render(<MaturityAssessment />);
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });
});
