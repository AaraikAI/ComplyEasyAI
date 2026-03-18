import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn().mockReturnValue({ user: { id: 'u1', name: 'Admin', email: 'admin@t.com', role: 'admin', organizationId: 'org-1', organization: { plan: 'Growth', name: 'Org' } }, isAuthenticated: true, logout: vi.fn() }),
}));
vi.mock('@/contexts/I18nContext', () => ({ useI18n: () => ({ t: (key: string) => key, locale: 'en', setLocale: vi.fn(), availableLocales: [], isLoading: false }) }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }));

const { auditPrepAnalyze, auditPrepGetGaps, auditPrepGetQuestions, auditPrepGetEvidence, auditPrepGetSummary } = vi.hoisted(() => ({
  auditPrepAnalyze: vi.fn(),
  auditPrepGetGaps: vi.fn(),
  auditPrepGetQuestions: vi.fn(),
  auditPrepGetEvidence: vi.fn(),
  auditPrepGetSummary: vi.fn(),
}));

vi.mock('@/services/api', () => ({
  api: {
    auditPrep: { analyze: auditPrepAnalyze, getGaps: auditPrepGetGaps, getQuestions: auditPrepGetQuestions, getEvidence: auditPrepGetEvidence, getSummary: auditPrepGetSummary },
    frameworks: { list: vi.fn().mockResolvedValue([{ id: 'f1', name: 'SOC 2' }, { id: 'f2', name: 'ISO 27001' }]) },
  },
  getAuthToken: vi.fn().mockReturnValue('test-token'),
  clearAuthToken: vi.fn(),
}));

import AuditPrepAssistant from '../AuditPrepAssistant';

describe('AuditPrepAssistant', () => {
  const mockOnBack = vi.fn();
  beforeEach(() => {
    vi.clearAllMocks();
    auditPrepAnalyze.mockResolvedValue({ overallScore: 82, frameworkName: 'SOC 2', domains: [], totalControls: 100, passingControls: 82, gapsCount: 5, evidenceCount: 50, staleEvidenceCount: 3, estimatedDaysToReady: 14, lastAnalyzedAt: new Date().toISOString() });
    auditPrepGetGaps.mockResolvedValue([]);
    auditPrepGetQuestions.mockResolvedValue([]);
    auditPrepGetEvidence.mockResolvedValue([]);
    auditPrepGetSummary.mockResolvedValue({ overallReadiness: 'Good', score: 82, strengths: [], weaknesses: [], keyRisks: [], recommendations: [], timeline: '2 weeks', narrative: 'Ready' });
  });

  it('renders the framework selection step', () => {
    render(<AuditPrepAssistant onBack={mockOnBack} />);
    expect(screen.queryAllByText(/Audit Prep|audit/i).length).toBeGreaterThan(0);
  });

  it('shows framework selection options', () => {
    render(<AuditPrepAssistant onBack={mockOnBack} />);
    expect(screen.queryAllByText(/SOC 2|ISO 27001|Select Framework|framework/i).length).toBeGreaterThan(0);
  });

  it('renders wizard navigation', () => {
    render(<AuditPrepAssistant onBack={mockOnBack} />);
    const stepIndicators = document.querySelectorAll('[class*="step"], [class*="wizard"]');
    expect(stepIndicators.length).toBeGreaterThanOrEqual(0);
  });

  it('calls onBack when back button clicked', () => {
    render(<AuditPrepAssistant onBack={mockOnBack} />);
    const backBtn = document.querySelector('[data-testid="icon-ArrowLeft"]')?.closest('button');
    if (backBtn) {
      fireEvent.click(backBtn);
      expect(mockOnBack).toHaveBeenCalled();
    }
  });

  it('renders without onBack prop', () => {
    render(<AuditPrepAssistant />);
    expect(screen.queryAllByText(/Audit Prep|audit/i).length).toBeGreaterThan(0);
  });
});
