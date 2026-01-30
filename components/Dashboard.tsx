
import React, { useRef, useEffect, useState } from 'react';
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
import { ComplianceFramework, ViewState, RiskItem } from '../types';
import { useOnboardingTrigger } from '../hooks/useOnboarding';

interface DashboardProps {
  frameworks: ComplianceFramework[];
  risks: RiskItem[];
  onNavigate: (view: ViewState) => void;
}

// Generate trend data for last 6 months based on actual framework scores
const generateTrendData = (frameworks: ComplianceFramework[]) => {
  const now = new Date();
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  // Get last 6 months dynamically
  const months: string[] = [];
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(monthNames[date.getMonth()]);
  }
  
  // Calculate current score dynamically from actual framework data
  const calculateCurrentScore = () => {
    if (frameworks.length === 0) return 0;
    let totalControls = 0;
    let compliantControls = 0;
    frameworks.forEach((fw: any) => {
      if (fw.controls && Array.isArray(fw.controls) && fw.controls.length > 0) {
        totalControls += fw.controls.length;
        compliantControls += fw.controls.filter((c: any) => 
          c.status === 'Implemented' || c.status === 'Compliant'
        ).length;
      } else {
        // Fallback to progress percentage if controls not available
        totalControls += 100;
        compliantControls += fw.progress || 0;
      }
    });
    return totalControls > 0 ? Math.round((compliantControls / totalControls) * 100) : 0;
  };
  
  const currentScore = calculateCurrentScore();
  
  // Generate trend data - calculate progression over last 6 months
  // Simulate gradual improvement (in production, this would come from historical database records)
  return months.map((month, index) => {
    // Calculate score for each month based on current score and time progression
    // Earlier months show lower scores, trending up to current score
    const monthsAgo = 5 - index;
    const progressFactor = 1 - (monthsAgo / 6); // 0 to 1 over 6 months
    // Start from 30% below current score and trend up
    const baseScore = Math.max(0, currentScore - 30);
    const score = Math.round(baseScore + (currentScore - baseScore) * progressFactor);
    return { name: month, score: Math.max(0, Math.min(100, score)) };
  });
};

