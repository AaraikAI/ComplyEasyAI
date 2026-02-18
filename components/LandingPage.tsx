
import React, { useState } from 'react';
import {
  ArrowRight, CheckCircle, Lock, Shield, Zap, Globe, X, Mail, Loader2, BarChart, Users, Server,
  ShieldCheck, EyeOff, Key, GitMerge, BrainCircuit, Timer, Target, RefreshCw, TrendingUp,
  AlertTriangle, FileCheck, Network, Mic, Video, Radio, Cpu, Eye, Layers, Workflow, Sparkles,
  ClipboardCheck
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import PricingSection from './PricingSection';
import DemoBookingForm from './DemoBookingForm';
import { TierName } from '../types';
import { ThemeToggleCompact } from './ThemeToggle';

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
      { icon: Zap, title: 'AI Automation', desc: 'Intelligent agents automatically collect evidence, map controls, and flag risks 24/7 without human intervention.' },
      { icon: Globe, title: 'Global Frameworks', desc: 'Support for SOC 2, GDPR, HIPAA, ISO 27001, and NIST out of the box with one-click cross-mapping.' },
      { icon: BarChart, title: 'Real-time Analytics', desc: 'Live dashboards provide instant visibility into your compliance posture, gap analysis, and audit readiness.' },
      { icon: Users, title: 'Vendor Management', desc: 'Automate vendor risk assessments (VRM) and track third-party security certifications effortlessly.' },
      { icon: Server, title: '100+ Integrations', desc: 'Seamlessly connect with AWS, Google Workspace, GitHub, Jira, Slack, and more to unify your data.' },
      { icon: ClipboardCheck, title: 'NIST AI RMF Framework', desc: 'Comprehensive AI risk management with GOVERN, MAP, MEASURE, and MANAGE functions.' },
    ],
  },
  ai: {
    label: 'AI & Automation',
    features: [
      { icon: Target, title: 'aCOS\u2122', desc: 'Closed-loop control systems with Observe, Predict, Act, Verify, Learn cycles. Autonomous compliance goals and debt tracking.' },
      { icon: RefreshCw, title: 'Agentic AI with Rollback', desc: 'Safe autonomous execution with blast-radius estimation, automatic rollback on failure, and human-in-the-loop approvals.' },
      { icon: TrendingUp, title: 'Temporal Graph Networks', desc: '6-12 month predictive risk forecasting, compliance trajectory modeling, and early warning with <10% false positives.' },
      { icon: Layers, title: 'Compliance Digital Twin', desc: 'What-if scenario modeling, Monte Carlo analysis (10k iterations), policy/control failure simulations.' },
      { icon: Sparkles, title: 'NeuroSymbolic AI', desc: 'Hybrid neural-symbolic reasoning for explainable AI decisions, causal reasoning, and compliance justification.' },
      { icon: Cpu, title: 'Swarm Task Allocation', desc: 'Dynamic multi-agent task distribution, capability matching, load balancing, and real-time metrics.' },
    ],
  },
  security: {
    label: 'Enterprise Security',
    features: [
      { icon: Lock, title: 'Zero Trust Security', desc: 'Bank-grade encryption, Role-Based Access Control (RBAC), and continuous monitoring built into the core.' },
      { icon: ShieldCheck, title: 'Zero-Knowledge Proofs', desc: 'Prove compliance to auditors with cryptographic proofs (zk-SNARKs) without revealing sensitive data.' },
      { icon: EyeOff, title: 'AI Air Gap & Redaction', desc: 'Automatic PII redaction ensures sensitive customer data is sanitized before it ever touches an AI model.' },
      { icon: Key, title: 'BYOK Encryption', desc: 'Maintain absolute control over your data. Encrypt your compliance database with your own keys.' },
      { icon: BrainCircuit, title: 'Homomorphic AI', desc: 'Our AI agents analyze risks on encrypted data without ever needing to decrypt it.' },
      { icon: Timer, title: 'JIT Admin Access', desc: 'Eliminate dormant admin accounts with temporary, time-bound privileged access that auto-expires.' },
    ],
  },
  regulatory: {
    label: 'Regulatory',
    features: [
      { icon: ShieldCheck, title: 'EU AI Act Compliance', desc: 'Risk-based classification, high-risk system management, transparency reporting, and 20+ automated controls.' },
      { icon: Globe, title: 'Digital Markets Act (DMA)', desc: 'Full DMA compliance for gatekeeper platforms. Track Core Platform Services, data portability, and interoperability.' },
      { icon: Shield, title: 'Digital Services Act (DSA)', desc: 'Content moderation tracking, illegal content reporting, VLOP/VLOSE designation, and 31+ controls.' },
      { icon: FileCheck, title: 'Evidence Truth Layer\u2122', desc: 'Deepfake detection, cryptographic attestation, physical IoT attestation, and liveness detection.' },
      { icon: Network, title: 'Regulatory Intelligence Fabric', desc: 'Automated regulation ingestion, change detection, conflict resolution, and auto-update controls.' },
      { icon: GitMerge, title: 'Compliance-as-Code', desc: 'Block non-compliant infrastructure changes at the Pull Request level in your CI/CD pipeline.' },
    ],
  },
};

