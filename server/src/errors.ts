/**
 * Custom error classes for Dhaiso game.
 * These provide structured error information for logging and client responses.
 */

/**
 * Base error class for all Dhaiso-specific errors
 */
export class DhaisoError extends Error {
    readonly code: string;
    readonly context: Record<string, any>;
    readonly statusCode: number;
    readonly isOperational: boolean; // true = expected error, false = programming bug

    constructor(
        message: string,
        code: string,
        context: Record<string, any> = {},
        statusCode: number = 400,
        isOperational: boolean = true
    ) {
        super(message);
        this.name = this.constructor.name;
        this.code = code;
        this.context = context;
        this.statusCode = statusCode;
        this.isOperational = isOperational;

        // Maintain proper stack trace in V8
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
    }

    /**
     * Convert to a client-safe error object
     */
    toClientError(): { code: string; message: string } {
        return {
            code: this.code,
            message: this.message
        };
    }
}

// ==================== Room Errors ====================

export class RoomNotFoundError extends DhaisoError {
    constructor(roomCode: string) {
        super(
            `Room '${roomCode}' not found`,
            'ROOM_NOT_FOUND',
            { roomCode },
            404
        );
    }
}

export class RoomFullError extends DhaisoError {
    constructor(roomCode: string, maxPlayers: number = 5) {
        super(
            'Room is full',
            'ROOM_FULL',
            { roomCode, maxPlayers },
            400
        );
    }
}

export class NameTakenError extends DhaisoError {
    constructor(name: string, roomCode: string) {
        super(
            `The name '${name}' is already taken in this room`,
            'NAME_TAKEN',
            { name, roomCode },
            400
        );
    }
}

export class IPAlreadyInRoomError extends DhaisoError {
    constructor(roomCode: string) {
        super(
            'Another player from your network is already in this room',
            'IP_ALREADY_IN_ROOM',
            { roomCode },
            400
        );
    }
}

export class GameInProgressError extends DhaisoError {
    constructor(roomCode: string) {
        super(
            'Cannot join - game is already in progress',
            'GAME_IN_PROGRESS',
            { roomCode },
            400
        );
    }
}

export class NotInRoomError extends DhaisoError {
    constructor(socketId: string) {
        super(
            'You are not in a room',
            'NOT_IN_ROOM',
            { socketId },
            400
        );
    }
}

export class NotHostError extends DhaisoError {
    constructor(socketId: string, hostId: string | null) {
        super(
            'Only the host can perform this action',
            'NOT_HOST',
            { socketId, hostId },
            403
        );
    }
}

// ==================== Game Errors ====================

export class NotYourTurnError extends DhaisoError {
    constructor(playerId: string, currentTurnPlayerId: string) {
        super(
            'It is not your turn',
            'NOT_YOUR_TURN',
            { playerId, currentTurnPlayerId },
            400
        );
    }
}

export class InvalidBidError extends DhaisoError {
    constructor(bid: number, currentBid: number, reason: string) {
        super(
            `Invalid bid: ${reason}`,
            'INVALID_BID',
            { bid, currentBid, reason },
            400
        );
    }
}

export class InvalidCardError extends DhaisoError {
    constructor(card: string, reason: string) {
        super(
            `Invalid card play: ${reason}`,
            'INVALID_CARD',
            { card, reason },
            400
        );
    }
}

export class InvalidPhaseError extends DhaisoError {
    constructor(action: string, currentPhase: string, requiredPhase: string) {
        super(
            `Cannot ${action} during ${currentPhase} phase`,
            'INVALID_PHASE',
            { action, currentPhase, requiredPhase },
            400
        );
    }
}

export class NotEnoughPlayersError extends DhaisoError {
    constructor(currentPlayers: number, requiredPlayers: number = 5) {
        super(
            `Need ${requiredPlayers} players to start, currently have ${currentPlayers}`,
            'NOT_ENOUGH_PLAYERS',
            { currentPlayers, requiredPlayers },
            400
        );
    }
}

// ==================== Validation Errors ====================

export class ValidationError extends DhaisoError {
    constructor(field: string, message: string) {
        super(
            message,
            'VALIDATION_ERROR',
            { field },
            400
        );
    }
}

export class MissingParameterError extends DhaisoError {
    constructor(parameter: string) {
        super(
            `Missing required parameter: ${parameter}`,
            'MISSING_PARAMETER',
            { field: parameter },
            400
        );
    }
}

// ==================== Error Codes Map (for client reference) ====================

export const ERROR_CODES = {
    // Room errors
    ROOM_NOT_FOUND: 'Room does not exist',
    ROOM_FULL: 'Room is full (max 5 players)',
    NAME_TAKEN: 'That name is already taken in this room',
    IP_ALREADY_IN_ROOM: 'Another player from your network is already in this room',
    GAME_IN_PROGRESS: 'Game is already in progress',
    NOT_IN_ROOM: 'You are not in a room',
    NOT_HOST: 'Only the host can perform this action',

    // Game errors
    NOT_YOUR_TURN: 'It is not your turn',
    INVALID_BID: 'Invalid bid amount',
    INVALID_CARD: 'Cannot play that card',
    INVALID_PHASE: 'Cannot perform that action during this phase',
    NOT_ENOUGH_PLAYERS: 'Need 5 players to start',

    // Validation errors
    VALIDATION_ERROR: 'Invalid input',
    MISSING_PARAMETER: 'Missing required parameter',

    // Generic
    INTERNAL_ERROR: 'An unexpected error occurred'
} as const;

export type ErrorCode = keyof typeof ERROR_CODES;
