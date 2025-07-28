import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  writeBatch,
  runTransaction,
  DocumentSnapshot,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Room, Player, Card, GameState, PlayerStatus, RoundHistory } from '../types';
import { generateDeck } from '../utils/cardSystem';
import { createAndShuffleDeck } from '../utils/cardSystem';

// Collection names
export const COLLECTIONS = {
  ROOMS: 'rooms',
  PLAYERS: 'players',
} as const;

// Room document interface for Firestore
export interface RoomDocument {
  code: string;
  host: string;
  players: Record<string, PlayerDocument>;
  deck: Card[];
  discardPile: Card[];
  round: number;
  state: GameState;
  currentTurn: string | null;
  createdAt: Timestamp;
  maxRounds: number;
  lastActivity: Timestamp;
}

// Player document interface for Firestore
export interface PlayerDocument {
  id: string;
  name: string;
  hand: Card[];
  score: number;
  status: PlayerStatus;
  history: unknown[]; // RoundHistory[] but simplified for Firestore
  joinedAt: Timestamp;
  isHost: boolean;
  hasFlip7: boolean;
  lastSeen: Timestamp;
  isConnected: boolean;
  roundScore: number;
  totalScore: number;
}

// Convert Room to RoomDocument for Firestore
function roomToDocument(room: Room): RoomDocument {
  const players: Record<string, PlayerDocument> = {};
  for (const [playerId, player] of Object.entries(room.players)) {
    players[playerId] = playerToDocument(player);
  }
  
  return {
    code: room.code,
    host: room.host,
    players,
    deck: room.deck,
    discardPile: room.discardPile,
    round: room.round,
    state: room.state,
    currentTurn: room.currentTurn,
    createdAt: Timestamp.fromDate(room.createdAt),
    maxRounds: room.maxRounds,
    lastActivity: Timestamp.now(),
  };
}

// Convert RoomDocument to Room
function documentToRoom(doc: DocumentSnapshot, id: string): Room {
  const data = doc.data() as RoomDocument;
  
  const players: Record<string, Player> = {};
  for (const [playerId, playerDoc] of Object.entries(data.players)) {
    players[playerId] = documentToPlayer(playerDoc);
  }
  
  return {
    code: data.code,
    host: data.host,
    players,
    deck: data.deck,
    discardPile: data.discardPile,
    currentTurn: data.currentTurn,
    state: data.state,
    round: data.round,
    maxRounds: data.maxRounds,
    createdAt: data.createdAt.toDate(),
  };
}

// Convert Player to PlayerDocument for Firestore
function playerToDocument(player: Player): PlayerDocument {
  return {
    id: player.id,
    name: player.name,
    hand: player.hand,
    score: player.score,
    status: player.status,
    history: player.history as unknown[],
    joinedAt: Timestamp.fromDate(player.joinedAt),
    isHost: player.isHost,
    hasFlip7: player.hasFlip7,
    lastSeen: Timestamp.now(),
    isConnected: true,
    roundScore: 0,
    totalScore: 0,
  };
}

// Convert PlayerDocument to Player
function documentToPlayer(playerDoc: PlayerDocument): Player {
  return {
    id: playerDoc.id,
    name: playerDoc.name,
    hand: playerDoc.hand,
    score: playerDoc.score,
    roundScore: playerDoc.roundScore || 0,
    totalScore: playerDoc.totalScore || 0,
    status: playerDoc.status,
    history: playerDoc.history as RoundHistory[],
    joinedAt: playerDoc.joinedAt.toDate(),
    isHost: playerDoc.isHost,
    hasFlip7: playerDoc.hasFlip7,
    isConnected: playerDoc.isConnected,
    lastSeen: playerDoc.lastSeen.toDate(),
  };
}

// Generate a random room code
export function generateRoomCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Check if a room code already exists
export async function checkRoomCodeExists(code: string): Promise<boolean> {
  const roomRef = doc(db, COLLECTIONS.ROOMS, code);
  const roomDoc = await getDoc(roomRef);
  return roomDoc.exists();
}

// Generate a unique room code
export async function generateUniqueRoomCode(): Promise<string> {
  let code: string;
  let attempts = 0;
  const maxAttempts = 10;

  do {
    code = generateRoomCode();
    attempts++;
    if (attempts > maxAttempts) {
      throw new Error('Failed to generate unique room code');
    }
  } while (await checkRoomCodeExists(code));

  return code;
}

