import React, { useState } from 'react';
import { AVAILABLE_FRAMEWORKS } from '../constants';
import { ComplianceFramework, ComplianceStatus } from '../types';
import { CheckCircle, AlertTriangle, Clock, ArrowRight, Plus, X, Search } from 'lucide-react';

interface FrameworksProps {
  activeFrameworks: ComplianceFramework[];
  onAddFramework: (name: string, region?: string) => void;
  onSelectFramework: (id: string) => void;
}

export const Frameworks: React.FC<FrameworksProps> = ({ activeFrameworks, onAddFramework, onSelectFramework }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

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
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-2 bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 transition-colors shadow-sm"
        >
          <Plus size={18} />
          <span>Add Framework</span>
        </button>
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
                  <span className="text-gray-500">Readiness</span>
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
                <span>Audit Due: {fw.nextAuditDate}</span>
                <button 
                  onClick={() => onSelectFramework(fw.id)}
                  className="text-brand-600 hover:text-brand-800 font-medium flex items-center"
                >
                  Manage <ArrowRight size={16} className="ml-1" />
                </button>
              </div>
            </div>
          </div>
        ))}
        
        {/* Add New Framework Card (Quick Action) */}
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

      {/* Modal */}
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