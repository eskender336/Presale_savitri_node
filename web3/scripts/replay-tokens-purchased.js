// scripts/replay-tokens-purchased.js
// Fetch past TokensPurchased events and send them to Telegram without making on-chain txs.
// Useful for testing the Telegram pipeline when you can't spend gas right now.
//
// Env (web3/.env):
//   - CONTRACT_ADDRESS or NEXT_PUBLIC_TOKEN_ICO_ADDRESS
//   - NETWORK_RPC_URL (https://...)
//   - TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID
//   - NETWORK_NAME (optional)
//   - NATIVE_SYMBOL (default: NATIVE)
//   - EXPLORER_TX_URL (optional, e.g., https://bscscan.com/tx/ )
//   - REPLAY_FROM_BLOCK (optional, default: latest-5000)
//   - REPLAY_TO_BLOCK   (optional, default: latest)
//   - REPLAY_SPAN       (optional, default: 1000)
//   - NO_POST           (optional: if set to 1, only logs, no Telegram)

require('dotenv').config({ path: __dirname + '/../.env' });
const { ethers } = require('ethers');
const https = require('https');

const NETWORK_RPC_URL = process.env.NETWORK_RPC_URL || '';
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || process.env.NEXT_PUBLIC_TOKEN_ICO_ADDRESS;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const NETWORK_NAME = process.env.NETWORK_NAME || 'network';
const NATIVE_SYMBOL = process.env.NATIVE_SYMBOL || 'NATIVE';
const EXPLORER_TX_URL = process.env.EXPLORER_TX_URL || '';
const NO_POST = /^1|true|yes$/i.test(process.env.NO_POST || '');

if (!NETWORK_RPC_URL) {
  console.error('Missing NETWORK_RPC_URL');
  process.exit(1);
}
if (!CONTRACT_ADDRESS) {
  console.error('Missing CONTRACT_ADDRESS (or NEXT_PUBLIC_TOKEN_ICO_ADDRESS)');
  process.exit(1);
}
if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
  console.error('Missing Telegram config: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID');
  process.exit(1);
}

let abi;
try {
  abi = require('../artifacts/contracts/TokenICO.sol/TokenICO.json').abi;
} catch (e) {
  console.error('Unable to load ABI. Did you run `npm run compile` in web3/?', e.message);
  process.exit(1);
}

const erc20Abi = [
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)'
];

