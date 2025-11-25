
import React, { useState, useMemo } from 'react';
import { ViewState } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { MOCK_RISKS } from '../constants';
import { 
  LayoutDashboard, FileText, ShieldCheck, Settings, LogOut, Menu, X,
  Activity, Search, Bell, Lock, Sparkles, Briefcase, GitGraph, Mail, ShieldAlert, Database, LifeBuoy, CheckSquare
} from 'lucide-react';
import { ComplianceChat } from './ComplianceChat';

interface LayoutProps {
  currentView: ViewState;
  onNavigate: (view: ViewState) => void;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ currentView, onNavigate, children }) => {
  const { user, logout } = useAuth();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Calculate notifications
  const notifications = useMemo(() => {
    if (!user) return [];
    const tasks = MOCK_RISKS.filter(r => r.assignedTo === user.name).map(r => ({
      id: r.id,
      title: 'Risk Assigned to You',
      desc: r.description,
      time: r.detectedAt,
      type: 'task'
    }));
    
    const system = [
      { id: 'sys1', title: 'Audit Preparedness', desc: 'SOC 2 Audit is in 20 days.', time: '1 day ago', type: 'alert' }
    ];
    return [...tasks, ...system];
  }, [user]);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'editor', 'viewer'], relatedViews: ['risks'] },
    { id: 'frameworks', label: 'Frameworks', icon: ShieldCheck, roles: ['admin', 'editor'], relatedViews: ['framework-details'] },
    { id: 'reports', label: 'Report Generator', icon: FileText, roles: ['admin', 'editor', 'viewer'], relatedViews: [] },
    { id: 'audit', label: 'Audit Trail', icon: Activity, roles: ['admin', 'editor'], relatedViews: [] },
  ];

  const aiTools = [
    { id: 'ai-policy', label: 'Policy Generator', icon: Sparkles },
    { id: 'ai-contract', label: 'Contract Analyzer', icon: Briefcase },
    { id: 'ai-gap', label: 'Gap Analysis', icon: GitGraph },
    { id: 'ai-rfp', label: 'RFP Responder', icon: FileText },
    { id: 'ai-phishing', label: 'Phishing Sim', icon: Mail },
    { id: 'ai-vendor', label: 'Vendor Risk', icon: ShieldAlert },
    { id: 'ai-data-map', label: 'GDPR Mapper', icon: Database },
    { id: 'ai-bcp', label: 'BCP Generator', icon: LifeBuoy },
  ];

  if (!user) return null;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out
        lg:relative lg:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        flex flex-col
      `}>
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">ComplyEasy</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <nav className="p-4 space-y-6 flex-1 overflow-y-auto custom-scrollbar">
          <div className="space-y-1">
             <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Platform</p>
             {navItems.filter(item => item.roles.includes(user.role)).map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id || item.relatedViews.includes(currentView);
              return (
                <button
                  key={item.id}
                  onClick={() => { onNavigate(item.id as ViewState); setSidebarOpen(false); }}
                  className={`
                    w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg transition-colors cursor-pointer
                    ${isActive ? 'bg-brand-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}
                  `}
                >
                  <Icon size={20} />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>

          <div className="space-y-1">
             <p className="px-4 text-xs font-semibold text-brand-400 uppercase tracking-wider mb-2 flex items-center">
                <Sparkles size={10} className="mr-1"/> AI Tools
             </p>
             {aiTools.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => { onNavigate(item.id as ViewState); setSidebarOpen(false); }}
                  className={`
                    w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg transition-colors cursor-pointer
                    ${isActive ? 'bg-brand-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}
                  `}
                >
                  <Icon size={20} />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>

          {user.role === 'admin' && (
             <div className="space-y-1">
                <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Admin</p>
                <button
                  onClick={() => { onNavigate('settings'); setSidebarOpen(false); }}
                  className={`
                    w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg transition-colors cursor-pointer
                    ${currentView === 'settings' ? 'bg-brand-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}
                  `}
                >
                  <Settings size={20} />
                  <span className="font-medium">Settings</span>
                </button>
             </div>
          )}
        </nav>

        <div className="p-4 border-t border-slate-700">
          <div className="mb-4 px-4 flex items-center space-x-2 text-xs text-green-400">
            <Lock size={12} />
            <span>Encrypted • Zero Trust</span>
          </div>
          <button 
            onClick={logout}
            className="w-full flex items-center space-x-3 px-4 py-3 text-slate-300 hover:bg-slate-800 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <LogOut size={20} />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <header className="bg-white border-b border-gray-200 flex items-center justify-between px-6 py-4 sticky top-0 z-10">
          <div className="flex items-center">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden mr-4 text-gray-500 hover:text-gray-700"
            >
              <Menu size={24} />
            </button>
            <h1 className="text-2xl font-semibold text-gray-800 capitalize">
              {currentView.replace('ai-', 'AI ').replace('-', ' ')}
            </h1>
          </div>

          <div className="flex items-center space-x-4">
            <div className="relative">
              <button 
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
              >
                <Bell size={24} />
                {notifications.length > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                )}
              </button>

              {isNotificationsOpen && (
                <div className="absolute right-0 mt-3 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-fadeIn">
                  <div className="p-4 border-b border-gray-100 bg-gray-50">
                    <h3 className="font-bold text-gray-900">Notifications</h3>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length > 0 ? notifications.map(n => (
                      <div key={n.id} className="p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer">
                         <div className="flex items-start space-x-3">
                           <div className={`mt-1 p-1.5 rounded-full ${n.type === 'task' ? 'bg-brand-100 text-brand-600' : 'bg-yellow-100 text-yellow-600'}`}>
                             {n.type === 'task' ? <CheckSquare size={14}/> : <ShieldAlert size={14}/>}
                           </div>
                           <div>
                             <p className="text-sm font-bold text-gray-900">{n.title}</p>
                             <p className="text-xs text-gray-500 mt-0.5">{n.desc}</p>
                             <p className="text-xs text-gray-400 mt-1">{n.time}</p>
                           </div>
                         </div>
                      </div>
                    )) : (
                      <div className="p-8 text-center text-gray-500">
                        <p className="text-sm">No new notifications.</p>
                      </div>
                    )}
                  </div>
                  <div className="p-3 text-center border-t border-gray-100 bg-gray-50">
                    <button className="text-xs font-bold text-brand-600 hover:text-brand-800">Mark all as read</button>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-3 border-l border-gray-200 pl-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-500 capitalize">{user.role}</p>
              </div>
              <div className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center border border-brand-200 text-brand-700 font-bold shadow-sm">
                {user.avatar}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 bg-gray-50 relative">
          <div className="max-w-7xl mx-auto animate-fadeIn pb-20">
            {children}
          </div>
        </main>
        
        <ComplianceChat />
      </div>
    </div>
  );
};
