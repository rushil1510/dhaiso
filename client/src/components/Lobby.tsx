import React, { useState } from 'react';

interface LobbyProps {
  onJoin: (name: string, roomCode?: string) => void;
  onCreateRoom: (name: string) => void;
  error?: string;
  isLoading?: boolean;
}

export const Lobby: React.FC<LobbyProps> = ({ onJoin, onCreateRoom, error, isLoading }) => {
  const [name, setName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [mode, setMode] = useState<'choose' | 'create' | 'join'>('choose');

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onCreateRoom(name.trim());
    }
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && roomCode.trim()) {
      onJoin(name.trim(), roomCode.trim().toUpperCase());
    }
  };

  // Main choice screen
  if (mode === 'choose') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-emerald-900 via-green-900 to-teal-900 font-inter p-4">
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-10 rounded-2xl shadow-2xl w-[420px] border border-white/10">
          <h1 className="text-4xl font-bold text-center mb-8 text-white font-poppins bg-gradient-to-r from-yellow-300 to-yellow-500 bg-clip-text text-transparent">
            Dhaiso
          </h1>
          
          <div className="space-y-4">
            {/* Create Room Button */}
            <button
              onClick={() => setMode('create')}
              className="w-full flex flex-col items-center py-4 px-4 border border-transparent rounded-lg shadow-lg text-base font-semibold text-gray-900 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-all transform hover:scale-105"
            >
              <span className="text-lg">🎮 Create Room</span>
              <span className="text-xs font-normal opacity-75 mt-1">Start a new game and invite friends</span>
            </button>

            {/* Join Room Button */}
            <button
              onClick={() => setMode('join')}
              className="w-full flex flex-col items-center py-4 px-4 border-2 border-yellow-400 rounded-lg shadow-lg text-base font-semibold text-yellow-400 bg-transparent hover:bg-yellow-400/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-all transform hover:scale-105"
            >
              <span className="text-lg">🔗 Join Room</span>
              <span className="text-xs font-normal opacity-75 mt-1">Enter a room code to join</span>
            </button>

            {/* Quick Play (Legacy) */}
            <div className="relative flex items-center justify-center my-6">
              <div className="border-t border-gray-600 w-full"></div>
              <span className="bg-gray-800 px-4 text-gray-400 text-sm absolute">or</span>
            </div>

            <button
              onClick={() => setMode('create')}
              className="w-full py-3 px-4 text-gray-400 hover:text-gray-200 text-sm transition-colors"
            >
              Quick Play (Random Room)
            </button>
          </div>
        </div>
        
        {/* How to Play - Collapsible Rules */}
        <details className="mt-6 w-[420px] bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border border-white/10 overflow-hidden">
          <summary className="p-4 cursor-pointer text-yellow-400 font-semibold flex items-center justify-between hover:bg-white/5 transition-colors">
            <span>📖 How to Play</span>
            <span className="text-gray-400 text-sm">Click to expand</span>
          </summary>
          <div className="p-4 pt-0 text-gray-300 text-sm space-y-4">
            {/* Card Values */}
            <div>
              <h3 className="text-yellow-400 font-semibold mb-2">🎴 Card Values</h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-gray-700/50 p-2 rounded">Ace (A) = <span className="text-yellow-400">20 pts</span></div>
                <div className="bg-gray-700/50 p-2 rounded">King (K) = <span className="text-yellow-400">15 pts</span></div>
                <div className="bg-gray-700/50 p-2 rounded">Queen (Q) = <span className="text-yellow-400">10 pts</span></div>
                <div className="bg-gray-700/50 p-2 rounded">Jack (J) = <span className="text-yellow-400">5 pts</span></div>
                <div className="bg-red-900/50 p-2 rounded col-span-2 text-center">
                  Queen of Spades (Q♠) = <span className="text-red-400 font-bold">60 pts!</span>
                </div>
              </div>
            </div>
            
            {/* Game Flow */}
            <div>
              <h3 className="text-yellow-400 font-semibold mb-2">🎲 Game Flow</h3>
              <ol className="list-decimal list-inside space-y-1 text-xs">
                <li><span className="text-gray-400">Bidding</span> - Bid on points you can win (min: 170)</li>
                <li><span className="text-gray-400">Trump Selection</span> - Winner picks trump suit & 2 friend cards</li>
                <li><span className="text-gray-400">Playing</span> - 8 tricks, must follow suit if possible</li>
                <li><span className="text-gray-400">Scoring</span> - Caller team needs bid points to win</li>
              </ol>
            </div>

            {/* Key Rules */}
            <div>
              <h3 className="text-yellow-400 font-semibold mb-2">⚡ Key Rules</h3>
              <ul className="space-y-1 text-xs">
                <li>• <span className="text-gray-400">5 players</span> required</li>
                <li>• <span className="text-gray-400">40 cards</span> (no 2s, 3s, 4s)</li>
                <li>• <span className="text-gray-400">A♠</span> cannot be a friend card</li>
                <li>• <span className="text-gray-400">Trump</span> beats all other suits</li>
              </ul>
            </div>
          </div>
        </details>
        
        <div className="mt-4 text-gray-400 text-xs text-center">
          <p>5 players needed to start</p>
        </div>
      </div>
    );
  }

  // Create Room Form
  if (mode === 'create') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-emerald-900 via-green-900 to-teal-900 font-inter">
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-10 rounded-2xl shadow-2xl w-[420px] border border-white/10">
          <button 
            onClick={() => setMode('choose')}
            className="text-gray-400 hover:text-white mb-4 flex items-center transition-colors"
          >
            ← Back
          </button>
          
          <h1 className="text-3xl font-bold text-center mb-2 text-white font-poppins">
            🎮 Create Room
          </h1>
          <p className="text-gray-400 text-center mb-8 text-sm">
            You'll get a room code to share with friends
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleCreateRoom} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-200 mb-2">Your Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value.slice(0, 20))}
                className="block w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-white placeholder-gray-400 transition-all"
                placeholder="Enter your name"
                maxLength={20}
                required
                disabled={isLoading}
              />
              <p className="text-xs text-gray-400 mt-2">{name.length}/20 characters</p>
            </div>
            
            <button
              type="submit"
              disabled={isLoading || !name.trim()}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-lg text-base font-semibold text-gray-900 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating...
                </span>
              ) : (
                'Create Room'
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Join Room Form
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-emerald-900 via-green-900 to-teal-900 font-inter">
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-10 rounded-2xl shadow-2xl w-[420px] border border-white/10">
        <button 
          onClick={() => setMode('choose')}
          className="text-gray-400 hover:text-white mb-4 flex items-center transition-colors"
        >
          ← Back
        </button>
        
        <h1 className="text-3xl font-bold text-center mb-2 text-white font-poppins">
          🔗 Join Room
        </h1>
        <p className="text-gray-400 text-center mb-8 text-sm">
          Enter the room code shared by your friend
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleJoinRoom} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-200 mb-2">Room Code</label>
            <input
              type="text"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase().slice(0, 6))}
              className="block w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-white placeholder-gray-400 transition-all text-center text-2xl tracking-widest font-mono"
              placeholder="ABC123"
              maxLength={6}
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-200 mb-2">Your Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 20))}
              className="block w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-white placeholder-gray-400 transition-all"
              placeholder="Enter your name"
              maxLength={20}
              required
              disabled={isLoading}
            />
            <p className="text-xs text-gray-400 mt-2">{name.length}/20 characters</p>
          </div>
          
          <button
            type="submit"
            disabled={isLoading || !name.trim() || roomCode.length < 6}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-lg text-base font-semibold text-gray-900 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isLoading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Joining...
              </span>
            ) : (
              'Join Room'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
