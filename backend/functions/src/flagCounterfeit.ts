import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { checkRateLimit } from './utils/rateLimiter';
import { computeHash, getChainTip } from './utils/hashchain';
import { sendSms, buildFlaggedSms } from './utils/smsService';

const db = admin.firestore();

export const flagCounterfeitBag = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }
  await checkRateLimit(context.auth.uid);

  const { bagId, reason, reportedBy } = data;

  if (!bagId) {
    throw new functions.https.HttpsError('invalid-argument', 'bagId is required');
  }

  const bagRef = db.collection('seedBags').doc(bagId);
  const bagDoc = await bagRef.get();

  if (!bagDoc.exists) {
    throw new functions.https.HttpsError('not-found', 'Seed bag not found');
  }

  const timestamp = admin.firestore.Timestamp.now();
  const previousHash = await getChainTip();
  const logData = JSON.stringify({ bagId, action: 'flagged', reason: reason || 'Suspected counterfeit', timestamp: timestamp.toMillis() });
  const currentHash = computeHash(previousHash, logData);

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

  const smsMessage = buildFlaggedSms(bagId, reason || 'Suspected counterfeit');

  const adminSnapshot = await db.collection('users')
    .where('role', '==', 'admin')
    .select('phone')
    .get();

  const adminPhones = adminSnapshot.docs.map(d => d.data().phone).filter(Boolean);
  await Promise.all(adminPhones.map((phone: string) => sendSms(phone, smsMessage)));

  functions.logger.warn(`Bag ${bagId} flagged as counterfeit`, {
    bagId,
    reason,
    reportedBy,
    adminsNotified: adminPhones.length,
  });

  return {
    success: true,
    message: `Bag ${bagId} has been flagged for investigation. Authorities have been notified.`,
    hashReference: currentHash,
  };
});
