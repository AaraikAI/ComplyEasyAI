
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, CheckCircle, Lock, Shield, Zap, Globe, X, Mail, Loader2, BarChart, Users, Server,
  ShieldCheck, EyeOff, Key, GitMerge, BrainCircuit, Timer, Target, RefreshCw, TrendingUp,
  FileCheck, Network, Cpu, Layers, Sparkles, ClipboardCheck, Database, ScrollText, Plug
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import PricingSection from './PricingSection';
import DemoBookingForm from './DemoBookingForm';
import { TierName } from '../types';
import { ThemeToggleCompact } from './ThemeToggle';
import { toast } from 'sonner';
import { useI18n } from '../contexts/I18nContext';
import { logger } from '../utils/logger';
import Seo from './seo/Seo';
import JsonLd from './seo/JsonLd';
import {
  organizationSchema,
  softwareApplicationSchema,
  breadcrumbSchema,
  faqSchema,
} from './seo/siteSchema';

// ---------------------------------------------------------------------------
// SEO copy
// ---------------------------------------------------------------------------
const SEO_TITLE =
  'AI Compliance Automation for SOC 2, ISO 27001, GDPR & the EU AI Act | ComplyEasy AI';
const SEO_DESCRIPTION =
  'ComplyEasy AI automates evidence collection, control mapping, and audit preparation with autonomous AI agents — helping teams achieve readiness for SOC 2, ISO 27001, GDPR, HIPAA, and the EU AI Act.';
const SEO_KEYWORDS =
  'AI compliance software, compliance automation, SOC 2 automation, ISO 27001 software, GDPR compliance, EU AI Act compliance tool, NIST AI RMF software, GRC software, continuous compliance monitoring';

// ---------------------------------------------------------------------------
// Frameworks the platform helps customers ACHIEVE — each links to a pillar page
// ---------------------------------------------------------------------------
const frameworks: { name: string; path: string; blurb: string; icon: React.FC<any> }[] = [
  { name: 'SOC 2', path: '/soc2-compliance', blurb: 'Type I & Type II readiness with continuous control monitoring.', icon: Shield },
  { name: 'ISO 27001', path: '/iso-27001', blurb: 'Annex A control mapping and Statement of Applicability support.', icon: Lock },
  { name: 'GDPR', path: '/gdpr', blurb: 'RoPA, DPIAs, and data-subject request workflows.', icon: Globe },
  { name: 'EU AI Act', path: '/eu-ai-act', blurb: 'Risk classification, technical documentation, and transparency controls.', icon: BrainCircuit },
  { name: 'HIPAA', path: '/hipaa', blurb: 'Administrative, physical, and technical safeguard tracking.', icon: FileCheck },
  { name: 'NIST AI RMF', path: '/nist-ai-rmf', blurb: 'GOVERN, MAP, MEASURE, and MANAGE functions for AI systems.', icon: ClipboardCheck },
  { name: 'GRC', path: '/grc', blurb: 'Unified governance, risk, and compliance across every framework.', icon: ScrollText },
  { name: 'AI Compliance', path: '/platform/ai-compliance', blurb: 'Autonomous agents that operate compliance, not just track it.', icon: Sparkles },
];

// ---------------------------------------------------------------------------
// On-page FAQ — defensible, capability-based answers an AI engine can quote
// ---------------------------------------------------------------------------
const faqItems: { q: string; a: string }[] = [
  {
    q: 'What is AI compliance automation?',
    a: 'AI compliance automation uses autonomous software agents to continuously collect evidence, map controls to frameworks, assess risk, and prepare audit artifacts. Instead of teams gathering screenshots and spreadsheets by hand, the platform connects to your tools, monitors controls in real time, and keeps your organization audit-ready across standards like SOC 2, ISO 27001, GDPR, and the EU AI Act.',
  },
  {
    q: 'Which compliance frameworks does ComplyEasy AI support?',
    a: 'ComplyEasy AI supports security frameworks (SOC 2 Type I/II, ISO 27001, NIST CSF, CIS Controls), privacy regulations (GDPR, CCPA, HIPAA), AI governance standards (EU AI Act, NIST AI RMF, ISO 42001), and EU digital regulations (DMA, DSA). Controls that overlap between frameworks are mapped once and reused, so pursuing multiple certifications shares evidence.',
  },
  {
    q: 'How does automated evidence collection work?',
    a: 'You connect integrations such as AWS, GitHub, Okta, and Jira using read-only OAuth, API keys, or personal access tokens. AI agents then map incoming data to the relevant controls and collect evidence on a recurring schedule, maintaining a versioned audit trail for every artifact so you stay continuously audit-ready.',
  },
  {
    q: 'Can I pursue several frameworks at the same time?',
    a: 'Yes. Many frameworks share a large portion of their controls, so the platform maps shared controls automatically and reuses evidence across them. This lets a single program cover combinations such as SOC 2 with ISO 27001 and GDPR while surfacing the requirements unique to each standard.',
  },
  {
    q: 'How does ComplyEasy AI help with SOC 2?',
    a: 'The platform maps your environment to the SOC 2 Trust Services Criteria, automatically collects evidence for each control, and tracks operating effectiveness over time for Type II observation periods. Real-time dashboards highlight gaps before an audit, and evidence is organized so it can be shared directly with your auditor.',
  },
  {
    q: 'Does ComplyEasy AI support the EU AI Act?',
    a: 'Yes. The platform helps classify AI systems by risk level, generates technical documentation for high-risk systems, structures conformity-assessment and transparency workflows, and tracks human-oversight requirements — covering the obligations the EU AI Act places on providers and deployers of AI systems.',
  },
  {
    q: 'How is my data secured?',
    a: 'Customer data is encrypted at rest and in transit, access is governed by role-based access control (RBAC), and every action is captured in a full audit trail. The architecture supports bring-your-own-key (BYOK) encryption and just-in-time privileged access so you retain control over who can reach your data and when.',
  },
  {
    q: 'How long does it take to get audit-ready?',
    a: 'Framework setup is AI-assisted and typically takes well under an hour, with automated evidence collection beginning once integrations are connected. Time to a finished certification still depends on your starting maturity and the framework — for example, SOC 2 Type II requires a multi-month observation period that no tool can shorten.',
  },
  {
    q: 'How much does ComplyEasy AI cost?',
    a: 'Pricing is tier-based and starts with the Foundation tier at $8,500 per year for up to 10 users and 3 frameworks. Essentials, Growth, and Visionary tiers add more users, frameworks, and advanced AI capabilities. A free trial is available with no credit card required.',
  },
  {
    q: 'Can I bring my own encryption keys?',
    a: 'Yes. Bring-your-own-key (BYOK) encryption lets you control the keys used to protect your compliance data, and revoking a key renders the associated data unreadable. This pairs with role-based access control and just-in-time admin access to minimize standing privileges.',
  },
  {
    q: 'Does ComplyEasy AI replace my compliance team?',
    a: 'No — it augments them. The platform handles the repetitive work of evidence collection, control monitoring, and report generation so your team can focus on strategic decisions, auditor relationships, and policy design. Critical AI actions support human-in-the-loop review.',
  },
  {
    q: 'How is ComplyEasy AI different from other compliance tools?',
    a: 'Beyond evidence collection and workflow management, ComplyEasy AI runs an Autonomous Compliance Operating System (aCOS) that observes, predicts, and acts on compliance drift, agentic AI with blast-radius estimation and rollback, and a regulatory-intelligence layer that detects framework changes and updates affected controls.',
  },
];

