// Jest setup file
// This runs before each test file

// Suppress console output during tests (optional - comment out if you want to see logs)
// global.console = {
//   ...console,
//   log: jest.fn(),
//   debug: jest.fn(),
//   info: jest.fn(),
//   warn: jest.fn(),
//   error: jest.fn(),
// };

// Set test environment
process.env.NODE_ENV = 'test';

// Increase timeout for slower tests
jest.setTimeout(10000);
