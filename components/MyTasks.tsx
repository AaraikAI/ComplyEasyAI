
import React, { useState, useMemo, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { RiskItem } from '../types';
import { generateRemediationPlan } from '../services/geminiService';
import { 
  CheckSquare, Filter, Loader2, SortAsc, SortDesc, CheckCircle, X
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

type SortField = 'severity' | 'detectedAt' | 'aiScore';
type SortOrder = 'asc' | 'desc';

export const MyTasks: React.FC = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<RiskItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filters
  const [filterSeverity, setFilterSeverity] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  
  // Sorting
  const [sortField, setSortField] = useState<SortField>('severity');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Modal State
  const [selectedTask, setSelectedTask] = useState<RiskItem | null>(null);
  const [newStatus, setNewStatus] = useState<'Open' | 'In Progress' | 'Resolved' | 'Ignored'>('Open');
  const [remediationPlan, setRemediationPlan] = useState<string | null>(null);
  const [loadingRemediation, setLoadingRemediation] = useState(false);

  useEffect(() => {
    loadTasks();
  }, [user]);

  const loadTasks = async () => {
    setIsLoading(true);
    const allRisks = await api.risks.list();
    // Filter tasks assigned to current user
    const myTasks = allRisks.filter(r => r.assignedTo === user?.name);
    setTasks(myTasks);
    setIsLoading(false);
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesSeverity = filterSeverity === 'All' || task.severity === filterSeverity;
      const matchesStatus = filterStatus === 'All' || task.status === filterStatus;
      return matchesSeverity && matchesStatus;
    });
  }, [tasks, filterSeverity, filterStatus]);

  const sortedTasks = useMemo(() => {
    return [...filteredTasks].sort((a, b) => {
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
  }, [filteredTasks, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const handleOpenTask = async (task: RiskItem) => {
    setSelectedTask(task);
    setNewStatus(task.status);
    setRemediationPlan(task.mitigationPlan || null);

    if (!task.mitigationPlan) {
      setLoadingRemediation(true);
      const plan = await generateRemediationPlan(task.description);
      setRemediationPlan(plan);
      setLoadingRemediation(false);
    }
  };

  const handleSaveTask = async () => {
    if (selectedTask) {
      const updatedTask: RiskItem = {
        ...selectedTask,
        status: newStatus,
        mitigationPlan: remediationPlan || undefined
      };
      
      await api.risks.update(updatedTask);
      await api.audit.log(`Task ${updatedTask.id} status updated to ${newStatus}`, user?.name || 'User');
      
      setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
      setSelectedTask(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center text-gray-500">
        <Loader2 className="animate-spin mr-2" /> Loading your tasks...
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">My Tasks</h2>
          <p className="text-sm text-gray-500">Manage compliance risks assigned to you.</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-gray-400" />
          <span className="text-sm font-medium text-gray-700">Filter:</span>
        </div>
        
        <select 
          value={filterSeverity} 
          onChange={(e) => setFilterSeverity(e.target.value)}
          className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg p-2 focus:ring-2 focus:ring-brand-500 outline-none"
        >
          <option value="All">All Severities</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>

        <select 
          value={filterStatus} 
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg p-2 focus:ring-2 focus:ring-brand-500 outline-none"
        >
          <option value="All">All Statuses</option>
          <option value="Open">Open</option>
          <option value="In Progress">In Progress</option>
          <option value="Resolved">Resolved</option>
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {sortedTasks.length === 0 ? (
          <div className="p-12 text-center">
             <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
               <CheckCircle className="text-green-500" size={32} />
             </div>
             <h3 className="text-lg font-bold text-gray-900">All Caught Up!</h3>
             <p className="text-gray-500 mt-2">No tasks matching your criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 font-medium cursor-pointer hover:text-brand-600" onClick={() => handleSort('severity')}>
                    <div className="flex items-center">Severity {sortField === 'severity' && (sortOrder === 'asc' ? <SortAsc size={14}/> : <SortDesc size={14}/>)}</div>
                  </th>
                  <th className="px-6 py-4 font-medium w-1/3">Description</th>
                  <th className="px-6 py-4 font-medium cursor-pointer hover:text-brand-600" onClick={() => handleSort('detectedAt')}>
                    <div className="flex items-center">Detected {sortField === 'detectedAt' && (sortOrder === 'asc' ? <SortAsc size={14}/> : <SortDesc size={14}/>)}</div>
                  </th>
                  <th className="px-6 py-4 font-medium cursor-pointer hover:text-brand-600" onClick={() => handleSort('aiScore')}>
                    <div className="flex items-center">AI Score {sortField === 'aiScore' && (sortOrder === 'asc' ? <SortAsc size={14}/> : <SortDesc size={14}/>)}</div>
                  </th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sortedTasks.map((task) => (
                  <tr key={task.id} className="hover:bg-gray-50 group">
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                        task.severity === 'High' ? 'bg-red-100 text-red-800' : 
                        task.severity === 'Medium' ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {task.severity}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900 line-clamp-2">{task.description}</p>
                      <p className="text-xs text-gray-500 mt-1">{task.category}</p>
                    </td>
                    <td className="px-6 py-4 text-gray-500">{task.detectedAt}</td>
                    <td className="px-6 py-4">
                      {task.aiPriorityScore ? (
                        <span className="text-purple-700 font-bold">{task.aiPriorityScore}</span>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                       <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                         task.status === 'Resolved' ? 'bg-green-100 text-green-800' :
                         task.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                         task.status === 'Ignored' ? 'bg-gray-100 text-gray-800' :
                         'bg-red-50 text-red-700'
                       }`}>
                         {task.status}
                       </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleOpenTask(task)} 
                        className="text-brand-600 font-medium hover:text-brand-800 px-3 py-1.5 border border-brand-200 rounded-lg bg-white hover:bg-brand-50 transition-colors"
                      >
                        Action
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Task Modal */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-60 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col animate-scaleIn">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-xl">
              <h3 className="text-lg font-bold text-gray-900 flex items-center">
                <CheckSquare className="mr-2 text-brand-600" /> 
                Update Task
              </h3>
              <button onClick={() => setSelectedTask(null)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="font-medium text-gray-900">{selectedTask.description}</p>
                <div className="flex gap-4 mt-2 text-sm text-gray-500">
                  <span>Detected: {selectedTask.detectedAt}</span>
                  <span>Category: {selectedTask.category}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Update Status</label>
                <div className="flex gap-2">
                  {['Open', 'In Progress', 'Resolved', 'Ignored'].map((status) => (
                    <button
                      key={status}
                      onClick={() => setNewStatus(status as any)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        newStatus === status 
                          ? 'bg-brand-600 text-white shadow-md' 
                          : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-bold text-gray-900 mb-2">AI Remediation Plan</h4>
                {loadingRemediation ? (
                  <div className="flex flex-col items-center justify-center py-8 bg-gray-50 rounded-lg">
                     <Loader2 className="animate-spin text-brand-500 mb-4" size={24} />
                     <p className="text-sm text-gray-500">Generating step-by-step fix...</p>
                  </div>
                ) : (
                  <div className="prose prose-sm prose-slate max-w-none bg-white border border-gray-200 p-4 rounded-lg">
                    <ReactMarkdown>{remediationPlan || ''}</ReactMarkdown>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-xl flex justify-end space-x-3">
              <button onClick={() => setSelectedTask(null)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors">Cancel</button>
              <button onClick={handleSaveTask} className="px-6 py-2 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 transition-colors shadow-lg">Save Update</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
