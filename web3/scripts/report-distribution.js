/*
  report-distribution.js

  Computes total tokens distributed to users by scanning ERC20 Transfer events
  from:
    - the ICO contract address (sale transfers on purchase), and
    - one or more owner/admin wallets (airdrop or manual distributions)

  This helps reconcile why tokensSold (on-chain sale counter) may be small
  while many tokens have been distributed off-contract via airdrops.

  Usage:
    node scripts/report-distribution.js --from 0 --to latest
    node scripts/report-distribution.js --from 5500000 --to latest --json

  Env (web3/.env or project .env.local):
    - NETWORK_RPC_URL (or NEXT_PUBLIC_RPC_URL)
    - NEXT_PUBLIC_TOKEN_ICO_ADDRESS (or ICO_ADDRESS)
    - SALE_TOKEN_ADDRESS (optional; if missing, will read saleToken() from ICO)
    - OWNER_ADDRESSES / ADMIN_ADDRESSES (comma/space-separated list) optional
      Fallback to NEXT_PUBLIC_OWNER_ADDRESS if provided
*/

require('dotenv').config({ path: __dirname + '/../.env' });
try { require('dotenv').config({ path: __dirname + '/../../.env.local' }); } catch (_) {}
const { ethers } = require('ethers');

function parseAddrList(s) {
  if (!s) return [];
  return String(s).split(/[\s,;]+/).map(x => x.trim()).filter(Boolean);
}

