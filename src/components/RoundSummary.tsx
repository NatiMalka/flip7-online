import React from 'react';
import type { Player, Room } from '../types';
import { Button } from './index';

interface RoundSummaryProps {
  isOpen: boolean;
  onClose: () => void;
  room: Room;
  currentPlayerId: string;
  onStartNextRound: () => void;
  onRestartGame: () => void;
}

export const RoundSummary: React.FC<RoundSummaryProps> = ({
  isOpen,
  onClose,
  room,
  currentPlayerId,
  onStartNextRound,
  onRestartGame,
}) => {
  if (!isOpen) return null;

  const currentPlayer = room.players[currentPlayerId];
  const isHost = currentPlayer?.isHost || false;
  const isGameOver = room.state === 'gameOver';
  const winner = room.winner ? room.players[room.winner] : null;

  // Sort players with proper tie-breaker logic
  const sortedPlayers = Object.values(room.players).sort((a, b) => {
    // Primary sort: highest total score
    if (b.totalScore !== a.totalScore) {
      return b.totalScore - a.totalScore;
    }
    // Tie-breaker 1: highest round score (recent performance)
    if (b.roundScore !== a.roundScore) {
      return b.roundScore - a.roundScore;
    }
    // Tie-breaker 2: fewest cards in hand (better hand management)
    return a.hand.length - b.hand.length;
  });

  // Calculate game statistics
  const gameStats = {
    totalPlayers: sortedPlayers.length,
    playersWithFlip7: sortedPlayers.filter(p => p.hasFlip7).length,
    bustedPlayers: sortedPlayers.filter(p => p.status === 'busted').length,
    highestScore: sortedPlayers[0]?.totalScore || 0,
    averageScore: Math.round(sortedPlayers.reduce((sum, p) => sum + p.totalScore, 0) / sortedPlayers.length) || 0,
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">
            {isGameOver ? 'Game Over!' : 'Round Summary'}
          </h2>
          
          {isGameOver && winner && (
            <div className="mb-4">
              <div className="text-yellow-400 text-xl font-bold mb-2">
                🎉 {winner.name} Wins! 🎉
              </div>
              <div className="text-gray-300">
                Final Score: {winner.totalScore} points
              </div>
            </div>
          )}
          
          {!isGameOver && (
            <div className="text-gray-300 mb-4">
              <div>Round {room.round} Complete</div>
              <div className="text-sm text-gray-400 mt-1">
                {room.maxRounds - room.round} rounds remaining
              </div>
            </div>
          )}
          
          {isGameOver && (
            <div className="text-gray-300 mb-4">
              <div className="text-sm">
                Game ended after {room.round} rounds
                {room.round >= room.maxRounds ? ' (Max rounds reached)' : ' (200+ points achieved)'}
              </div>
            </div>
          )}
        </div>

        {/* Game Statistics */}
        {isGameOver && (
          <div className="mb-6 bg-gray-700 rounded-lg p-4">
            <h3 className="text-md font-semibold text-white mb-3">Game Statistics</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="text-center">
                <div className="text-gray-400">Highest Score</div>
                <div className="text-white font-bold">{gameStats.highestScore}</div>
              </div>
              <div className="text-center">
                <div className="text-gray-400">Average Score</div>
                <div className="text-white font-bold">{gameStats.averageScore}</div>
              </div>
              <div className="text-center">
                <div className="text-gray-400">Flip 7s</div>
                <div className="text-yellow-400 font-bold">{gameStats.playersWithFlip7}</div>
              </div>
              <div className="text-center">
                <div className="text-gray-400">Busted</div>
                <div className="text-red-400 font-bold">{gameStats.bustedPlayers}</div>
              </div>
            </div>
          </div>
        )}

        {/* Player Scores */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-white mb-3">
            {isGameOver ? 'Final Scores' : 'Round Scores'}
          </h3>
          <div className="space-y-2">
            {sortedPlayers.map((player, index) => (
              <div
                key={player.id}
                className={`flex justify-between items-center p-3 rounded ${
                  player.id === currentPlayerId ? 'bg-blue-600' : 'bg-gray-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="text-lg font-bold text-gray-400">
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                  </div>
                  <div>
                    <div className="text-white font-semibold">
                      {player.name}
                      {player.id === currentPlayerId && (
                        <span className="ml-2 text-blue-300 text-sm">(You)</span>
                      )}
                    </div>
                    <div className="text-sm text-gray-400">
                      Round: {player.roundScore} | Total: {player.totalScore} | Cards: {player.hand.length}
                      {player.hasFlip7 && <span className="text-yellow-400 ml-2">🎉 Flip 7!</span>}
                      {player.status === 'busted' && <span className="text-red-400 ml-2">💥 Busted</span>}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-white">
                    {player.totalScore}
                  </div>
                  {player.totalScore >= 200 && (
                    <div className="text-xs text-yellow-400 font-semibold">
                      🎯 200+ Points!
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          {isGameOver ? (
            <>
              <Button
                variant="primary"
                onClick={onRestartGame}
                className="flex-1"
              >
                Play Again
              </Button>
              <Button
                variant="secondary"
                onClick={onClose}
                className="flex-1"
              >
                Back to Lobby
              </Button>
            </>
          ) : (
            <>
              {isHost && (
                <Button
                  variant="primary"
                  onClick={onStartNextRound}
                  className="flex-1"
                >
                  Start Next Round
                </Button>
              )}
              {!isHost && (
                <div className="flex-1 text-center text-gray-400">
                  Waiting for host to start next round...
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoundSummary; 