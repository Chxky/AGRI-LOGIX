import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import { checkRateLimit } from './utils/rateLimiter';

admin.initializeApp();

const db = admin.firestore();

// Export all function modules
export { generateSeedBagQR } from './seedBagGeneration';
export { redeemBag } from './redemption';
export { getBagDetails } from './bagDetails';
export { getReconciliationReport } from './reconciliation';
export { flagCounterfeitBag } from './flagCounterfeit';
export { ussdWebhook } from './ussdHandler';
export { registerFarmer } from './farmerRegistration';
export { syncOfflineRedemptions } from './offlineSync';

// ===== TRIGGERS =====
export { onBagCreated } from './triggers/onBagCreated';
export { onBagRedeemed } from './triggers/onBagRedeemed';
export { onDistributionCreated } from './triggers/onDistributionCreated';

// ===== BACKUP =====
export { dailyFirestoreBackup, manualBackup } from './scheduledBackup';

// ===== INVENTORY ALERTS =====
export { getInventoryAlerts } from './inventoryAlerts';

// ===== AUDIT CHAIN =====
export { verifyAuditChain } from './auditChain';

// ===== EXTENSION OFFICER FUNCTIONS =====
export { confirmRedemption } from './confirmRedemption';
export { getWardBags } from './getWardBags';

// ===== UTILITIES EXPOSED AS CALLABLE FUNCTIONS =====
export const getDashboardStats = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }
  await checkRateLimit(context.auth.uid);

  const [totalBags, redeemed, dispatched, inStock, flagged, farmersCount] = await Promise.all([
    db.collection('seedBags').count().get(),
    db.collection('seedBags').where('condition', '==', 'redeemed').count().get(),
    db.collection('seedBags').where('condition', '==', 'dispatched').count().get(),
    db.collection('seedBags').where('condition', '==', 'in_stock').count().get(),
    db.collection('seedBags').where('condition', '==', 'flagged').count().get(),
    db.collection('farmers').count().get(),
  ]);

  const total = totalBags.data().count;
  const redeemedCount = redeemed.data().count;
  const dispatchedSnapshot = await db.collection('distributions').where('status', '!=', 'delivered').count().get();

  return {
    totalBags: total,
    redeemed: redeemedCount,
    dispatched: dispatched.data().count,
    inStock: inStock.data().count,
    flagged: flagged.data().count,
    totalFarmers: farmersCount.data().count,
    activeDistributions: dispatchedSnapshot.data().count,
    redemptionRate: total > 0 ? Math.round((redeemedCount / total) * 100) : 0,
  };
});

export const getDistrictsSummary = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }
  await checkRateLimit(context.auth.uid);

  const districtMap = new Map<string, { dispatched: number; redeemed: number; farmers: Set<string> }>();

  let lastDoc: FirebaseFirestore.DocumentSnapshot | null = null;
  const PAGE_SIZE = 500;

  while (true) {
    let query: FirebaseFirestore.Query = db.collection('seedBags')
      .select('dispatchedTo', 'condition', 'farmerPhone')
      .limit(PAGE_SIZE);

    if (lastDoc) {
      query = query.startAfter(lastDoc);
    }

    const snapshot = await query.get();

    if (snapshot.empty) {
      break;
    }

    snapshot.docs.forEach(doc => {
      const bag = doc.data();
      const district = bag.dispatchedTo || 'unassigned';
      if (!districtMap.has(district)) {
        districtMap.set(district, { dispatched: 0, redeemed: 0, farmers: new Set() });
      }
      const entry = districtMap.get(district)!;
      if (bag.condition === 'dispatched' || bag.condition === 'redeemed') {
        entry.dispatched++;
      }
      if (bag.condition === 'redeemed') {
        entry.redeemed++;
        if (bag.farmerPhone) {
          entry.farmers.add(bag.farmerPhone);
        }
      }
    });

    if (snapshot.docs.length < PAGE_SIZE) {
      break;
    }
    lastDoc = snapshot.docs[snapshot.docs.length - 1];
  }

  const districts = Array.from(districtMap.entries()).map(([name, stats]) => ({
    name,
    dispatched: stats.dispatched,
    redeemed: stats.redeemed,
    farmers: stats.farmers.size,
    gap: stats.dispatched - stats.redeemed,
  }));

  return { districts };
});

export const getBagJourney = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }

  const { bagId } = data;
  if (!bagId) {
    throw new functions.https.HttpsError('invalid-argument', 'bagId is required');
  }

  const bagDoc = await db.collection('seedBags').doc(bagId).get();
  if (!bagDoc.exists) {
    throw new functions.https.HttpsError('not-found', 'Bag not found');
  }

  const logsSnapshot = await db.collection('redemptionLog')
    .where('bagId', '==', bagId)
    .orderBy('timestamp', 'asc')
    .get();

  const chain = logsSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    timestamp: doc.data().timestamp?.toDate().toISOString(),
  }));

  return {
    bag: { id: bagDoc.id, ...bagDoc.data() },
    chainOfCustody: chain,
  };
});
