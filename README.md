# Dhaiso

Dhaiso is a real-time multiplayer trick-taking card game designed for exactly 5 players. Built with a React frontend and a Node.js/Socket.IO backend, it features a server-authoritative state model, automated bot takeover for disconnected players, and a responsive circular table layout.

## Features

- **Real-Time Multiplayer**: Bidirectional synchronization using Socket.IO.
- **Server-Authoritative Validation**: All game logic, turn enforcement, and card play rules are validated on the backend.
- **Circular Game Table**: Responsive frontend layout replicating a physical card table.
- **Bot Integration**: Hosts can add bots to fill tables, and active players are automatically replaced by bots if they disconnect mid-game.
- **Multi-Room Support**: Play multiple isolated games concurrently via unique room codes.

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/rushil1510/dhaiso.git
   cd dhaiso
   ```

2. Install dependencies:
   ```bash
   # Frontend
   cd client && npm install

   # Backend
   cd ../server && npm install
   ```

### Running Locally

To run the application locally, start both the server and client dev servers:

1. **Start the backend server:**
   ```bash
   cd server
   npm run dev
   ```

2. **Start the frontend client:**
   ```bash
   cd client
   npm run dev
   ```

3. **Open the game:**
   Navigate to `http://localhost:5173`. Open up to 5 tabs/windows (or use bots) to start a game.

## Project Structure

```
dhaiso/
├── client/             # React/Vite frontend application
│   ├── src/
│   │   ├── components/ # Lobby, GameTable, and Card components
│   │   ├── types.ts    # Frontend type definitions
│   │   └── App.tsx     # Socket connection & main layout
├── server/             # Node.js/Express/Socket.IO backend application
│   ├── src/
│   │   ├── classes/    # Core game loop, player, card, deck, and room models
│   │   ├── services/   # Logger & room code generator utilities
│   │   ├── index.ts    # Application entry point & socket event routing
│   │   └── types.ts    # Backend type definitions
├── docs/               # Technical and design documentation
│   ├── ARCHITECTURE.md
│   ├── GAME_MECHANICS.md
│   └── ...
├── CONTRIBUTING.md     # Code guidelines and contribution flow
└── DEPLOYMENT.md       # Production deployment instructions
```

## Development & Verification

### Code Verification
```bash
# Type-check frontend & backend
cd client && npx tsc --noEmit
cd server && npx tsc --noEmit
```

### Production Builds
```bash
# Build frontend
cd client && npm run build

# Build backend
cd server && npm run build
```

## Documentation Directory

For deeper insights into the project, refer to the following guides:
- [Game Rules & Mechanics](docs/GAME_MECHANICS.md)
- [System Architecture](docs/ARCHITECTURE.md)
- [Deployment Guide](DEPLOYMENT.md)
- [Contributing Guidelines](CONTRIBUTING.md)

## License

This project is licensed under the MIT License.
