import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { Game } from './classes/Game';
import { Room } from './classes/Room';
import { RoomManager } from './classes/RoomManager';
import { Logger, globalLogger } from './services/Logger';

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);

// Determine allowed origins based on environment
const allowedOrigins: (string | RegExp)[] = [
    "http://localhost:5173", // Local development
    "http://localhost:3000", // Alternative local
];

// Add production frontend URL if set
if (process.env.FRONTEND_URL) {
    allowedOrigins.push(process.env.FRONTEND_URL);
}

// Add wildcard for Vercel preview deployments
if (process.env.NODE_ENV === 'production') {
    allowedOrigins.push(/\.vercel\.app$/);
}

const io = new Server(httpServer, {
    cors: {
        origin: (origin, callback) => {
            // Allow requests with no origin (mobile apps, Postman, etc.)
            if (!origin) return callback(null, true);

            // Check if origin is in allowed list or matches pattern
            const isAllowed = allowedOrigins.some(allowed => {
                if (typeof allowed === 'string') return allowed === origin;
                if (allowed instanceof RegExp) return allowed.test(origin);
                return false;
            });

            if (isAllowed) {
                callback(null, true);
            } else {
                globalLogger.warn('CORS blocked origin', { origin });
                callback(new Error('Not allowed by CORS'));
            }
        },
        methods: ["GET", "POST"],
        credentials: true
    }
});

// Room manager for multi-room support
const roomManager = new RoomManager(io);

// Track which room each socket is in
const socketRooms: Map<string, string> = new Map(); // socketId -> roomCode

// Helper to get client IP
function getClientIP(socket: any): string {
    const forwarded = socket.handshake.headers['x-forwarded-for'];
    if (forwarded) {
        return (forwarded as string).split(',')[0].trim();
    }
    return socket.handshake.address || 'unknown';
}

// Helper to get room for a socket
function getSocketRoom(socketId: string): Room | undefined {
    const roomCode = socketRooms.get(socketId);
    return roomCode ? roomManager.getRoom(roomCode) : undefined;
}

// REST API endpoints for room info
app.get('/api/rooms/stats', (req, res) => {
    res.json(roomManager.getStats());
});

app.get('/api/rooms/:code', (req, res) => {
    const room = roomManager.getRoom(req.params.code);
    if (!room) {
        res.status(404).json({ error: 'Room not found' });
        return;
    }
    res.json({
        code: room.code,
        playerCount: room.getPlayerCount(),
        isFull: room.isFull(),
        isGameInProgress: room.isGameInProgress(),
        players: room.getPlayers().map(p => p.name)
    });
});

