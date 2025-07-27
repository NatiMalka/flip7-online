import React from 'react';
import { Button } from './index';
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
    canHit, 
    canStay, 
    isMyTurn,
    isLoading, 
    error 
  } = useGame();

  const [showLeaveConfirm, setShowLeaveConfirm] = React.useState(false);
  const [flip7Celebration, setFlip7Celebration] = React.useState<string | null>(null);
  const [bustAnimation, setBustAnimation] = React.useState<string | null>(null);

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

  // Handle game actions
  const handleHit = async () => {
    if (!canHit) return;
    try {
      await hit();
    } catch (err) {
      // Error handled by context
    }
  };

  const handleStay = async () => {
    if (!canStay) return;
    try {
      await stay();
    } catch (err) {
      // Error handled by context
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
    
    Object.values(room.players).forEach(player => {
      if (player.hasFlip7 && !flip7Celebration) {
        setFlip7Celebration(player.id);
        setTimeout(() => setFlip7Celebration(null), 5000); // 5 seconds celebration
      }
    });
  }, [room, flip7Celebration]);

  // Check for bust animations
  React.useEffect(() => {
    if (!room) return;
    
    Object.values(room.players).forEach(player => {
      if (player.status === 'busted' && !bustAnimation) {
        setBustAnimation(player.id);
        setTimeout(() => setBustAnimation(null), 3000); // 3 seconds animation
      }
    });
  }, [room, bustAnimation]);

  if (!room) {
    return null;
  }

  return (
    <div className="animated-bg" style={{
      minHeight: '100vh',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Floating Particles */}
      <div className="particles">
        {Array.from({ length: 20 }, (_, i) => (
          <div key={i} className="particle" />
        ))}
      </div>

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

          {/* Player Rankings */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            flex: 1
          }}>
            {sortedPlayers
              .sort((a, b) => b.score - a.score) // Sort by score
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
                    </div>
                    <div style={{
                      color: '#9ca3af',
                      fontSize: '0.75rem',
                      fontWeight: '600'
                    }}>
                      {player.score} pts
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

            {/* Turn Indicator */}
            {room.currentTurn && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                backgroundColor: 'rgba(59, 130, 246, 0.2)',
                padding: '0.75rem 1rem',
                borderRadius: '0.75rem',
                border: '1px solid rgba(59, 130, 246, 0.5)',
                animation: isMyTurn ? 'pulse 2s infinite' : 'none'
              }}>
                <div style={{
                  width: '0.75rem',
                  height: '0.75rem',
                  borderRadius: '50%',
                  backgroundColor: isMyTurn ? '#10b981' : '#f59e0b',
                  animation: isMyTurn ? 'pulse 1s infinite' : 'none'
                }} />
                <span style={{
                  color: 'white',
                  fontWeight: '600',
                  fontSize: '0.875rem'
                }}>
                  {isMyTurn ? 'Your Turn!' : `${room.players[room.currentTurn]?.name}'s Turn`}
                </span>
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
                gap: '0.5rem'
              }}>
                {/* Deck */}
                <div style={{
                  width: '80px',
                  height: '120px',
                  backgroundColor: 'linear-gradient(135deg, #1e293b, #334155)',
                  borderRadius: '0.5rem',
                  border: '2px solid rgba(255, 255, 255, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: '600',
                  fontSize: '0.875rem',
                  boxShadow: '0 8px 25px rgba(0, 0, 0, 0.3)',
                  position: 'relative'
                }}>
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>🃏</div>
                    <div>{room.deck.length}</div>
                  </div>
                </div>

                {/* Discard Pile */}
                {room.discardPile.length > 0 && (
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
                  bustAnimation={bustAnimation === player.id}
                />
              ))}
            </div>

            {/* Action Buttons - Current Player Only */}
            {isMyTurn && room.state === 'playing' && (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '1rem',
                marginTop: '2rem',
                padding: '1rem',
                backgroundColor: 'rgba(0, 0, 0, 0.2)',
                borderRadius: '1rem',
                backdropFilter: 'blur(10px)'
              }}>
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleHit}
                  disabled={!canHit || isLoading}
                  style={{
                    backgroundColor: 'rgba(220, 38, 38, 0.9)',
                    backdropFilter: 'blur(10px)',
                    minWidth: '120px',
                    fontSize: '1.125rem',
                    fontWeight: '600'
                  }}
                >
                  {isLoading ? '...' : 'Hit'}
                </Button>
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={handleStay}
                  disabled={!canStay || isLoading}
                  style={{
                    backgroundColor: 'rgba(2, 132, 199, 0.9)',
                    backdropFilter: 'blur(10px)',
                    minWidth: '120px',
                    fontSize: '1.125rem',
                    fontWeight: '600'
                  }}
                >
                  {isLoading ? '...' : 'Stay'}
                </Button>
              </div>
            )}
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
      {bustAnimation && (
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
            animation: 'shake 0.5s ease-in-out'
          }}>
            <div style={{
              fontSize: '6rem',
              marginBottom: '1rem',
              animation: 'bounce 0.5s infinite'
            }}>
              💥
            </div>
            <div style={{
              fontSize: '2.5rem',
              fontWeight: '700',
              color: '#ef4444',
              textShadow: '0 4px 8px rgba(0, 0, 0, 0.5)'
            }}>
              BUST!
            </div>
          </div>
        </div>
      )}
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
  bustAnimation: boolean;
}

