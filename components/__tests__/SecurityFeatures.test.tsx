import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

vi.mock('react-markdown', () => ({ default: ({ children }: any) => <div>{children}</div> }));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn().mockReturnValue({
    user: { id: '1', name: 'Test', email: 'test@t.com', role: 'admin', organizationId: 'org-1', organization: { plan: 'Growth', name: 'Org' } },
    isAuthenticated: true,
    logout: vi.fn(),
  }),
}));

// Hoisted mock functions
const {
  getZeroTrustPolicies, getDeviceTrusts, createZeroTrustPolicy, verifyDeviceTrust,
  getZKProofs, generateComplianceProof, generateCredentialProof, generateOwnershipProof,
  getBYOKKeys, generateBYOKKey,
  getCompliancePolicies, getComplianceReports, createCompliancePolicy,
} = vi.hoisted(() => ({
  getZeroTrustPolicies: vi.fn(),
  getDeviceTrusts: vi.fn(),
  createZeroTrustPolicy: vi.fn(),
  verifyDeviceTrust: vi.fn(),
  getZKProofs: vi.fn(),
  generateComplianceProof: vi.fn(),
  generateCredentialProof: vi.fn(),
  generateOwnershipProof: vi.fn(),
  getBYOKKeys: vi.fn(),
  generateBYOKKey: vi.fn(),
  getCompliancePolicies: vi.fn(),
  getComplianceReports: vi.fn(),
  createCompliancePolicy: vi.fn(),
}));

vi.mock('@/services/api', () => ({
  api: {
    security: {
      getZeroTrustPolicies, getDeviceTrusts, createZeroTrustPolicy, verifyDeviceTrust,
      getZKProofs, generateComplianceProof, generateCredentialProof, generateOwnershipProof,
      getBYOKKeys, generateBYOKKey,
      getCompliancePolicies, getComplianceReports, createCompliancePolicy,
    },
  },
  getAuthToken: vi.fn().mockReturnValue('test-token'),
  clearAuthToken: vi.fn(),
}));

vi.mock('@/constants/tierFeatures', () => ({
  canAccessView: vi.fn().mockReturnValue(true),
  normalizePlan: vi.fn().mockReturnValue('Growth'),
  hasFeature: vi.fn().mockReturnValue(true),
  TIER_ORDER: ['Foundation', 'Essentials', 'Growth', 'Visionary'],
}));

import SecurityFeatures from '@/components/SecurityFeatures';

