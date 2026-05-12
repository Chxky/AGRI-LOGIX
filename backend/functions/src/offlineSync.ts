import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();

interface PendingRedemption {
  bagId: string;
  phoneNumber: string;
  pin: string;
  location?: { latitude: number; longitude: number };
  ward?: string;
  capturedAt: string;
}

export const syncOfflineRedemptions = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }

  const { redemptions } = data;

  if (!redemptions || !Array.isArray(redemptions) || redemptions.length === 0) {
    throw new functions.https.HttpsError('invalid-argument', 'redemptions array is required and must not be empty');
  }

  if (redemptions.length > 500) {
    throw new functions.https.HttpsError('invalid-argument', 'Maximum 500 redemptions per sync');
  }

  const results: Array<{
    bagId: string;
    status: 'success' | 'failed';
    message: string;
  }> = [];

  for (const redemption of redemptions) {
    try {
      const { bagId, phoneNumber, pin, location, ward } = redemption as PendingRedemption;

      if (!bagId || !phoneNumber || !pin) {
        results.push({
          bagId: bagId || 'unknown',
          status: 'failed',
          message: 'Missing required fields (bagId, phoneNumber, pin)',
        });
        continue;
      }

      const bagRef = db.collection('seedBags').doc(bagId);
      const bagDoc = await bagRef.get();

      if (!bagDoc.exists) {
        results.push({ bagId, status: 'failed', message: 'Bag not found in system' });
        continue;
      }

      const bag = bagDoc.data()!;

      if (bag.condition === 'redeemed') {
        results.push({ bagId, status: 'failed', message: 'Already redeemed' });
        continue;
      }

      if (bag.condition === 'flagged' || !bag.isAuthentic) {
        results.push({ bagId, status: 'failed', message: 'Bag is flagged or not authentic' });
        continue;
      }

      const farmerRef = db.collection('farmers').doc(phoneNumber);
      const farmerDoc = await farmerRef.get();

      if (!farmerDoc.exists) {
        results.push({ bagId, status: 'failed', message: 'Farmer not registered' });
        continue;
      }

      const timestamp = admin.firestore.Timestamp.now();
      const geopoint = location
        ? new admin.firestore.GeoPoint(location.latitude, location.longitude)
        : null;

      await bagRef.update({
        condition: 'redeemed',
        farmerPhone: phoneNumber,
        redemptionTimestamp: timestamp,
        redemptionLocation: geopoint,
      });

      await db.collection('redemptionLog').add({
        bagId,
        action: 'redeemed',
        timestamp,
        location: geopoint,
        performedBy: phoneNumber,
        ward: ward || null,
        previousHash: 'offline-sync-batch',
        currentHash: `offline-${timestamp.toMillis()}-${bagId}`,
        syncedBy: context.auth.uid,
        syncedAt: timestamp,
      });

      results.push({ bagId, status: 'success', message: 'Redeemed successfully' });
    } catch (error: any) {
      results.push({
        bagId: redemption.bagId || 'unknown',
        status: 'failed',
        message: error.message || 'Unknown error',
      });
    }
  }

  const successCount = results.filter(r => r.status === 'success').length;
  const failCount = results.filter(r => r.status === 'failed').length;

  functions.logger.info(`Offline sync completed: ${successCount} success, ${failCount} failed`, {
    syncedBy: context.auth.uid,
    total: redemptions.length,
  });

  return {
    success: true,
    summary: {
      total: redemptions.length,
      succeeded: successCount,
      failed: failCount,
    },
    results,
  };
});
