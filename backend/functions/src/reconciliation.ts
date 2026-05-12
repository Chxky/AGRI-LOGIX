import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();

export const getReconciliationReport = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }

  const { district } = data;

  let bagsQuery: FirebaseFirestore.Query = db.collection('seedBags');
  let distributionsQuery: FirebaseFirestore.Query = db.collection('distributions');

  if (district && district !== 'all') {
    bagsQuery = bagsQuery.where('dispatchedTo', '==', district);
    distributionsQuery = distributionsQuery.where('destinationDistrict', '==', district);
  }

  const [bagsSnapshot, distributionsSnapshot, seedHousesSnapshot] = await Promise.all([
    bagsQuery.get(),
    distributionsQuery.get(),
    db.collection('seedHouses').get(),
  ]);

  const seedHouses: Record<string, string> = {};
  seedHousesSnapshot.docs.forEach(doc => {
    seedHouses[doc.id] = doc.data().name;
  });

  const totalDispatched = bagsSnapshot.docs.filter(d =>
    d.data().condition === 'dispatched' || d.data().condition === 'redeemed'
  ).length;

  const totalRedeemed = bagsSnapshot.docs.filter(d =>
    d.data().condition === 'redeemed'
  ).length;

  const totalFlagged = bagsSnapshot.docs.filter(d =>
    d.data().condition === 'flagged'
  ).length;

  const farmerPhones = new Set<string>();
  bagsSnapshot.docs.forEach(d => {
    if (d.data().farmerPhone) {
      farmerPhones.add(d.data().farmerPhone);
    }
  });

  const varietyBreakdown: Record<string, { dispatched: number; redeemed: number }> = {};
  bagsSnapshot.docs.forEach(d => {
    const bag = d.data();
    const variety = bag.variety || 'unknown';
    if (!varietyBreakdown[variety]) {
      varietyBreakdown[variety] = { dispatched: 0, redeemed: 0 };
    }
    if (bag.condition === 'dispatched' || bag.condition === 'redeemed') {
      varietyBreakdown[variety].dispatched++;
    }
    if (bag.condition === 'redeemed') {
      varietyBreakdown[variety].redeemed++;
    }
  });

  const houseBreakdown: Record<string, { dispatched: number; redeemed: number }> = {};
  bagsSnapshot.docs.forEach(d => {
    const bag = d.data();
    const houseId = bag.seedHouseId || 'unknown';
    if (!houseBreakdown[houseId]) {
      houseBreakdown[houseId] = { dispatched: 0, redeemed: 0 };
    }
    if (bag.condition === 'dispatched' || bag.condition === 'redeemed') {
      houseBreakdown[houseId].dispatched++;
    }
    if (bag.condition === 'redeemed') {
      houseBreakdown[houseId].redeemed++;
    }
  });

  const unreturnedBags = bagsSnapshot.docs
    .filter(d => d.data().condition === 'dispatched')
    .map(d => ({
      bagId: d.id,
      variety: d.data().variety,
      batchNumber: d.data().batchNumber,
      dispatchedTo: d.data().dispatchedTo,
      seedHouse: seedHouses[d.data().seedHouseId] || 'Unknown',
    }));

  return {
    summary: {
      totalBags: bagsSnapshot.size,
      totalDispatched,
      totalRedeemed,
      totalFlagged,
      uniqueFarmers: farmerPhones.size,
      outstandingForPayment: totalRedeemed,
      unreturnedBags: unreturnedBags.length,
      redemptionRate: totalDispatched > 0 ? Math.round((totalRedeemed / totalDispatched) * 100) : 0,
    },
    varietyBreakdown: Object.entries(varietyBreakdown).map(([variety, stats]) => ({
      variety,
      ...stats,
    })),
    houseBreakdown: Object.entries(houseBreakdown).map(([houseId, stats]) => ({
      seedHouse: seedHouses[houseId] || 'Unknown',
      houseId,
      ...stats,
    })),
    unreturnedBags,
    distributions: distributionsSnapshot.docs.map(d => ({
      id: d.id,
      ...d.data(),
      dispatchedDate: d.data().dispatchedDate?.toDate().toISOString(),
    })),
    generatedAt: new Date().toISOString(),
    district: district || 'all',
  };
});
