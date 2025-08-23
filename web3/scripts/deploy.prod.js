// scripts/deploy.prod.js
// STRICT PRODUCTION DEPLOY (BSC mainnet only) — NO MOCK FEEDS
const hre = require("hardhat");
require("dotenv").config();

function u(v, d = 0) {
  const n = parseInt(v ?? "", 10);
  return Number.isFinite(n) ? n : d;
}
const isAddr = (x) => {
  try { return hre.ethers.utils.isAddress(x); } catch { return false; }
};

// ---------- Chainlink Aggregator (minimal) ----------
const FEED_ABI = [
  "function decimals() view returns (uint8)",
  "function description() view returns (string)",
  "function latestRoundData() view returns (uint80,int256,uint256,uint256,uint80)",
];

// ---------- helpers ----------
async function feeSnapshot() {
  try {
    const fd = await hre.ethers.provider.getFeeData();
    return {
      gasPrice: fd.gasPrice?.toString(),
      maxFeePerGas: fd.maxFeePerGas?.toString(),
      maxPriorityFeePerGas: fd.maxPriorityFeePerGas?.toString(),
    };
  } catch {
    return {};
  }
}

function now() {
  return new Date().toISOString();
}

async function waitFor(txPromise, label = "tx") {
  const tx = await txPromise;
  console.log(`[${now()}] → sent ${label}: ${tx.hash}`);
  console.time(`⏱ ${label}`);
  const rcpt = await tx.wait(1); // 1 conf is enough on prod usually; increase if you prefer
  console.timeEnd(`⏱ ${label}`);
  console.log(
    `[${now()}] ✓ mined ${label}: block=${rcpt.blockNumber} gasUsed=${rcpt.gasUsed?.toString()} status=${rcpt.status}`
  );
  return rcpt;
}

