jest.mock('firebase-admin', () => {
  const mockFirestore = () => ({
    collection: () => ({
      orderBy: () => ({
        limit: () => ({
          get: () => Promise.resolve({ empty: true, docs: [] }),
        }),
      }),
    }),
  });
  mockFirestore.Timestamp = { now: () => ({ toMillis: () => Date.now() }) };
  return {
    initializeApp: jest.fn(),
    firestore: mockFirestore,
  };
});

import { computeHash, getGenesisHash } from '../utils/hashchain';

describe('computeHash', () => {
  it('produces a deterministic hash for the same input', () => {
    const a = computeHash('genesis', '{"test":"data"}');
    const b = computeHash('genesis', '{"test":"data"}');
    expect(a).toBe(b);
  });

  it('produces different hashes for different previous hashes', () => {
    const a = computeHash('hash-a', 'same-data');
    const b = computeHash('hash-b', 'same-data');
    expect(a).not.toBe(b);
  });

  it('produces different hashes for different data', () => {
    const a = computeHash('genesis', 'data-a');
    const b = computeHash('genesis', 'data-b');
    expect(a).not.toBe(b);
  });

  it('returns a 64-character hex string', () => {
    const hash = computeHash('genesis', 'some-data');
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });
});

describe('getGenesisHash', () => {
  it('returns a deterministic genesis hash', () => {
    const a = getGenesisHash();
    const b = getGenesisHash();
    expect(a).toBe(b);
  });

  it('returns a 64-character hex string', () => {
    expect(getGenesisHash()).toMatch(/^[a-f0-9]{64}$/);
  });
});

describe('chain integrity', () => {
  it('links blocks in a verifiable chain', () => {
    const hash0 = getGenesisHash();
    const hash1 = computeHash(hash0, '{"action":"generated","bagId":"BAG-001"}');
    const hash2 = computeHash(hash1, '{"action":"dispatched","bagId":"BAG-001"}');
    const hash3 = computeHash(hash2, '{"action":"redeemed","bagId":"BAG-001"}');

    expect(hash1).not.toBe(hash0);
    expect(hash2).not.toBe(hash1);
    expect(hash3).not.toBe(hash2);

    expect(computeHash(hash1, '{"action":"dispatched","bagId":"BAG-001"}')).toBe(hash2);

    const tampered = '{"action":"redeemed","bagId":"BAG-001-TAMPERED"}';
    expect(computeHash(hash2, tampered)).not.toBe(hash3);
  });
});
