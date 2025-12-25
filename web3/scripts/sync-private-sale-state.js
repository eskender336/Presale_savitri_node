#!/usr/bin/env node
/*
  Rebuilds .private-sale.state.json so the scheduler knows what is still owed.
  - Aggregates CSV totals per wallet (same logic as scheduler)
  - Reads on-chain balances and subtracts them
  - Writes updated totals/remaining into STATE_FILE
*/
require('dotenv').config({ path: __dirname + '/../.env' });
try { require('dotenv').config({ path: __dirname + '/../../.env.local' }); } catch (_) {}

const fs = require('fs');
const path = require('path');
const { ethers } = require('ethers');

const STATE_FILE = process.env.PRIVATE_SALE_STATE_FILE || process.env.AIRDROP_STATE_FILE || path.join(__dirname, '.private-sale.state.json');
const CSV_PATH = process.env.CSV_PATH || path.join(__dirname, '../../data/token-balances.csv');
const RPC = process.env.NETWORK_RPC_URL || process.env.NEXT_PUBLIC_RPC_URL;
if (!RPC) throw new Error('NETWORK_RPC_URL is required');

function networkNameFromChainId(chainId) {
  switch (chainId) {
    case 1: return 'homestead';
    case 5: return 'goerli';
    case 56: return 'bsc';
    case 97: return 'bsc-testnet';
    case 137: return 'polygon';
    case 59144: return 'linea';
    default: return `chain-${chainId}`;
  }
}

function parseCsvTotals(csvText) {
  const lines = csvText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (!lines.length) return {};
  lines.shift(); // header
  const res = {};
  for (const line of lines) {
    if (!line || /^#/.test(line)) continue;
    const [rawAddr, rawAmount] = line.split(',').map((s) => (s || '').trim());
    if (!rawAddr || !rawAmount) continue;
    if (!ethers.utils.isAddress(rawAddr)) {
      console.warn('[csv] skip invalid address:', rawAddr);
      continue;
    }
    const checksum = ethers.utils.getAddress(rawAddr);
    const amt = BigInt(rawAmount);
    res[checksum] = (res[checksum] || 0n) + amt;
  }
  return res;
}

async function resolveTokenAddress(provider) {
  const envToken =
    process.env.SALE_TOKEN_ADDRESS ||
    process.env.SAV_ADDRESS ||
    process.env.NEXT_PUBLIC_SAV_ADDRESS ||
    '';
  if (envToken) return envToken;
  const icoAddr = process.env.NEXT_PUBLIC_TOKEN_ICO_ADDRESS || process.env.ICO_ADDRESS;
  if (!icoAddr) throw new Error('Set SALE_TOKEN_ADDRESS or ICO_ADDRESS/NEXT_PUBLIC_TOKEN_ICO_ADDRESS');
  const icoAbi = require('../artifacts/contracts/TokenICO.sol/TokenICO.json').abi;
  const ico = new ethers.Contract(icoAddr, icoAbi, provider);
  const saleToken = await ico.saleToken();
  if (!saleToken || saleToken === ethers.constants.AddressZero) {
    throw new Error('ICO.saleToken() is not configured');
  }
  return saleToken;
}

async function main() {
  const CHAIN_ID_ENV = parseInt(String(process.env.CHAIN_ID || process.env.NETWORK_CHAIN_ID || process.env.NEXT_PUBLIC_CHAIN_ID || '').trim(), 10);
  const providerNetwork = Number.isFinite(CHAIN_ID_ENV) && CHAIN_ID_ENV > 0
    ? { chainId: CHAIN_ID_ENV, name: networkNameFromChainId(CHAIN_ID_ENV) }
    : undefined;
  const provider = providerNetwork
    ? new ethers.providers.StaticJsonRpcProvider(RPC, providerNetwork)
    : new ethers.providers.JsonRpcProvider(RPC);

  const csvText = fs.readFileSync(path.resolve(CSV_PATH), 'utf8');
  const totals = parseCsvTotals(csvText);
  const addresses = Object.keys(totals);
  if (!addresses.length) throw new Error('No valid recipients found in CSV');

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
  const factor = 10n ** BigInt(decimals);

  const concurrency = 8;
  let cursor = 0;
  const remaining = {};
  const errors = [];

  async function worker() {
    while (true) {
      const idx = cursor++;
      if (idx >= addresses.length) break;
      const addr = addresses[idx];
      try {
        const bal = await token.balanceOf(addr);
        const onChainTokens = BigInt(bal.toString()) / factor;
        const expectedTokens = totals[addr];
        const diff = expectedTokens > onChainTokens ? expectedTokens - onChainTokens : 0n;
        remaining[addr] = diff.toString();
      } catch (err) {
        errors.push({ address: addr, error: err && err.message ? err.message : String(err) });
        remaining[addr] = totals[addr].toString();
      }
    }
  }
  await Promise.all(Array.from({ length: concurrency }, () => worker()));

  const state = {
    totals: Object.fromEntries(addresses.map((a) => [a, totals[a].toString()])),
    remaining,
    decimals,
    token: tokenAddress,
    cursor: 0,
    lastAddr: null,
    sentToday: 0,
    dayKey: null,
    estDailyBudget: null
  };
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));

  const totalRemaining = addresses.reduce((acc, addr) => acc + BigInt(remaining[addr] || '0'), 0n);
  console.log('State synced.');
  console.log('Network:', network.chainId, network.name);
  console.log('Token:', symbol, tokenAddress, 'decimals', decimals);
  console.log('Addresses:', addresses.length);
  console.log('Total remaining tokens:', totalRemaining.toString(), symbol);
  if (errors.length) {
    console.warn('Some addresses failed to query:');
    errors.forEach((e) => console.warn('-', e.address, e.error));
  }
}

main().catch((err) => {
  console.error('sync-private-sale-state error:', err);
  process.exit(1);
});
