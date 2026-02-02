"use client";

import { Component, ErrorInfo, ReactNode, useState, useCallback } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log error to analytics service (in production)
    console.error("React Error Boundary caught an error:", error, errorInfo);
    
    // You could send to Sentry/LogRocket/etc. here
    // if (typeof window !== 'undefined' && window.Sentry) {
    //   window.Sentry.captureException(error);
    // }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    
    // Force a hard refresh to reset the app state
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      return this.props.fallback || (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-zinc-950">
          {/* Background Effects - Monochrome */}
          <div className="absolute inset-0 -z-10 pointer-events-none">
            <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-red-500/5 rounded-full blur-[120px] animate-float-slow" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-zinc-500/5 rounded-full blur-[120px] animate-float-slow" style={{ animationDelay: "3s" }} />
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />
          </div>

          <div className="max-w-2xl w-full space-y-8 z-10">
            {/* Error Icon */}
            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-red-500 rounded-2xl blur-xl opacity-30 animate-pulse" />
                <div className="relative p-6 rounded-2xl bg-zinc-900 border border-red-500/30">
                  <AlertTriangle className="w-16 h-16 text-red-500" />
                </div>
              </div>
            </div>

            {/* Error Message */}
            <div className="text-center space-y-4">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white">
                Something went wrong
              </h1>
              <p className="text-lg text-white/60 max-w-xl mx-auto leading-relaxed">
                We encountered an unexpected error. Our team has been notified and is working on a fix.
              </p>
            </div>

            {/* Error Details (Collapsible for developers) */}
            <div className="bg-zinc-900/80 backdrop-blur-sm rounded-xl border border-zinc-700/50 overflow-hidden">
              <div className="p-4 bg-red-500/10 border-b border-zinc-700/50">
                <h3 className="text-sm font-semibold text-white/80 flex items-center gap-2">
                  <AlertTriangle size={14} className="text-red-500" />
                  Error Details
                </h3>
              </div>
              <div className="p-4">
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-medium text-white/50 mb-1">Error Message</p>
                    <code className="block p-3 bg-black/30 rounded-lg text-sm text-red-300 font-mono overflow-x-auto">
                      {this.state.error?.message || "Unknown error"}
                    </code>
                  </div>
                  
                  {this.state.errorInfo && (
                    <div>
                      <p className="text-xs font-medium text-white/50 mb-1">Component Stack</p>
                      <pre className="text-xs p-3 bg-black/30 rounded-lg text-white/70 font-mono overflow-x-auto max-h-40 overflow-y-auto">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Recovery Actions */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={this.handleReset}
                className="group px-6 py-3 rounded-xl font-semibold text-zinc-900 bg-amber-500 hover:bg-amber-400 transition-all duration-300 shadow-lg shadow-amber-500/25"
              >
                <div className="relative flex items-center gap-2">
                  <RefreshCw size={18} className="group-hover:animate-spin" />
                  <span>Reload Application</span>
                </div>
              </Button>

              <Button
                onClick={this.handleGoHome}
                variant="outline"
                className="px-6 py-3 rounded-xl font-semibold border-white/20 hover:border-white/40 hover:bg-white/5 transition-all duration-300"
              >
                <div className="flex items-center gap-2">
                  <Home size={18} />
                  <span>Go to Homepage</span>
                </div>
              </Button>
            </div>

            {/* Help Text */}
            <div className="text-center">
              <p className="text-sm text-white/40">
                If the problem persists, please contact support or try again later.
              </p>
              <p className="text-xs text-white/30 mt-2">
                Error ID: {Date.now().toString(36)}-{Math.random().toString(36).substring(2)}
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Convenience hook for throwing errors in async contexts
export function useAsyncError() {
  const [, setError] = useState();
  return useCallback(
    (error: Error) => {
      setError(() => {
        throw error;
      });
    },
    [setError]
  );
}

// Helper function to wrap async operations with error handling
export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  errorHandler?: (error: Error) => void
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      console.error("Error in wrapped function:", error);
      if (errorHandler) {
        errorHandler(error as Error);
      } else {
        // Default: re-throw for ErrorBoundary to catch
        throw error;
      }
    }
  }) as T;
}