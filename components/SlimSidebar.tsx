import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Home, ShieldAlert, ShieldCheck, Scale, BookOpen, Users, Grid,
  Settings, LogOut, PanelLeft
} from 'lucide-react';

interface SlimSidebarProps {
  onSwitchToClassic?: () => void;
}

const NAV_PILLARS = [
  { id: 'home', label: 'Home', icon: Home, path: '/dashboard' },
  { id: 'risk', label: 'Risk', icon: ShieldAlert, path: '/risks' },
  { id: 'comply', label: 'Comply', icon: ShieldCheck, path: '/frameworks' },
  { id: 'govern', label: 'Govern', icon: Scale, path: '/governance' },
  { id: 'audits', label: 'Audits', icon: BookOpen, path: '/audit' },
  { id: 'vendors', label: 'Vendors', icon: Users, path: '/vendors' },
  { id: 'library', label: 'Library', icon: Grid, path: '/feature-library' },
] as const;

export const SlimSidebar: React.FC<SlimSidebarProps> = ({ onSwitchToClassic }) => {
  const location = useLocation();
  const { user, logout } = useAuth();

  const isActive = (path: string) => {
    if (path === '/dashboard') return location.pathname === '/dashboard' || location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '??';

  return (
    <>
      {/* Desktop: vertical sidebar */}
      <aside className="hidden lg:flex flex-col w-[58px] bg-surface-900 text-white shrink-0 h-screen">
        {/* Logo */}
        <div className="flex items-center justify-center h-16 border-b border-surface-700/50">
          <Link to="/dashboard" className="relative w-9 h-9 bg-brand-600 rounded-xl flex items-center justify-center shadow-lg shadow-brand-600/30">
            <ShieldCheck className="w-5 h-5 text-white" />
            <div className="absolute inset-0 rounded-xl bg-brand-400/20 blur-sm" />
          </Link>
        </div>

        {/* Navigation pillars */}
        <nav data-onboarding="sidebar-nav" className="flex-1 flex flex-col items-center pt-4 gap-1">
          {NAV_PILLARS.map(item => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.id}
                to={item.path}
                data-onboarding={`${item.id}-nav`}
                className={`group relative flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200 ${
                  active
                    ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/30'
                    : 'text-surface-400 hover:bg-surface-800 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                {/* Tooltip */}
                <span className="absolute left-full ml-3 px-2.5 py-1 bg-surface-800 text-white text-xs font-medium rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 pointer-events-none">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom: Toggle + Settings + Avatar */}
        <div className="flex flex-col items-center pb-4 gap-1 border-t border-surface-700/50 pt-3">
          {onSwitchToClassic && (
            <button
              onClick={onSwitchToClassic}
              className="group relative flex items-center justify-center w-10 h-10 rounded-xl text-surface-400 hover:bg-surface-800 hover:text-white transition-all duration-200"
            >
              <PanelLeft className="w-5 h-5" />
              <span className="absolute left-full ml-3 px-2.5 py-1 bg-surface-800 text-white text-xs font-medium rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 pointer-events-none">
                Classic view
              </span>
            </button>
          )}
          <Link
            to="/settings"
            data-onboarding="settings-nav"
            className={`group relative flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200 ${
              location.pathname.startsWith('/settings')
                ? 'bg-brand-600 text-white'
                : 'text-surface-400 hover:bg-surface-800 hover:text-white'
            }`}
          >
            <Settings className="w-5 h-5" />
            <span className="absolute left-full ml-3 px-2.5 py-1 bg-surface-800 text-white text-xs font-medium rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 pointer-events-none">
              Settings
            </span>
          </Link>

          <button
            onClick={logout}
            className="group relative flex items-center justify-center w-10 h-10 rounded-xl text-surface-400 hover:bg-surface-800 hover:text-white transition-all duration-200"
          >
            <div className="w-7 h-7 rounded-full bg-brand-700 flex items-center justify-center text-[10px] font-bold text-white">
              {initials}
            </div>
            <span className="absolute left-full ml-3 px-2.5 py-1 bg-surface-800 text-white text-xs font-medium rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 pointer-events-none">
              {user?.name || 'Account'}
            </span>
          </button>
        </div>
      </aside>

      {/* Mobile: bottom tab bar */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-surface-900 border-t border-surface-700/50 flex items-center justify-around py-2 px-1 safe-area-pb">
        {NAV_PILLARS.slice(0, 5).map(item => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <Link
              key={item.id}
              to={item.path}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors ${
                active ? 'text-brand-400' : 'text-surface-400'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
};
