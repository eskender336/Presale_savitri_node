// Quick script to add addresses directly to CSV
// Usage: node quick-add-addresses.js
// Edit the ADDRESS_DATA array below with your addresses and balances
const fs = require('fs');
const path = require('path');
const { ethers } = require('ethers');

const CSV_PATH = path.join(__dirname, '../../data/token-balances.csv');
const TOKEN_DECIMALS = 18;

// Add your addresses here in format: [address, balance]
// Balance can be a number (20, 6, 5) or decimal string ('12.5', '3.5')
// Example:
// ['0x1234567890123456789012345678901234567890', 20],
// ['0xabcdefabcdefabcdefabcdefabcdefabcdefabcd', '12.5'],
const ADDRESS_DATA = [
  // Group 1: 7 addresses with balance 20
  // ['0xc73961f...', 20], // Replace ... with full address
  // Add 6 more...
  
  // Group 2: 8 addresses with balance 12.5
  // ['0x467be40...', '12.5'],
  // Add 7 more...
  
  // Group 3: 24 addresses with balance 6
  // ['0xf12b291...', 6],
  // Add 23 more...
  
  // Group 4: 39 addresses with balance 5
  // ['0x7f5a17e...', 5],
  // Add 38 more...
  
  // Group 5: 40 addresses with balance 3.5
  // ['0x1d04e42...', '3.5'],
  // Add 39 more...
];

function convertBalance(balance) {
  const num = parseFloat(balance.toString().replace(',', '.'));
  return ethers.utils.parseUnits(num.toFixed(18), TOKEN_DECIMALS).toString();
}

function addToCsv() {
  if (!fs.existsSync(CSV_PATH)) {
    fs.writeFileSync(CSV_PATH, 'walletAddress,tokenBalance\n', 'utf8');
  }
  
  const csvContent = fs.readFileSync(CSV_PATH, 'utf8');
  const existing = new Set();
  const lines = csvContent.trim().split('\n');
  
  for (let i = 1; i < lines.length; i++) {
    const [addr] = lines[i].split(',').map(s => s.trim());
    if (addr && ethers.utils.isAddress(addr)) {
      existing.add(ethers.utils.getAddress(addr).toLowerCase());
    }
  }
  
  let added = 0;
  let skipped = 0;
  const newLines = [];
  
  for (const [addr, balance] of ADDRESS_DATA) {
    if (!addr || !ethers.utils.isAddress(addr)) {
      console.warn(`Invalid: ${addr}`);
      skipped++;
      continue;
    }
    
    const normalized = ethers.utils.getAddress(addr);
    if (existing.has(normalized.toLowerCase())) {
      console.log(`Exists: ${normalized}`);
      skipped++;
      continue;
    }
    
    const balanceWei = convertBalance(balance);
    newLines.push(`${normalized},${balanceWei}`);
    existing.add(normalized.toLowerCase());
    added++;
  }
  
  if (newLines.length > 0) {
    fs.appendFileSync(CSV_PATH, newLines.join('\n') + '\n', 'utf8');
    console.log(`Added ${added} addresses`);
  }
  
  if (skipped > 0) {
    console.log(`Skipped ${skipped} addresses`);
  }
  
  return { added, skipped };
}

if (require.main === module) {
  if (ADDRESS_DATA.length === 0) {
    console.error('No addresses in ADDRESS_DATA. Please edit this file and add addresses.');
    process.exit(1);
  }
  
  const result = addToCsv();
  console.log(`Done: ${result.added} added, ${result.skipped} skipped`);
}

module.exports = { addToCsv, convertBalance };



