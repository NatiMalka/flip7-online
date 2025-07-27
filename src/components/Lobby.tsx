import React from 'react';
import { Button } from './index';
import { useGame } from '../hooks/useGame';
import type { Player } from '../types';

interface LobbyProps {
  onLeaveRoom: () => void;
}

export function Lobby({ onLeaveRoom }: LobbyProps) {
  const { 
    room, 
    currentPlayer, 
    removePlayer,
    startGame, 
    isLoading, 
    error
  } = useGame();

  const [copied, setCopied] = React.useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = React.useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = React.useState<{
    show: boolean;
    playerId: string;
    playerName: string;
  }>({ show: false, playerId: '', playerName: '' });

  // Copy room code to clipboard
  const copyRoomCode = async () => {
    if (!room) return;
    
    try {
      await navigator.clipboard.writeText(room.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy room code:', err);
    }
  };

  // Check if current player is host
  const isHost = currentPlayer?.isHost || false;

  // Get sorted player list (host first, then by join time)
  const sortedPlayers = React.useMemo(() => {
    if (!room) return [];
    
    return Object.values(room.players).sort((a, b) => {
      if (a.isHost && !b.isHost) return -1;
      if (!a.isHost && b.isHost) return 1;
      return new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime();
    });
  }, [room]);

  // Handle start game
  const handleStartGame = async () => {
    if (!isHost) return;
    
    try {
      await startGame();
    } catch {
      // Error is handled by the context
    }
  };

  // Handle leave room
  const handleLeaveRoom = () => {
    setShowLeaveConfirm(false);
    onLeaveRoom();
  };

  // Handle remove player
  const handleRemovePlayer = async () => {
    if (!showRemoveConfirm.show) return;
    
    try {
      await removePlayer(showRemoveConfirm.playerId);
      setShowRemoveConfirm({ show: false, playerId: '', playerName: '' });
    } catch {
      // Error is handled by the context
    }
  };

  // Show remove player confirmation
  const showRemovePlayerConfirm = (playerId: string, playerName: string) => {
    setShowRemoveConfirm({ show: true, playerId, playerName });
  };

  if (!room) {
    return null;
  }

  return (
    <div className="animated-bg" style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      padding: '2rem'
    }}>
      {/* Floating Particles */}
      <div className="particles">
        {Array.from({ length: 20 }, (_, i) => (
          <div key={i} className="particle" />
        ))}
      </div>

      <div style={{
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '1rem',
        padding: '2rem',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        maxWidth: '800px',
        width: '100%',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: '2rem',
          color: 'white'
        }}>
          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: '700',
            marginBottom: '0.5rem',
            background: 'linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1)',
            backgroundSize: '200% 200%',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            animation: 'titleGradient 3s ease-in-out infinite'
          }}>
            Game Lobby
          </h1>
          <p style={{
            fontSize: '1.125rem',
            color: '#d1d5db',
            marginBottom: '1rem'
          }}>
            Waiting for players to join...
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div style={{
            backgroundColor: 'rgba(220, 38, 38, 0.9)',
            color: 'white',
            padding: '0.75rem 1rem',
            borderRadius: '0.5rem',
            marginBottom: '1.5rem',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(220, 38, 38, 0.3)'
          }}>
            {error}
          </div>
        )}

        {/* Room Code Section */}
        <div style={{
          backgroundColor: 'rgba(0, 0, 0, 0.2)',
          borderRadius: '0.75rem',
          padding: '1.5rem',
          marginBottom: '2rem',
          textAlign: 'center'
        }}>
          <h3 style={{
            color: '#fbbf24',
            fontSize: '1.125rem',
            fontWeight: '600',
            marginBottom: '0.75rem'
          }}>
            Room Code
          </h3>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem',
            flexWrap: 'wrap'
          }}>
            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              fontFamily: 'monospace',
              fontSize: '1.5rem',
              fontWeight: '700',
              color: '#fbbf24',
              letterSpacing: '0.25rem'
            }}>
              {room.code}
            </div>
            <Button
              variant="secondary"
              size="md"
              onClick={copyRoomCode}
              disabled={copied}
              style={{
                backgroundColor: copied ? '#16a34a' : 'rgba(2, 132, 199, 0.9)',
                backdropFilter: 'blur(10px)'
              }}
            >
              {copied ? 'Copied!' : 'Copy Code'}
            </Button>
          </div>
          <p style={{
            color: '#9ca3af',
            fontSize: '0.875rem',
            marginTop: '0.75rem'
          }}>
            Share this code with other players to join the game
          </p>
        </div>

        {/* Player List */}
        <div style={{
          backgroundColor: 'rgba(0, 0, 0, 0.2)',
          borderRadius: '0.75rem',
          padding: '1.5rem',
          marginBottom: '2rem'
        }}>
          <h3 style={{
            color: '#60a5fa',
            fontSize: '1.125rem',
            fontWeight: '600',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <span>👥 Players ({sortedPlayers.length})</span>
          </h3>
          
          <div style={{
            display: 'grid',
            gap: '0.75rem'
          }}>
            {sortedPlayers.map((player, index) => (
              <PlayerCard 
                key={player.id} 
                player={player} 
                isCurrentPlayer={player.id === currentPlayer?.id}
                isHost={isHost}
                onRemovePlayer={showRemovePlayerConfirm}
                position={index + 1}
              />
            ))}
          </div>

          {/* Empty state */}
          {sortedPlayers.length === 0 && (
            <div style={{
              textAlign: 'center',
              padding: '2rem',
              color: '#9ca3af'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👤</div>
              <p>No players have joined yet</p>
            </div>
          )}
        </div>

        {/* Game Settings */}
        <div style={{
          backgroundColor: 'rgba(0, 0, 0, 0.2)',
          borderRadius: '0.75rem',
          padding: '1.5rem',
          marginBottom: '2rem'
        }}>
          <h3 style={{
            color: '#34d399',
            fontSize: '1.125rem',
            fontWeight: '600',
            marginBottom: '1rem'
          }}>
            ⚙️ Game Settings
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem'
          }}>
            <div>
              <span style={{ color: '#9ca3af', fontSize: '0.875rem' }}>Max Players:</span>
              <div style={{ color: 'white', fontWeight: '600' }}>
                {Object.keys(room.players).length} / {room.maxRounds > 10 ? 'Unlimited' : '10+'}
              </div>
            </div>
            <div>
              <span style={{ color: '#9ca3af', fontSize: '0.875rem' }}>Max Rounds:</span>
              <div style={{ color: 'white', fontWeight: '600' }}>
                {room.maxRounds} rounds
              </div>
            </div>
            <div>
              <span style={{ color: '#9ca3af', fontSize: '0.875rem' }}>Game Mode:</span>
              <div style={{ color: 'white', fontWeight: '600' }}>
                {room.isSoloMode ? 'Solo Challenge' : 'Multiplayer'}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          {isHost && (
            <Button
              variant="success"
              size="lg"
              onClick={handleStartGame}
              disabled={isLoading || sortedPlayers.length < 2}
              style={{
                backgroundColor: 'rgba(22, 163, 74, 0.9)',
                backdropFilter: 'blur(10px)',
                minWidth: '150px'
              }}
            >
              {isLoading ? 'Starting...' : 'Start Game'}
            </Button>
          )}
          
          <Button
            variant="secondary"
            size="lg"
            onClick={() => setShowLeaveConfirm(true)}
            style={{
              backgroundColor: 'rgba(107, 114, 128, 0.9)',
              backdropFilter: 'blur(10px)',
              minWidth: '150px'
            }}
          >
            Leave Room
          </Button>
        </div>

        {/* Host Info */}
        {isHost && (
          <div style={{
            textAlign: 'center',
            marginTop: '1.5rem',
            padding: '1rem',
            backgroundColor: 'rgba(251, 191, 36, 0.1)',
            borderRadius: '0.5rem',
            border: '1px solid rgba(251, 191, 36, 0.3)'
          }}>
            <p style={{
              color: '#fbbf24',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}>
              👑 You are the host. You can start the game when ready and remove players if needed.
            </p>
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
            zIndex: 100
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
                Leave Room?
              </h3>
              <p style={{
                color: '#6b7280',
                marginBottom: '1.5rem'
              }}>
                Are you sure you want to leave this room? You'll need a new room code to rejoin.
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
                  onClick={handleLeaveRoom}
                >
                  Leave Room
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Remove Player Confirmation Modal */}
        {showRemoveConfirm.show && (
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
            zIndex: 100
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
                Remove Player?
              </h3>
              <p style={{
                color: '#6b7280',
                marginBottom: '1.5rem'
              }}>
                Are you sure you want to remove <strong>{showRemoveConfirm.playerName}</strong> from the room?
              </p>
              <div style={{
                display: 'flex',
                gap: '1rem',
                justifyContent: 'center'
              }}>
                <Button
                  variant="secondary"
                  onClick={() => setShowRemoveConfirm({ show: false, playerId: '', playerName: '' })}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  onClick={handleRemovePlayer}
                  disabled={isLoading}
                >
                  {isLoading ? 'Removing...' : 'Remove Player'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Player Card Component
interface PlayerCardProps {
  player: Player;
  isCurrentPlayer: boolean;
  isHost: boolean;
  onRemovePlayer: (playerId: string, playerName: string) => void;
  position: number;
}

function PlayerCard({ player, isCurrentPlayer, isHost, onRemovePlayer, position }: PlayerCardProps) {
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
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      padding: '1rem',
      backgroundColor: isCurrentPlayer ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.05)',
      borderRadius: '0.5rem',
      border: isCurrentPlayer ? '2px solid rgba(59, 130, 246, 0.5)' : '1px solid rgba(255, 255, 255, 0.1)',
      position: 'relative'
    }}>
      {/* Position Badge */}
      <div style={{
        width: '2rem',
        height: '2rem',
        borderRadius: '50%',
        backgroundColor: player.isHost ? '#fbbf24' : '#6b7280',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '0.875rem',
        fontWeight: '600',
        color: 'white',
        flexShrink: 0
      }}>
        {player.isHost ? '👑' : position}
      </div>

      {/* Player Info */}
      <div style={{ flex: 1 }}>
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
          {player.isHost && (
            <span style={{
              backgroundColor: '#fbbf24',
              color: 'black',
              fontSize: '0.75rem',
              padding: '0.125rem 0.5rem',
              borderRadius: '0.25rem',
              fontWeight: '500'
            }}>
              Host
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
          <span style={{ color: '#6b7280' }}>•</span>
          <span style={{ color: '#9ca3af' }}>
            Joined {new Date(player.joinedAt).toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* Score (if available) */}
      {player.score !== undefined && (
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          padding: '0.5rem 0.75rem',
          borderRadius: '0.375rem',
          color: 'white',
          fontWeight: '600',
          fontSize: '0.875rem'
        }}>
          {player.score} pts
        </div>
      )}

      {/* Remove Button (host only, not for current player or host) */}
      {isHost && !isCurrentPlayer && !player.isHost && (
        <Button
          variant="danger"
          size="sm"
          onClick={() => onRemovePlayer(player.id, player.name)}
          style={{
            backgroundColor: 'rgba(220, 38, 38, 0.8)',
            padding: '0.25rem 0.5rem',
            fontSize: '0.75rem',
            minWidth: 'auto'
          }}
        >
          Remove
        </Button>
      )}
    </div>
  );
} 