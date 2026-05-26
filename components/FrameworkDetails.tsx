import React, { useState, useEffect, useRef } from 'react';
import { ComplianceFramework, ComplianceStatus, ViewState } from '../types';
import { ArrowLeft, CheckCircle, Circle, FileText, Upload, AlertTriangle, Loader2, Download, Plus, X, Trash2 } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useOnboarding } from '../hooks/useOnboarding';
import { toast } from 'sonner';
import { useI18n } from '../contexts/I18nContext';
import { logger } from '../utils/logger';

interface FrameworkControl {
  id: string;
  name: string;
  description?: string;
  status: string;
  evidence?: string;
  evidenceRequired?: boolean;
  ownerId?: string;
  owner?: { id: string; name: string; email: string };
  category?: string;
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
  const { t } = useI18n();
  const { completeMilestone, triggerCelebration, progress } = useOnboarding();
  const [controls, setControls] = useState<FrameworkControl[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [readinessScore, setReadinessScore] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [frameworkNotes, setFrameworkNotes] = useState('');
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [controlMappings, setControlMappings] = useState<any[]>([]);
  const [evidenceVersions, setEvidenceVersions] = useState<any[]>([]);
  const [showMappings, setShowMappings] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const [frameworkVersion, setFrameworkVersion] = useState<number>(1);
  const [showAddMappingModal, setShowAddMappingModal] = useState(false);
  const [availableControls, setAvailableControls] = useState<any[]>([]);
  const [conflictData, setConflictData] = useState<any>(null);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [pendingUpdate, setPendingUpdate] = useState<{ type: 'notes' | 'auditDate'; data: any } | null>(null);

  const formatAuditDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return dateString;
    }
  };
  const [analyzingFile, setAnalyzingFile] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [exportingControl, setExportingControl] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [showAddControl, setShowAddControl] = useState(false);
  const [uploadingControl, setUploadingControl] = useState<string | null>(null);
  const [deletingControl, setDeletingControl] = useState<string | null>(null);
  const [regeneratingMappings, setRegeneratingMappings] = useState(false);
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
    ownerId: '',
    category: '',
  });

  useEffect(() => {
    if (framework) {
      loadFrameworkDetails();
    }
    // Load team members for owner dropdown
    const loadTeamMembers = async () => {
      try {
        const members = await api.team.list();
        setTeamMembers(members || []);
      } catch (error) {
        logger.error('Failed to load team members:', error);
      }
    };
    loadTeamMembers();
  }, [framework, searchQuery, currentPage]);

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
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      params.append('page', currentPage.toString());
      params.append('limit', '50');
      
      const queryString = params.toString();
      const frameworkData: any = await api.frameworks.getById(framework.id, queryString || undefined);
      
      // Extract controls from framework data
      const frameworkControls = frameworkData.controls || [];
      setControls(frameworkControls);
      
      // Set pagination info
      if (frameworkData.pagination) {
        setTotalPages(frameworkData.pagination.totalPages || 1);
        setCurrentPage(frameworkData.pagination.page || 1);
      }
      
      // Set framework notes
      if (frameworkData.notes !== undefined) {
        setFrameworkNotes(frameworkData.notes || '');
      }
      
      // Set framework version for concurrent edit tracking
      if (frameworkData.version !== undefined) {
        setFrameworkVersion(frameworkData.version || 1);
      }
      
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
      logger.error('Failed to load framework details:', error);
      setControls([]);
    } finally {
      setIsLoading(false);
    }
  };

  const [pendingSuggestion, setPendingSuggestion] = useState<any>(null);
  const [rejectFeedback, setRejectFeedback] = useState('');
  const [showSuggestionModal, setShowSuggestionModal] = useState(false);

  const handleSmartUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !framework?.id) return;

    try {
      setAnalyzingFile(file.name);
      setAnalysisResult(null);

      const formData = new FormData();
      formData.append('file', file);

      const response = await api.frameworks.smartUpload(framework.id, formData);

      // Check if response contains a suggestion (new control) or control (existing control)
      if (response.suggestion) {
        // New suggestion - show modal for accept/reject
        setPendingSuggestion(response.suggestion);
        setShowSuggestionModal(true);
        const confidencePercent = Math.round((response.suggestion.confidence || 0) * 100);
        setAnalysisResult(
          `AI Suggestion: "${response.suggestion.classification}" (${confidencePercent}% confidence) - Review below`
        );
      } else if (response.control) {
        // Existing control updated - show success
        setAnalysisResult(
          `File added to existing control: "${response.control.name}"`
        );
        await loadFrameworkDetails();
        if (onDataChanged) {
          onDataChanged();
        }
        setTimeout(() => {
          setAnalysisResult(null);
        }, 3000);
      }
    } catch (error: any) {
      logger.error('Smart upload failed:', error);
      setAnalysisResult(`Error: ${error.message || 'Failed to upload file'}`);
    } finally {
      setAnalyzingFile(null);
      if (smartUploadRef.current) {
        smartUploadRef.current.value = '';
      }
    }
  };

  const handleAcceptSuggestion = async () => {
    if (!pendingSuggestion?.id || !framework?.id) return;

    try {
      await api.frameworks.acceptSuggestion(pendingSuggestion.id);
      setAnalysisResult(`Control "${pendingSuggestion.classification}" created successfully!`);
      setShowSuggestionModal(false);
      setPendingSuggestion(null);
      
      await loadFrameworkDetails();
      if (onDataChanged) {
        onDataChanged();
      }

      setTimeout(() => {
        setAnalysisResult(null);
      }, 3000);
    } catch (error: any) {
      logger.error('Failed to accept suggestion:', error);
      toast.error(`Failed to accept suggestion: ${error.message || 'Unknown error'}`);
    }
  };

  const handleRejectSuggestion = async () => {
    if (!pendingSuggestion?.id) return;

    try {
      await api.frameworks.rejectSuggestion(pendingSuggestion.id, rejectFeedback);
      setAnalysisResult('Suggestion rejected. Feedback recorded.');
      setShowSuggestionModal(false);
      setPendingSuggestion(null);
      setRejectFeedback('');

      setTimeout(() => {
        setAnalysisResult(null);
      }, 3000);
    } catch (error: any) {
      logger.error('Failed to reject suggestion:', error);
      toast.error(`Failed to reject suggestion: ${error.message || 'Unknown error'}`);
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
      toast.warning(`File size exceeds the maximum limit of 50MB. Please select a smaller file.`);
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

      // Evidence uploaded successfully

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

      // Onboarding: trigger first_evidence milestone on first upload
      if (progress && !progress.firstEvidenceCompleted) {
        completeMilestone('first_evidence');
        triggerCelebration('First Evidence Uploaded!');
      }
    } catch (error: any) {
      logger.error('Evidence upload failed:', error);
      const errorMessage = error.message || error.error || 'Unknown error';
      toast.error(`Failed to upload evidence: ${errorMessage}. Please ensure you have the necessary permissions, the file format is supported, and the file size is under 50MB.`);
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
      // Prepare control data - include all fields
      const controlData: { name: string; description?: string; status: string; category?: string; ownerId?: string } = {
        name: newControl.name.trim(),
        status: newControl.status || 'Pending',
      };
      
      // Only include description if it has a value
      if (newControl.description && newControl.description.trim()) {
        controlData.description = newControl.description.trim();
      }
      
      // Include category if provided
      if (newControl.category && newControl.category.trim()) {
        controlData.category = newControl.category.trim();
      }
      
      // Include owner if provided
      if (newControl.ownerId) {
        controlData.ownerId = newControl.ownerId;
      }

      await api.frameworks.createControl(framework.id, controlData);
      setNewControl({ name: '', description: '', status: 'Pending', ownerId: '', category: '' });
      setShowAddControl(false);
      await loadFrameworkDetails();
      // Notify parent to refresh data
      if (onDataChanged) {
        onDataChanged();
      }
    } catch (error: any) {
      logger.error('Failed to create control:', error);
      const errorMessage = error.message || error.error || 'Unknown error';
      toast.error(`Failed to create control: ${errorMessage}`);
    }
  };

  const handleUpdateControlStatus = async (control: FrameworkControl, newStatus: string) => {
    if (!framework?.id) return;

    // Check if evidence is required but not uploaded
    if (control.evidenceRequired && !control.evidence) {
      const confirmed = confirm(
        `⚠️ Warning: This control requires evidence but no evidence has been uploaded. ` +
        `Are you sure you want to update the status to "${newStatus}" without evidence?`
      );
      if (!confirmed) return;
    }

    try {
      await api.frameworks.updateControl(framework.id, control.id, { status: newStatus });
      await loadFrameworkDetails();
      // Notify parent to refresh data
      if (onDataChanged) {
        onDataChanged();
      }

      // Onboarding: trigger first_control milestone when first control passes
      if (
        (newStatus === 'Compliant' || newStatus === 'Implemented') &&
        progress &&
        !progress.firstControlPassCompleted
      ) {
        completeMilestone('first_control');
        triggerCelebration('First Control Passed!');
      }
    } catch (error: any) {
      logger.error('Failed to update control status:', error);
      toast.error(`Failed to update control status: ${error.message || 'Unknown error'}`);
    }
  };

  const [selectedControl, setSelectedControl] = useState<FrameworkControl | null>(null);
  const [showControlDetails, setShowControlDetails] = useState(false);
  const [selectedControls, setSelectedControls] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState('');
  const [bulkEvidenceRequired, setBulkEvidenceRequired] = useState(false);
  const [showBulkUpdate, setShowBulkUpdate] = useState(false);
  const [teamMembers, setTeamMembers] = useState<Array<{ id: string; name: string; email: string }>>([]);

  const handleControlClick = async (control: FrameworkControl) => {
    // Open control details view instead of cycling status
    setSelectedControl(control);
    setShowControlDetails(true);
    
    // Reset mappings visibility - will show if mappings exist
    setShowMappings(false);
    
    // Load mappings and versions
    try {
      const [mappingsData, versionsData] = await Promise.all([
        api.frameworks.getControlMappings(control.id).catch(err => {
          logger.error('Failed to load mappings:', err);
          return { mappings: [] };
        }),
        api.frameworks.getEvidenceVersions(control.id).catch(err => {
          logger.error('Failed to load versions:', err);
          return { versions: [] };
        }),
      ]);
      
      // Handle both response formats: { mappings: [...] } or just [...]
      const mappings = (mappingsData as any)?.mappings || (Array.isArray(mappingsData) ? mappingsData : []);
      const versions = (versionsData as any)?.versions || (Array.isArray(versionsData) ? versionsData : []);
      
      const mappingsArray = Array.isArray(mappings) ? mappings : [];
      const versionsArray = Array.isArray(versions) ? versions : [];
      
      setControlMappings(mappingsArray);
      setEvidenceVersions(versionsArray);
      
      // Auto-show mappings if they exist
      if (mappingsArray.length > 0) {
        setShowMappings(true);
      }
    } catch (error) {
      logger.error('Failed to load mappings/versions:', error);
      setControlMappings([]);
      setEvidenceVersions([]);
    }
  };

  const handleUpdateAuditDate = async (newDate: string, resolutionStrategy?: 'overwrite' | 'merge') => {
    if (!framework?.id) return;

    try {
      const auditDate = new Date(newDate);
      if (isNaN(auditDate.getTime())) {
        toast.warning('Invalid date format. Please use YYYY-MM-DD format.');
        return;
      }

      // Check if date is in the past
      if (auditDate < new Date()) {
        const confirmed = confirm('⚠️ Warning: This audit date is in the past. Are you sure you want to set it?');
        if (!confirmed) return;
      }

      const updatePayload: any = { 
        nextAuditDate: newDate,
        version: frameworkVersion,
      };
      
      if (resolutionStrategy) {
        updatePayload.resolutionStrategy = resolutionStrategy;
      }

      await api.frameworks.update(framework.id, updatePayload);
      
      // Reload framework data
      await loadFrameworkDetails();
      if (onDataChanged) {
        onDataChanged();
      }
      
      // Update local state
      if (framework) {
        framework.nextAuditDate = auditDate.toISOString();
      }
      
      setShowConflictModal(false);
      setConflictData(null);
      setPendingUpdate(null);
    } catch (error: any) {
      logger.error('Failed to update audit date:', error);
      
      // Check for 409 Conflict
      if (error.status === 409 || error.message?.includes('409')) {
        try {
          const conflictDetails = JSON.parse(error.message || error.error || '{}');
          setConflictData(conflictDetails);
          setPendingUpdate({ type: 'auditDate', data: { nextAuditDate: newDate } });
          setShowConflictModal(true);
        } catch (parseError) {
          toast.warning(`Conflict detected: Framework was modified by another user. Please refresh and try again.`);
        }
      } else {
        toast.error(`Failed to update audit date: ${error.message || 'Unknown error'}`);
      }
    }
  };

  const handleSaveNotes = async (resolutionStrategy?: 'overwrite' | 'merge') => {
    if (!framework?.id) return;

    try {
      // Ensure we only send primitive values to avoid circular JSON errors
      const updatePayload: any = { 
        notes: typeof frameworkNotes === 'string' ? frameworkNotes : String(frameworkNotes || ''),
      };
      
      // Only include version if it's a valid primitive value
      if (frameworkVersion && typeof frameworkVersion === 'string') {
        updatePayload.version = frameworkVersion;
      }
      
      if (resolutionStrategy) {
        updatePayload.resolutionStrategy = resolutionStrategy;
      }

      await api.frameworks.update(framework.id, updatePayload);
      setIsEditingNotes(false);
      setShowConflictModal(false);
      setConflictData(null);
      setPendingUpdate(null);
      
      // Reload framework data
      await loadFrameworkDetails();
      if (onDataChanged) {
        onDataChanged();
      }
      
      toast.success('Notes saved successfully');
    } catch (error: any) {
      logger.error('Failed to save notes:', error);
      
      // Check for 409 Conflict
      if (error.status === 409 || error.message?.includes('409')) {
        try {
          const conflictDetails = JSON.parse(error.message || error.error || '{}');
          setConflictData(conflictDetails);
          setPendingUpdate({ type: 'notes', data: { notes: frameworkNotes } });
          setShowConflictModal(true);
        } catch (parseError) {
          toast.warning(`Conflict detected: Framework was modified by another user. Please refresh and try again.`);
        }
      } else {
        toast.error(`Failed to save notes: ${error.message || 'Unknown error'}`);
      }
    }
  };

  const handleBulkUpdate = async () => {
    if (!framework?.id || selectedControls.size === 0 || !bulkStatus) {
      toast.warning('Please select controls and choose a status');
      return;
    }

    // Check if any selected controls have evidenceRequired and warn
    const controlsWithEvidenceRequired = Array.from(selectedControls)
      .map(id => controls.find(c => c.id === id))
      .filter(c => c?.evidenceRequired && !c.evidence);

    if (controlsWithEvidenceRequired.length > 0 && !bulkEvidenceRequired) {
      const confirmed = confirm(
        `⚠️ Warning: ${controlsWithEvidenceRequired.length} selected control(s) require evidence but don't have any uploaded. ` +
        `Are you sure you want to update their status without evidence?`
      );
      if (!confirmed) return;
    }

    try {
      await api.frameworks.bulkUpdateControls(framework.id, {
        controlIds: Array.from(selectedControls),
        status: bulkStatus,
        evidenceRequired: bulkEvidenceRequired,
      });

      await loadFrameworkDetails();
      if (onDataChanged) {
        onDataChanged();
      }

      setSelectedControls(new Set());
      setBulkStatus('');
      setBulkEvidenceRequired(false);
      setShowBulkUpdate(false);
      toast.success(`Successfully updated ${selectedControls.size} control(s)`);
    } catch (error: any) {
      logger.error('Failed to bulk update controls:', error);
      toast.error(`Failed to bulk update: ${error.message || 'Unknown error'}`);
    }
  };

  const toggleControlSelection = (controlId: string) => {
    const newSelection = new Set(selectedControls);
    if (newSelection.has(controlId)) {
      newSelection.delete(controlId);
    } else {
      newSelection.add(controlId);
    }
    setSelectedControls(newSelection);
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
      logger.error('Failed to delete control:', error);
      toast.error(`Failed to delete control: ${error.message || 'Unknown error'}`);
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
      logger.error('Failed to export control:', error);
      toast.error('Failed to export control report. Please try again.');
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
        {t('common.back')}
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
              <div className="flex items-center space-x-2">
                <span className="text-gray-500 text-sm">Next Audit: {formatAuditDate(framework.nextAuditDate)}</span>
                {user?.role === 'admin' && (
                  <button
                    onClick={() => {
                      const newDate = prompt('Enter new audit date (YYYY-MM-DD):', framework.nextAuditDate.split('T')[0]);
                      if (newDate) {
                        handleUpdateAuditDate(newDate);
                      }
                    }}
                    className="text-xs text-brand-600 hover:text-brand-800 underline"
                    title="Update audit date"
                  >
                    Edit
                  </button>
                )}
              </div>
              {new Date(framework.nextAuditDate) < new Date() && (
                <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full">
                  ⚠️ Past Due
                </span>
              )}
            </div>
          </div>
          <div className="mt-4 md:mt-0 flex flex-col items-end space-y-2">
             <div className="text-right">
               <div className="text-3xl font-bold text-brand-600">{readinessScore}%</div>
               <div className="text-sm text-gray-400">Status Score</div>
             </div>
             {(user?.role === 'admin' || user?.role === 'editor') && (
               <button
                 onClick={async () => {
                   if (!framework?.id) return;
                   setRegeneratingMappings(true);
                   try {
                     const result = await api.frameworks.regenerateMappings(framework.id);
                     toast.success(`Mappings regenerated: ${result.created} created, ${result.deleted} removed`);
                     // Refresh data if needed
                     if (onDataChanged) onDataChanged();
                   } catch (error: any) {
                     toast.error(`Failed to regenerate mappings: ${error.message}`);
                   } finally {
                     setRegeneratingMappings(false);
                   }
                 }}
                 disabled={regeneratingMappings}
                 className="text-xs px-3 py-1.5 bg-brand-50 text-brand-600 hover:bg-brand-100 rounded-lg transition-colors disabled:opacity-50 flex items-center space-x-1"
                 title="Regenerate cross-framework control mappings"
               >
                 {regeneratingMappings ? (
                   <>
                     <Loader2 size={12} className="animate-spin" />
                     <span>Regenerating...</span>
                   </>
                 ) : (
                   <span>Regenerate Mappings</span>
                 )}
               </button>
             )}
          </div>
        </div>

        <div className="mt-8 w-full bg-gray-100 rounded-full h-3">
          <div 
            className="bg-brand-500 h-3 rounded-full transition-all duration-1000" 
            style={{ width: `${readinessScore}%` }}
          ></div>
        </div>
      </div>

      {/* Framework Notes Section */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Framework Notes</h3>
          {user?.role === 'admin' && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (isEditingNotes) {
                  // Save notes - call without event
                  handleSaveNotes();
                } else {
                  setIsEditingNotes(true);
                }
              }}
              className="text-sm text-brand-600 hover:text-brand-800 font-medium"
            >
              {isEditingNotes ? t('common.save') : t('common.edit')}
            </button>
          )}
        </div>
        {isEditingNotes ? (
          <div className="space-y-3">
            <textarea
              value={frameworkNotes}
              onChange={(e) => setFrameworkNotes(e.target.value)}
              placeholder="Add notes about this framework..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none resize-none"
              rows={4}
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setIsEditingNotes(false);
                  // Reload to restore original notes
                  loadFrameworkDetails();
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSaveNotes();
                }}
                className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700"
              >
                {t('common.save')}
              </button>
            </div>
          </div>
        ) : (
          <div className="text-gray-700 whitespace-pre-wrap">
            {frameworkNotes || <span className="text-gray-400 italic">No notes added yet.</span>}
          </div>
        )}
      </div>

      {/* AI Analysis Result Toast */}
      {analysisResult && (
        <div className={`p-4 rounded-lg flex items-center justify-between animate-fadeIn ${
          analysisResult.startsWith('Error:') 
            ? 'bg-red-50 border border-red-200 text-red-800' 
            : 'bg-blue-50 border border-blue-200 text-blue-800'
        }`}>
           <span className="font-medium">{analysisResult}</span>
          <button onClick={() => setAnalysisResult(null)} className="hover:opacity-70">
            <X size={16}/>
          </button>
        </div>
      )}

      {/* AI Suggestion Modal */}
      {showSuggestionModal && pendingSuggestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50" onClick={() => setShowSuggestionModal(false)}>
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-bold text-gray-900">AI Suggestion</h3>
              <button onClick={() => setShowSuggestionModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-700 mb-2">Suggested Control Name</h4>
                <p className="text-gray-900 text-lg">{pendingSuggestion.classification}</p>
              </div>

              {pendingSuggestion.description && (
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">Description</h4>
                  <p className="text-gray-600">{pendingSuggestion.description}</p>
                </div>
              )}

              <div>
                <h4 className="font-semibold text-gray-700 mb-2">Confidence Score</h4>
                <div className="flex items-center space-x-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-brand-600 h-2.5 rounded-full" 
                      style={{ width: `${Math.round((pendingSuggestion.confidence || 0) * 100)}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    {Math.round((pendingSuggestion.confidence || 0) * 100)}%
                  </span>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-700 mb-2">File</h4>
                <p className="text-gray-600">{pendingSuggestion.fileName}</p>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold text-gray-700 mb-2">Feedback (Optional - for rejection)</h4>
                <textarea
                  value={rejectFeedback}
                  onChange={(e) => setRejectFeedback(e.target.value)}
                  placeholder="Provide feedback on why this suggestion doesn't fit..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  onClick={handleRejectSuggestion}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Reject
                </button>
                <button
                  onClick={handleAcceptSuggestion}
                  className="px-4 py-2 text-white bg-brand-600 rounded-lg hover:bg-brand-700"
                >
                  Accept & Create Control
                </button>
              </div>
            </div>
          </div>
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
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-800">Controls & Evidence</h3>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  loadFrameworkDetails();
                }
              }}
              placeholder="Search controls (e.g., password policy)..."
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none w-64"
            />
          </div>
          <div className="flex space-x-2">
            {selectedControls.size > 0 && (
              <div className="flex items-center space-x-2 mr-4">
                <span className="text-sm text-gray-600">{selectedControls.size} selected</span>
                <button
                  onClick={() => setShowBulkUpdate(true)}
                  className="text-sm bg-brand-600 text-white px-3 py-1.5 rounded-lg hover:bg-brand-700 flex items-center shadow-sm"
                >
                  Bulk Update
                </button>
                <button
                  onClick={() => setSelectedControls(new Set())}
                  className="text-sm bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-200"
                >
                  Clear
                </button>
              </div>
            )}
            <button
              onClick={() => setShowAddControl(!showAddControl)}
              className="text-sm bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-200 flex items-center shadow-sm"
            >
              <Plus size={14} className="mr-2" />
              {t('common.add')}
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
                <input
                  type="text"
                  value={newControl.category}
                  onChange={(e) => setNewControl({ ...newControl, category: e.target.value })}
                  placeholder="Category (optional)"
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
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
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <textarea
                  value={newControl.description}
                  onChange={(e) => setNewControl({ ...newControl, description: e.target.value })}
                  placeholder="Description (optional)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                  rows={2}
                />
                {(user?.role === 'admin' || user?.role === 'editor') && (
                  <select
                    value={newControl.ownerId}
                    onChange={(e) => setNewControl({ ...newControl, ownerId: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                  >
                    <option value="">No Owner</option>
                    {teamMembers.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name} ({member.email})
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="submit"
                  className="bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 transition-colors"
                >
                  {t('common.create')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddControl(false);
                    setNewControl({ name: '', description: '', status: 'Pending', ownerId: '', category: '' });
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  {t('common.cancel')}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="divide-y divide-gray-100">
          {isLoading ? (
            <div className="p-8 text-center">
              <Loader2 className="animate-spin mx-auto mb-2 text-brand-600" size={24} />
              <p className="text-gray-500">{t('common.loading')}</p>
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
            <div data-onboarding="control-list" className="space-y-0">
            {controls.map((control) => (
              <div 
                key={control.id}
                id={`control-${control.id}`}
                className={`p-4 transition-colors flex items-center justify-between group ${
                  control.status !== 'Compliant'
                    ? 'hover:bg-brand-50 cursor-pointer border-l-4 border-transparent hover:border-brand-500'
                    : 'hover:bg-gray-50 cursor-pointer'
                } ${selectedControls.has(control.id) ? 'bg-brand-50 border-l-4 border-brand-500' : ''}`}
                onClick={() => handleControlClick(control)}
              >
                <div className="flex items-start space-x-4 flex-1">
                  {(user?.role === 'admin' || user?.role === 'editor') && (
                    <input
                      type="checkbox"
                      checked={selectedControls.has(control.id)}
                      onChange={(e) => {
                        e.stopPropagation();
                        toggleControlSelection(control.id);
                      }}
                      className="mt-1 h-4 w-4 text-brand-600 focus:ring-brand-500 border-gray-300 rounded"
                    />
                  )}
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
                        <span className="text-xs text-gray-500 italic">Click to view details</span>
                      )}
                      {control.status === 'Compliant' && (
                        <span className="text-xs text-green-600 italic">✓ Fully compliant</span>
                      )}
                      {control.evidenceRequired && !control.evidence && (
                        <span className="text-xs text-red-600 italic">⚠️ Evidence Required</span>
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
                    <span className="text-xs text-gray-500 mt-1">{t('common.export')}</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <label 
                      data-onboarding="upload-evidence-btn"
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
                    <span className="text-xs text-gray-500 mt-1">{t('common.upload')}</span>
                  </div>
                </div>
              </div>
            ))}
            </div>
          )}
        </div>
        
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 flex justify-between items-center">
            <div className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  if (currentPage > 1) {
                    setCurrentPage(currentPage - 1);
                  }
                }}
                disabled={currentPage === 1}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => {
                  if (currentPage < totalPages) {
                    setCurrentPage(currentPage + 1);
                  }
                }}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Control Details Modal */}
      {showControlDetails && selectedControl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50" onClick={() => setShowControlDetails(false)}>
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-bold text-gray-900">{selectedControl.name}</h3>
              <button onClick={() => setShowControlDetails(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              {selectedControl.description && (
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">Description</h4>
                  <p className="text-gray-600">{selectedControl.description}</p>
                </div>
              )}

              {selectedControl.category && (
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">{t('common.category')}</h4>
                  <p className="text-gray-600">{selectedControl.category}</p>
                </div>
              )}

              <div>
                <h4 className="font-semibold text-gray-700 mb-2">{t('common.status')}</h4>
                <div className="space-y-2">
                  <select
                    value={selectedControl.status}
                    onChange={(e) => {
                      const newStatus = e.target.value;
                      // Check if evidence is required but not uploaded
                      if (selectedControl.evidenceRequired && !selectedControl.evidence) {
                        const confirmed = confirm(
                          `⚠️ Warning: This control requires evidence but no evidence has been uploaded. ` +
                          `Are you sure you want to update the status to "${newStatus}" without evidence?`
                        );
                        if (!confirmed) return;
                      }
                      if (confirm(`Update status to "${newStatus}"?`)) {
                        handleUpdateControlStatus(selectedControl, newStatus);
                        setShowControlDetails(false);
                      }
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Implemented">Implemented</option>
                    <option value="Compliant">Compliant</option>
                    <option value="At Risk">At Risk</option>
                  </select>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={selectedControl.evidenceRequired || false}
                      onChange={async (e) => {
                        const evidenceRequired = e.target.checked;
                        try {
                          await api.frameworks.updateControl(framework!.id, selectedControl.id, { evidenceRequired });
                          setSelectedControl({ ...selectedControl, evidenceRequired });
                          await loadFrameworkDetails();
                        } catch (error: any) {
                          toast.error(`Failed to update evidence required: ${error.message}`);
                        }
                      }}
                      className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">{t('frameworks.evidenceRequired')}</span>
                  </label>
                </div>
              </div>

              {(user?.role === 'admin') && (
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">{t('controls.controlOwner')}</h4>
                  <select
                    value={selectedControl.ownerId || ''}
                    onChange={async (e) => {
                      const ownerId = e.target.value || undefined;
                      try {
                        await api.frameworks.updateControl(framework!.id, selectedControl.id, { ownerId });

                        // Load user data for owner from teamMembers
                        const owner = ownerId ? teamMembers.find(m => m.id === ownerId) : undefined;
                        setSelectedControl({
                          ...selectedControl,
                          ownerId,
                          owner: owner ? { id: owner.id, name: owner.name, email: owner.email } : undefined
                        });

                        await loadFrameworkDetails();
                        toast.success('Owner updated. Notification sent to owner.');
                      } catch (error: any) {
                        toast.error(`Failed to update owner: ${error.message}`);
                      }
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 w-full"
                  >
                    <option value="">No Owner</option>
                    {teamMembers.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name} ({member.email})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <h4 className="font-semibold text-gray-700 mb-2">Evidence</h4>
                {selectedControl.evidence ? (
                  <div className="space-y-2">
                    <a 
                      href="#" 
                      onClick={async (e) => {
                        e.preventDefault();
                        try {
                          const result = await api.frameworks.getEvidenceUrl(framework!.id, selectedControl.id);
                          window.open(result.url, '_blank');
                        } catch (error: any) {
                          toast.error(`Failed to open evidence: ${error.message}`);
                        }
                      }}
                      className="text-brand-600 hover:underline block"
                    >
                      {selectedControl.evidence.split('/').pop()}
                    </a>
                    {evidenceVersions.length > 0 && (
                      <div>
                        <button
                          onClick={() => setShowVersions(!showVersions)}
                          className="text-sm text-brand-600 hover:text-brand-800"
                        >
                          {showVersions ? 'Hide' : 'Show'} Version History ({evidenceVersions.length})
                        </button>
                        {showVersions && (
                          <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                            {evidenceVersions.map((version: any) => (
                              <div key={version.id} className="text-xs text-gray-600 flex justify-between items-center p-2 bg-gray-50 rounded">
                                <span>v{version.versionNumber} - {version.fileName}</span>
                                <div className="flex space-x-2">
                                  {version.isCurrent && <span className="text-green-600">Current</span>}
                                  {!version.isCurrent && (user?.role === 'admin' || user?.role === 'editor') && (
                                    <button
                                      onClick={async () => {
                                        if (confirm(`Restore version ${version.versionNumber}?`)) {
                                          try {
                                            await api.frameworks.restoreEvidenceVersion(selectedControl.id, version.id);
                                            await loadFrameworkDetails();
                                            setShowControlDetails(false);
                                            toast.success('Version restored successfully');
                                          } catch (error: any) {
                                            toast.error(`Failed to restore: ${error.message}`);
                                          }
                                        }
                                      }}
                                      className="text-xs text-brand-600 hover:text-brand-800"
                                    >
                                      Restore
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    {(user?.role === 'admin' || user?.role === 'editor') && (
                      <button
                        onClick={async () => {
                          if (confirm('Are you sure you want to delete this evidence?')) {
                            try {
                              await api.frameworks.updateControl(framework!.id, selectedControl.id, { evidence: null });
                              setSelectedControl({ ...selectedControl, evidence: undefined });
                              await loadFrameworkDetails();
                              toast.success('Evidence deleted successfully');
                            } catch (error: any) {
                              toast.error(`Failed to delete evidence: ${error.message}`);
                            }
                          }
                        }}
                        className="text-sm text-red-600 hover:text-red-800"
                      >
                        Delete Evidence
                      </button>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500">No evidence uploaded</p>
                )}
              </div>

              {/* Control Mappings Section */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-semibold text-gray-700">Also Satisfies</h4>
                  <button
                    onClick={() => setShowMappings(!showMappings)}
                    className="text-sm text-brand-600 hover:text-brand-800"
                  >
                    {showMappings ? 'Hide' : 'Show'} Mappings ({controlMappings.length})
                  </button>
                </div>
                {showMappings && (
                  <div className="space-y-2">
                    {controlMappings.length === 0 ? (
                      <p className="text-sm text-gray-500">No mappings found</p>
                    ) : (
                      controlMappings.map((mapping: any) => {
                        // Use the Prisma include structure
                        const mappedControl = mapping.sourceControlId === selectedControl.id 
                          ? { 
                              name: mapping.targetControl?.name || 'Unknown Control', 
                              framework: mapping.targetControl?.framework?.name || 'Unknown Framework' 
                            }
                          : { 
                              name: mapping.sourceControl?.name || 'Unknown Control', 
                              framework: mapping.sourceControl?.framework?.name || 'Unknown Framework' 
                            };
                        return (
                          <div key={mapping.id} className="text-sm p-2 bg-gray-50 rounded">
                            <span className="font-medium">{mappedControl.name}</span>
                            <span className="text-gray-500"> ({mappedControl.framework})</span>
                            <span className="text-xs text-gray-400 ml-2">- {mapping.mappingType}</span>
                            {(user?.role === 'admin' || user?.role === 'editor') && (
                              <button
                                onClick={async () => {
                                  if (confirm('Delete this mapping?')) {
                                    try {
                                      await api.frameworks.deleteControlMapping(mapping.id);
                                      // Reload mappings to ensure consistency
                                      try {
                                        const mappingsData = await api.frameworks.getControlMappings(selectedControl.id);
                                        // Handle both response formats: { mappings: [...] } or just [...]
                                        const mappings = (mappingsData as any)?.mappings || (Array.isArray(mappingsData) ? mappingsData : []);
                                        const mappingsArray = Array.isArray(mappings) ? mappings : [];
                                        setControlMappings(mappingsArray);
                                        // Mappings reloaded after delete
                                      } catch (reloadError: any) {
                                        logger.error('Failed to reload mappings after delete:', reloadError);
                                        // Fallback: remove from local state
                                        setControlMappings(controlMappings.filter(m => m.id !== mapping.id));
                                      }
                                    } catch (error: any) {
                                      toast.error(`Failed to delete mapping: ${error.message}`);
                                    }
                                  }
                                }}
                                className="ml-2 text-xs text-red-600 hover:text-red-800"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                        );
                      })
                    )}
                    {(user?.role === 'admin' || user?.role === 'editor') && (
                      <button
                        onClick={async () => {
                          try {
                            // Load all frameworks and controls for the organization
                            const allFrameworks = await api.frameworks.list();
                            const allControls: any[] = [];
                            for (const fw of allFrameworks) {
                              if (fw.id !== framework?.id) { // Exclude current framework
                                try {
                                  const fwData: any = await api.frameworks.getById(fw.id);
                                  const fwControls = (fwData.controls || []).map((c: any) => ({
                                    ...c,
                                    frameworkName: fw.name,
                                    frameworkId: fw.id,
                                  }));
                                  allControls.push(...fwControls);
                                } catch (err) {
                                  logger.error(`Failed to load controls for framework ${fw.id}:`, err);
                                }
                              }
                            }
                            setAvailableControls(allControls);
                            setShowAddMappingModal(true);
                          } catch (error: any) {
                            toast.error(`Failed to load controls: ${error.message}`);
                          }
                        }}
                        className="text-sm text-brand-600 hover:text-brand-800"
                      >
                        + Add Mapping
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  onClick={() => setShowControlDetails(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Close
                </button>
                {(user?.role === 'admin' || user?.role === 'editor') && (
                  <button
                    onClick={() => {
                      if (confirm(`Delete control "${selectedControl.name}"?`)) {
                        handleDeleteControl(selectedControl);
                        setShowControlDetails(false);
                      }
                    }}
                    className="px-4 py-2 text-red-700 bg-red-50 rounded-lg hover:bg-red-100"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Mapping Modal */}
      {showAddMappingModal && selectedControl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50" onClick={() => setShowAddMappingModal(false)}>
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-bold text-gray-900">Add Control Mapping</h3>
              <button onClick={() => setShowAddMappingModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Source Control
                </label>
                <input
                  type="text"
                  value={`${selectedControl.name} (${framework?.name})`}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Control *
                </label>
                <select
                  id="targetControl"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                  defaultValue=""
                >
                  <option value="">Select a control...</option>
                  {availableControls.map((control) => (
                    <option key={control.id} value={control.id}>
                      {control.name} ({control.frameworkName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mapping Type *
                </label>
                <select
                  id="mappingType"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                  defaultValue="equivalent"
                >
                  <option value="equivalent">Equivalent</option>
                  <option value="related">Related</option>
                  <option value="superset">Superset (this control covers more)</option>
                  <option value="subset">Subset (this control covers less)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confidence (0-1, optional)
                </label>
                <input
                  type="number"
                  id="confidence"
                  min="0"
                  max="1"
                  step="0.01"
                  placeholder="0.85"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  onClick={() => setShowAddMappingModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    const targetControlId = (document.getElementById('targetControl') as HTMLSelectElement)?.value;
                    const mappingType = (document.getElementById('mappingType') as HTMLSelectElement)?.value;
                    const confidenceInput = (document.getElementById('confidence') as HTMLInputElement)?.value;
                    const confidence = confidenceInput ? parseFloat(confidenceInput) : undefined;

                    if (!targetControlId) {
                      toast.warning('Please select a target control');
                      return;
                    }

                    try {
                      await api.frameworks.createControlMapping({
                        sourceControlId: selectedControl.id,
                        targetControlId,
                        mappingType,
                        confidence,
                      });
                      setShowAddMappingModal(false);
                      
                      // Reload mappings and automatically show them
                      try {
                        const mappingsData = await api.frameworks.getControlMappings(selectedControl.id);
                        // Handle both response formats: { mappings: [...] } or just [...]
                        const mappings = (mappingsData as any)?.mappings || (Array.isArray(mappingsData) ? mappingsData : []);
                        const mappingsArray = Array.isArray(mappings) ? mappings : [];
                        setControlMappings(mappingsArray);
                        setShowMappings(true); // Automatically show mappings after creation
                        // Mappings reloaded after creation
                      } catch (reloadError: any) {
                        logger.error('Failed to reload mappings:', reloadError);
                        // Fallback: reload entire control
                        await handleControlClick(selectedControl);
                        setShowMappings(true);
                      }
                      
                      toast.success('Mapping created successfully');
                    } catch (error: any) {
                      toast.error(`Failed to create mapping: ${error.message}`);
                    }
                  }}
                  className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700"
                >
                  Create Mapping
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Conflict Resolution Modal */}
      {showConflictModal && conflictData && pendingUpdate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50" onClick={() => setShowConflictModal(false)}>
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-bold text-gray-900">Conflict Detected</h3>
              <button onClick={() => setShowConflictModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-800 font-medium mb-2">⚠️ Framework was modified by another user</p>
                <p className="text-sm text-yellow-700">
                  Last modified by: <strong>{conflictData.lastModifiedBy || 'Unknown'}</strong>
                  {conflictData.lastModifiedAt && (
                    <> on {new Date(conflictData.lastModifiedAt).toLocaleString()}</>
                  )}
                </p>
              </div>

              {conflictData.conflictingFields && conflictData.conflictingFields.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Conflicting fields:</p>
                  <ul className="list-disc list-inside text-sm text-gray-600">
                    {conflictData.conflictingFields.map((field: string) => (
                      <li key={field}>{field}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="border-t pt-4">
                <p className="text-sm font-medium text-gray-700 mb-3">How would you like to resolve this conflict?</p>
                <div className="space-y-3">
                  <button
                    onClick={async () => {
                      if (pendingUpdate.type === 'notes') {
                        await handleSaveNotes('overwrite');
                      } else if (pendingUpdate.type === 'auditDate') {
                        await handleUpdateAuditDate(pendingUpdate.data.nextAuditDate, 'overwrite');
                      }
                    }}
                    className="w-full px-4 py-3 bg-brand-600 text-white rounded-lg hover:bg-brand-700 text-left"
                  >
                    <div className="font-semibold">Overwrite Their Changes</div>
                    <div className="text-sm opacity-90">Your changes will replace the other user's changes</div>
                  </button>
                  <button
                    onClick={async () => {
                      if (pendingUpdate.type === 'notes') {
                        await handleSaveNotes('merge');
                      } else if (pendingUpdate.type === 'auditDate') {
                        await handleUpdateAuditDate(pendingUpdate.data.nextAuditDate, 'merge');
                      }
                    }}
                    className="w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-left"
                  >
                    <div className="font-semibold">Merge Changes</div>
                    <div className="text-sm opacity-90">Attempt to combine both sets of changes</div>
                  </button>
                  <button
                    onClick={() => {
                      setShowConflictModal(false);
                      setConflictData(null);
                      setPendingUpdate(null);
                      // Reload to get latest version
                      loadFrameworkDetails();
                    }}
                    className="w-full px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-left"
                  >
                    <div className="font-semibold">Cancel and Refresh</div>
                    <div className="text-sm opacity-90">Discard your changes and reload the latest version</div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
