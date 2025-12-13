import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { Lobby } from './components/Lobby';
import { GameTable } from './components/GameTable';
import type { GameState, ICard, Suit } from './types';

// Use environment variable for backend URL, fallback to localhost for development
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
const socket: Socket = io(BACKEND_URL);

function App() {
  const [connected, setConnected] = useState(false);
  const [joined, setJoined] = useState(false);
  const [playerId, setPlayerId] = useState('');
  const [gameState, setGameState] = useState<GameState | null>(null);

  useEffect(() => {
    socket.on('connect', () => {
      setConnected(true);
      setPlayerId(socket.id || '');
    });

    socket.on('GAME_UPDATE', (state: GameState) => {
      setGameState(state);
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    return () => {
      socket.off('connect');
      socket.off('GAME_UPDATE');
      socket.off('disconnect');
    };
  }, []);

  const handleJoin = (name: string) => {
    socket.emit('JOIN_GAME', name);
    setJoined(true);
  };

  const handleBid = (amount: number) => {
    socket.emit('BID', { amount }); // Server expects handleBid(playerId, amount), but socket event usually just sends data
    // Wait, server implementation: socket.on('BID', ...) needs to be added to index.ts!
    // I haven't added the event listeners in index.ts yet!
    // I need to update server/src/index.ts to handle these events.
  };

  const handleSelectTrump = (suit: Suit, friends: any[]) => {
    socket.emit('SELECT_TRUMP', { suit, friends });
  };

  const handlePlayCard = (card: ICard) => {
    socket.emit('PLAY_CARD', card);
  };

  const handleStartGame = () => {
    socket.emit('START_GAME');
  };

  if (!connected) return <div className="text-white text-center mt-20">Connecting to server...</div>;

  if (!joined) return <Lobby onJoin={handleJoin} />;

  if (!gameState) return <div className="text-white text-center mt-20">Waiting for game state...</div>;

  return (
    <GameTable 
      gameState={gameState} 
      playerId={playerId}
      onBid={handleBid}
      onSelectTrump={handleSelectTrump}
      onPlayCard={handlePlayCard}
      onStartGame={handleStartGame}
    />
  );
}

export default App;
