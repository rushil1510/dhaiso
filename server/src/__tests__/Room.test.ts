import { Room, AddPlayerResult } from '../classes/Room';
import { Server } from 'socket.io';

// Mock Socket.IO Server
const mockIo = {
    emit: jest.fn(),
    to: jest.fn().mockReturnThis(),
} as unknown as Server;

describe('Room', () => {
    let room: Room;

    beforeEach(() => {
        jest.clearAllMocks();
        room = new Room(mockIo, 'ABC123');
    });

    describe('constructor', () => {
        it('should create a room with the given code', () => {
            expect(room.code).toBe('ABC123');
        });

        it('should initialize with null host', () => {
            expect(room.hostId).toBeNull();
        });

        it('should initialize with creation timestamp', () => {
            expect(room.createdAt).toBeInstanceOf(Date);
        });
    });

    describe('addPlayer', () => {
        it('should add a player successfully', () => {
            const result = room.addPlayer('socket-1', 'Alice', '192.168.1.1');

            expect(result.success).toBe(true);
            expect(room.getPlayerCount()).toBe(1);
        });

        it('should set first player as host', () => {
            room.addPlayer('socket-1', 'Alice', '192.168.1.1');

            expect(room.hostId).toBe('socket-1');
        });

        it('should not set subsequent players as host', () => {
            room.addPlayer('socket-1', 'Alice', '192.168.1.1');
            room.addPlayer('socket-2', 'Bob', '192.168.1.2');

            expect(room.hostId).toBe('socket-1');
        });

        it('should reject players with duplicate names (case-insensitive)', () => {
            room.addPlayer('socket-1', 'Alice', '192.168.1.1');
            const result = room.addPlayer('socket-2', 'alice', '192.168.1.2');

            expect(result.success).toBe(false);
            expect(result.error).toBe('NAME_TAKEN');
        });

        it('should reject players with duplicate IPs (in production)', () => {
            // Note: In development, localhost IPs bypass the check
            const originalEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = 'production';

            room.addPlayer('socket-1', 'Alice', '192.168.1.1');
            const result = room.addPlayer('socket-2', 'Bob', '192.168.1.1');

            expect(result.success).toBe(false);
            expect(result.error).toBe('IP_ALREADY_IN_ROOM');

            process.env.NODE_ENV = originalEnv;
        });

        it('should allow localhost IPs in development', () => {
            process.env.NODE_ENV = 'development';

            room.addPlayer('socket-1', 'Alice', '127.0.0.1');
            const result = room.addPlayer('socket-2', 'Bob', '127.0.0.1');

            expect(result.success).toBe(true);
        });

        it('should reject when room is full', () => {
            // Add 5 players (max)
            room.addPlayer('socket-1', 'Player1', '10.0.0.1');
            room.addPlayer('socket-2', 'Player2', '10.0.0.2');
            room.addPlayer('socket-3', 'Player3', '10.0.0.3');
            room.addPlayer('socket-4', 'Player4', '10.0.0.4');
            room.addPlayer('socket-5', 'Player5', '10.0.0.5');

            const result = room.addPlayer('socket-6', 'Player6', '10.0.0.6');

            expect(result.success).toBe(false);
            expect(result.error).toBe('ROOM_FULL');
        });
    });

    describe('removePlayer', () => {
        beforeEach(() => {
            room.addPlayer('socket-1', 'Alice', '192.168.1.1');
            room.addPlayer('socket-2', 'Bob', '192.168.1.2');
        });

        it('should remove a player', () => {
            room.removePlayer('socket-2');

            expect(room.getPlayerCount()).toBe(1);
        });

        it('should reassign host if host leaves', () => {
            room.removePlayer('socket-1');

            expect(room.hostId).toBe('socket-2');
        });
    });

    describe('isNameTaken', () => {
        beforeEach(() => {
            room.addPlayer('socket-1', 'Alice', '192.168.1.1');
        });

        it('should return true for exact match', () => {
            expect(room.isNameTaken('Alice')).toBe(true);
        });

        it('should return true for case-insensitive match', () => {
            expect(room.isNameTaken('alice')).toBe(true);
            expect(room.isNameTaken('ALICE')).toBe(true);
        });

        it('should return false for different names', () => {
            expect(room.isNameTaken('Bob')).toBe(false);
        });
    });

    describe('isFull', () => {
        it('should return false when room has space', () => {
            room.addPlayer('socket-1', 'Player1', '10.0.0.1');
            expect(room.isFull()).toBe(false);
        });

        it('should return true when room has 5 players', () => {
            room.addPlayer('socket-1', 'Player1', '10.0.0.1');
            room.addPlayer('socket-2', 'Player2', '10.0.0.2');
            room.addPlayer('socket-3', 'Player3', '10.0.0.3');
            room.addPlayer('socket-4', 'Player4', '10.0.0.4');
            room.addPlayer('socket-5', 'Player5', '10.0.0.5');

            expect(room.isFull()).toBe(true);
        });
    });

    describe('isEmpty', () => {
        it('should return true for new room', () => {
            expect(room.isEmpty()).toBe(true);
        });

        it('should return false when players are present', () => {
            room.addPlayer('socket-1', 'Alice', '192.168.1.1');
            expect(room.isEmpty()).toBe(false);
        });

        it('should return true after all players leave', () => {
            room.addPlayer('socket-1', 'Alice', '192.168.1.1');
            room.removePlayer('socket-1');
            expect(room.isEmpty()).toBe(true);
        });
    });

    describe('isGameInProgress', () => {
        it('should return false for new room', () => {
            expect(room.isGameInProgress()).toBe(false);
        });
    });

    describe('getGame', () => {
        it('should return the game instance', () => {
            const game = room.getGame();
            expect(game).toBeDefined();
            expect(game.gameState).toBeDefined();
        });
    });

    describe('serialize', () => {
        it('should return serializable room data', () => {
            room.addPlayer('socket-1', 'Alice', '192.168.1.1');

            const data = room.serialize();

            expect(data).toHaveProperty('code', 'ABC123');
            expect(data).toHaveProperty('hostId', 'socket-1');
            expect(data).toHaveProperty('createdAt');
            expect(data).toHaveProperty('playerCount', 1);
        });
    });

    describe('isBot', () => {
        it('should return true for bot IDs', () => {
            expect(room.isBot('bot-123456-1')).toBe(true);
            expect(room.isBot('bot-999-2')).toBe(true);
        });

        it('should return false for regular player IDs', () => {
            expect(room.isBot('socket-123')).toBe(false);
            expect(room.isBot('player-abc')).toBe(false);
        });
    });

    describe('addBot', () => {
        beforeEach(() => {
            room.addPlayer('socket-1', 'Alice', '192.168.1.1');
        });

        it('should add a bot when called by host', () => {
            const result = room.addBot('socket-1');

            expect(result.success).toBe(true);
            expect(result.botId).toBeDefined();
            expect(result.botName).toContain('Bot');
            expect(room.getPlayerCount()).toBe(2);
        });

        it('should reject when called by non-host', () => {
            room.addPlayer('socket-2', 'Bob', '192.168.1.2');
            const result = room.addBot('socket-2');

            expect(result.success).toBe(false);
            expect(result.error).toBe('NOT_HOST');
        });

        it('should reject when room is full', () => {
            room.addPlayer('socket-2', 'P2', '10.0.0.2');
            room.addPlayer('socket-3', 'P3', '10.0.0.3');
            room.addPlayer('socket-4', 'P4', '10.0.0.4');
            room.addPlayer('socket-5', 'P5', '10.0.0.5');

            const result = room.addBot('socket-1');

            expect(result.success).toBe(false);
            expect(result.error).toBe('ROOM_FULL');
        });

        it('should reject during game', () => {
            room.addPlayer('socket-2', 'P2', '10.0.0.2');
            room.addPlayer('socket-3', 'P3', '10.0.0.3');
            room.addPlayer('socket-4', 'P4', '10.0.0.4');
            room.addPlayer('socket-5', 'P5', '10.0.0.5');
            room.startGame('socket-1');

            const result = room.addBot('socket-1');

            expect(result.success).toBe(false);
            expect(result.error).toBe('GAME_IN_PROGRESS');
        });

        it('should add multiple bots with unique names', () => {
            const result1 = room.addBot('socket-1');
            const result2 = room.addBot('socket-1');

            expect(result1.success).toBe(true);
            expect(result2.success).toBe(true);
            expect(result1.botName).not.toBe(result2.botName);
            expect(room.getPlayerCount()).toBe(3);
        });
    });

    describe('getBots', () => {
        beforeEach(() => {
            room.addPlayer('socket-1', 'Alice', '192.168.1.1');
        });

        it('should return empty array when no bots', () => {
            expect(room.getBots()).toEqual([]);
        });

        it('should return only bots', () => {
            room.addBot('socket-1');
            room.addBot('socket-1');
            room.addPlayer('socket-2', 'Bob', '192.168.1.2');

            const bots = room.getBots();

            expect(bots.length).toBe(2);
            bots.forEach(bot => {
                expect(bot.id.startsWith('bot-')).toBe(true);
            });
        });
    });

    describe('removeBot', () => {
        let botId: string;

        beforeEach(() => {
            room.addPlayer('socket-1', 'Alice', '192.168.1.1');
            const result = room.addBot('socket-1');
            botId = result.botId!;
        });

        it('should remove a bot when called by host', () => {
            const result = room.removeBot('socket-1', botId);

            expect(result.success).toBe(true);
            expect(room.getPlayerCount()).toBe(1);
            expect(room.getBots().length).toBe(0);
        });

        it('should reject when called by non-host', () => {
            room.addPlayer('socket-2', 'Bob', '192.168.1.2');
            const result = room.removeBot('socket-2', botId);

            expect(result.success).toBe(false);
            expect(result.error).toBe('NOT_HOST');
        });

        it('should reject when trying to remove a human player', () => {
            room.addPlayer('socket-2', 'Bob', '192.168.1.2');
            const result = room.removeBot('socket-1', 'socket-2');

            expect(result.success).toBe(false);
            expect(result.error).toBe('NOT_A_BOT');
        });

        it('should reject when bot does not exist', () => {
            const result = room.removeBot('socket-1', 'bot-nonexistent-1');

            expect(result.success).toBe(false);
            expect(result.error).toBe('BOT_NOT_FOUND');
        });

        it('should reject during game', () => {
            room.addBot('socket-1');
            room.addBot('socket-1');
            room.addBot('socket-1');
            room.startGame('socket-1');

            const result = room.removeBot('socket-1', botId);

            expect(result.success).toBe(false);
            expect(result.error).toBe('GAME_IN_PROGRESS');
        });
    });

    describe('bot name bag system', () => {
        beforeEach(() => {
            room.addPlayer('socket-1', 'Alice', '192.168.1.1');
        });

        it('should use bot names from the available bag', () => {
            const result1 = room.addBot('socket-1');
            const result2 = room.addBot('socket-1');
            const result3 = room.addBot('socket-1');
            const result4 = room.addBot('socket-1');

            expect(result1.botName).toBe('Bot Alpha');
            expect(result2.botName).toBe('Bot Beta');
            expect(result3.botName).toBe('Bot Gamma');
            expect(result4.botName).toBe('Bot Delta');
        });

        it('should reuse removed bot names', () => {
            // Add all 4 bots to exhaust the bag
            const result1 = room.addBot('socket-1'); // Alpha
            const result2 = room.addBot('socket-1'); // Beta
            const result3 = room.addBot('socket-1'); // Gamma
            const result4 = room.addBot('socket-1'); // Delta - room is now full

            // Remove one specifically
            const removedName = result2.botName;
            room.removeBot('socket-1', result2.botId!);

            // Add another bot - only the removed name should be available in the bag
            const result5 = room.addBot('socket-1');
            expect(result5.botName).toBe(removedName); // Must be the returned name
        });

        it('should return names to bag when bots are removed', () => {
            // Add all 4 bots
            const bot1 = room.addBot('socket-1'); // Alpha
            const bot2 = room.addBot('socket-1'); // Beta
            const bot3 = room.addBot('socket-1'); // Gamma
            const bot4 = room.addBot('socket-1'); // Delta

            // Room is full, remove all bots
            room.removeBot('socket-1', bot4.botId!);
            room.removeBot('socket-1', bot3.botId!);
            room.removeBot('socket-1', bot2.botId!);
            room.removeBot('socket-1', bot1.botId!);

            // Add bots again - names should be available from the bag
            const newBot1 = room.addBot('socket-1');
            const newBot2 = room.addBot('socket-1');

            // Names should be from the bag (order may vary due to Set)
            expect(['Bot Alpha', 'Bot Beta', 'Bot Gamma', 'Bot Delta']).toContain(newBot1.botName);
            expect(['Bot Alpha', 'Bot Beta', 'Bot Gamma', 'Bot Delta']).toContain(newBot2.botName);
            expect(newBot1.botName).not.toBe(newBot2.botName);
        });
    });

    describe('exitAndReplaceWithBot', () => {
        beforeEach(() => {
            // Add 5 players
            room.addPlayer('socket-1', 'Alice', '192.168.1.1');
            room.addPlayer('socket-2', 'Bob', '192.168.1.2');
            room.addPlayer('socket-3', 'Charlie', '192.168.1.3');
            room.addPlayer('socket-4', 'Diana', '192.168.1.4');
            room.addPlayer('socket-5', 'Eve', '192.168.1.5');
            room.startGame('socket-1');
        });

        it('should replace player with bot during game', () => {
            const result = room.exitAndReplaceWithBot('socket-2');

            expect(result.success).toBe(true);
            expect(room.getPlayerCount()).toBe(5); // Still 5 players

            // Check that there's now a bot
            const bots = room.getBots();
            expect(bots.length).toBe(1);
            expect(bots[0].name).toContain('was Bob');
        });

        it('should reject when game is not in progress', () => {
            // Create a fresh room in lobby
            const lobbyRoom = new Room(mockIo, 'XYZ789');
            lobbyRoom.addPlayer('socket-1', 'Alice', '192.168.1.1');

            const result = lobbyRoom.exitAndReplaceWithBot('socket-1');

            expect(result.success).toBe(false);
            expect(result.error).toBe('GAME_NOT_IN_PROGRESS');
        });

        it('should reject for non-existent player', () => {
            const result = room.exitAndReplaceWithBot('socket-999');

            expect(result.success).toBe(false);
            expect(result.error).toBe('PLAYER_NOT_FOUND');
        });

        it('should reject if player is already a bot', () => {
            // First replace a player with a bot
            room.exitAndReplaceWithBot('socket-2');
            const bots = room.getBots();
            const botId = bots[0].id;

            // Try to exit the bot
            const result = room.exitAndReplaceWithBot(botId);

            expect(result.success).toBe(false);
            expect(result.error).toBe('ALREADY_BOT');
        });

        it('should update callerId when caller exits', () => {
            // Get the game and set a specific caller
            const game = room.getGame();
            game.gameState.callerId = 'socket-3';

            const result = room.exitAndReplaceWithBot('socket-3');

            expect(result.success).toBe(true);
            // Caller ID should now be the bot ID
            expect(game.gameState.callerId?.startsWith('bot-')).toBe(true);
        });
    });

    describe('room authentication', () => {
        it('should reject duplicate names case-insensitively', () => {
            room.addPlayer('socket-1', 'Alice', '192.168.1.1');

            const result1 = room.addPlayer('socket-2', 'ALICE', '192.168.1.2');
            expect(result1.success).toBe(false);
            expect(result1.error).toBe('NAME_TAKEN');

            const result2 = room.addPlayer('socket-3', 'alice', '192.168.1.3');
            expect(result2.success).toBe(false);
            expect(result2.error).toBe('NAME_TAKEN');
        });

        it('should reject duplicate IPs in production', () => {
            const originalEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = 'production';

            room.addPlayer('socket-1', 'Alice', '203.0.113.1');
            const result = room.addPlayer('socket-2', 'Bob', '203.0.113.1');

            expect(result.success).toBe(false);
            expect(result.error).toBe('IP_ALREADY_IN_ROOM');

            process.env.NODE_ENV = originalEnv;
        });

        it('should allow same IP in development for localhost', () => {
            const originalEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = 'development';

            room.addPlayer('socket-1', 'Alice', '127.0.0.1');
            const result = room.addPlayer('socket-2', 'Bob', '127.0.0.1');

            expect(result.success).toBe(true);

            process.env.NODE_ENV = originalEnv;
        });

        it('should enforce room capacity of 5 players', () => {
            room.addPlayer('socket-1', 'P1', '10.0.0.1');
            room.addPlayer('socket-2', 'P2', '10.0.0.2');
            room.addPlayer('socket-3', 'P3', '10.0.0.3');
            room.addPlayer('socket-4', 'P4', '10.0.0.4');
            room.addPlayer('socket-5', 'P5', '10.0.0.5');

            expect(room.isFull()).toBe(true);

            const result = room.addPlayer('socket-6', 'P6', '10.0.0.6');
            expect(result.success).toBe(false);
            expect(result.error).toBe('ROOM_FULL');
        });

        it('should set first player as host', () => {
            room.addPlayer('socket-1', 'Alice', '192.168.1.1');
            expect(room.hostId).toBe('socket-1');

            room.addPlayer('socket-2', 'Bob', '192.168.1.2');
            expect(room.hostId).toBe('socket-1'); // Still socket-1
        });

        it('should reassign host when host leaves', () => {
            room.addPlayer('socket-1', 'Alice', '192.168.1.1');
            room.addPlayer('socket-2', 'Bob', '192.168.1.2');

            room.removePlayer('socket-1');

            expect(room.hostId).toBe('socket-2');
        });
    });
});
