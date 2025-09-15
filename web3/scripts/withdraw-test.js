// Test withdraw: pulls a small amount of sale tokens (SAV) from the ICO
// into the admin wallet (owner), using PRIVATE_KEY from web3/.env.
//
// Usage:
//   node web3/scripts/withdraw-test.js --amount 1.23
// If --amount is omitted, defaults to 1.0 token (respecting sale token decimals).
//
require('dotenv').config({ path: __dirname + '/../.env' });
const { ethers } = require('ethers');

async function main() {
  const RPC = process.env.RPC_WS_URL || process.env.NETWORK_RPC_URL;
  const PK = process.env.PRIVATE_KEY;
  const ICO_ADDR = process.env.NEXT_PUBLIC_TOKEN_ICO_ADDRESS || process.env.ICO_ADDRESS;
  if (!RPC) throw new Error('Missing RPC (RPC_WS_URL or NETWORK_RPC_URL)');
  if (!PK) throw new Error('Missing PRIVATE_KEY');
  if (!ICO_ADDR) throw new Error('Missing ICO address (NEXT_PUBLIC_TOKEN_ICO_ADDRESS or ICO_ADDRESS)');

  // Parse args
  const argv = process.argv.slice(2);
  const getArg = (flag, def) => {
    const i = argv.indexOf(flag);
    if (i >= 0 && i + 1 < argv.length) return argv[i + 1];
    const eq = argv.find((a) => a.startsWith(flag + '='));
    if (eq) return eq.split('=')[1];
    return def;
  };
  const amountStr = getArg('--amount', '1');

  // Provider
  const isWs = /^wss?:\/\//i.test(RPC);
  const provider = isWs
    ? new ethers.providers.WebSocketProvider(RPC)
    : new ethers.providers.JsonRpcProvider(RPC);
  const wallet = new ethers.Wallet(PK, provider);
  const me = await wallet.getAddress();

  // ABIs
  const icoAbi = require('../artifacts/contracts/TokenICO.sol/TokenICO.json').abi;
  const erc20Abi = [
    'function decimals() view returns (uint8)',
    'function symbol() view returns (string)',
    'function balanceOf(address) view returns (uint256)'
  ];

  const ico = new ethers.Contract(ICO_ADDR, icoAbi, wallet);

  // Resolve sale token
  const saleTokenAddr = await ico.saleToken();
  if (!saleTokenAddr || saleTokenAddr === ethers.constants.AddressZero) {
    throw new Error('saleToken not configured on ICO');
  }
  const saleToken = new ethers.Contract(saleTokenAddr, erc20Abi, wallet);
  const [decimals, symbol] = await Promise.all([
    saleToken.decimals(),
    saleToken.symbol().catch(() => 'SALE'),
  ]);

  const fmt = (bn) => ethers.utils.formatUnits(bn, decimals);
  const parse = (s) => ethers.utils.parseUnits(String(s), decimals);

  const [balIco, balMe] = await Promise.all([
    saleToken.balanceOf(ICO_ADDR),
    saleToken.balanceOf(me),
  ]);
  let totalStaked = ethers.BigNumber.from(0);
  try { totalStaked = await ico.totalStaked(); } catch (_) {}

  const available = balIco.gt(totalStaked) ? balIco.sub(totalStaked) : ethers.BigNumber.from(0);
  const desired = parse(amountStr);
  if (available.isZero()) {
    console.log('[withdraw] No available balance in ICO (all staked or zero).');
    return;
  }
  const toWithdraw = desired.lte(available) ? desired : available;

  console.log('[withdraw] Network', (await provider.getNetwork()).chainId);
  console.log('[withdraw] ICO', ICO_ADDR);
  console.log('[withdraw] Admin', me);
  console.log('[withdraw] Token', saleTokenAddr, symbol, 'decimals', decimals);
  console.log('[withdraw] ICO balance:', fmt(balIco), symbol, '| totalStaked:', fmt(totalStaked));
  console.log('[withdraw] Admin balance:', fmt(balMe), symbol);
  console.log('[withdraw] Available to withdraw:', fmt(available), symbol);
  console.log('[withdraw] Attempting to withdraw:', fmt(toWithdraw), symbol);

  const tx = await ico.withdrawTokens(saleTokenAddr, toWithdraw);
  console.log('[withdraw] tx:', tx.hash);
  const rc = await tx.wait();
  console.log('[withdraw] confirmed in block', rc.blockNumber);

  const [balIco2, balMe2] = await Promise.all([
    saleToken.balanceOf(ICO_ADDR),
    saleToken.balanceOf(me),
  ]);
  console.log('[withdraw] New ICO balance:', fmt(balIco2), symbol);
  console.log('[withdraw] New Admin balance:', fmt(balMe2), symbol);
}

main().catch((e) => {
  console.error('[withdraw] Fatal:', e);
  process.exit(1);
});