// Create a new room
export async function createRoom(
  hostName: string,
  isSoloMode: boolean = false
): Promise<Room> {
  const roomCode = await generateUniqueRoomCode();
  const hostId = `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const hostPlayer: Player = {
    id: hostId,
    name: hostName,
    hand: [],
    score: 0,
    roundScore: 0,
    totalScore: 0,
    status: 'active',
    history: [],
    joinedAt: new Date(),
    isHost: true,
    hasFlip7: false,
    isConnected: true,
    lastSeen: new Date(),
  };

  const room: Room = {
    code: roomCode,
    host: hostId,
    players: { [hostId]: hostPlayer },
    deck: [],
    discardPile: [],
    currentTurn: null,
    state: 'waiting',
    round: 0,
    maxRounds: 10,
    createdAt: new Date(),
  };

  const roomRef = doc(db, COLLECTIONS.ROOMS, roomCode);
  await setDoc(roomRef, roomToDocument(room));

  return room;
}

// Join an existing room
export async function joinRoom(
  roomCode: string,
  playerName: string
): Promise<Room> {
  const roomRef = doc(db, COLLECTIONS.ROOMS, roomCode);
  
  return runTransaction(db, async (transaction) => {
    const roomDoc = await transaction.get(roomRef);
    
    if (!roomDoc.exists()) {
      throw new Error('Room not found');
    }
    
    const roomData = roomDoc.data() as RoomDocument;
    
    if (roomData.state !== 'waiting') {
      throw new Error('Game has already started');
    }
    
    // Check if player name already exists in the room
    const existingPlayer = Object.values(roomData.players).find(
      (player) => player.name === playerName
    );
    
    if (existingPlayer) {
      throw new Error('Player name already taken');
    }
    
    const playerId = `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const newPlayer: PlayerDocument = {
      id: playerId,
      name: playerName,
      hand: [],
      score: 0,
      status: 'active',
      history: [],
      joinedAt: Timestamp.now(),
      isHost: false,
      hasFlip7: false,
      lastSeen: Timestamp.now(),
      isConnected: true,
      roundScore: 0,
      totalScore: 0,
    };
    
    const updatedPlayers = {
      ...roomData.players,
      [playerId]: newPlayer,
    };
    
    transaction.update(roomRef, {
      players: updatedPlayers,
      lastActivity: Timestamp.now(),
    });
    
    // Return the updated room data with the new player
    const updatedRoomData: RoomDocument = {
      ...roomData,
      players: updatedPlayers,
      lastActivity: Timestamp.now(),
    };
    
    return {
      id: roomCode,
      code: updatedRoomData.code,
      host: updatedRoomData.host,
      players: Object.fromEntries(
        Object.entries(updatedRoomData.players).map(([id, playerDoc]) => [
          id,
          documentToPlayer(playerDoc),
        ])
      ),
      deck: updatedRoomData.deck,
      discardPile: updatedRoomData.discardPile,
      round: updatedRoomData.round,
      state: updatedRoomData.state,
      currentTurn: updatedRoomData.currentTurn,
      createdAt: updatedRoomData.createdAt.toDate(),
      maxRounds: updatedRoomData.maxRounds,
      lastActivity: updatedRoomData.lastActivity.toDate(),
    };
  });
}

// Get room by code
export async function getRoom(roomCode: string): Promise<Room | null> {
  const roomRef = doc(db, COLLECTIONS.ROOMS, roomCode);
  const roomDoc = await getDoc(roomRef);
  
  if (!roomDoc.exists()) {
    return null;
  }
  
  return documentToRoom(roomDoc, roomCode);
}

