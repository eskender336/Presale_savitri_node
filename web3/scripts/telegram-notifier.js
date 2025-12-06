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
const fs = require('fs');
const path = require('path');

const RPC_WS_URL = process.env.RPC_WS_URL || '';
const NETWORK_RPC_URL = process.env.NETWORK_RPC_URL || '';
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_TOKEN_ICO_ADDRESS || process.env.CONTRACT_ADDRESS;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
// Multi-recipient support and auto-discovery
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID; // single fallback
const TELEGRAM_CHAT_IDS = process.env.TELEGRAM_CHAT_IDS; // comma/space-separated or JSON array
const TELEGRAM_CHAT_IDS_FILE = process.env.TELEGRAM_CHAT_IDS_FILE; // optional path to ids list
const TELEGRAM_RECIPIENTS_FILE = process.env.TELEGRAM_RECIPIENTS_FILE || path.join(__dirname, '../.telegram.recipients.json');
const TELEGRAM_UPDATES_OFFSET_FILE = process.env.TELEGRAM_UPDATES_OFFSET_FILE || path.join(__dirname, '../.telegram.updates.offset');
const NETWORK_NAME = process.env.NETWORK_NAME || 'network';
// Optional override for native coin symbol (e.g., BNB for BSC)
const ENV_NATIVE_SYMBOL = (process.env.NATIVE_SYMBOL || '').trim();
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
// Dynamic pricing support (shared with airdrop)
const TOKEN_PRICE_FILE = process.env.TOKEN_PRICE_FILE || process.env.PRICE_FILE || path.join(__dirname, '../price.config.json');
function loadPerTokenUsdPrice() {
  try {
    const txt = fs.readFileSync(TOKEN_PRICE_FILE, 'utf8');
    const j = JSON.parse(txt);
    const v = Number(j.perTokenUsd ?? j.tokenUsd ?? j.price ?? j.current);
    if (Number.isFinite(v) && v > 0) return v;
  } catch (_) {}
  const envVal = parseFloat(String(process.env.PER_TOKEN_USD_PRICE || process.env.NEXT_PUBLIC_PER_TOKEN_USD_PRICE || '0.2'));
  return Number.isFinite(envVal) && envVal > 0 ? envVal : 0.2;
}
function loadLaunchUsdPrice() {
  const envVal = parseFloat(String(process.env.LAUNCH_USD_PRICE || process.env.NEXT_PUBLIC_LAUNCH_USD_PRICE || process.env.NEXT_PUBLIC_NEXT_PER_TOKEN_USD_PRICE || '0'));
  if (Number.isFinite(envVal) && envVal > 0) return envVal;
  try {
    const txt = fs.readFileSync(TOKEN_PRICE_FILE, 'utf8');
    const j = JSON.parse(txt);
    const v = Number(j.launchUsd ?? j.launchPrice);
    if (Number.isFinite(v) && v > 0) return v;
  } catch (_) {}
  return 0;
}
let PER_TOKEN_USD_PRICE = loadPerTokenUsdPrice();
let LAUNCH_USD_PRICE = loadLaunchUsdPrice();
const BUY_URL = (process.env.BUY_URL || process.env.NEXT_PUBLIC_NEXT_DOMAIN_URL || '').trim();
// Telegram media (GIF) support
let DEFAULT_GIF_URL = '';
try {
  if (BUY_URL) {
    const u = new URL(BUY_URL);
    // Ensure path ends without trailing slash and append public asset path
    const basePath = (u.pathname || '/').replace(/\/+$/, '');
    u.pathname = basePath + '/telegrambot.gif';
    DEFAULT_GIF_URL = u.toString();
  }
} catch (_) { /* noop */ }
const TELEGRAM_GIF_URL = (process.env.TELEGRAM_GIF_URL || DEFAULT_GIF_URL).trim();
const TELEGRAM_INCLUDE_GIF = /^1|true$/i.test(String(process.env.TELEGRAM_INCLUDE_GIF || (TELEGRAM_GIF_URL ? '1' : '')));

