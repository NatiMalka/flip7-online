import React from 'react';
import type { Card as CardType } from '../types';

interface CardProps {
  card: CardType;
  onClick?: () => void;
  className?: string;
  showBack?: boolean;
}

const Card: React.FC<CardProps> = ({
  card,
  onClick,
  className = '',
  showBack = false,
}) => {
  const getCardContent = () => {
    if (showBack || !card.isVisible) {
      return (
        <div className="w-full h-full bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg border-2 border-blue-400 flex items-center justify-center">
          <div className="text-white text-2xl font-bold">♠</div>
        </div>
      );
    }

    switch (card.type) {
      case 'number':
        return (
          <div className="w-full h-full bg-white rounded-lg border-2 border-gray-300 flex items-center justify-center">
            <span className="text-3xl font-bold text-gray-800">{card.value}</span>
          </div>
        );
      
      case 'action':
        return (
          <div className="w-full h-full bg-blue-100 rounded-lg border-2 border-blue-400 flex items-center justify-center">
            <span className="text-lg font-semibold text-blue-700 text-center px-2">
              {card.action === 'freeze' && 'FREEZE'}
              {card.action === 'flipThree' && 'FLIP 3'}
              {card.action === 'secondChance' && '2ND CHANCE'}
            </span>
          </div>
        );
      
      case 'modifier':
        return (
          <div className="w-full h-full bg-green-100 rounded-lg border-2 border-green-400 flex items-center justify-center">
            <span className="text-lg font-semibold text-green-700">
              {card.modifier === 'x2' && '×2'}
              {card.modifier === 'x3' && '×3'}
              {card.modifier === 'reverse' && 'REVERSE'}
            </span>
          </div>
        );
      
      default:
        return null;
    }
  };

  const cardClasses = `
    w-16 h-24 md:w-20 md:h-28 
    cursor-pointer 
    transition-all duration-300 
    hover:scale-105 
    hover:shadow-lg
    ${card.isFlipped ? 'animate-flip' : ''}
    ${className}
  `;

  return (
    <div 
      className={cardClasses}
      onClick={onClick}
      style={{
        transformStyle: 'preserve-3d',
        transform: card.isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
      }}
    >
      {getCardContent()}
    </div>
  );
};

export default Card; 