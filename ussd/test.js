const axios = require('axios');
const SERVER = process.env.USSD_URL || 'http://localhost:4000/ussd';

const scenarios = [
  { name: 'Redeem bag flow', inputs: ['1', 'SC513-2026-0001', '1', '1234'] },
  { name: 'Check bag status', inputs: ['2', 'SC513-2026-0001'] },
  { name: 'Register farmer', inputs: ['3', 'John Farmer', '1', '5678'] },
  { name: 'View history', inputs: ['4'] },
  { name: 'Invalid option', inputs: ['9'] },
  { name: 'Back to menu', inputs: ['00'] },
];

async function runScenario(scenario) {
  console.log(`\n\x1b[35m=== ${scenario.name} ===\x1b[0m`);
  const sessionId = `test_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  let text = '';

  for (const input of scenario.inputs) {
    text = text ? `${text}*${input}` : input;
    try {
      const res = await axios.post(SERVER, {
        sessionId,
        phoneNumber: '+263771000001',
        text,
      });
      const statusIcon = res.data.status === 'END' ? '✓' : '→';
      console.log(`  \x1b[33m[${statusIcon}]\x1b[0m ${res.data.response.replace(/\n/g, '\n     ')}`);
      if (res.data.status === 'END') break;
    } catch (err) {
      console.log(`  \x1b[31m[✗]\x1b[0m Error: ${err.message}`);
      break;
    }
  }
}

async function main() {
  console.log(`\x1b[36mAgri-Logix USSD Test Suite\x1b[0m`);
  console.log(`Server: ${SERVER}`);
  console.log(`Tests:  ${scenarios.length} scenarios`);

  for (const scenario of scenarios) {
    await runScenario(scenario);
  }

  console.log(`\n\x1b[32mAll tests completed.\x1b[0m`);
}

main().catch(console.error);
