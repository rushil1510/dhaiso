import { RoomManager } from '../classes/RoomManager';
import { Server } from 'socket.io';

// Mock Socket.IO Server
const mockIo = {
    emit: jest.fn(),
    to: jest.fn().mockReturnThis(),
} as unknown as Server;

describe('RoomManager', () => {
    let manager: RoomManager;

    beforeEach(() => {
        jest.clearAllMocks();
        manager = new RoomManager(mockIo);
    });

    afterEach(() => {
        manager.stopCleanupTimer();
    });

    describe('createRoom', () => {
        it('should create a new room with unique code', () => {
            const room = manager.createRoom();

            expect(room).toBeDefined();
            expect(room.code).toBeDefined();
            expect(room.code.length).toBe(6);
        });

        it('should create rooms with different codes', () => {
            const room1 = manager.createRoom();
            const room2 = manager.createRoom();

            expect(room1.code).not.toBe(room2.code);
        });

        it('should track created rooms', () => {
            const room = manager.createRoom();

            expect(manager.hasRoom(room.code)).toBe(true);
            expect(manager.getRoomCount()).toBe(1);
        });
    });

    describe('getRoom', () => {
        it('should return room by code', () => {
            const created = manager.createRoom();
            const found = manager.getRoom(created.code);

            expect(found).toBe(created);
        });

        it('should return undefined for non-existent room', () => {
            const found = manager.getRoom('NOTEXIST');
            expect(found).toBeUndefined();
        });

        it('should be case-insensitive', () => {
            const room = manager.createRoom();
            const found = manager.getRoom(room.code.toLowerCase());

            expect(found).toBe(room);
        });
    });

    describe('hasRoom', () => {
        it('should return true for existing room', () => {
            const room = manager.createRoom();
            expect(manager.hasRoom(room.code)).toBe(true);
        });

        it('should return false for non-existent room', () => {
            expect(manager.hasRoom('NOTEXIST')).toBe(false);
        });
    });

    describe('deleteRoom', () => {
        it('should delete an existing room', () => {
            const room = manager.createRoom();
            const deleted = manager.deleteRoom(room.code);

            expect(deleted).toBe(true);
            expect(manager.hasRoom(room.code)).toBe(false);
        });

        it('should return false for non-existent room', () => {
            const deleted = manager.deleteRoom('NOTEXIST');
            expect(deleted).toBe(false);
        });
    });

    describe('getRoomCount', () => {
        it('should return 0 for new manager', () => {
            expect(manager.getRoomCount()).toBe(0);
        });

        it('should return correct count', () => {
            manager.createRoom();
            manager.createRoom();
            manager.createRoom();

            expect(manager.getRoomCount()).toBe(3);
        });
    });

    describe('getAllRoomCodes', () => {
        it('should return empty array for new manager', () => {
            expect(manager.getAllRoomCodes()).toEqual([]);
        });

        it('should return all room codes', () => {
            const room1 = manager.createRoom();
            const room2 = manager.createRoom();

            const codes = manager.getAllRoomCodes();

            expect(codes).toContain(room1.code);
            expect(codes).toContain(room2.code);
            expect(codes.length).toBe(2);
        });
    });

    describe('getTotalPlayerCount', () => {
        it('should return 0 when no players', () => {
            manager.createRoom();
            expect(manager.getTotalPlayerCount()).toBe(0);
        });

        it('should count players across rooms', () => {
            const room1 = manager.createRoom();
            const room2 = manager.createRoom();

            room1.addPlayer('s1', 'Alice', '10.0.0.1');
            room1.addPlayer('s2', 'Bob', '10.0.0.2');
            room2.addPlayer('s3', 'Charlie', '10.0.0.3');

            expect(manager.getTotalPlayerCount()).toBe(3);
        });
    });

    describe('joinRoom', () => {
        it('should join an existing room', () => {
            const room = manager.createRoom();
            const { room: foundRoom, result } = manager.joinRoom(
                room.code, 'socket-1', 'Alice', '10.0.0.1'
            );

            expect(result.success).toBe(true);
            expect(foundRoom).toBe(room);
        });

        it('should fail for non-existent room', () => {
            const { room, result } = manager.joinRoom(
                'NOTEXIST', 'socket-1', 'Alice', '10.0.0.1'
            );

            expect(result.success).toBe(false);
            expect(room).toBeUndefined();
        });

        it('should fail for invalid room code', () => {
            const { room, result } = manager.joinRoom(
                'ab', 'socket-1', 'Alice', '10.0.0.1' // Too short
            );

            expect(result.success).toBe(false);
            expect(room).toBeUndefined();
        });
    });

    describe('getStats', () => {
        it('should return stats object', () => {
            const room = manager.createRoom();
            room.addPlayer('s1', 'Alice', '10.0.0.1');

            const stats = manager.getStats() as any;

            expect(stats.totalRooms).toBe(1);
            expect(stats.totalPlayers).toBe(1);
            expect(stats.rooms).toHaveLength(1);
            expect(stats.rooms[0].code).toBe(room.code);
        });
    });

    describe('cleanupInactiveRooms', () => {
        it('should not clean up active rooms', () => {
            const room = manager.createRoom();
            room.addPlayer('s1', 'Alice', '10.0.0.1');

            manager.cleanupInactiveRooms();

            expect(manager.hasRoom(room.code)).toBe(true);
        });

        // Note: Full cleanup testing would require mocking Date.now()
        // to simulate passage of time beyond the timeout threshold
    });
});