function postToTelegram(text) {
  if (NO_POST) return Promise.resolve('NO_POST=1');
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text, parse_mode: 'HTML', disable_web_page_preview: true });
    const options = {
      hostname: 'api.telegram.org',
      port: 443,
      path: `/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
    };
    const req = https.request(options, (res) => {
      let resp = '';
      res.on('data', (d) => { resp += d; });
      res.on('end', () => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) return resolve(resp);
        reject(new Error(`Telegram API ${res.statusCode}: ${resp}`));
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function formatAmount(amountBN, decimals) {
  try {
    return ethers.utils.commify(ethers.utils.formatUnits(amountBN, decimals));
  } catch (_) {
    return amountBN.toString();
  }
}

async function main() {
  const provider = new ethers.providers.JsonRpcProvider(NETWORK_RPC_URL);
  const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, provider);

  const latest = await provider.getBlockNumber();

  // Optional date-based range resolution
  async function findBlockByTimestamp(targetTs, low, high) {
    low = Math.max(1, low || 1);
    high = Math.max(low, high || latest);
    let l = low, r = high;
    while (l < r) {
      const mid = Math.floor((l + r) / 2);
      let b;
      try {
        b = await provider.getBlock(mid);
      } catch (e) {
        // light backoff and continue
        await new Promise((res) => setTimeout(res, 250));
        continue;
      }
      if (!b || !b.timestamp) {
        // skip if missing
        l = mid + 1;
        continue;
      }
      if (b.timestamp >= targetTs) {
        r = mid;
      } else {
        l = mid + 1;
      }
    }
    return l;
  }

  let fromBlockResolved;
  let toBlockResolved;

  const fromDateStr = process.env.REPLAY_FROM_DATE; // e.g. 2025-08-23T20:58:35Z
  const toDateStr = process.env.REPLAY_TO_DATE;

  if (fromDateStr) {
    const ts = Math.floor(Date.parse(fromDateStr) / 1000);
    if (!Number.isFinite(ts)) throw new Error(`Invalid REPLAY_FROM_DATE: ${fromDateStr}`);
    fromBlockResolved = await findBlockByTimestamp(ts);
  }
  if (toDateStr) {
    const ts = Math.floor(Date.parse(toDateStr) / 1000);
    if (!Number.isFinite(ts)) throw new Error(`Invalid REPLAY_TO_DATE: ${toDateStr}`);
    toBlockResolved = await findBlockByTimestamp(ts);
  }

  const fromEnv = fromBlockResolved || (process.env.REPLAY_FROM_BLOCK ? parseInt(process.env.REPLAY_FROM_BLOCK, 10) : Math.max(0, latest - 5000));
  const toEnv = toBlockResolved || (process.env.REPLAY_TO_BLOCK ? parseInt(process.env.REPLAY_TO_BLOCK, 10) : latest);
  const span = Math.max(1, parseInt(process.env.REPLAY_SPAN || '1000', 10));
  const fromBlock = Math.max(0, fromEnv);
  const toBlock = Math.max(fromBlock, toEnv);

  console.log(`[replay] Network ${NETWORK_NAME} address ${CONTRACT_ADDRESS}`);
  console.log(`[replay] Range: ${fromBlock} -> ${toBlock} (span ${span})`);

  // Preload sale token meta
  let saleToken = ethers.constants.AddressZero;
  let saleTokenDecimals = 18;
  let saleTokenSymbol = 'SALE';
  try {
    saleToken = await contract.saleToken();
    if (saleToken && saleToken !== ethers.constants.AddressZero) {
      const c = new ethers.Contract(saleToken, erc20Abi, provider);
      saleTokenDecimals = await c.decimals().catch(() => 18);
      saleTokenSymbol = await c.symbol().catch(() => 'SALE');
    }
  } catch (_) {}

  const filter = contract.filters.TokensPurchased();

  async function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }
  let delayMs = Math.max(250, parseInt(process.env.REPLAY_DELAY_MS || '500', 10));

  for (let from = fromBlock; from <= toBlock; ) {
    let currentSpan = span;
    let to = Math.min(from + currentSpan - 1, toBlock);
    let got = null;
    let attempts = 0;
    while (true) {
      attempts += 1;
      console.log(`[replay] Fetching ${from}..${to} (span=${currentSpan}, attempt=${attempts})`);
      try {
        got = await contract.queryFilter(filter, from, to);
        break;
      } catch (e) {
        const msg = String(e && (e.body || e.message || e));
        const isLimit = (e && e.code === -32005) || /limit exceeded/i.test(msg);
        if (isLimit && currentSpan > 10) {
          currentSpan = Math.max(10, Math.floor(currentSpan / 2));
          to = Math.min(from + currentSpan - 1, toBlock);
          console.warn(`[replay] RPC limit exceeded; reducing span to ${currentSpan} and retrying after ${delayMs}ms`);
          await sleep(delayMs);
          continue;
        }
        console.error(`[replay] Error fetching ${from}..${to}:`, e.message || e);
        // backoff and move on to next window to avoid getting stuck
        await sleep(delayMs);
        got = [];
        break;
      }
    }

    for (const ev of got) {
      const [buyer, paymentMethod, amountPaid, tokensBought, timestamp] = ev.args;
      // Payment meta
      let payDecimals = 18, paySymbol = NATIVE_SYMBOL;
      if (paymentMethod && paymentMethod !== ethers.constants.AddressZero) {
        try {
          const t = new ethers.Contract(paymentMethod, erc20Abi, provider);
          payDecimals = await t.decimals().catch(() => 18);
          paySymbol = await t.symbol().catch(() => 'TOKEN');
        } catch (_) {}
      }
      const paid = await formatAmount(amountPaid, payDecimals);
      const bought = await formatAmount(tokensBought, saleTokenDecimals);
      const when = timestamp && timestamp.toNumber ? new Date(timestamp.toNumber() * 1000) : new Date();
      const txUrl = EXPLORER_TX_URL ? `${EXPLORER_TX_URL}${ev.transactionHash}` : ev.transactionHash;

      const text = [
        `Replayed Purchase on <b>${NETWORK_NAME}</b> 🧾`,
        `Buyer: <code>${buyer}</code>`,
        `Paid: <b>${paid}</b> ${paySymbol}`,
        `Bought: <b>${bought}</b> ${saleTokenSymbol}`,
        `Tx: ${txUrl}`,
        `Block: ${ev.blockNumber}`,
        `Time: ${when.toISOString()}`
      ].join('\n');

      console.log(`[replay] Posting ${ev.transactionHash}...`);
      try {
        const resp = await postToTelegram(text);
        console.log(`[replay] Sent ok: ${resp && resp.slice ? resp.slice(0, 80) : ''}`);
      } catch (e) {
        console.error(`[replay] Telegram send failed for ${ev.transactionHash}:`, e.message);
      }
    }
    // advance window
    from = to + 1;
    await sleep(delayMs);
  }
}

main().catch((e) => {
  console.error('[replay] Fatal:', e);
  process.exit(1);
});
