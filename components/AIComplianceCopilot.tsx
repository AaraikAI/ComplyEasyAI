import React, { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../services/api';
import { logger } from '../utils/logger';
import { useI18n } from '../contexts/I18nContext';
import {
  X,
  Send,
  Bot,
  Sparkles,
  AlertTriangle,
  Clock,
  CheckCircle2,
  ChevronRight,
  Shield,
  FileText,
  TrendingUp,
  AlertCircle,
  Lightbulb,
  Target,
  BarChart3,
  Calendar,
  ExternalLink,
  ThumbsUp,
  ThumbsDown,
  Copy,
  BookOpen,
  Zap,
  ArrowRight,
  RefreshCw,
  Star,
  Info,
  Loader2,
  MessageSquare,
  Search,
  ChevronDown,
  ChevronUp,
  Bookmark,
  Link2,
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────────

interface CopilotSuggestion {
  id: string;
  title: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  category: 'action' | 'gap' | 'deadline' | 'insight';
  actionLabel?: string;
  actionTarget?: string;
  confidence: number;
  source?: string;
}

interface CopilotMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  confidence?: number;
  sources?: Array<{ title: string; reference: string }>;
  followUpQuestions?: string[];
}

interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  description: string;
  action: string;
}

interface DeadlineItem {
  id: string;
  title: string;
  framework: string;
  dueDate: string;
  daysRemaining: number;
  status: 'on-track' | 'at-risk' | 'overdue';
}

interface AIComplianceCopilotProps {
  currentView: string;
  isOpen: boolean;
  onClose: () => void;
}

// ─── Context Engine Data ────────────────────────────────────────────────────────

// Maps the backend visionary-AI recommendation priority/impact to a UI category
// so live recommendations render with the right icon and accent.
function mapRecommendationToSuggestion(rec: any, idx: number): CopilotSuggestion {
  const rawPriority = String(rec?.priority || 'medium').toLowerCase();
  const priority: CopilotSuggestion['priority'] =
    rawPriority === 'critical' ? 'critical' :
    rawPriority === 'high' ? 'high' :
    rawPriority === 'low' ? 'low' : 'medium';
  const cat = String(rec?.category || '').toLowerCase();
  const category: CopilotSuggestion['category'] =
    cat.includes('risk') ? 'gap' :
    cat.includes('deadline') || cat.includes('audit') ? 'deadline' :
    cat.includes('insight') || cat.includes('benchmark') ? 'insight' : 'action';
  return {
    id: rec?.id || `rec-${idx + 1}`,
    title: rec?.title || 'Recommendation',
    description: rec?.description || rec?.recommendation || '',
    priority,
    category,
    actionLabel: rec?.actionLabel,
    actionTarget: rec?.actionTarget,
    confidence: typeof rec?.confidence === 'number' ? rec.confidence : 0.9,
    source: rec?.source || rec?.category || 'Compliance Co-Pilot',
  };
}

const QUICK_ACTIONS: QuickAction[] = [
  { id: 'qa-1', label: 'Run Gap Analysis', icon: <Target size={14} />, description: 'Identify compliance gaps across frameworks', action: 'ai-gap' },
  { id: 'qa-2', label: 'Generate Policy', icon: <FileText size={14} />, description: 'Create a new compliance policy', action: 'ai-policy' },
  { id: 'qa-3', label: 'Check Evidence', icon: <CheckCircle2 size={14} />, description: 'Verify evidence completeness', action: 'evidence-checker' },
  { id: 'qa-4', label: 'Simulate Audit', icon: <Shield size={14} />, description: 'Run an AI audit simulation', action: 'audit-simulator' },
  { id: 'qa-5', label: 'Assess Vendor', icon: <BarChart3 size={14} />, description: 'Score vendor risk posture', action: 'ai-vendor' },
  { id: 'qa-6', label: 'View Deadlines', icon: <Calendar size={14} />, description: 'See upcoming compliance deadlines', action: 'deadlines' },
];

