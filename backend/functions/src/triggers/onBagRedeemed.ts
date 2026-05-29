import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { computeHash, getChainTip } from '../utils/hashchain';
import { sendSms, buildRedemptionSms } from '../utils/smsService';

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
    let farmerName = 'Farmer';

    if (farmerDoc.exists) {
      const farmerData = farmerDoc.data()!;
      ward = farmerData.ward || ward;
      farmerName = farmerData.name || farmerName;
    }

    const previousHash = await getChainTip();

    const hashData = JSON.stringify({
      bagId,
      farmerPhone: after.farmerPhone,
      timestamp: after.redemptionTimestamp?.toMillis(),
      ward,
    });

    const currentHash = computeHash(previousHash, hashData);

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

    const smsMessage = buildRedemptionSms(farmerName, bagId, after.variety || 'Seed');

    const smsOptIn = farmerDoc.exists ? (farmerDoc.data()!.smsOptIn !== false) : true;
    if (smsOptIn) {
      await sendSms(after.farmerPhone, smsMessage);
    }

    functions.logger.info(`Bag ${bagId} redemption audit trail recorded`, {
      bagId,
      farmerPhone: after.farmerPhone,
      ward,
      hashChain: { previousHash, currentHash },
    });
  });
