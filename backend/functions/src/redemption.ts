import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as crypto from 'crypto';
import { checkRateLimit } from './utils/rateLimiter';
import { computeHash, getChainTip } from './utils/hashchain';

const db = admin.firestore();

interface RedeemBagInput {
  bagId: string;
  phoneNumber: string;
  pin: string;
  location?: { latitude: number; longitude: number };
  ward?: string;
  capturedBy?: string;
}

export const redeemBag = functions.https.onCall(async (data: RedeemBagInput, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'You must be logged in to redeem a seed bag');
  }
  await checkRateLimit(context.auth.uid);

  const { bagId, phoneNumber, pin, location, ward } = data;

  if (!bagId || !phoneNumber || !pin) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing required fields: bagId, phoneNumber, pin');
  }

  const phoneRegex = /^\+?263\d{9}$/;
  if (!phoneRegex.test(phoneNumber)) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid Zimbabwe phone number. Use format: +2637XXXXXXX');
  }

  const result = await db.runTransaction(async (transaction) => {
    const bagRef = db.collection('seedBags').doc(bagId);
    const bagDoc = await transaction.get(bagRef);

    if (!bagDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Seed bag not found. Please check the QR code and try again.');
    }

    const bag = bagDoc.data()!;

    if (bag.condition === 'redeemed') {
      throw new functions.https.HttpsError('already-exists', 'This seed bag has already been redeemed by another farmer.');
    }

    if (bag.condition === 'flagged') {
      throw new functions.https.HttpsError('permission-denied', 'This bag has been flagged as potentially counterfeit. Please contact your extension officer.');
    }

    if (!bag.isAuthentic) {
      throw new functions.https.HttpsError('permission-denied', 'This bag is not certified authentic. Please contact Seed Services Institute.');
    }

    const farmerRef = db.collection('farmers').doc(phoneNumber);
    const farmerDoc = await transaction.get(farmerRef);

    if (!farmerDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Farmer profile not found. Please register via *123# or contact your extension officer.');
    }

    const farmer = farmerDoc.data()!;
    const pinHash = crypto.createHash('sha256').update(pin).digest('hex');

    if (farmer.pinHash !== pinHash) {
      throw new functions.https.HttpsError('permission-denied', 'Incorrect PIN. Please try again.');
    }

    const timestamp = admin.firestore.Timestamp.now();
    const geopoint = location
      ? new admin.firestore.GeoPoint(location.latitude, location.longitude)
      : null;

    const previousHash = await getChainTip();
    const logData = JSON.stringify({ bagId, phoneNumber, timestamp: timestamp.toMillis(), location });
    const currentHash = computeHash(previousHash, logData);

    transaction.update(bagRef, {
      condition: 'redeemed',
      farmerPhone: phoneNumber,
      redemptionTimestamp: timestamp,
      redemptionLocation: geopoint,
    });

    const logRef = db.collection('redemptionLog').doc();
    transaction.set(logRef, {
      bagId,
      action: 'redeemed',
      timestamp,
      location: geopoint,
      performedBy: phoneNumber,
      ward: ward || farmer.ward || null,
      previousHash,
      currentHash,
      createdAt: timestamp,
    });

    functions.logger.info(`Bag ${bagId} redeemed by farmer ${phoneNumber}`, {
      bagId,
      phoneNumber,
      ward: ward || farmer.ward,
      hashChain: { previousHash, currentHash },
    });

    return {
      success: true,
      message: `Receipt confirmed. Bag ${bagId} redeemed successfully. Thank you for participating in Pfumvudza.`,
      bagId,
      variety: bag.variety,
      batchNumber: bag.batchNumber,
      timestamp: timestamp.toDate().toISOString(),
      hashReference: currentHash,
    };
  });

  return result;
});
