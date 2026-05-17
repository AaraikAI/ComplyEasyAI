import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const mockAnalyzeAndAnchor = vi.fn();
const mockVerifyIntegrity = vi.fn();
const mockGetProvenance = vi.fn();
const mockGetAnalysis = vi.fn();
const mockGetHistory = vi.fn();

vi.mock('@/services/api', () => ({
  api: {
    acos: {
      analyzeAndAnchor: (...args: any[]) => mockAnalyzeAndAnchor(...args),
      verifyIntegrity: (...args: any[]) => mockVerifyIntegrity(...args),
      getProvenance: (...args: any[]) => mockGetProvenance(...args),
      getEvidenceAnalysis: (...args: any[]) => mockGetAnalysis(...args),
      getAnalysisHistory: (...args: any[]) => mockGetHistory(...args),
    },
  },
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
}));

import EvidenceDetailPanel from '../AIFeatures/EvidenceDetailPanel';

describe('EvidenceDetailPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAnalysis.mockResolvedValue({
      evidenceId: 'ev-1',
      deepfakeScore: 0.05,
      cryptographicHash: 'abc123def456',
      overallConfidence: 0.92,
      verificationStatus: 'verified',
      createdAt: '2026-05-10T10:00:00.000Z',
    });
    mockGetProvenance.mockResolvedValue({
      evidenceId: 'ev-1',
      chainOfCustody: [
        { action: 'evidence.uploaded', hash: 'h1', timestamp: '2026-05-10T10:00:00.000Z', actor: 'u1' },
      ],
      analyses: [],
      blockchainAnchors: [
        { hash: 'h1', transactionHash: '0xtx', blockNumber: 42, network: 'polygon', timestamp: '2026-05-10T10:05:00.000Z' },
      ],
      attestations: [],
      integrityScore: 95,
    });
    mockGetHistory.mockResolvedValue([]);
  });

  it('renders all three sub-tabs and switches between them', async () => {
    render(<EvidenceDetailPanel evidenceId="ev-1" onClose={() => {}} />);

    expect(screen.getByText('Overview')).toBeTruthy();
    expect(screen.getByText('Provenance')).toBeTruthy();
    expect(screen.getByText('Actions')).toBeTruthy();

    await waitFor(() => expect(screen.getByText('Verification Status')).toBeTruthy());

    fireEvent.click(screen.getByText('Provenance'));
    await waitFor(() => expect(screen.getByText('Chain of Custody')).toBeTruthy());

    fireEvent.click(screen.getByText('Actions'));
    // "Verify Integrity" appears uniquely once on the Actions panel
    await waitFor(() => expect(screen.getByText('Verify Integrity')).toBeTruthy());
  });

  it('calls analyzeAndAnchor with the selected network when the user submits a file', async () => {
    mockAnalyzeAndAnchor.mockResolvedValue({ evidenceId: 'ev-1', blockchainAnchor: { transactionHash: '0xtx', blockNumber: 99, network: 'ethereum' } });
    render(<EvidenceDetailPanel evidenceId="ev-1" onClose={() => {}} />);

    await waitFor(() => expect(screen.getByText('Actions')).toBeTruthy());
    fireEvent.click(screen.getByText('Actions'));
    await waitFor(() => expect(screen.getByText('Verify Integrity')).toBeTruthy());

    const networkSelect = screen.getByRole('combobox') as HTMLSelectElement;
    fireEvent.change(networkSelect, { target: { value: 'ethereum' } });

    const file = new File(['hello'], 'evidence.pdf', { type: 'application/pdf' });
    const fileInputs = document.querySelectorAll('input[type="file"]');
    const anchorInput = fileInputs[0] as HTMLInputElement;
    fireEvent.change(anchorInput, { target: { files: [file] } });

    // The submit button is the one rendered as <button>Analyze and Anchor</button>, not the <h3>
    const submitButton = screen
      .getAllByRole('button')
      .find(b => b.textContent?.trim() === 'Analyze and Anchor');
    expect(submitButton).toBeTruthy();
    fireEvent.click(submitButton!);

    await waitFor(() => expect(mockAnalyzeAndAnchor).toHaveBeenCalled());
    const callArgs = mockAnalyzeAndAnchor.mock.calls[0];
    expect(callArgs[0]).toBe('ev-1');
    expect(callArgs[1]).toBeInstanceOf(File);
    expect(callArgs[2]).toMatchObject({ network: 'ethereum' });
  });
});
