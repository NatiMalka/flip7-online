import React from 'react';
import type { Card as CardType } from '../types';

interface CardDeckProps {
  cards: CardType[];
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
  isShuffling?: boolean;
  onClick?: () => void;
}

const CardDeck: React.FC<CardDeckProps> = ({
  cards,
  className = '',
  size = 'md',
  showCount = true,
  isShuffling = false,
  onClick,
}) => {
  const sizeClasses = {
    sm: 'w-12 h-16 md:w-14 md:h-18',
    md: 'w-16 h-24 md:w-20 md:h-28',
    lg: 'w-20 h-32 md:w-24 md:h-36',
  };

  const cardCount = cards.length;
  const maxVisibleCards = 3;
  const visibleCards = Math.min(cardCount, maxVisibleCards);

  return (
    <div 
      className={`relative ${sizeClasses[size]} ${className}`}
      onClick={onClick}
    >
      {/* Stack of cards with dark gray design */}
      {Array.from({ length: visibleCards }).map((_, index) => {
        const isTopCard = index === visibleCards - 1;
        const zIndex = visibleCards - index;
        const translateY = index * 1.5;
        const rotate = isShuffling ? Math.sin(Date.now() * 0.01 + index) * 3 : 0;

        return (
          <div
            key={index}
            className="absolute inset-0 transition-all duration-300 ease-out"
            style={{
              zIndex,
              transform: `translateY(${translateY}px) rotate(${rotate}deg)`,
            }}
          >
            {/* Card back with back-card.png image */}
            <div className="relative w-full h-full">
              <img 
                src="/back-card.png" 
                alt="Card Back" 
                className="w-full h-full object-cover rounded-xl shadow-lg"
                onError={(e) => {
                  // Fallback to CSS design if image fails to load
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent) {
                    parent.innerHTML = `
                      <div class="absolute inset-0 bg-gradient-to-br from-gray-700 via-gray-600 to-gray-800 rounded-xl border-2 border-gray-500/50 shadow-lg"></div>
                      <div class="absolute inset-1 rounded-lg border border-gray-400/30"></div>
                      <div class="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400/60 via-blue-300/80 to-blue-400/60 rounded-b-xl"></div>
                      <div class="absolute inset-2 rounded-md bg-gradient-to-br from-gray-600/50 to-gray-700/50"></div>
                    `;
                  }
                }}
              />
              
              {/* Red "D" letter peeking out (only on top card) */}
              {isTopCard && (
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-600 text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-white shadow-lg">
                  D
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Card count badge */}
      {showCount && cardCount > 0 && (
        <div className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg border-2 border-white">
          {cardCount}
        </div>
      )}

      {/* Shuffling animation overlay */}
      {isShuffling && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
        </div>
      )}

      {/* Hover effect */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/10 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
    </div>
  );
};

export default CardDeck; 