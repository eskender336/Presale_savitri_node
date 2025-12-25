// Update TokenICO pricing parameters (initial price and increment)
// Usage:
//   node web3/scripts/update-pricing.js --price 0.20 --increment 0.01
// Defaults: price=0.20, increment=0.01

require('dotenv').config({ path: __dirname + '/../.env' });
const { ethers } = require('ethers');
const { requirePrivateKey } = require('./utils/loadPrivateKey');

async function main() {
  const RPC = process.env.NETWORK_RPC_URL;
  // Load private key from secure location (.secrets/private-key or env var)
  const PK = requirePrivateKey();
  const ICO = process.env.NEXT_PUBLIC_TOKEN_ICO_ADDRESS || process.env.ICO_ADDRESS;
  if (!RPC) throw new Error('NETWORK_RPC_URL missing in web3/.env');
  if (!ICO) throw new Error('ICO address missing (NEXT_PUBLIC_TOKEN_ICO_ADDRESS or ICO_ADDRESS)');

  const argv = process.argv.slice(2);
  const getArg = (names, def) => {
    for (let i = 0; i < argv.length; i++) {
      if (names.includes(argv[i]) && i + 1 < argv.length) return argv[i + 1];
      const m = argv[i].match(/^(--price|--increment)=(.*)$/);
      if (m && names.includes(m[1])) return m[2];
    }
    return def;
  };
  const priceStr = getArg(['--price', '-p'], '0.20');
  const incStr = getArg(['--increment', '-i'], '0.01');

  // Contract expects USDT-style 6 decimals for price values
  const parseUsd6 = (v) => {
    const bn = ethers.utils.parseUnits(String(v), 6);
    return bn;
  };

  const newInitial = parseUsd6(priceStr);
  const newIncrement = parseUsd6(incStr);

  // Load ABI
  const abi = require('../artifacts/contracts/TokenICO.sol/TokenICO.json').abi;
  const provider = new ethers.providers.JsonRpcProvider(RPC);
  const wallet = new ethers.Wallet(PK, provider);
  const ico = new ethers.Contract(ICO, abi, wallet);

  console.log('Network:', (await provider.getNetwork()).chainId);
  console.log('ICO:', ICO);
  console.log('Setting initial price to', priceStr, 'USD');
  console.log('Setting increment to', incStr, 'USD per stage');

  // Read current
  const oldInitial = await ico.initialUsdtPricePerToken();
  const oldIncrement = await ico.usdtPriceIncrement();
  console.log('Current initial:', ethers.utils.formatUnits(oldInitial, 6));
  console.log('Current increment:', ethers.utils.formatUnits(oldIncrement, 6));

  // Send txs
  const tx1 = await ico.updateInitialUsdtPrice(newInitial);
  console.log('updateInitialUsdtPrice tx:', tx1.hash);
  await tx1.wait();

  const tx2 = await ico.updateUsdtPriceIncrement(newIncrement);
  console.log('updateUsdtPriceIncrement tx:', tx2.hash);
  await tx2.wait();

  const updatedInitial = await ico.initialUsdtPricePerToken();
  const updatedIncrement = await ico.usdtPriceIncrement();
  console.log('Updated initial:', ethers.utils.formatUnits(updatedInitial, 6));
  console.log('Updated increment:', ethers.utils.formatUnits(updatedIncrement, 6));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