// Maps a backend complianceDeadline record to the UI DeadlineItem shape,
// deriving days-remaining and on-track/at-risk/overdue status from the due date.
function mapDeadline(d: any): DeadlineItem {
  const due = new Date(d?.dueDate);
  const msPerDay = 1000 * 60 * 60 * 24;
  const daysRemaining = Math.ceil((due.getTime() - Date.now()) / msPerDay);
  const status: DeadlineItem['status'] =
    daysRemaining < 0 ? 'overdue' : daysRemaining <= 30 ? 'at-risk' : 'on-track';
  return {
    id: d?.id || String(d?.dueDate),
    title: d?.title || 'Compliance Deadline',
    framework: d?.framework || d?.type || 'General',
    dueDate: d?.dueDate,
    daysRemaining,
    status,
  };
}

const EXAMPLE_QUERIES = [
  'Am I GDPR compliant in France?',
  'What controls am I missing for SOC 2?',
  'Show me all high-risk vendors',
  'When is my next audit deadline?',
  'How do I improve my ISO 27001 score?',
  'What evidence is stale or missing?',
];

// ─── Helper Components ──────────────────────────────────────────────────────────

const PriorityBadge: React.FC<{ priority: CopilotSuggestion['priority'] }> = ({ priority }) => {
  const styles: Record<string, string> = {
    critical: 'bg-red-100 text-red-700 border-red-200',
    high: 'bg-orange-100 text-orange-700 border-orange-200',
    medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    low: 'bg-blue-100 text-blue-700 border-blue-200',
  };
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${styles[priority]}`}>
      {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </span>
  );
};

const CategoryIcon: React.FC<{ category: CopilotSuggestion['category'] }> = ({ category }) => {
  switch (category) {
    case 'action': return <Zap size={14} className="text-blue-500" />;
    case 'gap': return <AlertCircle size={14} className="text-red-500" />;
    case 'deadline': return <Clock size={14} className="text-orange-500" />;
    case 'insight': return <Lightbulb size={14} className="text-purple-500" />;
    default: return <Info size={14} className="text-gray-500" />;
  }
};

const ConfidenceMeter: React.FC<{ score: number }> = ({ score }) => {
  const percentage = Math.round(score * 100);
  const color = percentage >= 90 ? 'text-green-600' : percentage >= 75 ? 'text-yellow-600' : 'text-orange-600';
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${percentage >= 90 ? 'bg-green-500' : percentage >= 75 ? 'bg-yellow-500' : 'bg-orange-500'}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className={`text-xs font-medium ${color}`}>{percentage}%</span>
    </div>
  );
};

const AuditReadinessGauge: React.FC<{ score: number }> = ({ score }) => {
  const color = score >= 80 ? 'text-green-600' : score >= 60 ? 'text-yellow-600' : 'text-red-600';
  const bgColor = score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-yellow-500' : 'bg-red-500';
  const ringColor = score >= 80 ? 'stroke-green-500' : score >= 60 ? 'stroke-yellow-500' : 'stroke-red-500';
  const circumference = 2 * Math.PI * 36;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex items-center gap-3">
      <div className="relative w-16 h-16">
        <svg className="w-16 h-16 -rotate-90" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r="36" fill="none" stroke="#e5e7eb" strokeWidth="6" />
          <circle
            cx="40" cy="40" r="36" fill="none"
            className={ringColor}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-sm font-bold ${color}`}>{score}%</span>
        </div>
      </div>
      <div>
        <p className="text-sm font-medium text-gray-900">Audit Readiness</p>
        <p className="text-xs text-gray-500">
          {score >= 80 ? 'On track' : score >= 60 ? 'Needs attention' : 'Critical gaps'}
        </p>
      </div>
    </div>
  );
};

// ─── Main Component ─────────────────────────────────────────────────────────────

