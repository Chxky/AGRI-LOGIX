# Agri-Logix SeedTracker

Blockchain-verified seed supply chain tracking platform for Zimbabwe's Pfumvudza input scheme.

## Architecture

| Component | Tech | Description |
|-----------|------|-------------|
| `government-dashboard/` | React + Antd | National oversight, reconciliation, payment verification |
| `seedhouse-dashboard/` | React + Antd | QR generation, dispatch management, batch tracking |
| `backend/` | Firebase Functions | Cloud functions, Firestore, hash-chain audit trail |
| `flutter-app/` | Flutter | Mobile app for field redemption with GPS verification |
| `ussd/` | Node.js | USSD simulator for testing *123# flows locally |

## Quick Start

```bash
# Government dashboard (port 3001)
cd government-dashboard
npm install && npm start

# Seed house dashboard (port 3000)
cd seedhouse-dashboard
npm install && npm start

# USSD simulator (port 4000)
cd ussd
npm install && npm run server

# Backend functions
cd backend/functions
npm install && npm run serve
```

## Key Features

- **QR-based seed bag tracking** from seed house to farmer
- **SHA-256 hash chain** for immutable audit trail
- **USSD redemption** via *123# (no smartphone required)
- **GPS-verified** redemption with real-time dashboard
- **Counterfeit detection** with automated flagging
- **Treasury-ready payment certificates** with PDF export
