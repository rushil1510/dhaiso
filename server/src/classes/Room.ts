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

    // Bot name cycling - tracks which bot name to use next (0-3 cycles through Alpha/Beta/Gamma/Delta)
    private nextBotNameIndex: number = 0;

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

    /**
     * Check if a player ID belongs to a bot
     */
    isBot(playerId: string): boolean {
        return playerId.startsWith('bot-');
    }

    /**
     * Get all bots in the room
     */
    getBots(): Player[] {
        return this.game.players.filter(p => this.isBot(p.id));
    }

    /**
     * Add a bot to the room (host only)
     */
    addBot(requesterId: string): { success: boolean; botId?: string; botName?: string; error?: string } {
        this.lastActivityAt = new Date();

        // Only host can add bots
        if (this.hostId !== requesterId) {
            this.logger.warn('Non-host tried to add bot', { requesterId, hostId: this.hostId });
            return { success: false, error: 'NOT_HOST' };
        }

        // Can't add bots during game
        if (this.isGameInProgress()) {
            this.logger.warn('Cannot add bot - game in progress');
            return { success: false, error: 'GAME_IN_PROGRESS' };
        }

        // Check room capacity
        if (this.isFull()) {
            this.logger.warn('Cannot add bot - room full');
            return { success: false, error: 'ROOM_FULL' };
        }

        // Generate unique bot ID and name using cycling index
        const botNames = ['Bot Alpha', 'Bot Beta', 'Bot Gamma', 'Bot Delta'];
        const botName = botNames[this.nextBotNameIndex];
        const botId = `bot-${Date.now()}-${this.nextBotNameIndex}`;

        // Increment the index for next bot (cycles 0 → 1 → 2 → 3 → 0...)
        this.nextBotNameIndex = (this.nextBotNameIndex + 1) % 4;

        // Add bot to game
        const success = this.game.addPlayer(botId, botName);

        if (success) {
            this.playerIPs.set(botId, 'bot'); // Mark as bot IP
            this.logger.info('Bot added to room', {
                botId,
                botName,
                playerCount: this.getPlayerCount()
            });
            return { success: true, botId, botName };
        }

        return { success: false, error: 'FAILED_TO_ADD' };
    }

    /**
     * Remove a bot from the room (host only)
     */
    removeBot(requesterId: string, botId: string): { success: boolean; error?: string } {
        this.lastActivityAt = new Date();

        // Only host can remove bots
        if (this.hostId !== requesterId) {
            this.logger.warn('Non-host tried to remove bot', { requesterId, hostId: this.hostId });
            return { success: false, error: 'NOT_HOST' };
        }

        // Can't remove bots during game
        if (this.isGameInProgress()) {
            this.logger.warn('Cannot remove bot - game in progress');
            return { success: false, error: 'GAME_IN_PROGRESS' };
        }

        // Check if the ID is actually a bot
        if (!this.isBot(botId)) {
            this.logger.warn('Cannot remove - not a bot', { botId });
            return { success: false, error: 'NOT_A_BOT' };
        }

        // Check if bot exists in room
        const bot = this.game.players.find(p => p.id === botId);
        if (!bot) {
            this.logger.warn('Bot not found', { botId });
            return { success: false, error: 'BOT_NOT_FOUND' };
        }

        // Remove the bot
        this.game.removePlayer(botId);
        this.playerIPs.delete(botId);

        this.logger.info('Bot removed from room', {
            botId,
            botName: bot.name,
            playerCount: this.getPlayerCount()
        });

        return { success: true };
    }

    /**
     * Allow a player to exit mid-game and be replaced with a bot.
     * The bot inherits the player's hand, team, and points.
     */
    exitAndReplaceWithBot(playerId: string): { success: boolean; error?: string } {
        this.lastActivityAt = new Date();

        // Can only exit during game
        if (!this.isGameInProgress()) {
            return { success: false, error: 'GAME_NOT_IN_PROGRESS' };
        }

        // Check if player exists
        const player = this.game.players.find(p => p.id === playerId);
        if (!player) {
            return { success: false, error: 'PLAYER_NOT_FOUND' };
        }

        // Don't allow bots to "exit"
        if (this.isBot(playerId)) {
            return { success: false, error: 'ALREADY_BOT' };
        }

        // Generate bot ID with unique timestamp
        const botNames = ['Bot Alpha', 'Bot Beta', 'Bot Gamma', 'Bot Delta'];
        const botName = botNames[this.nextBotNameIndex];
        const botId = `bot-${Date.now()}-${this.nextBotNameIndex}`;
        this.nextBotNameIndex = (this.nextBotNameIndex + 1) % 4;

        // Replace player ID in the game's player array
        const playerIndex = this.game.players.findIndex(p => p.id === playerId);
        if (playerIndex !== -1) {
            // Update the player's ID to the bot ID (keeping hand, team, points)
            this.game.players[playerIndex].id = botId;
            this.game.players[playerIndex].name = `${botName} (was ${player.name})`;
        }

        // Update callerId if the exiting player was the caller
        if (this.game.gameState.callerId === playerId) {
            this.game.gameState.callerId = botId;
        }

        // Update pot entries if any cards were played by this player
        this.game.gameState.pot.forEach(potEntry => {
            if (potEntry.playerId === playerId) {
                potEntry.playerId = botId;
            }
        });

        // Add to disconnected players so bot AI takes over
        this.game.disconnectedPlayers.set(botId, this.game.players[playerIndex]);

        // Remove old player IP, add bot IP
        this.playerIPs.delete(playerId);
        this.playerIPs.set(botId, 'bot');

        this.logger.info('Player exited and replaced with bot', {
            playerId,
            playerName: player.name,
            botId,
            botName,
            phase: this.game.gameState.phase
        });

        return { success: true };
    }
}
