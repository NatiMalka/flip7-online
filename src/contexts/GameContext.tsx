import React, { useReducer, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { useFirebaseRoom } from '../hooks/useFirebaseRoom';
import { processHitAction, processStayAction } from '../utils/gameRules';
import { GameContext } from './GameContextTypes';
import type { GameContextState, GameContextAction, GameContextType } from './GameContextTypes';

// Initial state
const initialState: GameContextState = {
  room: null,
  currentPlayerId: null,
  currentPlayer: null,
  isLoading: false,
  error: null,
  isConnected: false,
  isReconnecting: false,
  canHit: false,
  canStay: false,
  isMyTurn: false,
  showGameOver: false,
  showRoundEnd: false,
  lastAction: null,
};

// Reducer function
function gameReducer(state: GameContextState, action: GameContextAction): GameContextState {
  switch (action.type) {
    case 'SET_ROOM':
      return {
        ...state,
        room: action.payload,
      };
    
    case 'SET_CURRENT_PLAYER':
      return {
        ...state,
        currentPlayerId: action.payload?.playerId || null,
        currentPlayer: action.payload?.player || null,
      };
    
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
      };
    
    case 'SET_CONNECTION_STATUS':
      return {
        ...state,
        isConnected: action.payload.isConnected,
        isReconnecting: action.payload.isReconnecting || false,
      };
    
    case 'SET_GAME_ACTIONS':
      return {
        ...state,
        ...action.payload,
      };
    
    case 'SET_UI_STATE':
      return {
        ...state,
        ...action.payload,
      };
    
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    
    case 'RESET_STATE':
      return initialState;
    
    default:
      return state;
  }
}

// Provider component
interface GameProviderProps {
  children: ReactNode;
}

