// Script to import addresses and balances from a text file
// Format: address,balance (one per line, or space-separated)
// Usage: node web3/scripts/import-private-sale-data.js [input-file.txt]
const fs = require('fs');
const path = require('path');
const { ethers } = require('ethers');

const CSV_PATH = path.join(__dirname, '../../data/token-balances.csv');
const TOKEN_DECIMALS = 18;

function convertBalanceToWei(balance) {
  // Handle both integer and decimal balances
  const num = parseFloat(balance.toString().replace(',', '.'));
  if (isNaN(num) || num <= 0) {
    throw new Error(`Invalid balance: ${balance}`);
  }
  return ethers.utils.parseUnits(num.toFixed(18), TOKEN_DECIMALS).toString();
}

function parseInputFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const addresses = [];
  
  for (const line of lines) {
    // Try comma-separated first
    let parts = line.split(',').map(s => s.trim());
    if (parts.length < 2) {
      // Try space-separated
      parts = line.split(/\s+/).filter(Boolean);
    }
    
    if (parts.length < 2) continue;
    
    const [addr, balance] = parts;
    if (!addr || !balance) continue;
    
    // Validate address
    if (!ethers.utils.isAddress(addr)) {
      console.warn(`[import] Invalid address: ${addr}`);
      continue;
    }
    
    addresses.push({
      address: ethers.utils.getAddress(addr),
      balance: balance
    });
  }
  
  return addresses;
}

function addAddressesToCsv(addresses) {
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
  
  let added = 0;
  let skipped = 0;
  const newLines = [];
  
  for (const { address, balance } of addresses) {
    const addrLower = address.toLowerCase();
    
    if (existingAddresses.has(addrLower)) {
      console.log(`[import] Address already exists: ${address}`);
      skipped++;
      continue;
    }
    
    try {
      const balanceWei = convertBalanceToWei(balance);
      newLines.push(`${address},${balanceWei}`);
      existingAddresses.add(addrLower);
      added++;
    } catch (error) {
      console.warn(`[import] Error processing ${address}: ${error.message}`);
      skipped++;
    }
  }
  
  if (newLines.length > 0) {
    const appendContent = newLines.join('\n') + '\n';
    fs.appendFileSync(CSV_PATH, appendContent, 'utf8');
    console.log(`[import] Added ${added} new addresses to ${CSV_PATH}`);
  } else {
    console.log(`[import] No new addresses to add`);
  }
  
  if (skipped > 0) {
    console.log(`[import] Skipped ${skipped} addresses (invalid, duplicate, or error)`);
  }
  
  return { added, skipped };
}

// Main execution
if (require.main === module) {
  const inputFile = process.argv[2] || path.join(__dirname, '../../data/private-sale-addresses.txt');
  
  if (!fs.existsSync(inputFile)) {
    console.error(`[import] Input file not found: ${inputFile}`);
    console.error(`[import] Usage: node import-private-sale-data.js [input-file.txt]`);
    console.error(`[import] Format: address,balance (one per line)`);
    process.exit(1);
  }
  
  console.log(`[import] Reading from: ${inputFile}`);
  const addresses = parseInputFile(inputFile);
  console.log(`[import] Parsed ${addresses.length} addresses`);
  
  const result = addAddressesToCsv(addresses);
  console.log(`[import] Done. Added: ${result.added}, Skipped: ${result.skipped}`);
}

module.exports = { parseInputFile, addAddressesToCsv, convertBalanceToWei };



