const axios = require('axios');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const USSD_SERVER = process.env.USSD_URL || 'http://localhost:4000/ussd';
const PHONE = process.env.PHONE || '+263771000001';
const SESSION = `sim_${Date.now()}`;

let currentText = '';

async function sendUssd(input) {
  currentText = currentText ? `${currentText}*${input}` : input;
  try {
    const res = await axios.post(USSD_SERVER, {
      sessionId: SESSION,
      phoneNumber: PHONE,
      text: currentText,
    });
    return res.data;
  } catch (err) {
    return { response: `Error: ${err.message}`, status: 'END' };
  }
}

async function prompt() {
  const data = await sendUssd('');
  console.log(`\n\x1b[36m[SERVER]\x1b[0m ${data.response}\n`);

  if (data.status === 'END') {
    console.log('\x1b[33mSession ended. Start a new session to try again.\x1b[0m');
    rl.close();
    return;
  }

  rl.question('\x1b[32m[YOU]\x1b[0m Enter reply: ', async (answer) => {
    if (answer === 'exit' || answer === 'quit') {
      rl.close();
      return;
    }
    const data = await sendUssd(answer);
    console.log(`\n\x1b[36m[SERVER]\x1b[0m ${data.response}`);

    if (data.status === 'END') {
      console.log('\n\x1b[33mSession ended. Run again to start a new session.\x1b[0m');
      rl.close();
    } else {
      promptLoop();
    }
  });
}

async function promptLoop() {
  rl.question('\x1b[32m[YOU]\x1b[0m Enter reply: ', async (answer) => {
    if (answer === 'exit' || answer === 'quit') {
      rl.close();
      return;
    }
    const data = await sendUssd(answer);
    console.log(`\n\x1b[36m[SERVER]\x1b[0m ${data.response}`);

    if (data.status === 'END') {
      console.log('\n\x1b[33mSession ended. Run again to start a new session.\x1b[0m');
      rl.close();
    } else {
      promptLoop();
    }
  });
}

console.log(`\x1b[35mAgri-Logix USSD Simulator\x1b[0m`);
console.log(`Server: ${USSD_SERVER}`);
console.log(`Phone:  ${PHONE}`);
console.log(`Session: ${SESSION}`);
console.log(`Type \x1b[31mexit\x1b[0m to quit.\n`);

prompt();
