/**
 * Branding Settings - White-Label Configuration
 *
 * Customization for multi-tenant white-labeling:
 * - Logo upload with preview (main logo, favicon)
 * - Color picker for primary, secondary, accent colors with live preview
 * - Company name override
 * - Custom domain setup with CNAME instructions and SSL status
 * - Custom CSS textarea for overrides
 * - Email template branding preview
 * - Login page customization
 * - Footer text configuration
 * - Reset to defaults
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import DOMPurify from 'dompurify';
import { useI18n } from '../contexts/I18nContext';
import {
  ArrowLeft,
  Save,
  RefreshCw,
  Loader2,
  AlertTriangle,
  CheckCircle,
  XCircle,
  X,
  Upload,
  Image,
  Palette,
  Globe,
  Lock,
  Mail,
  Eye,
  Code,
  Type,
  RotateCcw,
  Monitor,
  Smartphone,
  Shield,
  ExternalLink,
  Copy,
  Check,
  FileText,
} from 'lucide-react';

// ── Type Definitions ────────────────────────────────────────────────────────

interface BrandingConfig {
  id: string;
  companyName: string;
  mainLogoUrl: string;
  faviconUrl: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  customDomain: string;
  cnameTarget: string;
  sslStatus: 'active' | 'pending' | 'error' | 'none';
  customCss: string;
  loginHtml: string;
  footerText: string;
  emailLogoUrl: string;
  emailPrimaryColor: string;
  updatedAt: string;
}

interface BrandingSettingsProps {
  onBack?: () => void;
}

const API_BASE = '/api/branding';

async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(endpoint, {
    headers: { 'Content-Type': 'application/json', ...options.headers as Record<string, string> },
    credentials: 'include',
    ...options,
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

const DEFAULTS: Omit<BrandingConfig, 'id' | 'updatedAt'> = {
  companyName: 'ComplyEasyAI',
  mainLogoUrl: '',
  faviconUrl: '',
  primaryColor: '#2563eb',
  secondaryColor: '#1e40af',
  accentColor: '#f59e0b',
  customDomain: '',
  cnameTarget: 'custom.complyeasy.ai',
  sslStatus: 'none',
  customCss: '',
  loginHtml: '',
  footerText: '',
  emailLogoUrl: '',
  emailPrimaryColor: '#2563eb',
};

// ── Component ───────────────────────────────────────────────────────────────

const BrandingSettings: React.FC<BrandingSettingsProps> = ({ onBack }) => {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<'general' | 'domain' | 'email' | 'login' | 'advanced'>('general');
  const [config, setConfig] = useState<BrandingConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  // serverReachable mirrors API load success — controls whether DEFAULTS fallback is used in preview
  const [serverReachable, setServerReachable] = useState<boolean>(true);

  // Form state
  const [companyName, setCompanyName] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#2563eb');
  const [secondaryColor, setSecondaryColor] = useState('#1e40af');
  const [accentColor, setAccentColor] = useState('#f59e0b');
  const [customDomain, setCustomDomain] = useState('');
  const [customCss, setCustomCss] = useState('');
  const [loginHtml, setLoginHtml] = useState('');
  const [footerText, setFooterText] = useState('');
  const [emailPrimaryColor, setEmailPrimaryColor] = useState('#2563eb');

  // Logo state
  const [mainLogoPreview, setMainLogoPreview] = useState<string>('');
  const [faviconPreview, setFaviconPreview] = useState<string>('');
  const [mainLogoFile, setMainLogoFile] = useState<File | null>(null);
  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  const mainLogoRef = useRef<HTMLInputElement>(null);
  const faviconRef = useRef<HTMLInputElement>(null);

  // Preview mode
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // ── Data Loading ──────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiFetch<BrandingConfig>(`${API_BASE}/config`);
      setConfig(data);
      populateForm(data);
      setServerReachable(true);
    } catch {
      // Server unreachable — populate form from DEFAULTS so the preview/UI still renders
      setServerReachable(false);
      const fallback = { ...DEFAULTS, id: 'local', updatedAt: new Date().toISOString() } as BrandingConfig;
      setConfig(fallback);
      populateForm(fallback);
      setError('Failed to load branding settings — showing defaults.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const populateForm = (cfg: BrandingConfig) => {
    setCompanyName(cfg.companyName);
    setPrimaryColor(cfg.primaryColor);
    setSecondaryColor(cfg.secondaryColor);
    setAccentColor(cfg.accentColor);
    setCustomDomain(cfg.customDomain);
    setCustomCss(cfg.customCss);
    setLoginHtml(cfg.loginHtml);
    setFooterText(cfg.footerText);
    setEmailPrimaryColor(cfg.emailPrimaryColor);
    setMainLogoPreview(cfg.mainLogoUrl);
    setFaviconPreview(cfg.faviconUrl);
  };

  useEffect(() => { loadData(); }, [loadData]);

  // ── Save ──────────────────────────────────────────────────────────────

  const saveConfig = async () => {
    setIsSaving(true);
    setError(null);
    setSuccessMsg(null);
    try {
      // Upload logos first if changed
      let mainLogoUrl = config?.mainLogoUrl || '';
      let faviconUrl = config?.faviconUrl || '';

      if (mainLogoFile) {
        const formData = new FormData();
        formData.append('file', mainLogoFile);
        formData.append('type', 'main_logo');
        const uploadRes = await fetch(`${API_BASE}/upload`, {
          method: 'POST',
          credentials: 'include',
          body: formData,
        });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          mainLogoUrl = uploadData.url;
        }
      }

      if (faviconFile) {
        const formData = new FormData();
        formData.append('file', faviconFile);
        formData.append('type', 'favicon');
        const uploadRes = await fetch(`${API_BASE}/upload`, {
          method: 'POST',
          credentials: 'include',
          body: formData,
        });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          faviconUrl = uploadData.url;
        }
      }

      const payload = {
        companyName,
        mainLogoUrl,
        faviconUrl,
        primaryColor,
        secondaryColor,
        accentColor,
        customDomain,
        customCss,
        loginHtml,
        footerText,
        emailPrimaryColor,
      };

      const updated = await apiFetch<BrandingConfig>(`${API_BASE}/config`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      setConfig(updated);
      populateForm(updated);
      setMainLogoFile(null);
      setFaviconFile(null);
      setSuccessMsg('Branding settings saved successfully.');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch {
      setError('Failed to save branding settings.');
    } finally {
      setIsSaving(false);
    }
  };

  // ── Reset ─────────────────────────────────────────────────────────────

  const resetToDefaults = async () => {
    try {
      const updated = await apiFetch<BrandingConfig>(`${API_BASE}/reset`, { method: 'POST' });
      setConfig(updated);
      populateForm(updated);
      setShowResetConfirm(false);
      setSuccessMsg('Branding reset to defaults.');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch {
      setError('Failed to reset branding.');
    }
  };

  // ── Logo Handling ─────────────────────────────────────────────────────

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'main' | 'favicon') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (type === 'main') {
        setMainLogoPreview(reader.result as string);
        setMainLogoFile(file);
      } else {
        setFaviconPreview(reader.result as string);
        setFaviconFile(file);
      }
    };
    reader.readAsDataURL(file);
  };

  // ── Clipboard ─────────────────────────────────────────────────────────

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // ── Tab Config ────────────────────────────────────────────────────────

  const tabs = [
    { id: 'general' as const, label: 'General', icon: Palette },
    { id: 'domain' as const, label: 'Custom Domain', icon: Globe },
    { id: 'email' as const, label: 'Email Templates', icon: Mail },
    { id: 'login' as const, label: 'Login Page', icon: Monitor },
    { id: 'advanced' as const, label: 'Advanced', icon: Code },
  ];

  // ── Render ────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-3 text-gray-600 dark:text-gray-400">Loading branding settings...</span>
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Branding &amp; White-Label</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Customize the look and feel of your platform</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowResetConfirm(true)}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <RotateCcw className="w-4 h-4" /> Reset to Defaults
          </button>
          <button
            onClick={saveConfig}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
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

      {/* Reset Confirmation */}
      {showResetConfirm && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            <span className="text-yellow-700 dark:text-yellow-300">Reset all branding to default values? This cannot be undone.</span>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowResetConfirm(false)} className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
              Cancel
            </button>
            <button onClick={resetToDefaults} className="px-3 py-1 text-sm bg-yellow-600 text-white rounded hover:bg-yellow-700">
              Reset
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-4 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 pb-3 px-1 border-b-2 transition-colors text-sm font-medium whitespace-nowrap ${
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

      {/* ── General Tab ──────────────────────────────────────────────── */}
      {activeTab === 'general' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Settings */}
          <div className="lg:col-span-2 space-y-6">
            {/* Company Name */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Company Name</h3>
              <input
                type="text"
                value={companyName}
                onChange={e => setCompanyName(e.target.value)}
                placeholder="Your Company Name"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Replaces &ldquo;ComplyEasyAI&rdquo; throughout the platform</p>
            </div>

            {/* Logos */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Logos</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Main Logo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Main Logo</label>
                  <div
                    onClick={() => mainLogoRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
                  >
                    {mainLogoPreview ? (
                      <img src={mainLogoPreview} alt="Main logo" className="max-h-16 mx-auto object-contain" />
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-gray-400">
                        <Image className="w-8 h-8" />
                        <span className="text-sm">Click to upload (SVG, PNG, or JPG)</span>
                      </div>
                    )}
                  </div>
                  <input ref={mainLogoRef} type="file" accept=".svg,.png,.jpg,.jpeg,.webp" onChange={e => handleLogoUpload(e, 'main')} className="hidden" />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Recommended: 200x60px, max 2MB</p>
                </div>

                {/* Favicon */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Favicon</label>
                  <div
                    onClick={() => faviconRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
                  >
                    {faviconPreview ? (
                      <img src={faviconPreview} alt="Favicon" className="w-8 h-8 mx-auto object-contain" />
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-gray-400">
                        <Image className="w-8 h-8" />
                        <span className="text-sm">Click to upload (ICO, PNG, or SVG)</span>
                      </div>
                    )}
                  </div>
                  <input ref={faviconRef} type="file" accept=".ico,.png,.svg" onChange={e => handleLogoUpload(e, 'favicon')} className="hidden" />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Recommended: 32x32px or 64x64px</p>
                </div>
              </div>
            </div>

            {/* Colors */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Brand Colors</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { label: 'Primary', value: primaryColor, setter: setPrimaryColor },
                  { label: 'Secondary', value: secondaryColor, setter: setSecondaryColor },
                  { label: 'Accent', value: accentColor, setter: setAccentColor },
                ].map(color => (
                  <div key={color.label}>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{color.label}</label>
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <input
                          type="color"
                          value={color.value}
                          onChange={e => color.setter(e.target.value)}
                          className="w-10 h-10 rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer p-0.5"
                        />
                      </div>
                      <input
                        type="text"
                        value={color.value}
                        onChange={e => color.setter(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer Text */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Footer Text</h3>
              <input
                type="text"
                value={footerText}
                onChange={e => setFooterText(e.target.value)}
                placeholder="e.g., &copy; 2026 Your Company. All rights reserved."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Live Preview */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 sticky top-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Live Preview</h3>
                <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-0.5">
                  <button
                    onClick={() => setPreviewDevice('desktop')}
                    className={`p-1.5 rounded ${previewDevice === 'desktop' ? 'bg-white dark:bg-gray-600 shadow-sm' : ''}`}
                  >
                    <Monitor className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" />
                  </button>
                  <button
                    onClick={() => setPreviewDevice('mobile')}
                    className={`p-1.5 rounded ${previewDevice === 'mobile' ? 'bg-white dark:bg-gray-600 shadow-sm' : ''}`}
                  >
                    <Smartphone className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" />
                  </button>
                </div>
              </div>

              <div className={`border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden ${previewDevice === 'mobile' ? 'max-w-[320px] mx-auto' : ''}`}>
                {/* Preview Header */}
                <div className="px-4 py-3 flex items-center gap-3" style={{ backgroundColor: primaryColor }}>
                  {mainLogoPreview ? (
                    <img src={mainLogoPreview} alt="Logo" className="h-6 object-contain brightness-0 invert" />
                  ) : (
                    <div className="flex items-center gap-2 text-white">
                      <Shield className="w-5 h-5" />
                      <span className="text-sm font-bold">{companyName || 'ComplyEasyAI'}</span>
                    </div>
                  )}
                </div>

                {/* Preview Body */}
                <div className="p-4 bg-gray-50 dark:bg-gray-900">
                  <div className="space-y-3">
                    <div className="h-3 rounded" style={{ backgroundColor: primaryColor, width: '60%', opacity: 0.3 }} />
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-4/5" />
                    <button
                      className="px-3 py-1.5 text-xs text-white rounded"
                      style={{ backgroundColor: primaryColor }}
                    >
                      Action Button
                    </button>
                    <div className="mt-4 flex gap-2">
                      <div className="flex-1 h-16 rounded" style={{ backgroundColor: secondaryColor, opacity: 0.2 }} />
                      <div className="flex-1 h-16 rounded" style={{ backgroundColor: accentColor, opacity: 0.2 }} />
                    </div>
                  </div>
                </div>

                {/* Preview Footer */}
                <div className="px-4 py-2 bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                    {footerText || `\u00a9 ${new Date().getFullYear()} ${companyName || 'ComplyEasyAI'}`}
                  </p>
                </div>
              </div>

              {/* Color Swatches */}
              <div className="flex items-center gap-2 mt-4">
                <div className="w-6 h-6 rounded-full border-2 border-white dark:border-gray-700 shadow" style={{ backgroundColor: primaryColor }} title="Primary" />
                <div className="w-6 h-6 rounded-full border-2 border-white dark:border-gray-700 shadow" style={{ backgroundColor: secondaryColor }} title="Secondary" />
                <div className="w-6 h-6 rounded-full border-2 border-white dark:border-gray-700 shadow" style={{ backgroundColor: accentColor }} title="Accent" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Custom Domain Tab ────────────────────────────────────────── */}
      {activeTab === 'domain' && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 space-y-6">
          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">Custom Domain</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Use your own domain to access the platform</p>
          </div>

          {/* Domain Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Domain</label>
            <input
              type="text"
              value={customDomain}
              onChange={e => setCustomDomain(e.target.value)}
              placeholder="compliance.yourdomain.com"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* SSL Status */}
          <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              config?.sslStatus === 'active' ? 'bg-green-100 dark:bg-green-900/30' :
              config?.sslStatus === 'pending' ? 'bg-yellow-100 dark:bg-yellow-900/30' :
              config?.sslStatus === 'error' ? 'bg-red-100 dark:bg-red-900/30' :
              'bg-gray-100 dark:bg-gray-700'
            }`}>
              <Lock className={`w-5 h-5 ${
                config?.sslStatus === 'active' ? 'text-green-600 dark:text-green-400' :
                config?.sslStatus === 'pending' ? 'text-yellow-600 dark:text-yellow-400' :
                config?.sslStatus === 'error' ? 'text-red-600 dark:text-red-400' :
                'text-gray-500'
              }`} />
            </div>
            <div>
              <span className="text-sm font-medium text-gray-900 dark:text-white">SSL Certificate</span>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {config?.sslStatus === 'active' ? 'SSL is active and valid' :
                 config?.sslStatus === 'pending' ? 'SSL certificate is being provisioned...' :
                 config?.sslStatus === 'error' ? 'SSL provisioning failed. Check your DNS settings.' :
                 'Configure a custom domain to enable SSL'}
              </p>
            </div>
            <span className={`ml-auto px-2 py-0.5 text-xs font-medium rounded-full ${
              config?.sslStatus === 'active' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
              config?.sslStatus === 'pending' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' :
              config?.sslStatus === 'error' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' :
              'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
            }`}>
              {config?.sslStatus === 'active' ? 'Active' :
               config?.sslStatus === 'pending' ? 'Pending' :
               config?.sslStatus === 'error' ? 'Error' : 'Not Configured'}
            </span>
          </div>

          {/* CNAME Instructions */}
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4" /> DNS Configuration
            </h4>
            <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
              Add the following CNAME record to your DNS settings:
            </p>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Type</span>
                  <p className="text-sm font-mono text-gray-900 dark:text-white">CNAME</p>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Host</span>
                  <p className="text-sm font-mono text-gray-900 dark:text-white">{customDomain ? customDomain.split('.')[0] : 'compliance'}</p>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Value</span>
                  <div className="flex items-center gap-1">
                    <p className="text-sm font-mono text-gray-900 dark:text-white">{config?.cnameTarget || DEFAULTS.cnameTarget}</p>
                    <button
                      onClick={() => copyToClipboard(config?.cnameTarget || DEFAULTS.cnameTarget, 'cname')}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                    >
                      {copiedField === 'cname' ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3 text-gray-400" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
              DNS changes may take up to 48 hours to propagate. SSL will be provisioned automatically.
            </p>
          </div>
        </div>
      )}

      {/* ── Email Template Tab ───────────────────────────────────────── */}
      {activeTab === 'email' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 space-y-4">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">Email Branding</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Header Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={emailPrimaryColor}
                  onChange={e => setEmailPrimaryColor(e.target.value)}
                  className="w-10 h-10 rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer p-0.5"
                />
                <input
                  type="text"
                  value={emailPrimaryColor}
                  onChange={e => setEmailPrimaryColor(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Email logo uses the main logo uploaded in the General tab. The company name is used for the email sender name.
            </p>
          </div>

          {/* Email Preview */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <Eye className="w-4 h-4" /> Email Preview
            </h3>
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden max-w-sm mx-auto">
              {/* Email Header */}
              <div className="px-6 py-4 text-center" style={{ backgroundColor: emailPrimaryColor }}>
                {mainLogoPreview ? (
                  <img src={mainLogoPreview} alt="Logo" className="h-8 mx-auto object-contain brightness-0 invert" />
                ) : (
                  <span className="text-white font-bold text-lg">{companyName || 'ComplyEasyAI'}</span>
                )}
              </div>
              {/* Email Body */}
              <div className="px-6 py-5 bg-white dark:bg-gray-900">
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                  <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded w-full" />
                  <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded w-5/6" />
                  <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded w-2/3" />
                  <div className="pt-3">
                    <div
                      className="inline-block px-4 py-2 text-white text-xs font-medium rounded"
                      style={{ backgroundColor: emailPrimaryColor }}
                    >
                      View Details
                    </div>
                  </div>
                </div>
              </div>
              {/* Email Footer */}
              <div className="px-6 py-3 bg-gray-50 dark:bg-gray-800 text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {footerText || `\u00a9 ${new Date().getFullYear()} ${companyName || 'ComplyEasyAI'}. All rights reserved.`}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Login Page Tab ───────────────────────────────────────────── */}
      {activeTab === 'login' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Login Page Content</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Custom HTML (below login form)</label>
              <textarea
                value={loginHtml}
                onChange={e => setLoginHtml(e.target.value)}
                placeholder="<div class='text-center'>&#10;  <p>Welcome to our compliance portal.</p>&#10;  <a href='/terms'>Terms of Service</a>&#10;</div>"
                rows={10}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-xs font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                HTML content displayed below the login form. Supports basic HTML tags.
              </p>
            </div>
          </div>

          {/* Login Preview */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <Eye className="w-4 h-4" /> Login Page Preview
            </h3>
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <div className="p-8 bg-gray-50 dark:bg-gray-900 flex flex-col items-center">
                {/* Logo */}
                {mainLogoPreview ? (
                  <img src={mainLogoPreview} alt="Logo" className="h-10 mb-6 object-contain" />
                ) : (
                  <div className="flex items-center gap-2 mb-6">
                    <Shield className="w-8 h-8" style={{ color: primaryColor }} />
                    <span className="text-xl font-bold text-gray-900 dark:text-white">{companyName || 'ComplyEasyAI'}</span>
                  </div>
                )}

                {/* Mock Login Form */}
                <div className="w-full max-w-xs space-y-3">
                  <div className="h-9 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg" />
                  <div className="h-9 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg" />
                  <div className="h-9 rounded-lg text-white text-sm font-medium flex items-center justify-center" style={{ backgroundColor: primaryColor }}>
                    Sign In
                  </div>
                </div>

                {/* Custom HTML Preview */}
                {loginHtml && (
                  <div className="mt-4 text-xs text-gray-600 dark:text-gray-400 text-center" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(loginHtml) }} />
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Advanced Tab ─────────────────────────────────────────────── */}
      {activeTab === 'advanced' && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Custom CSS Overrides</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Add custom CSS to further customize the platform appearance. These styles are applied globally.
          </p>
          <textarea
            value={customCss}
            onChange={e => setCustomCss(e.target.value)}
            placeholder={`/* Custom CSS overrides */\n\n.sidebar {\n  background-color: #1a1a2e;\n}\n\n.header {\n  border-bottom: 2px solid var(--brand-primary);\n}`}
            rows={16}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-xs font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
          <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-yellow-700 dark:text-yellow-300">
                Custom CSS is injected as-is and may break the layout if used incorrectly. Test thoroughly before saving. Use browser developer tools to identify correct selectors.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BrandingSettings;
