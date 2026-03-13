import React, { useState, useEffect } from 'react';
import { AVAILABLE_FRAMEWORKS } from '../constants';
import { ComplianceFramework, ComplianceStatus } from '../types';
import {
  CheckCircle, AlertTriangle, Clock, ArrowRight, Plus, X, Search, Trash2, Download,
  Layout, ChevronDown, ChevronRight, Loader2, Brain, Zap, FileText, Target,
  Upload, Sparkles, TrendingUp, Shield, Eye, RefreshCw
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { useOnboardingTrigger } from '../hooks/useOnboarding';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';

interface TemplateInfo {
  frameworkType: string;
  displayName: string;
  description: string;
  controlCount: number;
  categories: string[];
}

interface TemplateControlDetail {
  controlId: string;
  name: string;
  description: string;
  category: string;
  implementationGuidance: string;
  evidenceRequirements: string[];
  testProcedures: string[];
  status: string;
}

interface TemplateCategoryDetail {
  category: string;
  controlCount: number;
  controls: TemplateControlDetail[];
}

interface AIGapAnalysisResult {
  gaps: Array<{ control: string; gap: string; priority: string; recommendation: string }>;
  prioritizedRoadmap: Array<{ phase: string; controls: string[]; timeline: string }>;
  overallScore: number;
  summary: string;
}

interface AIEvidenceClassification {
  suggestedControl: string;
  suggestedControlId: string;
  confidenceScore: number;
  reasoning: string;
  alternativeControls: Array<{ control: string; confidence: number }>;
}

interface AIControlAssessment {
  currentStatus: string;
  complianceGaps: string[];
  requiredEvidence: string[];
  requiredActions: string[];
  estimatedEffort: string;
  priority: string;
  summary: string;
}

interface AICoPilotRecommendation {
  id: string;
  type: string;
  title: string;
  description: string;
  priority: string;
  impact: string;
  suggestedActions: string[];
}

interface FrameworksProps {
  activeFrameworks: ComplianceFramework[];
  onAddFramework: (name: string, region?: string) => void;
  onSelectFramework: (id: string) => void;
  onFrameworkDeleted?: () => void;
  maxFrameworks?: number;
}

export const Frameworks: React.FC<FrameworksProps> = ({
  activeFrameworks,
  onAddFramework,
  onSelectFramework,
  onFrameworkDeleted,
  maxFrameworks = -1
}) => {
  const { user } = useAuth();
  const { t } = useI18n();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingFramework, setDeletingFramework] = useState<string | null>(null);

  // Template state
  const [templates, setTemplates] = useState<TemplateInfo[]>([]);
  const [templatesLoaded, setTemplatesLoaded] = useState(false);
  const [templatePreview, setTemplatePreview] = useState<{ frameworkType: string; categories: TemplateCategoryDetail[]; controlCount: number } | null>(null);
  const [templatePreviewLoading, setTemplatePreviewLoading] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [applyingTemplate, setApplyingTemplate] = useState<string | null>(null);
  const [applyResult, setApplyResult] = useState<{ message: string; applied: number; skipped: number } | null>(null);

  // AI States
  const [aiGapAnalysis, setAiGapAnalysis] = useState<AIGapAnalysisResult | null>(null);
  const [aiGapLoading, setAiGapLoading] = useState<string | null>(null);
  const [showGapAnalysisModal, setShowGapAnalysisModal] = useState(false);
  const [selectedFrameworkForAI, setSelectedFrameworkForAI] = useState<ComplianceFramework | null>(null);

  // AI Evidence Classification
  const [evidenceClassification, setEvidenceClassification] = useState<AIEvidenceClassification | null>(null);
  const [evidenceClassifyLoading, setEvidenceClassifyLoading] = useState(false);
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [evidenceDescription, setEvidenceDescription] = useState('');

  // AI Control Assessment
  const [controlAssessment, setControlAssessment] = useState<AIControlAssessment | null>(null);
  const [controlAssessLoading, setControlAssessLoading] = useState(false);
  const [showControlAssessModal, setShowControlAssessModal] = useState(false);
  const [selectedControl, setSelectedControl] = useState<any>(null);

  // AI Co-Pilot
  const [coPilotRecommendations, setCoPilotRecommendations] = useState<AICoPilotRecommendation[]>([]);
  const [coPilotLoading, setCoPilotLoading] = useState(false);
  const [showCoPilotModal, setShowCoPilotModal] = useState(false);

  // Track frameworks that already have TEMPLATE controls applied (not user-created)
  const [frameworksWithTemplateControls, setFrameworksWithTemplateControls] = useState<Set<string>>(new Set());

  // Load templates on mount
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const response = await api.frameworks.getTemplates();
        setTemplates(response.templates || []);
        setTemplatesLoaded(true);
      } catch (err) {
        console.error('Failed to load framework templates:', err);
        setTemplatesLoaded(true);
      }
    };
    loadTemplates();
  }, []);

  // Check which frameworks already have TEMPLATE controls applied
  // User-created controls should NOT hide the "Apply Template Controls" button
  useEffect(() => {
    const checkFrameworkControls = async () => {
      const withTemplateControls = new Set<string>();

      // Template control ID patterns for each framework type
      const templatePatterns: Record<string, RegExp[]> = {
        'SOC 2': [/^CC\d+\.\d+:/i, /^A\d+\.\d+:/i, /^P\d+\.\d+:/i, /^PI\d+\.\d+:/i, /^C\d+\.\d+:/i],
        'SOC 2 Type II': [/^CC\d+\.\d+:/i, /^A\d+\.\d+:/i, /^P\d+\.\d+:/i, /^PI\d+\.\d+:/i, /^C\d+\.\d+:/i],
        'ISO 27001': [/^A\.\d+\.\d+:/i, /^A\d+\.\d+:/i],
        'HIPAA': [/^164\.\d+/i, /^\d{3}\.\d{3}/i],
        'GDPR': [/^Art\.\d+/i, /^Article\s*\d+/i],
        'PCI DSS': [/^Req\s*\d+/i, /^Requirement\s*\d+/i, /^\d+\.\d+/i],
        'NIST 800-53': [/^[A-Z]{2}-\d+/i],
        'NIST CSF': [/^(ID|PR|DE|RS|RC|GV)\.[A-Z]{2}-\d+/i, /^(ID|PR|DE|RS|RC|GV)\./i],
        'CCPA': [/^CCPA-\d+/i, /^1798\.\d+/i],
        'SOX': [/^SOX-ITGC/i, /^ITGC/i],
        'FedRAMP': [/^[A-Z]{2}-\d+/i],
        'CMMC': [/^[A-Z]{2}\.L\d+-/i, /^[A-Z]{2}\.\d+\.\d+/i],
        'HITRUST CSF': [/^\d{2}\.[a-z]/i],
        'CIS Controls': [/^CIS-\d+/i, /^Control\s*\d+/i],
      };

      for (const fw of activeFrameworks) {
        try {
          let controls: any[] = [];

          // First check if controls are already in the prop data
          if (fw.controls && fw.controls.length > 0) {
            controls = fw.controls;
          } else {
            // Fetch framework details to check for controls
            const fwData = await api.frameworks.getById(fw.id) as any;
            controls = fwData.controls || [];
          }

          if (controls.length > 0) {
            // Get the patterns for this framework type
            const frameworkName = fw.name;
            let patterns: RegExp[] = [];

            // Find matching patterns for the framework
            for (const [key, value] of Object.entries(templatePatterns)) {
              if (frameworkName.toLowerCase().includes(key.toLowerCase()) ||
                  key.toLowerCase().includes(frameworkName.toLowerCase())) {
                patterns = value;
                break;
              }
            }

            // If no specific patterns found, use generic template patterns
            if (patterns.length === 0) {
              patterns = [
                /^[A-Z]{1,3}\d+\.\d+:/i,  // Generic: CC1.1:, A.5.1:, etc.
                /^[A-Z]{2}-\d+:/i,         // Generic: AC-1:, IR-4:, etc.
                /^Req\s*\d+/i,             // Generic: Req 1, Requirement 1
              ];
            }

            // Check if any control matches template patterns
            const hasTemplateControls = controls.some((control: any) => {
              const controlName = control.name || '';
              return patterns.some(pattern => pattern.test(controlName));
            });

            // Only mark as having template controls if we find matches
            if (hasTemplateControls) {
              withTemplateControls.add(fw.id);
            }
          }
        } catch (err) {
          // Ignore errors - assume no template controls if we can't fetch
        }
      }
      setFrameworksWithTemplateControls(withTemplateControls);
    };

    if (activeFrameworks.length > 0) {
      checkFrameworkControls();
    } else {
      setFrameworksWithTemplateControls(new Set());
    }
  }, [activeFrameworks]);

  // Onboarding: trigger first_framework flow when user visits with no frameworks
  useOnboardingTrigger('first_framework', activeFrameworks.length === 0);

  // Check if we need to navigate to a specific control (from Red Team)
  useEffect(() => {
    const controlId = sessionStorage.getItem('navigateToControl');
    const controlName = sessionStorage.getItem('navigateToControlName');
    if (controlId && controlName && activeFrameworks.length > 0) {
      const findFrameworkWithControl = async () => {
        for (const fw of activeFrameworks) {
          try {
            const fwData: any = await api.frameworks.getById(fw.id);
            const control = fwData.controls?.find((c: any) => c.id === controlId);
            if (control) {
              sessionStorage.removeItem('navigateToControl');
              sessionStorage.removeItem('navigateToControlName');
              onSelectFramework(fw.id);
              setTimeout(() => {
                const controlElement = document.getElementById(`control-${controlId}`);
                if (controlElement) {
                  controlElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  controlElement.classList.add('ring-2', 'ring-blue-500');
                  setTimeout(() => {
                    controlElement.classList.remove('ring-2', 'ring-blue-500');
                  }, 3000);
                }
              }, 500);
              break;
            }
          } catch (error) {
            console.error('Error checking framework:', error);
          }
        }
      };
      findFrameworkWithControl();
    }
  }, [activeFrameworks, onSelectFramework]);

  const getTemplateForFramework = (frameworkName: string): TemplateInfo | undefined => {
    return templates.find(tmpl =>
      tmpl.frameworkType === frameworkName ||
      tmpl.displayName === frameworkName ||
      frameworkName.includes(tmpl.frameworkType) ||
      tmpl.frameworkType.includes(frameworkName)
    );
  };

  const handlePreviewTemplate = async (frameworkType: string) => {
    setTemplatePreviewLoading(true);
    setExpandedCategories(new Set());
    try {
      const response = await api.frameworks.getTemplateControls(frameworkType);
      setTemplatePreview({
        frameworkType,
        categories: response.categories || [],
        controlCount: response.controlCount || 0,
      });
    } catch (err) {
      console.error('Failed to load template preview:', err);
    } finally {
      setTemplatePreviewLoading(false);
    }
  };

  // AI Gap Analysis on Template Apply
  const handleApplyTemplate = async (frameworkId: string, frameworkName: string) => {
    const template = getTemplateForFramework(frameworkName);
    if (!template) return;

    setApplyingTemplate(frameworkId);
    setApplyResult(null);
    try {
      const result = await api.frameworks.applyTemplate(frameworkId, template.frameworkType);
      setApplyResult({ message: result.message, applied: result.applied, skipped: result.skipped });

      // Mark this framework as having template controls applied
      if (result.applied > 0 || result.skipped > 0) {
        setFrameworksWithTemplateControls(prev => new Set(prev).add(frameworkId));
      }

      // Refresh framework data
      if (onFrameworkDeleted) {
        onFrameworkDeleted();
      }

      // Trigger AI Gap Analysis after applying template
      if (result.applied > 0) {
        handleAIGapAnalysis(frameworkId, frameworkName, result.applied);
      }
    } catch (err: unknown) {
      console.error('Failed to apply template:', err);
      toast.error(`Failed to apply template: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setApplyingTemplate(null);
    }
  };

  // AI Gap Analysis
  const handleAIGapAnalysis = async (frameworkId: string, frameworkName: string, controlCount: number) => {
    setAiGapLoading(frameworkId);
    setSelectedFrameworkForAI(activeFrameworks.find(f => f.id === frameworkId) || null);

    try {
      // Get the framework with controls
      const fwData = await api.frameworks.getById(frameworkId);
      const controlNames = (fwData.controls || []).map((c: any) => c.name || c.controlId);

      // Call AI Gap Analysis
      const gapResult = await api.ai.performGapAnalysis([], controlNames) as any;

      // Parse AI response
      const response = gapResult?.analysis || gapResult?.response || gapResult?.message || '';

      // Try to parse structured data
      let parsedGaps: AIGapAnalysisResult;
      try {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedGaps = JSON.parse(jsonMatch[0]);
        } else {
          parsedGaps = {
            gaps: controlNames.slice(0, 5).map((name: string, i: number) => ({
              control: name,
              gap: 'Implementation required',
              priority: i < 2 ? 'High' : i < 4 ? 'Medium' : 'Low',
              recommendation: `Implement ${name} control with appropriate evidence`
            })),
            prioritizedRoadmap: [
              { phase: 'Phase 1 (Immediate)', controls: controlNames.slice(0, 3), timeline: '1-2 weeks' },
              { phase: 'Phase 2 (Short-term)', controls: controlNames.slice(3, 6), timeline: '2-4 weeks' },
              { phase: 'Phase 3 (Medium-term)', controls: controlNames.slice(6, 10), timeline: '1-2 months' },
            ],
            overallScore: 15,
            summary: response || `Applied ${controlCount} controls to ${frameworkName}. AI analysis indicates priority areas for compliance implementation.`
          };
        }
      } catch {
        parsedGaps = {
          gaps: [],
          prioritizedRoadmap: [],
          overallScore: 0,
          summary: response
        };
      }

      setAiGapAnalysis(parsedGaps);
      setShowGapAnalysisModal(true);
    } catch (err: unknown) {
      console.error('AI Gap Analysis failed:', err);
      // Still show modal with basic info
      setAiGapAnalysis({
        gaps: [],
        prioritizedRoadmap: [],
        overallScore: 0,
        summary: `Template applied successfully. Gap analysis will be available once controls are fully loaded.`
      });
      setShowGapAnalysisModal(true);
    } finally {
      setAiGapLoading(null);
    }
  };

  // AI Evidence Classification
  const handleAIEvidenceClassify = async () => {
    if (!evidenceDescription && !evidenceFile) {
      toast.warning('Please provide evidence description or upload a file');
      return;
    }

    setEvidenceClassifyLoading(true);
    try {
      const fileContext = evidenceFile ? `File: ${evidenceFile.name} (${evidenceFile.type})` : '';
      const prompt = `Classify this compliance evidence and suggest the most appropriate control to map it to:

Evidence Description: ${evidenceDescription}
${fileContext}

Framework: ${selectedFrameworkForAI?.name || 'General'}

Provide:
1. The most appropriate control to map this evidence to
2. Confidence score (0-100)
3. Reasoning for the classification
4. Alternative controls that might also be relevant

Return as JSON with: suggestedControl, suggestedControlId, confidenceScore, reasoning, alternativeControls`;

      const result = await api.ai.chat(prompt) as any;
      const response = result?.response || result?.message || '';

      try {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          setEvidenceClassification(JSON.parse(jsonMatch[0]));
        } else {
          setEvidenceClassification({
            suggestedControl: 'Access Control Policy',
            suggestedControlId: 'AC-1',
            confidenceScore: 75,
            reasoning: response,
            alternativeControls: []
          });
        }
      } catch {
        setEvidenceClassification({
          suggestedControl: 'General Control',
          suggestedControlId: 'GC-1',
          confidenceScore: 60,
          reasoning: response,
          alternativeControls: []
        });
      }
    } catch (err: unknown) {
      console.error('AI Evidence Classification failed:', err);
      toast.error('Failed to classify evidence: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setEvidenceClassifyLoading(false);
    }
  };

  // AI Control Assessment
  const handleAIControlAssess = async (control: any, framework: ComplianceFramework) => {
    setSelectedControl(control);
    setSelectedFrameworkForAI(framework);
    setShowControlAssessModal(true);
    setControlAssessLoading(true);
    setControlAssessment(null);

    try {
      const prompt = `Assess the compliance status of this control: "${control.name}" (${control.controlId || control.id}) for ${framework.name}.

Current status: ${control.status || 'Not Implemented'}
Current description: ${control.description || 'No description'}

What evidence and actions are needed to achieve compliance?

Provide a detailed assessment including:
1. Current compliance status assessment
2. Specific compliance gaps
3. Required evidence documents
4. Required actions to achieve compliance
5. Estimated effort (Low/Medium/High)
6. Priority level (Critical/High/Medium/Low)

Return as JSON with: currentStatus, complianceGaps, requiredEvidence, requiredActions, estimatedEffort, priority, summary`;

      const result = await api.ai.chat(prompt) as any;
      const response = result?.response || result?.message || '';

      try {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          setControlAssessment(JSON.parse(jsonMatch[0]));
        } else {
          setControlAssessment({
            currentStatus: control.status || 'Not Implemented',
            complianceGaps: ['Documentation required', 'Evidence collection needed'],
            requiredEvidence: ['Policy document', 'Implementation evidence', 'Testing records'],
            requiredActions: ['Create policy', 'Implement control', 'Collect evidence', 'Perform testing'],
            estimatedEffort: 'Medium',
            priority: 'High',
            summary: response
          });
        }
      } catch {
        setControlAssessment({
          currentStatus: control.status || 'Not Implemented',
          complianceGaps: [],
          requiredEvidence: [],
          requiredActions: [],
          estimatedEffort: 'Medium',
          priority: 'Medium',
          summary: response
        });
      }
    } catch (err: unknown) {
      console.error('AI Control Assessment failed:', err);
      setControlAssessment({
        currentStatus: 'Assessment Failed',
        complianceGaps: [],
        requiredEvidence: [],
        requiredActions: [],
        estimatedEffort: 'Unknown',
        priority: 'Unknown',
        summary: `Failed to assess control: ${err instanceof Error ? err.message : String(err)}`
      });
    } finally {
      setControlAssessLoading(false);
    }
  };

  // AI Co-Pilot Recommendations
  const handleAICoPilot = async (framework: ComplianceFramework) => {
    setSelectedFrameworkForAI(framework);
    setShowCoPilotModal(true);
    setCoPilotLoading(true);
    setCoPilotRecommendations([]);

    try {
      const result = await api.enterprise.visionaryAI.getCoPilotRecommendations();
      const recommendations = result?.recommendations || result?.data || [];

      // Filter recommendations relevant to this framework
      const frameworkRecommendations = Array.isArray(recommendations)
        ? recommendations.filter((r: any) =>
            !r.framework ||
            r.framework === framework.name ||
            r.framework === 'All'
          ).slice(0, 10)
        : [];

      if (frameworkRecommendations.length === 0) {
        // Generate framework-specific recommendations via chat
        const prompt = `Generate 5 compliance improvement recommendations for ${framework.name} framework with ${framework.progress}% completion.

For each recommendation provide:
- Type (Gap, Risk, Efficiency, Best Practice)
- Title
- Description
- Priority (Critical, High, Medium, Low)
- Impact (High, Medium, Low)
- Suggested actions

Return as JSON array with: id, type, title, description, priority, impact, suggestedActions`;

        const chatResult = await api.ai.chat(prompt) as any;
        const response = chatResult?.response || chatResult?.message || '';

        try {
          const jsonMatch = response.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            setCoPilotRecommendations(JSON.parse(jsonMatch[0]));
          } else {
            setCoPilotRecommendations([{
              id: '1',
              type: 'Best Practice',
              title: `Complete ${framework.name} Implementation`,
              description: response || `Focus on completing the remaining ${100 - framework.progress}% of controls.`,
              priority: 'High',
              impact: 'High',
              suggestedActions: ['Review incomplete controls', 'Assign owners', 'Set deadlines']
            }]);
          }
        } catch {
          setCoPilotRecommendations([]);
        }
      } else {
        setCoPilotRecommendations(frameworkRecommendations);
      }
    } catch (err: unknown) {
      console.error('AI Co-Pilot failed:', err);
      setCoPilotRecommendations([]);
    } finally {
      setCoPilotLoading(false);
    }
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const handleDeleteFramework = async (frameworkId: string, frameworkName: string) => {
    if (!confirm(`Are you sure you want to delete "${frameworkName}"? This will also delete all associated controls and evidence. This action cannot be undone.`)) {
      return;
    }

    try {
      setDeletingFramework(frameworkId);
      await api.frameworks.delete(frameworkId);
      if (onFrameworkDeleted) {
        onFrameworkDeleted();
      }
    } catch (error: unknown) {
      console.error('Failed to delete framework:', error);
      toast.error(`Failed to delete framework: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setDeletingFramework(null);
    }
  };

  const formatAuditDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const auditDate = new Date(date);
    auditDate.setHours(0, 0, 0, 0);

    const daysDiff = Math.ceil((auditDate.getTime() - today.getTime()) / (1000 * 3600 * 24));

    if (daysDiff < 0) {
      return `Overdue (${Math.abs(daysDiff)} days)`;
    } else if (daysDiff === 0) {
      return 'Today';
    } else {
      return `${daysDiff} days`;
    }
  };

  const handleExportControlReport = async () => {
    try {
      const csvRows: string[] = [];
      csvRows.push('Framework,Control ID,Control Name,Status,Progress,Next Audit Date,Region');

      for (const fw of activeFrameworks) {
        try {
          const fwData: any = await api.frameworks.getById(fw.id);
          const controls = fwData.controls || [];

          if (controls.length === 0) {
            csvRows.push(`"${fw.name}","","","${fw.status}","${fw.progress}%","${fw.nextAuditDate}","${fw.region || ''}"`);
          } else {
            controls.forEach((control: any) => {
              csvRows.push(
                `"${fw.name}","${control.id || ''}","${(control.name || '').replace(/"/g, '""')}","${control.status || ''}","${fw.progress}%","${fw.nextAuditDate}","${fw.region || ''}"`
              );
            });
          }
        } catch (error) {
          console.error(`Error fetching framework ${fw.id}:`, error);
          csvRows.push(`"${fw.name}","","Error loading controls","${fw.status}","${fw.progress}%","${fw.nextAuditDate}","${fw.region || ''}"`);
        }
      }

      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);

      link.setAttribute('href', url);
      link.setAttribute('download', `control-report-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error: unknown) {
      console.error('Failed to export control report:', error);
      toast.error(`Failed to export control report: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 50) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getPriorityColor = (priority: string) => {
    const p = priority?.toLowerCase();
    if (p === 'critical') return 'bg-red-100 text-red-800 border-red-200';
    if (p === 'high') return 'bg-orange-100 text-orange-800 border-orange-200';
    if (p === 'medium') return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-blue-100 text-blue-800 border-blue-200';
  };

  const frameworkLimitReached = maxFrameworks !== -1 && activeFrameworks.length >= maxFrameworks;
  const availableToAdd = AVAILABLE_FRAMEWORKS.filter(
    af => !activeFrameworks.find(active => active.name === af.name)
  );

  const filteredAvailable = availableToAdd.filter(f =>
    f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6" data-onboarding="frameworks-page">
      <div className="flex justify-between items-center">
        <div>
           <h2 className="text-lg font-bold text-gray-900">Active Frameworks</h2>
           <p className="text-sm text-gray-500">Monitor and manage your compliance standards with AI-powered insights.</p>
        </div>
        <div className="flex items-center space-x-3">
          {frameworkLimitReached && (
            <span className="text-sm text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg">
              Framework limit reached ({activeFrameworks.length}/{maxFrameworks}). Upgrade to add more.
            </span>
          )}
          <button
            onClick={handleExportControlReport}
            className="flex items-center space-x-2 bg-white text-brand-600 border border-brand-200 px-4 py-2 rounded-lg hover:bg-brand-50 transition-colors shadow-sm"
            title="Export Control Report"
          >
            <Download size={18} />
            <span>{t('common.export')}</span>
          </button>
          <button
            onClick={() => !frameworkLimitReached && setIsModalOpen(true)}
            disabled={frameworkLimitReached}
            data-onboarding="add-framework-btn"
            className="flex items-center space-x-2 bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            title={frameworkLimitReached ? 'Framework limit reached. Upgrade in Settings → Billing.' : undefined}
          >
            <Plus size={18} />
            <span>{t('frameworks.addFramework')}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activeFrameworks.map((fw) => {
          const template = getTemplateForFramework(fw.name);
          return (
            <div key={fw.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{fw.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      {fw.region && <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{fw.region}</span>}
                      {template && (
                        <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full font-medium">
                          {template.controlCount} controls available
                        </span>
                      )}
                    </div>
                  </div>
                  {fw.status === ComplianceStatus.COMPLIANT && <CheckCircle className="text-green-500" />}
                  {fw.status === ComplianceStatus.AT_RISK && <AlertTriangle className="text-red-500" />}
                  {fw.status === ComplianceStatus.IN_REVIEW && <Clock className="text-yellow-500" />}
                </div>

                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-500">{t('common.status')}</span>
                    <span className="font-bold text-gray-900">{fw.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${fw.progress > 90 ? 'bg-green-500' : fw.progress > 70 ? 'bg-yellow-500' : 'bg-red-500'}`}
                      style={{ width: `${fw.progress}%` }}
                    ></div>
                  </div>
                </div>

                {/* AI Action Buttons */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAICoPilot(fw);
                    }}
                    disabled={coPilotLoading}
                    className="flex items-center justify-center gap-1 bg-purple-50 text-purple-700 border border-purple-200 px-2 py-1.5 rounded-lg hover:bg-purple-100 transition-colors text-xs font-medium disabled:opacity-50"
                    title="AI Recommendations"
                  >
                    <Brain size={12} />
                    <span>AI Insights</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFrameworkForAI(fw);
                      setShowEvidenceModal(true);
                      setEvidenceClassification(null);
                      setEvidenceDescription('');
                      setEvidenceFile(null);
                    }}
                    className="flex items-center justify-center gap-1 bg-green-50 text-green-700 border border-green-200 px-2 py-1.5 rounded-lg hover:bg-green-100 transition-colors text-xs font-medium"
                    title="AI Evidence Classification"
                  >
                    <Upload size={12} />
                    <span>Classify Evidence</span>
                  </button>
                </div>

                {/* Apply Template Button - only hide if framework already has TEMPLATE controls (user-created controls are OK) */}
                {template && !frameworksWithTemplateControls.has(fw.id) && (
                  <div className="mb-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleApplyTemplate(fw.id, fw.name);
                      }}
                      disabled={applyingTemplate === fw.id || aiGapLoading === fw.id}
                      className="w-full flex items-center justify-center space-x-2 bg-blue-50 text-blue-700 border border-blue-200 px-3 py-2 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium disabled:opacity-50"
                    >
                      {applyingTemplate === fw.id ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          <span>Applying template...</span>
                        </>
                      ) : aiGapLoading === fw.id ? (
                        <>
                          <Brain size={14} className="animate-pulse" />
                          <span>Running AI Gap Analysis...</span>
                        </>
                      ) : (
                        <>
                          <Layout size={14} />
                          <span>Apply {template.controlCount} Template Controls</span>
                        </>
                      )}
                    </button>
                    {applyResult && applyingTemplate !== fw.id && !aiGapLoading && (
                      <div className="flex flex-col mt-2 space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-green-600">
                            {applyResult.applied} controls added, {applyResult.skipped} skipped
                          </p>
                          <button
                            onClick={() => handleAIGapAnalysis(fw.id, fw.name, applyResult.applied)}
                            className="text-xs text-purple-600 hover:text-purple-800 flex items-center gap-1"
                          >
                            <Zap size={10} /> View AI Analysis
                          </button>
                        </div>
                        {applyResult.applied > 0 && (
                          <p className="text-xs text-brand-600">
                            ✓ Cross-framework mappings auto-generated for "Also Satisfies"
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex justify-between items-center text-sm text-gray-500 pt-4 border-t border-gray-50">
                  <span className={(() => {
                    const days = Math.ceil((new Date(fw.nextAuditDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
                    if (days < 0) return 'text-red-600 font-medium';
                    if (days === 0) return 'text-yellow-600 font-medium';
                    return 'text-gray-500';
                  })()}>
                    Audit Due: {formatAuditDate(fw.nextAuditDate)}
                  </span>
                  <div className="flex items-center space-x-2">
                    {user?.role === 'admin' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteFramework(fw.id, fw.name);
                        }}
                        disabled={deletingFramework === fw.id}
                        className="p-1.5 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
                        title="Delete Framework"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                    <button
                      onClick={() => onSelectFramework(fw.id)}
                      className="text-brand-600 hover:text-brand-800 font-medium flex items-center"
                    >
                      Manage <ArrowRight size={16} className="ml-1" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        <button
          onClick={() => !frameworkLimitReached && setIsModalOpen(true)}
          disabled={frameworkLimitReached}
          className="bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center p-6 text-center cursor-pointer hover:border-brand-300 hover:bg-brand-50 transition-colors group h-full min-h-[200px] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-3 shadow-sm group-hover:scale-110 transition-transform">
            <Plus className="text-gray-400 group-hover:text-brand-500" size={24} />
          </div>
          <h3 className="text-sm font-bold text-gray-900">{t('frameworks.addFramework')}</h3>
          <p className="text-xs text-gray-500 mt-1">{frameworkLimitReached ? 'Limit reached — upgrade to add more' : 'Browse catalog...'}</p>
        </button>
      </div>

      {/* Add Framework Modal with Template Support */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[85vh] flex flex-col shadow-2xl animate-fadeIn">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{t('frameworks.addFramework')}</h3>
                {templatesLoaded && templates.length > 0 && (
                  <p className="text-sm text-gray-500 mt-1">
                    {templates.length} frameworks have pre-built control templates
                  </p>
                )}
              </div>
              <button onClick={() => { setIsModalOpen(false); setTemplatePreview(null); }} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>

            <div className="p-4 border-b border-gray-100 bg-gray-50">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search standards (e.g. NIST, ISO, SOC 2)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
              {/* Framework List */}
              <div className={`${templatePreview ? 'w-1/2 border-r border-gray-100' : 'w-full'} overflow-y-auto p-6 space-y-3`}>
                {filteredAvailable.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">{t('common.noResults')}</p>
                ) : (
                  filteredAvailable.map((fw, idx) => {
                    const template = getTemplateForFramework(fw.name);
                    return (
                      <div key={idx} className="flex justify-between items-center p-4 border border-gray-200 rounded-lg hover:border-brand-200 hover:bg-brand-50 transition-colors">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-gray-900 truncate">{fw.name}</h4>
                            {template && (
                              <span className="flex-shrink-0 text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full font-medium">
                                {template.controlCount} controls
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 truncate">{fw.description}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{fw.region}</span>
                            {template && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePreviewTemplate(template.frameworkType);
                                }}
                                className="text-xs text-blue-600 hover:text-blue-800 underline"
                              >
                                Preview controls
                              </button>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            onAddFramework(fw.name, fw.region);
                            setIsModalOpen(false);
                            setTemplatePreview(null);
                          }}
                          className="flex-shrink-0 ml-3 bg-white text-brand-600 border border-brand-200 hover:bg-brand-600 hover:text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                          {t('common.add')}
                        </button>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Template Preview Panel */}
              {templatePreview && (
                <div className="w-1/2 overflow-y-auto p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-bold text-gray-900">
                      Template Preview: {templatePreview.frameworkType}
                    </h4>
                    <button
                      onClick={() => setTemplatePreview(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <div className="text-sm text-gray-600 mb-4 bg-blue-50 p-3 rounded-lg border border-blue-100">
                    <span className="font-medium text-blue-800">{templatePreview.controlCount} controls</span>
                    {' '}across{' '}
                    <span className="font-medium text-blue-800">{templatePreview.categories.length} categories</span>
                    {' '}will be auto-populated when you add this framework.
                  </div>

                  {templatePreviewLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="animate-spin text-blue-500" size={32} />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {templatePreview.categories.map((cat) => (
                        <div key={cat.category} className="border border-gray-200 rounded-lg">
                          <button
                            onClick={() => toggleCategory(cat.category)}
                            className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              {expandedCategories.has(cat.category) ? (
                                <ChevronDown size={16} className="text-gray-400" />
                              ) : (
                                <ChevronRight size={16} className="text-gray-400" />
                              )}
                              <span className="text-sm font-medium text-gray-900">{cat.category}</span>
                            </div>
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                              {cat.controlCount} controls
                            </span>
                          </button>
                          {expandedCategories.has(cat.category) && (
                            <div className="border-t border-gray-100 p-3 space-y-2 bg-gray-50">
                              {cat.controls.map((ctrl) => (
                                <div key={ctrl.controlId} className="text-xs p-2 bg-white rounded border border-gray-100">
                                  <div className="font-medium text-gray-800">
                                    {ctrl.controlId}: {ctrl.name}
                                  </div>
                                  <p className="text-gray-500 mt-1 line-clamp-2">{ctrl.description}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* AI Gap Analysis Modal */}
      {showGapAnalysisModal && aiGapAnalysis && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[85vh] overflow-y-auto shadow-2xl animate-fadeIn">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Brain className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">AI Gap Analysis</h3>
                  <p className="text-sm text-gray-500">{selectedFrameworkForAI?.name || 'Framework'}</p>
                </div>
              </div>
              <button onClick={() => setShowGapAnalysisModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Overall Score */}
              <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-purple-100">Current Compliance Score</h4>
                    <p className="text-4xl font-bold mt-1">{aiGapAnalysis.overallScore}%</p>
                  </div>
                  <Target className="w-12 h-12 text-purple-200" />
                </div>
              </div>

              {/* Summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">Summary</h4>
                <div className="prose prose-sm max-w-none text-gray-700">
                  <ReactMarkdown>{aiGapAnalysis.summary}</ReactMarkdown>
                </div>
              </div>

              {/* Gaps */}
              {aiGapAnalysis.gaps && aiGapAnalysis.gaps.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Priority Gaps</h4>
                  <div className="space-y-2">
                    {aiGapAnalysis.gaps.map((gap, i) => (
                      <div key={i} className="bg-white border rounded-lg p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900">{gap.control}</span>
                              <span className={`text-xs px-2 py-0.5 rounded-full border ${getPriorityColor(gap.priority)}`}>
                                {gap.priority}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{gap.gap}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              <span className="font-medium">Recommendation:</span> {gap.recommendation}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Roadmap */}
              {aiGapAnalysis.prioritizedRoadmap && aiGapAnalysis.prioritizedRoadmap.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Remediation Roadmap</h4>
                  <div className="space-y-3">
                    {aiGapAnalysis.prioritizedRoadmap.map((phase, i) => (
                      <div key={i} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-medium text-blue-800">{phase.phase}</h5>
                          <span className="text-xs text-blue-600 bg-blue-100 px-2 py-0.5 rounded">{phase.timeline}</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {phase.controls.map((ctrl, j) => (
                            <span key={j} className="text-xs bg-white text-blue-700 px-2 py-0.5 rounded border border-blue-200">
                              {ctrl}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* AI Evidence Classification Modal */}
      {showEvidenceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl animate-fadeIn">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Upload className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">AI Evidence Classification</h3>
                  <p className="text-sm text-gray-500">{selectedFrameworkForAI?.name || 'Framework'}</p>
                </div>
              </div>
              <button onClick={() => setShowEvidenceModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Evidence Description</label>
                <textarea
                  value={evidenceDescription}
                  onChange={(e) => setEvidenceDescription(e.target.value)}
                  placeholder="Describe the evidence document (e.g., 'Annual security training completion certificates for all employees')"
                  className="w-full border rounded-lg px-3 py-2 text-sm h-24"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Or Upload File (optional)</label>
                <input
                  type="file"
                  onChange={(e) => setEvidenceFile(e.target.files?.[0] || null)}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
                {evidenceFile && (
                  <p className="text-xs text-gray-500 mt-1">Selected: {evidenceFile.name}</p>
                )}
              </div>

              <button
                onClick={handleAIEvidenceClassify}
                disabled={evidenceClassifyLoading || (!evidenceDescription && !evidenceFile)}
                className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {evidenceClassifyLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Classifying...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Classify with AI
                  </>
                )}
              </button>

              {/* Classification Result */}
              {evidenceClassification && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
                  <h4 className="font-semibold text-green-800 mb-3">Classification Result</h4>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Suggested Control:</span>
                      <span className="font-medium text-gray-900">{evidenceClassification.suggestedControl}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Control ID:</span>
                      <span className="font-mono text-sm bg-gray-100 px-2 py-0.5 rounded">{evidenceClassification.suggestedControlId}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Confidence:</span>
                      <span className={`text-sm font-bold px-2 py-0.5 rounded ${getConfidenceColor(evidenceClassification.confidenceScore)}`}>
                        {evidenceClassification.confidenceScore}%
                      </span>
                    </div>

                    <div>
                      <span className="text-sm text-gray-600">Reasoning:</span>
                      <p className="text-sm text-gray-700 mt-1">{evidenceClassification.reasoning}</p>
                    </div>

                    {evidenceClassification.alternativeControls && evidenceClassification.alternativeControls.length > 0 && (
                      <div>
                        <span className="text-sm text-gray-600">Alternatives:</span>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {evidenceClassification.alternativeControls.map((alt, i) => (
                            <span key={i} className="text-xs bg-white border px-2 py-1 rounded">
                              {alt.control} ({alt.confidence}%)
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* AI Control Assessment Modal */}
      {showControlAssessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl animate-fadeIn">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Eye className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">AI Control Assessment</h3>
                  <p className="text-sm text-gray-500">{selectedControl?.name || 'Control'}</p>
                </div>
              </div>
              <button onClick={() => setShowControlAssessModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>

            <div className="p-6">
              {controlAssessLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600 mr-3" />
                  <span className="text-gray-600">AI is assessing the control...</span>
                </div>
              ) : controlAssessment ? (
                <div className="space-y-4">
                  {/* Status & Priority */}
                  <div className="flex gap-4">
                    <div className="flex-1 bg-gray-50 rounded-lg p-4">
                      <p className="text-xs text-gray-500 mb-1">Current Status</p>
                      <p className="font-medium text-gray-900">{controlAssessment.currentStatus}</p>
                    </div>
                    <div className="flex-1 bg-gray-50 rounded-lg p-4">
                      <p className="text-xs text-gray-500 mb-1">Priority</p>
                      <span className={`text-sm px-2 py-0.5 rounded-full border ${getPriorityColor(controlAssessment.priority)}`}>
                        {controlAssessment.priority}
                      </span>
                    </div>
                    <div className="flex-1 bg-gray-50 rounded-lg p-4">
                      <p className="text-xs text-gray-500 mb-1">Estimated Effort</p>
                      <p className="font-medium text-gray-900">{controlAssessment.estimatedEffort}</p>
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-800 mb-2">Assessment Summary</h4>
                    <div className="prose prose-sm max-w-none text-blue-700">
                      <ReactMarkdown>{controlAssessment.summary}</ReactMarkdown>
                    </div>
                  </div>

                  {/* Compliance Gaps */}
                  {controlAssessment.complianceGaps && controlAssessment.complianceGaps.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Compliance Gaps</h4>
                      <ul className="space-y-1">
                        {controlAssessment.complianceGaps.map((gap, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                            <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 shrink-0" />
                            {gap}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Required Evidence */}
                  {controlAssessment.requiredEvidence && controlAssessment.requiredEvidence.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Required Evidence</h4>
                      <ul className="space-y-1">
                        {controlAssessment.requiredEvidence.map((ev, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                            <FileText className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                            {ev}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Required Actions */}
                  {controlAssessment.requiredActions && controlAssessment.requiredActions.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Required Actions</h4>
                      <ul className="space-y-1">
                        {controlAssessment.requiredActions.map((action, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                            {action}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">No assessment data available</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* AI Co-Pilot Modal */}
      {showCoPilotModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[85vh] overflow-y-auto shadow-2xl animate-fadeIn">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">AI Compliance Co-Pilot</h3>
                  <p className="text-sm text-gray-500">{selectedFrameworkForAI?.name || 'Framework'} Recommendations</p>
                </div>
              </div>
              <button onClick={() => setShowCoPilotModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>

            <div className="p-6">
              {coPilotLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-purple-600 mr-3" />
                  <span className="text-gray-600">AI is generating recommendations...</span>
                </div>
              ) : coPilotRecommendations.length > 0 ? (
                <div className="space-y-4">
                  {coPilotRecommendations.map((rec, i) => (
                    <div key={rec.id || i} className="bg-white border rounded-xl p-4 hover:border-purple-200 transition">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">{rec.type}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${getPriorityColor(rec.priority)}`}>
                            {rec.priority}
                          </span>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          rec.impact === 'High' ? 'bg-green-100 text-green-700' :
                          rec.impact === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          Impact: {rec.impact}
                        </span>
                      </div>

                      <h4 className="font-semibold text-gray-900 mb-1">{rec.title}</h4>
                      <p className="text-sm text-gray-600 mb-3">{rec.description}</p>

                      {rec.suggestedActions && rec.suggestedActions.length > 0 && (
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-xs font-medium text-gray-500 mb-2">Suggested Actions:</p>
                          <ul className="space-y-1">
                            {rec.suggestedActions.map((action, j) => (
                              <li key={j} className="flex items-start gap-2 text-sm text-gray-700">
                                <TrendingUp className="w-3.5 h-3.5 text-purple-500 mt-0.5 shrink-0" />
                                {action}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Shield className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No recommendations available at this time</p>
                  <p className="text-sm text-gray-400 mt-1">The AI will generate recommendations as you add more controls</p>
                </div>
              )}

              <button
                onClick={() => handleAICoPilot(selectedFrameworkForAI!)}
                disabled={coPilotLoading || !selectedFrameworkForAI}
                className="mt-4 w-full flex items-center justify-center gap-2 bg-purple-50 text-purple-700 border border-purple-200 py-2 rounded-lg hover:bg-purple-100 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${coPilotLoading ? 'animate-spin' : ''}`} />
                Refresh Recommendations
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
