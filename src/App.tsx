import React from 'react';
import { Button, Modal, Lobby } from './components';
import { GameBoard } from './components/GameBoard';
import { GameProvider } from './contexts/GameContext';
import { useGame } from './hooks/useGame';
import { ConnectionStatus } from './components/ConnectionStatus';

function AppContent() {
  const [isJoinModalOpen, setIsJoinModalOpen] = React.useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);
  const [isSoloModalOpen, setIsSoloModalOpen] = React.useState(false);
  
  // Form states
  const [joinForm, setJoinForm] = React.useState({ name: '', roomCode: '' });
  const [createForm, setCreateForm] = React.useState({ 
    name: '', 
    maxPlayers: 4, 
    maxRounds: 5 
  });
  const [soloForm, setSoloForm] = React.useState({ name: '' });
  
  // Form validation states
  const [joinErrors, setJoinErrors] = React.useState<{ name?: string; roomCode?: string }>({});
  const [createErrors, setCreateErrors] = React.useState<{ name?: string }>({});
  const [soloErrors, setSoloErrors] = React.useState<{ name?: string }>({});
  
  // Get game context
  const { 
    createRoom, 
    joinRoom, 
    leaveRoom,
    isLoading, 
    error, 
    clearError,
    room 
  } = useGame();

  // Clear errors when modals close
  React.useEffect(() => {
    if (!isJoinModalOpen) {
      setJoinErrors({});
      setJoinForm({ name: '', roomCode: '' });
    }
    if (!isCreateModalOpen) {
      setCreateErrors({});
      setCreateForm({ name: '', maxPlayers: 4, maxRounds: 5 });
    }
    if (!isSoloModalOpen) {
      setSoloErrors({});
      setSoloForm({ name: '' });
    }
  }, [isJoinModalOpen, isCreateModalOpen, isSoloModalOpen]);

  // Validation functions
  const validateName = (name: string): string | undefined => {
    if (!name.trim()) return 'Name is required';
    if (name.trim().length < 2) return 'Name must be at least 2 characters';
    if (name.trim().length > 20) return 'Name must be less than 20 characters';
    if (!/^[a-zA-Z0-9\s]+$/.test(name.trim())) return 'Name can only contain letters, numbers, and spaces';
    return undefined;
  };

  const validateRoomCode = (roomCode: string): string | undefined => {
    if (!roomCode.trim()) return 'Room code is required';
    if (roomCode.trim().length !== 6) return 'Room code must be 6 characters';
    if (!/^[A-Z0-9]+$/.test(roomCode.trim())) return 'Room code can only contain uppercase letters and numbers';
    return undefined;
  };

  // Handle form submissions
  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    
    const nameError = validateName(joinForm.name);
    const roomCodeError = validateRoomCode(joinForm.roomCode);
    
    if (nameError || roomCodeError) {
      setJoinErrors({ name: nameError, roomCode: roomCodeError });
      return;
    }
    
    try {
      await joinRoom(joinForm.roomCode.trim().toUpperCase(), joinForm.name.trim());
      setIsJoinModalOpen(false);
    } catch {
      // Error is handled by the context
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    
    const nameError = validateName(createForm.name);
    
    if (nameError) {
      setCreateErrors({ name: nameError });
      return;
    }
    
    try {
      await createRoom(createForm.name.trim(), false);
      setIsCreateModalOpen(false);
    } catch {
      // Error is handled by the context
    }
  };

  const handleSoloSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    
    const nameError = validateName(soloForm.name);
    
    if (nameError) {
      setSoloErrors({ name: nameError });
      return;
    }
    
    try {
      await createRoom(soloForm.name.trim(), true);
      setIsSoloModalOpen(false);
    } catch {
      // Error is handled by the context
    }
  };

  // Handle input changes
  const handleJoinInputChange = (field: 'name' | 'roomCode', value: string) => {
    setJoinForm(prev => ({ ...prev, [field]: value }));
    if (joinErrors[field]) {
      setJoinErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleCreateInputChange = (field: 'name' | 'maxPlayers' | 'maxRounds', value: string | number) => {
    setCreateForm(prev => ({ ...prev, [field]: value }));
    if (createErrors[field as keyof typeof createErrors]) {
      setCreateErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSoloInputChange = (value: string) => {
    setSoloForm({ name: value });
    if (soloErrors.name) {
      setSoloErrors({});
    }
  };

  // If we're in a room, show the appropriate view
  if (room) {
    // Show lobby if game is waiting
    if (room.state === 'waiting') {
      return <Lobby onLeaveRoom={leaveRoom} />;
    }
    // Show game board for playing state
    if (room.state === 'playing') {
      return <GameBoard onLeaveGame={leaveRoom} />;
    }
    // For other states, return null (will be handled by game components)
    return null;
  }

  return (
    <div className="animated-bg" style={{
      minHeight: '100vh',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <ConnectionStatus />
      
      {/* Floating Particles */}
      <div className="particles">
        {Array.from({ length: 20 }, (_, i) => (
          <div key={i} className="particle" />
        ))}
      </div>

      {/* Main Content */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Hero Section */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          textAlign: 'center',
          color: 'white'
        }}>
          {/* Game Title */}
          <div style={{
            marginBottom: '2rem',
            animation: 'bounceIn 0.8s ease-out'
          }}>
            <h1 className="game-title" style={{
              fontSize: 'clamp(3rem, 8vw, 5rem)',
              marginBottom: '1rem',
              animation: 'titleGradient 4s ease-in-out infinite, titleGlow 2s ease-in-out infinite alternate'
            }}>
              Flip 7
            </h1>
            <p style={{
              fontSize: 'clamp(1rem, 3vw, 1.25rem)',
              color: '#d1d5db',
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
              maxWidth: '600px',
              margin: '0 auto'
            }}>
              The Ultimate Press-Your-Luck Card Game
            </p>
          </div>

          {/* Error Display */}
          {error && (
            <div style={{
              backgroundColor: 'rgba(220, 38, 38, 0.9)',
              color: 'white',
              padding: '1rem 1.5rem',
              borderRadius: '0.75rem',
              marginBottom: '2rem',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(220, 38, 38, 0.3)',
              maxWidth: '500px',
              width: '100%'
            }}>
              {error}
            </div>
          )}
          
          {/* Action Buttons */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            alignItems: 'center',
            marginBottom: '3rem',
            width: '100%',
            maxWidth: '400px'
          }}>
            <Button 
              variant="primary" 
              size="lg"
              onClick={() => setIsCreateModalOpen(true)}
              disabled={isLoading}
              style={{ 
                width: '100%',
                maxWidth: '300px',
                boxShadow: '0 8px 25px rgba(220, 38, 38, 0.3)',
                backdropFilter: 'blur(10px)',
                backgroundColor: 'rgba(220, 38, 38, 0.9)',
                border: '1px solid rgba(220, 38, 38, 0.3)',
                transition: 'all 0.3s ease'
              }}
            >
              {isLoading ? 'Creating...' : 'Create Room'}
            </Button>
            
            <Button 
              variant="secondary" 
              size="lg"
              onClick={() => setIsJoinModalOpen(true)}
              disabled={isLoading}
              style={{ 
                width: '100%',
                maxWidth: '300px',
                boxShadow: '0 8px 25px rgba(2, 132, 199, 0.3)',
                backdropFilter: 'blur(10px)',
                backgroundColor: 'rgba(2, 132, 199, 0.9)',
                border: '1px solid rgba(2, 132, 199, 0.3)',
                transition: 'all 0.3s ease'
              }}
            >
              {isLoading ? 'Joining...' : 'Join Game'}
            </Button>
            
            <Button 
              variant="success" 
              size="lg"
              onClick={() => setIsSoloModalOpen(true)}
              disabled={isLoading}
              style={{ 
                width: '100%',
                maxWidth: '300px',
                boxShadow: '0 8px 25px rgba(22, 163, 74, 0.3)',
                backdropFilter: 'blur(10px)',
                backgroundColor: 'rgba(22, 163, 74, 0.9)',
                border: '1px solid rgba(22, 163, 74, 0.3)',
                transition: 'all 0.3s ease'
              }}
            >
              {isLoading ? 'Starting...' : 'Solo Mode'}
            </Button>
          </div>
        </div>

        {/* How to Play Section */}
        <div style={{
          padding: '2rem',
          backgroundColor: 'rgba(0, 0, 0, 0.2)',
          backdropFilter: 'blur(20px)',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <div style={{
            maxWidth: '1200px',
            margin: '0 auto'
          }}>
            <h2 style={{
              fontSize: 'clamp(1.5rem, 4vw, 2rem)',
              fontWeight: '700',
              textAlign: 'center',
              marginBottom: '2rem',
              color: '#fbbf24',
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
            }}>
              How to Play
            </h2>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '1.5rem'
            }}>
              {/* Goal Card */}
              <div style={{
                backgroundColor: 'rgba(52, 211, 153, 0.1)',
                borderRadius: '1rem',
                padding: '1.5rem',
                border: '1px solid rgba(52, 211, 153, 0.3)',
                backdropFilter: 'blur(10px)',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = '0 10px 30px rgba(52, 211, 153, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginBottom: '1rem'
                }}>
                  <div style={{
                    fontSize: '2rem',
                    marginRight: '0.75rem'
                  }}>
                    🎯
                  </div>
                  <h3 style={{
                    color: '#34d399',
                    fontWeight: '600',
                    fontSize: '1.125rem',
                    margin: 0
                  }}>
                    Goal
                  </h3>
                </div>
                <p style={{
                  color: '#d1d5db',
                  lineHeight: '1.6',
                  margin: 0,
                  fontSize: '0.95rem'
                }}>
                  Get as close to 7 as possible without going over. Flip a 7 for an instant win and a +15 point bonus!
                </p>
              </div>

              {/* Cards Card */}
              <div style={{
                backgroundColor: 'rgba(96, 165, 250, 0.1)',
                borderRadius: '1rem',
                padding: '1.5rem',
                border: '1px solid rgba(96, 165, 250, 0.3)',
                backdropFilter: 'blur(10px)',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = '0 10px 30px rgba(96, 165, 250, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginBottom: '1rem'
                }}>
                  <div style={{
                    fontSize: '2rem',
                    marginRight: '0.75rem'
                  }}>
                    🃏
                  </div>
                  <h3 style={{
                    color: '#60a5fa',
                    fontWeight: '600',
                    fontSize: '1.125rem',
                    margin: 0
                  }}>
                    Cards
                  </h3>
                </div>
                <p style={{
                  color: '#d1d5db',
                  lineHeight: '1.6',
                  margin: 0,
                  fontSize: '0.95rem'
                }}>
                  Number cards (0-12), Action cards (Freeze, Flip Three, Second Chance), and Modifier cards (x2, +2, etc.)
                </p>
              </div>

              {/* Actions Card */}
              <div style={{
                backgroundColor: 'rgba(244, 114, 182, 0.1)',
                borderRadius: '1rem',
                padding: '1.5rem',
                border: '1px solid rgba(244, 114, 182, 0.3)',
                backdropFilter: 'blur(10px)',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = '0 10px 30px rgba(244, 114, 182, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginBottom: '1rem'
                }}>
                  <div style={{
                    fontSize: '2rem',
                    marginRight: '0.75rem'
                  }}>
                    ⚡
                  </div>
                  <h3 style={{
                    color: '#f472b6',
                    fontWeight: '600',
                    fontSize: '1.125rem',
                    margin: 0
                  }}>
                    Actions
                  </h3>
                </div>
                <p style={{
                  color: '#d1d5db',
                  lineHeight: '1.6',
                  margin: 0,
                  fontSize: '0.95rem'
                }}>
                  Choose to Hit (draw a card) or Stay (keep your current score) on your turn. Action cards trigger special effects!
                </p>
              </div>

              {/* Scoring Card */}
              <div style={{
                backgroundColor: 'rgba(167, 139, 250, 0.1)',
                borderRadius: '1rem',
                padding: '1.5rem',
                border: '1px solid rgba(167, 139, 250, 0.3)',
                backdropFilter: 'blur(10px)',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = '0 10px 30px rgba(167, 139, 250, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginBottom: '1rem'
                }}>
                  <div style={{
                    fontSize: '2rem',
                    marginRight: '0.75rem'
                  }}>
                    🏆
                  </div>
                  <h3 style={{
                    color: '#a78bfa',
                    fontWeight: '600',
                    fontSize: '1.125rem',
                    margin: 0
                  }}>
                    Scoring
                  </h3>
                </div>
                <p style={{
                  color: '#d1d5db',
                  lineHeight: '1.6',
                  margin: 0,
                  fontSize: '0.95rem'
                }}>
                  Sum your number cards, apply modifiers, and get +15 bonus for Flip 7! Highest score wins the round.
                </p>
              </div>
            </div>

            {/* Quick Start Guide */}
            <div style={{
              marginTop: '2rem',
              padding: '1.5rem',
              backgroundColor: 'rgba(251, 191, 36, 0.1)',
              borderRadius: '1rem',
              border: '1px solid rgba(251, 191, 36, 0.3)',
              textAlign: 'center'
            }}>
              <h3 style={{
                color: '#fbbf24',
                fontWeight: '600',
                fontSize: '1.125rem',
                marginBottom: '0.75rem'
              }}>
                🚀 Quick Start
              </h3>
              <p style={{
                color: '#d1d5db',
                fontSize: '0.95rem',
                lineHeight: '1.6',
                margin: 0
              }}>
                Create a room to play with friends, join an existing game with a room code, or challenge yourself in Solo Mode!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Join Game Modal */}
      <Modal
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
        title="Join Game"
      >
        <form onSubmit={handleJoinSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '0.5rem'
            }}>
              Your Name *
            </label>
            <input
              type="text"
              value={joinForm.name}
              onChange={(e) => handleJoinInputChange('name', e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                border: `1px solid ${joinErrors.name ? '#dc2626' : '#d1d5db'}`,
                borderRadius: '0.375rem',
                outline: 'none',
                backgroundColor: joinErrors.name ? '#fef2f2' : 'white'
              }}
              placeholder="Enter your name"
              disabled={isLoading}
            />
            {joinErrors.name && (
              <p style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                {joinErrors.name}
              </p>
            )}
          </div>
          
          <div>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '0.5rem'
            }}>
              Room Code *
            </label>
            <input
              type="text"
              value={joinForm.roomCode}
              onChange={(e) => handleJoinInputChange('roomCode', e.target.value.toUpperCase())}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                border: `1px solid ${joinErrors.roomCode ? '#dc2626' : '#d1d5db'}`,
                borderRadius: '0.375rem',
                outline: 'none',
                backgroundColor: joinErrors.roomCode ? '#fef2f2' : 'white',
                textTransform: 'uppercase'
              }}
              placeholder="Enter 6-character room code"
              maxLength={6}
              disabled={isLoading}
            />
            {joinErrors.roomCode && (
              <p style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                {joinErrors.roomCode}
              </p>
            )}
          </div>
          
          <div style={{ display: 'flex', gap: '0.5rem', paddingTop: '1rem' }}>
            <Button
              variant="primary"
              type="submit"
              disabled={isLoading}
              style={{ flex: 1 }}
            >
              {isLoading ? 'Joining...' : 'Join'}
            </Button>
            <Button
              variant="secondary"
              onClick={() => setIsJoinModalOpen(false)}
              disabled={isLoading}
              style={{ flex: 1 }}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      {/* Create Room Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Room"
      >
        <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '0.5rem'
            }}>
              Your Name *
            </label>
            <input
              type="text"
              value={createForm.name}
              onChange={(e) => handleCreateInputChange('name', e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                border: `1px solid ${createErrors.name ? '#dc2626' : '#d1d5db'}`,
                borderRadius: '0.375rem',
                outline: 'none',
                backgroundColor: createErrors.name ? '#fef2f2' : 'white'
              }}
              placeholder="Enter your name"
              disabled={isLoading}
            />
            {createErrors.name && (
              <p style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                {createErrors.name}
              </p>
            )}
          </div>
          
          <div>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '0.5rem'
            }}>
              Max Players
            </label>
            <select
              value={createForm.maxPlayers}
              onChange={(e) => handleCreateInputChange('maxPlayers', parseInt(e.target.value))}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                outline: 'none',
                backgroundColor: 'white'
              }}
              disabled={isLoading}
            >
              <option value="2">2 Players</option>
              <option value="3">3 Players</option>
              <option value="4">4 Players</option>
              <option value="5">5 Players</option>
              <option value="6">6 Players</option>
              <option value="7">7 Players</option>
              <option value="8">8 Players</option>
              <option value="9">9 Players</option>
              <option value="10">10 Players</option>
              <option value="11">11 Players</option>
              <option value="12">12 Players</option>
              <option value="13">13 Players</option>
            </select>
          </div>

          <div>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '0.5rem'
            }}>
              Max Rounds
            </label>
            <select
              value={createForm.maxRounds}
              onChange={(e) => handleCreateInputChange('maxRounds', parseInt(e.target.value))}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                outline: 'none',
                backgroundColor: 'white'
              }}
              disabled={isLoading}
            >
              <option value="3">3 Rounds</option>
              <option value="5">5 Rounds</option>
              <option value="7">7 Rounds</option>
              <option value="10">10 Rounds</option>
            </select>
          </div>
          
          <div style={{ display: 'flex', gap: '0.5rem', paddingTop: '1rem' }}>
            <Button
              variant="primary"
              type="submit"
              disabled={isLoading}
              style={{ flex: 1 }}
            >
              {isLoading ? 'Creating...' : 'Create Room'}
            </Button>
            <Button
              variant="secondary"
              onClick={() => setIsCreateModalOpen(false)}
              disabled={isLoading}
              style={{ flex: 1 }}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      {/* Solo Mode Modal */}
      <Modal
        isOpen={isSoloModalOpen}
        onClose={() => setIsSoloModalOpen(false)}
        title="Start Solo Game"
      >
        <form onSubmit={handleSoloSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{
            backgroundColor: '#f0f9ff',
            padding: '1rem',
            borderRadius: '0.5rem',
            border: '1px solid #bae6fd',
            marginBottom: '1rem'
          }}>
            <h4 style={{ color: '#0369a1', fontWeight: '600', marginBottom: '0.5rem' }}>
              🎯 Solo Challenge Mode
            </h4>
            <p style={{ fontSize: '0.875rem', color: '#0c4a6e', lineHeight: '1.5' }}>
              Challenge yourself to reach 200+ points in 5 rounds against AI opponents. 
              Perfect your strategy and beat your high score!
            </p>
          </div>
          
          <div>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '0.5rem'
            }}>
              Your Name *
            </label>
            <input
              type="text"
              value={soloForm.name}
              onChange={(e) => handleSoloInputChange(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                border: `1px solid ${soloErrors.name ? '#dc2626' : '#d1d5db'}`,
                borderRadius: '0.375rem',
                outline: 'none',
                backgroundColor: soloErrors.name ? '#fef2f2' : 'white'
              }}
              placeholder="Enter your name"
              disabled={isLoading}
            />
            {soloErrors.name && (
              <p style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                {soloErrors.name}
              </p>
            )}
          </div>
          
          <div style={{ display: 'flex', gap: '0.5rem', paddingTop: '1rem' }}>
            <Button
              variant="success"
              type="submit"
              disabled={isLoading}
              style={{ flex: 1 }}
            >
              {isLoading ? 'Starting...' : 'Start Solo Game'}
            </Button>
            <Button
              variant="secondary"
              onClick={() => setIsSoloModalOpen(false)}
              disabled={isLoading}
              style={{ flex: 1 }}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function App() {
  return (
    <GameProvider>
      <AppContent />
    </GameProvider>
  );
}

export default App;
