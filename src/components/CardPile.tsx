import React from 'react';
import Card from './Card';
import type { Card as CardType } from '../types';

interface CardPileProps {
  cards: CardType[];
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
  isHighlighted?: boolean;
  onClick?: () => void;
}

const CardPile: React.FC<CardPileProps> = ({
  cards,
  className = '',
  size = 'md',
  showCount = true,
  isHighlighted = false,
  onClick,
}) => {
  const sizeClasses = {
    sm: 'w-12 h-16 md:w-14 md:h-18',
    md: 'w-16 h-24 md:w-20 md:h-28',
    lg: 'w-20 h-32 md:w-24 md:h-36',
  };

  const cardCount = cards.length;
  const topCard = cards[cardCount - 1];

  return (
    <div 
      className={`relative ${sizeClasses[size]} ${className}`}
      onClick={onClick}
    >
      {/* Background cards (stack effect) */}
      {cardCount > 1 && (
        <>
          <div 
            className="absolute inset-0 bg-gradient-to-br from-slate-600 to-slate-700 rounded-xl border-2 border-slate-500/50 shadow-md"
            style={{ transform: 'translateY(2px)' }}
          />
          <div 
            className="absolute inset-0 bg-gradient-to-br from-slate-500 to-slate-600 rounded-xl border-2 border-slate-400/50 shadow-sm"
            style={{ transform: 'translateY(4px)' }}
          />
        </>
      )}

      {/* Top card */}
      {topCard && (
        <div className="relative z-10">
          <Card
            card={topCard}
            size={size}
            isHighlighted={isHighlighted}
            className="cursor-pointer"
          />
        </div>
      )}

      {/* Card count badge */}
      {showCount && cardCount > 1 && (
        <div className="absolute -bottom-2 -right-2 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg border-2 border-white z-20">
          {cardCount}
        </div>
      )}

      {/* Highlight effect */}
      {isHighlighted && (
        <div className="absolute inset-0 rounded-xl ring-4 ring-blue-400 ring-opacity-50 animate-pulse pointer-events-none z-30" />
      )}

      {/* Hover effect */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/10 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none z-40" />
    </div>
  );
};

export default CardPile; 