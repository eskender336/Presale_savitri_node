#!/usr/bin/env node
/**
 * Generate SHA256 hash for CSV file
 * Usage: node generate-csv-hash.js [path/to/file.csv]
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const csvPath = process.argv[2] || path.join(__dirname, '../../data/token-balances.csv');

if (!fs.existsSync(csvPath)) {
  console.error('Error: CSV file not found:', csvPath);
  process.exit(1);
}

const csvText = fs.readFileSync(csvPath, 'utf8');
const hash = crypto.createHash('sha256').update(csvText).digest('hex');

console.log('CSV File:', csvPath);
console.log('SHA256 Hash:', hash);
console.log('');
console.log('Add to web3/.env:');
console.log('CSV_HASH=' + hash);

