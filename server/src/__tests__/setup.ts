// Jest setup file
// This runs before each test file

// Mock the logger to silence output during tests
jest.mock('../services/Logger', () => {
    return {
        Logger: jest.fn().mockImplementation(() => ({
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
            debug: jest.fn(),
            playerAction: jest.fn(),
            phaseChange: jest.fn(),
            botAction: jest.fn(),
            socketEvent: jest.fn(),
        })),
        globalLogger: {
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
            debug: jest.fn(),
        }
    };
});

// Set test environment
process.env.NODE_ENV = 'test';

// Increase timeout for slower tests
jest.setTimeout(10000);
