# Vercel Migration Plan - Removing WebSocket Dependency

## Problem Statement

Vercel's serverless architecture **does not support long-lived WebSocket connections** (Socket.IO). Our current implementation requires:
- Persistent connection for real-time updates
- Server-side state management
- Bidirectional communication

**Goal:** Enable full Vercel deployment (frontend + backend) while maintaining real-time gameplay.

## 🎯 Proposed Solutions

### Option 1: HTTP Polling (Simplest)

Replace WebSockets with short-polling HTTP requests.

**How it works:**
```
Client polls /api/game-state every 500ms
    ↓
Server returns current game state
    ↓
Client updates UI
```

**Pros:**
- ✅ Works on Vercel serverless functions
- ✅ No architecture changes needed
- ✅ Easy to implement

**Cons:**
- ❌ Increased API calls (rate limits)
- ❌ ~500ms-1s latency
- ❌ Higher bandwidth usage
- ❌ Not truly real-time

**Implementation:**

*Frontend:*
```typescript
// Replace Socket.IO with polling
useEffect(() => {
    const pollInterval = setInterval(async () => {
        const response = await fetch(`/api/game-state?gameId=${gameId}&playerId=${playerId}`);
        const state = await response.json();
        setGameState(state);
    }, 500); // Poll every 500ms
    
    return () => clearInterval(pollInterval);
}, [gameId, playerId]);

// Send actions via POST
const playCard = async (card) => {
    await fetch('/api/play-card', {
        method: 'POST',
        body: JSON.stringify({ gameId, playerId, card })
    });
};
```

*Backend (Vercel Serverless):*
```typescript
// api/game-state.ts
import { createGame } from '@/lib/game-manager';

export default async function handler(req, res) {
    const { gameId, playerId } = req.query;
    const game = getGame(gameId); // From in-memory store
    const state = game.getStateForPlayer(playerId);
    res.json(state);
}

// api/play-card.ts
export default async function handler(req, res) {
    const { gameId, playerId, card } = req.body;
    const game = getGame(gameId);
    game.handlePlayCard(playerId, card);
    res.json({ success: true });
}
```

**Challenges:**
- Need persistent storage (Redis, Upstash, etc.) for game state
- Multiple serverless functions accessing same state

---

### Option 2: Server-Sent Events (SSE)

One-way push from server, HTTP for client actions.

**How it works:**
```
Client opens SSE connection
    ↓
Server pushes updates when state changes
    ↓
Client receives instant updates
    
Client sends actions via POST
```

**Pros:**
- ✅ True server push (no polling)
- ✅ Lower latency (~100-200ms)
- ✅ Reduced bandwidth
- ✅ Works on Vercel

**Cons:**
- ❌ One-way only (need separate POST for actions)
- ❌ Browser connection limits (6 per domain)
- ❌ More complex than polling

**Implementation:**

*Frontend:*
```typescript
useEffect(() => {
    const eventSource = new EventSource(`/api/game-stream?gameId=${gameId}&playerId=${playerId}`);
    
    eventSource.onmessage = (event) => {
        const state = JSON.parse(event.data);
        setGameState(state);
    };
    
    return () => eventSource.close();
}, [gameId, playerId]);
```

*Backend:*
```typescript
// api/game-stream.ts
export default async function handler(req, res) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    const { gameId, playerId } = req.query;
    
    // Send updates when game state changes
    const sendUpdate = () => {
        const state = getGame(gameId).getStateForPlayer(playerId);
        res.write(`data: ${JSON.stringify(state)}\n\n`);
    };
    
    // Initial state
    sendUpdate();
    
    // Subscribe to changes (using pub/sub)
    subscribeToGameUpdates(gameId, sendUpdate);
}
```

---

### Option 3: Upstash + Polling (Recommended)

Use Upstash Redis for state + HTTP polling for updates.

