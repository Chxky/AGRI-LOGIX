import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { checkRateLimit } from './utils/rateLimiter';

const db = admin.firestore();

export const getWardBags = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }
  await checkRateLimit(context.auth.uid);

  const { district } = data;
  if (!district) {
    throw new functions.https.HttpsError('invalid-argument', 'district is required');
  }

  const snapshot = await db.collection('seedBags')
    .where('dispatchedTo', '==', district)
    .orderBy('createdAt', 'desc')
    .limit(500)
    .get();

  const bags = snapshot.docs.map(doc => {
    const bag = doc.data();
    return {
      bagId: doc.id,
      variety: bag.variety || 'Unknown',
      batch: bag.batchNumber || '',
      condition: bag.condition || 'unknown',
      farmerPhone: bag.farmerPhone || null,
      farmerName: bag.farmerName || null,
      status: bag.condition || 'unknown',
      redemptionDate: bag.redemptionTimestamp?.toDate().toISOString() || null,
      createdAt: bag.createdAt?.toDate().toISOString() || null,
    };
  });

  return { bags, district, total: bags.length };
});
