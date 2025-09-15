/*
  Real-time Telegram notifier for TokenICO TokensPurchased events.

  Env vars (in web3/.env*):
    - RPC_WS_URL: WebSocket RPC endpoint (e.g., wss://...)
    - CONTRACT_ADDRESS: Deployed TokenICO address
    - TELEGRAM_BOT_TOKEN: Bot token from @BotFather
    - TELEGRAM_CHAT_ID: Target chat/channel ID
    - NETWORK_NAME: Optional label for messages (e.g., bsc, ethereum)
    - NATIVE_SYMBOL: Optional, symbol for native coin (default: NATIVE)
    - EXPLORER_TX_URL: Optional, prefix for tx links (e.g., https://bscscan.com/tx/)
*/

require('dotenv').config({ path: __dirname + '/../.env' });
// Also load project-level env (for NEXT_PUBLIC_ vars like prices/domain), if present
try { require('dotenv').config({ path: __dirname + '/../../.env.local' }); } catch (_) {}
const { ethers } = require('ethers');
const https = require('https');
const path = require('path');

const RPC_WS_URL = process.env.RPC_WS_URL || '';
const NETWORK_RPC_URL = process.env.NETWORK_RPC_URL || '';
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_TOKEN_ICO_ADDRESS || process.env.CONTRACT_ADDRESS;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const NETWORK_NAME = process.env.NETWORK_NAME || 'network';
const NATIVE_SYMBOL = process.env.NATIVE_SYMBOL || 'NATIVE';
const EXPLORER_TX_URL = process.env.EXPLORER_TX_URL || '';
const BLOCK_CONFIRMATIONS = parseInt(process.env.BLOCK_CONFIRMATIONS || '2', 10);
const POLL_MAX_BLOCK_SPAN = parseInt(process.env.POLL_MAX_BLOCK_SPAN || '1', 10); // public BSC RPCs are strict
const POLL_MIN_DELAY_MS = parseInt(process.env.POLL_MIN_DELAY_MS || '750', 10); // rate-limit friendly
const DRY_RUN = /^1|true$/i.test(String(process.env.DRY_RUN || ''));
const FORCE_HTTP = /^1|true$/i.test(String(process.env.FORCE_HTTP || ''));
const LOG_VERBOSE = /^1|true$/i.test(String(process.env.LOG_VERBOSE || ''));
const LOG_EVENTS = /^1|true$/i.test(String(process.env.LOG_EVENTS || ''));
const POLLING_INTERVAL_MS = parseInt(process.env.POLLING_INTERVAL_MS || '1000', 10);
const WS_PROBE_TIMEOUT_MS = parseInt(process.env.WS_PROBE_TIMEOUT_MS || '12000', 10);
const WAIT_TIMEOUT_MS = parseInt(process.env.WAIT_TIMEOUT_MS || '60000', 10);

// Optional presentation/config vars
const TOKEN_SYMBOL = (process.env.TOKEN_SYMBOL || process.env.NEXT_PUBLIC_TOKEN_SYMBOL || '').trim() || 'SAV';
const PER_TOKEN_USD_PRICE = parseFloat(String(process.env.PER_TOKEN_USD_PRICE || process.env.NEXT_PUBLIC_PER_TOKEN_USD_PRICE || '0')) || 0;
// Prefer explicit LAUNCH price; otherwise use NEXT stage price if provided
const LAUNCH_USD_PRICE = parseFloat(String(process.env.LAUNCH_USD_PRICE || process.env.NEXT_PUBLIC_LAUNCH_USD_PRICE || process.env.NEXT_PUBLIC_NEXT_PER_TOKEN_USD_PRICE || '0')) || 0;
const BUY_URL = (process.env.BUY_URL || process.env.NEXT_PUBLIC_NEXT_DOMAIN_URL || '').trim();

if (!CONTRACT_ADDRESS) {
  console.error('Missing required env CONTRACT_ADDRESS (or NEXT_PUBLIC_TOKEN_ICO_ADDRESS)');
  process.exit(1);
}
if (!DRY_RUN && (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID)) {
  console.error('Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID. Set DRY_RUN=1 for console-only testing.');
  process.exit(1);
}
if (!RPC_WS_URL && !NETWORK_RPC_URL) {
  console.error('Missing RPC endpoint. Provide RPC_WS_URL (ws:// or wss://) or NETWORK_RPC_URL (ws://, wss:// or http://)');
  process.exit(1);
}

