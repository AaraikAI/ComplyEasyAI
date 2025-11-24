import React, { useState } from 'react';
import { ViewState, User } from '../types';
import { 
  LayoutDashboard, 
  FileText, 
  ShieldCheck, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  Activity,
  Search,
  Bell,
  Lock
} from 'lucide-react';

interface LayoutProps {
  currentView: ViewState;
  onNavigate: (view: ViewState) => void;
  currentUser: User | null;
  onLogout: () => void;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ currentView, onNavigate, currentUser, onLogout, children }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'editor', 'viewer'], relatedViews: ['risks'] },
    { id: 'frameworks', label: 'Frameworks', icon: ShieldCheck, roles: ['admin', 'editor'], relatedViews: ['framework-details'] },
    { id: 'reports', label: 'Report Generator', icon: FileText, roles: ['admin', 'editor', 'viewer'], relatedViews: [] },
    { id: 'audit', label: 'Audit Trail', icon: Activity, roles: ['admin', 'editor'], relatedViews: [] },
    { id: 'settings', label: 'Settings', icon: Settings, roles: ['admin'], relatedViews: [] },
  ];

  if (!currentUser) return null;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
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

        <nav className="p-4 space-y-1">
          {navItems.filter(item => item.roles.includes(currentUser.role)).map((item) => {
            const Icon = item.icon;
            // Active if exact match OR if current view is a related sub-view
            const isActive = currentView === item.id || item.relatedViews.includes(currentView);
            return (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id as ViewState);
                  setSidebarOpen(false);
                }}
                className={`
                  w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors cursor-pointer
                  ${isActive ? 'bg-brand-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}
                `}
              >
                <Icon size={20} />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="absolute bottom-0 w-full p-4 border-t border-slate-700">
          <div className="mb-4 px-4 flex items-center space-x-2 text-xs text-green-400">
            <Lock size={12} />
            <span>Encrypted • Zero Trust</span>
          </div>
          <button 
            onClick={onLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 text-slate-300 hover:bg-slate-800 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <LogOut size={20} />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 flex items-center justify-between px-6 py-4">
          <div className="flex items-center">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden mr-4 text-gray-500 hover:text-gray-700"
            >
              <Menu size={24} />
            </button>
            <h1 className="text-2xl font-semibold text-gray-800 capitalize">
              {currentView.replace('-', ' ')}
            </h1>
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden md:flex relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Search policies..." 
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 w-64 transition-shadow"
              />
            </div>
            <button className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors">
              <Bell size={24} />
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            
            <div className="flex items-center space-x-3 border-l border-gray-200 pl-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-900">{currentUser.name}</p>
                <p className="text-xs text-gray-500 capitalize">{currentUser.role}</p>
              </div>
              <div className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center border border-brand-200 text-brand-700 font-bold shadow-sm">
                {currentUser.avatar}
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Content Area */}
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
          <div className="max-w-7xl mx-auto animate-fadeIn">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};