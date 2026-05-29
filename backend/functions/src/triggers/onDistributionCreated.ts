import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { computeHash, getChainTip } from '../utils/hashchain';
import { sendSms, buildDistributionSms } from '../utils/smsService';

const db = admin.firestore();

export const onDistributionCreated = functions.firestore
  .document('distributions/{distributionId}')
  .onCreate(async (snap, context) => {
    const distribution = snap.data();
    const { distributionId } = context.params;

    const previousHash = await getChainTip();

    const distributionData = JSON.stringify({
      distributionId,
      bagIds: distribution.bagIds,
      destinationDistrict: distribution.destinationDistrict,
    });

    const currentHash = computeHash(previousHash, distributionData);

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
      previousHash,
      currentHash,
      createdAt: admin.firestore.Timestamp.now(),
    });

    await batch.commit();

    const smsMessage = buildDistributionSms(distribution.destinationDistrict, distribution.bagIds.length);

    const extensionOfficersSnapshot = await db.collection('users')
      .where('role', '==', 'extension_officer')
      .where('district', '==', distribution.destinationDistrict)
      .select('phone')
      .get();

    const smsPromises = extensionOfficersSnapshot.docs.map(doc =>
      sendSms(doc.data().phone, smsMessage)
    );
    await Promise.all(smsPromises);

    functions.logger.info(`Distribution ${distributionId} processed. ${distribution.bagIds.length} bags dispatched to ${distribution.destinationDistrict}`, {
      extensionOfficersNotified: smsPromises.length,
    });
  });
