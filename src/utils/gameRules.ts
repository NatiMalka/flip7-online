import type { 
  Card, 
  Player, 
  PlayerStatus,
  Room
} from '../types';
import { calculateHandScore } from './cardSystem';

// Game Constants
export const FLIP_7_BONUS = 15;
export const MAX_ROUNDS = 5;

// Player Status Types
export type TurnStatus = 'active' | 'stayed' | 'busted' | 'frozen' | 'flippingThree';

// Game Action Results
export interface GameActionResult {
  success: boolean;
  message: string;
  updatedRoom?: Partial<Room>;
  effects?: GameEffect[];
}

export interface GameEffect {
  type: 'freeze' | 'flipThree' | 'secondChance' | 'bust' | 'flip7' | 'stay';
  targetPlayerId?: string;
  sourcePlayerId?: string;
  cards?: Card[];
  message: string;
}

// Round State
export interface RoundState {
  currentTurn: string | null;
  playerStatuses: Record<string, TurnStatus>;
  frozenPlayers: Set<string>;
  flippingThreePlayers: Set<string>;
  secondChanceHolders: Set<string>;
  roundEnded: boolean;
  winner: string | null;
}

/**
 * Initialize a new round
 */
export function initializeRound(room: Room): Room {
  const shuffledDeck = shuffleDeck([...room.deck, ...room.discardPile]);
  
  // Deal one card to each player
  const updatedPlayers: Record<string, Player> = {};
  let remainingDeck = [...shuffledDeck];
  
  for (const [playerId, player] of Object.entries(room.players)) {
    if (remainingDeck.length > 0) {
      const { card, remainingDeck: newDeck } = dealOneCard(remainingDeck);
      remainingDeck = newDeck;
      
      updatedPlayers[playerId] = {
        ...player,
        hand: [card],
        status: 'active',
        hasFlip7: false,
      };
    }
  }

  // Determine first player (host or first player in list)
  const playerIds = Object.keys(updatedPlayers);
  const firstPlayer = playerIds[0];

  return {
    ...room,
    players: updatedPlayers,
    deck: remainingDeck,
    discardPile: [],
    round: room.round + 1,
    state: 'playing',
    currentTurn: firstPlayer,
  };
}

/**
 * Check if a player has Flip 7 (7 unique number cards)
 */
export function hasFlip7(cards: Card[]): boolean {
  const numberCards = cards.filter(card => card.type === 'number');
  const uniqueNumbers = new Set(numberCards.map(card => card.value));
  return uniqueNumbers.size === 7;
}

/**
 * Check if a player has busted (drew a duplicate number)
 */
export function hasBusted(cards: Card[]): boolean {
  const numberCards = cards.filter(card => card.type === 'number');
  const numbers = numberCards.map(card => card.value);
  const uniqueNumbers = new Set(numbers);
  return numbers.length !== uniqueNumbers.size;
}

/**
 * Check if a player can use Second Chance to avoid bust
 */
export function canUseSecondChance(cards: Card[]): boolean {
  return cards.some(card => card.type === 'action' && card.action === 'secondChance');
}

/**
 * Use Second Chance to avoid bust
 */
export function applySecondChance(cards: Card[]): { 
  newCards: Card[]; 
  removedCards: Card[]; 
  duplicateNumber: number | null;
} {
  const numberCards = cards.filter(card => card.type === 'number');
  const numbers = numberCards.map(card => card.value).filter((value): value is number => value !== undefined);
  
  // Find the duplicate number
  const seen = new Set<number>();
  let duplicateNumber: number | null = null;
  
  for (const num of numbers) {
    if (seen.has(num)) {
      duplicateNumber = num;
      break;
    }
    seen.add(num);
  }

  // Remove the duplicate and Second Chance card
  const newCards = cards.filter(card => 
    !(card.type === 'number' && card.value === duplicateNumber) &&
    !(card.type === 'action' && card.action === 'secondChance')
  );

  const removedCards = cards.filter(card => 
    (card.type === 'number' && card.value === duplicateNumber) ||
    (card.type === 'action' && card.action === 'secondChance')
  );

  return { newCards, removedCards, duplicateNumber };
}

/**
 * Process a player's Hit action
 */
