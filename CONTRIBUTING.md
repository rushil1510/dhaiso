# Contributing to Dhaiso

Thank you for your interest in contributing to Dhaiso! This guide will help you get started.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Submitting Changes](#submitting-changes)
- [Architecture Overview](#architecture-overview)
- [Key Concepts](#key-concepts)

## 🤝 Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn and grow
- Maintain professionalism

## 🚀 Getting Started

### Prerequisites Knowledge

**Essential:**
- TypeScript basics
- React fundamentals
- Async/await and Promises

**Helpful:**
- Socket.IO basics
- Express.js
- Tailwind CSS

**Learning Resources:**
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [React Docs](https://react.dev)
- [Socket.IO Tutorial](https://socket.io/docs/v4/tutorial/introduction)

### First Time Setup

1. **Fork the repository**
```bash
gh repo fork rushil1510/dhaiso
cd dhaiso
```

2. **Install dependencies**
```bash
cd client && npm install
cd ../server && npm install
```

3. **Create a branch**
```bash
git checkout -b feature/your-feature-name
```

4. **Start development servers**
```bash
# Terminal 1
cd server && npm run dev

# Terminal 2
cd client && npm run dev
```

## 🔄 Development Workflow

### Understanding the Game Flow

Before making changes, understand the game phases:

1. **Lobby** - Players join (needs 5)
2. **Bidding** - Players bid on points
3. **Trump Selection** - Winner selects trump & friends
4. **Playing** - 8 tricks of card play
5. **Ended** - Score calculation & results

See [docs/GAME_MECHANICS.md](docs/GAME_MECHANICS.md) for full rules.

### Making Changes

**Frontend Changes** (`client/src/`):
- UI components in `components/`
- Game state managed via Socket.IO events
- Tailwind CSS for styling

**Backend Changes** (`server/src/`):
- Game logic in `classes/Game.ts`
- Card/Deck logic in respective classes
- Socket events in `index.ts`

### Testing Your Changes

1. **Local Testing:**
```bash
# Open 5 browser tabs at localhost:5173
# Join as different players
# Test your feature through a full game
```

2. **Type Checking:**
```bash
cd client && npx tsc --noEmit
cd server && npx tsc --noEmit
```

3. **Build Testing:**
```bash
cd client && npm run build
cd server && npm run build
```

## 📏 Coding Standards

### TypeScript

```typescript
// ✅ Good - Type everything
interface PlayerData {
    id: string;
    name: string;
    score: number;
}

function updatePlayer(player: PlayerData): void {
    // implementation
}

// ❌ Bad - Avoid 'any'
function updatePlayer(player: any) {
    // implementation
}
```

### React Components

```typescript
// ✅ Good - Functional components with types
interface CardProps {
    rank: string;
    suit: string;
    onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ rank, suit, onClick }) => {
    return <div onClick={onClick}>{rank}{suit}</div>;
};

// ❌ Bad - No types
export const Card = ({ rank, suit, onClick }) => {
    return <div onClick={onClick}>{rank}{suit}</div>;
};
```

### Naming Conventions

- **Components:** PascalCase (`GameTable`, `Card`)
- **Functions:** camelCase (`handlePlayCard`, `calculateScore`)
- **Constants:** UPPER_SNAKE_CASE (`MAX_PLAYERS`, `DEFAULT_BID`)
- **Files:** Match component name (`GameTable.tsx`, `Card.tsx`)

### Code Organization

```typescript
// ✅ Good - Organized imports
import { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import { GameState, ICard } from './types';
import { Card } from './components/Card';

// ❌ Bad - Random order
import { Card } from './components/Card';
import { useState, useEffect } from 'react';
import { GameState, ICard } from './types';
```

## 📤 Submitting Changes

### Commit Messages

Follow conventional commits:

```bash
# Format
<type>(<scope>): <description>

# Examples
feat(ui): add player score display to banner
fix(game): resolve player counter sync issue
docs(readme): update installation instructions
refactor(server): optimize broadcast state logic
```

**Types:**
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation
- `refactor` - Code refactoring
- `test` - Tests
- `style` - Formatting/styling

### Pull Request Process

1. **Update your branch**
```bash
git fetch upstream
git rebase upstream/main
```

2. **Push to your fork**
```bash
git push origin feature/your-feature-name
```

3. **Create Pull Request**
- Clear title describing the change
- Description explaining WHY (not just what)
- Reference any related issues
- Include screenshots for UI changes

4. **PR Template**
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation

## Testing
How did you test this?

## Screenshots (if applicable)
Add screenshots here
```

## 🏗️ Architecture Overview

### Data Flow

```
Player Action (Frontend)
    ↓
Socket Event Emission
    ↓
Server Event Handler (index.ts)
    ↓
Game Class Method (Game.ts)
    ↓
Update Game State
    ↓
Broadcast to All Players
    ↓
Frontend Receives Update
    ↓
React Re-renders
```

### Key Files

**Frontend:**
- `App.tsx` - Socket connection & root component
- `GameTable.tsx` - Main game UI
- `types.ts` - Shared type definitions

**Backend:**
- `Game.ts` - Core game controller
- `Player.ts` - Player state management
- `Card.ts` - Card logic & comparison
- `Deck.ts` - Deck shuffling & dealing

For detailed architecture, see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)

## 🔑 Key Concepts

### Socket Events

**Client → Server:**
- `JOIN_GAME` - Player joins with name
- `START_GAME` - Host starts game
- `BID` - Player makes bid
- `SELECT_TRUMP` - Caller selects trump & friends
- `PLAY_CARD` - Player plays a card

**Server → Client:**
- `GAME_UPDATE` - Complete game state
- `ERROR` - Error messages

### Game State

The `GameState` object contains:
```typescript
{
    phase: 'lobby' | 'bidding' | 'trump_selection' | 'playing' | 'ended',
    players: IPlayer[],
    bid: number,
    callerId: string,
    trumpSuit: string,
    friendCards: ICard[],
    pot: { playerId: string, card: Card }[],
    currentTurn: number,
    scores: { callerTeam, defenseTeam, bid, callerWins }
}
```

### Card Comparison

Cards have:
- `value` - Point value (J=5, Q=10, K=15, A=20, Q♠=60)
- `power` - For trick resolution (A=14, K=13, Q=12, J=11...)

Trump cards > Lead suit cards > Other cards

## 🐛 Common Issues

### "Player counter out of sync"
- Check `broadcastState()` in `Game.ts`
- Ensure players array is properly synced

### "Cards not rendering"
- Verify card data structure matches `ICard` interface
- Check null handling in GameTable

### "Socket connection fails"
- Ensure backend is running on port 3000
- Check CORS settings in `server/src/index.ts`

## 💡 Tips for Contributors

1. **Start Small** - Fix typos, update docs, add comments
2. **Read Existing Code** - Understand patterns before changing
3. **Ask Questions** - Open an issue if unsure
4. **Test Thoroughly** - Play full games to test changes
5. **Document Changes** - Update docs when changing behavior

## 📚 Additional Resources

- [Game Mechanics Detailed](docs/GAME_MECHANICS.md)
- [Architecture Deep Dive](docs/ARCHITECTURE.md)
- [Deployment Guide](DEPLOYMENT.md)
- [Vercel Migration Plan](docs/VERCEL_MIGRATION.md)

## 🎉 Recognition

Contributors will be added to the README's acknowledgments section!

---

**Questions?** Open an issue or reach out to the maintainers.

Happy coding! 🚀
