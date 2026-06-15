# System Architecture

Dhaiso is designed around a server-authoritative client-server model. Real-time, bidirectional state synchronization is managed via WebSockets using Socket.IO.

```
┌──────────────────┐               WebSocket (Socket.IO)               ┌──────────────────┐
│  React Frontend  │ ◄───────────────────────────────────────────────► │  Node.js Server  │
│ (View Rendering) │                                                   │  (Game Logic &   │
└──────────────────┘                                                   │ Authoritative    │
                                                                       │      State)      │
                                                                       └──────────────────┘
```

---

## Architectural Layers

### Frontend (Client)
The frontend is a single-page application built with React, TypeScript, and Tailwind CSS. It serves as a visual client that maps server-side game states directly to UI elements.

#### Key Component Hierarchy
- **`App`**: Establishes the socket connection, manages authentication/player state, and switches views between `Lobby` and `GameTable`.
- **`Lobby`**: Manages room creation and entry UI, host configurations, and bot additions.
- **`GameTable`**: The primary game arena containing:
  - **Player Circle**: Renders other players around the table, adjusting positions relative to the active player.
  - **Pot**: Shows cards played in the current trick.
  - **Hand**: Displays the active player's cards.
  - **Modals**: Handles contextual prompts like placing a bid, selecting trump/friends, and displaying final scores.

### Backend (Server)
The backend is an Express and Socket.IO application written in TypeScript. It is responsible for room orchestration, connection lifecycles, and validating and executing all game state transitions.

#### Core Models and Controllers
- **`RoomManager`**: A singleton registry managing the lifecycle of active game rooms, mapping room codes to `Room` instances, and cleaning up empty sessions.
- **`Room`**: Encapsulates room-level parameters (e.g., maximum players, host permissions, client IP deduplication, and active socket connections) and wraps the `Game` instance.
- **`Game`**: The central controller for the card game loop. It handles state machines (phases), turn sequencing, trick evaluation, and team creation.
- **`Player`**: Represents a participant's state, including their hand, team assignment, accumulated points, and bidding status.
- **`BotPlayer`**: Inherits from `Player` and provides rule-based decision methods (`decideBid`, `decideTrump`, `decideCard`) to play automatically.
- **`Card`**: An immutable class computing point value and trick resolution strength (power).
- **`Deck`**: Handles initialization and random permutation (Fisher-Yates shuffle) of the 40-card deck.

---

## Event Schema and Communication Flow

### Client-to-Server (Events)

| Event | Payload | Context |
| :--- | :--- | :--- |
| `CREATE_ROOM` | None | Client requests generation of a new game room. |
| `JOIN_ROOM` | `{ roomCode: string, name: string }` | Client joins an existing room by code with a unique name. |
| `LEAVE_ROOM` | None | Client leaves the room; if a game is active, they are replaced by a bot. |
| `START_GAME` | None | Emitted by the host to begin the match once 5 players are present. |
| `ROOM_BID` | `{ amount: number }` | Emitted by a player during the bidding phase. |
| `ROOM_SELECT_TRUMP`| `{ suit: Suit, friends: ICard[] }` | Caller submits the trump suit and friend cards. |
| `ROOM_PLAY_CARD` | `ICard` | Emitted by a player to play a card into the pot. |
| `ADD_BOT` / `REMOVE_BOT` | None | Emitted by the host to populate empty player slots. |

### Server-to-Client (Events)

| Event | Payload | Context |
| :--- | :--- | :--- |
| `GAME_UPDATE` | `GameState` | Broadcasts the synchronized, censored game state to all players in the room. |
| `ERROR` | `string` | Emitted to a specific socket when an invalid action is attempted. |
| `ROOM_JOINED` | `{ roomCode: string, isHost: boolean }` | Sent to confirm successful room entry. |

---

## State Synchronization and Privacy

To prevent clients from cheating, the server does not transmit the complete raw state of all players. When `broadcastState()` is called, the server clones the game state and sanitizes it for each recipient:

```typescript
// Sanitization logic excerpt
public getStateForPlayer(playerId: string): GameState {
    return {
        ...this.gameState,
        players: this.players.map(player => ({
            id: player.id,
            name: player.name,
            pointsWon: player.pointsWon,
            hasPassed: player.hasPassed,
            team: this.determineVisibleTeam(player, playerId),
            // Hide opponent cards (return null array), reveal only own cards
            hand: player.id === playerId ? player.hand : player.hand.map(() => null)
        }))
    };
}
```

This ensures that:
- Players cannot inspect opponent hands via the network tab.
- Secret team alliances (determined by friend card ownership) remain secret until the friend cards are played.

---

## Turn Validation and Concurrency

Node.js executes in a single-threaded event loop, which naturally prevents race conditions during state mutations. The server enforces turn order by validating the request sender's ID against the current active turn:

1. A client emits an action event (e.g., `ROOM_PLAY_CARD`).
2. The server checks if `socket.id` matches the player at `players[currentTurnIndex].id`.
3. If valid, the move validation routine runs (`isValidMove()`). If invalid, the server sends an `ERROR` event back to the socket and rejects the state transition.
4. If validation passes, the state is mutated, the turn is incremented, and `broadcastState()` updates all clients in the room.
