import React from 'react';
import { MOCK_RISKS } from '../constants';
import { ViewState } from '../types';
import { ArrowLeft, AlertTriangle, AlertCircle, Info, Filter, MoreHorizontal, CheckSquare } from 'lucide-react';

interface RiskManagementProps {
  onBack: () => void;
}

export const RiskManagement: React.FC<RiskManagementProps> = ({ onBack }) => {
  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Risk Management</h2>
            <p className="text-sm text-gray-500">Identify, assess, and mitigate compliance risks.</p>
          </div>
        </div>
        <button className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700">
          Run Risk Assessment
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="bg-red-100 p-3 rounded-lg text-red-600">
            <AlertTriangle size={24} />
          </div>
          <div>
             <h3 className="text-2xl font-bold text-gray-900">3</h3>
             <p className="text-sm text-gray-500">High Severity Risks</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="bg-yellow-100 p-3 rounded-lg text-yellow-600">
            <AlertCircle size={24} />
          </div>
          <div>
             <h3 className="text-2xl font-bold text-gray-900">12</h3>
             <p className="text-sm text-gray-500">Medium Severity Risks</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="bg-blue-100 p-3 rounded-lg text-blue-600">
            <Info size={24} />
          </div>
          <div>
             <h3 className="text-2xl font-bold text-gray-900">8</h3>
             <p className="text-sm text-gray-500">Low Severity Risks</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
           <h3 className="font-semibold text-gray-800">Risk Register</h3>
           <div className="flex space-x-2">
             <button className="p-2 text-gray-500 hover:text-brand-600 bg-white border border-gray-200 rounded-lg">
                <Filter size={16} />
             </button>
           </div>
        </div>
        
        <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-3 font-medium">Risk Description</th>
                <th className="px-6 py-3 font-medium">Category</th>
                <th className="px-6 py-3 font-medium">Severity</th>
                <th className="px-6 py-3 font-medium">Detected</th>
                <th className="px-6 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
               {MOCK_RISKS.map((risk) => (
                  <tr key={risk.id} className="hover:bg-gray-50 group">
                    <td className="px-6 py-4">
                       <p className="font-medium text-gray-900">{risk.description}</p>
                    </td>
                    <td className="px-6 py-4 text-gray-500">{risk.category}</td>
                    <td className="px-6 py-4">
                       <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                         risk.severity === 'High' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                       }`}>
                         {risk.severity}
                       </span>
                    </td>
                    <td className="px-6 py-4 text-gray-400">{risk.detectedAt}</td>
                    <td className="px-6 py-4 text-right">
                       <button className="text-brand-600 font-medium hover:text-brand-800 flex items-center justify-end ml-auto">
                          Remediate <CheckSquare size={16} className="ml-1" />
                       </button>
                    </td>
                  </tr>
               ))}
               {/* Mock extra rows */}
               <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">MFA not enabled for 2 admin accounts</td>
                  <td className="px-6 py-4 text-gray-500">Access Control</td>
                  <td className="px-6 py-4"><span className="bg-red-100 text-red-800 px-2.5 py-0.5 rounded-full text-xs font-medium">High</span></td>
                  <td className="px-6 py-4 text-gray-400">5 hours ago</td>
                  <td className="px-6 py-4 text-right"><button className="text-brand-600 font-medium hover:text-brand-800 flex items-center justify-end ml-auto">Remediate <CheckSquare size={16} className="ml-1" /></button></td>
               </tr>
            </tbody>
        </table>
      </div>
    </div>
  );
};