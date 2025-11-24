import React, { useState } from 'react';
import { ComplianceFramework, ComplianceStatus, ViewState } from '../types';
import { ArrowLeft, CheckCircle, Circle, FileText, Upload, AlertTriangle, Loader2 } from 'lucide-react';
import { classifyEvidence } from '../services/geminiService';

interface FrameworkDetailsProps {
  framework: ComplianceFramework | undefined;
  onBack: () => void;
}

export const FrameworkDetails: React.FC<FrameworkDetailsProps> = ({ framework, onBack }) => {
  if (!framework) return <div>Framework not found</div>;

  const [analyzingFile, setAnalyzingFile] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);

  const controls = [
    { id: 'c1', name: 'Access Control Policy', status: 'Compliant', evidence: 'policy_v2.pdf' },
    { id: 'c2', name: 'Data Encryption (At Rest)', status: 'Compliant', evidence: 'aws_config.json' },
    { id: 'c3', name: 'Incident Response Plan', status: 'At Risk', evidence: 'Missing updated contact list' },
    { id: 'c4', name: 'Vendor Risk Assessment', status: 'In Review', evidence: 'Pending approval' },
    { id: 'c5', name: 'Employee Training', status: 'Compliant', evidence: 'training_logs.csv' },
  ];

  const handleMockUpload = async () => {
    const filename = "penetration_test_2024.pdf";
    setAnalyzingFile(filename);
    setAnalysisResult(null);
    const result = await classifyEvidence(filename);
    setAnalysisResult(result);
    setAnalyzingFile(null);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <button 
        onClick={onBack}
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
             <div className="text-3xl font-bold text-brand-600">{framework.progress}%</div>
             <div className="text-sm text-gray-400">Readiness Score</div>
          </div>
        </div>

        <div className="mt-8 w-full bg-gray-100 rounded-full h-3">
          <div 
            className="bg-brand-500 h-3 rounded-full transition-all duration-1000" 
            style={{ width: `${framework.progress}%` }}
          ></div>
        </div>
      </div>

      {/* AI Analysis Result Toast */}
      {analysisResult && (
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg flex items-center justify-between text-blue-800 animate-fadeIn">
           <span className="font-medium">AI Analysis: File likely maps to "{analysisResult}"</span>
           <button onClick={() => setAnalysisResult(null)} className="text-blue-500 hover:text-blue-700"><Circle size={16}/></button>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
          <h3 className="font-semibold text-gray-800">Controls & Evidence</h3>
          <div className="flex space-x-2">
            <button 
              onClick={handleMockUpload} 
              disabled={!!analyzingFile}
              className="text-sm bg-brand-600 text-white px-3 py-1.5 rounded-lg hover:bg-brand-700 flex items-center shadow-sm"
            >
              {analyzingFile ? <Loader2 className="animate-spin mr-2" size={14}/> : <Upload className="mr-2" size={14}/>}
              {analyzingFile ? 'AI Analyzing...' : 'Smart Upload'}
            </button>
          </div>
        </div>
        <div className="divide-y divide-gray-100">
          {controls.map((control) => (
            <div key={control.id} className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between">
              <div className="flex items-start space-x-4">
                <div className={`mt-1 ${
                  control.status === 'Compliant' ? 'text-green-500' : 
                  control.status === 'At Risk' ? 'text-red-500' : 'text-yellow-500'
                }`}>
                  {control.status === 'Compliant' ? <CheckCircle size={20} /> : 
                   control.status === 'At Risk' ? <AlertTriangle size={20} /> : <Circle size={20} />}
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">{control.name}</h4>
                  <p className="text-sm text-gray-500 flex items-center mt-1">
                    <FileText size={14} className="mr-1" />
                    {control.evidence}
                  </p>
                </div>
              </div>
              <button className="p-2 text-gray-400 hover:text-brand-600 transition-colors">
                <Upload size={18} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};