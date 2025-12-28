
import React, { useState } from 'react';
import { 
  ArrowRight, CheckCircle, Lock, Shield, Zap, Globe, X, Mail, Loader2, BarChart, Users, Server,
  ShieldCheck, EyeOff, Key, GitMerge, BrainCircuit, Timer, Target, RefreshCw, TrendingUp,
  AlertTriangle, FileCheck, Network, Mic, Video, Radio, Cpu, Eye, Layers, Workflow, Sparkles
} from 'lucide-react';
import { PRICING_TIERS } from '../constants';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';

export const LandingPage: React.FC = () => {
  const { verifyMagicLink, register, loginWithMagicLink } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authStep, setAuthStep] = useState<'email' | 'magic-link-sent' | 'register' | 'password-login'>('email');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [loginMethod, setLoginMethod] = useState<'magic-link' | 'password'>('magic-link');
  const [loading, setLoading] = useState(false);
  const [mockToken, setMockToken] = useState<string | null>(null);

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
      const response: any = await loginWithMagicLink(email);
      // In development, backend returns the token directly for testing
      if (response?.devToken) {
        setMockToken(response.devToken);
        console.log('Development token received:', response.devToken);
      } else {
        // Fallback: generate a mock token (won't work with real backend)
        const testToken = `mock_token_${Date.now()}_${email}`;
        setMockToken(testToken);
      }
      setAuthStep('magic-link-sent');
    } catch (e: any) {
      console.error('Login error:', e);
      const errorMsg = e?.message || 'Failed to send magic link';
      // If user doesn't exist, backend will auto-create, so just show the error
      if (errorMsg.includes('Network') || errorMsg.includes('Failed to fetch')) {
        alert('Cannot connect to server. Please check:\n1. Backend server is running\n2. Network connection is active');
      } else {
        // If request fails, go to register (user might not exist)
        setAuthStep('register');
      }
    }
    setLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.auth.register(name, email, undefined, password || undefined);
      // After registration, request magic link for login
      const response: any = await loginWithMagicLink(email);
      // In development, backend returns the token directly for testing
      if (response?.devToken) {
        setMockToken(response.devToken);
        console.log('Development token received:', response.devToken);
      } else {
        // Fallback: generate a mock token (won't work with real backend)
        const testToken = `mock_token_${Date.now()}_${email}`;
        setMockToken(testToken);
      }
      setAuthStep('magic-link-sent');
    } catch (error: any) {
      console.error('Registration error:', error);
      const errorMsg = error?.message || 'Unknown error';
      if (errorMsg.includes('already exists') || errorMsg.includes('409')) {
        alert('This email is already registered. Please try logging in instead.');
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
    <div className="min-h-screen bg-white font-sans text-slate-900 scroll-smooth">
      {/* Navbar */}
      <nav className="fixed w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center space-x-2 cursor-pointer" onClick={(e) => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <div className="bg-brand-600 p-1.5 rounded-lg">
                <Shield className="text-white w-6 h-6" />
              </div>
              <span className="font-bold text-xl tracking-tight text-slate-900">ComplyEasy AI</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" onClick={(e) => scrollToSection(e, 'features')} className="text-sm font-medium text-slate-600 hover:text-brand-600 cursor-pointer">Features</a>
              <a href="#pricing" onClick={(e) => scrollToSection(e, 'pricing')} className="text-sm font-medium text-slate-600 hover:text-brand-600 cursor-pointer">Pricing</a>
              <a href="#about" onClick={(e) => scrollToSection(e, 'about')} className="text-sm font-medium text-slate-600 hover:text-brand-600 cursor-pointer">About</a>
              <button 
                onClick={() => { setAuthStep('email'); setShowAuthModal(true); }}
                className="bg-brand-600 text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-brand-700 transition-colors shadow-lg shadow-brand-500/20"
              >
                Sign In / SSO
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden relative">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-brand-100 rounded-full blur-3xl opacity-50"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-purple-100 rounded-full blur-3xl opacity-50"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-3xl mx-auto animate-fadeIn">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-brand-50 text-brand-700 text-xs font-semibold uppercase tracking-wide mb-6">
              <Zap size={14} className="mr-1" /> New: aCOS v3.0 - Autonomous Compliance Operating System
            </div>
            <h1 className="text-5xl lg:text-7xl font-bold tracking-tight text-slate-900 mb-8 leading-tight">
              Compliance that <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-purple-600">runs itself.</span>
            </h1>
            <p className="text-xl text-slate-500 mb-10 leading-relaxed">
              Empower your SMB with AI-driven compliance automation. Secure, scalable, and audit-ready for GDPR, SOC 2, and HIPAA in minutes, not months.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
              <button 
                onClick={() => { setAuthStep('email'); setShowAuthModal(true); }}
                className="w-full sm:w-auto px-8 py-4 bg-brand-600 text-white rounded-full font-semibold hover:bg-brand-700 transition-all transform hover:scale-105 shadow-xl shadow-brand-600/20 flex items-center justify-center"
              >
                Start Free Trial <ArrowRight size={20} className="ml-2" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-brand-600 font-bold tracking-wide uppercase text-sm mb-2">Platform Features</h2>
            <h3 className="text-3xl lg:text-4xl font-bold text-slate-900">Everything you need to stay compliant</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              // Core Platform Features
              { 
                icon: Zap, 
                title: 'AI Automation', 
                desc: 'Intelligent agents automatically collect evidence, map controls, and flag risks 24/7 without human intervention.'
              },
              { 
                icon: Lock, 
                title: 'Zero Trust Security', 
                desc: 'Bank-grade encryption, Role-Based Access Control (RBAC), and continuous monitoring built into the core.'
              },
              { 
                icon: Globe, 
                title: 'Global Frameworks', 
                desc: 'Support for SOC 2, GDPR, HIPAA, ISO 27001, and NIST out of the box with one-click cross-mapping.'
              },
              { 
                icon: BarChart, 
                title: 'Real-time Analytics', 
                desc: 'Live dashboards provide instant visibility into your compliance posture, gap analysis, and audit readiness.'
              },
              { 
                icon: Users, 
                title: 'Vendor Management', 
                desc: 'Automate vendor risk assessments (VRM) and track third-party security certifications effortlessly.'
              },
              { 
                icon: Server, 
                title: '100+ Integrations', 
                desc: 'Seamlessly connect with AWS, Google Workspace, GitHub, Jira, Slack, and more to unify your data.'
              },
              // aCOS v3.0 Features
              {
                icon: Target,
                title: 'Autonomous Compliance Operating System (aCOS™)',
                desc: 'Closed-loop control systems with Observe → Predict → Act → Verify → Learn cycles. Autonomous compliance goals, control loops, debt tracking, and change impact analysis.'
              },
              {
                icon: RefreshCw,
                title: 'Agentic AI with Rollback & Blast-Radius',
                desc: 'Safe autonomous execution with blast-radius estimation, automatic rollback on failure, checkpoint creation, and human-in-the-loop approvals.'
              },
              {
                icon: TrendingUp,
                title: 'Temporal Graph Networks (TGN)',
                desc: '6-12 month predictive risk forecasting, compliance trajectory modeling, and early warning system with <10% false positive rate.'
              },
              {
                icon: Layers,
                title: 'Compliance Digital Twin & Simulation',
                desc: 'What-if scenario modeling, Monte Carlo analysis (10k iterations), policy/control failure simulations, and multi-scenario comparisons.'
              },
              {
                icon: FileCheck,
                title: 'Evidence Truth Layer™',
                desc: 'Deepfake detection (image/video/audio), cryptographic attestation, physical IoT attestation, human liveness detection, and overall confidence scoring.'
              },
              {
                icon: Network,
                title: 'Regulatory Intelligence Fabric (RIF)',
                desc: 'Automated regulation ingestion (URL/PDF/text), change detection, conflict resolution, auto-update controls, and feed monitoring with deduplication.'
              },
              {
                icon: AlertTriangle,
                title: 'Red Teaming & Adversarial Simulations',
                desc: 'Automated security testing, social engineering scenarios, data exfiltration simulation, insider threat testing, and compliance gap scanning.'
              },
              {
                icon: Workflow,
                title: 'Federated Swarm Intelligence',
                desc: 'Cross-tenant learning with differential privacy, industry insights, peer benchmarking, federated model management, and secure aggregation.'
              },
              {
                icon: Mic,
                title: 'Multi-modal Intake',
                desc: 'Audio transcription (MP3/WAV/M4A) with >95% accuracy, video analysis, speaker diarization, word-level timestamps, and compliance-relevant content detection.'
              },
              {
                icon: Radio,
                title: 'Physical AI/IoT Integration',
                desc: 'IoT device registration, edge compliance checks (12+ checks), MQTT sensor data processing, device health monitoring, and predictive maintenance.'
              },
              {
                icon: Eye,
                title: 'VR-based Collaborative Review',
                desc: '3D compliance visualization, multi-user VR sessions, real-time collaboration, annotations, training scenarios, and 60+ FPS rendering.'
              },
              {
                icon: Cpu,
                title: 'Swarm-based Task Allocation',
                desc: 'Dynamic multi-agent task distribution, capability matching, load balancing, priority-based allocation, and real-time metrics dashboard.'
              },
              {
                icon: Sparkles,
                title: 'NeuroSymbolic AI',
                desc: 'Hybrid neural-symbolic reasoning combines deep learning with rule-based logic for explainable AI decisions, causal reasoning, automated rule inference, and compliance justification.'
              },
              // Security & Privacy Features
              {
                icon: ShieldCheck,
                title: 'Zero-Knowledge Proofs',
                desc: 'Prove compliance to partners and auditors with cryptographic proofs (zk-SNARKs) without ever revealing your sensitive underlying data.'
              },
              {
                icon: EyeOff,
                title: 'AI Air Gap & Redaction',
                desc: 'Automatic PII redaction layer ensures your sensitive customer data is sanitized before it ever touches an AI model.'
              },
              {
                icon: Key,
                title: 'BYOK Encryption',
                desc: 'Maintain absolute control over your data. Encrypt your compliance database with your own keys managed in AWS KMS or Azure Vault.'
              },
              {
                icon: GitMerge,
                title: 'Compliance-as-Code',
                desc: 'Block non-compliant infrastructure changes at the Pull Request level. Integrate policy checks directly into your CI/CD pipeline.'
              },
              {
                icon: BrainCircuit,
                title: 'Homomorphic AI',
                desc: 'The holy grail of cloud security. Our AI agents analyze risks on encrypted data without ever needing to decrypt it.'
              },
              {
                icon: Timer,
                title: 'JIT Admin Access',
                desc: 'Eliminate dormant admin accounts. Grant temporary, time-bound privileged access that automatically expires after the task is done.'
              }
            ].map((feature, idx) => (
              <div key={idx} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition-all hover:-translate-y-1">
                <div className="w-12 h-12 bg-brand-100 rounded-xl flex items-center justify-center text-brand-600 mb-6">
                  <feature.icon size={24} />
                </div>
                <h4 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h4>
                <p className="text-slate-500 leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-brand-600 font-bold tracking-wide uppercase text-sm mb-2">Simple Pricing</h2>
            <h3 className="text-3xl lg:text-4xl font-bold text-slate-900">Scale your compliance journey</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {PRICING_TIERS.map((tier, idx) => (
              <div key={idx} className={`relative p-8 rounded-2xl border ${tier.recommended ? 'border-brand-500 shadow-2xl scale-105 z-10' : 'border-gray-200 bg-gray-50'}`}>
                {tier.recommended && (
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-brand-600 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                    Most Popular
                  </div>
                )}
                <div className="text-center mb-8">
                  <h4 className="text-xl font-bold text-slate-900 mb-2">{tier.name}</h4>
                  <div className="flex items-baseline justify-center">
                    <span className="text-4xl font-bold text-slate-900">{tier.price}</span>
                    <span className="text-slate-500">{tier.period}</span>
                  </div>
                  <p className="text-sm text-slate-500 mt-2">{tier.target}</p>
                </div>
                <ul className="space-y-4 mb-8">
                  {tier.features.map((feature, fIdx) => (
                    <li key={fIdx} className="flex items-center text-slate-600 text-sm">
                      <CheckCircle size={16} className="text-green-500 mr-3 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <button 
                  onClick={() => { setAuthStep('register'); setShowAuthModal(true); }}
                  className={`w-full py-3 rounded-xl font-bold transition-colors ${
                    tier.recommended 
                      ? 'bg-brand-600 text-white hover:bg-brand-700' 
                      : 'bg-white text-brand-600 border border-brand-200 hover:bg-brand-50'
                  }`}
                >
                  Choose {tier.name}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-24 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-brand-400 font-bold tracking-wide uppercase text-sm mb-2">Our Mission</h2>
              <h3 className="text-3xl lg:text-4xl font-bold mb-6">Making compliance accessible to everyone.</h3>
              <p className="text-slate-400 text-lg leading-relaxed mb-6">
                Founded by security experts and AI engineers, ComplyEasy AI aims to democratize access to enterprise-grade compliance tools. 
                We believe that every company, regardless of size, deserves secure and compliant operations without the crushing overhead of manual audits.
              </p>
              <div className="grid grid-cols-2 gap-8 mt-8">
                <div>
                  <div className="text-4xl font-bold text-white mb-2">95%</div>
                  <div className="text-sm text-slate-400">Time Saved on Audits</div>
                </div>
                <div>
                  <div className="text-4xl font-bold text-white mb-2">24/7</div>
                  <div className="text-sm text-slate-400">Automated Monitoring</div>
                </div>
                <div>
                  <div className="text-4xl font-bold text-white mb-2">500+</div>
                  <div className="text-sm text-slate-400">SMBs Trusted Us</div>
                </div>
                <div>
                  <div className="text-4xl font-bold text-white mb-2">100%</div>
                  <div className="text-sm text-slate-400">Audit Success Rate</div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-brand-500 rounded-full blur-[100px] opacity-20"></div>
              <div className="relative bg-slate-800 border border-slate-700 p-8 rounded-2xl shadow-2xl">
                 <div className="flex items-center space-x-4 mb-6">
                    <div className="w-12 h-12 bg-slate-700 rounded-full"></div>
                    <div>
                       <div className="h-4 w-32 bg-slate-700 rounded mb-2"></div>
                       <div className="h-3 w-20 bg-slate-700 rounded"></div>
                    </div>
                 </div>
                 <div className="space-y-3">
                    <div className="h-3 w-full bg-slate-700 rounded"></div>
                    <div className="h-3 w-5/6 bg-slate-700 rounded"></div>
                    <div className="h-3 w-4/6 bg-slate-700 rounded"></div>
                 </div>
                 <div className="mt-8 pt-6 border-t border-slate-700 flex justify-between items-center">
                    <div className="text-sm text-slate-400">Security Score</div>
                    <div className="text-2xl font-bold text-green-400">98/100</div>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="bg-brand-600 p-1.5 rounded-lg">
                <Shield className="text-white w-5 h-5" />
              </div>
              <span className="font-bold text-lg tracking-tight text-slate-900">ComplyEasy AI</span>
            </div>
            <div className="flex space-x-8 text-sm text-slate-500">
              <a href="#" className="hover:text-brand-600 transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-brand-600 transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-brand-600 transition-colors">Contact Support</a>
            </div>
            <div className="mt-4 md:mt-0 text-sm text-slate-400">
              © 2024 ComplyEasy AI Inc. All rights reserved.
            </div>
          </div>
        </div>
      </footer>

      {/* Auth Modal (Magic Link / SSO) */}
      {showAuthModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden transform transition-all scale-100 relative">
            <button onClick={() => setShowAuthModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                <X size={24} />
            </button>
            
            <div className="p-8 text-center">
               <div className="w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  {authStep === 'magic-link-sent' ? <Mail className="text-brand-600" size={32}/> : <Shield className="text-brand-600" size={32}/>}
               </div>

               {authStep === 'email' && (
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back</h3>
                    <p className="text-gray-500 mb-4">Sign in to your account</p>
                    
                    {/* Login Method Toggle */}
                    <div className="flex space-x-2 mb-4 p-1 bg-gray-100 rounded-lg">
                      <button
                        type="button"
                        onClick={() => setLoginMethod('magic-link')}
                        className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
                          loginMethod === 'magic-link'
                            ? 'bg-white text-brand-600 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
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
                            : 'text-gray-600 hover:text-gray-900'
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
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                          />
                          <button 
                            disabled={loading}
                            className="w-full bg-brand-600 text-white py-3 rounded-xl font-bold hover:bg-brand-700 transition-colors flex justify-center items-center"
                          >
                             {loading ? <Loader2 className="animate-spin" /> : 'Send Magic Link'}
                          </button>
                        </div>
                        <p className="mt-4 text-xs text-gray-400">Secure passwordless authentication</p>
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
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                          />
                          <input 
                            required
                            type="password" 
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="Password"
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                          />
                          <button 
                            disabled={loading}
                            className="w-full bg-brand-600 text-white py-3 rounded-xl font-bold hover:bg-brand-700 transition-colors flex justify-center items-center"
                          >
                             {loading ? <Loader2 className="animate-spin" /> : 'Sign In'}
                          </button>
                        </div>
                        <p className="mt-4 text-xs text-gray-400">
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
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Check your email</h3>
                    <p className="text-gray-500 mb-6">We sent a magic link to <span className="font-bold text-gray-800">{email}</span>.</p>
                    <button 
                       onClick={simulateMagicClick}
                       className="text-brand-600 font-bold hover:underline text-sm"
                    >
                       (Simulate Clicking Link from Email)
                    </button>
                  </div>
               )}

               {authStep === 'register' && (
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    setLoading(true);
                    try {
                      await register(name, email);
                      // After registration, request magic link for login
                      const response: any = await loginWithMagicLink(email);
                      if (response?.devToken) {
                        setMockToken(response.devToken);
                      }
                      setAuthStep('magic-link-sent');
                    } catch (error: any) {
                      console.error('Registration error:', error);
                      alert(error.message || 'Registration failed. Please try again.');
                    } finally {
                      setLoading(false);
                    }
                  }}>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Create Account</h3>
                    <p className="text-gray-500 mb-6">Looks like you're new here!</p>
                    
                    <div className="space-y-4">
                      <input 
                        required
                        type="email" 
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="name@company.com"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                      />
                      <input 
                        required
                        type="text" 
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="Full Name"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                      />
                      <input 
                        type="password" 
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="Password (optional - can set later)"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                      />
                      <button 
                        disabled={loading}
                        className="w-full bg-brand-600 text-white py-3 rounded-xl font-bold hover:bg-brand-700 transition-colors flex justify-center items-center"
                      >
                         {loading ? <Loader2 className="animate-spin" /> : 'Create Account'}
                      </button>
                    </div>
                    <p className="mt-4 text-xs text-gray-400">
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
