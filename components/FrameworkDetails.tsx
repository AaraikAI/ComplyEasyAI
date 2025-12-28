import React, { useState, useEffect, useRef } from 'react';
import { ComplianceFramework, ComplianceStatus, ViewState } from '../types';
import { ArrowLeft, CheckCircle, Circle, FileText, Upload, AlertTriangle, Loader2, Download, Plus, X, Trash2 } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface FrameworkControl {
  id: string;
  name: string;
  description?: string;
  status: string;
  evidence?: string;
  createdAt: string;
  updatedAt: string;
}

interface FrameworkDetailsProps {
  framework: ComplianceFramework | undefined;
  onBack: () => void;
  onDataChanged?: () => void; // Callback to refresh parent data
}

export const FrameworkDetails: React.FC<FrameworkDetailsProps> = ({ framework, onBack, onDataChanged }) => {
  const { user } = useAuth();
  const [controls, setControls] = useState<FrameworkControl[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [readinessScore, setReadinessScore] = useState(0);
  const [analyzingFile, setAnalyzingFile] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [exportingControl, setExportingControl] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [showAddControl, setShowAddControl] = useState(false);
  const [uploadingControl, setUploadingControl] = useState<string | null>(null);
  const [deletingControl, setDeletingControl] = useState<string | null>(null);
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  const smartUploadRef = useRef<HTMLInputElement>(null);

  // Helper to set file input ref for a control
  const setFileInputRef = (controlId: string) => (element: HTMLInputElement | null) => {
    if (element) {
      fileInputRefs.current[controlId] = element;
    }
  };

  // New control form state
  const [newControl, setNewControl] = useState({
    name: '',
    description: '',
    status: 'Pending',
  });

  useEffect(() => {
    if (framework) {
      loadFrameworkDetails();
    }
  }, [framework]);

  // Check if we need to scroll to a specific control (from Red Team navigation)
  useEffect(() => {
    const controlId = sessionStorage.getItem('navigateToControl');
    if (controlId && controls.length > 0) {
      const control = controls.find(c => c.id === controlId);
      if (control) {
        // Clear the navigation flag
        sessionStorage.removeItem('navigateToControl');
        sessionStorage.removeItem('navigateToControlName');
        // Scroll to the control after a brief delay
        setTimeout(() => {
          const controlElement = document.getElementById(`control-${controlId}`);
          if (controlElement) {
            controlElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            controlElement.classList.add('ring-2', 'ring-blue-500', 'bg-blue-50');
            setTimeout(() => {
              controlElement.classList.remove('ring-2', 'ring-blue-500', 'bg-blue-50');
            }, 3000);
          }
        }, 500);
      }
    }
  }, [controls]);

  const loadFrameworkDetails = async () => {
    if (!framework?.id) return;
    
    try {
      setIsLoading(true);
      const frameworkData: any = await api.frameworks.getById(framework.id);
      
      // Extract controls from framework data
      const frameworkControls = frameworkData.controls || [];
      setControls(frameworkControls);
      
      // Calculate readiness score dynamically from control statuses
      const calculateReadinessScore = () => {
        if (frameworkControls.length === 0) return 0;
        
        const compliantCount = frameworkControls.filter((c: FrameworkControl) => 
          c.status === 'Implemented' || c.status === 'Compliant'
        ).length;
        
        return Math.round((compliantCount / frameworkControls.length) * 100);
      };
      
      setReadinessScore(calculateReadinessScore());
    } catch (error) {
      console.error('Failed to load framework details:', error);
      setControls([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSmartUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !framework?.id) return;

    try {
      setAnalyzingFile(file.name);
      setAnalysisResult(null);

      const formData = new FormData();
      formData.append('file', file);

      const response = await api.frameworks.smartUpload(framework.id, formData);

      setAnalysisResult(response.classification);
      
      // Reload controls to show the new/updated control
      await loadFrameworkDetails();
      // Notify parent to refresh data
      if (onDataChanged) {
        onDataChanged();
      }

      // Show success message
      setTimeout(() => {
        setAnalysisResult(null);
        setAnalyzingFile(null);
      }, 3000);
    } catch (error: any) {
      console.error('Smart upload failed:', error);
      setAnalysisResult(`Error: ${error.message || 'Failed to upload file'}`);
      setAnalyzingFile(null);
    } finally {
      if (smartUploadRef.current) {
        smartUploadRef.current.value = '';
      }
    }
  };

  const handleUploadEvidence = async (controlId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !framework?.id) {
      // Reset the input if no file selected
      const input = fileInputRefs.current[controlId];
      if (input) {
        input.value = '';
      }
      return;
    }

    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      alert(`File size exceeds the maximum limit of 50MB. Please select a smaller file.`);
      const input = fileInputRefs.current[controlId];
      if (input) {
        input.value = '';
      }
      return;
    }

    try {
      setUploadingControl(controlId);

      const formData = new FormData();
      formData.append('file', file);

      const result = await api.frameworks.uploadEvidence(framework.id, controlId, formData);

      // Show success message
      console.log('Evidence uploaded successfully:', result);

      // Reload controls to show updated evidence
      await loadFrameworkDetails();
      // Notify parent to refresh data
      if (onDataChanged) {
        onDataChanged();
      }

      // Show success notification
      const control = controls.find(c => c.id === controlId);
      if (control) {
        setUploadSuccess(`Evidence uploaded successfully for "${control.name}"`);
        setTimeout(() => {
          setUploadSuccess(null);
        }, 5000);
      }
    } catch (error: any) {
      console.error('Evidence upload failed:', error);
      const errorMessage = error.message || error.error || 'Unknown error';
      alert(`Failed to upload evidence: ${errorMessage}\n\nPlease ensure:\n- You have the necessary permissions (admin/editor role)\n- The file format is supported\n- The file size is under 50MB`);
    } finally {
      setUploadingControl(null);
      const input = fileInputRefs.current[controlId];
      if (input) {
        input.value = '';
      }
    }
  };

  const handleCreateControl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!framework?.id || !newControl.name.trim()) return;

    try {
      // Prepare control data - only include description if it's not empty
      const controlData: { name: string; description?: string; status: string } = {
        name: newControl.name.trim(),
        status: newControl.status || 'Pending',
      };
      
      // Only include description if it has a value
      if (newControl.description && newControl.description.trim()) {
        controlData.description = newControl.description.trim();
      }

      await api.frameworks.createControl(framework.id, controlData);
      setNewControl({ name: '', description: '', status: 'Pending' });
      setShowAddControl(false);
      await loadFrameworkDetails();
      // Notify parent to refresh data
      if (onDataChanged) {
        onDataChanged();
      }
    } catch (error: any) {
      console.error('Failed to create control:', error);
      const errorMessage = error.message || error.error || 'Unknown error';
      alert(`Failed to create control: ${errorMessage}`);
    }
  };

  const handleUpdateControlStatus = async (control: FrameworkControl, newStatus: string) => {
    if (!framework?.id) return;

    try {
      await api.frameworks.updateControl(framework.id, control.id, { status: newStatus });
      await loadFrameworkDetails();
      // Notify parent to refresh data
      if (onDataChanged) {
        onDataChanged();
      }
    } catch (error: any) {
      console.error('Failed to update control status:', error);
      alert(`Failed to update control status: ${error.message || 'Unknown error'}`);
    }
  };

  const handleControlClick = (control: FrameworkControl) => {
    // Allow status updates for all controls except "Compliant" (final state)
    if (control.status !== 'Compliant') {
      const statusOptions = ['Pending', 'In Progress', 'Implemented', 'Compliant', 'At Risk'];
      const currentIndex = statusOptions.indexOf(control.status);
      const nextStatus = statusOptions[currentIndex + 1] || statusOptions[0];
      
      if (confirm(`Update "${control.name}" status from "${control.status}" to "${nextStatus}"?`)) {
        handleUpdateControlStatus(control, nextStatus);
      }
    } else {
      // For Compliant controls, allow going back to Implemented if needed
      if (confirm(`Update "${control.name}" status from "Compliant" to "Implemented"?`)) {
        handleUpdateControlStatus(control, 'Implemented');
      }
    }
  };

  const handleDeleteControl = async (control: FrameworkControl) => {
    if (!framework?.id) return;
    
    if (!confirm(`Are you sure you want to delete control "${control.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setDeletingControl(control.id);
      await api.frameworks.deleteControl(framework.id, control.id);
      await loadFrameworkDetails();
      if (onDataChanged) {
        onDataChanged();
      }
    } catch (error: any) {
      console.error('Failed to delete control:', error);
      alert(`Failed to delete control: ${error.message || 'Unknown error'}`);
    } finally {
      setDeletingControl(null);
    }
  };

  const handleExportControl = async (control: FrameworkControl) => {
    if (!framework?.id) return;
    
    try {
      setExportingControl(control.id);
      
      // Call export API endpoint
      const response = await api.frameworks.exportControl(framework.id, control.id);
      
      // Create a blob and download
      const blob = new Blob([JSON.stringify(response, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${control.name.replace(/\s+/g, '_')}_Report_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to export control:', error);
      alert('Failed to export control report. Please try again.');
    } finally {
      setExportingControl(null);
    }
  };

  const getStatusIcon = (status: string) => {
    if (status === 'Compliant' || status === 'Implemented') {
      return <CheckCircle size={20} className="text-green-500" />;
    } else if (status === 'At Risk' || status === 'Failed') {
      return <AlertTriangle size={20} className="text-red-500" />;
    } else {
      return <Circle size={20} className="text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    if (status === 'Compliant' || status === 'Implemented') {
      return 'text-green-500';
    } else if (status === 'At Risk' || status === 'Failed') {
      return 'text-red-500';
    } else {
      return 'text-yellow-500';
    }
  };

  if (!framework) return <div>Framework not found</div>;

  return (
    <div className="space-y-6 animate-fadeIn">
      <button 
        onClick={() => {
          // Refresh parent data before going back
          if (onDataChanged) {
            onDataChanged();
          }
          onBack();
        }}
        className="flex items-center text-gray-500 hover:text-gray-800 transition-colors"
      >
        <ArrowLeft size={18} className="mr-2" />
        Back to Frameworks
      </button>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">{framework.name}</h2>
            <div className="flex items-center space-x-2">
              <span className={`px-2.5 py-0.5 rounded-full text-sm font-medium ${
                framework.status === ComplianceStatus.COMPLIANT ? 'bg-green-100 text-green-800' :
                framework.status === ComplianceStatus.AT_RISK ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
              }`}>
                {framework.status}
              </span>
              <span className="text-gray-400">•</span>
              <span className="text-gray-500 text-sm">Next Audit: {framework.nextAuditDate}</span>
            </div>
          </div>
          <div className="mt-4 md:mt-0 text-right">
             <div className="text-3xl font-bold text-brand-600">{readinessScore}%</div>
             <div className="text-sm text-gray-400">Readiness Score</div>
          </div>
        </div>

        <div className="mt-8 w-full bg-gray-100 rounded-full h-3">
          <div 
            className="bg-brand-500 h-3 rounded-full transition-all duration-1000" 
            style={{ width: `${readinessScore}%` }}
          ></div>
        </div>
      </div>

      {/* AI Analysis Result Toast */}
      {analysisResult && (
        <div className={`p-4 rounded-lg flex items-center justify-between animate-fadeIn ${
          analysisResult.startsWith('Error:') 
            ? 'bg-red-50 border border-red-200 text-red-800' 
            : 'bg-blue-50 border border-blue-200 text-blue-800'
        }`}>
           <span className="font-medium">
             {analysisResult.startsWith('Error:') 
               ? analysisResult 
               : `AI Analysis: File likely maps to "${analysisResult}"`}
           </span>
           <button onClick={() => setAnalysisResult(null)} className="hover:opacity-70">
             <X size={16}/>
           </button>
        </div>
      )}

      {/* Upload Success Toast */}
      {uploadSuccess && (
        <div className="p-4 rounded-lg flex items-center justify-between animate-fadeIn bg-green-50 border border-green-200 text-green-800">
          <span className="font-medium flex items-center">
            <CheckCircle size={16} className="mr-2" />
            {uploadSuccess}
          </span>
          <button onClick={() => setUploadSuccess(null)} className="hover:opacity-70">
            <X size={16}/>
          </button>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
          <h3 className="font-semibold text-gray-800">Controls & Evidence</h3>
          <div className="flex space-x-2">
            <button
              onClick={() => setShowAddControl(!showAddControl)}
              className="text-sm bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-200 flex items-center shadow-sm"
            >
              <Plus size={14} className="mr-2" />
              Add Control
            </button>
            <button 
              onClick={() => smartUploadRef.current?.click()}
              disabled={!!analyzingFile}
              className="text-sm bg-brand-600 text-white px-3 py-1.5 rounded-lg hover:bg-brand-700 flex items-center shadow-sm disabled:opacity-50"
            >
              {analyzingFile ? <Loader2 className="animate-spin mr-2" size={14}/> : <Upload className="mr-2" size={14}/>}
              {analyzingFile ? 'AI Analyzing...' : 'Smart Upload'}
            </button>
            <input
              ref={smartUploadRef}
              type="file"
              onChange={handleSmartUpload}
              className="hidden"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.json,.png,.jpg,.jpeg"
            />
          </div>
        </div>

        {/* Add Control Form */}
        {showAddControl && (
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
            <form onSubmit={handleCreateControl} className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input
                  type="text"
                  value={newControl.name}
                  onChange={(e) => setNewControl({ ...newControl, name: e.target.value })}
                  placeholder="Control Name *"
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                  required
                />
                <select
                  value={newControl.status}
                  onChange={(e) => setNewControl({ ...newControl, status: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                >
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Implemented">Implemented</option>
                  <option value="Compliant">Compliant</option>
                  <option value="At Risk">At Risk</option>
                </select>
                <div className="flex space-x-2">
                  <button
                    type="submit"
                    className="flex-1 bg-brand-600 text-white px-3 py-2 rounded-lg hover:bg-brand-700 transition-colors"
                  >
                    Create
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddControl(false);
                      setNewControl({ name: '', description: '', status: 'Pending' });
                    }}
                    className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
              <textarea
                value={newControl.description}
                onChange={(e) => setNewControl({ ...newControl, description: e.target.value })}
                placeholder="Description (optional)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                rows={2}
              />
            </form>
          </div>
        )}

        <div className="divide-y divide-gray-100">
          {isLoading ? (
            <div className="p-8 text-center">
              <Loader2 className="animate-spin mx-auto mb-2 text-brand-600" size={24} />
              <p className="text-gray-500">Loading controls...</p>
            </div>
          ) : controls.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <FileText className="mx-auto mb-2 text-gray-400" size={32} />
              <p className="mb-4">No controls found for this framework.</p>
              <button
                onClick={() => setShowAddControl(true)}
                className="text-brand-600 hover:text-brand-700 font-medium"
              >
                Add your first control
              </button>
            </div>
          ) : (
            controls.map((control) => (
              <div 
                key={control.id}
                id={`control-${control.id}`}
                className={`p-4 transition-colors flex items-center justify-between group ${
                  control.status !== 'Compliant'
                    ? 'hover:bg-brand-50 cursor-pointer border-l-4 border-transparent hover:border-brand-500'
                    : 'hover:bg-gray-50 cursor-pointer'
                }`}
                onClick={() => handleControlClick(control)}
              >
                <div className="flex items-start space-x-4 flex-1">
                  <div className={`mt-1 ${getStatusColor(control.status)}`}>
                    {getStatusIcon(control.status)}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{control.name}</h4>
                    {control.description && (
                      <p className="text-sm text-gray-600 mt-1">{control.description}</p>
                    )}
                    <p className="text-sm text-gray-500 flex items-center mt-1">
                      <FileText size={14} className="mr-1" />
                      {control.evidence ? (
                        <a href={control.evidence} target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">
                          {control.evidence.split('/').pop()}
                        </a>
                      ) : (
                        'No evidence uploaded'
                      )}
                    </p>
                    <div className="flex items-center space-x-2 mt-2">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                        control.status === 'Compliant' || control.status === 'Implemented' 
                          ? 'bg-green-100 text-green-700' 
                          : control.status === 'At Risk' || control.status === 'Failed'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {control.status}
                      </span>
                      {control.status !== 'Compliant' && (
                        <span className="text-xs text-gray-500 italic">Click to update status</span>
                      )}
                      {control.status === 'Compliant' && (
                        <span className="text-xs text-green-600 italic">✓ Fully compliant</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                  {(user?.role === 'admin' || user?.role === 'editor') && (
                    <button 
                      onClick={() => handleDeleteControl(control)}
                      disabled={deletingControl === control.id}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Delete Control"
                    >
                      {deletingControl === control.id ? (
                        <Loader2 className="animate-spin" size={18} />
                      ) : (
                        <Trash2 size={18} />
                      )}
                    </button>
                  )}
                  <div className="flex flex-col items-center">
                    <button 
                      onClick={() => handleExportControl(control)}
                      disabled={exportingControl === control.id}
                      className="p-2 text-gray-400 hover:text-brand-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Export Control Report"
                    >
                      {exportingControl === control.id ? (
                        <Loader2 className="animate-spin" size={18} />
                      ) : (
                        <Download size={18} />
                      )}
                    </button>
                    <span className="text-xs text-gray-500 mt-1">Export</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <label 
                      className="p-2 text-gray-400 hover:text-brand-600 transition-colors cursor-pointer flex flex-col items-center"
                      title="Upload Evidence"
                    >
                      <input
                        ref={setFileInputRef(control.id)}
                        type="file"
                        onChange={(e) => handleUploadEvidence(control.id, e)}
                        className="hidden"
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.json,.png,.jpg,.jpeg,.mp4,.mp3,.wav,.m4a"
                        disabled={uploadingControl === control.id}
                      />
                      {uploadingControl === control.id ? (
                        <Loader2 className="animate-spin" size={18} />
                      ) : (
                        <Upload size={18} />
                      )}
                    </label>
                    <span className="text-xs text-gray-500 mt-1">Upload</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
