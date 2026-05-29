import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();

const BACKUP_BUCKET = functions.config().backup?.bucket || '';

export const dailyFirestoreBackup = functions.pubsub
  .schedule('every 24 hours')
  .timeZone('Africa/Harare')
  .onRun(async (context) => {
    if (!BACKUP_BUCKET) {
      functions.logger.warn('Backup bucket not configured. Set firebase functions:config:set backup.bucket="gs://your-bucket"');
      return;
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const exportUri = `${BACKUP_BUCKET}/backups/${timestamp}`;

    try {
      const projectId = process.env.GCLOUD_PROJECT || '';
      const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default):exportDocuments`;

      const client = new (require('google-auth-library').GoogleAuth)({
        scopes: ['https://www.googleapis.com/auth/datastore'],
      });

      const token = await client.getAccessToken();
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          outputUriPrefix: exportUri,
          collectionIds: [],
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(`Export API error: ${result.error?.message || JSON.stringify(result)}`);
      }

      functions.logger.info('Firestore backup started', {
        exportUri,
        operationName: result.name,
        projectId,
      });

      await db.collection('backupLog').add({
        type: 'firestore_export',
        exportUri,
        operationName: result.name || '',
        status: 'started',
        timestamp: admin.firestore.Timestamp.now(),
        triggeredBy: 'scheduler',
      });
    } catch (error: any) {
      functions.logger.error('Firestore backup failed', {
        error: error.message,
        exportUri,
      });

      await db.collection('backupLog').add({
        type: 'firestore_export',
        exportUri,
        status: 'failed',
        error: error.message,
        timestamp: admin.firestore.Timestamp.now(),
        triggeredBy: 'scheduler',
      });
    }
  });

export const manualBackup = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }

  const adminSnapshot = await db.collection('users').doc(context.auth.uid).get();
  const userData = adminSnapshot.data();
  if (!userData || userData.role !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Only admins can trigger backups');
  }

  if (!BACKUP_BUCKET) {
    throw new functions.https.HttpsError('failed-precondition', 'Backup bucket not configured');
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const exportUri = `${BACKUP_BUCKET}/backups/manual-${timestamp}`;

  try {
    const projectId = process.env.GCLOUD_PROJECT || '';
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default):exportDocuments`;

    const client = new (require('google-auth-library').GoogleAuth)({
      scopes: ['https://www.googleapis.com/auth/datastore'],
    });

    const token = await client.getAccessToken();
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        outputUriPrefix: exportUri,
        collectionIds: [],
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(`Export API error: ${result.error?.message || JSON.stringify(result)}`);
    }

    await db.collection('backupLog').add({
      type: 'firestore_export',
      exportUri,
      operationName: result.name || '',
      status: 'started',
      timestamp: admin.firestore.Timestamp.now(),
      triggeredBy: context.auth.uid,
    });

    return {
      success: true,
      message: 'Backup started',
      exportUri,
      operationName: result.name,
    };
  } catch (error: any) {
    functions.logger.error('Manual backup failed', { error: error.message });
    throw new functions.https.HttpsError('internal', `Backup failed: ${error.message}`);
  }
});
