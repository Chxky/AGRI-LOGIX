import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as crypto from 'crypto';

const db = admin.firestore();

export const onBagRedeemed = functions.firestore
  .document('seedBags/{bagId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    const { bagId } = context.params;

    if (before.condition === 'redeemed' || after.condition !== 'redeemed') {
      return;
    }

    if (!after.farmerPhone) {
      functions.logger.warn(`Bag ${bagId} marked as redeemed but no farmerPhone set`);
      return;
    }

    const farmerDoc = await db.collection('farmers').doc(after.farmerPhone).get();
    let ward = after.dispatchedTo || null;

    if (farmerDoc.exists) {
      ward = farmerDoc.data()!.ward || ward;
    }

    const lastLogSnapshot = await db.collection('redemptionLog')
      .where('bagId', '==', bagId)
      .orderBy('timestamp', 'desc')
      .limit(1)
      .get();

    const previousHash = lastLogSnapshot.empty
      ? crypto.createHash('sha256').update('GENESIS').digest('hex')
      : lastLogSnapshot.docs[0].data().currentHash;

    const hashData = JSON.stringify({
      bagId,
      farmerPhone: after.farmerPhone,
      timestamp: after.redemptionTimestamp?.toMillis(),
      ward,
    });

    const currentHash = crypto
      .createHash('sha256')
      .update(previousHash + hashData)
      .digest('hex');

    await db.collection('redemptionLog').add({
      bagId,
      action: 'redeemed',
      timestamp: admin.firestore.Timestamp.now(),
      performedBy: after.farmerPhone,
      ward,
      location: after.redemptionLocation || null,
      previousHash,
      currentHash,
      createdAt: admin.firestore.Timestamp.now(),
    });

    functions.logger.info(`Bag ${bagId} redemption audit trail recorded`, {
      bagId,
      farmerPhone: after.farmerPhone,
      ward,
      hashChain: { previousHash, currentHash },
    });
  });
