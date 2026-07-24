
import React, { useState, useMemo, useEffect } from 'react';
import { api } from '../services/api';
import { generateRemediationPlan, prioritizeRisks } from '../services/geminiService';
import { RiskItem, User } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { isAtLimit, getUpgradeMessage } from '../constants/tierLimits';
import { TierLimitBanner } from './TierLimitBanner';
import { 
  ArrowLeft, Filter, CheckSquare, Loader2, Play, CheckCircle, X, SortAsc, SortDesc, BrainCircuit, ListFilter, Plus
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';
import { useI18n } from '../contexts/I18nContext';
import { logger } from '../utils/logger';

interface RiskManagementProps {
  onBack: () => void;
}

type SortField = 'severity' | 'detectedAt' | 'aiScore';
type SortOrder = 'asc' | 'desc';

export const RiskManagement: React.FC<RiskManagementProps> = ({ onBack }) => {
  const { user } = useAuth();
  const { t } = useI18n();
  const [risks, setRisks] = useState<RiskItem[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [teamMembers, setTeamMembers] = useState<User[]>([]);
  
  const [filterSeverity, setFilterSeverity] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [filterAssignee, setFilterAssignee] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortField, setSortField] = useState<SortField>('severity');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStep, setScanStep] = useState('');
  const [isPrioritizing, setIsPrioritizing] = useState(false);

  const [selectedRisk, setSelectedRisk] = useState<RiskItem | null>(null);
  const [remediationPlan, setRemediationPlan] = useState<string | null>(null);
  const [loadingRemediation, setLoadingRemediation] = useState(false);
  const [assigneeId, setAssigneeId] = useState<string>('');
  const [newStatus, setNewStatus] = useState<'Open' | 'In Progress' | 'Resolved' | 'Ignored'>('Open');
  
  const [showAddRiskModal, setShowAddRiskModal] = useState(false);
  const [newRisk, setNewRisk] = useState({
    title: '',
    description: '',
    category: '',
    severity: 'Medium' as 'High' | 'Medium' | 'Low',
    likelihood: 3,
    impact: 3,
    assignedToId: '',
    mitigationPlan: '',
    targetDate: '',
  });

  useEffect(() => {
    loadRisks();
    loadTeamMembers();
  }, [filterSeverity, filterStatus, filterCategory, filterAssignee, searchQuery, sortField, sortOrder]);

  const loadRisks = async () => {
    setIsLoadingData(true);
    try {
      const data = await api.risks.list();
      setRisks(data);
    } catch (error) {
      logger.error('Failed to load risks:', error);
      setRisks([]);
    } finally {
      setIsLoadingData(false);
    }
  };

  const loadTeamMembers = async () => {
    try {
      const members = await api.team.list();
      setTeamMembers(members);
    } catch (error) {
      logger.error('Failed to load team members:', error);
      setTeamMembers([]);
    }
  };

  const filteredRisks = useMemo(() => {
    return risks.filter(risk => {
      const matchesSeverity = filterSeverity === 'All' || risk.severity === filterSeverity;
      const matchesStatus = filterStatus === 'All' || risk.status === filterStatus;
      const matchesCategory = filterCategory === 'All' || risk.category === filterCategory;
      const matchesAssignee = filterAssignee === 'All' || 
        (risk as any).assignedTo?.id === filterAssignee || 
        (risk as any).assignedToId === filterAssignee;
      const matchesSearch = !searchQuery || 
        risk.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        risk.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        risk.category?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSeverity && matchesStatus && matchesCategory && matchesAssignee && matchesSearch;
    });
  }, [risks, filterSeverity, filterStatus, filterCategory, filterAssignee, searchQuery]);

  const sortedRisks = useMemo(() => {
    return [...filteredRisks].sort((a, b) => {
      let comparison = 0;
      if (sortField === 'severity') {
        const severityMap: Record<string, number> = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
        comparison = (severityMap[a.severity] || 0) - (severityMap[b.severity] || 0);
      } else if (sortField === 'detectedAt') {
        comparison = a.detectedAt.localeCompare(b.detectedAt);
      } else if (sortField === 'aiScore') {
        comparison = (a.aiPriorityScore || 0) - (b.aiPriorityScore || 0);
      } else if (sortField === 'riskScore') {
        const scoreA = a.riskScore || (a.likelihood && a.impact ? a.likelihood * a.impact : 0);
        const scoreB = b.riskScore || (b.likelihood && b.impact ? b.likelihood * b.impact : 0);
        comparison = scoreA - scoreB;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [filteredRisks, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const runRiskAssessment = async () => {
    setIsScanning(true);
    setScanProgress(0);
    setScanStep('Initializing AI Risk Scan...');
    
    try {
      // Call backend scan endpoint which uses AI to discover risks
      const result = await api.risks.scan() as { newRisks?: RiskItem[] };
      
      // Simulate progress updates
      const steps = [
        'Connecting to Cloud Integrations...',
        'Scanning IAM Policies...',
        'Analyzing Compliance Frameworks...',
        'Checking Integration Status...',
        'AI Analyzing Discovered Issues...',
        'Finalizing Report...'
      ];
      
      let currentStep = 0;
      const progressInterval = setInterval(() => {
        currentStep++;
        setScanProgress(Math.min((currentStep / steps.length) * 100, 95));
        setScanStep(steps[currentStep] || 'Processing...');
        
        if (currentStep >= steps.length) {
          clearInterval(progressInterval);
          setScanProgress(100);
          setScanStep('Scan Complete!');
          
          setTimeout(() => {
            setIsScanning(false);
            loadRisks();
            if (result.newRisks && result.newRisks.length > 0) {
              toast.success(`AI Risk Scan completed! Found ${result.newRisks.length} new risk(s).`);
            } else {
              toast.info('AI Risk Scan completed! No new risks detected.');
            }
          }, 1000);
        }
      }, 600);
    } catch (error: any) {
      logger.error('Risk scan failed:', error);
      setIsScanning(false);
      toast.error(`Risk scan failed: ${error.message || 'Unknown error'}`);
    }
  };

  const handleAIPrioritization = async () => {
    setIsPrioritizing(true);
    const prioritizedData = await prioritizeRisks(risks);
    
    if (prioritizedData.length > 0) {
      // Update local state and persist only valid schema fields
      const updatedRisks = risks.map(risk => {
        const aiData = prioritizedData.find((p: any) => p.id === risk.id);
        if (aiData) {
          const updated = { ...risk, aiPriorityScore: aiData.score, aiRationale: aiData.rationale };
          // Only send schema-valid fields to the update endpoint
          const { title, description, category, severity, likelihood, impact, status, owner, assignedToId, targetDate, riskScore, mitigationPlan, frameworkId } = updated as any;
          api.risks.update(updated.id, { title, description, category, severity, likelihood, impact, status, owner, assignedToId, targetDate, riskScore, mitigationPlan, frameworkId });
          return updated;
        }
        return risk;
      });
      setRisks(updatedRisks);
      setSortField('aiScore');
      setSortOrder('desc');
    }
    setIsPrioritizing(false);
  };

  const handleOpenRemediation = async (risk: RiskItem) => {
    setSelectedRisk(risk);
    // Extract user ID from risk - backend returns assignedTo as object with id
    const assignedUserId = (risk as any).assignedTo?.id || (risk as any).assignedToId || '';
    setAssigneeId(assignedUserId);
    setNewStatus(risk.status);
    setRemediationPlan(risk.mitigationPlan || null);

    if (!risk.mitigationPlan) {
      setLoadingRemediation(true);
      try {
        // Call backend API to generate remediation plan
        const result = await api.risks.generateRemediation(risk.id) as { plan?: string };
        setRemediationPlan(result.plan || '');
      } catch (error: any) {
        logger.error('Failed to generate remediation plan:', error);
        // Fallback to frontend generation if backend fails
        const plan = await generateRemediationPlan(risk.description);
        setRemediationPlan(plan);
      } finally {
        setLoadingRemediation(false);
      }
    }
  };

  const saveRiskChanges = async () => {
    if (selectedRisk) {
      try {
        // Find the user by ID if assigneeId is provided
        const assignee = assigneeId ? teamMembers.find(u => u.id === assigneeId) : null;
        
        // Prepare update data
        const updateData: any = {
          status: newStatus,
          mitigationPlan: remediationPlan === null || remediationPlan === '' ? null : remediationPlan,
        };

        // Include assignedToId
        if (assigneeId) {
          updateData.assignedToId = assigneeId;
        } else {
          updateData.assignedToId = null;
        }

        // Include targetDate if it was set
        if (selectedRisk.targetDate) {
          updateData.targetDate = selectedRisk.targetDate;
        }
        
        await api.risks.update(selectedRisk.id, updateData);
        
        // Note: Audit logging is handled by the backend to prevent duplicate entries
        // The backend automatically creates audit log entries for risk updates
        
        // Reload risks to get updated data from backend
        await loadRisks();
        setSelectedRisk(null);
      } catch (error: any) {
        logger.error('Failed to update risk:', error);
        toast.error(`Failed to update risk: ${error.message || 'Unknown error'}`);
      }
    }
  };

  const handleCreateRisk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRisk.description || !newRisk.category) {
      toast.warning('Description and category are required');
      return;
    }

    try {
      const riskData: any = {
        title: newRisk.title || newRisk.description.substring(0, 100),
        description: newRisk.description,
        category: newRisk.category,
        severity: newRisk.severity,
        likelihood: newRisk.likelihood,
        impact: newRisk.impact,
      };

      if (newRisk.assignedToId) {
        riskData.assignedToId = newRisk.assignedToId;
      }

      if (newRisk.mitigationPlan) {
        riskData.mitigationPlan = newRisk.mitigationPlan;
      }

      if (newRisk.targetDate) {
        riskData.targetDate = newRisk.targetDate;
      }

      if (isAtLimit(user?.organization?.plan, 'maxIssues', risks.length)) {
        toast.warning(getUpgradeMessage(user?.organization?.plan, 'maxIssues', risks.length) || 'Issue limit reached. Upgrade in Settings → Billing.');
        return;
      }
      const createdRisk = await api.risks.create(riskData);
      
      // Note: Audit logging is handled by the backend to prevent duplicate entries
      setNewRisk({ 
        title: '', 
        description: '', 
        category: '', 
        severity: 'Medium', 
        likelihood: 3,
        impact: 3,
        assignedToId: '', 
        mitigationPlan: '',
        targetDate: '',
      });
      setShowAddRiskModal(false);
      await loadRisks();
    } catch (error: any) {
      logger.error('Failed to create risk:', error);
      toast.error(`Failed to create risk: ${error.message || 'Unknown error'}`);
    }
  };

  if (isLoadingData) return <div className="p-8 text-center text-gray-500 dark:text-signal-sub">{t('common.loading')}</div>;

  const issuesLimitReached = isAtLimit(user?.organization?.plan, 'maxIssues', risks.length);

  return (
    <div className="space-y-6 animate-fadeIn relative pb-20">
      {issuesLimitReached && (
        <TierLimitBanner message={getUpgradeMessage(user?.organization?.plan, 'maxIssues', risks.length)} />
      )}
      {/* Assessment Overlay */}
      {isScanning && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white dark:bg-signal-panel2 dark:border dark:border-white/[0.08] p-8 rounded-2xl shadow-2xl max-w-md w-full text-center">
            <Loader2 className="animate-spin text-brand-600 dark:text-signal-green w-16 h-16 mx-auto mb-6" />
            <h3 className="text-xl font-bold text-gray-900 dark:text-signal-ink mb-2">Running Risk Assessment</h3>
            <p className="text-gray-500 dark:text-signal-sub mb-6">{scanStep}</p>
            <div className="w-full bg-gray-200 dark:bg-white/[0.08] rounded-full h-2 mb-2">
              <div 
                className="bg-brand-600 dark:bg-signal-green h-2 rounded-full transition-all duration-300" 
                style={{ width: `${scanProgress}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}

      {/* Remediation / Task Modal */}
      {selectedRisk && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white dark:bg-signal-panel2 dark:border dark:border-white/[0.08] rounded-xl shadow-2xl max-w-3xl w-full max-h-[85vh] flex flex-col animate-scaleIn">
            <div className="p-6 border-b border-gray-100 dark:border-white/[0.08] flex justify-between items-center bg-gray-50 dark:bg-white/[0.02] rounded-t-xl">
              <h3 className="text-lg font-bold text-gray-900 dark:text-signal-ink flex items-center">
                <CheckSquare className="mr-2 text-brand-600 dark:text-signal-green" />
                {t('risks.treatmentPlan')}
              </h3>
              <button onClick={() => setSelectedRisk(null)} className="text-gray-400 hover:text-gray-600 dark:text-signal-muted dark:hover:text-signal-ink">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              <div className="flex flex-col md:flex-row gap-4 p-4 bg-gray-50 dark:bg-white/[0.03] rounded-lg border border-gray-200 dark:border-white/[0.06]">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-gray-500 dark:text-signal-muted uppercase tracking-wider mb-1">{t('common.status')}</label>
                  <select 
                    value={newStatus} 
                    onChange={(e) => setNewStatus(e.target.value as any)}
                    className="w-full p-2 border border-gray-300 rounded-xl dark:bg-white/[0.04] dark:border-white/[0.10] dark:text-signal-ink text-sm"
                  >
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Ignored">Ignored</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-gray-500 dark:text-signal-muted uppercase tracking-wider mb-1">{t('risks.riskOwner')}</label>
                  <select 
                    value={assigneeId} 
                    onChange={(e) => setAssigneeId(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-xl dark:bg-white/[0.04] dark:border-white/[0.10] dark:text-signal-ink text-sm"
                  >
                    <option value="">Unassigned</option>
                    {teamMembers.map(u => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="p-4 bg-red-50 dark:bg-signal-bad/10 border border-red-100 dark:border-signal-bad/20 rounded-lg">
                <div className="flex justify-between items-start mb-2">
                   <span className="text-xs font-bold text-red-600 dark:text-signal-bad uppercase tracking-wide">Target Risk</span>
                   {selectedRisk.aiPriorityScore && (
                     <span className="text-xs bg-purple-100 text-purple-700 dark:bg-signal-violet/10 dark:text-signal-violet px-2 py-1 rounded font-bold">AI Priority: {selectedRisk.aiPriorityScore}</span>
                   )}
                </div>
                <p className="font-medium text-gray-900 dark:text-signal-ink">{selectedRisk.description}</p>
                {selectedRisk.aiRationale && <p className="text-xs text-gray-500 dark:text-signal-muted mt-2 italic">"AI Analysis: {selectedRisk.aiRationale}"</p>}
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-bold text-gray-900 dark:text-signal-ink">{t('risks.mitigationPlan')}</h4>
                  {selectedRisk.targetDate && (
                    <div className="text-sm">
                      <span className="text-gray-600 dark:text-signal-sub">Due Date: </span>
                      <span className={`font-semibold ${new Date(selectedRisk.targetDate) < new Date() ? 'text-red-600 dark:text-signal-bad' : 'text-gray-900 dark:text-signal-ink'}`}>
                        {new Date(selectedRisk.targetDate).toLocaleDateString()}
                        {new Date(selectedRisk.targetDate) < new Date() && ' ⚠️ Overdue'}
                      </span>
                    </div>
                  )}
                </div>
                {loadingRemediation ? (
                  <div className="flex flex-col items-center justify-center py-8 bg-gray-50 dark:bg-white/[0.03] rounded-lg">
                     <Loader2 className="animate-spin text-brand-500 dark:text-signal-green mb-4" size={24} />
                     <p className="text-sm text-gray-500 dark:text-signal-sub">AI is generating step-by-step fix...</p>
                  </div>
                ) : (
                  <div>
                    <textarea
                      value={remediationPlan || ''}
                      onChange={(e) => setRemediationPlan(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl dark:bg-white/[0.04] dark:border-white/[0.10] dark:text-signal-ink focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:focus:ring-signal-green/40 dark:focus:border-signal-green/40 outline-none"
                      rows={6}
                      placeholder="Enter remediation steps... (AI-generated plan can be edited)"
                    />
                    <p className="text-xs text-gray-500 dark:text-signal-muted mt-1">You can edit the AI-generated plan or enter your own remediation steps.</p>
                  </div>
                )}
              </div>

              {selectedRisk.targetDate && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-signal-body2 mb-1">{t('risks.reviewDate')}</label>
                  <input
                    type="date"
                    value={selectedRisk.targetDate ? new Date(selectedRisk.targetDate).toISOString().split('T')[0] : ''}
                    onChange={(e) => {
                      if (selectedRisk) {
                        setSelectedRisk({ ...selectedRisk, targetDate: e.target.value });
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl dark:bg-white/[0.04] dark:border-white/[0.10] dark:text-signal-ink focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:focus:ring-signal-green/40 dark:focus:border-signal-green/40 outline-none"
                  />
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-100 dark:border-white/[0.08] bg-gray-50 dark:bg-white/[0.02] rounded-b-xl flex justify-end space-x-3">
              <button onClick={() => setSelectedRisk(null)} className="px-4 py-2 text-gray-600 dark:text-signal-sub hover:bg-gray-100 dark:hover:bg-white/[0.05] rounded-lg font-medium transition-colors">{t('common.cancel')}</button>
              <button onClick={saveRiskChanges} className="px-6 py-2 bg-brand-600 text-white dark:bg-signal-green dark:text-signal-canvas rounded-lg font-medium hover:bg-brand-700 dark:hover:bg-signal-green/90 transition-colors shadow-lg">{t('common.save')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Header and Filter sections remain largely same but using real actions */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center space-x-4">
            <button onClick={onBack} className="p-2 hover:bg-gray-200 dark:hover:bg-white/[0.06] rounded-lg transition-colors"><ArrowLeft size={20} className="text-gray-600 dark:text-signal-sub" /></button>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-signal-ink dark:font-display">{t('risks.title')}</h2>
              <p className="text-sm text-gray-500 dark:text-signal-sub">{t('risks.riskIndicators')}</p>
            </div>
          </div>
          <div className="flex gap-3">
            {(user?.role === 'admin' || user?.role === 'editor') && (
              <button 
                onClick={() => !issuesLimitReached && setShowAddRiskModal(true)} 
                disabled={issuesLimitReached}
                title={issuesLimitReached ? getUpgradeMessage(user?.organization?.plan, 'maxIssues', risks.length) : undefined}
                className="bg-green-600 text-white dark:bg-signal-green dark:text-signal-canvas px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-green-700 dark:hover:bg-signal-green/90 shadow-md dark:shadow-none flex items-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="mr-2" size={16} />
                {t('risks.createRisk')}
              </button>
            )}
             <button onClick={handleAIPrioritization} disabled={isPrioritizing} className="bg-purple-600 text-white dark:bg-signal-violet/10 dark:text-signal-violet px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-purple-700 dark:hover:bg-signal-violet/20 shadow-md dark:shadow-none flex items-center transition-colors">
              {isPrioritizing ? <Loader2 className="animate-spin mr-2" size={16} /> : <BrainCircuit className="mr-2" size={16} />}
              AI Prioritize
            </button>
            <button onClick={runRiskAssessment} disabled={isScanning} className="bg-brand-600 text-white dark:bg-signal-green/10 dark:text-signal-green px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-brand-700 dark:hover:bg-signal-green/20 shadow-md dark:shadow-none flex items-center transition-colors">
              {isScanning ? <Loader2 className="animate-spin mr-2" size={16} /> : <Play className="mr-2" size={16} />}
              Run Scan
            </button>
          </div>
        </div>
      </div>
      
      {/* Table implementation */}
      {(
      <div className="bg-white dark:bg-white/[0.03] rounded-xl shadow-sm dark:shadow-none border border-gray-100 dark:border-white/[0.06] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="font-mono text-[10px] tracking-[0.14em] text-gray-500 dark:text-signal-muted uppercase bg-gray-50 dark:bg-transparent border-b border-gray-100 dark:border-white/[0.06]">
              <tr>
                <th className="px-6 py-4 font-medium cursor-pointer whitespace-nowrap" onClick={() => handleSort('severity')}>
                   <div className="flex items-center gap-1">
                     <span>{t('common.severity').toUpperCase()}</span>
                     {sortField === 'severity' && (sortOrder === 'asc' ? <SortAsc size={14}/> : <SortDesc size={14}/>)}
                   </div>
                </th>
                <th className="px-6 py-4 font-medium whitespace-nowrap">{t('common.description').toUpperCase()}</th>
                <th className="px-6 py-4 font-medium whitespace-nowrap">{t('common.assignee').toUpperCase()}</th>
                <th className="px-6 py-4 font-medium cursor-pointer whitespace-nowrap" onClick={() => handleSort('aiScore')}>
                  <div className="flex items-center gap-1">
                    <span>{t('risks.riskScore').toUpperCase()}</span>
                    {sortField === 'aiScore' && (sortOrder === 'asc' ? <SortAsc size={14}/> : <SortDesc size={14}/>)}
                  </div>
                </th>
                <th className="px-6 py-4 font-medium whitespace-nowrap">{t('common.status').toUpperCase()}</th>
                <th className="px-6 py-4 font-medium text-right whitespace-nowrap">{t('common.actions').toUpperCase()}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/[0.06]">
               {sortedRisks.map((risk) => (
                  <tr key={risk.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.04] group">
                    <td className="px-6 py-4 align-middle">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${risk.severity === 'Critical' ? 'bg-red-200 text-red-900 dark:bg-signal-bad/20 dark:text-signal-bad' : risk.severity === 'High' ? 'bg-red-100 text-red-800 dark:bg-signal-bad/10 dark:text-signal-bad' : risk.severity === 'Medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-signal-warn/10 dark:text-signal-warn' : 'bg-blue-100 text-blue-800 dark:bg-signal-good/10 dark:text-signal-good'}`}>
                        {risk.severity}
                      </span>
                    </td>
                    <td className="px-6 py-4 align-middle">
                      <p className="font-medium text-gray-900 dark:text-signal-ink line-clamp-2">{risk.title || risk.description}</p>
                      {risk.targetDate && (
                        <p className="text-xs text-gray-500 dark:text-signal-muted mt-1">
                          Due: {new Date(risk.targetDate).toLocaleDateString()}
                          {new Date(risk.targetDate) < new Date() && (
                            <span className="ml-2 text-red-600 dark:text-signal-bad font-semibold">⚠️ Overdue</span>
                          )}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4 align-middle">
                      {(() => {
                        // Risk from backend may have assignedTo as object or name string
                        const assignedUser = (risk as any).assignedTo 
                          ? ((risk as any).assignedTo?.name || (risk as any).assignedTo)
                          : risk.assignedTo;
                        return assignedUser ? (
                          <span className="text-gray-600 dark:text-signal-sub">{assignedUser}</span>
                        ) : (
                          <span className="text-gray-400 dark:text-signal-muted italic">Unassigned</span>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-4 align-middle">
                      <span className={`font-semibold text-gray-900 dark:font-mono dark:text-xs dark:px-2.5 dark:py-1 dark:rounded-lg ${risk.severity === 'Critical' ? 'dark:bg-signal-bad/20 dark:text-signal-bad' : risk.severity === 'High' ? 'dark:bg-signal-bad/10 dark:text-signal-bad' : risk.severity === 'Medium' ? 'dark:bg-signal-warn/10 dark:text-signal-warn' : 'dark:bg-signal-good/10 dark:text-signal-good'}`}>{risk.riskScore || (risk.likelihood && risk.impact ? risk.likelihood * risk.impact : '-')}</span>
                      {risk.likelihood && risk.impact && (
                        <span className="text-xs text-gray-500 dark:text-signal-muted ml-1">({risk.likelihood}×{risk.impact})</span>
                      )}
                    </td>
                    <td className="px-6 py-4 align-middle">
                      <div className="flex flex-col">
                        {(() => {
                          const assignedUser = (risk as any).assignedTo 
                            ? ((risk as any).assignedTo?.name || (risk as any).assignedTo)
                            : risk.assignedTo;
                          if (!assignedUser) {
                            return (
                              <>
                                <span className="text-gray-400 dark:text-signal-muted text-xs">{new Date(risk.detectedAt).toLocaleDateString()}</span>
                                <span className="text-gray-400 dark:text-signal-muted text-xs mt-1">Unassigned</span>
                              </>
                            );
                          }
                          return (
                            <span className="text-gray-400 dark:text-signal-muted text-xs">{new Date(risk.detectedAt).toLocaleDateString()}</span>
                          );
                        })()}
                        <span className={`font-medium mt-1 ${risk.status === 'Open' ? 'text-gray-900 dark:text-signal-ink' : risk.status === 'Resolved' ? 'text-green-600 dark:text-signal-good' : 'text-gray-600 dark:text-signal-sub'}`}>
                          {risk.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right align-middle">
                       <button onClick={() => handleOpenRemediation(risk)} className="text-brand-600 dark:text-signal-green font-medium hover:text-brand-800 dark:hover:text-signal-green/80 px-3 py-1.5 border border-brand-200 dark:border-signal-green/30 rounded-lg whitespace-nowrap">
                         {t('common.edit')}
                       </button>
                    </td>
                  </tr>
               ))}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* Add Risk Modal */}
      {showAddRiskModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white dark:bg-signal-panel2 dark:border dark:border-white/[0.08] rounded-xl shadow-2xl max-w-2xl w-full animate-scaleIn">
            <div className="p-6 border-b border-gray-100 dark:border-white/[0.08] flex justify-between items-center bg-gray-50 dark:bg-white/[0.02] rounded-t-xl">
              <h3 className="text-lg font-bold text-gray-900 dark:text-signal-ink flex items-center">
                <Plus className="mr-2 text-brand-600 dark:text-signal-green" size={20} />
                {t('risks.createRisk')}
              </h3>
              <button onClick={() => setShowAddRiskModal(false)} className="text-gray-400 hover:text-gray-600 dark:text-signal-muted dark:hover:text-signal-ink">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleCreateRisk} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-signal-body2 mb-1">{t('risks.title')} ({t('common.optional')})</label>
                <input
                  type="text"
                  value={newRisk.title}
                  onChange={(e) => setNewRisk({ ...newRisk, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl dark:bg-white/[0.04] dark:border-white/[0.10] dark:text-signal-ink focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:focus:ring-signal-green/40 dark:focus:border-signal-green/40 outline-none"
                  placeholder="Risk title (auto-generated from description if empty)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-signal-body2 mb-1">{t('common.description')} *</label>
                <textarea
                  value={newRisk.description}
                  onChange={(e) => setNewRisk({ ...newRisk, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl dark:bg-white/[0.04] dark:border-white/[0.10] dark:text-signal-ink focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:focus:ring-signal-green/40 dark:focus:border-signal-green/40 outline-none"
                  rows={3}
                  required
                  placeholder="Describe the risk..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-signal-body2 mb-1">{t('risks.riskCategory')} *</label>
                  <input
                    type="text"
                    value={newRisk.category}
                    onChange={(e) => setNewRisk({ ...newRisk, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl dark:bg-white/[0.04] dark:border-white/[0.10] dark:text-signal-ink focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:focus:ring-signal-green/40 dark:focus:border-signal-green/40 outline-none"
                    required
                    placeholder="e.g., Infrastructure, Personnel, Data Breach"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-signal-body2 mb-1">{t('common.severity')} *</label>
                  <select
                    value={newRisk.severity}
                    onChange={(e) => setNewRisk({ ...newRisk, severity: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl dark:bg-white/[0.04] dark:border-white/[0.10] dark:text-signal-ink focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:focus:ring-signal-green/40 dark:focus:border-signal-green/40 outline-none"
                    required
                  >
                    <option value="High">{t('risks.high')}</option>
                    <option value="Medium">{t('risks.medium')}</option>
                    <option value="Low">{t('risks.low')}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-signal-body2 mb-1">{t('risks.likelihood')} (1-5) *</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={newRisk.likelihood}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 1;
                      setNewRisk({ ...newRisk, likelihood: Math.min(5, Math.max(1, val)) });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl dark:bg-white/[0.04] dark:border-white/[0.10] dark:text-signal-ink focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:focus:ring-signal-green/40 dark:focus:border-signal-green/40 outline-none"
                    required
                  />
                  <p className="text-xs text-gray-500 dark:text-signal-muted mt-1">1 = Very Unlikely, 5 = Very Likely</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-signal-body2 mb-1">{t('risks.impact')} (1-5) *</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={newRisk.impact}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 1;
                      setNewRisk({ ...newRisk, impact: Math.min(5, Math.max(1, val)) });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl dark:bg-white/[0.04] dark:border-white/[0.10] dark:text-signal-ink focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:focus:ring-signal-green/40 dark:focus:border-signal-green/40 outline-none"
                    required
                  />
                  <p className="text-xs text-gray-500 dark:text-signal-muted mt-1">1 = Low Impact, 5 = Critical Impact</p>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-signal-green/10 border border-blue-200 dark:border-signal-green/20 rounded-lg p-3">
                <p className="text-sm font-medium text-blue-900 dark:text-signal-green">
                  {t('risks.riskScore')}: <span className="text-lg font-bold">{newRisk.likelihood * newRisk.impact}</span>
                  <span className="text-xs text-blue-700 dark:text-signal-green/70 ml-2">({newRisk.likelihood} × {newRisk.impact})</span>
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-signal-body2 mb-1">{t('risks.mitigationPlan')} ({t('common.optional')})</label>
                <textarea
                  value={newRisk.mitigationPlan}
                  onChange={(e) => setNewRisk({ ...newRisk, mitigationPlan: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl dark:bg-white/[0.04] dark:border-white/[0.10] dark:text-signal-ink focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:focus:ring-signal-green/40 dark:focus:border-signal-green/40 outline-none"
                  rows={3}
                  placeholder="Enter remediation steps..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-signal-body2 mb-1">{t('risks.reviewDate')} ({t('common.optional')})</label>
                  <input
                    type="date"
                    value={newRisk.targetDate}
                    onChange={(e) => setNewRisk({ ...newRisk, targetDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl dark:bg-white/[0.04] dark:border-white/[0.10] dark:text-signal-ink focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:focus:ring-signal-green/40 dark:focus:border-signal-green/40 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-signal-body2 mb-1">{t('risks.riskOwner')} ({t('common.optional')})</label>
                  <select
                    value={newRisk.assignedToId}
                    onChange={(e) => setNewRisk({ ...newRisk, assignedToId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl dark:bg-white/[0.04] dark:border-white/[0.10] dark:text-signal-ink focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:focus:ring-signal-green/40 dark:focus:border-signal-green/40 outline-none"
                  >
                    <option value="">Unassigned</option>
                    {teamMembers.map(u => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddRiskModal(false);
                    setNewRisk({ 
                      title: '', 
                      description: '', 
                      category: '', 
                      severity: 'Medium', 
                      likelihood: 3,
                      impact: 3,
                      assignedToId: '', 
                      mitigationPlan: '',
                      targetDate: '',
                    });
                  }}
                  className="px-4 py-2 text-gray-600 dark:text-signal-sub hover:bg-gray-100 dark:hover:bg-white/[0.05] rounded-lg font-medium transition-colors"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-brand-600 text-white dark:bg-signal-green dark:text-signal-canvas rounded-lg font-medium hover:bg-brand-700 dark:hover:bg-signal-green/90 transition-colors shadow-lg"
                >
                  {t('risks.createRisk')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
