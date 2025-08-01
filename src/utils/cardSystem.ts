import type { Card, CardType, ActionCardType, ModifierCardType } from '../types';

// Card frequency distribution according to official Flip 7 rules
const CARD_DISTRIBUTION = {
  // Number cards (0-12)
  number: {
    0: 1,  // 1 zero
    1: 2,  // 2 ones
    2: 3,  // 3 twos
    3: 4,  // 4 threes
    4: 5,  // 5 fours
    5: 6,  // 6 fives
    6: 7,  // 7 sixes
    7: 8,  // 8 sevens
    8: 9,  // 9 eights
    9: 10, // 10 nines
    10: 11, // 11 tens
    11: 12, // 12 elevens
    12: 13, // 13 twelves
  },
  // Action cards
  action: {
    freeze: 3,        // 3 freeze cards
    flipThree: 3,     // 3 flip three cards
    secondChance: 3,  // 3 second chance cards
  },
  // Modifier cards
  modifier: {
    plus4: 2,     // 2 +4 cards
    plus6: 2,     // 2 +6 cards
    plus8: 2,     // 2 +8 cards
    plus10: 2,    // 2 +10 cards
    x2: 3,        // 3 ×2 multiplier cards
  }
};

/**
 * Generate a complete deck of Flip 7 cards
 */
export function generateDeck(): Card[] {
  const deck: Card[] = [];
  let cardId = 1;

  // Generate number cards (0-12)
  for (const [value, count] of Object.entries(CARD_DISTRIBUTION.number)) {
    const numValue = parseInt(value);
    for (let i = 0; i < count; i++) {
      deck.push({
        id: `card_${cardId++}`,
        type: 'number',
        value: numValue,
        isFlipped: false,
        isVisible: false,
      });
    }
  }

  // Generate action cards
  for (const [action, count] of Object.entries(CARD_DISTRIBUTION.action)) {
    for (let i = 0; i < count; i++) {
      deck.push({
        id: `card_${cardId++}`,
        type: 'action',
        action: action as ActionCardType,
        isFlipped: false,
        isVisible: false,
      });
    }
  }

  // Generate modifier cards
  for (const [modifier, count] of Object.entries(CARD_DISTRIBUTION.modifier)) {
    for (let i = 0; i < count; i++) {
      deck.push({
        id: `card_${cardId++}`,
        type: 'modifier',
        modifier: modifier as ModifierCardType,
        isFlipped: false,
        isVisible: false,
      });
    }
  }

  return deck;
}

/**
 * Shuffle the deck using Fisher-Yates algorithm
 */
export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Deal a specified number of cards from the deck
 */
export function dealCards(deck: Card[], count: number): { dealtCards: Card[], remainingDeck: Card[] } {
  if (count > deck.length) {
    throw new Error(`Cannot deal ${count} cards from deck with ${deck.length} cards`);
  }

  const dealtCards = deck.slice(0, count).map(card => ({ ...card, isVisible: true })); // Make all dealt cards visible
  const remainingDeck = deck.slice(count);

  return { dealtCards, remainingDeck };
}

/**
 * Deal one card to a player
 */
export function dealOneCard(deck: Card[]): { card: Card, remainingDeck: Card[] } {
  if (deck.length === 0) {
    throw new Error('Cannot deal from empty deck');
  }

  const card = { ...deck[0], isVisible: true }; // Make the card visible when dealt
  const remainingDeck = deck.slice(1);

  return { card, remainingDeck };
}

/**
 * Detect card type and return detailed information
 */
export function detectCardType(card: Card): {
  type: CardType;
  displayName: string;
  description: string;
  color: string;
} {
  switch (card.type) {
    case 'number':
      return {
        type: 'number',
        displayName: card.value?.toString() || 'Unknown',
        description: `Number card with value ${card.value}`,
        color: getNumberCardColor(card.value || 0),
      };

    case 'action':
      return getActionCardInfo(card.action || 'freeze');

    case 'modifier':
      return getModifierCardInfo(card.modifier || 'x2');

    default:
      return {
        type: 'number',
        displayName: 'Unknown',
        description: 'Unknown card type',
        color: '#666',
      };
  }
}

/**
 * Get color for number cards
 */
function getNumberCardColor(value: number): string {
  const colors = {
    0: '#95a5a6', // Gray
    1: '#ff6b6b', // Red
    2: '#4ecdc4', // Teal
    3: '#45b7d1', // Blue
    4: '#96ceb4', // Green
    5: '#feca57', // Yellow
    6: '#ff9ff3', // Pink
    7: '#54a0ff', // Blue
    8: '#5f27cd', // Purple
    9: '#00d2d3', // Cyan
    10: '#ff9f43', // Orange
    11: '#10ac84', // Emerald
    12: '#ff3838', // Red
  };
  return colors[value as keyof typeof colors] || '#666';
}

/**
 * Get action card information
 */
