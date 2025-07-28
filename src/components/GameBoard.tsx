import React from 'react';
import { Button, TurnTimer, GameActionButtons, CardDeck, CardHand, TargetSelectionModal, ScoreDisplay, RoundSummary } from './index';
import { useGame } from '../hooks/useGame';
import type { Player, Card } from '../types';

interface GameBoardProps {
  onLeaveGame: () => void;
}

export function GameBoard({ onLeaveGame }: GameBoardProps) {
  const { 
    room, 
    currentPlayer, 
    hit, 
    stay, 
    leaveRoom,
    selectTarget,
    selectFlipThreeTarget,
    startNextRound,
    restartGame,
    canHit, 
    canStay, 
    isMyTurn,
    isLoading, 
    error,
    requiresTargetSelection,
    pendingAction
  } = useGame();

  const [showLeaveConfirm, setShowLeaveConfirm] = React.useState(false);
  const [flip7Celebration, setFlip7Celebration] = React.useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = React.useState(30000);
  const [lastAction, setLastAction] = React.useState<string | null>(null);
  const [showTargetSelection, setShowTargetSelection] = React.useState(false);

  // Check if current player is host
  const isHost = currentPlayer?.isHost || false;

  // Get sorted player list (current player first, then others)
  const sortedPlayers = React.useMemo(() => {
    if (!room) return [];
    
    return Object.values(room.players).sort((a, b) => {
      // Current player first
      if (a.id === currentPlayer?.id) return -1;
      if (b.id === currentPlayer?.id) return 1;
      // Then by join time
      return new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime();
    });
  }, [room, currentPlayer?.id]);

  // Handle timeout with proper callback
  const handleTimeout = React.useCallback(async () => {
    if (!canStay) return;
    setLastAction('Timeout - Auto Stay');
    try {
      await stay();
    } catch (err) {
      // Error handled by context
    }
  }, [canStay, stay]);

  // Timer effect for turn countdown
  React.useEffect(() => {
    if (!isMyTurn || !room || room.state !== 'playing') return;

    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 0) {
          // Use setTimeout to avoid calling during setState
          setTimeout(() => handleTimeout(), 0);
          return 30000; // Reset timer
        }
        return prev - 100;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isMyTurn, room?.state, handleTimeout]);

  // Reset timer when turn changes
  React.useEffect(() => {
    if (room?.currentTurn) {
      setTimeRemaining(30000);
    }
  }, [room?.currentTurn]);

  // Show target selection modal when required
  React.useEffect(() => {
    if (requiresTargetSelection && (pendingAction === 'freeze' || pendingAction === 'flipThree')) {
      setShowTargetSelection(true);
    }
  }, [requiresTargetSelection, pendingAction]);

  // Handle game actions with debounce
  const [isActionInProgress, setIsActionInProgress] = React.useState(false);
  const hitInProgressRef = React.useRef(false);

  const handleHit = React.useCallback(async () => {
    console.log('🔴 GameBoard handleHit called');
    console.log('🔴 canHit:', canHit);
    console.log('🔴 isActionInProgress:', isActionInProgress);
    console.log('🔴 hitInProgressRef.current:', hitInProgressRef.current);
    
    // Double check with ref to prevent race conditions
    if (!canHit || isActionInProgress || hitInProgressRef.current) {
      console.log('❌ Cannot hit - canHit:', canHit, 'isActionInProgress:', isActionInProgress, 'hitInProgressRef:', hitInProgressRef.current);
      return;
    }
    
    console.log('✅ Proceeding with hit action');
    hitInProgressRef.current = true;
    setIsActionInProgress(true);
    setLastAction('Hit - Drawing card...');
    
    try {
      console.log('🔄 Calling hit() function');
      await hit();
      console.log('✅ hit() function completed successfully');
      setLastAction('Hit - Drew a card');
    } catch (err) {
      console.log('❌ hit() function failed:', err);
      // Error handled by context
    } finally {
      console.log('🏁 Setting isActionInProgress to false');
      hitInProgressRef.current = false;
      setIsActionInProgress(false);
    }
  }, [canHit, isActionInProgress, hit]);

  const handleStay = async () => {
    if (!canStay || isActionInProgress) return;
    
    setIsActionInProgress(true);
    setLastAction('Stay - Keeping current hand...');
    
    try {
      await stay();
      setLastAction('Stay - Hand locked');
    } catch (err) {
      // Error handled by context
    } finally {
      setIsActionInProgress(false);
    }
  };

  // Handle leave game
  const handleLeaveGame = () => {
    setShowLeaveConfirm(false);
    onLeaveGame();
  };

  // Check for Flip 7 celebration
  React.useEffect(() => {
    if (!room) return;
    
    const checkFlip7 = () => {
      Object.values(room.players).forEach(player => {
        if (player.hasFlip7 && !flip7Celebration) {
          setFlip7Celebration(player.id);
          setTimeout(() => setFlip7Celebration(null), 5000); // 5 seconds celebration
        }
      });
    };
    
    // Use setTimeout to defer the state update
    const timeoutId = setTimeout(checkFlip7, 0);
    return () => clearTimeout(timeoutId);
  }, [room, flip7Celebration]);

  if (!room) {
    return null;
  }

  return (
    <div style={{
      minHeight: '100vh',
      position: 'relative',
      overflow: 'hidden',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)'
    }}>
      {/* Main Game Board */}
      <div style={{
        display: 'flex',
        minHeight: '100vh',
        position: 'relative',
        zIndex: 1
      }}>

        {/* Left Sidebar - Scoreboard */}
        <div style={{
          width: '280px',
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(20px)',
          borderRight: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          <h2 style={{
            color: '#fbbf24',
            fontSize: '1.25rem',
            fontWeight: '600',
            textAlign: 'center',
            marginBottom: '1rem'
          }}>
            🏆 Leaderboard
          </h2>

          {/* Game Info */}
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '0.75rem',
            padding: '1rem',
            marginBottom: '1rem'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '0.5rem'
            }}>
              <span style={{ color: '#9ca3af', fontSize: '0.875rem' }}>Round</span>
              <span style={{ color: 'white', fontWeight: '600' }}>
                {room.round} / {room.maxRounds}
              </span>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ color: '#9ca3af', fontSize: '0.875rem' }}>Status</span>
              <span style={{ 
                color: room.state === 'playing' ? '#10b981' : '#f59e0b',
                fontWeight: '600',
                textTransform: 'capitalize'
              }}>
                {room.state}
              </span>
            </div>
          </div>

          {/* Player Statistics */}
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '0.75rem',
            padding: '1rem',
            marginBottom: '1rem'
          }}>
            <div style={{
              color: '#9ca3af',
              fontSize: '0.875rem',
              marginBottom: '0.75rem',
              textAlign: 'center'
            }}>
              Player Status
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '0.5rem'
            }}>
              <div style={{
                textAlign: 'center',
                padding: '0.5rem',
                backgroundColor: 'rgba(34, 197, 94, 0.2)',
                borderRadius: '0.5rem',
                border: '1px solid rgba(34, 197, 94, 0.3)'
              }}>
                <div style={{ color: '#9ca3af', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                  Active
                </div>
                <div style={{ color: 'white', fontWeight: '600', fontSize: '1.125rem' }}>
                  {sortedPlayers.filter(p => p.status === 'active').length}
                </div>
              </div>
              <div style={{
                textAlign: 'center',
                padding: '0.5rem',
                backgroundColor: 'rgba(245, 158, 11, 0.2)',
                borderRadius: '0.5rem',
                border: '1px solid rgba(245, 158, 11, 0.3)'
              }}>
                <div style={{ color: '#9ca3af', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                  Stayed
                </div>
                <div style={{ color: 'white', fontWeight: '600', fontSize: '1.125rem' }}>
                  {sortedPlayers.filter(p => p.status === 'stayed').length}
                </div>
              </div>
              <div style={{
                textAlign: 'center',
                padding: '0.5rem',
                backgroundColor: 'rgba(239, 68, 68, 0.2)',
                borderRadius: '0.5rem',
                border: '1px solid rgba(239, 68, 68, 0.3)'
              }}>
                <div style={{ color: '#9ca3af', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                  Busted
                </div>
                <div style={{ color: 'white', fontWeight: '600', fontSize: '1.125rem' }}>
                  {sortedPlayers.filter(p => p.status === 'busted').length}
                </div>
              </div>
            </div>
          </div>

          {/* Player Rankings */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            flex: 1
          }}>
            {sortedPlayers
              .sort((a, b) => b.totalScore - a.totalScore) // Sort by total score
              .map((player, index) => (
                <div
                  key={player.id}
                  style={{
                    backgroundColor: player.id === currentPlayer?.id 
                      ? 'rgba(59, 130, 246, 0.2)' 
                      : 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '0.5rem',
                    padding: '0.75rem',
                    border: player.id === currentPlayer?.id 
                      ? '1px solid rgba(59, 130, 246, 0.5)' 
                      : '1px solid rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem'
                  }}
                >
                  {/* Rank Badge */}
                  <div style={{
                    width: '2rem',
                    height: '2rem',
                    borderRadius: '50%',
                    backgroundColor: index === 0 ? '#fbbf24' : 
                                   index === 1 ? '#9ca3af' : 
                                   index === 2 ? '#b45309' : '#6b7280',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: 'white',
                    flexShrink: 0
                  }}>
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                  </div>

                  {/* Player Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      marginBottom: '0.25rem'
                    }}>
                      <span style={{
                        color: 'white',
                        fontWeight: '600',
                        fontSize: '0.875rem',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {player.name}
                      </span>
                      {player.id === currentPlayer?.id && (
                        <span style={{
                          backgroundColor: '#3b82f6',
                          color: 'white',
                          fontSize: '0.625rem',
                          padding: '0.125rem 0.375rem',
                          borderRadius: '0.25rem',
                          fontWeight: '500'
                        }}>
                          You
                        </span>
                      )}
                      {player.isHost && (
                        <span style={{
                          backgroundColor: '#fbbf24',
                          color: 'black',
                          fontSize: '0.625rem',
                          padding: '0.125rem 0.375rem',
                          borderRadius: '0.25rem',
                          fontWeight: '500'
                        }}>
                          👑
                        </span>
                      )}
                      {player.isFrozen && (
                        <span style={{
                          backgroundColor: '#60a5fa',
                          color: 'white',
                          fontSize: '0.625rem',
                          padding: '0.125rem 0.375rem',
                          borderRadius: '0.25rem',
                          fontWeight: '500'
                        }}>
                          ❄️
                        </span>
                      )}
                    </div>
                    <div style={{
                      color: '#9ca3af',
                      fontSize: '0.75rem',
                      fontWeight: '600'
                    }}>
                      {player.totalScore} pts
                    </div>
                  </div>
                </div>
              ))}
          </div>

          {/* Leave Game Button */}
          <Button
            variant="danger"
            size="md"
            onClick={() => setShowLeaveConfirm(true)}
            style={{
              backgroundColor: 'rgba(220, 38, 38, 0.8)',
              backdropFilter: 'blur(10px)'
            }}
          >
            Leave Game
          </Button>
        </div>

        {/* Main Game Area */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          position: 'relative'
        }}>
          {/* Top Bar - Game Status */}
          <div style={{
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
            backdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '1rem 2rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem'
            }}>
              <h1 style={{
                color: 'white',
                fontSize: '1.5rem',
                fontWeight: '700',
                margin: 0
              }}>
                Flip 7
              </h1>
              <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                padding: '0.5rem 1rem',
                borderRadius: '0.5rem',
                color: 'white',
                fontSize: '0.875rem',
                fontWeight: '500'
              }}>
                Room: {room.code}
              </div>
            </div>

            {/* Turn Timer - Top Right */}
            {isMyTurn && room.state === 'playing' && (
              <div style={{
                maxWidth: '280px',
                minWidth: '240px'
              }}>
                <TurnTimer
                  timeRemaining={timeRemaining}
                  totalTime={30000}
                  isActive={isMyTurn}
                  playerName={currentPlayer?.name || 'Unknown'}
                  onTimeout={handleTimeout}
                />
              </div>
            )}
          </div>

          {/* Game Board Content */}
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            padding: '2rem',
            position: 'relative'
          }}>
            {/* Deck Area - Center Top */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              marginBottom: '2rem',
              position: 'relative'
            }}>
              <div style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem'
              }}>
                {/* Deck */}
                <div className="text-center">
                  <CardDeck 
                    cards={room.deck.map((_, i) => ({
                      id: `deck-${i}`,
                      type: 'number',
                      value: 0,
                      isFlipped: false,
                      isVisible: false,
                    }))}
                    showCount={true}
                  />
                  <p className="text-white text-sm mt-2">Deck</p>
                </div>

                {/* Discard Pile */}
                {room.discardPile.length > 0 && (
                  <div className="text-center">
                    <div style={{
                      width: '80px',
                      height: '120px',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: '0.5rem',
                      border: '2px solid rgba(255, 255, 255, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: '600',
                      fontSize: '0.875rem',
                      boxShadow: '0 8px 25px rgba(0, 0, 0, 0.3)'
                    }}>
                      <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        textAlign: 'center'
                      }}>
                        <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>🗑️</div>
                        <div>{room.discardPile.length}</div>
                      </div>
                    </div>
                    <p className="text-white text-sm mt-2">Discard</p>
                  </div>
                )}
              </div>
            </div>

            {/* Players Area */}
            <div style={{
              flex: 1,
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '1.5rem',
              alignItems: 'start'
            }}>
              {sortedPlayers.map((player) => (
                <PlayerArea
                  key={player.id}
                  player={player}
                  isCurrentPlayer={player.id === currentPlayer?.id}
                  isMyTurn={room.currentTurn === player.id}
                  isGameActive={room.state === 'playing'}
                  flip7Celebration={flip7Celebration === player.id}
                />
              ))}
            </div>

            {/* Game Actions - Center Bottom */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1rem',
              marginTop: '2rem'
            }}>
              {/* Game Action Buttons */}
              <div style={{ maxWidth: '500px', width: '100%' }}>
                <GameActionButtons
                  canHit={canHit && !isActionInProgress}
                  canStay={canStay && !isActionInProgress}
                  isMyTurn={isMyTurn}
                  isLoading={isLoading || isActionInProgress}
                  onHit={handleHit}
                  onStay={handleStay}
                  timeRemaining={timeRemaining}
                  totalTime={30000}
                />
              </div>

              {/* Last Action Display */}
              {lastAction && (
                <div style={{
                  backgroundColor: 'rgba(59, 130, 246, 0.9)',
                  color: 'white',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.5rem',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  textAlign: 'center',
                  maxWidth: '400px'
                }}>
                  {lastAction}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div style={{
          position: 'fixed',
          top: '2rem',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'rgba(220, 38, 38, 0.9)',
          color: 'white',
          padding: '1rem 1.5rem',
          borderRadius: '0.75rem',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(220, 38, 38, 0.3)',
          zIndex: 1000,
          maxWidth: '500px',
          textAlign: 'center'
        }}>
          {error}
        </div>
      )}

      {/* Leave Confirmation Modal */}
      {showLeaveConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '0.75rem',
            padding: '2rem',
            maxWidth: '400px',
            width: '90%',
            textAlign: 'center'
          }}>
            <h3 style={{
              fontSize: '1.25rem',
              fontWeight: '600',
              marginBottom: '1rem',
              color: '#1f2937'
            }}>
              Leave Game?
            </h3>
            <p style={{
              color: '#6b7280',
              marginBottom: '1.5rem'
            }}>
              Are you sure you want to leave this game? You'll lose your progress.
            </p>
            <div style={{
              display: 'flex',
              gap: '1rem',
              justifyContent: 'center'
            }}>
              <Button
                variant="secondary"
                onClick={() => setShowLeaveConfirm(false)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleLeaveGame}
              >
                Leave Game
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Flip 7 Celebration */}
      {flip7Celebration && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          pointerEvents: 'none'
        }}>
          <div style={{
            textAlign: 'center',
            animation: 'bounceIn 0.6s ease-out'
          }}>
            <div style={{
              fontSize: '8rem',
              marginBottom: '1rem',
              animation: 'pulse 0.5s infinite'
            }}>
              🎉
            </div>
            <div style={{
              fontSize: '3rem',
              fontWeight: '700',
              color: 'white',
              textShadow: '0 4px 8px rgba(0, 0, 0, 0.5)',
              marginBottom: '1rem'
            }}>
              FLIP 7!
            </div>
            <div style={{
              fontSize: '1.5rem',
              color: '#fbbf24',
              fontWeight: '600'
            }}>
              Instant Win! +15 Points!
            </div>
          </div>
        </div>
      )}

      {/* Bust Animation */}
      {/* Removed bust animation useEffect */}

      {/* Target Selection Modal */}
      <TargetSelectionModal
        isOpen={showTargetSelection}
        onClose={() => setShowTargetSelection(false)}
        onSelectTarget={async (targetPlayerId) => {
          setShowTargetSelection(false);
          try {
            if (pendingAction === 'freeze') {
              await selectTarget(targetPlayerId);
            } else if (pendingAction === 'flipThree') {
              await selectFlipThreeTarget(targetPlayerId);
            }
          } catch (error) {
            console.error('Failed to select target:', error);
          }
        }}
        players={room.players}
        currentPlayerId={currentPlayer?.id || ''}
        actionType={pendingAction === 'freeze' ? 'freeze' : 'flipThree'}
      />

      {/* Round Summary Modal */}
      <RoundSummary
        isOpen={room?.state === 'roundEnd' || room?.state === 'gameOver'}
        onClose={() => {}} // No close action for round summary
        room={room!}
        currentPlayerId={currentPlayer?.id || ''}
        onStartNextRound={startNextRound}
        onRestartGame={restartGame}
      />
    </div>
  );
}

