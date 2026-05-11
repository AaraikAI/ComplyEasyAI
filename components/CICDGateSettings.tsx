/**
 * CI/CD Compliance Gate Settings
 *
 * Manages compliance gate policies for CI/CD pipelines:
 * - Gate policy CRUD (name, description, required checks)
 * - Policy assignment to repositories/pipelines
 * - Gate result history with pass/fail tracking
 * - GitHub integration setup with webhook URL and token management
 * - Policy template library for quick setup
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft,
  Plus,
  X,
  Search,
  RefreshCw,
  CheckCircle,
  XCircle,
  Shield,
  GitBranch,
  Copy,
  Eye,
  EyeOff,
  Edit,
  Trash2,
  Loader2,
  Clock,
  AlertTriangle,
  Settings,
  BookOpen,
  Link,
  Key,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Check,
  LayoutTemplate,
  Webhook,
} from 'lucide-react';
import { useI18n } from '../contexts/I18nContext';
import { api } from '../services/api';

// ── Type Definitions ────────────────────────────────────────────────────────

interface RequiredCheck {
  id: string;
  type: 'security_scan' | 'approved_dependencies' | 'code_review' | 'test_coverage' | 'license_check' | 'secret_detection' | 'sast' | 'dast';
  label: string;
  enabled: boolean;
  threshold?: number;
  config?: Record<string, string>;
}

interface GatePolicy {
  id: string;
  name: string;
  description: string;
  requiredChecks: RequiredCheck[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  assignedRepos: string[];
  assignedPipelines: string[];
}

interface GateResult {
  id: string;
  policyId: string;
  policyName: string;
  repository: string;
  pipeline: string;
  branch: string;
  commitSha: string;
  passed: boolean;
  checkResults: { check: string; passed: boolean; details: string }[];
  triggeredAt: string;
  duration: number;
}

interface PolicyTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  requiredChecks: RequiredCheck[];
}

interface GitHubIntegration {
  connected: boolean;
  webhookUrl: string;
  token: string;
  tokenLastRotated: string;
  repositories: string[];
}

interface CICDGateSettingsProps {
  onBack?: () => void;
}

// Normalise a server policy shape into the local GatePolicy used by the UI.
// Accepts either: (a) rules-nested form { rules: { requiredChecks, assignedRepos, ... }, isActive, ... }
// or (b) flat form { requiredChecks, assignedRepos, ..., isActive, ... }. The
// flat form is what older test fixtures and some legacy responses use.
function normaliseServerPolicy(p: any): GatePolicy {
  const rules = (p && typeof p.rules === 'object' && p.rules !== null) ? p.rules : {};
  const pickArray = (key: string) =>
    Array.isArray(rules[key]) ? rules[key]
      : Array.isArray(p?.[key]) ? p[key]
      : [];
  return {
    id: p.id,
    name: p.name || '',
    description: p.description || '',
    requiredChecks: pickArray('requiredChecks'),
    isActive: !!p.isActive,
    createdAt: p.createdAt || '',
    updatedAt: p.updatedAt || '',
    assignedRepos: pickArray('assignedRepos'),
    assignedPipelines: pickArray('assignedPipelines'),
  };
}

// Normalise a server gate result into the local GateResult shape used by the UI.
function normaliseServerResult(r: any): GateResult {
  const details = (r && typeof r.details === 'object' && r.details !== null) ? r.details : {};
  const checks = (details.checks && typeof details.checks === 'object') ? details.checks : {};
  const checkResults = Object.keys(checks).map(k => ({
    check: k,
    passed: !!checks[k],
    details: '',
  }));
  return {
    id: r.id,
    policyId: r.policyId || '',
    policyName: r.policy?.name || '',
    repository: r.repository || '',
    pipeline: details.pipeline || '',
    branch: r.branch || '',
    commitSha: r.commitHash || '',
    passed: r.status === 'PASSED',
    checkResults,
    triggeredAt: r.triggeredAt || '',
    duration: typeof details.duration === 'number' ? details.duration : 0,
  };
}

const DEFAULT_CHECKS: RequiredCheck[] = [
  { id: 'security_scan', type: 'security_scan', label: 'Security Vulnerability Scan', enabled: false },
  { id: 'approved_dependencies', type: 'approved_dependencies', label: 'Approved Dependencies Only', enabled: false },
  { id: 'code_review', type: 'code_review', label: 'Code Review Approval', enabled: false },
  { id: 'test_coverage', type: 'test_coverage', label: 'Test Coverage Threshold', enabled: false, threshold: 80 },
  { id: 'license_check', type: 'license_check', label: 'License Compliance Check', enabled: false },
  { id: 'secret_detection', type: 'secret_detection', label: 'Secret Detection Scan', enabled: false },
  { id: 'sast', type: 'sast', label: 'Static Application Security Testing', enabled: false },
  { id: 'dast', type: 'dast', label: 'Dynamic Application Security Testing', enabled: false },
];

const TEMPLATES: PolicyTemplate[] = [
  {
    id: 'tpl-soc2',
    name: 'SOC 2 Pipeline Gate',
    description: 'Enforces SOC 2 security controls for CI/CD pipelines',
    category: 'Compliance',
    requiredChecks: DEFAULT_CHECKS.map(c => ({
      ...c,
      enabled: ['security_scan', 'code_review', 'secret_detection'].includes(c.id),
    })),
  },
  {
    id: 'tpl-hipaa',
    name: 'HIPAA Security Gate',
    description: 'Healthcare data protection compliance checks',
    category: 'Compliance',
    requiredChecks: DEFAULT_CHECKS.map(c => ({
      ...c,
      enabled: ['security_scan', 'approved_dependencies', 'secret_detection', 'sast'].includes(c.id),
    })),
  },
  {
    id: 'tpl-quality',
    name: 'Quality Assurance Gate',
    description: 'Code quality and test coverage enforcement',
    category: 'Quality',
    requiredChecks: DEFAULT_CHECKS.map(c => ({
      ...c,
      enabled: ['code_review', 'test_coverage'].includes(c.id),
      threshold: c.id === 'test_coverage' ? 90 : c.threshold,
    })),
  },
  {
    id: 'tpl-devsecops',
    name: 'DevSecOps Full Gate',
    description: 'Comprehensive security and quality checks for production pipelines',
    category: 'Security',
    requiredChecks: DEFAULT_CHECKS.map(c => ({ ...c, enabled: true, threshold: c.id === 'test_coverage' ? 85 : c.threshold })),
  },
];

// ── Component ───────────────────────────────────────────────────────────────

const CICDGateSettings: React.FC<CICDGateSettingsProps> = ({ onBack }) => {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<'policies' | 'history' | 'integration' | 'templates'>('policies');
  const [policies, setPolicies] = useState<GatePolicy[]>([]);
  const [results, setResults] = useState<GateResult[]>([]);
  const [integration, setIntegration] = useState<GitHubIntegration | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal state
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<GatePolicy | null>(null);
  const [policyForm, setPolicyForm] = useState({
    name: '',
    description: '',
    requiredChecks: DEFAULT_CHECKS.map(c => ({ ...c })),
    assignedRepos: '' as string,
    assignedPipelines: '' as string,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showTokenValue, setShowTokenValue] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // ── Data Loading ──────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [policiesRes, resultsRes] = await Promise.allSettled([
        api.cicdGates.listPolicies(),
        api.cicdGates.listResults(),
      ]);

      if (policiesRes.status === 'fulfilled' && policiesRes.value) {
        const list = Array.isArray(policiesRes.value)
          ? policiesRes.value
          : Array.isArray(policiesRes.value.policies) ? policiesRes.value.policies : [];
        setPolicies(list.map(normaliseServerPolicy));
      } else {
        setPolicies([]);
      }

      if (resultsRes.status === 'fulfilled' && resultsRes.value) {
        const list = Array.isArray(resultsRes.value)
          ? resultsRes.value
          : Array.isArray(resultsRes.value.results) ? resultsRes.value.results : [];
        setResults(list.map(normaliseServerResult));
      } else {
        setResults([]);
      }

      // Integration metadata is local; the server exposes a generic webhook-receiver path.
      setIntegration({
        connected: false,
        webhookUrl: `${typeof window !== 'undefined' ? window.location.origin : ''}/api/cicd-gates/check`,
        token: '',
        tokenLastRotated: '',
        repositories: [],
      });

      if (policiesRes.status === 'rejected' && resultsRes.status === 'rejected') {
        setError('Failed to load CI/CD gate settings. Please try again.');
      }
    } catch (err) {
      setError('Failed to load CI/CD gate settings. Please try again.');
      setPolicies([]);
      setResults([]);
      setIntegration(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Policy CRUD ───────────────────────────────────────────────────────

  const openCreatePolicy = () => {
    setEditingPolicy(null);
    setPolicyForm({
      name: '',
      description: '',
      requiredChecks: DEFAULT_CHECKS.map(c => ({ ...c })),
      assignedRepos: '',
      assignedPipelines: '',
    });
    setShowPolicyModal(true);
  };

  const openEditPolicy = (policy: GatePolicy) => {
    setEditingPolicy(policy);
    setPolicyForm({
      name: policy.name,
      description: policy.description,
      requiredChecks: policy.requiredChecks.map(c => ({ ...c })),
      assignedRepos: policy.assignedRepos.join(', '),
      assignedPipelines: policy.assignedPipelines.join(', '),
    });
    setShowPolicyModal(true);
  };

  const applyTemplate = (template: PolicyTemplate) => {
    setPolicyForm({
      name: template.name,
      description: template.description,
      requiredChecks: template.requiredChecks.map(c => ({ ...c })),
      assignedRepos: '',
      assignedPipelines: '',
    });
    setShowPolicyModal(true);
    setActiveTab('policies');
  };

  const toggleCheck = (checkId: string) => {
    setPolicyForm(prev => ({
      ...prev,
      requiredChecks: prev.requiredChecks.map(c =>
        c.id === checkId ? { ...c, enabled: !c.enabled } : c
      ),
    }));
  };

  const updateCheckThreshold = (checkId: string, threshold: number) => {
    setPolicyForm(prev => ({
      ...prev,
      requiredChecks: prev.requiredChecks.map(c =>
        c.id === checkId ? { ...c, threshold } : c
      ),
    }));
  };

  const savePolicy = async () => {
    if (!policyForm.name.trim()) return;
    setIsSaving(true);
    try {
      const enabledChecks = policyForm.requiredChecks.filter(c => c.enabled);
      const assignedRepos = policyForm.assignedRepos.split(',').map(s => s.trim()).filter(Boolean);
      const assignedPipelines = policyForm.assignedPipelines.split(',').map(s => s.trim()).filter(Boolean);

      // The server stores a flexible `rules` JSON; assigned repos / checks live there.
      const payload = {
        name: policyForm.name,
        description: policyForm.description,
        rules: {
          requiredChecks: enabledChecks,
          assignedRepos,
          assignedPipelines,
        },
        isActive: true,
      };

      if (editingPolicy) {
        const updated: any = await api.cicdGates.updatePolicy(editingPolicy.id, payload);
        const normalised = normaliseServerPolicy(updated);
        setPolicies(prev => prev.map(p => (p.id === editingPolicy.id ? normalised : p)));
      } else {
        const created: any = await api.cicdGates.createPolicy(payload);
        const normalised = normaliseServerPolicy(created);
        setPolicies(prev => [...prev, normalised]);
      }
      setShowPolicyModal(false);
    } catch {
      setError('Failed to save policy.');
    } finally {
      setIsSaving(false);
    }
  };

  const deletePolicy = async (id: string) => {
    const previous = policies;
    // Optimistic removal
    setPolicies(prev => prev.filter(p => p.id !== id));
    setShowDeleteConfirm(null);
    try {
      await api.cicdGates.deletePolicy(id);
    } catch {
      setPolicies(previous);
      setError('Failed to delete policy. Change reverted.');
    }
  };

  const togglePolicyActive = async (policy: GatePolicy) => {
    const previous = policies;
    // Optimistic toggle
    setPolicies(prev => prev.map(p => (p.id === policy.id ? { ...p, isActive: !p.isActive } : p)));
    try {
      const updated: any = await api.cicdGates.updatePolicy(policy.id, { isActive: !policy.isActive });
      const normalised = normaliseServerPolicy(updated);
      setPolicies(prev => prev.map(p => (p.id === policy.id ? normalised : p)));
    } catch {
      setPolicies(previous);
      setError('Failed to toggle policy. Change reverted.');
    }
  };

  // ── Integration ───────────────────────────────────────────────────────
  // The server does not currently expose a token-rotation endpoint for CI/CD gate integrations;
  // a new token is generated locally so the operator can copy it into their pipeline secret store.
  const rotateToken = async () => {
    try {
      const newToken = (typeof crypto !== 'undefined' && crypto.randomUUID)
        ? crypto.randomUUID().replace(/-/g, '')
        : Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
      setIntegration(prev => prev
        ? { ...prev, token: newToken, tokenLastRotated: new Date().toISOString() }
        : prev);
      setShowTokenValue(true);
    } catch {
      setError('Failed to rotate token.');
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // ── Filtering ─────────────────────────────────────────────────────────

  const filteredPolicies = policies.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredResults = results.filter(r =>
    r.policyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.repository.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.pipeline.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ── Tab Config ────────────────────────────────────────────────────────

  const tabs = [
    { id: 'policies' as const, label: 'Gate Policies', icon: Shield },
    { id: 'history' as const, label: 'Result History', icon: Clock },
    { id: 'integration' as const, label: 'GitHub Integration', icon: GitBranch },
    { id: 'templates' as const, label: 'Template Library', icon: LayoutTemplate },
  ];

  // ── Render ────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-3 text-gray-600 dark:text-gray-400">{t('common.loading')}...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {onBack && (
            <button onClick={onBack} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">CI/CD Compliance Gates</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Configure compliance checks for your pipelines</p>
          </div>
        </div>
        <button onClick={loadData} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors" title="Refresh">
          <RefreshCw className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
            <span className="text-red-700 dark:text-red-300">{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-red-600 dark:text-red-400 hover:text-red-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-4">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 pb-3 px-1 border-b-2 transition-colors text-sm font-medium ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Search Bar */}
      {(activeTab === 'policies' || activeTab === 'history') && (
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={activeTab === 'policies' ? 'Search policies...' : 'Search results...'}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          {activeTab === 'policies' && (
            <button onClick={openCreatePolicy} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
              <Plus className="w-4 h-4" />
              New Policy
            </button>
          )}
        </div>
      )}

      {/* ── Policies Tab ──────────────────────────────────────────────── */}
      {activeTab === 'policies' && (
        <div className="space-y-4">
          {filteredPolicies.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No gate policies</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Create a compliance gate policy to get started</p>
              <button onClick={openCreatePolicy} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
                Create Policy
              </button>
            </div>
          ) : (
            filteredPolicies.map(policy => (
              <div key={policy.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{policy.name}</h3>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                        policy.isActive
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                      }`}>
                        {policy.isActive ? t('common.active') : t('common.inactive')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{policy.description}</p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {policy.requiredChecks.map(check => (
                        <span key={check.id} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded text-xs font-medium">
                          <CheckCircle className="w-3 h-3" />
                          {check.label}
                          {check.threshold !== undefined && ` (${check.threshold}%)`}
                        </span>
                      ))}
                    </div>
                    {(policy.assignedRepos.length > 0 || policy.assignedPipelines.length > 0) && (
                      <div className="flex gap-4 mt-3 text-xs text-gray-500 dark:text-gray-400">
                        {policy.assignedRepos.length > 0 && (
                          <span className="flex items-center gap-1">
                            <GitBranch className="w-3 h-3" />
                            {policy.assignedRepos.length} repos
                          </span>
                        )}
                        {policy.assignedPipelines.length > 0 && (
                          <span className="flex items-center gap-1">
                            <Link className="w-3 h-3" />
                            {policy.assignedPipelines.length} pipelines
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button onClick={() => togglePolicyActive(policy)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors" title={policy.isActive ? 'Deactivate' : 'Activate'}>
                      {policy.isActive ? <CheckCircle className="w-4 h-4 text-green-600" /> : <XCircle className="w-4 h-4 text-gray-400" />}
                    </button>
                    <button onClick={() => openEditPolicy(policy)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors" title="Edit">
                      <Edit className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    </button>
                    <button onClick={() => setShowDeleteConfirm(policy.id)} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" title="Delete">
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </div>

                {/* Delete Confirm */}
                {showDeleteConfirm === policy.id && (
                  <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center justify-between">
                    <span className="text-sm text-red-700 dark:text-red-300">Delete this policy? This cannot be undone.</span>
                    <div className="flex gap-2">
                      <button onClick={() => setShowDeleteConfirm(null)} className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                        {t('common.cancel')}
                      </button>
                      <button onClick={() => deletePolicy(policy.id)} className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700">
                        {t('common.delete')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* ── Result History Tab ────────────────────────────────────────── */}
      {activeTab === 'history' && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          {filteredResults.length === 0 ? (
            <div className="text-center py-16">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No gate results yet</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Results will appear here once your pipelines trigger compliance gates</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">{t('common.status')}</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Policy</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Repository</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Pipeline</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Branch</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Commit</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Checks</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Duration</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Triggered</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredResults.map(result => (
                    <tr key={result.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                      <td className="px-4 py-3">
                        {result.passed ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-medium">
                            <CheckCircle className="w-3 h-3" /> Pass
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full text-xs font-medium">
                            <XCircle className="w-3 h-3" /> Fail
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-900 dark:text-white font-medium">{result.policyName}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{result.repository}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{result.pipeline}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 text-gray-600 dark:text-gray-400">
                          <GitBranch className="w-3 h-3" /> {result.branch}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <code className="text-xs bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-gray-700 dark:text-gray-300">
                          {result.commitSha.slice(0, 7)}
                        </code>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <span className="text-green-600 dark:text-green-400 text-xs font-medium">
                            {result.checkResults.filter(c => c.passed).length}
                          </span>
                          <span className="text-gray-400">/</span>
                          <span className="text-gray-600 dark:text-gray-400 text-xs">
                            {result.checkResults.length}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-xs">{result.duration}s</td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">
                        {new Date(result.triggeredAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Integration Tab ──────────────────────────────────────────── */}
      {activeTab === 'integration' && (
        <div className="space-y-6">
          {/* Connection Status */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  integration?.connected ? 'bg-green-100 dark:bg-green-900/30' : 'bg-gray-100 dark:bg-gray-700'
                }`}>
                  <GitBranch className={`w-5 h-5 ${integration?.connected ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}`} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">GitHub Integration</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {integration?.connected ? 'Connected and receiving webhook events' : 'Not connected'}
                  </p>
                </div>
              </div>
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                integration?.connected
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
              }`}>
                {integration?.connected ? 'Connected' : 'Disconnected'}
              </span>
            </div>

            {/* Webhook URL */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Webhook URL</label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 flex items-center bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2">
                    <Webhook className="w-4 h-4 text-gray-400 mr-2" />
                    <code className="text-sm text-gray-700 dark:text-gray-300 font-mono truncate">
                      {integration?.webhookUrl || 'https://api.complyeasy.ai/api/cicd-gates/webhook'}
                    </code>
                  </div>
                  <button
                    onClick={() => copyToClipboard(integration?.webhookUrl || '', 'webhook')}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    title="Copy"
                  >
                    {copiedField === 'webhook' ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-gray-500" />}
                  </button>
                </div>
              </div>

              {/* Token */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Authentication Token</label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 flex items-center bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2">
                    <Key className="w-4 h-4 text-gray-400 mr-2" />
                    <code className="text-sm text-gray-700 dark:text-gray-300 font-mono truncate">
                      {showTokenValue ? (integration?.token || 'cgw_xxxxxxxxxxxxx') : '••••••••••••••••••••'}
                    </code>
                  </div>
                  <button
                    onClick={() => setShowTokenValue(!showTokenValue)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    title={showTokenValue ? 'Hide' : 'Show'}
                  >
                    {showTokenValue ? <EyeOff className="w-4 h-4 text-gray-500" /> : <Eye className="w-4 h-4 text-gray-500" />}
                  </button>
                  <button
                    onClick={() => copyToClipboard(integration?.token || '', 'token')}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    title="Copy"
                  >
                    {copiedField === 'token' ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-gray-500" />}
                  </button>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Last rotated: {integration?.tokenLastRotated ? new Date(integration.tokenLastRotated).toLocaleDateString() : 'Never'}
                  </span>
                  <button onClick={rotateToken} className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium">
                    Rotate Token
                  </button>
                </div>
              </div>

              {/* Connected Repos */}
              {integration?.repositories && integration.repositories.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Connected Repositories</label>
                  <div className="flex flex-wrap gap-2">
                    {integration.repositories.map(repo => (
                      <span key={repo} className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs font-mono">
                        <GitBranch className="w-3 h-3" /> {repo}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Setup Instructions */}
              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-2">
                  <BookOpen className="w-4 h-4" /> Setup Instructions
                </h4>
                <ol className="text-sm text-blue-700 dark:text-blue-300 space-y-2 list-decimal list-inside">
                  <li>Go to your GitHub repository Settings &gt; Webhooks</li>
                  <li>Click &ldquo;Add webhook&rdquo; and paste the Webhook URL above</li>
                  <li>Set Content type to <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">application/json</code></li>
                  <li>Add the Authentication Token as a secret</li>
                  <li>Select events: Push, Pull Request, Check Suite</li>
                  <li>Save and verify the webhook delivers a ping event</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Templates Tab ────────────────────────────────────────────── */}
      {activeTab === 'templates' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {TEMPLATES.map(template => (
            <div key={template.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5 hover:border-blue-300 dark:hover:border-blue-600 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <span className="inline-block px-2 py-0.5 text-xs font-medium rounded bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 mb-2">
                    {template.category}
                  </span>
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white">{template.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{template.description}</p>
                </div>
                <LayoutTemplate className="w-5 h-5 text-gray-400 flex-shrink-0" />
              </div>
              <div className="flex flex-wrap gap-1 mb-4">
                {template.requiredChecks.filter(c => c.enabled).map(check => (
                  <span key={check.id} className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">
                    {check.label}
                  </span>
                ))}
              </div>
              <button
                onClick={() => applyTemplate(template)}
                className="w-full py-2 text-sm font-medium text-blue-600 dark:text-blue-400 border border-blue-300 dark:border-blue-600 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
              >
                Use Template
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── Policy Modal ─────────────────────────────────────────────── */}
      {showPolicyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingPolicy ? 'Edit Gate Policy' : 'Create Gate Policy'}
              </h2>
              <button onClick={() => setShowPolicyModal(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Policy Name *</label>
                <input
                  type="text"
                  value={policyForm.name}
                  onChange={e => setPolicyForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Production Deployment Gate"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('common.description')}</label>
                <textarea
                  value={policyForm.description}
                  onChange={e => setPolicyForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe the purpose of this compliance gate..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>

              {/* Required Checks */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Required Checks</label>
                <div className="space-y-2">
                  {policyForm.requiredChecks.map(check => (
                    <div
                      key={check.id}
                      className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                        check.enabled
                          ? 'border-blue-300 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                      }`}
                    >
                      <label className="flex items-center gap-3 cursor-pointer flex-1">
                        <input
                          type="checkbox"
                          checked={check.enabled}
                          onChange={() => toggleCheck(check.id)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className={`text-sm font-medium ${check.enabled ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                          {check.label}
                        </span>
                      </label>
                      {check.threshold !== undefined && check.enabled && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500 dark:text-gray-400">Min:</span>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={check.threshold}
                            onChange={e => updateCheckThreshold(check.id, parseInt(e.target.value) || 0)}
                            className="w-16 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                          <span className="text-xs text-gray-500">%</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Repository Assignment */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Assigned Repositories</label>
                <input
                  type="text"
                  value={policyForm.assignedRepos}
                  onChange={e => setPolicyForm(prev => ({ ...prev, assignedRepos: e.target.value }))}
                  placeholder="owner/repo1, owner/repo2 (comma separated)"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Pipeline Assignment */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Assigned Pipelines</label>
                <input
                  type="text"
                  value={policyForm.assignedPipelines}
                  onChange={e => setPolicyForm(prev => ({ ...prev, assignedPipelines: e.target.value }))}
                  placeholder="pipeline-name-1, pipeline-name-2 (comma separated)"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
              <button onClick={() => setShowPolicyModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                {t('common.cancel')}
              </button>
              <button
                onClick={savePolicy}
                disabled={!policyForm.name.trim() || isSaving}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                {editingPolicy ? 'Update Policy' : 'Create Policy'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CICDGateSettings;
