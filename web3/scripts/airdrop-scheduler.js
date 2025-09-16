// Scheduled Airdrop sender
// - Reads wallet -> total token amounts from CSV
// - Splits into random chunks (<= MAX_CHUNK_TOKENS, default 5000)
// - Sends transfers with random delays, slower at night (Asia/Almaty), faster from 09:00
// - Persists progress in a JSON state file so it can resume
//
// Usage:
//   node web3/scripts/airdrop-scheduler.js [--live]
//
// Env (web3/.env):
//   NETWORK_RPC_URL or RPC_WS_URL   - RPC endpoint
//   PRIVATE_KEY                     - Sender private key (must hold SAV)
//   SALE_TOKEN_ADDRESS              - ERC20 token address (optional)
//   ICO_ADDRESS or NEXT_PUBLIC_TOKEN_ICO_ADDRESS - If set and SALE_TOKEN_ADDRESS not provided, will read saleToken() from ICO
//   CSV_PATH                        - Path to CSV (default ../../data/token-balances.csv)
//   AIRDROP_STATE_FILE             - State file path (default ./.airdrop.state.json)
//   MAX_CHUNK_TOKENS               - Max tokens per tx (default 5000)
//   MIN_CHUNK_TOKENS               - Min tokens per tx (default 100)
//   CHUNK_PER_TX_USD               - Optional: if set and PER_TOKEN_USD_PRICE>0, MAX_CHUNK_TOKENS = floor(CHUNK_PER_TX_USD / PER_TOKEN_USD_PRICE)
//   CONFIRMATIONS                  - Wait N confirmations (default 0)
//   DRY_RUN=1                      - Log only, do not send
//
require('dotenv').config({ path: __dirname + '/../.env' });
// Also load project-level env (for NEXT_PUBLIC_ vars like prices/domain), if present
try { require('dotenv').config({ path: __dirname + '/../../.env.local' }); } catch (_) {}
const fs = require('fs');
const path = require('path');
const https = require('https');
const { ethers } = require('ethers');

