import React, { useState } from 'react';
import { api } from '../services/api';
import { ArrowLeft, Brain, Save, X } from 'lucide-react';
import { toast } from 'sonner';
import { useI18n } from '../contexts/I18nContext';

interface AISystemCreateProps {
  onBack: () => void;
  onSuccess: (systemId: string) => void;
}

export const AISystemCreate: React.FC<AISystemCreateProps> = ({ onBack, onSuccess }) => {
  const { t } = useI18n();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    systemType: 'Machine Learning',
    useCase: '',
    deploymentContext: '',
    lifecycleStage: 'Plan_and_Design',
    autonomyLevel: 'Human_in_Loop',
    metadata: {},
  });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    if (!formData.systemType.trim()) {
      newErrors.systemType = 'System type is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setSubmitting(true);
      const system = await api.aiRmf.createAISystem(formData);
      onSuccess((system as any).id);
    } catch (error: any) {
      console.error('Failed to create AI system:', error);
      toast.error(`Failed to create AI system: ${error.message || 'Unknown error'}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex items-center space-x-3">
          <Brain className="text-brand-600" size={28} />
          <h2 className="text-2xl font-bold text-gray-900">{t('common.create')} AI System</h2>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Name */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('common.name')} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                errors.name ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="e.g., Medical Diagnosis AI System"
            />
            {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
          </div>

          {/* System Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('common.type')} <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.systemType}
              onChange={(e) => setFormData({ ...formData, systemType: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                errors.systemType ? 'border-red-300' : 'border-gray-300'
              }`}
            >
              <option value="Machine Learning">Machine Learning</option>
              <option value="Generative AI">Generative AI</option>
              <option value="Decision Support">Decision Support</option>
              <option value="Natural Language Processing">Natural Language Processing</option>
              <option value="Computer Vision">Computer Vision</option>
              <option value="Robotics">Robotics</option>
              <option value="Other">Other</option>
            </select>
            {errors.systemType && <p className="text-sm text-red-500 mt-1">{errors.systemType}</p>}
          </div>

          {/* Deployment Context */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Deployment Context
            </label>
            <select
              value={formData.deploymentContext}
              onChange={(e) => setFormData({ ...formData, deploymentContext: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">Select...</option>
              <option value="Healthcare">Healthcare</option>
              <option value="Finance">Finance</option>
              <option value="Manufacturing">Manufacturing</option>
              <option value="Retail">Retail</option>
              <option value="Education">Education</option>
              <option value="Government">Government</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Lifecycle Stage */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Lifecycle Stage
            </label>
            <select
              value={formData.lifecycleStage}
              onChange={(e) => setFormData({ ...formData, lifecycleStage: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="Plan_and_Design">Plan and Design</option>
              <option value="Collect_and_Process">Collect and Process</option>
              <option value="Build_and_Validate">Build and Validate</option>
              <option value="Deploy_and_Operate">Deploy and Operate</option>
              <option value="Monitor_and_Maintain">Monitor and Maintain</option>
            </select>
          </div>

          {/* Autonomy Level */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Autonomy Level
            </label>
            <select
              value={formData.autonomyLevel}
              onChange={(e) => setFormData({ ...formData, autonomyLevel: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="Fully_Autonomous">Fully Autonomous</option>
              <option value="Human_in_Loop">Human in Loop</option>
              <option value="Human_Override">Human Override</option>
              <option value="Fully_Manual">Fully Manual</option>
            </select>
          </div>

          {/* Description */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('common.description')}
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              rows={3}
              placeholder="Describe the AI system, its purpose, and key characteristics..."
            />
          </div>

          {/* Use Case */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Use Case
            </label>
            <textarea
              value={formData.useCase}
              onChange={(e) => setFormData({ ...formData, useCase: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              rows={2}
              placeholder="Describe the specific use case for this AI system..."
            />
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> When you create an AI system, the following will be automatically initialized:
          </p>
          <ul className="list-disc list-inside text-sm text-blue-700 mt-2 space-y-1">
            <li>All 4 core functions (GOVERN, MAP, MEASURE, MANAGE)</li>
            <li>All categories and subcategories for each function</li>
            <li>All 7 trustworthiness characteristics</li>
            <li>All 5 lifecycle stages</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center space-x-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <X size={18} />
            <span>{t('common.cancel')}</span>
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center space-x-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={18} />
            <span>{submitting ? `${t('common.loading')}...` : `${t('common.save')}`}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

