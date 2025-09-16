// Estimate total commission cost for an airdrop based on chunk size
// Usage examples:
//   node web3/scripts/estimate-commission.js                     # defaults: CSV ../../data/token-balances.csv, chunk=25000, feeUSD=0.40
//   node web3/scripts/estimate-commission.js --csv ../../data/token-balances.csv --chunk 25000 --fee 0.40
//   node web3/scripts/estimate-commission.js --csv ../../data/token-balances.csv --perTxUSD 5000 --tokenUSD 0.2 --fee 0.40
//
require('dotenv').config({ path: __dirname + '/../.env' });
const fs = require('fs');
const path = require('path');
const { ethers } = require('ethers');

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    const [k, v] = a.includes('=') ? a.split('=') : [a, argv[i + 1]];
    const norm = (s) => String(s || '').replace(/^--?/, '');
    if (/^--/.test(a)) {
      args[norm(k)] = v === undefined || /^--/.test(v) ? true : v;
      if (v !== undefined && !/^--/.test(v)) i++;
    }
  }
  return args;
}

function parseCsvTotals(csvText) {
  const lines = csvText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  // Drop header if present (detect by non-numeric second column)
  if (lines.length && /wallet|address/i.test(lines[0])) lines.shift();
  const totals = {};
  for (const line of lines) {
    const [rawAddr, rawAmt] = line.split(/[\s,\t]+/).map((s) => (s || '').trim());
    if (!rawAddr || !rawAmt) continue;
    if (!ethers.utils.isAddress(rawAddr)) continue; // skip invalid rows
    const amt = BigInt(rawAmt);
    const addr = ethers.utils.getAddress(rawAddr);
    totals[addr] = (totals[addr] || 0n) + amt;
  }
  return totals;
}

function ceilDiv(a, b) {
  a = BigInt(a); b = BigInt(b);
  return Number((a + b - 1n) / b);
}

function main() {
  const args = parseArgs(process.argv);
  const CSV_PATH = args.csv ? path.resolve(process.cwd(), args.csv) : path.join(__dirname, '../../data/token-balances.csv');
  const FEE_USD = args.fee !== undefined ? parseFloat(String(args.fee)) : (process.env.FEE_USD ? parseFloat(String(process.env.FEE_USD)) : 0.40);

  // Determine chunk size in tokens
  let CHUNK_TOKENS = null;
  if (args.chunk !== undefined) CHUNK_TOKENS = BigInt(args.chunk);
  else if (process.env.CHUNK_TOKENS) CHUNK_TOKENS = BigInt(process.env.CHUNK_TOKENS);
  else if (args.perTxUSD !== undefined && args.tokenUSD !== undefined) {
    const perTxUSD = parseFloat(String(args.perTxUSD));
    const tokenUSD = parseFloat(String(args.tokenUSD));
    if (!(perTxUSD > 0) || !(tokenUSD > 0)) throw new Error('perTxUSD and tokenUSD must be > 0');
    CHUNK_TOKENS = BigInt(Math.floor(perTxUSD / tokenUSD));
  } else {
    // Default to $5,000 at $0.20 per token => 25,000 tokens
    CHUNK_TOKENS = 25000n;
  }
  if (CHUNK_TOKENS <= 0) throw new Error('chunk must be > 0');

  const csvText = fs.readFileSync(CSV_PATH, 'utf8');
  const totals = parseCsvTotals(csvText);
  const addresses = Object.keys(totals);
  if (!addresses.length) {
    console.log(JSON.stringify({ csv: CSV_PATH, addresses: 0, tx: 0, feeUSD: 0, chunkTokens: String(CHUNK_TOKENS) }, null, 2));
    return;
  }

  let totalTokens = 0n;
  let txCount = 0;
  for (const addr of addresses) {
    const bal = BigInt(totals[addr] || 0);
    totalTokens += bal;
    txCount += ceilDiv(bal, CHUNK_TOKENS);
  }
  const totalFeeUSD = txCount * FEE_USD;

  const result = {
    csv: CSV_PATH,
    addresses: addresses.length,
    totalTokens: totalTokens.toString(),
    chunkTokens: String(CHUNK_TOKENS),
    feePerTxUSD: FEE_USD,
    tx: txCount,
    totalFeeUSD: Number(totalFeeUSD.toFixed(2)),
  };
  console.log(JSON.stringify(result, null, 2));
}

try { main(); } catch (e) {
  console.error('Error:', e && e.message ? e.message : e);
  process.exit(1);
}

