/**
 * Route Error Boundary
 *
 * Wraps the authenticated route tree so that a render-time exception in any
 * single page (e.g. an unexpected API response shape) degrades to a recoverable
 * error card instead of unmounting the entire React tree and leaving a blank
 * white screen. Without a boundary, one throwing component takes down the whole
 * SPA with no path to recovery.
 */

import React from 'react';
import { logger } from '../utils/logger';

interface RouteErrorBoundaryProps {
  children: React.ReactNode;
  /** Bump this (e.g. the current pathname) to auto-clear the error on navigation. */
  resetKey?: string;
}

interface RouteErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class RouteErrorBoundary extends React.Component<
  RouteErrorBoundaryProps,
  RouteErrorBoundaryState
> {
  constructor(props: RouteErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): RouteErrorBoundaryState {
    return { hasError: true, error };
  }

  override componentDidUpdate(prevProps: RouteErrorBoundaryProps): void {
    // Clear the error when the route changes so navigating away recovers without
    // a full page reload.
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false, error: null });
    }
  }

  override componentDidCatch(error: Error, info: React.ErrorInfo): void {
    logger.error('Route render error:', {
      message: error?.message,
      stack: error?.stack,
      componentStack: info?.componentStack,
    });
  }

  private handleReload = (): void => {
    window.location.reload();
  };

  override render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center"
        >
          <h2 className="text-lg font-semibold text-slate-100 mb-2">
            Something went wrong on this page
          </h2>
          <p className="text-sm text-slate-400 max-w-md mb-6">
            An unexpected error prevented this view from loading. You can try
            again, or navigate elsewhere using the sidebar.
          </p>
          <button
            type="button"
            onClick={this.handleReload}
            className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium"
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default RouteErrorBoundary;
