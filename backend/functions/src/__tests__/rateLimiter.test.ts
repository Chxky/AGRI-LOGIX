jest.mock('firebase-admin', () => {
  const mockFirestore = () => ({
    collection: () => ({
      doc: () => ({
        get: jest.fn(),
        set: jest.fn(),
      }),
    }),
    runTransaction: jest.fn(),
  });
  mockFirestore.Timestamp = { now: () => ({ toMillis: () => Date.now() }) };
  return {
    initializeApp: jest.fn(),
    firestore: mockFirestore,
  };
});

import { RATE_LIMIT_CONFIG } from '../utils/rateLimiter';

describe('RATE_LIMIT_CONFIG', () => {
  it('has a max requests value', () => {
    expect(RATE_LIMIT_CONFIG.maxRequests).toBeGreaterThan(0);
  });

  it('has a window in milliseconds', () => {
    expect(RATE_LIMIT_CONFIG.windowMs).toBeGreaterThan(0);
  });
});
