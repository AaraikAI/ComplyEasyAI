/**
 * NPS Survey
 *
 * Mounts globally and polls /nps/active on mount and on focus. When an active
 * invitation exists, renders a bottom-right modal with a 0-10 score selector
 * plus an optional comment. Users can submit, dismiss, or snooze.
 *
 * Server is the source of truth for visibility. The component never invents
 * an invitation; it only renders one if the API returns one. After submit /
 * dismiss / snooze the local state hides the prompt immediately while the
 * server roundtrip completes.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Star, X, Clock, Send, Check, Loader2 } from 'lucide-react';
import { api } from '../services/api';

interface NPSInvitation {
  id: string;
  trigger: string;
  scheduledFor: string;
  expiresAt: string;
  status: string;
}

type Stage = 'score' | 'comment' | 'thanks';

interface NPSSurveyProps {
  /** Override the polling interval (ms). Default 5 minutes; not exposed to users. */
  pollIntervalMs?: number;
  /** If true, fetches once and stops polling — useful on test harness pages. */
  oneShot?: boolean;
}

const SCORE_VALUES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

function categoryFor(score: number): 'Detractor' | 'Passive' | 'Promoter' {
  if (score <= 6) return 'Detractor';
  if (score <= 8) return 'Passive';
  return 'Promoter';
}

