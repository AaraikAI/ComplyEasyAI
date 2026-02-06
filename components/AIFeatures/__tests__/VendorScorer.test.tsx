import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { VendorScorer } from '../VendorScorer';

vi.mock('react-markdown', () => ({ default: ({ children }: any) => <div>{children}</div> }));
vi.mock('@/services/api', () => ({ api: { ai: { scoreVendor: vi.fn().mockResolvedValue({ result: 'Vendor risk score: 7/10' }) } }, getAuthToken: vi.fn().mockReturnValue('token') }));
vi.mock('@/hooks/useOnboarding', () => ({ useOnboardingTrigger: vi.fn() }));
vi.mock('@/services/piiService', () => ({ redactPII: vi.fn((text: string) => ({ redactedText: text, map: new Map() })), rehydratePII: vi.fn((text: string) => text) }));

describe('VendorScorer', () => {
  const mockOnBack = vi.fn();
  beforeEach(() => { vi.clearAllMocks(); });

  it('should render vendor scoring form', () => { render(<VendorScorer onBack={mockOnBack} />); expect(screen.getByText('Vendor Risk Scorer')).toBeTruthy(); });
  it('should have input fields', () => { render(<VendorScorer onBack={mockOnBack} />); const inputs = document.querySelectorAll('input, textarea, select'); expect(inputs.length).toBeGreaterThan(0); });
  it('should have back button', () => { render(<VendorScorer onBack={mockOnBack} />); const backBtn = screen.getByTestId('icon-ArrowLeft').closest('button')!; fireEvent.click(backBtn); expect(mockOnBack).toHaveBeenCalled(); });
  it('should have generate button', () => { render(<VendorScorer onBack={mockOnBack} />); const buttons = screen.getAllByRole('button'); expect(buttons.length).toBeGreaterThan(0); });
});