if (!CONTRACT_ADDRESS) {
  console.error('Missing required env CONTRACT_ADDRESS (or NEXT_PUBLIC_TOKEN_ICO_ADDRESS)');
  process.exit(1);
}
if (!DRY_RUN && !TELEGRAM_BOT_TOKEN) {
  console.error('Missing TELEGRAM_BOT_TOKEN. Set DRY_RUN=1 for console-only testing.');
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

// ----- Telegram recipients management -----
function parseChatIds(raw) {
  if (!raw) return [];
  const s = String(raw).trim();
  if (!s) return [];
  // Try JSON array first
  if ((s.startsWith('[') && s.endsWith(']')) || (s.startsWith('"') && s.endsWith('"'))) {
    try {
      const arr = JSON.parse(s);
      if (Array.isArray(arr)) return arr.map((x) => String(x).trim()).filter(Boolean);
      return [String(arr).trim()].filter(Boolean);
    } catch (_) { /* fallthrough */ }
  }
  return s.split(/[\s,]+/).map((x) => x.trim()).filter(Boolean);
}

function readJsonSafe(file, def) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch (_) { return def; }
}

function writeJsonSafe(file, obj) {
  try { fs.writeFileSync(file, JSON.stringify(obj, null, 2)); } catch (_) { /* ignore */ }
}

function loadRecipientsFromFile() {
  try {
    const data = fs.readFileSync(TELEGRAM_RECIPIENTS_FILE, 'utf8');
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed)) return parsed.map((x) => String(x).trim()).filter(Boolean);
    if (parsed && Array.isArray(parsed.ids)) return parsed.ids.map((x) => String(x).trim()).filter(Boolean);
  } catch (_) { /* ignore */ }
  return [];
}

function saveRecipientsToFile(ids) {
  const unique = Array.from(new Set(ids.map((x) => String(x).trim()).filter(Boolean)));
  writeJsonSafe(TELEGRAM_RECIPIENTS_FILE, unique);
  return unique;
}

function loadChatIds() {
  let ids = [];
  // 1) Env list
  ids = ids.concat(parseChatIds(TELEGRAM_CHAT_IDS));
  // 2) Single env fallback
  if (!ids.length && TELEGRAM_CHAT_ID) ids.push(String(TELEGRAM_CHAT_ID).trim());
  // 3) External IDs file via env
  if (TELEGRAM_CHAT_IDS_FILE) {
    try {
      const data = fs.readFileSync(TELEGRAM_CHAT_IDS_FILE, 'utf8');
      let more = [];
      try { const parsed = JSON.parse(data); more = Array.isArray(parsed) ? parsed : [parsed]; }
      catch (_) { more = data.split(/\r?\n/); }
      ids = ids.concat(more.map((x) => String(x).trim()).filter(Boolean));
    } catch (e) {
      console.warn('[notifier] Could not read TELEGRAM_CHAT_IDS_FILE:', e && e.message || e);
    }
  }
  // 4) Recipients file
  ids = ids.concat(loadRecipientsFromFile());
  // dedupe
  ids = Array.from(new Set(ids));
  return ids;
}

