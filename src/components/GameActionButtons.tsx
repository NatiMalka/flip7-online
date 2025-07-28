import React, { useState, useRef } from 'react';
import { Button } from './index';

interface GameActionButtonsProps {
  canHit: boolean;
  canStay: boolean;
  isMyTurn: boolean;
  isLoading: boolean;
  onHit: () => void;
  onStay: () => void;
  timeRemaining?: number;
  totalTime?: number;
  className?: string;
}

export const GameActionButtons: React.FC<GameActionButtonsProps> = ({
  canHit,
  canStay,
  isMyTurn,
  isLoading,
  onHit,
  onStay,
  timeRemaining = 30000,
  totalTime = 30000,
  className = '',
}) => {
  const [isHoveringHit, setIsHoveringHit] = useState(false);
  const [isHoveringStay, setIsHoveringStay] = useState(false);
  const [lastAction, setLastAction] = useState<'hit' | 'stay' | null>(null);
  const hitCooldownRef = useRef<boolean>(false);

  // Calculate urgency based on time remaining
  const timeProgress = timeRemaining / totalTime;
  const isUrgent = timeProgress <= 0.3;
  const isCritical = timeProgress <= 0.1;

  // Handle hit action with ref-based debounce for better performance
  const handleHit = () => {
    console.log('🟡 GameActionButtons handleHit called');
    console.log('🟡 canHit:', canHit);
    console.log('🟡 isLoading:', isLoading);
    console.log('🟡 hitCooldownRef.current:', hitCooldownRef.current);
    
    // Primary check - must be able to hit
    if (!canHit) {
      console.log('❌ Cannot hit - canHit is false');
      return;
    }

    // Ref-based cooldown (faster than state-based)
    if (hitCooldownRef.current) {
      console.log('❌ Hit action in cooldown (ref), ignoring');
      return;
    }
    
    console.log('✅ Proceeding with hit action');
    
    // Set cooldown immediately using ref (no re-render delay)
    hitCooldownRef.current = true;
    setLastAction('hit');
    
    console.log('🔄 Calling onHit()');
    onHit();
    
    // Clear cooldown after delay - longer to prevent double hits
    setTimeout(() => {
      hitCooldownRef.current = false;
      setLastAction(null);
    }, 800); // Longer to prevent rapid double hits
  };

  // Handle stay action
  const handleStay = () => {
    if (!canStay || isLoading) return;
    
    setLastAction('stay');
    onStay();
    
    // Reset action after animation
    setTimeout(() => setLastAction(null), 1000);
  };

  // Get button styles based on state
  const getHitButtonStyle = () => {
    if (isCritical) {
      return {
        backgroundColor: 'rgba(239, 68, 68, 0.9)',
        animation: 'pulse 0.5s infinite',
        transform: 'scale(1.05)',
      };
    }
    if (isUrgent) {
      return {
        backgroundColor: 'rgba(245, 158, 11, 0.9)',
        animation: 'bounce 1s infinite',
      };
    }
    return {
      backgroundColor: 'rgba(220, 38, 38, 0.9)',
    };
  };

  const getStayButtonStyle = () => {
    if (isCritical) {
      return {
        backgroundColor: 'rgba(34, 197, 94, 0.9)',
        animation: 'pulse 0.5s infinite',
        transform: 'scale(1.05)',
      };
    }
    if (isUrgent) {
      return {
        backgroundColor: 'rgba(59, 130, 246, 0.9)',
        animation: 'bounce 1s infinite',
      };
    }
    return {
      backgroundColor: 'rgba(2, 132, 199, 0.9)',
    };
  };

  if (!isMyTurn) {
    return (
      <div className={`game-action-buttons ${className}`}>
        <div className="bg-gray-700 rounded-lg p-6 text-center">
          <div className="text-gray-400 text-sm mb-2">Waiting for your turn...</div>
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`game-action-buttons ${className}`}>
      {/* Action Buttons Container */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-xl p-4 shadow-2xl border border-gray-600">
        {/* Action Buttons */}
        <div className="flex gap-4 justify-center">
          {/* Hit Button */}
          <div className="relative">
            <Button
              variant="primary"
              size="lg"
              onClick={handleHit}
              disabled={!canHit || isLoading}
              onMouseEnter={() => setIsHoveringHit(true)}
              onMouseLeave={() => setIsHoveringHit(false)}
              className={`
                min-w-[140px] h-16 text-lg font-bold transition-all duration-300
                ${isHoveringHit ? 'scale-105 shadow-xl' : ''}
                ${lastAction === 'hit' ? 'animate-bounce' : ''}
                ${isCritical ? 'ring-4 ring-red-500 ring-opacity-50' : ''}
              `}
              style={getHitButtonStyle()}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Processing...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🎯</span>
                  <span>Hit</span>
                </div>
              )}
            </Button>
            
            {/* Hit button effects */}
            {isHoveringHit && (
              <div className="absolute -inset-1 bg-red-500 rounded-lg blur opacity-75 animate-pulse"></div>
            )}
          </div>

          {/* Stay Button */}
          <div className="relative">
            <Button
              variant="secondary"
              size="lg"
              onClick={handleStay}
              disabled={!canStay || isLoading}
              onMouseEnter={() => setIsHoveringStay(true)}
              onMouseLeave={() => setIsHoveringStay(false)}
              className={`
                min-w-[140px] h-16 text-lg font-bold transition-all duration-300
                ${isHoveringStay ? 'scale-105 shadow-xl' : ''}
                ${lastAction === 'stay' ? 'animate-bounce' : ''}
                ${isCritical ? 'ring-4 ring-green-500 ring-opacity-50' : ''}
              `}
              style={getStayButtonStyle()}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Processing...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-2xl">✋</span>
                  <span>Stay</span>
                </div>
              )}
            </Button>
            
            {/* Stay button effects */}
            {isHoveringStay && (
              <div className="absolute -inset-1 bg-blue-500 rounded-lg blur opacity-75 animate-pulse"></div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameActionButtons; 