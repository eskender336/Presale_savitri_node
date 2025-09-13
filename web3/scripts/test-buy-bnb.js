// scripts/test-buy-bnb.js
// Makes a tiny buyWithBNB call to trigger TokensPurchased for notifier testing.
// WARNING: Sends real BNB on the configured network. Use a very small amount.
//
// Env:
//   - ICO_ADDRESS or NEXT_PUBLIC_TOKEN_ICO_ADDRESS
//   - EXPECTED_CHAIN_ID (default 56)
//   - GAS_PRICE_GWEI (default 1)
//   - GAS_LIMIT (default 150000)
//   - NETWORK_RPC_URL, PRIVATE_KEY via hardhat network config
//
// CLI:
//   --amount <bnb>   BNB amount to send (default 0.0002)
//   --dry            Print what would happen and exit

const hre = require("hardhat");
require("dotenv").config();

const { ethers } = hre;

function now() { return new Date().toISOString(); }

function parseArgs(argv) {
  // Allow env control to avoid CLI arg parsing issues with Hardhat
  const envAmount = process.env.TEST_BUY_BNB_AMOUNT || "";
  const envDry = /^(1|true|yes)$/i.test(process.env.TEST_BUY_DRY || "");
  // Default amount kept extremely small to avoid exceeding token balance when pricing is low
  const args = { amount: envAmount || "0.000000001", dry: envDry };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--amount") args.amount = argv[++i];
    else if (a === "--dry") args.dry = true;
  }
  return args;
}

async function waitFor(txPromise, label = "tx") {
  const tx = await txPromise;
  console.log(`[${now()}] → sent ${label}: ${tx.hash}`);
  console.time(`⏱ ${label}`);
  const rcpt = await tx.wait(1);
  console.timeEnd(`⏱ ${label}`);
  console.log(`[${now()}] ✓ mined ${label}: block=${rcpt.blockNumber} gasUsed=${rcpt.gasUsed?.toString()}`);
  return rcpt;
}