// Load ABI from artifacts
let abi;
try {
  // Hardhat artifacts path relative to this script
  // eslint-disable-next-line import/no-dynamic-require, global-require
  abi = require('../artifacts/contracts/TokenICO.sol/TokenICO.json').abi;
} catch (e) {
  console.error('Unable to load ABI from artifacts. Did you run `npm run compile` in web3/?', e.message);
  process.exit(1);
}

// Minimal ERC20 interface for decimals/symbol
const erc20Abi = [
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)'
];

const tokenMetaCache = new Map();

async function getTokenMeta(provider, address, fallbackSymbol) {
  if (!address || address === ethers.constants.AddressZero) {
    return { symbol: fallbackSymbol || NATIVE_SYMBOL, decimals: 18 };
  }
  const key = address.toLowerCase();
  if (tokenMetaCache.has(key)) return tokenMetaCache.get(key);
  try {
    const c = new ethers.Contract(address, erc20Abi, provider);
    const [decimals, symbol] = await Promise.all([
      c.decimals().catch(() => 18),
      c.symbol().catch(() => 'TOKEN')
    ]);
    const meta = { symbol, decimals: Number(decimals) };
    tokenMetaCache.set(key, meta);
    return meta;
  } catch (err) {
    const meta = { symbol: 'TOKEN', decimals: 18 };
    tokenMetaCache.set(key, meta);
    return meta;
  }
}

function formatAmount(amountBN, decimals) {
  try {
    return ethers.utils.commify(ethers.utils.formatUnits(amountBN, decimals));
  } catch (_) {
    // Fallback if decimals is weird
    return amountBN.toString();
  }
}

