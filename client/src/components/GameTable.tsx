import React from 'react';
import type { GameState, ICard, Suit } from '../types';
import { Card } from './Card';

interface GameTableProps {
  gameState: GameState;
  playerId: string;
  onBid: (amount: number) => void;
  onSelectTrump: (suit: Suit, friends: any[]) => void;
  onPlayCard: (card: ICard) => void;
  onStartGame: () => void;
}

const TrumpSelectionModal: React.FC<{ onSelect: (suit: Suit, friends: any[]) => void }> = ({ onSelect }) => {
    const [suit, setSuit] = React.useState<Suit>('S');
    const [friend1, setFriend1] = React.useState({ rank: 'A', suit: 'H' });
    const [friend2, setFriend2] = React.useState({ rank: 'A', suit: 'D' });

    const handleSubmit = () => {
        onSelect(suit, [friend1, friend2]);
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg text-black">
                <h2 className="text-xl font-bold mb-4">Select Trump & Friends</h2>
                
                <div className="mb-4">
                    <label className="block font-bold">Trump Suit</label>
                    <select value={suit} onChange={e => setSuit(e.target.value as Suit)} className="border p-2 rounded">
                        <option value="S">Spades ♠</option>
                        <option value="H">Hearts ♥</option>
                        <option value="C">Clubs ♣</option>
                        <option value="D">Diamonds ♦</option>
                    </select>
                </div>

                <div className="mb-4">
                    <label className="block font-bold">Friend 1</label>
                    <div className="flex gap-2">
                        <select value={friend1.rank} onChange={e => setFriend1({...friend1, rank: e.target.value})} className="border p-2 rounded">
                            {['5','6','7','8','9','10','J','Q','K','A'].map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                        <select value={friend1.suit} onChange={e => setFriend1({...friend1, suit: e.target.value})} className="border p-2 rounded">
                            <option value="S">♠</option><option value="H">♥</option><option value="C">♣</option><option value="D">♦</option>
                        </select>
                    </div>
                </div>

                <div className="mb-4">
                    <label className="block font-bold">Friend 2</label>
                    <div className="flex gap-2">
                        <select value={friend2.rank} onChange={e => setFriend2({...friend2, rank: e.target.value})} className="border p-2 rounded">
                            {['5','6','7','8','9','10','J','Q','K','A'].map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                        <select value={friend2.suit} onChange={e => setFriend2({...friend2, suit: e.target.value})} className="border p-2 rounded">
                            <option value="S">♠</option><option value="H">♥</option><option value="C">♣</option><option value="D">♦</option>
                        </select>
                    </div>
                </div>

                <button onClick={handleSubmit} className="bg-green-600 text-white px-4 py-2 rounded w-full">Confirm</button>
            </div>
        </div>
    );
};

export const GameTable: React.FC<GameTableProps> = ({ gameState, playerId, onBid, onSelectTrump, onPlayCard, onStartGame }) => {
  const me = gameState.players.find(p => p.id === playerId);
  
  if (!me) return <div>Loading...</div>;

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-green-900 to-green-800 p-4 font-serif">
      {/* Header Info */}
      <div className="flex justify-between text-white mb-4 bg-black/30 p-2 rounded-lg backdrop-blur-sm">
        <div className="flex gap-4">
            <span className="font-bold">Phase:</span> {gameState.phase}
            <span className="font-bold ml-4">Bid:</span> {gameState.bid} 
            <span className="font-bold ml-4">Caller:</span> {gameState.callerId ? gameState.players.find(p => p.id === gameState.callerId)?.name : 'None'}
            <span className="font-bold ml-4">Trump:</span> {gameState.trumpSuit ? <span className="text-xl">{gameState.trumpSuit}</span> : 'None'}
        </div>
        <div>
            <span className="font-bold">Turn:</span> <span className="text-yellow-300 text-lg">{gameState.players[gameState.currentTurn]?.name || 'Unknown'}</span>
        </div>
      </div>

      {/* Main Table Area */}
      <div className="flex-1 relative flex items-center justify-center perspective-1000">
        {/* Pot Area */}
        <div className="relative w-96 h-64 bg-green-700/50 rounded-full border-4 border-green-900/50 flex items-center justify-center shadow-inner">
            {gameState.pot.length === 0 && gameState.phase === 'playing' && (
                <div className="text-white/50 font-bold">Waiting for {gameState.players[gameState.currentTurn]?.name || 'Unknown'} to play...</div>
            )}
            <div className="flex gap-4 items-center justify-center">
            {gameState.pot.map((item, idx) => (
                <div key={idx} className={`relative transition-all duration-500 ${idx === gameState.pot.length - 1 ? 'scale-110 z-10' : 'scale-100'}`}>
                <Card card={item.card} className="shadow-2xl" />
                <div className="absolute -bottom-8 w-full text-center text-sm font-bold text-white bg-black/60 rounded px-1 py-0.5 whitespace-nowrap">
                    {gameState.players.find(p => p.id === item.playerId)?.name}
                </div>
                </div>
            ))}
            </div>
        </div>

        {/* Other Players */}
        {gameState.players.filter(p => p.id !== playerId).map((player, idx) => {
            return (
                <div key={player.id} className={`absolute p-4 bg-black/40 rounded-xl text-white backdrop-blur-sm border border-white/10 shadow-lg flex flex-col items-center gap-2
                    ${idx === 0 ? 'top-8 left-1/2 -translate-x-1/2' : 
                    idx === 1 ? 'right-12 top-1/3' : 
                    idx === 2 ? 'right-12 bottom-1/3' :
                    'left-12 top-1/2 -translate-y-1/2'} 
                `}>
                    <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center text-xl font-bold border-2 border-gray-500">
                        {player.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="font-bold text-lg">{player.name}</div>
                    <div className="text-sm text-gray-300">{player.hand.filter(c => c === null).length + player.hand.filter(c => c !== null).length} Cards</div>
                    {player.hasPassed && <div className="text-red-400 font-bold text-sm bg-red-900/50 px-2 rounded">Passed</div>}
                    {gameState.currentTurn === gameState.players.findIndex(p => p.id === player.id) && (
                        <div className="absolute -top-2 -right-2 w-4 h-4 bg-yellow-400 rounded-full animate-ping"></div>
                    )}
                </div>
            );
        })}
      </div>

      {/* My Hand & Controls */}
      <div className="mt-auto">
        <div className="flex justify-center gap-2 mb-4">
          {me?.hand.map((card, idx) => (
            <Card 
              key={idx} 
              card={card} 
              onClick={() => card && onPlayCard(card)}
              className={gameState.currentTurn === gameState.players.findIndex(p => p.id === playerId) ? 'ring-2 ring-yellow-400' : ''}
            />
          ))}
        </div>

        {/* Controls Overlay */}
        {gameState.phase === 'bidding' && gameState.currentTurn === gameState.players.findIndex(p => p.id === playerId) && (
          <div className="flex justify-center gap-4 bg-black/50 p-4 rounded-t-lg">
            <button onClick={() => onBid(0)} className="bg-red-500 text-white px-4 py-2 rounded">Pass</button>
            <button onClick={() => onBid(Math.max(gameState.bid + 5, 170))} className="bg-blue-500 text-white px-4 py-2 rounded">Bid {Math.max(gameState.bid + 5, 170)}</button>
            <button onClick={() => onBid(Math.max(gameState.bid + 10, 175))} className="bg-blue-600 text-white px-4 py-2 rounded">Bid {Math.max(gameState.bid + 10, 175)}</button>
          </div>
        )}

        {/* Trump Selection Overlay */}
        {gameState.phase === 'trump_selection' && gameState.callerId === playerId && (
            <TrumpSelectionModal onSelect={onSelectTrump} />
        )}

        {/* Start Game Button (Lobby) */}
        {gameState.phase === 'lobby' && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                <h2 className="text-2xl font-bold mb-4">Waiting for players... ({gameState.players.length}/5)</h2>
                {gameState.players.length >= 5 && (
                     <button onClick={onStartGame} className="bg-yellow-500 text-black px-6 py-3 rounded-lg font-bold">
                         Start Game
                     </button>
                )}
                {/* Note: I need to pass onStartGame prop or handle it via socket in App */}
            </div>
        )}
      </div>
      <div className="absolute bottom-2 right-2 text-xs text-white/30">v1.2</div>
    </div>
  );
};
