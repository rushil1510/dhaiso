# 🎴 Dhaiso - Multiplayer Card Game

A real-time multiplayer card game built with React, Node.js, and Socket.IO. Dhaiso is a strategic trick-taking game for exactly 5 players.

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=flat&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Socket.io](https://img.shields.io/badge/Socket.io-black?style=flat&logo=socket.io&badgeColor=010101)](https://socket.io/)

## 🎮 Live Demo

[Play Dhaiso](https://your-deployed-url.vercel.app) (Coming soon)

## 📋 Table of Contents

- [About](#about)
- [Quick Start](#quick-start)
- [Game Rules](#game-rules)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Development](#development)
- [Contributing](#contributing)
- [Deployment](#deployment)
- [License](#license)

## 🎯 About

Dhaiso is a traditional trick-taking card game where players bid, select trumps, and compete to win tricks worth points. One player becomes the "caller" who selects trump and friend cards, forming a team against the remaining players.

**Key Features:**
- ⚡ Real-time multiplayer with WebSockets
- 🎨 Modern UI with Tailwind CSS
- 🔒 Type-safe with TypeScript
- 🎲 Strategic gameplay with bidding and trump selection
- 📱 Responsive design

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/dhaiso.git
cd dhaiso
```

2. **Install dependencies**
```bash
# Install client dependencies
cd client
npm install

# Install server dependencies
cd ../server
npm install
```

3. **Start development servers**

Terminal 1 (Backend):
```bash
cd server
npm run dev
```

Terminal 2 (Frontend):
```bash
cd client
npm run dev
```

4. **Open the game**

Navigate to `http://localhost:5173` in 5 different browser tabs/windows.

## 🃏 Game Rules

**Brief Overview:**
- 5 players required
- 40-card deck (no 2s, 3s, 4s)
- Players bid on points they can win
- Highest bidder selects trump suit and 2 "friend" cards
- Friend card holders join caller's team
- Must score at least the bid amount to win

For complete rules, see [docs/GAME_MECHANICS.md](docs/GAME_MECHANICS.md)

## 🛠️ Tech Stack

**Frontend:**
- React 18
- TypeScript
- Tailwind CSS
- Socket.IO Client
- Vite

**Backend:**
- Node.js
- TypeScript
- Express
- Socket.IO
- ts-node

## 📁 Project Structure

```
dhaiso/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   │   ├── GameTable.tsx   # Main game UI
│   │   │   ├── Lobby.tsx       # Player lobby
│   │   │   └── Card.tsx        # Card component
│   │   ├── types.ts       # TypeScript types
│   │   └── App.tsx        # Root component
│   ├── package.json
│   └── vite.config.ts
│
├── server/                # Node.js backend
│   ├── src/
│   │   ├── classes/      # Game logic classes
│   │   │   ├── Game.ts        # Main game controller
│   │   │   ├── Player.ts      # Player state
│   │   │   ├── Card.ts        # Card logic
│   │   │   └── Deck.ts        # Deck management
│   │   ├── types.ts      # TypeScript types
│   │   └── index.ts      # Server entry point
│   ├── package.json
│   └── tsconfig.json
│
├── docs/                  # Documentation
│   ├── GAME_MECHANICS.md  # Game rules
│   ├── ARCHITECTURE.md    # Technical architecture
│   └── game_flow.md       # Game flow diagram
│
├── CONTRIBUTING.md        # Contribution guidelines
├── DEPLOYMENT.md         # Deployment guide
└── README.md             # This file
```

## 💻 Development

### Running Tests

```bash
# Client tests
cd client
npm test

# Server tests
cd server
npm test
```

### Type Checking

```bash
# Check TypeScript in both projects
cd client && npx tsc --noEmit
cd server && npx tsc --noEmit
```

### Building for Production

```bash
# Build client
cd client
npm run build

# Build server
cd server
npm run build
```

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for:
- Code of conduct
- Development workflow
- Coding standards
- How to submit pull requests

**Key Resources for Contributors:**
- [Game Mechanics](docs/GAME_MECHANICS.md) - Understand the game
- [Architecture Guide](docs/ARCHITECTURE.md) - Technical deep dive
- [API Documentation](docs/API.md) - Socket events and data flow

## 🚀 Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions.

**Quick Deploy:**
- Frontend: Vercel
- Backend: Render.com

## 📝 Future Improvements

- [ ] Remove Socket.IO dependency for Vercel deployment ([See plan](docs/VERCEL_MIGRATION.md))
- [ ] Add spectator mode
- [ ] Game replay functionality
- [ ] Mobile app (React Native)
- [ ] AI opponents
- [ ] Tournament mode

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details

## 🙏 Acknowledgments

- Built with ❤️ by [Your Name]
- Game rules based on traditional Dhaiso card game
- UI inspired by modern card game applications

## 📞 Contact

- GitHub Issues: [Report bugs or request features](https://github.com/yourusername/dhaiso/issues)
- Email: your.email@example.com

---

**Made with TypeScript and lots of ☕**
