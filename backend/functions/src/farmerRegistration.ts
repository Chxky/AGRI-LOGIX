import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as crypto from 'crypto';

const db = admin.firestore();

interface RegisterFarmerInput {
  phoneNumber: string;
  name: string;
  ward: string;
  pin: string;
}

export const registerFarmer = functions.https.onCall(async (data: RegisterFarmerInput, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }

  const { phoneNumber, name, ward, pin } = data;

  if (!phoneNumber || !name || !ward || !pin) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
  }

  const phoneRegex = /^\+?263\d{9}$/;
  if (!phoneRegex.test(phoneNumber)) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid Zimbabwe phone number');
  }

  if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
    throw new functions.https.HttpsError('invalid-argument', 'PIN must be exactly 4 digits');
  }

  const farmerRef = db.collection('farmers').doc(phoneNumber);
  const existingDoc = await farmerRef.get();

  if (existingDoc.exists) {
    throw new functions.https.HttpsError('already-exists', 'This phone number is already registered');
  }

  const pinHash = crypto.createHash('sha256').update(pin).digest('hex');

  await farmerRef.set({
    phoneNumber,
    name,
    ward,
    pinHash,
    registeredDate: admin.firestore.Timestamp.now(),
    registrationSource: 'app',
    registeredBy: context.auth.uid,
  });

  functions.logger.info(`Farmer registered via app: ${phoneNumber}`, {
    name,
    ward,
    registeredBy: context.auth.uid,
  });

  return {
    success: true,
    message: `Farmer ${name} registered successfully. Ward: ${ward}`,
    phoneNumber,
  };
});