function getActionCardInfo(action: ActionCardType) {
  const actionInfo = {
    freeze: {
      displayName: 'Freeze',
      description: 'Freeze another player for one turn',
      color: '#00d2d3',
    },
    flipThree: {
      displayName: 'Flip Three',
      description: 'Flip three cards at once',
      color: '#ff9f43',
    },
    secondChance: {
      displayName: 'Second Chance',
      description: 'Get another turn if you bust',
      color: '#10ac84',
    },
  };
  return {
    type: 'action' as CardType,
    ...actionInfo[action],
  };
}

/**
 * Get modifier card information
 */
function getModifierCardInfo(modifier: ModifierCardType) {
  const modifierInfo = {
    plus4: {
      displayName: '+4',
      description: 'Add 4 points to your score',
      color: '#1e90ff',
    },
    plus6: {
      displayName: '+6',
      description: 'Add 6 points to your score',
      color: '#ff6348',
    },
    plus8: {
      displayName: '+8',
      description: 'Add 8 points to your score',
      color: '#ffa502',
    },
    plus10: {
      displayName: '+10',
      description: 'Add 10 points to your score',
      color: '#ff3838',
    },
    x2: {
      displayName: '×2',
      description: 'Double your score for this round',
      color: '#ff3838',
    },
  };
  return {
    type: 'modifier' as CardType,
    ...modifierInfo[modifier],
  };
}

/**
 * Calculate score for a hand of cards according to official Flip 7 rules
 */
export function calculateHandScore(cards: Card[]): {
  score: number;
  hasFlip7: boolean;
  modifiers: ModifierCardType[];
  breakdown: {
    numberCards: number;
    modifierMultiplier: number;
    flip7Bonus: number;
  };
} {
  // Get only number cards for scoring
  const numberCards = cards.filter(card => card.type === 'number');
  
  // Check for duplicates - if duplicates exist, score is 0 (busted)
  const numbers = numberCards.map(card => card.value).filter((value): value is number => value !== undefined);
  const uniqueNumbers = new Set(numbers);
  
  // If there are duplicates, score is 0 (busted)
  if (numbers.length !== uniqueNumbers.size) {
    return {
      score: 0,
      hasFlip7: false,
      modifiers: [],
      breakdown: {
        numberCards: 0,
        modifierMultiplier: 1,
        flip7Bonus: 0,
      },
    };
  }
  
  // Calculate score from unique number cards only
  let numberCardsScore = 0;
  
  for (const card of numberCards) {
    if (card.value !== undefined) {
      numberCardsScore += card.value;
    }
  }
  
  // Check for Flip 7 (7 unique number cards)
  const hasFlip7 = uniqueNumbers.size === 7;
  
  // Collect and apply modifier cards during play
  const modifiers: ModifierCardType[] = [];
  let modifierMultiplier = 1;
  
  for (const card of cards) {
    if (card.type === 'modifier' && card.modifier) {
      modifiers.push(card.modifier);
      switch (card.modifier) {
        case 'plus4':
          numberCardsScore += 4;
          break;
        case 'plus6':
          numberCardsScore += 6;
          break;
        case 'plus8':
          numberCardsScore += 8;
          break;
        case 'plus10':
          numberCardsScore += 10;
          break;
        case 'x2':
          modifierMultiplier *= 2;
          break;
      }
    }
  }
  
  // Calculate final score (modifiers applied during play)
  let finalScore = numberCardsScore * modifierMultiplier;
  
  // Add Flip 7 bonus (15 points) if 7 unique number cards
  const flip7Bonus = hasFlip7 ? 15 : 0;
  finalScore += flip7Bonus;
  
  return {
    score: finalScore,
    hasFlip7,
    modifiers,
    breakdown: {
      numberCards: numberCardsScore,
      modifierMultiplier,
      flip7Bonus,
    },
  };
}

/**
 * Check if a hand is busted (has duplicate number cards)
 */
export function isHandBusted(cards: Card[]): boolean {
  const { hasFlip7 } = calculateHandScore(cards);
  
  // If you have Flip 7, you can't bust
  if (hasFlip7) {
    return false;
  }

  // Check for duplicate number cards
  const numberCards = cards.filter(card => card.type === 'number');
  const numbers = numberCards.map(card => card.value);
  const uniqueNumbers = new Set(numbers);
  
  return numbers.length !== uniqueNumbers.size;
}

/**
 * Get card display information for UI
 */
export function getCardDisplayInfo(card: Card): {
  displayName: string;
  description: string;
  color: string;
  isSpecial: boolean;
} {
  const cardInfo = detectCardType(card);
  
  return {
    displayName: cardInfo.displayName,
    description: cardInfo.description,
    color: cardInfo.color,
    isSpecial: card.type !== 'number' || (card.value === 7),
  };
}

/**
 * Create a new deck and shuffle it
 */
export function createAndShuffleDeck(): Card[] {
  const deck = generateDeck();
  return shuffleDeck(deck);
} 