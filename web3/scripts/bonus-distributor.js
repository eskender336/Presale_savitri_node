// Bonus Distributor: listens for TokensPurchased and sends extra bonus tokens to buyers
// without changing the deployed ICO contract.
//
// Bonus schedule: starts at 20% and decreases by 2% each stage.
// Stage is computed at purchase time using saleStartTime and the interval for the buyer
// (waitlist vs public) and the event's timestamp.
//
// Usage:
//   node web3/scripts/bonus-distributor.js [--from-block N] [--live]
//
// Env (web3/.env):
//   NETWORK_RPC_URL        - RPC endpoint (http or ws)
//   PRIVATE_KEY            - Admin wallet (must hold sale tokens for bonuses)
//   NEXT_PUBLIC_TOKEN_ICO_ADDRESS / ICO_ADDRESS - ICO address
//   EXPLORER_TX_URL        - Optional, link prefix for logs
//   DRY_RUN=1              - If set, do not send real transfers
//   AUTO_WITHDRAW=1        - If set, auto-withdraw shortfall from ICO to owner/admin
//   BONUS_CONFIRMATIONS    - Wait N confirmations before sending bonus (default 0)
//   BONUS_STATE_FILE       - Optional path to JSON state file (default ./.bonus.sent.json)
//   BONUS_MIN_SEND         - Minimum bonus token amount to send (default 0.000001 tokens)
//
require('dotenv').config({ path: __dirname + '/../.env' });
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
const { requirePrivateKey } = require('./utils/loadPrivateKey');

const RPC = process.env.RPC_WS_URL || process.env.NETWORK_RPC_URL;
// Load private key from secure location (.secrets/private-key or env var)
const PK = requirePrivateKey();
const ICO_ADDR = process.env.NEXT_PUBLIC_TOKEN_ICO_ADDRESS || process.env.ICO_ADDRESS;
const DRY_RUN = /^1|true|yes$/i.test(String(process.env.DRY_RUN || ''));
const AUTO_WITHDRAW = /^1|true|yes$/i.test(String(process.env.AUTO_WITHDRAW || ''));
const CONFIRMATIONS = Math.max(0, parseInt(process.env.BONUS_CONFIRMATIONS || '0', 10));
const EXPLORER_TX_URL = process.env.EXPLORER_TX_URL || '';
const STATE_FILE = process.env.BONUS_STATE_FILE || path.join(__dirname, '.bonus.sent.json');
const MIN_SEND_FLOAT = parseFloat(process.env.BONUS_MIN_SEND || '0.000001');

if (!RPC) throw new Error('Missing RPC (RPC_WS_URL or NETWORK_RPC_URL)');
if (!ICO_ADDR) throw new Error('Missing ICO address (NEXT_PUBLIC_TOKEN_ICO_ADDRESS or ICO_ADDRESS)');

// ABIs
const icoAbi = require('../artifacts/contracts/TokenICO.sol/TokenICO.json').abi;
const erc20Abi = [
  'function transfer(address to, uint256 amount) returns (bool)',
  'function balanceOf(address) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)'
];

// Simple args
const argv = process.argv.slice(2);
const getArg = (flag, def) => {
  const i = argv.indexOf(flag);
  if (i >= 0 && i + 1 < argv.length) return argv[i + 1];
  return def;
};
const fromBlockArg = getArg('--from-block', null);
const LIVE = argv.includes('--live');

// State helpers
function loadState() {
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  } catch (_) {
    return { processed: {} };
  }
}
function saveState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

function bonusPercentForStage(stage) {
  const p = 20 - 2 * Number(stage || 0);
  return Math.max(0, p);
}

async function main() {
  // Choose provider based on URL scheme
  const isWs = /^wss?:\/\//i.test(RPC);
  const provider = isWs
    ? new ethers.providers.WebSocketProvider(RPC)
    : new ethers.providers.JsonRpcProvider(RPC);
  const wallet = new ethers.Wallet(PK, provider);
  const ico = new ethers.Contract(ICO_ADDR, icoAbi, wallet);

  // Load sale token meta
  const saleTokenAddr = await ico.saleToken();
  if (!saleTokenAddr || saleTokenAddr === ethers.constants.AddressZero) {
    throw new Error('saleToken not configured on ICO');
  }
  const saleToken = new ethers.Contract(saleTokenAddr, erc20Abi, wallet);
  const saleDecimals = await saleToken.decimals();
  const saleSymbol = await saleToken.symbol().catch(() => 'SALE');

  console.log('[bonus] RPC mode:', isWs ? 'websocket' : 'http');
  console.log('[bonus] Network', (await provider.getNetwork()).chainId);
  console.log('[bonus] ICO', ICO_ADDR);
  console.log('[bonus] SALE', saleTokenAddr, saleSymbol, 'decimals', saleDecimals);
  console.log('[bonus] State file:', STATE_FILE);
  if (DRY_RUN) console.log('[bonus] DRY_RUN=1 (no transfers will be sent)');

  const state = loadState();

  const filter = ico.filters.TokensPurchased();
  const startBlock = fromBlockArg ? parseInt(fromBlockArg, 10) : (await provider.getBlockNumber());

  // Backfill window: process from fromBlockArg to latest (or just latest if none)
  if (fromBlockArg) {
    console.log(`[bonus] Backfill from block ${startBlock} to latest...`);
    const events = await ico.queryFilter(filter, startBlock, 'latest');
    for (const ev of events) {
      await handleEvent(ev, { provider, ico, saleToken, saleDecimals, saleSymbol, state });
    }
    saveState(state);
  }

  if (!LIVE) {
    console.log('[bonus] Backfill complete. Pass --live to keep listening.');
    return;
  }

  console.log('[bonus] Listening for new purchases...');
  ico.on(filter, async (buyer, paymentMethod, amountPaid, tokensBought, timestamp, event) => {
    try {
      // Optional confirmations for live events
      if (CONFIRMATIONS > 0) {
        try {
          await provider.waitForTransaction(event.transactionHash, CONFIRMATIONS);
        } catch (e) {
          console.warn('[bonus] waitForTransaction timeout or error; proceeding anyway:', e && e.message || e);
        }
      }
      await handleEvent(event, { provider, ico, saleToken, saleDecimals, saleSymbol, state });
      saveState(state);
    } catch (e) {
      console.error('[bonus] handleEvent error:', e);
    }
  });
}

