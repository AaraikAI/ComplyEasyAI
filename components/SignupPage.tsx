import React, { useState } from 'react';
import {
  Shield, CheckCircle, ArrowRight, Eye, EyeOff, Loader2, Mail,
  Building2, Users, Target, Lock, Zap, Globe, Check, X,
  Briefcase, GraduationCap, Heart, Landmark, Factory, ShoppingCart,
  Plane, Building, CreditCard, Star
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';

interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  organizationName: string;
  industry: string;
  companySize: string;
  primaryGoal: string;
  acceptTerms: boolean;
  acceptMarketing: boolean;
}

const industries = [
  { value: 'fintech', label: 'FinTech', icon: CreditCard },
  { value: 'healthtech', label: 'HealthTech', icon: Heart },
  { value: 'saas', label: 'SaaS / Software', icon: Building2 },
  { value: 'ai-ml', label: 'AI / Machine Learning', icon: Zap },
  { value: 'ecommerce', label: 'E-Commerce', icon: ShoppingCart },
  { value: 'government', label: 'Government', icon: Landmark },
  { value: 'education', label: 'Education', icon: GraduationCap },
  { value: 'manufacturing', label: 'Manufacturing', icon: Factory },
  { value: 'travel', label: 'Travel & Hospitality', icon: Plane },
  { value: 'professional', label: 'Professional Services', icon: Briefcase },
  { value: 'other', label: 'Other', icon: Building },
];

const companySizes = [
  { value: '1-10', label: '1-10 employees', description: 'Startup' },
  { value: '11-50', label: '11-50 employees', description: 'Small Business' },
  { value: '51-200', label: '51-200 employees', description: 'Growing Company' },
  { value: '201-500', label: '201-500 employees', description: 'Mid-Market' },
  { value: '501-1000', label: '501-1,000 employees', description: 'Enterprise' },
  { value: '1000+', label: '1,000+ employees', description: 'Large Enterprise' },
];

const primaryGoals = [
  { value: 'soc2', label: 'SOC 2 Certification', frameworks: ['SOC 2 Type I', 'SOC 2 Type II'] },
  { value: 'iso27001', label: 'ISO 27001 Certification', frameworks: ['ISO 27001', 'ISO 27002'] },
  { value: 'hipaa', label: 'HIPAA Compliance', frameworks: ['HIPAA', 'HITECH'] },
  { value: 'gdpr', label: 'GDPR Compliance', frameworks: ['GDPR', 'CCPA'] },
  { value: 'pci', label: 'PCI DSS Compliance', frameworks: ['PCI DSS v4.0'] },
  { value: 'eu-ai-act', label: 'EU AI Act Compliance', frameworks: ['EU AI Act', 'NIST AI RMF'] },
  { value: 'multiple', label: 'Multiple Frameworks', frameworks: ['Various'] },
  { value: 'explore', label: 'Just Exploring', frameworks: [] },
];

const features = [
  { icon: Shield, text: 'SOC 2, ISO 27001, HIPAA & 50+ frameworks' },
  { icon: Zap, text: 'AI-powered evidence collection' },
  { icon: Users, text: 'Up to 10 users on free trial' },
  { icon: Lock, text: 'Enterprise-grade security' },
  { icon: Globe, text: 'No credit card required' },
];

