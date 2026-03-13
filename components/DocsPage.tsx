import React, { useState } from 'react';
import { useI18n } from '../contexts/I18nContext';
import {
  Shield, BookOpen, Code, Search, ChevronRight, ChevronDown,
  Zap, Lock, Globe, Server, Database, Users, Settings, FileText,
  Play, Terminal, ExternalLink, Copy, Check, ArrowRight, Star,
  GitBranch, Webhook, Key, Cloud, Cpu, BarChart, Bell, Layers,
  Brain, RefreshCw, Target, ShieldCheck, Eye, Award, Folder
} from 'lucide-react';

interface DocSection {
  id: string;
  title: string;
  icon: React.ComponentType<any>;
  items: {
    id: string;
    title: string;
    description?: string;
    badge?: string;
  }[];
}

interface QuickLink {
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  href: string;
  color: string;
}

const docSections: DocSection[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: Play,
    items: [
      { id: 'introduction', title: 'Introduction to ComplyEasyAI' },
      { id: 'quickstart', title: 'Quick Start Guide', badge: 'Popular' },
      { id: 'account-setup', title: 'Account Setup' },
      { id: 'organization-config', title: 'Organization Configuration' },
      { id: 'first-framework', title: 'Your First Framework' },
    ],
  },
  {
    id: 'core-concepts',
    title: 'Core Concepts',
    icon: BookOpen,
    items: [
      { id: 'frameworks', title: 'Compliance Frameworks' },
      { id: 'controls', title: 'Controls & Requirements' },
      { id: 'evidence', title: 'Evidence Management' },
      { id: 'risks', title: 'Risk Assessment' },
      { id: 'tasks', title: 'Task Management' },
      { id: 'audit-trail', title: 'Audit Trail' },
    ],
  },
  {
    id: 'ai-features',
    title: 'AI Features',
    icon: Brain,
    items: [
      { id: 'ai-overview', title: 'AI Capabilities Overview' },
      { id: 'policy-generator', title: 'AI Policy Generator' },
      { id: 'gap-analysis', title: 'AI Gap Analysis' },
      { id: 'contract-analyzer', title: 'Contract Analyzer' },
      { id: 'risk-predictor', title: 'Predictive Risk Modeling', badge: 'New' },
      { id: 'ai-chatbot', title: 'Compliance Chatbot' },
    ],
  },
  {
    id: 'acos',
    title: 'aCOS (Autonomous Compliance)',
    icon: Zap,
    items: [
      { id: 'acos-overview', title: 'What is aCOS?' },
      { id: 'ai-agents', title: 'AI Agents Configuration' },
      { id: 'self-healing', title: 'Self-Healing Compliance' },
      { id: 'drift-detection', title: 'Compliance Drift Detection' },
      { id: 'automation-rules', title: 'Automation Rules' },
    ],
  },
  {
    id: 'integrations',
    title: 'Integrations',
    icon: GitBranch,
    items: [
      { id: 'integrations-overview', title: 'Integrations Overview' },
      { id: 'aws', title: 'AWS Integration' },
      { id: 'azure', title: 'Azure Integration' },
      { id: 'gcp', title: 'Google Cloud Integration' },
      { id: 'github', title: 'GitHub Integration' },
      { id: 'slack', title: 'Slack Integration' },
      { id: 'jira', title: 'Jira Integration' },
      { id: 'okta', title: 'Okta / SSO' },
      { id: 'custom', title: 'Custom Integrations' },
    ],
  },
  {
    id: 'security',
    title: 'Security',
    icon: ShieldCheck,
    items: [
      { id: 'security-overview', title: 'Security Overview' },
      { id: 'zero-trust', title: 'Zero Trust Architecture' },
      { id: 'encryption', title: 'Encryption & BYOK' },
      { id: 'sso-mfa', title: 'SSO & MFA Setup' },
      { id: 'rbac', title: 'Role-Based Access Control' },
      { id: 'audit-logs', title: 'Security Audit Logs' },
    ],
  },
  {
    id: 'api',
    title: 'API Reference',
    icon: Code,
    items: [
      { id: 'api-overview', title: 'API Overview' },
      { id: 'authentication', title: 'Authentication' },
      { id: 'frameworks-api', title: 'Frameworks API' },
      { id: 'controls-api', title: 'Controls API' },
      { id: 'evidence-api', title: 'Evidence API' },
      { id: 'risks-api', title: 'Risks API' },
      { id: 'webhooks', title: 'Webhooks' },
      { id: 'rate-limits', title: 'Rate Limits' },
      { id: 'sdks', title: 'SDKs & Libraries' },
    ],
  },
  {
    id: 'compliance-guides',
    title: 'Compliance Guides',
    icon: Award,
    items: [
      { id: 'soc2-guide', title: 'SOC 2 Implementation', badge: 'Popular' },
      { id: 'iso27001-guide', title: 'ISO 27001 Guide' },
      { id: 'hipaa-guide', title: 'HIPAA Compliance' },
      { id: 'gdpr-guide', title: 'GDPR Guide' },
      { id: 'eu-ai-act-guide', title: 'EU AI Act Guide', badge: 'New' },
      { id: 'pci-dss-guide', title: 'PCI DSS Guide' },
    ],
  },
  {
    id: 'administration',
    title: 'Administration',
    icon: Settings,
    items: [
      { id: 'user-management', title: 'User Management' },
      { id: 'team-setup', title: 'Team Setup' },
      { id: 'billing', title: 'Billing & Subscriptions' },
      { id: 'notifications', title: 'Notification Settings' },
      { id: 'data-export', title: 'Data Export' },
    ],
  },
];