async function handleEvent(ev, ctx) {
  const { provider, ico, saleToken, saleDecimals, saleSymbol, state } = ctx;
  const [buyer, , , tokensBought, timestamp] = ev.args;
  const key = `${ev.transactionHash}-${ev.logIndex}`;
  if (state.processed[key]) {
    return; // already processed
  }

  // Compute stage AT TIME OF PURCHASE
  const saleStart = (await ico.saleStartTime()).toNumber();
  const isWl = await ico.waitlisted(buyer);
  const wlInt = (await ico.waitlistInterval()).toNumber();
  const pubInt = (await ico.publicInterval()).toNumber();
  const interval = isWl ? wlInt : pubInt;
  const ts = timestamp.toNumber ? timestamp.toNumber() : (await provider.getBlock(ev.blockNumber)).timestamp;

  let stage = 0;
  if (saleStart > 0 && interval > 0 && ts >= saleStart) {
    stage = Math.floor((ts - saleStart) / interval);
  }

  const bonusPct = bonusPercentForStage(stage);
  if (bonusPct <= 0) {
    state.processed[key] = { skipped: true, reason: 'zero_bonus', stage, tx: ev.transactionHash };
    return;
  }

  const bonusAmount = tokensBought.mul(bonusPct).div(100);
  const minSend = ethers.utils.parseUnits(String(MIN_SEND_FLOAT), saleDecimals);
  if (bonusAmount.lte(minSend)) {
    state.processed[key] = { skipped: true, reason: 'dust', stage, bonusPct, bonus: bonusAmount.toString(), tx: ev.transactionHash };
    return;
  }

  const humanBonus = ethers.utils.formatUnits(bonusAmount, saleDecimals);
  console.log(`[bonus] ${ev.transactionHash} stage=${stage} bonus=${bonusPct}% => +${humanBonus} ${saleSymbol} to ${buyer}`);

  if (!DRY_RUN) {
    const admin = await saleToken.signer.getAddress();
    let bal = await saleToken.balanceOf(admin);
    if (bal.lt(bonusAmount)) {
      console.log('[bonus] Admin balance too low. Need', humanBonus, 'Have', ethers.utils.formatUnits(bal, saleDecimals));
      if (AUTO_WITHDRAW) {
        // Attempt to withdraw shortfall from ICO
        const shortfall = bonusAmount.sub(bal);
        const icoBal = await saleToken.balanceOf(ico.address);
        let totalStaked = ethers.BigNumber.from(0);
        try { totalStaked = await ico.totalStaked(); } catch (_) {}
        const available = icoBal.gt(totalStaked) ? icoBal.sub(totalStaked) : ethers.BigNumber.from(0);
        const toWithdraw = shortfall.lte(available) ? shortfall : available;
        if (toWithdraw.gt(0)) {
          console.log('[bonus] Withdrawing', ethers.utils.formatUnits(toWithdraw, saleDecimals), saleSymbol, 'from ICO to admin...');
          const wtx = await ico.withdrawTokens(saleToken.address, toWithdraw);
          console.log('[bonus] withdraw tx:', EXPLORER_TX_URL ? EXPLORER_TX_URL + wtx.hash : wtx.hash);
          await wtx.wait();
          bal = await saleToken.balanceOf(admin);
        }
      }
      if (bal.lt(bonusAmount)) throw new Error('Insufficient bonus token balance in admin wallet after optional withdraw');
    }
    const tx = await saleToken.transfer(buyer, bonusAmount);
    console.log('[bonus] transfer tx:', EXPLORER_TX_URL ? EXPLORER_TX_URL + tx.hash : tx.hash);
    await tx.wait();
  }

  state.processed[key] = {
    buyer,
    stage,
    bonusPct,
    bonus: bonusAmount.toString(),
    tx: ev.transactionHash,
    sentTx: DRY_RUN ? null : 'sent'
  };
}

main().catch((e) => {
  console.error('[bonus] Fatal:', e);
  process.exit(1);
});
