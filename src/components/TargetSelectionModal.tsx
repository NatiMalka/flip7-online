import React from 'react';
import { Modal } from './index';
import type { Player } from '../types';

interface TargetSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTarget: (targetPlayerId: string) => void;
  players: Record<string, Player>;
  currentPlayerId: string;
  actionType: 'freeze' | 'flipThree';
}

export const TargetSelectionModal: React.FC<TargetSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelectTarget,
  players,
  currentPlayerId,
  actionType,
}) => {
  const availableTargets = Object.values(players).filter(
    player => 
      player.id !== currentPlayerId && 
      player.status === 'active'
      // Allow targeting frozen players - you can freeze someone who's already frozen
  );

  const getActionInfo = () => {
    switch (actionType) {
      case 'freeze':
        return {
          title: 'Choose Player to Freeze',
          description: 'Select a player to skip their next turn',
          icon: '❄️',
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
        };
      case 'flipThree':
        return {
          title: 'Choose Player for Flip Three',
          description: 'Select a player to draw 3 cards',
          icon: '🔄',
          color: 'text-purple-600',
          bgColor: 'bg-purple-50',
          borderColor: 'border-purple-200',
        };
      default:
        return {
          title: 'Choose Target',
          description: 'Select a target player',
          icon: '🎯',
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
        };
    }
  };

  const actionInfo = getActionInfo();

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={actionInfo.title}
    >
      <div className="space-y-4">
        <div className={`p-4 rounded-lg ${actionInfo.bgColor} border ${actionInfo.borderColor}`}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">{actionInfo.icon}</span>
            <span className={`font-semibold ${actionInfo.color}`}>
              {actionInfo.description}
            </span>
          </div>
          <p className="text-sm text-gray-600">
            {availableTargets.length === 0 
              ? 'No valid targets available'
              : `Select one of the ${availableTargets.length} available players:`
            }
          </p>
        </div>

        {availableTargets.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-500 text-lg mb-2">No valid targets</div>
            <div className="text-gray-400 text-sm">
              All other players are either busted, stayed, or frozen
            </div>
            <button
              onClick={onClose}
              className="mt-4 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="grid gap-3">
            {availableTargets.map((player) => (
              <button
                key={player.id}
                onClick={() => onSelectTarget(player.id)}
                className={`
                  p-4 rounded-lg border-2 border-transparent
                  hover:border-blue-300 hover:bg-blue-50
                  transition-all duration-200
                  text-left
                `}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                      {player.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">
                        {player.name}
                        {player.isFrozen && (
                          <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            ❄️ Frozen
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        Score: {player.totalScore} | Cards: {player.hand.length}
                      </div>
                    </div>
                  </div>
                  <div className="text-blue-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default TargetSelectionModal; 