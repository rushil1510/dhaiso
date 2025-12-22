import winston from 'winston';

// Log context interface for structured logging
export interface LogContext {
    roomCode?: string;
    playerId?: string;
    playerName?: string;
    ip?: string;
    phase?: string;
    action?: string;
    socketId?: string;
    [key: string]: any;
}

// Custom format for readable console output
const consoleFormat = winston.format.printf(({ level, message, timestamp, ...meta }) => {
    const contextParts: string[] = [];

    if (meta.roomCode) contextParts.push(`ROOM:${meta.roomCode}`);
    if (meta.playerName) contextParts.push(`PLAYER:${meta.playerName}`);
    if (meta.phase) contextParts.push(`PHASE:${meta.phase}`);

    const contextStr = contextParts.length > 0 ? `[${contextParts.join('|')}] ` : '';

    // Format additional metadata
    const metaKeys = Object.keys(meta).filter(k =>
        !['roomCode', 'playerName', 'phase', 'service'].includes(k)
    );

    let metaStr = '';
    if (metaKeys.length > 0) {
        const metaObj: Record<string, any> = {};
        metaKeys.forEach(k => { metaObj[k] = meta[k]; });
        metaStr = `\n    └─ ${JSON.stringify(metaObj)}`;
    }

    return `[${timestamp}] [${level.toUpperCase()}] ${contextStr}${message}${metaStr}`;
});

// Create the main logger instance
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.errors({ stack: true })
    ),
    defaultMeta: { service: 'dhaiso-server' },
    transports: [
        // Console transport with color and readable format
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                consoleFormat
            )
        })
    ]
});

// Add file transport in production
if (process.env.NODE_ENV === 'production') {
    logger.add(new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error',
        format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
        )
    }));
    logger.add(new winston.transports.File({
        filename: 'logs/combined.log',
        format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
        )
    }));
}

/**
 * Logger class that provides context-aware structured logging.
 * Create child loggers with specific context for rooms/players.
 */
export class Logger {
    private context: LogContext;

    constructor(context: LogContext = {}) {
        this.context = context;
    }

    /**
     * Create a new logger with additional context
     */
    withContext(additionalContext: LogContext): Logger {
        return new Logger({ ...this.context, ...additionalContext });
    }

    /**
     * Create a room-scoped logger
     */
    forRoom(roomCode: string): Logger {
        return this.withContext({ roomCode });
    }

    /**
     * Create a player-scoped logger
     */
    forPlayer(playerId: string, playerName?: string): Logger {
        return this.withContext({ playerId, playerName });
    }

    private log(level: string, message: string, data?: object) {
        logger.log(level, message, { ...this.context, ...data });
    }

    debug(message: string, data?: object) {
        this.log('debug', message, data);
    }

    info(message: string, data?: object) {
        this.log('info', message, data);
    }

    warn(message: string, data?: object) {
        this.log('warn', message, data);
    }

    error(message: string, error?: Error | unknown, data?: object) {
        if (error instanceof Error) {
            this.log('error', message, {
                ...data,
                error: {
                    name: error.name,
                    message: error.message,
                    stack: error.stack
                }
            });
        } else {
            this.log('error', message, { ...data, error });
        }
    }

    // Game-specific logging helpers

    /**
     * Log a player action (bid, play card, etc.)
     */
    playerAction(playerId: string, playerName: string, action: string, details?: object) {
        this.info(`Player action: ${action}`, {
            playerId,
            playerName,
            action,
            ...details
        });
    }

    /**
     * Log a game state transition
     */
    phaseChange(from: string, to: string, reason?: string) {
        this.info(`Phase transition: ${from} → ${to}`, {
            fromPhase: from,
            toPhase: to,
            reason
        });
    }

    /**
     * Log a bot action 
     */
    botAction(botName: string, action: string, reasoning?: string, details?: object) {
        this.info(`🤖 Bot action: ${action}`, {
            botName,
            action,
            reasoning,
            ...details
        });
    }

    /**
     * Log a socket event
     */
    socketEvent(event: string, socketId: string, direction: 'in' | 'out', data?: object) {
        const arrow = direction === 'in' ? '→' : '←';
        this.debug(`Socket ${arrow} ${event}`, {
            socketId,
            event,
            direction,
            ...data
        });
    }
}

// Export a default global logger instance
export const globalLogger = new Logger();

// Named export for the class
export default Logger;
