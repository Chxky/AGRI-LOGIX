# Agri-Logix SeedTracker — USSD Flow Diagram

## Short Code: *123#

### Main Menu
```
Agri-Logix SeedTracker
1. Redeem Seed Bag
2. Check Bag Status
3. Register as Farmer
4. My History
```

### Flow 1: Redeem Seed Bag
```
Step 1: User selects 1
  → "Enter Seed Bag QR Code:"
  → User enters bag code (e.g., SC513-2026-0001)

Step 2: System validates bag
  → If invalid: "Bag not found. Reply 0 to try again."
  → If already redeemed: "Already claimed on [date]."
  → If flagged: "ALERT: Counterfeit. DO NOT accept."
  → If valid: "Bag Found: SC513, Batch BATCH-2026-001
     Confirm receipt? 1. Yes  2. No"

Step 3: User confirms (1)
  → "Enter your 4-digit Pfumvudza PIN:"
  → User enters PIN

Step 4: System verifies PIN & processes
  → Success: "SUCCESS! Bag redeemed. Thank you."
  → Fail: Error message with guidance
```

### Flow 2: Check Bag Status
```
Step 1: User selects 2
  → "Enter Bag Code:"
  → User enters code

Step 2: System displays:
  "Bag Status:
   Variety: SC513
   Batch: BATCH-2026-001
   Status: In Stock
   Authentic: Yes"
```

### Flow 3: Register as Farmer
```
Step 1: User selects 3
  → "Enter your full name:"

Step 2: "Select Ward: 1.Ward1 2.Ward2 ... 6.Other"

Step 3: "Create 4-digit PIN:"

Step 4: Confirmation → "Registration Successful!"
```

### Flow 4: My History
```
Step 1: User selects 4
  → "Your Redemptions:
     1. SC513 - Batch-001 - 15 Jan 2026
     2. SC529 - Batch-002 - 10 Jan 2026"
```

## Africa's Talking USSD API Integration

The USSD handler is deployed as a Firebase Cloud Function at:
`POST https://us-central1-{project}.cloudfunctions.net/ussdWebhook`

### Africa's Talking Configuration
1. Log into Africa's Talking dashboard
2. Go to USSD > Create Channel
3. Set short code: *123*
4. Set callback URL to your Firebase function URL
5. Set request format to JSON

### Request Format (from Africa's Talking)
```json
{
  "sessionId": "SESSION_ID",
  "serviceCode": "*123#",
  "phoneNumber": "+2637XXXXXXX",
  "text": "1*SC513-2026-0001"
}
```

### Response Format (to Africa's Talking)
```json
{
  "response": "Message text",
  "status": "CON"   // CON for more input, END to terminate
}
```

## Important Notes
- USSD works on ALL mobile networks in Zimbabwe
- No smartphone or data required
- GPS is approximated via network cell ID or manual ward selection
- PIN is hashed with SHA-256 before storage
- All redemption events are logged in the immutable audit trail
