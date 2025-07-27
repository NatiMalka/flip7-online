**Product Requirements Document (PRD)**\
**Project:** Flip 7 Online Game (Desktop Web Version)\
**Platform:** Cursor IDE + Firebase (Firestore + Hosting + Functions)

---

### 1. Overview

Build a modern, responsive desktop web version of the "Flip 7" card game. The game supports real-time multiplayer (with private room codes) and solo mode. Firebase will handle real-time data, room management, and future expansion (e.g., achievements).

---

### 2. Features

#### 2.1 Core Gameplay

- Press-your-luck mechanics based on official Flip 7 rules.
- Draw and manage Number, Action, and Modifier cards.
- Real-time card flipping, scoring, busting, and player states (active, stayed, busted).
- Flip 7 unique cards = auto-win for the round + 15 pts bonus.

#### 2.2 Multiplayer Lobby

- Join by name and room code (no auth required).
- Lobby displays real-time list of joined players.
- Host controls "Start Game".

#### 2.3 Solo Mode

- Single player can start a session and challenge themself to 200+ pts in 5 rounds.
- AI dealer/logic handles card flow.

#### 2.4 Game Flow

- Dealer distributes first card to each player.
- Players choose to **Hit** or **Stay** on their turn.
- Action/Modifier cards resolved instantly.
- Round ends if all players Stay/Bust OR one player Flips 7.
- After each round, scores update.

#### 2.5 Animations & Effects

- Flip animation for each card.
- Visual effects for Action cards (Freeze, Flip Three, Second Chance).
- Bust = screen shake or explosion effect.
- Flip 7 = confetti / celebration animation.

#### 2.6 Scoreboard

- Real-time player score tracking.
- Flip 7 indicator.
- Optional: previous rounds panel (shown post-round, not real-time).

#### 2.7 Game Persistence

- Store game state, round history, and scores in Firestore.
- Allow reconnection to room if disconnected.

#### 2.8 Achievements (Future)

- Track stats per user session (games played, Flip 7s, busts, etc).
- Tie to Firestore records for later gamification.

---

### 3. Technical Architecture

#### 3.1 Firebase

- **Firestore:** Stores players, rooms, game state, rounds, scores.
- **Functions:** Validate card logic, handle modifiers/effects securely (to prevent cheating).
- **Hosting:** Serve static frontend (Cursor build).

#### 3.2 Firestore Data Model

```json
rooms: {
  [roomCode]: {
    host: string,
    players: {
      [playerId]: {
        name: string,
        hand: [],
        score: number,
        status: "active" | "stayed" | "busted",
        history: [],
        joinedAt: timestamp
      }
    },
    deck: [],
    discardPile: [],
    round: number,
    state: "waiting" | "playing" | "finished",
    createdAt: timestamp
  }
}
```

#### 3.3 Game Logic (Cloud Function or Client)

- Shuffle deck, deal cards
- Manage actions: Freeze, Flip Three, Second Chance
- Detect bust / Flip 7
- Score calculation: number cards + modifiers + x2 card + Flip 7 bonus

---

### 4. UI/UX Design

#### 4.1 Style

- Follow original Flip 7 branding for cards (colors, typography).
- Modern interface for layout: clean, soft shadows, rounded corners.
- Cool animations for actions (hover + effects).

#### 4.2 Views

- **Home:** Enter name + room code or click "Solo Mode".
- **Lobby:** Waiting room UI with player list and host start button.
- **Game Board:** Central deck, player hand zone, other players' status.
- **Round End Screen:** Score summary and continue button.
- **Game Over Screen:** Winner, total points, achievements.

---

### 5. Future Enhancements

- Mobile responsive version
- Chat within room
- Leaderboard across all players
- Sound effects & background music
- Achievements and profile history (using Firebase Auth later)

---

### 6. Best Practices & Tools

- React + Tailwind (Cursor IDE)
- Firestore rules: secure player access to only their data
- Cloud functions for deck randomization + action validation
- Modular component system for card visuals
- Versioned PRD and update logs

---

**Ready for implementation in Cursor IDE. Let me know if you want me to start with the Firestore schema, UI layout, or game logic first.**

