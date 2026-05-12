import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();

export const getBagDetails = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }

  const { bagId } = data;
  if (!bagId) {
    throw new functions.https.HttpsError('invalid-argument', 'bagId is required');
  }

  const bagDoc = await db.collection('seedBags').doc(bagId).get();
  if (!bagDoc.exists) {
    throw new functions.https.HttpsError('not-found', 'Seed bag not found');
  }

  const bag = bagDoc.data()!;

  const logsSnapshot = await db.collection('redemptionLog')
    .where('bagId', '==', bagId)
    .orderBy('timestamp', 'desc')
    .limit(20)
    .get();

  const journey = logsSnapshot.docs.map(doc => ({
    action: doc.data().action,
    timestamp: doc.data().timestamp?.toDate().toISOString(),
    location: doc.data().location ? {
      latitude: doc.data().location.latitude,
      longitude: doc.data().location.longitude,
    } : null,
    performedBy: doc.data().performedBy,
    hashReference: doc.data().currentHash,
  }));

  let seedHouseName = 'Unknown';
  if (bag.seedHouseId) {
    const shDoc = await db.collection('seedHouses').doc(bag.seedHouseId).get();
    if (shDoc.exists) {
      seedHouseName = shDoc.data()!.name;
    }
  }

  return {
    bagId: bagDoc.id,
    qrCodeData: bag.qrCodeData,
    variety: bag.variety,
    batchNumber: bag.batchNumber,
    certificationId: bag.certificationId,
    seedHouse: seedHouseName,
    condition: bag.condition,
    isAuthentic: bag.isAuthentic,
    dispatchedTo: bag.dispatchedTo || null,
    farmerPhone: bag.farmerPhone || null,
    redemptionTimestamp: bag.redemptionTimestamp?.toDate().toISOString() || null,
    redemptionLocation: bag.redemptionLocation ? {
      latitude: bag.redemptionLocation.latitude,
      longitude: bag.redemptionLocation.longitude,
    } : null,
    createdAt: bag.createdAt?.toDate().toISOString() || null,
    journey,
  };
});