async function validateFeed(sym, addr) {
  if (!isAddr(addr)) throw new Error(`${sym}_FEED_ADDRESS missing/invalid`);
  const feed = await hre.ethers.getContractAt(FEED_ABI, addr);
  const [dec, desc, lrd] = await Promise.all([
    feed.decimals(),
    feed.description().catch(() => `${sym}/USD`),
    feed.latestRoundData(),
  ]);
  const answer = lrd?.answer ?? lrd?.[1];
  if (!answer || answer.lte(0)) throw new Error(`${sym} feed returned non-positive price`);
  console.log(`🔎 ${sym} feed OK → ${desc} @ ${addr} (decimals=${dec}, price=${answer.toString()})`);
  return { dec, desc, addr };
}

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const net = await hre.ethers.provider.getNetwork();

  // ====== PROD GUARD: BNB Smart Chain mainnet only ======
  const PROD_CHAINS = new Set([56]); // 56 = BSC mainnet
  if (!PROD_CHAINS.has(Number(net.chainId))) {
    throw new Error(`deploy.prod.js is restricted to BSC mainnet. Current chainId=${net.chainId}`);
  }

  const bal = await deployer.getBalance();

  // === Gas overrides (default 10 gwei, 6_000_000 gasLimit) ===
  const GAS_PRICE_GWEI = process.env.GAS_PRICE_GWEI || "10";
  const GAS_LIMIT = u(process.env.GAS_LIMIT, 6_000_000);
  const overrides = {
    gasPrice: hre.ethers.utils.parseUnits(GAS_PRICE_GWEI, "gwei"),
    gasLimit: GAS_LIMIT,
  };

  console.log("== Deploying ==");
  console.log("Network:", net.chainId);
  console.log("Deployer:", deployer.address);
  console.log("Balance:", bal.toString());
  console.log("Overrides:", { gasPriceGwei: GAS_PRICE_GWEI, gasLimit: GAS_LIMIT });
  console.log("FeeData snapshot:", await feeSnapshot());
  console.log(`[${now()}] Current block:`, await hre.ethers.provider.getBlockNumber());

  // --- Deploy SAV token
  console.log(`[${now()}] STEP 1: Deploy SavitriCoin`);
  const SavitriCoin = await hre.ethers.getContractFactory("SavitriCoin");
  const savitriToken = await SavitriCoin.deploy(overrides);
  await waitFor(savitriToken.deployTransaction, "SAV deploy");
  console.log("✅ SAV deployed @", savitriToken.address);

  // --- Deploy ICO
  console.log(`[${now()}] STEP 2: Deploy TokenICO`);
  const TokenICO = await hre.ethers.getContractFactory("TokenICO");
  const tokenICO = await TokenICO.deploy(overrides);
  await waitFor(tokenICO.deployTransaction, "ICO deploy");
  console.log("✅ TokenICO deployed @", tokenICO.address);

  // --- Set voucher signer (from env)
  console.log(`[${now()}] STEP 3: Configure signer`);
  const SIGNER =
    process.env.SIGNER_ADDRESS ||
    process.env.NEXT_PUBLIC_SIGNER_ADDRESS ||
    "0x0000000000000000000000000000000000000000";

  if (!hre.ethers.utils.isAddress(SIGNER) || SIGNER === hre.ethers.constants.AddressZero) {
    throw new Error("Missing/invalid SIGNER_ADDRESS (or NEXT_PUBLIC_SIGNER_ADDRESS).");
  }
  await waitFor(tokenICO.setSigner(SIGNER, overrides), "setSigner");
  const onchainSigner = await tokenICO.callStatic.signer();
  console.log("✅ signer set:", onchainSigner);

  // --- Bind sale token
  console.log(`[${now()}] STEP 4: Bind sale token`);
  await waitFor(tokenICO.setSaleToken(savitriToken.address, overrides), "setSaleToken");
  const onchainSaleToken = (tokenICO.saleToken ? await tokenICO.saleToken() : savitriToken.address);
  console.log("✅ saleToken set:", onchainSaleToken);

  // --- Allow ICO to transfer SAV if your token gates transfers
  console.log(`[${now()}] STEP 5: Allow ICO sender (if supported)`);
  try {
    if (typeof savitriToken.setAllowedSender === "function") {
      await waitFor(
        savitriToken.setAllowedSender(tokenICO.address, true, overrides),
        "SAV.setAllowedSender(ICO,true)"
      );
      const allowed = await savitriToken.allowedSenders(tokenICO.address);
      console.log("✅ SAV allowedSender[ICO] =", allowed);
    } else {
      console.log("ℹ️  SAV has no setAllowedSender (skipping)");
    }
  } catch (e) {
    console.log("⚠️  setAllowedSender failed (continuing):", e?.message);
  }

  // --- Fund ICO with SAV inventory to sell
  console.log(`[${now()}] STEP 6: Fund ICO with SAV`);
  const SALE_INVENTORY = process.env.SALE_INVENTORY || "500000";
  await waitFor(
    savitriToken.transfer(
      tokenICO.address,
      hre.ethers.utils.parseUnits(SALE_INVENTORY, 18),
      overrides
    ),
    `SAV.transfer(ICO, ${SALE_INVENTORY})`
  );
  console.log(`✅ ICO funded with ${SALE_INVENTORY} SAV`);

  // --- Configure payment tokens (REAL addresses only; no mocks here)
  console.log(`[${now()}] STEP 7: Enable payment tokens (if provided)`);
  const cfg = {
    USDT: { addr: process.env.USDT_ADDRESS, fn: "updateUSDT" },
    USDC: { addr: process.env.USDC_ADDRESS, fn: "updateUSDC" },
    ETH:  { addr: process.env.ETH_ADDRESS,  fn: "updateETH"  },
    SOL:  { addr: process.env.SOL_ADDRESS,  fn: "updateSOL"  },
    BTC:  { addr: process.env.BTC_ADDRESS,  fn: "updateBTC"  },
  };

  async function setPaymentToken(ico, sym, addr, fn, overrides) {
    if (!addr) return;
    if (!hre.ethers.utils.isAddress(addr)) {
      throw new Error(`${sym}_ADDRESS is invalid`);
    }
    const selector = `${fn}(address)`;
    if (!ico.interface.functions[selector]) {
      console.log(`ℹ️  ${fn} not found on ICO; skipping ${sym}`);
      return;
    }
    await waitFor(ico[selector](addr, overrides), `${fn}(${sym})`);
    console.log(`✅ ${sym} enabled @ ${addr}`);
  }

  await setPaymentToken(tokenICO, "USDT", cfg.USDT.addr, "updateUSDT", overrides);
  await setPaymentToken(tokenICO, "USDC", cfg.USDC.addr, "updateUSDC", overrides);
  await setPaymentToken(tokenICO, "ETH",  cfg.ETH.addr,  "updateETH",  overrides);
  await setPaymentToken(tokenICO, "SOL",  cfg.SOL.addr,  "updateSOL",  overrides);
  await setPaymentToken(tokenICO, "BTC",  cfg.BTC.addr,  "updateBTC",  overrides);

  // Optional: ensure at least one payment token is enabled
  const enabledPayments = ["USDT","USDC","ETH","SOL","BTC"].filter(k => !!cfg[k]?.addr);
  if (enabledPayments.length === 0) {
    throw new Error("No payment tokens configured. Set at least one of USDT_ADDRESS/USDC_ADDRESS/ETH_ADDRESS/SOL_ADDRESS/BTC_ADDRESS.");
  }
  console.log("💳 Enabled payments:", enabledPayments.join(", "));

  // --- Configure price feeds (STRICT: no mocks)
  console.log(`[${now()}] STEP 8: Set price feeds`);
  const feeds = {
    BNB: process.env.BNB_FEED_ADDRESS,
    ETH: process.env.ETH_FEED_ADDRESS,
    BTC: process.env.BTC_FEED_ADDRESS,
    SOL: process.env.SOL_FEED_ADDRESS,
  };

  // Always require BNB/USD on BSC
  await validateFeed("BNB", feeds.BNB);

  // Require USD feeds for each enabled volatile payment asset
  if (cfg.ETH.addr) await validateFeed("ETH", feeds.ETH);
  if (cfg.BTC.addr) await validateFeed("BTC", feeds.BTC);
  if (cfg.SOL.addr) await validateFeed("SOL", feeds.SOL);

  // Wire feeds
  await waitFor(tokenICO.setBNBPriceFeed(feeds.BNB, overrides), "setBNBPriceFeed");
  if (cfg.ETH.addr) await waitFor(tokenICO.setETHPriceFeed(feeds.ETH, overrides), "setETHPriceFeed");
  if (cfg.BTC.addr) await waitFor(tokenICO.setBTCPriceFeed(feeds.BTC, overrides), "setBTCPriceFeed");
  if (cfg.SOL.addr) await waitFor(tokenICO.setSOLPriceFeed(feeds.SOL, overrides), "setSOLPriceFeed");

  // --- Intervals
  console.log(`[${now()}] STEP 9: Set intervals`);
  const WAITLIST_INTERVAL = u(process.env.NEXT_PUBLIC_WAITLIST_INTERVAL, 14 * 24 * 60 * 60);
  const PUBLIC_INTERVAL   = u(process.env.NEXT_PUBLIC_PUBLIC_INTERVAL,   7 * 24 * 60 * 60);
  await waitFor(tokenICO.setIntervals(WAITLIST_INTERVAL, PUBLIC_INTERVAL, overrides), "setIntervals");
  console.log(
    "✅ intervals set:",
    "WL=" + (await tokenICO.waitlistInterval()).toString() + "s,",
    "PUBLIC=" + (await tokenICO.publicInterval()).toString() + "s"
  );

  // --- Sale start time
  console.log(`[${now()}] STEP 10: Set sale start time`);
  const latest = await hre.ethers.provider.getBlock("latest");
  const startAtEnv = u(process.env.SALE_START_AT, 0);
  const startTs = startAtEnv > 0 ? startAtEnv : latest.timestamp;
  await waitFor(tokenICO.setSaleStartTime(startTs, overrides), "setSaleStartTime");
  console.log("✅ sale start time set:", (await tokenICO.saleStartTime()).toString());

  // --- Export addresses
  console.log(`[${now()}] STEP 11: Export addresses`);
  console.log("-------- EXPORT --------");
  console.log("NEXT_PUBLIC_TOKEN_ICO_ADDRESS =", tokenICO.address);
  console.log("NEXT_PUBLIC_OWNER_ADDRESS     =", deployer.address);
  console.log("NEXT_PUBLIC_SAV_ADDRESS       =", savitriToken.address);
  if (cfg.USDT.addr) console.log("NEXT_PUBLIC_USDT_ADDRESS      =", cfg.USDT.addr);
  if (cfg.USDC.addr) console.log("NEXT_PUBLIC_USDC_ADDRESS      =", cfg.USDC.addr);
  if (cfg.ETH.addr)  console.log("NEXT_PUBLIC_ETH_ADDRESS       =", cfg.ETH.addr);
  if (cfg.SOL.addr)  console.log("NEXT_PUBLIC_SOL_ADDRESS       =", cfg.SOL.addr);
  if (cfg.BTC.addr)  console.log("NEXT_PUBLIC_BTC_ADDRESS       =", cfg.BTC.addr);
  if (feeds.BNB)     console.log("NEXT_PUBLIC_BNB_FEED          =", feeds.BNB);
  if (feeds.ETH)     console.log("NEXT_PUBLIC_ETH_FEED          =", feeds.ETH);
  if (feeds.BTC)     console.log("NEXT_PUBLIC_BTC_FEED          =", feeds.BTC);
  if (feeds.SOL)     console.log("NEXT_PUBLIC_SOL_FEED          =", feeds.SOL);
}

main().then(() => process.exit(0)).catch((err) => {
  console.error("❌ Deploy failed:", err);
  process.exit(1);
});
