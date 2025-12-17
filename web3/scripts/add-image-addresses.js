// Script to add addresses from the image to token-balances.csv
// This script adds addresses with their balances based on the image data
const fs = require('fs');
const path = require('path');
const { ethers } = require('ethers');

const CSV_PATH = path.join(__dirname, '../../data/token-balances.csv');
const TOKEN_DECIMALS = 18;

// Balance conversions (in wei - smallest unit)
const BALANCES = {
  20: '20000000000000000000',
  '12.5': '12500000000000000000',
  '12,5': '12500000000000000000', // Handle comma decimal separator
  6: '6000000000000000000',
  5: '5000000000000000000',
  '3.5': '3500000000000000000',
  '3,5': '3500000000000000000', // Handle comma decimal separator
};

// NOTE: The image shows truncated addresses. You need to provide the full addresses.
// Replace the arrays below with the actual full addresses from your image.
// The addresses in the image appear to be truncated (e.g., "0xc73961f" instead of full 0x... format)

// Group 1: 7 addresses with balance 20
const ADDRESSES_20 = [
  // Add 7 full addresses here, example:
  // '0xc73961f...', // Replace ... with full address
];

// Group 2: 8 addresses with balance 12.5
const ADDRESSES_12_5 = [
  // Add 8 full addresses here
];

// Group 3: 24 addresses with balance 6
const ADDRESSES_6 = [
  // Add 24 full addresses here
];

// Group 4: 39 addresses with balance 5
const ADDRESSES_5 = [
  // Add 39 full addresses here
];

// Group 5: 40 addresses with balance 3.5
const ADDRESSES_3_5 = [
  // Add 40 full addresses here
];

function addAddressesToCsv(addressGroups) {
  if (!fs.existsSync(CSV_PATH)) {
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
  
  let totalAdded = 0;
  let totalSkipped = 0;
  const newLines = [];
  
  for (const { addresses, balance } of addressGroups) {
    const balanceWei = BALANCES[balance] || ethers.utils.parseUnits(balance.toString().replace(',', '.'), TOKEN_DECIMALS).toString();
    
    for (const addr of addresses) {
      if (!addr || !ethers.utils.isAddress(addr)) {
        console.warn(`[add-image] Invalid address: ${addr}`);
        totalSkipped++;
        continue;
      }
      
      const normalizedAddr = ethers.utils.getAddress(addr);
      const addrLower = normalizedAddr.toLowerCase();
      
      if (existingAddresses.has(addrLower)) {
        console.log(`[add-image] Address already exists: ${normalizedAddr}`);
        totalSkipped++;
        continue;
      }
      
      newLines.push(`${normalizedAddr},${balanceWei}`);
      existingAddresses.add(addrLower);
      totalAdded++;
    }
  }
  
  if (newLines.length > 0) {
    const appendContent = newLines.join('\n') + '\n';
    fs.appendFileSync(CSV_PATH, appendContent, 'utf8');
    console.log(`[add-image] Added ${totalAdded} new addresses to ${CSV_PATH}`);
  } else {
    console.log(`[add-image] No new addresses to add`);
  }
  
  if (totalSkipped > 0) {
    console.log(`[add-image] Skipped ${totalSkipped} addresses (invalid or duplicate)`);
  }
  
  return { added: totalAdded, skipped: totalSkipped };
}

// Main execution
if (require.main === module) {
  const addressGroups = [
    { addresses: ADDRESSES_20, balance: 20 },
    { addresses: ADDRESSES_12_5, balance: '12.5' },
    { addresses: ADDRESSES_6, balance: 6 },
    { addresses: ADDRESSES_5, balance: 5 },
    { addresses: ADDRESSES_3_5, balance: '3.5' },
  ];
  
  const totalAddresses = addressGroups.reduce((sum, g) => sum + g.addresses.length, 0);
  
  if (totalAddresses === 0) {
    console.error('[add-image] No addresses provided. Please edit this script and add addresses to the arrays.');
    console.error('[add-image] Expected: 7 addresses with balance 20, 8 with 12.5, 24 with 6, 39 with 5, 40 with 3.5');
    process.exit(1);
  }
  
  console.log(`[add-image] Processing ${totalAddresses} addresses...`);
  const result = addAddressesToCsv(addressGroups);
  console.log(`[add-image] Done. Added: ${result.added}, Skipped: ${result.skipped}`);
}

module.exports = { addAddressesToCsv, BALANCES };



