import React from 'react';
import { useGame } from '../hooks/useGame';

interface ConnectionStatusProps {
  className?: string;
}

export function ConnectionStatus({ className = '' }: ConnectionStatusProps) {
  const { isConnected, isReconnecting, error, clearError } = useGame();

  if (!isConnected && !isReconnecting && !error) {
    return null;
  }

  return (
    <div className={`fixed top-4 right-4 z-50 ${className}`}>
      {/* Connection Status */}
      {!isConnected && (
        <div className="bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg mb-2">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">Disconnected</span>
          </div>
        </div>
      )}

      {/* Reconnecting Status */}
      {isReconnecting && (
        <div className="bg-yellow-500 text-white px-4 py-2 rounded-lg shadow-lg mb-2">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-white rounded-full animate-spin"></div>
            <span className="text-sm font-medium">Reconnecting...</span>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-600 text-white px-4 py-3 rounded-lg shadow-lg mb-2 max-w-sm">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium">Error</p>
              <p className="text-xs mt-1">{error}</p>
            </div>
            <button
              onClick={clearError}
              className="ml-2 text-white hover:text-gray-200 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 