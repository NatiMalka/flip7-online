import type { Player, PlayerStatus, Room, Card } from '../types';
import { calculateHandScore } from './cardSystem';

// Turn System Types
export interface TurnState {
  currentTurn: string | null;
  turnOrder: string[];
  activePlayers: string[];
  frozenPlayers: Set<string>;
  flippingThreePlayers: Set<string>;
  roundPhase: 'dealing' | 'playing' | 'ending';
  turnTimeout: number; // milliseconds
  lastActionTime: number;
}

export interface TurnAction {
  type: 'hit' | 'stay' | 'freeze' | 'flipThree' | 'secondChance';
  playerId: string;
  targetPlayerId?: string;
  card?: Card;
  timestamp: number;
}

export interface TurnResult {
  success: boolean;
  message: string;
  nextTurn: string | null;
  updatedPlayers: Record<string, Player>;
  effects: GameEffect[];
  roundEnded: boolean;
  gameEnded: boolean;
}

export interface GameEffect {
  type: 'freeze' | 'flipThree' | 'secondChance' | 'bust' | 'flip7' | 'stay' | 'timeout';
  targetPlayerId?: string;
  sourcePlayerId?: string;
  cards?: Card[];
  message: string;
  duration?: number; // for temporary effects
}

// Turn System Constants
export const TURN_TIMEOUT = 30000; // 30 seconds
export const DEALING_PHASE_DURATION = 5000; // 5 seconds
export const MIN_PLAYERS_TO_START = 2;
export const MAX_PLAYERS = 8;

/**
 * Initialize turn system for a new round
 */
export function initializeTurnSystem(room: Room): TurnState {
  const playerIds = Object.keys(room.players);
  const activePlayers = playerIds.filter(id => room.players[id].status === 'active');
  
  return {
    currentTurn: activePlayers.length > 0 ? activePlayers[0] : null,
    turnOrder: [...playerIds],
    activePlayers: [...activePlayers],
    frozenPlayers: new Set(),
    flippingThreePlayers: new Set(),
    roundPhase: 'dealing',
    turnTimeout: TURN_TIMEOUT,
    lastActionTime: Date.now(),
  };
}

/**
 * Get next player in turn order
 */
export function getNextTurn(
  currentPlayerId: string,
  players: Record<string, Player>,
  turnOrder: string[]
): string | null {
  const currentIndex = turnOrder.indexOf(currentPlayerId);
  if (currentIndex === -1) return null;

  // Check all players starting from the next one
  for (let i = 1; i <= turnOrder.length; i++) {
    const nextIndex = (currentIndex + i) % turnOrder.length;
    const nextPlayerId = turnOrder[nextIndex];
    const nextPlayer = players[nextPlayerId];
    
    if (nextPlayer && nextPlayer.status === 'active') {
      return nextPlayerId;
    }
  }
  
  return null; // No active players left
}

/**
 * Check if turn should timeout
 */
export function shouldTimeoutTurn(turnState: TurnState): boolean {
  if (!turnState.currentTurn) return false;
  
  const timeSinceLastAction = Date.now() - turnState.lastActionTime;
  return timeSinceLastAction > turnState.turnTimeout;
}

/**
 * Handle turn timeout
 */
export function handleTurnTimeout(
  room: Room,
  turnState: TurnState
): TurnResult {
  const currentPlayer = room.players[turnState.currentTurn!];
  
  // Auto-stay for the current player
  const { score } = calculateHandScore(currentPlayer.hand);
  
  const updatedPlayers: Record<string, Player> = {
    ...room.players,
    [turnState.currentTurn!]: {
      ...currentPlayer,
      status: 'stayed' as PlayerStatus,
      score: currentPlayer.score + score,
    },
  };

  const nextTurn = getNextTurn(turnState.currentTurn!, updatedPlayers, turnState.turnOrder);
  
  // Check if round should end
  const roundEnded = shouldEndRound(updatedPlayers);
  
  return {
    success: true,
    message: `${currentPlayer.name} timed out and stayed with ${score} points`,
    nextTurn,
    updatedPlayers,
    effects: [{
      type: 'timeout',
      targetPlayerId: turnState.currentTurn!,
      message: `${currentPlayer.name} timed out`,
    }],
    roundEnded,
    gameEnded: false,
  };
}