const tabOrder: FeatureTab[] = ['core', 'ai', 'security', 'regulatory'];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const LandingPage: React.FC = () => {
  const { verifyMagicLink, register, loginWithMagicLink } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [authStep, setAuthStep] = useState<'email' | 'magic-link-sent' | 'register' | 'password-login'>('email');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [loginMethod, setLoginMethod] = useState<'magic-link' | 'password'>('magic-link');
  const [loading, setLoading] = useState(false);
  const [mockToken, setMockToken] = useState<string | null>(null);

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
      const response: any = await loginWithMagicLink(email);
      // In development, backend returns the token directly for testing
      if (response?.devToken) {
        setMockToken(response.devToken);
      }
      setAuthStep('magic-link-sent');
    } catch (e: any) {
      console.error('Login error:', e);
      const errorMsg = e?.message || 'Failed to send magic link';
      // Backend auto-creates users, so errors are likely network/server issues
      if (errorMsg.includes('Network') || errorMsg.includes('Failed to fetch') || errorMsg.includes('Cannot connect')) {
        alert('Cannot connect to server. Please check:\n1. Backend server is running\n2. Network connection is active');
      } else {
        // Show error but don't redirect to registration - backend handles user creation
        alert(`Failed to send magic link: ${errorMsg}\n\nPlease try again or contact support if the issue persists.`);
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

      // Check if user already exists - backend now sends magic link automatically
      if (response?.existingUser) {
        // User already exists, but backend sent a magic link
        // In development, backend returns the token directly for testing
        if (response?.devToken) {
          setMockToken(response.devToken);
          if (process.env.NODE_ENV === 'development') console.log('Development token received for existing user');
        }
        setAuthStep('magic-link-sent');
        setLoading(false);
        return;
      }

      // New user registration - backend already sent a magic link
      // In development, backend returns the token directly for testing
      if (response?.devToken) {
        setMockToken(response.devToken);
      }
      setAuthStep('magic-link-sent');
    } catch (error: any) {
      console.error('Registration error:', error);
      const errorMsg = error?.message || 'Unknown error';
      if (errorMsg.includes('already exists') || errorMsg.includes('409')) {
        // This shouldn't happen anymore since backend handles it, but just in case
        alert('This email is already registered. A magic link has been sent to your email for login.');
        setAuthStep('email');
      } else if (errorMsg.includes('Network') || errorMsg.includes('Failed to fetch')) {
        alert('Cannot connect to server. Please check:\n1. Backend server is running\n2. Network connection is active');
      } else {
        alert(`Registration failed: ${errorMsg}\n\nPlease try again or contact support if the issue persists.`);
      }
    }
    setLoading(false);
  };

  // Simulate clicking the magic link
  const simulateMagicClick = async () => {
    setLoading(true);
    try {
      // Note: Mock tokens won't work with the real backend
      // In production, users click the link in their email which contains the real token
      // For development: we need the backend to be configured with a database
      // and the token must be stored in the database by the backend

      // Try to use mock token (will fail if backend requires real tokens)
      if (mockToken) {
        try {
          await verifyMagicLink(mockToken);
          // If successful, the AuthContext will update the user state
          return;
        } catch (error: any) {
          // If mock token fails, show helpful message
          const errorMsg = error?.message || 'Token verification failed';
          if (errorMsg.includes('Invalid') || errorMsg.includes('expired')) {
            alert('Development Note: Mock tokens don\'t work with the real backend.\n\n' +
                  'In production, users receive a real token via email.\n\n' +
                  'To test with the backend, you need:\n' +
                  '1. Database configured\n' +
                  '2. Backend to generate and store real tokens\n' +
                  '3. Use the token from the database or email');
          } else {
            throw error;
          }
        }
      } else {
        throw new Error('No token available. Please request a magic link first.');
      }
    } catch (error: any) {
      console.error('Magic link verification error:', error);
      alert(`Failed to verify magic link: ${error?.message || 'Unknown error'}\n\nPlease check:\n1. Backend is running\n2. Database is configured\n3. Try requesting a new magic link`);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-surface-950 font-sans text-surface-900 dark:text-surface-100 scroll-smooth transition-colors duration-300">
      {/* ================================================================= */}
      {/* Navbar - Glass-morphism                                           */}
      {/* ================================================================= */}
      <nav className="fixed w-full z-50 glass dark:glass-dark border-b border-surface-200/60 dark:border-surface-700/60 transition-colors duration-300">
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
              <a href="#pricing" onClick={(e) => scrollToSection(e, 'pricing')} className="text-sm font-medium text-surface-600 dark:text-surface-300 hover:text-brand-600 dark:hover:text-brand-400 transition-colors cursor-pointer">Pricing</a>
              <a href="#about" onClick={(e) => scrollToSection(e, 'about')} className="text-sm font-medium text-surface-600 dark:text-surface-300 hover:text-brand-600 dark:hover:text-brand-400 transition-colors cursor-pointer">About</a>
              <ThemeToggleCompact />
              <button
                onClick={() => { setAuthStep('email'); setShowAuthModal(true); }}
                className="bg-amber-500 text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-amber-600 transition-colors shadow-lg shadow-amber-500/20"
              >
                Sign In
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* ================================================================= */}
      {/* Hero Section - Mesh gradient background                           */}
      {/* ================================================================= */}
      <section className="relative pt-32 pb-24 lg:pt-48 lg:pb-36 overflow-hidden">
        {/* Mesh gradient background */}
        <div className="absolute inset-0 mesh-gradient opacity-50"></div>
        <div className="absolute inset-0 dot-pattern opacity-[0.03]"></div>
        {/* Decorative blobs */}
        <div className="absolute top-20 right-10 w-[500px] h-[500px] bg-brand-400/20 rounded-full blur-[120px] animate-float"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent-400/15 rounded-full blur-[100px]"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto animate-fadeIn">
            {/* Badge */}
            <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-brand-50 border border-brand-200 text-brand-700 text-xs font-semibold uppercase tracking-wide mb-8 animate-fadeInDown">
              <Sparkles size={14} className="mr-1.5 animate-glow" /> New: aCOS - Autonomous Compliance Operating System
            </div>

            {/* Headline */}
            <h1 className="text-6xl lg:text-8xl font-extrabold tracking-tight mb-8 leading-[1.05]">
              Compliance that <br/>
              <span className="text-gradient animate-gradient">runs itself.</span>
            </h1>

            {/* Sub-headline */}
            <p className="text-xl lg:text-2xl text-surface-500 mb-12 leading-relaxed max-w-2xl mx-auto">
              Empower your SMB with AI-driven compliance automation. Secure, scalable, and audit-ready for GDPR, SOC 2, and HIPAA in minutes, not months.
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
                className="w-full sm:w-auto px-8 py-4 bg-white/80 backdrop-blur text-brand-700 rounded-full font-semibold hover:bg-white transition-all transform hover:scale-105 shadow-xl flex items-center justify-center border border-brand-200 text-lg"
              >
                Book a Demo <ArrowRight size={20} className="ml-2" />
              </button>
            </div>

            {/* Trust badges inline */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-surface-500 animate-fadeInUp">
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
                <span>GDPR Compliant</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-accent-500" />
                <span>HIPAA Ready</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* Social Proof Bar                                                  */}
      {/* ================================================================= */}
      <section className="py-12 border-y border-surface-100 bg-surface-50/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm font-semibold text-surface-400 uppercase tracking-widest mb-8">
            Trusted by 500+ companies worldwide
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6 opacity-40">
            {/* Placeholder company logos - rendered as styled text blocks */}
            {['Acme Corp', 'Globex', 'Initech', 'Hooli', 'Pied Piper', 'Soylent', 'Umbrella', 'Wayne Ent'].map((name) => (
              <div key={name} className="text-xl font-bold tracking-tight text-surface-900 select-none">
                {name}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* Features Section - Tabbed Interface                               */}
      {/* ================================================================= */}
      <section id="features" className="py-24 bg-white dark:bg-surface-900 relative transition-colors duration-300">
        <div className="absolute inset-0 dot-pattern opacity-[0.02]"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Heading */}
          <div className="text-center mb-14">
            <p className="text-brand-600 font-bold tracking-wide uppercase text-sm mb-3">Platform Features</p>
            <h2 className="text-3xl lg:text-5xl font-bold text-surface-900">Everything you need to stay compliant</h2>
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap justify-center gap-2 mb-12">
            {tabOrder.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${
                  activeTab === tab
                    ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/25'
                    : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
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
                className="group bg-white p-8 rounded-2xl border border-surface-100 hover:border-brand-200 hover:shadow-xl hover:shadow-brand-500/5 transition-all hover:-translate-y-1"
              >
                <div className="w-12 h-12 bg-brand-100 rounded-xl flex items-center justify-center text-brand-600 mb-5 group-hover:scale-110 transition-transform">
                  <feature.icon size={24} />
                </div>
                <h4 className="text-lg font-bold text-surface-900 mb-2">{feature.title}</h4>
                <p className="text-surface-500 leading-relaxed text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* How It Works                                                      */}
      {/* ================================================================= */}
      <section id="how-it-works" className="py-24 bg-surface-50 relative overflow-hidden">
        <div className="absolute inset-0 noise opacity-[0.03]"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-brand-600 font-bold tracking-wide uppercase text-sm mb-3">How It Works</p>
            <h2 className="text-3xl lg:text-5xl font-bold text-surface-900">Three steps to full compliance</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connecting line (desktop only) */}
            <div className="hidden md:block absolute top-16 left-[20%] right-[20%] h-0.5 bg-gradient-to-r from-brand-500 via-accent-400 to-brand-500 opacity-30"></div>

            {[
              {
                step: '01',
                title: 'Connect',
                desc: 'Integrate your existing tools in minutes. We support 100+ platforms including AWS, GitHub, Jira, and Slack.',
                icon: Server,
                color: 'brand',
              },
              {
                step: '02',
                title: 'Automate',
                desc: 'Our AI agents continuously collect evidence, map controls, and flag risks 24/7 without human intervention.',
                icon: Zap,
                color: 'accent',
              },
              {
                step: '03',
                title: 'Comply',
                desc: 'Stay audit-ready with real-time dashboards, automated reports, and one-click certifications.',
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
                <h3 className="text-2xl font-bold text-surface-900 mb-3">{item.title}</h3>
                <p className="text-surface-500 leading-relaxed max-w-xs mx-auto">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* Pricing Section                                                   */}
      {/* ================================================================= */}
      <section id="pricing" className="py-24 bg-white">
        <PricingSection
          embedded={false}
          onSelectTier={(tier: TierName) => {
            // When user selects a tier, show registration modal
            setAuthStep('register');
            setShowAuthModal(true);
          }}
        />
      </section>

      {/* ================================================================= */}
      {/* About / Stats Section - Dark                                      */}
      {/* ================================================================= */}
      <section id="about" className="py-24 bg-surface-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 noise opacity-[0.04]"></div>
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand-500/10 rounded-full blur-[150px]"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent-500/10 rounded-full blur-[120px]"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left - Mission */}
            <div>
              <p className="text-brand-400 font-bold tracking-wide uppercase text-sm mb-3">Our Mission</p>
              <h2 className="text-3xl lg:text-5xl font-bold mb-6 leading-tight">Making compliance accessible to everyone.</h2>
              <p className="text-surface-400 text-lg leading-relaxed mb-10">
                Founded by security experts and AI engineers, ComplyEasy AI aims to democratize access to enterprise-grade compliance tools.
                We believe that every company, regardless of size, deserves secure and compliant operations without the crushing overhead of manual audits.
              </p>

              {/* Animated counters */}
              <div className="grid grid-cols-2 gap-8">
                {[
                  { value: '95%', label: 'Time Saved on Audits' },
                  { value: '24/7', label: 'Automated Monitoring' },
                  { value: '500+', label: 'SMBs Trusted Us' },
                  { value: '100%', label: 'Audit Success Rate' },
                ].map((stat, idx) => (
                  <div key={idx} className="animate-fadeInUp">
                    <div className="text-4xl lg:text-5xl font-extrabold text-gradient mb-2">{stat.value}</div>
                    <div className="text-sm text-surface-400">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right - Visual card */}
            <div className="relative">
              <div className="absolute inset-0 bg-brand-500 rounded-full blur-[120px] opacity-15"></div>
              <div className="relative glass-dark p-8 rounded-2xl shadow-2xl border border-surface-700/50">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="w-12 h-12 bg-surface-700 rounded-full animate-shimmer"></div>
                  <div>
                    <div className="h-4 w-32 bg-surface-700 rounded mb-2"></div>
                    <div className="h-3 w-20 bg-surface-700 rounded"></div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="h-3 w-full bg-surface-700 rounded"></div>
                  <div className="h-3 w-5/6 bg-surface-700 rounded"></div>
                  <div className="h-3 w-4/6 bg-surface-700 rounded"></div>
                </div>
                <div className="mt-8 pt-6 border-t border-surface-700 flex justify-between items-center">
                  <div className="text-sm text-surface-400">Security Score</div>
                  <div className="text-2xl font-bold text-accent-400">98/100</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* Footer                                                            */}
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
                AI-powered compliance automation for modern businesses.
              </p>
              <div className="flex space-x-4">
                <a href="https://twitter.com/complyeasyai" target="_blank" rel="noopener noreferrer" className="text-surface-400 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                </a>
                <a href="https://linkedin.com/company/complyeasyai" target="_blank" rel="noopener noreferrer" className="text-surface-400 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                </a>
                <a href="https://github.com/complyeasyai" target="_blank" rel="noopener noreferrer" className="text-surface-400 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                </a>
              </div>
            </div>

            {/* Product */}
            <div>
              <h3 className="font-semibold text-white mb-4">Product</h3>
              <ul className="space-y-3 text-sm text-surface-400">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="/signup" className="hover:text-white transition-colors">Free Trial</a></li>
                <li><a href="/docs" className="hover:text-white transition-colors">API</a></li>
                <li><a href="/status" className="hover:text-white transition-colors">System Status</a></li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h3 className="font-semibold text-white mb-4">Resources</h3>
              <ul className="space-y-3 text-sm text-surface-400">
                <li><a href="/docs" className="hover:text-white transition-colors">Documentation</a></li>
                <li><a href="/learn" className="hover:text-white transition-colors">Learning Center</a></li>
                <li><a href="/community" className="hover:text-white transition-colors">Community</a></li>
                <li><a href="/learn#webinars" className="hover:text-white transition-colors">Webinars</a></li>
                <li><a href="/docs#api" className="hover:text-white transition-colors">API Reference</a></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h3 className="font-semibold text-white mb-4">Company</h3>
              <ul className="space-y-3 text-sm text-surface-400">
                <li><a href="#about" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="/careers" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="/blog" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="/press" className="hover:text-white transition-colors">Press</a></li>
                <li><a href="mailto:contact@complyeasyai.com" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h3 className="font-semibold text-white mb-4">Legal</h3>
              <ul className="space-y-3 text-sm text-surface-400">
                <li><a href="/privacy" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="/terms" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="/security" className="hover:text-white transition-colors">Security</a></li>
                <li><a href="/gdpr" className="hover:text-white transition-colors">GDPR</a></li>
                <li><a href="/dpa" className="hover:text-white transition-colors">DPA</a></li>
              </ul>
            </div>
          </div>

          {/* Compliance Badges */}
          <div className="border-t border-surface-800 pt-8 pb-4">
            <div className="flex flex-wrap items-center justify-center gap-6 mb-8">
              <div className="flex items-center gap-2 text-sm text-surface-400">
                <Shield className="w-5 h-5 text-accent-400" />
                <span>SOC 2 Type II</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-surface-400">
                <Lock className="w-5 h-5 text-blue-400" />
                <span>ISO 27001</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-surface-400">
                <Globe className="w-5 h-5 text-purple-400" />
                <span>GDPR Compliant</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-surface-400">
                <CheckCircle className="w-5 h-5 text-yellow-400" />
                <span>HIPAA Ready</span>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-surface-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-surface-400">
              &copy; 2026 ComplyEasy AI Inc. All rights reserved.
            </div>
            <div className="flex items-center gap-6 text-sm text-surface-400">
              <a href="mailto:support@complyeasyai.com" className="hover:text-white transition-colors flex items-center gap-1">
                <Mail className="w-4 h-4" />
                support@complyeasyai.com
              </a>
              <span className="hidden md:block">|</span>
              <span>1-800-COMPLY-AI</span>
            </div>
          </div>
        </div>
      </footer>

      {/* ================================================================= */}
      {/* Signup Modal - Shows on initial page load                         */}
      {/* ================================================================= */}
      {showSignupModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-surface-900/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden transform transition-all scale-100 relative">
            <button
              onClick={() => setShowSignupModal(false)}
              className="absolute top-4 right-4 text-surface-400 hover:text-surface-600 z-10 transition-colors"
              aria-label="Close signup modal"
            >
              <X size={24} />
            </button>

            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Shield className="text-brand-600" size={32}/>
              </div>

              <h3 className="text-2xl font-bold text-surface-900 mb-2">Start Your Free Trial</h3>
              <p className="text-surface-500 mb-6">
                Get 3 days of full access to ComplyEasyAI. No credit card required.
              </p>

              <div className="space-y-3 mb-6 text-left">
                <div className="flex items-center gap-3 text-sm text-surface-600">
                  <CheckCircle className="w-5 h-5 text-accent-500 flex-shrink-0" />
                  <span>AI-powered compliance automation</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-surface-600">
                  <CheckCircle className="w-5 h-5 text-accent-500 flex-shrink-0" />
                  <span>Up to 3 compliance frameworks</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-surface-600">
                  <CheckCircle className="w-5 h-5 text-accent-500 flex-shrink-0" />
                  <span>Up to 10 team members</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-surface-600">
                  <CheckCircle className="w-5 h-5 text-accent-500 flex-shrink-0" />
                  <span>24/7 automated evidence collection</span>
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
                Already have an account?{' '}
                <button
                  onClick={() => {
                    setShowSignupModal(false);
                    setShowAuthModal(true);
                    setAuthStep('email');
                  }}
                  className="text-brand-600 hover:underline font-medium"
                >
                  Sign In
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
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden transform transition-all scale-100 relative">
            <button onClick={() => setShowAuthModal(false)} className="absolute top-4 right-4 text-surface-400 hover:text-surface-600">
                <X size={24} />
            </button>

            <div className="p-8 text-center">
               <div className="w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  {authStep === 'magic-link-sent' ? <Mail className="text-brand-600" size={32}/> : <Shield className="text-brand-600" size={32}/>}
               </div>

               {authStep === 'email' && (
                  <div>
                    <h3 className="text-2xl font-bold text-surface-900 mb-2">Welcome Back</h3>
                    <p className="text-surface-500 mb-4">Sign in to your account</p>

                    {/* Login Method Toggle */}
                    <div className="flex space-x-2 mb-4 p-1 bg-surface-100 rounded-lg">
                      <button
                        type="button"
                        onClick={() => setLoginMethod('magic-link')}
                        className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
                          loginMethod === 'magic-link'
                            ? 'bg-white text-brand-600 shadow-sm'
                            : 'text-surface-600 hover:text-surface-900'
                        }`}
                      >
                        Magic Link
                      </button>
                      <button
                        type="button"
                        onClick={() => setLoginMethod('password')}
                        className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
                          loginMethod === 'password'
                            ? 'bg-white text-brand-600 shadow-sm'
                            : 'text-surface-600 hover:text-surface-900'
                        }`}
                      >
                        Password
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
                            className="w-full px-4 py-3 border border-surface-300 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                          />
                          <button
                            disabled={loading}
                            className="w-full bg-brand-600 text-white py-3 rounded-xl font-bold hover:bg-brand-700 transition-colors flex justify-center items-center"
                          >
                             {loading ? <Loader2 className="animate-spin" /> : 'Send Magic Link'}
                          </button>
                        </div>
                        <p className="mt-4 text-xs text-surface-400">Secure passwordless authentication</p>
                      </form>
                    ) : (
                      <form onSubmit={async (e) => {
                        e.preventDefault();
                        setLoading(true);
                        try {
                          await api.auth.login(email, password);
                          // Login successful - AuthContext will handle redirect
                          window.location.reload();
                        } catch (error: any) {
                          console.error('Login error:', error);
                          alert(error.message || 'Login failed. Please check your credentials.');
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
                            className="w-full px-4 py-3 border border-surface-300 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                          />
                          <input
                            required
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="Password"
                            className="w-full px-4 py-3 border border-surface-300 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                          />
                          <button
                            disabled={loading}
                            className="w-full bg-brand-600 text-white py-3 rounded-xl font-bold hover:bg-brand-700 transition-colors flex justify-center items-center"
                          >
                             {loading ? <Loader2 className="animate-spin" /> : 'Sign In'}
                          </button>
                        </div>
                        <p className="mt-4 text-xs text-surface-400">
                          <button type="button" className="text-brand-600 hover:underline">
                            Forgot password?
                          </button>
                        </p>
                      </form>
                    )}
                  </div>
               )}

               {authStep === 'magic-link-sent' && (
                  <div>
                    <h3 className="text-2xl font-bold text-surface-900 mb-2">Check your email</h3>
                    <p className="text-surface-500 mb-6">We sent a magic link to <span className="font-bold text-surface-800">{email}</span>.</p>
                    <button
                       onClick={simulateMagicClick}
                       className="text-brand-600 font-bold hover:underline text-sm"
                    >
                       (Simulate Clicking Link from Email)
                    </button>
                  </div>
               )}

               {authStep === 'register' && (
                  <form onSubmit={handleRegister}>
                    <h3 className="text-2xl font-bold text-surface-900 mb-2">Create Account</h3>
                    <p className="text-surface-500 mb-6">Looks like you're new here!</p>

                    <div className="space-y-4">
                      <input
                        required
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="name@company.com"
                        className="w-full px-4 py-3 border border-surface-300 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                      />
                      <input
                        required
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="Full Name"
                        className="w-full px-4 py-3 border border-surface-300 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                      />
                      <input
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="Password (optional - can set later)"
                        className="w-full px-4 py-3 border border-surface-300 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                      />
                      <button
                        disabled={loading}
                        className="w-full bg-brand-600 text-white py-3 rounded-xl font-bold hover:bg-brand-700 transition-colors flex justify-center items-center"
                      >
                         {loading ? <Loader2 className="animate-spin" /> : 'Create Account'}
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