const RPC = process.env.RPC_WS_URL || process.env.NETWORK_RPC_URL;
const PK = process.env.PRIVATE_KEY;
const ICO_ADDR = process.env.NEXT_PUBLIC_TOKEN_ICO_ADDRESS || process.env.ICO_ADDRESS || '';
const TOKEN_ADDR_ENV = process.env.SALE_TOKEN_ADDRESS || process.env.SAV_ADDRESS || process.env.NEXT_PUBLIC_SAV_ADDRESS || '';
const DRY_RUN = /^1|true|yes$/i.test(String(process.env.DRY_RUN || ''));
const AUTO_WITHDRAW = /^1|true|yes$/i.test(String(process.env.AUTO_WITHDRAW || ''));
const EXPLORER_TX_URL = process.env.EXPLORER_TX_URL || '';
const CONFIRMATIONS = Math.max(0, parseInt(process.env.CONFIRMATIONS || '0', 10));
const CSV_PATH = process.env.CSV_PATH || path.join(__dirname, '../../data/token-balances.csv');
const STATE_FILE = process.env.AIRDROP_STATE_FILE || path.join(__dirname, '.airdrop.state.json');
const FAST_START_MS = process.env.FAST_START_MS ? Math.max(0, parseInt(process.env.FAST_START_MS, 10)) : null;
const AIRDROP_DURATION_DAYS = process.env.AIRDROP_DURATION_DAYS ? Math.max(1, parseInt(process.env.AIRDROP_DURATION_DAYS, 10)) : null; // if set, pace over N days
const DAILY_TX_CAP = process.env.DAILY_TX_CAP ? Math.max(1, parseInt(process.env.DAILY_TX_CAP, 10)) : null; // hard cap override
const TOKEN_SYMBOL = (process.env.TOKEN_SYMBOL || process.env.NEXT_PUBLIC_TOKEN_SYMBOL || 'SAV').trim() || 'SAV';
// Dynamic pricing support
const TOKEN_PRICE_FILE = process.env.TOKEN_PRICE_FILE || process.env.PRICE_FILE || path.join(__dirname, '../price.config.json');
function loadPerTokenUsdPrice() {
  // Prefer file value if present
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
  // Optional, fallback to NEXT stage price if given
  const envVal = parseFloat(String(process.env.LAUNCH_USD_PRICE || process.env.NEXT_PUBLIC_LAUNCH_USD_PRICE || process.env.NEXT_PUBLIC_NEXT_PER_TOKEN_USD_PRICE || '0'));
  if (Number.isFinite(envVal) && envVal > 0) return envVal;
  // Try file
  try {
    const txt = fs.readFileSync(TOKEN_PRICE_FILE, 'utf8');
    const j = JSON.parse(txt);
    const v = Number(j.launchUsd ?? j.launchPrice);
    if (Number.isFinite(v) && v > 0) return v;
  } catch (_) {}
  return 0;
}
// Hardcoded prices as requested
let PER_TOKEN_USD_PRICE = 0.2; // USD per token
let LAUNCH_USD_PRICE = 0.2;    // Launch price USD per token
const BUY_URL = (process.env.BUY_URL || process.env.NEXT_PUBLIC_NEXT_DOMAIN_URL || '').trim();
// Derive chunk tokens from USD, if requested
const CHUNK_PER_TX_USD = parseFloat(String(process.env.CHUNK_PER_TX_USD || process.env.MAX_CHUNK_USD || ''));
let MAX_CHUNK_TOKENS = Math.max(1, parseInt(process.env.MAX_CHUNK_TOKENS || '5000', 10));
let MIN_CHUNK_TOKENS = Math.max(1, parseInt(process.env.MIN_CHUNK_TOKENS || '100', 10));
if (MIN_CHUNK_TOKENS > MAX_CHUNK_TOKENS) MIN_CHUNK_TOKENS = MAX_CHUNK_TOKENS;
// Telegram
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '';
const TELEGRAM_CHAT_IDS = process.env.TELEGRAM_CHAT_IDS || '';
// Optional recipient sources for autodiscovery (shared with notifier style)
const TELEGRAM_CHAT_IDS_FILE = process.env.TELEGRAM_CHAT_IDS_FILE || '';
const TELEGRAM_RECIPIENTS_FILE = process.env.TELEGRAM_RECIPIENTS_FILE || path.join(__dirname, '../.telegram.recipients.json');
let DEFAULT_GIF_URL = '';
try {
  if (BUY_URL) {
    const u = new URL(BUY_URL);
    const basePath = (u.pathname || '/').replace(/\/+$/, '');
    u.pathname = basePath + '/telegrambot.gif';
    DEFAULT_GIF_URL = u.toString();
  }
} catch (_) { /* noop */ }
const TELEGRAM_GIF_URL = (process.env.TELEGRAM_GIF_URL || DEFAULT_GIF_URL).trim();
const TELEGRAM_INCLUDE_GIF = /^1|true$/i.test(String(process.env.TELEGRAM_INCLUDE_GIF || (TELEGRAM_GIF_URL ? '1' : '')));
const AIRDROP_NOTIFY = /^1|true|yes$/i.test(String(process.env.AIRDROP_NOTIFY || '1'));
// Gas overrides (BSC sometimes needs explicit gas limit)
const TX_GAS_LIMIT = Math.max(50000, parseInt(process.env.TX_GAS_LIMIT || '120000', 10));
const GAS_PRICE_GWEI = parseFloat(String(process.env.GAS_PRICE_GWEI || '0'));
const FORCE_LEGACY_TX = /^1|true|yes$/i.test(String(process.env.FORCE_LEGACY_TX || '0'));

// Delay profile overrides (random delay between txs)
const DELAY_DAY_MIN_SEC = Math.max(1, parseInt(process.env.DELAY_DAY_MIN_SEC || '60', 10));
const DELAY_DAY_MAX_SEC = Math.max(DELAY_DAY_MIN_SEC, parseInt(process.env.DELAY_DAY_MAX_SEC || '180', 10));
const DELAY_NIGHT_MIN_SEC = Math.max(1, parseInt(process.env.DELAY_NIGHT_MIN_SEC || '60', 10));
const DELAY_NIGHT_MAX_SEC = Math.max(DELAY_NIGHT_MIN_SEC, parseInt(process.env.DELAY_NIGHT_MAX_SEC || '240', 10));

if (!RPC) throw new Error('Missing RPC (RPC_WS_URL or NETWORK_RPC_URL)');
if (!PK) throw new Error('Missing PRIVATE_KEY');

const erc20Abi = [
  'function transfer(address to, uint256 amount) returns (bool)',
  'function balanceOf(address) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)'
];
const icoAbi = require('../artifacts/contracts/TokenICO.sol/TokenICO.json').abi;