export function GameProvider({ children }: GameProviderProps) {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const [roomCode, setRoomCode] = React.useState<string | null>(null);
  
  // Firebase room hook
  const {
    room: firebaseRoom,
    loading: firebaseLoading,
    error: firebaseError,
    createNewRoom,
    joinExistingRoom,
    leaveRoom: firebaseLeaveRoom,
    removePlayerFromRoom,
    updatePlayerConnectionStatus,
    markPlayerAsDisconnected,
    cleanupDisconnectedPlayers,
    startGameInRoom,
    clearError: clearFirebaseError,
    refreshRoom,
  } = useFirebaseRoom(roomCode || undefined);

  // Update state when Firebase room changes
  useEffect(() => {
    dispatch({ type: 'SET_ROOM', payload: firebaseRoom });
    dispatch({ type: 'SET_LOADING', payload: firebaseLoading });
    dispatch({ type: 'SET_ERROR', payload: firebaseError });
  }, [firebaseRoom, firebaseLoading, firebaseError]);

  // Update current player when room changes
  useEffect(() => {
    if (firebaseRoom && state.currentPlayerId) {
      const player = firebaseRoom.players[state.currentPlayerId];
      if (player) {
        dispatch({
          type: 'SET_CURRENT_PLAYER',
          payload: { playerId: state.currentPlayerId, player },
        });
      }
    }
  }, [firebaseRoom, state.currentPlayerId]);

  // Update game actions when room or current player changes
  useEffect(() => {
    if (!firebaseRoom || !state.currentPlayerId) {
      dispatch({
        type: 'SET_GAME_ACTIONS',
        payload: { canHit: false, canStay: false, isMyTurn: false },
      });
      return;
    }

    const currentPlayer = firebaseRoom.players[state.currentPlayerId];
    if (!currentPlayer) {
      dispatch({
        type: 'SET_GAME_ACTIONS',
        payload: { canHit: false, canStay: false, isMyTurn: false },
      });
      return;
    }

    const isMyTurn = firebaseRoom.currentTurn === state.currentPlayerId;
    const canHit = isMyTurn && currentPlayer.status === 'active' && firebaseRoom.state === 'playing';
    const canStay = isMyTurn && currentPlayer.status === 'active' && firebaseRoom.state === 'playing';

    dispatch({
      type: 'SET_GAME_ACTIONS',
      payload: { canHit, canStay, isMyTurn },
    });
  }, [firebaseRoom, state.currentPlayerId]);

  // Update UI state when room state changes
  useEffect(() => {
    if (!firebaseRoom) return;

    const showGameOver = firebaseRoom.state === 'gameOver';
    const showRoundEnd = firebaseRoom.state === 'roundEnd';

    dispatch({
      type: 'SET_UI_STATE',
      payload: { showGameOver, showRoundEnd },
    });
  }, [firebaseRoom?.state]);

  // Connection status management
  useEffect(() => {
    const handleOnline = () => {
      dispatch({
        type: 'SET_CONNECTION_STATUS',
        payload: { isConnected: true, isReconnecting: false },
      });
    };

    const handleOffline = () => {
      dispatch({
        type: 'SET_CONNECTION_STATUS',
        payload: { isConnected: false, isReconnecting: true },
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Set initial connection status
    dispatch({
      type: 'SET_CONNECTION_STATUS',
      payload: { isConnected: navigator.onLine },
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Tab close detection and cleanup
  useEffect(() => {
    const handleBeforeUnload = async () => {
      if (roomCode && state.currentPlayerId) {
        try {
          // Mark player as disconnected when tab closes
          await markPlayerAsDisconnected(roomCode, state.currentPlayerId);
        } catch (error) {
          console.error('Failed to mark player as disconnected:', error);
        }
      }
    };

    const handleVisibilityChange = async () => {
      if (roomCode && state.currentPlayerId) {
        try {
          // Update connection status based on page visibility
          const isVisible = !document.hidden;
          await updatePlayerConnectionStatus(roomCode, state.currentPlayerId, isVisible);
        } catch (error) {
          console.error('Failed to update connection status:', error);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [roomCode, state.currentPlayerId, markPlayerAsDisconnected, updatePlayerConnectionStatus]);

  // Periodic cleanup of disconnected players
  useEffect(() => {
    if (!roomCode) return;

    const cleanupInterval = setInterval(async () => {
      try {
        await cleanupDisconnectedPlayers(roomCode, 5); // 5 minutes timeout
      } catch (error) {
        console.error('Failed to cleanup disconnected players:', error);
      }
    }, 60000); // Run every minute

    return () => {
      clearInterval(cleanupInterval);
    };
  }, [roomCode, cleanupDisconnectedPlayers]);

  // Room management functions
  const createRoom = useCallback(async (hostName: string, isSoloMode: boolean = false) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      const newRoom = await createNewRoom(hostName, isSoloMode);
      setRoomCode(newRoom.code);
      
      // Set current player as host
      const hostId = Object.keys(newRoom.players).find(id => newRoom.players[id].isHost);
      if (hostId) {
        dispatch({
          type: 'SET_CURRENT_PLAYER',
          payload: { playerId: hostId, player: newRoom.players[hostId] },
        });
      }
    } catch (error) {
      dispatch({
        type: 'SET_ERROR',
        payload: error instanceof Error ? error.message : 'Failed to create room',
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [createNewRoom]);

  const joinRoom = useCallback(async (roomCode: string, playerName: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      const joinedRoom = await joinExistingRoom(roomCode, playerName);
      setRoomCode(roomCode);
      
      // Find the player we just joined as
      const playerId = Object.keys(joinedRoom.players).find(id => joinedRoom.players[id].name === playerName);
      if (playerId) {
        dispatch({
          type: 'SET_CURRENT_PLAYER',
          payload: { playerId, player: joinedRoom.players[playerId] },
        });
      }
    } catch (error) {
      dispatch({
        type: 'SET_ERROR',
        payload: error instanceof Error ? error.message : 'Failed to join room',
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [joinExistingRoom]);

  const leaveRoom = useCallback(async () => {
    if (!roomCode || !state.currentPlayerId) return;
    
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      await firebaseLeaveRoom(roomCode, state.currentPlayerId);
      setRoomCode(null);
      dispatch({ type: 'RESET_STATE' });
    } catch (error) {
      dispatch({
        type: 'SET_ERROR',
        payload: error instanceof Error ? error.message : 'Failed to leave room',
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [roomCode, state.currentPlayerId, firebaseLeaveRoom]);

  // Host player management
  const removePlayer = useCallback(async (targetPlayerId: string) => {
    if (!roomCode || !state.currentPlayerId) return;
    
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      await removePlayerFromRoom(roomCode, state.currentPlayerId, targetPlayerId);
    } catch (error) {
      dispatch({
        type: 'SET_ERROR',
        payload: error instanceof Error ? error.message : 'Failed to remove player',
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [roomCode, state.currentPlayerId, removePlayerFromRoom]);

  // Game action functions
  const hit = useCallback(async () => {
    if (!firebaseRoom || !state.currentPlayerId) return;
    
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      const result = processHitAction(firebaseRoom, state.currentPlayerId);
      
      if (result.success && result.updatedRoom) {
        // Update the room with the new state
        // This will be handled by Firebase real-time updates
        dispatch({
          type: 'SET_UI_STATE',
          payload: { lastAction: result.message },
        });
      } else {
        dispatch({
          type: 'SET_ERROR',
          payload: result.message,
        });
      }
    } catch (error) {
      dispatch({
        type: 'SET_ERROR',
        payload: error instanceof Error ? error.message : 'Failed to hit',
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [firebaseRoom, state.currentPlayerId]);

  const stay = useCallback(async () => {
    if (!firebaseRoom || !state.currentPlayerId) return;
    
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      const result = processStayAction(firebaseRoom, state.currentPlayerId);
      
      if (result.success && result.updatedRoom) {
        // Update the room with the new state
        // This will be handled by Firebase real-time updates
        dispatch({
          type: 'SET_UI_STATE',
          payload: { lastAction: result.message },
        });
      } else {
        dispatch({
          type: 'SET_ERROR',
          payload: result.message,
        });
      }
    } catch (error) {
      dispatch({
        type: 'SET_ERROR',
        payload: error instanceof Error ? error.message : 'Failed to stay',
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [firebaseRoom, state.currentPlayerId]);

  const startGame = useCallback(async () => {
    if (!roomCode) return;
    
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      await startGameInRoom(roomCode);
    } catch (error) {
      dispatch({
        type: 'SET_ERROR',
        payload: error instanceof Error ? error.message : 'Failed to start game',
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [roomCode, startGameInRoom]);

  // Utility functions
  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
    clearFirebaseError();
  }, [clearFirebaseError]);

  const refreshConnection = useCallback(async () => {
    if (!roomCode) return;
    
    try {
      dispatch({
        type: 'SET_CONNECTION_STATUS',
        payload: { isConnected: false, isReconnecting: true },
      });
      
      await refreshRoom(roomCode);
      
      dispatch({
        type: 'SET_CONNECTION_STATUS',
        payload: { isConnected: true, isReconnecting: false },
      });
    } catch (error) {
      dispatch({
        type: 'SET_ERROR',
        payload: error instanceof Error ? error.message : 'Failed to reconnect',
      });
      dispatch({
        type: 'SET_CONNECTION_STATUS',
        payload: { isConnected: false, isReconnecting: false },
      });
    }
  }, [roomCode, refreshRoom]);

  // Context value
  const contextValue: GameContextType = {
    ...state,
    createRoom,
    joinRoom,
    leaveRoom,
    removePlayer,
    hit,
    stay,
    startGame,
    clearError,
    refreshConnection,
  };

  return (
    <GameContext.Provider value={contextValue}>
      {children}
    </GameContext.Provider>
  );
}

 