const quickLinks: QuickLink[] = [
  {
    title: 'Quick Start Guide',
    description: 'Get up and running in 30 minutes',
    icon: Play,
    href: '/docs/getting-started/quickstart',
    color: 'from-green-500 to-emerald-500',
  },
  {
    title: 'API Reference',
    description: 'Complete REST API documentation',
    icon: Code,
    href: '/docs/api/api-overview',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    title: 'SOC 2 Guide',
    description: 'Complete SOC 2 implementation guide',
    icon: ShieldCheck,
    href: '/docs/compliance-guides/soc2-guide',
    color: 'from-purple-500 to-pink-500',
  },
  {
    title: 'Integrations',
    description: 'Connect AWS, Azure, GitHub & more',
    icon: GitBranch,
    href: '/docs/integrations/integrations-overview',
    color: 'from-orange-500 to-amber-500',
  },
];

const codeExamples = {
  authentication: `// Authenticate with API Key
const response = await fetch('https://api.complyeasyai.com/v1/frameworks', {
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  }
});

const frameworks = await response.json();
console.log(frameworks);`,
  createFramework: `// Create a new compliance framework
const framework = await fetch('https://api.complyeasyai.com/v1/frameworks', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'SOC 2 Type II',
    type: 'soc2',
    trustServiceCategories: ['security', 'availability'],
    targetDate: '2026-06-01'
  })
});`,
  webhook: `// Configure webhook endpoint
POST /api/v1/webhooks
{
  "url": "https://your-app.com/webhook",
  "events": [
    "control.status_changed",
    "evidence.uploaded",
    "risk.created"
  ],
  "secret": "whsec_..."
}`,
};

