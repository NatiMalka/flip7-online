import React from 'react';
import Card from './Card';
import type { Card as CardType } from '../types';

interface CardHandProps {
  cards: CardType[];
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  isPlayerTurn?: boolean;
  isActive?: boolean;
  onCardClick?: (card: CardType, index: number) => void;
  showBack?: boolean;
  maxVisibleCards?: number;
}

const CardHand: React.FC<CardHandProps> = ({
  cards,
  className = '',
  size = 'md',
  isPlayerTurn = false,
  isActive = true,
  onCardClick,
  showBack = false,
  maxVisibleCards = 7,
}) => {
  const visibleCards = cards.slice(0, maxVisibleCards);
  const hiddenCards = Math.max(0, cards.length - visibleCards.length);

  const getCardSpacing = () => {
    switch (size) {
      case 'sm':
        return 'ml-[-8px]';
      case 'md':
        return 'ml-[-12px]';
      case 'lg':
        return 'ml-[-16px]';
      default:
        return 'ml-[-12px]';
    }
  };

  const getCardZIndex = (index: number) => {
    return visibleCards.length - index;
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="relative flex items-center">
        {/* Visible cards */}
        {visibleCards.map((card, index) => (
          <div
            key={card.id}
            className={`relative ${getCardSpacing()} first:ml-0 transition-all duration-300 ease-out`}
            style={{
              zIndex: getCardZIndex(index),
              transform: `translateX(${index * 2}px)`,
            }}
          >
            <Card
              card={card}
              size={size}
              showBack={showBack}
              isHighlighted={isPlayerTurn && isActive}
              onClick={() => onCardClick?.(card, index)}
              className={`
                ${isPlayerTurn && isActive ? 'hover:scale-110' : ''}
                ${isActive ? 'cursor-pointer' : 'cursor-default opacity-75'}
                transition-all duration-300 ease-out
              `}
            />
          </div>
        ))}

        {/* Hidden cards indicator */}
        {hiddenCards > 0 && (
          <div
            className={`relative ${getCardSpacing()} ml-2`}
            style={{ zIndex: 1 }}
          >
            <div className={`
              ${size === 'sm' ? 'w-12 h-16 md:w-14 md:h-18' : 
                size === 'md' ? 'w-16 h-24 md:w-20 md:h-28' : 
                'w-20 h-32 md:w-24 md:h-36'}
              bg-gradient-to-br from-slate-600 to-slate-800 
              rounded-xl border-2 border-slate-500/50 
              flex items-center justify-center
              shadow-lg
            `}>
              <div className="text-white text-xs font-bold">
                +{hiddenCards}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Turn indicator */}
      {isPlayerTurn && isActive && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <div className="bg-yellow-400 text-black text-xs font-bold px-2 py-1 rounded-full shadow-lg animate-pulse">
            YOUR TURN
          </div>
        </div>
      )}

      {/* Active indicator */}
      {isActive && !isPlayerTurn && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <div className="bg-green-400 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
            ACTIVE
          </div>
        </div>
      )}
    </div>
  );
};

export default CardHand; 