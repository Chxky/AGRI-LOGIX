const express = require('express');
const app = express();
app.use(express.json());

const USSD_STATES = {
  WELCOME: 0,
  REDEEM_BAG_CODE: '1_1',
  REDEEM_CONFIRM: '1_2',
  REDEEM_PIN: '1_3',
  CHECK_BAG_CODE: '2_1',
  REGISTER_NAME: '3_1',
  REGISTER_WARD: '3_2',
  REGISTER_PIN: '3_3',
};

const sessions = {};

app.post('/ussd', (req, res) => {
  const { sessionId, phoneNumber, text } = req.body;
  const input = text.split('*').filter(Boolean);
  const level = input.length;

  if (!sessions[sessionId]) {
    sessions[sessionId] = { phoneNumber, createdAt: Date.now() };
  }

  const respond = (message, isEnd) => {
    res.json({ response: message, status: isEnd ? 'END' : 'CON' });
  };

  if (level === 0) {
    return respond(`Agri-Logix SeedTracker

1. Redeem Seed Bag
2. Check Bag Status
3. Register as Farmer
4. My History

Reply with number:`);
  }

  const mainOption = input[0];

  if (mainOption === '1') {
    if (level === 1) {
      return respond(`Enter Seed Bag QR Code:

Example: SC513-2026-0001`);
    }
    if (level === 2) {
      return respond(`Bag Found: SC513
Batch: BATCH-2026-001

Confirm receipt?
1. Yes
2. No`);
    }
    if (level === 3) {
      if (input[2] === '1') {
        return respond('Enter your 4-digit Pfumvudza PIN:');
      }
      return respond('Receipt cancelled. Reply 00 for main menu.', true);
    }
    if (level === 4) {
      return respond(`SUCCESS! Bag ${input[1]} redeemed.

Thank you for partnering with Pfumvudza.`, true);
    }
  }

  if (mainOption === '2') {
    if (level === 1) {
      return respond('Enter Bag Code to check:');
    }
    if (level === 2) {
      return respond(`Bag Status:

Code: ${input[1]}
Variety: SC513
Batch: BATCH-2026-001
Status: In Stock at Warehouse
Authentic: Yes

Reply 00 for main menu.`, true);
    }
  }

  if (mainOption === '3') {
    if (level === 1) return respond('Enter your full name:');
    if (level === 2) return respond(`Select Ward:
1. Ward 1
2. Ward 2
3. Ward 3
4. Ward 4
5. Ward 5
6. Other`);
    if (level === 3) return respond('Create 4-digit PIN:');
    if (level === 4) {
      return respond(`Registration Successful!
Name: ${input[1]}
Ward: ${input[2]}
Phone: ${phoneNumber}

Welcome to Pfumvudza!`, true);
    }
  }

  if (mainOption === '4') {
    return respond(`Your Redemptions:
1. SC513 - BATCH-001 - 15 Jan 2026
2. SC529 - BATCH-002 - 10 Jan 2026

Reply 00 for main menu.`, true);
  }

  if (mainOption === '00') {
    return respond(`Agri-Logix SeedTracker

1. Redeem Seed Bag
2. Check Bag Status
3. Register as Farmer
4. My History

Reply with number:`);
  }

  respond('Invalid option. Try again.');
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`USSD Simulator running on http://localhost:${PORT}/ussd`);
  console.log(`Send POST requests with JSON body:`);
  console.log(`  { "sessionId": "...", "phoneNumber": "+2637XXXXXXX", "text": "1" }`);
});
