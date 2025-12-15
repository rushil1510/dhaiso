import React, { useState } from 'react';

interface LobbyProps {
  onJoin: (name: string) => void;
}

export const Lobby: React.FC<LobbyProps> = ({ onJoin }) => {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onJoin(name);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-emerald-900 via-green-900 to-teal-900 font-inter">
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-10 rounded-2xl shadow-2xl w-[420px] border border-white/10">
        <h1 className="text-4xl font-bold text-center mb-8 text-white font-poppins bg-gradient-to-r from-yellow-300 to-yellow-500 bg-clip-text text-transparent">Dhaiso</h1>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-200 mb-2">Enter your name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 20))}
              className="block w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-white placeholder-gray-400 transition-all"
              placeholder="Player Name"
              maxLength={20}
              required
            />
            <p className="text-xs text-gray-400 mt-2">{name.length}/20 characters</p>
          </div>
          <button
            type="submit"
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-lg text-base font-semibold text-gray-900 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-all transform hover:scale-105"
          >
            Join Game
          </button>
        </form>
      </div>
      <div className="mt-6 text-gray-300 text-sm text-center">
        <p>5 players needed to start</p>
      </div>
    </div>
  );
};
