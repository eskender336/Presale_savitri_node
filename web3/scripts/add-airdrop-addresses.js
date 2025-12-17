// Script to add addresses and balances to token-balances.csv
// Usage: node web3/scripts/add-airdrop-addresses.js
const fs = require('fs');
const path = require('path');
const { ethers } = require('ethers');

const CSV_PATH = path.join(__dirname, '../../data/token-balances.csv');
const TOKEN_DECIMALS = 18; // Standard ERC20 decimals

// Addresses and balances from the image
// Note: The image shows truncated addresses, so you'll need to provide full addresses
// Format: { address: '0x...', balance: number } where balance is in whole tokens
const NEW_ADDRESSES = [
  // Group 1: 7 addresses with balance 20
  // Add full addresses here - example format:
  // { address: '0xc73961f...', balance: 20 },
  
  // Group 2: 8 addresses with balance 12.5
  // { address: '0x467be40...', balance: 12.5 },
  
  // Group 3: 24 addresses with balance 6
  // { address: '0xf12b291...', balance: 6 },
  
  // Group 4: 39 addresses with balance 5
  // { address: '0x7f5a17e...', balance: 5 },
  
  // Group 5: 40 addresses with balance 3.5
  // { address: '0x1d04e42...', balance: 3.5 },
];

function convertBalanceToWei(balance) {
  // Convert decimal balance to wei (smallest unit)
  // balance can be a number like 20, 12.5, 6, 5, 3.5
  return ethers.utils.parseUnits(balance.toString(), TOKEN_DECIMALS).toString();
}

function addAddressesToCsv(addresses) {
  if (!fs.existsSync(CSV_PATH)) {
    // Create new CSV with header
    fs.writeFileSync(CSV_PATH, 'walletAddress,tokenBalance\n', 'utf8');
  }
  
  const csvContent = fs.readFileSync(CSV_PATH, 'utf8');
  const lines = csvContent.trim().split('\n');
  const existingAddresses = new Set();
  
  // Collect existing addresses (skip header)
  for (let i = 1; i < lines.length; i++) {
    const [addr] = lines[i].split(',').map(s => s.trim());
    if (addr && ethers.utils.isAddress(addr)) {
      existingAddresses.add(ethers.utils.getAddress(addr).toLowerCase());
    }
  }
  
  let added = 0;
  let skipped = 0;
  const newLines = [];
  
  for (const { address, balance } of addresses) {
    if (!address || !ethers.utils.isAddress(address)) {
      console.warn(`[add-airdrop] Invalid address: ${address}`);
      skipped++;
      continue;
    }
    
    const normalizedAddr = ethers.utils.getAddress(address);
    const addrLower = normalizedAddr.toLowerCase();
    
    if (existingAddresses.has(addrLower)) {
      console.log(`[add-airdrop] Address already exists: ${normalizedAddr}`);
      skipped++;
      continue;
    }
    
    const balanceWei = convertBalanceToWei(balance);
    newLines.push(`${normalizedAddr},${balanceWei}`);
    existingAddresses.add(addrLower);
    added++;
  }
  
  if (newLines.length > 0) {
    const appendContent = newLines.join('\n') + '\n';
    fs.appendFileSync(CSV_PATH, appendContent, 'utf8');
    console.log(`[add-airdrop] Added ${added} new addresses to ${CSV_PATH}`);
  } else {
    console.log(`[add-airdrop] No new addresses to add`);
  }
  
  if (skipped > 0) {
    console.log(`[add-airdrop] Skipped ${skipped} addresses (invalid or duplicate)`);
  }
  
  return { added, skipped };
}

// Main execution
if (require.main === module) {
  if (NEW_ADDRESSES.length === 0) {
    console.error('[add-airdrop] No addresses provided. Please edit this script and add addresses to NEW_ADDRESSES array.');
    process.exit(1);
  }
  
  const result = addAddressesToCsv(NEW_ADDRESSES);
  console.log(`[add-airdrop] Done. Added: ${result.added}, Skipped: ${result.skipped}`);
}

module.exports = { addAddressesToCsv, convertBalanceToWei };



