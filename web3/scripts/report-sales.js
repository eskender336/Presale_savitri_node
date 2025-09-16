/*
  report-sales.js

  Summarizes TokenICO sales:
   - Reads on-chain tokensSold
   - Scans TokensPurchased events to sum amounts per payment token
   - Approximates USD raised using current price feeds

  Usage examples:
    node scripts/report-sales.js
    node scripts/report-sales.js --from-block 0
    node scripts/report-sales.js --from 5000000 --to latest --json

  Env (web3/.env or project .env.local):
    - NETWORK_RPC_URL or NEXT_PUBLIC_RPC_URL
    - NEXT_PUBLIC_TOKEN_ICO_ADDRESS (or CONTRACT_ADDRESS)
*/

require('dotenv').config({ path: __dirname + '/../.env' });
try { require('dotenv').config({ path: __dirname + '/../../.env.local' }); } catch (_) {}
const { ethers } = require('ethers');

const ICO_ADDR = process.env.NEXT_PUBLIC_TOKEN_ICO_ADDRESS || process.env.CONTRACT_ADDRESS || process.env.ICO_ADDRESS;
const RPC_URL = process.env.NETWORK_RPC_URL || process.env.NEXT_PUBLIC_RPC_URL || process.env.RPC_URL;
const NATIVE_SYMBOL = (process.env.NATIVE_SYMBOL || 'BNB').toUpperCase();

if (!ICO_ADDR) {
  console.error('Missing ICO address. Set NEXT_PUBLIC_TOKEN_ICO_ADDRESS or CONTRACT_ADDRESS');
  process.exit(1);
}
if (!RPC_URL) {
  console.error('Missing RPC URL. Set NETWORK_RPC_URL or NEXT_PUBLIC_RPC_URL');
  process.exit(1);
}

// Load ABIs
let icoAbi;
try {
  icoAbi = require('../artifacts/contracts/TokenICO.sol/TokenICO.json').abi;
} catch (e) {
  console.error('Unable to load TokenICO ABI. Run `npm run compile` in web3/.', e.message);
  process.exit(1);
}

const erc20Abi = [
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)'
];

const feedAbi = [
  'function decimals() external view returns (uint8)',
  'function latestRoundData() external view returns (uint80,int256,uint256,uint256,uint80)'
];

function parseArgs(argv) {
  const args = { from: null, to: 'latest', json: false, chunk: 1000, provider: null, quiet: false, source: 'logs' };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    const next = argv[i + 1];
    if (a === '--from' || a === '--from-block') { args.from = next === 'latest' ? 'latest' : parseInt(next, 10); i++; }
    else if (a === '--to' || a === '--to-block') { args.to = next === 'latest' ? 'latest' : parseInt(next, 10); i++; }
    else if (a === '--json') { args.json = true; }
    else if (a === '--chunk') { args.chunk = parseInt(next, 10) || args.chunk; i++; }
    else if (a === '--provider' || a === '--rpc') { args.provider = next; i++; }
    else if (a === '--quiet' || a === '-q') { args.quiet = true; }
    else if (a === '--source') { args.source = (next || 'logs'); i++; }
  }
  return args;
}

const fmt = (bn, dec = 18, digits = 6) => Number(ethers.utils.formatUnits(bn || 0, dec)).toFixed(digits);

async function getTokenMeta(provider, address) {
  if (!address || address === ethers.constants.AddressZero) return { address, decimals: 18, symbol: NATIVE_SYMBOL };
  const c = new ethers.Contract(address, erc20Abi, provider);
  const [dec, sym] = await Promise.all([
    c.decimals().catch(() => 18),
    c.symbol().catch(() => 'TKN')
  ]);
  return { address, decimals: dec, symbol: sym };
}

async function getUsdPrice(provider, feedAddr) {
  if (!feedAddr || feedAddr === ethers.constants.AddressZero) return null;
  const f = new ethers.Contract(feedAddr, feedAbi, provider);
  const [dec, data] = await Promise.all([
    f.decimals(),
    f.latestRoundData()
  ]);
  const answer = data && data[1];
  const price = answer && ethers.BigNumber.from(answer);
  if (!price || price.lte(0)) return null;
  return { price, decimals: dec };
}

