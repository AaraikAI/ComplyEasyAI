import React, { useState } from 'react';
import { Link } from 'react-router';
import {
  ArrowRight, CheckCircle, Loader2, Eye, EyeOff, Check,
  Briefcase, GraduationCap, Heart, Landmark, Factory, ShoppingCart,
  Plane, Building, Building2, CreditCard, Zap,
} from 'lucide-react';
import { api } from '../services/api';
import { SignalPage, SignalLogo, OutlineCta } from './marketing/signal';

// ---------------------------------------------------------------------------
// Signal signup: split screen — value panel left, guided registration right.
// The registration flow (4 steps → api.auth.register → magic-link verification
// email → "Check your inbox") is unchanged; only the presentation is new.
// ---------------------------------------------------------------------------

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

// Left value panel — copy from the Signal design handoff.
const benefits = [
  { title: 'Free trial, no credit card', desc: 'Connect a system and see controls populate in minutes.' },
  { title: '14 frameworks, one platform', desc: 'SOC 2, ISO 27001, GDPR, EU AI Act and more.' },
  { title: 'Audit-ready from day one', desc: 'Continuous evidence, not a final-quarter scramble.' },
];

const stepLabels = ['Account', 'Profile', 'Company', 'Confirm'] as const;

const inputClass =
  'w-full rounded-xl border border-white/[0.12] bg-white/[0.04] px-4 py-3 text-[15px] text-signal-ink placeholder:text-signal-muted outline-none transition-colors focus:border-signal-green/60';

const labelClass = 'mb-2 block text-[13px] font-semibold text-signal-body';

const primaryButtonClass =
  'flex items-center justify-center gap-2 rounded-xl bg-signal-green px-4 py-3.5 text-[15px] font-bold text-signal-canvas transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60';

const backButtonClass =
  'flex-1 rounded-xl border border-white/[0.16] px-4 py-3 text-[14px] font-semibold text-signal-sub transition-colors hover:border-white/[0.28] hover:text-signal-ink';

