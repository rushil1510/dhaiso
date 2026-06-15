# Production Roadmap and Feature Directory

This document details the implemented production features of Dhaiso and outlines the roadmap for future architectural improvements.

---

## Core Implemented Systems

### 1. Multi-Room Management
- **Orchestration**: Room lifecycles are isolated and managed through the `RoomManager` class using 6-character, alphanumeric room codes.
- **Deduplication**: Client IP checking prevents duplicate joins from the same network in production (bypassed on `localhost`).
- **Data Integrity**: Enforces unique, case-insensitive player names within each room.

### 2. Error Resolution Architecture
- Custom error models (`RoomNotFoundError`, `NameTakenError`, etc.) inherit from a base `AppError`.
- Server handles validation errors gracefully, emitting standardized messages to clients over the `ERROR` websocket channel.

### 3. Automated Bot Takeover
- **Modular Decision Engine**: The `BotPlayer` class extends `Player` and executes rule-based strategies for bidding, trump selection, and trick play.
- **Connection Loss**: If a user disconnects or leaves an active room, the server converts their slot into a bot, cloning their hand, score, and team assignment to prevent game disruption.

### 4. Structured Logger
- Winston-based logging outputs formatted telemetry data including Room ID, Socket ID, Game Phase, and Bot Actions.
- Console output is colorized for development, and logs are piped to `logs/combined.log` and `logs/error.log` in production.

---

## Technical Specifications

### Rest API Endpoints
The backend exposes read-only HTTP endpoints for monitoring room activity:

- `GET /api/rooms/stats`
  - **Description**: Returns aggregate metrics of active games and rooms.
  - **Payload**: `{ totalRooms: number, totalPlayers: number, rooms: RoomSummary[] }`
- `GET /api/rooms/:code`
  - **Description**: Retrieves details for a specific active room.

### Error Reference Matrix

| Error Code | Trigger Condition |
| :--- | :--- |
| `ROOM_NOT_FOUND` | User requests a room code that does not exist. |
| `ROOM_FULL` | User attempts to join a room with 5 active players. |
| `NAME_TAKEN` | Username matches an existing player in that room. |
| `IP_ALREADY_IN_ROOM` | Client IP is already registered in the room (production only). |
| `GAME_IN_PROGRESS` | Client attempts to join a room that has already left the lobby phase. |
| `NOT_HOST` | A non-host client attempts to start the game or alter configurations. |
| `NOT_YOUR_TURN` | Client attempts to act out of sequence. |

---

## Future Roadmap: State Persistence

To make game states resilient against server restarts (e.g., during deployments or cold restarts on Render), the next planned architectural shift is transitioning state management to Redis.

### Architectural Blueprint

```
┌──────────┐  HTTP/WS Requests  ┌──────────────┐  Read/Write State  ┌──────────────┐
│  Client  │ ──────────────────►│  Vercel/API  │ ──────────────────►│  Upstash DB  │
│ (React)  │                    │ (Serverless) │                    │ (Redis Slot) │
└──────────┘                    └──────────────┘                    └──────────────┘
```

1. **State Store Service**: Create a service wrapping Redis commands (`SET`, `GET`, `EXPIRE`) to serialize and store `Room` and `Game` state under unique keys (e.g., `room:{roomCode}`).
2. **Periodic Serialization**: Auto-serialize the active game state after every valid mutation event.
3. **Recovery Routine**: On server restart, fetch all active room codes from Redis and reconstitute the in-memory room registry before opening socket listeners.
