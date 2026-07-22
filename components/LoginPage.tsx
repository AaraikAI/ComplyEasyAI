import React, { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { csrfFetch } from '../services/api';
import { logger } from '../utils/logger';
import { SignalPage, SignalLogo } from './marketing/signal';

// ---------------------------------------------------------------------------
// Signal login page: magic link first, SAML SSO, and a password fallback.
// Auth flows reuse AuthContext (loginWithMagicLink / verifyMagicLink / login);
// SSO initiation calls the backend's GET /api/sso/login/:orgSlug the same way
// the SSO settings surface talks to /api/sso/* (raw same-origin request).
// ---------------------------------------------------------------------------

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

const inputClass = (invalid: boolean) =>
  `w-full rounded-xl border bg-white/[0.04] px-4 py-3.5 text-[15px] text-signal-ink placeholder:text-signal-muted outline-none transition-colors focus:border-signal-green/60 ${
    invalid ? 'border-signal-bad' : 'border-white/[0.12]'
  }`;

const labelClass = 'mb-2 block text-[13px] font-semibold text-signal-body';

const primaryButtonClass =
  'flex w-full items-center justify-center gap-2 rounded-xl bg-signal-green px-4 py-3.5 text-[15px] font-bold text-signal-canvas transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60';

const outlineButtonClass =
  'flex w-full items-center justify-center gap-2.5 rounded-xl border border-white/[0.16] bg-transparent px-4 py-3 text-[14px] font-semibold text-signal-ink transition-colors hover:border-white/[0.28] hover:bg-white/[0.04] disabled:cursor-not-allowed disabled:opacity-60';

// Vite exposes env without bundled client types here; mirror the cast used in services/api.ts.
const isDevMode = Boolean((import.meta as ImportMeta & { env?: Record<string, unknown> }).env?.DEV);

export const LoginPage: React.FC = () => {
  const { isAuthenticated, isLoading, login, loginWithMagicLink, verifyMagicLink } = useAuth();
  const navigate = useNavigate();

  const [method, setMethod] = useState<'magic-link' | 'password'>('magic-link');
  const [view, setView] = useState<'form' | 'sent'>('form');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [magicLinkEmail, setMagicLinkEmail] = useState<string | null>(null);
  const [devToken, setDevToken] = useState<string | null>(null);
  const [resendNote, setResendNote] = useState<string | null>(null);

  const [ssoOpen, setSsoOpen] = useState(false);
  const [ssoOrg, setSsoOrg] = useState('');
  const [ssoLoading, setSsoLoading] = useState(false);
  const [ssoError, setSsoError] = useState<string | null>(null);

  const emailValid = EMAIL_RE.test(email.trim());
  const emailInvalid = touched && !emailValid;

  const handleMagicSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailValid) {
      setTouched(true);
      return;
    }
    setLoading(true);
    setFormError(null);
    try {
      // Backend auto-creates users for valid emails, so this succeeds for new and returning users.
      const response = await loginWithMagicLink(email.trim());
      setMagicLinkEmail(email.trim());
      if (response?.devToken) {
        setDevToken(response.devToken);
      }
      setResendNote(null);
      setView('sent');
    } catch (err: any) {
      logger.error('Magic link request failed', err);
      const msg = err?.message || 'Failed to send magic link';
      setFormError(
        msg.includes('Network') || msg.includes('Failed to fetch') || msg.includes('Cannot connect')
          ? 'Cannot reach the server. Check your connection and try again.'
          : msg
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailValid) {
      setTouched(true);
      return;
    }
    setLoading(true);
    setFormError(null);
    try {
      // api.auth.login gates success on response.user (tokens live in httpOnly
      // cookies) and throws a clear message when the account requires 2FA.
      await login(email.trim(), password);
      navigate('/dashboard');
    } catch (err: any) {
      logger.error('Password login failed', err);
      setFormError(err?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Development-only: the backend returns a devToken so the emailed link can be
  // exercised without a mailbox.
  const simulateMagicClick = async () => {
    if (!devToken) return;
    setLoading(true);
    setFormError(null);
    try {
      await verifyMagicLink(devToken);
      navigate('/dashboard');
    } catch (err: any) {
      logger.error('Magic link verification failed', err);
      setFormError(err?.message || 'Could not verify the magic link. Request a new one.');
    } finally {
      setLoading(false);
    }
  };

  const resendMagicLink = async () => {
    const target = magicLinkEmail || email.trim();
    if (!target) return;
    setLoading(true);
    setResendNote(null);
    try {
      const response = await loginWithMagicLink(target);
      if (response?.devToken) {
        setDevToken(response.devToken);
      }
      setResendNote('A new magic link is on its way.');
    } catch (err: any) {
      logger.error('Magic link resend failed', err);
      setResendNote(err?.message || 'Could not resend the link. Try again shortly.');
    } finally {
      setLoading(false);
    }
  };

  const handleSsoContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    const slug = ssoOrg.trim();
    if (!slug) {
      setSsoError('Enter your organization name to continue.');
      return;
    }
    setSsoLoading(true);
    setSsoError(null);
    try {
      const redirect = `${window.location.origin}/dashboard`;
      const res = await csrfFetch(
        `/api/sso/login/${encodeURIComponent(slug)}?redirect=${encodeURIComponent(redirect)}`
      );
      const body: any = await res.json().catch(() => null);
      const redirectUrl = body?.data?.redirectUrl;
      if (res.ok && redirectUrl) {
        window.location.assign(redirectUrl);
        return;
      }
      setSsoError(body?.error || body?.message || 'SSO is not available for that organization.');
    } catch (err: any) {
      logger.error('SSO initiation failed', err);
      setSsoError('Could not start SSO sign-in. Check your connection and try again.');
    } finally {
      setSsoLoading(false);
    }
  };

  if (isLoading) return null;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  return (
    <SignalPage>
      <div className="flex min-h-screen items-center justify-center bg-signal-glow-tight px-6 py-10">
        <div className="w-full max-w-[460px]">
          <Link to="/" className="mb-9 flex items-center justify-center" aria-label="ComplyEasyAI home">
            <SignalLogo size={36} />
          </Link>

          <div className="rounded-[20px] border border-white/[0.08] bg-white/[0.03] p-7 md:p-9">
            {view === 'sent' ? (
              <div className="text-center">
                <div className="mx-auto mb-5 flex h-[60px] w-[60px] items-center justify-center rounded-full bg-signal-green/[0.14]">
                  <span className="text-[26px] text-signal-green" aria-hidden="true">
                    ✦
                  </span>
                </div>
                <h1 className="font-display text-2xl font-bold tracking-[-0.02em] text-signal-ink">
                  Check your inbox
                </h1>
                <p className="mt-3 text-[14.5px] leading-relaxed text-signal-sub">
                  We sent a secure sign-in link to{' '}
                  <strong className="font-semibold text-signal-ink">{magicLinkEmail || email}</strong>. It
                  expires in 15 minutes.
                </p>

                {isDevMode && devToken && (
                  <button
                    type="button"
                    onClick={simulateMagicClick}
                    disabled={loading}
                    className={`mt-5 ${primaryButtonClass}`}
                  >
                    {loading ? <Loader2 size={18} className="animate-spin" aria-hidden="true" /> : 'Sign in now (dev mode)'}
                  </button>
                )}

                {formError && <p className="mt-4 text-[12.5px] text-signal-bad">{formError}</p>}

                <button
                  type="button"
                  onClick={() => {
                    setView('form');
                    setTouched(false);
                    setFormError(null);
                  }}
                  className="mx-auto mt-[22px] inline-flex items-center justify-center rounded-[11px] border border-white/20 px-[18px] py-[11px] text-sm font-medium text-signal-ink transition-colors hover:border-white/[0.32] hover:bg-white/[0.04]"
                >
                  Back to sign in
                </button>

                <p className="mt-5 text-[12.5px] text-signal-muted">
                  Didn&rsquo;t get it? Check spam, or{' '}
                  <button
                    type="button"
                    onClick={resendMagicLink}
                    disabled={loading}
                    className="text-signal-green hover:opacity-85 disabled:opacity-50"
                  >
                    resend
                  </button>
                  .
                </p>
                {resendNote && <p className="mt-2 text-[12.5px] text-signal-muted">{resendNote}</p>}
              </div>
            ) : (
              <div>
                <h1 className="text-center font-display text-[26px] font-bold tracking-[-0.02em] text-signal-ink">
                  Welcome back
                </h1>
                <p className="mt-2 text-center text-[14.5px] text-signal-sub">
                  Sign in with a magic link — no password required.
                </p>

                {method === 'magic-link' ? (
                  <form onSubmit={handleMagicSubmit} noValidate className="mt-[26px]">
                    <label htmlFor="login-email" className={labelClass}>
                      Work email
                    </label>
                    <input
                      id="login-email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@company.com"
                      className={inputClass(emailInvalid)}
                    />
                    {emailInvalid && (
                      <p className="mt-2 text-[12.5px] text-signal-bad">Enter a valid email address.</p>
                    )}
                    {formError && <p className="mt-2 text-[12.5px] text-signal-bad">{formError}</p>}
                    <button type="submit" disabled={loading} className={`mt-[18px] ${primaryButtonClass}`}>
                      {loading ? (
                        <Loader2 size={18} className="animate-spin" aria-hidden="true" />
                      ) : (
                        <>
                          Send magic link <ArrowRight size={16} aria-hidden="true" />
                        </>
                      )}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handlePasswordSubmit} noValidate className="mt-[26px] space-y-4">
                    <div>
                      <label htmlFor="login-email" className={labelClass}>
                        Work email
                      </label>
                      <input
                        id="login-email"
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@company.com"
                        className={inputClass(emailInvalid)}
                      />
                      {emailInvalid && (
                        <p className="mt-2 text-[12.5px] text-signal-bad">Enter a valid email address.</p>
                      )}
                    </div>
                    <div>
                      <label htmlFor="login-password" className={labelClass}>
                        Password
                      </label>
                      <input
                        id="login-password"
                        type="password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Your password"
                        className={inputClass(false)}
                      />
                    </div>
                    {formError && <p className="text-[12.5px] text-signal-bad">{formError}</p>}
                    <button type="submit" disabled={loading || !password} className={primaryButtonClass}>
                      {loading ? <Loader2 size={18} className="animate-spin" aria-hidden="true" /> : 'Sign in'}
                    </button>
                  </form>
                )}

                <div className="my-[22px] flex items-center gap-3.5" aria-hidden="true">
                  <div className="h-px flex-1 bg-white/10" />
                  <span className="text-xs text-signal-muted">or</span>
                  <div className="h-px flex-1 bg-white/10" />
                </div>

                {!ssoOpen ? (
                  <button type="button" onClick={() => setSsoOpen(true)} className={outlineButtonClass}>
                    <span className="font-mono text-xs text-signal-sub">SSO</span>
                    Continue with SAML single sign-on
                  </button>
                ) : (
                  <form onSubmit={handleSsoContinue} noValidate>
                    <label htmlFor="sso-org" className={labelClass}>
                      Organization name
                    </label>
                    <input
                      id="sso-org"
                      type="text"
                      value={ssoOrg}
                      onChange={(e) => setSsoOrg(e.target.value)}
                      placeholder="Acme Inc."
                      className={inputClass(false)}
                    />
                    {ssoError && <p className="mt-2 text-[12.5px] text-signal-bad">{ssoError}</p>}
                    <div className="mt-3 flex gap-3">
                      <button type="submit" disabled={ssoLoading} className={`flex-1 ${primaryButtonClass}`}>
                        {ssoLoading ? (
                          <Loader2 size={18} className="animate-spin" aria-hidden="true" />
                        ) : (
                          'Continue with SSO'
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSsoOpen(false);
                          setSsoError(null);
                        }}
                        className="rounded-xl border border-white/[0.16] px-5 py-3 text-[14px] font-semibold text-signal-sub transition-colors hover:border-white/[0.28] hover:text-signal-ink"
                      >
                        Cancel
                      </button>
                    </div>
                    <p className="mt-2.5 text-[12px] text-signal-muted">
                      We&rsquo;ll redirect you to your identity provider to finish signing in.
                    </p>
                  </form>
                )}

                <p className="mt-5 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setMethod((m) => (m === 'magic-link' ? 'password' : 'magic-link'));
                      setFormError(null);
                    }}
                    className="text-[12.5px] text-signal-muted transition-colors hover:text-signal-sub"
                  >
                    {method === 'magic-link' ? 'Use password instead' : 'Use a magic link instead'}
                  </button>
                </p>
              </div>
            )}
          </div>

          <p className="mt-[22px] text-center text-[12.5px] text-signal-muted">
            New to ComplyEasyAI?{' '}
            <Link to="/signup" className="text-signal-green hover:opacity-85">
              Start free
            </Link>
          </p>
        </div>
      </div>
    </SignalPage>
  );
};

export default LoginPage;