export const AIComplianceCopilot: React.FC<AIComplianceCopilotProps> = ({
  currentView,
  isOpen,
  onClose,
}) => {
  const { t } = useI18n();
  const [activeSection, setActiveSection] = useState<'suggestions' | 'chat' | 'deadlines' | 'actions'>('suggestions');
  const [messages, setMessages] = useState<CopilotMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [suggestions, setSuggestions] = useState<CopilotSuggestion[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [suggestionsError, setSuggestionsError] = useState<string | null>(null);
  const [expandedSuggestion, setExpandedSuggestion] = useState<string | null>(null);
  const [feedbackGiven, setFeedbackGiven] = useState<Record<string, 'up' | 'down'>>({});
  const [bookmarkedQueries, setBookmarkedQueries] = useState<string[]>([]);
  const [showExamples, setShowExamples] = useState(true);
  const [deadlines, setDeadlines] = useState<DeadlineItem[]>([]);
  const [deadlinesLoading, setDeadlinesLoading] = useState(false);
  const [deadlinesError, setDeadlinesError] = useState<string | null>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [auditReadinessScore, setAuditReadinessScore] = useState(0);
  const [isApiAvailable, setIsApiAvailable] = useState<boolean>(true);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load proactive recommendations from the backend visionary-AI co-pilot.
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    (async () => {
      setSuggestionsLoading(true);
      setSuggestionsError(null);
      try {
        const result = await api.enterprise.visionaryAI.getCoPilotRecommendations();
        if (cancelled) return;
        const recs: any[] = Array.isArray(result?.recommendations)
          ? result.recommendations
          : Array.isArray(result) ? result : [];
        setSuggestions(recs.map(mapRecommendationToSuggestion));
        if (typeof result?.overallScore === 'number') {
          setAuditReadinessScore(Math.round(result.overallScore));
        }
      } catch (err: any) {
        if (cancelled) return;
        logger.error('Failed to load co-pilot recommendations', err);
        setSuggestionsError(err?.message || 'Unable to load recommendations right now.');
        setSuggestions([]);
      } finally {
        if (!cancelled) setSuggestionsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [isOpen]);

  // Load upcoming compliance deadlines from the calendar service.
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    (async () => {
      setDeadlinesLoading(true);
      setDeadlinesError(null);
      try {
        const data = await api.calendar.getUpcoming(90);
        if (cancelled) return;
        const rows: any[] = Array.isArray(data) ? data : data?.data ?? [];
        setDeadlines(rows.map(mapDeadline));
      } catch (err: any) {
        if (cancelled) return;
        logger.error('Failed to load upcoming deadlines', err);
        setDeadlinesError(err?.message || 'Unable to load deadlines right now.');
        setDeadlines([]);
      } finally {
        if (!cancelled) setDeadlinesLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [isOpen]);

  // Auto-scroll chat
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  // Focus input when switching to chat
  useEffect(() => {
    if (activeSection === 'chat' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [activeSection]);

  const handleSendMessage = useCallback(async (messageText?: string) => {
    const text = messageText || inputValue.trim();
    if (!text) return;

    const userMessage: CopilotMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setShowExamples(false);
    setIsTyping(true);

    try {
      // Build conversation history for context
      const conversationHistory = messages.slice(-10).map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

      const aiResult = await api.ai.complianceCopilot(text, conversationHistory, {
        currentView: currentView || 'copilot',
        activeFramework: undefined,
      });

      setIsApiAvailable(true);

      const assistantMessage: CopilotMessage = {
        id: `msg-${Date.now()}-resp`,
        role: 'assistant',
        content: aiResult.response || 'I could not generate a response. Please try again.',
        timestamp: new Date(),
        confidence: aiResult.confidence ?? 0.85,
        sources: (aiResult.relatedControls || []).map((c: string) => ({ title: c, reference: c })),
        followUpQuestions: aiResult.suggestions || [],
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      setIsApiAvailable(false);

      const fallbackMessage: CopilotMessage = {
        id: `msg-${Date.now()}-fallback`,
        role: 'assistant',
        content: 'The AI compliance service is temporarily unavailable. Please try again in a few moments. If the issue persists, contact your administrator.',
        timestamp: new Date(),
        confidence: 0,
        sources: [],
        followUpQuestions: [],
      };

      setMessages(prev => [...prev, fallbackMessage]);
    } finally {
      setIsTyping(false);
    }
  }, [inputValue, messages, currentView]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  const handleFeedback = useCallback((messageId: string, type: 'up' | 'down') => {
    setFeedbackGiven(prev => ({ ...prev, [messageId]: type }));
  }, []);

  const handleCopyMessage = useCallback((messageId: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedMessageId(messageId);
    setTimeout(() => setCopiedMessageId(null), 2000);
  }, []);

  const handleBookmarkQuery = useCallback((query: string) => {
    setBookmarkedQueries(prev =>
      prev.includes(query) ? prev.filter(q => q !== query) : [...prev, query]
    );
  }, []);

  const toggleSuggestion = useCallback((id: string) => {
    setExpandedSuggestion(prev => prev === id ? null : id);
  }, []);

  const getViewLabel = (view: string): string => {
    const labels: Record<string, string> = {
      dashboard: 'Dashboard',
      frameworks: 'Frameworks',
      risks: 'Risk Management',
      vendors: 'Vendor Management',
      policies: 'Policy Management',
      audit: 'Audit Trail',
      reports: 'Reports',
      tasks: 'My Tasks',
      integrations: 'Integrations',
      settings: 'Settings',
    };
    return labels[view] || view.charAt(0).toUpperCase() + view.slice(1);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 z-40 transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Sidebar Panel */}
      <div className="fixed right-0 top-0 h-full w-[420px] bg-white shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ease-out border-l border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-brand-50 to-purple-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-600 to-purple-600 flex items-center justify-center">
              <Sparkles size={16} className="text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">{t('ai.complianceCopilot')}</h3>
              <p className="text-xs text-gray-500 flex items-center gap-1.5">
                Context: <span className="font-medium text-brand-600">{getViewLabel(currentView)}</span>
                <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
                  isApiAvailable
                    ? 'bg-green-100 text-green-700'
                    : 'bg-yellow-100 text-yellow-700'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isApiAvailable ? 'bg-green-500' : 'bg-yellow-500'}`} />
                  {isApiAvailable ? 'Live AI' : 'Offline'}
                </span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Audit Readiness Score */}
        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50">
          <AuditReadinessGauge score={auditReadinessScore} />
        </div>

        {/* Section Tabs */}
        <div className="flex border-b border-gray-200 px-2">
          {[
            { key: 'suggestions', label: t('ai.suggestion'), icon: <Lightbulb size={14} /> },
            { key: 'chat', label: t('ai.askCopilot'), icon: <MessageSquare size={14} /> },
            { key: 'deadlines', label: 'Deadlines', icon: <Clock size={14} /> },
            { key: 'actions', label: t('common.actions'), icon: <Zap size={14} /> },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveSection(tab.key as typeof activeSection)}
              className={`flex items-center gap-1 px-3 py-2.5 text-xs font-medium border-b-2 transition-colors ${
                activeSection === tab.key
                  ? 'border-brand-600 text-brand-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          {/* ─── Suggestions Section ──────────────────────────────── */}
          {activeSection === 'suggestions' && (
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Proactive Suggestions
                </h4>
                <span className="text-xs text-gray-400">{suggestions.length} items</span>
              </div>

              {suggestionsLoading && (
                <div className="flex items-center gap-2 text-gray-500 text-sm py-6 justify-center">
                  <Loader2 size={16} className="animate-spin" />
                  Analyzing your compliance posture...
                </div>
              )}

              {suggestionsError && !suggestionsLoading && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2 text-red-700 text-sm">
                  <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                  {suggestionsError}
                </div>
              )}

              {!suggestionsLoading && suggestions.map(suggestion => (
                <div
                  key={suggestion.id}
                  className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:border-brand-200 transition-colors shadow-sm"
                >
                  <button
                    onClick={() => toggleSuggestion(suggestion.id)}
                    className="w-full text-left p-3"
                  >
                    <div className="flex items-start gap-2">
                      <div className="mt-0.5">
                        <CategoryIcon category={suggestion.category} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <PriorityBadge priority={suggestion.priority} />
                          <ConfidenceMeter score={suggestion.confidence} />
                        </div>
                        <h5 className="text-sm font-medium text-gray-900 leading-tight">
                          {suggestion.title}
                        </h5>
                        {expandedSuggestion !== suggestion.id && (
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                            {suggestion.description}
                          </p>
                        )}
                      </div>
                      <div className="mt-1">
                        {expandedSuggestion === suggestion.id ? (
                          <ChevronUp size={14} className="text-gray-400" />
                        ) : (
                          <ChevronDown size={14} className="text-gray-400" />
                        )}
                      </div>
                    </div>
                  </button>

                  {expandedSuggestion === suggestion.id && (
                    <div className="px-3 pb-3 border-t border-gray-100">
                      <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                        {suggestion.description}
                      </p>
                      {suggestion.source && (
                        <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                          <Link2 size={10} />
                          Source: {suggestion.source}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-3">
                        {suggestion.actionLabel && (
                          <button className="flex items-center gap-1 px-3 py-1.5 bg-brand-600 text-white text-xs font-medium rounded-lg hover:bg-brand-700 transition-colors">
                            {suggestion.actionLabel}
                            <ArrowRight size={12} />
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveSection('chat');
                            setInputValue(`Tell me more about: ${suggestion.title}`);
                          }}
                          className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 text-gray-600 text-xs font-medium rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <MessageSquare size={12} />
                          Ask AI
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {!suggestionsLoading && !suggestionsError && suggestions.length === 0 && (
                <div className="text-center py-8">
                  <CheckCircle2 size={32} className="text-green-500 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-700">All caught up!</p>
                  <p className="text-xs text-gray-500 mt-1">No proactive suggestions right now.</p>
                </div>
              )}
            </div>
          )}

          {/* ─── Chat Section ─────────────────────────────────────── */}
          {activeSection === 'chat' && (
            <div className="flex flex-col h-full">
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && showExamples && (
                  <div className="space-y-3">
                    <div className="text-center py-4">
                      <Bot size={32} className="text-brand-400 mx-auto mb-2" />
                      <p className="text-sm font-medium text-gray-700">Ask me anything about your compliance</p>
                      <p className="text-xs text-gray-500 mt-1">I have full context of your frameworks, controls, evidence, and risks.</p>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Try asking:</p>
                      {EXAMPLE_QUERIES.map((query, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSendMessage(query)}
                          className="w-full text-left p-2.5 bg-gray-50 hover:bg-brand-50 border border-gray-200 hover:border-brand-200 rounded-lg text-sm text-gray-700 hover:text-brand-700 transition-colors flex items-center gap-2"
                        >
                          <Search size={14} className="text-gray-400 flex-shrink-0" />
                          <span>{query}</span>
                        </button>
                      ))}
                    </div>

                    {bookmarkedQueries.length > 0 && (
                      <div className="space-y-2 mt-4">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                          <Bookmark size={12} />
                          Bookmarked Queries
                        </p>
                        {bookmarkedQueries.map((query, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSendMessage(query)}
                            className="w-full text-left p-2.5 bg-yellow-50 hover:bg-yellow-100 border border-yellow-200 rounded-lg text-sm text-gray-700 transition-colors flex items-center gap-2"
                          >
                            <Star size={14} className="text-yellow-500 flex-shrink-0" />
                            <span>{query}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {messages.map(message => (
                  <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[90%] ${message.role === 'user' ? 'order-2' : ''}`}>
                      {/* Message bubble */}
                      <div className={`rounded-xl px-3 py-2.5 ${
                        message.role === 'user'
                          ? 'bg-brand-600 text-white'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        <div className="text-sm whitespace-pre-wrap leading-relaxed">
                          {message.content}
                        </div>
                      </div>

                      {/* Assistant metadata */}
                      {message.role === 'assistant' && (
                        <div className="mt-2 space-y-2">
                          {/* Confidence */}
                          {message.confidence && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500">{t('ai.confidence')}:</span>
                              <ConfidenceMeter score={message.confidence} />
                            </div>
                          )}

                          {/* Sources */}
                          {message.sources && message.sources.length > 0 && (
                            <div className="bg-gray-50 rounded-lg p-2 border border-gray-100">
                              <p className="text-xs font-semibold text-gray-500 mb-1 flex items-center gap-1">
                                <BookOpen size={10} />
                                Evidence Sources ({message.sources.length})
                              </p>
                              <div className="space-y-1">
                                {message.sources.map((source, idx) => (
                                  <div key={idx} className="flex items-start gap-1.5 text-xs text-gray-600">
                                    <ExternalLink size={10} className="mt-0.5 flex-shrink-0 text-brand-500" />
                                    <div>
                                      <span className="font-medium">{source.title}</span>
                                      <span className="text-gray-400 ml-1">- {source.reference}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Follow-up questions */}
                          {message.followUpQuestions && message.followUpQuestions.length > 0 && (
                            <div className="space-y-1">
                              <p className="text-xs font-semibold text-gray-500">Suggested follow-ups:</p>
                              {message.followUpQuestions.map((q, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => handleSendMessage(q)}
                                  className="block w-full text-left text-xs text-brand-600 hover:text-brand-700 hover:bg-brand-50 px-2 py-1 rounded transition-colors"
                                >
                                  <ChevronRight size={10} className="inline mr-1" />
                                  {q}
                                </button>
                              ))}
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex items-center gap-2 pt-1">
                            <button
                              onClick={() => handleFeedback(message.id, 'up')}
                              className={`p-1 rounded transition-colors ${
                                feedbackGiven[message.id] === 'up'
                                  ? 'text-green-600 bg-green-50'
                                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                              }`}
                              title="Helpful"
                            >
                              <ThumbsUp size={12} />
                            </button>
                            <button
                              onClick={() => handleFeedback(message.id, 'down')}
                              className={`p-1 rounded transition-colors ${
                                feedbackGiven[message.id] === 'down'
                                  ? 'text-red-600 bg-red-50'
                                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                              }`}
                              title="Not helpful"
                            >
                              <ThumbsDown size={12} />
                            </button>
                            <button
                              onClick={() => handleCopyMessage(message.id, message.content)}
                              className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                              title="Copy"
                            >
                              {copiedMessageId === message.id ? (
                                <CheckCircle2 size={12} className="text-green-500" />
                              ) : (
                                <Copy size={12} />
                              )}
                            </button>
                            <button
                              onClick={() => handleBookmarkQuery(
                                messages.find(m => m.id < message.id && m.role === 'user')?.content || ''
                              )}
                              className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                              title="Bookmark query"
                            >
                              <Bookmark size={12} />
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Timestamp */}
                      <p className="text-xs text-gray-400 mt-1 px-1">
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}

                {/* Typing indicator */}
                {isTyping && (
                  <div className="flex items-center gap-2 text-gray-500">
                    <div className="bg-gray-100 rounded-xl px-3 py-2.5 flex items-center gap-2">
                      <Loader2 size={14} className="animate-spin" />
                      <span className="text-sm">
                        {isApiAvailable
                          ? `${t('ai.analyzing')}...`
                          : 'Retrieving cached compliance data...'}
                      </span>
                    </div>
                  </div>
                )}

                <div ref={chatEndRef} />
              </div>
            </div>
          )}

          {/* ─── Deadlines Section ────────────────────────────────── */}
          {activeSection === 'deadlines' && (
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Upcoming Compliance Deadlines
                </h4>
              </div>

              {deadlinesLoading && (
                <div className="flex items-center gap-2 text-gray-500 text-sm py-6 justify-center">
                  <Loader2 size={16} className="animate-spin" />
                  Loading deadlines...
                </div>
              )}

              {deadlinesError && !deadlinesLoading && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2 text-red-700 text-sm">
                  <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                  {deadlinesError}
                </div>
              )}

              {!deadlinesLoading && !deadlinesError && deadlines.length === 0 && (
                <div className="text-center py-8">
                  <CheckCircle2 size={32} className="text-green-500 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-700">No upcoming deadlines</p>
                  <p className="text-xs text-gray-500 mt-1">Nothing due in the next 90 days.</p>
                </div>
              )}

              {!deadlinesLoading && [...deadlines].sort((a, b) => a.daysRemaining - b.daysRemaining).map(deadline => (
                <div
                  key={deadline.id}
                  className={`bg-white border rounded-lg p-3 shadow-sm ${
                    deadline.status === 'overdue'
                      ? 'border-red-200 bg-red-50/50'
                      : deadline.status === 'at-risk'
                      ? 'border-orange-200 bg-orange-50/30'
                      : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          deadline.status === 'overdue'
                            ? 'bg-red-100 text-red-700'
                            : deadline.status === 'at-risk'
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {deadline.status === 'overdue' ? 'Overdue' : deadline.status === 'at-risk' ? 'At Risk' : 'On Track'}
                        </span>
                        <span className="text-xs text-gray-400 font-medium">{deadline.framework}</span>
                      </div>
                      <h5 className="text-sm font-medium text-gray-900">{deadline.title}</h5>
                    </div>
                    <div className="text-right flex-shrink-0 ml-3">
                      <p className={`text-lg font-bold ${
                        deadline.daysRemaining <= 14
                          ? 'text-red-600'
                          : deadline.daysRemaining <= 30
                          ? 'text-orange-600'
                          : 'text-gray-700'
                      }`}>
                        {deadline.daysRemaining}d
                      </p>
                      <p className="text-xs text-gray-400">remaining</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                    <p className="text-xs text-gray-500">Due: {new Date(deadline.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                    <button className="text-xs text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1">
                      View Details <ChevronRight size={10} />
                    </button>
                  </div>
                </div>
              ))}

              {!deadlinesLoading && !deadlinesError && deadlines.length > 0 && (() => {
                const nearest = [...deadlines].sort((a, b) => a.daysRemaining - b.daysRemaining)[0];
                return (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
                    <div className="flex items-start gap-2">
                      <Info size={14} className="text-blue-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-medium text-blue-800">AI Recommendation</p>
                        <p className="text-xs text-blue-700 mt-0.5">
                          Based on deadline proximity, prioritize <span className="font-medium">{nearest.title}</span>
                          {' '}({nearest.daysRemaining < 0 ? 'overdue' : `${nearest.daysRemaining} days remaining`}).
                          Running an audit simulation now could help identify critical gaps before it is due.
                        </p>
                        <button className="mt-2 text-xs text-blue-800 font-medium hover:underline flex items-center gap-1">
                          Run Audit Simulation <ArrowRight size={10} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* ─── Quick Actions Section ────────────────────────────── */}
          {activeSection === 'actions' && (
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {t('common.actions')}
                </h4>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {QUICK_ACTIONS.map(action => (
                  <button
                    key={action.id}
                    className="flex flex-col items-start p-3 bg-white border border-gray-200 rounded-lg hover:border-brand-300 hover:bg-brand-50/50 transition-colors text-left shadow-sm"
                  >
                    <div className="w-7 h-7 rounded-md bg-brand-100 flex items-center justify-center mb-2 text-brand-600">
                      {action.icon}
                    </div>
                    <span className="text-xs font-medium text-gray-900">{action.label}</span>
                    <span className="text-xs text-gray-500 mt-0.5 leading-tight">{action.description}</span>
                  </button>
                ))}
              </div>

              {/* Context-Aware Suggestions */}
              <div className="mt-4">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Recommended for {getViewLabel(currentView)}
                </h4>
                <div className="space-y-2">
                  <button className="w-full flex items-center gap-3 p-3 bg-gradient-to-r from-brand-50 to-purple-50 border border-brand-200 rounded-lg hover:from-brand-100 hover:to-purple-100 transition-colors text-left">
                    <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center flex-shrink-0">
                      <TrendingUp size={14} className="text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Run Compliance Health Check</p>
                      <p className="text-xs text-gray-500">{t('ai.aiPowered')} assessment of your overall compliance posture</p>
                    </div>
                    <ChevronRight size={14} className="text-gray-400 flex-shrink-0" />
                  </button>
                  <button className="w-full flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
                    <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                      <AlertTriangle size={14} className="text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Identify Critical Gaps</p>
                      <p className="text-xs text-gray-500">Find and prioritize the most impactful compliance gaps</p>
                    </div>
                    <ChevronRight size={14} className="text-gray-400 flex-shrink-0" />
                  </button>
                  <button className="w-full flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
                    <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                      <Shield size={14} className="text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Generate Board Report</p>
                      <p className="text-xs text-gray-500">Create an executive compliance summary for leadership</p>
                    </div>
                    <ChevronRight size={14} className="text-gray-400 flex-shrink-0" />
                  </button>
                  <button className="w-full flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <RefreshCw size={14} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Sync Regulatory Updates</p>
                      <p className="text-xs text-gray-500">Check for new regulatory changes affecting your frameworks</p>
                    </div>
                    <ChevronRight size={14} className="text-gray-400 flex-shrink-0" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Chat Input - Always visible when in chat mode */}
        {activeSection === 'chat' && (
          <div className="border-t border-gray-200 p-3 bg-white">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about your compliance..."
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                disabled={isTyping}
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={!inputValue.trim() || isTyping}
                className="p-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send size={16} />
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1.5 px-1">
              AI responses are based on your compliance data. Always verify critical decisions.
            </p>
          </div>
        )}

        {/* Footer for non-chat sections */}
        {activeSection !== 'chat' && (
          <div className="border-t border-gray-200 p-3 bg-gray-50/50">
            <button
              onClick={() => setActiveSection('chat')}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition-colors"
            >
              <MessageSquare size={14} />
              Ask AI Copilot a Question
            </button>
          </div>
        )}
      </div>
    </>
  );
};
