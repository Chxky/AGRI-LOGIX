# Agri-Logix SeedTracker — Deployment Guide

## Overview
This guide covers deploying the Agri-Logix SeedTracker MVP for a Zimbabwean agricultural pilot. The system consists of:
- **Firebase Backend** (Cloud Functions, Firestore, Auth, Hosting)
- **Seed House Dashboard** (React) — QR generation & dispatch
- **Government Dashboard** (React) — reconciliation & payment reports
- **Farmer Flutter App** — QR scanning, offline mode
- **USSD Interface** — Africa's Talking integration

---

## 1. Prerequisites

### Tools
- Node.js 18+
- Flutter SDK 3.0+
- Firebase CLI (`npm install -g firebase-tools`)
- Git

### Accounts
- Firebase project (Blaze plan required for Cloud Functions)
- Africa's Talking account (for USSD)

---

## 2. Firebase Setup

```bash
# Login to Firebase
firebase login

# Initialize project
firebase init
# Select: Firestore, Functions, Hosting, Auth
# Use existing project: your-project-id

# Set hosting targets
firebase target:apply hosting seedhouse-dashboard seedhouse-dashboard
firebase target:apply hosting government-dashboard government-dashboard
```

### Firestore
1. Deploy indexes: `firebase deploy --only firestore:indexes`
2. Deploy rules: `firebase deploy --only firestore:rules`

### Authentication
Enable Email/Password sign-in method in Firebase Console.

### Service Account Roles
Add the following custom claims for user roles:
- `seed_house` — Seed house staff (can generate QR, dispatch bags)
- `government` — Government officials (can view reports, flag bags)
- `admin` — System administrators

Set claims via Firebase Admin SDK or Firebase Console.

---

## 3. Backend Deployment

```bash
cd backend/functions

# Install dependencies
npm install

# Set environment config
firebase functions:config:set africastalking.username="sandbox"
firebase functions:config:set africastalking.api_key="your-api-key"

# Build and deploy
npm run build
firebase deploy --only functions
```

### Environment Variables
Create `.env` files in each dashboard directory (see `.env.example`).

---

## 4. Seed House Dashboard

```bash
cd seedhouse-dashboard

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your Firebase project credentials

# Run locally
npm start

# Build for production
npm run build

# Deploy to Firebase
firebase deploy --only hosting:seedhouse-dashboard
```

### Seed House Initial Setup
1. Add seed houses to Firestore via Firebase Console:
   ```
   /seedHouses/{houseId}
   {
     "name": "Seed Co Zimbabwe",
     "certificationLicense": "SCL-2026-001"
   }
   ```
2. Add certification IDs to whitelist:
   ```
   /certificationWhitelist/{certId}
   {
     "valid": true,
     "issuedTo": "Seed Co",
     "issueDate": Timestamp
   }
   ```
3. Create user accounts with `seed_house` custom claim.

---

## 5. Government Dashboard

```bash
cd government-dashboard

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your Firebase project credentials

# Run locally
npm start

# Build for production
npm run build

# Deploy to Firebase
firebase deploy --only hosting:government-dashboard
```

### Government User Setup
1. Create user accounts with `government` custom claim.
2. Grant read access to seedBags, distributions, redemptionLog collections.

---

## 6. Flutter Farmer App

```bash
cd flutter-app

# Configure Firebase
flutterfire configure
# This will auto-generate firebase_options.dart

# Install dependencies
flutter pub get

# Run on device
flutter run

# Build APK
flutter build apk --release

# Build iOS (requires macOS)
flutter build ios --release
```

### Flutter App Features
- QR code scanning via mobile_scanner package
- Offline caching with SQLite (sqflite)
- GPS capture with geolocator
- Auto-sync when connectivity restores

---

## 7. USSD Setup (Africa's Talking)

1. Log into [Africa's Talking Dashboard](https://account.africastalking.com)
2. Go to USSD > Create Channel
3. Short code: *123* (or request a short code from AT)
4. Callback URL: `https://us-central1-{project}.cloudfunctions.net/ussdWebhook`
5. Request format: JSON
6. Deploy Cloud Function: `firebase deploy --only functions:ussdWebhook`

### USSD Testing
Use Africa's Talking simulator in their dashboard to test flows.

---

## 8. Initial Data Seeding

Run this in Firebase Console or via a script:

```javascript
// Seed certification whitelist
const whitelist = [
  { id: 'SSI-CERT-2026-001', seedHouse: 'Seed Co', variety: 'SC513', validUntil: '2027-01-01' },
  { id: 'SSI-CERT-2026-002', seedHouse: 'Pioneer', variety: 'SC529', validUntil: '2027-01-01' },
];

// Add to firestore collection: /certificationWhitelist/{id}

// Seed a test seed house
// Add to firestore collection: /seedHouses/seedco_zim
// {
//   "name": "Seed Co Zimbabwe",
//   "certificationLicense": "SCL-2026-001"
// }
```

---

## 9. Verification Checklist

- [ ] Firebase Auth login works for seed_house users
- [ ] QR code generation creates seedBags documents
- [ ] Batch dispatch updates bag conditions to "dispatched"
- [ ] USSD webhook responds correctly
- [ ] Farmer registration via USSD creates farmer documents
- [ ] Bag redemption via USSD updates bag to "redeemed"
- [ ] Flutter app scans QR and displays bag details
- [ ] Offline scans sync when connectivity restored
- [ ] Government dashboard shows correct stats
- [ ] Reconciliation report generates PDF
- [ ] Payment certificate exports correctly
- [ ] Flag counterfeit updates bag condition
- [ ] Chain of custody timeline displays for any bag ID

---

## 10. Production Considerations

- **Rate Limiting**: Add rate limiting to Cloud Functions to prevent abuse
- **Backup**: Enable Firestore daily backups
- **Monitoring**: Set up Firebase Crashlytics and Performance Monitoring
- **Scaling**: Firestore auto-scales, but monitor read/write quotas
- **Security**: Review Firestore rules before production
- **Compliance**: Ensure data handling complies with Zimbabwe's data protection laws
- **USSD Costs**: Africa's Talking charges per session; budget accordingly

---

## 11. Troubleshooting

| Issue | Solution |
|-------|----------|
| Cloud Functions timeout | Increase timeout in Firebase Console (max 540s) |
| Firestore permission denied | Check security rules in firestore.rules |
| USSD not responding | Verify callback URL is publicly accessible |
| QR code not scanning | Check qrCodeData format: agrilogix://verify/{bagId} |
| PDF export blank | Browser pop-up blocker may be active |
| Flutter build fails | Run `flutter clean` then `flutter pub get` |