**Architecture:**
```
┌─────────┐  HTTP Poll   ┌─────────────┐   Read/Write   ┌──────────┐
│ Client  │ ────────────►│   Vercel    │ ──────────────►│ Upstash  │
│ (React) │              │  Serverless │                │  Redis   │
└─────────┘              └─────────────┘                └──────────┘
```

**Why Upstash:**
- ✅ Serverless-native Redis
- ✅ Free tier (10K requests/day)
- ✅ Global edge network
- ✅ Vercel integration

**Pros:**
- ✅ Persistent state across function calls
- ✅ Fast read/write (<10ms)
- ✅ Scales automatically
- ✅ Free tier sufficient for small games

**Cons:**
- ❌ Still uses polling
- ❌ External dependency
- ❌ Requires paid tier for production

**Implementation:**

*Setup:*
```bash
npm install @upstash/redis
```

*Backend:*
```typescript
// lib/redis.ts
import { Redis } from '@upstash/redis';

export const redis = new Redis({
    url: process.env.UPSTASH_REDIS_URL,
    token: process.env.UPSTASH_REDIS_TOKEN,
});

// Store game state
export async function saveGameState(gameId: string, state: GameState) {
    await redis.set(`game:${gameId}`, JSON.stringify(state));
    await redis.expire(`game:${gameId}`, 3600); // 1 hour TTL
}

export async function getGameState(gameId: string): Promise<GameState> {
    const data = await redis.get(`game:${gameId}`);
    return JSON.parse(data);
}
```

*API Routes:*
```typescript
// api/game-state.ts
import { redis } from '@/lib/redis';

export default async function handler(req, res) {
    const { gameId, playerId } = req.query;
    const state = await redis.get(`game:${gameId}`);
    res.json(sanitizeForPlayer(state, playerId));
}

// api/play-card.ts
export default async function handler(req, res) {
    const { gameId, playerId, card } = req.body;
    
    // Get current state
    const state = await redis.get(`game:${gameId}`);
    
    // Update state (run game logic)
    const updatedState = processCardPlay(state, playerId, card);
    
    // Save back
    await redis.set(`game:${gameId}`, JSON.stringify(updatedState));
    
    res.json({ success: true });
}
```

---

### Option 4: Hybrid - Vercel Frontend + Render Backend

Keep current WebSocket architecture, deploy separately.

**Current Deployment:**
- Frontend: Vercel ✅ (already works)
- Backend: Render/Railway/Fly.io (WebSocket support)

**Pros:**
- ✅ No code changes
- ✅ True real-time
- ✅ Simple architecture
- ✅ Already implemented

**Cons:**
- ❌ Not "full Vercel"
- ❌ Two deployment platforms
- ❌ Backend can spin down (free tier)

**This is what we currently have!**

---

## 📊 Comparison Matrix

| Solution | Complexity | Latency | Cost | Real-time? | Vercel-only? |
|----------|-----------|---------|------|-----------|--------------|
| **HTTP Polling** | Low | 500-1000ms | Free | ❌ | ✅ |
| **SSE** | Medium | 100-200ms | Free | One-way | ✅ |
| **Upstash + Poll** | Medium | 500ms | Free* | ❌ | ✅ |
| **Hybrid (Current)** | Low | <50ms | Free | ✅ | ❌ |

*Free tier limits apply

---

## 🎯 Recommended Approach

### Phase 1: Proof of Concept (Upstash + Polling)

1. **Add Upstash Redis**
   ```bash
   npm install @upstash/redux
   vercel link
   vercel env pull
   ```

2. **Create API Routes**
   - `/api/game-state` - GET state
   - `/api/join` - POST join game
   - `/api/bid` - POST bid
   - `/api/select-trump` - POST trump selection
   - `/api/play-card` - POST play card

3. **Migrate Game Logic**
   - Extract `Game.ts` as pure functions
   - No Socket.IO dependencies
   - State stored in Redis

