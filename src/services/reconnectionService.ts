import { getRoom } from './firebaseData';
import type { Room } from '../types';

// Reconnection configuration
interface ReconnectionConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

const DEFAULT_CONFIG: ReconnectionConfig = {
  maxAttempts: 5,
  baseDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
  backoffMultiplier: 2,
};

// Reconnection state
interface ReconnectionState {
  isReconnecting: boolean;
  attemptCount: number;
  lastAttemptTime: number | null;
  nextAttemptDelay: number;
}

// Reconnection service
export class ReconnectionService {
  private static instance: ReconnectionService;
  private config: ReconnectionConfig;
  private state: ReconnectionState;
  private reconnectCallbacks: Array<(room: Room) => void> = [];
  private errorCallbacks: Array<(error: Error) => void> = [];

  private constructor(config: Partial<ReconnectionConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.state = {
      isReconnecting: false,
      attemptCount: 0,
      lastAttemptTime: null,
      nextAttemptDelay: this.config.baseDelay,
    };
  }

  static getInstance(config?: Partial<ReconnectionConfig>): ReconnectionService {
    if (!ReconnectionService.instance) {
      ReconnectionService.instance = new ReconnectionService(config);
    }
    return ReconnectionService.instance;
  }

  // Start reconnection attempts
  async startReconnection(roomCode: string): Promise<void> {
    if (this.state.isReconnecting) {
      return;
    }

    this.state.isReconnecting = true;
    this.state.attemptCount = 0;
    this.state.nextAttemptDelay = this.config.baseDelay;

    await this.attemptReconnection(roomCode);
  }

  // Stop reconnection attempts
  stopReconnection(): void {
    this.state.isReconnecting = false;
    this.state.attemptCount = 0;
    this.state.lastAttemptTime = null;
  }

  // Attempt to reconnect
  private async attemptReconnection(roomCode: string): Promise<void> {
    if (!this.state.isReconnecting) {
      return;
    }

    if (this.state.attemptCount >= this.config.maxAttempts) {
      this.handleMaxAttemptsReached();
      return;
    }

    this.state.attemptCount++;
    this.state.lastAttemptTime = Date.now();

    try {
      console.log(`Reconnection attempt ${this.state.attemptCount}/${this.config.maxAttempts}`);
      
      const room = await getRoom(roomCode);
      
      if (room) {
        this.handleSuccessfulReconnection(room);
      } else {
        throw new Error('Room not found');
      }
    } catch (error) {
      console.error(`Reconnection attempt ${this.state.attemptCount} failed:`, error);
      this.handleFailedAttempt(error as Error, roomCode);
    }
  }

  // Handle successful reconnection
  private handleSuccessfulReconnection(room: Room): void {
    this.state.isReconnecting = false;
    this.state.attemptCount = 0;
    this.state.lastAttemptTime = null;
    this.state.nextAttemptDelay = this.config.baseDelay;

    console.log('Reconnection successful');
    
    // Notify all callbacks
    this.reconnectCallbacks.forEach(callback => {
      try {
        callback(room);
      } catch (error) {
        console.error('Error in reconnection callback:', error);
      }
    });
  }

  // Handle failed reconnection attempt
  private handleFailedAttempt(_error: Error, roomCode: string): void {
    // Calculate next delay with exponential backoff
    this.state.nextAttemptDelay = Math.min(
      this.state.nextAttemptDelay * this.config.backoffMultiplier,
      this.config.maxDelay
    );

    // Schedule next attempt
    setTimeout(() => {
      if (this.state.isReconnecting) {
        this.attemptReconnection(roomCode);
      }
    }, this.state.nextAttemptDelay);
  }

  // Handle max attempts reached
  private handleMaxAttemptsReached(): void {
    this.state.isReconnecting = false;
    const error = new Error(`Failed to reconnect after ${this.config.maxAttempts} attempts`);
    
    console.error('Max reconnection attempts reached');
    
    // Notify error callbacks
    this.errorCallbacks.forEach(callback => {
      try {
        callback(error);
      } catch (callbackError) {
        console.error('Error in error callback:', callbackError);
      }
    });
  }

  // Register reconnection success callback
  onReconnect(callback: (room: Room) => void): () => void {
    this.reconnectCallbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.reconnectCallbacks.indexOf(callback);
      if (index > -1) {
        this.reconnectCallbacks.splice(index, 1);
      }
    };
  }

  // Register error callback
  onError(callback: (error: Error) => void): () => void {
    this.errorCallbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.errorCallbacks.indexOf(callback);
      if (index > -1) {
        this.errorCallbacks.splice(index, 1);
      }
    };
  }

  // Get current reconnection state
  getState(): ReconnectionState {
    return { ...this.state };
  }

  // Update configuration
  updateConfig(config: Partial<ReconnectionConfig>): void {
    this.config = { ...this.config, ...config };
  }

  // Reset service state
  reset(): void {
    this.stopReconnection();
    this.reconnectCallbacks = [];
    this.errorCallbacks = [];
  }
}

// Export singleton instance
export const reconnectionService = ReconnectionService.getInstance();

// Utility functions
export const reconnectionUtils = {
  // Check if we should attempt reconnection
  shouldAttemptReconnection(error: Error): boolean {
    const networkErrors = [
      'Network Error',
      'Failed to fetch',
      'Connection lost',
      'timeout',
      'offline',
    ];
    
    const errorMessage = error.message.toLowerCase();
    return networkErrors.some(networkError => 
      errorMessage.includes(networkError.toLowerCase())
    );
  },

  // Get user-friendly error message
  getErrorMessage(error: Error): string {
    if (error.message.includes('Network Error')) {
      return 'Network connection lost. Attempting to reconnect...';
    }
    if (error.message.includes('Failed to fetch')) {
      return 'Unable to connect to server. Please check your internet connection.';
    }
    if (error.message.includes('timeout')) {
      return 'Request timed out. Please try again.';
    }
    return error.message;
  },
}; 