// Helpers
function nowAstana() {
  // Asia/Almaty is the canonical tz for Astana
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Almaty',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
  }).formatToParts(new Date()).reduce((acc, p) => (acc[p.type] = p.value, acc), {});
  const iso = `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}+06:00`; // UTC+6
  const ymd = `${parts.year}-${parts.month}-${parts.day}`;
  return { hour: parseInt(parts.hour, 10), iso, ymd };
}

function randInt(minIncl, maxIncl) {
  return Math.floor(Math.random() * (maxIncl - minIncl + 1)) + minIncl;
}

// Delay profile: return [minSec, maxSec] based on Astana hour
function delayWindowByHour(hour) {
  // Night (before 09:00 Astana) vs Day (09:00+), values configurable via env
  if (hour >= 0 && hour < 9) return [DELAY_NIGHT_MIN_SEC, DELAY_NIGHT_MAX_SEC];
  return [DELAY_DAY_MIN_SEC,   DELAY_DAY_MAX_SEC];
}

function nextDelayMs() {
  const { hour, iso } = nowAstana();
  const [minS, maxS] = delayWindowByHour(hour);
  const sec = randInt(minS, maxS);
  console.log(`[schedule] ${iso} Asia/Almaty -> next in ${sec}s`);
  return sec * 1000;
}

function msUntilNextAstanaMidnight() {
  const n = new Date();
  // compute Asia/Almaty midnight by constructing date string and parsing with that tz offset
  const { ymd } = nowAstana();
  // Next day 00:00 in +06:00
  const d = new Date(`${ymd}T00:00:00+06:00`);
  const next = new Date(d.getTime() + 24 * 60 * 60 * 1000);
  const ms = next.getTime() - Date.now();
  return Math.max(60 * 1000, ms); // at least 1 minute
}

