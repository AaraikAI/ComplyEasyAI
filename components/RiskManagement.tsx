
import React, { useState, useMemo } from 'react';
import { MOCK_RISKS, MOCK_USERS } from '../constants';
import { generateRemediationPlan, prioritizeRisks } from '../services/geminiService';
import { RiskItem, User } from '../types';
import { 
  ArrowLeft, 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  Filter, 
  CheckSquare, 
  Loader2, 
  Play, 
  CheckCircle, 
  X, 
  SortAsc, 
  SortDesc,
  User as UserIcon,
  BrainCircuit,
  ListFilter
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface RiskManagementProps {
  onBack: () => void;
}

type SortField = 'severity' | 'detectedAt' | 'aiScore';
type SortOrder = 'asc' | 'desc';

export const RiskManagement: React.FC<RiskManagementProps> = ({ onBack }) => {
  // State
  const [risks, setRisks] = useState<RiskItem[]>(MOCK_RISKS.map(r => ({...r, status: 'Open'}))); // Initialize with status
  
  // Filtering & Sorting State
  const [filterSeverity, setFilterSeverity] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [sortField, setSortField] = useState<SortField>('severity');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  
  // AI State
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStep, setScanStep] = useState('');
  const [isPrioritizing, setIsPrioritizing] = useState(false);

  // Remediation / Editing State
  const [selectedRisk, setSelectedRisk] = useState<RiskItem | null>(null);
  const [remediationPlan, setRemediationPlan] = useState<string | null>(null);
  const [loadingRemediation, setLoadingRemediation] = useState(false);
  const [assigneeId, setAssigneeId] = useState<string>('');
  const [newStatus, setNewStatus] = useState<'Open' | 'In Progress' | 'Resolved' | 'Ignored'>('Open');

  // Computed Values
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
        // Simplified mock date sort - in production use real Date objects
        comparison = a.detectedAt.localeCompare(b.detectedAt);
      } else if (sortField === 'aiScore') {
        comparison = (a.aiPriorityScore || 0) - (b.aiPriorityScore || 0);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [filteredRisks, sortField, sortOrder]);

  // Actions
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
    const steps = ['Connecting to Cloud Integrations...', 'Scanning IAM Policies...', 'Analyzing Logs...', 'Checking Vulnerability Databases...', 'Finalizing Report...'];
    
    let currentStep = 0;
    const interval = setInterval(() => {
      currentStep++;
      setScanProgress((prev) => Math.min(prev + 20, 100));
      setScanStep(steps[currentStep] || 'Processing...');

      if (currentStep >= 5) {
        clearInterval(interval);
        setTimeout(() => {
          setIsScanning(false);
          const newRisk: RiskItem = {
            id: `r-new-${Date.now()}`,
            severity: 'High',
            description: 'Publicly accessible elasticsearch cluster detected.',
            category: 'Infrastructure',
            detectedAt: 'Just now',
            status: 'Open'
          };
          setRisks(prev => [newRisk, ...prev]);
        }, 500);
      }
    }, 800);
  };

  const handleAIPrioritization = async () => {
    setIsPrioritizing(true);
    const prioritizedData = await prioritizeRisks(risks);
    
    if (prioritizedData.length > 0) {
      setRisks(prev => prev.map(risk => {
        const aiData = prioritizedData.find((p: any) => p.id === risk.id);
        if (aiData) {
          return { ...risk, aiPriorityScore: aiData.score, aiRationale: aiData.rationale };
        }
        return risk;
      }));
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

  const saveRiskChanges = () => {
    if (selectedRisk) {
      setRisks(prev => prev.map(r => {
        if (r.id === selectedRisk.id) {
          const assignee = MOCK_USERS.find(u => u.name === assigneeId); // Simple name match for mock
          return {
            ...r,
            status: newStatus,
            assignedTo: assigneeId,
            assignedAvatar: assignee?.avatar,
            mitigationPlan: remediationPlan || undefined
          };
        }
        return r;
      }));
      setSelectedRisk(null);
    }
  };

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
              {/* Status & Assignment Bar */}
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
                    <option value="Ignored">Ignored (Risk Accepted)</option>
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

              {/* Risk Details */}
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

              {/* Remediation Plan */}
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
              <button 
                onClick={() => setSelectedRisk(null)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={saveRiskChanges}
                className="px-6 py-2 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 transition-colors shadow-lg shadow-brand-500/30"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header Area */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center space-x-4">
            <button 
              onClick={onBack}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} className="text-gray-600" />
            </button>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Risk Management</h2>
              <p className="text-sm text-gray-500">Monitor threats, assign tasks, and track mitigation.</p>
            </div>
          </div>
          <div className="flex gap-3">
             <button 
              onClick={handleAIPrioritization}
              disabled={isPrioritizing}
              className="bg-purple-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-purple-700 shadow-md flex items-center transition-colors"
            >
              {isPrioritizing ? <Loader2 className="animate-spin mr-2" size={16} /> : <BrainCircuit className="mr-2" size={16} />}
              AI Prioritize
            </button>
            <button 
              onClick={runRiskAssessment}
              disabled={isScanning}
              className="bg-brand-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-brand-700 shadow-md flex items-center transition-colors"
            >
              {isScanning ? <Loader2 className="animate-spin mr-2" size={16} /> : <Play className="mr-2" size={16} />}
              Run Scan
            </button>
          </div>
        </div>

        {/* Filters and Controls */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between">
           <div className="flex flex-wrap gap-4 w-full md:w-auto">
              {/* Severity Filter */}
              <div className="relative">
                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Filter size={14} />
                 </div>
                 <select 
                    value={filterSeverity} 
                    onChange={(e) => setFilterSeverity(e.target.value)}
                    className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                 >
                    <option value="All">All Severities</option>
                    <option value="High">High Only</option>
                    <option value="Medium">Medium Only</option>
                    <option value="Low">Low Only</option>
                 </select>
              </div>

              {/* Status Filter */}
              <div className="relative">
                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <ListFilter size={14} />
                 </div>
                 <select 
                    value={filterStatus} 
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                 >
                    <option value="All">All Statuses</option>
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                 </select>
              </div>
           </div>

           <div className="flex items-center text-sm text-gray-500 space-x-2 w-full md:w-auto justify-end">
              <span>{filteredRisks.length} Risks found</span>
           </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 font-medium cursor-pointer hover:text-gray-700 group" onClick={() => handleSort('severity')}>
                   <div className="flex items-center">
                     Severity
                     {sortField === 'severity' && (sortOrder === 'asc' ? <SortAsc size={14} className="ml-1"/> : <SortDesc size={14} className="ml-1"/>)}
                   </div>
                </th>
                <th className="px-6 py-4 font-medium w-1/3">Description</th>
                <th className="px-6 py-4 font-medium">Assignee</th>
                <th className="px-6 py-4 font-medium cursor-pointer hover:text-gray-700" onClick={() => handleSort('aiScore')}>
                   <div className="flex items-center">
                     <BrainCircuit size={14} className="mr-1 text-purple-500"/> AI Score
                     {sortField === 'aiScore' && (sortOrder === 'asc' ? <SortAsc size={14} className="ml-1"/> : <SortDesc size={14} className="ml-1"/>)}
                   </div>
                </th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
               {sortedRisks.length > 0 ? sortedRisks.map((risk) => (
                  <tr key={risk.id} className="hover:bg-gray-50 group transition-colors">
                    <td className="px-6 py-4">
                       <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                         risk.severity === 'High' ? 'bg-red-100 text-red-800' : 
                         risk.severity === 'Medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
                       }`}>
                         {risk.severity}
                       </span>
                    </td>
                    <td className="px-6 py-4">
                       <p className="font-medium text-gray-900 line-clamp-2" title={risk.description}>{risk.description}</p>
                       <span className="text-xs text-gray-400 mt-1">{risk.category} • {risk.detectedAt}</span>
                    </td>
                    <td className="px-6 py-4">
                       {risk.assignedTo ? (
                          <div className="flex items-center" title={risk.assignedTo}>
                             <div className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-bold mr-2">
                                {risk.assignedAvatar || risk.assignedTo.charAt(0)}
                             </div>
                             <span className="truncate max-w-[100px]">{risk.assignedTo}</span>
                          </div>
                       ) : (
                          <span className="text-gray-400 text-xs italic">Unassigned</span>
                       )}
                    </td>
                    <td className="px-6 py-4">
                       {risk.aiPriorityScore ? (
                          <div className="flex items-center">
                             <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs mr-2 border-2 ${
                                risk.aiPriorityScore > 75 ? 'border-red-500 text-red-700 bg-red-50' : 'border-purple-300 text-purple-700 bg-purple-50'
                             }`}>
                                {risk.aiPriorityScore}
                             </div>
                          </div>
                       ) : (
                          <span className="text-gray-300">-</span>
                       )}
                    </td>
                    <td className="px-6 py-4">
                       <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          risk.status === 'Resolved' ? 'bg-green-100 text-green-700' : 
                          risk.status === 'In Progress' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                       }`}>
                          {risk.status}
                       </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <button 
                          onClick={() => handleOpenRemediation(risk)}
                          className="text-brand-600 font-medium hover:text-brand-800 px-3 py-1.5 rounded-lg hover:bg-brand-50 transition-colors text-xs border border-brand-200"
                       >
                          Manage
                       </button>
                    </td>
                  </tr>
               )) : (
                 <tr>
                   <td colSpan={6} className="px-6 py-12 text-center">
                     <div className="flex flex-col items-center justify-center text-gray-400">
                        <CheckCircle size={48} className="mb-2 text-green-100" />
                        <p className="font-medium text-gray-500">No risks match your criteria.</p>
                     </div>
                   </td>
                 </tr>
               )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
