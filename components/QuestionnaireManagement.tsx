import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { isAtLimit, getUpgradeMessage } from '../constants/tierLimits';
import { TierLimitBanner } from './TierLimitBanner';
import ReactMarkdown from 'react-markdown';
import {
  ArrowLeft, Plus, Loader2, Search, X, ChevronDown, ChevronUp,
  FileText, Brain, Edit3, Trash2, CheckCircle, Clock, XCircle,
  Send, Download, ListChecks, HelpCircle, MessageSquare, Zap,
  ClipboardList, Eye, AlertTriangle, Lightbulb, Copy, BarChart3,
  Filter, Check, BookOpen,
} from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  Tooltip, Legend,
} from 'recharts';
import { toast } from 'sonner';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface Questionnaire {
  id: string;
  organizationId: string;
  title: string;
  description?: string;
  questionnaireType: string;
  status: 'Draft' | 'In_Progress' | 'Completed' | 'Reviewed' | 'Approved';
  requestedBy?: string;
  requestDate?: string;
  dueDate?: string;
  aiAssisted: boolean;
  aiConfidence?: number;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  questions: Question[];
  responses: Response[];
}

interface Question {
  id: string;
  questionnaireId: string;
  questionText: string;
  questionType: string;
  category?: string;
  required: boolean;
  options?: any;
  order: number;
}

interface Response {
  id: string;
  questionnaireId: string;
  questionId: string;
  responseText?: string;
  responseData?: any;
  aiGenerated: boolean;
  aiConfidence?: number;
  reviewedByHuman: boolean;
  attachments?: any;
}

interface QTemplate {
  id: string;
  title: string;
  description: string;
  type: string;
  questionCount: number;
  categories: string[];
  questions: any[];
}

interface Metrics {
  total: number;
  byStatus: { draft: number; inProgress: number; completed: number; reviewed: number; approved: number };
  aiAssisted: number;
  averageAIConfidence: number;
  overdue: number;
  completionRate: number;
  averageCompletionTime: number;
}

type ViewMode = 'dashboard' | 'list' | 'detail' | 'create' | 'edit' | 'templates'
  | 'ai-auto-answer' | 'ai-suggest-questions' | 'ai-completeness' | 'ai-rfp-answer';

const STATUS_COLORS: Record<string, string> = {
  Draft: 'bg-gray-100 text-gray-700',
  In_Progress: 'bg-blue-100 text-blue-700',
  Completed: 'bg-green-100 text-green-700',
  Reviewed: 'bg-purple-100 text-purple-700',
  Approved: 'bg-emerald-100 text-emerald-700',
};

const STATUS_LABELS: Record<string, string> = {
  Draft: 'Draft',
  In_Progress: 'In Progress',
  Completed: 'Completed',
  Reviewed: 'Reviewed',
  Approved: 'Approved',
};

const PIE_COLORS = ['#9ca3af', '#3b82f6', '#22c55e', '#06b6d4', '#10b981'];

const QUESTIONNAIRE_TYPES = ['Security Assessment', 'Vendor Assessment', 'Privacy Assessment', 'Compliance Assessment', 'IT Controls', 'Custom'];

