// scripts/resume.mocks.bsc.js
const hre = require("hardhat");
require("dotenv").config();

const u = (v, d = 0) => {
  const n = parseInt(String(v ?? ""), 10);
  return Number.isFinite(n) ? n : d;
};

function now() {
  return new Date().toISOString();
}

async function waitFor(txPromise, label) {
  const tx = await txPromise;
  console.log(`[${now()}] → sent ${label}: ${tx.hash}`);
  console.time(`⏱ ${label}`);
  const rcpt = await tx.wait(1);
  console.timeEnd(`⏱ ${label}`);
  console.log(`[${now()}] ✓ mined ${label}: block=${rcpt.blockNumber} gasUsed=${rcpt.gasUsed?.toString()} status=${rcpt.status}`);
  return rcpt;
}

async function main() {
  const { ethers } = hre;

  const ICO_ADDR = process.env.NEXT_PUBLIC_TOKEN_ICO_ADDRESS;
  if (!ICO_ADDR || !ethers.utils.isAddress(ICO_ADDR)) {
    throw new Error("Missing or invalid NEXT_PUBLIC_TOKEN_ICO_ADDRESS");
  }

  const GAS_PRICE_GWEI = process.env.GAS_PRICE_GWEI || "15";
  const gasPrice = ethers.utils.parseUnits(GAS_PRICE_GWEI, "gwei");
  const overrides = { gasPrice }; // legacy gas on BSC testnet

  const [signer] = await ethers.getSigners();
  const net = await ethers.provider.getNetwork();
  const bal = await signer.getBalance();
  const latestBlock = await ethers.provider.getBlockNumber();

  console.log(`Deployer: ${signer.address} | chainId: ${net.chainId}`);
  console.log(`gasPrice gwei: ${GAS_PRICE_GWEI}`);
  console.log(`Balance:  ${ethers.utils.formatUnits(bal, 18)} BNB`);
  console.log(`[${now()}] Current block: ${latestBlock}`);

  const TokenICO = await ethers.getContractFactory("TokenICO");
  const ico = TokenICO.attach(ICO_ADDR);

  // helper: detect input count and update accordingly
  async function updateToken(sym, getter, fnName, addrEnv, ratioEnv) {
    const targetAddr = process.env[addrEnv];
    if (!targetAddr) {
      console.log(`ℹ️  ${sym}: ${addrEnv} not set → skipping`);
      return;
    }
    if (!ethers.utils.isAddress(targetAddr)) {
      throw new Error(`${sym}: ${addrEnv} is not a valid address`);
    }

    // read current on-chain address if getter exists
    let currentAddr = null;
    if (typeof ico[getter] === "function") {
      try {
        currentAddr = await ico[getter]();
      } catch (e) {
        console.log(`ℹ️  ${sym}: getter ${getter} not callable, continuing`);
      }
    }

    if (currentAddr && currentAddr.toLowerCase() === targetAddr.toLowerCase()) {
      console.log(`✅ ${sym}: already set to ${currentAddr} — skipping`);
      return;
    }

    // detect function arity from ABI
    const fragment = ico.interface.getFunction(fnName);
    const inputsCount = fragment.inputs?.length ?? 0;

    if (inputsCount === 1) {
      console.log(`[${now()}] ${sym}: calling ${fnName}(${targetAddr})`);
      await waitFor(ico[fnName](targetAddr, overrides), `${fnName}(${sym})`);
    } else if (inputsCount === 2) {
      const ratioStr = process.env[ratioEnv];
      if (ratioStr === undefined) {
        console.log(`⚠️  ${sym}: ${fnName} requires a ratio, but ${ratioEnv} is missing → skipping`);
        return;
      }
      const ratio = ethers.BigNumber.from(ratioStr);
      console.log(`[${now()}] ${sym}: calling ${fnName}(${targetAddr}, ${ratio.toString()})`);
      await waitFor(ico[fnName](targetAddr, ratio, overrides), `${fnName}(${sym})`);
    } else {
      console.log(`ℹ️  ${sym}: unexpected ${fnName} inputs=${inputsCount} → skipping`);
    }
  }

  // ---- STEP A: register remaining payment tokens ----
  await updateToken("ETH", "ethAddress", "updateETH", "ETH_ADDRESS", "ETH_RATIO");
  await updateToken("SOL", "solAddress", "updateSOL", "SOL_ADDRESS", "SOL_RATIO");
  await updateToken("BTC", "btcAddress", "updateBTC", "BTC_ADDRESS", "BTC_RATIO");

  // (USDT/USDC were already done in your run, but safe to include guarded calls)
  await updateToken("USDT", "usdtAddress", "updateUSDT", "USDT_ADDRESS", "USDT_RATIO");
  await updateToken("USDC", "usdcAddress", "updateUSDC", "USDC_ADDRESS", "USDC_RATIO");

  // ---- STEP B: set intervals (only if needed) ----
  const WAITLIST_INTERVAL = u(process.env.NEXT_PUBLIC_WAITLIST_INTERVAL, 14 * 24 * 60 * 60);
  const PUBLIC_INTERVAL   = u(process.env.NEXT_PUBLIC_PUBLIC_INTERVAL,    7 * 24 * 60 * 60);

  let needIntervals = true;
  try {
    const currWL = (await ico.waitlistInterval()).toNumber?.() ?? 0;
    const currPB = (await ico.publicInterval()).toNumber?.() ?? 0;
    if (currWL === WAITLIST_INTERVAL && currPB === PUBLIC_INTERVAL) {
      needIntervals = false;
    }
  } catch {}

  if (needIntervals) {
    console.log(`[${now()}] setIntervals(${WAITLIST_INTERVAL}, ${PUBLIC_INTERVAL})`);
    await waitFor(ico.setIntervals(WAITLIST_INTERVAL, PUBLIC_INTERVAL, overrides), "setIntervals");
  } else {
    console.log("✅ intervals already set — skipping");
  }

  // ---- STEP C: set saleStartTime (use env or current block timestamp) ----
  const startAtEnv = u(process.env.SALE_START_AT, 0);
  const onchainStart = (await ico.saleStartTime?.())?.toNumber?.() ?? 0;

  let startTs = onchainStart;
  if (!onchainStart || startAtEnv > 0) {
    if (startAtEnv > 0) {
      startTs = startAtEnv;
    } else {
      const latest = await ethers.provider.getBlock("latest");
      startTs = latest.timestamp;
    }
    console.log(`[${now()}] setSaleStartTime(${startTs})`);
    await waitFor(ico.setSaleStartTime(startTs, overrides), "setSaleStartTime");
  } else {
    console.log(`✅ saleStartTime already set to ${onchainStart} — skipping`);
  }

  // ---- Final report ----
  const report = {
    tokenICO: ICO_ADDR,
    usdt: (await ico.usdtAddress?.().catch(() => null)) || process.env.USDT_ADDRESS || null,
    usdc: (await ico.usdcAddress?.().catch(() => null)) || process.env.USDC_ADDRESS || null,
    eth:  (await ico.ethAddress?.().catch(() => null))  || process.env.ETH_ADDRESS  || null,
    sol:  (await ico.solAddress?.().catch(() => null))  || process.env.SOL_ADDRESS  || null,
    btc:  (await ico.btcAddress?.().catch(() => null))  || process.env.BTC_ADDRESS  || null,
    waitlistInterval: await ico.waitlistInterval().then(x => x.toString()).catch(() => "n/a"),
    publicInterval:   await ico.publicInterval().then(x => x.toString()).catch(() => "n/a"),
    saleStartTime:    await ico.saleStartTime().then(x => x.toString()).catch(() => "n/a"),
  };
  console.log("-------- RESUME DONE --------");
  console.log(report);

  // handy exports for your frontend .env
  console.log("NEXT_PUBLIC_TOKEN_ICO_ADDRESS =", report.tokenICO);
  if (report.usdt) console.log("NEXT_PUBLIC_USDT_ADDRESS      =", report.usdt);
  if (report.usdc) console.log("NEXT_PUBLIC_USDC_ADDRESS      =", report.usdc);
  if (report.eth)  console.log("NEXT_PUBLIC_ETH_ADDRESS       =", report.eth);
  if (report.sol)  console.log("NEXT_PUBLIC_SOL_ADDRESS       =", report.sol);
  if (report.btc)  console.log("NEXT_PUBLIC_BTC_ADDRESS       =", report.btc);
}

main().then(() => process.exit(0)).catch((err) => {
  console.error("❌ Resume failed:", err);
  process.exit(1);
});
