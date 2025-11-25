
import React, { useState, useMemo, useEffect } from 'react';
import { api } from '../services/api';
import { MOCK_USERS } from '../constants';
import { generateRemediationPlan, prioritizeRisks } from '../services/geminiService';
import { RiskItem } from '../types';
import { 
  ArrowLeft, Filter, CheckSquare, Loader2, Play, CheckCircle, X, SortAsc, SortDesc, BrainCircuit, ListFilter
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface RiskManagementProps {
  onBack: () => void;
}

type SortField = 'severity' | 'detectedAt' | 'aiScore';
type SortOrder = 'asc' | 'desc';

export const RiskManagement: React.FC<RiskManagementProps> = ({ onBack }) => {
  const [risks, setRisks] = useState<RiskItem[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  
  const [filterSeverity, setFilterSeverity] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<string>('All');
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

  useEffect(() => {
    loadRisks();
  }, []);

  const loadRisks = async () => {
    setIsLoadingData(true);
    const data = await api.risks.list();
    setRisks(data);
    setIsLoadingData(false);
  };

  const filteredRisks = useMemo(() => {
    return risks.filter(risk => {
      const matchesSeverity = filterSeverity === 'All' || risk.severity === filterSeverity;
      const matchesStatus = filterStatus === 'All' || risk.status === filterStatus;
      return matchesSeverity && matchesStatus;
    });
  }, [risks, filterSeverity, filterStatus]);

  const sortedRisks = useMemo(() => {
    return [...filteredRisks].sort((a, b) => {
      let comparison = 0;
      if (sortField === 'severity') {
        const severityMap = { 'High': 3, 'Medium': 2, 'Low': 1 };
        comparison = severityMap[a.severity] - severityMap[b.severity];
      } else if (sortField === 'detectedAt') {
        comparison = a.detectedAt.localeCompare(b.detectedAt);
      } else if (sortField === 'aiScore') {
        comparison = (a.aiPriorityScore || 0) - (b.aiPriorityScore || 0);
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

  const runRiskAssessment = () => {
    setIsScanning(true);
    setScanProgress(0);
    const steps = ['Connecting to Cloud Integrations...', 'Scanning IAM Policies...', 'Analyzing Logs...', 'Finalizing Report...'];
    let currentStep = 0;
    
    const interval = setInterval(() => {
      currentStep++;
      setScanProgress((prev) => Math.min(prev + 25, 100));
      setScanStep(steps[currentStep] || 'Processing...');

      if (currentStep >= 4) {
        clearInterval(interval);
        setTimeout(async () => {
          setIsScanning(false);
          const newRisk: RiskItem = {
            id: `r-new-${Date.now()}`,
            severity: 'High',
            description: 'Publicly accessible elasticsearch cluster detected.',
            category: 'Infrastructure',
            detectedAt: 'Just now',
            status: 'Open'
          };
          // Persist the new risk
          await api.risks.create(newRisk);
          loadRisks();
          api.audit.log('Risk Assessment Scan Completed', 'System Agent');
        }, 500);
      }
    }, 800);
  };

  const handleAIPrioritization = async () => {
    setIsPrioritizing(true);
    const prioritizedData = await prioritizeRisks(risks);
    
    if (prioritizedData.length > 0) {
      // Update local state and persist
      const updatedRisks = risks.map(risk => {
        const aiData = prioritizedData.find((p: any) => p.id === risk.id);
        if (aiData) {
          const updated = { ...risk, aiPriorityScore: aiData.score, aiRationale: aiData.rationale };
          api.risks.update(updated); // Sync to DB
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
    setAssigneeId(risk.assignedTo || '');
    setNewStatus(risk.status);
    setRemediationPlan(risk.mitigationPlan || null);

    if (!risk.mitigationPlan) {
      setLoadingRemediation(true);
      const plan = await generateRemediationPlan(risk.description);
      setRemediationPlan(plan);
      setLoadingRemediation(false);
    }
  };

  const saveRiskChanges = async () => {
    if (selectedRisk) {
      const assignee = MOCK_USERS.find(u => u.name === assigneeId);
      const updatedRisk: RiskItem = {
        ...selectedRisk,
        status: newStatus,
        assignedTo: assigneeId,
        assignedAvatar: assignee?.avatar,
        mitigationPlan: remediationPlan || undefined
      };
      
      await api.risks.update(updatedRisk);
      await api.audit.log(`Risk ${updatedRisk.id} updated to ${updatedRisk.status}`, 'Admin'); // Use real user in production
      
      setRisks(prev => prev.map(r => r.id === updatedRisk.id ? updatedRisk : r));
      setSelectedRisk(null);
    }
  };

  if (isLoadingData) return <div className="p-8 text-center text-gray-500">Loading risks data from database...</div>;

  return (
    <div className="space-y-6 animate-fadeIn relative pb-20">
      {/* Assessment Overlay */}
      {isScanning && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full text-center">
            <Loader2 className="animate-spin text-brand-600 w-16 h-16 mx-auto mb-6" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Running Risk Assessment</h3>
            <p className="text-gray-500 mb-6">{scanStep}</p>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
              <div 
                className="bg-brand-600 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${scanProgress}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}

      {/* Remediation / Task Modal */}
      {selectedRisk && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[85vh] flex flex-col animate-scaleIn">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-xl">
              <h3 className="text-lg font-bold text-gray-900 flex items-center">
                <CheckSquare className="mr-2 text-brand-600" /> 
                Remediation & Task
              </h3>
              <button onClick={() => setSelectedRisk(null)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              <div className="flex flex-col md:flex-row gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Status</label>
                  <select 
                    value={newStatus} 
                    onChange={(e) => setNewStatus(e.target.value as any)}
                    className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Ignored">Ignored</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Assign To</label>
                  <select 
                    value={assigneeId} 
                    onChange={(e) => setAssigneeId(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="">Unassigned</option>
                    {MOCK_USERS.map(u => (
                      <option key={u.id} value={u.name}>{u.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="p-4 bg-red-50 border border-red-100 rounded-lg">
                <div className="flex justify-between items-start mb-2">
                   <span className="text-xs font-bold text-red-600 uppercase tracking-wide">Target Risk</span>
                   {selectedRisk.aiPriorityScore && (
                     <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded font-bold">AI Priority: {selectedRisk.aiPriorityScore}</span>
                   )}
                </div>
                <p className="font-medium text-gray-900">{selectedRisk.description}</p>
                {selectedRisk.aiRationale && <p className="text-xs text-gray-500 mt-2 italic">"AI Analysis: {selectedRisk.aiRationale}"</p>}
              </div>

              <div>
                <h4 className="font-bold text-gray-900 mb-2">Technical Remediation Plan</h4>
                {loadingRemediation ? (
                  <div className="flex flex-col items-center justify-center py-8 bg-gray-50 rounded-lg">
                     <Loader2 className="animate-spin text-brand-500 mb-4" size={24} />
                     <p className="text-sm text-gray-500">AI is generating step-by-step fix...</p>
                  </div>
                ) : (
                  <div className="prose prose-sm prose-slate max-w-none bg-white border border-gray-200 p-4 rounded-lg">
                    <ReactMarkdown>{remediationPlan || ''}</ReactMarkdown>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-xl flex justify-end space-x-3">
              <button onClick={() => setSelectedRisk(null)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors">Cancel</button>
              <button onClick={saveRiskChanges} className="px-6 py-2 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 transition-colors shadow-lg">Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* Header and Filter sections remain largely same but using real actions */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center space-x-4">
            <button onClick={onBack} className="p-2 hover:bg-gray-200 rounded-lg transition-colors"><ArrowLeft size={20} className="text-gray-600" /></button>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Risk Management</h2>
              <p className="text-sm text-gray-500">Monitor threats, assign tasks, and track mitigation.</p>
            </div>
          </div>
          <div className="flex gap-3">
             <button onClick={handleAIPrioritization} disabled={isPrioritizing} className="bg-purple-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-purple-700 shadow-md flex items-center transition-colors">
              {isPrioritizing ? <Loader2 className="animate-spin mr-2" size={16} /> : <BrainCircuit className="mr-2" size={16} />}
              AI Prioritize
            </button>
            <button onClick={runRiskAssessment} disabled={isScanning} className="bg-brand-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-brand-700 shadow-md flex items-center transition-colors">
              {isScanning ? <Loader2 className="animate-spin mr-2" size={16} /> : <Play className="mr-2" size={16} />}
              Run Scan
            </button>
          </div>
        </div>
      </div>
      
      {/* Table implementation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 font-medium cursor-pointer" onClick={() => handleSort('severity')}>
                   <div className="flex items-center">Severity {sortField === 'severity' && (sortOrder === 'asc' ? <SortAsc size={14}/> : <SortDesc size={14}/>)}</div>
                </th>
                <th className="px-6 py-4 font-medium w-1/3">Description</th>
                <th className="px-6 py-4 font-medium">Assignee</th>
                <th className="px-6 py-4 font-medium cursor-pointer" onClick={() => handleSort('aiScore')}>AI Score</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
               {sortedRisks.map((risk) => (
                  <tr key={risk.id} className="hover:bg-gray-50 group">
                    <td className="px-6 py-4"><span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${risk.severity === 'High' ? 'bg-red-100 text-red-800' : risk.severity === 'Medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}`}>{risk.severity}</span></td>
                    <td className="px-6 py-4"><p className="font-medium text-gray-900 line-clamp-2">{risk.description}</p></td>
                    <td className="px-6 py-4">{risk.assignedTo || <span className="text-gray-400 italic">Unassigned</span>}</td>
                    <td className="px-6 py-4">{risk.aiPriorityScore || '-'}</td>
                    <td className="px-6 py-4">{risk.status}</td>
                    <td className="px-6 py-4 text-right">
                       <button onClick={() => handleOpenRemediation(risk)} className="text-brand-600 font-medium hover:text-brand-800 px-3 py-1.5 border border-brand-200 rounded-lg">Manage</button>
                    </td>
                  </tr>
               ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