async function main() {
  const args = parseArgs(process.argv);
  const providerUrl = args.provider || RPC_URL;
  const provider = new ethers.providers.JsonRpcProvider(providerUrl);
  const net = await provider.getNetwork();
  const ico = new ethers.Contract(ICO_ADDR, icoAbi, provider);

  // Basic state
  const [saleToken, tokensSoldBN, stableDec, usdtAddr, usdcAddr, ethAddr, btcAddr, solAddr, bnbFeed, ethFeed, btcFeed, solFeed] = await Promise.all([
    ico.saleToken(),
    ico.tokensSold(),
    ico.stablecoinDecimals().catch(() => 6),
    ico.usdtAddress().catch(() => ethers.constants.AddressZero),
    ico.usdcAddress().catch(() => ethers.constants.AddressZero),
    ico.ethAddress().catch(() => ethers.constants.AddressZero),
    ico.btcAddress().catch(() => ethers.constants.AddressZero),
    ico.solAddress().catch(() => ethers.constants.AddressZero),
    ico.bnbPriceFeed().catch(() => ethers.constants.AddressZero),
    ico.ethPriceFeed().catch(() => ethers.constants.AddressZero),
    ico.btcPriceFeed().catch(() => ethers.constants.AddressZero),
    ico.solPriceFeed().catch(() => ethers.constants.AddressZero),
  ]);

  const saleMeta = await getTokenMeta(provider, saleToken);

  // Price feeds (current snapshot)
  const [bnbPx, ethPx, btcPx, solPx] = await Promise.all([
    getUsdPrice(provider, bnbFeed),
    getUsdPrice(provider, ethFeed),
    getUsdPrice(provider, btcFeed),
    getUsdPrice(provider, solFeed),
  ]);

  const iface = new ethers.utils.Interface(icoAbi);
  const topic = iface.getEventTopic('TokensPurchased');

  const latestBlock = await provider.getBlockNumber();
  const fromBlock = args.from == null || args.from === 'latest' ? 0 : Math.max(0, args.from);
  const toBlock = args.to === 'latest' ? latestBlock : Math.min(latestBlock, args.to || latestBlock);

  // Token metadata for inputs
  const metaMap = new Map();
  const nativeKey = ethers.constants.AddressZero;
  metaMap.set(nativeKey, { address: nativeKey, symbol: NATIVE_SYMBOL, decimals: 18 });
  async function ensureMeta(addr) {
    const key = (addr || nativeKey).toLowerCase();
    if (!metaMap.has(key)) metaMap.set(key, await getTokenMeta(provider, addr));
    return metaMap.get(key);
  }

  const totals = {}; // by address lowercased (or 'native')
  const addAmount = (addr, amountBN) => {
    const k = (addr || nativeKey).toLowerCase();
    totals[k] = totals[k] ? totals[k].add(amountBN) : ethers.BigNumber.from(amountBN);
  };

  if (String(args.source).toLowerCase() === 'contract') {
    // Fallback path: read on-chain stored transactions
    try {
      const txs = await ico.getAllTransactions();
      if (!args.quiet) console.log(`Loaded ${txs.length} transactions from contract state`);
      for (const t of txs) {
        try {
          if (t.transactionType && String(t.transactionType).toUpperCase() !== 'BUY') continue;
        } catch (_) { /* ignore */ }
        const tokenIn = t.tokenIn; // address (address(0) for native)
        const amountIn = t.amountIn; // BigNumber
        addAmount(tokenIn, amountIn);
        await ensureMeta(tokenIn);
      }
    } catch (e) {
      console.warn('getAllTransactions() failed; falling back to logs. Error:', e && e.message || e);
      args.source = 'logs';
    }
  }
  if (String(args.source).toLowerCase() === 'logs') {
    // Scan logs in chunks
    let cursor = fromBlock;
    let chunk = Math.max(100, args.chunk | 0);
    const minChunk = 50;
    const sleep = (ms) => new Promise((res) => setTimeout(res, ms));
    while (cursor <= toBlock) {
      const end = Math.min(toBlock, cursor + chunk - 1);
      try {
        const logs = await provider.getLogs({ address: ICO_ADDR, topics: [topic], fromBlock: cursor, toBlock: end });
        for (const log of logs) {
          try {
            const parsed = iface.parseLog(log);
            const paymentMethod = parsed.args.paymentMethod;
            const amountPaid = parsed.args.amountPaid;
            addAmount(paymentMethod, amountPaid);
            await ensureMeta(paymentMethod);
          } catch (_) { /* ignore parse errors */ }
        }
        if (!args.quiet) console.log(`Scanned blocks ${cursor} - ${end} (${logs.length} events)`);
        cursor = end + 1;
      } catch (e) {
        const body = (e && e.body) || '';
        const msg = (e && e.message) || '';
        const code = (e && e.code) || '';
        // BSC public nodes often return -32005 limit exceeded. Shrink chunk and retry.
        if (String(code) === 'SERVER_ERROR' || /-32005|limit exceeded|query timeout|503|429/i.test(body + ' ' + msg)) {
          const newChunk = Math.max(minChunk, Math.floor(chunk / 2));
          if (!args.quiet) console.warn(`Provider limit hit at ${cursor}-${end}. Reducing chunk ${chunk} -> ${newChunk} and retrying…`);
          chunk = newChunk;
          await sleep(750);
          continue; // retry same cursor with smaller chunk
        }
        throw e; // unknown error
      }
    }
  }

  // Build human report
  const rows = [];
  let approxUsd = 0;
  for (const [k, bn] of Object.entries(totals)) {
    const meta = metaMap.get(k);
    const amount = Number(ethers.utils.formatUnits(bn, meta.decimals));
    let usd = 0;
    if (k === (usdtAddr || '').toLowerCase() || k === (usdcAddr || '').toLowerCase()) {
      usd = amount; // stablecoins ~ USD
    } else if (k === nativeKey.toLowerCase()) {
      if (bnbPx) usd = Number(ethers.utils.formatUnits(bnbPx.price.mul(bn).div(ethers.BigNumber.from(10).pow(meta.decimals)), bnbPx.decimals));
    } else if (k === (ethAddr || '').toLowerCase()) {
      if (ethPx) usd = Number(ethers.utils.formatUnits(ethPx.price.mul(bn).div(ethers.BigNumber.from(10).pow(meta.decimals)), ethPx.decimals));
    } else if (k === (btcAddr || '').toLowerCase()) {
      if (btcPx) usd = Number(ethers.utils.formatUnits(btcPx.price.mul(bn).div(ethers.BigNumber.from(10).pow(meta.decimals)), btcPx.decimals));
    } else if (k === (solAddr || '').toLowerCase()) {
      if (solPx) usd = Number(ethers.utils.formatUnits(solPx.price.mul(bn).div(ethers.BigNumber.from(10).pow(meta.decimals)), solPx.decimals));
    }
    approxUsd += usd;
    rows.push({ token: meta.symbol, address: meta.address, amount, usd });
  }

  // Output
  const report = {
    network: { chainId: net.chainId, name: net.name },
    contract: ICO_ADDR,
    saleToken: { address: saleMeta.address, symbol: saleMeta.symbol, decimals: saleMeta.decimals },
    tokensSold: {
      raw: tokensSoldBN.toString(),
      formatted: Number(ethers.utils.formatUnits(tokensSoldBN, saleMeta.decimals)),
    },
    payments: rows,
    approxUsdRaised: Number(approxUsd.toFixed(2)),
    note: 'USD raised is an approximation using current price feeds; historical prices at purchase time are not captured on-chain.'
  };

  if (args.json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log('Network:', report.network.chainId, report.network.name);
    console.log('ICO:', report.contract);
    console.log('Sale token:', `${saleMeta.symbol} (${saleMeta.decimals} dec)`, saleMeta.address);
    console.log('Tokens sold:', report.tokensSold.formatted, saleMeta.symbol);
    if (rows.length) {
      console.log('\nPayments by currency:');
      for (const r of rows) {
        console.log(`  - ${r.token.padEnd(6)} ${r.amount.toFixed(6)}${r.usd ? `  (~$${r.usd.toFixed(2)})` : ''}`);
      }
    } else {
      console.log('No TokensPurchased events found in the selected range.');
    }
    console.log(`\nApprox USD raised (current prices): $${report.approxUsdRaised}`);
    console.log('(Note: stablecoins are exact; others use current feed prices)');
  }
}

main().catch((e) => {
  console.error('Error:', e);
  process.exit(1);
});
