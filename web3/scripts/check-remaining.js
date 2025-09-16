// Reports remaining token allocation and on-contract balances
require('dotenv').config({ path: __dirname + '/../.env' });
try { require('dotenv').config({ path: __dirname + '/../../.env.local' }); } catch (_) {}
const { ethers } = require('ethers');

async function main() {
  const RPC = process.env.NETWORK_RPC_URL || process.env.NEXT_PUBLIC_RPC_URL;
  const ICO = process.env.NEXT_PUBLIC_TOKEN_ICO_ADDRESS || process.env.ICO_ADDRESS || process.env.CONTRACT_ADDRESS;
  if (!RPC || !ICO) throw new Error('Missing env: NETWORK_RPC_URL and NEXT_PUBLIC_TOKEN_ICO_ADDRESS');

  const provider = new ethers.providers.JsonRpcProvider(RPC);
  const icoAbi = require('../artifacts/contracts/TokenICO.sol/TokenICO.json').abi;
  const erc20Abi = [
    'function decimals() view returns (uint8)',
    'function symbol() view returns (string)',
    'function balanceOf(address) view returns (uint256)'
  ];

  const ico = new ethers.Contract(ICO, icoAbi, provider);

  const [totalCap, wlCap, sold, wlSold, saleToken, totalStaked] = await Promise.all([
    ico.TOTAL_TOKENS_FOR_SALE(),
    ico.WAITLIST_ALLOCATION(),
    ico.tokensSold(),
    ico.waitlistSold(),
    ico.saleToken(),
    ico.totalStaked().catch(() => ethers.BigNumber.from(0)),
  ]);

  const token = new ethers.Contract(saleToken, erc20Abi, provider);
  const [dec, sym, balIco, net] = await Promise.all([
    token.decimals().catch(() => 18),
    token.symbol().catch(() => 'SALE'),
    token.balanceOf(ICO),
    provider.getNetwork(),
  ]);

  const fmt = (bn) => ethers.utils.formatUnits(bn, dec);

  const pubCap = totalCap.sub(wlCap);
  const pubSold = sold.sub(wlSold);

  const totalRemaining = totalCap.sub(sold);
  const waitlistRemaining = wlCap.sub(wlSold);
  const publicRemaining = pubCap.sub(pubSold);

  console.log('Network:', net.chainId, net.name);
  console.log('ICO:', ICO);
  console.log('Sale token:', saleToken);
  console.log('Symbol/decimals:', sym, dec);
  console.log('--- Allocation (formatted) ---');
  console.log('Total for sale:', fmt(totalCap), sym);
  console.log('  - Waitlist cap:', fmt(wlCap), sym);
  console.log('  - Public cap  :', fmt(pubCap), sym);
  console.log('Sold total     :', fmt(sold), sym);
  console.log('  - Waitlist sold:', fmt(wlSold), sym);
  console.log('  - Public sold  :', fmt(pubSold), sym);
  console.log('Remaining total:', fmt(totalRemaining), sym);
  console.log('  - Waitlist remaining:', fmt(waitlistRemaining), sym);
  console.log('  - Public remaining  :', fmt(publicRemaining), sym);
  console.log('--- Balances ---');
  console.log('ICO token balance:', fmt(balIco), sym);
  console.log('Total staked     :', fmt(totalStaked), sym);
  const maxWithdrawable = balIco.sub(totalStaked.lt(balIco) ? totalStaked : balIco);
  console.log('Max withdrawable :', fmt(maxWithdrawable), sym);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

