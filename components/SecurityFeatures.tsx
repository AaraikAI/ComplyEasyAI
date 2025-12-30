/**
 * Security Features Component
 * Comprehensive UI for Zero Trust, Zero-Knowledge Proofs, BYOK, Compliance-as-Code
 */

import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Key, 
  Lock, 
  Code, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Loader2,
  Plus,
  Trash2,
  Edit,
  RotateCw,
  Eye,
  EyeOff,
  Copy,
  Download,
  Upload,
  Activity,
  Network,
  FileCode
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const SecurityFeatures: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'zero-trust' | 'zkp' | 'byok' | 'compliance-as-code'>('zero-trust');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    // Check if there's a tab to navigate to from chatbot
    const checkTab = () => {
      const securityTab = sessionStorage.getItem('securityActiveTab');
      if (securityTab && ['zero-trust', 'zkp', 'byok', 'compliance-as-code'].includes(securityTab)) {
        setActiveTab(securityTab as any);
        sessionStorage.removeItem('securityActiveTab');
      }
    };
    
    checkTab();
    const timeoutId = setTimeout(checkTab, 100);
    
    // Listen for custom event from chatbot
    const handleTabChange = (event: CustomEvent) => {
      const tab = event.detail?.tab;
      if (tab && ['zero-trust', 'zkp', 'byok', 'compliance-as-code'].includes(tab)) {
        setActiveTab(tab as any);
        sessionStorage.removeItem('securityActiveTab');
      }
    };
    
    window.addEventListener('securityTabChange', handleTabChange as EventListener);
    
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('securityTabChange', handleTabChange as EventListener);
    };
  }, []);

  const tabs = [
    { id: 'zero-trust', label: 'Zero Trust', icon: Shield },
    { id: 'zkp', label: 'Zero-Knowledge Proofs', icon: Key },
    { id: 'byok', label: 'BYOK Encryption', icon: Lock },
    { id: 'compliance-as-code', label: 'Compliance-as-Code', icon: Code },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {onBack && (
          <button
            onClick={onBack}
            className="mb-6 p-2 hover:bg-white rounded-lg transition-colors"
          >
            ← Back
          </button>
        )}

        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900">Security Features</h1>
          <p className="text-slate-600 mt-1">Advanced security and compliance management</p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <span className="text-red-800">{error}</span>
          </div>
        )}
        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-green-800">{success}</span>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6 flex gap-2 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-brand-600 text-white'
                    : 'bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          {activeTab === 'zero-trust' && <ZeroTrustTab />}
          {activeTab === 'zkp' && <ZeroKnowledgeProofsTab />}
          {activeTab === 'byok' && <BYOKTab />}
          {activeTab === 'compliance-as-code' && <ComplianceAsCodeTab />}
        </div>
      </div>
    </div>
  );
};

