
import React, { useState, useEffect } from 'react';
import { AVAILABLE_FRAMEWORKS } from '../constants';
import { ComplianceFramework, ComplianceStatus } from '../types';
import { CheckCircle, AlertTriangle, Clock, ArrowRight, Plus, X, Search, Trash2, Download, Layout, ChevronDown, ChevronRight, Loader2 } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useOnboardingTrigger } from '../hooks/useOnboarding';

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

interface FrameworksProps {
  activeFrameworks: ComplianceFramework[];
  onAddFramework: (name: string, region?: string) => void;
  onSelectFramework: (id: string) => void;
  onFrameworkDeleted?: () => void;
  /** Max frameworks for current plan (-1 = unlimited). Used to disable Add when at limit. */
  maxFrameworks?: number;
}

export const Frameworks: React.FC<FrameworksProps> = ({ activeFrameworks, onAddFramework, onSelectFramework, onFrameworkDeleted, maxFrameworks = -1 }) => {
  const { user } = useAuth();
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
    return templates.find(t =>
      t.frameworkType === frameworkName ||
      t.displayName === frameworkName ||
      frameworkName.includes(t.frameworkType) ||
      t.frameworkType.includes(frameworkName)
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

  const handleApplyTemplate = async (frameworkId: string, frameworkName: string) => {
    const template = getTemplateForFramework(frameworkName);
    if (!template) return;

    setApplyingTemplate(frameworkId);
    setApplyResult(null);
    try {
      const result = await api.frameworks.applyTemplate(frameworkId, template.frameworkType);
      setApplyResult({ message: result.message, applied: result.applied, skipped: result.skipped });
      // Refresh framework data
      if (onFrameworkDeleted) {
        onFrameworkDeleted(); // Reuse the callback to refresh
      }
    } catch (err: any) {
      console.error('Failed to apply template:', err);
      alert(`Failed to apply template: ${err.message || 'Unknown error'}`);
    } finally {
      setApplyingTemplate(null);
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
    } catch (error: any) {
      console.error('Failed to delete framework:', error);
      alert(`Failed to delete framework: ${error.message || 'Unknown error'}`);
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
    } catch (error: any) {
      console.error('Failed to export control report:', error);
      alert(`Failed to export control report: ${error.message || 'Unknown error'}`);
    }
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
           <p className="text-sm text-gray-500">Monitor and manage your compliance standards.</p>
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
            <span>Export</span>
          </button>
          <button
            onClick={() => !frameworkLimitReached && setIsModalOpen(true)}
            disabled={frameworkLimitReached}
            data-onboarding="add-framework-btn"
            className="flex items-center space-x-2 bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            title={frameworkLimitReached ? 'Framework limit reached. Upgrade in Settings → Billing.' : undefined}
          >
            <Plus size={18} />
            <span>Add Framework</span>
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
                    <span className="text-gray-500">Status</span>
                    <span className="font-bold text-gray-900">{fw.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${fw.progress > 90 ? 'bg-green-500' : fw.progress > 70 ? 'bg-yellow-500' : 'bg-red-500'}`}
                      style={{ width: `${fw.progress}%` }}
                    ></div>
                  </div>
                </div>

                {/* Apply Template Button */}
                {template && (
                  <div className="mb-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleApplyTemplate(fw.id, fw.name);
                      }}
                      disabled={applyingTemplate === fw.id}
                      className="w-full flex items-center justify-center space-x-2 bg-blue-50 text-blue-700 border border-blue-200 px-3 py-2 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium disabled:opacity-50"
                    >
                      {applyingTemplate === fw.id ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          <span>Applying template...</span>
                        </>
                      ) : (
                        <>
                          <Layout size={14} />
                          <span>Apply {template.controlCount} Template Controls</span>
                        </>
                      )}
                    </button>
                    {applyResult && applyingTemplate !== fw.id && (
                      <p className="text-xs text-green-600 mt-1 text-center">
                        {applyResult.applied} controls added, {applyResult.skipped} skipped
                      </p>
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
          <h3 className="text-sm font-bold text-gray-900">Add Framework</h3>
          <p className="text-xs text-gray-500 mt-1">{frameworkLimitReached ? 'Limit reached — upgrade to add more' : 'Browse catalog...'}</p>
        </button>
      </div>

      {/* Add Framework Modal with Template Support */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[85vh] flex flex-col shadow-2xl animate-fadeIn">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Add Compliance Framework</h3>
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
                  <p className="text-center text-gray-500 py-8">No matching frameworks found.</p>
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
                          Add
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
    </div>
  );
};
