# Architecture Documentation

## System Overview

Dhaiso is a real-time multiplayer card game built with a client-server architecture using WebSockets for bidirectional communication.

```
┌─────────────┐         WebSocket          ┌─────────────┐
│   Client    │ ◄────────────────────────► │   Server    │
│   (React)   │     Socket.IO Events       │  (Node.js)  │
└─────────────┘                            └─────────────┘
      │                                           │
      │                                           │
   UI State                                  Game Logic
   Rendering                                 State Management
```

## 🏗️ Architecture Layers

### Frontend (Client)

**Technology Stack:**
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Socket.IO Client** - Real-time communication
- **Vite** - Build tool & dev server

**Component Hierarchy:**
```
App
└── Socket Connection
    ├── Lobby
    │   └── Join Form
    └── GameTable
        ├── Header (Info Banner)
        ├── Pot (Center Cards)
        ├── Other Players (Circle Layout)
        ├── My Hand (Bottom)
        ├── BiddingControls
        ├── TrumpSelectionModal
        └── EndGameModal
```

### Backend (Server)

**Technology Stack:**
- **Node.js** - Runtime
- **TypeScript** - Type safety
- **Express** - HTTP server
- **Socket.IO** - WebSocket management
- **ts-node** - Development execution

**Class Structure:**
```
Game (Main Controller)
├── Player[] (5 players)
├── Deck (Card management)
├── GameState (Shared state)
└── Methods
    ├── addPlayer()
    ├── startGame()
    ├── handleBid()
    ├── handleSelectTrumpAndFriends()
    ├── handlePlayCard()
    ├── resolveTrick()
    └── endGame()
```

## 📡 Communication Flow

### Socket.IO Events

#### Client → Server

| Event | Payload | Purpose |
|-------|---------|---------|
| `JOIN_GAME` | `{ name: string }` | Player joins lobby |
| `START_GAME` | `void` | Start game when 5 players |
| `BID` | `{ amount: number }` | Place bid |
| `SELECT_TRUMP` | `{ suit: Suit, friends: ICard[] }` | Caller selects trump |
| `PLAY_CARD` | `ICard` | Play a card |

#### Server → Client

| Event | Payload | Purpose |
|-------|---------|---------|
| `GAME_UPDATE` | `GameState` | Broadcast full game state |
| `ERROR` | `string` | Error message |

### State Management

**Server-Side (Source of Truth):**
```typescript
class Game {
    private players: Player[] = [];
    private deck: Deck;
    private gameState: GameState;
    private currentTurnIndex: number;
    
    // Single source of truth
    private broadcastState() {
        // Send state to all connected players
    }
}
```

**Client-Side (Local Copy):**
```typescript
const [gameState, setGameState] = useState<GameState | null>(null);

useEffect(() => {
    socket.on('GAME_UPDATE', (state) => {
        setGameState(state);  // Update local copy
    });
}, []);
```

## 🔄 Game State Lifecycle

### 1. Initialization

```typescript
// Server creates game instance
const game = new Game(io);

// Client connects
const socket = io('http://localhost:3000');
```

### 2. Player Join

```
Client                      Server
  │                           │
  ├─ JOIN_GAME ───────────────►│
  │    {name: "Alice"}         │
  │                            ├─ addPlayer()
  │                            ├─ players.push(new Player())
  │                            ├─ broadcastState()
  │◄─ GAME_UPDATE ─────────────┤
     {players: [...], phase: 'lobby'}
```

### 3. Game Start

```
Client                      Server
  │                           │
  ├─ START_GAME ──────────────►│
  │                            ├─ Validate 5 players
  │                            ├─ Deal initial 5 cards
  │                            ├─ Check face card rule
  │                            ├─ Set phase = 'bidding'
  │                            ├─ broadcastState()
  │◄─ GAME_UPDATE ─────────────┤
     {phase: 'bidding', ...}
```

### 4. Bidding Flow

```
Client                      Server
  │                           │
  ├─ BID {amount: 180} ───────►│
  │                            ├─ validateBid()
  │                            ├─ Update bid & callerId
  │                            ├─ Advance turn
  │                            ├─ broadcastState()
  │◄─ GAME_UPDATE ─────────────┤
     {bid: 180, callerId: "..."}
```

### 5. Card Play

```
Client                      Server
  │                           │
  ├─ PLAY_CARD {card} ────────►│
  │                            ├─ Validate turn
  │                            ├─ isValidMove(card)
  │                            ├─ Add to pot
  │                            ├─ [5 cards?] resolveTrick()
  │                            ├─ broadcastState()
  │◄─ GAME_UPDATE ─────────────┤
     {pot: [...], currentTurn: ...}
  │                            │
  │                   [5 sec delay]
  │                            │
  │◄─ GAME_UPDATE ─────────────┤
     {pot: [], currentTurn: ...}
```

## 🎨 Frontend Architecture

### Component Responsibilities

