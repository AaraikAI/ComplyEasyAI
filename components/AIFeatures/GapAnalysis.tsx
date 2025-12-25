import React, { useState, useEffect } from 'react';
import { performGapAnalysis } from '../../services/geminiService';
import { ArrowLeft, Loader2, GitMerge, AlertTriangle, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { AVAILABLE_FRAMEWORKS } from '../../constants';
import { api } from '../../services/api';

export const GapAnalysis: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [currentFrameworks, setCurrentFrameworks] = useState<string[]>([]);
  const [targetFrameworks, setTargetFrameworks] = useState<string[]>([]);
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userFrameworks, setUserFrameworks] = useState<any[]>([]);
  const [loadingFrameworks, setLoadingFrameworks] = useState(true);

  useEffect(() => {
    const loadUserFrameworks = async () => {
      try {
        setLoadingFrameworks(true);
        const frameworks = await api.frameworks.list();
        setUserFrameworks(frameworks);
      } catch (error) {
        console.error('Failed to load frameworks:', error);
      } finally {
        setLoadingFrameworks(false);
      }
    };
    loadUserFrameworks();
  }, []);

  const handleCurrentFrameworkToggle = (frameworkName: string) => {
    setCurrentFrameworks(prev => {
      if (prev.includes(frameworkName)) {
        return prev.filter(f => f !== frameworkName);
      } else {
        return [...prev, frameworkName];
      }
    });
    setError(null);
  };

  const handleTargetFrameworkToggle = (frameworkName: string) => {
    setTargetFrameworks(prev => {
      if (prev.includes(frameworkName)) {
        return prev.filter(f => f !== frameworkName);
      } else {
        return [...prev, frameworkName];
      }
    });
    setError(null);
  };

  const handleRun = async () => {
    // Validation
    if (currentFrameworks.length === 0) {
      setError('Please select at least one current framework');
      return;
    }

    if (targetFrameworks.length === 0) {
      setError('Please select at least one target framework');
      return;
    }

    // Check for same framework in both
    const sameFrameworks = currentFrameworks.filter(f => targetFrameworks.includes(f));
    if (sameFrameworks.length > 0) {
      setError(`Cannot select the same framework in both lists: ${sameFrameworks.join(', ')}`);
      return;
    }

    setError(null);
    setLoading(true);
    setResult('');

    try {
      // Set timeout for analysis (30 seconds)
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Analysis timeout. The gap analysis is taking too long. Please try with fewer frameworks.')), 30000);
      });

      const analysisPromise = performGapAnalysis(currentFrameworks, targetFrameworks);
      
      const text = await Promise.race([analysisPromise, timeoutPromise]) as string;
      setResult(text);
    } catch (err: any) {
      const errorMessage = err.message || 'Gap analysis failed. Please try again.';
      setError(errorMessage);
      setResult('');
    } finally {
      setLoading(false);
    }
  };

  const availableFrameworkNames = AVAILABLE_FRAMEWORKS.map(f => f.name);
  const userFrameworkNames = userFrameworks.map(f => f.name);

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex items-center space-x-4">
        <button onClick={onBack} className="p-2 hover:bg-gray-200 rounded-full"><ArrowLeft size={20}/></button>
        <h2 className="text-2xl font-bold">Compliance Gap Analysis</h2>
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

      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Current Frameworks */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Frameworks <span className="text-red-500">*</span>
            </label>
            <div className="border border-gray-300 rounded-lg p-3 min-h-[200px] max-h-[300px] overflow-y-auto">
              {loadingFrameworks ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="animate-spin text-brand-600" size={20} />
                  <span className="ml-2 text-gray-600">Loading frameworks...</span>
                </div>
              ) : (
                <>
                  {userFrameworkNames.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-medium text-gray-500 mb-2">Your Frameworks:</p>
                      {userFrameworkNames.map((fwName) => (
                        <label key={fwName} className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer">
                          <input
                            type="checkbox"
                            checked={currentFrameworks.includes(fwName)}
                            onChange={() => handleCurrentFrameworkToggle(fwName)}
                            className="mr-2"
                          />
                          <span className="text-sm">{fwName}</span>
                        </label>
                      ))}
                    </div>
                  )}
                  <div className={userFrameworkNames.length > 0 ? 'border-t pt-4' : ''}>
                    <p className="text-xs font-medium text-gray-500 mb-2">All Available Frameworks:</p>
                    <div className="space-y-1">
                      {availableFrameworkNames.map((fwName) => (
                        <label key={fwName} className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer">
                          <input
                            type="checkbox"
                            checked={currentFrameworks.includes(fwName)}
                            onChange={() => handleCurrentFrameworkToggle(fwName)}
                            className="mr-2"
                          />
                          <span className="text-sm">{fwName}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
            {currentFrameworks.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {currentFrameworks.map(fw => (
                  <span key={fw} className="inline-flex items-center px-2 py-1 bg-brand-100 text-brand-800 rounded text-xs">
                    {fw}
                    <button
                      onClick={() => handleCurrentFrameworkToggle(fw)}
                      className="ml-1 hover:text-brand-900"
                    >
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Arrow */}
          <div className="flex items-center justify-center lg:justify-start">
            <GitMerge size={32} className="text-gray-400 rotate-90 lg:rotate-0" />
          </div>

          {/* Target Frameworks */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target Frameworks <span className="text-red-500">*</span>
            </label>
            <div className="border border-gray-300 rounded-lg p-3 min-h-[200px] max-h-[300px] overflow-y-auto">
              <div className="space-y-1">
                {availableFrameworkNames.map((fwName) => (
                  <label key={fwName} className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={targetFrameworks.includes(fwName)}
                      onChange={() => handleTargetFrameworkToggle(fwName)}
                      className="mr-2"
                    />
                    <span className="text-sm">{fwName}</span>
                  </label>
                ))}
              </div>
            </div>
            {targetFrameworks.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {targetFrameworks.map(fw => (
                  <span key={fw} className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                    {fw}
                    <button
                      onClick={() => handleTargetFrameworkToggle(fw)}
                      className="ml-1 hover:text-green-900"
                    >
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleRun}
            disabled={loading || currentFrameworks.length === 0 || targetFrameworks.length === 0}
            className="bg-brand-600 text-white px-6 py-3 rounded-lg hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin mr-2" />
                Analyzing...
              </>
            ) : (
              'Run Gap Analysis'
            )}
          </button>
        </div>

        {result && (
          <div className="mt-8 p-6 bg-gray-50 rounded-xl border border-gray-200">
            <div className="prose prose-sm max-w-none">
              <ReactMarkdown>{result}</ReactMarkdown>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
