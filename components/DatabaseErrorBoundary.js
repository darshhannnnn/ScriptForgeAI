'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, RefreshCw, ExternalLink } from 'lucide-react';

export function DatabaseErrorBoundary({ children }) {
  const [error, setError] = useState(null);
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = () => {
    setIsRetrying(true);
    setError(null);
    // Reload the page to retry connections
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  const openWhitelistGuide = () => {
    window.open('https://www.mongodb.com/docs/atlas/security-whitelist/', '_blank');
  };

  useEffect(() => {
    const handleUnhandledRejection = (event) => {
      if (event.reason?.type === 'IP_WHITELIST_ERROR') {
        setError({
          type: 'IP_WHITELIST_ERROR',
          message: 'Database connection failed: IP not whitelisted'
        });
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    return () => window.removeEventListener('unhandledrejection', handleUnhandledRejection);
  }, []);

  if (error?.type === 'IP_WHITELIST_ERROR') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-gray-800/50 backdrop-blur-sm border border-red-500/20 rounded-lg p-6 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-red-500/10 rounded-full">
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
          </div>
          
          <h1 className="text-xl font-semibold text-white mb-2">
            Database Connection Issue
          </h1>
          
          <p className="text-gray-300 mb-6 text-sm">
            Your IP address isn't whitelisted in MongoDB Atlas. This is a common security feature that needs to be configured.
          </p>
          
          <div className="space-y-3">
            <button
              onClick={openWhitelistGuide}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              Fix IP Whitelist
            </button>
            
            <button
              onClick={handleRetry}
              disabled={isRetrying}
              className="w-full bg-gray-600 hover:bg-gray-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {isRetrying ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Retrying...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Try Again
                </>
              )}
            </button>
          </div>
          
          <div className="mt-6 p-3 bg-gray-700/30 rounded text-left text-xs text-gray-400">
            <p className="font-medium mb-1">Quick fix steps:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Open MongoDB Atlas dashboard</li>
              <li>Go to Network Access</li>
              <li>Add your current IP address</li>
              <li>Save and wait for changes</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  return children;
}

export function useDBErrorHandler() {
  const [dbError, setDbError] = useState(null);

  const handleAPIError = (response) => {
    if (!response.ok) {
      return response.json().then(data => {
        if (data.type === 'IP_WHITELIST_ERROR') {
          setDbError(data);
          throw new Error(data.message);
        }
        throw new Error(data.message || 'API request failed');
      });
    }
    return response.json();
  };

  const clearError = () => setDbError(null);

  return { dbError, handleAPIError, clearError };
}