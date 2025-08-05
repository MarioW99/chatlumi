import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to monitoring service
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Send error to analytics in production
    if (import.meta.env.PROD) {
      // In production, you would send this to your error tracking service
      console.error('Production error:', {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString()
      });
    }
    
    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Update state with error info
    this.setState({
      error,
      errorInfo
    });
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-[#fef7e0] dark:bg-indigo-900 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white dark:bg-indigo-800 rounded-2xl shadow-xl border border-amber-200/50 dark:border-indigo-600 p-8">
            <div className="text-center">
              {/* Error Icon */}
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>

              {/* Error Title */}
              <h2 className="text-2xl font-bold text-amber-900 dark:text-indigo-100 mb-4">
                Oops! Something went wrong
              </h2>

              {/* Error Message */}
              <p className="text-amber-700 dark:text-indigo-200 mb-6 leading-relaxed">
                We encountered an unexpected error. Don't worry, your conversation with Lumi is safe.
              </p>

              {/* Error Details (Development Only) */}
              {import.meta.env.DEV && this.state.error && (
                <details className="mb-6 text-left">
                  <summary className="cursor-pointer text-sm text-amber-600 dark:text-indigo-300 font-medium mb-2">
                    Error Details (Development)
                  </summary>
                  <div className="bg-amber-50 dark:bg-indigo-900/50 rounded-lg p-4 text-xs font-mono text-amber-800 dark:text-indigo-200 overflow-auto max-h-32">
                    <div className="mb-2">
                      <strong>Error:</strong> {this.state.error.message}
                    </div>
                    {this.state.errorInfo && (
                      <div>
                        <strong>Stack:</strong>
                        <pre className="whitespace-pre-wrap mt-1">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={this.resetError}
                  className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-amber-400 dark:bg-indigo-600 text-white rounded-xl hover:bg-amber-500 dark:hover:bg-indigo-500 transition-colors font-medium"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Try Again</span>
                </button>
                
                <button
                  onClick={() => window.location.href = '/'}
                  className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-white dark:bg-indigo-700 text-amber-700 dark:text-indigo-200 border border-amber-200 dark:border-indigo-600 rounded-xl hover:bg-amber-50 dark:hover:bg-indigo-600 transition-colors font-medium"
                >
                  <Home className="w-4 h-4" />
                  <span>Go Home</span>
                </button>
              </div>

              {/* Additional Help */}
              <div className="mt-6 pt-6 border-t border-amber-200/50 dark:border-indigo-600">
                <p className="text-xs text-amber-600 dark:text-indigo-300">
                  If this problem persists, please refresh the page or contact support.
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook for functional components to use error boundary
export const useErrorHandler = () => {
  const handleError = (error: Error, errorInfo?: ErrorInfo) => {
    console.error('Error caught by useErrorHandler:', error, errorInfo);
    
    // You can add additional error reporting here
    // e.g., send to monitoring service, analytics, etc.
  };

  return { handleError };
};

export default ErrorBoundary; 