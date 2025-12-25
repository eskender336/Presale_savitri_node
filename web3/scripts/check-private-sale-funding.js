const { ethers } = require('ethers');
require('dotenv').config();

const PRIVATE_SALE_ADDRESS = process.env.PRIVATE_SALE_DISTRIBUTION_ADDRESS || '0x20d62B0659C25CF27D168E9635234179B22e10A7';
const TOKEN_ADDRESS = process.env.SAVITRI_COIN_ADDRESS || '0xbfF00512c08477E9c03DE507fCD5C9b087fe6813';
const SAFE_ADDRESS = process.env.SAFE_ADDRESS || '0xbC08bF77697271F1617728c7Cd049b596d13b3ba';
const RPC_URL = process.env.NETWORK_RPC_URL || 'https://bsc.drpc.org';

async function checkFunding() {
  // Create provider without ENS
  const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
  provider._network = { chainId: 56, name: 'bsc' }; // Override network to avoid ENS
  
  const tokenABI = [
    'function balanceOf(address) view returns (uint256)',
    'function decimals() view returns (uint8)',
    'function symbol() view returns (string)'
  ];
  
  const token = new ethers.Contract(TOKEN_ADDRESS, tokenABI, provider);
  
  console.log('========================================');
  console.log('PRIVATE SALE FUNDING CHECK');
  console.log('========================================\n');
  
  const symbol = await token.symbol();
  const decimals = await token.decimals();
  
  // Check balances
  const privateSaleBalance = await token.balanceOf(PRIVATE_SALE_ADDRESS);
  const safeBalance = await token.balanceOf(SAFE_ADDRESS);
  
  console.log('Token:', symbol);
  console.log('Address:', TOKEN_ADDRESS);
  console.log('Decimals:', decimals);
  console.log('');
  
  console.log('Current Balances:');
  console.log('  PrivateSaleDistribution:', ethers.utils.formatUnits(privateSaleBalance, decimals), symbol);
  console.log('  Safe Wallet:', ethers.utils.formatUnits(safeBalance, decimals), symbol);
  console.log('');
  
  // Calculate total needed from CSV (119 addresses)
  const totalNeeded = BigInt('1111111111111111081984') * BigInt(7) + // 7 x $20
                      BigInt('694444444444444459008') * BigInt(8) +   // 8 x $12.50
                      BigInt('333333333333333377024') * BigInt(24) +  // 24 x $6
                      BigInt('277777777777777770496') * BigInt(39) +  // 39 x $5
                      BigInt('194444444444444459008') * BigInt(40);   // 40 x $3.50
  
  const totalNeededFormatted = ethers.utils.formatUnits(totalNeeded.toString(), decimals);
  
  console.log('Total Needed (from CSV):');
  console.log('  Amount:', totalNeededFormatted, symbol);
  console.log('  In Wei:', totalNeeded.toString());
  console.log('');
  
  // Check if Safe has tokens
  if (safeBalance.gt(0)) {
    console.log('✅ Safe wallet HAS tokens');
    if (safeBalance.gte(totalNeeded)) {
      console.log('✅ Safe has ENOUGH tokens to fund the contract');
    } else {
      console.log('⚠️  Safe has tokens but NOT ENOUGH');
      const shortfall = totalNeeded.sub(safeBalance);
      console.log('   Shortfall:', ethers.utils.formatUnits(shortfall, decimals), symbol);
    }
  } else {
    console.log('⚠️  Safe wallet has NO tokens');
    console.log('   Need to transfer tokens to Safe first, or use another wallet');
  }
  
  // Check if contract already has tokens
  if (privateSaleBalance.gt(0)) {
    console.log('✅ PrivateSaleDistribution already has tokens');
    if (privateSaleBalance.gte(totalNeeded)) {
      console.log('✅ Contract already has ENOUGH tokens!');
    } else {
      const needMore = totalNeeded.sub(privateSaleBalance);
      console.log('⚠️  Contract needs more tokens');
      console.log('   Need:', ethers.utils.formatUnits(needMore, decimals), symbol);
    }
  } else {
    console.log('⚠️  PrivateSaleDistribution needs funding');
  }
  
  console.log('');
  console.log('========================================');
  console.log('FUNDING INFORMATION');
  console.log('========================================');
  console.log('');
  console.log('Who can fund?');
  console.log('  ✅ ANYONE with SAV tokens can transfer them to the contract');
  console.log('  ✅ The PrivateSaleDistribution contract does NOT restrict who can send tokens');
  console.log('  ✅ You just need to call: token.transfer(contractAddress, amount)');
  console.log('');
  console.log('Recommended: Use Safe wallet to transfer (if Safe owns the tokens)');
  console.log('  This ensures multisig approval for the transfer');
  console.log('');
  console.log('To fund via Safe:');
  console.log('  1. Go to https://app.safe.global/');
  console.log('  2. Connect your Safe wallet');
  console.log('  3. Create new transaction');
  console.log('  4. Contract:', TOKEN_ADDRESS);
  console.log('  5. Function: transfer');
  console.log('  6. Parameters:');
  console.log('     - to:', PRIVATE_SALE_ADDRESS);
  console.log('     - amount:', totalNeeded.toString());
  console.log('  7. Get signatures and execute');
  console.log('');
  console.log('Or use this script to generate Safe transaction JSON');
}

checkFunding().catch(console.error);

