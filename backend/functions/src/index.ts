import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

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

// ===== UTILITIES EXPOSED AS CALLABLE FUNCTIONS =====
export const getDashboardStats = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }

  const [bagsSnapshot, farmersSnapshot, distributionsSnapshot] = await Promise.all([
    db.collection('seedBags').get(),
    db.collection('farmers').get(),
    db.collection('distributions').get(),
  ]);

  const totalBags = bagsSnapshot.size;
  const redeemed = bagsSnapshot.docs.filter(d => d.data().condition === 'redeemed').length;
  const dispatched = bagsSnapshot.docs.filter(d => d.data().condition === 'dispatched').length;
  const inStock = bagsSnapshot.docs.filter(d => d.data().condition === 'in_stock').length;
  const flagged = bagsSnapshot.docs.filter(d => d.data().condition === 'flagged').length;

  return {
    totalBags,
    redeemed,
    dispatched,
    inStock,
    flagged,
    totalFarmers: farmersSnapshot.size,
    activeDistributions: distributionsSnapshot.docs.filter(d => d.data().status !== 'delivered').length,
    redemptionRate: totalBags > 0 ? Math.round((redeemed / totalBags) * 100) : 0,
  };
});

export const getDistrictsSummary = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }

  const bagsSnapshot = await db.collection('seedBags').get();
  const districtMap = new Map<string, { dispatched: number; redeemed: number; farmers: Set<string> }>();

  bagsSnapshot.docs.forEach(doc => {
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
