import React from 'react';

interface RootErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface RootErrorBoundaryProps {
  children: React.ReactNode;
}

/**
 * Root error boundary that catches errors before React starts rendering
 * This helps catch React errors that happen during initial render
 */
class RootErrorBoundary extends React.Component<RootErrorBoundaryProps, RootErrorBoundaryState> {
  constructor(props: RootErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): RootErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('🚨 Root ErrorBoundary caught an error:', error, errorInfo);
    console.error('🚨 Full error stack:', error.stack);
    console.error('🚨 Component stack:', errorInfo.componentStack);

    this.setState({ errorInfo });

    // Log to our global error handler
    if (typeof window !== 'undefined' && window.errorLog) {
      window.errorLog.push({
        timestamp: new Date().toISOString(),
        error: error,
        errorInfo: errorInfo,
        level: 'root-boundary'
      });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center p-4">
          <div className="max-w-2xl mx-auto">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 mb-4">
              <h1 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-2">
                🚨 Application Failed to Load
              </h1>
              <p className="text-red-700 dark:text-red-300 mb-4">
                The application encountered a critical error during startup. This is likely due to a third-party library issue.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Error Details
              </h2>
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-3">
                <code className="text-red-800 dark:text-red-200 font-mono text-sm">
                  {this.state.error?.message || 'Unknown error'}
                </code>
              </div>
            </div>

            {this.state.error?.stack && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Stack Trace
                </h2>
                <div className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-auto max-h-96">
                  <pre className="whitespace-pre-wrap text-xs font-mono">
                    {this.state.error.stack}
                  </pre>
                </div>
              </div>
            )}

            <div className="flex gap-4">
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                🔄 Reload Page
              </button>
              <button
                onClick={() => {
                  const errorReport = {
                    message: this.state.error?.message,
                    stack: this.state.error?.stack,
                    componentStack: this.state.errorInfo?.componentStack,
                    userAgent: navigator.userAgent,
                    url: window.location.href,
                    timestamp: new Date().toISOString(),
                    reactVersion: React.version
                  };
                  navigator.clipboard.writeText(JSON.stringify(errorReport, null, 2));
                  alert('Error report copied to clipboard!');
                }}
                className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                📋 Copy Error Report
              </button>
            </div>

            <div className="mt-6 text-sm text-gray-500 dark:text-gray-400">
              <p>
                If this error persists, please report it to the development team.
                This appears to be an issue with a third-party library (thirdweb or Neynar SDK).
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default RootErrorBoundary;
