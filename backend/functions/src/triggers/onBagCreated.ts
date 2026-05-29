import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { computeHash, getGenesisHash } from '../utils/hashchain';

const db = admin.firestore();

export const onBagCreated = functions.firestore
  .document('seedBags/{bagId}')
  .onCreate(async (snap, context) => {
    const bag = snap.data();
    const { bagId } = context.params;

    const previousHash = getGenesisHash();

    const hashData = JSON.stringify({
      bagId,
      variety: bag.variety,
      batchNumber: bag.batchNumber,
      certificationId: bag.certificationId,
    });

    const currentHash = computeHash(previousHash, hashData);

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
