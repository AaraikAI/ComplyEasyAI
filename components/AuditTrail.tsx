import React, { useState } from 'react';
import { MOCK_AUDIT_LOGS } from '../constants';
import { ShieldCheck, Search, Filter, Download } from 'lucide-react';

export const AuditTrail: React.FC = () => {
  const [filterText, setFilterText] = useState('');

  const filteredLogs = MOCK_AUDIT_LOGS.filter(log => 
    log.action.toLowerCase().includes(filterText.toLowerCase()) ||
    log.user.toLowerCase().includes(filterText.toLowerCase()) ||
    log.hash.toLowerCase().includes(filterText.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Immutable Audit Logs</h2>
          <p className="text-sm text-gray-500">Blockchain-verified activity history for compliance evidence.</p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
             <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
             <input 
              type="text" 
              placeholder="Search logs..." 
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 w-full sm:w-64"
            />
          </div>
          <button className="flex items-center space-x-2 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm hover:bg-brand-700 transition-colors">
             <Download size={16} />
             <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 font-medium">Timestamp</th>
                <th className="px-6 py-4 font-medium">User / Agent</th>
                <th className="px-6 py-4 font-medium">Action</th>
                <th className="px-6 py-4 font-medium">Verification Hash</th>
                <th className="px-6 py-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredLogs.length > 0 ? filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-gray-600 font-medium whitespace-nowrap">{log.timestamp}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center mr-2 text-xs font-bold text-slate-600">
                        {log.user.charAt(0)}
                      </div>
                      <span className="text-gray-900">{log.user}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-800">{log.action}</td>
                  <td className="px-6 py-4 font-mono text-xs text-brand-600 bg-brand-50 w-fit px-2 rounded cursor-help" title="Verified on Ethereum Sepolia Testnet">
                    {log.hash}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <ShieldCheck size={12} className="mr-1" /> Verified
                    </span>
                  </td>
                </tr>
              )) : (
                 <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                       No audit logs found matching your criteria.
                    </td>
                 </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-center">
            <span className="text-xs text-gray-400">Showing recent activity. Older logs archived on-chain.</span>
        </div>
      </div>
    </div>
  );
};
