// scripts/convert-private-sale-list.js
// Convert private sale list with dollar amounts to SAV token amounts
//
// Usage:
//   node scripts/convert-private-sale-list.js < input.txt > output.csv
//   Or paste the list directly when running the script

const readline = require('readline');

// SAV token price in USD (from contract: initialUsdtPricePerToken = 18 * 1e3 = 0.018 USD)
const SAV_PRICE_USD = 0.018;

// Token decimals (SAV uses 18 decimals)
const TOKEN_DECIMALS = 18;

function parseLine(line) {
  // Remove extra whitespace
  line = line.trim();
  if (!line) return null;
  
  // Match address and dollar amount
  // Format: 0x... $ XX.XX or 0x... XX.XX
  const match = line.match(/^(0x[a-fA-F0-9]{40})\s+\$?\s*([\d.]+)/);
  if (!match) {
    // Try to match lines with just dollar amount (missing address)
    const dollarMatch = line.match(/\$\s*([\d.]+)/);
    if (dollarMatch) {
      return { address: null, usd: parseFloat(dollarMatch[1]) };
    }
    return null;
  }
  
  const address = match[1].toLowerCase();
  const usd = parseFloat(match[2]);
  
  return { address, usd };
}

function usdToSavTokens(usdAmount) {
  // Calculate tokens: USD amount / price per token
  const tokens = usdAmount / SAV_PRICE_USD;
  // Convert to wei (18 decimals)
  return tokens * Math.pow(10, TOKEN_DECIMALS);
}

function formatTokens(tokens) {
  // Format as string with full precision for blockchain (no scientific notation)
  // Use BigInt for large numbers to avoid precision issues
  const tokensBigInt = BigInt(Math.floor(tokens));
  return tokensBigInt.toString();
}

async function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
  });

  const entries = [];
  
  console.error('Reading input...');
  console.error(`Using SAV price: $${SAV_PRICE_USD} per token\n`);

  for await (const line of rl) {
    const parsed = parseLine(line);
    if (parsed && parsed.usd > 0) {
      entries.push(parsed);
    }
  }

  // Output CSV format: address,amount (in wei)
  console.log('address,amount');
  
  let totalUsd = 0;
  let totalTokens = 0;
  let validEntries = 0;
  let invalidEntries = 0;

  for (const entry of entries) {
    if (!entry.address) {
      invalidEntries++;
      continue;
    }
    
    const tokens = usdToSavTokens(entry.usd);
    const tokensFormatted = formatTokens(tokens);
    
    console.log(`${entry.address},${tokensFormatted}`);
    
    totalUsd += entry.usd;
    totalTokens += tokens;
    validEntries++;
  }

  // Summary
  console.error('\n========================================');
  console.error('CONVERSION SUMMARY');
  console.error('========================================');
  console.error(`Valid entries: ${validEntries}`);
  console.error(`Invalid entries (missing address): ${invalidEntries}`);
  console.error(`Total USD: $${totalUsd.toFixed(2)}`);
  console.error(`Total SAV tokens: ${(totalTokens / Math.pow(10, TOKEN_DECIMALS)).toFixed(2)}`);
  console.error(`Price used: $${SAV_PRICE_USD} per token`);
  console.error('========================================');
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});

