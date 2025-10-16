"use client";

import React from "react";
import { Button } from "./button";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  retryCount: number;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, retryCount: 0 };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Log to error tracking service in production
    if (process.env.NODE_ENV === 'production') {
      // TODO: Integrate with error tracking service (e.g., Sentry)
      // Example: Sentry.captureException(error, { contexts: { react: errorInfo } });
    }

    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    const { retryCount, error } = this.state;

    // Try to recover without reload first (up to 2 attempts)
    if (retryCount < 2) {
      this.setState({
        hasError: false,
        error: null,
        retryCount: retryCount + 1
      });
    } else {
      // Log before reload in production
      if (process.env.NODE_ENV === 'production') {
        console.error('ErrorBoundary: Full page reload triggered after failed retries', error);
        // TODO: Track reload event in analytics
      }

      // Warn user before reload (potential data loss)
      const shouldReload = window.confirm(
        'The application needs to reload to recover. Any unsaved changes will be lost. Continue?'
      );

      if (shouldReload) {
        window.location.reload();
      } else {
        // Reset retry count to allow user to try again
        this.setState({ retryCount: 0 });
      }
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { retryCount, error } = this.state;
      const willReload = retryCount >= 2;

      // Provide specific guidance based on error type
      const getErrorGuidance = (err: Error | null): string => {
        if (!err) return 'Please try again or contact support if the issue persists.';

        const message = err.message.toLowerCase();
        if (message.includes('network') || message.includes('fetch')) {
          return 'Please check your internet connection and try again.';
        }
        if (message.includes('not found') || message.includes('vault')) {
          return 'The requested resource may not exist. Please verify the vault ID.';
        }
        if (message.includes('timeout')) {
          return 'The request took too long. Please try again.';
        }
        return 'Please try again or contact support if the issue persists.';
      };

      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
          <div className="max-w-md text-center space-y-4">
            <h2 className="text-2xl font-semibold text-red-400">Something went wrong</h2>
            <p className="text-muted-foreground">
              {error?.message || 'An unexpected error occurred'}
            </p>
            <p className="text-sm text-muted-foreground/80">
              {getErrorGuidance(error)}
            </p>
            <div className="space-y-2">
              <Button onClick={this.handleRetry}>
                {willReload ? 'Reload Page' : 'Try Again'}
              </Button>
              {retryCount > 0 && retryCount < 2 && (
                <p className="text-xs text-muted-foreground">
                  Retry attempt {retryCount}/2
                </p>
              )}
              {willReload && (
                <p className="text-xs text-yellow-400">
                  Warning: Reloading will lose any unsaved changes
                </p>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
