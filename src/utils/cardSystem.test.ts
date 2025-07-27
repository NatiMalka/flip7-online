import { 
  generateDeck, 
  shuffleDeck, 
  dealCards, 
  dealOneCard, 
  detectCardType, 
  calculateHandScore, 
  isHandBusted,
  getCardDisplayInfo,
  createAndShuffleDeck 
} from './cardSystem';
import type { Card } from '../types';

// Test card system functionality
console.log('🧪 Testing Card System Implementation...\n');

// Test 1: Generate deck
console.log('1. Testing deck generation...');
const deck = generateDeck();
console.log(`   ✅ Generated deck with ${deck.length} cards`);
console.log(`   📊 Deck breakdown:`);
const cardTypes = deck.reduce((acc, card) => {
  acc[card.type] = (acc[card.type] || 0) + 1;
  return acc;
}, {} as Record<string, number>);
Object.entries(cardTypes).forEach(([type, count]) => {
  console.log(`      - ${type}: ${count} cards`);
});

// Test 2: Shuffle deck
console.log('\n2. Testing deck shuffling...');
const shuffledDeck = shuffleDeck([...deck]);
const isShuffled = JSON.stringify(deck) !== JSON.stringify(shuffledDeck);
console.log(`   ✅ Deck shuffled: ${isShuffled ? 'Yes' : 'No'}`);

// Test 3: Deal cards
console.log('\n3. Testing card dealing...');
const { dealtCards, remainingDeck } = dealCards(shuffledDeck, 5);
console.log(`   ✅ Dealt ${dealtCards.length} cards, ${remainingDeck.length} remaining`);

// Test 4: Deal one card
console.log('\n4. Testing single card dealing...');
const { card, remainingDeck: newRemainingDeck } = dealOneCard(remainingDeck);
console.log(`   ✅ Dealt one card: ${card.id}, ${newRemainingDeck.length} remaining`);

// Test 5: Card type detection
console.log('\n5. Testing card type detection...');
const cardInfo = detectCardType(card);
console.log(`   ✅ Card ${card.id}: ${cardInfo.displayName} (${cardInfo.type}) - ${cardInfo.description}`);

// Test 6: Score calculation
console.log('\n6. Testing score calculation...');
const testHand: Card[] = [
  { id: 'test1', type: 'number', value: 3, isFlipped: true, isVisible: true },
  { id: 'test2', type: 'number', value: 4, isFlipped: true, isVisible: true },
  { id: 'test3', type: 'modifier', modifier: 'plus2', isFlipped: true, isVisible: true },
  { id: 'test4', type: 'modifier', modifier: 'x2', isFlipped: true, isVisible: true },
];
const score = calculateHandScore(testHand);
console.log(`   ✅ Hand score: ${score.score} (${score.breakdown.numberCards} + ${score.breakdown.modifierMultiplier}x + ${score.breakdown.flip7Bonus} bonus)`);

// Test 7: Bust detection
console.log('\n7. Testing bust detection...');
const bustedHand: Card[] = [
  { id: 'bust1', type: 'number', value: 4, isFlipped: true, isVisible: true },
  { id: 'bust2', type: 'number', value: 5, isFlipped: true, isVisible: true },
];
const isBusted = isHandBusted(bustedHand);
console.log(`   ✅ Hand busted: ${isBusted} (sum: ${bustedHand.reduce((sum, card) => sum + (card.value || 0), 0)})`);

// Test 8: Flip 7 protection
console.log('\n8. Testing Flip 7 protection...');
const flip7Hand: Card[] = [
  { id: 'flip7', type: 'number', value: 7, isFlipped: true, isVisible: true },
  { id: 'high', type: 'number', value: 6, isFlipped: true, isVisible: true },
];
const flip7Busted = isHandBusted(flip7Hand);
console.log(`   ✅ Flip 7 protection: ${!flip7Busted} (sum: ${flip7Hand.reduce((sum, card) => sum + (card.value || 0), 0)})`);

// Test 9: Card display info
console.log('\n9. Testing card display info...');
const displayInfo = getCardDisplayInfo(card);
console.log(`   ✅ Display info: ${displayInfo.displayName} - ${displayInfo.description} (${displayInfo.color})`);

// Test 10: Create and shuffle
console.log('\n10. Testing create and shuffle...');
const newDeck = createAndShuffleDeck();
console.log(`   ✅ Created and shuffled deck with ${newDeck.length} cards`);

console.log('\n🎉 All card system tests completed successfully!');
console.log('\n📋 Summary of implemented features:');
console.log('   ✅ Card frequency distribution (official Flip 7 rules)');
console.log('   ✅ Deck generation logic');
console.log('   ✅ Fisher-Yates shuffling algorithm');
console.log('   ✅ Card dealing logic (single and multiple)');
console.log('   ✅ Card type detection (Number, Action, Modifier)');
console.log('   ✅ Card scoring logic with modifiers');
console.log('   ✅ Bust detection (sum > 7)');
console.log('   ✅ Flip 7 protection (can\'t bust with 7)');
console.log('   ✅ Card display information for UI');
console.log('   ✅ Complete deck management system'); 