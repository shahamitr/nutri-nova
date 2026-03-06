import { beforeAll, afterAll, afterEach } from 'vitest';
import 'dotenv/config';

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.DB_NAME = process.env.DB_NAME_TEST || 'nutrivoice_test';

// Global test setup
beforeAll(async () => {
  // Database connection setup will be added when implementing database layer
  console.log('Test environment initialized');
});

// Global test teardown
afterAll(async () => {
  // Database connection cleanup will be added when implementing database layer
  console.log('Test environment cleaned up');
});

// Cleanup after each test
afterEach(async () => {
  // Clear any test data if needed
});