function PlayerArea({ 
  player, 
  isCurrentPlayer, 
  isMyTurn, 
  isGameActive,
  flip7Celebration,
  bustAnimation 
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
    <div style={{
      backgroundColor: isCurrentPlayer ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255, 255, 255, 0.05)',
      borderRadius: '1rem',
      padding: '1.5rem',
      border: isCurrentPlayer ? '2px solid rgba(59, 130, 246, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(10px)',
      position: 'relative',
      animation: isMyTurn ? 'pulse 2s infinite' : 'none',
      transform: bustAnimation ? 'scale(1.05)' : 'scale(1)',
      transition: 'transform 0.3s ease'
    }}>
      {/* Player Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1rem'
      }}>
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

        {/* Current Round Score */}
        <div style={{
          textAlign: 'right'
        }}>
          <div style={{
            color: '#9ca3af',
            fontSize: '0.75rem',
            marginBottom: '0.25rem'
          }}>
            Round Score
          </div>
          <div style={{
            color: 'white',
            fontWeight: '700',
            fontSize: '1.25rem'
          }}>
            {player.hand.reduce((sum, card) => {
              if (card.type === 'number' && card.value !== undefined) {
                return sum + card.value;
              }
              return sum;
            }, 0)}
          </div>
        </div>
      </div>

      {/* Player Hand */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        flexWrap: 'wrap',
        justifyContent: 'center'
      }}>
        {player.hand.map((card, index) => (
          <GameCard
            key={`${player.id}-${index}`}
            card={card}
            isVisible={isCurrentPlayer || !isGameActive}
            index={index}
            flip7Celebration={flip7Celebration}
          />
        ))}
        {player.hand.length === 0 && (
          <div style={{
            width: '80px',
            height: '120px',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '0.5rem',
            border: '2px dashed rgba(255, 255, 255, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#9ca3af',
            fontSize: '0.875rem'
          }}>
            No Cards
          </div>
        )}
      </div>
    </div>
  );
}

// Game Card Component
interface GameCardProps {
  card: Card;
  isVisible: boolean;
  index: number;
  flip7Celebration: boolean;
}

function GameCard({ card, isVisible, index, flip7Celebration }: GameCardProps) {
  const getCardColor = (card: Card) => {
    if (card.type === 'number') {
      if (card.value === 7) return '#fbbf24'; // Flip 7 - Gold
      if (card.value && card.value > 7) return '#ef4444'; // High numbers - Red
      return '#10b981'; // Low numbers - Green
    }
    if (card.type === 'action') return '#3b82f6'; // Action cards - Blue
    if (card.type === 'modifier') return '#8b5cf6'; // Modifier cards - Purple
    return '#6b7280'; // Default - Gray
  };

  const getCardContent = (card: Card) => {
    if (card.type === 'number') {
      return {
        value: card.value?.toString() || '?',
        icon: card.value === 7 ? '🎯' : '🔢'
      };
    }
    if (card.type === 'action') {
      return {
        value: card.action?.replace(/([A-Z])/g, ' $1').trim() || 'Action',
        icon: '⚡'
      };
    }
    if (card.type === 'modifier') {
      return {
        value: card.modifier?.toUpperCase() || 'Modifier',
        icon: '✨'
      };
    }
    return { value: '?', icon: '❓' };
  };

  const cardContent = getCardContent(card);
  const cardColor = getCardColor(card);

  return (
    <div style={{
      width: '80px',
      height: '120px',
      backgroundColor: isVisible ? cardColor : 'linear-gradient(135deg, #1e293b, #334155)',
      borderRadius: '0.5rem',
      border: '2px solid rgba(255, 255, 255, 0.2)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontWeight: '600',
      fontSize: '0.875rem',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      transform: `rotateY(${isVisible ? '0deg' : '180deg'})`,
      animation: flip7Celebration && card.value === 7 ? 'bounce 0.5s infinite' : 'none',
      position: 'relative',
      zIndex: index
    }}
    onMouseEnter={(e) => {
      if (isVisible) {
        e.currentTarget.style.transform = 'translateY(-10px) scale(1.05)';
        e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.4)';
      }
    }}
    onMouseLeave={(e) => {
      if (isVisible) {
        e.currentTarget.style.transform = 'translateY(0) scale(1)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
      }
    }}
    >
      {isVisible ? (
        <>
          <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>
            {cardContent.icon}
          </div>
          <div style={{ 
            fontSize: card.value === 7 ? '1.25rem' : '1rem',
            fontWeight: card.value === 7 ? '700' : '600',
            textAlign: 'center',
            lineHeight: '1.2'
          }}>
            {cardContent.value}
          </div>
          {card.value === 7 && (
            <div style={{
              position: 'absolute',
              top: '-0.5rem',
              right: '-0.5rem',
              backgroundColor: '#fbbf24',
              color: 'black',
              borderRadius: '50%',
              width: '1.5rem',
              height: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.75rem',
              fontWeight: '700'
            }}>
              ★
            </div>
          )}
        </>
      ) : (
        <div style={{
          width: '100%',
          height: '100%',
          background: 'linear-gradient(135deg, #1e293b, #334155)',
          borderRadius: '0.375rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.5rem'
        }}>
          🃏
        </div>
      )}
    </div>
  );
} 