export function processHitAction(
  room: Room, 
  playerId: string
): GameActionResult {
  const player = room.players[playerId];
  
  if (!player || player.status !== 'active') {
    return {
      success: false,
      message: 'Player cannot hit at this time',
    };
  }

  if (room.currentTurn !== playerId) {
    return {
      success: false,
      message: 'Not your turn',
    };
  }

  if (room.deck.length === 0) {
    return {
      success: false,
      message: 'No cards left in deck',
    };
  }

  // Deal a card
  const { card, remainingDeck } = dealOneCard(room.deck);
  const newHand = [...player.hand, card];
  
  // Check for Flip 7
  if (hasFlip7(newHand)) {
    return handleFlip7(room, playerId, newHand);
  }

  // Check for bust
  if (hasBusted(newHand)) {
    if (canUseSecondChance(newHand)) {
      return handleSecondChance(room, playerId, newHand, remainingDeck);
    } else {
      return handleBust(room, playerId, newHand, remainingDeck);
    }
  }

  // Check for Action cards that need immediate resolution
  if (card.type === 'action') {
    return handleActionCard(room, playerId, card, newHand, remainingDeck);
  }

  // Update player and move to next turn
  const updatedPlayers = {
    ...room.players,
    [playerId]: {
      ...player,
      hand: newHand,
      hasFlip7: hasFlip7(newHand),
    },
  };

  const nextTurn = getNextActivePlayer(updatedPlayers, playerId);

  return {
    success: true,
    message: `Drew ${getCardDisplayName(card)}`,
    updatedRoom: {
      ...room,
      players: updatedPlayers,
      deck: remainingDeck,
      currentTurn: nextTurn,
    },
  };
}

/**
 * Process a player's Stay action
 */
export function processStayAction(
  room: Room, 
  playerId: string
): GameActionResult {
  const player = room.players[playerId];
  
  if (!player || player.status !== 'active') {
    return {
      success: false,
      message: 'Player cannot stay at this time',
    };
  }

  if (room.currentTurn !== playerId) {
    return {
      success: false,
      message: 'Not your turn',
    };
  }

  // Calculate current score
  const { score } = calculateHandScore(player.hand);
  
  // Update player status to stayed
  const updatedPlayers: Record<string, Player> = {
    ...room.players,
    [playerId]: {
      ...player,
      status: 'stayed' as PlayerStatus,
      score: player.score + score,
    },
  };

  const nextTurn = getNextActivePlayer(updatedPlayers, playerId);

  // Check if round should end
  if (shouldEndRound(updatedPlayers)) {
    return endRound(room, updatedPlayers);
  }

  return {
    success: true,
    message: `Stayed with ${score} points`,
    updatedRoom: {
      ...room,
      players: updatedPlayers,
      currentTurn: nextTurn,
    },
    effects: [{
      type: 'stay',
      targetPlayerId: playerId,
      message: `${player.name} stayed with ${score} points`,
    }],
  };
}

/**
 * Handle Flip 7 auto-win
 */
function handleFlip7(
  room: Room,
  playerId: string,
  newHand: Card[]
): GameActionResult {
  const player = room.players[playerId];
  const { score } = calculateHandScore(newHand);
  const totalScore = score + FLIP_7_BONUS;

  const updatedPlayers: Record<string, Player> = {
    ...room.players,
    [playerId]: {
      ...player,
      hand: newHand,
      status: 'stayed' as PlayerStatus,
      score: player.score + totalScore,
      hasFlip7: true,
    },
  };

  // End the round immediately
  return endRound(room, updatedPlayers, playerId);
}

/**
 * Handle bust
 */
function handleBust(
  room: Room,
  playerId: string,
  newHand: Card[],
  remainingDeck: Card[]
): GameActionResult {
  const player = room.players[playerId];

  const updatedPlayers: Record<string, Player> = {
    ...room.players,
    [playerId]: {
      ...player,
      hand: newHand,
      status: 'busted' as PlayerStatus,
      score: player.score, // No points for busted round
    },
  };

  const nextTurn = getNextActivePlayer(updatedPlayers, playerId);

  // Check if round should end
  if (shouldEndRound(updatedPlayers)) {
    return endRound(room, updatedPlayers);
  }

  return {
    success: true,
    message: 'Busted!',
    updatedRoom: {
      ...room,
      players: updatedPlayers,
      deck: remainingDeck,
      currentTurn: nextTurn,
    },
    effects: [{
      type: 'bust',
      targetPlayerId: playerId,
      message: `${player.name} busted!`,
    }],
  };
}

/**
 * Handle Second Chance usage
 */
function handleSecondChance(
  room: Room,
  playerId: string,
  newHand: Card[],
  remainingDeck: Card[]
): GameActionResult {
  const player = room.players[playerId];
  const { newCards, removedCards } = applySecondChance(newHand);

  const updatedPlayers = {
    ...room.players,
    [playerId]: {
      ...player,
      hand: newCards,
    },
  };

  const nextTurn = getNextActivePlayer(updatedPlayers, playerId);

  return {
    success: true,
    message: 'Used Second Chance to avoid bust',
    updatedRoom: {
      ...room,
      players: updatedPlayers,
      deck: remainingDeck,
      currentTurn: nextTurn,
    },
    effects: [{
      type: 'secondChance',
      targetPlayerId: playerId,
      cards: removedCards,
      message: `${player.name} used Second Chance`,
    }],
  };
}

