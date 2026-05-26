import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  ArrowLeft, ArrowRight, Plus, Trash2, Download, Search, Filter, Eye,
  AlertTriangle, CheckCircle, XCircle, X, ChevronDown, ChevronRight,
  Shield, Layers, Link2, BarChart3, Brain, Zap, RefreshCw, Check,
  FileText, Settings, HelpCircle, ThumbsUp, ThumbsDown, Minus,
  GitCompare, Target, TrendingUp, Loader2, Copy, Hash, Info
} from 'lucide-react';
import { api } from '../../services/api';
import { logger } from '../../utils/logger';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Framework {
  id: string;
  name: string;
  shortName: string;
  color: string;
  controlCount: number;
  category: 'Security' | 'Privacy' | 'AI Governance' | 'Sustainability' | 'Industry';
}

interface Control {
  id: string;
  frameworkId: string;
  controlId: string;
  title: string;
  description: string;
  domain: string;
}

interface ControlMapping {
  id: string;
  sourceControlId: string;
  targetControlId: string;
  confidence: number;
  status: 'AI Suggested' | 'Confirmed' | 'Rejected' | 'Manual';
  rationale: string;
  mappingType: 'Full' | 'Partial' | 'Semantic';
  confirmedBy?: string;
  confirmedDate?: string;
}