// Player Area Component
interface PlayerAreaProps {
  player: Player;
  isCurrentPlayer: boolean;
  isMyTurn: boolean;
  isGameActive: boolean;
  flip7Celebration: boolean;
}

function PlayerArea({ 
  player, 
  isCurrentPlayer, 
  isMyTurn, 
  isGameActive,
  flip7Celebration 
}: PlayerAreaProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#10b981';
      case 'stayed': return '#f59e0b';
      case 'busted': return '#ef4444';
      case 'disconnected': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Active';
      case 'stayed': return 'Stayed';
      case 'busted': return 'Busted';
      case 'disconnected': return 'Disconnected';
      default: return 'Unknown';
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      {/* Player Info - Floating Outside */}
      <div style={{
        position: 'absolute',
        top: '1rem',
        left: '0',
        right: '0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 10
      }}>
        {/* Player Name, Status, and Total Score */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <div style={{
            width: '2.5rem',
            height: '2.5rem',
            borderRadius: '50%',
            backgroundColor: player.isHost ? '#fbbf24' : '#6b7280',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.25rem',
            fontWeight: '600',
            color: 'white'
          }}>
            {player.isHost ? '👑' : player.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '0.25rem'
            }}>
              <span style={{
                color: 'white',
                fontWeight: '600',
                fontSize: '1rem'
              }}>
                {player.name}
              </span>
              {isCurrentPlayer && (
                <span style={{
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  fontSize: '0.75rem',
                  padding: '0.125rem 0.5rem',
                  borderRadius: '0.25rem',
                  fontWeight: '500'
                }}>
                  You
                </span>
              )}
              {isMyTurn && (
                <span style={{
                  backgroundColor: '#10b981',
                  color: 'white',
                  fontSize: '0.75rem',
                  padding: '0.125rem 0.5rem',
                  borderRadius: '0.25rem',
                  fontWeight: '500',
                  animation: 'pulse 1s infinite'
                }}>
                  TURN
                </span>
              )}
              {/* Frozen indicator */}
              {player.isFrozen && (
                <span style={{
                  backgroundColor: '#60a5fa',
                  color: 'white',
                  fontSize: '0.75rem',
                  padding: '0.125rem 0.5rem',
                  borderRadius: '0.25rem',
                  fontWeight: '500',
                  marginLeft: '0.5rem'
                }}>
                  ❄️ FROZEN
                </span>
              )}
              {/* Total Score alongside name */}
              <span style={{
                color: '#9ca3af',
                fontSize: '0.75rem',
                marginLeft: '0.5rem'
              }}>
                Total: {player.totalScore}
              </span>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.875rem'
            }}>
              <div style={{
                width: '0.5rem',
                height: '0.5rem',
                borderRadius: '50%',
                backgroundColor: getStatusColor(player.status)
              }} />
              <span style={{ color: '#9ca3af' }}>
                {getStatusText(player.status)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Player Hand Box - Focused on Cards */}
      <div style={{
        backgroundColor: isCurrentPlayer ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255, 255, 255, 0.05)',
        borderRadius: '1rem',
        padding: '2rem',
        border: isCurrentPlayer ? '2px solid rgba(59, 130, 246, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        position: 'relative',
        animation: isMyTurn ? 'pulse 2s infinite' : 'none',
        minHeight: '200px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {/* Red overlay for busted players */}
        {player.status === 'busted' && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(239, 68, 68, 0.3)', // Red overlay
            borderRadius: '1rem',
            zIndex: 5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div style={{
              backgroundColor: 'rgba(239, 68, 68, 0.9)',
              color: 'white',
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              fontSize: '1.125rem',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              BUSTED!
            </div>
          </div>
        )}
        
        {/* Blue overlay for frozen players */}
        {player.isFrozen && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(96, 165, 250, 0.3)', // Blue overlay
            borderRadius: '1rem',
            zIndex: 5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div style={{
              backgroundColor: 'rgba(96, 165, 250, 0.9)',
              color: 'white',
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              fontSize: '1.125rem',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              ❄️ FROZEN
            </div>
          </div>
        )}
        <CardHand
          cards={player.hand}
          isPlayerTurn={isMyTurn}
          isActive={isGameActive}
          showBack={false}
          maxVisibleCards={5}
          size="lg"
        />
      </div>
    </div>
  );
}

 