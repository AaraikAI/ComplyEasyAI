/**
 * SSO / SAML 2.0 Configuration Admin Page
 *
 * Enterprise Single Sign-On configuration:
 * - Provider selection (SAML, OIDC, Azure AD, Okta, Google Workspace, OneLogin, Ping Identity)
 * - Configuration form with entity ID, SSO URL, certificate upload/paste, metadata URL
 * - Attribute mapping table (IdP attributes -> user fields)
 * - Default role selection, auto-provisioning toggle, allowed email domains
 * - Test SSO connection with result display
 * - SP metadata XML display/download
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ArrowLeft,
  Save,
  RefreshCw,
  Loader2,
  AlertTriangle,
  CheckCircle,
  XCircle,
  X,
  Plus,
  Trash2,
  Copy,
  Download,
  Upload,
  Shield,
  Key,
  Globe,
  Users,
  Settings,
  FileText,
  Link,
  Check,
  Play,
  Eye,
  EyeOff,
  ChevronDown,
  Info,
  ExternalLink,
} from 'lucide-react';
import { useI18n } from '../contexts/I18nContext';

// ── Type Definitions ────────────────────────────────────────────────────────

type SSOProvider = 'saml' | 'oidc' | 'azure_ad' | 'okta' | 'google_workspace' | 'onelogin' | 'ping_identity';

interface AttributeMapping {
  id: string;
  idpAttribute: string;
  userField: string;
}

interface SSOConfig {
  id: string;
  provider: SSOProvider;
  enabled: boolean;
  entityId: string;
  ssoUrl: string;
  sloUrl: string;
  certificate: string;
  metadataUrl: string;
  attributeMappings: AttributeMapping[];
  defaultRole: string;
  autoProvision: boolean;
  allowedDomains: string[];
  jitProvisioning: boolean;
  signedRequests: boolean;
  forceAuthn: boolean;
  nameIdFormat: string;
  createdAt: string;
  updatedAt: string;
}

interface TestResult {
  success: boolean;
  message: string;
  details: string[];
  timestamp: string;
}

interface SPMetadata {
  xml: string;
  entityId: string;
  acsUrl: string;
  sloUrl: string;
}

interface SSOSettingsProps {
  onBack?: () => void;
}

const API_BASE = '/api/sso';

async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(endpoint, {
    headers: { 'Content-Type': 'application/json', ...options.headers as Record<string, string> },
    credentials: 'include',
    ...options,
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

const PROVIDER_OPTIONS: { value: SSOProvider; label: string; icon: string }[] = [
  { value: 'saml', label: 'SAML 2.0', icon: 'SAML' },
  { value: 'oidc', label: 'OpenID Connect (OIDC)', icon: 'OIDC' },
  { value: 'azure_ad', label: 'Azure Active Directory', icon: 'Azure' },
  { value: 'okta', label: 'Okta', icon: 'Okta' },
  { value: 'google_workspace', label: 'Google Workspace', icon: 'Google' },
  { value: 'onelogin', label: 'OneLogin', icon: 'OL' },
  { value: 'ping_identity', label: 'Ping Identity', icon: 'Ping' },
];

const ROLE_OPTIONS = ['admin', 'compliance_manager', 'risk_manager', 'auditor', 'viewer'];

const NAME_ID_FORMATS = [
  'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress',
  'urn:oasis:names:tc:SAML:1.1:nameid-format:unspecified',
  'urn:oasis:names:tc:SAML:2.0:nameid-format:persistent',
  'urn:oasis:names:tc:SAML:2.0:nameid-format:transient',
];

const USER_FIELDS = ['email', 'firstName', 'lastName', 'displayName', 'department', 'role', 'phone', 'title', 'employeeId'];

const DEFAULT_MAPPINGS: AttributeMapping[] = [
  { id: 'map-1', idpAttribute: 'email', userField: 'email' },
  { id: 'map-2', idpAttribute: 'givenName', userField: 'firstName' },
  { id: 'map-3', idpAttribute: 'surname', userField: 'lastName' },
];

// ── Component ───────────────────────────────────────────────────────────────

const SSOSettings: React.FC<SSOSettingsProps> = ({ onBack }) => {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<'config' | 'mapping' | 'metadata' | 'advanced'>('config');
  const [config, setConfig] = useState<SSOConfig | null>(null);
  const [spMetadata, setSpMetadata] = useState<SPMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showCert, setShowCert] = useState(false);
  const [newDomain, setNewDomain] = useState('');
  const certFileInputRef = useRef<HTMLInputElement>(null);

  // ── Form state ────────────────────────────────────────────────────────
  const [formProvider, setFormProvider] = useState<SSOProvider>('saml');
  const [formEnabled, setFormEnabled] = useState(false);
  const [formEntityId, setFormEntityId] = useState('');
  const [formSSOUrl, setFormSSOUrl] = useState('');
  const [formSLOUrl, setFormSLOUrl] = useState('');
  const [formCertificate, setFormCertificate] = useState('');
  const [formMetadataUrl, setFormMetadataUrl] = useState('');
  const [formMappings, setFormMappings] = useState<AttributeMapping[]>(DEFAULT_MAPPINGS);
  const [formDefaultRole, setFormDefaultRole] = useState('viewer');
  const [formAutoProvision, setFormAutoProvision] = useState(false);
  const [formAllowedDomains, setFormAllowedDomains] = useState<string[]>([]);
  const [formJitProvisioning, setFormJitProvisioning] = useState(false);
  const [formSignedRequests, setFormSignedRequests] = useState(true);
  const [formForceAuthn, setFormForceAuthn] = useState(false);
  const [formNameIdFormat, setFormNameIdFormat] = useState(NAME_ID_FORMATS[0]);

  // ── Data Loading ──────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [configData, metadataData] = await Promise.all([
        apiFetch<SSOConfig>(`${API_BASE}/config`),
        apiFetch<SPMetadata>(`${API_BASE}/sp-metadata`),
      ]);
      setConfig(configData);
      setSpMetadata(metadataData);
      populateForm(configData);
    } catch {
      setError('Failed to load SSO configuration.');
      setConfig(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const populateForm = (cfg: SSOConfig) => {
    setFormProvider(cfg.provider);
    setFormEnabled(cfg.enabled);
    setFormEntityId(cfg.entityId);
    setFormSSOUrl(cfg.ssoUrl);
    setFormSLOUrl(cfg.sloUrl);
    setFormCertificate(cfg.certificate);
    setFormMetadataUrl(cfg.metadataUrl);
    setFormMappings(cfg.attributeMappings.length > 0 ? cfg.attributeMappings : DEFAULT_MAPPINGS);
    setFormDefaultRole(cfg.defaultRole);
    setFormAutoProvision(cfg.autoProvision);
    setFormAllowedDomains(cfg.allowedDomains);
    setFormJitProvisioning(cfg.jitProvisioning);
    setFormSignedRequests(cfg.signedRequests);
    setFormForceAuthn(cfg.forceAuthn);
    setFormNameIdFormat(cfg.nameIdFormat || NAME_ID_FORMATS[0]);
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Save ──────────────────────────────────────────────────────────────

  const saveConfig = async () => {
    setIsSaving(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const payload = {
        provider: formProvider,
        enabled: formEnabled,
        entityId: formEntityId,
        ssoUrl: formSSOUrl,
        sloUrl: formSLOUrl,
        certificate: formCertificate,
        metadataUrl: formMetadataUrl,
        attributeMappings: formMappings,
        defaultRole: formDefaultRole,
        autoProvision: formAutoProvision,
        allowedDomains: formAllowedDomains,
        jitProvisioning: formJitProvisioning,
        signedRequests: formSignedRequests,
        forceAuthn: formForceAuthn,
        nameIdFormat: formNameIdFormat,
      };
      const updated = await apiFetch<SSOConfig>(`${API_BASE}/config`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      setConfig(updated);
      populateForm(updated);
      setSuccessMsg('SSO configuration saved successfully.');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch {
      setError('Failed to save SSO configuration.');
    } finally {
      setIsSaving(false);
    }
  };

  // ── Test Connection ───────────────────────────────────────────────────

  const testConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const result = await apiFetch<TestResult>(`${API_BASE}/test`, { method: 'POST' });
      setTestResult(result);
    } catch {
      setTestResult({
        success: false,
        message: 'Connection test failed',
        details: ['Could not reach the SSO endpoint. Please verify your configuration.'],
        timestamp: new Date().toISOString(),
      });
    } finally {
      setIsTesting(false);
    }
  };

  // ── Attribute Mappings ────────────────────────────────────────────────

  const addMapping = () => {
    setFormMappings(prev => [
      ...prev,
      { id: `map-${Date.now()}`, idpAttribute: '', userField: '' },
    ]);
  };

  const removeMapping = (id: string) => {
    setFormMappings(prev => prev.filter(m => m.id !== id));
  };

  const updateMapping = (id: string, field: 'idpAttribute' | 'userField', value: string) => {
    setFormMappings(prev => prev.map(m => (m.id === id ? { ...m, [field]: value } : m)));
  };

  // ── Domains ───────────────────────────────────────────────────────────

  const addDomain = () => {
    const d = newDomain.trim().toLowerCase();
    if (d && !formAllowedDomains.includes(d)) {
      setFormAllowedDomains(prev => [...prev, d]);
      setNewDomain('');
    }
  };

  const removeDomain = (domain: string) => {
    setFormAllowedDomains(prev => prev.filter(d => d !== domain));
  };

  // ── Certificate Upload ────────────────────────────────────────────────

  const handleCertUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setFormCertificate(reader.result as string);
    };
    reader.readAsText(file);
  };

  // ── Clipboard ─────────────────────────────────────────────────────────

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // ── Download SP Metadata ──────────────────────────────────────────────

  const downloadMetadata = () => {
    if (!spMetadata?.xml) return;
    const blob = new Blob([spMetadata.xml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sp-metadata.xml';
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Tabs ──────────────────────────────────────────────────────────────

  const tabs = [
    { id: 'config' as const, label: 'Configuration', icon: Settings },
    { id: 'mapping' as const, label: 'Attribute Mapping', icon: Link },
    { id: 'metadata' as const, label: 'SP Metadata', icon: FileText },
    { id: 'advanced' as const, label: 'Advanced', icon: Shield },
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('settings.sso')}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Configure SAML 2.0 / OIDC authentication</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={testConnection}
            disabled={isTesting}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
          >
            {isTesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            Test Connection
          </button>
          <button
            onClick={saveConfig}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {t('common.save')}
          </button>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
            <span className="text-red-700 dark:text-red-300">{error}</span>
          </div>
          <button onClick={() => setError(null)}><X className="w-4 h-4 text-red-600 dark:text-red-400" /></button>
        </div>
      )}
      {successMsg && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
          <span className="text-green-700 dark:text-green-300">{successMsg}</span>
        </div>
      )}

      {/* Test Result */}
      {testResult && (
        <div className={`border rounded-lg p-4 ${
          testResult.success
            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
            : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            {testResult.success
              ? <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              : <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            }
            <span className={`font-medium ${testResult.success ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
              {testResult.message}
            </span>
          </div>
          {testResult.details.length > 0 && (
            <ul className="ml-7 space-y-1">
              {testResult.details.map((detail, i) => (
                <li key={i} className={`text-sm ${testResult.success ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {detail}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Enable Toggle + Provider */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">SSO Status</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Enable or disable SSO for your organization</p>
          </div>
          <button
            onClick={() => setFormEnabled(!formEnabled)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              formEnabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
            }`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              formEnabled ? 'translate-x-6' : 'translate-x-1'
            }`} />
          </button>
        </div>

        {/* Provider Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Identity Provider</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {PROVIDER_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setFormProvider(opt.value)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  formProvider === opt.value
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                    : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <span className="inline-flex items-center justify-center w-7 h-7 rounded bg-gray-100 dark:bg-gray-700 text-xs font-bold text-gray-600 dark:text-gray-400">
                  {opt.icon.slice(0, 2)}
                </span>
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

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

      {/* ── Configuration Tab ────────────────────────────────────────── */}
      {activeTab === 'config' && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 space-y-5">
          {/* Entity ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Entity ID / Issuer</label>
            <input
              type="text"
              value={formEntityId}
              onChange={e => setFormEntityId(e.target.value)}
              placeholder="https://idp.example.com/saml/metadata"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* SSO URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">SSO Login URL</label>
            <input
              type="url"
              value={formSSOUrl}
              onChange={e => setFormSSOUrl(e.target.value)}
              placeholder="https://idp.example.com/saml/sso"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* SLO URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Single Logout URL (optional)</label>
            <input
              type="url"
              value={formSLOUrl}
              onChange={e => setFormSLOUrl(e.target.value)}
              placeholder="https://idp.example.com/saml/slo"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Metadata URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Metadata URL (optional)</label>
            <div className="flex gap-2">
              <input
                type="url"
                value={formMetadataUrl}
                onChange={e => setFormMetadataUrl(e.target.value)}
                placeholder="https://idp.example.com/saml/metadata.xml"
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                Fetch
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Provide a metadata URL to auto-populate Entity ID, SSO URL, and certificate
            </p>
          </div>

          {/* Certificate */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">X.509 Certificate</label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <button
                  onClick={() => certFileInputRef.current?.click()}
                  className="flex items-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <Upload className="w-4 h-4" /> Upload Certificate
                </button>
                <input ref={certFileInputRef} type="file" accept=".pem,.crt,.cer,.cert" onChange={handleCertUpload} className="hidden" />
                <button
                  onClick={() => setShowCert(!showCert)}
                  className="flex items-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  {showCert ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  {showCert ? 'Hide' : 'Paste'}
                </button>
              </div>
              {showCert && (
                <textarea
                  value={formCertificate}
                  onChange={e => setFormCertificate(e.target.value)}
                  placeholder="-----BEGIN CERTIFICATE-----&#10;MIIDpDCCA...&#10;-----END CERTIFICATE-----"
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-xs font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              )}
              {formCertificate && !showCert && (
                <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                  <CheckCircle className="w-4 h-4" />
                  Certificate loaded ({formCertificate.length} characters)
                </div>
              )}
            </div>
          </div>

          {/* Default Role */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Default Role for New Users</label>
            <select
              value={formDefaultRole}
              onChange={e => setFormDefaultRole(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {ROLE_OPTIONS.map(role => (
                <option key={role} value={role}>{role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>
              ))}
            </select>
          </div>

          {/* Auto-provisioning */}
          <div className="flex items-center justify-between py-3 border-t border-gray-200 dark:border-gray-700">
            <div>
              <span className="text-sm font-medium text-gray-900 dark:text-white">Auto-Provisioning</span>
              <p className="text-xs text-gray-500 dark:text-gray-400">Automatically create user accounts on first SSO login</p>
            </div>
            <button
              onClick={() => setFormAutoProvision(!formAutoProvision)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                formAutoProvision ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                formAutoProvision ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>

          {/* Allowed Domains */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Allowed Email Domains</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newDomain}
                onChange={e => setNewDomain(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addDomain())}
                placeholder="example.com"
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button onClick={addDomain} className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors">
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formAllowedDomains.map(domain => (
                <span key={domain} className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-sm">
                  @{domain}
                  <button onClick={() => removeDomain(domain)} className="hover:text-red-500 transition-colors">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              {formAllowedDomains.length === 0 && (
                <span className="text-xs text-gray-500 dark:text-gray-400">All domains allowed</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Attribute Mapping Tab ────────────────────────────────────── */}
      {activeTab === 'mapping' && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">Attribute Mappings</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Map IdP attributes to user profile fields</p>
            </div>
            <button onClick={addMapping} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 border border-blue-300 dark:border-blue-600 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
              <Plus className="w-4 h-4" /> Add Mapping
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">IdP Attribute</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-600 dark:text-gray-300"></th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">User Field</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-gray-300">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {formMappings.map(mapping => (
                  <tr key={mapping.id}>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={mapping.idpAttribute}
                        onChange={e => updateMapping(mapping.id, 'idpAttribute', e.target.value)}
                        placeholder="e.g., http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"
                        className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </td>
                    <td className="px-2 py-3 text-center text-gray-400">
                      <ChevronDown className="w-4 h-4 rotate-[-90deg] inline-block" />
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={mapping.userField}
                        onChange={e => updateMapping(mapping.id, 'userField', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select field...</option>
                        {USER_FIELDS.map(f => (
                          <option key={f} value={f}>{f}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => removeMapping(mapping.id)} className="p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors">
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {formMappings.length === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Link className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No attribute mappings configured. Add a mapping to get started.</p>
            </div>
          )}
        </div>
      )}

      {/* ── SP Metadata Tab ──────────────────────────────────────────── */}
      {activeTab === 'metadata' && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">Service Provider Metadata</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Share this metadata with your Identity Provider</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => copyToClipboard(spMetadata?.xml || '', 'metadata')}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
              >
                {copiedField === 'metadata' ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                Copy XML
              </button>
              <button
                onClick={downloadMetadata}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Download className="w-4 h-4" /> {t('common.download')}
              </button>
            </div>
          </div>

          {/* Quick Reference */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Entity ID</span>
              <p className="text-sm text-gray-900 dark:text-white font-mono mt-1 truncate">{spMetadata?.entityId || 'N/A'}</p>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">ACS URL</span>
              <p className="text-sm text-gray-900 dark:text-white font-mono mt-1 truncate">{spMetadata?.acsUrl || 'N/A'}</p>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">SLO URL</span>
              <p className="text-sm text-gray-900 dark:text-white font-mono mt-1 truncate">{spMetadata?.sloUrl || 'N/A'}</p>
            </div>
          </div>

          {/* XML Display */}
          <div className="relative">
            <pre className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg overflow-x-auto text-xs font-mono text-gray-700 dark:text-gray-300 max-h-96">
              {spMetadata?.xml || '<!-- SP Metadata will appear here once SSO is configured -->'}
            </pre>
          </div>
        </div>
      )}

      {/* ── Advanced Tab ─────────────────────────────────────────────── */}
      {activeTab === 'advanced' && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 space-y-5">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Advanced Settings</h3>

          {/* NameID Format */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">NameID Format</label>
            <select
              value={formNameIdFormat}
              onChange={e => setFormNameIdFormat(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {NAME_ID_FORMATS.map(fmt => (
                <option key={fmt} value={fmt}>{fmt.split(':').pop()}</option>
              ))}
            </select>
          </div>

          {/* Toggles */}
          {[
            { label: 'Just-in-Time Provisioning', desc: 'Create users on first login even without pre-provisioning', value: formJitProvisioning, setter: setFormJitProvisioning },
            { label: 'Sign Authentication Requests', desc: 'Digitally sign SAML requests sent to the IdP', value: formSignedRequests, setter: setFormSignedRequests },
            { label: 'Force Re-Authentication', desc: 'Require users to re-authenticate at the IdP every time', value: formForceAuthn, setter: setFormForceAuthn },
          ].map(toggle => (
            <div key={toggle.label} className="flex items-center justify-between py-3 border-t border-gray-200 dark:border-gray-700">
              <div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{toggle.label}</span>
                <p className="text-xs text-gray-500 dark:text-gray-400">{toggle.desc}</p>
              </div>
              <button
                onClick={() => toggle.setter(!toggle.value)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  toggle.value ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  toggle.value ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SSOSettings;
