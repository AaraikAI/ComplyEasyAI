import React from 'react';
import { Navigate, useLocation } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { normalizePlan, canAccessView } from '../constants/tierFeatures';
import { pathToView } from './routeConfig';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
}

/**
 * Protects routes requiring authentication.
 * Checks auth state, role, and tier access before rendering.
 * Redirects to landing if not authenticated.
 * Redirects to dashboard if tier doesn't allow the view.
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-surface-50 dark:bg-surface-900">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-surface-500 dark:text-surface-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Save intended destination for redirect after login
    return <Navigate to="/" state={{ from: location.pathname }} replace />;
  }

  // Role check
  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/dashboard" replace />;
  }

  // Tier access check
  const userPlan = normalizePlan(user?.organization?.plan);
  const viewId = pathToView(location.pathname);
  if (!canAccessView(userPlan, viewId)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};
