// scripts/replay-transactions.js
// Fetch past external transactions to the TokenICO contract (via BscScan API)
// and send a Telegram message for each (or just log). This covers "transactions"
// not just emitted events. Requires BSCSCAN_API_KEY.
//
// Env (web3/.env):
//   - CONTRACT_ADDRESS or NEXT_PUBLIC_TOKEN_ICO_ADDRESS
//   - BSCSCAN_API_KEY
//   - TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID
//   - NETWORK_NAME (optional; default: bsc)
//   - EXPLORER_TX_URL (optional; e.g., https://bscscan.com/tx/)
//   - FROM_BLOCK (optional)
//   - TO_BLOCK   (optional; default latest)
//   - PAGE_SIZE  (optional; default 10000)
//   - NO_POST    (optional; if set to 1 — log only)

require('dotenv').config({ path: __dirname + '/../.env' });
const https = require('https');
const { ethers } = require('ethers');

const CONTRACT_ADDRESS = (process.env.CONTRACT_ADDRESS || process.env.NEXT_PUBLIC_TOKEN_ICO_ADDRESS || '').trim();
const BSCSCAN_API_KEY = (process.env.BSCSCAN_API_KEY || '').trim();
const TELEGRAM_BOT_TOKEN = (process.env.TELEGRAM_BOT_TOKEN || '').trim();
const TELEGRAM_CHAT_ID = (process.env.TELEGRAM_CHAT_ID || '').trim();
const NETWORK_NAME = process.env.NETWORK_NAME || 'bsc';
const EXPLORER_TX_URL = process.env.EXPLORER_TX_URL || 'https://bscscan.com/tx/';
const NO_POST = /^(1|true|yes)$/i.test(process.env.NO_POST || '');
const PURCHASE_ONLY = !process.env.PURCHASE_ONLY || /^(1|true|yes)$/i.test(process.env.PURCHASE_ONLY);

if (!CONTRACT_ADDRESS) {
  console.error('Missing CONTRACT_ADDRESS (or NEXT_PUBLIC_TOKEN_ICO_ADDRESS)');
  process.exit(1);
}
if (!BSCSCAN_API_KEY) {
  console.error('Missing BSCSCAN_API_KEY');
  process.exit(1);
}
if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
  console.error('Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID');
  process.exit(1);
}

// Load ABI to decode method names where possible
let iface;
try {
  const abi = require('../artifacts/contracts/TokenICO.sol/TokenICO.json').abi;
  iface = new ethers.utils.Interface(abi);
} catch (e) {
  iface = null;
}

function httpGetJson(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let data = '';
        res.on('data', (d) => (data += d));
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            resolve(json);
          } catch (err) {
            reject(new Error(`Bad JSON from ${url}: ${err.message}`));
          }
        });
      })
      .on('error', reject);
  });
}