interface MappingSession {
  id: string;
  sourceFrameworkId: string;
  targetFrameworkId: string;
  createdDate: string;
  lastUpdated: string;
  status: 'Draft' | 'In Progress' | 'Completed' | 'Reviewed';
  mappings: ControlMapping[];
  coveragePercent: number;
  avgConfidence: number;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

// Backing arrays — populated at runtime from the live API. See useEffect
// inside CrossFrameworkMapper for the load logic.
const FRAMEWORKS: Framework[] = [];
const CONTROLS_DB: Control[] = [];
const PREBUILT_MAPPINGS: Omit<ControlMapping, 'id'>[] = [];

/* ------------------------------------------------------------------ */
/*  ID helper                                                          */
/* ------------------------------------------------------------------ */
let _uid = 8000;
const uid = (prefix = 'id') => `${prefix}-${++_uid}`;

/* ------------------------------------------------------------------ */
/*  Helper functions                                                    */
/* ------------------------------------------------------------------ */

const confidenceColor = (c: number) => {
  if (c >= 90) return 'bg-green-100 text-green-800 border-green-300';
  if (c >= 75) return 'bg-blue-100 text-blue-800 border-blue-300';
  if (c >= 60) return 'bg-amber-100 text-amber-800 border-amber-300';
  return 'bg-red-100 text-red-800 border-red-300';
};

const confidenceBar = (c: number) => {
  if (c >= 90) return 'bg-green-500';
  if (c >= 75) return 'bg-blue-500';
  if (c >= 60) return 'bg-amber-500';
  return 'bg-red-500';
};

const statusBadge = (s: ControlMapping['status']) => {
  switch (s) {
    case 'AI Suggested': return 'bg-purple-100 text-purple-700';
    case 'Confirmed': return 'bg-green-100 text-green-700';
    case 'Rejected': return 'bg-red-100 text-red-700';
    case 'Manual': return 'bg-blue-100 text-blue-700';
    default: return 'bg-gray-100 text-gray-600';
  }
};

const mappingTypeBadge = (t: ControlMapping['mappingType']) => {
  switch (t) {
    case 'Full': return 'bg-green-50 text-green-700 border-green-200';
    case 'Partial': return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'Semantic': return 'bg-purple-50 text-purple-700 border-purple-200';
    default: return 'bg-gray-50 text-gray-600';
  }
};

const getControl = (id: string) => CONTROLS_DB.find(c => c.id === id);
const getFramework = (id: string) => FRAMEWORKS.find(f => f.id === id);

/* ------------------------------------------------------------------ */
/*  Backend → frontend adapters                                         */
/* ------------------------------------------------------------------ */

const FRAMEWORK_COLORS = [
  'bg-blue-500', 'bg-indigo-500', 'bg-green-600', 'bg-pink-500', 'bg-red-500',
  'bg-purple-600', 'bg-cyan-600', 'bg-teal-600', 'bg-amber-600', 'bg-emerald-600',
  'bg-violet-600', 'bg-fuchsia-600',
];

function deriveShortName(name: string): string {
  // Strip common prefixes and trailing version suffixes for a compact label.
  return name
    .replace(/\(.*?\)/g, '')
    .replace(/Regulation EU \d+\/\d+/i, '')
    .replace(/v\d+(\.\d+)*/i, '')
    .replace(/Type II/i, '')
    .replace(/Cybersecurity Framework/i, 'CSF')
    .trim()
    .split(/\s+/)
    .slice(0, 3)
    .join(' ');
}

function deriveCategory(name: string): Framework['category'] {
  const n = name.toLowerCase();
  if (n.includes('ai ') || n.includes(' ai') || n.includes('artificial')) return 'AI Governance';
  if (n.includes('gdpr') || n.includes('privacy') || n.includes('ccpa') || n.includes('hipaa')) return 'Privacy';
  if (n.includes('sustainability') || n.includes('esg') || n.includes('csrd')) return 'Sustainability';
  if (n.includes('pci') || n.includes('finance') || n.includes('sox')) return 'Industry';
  return 'Security';
}

function adaptBackendFramework(fw: any, idx: number): Framework {
  return {
    id: fw.id,
    name: fw.name || 'Untitled Framework',
    shortName: deriveShortName(fw.name || 'Framework'),
    color: FRAMEWORK_COLORS[idx % FRAMEWORK_COLORS.length],
    controlCount: Array.isArray(fw.controls) ? fw.controls.length : 0,
    category: deriveCategory(fw.name || ''),
  };
}

function adaptBackendControl(c: any, frameworkId: string): Control {
  return {
    id: c.id,
    frameworkId,
    controlId: c.category || c.name || c.id,
    title: c.name || 'Untitled Control',
    description: c.description || '',
    domain: c.category || 'General',
  };
}

function adaptBackendMapping(m: any): Omit<ControlMapping, 'id'> {
  const conf = typeof m.confidence === 'number' ? Math.round(m.confidence) : 75;
  const mappingType = ((): ControlMapping['mappingType'] => {
    const t = (m.mappingType || '').toLowerCase();
    if (t === 'full' || t === 'equivalent') return 'Full';
    if (t === 'partial') return 'Partial';
    return 'Semantic';
  })();
  return {
    sourceControlId: m.sourceControlId,
    targetControlId: m.targetControlId,
    confidence: conf,
    status: 'AI Suggested',
    rationale: m.notes || 'Mapping imported from backend control-mappings catalog.',
    mappingType,
  };
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export const CrossFrameworkMapper: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  /* loading state */
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  // Bump this to force re-render after mutating the module-scope catalog arrays.
  const [, setDataVersion] = useState<number>(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const [frameworksRaw, mappingsRaw] = await Promise.all([
          api.frameworks.list(),
          api.frameworks.listControlMappings().catch(() => []),
        ]);
        if (cancelled) return;

        // Wipe and repopulate module-level catalog arrays.
        FRAMEWORKS.length = 0;
        CONTROLS_DB.length = 0;
        PREBUILT_MAPPINGS.length = 0;

        (frameworksRaw || []).forEach((fw: any, idx: number) => {
          FRAMEWORKS.push(adaptBackendFramework(fw, idx));
          if (Array.isArray(fw.controls)) {
            fw.controls.forEach((c: any) => {
              CONTROLS_DB.push(adaptBackendControl(c, fw.id));
            });
          }
        });

        (mappingsRaw || []).forEach((m: any) => {
          PREBUILT_MAPPINGS.push(adaptBackendMapping(m));
        });

        setDataVersion(v => v + 1);
      } catch (err: any) {
        if (cancelled) return;
        logger.error('Failed to load cross-framework catalog', err);
        setLoadError(err?.message || 'Failed to load framework catalog.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  /* state */
  const [sourceFrameworkId, setSourceFrameworkId] = useState<string>('');
  const [targetFrameworkId, setTargetFrameworkId] = useState<string>('');
  const [sessions, setSessions] = useState<MappingSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeProgress, setAnalyzeProgress] = useState(0);
  const [searchMappings, setSearchMappings] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [filterType, setFilterType] = useState<string>('All');
  const [activeView, setActiveView] = useState<'mappings' | 'visual' | 'gaps' | 'report'>('mappings');
  const [expandedMapping, setExpandedMapping] = useState<string | null>(null);
  const [showAddManual, setShowAddManual] = useState(false);
  const [manualSource, setManualSource] = useState('');
  const [manualTarget, setManualTarget] = useState('');

  /* derived */
  const activeSession = useMemo(() => sessions.find(s => s.id === activeSessionId) ?? null, [sessions, activeSessionId]);
  const sourceFramework = useMemo(() => getFramework(activeSession?.sourceFrameworkId ?? sourceFrameworkId), [activeSession, sourceFrameworkId]);
  const targetFramework = useMemo(() => getFramework(activeSession?.targetFrameworkId ?? targetFrameworkId), [activeSession, targetFrameworkId]);

  const sourceControls = useMemo(() => {
    const fid = activeSession?.sourceFrameworkId ?? sourceFrameworkId;
    return CONTROLS_DB.filter(c => c.frameworkId === fid);
  }, [activeSession, sourceFrameworkId]);

  const targetControls = useMemo(() => {
    const fid = activeSession?.targetFrameworkId ?? targetFrameworkId;
    return CONTROLS_DB.filter(c => c.frameworkId === fid);
  }, [activeSession, targetFrameworkId]);

  const filteredMappings = useMemo(() => {
    if (!activeSession) return [];
    return activeSession.mappings.filter(m => {
      if (filterStatus !== 'All' && m.status !== filterStatus) return false;
      if (filterType !== 'All' && m.mappingType !== filterType) return false;
      if (searchMappings) {
        const src = getControl(m.sourceControlId);
        const tgt = getControl(m.targetControlId);
        const term = searchMappings.toLowerCase();
        if (!src?.title.toLowerCase().includes(term) && !src?.controlId.toLowerCase().includes(term) && !tgt?.title.toLowerCase().includes(term) && !tgt?.controlId.toLowerCase().includes(term) && !m.rationale.toLowerCase().includes(term)) return false;
      }
      return true;
    });
  }, [activeSession, filterStatus, filterType, searchMappings]);

  /* gap analysis */
  const gapAnalysis = useMemo(() => {
    if (!activeSession) return { unmappedSource: [] as Control[], unmappedTarget: [] as Control[], coverage: 0 };
    const mappedSourceIds = new Set(activeSession.mappings.filter(m => m.status !== 'Rejected').map(m => m.sourceControlId));
    const mappedTargetIds = new Set(activeSession.mappings.filter(m => m.status !== 'Rejected').map(m => m.targetControlId));
    const unmappedSource = sourceControls.filter(c => !mappedSourceIds.has(c.id));
    const unmappedTarget = targetControls.filter(c => !mappedTargetIds.has(c.id));
    const coverage = sourceControls.length > 0 ? Math.round((mappedSourceIds.size / sourceControls.length) * 100) : 0;
    return { unmappedSource, unmappedTarget, coverage };
  }, [activeSession, sourceControls, targetControls]);

  /* callbacks */
  const [aiError, setAiError] = useState<string | null>(null);

  const runMapping = useCallback(async () => {
    if (!sourceFrameworkId || !targetFrameworkId || sourceFrameworkId === targetFrameworkId) return;
    setIsAnalyzing(true);
    setAnalyzeProgress(0);
    setAiError(null);

    const srcFw = FRAMEWORKS.find(f => f.id === sourceFrameworkId);
    const tgtFw = FRAMEWORKS.find(f => f.id === targetFrameworkId);

    try {
      setAnalyzeProgress(10);

      // Call real AI backend for cross-framework mapping
      const aiResult = await api.ai.crossFrameworkMapping(
        srcFw?.name || sourceFrameworkId,
        tgtFw?.name || targetFrameworkId,
        sourceControls.map(c => ({ controlId: c.controlId, title: c.title, description: c.description, domain: c.domain })),
        targetControls.map(c => ({ controlId: c.controlId, title: c.title, description: c.description, domain: c.domain }))
      );

      setAnalyzeProgress(80);

      // Convert AI response into ControlMapping objects
      const aiMappings: ControlMapping[] = (aiResult.mappings || []).map((m: any) => {
        // Match AI-returned control IDs to our internal IDs
        const srcCtl = sourceControls.find(c => c.controlId === m.sourceControlId) || sourceControls[0];
        const tgtCtl = targetControls.find(c => c.controlId === m.targetControlId) || targetControls[0];
        return {
          id: uid('map'),
          sourceControlId: srcCtl?.id || m.sourceControlId,
          targetControlId: tgtCtl?.id || m.targetControlId,
          confidence: m.confidence || 75,
          status: 'AI Suggested' as const,
          rationale: m.rationale || '',
          mappingType: (m.mappingType || 'Semantic') as 'Full' | 'Partial' | 'Semantic',
        };
      });

      // Also include any pre-built mappings that the AI may have missed
      const prebuiltMappings = PREBUILT_MAPPINGS.filter(m => {
        const src = getControl(m.sourceControlId);
        const tgt = getControl(m.targetControlId);
        return (src?.frameworkId === sourceFrameworkId && tgt?.frameworkId === targetFrameworkId) ||
               (src?.frameworkId === targetFrameworkId && tgt?.frameworkId === sourceFrameworkId);
      }).map(m => {
        const src = getControl(m.sourceControlId);
        if (src?.frameworkId === sourceFrameworkId) {
          return { ...m, id: uid('map') };
        }
        return { ...m, id: uid('map'), sourceControlId: m.targetControlId, targetControlId: m.sourceControlId };
      });

      // Merge: AI mappings take precedence, add prebuilt ones that don't overlap
      const aiPairKeys = new Set(aiMappings.map(m => `${m.sourceControlId}:${m.targetControlId}`));
      const mergedMappings = [
        ...aiMappings,
        ...prebuiltMappings.filter(m => !aiPairKeys.has(`${m.sourceControlId}:${m.targetControlId}`)),
      ];

      setAnalyzeProgress(100);

      const totalSource = sourceControls.length;
      const mappedSourceIds = new Set(mergedMappings.map(m => m.sourceControlId));
      const coverage = totalSource > 0 ? Math.round((mappedSourceIds.size / totalSource) * 100) : 0;
      const avgConf = mergedMappings.length > 0 ? Math.round(mergedMappings.reduce((a, m) => a + m.confidence, 0) / mergedMappings.length) : 0;

      const session: MappingSession = {
        id: uid('session'),
        sourceFrameworkId, targetFrameworkId,
        createdDate: new Date().toISOString().split('T')[0],
        lastUpdated: new Date().toISOString().split('T')[0],
        status: 'In Progress',
        mappings: mergedMappings as ControlMapping[],
        coveragePercent: coverage,
        avgConfidence: avgConf,
      };

      setSessions(prev => [...prev, session]);
      setActiveSessionId(session.id);
    } catch (error: any) {
      logger.error('Cross-framework mapping error:', error);
      setAiError(error?.message || 'Failed to perform AI mapping. Please try again.');

      // Fallback to pre-built mappings only
      const fallbackMappings = PREBUILT_MAPPINGS.filter(m => {
        const src = getControl(m.sourceControlId);
        const tgt = getControl(m.targetControlId);
        return (src?.frameworkId === sourceFrameworkId && tgt?.frameworkId === targetFrameworkId) ||
               (src?.frameworkId === targetFrameworkId && tgt?.frameworkId === sourceFrameworkId);
      }).map(m => {
        const src = getControl(m.sourceControlId);
        if (src?.frameworkId === sourceFrameworkId) return { ...m, id: uid('map') };
        return { ...m, id: uid('map'), sourceControlId: m.targetControlId, targetControlId: m.sourceControlId };
      });

      if (fallbackMappings.length > 0) {
        const totalSource = sourceControls.length;
        const mappedSourceIds = new Set(fallbackMappings.map(m => m.sourceControlId));
        const coverage = totalSource > 0 ? Math.round((mappedSourceIds.size / totalSource) * 100) : 0;
        const avgConf = fallbackMappings.length > 0 ? Math.round(fallbackMappings.reduce((a, m) => a + m.confidence, 0) / fallbackMappings.length) : 0;

        const session: MappingSession = {
          id: uid('session'),
          sourceFrameworkId, targetFrameworkId,
          createdDate: new Date().toISOString().split('T')[0],
          lastUpdated: new Date().toISOString().split('T')[0],
          status: 'In Progress',
          mappings: fallbackMappings as ControlMapping[],
          coveragePercent: coverage,
          avgConfidence: avgConf,
        };
        setSessions(prev => [...prev, session]);
        setActiveSessionId(session.id);
      }
    } finally {
      setIsAnalyzing(false);
      setAnalyzeProgress(0);
    }
  }, [sourceFrameworkId, targetFrameworkId, sourceControls, targetControls]);

  const updateMappingStatus = useCallback((mappingId: string, status: ControlMapping['status']) => {
    setSessions(prev => prev.map(s => {
      if (s.id !== activeSessionId) return s;
      const updated = {
        ...s,
        mappings: s.mappings.map(m => m.id === mappingId ? { ...m, status, confirmedBy: status === 'Confirmed' ? 'Current User' : undefined, confirmedDate: status === 'Confirmed' ? new Date().toISOString().split('T')[0] : undefined } : m),
        lastUpdated: new Date().toISOString().split('T')[0],
      };
      // Recalculate coverage
      const sourceCtls = CONTROLS_DB.filter(c => c.frameworkId === s.sourceFrameworkId);
      const mappedIds = new Set(updated.mappings.filter(m => m.status !== 'Rejected').map(m => m.sourceControlId));
      updated.coveragePercent = sourceCtls.length > 0 ? Math.round((mappedIds.size / sourceCtls.length) * 100) : 0;
      updated.avgConfidence = updated.mappings.length > 0 ? Math.round(updated.mappings.filter(m => m.status !== 'Rejected').reduce((a, m) => a + m.confidence, 0) / updated.mappings.filter(m => m.status !== 'Rejected').length) : 0;
      return updated;
    }));
  }, [activeSessionId]);

  const addManualMapping = useCallback(() => {
    if (!manualSource || !manualTarget || !activeSessionId) return;
    const newMapping: ControlMapping = {
      id: uid('map'), sourceControlId: manualSource, targetControlId: manualTarget,
      confidence: 100, status: 'Manual', rationale: 'Manually added by user.',
      mappingType: 'Full',
    };
    setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, mappings: [...s.mappings, newMapping], lastUpdated: new Date().toISOString().split('T')[0] } : s));
    setManualSource(''); setManualTarget(''); setShowAddManual(false);
  }, [manualSource, manualTarget, activeSessionId]);

  const exportReport = useCallback(() => {
    if (!activeSession) return;
    const sf = getFramework(activeSession.sourceFrameworkId);
    const tf = getFramework(activeSession.targetFrameworkId);
    const reportData = {
      title: `Cross-Framework Control Mapping Report`,
      sourceFramework: sf?.name,
      targetFramework: tf?.name,
      generatedDate: new Date().toISOString(),
      summary: {
        totalMappings: activeSession.mappings.length,
        confirmed: activeSession.mappings.filter(m => m.status === 'Confirmed').length,
        aiSuggested: activeSession.mappings.filter(m => m.status === 'AI Suggested').length,
        rejected: activeSession.mappings.filter(m => m.status === 'Rejected').length,
        manual: activeSession.mappings.filter(m => m.status === 'Manual').length,
        coverage: activeSession.coveragePercent,
        averageConfidence: activeSession.avgConfidence,
      },
      mappings: activeSession.mappings.map(m => ({
        source: getControl(m.sourceControlId),
        target: getControl(m.targetControlId),
        confidence: m.confidence,
        status: m.status,
        type: m.mappingType,
        rationale: m.rationale,
      })),
      gaps: {
        unmappedSourceControls: gapAnalysis.unmappedSource.map(c => ({ controlId: c.controlId, title: c.title })),
        unmappedTargetControls: gapAnalysis.unmappedTarget.map(c => ({ controlId: c.controlId, title: c.title })),
      },
    };
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `mapping_${sf?.shortName}_to_${tf?.shortName}_report.json`; a.click();
    URL.revokeObjectURL(url);
  }, [activeSession, gapAnalysis]);

  /* ================================================================ */
  /*  RENDER - Framework Selection (no active session)                  */
  /* ================================================================ */
  if (!activeSession) {
    return (
      <div className="h-full flex flex-col space-y-6">
        {loading && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-2 text-blue-700 text-sm">
            <Loader2 size={14} className="animate-spin" />
            Loading framework catalog...
          </div>
        )}
        {loadError && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2 text-red-700 text-sm">
            <AlertTriangle size={14} />
            {loadError}
          </div>
        )}
        {!loading && !loadError && FRAMEWORKS.length === 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-center gap-2 text-yellow-800 text-sm">
            <Info size={14} />
            No frameworks configured for your organization yet. Add a framework to begin mapping.
          </div>
        )}
        <div className="flex items-center space-x-4">
          <button onClick={onBack} className="p-2 hover:bg-gray-200 rounded-full transition-colors"><ArrowLeft size={20} /></button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Cross-Framework Control Mapper</h2>
            <p className="text-sm text-gray-500">AI-powered NLP mapping between compliance frameworks with confidence scoring</p>
          </div>
        </div>

        {/* Previous sessions */}
        {sessions.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900">Previous Mapping Sessions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {sessions.map(s => {
                const sf = getFramework(s.sourceFrameworkId);
                const tf = getFramework(s.targetFrameworkId);
                return (
                  <div key={s.id} onClick={() => setActiveSessionId(s.id)} className="bg-white rounded-xl border border-gray-200 p-4 hover:border-brand-400 hover:shadow-md transition-all cursor-pointer">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold text-white ${sf?.color}`}>{sf?.shortName}</span>
                      <ArrowRight size={14} className="text-gray-400" />
                      <span className={`px-2 py-0.5 rounded text-xs font-bold text-white ${tf?.color}`}>{tf?.shortName}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs text-gray-500">
                      <div><p className="font-medium text-gray-900">{s.mappings.length}</p>Mappings</div>
                      <div><p className="font-medium text-gray-900">{s.coveragePercent}%</p>Coverage</div>
                      <div><p className="font-medium text-gray-900">{s.avgConfidence}%</p>Avg Conf.</div>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">{s.lastUpdated}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* New mapping */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><Brain size={18} className="text-brand-600" /> New AI-Powered Mapping</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Source Framework</label>
              <select value={sourceFrameworkId} onChange={e => setSourceFrameworkId(e.target.value)} className="w-full border rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-500 outline-none">
                <option value="">Select source...</option>
                {FRAMEWORKS.map(f => <option key={f.id} value={f.id} disabled={f.id === targetFrameworkId}>{f.name} ({f.controlCount} controls)</option>)}
              </select>
            </div>
            <div className="flex items-center justify-center"><ArrowRight size={24} className="text-gray-400" /></div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Framework</label>
              <select value={targetFrameworkId} onChange={e => setTargetFrameworkId(e.target.value)} className="w-full border rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-500 outline-none">
                <option value="">Select target...</option>
                {FRAMEWORKS.map(f => <option key={f.id} value={f.id} disabled={f.id === sourceFrameworkId}>{f.name} ({f.controlCount} controls)</option>)}
              </select>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button onClick={runMapping} disabled={!sourceFrameworkId || !targetFrameworkId || sourceFrameworkId === targetFrameworkId || isAnalyzing} className="flex items-center gap-2 bg-brand-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              {isAnalyzing ? <><Loader2 size={16} className="animate-spin" /> Analyzing...</> : <><Zap size={16} /> Run AI Mapping</>}
            </button>
          </div>
          {isAnalyzing && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Analyzing control relationships...</span>
                <span>{analyzeProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2"><div className={`h-2 rounded-full transition-all duration-300 ${confidenceBar(analyzeProgress)}`} style={{ width: `${analyzeProgress}%` }} /></div>
              <div className="mt-2 text-xs text-gray-400">
                {analyzeProgress < 30 ? 'Parsing source framework controls...' : analyzeProgress < 60 ? 'Running NLP similarity analysis...' : analyzeProgress < 90 ? 'Computing confidence scores...' : 'Finalizing mappings...'}
              </div>
            </div>
          )}
        </div>

        {/* Framework catalog */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">Available Frameworks</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {FRAMEWORKS.map(f => (
              <div key={f.id} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`w-3 h-3 rounded-full ${f.color}`} />
                  <h4 className="font-semibold text-gray-900 text-sm">{f.shortName}</h4>
                </div>
                <p className="text-xs text-gray-500 mb-2 line-clamp-1">{f.name}</p>
                <div className="flex justify-between text-xs">
                  <span className="px-2 py-0.5 bg-gray-100 rounded text-gray-600">{f.category}</span>
                  <span className="text-gray-400">{f.controlCount} controls</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ================================================================ */
  /*  RENDER - Active Mapping Session                                   */
  /* ================================================================ */
  const confirmed = activeSession.mappings.filter(m => m.status === 'Confirmed').length;
  const aiSuggested = activeSession.mappings.filter(m => m.status === 'AI Suggested').length;
  const rejected = activeSession.mappings.filter(m => m.status === 'Rejected').length;
  const manual = activeSession.mappings.filter(m => m.status === 'Manual').length;

  return (
    <div className="h-full flex flex-col space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button onClick={() => setActiveSessionId(null)} className="p-2 hover:bg-gray-200 rounded-full transition-colors"><ArrowLeft size={20} /></button>
          <div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded text-xs font-bold text-white ${sourceFramework?.color}`}>{sourceFramework?.shortName}</span>
              <ArrowRight size={16} className="text-gray-400" />
              <span className={`px-2 py-0.5 rounded text-xs font-bold text-white ${targetFramework?.color}`}>{targetFramework?.shortName}</span>
            </div>
            <p className="text-sm text-gray-500 mt-0.5">{sourceFramework?.name} to {targetFramework?.name}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={exportReport} className="flex items-center gap-1 px-3 py-1.5 border rounded-lg text-sm hover:bg-gray-50"><Download size={14} /> Export Report</button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        {[
          { label: 'Total Mappings', value: activeSession.mappings.length, color: 'text-gray-900', bg: 'bg-gray-50' },
          { label: 'AI Suggested', value: aiSuggested, color: 'text-purple-700', bg: 'bg-purple-50' },
          { label: 'Confirmed', value: confirmed, color: 'text-green-700', bg: 'bg-green-50' },
          { label: 'Rejected', value: rejected, color: 'text-red-700', bg: 'bg-red-50' },
          { label: 'Coverage', value: `${activeSession.coveragePercent}%`, color: 'text-blue-700', bg: 'bg-blue-50' },
          { label: 'Avg Confidence', value: `${activeSession.avgConfidence}%`, color: 'text-amber-700', bg: 'bg-amber-50' },
        ].map((s, i) => (
          <div key={i} className={`${s.bg} rounded-xl border border-gray-200 p-3 text-center`}>
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {([
          { key: 'mappings' as const, label: 'Control Mappings', icon: <Link2 size={14} /> },
          { key: 'visual' as const, label: 'Visual Diagram', icon: <GitCompare size={14} /> },
          { key: 'gaps' as const, label: `Gap Analysis (${gapAnalysis.unmappedSource.length})`, icon: <Target size={14} /> },
          { key: 'report' as const, label: 'Summary Report', icon: <FileText size={14} /> },
        ]).map(t => (
          <button key={t.key} onClick={() => setActiveView(t.key)} className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${activeView === t.key ? 'border-brand-600 text-brand-700' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* MAPPINGS VIEW */}
      {activeView === 'mappings' && (
        <div className="space-y-3">
          {/* Filters */}
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={searchMappings} onChange={e => setSearchMappings(e.target.value)} placeholder="Search controls..." className="w-full pl-8 pr-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none" />
            </div>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none">
              <option value="All">All Statuses</option>
              {['AI Suggested', 'Confirmed', 'Rejected', 'Manual'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={filterType} onChange={e => setFilterType(e.target.value)} className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none">
              <option value="All">All Types</option>
              {['Full', 'Partial', 'Semantic'].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <button onClick={() => setShowAddManual(true)} className="flex items-center gap-1 bg-brand-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-brand-700"><Plus size={14} /> Manual Mapping</button>
          </div>

          {/* Mapping list */}
          {filteredMappings.map(mapping => {
            const src = getControl(mapping.sourceControlId);
            const tgt = getControl(mapping.targetControlId);
            const isExpanded = expandedMapping === mapping.id;
            return (
              <div key={mapping.id} className={`bg-white rounded-xl border transition-all ${mapping.status === 'Rejected' ? 'border-red-200 opacity-60' : 'border-gray-200'}`}>
                <div className="p-4 cursor-pointer" onClick={() => setExpandedMapping(isExpanded ? null : mapping.id)}>
                  <div className="flex items-center gap-3">
                    {/* Source */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold text-white ${sourceFramework?.color}`}>{src?.controlId}</span>
                        <span className="font-medium text-gray-900 text-sm truncate">{src?.title}</span>
                      </div>
                      <p className="text-xs text-gray-400 truncate">{src?.domain}</p>
                    </div>
                    {/* Arrow + Confidence */}
                    <div className="flex flex-col items-center shrink-0 px-2">
                      <div className="flex items-center gap-1">
                        <ArrowRight size={16} className="text-gray-400" />
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${confidenceColor(mapping.confidence)}`}>{mapping.confidence}%</span>
                      </div>
                      <span className={`mt-0.5 px-1.5 py-0 rounded text-[10px] font-medium border ${mappingTypeBadge(mapping.mappingType)}`}>{mapping.mappingType}</span>
                    </div>
                    {/* Target */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold text-white ${targetFramework?.color}`}>{tgt?.controlId}</span>
                        <span className="font-medium text-gray-900 text-sm truncate">{tgt?.title}</span>
                      </div>
                      <p className="text-xs text-gray-400 truncate">{tgt?.domain}</p>
                    </div>
                    {/* Status + Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge(mapping.status)}`}>{mapping.status}</span>
                      {mapping.status === 'AI Suggested' && (
                        <div className="flex gap-1">
                          <button onClick={e => { e.stopPropagation(); updateMappingStatus(mapping.id, 'Confirmed'); }} className="p-1 rounded hover:bg-green-100 text-green-600" title="Confirm"><ThumbsUp size={14} /></button>
                          <button onClick={e => { e.stopPropagation(); updateMappingStatus(mapping.id, 'Rejected'); }} className="p-1 rounded hover:bg-red-100 text-red-600" title="Reject"><ThumbsDown size={14} /></button>
                        </div>
                      )}
                      {mapping.status === 'Rejected' && (
                        <button onClick={e => { e.stopPropagation(); updateMappingStatus(mapping.id, 'AI Suggested'); }} className="p-1 rounded hover:bg-gray-100 text-gray-500" title="Restore"><RefreshCw size={14} /></button>
                      )}
                      <ChevronDown size={14} className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </div>
                  </div>
                </div>
                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t border-gray-100 px-4 py-3 bg-gray-50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                      <div>
                        <p className="text-xs font-semibold text-gray-500 mb-1">Source: {src?.controlId}</p>
                        <p className="text-sm text-gray-700">{src?.description}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-500 mb-1">Target: {tgt?.controlId}</p>
                        <p className="text-sm text-gray-700">{tgt?.description}</p>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg border border-gray-200 p-3">
                      <p className="text-xs font-semibold text-gray-500 mb-1 flex items-center gap-1"><Brain size={12} /> AI Rationale</p>
                      <p className="text-sm text-gray-700">{mapping.rationale}</p>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                      <span>Confidence: {mapping.confidence}%</span>
                      <span>Type: {mapping.mappingType}</span>
                      {mapping.confirmedBy && <span>Confirmed by: {mapping.confirmedBy} on {mapping.confirmedDate}</span>}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {filteredMappings.length === 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-gray-400">
              <Link2 size={36} className="mx-auto mb-2 opacity-40" />
              <p>No mappings match your current filters.</p>
            </div>
          )}
        </div>
      )}

      {/* VISUAL DIAGRAM VIEW */}
      {activeView === 'visual' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 overflow-auto">
          <div className="flex gap-16 min-w-[900px]">
            {/* Source column */}
            <div className="flex-1">
              <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2"><span className={`px-2 py-0.5 rounded text-xs text-white ${sourceFramework?.color}`}>{sourceFramework?.shortName}</span> Source Controls</h4>
              <div className="space-y-1.5">
                {sourceControls.map(ctrl => {
                  const hasMappings = activeSession.mappings.some(m => m.sourceControlId === ctrl.id && m.status !== 'Rejected');
                  return (
                    <div key={ctrl.id} className={`px-3 py-2 rounded-lg border text-sm ${hasMappings ? 'bg-green-50 border-green-200 text-green-900' : 'bg-red-50 border-red-200 text-red-900'}`}>
                      <span className="font-mono text-xs font-bold mr-2">{ctrl.controlId}</span>
                      <span className="text-xs">{ctrl.title}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            {/* Mapping lines (simplified visual) */}
            <div className="w-48 shrink-0 flex flex-col items-center justify-center">
              <svg className="w-full h-full" style={{ minHeight: Math.max(sourceControls.length, targetControls.length) * 36 }}>
                {activeSession.mappings.filter(m => m.status !== 'Rejected').map((m, i) => {
                  const srcIdx = sourceControls.findIndex(c => c.id === m.sourceControlId);
                  const tgtIdx = targetControls.findIndex(c => c.id === m.targetControlId);
                  if (srcIdx < 0 || tgtIdx < 0) return null;
                  const y1 = srcIdx * 36 + 18;
                  const y2 = tgtIdx * 36 + 18;
                  const strokeColor = m.confidence >= 90 ? '#22c55e' : m.confidence >= 75 ? '#3b82f6' : m.confidence >= 60 ? '#f59e0b' : '#ef4444';
                  return (
                    <line key={m.id} x1={0} y1={y1} x2={192} y2={y2} stroke={strokeColor} strokeWidth={1.5} strokeOpacity={0.6} />
                  );
                })}
              </svg>
            </div>
            {/* Target column */}
            <div className="flex-1">
              <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2"><span className={`px-2 py-0.5 rounded text-xs text-white ${targetFramework?.color}`}>{targetFramework?.shortName}</span> Target Controls</h4>
              <div className="space-y-1.5">
                {targetControls.map(ctrl => {
                  const hasMappings = activeSession.mappings.some(m => m.targetControlId === ctrl.id && m.status !== 'Rejected');
                  return (
                    <div key={ctrl.id} className={`px-3 py-2 rounded-lg border text-sm ${hasMappings ? 'bg-green-50 border-green-200 text-green-900' : 'bg-red-50 border-red-200 text-red-900'}`}>
                      <span className="font-mono text-xs font-bold mr-2">{ctrl.controlId}</span>
                      <span className="text-xs">{ctrl.title}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="mt-4 flex gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1"><span className="w-6 h-0.5 bg-green-500 inline-block" /> 90%+ confidence</span>
            <span className="flex items-center gap-1"><span className="w-6 h-0.5 bg-blue-500 inline-block" /> 75-89%</span>
            <span className="flex items-center gap-1"><span className="w-6 h-0.5 bg-amber-500 inline-block" /> 60-74%</span>
            <span className="flex items-center gap-1"><span className="w-6 h-0.5 bg-red-500 inline-block" /> Below 60%</span>
          </div>
        </div>
      )}

      {/* GAP ANALYSIS VIEW */}
      {activeView === 'gaps' && (
        <div className="space-y-4">
          {/* Coverage overview */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h4 className="font-semibold text-gray-900 mb-3">Mapping Coverage</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">Source Coverage</p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-gray-200 rounded-full h-3"><div className={`h-3 rounded-full ${gapAnalysis.coverage >= 80 ? 'bg-green-500' : gapAnalysis.coverage >= 50 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${gapAnalysis.coverage}%` }} /></div>
                  <span className="text-lg font-bold text-gray-900">{gapAnalysis.coverage}%</span>
                </div>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-500 mb-1">Unmapped Source Controls</p>
                <p className="text-2xl font-bold text-red-600">{gapAnalysis.unmappedSource.length}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-500 mb-1">Unmapped Target Controls</p>
                <p className="text-2xl font-bold text-amber-600">{gapAnalysis.unmappedTarget.length}</p>
              </div>
            </div>
          </div>

          {/* Unmapped source controls */}
          {gapAnalysis.unmappedSource.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><AlertTriangle size={16} className="text-red-500" /> Source Controls Without Target Mapping</h4>
              <p className="text-sm text-gray-500 mb-3">These {sourceFramework?.shortName} controls have no equivalent mapping in {targetFramework?.shortName}. Consider implementing additional controls or accepting the gap with justification.</p>
              <div className="space-y-2">
                {gapAnalysis.unmappedSource.map(ctrl => (
                  <div key={ctrl.id} className="flex items-start gap-3 bg-red-50 rounded-lg border border-red-200 p-3">
                    <span className="font-mono text-xs font-bold text-red-800 shrink-0 mt-0.5">{ctrl.controlId}</span>
                    <div>
                      <p className="text-sm font-medium text-red-900">{ctrl.title}</p>
                      <p className="text-xs text-red-700 mt-0.5">{ctrl.description}</p>
                      <span className="mt-1 inline-block px-2 py-0.5 rounded bg-red-100 text-red-700 text-xs">{ctrl.domain}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Unmapped target controls */}
          {gapAnalysis.unmappedTarget.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><Info size={16} className="text-amber-500" /> Target Controls Without Source Mapping</h4>
              <p className="text-sm text-gray-500 mb-3">These {targetFramework?.shortName} controls are not covered by any {sourceFramework?.shortName} control. Additional implementation may be required.</p>
              <div className="space-y-2">
                {gapAnalysis.unmappedTarget.map(ctrl => (
                  <div key={ctrl.id} className="flex items-start gap-3 bg-amber-50 rounded-lg border border-amber-200 p-3">
                    <span className="font-mono text-xs font-bold text-amber-800 shrink-0 mt-0.5">{ctrl.controlId}</span>
                    <div>
                      <p className="text-sm font-medium text-amber-900">{ctrl.title}</p>
                      <p className="text-xs text-amber-700 mt-0.5">{ctrl.description}</p>
                      <span className="mt-1 inline-block px-2 py-0.5 rounded bg-amber-100 text-amber-700 text-xs">{ctrl.domain}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {gapAnalysis.unmappedSource.length === 0 && gapAnalysis.unmappedTarget.length === 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
              <CheckCircle size={40} className="mx-auto mb-3 text-green-500" />
              <p className="text-lg font-semibold text-gray-900">Full Coverage Achieved</p>
              <p className="text-sm text-gray-500 mt-1">All controls in both frameworks have been mapped.</p>
            </div>
          )}
        </div>
      )}

      {/* REPORT VIEW */}
      {activeView === 'report' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Mapping Summary Report</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-50 rounded-lg p-3"><p className="text-xs text-gray-500">Source</p><p className="font-semibold text-gray-900">{sourceFramework?.name}</p></div>
              <div className="bg-gray-50 rounded-lg p-3"><p className="text-xs text-gray-500">Target</p><p className="font-semibold text-gray-900">{targetFramework?.name}</p></div>
              <div className="bg-gray-50 rounded-lg p-3"><p className="text-xs text-gray-500">Generated</p><p className="font-semibold text-gray-900">{activeSession.createdDate}</p></div>
              <div className="bg-gray-50 rounded-lg p-3"><p className="text-xs text-gray-500">Last Updated</p><p className="font-semibold text-gray-900">{activeSession.lastUpdated}</p></div>
            </div>

            {/* Mapping type breakdown */}
            <h4 className="font-semibold text-gray-900 mb-3">Mapping Type Breakdown</h4>
            <div className="grid grid-cols-3 gap-4 mb-6">
              {(['Full', 'Partial', 'Semantic'] as const).map(type => {
                const count = activeSession.mappings.filter(m => m.mappingType === type && m.status !== 'Rejected').length;
                const pct = activeSession.mappings.filter(m => m.status !== 'Rejected').length > 0 ? Math.round((count / activeSession.mappings.filter(m => m.status !== 'Rejected').length) * 100) : 0;
                return (
                  <div key={type} className={`rounded-lg border p-4 ${mappingTypeBadge(type)}`}>
                    <p className="text-2xl font-bold">{count}</p>
                    <p className="text-sm font-medium">{type} Mappings ({pct}%)</p>
                    <p className="text-xs mt-1 opacity-75">{type === 'Full' ? 'Direct 1:1 control equivalence' : type === 'Partial' ? 'Overlapping but not identical' : 'Conceptually similar intent'}</p>
                  </div>
                );
              })}
            </div>

            {/* Confidence distribution */}
            <h4 className="font-semibold text-gray-900 mb-3">Confidence Distribution</h4>
            <div className="grid grid-cols-4 gap-3 mb-6">
              {[
                { label: '90-100%', min: 90, max: 100, color: 'bg-green-100 text-green-800' },
                { label: '75-89%', min: 75, max: 89, color: 'bg-blue-100 text-blue-800' },
                { label: '60-74%', min: 60, max: 74, color: 'bg-amber-100 text-amber-800' },
                { label: '<60%', min: 0, max: 59, color: 'bg-red-100 text-red-800' },
              ].map(range => {
                const count = activeSession.mappings.filter(m => m.confidence >= range.min && m.confidence <= range.max && m.status !== 'Rejected').length;
                return (
                  <div key={range.label} className={`rounded-lg p-3 text-center ${range.color}`}>
                    <p className="text-xl font-bold">{count}</p>
                    <p className="text-xs">{range.label}</p>
                  </div>
                );
              })}
            </div>

            {/* Review status */}
            <h4 className="font-semibold text-gray-900 mb-3">Review Status</h4>
            <div className="grid grid-cols-4 gap-3">
              <div className="bg-purple-50 rounded-lg p-3 text-center"><p className="text-xl font-bold text-purple-700">{aiSuggested}</p><p className="text-xs text-purple-600">Awaiting Review</p></div>
              <div className="bg-green-50 rounded-lg p-3 text-center"><p className="text-xl font-bold text-green-700">{confirmed}</p><p className="text-xs text-green-600">Confirmed</p></div>
              <div className="bg-red-50 rounded-lg p-3 text-center"><p className="text-xl font-bold text-red-700">{rejected}</p><p className="text-xs text-red-600">Rejected</p></div>
              <div className="bg-blue-50 rounded-lg p-3 text-center"><p className="text-xl font-bold text-blue-700">{manual}</p><p className="text-xs text-blue-600">Manual</p></div>
            </div>
          </div>
        </div>
      )}

      {/* Add Manual Mapping Modal */}
      {showAddManual && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4">
            <div className="flex justify-between items-center"><h3 className="text-lg font-bold">Add Manual Mapping</h3><button onClick={() => setShowAddManual(false)} className="p-1 hover:bg-gray-100 rounded-full"><X size={18} /></button></div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Source Control ({sourceFramework?.shortName})</label>
              <select value={manualSource} onChange={e => setManualSource(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none">
                <option value="">Select source control...</option>
                {sourceControls.map(c => <option key={c.id} value={c.id}>{c.controlId} - {c.title}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Control ({targetFramework?.shortName})</label>
              <select value={manualTarget} onChange={e => setManualTarget(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none">
                <option value="">Select target control...</option>
                {targetControls.map(c => <option key={c.id} value={c.id}>{c.controlId} - {c.title}</option>)}
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowAddManual(false)} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">Cancel</button>
              <button onClick={addManualMapping} disabled={!manualSource || !manualTarget} className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm hover:bg-brand-700 disabled:opacity-50">Add Mapping</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
