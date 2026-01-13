import React, { useState } from 'react';
import { generatePhishingSim } from '../../services/geminiService';
import { Mail, Loader2, ArrowLeft, RefreshCw, AlertTriangle, X, MessageSquare, HelpCircle } from 'lucide-react';
import { api } from '../../services/api';

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
  const [type, setType] = useState<'Email' | 'Spear' | 'Smishing'>('Email');
  const [department, setDepartment] = useState('Finance');
  const [theme, setTheme] = useState('Urgent Invoice');
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [scenario, setScenario] = useState('');
  const [questions, setQuestions] = useState<Array<{question: string; answer: string; explanation: string}>>([]);
  const [showAnswers, setShowAnswers] = useState<{[key: number]: boolean}>({});
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
    setScenario('');
    setQuestions([]);
    setShowAnswers({});

    try {
      const result = await api.ai.generatePhishing(type, theme, department, difficulty);
      setScenario(result.scenario || result.email || '');
      setQuestions(result.questions || []);
    } catch (err: any) {
      const errorMessage = err.message || 'AI generation failed. Please try again.';
      setError(errorMessage);
      setScenario('');
      setQuestions([]);
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
           <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type of Phishing <span className="text-red-500">*</span>
              </label>
              <select
                value={type}
                onChange={e => {
                  setType(e.target.value as 'Email' | 'Spear' | 'Smishing');
                  setError(null);
                }}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
              >
                <option value="Email">Email</option>
                <option value="Spear">Spear Phishing</option>
                <option value="Smishing">Smishing (SMS)</option>
              </select>
           </div>
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
           <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Difficulty Level <span className="text-red-500">*</span>
              </label>
              <select
                value={difficulty}
                onChange={e => {
                  setDifficulty(e.target.value as 'Easy' | 'Medium' | 'Hard');
                  setError(null);
                }}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
           </div>
        </div>
        <div className="flex justify-end">
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="bg-brand-600 text-white px-6 py-2 rounded-lg hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
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
        {scenario && (
          <div className="space-y-6">
            <div className="border border-gray-200 rounded-xl p-6 bg-gray-50 font-mono text-sm whitespace-pre-wrap">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-gray-800">
                  Generated {type === 'Smishing' ? 'SMS' : 'Phishing'} {type === 'Email' ? 'Email' : type === 'Spear' ? 'Email (Spear)' : 'Message'}
                </h3>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(scenario);
                  }}
                  className="text-sm text-brand-600 hover:text-brand-800"
                >
                  Copy
                </button>
              </div>
              {scenario}
            </div>

            {questions.length > 0 && (
              <div className="border border-gray-200 rounded-xl p-6 bg-white">
                <div className="flex items-center gap-2 mb-4">
                  <HelpCircle className="text-brand-600" size={20} />
                  <h3 className="font-semibold text-gray-800">Training Questions</h3>
                </div>
                <div className="space-y-4">
                  {questions.map((q, index) => (
                    <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="font-medium text-gray-900 mb-2">{index + 1}. {q.question}</p>
                      {showAnswers[index] ? (
                        <div className="mt-3 space-y-2">
                          <div className="p-3 bg-green-50 border border-green-200 rounded">
                            <p className="text-sm font-medium text-green-800">Answer:</p>
                            <p className="text-sm text-green-700">{q.answer}</p>
                          </div>
                          <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                            <p className="text-sm font-medium text-blue-800">Explanation:</p>
                            <p className="text-sm text-blue-700">{q.explanation}</p>
                          </div>
                          <button
                            onClick={() => setShowAnswers({...showAnswers, [index]: false})}
                            className="text-sm text-gray-600 hover:text-gray-800"
                          >
                            Hide Answer
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setShowAnswers({...showAnswers, [index]: true})}
                          className="mt-2 text-sm text-brand-600 hover:text-brand-800 font-medium"
                        >
                          Show Answer
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