4. **Update Frontend**
   - Replace Socket.IO with `fetch`
   - Add polling loop (500ms)
   - POST for all actions

### Phase 2: Optimize Latency

1. **Reduce Polling Interval**
   - Start at 500ms
   - Tune based on UX feedback
   - Consider 300ms for playing phase

2. **Implement Smart Polling**
   ```typescript
   // Poll faster when your turn
   const interval = isMyTurn ? 200 : 1000;
   ```

3. **Add Optimistic Updates**
   ```typescript
   // Update UI immediately, sync with server
   playCard(card);
   updateLocalState(card);
   await fetch('/api/play-card', { card });
   ```

### Phase 3: Production Ready

1. **Add Error Handling**
   - Network failures
   - State conflicts
   - Retry logic

2. **Scale Upstash**
   - Upgrade to paid tier ($10/mo)
   - Connection pooling

3. **Monitor Performance**
   - Track API call count
   - Measure latency
   - User feedback

---

## 💰 Cost Analysis

**Current (Hybrid):**
- Vercel: Free
- Render: Free (with spin-down)
- **Total: $0/month** ⭐

**Full Vercel (Upstash):**
- Vercel: Free
- Upstash: Free tier (10K requests/day)
- **Total: $0/month** (until scaling needed)

**Full Vercel (Production):**
- Vercel: Free
- Upstash: $10/month (100K requests/day)
- **Total: $10/month**

---

## 🚀 Migration Steps

### 1. Create Feature Branch
```bash
git checkout -b feature/vercel-migration
```

### 2. Set Up Upstash
```bash
# Create account at upstash.com
# Create Redis database
# Add to Vercel environment variables
```

### 3. Refactor Game Logic
```typescript
// Before (stateful)
class Game {
    private players: Player[];
    handlePlayCard(id, card) { ... }
}

// After (stateless)
export function processCardPlay(state: GameState, playerId: string, card: ICard): GameState {
    // Pure function
    const newState = { ...state };
    // ... logic
    return newState;
}
```

### 4. Create API Routes
```
/api/
├── create-game.ts
├── game-state.ts
├── join.ts
├── bid.ts
├── select-trump.ts
└── play-card.ts
```

### 5. Update Frontend
```typescript
// Remove Socket.IO
- import { io } from 'socket.io-client';
- const socket = io(...);

// Add polling
+ const [state, setState] = useState(null);
+ useEffect(() => {
+     const poll = setInterval(async () => {
+         const res = await fetch(`/api/game-state?id=${gameId}`);
+         setState(await res.json());
+     }, 500);
+     return () => clearInterval(poll);
+ }, [gameId]);
```

### 6. Test Thoroughly
- 5 players in game
- All phases work
- No race conditions
- Reasonable latency

### 7. Deploy
```bash
vercel --prod
```

---

## ⚠️ Challenges & Solutions

### Race Conditions
**Problem:** Two players act simultaneously
**Solution:** Optimistic locking in Redis
```typescript
const result = await redis.watch(`game:${id}`);
// ... update ...
await redis.multi().set(...).exec();
```

### State Sync
**Problem:** Client state out of sync
**Solution:** Include version/timestamp
```typescript
{
    version: 123,
    lastUpdated: Date.now(),
    ...gameState
}
```

### Scalability
**Problem:** Many concurrent games
**Solution:** 
- Redis sharding
- Edge caching
- Rate limiting

---

## 🎯 Conclusion

**For MVP:** Keep current hybrid approach (Vercel + Render)
**For Learning:** Try Upstash + Polling on a branch
**For Production:** Evaluate after user feedback

The ~500ms delay with polling is acceptable for a turn-based card game. Real-time feel isn't critical since players take seconds to choose cards anyway.

**Next Steps:**
1. Gather user feedback on current UX
2. Decide if migration is worth complexity
3. If yes, start with Phase 1 POC

---

**Questions?** Open an issue or discuss in the team.
