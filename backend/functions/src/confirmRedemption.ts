import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { checkRateLimit } from './utils/rateLimiter';
import { computeHash, getChainTip } from './utils/hashchain';
import { sendSms, buildRedemptionSms } from './utils/smsService';

const db = admin.firestore();

export const confirmRedemption = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }
  await checkRateLimit(context.auth.uid);

  const { bagId, capturedBy, ward } = data;

  if (!bagId) {
    throw new functions.https.HttpsError('invalid-argument', 'bagId is required');
  }

  const result = await db.runTransaction(async (transaction) => {
    const bagRef = db.collection('seedBags').doc(bagId);
    const bagDoc = await transaction.get(bagRef);

    if (!bagDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Seed bag not found');
    }

    const bag = bagDoc.data()!;

    if (bag.condition === 'redeemed') {
      throw new functions.https.HttpsError('already-exists', 'This seed bag has already been redeemed');
    }

    if (bag.condition === 'flagged') {
      throw new functions.https.HttpsError('permission-denied', 'This bag has been flagged as counterfeit');
    }

    const timestamp = admin.firestore.Timestamp.now();
    const previousHash = await getChainTip();
    const logData = JSON.stringify({ bagId, action: 'redeemed', timestamp: timestamp.toMillis() });
    const currentHash = computeHash(previousHash, logData);

    transaction.update(bagRef, {
      condition: 'redeemed',
      redemptionTimestamp: timestamp,
      redeemedBy: context.auth?.uid || null,
    });

    const logRef = db.collection('redemptionLog').doc();
    transaction.set(logRef, {
      bagId,
      action: 'redeemed',
      timestamp,
      performedBy: context.auth?.uid || 'extension-officer',
      ward: ward || null,
      capturedBy: capturedBy || null,
      previousHash,
      currentHash,
      createdAt: timestamp,
    });

    functions.logger.info(`Bag ${bagId} redemption confirmed by officer ${context.auth?.uid}`, {
      bagId,
      hashChain: { previousHash, currentHash },
    });

    const farmerPhone = bag.farmerPhone;
    if (farmerPhone) {
      const sms = buildRedemptionSms(bag.farmerName || 'Farmer', bagId, bag.variety || '');
      sendSms(farmerPhone, sms).catch(e => functions.logger.warn('SMS send failed', e));
    }

    return {
      success: true,
      message: `Bag ${bagId} redemption confirmed successfully`,
      bagId,
      variety: bag.variety,
      batchNumber: bag.batchNumber,
      farmerName: bag.farmerName || 'Unknown',
      farmerPhone: bag.farmerPhone || null,
      timestamp: timestamp.toDate().toISOString(),
    };
  });

  return result;
});
