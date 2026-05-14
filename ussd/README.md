# Agri-Logix USSD Simulator

Local testing tools for the Agri-Logix SeedTracker USSD flows.

## Quick Start

```bash
npm install
npm run server    # Start local USSD simulator on port 4000
npm run simulate  # Interactive CLI simulation
npm run test      # Run automated test scenarios
```

## Flows

All accessible via short code `*123#`:

| Option | Flow |
|--------|------|
| 1 | Redeem Seed Bag (enter code → confirm → PIN) |
| 2 | Check Bag Status (enter code → view status) |
| 3 | Register as Farmer (name → ward → PIN) |
| 4 | View redemption history |

## Commands

- `npm run server` — Starts a local Express server mimicking the USSD handler
- `npm run simulate` — Interactive CLI that walks through USSD flows step by step
- `npm run test` — Runs automated test scenarios against the server

## Production

The production USSD handler is deployed as a Firebase Cloud Function at:
`POST https://us-central1-{project}.cloudfunctions.net/ussdWebhook`

Configure Africa's Talking to point to the Firebase Function URL.
