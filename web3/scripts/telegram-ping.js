// scripts/telegram-ping.js
// Send a test message via Telegram using TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID from web3/.env
// Usage examples:
//   node scripts/telegram-ping.js
//   node scripts/telegram-ping.js --text "Hello from ping"
//   node scripts/telegram-ping.js --chat-id 123456789 --text "Hi"
//   TELEGRAM_CHAT_ID=@your_channel node scripts/telegram-ping.js --text "Channel ping"

require('dotenv').config({ path: __dirname + '/../.env' });
const https = require('https');

function parseArgs(argv) {
  const args = { text: 'Telegram notifier ping ✅', chatId: undefined, token: undefined };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--text') args.text = argv[++i];
    else if (a === '--chat-id') args.chatId = argv[++i];
    else if (a === '--token') args.token = argv[++i];
  }
  return args;
}

function postToTelegram(token, chatId, text) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', disable_web_page_preview: true });
    const options = {
      hostname: 'api.telegram.org',
      port: 443,
      path: `/bot${token}/sendMessage`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
    };
    const req = https.request(options, (res) => {
      let resp = '';
      res.on('data', (d) => { resp += d; });
      res.on('end', () => {
        const ok = res.statusCode && res.statusCode >= 200 && res.statusCode < 300;
        if (ok) return resolve(resp);
        const err = new Error(`Telegram API ${res.statusCode}: ${resp}`);
        return reject(err);
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function main() {
  const { text, chatId: cliChatId, token: cliToken } = parseArgs(process.argv);
  const token = cliToken || process.env.TELEGRAM_BOT_TOKEN;
  const chatId = cliChatId || process.env.TELEGRAM_CHAT_ID;

  console.log('Token:', token);
  console.log('Chat ID:', chatId);
  
  if (!token) {
    console.error('Missing TELEGRAM_BOT_TOKEN. Set it in web3/.env or pass --token');
    process.exit(1);
  }
  if (!chatId) {
    console.error('Missing TELEGRAM_CHAT_ID. Set it in web3/.env or pass --chat-id');
    process.exit(1);
  }

  console.log('Sending Telegram ping...');
  console.log('Chat ID:', chatId);
  try {
    const resp = await postToTelegram(token, chatId, text);
    console.log('Sent. Response:', resp);
  } catch (e) {
    console.error('Failed to send:', e.message);
    console.error('Tips:');
    console.error('- For channels: add the bot as an admin and use @channel_username as chat_id.');
    console.error('- For DMs/groups: use the numeric chat id (get it via getUpdates).');
    process.exit(1);
  }
}

main();