function loadState() {
  try { return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')); } catch (_) { return { totals: {}, remaining: {}, decimals: null, token: null, cursor: 0, sentToday: 0, dayKey: null, estDailyBudget: null }; }
}
function saveState(state) {
  const json = JSON.stringify(state, (key, value) =>
    typeof value === 'bigint' ? value.toString() : value, 2);
  fs.writeFileSync(STATE_FILE, json);
}

function parseCsvTotals(csvText) {
  const lines = csvText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const header = lines.shift();
  const res = {};
  for (const line of lines) {
    const [rawAddr, rawAmt] = line.split(',').map(s => (s || '').trim());
    if (!rawAddr || !rawAmt) continue;
    if (!ethers.utils.isAddress(rawAddr)) {
      console.warn('[csv] Skip invalid address:', rawAddr);
      continue;
    }
    const amt = BigInt(rawAmt);
    res[ethers.utils.getAddress(rawAddr)] = (res[ethers.utils.getAddress(rawAddr)] || 0n) + amt;
  }
  return res; // number of whole tokens per address
}

async function ensureTokenContract(wallet) {
  if (TOKEN_ADDR_ENV) {
    return new ethers.Contract(TOKEN_ADDR_ENV, erc20Abi, wallet);
  }
  if (!ICO_ADDR) throw new Error('Provide SALE_TOKEN_ADDRESS or ICO_ADDRESS/NEXT_PUBLIC_TOKEN_ICO_ADDRESS');
  const ico = new ethers.Contract(ICO_ADDR, icoAbi, wallet);
  const t = await ico.saleToken();
  if (!t || t === ethers.constants.AddressZero) throw new Error('ICO.saleToken() is not set');
  return new ethers.Contract(t, erc20Abi, wallet);
}

async function main() {
  const isWs = /^wss?:\/\//i.test(RPC);
  const provider = isWs ? new ethers.providers.WebSocketProvider(RPC) : new ethers.providers.JsonRpcProvider(RPC);
  const wallet = new ethers.Wallet(PK, provider);
  const token = await ensureTokenContract(wallet);
  const ico = ICO_ADDR ? new ethers.Contract(ICO_ADDR, icoAbi, wallet) : null;
  const decimals = await token.decimals();
  const symbol = await token.symbol().catch(() => 'TOKEN');
  const sender = await wallet.getAddress();

  console.log('[airdrop] Network', (await provider.getNetwork()).chainId);
  console.log('[airdrop] Token', token.address, symbol, 'decimals', decimals);
  console.log('[airdrop] Sender', sender);
  if (PER_TOKEN_USD_PRICE) console.log('[airdrop] Price per token (USD):', PER_TOKEN_USD_PRICE);
  if (CHUNK_PER_TX_USD && PER_TOKEN_USD_PRICE) console.log('[airdrop] Max chunk derived from USD:', Math.floor(CHUNK_PER_TX_USD / PER_TOKEN_USD_PRICE), 'tokens (', CHUNK_PER_TX_USD, 'USD)');
  try {
    const nativeBal = await wallet.getBalance();
    const gasPrice = GAS_PRICE_GWEI > 0 ? ethers.utils.parseUnits(String(GAS_PRICE_GWEI), 'gwei') : await wallet.getGasPrice();
    const gasLimit = ethers.BigNumber.from(TX_GAS_LIMIT || 120000);
    const estCost = gasPrice.mul(gasLimit);
    console.log('[airdrop] BNB balance', ethers.utils.formatUnits(nativeBal, 'ether'), 'BNB',
      'gasPrice', ethers.utils.formatUnits(gasPrice, 'gwei'), 'gwei',
      'gasLimit', gasLimit.toString(),
      'estCost', ethers.utils.formatUnits(estCost, 'ether'), 'BNB/tx');
  } catch (_) { /* ignore */ }
  if (DRY_RUN) console.log('[airdrop] DRY_RUN=1 (no real transfers)');
  if (AIRDROP_NOTIFY && TELEGRAM_BOT_TOKEN) console.log('[airdrop] Telegram notifications: ON');

  // Load or build state
  const state = loadState();
  state.token = token.address;
  state.decimals = decimals;

  // Build totals from CSV
  const csvText = fs.readFileSync(CSV_PATH, 'utf8');
  const totals = parseCsvTotals(csvText);
  state.totals = totals;
  // Initialize remaining if first run
  if (!state.remaining || Object.keys(state.remaining).length === 0) {
    state.remaining = { ...totals };
  }
  saveState(state);

  const addresses = Object.keys(state.remaining);
  let idx = state.cursor || 0;

  // Compute initial daily budget if pacing enabled
  function estimateChunksRemaining() {
    const remainingTokens = Object.values(state.remaining).reduce((a, b) => a + BigInt(b || 0), 0n);
    const avgChunk = BigInt(Math.floor((MIN_CHUNK_TOKENS + MAX_CHUNK_TOKENS) / 2));
    if (avgChunk <= 0n) return 0n;
    return remainingTokens / avgChunk + (remainingTokens % avgChunk === 0n ? 0n : 1n);
  }
  function computeDailyBudget() {
    if (DAILY_TX_CAP) return DAILY_TX_CAP;
    if (!AIRDROP_DURATION_DAYS) return null;
    const estChunks = Number(estimateChunksRemaining());
    return Math.max(1, Math.ceil(estChunks / AIRDROP_DURATION_DAYS));
  }
  if (AIRDROP_DURATION_DAYS || DAILY_TX_CAP) {
    state.estDailyBudget = computeDailyBudget();
    const { ymd } = nowAstana();
    if (state.dayKey !== ymd) { state.dayKey = ymd; state.sentToday = 0; }
  }

  if (addresses.length === 0) {
    console.log('[airdrop] No valid recipients found in CSV. Nothing to do.');
    return;
  }

  async function loop() {
    try {
      // Pick next address RANDOMLY among those with remaining > 0, avoid repeating last
      const all = Object.keys(state.remaining);
      const nonZero = all.filter((a) => {
        try { return BigInt(state.remaining[a] || 0n) > 0n; } catch (_) { return false; }
      });
      if (nonZero.length === 0) {
        console.log('[airdrop] All transfers complete. Exiting.');
        return;
      }

      // Pacing: stop for today if budget reached
      if (state.estDailyBudget && state.sentToday >= state.estDailyBudget) {
        const ms = msUntilNextAstanaMidnight();
        console.log(`[airdrop] Daily tx budget reached (${state.estDailyBudget}). Sleeping until next Astana midnight ~ ${Math.round(ms/60000)} min.`);
        setTimeout(() => {
          const { ymd } = nowAstana();
          state.dayKey = ymd; state.sentToday = 0;
          // Recompute budget based on updated remaining
          state.estDailyBudget = computeDailyBudget();
          saveState(state);
          setTimeout(loop, nextDelayMs());
        }, ms);
        return;
      }
      const lastAddr = state.lastAddr || null;
      let candidates = nonZero.filter((a) => a !== lastAddr);
      if (candidates.length === 0) candidates = nonZero; // allow repeat if single option
      const to = candidates[randInt(0, candidates.length - 1)];
      const leftTokens = BigInt(state.remaining[to]);
      // Price-driven chunk size (uses hardcoded price)
      const dynamicMax = (!Number.isNaN(CHUNK_PER_TX_USD) && CHUNK_PER_TX_USD > 0 && PER_TOKEN_USD_PRICE > 0)
        ? Math.max(1, Math.floor(CHUNK_PER_TX_USD / PER_TOKEN_USD_PRICE))
        : MAX_CHUNK_TOKENS;
      const maxChunk = BigInt(Math.min(dynamicMax, Number(leftTokens)));
      const minChunk = BigInt(Math.min(MIN_CHUNK_TOKENS, Number(maxChunk)));
      const sendTokens = BigInt(randInt(Number(minChunk), Number(maxChunk)));

      const amount = ethers.utils.parseUnits(sendTokens.toString(), decimals);
      console.log(`[airdrop] -> ${to} amount=${sendTokens} ${symbol} (left ${leftTokens} tokens)`);

      if (!DRY_RUN) {
        // Ensure native gas balance is sufficient for this tx
        try {
          const gasPrice = GAS_PRICE_GWEI > 0 ? ethers.utils.parseUnits(String(GAS_PRICE_GWEI), 'gwei') : await wallet.getGasPrice();
          const gasLimit = ethers.BigNumber.from(TX_GAS_LIMIT || 120000);
          const estCost = gasPrice.mul(gasLimit);
          const nativeBal = await wallet.getBalance();
          if (nativeBal.lt(estCost)) {
            const need = estCost.sub(nativeBal);
            console.warn('[airdrop] Insufficient native balance for gas. Have', ethers.utils.formatUnits(nativeBal, 'ether'), 'need', ethers.utils.formatUnits(estCost, 'ether'), 'BNB. Pausing until balance is topped up.');
            if (AIRDROP_NOTIFY && TELEGRAM_BOT_TOKEN) {
              const txt = `⚠️ Airdrop paused: low BNB for gas\nHave: ${ethers.utils.formatUnits(nativeBal, 'ether')} BNB\nNeed: ${ethers.utils.formatUnits(estCost, 'ether')} BNB`;
              try { await postToTelegram(txt); } catch (_) {}
            }
            // Sleep a bit longer (5–10 minutes) then retry
            const delay = randInt(300, 600) * 1000;
            setTimeout(loop, delay);
            return;
          }
        } catch (_) { /* ignore gas preflight errors */ }

        // Ensure token balance is sufficient; optionally withdraw from ICO
        let bal = await token.balanceOf(sender);
        if (bal.lt(amount)) {
          if (AUTO_WITHDRAW && ico) {
            const shortfall = amount.sub(bal);
            let available = ethers.BigNumber.from(0);
            try {
              const icoBal = await token.balanceOf(ico.address);
              let totalStaked = ethers.BigNumber.from(0);
              try { totalStaked = await ico.totalStaked(); } catch (_) {}
              available = icoBal.gt(totalStaked) ? icoBal.sub(totalStaked) : ethers.BigNumber.from(0);
            } catch (_) {}
            const toWithdraw = shortfall.lte(available) ? shortfall : available;
            if (toWithdraw.gt(0)) {
              console.log('[airdrop] Withdrawing', ethers.utils.formatUnits(toWithdraw, decimals), 'from ICO to sender...');
            const wtxOverrides = {};
            if (TX_GAS_LIMIT) wtxOverrides.gasLimit = TX_GAS_LIMIT;
            if (GAS_PRICE_GWEI > 0) wtxOverrides.gasPrice = ethers.utils.parseUnits(String(GAS_PRICE_GWEI), 'gwei');
            if (FORCE_LEGACY_TX) wtxOverrides.type = 0;
            const wtx = await ico.withdrawTokens(token.address, toWithdraw, wtxOverrides);
              console.log('[airdrop] withdraw tx:', EXPLORER_TX_URL ? EXPLORER_TX_URL + wtx.hash : wtx.hash);
              await wtx.wait();
              bal = await token.balanceOf(sender);
            } else {
              console.warn('[airdrop] AUTO_WITHDRAW enabled but nothing available to withdraw from ICO');
            }
          }
          if (bal.lt(amount)) throw new Error('Sender balance too low for next chunk after optional withdraw');
        }
        const txOverrides = {};
        if (TX_GAS_LIMIT) txOverrides.gasLimit = TX_GAS_LIMIT;
        if (GAS_PRICE_GWEI > 0) txOverrides.gasPrice = ethers.utils.parseUnits(String(GAS_PRICE_GWEI), 'gwei');
        if (FORCE_LEGACY_TX) txOverrides.type = 0;
        const tx = await token.transfer(to, amount, txOverrides);
        console.log('[airdrop] tx:', tx.hash);
        if (CONFIRMATIONS > 0) await tx.wait(CONFIRMATIONS);
        else await tx.wait();
        if (AIRDROP_NOTIFY && TELEGRAM_BOT_TOKEN) {
          const lines = [];
          lines.push('🚨 Presale Purchase Alert!🚨');
          lines.push('');
          const totalUsd = PER_TOKEN_USD_PRICE ? (Number(sendTokens) * PER_TOKEN_USD_PRICE) : null;
          if (totalUsd !== null) lines.push(`  Amount: <b>$${totalUsd.toFixed(2)}</b> 💵`);
          lines.push(`  Coin Amount: <b>${sendTokens}</b> ${TOKEN_SYMBOL} 💰`);
          if (PER_TOKEN_USD_PRICE) lines.push(`  Price Per Coin: $${PER_TOKEN_USD_PRICE.toFixed(3)} 📈`);
          if (LAUNCH_USD_PRICE) lines.push(`  Launch Price: $${LAUNCH_USD_PRICE.toFixed(3)} 🚀`);
          lines.push('');
          if (BUY_URL) lines.push(`  🔵 Buy ${TOKEN_SYMBOL}: ${BUY_URL}`); else lines.push(`  🔵 Buy ${TOKEN_SYMBOL}:`);
          const text = lines.join('\n');
          if (TELEGRAM_INCLUDE_GIF && TELEGRAM_GIF_URL) await postToTelegramWithGif(text); else await postToTelegram(text);
        }
      }

      // Update state
      state.remaining[to] = (leftTokens - sendTokens).toString();
      state.lastAddr = to;
      state.cursor = 0; // legacy/no-op under random selection
      if (AIRDROP_DURATION_DAYS || DAILY_TX_CAP) {
        const { ymd } = nowAstana();
        if (state.dayKey !== ymd) { state.dayKey = ymd; state.sentToday = 0; }
        state.sentToday += 1;
        state.estDailyBudget = computeDailyBudget();
      }
      saveState(state);

      setTimeout(loop, nextDelayMs());
    } catch (e) {
      console.error('[airdrop] Error during loop:', e && e.message ? e.message : e);
      setTimeout(loop, Math.max(60_000, nextDelayMs()));
    }
  }

  console.log('[airdrop] Recipients:', addresses.length, 'State file:', STATE_FILE);
  const firstDelay = FAST_START_MS !== null ? FAST_START_MS : nextDelayMs();
  if (FAST_START_MS !== null) console.log('[schedule] FAST_START_MS=', FAST_START_MS, 'ms');
  setTimeout(loop, firstDelay);
}

main().catch((e) => {
  console.error('[airdrop] Fatal:', e && e.message ? e.message : e);
  process.exit(1);
});

function parseIds(raw) {
  if (!raw) return [];
  try { const arr = JSON.parse(raw); if (Array.isArray(arr)) return arr.map(String); } catch (_) {}
  return String(raw).split(/[\s,]+/).map((s) => s.trim()).filter(Boolean);
}

function readRecipientsFile() {
  try {
    const data = fs.readFileSync(TELEGRAM_RECIPIENTS_FILE, 'utf8');
    const arr = JSON.parse(data);
    if (Array.isArray(arr)) return arr.map((x) => String(x));
  } catch (_) {}
  return [];
}
function writeRecipientsFile(ids) {
  try { fs.writeFileSync(TELEGRAM_RECIPIENTS_FILE, JSON.stringify(Array.from(new Set(ids)), null, 2)); } catch (_) {}
}
function mergeRecipientSources(baseIds) {
  let ids = Array.isArray(baseIds) ? baseIds.slice() : [];
  // 1) From env multi-list
  ids = ids.concat(parseIds(TELEGRAM_CHAT_IDS));
  // 2) Single fallback env
  if (!ids.length && TELEGRAM_CHAT_ID) ids.push(String(TELEGRAM_CHAT_ID));
  // 3) External file list
  if (TELEGRAM_CHAT_IDS_FILE) {
    try {
      const data = fs.readFileSync(TELEGRAM_CHAT_IDS_FILE, 'utf8');
      let more = [];
      try { const parsed = JSON.parse(data); more = Array.isArray(parsed) ? parsed : [parsed]; }
      catch (_) { more = data.split(/\r?\n/); }
      ids = ids.concat(more.map((x) => String(x).trim()).filter(Boolean));
    } catch (_) {}
  }
  // 4) Persisted recipients
  ids = ids.concat(readRecipientsFile());
  // dedupe
  return Array.from(new Set(ids.filter(Boolean)));
}

function httpGetJson(hostname, pathStr) {
  return new Promise((resolve, reject) => {
    const req = https.request({ hostname, port: 443, path: pathStr, method: 'GET' }, (res) => {
      let buf = '';
      res.on('data', (d) => { buf += d; });
      res.on('end', () => {
        try { resolve(JSON.parse(buf)); } catch (e) { resolve(null); }
      });
    });
    req.on('error', () => resolve(null));
    req.end();
  });
}

async function discoverRecipientsFromUpdates() {
  if (!TELEGRAM_BOT_TOKEN) return [];
  const allowed = encodeURIComponent(JSON.stringify(["message","channel_post","my_chat_member","chat_member"]));
  const pathStr = `/bot${TELEGRAM_BOT_TOKEN}/getUpdates?timeout=1&allowed_updates=${allowed}`;
  const resp = await httpGetJson('api.telegram.org', pathStr);
  if (!resp || !resp.ok || !Array.isArray(resp.result)) return [];
  const ids = [];
  for (const upd of resp.result) {
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
  return Array.from(new Set(ids));
}

async function ensureChatIds() {
  let ids = mergeRecipientSources([]);
  if (!ids.length) {
    const discovered = await discoverRecipientsFromUpdates();
    if (discovered.length) {
      ids = mergeRecipientSources(discovered);
      writeRecipientsFile(ids);
      console.log(`[airdrop] Telegram autodiscovered recipients: ${ids.join(', ')}`);
    }
  }
  return ids;
}

async function postToTelegram(text) {
  if (!TELEGRAM_BOT_TOKEN) return Promise.resolve();
  const ids = await ensureChatIds();
  if (!ids.length) return Promise.resolve();
  const makeReq = (chat_id) => new Promise((resolve, reject) => {
    const data = JSON.stringify({ chat_id, text, parse_mode: 'HTML', disable_web_page_preview: true });
    const options = { hostname: 'api.telegram.org', port: 443, path: `/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } };
    const req = https.request(options, (res) => {
      let resp = '';
      res.on('data', (d) => { resp += d; });
      res.on('end', () => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) return resolve({ chat_id, resp });
        reject(new Error(`Telegram API ${res.statusCode} for ${chat_id}: ${resp}`));
      });
    });
    req.on('error', (e) => reject(new Error(`Request error for ${chat_id}: ${e && e.message || e}`)));
    req.write(data);
    req.end();
  });
  return Promise.allSettled(ids.map(makeReq));
}

async function postToTelegramWithGif(captionText) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_GIF_URL) return postToTelegram(captionText);
  const ids = await ensureChatIds();
  if (!ids.length) return postToTelegram(captionText);
  const makeReq = (chat_id) => new Promise((resolve, reject) => {
    const payload = JSON.stringify({ chat_id, animation: TELEGRAM_GIF_URL, caption: captionText, parse_mode: 'HTML', disable_web_page_preview: true });
    const options = { hostname: 'api.telegram.org', port: 443, path: `/bot${TELEGRAM_BOT_TOKEN}/sendAnimation`, method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } };
    const req = https.request(options, (res) => {
      let resp = '';
      res.on('data', (d) => { resp += d; });
      res.on('end', () => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) return resolve({ chat_id, resp });
        reject(new Error(`Telegram API ${res.statusCode} for ${chat_id}: ${resp}`));
      });
    });
    req.on('error', (e) => reject(new Error(`Request error for ${chat_id}: ${e && e.message || e}`)));
    req.write(payload);
    req.end();
  });
  return Promise.allSettled(ids.map(makeReq));
}
