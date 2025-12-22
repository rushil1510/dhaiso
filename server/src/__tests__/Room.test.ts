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
});
