import React, { useState, useEffect } from 'react';
import { 
  TurnTimer, 
  TurnIndicator, 
  GameActionButtons, 
  Card, 
  CardDeck, 
  CardHand,
  Button 
} from './index';
import type { Player, Card as CardType } from '../types';

interface TurnBasedGameDemoProps {
  className?: string;
}

export const TurnBasedGameDemo: React.FC<TurnBasedGameDemoProps> = ({ className = '' }) => {
  // Demo state
  const [currentTurn, setCurrentTurn] = useState<string>('player1');
  const [turnOrder] = useState<string[]>(['player1', 'player2', 'player3']);
  const [isMyTurn, setIsMyTurn] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState(30000);
  const [isLoading, setIsLoading] = useState(false);
  const [lastAction, setLastAction] = useState<string | null>(null);

  // Demo players
  const [players] = useState<Player[]>([
    {
      id: 'player1',
      name: 'Alice',
      hand: [
        { id: '1', type: 'number', value: 7, isFlipped: false, isVisible: true },
        { id: '2', type: 'action', action: 'freeze', isFlipped: false, isVisible: true },
      ],
      score: 45,
      status: 'active',
      history: [],
      joinedAt: new Date(),
      isHost: true,
      hasFlip7: false,
      isConnected: true,
      lastSeen: new Date(),
    },
    {
      id: 'player2',
      name: 'Bob',
      hand: [
        { id: '3', type: 'number', value: 3, isFlipped: false, isVisible: false },
        { id: '4', type: 'number', value: 8, isFlipped: false, isVisible: false },
      ],
      score: 32,
      status: 'active',
      history: [],
      joinedAt: new Date(),
      isHost: false,
      hasFlip7: false,
      isConnected: true,
      lastSeen: new Date(),
    },
    {
      id: 'player3',
      name: 'Charlie',
      hand: [
        { id: '5', type: 'modifier', modifier: 'plus4', isFlipped: false, isVisible: false },
      ],
      score: 28,
      status: 'stayed',
      history: [],
      joinedAt: new Date(),
      isHost: false,
      hasFlip7: false,
      isConnected: true,
      lastSeen: new Date(),
    },
  ]);

  // Demo deck
  const [deckCards] = useState<CardType[]>(
    Array.from({ length: 52 }, (_, i) => ({
      id: `deck-${i}`,
      type: 'number',
      value: 0,
      isFlipped: false,
      isVisible: false,
    }))
  );

  // Timer effect
  useEffect(() => {
    if (!isMyTurn) return;

    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 0) {
          handleTimeout();
          return 30000; // Reset timer
        }
        return prev - 100;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isMyTurn]);

  // Handle timeout
  const handleTimeout = () => {
    setLastAction('Timeout - Auto Stay');
    setIsMyTurn(false);
    // Move to next turn
    const currentIndex = turnOrder.indexOf(currentTurn);
    const nextIndex = (currentIndex + 1) % turnOrder.length;
    setCurrentTurn(turnOrder[nextIndex]);
    setTimeRemaining(30000);
    setIsMyTurn(true);
  };

  // Handle hit action
  const handleHit = async () => {
    setIsLoading(true);
    setLastAction('Hit - Drawing card...');
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setIsLoading(false);
    setLastAction('Hit - Drew a card');
    
    // Move to next turn
    const currentIndex = turnOrder.indexOf(currentTurn);
    const nextIndex = (currentIndex + 1) % turnOrder.length;
    setCurrentTurn(turnOrder[nextIndex]);
    setTimeRemaining(30000);
    setIsMyTurn(true);
  };

  // Handle stay action
  const handleStay = async () => {
    setIsLoading(true);
    setLastAction('Stay - Keeping current hand...');
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setIsLoading(false);
    setLastAction('Stay - Hand locked');
    
    // Move to next turn
    const currentIndex = turnOrder.indexOf(currentTurn);
    const nextIndex = (currentIndex + 1) % turnOrder.length;
    setCurrentTurn(turnOrder[nextIndex]);
    setTimeRemaining(30000);
    setIsMyTurn(true);
  };

  // Reset demo
  const resetDemo = () => {
    setCurrentTurn('player1');
    setTimeRemaining(30000);
    setIsMyTurn(true);
    setLastAction(null);
  };

  return (
    <div className={`turn-based-game-demo ${className}`}>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">
              Turn-Based Gameplay Demo
            </h1>
            <p className="text-gray-300 text-lg">
              Phase 4 Task 4.1: Turn-Based Gameplay Implementation
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Turn System */}
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-white mb-4">Turn System</h2>
              
              {/* Turn Indicator */}
              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-3">Turn Indicator</h3>
                <TurnIndicator
                  players={players}
                  currentTurn={currentTurn}
                  turnOrder={turnOrder}
                  isMyTurn={isMyTurn}
                />
              </div>

              {/* Turn Timer */}
              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-3">Turn Timer</h3>
                <TurnTimer
                  timeRemaining={timeRemaining}
                  totalTime={30000}
                  isActive={isMyTurn}
                  playerName={players.find(p => p.id === currentTurn)?.name || 'Unknown'}
                  onTimeout={handleTimeout}
                />
              </div>

              {/* Game Action Buttons */}
              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-3">Game Actions</h3>
                <GameActionButtons
                  canHit={isMyTurn && players.find(p => p.id === currentTurn)?.status === 'active'}
                  canStay={isMyTurn && players.find(p => p.id === currentTurn)?.status === 'active'}
                  isMyTurn={isMyTurn}
                  isLoading={isLoading}
                  onHit={handleHit}
                  onStay={handleStay}
                  timeRemaining={timeRemaining}
                  totalTime={30000}
                />
              </div>

              {/* Demo Controls */}
              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-3">Demo Controls</h3>
                <div className="space-y-2">
                  <Button
                    variant="primary"
                    onClick={() => setIsMyTurn(!isMyTurn)}
                    className="w-full"
                  >
                    Toggle My Turn
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={resetDemo}
                    className="w-full"
                  >
                    Reset Demo
                  </Button>
                </div>
              </div>
            </div>

            {/* Center Column - Game Board */}
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-white mb-4">Game Board</h2>
              
              {/* Deck Area */}
              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-3">Deck & Discard</h3>
                <div className="flex justify-center gap-4">
                  <div className="text-center">
                    <CardDeck cards={deckCards} showCount={true} />
                    <p className="text-white text-sm mt-2">Deck</p>
                  </div>
                  <div className="text-center">
                    <div className="w-20 h-28 bg-gray-600 rounded-lg border-2 border-gray-500 flex items-center justify-center">
                      <span className="text-gray-400 text-2xl">🗑️</span>
                    </div>
                    <p className="text-white text-sm mt-2">Discard (0)</p>
                  </div>
                </div>
              </div>

              {/* Current Player Hand */}
              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-3">
                  {players.find(p => p.id === currentTurn)?.name}'s Hand
                </h3>
                <CardHand
                  cards={players.find(p => p.id === currentTurn)?.hand || []}
                  isPlayerTurn={true}
                  maxVisibleCards={5}
                />
              </div>

              {/* Last Action Display */}
              {lastAction && (
                <div className="bg-gray-800 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white mb-3">Last Action</h3>
                  <div className="bg-blue-600 rounded-lg p-3 text-white text-center">
                    {lastAction}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Player Status */}
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-white mb-4">Player Status</h2>
              
              {players.map((player) => (
                <div key={player.id} className="bg-gray-800 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-white">{player.name}</h3>
                    <div className="flex items-center gap-2">
                      {player.id === currentTurn && (
                        <span className="bg-green-500 text-white px-2 py-1 rounded-full text-xs">
                          TURN
                        </span>
                      )}
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        player.status === 'active' ? 'bg-green-500 text-white' :
                        player.status === 'stayed' ? 'bg-yellow-500 text-black' :
                        'bg-red-500 text-white'
                      }`}>
                        {player.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div className="text-center">
                      <div className="text-gray-400 text-sm">Score</div>
                      <div className="text-white font-bold">{player.score}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-gray-400 text-sm">Cards</div>
                      <div className="text-white font-bold">{player.hand.length}</div>
                    </div>
                  </div>

                  {/* Player Hand Preview */}
                  <div className="space-y-2">
                    <div className="text-gray-400 text-sm">Hand Preview</div>
                    <div className="flex gap-1">
                      {player.hand.slice(0, 3).map((card, index) => (
                        <div key={index} className="w-8 h-12 bg-gray-600 rounded border border-gray-500 flex items-center justify-center">
                          <span className="text-gray-400 text-xs">?</span>
                        </div>
                      ))}
                      {player.hand.length > 3 && (
                        <div className="w-8 h-12 bg-gray-600 rounded border border-gray-500 flex items-center justify-center">
                          <span className="text-gray-400 text-xs">+{player.hand.length - 3}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Features List */}
          <div className="mt-12 bg-gray-800 rounded-lg p-6">
            <h2 className="text-2xl font-semibold text-white mb-4">Implemented Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-green-600/20 border border-green-500/30 rounded-lg p-4">
                <h3 className="text-green-400 font-semibold mb-2">✅ Turn Order System</h3>
                <p className="text-gray-300 text-sm">Circular turn order with active player tracking</p>
              </div>
              <div className="bg-green-600/20 border border-green-500/30 rounded-lg p-4">
                <h3 className="text-green-400 font-semibold mb-2">✅ Hit/Stay Buttons</h3>
                <p className="text-gray-300 text-sm">Enhanced action buttons with visual feedback</p>
              </div>
              <div className="bg-green-600/20 border border-green-500/30 rounded-lg p-4">
                <h3 className="text-green-400 font-semibold mb-2">✅ Turn Timer</h3>
                <p className="text-gray-300 text-sm">30-second countdown with urgency indicators</p>
              </div>
              <div className="bg-green-600/20 border border-green-500/30 rounded-lg p-4">
                <h3 className="text-green-400 font-semibold mb-2">✅ Player Status Updates</h3>
                <p className="text-gray-300 text-sm">Active, stayed, busted status tracking</p>
              </div>
              <div className="bg-green-600/20 border border-green-500/30 rounded-lg p-4">
                <h3 className="text-green-400 font-semibold mb-2">✅ Turn Indicator</h3>
                <p className="text-gray-300 text-sm">Visual turn order and next player preview</p>
              </div>
              <div className="bg-green-600/20 border border-green-500/30 rounded-lg p-4">
                <h3 className="text-green-400 font-semibold mb-2">✅ Round Progression</h3>
                <p className="text-gray-300 text-sm">Automatic turn advancement and round ending</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TurnBasedGameDemo; 