import React from 'react';
import type { Player } from '../types';

interface TurnIndicatorProps {
  players: Player[];
  currentTurn: string | null;
  turnOrder: string[];
  isMyTurn: boolean;
  className?: string;
}

export const TurnIndicator: React.FC<TurnIndicatorProps> = ({
  players,
  currentTurn,
  turnOrder,
  isMyTurn,
  className = '',
}) => {
  // Get current player info
  const currentPlayer = currentTurn ? players.find(p => p.id === currentTurn) : null;
  
  // Get next player in turn order
  const getNextPlayer = () => {
    if (!currentTurn) return null;
    const currentIndex = turnOrder.indexOf(currentTurn);
    if (currentIndex === -1) return null;
    
    const nextIndex = (currentIndex + 1) % turnOrder.length;
    const nextPlayerId = turnOrder[nextIndex];
    return players.find(p => p.id === nextPlayerId);
  };

  const nextPlayer = getNextPlayer();

  return (
    <div className={`turn-indicator ${className}`}>
      {/* Main Turn Display */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-4 text-white shadow-lg">
        <div className="flex items-center justify-between">
          {/* Current Turn */}
          <div className="flex items-center gap-3">
            <div className="relative">
              {/* Turn indicator dot */}
              <div className="w-4 h-4 bg-green-400 rounded-full animate-pulse" />
              {/* Pulsing ring */}
              <div className="absolute inset-0 w-4 h-4 bg-green-400 rounded-full animate-ping opacity-75" />
            </div>
            
            <div>
              <div className="text-sm text-blue-100 mb-1">
                {isMyTurn ? 'Your Turn!' : 'Current Turn'}
              </div>
              <div className="text-lg font-bold">
                {currentPlayer?.name || 'No Player'}
              </div>
            </div>
          </div>

          {/* Turn Status */}
          <div className="text-right">
            <div className="text-sm text-blue-100 mb-1">
              Status
            </div>
            <div className="text-lg font-bold">
              {currentPlayer?.status === 'active' ? '🟢 Active' : '⚪ Inactive'}
            </div>
          </div>
        </div>

        {/* Turn Order Preview */}
        {turnOrder.length > 1 && (
          <div className="mt-3 pt-3 border-t border-blue-400/30">
            <div className="text-xs text-blue-100 mb-2">Turn Order</div>
            <div className="flex items-center gap-2 overflow-x-auto">
              {turnOrder.map((playerId, index) => {
                const player = players.find(p => p.id === playerId);
                const isCurrent = playerId === currentTurn;
                const isNext = playerId === nextPlayer?.id;
                
                return (
                  <div
                    key={playerId}
                    className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
                      isCurrent
                        ? 'bg-green-500 text-white'
                        : isNext
                        ? 'bg-yellow-500 text-black'
                        : 'bg-blue-500/30 text-blue-100'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-current" />
                    <span className="truncate max-w-16">
                      {player?.name || 'Unknown'}
                    </span>
                    {isCurrent && <span className="ml-1">👤</span>}
                    {isNext && <span className="ml-1">⏭️</span>}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Next Turn Preview */}
      {nextPlayer && (
        <div className="mt-2 bg-gray-700 rounded-lg p-3">
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse" />
              <span className="text-sm text-gray-300">Next:</span>
              <span className="text-sm font-medium">{nextPlayer.name}</span>
            </div>
            <div className="text-xs text-gray-400">
              {nextPlayer.status === 'active' ? 'Ready' : 'Waiting'}
            </div>
          </div>
        </div>
      )}

      {/* Turn Statistics */}
      <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
        <div className="bg-gray-800 rounded p-2 text-center">
          <div className="text-gray-400">Active</div>
          <div className="text-white font-bold">
            {players.filter(p => p.status === 'active').length}
          </div>
        </div>
        <div className="bg-gray-800 rounded p-2 text-center">
          <div className="text-gray-400">Stayed</div>
          <div className="text-white font-bold">
            {players.filter(p => p.status === 'stayed').length}
          </div>
        </div>
        <div className="bg-gray-800 rounded p-2 text-center">
          <div className="text-gray-400">Busted</div>
          <div className="text-white font-bold">
            {players.filter(p => p.status === 'busted').length}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TurnIndicator; 