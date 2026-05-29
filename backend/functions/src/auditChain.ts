import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { checkRateLimit } from './utils/rateLimiter';
import { verifyChainIntegrity, getGenesisHash } from './utils/hashchain';

const db = admin.firestore();

export const verifyAuditChain = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }
  await checkRateLimit(context.auth.uid);

  const { startAfter, limit = 500 } = data;
  const PAGE_SIZE = Math.min(limit, 1000);

  let query: FirebaseFirestore.Query = db.collection('redemptionLog')
    .orderBy('timestamp', 'asc')
    .limit(PAGE_SIZE);

  if (startAfter) {
    query = query.startAfter(startAfter);
  }

  const snapshot = await query.get();

  if (snapshot.empty) {
    return {
      verified: true,
      totalBlocks: 0,
      checkedBlocks: 0,
      firstBlock: null,
      lastBlock: null,
      hasMore: false,
      genesisHash: getGenesisHash(),
    };
  }

  const logs = snapshot.docs.map(doc => {
    const d = doc.data();
    return {
      id: doc.id,
      bagId: d.bagId || null,
      action: d.action || 'unknown',
      timestamp: d.timestamp?.toDate?.()?.toISOString?.() || d.timestamp || null,
      performedBy: d.performedBy || null,
      destinationDistrict: d.destinationDistrict || null,
      previousHash: d.previousHash || '',
      currentHash: d.currentHash || '',
      data: JSON.stringify({
        bagId: d.bagId,
        action: d.action,
        timestamp: d.timestamp?.toMillis?.(),
        performedBy: d.performedBy,
        ward: d.ward,
        destinationDistrict: d.destinationDistrict,
        bagIds: d.bagIds,
      }),
    };
  });

  const chainInput = logs.map(l => ({
    previousHash: l.previousHash,
    currentHash: l.currentHash,
    data: l.data,
  }));

  const verified = verifyChainIntegrity(chainInput);

  const failedBlocks: Array<{ id: string; bagId: string; action: string; expectedHash: string; actualHash: string }> = [];

  if (!verified) {
    for (let i = 0; i < chainInput.length; i++) {
      const log = chainInput[i];

      if (i > 0 && log.previousHash !== chainInput[i - 1].currentHash) {
        failedBlocks.push({
          id: logs[i].id,
          bagId: logs[i].bagId || '',
          action: logs[i].action,
          expectedHash: chainInput[i - 1].currentHash,
          actualHash: log.previousHash,
        });
      }
    }
  }

  const lastDoc = snapshot.docs[snapshot.docs.length - 1];
  const hasMore = snapshot.docs.length === PAGE_SIZE;

  const firstBlock = logs[0] ? { id: logs[0].id, action: logs[0].action, currentHash: logs[0].currentHash } : null;
  const lastBlock = logs[logs.length - 1] ? { id: logs[logs.length - 1].id, action: logs[logs.length - 1].action, currentHash: logs[logs.length - 1].currentHash } : null;

  return {
    verified,
    totalBlocks: 0,
    checkedBlocks: logs.length,
    firstBlock,
    lastBlock,
    hasMore,
    genesisHash: getGenesisHash(),
    lastEvaluated: lastDoc.id,
    failedBlocks: failedBlocks.length > 0 ? failedBlocks : undefined,
    blocks: logs,
  };
});
