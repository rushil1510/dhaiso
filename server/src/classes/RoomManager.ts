import { Server } from 'socket.io';
import { Room, RoomConfig, AddPlayerResult } from './Room';
import { generateRoomCode, isValidRoomCode } from '../services/CodeGenerator';
import { Logger, globalLogger } from '../services/Logger';

const MAX_CODE_GENERATION_ATTEMPTS = 10;
const ROOM_CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const ROOM_INACTIVE_TIMEOUT_MS = 60 * 60 * 1000; // 1 hour

/**
 * RoomManager handles the lifecycle of all game rooms.
 * It creates, retrieves, and cleans up rooms.
 */
export class RoomManager {
    private io: Server;
    private rooms: Map<string, Room> = new Map();
    private logger: Logger;
    private cleanupIntervalId: NodeJS.Timeout | null = null;

    constructor(io: Server) {
        this.io = io;
        this.logger = new Logger({ service: 'RoomManager' });

        // Start periodic cleanup
        this.startCleanupTimer();
    }

    /**
     * Start the periodic room cleanup timer
     */
    private startCleanupTimer(): void {
        this.cleanupIntervalId = setInterval(() => {
            this.cleanupInactiveRooms();
        }, ROOM_CLEANUP_INTERVAL_MS);

        this.logger.info('Room cleanup timer started', {
            intervalMs: ROOM_CLEANUP_INTERVAL_MS
        });
    }

    /**
     * Stop the cleanup timer (for graceful shutdown)
     */
    public stopCleanupTimer(): void {
        if (this.cleanupIntervalId) {
            clearInterval(this.cleanupIntervalId);
            this.cleanupIntervalId = null;
            this.logger.info('Room cleanup timer stopped');
        }
    }

    /**
     * Create a new room with a unique code
     */
    createRoom(config: RoomConfig = {}): Room {
        let code: string;
        let attempts = 0;

        // Generate unique code
        do {
            code = generateRoomCode();
            attempts++;

            if (attempts > MAX_CODE_GENERATION_ATTEMPTS) {
                throw new Error('Failed to generate unique room code after max attempts');
            }
        } while (this.rooms.has(code));

        const room = new Room(this.io, code, config);
        this.rooms.set(code, room);

        this.logger.info('Room created', {
            roomCode: code,
            totalRooms: this.rooms.size
        });

        return room;
    }

    /**
     * Get a room by its code
     */
    getRoom(code: string): Room | undefined {
        return this.rooms.get(code.toUpperCase());
    }

    /**
     * Check if a room exists
     */
    hasRoom(code: string): boolean {
        return this.rooms.has(code.toUpperCase());
    }

    /**
     * Delete a room
     */
    deleteRoom(code: string): boolean {
        const deleted = this.rooms.delete(code.toUpperCase());

        if (deleted) {
            this.logger.info('Room deleted', {
                roomCode: code,
                remainingRooms: this.rooms.size
            });
        }

        return deleted;
    }

    /**
     * Get all room codes
     */
    getAllRoomCodes(): string[] {
        return Array.from(this.rooms.keys());
    }

    /**
     * Get total number of active rooms
     */
    getRoomCount(): number {
        return this.rooms.size;
    }

    /**
     * Get total number of players across all rooms
     */
    getTotalPlayerCount(): number {
        let total = 0;
        this.rooms.forEach(room => {
            total += room.getPlayerCount();
        });
        return total;
    }

    /**
     * Clean up inactive and empty rooms
     */
    cleanupInactiveRooms(): void {
        const now = new Date();
        let cleanedCount = 0;

        this.rooms.forEach((room, code) => {
            const inactiveMs = now.getTime() - room.lastActivityAt.getTime();

            // Remove if empty and inactive
            if (room.isEmpty() && inactiveMs > ROOM_INACTIVE_TIMEOUT_MS) {
                this.rooms.delete(code);
                cleanedCount++;
                this.logger.info('Room cleaned up due to inactivity', {
                    roomCode: code,
                    inactiveMinutes: Math.floor(inactiveMs / 60000)
                });
            }
        });

        if (cleanedCount > 0) {
            this.logger.info('Room cleanup completed', {
                cleanedRooms: cleanedCount,
                remainingRooms: this.rooms.size
            });
        }
    }

    /**
     * Join a room with validation
     */
    joinRoom(code: string, socketId: string, name: string, ip: string): { room?: Room; result: AddPlayerResult } {
        if (!isValidRoomCode(code)) {
            return {
                result: { success: false, error: 'ROOM_FULL' } // Using ROOM_FULL as generic "invalid" for now
            };
        }

        const room = this.getRoom(code);

        if (!room) {
            this.logger.warn('Player tried to join non-existent room', {
                roomCode: code,
                playerName: name,
                ip
            });
            return {
                result: { success: false, error: 'ROOM_FULL' }
            };
        }

        const result = room.addPlayer(socketId, name, ip);

        return { room, result };
    }

    /**
     * Get statistics about all rooms
     */
    getStats(): object {
        const stats = {
            totalRooms: this.rooms.size,
            totalPlayers: this.getTotalPlayerCount(),
            rooms: [] as object[]
        };

        this.rooms.forEach((room, code) => {
            stats.rooms.push({
                code,
                playerCount: room.getPlayerCount(),
                phase: room.getGame().gameState.phase,
                createdAt: room.createdAt.toISOString(),
                lastActivity: room.lastActivityAt.toISOString()
            });
        });

        return stats;
    }
}
