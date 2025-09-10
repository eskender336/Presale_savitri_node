// scripts/set.sale.start.js
// Sets TokenICO.saleStartTime to a target timestamp (default: 2025-09-15 00:00:00 UTC)
// and verifies the current price equals the initial price until that date.
//
// Env vars:
//   ICO_ADDRESS or NEXT_PUBLIC_TOKEN_ICO_ADDRESS  – required
//   EXPECTED_CHAIN_ID=56                          – optional (default 56)
//   GAS_PRICE_GWEI=10                             – optional
//   GAS_LIMIT=150000                               – optional
//
// CLI overrides:
//   --timestamp <unix_seconds>    Set an explicit timestamp
//   --date "YYYY-MM-DD[ HH:MM:SS]Z"  Parse a date to timestamp (UTC assumed w/ Z)
//
// Examples:
//   npx hardhat run scripts/set.sale.start.js --network bsc
//   npx hardhat run scripts/set.sale.start.js --network bsc --timestamp 1757894400
//   npx hardhat run scripts/set.sale.start.js --network bsc --date "2025-09-15 00:00:00Z"

const hre = require("hardhat");
require("dotenv").config();

const { ethers } = hre;

function now() { return new Date().toISOString(); }

async function waitFor(txPromise, label = "tx") {
  const tx = await txPromise;
  console.log(`[${now()}] → sent ${label}: ${tx.hash}`);
  console.time(`⏱ ${label}`);
  const rcpt = await tx.wait(1);
  console.timeEnd(`⏱ ${label}`);
  console.log(`[${now()}] ✓ mined ${label}: block=${rcpt.blockNumber} gasUsed=${rcpt.gasUsed?.toString()}`);
  return rcpt;
}

function parseArgs(argv) {
  const args = { timestamp: undefined, date: undefined };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--timestamp") args.timestamp = argv[++i];
    else if (a === "--date") args.date = argv[++i];
  }
  return args;
}

function parseDateToTimestamp(dateStr) {
  // Expecting an ISO-like string; if no timezone provided, treat as UTC by appending 'Z'
  let s = (dateStr || "").trim();
  if (!s) throw new Error("--date requires a value");
  if (!/[zZ]|[\+\-]\d{2}:?\d{2}$/.test(s)) s += "Z"; // add Z if missing tz
  const ms = Date.parse(s);
  if (Number.isNaN(ms)) throw new Error(`Invalid date: ${dateStr}`);
  return Math.floor(ms / 1000);
}

async function main() {
  const [signer] = await ethers.getSigners();

  // Network guard
  const expectedChainId = parseInt(process.env.EXPECTED_CHAIN_ID || "56", 10);
  const net = await ethers.provider.getNetwork();
  console.log("== Set sale start time ==");
  console.log("Network:", net.chainId, "(expected:", expectedChainId + ")");
  if (net.chainId !== expectedChainId) {
    console.log(`⚠️  Warning: connected chainId=${net.chainId}, expected=${expectedChainId}`);
  }

  // Addresses
  const ICO_ADDRESS = process.env.ICO_ADDRESS || process.env.NEXT_PUBLIC_TOKEN_ICO_ADDRESS;
  if (!ICO_ADDRESS || !ethers.utils.isAddress(ICO_ADDRESS)) {
    throw new Error("ICO_ADDRESS (or NEXT_PUBLIC_TOKEN_ICO_ADDRESS) not set or invalid");
  }

  // Gas overrides
  const GAS_PRICE_GWEI = process.env.GAS_PRICE_GWEI || "10";
  const GAS_LIMIT = parseInt(process.env.GAS_LIMIT || "150000", 10);
  const overrides = {
    gasPrice: ethers.utils.parseUnits(GAS_PRICE_GWEI, "gwei"),
    gasLimit: GAS_LIMIT,
  };

  // Determine target timestamp
  const argv = parseArgs(process.argv.slice(2));
  let targetTs;
  if (argv.timestamp) {
    targetTs = parseInt(argv.timestamp, 10);
    if (!Number.isFinite(targetTs) || targetTs <= 0) throw new Error("--timestamp must be a positive integer");
  } else if (argv.date) {
    targetTs = parseDateToTimestamp(argv.date);
  } else {
    // Default: 2025-09-15 00:00:00 UTC
    targetTs = 1757894400;
  }

  console.log("Signer:", signer.address);
  console.log("ICO:", ICO_ADDRESS);
  console.log("Target saleStartTime:", targetTs, new Date(targetTs * 1000).toISOString());
  console.log("Overrides:", { gasPriceGwei: GAS_PRICE_GWEI, gasLimit: GAS_LIMIT });

  const ico = await ethers.getContractAt("TokenICO", ICO_ADDRESS);

  // Optional owner check
  const owner = await ico.owner().catch(() => undefined);
  if (owner && owner.toLowerCase() !== signer.address.toLowerCase()) {
    console.log(`⚠️  You are not the owner. owner=${owner}, you=${signer.address}`);
  }

  // Read current info
  const oldStart = await ico.saleStartTime();
  const initialPrice = await ico.initialUsdtPricePerToken();
  const priceBefore = await ico.getCurrentPrice(ethers.constants.AddressZero);
  console.log("Current saleStartTime:", oldStart.toString());
  console.log("Initial USDT price per token:", initialPrice.toString());
  console.log("Price BEFORE:", priceBefore.toString());

  // Set new start time
  await waitFor(ico.setSaleStartTime(targetTs, overrides), "setSaleStartTime");

  // Verify
  const newStart = await ico.saleStartTime();
  const priceAfter = await ico.getCurrentPrice(ethers.constants.AddressZero);
  const [currentPrice, nextPrice, stage] = await ico.getPriceInfo(ethers.constants.AddressZero);
  console.log("New saleStartTime:", newStart.toString());
  console.log("Price AFTER:", priceAfter.toString());
  console.log("getPriceInfo:", {
    currentPrice: currentPrice.toString(),
    nextPrice: nextPrice.toString(),
    stage: stage.toString(),
  });

  const nowTs = Math.floor(Date.now() / 1000);
  if (nowTs < targetTs) {
    if (priceAfter.toString() !== initialPrice.toString()) {
      console.log("⚠️  Warning: priceAfter != initial price while start is in the future.");
    } else {
      console.log("✅ Price is at initial value until the start date.");
    }
  } else {
    console.log("ℹ️  Target start time is in the past; price increments may already apply.");
  }
}

main().then(() => process.exit(0)).catch((err) => {
  console.error("❌ set.sale.start failed:", err);
  process.exit(1);
});