io.on('connection', (socket) => {
    const ip = getClientIP(socket);
    const socketLogger = new Logger({ socketId: socket.id, ip });

    socketLogger.info('Client connected', {
        userAgent: socket.handshake.headers['user-agent']?.substring(0, 50)
    });

    // ==================== NEW ROOM-BASED EVENTS ====================

    // Create a new room
    socket.on('CREATE_ROOM', (callback) => {
        socketLogger.socketEvent('CREATE_ROOM', socket.id, 'in');

        try {
            const room = roomManager.createRoom();

            socketLogger.info('Room created', {
                roomCode: room.code
            });

            if (typeof callback === 'function') {
                callback({ success: true, roomCode: room.code });
            } else {
                socket.emit('ROOM_CREATED', { roomCode: room.code });
            }
        } catch (error) {
            socketLogger.error('Failed to create room', error as Error);
            if (typeof callback === 'function') {
                callback({ success: false, error: 'Failed to create room' });
            } else {
                socket.emit('ERROR', 'Failed to create room');
            }
        }
    });

    // Join a room with code
    socket.on('JOIN_ROOM', (data: { roomCode: string, name: string }, callback) => {
        const { roomCode, name } = data;
        socketLogger.socketEvent('JOIN_ROOM', socket.id, 'in', { roomCode, playerName: name });

        if (!roomCode || !name) {
            const error = 'Room code and name are required';
            socketLogger.warn('Join room failed - missing parameters', { roomCode, name });
            if (typeof callback === 'function') {
                callback({ success: false, error });
            } else {
                socket.emit('ERROR', error);
            }
            return;
        }

        const { room, result } = roomManager.joinRoom(roomCode, socket.id, name.trim(), ip);

        if (result.success && room) {
            // Join the Socket.IO room for broadcasting
            socket.join(roomCode);
            socketRooms.set(socket.id, roomCode);

            socketLogger.info('Player joined room', {
                roomCode,
                playerName: name,
                playerCount: room.getPlayerCount()
            });

            if (typeof callback === 'function') {
                callback({
                    success: true,
                    roomCode,
                    isHost: room.hostId === socket.id,
                    playerCount: room.getPlayerCount()
                });
            } else {
                socket.emit('ROOM_JOINED', {
                    roomCode,
                    isHost: room.hostId === socket.id
                });
            }
        } else {
            const errorMessages: Record<string, string> = {
                'ROOM_FULL': 'Room is full or does not exist',
                'NAME_TAKEN': 'That name is already taken in this room',
                'IP_ALREADY_IN_ROOM': 'Another player from your network is already in this room',
                'GAME_IN_PROGRESS': 'Game is already in progress'
            };

            const errorMessage = errorMessages[result.error || ''] || 'Failed to join room';

            socketLogger.warn('Join room failed', {
                roomCode,
                playerName: name,
                error: result.error
            });

            if (typeof callback === 'function') {
                callback({ success: false, error: errorMessage });
            } else {
                socket.emit('ERROR', errorMessage);
            }
        }
    });

    // Leave current room
    socket.on('LEAVE_ROOM', () => {
        const roomCode = socketRooms.get(socket.id);
        socketLogger.socketEvent('LEAVE_ROOM', socket.id, 'in', { roomCode });

        if (roomCode) {
            const room = roomManager.getRoom(roomCode);
            if (room) {
                room.removePlayer(socket.id);

                // Delete empty rooms
                if (room.isEmpty()) {
                    roomManager.deleteRoom(roomCode);
                }
            }

            socket.leave(roomCode);
            socketRooms.delete(socket.id);

            socketLogger.info('Player left room', { roomCode });
            socket.emit('ROOM_LEFT');
        }
    });

    // Start game in room
    socket.on('START_ROOM_GAME', () => {
        const room = getSocketRoom(socket.id);
        socketLogger.socketEvent('START_ROOM_GAME', socket.id, 'in');

        if (!room) {
            socket.emit('ERROR', 'Not in a room');
            return;
        }

        const started = room.startGame(socket.id);
        if (!started) {
            socket.emit('ERROR', 'Cannot start game - need 5 players or you are not the host');
        }
    });

    // Add bot to room (host only)
    socket.on('ADD_BOT', (callback: (response: { success: boolean; botId?: string; botName?: string; error?: string }) => void) => {
        const room = getSocketRoom(socket.id);
        socketLogger.socketEvent('ADD_BOT', socket.id, 'in');

        if (!room) {
            callback({ success: false, error: 'NOT_IN_ROOM' });
            return;
        }

        const result = room.addBot(socket.id);
        callback(result);
    });

    // Remove bot from room (host only)
    socket.on('REMOVE_BOT', (data: { botId: string }, callback: (response: { success: boolean; error?: string }) => void) => {
        const room = getSocketRoom(socket.id);
        socketLogger.socketEvent('REMOVE_BOT', socket.id, 'in', { botId: data.botId });

        if (!room) {
            callback({ success: false, error: 'NOT_IN_ROOM' });
            return;
        }

        const result = room.removeBot(socket.id, data.botId);
        callback(result);
    });

    // Game actions in room context
    socket.on('ROOM_BID', (data: { amount: number }) => {
        const room = getSocketRoom(socket.id);
        if (!room) {
            socket.emit('ERROR', 'Not in a room');
            return;
        }

        socketLogger.socketEvent('ROOM_BID', socket.id, 'in', data);
        room.getGame().handleBid(socket.id, data.amount);
    });

    socket.on('ROOM_SELECT_TRUMP', (data: { suit: any, friends: any[] }) => {
        const room = getSocketRoom(socket.id);
        if (!room) {
            socket.emit('ERROR', 'Not in a room');
            return;
        }

        socketLogger.socketEvent('ROOM_SELECT_TRUMP', socket.id, 'in', data);
        room.getGame().handleSelectTrumpAndFriends(socket.id, data.suit, data.friends);
    });

    socket.on('ROOM_PLAY_CARD', (card: any) => {
        const room = getSocketRoom(socket.id);
        if (!room) {
            socket.emit('ERROR', 'Not in a room');
            return;
        }

        socketLogger.socketEvent('ROOM_PLAY_CARD', socket.id, 'in', { card: `${card.rank}${card.suit}` });
        room.getGame().handlePlayCard(socket.id, card);
    });

    // ==================== LEGACY SINGLE-GAME EVENTS (for backward compatibility) ====================
    // These use a default room internally

    let legacyRoom: Room | null = null;

    socket.on('JOIN_GAME', (name: string) => {
        socketLogger.socketEvent('JOIN_GAME', socket.id, 'in', { playerName: name });

        // For legacy mode, use or create a default room
        if (!legacyRoom || legacyRoom.isEmpty()) {
            legacyRoom = roomManager.createRoom();
            globalLogger.info('Created legacy room', { roomCode: legacyRoom.code });
        }

        const result = legacyRoom.addPlayer(socket.id, name, ip);

        if (!result.success) {
            const errorMessages: Record<string, string> = {
                'ROOM_FULL': 'Game is full',
                'NAME_TAKEN': 'That name is already taken',
                'IP_ALREADY_IN_ROOM': 'Another player from your network is already in the game'
            };
            socketLogger.warn('Player join failed', { playerName: name, error: result.error });
            socket.emit('ERROR', errorMessages[result.error || ''] || 'Failed to join');
        } else {
            socket.join(legacyRoom.code);
            socketRooms.set(socket.id, legacyRoom.code);
            socketLogger.info('Player joined game (legacy)', {
                playerName: name,
                roomCode: legacyRoom.code,
                totalPlayers: legacyRoom.getPlayerCount()
            });
        }
    });

    socket.on('disconnect', () => {
        const roomCode = socketRooms.get(socket.id);
        const room = roomCode ? roomManager.getRoom(roomCode) : undefined;
        const player = room?.getPlayers().find(p => p.id === socket.id);

        socketLogger.info('Client disconnected', {
            playerName: player?.name,
            roomCode,
            wasInRoom: !!room
        });

        if (room) {
            room.removePlayer(socket.id);

            // Clean up empty rooms (but not immediately for rejoin support)
            // The RoomManager's periodic cleanup will handle truly abandoned rooms
        }

        socketRooms.delete(socket.id);
    });

    socket.on('START_GAME', () => {
        const room = getSocketRoom(socket.id);
        socketLogger.socketEvent('START_GAME', socket.id, 'in');

        if (room) {
            const player = room.getPlayers().find(p => p.id === socket.id);
            socketLogger.info('Game start requested', {
                requestedBy: player?.name,
                playerCount: room.getPlayerCount()
            });
            room.getGame().startGame();
        }
    });

    socket.on('BID', (data: { amount: number }) => {
        const room = getSocketRoom(socket.id);
        if (room) {
            socketLogger.socketEvent('BID', socket.id, 'in', data);
            room.getGame().handleBid(socket.id, data.amount);
        }
    });

    socket.on('SELECT_TRUMP', (data: { suit: any, friends: any[] }) => {
        const room = getSocketRoom(socket.id);
        if (room) {
            socketLogger.socketEvent('SELECT_TRUMP', socket.id, 'in', data);
            room.getGame().handleSelectTrumpAndFriends(socket.id, data.suit, data.friends);
        }
    });

    socket.on('PLAY_CARD', (card: any) => {
        const room = getSocketRoom(socket.id);
        if (room) {
            socketLogger.socketEvent('PLAY_CARD', socket.id, 'in', { card: `${card.rank}${card.suit}` });
            room.getGame().handlePlayCard(socket.id, card);
        }
    });

    // Handle any errors on the socket
    socket.on('error', (error) => {
        socketLogger.error('Socket error', error);
    });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    globalLogger.error('Uncaught exception - server may be unstable', error, {
        type: 'uncaughtException'
    });
});

process.on('unhandledRejection', (reason, promise) => {
    globalLogger.error('Unhandled promise rejection', reason as Error, {
        type: 'unhandledRejection'
    });
});

// Graceful shutdown
process.on('SIGTERM', () => {
    globalLogger.info('SIGTERM received - shutting down gracefully');
    roomManager.stopCleanupTimer();
    httpServer.close(() => {
        globalLogger.info('Server closed');
        process.exit(0);
    });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
    globalLogger.info('🎮 Dhaiso server started', {
        port: PORT,
        nodeEnv: process.env.NODE_ENV || 'development',
        allowedOrigins: allowedOrigins.map(o => o.toString()),
        features: ['multi-room', 'ip-restriction', 'unique-names', 'structured-logging']
    });
});