async function main() {
  const [signer] = await ethers.getSigners();

  const expectedChainId = parseInt(process.env.EXPECTED_CHAIN_ID || "56", 10);
  const net = await ethers.provider.getNetwork();
  console.log("== Test buy with BNB ==");
  console.log("Network:", net.chainId, "(expected:", expectedChainId + ")");

  if (net.chainId !== expectedChainId) {
    console.log(`⚠️  Connected chainId=${net.chainId}, expected=${expectedChainId}`);
  }

  const ICO_ADDRESS = process.env.ICO_ADDRESS || process.env.NEXT_PUBLIC_TOKEN_ICO_ADDRESS;
  if (!ICO_ADDRESS || !ethers.utils.isAddress(ICO_ADDRESS)) {
    throw new Error("ICO_ADDRESS (or NEXT_PUBLIC_TOKEN_ICO_ADDRESS) not set or invalid");
  }

  const args = parseArgs(process.argv.slice(2));
  const amountBNB = args.amount;
  const valueWei = ethers.utils.parseEther(amountBNB);

  const GAS_PRICE_GWEI = process.env.GAS_PRICE_GWEI || "1";
  const GAS_LIMIT_ENV = parseInt(process.env.GAS_LIMIT || "0", 10);
  const overrides = {
    gasPrice: ethers.utils.parseUnits(GAS_PRICE_GWEI, "gwei"),
    // gasLimit will be set after estimation unless provided via env
    value: valueWei,
  };

  console.log("Signer:", signer.address);
  console.log("ICO:", ICO_ADDRESS);
  console.log("BNB amount:", amountBNB);

  const ico = await ethers.getContractAt("TokenICO", ICO_ADDRESS);

  // Basic sanity: sale token configured and BNB feed set
  const saleToken = await ico.saleToken();
  if (saleToken === ethers.constants.AddressZero) {
    throw new Error("saleToken not set on TokenICO (setSaleToken)");
  }

  const bnbFeed = await ico.bnbPriceFeed().catch(() => ethers.constants.AddressZero);
  if (!bnbFeed || bnbFeed === ethers.constants.AddressZero) {
    throw new Error("bnbPriceFeed not set (setBNBPriceFeed)");
  }

  // Estimate tokens via on-chain ratio and derive a safe max value
  let estTokens = undefined;
  let ratioPer1BNB = undefined;
  try {
    ratioPer1BNB = await ico.bnbRatio(); // tokens for 1e18 wei
    // est = valueWei * ratioPer1BNB / 1e18
    estTokens = valueWei.mul(ratioPer1BNB).div(ethers.constants.WeiPerEther);
  } catch (_) {}

  // Check contract token balance is sufficient for estimate
  let saleTokenBalance = undefined;
  let saleTokenSymbol = "SALE";
  let saleTokenDecimals = 18;
  try {
    const erc20 = await ethers.getContractAt([
      "function balanceOf(address) view returns (uint256)",
      "function symbol() view returns (string)",
      "function decimals() view returns (uint8)",
    ], saleToken);
    const [bal, sym, dec] = await Promise.all([
      erc20.balanceOf(ICO_ADDRESS),
      erc20.symbol().catch(() => "SALE"),
      erc20.decimals().catch(() => 18),
    ]);
    saleTokenBalance = bal;
    saleTokenSymbol = sym;
    saleTokenDecimals = dec;
    if (estTokens && bal.lt(estTokens)) {
      console.log(`⚠️  Contract may not have enough ${sym} to fulfill estimated tokens.`);
    }
    console.log(`Sale token: ${sym} (dec=${dec}) @ ${saleToken}`);
    console.log(`Contract token balance: ${bal.toString()}`);
    if (estTokens) console.log(`Estimated tokens to receive: ${estTokens.toString()}`);
  } catch (e) {
    console.log("ℹ️  Could not query sale token meta:", e?.message);
  }

  // Auto-adjust value down if it would exceed contract balance based on ratio
  if (ratioPer1BNB && saleTokenBalance && saleTokenBalance.gt(0)) {
    // maxWei = floor(balance * 1e18 / ratio)
    const maxWei = saleTokenBalance.mul(ethers.constants.WeiPerEther).div(ratioPer1BNB);
    // keep 95% headroom
    const safeWei = maxWei.mul(95).div(100);
    if (valueWei.gt(safeWei)) {
      console.log(`ℹ️  Requested value exceeds safe cap for current token balance and price.`);
      console.log(`   Adjusting value from ${amountBNB} BNB to ${ethers.utils.formatEther(safeWei)} BNB`);
      overrides.value = safeWei;
    }
  }

  // Preflight with callStatic to catch reverts without spending gas (best effort)
  try {
    await ico.callStatic.buyWithBNB({ value: overrides.value });
  } catch (e) {
    console.log(`⚠️  callStatic indicates revert: ${e?.errorName || e?.message || e}`);
  }

  // Estimate gas and set a safe limit if not provided
  try {
    const est = await ico.estimateGas.buyWithBNB({ value: overrides.value });
    const padded = est.mul(120).div(100); // +20%
    const cap = ethers.BigNumber.from(800000);
    const finalGas = padded.gt(cap) ? cap : padded;
    overrides.gasLimit = GAS_LIMIT_ENV > 0 ? GAS_LIMIT_ENV : finalGas;
    console.log(`Gas estimate: ${est.toString()} -> using gasLimit=${overrides.gasLimit.toString()}`);
  } catch (e) {
    overrides.gasLimit = GAS_LIMIT_ENV > 0 ? GAS_LIMIT_ENV : 500000;
    console.log(`ℹ️  Could not estimate gas (${e?.message}). Using gasLimit=${overrides.gasLimit}`);
  }

  if (args.dry) {
    console.log("--dry specified: skipping transaction.");
    return;
  }

  await waitFor(ico.buyWithBNB(overrides), `buyWithBNB(${amountBNB} BNB)`);
  console.log("🎉 Test buy executed. Watch notifier for a Telegram message.");
}

main().then(() => process.exit(0)).catch((err) => {
  console.error("❌ test-buy-bnb failed:", err);
  process.exit(1);
});
