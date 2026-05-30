# Agri-Logix SeedTracker

Blockchain-verified seed supply chain tracking platform for Zimbabwe's Pfumvudza/Intwasa input scheme.

**Live dashboards:**
| Role | URL | Login |
|------|-----|-------|
| Administrator | https://agri-logix-seedhouse.web.app | `admin2@demo.com` / `Admin@123` |
| Seed House | https://agri-logix-seedhouse.web.app | `seedhouse@demo.com` / `Seed@123` |
| Government | https://agri-logix-government.web.app | `gov@demo.com` / `Gov@123` |
| Extension Officer | https://agri-logix-ext-officer.web.app | `extension@demo.com` / `Ext@123` |
| Farmer | https://agri-logix-farmer.web.app | `farmer@demo.com` / `Farmer@123` |

All dashboards also support **Demo Mode** — click "Enter Demo Mode" on the login page to bypass authentication and explore with sample data.

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
cd government-dashboard && npm install
cd seedhouse-dashboard && npm install
cd extension-officer-dashboard && npm install
cd farmer-dashboard && npm install
cd backend/functions && npm install
cd ussd && npm install
```

### 2. Set up environment variables

```bash
cp seedhouse-dashboard/.env.example seedhouse-dashboard/.env
cp government-dashboard/.env.example government-dashboard/.env
cp extension-officer-dashboard/.env.example extension-officer-dashboard/.env
cp farmer-dashboard/.env.example farmer-dashboard/.env
```

For Africa's Talking SMS (production only — requires Blaze plan):
```bash
cd backend/functions
firebase functions:config:set africastalking.username="YOUR_AT_USERNAME" africastalking.api_key="YOUR_AT_API_KEY"
```

### 3. Run locally with Firebase emulators

```bash
# Terminal 1: Start all emulators
firebase emulators:start

# Terminal 2-5: Start each dashboard
cd government-dashboard && npm run dev        # http://localhost:5173
cd seedhouse-dashboard && npm run dev         # http://localhost:5174
cd extension-officer-dashboard && npm run dev # http://localhost:5175
cd farmer-dashboard && npm run dev            # http://localhost:5176
```

### 4. Run tests

```bash
cd backend/functions
npm test
```

---

## Production Deployment Guide (Zimbabwe)

### Step 1: Firebase Account Setup

1. Create a Firebase project at https://console.firebase.google.com
2. **Upgrade to Blaze (pay-as-you-go) plan** — required for cloud functions.
   - Project > Usage & Billing > Blaze plan
   - Cloud Functions, Cloud Build, and Artifact Registry APIs auto-enable
3. Register your Firebase app for the web SDK (get `firebaseConfig`)

### Step 2: Authentication

1. Firebase Console > Authentication > Sign-in method > enable **Email/Password**
2. Create user accounts. Demo accounts already provisioned:

| Email | Password | Role |
|-------|----------|------|
| admin2@demo.com | Admin@123 | Administrator (seed house + gov access) |
| seedhouse@demo.com | Seed@123 | Seed house officer |
| gov@demo.com | Gov@123 | Government official |
| extension@demo.com | Ext@123 | Extension officer (Agritex) |
| farmer@demo.com | Farmer@123 | Pfumvudza beneficiary |

### Step 3: Africa's Talking SMS Setup

1. Register at https://africastalking.com
2. Get your API Key and Username
3. Register Zimbabwe sender ID with POTRAZ
4. Configure:

```bash
firebase functions:config:set africastalking.username="YOUR_USERNAME" africastalking.api_key="YOUR_API_KEY"
firebase deploy --only functions
```

### Step 4: Deploy All Services

```bash
# Build all dashboards
cd government-dashboard && npm run build
cd seedhouse-dashboard && npm run build
cd extension-officer-dashboard && npm run build
cd farmer-dashboard && npm run build

# Deploy everything
firebase deploy --only hosting
firebase deploy --only firestore
firebase deploy --only functions
```

### Step 5: USSD Integration (Carrier Deployment)

The USSD flow (`*123#`) is in `ussdHandler.ts`. To go live:
1. Register USSD short code with **POTRAZ**
2. Onboard with **Econet**, **NetOne**, **Telecel**
3. Configure each carrier's gateway to POST to:
   `https://us-central1-agri-logix.cloudfunctions.net/ussdHandler`

### Step 6: Custom Domain (Optional)

Add custom domain in Firebase Console > Hosting for each dashboard.
SSL certificates are auto-provisioned.

---

## Operational Procedures

### Monitoring
- Cloud Functions logs: Firebase Console > Functions > Logs
- Rate limiting: Built into `confirmRedemption` and other functions via `rateLimiter.ts`

### Backup & Recovery
- Daily scheduled backup: `scheduledBackup.ts` (Cloud Scheduler)
- Manual: Firebase Console > Firestore > Export
- Rollback hosting: `firebase hosting:clone`
- Rollback functions: Re-deploy previous code with `firebase deploy --only functions`

### Hash Chain Audit
Every redemption is logged in a SHA-256 hash chain (`redemptionLog` collection).
To verify: `firebase functions:call verifyHashChain`

---

## Key Features

- **QR-based seed bag tracking** from seed house to farmer
- **SHA-256 hash chain** for immutable audit trail
- **USSD redemption** via *123# — works on any phone
- **GPS-verified** redemption with real-time dashboard maps
- **Counterfeit detection** with automated flagging
- **Treasury-ready payment certificates** with PDF export
- **Africa's Talking SMS** — instant redemption confirmations
- **Demo mode** — all dashboards work fully with mock data, toggle on/off
- **Multi-site hosting** — separate URLs for each user role
- **Farmer self-service portal** — beneficiaries track allocations online

## Demo Mode

All dashboards have a demo mode toggle. When enabled, the apps work with mock data — no Firebase connection required. Useful for demonstrations, training, and testing the UI without backend setup.

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
│   └── src/__tests__/              # Jest test suite (12 tests)
├── seedhouse-dashboard/      # Seed House React app (Vite)
├── government-dashboard/     # Government React app (Vite)
├── extension-officer-dashboard/ # Extension Officer React app (Vite)
├── farmer-dashboard/         # Farmer self-service React app (Vite)
├── flutter-app/              # Field agent mobile app (Flutter)
├── ussd/                     # USSD simulator (Node.js)
├── scripts/                  # Deployment & admin scripts
├── firebase.json             # Firebase multi-site hosting config
├── .firebaserc               # Firebase project & target aliases
├── firestore.rules           # Firestore security rules
└── firestore.indexes.json    # Firestore composite indexes
```
