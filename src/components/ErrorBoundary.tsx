import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('🚨 ErrorBoundary caught an error:', error, errorInfo);
    console.error('🚨 Full error stack:', error.stack);
    console.error('🚨 Component stack:', errorInfo.componentStack);
    
    // Store error info in state for display
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
          <div className="max-w-6xl mx-auto">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 mb-4">
              <h1 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-2">
                🚨 Application Crashed
              </h1>
              <p className="text-red-700 dark:text-red-300 mb-4">
                The application encountered an error and crashed. Here are the full details:
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Error Message */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Error Message
                </h2>
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-3">
                  <code className="text-red-800 dark:text-red-200 font-mono text-sm">
                    {this.state.error?.message || 'Unknown error'}
                  </code>
                </div>
              </div>

              {/* Error Type */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Error Type
                </h2>
                <div className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded p-3">
                  <code className="text-gray-800 dark:text-gray-200 font-mono text-sm">
                    {this.state.error?.name || 'Unknown'}
                  </code>
                </div>
              </div>
            </div>

            {/* Full Stack Trace */}
            <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Full Stack Trace
              </h2>
              <div className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-auto max-h-96">
                <pre className="whitespace-pre-wrap text-xs font-mono">
                  {this.state.error?.stack || 'No stack trace available'}
                </pre>
              </div>
            </div>

            {/* Component Stack */}
            {this.state.errorInfo?.componentStack && (
              <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Component Stack
                </h2>
                <div className="bg-gray-900 text-blue-400 p-4 rounded-lg overflow-auto max-h-96">
                  <pre className="whitespace-pre-wrap text-xs font-mono">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </div>
              </div>
            )}

            {/* Environment Info */}
            <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Environment Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>User Agent:</strong>
                  <br />
                  <code className="text-gray-600 dark:text-gray-400 break-all">
                    {navigator.userAgent}
                  </code>
                </div>
                <div>
                  <strong>URL:</strong>
                  <br />
                  <code className="text-gray-600 dark:text-gray-400 break-all">
                    {window.location.href}
                  </code>
                </div>
                <div>
                  <strong>Timestamp:</strong>
                  <br />
                  <code className="text-gray-600 dark:text-gray-400">
                    {new Date().toISOString()}
                  </code>
                </div>
                <div>
                  <strong>React Version:</strong>
                  <br />
                  <code className="text-gray-600 dark:text-gray-400">
                    {React.version}
                  </code>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex flex-wrap gap-4">
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
              <button
                onClick={() => {
                  console.clear();
                  console.log('🚨 Error Report:', {
                    message: this.state.error?.message,
                    stack: this.state.error?.stack,
                    componentStack: this.state.errorInfo?.componentStack,
                    userAgent: navigator.userAgent,
                    url: window.location.href,
                    timestamp: new Date().toISOString(),
                    reactVersion: React.version
                  });
                }}
                className="px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500"
              >
                🖥️ Log to Console
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
