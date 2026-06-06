import React, { useState, useCallback, useRef, useEffect } from 'react';
import { api } from '../../services/api';
import { logger } from '../../utils/logger';
import {
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ChevronRight,
  Shield,
  FileText,
  TrendingUp,
  AlertCircle,
  Target,
  BarChart3,
  Calendar,
  ExternalLink,
  Download,
  Loader2,
  Search,
  ChevronDown,
  ChevronUp,
  Zap,
  Eye,
  Info,
  Sparkles,
  Star,
  Users,
  MessageSquare,
  BookOpen,
  Send,
  Copy,
  Bookmark,
  BookmarkCheck,
  ThumbsUp,
  ThumbsDown,
  ArrowRight,
  Lightbulb,
  Hash,
  Link2,
  History,
  X,
  Trash2,
  RefreshCw,
  Database,
  Layers,
  PieChart,
  Activity,
  Building2,
  Lock,
  FileCheck,
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────────

interface QueryResult {
  id: string;
  query: string;
  timestamp: Date;
  response: string;
  confidence: number;
  sources: Array<{ title: string; reference?: string; type: string; url?: string; relevance?: number }>;
  followUpQuestions: string[];
  dataCards?: DataCard[];
  bookmarked: boolean;
  feedback?: 'up' | 'down';
  relatedQueries?: string[];
  actionItems?: string[];
  category?: string;
}

interface DataCard {
  id: string;
  title: string;
  type: 'metric' | 'list' | 'table' | 'status' | 'timeline' | 'chart';
  data: any;
}

interface SuggestedQuery {
  id: string;
  query: string;
  category: string;
  icon: React.ReactNode;
}

// ─── Demo Data ──────────────────────────────────────────────────────────────────

const SUGGESTED_QUERIES: SuggestedQuery[] = [
  { id: 'sq-1', query: 'Am I GDPR compliant in France?', category: 'Compliance Status', icon: <Shield size={14} /> },
  { id: 'sq-2', query: 'What controls am I missing for SOC 2?', category: 'Gap Analysis', icon: <Target size={14} /> },
  { id: 'sq-3', query: 'Show me all high-risk vendors', category: 'Vendor Risk', icon: <Building2 size={14} /> },
  { id: 'sq-4', query: 'When is my next audit deadline?', category: 'Deadlines', icon: <Calendar size={14} /> },
  { id: 'sq-5', query: 'What evidence is stale or missing?', category: 'Evidence', icon: <FileCheck size={14} /> },
  { id: 'sq-6', query: 'How do I improve my ISO 27001 score?', category: 'Improvement', icon: <TrendingUp size={14} /> },
  { id: 'sq-7', query: 'Show me my risk exposure breakdown', category: 'Risk Analysis', icon: <BarChart3 size={14} /> },
  { id: 'sq-8', query: 'Which policies are due for review?', category: 'Policy Management', icon: <FileText size={14} /> },
  { id: 'sq-9', query: 'What regulatory changes affect my organization?', category: 'Regulatory', icon: <AlertCircle size={14} /> },
  { id: 'sq-10', query: 'Generate a compliance summary for the board', category: 'Reporting', icon: <PieChart size={14} /> },
  { id: 'sq-11', query: 'What is my overall compliance posture?', category: 'Overview', icon: <Activity size={14} /> },
  { id: 'sq-12', query: 'Show me controls with the lowest implementation rates', category: 'Controls', icon: <Layers size={14} /> },
];

const QUERY_CATEGORIES = ['All', 'Compliance Status', 'Gap Analysis', 'Vendor Risk', 'Deadlines', 'Evidence', 'Risk Analysis', 'Policy Management', 'Regulatory', 'Reporting'];

// ─── Helper Components ──────────────────────────────────────────────────────────

const ConfidenceBadge: React.FC<{ score: number }> = ({ score }) => {
  const pct = Math.round(score * 100);
  const color = pct >= 90 ? 'bg-green-100 text-green-700 border-green-200' : pct >= 75 ? 'bg-yellow-100 text-yellow-700 border-yellow-200' : 'bg-orange-100 text-orange-700 border-orange-200';
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${color}`}>
      {pct}% confidence
    </span>
  );
};

const SourceIcon: React.FC<{ type: string }> = ({ type }) => {
  switch (type) {
    case 'framework': return <Shield size={10} className="text-blue-500" />;
    case 'evidence': return <FileCheck size={10} className="text-green-500" />;
    case 'policy': return <FileText size={10} className="text-purple-500" />;
    case 'assessment': return <Target size={10} className="text-orange-500" />;
    case 'register': return <Database size={10} className="text-teal-500" />;
    case 'monitoring': return <Activity size={10} className="text-blue-500" />;
    case 'calendar': return <Calendar size={10} className="text-red-500" />;
    case 'regulatory': return <AlertCircle size={10} className="text-yellow-500" />;
    case 'inventory': return <Layers size={10} className="text-gray-500" />;
    case 'vendor': return <Building2 size={10} className="text-purple-500" />;
    case 'dashboard': return <BarChart3 size={10} className="text-brand-500" />;
    default: return <Link2 size={10} className="text-gray-400" />;
  }
};

const MetricCard: React.FC<{ data: any }> = ({ data }) => {
  const val = typeof data?.value === 'number' ? data.value : 0;
  const color = val >= 80 ? 'text-green-600' : val >= 60 ? 'text-yellow-600' : 'text-red-600';
  const ringColor = val >= 80 ? 'stroke-green-500' : val >= 60 ? 'stroke-yellow-500' : 'stroke-red-500';
  const circumference = 2 * Math.PI * 34;
  const offset = circumference - (val / 100) * circumference;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4">
      <div className="relative w-20 h-20">
        <svg className="-rotate-90" width={80} height={80} viewBox="0 0 80 80">
          <circle cx="40" cy="40" r="34" fill="none" stroke="#e5e7eb" strokeWidth="6" />
          <circle cx="40" cy="40" r="34" fill="none" className={ringColor} strokeWidth="6" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-lg font-bold ${color}`}>{val}{data?.unit || ''}</span>
        </div>
      </div>
      <div>
        <p className="text-sm font-medium text-gray-900">{data.label}</p>
        {data.trend && (
          <p className={`text-xs font-medium mt-0.5 flex items-center gap-1 ${data.trendDirection === 'up' ? 'text-green-600' : 'text-red-600'}`}>
            {data.trendDirection === 'up' ? <TrendingUp size={10} /> : <AlertTriangle size={10} />}
            {data.trend} from last period
          </p>
        )}
      </div>
    </div>
  );
};

