import React, { useState } from 'react';
import type { Card as CardType } from '../types';

interface CardProps {
  card: CardType;
  onClick?: () => void;
  className?: string;
  showBack?: boolean;
  isDealing?: boolean;
  isFlipping?: boolean;
  isHighlighted?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const Card: React.FC<CardProps> = ({
  card,
  onClick,
  className = '',
  showBack = false,
  isDealing = false,
  isFlipping = false,
  isHighlighted = false,
  size = 'md',
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);

  const sizeClasses = {
    sm: 'w-12 h-16 md:w-14 md:h-18',
    md: 'w-16 h-24 md:w-20 md:h-28',
    lg: 'w-20 h-32 md:w-24 md:h-36',
  };

  // Official Flip 7 card colors based on the design
  const getCardColors = (value: number) => {
    switch (value) {
      case 12: return { number: '#6b7280', fan: '#1e3a8a' }; // grey, dark blue
      case 11: return { number: '#60a5fa', fan: '#1e3a8a' }; // light blue, dark blue
      case 10: return { number: '#dc2626', fan: '#ea580c' }; // red, orange-red
      case 9: return { number: '#ea580c', fan: '#ea580c' }; // orange, orange-red
      case 8: return { number: '#86efac', fan: '#166534' }; // light green, dark green
      case 7: return { number: '#ec4899', fan: '#7c2d12' }; // pink, dark pink/purple
      case 6: return { number: '#a855f7', fan: '#581c87' }; // purple, dark purple
      case 5: return { number: '#22c55e', fan: '#166534' }; // green, dark green
      case 4: return { number: '#06b6d4', fan: '#1e3a8a' }; // teal/cyan, dark blue
      case 3: return { number: '#f97316', fan: '#7c2d12' }; // red/coral, dark pink/purple
      case 2: return { number: '#84cc16', fan: '#eab308' }; // yellow-green, yellow
      case 1: return { number: '#6b7280', fan: '#eab308' }; // grey, yellow
      case 0: return { number: '#000000', fan: '#000000' }; // special rainbow for zero
      default: return { number: '#374151', fan: '#1e3a8a' };
    }
  };

  const getNumberText = (value: number) => {
    const numberWords = [
      'ZERO', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN',
      'EIGHT', 'NINE', 'TEN', 'ELEVEN', 'TWELVE'
    ];
    return numberWords[value] || 'ZERO';
  };

  const getCardBack = () => {
    // Use the back-card.png image
    if (imageError) {
      return (
        <div className="relative w-full h-full rounded-lg overflow-hidden">
          {/* Fallback CSS design */}
          <div className="absolute inset-0 bg-gradient-to-br from-amber-50 to-amber-100"></div>
          <div className="absolute inset-0 border-2 border-blue-800 rounded-lg"></div>
          <div className="absolute inset-1 border border-blue-800 rounded-md bg-amber-50">
            <div className="absolute top-1 left-1 w-2 h-2 border-l-2 border-t-2 border-blue-800"></div>
            <div className="absolute top-1 right-1 w-2 h-2 border-r-2 border-t-2 border-blue-800"></div>
            <div className="absolute bottom-1 left-1 w-2 h-2 border-l-2 border-b-2 border-blue-800"></div>
            <div className="absolute bottom-1 right-1 w-2 h-2 border-r-2 border-b-2 border-blue-800"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
              <div className="text-blue-800 text-lg font-bold tracking-wider">FLIP7</div>
              <div className="text-blue-600 text-xs text-center mt-1">ONLINE</div>
            </div>
          </div>
        </div>
      );
    }
    
    return (
      <div className="relative w-full h-full rounded-lg overflow-hidden">
        <img 
          src="/back-card.png" 
          alt="Card Back" 
          className="w-full h-full object-cover rounded-lg"
          onError={() => setImageError(true)}
        />
      </div>
    );
  };

  const getNumberCard = () => {
    // Use PNG images for all number cards
    const pngFileName = `${card.value}.png`;
    
    if (imageError) {
      return (
        <div className="relative w-full h-full rounded-lg overflow-hidden">
          {getFallbackNumberCard()}
        </div>
      );
    }
    
    return (
      <div className="relative w-full h-full rounded-lg overflow-hidden">
        <img 
          src={`/${pngFileName}`} 
          alt={`Number ${card.value} Card`} 
          className="w-full h-full object-cover rounded-lg"
          onError={() => setImageError(true)}
        />
      </div>
    );
  };

  // Fallback function for when PNG files don't exist
  const getFallbackNumberCard = () => {
    const colors = getCardColors(card.value!);
    const numberText = getNumberText(card.value!);

    return (
      <>
        <div className="absolute inset-0 bg-gradient-to-br from-amber-50 to-amber-100"></div>
        <div className="absolute inset-0 border-2 border-blue-800 rounded-lg"></div>
        <div className="absolute inset-1 border border-blue-800 rounded-md bg-amber-50">
          <div className="absolute top-1 left-1 w-2 h-2 border-l-2 border-t-2 border-blue-800"></div>
          <div className="absolute top-1 right-1 w-2 h-2 border-r-2 border-t-2 border-blue-800"></div>
          <div className="absolute bottom-1 left-1 w-2 h-2 border-l-2 border-b-2 border-blue-800"></div>
          <div className="absolute bottom-1 right-1 w-2 h-2 border-r-2 border-b-2 border-blue-800"></div>
          <div className="absolute top-2 left-2 w-3 h-4">
            <div className="w-full h-full" style={{ backgroundColor: colors.fan }}></div>
          </div>
          <div className="absolute top-2 right-2 w-3 h-4">
            <div className="w-full h-full" style={{ backgroundColor: colors.fan }}></div>
          </div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
            <div 
              className="text-3xl font-black"
              style={{ 
                color: colors.number,
                textShadow: '2px 2px 0px rgba(0,0,0,0.3)',
                WebkitTextStroke: '1px white'
              }}
            >
              {card.value}
            </div>
          </div>
          <div className="absolute bottom-2 left-2 right-2">
            <div className="bg-amber-50 border border-blue-800 rounded px-1 py-0.5 text-center">
              <span className="text-blue-800 text-xs font-bold">{numberText}</span>
            </div>
          </div>
        </div>
      </>
    );
  };

  const getActionCard = () => {
    // Map action types to PNG filenames
    const actionPngMap: Record<string, string> = {
      freeze: 'freeze.png',
      flipThree: 'flip-three.png',
      secondChance: 'second-chance.png',
    };

    const pngFileName = actionPngMap[card.action!];
    
    if (imageError || !pngFileName || !card.action) {
      return (
        <div className="relative w-full h-full rounded-lg overflow-hidden">
          {getFallbackActionCard()}
        </div>
      );
    }
    
    return (
      <div className="relative w-full h-full rounded-lg overflow-hidden">
        <img 
          src={`/${pngFileName}`} 
          alt={`${card.action} Action Card`} 
          className="w-full h-full object-cover rounded-lg"
          onError={() => setImageError(true)}
        />
      </div>
    );
  };

  // Fallback function for action cards
  const getFallbackActionCard = () => {
    const actionConfig = {
      freeze: {
        bg: 'from-blue-500 to-cyan-500',
        text: 'FREEZE',
        icon: '❄️',
        color: 'text-blue-700',
      },
      flipThree: {
        bg: 'from-purple-500 to-pink-500',
        text: 'FLIP 3',
        icon: '🔄',
        color: 'text-purple-700',
      },
      secondChance: {
        bg: 'from-green-500 to-emerald-500',
        text: '2ND CHANCE',
        icon: '🔄',
        color: 'text-green-700',
      },
    };

    const config = actionConfig[card.action!] || actionConfig.freeze; // Default fallback

    return (
      <>
        <div className="absolute inset-0 bg-gradient-to-br from-amber-50 to-amber-100"></div>
        <div className="absolute inset-0 border-2 border-blue-800 rounded-lg"></div>
        <div className="absolute inset-1 border border-blue-800 rounded-md bg-amber-50">
          <div className="absolute top-1 left-1 w-2 h-2 border-l-2 border-t-2 border-blue-800"></div>
          <div className="absolute top-1 right-1 w-2 h-2 border-r-2 border-t-2 border-blue-800"></div>
          <div className="absolute bottom-1 left-1 w-2 h-2 border-l-2 border-b-2 border-blue-800"></div>
          <div className="absolute bottom-1 right-1 w-2 h-2 border-r-2 border-b-2 border-blue-800"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
            <div className="text-2xl mb-1">{config.icon}</div>
            <div className={`text-xs font-bold ${config.color} bg-white/90 px-2 py-1 rounded-full`}>
              {config.text}
            </div>
          </div>
          <div className="absolute bottom-2 left-2 right-2">
            <div className="bg-amber-50 border border-blue-800 rounded px-1 py-0.5 text-center">
              <span className="text-blue-800 text-xs font-bold">{config.text}</span>
            </div>
          </div>
        </div>
      </>
    );
  };

  const getModifierCard = () => {
    // Map modifier types to PNG filenames
    const modifierPngMap: Record<string, string> = {
      plus4: '+4.png',
      plus6: '+6.png',
      plus8: '+8.png',
      plus10: '+10.png',
      x2: 'x2.png',
    };

    const pngFileName = modifierPngMap[card.modifier!];
    
    if (imageError || !pngFileName || !card.modifier) {
      return (
        <div className="relative w-full h-full rounded-lg overflow-hidden">
          {getFallbackModifierCard()}
        </div>
      );
    }
    
    return (
      <div className="relative w-full h-full rounded-lg overflow-hidden">
        <img 
          src={`/${pngFileName}`} 
          alt={`${card.modifier} Modifier Card`} 
          className="w-full h-full object-cover rounded-lg"
          onError={() => setImageError(true)}
        />
      </div>
    );
  };

  // Fallback function for modifier cards
  const getFallbackModifierCard = () => {
    const modifierConfig = {
      plus4: { bg: 'from-red-500 to-pink-500', text: '+4', icon: '➕' },
      plus6: { bg: 'from-pink-500 to-purple-500', text: '+6', icon: '➕' },
      plus8: { bg: 'from-purple-500 to-indigo-500', text: '+8', icon: '➕' },
      plus10: { bg: 'from-indigo-500 to-blue-500', text: '+10', icon: '➕' },
      x2: { bg: 'from-yellow-400 to-orange-500', text: '×2', icon: '⚡' },
    };

    const config = modifierConfig[card.modifier!] || modifierConfig.plus4; // Default fallback

    return (
      <>
        <div className="absolute inset-0 bg-gradient-to-br from-amber-50 to-amber-100"></div>
        <div className="absolute inset-0 border-2 border-blue-800 rounded-lg"></div>
        <div className="absolute inset-1 border border-blue-800 rounded-md bg-amber-50">
          <div className="absolute top-1 left-1 w-2 h-2 border-l-2 border-t-2 border-blue-800"></div>
          <div className="absolute top-1 right-1 w-2 h-2 border-r-2 border-t-2 border-blue-800"></div>
          <div className="absolute bottom-1 left-1 w-2 h-2 border-l-2 border-b-2 border-blue-800"></div>
          <div className="absolute bottom-1 right-1 w-2 h-2 border-r-2 border-b-2 border-blue-800"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
            <div className="text-3xl mb-1">{config.icon}</div>
            <div className="text-white text-lg font-black bg-black/20 px-3 py-1 rounded-full">
              {config.text}
            </div>
          </div>
          <div className="absolute bottom-2 left-2 right-2">
            <div className="bg-amber-50 border border-blue-800 rounded px-1 py-0.5 text-center">
              <span className="text-blue-800 text-xs font-bold">{config.text}</span>
            </div>
          </div>
        </div>
      </>
    );
  };

  const getCardContent = () => {
    if (showBack || !card.isVisible) {
      return getCardBack();
    }

    switch (card.type) {
      case 'number':
        return getNumberCard();
      case 'action':
        return getActionCard();
      case 'modifier':
        return getModifierCard();
      default:
        return getCardBack();
    }
  };

  const cardClasses = `
    ${sizeClasses[size]}
    cursor-pointer 
    transition-all duration-300 ease-out
    transform perspective-1000
    ${isHovered ? 'scale-110 -translate-y-2' : 'scale-100'}
    ${isHighlighted ? 'ring-4 ring-yellow-400 ring-opacity-50 shadow-2xl' : ''}
    ${isDealing ? 'animate-cardDeal' : ''}
    ${isFlipping ? 'animate-cardFlip' : ''}
    ${className}
  `;

  const shadowClasses = `
    ${isHovered 
      ? 'shadow-2xl shadow-black/30' 
      : 'shadow-lg shadow-black/20'
    }
    ${isHighlighted 
      ? 'shadow-yellow-400/50' 
      : ''
    }
  `;

  return (
    <div 
      className={`${cardClasses} ${shadowClasses}`}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
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