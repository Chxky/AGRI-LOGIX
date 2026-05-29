import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();

const PAGE_SIZE = 500;

export const getReconciliationReport = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }

  const { district, dateFrom, dateTo } = data;

  async function getBagsQuery(): Promise<FirebaseFirestore.Query> {
    let q: FirebaseFirestore.Query = db.collection('seedBags');
    if (district && district !== 'all') {
      q = q.where('dispatchedTo', '==', district);
    }
    if (dateFrom) {
      const from = new Date(dateFrom);
      q = q.where('createdAt', '>=', admin.firestore.Timestamp.fromDate(from));
    }
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      q = q.where('createdAt', '<=', admin.firestore.Timestamp.fromDate(to));
    }
    return q;
  }

  // Use count queries for top-level stats
  const baseQuery = await getBagsQuery();

  const [totalCount, redeemedCount, dispatchedCount, flaggedCount, inStockCount, farmersCount, distributionCount] = await Promise.all([
    baseQuery.count().get(),
    baseQuery.where('condition', '==', 'redeemed').count().get(),
    baseQuery.where('condition', '==', 'dispatched').count().get(),
    baseQuery.where('condition', '==', 'flagged').count().get(),
    baseQuery.where('condition', '==', 'in_stock').count().get(),
    db.collection('farmers').count().get(),
    db.collection('distributions').count().get(),
  ]);

  const totalBags = totalCount.data().count;
  const totalRedeemed = redeemedCount.data().count;
  const totalDispatched = dispatchedCount.data().count;
  const totalFlagged = flaggedCount.data().count;

  // Iterate with pagination for variety and seed house breakdowns
  const varietyBreakdown: Record<string, { dispatched: number; redeemed: number }> = {};
  const houseBreakdown: Record<string, { dispatched: number; redeemed: number }> = {};

  let lastDoc: FirebaseFirestore.DocumentSnapshot | null = null;
  let hasMore = true;

  while (hasMore) {
    let pageQuery: FirebaseFirestore.Query = baseQuery
      .select('variety', 'condition', 'seedHouseId')
      .limit(PAGE_SIZE);

    if (lastDoc) {
      pageQuery = pageQuery.startAfter(lastDoc);
    }

    const snapshot = await pageQuery.get();

    if (snapshot.empty) {
      break;
    }

    snapshot.docs.forEach(doc => {
      const bag = doc.data();
      const isDispatched = bag.condition === 'dispatched' || bag.condition === 'redeemed';
      const isRedeemed = bag.condition === 'redeemed';

      if (isDispatched) {
        const variety = bag.variety || 'unknown';
        if (!varietyBreakdown[variety]) {
          varietyBreakdown[variety] = { dispatched: 0, redeemed: 0 };
        }
        varietyBreakdown[variety].dispatched++;

        const houseId = bag.seedHouseId || 'unknown';
        if (!houseBreakdown[houseId]) {
          houseBreakdown[houseId] = { dispatched: 0, redeemed: 0 };
        }
        houseBreakdown[houseId].dispatched++;
      }

      if (isRedeemed) {
        const variety = bag.variety || 'unknown';
        varietyBreakdown[variety].redeemed++;

        const houseId = bag.seedHouseId || 'unknown';
        houseBreakdown[houseId].redeemed++;
      }
    });

    lastDoc = snapshot.docs[snapshot.docs.length - 1];
    hasMore = snapshot.docs.length === PAGE_SIZE;
  }

  // Get seed house names and unreturned bags (paginated, max 1000)
  const [seedHousesSnapshot, unreturnedSnapshot] = await Promise.all([
    db.collection('seedHouses').get(),
    baseQuery
      .where('condition', '==', 'dispatched')
      .select('variety', 'batchNumber', 'dispatchedTo', 'seedHouseId')
      .limit(1000)
      .get(),
  ]);

  const seedHouses: Record<string, string> = {};
  seedHousesSnapshot.docs.forEach(doc => {
    seedHouses[doc.id] = doc.data().name;
  });

  const unreturnedBags = unreturnedSnapshot.docs.map(doc => {
    const bag = doc.data();
    return {
      bagId: doc.id,
      variety: bag.variety,
      batchNumber: bag.batchNumber,
      dispatchedTo: bag.dispatchedTo,
      seedHouse: seedHouses[bag.seedHouseId] || 'Unknown',
    };
  });

  const outstandingForPayment = totalRedeemed;

  return {
    summary: {
      totalBags,
      totalDispatched,
      totalRedeemed,
      totalFlagged,
      inStock: inStockCount.data().count,
      uniqueFarmers: farmersCount.data().count,
      totalDistributions: distributionCount.data().count,
      outstandingForPayment,
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
    generatedAt: new Date().toISOString(),
    district: district || 'all',
  };
});
