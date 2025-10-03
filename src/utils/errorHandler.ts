/**
 * Global error handling utilities
 * Catches unhandled errors and provides detailed debugging information
 */

// Global error handler for unhandled JavaScript errors
window.addEventListener('error', (event) => {
  console.error('🚨 Global Error Handler caught an error:', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    error: event.error,
    stack: event.error?.stack,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href
  });
});

// Global error handler for unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.error('🚨 Global Error Handler caught an unhandled promise rejection:', {
    reason: event.reason,
    promise: event.promise,
    stack: event.reason?.stack,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href
  });
});

// Console error override to capture all console.error calls
const originalConsoleError = console.error;
console.error = (...args) => {
  // Call the original console.error
  originalConsoleError.apply(console, args);
  
  // Also log to a global error log for debugging
  if (typeof window !== 'undefined') {
    if (!window.errorLog) {
      window.errorLog = [];
    }
    window.errorLog.push({
      timestamp: new Date().toISOString(),
      args: args,
      stack: new Error().stack
    });
    
    // Keep only the last 50 errors to prevent memory issues
    if (window.errorLog.length > 50) {
      window.errorLog = window.errorLog.slice(-50);
    }
  }
};

// Development-only error boundary for additional debugging
if (process.env.NODE_ENV === 'development') {
  // Override console methods to provide more detailed error information
  const originalConsoleWarn = console.warn;
  console.warn = (...args) => {
    originalConsoleWarn.apply(console, args);
    console.trace('Warning stack trace:');
  };

  const originalConsoleLog = console.log;
  console.log = (...args) => {
    originalConsoleLog.apply(console, args);
    if (args.some(arg => typeof arg === 'object' && arg?.stack)) {
      console.trace('Log with error stack trace:');
    }
  };
}

export {};