// Zero Trust Tab
const ZeroTrustTab: React.FC = () => {
  const { user } = useAuth();
  const [policies, setPolicies] = useState<any[]>([]);
  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [showDeviceModal, setShowDeviceModal] = useState(false);
  const [deviceForm, setDeviceForm] = useState({
    deviceId: '',
    deviceType: 'laptop',
    macAddress: '',
    ipAddress: '',
  });
  const [policyForm, setPolicyForm] = useState({
    name: '',
    description: '',
    enabled: true,
    priority: 0,
    rules: [] as any[],
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [policiesData, devicesData] = await Promise.all([
        api.security.getZeroTrustPolicies(),
        api.security.getDeviceTrusts(),
      ]);
      setPolicies(policiesData || []);
      setDevices(devicesData || []);
    } catch (error) {
      console.error('Error loading Zero Trust data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.security.createZeroTrustPolicy(policyForm);
      setShowPolicyModal(false);
      setPolicyForm({ name: '', description: '', enabled: true, priority: 0, rules: [] });
      loadData();
      alert('Zero Trust policy created successfully!');
    } catch (error: any) {
      alert(error.message || 'Failed to create policy');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await api.security.verifyDeviceTrust({
        deviceId: deviceForm.deviceId || `device-${Date.now()}`,
        deviceType: deviceForm.deviceType,
        macAddress: deviceForm.macAddress,
        ipAddress: deviceForm.ipAddress,
      });
      setShowDeviceModal(false);
      setDeviceForm({ deviceId: '', deviceType: 'laptop', macAddress: '', ipAddress: '' });
      // Optimistically add the device to the list
      if (result && result.deviceId) {
        setDevices([result, ...devices]);
      }
      // Reload data to ensure consistency
      await loadData();
      alert(`Device verified successfully! Trust Score: ${result.trustScore}%`);
    } catch (error: any) {
      alert(error.message || 'Failed to verify device');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Zero Trust Security</h2>
        <p className="text-slate-600">Never trust, always verify. Implement Zero Trust architecture with device verification and continuous monitoring.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Policies Section */}
        <div className="border border-slate-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">Policies</h3>
            <button
              onClick={() => setShowPolicyModal(true)}
              className="px-3 py-1 bg-brand-600 text-white rounded-lg text-sm hover:bg-brand-700 flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              Create Policy
            </button>
          </div>
          {loading ? (
            <div className="text-center py-8">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-400" />
            </div>
          ) : policies.length === 0 ? (
            <p className="text-slate-500 text-sm">No policies configured</p>
          ) : (
            <div className="space-y-2">
              {policies.map((policy) => (
                <div key={policy.id} className="p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-900">{policy.name}</p>
                      <p className="text-xs text-slate-600">{policy.description}</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs ${policy.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {policy.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Devices Section */}
        <div className="border border-slate-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">Trusted Devices</h3>
            <button
              onClick={() => setShowDeviceModal(true)}
              className="px-3 py-1 bg-brand-600 text-white rounded-lg text-sm hover:bg-brand-700 flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              Verify Device
            </button>
          </div>
          {loading ? (
            <div className="text-center py-8">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-400" />
            </div>
          ) : devices.length === 0 ? (
            <p className="text-slate-500 text-sm">No devices verified</p>
          ) : (
            <div className="space-y-2">
              {devices.map((device) => (
                <div key={device.deviceId} className="p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-900">{device.deviceId}</p>
                      <p className="text-xs text-slate-600">Trust Score: {device.trustScore}%</p>
                    </div>
                    {device.isTrusted ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Policy Modal */}
      {showPolicyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">Create Zero Trust Policy</h3>
            <form onSubmit={handleCreatePolicy} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Policy Name</label>
                <input
                  type="text"
                  value={policyForm.name}
                  onChange={(e) => setPolicyForm({ ...policyForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  value={policyForm.description}
                  onChange={(e) => setPolicyForm({ ...policyForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  rows={3}
                  required
                />
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={policyForm.enabled}
                    onChange={(e) => setPolicyForm({ ...policyForm, enabled: e.target.checked })}
                  />
                  <span className="text-sm">Enabled</span>
                </label>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
                  <input
                    type="number"
                    value={policyForm.priority}
                    onChange={(e) => setPolicyForm({ ...policyForm, priority: parseInt(e.target.value) || 0 })}
                    className="w-24 px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowPolicyModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Policy'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Verify Device Modal */}
      {showDeviceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
            <h3 className="text-xl font-bold mb-4">Verify Device</h3>
            <form onSubmit={handleVerifyDevice} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Device ID</label>
                <input
                  type="text"
                  value={deviceForm.deviceId}
                  onChange={(e) => setDeviceForm({ ...deviceForm, deviceId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  placeholder="Leave empty for auto-generation"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Device Type</label>
                <select
                  value={deviceForm.deviceType}
                  onChange={(e) => setDeviceForm({ ...deviceForm, deviceType: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                >
                  <option value="laptop">Laptop</option>
                  <option value="desktop">Desktop</option>
                  <option value="mobile">Mobile</option>
                  <option value="server">Server</option>
                  <option value="iot">IoT Device</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">MAC Address (optional)</label>
                <input
                  type="text"
                  value={deviceForm.macAddress}
                  onChange={(e) => setDeviceForm({ ...deviceForm, macAddress: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  placeholder="00:11:22:33:44:55"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">IP Address (optional)</label>
                <input
                  type="text"
                  value={deviceForm.ipAddress}
                  onChange={(e) => setDeviceForm({ ...deviceForm, ipAddress: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  placeholder="192.168.1.1"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowDeviceModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50"
                >
                  {loading ? 'Verifying...' : 'Verify Device'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Zero-Knowledge Proofs Tab
const ZeroKnowledgeProofsTab: React.FC = () => {
  const [proofs, setProofs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeOperation, setActiveOperation] = useState<'compliance' | 'credential' | 'ownership'>('compliance');
  const [complianceForm, setComplianceForm] = useState({
    frameworkId: '',
    controlsImplemented: 0,
    totalControls: 0,
    evidenceHash: '',
  });
  const [credentialForm, setCredentialForm] = useState({
    credentialType: '',
    credentialHash: '',
    issuer: '',
    expirationDate: '',
  });
  const [ownershipForm, setOwnershipForm] = useState({
    assetId: '',
    assetType: '',
    ownershipHash: '',
    timestamp: '',
  });
  const [generatedProof, setGeneratedProof] = useState<any>(null);

  useEffect(() => {
    loadProofs();
  }, []);

  const loadProofs = async () => {
    setLoading(true);
    try {
      const data = await api.security.getZKProofs();
      setProofs(data || []);
    } catch (error) {
      console.error('Error loading ZK proofs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateComplianceProof = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const proof = await api.security.generateComplianceProof(
        complianceForm.frameworkId,
        {
          controlsImplemented: complianceForm.controlsImplemented,
          totalControls: complianceForm.totalControls,
          evidenceHash: complianceForm.evidenceHash,
        }
      );
      setGeneratedProof(proof);
      loadProofs();
      alert('Compliance proof generated successfully!');
    } catch (error: any) {
      alert(error.message || 'Failed to generate proof');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Zero-Knowledge Proofs</h2>
        <p className="text-slate-600">Generate privacy-preserving proofs without revealing sensitive data.</p>
      </div>

      <div className="flex gap-2 mb-6">
        {['compliance', 'credential', 'ownership'].map((op) => (
          <button
            key={op}
            onClick={() => setActiveOperation(op as any)}
            className={`px-4 py-2 rounded-lg font-medium ${
              activeOperation === op
                ? 'bg-brand-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {op.charAt(0).toUpperCase() + op.slice(1)} Proof
          </button>
        ))}
      </div>

      {activeOperation === 'compliance' && (
        <div className="border border-slate-200 rounded-lg p-6">
          <h3 className="font-semibold mb-4">Generate Compliance Proof</h3>
          <form onSubmit={handleGenerateComplianceProof} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Framework ID</label>
              <input
                type="text"
                value={complianceForm.frameworkId}
                onChange={(e) => setComplianceForm({ ...complianceForm, frameworkId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Controls Implemented</label>
                <input
                  type="number"
                  value={complianceForm.controlsImplemented}
                  onChange={(e) => setComplianceForm({ ...complianceForm, controlsImplemented: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Total Controls</label>
                <input
                  type="number"
                  value={complianceForm.totalControls}
                  onChange={(e) => setComplianceForm({ ...complianceForm, totalControls: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Evidence Hash</label>
              <input
                type="text"
                value={complianceForm.evidenceHash}
                onChange={(e) => setComplianceForm({ ...complianceForm, evidenceHash: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-sm"
                placeholder="SHA256 hash of evidence"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50"
            >
              {loading ? 'Generating...' : 'Generate Proof'}
            </button>
          </form>

          {generatedProof && (
            <div className="mt-6 p-4 bg-slate-50 rounded-lg">
              <h4 className="font-medium mb-2">Generated Proof</h4>
              <textarea
                value={JSON.stringify(generatedProof, null, 2)}
                readOnly
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs"
                rows={10}
              />
            </div>
          )}
        </div>
      )}

      {activeOperation === 'credential' && (
        <div className="border border-slate-200 rounded-lg p-6">
          <h3 className="font-semibold mb-4">Generate Credential Proof</h3>
          <form onSubmit={async (e) => {
            e.preventDefault();
            setLoading(true);
            try {
              const proof = await api.security.generateCredentialProof({
                type: credentialForm.credentialType,
                hash: credentialForm.credentialHash,
                issuer: credentialForm.issuer,
                expirationDate: credentialForm.expirationDate,
              }, 'user-secret-key');
              setGeneratedProof(proof);
              loadProofs();
              alert('Credential proof generated successfully!');
            } catch (error: any) {
              alert(error.message || 'Failed to generate proof');
            } finally {
              setLoading(false);
            }
          }} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Credential Type</label>
              <select
                value={credentialForm.credentialType}
                onChange={(e) => setCredentialForm({ ...credentialForm, credentialType: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                required
              >
                <option value="">Select type</option>
                <option value="certificate">Certificate</option>
                <option value="license">License</option>
                <option value="diploma">Diploma</option>
                <option value="badge">Badge</option>
                <option value="membership">Membership</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Credential Hash</label>
              <input
                type="text"
                value={credentialForm.credentialHash}
                onChange={(e) => setCredentialForm({ ...credentialForm, credentialHash: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-sm"
                placeholder="SHA256 hash of credential"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Issuer</label>
              <input
                type="text"
                value={credentialForm.issuer}
                onChange={(e) => setCredentialForm({ ...credentialForm, issuer: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                placeholder="Issuing organization"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Expiration Date</label>
              <input
                type="date"
                value={credentialForm.expirationDate}
                onChange={(e) => setCredentialForm({ ...credentialForm, expirationDate: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50"
            >
              {loading ? 'Generating...' : 'Generate Proof'}
            </button>
          </form>

          {generatedProof && (
            <div className="mt-6 p-4 bg-slate-50 rounded-lg">
              <h4 className="font-medium mb-2">Generated Credential Proof</h4>
              <div className="space-y-2 text-sm">
                <p><strong>Proof ID:</strong> {generatedProof.proofId || generatedProof.id}</p>
                <p><strong>Credential Type:</strong> {generatedProof.credentialType || credentialForm.credentialType}</p>
                <p><strong>Issuer:</strong> {generatedProof.issuer || credentialForm.issuer}</p>
                <p><strong>Valid:</strong> {generatedProof.isValid !== false ? 'Yes' : 'No'}</p>
                {generatedProof.proof && (
                  <textarea
                    value={JSON.stringify(generatedProof.proof, null, 2)}
                    readOnly
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs"
                    rows={8}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {activeOperation === 'ownership' && (
        <div className="border border-slate-200 rounded-lg p-6">
          <h3 className="font-semibold mb-4">Generate Ownership Proof</h3>
          <form onSubmit={async (e) => {
            e.preventDefault();
            setLoading(true);
            try {
              const proof = await api.security.generateOwnershipProof(
                ownershipForm.ownershipHash,
                'user-secret-key'
              );
              setGeneratedProof(proof);
              loadProofs();
              alert('Ownership proof generated successfully!');
            } catch (error: any) {
              alert(error.message || 'Failed to generate proof');
            } finally {
              setLoading(false);
            }
          }} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Asset Type</label>
              <select
                value={ownershipForm.assetType}
                onChange={(e) => setOwnershipForm({ ...ownershipForm, assetType: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                required
              >
                <option value="">Select type</option>
                <option value="data">Data</option>
                <option value="document">Document</option>
                <option value="intellectual_property">Intellectual Property</option>
                <option value="digital_asset">Digital Asset</option>
                <option value="compliance_evidence">Compliance Evidence</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Asset ID</label>
              <input
                type="text"
                value={ownershipForm.assetId}
                onChange={(e) => setOwnershipForm({ ...ownershipForm, assetId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                placeholder="Unique asset identifier"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Ownership Hash</label>
              <input
                type="text"
                value={ownershipForm.ownershipHash}
                onChange={(e) => setOwnershipForm({ ...ownershipForm, ownershipHash: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-sm"
                placeholder="SHA256 hash proving ownership"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Timestamp</label>
              <input
                type="datetime-local"
                value={ownershipForm.timestamp}
                onChange={(e) => setOwnershipForm({ ...ownershipForm, timestamp: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50"
            >
              {loading ? 'Generating...' : 'Generate Proof'}
            </button>
          </form>

          {generatedProof && (
            <div className="mt-6 p-4 bg-slate-50 rounded-lg">
              <h4 className="font-medium mb-2">Generated Ownership Proof</h4>
              <div className="space-y-2 text-sm">
                <p><strong>Proof ID:</strong> {generatedProof.proofId || generatedProof.id}</p>
                <p><strong>Asset ID:</strong> {generatedProof.assetId || ownershipForm.assetId}</p>
                <p><strong>Asset Type:</strong> {generatedProof.assetType || ownershipForm.assetType}</p>
                <p><strong>Owner Verified:</strong> {generatedProof.isValid !== false ? 'Yes' : 'No'}</p>
                {generatedProof.proof && (
                  <textarea
                    value={JSON.stringify(generatedProof.proof, null, 2)}
                    readOnly
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs"
                    rows={8}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// BYOK Tab
const BYOKTab: React.FC = () => {
  const [keys, setKeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [keyForm, setKeyForm] = useState({
    provider: 'aws_kms' as 'aws_kms' | 'azure_kv' | 'gcp_kms' | 'hashicorp_vault' | 'local',
    region: '',
    vaultUrl: '',
    keyName: '',
    description: '',
  });

  useEffect(() => {
    loadKeys();
  }, []);

  const loadKeys = async () => {
    setLoading(true);
    try {
      const data = await api.security.getBYOKKeys();
      setKeys(data || []);
    } catch (error) {
      console.error('Error loading BYOK keys:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await api.security.generateBYOKKey(keyForm.provider, {
        region: keyForm.region,
        vaultUrl: keyForm.vaultUrl,
        keyName: keyForm.keyName,
        description: keyForm.description,
      });
      setShowKeyModal(false);
      setKeyForm({ provider: 'aws_kms', region: '', vaultUrl: '', keyName: '', description: '' });
      // Optimistically add the key to the list
      if (result && result.keyId) {
        const newKey = {
          id: result.keyId,
          keyId: result.keyId,
          provider: keyForm.provider,
          region: result.region || keyForm.region || 'N/A',
          vaultUrl: result.vaultUrl || keyForm.vaultUrl || '',
          createdAt: new Date().toISOString(),
        };
        setKeys([...keys, newKey]);
      }
      // Reload keys from server
      await loadKeys();
      alert('Key generated successfully!');
    } catch (error: any) {
      alert(error.message || 'Failed to generate key');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Bring Your Own Key (BYOK)</h2>
        <p className="text-slate-600">Manage encryption keys from AWS KMS or Azure Key Vault.</p>
      </div>

      <div className="flex justify-end mb-4">
        <button
          onClick={() => setShowKeyModal(true)}
          className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Generate Key
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-slate-400" />
        </div>
      ) : keys.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-lg">
          <Lock className="w-12 h-12 mx-auto text-slate-400 mb-4" />
          <p className="text-slate-600">No encryption keys configured</p>
        </div>
      ) : (
        <div className="space-y-3">
          {keys.map((key) => (
            <div key={key.id} className="border border-slate-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-900">{key.keyId || key.id}</p>
                  <p className="text-sm text-slate-600">{key.provider} • {key.region || 'N/A'}</p>
                </div>
                <div className="flex gap-2">
                  <button className="p-2 hover:bg-slate-100 rounded">
                    <RotateCw className="w-4 h-4" />
                  </button>
                  <button className="p-2 hover:bg-slate-100 rounded">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showKeyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
            <h3 className="text-xl font-bold mb-4">Generate Encryption Key</h3>
            <form onSubmit={handleGenerateKey} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Provider</label>
                <select
                  value={keyForm.provider}
                  onChange={(e) => setKeyForm({ ...keyForm, provider: e.target.value as any })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                >
                  <option value="aws_kms">AWS KMS</option>
                  <option value="azure_kv">Azure Key Vault</option>
                  <option value="gcp_kms">Google Cloud KMS</option>
                  <option value="hashicorp_vault">HashiCorp Vault</option>
                  <option value="local">Local Key Management</option>
                </select>
              </div>
              {keyForm.provider === 'aws_kms' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Region</label>
                  <input
                    type="text"
                    value={keyForm.region}
                    onChange={(e) => setKeyForm({ ...keyForm, region: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    placeholder="us-east-1"
                    required
                  />
                </div>
              )}
              {keyForm.provider === 'azure_kv' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Vault URL</label>
                    <input
                      type="text"
                      value={keyForm.vaultUrl}
                      onChange={(e) => setKeyForm({ ...keyForm, vaultUrl: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                      placeholder="https://your-vault.vault.azure.net"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Key Name</label>
                    <input
                      type="text"
                      value={keyForm.keyName}
                      onChange={(e) => setKeyForm({ ...keyForm, keyName: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                      required
                    />
                  </div>
                </>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <input
                  type="text"
                  value={keyForm.description}
                  onChange={(e) => setKeyForm({ ...keyForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowKeyModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50"
                >
                  {loading ? 'Generating...' : 'Generate Key'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Compliance-as-Code Tab
const ComplianceAsCodeTab: React.FC = () => {
  const [policies, setPolicies] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [policyForm, setPolicyForm] = useState({
    name: '',
    framework: 'SOC2',
    rego: '',
    severity: 'high' as 'critical' | 'high' | 'medium' | 'low',
    tags: [] as string[],
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [policiesData, reportsData] = await Promise.all([
        api.security.getCompliancePolicies(),
        api.security.getComplianceReports(),
      ]);
      setPolicies(policiesData || []);
      setReports(reportsData || []);
    } catch (error) {
      console.error('Error loading Compliance-as-Code data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const created = await api.security.createCompliancePolicy(policyForm);
      setShowPolicyModal(false);
      setPolicyForm({ name: '', framework: 'SOC2', rego: '', severity: 'high', tags: [] });
      // Optimistically add the policy to the list
      if (created && created.id) {
        setPolicies([created, ...policies]);
      }
      // Reload data to ensure consistency
      await loadData();
      alert('Policy created successfully!');
    } catch (error: any) {
      alert(error.message || 'Failed to create policy');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Compliance-as-Code</h2>
        <p className="text-slate-600">Define compliance policies as code using Rego (Open Policy Agent).</p>
      </div>

      <div className="flex justify-end mb-4">
        <button
          onClick={() => setShowPolicyModal(true)}
          className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Policy
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-slate-400" />
        </div>
      ) : (
        <div className="space-y-4">
          {policies.map((policy) => (
            <div key={policy.id} className="border border-slate-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-medium text-slate-900">{policy.name}</p>
                  <p className="text-sm text-slate-600">{policy.framework}</p>
                </div>
                <span className={`px-2 py-1 rounded text-xs ${
                  policy.severity === 'critical' ? 'bg-red-100 text-red-800' :
                  policy.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                  policy.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {policy.severity}
                </span>
              </div>
              {policy.rego && (
                <div className="mt-2 p-2 bg-slate-50 rounded font-mono text-xs overflow-x-auto">
                  <pre>{policy.rego.substring(0, 200)}...</pre>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showPolicyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">Create Compliance Policy</h3>
            <form onSubmit={handleCreatePolicy} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Policy Name</label>
                  <input
                    type="text"
                    value={policyForm.name}
                    onChange={(e) => setPolicyForm({ ...policyForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Framework</label>
                  <select
                    value={policyForm.framework}
                    onChange={(e) => setPolicyForm({ ...policyForm, framework: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value="SOC2">SOC 2</option>
                    <option value="ISO27001">ISO 27001</option>
                    <option value="HIPAA">HIPAA</option>
                    <option value="GDPR">GDPR</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Rego Policy Code</label>
                <textarea
                  value={policyForm.rego}
                  onChange={(e) => setPolicyForm({ ...policyForm, rego: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-sm"
                  rows={15}
                  placeholder="package compliance.soc2&#10;&#10;default allow = false&#10;&#10;allow {&#10;    # Your policy logic here&#10;}"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Severity</label>
                <select
                  value={policyForm.severity}
                  onChange={(e) => setPolicyForm({ ...policyForm, severity: e.target.value as any })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                >
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowPolicyModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Policy'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SecurityFeatures;

