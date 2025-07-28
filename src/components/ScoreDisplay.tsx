import React from 'react';
import type { Player } from '../types';
import { calculateHandScore } from '../utils/cardSystem';

interface ScoreDisplayProps {
  player: Player;
  isCurrentPlayer: boolean;
  className?: string;
}

export const ScoreDisplay: React.FC<ScoreDisplayProps> = ({
  player,
  isCurrentPlayer,
  className = '',
}) => {
  // Calculate current hand score
  const { score: currentScore, hasFlip7, breakdown } = calculateHandScore(player.hand);
  
  // Get round score (if player stayed, use their roundScore, otherwise calculate current)
  const roundScore = player.status === 'stayed' ? player.roundScore : currentScore;
  
  return (
    <div className={`score-display ${className}`} style={{ minWidth: '120px' }}>
      {/* Current Hand Score */}
      <div className="mb-1">
        <div className="text-xs text-gray-500 mb-1">Current</div>
        <div className="text-lg font-bold text-white">
          {player.status === 'busted' ? 'BUSTED' : currentScore}
        </div>
        {hasFlip7 && (
          <div className="text-xs text-yellow-400 font-semibold animate-pulse">
            🎉 FLIP 7!
          </div>
        )}
      </div>

      {/* Round Score */}
      <div className="mb-1">
        <div className="text-xs text-gray-500 mb-1">Round</div>
        <div className="text-md font-semibold text-blue-300">
          {player.status === 'busted' ? 0 : roundScore}
        </div>
      </div>

      {/* Total Score */}
      <div>
        <div className="text-xs text-gray-500 mb-1">Total</div>
        <div className="text-xl font-bold text-green-400">
          {player.totalScore}
        </div>
      </div>

      {/* Score Breakdown (for current player only) */}
      {isCurrentPlayer && currentScore > 0 && (
        <div className="mt-2 p-1 bg-gray-800 rounded text-xs" style={{ fontSize: '10px' }}>
          <div className="text-gray-400 mb-1">Breakdown:</div>
          <div className="space-y-0.5">
            <div>Numbers: {breakdown.numberCards}</div>
            {breakdown.modifierMultiplier > 1 && (
              <div>×{breakdown.modifierMultiplier}</div>
            )}
            {breakdown.flip7Bonus > 0 && (
              <div className="text-yellow-400">+{breakdown.flip7Bonus}</div>
            )}
          </div>
        </div>
      )}

      {/* Status Indicator */}
      <div className="mt-1">
        <div className={`inline-block px-1 py-0.5 rounded text-xs font-medium ${
          player.status === 'active' ? 'bg-green-600 text-white' :
          player.status === 'stayed' ? 'bg-blue-600 text-white' :
          player.status === 'busted' ? 'bg-red-600 text-white' :
          'bg-gray-600 text-white'
        }`}>
          {player.status.toUpperCase()}
        </div>
      </div>
    </div>
  );
};

export default ScoreDisplay; 