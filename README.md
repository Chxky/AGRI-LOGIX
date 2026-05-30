# Agri-Logix SeedTracker

Blockchain-verified seed supply chain tracking platform for Zimbabwe's Pfumvudza/Intwasa input scheme.

**Live dashboards:**
- **Seed House**: https://agri-logix-seedhouse.web.app
- **Government**: https://agri-logix-government.web.app
- **Extension Officer**: https://agri-logix-ext-officer.web.app
- **Farmer**: https://agri-logix-farmer.web.app

---

## Architecture

| Component | Tech | Description |
|-----------|------|-------------|
| `seedhouse-dashboard/` | React + Antd + Vite | QR generation, dispatch management, batch tracking |
| `government-dashboard/` | React + Antd + Vite | National oversight, reconciliation, payment verification |
| `extension-officer-dashboard/` | React + Antd + Vite | Farmer registration, bag verification, redemption confirmation |
| `farmer-dashboard/` | React + Antd + Vite | Farmer self-service — track bags, view profile, check redemption status |
| `backend/functions` | Firebase Functions (Node.js) | Cloud functions, Firestore REST API, hash-chain audit trail |
| `flutter-app/` | Flutter | Mobile app for field redemption with GPS verification |
| `ussd/` | Node.js | USSD simulator for testing *123# flows locally |
| `firebase.json` | Firebase config | Multi-site hosting, Firestore rules, emulator config |

---

## Quick Start (Local Development)

### Prerequisites
- Node.js 20+
- Firebase CLI (`npm install -g firebase-tools`)
- Java 11+ (for Firestore emulator)

### 1. Clone and install dependencies

```bash
# Government dashboard
cd government-dashboard && npm install

# Seed house dashboard
cd seedhouse-dashboard && npm install

# Extension officer dashboard
cd extension-officer-dashboard && npm install

# Farmer dashboard
cd farmer-dashboard
npm install

# Backend cloud functions
cd backend/functions
npm install

# USSD simulator
cd ussd && npm install
```

### 2. Set up environment variables

Each dashboard needs a `.env` file (copy from `.env.example`):

```bash
cp seedhouse-dashboard/.env.example seedhouse-dashboard/.env
cp government-dashboard/.env.example government-dashboard/.env
cp extension-officer-dashboard/.env.example extension-officer-dashboard/.env
cp farmer-dashboard/.env.example farmer-dashboard/.env
```

For Africa's Talking SMS (production only):
```bash
cd backend/functions
firebase functions:config:set africastalking.username="YOUR_AT_USERNAME" africastalking.api_key="YOUR_AT_API_KEY"
```

### 3. Run locally with Firebase emulators

```bash
# Terminal 1: Start all emulators
firebase emulators:start

# Terminal 2-4: Start each dashboard
cd government-dashboard && npm run dev        # http://localhost:5173
cd seedhouse-dashboard && npm run dev         # http://localhost:5174
cd extension-officer-dashboard && npm run dev # http://localhost:5175
cd farmer-dashboard && npm run dev            # http://localhost:5176
```

### 4. Run backend functions standalone

```bash
cd backend/functions
npm run serve  # http://localhost:5001
```

### 5. Run tests

```bash
cd backend/functions
npm test
```

---

## Production Deployment Guide (Zimbabwe)

This section covers everything needed to deploy and operate Agri-Logix in production for Zimbabwe's national seed subsidy program.

### Step 1: Firebase Account Setup

1. Create a Firebase project at https://console.firebase.google.com
2. **Upgrade to Blaze (pay-as-you-go) plan** — required for cloud functions.
   - Go to Project > Usage & Billing > Blaze plan
   - Cloud Functions, Cloud Build, and Artifact Registry APIs will auto-enable
3. Register your Firebase app for the web SDK (get `firebaseConfig`)

### Step 2: Authentication

1. In Firebase Console > Authentication > Sign-in method, enable **Email/Password**
2. Create user accounts for each role:
   - **Seed house officers** — manage QR generation and dispatch
   - **Government administrators** — national oversight, reconciliation, payments
   - **Extension officers** — farmer registration, field verification
3. Use Firestore custom claims or a `users` collection to assign roles

### Step 3: Africa's Talking SMS Setup

1. Register at https://africastalking.com and create a sandbox/live app
2. Get your **API Key** and **Username**
3. Set up a Zimbabwe sender ID (registered with POTRAZ):
   - Econet, NetOne, Telecel all supported via Africa's Talking
   - Short code: `*123#` (for USSD) / alphanumeric sender ID for SMS
4. Configure backend:

```bash
firebase functions:config:set africastalking.username="YOUR_USERNAME" africastalking.api_key="YOUR_API_KEY"
firebase deploy --only functions
```

### Step 4: Firestore Security Rules

The project includes `firestore.rules` and `firestore.indexes.json`. Before deploying:

1. Review the rules and adjust for your auth model
2. Deploy:

```bash
firebase deploy --only firestore
```

Default rules enforce:
- Only authenticated users can read/write
- Seed bag documents are append-only (no deletes)
- Redemption log entries are immutable
- Farmers collection is accessible to extension officers and admins

### Step 5: Deploy All Services

```bash
# 1. Build all dashboards
cd government-dashboard && npm run build
cd seedhouse-dashboard && npm run build
cd extension-officer-dashboard && npm run build
cd farmer-dashboard && npm run build

# 2. Deploy everything
firebase deploy --only hosting
firebase deploy --only firestore
firebase deploy --only functions

# Or deploy all at once
firebase deploy
```