export const SignupPage: React.FC = () => {
  const { register } = useAuth();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verificationSent, setVerificationSent] = useState(false);
  
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    organizationName: '',
    industry: '',
    companySize: '',
    primaryGoal: '',
    acceptTerms: false,
    acceptMarketing: false,
  });

  const updateField = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const validatePassword = (password: string) => {
    const checks = {
      length: password.length >= 12,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };
    return checks;
  };

  const passwordChecks = validatePassword(formData.password);
  const isPasswordValid = Object.values(passwordChecks).every(Boolean);

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email) {
      setError('Please enter your email address');
      return;
    }
    if (!formData.password) {
      setError('Please enter a password');
      return;
    }
    if (!isPasswordValid) {
      setError('Please meet all password requirements');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setStep(2);
  };

  const handleStep2Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName) {
      setError('Please enter your full name');
      return;
    }
    if (!formData.organizationName) {
      setError('Please enter your organization name');
      return;
    }
    setStep(3);
  };

  const handleStep3Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.industry) {
      setError('Please select your industry');
      return;
    }
    if (!formData.companySize) {
      setError('Please select your company size');
      return;
    }
    if (!formData.primaryGoal) {
      setError('Please select your primary compliance goal');
      return;
    }
    setStep(4);
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.acceptTerms) {
      setError('Please accept the terms of service and privacy policy');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      await api.auth.register(
        formData.fullName,
        formData.email,
        formData.organizationName,
        formData.password,
        formData.industry,
        formData.companySize,
        formData.primaryGoal,
        undefined // howDidYouHear - can be added later if needed
      );
      
      setVerificationSent(true);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (verificationSent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Mail className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Check Your Email!</h1>
          <p className="text-gray-600 mb-6">
            We've sent a verification link to <span className="font-semibold text-gray-900">{formData.email}</span>.
            Click the link in the email to activate your account and start your free trial.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-left mb-6">
            <h3 className="font-semibold text-blue-900 mb-2">What's next?</h3>
            <ul className="text-sm text-blue-800 space-y-2">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Click the verification link in your email</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Complete the onboarding wizard (5 minutes)</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Set up your first compliance framework</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Connect integrations for automated evidence</span>
              </li>
            </ul>
          </div>
          <p className="text-sm text-gray-500">
            Didn't receive the email?{' '}
            <button className="text-brand-600 font-medium hover:underline">
              Resend verification email
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <a href="/" className="flex items-center space-x-2">
              <div className="bg-brand-600 p-2 rounded-xl">
                <Shield className="text-white w-6 h-6" />
              </div>
              <span className="font-bold text-xl text-white">ComplyEasy AI</span>
            </a>
            <div className="flex items-center space-x-4">
              <span className="text-slate-400 text-sm hidden sm:block">Already have an account?</span>
              <a 
                href="/" 
                className="text-brand-400 font-medium hover:text-brand-300 transition-colors"
              >
                Sign In
              </a>
            </div>
          </div>
        </div>
      </header>

      <div className="flex min-h-screen">
        {/* Left Side - Form */}
        <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 pt-24 pb-12">
          <div className="w-full max-w-lg">
            {/* Progress Indicator */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                {[1, 2, 3, 4].map((s) => (
                  <div key={s} className="flex items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                      s < step ? 'bg-green-500 text-white' :
                      s === step ? 'bg-brand-600 text-white' :
                      'bg-slate-700 text-slate-400'
                    }`}>
                      {s < step ? <Check className="w-5 h-5" /> : s}
                    </div>
                    {s < 4 && (
                      <div className={`w-12 sm:w-20 h-1 mx-2 rounded transition-all ${
                        s < step ? 'bg-green-500' : 'bg-slate-700'
                      }`} />
                    )}
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-xs text-slate-400">
                <span>Account</span>
                <span>Profile</span>
                <span>Company</span>
                <span>Confirm</span>
              </div>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-2xl p-8">
              {/* Step 1: Account Credentials */}
              {step === 1 && (
                <form onSubmit={handleStep1Submit}>
                  <h2 className="text-2xl font-bold text-white mb-2">Create Your Account</h2>
                  <p className="text-slate-400 mb-6">Start your 3-day free trial. No credit card required.</p>

                  {error && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6 flex items-center gap-3 text-red-400">
                      <X className="w-5 h-5 flex-shrink-0" />
                      <span className="text-sm">{error}</span>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Work Email
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => updateField('email', e.target.value)}
                        placeholder="you@company.com"
                        className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={formData.password}
                          onChange={(e) => updateField('password', e.target.value)}
                          placeholder="Create a strong password"
                          className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all pr-12"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      
                      {/* Password Requirements */}
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        {[
                          { key: 'length', label: '12+ characters' },
                          { key: 'uppercase', label: 'Uppercase letter' },
                          { key: 'lowercase', label: 'Lowercase letter' },
                          { key: 'number', label: 'Number' },
                          { key: 'special', label: 'Special character' },
                        ].map((req) => (
                          <div 
                            key={req.key}
                            className={`flex items-center gap-2 text-xs ${
                              passwordChecks[req.key as keyof typeof passwordChecks] 
                                ? 'text-green-400' 
                                : 'text-slate-500'
                            }`}
                          >
                            {passwordChecks[req.key as keyof typeof passwordChecks] ? (
                              <CheckCircle className="w-3.5 h-3.5" />
                            ) : (
                              <div className="w-3.5 h-3.5 rounded-full border border-slate-600" />
                            )}
                            {req.label}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Confirm Password
                      </label>
                      <input
                        type="password"
                        value={formData.confirmPassword}
                        onChange={(e) => updateField('confirmPassword', e.target.value)}
                        placeholder="Confirm your password"
                        className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
                        required
                      />
                      {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                        <p className="mt-2 text-xs text-red-400">Passwords do not match</p>
                      )}
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full mt-6 bg-brand-600 hover:bg-brand-700 text-white py-3 px-6 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all"
                  >
                    Continue
                    <ArrowRight className="w-5 h-5" />
                  </button>

                  <div className="mt-6 pt-6 border-t border-slate-700">
                    <p className="text-xs text-slate-400 text-center">
                      By signing up, you agree to our{' '}
                      <a href="/terms" className="text-brand-400 hover:underline">Terms of Service</a>
                      {' '}and{' '}
                      <a href="/privacy" className="text-brand-400 hover:underline">Privacy Policy</a>
                    </p>
                  </div>
                </form>
              )}

              {/* Step 2: Personal Info */}
              {step === 2 && (
                <form onSubmit={handleStep2Submit}>
                  <h2 className="text-2xl font-bold text-white mb-2">Tell Us About Yourself</h2>
                  <p className="text-slate-400 mb-6">Help us personalize your experience.</p>

                  {error && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6 flex items-center gap-3 text-red-400">
                      <X className="w-5 h-5 flex-shrink-0" />
                      <span className="text-sm">{error}</span>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={formData.fullName}
                        onChange={(e) => updateField('fullName', e.target.value)}
                        placeholder="John Smith"
                        className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Organization Name
                      </label>
                      <input
                        type="text"
                        value={formData.organizationName}
                        onChange={(e) => updateField('organizationName', e.target.value)}
                        placeholder="Acme Inc."
                        className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="flex-1 border border-slate-600 text-slate-300 py-3 px-6 rounded-xl font-semibold hover:bg-slate-700/50 transition-all"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-brand-600 hover:bg-brand-700 text-white py-3 px-6 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all"
                    >
                      Continue
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>
                </form>
              )}

              {/* Step 3: Company Details */}
              {step === 3 && (
                <form onSubmit={handleStep3Submit}>
                  <h2 className="text-2xl font-bold text-white mb-2">About Your Organization</h2>
                  <p className="text-slate-400 mb-6">Help us recommend the right frameworks.</p>

                  {error && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6 flex items-center gap-3 text-red-400">
                      <X className="w-5 h-5 flex-shrink-0" />
                      <span className="text-sm">{error}</span>
                    </div>
                  )}

                  <div className="space-y-6">
                    {/* Industry Selection */}
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-3">
                        Industry
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {industries.map((ind) => {
                          const Icon = ind.icon;
                          return (
                            <button
                              key={ind.value}
                              type="button"
                              onClick={() => updateField('industry', ind.value)}
                              className={`p-3 rounded-xl border transition-all text-center ${
                                formData.industry === ind.value
                                  ? 'border-brand-500 bg-brand-500/10 text-brand-400'
                                  : 'border-slate-600 text-slate-400 hover:border-slate-500'
                              }`}
                            >
                              <Icon className="w-5 h-5 mx-auto mb-1" />
                              <span className="text-xs">{ind.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Company Size */}
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-3">
                        Company Size
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {companySizes.map((size) => (
                          <button
                            key={size.value}
                            type="button"
                            onClick={() => updateField('companySize', size.value)}
                            className={`p-3 rounded-xl border transition-all text-left ${
                              formData.companySize === size.value
                                ? 'border-brand-500 bg-brand-500/10'
                                : 'border-slate-600 hover:border-slate-500'
                            }`}
                          >
                            <div className={`font-medium ${formData.companySize === size.value ? 'text-brand-400' : 'text-white'}`}>
                              {size.label}
                            </div>
                            <div className="text-xs text-slate-500">{size.description}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Primary Goal */}
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-3">
                        Primary Compliance Goal
                      </label>
                      <div className="space-y-2">
                        {primaryGoals.map((goal) => (
                          <button
                            key={goal.value}
                            type="button"
                            onClick={() => updateField('primaryGoal', goal.value)}
                            className={`w-full p-4 rounded-xl border transition-all text-left flex items-center justify-between ${
                              formData.primaryGoal === goal.value
                                ? 'border-brand-500 bg-brand-500/10'
                                : 'border-slate-600 hover:border-slate-500'
                            }`}
                          >
                            <div>
                              <div className={`font-medium ${formData.primaryGoal === goal.value ? 'text-brand-400' : 'text-white'}`}>
                                {goal.label}
                              </div>
                              {goal.frameworks.length > 0 && (
                                <div className="text-xs text-slate-500 mt-1">
                                  {goal.frameworks.join(', ')}
                                </div>
                              )}
                            </div>
                            {formData.primaryGoal === goal.value && (
                              <CheckCircle className="w-5 h-5 text-brand-400" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="flex-1 border border-slate-600 text-slate-300 py-3 px-6 rounded-xl font-semibold hover:bg-slate-700/50 transition-all"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-brand-600 hover:bg-brand-700 text-white py-3 px-6 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all"
                    >
                      Continue
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>
                </form>
              )}

              {/* Step 4: Review & Confirm */}
              {step === 4 && (
                <form onSubmit={handleFinalSubmit}>
                  <h2 className="text-2xl font-bold text-white mb-2">Review & Start Trial</h2>
                  <p className="text-slate-400 mb-6">Confirm your details and start your free trial.</p>

                  {error && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6 flex items-center gap-3 text-red-400">
                      <X className="w-5 h-5 flex-shrink-0" />
                      <span className="text-sm">{error}</span>
                    </div>
                  )}

                  {/* Summary */}
                  <div className="bg-slate-900/50 rounded-xl p-4 mb-6 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Email</span>
                      <span className="text-white">{formData.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Name</span>
                      <span className="text-white">{formData.fullName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Organization</span>
                      <span className="text-white">{formData.organizationName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Industry</span>
                      <span className="text-white">{industries.find(i => i.value === formData.industry)?.label}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Company Size</span>
                      <span className="text-white">{companySizes.find(s => s.value === formData.companySize)?.label}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Primary Goal</span>
                      <span className="text-white">{primaryGoals.find(g => g.value === formData.primaryGoal)?.label}</span>
                    </div>
                  </div>

                  {/* Trial Details */}
                  <div className="bg-gradient-to-r from-brand-600/20 to-purple-600/20 rounded-xl p-4 mb-6 border border-brand-500/30">
                    <div className="flex items-center gap-3 mb-3">
                      <Star className="w-6 h-6 text-yellow-400" />
                      <span className="font-semibold text-white">3-Day Free Trial</span>
                    </div>
                    <ul className="text-sm text-slate-300 space-y-2">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        Full access to Foundation tier features
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        Up to 3 compliance frameworks
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        Up to 10 team members
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        No credit card required
                      </li>
                    </ul>
                  </div>

                  {/* Agreements */}
                  <div className="space-y-3 mb-6">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.acceptTerms}
                        onChange={(e) => updateField('acceptTerms', e.target.checked)}
                        className="mt-1 w-5 h-5 rounded border-slate-600 bg-slate-900/50 text-brand-600 focus:ring-brand-500"
                      />
                      <span className="text-sm text-slate-300">
                        I agree to the{' '}
                        <a href="/terms" className="text-brand-400 hover:underline">Terms of Service</a>
                        {' '}and{' '}
                        <a href="/privacy" className="text-brand-400 hover:underline">Privacy Policy</a>
                        {' '}*
                      </span>
                    </label>
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.acceptMarketing}
                        onChange={(e) => updateField('acceptMarketing', e.target.checked)}
                        className="mt-1 w-5 h-5 rounded border-slate-600 bg-slate-900/50 text-brand-600 focus:ring-brand-500"
                      />
                      <span className="text-sm text-slate-300">
                        Send me product updates, compliance tips, and special offers (optional)
                      </span>
                    </label>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setStep(3)}
                      className="flex-1 border border-slate-600 text-slate-300 py-3 px-6 rounded-xl font-semibold hover:bg-slate-700/50 transition-all"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={loading || !formData.acceptTerms}
                      className="flex-1 bg-brand-600 hover:bg-brand-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white py-3 px-6 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all"
                    >
                      {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          Start Free Trial
                          <ArrowRight className="w-5 h-5" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Right Side - Features */}
        <div className="hidden lg:flex flex-1 items-center justify-center bg-gradient-to-br from-brand-600 to-purple-700 p-12">
          <div className="max-w-md text-white">
            <h2 className="text-3xl font-bold mb-6">Start Your Compliance Journey</h2>
            <p className="text-brand-100 mb-8 text-lg">
              Join 500+ organizations using ComplyEasyAI to achieve compliance faster, 
              automate evidence collection, and reduce audit preparation time by 95%.
            </p>
            
            <div className="space-y-4">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div key={index} className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-lg">{feature.text}</span>
                  </div>
                );
              })}
            </div>

            {/* Testimonial */}
            <div className="mt-12 bg-white/10 backdrop-blur rounded-2xl p-6">
              <p className="text-brand-100 italic mb-4">
                "ComplyEasyAI helped us achieve SOC 2 Type II in just 45 days. 
                The AI-powered evidence collection saved us hundreds of hours."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center font-bold">
                  JD
                </div>
                <div>
                  <div className="font-semibold">Jane Doe</div>
                  <div className="text-sm text-brand-200">CTO, TechStartup Inc.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