/**
 * Process a hit action
 */
export function processHitTurn(
  room: Room,
  playerId: string,
  turnState: TurnState,
  drawnCard: Card
): TurnResult {
  const player = room.players[playerId];
  const newHand = [...player.hand, drawnCard];
  
  // Check for Flip 7
  if (hasFlip7(newHand)) {
    return handleFlip7Turn(room, playerId, newHand, turnState);
  }

  // Check for bust
  if (hasBusted(newHand)) {
    if (canUseSecondChance(newHand)) {
      return handleSecondChanceTurn(room, playerId, newHand, turnState);
    } else {
      return handleBustTurn(room, playerId, newHand, turnState);
    }
  }

  // Check for Action cards that need immediate resolution
  if (drawnCard.type === 'action') {
    return handleActionCardTurn(room, playerId, drawnCard, newHand, turnState);
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

  const nextTurn = getNextTurn(playerId, updatedPlayers, turnState.turnOrder);

  return {
    success: true,
    message: `Drew ${getCardDisplayName(drawnCard)}`,
    nextTurn,
    updatedPlayers,
    effects: [],
    roundEnded: false,
    gameEnded: false,
  };
}

/**
 * Process a stay action
 */
export function processStayTurn(
  room: Room,
  playerId: string,
  turnState: TurnState
): TurnResult {
  const player = room.players[playerId];
  const { score } = calculateHandScore(player.hand);
  
  const updatedPlayers: Record<string, Player> = {
    ...room.players,
    [playerId]: {
      ...player,
      status: 'stayed' as PlayerStatus,
      score: player.score + score,
    },
  };

  const nextTurn = getNextTurn(playerId, updatedPlayers, turnState.turnOrder);
  const roundEnded = shouldEndRound(updatedPlayers);

  return {
    success: true,
    message: `Stayed with ${score} points`,
    nextTurn,
    updatedPlayers,
    effects: [{
      type: 'stay',
      targetPlayerId: playerId,
      message: `${player.name} stayed with ${score} points`,
    }],
    roundEnded,
    gameEnded: false,
  };
}

/**
 * Handle Flip 7 auto-win
 */
function handleFlip7Turn(
  room: Room,
  playerId: string,
  newHand: Card[],
  turnState: TurnState
): TurnResult {
  const player = room.players[playerId];
  const { score } = calculateHandScore(newHand);
  const totalScore = score + 15; // Flip 7 bonus

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

  return {
    success: true,
    message: `Flip 7! ${player.name} wins the round!`,
    nextTurn: null,
    updatedPlayers,
    effects: [{
      type: 'flip7',
      targetPlayerId: playerId,
      message: `${player.name} got Flip 7!`,
    }],
    roundEnded: true,
    gameEnded: false,
  };
}

/**
 * Handle bust
 */
function handleBustTurn(
  room: Room,
  playerId: string,
  newHand: Card[],
  turnState: TurnState
): TurnResult {
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

  const nextTurn = getNextTurn(playerId, updatedPlayers, turnState.turnOrder);
  const roundEnded = shouldEndRound(updatedPlayers);

  return {
    success: true,
    message: 'Busted!',
    nextTurn,
    updatedPlayers,
    effects: [{
      type: 'bust',
      targetPlayerId: playerId,
      message: `${player.name} busted!`,
    }],
    roundEnded,
    gameEnded: false,
  };
}

/**
 * Handle Second Chance usage
 */
function handleSecondChanceTurn(
  room: Room,
  playerId: string,
  newHand: Card[],
  turnState: TurnState
): TurnResult {
  const player = room.players[playerId];
  const { newCards, removedCards } = applySecondChance(newHand);

  const updatedPlayers = {
    ...room.players,
    [playerId]: {
      ...player,
      hand: newCards,
    },
  };

  const nextTurn = getNextTurn(playerId, updatedPlayers, turnState.turnOrder);

  return {
    success: true,
    message: 'Used Second Chance to avoid bust',
    nextTurn,
    updatedPlayers,
    effects: [{
      type: 'secondChance',
      targetPlayerId: playerId,
      cards: removedCards,
      message: `${player.name} used Second Chance`,
    }],
    roundEnded: false,
    gameEnded: false,
  };
}

/**
 * Handle Action card effects
 */
function handleActionCardTurn(
  room: Room,
  playerId: string,
  card: Card,
  newHand: Card[],
  turnState: TurnState
): TurnResult {
  const player = room.players[playerId];

  switch (card.action) {
    case 'freeze':
      return handleFreezeTurn(room, playerId, newHand, turnState);
    
    case 'flipThree':
      return handleFlipThreeTurn(room, playerId, newHand, turnState);
    
    case 'secondChance': {
      // Second Chance is held for later use
      const updatedPlayers = {
        ...room.players,
        [playerId]: {
          ...player,
          hand: newHand,
        },
      };

      const nextTurn = getNextTurn(playerId, updatedPlayers, turnState.turnOrder);

      return {
        success: true,
        message: 'Drew Second Chance card',
        nextTurn,
        updatedPlayers,
        effects: [],
        roundEnded: false,
        gameEnded: false,
      };
    }
    
    default:
      return {
        success: false,
        message: 'Unknown action card',
        nextTurn: null,
        updatedPlayers: room.players,
        effects: [],
        roundEnded: false,
        gameEnded: false,
      };
  }
}

/**
 * Handle Freeze action card
 */
function handleFreezeTurn(
  room: Room,
  playerId: string,
  newHand: Card[],
  turnState: TurnState
): TurnResult {
  const player = room.players[playerId];
  
  // Find target player (next player in turn order)
  const currentIndex = turnState.turnOrder.indexOf(playerId);
  const targetIndex = (currentIndex + 1) % turnState.turnOrder.length;
  const targetPlayerId = turnState.turnOrder[targetIndex];
  const targetPlayer = room.players[targetPlayerId];

  if (!targetPlayer || targetPlayer.status !== 'active') {
    return {
      success: false,
      message: 'No valid target for Freeze',
      nextTurn: null,
      updatedPlayers: room.players,
      effects: [],
      roundEnded: false,
      gameEnded: false,
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

  const nextTurn = getNextTurn(playerId, updatedPlayers, turnState.turnOrder);
  const roundEnded = shouldEndRound(updatedPlayers);

  return {
    success: true,
    message: `Froze ${targetPlayer.name}`,
    nextTurn,
    updatedPlayers,
    effects: [{
      type: 'freeze',
      targetPlayerId,
      sourcePlayerId: playerId,
      message: `${player.name} froze ${targetPlayer.name}`,
    }],
    roundEnded,
    gameEnded: false,
  };
}

/**
 * Handle Flip Three action card
 */
function handleFlipThreeTurn(
  room: Room,
  playerId: string,
  newHand: Card[],
  turnState: TurnState
): TurnResult {
  const player = room.players[playerId];
  
  // Find target player (next player in turn order)
  const currentIndex = turnState.turnOrder.indexOf(playerId);
  const targetIndex = (currentIndex + 1) % turnState.turnOrder.length;
  const targetPlayerId = turnState.turnOrder[targetIndex];
  const targetPlayer = room.players[targetPlayerId];

  if (!targetPlayer || targetPlayer.status !== 'active') {
    return {
      success: false,
      message: 'No valid target for Flip Three',
      nextTurn: null,
      updatedPlayers: room.players,
      effects: [],
      roundEnded: false,
      gameEnded: false,
    };
  }

  // For now, we'll simulate drawing 3 cards
  // In a real implementation, you'd draw actual cards from the deck
  const drawnCards: Card[] = [
    { id: 'temp1', type: 'number', value: 3, isFlipped: false, isVisible: true },
    { id: 'temp2', type: 'number', value: 8, isFlipped: false, isVisible: true },
    { id: 'temp3', type: 'action', action: 'freeze', isFlipped: false, isVisible: true },
  ];

  const targetNewHand = [...targetPlayer.hand, ...drawnCards];

  // Check for Flip 7
  if (hasFlip7(targetNewHand)) {
    return handleFlip7Turn(room, targetPlayerId, targetNewHand, turnState);
  }

  // Check for bust
  if (hasBusted(targetNewHand)) {
    if (canUseSecondChance(targetNewHand)) {
      return handleSecondChanceTurn(room, targetPlayerId, targetNewHand, turnState);
    } else {
      return handleBustTurn(room, targetPlayerId, targetNewHand, turnState);
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

  const nextTurn = getNextTurn(playerId, updatedPlayers, turnState.turnOrder);

  return {
    success: true,
    message: `Made ${targetPlayer.name} flip three cards`,
    nextTurn,
    updatedPlayers,
    effects: [{
      type: 'flipThree',
      targetPlayerId,
      sourcePlayerId: playerId,
      cards: drawnCards,
      message: `${player.name} made ${targetPlayer.name} flip three cards`,
    }],
    roundEnded: false,
    gameEnded: false,
  };
}

/**
 * Check if a player has Flip 7 (7 unique number cards)
 */
function hasFlip7(cards: Card[]): boolean {
  const numberCards = cards.filter(card => card.type === 'number');
  const uniqueNumbers = new Set(numberCards.map(card => card.value));
  return uniqueNumbers.size === 7;
}

/**
 * Check if a player has busted (drew a duplicate number)
 */
function hasBusted(cards: Card[]): boolean {
  const numberCards = cards.filter(card => card.type === 'number');
  const numbers = numberCards.map(card => card.value);
  const uniqueNumbers = new Set(numbers);
  return numbers.length !== uniqueNumbers.size;
}

/**
 * Check if a player can use Second Chance to avoid bust
 */
function canUseSecondChance(cards: Card[]): boolean {
  return cards.some(card => card.type === 'action' && card.action === 'secondChance');
}

/**
 * Use Second Chance to avoid bust
 */
function applySecondChance(cards: Card[]): { 
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
 * Check if the round should end
 */
function shouldEndRound(players: Record<string, Player>): boolean {
  const activePlayers = Object.values(players).filter(p => p.status === 'active');
  return activePlayers.length === 0;
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
 * Validate turn action
 */
export function validateTurnAction(
  room: Room,
  playerId: string,
  action: TurnAction
): { isValid: boolean; message: string } {
  const player = room.players[playerId];
  
  if (!player) {
    return { isValid: false, message: 'Player not found' };
  }

  if (player.status !== 'active') {
    return { isValid: false, message: 'Player is not active' };
  }

  if (room.currentTurn !== playerId) {
    return { isValid: false, message: 'Not your turn' };
  }

  if (room.state !== 'playing') {
    return { isValid: false, message: 'Game is not in playing state' };
  }

  return { isValid: true, message: 'Valid action' };
}

/**
 * Get turn statistics
 */
export function getTurnStats(turnState: TurnState, room: Room): {
  currentTurn: string | null;
  activePlayers: number;
  totalPlayers: number;
  timeRemaining: number;
  turnOrder: string[];
} {
  const timeRemaining = Math.max(0, turnState.turnTimeout - (Date.now() - turnState.lastActionTime));
  
  return {
    currentTurn: turnState.currentTurn,
    activePlayers: turnState.activePlayers.length,
    totalPlayers: Object.keys(room.players).length,
    timeRemaining,
    turnOrder: turnState.turnOrder,
  };
} 