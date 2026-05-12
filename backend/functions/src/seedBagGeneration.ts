import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as crypto from 'crypto';
import * as QRCode from 'qrcode';

const db = admin.firestore();

interface GenerateBagInput {
  variety: string;
  batchNumber: string;
  certificationId: string;
  seedHouseId: string;
  quantity: number;
}

interface SeedBagRecord {
  bagId: string;
  qrCodeData: string;
  qrCodeBase64: string;
  variety: string;
  batchNumber: string;
  certificationId: string;
  seedHouseId: string;
  condition: 'in_stock';
  dispatchedTo: null;
  farmerPhone: null;
  redemptionTimestamp: null;
  redemptionLocation: null;
  isAuthentic: boolean;
  createdAt: FirebaseFirestore.Timestamp;
}

export const generateSeedBagQR = functions.https.onCall(async (data: GenerateBagInput, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }

  const allowedRoles = ['seed_house', 'admin'];
  if (!allowedRoles.includes(context.auth.token.role || '')) {
    throw new functions.https.HttpsError('permission-denied', 'Only seed house staff can generate bag QR codes');
  }

  const { variety, batchNumber, certificationId, seedHouseId, quantity } = data;

  if (!variety || !batchNumber || !certificationId || !seedHouseId || !quantity) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing required fields: variety, batchNumber, certificationId, seedHouseId, quantity');
  }

  if (quantity < 1 || quantity > 10000) {
    throw new functions.https.HttpsError('invalid-argument', 'Quantity must be between 1 and 10,000');
  }

  const certDoc = await db.collection('certificationWhitelist').doc(certificationId).get();
  if (!certDoc.exists) {
    throw new functions.https.HttpsError('not-found', `Certification ID ${certificationId} not found in whitelist. Please verify with Seed Services Institute.`);
  }

  const seedHouseDoc = await db.collection('seedHouses').doc(seedHouseId).get();
  if (!seedHouseDoc.exists) {
    throw new functions.https.HttpsError('not-found', `Seed house ${seedHouseId} not found`);
  }

  const batch = await db.runTransaction(async (transaction) => {
    const batchId = crypto.randomUUID();
    const timestamp = admin.firestore.Timestamp.now();
    const bags: SeedBagRecord[] = [];

    for (let i = 0; i < quantity; i++) {
      const bagId = `BAG-${batchNumber}-${Date.now()}-${i + 1}`;
      const qrCodeData = `agrilogix://verify/${bagId}`;

      const qrCodeBase64 = await QRCode.toDataURL(qrCodeData, {
        width: 400,
        margin: 2,
        color: { dark: '#1B5E20', light: '#FFFFFF' },
      });

      const bagRecord: SeedBagRecord = {
        bagId,
        qrCodeData,
        qrCodeBase64,
        variety,
        batchNumber,
        certificationId,
        seedHouseId,
        condition: 'in_stock',
        dispatchedTo: null,
        farmerPhone: null,
        redemptionTimestamp: null,
        redemptionLocation: null,
        isAuthentic: true,
        createdAt: timestamp,
      };

      bags.push(bagRecord);
    }

    const batchSize = 500;
    for (let i = 0; i < bags.length; i += batchSize) {
      const chunk = bags.slice(i, i + batchSize);
      const writeBatch = db.batch();
      chunk.forEach(bag => {
        const ref = db.collection('seedBags').doc(bag.bagId);
        writeBatch.set(ref, bag);
      });
      await writeBatch.commit();
    }

    return { bags, batchId };
  });

  functions.logger.info(`Generated ${quantity} QR codes for batch ${batchNumber}`, {
    seedHouseId,
    variety,
    certificationId,
  });

  return {
    success: true,
    message: `Successfully generated ${quantity} QR code stickers for batch ${batchNumber}`,
    batchId: batch.batchId,
    bags: batch.bags.map(bag => ({
      bagId: bag.bagId,
      qrCodeData: bag.qrCodeData,
      qrCodeBase64: bag.qrCodeBase64,
      variety: bag.variety,
      batchNumber: bag.batchNumber,
    })),
  };
});
