import React, { useState } from 'react';
import { generatePhishingSim } from '../../services/geminiService';
import { Mail, Loader2, ArrowLeft, RefreshCw, AlertTriangle, X } from 'lucide-react';

const DEPARTMENTS = [
  'Finance',
  'HR',
  'Engineering',
  'Sales',
  'Marketing',
  'Operations',
  'IT',
  'Legal',
  'Customer Support',
  'Executive',
  'Product',
  'Security',
];

const PHISHING_THEMES = [
  'Urgent Invoice',
  'Password Reset',
  'Security Alert',
  'Account Suspension',
  'Payment Request',
  'CEO Impersonation',
  'Vendor Payment',
  'Tax Document',
  'Benefits Update',
  'System Maintenance',
  'Compliance Notice',
  'Contract Review',
  'Meeting Request',
  'File Sharing',
  'Expense Approval',
];

export const PhishingGenerator: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [department, setDepartment] = useState('Finance');
  const [theme, setTheme] = useState('Urgent Invoice');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    // Validation
    if (!DEPARTMENTS.includes(department)) {
      setError('Invalid department selected');
      return;
    }

    if (!theme || theme.trim().length === 0) {
      setError('Please select a theme');
      return;
    }

    setError(null);
    setLoading(true);
    setResult('');

    try {
      const text = await generatePhishingSim(theme, department);
      setResult(text);
    } catch (err: any) {
      const errorMessage = err.message || 'AI generation failed. Please try again.';
      setError(errorMessage);
      setResult('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex items-center space-x-4">
        <button onClick={onBack} className="p-2 hover:bg-gray-200 rounded-full"><ArrowLeft size={20}/></button>
        <h2 className="text-2xl font-bold">Phishing Simulator</h2>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
          <AlertTriangle className="text-red-600 mr-3 flex-shrink-0 mt-0.5" size={20} />
          <div className="flex-1">
            <p className="text-red-800 font-medium">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="text-red-600 hover:text-red-800">
            <X size={18} />
          </button>
        </div>
      )}

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
           <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Target Department <span className="text-red-500">*</span>
              </label>
              <select
                value={department}
                onChange={e => {
                  setDepartment(e.target.value);
                  setError(null);
                }}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
              >
                {DEPARTMENTS.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
           </div>
           <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Scenario Theme <span className="text-red-500">*</span>
              </label>
              <select
                value={theme}
                onChange={e => {
                  setTheme(e.target.value);
                  setError(null);
                }}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
              >
                {PHISHING_THEMES.map(th => (
                  <option key={th} value={th}>{th}</option>
                ))}
              </select>
           </div>
           <div className="flex items-end">
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="w-full bg-brand-600 text-white py-2 rounded-lg hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
              >
                 {loading ? (
                   <>
                     <Loader2 className="animate-spin mr-2" />
                     Generating...
                   </>
                 ) : (
                   <>
                     <Mail className="mr-2" size={18} />
                     Generate Campaign
                   </>
                 )}
              </button>
           </div>
        </div>
        {result && (
           <div className="border border-gray-200 rounded-xl p-6 bg-gray-50 font-mono text-sm whitespace-pre-wrap">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-gray-800">Generated Phishing Email</h3>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(result);
                  }}
                  className="text-sm text-brand-600 hover:text-brand-800"
                >
                  Copy
                </button>
              </div>
              {result}
           </div>
        )}
      </div>
    </div>
  );
};
