/**
 * Maturity Assessment Component
 *
 * GRC maturity assessment wizard:
 * - Multi-step form with 50+ questions across 5 domains
 * - SVG radar chart visualization
 * - Maturity levels 1-Initial to 5-Optimizing
 * - Gap analysis and AI-generated recommendations
 * - Historical assessment comparison with target vs current
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Target,
  Plus,
  X,
  ChevronRight,
  ChevronLeft,
  BarChart3,
  TrendingUp,
  Award,
  Users,
  Shield,
  Cpu,
  FileText,
  CheckCircle,
  ArrowUp,
  ArrowDown,
  Minus,
  RefreshCw,
  AlertCircle,
  Sparkles,
  Save,
  History,
  Lightbulb,
} from 'lucide-react';

// ── Type Definitions ────────────────────────────────────────────────────────

type MaturityLevel = 1 | 2 | 3 | 4 | 5;
type Domain = 'Governance' | 'Risk' | 'Compliance' | 'Technology' | 'People';
type TabId = 'overview' | 'questionnaire' | 'gap_analysis' | 'history';

interface DomainScore {
  domain: Domain;
  currentScore: number;
  targetScore: number;
  previousScore: number;
  completedQuestions: number;
  totalQuestions: number;
}

interface Question {
  id: string;
  domain: Domain;
  text: string;
  category: string;
  level: MaturityLevel;
  answer: MaturityLevel | null;
}

interface Assessment {
  id: string;
  name: string;
  date: string;
  overallScore: number;
  domainScores: DomainScore[];
  status: 'draft' | 'in_progress' | 'completed';
}

interface AIRecommendation {
  domain: Domain;
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  effort: string;
  impact: string;
}

// ── Constants ───────────────────────────────────────────────────────────────

const API_BASE = (import.meta as ImportMeta & { env: Record<string, string> }).env.VITE_API_URL || 'http://localhost:3001/api';
const apiUrl = API_BASE.endsWith('/api') ? API_BASE : API_BASE.replace(/\/?$/, '') + '/api';

const MATURITY_LEVELS: Record<MaturityLevel, { label: string; color: string; bgClass: string; description: string }> = {
  1: { label: 'Initial', color: '#ef4444', bgClass: 'bg-red-500', description: 'Ad hoc processes, reactive approach, no formal documentation' },
  2: { label: 'Developing', color: '#f97316', bgClass: 'bg-orange-500', description: 'Basic processes defined, partially implemented, some documentation' },
  3: { label: 'Defined', color: '#eab308', bgClass: 'bg-yellow-500', description: 'Standardized processes, consistently followed, documented procedures' },
  4: { label: 'Managed', color: '#3b82f6', bgClass: 'bg-blue-500', description: 'Measured and controlled, data-driven decisions, quantitative management' },
  5: { label: 'Optimizing', color: '#22c55e', bgClass: 'bg-green-500', description: 'Continuous improvement, industry leading, proactive innovation' },
};

const DOMAIN_CONFIG: Record<Domain, { icon: React.ReactNode; color: string; textColor: string }> = {
  Governance: { icon: <Shield className="w-4 h-4" />, color: '#3b82f6', textColor: 'text-blue-600 dark:text-blue-400' },
  Risk: { icon: <Target className="w-4 h-4" />, color: '#ef4444', textColor: 'text-red-600 dark:text-red-400' },
  Compliance: { icon: <FileText className="w-4 h-4" />, color: '#22c55e', textColor: 'text-green-600 dark:text-green-400' },
  Technology: { icon: <Cpu className="w-4 h-4" />, color: '#a855f7', textColor: 'text-purple-600 dark:text-purple-400' },
  People: { icon: <Users className="w-4 h-4" />, color: '#f97316', textColor: 'text-orange-600 dark:text-orange-400' },
};

const DOMAINS: Domain[] = ['Governance', 'Risk', 'Compliance', 'Technology', 'People'];

// 50+ assessment questions across 5 domains
const DEFAULT_QUESTIONS: Question[] = [
  // Governance (12 questions)
  { id: 'g1', domain: 'Governance', category: 'Policy', level: 1, text: 'Is there a formal information security policy approved by management?', answer: null },
  { id: 'g2', domain: 'Governance', category: 'Policy', level: 1, text: 'Are acceptable use policies defined and communicated to all employees?', answer: null },
  { id: 'g3', domain: 'Governance', category: 'Roles', level: 2, text: 'Are roles and responsibilities for security clearly defined and assigned?', answer: null },
  { id: 'g4', domain: 'Governance', category: 'Roles', level: 2, text: 'Is there a dedicated CISO or security leadership role?', answer: null },
  { id: 'g5', domain: 'Governance', category: 'Committee', level: 3, text: 'Is there a security governance committee with regular meetings?', answer: null },
  { id: 'g6', domain: 'Governance', category: 'Committee', level: 3, text: 'Are governance decisions documented with clear accountability?', answer: null },
  { id: 'g7', domain: 'Governance', category: 'Reporting', level: 3, text: 'Is there a formal process for policy exception management?', answer: null },
  { id: 'g8', domain: 'Governance', category: 'Reporting', level: 4, text: 'Are security metrics reported to the board at least quarterly?', answer: null },
  { id: 'g9', domain: 'Governance', category: 'Reporting', level: 4, text: 'Is there a security strategy aligned with business objectives?', answer: null },
  { id: 'g10', domain: 'Governance', category: 'Maturity', level: 4, text: 'Are governance processes benchmarked against industry standards?', answer: null },
  { id: 'g11', domain: 'Governance', category: 'Maturity', level: 5, text: 'Is there a formal continuous improvement program for governance?', answer: null },
  { id: 'g12', domain: 'Governance', category: 'Maturity', level: 5, text: 'Does governance proactively anticipate and adapt to emerging threats?', answer: null },

  // Risk (11 questions)
  { id: 'r1', domain: 'Risk', category: 'Assessment', level: 1, text: 'Is there a formal risk assessment methodology in place?', answer: null },
  { id: 'r2', domain: 'Risk', category: 'Assessment', level: 1, text: 'Are asset inventories maintained and classified by sensitivity?', answer: null },
  { id: 'r3', domain: 'Risk', category: 'Assessment', level: 2, text: 'Are risks assessed on a regular schedule with documented results?', answer: null },
  { id: 'r4', domain: 'Risk', category: 'Treatment', level: 2, text: 'Are risk treatment plans documented and tracked to completion?', answer: null },
  { id: 'r5', domain: 'Risk', category: 'Appetite', level: 3, text: 'Is risk appetite formally defined and approved by leadership?', answer: null },
  { id: 'r6', domain: 'Risk', category: 'Appetite', level: 3, text: 'Are risk acceptance criteria clearly defined with approval workflows?', answer: null },
  { id: 'r7', domain: 'Risk', category: 'Third Party', level: 3, text: 'Is there a formal third-party risk management program?', answer: null },
  { id: 'r8', domain: 'Risk', category: 'Monitoring', level: 4, text: 'Are key risk indicators (KRIs) monitored with automated alerting?', answer: null },
  { id: 'r9', domain: 'Risk', category: 'Monitoring', level: 4, text: 'Is there real-time risk dashboard visibility for leadership?', answer: null },
  { id: 'r10', domain: 'Risk', category: 'Advanced', level: 5, text: 'Is there a predictive risk analytics capability leveraging AI/ML?', answer: null },
  { id: 'r11', domain: 'Risk', category: 'Advanced', level: 5, text: 'Are emerging risks proactively identified through threat intelligence?', answer: null },

  // Compliance (11 questions)
  { id: 'c1', domain: 'Compliance', category: 'Identification', level: 1, text: 'Are applicable regulatory requirements identified and documented?', answer: null },
  { id: 'c2', domain: 'Compliance', category: 'Identification', level: 1, text: 'Is there a regulatory change management process?', answer: null },
  { id: 'c3', domain: 'Compliance', category: 'Monitoring', level: 2, text: 'Is there a compliance monitoring program with regular assessments?', answer: null },
  { id: 'c4', domain: 'Compliance', category: 'Monitoring', level: 2, text: 'Are compliance gaps tracked with remediation timelines?', answer: null },
  { id: 'c5', domain: 'Compliance', category: 'Controls', level: 3, text: 'Are compliance controls mapped to specific regulatory requirements?', answer: null },
  { id: 'c6', domain: 'Compliance', category: 'Controls', level: 3, text: 'Is there evidence management for compliance artifacts?', answer: null },
  { id: 'c7', domain: 'Compliance', category: 'Controls', level: 3, text: 'Are internal audits conducted regularly with formal reports?', answer: null },
  { id: 'c8', domain: 'Compliance', category: 'Automation', level: 4, text: 'Is compliance testing automated with continuous monitoring?', answer: null },
  { id: 'c9', domain: 'Compliance', category: 'Automation', level: 4, text: 'Are compliance metrics tracked and reported automatically?', answer: null },
  { id: 'c10', domain: 'Compliance', category: 'Proactive', level: 5, text: 'Does the organization proactively anticipate regulatory changes?', answer: null },
  { id: 'c11', domain: 'Compliance', category: 'Proactive', level: 5, text: 'Is compliance integrated into the software development lifecycle?', answer: null },

  // Technology (10 questions)
  { id: 't1', domain: 'Technology', category: 'Basic Controls', level: 1, text: 'Are basic security controls (firewall, antivirus, patching) in place?', answer: null },
  { id: 't2', domain: 'Technology', category: 'Basic Controls', level: 1, text: 'Is multi-factor authentication enforced for all critical systems?', answer: null },
  { id: 't3', domain: 'Technology', category: 'Monitoring', level: 2, text: 'Is there centralized logging and monitoring of security events?', answer: null },
  { id: 't4', domain: 'Technology', category: 'Monitoring', level: 2, text: 'Are network segmentation and access controls properly configured?', answer: null },
  { id: 't5', domain: 'Technology', category: 'DevSecOps', level: 3, text: 'Are security tools integrated into CI/CD pipelines?', answer: null },
  { id: 't6', domain: 'Technology', category: 'DevSecOps', level: 3, text: 'Is there a formal vulnerability management program with SLAs?', answer: null },
  { id: 't7', domain: 'Technology', category: 'Advanced', level: 4, text: 'Is there automated vulnerability management with SLA tracking?', answer: null },
  { id: 't8', domain: 'Technology', category: 'Advanced', level: 4, text: 'Are security operations (SOC) available 24/7 with defined playbooks?', answer: null },
  { id: 't9', domain: 'Technology', category: 'Innovation', level: 5, text: 'Are advanced threat detection capabilities (UEBA, SOAR) deployed?', answer: null },
  { id: 't10', domain: 'Technology', category: 'Innovation', level: 5, text: 'Is zero-trust architecture implemented across the organization?', answer: null },

  // People (10 questions)
  { id: 'p1', domain: 'People', category: 'Awareness', level: 1, text: 'Do all employees complete security awareness training annually?', answer: null },
  { id: 'p2', domain: 'People', category: 'Awareness', level: 1, text: 'Are new hires trained on security policies during onboarding?', answer: null },
  { id: 'p3', domain: 'People', category: 'Training', level: 2, text: 'Are there role-specific security training programs?', answer: null },
  { id: 'p4', domain: 'People', category: 'Training', level: 2, text: 'Are phishing simulations conducted regularly?', answer: null },
  { id: 'p5', domain: 'People', category: 'Champions', level: 3, text: 'Is there a formal security champions program?', answer: null },
  { id: 'p6', domain: 'People', category: 'Champions', level: 3, text: 'Are security responsibilities included in job descriptions?', answer: null },
  { id: 'p7', domain: 'People', category: 'Measurement', level: 4, text: 'Are security competencies measured and tracked for all roles?', answer: null },
  { id: 'p8', domain: 'People', category: 'Measurement', level: 4, text: 'Is there a security certification program and career path?', answer: null },
  { id: 'p9', domain: 'People', category: 'Culture', level: 5, text: 'Is there a culture of security with bottom-up innovation?', answer: null },
  { id: 'p10', domain: 'People', category: 'Culture', level: 5, text: 'Do employees proactively report security concerns and improvements?', answer: null },
];

// ── Helpers ─────────────────────────────────────────────────────────────────

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('token');
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

// SVG Radar chart helpers
function polarToCartesian(cx: number, cy: number, radius: number, angleDeg: number): { x: number; y: number } {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
}

function radarPoints(scores: number[], cx: number, cy: number, maxRadius: number, maxScore: number): string {
  return scores.map((score, i) => {
    const angle = (360 / scores.length) * i;
    const r = (score / maxScore) * maxRadius;
    const { x, y } = polarToCartesian(cx, cy, r, angle);
    return `${x},${y}`;
  }).join(' ');
}

// ── Component ───────────────────────────────────────────────────────────────

const MaturityAssessment: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [questions, setQuestions] = useState<Question[]>(DEFAULT_QUESTIONS);
  const [wizardDomain, setWizardDomain] = useState<Domain>('Governance');
  const [wizardStep, setWizardStep] = useState(0);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [targetScores, setTargetScores] = useState<Record<Domain, MaturityLevel>>({
    Governance: 4, Risk: 4, Compliance: 5, Technology: 4, People: 4,
  });

  // ── API ────────────────────────────────────────────────────────────────

  const fetchAssessments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiUrl}/maturity/assessments`, { headers: getAuthHeaders(), credentials: 'include' });
      if (!res.ok) throw new Error(`Failed to fetch assessments: ${res.status}`);
      const data = await res.json();
      const list = Array.isArray(data) ? data : data.assessments || [];
      setAssessments(list);
      // Load latest assessment answers if available
      if (list.length > 0) {
        const latest = list[list.length - 1];
        if (latest.answers) {
          setQuestions(prev => prev.map(q => {
            const saved = latest.answers.find((a: { questionId: string; answer: MaturityLevel }) => a.questionId === q.id);
            return saved ? { ...q, answer: saved.answer } : q;
          }));
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch assessments');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAssessments(); }, [fetchAssessments]);

  const saveAssessment = async () => {
    setSaving(true);
    try {
      const answers = questions.filter(q => q.answer !== null).map(q => ({ questionId: q.id, answer: q.answer }));
      const res = await fetch(`${apiUrl}/maturity/assessments`, {
        method: 'POST', headers: getAuthHeaders(), credentials: 'include',
        body: JSON.stringify({ answers, domainScores: domainScores.map(ds => ({ domain: ds.domain, score: ds.currentScore, target: ds.targetScore })), overallScore }),
      });
      if (!res.ok) throw new Error(`Save failed: ${res.status}`);
      await fetchAssessments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const fetchRecommendations = async () => {
    setLoadingRecs(true);
    try {
      const res = await fetch(`${apiUrl}/maturity/assessments/recommendations`, {
        method: 'POST', headers: getAuthHeaders(), credentials: 'include',
        body: JSON.stringify({ domainScores, overallScore }),
      });
      if (!res.ok) throw new Error(`Failed: ${res.status}`);
      const data = await res.json();
      setRecommendations(Array.isArray(data) ? data : data.recommendations || []);
    } catch (err) {
      // Generate client-side recommendations as fallback
      const recs: AIRecommendation[] = domainScores.filter(ds => ds.currentScore < ds.targetScore).flatMap(ds => {
        const gap = ds.targetScore - ds.currentScore;
        const nextLevel = (Math.min(ds.currentScore + 1, 5)) as MaturityLevel;
        return [{
          domain: ds.domain,
          priority: gap >= 2 ? 'high' as const : 'medium' as const,
          title: `Advance ${ds.domain} to Level ${nextLevel} (${MATURITY_LEVELS[nextLevel].label})`,
          description: `Current maturity is Level ${ds.currentScore}. Focus on ${MATURITY_LEVELS[nextLevel].description.toLowerCase()} to close the ${gap}-level gap to your target of ${ds.targetScore}.`,
          effort: gap >= 2 ? '3-6 months' : '1-3 months',
          impact: gap >= 2 ? 'High' : 'Medium',
        }];
      });
      setRecommendations(recs);
    } finally {
      setLoadingRecs(false);
    }
  };

  // ── Computed ───────────────────────────────────────────────────────────

  const domainScores = useMemo((): DomainScore[] => {
    return DOMAINS.map(domain => {
      const dqs = questions.filter(q => q.domain === domain);
      const answered = dqs.filter(q => q.answer !== null);
      const avgScore = answered.length > 0 ? answered.reduce((s, q) => s + (q.answer || 0), 0) / answered.length : 0;
      const prevAssessment = assessments.length > 1 ? assessments[assessments.length - 2] : null;
      const prevScore = prevAssessment?.domainScores?.find((d: DomainScore) => d.domain === domain)?.currentScore || 0;
      return {
        domain,
        currentScore: Math.round(avgScore * 10) / 10,
        targetScore: targetScores[domain],
        previousScore: prevScore,
        completedQuestions: answered.length,
        totalQuestions: dqs.length,
      };
    });
  }, [questions, assessments, targetScores]);

  const overallScore = useMemo(() => {
    const scored = domainScores.filter(d => d.currentScore > 0);
    return scored.length > 0 ? Math.round((scored.reduce((s, d) => s + d.currentScore, 0) / scored.length) * 10) / 10 : 0;
  }, [domainScores]);

  const wizardQuestions = useMemo(() => questions.filter(q => q.domain === wizardDomain), [questions, wizardDomain]);
  const totalAnswered = useMemo(() => questions.filter(q => q.answer !== null).length, [questions]);
  const completionPct = Math.round((totalAnswered / questions.length) * 100);

  const answerQuestion = useCallback((qId: string, answer: MaturityLevel) => {
    setQuestions(prev => prev.map(q => q.id === qId ? { ...q, answer } : q));
  }, []);

  // ── SVG Radar Chart ───────────────────────────────────────────────────

  const renderRadarChart = () => {
    const size = 300, cx = size / 2, cy = size / 2, maxR = 120;
    const scores = domainScores.map(d => d.currentScore);
    const targets = domainScores.map(d => d.targetScore);

    return (
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-[320px] mx-auto">
        {/* Background rings */}
        {[1, 2, 3, 4, 5].map(ring => {
          const r = (ring / 5) * maxR;
          const pts = DOMAINS.map((_, i) => {
            const { x, y } = polarToCartesian(cx, cy, r, (360 / 5) * i);
            return `${x},${y}`;
          }).join(' ');
          return <polygon key={ring} points={pts} fill="none" stroke="currentColor" className="text-surface-200 dark:text-surface-700" strokeWidth="0.5" />;
        })}

        {/* Axis lines */}
        {DOMAINS.map((_, i) => {
          const { x, y } = polarToCartesian(cx, cy, maxR, (360 / 5) * i);
          return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="currentColor" className="text-surface-200 dark:text-surface-700" strokeWidth="0.5" />;
        })}

        {/* Target polygon */}
        <polygon points={radarPoints(targets, cx, cy, maxR, 5)} fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="4 2" opacity={0.6} />

        {/* Current score polygon */}
        {scores.some(s => s > 0) && (
          <>
            <polygon points={radarPoints(scores, cx, cy, maxR, 5)} fill="#3b82f6" fillOpacity={0.15} stroke="#3b82f6" strokeWidth="2" />
            {scores.map((score, i) => {
              if (score === 0) return null;
              const { x, y } = polarToCartesian(cx, cy, (score / 5) * maxR, (360 / 5) * i);
              return <circle key={i} cx={x} cy={y} r="4" fill="#3b82f6" stroke="white" strokeWidth="2" />;
            })}
          </>
        )}

        {/* Domain labels */}
        {DOMAINS.map((domain, i) => {
          const { x, y } = polarToCartesian(cx, cy, maxR + 22, (360 / 5) * i);
          return (
            <text key={domain} x={x} y={y} textAnchor="middle" dominantBaseline="middle" fontSize="10" fontWeight="600" fill={DOMAIN_CONFIG[domain].color}>
              {domain}
            </text>
          );
        })}

        {/* Center score */}
        <text x={cx} y={cy - 6} textAnchor="middle" fontSize="20" fontWeight="bold" fill="currentColor" className="text-surface-900 dark:text-surface-100">
          {overallScore.toFixed(1)}
        </text>
        <text x={cx} y={cy + 10} textAnchor="middle" fontSize="9" fill="currentColor" className="text-surface-500 dark:text-surface-400">
          Overall
        </text>
      </svg>
    );
  };

  // ── Tab Items ─────────────────────────────────────────────────────────

  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'questionnaire', label: 'Assessment', icon: <FileText className="w-4 h-4" /> },
    { id: 'gap_analysis', label: 'Gap Analysis', icon: <Lightbulb className="w-4 h-4" /> },
    { id: 'history', label: 'History', icon: <History className="w-4 h-4" /> },
  ];

  // ── Main Render ───────────────────────────────────────────────────────

  return (
    <div className="bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-100 rounded-xl shadow-sm border border-surface-200 dark:border-surface-700">
      {/* Header */}
      <div className="px-6 py-4 border-b border-surface-200 dark:border-surface-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Target className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            <div>
              <h1 className="text-xl font-bold text-surface-900 dark:text-surface-100">Maturity Assessment</h1>
              <p className="text-sm text-surface-500 dark:text-surface-400">GRC maturity evaluation across Governance, Risk, Compliance, Technology, and People</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={fetchAssessments} disabled={loading} className="p-2 rounded-lg text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-700">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={saveAssessment} disabled={saving || totalAnswered === 0}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 disabled:cursor-not-allowed rounded-lg">
              <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Assessment'}
            </button>
          </div>
        </div>

        {/* Overall Score Banner */}
        <div className="bg-surface-50 dark:bg-surface-700/50 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm text-surface-500 dark:text-surface-400">Overall Maturity Score</span>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-4xl font-bold text-surface-900 dark:text-surface-100">{overallScore.toFixed(1)}</span>
                <span className="text-lg text-surface-400">/ 5</span>
                {overallScore > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium text-white ${MATURITY_LEVELS[Math.round(overallScore) as MaturityLevel || 1].bgClass}`}>
                    {MATURITY_LEVELS[Math.round(overallScore) as MaturityLevel || 1].label}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-2 text-xs text-surface-500 dark:text-surface-400">
                <span>{totalAnswered}/{questions.length} questions answered</span>
                <span>({completionPct}% complete)</span>
              </div>
            </div>
            <div className="flex gap-1">
              {([1, 2, 3, 4, 5] as MaturityLevel[]).map(lv => (
                <div key={lv} className={`w-14 h-3 rounded-full ${lv <= Math.round(overallScore) ? MATURITY_LEVELS[lv].bgClass : 'bg-surface-200 dark:bg-surface-600'}`} title={MATURITY_LEVELS[lv].label} />
              ))}
            </div>
          </div>
          {/* Progress bar */}
          <div className="mt-3 w-full bg-surface-200 dark:bg-surface-600 rounded-full h-1.5">
            <div className="bg-purple-600 h-1.5 rounded-full transition-all" style={{ width: `${completionPct}%` }} />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 bg-surface-100 dark:bg-surface-700 rounded-lg p-0.5 w-fit">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === tab.id ? 'bg-white dark:bg-surface-600 text-surface-900 dark:text-surface-100 shadow-sm' : 'text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-200'}`}>
              {tab.icon}{tab.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mx-6 mt-4 flex items-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
          <span className="text-sm text-red-700 dark:text-red-300">{error}</span>
          <button onClick={() => setError(null)} className="ml-auto p-1 text-red-500"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="w-6 h-6 text-purple-600 animate-spin" />
          <span className="ml-3 text-sm text-surface-500 dark:text-surface-400">Loading assessments...</span>
        </div>
      ) : (
        <div className="p-6">
          {/* ── Overview Tab ──────────────────────────────────── */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Radar Chart */}
                <div className="bg-surface-50 dark:bg-surface-700/30 rounded-xl p-6 border border-surface-200 dark:border-surface-700">
                  <h3 className="text-sm font-semibold text-surface-900 dark:text-surface-100 mb-4">Maturity Radar</h3>
                  {renderRadarChart()}
                  <div className="flex items-center justify-center gap-4 mt-4">
                    <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-blue-500" /><span className="text-xs text-surface-500 dark:text-surface-400">Current</span></div>
                    <div className="flex items-center gap-1.5"><div className="w-3 h-0.5 border-t-2 border-dashed border-slate-400" style={{ width: 12 }} /><span className="text-xs text-surface-500 dark:text-surface-400">Target</span></div>
                  </div>
                </div>

                {/* Domain Scores */}
                <div className="bg-surface-50 dark:bg-surface-700/30 rounded-xl p-6 border border-surface-200 dark:border-surface-700">
                  <h3 className="text-sm font-semibold text-surface-900 dark:text-surface-100 mb-4">Domain Scores</h3>
                  <div className="space-y-4">
                    {domainScores.map(ds => {
                      const diff = ds.currentScore - ds.previousScore;
                      return (
                        <div key={ds.domain}>
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2">
                              <span className={DOMAIN_CONFIG[ds.domain].textColor}>{DOMAIN_CONFIG[ds.domain].icon}</span>
                              <span className="text-sm font-medium text-surface-900 dark:text-surface-100">{ds.domain}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-surface-900 dark:text-surface-100">{ds.currentScore.toFixed(1)}</span>
                              <span className="text-xs text-surface-500">/ {ds.targetScore} target</span>
                              {diff > 0 && <ArrowUp className="w-3 h-3 text-green-500" />}
                              {diff < 0 && <ArrowDown className="w-3 h-3 text-red-500" />}
                              {diff === 0 && ds.previousScore > 0 && <Minus className="w-3 h-3 text-surface-400" />}
                            </div>
                          </div>
                          <div className="flex gap-1">
                            {([1, 2, 3, 4, 5] as MaturityLevel[]).map(lv => (
                              <div key={lv} className="flex-1 h-2 rounded-full relative">
                                <div className={`h-full rounded-full ${lv <= Math.round(ds.currentScore) ? MATURITY_LEVELS[lv].bgClass : 'bg-surface-200 dark:bg-surface-600'}`} />
                                {lv === ds.targetScore && <div className="absolute top-0 right-0 w-0.5 h-full bg-surface-900 dark:bg-surface-100 opacity-50" />}
                              </div>
                            ))}
                          </div>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-xs text-surface-500">{ds.completedQuestions}/{ds.totalQuestions} questions</span>
                            {ds.currentScore > 0 && <span className={`text-xs px-1.5 py-0.5 rounded text-white ${MATURITY_LEVELS[Math.round(ds.currentScore) as MaturityLevel || 1].bgClass}`}>{MATURITY_LEVELS[Math.round(ds.currentScore) as MaturityLevel || 1].label}</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Maturity Scale Legend */}
              <div className="bg-surface-50 dark:bg-surface-700/30 rounded-xl p-6 border border-surface-200 dark:border-surface-700">
                <h3 className="text-sm font-semibold text-surface-900 dark:text-surface-100 mb-4">Maturity Scale Reference</h3>
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                  {([1, 2, 3, 4, 5] as MaturityLevel[]).map(lv => (
                    <div key={lv} className="p-3 bg-white dark:bg-surface-800 rounded-lg border border-surface-200 dark:border-surface-700">
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`w-3 h-3 rounded-full ${MATURITY_LEVELS[lv].bgClass}`} />
                        <span className="text-sm font-medium text-surface-900 dark:text-surface-100">Level {lv}</span>
                      </div>
                      <p className="text-xs font-medium text-surface-800 dark:text-surface-200">{MATURITY_LEVELS[lv].label}</p>
                      <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">{MATURITY_LEVELS[lv].description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Questionnaire Tab ────────────────────────────── */}
          {activeTab === 'questionnaire' && (
            <div className="space-y-6">
              {/* Domain Selector */}
              <div className="flex items-center gap-2 flex-wrap">
                {DOMAINS.map(domain => {
                  const dqs = questions.filter(q => q.domain === domain);
                  const answered = dqs.filter(q => q.answer !== null).length;
                  return (
                    <button key={domain} onClick={() => { setWizardDomain(domain); setWizardStep(0); }}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${wizardDomain === domain ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300' : 'bg-white dark:bg-surface-700 border-surface-200 dark:border-surface-600 text-surface-600 dark:text-surface-400 hover:border-surface-300'}`}>
                      {DOMAIN_CONFIG[domain].icon}
                      {domain}
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${answered === dqs.length ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-surface-100 dark:bg-surface-600 text-surface-500 dark:text-surface-400'}`}>{answered}/{dqs.length}</span>
                    </button>
                  );
                })}
              </div>

              {/* Target Score Setting */}
              <div className="bg-surface-50 dark:bg-surface-700/30 rounded-lg p-4 border border-surface-200 dark:border-surface-700">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-4 h-4 text-surface-500" />
                  <span className="text-sm font-medium text-surface-700 dark:text-surface-300">Target Maturity for {wizardDomain}</span>
                </div>
                <div className="flex items-center gap-2">
                  {([1, 2, 3, 4, 5] as MaturityLevel[]).map(lv => (
                    <button key={lv} onClick={() => setTargetScores(p => ({ ...p, [wizardDomain]: lv }))}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${targetScores[wizardDomain] === lv ? `${MATURITY_LEVELS[lv].bgClass} text-white` : 'bg-white dark:bg-surface-700 text-surface-600 dark:text-surface-400 border border-surface-200 dark:border-surface-600'}`}>
                      {lv} - {MATURITY_LEVELS[lv].label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Question Card */}
              {wizardQuestions.length > 0 && wizardStep < wizardQuestions.length && (
                <div className="bg-surface-50 dark:bg-surface-700/30 rounded-xl p-6 border border-surface-200 dark:border-surface-700">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <span className="text-xs text-surface-500 dark:text-surface-400">Question {wizardStep + 1} of {wizardQuestions.length}</span>
                      <span className="text-xs text-surface-400 ml-2">| {wizardQuestions[wizardStep].category} | Level {wizardQuestions[wizardStep].level}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${wizardQuestions[wizardStep].answer !== null ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-surface-100 dark:bg-surface-600 text-surface-500 dark:text-surface-400'}`}>
                      {wizardQuestions[wizardStep].answer !== null ? 'Answered' : 'Unanswered'}
                    </span>
                  </div>

                  <p className="text-lg font-medium text-surface-900 dark:text-surface-100 mb-6">{wizardQuestions[wizardStep].text}</p>

                  <div className="space-y-2 mb-6">
                    {([1, 2, 3, 4, 5] as MaturityLevel[]).map(lv => (
                      <button key={lv} onClick={() => answerQuestion(wizardQuestions[wizardStep].id, lv)}
                        className={`w-full text-left p-3 rounded-lg border transition-colors ${wizardQuestions[wizardStep].answer === lv ? 'border-purple-400 dark:border-purple-600 bg-purple-50 dark:bg-purple-900/20' : 'border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-700 hover:border-surface-300 dark:hover:border-surface-500'}`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${MATURITY_LEVELS[lv].bgClass}`} />
                          <div className="flex-1">
                            <span className="text-sm font-medium text-surface-900 dark:text-surface-100">Level {lv} - {MATURITY_LEVELS[lv].label}</span>
                            <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">{MATURITY_LEVELS[lv].description}</p>
                          </div>
                          {wizardQuestions[wizardStep].answer === lv && <CheckCircle className="w-4 h-4 text-purple-600 dark:text-purple-400" />}
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center justify-between">
                    <button onClick={() => setWizardStep(Math.max(0, wizardStep - 1))} disabled={wizardStep === 0}
                      className="flex items-center gap-2 px-4 py-2 text-sm border border-surface-200 dark:border-surface-600 rounded-lg text-surface-600 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-700 disabled:opacity-30 disabled:cursor-not-allowed">
                      <ChevronLeft className="w-4 h-4" /> Previous
                    </button>
                    <div className="flex gap-1">
                      {wizardQuestions.map((q, idx) => (
                        <button key={q.id} onClick={() => setWizardStep(idx)}
                          className={`w-2 h-2 rounded-full transition-colors ${idx === wizardStep ? 'bg-purple-500' : q.answer !== null ? 'bg-green-500' : 'bg-surface-300 dark:bg-surface-600'}`} />
                      ))}
                    </div>
                    <button onClick={() => setWizardStep(Math.min(wizardQuestions.length - 1, wizardStep + 1))} disabled={wizardStep >= wizardQuestions.length - 1}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg">
                      Next <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Gap Analysis Tab ─────────────────────────────── */}
          {activeTab === 'gap_analysis' && (
            <div className="space-y-6">
              {/* Gap Summary */}
              <div className="bg-surface-50 dark:bg-surface-700/30 rounded-xl p-6 border border-surface-200 dark:border-surface-700">
                <h3 className="text-sm font-semibold text-surface-900 dark:text-surface-100 mb-4">Gap Analysis: Current vs Target</h3>
                <div className="space-y-4">
                  {domainScores.map(ds => {
                    const gap = ds.targetScore - ds.currentScore;
                    const gapPct = ds.currentScore > 0 ? Math.round((ds.currentScore / ds.targetScore) * 100) : 0;
                    return (
                      <div key={ds.domain} className="flex items-center gap-4">
                        <div className="w-28 flex items-center gap-2">
                          <span className={DOMAIN_CONFIG[ds.domain].textColor}>{DOMAIN_CONFIG[ds.domain].icon}</span>
                          <span className="text-sm font-medium text-surface-900 dark:text-surface-100">{ds.domain}</span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="flex-1 bg-surface-200 dark:bg-surface-600 rounded-full h-3 relative">
                              <div className="bg-blue-500 h-3 rounded-full transition-all" style={{ width: `${(ds.currentScore / 5) * 100}%` }} />
                              <div className="absolute top-0 h-3 border-r-2 border-dashed border-surface-900 dark:border-surface-100" style={{ left: `${(ds.targetScore / 5) * 100}%` }} />
                            </div>
                          </div>
                        </div>
                        <div className="w-36 text-right">
                          <span className="text-sm font-medium text-surface-900 dark:text-surface-100">{ds.currentScore.toFixed(1)}</span>
                          <span className="text-xs text-surface-500"> / {ds.targetScore}</span>
                          {gap > 0 && <span className="text-xs text-red-600 dark:text-red-400 ml-2">-{gap.toFixed(1)} gap</span>}
                          {gap <= 0 && ds.currentScore > 0 && <span className="text-xs text-green-600 dark:text-green-400 ml-2">On target</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* AI Recommendations */}
              <div className="bg-surface-50 dark:bg-surface-700/30 rounded-xl p-6 border border-surface-200 dark:border-surface-700">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-surface-900 dark:text-surface-100 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-500" /> AI-Generated Recommendations
                  </h3>
                  <button onClick={fetchRecommendations} disabled={loadingRecs}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-purple-600 dark:text-purple-400 border border-purple-300 dark:border-purple-700 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20">
                    {loadingRecs ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                    {loadingRecs ? 'Generating...' : 'Generate Recommendations'}
                  </button>
                </div>

                {recommendations.length === 0 ? (
                  <div className="text-center py-8">
                    <Lightbulb className="w-10 h-10 text-surface-300 dark:text-surface-600 mx-auto mb-3" />
                    <p className="text-sm text-surface-500 dark:text-surface-400">Complete the assessment and click Generate to get AI-powered recommendations</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recommendations.map((rec, i) => (
                      <div key={i} className="p-4 bg-white dark:bg-surface-800 rounded-lg border border-surface-200 dark:border-surface-700">
                        <div className="flex items-start gap-3">
                          <span className={DOMAIN_CONFIG[rec.domain].textColor}>{DOMAIN_CONFIG[rec.domain].icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium text-surface-900 dark:text-surface-100">{rec.title}</span>
                              <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${rec.priority === 'high' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' : rec.priority === 'medium' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300' : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'}`}>{rec.priority}</span>
                            </div>
                            <p className="text-xs text-surface-600 dark:text-surface-400 mb-2">{rec.description}</p>
                            <div className="flex items-center gap-4 text-xs text-surface-500">
                              <span>Effort: {rec.effort}</span>
                              <span>Impact: {rec.impact}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── History Tab ───────────────────────────────────── */}
          {activeTab === 'history' && (
            <div className="space-y-6">
              {assessments.length === 0 ? (
                <div className="text-center py-16">
                  <History className="w-10 h-10 text-surface-300 dark:text-surface-600 mx-auto mb-3" />
                  <p className="text-sm text-surface-500 dark:text-surface-400">No historical assessments found</p>
                  <p className="text-xs text-surface-400 mt-1">Complete and save an assessment to see it here</p>
                </div>
              ) : (
                <div className="bg-surface-50 dark:bg-surface-700/30 rounded-xl p-6 border border-surface-200 dark:border-surface-700">
                  <h3 className="text-sm font-semibold text-surface-900 dark:text-surface-100 mb-4">Assessment History</h3>
                  <div className="space-y-4">
                    {assessments.map((assessment, idx) => (
                      <div key={assessment.id} className={`p-4 rounded-xl border ${idx === assessments.length - 1 ? 'border-purple-300 dark:border-purple-700 bg-purple-50/50 dark:bg-purple-900/10' : 'border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800'}`}>
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <span className="text-sm font-medium text-surface-900 dark:text-surface-100">{assessment.name || `Assessment ${idx + 1}`}</span>
                            <span className="text-xs text-surface-500 ml-2">{new Date(assessment.date).toLocaleDateString()}</span>
                            {idx === assessments.length - 1 && <span className="text-xs text-purple-600 dark:text-purple-400 ml-2 font-medium">Latest</span>}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-surface-900 dark:text-surface-100">{typeof assessment.overallScore === 'number' ? assessment.overallScore.toFixed(1) : assessment.overallScore}</span>
                            <span className="text-xs text-surface-500">/ 5</span>
                          </div>
                        </div>
                        {assessment.domainScores && (
                          <div className="flex gap-1">
                            {assessment.domainScores.map((ds: DomainScore) => (
                              <div key={ds.domain} className="flex-1">
                                <div className="text-[10px] text-surface-500 text-center mb-1">{ds.domain}</div>
                                <div className="h-2 bg-surface-200 dark:bg-surface-600 rounded-full overflow-hidden">
                                  <div className={`h-full rounded-full ${MATURITY_LEVELS[Math.round(ds.currentScore) as MaturityLevel || 1].bgClass}`} style={{ width: `${(ds.currentScore / 5) * 100}%` }} />
                                </div>
                                <div className="text-[10px] text-center mt-0.5 font-mono text-surface-600 dark:text-surface-400">{ds.currentScore.toFixed ? ds.currentScore.toFixed(1) : ds.currentScore}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MaturityAssessment;
