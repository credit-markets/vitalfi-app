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
  showReloadConfirmation: boolean;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, retryCount: 0, showReloadConfirmation: false };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Track error with React error info context
    console.error(error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: 'ErrorBoundary',
    });

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
      // Track reload event before showing confirmation
      console.error(new Error('ErrorBoundary: Full page reload triggered after failed retries'), {
        originalError: error?.message,
        retryCount,
      });

      // Show confirmation dialog before reload
      this.setState({ showReloadConfirmation: true });
    }
  };

  handleConfirmReload = () => {
    window.location.reload();
  };

  handleCancelReload = () => {
    // Reset retry count to allow user to try again
    this.setState({ showReloadConfirmation: false, retryCount: 0 });
  };

  // Provide specific guidance based on error type
  private getErrorGuidance(err: Error | null): string {
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
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { retryCount, error, showReloadConfirmation } = this.state;
      const willReload = retryCount >= 2;

      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
          <div className="max-w-md text-center space-y-4">
            <h2 className="text-2xl font-semibold text-red-400">Something went wrong</h2>
            <p className="text-muted-foreground">
              {error?.message || 'An unexpected error occurred'}
            </p>
            <p className="text-sm text-muted-foreground/80">
              {this.getErrorGuidance(error)}
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
              {willReload && !showReloadConfirmation && (
                <p className="text-xs text-yellow-400">
                  Warning: Reloading will lose any unsaved changes
                </p>
              )}
            </div>

            {/* Reload Confirmation Dialog */}
            {showReloadConfirmation && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-card border border-border rounded-lg p-6 max-w-sm space-y-4 shadow-xl">
                  <h3 className="text-lg font-semibold text-foreground">Reload Required</h3>
                  <p className="text-sm text-muted-foreground">
                    The application needs to reload to recover. Any unsaved changes will be lost.
                  </p>
                  <div className="flex gap-3 justify-end">
                    <Button variant="outline" onClick={this.handleCancelReload}>
                      Cancel
                    </Button>
                    <Button onClick={this.handleConfirmReload}>
                      Reload
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