// ---------------------------------------------------------------------------
// Confidence Badge Component
// ---------------------------------------------------------------------------
const ConfidenceBadge: React.FC<{ confidence: number }> = ({ confidence }) => {
  const color = confidence >= 0.8 ? 'bg-green-100 text-green-700' : confidence >= 0.5 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700';
  return <span className={`text-xs px-2 py-0.5 rounded-full ${color}`}>{Math.round(confidence * 100)}% confidence</span>;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function QuestionnaireManagement() {
  const { user } = useAuth();
  const { t } = useI18n();
  const plan = user?.organization?.plan || 'Foundation';

  // Core state
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [templates, setTemplates] = useState<QTemplate[]>([]);
  const [selected, setSelected] = useState<Questionnaire | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Filter/search
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterType, setFilterType] = useState('All');

  // Form state
  const [qForm, setQForm] = useState({
    title: '', description: '', questionnaireType: 'Security Assessment',
    requestedBy: '', dueDate: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  // Question/response editing
  const [editingResponseId, setEditingResponseId] = useState<string | null>(null);
  const [responseText, setResponseText] = useState('');

  // New question form
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [newQuestion, setNewQuestion] = useState({ questionText: '', questionType: 'Text', category: '', required: true });

  // AI state
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestedQuestions, setAiSuggestedQuestions] = useState<any[]>([]);
  const [aiCompletenessResult, setAiCompletenessResult] = useState<string | null>(null);
  const [aiRfpQuestion, setAiRfpQuestion] = useState<string | null>(null);
  const [aiRfpResult, setAiRfpResult] = useState<any>(null);
  const [aiAnsweringQuestionId, setAiAnsweringQuestionId] = useState<string | null>(null);

  // Tier limit
  const limitReached = isAtLimit(plan, 'maxQuestionnairesPerMonth', questionnaires.length);

  // ---------------------------------------------------------------------------
  // Data loading
  // ---------------------------------------------------------------------------
  const loadQuestionnaires = useCallback(async () => {
    try {
      const data = await api.enterprise.questionnaires.list();
      setQuestionnaires(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || 'Failed to load questionnaires');
    }
  }, []);

  const loadMetrics = useCallback(async () => {
    try {
      const data = await api.enterprise.questionnaires.getMetrics();
      setMetrics(data);
    } catch { /* supplementary */ }
  }, []);

  const loadTemplates = useCallback(async () => {
    try {
      const data = await api.enterprise.questionnaires.getTemplates();
      setTemplates(Array.isArray(data) ? data : []);
    } catch { /* supplementary */ }
  }, []);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      await Promise.all([loadQuestionnaires(), loadMetrics(), loadTemplates()]);
      setIsLoading(false);
    };
    load();
  }, [loadQuestionnaires, loadMetrics, loadTemplates]);

  // ---------------------------------------------------------------------------
  // Filtering
  // ---------------------------------------------------------------------------
  const filteredQuestionnaires = useMemo(() => {
    let list = [...questionnaires];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(qu => qu.title.toLowerCase().includes(q) || qu.questionnaireType.toLowerCase().includes(q));
    }
    if (filterStatus !== 'All') list = list.filter(qu => qu.status === filterStatus);
    if (filterType !== 'All') list = list.filter(qu => qu.questionnaireType === filterType);
    return list;
  }, [questionnaires, searchQuery, filterStatus, filterType]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isAtLimit(plan, 'maxQuestionnairesPerMonth', questionnaires.length)) {
      toast.warning(getUpgradeMessage(plan, 'maxQuestionnairesPerMonth', questionnaires.length));
      return;
    }
    setIsSaving(true);
    try {
      await api.enterprise.questionnaires.create({
        ...qForm,
        dueDate: qForm.dueDate || undefined,
      });
      await Promise.all([loadQuestionnaires(), loadMetrics()]);
      resetForm();
      setViewMode('list');
    } catch (err: any) {
      setError(err.message || 'Failed to create questionnaire');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateFromTemplate = async (template: QTemplate) => {
    if (isAtLimit(plan, 'maxQuestionnairesPerMonth', questionnaires.length)) {
      toast.warning(getUpgradeMessage(plan, 'maxQuestionnairesPerMonth', questionnaires.length));
      return;
    }
    setIsSaving(true);
    try {
      const created = await api.enterprise.questionnaires.createFromTemplate({
        templateId: template.id,
      });
      await Promise.all([loadQuestionnaires(), loadMetrics()]);
      if (created) {
        setSelected(created);
        setViewMode('detail');
      } else {
        setViewMode('list');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create from template');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    setIsSaving(true);
    try {
      await api.enterprise.questionnaires.update(selected.id, {
        ...qForm,
        dueDate: qForm.dueDate || undefined,
      });
      await loadQuestionnaires();
      setViewMode('detail');
    } catch (err: any) {
      setError(err.message || 'Failed to update');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this questionnaire and all its data?')) return;
    try {
      await api.enterprise.questionnaires.delete(id);
      await Promise.all([loadQuestionnaires(), loadMetrics()]);
      if (selected?.id === id) setViewMode('list');
    } catch (err: any) {
      setError(err.message || 'Failed to delete');
    }
  };

  const handleComplete = async (id: string) => {
    try {
      await api.enterprise.questionnaires.complete(id);
      await Promise.all([loadQuestionnaires(), loadMetrics()]);
      if (selected?.id === id) {
        const updated = await api.enterprise.questionnaires.getById(id);
        setSelected(updated);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to complete questionnaire');
    }
  };

  const handleViewDetail = async (q: Questionnaire) => {
    setSelected(q);
    setViewMode('detail');
    try {
      const full = await api.enterprise.questionnaires.getById(q.id);
      setSelected(full);
    } catch { /* use existing data */ }
  };

  const handleEditQ = (q: Questionnaire) => {
    setSelected(q);
    setQForm({
      title: q.title,
      description: q.description || '',
      questionnaireType: q.questionnaireType,
      requestedBy: q.requestedBy || '',
      dueDate: q.dueDate ? q.dueDate.substring(0, 10) : '',
    });
    setViewMode('edit');
  };

  const handleSubmitResponse = async (questionId: string) => {
    if (!selected || !responseText.trim()) return;
    try {
      await api.enterprise.questionnaires.submitResponse(selected.id, {
        questionId,
        responseText: responseText.trim(),
      });
      const updated = await api.enterprise.questionnaires.getById(selected.id);
      setSelected(updated);
      setEditingResponseId(null);
      setResponseText('');
    } catch (err: any) {
      setError(err.message || 'Failed to submit response');
    }
  };

  const handleAddQuestion = async () => {
    if (!selected || !newQuestion.questionText.trim()) return;
    try {
      await api.enterprise.questionnaires.addQuestions(selected.id, [newQuestion]);
      const updated = await api.enterprise.questionnaires.getById(selected.id);
      setSelected(updated);
      setNewQuestion({ questionText: '', questionType: 'Text', category: '', required: true });
      setShowAddQuestion(false);
    } catch (err: any) {
      setError(err.message || 'Failed to add question');
    }
  };

  const resetForm = () => {
    setQForm({ title: '', description: '', questionnaireType: 'Security Assessment', requestedBy: '', dueDate: '' });
    setSelected(null);
  };

  // ---------------------------------------------------------------------------
  // AI Handlers
  // ---------------------------------------------------------------------------
  const handleAIAutoAnswer = async () => {
    if (!selected) return;
    setAiLoading(true);
    try {
      await api.enterprise.questionnaires.aiGenerate(selected.id);
      const updated = await api.enterprise.questionnaires.getById(selected.id);
      setSelected(updated);
      await loadQuestionnaires();
    } catch (err: any) {
      setError(err.message || 'AI auto-answer failed');
    } finally {
      setAiLoading(false);
    }
  };

  const handleAIRFPAnswer = async (question: Question) => {
    setAiAnsweringQuestionId(question.id);
    setAiRfpResult(null);
    try {
      const result = await api.ai.generateRFPResponse(
        question.questionText,
        `Organization: ${user?.name || 'Our Organization'}. Category: ${question.category || 'General'}.`
      );
      setAiRfpResult({ questionId: question.id, result });
    } catch (err: any) {
      setError(err.message || 'AI RFP answer failed');
    } finally {
      setAiAnsweringQuestionId(null);
    }
  };

  const handleAcceptAIRFP = async (questionId: string, answer: string) => {
    if (!selected) return;
    try {
      await api.enterprise.questionnaires.submitResponse(selected.id, {
        questionId,
        responseText: answer,
      });
      const updated = await api.enterprise.questionnaires.getById(selected.id);
      setSelected(updated);
      setAiRfpResult(null);
    } catch (err: any) {
      setError(err.message || 'Failed to accept AI answer');
    }
  };

  const handleAISuggestQuestions = async () => {
    if (!selected) return;
    setAiLoading(true);
    setAiSuggestedQuestions([]);
    setViewMode('ai-suggest-questions');
    try {
      const existing = selected.questions.map(q => q.questionText).join('; ');
      const result: any = await api.ai.chat(
        `Suggest 10 additional security assessment questions for a ${selected.questionnaireType} questionnaire that covers gaps in: ${existing}. Return ONLY valid JSON array: [{"questionText": "...", "questionType": "Text|Yes/No", "category": "...", "required": true}]`
      );
      const text = typeof result === 'string' ? result : result?.response || result?.message || JSON.stringify(result);
      try {
        const match = text.match(/\[[\s\S]*\]/);
        if (match) {
          setAiSuggestedQuestions(JSON.parse(match[0]));
        }
      } catch {
        setAiSuggestedQuestions([]);
      }
    } catch (err: any) {
      setError(err.message || 'AI suggestion failed');
    } finally {
      setAiLoading(false);
    }
  };

  const handleAddSuggestedQuestion = async (q: any) => {
    if (!selected) return;
    try {
      await api.enterprise.questionnaires.addQuestions(selected.id, [{
        questionText: q.questionText,
        questionType: q.questionType || 'Text',
        category: q.category || 'General',
        required: q.required ?? true,
      }]);
      const updated = await api.enterprise.questionnaires.getById(selected.id);
      setSelected(updated);
      setAiSuggestedQuestions(prev => prev.filter(sq => sq.questionText !== q.questionText));
    } catch (err: any) {
      setError(err.message || 'Failed to add question');
    }
  };

  const handleAICompletenessCheck = async () => {
    if (!selected) return;
    setAiLoading(true);
    setAiCompletenessResult(null);
    setViewMode('ai-completeness');
    try {
      const qa = selected.questions.map(q => {
        const r = selected.responses.find(resp => resp.questionId === q.id);
        return { question: q.questionText, answer: r?.responseText || '(no response)', confidence: r?.aiConfidence || null, reviewed: r?.reviewedByHuman || false };
      });
      const result: any = await api.ai.chat(
        `Review this completed questionnaire for completeness and quality. Flag any vague, incomplete, or low-quality responses. Suggest improvements.\n\nQuestionnaire: ${selected.title} (${selected.questionnaireType})\n\nQ&A:\n${JSON.stringify(qa, null, 2)}\n\nProvide a detailed review with specific improvement suggestions for each flagged response.`
      );
      const text = typeof result === 'string' ? result : result?.response || result?.message || '';
      setAiCompletenessResult(text);
    } catch (err: any) {
      setError(err.message || 'AI completeness check failed');
    } finally {
      setAiLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Helper: get response for question
  // ---------------------------------------------------------------------------
  const getResponse = (questionId: string): Response | undefined => {
    return selected?.responses.find(r => r.questionId === questionId);
  };

  // ---------------------------------------------------------------------------
  // Render: Dashboard
  // ---------------------------------------------------------------------------
  const renderDashboard = () => {
    const statusData = metrics ? [
      { name: 'Draft', value: metrics.byStatus.draft },
      { name: 'In Progress', value: metrics.byStatus.inProgress },
      { name: 'Completed', value: metrics.byStatus.completed },
      { name: 'Reviewed', value: metrics.byStatus.reviewed },
      { name: 'Approved', value: metrics.byStatus.approved },
    ].filter(i => i.value > 0) : [];

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Questionnaire Management</h1>
            <p className="text-gray-500 mt-1">AI-powered questionnaire automation with RFP response generation</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setViewMode('templates')}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
              <BookOpen className="w-4 h-4" /> Templates
            </button>
            <button onClick={() => { resetForm(); setViewMode('create'); }} disabled={limitReached}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              <Plus className="w-4 h-4" /> New Questionnaire
            </button>
          </div>
        </div>

        {limitReached && <TierLimitBanner message={getUpgradeMessage(plan, 'maxQuestionnairesPerMonth', questionnaires.length)} />}

        {/* Stats */}
        {metrics && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {[
              { label: 'Total', value: metrics.total, icon: <ClipboardList className="w-5 h-5 text-blue-600" /> },
              { label: 'Draft', value: metrics.byStatus.draft, icon: <FileText className="w-5 h-5 text-gray-500" /> },
              { label: 'In Progress', value: metrics.byStatus.inProgress, icon: <Clock className="w-5 h-5 text-blue-500" /> },
              { label: 'Completed', value: metrics.byStatus.completed, icon: <CheckCircle className="w-5 h-5 text-green-500" /> },
              { label: 'AI Assisted', value: metrics.aiAssisted, icon: <Brain className="w-5 h-5 text-purple-500" /> },
              { label: 'Overdue', value: metrics.overdue, icon: <AlertTriangle className="w-5 h-5 text-red-500" /> },
              { label: 'Completion', value: `${metrics.completionRate}%`, icon: <BarChart3 className="w-5 h-5 text-emerald-500" /> },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-xl border p-4 flex items-center gap-3">
                {s.icon}
                <div>
                  <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                  <p className="text-xs text-gray-500">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Chart */}
        {statusData.length > 0 && (
          <div className="bg-white rounded-xl border p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Status Distribution</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`}>
                  {statusData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* AI Confidence */}
        {metrics && metrics.averageAIConfidence > 0 && (
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Brain className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-purple-900">Average AI Confidence</p>
                <p className="text-xs text-purple-700">{metrics.aiAssisted} questionnaires assisted by AI</p>
              </div>
            </div>
            <div className="text-2xl font-bold text-purple-900">{Math.round(metrics.averageAIConfidence * 100)}%</div>
          </div>
        )}

        <button onClick={() => setViewMode('list')} className="w-full py-3 text-center text-blue-600 hover:text-blue-800 bg-white rounded-xl border hover:border-blue-200 transition">
          View All Questionnaires ({questionnaires.length})
        </button>
      </div>
    );
  };

  // ---------------------------------------------------------------------------
  // Render: List
  // ---------------------------------------------------------------------------
  const renderList = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={() => setViewMode('dashboard')} className="flex items-center gap-1 text-gray-600 hover:text-gray-900">
          <ArrowLeft className="w-4 h-4" /> Dashboard
        </button>
        <div className="flex gap-2">
          <button onClick={() => setViewMode('templates')} className="flex items-center gap-1 px-3 py-1.5 text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200">
            <BookOpen className="w-3.5 h-3.5" /> Templates
          </button>
          <button onClick={() => { resetForm(); setViewMode('create'); }} disabled={limitReached}
            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
            <Plus className="w-3.5 h-3.5" /> New
          </button>
        </div>
      </div>

      {limitReached && <TierLimitBanner message={getUpgradeMessage(plan, 'maxQuestionnairesPerMonth', questionnaires.length)} />}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search questionnaires..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm" />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="border rounded-lg px-3 py-2 text-sm">
          <option value="All">{t('common.all')} {t('common.status')}</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={filterType} onChange={e => setFilterType(e.target.value)} className="border rounded-lg px-3 py-2 text-sm">
          <option value="All">{t('common.all')} {t('common.type')}</option>
          {QUESTIONNAIRE_TYPES.map(qt => <option key={qt} value={qt}>{qt}</option>)}
        </select>
      </div>

      {/* List */}
      <div className="space-y-2">
        {filteredQuestionnaires.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border">
            <ClipboardList className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No questionnaires found</p>
          </div>
        )}
        {filteredQuestionnaires.map(q => {
          const answeredCount = q.responses?.length || 0;
          const totalCount = q.questions?.length || 0;
          const progress = totalCount > 0 ? Math.round((answeredCount / totalCount) * 100) : 0;
          return (
            <div key={q.id} className="bg-white rounded-xl border p-4 hover:border-blue-200 transition">
              <div className="flex items-center justify-between">
                <div className="cursor-pointer flex-1" onClick={() => handleViewDetail(q)}>
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-gray-900">{q.title}</h4>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[q.status]}`}>{STATUS_LABELS[q.status]}</span>
                    {q.aiAssisted && <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">AI Assisted</span>}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span>{q.questionnaireType}</span>
                    <span>·</span>
                    <span>{totalCount} questions</span>
                    <span>·</span>
                    <span>{answeredCount} answered</span>
                    {q.dueDate && (
                      <>
                        <span>·</span>
                        <span>Due: {new Date(q.dueDate).toLocaleDateString()}</span>
                      </>
                    )}
                  </div>
                  {totalCount > 0 && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-1.5 max-w-[200px]">
                        <div className="h-1.5 rounded-full bg-blue-500" style={{ width: `${progress}%` }} />
                      </div>
                      <span className="text-xs text-gray-500">{progress}%</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 ml-4">
                  <button onClick={() => handleEditQ(q)} className="p-1.5 rounded hover:bg-gray-100 text-gray-600" title="Edit">
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(q.id)} className="p-1.5 rounded hover:bg-red-50 text-red-600" title="Delete">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  // ---------------------------------------------------------------------------
  // Render: Detail
  // ---------------------------------------------------------------------------
  const renderDetail = () => {
    if (!selected) return null;
    const q = selected;
    const questions = [...(q.questions || [])].sort((a, b) => a.order - b.order);
    const answeredCount = q.responses?.length || 0;
    const totalCount = questions.length;

    // Group by category
    const categories = [...new Set(questions.map(qu => qu.category || 'General'))];

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <button onClick={() => setViewMode('list')} className="flex items-center gap-1 text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <div className="flex gap-2">
            <button onClick={handleAIAutoAnswer} disabled={aiLoading || totalCount === 0}
              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50">
              {aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Brain className="w-3.5 h-3.5" />} AI Auto-Answer All
            </button>
            <button onClick={handleAISuggestQuestions} disabled={aiLoading}
              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 disabled:opacity-50">
              <Lightbulb className="w-3.5 h-3.5" /> AI Suggest Questions
            </button>
            <button onClick={handleAICompletenessCheck} disabled={aiLoading || answeredCount === 0}
              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 disabled:opacity-50">
              <ListChecks className="w-3.5 h-3.5" /> AI Review Completeness
            </button>
            {q.status !== 'Completed' && q.status !== 'Approved' && (
              <button onClick={() => handleComplete(q.id)} disabled={answeredCount === 0}
                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
                <CheckCircle className="w-3.5 h-3.5" /> Complete
              </button>
            )}
          </div>
        </div>

        {/* Header */}
        <div className="bg-white rounded-xl border p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xl font-bold text-gray-900">{q.title}</h2>
                <span className={`text-xs px-2.5 py-1 rounded-full ${STATUS_COLORS[q.status]}`}>{STATUS_LABELS[q.status]}</span>
                {q.aiAssisted && q.aiConfidence !== null && <ConfidenceBadge confidence={q.aiConfidence} />}
              </div>
              {q.description && <p className="text-sm text-gray-600 mt-1">{q.description}</p>}
              <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
                <span>{q.questionnaireType}</span>
                <span>{totalCount} questions · {answeredCount} answered</span>
                {q.requestedBy && <span>Requested by: {q.requestedBy}</span>}
                {q.dueDate && <span>Due: {new Date(q.dueDate).toLocaleDateString()}</span>}
              </div>
            </div>
            <button onClick={() => handleEditQ(q)} className="p-2 rounded hover:bg-gray-100">
              <Edit3 className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Questions grouped by category */}
        {categories.map(cat => {
          const catQuestions = questions.filter(qu => (qu.category || 'General') === cat);
          return (
            <div key={cat} className="bg-white rounded-xl border p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{cat}</span>
                <span className="text-xs text-gray-400">{catQuestions.length} questions</span>
              </h3>
              <div className="space-y-4">
                {catQuestions.map((question, qi) => {
                  const response = getResponse(question.id);
                  const isEditing = editingResponseId === question.id;
                  const isAIAnswering = aiAnsweringQuestionId === question.id;
                  const rfpMatch = aiRfpResult?.questionId === question.id;

                  return (
                    <div key={question.id} className="border-b pb-4 last:border-b-0 last:pb-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {question.order}. {question.questionText}
                            {question.required && <span className="text-red-500 ml-1">*</span>}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">{question.questionType}</p>
                        </div>
                        <div className="flex items-center gap-1 ml-2">
                          <button onClick={() => handleAIRFPAnswer(question)} disabled={isAIAnswering}
                            className="p-1 rounded hover:bg-purple-50 text-purple-600 disabled:opacity-50" title="AI Answer">
                            {isAIAnswering ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Brain className="w-3.5 h-3.5" />}
                          </button>
                          <button onClick={() => { setEditingResponseId(question.id); setResponseText(response?.responseText || ''); }}
                            className="p-1 rounded hover:bg-gray-100 text-gray-600" title="Edit Response">
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Response display */}
                      {response && !isEditing && (
                        <div className={`p-3 rounded-lg text-sm ${response.aiGenerated ? 'bg-purple-50 border border-purple-100' : 'bg-gray-50'}`}>
                          <p className="text-gray-700">{response.responseText}</p>
                          <div className="flex items-center gap-2 mt-2">
                            {response.aiGenerated && (
                              <>
                                <span className="text-xs text-purple-600">AI Generated</span>
                                {response.aiConfidence !== null && <ConfidenceBadge confidence={response.aiConfidence} />}
                              </>
                            )}
                            <label className="flex items-center gap-1 text-xs cursor-pointer ml-auto">
                              <input type="checkbox" checked={response.reviewedByHuman} readOnly className="rounded" />
                              <span className="text-gray-500">Reviewed by Human</span>
                            </label>
                          </div>
                        </div>
                      )}

                      {/* Inline edit */}
                      {isEditing && (
                        <div className="mt-2 space-y-2">
                          <textarea value={responseText} onChange={e => setResponseText(e.target.value)}
                            className="w-full border rounded-lg px-3 py-2 text-sm" rows={3} placeholder="Enter response..." />
                          <div className="flex gap-2">
                            <button onClick={() => handleSubmitResponse(question.id)}
                              className="px-3 py-1 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1">
                              <Send className="w-3 h-3" /> {t('common.save')}
                            </button>
                            <button onClick={() => setEditingResponseId(null)} className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">{t('common.cancel')}</button>
                          </div>
                        </div>
                      )}

                      {/* No response */}
                      {!response && !isEditing && (
                        <button onClick={() => { setEditingResponseId(question.id); setResponseText(''); }}
                          className="text-xs text-blue-600 hover:text-blue-800 mt-1">
                          + Add Response
                        </button>
                      )}

                      {/* AI RFP result for this question */}
                      {rfpMatch && aiRfpResult.result && (
                        <div className="mt-2 bg-indigo-50 border border-indigo-200 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <Brain className="w-4 h-4 text-indigo-600" />
                            <span className="text-xs font-medium text-indigo-800">AI RFP Response</span>
                          </div>
                          <div className="text-sm text-gray-700 prose prose-sm max-w-none">
                            <ReactMarkdown>{typeof aiRfpResult.result === 'string' ? aiRfpResult.result : aiRfpResult.result.response || aiRfpResult.result.answer || JSON.stringify(aiRfpResult.result)}</ReactMarkdown>
                          </div>
                          <div className="flex gap-2 mt-2">
                            <button onClick={() => handleAcceptAIRFP(question.id, typeof aiRfpResult.result === 'string' ? aiRfpResult.result : aiRfpResult.result.response || aiRfpResult.result.answer || '')}
                              className="px-3 py-1 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-1">
                              <Check className="w-3 h-3" /> Accept
                            </button>
                            <button onClick={() => { setEditingResponseId(question.id); setResponseText(typeof aiRfpResult.result === 'string' ? aiRfpResult.result : aiRfpResult.result.response || ''); setAiRfpResult(null); }}
                              className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200">{t('common.edit')}</button>
                            <button onClick={() => setAiRfpResult(null)} className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">Dismiss</button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Add question */}
        {showAddQuestion ? (
          <div className="bg-white rounded-xl border p-6">
            <h3 className="font-semibold text-gray-900 mb-3">Add New Question</h3>
            <div className="space-y-3">
              <textarea value={newQuestion.questionText} onChange={e => setNewQuestion(q => ({ ...q, questionText: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm" rows={2} placeholder="Question text..." />
              <div className="grid grid-cols-3 gap-3">
                <select value={newQuestion.questionType} onChange={e => setNewQuestion(q => ({ ...q, questionType: e.target.value }))}
                  className="border rounded-lg px-3 py-2 text-sm">
                  <option value="Text">Text</option>
                  <option value="Yes/No">Yes/No</option>
                  <option value="Multiple Choice">Multiple Choice</option>
                </select>
                <input type="text" value={newQuestion.category} onChange={e => setNewQuestion(q => ({ ...q, category: e.target.value }))}
                  className="border rounded-lg px-3 py-2 text-sm" placeholder="Category" />
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={newQuestion.required} onChange={e => setNewQuestion(q => ({ ...q, required: e.target.checked }))} />
                  {t('common.required')}
                </label>
              </div>
              <div className="flex gap-2">
                <button onClick={handleAddQuestion} className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">{t('common.add')}</button>
                <button onClick={() => setShowAddQuestion(false)} className="px-4 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">{t('common.cancel')}</button>
              </div>
            </div>
          </div>
        ) : (
          <button onClick={() => setShowAddQuestion(true)} className="w-full py-3 text-center text-blue-600 hover:text-blue-800 bg-white rounded-xl border border-dashed hover:border-blue-300 transition">
            <Plus className="w-4 h-4 inline mr-1" /> Add Question
          </button>
        )}
      </div>
    );
  };

  // ---------------------------------------------------------------------------
  // Render: Create / Edit Form
  // ---------------------------------------------------------------------------
  const renderForm = (isEdit: boolean) => (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => { setViewMode(isEdit ? 'detail' : 'list'); if (!isEdit) resetForm(); }} className="flex items-center gap-1 text-gray-600 hover:text-gray-900">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <h2 className="text-xl font-bold text-gray-900">{isEdit ? 'Edit Questionnaire' : 'Create Questionnaire'}</h2>
      </div>

      <form onSubmit={isEdit ? handleUpdate : handleCreate} className="bg-white rounded-xl border p-6 space-y-4 max-w-2xl">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
          <input type="text" required value={qForm.title} onChange={e => setQForm(f => ({ ...f, title: e.target.value }))}
            className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="e.g., Annual Vendor Security Assessment" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.description')}</label>
          <textarea value={qForm.description} onChange={e => setQForm(f => ({ ...f, description: e.target.value }))}
            className="w-full border rounded-lg px-3 py-2 text-sm" rows={3} placeholder="Describe the purpose of this questionnaire..." />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.type')}</label>
            <select value={qForm.questionnaireType} onChange={e => setQForm(f => ({ ...f, questionnaireType: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 text-sm">
              {QUESTIONNAIRE_TYPES.map(qt => <option key={qt} value={qt}>{qt}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
            <input type="date" value={qForm.dueDate} onChange={e => setQForm(f => ({ ...f, dueDate: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 text-sm" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Requested By</label>
          <input type="text" value={qForm.requestedBy} onChange={e => setQForm(f => ({ ...f, requestedBy: e.target.value }))}
            className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="e.g., Procurement Team" />
        </div>
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={isSaving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
            {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
            {isEdit ? 'Update' : 'Create Questionnaire'}
          </button>
          <button type="button" onClick={() => { setViewMode(isEdit ? 'detail' : 'list'); if (!isEdit) resetForm(); }}
            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">{t('common.cancel')}</button>
        </div>
      </form>
    </div>
  );

  // ---------------------------------------------------------------------------
  // Render: Templates
  // ---------------------------------------------------------------------------
  const renderTemplates = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => setViewMode('dashboard')} className="flex items-center gap-1 text-gray-600 hover:text-gray-900">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <BookOpen className="w-5 h-5 text-purple-600" />
        <h2 className="text-xl font-bold text-gray-900">Questionnaire Templates</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {templates.map(tpl => (
          <div key={tpl.id} className="bg-white rounded-xl border p-5 hover:border-purple-200 transition">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h4 className="font-semibold text-gray-900">{tpl.title}</h4>
                <p className="text-xs text-gray-500 mt-0.5">{tpl.type} · {tpl.questionCount} questions</p>
              </div>
              <button onClick={() => handleCreateFromTemplate(tpl)} disabled={limitReached || isSaving}
                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 shrink-0">
                {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Copy className="w-3.5 h-3.5" />} Use
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-3">{tpl.description}</p>
            <div className="flex flex-wrap gap-1">
              {tpl.categories.map((cat, i) => (
                <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{cat}</span>
              ))}
            </div>
          </div>
        ))}
        {templates.length === 0 && (
          <div className="col-span-2 text-center py-12 bg-white rounded-xl border">
            <BookOpen className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No templates available</p>
          </div>
        )}
      </div>
    </div>
  );

  // ---------------------------------------------------------------------------
  // Render: AI Suggest Questions
  // ---------------------------------------------------------------------------
  const renderAISuggestQuestions = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => { if (selected) setViewMode('detail'); else setViewMode('list'); }} className="flex items-center gap-1 text-gray-600 hover:text-gray-900">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <Lightbulb className="w-5 h-5 text-indigo-600" />
        <h2 className="text-xl font-bold text-gray-900">AI Suggested Questions</h2>
      </div>

      {aiLoading && (
        <div className="flex items-center justify-center py-16 bg-white rounded-xl border">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mr-3" />
          <span className="text-gray-600">AI is analyzing gaps in your questionnaire...</span>
        </div>
      )}

      {!aiLoading && aiSuggestedQuestions.length > 0 && (
        <div className="space-y-3">
          {aiSuggestedQuestions.map((q, i) => (
            <div key={i} className="bg-white rounded-xl border p-4 hover:border-indigo-200 transition">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{q.questionText}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{q.category || 'General'}</span>
                    <span className="text-xs text-gray-500">{q.questionType || 'Text'}</span>
                    {q.required && <span className="text-xs text-red-500">Required</span>}
                  </div>
                </div>
                <button onClick={() => handleAddSuggestedQuestion(q)}
                  className="ml-3 flex items-center gap-1 px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shrink-0">
                  <Plus className="w-3.5 h-3.5" /> Add
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!aiLoading && aiSuggestedQuestions.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border">
          <Lightbulb className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No suggestions available. Try again later.</p>
        </div>
      )}
    </div>
  );

  // ---------------------------------------------------------------------------
  // Render: AI Completeness Check
  // ---------------------------------------------------------------------------
  const renderAICompleteness = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => { if (selected) setViewMode('detail'); else setViewMode('list'); }} className="flex items-center gap-1 text-gray-600 hover:text-gray-900">
          <ArrowLeft className="w-4 h-4" /> Back to {selected?.title || 'Detail'}
        </button>
        <ListChecks className="w-5 h-5 text-green-600" />
        <h2 className="text-xl font-bold text-gray-900">AI Completeness Review</h2>
      </div>

      {aiLoading && (
        <div className="flex items-center justify-center py-16 bg-white rounded-xl border">
          <Loader2 className="w-8 h-8 animate-spin text-green-600 mr-3" />
          <span className="text-gray-600">AI is reviewing your responses for completeness...</span>
        </div>
      )}

      {!aiLoading && aiCompletenessResult && (
        <div className="bg-white rounded-xl border p-6">
          <div className="prose prose-sm max-w-none">
            <ReactMarkdown>{aiCompletenessResult}</ReactMarkdown>
          </div>
        </div>
      )}

      {!aiLoading && !aiCompletenessResult && (
        <div className="text-center py-12 bg-white rounded-xl border">
          <ListChecks className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No review results available.</p>
        </div>
      )}
    </div>
  );

  // ---------------------------------------------------------------------------
  // Main render
  // ---------------------------------------------------------------------------
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between">
          <span className="text-sm">{error}</span>
          <button onClick={() => setError('')}><X className="w-4 h-4" /></button>
        </div>
      )}

      {viewMode === 'dashboard' && renderDashboard()}
      {viewMode === 'list' && renderList()}
      {viewMode === 'detail' && renderDetail()}
      {viewMode === 'create' && renderForm(false)}
      {viewMode === 'edit' && renderForm(true)}
      {viewMode === 'templates' && renderTemplates()}
      {viewMode === 'ai-suggest-questions' && renderAISuggestQuestions()}
      {viewMode === 'ai-completeness' && renderAICompleteness()}
    </div>
  );
}
