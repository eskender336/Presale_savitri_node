// scripts/sendNative.js
// Send native coin (ETH/BNB/etc.)
// Usage examples:
//   TO=0x... AMOUNT=0.5 npx hardhat run scripts/sendNative.js --network localhost
//   TO=0x... AMOUNT=100000 UNIT=wei npx hardhat run scripts/sendNative.js --network localhost
// Optional overrides:
//   GAS_PRICE_GWEI=3  GAS_LIMIT=21000

const hre = require("hardhat");

function env(name, fallback) { return process.env[name] ?? fallback; }

async function main() {
  const { ethers } = hre;

  const to           = env("TO");
  const amountHuman  = env("AMOUNT"); // string, e.g. "0.5" or "100000"
  const unitRaw      = env("UNIT", "ether");
  let unit           = String(unitRaw || "ether").toLowerCase(); // wei|gwei|ether|aliases
  const gasPriceGwei = env("GAS_PRICE_GWEI");
  const gasLimit     = env("GAS_LIMIT");

  const isAddress   = ethers.utils?.isAddress ?? ethers.isAddress;
  const parseUnits  = ethers.utils?.parseUnits ?? ethers.parseUnits;
  const formatEther = ethers.utils?.formatEther ?? ethers.formatEther;

  if (!to || !isAddress(to)) throw new Error(`Bad TO: ${to}`);
  if (!amountHuman) throw new Error("AMOUNT is required");

  const [signer] = await ethers.getSigners();

  // Build tx overrides
  const overrides = {};
  if (gasPriceGwei) overrides.gasPrice = parseUnits(gasPriceGwei, "gwei");
  if (gasLimit) overrides.gasLimit = ethers.BigNumber?.from?.(gasLimit) ?? BigInt(gasLimit);

  // Normalize common aliases and support numeric decimals in UNIT
  const etherAliases = new Set([
    "eth", "bnb", "matic", "avax", "ftm", "op", "arb", "bsc", "native", "ether"
  ]);
  const isNumericUnit = /^\d+$/.test(String(unitRaw));
  if (etherAliases.has(unit)) unit = "ether";

  // Parse value in the requested unit (default: ether)
  let value;
  try {
    if (isNumericUnit) {
      // Treat UNIT as number of decimals, e.g. UNIT=18
      const decimals = parseInt(String(unitRaw), 10);
      value = parseUnits(amountHuman, decimals);
    } else {
      value = unit === "ether"
        ? (ethers.utils?.parseEther ? ethers.utils.parseEther(amountHuman) : ethers.parseEther(amountHuman))
        : parseUnits(amountHuman, unit);
    }
  } catch (e) {
    throw new Error(`Failed to parse AMOUNT='${amountHuman}' as ${unit}: ${e.message || e}`);
  }

  const balSenderBefore = await ethers.provider.getBalance(signer.address);
  const balToBefore = await ethers.provider.getBalance(to).catch(() => null);

  console.log("Network:", (await ethers.provider.getNetwork()).chainId);
  console.log("Sender:", signer.address);
  console.log("Recipient:", to);
  console.log("Sender balance:", formatEther(balSenderBefore), "native");
  if (balToBefore != null) console.log("Recipient balance (before):", formatEther(balToBefore), "native");
  console.log(`Sending: ${amountHuman} ${isNumericUnit ? unitRaw+"-decimals" : unit} (${formatEther(value)} native)`);

  const tx = await signer.sendTransaction({ to, value, ...overrides });
  console.log("tx:", tx.hash);
  await tx.wait();

  const balToAfter = await ethers.provider.getBalance(to).catch(() => null);
  if (balToAfter != null) console.log("✅ Recipient balance (after):", formatEther(balToAfter), "native");
}

main().catch((e) => { console.error("❌", e); process.exit(1); });
