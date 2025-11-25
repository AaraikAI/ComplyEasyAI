
import React from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { Shield, AlertTriangle, CheckCircle, TrendingUp, ChevronRight } from 'lucide-react';
import { MOCK_RISKS } from '../constants';
import { ComplianceFramework, ViewState } from '../types';

interface DashboardProps {
  frameworks: ComplianceFramework[];
  onNavigate: (view: ViewState) => void;
}

const data = [
  { name: 'Jan', score: 65 },
  { name: 'Feb', score: 72 },
  { name: 'Mar', score: 78 },
  { name: 'Apr', score: 85 },
  { name: 'May', score: 82 },
  { name: 'Jun', score: 91 },
];

export const Dashboard: React.FC<DashboardProps> = ({ frameworks, onNavigate }) => {
  const avgScore = Math.round(frameworks.reduce((acc, fw) => acc + fw.progress, 0) / (frameworks.length || 1));
  const activeCount = frameworks.length;
  const criticalRiskCount = MOCK_RISKS.filter(r => r.severity === 'High').length;
  const upcomingAudit = frameworks.sort((a, b) => new Date(a.nextAuditDate).getTime() - new Date(b.nextAuditDate).getTime())[0];
  const auditDays = upcomingAudit ? Math.ceil((new Date(upcomingAudit.nextAuditDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24)) : 0;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Compliance Score</p>
              <h3 className="text-3xl font-bold text-gray-900 mt-1">{avgScore}%</h3>
            </div>
            <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center">
              <Shield className="text-green-600" size={24} />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <TrendingUp className="text-green-500 mr-1" size={16} />
            <span className="text-green-600 font-medium">+4%</span>
            <span className="text-gray-400 ml-2">vs last month</span>
          </div>
        </div>

        <div 
          onClick={() => onNavigate('risks')}
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 group-hover:text-red-600 transition-colors">Critical Risks</p>
              <h3 className="text-3xl font-bold text-gray-900 mt-1">{criticalRiskCount}</h3>
            </div>
            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center group-hover:bg-red-100 transition-colors">
              <AlertTriangle className="text-red-600" size={24} />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-red-600 font-medium flex items-center">Action Required <ChevronRight size={14} className="ml-1" /></span>
          </div>
        </div>

        <div 
          onClick={() => onNavigate('frameworks')}
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 group-hover:text-brand-600 transition-colors">Active Frameworks</p>
              <h3 className="text-3xl font-bold text-gray-900 mt-1">{activeCount}</h3>
            </div>
            <div className="w-12 h-12 bg-brand-50 rounded-full flex items-center justify-center group-hover:bg-brand-100 transition-colors">
              <CheckCircle className="text-brand-600" size={24} />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-gray-500 truncate max-w-[150px]">{frameworks.map(f => f.name).join(', ')}</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Upcoming Audit</p>
              <h3 className="text-3xl font-bold text-gray-900 mt-1">{upcomingAudit ? `${Math.abs(auditDays)}d` : '-'}</h3>
            </div>
            <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center">
              <Shield className="text-purple-600" size={24} />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-gray-500">{upcomingAudit ? upcomingAudit.name : 'No audits pending'}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-6">Compliance Readiness Trend</h3>
          {/* Added min-height to parent container to fix recharts rendering issue */}
          <div className="h-72 w-full min-h-[300px]">
            <ResponsiveContainer width="99%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="score" stroke="#0ea5e9" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Risks */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4">
             <h3 className="text-lg font-bold text-gray-800">Priority Actions</h3>
             <button onClick={() => onNavigate('risks')} className="text-sm text-brand-600 font-medium hover:text-brand-800">View All</button>
          </div>
          <div className="space-y-4">
            {MOCK_RISKS.map((risk) => (
              <div 
                key={risk.id} 
                onClick={() => onNavigate('risks')}
                className="p-3 bg-gray-50 rounded-lg border border-gray-100 hover:border-brand-200 transition-colors cursor-pointer group"
              >
                <div className="flex justify-between items-start mb-1">
                  <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                    risk.severity === 'High' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {risk.severity} Risk
                  </span>
                  <span className="text-xs text-gray-400">{risk.detectedAt}</span>
                </div>
                <p className="text-sm font-medium text-gray-800 group-hover:text-brand-600 transition-colors">{risk.description}</p>
                <p className="text-xs text-gray-500 mt-1">{risk.category}</p>
              </div>
            ))}
            <button 
              onClick={() => onNavigate('risks')}
              className="w-full py-2 text-sm text-brand-600 font-medium hover:text-brand-800 hover:bg-brand-50 rounded transition-colors"
            >
              View All Risks
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
