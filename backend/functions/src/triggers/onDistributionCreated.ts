import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as crypto from 'crypto';

const db = admin.firestore();

export const onDistributionCreated = functions.firestore
  .document('distributions/{distributionId}')
  .onCreate(async (snap, context) => {
    const distribution = snap.data();
    const { distributionId } = context.params;

    const distributionData = JSON.stringify({
      distributionId,
      bagIds: distribution.bagIds,
      destinationDistrict: distribution.destinationDistrict,
    });

    const hash = crypto
      .createHash('sha256')
      .update(distributionData + Date.now())
      .digest('hex');

    const batch = db.batch();

    distribution.bagIds.forEach((bagId: string) => {
      const bagRef = db.collection('seedBags').doc(bagId);
      batch.update(bagRef, {
        condition: 'dispatched',
        dispatchedTo: distribution.destinationDistrict,
      });
    });

    const logRef = db.collection('redemptionLog').doc();
    batch.set(logRef, {
      bagIds: distribution.bagIds,
      action: 'dispatched',
      timestamp: admin.firestore.Timestamp.now(),
      performedBy: distribution.dispatchedBy || 'system',
      destinationDistrict: distribution.destinationDistrict,
      distributionId,
      previousHash: hash,
      currentHash: crypto.createHash('sha256').update(hash + distributionData).digest('hex'),
      createdAt: admin.firestore.Timestamp.now(),
    });

    await batch.commit();

    functions.logger.info(`Distribution ${distributionId} processed. ${distribution.bagIds.length} bags dispatched to ${distribution.destinationDistrict}`);
  });
