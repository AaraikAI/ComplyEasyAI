import React, { useState } from 'react';
import { X, ArrowRight, Check, Loader2 } from 'lucide-react';
import { TierName, TIER_ORDER } from '../types';
import { api } from '../services/api';

// ============================================================================
// Signal demo booking — three stages: details form → time preference → booked.
// The submit wiring (api.demo.submitRequest with UTM capture) is unchanged;
// the scheduling step records the visitor's preferred slot client-side and the
// team confirms it by email.
// ============================================================================

interface DemoBookingFormProps {
  /** Modal visibility (modal variant only). Defaults to true for inline use. */
  isOpen?: boolean;
  onClose?: () => void;
  preselectedTier?: TierName;
  source?: string;
  /** 'modal' renders the overlay dialog (existing call sites); 'inline' embeds the card. */
  variant?: 'modal' | 'inline';
}

interface DemoFormData {
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  jobTitle: string;
  phone: string;
  companySize: string;
  industry: string;
  country: string;
  interestedTier: string;
  currentChallenge: string;
  howDidYouHear: string;
  message: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const COMPANY_SIZES = [
  { value: '1-10', label: '1-10 employees' },
  { value: '11-50', label: '11-50 employees' },
  { value: '51-200', label: '51-200 employees' },
  { value: '201-1000', label: '201-1,000 employees' },
  { value: '1000+', label: '1,000+ employees' },
];

const CHALLENGES = [
  { value: 'compliance_automation', label: 'Automating compliance processes' },
  { value: 'multi_framework', label: 'Managing multiple compliance frameworks' },
  { value: 'audit_preparation', label: 'Preparing for audits' },
  { value: 'vendor_risk', label: 'Vendor risk management' },
  { value: 'policy_management', label: 'Policy management' },
  { value: 'continuous_monitoring', label: 'Continuous monitoring' },
  { value: 'evidence_collection', label: 'Evidence collection' },
  { value: 'scaling_team', label: 'Scaling compliance team' },
  { value: 'cost_reduction', label: 'Reducing compliance costs' },
  { value: 'other', label: 'Other' },
];

const DAYS = [
  { dow: 'MON', num: 21, full: 'Mon Jul 21' },
  { dow: 'TUE', num: 22, full: 'Tue Jul 22' },
  { dow: 'WED', num: 23, full: 'Wed Jul 23' },
  { dow: 'THU', num: 24, full: 'Thu Jul 24' },
  { dow: 'FRI', num: 25, full: 'Fri Jul 25' },
];

const SLOTS = ['9:00 AM', '10:30 AM', '12:00 PM', '13:30 PM', '15:00 PM', '16:30 PM'];

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

const inputClass = (invalid: boolean) =>
  `w-full rounded-[11px] border bg-white/[0.04] px-3.5 py-3 text-[14.5px] text-signal-ink placeholder:text-signal-muted outline-none transition-colors focus:border-signal-green/60 ${
    invalid ? 'border-signal-bad' : 'border-white/[0.12]'
  }`;

const selectClass =
  'w-full rounded-[11px] border border-white/[0.12] bg-white/[0.04] px-3.5 py-3 text-[14.5px] text-signal-ink outline-none transition-colors focus:border-signal-green/60 [&>option]:bg-signal-panel2';

const labelClass = 'mb-1.5 block text-[12.5px] font-semibold text-signal-body';

// ============================================================================
// COMPONENT
// ============================================================================

const DemoBookingForm: React.FC<DemoBookingFormProps> = ({
  isOpen = true,
  onClose,
  preselectedTier,
  source = 'pricing_page',
  variant = 'modal',
}) => {
  const [stage, setStage] = useState<'form' | 'submitting' | 'schedule' | 'booked' | 'error'>('form');
  const [errorMessage, setErrorMessage] = useState('');
  const [touched, setTouched] = useState(false);
  const [day, setDay] = useState<number | null>(null);
  const [slot, setSlot] = useState<number | null>(null);
  const [formData, setFormData] = useState<DemoFormData>({
    firstName: '',
    lastName: '',
    email: '',
    company: '',
    jobTitle: '',
    phone: '',
    companySize: '',
    industry: '',
    country: '',
    interestedTier: preselectedTier || '',
    currentChallenge: '',
    howDidYouHear: '',
    message: '',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const emailValid = EMAIL_RE.test(formData.email.trim());
  const requiredValid =
    formData.firstName.trim() !== '' &&
    formData.lastName.trim() !== '' &&
    formData.company.trim() !== '' &&
    emailValid;
  const showFormError = touched && !requiredValid;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requiredValid) {
      setTouched(true);
      return;
    }
    setStage('submitting');
    setErrorMessage('');

    try {
      // Get UTM parameters from URL if available
      const urlParams = new URLSearchParams(window.location.search);
      const utmSource = urlParams.get('utm_source') || undefined;
      const utmMedium = urlParams.get('utm_medium') || undefined;
      const utmCampaign = urlParams.get('utm_campaign') || undefined;

      await api.demo.submitRequest({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        company: formData.company,
        jobTitle: formData.jobTitle || undefined,
        phone: formData.phone || undefined,
        companySize: formData.companySize || undefined,
        industry: formData.industry || undefined,
        country: formData.country || undefined,
        interestedTier: formData.interestedTier || undefined,
        currentChallenge: formData.currentChallenge || undefined,
        howDidYouHear: formData.howDidYouHear || undefined,
        message: formData.message || undefined,
        utmSource,
        utmMedium,
        utmCampaign,
      });

      setStage('schedule');
    } catch (error: any) {
      setStage('error');
      setErrorMessage(error.message || 'An error occurred. Please try again.');
    }
  };

  const ready = day !== null && slot !== null;
  const chosenDay = day !== null ? DAYS[day].full : '';
  const chosenSlot = slot !== null ? SLOTS[slot] : '';

  if (variant === 'modal' && !isOpen) return null;

  const content = (
    <>
      {stage === 'form' && (
        <form onSubmit={handleSubmit} noValidate>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="demo-first" className={labelClass}>
                First name *
              </label>
              <input
                id="demo-first"
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="John"
                className={inputClass(touched && formData.firstName.trim() === '')}
              />
            </div>
            <div>
              <label htmlFor="demo-last" className={labelClass}>
                Last name *
              </label>
              <input
                id="demo-last"
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Smith"
                className={inputClass(touched && formData.lastName.trim() === '')}
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="demo-email" className={labelClass}>
                Work email *
              </label>
              <input
                id="demo-email"
                type="email"
                name="email"
                autoComplete="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="john@company.com"
                className={inputClass(touched && !emailValid)}
              />
            </div>
            <div>
              <label htmlFor="demo-company" className={labelClass}>
                Company *
              </label>
              <input
                id="demo-company"
                type="text"
                name="company"
                autoComplete="organization"
                value={formData.company}
                onChange={handleChange}
                placeholder="Acme Inc."
                className={inputClass(touched && formData.company.trim() === '')}
              />
            </div>
            <div>
              <label htmlFor="demo-size" className={labelClass}>
                Company size
              </label>
              <select
                id="demo-size"
                name="companySize"
                value={formData.companySize}
                onChange={handleChange}
                className={selectClass}
              >
                <option value="">Select…</option>
                {COMPANY_SIZES.map((size) => (
                  <option key={size.value} value={size.value}>
                    {size.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="demo-tier" className={labelClass}>
                Interested plan
              </label>
              <select
                id="demo-tier"
                name="interestedTier"
                value={formData.interestedTier}
                onChange={handleChange}
                className={selectClass}
              >
                <option value="">Select…</option>
                {TIER_ORDER.map((tier) => (
                  <option key={tier} value={tier}>
                    {tier}
                  </option>
                ))}
                <option value="not_sure">Not sure yet</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="demo-challenge" className={labelClass}>
                Main challenge
              </label>
              <select
                id="demo-challenge"
                name="currentChallenge"
                value={formData.currentChallenge}
                onChange={handleChange}
                className={selectClass}
              >
                <option value="">Select…</option>
                {CHALLENGES.map((ch) => (
                  <option key={ch.value} value={ch.value}>
                    {ch.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {showFormError && (
            <p className="mt-3 text-[12.5px] text-signal-bad">
              Please complete the required fields with a valid email.
            </p>
          )}

          <button
            type="submit"
            className="mt-[18px] flex w-full items-center justify-center gap-2 rounded-xl bg-signal-green px-4 py-3.5 text-[15px] font-bold text-signal-canvas transition-opacity hover:opacity-90"
          >
            Request my demo <ArrowRight size={16} aria-hidden="true" />
          </button>
          <p className="mt-3 text-center text-xs text-signal-muted">
            By submitting, you agree to our Privacy Policy.
          </p>
        </form>
      )}

      {stage === 'submitting' && (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 size={44} className="mb-4 animate-spin text-signal-green" aria-hidden="true" />
          <p className="text-[15px] text-signal-sub">Sending your request…</p>
        </div>
      )}

      {stage === 'schedule' && (
        <div>
          <div className="mb-6 text-center">
            <div className="mx-auto mb-[18px] flex h-[60px] w-[60px] items-center justify-center rounded-full bg-signal-green/[0.14]">
              <Check size={26} className="text-signal-green" aria-hidden="true" />
            </div>
            <h2 className="font-display text-[24px] font-bold tracking-[-0.02em] text-signal-ink md:text-[26px]">
              Thanks, {formData.firstName} — now pick a time
            </h2>
            <p className="mt-2.5 text-[14.5px] leading-relaxed text-signal-sub">
              Choose a slot below, or we&rsquo;ll email {formData.email} within 24 hours to schedule.
            </p>
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
            <div className="mb-4 flex items-center justify-between">
              <span className="font-display text-[15px] font-semibold text-signal-ink">July 2026</span>
              <span className="font-mono text-[11px] text-signal-muted">30 MIN · ZONE: LOCAL</span>
            </div>
            <div className="mb-[18px] grid grid-cols-5 gap-2">
              {DAYS.map((d, i) => {
                const active = day === i;
                return (
                  <button
                    key={d.dow}
                    type="button"
                    onClick={() => {
                      setDay(i);
                      setSlot(null);
                    }}
                    className={`flex flex-col items-center gap-1 rounded-[11px] border py-2.5 transition-colors ${
                      active
                        ? 'border-signal-green bg-signal-green text-signal-canvas'
                        : 'border-white/10 bg-white/[0.04] text-signal-body hover:border-white/[0.24]'
                    }`}
                  >
                    <span className="font-mono text-[10px] tracking-[0.08em]">{d.dow}</span>
                    <span className="font-display text-[17px] font-bold">{d.num}</span>
                  </button>
                );
              })}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {SLOTS.map((label, i) => {
                const active = slot === i;
                return (
                  <button
                    key={label}
                    type="button"
                    disabled={day === null}
                    onClick={() => setSlot(i)}
                    className={`rounded-[10px] border py-2.5 text-[13.5px] font-semibold transition-colors ${
                      active
                        ? 'border-signal-green bg-signal-green text-signal-canvas'
                        : day === null
                          ? 'border-white/10 bg-white/[0.04] text-signal-muted'
                          : 'border-white/10 bg-white/[0.04] text-signal-body hover:border-white/[0.24]'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="button"
            disabled={!ready}
            onClick={() => setStage('booked')}
            className={`mt-4 w-full rounded-xl px-4 py-3.5 text-[15px] font-bold transition-opacity ${
              ready
                ? 'bg-signal-green text-signal-canvas hover:opacity-90'
                : 'cursor-not-allowed bg-white/[0.06] text-signal-muted'
            }`}
          >
            {ready ? `Confirm ${chosenDay} · ${chosenSlot}` : 'Select a day and time'}
          </button>
        </div>
      )}

      {stage === 'booked' && (
        <div className="py-5 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-signal-green/[0.14]">
            <span className="text-[28px] text-signal-green" aria-hidden="true">
              ✦
            </span>
          </div>
          <h2 className="font-display text-[26px] font-bold tracking-[-0.02em] text-signal-ink">
            You&rsquo;re booked
          </h2>
          <p className="mx-auto mt-3 max-w-[340px] text-[15px] leading-relaxed text-signal-sub">
            We&rsquo;ve penciled in{' '}
            <strong className="font-semibold text-signal-green">
              {chosenDay} at {chosenSlot}
            </strong>
            . Our team will send a calendar invite to {formData.email} shortly. Talk soon!
          </p>
          {variant === 'modal' ? (
            <button
              type="button"
              onClick={onClose}
              className="mt-6 inline-flex items-center justify-center rounded-[11px] border border-white/20 px-[22px] py-3 text-sm font-medium text-signal-ink transition-colors hover:border-white/[0.32] hover:bg-white/[0.04]"
            >
              Close
            </button>
          ) : (
            <a
              href="/"
              className="mt-6 inline-flex items-center justify-center rounded-[11px] border border-white/20 px-[22px] py-3 text-sm font-medium text-signal-ink transition-colors hover:border-white/[0.32] hover:bg-white/[0.04]"
            >
              Back to home
            </a>
          )}
        </div>
      )}

      {stage === 'error' && (
        <div className="py-10 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-signal-bad/[0.14]">
            <X size={30} className="text-signal-bad" aria-hidden="true" />
          </div>
          <h2 className="font-display text-[24px] font-bold tracking-[-0.02em] text-signal-ink">
            Something went wrong
          </h2>
          <p className="mx-auto mt-3 max-w-md text-[14.5px] text-signal-sub">
            {errorMessage || 'We could not submit your request. Please try again.'}
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <button
              type="button"
              onClick={() => setStage('form')}
              className="rounded-xl bg-signal-green px-6 py-3 text-[14px] font-bold text-signal-canvas transition-opacity hover:opacity-90"
            >
              Try again
            </button>
            {variant === 'modal' && (
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-white/[0.16] px-6 py-3 text-[14px] font-semibold text-signal-sub transition-colors hover:border-white/[0.28] hover:text-signal-ink"
              >
                Close
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );

  if (variant === 'inline') {
    return (
      <div className="rounded-[20px] border border-white/[0.08] bg-white/[0.03] p-6 font-plex text-signal-ink antialiased md:p-8">
        {content}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm">
      <div className="relative max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-[20px] border border-white/[0.08] bg-signal-panel p-6 font-plex text-signal-ink antialiased shadow-2xl md:p-8">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close demo booking"
          className="absolute right-4 top-4 rounded-lg p-1 text-signal-muted transition-colors hover:bg-white/[0.06] hover:text-signal-ink"
        >
          <X size={22} />
        </button>
        {stage === 'form' && (
          <div className="mb-6 pr-8">
            <h2 className="font-display text-[24px] font-bold tracking-[-0.02em] text-signal-ink">
              Book a demo
            </h2>
            <p className="mt-1.5 text-[14.5px] text-signal-sub">
              A 30-minute walkthrough tailored to your frameworks.
            </p>
          </div>
        )}
        {content}
      </div>
    </div>
  );
};

export default DemoBookingForm;
