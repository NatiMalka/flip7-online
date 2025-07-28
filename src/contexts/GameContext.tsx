import React, { useReducer, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { useFirebaseRoom } from '../hooks/useFirebaseRoom';
import { processHitAction, processStayAction } from '../utils/gameRules';
import { updateRoom } from '../services/firebaseData';
import { GameContext } from './GameContextTypes';
import type { GameContextState, GameContextAction, GameContextType } from './GameContextTypes';
import type { Player } from '../types';

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
    
    // More lenient canHit logic - don't disable during loading if it was previously enabled
    const canHit = isMyTurn && 
                   currentPlayer.status === 'active' && 
                   firebaseRoom.state === 'playing' &&
                   !currentPlayer.isFrozen; // Add frozen check
    
    const canStay = isMyTurn && currentPlayer.status === 'active' && firebaseRoom.state === 'playing';

    console.log('🎮 Game actions update:', {
      isMyTurn,
      playerStatus: currentPlayer.status,
      gameState: firebaseRoom.state,
      isFrozen: currentPlayer.isFrozen,
      canHit,
      canStay,
      isLoading: state.isLoading
    });

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
    console.log('🔵 Hit function called');
    
    // Quick validation first
    if (!firebaseRoom || !state.currentPlayerId) {
      console.log('❌ No firebaseRoom or currentPlayerId');
      return;
    }

    // Prevent double clicks with a ref-based approach (faster than state)
    if (state.isLoading) {
      console.log('❌ Already processing action, ignoring');
      return;
    }
    
    // Immediate validation before setting loading state
    const currentPlayer = firebaseRoom.players[state.currentPlayerId];
    if (!currentPlayer) {
      console.log('❌ Player not found');
      dispatch({
        type: 'SET_ERROR',
        payload: "Player not found",
      });
      return;
    }

    if (firebaseRoom.currentTurn !== state.currentPlayerId) {
      console.log('❌ Not your turn');
      dispatch({
        type: 'SET_ERROR',
        payload: "It's not your turn",
      });
      return;
    }

    if (currentPlayer.status !== 'active') {
      console.log('❌ Player not active');
      dispatch({
        type: 'SET_ERROR',
        payload: "You cannot hit - you are not active",
      });
      return;
    }

    if (firebaseRoom.state !== 'playing') {
      console.log('❌ Game not in playing state');
      dispatch({
        type: 'SET_ERROR',
        payload: "Game is not in progress",
      });
      return;
    }

    console.log('✅ All validations passed, processing hit');
    
    // Set loading state after validation
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      // Use the processHitAction from gameRules for consistent logic
      const result = processHitAction(firebaseRoom, state.currentPlayerId);
      
      if (!result.success) {
        console.log('❌ Hit action failed:', result.message);
        dispatch({
          type: 'SET_ERROR',
          payload: result.message,
        });
        return;
      }

      if (!result.updatedRoom) {
        console.log('❌ No updated room in result');
        dispatch({
          type: 'SET_ERROR',
          payload: "Failed to process hit action",
        });
        return;
      }

      console.log('✅ Hit action successful, updating Firebase');
      
      // Optimized Firebase update - only send changed fields
      const updates: any = {};

      if (result.updatedRoom.players) {
        updates.players = result.updatedRoom.players;
      }
      if (result.updatedRoom.deck) {
        updates.deck = result.updatedRoom.deck;
      }
      if (result.updatedRoom.discardPile) {
        updates.discardPile = result.updatedRoom.discardPile;
      }
      if (result.updatedRoom.currentTurn !== firebaseRoom.currentTurn) {
        updates.currentTurn = result.updatedRoom.currentTurn;
      }
      if (result.updatedRoom.state && result.updatedRoom.state !== firebaseRoom.state) {
        updates.state = result.updatedRoom.state;
      }
      if (result.updatedRoom.round !== undefined && result.updatedRoom.round !== firebaseRoom.round) {
        updates.round = result.updatedRoom.round;
      }

      // Fire and update - don't wait for completion for better responsiveness
      updateRoom(firebaseRoom.code, updates).catch(error => {
        console.error('❌ Firebase update failed:', error);
        dispatch({
          type: 'SET_ERROR',
          payload: 'Failed to update game state',
        });
      });
      
      console.log('✅ Firebase update initiated');

      // Update UI state immediately for better user experience
      if (result.requiresTargetSelection) {
        console.log('🎯 Requires target selection');
        dispatch({
          type: 'SET_UI_STATE',
          payload: { 
            lastAction: result.message,
            requiresTargetSelection: true,
            pendingAction: result.effects?.[0]?.type || null,
          },
        });
      } else {
        console.log('✅ Updating UI state with message:', result.message);
        dispatch({
          type: 'SET_UI_STATE',
          payload: { 
            lastAction: result.message,
            requiresTargetSelection: false,
            pendingAction: null,
          },
        });
      }

    } catch (error) {
      console.log('❌ Hit function error:', error);
      dispatch({
        type: 'SET_ERROR',
        payload: error instanceof Error ? error.message : 'Failed to hit',
      });
    } finally {
      console.log('🏁 Hit function completed');
      // Clear loading state immediately for better responsiveness
      dispatch({ type: 'SET_LOADING', payload: false });
    }

  }, [firebaseRoom, state.currentPlayerId]);

  // Handle target selection for Freeze card
  const selectTarget = useCallback(async (targetPlayerId: string) => {
    if (!firebaseRoom || !state.currentPlayerId) return;
    
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      // Import the handleFreezeAction function
      const { handleFreezeAction } = await import('../utils/gameRules');
      
      const currentPlayer = firebaseRoom.players[state.currentPlayerId];
      const newHand = currentPlayer.hand; // The Freeze card is already in hand
      
      const result = handleFreezeAction(firebaseRoom, state.currentPlayerId, targetPlayerId, newHand, firebaseRoom.deck);
      
      if (result.success && result.updatedRoom) {
        // Update Firebase with the new room state
        const updates: any = {};
        if (result.updatedRoom.players) updates.players = result.updatedRoom.players;
        if (result.updatedRoom.deck) updates.deck = result.updatedRoom.deck;
        if (result.updatedRoom.discardPile) updates.discardPile = result.updatedRoom.discardPile;
        if (result.updatedRoom.currentTurn) updates.currentTurn = result.updatedRoom.currentTurn;
        if (result.updatedRoom.state) updates.state = result.updatedRoom.state;
        if (result.updatedRoom.round) updates.round = result.updatedRoom.round;
        
        // Retry logic for better reliability
        let retries = 0;
        const maxRetries = 3;
        
        while (retries < maxRetries) {
          try {
            await updateRoom(firebaseRoom.code, updates);
            break; // Success, exit retry loop
          } catch (error) {
            retries++;
            if (retries >= maxRetries) {
              throw error; // Re-throw if all retries failed
            }
            // Wait a bit before retrying
            await new Promise(resolve => setTimeout(resolve, 100 * retries));
          }
        }
        
        dispatch({
          type: 'SET_UI_STATE',
          payload: { 
            lastAction: result.message,
            requiresTargetSelection: false,
            pendingAction: null,
          },
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
        payload: error instanceof Error ? error.message : 'Failed to select target',
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [firebaseRoom, state.currentPlayerId]);

  // Handle Flip Three target selection
  const selectFlipThreeTarget = useCallback(async (targetPlayerId: string) => {
    if (!firebaseRoom || !state.currentPlayerId) return;
    
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      // Import the handleFlipThreeAction function
      const { handleFlipThreeAction } = await import('../utils/gameRules');
      
      const currentPlayer = firebaseRoom.players[state.currentPlayerId];
      const newHand = currentPlayer.hand; // The Flip Three card is already in hand
      
      const result = handleFlipThreeAction(firebaseRoom, state.currentPlayerId, targetPlayerId, newHand, firebaseRoom.deck);
      
      if (result.success && result.updatedRoom) {
        // Update Firebase with the new room state
        const updates: any = {};
        if (result.updatedRoom.players) updates.players = result.updatedRoom.players;
        if (result.updatedRoom.deck) updates.deck = result.updatedRoom.deck;
        if (result.updatedRoom.discardPile) updates.discardPile = result.updatedRoom.discardPile;
        if (result.updatedRoom.currentTurn) updates.currentTurn = result.updatedRoom.currentTurn;
        if (result.updatedRoom.state) updates.state = result.updatedRoom.state;
        if (result.updatedRoom.round) updates.round = result.updatedRoom.round;
        
        // Retry logic for better reliability
        let retries = 0;
        const maxRetries = 3;
        
        while (retries < maxRetries) {
          try {
            await updateRoom(firebaseRoom.code, updates);
            break; // Success, exit retry loop
          } catch (error) {
            retries++;
            if (retries >= maxRetries) {
              throw error; // Re-throw if all retries failed
            }
            // Wait a bit before retrying
            await new Promise(resolve => setTimeout(resolve, 100 * retries));
          }
        }
        
        dispatch({
          type: 'SET_UI_STATE',
          payload: { 
            lastAction: result.message,
            requiresTargetSelection: false,
            pendingAction: null,
          },
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
        payload: error instanceof Error ? error.message : 'Failed to select target',
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
        // Update Firebase with the new room state
        const updates: any = {};
        if (result.updatedRoom.players) updates.players = result.updatedRoom.players;
        if (result.updatedRoom.deck) updates.deck = result.updatedRoom.deck;
        if (result.updatedRoom.discardPile) updates.discardPile = result.updatedRoom.discardPile;
        if (result.updatedRoom.currentTurn) updates.currentTurn = result.updatedRoom.currentTurn;
        if (result.updatedRoom.state) updates.state = result.updatedRoom.state;
        if (result.updatedRoom.round) updates.round = result.updatedRoom.round;
        
        // Retry logic for better reliability
        let retries = 0;
        const maxRetries = 3;
        
        while (retries < maxRetries) {
          try {
            await updateRoom(firebaseRoom.code, updates);
            break; // Success, exit retry loop
          } catch (error) {
            retries++;
            if (retries >= maxRetries) {
              throw error; // Re-throw if all retries failed
            }
            // Wait a bit before retrying
            await new Promise(resolve => setTimeout(resolve, 100 * retries));
          }
        }
        
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

  const startNextRound = useCallback(async () => {
    if (!firebaseRoom || !state.currentPlayerId) return;
    
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      // Import the initializeRound function
      const { initializeRound } = await import('../utils/gameRules');
      
      const updatedRoom = initializeRound(firebaseRoom);
      
      // Update Firebase with the new round
      const updates: any = {};
      if (updatedRoom.players) updates.players = updatedRoom.players;
      if (updatedRoom.deck) updates.deck = updatedRoom.deck;
      if (updatedRoom.discardPile) updates.discardPile = updatedRoom.discardPile;
      if (updatedRoom.currentTurn) updates.currentTurn = updatedRoom.currentTurn;
      if (updatedRoom.state) updates.state = updatedRoom.state;
      if (updatedRoom.round) updates.round = updatedRoom.round;
      
      await updateRoom(firebaseRoom.code, updates);
      
      dispatch({
        type: 'SET_UI_STATE',
        payload: { lastAction: 'Next round started' },
      });
    } catch (error) {
      dispatch({
        type: 'SET_ERROR',
        payload: error instanceof Error ? error.message : 'Failed to start next round',
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [firebaseRoom, state.currentPlayerId]);

  const restartGame = useCallback(async () => {
    if (!firebaseRoom || !state.currentPlayerId) return;
    
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      // Import the initializeRound function
      const { initializeRound } = await import('../utils/gameRules');
      
      // Reset all players
      const resetPlayers: Record<string, Player> = {};
      for (const [playerId, player] of Object.entries(firebaseRoom.players)) {
        resetPlayers[playerId] = {
          ...player,
          hand: [],
          roundScore: 0,
          totalScore: 0,
          status: 'active',
          hasFlip7: false,
          isFrozen: false, // Clear frozen status
          frozenUntilRound: undefined, // Clear freeze duration
        };
      }
      
      // Initialize new round
      const updatedRoom = initializeRound({
        ...firebaseRoom,
        players: resetPlayers,
        round: 0,
        state: 'playing',
        winner: undefined,
      });
      
      // Update Firebase with the restarted game
      const updates: any = {};
      if (updatedRoom.players) updates.players = updatedRoom.players;
      if (updatedRoom.deck) updates.deck = updatedRoom.deck;
      if (updatedRoom.discardPile) updates.discardPile = updatedRoom.discardPile;
      if (updatedRoom.currentTurn) updates.currentTurn = updatedRoom.currentTurn;
      if (updatedRoom.state) updates.state = updatedRoom.state;
      if (updatedRoom.round) updates.round = updatedRoom.round;
      updates.winner = undefined;
      
      await updateRoom(firebaseRoom.code, updates);
      
      dispatch({
        type: 'SET_UI_STATE',
        payload: { lastAction: 'Game restarted' },
      });
    } catch (error) {
      dispatch({
        type: 'SET_ERROR',
        payload: error instanceof Error ? error.message : 'Failed to restart game',
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [firebaseRoom, state.currentPlayerId]);

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
    selectTarget,
    selectFlipThreeTarget,
    startGame,
    startNextRound,
    restartGame,
    clearError,
    refreshConnection,
  };

  return (
    <GameContext.Provider value={contextValue}>
      {children}
    </GameContext.Provider>
  );
}

 