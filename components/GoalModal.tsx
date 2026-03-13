/**
 * Comprehensive Goals Management Modal
 * 
 * Features:
 * - Create goal with validation
 * - Update goal target score
 * - Delete/restore goals
 * - Filter by status/framework
 * - Deadline validation
 */

import React, { useState, useEffect } from 'react';
import { X, Calendar, Target, AlertCircle, CheckCircle } from 'lucide-react';
import { AVAILABLE_FRAMEWORKS } from '../constants';
import { api } from '../services/api';
import { toast } from 'sonner';
import { useI18n } from '../contexts/I18nContext';

interface GoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  goal?: any; // For editing
}

export const GoalModal: React.FC<GoalModalProps> = ({ isOpen, onClose, onSuccess, goal }) => {
  const { t } = useI18n();
  const [formData, setFormData] = useState({
    goalType: 'maintain' as 'maintain' | 'achieve' | 'improve',
    frameworks: [] as string[],
    riskTolerance: 'medium' as 'low' | 'medium' | 'high',
    horizon: 90,
    autoActionPolicy: 'moderate' as 'conservative' | 'moderate' | 'aggressive',
    targetScore: 85,
    deadline: '',
    name: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [availableFrameworks, setAvailableFrameworks] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      // Load available frameworks
      loadFrameworks();
      
      // If editing, populate form
      if (goal) {
        setFormData({
          goalType: goal.goalType || 'maintain',
          frameworks: goal.frameworks || [],
          riskTolerance: goal.riskTolerance || 'medium',
          horizon: goal.horizon || 90,
          autoActionPolicy: goal.autoActionPolicy || 'moderate',
          targetScore: goal.targetScore || 85,
          deadline: goal.deadline || '',
          name: goal.name || '',
        });
      } else {
        // Reset form for new goal
        setFormData({
          goalType: 'maintain',
          frameworks: [],
          riskTolerance: 'medium',
          horizon: 90,
          autoActionPolicy: 'moderate',
          targetScore: 85,
          deadline: '',
          name: '',
        });
      }
      setErrors({});
    }
  }, [isOpen, goal]);

  const loadFrameworks = async () => {
    try {
      const frameworks = await api.frameworks.list();
      setAvailableFrameworks(frameworks.map((f: any) => f.name));
    } catch (error) {
      console.error('Error loading frameworks:', error);
      // Fallback to constants
      setAvailableFrameworks(AVAILABLE_FRAMEWORKS.map(f => f.name));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Name validation
    if (!formData.name || formData.name.trim() === '') {
      newErrors.name = 'Goal name is required';
    } else if (formData.name.length > 500) {
      newErrors.name = 'Goal name must be 500 characters or less';
    }

    // Deadline validation
    if (formData.deadline) {
      const deadlineDate = new Date(formData.deadline);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (deadlineDate < today) {
        newErrors.deadline = 'Deadline must be in the future';
      }
    }

    // Framework validation
    if (formData.frameworks.length === 0) {
      newErrors.frameworks = 'At least one framework must be selected';
    }

    // Target score validation
    if (formData.targetScore < 0 || formData.targetScore > 100) {
      newErrors.targetScore = 'Target score must be between 0 and 100';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const goalData = {
        ...formData,
        horizon: parseInt(formData.horizon.toString()),
        targetScore: parseInt(formData.targetScore.toString()),
      };

      if (goal) {
        // Update existing goal
        await api.acos.updateGoal(goal.id, goalData);
      } else {
        // Create new goal
        await api.acos.createGoal(goalData);
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error saving goal:', error);
      toast.error(`Failed to ${goal ? 'update' : 'create'} goal: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFrameworkToggle = (framework: string) => {
    setFormData(prev => ({
      ...prev,
      frameworks: prev.frameworks.includes(framework)
        ? prev.frameworks.filter(f => f !== framework)
        : [...prev.frameworks, framework],
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            {goal ? 'Edit Compliance Goal' : 'Create Compliance Goal'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Goal Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Goal Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="e.g., Maintain SOC 2 Type II compliance"
              maxLength={500}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle size={14} className="mr-1" />
                {errors.name}
              </p>
            )}
          </div>

          {/* Goal Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Goal Type <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.goalType}
              onChange={(e) => setFormData({ ...formData, goalType: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="maintain">Maintain</option>
              <option value="achieve">Achieve</option>
              <option value="improve">Improve</option>
            </select>
          </div>

          {/* Frameworks */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Frameworks <span className="text-red-500">*</span>
            </label>
            <div className="border border-gray-300 rounded-lg p-3 max-h-48 overflow-y-auto">
              {availableFrameworks.length === 0 ? (
                <p className="text-sm text-gray-500">{t('common.loading')}</p>
              ) : (
                <div className="space-y-2">
                  {availableFrameworks.map((framework) => (
                    <label key={framework} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.frameworks.includes(framework)}
                        onChange={() => handleFrameworkToggle(framework)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{framework}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
            {errors.frameworks && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle size={14} className="mr-1" />
                {errors.frameworks}
              </p>
            )}
          </div>

          {/* Risk Tolerance */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Risk Tolerance <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.riskTolerance}
              onChange={(e) => setFormData({ ...formData, riskTolerance: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          {/* Horizon */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Time Horizon (days) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={formData.horizon}
              onChange={(e) => setFormData({ ...formData, horizon: parseInt(e.target.value) || 90 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              min="1"
              max="3650"
            />
          </div>

          {/* Target Score */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target Score (%) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={formData.targetScore}
              onChange={(e) => setFormData({ ...formData, targetScore: parseInt(e.target.value) || 85 })}
              className={`w-full px-3 py-2 border rounded-lg ${
                errors.targetScore ? 'border-red-500' : 'border-gray-300'
              }`}
              min="0"
              max="100"
            />
            {errors.targetScore && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle size={14} className="mr-1" />
                {errors.targetScore}
              </p>
            )}
          </div>

          {/* Auto Action Policy */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Auto Action Policy <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.autoActionPolicy}
              onChange={(e) => setFormData({ ...formData, autoActionPolicy: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="conservative">Conservative</option>
              <option value="moderate">Moderate</option>
              <option value="aggressive">Aggressive</option>
            </select>
          </div>

          {/* Deadline */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Deadline (Optional)
            </label>
            <div className="relative">
              <input
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
                className={`w-full px-3 py-2 border rounded-lg ${
                  errors.deadline ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              <Calendar className="absolute right-3 top-2.5 text-gray-400" size={20} />
            </div>
            {errors.deadline && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle size={14} className="mr-1" />
                {errors.deadline}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? t('common.loading') : goal ? t('common.save') : t('common.create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

