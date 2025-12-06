#!/usr/bin/env node
/*
  Reads a CSV (walletAddress,tokenBalance) and verifies on-chain token balances.

  Usage:
    node web3/scripts/check-token-balances.js [--csv path] [--limit N] [--concurrency 5] [--tolerance 0] [--json]
*/
require('dotenv').config({ path: __dirname + '/../.env' });
try { require('dotenv').config({ path: __dirname + '/../../.env.local' }); } catch (_) {}

const fs = require('fs');
const path = require('path');
const { ethers } = require('ethers');

function parseArgs(argv) {
  const args = { csv: null, limit: null, concurrency: 5, tolerance: '0', json: false };
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    const next = argv[i + 1];
    if (arg === '--csv' && next) { args.csv = next; i++; }
    else if (arg === '--limit' && next) { args.limit = Math.max(1, parseInt(next, 10)); i++; }
    else if (arg === '--concurrency' && next) { args.concurrency = Math.max(1, parseInt(next, 10)); i++; }
    else if (arg === '--tolerance' && next) { args.tolerance = next; i++; }
    else if (arg === '--json') { args.json = true; }
  }
  return args;
}

function parseCsvTotals(csvText) {
  const lines = csvText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (!lines.length) return [];
  const header = lines.shift().split(',').map((h) => h.trim());
  const addrIdx = header.findIndex((h) => /wallet/i.test(h));
  const balIdx = header.findIndex((h) => /balance/i.test(h));
  if (addrIdx === -1 || balIdx === -1) throw new Error('CSV must include walletAddress and tokenBalance columns');
  const rows = [];
  for (const line of lines) {
    if (!line || /^#/.test(line)) continue;
    const parts = line.split(',').map((v) => v.trim());
    const addr = parts[addrIdx];
    const bal = parts[balIdx];
    if (!addr || !bal) continue;
    rows.push({ address: addr, amount: bal });
  }
  return rows;
}

function networkNameFromChainId(chainId) {
  switch (chainId) {
    case 1: return 'homestead';
    case 5: return 'goerli';
    case 56: return 'bsc';
    case 97: return 'bsc-testnet';
    case 137: return 'polygon';
    case 59144: return 'linea';
    default:
      return `chain-${chainId}`;
  }
}

async function resolveTokenAddress(provider) {
  const envToken =
    process.env.SALE_TOKEN_ADDRESS ||
    process.env.SAV_ADDRESS ||
    process.env.NEXT_PUBLIC_SAV_ADDRESS ||
    '';
  if (envToken) return envToken;
  const icoAddr = process.env.NEXT_PUBLIC_TOKEN_ICO_ADDRESS || process.env.ICO_ADDRESS;
  if (!icoAddr) throw new Error('SALE_TOKEN_ADDRESS (or ICO_ADDRESS) env is required');
  const icoAbi = require('../artifacts/contracts/TokenICO.sol/TokenICO.json').abi;
  const ico = new ethers.Contract(icoAddr, icoAbi, provider);
  const saleToken = await ico.saleToken();
  if (!saleToken || saleToken === ethers.constants.AddressZero) throw new Error('ICO saleToken() not configured');
  return saleToken;
}

async function main() {
  const args = parseArgs(process.argv);
  const RPC = process.env.NETWORK_RPC_URL || process.env.NEXT_PUBLIC_RPC_URL;
  if (!RPC) throw new Error('NETWORK_RPC_URL env is required');

  const CHAIN_ID_ENV = parseInt(String(process.env.CHAIN_ID || process.env.NETWORK_CHAIN_ID || process.env.NEXT_PUBLIC_CHAIN_ID || '').trim(), 10);
  const providerNetwork = Number.isFinite(CHAIN_ID_ENV) && CHAIN_ID_ENV > 0
    ? { chainId: CHAIN_ID_ENV, name: networkNameFromChainId(CHAIN_ID_ENV) }
    : undefined;
  const provider = providerNetwork
    ? new ethers.providers.StaticJsonRpcProvider(RPC, providerNetwork)
    : new ethers.providers.JsonRpcProvider(RPC);

  const csvPath = args.csv ? path.resolve(process.cwd(), args.csv) : (process.env.CSV_PATH
    ? path.resolve(process.cwd(), process.env.CSV_PATH)
    : path.join(__dirname, '../../data/token-balances.csv'));
  const csvText = fs.readFileSync(csvPath, 'utf8');
  let entries = parseCsvTotals(csvText);
  if (!entries.length) throw new Error('No rows found in CSV');
  if (args.limit) entries = entries.slice(0, args.limit);

  const tokenAddress = await resolveTokenAddress(provider);
  const token = new ethers.Contract(tokenAddress, [
    'function decimals() view returns (uint8)',
    'function symbol() view returns (string)',
    'function balanceOf(address) view returns (uint256)'
  ], provider);
  const [decimals, symbol, network] = await Promise.all([
    token.decimals().catch(() => 18),
    token.symbol().catch(() => 'TOKEN'),
    provider.getNetwork()
  ]);

  const toleranceBn = ethers.utils.parseUnits(String(args.tolerance || '0'), decimals);
  const results = [];
  let processed = 0;
  let totalExpected = ethers.BigNumber.from(0);
  let totalActual = ethers.BigNumber.from(0);

  const toUnits = (val) => {
    const cleaned = String(val).replace(/[, ]+/g, '');
    if (!cleaned) return ethers.BigNumber.from(0);
    return ethers.utils.parseUnits(cleaned, decimals);
  };

  async function checkEntry(entry, index) {
    const addr = ethers.utils.getAddress(entry.address);
    const expected = toUnits(entry.amount);
    const actual = await token.balanceOf(addr);
    totalExpected = totalExpected.add(expected);
    totalActual = totalActual.add(actual);
    const diff = actual.sub(expected);
    const ok = diff.abs().lte(toleranceBn);
    processed++;
    if (!ok) {
      results.push({
        address: addr,
        expected: expected.toString(),
        actual: actual.toString(),
        diff: diff.toString(),
        index,
      });
    }
  }

  const concurrency = args.concurrency;
  let cursor = 0;
  const errors = [];
  async function worker() {
    while (true) {
      const idx = cursor++;
      if (idx >= entries.length) break;
      const entry = entries[idx];
      try {
        await checkEntry(entry, idx);
      } catch (err) {
        errors.push({
          address: entry.address,
          error: err && err.message ? err.message : String(err),
          index: idx
        });
      }
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));

  const summary = {
    network: { chainId: network.chainId, name: network.name },
    token: { address: tokenAddress, symbol, decimals },
    csv: csvPath,
    addressesChecked: processed,
    mismatches: results.length,
    errors,
    totalExpected: ethers.utils.formatUnits(totalExpected, decimals),
    totalActual: ethers.utils.formatUnits(totalActual, decimals),
    toleranceTokens: args.tolerance
  };

  if (args.json) {
    console.log(JSON.stringify({ summary, mismatches: results }, null, 2));
  } else {
    console.log('Network:', summary.network.chainId, summary.network.name);
    console.log('Token:', symbol, tokenAddress);
    console.log('CSV:', csvPath);
    console.log('Addresses checked:', processed);
    console.log('Total expected tokens:', summary.totalExpected, symbol);
    console.log('Total actual tokens  :', summary.totalActual, symbol);
    if (results.length === 0 && errors.length === 0) {
      console.log('All addresses match expected balances (within tolerance', args.tolerance, symbol, ')');
    } else {
      if (results.length) {
        console.log('--- Mismatches ---');
        results.forEach((m) => {
          const fmtExpected = ethers.utils.formatUnits(m.expected, decimals);
          const fmtActual = ethers.utils.formatUnits(m.actual, decimals);
          const fmtDiff = ethers.utils.formatUnits(m.diff, decimals);
          console.log(`#${m.index + 1} ${m.address} expected ${fmtExpected} ${symbol}, on-chain ${fmtActual} ${symbol} (diff ${fmtDiff})`);
        });
      }
      if (errors.length) {
        console.log('--- Errors ---');
        errors.forEach((e) => {
          console.log(`#${e.index + 1} ${e.address} error: ${e.error}`);
        });
      }
    }
  }
}

main().catch((e) => {
  console.error('Error:', e);
  process.exit(1);
});
