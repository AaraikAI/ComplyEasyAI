
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PolicyGenerator } from '../PolicyGenerator';
import { ContractAnalyzer } from '../ContractAnalyzer';
import { BCPGenerator } from '../BCPGenerator';
import * as geminiService from '../../../services/geminiService';



import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

vi.mock('../../../services/geminiService');

describe('AI Features', () => {
  it('PolicyGenerator generates content', async () => {
    (geminiService.generatePolicy as any).mockResolvedValue('# Policy Content');
    render(<PolicyGenerator onBack={vi.fn()} />);
    
    fireEvent.click(screen.getByText('Generate Policy'));
    await waitFor(() => expect(screen.getByText('Policy Content')).toBeInTheDocument());
  });

  it('ContractAnalyzer handles input', async () => {
    (geminiService.analyzeContract as any).mockResolvedValue('# Risks Found');
    render(<ContractAnalyzer onBack={vi.fn()} />);
    
    const input = screen.getByPlaceholderText(/Paste contract text/i);
    fireEvent.change(input, { target: { value: 'Contract text' } });
    
    fireEvent.click(screen.getByText(/Analyze for/i));
    await waitFor(() => expect(screen.getByText('Risks Found')).toBeInTheDocument());
  });

  it('BCPGenerator renders result', async () => {
    (geminiService.generateBCP as any).mockResolvedValue('# Recovery Plan');
    render(<BCPGenerator onBack={vi.fn()} />);
    
    fireEvent.click(screen.getByText('Generate Plan'));
    await waitFor(() => expect(screen.getByText('Recovery Plan')).toBeInTheDocument());
  });
});