function postToTelegram(text) {
  if (DRY_RUN) {
    console.log('[notifier][DRY_RUN] Would send to Telegram:\n' + text);
    return Promise.resolve();
  }
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

async function run() {
  let provider;
  const isWsUrl = (u) => typeof u === 'string' && (u.startsWith('ws://') || u.startsWith('wss://'));
  const isHttpUrl = (u) => typeof u === 'string' && (u.startsWith('http://') || u.startsWith('https://'));
  const rpcWsLooksValid = isWsUrl(RPC_WS_URL);
  const netWsLooksValid = isWsUrl(NETWORK_RPC_URL);

  async function withTimeout(promise, ms, label) {
    let to;
    const timeout = new Promise((_, rej) => { to = setTimeout(() => rej(new Error(`${label} timed out after ${ms}ms`)), ms); });
    try {
      const res = await Promise.race([promise, timeout]);
      clearTimeout(to);
      return res;
    } catch (e) {
      clearTimeout(to);
      throw e;
    }
  }

  async function tryWebSocket(url, label) {
    console.log(`[notifier] Trying WebSocket provider from ${label}`);
    const wsProvider = new ethers.providers.WebSocketProvider(url);
    try {
      // Force an initial request to verify the WS endpoint is actually an EVM JSON-RPC
      await withTimeout(wsProvider.getBlockNumber(), WS_PROBE_TIMEOUT_MS, `${label} getBlockNumber`);
      console.log(`[notifier] Using WebSocket provider from ${label}`);
      if (wsProvider._websocket) {
        wsProvider._websocket.on('open', () => LOG_VERBOSE && console.log('[notifier] WS open'));
        wsProvider._websocket.on('error', (e) => console.warn('[notifier] WS error during probe:', e && e.message || e));
      }
      return wsProvider;
    } catch (e) {
      // Clean up socket if it opened
      try {
        if (wsProvider && wsProvider._websocket && typeof wsProvider._websocket.close === 'function') {
          wsProvider._websocket.close();
        }
      } catch (_) { /* noop */ }
      console.warn(`[notifier] WS probe failed for ${label}:`, e && (e.message || e));
      throw e;
    }
  }

  // Decide and build provider with graceful fallback
  try {
    if (!FORCE_HTTP) {
      if (rpcWsLooksValid) {
        provider = await tryWebSocket(RPC_WS_URL, 'RPC_WS_URL');
      } else if (netWsLooksValid) {
        provider = await tryWebSocket(NETWORK_RPC_URL, 'NETWORK_RPC_URL');
      }
    }
    if (!provider) {
      const httpUrl = isHttpUrl(NETWORK_RPC_URL) ? NETWORK_RPC_URL : NETWORK_RPC_URL || '';
      if (!httpUrl) throw new Error('No HTTP URL provided in NETWORK_RPC_URL');
      console.log('[notifier] Using HTTP JSON-RPC provider from NETWORK_RPC_URL');
      provider = new ethers.providers.JsonRpcProvider(httpUrl);
      provider.polling = true;
      provider.pollingInterval = POLLING_INTERVAL_MS;
    }
  } catch (e) {
    console.warn(`[notifier] Provider setup failed: ${e.message}. Falling back to HTTP polling.`);
    const httpUrl = isHttpUrl(NETWORK_RPC_URL) ? NETWORK_RPC_URL : NETWORK_RPC_URL || '';
    provider = new ethers.providers.JsonRpcProvider(httpUrl);
    provider.polling = true;
    provider.pollingInterval = POLLING_INTERVAL_MS;
  }

  const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, provider);

  // Cache sale token meta for formatting tokensBought
  let saleTokenMeta = { symbol: 'SALE', decimals: 18 };
  try {
    const saleTokenAddr = await contract.saleToken();
    saleTokenMeta = await getTokenMeta(provider, saleTokenAddr, 'SALE');
  } catch (_) {
    // ignore; keep default
  }

  const mode = provider._websocket ? 'websocket' : 'http-polling';
  console.log(`[notifier] Connected (${mode}). Subscribing to TokensPurchased on ${NETWORK_NAME} at ${CONTRACT_ADDRESS}`);

  async function handlePurchase(buyer, paymentMethod, amountPaid, tokensBought, timestamp, event) {
    try {
      const paymentMeta = await getTokenMeta(provider, paymentMethod, NATIVE_SYMBOL);
      const paid = formatAmount(amountPaid, paymentMeta.decimals);
      const bought = formatAmount(tokensBought, saleTokenMeta.decimals);
      const when = timestamp && timestamp.toNumber ? new Date(timestamp.toNumber() * 1000) : new Date();
      const txUrl = EXPLORER_TX_URL ? `${EXPLORER_TX_URL}${event.transactionHash}` : event.transactionHash;
      if (LOG_EVENTS) {
        console.log('[notifier][TokensPurchased]', {
          tx: event.transactionHash,
          block: event.blockNumber,
          buyer,
          paymentMethod,
          amountPaid: amountPaid.toString(),
          tokensBought: tokensBought.toString(),
          time: when.toISOString(),
          paymentSymbol: paymentMeta.symbol,
          saleSymbol: saleTokenMeta.symbol,
        });
      }
      // Compute USD totals if price provided
      let totalUsd = null;
      if (PER_TOKEN_USD_PRICE && !Number.isNaN(PER_TOKEN_USD_PRICE)) {
        try {
          const boughtFloat = parseFloat(bought.replace(/,/g, ''));
          if (!Number.isNaN(boughtFloat)) totalUsd = boughtFloat * PER_TOKEN_USD_PRICE;
        } catch (_) { /* noop */ }
      }

      // Telegram message in the requested style
      const lines = [];
      lines.push('🚨 Presale Purchase Alert!🚨');
      lines.push('');
      lines.push(`  Amount: <b>${paid}</b> ${paymentMeta.symbol} 💥`);
      lines.push(`  Coin Amount: <b>${bought}</b> ${TOKEN_SYMBOL} 💰`);
      if (totalUsd !== null) lines.push(`  Purchase Total: $${totalUsd.toFixed(2)} 💵`);
      if (PER_TOKEN_USD_PRICE) lines.push(`  Price Per Coin: $${PER_TOKEN_USD_PRICE.toFixed(3)} 📈`);
      if (LAUNCH_USD_PRICE) lines.push(`  Launch Price: $${LAUNCH_USD_PRICE.toFixed(3)} 🚀`);
      lines.push('');
      if (BUY_URL) {
        lines.push(`  🔵 Buy ${TOKEN_SYMBOL}: ${BUY_URL}`);
      } else {
        lines.push(`  🔵 Buy ${TOKEN_SYMBOL}:`);
      }
      // No Tx/Time lines per request

      const text = lines.join('\n');

      await postToTelegram(text);
      console.log(`[notifier] Sent: ${event.transactionHash}`);
    } catch (err) {
      console.error('[notifier] Handler error:', err);
    }
  }

  const isWs = !!(provider._websocket && provider._websocket.on);
  console.log('isWs', isWs);
  const filter = contract.filters.TokensPurchased();

  if (isWs) {
    const seenWs = new Set();
    contract.on(filter, async (buyer, paymentMethod, amountPaid, tokensBought, timestamp, event) => {
      try {
        // Wait for BLOCK_CONFIRMATIONS before notifying (confirmed only)
        if (BLOCK_CONFIRMATIONS > 0) {
          try {
            await withTimeout(provider.waitForTransaction(event.transactionHash, BLOCK_CONFIRMATIONS), WAIT_TIMEOUT_MS, 'waitForTransaction');
          } catch (timeoutErr) {
            console.warn('[notifier] waitForTransaction timeout; proceeding without full confirmations');
          }
        }
        const key = `${event.transactionHash}-${event.logIndex}`;
        if (seenWs.has(key)) return;
        seenWs.add(key);
        if (LOG_VERBOSE) console.log('[notifier] WS event received at block', event.blockNumber);
        await handlePurchase(buyer, paymentMethod, amountPaid, tokensBought, timestamp, event);
      } catch (err) {
        console.error('[notifier] WS handler error:', err);
      }
    });

    // Basic reconnect strategy: exit on close; use a process manager to restart
    const ws = provider._websocket;
    ws.on('close', (code) => {
      console.error(`[notifier] WS closed (${code}). Exiting for restart.`);
      process.exit(1);
    });
    ws.on('error', (err) => {
      console.error('[notifier] WS error:', err);
      process.exit(1);
    });
  } else {
    console.log(`[notifier] Using HTTP polling mode (interval ${provider.pollingInterval}ms)`);
    const seen = new Set();
    let lastProcessed = Math.max(0, (await provider.getBlockNumber()) - BLOCK_CONFIRMATIONS - 1);

    function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

    provider.on('block', async (bn) => {
      if (LOG_VERBOSE) console.log(`[notifier] New block ${bn}`);
      const target = bn - BLOCK_CONFIRMATIONS;
      if (target <= lastProcessed) return;

      let from = lastProcessed + 1;
      while (from <= target) {
        const span = Math.max(1, POLL_MAX_BLOCK_SPAN);
        const to = Math.min(from + span - 1, target);
        if (LOG_VERBOSE) console.log(`[notifier] Query range ${from}-${to}`);
        let attempt = 0;
        let success = false;
        while (!success) {
          try {
            const events = await contract.queryFilter(filter, from, to);
            for (const ev of events) {
              const key = `${ev.transactionHash}-${ev.logIndex}`;
              if (seen.has(key)) continue;
              seen.add(key);
              const [buyer, paymentMethod, amountPaid, tokensBought, timestamp] = ev.args;
              await handlePurchase(buyer, paymentMethod, amountPaid, tokensBought, timestamp, ev);
            }
            success = true;
          } catch (e) {
            // Handle BSC public RPC rate limit: -32005 limit exceeded
            const isLimit = e && (e.code === -32005 || /limit exceeded/i.test(String(e.body || e.message)));
            if (isLimit) {
              attempt += 1;
              const backoff = Math.min(5000, POLL_MIN_DELAY_MS * attempt);
              console.warn(`[notifier] Rate limited fetching ${from}-${to}. Backing off ${backoff}ms (attempt ${attempt})`);
              await sleep(backoff);
              continue; // retry same window
            }
            console.error(`[notifier] Polling error for range ${from}-${to}:`, e);
            // On unexpected error, break to avoid tight loop; will retry next block tick
            break;
          }
        }
        if (!success) {
          // Could not fetch this window after retries; exit loop and try later
          break;
        }
        // Advance window
        from = to + 1;
        // Friendly delay between windows
        await sleep(POLL_MIN_DELAY_MS);
      }
      // Update lastProcessed only up to what we actually covered
      lastProcessed = Math.max(lastProcessed, Math.min(target, from - 1));
    });
  }
}

run().catch((e) => {
  console.error('[notifier] Fatal:', e);
  process.exit(1);
});
