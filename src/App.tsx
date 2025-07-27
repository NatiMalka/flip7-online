import React from 'react';
import { Button, Modal } from './components';

function App() {
  const [isJoinModalOpen, setIsJoinModalOpen] = React.useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);

  return (
    <div className="animated-bg" style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative'
    }}>
      {/* Floating Particles */}
      <div className="particles">
        {Array.from({ length: 20 }, (_, i) => (
          <div key={i} className="particle" />
        ))}
      </div>

      <div style={{ textAlign: 'center', color: 'white', position: 'relative', zIndex: 1 }}>
        <h1 className="game-title" style={{
          fontSize: '4.5rem',
          marginBottom: '1rem',
          animation: 'bounceIn 0.6s ease-out, titleGradient 4s ease-in-out infinite, titleGlow 2s ease-in-out infinite alternate'
        }}>
          Flip 7
        </h1>
        <p style={{
          fontSize: '1.25rem',
          marginBottom: '2rem',
          color: '#d1d5db',
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
        }}>
          The Ultimate Press-Your-Luck Card Game
        </p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
          <Button 
            variant="primary" 
            size="lg"
            onClick={() => setIsCreateModalOpen(true)}
            style={{ 
              width: '200px',
              boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)',
              backdropFilter: 'blur(10px)',
              backgroundColor: 'rgba(220, 38, 38, 0.9)'
            }}
          >
            Create Room
          </Button>
          
          <Button 
            variant="secondary" 
            size="lg"
            onClick={() => setIsJoinModalOpen(true)}
            style={{ 
              width: '200px',
              boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)',
              backdropFilter: 'blur(10px)',
              backgroundColor: 'rgba(2, 132, 199, 0.9)'
            }}
          >
            Join Game
          </Button>
          
          <Button 
            variant="success" 
            size="lg"
            onClick={() => console.log('Solo mode clicked')}
            style={{ 
              width: '200px',
              boxShadow: '0 4px 12px rgba(22, 163, 74, 0.3)',
              backdropFilter: 'blur(10px)',
              backgroundColor: 'rgba(22, 163, 74, 0.9)'
            }}
          >
            Solo Mode
          </Button>
        </div>
      </div>

      {/* Join Game Modal */}
      <Modal
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
        title="Join Game"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '0.5rem'
            }}>
              Your Name
            </label>
            <input
              type="text"
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                outline: 'none'
              }}
              placeholder="Enter your name"
            />
          </div>
          
          <div>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '0.5rem'
            }}>
              Room Code
            </label>
            <input
              type="text"
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                outline: 'none'
              }}
              placeholder="Enter room code"
            />
          </div>
          
          <div style={{ display: 'flex', gap: '0.5rem', paddingTop: '1rem' }}>
            <Button
              variant="primary"
              onClick={() => console.log('Join clicked')}
              style={{ flex: 1 }}
            >
              Join
            </Button>
            <Button
              variant="secondary"
              onClick={() => setIsJoinModalOpen(false)}
              style={{ flex: 1 }}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Create Room Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Room"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '0.5rem'
            }}>
              Your Name
            </label>
            <input
              type="text"
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                outline: 'none'
              }}
              placeholder="Enter your name"
            />
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
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                outline: 'none',
                backgroundColor: 'white'
              }}
            >
              <option value="2">2 Players</option>
              <option value="3">3 Players</option>
              <option value="4" selected>4 Players</option>
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
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                outline: 'none',
                backgroundColor: 'white'
              }}
            >
              <option value="3">3 Rounds</option>
              <option value="5" selected>5 Rounds</option>
              <option value="7">7 Rounds</option>
              <option value="10">10 Rounds</option>
            </select>
          </div>
          
          <div style={{ display: 'flex', gap: '0.5rem', paddingTop: '1rem' }}>
            <Button
              variant="primary"
              onClick={() => console.log('Create room clicked')}
              style={{ flex: 1 }}
            >
              Create Room
            </Button>
            <Button
              variant="secondary"
              onClick={() => setIsCreateModalOpen(false)}
              style={{ flex: 1 }}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default App;
