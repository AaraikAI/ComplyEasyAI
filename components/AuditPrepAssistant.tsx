/**
 * Audit Prep Assistant Component
 *
 * AI-powered audit preparation wizard:
 * - Framework selection step
 * - Readiness analysis with overall score (0-100) and breakdown by control domain
 * - Gap identification table (controls without evidence, stale evidence, missing policies)
 * - Mock audit Q&A generator
 * - Evidence package builder with ZIP export
 * - Executive readiness summary
 * - Timeline calculator
 * - Remediation priority list
 * - API calls to /api/audit-prep
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import {
  ArrowLeft, ArrowRight, Loader2, Search, X, CheckCircle, AlertTriangle,
  Shield, FileText, Brain, Eye, BarChart3, Download, Calendar, Clock,
  Target, Zap, XCircle, ChevronDown, ChevronUp, Package, RefreshCw,
  MessageSquare, Award, TrendingUp, AlertCircle, ListChecks, Play,
  ClipboardList, HelpCircle, ChevronRight, FolderOpen, Star,
} from 'lucide-react';
import { toast } from 'sonner';

// ── Type Definitions ────────────────────────────────────────────────────────

type WizardStep = 'framework' | 'analysis' | 'gaps' | 'qa' | 'evidence' | 'summary';

type GapType = 'no_evidence' | 'stale_evidence' | 'missing_policy' | 'partial_implementation' | 'no_testing';
type GapPriority = 'critical' | 'high' | 'medium' | 'low';

interface ControlDomain {
  name: string;
  score: number;
  totalControls: number;
  passingControls: number;
  gaps: number;
}

interface ReadinessAnalysis {
  overallScore: number;
  frameworkName: string;
  domains: ControlDomain[];
  totalControls: number;
  passingControls: number;
  gapsCount: number;
  evidenceCount: number;
  staleEvidenceCount: number;
  estimatedDaysToReady: number;
  lastAnalyzedAt: string;
}

interface Gap {
  id: string;
  controlId: string;
  controlName: string;
  domain: string;
  gapType: GapType;
  priority: GapPriority;
  description: string;
  remediation: string;
  estimatedEffort: string;
  assignee?: string;
  dueDate?: string;
  status: 'open' | 'in_progress' | 'resolved';
}

interface MockQuestion {
  id: string;
  question: string;
  suggestedAnswer: string;
  domain: string;
  difficulty: 'easy' | 'medium' | 'hard';
  controlReference?: string;
  tips: string[];
}

interface EvidencePackageItem {
  id: string;
  controlName: string;
  evidenceType: string;
  fileName: string;
  status: 'included' | 'missing' | 'stale';
  lastUpdated?: string;
  selected: boolean;
}

interface ExecutiveSummary {
  overallReadiness: string;
  score: number;
  strengths: string[];
  weaknesses: string[];
  keyRisks: string[];
  recommendations: string[];
  timeline: string;
  narrative: string;
}

const GAP_TYPE_CONFIG: Record<GapType, { label: string; color: string; icon: React.ReactNode }> = {
  no_evidence: { label: 'No Evidence', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300', icon: <XCircle className="w-4 h-4" /> },
  stale_evidence: { label: 'Stale Evidence', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300', icon: <Clock className="w-4 h-4" /> },
  missing_policy: { label: 'Missing Policy', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300', icon: <FileText className="w-4 h-4" /> },
  partial_implementation: { label: 'Partial Implementation', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300', icon: <AlertCircle className="w-4 h-4" /> },
  no_testing: { label: 'No Testing', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300', icon: <Target className="w-4 h-4" /> },
};

const PRIORITY_CONFIG: Record<GapPriority, { label: string; color: string }> = {
  critical: { label: 'Critical', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' },
  high: { label: 'High', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' },
  medium: { label: 'Medium', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' },
  low: { label: 'Low', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
};

const FRAMEWORKS_LIST = [
  { id: 'soc2', name: 'SOC 2 Type II', description: 'Service Organization Control 2' },
  { id: 'iso27001', name: 'ISO 27001', description: 'Information Security Management' },
  { id: 'gdpr', name: 'GDPR', description: 'General Data Protection Regulation' },
  { id: 'hipaa', name: 'HIPAA', description: 'Health Insurance Portability and Accountability' },
  { id: 'pci', name: 'PCI DSS', description: 'Payment Card Industry Data Security Standard' },
  { id: 'nist', name: 'NIST CSF', description: 'Cybersecurity Framework' },
  { id: 'ccpa', name: 'CCPA/CPRA', description: 'California Consumer Privacy Act' },
  { id: 'dora', name: 'DORA', description: 'Digital Operational Resilience Act' },
];

const WIZARD_STEPS: { key: WizardStep; label: string; icon: React.ReactNode }[] = [
  { key: 'framework', label: 'Framework', icon: <Shield className="w-4 h-4" /> },
  { key: 'analysis', label: 'Readiness', icon: <BarChart3 className="w-4 h-4" /> },
  { key: 'gaps', label: 'Gaps', icon: <AlertTriangle className="w-4 h-4" /> },
  { key: 'qa', label: 'Mock Q&A', icon: <MessageSquare className="w-4 h-4" /> },
  { key: 'evidence', label: 'Evidence', icon: <Package className="w-4 h-4" /> },
  { key: 'summary', label: 'Summary', icon: <Award className="w-4 h-4" /> },
];

// ── Main Component ──────────────────────────────────────────────────────────

const AuditPrepAssistant: React.FC = () => {
  const { user } = useAuth();
  const [step, setStep] = useState<WizardStep>('framework');
  const [selectedFramework, setSelectedFramework] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Data
  const [analysis, setAnalysis] = useState<ReadinessAnalysis | null>(null);
  const [gaps, setGaps] = useState<Gap[]>([]);
  const [mockQuestions, setMockQuestions] = useState<MockQuestion[]>([]);
  const [evidenceItems, setEvidenceItems] = useState<EvidencePackageItem[]>([]);
  const [executiveSummary, setExecutiveSummary] = useState<ExecutiveSummary | null>(null);

  // UI state
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);
  const [gapFilter, setGapFilter] = useState<GapPriority | 'all'>('all');
  const [gapTypeFilter, setGapTypeFilter] = useState<GapType | 'all'>('all');
  const [exportingEvidence, setExportingEvidence] = useState(false);
  const [expandedDomain, setExpandedDomain] = useState<string | null>(null);

  const currentStepIdx = WIZARD_STEPS.findIndex(s => s.key === step);

  const runAnalysis = async () => {
    if (!selectedFramework) return;
    setLoading(true);
    try {
      const res = await api.post('/audit-prep/analyze', { framework: selectedFramework });
      setAnalysis(res.data || {
        overallScore: 0,
        frameworkName: FRAMEWORKS_LIST.find(f => f.id === selectedFramework)?.name || selectedFramework,
        domains: [],
        totalControls: 0,
        passingControls: 0,
        gapsCount: 0,
        evidenceCount: 0,
        staleEvidenceCount: 0,
        estimatedDaysToReady: 0,
        lastAnalyzedAt: new Date().toISOString(),
      });
      setStep('analysis');
    } catch {
      toast.error('Failed to run readiness analysis');
    } finally {
      setLoading(false);
    }
  };

  const loadGaps = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/audit-prep/gaps?framework=${selectedFramework}`);
      setGaps(Array.isArray(res.data) ? res.data : (res.data?.gaps || []));
    } catch {
      setGaps([]);
    } finally {
      setLoading(false);
    }
  };

  const generateMockQA = async () => {
    setGenerating(true);
    try {
      const res = await api.post('/audit-prep/mock-qa', { framework: selectedFramework });
      setMockQuestions(Array.isArray(res.data) ? res.data : (res.data?.questions || []));
    } catch {
      toast.error('Failed to generate mock Q&A');
    } finally {
      setGenerating(false);
    }
  };

  const loadEvidencePackage = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/audit-prep/evidence-package?framework=${selectedFramework}`);
      const items = Array.isArray(res.data) ? res.data : (res.data?.items || []);
      setEvidenceItems(items.map((item: any) => ({ ...item, selected: item.status === 'included' })));
    } catch {
      setEvidenceItems([]);
    } finally {
      setLoading(false);
    }
  };

  const generateSummary = async () => {
    setGenerating(true);
    try {
      const res = await api.post('/audit-prep/executive-summary', { framework: selectedFramework });
      setExecutiveSummary(res.data);
    } catch {
      toast.error('Failed to generate executive summary');
    } finally {
      setGenerating(false);
    }
  };

  const exportEvidencePackage = async () => {
    setExportingEvidence(true);
    try {
      const selectedIds = evidenceItems.filter(i => i.selected).map(i => i.id);
      const res = await api.post('/audit-prep/export-evidence', {
        framework: selectedFramework,
        evidenceIds: selectedIds,
      });
      const url = window.URL.createObjectURL(new Blob([JSON.stringify(res)]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `audit-evidence-${selectedFramework}-${new Date().toISOString().split('T')[0]}.zip`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Evidence package exported');
    } catch {
      toast.error('Failed to export evidence package');
    } finally {
      setExportingEvidence(false);
    }
  };

  const goToStep = (targetStep: WizardStep) => {
    const targetIdx = WIZARD_STEPS.findIndex(s => s.key === targetStep);
    if (targetIdx <= currentStepIdx || (targetIdx === currentStepIdx + 1)) {
      if (targetStep === 'gaps' && gaps.length === 0) loadGaps();
      if (targetStep === 'qa' && mockQuestions.length === 0) generateMockQA();
      if (targetStep === 'evidence' && evidenceItems.length === 0) loadEvidencePackage();
      if (targetStep === 'summary' && !executiveSummary) generateSummary();
      setStep(targetStep);
    }
  };

  const nextStep = () => {
    const nextIdx = currentStepIdx + 1;
    if (nextIdx < WIZARD_STEPS.length) {
      goToStep(WIZARD_STEPS[nextIdx].key);
    }
  };

  const prevStep = () => {
    const prevIdx = currentStepIdx - 1;
    if (prevIdx >= 0) {
      setStep(WIZARD_STEPS[prevIdx].key);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    if (score >= 40) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    if (score >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const filteredGaps = useMemo(() => {
    return gaps.filter(g => {
      if (gapFilter !== 'all' && g.priority !== gapFilter) return false;
      if (gapTypeFilter !== 'all' && g.gapType !== gapTypeFilter) return false;
      return true;
    });
  }, [gaps, gapFilter, gapTypeFilter]);

  // ── Render: Framework Selection ───────────────────────────────────────

  const renderFrameworkStep = () => (
    <div className="space-y-6">
      <div className="text-center max-w-2xl mx-auto">
        <div className="w-16 h-16 mx-auto bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mb-4">
          <Shield className="w-8 h-8 text-primary-600 dark:text-primary-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Audit Preparation Assistant</h2>
        <p className="text-gray-500 dark:text-gray-400">Select a framework to begin your audit readiness assessment</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
        {FRAMEWORKS_LIST.map(fw => (
          <button
            key={fw.id}
            onClick={() => setSelectedFramework(fw.id)}
            className={`p-4 border rounded-xl text-left transition ${
              selectedFramework === fw.id
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 ring-2 ring-primary-500'
                : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <Shield className={`w-6 h-6 mb-2 ${selectedFramework === fw.id ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400'}`} />
            <p className="font-semibold text-gray-900 dark:text-white text-sm">{fw.name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{fw.description}</p>
          </button>
        ))}
      </div>

      <div className="flex justify-center">
        <button
          onClick={runAnalysis}
          disabled={!selectedFramework || loading}
          className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Brain className="w-5 h-5" />}
          Start Readiness Analysis
        </button>
      </div>
    </div>
  );

  // ── Render: Analysis Results ──────────────────────────────────────────

  const renderAnalysisStep = () => {
    if (!analysis) return null;
    return (
      <div className="space-y-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">{analysis.frameworkName} Readiness Analysis</h3>

        {/* Overall Score */}
        <div className="bg-white dark:bg-surface-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 text-center">
          <div className="relative w-32 h-32 mx-auto mb-4">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#e5e7eb" strokeWidth="3" className="dark:stroke-gray-700" />
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray={`${analysis.overallScore}, 100`} className={getScoreColor(analysis.overallScore)} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-3xl font-bold ${getScoreColor(analysis.overallScore)}`}>{analysis.overallScore}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">/ 100</span>
            </div>
          </div>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            {analysis.overallScore >= 80 ? 'Audit Ready' : analysis.overallScore >= 60 ? 'Needs Improvement' : 'Not Ready'}
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Controls', value: analysis.totalControls, icon: <ListChecks className="w-5 h-5 text-blue-500" /> },
            { label: 'Passing', value: analysis.passingControls, icon: <CheckCircle className="w-5 h-5 text-green-500" /> },
            { label: 'Gaps Found', value: analysis.gapsCount, icon: <AlertTriangle className="w-5 h-5 text-red-500" /> },
            { label: 'Est. Days to Ready', value: analysis.estimatedDaysToReady, icon: <Calendar className="w-5 h-5 text-purple-500" /> },
          ].map((m, i) => (
            <div key={i} className="bg-white dark:bg-surface-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 text-center">
              <div className="flex justify-center mb-2">{m.icon}</div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{m.value}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{m.label}</p>
            </div>
          ))}
        </div>

        {/* Timeline Calculator */}
        {analysis.gapsCount > 0 && analysis.estimatedDaysToReady > 0 && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex items-center gap-4">
            <Calendar className="w-8 h-8 text-amber-600 dark:text-amber-400 flex-shrink-0" />
            <div>
              <p className="font-semibold text-amber-800 dark:text-amber-300">
                {analysis.gapsCount} gaps to close in {analysis.estimatedDaysToReady} days
              </p>
              <p className="text-sm text-amber-600 dark:text-amber-400">
                Target date: {new Date(Date.now() + analysis.estimatedDaysToReady * 86400000).toLocaleDateString()}
              </p>
            </div>
          </div>
        )}

        {/* Domain Breakdown */}
        <div className="bg-white dark:bg-surface-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Breakdown by Control Domain</h4>
          <div className="space-y-3">
            {(analysis.domains || []).map(domain => (
              <div key={domain.name}>
                <button
                  onClick={() => setExpandedDomain(expandedDomain === domain.name ? null : domain.name)}
                  className="w-full flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-surface-700 rounded-lg transition"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <span className={`text-lg font-bold ${getScoreColor(domain.score)}`}>{domain.score}%</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{domain.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 dark:text-gray-400">{domain.passingControls}/{domain.totalControls} passing</span>
                    {domain.gaps > 0 && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">{domain.gaps} gaps</span>
                    )}
                    {expandedDomain === domain.name ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </div>
                </button>
                <div className="ml-12 mb-1">
                  <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${getScoreBg(domain.score)}`} style={{ width: `${domain.score}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // ── Render: Gaps ──────────────────────────────────────────────────────

  const renderGapsStep = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Gap Identification</h3>
        <div className="flex items-center gap-2">
          <select value={gapFilter} onChange={e => setGapFilter(e.target.value as any)} className="px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-surface-800 text-gray-900 dark:text-white">
            <option value="all">All Priorities</option>
            {Object.entries(PRIORITY_CONFIG).map(([k, v]) => (<option key={k} value={k}>{v.label}</option>))}
          </select>
          <select value={gapTypeFilter} onChange={e => setGapTypeFilter(e.target.value as any)} className="px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-surface-800 text-gray-900 dark:text-white">
            <option value="all">All Types</option>
            {Object.entries(GAP_TYPE_CONFIG).map(([k, v]) => (<option key={k} value={k}>{v.label}</option>))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div>
      ) : filteredGaps.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-surface-800 border border-gray-200 dark:border-gray-700 rounded-xl">
          <CheckCircle className="w-12 h-12 mx-auto text-green-400 mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No gaps found matching your filters</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-surface-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-surface-700">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Control</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Gap Type</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Priority</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Effort</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Remediation</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredGaps.map(gap => {
                const gapTypeConfig = GAP_TYPE_CONFIG[gap.gapType];
                const priorityConfig = PRIORITY_CONFIG[gap.priority];
                return (
                  <tr key={gap.id} className="hover:bg-gray-50 dark:hover:bg-surface-700/50">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{gap.controlName}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{gap.domain}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${gapTypeConfig.color}`}>
                        {gapTypeConfig.icon}
                        {gapTypeConfig.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${priorityConfig.color}`}>{priorityConfig.label}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{gap.estimatedEffort}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 max-w-xs truncate">{gap.remediation}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        gap.status === 'resolved' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                        gap.status === 'in_progress' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
                        'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                      }`}>{gap.status}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Remediation Priority List */}
      {filteredGaps.filter(g => g.priority === 'critical' || g.priority === 'high').length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-5">
          <h4 className="font-semibold text-red-800 dark:text-red-300 mb-3 flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Priority Remediation List
          </h4>
          <ol className="space-y-2">
            {filteredGaps.filter(g => g.priority === 'critical' || g.priority === 'high').map((gap, idx) => (
              <li key={gap.id} className="flex items-start gap-3 text-sm">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200 flex items-center justify-center text-xs font-bold">{idx + 1}</span>
                <div>
                  <p className="font-medium text-red-800 dark:text-red-300">{gap.controlName}</p>
                  <p className="text-red-600 dark:text-red-400 text-xs">{gap.remediation}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );

  // ── Render: Mock Q&A ──────────────────────────────────────────────────

  const renderQAStep = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Mock Audit Q&A</h3>
        <button onClick={generateMockQA} disabled={generating} className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition">
          {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Regenerate
        </button>
      </div>

      {generating ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Brain className="w-10 h-10 mx-auto text-primary-500 mb-3 animate-pulse" />
            <p className="text-gray-500 dark:text-gray-400">Generating mock audit questions...</p>
          </div>
        </div>
      ) : mockQuestions.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-surface-800 border border-gray-200 dark:border-gray-700 rounded-xl">
          <MessageSquare className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No mock questions generated yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {mockQuestions.map((q, idx) => (
            <div key={q.id || idx} className="bg-white dark:bg-surface-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
              <button
                onClick={() => setExpandedQuestion(expandedQuestion === q.id ? null : q.id)}
                className="w-full flex items-start gap-3 p-4 text-left hover:bg-gray-50 dark:hover:bg-surface-700/50 transition"
              >
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 flex items-center justify-center text-sm font-bold">{idx + 1}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{q.question}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-500 dark:text-gray-400">{q.domain}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${
                      q.difficulty === 'hard' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' :
                      q.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' :
                      'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                    }`}>{q.difficulty}</span>
                  </div>
                </div>
                {expandedQuestion === q.id ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
              </button>
              {expandedQuestion === q.id && (
                <div className="px-4 pb-4 space-y-3 border-t border-gray-200 dark:border-gray-700 pt-3">
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-1">Suggested Answer</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-surface-700 p-3 rounded-lg">{q.suggestedAnswer}</p>
                  </div>
                  {q.tips && q.tips.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-1">Tips</p>
                      <ul className="space-y-1">
                        {q.tips.map((tip, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <Star className="w-3 h-3 text-yellow-500 mt-0.5 flex-shrink-0" />
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {q.controlReference && (
                    <p className="text-xs text-gray-400">Control: {q.controlReference}</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // ── Render: Evidence Package ──────────────────────────────────────────

  const renderEvidenceStep = () => {
    const selectedCount = evidenceItems.filter(i => i.selected).length;
    const missingCount = evidenceItems.filter(i => i.status === 'missing').length;
    const staleCount = evidenceItems.filter(i => i.status === 'stale').length;

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Evidence Package Builder</h3>
          <button
            onClick={exportEvidencePackage}
            disabled={exportingEvidence || selectedCount === 0}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-50"
          >
            {exportingEvidence ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Export ZIP ({selectedCount} items)
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-green-700 dark:text-green-300">{evidenceItems.filter(i => i.status === 'included').length}</p>
            <p className="text-sm text-green-600 dark:text-green-400">Current</p>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">{staleCount}</p>
            <p className="text-sm text-yellow-600 dark:text-yellow-400">Stale</p>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-red-700 dark:text-red-300">{missingCount}</p>
            <p className="text-sm text-red-600 dark:text-red-400">Missing</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div>
        ) : evidenceItems.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-surface-800 border border-gray-200 dark:border-gray-700 rounded-xl">
            <Package className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No evidence items found</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-surface-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-surface-700 border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setEvidenceItems(prev => prev.map(i => ({ ...i, selected: !prev.every(p => p.selected) })))}
                className="text-xs text-primary-600 dark:text-primary-400 hover:underline"
              >
                {evidenceItems.every(i => i.selected) ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-700 max-h-96 overflow-y-auto">
              {evidenceItems.map(item => (
                <div key={item.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-surface-700/50">
                  <input
                    type="checkbox"
                    checked={item.selected}
                    onChange={() => setEvidenceItems(prev => prev.map(i => i.id === item.id ? { ...i, selected: !i.selected } : i))}
                    className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{item.controlName}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{item.fileName} &middot; {item.evidenceType}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    item.status === 'included' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                    item.status === 'stale' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' :
                    'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                  }`}>{item.status}</span>
                  {item.lastUpdated && (
                    <span className="text-xs text-gray-400 dark:text-gray-500">{new Date(item.lastUpdated).toLocaleDateString()}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // ── Render: Executive Summary ─────────────────────────────────────────

  const renderSummaryStep = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Executive Readiness Summary</h3>
        <button onClick={generateSummary} disabled={generating} className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition">
          {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Regenerate
        </button>
      </div>

      {generating ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Brain className="w-10 h-10 mx-auto text-primary-500 mb-3 animate-pulse" />
            <p className="text-gray-500 dark:text-gray-400">Generating executive summary...</p>
          </div>
        </div>
      ) : !executiveSummary ? (
        <div className="text-center py-20 bg-white dark:bg-surface-800 border border-gray-200 dark:border-gray-700 rounded-xl">
          <Award className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No summary generated yet</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Readiness Badge */}
          <div className="bg-white dark:bg-surface-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 text-center">
            <Award className={`w-12 h-12 mx-auto mb-3 ${getScoreColor(executiveSummary.score)}`} />
            <p className={`text-3xl font-bold ${getScoreColor(executiveSummary.score)}`}>{executiveSummary.score}/100</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white mt-2">{executiveSummary.overallReadiness}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{executiveSummary.timeline}</p>
          </div>

          {/* Narrative */}
          <div className="bg-white dark:bg-surface-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Summary</h4>
            <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{executiveSummary.narrative}</p>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* Strengths */}
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-5">
              <h4 className="font-semibold text-green-800 dark:text-green-300 mb-3 flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Strengths
              </h4>
              <ul className="space-y-2">
                {(executiveSummary.strengths || []).map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-green-700 dark:text-green-300">
                    <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
            {/* Weaknesses */}
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-5">
              <h4 className="font-semibold text-red-800 dark:text-red-300 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Weaknesses
              </h4>
              <ul className="space-y-2">
                {(executiveSummary.weaknesses || []).map((w, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-red-700 dark:text-red-300">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    {w}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Recommendations */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-5">
            <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-3 flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Recommendations
            </h4>
            <ol className="space-y-2">
              {(executiveSummary.recommendations || []).map((r, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-blue-700 dark:text-blue-300">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 flex items-center justify-center text-xs font-bold">{i + 1}</span>
                  {r}
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </div>
  );

  // ── Main Render ─────────────────────────────────────────────────────────

  return (
    <div className="bg-white dark:bg-surface-800 min-h-screen">
      <div className="max-w-6xl mx-auto p-6">
        {/* Wizard Steps Header */}
        {step !== 'framework' && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-6">
              {WIZARD_STEPS.map((s, idx) => {
                const isActive = s.key === step;
                const isCompleted = idx < currentStepIdx;
                const isClickable = idx <= currentStepIdx || idx === currentStepIdx + 1;
                return (
                  <React.Fragment key={s.key}>
                    <button
                      onClick={() => isClickable && goToStep(s.key)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
                        isActive ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300' :
                        isCompleted ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' :
                        isClickable ? 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700' :
                        'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                      }`}
                      disabled={!isClickable}
                    >
                      {isCompleted ? <CheckCircle className="w-4 h-4" /> : s.icon}
                      <span className="hidden md:inline">{s.label}</span>
                    </button>
                    {idx < WIZARD_STEPS.length - 1 && (
                      <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600" />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        )}

        {/* Step Content */}
        {step === 'framework' && renderFrameworkStep()}
        {step === 'analysis' && renderAnalysisStep()}
        {step === 'gaps' && renderGapsStep()}
        {step === 'qa' && renderQAStep()}
        {step === 'evidence' && renderEvidenceStep()}
        {step === 'summary' && renderSummaryStep()}

        {/* Navigation */}
        {step !== 'framework' && (
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button onClick={prevStep} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition">
              <ArrowLeft className="w-4 h-4" />
              Previous
            </button>
            {currentStepIdx < WIZARD_STEPS.length - 1 && (
              <button onClick={nextStep} className="flex items-center gap-2 px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition">
                Next
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditPrepAssistant;
