import React, { useState } from 'react';
import { ArrowRight, CheckCircle, Lock, Shield, Zap, Globe, X, User } from 'lucide-react';
import { PRICING_TIERS, MOCK_USERS } from '../constants';
import { User as UserType } from '../types';

interface LandingProps {
  onLogin: (user: UserType) => void;
}

export const LandingPage: React.FC<LandingProps> = ({ onLogin }) => {
  const [showLoginModal, setShowLoginModal] = useState(false);

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 scroll-smooth">
      {/* Navbar */}
      <nav className="fixed w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center space-x-2">
              <div className="bg-brand-600 p-1.5 rounded-lg">
                <Shield className="text-white w-6 h-6" />
              </div>
              <span className="font-bold text-xl tracking-tight text-slate-900">ComplyEasy AI</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-sm font-medium text-slate-600 hover:text-brand-600">Features</a>
              <a href="#pricing" className="text-sm font-medium text-slate-600 hover:text-brand-600">Pricing</a>
              <a href="#about" className="text-sm font-medium text-slate-600 hover:text-brand-600">About</a>
              <button 
                onClick={() => setShowLoginModal(true)}
                className="bg-brand-600 text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-brand-700 transition-colors shadow-lg shadow-brand-500/20"
              >
                Sign In
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
              <Zap size={14} className="mr-1" /> New: AI Agentic Workflows
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
                onClick={() => setShowLoginModal(true)}
                className="w-full sm:w-auto px-8 py-4 bg-brand-600 text-white rounded-full font-semibold hover:bg-brand-700 transition-all transform hover:scale-105 shadow-xl shadow-brand-600/20 flex items-center justify-center"
              >
                Start Free Trial <ArrowRight size={20} className="ml-2" />
              </button>
              <button className="w-full sm:w-auto px-8 py-4 bg-white text-slate-700 border border-gray-200 rounded-full font-semibold hover:bg-gray-50 transition-colors">
                Book Demo
              </button>
            </div>
            <p className="mt-6 text-sm text-slate-400">Trusted by 500+ security-first companies.</p>
          </div>
        </div>
      </section>

       {/* Stats/Social Proof */}
      <section id="about" className="bg-slate-50 py-12 border-y border-gray-200 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                <div>
                    <h3 className="text-4xl font-bold text-slate-900">80%</h3>
                    <p className="text-slate-500 mt-1">Time Saved</p>
                </div>
                <div>
                    <h3 className="text-4xl font-bold text-slate-900">20+</h3>
                    <p className="text-slate-500 mt-1">Frameworks</p>
                </div>
                 <div>
                    <h3 className="text-4xl font-bold text-slate-900">$50</h3>
                    <p className="text-slate-500 mt-1">Starting Price</p>
                </div>
                 <div>
                    <h3 className="text-4xl font-bold text-slate-900">100%</h3>
                    <p className="text-slate-500 mt-1">Audit Ready</p>
                </div>
            </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-white scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900">Everything you need to stay compliant</h2>
            <p className="text-slate-500 mt-4 max-w-2xl mx-auto">From automated evidence collection to AI-generated reports, we handle the boring stuff so you can focus on growth.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              {
                icon: <Globe className="w-8 h-8 text-brand-600" />,
                title: 'Global Standards',
                desc: 'Support for GDPR, CCPA, ISO 27001, and more with region-specific data sovereignty features.'
              },
              {
                icon: <Zap className="w-8 h-8 text-purple-600" />,
                title: 'AI Agents',
                desc: 'Autonomous agents handle regulatory tracking and anomaly detection 24/7.'
              },
              {
                icon: <Lock className="w-8 h-8 text-green-600" />,
                title: 'Zero Trust Security',
                desc: 'Built-in security with zero-trust architecture and explainable AI for complete transparency.'
              }
            ].map((feature, idx) => (
              <div key={idx} className="bg-slate-50 p-8 rounded-2xl hover:shadow-lg transition-shadow border border-slate-100">
                <div className="bg-white w-14 h-14 rounded-xl flex items-center justify-center shadow-sm mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                <p className="text-slate-500 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-slate-900 text-white scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold">Transparent Pricing</h2>
            <p className="text-slate-400 mt-4">Simple plans for teams of all sizes.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {PRICING_TIERS.map((tier, idx) => (
              <div 
                key={idx} 
                className={`relative p-8 rounded-2xl border ${tier.recommended ? 'bg-slate-800 border-brand-500 shadow-2xl shadow-brand-900/50' : 'bg-slate-900 border-slate-700'}`}
              >
                {tier.recommended && (
                  <div className="absolute top-0 right-0 bg-brand-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg">
                    RECOMMENDED
                  </div>
                )}
                <h3 className="text-xl font-bold mb-2">{tier.name}</h3>
                <div className="flex items-baseline mb-6">
                  <span className="text-4xl font-bold">{tier.price}</span>
                  <span className="text-slate-400 ml-2">{tier.period}</span>
                </div>
                <p className="text-sm text-slate-400 mb-6">{tier.target}</p>
                <ul className="space-y-4 mb-8">
                  {tier.features.map((feat, fIdx) => (
                    <li key={fIdx} className="flex items-start text-sm text-slate-300">
                      <CheckCircle size={16} className="text-brand-400 mr-2 mt-0.5 flex-shrink-0" />
                      {feat}
                    </li>
                  ))}
                </ul>
                <button 
                  onClick={() => setShowLoginModal(true)}
                  className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                    tier.recommended ? 'bg-brand-500 hover:bg-brand-600 text-white' : 'bg-slate-700 hover:bg-slate-600 text-white'
                  }`}
                >
                  Choose {tier.name}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white py-12 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 text-center text-slate-500 text-sm">
          <p>&copy; 2024 ComplyEasy AI. All rights reserved.</p>
        </div>
      </footer>

      {/* Simulated Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden transform transition-all scale-100">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">Select Demo Persona</h3>
              <button onClick={() => setShowLoginModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-500 mb-4">Choose a role to explore the platform:</p>
              {MOCK_USERS.map((user) => (
                <button
                  key={user.id}
                  onClick={() => onLogin(user)}
                  className="w-full flex items-center p-4 rounded-xl border border-gray-200 hover:border-brand-500 hover:bg-brand-50 transition-all group"
                >
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-lg font-bold text-gray-600 group-hover:bg-brand-200 group-hover:text-brand-700">
                    {user.avatar}
                  </div>
                  <div className="ml-4 text-left">
                    <p className="font-bold text-gray-900 group-hover:text-brand-700">{user.name}</p>
                    <p className="text-xs text-gray-500 uppercase tracking-wider">{user.role}</p>
                  </div>
                  <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                     <ArrowRight className="text-brand-600" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};