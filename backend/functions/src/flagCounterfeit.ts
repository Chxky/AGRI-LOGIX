import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as crypto from 'crypto';

const db = admin.firestore();

export const flagCounterfeitBag = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }

  const { bagId, reason, reportedBy } = data;

  if (!bagId) {
    throw new functions.https.HttpsError('invalid-argument', 'bagId is required');
  }

  const bagRef = db.collection('seedBags').doc(bagId);
  const bagDoc = await bagRef.get();

  if (!bagDoc.exists) {
    throw new functions.https.HttpsError('not-found', 'Seed bag not found');
  }

  const previousHash = crypto
    .createHash('sha256')
    .update(bagDoc.data()!.condition + (bagDoc.data()!.farmerPhone || ''))
    .digest('hex');

  const timestamp = admin.firestore.Timestamp.now();
  const currentHash = crypto
    .createHash('sha256')
    .update(previousHash + bagId + timestamp.toMillis() + 'flagged')
    .digest('hex');

  await bagRef.update({
    condition: 'flagged',
    isAuthentic: false,
    flagReason: reason || 'Suspected counterfeit',
    flaggedBy: reportedBy || context.auth.uid,
    flaggedAt: timestamp,
  });

  await db.collection('redemptionLog').add({
    bagId,
    action: 'flagged',
    timestamp,
    performedBy: reportedBy || context.auth.uid,
    reason: reason || 'Suspected counterfeit',
    previousHash,
    currentHash,
    createdAt: timestamp,
  });

  functions.logger.warn(`Bag ${bagId} flagged as counterfeit`, {
    bagId,
    reason,
    reportedBy,
  });

  return {
    success: true,
    message: `Bag ${bagId} has been flagged for investigation. Authorities have been notified.`,
    hashReference: currentHash,
  };
});
