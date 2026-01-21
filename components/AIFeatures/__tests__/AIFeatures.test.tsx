
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PolicyGenerator } from '../PolicyGenerator';
import { ContractAnalyzer } from '../ContractAnalyzer';
import { BCPGenerator } from '../BCPGenerator';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// Mock the API service which BCPGenerator uses
vi.mock('../../../services/api', () => ({
  api: {
    ai: {
      generatePolicy: vi.fn().mockResolvedValue('# Policy Content'),
      analyzeContract: vi.fn().mockResolvedValue('# Risks Found'),
      generateBCP: vi.fn().mockResolvedValue({ plan: '# Recovery Plan', contactTree: [] })
    }
  }
}));

// Mock geminiService for components that use it directly
vi.mock('../../../services/geminiService', () => ({
  generatePolicy: vi.fn().mockResolvedValue('# Policy Content'),
  analyzeContract: vi.fn().mockResolvedValue('# Risks Found'),
  generateBCP: vi.fn().mockResolvedValue({ plan: '# Recovery Plan', contactTree: [] })
}));

describe('AI Features', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('PolicyGenerator generates content', async () => {
    render(<PolicyGenerator onBack={vi.fn()} />);
    
    fireEvent.click(screen.getByText('Generate Policy'));
    await waitFor(() => expect(screen.getByText('Policy Content')).toBeInTheDocument(), { timeout: 3000 });
  });

  it('ContractAnalyzer handles input', async () => {
    render(<ContractAnalyzer onBack={vi.fn()} />);
    
    const input = screen.getByPlaceholderText(/Paste contract text/i);
    fireEvent.change(input, { target: { value: 'Contract text' } });
    
    fireEvent.click(screen.getByText(/Analyze for/i));
    await waitFor(() => expect(screen.getByText('Risks Found')).toBeInTheDocument(), { timeout: 3000 });
  });

  it('BCPGenerator renders result', async () => {
    render(<BCPGenerator onBack={vi.fn()} />);
    
    fireEvent.click(screen.getByText('Generate Plan'));
    // The component renders markdown, so "# Recovery Plan" becomes "Recovery Plan" heading
    await waitFor(() => {
      // Check if Recovery Plan text appears anywhere (rendered from markdown)
      const hasRecoveryPlan = screen.queryByText(/Recovery Plan/i);
      expect(hasRecoveryPlan).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});