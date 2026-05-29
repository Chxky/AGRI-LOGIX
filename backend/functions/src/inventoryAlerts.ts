import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { checkRateLimit } from './utils/rateLimiter';

const db = admin.firestore();
const PAGE_SIZE = 500;

export const getInventoryAlerts = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }
  await checkRateLimit(context.auth.uid);

  const alerts: Array<{
    type: string;
    severity: 'low' | 'medium' | 'high';
    title: string;
    message: string;
    timestamp: string;
  }> = [];

  const now = admin.firestore.Timestamp.now();
  const thirtyDaysFromNow = admin.firestore.Timestamp.fromMillis(
    Date.now() + 30 * 24 * 60 * 60 * 1000
  );
  const ninetyDaysAgo = admin.firestore.Timestamp.fromMillis(
    Date.now() - 90 * 24 * 60 * 60 * 1000
  );

  // 1. Certifications expiring within 30 days
  const certSnapshot = await db.collection('certificationWhitelist')
    .where('validUntil', '<=', thirtyDaysFromNow)
    .where('validUntil', '>', now)
    .get();

  certSnapshot.forEach(doc => {
    const cert = doc.data();
    const expiryDate = cert.validUntil?.toDate?.()?.toLocaleDateString() || 'unknown';
    alerts.push({
      type: 'certification_expiring',
      severity: 'high',
      title: 'Certification Expiring Soon',
      message: `Certification ${doc.id} (${cert.cropType || cert.variety || 'N/A'}) expires on ${expiryDate}.`,
      timestamp: new Date().toISOString(),
    });
  });

  // 2. Districts with low redemption rate (< 30%)
  const districtMap = new Map<string, { dispatched: number; redeemed: number }>();

  let lastDoc: FirebaseFirestore.DocumentSnapshot | null = null;

  while (true) {
    let query: FirebaseFirestore.Query = db.collection('seedBags')
      .select('dispatchedTo', 'condition')
      .limit(PAGE_SIZE);

    if (lastDoc) {
      query = query.startAfter(lastDoc);
    }

    const snapshot = await query.get();
    if (snapshot.empty) break;

    snapshot.docs.forEach(doc => {
      const bag = doc.data();
      const district = bag.dispatchedTo || 'unassigned';
      if (!districtMap.has(district)) {
        districtMap.set(district, { dispatched: 0, redeemed: 0 });
      }
      const entry = districtMap.get(district)!;
      if (bag.condition === 'dispatched' || bag.condition === 'redeemed') {
        entry.dispatched++;
      }
      if (bag.condition === 'redeemed') {
        entry.redeemed++;
      }
    });

    if (snapshot.docs.length < PAGE_SIZE) break;
    lastDoc = snapshot.docs[snapshot.docs.length - 1];
  }

  districtMap.forEach((stats, district) => {
    if (stats.dispatched > 0) {
      const rate = Math.round((stats.redeemed / stats.dispatched) * 100);
      if (rate < 30) {
        alerts.push({
          type: 'low_redemption',
          severity: 'high',
          title: `Low Redemption in ${district}`,
          message: `${district} has only ${rate}% redemption rate (${stats.redeemed}/${stats.dispatched} bags).`,
          timestamp: new Date().toISOString(),
        });
      }
    }
  });

  // 3. Stale stock — in_stock bags older than 90 days
  const staleSnapshot = await db.collection('seedBags')
    .where('condition', '==', 'in_stock')
    .where('createdAt', '<', ninetyDaysAgo)
    .count()
    .get();

  const staleCount = staleSnapshot.data().count;
  if (staleCount > 0) {
    alerts.push({
      type: 'stale_stock',
      severity: 'medium',
      title: 'Stale Stock Detected',
      message: `${staleCount} bag(s) have been in stock for over 90 days without movement.`,
      timestamp: new Date().toISOString(),
    });
  }

  // 4. Active distributions not yet delivered
  const activeDistributionSnapshot = await db.collection('distributions')
    .where('status', '!=', 'delivered')
    .count()
    .get();

  const activeCount = activeDistributionSnapshot.data().count;
  if (activeCount > 0) {
    alerts.push({
      type: 'pending_distributions',
      severity: 'low',
      title: 'Pending Distributions',
      message: `${activeCount} distribution(s) are still in progress and not yet marked as delivered.`,
      timestamp: new Date().toISOString(),
    });
  }

  return { alerts };
});
