import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as crypto from 'crypto';

const db = admin.firestore();

interface USSDRequest {
  sessionId: string;
  serviceCode: string;
  phoneNumber: string;
  text: string;
}

interface USSDResponse {
  response: string;
  status: 'CON' | 'END';
}

function parseText(text: string): string[] {
  return text.split('*').filter(Boolean);
}

function wrapResponse(message: string, isEnd: boolean): USSDResponse {
  return {
    response: message,
    status: isEnd ? 'END' : 'CON',
  };
}

export const ussdWebhook = functions.https.onRequest(async (req, res) => {
  res.set('Content-Type', 'text/plain');

  try {
    const { phoneNumber, text } = req.body as USSDRequest;

    if (!phoneNumber) {
      res.send(wrapResponse('END Invalid request. Please try again.', true));
      return;
    }

    const normalizedPhone = phoneNumber.startsWith('+')
      ? phoneNumber
      : `+${phoneNumber}`;

    const input = parseText(text);
    const currentLevel = input.length;

    functions.logger.info(`USSD request from ${normalizedPhone}, level ${currentLevel}, input: ${text}`);

    // Level 0: Welcome screen
    if (currentLevel === 0) {
      const response = `Agri-Logix SeedTracker

1. Redeem Seed Bag
2. Check Bag Status
3. Register as Farmer
4. My History

Reply with number:`;
      res.send(wrapResponse(response, false));
      return;
    }

    const mainOption = input[0];

    // ====== REDEEM BAG FLOW ======
    if (mainOption === '1') {
      if (currentLevel === 1) {
        // Ask for bag code
        const response = `Enter Seed Bag QR Code:

Example: SC513-2026-0001

Or scan QR code if using smartphone:`;
        res.send(wrapResponse(response, false));
        return;
      }

      if (currentLevel === 2) {
        // Bag code provided, check it
        const bagCode = input[1];
        const bagDoc = await db.collection('seedBags').doc(bagCode).get();

        if (!bagDoc.exists) {
          const response = `Invalid code. Bag ${bagCode} not found in system.

Reply 0 to try again or 00 to main menu.`;
          res.send(wrapResponse(response, false));
          return;
        }

        const bag = bagDoc.data()!;

        if (bag.condition === 'redeemed') {
          const response = `Already Redeemed.

Bag ${bagCode} was already claimed on ${bag.redemptionTimestamp?.toDate().toLocaleDateString()}.

Contact your extension officer if this is a mistake.

Reply 00 for main menu.`;
          res.send(wrapResponse(response, true));
          return;
        }

        if (bag.condition === 'flagged' || !bag.isAuthentic) {
          const response = `ALERT: This bag is flagged as potentially counterfeit.

DO NOT accept. Contact Seed Services immediately.

Reply 00 for main menu.`;
          res.send(wrapResponse(response, true));
          return;
        }

        const response = `Bag Found:

Variety: ${bag.variety}
Batch: ${bag.batchNumber}
Status: ${bag.condition}

Confirm receipt?
1. Yes
2. No

Reply:`;
        res.send(wrapResponse(response, false));
        return;
      }

      if (currentLevel === 3) {
        const confirmation = input[2];

        if (confirmation === '1') {
          // Confirmed - ask for PIN
          const response = `Enter your 4-digit Pfumvudza PIN:`;
          res.send(wrapResponse(response, false));
          return;
        }

        if (confirmation === '2') {
          const response = `Receipt cancelled.

Bag ${input[1]} has NOT been redeemed.

Reply 00 for main menu.`;
          res.send(wrapResponse(response, true));
          return;
        }

        const response = `Invalid option. Please reply 1 for Yes or 2 for No.`;
        res.send(wrapResponse(response, false));
        return;
      }

      if (currentLevel === 4) {
        // PIN entered - process redemption
        const bagCode = input[1];
        const pin = input[3];

        try {
          // Inline redemption logic (cannot call onCall function directly)
          const bagRef = db.collection('seedBags').doc(bagCode);
          const bagDoc = await bagRef.get();

          if (!bagDoc.exists) {
            res.send(wrapResponse('END Bag not found. Please check code and try again.', true));
            return;
          }

          const bag = bagDoc.data()!;

          if (bag.condition === 'redeemed') {
            res.send(wrapResponse('END Already Redeemed. This bag was already claimed. Contact extension officer if error.', true));
            return;
          }

          if (bag.condition === 'flagged' || !bag.isAuthentic) {
            res.send(wrapResponse('END ALERT: This bag is flagged. DO NOT accept. Contact Seed Services.', true));
            return;
          }

          const farmerRef = db.collection('farmers').doc(normalizedPhone);
          const farmerDoc = await farmerRef.get();

          if (!farmerDoc.exists) {
            res.send(wrapResponse('END Not Registered. Please register first: Dial *123# and select option 3.', true));
            return;
          }

          const farmer = farmerDoc.data()!;
          const pinHash = crypto.createHash('sha256').update(pin).digest('hex');

          if (farmer.pinHash !== pinHash) {
            res.send(wrapResponse('END Incorrect PIN. Please try again by dialing *123#. If forgotten, visit your extension officer.', true));
            return;
          }

          // Get last log for hash chaining
          const lastLogSnapshot = await db.collection('redemptionLog')
            .orderBy('timestamp', 'desc')
            .limit(1)
            .get();

          const previousHash = lastLogSnapshot.empty
            ? 'GENESIS_BLOCK_AGRI_LOGIX_2026'
            : lastLogSnapshot.docs[0].data().currentHash;

          const timestamp = admin.firestore.Timestamp.now();
          const logData = JSON.stringify({ bagId: bagCode, phoneNumber: normalizedPhone, timestamp: timestamp.toMillis() });
          const currentHash = crypto
            .createHash('sha256')
            .update(previousHash + logData)
            .digest('hex');

          await bagRef.update({
            condition: 'redeemed',
            farmerPhone: normalizedPhone,
            redemptionTimestamp: timestamp,
          });

          await db.collection('redemptionLog').add({
            bagId: bagCode,
            action: 'redeemed',
            timestamp,
            performedBy: normalizedPhone,
            ward: farmer.ward || null,
            previousHash,
            currentHash,
            createdAt: timestamp,
          });

          functions.logger.info(`USSD redemption: Bag ${bagCode} redeemed by ${normalizedPhone}`);

          const response = `SUCCESS!

Receipt confirmed. Bag ${bagCode} redeemed successfully.

Variety: ${bag.variety}
Batch: ${bag.batchNumber}
Time: ${timestamp.toDate().toLocaleString()}

Thank you for partnering with Pfumvudza.`;

          res.send(wrapResponse(response, true));
          return;
        } catch (error) {
          functions.logger.error('USSD redemption error:', error);
          res.send(wrapResponse('END System error. Please try again later.', true));
          return;
        }
      }
    }

    // ====== CHECK BAG STATUS ======
    if (mainOption === '2') {
      if (currentLevel === 1) {
        const response = `Enter Bag Code to check:

Example: SC513-2026-0001

Reply or 00 for main menu:`;
        res.send(wrapResponse(response, false));
        return;
      }

      if (currentLevel === 2) {
        const bagCode = input[1];
        const bagDoc = await db.collection('seedBags').doc(bagCode).get();

        if (!bagDoc.exists) {
          const response = `Bag ${bagCode} not found in system.

Reply 0 to try again or 00 for main menu.`;
          res.send(wrapResponse(response, false));
          return;
        }

        const bag = bagDoc.data()!;
        const statusMap: Record<string, string> = {
          'in_stock': 'In Stock at Warehouse',
          'dispatched': 'Dispatched to District',
          'redeemed': 'Redeemed by Farmer',
          'flagged': 'Flagged - Do Not Accept',
        };

        const response = `Bag Status:

Code: ${bagCode}
Variety: ${bag.variety}
Batch: ${bag.batchNumber}
Status: ${statusMap[bag.condition] || bag.condition}
Authentic: ${bag.isAuthentic ? 'Yes' : 'NO - FLAGGED'}

Certification: ${bag.certificationId}

Reply 00 for main menu.`;
        res.send(wrapResponse(response, true));
        return;
      }
    }

    // ====== REGISTER FARMER ======
    if (mainOption === '3') {
      if (currentLevel === 1) {
        const response = `Farmer Registration

Enter your full name:`;
        res.send(wrapResponse(response, false));
        return;
      }

      if (currentLevel === 2) {
        const response = `Select your Ward:

1. Ward 1
2. Ward 2
3. Ward 3
4. Ward 4
5. Ward 5
6. Other (type name)

Reply:`;
        res.send(wrapResponse(response, false));
        return;
      }

      if (currentLevel === 3) {
        const response = `Create your 4-digit PIN:

This will secure your redemptions.`;
        res.send(wrapResponse(response, false));
        return;
      }

      if (currentLevel === 4) {
        const name = input[1];
        let ward = input[2];
        const wardMap: Record<string, string> = {
          '1': 'Ward 1',
          '2': 'Ward 2',
          '3': 'Ward 3',
          '4': 'Ward 4',
          '5': 'Ward 5',
        };
        ward = wardMap[ward] || ward;
        const pin = input[3];

        if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
          const response = `Invalid PIN. Must be 4 digits.

Please start again by dialing *123#.`;
          res.send(wrapResponse(response, true));
          return;
        }

        const pinHash = crypto.createHash('sha256').update(pin).digest('hex');

        const farmerRef = db.collection('farmers').doc(normalizedPhone);
        const existingDoc = await farmerRef.get();

        if (existingDoc.exists) {
          const response = `Already Registered.

Phone ${normalizedPhone} is already registered.
Use *123# to redeem your seed bags.`;
          res.send(wrapResponse(response, true));
          return;
        }

        await farmerRef.set({
          phoneNumber: normalizedPhone,
          name,
          ward,
          pinHash,
          registeredDate: admin.firestore.Timestamp.now(),
          registrationSource: 'ussd',
        });

        functions.logger.info(`New farmer registered via USSD: ${normalizedPhone}`, {
          name,
          ward,
        });

        const response = `Registration Successful!

Farmer: ${name}
Ward: ${ward}
Phone: ${normalizedPhone}

You can now redeem seed bags by dialing *123# and selecting option 1.

Welcome to Pfumvudza!`;
        res.send(wrapResponse(response, true));
        return;
      }
    }

    // ====== MY HISTORY ======
    if (mainOption === '4') {
      const bagsSnapshot = await db.collection('seedBags')
        .where('farmerPhone', '==', normalizedPhone)
        .where('condition', '==', 'redeemed')
        .orderBy('redemptionTimestamp', 'desc')
        .limit(5)
        .get();

      if (bagsSnapshot.empty) {
        const response = `No redemption history found.

Dial *123# and select option 1 to redeem your first seed bag.`;
        res.send(wrapResponse(response, true));
        return;
      }

      const lines: string[] = ['Your Redemptions:'];
      bagsSnapshot.docs.forEach((doc, index) => {
        const bag = doc.data();
        lines.push(`${index + 1}. ${bag.variety}`);
        lines.push(`   ${bag.batchNumber}`);
        lines.push(`   ${bag.redemptionTimestamp?.toDate().toLocaleDateString()}`);
      });
      lines.push('');
      lines.push('Reply 00 for main menu.');

      res.send(wrapResponse(lines.join('\n'), true));
      return;
    }

    // ====== NAVIGATION ======
    if (mainOption === '00') {
      // Back to main menu
      const response = `Agri-Logix SeedTracker

1. Redeem Seed Bag
2. Check Bag Status
3. Register as Farmer
4. My History

Reply with number:`;
      res.send(wrapResponse(response, false));
      return;
    }

    if (mainOption === '0') {
      // Go back one level
      res.send(wrapResponse('END Returning to menu. Dial *123# again.', true));
      return;
    }

    // Default fallback
    const response = `Invalid option.

1. Redeem Seed Bag
2. Check Bag Status
3. Register as Farmer

Reply with number:`;
    res.send(wrapResponse(response, false));
  } catch (error) {
    functions.logger.error('USSD handler error:', error);
    res.send(wrapResponse('END System error. Please try again later.', true));
  }
});
