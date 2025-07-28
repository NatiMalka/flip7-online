import React, { useEffect, useState } from 'react';

interface TurnTimerProps {
  timeRemaining: number; // milliseconds
  totalTime: number; // milliseconds
  isActive: boolean;
  playerName: string;
  onTimeout?: () => void;
  className?: string;
}

export const TurnTimer: React.FC<TurnTimerProps> = ({
  timeRemaining,
  totalTime,
  isActive,
  playerName,
  onTimeout,
  className = '',
}) => {
  const [localTimeRemaining, setLocalTimeRemaining] = useState(timeRemaining);

  // Update local time when props change
  useEffect(() => {
    setLocalTimeRemaining(timeRemaining);
  }, [timeRemaining]);

  // Countdown effect
  useEffect(() => {
    if (!isActive || localTimeRemaining <= 0) return;

    const interval = setInterval(() => {
      setLocalTimeRemaining(prev => {
        const newTime = prev - 100;
        if (newTime <= 0) {
          onTimeout?.();
          return 0;
        }
        return newTime;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isActive, localTimeRemaining, onTimeout]);

  // Calculate progress percentage
  const progress = Math.max(0, Math.min(100, (localTimeRemaining / totalTime) * 100));
  
  // Calculate time display
  const seconds = Math.ceil(localTimeRemaining / 1000);
  const minutes = Math.floor(seconds / 60);
  const displaySeconds = seconds % 60;

  // Get color based on time remaining
  const getTimerColor = () => {
    if (progress > 60) return '#10b981'; // Green
    if (progress > 30) return '#f59e0b'; // Yellow
    return '#ef4444'; // Red
  };

  // Get animation class based on time remaining
  const getAnimationClass = () => {
    if (progress <= 10) return 'animate-pulse';
    if (progress <= 30) return 'animate-bounce';
    return '';
  };

  if (!isActive) {
    return null;
  }

  return (
    <div className={`turn-timer ${className}`}>
      {/* Timer Container */}
      <div className="relative bg-gradient-to-r from-gray-900/90 to-gray-800/90 backdrop-blur-md rounded-2xl p-3 border border-gray-500/30 shadow-2xl">
        {/* Progress Bar */}
        <div className="relative h-2 bg-gray-600/50 rounded-full overflow-hidden mb-2">
          <div
            className="h-full transition-all duration-100 ease-linear rounded-full shadow-sm"
            style={{
              width: `${progress}%`,
              backgroundColor: getTimerColor(),
            }}
          />
          {/* Warning stripes when time is low */}
          {progress <= 30 && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse rounded-full" />
          )}
        </div>

        {/* Time Display */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${getAnimationClass()}`} 
                 style={{ backgroundColor: getTimerColor() }} />
            <span className="text-white text-xs font-medium">
              {playerName}'s Turn
            </span>
          </div>
          
          <div className={`text-lg font-bold ${getAnimationClass()}`}
               style={{ color: getTimerColor() }}>
            {minutes > 0 ? `${minutes}:${displaySeconds.toString().padStart(2, '0')}` : `${displaySeconds}s`}
          </div>
        </div>


      </div>
    </div>
  );
};

export default TurnTimer; 