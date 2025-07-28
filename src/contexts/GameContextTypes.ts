import { createContext } from 'react';
import type { Room, Player } from '../types';

// Game State Types
export interface GameContextState {
  // Current room and player info
  room: Room | null;
  currentPlayerId: string | null;
  currentPlayer: Player | null;
  
  // Game state
  isLoading: boolean;
  error: string | null;
  isConnected: boolean;
  isReconnecting: boolean;
  
  // Game actions
  canHit: boolean;
  canStay: boolean;
  isMyTurn: boolean;
  
  // UI state
  showGameOver: boolean;
  showRoundEnd: boolean;
  lastAction: string | null;
  requiresTargetSelection?: boolean;
  pendingAction?: 'freeze' | 'flipThree' | 'secondChance' | 'gameOver' | 'stay' | 'bust' | 'flip7' | null;
}

// Game Actions
export type GameContextAction =
  | { type: 'SET_ROOM'; payload: Room | null }
  | { type: 'SET_CURRENT_PLAYER'; payload: { playerId: string; player: Player } | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_CONNECTION_STATUS'; payload: { isConnected: boolean; isReconnecting?: boolean } }
  | { type: 'SET_GAME_ACTIONS'; payload: { canHit: boolean; canStay: boolean; isMyTurn: boolean } }
  | { type: 'SET_UI_STATE'; payload: { showGameOver?: boolean; showRoundEnd?: boolean; lastAction?: string | null; requiresTargetSelection?: boolean; pendingAction?: 'freeze' | 'flipThree' | 'secondChance' | 'gameOver' | 'stay' | 'bust' | 'flip7' | null } }
  | { type: 'CLEAR_ERROR' }
  | { type: 'RESET_STATE' };

// Context interface
export interface GameContextType extends GameContextState {
  // Room management
  createRoom: (hostName: string, isSoloMode?: boolean) => Promise<void>;
  joinRoom: (roomCode: string, playerName: string) => Promise<void>;
  leaveRoom: () => Promise<void>;
  
  // Player management
  removePlayer: (targetPlayerId: string) => Promise<void>;
  
  // Game actions
  hit: () => Promise<void>;
  stay: () => Promise<void>;
  selectTarget: (targetPlayerId: string) => Promise<void>;
  selectFlipThreeTarget: (targetPlayerId: string) => Promise<void>;
  startGame: () => Promise<void>;
  startNextRound: () => Promise<void>;
  restartGame: () => Promise<void>;
  
  // Utility
  clearError: () => void;
  refreshConnection: () => Promise<void>;
}

// Create context
export const GameContext = createContext<GameContextType | undefined>(undefined); 