export const SignupPage: React.FC = () => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verificationSent, setVerificationSent] = useState(false);
  const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [resendMessage, setResendMessage] = useState<string | null>(null);

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
    acceptMarketing: true,
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

  const handleResendVerification = async () => {
    if (!formData.email || resendStatus === 'sending') return;
    setResendStatus('sending');
    setResendMessage(null);
    try {
      // Registration issues a magic verification link; re-request it to resend.
      await api.auth.requestMagicLink(formData.email);
      setResendStatus('sent');
      setResendMessage('Verification email resent. Please check your inbox.');
    } catch (err: any) {
      setResendStatus('error');
      setResendMessage(err?.message || 'Could not resend the email. Please try again shortly.');
    }
  };

  const errorBlock = error && (
    <p className="mb-4 rounded-xl border border-signal-bad/30 bg-signal-bad/10 px-4 py-3 text-[13px] text-signal-bad">
      {error}
    </p>
  );

  return (
    <SignalPage>
      <div className="grid min-h-screen lg:grid-cols-2">
        {/* ===================== Left — value panel ===================== */}
        <div className="relative flex flex-col justify-between gap-10 overflow-hidden bg-[radial-gradient(700px_500px_at_30%_20%,rgba(56,232,166,.16),transparent_60%),linear-gradient(160deg,#0A0E15,#07090D)] p-8 md:p-12">
          <Link to="/" aria-label="ComplyEasyAI home">
            <SignalLogo />
          </Link>

          <div>
            <h2 className="max-w-[420px] font-display text-[30px] font-bold leading-[1.1] tracking-[-0.02em] text-signal-ink md:text-[34px]">
              Compliance that runs itself starts here.
            </h2>
            <div className="mt-8 flex flex-col gap-4">
              {benefits.map((b) => (
                <div key={b.title} className="flex items-start gap-3">
                  <Check size={16} className="mt-0.5 flex-none text-signal-green" aria-hidden="true" />
                  <div>
                    <div className="text-[15px] font-semibold text-signal-ink">{b.title}</div>
                    <div className="text-[13.5px] text-signal-sub">{b.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="font-mono text-[11px] tracking-[0.1em] text-signal-muted">
            SOC 2 · ISO 27001 · GDPR · HIPAA · EU AI Act · DORA
          </div>
        </div>

        {/* ===================== Right — signup form ===================== */}
        <div className="flex items-center justify-center p-8 md:p-12">
          <div className="w-full max-w-[440px]">
            {verificationSent ? (
              <div className="text-center">
                <div className="mx-auto mb-[22px] flex h-16 w-16 items-center justify-center rounded-full bg-signal-green/[0.14]">
                  <span className="text-[28px] text-signal-green" aria-hidden="true">
                    ✦
                  </span>
                </div>
                <h1 className="font-display text-[28px] font-bold tracking-[-0.02em] text-signal-ink">
                  Check your inbox
                </h1>
                <p className="mt-3.5 text-[15px] leading-relaxed text-signal-sub">
                  We sent a secure sign-in link to{' '}
                  <strong className="font-semibold text-signal-ink">{formData.email}</strong>. Click it to
                  finish creating your workspace — no password needed.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setVerificationSent(false);
                    setStep(1);
                    setResendStatus('idle');
                    setResendMessage(null);
                  }}
                  className="mx-auto mt-[26px] inline-flex items-center justify-center rounded-[11px] border border-white/20 px-5 py-3 text-sm font-medium text-signal-ink transition-colors hover:border-white/[0.32] hover:bg-white/[0.04]"
                >
                  Use a different email
                </button>
                <p className="mt-5 text-[12.5px] text-signal-muted">
                  Didn&rsquo;t get it? Check spam, or{' '}
                  <button
                    type="button"
                    onClick={handleResendVerification}
                    disabled={resendStatus === 'sending'}
                    className="text-signal-green hover:opacity-85 disabled:opacity-50"
                  >
                    {resendStatus === 'sending' ? 'resending…' : 'resend'}
                  </button>
                  .
                </p>
                {resendMessage && (
                  <p
                    className={`mt-2 text-[12.5px] ${
                      resendStatus === 'error' ? 'text-signal-bad' : 'text-signal-green'
                    }`}
                  >
                    {resendMessage}
                  </p>
                )}
              </div>
            ) : (
              <div>
                <h1 className="font-display text-[30px] font-bold tracking-[-0.02em] text-signal-ink">
                  Start free
                </h1>
                <p className="mt-2.5 text-[15px] text-signal-sub">
                  Enter your work email and we&rsquo;ll send a magic link to get you in.
                </p>

                {/* Step indicator */}
                <div className="mt-7">
                  <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-signal-green">
                    Step {step} of 4 — {stepLabels[step - 1]}
                  </span>
                  <div className="mt-2.5 flex gap-1.5" aria-hidden="true">
                    {[1, 2, 3, 4].map((s) => (
                      <div
                        key={s}
                        className={`h-1 flex-1 rounded-full ${s <= step ? 'bg-signal-green' : 'bg-white/10'}`}
                      />
                    ))}
                  </div>
                </div>

                <div className="mt-6">
                  {/* ---------------- Step 1: Account ---------------- */}
                  {step === 1 && (
                    <form onSubmit={handleStep1Submit} noValidate>
                      {errorBlock}
                      <div className="space-y-4">
                        <div>
                          <label htmlFor="signup-email" className={labelClass}>
                            Work email
                          </label>
                          <input
                            id="signup-email"
                            type="email"
                            autoComplete="email"
                            value={formData.email}
                            onChange={(e) => updateField('email', e.target.value)}
                            placeholder="you@company.com"
                            className={inputClass}
                          />
                        </div>
                        <div>
                          <label htmlFor="signup-password" className={labelClass}>
                            Password
                          </label>
                          <div className="relative">
                            <input
                              id="signup-password"
                              type={showPassword ? 'text' : 'password'}
                              autoComplete="new-password"
                              value={formData.password}
                              onChange={(e) => updateField('password', e.target.value)}
                              placeholder="Create a strong password"
                              className={`${inputClass} pr-12`}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              aria-label={showPassword ? 'Hide password' : 'Show password'}
                              className="absolute right-4 top-1/2 -translate-y-1/2 text-signal-muted hover:text-signal-sub"
                            >
                              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                          </div>
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
                                    ? 'text-signal-green'
                                    : 'text-signal-muted'
                                }`}
                              >
                                {passwordChecks[req.key as keyof typeof passwordChecks] ? (
                                  <CheckCircle size={14} aria-hidden="true" />
                                ) : (
                                  <span className="h-3.5 w-3.5 rounded-full border border-white/[0.16]" aria-hidden="true" />
                                )}
                                {req.label}
                              </div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label htmlFor="signup-confirm" className={labelClass}>
                            Confirm password
                          </label>
                          <input
                            id="signup-confirm"
                            type="password"
                            autoComplete="new-password"
                            value={formData.confirmPassword}
                            onChange={(e) => updateField('confirmPassword', e.target.value)}
                            placeholder="Confirm your password"
                            className={inputClass}
                          />
                          {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                            <p className="mt-2 text-xs text-signal-bad">Passwords do not match</p>
                          )}
                        </div>
                      </div>
                      <button type="submit" className={`mt-6 w-full ${primaryButtonClass}`}>
                        Continue <ArrowRight size={16} aria-hidden="true" />
                      </button>
                    </form>
                  )}

                  {/* ---------------- Step 2: Profile ---------------- */}
                  {step === 2 && (
                    <form onSubmit={handleStep2Submit} noValidate>
                      {errorBlock}
                      <div className="space-y-4">
                        <div>
                          <label htmlFor="signup-name" className={labelClass}>
                            Full name
                          </label>
                          <input
                            id="signup-name"
                            type="text"
                            autoComplete="name"
                            value={formData.fullName}
                            onChange={(e) => updateField('fullName', e.target.value)}
                            placeholder="John Smith"
                            className={inputClass}
                          />
                        </div>
                        <div>
                          <label htmlFor="signup-org" className={labelClass}>
                            Organization name
                          </label>
                          <input
                            id="signup-org"
                            type="text"
                            autoComplete="organization"
                            value={formData.organizationName}
                            onChange={(e) => updateField('organizationName', e.target.value)}
                            placeholder="Acme Inc."
                            className={inputClass}
                          />
                        </div>
                      </div>
                      <div className="mt-6 flex gap-3">
                        <button type="button" onClick={() => setStep(1)} className={backButtonClass}>
                          Back
                        </button>
                        <button type="submit" className={`flex-1 ${primaryButtonClass}`}>
                          Continue <ArrowRight size={16} aria-hidden="true" />
                        </button>
                      </div>
                    </form>
                  )}

                  {/* ---------------- Step 3: Company ---------------- */}
                  {step === 3 && (
                    <form onSubmit={handleStep3Submit} noValidate>
                      {errorBlock}
                      <div className="space-y-6">
                        <div>
                          <span className={labelClass}>Industry</span>
                          <div className="grid grid-cols-3 gap-2">
                            {industries.map((ind) => {
                              const Icon = ind.icon;
                              const active = formData.industry === ind.value;
                              return (
                                <button
                                  key={ind.value}
                                  type="button"
                                  onClick={() => updateField('industry', ind.value)}
                                  className={`rounded-xl border p-3 text-center transition-colors ${
                                    active
                                      ? 'border-signal-green/60 bg-signal-green/10 text-signal-green'
                                      : 'border-white/[0.12] text-signal-sub hover:border-white/[0.24]'
                                  }`}
                                >
                                  <Icon size={18} className="mx-auto mb-1" aria-hidden="true" />
                                  <span className="text-xs">{ind.label}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                        <div>
                          <span className={labelClass}>Company size</span>
                          <div className="grid grid-cols-2 gap-2">
                            {companySizes.map((size) => {
                              const active = formData.companySize === size.value;
                              return (
                                <button
                                  key={size.value}
                                  type="button"
                                  onClick={() => updateField('companySize', size.value)}
                                  className={`rounded-xl border p-3 text-left transition-colors ${
                                    active
                                      ? 'border-signal-green/60 bg-signal-green/10'
                                      : 'border-white/[0.12] hover:border-white/[0.24]'
                                  }`}
                                >
                                  <div
                                    className={`text-sm font-medium ${
                                      active ? 'text-signal-green' : 'text-signal-ink'
                                    }`}
                                  >
                                    {size.label}
                                  </div>
                                  <div className="text-xs text-signal-muted">{size.description}</div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                        <div>
                          <span className={labelClass}>Primary compliance goal</span>
                          <div className="space-y-2">
                            {primaryGoals.map((goal) => {
                              const active = formData.primaryGoal === goal.value;
                              return (
                                <button
                                  key={goal.value}
                                  type="button"
                                  onClick={() => updateField('primaryGoal', goal.value)}
                                  className={`flex w-full items-center justify-between rounded-xl border p-3.5 text-left transition-colors ${
                                    active
                                      ? 'border-signal-green/60 bg-signal-green/10'
                                      : 'border-white/[0.12] hover:border-white/[0.24]'
                                  }`}
                                >
                                  <div>
                                    <div
                                      className={`text-sm font-medium ${
                                        active ? 'text-signal-green' : 'text-signal-ink'
                                      }`}
                                    >
                                      {goal.label}
                                    </div>
                                    {goal.frameworks.length > 0 && (
                                      <div className="mt-0.5 text-xs text-signal-muted">
                                        {goal.frameworks.join(', ')}
                                      </div>
                                    )}
                                  </div>
                                  {active && (
                                    <CheckCircle size={18} className="flex-none text-signal-green" aria-hidden="true" />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                      <div className="mt-6 flex gap-3">
                        <button type="button" onClick={() => setStep(2)} className={backButtonClass}>
                          Back
                        </button>
                        <button type="submit" className={`flex-1 ${primaryButtonClass}`}>
                          Continue <ArrowRight size={16} aria-hidden="true" />
                        </button>
                      </div>
                    </form>
                  )}

                  {/* ---------------- Step 4: Confirm ---------------- */}
                  {step === 4 && (
                    <form onSubmit={handleFinalSubmit} noValidate>
                      {errorBlock}
                      <div className="space-y-3 rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4 text-sm">
                        {[
                          ['Email', formData.email],
                          ['Name', formData.fullName],
                          ['Organization', formData.organizationName],
                          ['Industry', industries.find((i) => i.value === formData.industry)?.label ?? ''],
                          ['Company size', companySizes.find((s) => s.value === formData.companySize)?.label ?? ''],
                          ['Primary goal', primaryGoals.find((g) => g.value === formData.primaryGoal)?.label ?? ''],
                        ].map(([k, v]) => (
                          <div key={k} className="flex justify-between gap-4">
                            <span className="text-signal-muted">{k}</span>
                            <span className="text-right text-signal-ink">{v}</span>
                          </div>
                        ))}
                      </div>

                      <div className="mt-4 rounded-2xl border border-signal-green/30 bg-signal-green/[0.06] p-4">
                        <div className="text-sm font-semibold text-signal-ink">3-day free trial</div>
                        <ul className="mt-2 space-y-1.5 text-[13px] text-signal-body">
                          {[
                            'Full access to Foundation tier features',
                            'Up to 3 compliance frameworks',
                            'Up to 10 team members',
                            'No credit card required',
                          ].map((line) => (
                            <li key={line} className="flex items-center gap-2">
                              <Check size={14} className="flex-none text-signal-green" aria-hidden="true" />
                              {line}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="mt-5 space-y-3">
                        <label className="flex cursor-pointer items-start gap-3">
                          <input
                            type="checkbox"
                            checked={formData.acceptTerms}
                            onChange={(e) => updateField('acceptTerms', e.target.checked)}
                            className="mt-0.5 h-4 w-4 rounded border-white/20 bg-white/[0.04] accent-[#38E8A6]"
                          />
                          <span className="text-[13px] text-signal-body">
                            I agree to the{' '}
                            <a href="/terms" className="text-signal-green hover:opacity-85">
                              Terms of Service
                            </a>{' '}
                            and{' '}
                            <a href="/privacy" className="text-signal-green hover:opacity-85">
                              Privacy Policy
                            </a>{' '}
                            *
                          </span>
                        </label>
                        <label className="flex cursor-pointer items-start gap-3">
                          <input
                            type="checkbox"
                            checked={formData.acceptMarketing}
                            onChange={(e) => updateField('acceptMarketing', e.target.checked)}
                            className="mt-0.5 h-4 w-4 rounded border-white/20 bg-white/[0.04] accent-[#38E8A6]"
                          />
                          <span className="text-[13px] text-signal-body">
                            Send me product updates, compliance tips, and special offers (optional)
                          </span>
                        </label>
                      </div>

                      <div className="mt-6 flex gap-3">
                        <button type="button" onClick={() => setStep(3)} className={backButtonClass}>
                          Back
                        </button>
                        <button
                          type="submit"
                          disabled={loading || !formData.acceptTerms}
                          className={`flex-1 ${primaryButtonClass}`}
                        >
                          {loading ? (
                            <Loader2 size={18} className="animate-spin" aria-hidden="true" />
                          ) : (
                            <>
                              Email me a magic link <ArrowRight size={16} aria-hidden="true" />
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  )}
                </div>

                <div className="my-6 flex items-center gap-3.5" aria-hidden="true">
                  <div className="h-px flex-1 bg-white/10" />
                  <span className="text-xs text-signal-muted">or</span>
                  <div className="h-px flex-1 bg-white/10" />
                </div>

                <OutlineCta to="/demo" className="w-full">
                  Book a guided demo instead
                </OutlineCta>

                <p className="mt-[22px] text-center text-[12.5px] leading-relaxed text-signal-muted">
                  By continuing you agree to our Terms and Privacy Policy.
                  <br />
                  Already have an account?{' '}
                  <Link to="/login" className="text-signal-green hover:opacity-85">
                    Sign in
                  </Link>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </SignalPage>
  );
};

export default SignupPage;
