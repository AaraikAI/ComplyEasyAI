
import React, { useState, useEffect } from 'react';
import { AVAILABLE_FRAMEWORKS } from '../constants';
import { ComplianceFramework, ComplianceStatus } from '../types';
import { CheckCircle, AlertTriangle, Clock, ArrowRight, Plus, X, Search, Trash2, Download } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface FrameworksProps {
  activeFrameworks: ComplianceFramework[];
  onAddFramework: (name: string, region?: string) => void;
  onSelectFramework: (id: string) => void;
  onFrameworkDeleted?: () => void;
}

export const Frameworks: React.FC<FrameworksProps> = ({ activeFrameworks, onAddFramework, onSelectFramework, onFrameworkDeleted }) => {
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingFramework, setDeletingFramework] = useState<string | null>(null);

  // Check if we need to navigate to a specific control (from Red Team)
  useEffect(() => {
    const controlId = sessionStorage.getItem('navigateToControl');
    const controlName = sessionStorage.getItem('navigateToControlName');
    if (controlId && controlName && activeFrameworks.length > 0) {
      // Find the framework that contains this control
      const findFrameworkWithControl = async () => {
        for (const fw of activeFrameworks) {
          try {
            const fwData: any = await api.frameworks.getById(fw.id);
            const control = fwData.controls?.find((c: any) => c.id === controlId);
            if (control) {
              // Found the framework, navigate to it
              sessionStorage.removeItem('navigateToControl');
              sessionStorage.removeItem('navigateToControlName');
              onSelectFramework(fw.id);
              // Scroll to control after a brief delay
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
      // Generate CSV report with all frameworks and their controls
      const csvRows: string[] = [];
      
      // Header row
      csvRows.push('Framework,Control ID,Control Name,Status,Progress,Next Audit Date,Region');
      
      // Data rows
      for (const fw of activeFrameworks) {
        try {
          const fwData: any = await api.frameworks.getById(fw.id);
          const controls = fwData.controls || [];
          
          if (controls.length === 0) {
            // If no controls, still add framework info
            csvRows.push(`"${fw.name}","","","${fw.status}","${fw.progress}%","${fw.nextAuditDate}","${fw.region || ''}"`);
          } else {
            // Add each control as a row
            controls.forEach((control: any) => {
              csvRows.push(
                `"${fw.name}","${control.id || ''}","${(control.name || '').replace(/"/g, '""')}","${control.status || ''}","${fw.progress}%","${fw.nextAuditDate}","${fw.region || ''}"`
              );
            });
          }
        } catch (error) {
          console.error(`Error fetching framework ${fw.id}:`, error);
          // Add framework row even if controls can't be fetched
          csvRows.push(`"${fw.name}","","Error loading controls","${fw.status}","${fw.progress}%","${fw.nextAuditDate}","${fw.region || ''}"`);
        }
      }
      
      // Create and download CSV file
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
      
      // Clean up
      URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error('Failed to export control report:', error);
      alert(`Failed to export control report: ${error.message || 'Unknown error'}`);
    }
  };

  const availableToAdd = AVAILABLE_FRAMEWORKS.filter(
    af => !activeFrameworks.find(active => active.name === af.name)
  );

  const filteredAvailable = availableToAdd.filter(f => 
    f.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    f.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
           <h2 className="text-lg font-bold text-gray-900">Active Frameworks</h2>
           <p className="text-sm text-gray-500">Monitor and manage your compliance standards.</p>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={handleExportControlReport}
            className="flex items-center space-x-2 bg-white text-brand-600 border border-brand-200 px-4 py-2 rounded-lg hover:bg-brand-50 transition-colors shadow-sm"
            title="Export Control Report"
          >
            <Download size={18} />
            <span>Export</span>
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center space-x-2 bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 transition-colors shadow-sm"
          >
            <Plus size={18} />
            <span>Add Framework</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activeFrameworks.map((fw) => (
          <div key={fw.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{fw.name}</h3>
                  {fw.region && <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{fw.region}</span>}
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
        ))}
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center p-6 text-center cursor-pointer hover:border-brand-300 hover:bg-brand-50 transition-colors group h-full min-h-[200px]"
        >
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-3 shadow-sm group-hover:scale-110 transition-transform">
            <Plus className="text-gray-400 group-hover:text-brand-500" size={24} />
          </div>
          <h3 className="text-sm font-bold text-gray-900">Add Framework</h3>
          <p className="text-xs text-gray-500 mt-1">Browse catalog...</p>
        </button>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] flex flex-col shadow-2xl animate-fadeIn">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">Add Compliance Framework</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-4 border-b border-gray-100 bg-gray-50">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Search standards (e.g. NIST, ISO)..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {filteredAvailable.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No matching frameworks found.</p>
              ) : (
                filteredAvailable.map((fw, idx) => (
                  <div key={idx} className="flex justify-between items-center p-4 border border-gray-200 rounded-lg hover:border-brand-200 hover:bg-brand-50 transition-colors">
                    <div>
                      <h4 className="font-bold text-gray-900">{fw.name}</h4>
                      <p className="text-sm text-gray-500">{fw.description}</p>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded mt-1 inline-block">{fw.region}</span>
                    </div>
                    <button 
                      onClick={() => {
                        onAddFramework(fw.name, fw.region);
                        setIsModalOpen(false);
                      }}
                      className="bg-white text-brand-600 border border-brand-200 hover:bg-brand-600 hover:text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      Add
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