const ListCard: React.FC<{ title: string; data: any }> = ({ title, data }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
        <h5 className="text-xs font-semibold text-gray-500 uppercase">{title}</h5>
      </div>
      <div className="divide-y divide-gray-100">
        {(data?.items || []).map((item: any, idx: number) => (
          <div key={idx} className="flex items-center justify-between px-4 py-2">
            <span className="text-sm text-gray-700">{item.label}</span>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-medium ${
                item.status === 'good' ? 'text-green-600' :
                item.status === 'warning' ? 'text-yellow-600' :
                'text-red-600'
              }`}>{item.value}</span>
              <div className={`w-2 h-2 rounded-full ${
                item.status === 'good' ? 'bg-green-500' :
                item.status === 'warning' ? 'bg-yellow-500' :
                'bg-red-500'
              }`} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const TimelineCard: React.FC<{ title: string; data: any }> = ({ title, data }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
        <h5 className="text-xs font-semibold text-gray-500 uppercase">{title}</h5>
      </div>
      <div className="p-4 space-y-3">
        {(data?.items || []).map((item: any, idx: number) => (
          <div key={idx} className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
              item.status === 'good' ? 'bg-green-100' :
              item.status === 'warning' ? 'bg-yellow-100' :
              'bg-red-100'
            }`}>
              <span className={`text-xs font-bold ${
                item.status === 'good' ? 'text-green-700' :
                item.status === 'warning' ? 'text-yellow-700' :
                'text-red-700'
              }`}>{item.daysLeft}d</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{item.label}</p>
              <p className="text-xs text-gray-500">Due: {item.date}</p>
            </div>
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
              item.status === 'good' ? 'bg-green-500' :
              item.status === 'warning' ? 'bg-yellow-500' :
              'bg-red-500'
            }`} />
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Main Component ─────────────────────────────────────────────────────────────

export const NaturalLanguageQuery: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [queryInput, setQueryInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<QueryResult[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [expandedResult, setExpandedResult] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Live organization compliance posture used to ground AI queries and the data banner
  const [orgContext, setOrgContext] = useState<{
    frameworkNames: string[];
    frameworkCount: number;
    controlCount: number;
    evidenceCount: number;
    complianceScore: number | null;
  }>({ frameworkNames: [], frameworkCount: 0, controlCount: 0, evidenceCount: 0, complianceScore: null });

  const inputRef = useRef<HTMLInputElement>(null);
  const resultsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Load the tenant's real frameworks, control coverage, evidence count, and score
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [dashboard, completeness] = await Promise.all([
          api.executive.getDashboard(),
          api.evidenceCollection.getCompleteness(),
        ]);
        if (!active) return;
        const frameworkScores: any[] = dashboard?.frameworkScores || [];
        const readiness: any[] = (completeness as any)?.readiness || [];
        setOrgContext({
          frameworkNames: frameworkScores.map((f: any) => f.name).filter(Boolean),
          frameworkCount: frameworkScores.length,
          controlCount: frameworkScores.reduce((sum: number, f: any) => sum + (f.totalControls || 0), 0),
          evidenceCount: readiness.reduce((sum: number, r: any) => sum + (r.evidenceComplete || 0), 0),
          complianceScore: typeof dashboard?.overallCompliance === 'number' ? dashboard.overallCompliance : null,
        });
      } catch (err: any) {
        logger.warn('Failed to load organization compliance context:', err);
      }
    })();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (resultsEndRef.current) {
      resultsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [results]);

  const handleSubmitQuery = useCallback(async (queryText?: string) => {
    const text = queryText || queryInput.trim();
    if (!text || isProcessing) return;

    setIsProcessing(true);
    setShowSuggestions(false);
    setQueryInput('');

    try {
      const aiResult = await api.ai.naturalLanguageQuery(text, {
        frameworks: orgContext.frameworkNames,
        ...(orgContext.complianceScore !== null ? { complianceScore: orgContext.complianceScore } : {}),
      });

      const newResult: QueryResult = {
        id: `qr-${Date.now()}`,
        query: text,
        timestamp: new Date(),
        bookmarked: false,
        response: aiResult.answer || 'No response generated.',
        confidence: (aiResult.confidence || 75) / 100,
        sources: (aiResult.sources || []).map((s: any) => ({
          title: s.reference || s.type,
          type: s.type || 'regulation',
          url: '#',
          relevance: (s.relevance || 80) / 100,
        })),
        followUpQuestions: aiResult.followUpQuestions || aiResult.relatedQuestions || [],
        relatedQueries: aiResult.relatedQuestions || [],
        actionItems: aiResult.actionItems || [],
        dataCards: Array.isArray(aiResult.dataCards)
          ? aiResult.dataCards.map((card: any, idx: number) => ({
              id: card.id || `dc-${Date.now()}-${idx}`,
              title: card.title || '',
              type: card.type || 'metric',
              data: card.data,
            }))
          : undefined,
        category: 'AI Response',
      };

      setResults(prev => [...prev, newResult]);
      setExpandedResult(newResult.id);
    } catch (error: any) {
      logger.error('NL query error:', error);

      const errorResult: QueryResult = {
        id: `qr-err-${Date.now()}`,
        query: text,
        timestamp: new Date(),
        bookmarked: false,
        response: `**Unable to process your query.** ${error?.message || 'The AI service is temporarily unavailable.'}\n\nPlease try again in a moment. If the issue persists, check that the backend server is running and the AI service is configured.`,
        confidence: 0,
        sources: [],
        followUpQuestions: ['Try rephrasing your question', 'Check server connectivity'],
      };

      setResults(prev => [...prev, errorResult]);
      setExpandedResult(errorResult.id);
    } finally {
      setIsProcessing(false);
    }
  }, [queryInput, isProcessing, orgContext]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmitQuery();
    }
  }, [handleSubmitQuery]);

  const handleToggleBookmark = useCallback((resultId: string) => {
    setResults(prev => prev.map(r => r.id === resultId ? { ...r, bookmarked: !r.bookmarked } : r));
  }, []);

  const handleFeedback = useCallback((resultId: string, type: 'up' | 'down') => {
    setResults(prev => prev.map(r => r.id === resultId ? { ...r, feedback: type } : r));
  }, []);

  const handleCopy = useCallback((resultId: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(resultId);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  const handleExportResult = useCallback((result: QueryResult) => {
    const exportData = {
      query: result.query,
      response: result.response,
      confidence: result.confidence,
      sources: result.sources,
      timestamp: result.timestamp.toISOString(),
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `compliance-query-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const handleClearHistory = useCallback(() => {
    setResults([]);
    setShowSuggestions(true);
    setExpandedResult(null);
  }, []);

  const bookmarkedResults = results.filter(r => r.bookmarked);
  const filteredSuggestions = selectedCategory === 'All'
    ? SUGGESTED_QUERIES
    : SUGGESTED_QUERIES.filter(sq => sq.category === selectedCategory);

  return (
    <div className="h-full flex flex-col space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button onClick={onBack} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Natural Language Compliance Query</h2>
            <p className="text-sm text-gray-500 mt-0.5">Ask anything about your compliance posture in plain English</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {results.length > 0 && (
            <>
              <button
                onClick={() => setShowHistory(!showHistory)}
                className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-sm font-medium transition-colors ${
                  showHistory ? 'border-brand-300 bg-brand-50 text-brand-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <History size={14} />
                History ({results.length})
              </button>
              <button
                onClick={handleClearHistory}
                className="flex items-center gap-2 px-3 py-2 border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Trash2 size={14} />
                Clear
              </button>
            </>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-brand-600 to-purple-600 flex items-center justify-center flex-shrink-0">
            <Sparkles size={18} className="text-white" />
          </div>
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              value={queryInput}
              onChange={e => setQueryInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything about your compliance... (e.g., 'Am I GDPR compliant in France?')"
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              disabled={isProcessing}
            />
          </div>
          <button
            onClick={() => handleSubmitQuery()}
            disabled={!queryInput.trim() || isProcessing}
            className="px-4 py-3 bg-brand-600 text-white rounded-xl hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {isProcessing ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Send size={18} />
            )}
          </button>
        </div>
        <div className="flex items-center gap-2 mt-2 ml-13 pl-13">
          <span className="text-xs text-gray-400">Powered by AI</span>
          <span className="text-xs text-gray-300">|</span>
          <span className="text-xs text-gray-400">
            {orgContext.frameworkCount > 0
              ? `Queries your actual compliance data across ${orgContext.frameworkCount} ${orgContext.frameworkCount === 1 ? 'framework' : 'frameworks'}, ${orgContext.controlCount} ${orgContext.controlCount === 1 ? 'control' : 'controls'}, and ${orgContext.evidenceCount} evidence ${orgContext.evidenceCount === 1 ? 'item' : 'items'}`
              : 'Queries your actual compliance data across your frameworks, controls, and evidence'}
          </span>
        </div>
      </div>

      {/* Processing Indicator */}
      {isProcessing && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3">
          <Loader2 size={18} className="animate-spin text-blue-600" />
          <div>
            <p className="text-sm font-medium text-blue-900">Analyzing your compliance data...</p>
            <p className="text-xs text-blue-700 mt-0.5">Querying frameworks, controls, evidence, risks, and vendor assessments</p>
          </div>
        </div>
      )}

      {/* Suggested Queries */}
      {showSuggestions && results.length === 0 && !isProcessing && (
        <div className="space-y-4">
          {/* Category Filter */}
          <div className="flex items-center gap-2 flex-wrap">
            {QUERY_CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  selectedCategory === cat
                    ? 'bg-brand-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Query Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredSuggestions.map(sq => (
              <button
                key={sq.id}
                onClick={() => handleSubmitQuery(sq.query)}
                className="flex items-start gap-3 p-4 bg-white border border-gray-200 rounded-xl text-left hover:border-brand-300 hover:bg-brand-50/30 hover:shadow-sm transition-all"
              >
                <div className="w-8 h-8 rounded-lg bg-brand-100 flex items-center justify-center flex-shrink-0 text-brand-600">
                  {sq.icon}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{sq.query}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{sq.category}</p>
                </div>
              </button>
            ))}
          </div>

          {/* Bookmarked Queries */}
          {bookmarkedResults.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-semibold text-gray-500 mb-2 flex items-center gap-2">
                <BookmarkCheck size={14} className="text-yellow-500" />
                Bookmarked Queries
              </h4>
              <div className="space-y-2">
                {bookmarkedResults.map(result => (
                  <button
                    key={result.id}
                    onClick={() => handleSubmitQuery(result.query)}
                    className="w-full flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-left hover:bg-yellow-100 transition-colors"
                  >
                    <Star size={14} className="text-yellow-500 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{result.query}</span>
                    <span className="text-xs text-gray-400 ml-auto">{result.timestamp.toLocaleDateString()}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Query History Sidebar */}
      {showHistory && results.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <History size={14} />
              Query History
            </h4>
            <button onClick={() => setShowHistory(false)} className="text-gray-400 hover:text-gray-600">
              <X size={14} />
            </button>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {results.slice().reverse().map(result => (
              <button
                key={result.id}
                onClick={() => { setExpandedResult(result.id); setShowHistory(false); }}
                className="w-full flex items-center gap-2 p-2 bg-gray-50 hover:bg-brand-50 rounded-lg text-left transition-colors"
              >
                <Search size={12} className="text-gray-400 flex-shrink-0" />
                <span className="text-xs text-gray-700 truncate flex-1">{result.query}</span>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <ConfidenceBadge score={result.confidence} />
                  {result.bookmarked && <Star size={10} className="text-yellow-500" />}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-4">
          {results.map(result => (
            <div key={result.id} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              {/* Query Header */}
              <div className="p-4 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Search size={14} className="text-gray-400" />
                    <p className="text-sm font-medium text-gray-900">{result.query}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <ConfidenceBadge score={result.confidence} />
                    <span className="text-xs text-gray-400">{result.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <button
                      onClick={() => setExpandedResult(expandedResult === result.id ? null : result.id)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      {expandedResult === result.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  </div>
                </div>
              </div>

              {(expandedResult === result.id || results.length <= 2) && (
                <>
                  {/* Response Content */}
                  <div className="p-4">
                    <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {result.response}
                    </div>
                  </div>

                  {/* Data Cards */}
                  {result.dataCards && result.dataCards.length > 0 && (
                    <div className="px-4 pb-4">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                        {result.dataCards.map(card => {
                          if (card.type === 'metric') return <MetricCard key={card.id} data={card.data} />;
                          if (card.type === 'list') return <ListCard key={card.id} title={card.title} data={card.data} />;
                          if (card.type === 'timeline') return <TimelineCard key={card.id} title={card.title} data={card.data} />;
                          return null;
                        })}
                      </div>
                    </div>
                  )}

                  {/* Sources */}
                  <div className="px-4 pb-3">
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                      <p className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1">
                        <BookOpen size={12} />
                        Evidence Sources ({result.sources.length})
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                        {result.sources.map((source, idx) => (
                          <div key={idx} className="flex items-start gap-1.5 text-xs">
                            <SourceIcon type={source.type} />
                            <div>
                              <span className="font-medium text-gray-700">{source.title}</span>
                              <span className="text-gray-400 ml-1">- {source.reference}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Follow-up Questions */}
                  {result.followUpQuestions.length > 0 && (
                    <div className="px-4 pb-3">
                      <p className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1">
                        <Lightbulb size={12} />
                        Suggested Follow-ups
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                        {result.followUpQuestions.map((q, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSubmitQuery(q)}
                            className="text-left text-xs text-brand-600 hover:text-brand-700 hover:bg-brand-50 px-2 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                          >
                            <ChevronRight size={10} className="flex-shrink-0" />
                            <span>{q}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Bar */}
                  <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleFeedback(result.id, 'up')}
                        className={`p-1.5 rounded-lg transition-colors ${
                          result.feedback === 'up' ? 'bg-green-100 text-green-600' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                        }`}
                        title="Helpful"
                      >
                        <ThumbsUp size={14} />
                      </button>
                      <button
                        onClick={() => handleFeedback(result.id, 'down')}
                        className={`p-1.5 rounded-lg transition-colors ${
                          result.feedback === 'down' ? 'bg-red-100 text-red-600' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                        }`}
                        title="Not helpful"
                      >
                        <ThumbsDown size={14} />
                      </button>
                      <div className="w-px h-4 bg-gray-200 mx-1" />
                      <button
                        onClick={() => handleCopy(result.id, result.response)}
                        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Copy"
                      >
                        {copiedId === result.id ? <CheckCircle2 size={14} className="text-green-500" /> : <Copy size={14} />}
                      </button>
                      <button
                        onClick={() => handleToggleBookmark(result.id)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          result.bookmarked ? 'bg-yellow-100 text-yellow-600' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                        }`}
                        title={result.bookmarked ? 'Remove bookmark' : 'Bookmark'}
                      >
                        {result.bookmarked ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
                      </button>
                    </div>
                    <button
                      onClick={() => handleExportResult(result)}
                      className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 text-gray-600 text-xs font-medium rounded-lg hover:bg-white transition-colors"
                    >
                      <Download size={12} />
                      Export as Report
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
          <div ref={resultsEndRef} />
        </div>
      )}

      {/* Empty State Info */}
      {results.length === 0 && !isProcessing && showSuggestions && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Info size={18} className="text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-semibold text-blue-900">How Natural Language Query Works</h4>
              <ul className="mt-2 space-y-1 text-xs text-blue-700">
                <li className="flex items-center gap-1.5"><CheckCircle2 size={10} />Ask questions in plain English about your compliance posture</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 size={10} />AI queries your actual compliance data (frameworks, controls, evidence, risks, vendors)</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 size={10} />Responses include confidence scoring and evidence citations</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 size={10} />Visual data cards provide at-a-glance metrics and breakdowns</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 size={10} />Suggested follow-up questions help you explore deeper</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 size={10} />Export any answer as a report for sharing</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