/**
 * Handle Action card effects
 */
function handleActionCard(
  room: Room,
  playerId: string,
  card: Card,
  newHand: Card[],
  remainingDeck: Card[]
): GameActionResult {
  const player = room.players[playerId];

  switch (card.action) {
    case 'freeze':
      return handleFreezeAction(room, playerId, newHand, remainingDeck);
    
    case 'flipThree':
      return handleFlipThreeAction(room, playerId, newHand, remainingDeck);
    
    case 'secondChance': {
      // Second Chance is held for later use
      const updatedPlayers = {
        ...room.players,
        [playerId]: {
          ...player,
          hand: newHand,
        },
      };

      const nextTurn = getNextActivePlayer(updatedPlayers, playerId);

      return {
        success: true,
        message: 'Drew Second Chance card',
        updatedRoom: {
          ...room,
          players: updatedPlayers,
          deck: remainingDeck,
          currentTurn: nextTurn,
        },
      };
    }
    
    default:
      return {
        success: false,
        message: 'Unknown action card',
      };
  }
}

/**
 * Handle Freeze action card
 */
function handleFreezeAction(
  room: Room,
  playerId: string,
  newHand: Card[],
  remainingDeck: Card[]
): GameActionResult {
  const player = room.players[playerId];
  
  // Find target player (next player in turn order)
  const playerIds = Object.keys(room.players);
  const currentIndex = playerIds.indexOf(playerId);
  const targetIndex = (currentIndex + 1) % playerIds.length;
  const targetPlayerId = playerIds[targetIndex];
  const targetPlayer = room.players[targetPlayerId];

  if (!targetPlayer || targetPlayer.status !== 'active') {
    return {
      success: false,
      message: 'No valid target for Freeze',
    };
  }

  // Calculate target's current score
  const { score } = calculateHandScore(targetPlayer.hand);

  const updatedPlayers: Record<string, Player> = {
    ...room.players,
    [playerId]: {
      ...player,
      hand: newHand,
    },
    [targetPlayerId]: {
      ...targetPlayer,
      status: 'stayed' as PlayerStatus,
      score: targetPlayer.score + score,
    },
  };

  const nextTurn = getNextActivePlayer(updatedPlayers, playerId);

  // Check if round should end
  if (shouldEndRound(updatedPlayers)) {
    return endRound(room, updatedPlayers);
  }

  return {
    success: true,
    message: `Froze ${targetPlayer.name}`,
    updatedRoom: {
      ...room,
      players: updatedPlayers,
      deck: remainingDeck,
      currentTurn: nextTurn,
    },
    effects: [{
      type: 'freeze',
      targetPlayerId,
      sourcePlayerId: playerId,
      message: `${player.name} froze ${targetPlayer.name}`,
    }],
  };
}

/**
 * Handle Flip Three action card
 */
function handleFlipThreeAction(
  room: Room,
  playerId: string,
  newHand: Card[],
  remainingDeck: Card[]
): GameActionResult {
  const player = room.players[playerId];
  
  // Find target player (next player in turn order)
  const playerIds = Object.keys(room.players);
  const currentIndex = playerIds.indexOf(playerId);
  const targetIndex = (currentIndex + 1) % playerIds.length;
  const targetPlayerId = playerIds[targetIndex];
  const targetPlayer = room.players[targetPlayerId];

  if (!targetPlayer || targetPlayer.status !== 'active') {
    return {
      success: false,
      message: 'No valid target for Flip Three',
    };
  }

  // Draw 3 cards for target
  const cardsToDraw = Math.min(3, remainingDeck.length);
  const drawnCards: Card[] = [];
  let newDeck = [...remainingDeck];

  for (let i = 0; i < cardsToDraw; i++) {
    const { card, remainingDeck: deck } = dealOneCard(newDeck);
    drawnCards.push(card);
    newDeck = deck;
  }

  const targetNewHand = [...targetPlayer.hand, ...drawnCards];

  // Check for Flip 7
  if (hasFlip7(targetNewHand)) {
    return handleFlip7(room, targetPlayerId, targetNewHand);
  }

  // Check for bust
  if (hasBusted(targetNewHand)) {
    if (canUseSecondChance(targetNewHand)) {
      return handleSecondChance(room, targetPlayerId, targetNewHand, newDeck);
    } else {
      return handleBust(room, targetPlayerId, targetNewHand, newDeck);
    }
  }

  const updatedPlayers = {
    ...room.players,
    [playerId]: {
      ...player,
      hand: newHand,
    },
    [targetPlayerId]: {
      ...targetPlayer,
      hand: targetNewHand,
      hasFlip7: hasFlip7(targetNewHand),
    },
  };

  const nextTurn = getNextActivePlayer(updatedPlayers, playerId);

  return {
    success: true,
    message: `Made ${targetPlayer.name} flip three cards`,
    updatedRoom: {
      ...room,
      players: updatedPlayers,
      deck: newDeck,
      currentTurn: nextTurn,
    },
    effects: [{
      type: 'flipThree',
      targetPlayerId,
      sourcePlayerId: playerId,
      cards: drawnCards,
      message: `${player.name} made ${targetPlayer.name} flip three cards`,
    }],
  };
}