// ---------------------------------------------------------------------------
// Feature data grouped by tab category
// ---------------------------------------------------------------------------
type FeatureTab = 'core' | 'ai' | 'security' | 'regulatory';

interface Feature {
  icon: React.FC<any>;
  title: string;
  desc: string;
}

const featuresByTab: Record<FeatureTab, { label: string; features: Feature[] }> = {
  core: {
    label: 'Core Platform',
    features: [
      { icon: Zap, title: 'AI Automation', desc: 'Intelligent agents automatically collect evidence, map controls, and flag risks around the clock.' },
      { icon: Globe, title: 'Global Frameworks', desc: 'Support for SOC 2, GDPR, HIPAA, ISO 27001, and NIST out of the box with one-click cross-mapping.' },
      { icon: BarChart, title: 'Real-time Analytics', desc: 'Live dashboards provide instant visibility into your compliance posture, gap analysis, and audit readiness.' },
      { icon: Users, title: 'Vendor Management', desc: 'Automate vendor risk assessments (VRM) and track third-party security certifications effortlessly.' },
      { icon: Server, title: '80+ Integrations', desc: 'Connect with AWS, Google Workspace, GitHub, Jira, Slack, and more to unify your evidence sources.' },
      { icon: ClipboardCheck, title: 'NIST AI RMF Framework', desc: 'Comprehensive AI risk management with GOVERN, MAP, MEASURE, and MANAGE functions.' },
    ],
  },
  ai: {
    label: 'AI & Automation',
    features: [
      { icon: Target, title: 'aCOS™', desc: 'Closed-loop control systems with Observe, Predict, Act, Verify, Learn cycles and autonomous compliance goals.' },
      { icon: RefreshCw, title: 'Agentic AI with Rollback', desc: 'Safe autonomous execution with blast-radius estimation, automatic rollback on failure, and human-in-the-loop approvals.' },
      { icon: TrendingUp, title: 'Predictive Risk Modeling', desc: 'Temporal graph networks model compliance trajectory and surface early-warning signals before issues become findings.' },
      { icon: Layers, title: 'Compliance Digital Twin', desc: 'What-if scenario modeling and policy/control failure simulations against a virtual replica of your environment.' },
      { icon: Sparkles, title: 'NeuroSymbolic AI', desc: 'Hybrid neural-symbolic reasoning for explainable AI decisions, causal reasoning, and compliance justification.' },
      { icon: Cpu, title: 'Swarm Task Allocation', desc: 'Dynamic multi-agent task distribution, capability matching, load balancing, and real-time metrics.' },
    ],
  },
  security: {
    label: 'Enterprise Security',
    features: [
      { icon: Lock, title: 'Encryption Everywhere', desc: 'Data encrypted at rest and in transit, with role-based access control and continuous monitoring built into the core.' },
      { icon: ShieldCheck, title: 'Zero-Knowledge Proofs', desc: 'Verify compliance to auditors with cryptographic proofs (zk-SNARKs) without revealing sensitive data.' },
      { icon: EyeOff, title: 'AI Air Gap & Redaction', desc: 'Automatic PII redaction sanitizes sensitive customer data before it ever reaches an AI model.' },
      { icon: Key, title: 'BYOK Encryption', desc: 'Maintain control over your data — encrypt your compliance database with your own keys.' },
      { icon: BrainCircuit, title: 'Homomorphic AI', desc: 'AI agents analyze risks on encrypted data without needing to decrypt it.' },
      { icon: Timer, title: 'JIT Admin Access', desc: 'Eliminate dormant admin accounts with temporary, time-bound privileged access that auto-expires.' },
    ],
  },
  regulatory: {
    label: 'Regulatory',
    features: [
      { icon: ShieldCheck, title: 'EU AI Act Compliance', desc: 'Risk-based classification, high-risk system management, transparency reporting, and automated controls.' },
      { icon: Globe, title: 'Digital Markets Act (DMA)', desc: 'DMA support for gatekeeper platforms — track Core Platform Services, data portability, and interoperability.' },
      { icon: Shield, title: 'Digital Services Act (DSA)', desc: 'Content-moderation tracking, illegal-content reporting, VLOP/VLOSE designation, and supporting controls.' },
      { icon: FileCheck, title: 'Evidence Truth Layer™', desc: 'Deepfake detection, cryptographic attestation, physical IoT attestation, and liveness detection.' },
      { icon: Network, title: 'Regulatory Intelligence Fabric', desc: 'Automated regulation ingestion, change detection, conflict resolution, and auto-updating controls.' },
      { icon: GitMerge, title: 'Compliance-as-Code', desc: 'Block non-compliant infrastructure changes at the Pull Request level in your CI/CD pipeline.' },
    ],
  },
};

