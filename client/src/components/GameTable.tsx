import React from 'react';
import type { GameState, ICard, Suit } from '../types';
import { Card } from './Card';

// Suit symbol mapping for display
const suitSymbols: Record<Suit, string> = {
  'H': '♥',
  'D': '♦',
  'C': '♣',
  'S': '♠'
};

const suitColors: Record<Suit, string> = {
  'H': 'text-red-500',
  'D': 'text-red-500',
  'C': 'text-white',
  'S': 'text-white'
};

interface GameTableProps {
  gameState: GameState;
  playerId: string;
  isHost: boolean;
  onBid: (amount: number) => void;
  onSelectTrump: (suit: Suit, friends: any[]) => void;
  onPlayCard: (card: ICard) => void;
  onStartGame: () => void;
  onAddBot?: () => void;
  onRemoveBot?: (botId: string) => void;
  onExitRoom?: () => void;
}

const TrumpSelectionModal: React.FC<{ onSelect: (suit: Suit, friends: any[]) => void }> = ({ onSelect }) => {
    const [suit, setSuit] = React.useState<Suit>('S');
    const [friend1, setFriend1] = React.useState({ rank: 'K', suit: 'H' });
    const [friend2, setFriend2] = React.useState({ rank: 'K', suit: 'D' });
    const [error, setError] = React.useState('');

    const isAceOfSpades = (friend: { rank: string, suit: string }) => 
        friend.rank === 'A' && friend.suit === 'S';

    const handleSubmit = () => {
        // Validate: Ace of Spades cannot be a friend
        if (isAceOfSpades(friend1) || isAceOfSpades(friend2)) {
            setError('Ace of Spades (A♠) cannot be selected as a friend card!');
            return;
        }
        setError('');
        onSelect(suit, [friend1, friend2]);
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg text-black max-w-md">
                <h2 className="text-xl font-bold mb-4">Select Trump & Friends</h2>
                
                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4">
                        {error}
                    </div>
                )}
                
                <div className="mb-4">
                    <label className="block font-bold">Trump Suit</label>
                    <select value={suit} onChange={e => setSuit(e.target.value as Suit)} className="border p-2 rounded w-full">
                        <option value="S">Spades ♠</option>
                        <option value="H">Hearts ♥</option>
                        <option value="C">Clubs ♣</option>
                        <option value="D">Diamonds ♦</option>
                    </select>
                </div>

                <div className="mb-4">
                    <label className="block font-bold">Friend 1</label>
                    <div className="flex gap-2">
                        <select 
                            value={friend1.rank} 
                            onChange={e => setFriend1({...friend1, rank: e.target.value})} 
                            className={`border p-2 rounded flex-1 ${isAceOfSpades({...friend1, rank: friend1.rank}) ? 'border-red-500 bg-red-50' : ''}`}
                        >
                            {['5','6','7','8','9','10','J','Q','K','A'].map(r => (
                                <option 
                                    key={r} 
                                    value={r}
                                    disabled={r === 'A' && friend1.suit === 'S'}
                                    className={r === 'A' && friend1.suit === 'S' ? 'text-gray-400' : ''}
                                >
                                    {r} {r === 'A' && friend1.suit === 'S' ? '(not allowed)' : ''}
                                </option>
                            ))}
                        </select>
                        <select 
                            value={friend1.suit} 
                            onChange={e => setFriend1({...friend1, suit: e.target.value})} 
                            className={`border p-2 rounded ${isAceOfSpades(friend1) ? 'border-red-500 bg-red-50' : ''}`}
                        >
                            <option value="S">♠</option><option value="H">♥</option><option value="C">♣</option><option value="D">♦</option>
                        </select>
                    </div>
                    {isAceOfSpades(friend1) && <p className="text-red-500 text-sm mt-1">⚠️ A♠ not allowed</p>}
                </div>

                <div className="mb-4">
                    <label className="block font-bold">Friend 2</label>
                    <div className="flex gap-2">
                        <select 
                            value={friend2.rank} 
                            onChange={e => setFriend2({...friend2, rank: e.target.value})} 
                            className={`border p-2 rounded flex-1 ${isAceOfSpades({...friend2, rank: friend2.rank}) ? 'border-red-500 bg-red-50' : ''}`}
                        >
                            {['5','6','7','8','9','10','J','Q','K','A'].map(r => (
                                <option 
                                    key={r} 
                                    value={r}
                                    disabled={r === 'A' && friend2.suit === 'S'}
                                    className={r === 'A' && friend2.suit === 'S' ? 'text-gray-400' : ''}
                                >
                                    {r} {r === 'A' && friend2.suit === 'S' ? '(not allowed)' : ''}
                                </option>
                            ))}
                        </select>
                        <select 
                            value={friend2.suit} 
                            onChange={e => setFriend2({...friend2, suit: e.target.value})} 
                            className={`border p-2 rounded ${isAceOfSpades(friend2) ? 'border-red-500 bg-red-50' : ''}`}
                        >
                            <option value="S">♠</option><option value="H">♥</option><option value="C">♣</option><option value="D">♦</option>
                        </select>
                    </div>
                    {isAceOfSpades(friend2) && <p className="text-red-500 text-sm mt-1">⚠️ A♠ not allowed</p>}
                </div>

                <button 
                    onClick={handleSubmit} 
                    className={`px-4 py-2 rounded w-full font-bold ${
                        isAceOfSpades(friend1) || isAceOfSpades(friend2) 
                            ? 'bg-gray-400 cursor-not-allowed' 
                            : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                    disabled={isAceOfSpades(friend1) || isAceOfSpades(friend2)}
                >
                    Confirm
                </button>
            </div>
        </div>
    );
};


export const GameTable: React.FC<GameTableProps> = ({ 
  gameState, 
  playerId, 
  isHost,
  onBid, 
  onSelectTrump, 
  onPlayCard, 
  onStartGame,
  onAddBot,
  onRemoveBot,
  onExitRoom
}) => {
  const me = gameState.players.find(p => p.id === playerId);
  const [showExitConfirm, setShowExitConfirm] = React.useState(false);
  
  if (!me) return <div className="flex items-center justify-center h-screen text-white font-inter">Loading...</div>;

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-emerald-900 via-green-900 to-teal-900 p-4 font-inter">
      {/* Header Info */}
      <div className="flex justify-between text-white mb-4 bg-black/40 p-3 rounded-xl backdrop-blur-md border border-white/10 shadow-lg">
        <div className="flex gap-6 items-center text-sm">
            <div className="font-semibold"><span className="text-gray-300">Phase:</span> <span className="text-white">{gameState.phase}</span></div>
            <div className="font-semibold"><span className="text-gray-300">Bid:</span> <span className="text-yellow-300">{gameState.bid}</span></div>
            <div className="font-semibold"><span className="text-gray-300">Caller:</span> <span className="text-white">{gameState.callerId ? gameState.players.find(p => p.id === gameState.callerId)?.name : 'None'}</span></div>
            <div className="font-semibold"><span className="text-gray-300">Trump:</span> {gameState.trumpSuit ? <span className={`text-2xl ${suitColors[gameState.trumpSuit]}`}>{suitSymbols[gameState.trumpSuit]}</span> : <span className="text-white">None</span>}</div>
            {gameState.friendCards && gameState.friendCards.length > 0 && (
              <div className="font-semibold"><span className="text-gray-300">Friends:</span> {gameState.friendCards.map((card, i) => <span key={i} className={`ml-1 font-bold ${suitColors[card.suit]}`}>{card.rank}{suitSymbols[card.suit]}</span>)}</div>
            )}
        </div>
        <div className="flex gap-6 items-center text-sm">
            <div className="font-semibold"><span className="text-gray-300">My Score:</span> <span className="text-green-400 text-lg font-bold">{me?.pointsWon || 0}</span></div>
            <div className="font-semibold"><span className="text-gray-300">Turn:</span> <span className="text-yellow-300 text-base font-bold">{gameState.players[gameState.currentTurn]?.name || 'Unknown'}</span></div>
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

        {/* Other Players - Circular positioning with specific angles */}
        {gameState.players.filter(p => p.id !== playerId).map((player, idx) => {
            // Use specified angles for even distribution: 36°, 72°, 108°, 154°
            // Measured from horizontal axis (0° at right, counter-clockwise)
            const angles = [36, 72, 108, 154];
            const angle = angles[idx];
            
            // Convert to radians - no adjustment needed, using horizontal as base
            const angleRad = angle * (Math.PI / 180);
            const radiusX = 44; // Horizontal radius percentage
            const radiusY = 36; // Vertical radius percentage
            
            // Calculate x and y positions as percentages
            const x = 50 + radiusX * Math.cos(angleRad);
            const y = 50 - radiusY * Math.sin(angleRad); // Negative because CSS y goes down
            
            return (
                <div 
                    key={player.id} 
                    className="absolute p-3 bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl text-white backdrop-blur-md border border-white/20 shadow-2xl flex flex-col items-center gap-1.5 min-w-[130px] transition-all duration-300 hover:scale-105"
                    style={{
                        left: `${x}%`,
                        top: `${y}%`,
                        transform: 'translate(-50%, -50%)'
                    }}
                >
                    <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-xl font-bold border-3 border-white/30 shadow-lg">
                        {player.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="font-semibold text-sm truncate max-w-[115px] font-poppins" title={player.name}>{player.name}</div>
                    <div className="text-xs text-gray-300">{player.hand.filter(c => c === null).length + player.hand.filter(c => c !== null).length} Cards</div>
                    <div className="text-xs text-green-400 font-semibold">Score: {player.pointsWon || 0}</div>
                    {player.hasPassed && <div className="text-red-400 font-bold text-xs bg-red-900/70 px-2 py-0.5 rounded-full">Passed</div>}
                    {gameState.currentTurn === gameState.players.findIndex(p => p.id === player.id) && (
                        <div className="absolute -top-2 -right-2 w-5 h-5 bg-yellow-400 rounded-full animate-ping shadow-lg"></div>
                    )}
                    {gameState.currentTurn === gameState.players.findIndex(p => p.id === player.id) && (
                        <div className="absolute -top-2 -right-2 w-5 h-5 bg-yellow-400 rounded-full shadow-lg"></div>
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
                
                {/* Bot Controls - Host Only */}
                {isHost && (
                  <div className="mb-4 space-y-3">
                    <div className="flex gap-2 justify-center">
                      <button 
                        onClick={onAddBot}
                        disabled={gameState.players.length >= 5}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2"
                      >
                        🤖 Add Bot
                      </button>
                    </div>
                    
                    {/* List of bots with remove buttons */}
                    {gameState.players.filter(p => p.id.startsWith('bot-')).length > 0 && (
                      <div className="flex flex-wrap gap-2 justify-center">
                        {gameState.players.filter(p => p.id.startsWith('bot-')).map(bot => (
                          <button
                            key={bot.id}
                            onClick={() => onRemoveBot?.(bot.id)}
                            className="bg-red-600/80 hover:bg-red-700 text-white px-3 py-1 rounded text-sm flex items-center gap-1 transition-colors"
                          >
                            ✕ {bot.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                
                {gameState.players.length >= 5 && (
                     <button onClick={onStartGame} className="bg-yellow-500 hover:bg-yellow-600 text-black px-6 py-3 rounded-lg font-bold transition-colors">
                         Start Game
                     </button>
                )}
            </div>
        )}

        {/* Game Ended Results */}
        {gameState.phase === 'ended' && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
                <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-8 rounded-xl shadow-2xl text-white max-w-lg text-center border border-gray-700">
                    <h2 className={`text-4xl font-bold mb-6 ${gameState.scores.callerWins ? 'text-yellow-400' : 'text-blue-400'}`}>
                        {gameState.scores.callerWins ? '🎉 Caller Team Wins!' : '🛡️ Defense Wins!'}
                    </h2>
                    
                    <div className="space-y-4 text-xl mb-6">
                        <div className="flex justify-between items-center bg-yellow-900/30 p-3 rounded-lg border border-yellow-700/50">
                            <span className="font-bold text-yellow-300">Caller Team:</span>
                            <span className="text-2xl font-bold">{gameState.scores.callerTeam} pts</span>
                        </div>
                        <div className="flex justify-between items-center bg-blue-900/30 p-3 rounded-lg border border-blue-700/50">
                            <span className="font-bold text-blue-300">Defense Team:</span>
                            <span className="text-2xl font-bold">{gameState.scores.defenseTeam} pts</span>
                        </div>
                        <div className="text-gray-400 text-lg pt-2 border-t border-gray-600">
                            Bid was: <span className="font-bold text-white">{gameState.scores.bid}</span>
                        </div>
                    </div>
                    
                    <div className="text-sm text-gray-400 mb-4">
                        Caller: {gameState.players.find(p => p.id === gameState.callerId)?.name}
                    </div>
                    
                    <button 
                        onClick={onStartGame} 
                        className="bg-gradient-to-r from-green-500 to-green-600 text-white px-8 py-3 rounded-lg font-bold text-lg hover:from-green-600 hover:to-green-700 transition-all shadow-lg"
                    >
                        Play Again
                    </button>
                </div>
            </div>
        )}
      </div>

      {/* Exit Room Button - visible during game (not lobby or ended) */}
      {gameState.phase !== 'lobby' && gameState.phase !== 'ended' && onExitRoom && (
        <button 
          onClick={() => setShowExitConfirm(true)}
          className="absolute top-4 right-4 z-40 bg-red-600/80 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2"
        >
          🚪 Exit Room
        </button>
      )}

      {/* Exit Confirmation Modal */}
      {showExitConfirm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-8 rounded-xl shadow-2xl text-white max-w-md text-center border border-red-500/30">
            <h2 className="text-2xl font-bold mb-4 text-red-400">⚠️ Exit Game?</h2>
            
            <p className="text-gray-300 mb-6">
              If you leave now, <span className="font-bold text-yellow-400">a bot will take your place</span> and play on your behalf. 
              You won't be able to rejoin this game.
            </p>
            
            <div className="flex gap-4 justify-center">
              <button 
                onClick={() => setShowExitConfirm(false)}
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-bold transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  setShowExitConfirm(false);
                  onExitRoom?.();
                }}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-bold transition-colors"
              >
                Yes, Exit
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="absolute bottom-2 right-2 text-xs text-white/30">v1.4</div>
    </div>
  );
};