const NPSSurvey: React.FC<NPSSurveyProps> = ({ pollIntervalMs = 300_000, oneShot = false }) => {
  const [invitation, setInvitation] = useState<NPSInvitation | null>(null);
  const [stage, setStage] = useState<Stage>('score');
  const [score, setScore] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState<'submit' | 'dismiss' | 'snooze' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [snoozeMenuOpen, setSnoozeMenuOpen] = useState(false);

  const loadActive = useCallback(async () => {
    try {
      const inv = await api.nps.getActive();
      setInvitation(inv ?? null);
    } catch {
      setInvitation(null);
    }
  }, []);

  useEffect(() => {
    void loadActive();
    if (oneShot) return;
    const onFocus = () => { void loadActive(); };
    window.addEventListener('focus', onFocus);
    const interval = window.setInterval(() => { void loadActive(); }, pollIntervalMs);
    return () => {
      window.removeEventListener('focus', onFocus);
      window.clearInterval(interval);
    };
  }, [loadActive, pollIntervalMs, oneShot]);

  const handleScoreSelect = useCallback((value: number) => {
    setScore(value);
    setStage('comment');
  }, []);

  const handleSubmit = useCallback(async () => {
    if (score === null || !invitation) return;
    setBusy('submit');
    setError(null);
    try {
      await api.nps.submitResponse({
        invitationId: invitation.id,
        score,
        comment: comment.trim() || undefined,
        source: 'in_app',
      });
      setStage('thanks');
      window.setTimeout(() => setInvitation(null), 2500);
    } catch {
      setError('Failed to submit. Please try again.');
    } finally {
      setBusy(null);
    }
  }, [invitation, score, comment]);

  const handleDismiss = useCallback(async () => {
    if (!invitation) return;
    setBusy('dismiss');
    const id = invitation.id;
    setInvitation(null);
    try {
      await api.nps.dismissInvitation(id);
    } finally {
      setBusy(null);
    }
  }, [invitation]);

  const handleSnooze = useCallback(async (days: number) => {
    if (!invitation) return;
    setBusy('snooze');
    const id = invitation.id;
    setInvitation(null);
    setSnoozeMenuOpen(false);
    try {
      await api.nps.snoozeInvitation(id, days);
    } finally {
      setBusy(null);
    }
  }, [invitation]);

  const category = useMemo(() => (score === null ? null : categoryFor(score)), [score]);

  if (!invitation) return null;

  return (
    <div
      className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-3rem)] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden"
      role="dialog"
      aria-labelledby="nps-survey-title"
      aria-describedby="nps-survey-desc"
    >
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
        <h3 id="nps-survey-title" className="font-semibold text-gray-900 text-sm">
          {stage === 'thanks' ? 'Thanks for the feedback!' : 'Quick question'}
        </h3>
        <div className="flex items-center gap-2">
          {stage !== 'thanks' && (
            <div className="relative">
              <button
                onClick={() => setSnoozeMenuOpen(o => !o)}
                disabled={!!busy}
                className="p-1.5 rounded-md hover:bg-white/60 text-gray-500 hover:text-gray-700 disabled:opacity-40"
                aria-label="Snooze"
                title="Snooze"
              >
                <Clock className="w-4 h-4" />
              </button>
              {snoozeMenuOpen && (
                <div className="absolute right-0 top-9 z-10 bg-white rounded-lg shadow-lg border border-gray-200 py-1 w-32 text-sm">
                  {[7, 30, 90].map(d => (
                    <button
                      key={d}
                      onClick={() => handleSnooze(d)}
                      className="w-full text-left px-3 py-1.5 hover:bg-gray-50"
                    >
                      Snooze {d}d
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          <button
            onClick={handleDismiss}
            disabled={!!busy}
            className="p-1.5 rounded-md hover:bg-white/60 text-gray-500 hover:text-gray-700 disabled:opacity-40"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {stage === 'score' && (
          <>
            <p id="nps-survey-desc" className="text-sm text-gray-700 leading-relaxed">
              How likely are you to recommend ComplyEasyAI to a friend or colleague?
            </p>
            <div className="grid grid-cols-11 gap-1.5">
              {SCORE_VALUES.map(v => (
                <button
                  key={v}
                  onClick={() => handleScoreSelect(v)}
                  className={`aspect-square rounded-md text-sm font-semibold border transition-all ${
                    v <= 6
                      ? 'border-red-200 text-red-700 hover:bg-red-50 hover:border-red-400'
                      : v <= 8
                      ? 'border-amber-200 text-amber-700 hover:bg-amber-50 hover:border-amber-400'
                      : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-400'
                  }`}
                  aria-label={`Score ${v}`}
                >
                  {v}
                </button>
              ))}
            </div>
            <div className="flex justify-between text-[11px] text-gray-400">
              <span>Not at all likely</span>
              <span>Extremely likely</span>
            </div>
          </>
        )}

        {stage === 'comment' && score !== null && (
          <>
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                  category === 'Detractor' ? 'bg-red-100 text-red-700' :
                  category === 'Passive' ? 'bg-amber-100 text-amber-700' :
                  'bg-emerald-100 text-emerald-700'
                }`}
              >
                {score}
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900">
                  {category === 'Detractor' ? "Sorry to hear that" :
                   category === 'Passive' ? 'Thanks!' :
                   'Glad to hear it!'}
                </div>
                <div className="text-xs text-gray-500">
                  {category === 'Detractor' ? 'What would have to change for you to give us a 9 or 10?' :
                   category === 'Passive' ? 'What is the one thing we could do better?' :
                   "What's the main reason for your score?"}
                </div>
              </div>
            </div>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value.slice(0, 2000))}
              placeholder="Optional. Helps us prioritize."
              rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
              autoFocus
            />
            {error && <p className="text-xs text-red-600">{error}</p>}
            <div className="flex justify-between items-center pt-1">
              <button
                onClick={() => { setStage('score'); setScore(null); }}
                disabled={!!busy}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={busy === 'submit'}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-60"
              >
                {busy === 'submit' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Submit
              </button>
            </div>
            <p className="text-[11px] text-gray-400">
              {comment.length}/2000
            </p>
          </>
        )}

        {stage === 'thanks' && (
          <div className="flex flex-col items-center justify-center py-4 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mb-3">
              <Check className="w-6 h-6 text-emerald-600" />
            </div>
            <p className="text-sm text-gray-700">
              We read every response. Thanks for shaping the product.
            </p>
          </div>
        )}
      </div>

      <div className="px-5 py-2.5 bg-gray-50 border-t border-gray-100 text-[11px] text-gray-400 flex items-center justify-between">
        <span className="inline-flex items-center gap-1"><Star className="w-3 h-3" /> 30-second feedback</span>
        <span>Goes to the product team</span>
      </div>
    </div>
  );
};

export default NPSSurvey;