function httpGetJson(hostname, pathStr) {
  return new Promise((resolve, reject) => {
    const req = https.request({ hostname, port: 443, path: pathStr, method: 'GET' }, (res) => {
      let buf = '';
      res.on('data', (d) => { buf += d; });
      res.on('end', () => {
        try { resolve(JSON.parse(buf)); } catch (e) { reject(new Error('Invalid JSON: ' + buf)); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function discoverRecipientsFromUpdates() {
  if (!TELEGRAM_BOT_TOKEN) return [];
  let offset = 0;
  try { offset = parseInt(fs.readFileSync(TELEGRAM_UPDATES_OFFSET_FILE, 'utf8').trim(), 10) || 0; } catch (_) {}
  // Also allow "chat_member" (e.g., promotions/demotions) for broader coverage
  const allowed = encodeURIComponent(JSON.stringify(["message","channel_post","my_chat_member","chat_member"]));
  const pathStr = `/bot${TELEGRAM_BOT_TOKEN}/getUpdates?timeout=1&allowed_updates=${allowed}` + (offset ? `&offset=${offset}` : '');
  try {
    const resp = await httpGetJson('api.telegram.org', pathStr);
    if (!resp || !resp.ok || !Array.isArray(resp.result)) return [];
    const ids = [];
    let maxUpdateId = offset;
    for (const upd of resp.result) {
      maxUpdateId = Math.max(maxUpdateId, upd.update_id || 0);
      const chats = [];
      if (upd.message && upd.message.chat) chats.push(upd.message.chat);
      if (upd.channel_post && upd.channel_post.chat) chats.push(upd.channel_post.chat);
      if (upd.my_chat_member && upd.my_chat_member.chat) chats.push(upd.my_chat_member.chat);
      if (upd.chat_member && upd.chat_member.chat) chats.push(upd.chat_member.chat);
      for (const ch of chats) {
        if (!ch) continue;
        const id = (typeof ch.id !== 'undefined') ? String(ch.id) : (ch.username ? '@' + ch.username : null);
        if (id) ids.push(id);
      }
    }
    if (maxUpdateId > offset) {
      try { fs.writeFileSync(TELEGRAM_UPDATES_OFFSET_FILE, String(maxUpdateId + 1)); } catch (_) {}
    }
    return Array.from(new Set(ids));
  } catch (e) {
    console.warn('[notifier] getUpdates discovery failed:', e && e.message || e);
    return [];
  }
}

// Keep a runtime list of recipients and ensure we have some
let RECIPIENT_CHAT_IDS = loadChatIds();
async function ensureRecipients() {
  if (RECIPIENT_CHAT_IDS.length) return RECIPIENT_CHAT_IDS;
  const discovered = await discoverRecipientsFromUpdates();
  if (discovered.length) {
    // Merge with any pre-existing IDs and persist
    RECIPIENT_CHAT_IDS = saveRecipientsToFile(Array.from(new Set(discovered.concat(RECIPIENT_CHAT_IDS))));
    console.log(`[notifier] Discovered ${RECIPIENT_CHAT_IDS.length} Telegram recipient(s)`);
  } else {
    console.warn('[notifier] No Telegram recipients found yet. Invite the bot to your group/channel and send a message to register.');
  }
  return RECIPIENT_CHAT_IDS;
}

async function getTokenMeta(provider, address, fallbackSymbol) {
  if (!address || address === ethers.constants.AddressZero) {
    return { symbol: fallbackSymbol || ENV_NATIVE_SYMBOL || 'NATIVE', decimals: 18 };
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
  const targets = (RECIPIENT_CHAT_IDS && RECIPIENT_CHAT_IDS.length)
    ? RECIPIENT_CHAT_IDS
    : (TELEGRAM_CHAT_ID ? [TELEGRAM_CHAT_ID] : []);
  if (DRY_RUN) {
    if (!targets.length) console.log('[notifier][DRY_RUN] No recipients configured.');
    targets.forEach((id) => console.log(`[notifier][DRY_RUN] Would send to ${id}:\n` + text));
    return Promise.resolve();
  }
  const makeReq = (chatId) => new Promise((resolve, reject) => {
    const data = JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', disable_web_page_preview: true });
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
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) return resolve({ chatId, resp });
        reject(new Error(`Telegram API ${res.statusCode} for ${chatId}: ${resp}`));
      });
    });
    req.on('error', (e) => reject(new Error(`Request error for ${chatId}: ${e && e.message || e}`)));
    req.write(data);
    req.end();
  });
  return Promise.allSettled(targets.map(makeReq)).then((results) => {
    const failures = results.filter((r) => r.status === 'rejected');
    if (failures.length) {
      console.warn('[notifier] Some Telegram sends failed:', failures.map((f) => f.reason && f.reason.message || f.reason));
    }
    return results;
  });
}

// Send a GIF (animation) with caption instead of a plain text message
function postToTelegramWithGif(captionText) {
  const targets = (RECIPIENT_CHAT_IDS && RECIPIENT_CHAT_IDS.length)
    ? RECIPIENT_CHAT_IDS
    : (TELEGRAM_CHAT_ID ? [TELEGRAM_CHAT_ID] : []);
  if (DRY_RUN) {
    if (!targets.length) console.log('[notifier][DRY_RUN] No recipients configured.');
    targets.forEach((id) => console.log(`[notifier][DRY_RUN] Would send GIF to ${id}: ${TELEGRAM_GIF_URL}\nCaption:\n` + captionText));
    return Promise.resolve();
  }
  if (!TELEGRAM_GIF_URL) {
    // Fallback to text if no GIF URL configured
    return postToTelegram(captionText);
  }
  const makeReq = (chatId) => new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      chat_id: chatId,
      animation: TELEGRAM_GIF_URL, // Telegram fetches by URL
      caption: captionText,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    });
    const options = {
      hostname: 'api.telegram.org',
      port: 443,
      path: `/bot${TELEGRAM_BOT_TOKEN}/sendAnimation`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }
    };
    const req = https.request(options, (res) => {
      let resp = '';
      res.on('data', (d) => { resp += d; });
      res.on('end', () => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) return resolve({ chatId, resp });
        reject(new Error(`Telegram API ${res.statusCode} for ${chatId}: ${resp}`));
      });
    });
    req.on('error', (e) => reject(new Error(`Request error for ${chatId}: ${e && e.message || e}`)));
    req.write(payload);
    req.end();
  });
  return Promise.allSettled(targets.map(makeReq)).then((results) => {
    const failures = results.filter((r) => r.status === 'rejected');
    if (failures.length) {
      console.warn('[notifier] Some Telegram GIF sends failed:', failures.map((f) => f.reason && f.reason.message || f.reason));
    }
    return results;
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

  // Resolve a sensible default native symbol from chainId, overridable via env
  function nativeSymbolFor(chainId) {
    switch (Number(chainId)) {
      case 56: case 97: return 'BNB';
      case 1: case 5: case 11155111: case 17000: return 'ETH';
      case 137: case 80002: return 'MATIC';
      case 42161: return 'ETH';
      case 8453: case 84532: return 'ETH';
      default: return 'NATIVE';
    }
  }
  let DEFAULT_NATIVE_SYMBOL = 'NATIVE';
  try {
    const nw = await provider.getNetwork();
    DEFAULT_NATIVE_SYMBOL = ENV_NATIVE_SYMBOL || nativeSymbolFor(nw.chainId);
  } catch (_) {
    DEFAULT_NATIVE_SYMBOL = ENV_NATIVE_SYMBOL || 'NATIVE';
  }

  // Ensure recipients are known (auto-discover via getUpdates if none configured)
  try { await ensureRecipients(); } catch (_) {}
  // Periodically re-scan for newly invited chats (e.g., every 60s)
  setInterval(async () => {
    try {
      const before = new Set(RECIPIENT_CHAT_IDS);
      const newly = await discoverRecipientsFromUpdates();
      if (newly.length) {
        const merged = Array.from(new Set([...before, ...newly]));
        if (merged.length !== RECIPIENT_CHAT_IDS.length) {
          RECIPIENT_CHAT_IDS = saveRecipientsToFile(merged);
          console.log(`[notifier] Recipients updated (${RECIPIENT_CHAT_IDS.length} total)`);
        }
      }
    } catch (e) {
      LOG_VERBOSE && console.warn('[notifier] Periodic discovery error:', e && e.message || e);
    }
  }, 60000);

  // Cache sale token meta for formatting tokensBought
  let saleTokenMeta = { symbol: 'SALE', decimals: 18 };
  try {
    const saleTokenAddr = await contract.saleToken();
    saleTokenMeta = await getTokenMeta(provider, saleTokenAddr, 'SALE');
  } catch (_) {
    // ignore; keep default
  }

  const PRICE_CACHE_TTL_MS = parseInt(process.env.PRICE_CACHE_TTL_MS || '60000', 10);
  let priceCache = {
    lastFetched: 0,
    initial: null,
    initialBn: null,
    public: null,
    publicBn: null,
    waitlist: null,
    waitlistBn: null,
  };

  async function refreshPricing({ force = false } = {}) {
    const nowMs = Date.now();
    if (!force && priceCache.lastFetched && nowMs - priceCache.lastFetched < PRICE_CACHE_TTL_MS) {
      return priceCache;
    }
    try {
      const [
        initial,
        increment,
        saleStart,
        waitlistInterval,
        publicInterval,
      ] = await Promise.all([
        contract.initialUsdtPricePerToken(),
        contract.usdtPriceIncrement(),
        contract.saleStartTime(),
        contract.waitlistInterval(),
        contract.publicInterval(),
      ]);

      const nowBn = ethers.BigNumber.from(Math.floor(nowMs / 1000).toString());
      const initialFloat = Number(ethers.utils.formatUnits(initial, 6));

      const computePrice = (intervalBn) => {
        if (saleStart.eq(0) || nowBn.lte(saleStart) || !intervalBn || intervalBn.eq(0)) {
          return { bn: initial, float: initialFloat };
        }
        const elapsed = nowBn.sub(saleStart);
        if (elapsed.lte(0)) return { bn: initial, float: initialFloat };
        const increments = elapsed.div(intervalBn);
        const priceBn = initial.add(increment.mul(increments));
        const priceFloat = Number(ethers.utils.formatUnits(priceBn, 6));
        return { bn: priceBn, float: priceFloat };
      };

      const publicPrice = computePrice(publicInterval);
      const waitlistPrice = computePrice(waitlistInterval);

      priceCache = {
        lastFetched: nowMs,
        initial: Number.isFinite(initialFloat) ? initialFloat : null,
        initialBn: initial,
        public: Number.isFinite(publicPrice.float) ? publicPrice.float : null,
        publicBn: publicPrice.bn,
        waitlist: Number.isFinite(waitlistPrice.float) ? waitlistPrice.float : null,
        waitlistBn: waitlistPrice.bn,
      };
    } catch (err) {
      LOG_VERBOSE && console.warn('[notifier] Failed to refresh pricing:', err && err.message || err);
      priceCache.lastFetched = nowMs;
    }
    return priceCache;
  }

  const mode = provider._websocket ? 'websocket' : 'http-polling';
  console.log(`[notifier] Connected (${mode}). Subscribing to TokensPurchased on ${NETWORK_NAME} at ${CONTRACT_ADDRESS}`);

  async function handlePurchase(buyer, paymentMethod, amountPaid, tokensBought, timestamp, event) {
    try {
      const paymentMeta = await getTokenMeta(provider, paymentMethod, DEFAULT_NATIVE_SYMBOL);
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
      const pricing = await refreshPricing({ force: true });
      const launchPriceUsd = Number.isFinite(pricing.initial) ? pricing.initial : (Number.isFinite(LAUNCH_USD_PRICE) ? LAUNCH_USD_PRICE : null);
      const currentPriceUsd = Number.isFinite(pricing.public) ? pricing.public : (Number.isFinite(PER_TOKEN_USD_PRICE) ? PER_TOKEN_USD_PRICE : null);
      if (Number.isFinite(pricing.public)) PER_TOKEN_USD_PRICE = pricing.public;
      if (Number.isFinite(pricing.initial)) LAUNCH_USD_PRICE = pricing.initial;

      // Compute USD totals if price provided
      let totalUsd = null;
      if (Number.isFinite(currentPriceUsd) && currentPriceUsd > 0) {
        try {
          const boughtFloat = parseFloat(bought.replace(/,/g, ''));
          if (!Number.isNaN(boughtFloat)) totalUsd = boughtFloat * currentPriceUsd;
        } catch (_) { /* noop */ }
      }

      // Telegram message in the requested style
      const lines = [];
      lines.push('🚨 Community Sale Purchase Alert!🚨');
      lines.push('');
      lines.push(`  Amount: <b>${paid}</b> ${paymentMeta.symbol} 💥`);
      lines.push(`  Coin Amount: <b>${bought}</b> ${TOKEN_SYMBOL} 💰`);
      if (totalUsd !== null) lines.push(`  Purchase Total: $${totalUsd.toFixed(2)} 💵`);
      if (Number.isFinite(currentPriceUsd)) lines.push(`  Price Per Coin: $${currentPriceUsd.toFixed(3)} 📈`);
      else if (PER_TOKEN_USD_PRICE) lines.push(`  Price Per Coin: $${PER_TOKEN_USD_PRICE.toFixed(3)} 📈`);
      if (Number.isFinite(launchPriceUsd)) lines.push(`  Launch Price: $${launchPriceUsd.toFixed(3)} 🚀`);
      lines.push('');
      if (BUY_URL) {
        lines.push(`  🔵 Buy ${TOKEN_SYMBOL}: ${BUY_URL}`);
      } else {
        lines.push(`  🔵 Buy ${TOKEN_SYMBOL}:`);
      }
      // No Tx/Time lines per request

      const text = lines.join('\n');

      if (TELEGRAM_INCLUDE_GIF) {
        await postToTelegramWithGif(text);
      } else {
        await postToTelegram(text);
      }
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