const tabOrder: FeatureTab[] = ['core', 'ai', 'security', 'regulatory'];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const LandingPage: React.FC = () => {
  const { login, verifyMagicLink, register, loginWithMagicLink } = useAuth();
  const { t } = useI18n();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [authStep, setAuthStep] = useState<'email' | 'magic-link-sent' | 'register' | 'password-login'>('email');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [loginMethod, setLoginMethod] = useState<'magic-link' | 'password'>('magic-link');
  const [loading, setLoading] = useState(false);
  const [magicLinkEmail, setMagicLinkEmail] = useState<string | null>(null);
  const [devToken, setDevToken] = useState<string | null>(null); // For development mode simulation

  // Feature tab state
  const [activeTab, setActiveTab] = useState<FeatureTab>('core');

  // Show signup modal on initial page load (only once)
  React.useEffect(() => {
    const hasSeenSignupModal = sessionStorage.getItem('hasSeenSignupModal');
    if (!hasSeenSignupModal) {
      setShowSignupModal(true);
      sessionStorage.setItem('hasSeenSignupModal', 'true');
    }
  }, []);

  const scrollToSection = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Request magic link from backend
      // Backend auto-creates users if they don't exist, so this should always succeed for valid emails
      const response = await loginWithMagicLink(email);
      setMagicLinkEmail(email);
      // In development mode, backend returns devToken for simulation
      if (response?.devToken) {
        setDevToken(response.devToken);
      }
      setAuthStep('magic-link-sent');
    } catch (e: any) {
      logger.error('Login error:', e);
      const errorMsg = e?.message || 'Failed to send magic link';
      // Backend auto-creates users, so errors are likely network/server issues
      if (errorMsg.includes('Network') || errorMsg.includes('Failed to fetch') || errorMsg.includes('Cannot connect')) {
        toast.error('Cannot connect to server. Please check that the backend server is running and your network connection is active.');
      } else {
        // Show error but don't redirect to registration - backend handles user creation
        toast.error(`Failed to send magic link: ${errorMsg}. Please try again or contact support if the issue persists.`);
      }
      // Don't redirect to registration - stay on email step so user can retry
    }
    setLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response: any = await api.auth.register(name, email, undefined, password || undefined);

      // Store devToken if returned (development mode)
      if (response?.devToken) {
        setDevToken(response.devToken);
      }

      // Check if user already exists - backend now sends magic link automatically
      if (response?.existingUser) {
        setMagicLinkEmail(email);
        setAuthStep('magic-link-sent');
        setLoading(false);
        return;
      }

      // New user registration - backend already sent a magic link
      setMagicLinkEmail(email);
      setAuthStep('magic-link-sent');
    } catch (error: any) {
      logger.error('Registration error:', error);
      const errorMsg = error?.message || 'Unknown error';
      if (errorMsg.includes('already exists') || errorMsg.includes('409')) {
        // This shouldn't happen anymore since backend handles it, but just in case
        toast.warning('This email is already registered. A magic link has been sent to your email for login.');
        setAuthStep('email');
      } else if (errorMsg.includes('Network') || errorMsg.includes('Failed to fetch')) {
        toast.error('Cannot connect to server. Please check that the backend server is running and your network connection is active.');
      } else {
        toast.error(`Registration failed: ${errorMsg}. Please try again or contact support if the issue persists.`);
      }
    }
    setLoading(false);
  };

  // Simulate clicking the magic link (development mode only)
  const simulateMagicClick = async () => {
    setLoading(true);
    try {
      if (devToken) {
        // Use the devToken to verify and log in
        await verifyMagicLink(devToken);
        setShowAuthModal(false);
        // User is now logged in - the AuthContext will redirect to dashboard
      } else {
        // No devToken available (production mode) - inform user to check email
        toast.info('Please check your email and click the magic link to sign in. The simulation feature is only available in development mode.');
      }
    } catch (error: any) {
      logger.error('Magic link verification error:', error);
      toast.error(`Failed to verify magic link: ${error?.message || 'Unknown error'}. Please try requesting a new magic link.`);
    }
    setLoading(false);
  };

  // Resend magic link
  const resendMagicLink = async () => {
    setLoading(true);
    try {
      if (magicLinkEmail || email) {
        const response = await loginWithMagicLink(magicLinkEmail || email);
        // Update devToken if returned
        if (response?.devToken) {
          setDevToken(response.devToken);
        }
        toast.success('A new magic link has been sent to your email.');
      }
    } catch (error: any) {
      logger.error('Resend magic link error:', error);
      toast.error(`Failed to resend magic link: ${error?.message || 'Unknown error'}`);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-surface-950 font-sans text-surface-900 dark:text-surface-100 scroll-smooth transition-colors duration-300">
      {/* ============================ SEO + structured data ============================ */}
      <Seo
        title={SEO_TITLE}
        description={SEO_DESCRIPTION}
        canonicalPath="/"
        keywords={SEO_KEYWORDS}
      />
      <JsonLd data={organizationSchema()} />
      <JsonLd data={softwareApplicationSchema()} />
      <JsonLd data={faqSchema(faqItems.map((f) => ({ q: f.q, a: f.a })))} />
      <JsonLd data={breadcrumbSchema([{ name: 'Home', url: 'https://complyeasyai.com/' }])} />

      {/* ================================================================= */}
      {/* Navbar - Glass-morphism                                           */}
      {/* ================================================================= */}
      <header>
        <nav aria-label="Primary" className="fixed w-full z-50 glass dark:glass-dark border-b border-surface-200/60 dark:border-surface-700/60 transition-colors duration-300">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <div className="flex items-center space-x-2 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                <div className="bg-brand-600 p-1.5 rounded-lg shadow-lg shadow-brand-500/20">
                  <Shield className="text-white w-6 h-6" />
                </div>
                <span className="font-bold text-xl tracking-tight text-surface-900 dark:text-white">ComplyEasy AI</span>
              </div>
              <div className="hidden md:flex items-center space-x-8">
                <a href="#features" onClick={(e) => scrollToSection(e, 'features')} className="text-sm font-medium text-surface-600 dark:text-surface-300 hover:text-brand-600 dark:hover:text-brand-400 transition-colors cursor-pointer">Features</a>
                <a href="#how-it-works" onClick={(e) => scrollToSection(e, 'how-it-works')} className="text-sm font-medium text-surface-600 dark:text-surface-300 hover:text-brand-600 dark:hover:text-brand-400 transition-colors cursor-pointer">How It Works</a>
                <a href="#frameworks" onClick={(e) => scrollToSection(e, 'frameworks')} className="text-sm font-medium text-surface-600 dark:text-surface-300 hover:text-brand-600 dark:hover:text-brand-400 transition-colors cursor-pointer">Frameworks</a>
                <a href="#pricing" onClick={(e) => scrollToSection(e, 'pricing')} className="text-sm font-medium text-surface-600 dark:text-surface-300 hover:text-brand-600 dark:hover:text-brand-400 transition-colors cursor-pointer">Pricing</a>
                <a href="#faq" onClick={(e) => scrollToSection(e, 'faq')} className="text-sm font-medium text-surface-600 dark:text-surface-300 hover:text-brand-600 dark:hover:text-brand-400 transition-colors cursor-pointer">FAQ</a>
                <ThemeToggleCompact />
                <button
                  onClick={() => { setAuthStep('email'); setShowAuthModal(true); }}
                  className="bg-amber-500 text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-amber-600 transition-colors shadow-lg shadow-amber-500/20"
                >
                  {t('auth.login')}
                </button>
              </div>
            </div>
          </div>
        </nav>
      </header>

      <main>
        {/* ================================================================= */}
        {/* Hero Section - Mesh gradient background                           */}
        {/* ================================================================= */}
        <section className="relative pt-32 pb-24 lg:pt-44 lg:pb-32 overflow-hidden">
          {/* Mesh gradient background */}
          <div className="absolute inset-0 mesh-gradient opacity-50 dark:opacity-30"></div>
          <div className="absolute inset-0 dot-pattern opacity-[0.03]"></div>
          {/* Decorative blobs */}
          <div className="absolute top-20 right-10 w-[500px] h-[500px] bg-brand-400/20 rounded-full blur-[120px] animate-float"></div>
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent-400/15 rounded-full blur-[100px]"></div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-4xl mx-auto animate-fadeIn">
              {/* Badge */}
              <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800 text-brand-700 dark:text-brand-300 text-xs font-semibold uppercase tracking-wide mb-8 animate-fadeInDown">
                <Sparkles size={14} className="mr-1.5 animate-glow" /> aCOS — the Autonomous Compliance Operating System
              </div>

              {/* Headline (single H1, answer-first + keyword-anchored) */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-8 leading-[1.08] text-surface-900 dark:text-white">
                AI Compliance Automation for{' '}
                <span className="text-gradient animate-gradient">SOC 2, ISO 27001, GDPR &amp; the EU AI Act</span>
              </h1>

              {/* Sub-headline */}
              <p className="text-lg sm:text-xl lg:text-2xl text-surface-600 dark:text-surface-300 mb-12 leading-relaxed max-w-2xl mx-auto">
                ComplyEasy AI uses autonomous agents to collect evidence, map controls, and keep you audit-ready across every major framework — designed to dramatically cut audit-prep time.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14 animate-fadeInUp">
                <button
                  onClick={() => {
                    setShowSignupModal(true);
                    window.location.href = '/signup';
                  }}
                  className="w-full sm:w-auto px-8 py-4 bg-amber-500 text-white rounded-full font-semibold hover:bg-amber-600 transition-all transform hover:scale-105 shadow-xl shadow-amber-500/25 flex items-center justify-center text-lg"
                >
                  Start Free Trial <ArrowRight size={20} className="ml-2" />
                </button>
                <button
                  onClick={() => setShowDemoModal(true)}
                  className="w-full sm:w-auto px-8 py-4 bg-white/80 dark:bg-surface-800/80 backdrop-blur text-brand-700 dark:text-brand-300 rounded-full font-semibold hover:bg-white dark:hover:bg-surface-800 transition-all transform hover:scale-105 shadow-xl flex items-center justify-center border border-brand-200 dark:border-surface-700 text-lg"
                >
                  Book a Demo <ArrowRight size={20} className="ml-2" />
                </button>
              </div>

              {/* Trust signals — frameworks the platform helps you ACHIEVE */}
              <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-surface-500 dark:text-surface-400 animate-fadeInUp">
                <span className="font-medium text-surface-600 dark:text-surface-300">Helps you achieve:</span>
                <div className="flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-accent-500" />
                  <span>SOC 2 Type II</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-accent-500" />
                  <span>ISO 27001</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-accent-500" />
                  <span>GDPR</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <BrainCircuit className="w-4 h-4 text-accent-500" />
                  <span>EU AI Act</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-accent-500" />
                  <span>HIPAA</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================= */}
        {/* What is AI compliance? (definition for AI engines + capabilities)  */}
        {/* ================================================================= */}
        <section id="what-is-ai-compliance" aria-labelledby="what-is-heading" className="py-20 border-y border-surface-100 dark:border-surface-800 bg-surface-50/70 dark:bg-surface-900/60">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-brand-600 dark:text-brand-400 font-bold tracking-wide uppercase text-sm mb-3">The Basics</p>
            <h2 id="what-is-heading" className="text-2xl lg:text-4xl font-bold text-surface-900 dark:text-white mb-6">
              What is AI compliance?
            </h2>
            <p className="text-lg text-surface-700 dark:text-surface-200 leading-relaxed mb-8">
              AI compliance is the practice of using autonomous AI agents to continuously collect evidence,
              map controls to regulatory frameworks, assess risk, and prepare audit artifacts. Instead of
              gathering screenshots and spreadsheets by hand, an AI compliance platform connects to your
              tools, monitors controls in real time, and keeps an organization audit-ready across standards
              such as SOC 2, ISO 27001, GDPR, and the EU AI Act.
            </p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
              {[
                'Automated, scheduled evidence collection from your existing tools',
                'Continuous control monitoring with real-time gap analysis',
                'Cross-framework control mapping that reuses shared evidence',
                'AI risk assessment with predictive early-warning signals',
                'Audit-ready reporting and a full, versioned audit trail',
                'Regulatory-change detection that updates affected controls',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-surface-700 dark:text-surface-300">
                  <CheckCircle className="w-5 h-5 text-accent-500 flex-shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ================================================================= */}
        {/* How It Works                                                      */}
        {/* ================================================================= */}
        <section id="how-it-works" aria-labelledby="how-heading" className="py-24 bg-white dark:bg-surface-950 relative overflow-hidden transition-colors duration-300">
          <div className="absolute inset-0 noise opacity-[0.03]"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <p className="text-brand-600 dark:text-brand-400 font-bold tracking-wide uppercase text-sm mb-3">How It Works</p>
              <h2 id="how-heading" className="text-3xl lg:text-5xl font-bold text-surface-900 dark:text-white">Connect, automate, comply</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
              {/* Connecting line (desktop only) */}
              <div className="hidden md:block absolute top-16 left-[20%] right-[20%] h-0.5 bg-gradient-to-r from-brand-500 via-accent-400 to-brand-500 opacity-30"></div>

              {[
                {
                  step: '01',
                  title: 'Connect',
                  desc: 'Integrate your existing tools in minutes. ComplyEasy AI supports 80+ platforms including AWS, GitHub, Jira, Okta, and Slack with read-only access.',
                  icon: Plug,
                  color: 'brand',
                },
                {
                  step: '02',
                  title: 'Automate',
                  desc: 'Autonomous AI agents continuously collect evidence, map it to controls, and flag risks around the clock — no manual screenshots required.',
                  icon: Zap,
                  color: 'accent',
                },
                {
                  step: '03',
                  title: 'Comply',
                  desc: 'Stay audit-ready with real-time dashboards, automated reports, and an immutable audit trail you can share directly with auditors.',
                  icon: ShieldCheck,
                  color: 'brand',
                },
              ].map((item, idx) => (
                <div key={idx} className="relative text-center animate-fadeInUp">
                  {/* Step number circle */}
                  <div className={`w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg ${
                    item.color === 'accent'
                      ? 'bg-accent-500 shadow-accent-500/25'
                      : 'bg-brand-600 shadow-brand-500/25'
                  } relative z-10`}>
                    <item.icon size={28} />
                  </div>
                  <div className="text-xs font-bold text-surface-400 uppercase tracking-widest mb-2">Step {item.step}</div>
                  <h3 className="text-2xl font-bold text-surface-900 dark:text-white mb-3">{item.title}</h3>
                  <p className="text-surface-500 dark:text-surface-400 leading-relaxed max-w-xs mx-auto">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ================================================================= */}
        {/* Features Section - Tabbed Interface                               */}
        {/* ================================================================= */}
        <section id="features" aria-labelledby="features-heading" className="py-24 bg-surface-50 dark:bg-surface-900 relative transition-colors duration-300">
          <div className="absolute inset-0 dot-pattern opacity-[0.02]"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Heading */}
            <div className="text-center mb-14">
              <p className="text-brand-600 dark:text-brand-400 font-bold tracking-wide uppercase text-sm mb-3">Platform Capabilities</p>
              <h2 id="features-heading" className="text-3xl lg:text-5xl font-bold text-surface-900 dark:text-white">Everything you need to stay compliant</h2>
            </div>

            {/* Tabs */}
            <div className="flex flex-wrap justify-center gap-2 mb-12" role="tablist" aria-label="Platform capability categories">
              {tabOrder.map((tab) => (
                <button
                  key={tab}
                  role="tab"
                  aria-selected={activeTab === tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${
                    activeTab === tab
                      ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/25'
                      : 'bg-white text-surface-600 hover:bg-surface-100 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700'
                  }`}
                >
                  {featuresByTab[tab].label}
                </button>
              ))}
            </div>

            {/* Feature cards grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fadeIn">
              {featuresByTab[activeTab].features.map((feature, idx) => (
                <div
                  key={`${activeTab}-${idx}`}
                  className="group bg-white dark:bg-surface-800 p-8 rounded-2xl border border-surface-100 dark:border-surface-700 hover:border-brand-200 dark:hover:border-brand-700 hover:shadow-xl hover:shadow-brand-500/5 transition-all hover:-translate-y-1"
                >
                  <div className="w-12 h-12 bg-brand-100 dark:bg-brand-900/50 rounded-xl flex items-center justify-center text-brand-600 dark:text-brand-300 mb-5 group-hover:scale-110 transition-transform">
                    <feature.icon size={24} />
                  </div>
                  <h3 className="text-lg font-bold text-surface-900 dark:text-white mb-2">{feature.title}</h3>
                  <p className="text-surface-500 dark:text-surface-400 leading-relaxed text-sm">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ================================================================= */}
        {/* Frameworks covered — each links to its pillar page                 */}
        {/* ================================================================= */}
        <section id="frameworks" aria-labelledby="frameworks-heading" className="py-24 bg-white dark:bg-surface-950 transition-colors duration-300">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <p className="text-brand-600 dark:text-brand-400 font-bold tracking-wide uppercase text-sm mb-3">Frameworks Covered</p>
              <h2 id="frameworks-heading" className="text-3xl lg:text-5xl font-bold text-surface-900 dark:text-white mb-4">Compliance standards we help you achieve</h2>
              <p className="text-surface-500 dark:text-surface-400 max-w-2xl mx-auto">
                Explore in-depth guides for each framework ComplyEasy AI supports — from security and privacy to AI governance.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {frameworks.map((fw) => (
                <Link
                  key={fw.path}
                  to={fw.path}
                  className="group bg-surface-50 dark:bg-surface-900 p-6 rounded-2xl border border-surface-100 dark:border-surface-800 hover:border-brand-300 dark:hover:border-brand-700 hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <div className="w-11 h-11 bg-brand-100 dark:bg-brand-900/50 rounded-xl flex items-center justify-center text-brand-600 dark:text-brand-300 mb-4 group-hover:scale-110 transition-transform">
                    <fw.icon size={22} />
                  </div>
                  <h3 className="text-lg font-bold text-surface-900 dark:text-white mb-1.5 flex items-center gap-1.5">
                    {fw.name}
                    <ArrowRight size={16} className="opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-brand-600 dark:text-brand-400" />
                  </h3>
                  <p className="text-sm text-surface-500 dark:text-surface-400 leading-relaxed">{fw.blurb}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ================================================================= */}
        {/* AI / AEO differentiators                                           */}
        {/* ================================================================= */}
        <section id="differentiators" aria-labelledby="diff-heading" className="py-24 bg-surface-900 text-white relative overflow-hidden">
          <div className="absolute inset-0 noise opacity-[0.04]"></div>
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand-500/10 rounded-full blur-[150px]"></div>
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent-500/10 rounded-full blur-[120px]"></div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <p className="text-brand-400 font-bold tracking-wide uppercase text-sm mb-3">Why ComplyEasy AI</p>
              <h2 id="diff-heading" className="text-3xl lg:text-5xl font-bold mb-4">Compliance that operates itself</h2>
              <p className="text-surface-400 max-w-2xl mx-auto">
                Most tools help you <em>manage</em> compliance. ComplyEasy AI runs autonomous systems that <em>operate</em> it.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: Target,
                  title: 'aCOS — Autonomous Compliance Operating System',
                  desc: 'A closed loop that observes your environment, predicts compliance drift, acts on it, verifies the outcome, and learns — tracking compliance debt against autonomous goals.',
                },
                {
                  icon: RefreshCw,
                  title: 'Agentic AI with rollback',
                  desc: 'Agents execute remediation safely with blast-radius estimation, automatic rollback on failure, and human-in-the-loop approval gates for high-impact actions.',
                },
                {
                  icon: Network,
                  title: 'Regulatory Intelligence Fabric',
                  desc: 'Continuously ingests regulatory changes, detects what changed, resolves conflicts between frameworks, and updates the controls those changes affect.',
                },
              ].map((item, idx) => (
                <div key={idx} className="glass-dark p-8 rounded-2xl border border-surface-700/50">
                  <div className="w-12 h-12 bg-brand-500/20 rounded-xl flex items-center justify-center text-brand-300 mb-5">
                    <item.icon size={24} />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                  <p className="text-surface-400 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>

            <div className="mt-16 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
              <div>
                <h3 className="text-2xl lg:text-3xl font-bold mb-4">Built by security and AI engineers</h3>
                <p className="text-surface-400 text-lg leading-relaxed mb-6">
                  ComplyEasy AI was built by a team of security and AI engineers to bring enterprise-grade
                  compliance automation to organizations of every size. The platform is architected around
                  encryption at rest and in transit, role-based access control, and a complete, immutable
                  audit trail — so the system that proves your compliance is itself built to be trusted.
                </p>
                <ul className="space-y-3">
                  {[
                    'Encryption at rest and in transit',
                    'Role-based access control (RBAC)',
                    'Full, versioned audit trail',
                    'Bring-your-own-key (BYOK) encryption',
                  ].map((point) => (
                    <li key={point} className="flex items-center gap-3 text-surface-300">
                      <CheckCircle className="w-5 h-5 text-accent-400 flex-shrink-0" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="relative">
                <div className="absolute inset-0 bg-brand-500 rounded-full blur-[120px] opacity-15"></div>
                <div className="relative glass-dark p-8 rounded-2xl shadow-2xl border border-surface-700/50">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-11 h-11 bg-brand-500/20 rounded-xl flex items-center justify-center text-brand-300">
                      <Database size={22} />
                    </div>
                    <div>
                      <div className="font-bold">Security architecture</div>
                      <div className="text-sm text-surface-400">Defense in depth</div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {[
                      { icon: Lock, label: 'AES-grade encryption at rest & TLS in transit' },
                      { icon: Users, label: 'Granular role-based access control' },
                      { icon: ScrollText, label: 'Immutable, exportable audit trail' },
                      { icon: Timer, label: 'Just-in-time privileged access' },
                    ].map((row) => (
                      <div key={row.label} className="flex items-center gap-3 text-sm text-surface-300">
                        <row.icon className="w-5 h-5 text-accent-400 flex-shrink-0" />
                        <span>{row.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================= */}
        {/* Pricing Section                                                   */}
        {/* ================================================================= */}
        <section id="pricing" aria-label="Pricing" className="py-24 bg-white dark:bg-surface-950 transition-colors duration-300">
          <PricingSection
            embedded={false}
            onSelectTier={(_tier: TierName) => {
              // When a user selects a tier, prompt registration.
              setAuthStep('register');
              setShowAuthModal(true);
            }}
          />
        </section>

        {/* ================================================================= */}
        {/* FAQ Section (on-page + JSON-LD above)                              */}
        {/* ================================================================= */}
        <section id="faq" aria-labelledby="faq-heading" className="py-24 bg-surface-50 dark:bg-surface-900 transition-colors duration-300">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <p className="text-brand-600 dark:text-brand-400 font-bold tracking-wide uppercase text-sm mb-3">FAQ</p>
              <h2 id="faq-heading" className="text-3xl lg:text-5xl font-bold text-surface-900 dark:text-white">Frequently asked questions</h2>
            </div>

            <div className="space-y-4">
              {faqItems.map((item, idx) => (
                <details
                  key={idx}
                  className="group bg-white dark:bg-surface-800 rounded-2xl border border-surface-100 dark:border-surface-700 p-6 open:shadow-lg transition-shadow"
                >
                  <summary className="flex items-center justify-between cursor-pointer list-none font-semibold text-surface-900 dark:text-white">
                    <span>{item.q}</span>
                    <ArrowRight size={18} className="flex-shrink-0 ml-4 text-brand-600 dark:text-brand-400 transition-transform group-open:rotate-90" />
                  </summary>
                  <p className="mt-4 text-surface-600 dark:text-surface-300 leading-relaxed">{item.a}</p>
                </details>
              ))}
            </div>

            <p className="text-center text-sm text-surface-500 dark:text-surface-400 mt-10">
              Have more questions? Visit the{' '}
              <Link to="/faq" className="text-brand-600 dark:text-brand-400 hover:underline font-medium">full FAQ</Link>{' '}
              or browse the{' '}
              <Link to="/glossary" className="text-brand-600 dark:text-brand-400 hover:underline font-medium">compliance glossary</Link>.
            </p>
          </div>
        </section>

        {/* ================================================================= */}
        {/* Final CTA                                                         */}
        {/* ================================================================= */}
        <section aria-label="Get started" className="py-24 bg-white dark:bg-surface-950 transition-colors duration-300">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative overflow-hidden rounded-3xl bg-brand-600 dark:bg-brand-700 px-8 py-16 text-center shadow-2xl shadow-brand-500/20">
              <div className="absolute inset-0 dot-pattern opacity-10"></div>
              <div className="absolute -top-20 -right-20 w-72 h-72 bg-accent-400/30 rounded-full blur-[100px]"></div>
              <div className="relative">
                <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
                  Start automating your compliance today
                </h2>
                <p className="text-brand-50 text-lg max-w-2xl mx-auto mb-8">
                  Spin up automated evidence collection and continuous monitoring in minutes. No credit card required for the free trial.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <button
                    onClick={() => {
                      setShowSignupModal(true);
                      window.location.href = '/signup';
                    }}
                    className="w-full sm:w-auto px-8 py-4 bg-white text-brand-700 rounded-full font-semibold hover:bg-brand-50 transition-all transform hover:scale-105 shadow-xl flex items-center justify-center text-lg"
                  >
                    Start Free Trial <ArrowRight size={20} className="ml-2" />
                  </button>
                  <button
                    onClick={() => setShowDemoModal(true)}
                    className="w-full sm:w-auto px-8 py-4 bg-brand-700/40 text-white border border-white/30 rounded-full font-semibold hover:bg-brand-700/60 transition-all transform hover:scale-105 flex items-center justify-center text-lg"
                  >
                    Book a Demo <ArrowRight size={20} className="ml-2" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ================================================================= */}
      {/* Footer - rich internal linking for SEO                            */}
      {/* ================================================================= */}
      <footer className="bg-surface-900 text-white py-16 border-t border-surface-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center space-x-2 mb-4">
                <div className="bg-brand-600 p-2 rounded-lg">
                  <Shield className="text-white w-5 h-5" />
                </div>
                <span className="font-bold text-lg">ComplyEasy AI</span>
              </div>
              <p className="text-surface-400 text-sm mb-4">
                Autonomous AI compliance automation for SOC 2, ISO 27001, GDPR, HIPAA, and the EU AI Act.
              </p>
            </div>

            {/* Frameworks */}
            <nav aria-label="Frameworks">
              <h3 className="font-semibold text-white mb-4">Frameworks</h3>
              <ul className="space-y-3 text-sm text-surface-400">
                <li><Link to="/soc2-compliance" className="hover:text-white transition-colors">SOC 2 Compliance</Link></li>
                <li><Link to="/iso-27001" className="hover:text-white transition-colors">ISO 27001</Link></li>
                <li><Link to="/gdpr" className="hover:text-white transition-colors">GDPR</Link></li>
                <li><Link to="/hipaa" className="hover:text-white transition-colors">HIPAA</Link></li>
                <li><Link to="/eu-ai-act" className="hover:text-white transition-colors">EU AI Act</Link></li>
                <li><Link to="/nist-ai-rmf" className="hover:text-white transition-colors">NIST AI RMF</Link></li>
              </ul>
            </nav>

            {/* Platform */}
            <nav aria-label="Platform">
              <h3 className="font-semibold text-white mb-4">Platform</h3>
              <ul className="space-y-3 text-sm text-surface-400">
                <li><Link to="/platform/ai-compliance" className="hover:text-white transition-colors">AI Compliance</Link></li>
                <li><Link to="/grc" className="hover:text-white transition-colors">GRC Platform</Link></li>
                <li><a href="#features" className="hover:text-white transition-colors">Capabilities</a></li>
                <li><a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
              </ul>
            </nav>

            {/* Compare */}
            <nav aria-label="Compare">
              <h3 className="font-semibold text-white mb-4">Compare</h3>
              <ul className="space-y-3 text-sm text-surface-400">
                <li><Link to="/compare/vanta-alternative" className="hover:text-white transition-colors">Vanta Alternative</Link></li>
                <li><Link to="/compare/drata-alternative" className="hover:text-white transition-colors">Drata Alternative</Link></li>
                <li><Link to="/pricing" className="hover:text-white transition-colors">Plans &amp; Pricing</Link></li>
                <li><a href="/signup" className="hover:text-white transition-colors">Start Free Trial</a></li>
              </ul>
            </nav>

            {/* Resources */}
            <nav aria-label="Resources">
              <h3 className="font-semibold text-white mb-4">Resources</h3>
              <ul className="space-y-3 text-sm text-surface-400">
                <li><Link to="/blog" className="hover:text-white transition-colors">Blog</Link></li>
                <li><Link to="/faq" className="hover:text-white transition-colors">FAQ</Link></li>
                <li><Link to="/glossary" className="hover:text-white transition-colors">Glossary</Link></li>
                <li><a href="/docs" className="hover:text-white transition-colors">Documentation</a></li>
                <li><a href="/learn" className="hover:text-white transition-colors">Learning Center</a></li>
              </ul>
            </nav>
          </div>

          {/* Trust signals — capabilities, not unverifiable claims */}
          <div className="border-t border-surface-800 pt-8 pb-4">
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 mb-2">
              <div className="flex items-center gap-2 text-sm text-surface-400">
                <Lock className="w-5 h-5 text-accent-400" />
                <span>Encryption at rest &amp; in transit</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-surface-400">
                <Users className="w-5 h-5 text-brand-400" />
                <span>Role-based access control</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-surface-400">
                <ScrollText className="w-5 h-5 text-purple-400" />
                <span>Full audit trail</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-surface-400">
                <Key className="w-5 h-5 text-amber-400" />
                <span>BYOK encryption</span>
              </div>
            </div>
          </div>

          {/* Legal + bottom bar */}
          <div className="border-t border-surface-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-surface-400">
              &copy; 2026 ComplyEasy AI Inc. All rights reserved.
            </div>
            <nav aria-label="Legal" className="flex items-center gap-6 text-sm text-surface-400">
              <a href="/privacy" className="hover:text-white transition-colors">Privacy</a>
              <a href="/terms" className="hover:text-white transition-colors">Terms</a>
              <a href="/security" className="hover:text-white transition-colors">Security</a>
              <a href="/gdpr" className="hover:text-white transition-colors">GDPR</a>
            </nav>
          </div>
        </div>
      </footer>

      {/* ================================================================= */}
      {/* Signup Modal - Shows on initial page load                         */}
      {/* ================================================================= */}
      {showSignupModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-surface-900/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-surface-800 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden transform transition-all scale-100 relative">
            <button
              onClick={() => setShowSignupModal(false)}
              className="absolute top-4 right-4 text-surface-400 hover:text-surface-600 dark:hover:text-surface-200 z-10 transition-colors"
              aria-label="Close signup modal"
            >
              <X size={24} />
            </button>

            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-brand-100 dark:bg-brand-900/50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Shield className="text-brand-600 dark:text-brand-300" size={32}/>
              </div>

              <h3 className="text-2xl font-bold text-surface-900 dark:text-white mb-2">Start Your Free Trial</h3>
              <p className="text-surface-500 dark:text-surface-400 mb-6">
                Get full access to ComplyEasy AI. No credit card required.
              </p>

              <div className="space-y-3 mb-6 text-left">
                <div className="flex items-center gap-3 text-sm text-surface-600 dark:text-surface-300">
                  <CheckCircle className="w-5 h-5 text-accent-500 flex-shrink-0" />
                  <span>AI-powered compliance automation</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-surface-600 dark:text-surface-300">
                  <CheckCircle className="w-5 h-5 text-accent-500 flex-shrink-0" />
                  <span>Up to 3 compliance frameworks</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-surface-600 dark:text-surface-300">
                  <CheckCircle className="w-5 h-5 text-accent-500 flex-shrink-0" />
                  <span>Up to 10 team members</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-surface-600 dark:text-surface-300">
                  <CheckCircle className="w-5 h-5 text-accent-500 flex-shrink-0" />
                  <span>Automated evidence collection</span>
                </div>
              </div>

              <button
                onClick={() => {
                  setShowSignupModal(false);
                  window.location.href = '/signup';
                }}
                className="w-full bg-amber-500 text-white py-3 rounded-xl font-bold hover:bg-amber-600 transition-colors flex items-center justify-center gap-2 mb-3"
              >
                Get Started Free
                <ArrowRight size={18} />
              </button>

              <p className="text-xs text-surface-400">
                {t('auth.alreadyHaveAccount')}{' '}
                <button
                  onClick={() => {
                    setShowSignupModal(false);
                    setShowAuthModal(true);
                    setAuthStep('email');
                  }}
                  className="text-brand-600 dark:text-brand-400 hover:underline font-medium"
                >
                  {t('auth.login')}
                </button>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* Demo Booking Modal                                                */}
      {/* ================================================================= */}
      {showDemoModal && (
        <DemoBookingForm
          isOpen={showDemoModal}
          onClose={() => setShowDemoModal(false)}
          source="landing_page"
        />
      )}

      {/* ================================================================= */}
      {/* Auth Modal (Magic Link / SSO)                                     */}
      {/* ================================================================= */}
      {showAuthModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-surface-900/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-surface-800 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden transform transition-all scale-100 relative">
            <button onClick={() => setShowAuthModal(false)} aria-label="Close sign-in modal" className="absolute top-4 right-4 text-surface-400 hover:text-surface-600 dark:hover:text-surface-200">
                <X size={24} />
            </button>

            <div className="p-8 text-center">
               <div className="w-16 h-16 bg-brand-100 dark:bg-brand-900/50 rounded-full flex items-center justify-center mx-auto mb-6">
                  {authStep === 'magic-link-sent' ? <Mail className="text-brand-600 dark:text-brand-300" size={32}/> : <Shield className="text-brand-600 dark:text-brand-300" size={32}/>}
               </div>

               {authStep === 'email' && (
                  <div>
                    <h3 className="text-2xl font-bold text-surface-900 dark:text-white mb-2">Welcome Back</h3>
                    <p className="text-surface-500 dark:text-surface-400 mb-4">Sign in to your account</p>

                    {/* Login Method Toggle */}
                    <div className="flex space-x-2 mb-4 p-1 bg-surface-100 dark:bg-surface-700 rounded-lg">
                      <button
                        type="button"
                        onClick={() => setLoginMethod('magic-link')}
                        className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
                          loginMethod === 'magic-link'
                            ? 'bg-white dark:bg-surface-900 text-brand-600 dark:text-brand-300 shadow-sm'
                            : 'text-surface-600 dark:text-surface-300 hover:text-surface-900 dark:hover:text-white'
                        }`}
                      >
                        {t('auth.magicLink')}
                      </button>
                      <button
                        type="button"
                        onClick={() => setLoginMethod('password')}
                        className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
                          loginMethod === 'password'
                            ? 'bg-white dark:bg-surface-900 text-brand-600 dark:text-brand-300 shadow-sm'
                            : 'text-surface-600 dark:text-surface-300 hover:text-surface-900 dark:hover:text-white'
                        }`}
                      >
                        {t('auth.password')}
                      </button>
                    </div>

                    {loginMethod === 'magic-link' ? (
                      <form onSubmit={handleLoginSubmit}>
                        <div className="space-y-4">
                          <input
                            required
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="name@company.com"
                            className="w-full px-4 py-3 border border-surface-300 dark:border-surface-600 dark:bg-surface-900 dark:text-white rounded-xl focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                          />
                          <button
                            disabled={loading}
                            className="w-full bg-brand-600 text-white py-3 rounded-xl font-bold hover:bg-brand-700 transition-colors flex justify-center items-center"
                          >
                             {loading ? <Loader2 className="animate-spin" /> : t('auth.magicLink')}
                          </button>
                        </div>
                        <p className="mt-4 text-xs text-surface-400">Secure passwordless authentication</p>
                      </form>
                    ) : (
                      <form onSubmit={async (e) => {
                        e.preventDefault();
                        setLoading(true);
                        try {
                          await login(email, password);
                        } catch (error: any) {
                          logger.error('Login error:', error);
                          toast.error(error.message || 'Login failed. Please check your credentials.');
                        } finally {
                          setLoading(false);
                        }
                      }}>
                        <div className="space-y-4">
                          <input
                            required
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="name@company.com"
                            className="w-full px-4 py-3 border border-surface-300 dark:border-surface-600 dark:bg-surface-900 dark:text-white rounded-xl focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                          />
                          <input
                            required
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder={t('auth.password')}
                            className="w-full px-4 py-3 border border-surface-300 dark:border-surface-600 dark:bg-surface-900 dark:text-white rounded-xl focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                          />
                          <button
                            disabled={loading}
                            className="w-full bg-brand-600 text-white py-3 rounded-xl font-bold hover:bg-brand-700 transition-colors flex justify-center items-center"
                          >
                             {loading ? <Loader2 className="animate-spin" /> : t('auth.login')}
                          </button>
                        </div>
                        <p className="mt-4 text-xs text-surface-400">
                          {/* Recovery path: send a passwordless magic link the user can sign in with. */}
                          <button
                            type="button"
                            disabled={loading}
                            onClick={async () => {
                              if (!email) {
                                toast.info('Enter your email above, then tap "Forgot password" to receive a sign-in link.');
                                return;
                              }
                              setLoading(true);
                              try {
                                const response = await loginWithMagicLink(email);
                                setMagicLinkEmail(email);
                                if (response?.devToken) {
                                  setDevToken(response.devToken);
                                }
                                setAuthStep('magic-link-sent');
                              } catch (error: any) {
                                logger.error('Forgot-password magic link error:', error);
                                toast.error(error?.message || 'Failed to send a sign-in link. Please try again.');
                              } finally {
                                setLoading(false);
                              }
                            }}
                            className="text-brand-600 dark:text-brand-400 hover:underline disabled:opacity-50"
                          >
                            {t('auth.forgotPassword')}
                          </button>
                        </p>
                      </form>
                    )}
                  </div>
               )}

               {authStep === 'magic-link-sent' && (
                  <div>
                    <h3 className="text-2xl font-bold text-surface-900 dark:text-white mb-2">Check your email</h3>
                    <p className="text-surface-500 dark:text-surface-400 mb-6">We sent a magic link to <span className="font-bold text-surface-800 dark:text-surface-200">{email}</span>.</p>

                    {/* Development mode: Simulate click button */}
                    {devToken && (
                      <button
                        onClick={simulateMagicClick}
                        disabled={loading}
                        className="w-full bg-brand-600 text-white py-3 rounded-xl font-bold hover:bg-brand-700 transition-colors flex justify-center items-center mb-4"
                      >
                        {loading ? <Loader2 className="animate-spin" /> : 'Sign In Now (Dev Mode)'}
                      </button>
                    )}

                    <div className="flex justify-center space-x-4 text-sm">
                      <button
                        onClick={resendMagicLink}
                        disabled={loading}
                        className="text-brand-600 dark:text-brand-400 hover:underline"
                      >
                        Resend link
                      </button>
                      <span className="text-surface-300 dark:text-surface-600">|</span>
                      <button
                        onClick={() => setAuthStep('email')}
                        className="text-surface-500 dark:text-surface-400 hover:underline"
                      >
                        Use different email
                      </button>
                    </div>
                  </div>
               )}

               {authStep === 'register' && (
                  <form onSubmit={handleRegister}>
                    <h3 className="text-2xl font-bold text-surface-900 dark:text-white mb-2">{t('auth.createAccount')}</h3>
                    <p className="text-surface-500 dark:text-surface-400 mb-6">Looks like you're new here!</p>

                    <div className="space-y-4">
                      <input
                        required
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="name@company.com"
                        className="w-full px-4 py-3 border border-surface-300 dark:border-surface-600 dark:bg-surface-900 dark:text-white rounded-xl focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                      />
                      <input
                        required
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder={t('auth.fullName')}
                        className="w-full px-4 py-3 border border-surface-300 dark:border-surface-600 dark:bg-surface-900 dark:text-white rounded-xl focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                      />
                      <input
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="Password (optional - can set later)"
                        className="w-full px-4 py-3 border border-surface-300 dark:border-surface-600 dark:bg-surface-900 dark:text-white rounded-xl focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                      />
                      <button
                        disabled={loading}
                        className="w-full bg-brand-600 text-white py-3 rounded-xl font-bold hover:bg-brand-700 transition-colors flex justify-center items-center"
                      >
                         {loading ? <Loader2 className="animate-spin" /> : t('auth.createAccount')}
                      </button>
                    </div>
                    <p className="mt-4 text-xs text-surface-400">
                      By creating an account, you'll receive a magic link via email. Password is optional.
                    </p>
                  </form>
               )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
