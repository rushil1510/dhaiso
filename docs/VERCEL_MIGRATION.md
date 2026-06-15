# Serverless Migration Strategy (RFC)

This document evaluates architectural options for migrating the backend to serverless hosting platforms like Vercel, which do not support long-lived WebSocket connections (Socket.IO).

---

## The Challenge

The current architecture relies on a stateful, in-memory Node.js process. The frontend and backend communicate via persistent TCP connections managed by Socket.IO. 

Serverless platforms (like Vercel Functions) enforce execution limits and spin down containers when idle. This prevents the use of stateful, persistent WebSocket connections. To run the backend in a serverless environment, the architecture must transition to a stateless model.

---

## Architectural Options

### Option 1: Hybrid Deployment (Status Quo)
Deploy the frontend on Vercel and keep the backend on a dedicated container hosting service (e.g., Render, Railway, or Fly.io) that natively supports WebSockets.

- **Pros**:
  - No changes to the existing real-time codebase.
  - Minimal latency (<50ms).
  - True bidirectional push.
- **Cons**:
  - Requires maintaining two separate deployment configurations.
  - Backend is subject to cold starts on free container tiers (takes ~30s to wake up on Render).

### Option 2: Stateless REST + HTTP Polling
Migrate game logic to serverless functions and store game state in a remote, low-latency key-value store (e.g., Upstash Redis). Clients fetch the latest game state using short-polling (e.g., every 500ms).

- **Pros**:
  - Fully serverless (can be hosted entirely on Vercel).
  - State persists automatically across function invokations.
- **Cons**:
  - High read volume on Redis due to frequent polling.
  - Latency is bound by the polling frequency (up to 500ms delay in UI updates).
  - Requires refactoring the stateful class hierarchy into stateless utility functions.

### Option 3: Serverless with Server-Sent Events (SSE)
Use HTTP POST requests for client-to-server actions, and maintain a unidirectional Server-Sent Events (SSE) stream for server-to-client updates. State is persisted in Redis.

- **Pros**:
  - Real-time server-to-client push over HTTP.
  - Lower network overhead than short polling.
  - Works on Vercel serverless configurations.
- **Cons**:
  - Vercel serverless execution time limits (e.g., 10–60s) will periodically interrupt the SSE stream, requiring the client to handle reconnection logic.
  - Complex implementation compared to polling.

---

## Evaluation Matrix

| Criterion | Hybrid (Current) | REST + Polling | SSE + POST |
| :--- | :--- | :--- | :--- |
| **Real-time Latency** | Low (<50ms) | High (500ms+) | Medium (100–200ms) |
| **Implementation Complexity**| Low | Medium | High |
| **Hosting Costs** | Free | Low (Upstash free tier) | Low (Upstash free tier) |
| **State Persistence** | Ephemeral | Persistent (Redis) | Persistent (Redis) |
| **WebSocket Needed** | Yes | No | No |

---

## Proposed Migration Plan (For Option 2)

If a complete migration to a serverless architecture is required, the following phased approach is recommended:

### Phase 1: Game Logic Decoupling
Refactor the backend classes (`Game`, `Player`, `Card`) to separate side-effects from pure logic:
- Convert state modifications into pure functions: `(currentState, action) => newState`.
- Ensure all logic can run statelessly without reliance on in-memory variables.

### Phase 2: State Store Implementation
Integrate a Redis client (`@upstash/redis`) into the serverless functions to handle serialization and retrieval of the `GameState` object on every request.

### Phase 3: API Gateway Definition
Replace Socket.IO event listeners with REST API endpoints:
- `GET /api/game/state` (fetches sanitized player-specific state)
- `POST /api/game/action` (submits bids, card plays, and trump selections)

### Phase 4: Client Communication Migration
Update the client-side socket context:
- Replace Socket.IO listeners with a polling hook or client-side fetch loop.
- Optimize polling behavior by polling at a higher frequency when it is the user's turn.