function postTelegram(text) {
  if (NO_POST) return Promise.resolve('NO_POST=1');
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text, parse_mode: 'HTML', disable_web_page_preview: true });
    const req = https.request(
      {
        hostname: 'api.telegram.org',
        port: 443,
        path: `/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
      },
      (res) => {
        let data = '';
        res.on('data', (d) => (data += d));
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) return resolve(data);
          reject(new Error(`Telegram ${res.statusCode}: ${data}`));
        });
      }
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function decodeMethod(input) {
  if (!input || input === '0x') return 'transfer (native)';
  const sig = input.slice(0, 10);
  if (iface) {
    try {
      const frag = iface.getFunction(sig);
      return frag ? frag.name : sig;
    } catch (_) {
      try {
        const parsed = iface.parseTransaction({ data: input });
        if (parsed && parsed.name) return parsed.name;
      } catch (_) {}
    }
  }
  return sig;
}

function fmtBnB(wei) {
  try { return ethers.utils.formatEther(wei); } catch { return String(wei); }
}

async function run() {
  // Optionally discover deploy block via BscScan
  async function getDeployBlock(addr) {
    const url = `https://api.bscscan.com/api?module=contract&action=getcontractcreation&contractaddresses=${addr}&apikey=${BSCSCAN_API_KEY}`;
    try {
      const json = await httpGetJson(url);
      const item = json && json.result && json.result[0];
      if (item && item.txHash && item.blockNumber) return parseInt(item.blockNumber, 10);
    } catch (_) {}
    return 0;
  }

  let fromBlock = parseInt(process.env.FROM_BLOCK || '0', 10);
  const toBlock = parseInt(process.env.TO_BLOCK || '99999999', 10);
  const pageSize = parseInt(process.env.PAGE_SIZE || '10000', 10);

  if (!process.env.FROM_BLOCK) {
    const deployBlock = await getDeployBlock(CONTRACT_ADDRESS);
    if (deployBlock > 0) fromBlock = deployBlock;
  }

  console.log(`[tx-replay] Address: ${CONTRACT_ADDRESS}`);
  console.log(`[tx-replay] Range: ${fromBlock} -> ${toBlock} (pageSize=${pageSize})`);

  let page = 1;
  let fetched = 0;
  while (true) {
    const url = `https://api.bscscan.com/api?module=account&action=txlist&address=${CONTRACT_ADDRESS}` +
      `&startblock=${fromBlock}&endblock=${toBlock}&page=${page}&offset=${pageSize}&sort=asc&apikey=${BSCSCAN_API_KEY}`;
    const json = await httpGetJson(encodeURI(url));
    if (!json || json.status !== '1') {
      if (json && json.message === 'No transactions found') {
        console.log('[tx-replay] No more transactions.');
        break;
      }
      throw new Error(`BscScan error: ${json && (json.message || json.result)}`);
    }
    const list = json.result || [];
    if (list.length === 0) {
      console.log('[tx-replay] Empty page. Done.');
      break;
    }
    for (const tx of list) {
      // Only those where contract is the recipient (external calls to contract)
      if ((tx.to || '').toLowerCase() !== CONTRACT_ADDRESS.toLowerCase()) continue;
      const ok = tx.isError === '0';
      const method = decodeMethod(tx.input);
      if (PURCHASE_ONLY) {
        // Filter to known purchase entrypoints (including voucher variants)
        const m = String(method).toLowerCase();
        const isPurchase = (
          m.startsWith('buywithusdt') ||
          m.startsWith('buywithusdc') ||
          m.startsWith('buywithbnb') ||
          m.startsWith('buywitheth') ||
          m.startsWith('buywithbtc') ||
          m.startsWith('buywithsol')
        );
        if (!isPurchase) continue;
      }
      const when = new Date(parseInt(tx.timeStamp, 10) * 1000).toISOString();
      const valueBnB = fmtBnB(tx.value);
      const url = `${EXPLORER_TX_URL}${tx.hash}`;
      const status = ok ? '✅' : '❌';
      const text = [
        `Purchase Tx on <b>${NETWORK_NAME}</b> ${status}`,
        `From: <code>${tx.from}</code>`,
        `To: <code>${tx.to}</code>`,
        `Value: <b>${valueBnB}</b> BNB`,
        `Method: <code>${method}</code>`,
        `Nonce: ${tx.nonce}`,
        `GasUsed: ${tx.gasUsed} @ ${tx.gasPrice} wei`,
        `Tx: ${url}`,
        `Time: ${when}`,
      ].join('\n');
      console.log(`[tx-replay] Posting ${tx.hash} (${method})`);
      try {
        const resp = await postTelegram(text);
        fetched += 1;
        if (!NO_POST) await new Promise((r) => setTimeout(r, 250)); // light pacing for Telegram
      } catch (e) {
        console.error(`[tx-replay] Telegram send failed for ${tx.hash}:`, e.message);
      }
    }
    if (list.length < pageSize) break; // last page
    page += 1;
  }
  console.log(`[tx-replay] Done. Posted ${fetched} transactions.`);
}

run().catch((e) => {
  console.error('[tx-replay] Fatal:', e.message || e);
  process.exit(1);
});