// Update room with retry logic for better reliability
export async function updateRoom(roomCode: string, updates: Partial<RoomDocument>): Promise<void> {
  const roomRef = doc(db, COLLECTIONS.ROOMS, roomCode);
  
  const updateData = {
    ...updates,
    lastActivity: Timestamp.now(),
  };
  
  // Retry logic for handling concurrent updates
  let retries = 0;
  const maxRetries = 3;
  
  while (retries < maxRetries) {
    try {
      await updateDoc(roomRef, updateData);
      return; // Success
    } catch (error: any) {
      retries++;
      console.log(`🔄 Firebase update attempt ${retries}/${maxRetries} failed:`, error?.message);
      
      if (retries >= maxRetries) {
        console.error('❌ All Firebase update attempts failed');
        throw error;
      }
      
      // Wait with exponential backoff before retrying
      const delay = Math.min(200 * Math.pow(2, retries - 1), 2000);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// Update player in room
export async function updatePlayer(
  roomCode: string,
  playerId: string,
  updates: Partial<PlayerDocument>
): Promise<void> {
  const roomRef = doc(db, COLLECTIONS.ROOMS, roomCode);
  
  await runTransaction(db, async (transaction) => {
    const roomDoc = await transaction.get(roomRef);
    
    if (!roomDoc.exists()) {
      throw new Error('Room not found');
    }
    
    const roomData = roomDoc.data() as RoomDocument;
    const player = roomData.players[playerId];
    
    if (!player) {
      throw new Error('Player not found');
    }
    
    const updatedPlayers = {
      ...roomData.players,
      [playerId]: {
        ...player,
        ...updates,
        lastSeen: Timestamp.now(),
      },
    };
    
    transaction.update(roomRef, {
      players: updatedPlayers,
      lastActivity: Timestamp.now(),
    });
  });
}

// Remove player from room
export async function removePlayer(roomCode: string, playerId: string): Promise<void> {
  const roomRef = doc(db, COLLECTIONS.ROOMS, roomCode);
  
  await runTransaction(db, async (transaction) => {
    const roomDoc = await transaction.get(roomRef);
    
    if (!roomDoc.exists()) {
      return; // Room doesn't exist, nothing to do
    }
    
    const roomData = roomDoc.data() as RoomDocument;
    const remainingPlayers = { ...roomData.players };
    delete remainingPlayers[playerId];
    
    // If no players left, delete the room
    if (Object.keys(remainingPlayers).length === 0) {
      transaction.delete(roomRef);
      return;
    }
    
    // If the host left, assign new host
    let updatedPlayers = remainingPlayers;
    if (roomData.host === playerId) {
      const newHostId = Object.keys(remainingPlayers)[0];
      updatedPlayers = {
        ...remainingPlayers,
        [newHostId]: {
          ...remainingPlayers[newHostId],
          isHost: true,
        },
      };
    }
    
    transaction.update(roomRef, {
      players: updatedPlayers,
      host: roomData.host === playerId ? Object.keys(updatedPlayers)[0] : roomData.host,
      lastActivity: Timestamp.now(),
    });
  });
}

// Host removes a player from the room
export async function hostRemovePlayer(roomCode: string, hostId: string, targetPlayerId: string): Promise<void> {
  const roomRef = doc(db, COLLECTIONS.ROOMS, roomCode);
  
  await runTransaction(db, async (transaction) => {
    const roomDoc = await transaction.get(roomRef);
    
    if (!roomDoc.exists()) {
      throw new Error('Room not found');
    }
    
    const roomData = roomDoc.data() as RoomDocument;
    
    // Verify the requester is the host
    if (roomData.host !== hostId) {
      throw new Error('Only the host can remove players');
    }
    
    // Verify the target player exists
    if (!roomData.players[targetPlayerId]) {
      throw new Error('Player not found');
    }
    
    // Host cannot remove themselves
    if (hostId === targetPlayerId) {
      throw new Error('Host cannot remove themselves');
    }
    
    const remainingPlayers = { ...roomData.players };
    delete remainingPlayers[targetPlayerId];
    
    transaction.update(roomRef, {
      players: remainingPlayers,
      lastActivity: Timestamp.now(),
    });
  });
}

// Update player connection status
export async function updatePlayerConnection(
  roomCode: string,
  playerId: string,
  isConnected: boolean
): Promise<void> {
  const roomRef = doc(db, COLLECTIONS.ROOMS, roomCode);
  
  // Use simple update instead of transaction for connection status
  // This avoids conflicts with game state updates
  await updateDoc(roomRef, {
    [`players.${playerId}.isConnected`]: isConnected,
    [`players.${playerId}.lastSeen`]: Timestamp.now(),
    lastActivity: Timestamp.now(),
  });
}

// Mark player as disconnected (for tab close detection)
export async function markPlayerDisconnected(roomCode: string, playerId: string): Promise<void> {
  const roomRef = doc(db, COLLECTIONS.ROOMS, roomCode);
  
  // Use simple update instead of transaction for disconnection
  // This avoids conflicts with game state updates
  await updateDoc(roomRef, {
    [`players.${playerId}.isConnected`]: false,
    [`players.${playerId}.status`]: 'disconnected',
    [`players.${playerId}.lastSeen`]: Timestamp.now(),
    lastActivity: Timestamp.now(),
  });
}

// Clean up disconnected players (run periodically)
export async function cleanupDisconnectedPlayers(roomCode: string, timeoutMinutes: number = 5): Promise<void> {
  const roomRef = doc(db, COLLECTIONS.ROOMS, roomCode);
  
  await runTransaction(db, async (transaction) => {
    const roomDoc = await transaction.get(roomRef);
    
    if (!roomDoc.exists()) {
      return;
    }
    
    const roomData = roomDoc.data() as RoomDocument;
    const now = Timestamp.now();
    const timeoutMs = timeoutMinutes * 60 * 1000;
    
    const updatedPlayers = { ...roomData.players };
    let hasChanges = false;
    
    // Remove players who have been disconnected for too long
    Object.entries(updatedPlayers).forEach(([playerId, player]) => {
      if (!player.isConnected) {
        const timeSinceLastSeen = now.toMillis() - player.lastSeen.toMillis();
        if (timeSinceLastSeen > timeoutMs) {
          delete updatedPlayers[playerId];
          hasChanges = true;
        }
      }
    });
    
    // If no players left, delete the room
    if (Object.keys(updatedPlayers).length === 0) {
      transaction.delete(roomRef);
      return;
    }
    
    // If host was removed, assign new host
    if (hasChanges && !updatedPlayers[roomData.host]) {
      const newHostId = Object.keys(updatedPlayers)[0];
      updatedPlayers[newHostId] = {
        ...updatedPlayers[newHostId],
        isHost: true,
      };
      
      transaction.update(roomRef, {
        players: updatedPlayers,
        host: newHostId,
        lastActivity: Timestamp.now(),
      });
    } else if (hasChanges) {
      transaction.update(roomRef, {
        players: updatedPlayers,
        lastActivity: Timestamp.now(),
      });
    }
  });
}

// Start game
export async function startGame(roomCode: string): Promise<void> {
  const roomRef = doc(db, COLLECTIONS.ROOMS, roomCode);
  
  await runTransaction(db, async (transaction) => {
    const roomDoc = await transaction.get(roomRef);
    
    if (!roomDoc.exists()) {
      throw new Error('Room not found');
    }
    
    const roomData = roomDoc.data() as RoomDocument;
    
    if (roomData.state !== 'waiting') {
      throw new Error('Game has already started');
    }
    
    if (Object.keys(roomData.players).length < 1) {
      throw new Error('Need at least 1 player to start');
    }
    
    // Initialize game state with properly shuffled deck
    const shuffledDeck = createAndShuffleDeck();
    const playerIds = Object.keys(roomData.players);
    const updatedPlayers = { ...roomData.players };
    
    // Deal one card to each player
    const remainingDeck = [...shuffledDeck];
    for (const playerId of playerIds) {
      if (remainingDeck.length > 0) {
        const card = remainingDeck.shift()!;
        // Deal face-up cards (isVisible: true)
        const faceUpCard = {
          ...card,
          isVisible: true,
        };
        updatedPlayers[playerId] = {
          ...updatedPlayers[playerId],
          hand: [faceUpCard],
          status: 'active',
          roundScore: 0,
          totalScore: 0,
          hasFlip7: false,
        };
      }
    }
    
    transaction.update(roomRef, {
      players: updatedPlayers,
      deck: remainingDeck,
      discardPile: [],
      round: 1,
      state: 'playing',
      currentTurn: playerIds[0],
      lastActivity: Timestamp.now(),
    });
  });
}

// Real-time room listener
export function subscribeToRoom(
  roomCode: string,
  callback: (room: Room | null) => void
): () => void {
  const roomRef = doc(db, COLLECTIONS.ROOMS, roomCode);
  
  return onSnapshot(roomRef, (doc) => {
    if (doc.exists()) {
      const room = documentToRoom(doc, roomCode);
      callback(room);
    } else {
      callback(null);
    }
  });
}

// Subscribe to room list
export function subscribeToRoomList(
  callback: (rooms: Room[]) => void
): () => void {
  const roomsRef = collection(db, COLLECTIONS.ROOMS);
  const q = query(roomsRef, where('state', '==', 'waiting'), orderBy('createdAt', 'desc'), limit(50));
  
  return onSnapshot(q, (querySnapshot) => {
    const rooms: Room[] = [];
    querySnapshot.forEach((doc) => {
      const room = documentToRoom(doc, doc.id);
      rooms.push(room);
    });
    callback(rooms);
  });
}

// Clean up old rooms (run periodically)
export async function cleanupOldRooms(): Promise<void> {
  const roomsRef = collection(db, COLLECTIONS.ROOMS);
  const cutoffTime = new Date();
  cutoffTime.setHours(cutoffTime.getHours() - 24); // Remove rooms older than 24 hours
  
  const q = query(
    roomsRef,
    where('lastActivity', '<', Timestamp.fromDate(cutoffTime))
  );
  
  const querySnapshot = await getDocs(q);
  const batch = writeBatch(db);
  
  querySnapshot.forEach((doc) => {
    batch.delete(doc.ref);
  });
  
  await batch.commit();
}

// Get room statistics
export async function getRoomStats(roomCode: string): Promise<{
  totalPlayers: number;
  activePlayers: number;
  gameState: GameState;
  currentRound: number;
  maxRounds: number;
}> {
  const room = await getRoom(roomCode);
  
  if (!room) {
    throw new Error('Room not found');
  }
  
  const totalPlayers = Object.keys(room.players).length;
  const activePlayers = Object.values(room.players).filter(
    (player) => player.status === 'active'
  ).length;
  
  return {
    totalPlayers,
    activePlayers,
    gameState: room.state,
    currentRound: room.round,
    maxRounds: room.maxRounds,
  };
}