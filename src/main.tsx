import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import RootErrorBoundary from './components/RootErrorBoundary.tsx'

// Global error handler for uncaught errors
window.addEventListener('error', (event) => {
  console.error('🚨 Global Error caught:', {
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

  // Prevent the error from crashing the entire app in production
  if (process.env.NODE_ENV === 'production') {
    event.preventDefault();
  }
});

// Global error handler for unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.error('🚨 Unhandled Promise Rejection caught:', {
    reason: event.reason,
    promise: event.promise,
    stack: event.reason?.stack,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href
  });

  // Prevent the error from crashing the entire app in production
  if (process.env.NODE_ENV === 'production') {
    event.preventDefault();
  }
});

// Create root element and wrap in error boundary
const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(
    <RootErrorBoundary>
      <StrictMode>
        <App />
      </StrictMode>
    </RootErrorBoundary>,
  );
} else {
  console.error('🚨 Root element not found');
}