#### App.tsx
- **Socket connection** management
- **Root state** (playerId, gameState)
- **Event handlers** (onJoin, onBid, onPlayCard, etc.)
- Routing between Lobby and GameTable

#### GameTable.tsx
- **UI rendering** (header, players, pot, hand)
- **Modal management** (trump selection, results)
- **Player positioning** (circular layout)
- Delegates actions to parent handlers

#### Card.tsx
- **Individual card rendering**
- Suit colors and symbols
- Click handlers
- Face-down/face-up states

### State Flow

```
Socket Event
     │
     ▼
App.tsx (setGameState)
     │
     ▼
GameTable.tsx (props)
     │
     ├──► Header (phase, bid, trump info)
     ├──► Other Players (filtered by playerId)
     ├──► Pot (current trick cards)
     └──► My Hand (current player's cards)
```

## 🖥️ Backend Architecture

### Class Responsibilities

#### Game.ts (Controller)
- **Player management** (add, remove)
- **Game flow orchestration** (phases)
- **State broadcasting** (to all clients)
- **Turn management**
- **Validation logic**

#### Player.ts (Data)
- **Hand management** (cards)
- **Points tracking**
- **Team assignment**
- **Utility methods** (hasSuit, hasFaceCard)

#### Card.ts (Logic)
- **Value calculation** (points)
- **Power calculation** (for comparison)
- **Immutable card data**

#### Deck.ts (Utility)
- **Deck initialization** (40 cards)
- **Shuffling** (Fisher-Yates algorithm)
- **Dealing** (remove from deck array)

### Key Algorithms

#### 1. Card Comparison (Trick Resolution)

```typescript
private resolveTrick() {
    const leadSuit = pot[0].card.suit;
    let winner = pot[0];
    
    for (const play of pot) {
        if (isTrump(play.card) && !isTrump(winner.card)) {
            winner = play;  // Trump beats non-trump
        } else if (sameSuit(play.card, winner.card)) {
            if (play.card.power > winner.card.power) {
                winner = play;  // Higher power wins
            }
        }
    }
    
    awardPoints(winner);
}
```

#### 2. Team Assignment

```typescript
private assignTeams() {
    // Caller is always on caller team
    caller.team = 'caller';
    
    // Check each friend card
    for (const friend of friendCards) {
        const holder = players.find(p => 
            p.hand.some(c => matches(c, friend))
        );
        if (holder) {
            holder.team = 'caller';
        }
    }
    
    // Everyone else is defense
    players.forEach(p => {
        if (p.team === 'unknown') {
            p.team = 'defense';
        }
    });
}
```

## 📦 Data Models

### GameState

```typescript
interface GameState {
    phase: 'lobby' | 'bidding' | 'trump_selection' | 'playing' | 'ended';
    players: IPlayer[];           // All 5 players
    bid: number;                  // Current bid amount
    callerId: string;             // Highest bidder
    trumpSuit: Suit | null;       // Selected trump
    friendCards: ICard[];         // 2 friend cards
    pot: { playerId: string; card: Card }[];  // Current trick
    currentTurn: number;          // Index of current player
    scores: {
        callerTeam?: number;
        defenseTeam?: number;
        bid?: number;
        callerWins?: boolean;
    };
}
```

### Player

```typescript
interface IPlayer {
    id: string;                   // Socket ID
    name: string;                 // Display name
    hand: (ICard | null)[];      // Cards (null = hidden)
    team: 'unknown' | 'caller' | 'defense';
    pointsWon: number;           // Points from tricks
    hasPassed: boolean;          // Bidding status
}
```

### Card

```typescript
interface ICard {
    suit: 'Hearts' | 'Diamonds' | 'Clubs' | 'Spades';
    rank: '5'|'6'|'7'|'8'|'9'|'10'|'J'|'Q'|'K'|'A';
}

class Card {
    readonly value: number;      // Points
    readonly power: number;      // Comparison strength
    
    calculateValue(): number;
    calculatePower(): number;
}
```

## 🔐 Security Considerations

**Current Implementation:**
- No authentication (players identified by socket ID)
- No persistent data storage
- Game state is ephemeral (lost on server restart)

**Production Recommendations:**
- Add player authentication
- Implement rate limiting
- Validate all client inputs
- Add reconnection logic
- Persist game state to database

## 🎯 Performance Optimizations

1. **Broadcast Optimization:**
   - Only send relevant data to each player
   - Hide other players' hands (null array)

2. **Event Throttling:**
   - 5-second delay after trick completion
   - Prevents spam clicking

3. **State Immutability:**
   - Card class is immutable
   - Deep cloning prevented with Object.freeze

## 🔄 Planned Changes

See [VERCEL_MIGRATION.md](VERCEL_MIGRATION.md) for plans to:
- Replace Socket.IO with HTTP polling or Server-Sent Events
- Enable full Vercel deployment
- Maintain real-time feel with reduced latency

---

**Next:** Read [GAME_MECHANICS.md](GAME_MECHANICS.md) to understand game rules.
