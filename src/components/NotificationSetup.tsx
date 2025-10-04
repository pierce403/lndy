import { useState } from 'react';
import { useMiniApp } from '@neynar/react';
import ErrorBoundary from './ErrorBoundary';

/**
 * Component to help users add the MiniApp and enable notifications
 * This uses the official Neynar React SDK
 */
const NotificationSetupContent = () => {
  const { isSDKLoaded, addMiniApp } = useMiniApp();
  const [isAdding, setIsAdding] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Early return if SDK is not loaded to prevent rendering issues
  if (!isSDKLoaded) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              ⏳ Loading Neynar SDK...
            </h3>
            <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
              <p>Please wait while the notification system initializes.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleAddMiniApp = async () => {
    if (!isSDKLoaded) {
      setError('Neynar SDK not loaded yet. Please try again.');
      return;
    }

    try {
      setIsAdding(true);
      setError(null);

      // Add error boundary around Neynar SDK call
      let result;
      try {
        result = await addMiniApp();
      } catch (sdkError) {
        console.error('❌ Neynar SDK error:', sdkError);
        throw new Error('Neynar SDK returned an error. Please try again.');
      }

      if (result && result.added) {
        setIsAdded(true);
        console.log('✅ MiniApp added successfully');

        if (result.notificationDetails) {
          console.log('🔔 Notification token received:', result.notificationDetails.token);
          // The webhook will handle storing this token
        }
      } else {
        setError('Failed to add MiniApp. Please try again.');
      }
    } catch (err) {
      console.error('❌ Error adding MiniApp:', err);
      setError(err instanceof Error ? err.message : 'Failed to add MiniApp');
    } finally {
      setIsAdding(false);
    }
  };

  if (isAdded) {
    return (
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-green-800 dark:text-green-200">
              ✅ MiniApp Added Successfully!
            </h3>
            <div className="mt-2 text-sm text-green-700 dark:text-green-300">
              <p>You'll now receive notifications about loan events in your Farcaster client.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
      <div className="flex">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
            🔔 Enable Notifications
          </h3>
          <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
            <p>Add this MiniApp to your Farcaster client to receive notifications about loan events.</p>
          </div>
          <div className="mt-3">
            <button
              onClick={handleAddMiniApp}
              disabled={!isSDKLoaded || isAdding}
              className={`inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                (!isSDKLoaded || isAdding) ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isAdding ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Adding...
                </>
              ) : (
                'Add MiniApp & Enable Notifications'
              )}
            </button>
          </div>
          {error && (
            <div className="mt-2 text-sm text-red-600 dark:text-red-400">
              ❌ {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Wrapper component with error boundary for NotificationSetup
 */
const NotificationSetup = () => {
  return (
    <ErrorBoundary>
      <NotificationSetupContent />
    </ErrorBoundary>
  );
};

export default NotificationSetup;
