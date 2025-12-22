import { Server } from 'socket.io';
import { Game } from './Game';
import { Player } from './Player';
import { Logger } from '../services/Logger';

export interface RoomConfig {
    maxPlayers?: number;
    allowRejoin?: boolean;
}

export interface AddPlayerResult {
    success: boolean;
    error?: 'ROOM_FULL' | 'NAME_TAKEN' | 'IP_ALREADY_IN_ROOM' | 'GAME_IN_PROGRESS';
}

/**
 * Room represents a single game lobby/session.
 * It manages players, their IPs, and the game instance.
 */
export class Room {
    readonly code: string;
    readonly createdAt: Date;

    private io: Server;
    private game: Game;
    private playerIPs: Map<string, string> = new Map();  // socketId -> IP
    private logger: Logger;

    // Config options
    private maxPlayers: number;
    private allowRejoin: boolean;

    // Host tracking
    hostId: string | null = null;
    lastActivityAt: Date;

    constructor(io: Server, code: string, config: RoomConfig = {}) {
        this.io = io;
        this.code = code;
        this.game = new Game(io);
        this.createdAt = new Date();
        this.lastActivityAt = new Date();

        this.maxPlayers = config.maxPlayers ?? 5;
        this.allowRejoin = config.allowRejoin ?? true;

        this.logger = new Logger({ roomCode: code });
        this.logger.info('Room created');
    }

    /**
     * Get the underlying game instance
     */
    getGame(): Game {
        return this.game;
    }

    /**
     * Get all players in the room
     */
    getPlayers(): Player[] {
        return this.game.players;
    }

    /**
     * Get player count
     */
    getPlayerCount(): number {
        return this.game.players.length;
    }

    /**
     * Check if a player name is already taken in this room
     */
    isNameTaken(name: string): boolean {
        return this.game.players.some(p =>
            p.name.toLowerCase() === name.toLowerCase()
        );
    }

    /**
     * Check if an IP is already in use in this room
     */
    isIPInRoom(ip: string): boolean {
        // Skip localhost check in development
        if (process.env.NODE_ENV === 'development' &&
            (ip === '127.0.0.1' || ip === '::1' || ip === 'unknown')) {
            return false;
        }

        return Array.from(this.playerIPs.values()).includes(ip);
    }

    /**
     * Check if the room is full
     */
    isFull(): boolean {
        return this.game.players.length >= this.maxPlayers;
    }

    /**
     * Check if a game is in progress
     */
    isGameInProgress(): boolean {
        return this.game.gameState.phase !== 'lobby';
    }

    /**
     * Add a player to the room
     */
    addPlayer(socketId: string, name: string, ip: string): AddPlayerResult {
        this.lastActivityAt = new Date();

        // Check if this is a rejoin
        if (this.isGameInProgress()) {
            // Allow rejoin through the game's existing rejoin logic
            const success = this.game.addPlayer(socketId, name);
            if (success) {
                this.playerIPs.set(socketId, ip);
                this.logger.info('Player rejoined room', {
                    playerName: name,
                    playerId: socketId,
                    ip,
                    playerCount: this.getPlayerCount()
                });
            }
            return { success };
        }

        // Normal join during lobby

        // Check room capacity
        if (this.isFull()) {
            this.logger.warn('Player join rejected - room full', {
                playerName: name, ip
            });
            return { success: false, error: 'ROOM_FULL' };
        }

        // Check unique name
        if (this.isNameTaken(name)) {
            this.logger.warn('Player join rejected - name taken', {
                playerName: name, ip
            });
            return { success: false, error: 'NAME_TAKEN' };
        }

        // Check unique IP
        if (this.isIPInRoom(ip)) {
            this.logger.warn('Player join rejected - IP already in room', {
                playerName: name, ip
            });
            return { success: false, error: 'IP_ALREADY_IN_ROOM' };
        }

        // Add the player
        const success = this.game.addPlayer(socketId, name);

        if (success) {
            this.playerIPs.set(socketId, ip);

            // First player becomes host
            if (this.hostId === null) {
                this.hostId = socketId;
                this.logger.info('Player joined as host', {
                    playerName: name,
                    playerId: socketId,
                    ip,
                    playerCount: this.getPlayerCount()
                });
            } else {
                this.logger.info('Player joined room', {
                    playerName: name,
                    playerId: socketId,
                    ip,
                    playerCount: this.getPlayerCount()
                });
            }
        }

        return { success };
    }

    /**
     * Remove a player from the room
     */
    removePlayer(socketId: string): void {
        this.lastActivityAt = new Date();

        const player = this.game.players.find(p => p.id === socketId);

        this.game.removePlayer(socketId);
        this.playerIPs.delete(socketId);

        // Reassign host if the host left
        if (this.hostId === socketId && this.game.players.length > 0) {
            this.hostId = this.game.players[0].id;
            this.logger.info('Host reassigned', {
                newHostId: this.hostId,
                newHostName: this.game.players[0].name
            });
        }

        this.logger.info('Player left room', {
            playerName: player?.name,
            playerId: socketId,
            remainingPlayers: this.getPlayerCount()
        });
    }

    /**
     * Check if the room is empty
     */
    isEmpty(): boolean {
        // Consider a room empty if no active players and no disconnected players waiting to rejoin
        return this.game.players.length === 0 &&
            this.game.disconnectedPlayers.size === 0;
    }

    /**
     * Start the game
     */
    startGame(requesterId: string): boolean {
        this.lastActivityAt = new Date();

        // Only host can start (or anyone if you prefer)
        if (this.hostId !== requesterId) {
            this.logger.warn('Non-host tried to start game', {
                requesterId,
                hostId: this.hostId
            });
            return false;
        }

        if (this.game.players.length < 5) {
            this.logger.warn('Cannot start game - not enough players', {
                playerCount: this.game.players.length,
                required: 5
            });
            return false;
        }

        this.game.startGame();
        return true;
    }

    /**
     * Serialize room state for persistence
     */
    serialize(): object {
        return {
            code: this.code,
            hostId: this.hostId,
            createdAt: this.createdAt.toISOString(),
            lastActivityAt: this.lastActivityAt.toISOString(),
            playerIPs: Array.from(this.playerIPs.entries()),
            // Game state would need its own serialize method
            gamePhase: this.game.gameState.phase,
            playerCount: this.game.players.length
        };
    }
}
