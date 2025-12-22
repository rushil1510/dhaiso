# 🚀 Dhaiso Production-Grade Implementation Plan

## ✅ Implementation Complete (Without Redis)

This document has been updated to reflect the implemented features. Redis state persistence is optional and can be added later.

---

## Current Architecture

```
server/src/
├── classes/
│   ├── BotPlayer.ts      # AI player for disconnected users
│   ├── Card.ts           # Card representation
│   ├── Deck.ts           # Deck management
│   ├── Game.ts           # Core game logic
│   ├── Player.ts         # Player class
│   ├── Room.ts           # Room with IP/name validation
│   └── RoomManager.ts    # Multi-room management
├── services/
│   ├── CodeGenerator.ts  # Room code generation
│   └── Logger.ts         # Structured logging (Winston)
├── errors.ts             # Custom error classes
├── index.ts              # Express + Socket.IO server
└── types.ts              # TypeScript types

client/src/
├── components/
│   ├── Lobby.tsx         # Room create/join UI
│   ├── GameTable.tsx     # Game interface
│   └── ...
├── App.tsx               # Main app with room management
└── types.ts              # Shared types
```

---

## ✅ Implemented Features

### 1. Structured Logging
- Winston-based logging with context (room, player, phase)
- Game-specific helpers: `playerAction()`, `phaseChange()`, `botAction()`
- File logging in production (`logs/error.log`, `logs/combined.log`)

### 2. Modular Bot System
- `BotPlayer` class extends `Player`
- Decision methods: `decideBid()`, `decideTrump()`, `decideCard()`
- Automatic takeover when player disconnects

### 3. Multi-Room Support
- `Room` class wraps game with room-specific logic
- `RoomManager` handles lifecycle, cleanup, statistics
- 6-character unambiguous room codes (e.g., `ABC123`)

### 4. IP Restriction (Anti-Cheat)
- One player per IP per room
- Development bypass for localhost testing
- Error messages for duplicate IP attempts

### 5. Unique Names Per Room
- Case-insensitive name matching
- Clear error when name is taken

### 6. Custom Error Classes
- Structured errors with codes, context, HTTP status
- Error types: `RoomNotFoundError`, `NameTakenError`, `IPAlreadyInRoomError`, etc.

### 7. Frontend Room UI
- Create Room / Join Room selection screen
- Room code display and sharing
- Error toast notifications
- Loading states

---

## Socket Events Reference

### New Room Events (Recommended)
```javascript
// Create a room
socket.emit('CREATE_ROOM', (response) => {
  // response: { success: true, roomCode: 'ABC123' }
});

// Join a room
socket.emit('JOIN_ROOM', { roomCode: 'ABC123', name: 'Alice' }, (response) => {
  // response: { success: true, roomCode: 'ABC123', isHost: false }
  // or: { success: false, error: 'NAME_TAKEN' }
});

// Leave room
socket.emit('LEAVE_ROOM');

// Game actions (same as legacy)
socket.emit('START_GAME');
socket.emit('BID', { amount: 180 });
socket.emit('SELECT_TRUMP', { suit: 'H', friends: [...] });
socket.emit('PLAY_CARD', { suit: 'H', rank: 'K' });
```

### Legacy Events (Still Work)
```javascript
// Quick join (uses internal room)
socket.emit('JOIN_GAME', 'PlayerName');
socket.emit('START_GAME');
socket.emit('BID', { amount: 180 });
// ... etc
```

### Server → Client Events
```javascript
socket.on('GAME_UPDATE', (gameState) => { ... });
socket.on('ERROR', (message) => { ... });
socket.on('ROOM_CREATED', ({ roomCode }) => { ... });
socket.on('ROOM_JOINED', ({ roomCode, isHost }) => { ... });
socket.on('ROOM_LEFT', () => { ... });
```

---

## REST API Endpoints

```bash
# Get all room statistics
GET /api/rooms/stats
# Response: { totalRooms: 2, totalPlayers: 7, rooms: [...] }

# Get specific room info
GET /api/rooms/:code
# Response: { code: 'ABC123', playerCount: 3, isFull: false, ... }
```

---

## Error Codes

| Code | Description |
|------|-------------|
| `ROOM_NOT_FOUND` | Room doesn't exist |
| `ROOM_FULL` | Room has 5 players |
| `NAME_TAKEN` | Name already in use in room |
| `IP_ALREADY_IN_ROOM` | IP already has a player in room |
| `GAME_IN_PROGRESS` | Can't join ongoing game |
| `NOT_HOST` | Only host can start game |
| `NOT_YOUR_TURN` | Wrong player tried to act |
| `INVALID_BID` | Invalid bid amount |
| `INVALID_CARD` | Can't play that card |

---

## 🔲 Optional: Redis State Persistence (Phase 5)

To survive server restarts on Render.com:

### 1. Set Up Upstash Redis
1. Go to [upstash.com](https://upstash.com) and create free account
2. Create a new Redis database
3. Copy the REST URL and Token

### 2. Add Environment Variables
```bash
# In Render.com dashboard or .env file:
UPSTASH_REDIS_URL=https://xxx.upstash.io
UPSTASH_REDIS_TOKEN=AxxxxxxxxxxxxQ
```

### 3. Install Package
```bash
cd server && npm install @upstash/redis
```

### 4. Create StateStore Service
```typescript
// server/src/services/StateStore.ts
import { Redis } from '@upstash/redis';

export class StateStore {
  private redis: Redis;
  
  constructor() {
    this.redis = new Redis({
      url: process.env.UPSTASH_REDIS_URL!,
      token: process.env.UPSTASH_REDIS_TOKEN!,
    });
  }
  
  async saveRoom(room: Room) { ... }
  async getRoom(code: string) { ... }
  async getAllRoomCodes() { ... }
}
```

### 5. Add Recovery on Startup
```typescript
// In index.ts
async function recoverRooms() {
  const codes = await stateStore.getAllRoomCodes();
  for (const code of codes) {
    const data = await stateStore.getRoom(code);
    if (data) roomManager.restoreRoom(data);
  }
}
```

---

## Testing Guide

### Test Room Flow
1. Open browser at `http://localhost:5173`
2. Click "Create Room"
3. Enter your name
4. Copy the room code shown
5. Open new incognito window
6. Click "Join Room"
7. Enter the room code and a different name
8. Repeat until 5 players

### Test IP Restriction
- Use phone on mobile data (different IP)
- Use VPN in one browser
- In development: localhost bypasses IP check

### Test Bot Takeover
1. Start a game with 5 players
2. Close one browser tab
3. Watch server logs for bot actions
4. Bot will automatically play for disconnected player

---

## Deployment Checklist

### Server (Render.com)
- [ ] Set `FRONTEND_URL` environment variable
- [ ] Set `NODE_ENV=production`
- [ ] Build command: `npm install && npm run build`
- [ ] Start command: `npm start`

### Client (Vercel)
- [ ] Set `VITE_BACKEND_URL` to Render URL
- [ ] Deploy from Git

---

## What's Next?

After Redis is set up, the only remaining work is:
1. **Implement StateStore** - Save/restore rooms from Redis
2. **Periodic saving** - Save room state every 10 seconds
3. **Recovery on startup** - Restore rooms when server restarts

The current implementation is fully functional without Redis - games just won't persist across server restarts.
