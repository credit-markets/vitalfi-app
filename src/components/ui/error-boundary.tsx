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
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    const { retryCount } = this.state;

    // Try to recover without reload first (up to 2 attempts)
    if (retryCount < 2) {
      this.setState({
        hasError: false,
        error: null,
        retryCount: retryCount + 1
      });
    } else {
      // Full reload as last resort after 2 failed retries
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { retryCount } = this.state;
      const willReload = retryCount >= 2;

      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
          <div className="max-w-md text-center space-y-4">
            <h2 className="text-2xl font-semibold text-red-400">Something went wrong</h2>
            <p className="text-muted-foreground">
              {this.state.error?.message || 'An unexpected error occurred'}
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
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