describe('SecurityFeatures', () => {
  const mockOnBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, 'alert').mockImplementation(() => {});
    sessionStorage.clear();
    // Set default mock implementations
    getZeroTrustPolicies.mockResolvedValue([]);
    getDeviceTrusts.mockResolvedValue([]);
    createZeroTrustPolicy.mockResolvedValue({ id: 'p1' });
    verifyDeviceTrust.mockResolvedValue({ deviceId: 'dev1', trustScore: 85, isTrusted: true });
    getZKProofs.mockResolvedValue([]);
    generateComplianceProof.mockResolvedValue({ proofId: 'proof-1', proof: { data: 'abc' } });
    generateCredentialProof.mockResolvedValue({ proofId: 'cred-1', isValid: true, proof: { data: 'xyz' } });
    generateOwnershipProof.mockResolvedValue({ proofId: 'own-1', isValid: true, proof: { data: 'def' } });
    getBYOKKeys.mockResolvedValue([]);
    generateBYOKKey.mockResolvedValue({ keyId: 'key-1', region: 'us-east-1' });
    getCompliancePolicies.mockResolvedValue([]);
    getComplianceReports.mockResolvedValue([]);
    createCompliancePolicy.mockResolvedValue({ id: 'cp1', name: 'Test Policy', framework: 'SOC2', severity: 'high', rego: 'package test' });
  });

  // ---------------------------------------------------------------------------
  // Basic Rendering
  // ---------------------------------------------------------------------------
  it('renders the Security Features heading and subtitle', () => {
    render(<SecurityFeatures />);
    expect(screen.getByText('Security')).toBeInTheDocument();
    expect(screen.getByText('Advanced security and compliance management')).toBeInTheDocument();
  });

  it('renders all four tab buttons', () => {
    render(<SecurityFeatures />);
    expect(screen.getByText('Zero Trust')).toBeInTheDocument();
    expect(screen.getByText('Zero-Knowledge Proofs')).toBeInTheDocument();
    expect(screen.getByText('BYOK Encryption')).toBeInTheDocument();
    expect(screen.getByText('Compliance-as-Code')).toBeInTheDocument();
  });

  it('shows back button when onBack is provided', () => {
    render(<SecurityFeatures onBack={mockOnBack} />);
    const backBtn = screen.getByText(/Back/);
    fireEvent.click(backBtn);
    expect(mockOnBack).toHaveBeenCalled();
  });

  it('does not show back button when onBack is not provided', () => {
    render(<SecurityFeatures />);
    expect(screen.queryByText(/← Back/)).not.toBeInTheDocument();
  });

  // ---------------------------------------------------------------------------
  // Tab Switching
  // ---------------------------------------------------------------------------
  it('defaults to Zero Trust tab', async () => {
    render(<SecurityFeatures />);
    await waitFor(() => expect(screen.getByText('Zero Trust Security')).toBeInTheDocument());
  });

  it('switches to ZKP tab', async () => {
    render(<SecurityFeatures />);
    fireEvent.click(screen.getByText('Zero-Knowledge Proofs'));
    await waitFor(() => expect(screen.getByText('Zero-Knowledge Proofs', { selector: 'h2' })).toBeInTheDocument());
    expect(screen.getByText('Compliance Proof')).toBeInTheDocument();
  });

  it('switches to BYOK tab', async () => {
    render(<SecurityFeatures />);
    fireEvent.click(screen.getByText('BYOK Encryption'));
    await waitFor(() => expect(screen.getByText('Bring Your Own Key (BYOK)')).toBeInTheDocument());
  });

  it('switches to Compliance-as-Code tab', async () => {
    render(<SecurityFeatures />);
    fireEvent.click(screen.getByText('Compliance-as-Code'));
    await waitFor(() => expect(screen.getByText('Compliance-as-Code', { selector: 'h2' })).toBeInTheDocument());
  });

  it('reads tab from sessionStorage on mount', () => {
    sessionStorage.setItem('securityActiveTab', 'byok');
    render(<SecurityFeatures />);
    // Should auto-switch to BYOK
    expect(screen.getByText('Bring Your Own Key (BYOK)')).toBeInTheDocument();
  });

  it('responds to securityTabChange custom event', async () => {
    render(<SecurityFeatures />);
    const event = new CustomEvent('securityTabChange', { detail: { tab: 'zkp' } });
    window.dispatchEvent(event);
    await waitFor(() => expect(screen.getByText('Zero-Knowledge Proofs', { selector: 'h2' })).toBeInTheDocument());
  });

  // ---------------------------------------------------------------------------
  // Zero Trust Tab
  // ---------------------------------------------------------------------------
  it('shows empty policies state', async () => {
    render(<SecurityFeatures />);
    await waitFor(() => expect(screen.getByText('No policies configured')).toBeInTheDocument());
  });

  it('shows empty devices state', async () => {
    render(<SecurityFeatures />);
    await waitFor(() => expect(screen.getByText('No devices verified')).toBeInTheDocument());
  });

  it('shows policies when data is returned', async () => {
    getZeroTrustPolicies.mockResolvedValueOnce([
      { id: 'p1', name: 'Default Policy', description: 'Base security', enabled: true },
      { id: 'p2', name: 'Strict Policy', description: 'Enhanced security', enabled: false },
    ]);
    render(<SecurityFeatures />);
    await waitFor(() => expect(screen.getByText('Default Policy')).toBeInTheDocument());
    expect(screen.getByText('Strict Policy')).toBeInTheDocument();
    expect(screen.getByText('settings.enabled')).toBeInTheDocument();
    expect(screen.getByText('settings.disabled')).toBeInTheDocument();
  });

  it('shows devices when data is returned', async () => {
    getDeviceTrusts.mockResolvedValueOnce([
      { deviceId: 'dev1', trustScore: 90, isTrusted: true },
      { deviceId: 'dev2', trustScore: 40, isTrusted: false },
    ]);
    render(<SecurityFeatures />);
    await waitFor(() => expect(screen.getByText('dev1')).toBeInTheDocument());
    expect(screen.getByText('dev2')).toBeInTheDocument();
    expect(screen.getByText('Trust Score: 90%')).toBeInTheDocument();
    expect(screen.getByText('Trust Score: 40%')).toBeInTheDocument();
  });

  it('opens and submits Create Policy modal', async () => {
    render(<SecurityFeatures />);
    await waitFor(() => expect(screen.getByText('Create Policy')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Create Policy'));
    await waitFor(() => expect(screen.getByText('Create Zero Trust Policy')).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText('Policy Name'), { target: { value: 'Test Policy' } });
    fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'Test desc' } });
    const submitBtn = screen.getByRole('button', { name: 'Create' });
    fireEvent.click(submitBtn);
    await waitFor(() => expect(createZeroTrustPolicy).toHaveBeenCalledWith(expect.objectContaining({ name: 'Test Policy' })));
  });

  it('cancels Create Policy modal', async () => {
    render(<SecurityFeatures />);
    await waitFor(() => expect(screen.getByText('Create Policy')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Create Policy'));
    await waitFor(() => expect(screen.getByText('Create Zero Trust Policy')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Cancel'));
    await waitFor(() => expect(screen.queryByText('Create Zero Trust Policy')).not.toBeInTheDocument());
  });

  it('opens and submits Verify Device modal', async () => {
    render(<SecurityFeatures />);
    await waitFor(() => expect(screen.getByText('Verify Device')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Verify Device'));
    await waitFor(() => expect(screen.getByText('Verify Device', { selector: 'h3' })).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText('Device ID'), { target: { value: 'my-laptop' } });
    fireEvent.change(screen.getByLabelText('Device Type'), { target: { value: 'desktop' } });
    const verifyBtn = screen.getAllByText('Verify Device').find(el => el.closest('button[type="submit"]'));
    fireEvent.click(verifyBtn || screen.getByRole('button', { name: /Verify/i }));
    await waitFor(() => expect(verifyDeviceTrust).toHaveBeenCalled());
  });

  it('cancels Verify Device modal', async () => {
    render(<SecurityFeatures />);
    await waitFor(() => expect(screen.getByText('Verify Device')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Verify Device'));
    await waitFor(() => expect(screen.getByText('Verify Device', { selector: 'h3' })).toBeInTheDocument());
    fireEvent.click(screen.getByText('Cancel'));
    await waitFor(() => expect(screen.queryByText('Device Type')).not.toBeInTheDocument());
  });

  it('handles create policy failure', async () => {
    createZeroTrustPolicy.mockRejectedValueOnce(new Error('Policy creation failed'));
    render(<SecurityFeatures />);
    await waitFor(() => expect(screen.getByText('Create Policy')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Create Policy'));
    await waitFor(() => expect(screen.getByText('Create Zero Trust Policy')).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText('Policy Name'), { target: { value: 'Fail Policy' } });
    fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'Will fail' } });
    const submitBtn = screen.getByRole('button', { name: 'Create' });
    fireEvent.click(submitBtn);
    await waitFor(() => expect(createZeroTrustPolicy).toHaveBeenCalled());
  });

  // ---------------------------------------------------------------------------
  // ZKP Tab
  // ---------------------------------------------------------------------------
  it('renders ZKP sub-tabs: compliance, credential, ownership', async () => {
    render(<SecurityFeatures />);
    fireEvent.click(screen.getByText('Zero-Knowledge Proofs'));
    await waitFor(() => expect(screen.getByText('Compliance Proof')).toBeInTheDocument());
    expect(screen.getByText('Credential Proof')).toBeInTheDocument();
    expect(screen.getByText('Ownership Proof')).toBeInTheDocument();
  });

  it('submits compliance proof form', async () => {
    render(<SecurityFeatures />);
    fireEvent.click(screen.getByText('Zero-Knowledge Proofs'));
    await waitFor(() => expect(screen.getByText('Generate Compliance Proof')).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText('Framework ID'), { target: { value: 'SOC2' } });
    fireEvent.change(screen.getByLabelText('Controls Implemented'), { target: { value: '10' } });
    fireEvent.change(screen.getByLabelText('Total Controls'), { target: { value: '15' } });
    fireEvent.change(screen.getByLabelText('Evidence Hash'), { target: { value: 'abc123' } });
    fireEvent.click(screen.getByText('Generate Proof'));
    await waitFor(() => expect(generateComplianceProof).toHaveBeenCalledWith('SOC2', expect.objectContaining({ controlsImplemented: 10, totalControls: 15 })));
    await waitFor(() => expect(screen.getByText('Generated Compliance Proof')).toBeInTheDocument());
  });

  it('switches to credential proof sub-tab and submits', async () => {
    render(<SecurityFeatures />);
    fireEvent.click(screen.getByText('Zero-Knowledge Proofs'));
    await waitFor(() => expect(screen.getByText('Credential Proof')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Credential Proof'));
    await waitFor(() => expect(screen.getByText('Generate Credential Proof')).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText('Credential Type'), { target: { value: 'certificate' } });
    fireEvent.change(screen.getByLabelText('Credential Hash'), { target: { value: 'hash123' } });
    fireEvent.change(screen.getByLabelText('Issuer'), { target: { value: 'TestCA' } });
    fireEvent.click(screen.getByText('Generate Proof'));
    await waitFor(() => expect(generateCredentialProof).toHaveBeenCalled());
    await waitFor(() => expect(screen.getByText('Generated Credential Proof')).toBeInTheDocument());
  });

  it('switches to ownership proof sub-tab and submits', async () => {
    render(<SecurityFeatures />);
    fireEvent.click(screen.getByText('Zero-Knowledge Proofs'));
    await waitFor(() => expect(screen.getByText('Ownership Proof')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Ownership Proof'));
    await waitFor(() => expect(screen.getByText('Generate Ownership Proof')).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText('Asset Type'), { target: { value: 'document' } });
    fireEvent.change(screen.getByLabelText('Asset ID'), { target: { value: 'doc-123' } });
    fireEvent.change(screen.getByLabelText('Ownership Hash'), { target: { value: 'hash456' } });
    fireEvent.click(screen.getByText('Generate Proof'));
    await waitFor(() => expect(generateOwnershipProof).toHaveBeenCalled());
    await waitFor(() => expect(screen.getByText('Generated Ownership Proof')).toBeInTheDocument());
  });

  // ---------------------------------------------------------------------------
  // BYOK Tab
  // ---------------------------------------------------------------------------
  it('shows empty keys state in BYOK tab', async () => {
    render(<SecurityFeatures />);
    fireEvent.click(screen.getByText('BYOK Encryption'));
    await waitFor(() => expect(screen.getByText('No encryption keys configured')).toBeInTheDocument());
  });

  it('shows keys when data is returned', async () => {
    getBYOKKeys.mockResolvedValueOnce([
      { id: 'k1', keyId: 'aws-key-1', provider: 'aws_kms', region: 'us-east-1', createdAt: '2024-01-01' },
    ]);
    render(<SecurityFeatures />);
    fireEvent.click(screen.getByText('BYOK Encryption'));
    await waitFor(() => expect(screen.getByText('aws-key-1')).toBeInTheDocument());
    expect(screen.getByText(/aws_kms/)).toBeInTheDocument();
  });

  it('opens Generate Key modal and selects AWS KMS', async () => {
    render(<SecurityFeatures />);
    fireEvent.click(screen.getByText('BYOK Encryption'));
    await waitFor(() => expect(screen.getByText('Generate Key')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Generate Key'));
    await waitFor(() => expect(screen.getByText('Generate Encryption Key')).toBeInTheDocument());
    expect(screen.getByLabelText('Region')).toBeInTheDocument();
  });

  it('shows Azure KV fields when Azure selected', async () => {
    render(<SecurityFeatures />);
    fireEvent.click(screen.getByText('BYOK Encryption'));
    await waitFor(() => expect(screen.getByText('Generate Key')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Generate Key'));
    await waitFor(() => expect(screen.getByText('Generate Encryption Key')).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText('Provider'), { target: { value: 'azure_kv' } });
    await waitFor(() => expect(screen.getByLabelText('Vault URL')).toBeInTheDocument());
    expect(screen.getByLabelText('Key Name')).toBeInTheDocument();
  });

  it('shows GCP KMS fields when GCP selected', async () => {
    render(<SecurityFeatures />);
    fireEvent.click(screen.getByText('BYOK Encryption'));
    await waitFor(() => expect(screen.getByText('Generate Key')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Generate Key'));
    await waitFor(() => expect(screen.getByText('Generate Encryption Key')).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText('Provider'), { target: { value: 'gcp_kms' } });
    await waitFor(() => expect(screen.getByLabelText('Project ID')).toBeInTheDocument());
    expect(screen.getByLabelText('Location')).toBeInTheDocument();
    expect(screen.getByLabelText('Key Ring')).toBeInTheDocument();
    expect(screen.getByLabelText('Key ID')).toBeInTheDocument();
  });

  it('shows HashiCorp Vault fields', async () => {
    render(<SecurityFeatures />);
    fireEvent.click(screen.getByText('BYOK Encryption'));
    await waitFor(() => expect(screen.getByText('Generate Key')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Generate Key'));
    await waitFor(() => expect(screen.getByText('Generate Encryption Key')).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText('Provider'), { target: { value: 'hashicorp_vault' } });
    await waitFor(() => expect(screen.getByLabelText('Vault URL')).toBeInTheDocument());
  });

  it('submits Generate Key form for AWS', async () => {
    render(<SecurityFeatures />);
    fireEvent.click(screen.getByText('BYOK Encryption'));
    await waitFor(() => expect(screen.getByText('Generate Key')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Generate Key'));
    await waitFor(() => expect(screen.getByText('Generate Encryption Key')).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText('Region'), { target: { value: 'us-west-2' } });
    const submitBtn = screen.getAllByText('Generate Key').find(el => el.closest('button[type="submit"]'));
    fireEvent.click(submitBtn!);
    await waitFor(() => expect(generateBYOKKey).toHaveBeenCalledWith('aws_kms', expect.objectContaining({ region: 'us-west-2' })));
  });

  it('cancels Generate Key modal', async () => {
    render(<SecurityFeatures />);
    fireEvent.click(screen.getByText('BYOK Encryption'));
    await waitFor(() => expect(screen.getByText('Generate Key')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Generate Key'));
    await waitFor(() => expect(screen.getByText('Generate Encryption Key')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Cancel'));
    await waitFor(() => expect(screen.queryByText('Generate Encryption Key')).not.toBeInTheDocument());
  });

  // ---------------------------------------------------------------------------
  // Compliance-as-Code Tab
  // ---------------------------------------------------------------------------
  it('renders empty compliance policies', async () => {
    render(<SecurityFeatures />);
    fireEvent.click(screen.getByText('Compliance-as-Code'));
    await waitFor(() => expect(screen.getByText('Compliance-as-Code', { selector: 'h2' })).toBeInTheDocument());
    expect(screen.getByText(/Define compliance policies as code/)).toBeInTheDocument();
  });

  it('shows compliance policies when data returned', async () => {
    getCompliancePolicies.mockResolvedValueOnce([
      { id: 'cp1', name: 'MFA Policy', framework: 'SOC2', severity: 'critical', rego: 'package mfa\ndefault allow = false' },
    ]);
    render(<SecurityFeatures />);
    fireEvent.click(screen.getByText('Compliance-as-Code'));
    await waitFor(() => expect(screen.getByText('MFA Policy')).toBeInTheDocument());
    expect(screen.getByText('SOC2')).toBeInTheDocument();
    expect(screen.getByText('critical')).toBeInTheDocument();
  });

  it('opens and submits Create Compliance Policy modal', async () => {
    render(<SecurityFeatures />);
    fireEvent.click(screen.getByText('Compliance-as-Code'));
    await waitFor(() => expect(screen.getAllByText('Create Policy').length).toBeGreaterThan(0));
    fireEvent.click(screen.getAllByText('Create Policy')[0]);
    await waitFor(() => expect(screen.getByText('Create Compliance Policy')).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText('Policy Name'), { target: { value: 'Access Policy' } });
    fireEvent.change(screen.getByLabelText('Rego Policy Code'), { target: { value: 'package access\ndefault allow = false' } });
    const submitBtn = screen.getAllByRole('button', { name: /Create/i }).find(el => el.getAttribute('type') === 'submit') || screen.getAllByRole('button', { name: /Create/i })[1];
    fireEvent.click(submitBtn!);
    await waitFor(() => expect(createCompliancePolicy).toHaveBeenCalledWith(expect.objectContaining({ name: 'Access Policy' })));
  });

  it('cancels Create Compliance Policy modal', async () => {
    render(<SecurityFeatures />);
    fireEvent.click(screen.getByText('Compliance-as-Code'));
    await waitFor(() => expect(screen.getAllByText('Create Policy').length).toBeGreaterThan(0));
    fireEvent.click(screen.getAllByText('Create Policy')[0]);
    await waitFor(() => expect(screen.getByText('Create Compliance Policy')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Cancel'));
    await waitFor(() => expect(screen.queryByText('Create Compliance Policy')).not.toBeInTheDocument());
  });

  it('changes framework and severity in compliance policy form', async () => {
    render(<SecurityFeatures />);
    fireEvent.click(screen.getByText('Compliance-as-Code'));
    await waitFor(() => expect(screen.getAllByText('Create Policy').length).toBeGreaterThan(0));
    fireEvent.click(screen.getAllByText('Create Policy')[0]);
    await waitFor(() => expect(screen.getByText('Create Compliance Policy')).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText('Framework'), { target: { value: 'GDPR' } });
    fireEvent.change(screen.getByLabelText('Severity'), { target: { value: 'critical' } });
    expect(screen.getByLabelText('Framework')).toHaveValue('GDPR');
    expect(screen.getByLabelText('Severity')).toHaveValue('critical');
  });
});
