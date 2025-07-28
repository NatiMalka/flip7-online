import React, { useState } from 'react';
import { Card, CardDeck, CardHand, CardPile } from './index';
import type { Card as CardType } from '../types';

const CardDemo: React.FC = () => {
  const [selectedCard, setSelectedCard] = useState<CardType | null>(null);
  const [isShuffling, setIsShuffling] = useState(false);

  // Sample cards for demonstration
  const sampleCards: CardType[] = [
    { id: '1', type: 'number', value: 7, isFlipped: false, isVisible: true },
    { id: '2', type: 'number', value: 3, isFlipped: false, isVisible: true },
    { id: '3', type: 'action', action: 'freeze', isFlipped: false, isVisible: true },
    { id: '4', type: 'action', action: 'flipThree', isFlipped: false, isVisible: true },
    { id: '5', type: 'action', action: 'secondChance', isFlipped: false, isVisible: true },
    { id: '6', type: 'modifier', modifier: 'plus4', isFlipped: false, isVisible: true },
    { id: '7', type: 'modifier', modifier: 'x2', isFlipped: false, isVisible: true },
    { id: '8', type: 'number', value: 0, isFlipped: false, isVisible: true },
  ];

  const deckCards = Array.from({ length: 52 }, (_, i) => ({
    id: `deck-${i}`,
    type: 'number' as const,
    value: 0,
    isFlipped: false,
    isVisible: false,
  }));

  const handleCardClick = (card: CardType) => {
    setSelectedCard(card);
  };

  const handleShuffle = () => {
    setIsShuffling(true);
    setTimeout(() => setIsShuffling(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-white text-center mb-8 game-title">
          Card Visual Components Demo
        </h1>

        {/* Individual Cards Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-white mb-6">Individual Cards</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            {sampleCards.map((card) => (
              <div key={card.id} className="flex flex-col items-center">
                <Card
                  card={card}
                  onClick={() => handleCardClick(card)}
                  isHighlighted={selectedCard?.id === card.id}
                />
                <p className="text-white text-xs mt-2 text-center">
                  {card.type === 'number' ? `Number ${card.value}` :
                   card.type === 'action' ? card.action :
                   card.modifier}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Card Sizes Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-white mb-6">Card Sizes</h2>
          <div className="flex items-center justify-center gap-8">
            <div className="flex flex-col items-center">
              <Card card={sampleCards[0]} size="sm" />
              <p className="text-white text-xs mt-2">Small</p>
            </div>
            <div className="flex flex-col items-center">
              <Card card={sampleCards[0]} size="md" />
              <p className="text-white text-xs mt-2">Medium</p>
            </div>
            <div className="flex flex-col items-center">
              <Card card={sampleCards[0]} size="lg" />
              <p className="text-white text-xs mt-2">Large</p>
            </div>
          </div>
        </section>

        {/* Card Deck Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-white mb-6">Card Deck</h2>
          <div className="flex items-center justify-center gap-8">
            <div className="flex flex-col items-center">
              <CardDeck
                cards={deckCards}
                onClick={handleShuffle}
                isShuffling={isShuffling}
              />
              <p className="text-white text-xs mt-2">Click to shuffle</p>
            </div>
            <div className="flex flex-col items-center">
              <CardDeck
                cards={deckCards.slice(0, 10)}
                showCount={true}
              />
              <p className="text-white text-xs mt-2">Small deck</p>
            </div>
          </div>
        </section>

        {/* Card Hand Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-white mb-6">Card Hand</h2>
          <div className="space-y-8">
            <div className="flex flex-col items-center">
              <CardHand
                cards={sampleCards}
                isPlayerTurn={true}
                isActive={true}
                onCardClick={handleCardClick}
              />
              <p className="text-white text-xs mt-2">Player's turn (active)</p>
            </div>
            <div className="flex flex-col items-center">
              <CardHand
                cards={sampleCards.slice(0, 5)}
                isPlayerTurn={false}
                isActive={true}
                onCardClick={handleCardClick}
              />
              <p className="text-white text-xs mt-2">Other player (active)</p>
            </div>
            <div className="flex flex-col items-center">
              <CardHand
                cards={sampleCards.slice(0, 3)}
                isPlayerTurn={false}
                isActive={false}
                onCardClick={handleCardClick}
              />
              <p className="text-white text-xs mt-2">Inactive player</p>
            </div>
          </div>
        </section>

        {/* Card Pile Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-white mb-6">Card Pile (Discard)</h2>
          <div className="flex items-center justify-center gap-8">
            <div className="flex flex-col items-center">
              <CardPile
                cards={sampleCards.slice(0, 1)}
                onClick={() => console.log('Single card pile clicked')}
              />
              <p className="text-white text-xs mt-2">Single card</p>
            </div>
            <div className="flex flex-col items-center">
              <CardPile
                cards={sampleCards.slice(0, 3)}
                onClick={() => console.log('Multi-card pile clicked')}
              />
              <p className="text-white text-xs mt-2">Multiple cards</p>
            </div>
            <div className="flex flex-col items-center">
              <CardPile
                cards={sampleCards}
                isHighlighted={true}
                onClick={() => console.log('Highlighted pile clicked')}
              />
              <p className="text-white text-xs mt-2">Highlighted</p>
            </div>
          </div>
        </section>

        {/* Card Backs Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-white mb-6">Card Backs</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            {sampleCards.slice(0, 4).map((card) => (
              <div key={card.id} className="flex flex-col items-center">
                <Card
                  card={card}
                  showBack={true}
                  onClick={() => handleCardClick(card)}
                />
                <p className="text-white text-xs mt-2 text-center">Card Back</p>
              </div>
            ))}
          </div>
        </section>

        {/* Selected Card Info */}
        {selectedCard && (
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-white mb-6">Selected Card</h2>
            <div className="flex items-center justify-center gap-8">
              <Card
                card={selectedCard}
                size="lg"
                isHighlighted={true}
              />
              <div className="text-white">
                <p><strong>Type:</strong> {selectedCard.type}</p>
                {selectedCard.type === 'number' && <p><strong>Value:</strong> {selectedCard.value}</p>}
                {selectedCard.type === 'action' && <p><strong>Action:</strong> {selectedCard.action}</p>}
                {selectedCard.type === 'modifier' && <p><strong>Modifier:</strong> {selectedCard.modifier}</p>}
                <p><strong>ID:</strong> {selectedCard.id}</p>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default CardDemo; 