/**
 * Get the next active player in turn order
 */
function getNextActivePlayer(
  players: Record<string, Player>,
  currentPlayerId: string
): string | null {
  const playerIds = Object.keys(players);
  const currentIndex = playerIds.indexOf(currentPlayerId);
  
  // Check all players starting from the next one
  for (let i = 1; i <= playerIds.length; i++) {
    const nextIndex = (currentIndex + i) % playerIds.length;
    const nextPlayerId = playerIds[nextIndex];
    const nextPlayer = players[nextPlayerId];
    
    if (nextPlayer.status === 'active') {
      return nextPlayerId;
    }
  }
  
  return null; // No active players left
}

/**
 * Check if the round should end
 */
function shouldEndRound(players: Record<string, Player>): boolean {
  const activePlayers = Object.values(players).filter(p => p.status === 'active');
  return activePlayers.length === 0;
}

/**
 * End the current round
 */
function endRound(
  room: Room,
  players: Record<string, Player>,
  winner?: string
): GameActionResult {
  // Calculate final scores for all players
  const finalPlayers: Record<string, Player> = {};
  
  for (const [playerId, player] of Object.entries(players)) {
    if (player.status === 'active') {
      // Active players get their current score
      const { score } = calculateHandScore(player.hand);
      finalPlayers[playerId] = {
        ...player,
        status: 'stayed',
        score: player.score + score,
      };
    } else {
      finalPlayers[playerId] = player;
    }
  }

  // Check if game should end (max rounds reached)
  const shouldEndGame = room.round >= MAX_ROUNDS;

  return {
    success: true,
    message: winner ? `${players[winner].name} won with Flip 7!` : 'Round ended',
    updatedRoom: {
      ...room,
      players: finalPlayers,
      state: shouldEndGame ? 'gameOver' : 'roundEnd',
      currentTurn: null,
    },
    effects: [{
      type: winner ? 'flip7' : 'stay',
      targetPlayerId: winner,
      message: winner ? 'Flip 7! Round won!' : 'Round ended',
    }],
  };
}

/**
 * Utility function to shuffle deck
 */
function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Utility function to deal one card
 */
function dealOneCard(deck: Card[]): { card: Card; remainingDeck: Card[] } {
  if (deck.length === 0) {
    throw new Error('Cannot deal from empty deck');
  }
  const card = deck[0];
  const remainingDeck = deck.slice(1);
  return { card, remainingDeck };
}

/**
 * Get display name for a card
 */
function getCardDisplayName(card: Card): string {
  switch (card.type) {
    case 'number':
      return card.value?.toString() || 'Unknown';
    case 'action':
      return card.action || 'Action';
    case 'modifier':
      return card.modifier || 'Modifier';
    default:
      return 'Unknown';
  }
}

/**
 * Validate game state
 */
export function validateGameState(room: Room): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check if all players have valid status
  for (const [playerId, player] of Object.entries(room.players)) {
    if (!player.name) {
      errors.push(`Player ${playerId} has no name`);
    }
    if (player.score < 0) {
      errors.push(`Player ${player.name} has negative score`);
    }
  }

  // Check if deck is valid
  if (room.deck.length < 0) {
    errors.push('Deck has negative cards');
  }

  // Check if round number is valid
  if (room.round < 0 || room.round > MAX_ROUNDS) {
    errors.push(`Invalid round number: ${room.round}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Get game statistics
 */
export function getGameStats(room: Room): {
  totalPlayers: number;
  activePlayers: number;
  stayedPlayers: number;
  bustedPlayers: number;
  cardsInDeck: number;
  cardsInDiscard: number;
  currentRound: number;
  maxRounds: number;
} {
  const players = Object.values(room.players);
  
  return {
    totalPlayers: players.length,
    activePlayers: players.filter(p => p.status === 'active').length,
    stayedPlayers: players.filter(p => p.status === 'stayed').length,
    bustedPlayers: players.filter(p => p.status === 'busted').length,
    cardsInDeck: room.deck.length,
    cardsInDiscard: room.discardPile.length,
    currentRound: room.round,
    maxRounds: MAX_ROUNDS,
  };
} 