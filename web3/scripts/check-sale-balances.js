// Prints sale token info and balances for ICO contract and admin wallet
require('dotenv').config({ path: __dirname + '/../.env' });
const { ethers } = require('ethers');
const { requirePrivateKey } = require('./utils/loadPrivateKey');

async function main() {
  const RPC = process.env.NETWORK_RPC_URL;
  // Load private key from secure location (.secrets/private-key or env var)
  const PK = requirePrivateKey();
  const ICO = process.env.NEXT_PUBLIC_TOKEN_ICO_ADDRESS || process.env.ICO_ADDRESS;
  if (!RPC || !ICO) throw new Error('Missing env: NETWORK_RPC_URL / ICO_ADDRESS');

  const provider = new ethers.providers.JsonRpcProvider(RPC);
  const wallet = new ethers.Wallet(PK, provider);
  const me = await wallet.getAddress();

  const icoAbi = require('../artifacts/contracts/TokenICO.sol/TokenICO.json').abi;
  const erc20Abi = [
    'function decimals() view returns (uint8)',
    'function symbol() view returns (string)',
    'function balanceOf(address) view returns (uint256)'
  ];

  const ico = new ethers.Contract(ICO, icoAbi, wallet);
  const sale = await ico.saleToken();
  if (!sale || sale === ethers.constants.AddressZero) {
    console.log('saleToken not set on ICO');
    return;
  }

  const token = new ethers.Contract(sale, erc20Abi, wallet);
  const [dec, sym, balIco, balMe, totalStaked] = await Promise.all([
    token.decimals(),
    token.symbol().catch(() => 'SALE'),
    token.balanceOf(ICO),
    token.balanceOf(me),
    ico.totalStaked().catch(() => ethers.BigNumber.from(0))
  ]);

  const fmt = (bn) => ethers.utils.formatUnits(bn, dec);
  console.log('Network:', (await provider.getNetwork()).chainId);
  console.log('Sale token:', sale);
  console.log('Symbol/decimals:', sym, dec);
  console.log('ICO token balance:', fmt(balIco), sym);
  console.log('Admin token balance:', fmt(balMe), sym);
  console.log('Total staked (locked):', fmt(totalStaked), sym);
  console.log('Max withdrawable from ICO now (approx):', fmt(balIco.sub(totalStaked.lt(balIco) ? totalStaked : balIco)), sym);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

