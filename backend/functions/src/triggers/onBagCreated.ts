import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as crypto from 'crypto';

const db = admin.firestore();

export const onBagCreated = functions.firestore
  .document('seedBags/{bagId}')
  .onCreate(async (snap, context) => {
    const bag = snap.data();
    const { bagId } = context.params;

    const previousHash = crypto
      .createHash('sha256')
      .update('GENESIS_BLOCK_AGRI_LOGIX_2026')
      .digest('hex');

    const hashData = JSON.stringify({
      bagId,
      variety: bag.variety,
      batchNumber: bag.batchNumber,
      certificationId: bag.certificationId,
    });

    const currentHash = crypto
      .createHash('sha256')
      .update(previousHash + hashData)
      .digest('hex');

    await db.collection('redemptionLog').add({
      bagId,
      action: 'generated',
      timestamp: admin.firestore.Timestamp.now(),
      performedBy: bag.seedHouseId,
      details: {
        variety: bag.variety,
        batchNumber: bag.batchNumber,
        seedHouseId: bag.seedHouseId,
      },
      previousHash,
      currentHash,
      createdAt: admin.firestore.Timestamp.now(),
    });

    functions.logger.info(`Blockchain audit entry created for bag ${bagId}`, {
      bagId,
      currentHash,
    });
  });
