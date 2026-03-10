/**
 * Report Builder Component
 *
 * Visual report builder with drag-and-drop sections:
 * - Report template management (create, edit, delete)
 * - Section types: tables, charts, metrics, text blocks
 * - Data source selection (frameworks, risks, controls, incidents, vendors, costs)
 * - Filter configuration (date range, framework, department)
 * - Schedule automation with cron-like picker
 * - Export format selection (PDF, Excel, CSV)
 * - Template library with pre-built reports
 * - API calls to /api/reports
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import {
  ArrowLeft, Plus, Loader2, Search, X, ChevronDown, ChevronUp, Trash2,
  Edit3, FileText, BarChart3, Table, Type, GripVertical, Download, Calendar,
  Clock, Play, Copy, Eye, Settings, Filter, RefreshCw, CheckCircle,
  AlertTriangle, PieChart as PieChartIcon, TrendingUp, Layout, Save,
  Layers, FolderOpen, Shield, AlertCircle, Building2, DollarSign,
  Users, Zap, FileDown, Mail,
} from 'lucide-react';
import { toast } from 'sonner';

// ── Type Definitions ────────────────────────────────────────────────────────

type ViewMode = 'library' | 'builder' | 'preview' | 'schedule';

type SectionType = 'table' | 'chart' | 'metric' | 'text';

type DataSource = 'frameworks' | 'risks' | 'controls' | 'incidents' | 'vendors' | 'costs';

type ExportFormat = 'PDF' | 'Excel' | 'CSV';

type ScheduleFrequency = 'once' | 'daily' | 'weekly' | 'monthly' | 'quarterly';

interface ReportSection {
  id: string;
  type: SectionType;
  title: string;
  dataSource: DataSource;
  config: Record<string, any>;
  order: number;
}

interface ReportFilter {
  dateRange: { start: string; end: string };
  frameworks: string[];
  departments: string[];
}

interface ReportSchedule {
  enabled: boolean;
  frequency: ScheduleFrequency;
  dayOfWeek?: number;
  dayOfMonth?: number;
  time: string;
  recipients: string[];
  format: ExportFormat;
}

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  sections: ReportSection[];
  filters: ReportFilter;
  schedule: ReportSchedule;
  exportFormat: ExportFormat;
  isBuiltIn: boolean;
  category: string;
  lastGenerated?: string;
  createdAt: string;
  updatedAt: string;
}

interface GeneratedReport {
  id: string;
  templateId: string;
  templateName: string;
  format: ExportFormat;
  status: 'generating' | 'completed' | 'failed';
  fileUrl?: string;
  generatedAt: string;
  sizeBytes?: number;
}

const SECTION_TYPES: { type: SectionType; label: string; icon: React.ReactNode; description: string }[] = [
  { type: 'table', label: 'Data Table', icon: <Table className="w-5 h-5" />, description: 'Tabular data with sorting and filtering' },
  { type: 'chart', label: 'Chart', icon: <BarChart3 className="w-5 h-5" />, description: 'Bar, line, pie, or area chart' },
  { type: 'metric', label: 'Metrics Card', icon: <TrendingUp className="w-5 h-5" />, description: 'Key numbers with trend indicators' },
  { type: 'text', label: 'Text Block', icon: <Type className="w-5 h-5" />, description: 'Rich text narrative or summary' },
];

const DATA_SOURCES: { source: DataSource; label: string; icon: React.ReactNode }[] = [
  { source: 'frameworks', label: 'Frameworks', icon: <Shield className="w-4 h-4" /> },
  { source: 'risks', label: 'Risks', icon: <AlertTriangle className="w-4 h-4" /> },
  { source: 'controls', label: 'Controls', icon: <CheckCircle className="w-4 h-4" /> },
  { source: 'incidents', label: 'Incidents', icon: <AlertCircle className="w-4 h-4" /> },
  { source: 'vendors', label: 'Vendors', icon: <Building2 className="w-4 h-4" /> },
  { source: 'costs', label: 'Costs', icon: <DollarSign className="w-4 h-4" /> },
];

const DEPARTMENTS = ['Engineering', 'Finance', 'Legal', 'HR', 'Operations', 'Sales', 'Marketing', 'IT', 'Executive'];

const CHART_TYPES = ['bar', 'line', 'pie', 'area', 'donut'];

const BUILT_IN_TEMPLATES: Omit<ReportTemplate, 'createdAt' | 'updatedAt'>[] = [
  {
    id: 'builtin-soc2',
    name: 'SOC 2 Readiness Report',
    description: 'Comprehensive SOC 2 Type II readiness assessment with control status, evidence gaps, and remediation timeline.',
    category: 'Compliance',
    isBuiltIn: true,
    exportFormat: 'PDF',
    sections: [
      { id: 's1', type: 'metric', title: 'Readiness Overview', dataSource: 'controls', config: { metrics: ['readiness_score', 'controls_passing', 'evidence_gaps'] }, order: 0 },
      { id: 's2', type: 'chart', title: 'Control Status by Trust Service Criteria', dataSource: 'controls', config: { chartType: 'bar', groupBy: 'category' }, order: 1 },
      { id: 's3', type: 'table', title: 'Evidence Gap Analysis', dataSource: 'controls', config: { columns: ['control', 'status', 'evidence', 'gap', 'priority'] }, order: 2 },
      { id: 's4', type: 'text', title: 'Remediation Recommendations', dataSource: 'controls', config: { template: 'ai_recommendations' }, order: 3 },
    ],
    filters: { dateRange: { start: '', end: '' }, frameworks: ['SOC 2'], departments: [] },
    schedule: { enabled: false, frequency: 'monthly', time: '09:00', recipients: [], format: 'PDF' },
  },
  {
    id: 'builtin-gdpr',
    name: 'GDPR Compliance Report',
    description: 'GDPR compliance posture including data processing activities, DPIA status, and privacy control effectiveness.',
    category: 'Privacy',
    isBuiltIn: true,
    exportFormat: 'PDF',
    sections: [
      { id: 's1', type: 'metric', title: 'GDPR Compliance Score', dataSource: 'frameworks', config: { metrics: ['compliance_score', 'dpia_count', 'breach_count'] }, order: 0 },
      { id: 's2', type: 'chart', title: 'Compliance by Article', dataSource: 'controls', config: { chartType: 'bar', groupBy: 'article' }, order: 1 },
      { id: 's3', type: 'table', title: 'Data Processing Activities', dataSource: 'controls', config: { columns: ['activity', 'legal_basis', 'data_types', 'status'] }, order: 2 },
      { id: 's4', type: 'text', title: 'Privacy Impact Summary', dataSource: 'risks', config: { template: 'privacy_summary' }, order: 3 },
    ],
    filters: { dateRange: { start: '', end: '' }, frameworks: ['GDPR'], departments: [] },
    schedule: { enabled: false, frequency: 'quarterly', time: '09:00', recipients: [], format: 'PDF' },
  },
  {
    id: 'builtin-risk',
    name: 'Risk Summary Report',
    description: 'Organization-wide risk landscape with trending analysis, heat maps, and mitigation progress.',
    category: 'Risk',
    isBuiltIn: true,
    exportFormat: 'PDF',
    sections: [
      { id: 's1', type: 'metric', title: 'Risk Overview', dataSource: 'risks', config: { metrics: ['total_risks', 'critical_risks', 'mitigated_risks'] }, order: 0 },
      { id: 's2', type: 'chart', title: 'Risk by Severity', dataSource: 'risks', config: { chartType: 'pie', groupBy: 'severity' }, order: 1 },
      { id: 's3', type: 'chart', title: 'Risk Trend (12 months)', dataSource: 'risks', config: { chartType: 'line', groupBy: 'month' }, order: 2 },
      { id: 's4', type: 'table', title: 'Top Risks & Mitigations', dataSource: 'risks', config: { columns: ['title', 'severity', 'status', 'owner', 'mitigation'] }, order: 3 },
    ],
    filters: { dateRange: { start: '', end: '' }, frameworks: [], departments: [] },
    schedule: { enabled: false, frequency: 'weekly', time: '08:00', recipients: [], format: 'PDF' },
  },
  {
    id: 'builtin-vendor',
    name: 'Vendor Risk Assessment',
    description: 'Third-party risk overview with vendor scores, certification status, and monitoring alerts.',
    category: 'Vendor',
    isBuiltIn: true,
    exportFormat: 'Excel',
    sections: [
      { id: 's1', type: 'metric', title: 'Vendor Overview', dataSource: 'vendors', config: { metrics: ['total_vendors', 'high_risk', 'avg_score'] }, order: 0 },
      { id: 's2', type: 'chart', title: 'Vendors by Risk Level', dataSource: 'vendors', config: { chartType: 'donut', groupBy: 'riskLevel' }, order: 1 },
      { id: 's3', type: 'table', title: 'Vendor Details', dataSource: 'vendors', config: { columns: ['name', 'risk_score', 'certifications', 'review_date'] }, order: 2 },
    ],
    filters: { dateRange: { start: '', end: '' }, frameworks: [], departments: [] },
    schedule: { enabled: false, frequency: 'monthly', time: '09:00', recipients: [], format: 'Excel' },
  },
  {
    id: 'builtin-incident',
    name: 'Incident Response Summary',
    description: 'Security incident overview with response metrics, timeline analysis, and lessons learned.',
    category: 'Security',
    isBuiltIn: true,
    exportFormat: 'PDF',
    sections: [
      { id: 's1', type: 'metric', title: 'Incident Metrics', dataSource: 'incidents', config: { metrics: ['total_incidents', 'avg_mttr', 'open_incidents'] }, order: 0 },
      { id: 's2', type: 'chart', title: 'Incidents by Category', dataSource: 'incidents', config: { chartType: 'bar', groupBy: 'category' }, order: 1 },
      { id: 's3', type: 'table', title: 'Recent Incidents', dataSource: 'incidents', config: { columns: ['title', 'severity', 'status', 'mttr', 'root_cause'] }, order: 2 },
    ],
    filters: { dateRange: { start: '', end: '' }, frameworks: [], departments: [] },
    schedule: { enabled: false, frequency: 'monthly', time: '09:00', recipients: [], format: 'PDF' },
  },
];

const generateId = () => `sec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// ── Main Component ──────────────────────────────────────────────────────────

const ReportBuilder: React.FC = () => {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>('library');
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [generatedReports, setGeneratedReports] = useState<GeneratedReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [error, setError] = useState<string | null>(null);

  // Builder state
  const [currentTemplate, setCurrentTemplate] = useState<ReportTemplate | null>(null);
  const [showAddSectionModal, setShowAddSectionModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [draggedSection, setDraggedSection] = useState<string | null>(null);
  const [dragOverSection, setDragOverSection] = useState<string | null>(null);

  // New section form
  const [newSection, setNewSection] = useState<Partial<ReportSection>>({
    type: 'table',
    title: '',
    dataSource: 'controls',
    config: {},
  });

  useEffect(() => {
    loadTemplates();
    loadGeneratedReports();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/api/reports/templates');
      const serverTemplates: ReportTemplate[] = Array.isArray(res.data) ? res.data : [];
      const builtInWithDates = BUILT_IN_TEMPLATES.map(t => ({
        ...t,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));
      const existingIds = new Set(serverTemplates.map(t => t.id));
      const merged = [
        ...serverTemplates,
        ...builtInWithDates.filter(t => !existingIds.has(t.id)),
      ];
      setTemplates(merged);
    } catch (err: any) {
      console.error('Failed to load templates:', err);
      const builtInWithDates = BUILT_IN_TEMPLATES.map(t => ({
        ...t,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));
      setTemplates(builtInWithDates);
    } finally {
      setLoading(false);
    }
  };

  const loadGeneratedReports = async () => {
    try {
      const res = await api.get('/api/reports/generated');
      setGeneratedReports(Array.isArray(res.data) ? res.data : []);
    } catch {
      setGeneratedReports([]);
    }
  };

  const saveTemplate = async (template: ReportTemplate) => {
    try {
      if (template.id.startsWith('builtin-')) {
        const customTemplate = { ...template, id: generateId(), isBuiltIn: false };
        const res = await api.post('/api/reports/templates', customTemplate);
        setTemplates(prev => [...prev, res.data || customTemplate]);
        toast.success('Template saved as custom copy');
        return res.data || customTemplate;
      } else {
        const res = await api.put(`/api/reports/templates/${template.id}`, template);
        setTemplates(prev => prev.map(t => t.id === template.id ? (res.data || template) : t));
        toast.success('Template saved');
        return res.data || template;
      }
    } catch (err: any) {
      toast.error('Failed to save template');
      throw err;
    }
  };

  const deleteTemplate = async (id: string) => {
    try {
      await api.delete(`/api/reports/templates/${id}`);
      setTemplates(prev => prev.filter(t => t.id !== id));
      toast.success('Template deleted');
      setShowDeleteConfirm(null);
      if (currentTemplate?.id === id) {
        setCurrentTemplate(null);
        setViewMode('library');
      }
    } catch {
      toast.error('Failed to delete template');
    }
  };

  const generateReport = async (template: ReportTemplate, format?: ExportFormat) => {
    setGenerating(true);
    try {
      const res = await api.post('/api/reports/generate', {
        templateId: template.id,
        format: format || template.exportFormat,
        filters: template.filters,
        sections: template.sections,
      });
      const report: GeneratedReport = res.data || {
        id: generateId(),
        templateId: template.id,
        templateName: template.name,
        format: format || template.exportFormat,
        status: 'completed',
        generatedAt: new Date().toISOString(),
      };
      setGeneratedReports(prev => [report, ...prev]);
      toast.success(`Report generated successfully`);
      if (report.fileUrl) {
        window.open(report.fileUrl, '_blank');
      }
    } catch {
      toast.error('Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  const createNewTemplate = () => {
    const now = new Date().toISOString();
    const template: ReportTemplate = {
      id: generateId(),
      name: 'Untitled Report',
      description: '',
      sections: [],
      filters: { dateRange: { start: '', end: '' }, frameworks: [], departments: [] },
      schedule: { enabled: false, frequency: 'monthly', time: '09:00', recipients: [], format: 'PDF' },
      exportFormat: 'PDF',
      isBuiltIn: false,
      category: 'Custom',
      createdAt: now,
      updatedAt: now,
    };
    setCurrentTemplate(template);
    setViewMode('builder');
  };

  const editTemplate = (template: ReportTemplate) => {
    setCurrentTemplate({ ...template });
    setViewMode('builder');
  };

  const addSection = () => {
    if (!currentTemplate || !newSection.title || !newSection.type || !newSection.dataSource) return;
    const section: ReportSection = {
      id: generateId(),
      type: newSection.type as SectionType,
      title: newSection.title,
      dataSource: newSection.dataSource as DataSource,
      config: newSection.config || {},
      order: currentTemplate.sections.length,
    };
    setCurrentTemplate({
      ...currentTemplate,
      sections: [...currentTemplate.sections, section],
    });
    setNewSection({ type: 'table', title: '', dataSource: 'controls', config: {} });
    setShowAddSectionModal(false);
  };

  const removeSection = (sectionId: string) => {
    if (!currentTemplate) return;
    setCurrentTemplate({
      ...currentTemplate,
      sections: currentTemplate.sections
        .filter(s => s.id !== sectionId)
        .map((s, i) => ({ ...s, order: i })),
    });
  };

  const handleDragStart = (sectionId: string) => {
    setDraggedSection(sectionId);
  };

  const handleDragOver = (e: React.DragEvent, sectionId: string) => {
    e.preventDefault();
    setDragOverSection(sectionId);
  };

  const handleDrop = (targetId: string) => {
    if (!currentTemplate || !draggedSection || draggedSection === targetId) {
      setDraggedSection(null);
      setDragOverSection(null);
      return;
    }
    const sections = [...currentTemplate.sections];
    const dragIdx = sections.findIndex(s => s.id === draggedSection);
    const dropIdx = sections.findIndex(s => s.id === targetId);
    if (dragIdx === -1 || dropIdx === -1) return;
    const [moved] = sections.splice(dragIdx, 1);
    sections.splice(dropIdx, 0, moved);
    setCurrentTemplate({
      ...currentTemplate,
      sections: sections.map((s, i) => ({ ...s, order: i })),
    });
    setDraggedSection(null);
    setDragOverSection(null);
  };

  const filteredTemplates = useMemo(() => {
    return templates.filter(t => {
      if (categoryFilter !== 'All' && t.category !== categoryFilter) return false;
      if (searchQuery && !t.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !t.description.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [templates, categoryFilter, searchQuery]);

  const categories = useMemo(() => {
    const cats = new Set(templates.map(t => t.category));
    return ['All', ...Array.from(cats)];
  }, [templates]);

  const getSectionIcon = (type: SectionType) => {
    switch (type) {
      case 'table': return <Table className="w-4 h-4" />;
      case 'chart': return <BarChart3 className="w-4 h-4" />;
      case 'metric': return <TrendingUp className="w-4 h-4" />;
      case 'text': return <Type className="w-4 h-4" />;
    }
  };

  const getDataSourceIcon = (source: DataSource) => {
    const ds = DATA_SOURCES.find(d => d.source === source);
    return ds?.icon || <FileText className="w-4 h-4" />;
  };

  // ── Render: Template Library ────────────────────────────────────────────

  const renderLibrary = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Report Builder</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Build, customize, and schedule compliance reports
          </p>
        </div>
        <button
          onClick={createNewTemplate}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
        >
          <Plus className="w-4 h-4" />
          New Report
        </button>
      </div>

      {/* Search & Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-surface-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        <div className="flex items-center gap-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                categoryFilter === cat
                  ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Template Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="text-center py-20">
          <FolderOpen className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No templates found</p>
          <button
            onClick={createNewTemplate}
            className="mt-4 text-primary-600 dark:text-primary-400 hover:underline text-sm"
          >
            Create your first report template
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map(template => (
            <div
              key={template.id}
              className="bg-white dark:bg-surface-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 hover:shadow-md transition group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-lg ${
                    template.isBuiltIn
                      ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }`}>
                    <FileText className="w-5 h-5" />
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    template.isBuiltIn
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                  }`}>
                    {template.isBuiltIn ? 'Built-in' : 'Custom'}
                  </span>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                  <button
                    onClick={() => editTemplate(template)}
                    className="p-1.5 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 rounded"
                    title="Edit"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => generateReport(template)}
                    className="p-1.5 text-gray-400 hover:text-green-600 dark:hover:text-green-400 rounded"
                    title="Generate"
                  >
                    <Play className="w-4 h-4" />
                  </button>
                  {!template.isBuiltIn && (
                    <button
                      onClick={() => setShowDeleteConfirm(template.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{template.name}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">{template.description}</p>
              <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500">
                <span className="flex items-center gap-1">
                  <Layers className="w-3 h-3" />
                  {template.sections.length} sections
                </span>
                <span className="flex items-center gap-1">
                  <FileDown className="w-3 h-3" />
                  {template.exportFormat}
                </span>
                {template.schedule.enabled && (
                  <span className="flex items-center gap-1 text-green-500">
                    <Clock className="w-3 h-3" />
                    Scheduled
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recent Generated Reports */}
      {generatedReports.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recently Generated</h3>
          <div className="bg-white dark:bg-surface-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-surface-700">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Report</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Format</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Generated</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {generatedReports.slice(0, 5).map(report => (
                  <tr key={report.id} className="hover:bg-gray-50 dark:hover:bg-surface-700/50">
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{report.templateName}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                        {report.format}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        report.status === 'completed' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' :
                        report.status === 'generating' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' :
                        'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                      }`}>
                        {report.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {new Date(report.generatedAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {report.status === 'completed' && report.fileUrl && (
                        <button
                          onClick={() => window.open(report.fileUrl, '_blank')}
                          className="text-primary-600 dark:text-primary-400 hover:underline text-sm"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );

  // ── Render: Builder ─────────────────────────────────────────────────────

  const renderBuilder = () => {
    if (!currentTemplate) return null;
    return (
      <div className="space-y-6">
        {/* Builder Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setViewMode('library'); setCurrentTemplate(null); }}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
            <div>
              <input
                type="text"
                value={currentTemplate.name}
                onChange={e => setCurrentTemplate({ ...currentTemplate, name: e.target.value })}
                className="text-xl font-bold text-gray-900 dark:text-white bg-transparent border-none focus:ring-0 focus:outline-none p-0"
                placeholder="Report Name"
              />
              <input
                type="text"
                value={currentTemplate.description}
                onChange={e => setCurrentTemplate({ ...currentTemplate, description: e.target.value })}
                className="text-sm text-gray-500 dark:text-gray-400 bg-transparent border-none focus:ring-0 focus:outline-none p-0 w-full"
                placeholder="Add a description..."
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowScheduleModal(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition"
            >
              <Clock className="w-4 h-4" />
              Schedule
            </button>
            <button
              onClick={() => setViewMode('preview')}
              className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition"
            >
              <Eye className="w-4 h-4" />
              Preview
            </button>
            <button
              onClick={async () => {
                await saveTemplate(currentTemplate);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-sm"
            >
              <Save className="w-4 h-4" />
              Save
            </button>
            <button
              onClick={() => generateReport(currentTemplate)}
              disabled={generating || currentTemplate.sections.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm disabled:opacity-50"
            >
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              Generate
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Sections Panel */}
          <div className="col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 dark:text-white">Report Sections</h3>
              <button
                onClick={() => setShowAddSectionModal(true)}
                className="flex items-center gap-1 text-sm text-primary-600 dark:text-primary-400 hover:underline"
              >
                <Plus className="w-4 h-4" />
                Add Section
              </button>
            </div>

            {currentTemplate.sections.length === 0 ? (
              <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-12 text-center">
                <Layout className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                <p className="text-gray-500 dark:text-gray-400 mb-2">No sections yet</p>
                <button
                  onClick={() => setShowAddSectionModal(true)}
                  className="text-primary-600 dark:text-primary-400 text-sm hover:underline"
                >
                  Add your first section
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {currentTemplate.sections
                  .sort((a, b) => a.order - b.order)
                  .map(section => (
                    <div
                      key={section.id}
                      draggable
                      onDragStart={() => handleDragStart(section.id)}
                      onDragOver={e => handleDragOver(e, section.id)}
                      onDrop={() => handleDrop(section.id)}
                      onDragEnd={() => { setDraggedSection(null); setDragOverSection(null); }}
                      className={`flex items-center gap-3 p-4 bg-white dark:bg-surface-800 border rounded-lg transition cursor-grab active:cursor-grabbing ${
                        dragOverSection === section.id
                          ? 'border-primary-400 dark:border-primary-500 bg-primary-50 dark:bg-primary-900/10'
                          : 'border-gray-200 dark:border-gray-700'
                      } ${draggedSection === section.id ? 'opacity-50' : ''}`}
                    >
                      <GripVertical className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                        {getSectionIcon(section.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white text-sm truncate">{section.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-gray-400 dark:text-gray-500 capitalize">{section.type}</span>
                          <span className="text-xs text-gray-300 dark:text-gray-600">|</span>
                          <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                            {getDataSourceIcon(section.dataSource)}
                            {section.dataSource}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => removeSection(section.id)}
                        className="p-1 text-gray-400 hover:text-red-500 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Configuration Panel */}
          <div className="space-y-4">
            {/* Export Format */}
            <div className="bg-white dark:bg-surface-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Export Format</h4>
              <div className="flex gap-2">
                {(['PDF', 'Excel', 'CSV'] as ExportFormat[]).map(fmt => (
                  <button
                    key={fmt}
                    onClick={() => setCurrentTemplate({ ...currentTemplate, exportFormat: fmt })}
                    className={`flex-1 py-2 text-sm rounded-lg border transition ${
                      currentTemplate.exportFormat === fmt
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                        : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    {fmt}
                  </button>
                ))}
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-surface-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Filters
              </h4>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Date Range</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="date"
                      value={currentTemplate.filters.dateRange.start}
                      onChange={e => setCurrentTemplate({
                        ...currentTemplate,
                        filters: { ...currentTemplate.filters, dateRange: { ...currentTemplate.filters.dateRange, start: e.target.value } },
                      })}
                      className="w-full px-2 py-1.5 text-xs border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-surface-700 text-gray-900 dark:text-white"
                    />
                    <input
                      type="date"
                      value={currentTemplate.filters.dateRange.end}
                      onChange={e => setCurrentTemplate({
                        ...currentTemplate,
                        filters: { ...currentTemplate.filters, dateRange: { ...currentTemplate.filters.dateRange, end: e.target.value } },
                      })}
                      className="w-full px-2 py-1.5 text-xs border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-surface-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Frameworks</label>
                  <input
                    type="text"
                    placeholder="e.g. SOC 2, GDPR"
                    value={currentTemplate.filters.frameworks.join(', ')}
                    onChange={e => setCurrentTemplate({
                      ...currentTemplate,
                      filters: { ...currentTemplate.filters, frameworks: e.target.value.split(',').map(s => s.trim()).filter(Boolean) },
                    })}
                    className="w-full px-2 py-1.5 text-xs border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-surface-700 text-gray-900 dark:text-white placeholder-gray-400"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Departments</label>
                  <div className="flex flex-wrap gap-1">
                    {DEPARTMENTS.map(dept => (
                      <button
                        key={dept}
                        onClick={() => {
                          const depts = currentTemplate.filters.departments.includes(dept)
                            ? currentTemplate.filters.departments.filter(d => d !== dept)
                            : [...currentTemplate.filters.departments, dept];
                          setCurrentTemplate({ ...currentTemplate, filters: { ...currentTemplate.filters, departments: depts } });
                        }}
                        className={`text-xs px-2 py-0.5 rounded-full border transition ${
                          currentTemplate.filters.departments.includes(dept)
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                            : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        {dept}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Category */}
            <div className="bg-white dark:bg-surface-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Category</h4>
              <select
                value={currentTemplate.category}
                onChange={e => setCurrentTemplate({ ...currentTemplate, category: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-surface-700 text-gray-900 dark:text-white"
              >
                <option value="Compliance">Compliance</option>
                <option value="Privacy">Privacy</option>
                <option value="Risk">Risk</option>
                <option value="Vendor">Vendor</option>
                <option value="Security">Security</option>
                <option value="Custom">Custom</option>
              </select>
            </div>

            {/* Schedule Summary */}
            {currentTemplate.schedule.enabled && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
                <h4 className="text-sm font-semibold text-green-800 dark:text-green-300 mb-1 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Scheduled
                </h4>
                <p className="text-xs text-green-600 dark:text-green-400">
                  {currentTemplate.schedule.frequency} at {currentTemplate.schedule.time}
                </p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                  {currentTemplate.schedule.recipients.length} recipient(s) &middot; {currentTemplate.schedule.format}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ── Render: Preview ─────────────────────────────────────────────────────

  const renderPreview = () => {
    if (!currentTemplate) return null;
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setViewMode('builder')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Preview: {currentTemplate.name}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">{currentTemplate.sections.length} sections</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {(['PDF', 'Excel', 'CSV'] as ExportFormat[]).map(fmt => (
              <button
                key={fmt}
                onClick={() => generateReport(currentTemplate, fmt)}
                disabled={generating}
                className="flex items-center gap-1 px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition"
              >
                <Download className="w-4 h-4" />
                {fmt}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-surface-800 border border-gray-200 dark:border-gray-700 rounded-xl p-8 space-y-8">
          {/* Report Header */}
          <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{currentTemplate.name}</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">{currentTemplate.description}</p>
            <div className="flex items-center gap-4 mt-3 text-sm text-gray-400 dark:text-gray-500">
              <span>Generated: {new Date().toLocaleDateString()}</span>
              {currentTemplate.filters.dateRange.start && (
                <span>Period: {currentTemplate.filters.dateRange.start} - {currentTemplate.filters.dateRange.end}</span>
              )}
              {currentTemplate.filters.frameworks.length > 0 && (
                <span>Frameworks: {currentTemplate.filters.frameworks.join(', ')}</span>
              )}
            </div>
          </div>

          {/* Section Previews */}
          {currentTemplate.sections.sort((a, b) => a.order - b.order).map((section, idx) => (
            <div key={section.id} className="space-y-3">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                {getSectionIcon(section.type)}
                {section.title}
              </h2>

              {section.type === 'metric' && (
                <div className="grid grid-cols-3 gap-4">
                  {['Total', 'Passing', 'Gaps'].map((label, i) => (
                    <div key={i} className="bg-gray-50 dark:bg-surface-700 rounded-lg p-4 text-center">
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{Math.floor(Math.random() * 100)}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
                    </div>
                  ))}
                </div>
              )}

              {section.type === 'table' && (
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-surface-700">
                      <tr>
                        <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Item</th>
                        <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                        <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Score</th>
                        <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {[1, 2, 3].map(i => (
                        <tr key={i} className="text-sm">
                          <td className="px-4 py-3 text-gray-900 dark:text-white">{section.dataSource} item {i}</td>
                          <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">Active</span></td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{Math.floor(Math.random() * 100)}%</td>
                          <td className="px-4 py-3 text-gray-500 dark:text-gray-400">Sample details</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {section.type === 'chart' && (
                <div className="bg-gray-50 dark:bg-surface-700 rounded-lg p-6 flex items-center justify-center h-48">
                  <div className="text-center text-gray-400 dark:text-gray-500">
                    <BarChart3 className="w-10 h-10 mx-auto mb-2" />
                    <p className="text-sm">{section.config.chartType || 'bar'} chart visualization</p>
                    <p className="text-xs mt-1">Data: {section.dataSource}</p>
                  </div>
                </div>
              )}

              {section.type === 'text' && (
                <div className="bg-gray-50 dark:bg-surface-700 rounded-lg p-4 text-sm text-gray-600 dark:text-gray-300">
                  <p>AI-generated narrative content for {section.dataSource} will appear here when the report is generated.</p>
                </div>
              )}

              {idx < currentTemplate.sections.length - 1 && (
                <hr className="border-gray-200 dark:border-gray-700 mt-6" />
              )}
            </div>
          ))}

          {currentTemplate.sections.length === 0 && (
            <div className="text-center py-12">
              <Layout className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-gray-500 dark:text-gray-400">No sections to preview. Go back to add sections.</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ── Modals ──────────────────────────────────────────────────────────────

  const renderAddSectionModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowAddSectionModal(false)}>
      <div className="bg-white dark:bg-surface-800 rounded-xl shadow-xl w-full max-w-lg mx-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white">Add Section</h3>
          <button onClick={() => setShowAddSectionModal(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Section Title</label>
            <input
              type="text"
              value={newSection.title || ''}
              onChange={e => setNewSection({ ...newSection, title: e.target.value })}
              placeholder="e.g., Control Status Overview"
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-surface-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Section Type</label>
            <div className="grid grid-cols-2 gap-2">
              {SECTION_TYPES.map(st => (
                <button
                  key={st.type}
                  onClick={() => setNewSection({ ...newSection, type: st.type })}
                  className={`flex items-center gap-3 p-3 border rounded-lg text-left transition ${
                    newSection.type === st.type
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <div className="text-gray-600 dark:text-gray-400">{st.icon}</div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{st.label}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{st.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Data Source</label>
            <div className="grid grid-cols-3 gap-2">
              {DATA_SOURCES.map(ds => (
                <button
                  key={ds.source}
                  onClick={() => setNewSection({ ...newSection, dataSource: ds.source })}
                  className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-sm transition ${
                    newSection.dataSource === ds.source
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                      : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  {ds.icon}
                  {ds.label}
                </button>
              ))}
            </div>
          </div>
          {newSection.type === 'chart' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Chart Type</label>
              <div className="flex gap-2">
                {CHART_TYPES.map(ct => (
                  <button
                    key={ct}
                    onClick={() => setNewSection({ ...newSection, config: { ...newSection.config, chartType: ct } })}
                    className={`px-3 py-1.5 text-sm rounded-lg border capitalize transition ${
                      newSection.config?.chartType === ct
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                        : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    {ct}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setShowAddSectionModal(false)}
            className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
          >
            Cancel
          </button>
          <button
            onClick={addSection}
            disabled={!newSection.title}
            className="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-50"
          >
            Add Section
          </button>
        </div>
      </div>
    </div>
  );

  const renderScheduleModal = () => {
    if (!currentTemplate) return null;
    const schedule = currentTemplate.schedule;
    const updateSchedule = (updates: Partial<ReportSchedule>) => {
      setCurrentTemplate({
        ...currentTemplate,
        schedule: { ...currentTemplate.schedule, ...updates },
      });
    };
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowScheduleModal(false)}>
        <div className="bg-white dark:bg-surface-800 rounded-xl shadow-xl w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white">Schedule Report</h3>
            <button onClick={() => setShowScheduleModal(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Enable Schedule</span>
              <button
                onClick={() => updateSchedule({ enabled: !schedule.enabled })}
                className={`relative w-11 h-6 rounded-full transition ${schedule.enabled ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'}`}
              >
                <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${schedule.enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </div>
            {schedule.enabled && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Frequency</label>
                  <select
                    value={schedule.frequency}
                    onChange={e => updateSchedule({ frequency: e.target.value as ScheduleFrequency })}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-surface-700 text-gray-900 dark:text-white text-sm"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                  </select>
                </div>
                {schedule.frequency === 'weekly' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Day of Week</label>
                    <select
                      value={schedule.dayOfWeek ?? 1}
                      onChange={e => updateSchedule({ dayOfWeek: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-surface-700 text-gray-900 dark:text-white text-sm"
                    >
                      {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((d, i) => (
                        <option key={d} value={i}>{d}</option>
                      ))}
                    </select>
                  </div>
                )}
                {schedule.frequency === 'monthly' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Day of Month</label>
                    <input
                      type="number"
                      min={1}
                      max={28}
                      value={schedule.dayOfMonth ?? 1}
                      onChange={e => updateSchedule({ dayOfMonth: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-surface-700 text-gray-900 dark:text-white text-sm"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Time</label>
                  <input
                    type="time"
                    value={schedule.time}
                    onChange={e => updateSchedule({ time: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-surface-700 text-gray-900 dark:text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Export Format</label>
                  <div className="flex gap-2">
                    {(['PDF', 'Excel', 'CSV'] as ExportFormat[]).map(fmt => (
                      <button
                        key={fmt}
                        onClick={() => updateSchedule({ format: fmt })}
                        className={`flex-1 py-2 text-sm rounded-lg border transition ${
                          schedule.format === fmt
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                            : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                        }`}
                      >
                        {fmt}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Recipients (email)</label>
                  <input
                    type="text"
                    placeholder="email1@company.com, email2@company.com"
                    value={schedule.recipients.join(', ')}
                    onChange={e => updateSchedule({ recipients: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-surface-700 text-gray-900 dark:text-white text-sm placeholder-gray-400"
                  />
                </div>
              </>
            )}
          </div>
          <div className="flex justify-end gap-2 p-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setShowScheduleModal(false)}
              className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderDeleteConfirm = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowDeleteConfirm(null)}>
      <div className="bg-white dark:bg-surface-800 rounded-xl shadow-xl w-full max-w-sm mx-4 p-6" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Delete Template</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Are you sure you want to delete this report template? This action cannot be undone.</p>
        <div className="flex justify-end gap-2">
          <button onClick={() => setShowDeleteConfirm(null)} className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
            Cancel
          </button>
          <button onClick={() => showDeleteConfirm && deleteTemplate(showDeleteConfirm)} className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700">
            Delete
          </button>
        </div>
      </div>
    </div>
  );

  // ── Main Render ─────────────────────────────────────────────────────────

  return (
    <div className="bg-white dark:bg-surface-800 min-h-screen">
      <div className="max-w-7xl mx-auto p-6">
        {viewMode === 'library' && renderLibrary()}
        {viewMode === 'builder' && renderBuilder()}
        {viewMode === 'preview' && renderPreview()}
        {showAddSectionModal && renderAddSectionModal()}
        {showScheduleModal && renderScheduleModal()}
        {showDeleteConfirm && renderDeleteConfirm()}
      </div>
    </div>
  );
};

export default ReportBuilder;
