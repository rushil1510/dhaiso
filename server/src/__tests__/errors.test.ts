import {
    DhaisoError,
    RoomNotFoundError,
    RoomFullError,
    NameTakenError,
    IPAlreadyInRoomError,
    GameInProgressError,
    NotInRoomError,
    NotHostError,
    NotYourTurnError,
    InvalidBidError,
    InvalidCardError,
    InvalidPhaseError,
    NotEnoughPlayersError,
    ValidationError,
    MissingParameterError,
    ERROR_CODES
} from '../errors';

describe('Error Classes', () => {
    describe('DhaisoError', () => {
        it('should create error with all properties', () => {
            const error = new DhaisoError(
                'Test error',
                'TEST_ERROR',
                { foo: 'bar' },
                400,
                true
            );

            expect(error.message).toBe('Test error');
            expect(error.code).toBe('TEST_ERROR');
            expect(error.context).toEqual({ foo: 'bar' });
            expect(error.statusCode).toBe(400);
            expect(error.isOperational).toBe(true);
        });

        it('should extend Error', () => {
            const error = new DhaisoError('Test', 'TEST', {});
            expect(error).toBeInstanceOf(Error);
        });

        it('should convert to client-safe error', () => {
            const error = new DhaisoError('Secret details', 'SOME_ERROR', {
                sensitive: 'data'
            });

            const clientError = error.toClientError();

            expect(clientError).toEqual({
                code: 'SOME_ERROR',
                message: 'Secret details'
            });
            // Should not include context
            expect(clientError).not.toHaveProperty('context');
        });
    });

    describe('RoomNotFoundError', () => {
        it('should create correct error', () => {
            const error = new RoomNotFoundError('ABC123');

            expect(error.code).toBe('ROOM_NOT_FOUND');
            expect(error.message).toContain('ABC123');
            expect(error.context.roomCode).toBe('ABC123');
            expect(error.statusCode).toBe(404);
        });
    });

    describe('RoomFullError', () => {
        it('should create correct error', () => {
            const error = new RoomFullError('ABC123');

            expect(error.code).toBe('ROOM_FULL');
            expect(error.context.roomCode).toBe('ABC123');
            expect(error.context.maxPlayers).toBe(5);
        });
    });

    describe('NameTakenError', () => {
        it('should create correct error', () => {
            const error = new NameTakenError('Alice', 'ABC123');

            expect(error.code).toBe('NAME_TAKEN');
            expect(error.message).toContain('Alice');
            expect(error.context.name).toBe('Alice');
            expect(error.context.roomCode).toBe('ABC123');
        });
    });

    describe('IPAlreadyInRoomError', () => {
        it('should create correct error', () => {
            const error = new IPAlreadyInRoomError('ABC123');

            expect(error.code).toBe('IP_ALREADY_IN_ROOM');
            expect(error.message).toContain('network');
        });
    });

    describe('GameInProgressError', () => {
        it('should create correct error', () => {
            const error = new GameInProgressError('ABC123');

            expect(error.code).toBe('GAME_IN_PROGRESS');
        });
    });

    describe('NotInRoomError', () => {
        it('should create correct error', () => {
            const error = new NotInRoomError('socket-123');

            expect(error.code).toBe('NOT_IN_ROOM');
            expect(error.context.socketId).toBe('socket-123');
        });
    });

    describe('NotHostError', () => {
        it('should create correct error', () => {
            const error = new NotHostError('socket-123', 'socket-456');

            expect(error.code).toBe('NOT_HOST');
            expect(error.statusCode).toBe(403);
        });
    });

    describe('NotYourTurnError', () => {
        it('should create correct error', () => {
            const error = new NotYourTurnError('player-1', 'player-2');

            expect(error.code).toBe('NOT_YOUR_TURN');
            expect(error.context.playerId).toBe('player-1');
            expect(error.context.currentTurnPlayerId).toBe('player-2');
        });
    });

    describe('InvalidBidError', () => {
        it('should create correct error', () => {
            const error = new InvalidBidError(150, 170, 'Bid too low');

            expect(error.code).toBe('INVALID_BID');
            expect(error.context.bid).toBe(150);
            expect(error.context.currentBid).toBe(170);
            expect(error.context.reason).toBe('Bid too low');
        });
    });

    describe('InvalidCardError', () => {
        it('should create correct error', () => {
            const error = new InvalidCardError('A♠', 'Must follow suit');

            expect(error.code).toBe('INVALID_CARD');
            expect(error.context.card).toBe('A♠');
            expect(error.context.reason).toBe('Must follow suit');
        });
    });

    describe('InvalidPhaseError', () => {
        it('should create correct error', () => {
            const error = new InvalidPhaseError('bid', 'playing', 'bidding');

            expect(error.code).toBe('INVALID_PHASE');
            expect(error.message).toContain('bid');
            expect(error.message).toContain('playing');
        });
    });

    describe('NotEnoughPlayersError', () => {
        it('should create correct error', () => {
            const error = new NotEnoughPlayersError(3, 5);

            expect(error.code).toBe('NOT_ENOUGH_PLAYERS');
            expect(error.context.currentPlayers).toBe(3);
            expect(error.context.requiredPlayers).toBe(5);
        });
    });

    describe('ValidationError', () => {
        it('should create correct error', () => {
            const error = new ValidationError('name', 'Name is required');

            expect(error.code).toBe('VALIDATION_ERROR');
            expect(error.context.field).toBe('name');
        });
    });

    describe('MissingParameterError', () => {
        it('should create correct error', () => {
            const error = new MissingParameterError('roomCode');

            expect(error.code).toBe('MISSING_PARAMETER');
            expect(error.message).toContain('roomCode');
        });
    });

    describe('ERROR_CODES', () => {
        it('should have all error codes defined', () => {
            expect(ERROR_CODES.ROOM_NOT_FOUND).toBeDefined();
            expect(ERROR_CODES.ROOM_FULL).toBeDefined();
            expect(ERROR_CODES.NAME_TAKEN).toBeDefined();
            expect(ERROR_CODES.IP_ALREADY_IN_ROOM).toBeDefined();
            expect(ERROR_CODES.GAME_IN_PROGRESS).toBeDefined();
            expect(ERROR_CODES.NOT_IN_ROOM).toBeDefined();
            expect(ERROR_CODES.NOT_HOST).toBeDefined();
            expect(ERROR_CODES.NOT_YOUR_TURN).toBeDefined();
            expect(ERROR_CODES.INVALID_BID).toBeDefined();
            expect(ERROR_CODES.INVALID_CARD).toBeDefined();
            expect(ERROR_CODES.INVALID_PHASE).toBeDefined();
            expect(ERROR_CODES.NOT_ENOUGH_PLAYERS).toBeDefined();
            expect(ERROR_CODES.INTERNAL_ERROR).toBeDefined();
        });
    });
});