function parseArgs(argv) {
  const args = { from: 0, to: 'latest', chunk: 2000, json: false };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    const n = argv[i + 1];
    if (a === '--from' || a === '--from-block') { args.from = n === 'latest' ? 'latest' : parseInt(n, 10); i++; }
    else if (a === '--to' || a === '--to-block') { args.to = n === 'latest' ? 'latest' : parseInt(n, 10); i++; }
    else if (a === '--chunk') { args.chunk = Math.max(100, parseInt(n, 10) || args.chunk); i++; }
    else if (a === '--json') { args.json = true; }
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv);
  const RPC = process.env.NETWORK_RPC_URL || process.env.NEXT_PUBLIC_RPC_URL;
  const ICO = process.env.NEXT_PUBLIC_TOKEN_ICO_ADDRESS || process.env.ICO_ADDRESS || process.env.CONTRACT_ADDRESS;
  const TOKEN_ADDR_ENV =
    process.env.SALE_TOKEN_ADDRESS ||
    process.env.SAV_ADDRESS ||
    process.env.NEXT_PUBLIC_SAV_ADDRESS ||
    '';
  const OWNER_ADDRS = parseAddrList(process.env.OWNER_ADDRESSES || process.env.ADMIN_ADDRESSES || process.env.NEXT_PUBLIC_OWNER_ADDRESS || '');
  if (!RPC || !ICO) throw new Error('Missing env: NETWORK_RPC_URL and NEXT_PUBLIC_TOKEN_ICO_ADDRESS');

  const provider = new ethers.providers.JsonRpcProvider(RPC);
  const icoAbi = require('../artifacts/contracts/TokenICO.sol/TokenICO.json').abi;
  const erc20Iface = new ethers.utils.Interface([
    'event Transfer(address indexed from, address indexed to, uint256 value)'
  ]);

  const ico = new ethers.Contract(ICO, icoAbi, provider);
  const saleToken = TOKEN_ADDR_ENV || await ico.saleToken();
  if (!saleToken || saleToken === ethers.constants.AddressZero) throw new Error('Sale token address not set');

  const net = await provider.getNetwork();
  const tokenAddr = saleToken.toLowerCase();
  const adminSet = new Set([ICO.toLowerCase(), ...OWNER_ADDRS.map(a => a.toLowerCase())].filter(Boolean));

  const latest = await provider.getBlockNumber();
  const fromBlock = args.from === 'latest' ? latest : Math.max(0, args.from|0);
  const toBlock = args.to === 'latest' ? latest : Math.min(latest, args.to|0 || latest);

  let cursor = fromBlock;
  let chunk = args.chunk;
  const minChunk = 200;
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  const topic = erc20Iface.getEventTopic('Transfer');
  let totalFromIco = ethers.BigNumber.from(0);
  let totalFromOwners = ethers.BigNumber.from(0);

  while (cursor <= toBlock) {
    const end = Math.min(toBlock, cursor + chunk - 1);
    const filter = {
      address: tokenAddr,
      topics: [ topic ],
      fromBlock: cursor,
      toBlock: end,
    };
    try {
      const logs = await provider.getLogs(filter);
      for (const log of logs) {
        try {
          const parsed = erc20Iface.parseLog(log);
          const from = (parsed.args.from || '').toLowerCase();
          const to = (parsed.args.to || '').toLowerCase();
          const value = parsed.args.value;
          if (from === ICO.toLowerCase()) {
            totalFromIco = totalFromIco.add(value);
          } else if (adminSet.has(from) && !adminSet.has(to)) {
            // Count owner/admin outgoing transfers to non-admin addresses
            totalFromOwners = totalFromOwners.add(value);
          }
        } catch (_) { /* ignore */ }
      }
      if (!args.json) console.log(`Scanned blocks ${cursor}-${end} (${logs.length} events)`);
      cursor = end + 1;
    } catch (e) {
      const msg = (e && e.message) || '';
      const body = (e && e.body) || '';
      if (/limit exceeded|-32005|timeout|503|429/i.test(msg + ' ' + body) && chunk > minChunk) {
        const newChunk = Math.max(minChunk, Math.floor(chunk / 2));
        if (!args.json) console.warn(`Rate limited at ${cursor}-${end}. Reducing chunk ${chunk} -> ${newChunk}`);
        chunk = newChunk;
        await sleep(750);
        continue;
      }
      throw e;
    }
  }

  // Get decimals for formatting
  const erc20Meta = new ethers.utils.Interface([
    'function decimals() view returns (uint8)',
    'function symbol() view returns (string)'
  ]);
  const token = new ethers.Contract(tokenAddr, erc20Meta, provider);
  const [dec, sym] = await Promise.all([
    token.decimals().catch(() => 18),
    token.symbol().catch(() => 'SALE'),
  ]);

  const fmt = (bn) => Number(ethers.utils.formatUnits(bn, dec));
  const report = {
    network: { chainId: net.chainId, name: net.name },
    token: { address: tokenAddr, symbol: sym, decimals: dec },
    icoAddress: ICO,
    ownerAddresses: OWNER_ADDRS,
    scanned: { fromBlock, toBlock },
    fromIco: { raw: totalFromIco.toString(), formatted: fmt(totalFromIco) },
    fromOwners: { raw: totalFromOwners.toString(), formatted: fmt(totalFromOwners) },
    totalDistributed: { raw: totalFromIco.add(totalFromOwners).toString(), formatted: fmt(totalFromIco.add(totalFromOwners)) },
    note: 'Includes ICO-outgoing transfers (purchases) and owner/admin outgoing transfers to non-admins (airdrops). Not equal to tokensSold, and does not imply USD raised.'
  };

  if (args.json) console.log(JSON.stringify(report, null, 2));
  else {
    console.log('Network:', report.network.chainId, report.network.name);
    console.log('Token:', report.token.symbol, report.token.address);
    console.log('ICO address:', report.icoAddress);
    if (OWNER_ADDRS.length) console.log('Owner/admin addresses:', OWNER_ADDRS.join(', '));
    console.log(`Blocks scanned: ${fromBlock}-${toBlock}`);
    console.log(`From ICO transfers: ${report.fromIco.formatted} ${sym}`);
    console.log(`From owners transfers: ${report.fromOwners.formatted} ${sym}`);
    console.log(`Total distributed: ${report.totalDistributed.formatted} ${sym}`);
  }
}

main().catch((e) => { console.error('Error:', e); process.exit(1); });
