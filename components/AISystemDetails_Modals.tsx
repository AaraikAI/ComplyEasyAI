// Create Risk Activity Modal
import React, { useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { X } from 'lucide-react';

export const CreateRiskActivityModal: React.FC<any> = ({ systemId, teamMembers, onClose }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    activityType: 'Risk_Identification',
    relatedFunction: '',
    relatedCategory: '',
    relatedSubcategory: '',
    description: '',
    riskLevel: 'Medium',
    mitigationPlan: '',
    ownerId: '',
    targetDate: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description.trim()) {
      alert('Please provide a description');
      return;
    }

    try {
      setSubmitting(true);
      await api.aiRmf.createRiskActivity(systemId, {
        ...formData,
        ownerId: formData.ownerId && formData.ownerId.trim() ? formData.ownerId : undefined,
        relatedFunction: formData.relatedFunction && formData.relatedFunction.trim() ? formData.relatedFunction : undefined,
        relatedCategory: formData.relatedCategory && formData.relatedCategory.trim() ? formData.relatedCategory : undefined,
        relatedSubcategory: formData.relatedSubcategory && formData.relatedSubcategory.trim() ? formData.relatedSubcategory : undefined,
        mitigationPlan: formData.mitigationPlan && formData.mitigationPlan.trim() ? formData.mitigationPlan : undefined,
        targetDate: formData.targetDate ? new Date(formData.targetDate) as any : undefined,
      });
      onClose();
    } catch (error: any) {
      console.error('Failed to create risk activity:', error);
      alert(`Failed to create risk activity: ${error.message || 'Unknown error'}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white">
          <h3 className="text-xl font-bold text-gray-900">Create Risk Activity</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Activity Type</label>
            <select
              value={formData.activityType}
              onChange={(e) => setFormData({ ...formData, activityType: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="Risk_Identification">Risk Identification</option>
              <option value="Risk_Analysis">Risk Analysis</option>
              <option value="Risk_Evaluation">Risk Evaluation</option>
              <option value="Risk_Treatment">Risk Treatment</option>
              <option value="Risk_Monitoring">Risk Monitoring</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Related Function</label>
            <select
              value={formData.relatedFunction}
              onChange={(e) => setFormData({ ...formData, relatedFunction: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">None</option>
              <option value="GOVERN">GOVERN</option>
              <option value="MAP">MAP</option>
              <option value="MEASURE">MEASURE</option>
              <option value="MANAGE">MANAGE</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description <span className="text-red-500">*</span></label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              rows={4}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Risk Level</label>
              <select
                value={formData.riskLevel}
                onChange={(e) => setFormData({ ...formData, riskLevel: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Owner</label>
              <select
                value={formData.ownerId}
                onChange={(e) => setFormData({ ...formData, ownerId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">Unassigned</option>
                {teamMembers.map((member: any) => (
                  <option key={member.id} value={member.id}>
                    {member.name || member.email}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mitigation Plan</label>
            <textarea
              value={formData.mitigationPlan}
              onChange={(e) => setFormData({ ...formData, mitigationPlan: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Target Date</label>
            <input
              type="date"
              value={formData.targetDate}
              onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Create Risk Activity'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Create Actor Modal
// Edit Risk Activity Modal
export const EditRiskActivityModal: React.FC<any> = ({ activity, teamMembers, onClose }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    status: activity.status || 'Open',
    riskLevel: activity.riskLevel || 'Medium',
    mitigationPlan: activity.mitigationPlan || '',
    ownerId: activity.ownerId || '',
    targetDate: activity.targetDate ? new Date(activity.targetDate).toISOString().split('T')[0] : '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await api.aiRmf.updateRiskActivity(activity.id, {
        status: formData.status,
        riskLevel: formData.riskLevel,
        mitigationPlan: formData.mitigationPlan && formData.mitigationPlan.trim() ? formData.mitigationPlan : undefined,
        ownerId: formData.ownerId && formData.ownerId.trim() ? formData.ownerId : undefined,
        targetDate: formData.targetDate ? new Date(formData.targetDate) : undefined,
      });
      onClose();
    } catch (error: any) {
      console.error('Failed to update risk activity:', error);
      alert(`Failed to update risk activity: ${error.message || 'Unknown error'}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Update Risk Activity</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Activity Type</label>
            <div className="px-3 py-2 bg-gray-50 rounded-lg text-sm text-gray-700">
              {activity.activityType.replace(/_/g, ' ')}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <div className="px-3 py-2 bg-gray-50 rounded-lg text-sm text-gray-700">
              {activity.description}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status *</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              required
            >
              <option value="Open">Open</option>
              <option value="In_Progress">In Progress</option>
              <option value="Mitigated">Mitigated</option>
              <option value="Closed">Closed</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Risk Level *</label>
            <select
              value={formData.riskLevel}
              onChange={(e) => setFormData({ ...formData, riskLevel: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              required
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Mitigation Plan</label>
            <textarea
              value={formData.mitigationPlan}
              onChange={(e) => setFormData({ ...formData, mitigationPlan: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              rows={4}
              placeholder="Describe the mitigation plan..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Owner</label>
            <select
              value={formData.ownerId}
              onChange={(e) => setFormData({ ...formData, ownerId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">Unassigned</option>
              {teamMembers.map((member: any) => (
                <option key={member.id} value={member.id}>
                  {member.name || member.email}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Target Date</label>
            <input
              type="date"
              value={formData.targetDate}
              onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors disabled:opacity-50"
            >
              {submitting ? 'Updating...' : 'Update Risk Activity'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const CreateActorModal: React.FC<any> = ({ systemId, teamMembers, onClose }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    actorType: 'Developer',
    userId: '',
    name: '',
    role: '',
    responsibilities: [''],
    involvementStages: [] as string[],
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.role.trim()) {
      alert('Please provide name and role');
      return;
    }

    try {
      setSubmitting(true);
      await api.aiRmf.addActor(systemId, {
        ...formData,
        userId: formData.userId && formData.userId.trim() ? formData.userId : undefined,
        responsibilities: formData.responsibilities.filter(r => r.trim()),
        involvementStages: formData.involvementStages,
      });
      onClose();
    } catch (error: any) {
      console.error('Failed to create actor:', error);
      alert(`Failed to create actor: ${error.message || 'Unknown error'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const lifecycleStages = [
    'Plan_and_Design',
    'Collect_and_Process',
    'Build_and_Validate',
    'Deploy_and_Operate',
    'Monitor_and_Maintain',
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white">
          <h3 className="text-xl font-bold text-gray-900">Add AI Actor</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Actor Type</label>
            <select
              value={formData.actorType}
              onChange={(e) => setFormData({ ...formData, actorType: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="Developer">Developer</option>
              <option value="Operator">Operator</option>
              <option value="Evaluator">Evaluator</option>
              <option value="Decision_Maker">Decision Maker</option>
              <option value="End_User">End User</option>
              <option value="Regulator">Regulator</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">User (Optional)</label>
            <select
              value={formData.userId}
              onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">None</option>
              {teamMembers.map((member: any) => (
                <option key={member.id} value={member.id}>
                  {member.name || member.email}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Responsibilities</label>
            {formData.responsibilities.map((resp, idx) => (
              <input
                key={idx}
                type="text"
                value={resp}
                onChange={(e) => {
                  const newResps = [...formData.responsibilities];
                  newResps[idx] = e.target.value;
                  setFormData({ ...formData, responsibilities: newResps });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="Enter responsibility..."
              />
            ))}
            <button
              type="button"
              onClick={() => setFormData({ ...formData, responsibilities: [...formData.responsibilities, ''] })}
              className="text-sm text-brand-600 hover:text-brand-800"
            >
              + Add Responsibility
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Involvement Stages</label>
            <div className="space-y-2">
              {lifecycleStages.map((stage) => (
                <label key={stage} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.involvementStages.includes(stage)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({
                          ...formData,
                          involvementStages: [...formData.involvementStages, stage],
                        });
                      } else {
                        setFormData({
                          ...formData,
                          involvementStages: formData.involvementStages.filter(s => s !== stage),
                        });
                      }
                    }}
                    className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                  />
                  <span className="text-sm text-gray-700">{stage.replace(/_/g, ' ')}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors disabled:opacity-50"
            >
              {submitting ? 'Adding...' : 'Add Actor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