export const Dashboard: React.FC<DashboardProps> = ({ frameworks, risks, onNavigate }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [chartReady, setChartReady] = useState(false);

  // Onboarding: auto-trigger welcome flow for first-time users (handled in context)
  // Dashboard-level trigger not needed since context auto-starts welcome on mount

  // Wait for container to be ready before rendering chart
  useEffect(() => {
    const checkContainer = () => {
      if (chartContainerRef.current) {
        const { width, height } = chartContainerRef.current.getBoundingClientRect();
        if (width > 0 && height > 0) {
          setChartReady(true);
        } else {
          // Retry after a short delay
          setTimeout(checkContainer, 100);
        }
      }
    };

    // Check immediately and on resize
    checkContainer();
    window.addEventListener('resize', checkContainer);
    
    return () => window.removeEventListener('resize', checkContainer);
  }, []);

  // Calculate compliance score dynamically based on actual control statuses
  const calculateComplianceScore = () => {
    if (!frameworks || frameworks.length === 0) return 0;

    let totalControls = 0;
    let compliantControls = 0;

    frameworks.forEach((fw: any) => {
      // If framework has controls array, calculate from actual control statuses
      if (fw.controls && Array.isArray(fw.controls) && fw.controls.length > 0) {
        const frameworkControls = fw.controls.length;
        const compliant = fw.controls.filter((c: any) => 
          c && (c.status === 'Implemented' || c.status === 'Compliant')
        ).length;
        totalControls += frameworkControls;
        compliantControls += compliant;
      } else {
        // Fallback to progress percentage if controls not available
        totalControls += 100;
        compliantControls += fw.progress || 0;
      }
    });

    return totalControls > 0 
      ? Math.round((compliantControls / totalControls) * 100)
      : 0;
  };

  const avgScore = calculateComplianceScore();
  
  // Generate trend data safely
  const trendData = React.useMemo(() => {
    try {
      const data = generateTrendData(frameworks || []);
      // Ensure data is valid and has at least one point
      if (!data || data.length === 0) {
        return [{ name: 'Jan', score: 0 }, { name: 'Feb', score: 0 }, { name: 'Mar', score: 0 }, { name: 'Apr', score: 0 }, { name: 'May', score: 0 }, { name: 'Jun', score: 0 }];
      }
      // Validate each data point
      return data.map(d => ({
        name: d.name || 'Unknown',
        score: typeof d.score === 'number' && !isNaN(d.score) ? Math.max(0, Math.min(100, d.score)) : 0
      }));
    } catch (error) {
      console.error('Error generating trend data:', error);
      return [{ name: 'Jan', score: 0 }, { name: 'Feb', score: 0 }, { name: 'Mar', score: 0 }, { name: 'Apr', score: 0 }, { name: 'May', score: 0 }, { name: 'Jun', score: 0 }];
    }
  }, [frameworks]);
    
  const activeCount = frameworks.length;
  const criticalRiskCount = risks.filter(r => r.severity === 'High' && r.status !== 'Resolved').length;
  
  // Calculate upcoming audits dynamically from actual framework dates
  const now = new Date();
  now.setHours(0, 0, 0, 0); // Reset to start of day for accurate day calculation
  
  const allAudits = frameworks
    .filter(fw => fw && fw.nextAuditDate) // Only include frameworks with valid audit dates
    .map(fw => {
      try {
        const auditDate = new Date(fw.nextAuditDate);
        auditDate.setHours(0, 0, 0, 0); // Reset to start of day
        
        // Check if date is valid
        if (isNaN(auditDate.getTime())) {
          return null;
        }
        
        // Calculate days difference
        const diffTime = auditDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        return {
          framework: fw,
          date: auditDate,
          days: diffDays,
        };
      } catch (error) {
        console.error(`Invalid audit date for framework ${fw.name}:`, fw.nextAuditDate);
        return null;
      }
    })
    .filter((a): a is NonNullable<typeof a> => a !== null) // Remove null entries
    .sort((a, b) => a.date.getTime() - b.date.getTime()); // Sort by date (earliest first)
  
  // Get the nearest upcoming audit (could be overdue or future)
  const upcomingAudit = allAudits.length > 0 ? allAudits[0] : null;
  const auditDays = upcomingAudit ? upcomingAudit.days : null;
  
  // Get audits happening today (within 0 days)
  const auditsToday = allAudits.filter(a => a.days === 0);

  // Get top 3 recent open risks for the dashboard widget
  const priorityRisks = risks
    .filter(r => r && (r.status === 'Open' || r.status === 'In Progress'))
    .slice(0, 3);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all" data-onboarding="compliance-score">
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

        <div 
          onClick={() => {
            if (frameworks.length > 0) {
              // Show modal with all upcoming audits
              if (allAudits.length > 0) {
                const auditList = allAudits.map(a => {
                  const dateStr = a.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                  if (a.days < 0) {
                    return `${a.framework.name}: Overdue by ${Math.abs(a.days)} day${Math.abs(a.days) !== 1 ? 's' : ''} (${dateStr})`;
                  } else if (a.days === 0) {
                    return `${a.framework.name}: Due Today (${dateStr})`;
                  } else {
                    return `${a.framework.name}: Due in ${a.days} day${a.days !== 1 ? 's' : ''} (${dateStr})`;
                  }
                }).join('\n');
                
                alert(`Upcoming Audits:\n\n${auditList}`);
              } else {
                alert('No audits scheduled for any frameworks.');
              }
            }
          }}
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 group-hover:text-purple-600 transition-colors">Upcoming Audit</p>
              <h3 className="text-3xl font-bold text-gray-900 mt-1">
                {upcomingAudit && auditDays !== null
                  ? auditDays < 0 
                    ? `Overdue` 
                    : auditDays === 0 
                    ? 'Today' 
                    : `${auditDays}d`
                  : '-'}
              </h3>
            </div>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center group-hover:opacity-80 transition-colors ${
              auditDays !== null && auditDays < 0 ? 'bg-red-50' : auditDays === 0 ? 'bg-yellow-50' : auditDays !== null ? 'bg-purple-50' : 'bg-gray-50'
            }`}>
              <Shield className={auditDays !== null && auditDays < 0 ? 'text-red-600' : auditDays === 0 ? 'text-yellow-600' : auditDays !== null ? 'text-purple-600' : 'text-gray-400'} size={24} />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className={`group-hover:text-purple-600 transition-colors ${
              auditDays !== null && auditDays < 0 ? 'text-red-600' : auditDays === 0 ? 'text-yellow-600' : auditDays !== null ? 'text-gray-500' : 'text-gray-400'
            }`}>
              {upcomingAudit 
                ? `${upcomingAudit.framework.name}${auditsToday.length > 1 ? ` (+${auditsToday.length - 1} more today)` : ''}`
                : 'No audits scheduled'}
            </span>
            {allAudits.length > 1 && (
              <span className="text-gray-400 ml-2">({allAudits.length} audits)</span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-6">Compliance Readiness Trend</h3>
          <div ref={chartContainerRef} className="h-72 w-full min-h-[300px] min-w-0" style={{ position: 'relative' }}>
            {trendData && trendData.length > 0 && chartReady ? (
              <ResponsiveContainer width="100%" height="100%" minHeight={300} minWidth={0}>
                <AreaChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area type="monotone" dataKey="score" stroke="#0ea5e9" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : !chartReady ? (
              <div className="flex items-center justify-center h-full text-gray-400">
                <p>Loading chart...</p>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                <p>No trend data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Risks */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4">
             <h3 className="text-lg font-bold text-gray-800">Priority Actions</h3>
             <button onClick={() => onNavigate('risks')} className="text-sm text-brand-600 font-medium hover:text-brand-800">View All</button>
          </div>
          <div className="space-y-4">
            {priorityRisks.length > 0 ? priorityRisks.map((risk) => (
              <div 
                key={risk.id} 
                onClick={() => onNavigate('risks')}
                className="p-3 bg-gray-50 rounded-lg border border-gray-100 hover:border-brand-200 transition-colors cursor-pointer group"
              >
                <div className="flex justify-between items-start mb-1">
                  <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                    risk.severity === 'High' ? 'bg-red-100 text-red-700' : 
                    risk.severity === 'Medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {risk.severity} Risk
                  </span>
                  <span className="text-xs text-gray-400">{risk.detectedAt}</span>
                </div>
                <p className="text-sm font-medium text-gray-800 group-hover:text-brand-600 transition-colors line-clamp-2">{risk.description}</p>
                <p className="text-xs text-gray-500 mt-1">{risk.category}</p>
              </div>
            )) : (
              <div className="text-center py-8 text-gray-400">
                <CheckCircle size={32} className="mx-auto mb-2 text-green-500 opacity-50"/>
                <p>No open risks</p>
              </div>
            )}
            <button 
              onClick={() => onNavigate('risks')}
              className="w-full py-2 text-sm text-brand-600 font-medium hover:text-brand-800 hover:bg-brand-50 rounded transition-colors"
            >
              View Risk Registry
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
