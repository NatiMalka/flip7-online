// Card Types
export type CardType = 'number' | 'action' | 'modifier';

export type ActionCardType = 'freeze' | 'flipThree' | 'secondChance';

export type ModifierCardType = 'plus4' | 'plus6' | 'plus8' | 'plus10' | 'x2';

export interface Card {
  id: string;
  type: CardType;
  value?: number; // For number cards (0-12)
  action?: ActionCardType; // For action cards
  modifier?: ModifierCardType; // For modifier cards
  isFlipped: boolean;
  isVisible: boolean;
}

// Player Types
export type PlayerStatus = 'active' | 'stayed' | 'busted' | 'disconnected';

export interface Player {
  id: string;
  name: string;
  hand: Card[];
  score: number;
  roundScore: number; // Current round score (before modifiers)
  totalScore: number; // Total accumulated score across all rounds
  status: PlayerStatus;
  history: RoundHistory[];
  joinedAt: Date;
  isHost: boolean;
  hasFlip7: boolean;
  isConnected: boolean;
  lastSeen: Date;
  isFrozen?: boolean; // Added for Freeze card functionality
  frozenUntilRound?: number; // Round when player will be unfrozen
}

// Game State Types
export type GameState = 'waiting' | 'playing' | 'roundEnd' | 'gameOver';

export interface RoundHistory {
  round: number;
  cards: Card[];
  score: number;
  status: PlayerStatus;
  flip7Bonus: boolean;
}

// Room Types
export interface Room {
  code: string;
  host: string;
  players: Record<string, Player>;
  deck: Card[];
  discardPile: Card[];
  currentTurn: string | null;
  state: GameState;
  round: number;
  maxRounds: number;
  createdAt: Date;
  winner?: string; // Store the game winner
}

// Game Actions
export type GameAction = 
  | 'hit'
  | 'stay'
  | 'startGame'
  | 'endRound'
  | 'restartGame'
  | 'leaveRoom';

// Firebase Types
export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
}

// UI Types
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  type?: 'button' | 'submit' | 'reset';
}

// Animation Types
export type AnimationType = 'flip' | 'shake' | 'bounce' | 'slide';

// Error Types
export interface GameError {
  code: string;
  message: string;
  details?: unknown;
}

// Solo Mode Types
export interface SoloGame {
  player: Player;
  aiPlayers: Player[];
  goal: number; // Target score (e.g., 200)
  currentRound: number;
  maxRounds: number;
}

// Utility Types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>; 