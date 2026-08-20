"use client";

import React from "react";

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to monitoring service in production
    if (process.env.NODE_ENV === "production") {
      console.error("[ErrorBoundary]", error.message, errorInfo.componentStack);
    } else {
      console.error("[ErrorBoundary]", error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-[400px] flex-col items-center justify-center p-8 text-center">
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 dark:border-red-800 dark:bg-red-950">
            <h2 className="text-xl font-semibold text-red-800 dark:text-red-200">
              Something went wrong
            </h2>
            <p className="mt-1 text-xs font-medium text-red-500">ShieldLayer: Protection, On-Chain</p>
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">
              An unexpected error occurred. Please try again.
            </p>
            {process.env.NODE_ENV === "development" && this.state.error && (
              <pre className="mt-4 max-w-md overflow-auto rounded bg-red-100 p-3 text-left text-xs text-red-800 dark:bg-red-900 dark:text-red-200">
                {this.state.error.message}
              </pre>
            )}
            <button
              onClick={() => window.location.reload()}
              className="mt-4 rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
