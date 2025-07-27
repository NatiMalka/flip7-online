import { useState, useEffect, useCallback } from 'react';
import type { Room, Player } from '../types';
import {
  createRoom,
  joinRoom,
  getRoom,
  updatePlayer,
  removePlayer,
  hostRemovePlayer,
  updatePlayerConnection,
  markPlayerDisconnected,
  cleanupDisconnectedPlayers as cleanupDisconnectedPlayersService,
  startGame,
  subscribeToRoom,
  subscribeToRoomList,
} from '../services/firebaseData';

export interface UseFirebaseRoomReturn {
  // Room state
  room: Room | null;
  loading: boolean;
  error: string | null;
  
  // Room actions
  createNewRoom: (hostName: string, isSoloMode?: boolean) => Promise<Room>;
  joinExistingRoom: (roomCode: string, playerName: string) => Promise<Room>;
  leaveRoom: (roomCode: string, playerId: string) => Promise<void>;
  startGameInRoom: (roomCode: string) => Promise<void>;
  
  // Player actions
  updatePlayerInRoom: (roomCode: string, playerId: string, updates: Partial<Player>) => Promise<void>;
  removePlayerFromRoom: (roomCode: string, hostId: string, targetPlayerId: string) => Promise<void>;
  updatePlayerConnectionStatus: (roomCode: string, playerId: string, isConnected: boolean) => Promise<void>;
  markPlayerAsDisconnected: (roomCode: string, playerId: string) => Promise<void>;
  cleanupDisconnectedPlayers: (roomCode: string, timeoutMinutes?: number) => Promise<void>;
  
  // Utility
  clearError: () => void;
  refreshRoom: (roomCode: string) => Promise<void>;
}

export function useFirebaseRoom(roomCode?: string): UseFirebaseRoomReturn {
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Subscribe to room updates when roomCode is provided
  useEffect(() => {
    if (!roomCode) {
      setRoom(null);
      return;
    }

    setLoading(true);
    setError(null);

    const unsubscribe = subscribeToRoom(roomCode, (updatedRoom) => {
      setRoom(updatedRoom);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [roomCode]);

  const createNewRoom = useCallback(async (hostName: string, isSoloMode: boolean = false): Promise<Room> => {
    try {
      setLoading(true);
      setError(null);
      
      const newRoom = await createRoom(hostName, isSoloMode);
      setRoom(newRoom);
      
      return newRoom;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create room';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const joinExistingRoom = useCallback(async (roomCode: string, playerName: string): Promise<Room> => {
    try {
      setLoading(true);
      setError(null);
      
      const joinedRoom = await joinRoom(roomCode, playerName);
      setRoom(joinedRoom);
      
      return joinedRoom;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to join room';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const leaveRoom = useCallback(async (roomCode: string, playerId: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      await removePlayer(roomCode, playerId);
      setRoom(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to leave room';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const startGameInRoom = useCallback(async (roomCode: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      await startGame(roomCode);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start game';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updatePlayerInRoom = useCallback(async (
    roomCode: string,
    playerId: string,
    updates: Partial<Omit<Player, 'joinedAt'>>
  ): Promise<void> => {
    try {
      await updatePlayer(roomCode, playerId, updates);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update player';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const removePlayerFromRoom = useCallback(async (
    roomCode: string,
    hostId: string,
    targetPlayerId: string
  ): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      await hostRemovePlayer(roomCode, hostId, targetPlayerId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove player';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updatePlayerConnectionStatus = useCallback(async (
    roomCode: string,
    playerId: string,
    isConnected: boolean
  ): Promise<void> => {
    try {
      await updatePlayerConnection(roomCode, playerId, isConnected);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update connection status';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const markPlayerAsDisconnected = useCallback(async (
    roomCode: string,
    playerId: string
  ): Promise<void> => {
    try {
      await markPlayerDisconnected(roomCode, playerId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to mark player as disconnected';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const cleanupDisconnectedPlayers = useCallback(async (
    roomCode: string,
    timeoutMinutes: number = 5
  ): Promise<void> => {
    try {
      await cleanupDisconnectedPlayersService(roomCode, timeoutMinutes);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to cleanup disconnected players';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const refreshRoom = useCallback(async (roomCode: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      const refreshedRoom = await getRoom(roomCode);
      setRoom(refreshedRoom);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh room';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    room,
    loading,
    error,
    createNewRoom,
    joinExistingRoom,
    leaveRoom,
    startGameInRoom,
    updatePlayerInRoom,
    removePlayerFromRoom,
    updatePlayerConnectionStatus,
    markPlayerAsDisconnected,
    cleanupDisconnectedPlayers,
    clearError,
    refreshRoom,
  };
}

// Hook for room list (for admin purposes)
export function useRoomList() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const unsubscribe = subscribeToRoomList((updatedRooms) => {
      setRooms(updatedRooms);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return {
    rooms,
    loading,
    error,
  };
} 