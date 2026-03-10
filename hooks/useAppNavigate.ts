import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useCallback } from 'react';
import { viewToPath, pathToView, getBreadcrumbs, ROUTES } from '../routes/routeConfig';
import type { BreadcrumbItem } from '../routes/routeConfig';

/**
 * App-level navigation hook that bridges old ViewState-based navigation
 * with new URL-based routing. Provides helpers for:
 * - navigateToView: navigate using old view IDs (backward compat)
 * - goBack: browser-native back navigation
 * - currentView: current view ID derived from URL
 * - breadcrumbs: auto-generated breadcrumb trail
 */
export function useAppNavigate() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();

  /**
   * Navigate using an old ViewState ID.
   * Converts the view ID to a URL path and navigates.
   * Supports passing params for parameterized routes.
   */
  const navigateToView = useCallback((viewId: string, routeParams?: Record<string, string>) => {
    const path = viewToPath(viewId, routeParams);
    navigate(path);
  }, [navigate]);

  /**
   * Navigate to a specific URL path directly.
   */
  const navigateToPath = useCallback((path: string) => {
    navigate(path);
  }, [navigate]);

  /**
   * Go back to the previous page, or to dashboard if no history.
   */
  const goBack = useCallback((fallback?: string) => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(fallback || ROUTES.DASHBOARD);
    }
  }, [navigate]);

  /**
   * Go back to a specific view.
   */
  const goBackToView = useCallback((viewId: string) => {
    const path = viewToPath(viewId);
    navigate(path);
  }, [navigate]);

  /**
   * Get the current ViewState ID from the URL.
   */
  const currentView = pathToView(location.pathname);

  /**
   * Get breadcrumbs for the current route.
   */
  const breadcrumbs: BreadcrumbItem[] = getBreadcrumbs(location.pathname);

  /**
   * Get the current path.
   */
  const currentPath = location.pathname;

  /**
   * Check if a nav item is active (matches current route or is a parent).
   */
  const isActive = useCallback((viewId: string, relatedViews?: string[]): boolean => {
    if (currentView === viewId) return true;
    if (relatedViews?.includes(currentView)) return true;
    return false;
  }, [currentView]);

  return {
    navigate,
    navigateToView,
    navigateToPath,
    goBack,
    goBackToView,
    currentView,
    currentPath,
    breadcrumbs,
    params,
    isActive,
  };
}
