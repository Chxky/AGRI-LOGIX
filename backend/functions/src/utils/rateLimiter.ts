import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();

export const RATE_LIMIT_CONFIG = {
  windowMs: 60_000,
  maxRequests: 30,
};

const WINDOW_MS = RATE_LIMIT_CONFIG.windowMs;
const MAX_REQUESTS = RATE_LIMIT_CONFIG.maxRequests;

export async function checkRateLimit(userId: string): Promise<void> {
  const now = Date.now();
  const ref = db.collection('rateLimits').doc(userId);

  await db.runTransaction(async (transaction) => {
    const doc = await transaction.get(ref);
    const data = doc.data();

    if (!data || now > data.windowStart + WINDOW_MS) {
      transaction.set(ref, {
        count: 1,
        windowStart: now,
        userId,
        updatedAt: admin.firestore.Timestamp.now(),
      });
      return;
    }

    if (data.count >= MAX_REQUESTS) {
      const resetIn = Math.ceil((data.windowStart + WINDOW_MS - now) / 1000);
      throw new functions.https.HttpsError(
        'resource-exhausted',
        `Rate limit exceeded. Try again in ${resetIn}s.`
      );
    }

    transaction.update(ref, {
      count: data.count + 1,
      updatedAt: admin.firestore.Timestamp.now(),
    });
  });
}