export const DocsPage: React.FC = () => {
  const { t } = useI18n();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSection, setExpandedSection] = useState<string>('getting-started');
  const [selectedDoc, setSelectedDoc] = useState<string>('quickstart');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const filteredSections = docSections.map(section => ({
    ...section,
    items: section.items.filter(item =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter(section => section.items.length > 0 || searchQuery === '');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-900/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <a href="/" className="flex items-center space-x-2">
                <div className="bg-brand-600 p-2 rounded-xl">
                  <Shield className="text-white w-5 h-5" />
                </div>
                <span className="font-bold text-xl text-white">ComplyEasy AI</span>
              </a>
              <span className="text-slate-400 text-sm hidden sm:block">| Documentation</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder={t('common.search')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64 pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all text-sm"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 border border-slate-600 rounded px-1.5 py-0.5">
                  ⌘K
                </span>
              </div>
              <a href="/learn" className="text-slate-400 hover:text-white transition-colors text-sm">
                Learn
              </a>
              <a href="https://github.com/complyeasyai" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white transition-colors">
                <GitBranch className="w-5 h-5" />
              </a>
              <a href="/signup" className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all">
                Get Started
              </a>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-72 border-r border-slate-700 bg-slate-900/50 h-[calc(100vh-4rem)] sticky top-16 overflow-y-auto hidden lg:block">
          <nav className="p-4">
            {filteredSections.map((section) => {
              const Icon = section.icon;
              const isExpanded = expandedSection === section.id;
              
              return (
                <div key={section.id} className="mb-2">
                  <button
                    onClick={() => setExpandedSection(isExpanded ? '' : section.id)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-left hover:bg-slate-800/50 transition-all group"
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-brand-400" />
                      <span className="text-sm font-medium text-white">{section.title}</span>
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    )}
                  </button>
                  {isExpanded && (
                    <div className="ml-6 mt-1 space-y-1">
                      {section.items.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => setSelectedDoc(item.id)}
                          className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-sm transition-all ${
                            selectedDoc === item.id
                              ? 'bg-brand-600/20 text-brand-400'
                              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                          }`}
                        >
                          <span>{item.title}</span>
                          {item.badge && (
                            <span className={`text-xs px-1.5 py-0.5 rounded ${
                              item.badge === 'New' 
                                ? 'bg-green-500/10 text-green-400' 
                                : 'bg-brand-500/10 text-brand-400'
                            }`}>
                              {item.badge}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          {/* Quick Links */}
          {selectedDoc === 'quickstart' && (
            <div className="max-w-4xl mx-auto px-6 py-12">
              <div className="text-center mb-12">
                <h1 className="text-4xl font-bold text-white mb-4">ComplyEasyAI Documentation</h1>
                <p className="text-xl text-slate-400 max-w-2xl mx-auto">
                  Everything you need to build, deploy, and maintain compliance automation with ComplyEasyAI.
                </p>
              </div>

              {/* Quick Links Grid */}
              <div className="grid md:grid-cols-2 gap-4 mb-12">
                {quickLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <a
                      key={link.title}
                      href={link.href}
                      className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 hover:border-brand-500/50 transition-all group"
                    >
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${link.color} flex items-center justify-center mb-4`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-brand-400 transition-colors">
                        {link.title}
                      </h3>
                      <p className="text-slate-400 text-sm">{link.description}</p>
                    </a>
                  );
                })}
              </div>

              {/* Quick Start Content */}
              <div className="prose prose-invert max-w-none">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                  <Play className="w-6 h-6 text-green-400" />
                  Quick Start Guide
                </h2>

                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 mb-8">
                  <h3 className="text-lg font-semibold text-white mb-4">Prerequisites</h3>
                  <ul className="list-disc list-inside text-slate-400 space-y-2">
                    <li>A ComplyEasyAI account (<a href="/signup" className="text-brand-400 hover:underline">Sign up free</a>)</li>
                    <li>API key from your dashboard</li>
                    <li>Basic understanding of REST APIs</li>
                  </ul>
                </div>

                <h3 className="text-xl font-semibold text-white mt-8 mb-4">Step 1: Authentication</h3>
                <p className="text-slate-400 mb-4">
                  All API requests require authentication using an API key. Include your key in the Authorization header:
                </p>
                
                <div className="relative bg-slate-900 border border-slate-700 rounded-xl overflow-hidden mb-8">
                  <div className="flex items-center justify-between px-4 py-2 border-b border-slate-700 bg-slate-800/50">
                    <span className="text-sm text-slate-400">JavaScript</span>
                    <button
                      onClick={() => handleCopyCode(codeExamples.authentication, 'auth')}
                      className="text-slate-400 hover:text-white transition-colors"
                    >
                      {copiedCode === 'auth' ? (
                        <Check className="w-4 h-4 text-green-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <pre className="p-4 overflow-x-auto">
                    <code className="text-sm text-slate-300">{codeExamples.authentication}</code>
                  </pre>
                </div>

                <h3 className="text-xl font-semibold text-white mt-8 mb-4">Step 2: Create Your First Framework</h3>
                <p className="text-slate-400 mb-4">
                  Create a compliance framework to start tracking your compliance journey:
                </p>

                <div className="relative bg-slate-900 border border-slate-700 rounded-xl overflow-hidden mb-8">
                  <div className="flex items-center justify-between px-4 py-2 border-b border-slate-700 bg-slate-800/50">
                    <span className="text-sm text-slate-400">JavaScript</span>
                    <button
                      onClick={() => handleCopyCode(codeExamples.createFramework, 'framework')}
                      className="text-slate-400 hover:text-white transition-colors"
                    >
                      {copiedCode === 'framework' ? (
                        <Check className="w-4 h-4 text-green-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <pre className="p-4 overflow-x-auto">
                    <code className="text-sm text-slate-300">{codeExamples.createFramework}</code>
                  </pre>
                </div>

                <h3 className="text-xl font-semibold text-white mt-8 mb-4">Step 3: Configure Webhooks</h3>
                <p className="text-slate-400 mb-4">
                  Set up webhooks to receive real-time notifications about compliance events:
                </p>

                <div className="relative bg-slate-900 border border-slate-700 rounded-xl overflow-hidden mb-8">
                  <div className="flex items-center justify-between px-4 py-2 border-b border-slate-700 bg-slate-800/50">
                    <span className="text-sm text-slate-400">HTTP</span>
                    <button
                      onClick={() => handleCopyCode(codeExamples.webhook, 'webhook')}
                      className="text-slate-400 hover:text-white transition-colors"
                    >
                      {copiedCode === 'webhook' ? (
                        <Check className="w-4 h-4 text-green-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <pre className="p-4 overflow-x-auto">
                    <code className="text-sm text-slate-300">{codeExamples.webhook}</code>
                  </pre>
                </div>

                {/* Next Steps */}
                <div className="bg-gradient-to-r from-brand-600/20 to-purple-600/20 border border-brand-500/30 rounded-2xl p-6 mt-8">
                  <h3 className="text-lg font-semibold text-white mb-4">Next Steps</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {[
                      { title: 'Connect Integrations', description: 'Set up AWS, Azure, or GitHub', href: '/docs/integrations' },
                      { title: 'Configure aCOS', description: 'Enable autonomous compliance', href: '/docs/acos' },
                      { title: 'Explore AI Features', description: 'Use AI policy generator', href: '/docs/ai-features' },
                      { title: 'API Reference', description: 'Full endpoint documentation', href: '/docs/api' },
                    ].map((item) => (
                      <a
                        key={item.title}
                        href={item.href}
                        className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl hover:bg-slate-700/50 transition-all"
                      >
                        <div>
                          <div className="font-medium text-white">{item.title}</div>
                          <div className="text-sm text-slate-400">{item.description}</div>
                        </div>
                        <ArrowRight className="w-5 h-5 text-brand-400" />
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* API Reference Content */}
          {selectedDoc === 'api-overview' && (
            <div className="max-w-4xl mx-auto px-6 py-12">
              <h1 className="text-3xl font-bold text-white mb-4">API Reference</h1>
              <p className="text-slate-400 mb-8">
                The ComplyEasyAI REST API provides programmatic access to all platform features.
              </p>

              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 mb-8">
                <h3 className="text-lg font-semibold text-white mb-4">Base URL</h3>
                <code className="bg-slate-900 px-4 py-2 rounded-lg text-brand-400">
                  https://api.complyeasyai.com/v1
                </code>
              </div>

              <div className="space-y-6">
                <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-700 flex items-center gap-3">
                    <span className="bg-green-500/10 text-green-400 text-xs font-bold px-2 py-1 rounded">GET</span>
                    <code className="text-white">/frameworks</code>
                    <span className="text-slate-500 text-sm ml-auto">List all frameworks</span>
                  </div>
                  <div className="px-6 py-4 border-b border-slate-700 flex items-center gap-3">
                    <span className="bg-blue-500/10 text-blue-400 text-xs font-bold px-2 py-1 rounded">POST</span>
                    <code className="text-white">/frameworks</code>
                    <span className="text-slate-500 text-sm ml-auto">Create framework</span>
                  </div>
                  <div className="px-6 py-4 border-b border-slate-700 flex items-center gap-3">
                    <span className="bg-green-500/10 text-green-400 text-xs font-bold px-2 py-1 rounded">GET</span>
                    <code className="text-white">/frameworks/:id</code>
                    <span className="text-slate-500 text-sm ml-auto">Get framework</span>
                  </div>
                  <div className="px-6 py-4 border-b border-slate-700 flex items-center gap-3">
                    <span className="bg-yellow-500/10 text-yellow-400 text-xs font-bold px-2 py-1 rounded">PUT</span>
                    <code className="text-white">/frameworks/:id</code>
                    <span className="text-slate-500 text-sm ml-auto">Update framework</span>
                  </div>
                  <div className="px-6 py-4 flex items-center gap-3">
                    <span className="bg-red-500/10 text-red-400 text-xs font-bold px-2 py-1 rounded">DELETE</span>
                    <code className="text-white">/frameworks/:id</code>
                    <span className="text-slate-500 text-sm ml-auto">Delete framework</span>
                  </div>
                </div>

                <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-700">
                    <h4 className="font-semibold text-white">Controls API</h4>
                  </div>
                  <div className="px-6 py-4 border-b border-slate-700 flex items-center gap-3">
                    <span className="bg-green-500/10 text-green-400 text-xs font-bold px-2 py-1 rounded">GET</span>
                    <code className="text-white">/controls</code>
                    <span className="text-slate-500 text-sm ml-auto">List controls</span>
                  </div>
                  <div className="px-6 py-4 border-b border-slate-700 flex items-center gap-3">
                    <span className="bg-blue-500/10 text-blue-400 text-xs font-bold px-2 py-1 rounded">POST</span>
                    <code className="text-white">/controls/:id/evidence</code>
                    <span className="text-slate-500 text-sm ml-auto">Upload evidence</span>
                  </div>
                  <div className="px-6 py-4 flex items-center gap-3">
                    <span className="bg-yellow-500/10 text-yellow-400 text-xs font-bold px-2 py-1 rounded">PATCH</span>
                    <code className="text-white">/controls/:id/status</code>
                    <span className="text-slate-500 text-sm ml-auto">Update status</span>
                  </div>
                </div>

                <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-700">
                    <h4 className="font-semibold text-white">Risks API</h4>
                  </div>
                  <div className="px-6 py-4 border-b border-slate-700 flex items-center gap-3">
                    <span className="bg-green-500/10 text-green-400 text-xs font-bold px-2 py-1 rounded">GET</span>
                    <code className="text-white">/risks</code>
                    <span className="text-slate-500 text-sm ml-auto">List risks</span>
                  </div>
                  <div className="px-6 py-4 border-b border-slate-700 flex items-center gap-3">
                    <span className="bg-blue-500/10 text-blue-400 text-xs font-bold px-2 py-1 rounded">POST</span>
                    <code className="text-white">/risks</code>
                    <span className="text-slate-500 text-sm ml-auto">Create risk</span>
                  </div>
                  <div className="px-6 py-4 flex items-center gap-3">
                    <span className="bg-blue-500/10 text-blue-400 text-xs font-bold px-2 py-1 rounded">POST</span>
                    <code className="text-white">/risks/analyze</code>
                    <span className="text-slate-500 text-sm ml-auto">AI risk analysis</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Generic Documentation Page */}
          {selectedDoc !== 'quickstart' && selectedDoc !== 'api-overview' && (
            <div className="max-w-4xl mx-auto px-6 py-12">
              <nav className="flex items-center gap-2 text-sm text-slate-400 mb-6">
                <a href="/docs" className="hover:text-white">Docs</a>
                <ChevronRight className="w-4 h-4" />
                <span className="text-white capitalize">
                  {docSections.find(s => s.items.some(i => i.id === selectedDoc))?.title}
                </span>
                <ChevronRight className="w-4 h-4" />
                <span className="text-brand-400">
                  {docSections.flatMap(s => s.items).find(i => i.id === selectedDoc)?.title}
                </span>
              </nav>

              <h1 className="text-3xl font-bold text-white mb-6">
                {docSections.flatMap(s => s.items).find(i => i.id === selectedDoc)?.title}
              </h1>

              <div className="prose prose-invert max-w-none">
                <p className="text-slate-400 text-lg">
                  This documentation page provides detailed information about this feature.
                  For complete documentation, explore the sidebar navigation.
                </p>

                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6 mt-8">
                  <div className="flex items-start gap-3">
                    <BookOpen className="w-6 h-6 text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-white mb-2">Looking for tutorials?</h4>
                      <p className="text-slate-400 text-sm mb-4">
                        Visit our Learning Center for step-by-step tutorials, video guides, and certification courses.
                      </p>
                      <a 
                        href="/learn" 
                        className="text-brand-400 text-sm font-medium hover:text-brand-300 flex items-center gap-1"
                      >
                        Go to Learning Center
                        <ArrowRight className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mt-8">
                  <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                    <h4 className="font-semibold text-white mb-2">Related Topics</h4>
                    <ul className="space-y-2 text-slate-400 text-sm">
                      <li><a href="#" className="hover:text-brand-400">Getting Started Guide</a></li>
                      <li><a href="#" className="hover:text-brand-400">API Reference</a></li>
                      <li><a href="#" className="hover:text-brand-400">Best Practices</a></li>
                    </ul>
                  </div>
                  <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                    <h4 className="font-semibold text-white mb-2">Need Help?</h4>
                    <ul className="space-y-2 text-slate-400 text-sm">
                      <li><a href="/community" className="hover:text-brand-400">Ask the Community</a></li>
                      <li><a href="mailto:support@complyeasyai.com" className="hover:text-brand-400">Contact Support</a></li>
                      <li><a href="/status" className="hover:text-brand-400">System Status</a></li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Right Sidebar - Table of Contents */}
        <aside className="w-56 border-l border-slate-700 bg-slate-900/50 h-[calc(100vh-4rem)] sticky top-16 overflow-y-auto hidden xl:block">
          <div className="p-4">
            <h4 className="text-sm font-semibold text-white mb-4">On this page</h4>
            <nav className="space-y-2">
              {['Overview', 'Prerequisites', 'Step 1: Authentication', 'Step 2: Create Framework', 'Step 3: Webhooks', 'Next Steps'].map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase().replace(/\s+/g, '-')}`}
                  className="block text-sm text-slate-400 hover:text-white transition-colors"
                >
                  {item}
                </a>
              ))}
            </nav>

            <div className="mt-8 pt-4 border-t border-slate-700">
              <a
                href="https://github.com/complyeasyai/docs/edit/main/quickstart.md"
                className="text-sm text-slate-400 hover:text-white flex items-center gap-2"
              >
                <GitBranch className="w-4 h-4" />
                Edit this page
              </a>
            </div>
          </div>
        </aside>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-700 bg-slate-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center space-x-2">
              <div className="bg-brand-600 p-1.5 rounded-lg">
                <Shield className="text-white w-4 h-4" />
              </div>
              <span className="font-bold text-white">ComplyEasy AI</span>
              <span className="text-slate-500 text-sm">Documentation</span>
            </div>
            <div className="flex space-x-6 text-sm text-slate-400">
              <a href="/" className="hover:text-white transition-colors">Home</a>
              <a href="/learn" className="hover:text-white transition-colors">Learn</a>
              <a href="/community" className="hover:text-white transition-colors">Community</a>
              <a href="/status" className="hover:text-white transition-colors">Status</a>
            </div>
            <div className="text-sm text-slate-500">
              © 2026 ComplyEasy AI Inc.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default DocsPage;
