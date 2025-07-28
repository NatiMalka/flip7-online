import type { Room, Player, Card, PlayerStatus, GameState } from '../types';
import { calculateHandScore, dealOneCard, createAndShuffleDeck } from './cardSystem';

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
  requiresTargetSelection?: boolean; // Added for Freeze
}

export interface GameEffect {
  type: 'freeze' | 'flipThree' | 'secondChance' | 'bust' | 'flip7' | 'stay' | 'gameOver';
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
  // Create a fresh shuffled deck for the new round
  const shuffledDeck = createAndShuffleDeck();
  
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
        roundScore: 0, // Reset round score for new round
        hasFlip7: false,
        // Clear freeze status if player was frozen and should be unfrozen this round
        isFrozen: player.frozenUntilRound && room.round + 1 < player.frozenUntilRound ? player.isFrozen : false,
        frozenUntilRound: player.frozenUntilRound && room.round + 1 < player.frozenUntilRound ? player.frozenUntilRound : undefined,
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
 * Check if a player has busted (drew a duplicate number card)
 */
export function hasBusted(cards: Card[]): boolean {
  const numberCards = cards.filter(card => card.type === 'number');
  const numbers = numberCards.map(card => card.value).filter((value): value is number => value !== undefined);
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

  // Remove only ONE duplicate card and the Second Chance card
  const newCards: Card[] = [];
  const removedCards: Card[] = [];
  let duplicateRemoved = false;
  let secondChanceRemoved = false;

  for (const card of cards) {
    // Remove Second Chance card
    if (card.type === 'action' && card.action === 'secondChance' && !secondChanceRemoved) {
      removedCards.push(card);
      secondChanceRemoved = true;
    }
    // Remove only ONE duplicate number card
    else if (card.type === 'number' && card.value === duplicateNumber && !duplicateRemoved) {
      removedCards.push(card);
      duplicateRemoved = true;
    }
    // Keep all other cards
    else {
      newCards.push(card);
    }
  }

  return { newCards, removedCards, duplicateNumber };
}

/**
 * Process a player's Hit action
 */
export function processHitAction(
  room: Room, 
  playerId: string
): GameActionResult {
  console.log('🔄 processHitAction called:', {
    playerId,
    currentTurn: room.currentTurn,
    isMyTurn: room.currentTurn === playerId,
    gameState: room.state,
    deckLength: room.deck.length
  });

  // Validate it's the player's turn
  if (room.currentTurn !== playerId) {
    console.error('❌ Not player\'s turn');
    return {
      success: false,
      message: "It's not your turn",
    };
  }

  // Validate game state
  if (room.state !== 'playing') {
    console.error('❌ Game not in playing state');
    return {
      success: false,
      message: "Game is not in progress",
    };
  }

  const player = room.players[playerId];
  if (!player) {
    console.error('❌ Player not found');
    return {
      success: false,
      message: "Player not found",
    };
  }

  // Validate player status
  if (player.status !== 'active') {
    console.error('❌ Player not active:', player.status);
    return {
      success: false,
      message: "You cannot hit - you are not active",
    };
  }

  // Check if player is frozen
  if (player.isFrozen && player.frozenUntilRound && room.round < player.frozenUntilRound) {
    console.log('❄️ Player is frozen, skipping turn');
    // Keep frozen status and move to next player (don't clear until round ends)
    const updatedPlayers = { ...room.players };

    const nextPlayerId = getNextActivePlayer(updatedPlayers, playerId, room.round);
    console.log('🔄 Next player after frozen skip:', nextPlayerId);

    return {
      success: true,
      message: `${player.name} is frozen and skipped their turn`,
      updatedRoom: {
        ...room,
        players: updatedPlayers,
        currentTurn: nextPlayerId,
      },
      effects: [{
        type: 'freeze',
        targetPlayerId: playerId,
        message: 'Player is frozen and skipped turn',
      }],
    };
  }

  // Deal a card
  const { card: newCard, remainingDeck } = dealOneCard(room.deck);
  console.log('🎴 Dealt card:', newCard);

  if (!newCard) {
    console.error('❌ No cards left in deck');
    return {
      success: false,
      message: "No cards left in deck",
    };
  }

  // Add card to player's hand
  const newHand = [...player.hand, newCard];
  console.log('🖐️ New hand:', newHand.map(card => card.id));

  // Check for Flip 7
  if (hasFlip7(newHand)) {
    console.log('🎉 Flip 7 detected!');
    return handleFlip7(room, playerId, newHand);
  }

  // Check for bust
  if (hasBusted(newHand)) {
    console.log('💥 Bust detected!');
    return handleBust(room, playerId, newHand, remainingDeck);
  }

  // Check for action card
  if (newCard.type === 'action') {
    console.log('⚡ Action card detected:', newCard.id);
    return handleActionCard(room, playerId, newCard, newHand, remainingDeck);
  }

  // Regular number card - update hand and move to next player
  const updatedPlayers = { ...room.players };
  updatedPlayers[playerId] = {
    ...player,
    hand: newHand,
  };

  const nextPlayerId = getNextActivePlayer(updatedPlayers, playerId, room.round);
  console.log('🔄 Next player after regular hit:', nextPlayerId);

  return {
    success: true,
    message: `${player.name} drew ${newCard.id}`,
    updatedRoom: {
      ...room,
      players: updatedPlayers,
      deck: remainingDeck,
      currentTurn: nextPlayerId,
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

  // Calculate current round score
  const { score } = calculateHandScore(player.hand);
  
  // Update player status to stayed and track round score
  const updatedPlayers: Record<string, Player> = {
    ...room.players,
    [playerId]: {
      ...player,
      status: 'stayed' as PlayerStatus,
      roundScore: score, // Track round score separately
      // Don't add to total score yet - that happens at round end
    },
  };

  const nextTurn = getNextActivePlayer(updatedPlayers, playerId, room.round);

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
  const flip7Bonus = 15; // Flip 7 bonus
  const roundScore = score + flip7Bonus;

  const updatedPlayers: Record<string, Player> = {
    ...room.players,
    [playerId]: {
      ...player,
      hand: newHand,
      status: 'stayed' as PlayerStatus,
      roundScore: roundScore, // Track round score with Flip 7 bonus
      totalScore: player.totalScore + roundScore, // Add to total score immediately for Flip 7
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

  // Check if player has Second Chance card to avoid bust
  if (canUseSecondChance(newHand)) {
    console.log('🎴 Player has Second Chance, auto-using to avoid bust');
    return handleSecondChance(room, playerId, newHand, remainingDeck);
  }

  const updatedPlayers: Record<string, Player> = {
    ...room.players,
    [playerId]: {
      ...player,
      hand: newHand,
      status: 'busted' as PlayerStatus,
      roundScore: 0, // No points for busted round
    },
  };

  const nextTurn = getNextActivePlayer(updatedPlayers, playerId, room.round);

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

  const nextTurn = getNextActivePlayer(updatedPlayers, playerId, room.round);

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
      // Freeze card requires player selection - return special result
      return {
        success: true,
        message: 'Choose a player to freeze',
        updatedRoom: {
          ...room,
          players: {
            ...room.players,
            [playerId]: {
              ...player,
              hand: newHand,
            },
          },
          deck: remainingDeck,
          currentTurn: playerId, // Keep turn with current player for selection
        },
        effects: [{
          type: 'freeze',
          sourcePlayerId: playerId,
          message: `${player.name} drew Freeze card - choose target`,
        }],
        requiresTargetSelection: true,
      };
    
    case 'flipThree':
      // Flip Three card requires player selection - return special result
      return {
        success: true,
        message: 'Choose a player to flip three cards',
        updatedRoom: {
          ...room,
          players: {
            ...room.players,
            [playerId]: {
              ...player,
              hand: newHand,
            },
          },
          deck: remainingDeck,
          currentTurn: playerId, // Keep turn with current player for selection
        },
        effects: [{
          type: 'flipThree',
          sourcePlayerId: playerId,
          message: `${player.name} drew Flip Three card - choose target`,
        }],
        requiresTargetSelection: true,
      };
    
    case 'secondChance': {
      // Second Chance is held for later use
      const updatedPlayers = {
        ...room.players,
        [playerId]: {
          ...player,
          hand: newHand,
        },
      };

      const nextTurn = getNextActivePlayer(updatedPlayers, playerId, room.round);

      return {
        success: true,
        message: 'Drew Second Chance card',
        updatedRoom: {
          ...room,
          players: updatedPlayers,
          deck: remainingDeck,
          currentTurn: nextTurn,
        },
        effects: [{
          type: 'secondChance',
          targetPlayerId: playerId,
          message: `${player.name} drew Second Chance card`,
        }],
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
 * Handle Freeze action card with target selection
 */
export function handleFreezeAction(
  room: Room,
  playerId: string,
  targetPlayerId: string,
  newHand: Card[],
  remainingDeck: Card[]
): GameActionResult {
  const player = room.players[playerId];
  const targetPlayer = room.players[targetPlayerId];

  if (!targetPlayer || targetPlayer.status !== 'active') {
    return {
      success: false,
      message: 'Invalid target for Freeze',
    };
  }

  if (targetPlayerId === playerId) {
    return {
      success: false,
      message: 'Cannot freeze yourself',
    };
  }

  // Mark target as frozen for the remainder of this round
  const updatedPlayers: Record<string, Player> = {
    ...room.players,
    [playerId]: {
      ...player,
      hand: newHand,
    },
    [targetPlayerId]: {
      ...targetPlayer,
      isFrozen: true, // Frozen for remainder of round
      frozenUntilRound: room.round + 1, // Will be unfrozen when next round starts
    },
  };

  const nextTurn = getNextActivePlayer(updatedPlayers, playerId, room.round);

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
 * Handle Flip Three action card - draw 3 cards for target player
 */
export function handleFlipThreeAction(
  room: Room,
  playerId: string,
  targetPlayerId: string,
  newHand: Card[],
  remainingDeck: Card[]
): GameActionResult {
  const player = room.players[playerId];
  const targetPlayer = room.players[targetPlayerId];
  
  if (!targetPlayer || targetPlayer.status !== 'active') {
    return {
      success: false,
      message: 'Invalid target for Flip Three',
    };
  }

  if (targetPlayerId === playerId) {
    return {
      success: false,
      message: 'Cannot target yourself with Flip Three',
    };
  }

  // Draw 3 cards for the target player
  const cardsToDraw = Math.min(3, remainingDeck.length);
  const drawnCards: Card[] = [];
  let newDeck = [...remainingDeck];

  for (let i = 0; i < cardsToDraw; i++) {
    const { card, remainingDeck: deck } = dealOneCard(newDeck);
    // Make the card visible when dealt
    const visibleCard = { ...card, isVisible: true };
    drawnCards.push(visibleCard);
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

  const nextTurn = getNextActivePlayer(updatedPlayers, playerId, room.round);

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
export function getNextActivePlayer(
  players: Record<string, Player>,
  currentPlayerId: string,
  currentRound?: number
): string | null {
  const playerIds = Object.keys(players);
  const currentIndex = playerIds.indexOf(currentPlayerId);
  
  // Check all players starting from the next one
  for (let i = 1; i <= playerIds.length; i++) {
    const nextIndex = (currentIndex + i) % playerIds.length;
    const nextPlayerId = playerIds[nextIndex];
    const nextPlayer = players[nextPlayerId];
    
    if (nextPlayer.status === 'active') {
      // Check if player is frozen using round-based logic
      if (nextPlayer.isFrozen && currentRound && nextPlayer.frozenUntilRound && currentRound < nextPlayer.frozenUntilRound) {
        console.log(`❄️ ${nextPlayer.name} is frozen until round ${nextPlayer.frozenUntilRound}, skipping turn`);
        continue; // Skip this player and check next
      }
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
      // Active players get their current score calculated
      const { score } = calculateHandScore(player.hand);
      finalPlayers[playerId] = {
        ...player,
        status: 'stayed',
        roundScore: score, // Set round score
        totalScore: player.totalScore + score, // Add to total score
      };
    } else if (player.status === 'stayed') {
      // Players who stayed get their round score added to total
      finalPlayers[playerId] = {
        ...player,
        totalScore: player.totalScore + player.roundScore, // Add round score to total
      };
    } else {
      // Busted players get no points for this round
      finalPlayers[playerId] = {
        ...player,
        roundScore: 0, // No round score for busted players
      };
    }
  }

  // Check for game over conditions (200+ points or max rounds reached)
  const allPlayersSorted = Object.entries(finalPlayers)
    .sort(([_, a], [__, b]) => {
      // Primary sort: highest total score
      if (b.totalScore !== a.totalScore) {
        return b.totalScore - a.totalScore;
      }
      // Tie-breaker 1: highest round score (recent performance)
      if (b.roundScore !== a.roundScore) {
        return b.roundScore - a.roundScore;
      }
      // Tie-breaker 2: fewest cards in hand (better hand management)
      return a.hand.length - b.hand.length;
    });

  const playersWith200Plus = allPlayersSorted.filter(([_, player]) => player.totalScore >= 200);
  let gameWinner: string | undefined;
  let gameState: 'roundEnd' | 'gameOver' = 'roundEnd';

  // Game ends if someone reaches 200+ points OR max rounds reached
  if (playersWith200Plus.length > 0 || room.round >= MAX_ROUNDS) {
    gameState = 'gameOver';
    // Winner is the player with highest score (using tie-breakers)
    gameWinner = allPlayersSorted[0][0];
    
    console.log(`🏆 Game Over! Winner: ${finalPlayers[gameWinner].name} with ${finalPlayers[gameWinner].totalScore} points`);
  }

  // Check if game should end (max rounds reached)
  const shouldEndGame = room.round >= MAX_ROUNDS || gameState === 'gameOver';

  return {
    success: true,
    message: winner ? `${players[winner].name} won with Flip 7!` : 
             gameWinner ? `${finalPlayers[gameWinner].name} wins with ${finalPlayers[gameWinner].totalScore} points!` :
             'Round ended',
    updatedRoom: {
      ...room,
      players: finalPlayers,
      state: shouldEndGame ? 'gameOver' : 'roundEnd',
      currentTurn: null,
      winner: gameWinner || winner, // Store the game winner
    },
    effects: [{
      type: winner ? 'flip7' : gameWinner ? 'gameOver' : 'stay',
      targetPlayerId: gameWinner || winner,
      message: winner ? 'Flip 7! Round won!' : 
               gameWinner ? 'Game Over! Winner declared!' : 
               'Round ended',
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