### Step 6: Go-Live URLs

| Dashboard | URL | Primary Users |
|-----------|-----|---------------|
| Seed House | https://agri-logix-seedhouse.web.app | Seed company officers |
| Government | https://agri-logix-government.web.app | MoA officials, Treasury |
| Extension Officer | https://agri-logix-ext-officer.web.app | Agritex officers (field) |
| Farmer | https://agri-logix-farmer.web.app | Pfumvudza beneficiaries |

### Step 7: USSD Integration (Carrier Deployment)

The USSD flow (`*123#`) is implemented server-side in cloud functions (`ussdHandler.ts`). To go live with Zimbabwean telecoms:

1. **Register USSD short code** with POTRAZ (Postal & Telecommunications Regulatory Authority of Zimbabwe)
2. **Onboard with each carrier**:
   - **Econet Wireless** — USSD gateway integration
   - **NetOne** — USSD gateway integration
   - **Telecel Zimbabwe** — USSD gateway integration
3. Configure each carrier's gateway to POST USSD requests to:
   `https://us-central1-agri-logix.cloudfunctions.net/ussdHandler`
4. Test the flow on each network before going live

### Step 8: Domain Setup (Optional)

1. Purchase a custom domain (e.g., `seedtracker.gov.zw`)
2. In Firebase Console > Hosting, add custom domain for each dashboard
3. Configure DNS with your registrar (CNAME records provided by Firebase)
4. SSL certificates are auto-provisioned by Firebase

---

## Operational Procedures

### Monitoring

- **Cloud Functions logs**: View in Firebase Console > Functions > Logs
- **Error alerting**: Set up Sentry or Firebase Crashlytics
- **Usage monitoring**: Firebase Console > Usage & Billing
- **Rate limiting**: Built into `confirmRedemption` and other functions via `rateLimiter.ts`

### Backup & Recovery

- **Daily scheduled backup**: `scheduledBackup.ts` — runs automatically on Cloud Scheduler
- **Manual backup**: Export Firestore via Firebase Console > Firestore > Export
- **Rollback hosting**: `firebase hosting:clone` to revert a dashboard to a previous version
- **Rollback functions**: `firebase deploy --only functions` with a previous version of the code

### Hash Chain Audit

Every bag redemption is logged in a SHA-256 hash chain (`redemptionLog` collection). This provides:
- **Immutable audit trail** — each entry references the previous hash
- **Tamper detection** — any alteration breaks the chain
- **Treasury verification** — payment certificates can be traced back to individual redemptions

To verify the chain:
```bash
firebase functions:call verifyHashChain
```

---

## Key Features

- **QR-based seed bag tracking** from seed house to farmer using GS1-style QR codes
- **SHA-256 hash chain** for immutable audit trail of every redemption
- **USSD redemption** via *123# — works on any phone, no smartphone required
- **GPS-verified** redemption with real-time dashboard maps
- **Counterfeit detection** with automated flagging and alerts
- **Treasury-ready payment certificates** with PDF export
- **Africa's Talking SMS** — instant redemption confirmations to farmers
- **Demo mode** — all dashboards work fully with mock data, toggle on/off
- **Multi-site hosting** — separate deployable URLs for each user role
- **Role-based access** — Seed House, Government, Extension Officer, Farmer dashboards
- **Farmer self-service portal** — beneficiaries can track allocations, view redemption history, and manage their profile online

## Demo Mode

All four dashboards include a demo mode toggle. When enabled, the apps work with mock data — no Firebase connection required. Useful for demonstrations, training, or testing the UI without backend setup.

---

## Project Structure

```
Agri-Logix/
├── backend/functions/        # Firebase Cloud Functions
│   ├── src/
│   │   ├── confirmRedemption.ts    # Redeem a bag with hash-chain logging
│   │   ├── getWardBags.ts          # List all bags in a district/ward
│   │   ├── reconciliation.ts       # Full reconciliation report
│   │   ├── redemption.ts           # USSD redemption handler
│   │   ├── farmerRegistration.ts   # Register farmers via USSD
│   │   ├── seedBagGeneration.ts    # Generate new seed bags
│   │   ├── flagCounterfeit.ts      # Flag suspicious bags
│   │   ├── inventoryAlerts.ts      # Low-stock alerts
│   │   ├── auditChain.ts           # Hash-chain verification
│   │   ├── scheduledBackup.ts      # Daily Firestore backup
│   │   ├── offlineSync.ts          # Offline data sync
│   │   ├── ussdHandler.ts          # USSD gateway handler
│   │   ├── triggers/               # Firestore triggers
│   │   └── utils/
│   │       ├── hashchain.ts        # SHA-256 chain utilities
│   │       ├── smsService.ts       # Africa's Talking SMS client
│   │       └── rateLimiter.ts      # Rate limiting per user
│   └── src/__tests__/              # Jest test suite
├── seedhouse-dashboard/      # Seed House React app (Vite)
├── government-dashboard/     # Government React app (Vite)
├── extension-officer-dashboard/ # Extension Officer React app (Vite)
├── farmer-dashboard/         # Farmer self-service React app (Vite)
├── flutter-app/              # Field agent mobile app
├── ussd/                     # USSD simulator
├── scripts/                  # Deployment scripts
├── firebase.json             # Firebase config (multi-site hosting)
├── .firebaserc               # Firebase project & target aliases
├── firestore.rules           # Firestore security rules
└── firestore.indexes.json    # Firestore composite indexes
```
