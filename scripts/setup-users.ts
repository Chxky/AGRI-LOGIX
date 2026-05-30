import * as admin from 'firebase-admin';
import *  from 'fs';

const serviceAccount = JSON.parse(
  readFileSync('agri-logix-firebase-adminsdk.json', 'utf-8')
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const users = [
  { email: 'admin@demo.com', password: 'Demo@123', role: 'admin' },
  { email: 'seedhouse@demo.com', password: 'Seed@123', role: 'seed_house' },
  { email: 'gov@demo.com', password: 'Gov@123', role: 'government' },
  { email: 'extension@demo.com', password: 'Ext@123', role: 'extension' },
  { email: 'farmer@demo.com', password: 'Farmer@123', role: 'farmer' },
];

async function setup() {
  for (const u of users) {
    try {
      const existing = await admin.auth().getUserByEmail(u.email);
      await admin.auth().updateUser(existing.uid, { password: u.password });
      await admin.auth().setCustomUserClaims(existing.uid, { role: u.role });
      console.log(`Updated: ${u.email} / ${u.password}`);
    } catch (err: any) {
      if (err.code === 'auth/user-not-found') {
        const created = await admin.auth().createUser({
          email: u.email,
          password: u.password,
        });
        await admin.auth().setCustomUserClaims(created.uid, { role: u.role });
        console.log(`Created: ${u.email} / ${u.password}`);
      } else {
        console.error(`Failed: ${u.email}`, err.message);
      }
    }
  }
  console.log('Done.');
  process.exit(0);
}

setup();
