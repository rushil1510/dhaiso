import { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { Lobby } from './components/Lobby';
import { GameTable } from './components/GameTable';
import type { GameState, ICard, Suit } from './types';

// Use environment variable for backend URL, fallback to localhost for development
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
const socket: Socket = io(BACKEND_URL);

interface RoomInfo {
  code: string;
  isHost: boolean;
  playerCount: number;
}

function App() {
  const [connected, setConnected] = useState(false);
  const [roomInfo, setRoomInfo] = useState<RoomInfo | null>(null);
  const [playerId, setPlayerId] = useState('');
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    socket.on('connect', () => {
      setConnected(true);
      setPlayerId(socket.id || '');
      console.log('Connected to server');
    });

    socket.on('GAME_UPDATE', (state: GameState) => {
      setGameState(state);
    });

    socket.on('disconnect', () => {
      setConnected(false);
      console.log('Disconnected from server');
    });

    socket.on('ERROR', (message: string) => {
      setError(message);
      setIsLoading(false);
      console.error('Server error:', message);
    });

    // Room events
    socket.on('ROOM_CREATED', (data: { roomCode: string }) => {
      console.log('Room created:', data.roomCode);
    });

    socket.on('ROOM_JOINED', (data: { roomCode: string; isHost: boolean }) => {
      setRoomInfo({ code: data.roomCode, isHost: data.isHost, playerCount: 1 });
      setIsLoading(false);
      setError('');
      console.log('Joined room:', data.roomCode);
    });

    socket.on('ROOM_LEFT', () => {
      setRoomInfo(null);
      setGameState(null);
    });

    return () => {
      socket.off('connect');
      socket.off('GAME_UPDATE');
      socket.off('disconnect');
      socket.off('ERROR');
      socket.off('ROOM_CREATED');
      socket.off('ROOM_JOINED');
      socket.off('ROOM_LEFT');
    };
  }, []);

  // Clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Create a new room and join it
  const handleCreateRoom = useCallback((name: string) => {
    setIsLoading(true);
    setError('');
    
    socket.emit('CREATE_ROOM', (response: { success: boolean; roomCode?: string; error?: string }) => {
      if (response.success && response.roomCode) {
        // Now join the room we just created
        socket.emit('JOIN_ROOM', { roomCode: response.roomCode, name }, 
          (joinResponse: { success: boolean; roomCode?: string; isHost?: boolean; error?: string }) => {
            setIsLoading(false);
            if (joinResponse.success) {
              setRoomInfo({ 
                code: joinResponse.roomCode ?? response.roomCode!, 
                isHost: joinResponse.isHost || true,
                playerCount: 1
              });
              setError('');
            } else {
              setError(joinResponse.error || 'Failed to join room');
            }
          }
        );
      } else {
        setIsLoading(false);
        setError(response.error || 'Failed to create room');
      }
    });
  }, []);

  // Join an existing room with code
  const handleJoinRoom = useCallback((name: string, roomCode?: string) => {
    setIsLoading(true);
    setError('');

    if (roomCode) {
      // Join specific room with code
      socket.emit('JOIN_ROOM', { roomCode, name }, 
        (response: { success: boolean; roomCode?: string; isHost?: boolean; playerCount?: number; error?: string }) => {
          setIsLoading(false);
          if (response.success) {
            setRoomInfo({ 
              code: response.roomCode || roomCode, 
              isHost: response.isHost || false,
              playerCount: response.playerCount || 1
            });
            setError('');
          } else {
            setError(response.error || 'Failed to join room');
          }
        }
      );
    } else {
      // Legacy: Quick play mode - join default game
      socket.emit('JOIN_GAME', name);
      // The GAME_UPDATE event will indicate success
      setRoomInfo({ code: 'QUICK', isHost: false, playerCount: 1 });
      setIsLoading(false);
    }
  }, []);

  const handleLeaveRoom = useCallback(() => {
    socket.emit('LEAVE_ROOM');
    setRoomInfo(null);
    setGameState(null);
  }, []);

  const handleBid = useCallback((amount: number) => {
    socket.emit('BID', { amount });
  }, []);

  const handleSelectTrump = useCallback((suit: Suit, friends: any[]) => {
    socket.emit('SELECT_TRUMP', { suit, friends });
  }, []);

  const handlePlayCard = useCallback((card: ICard) => {
    socket.emit('PLAY_CARD', card);
  }, []);

  const handleStartGame = useCallback(() => {
    socket.emit('START_GAME');
  }, []);

  const handleAddBot = useCallback(() => {
    socket.emit('ADD_BOT', (response: { success: boolean; error?: string }) => {
      if (!response.success) {
        setError(response.error || 'Failed to add bot');
      }
    });
  }, []);

  const handleRemoveBot = useCallback((botId: string) => {
    socket.emit('REMOVE_BOT', { botId }, (response: { success: boolean; error?: string }) => {
      if (!response.success) {
        setError(response.error || 'Failed to remove bot');
      }
    });
  }, []);

  const handleExitRoom = useCallback(() => {
    socket.emit('EXIT_ROOM', (response: { success: boolean; error?: string }) => {
      if (!response.success) {
        setError(response.error || 'Failed to exit room');
      }
    });
  }, []);

  // Connection screen
  if (!connected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-emerald-900 via-green-900 to-teal-900">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mb-4"></div>
          <p className="text-lg">Connecting to server...</p>
          <p className="text-sm text-gray-400 mt-2">{BACKEND_URL}</p>
        </div>
      </div>
    );
  }

  // Lobby screen (not in a room yet)
  if (!roomInfo) {
    return (
      <Lobby 
        onJoin={handleJoinRoom} 
        onCreateRoom={handleCreateRoom}
        error={error}
        isLoading={isLoading}
      />
    );
  }

  // Waiting for game state
  if (!gameState) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-emerald-900 via-green-900 to-teal-900">
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-10 rounded-2xl shadow-2xl border border-white/10 text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-yellow-400 mx-auto mb-4"></div>
          <p className="text-white text-lg mb-2">Waiting for game state...</p>
          {roomInfo.code !== 'QUICK' && (
            <div className="mt-4 p-4 bg-gray-700/50 rounded-lg">
              <p className="text-gray-400 text-sm">Room Code:</p>
              <p className="text-yellow-400 text-2xl font-mono tracking-widest">{roomInfo.code}</p>
              <p className="text-gray-500 text-xs mt-2">Share this code with friends</p>
            </div>
          )}
          <button 
            onClick={handleLeaveRoom}
            className="mt-6 text-gray-400 hover:text-white text-sm transition-colors"
          >
            Leave Room
          </button>
        </div>
      </div>
    );
  }

  // Game table
  return (
    <div className="relative">
      {/* Room code display - bottom-left */}
      {roomInfo.code !== 'QUICK' && gameState.phase === 'lobby' && (
        <div className="absolute bottom-4 left-4 z-50 bg-gray-800/90 backdrop-blur-sm p-3 rounded-lg border border-white/10">
          <p className="text-gray-400 text-xs">Room Code:</p>
          <p className="text-yellow-400 text-lg font-mono tracking-wider">{roomInfo.code}</p>
        </div>
      )}
      
      <GameTable 
        gameState={gameState} 
        playerId={playerId}
        isHost={roomInfo.isHost}
        onBid={handleBid}
        onSelectTrump={handleSelectTrump}
        onPlayCard={handlePlayCard}
        onStartGame={handleStartGame}
        onAddBot={handleAddBot}
        onRemoveBot={handleRemoveBot}
        onExitRoom={handleExitRoom}
      />

      {/* Error toast */}
      {error && (
        <div className="fixed bottom-4 right-4 z-50 bg-red-500/90 backdrop-blur-sm text-white px-4 py-3 rounded-lg shadow-lg animate-slide-up">
          {error}
        </div>
      )}
    </div>
  );
}

export default App;
