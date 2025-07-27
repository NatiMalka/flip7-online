import type { Room, Player } from '../types';
import type { GameActionResult } from '../utils/gameRules';
import { updateRoom, updatePlayer } from './firebaseData';

// Game state synchronization service
export class GameStateSync {
  private static instance: GameStateSync;
  private syncQueue: Array<() => Promise<void>> = [];
  private isProcessing = false;

  private constructor() {}

  static getInstance(): GameStateSync {
    if (!GameStateSync.instance) {
      GameStateSync.instance = new GameStateSync();
    }
    return GameStateSync.instance;
  }

  // Sync game action result to Firebase
  async syncGameAction(roomCode: string, result: GameActionResult): Promise<void> {
    if (!result.success || !result.updatedRoom) {
      return;
    }

    try {
      // Update room state in Firebase (excluding players and createdAt to avoid type conflicts)
      const { players, createdAt, ...roomUpdates } = result.updatedRoom;
      await updateRoom(roomCode, roomUpdates);
    } catch (error) {
      console.error('Failed to sync game action:', error);
      throw error;
    }
  }

  // Sync player update to Firebase
  async syncPlayerUpdate(
    roomCode: string,
    playerId: string,
    updates: Partial<Omit<Player, 'joinedAt'>>
  ): Promise<void> {
    try {
      await updatePlayer(roomCode, playerId, updates);
    } catch (error) {
      console.error('Failed to sync player update:', error);
      throw error;
    }
  }

  // Queue a sync operation for processing
  queueSync(operation: () => Promise<void>): void {
    this.syncQueue.push(operation);
    this.processQueue();
  }

  // Process the sync queue
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.syncQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      while (this.syncQueue.length > 0) {
        const operation = this.syncQueue.shift();
        if (operation) {
          await operation();
        }
      }
    } catch (error) {
      console.error('Error processing sync queue:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  // Clear the sync queue
  clearQueue(): void {
    this.syncQueue = [];
  }

  // Get queue status
  getQueueStatus(): { length: number; isProcessing: boolean } {
    return {
      length: this.syncQueue.length,
      isProcessing: this.isProcessing,
    };
  }
}

// Export singleton instance
export const gameStateSync = GameStateSync.getInstance();

// Utility functions for common sync operations
export const syncUtils = {
  // Sync room state changes
  async syncRoomState(roomCode: string, room: Room): Promise<void> {
    await gameStateSync.syncGameAction(roomCode, {
      success: true,
      message: 'Room state updated',
      updatedRoom: room,
    });
  },

  // Sync player hand changes
  async syncPlayerHand(
    roomCode: string,
    playerId: string,
    hand: Player['hand']
  ): Promise<void> {
    await gameStateSync.syncPlayerUpdate(roomCode, playerId, { hand });
  },

  // Sync player status changes
  async syncPlayerStatus(
    roomCode: string,
    playerId: string,
    status: Player['status']
  ): Promise<void> {
    await gameStateSync.syncPlayerUpdate(roomCode, playerId, { status });
  },

  // Sync player score changes
  async syncPlayerScore(
    roomCode: string,
    playerId: string,
    score: Player['score']
  ): Promise<void> {
    await gameStateSync.syncPlayerUpdate(roomCode, playerId, { score });
  },
}; 