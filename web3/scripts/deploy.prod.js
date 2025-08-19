// scripts/deploy.prod.js
const hre = require("hardhat");
require("dotenv").config();

function u(v, d = 0) {
  const n = parseInt(v ?? "", 10);
  return Number.isFinite(n) ? n : d;
}

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const net = await hre.ethers.provider.getNetwork();

  console.log("== Deploying ==");
  console.log("Network:", net.chainId);
  console.log("Deployer:", deployer.address);
  console.log("Balance:", (await deployer.getBalance()).toString());

  // --- Deploy SAV token (sale token)
  const SavitriCoin = await hre.ethers.getContractFactory("SavitriCoin");
  const savitriToken = await SavitriCoin.deploy();
  await savitriToken.deployed();
  console.log("✅ SAV deployed:", savitriToken.address);

  // --- Deploy ICO
  const TokenICO = await hre.ethers.getContractFactory("TokenICO");
  const tokenICO = await TokenICO.deploy();
  await tokenICO.deployed();
  console.log("✅ TokenICO deployed:", tokenICO.address);

  // --- Set voucher signer (from env)
  const SIGNER =
    process.env.SIGNER_ADDRESS ||
    process.env.NEXT_PUBLIC_SIGNER_ADDRESS ||
    "0x0000000000000000000000000000000000000000";

  if (!hre.ethers.utils.isAddress(SIGNER) || SIGNER === hre.ethers.constants.AddressZero) {
    throw new Error("Missing/invalid SIGNER_ADDRESS (or NEXT_PUBLIC_SIGNER_ADDRESS).");
  }

  await (await tokenICO.setSigner(SIGNER)).wait();
  const onchainSigner = await tokenICO.signer();
  console.log("✅ signer set:", onchainSigner);

  // --- Bind sale token
  await (await tokenICO.setSaleToken(savitriToken.address)).wait();
  const onchainSaleToken = await tokenICO.saleToken?.();
  console.log("✅ saleToken set:", onchainSaleToken || savitriToken.address);

  // --- Allow ICO to transfer SAV if your token gates transfers
  try {
    if (typeof savitriToken.setAllowedSender === "function") {
      await (await savitriToken.setAllowedSender(tokenICO.address, true)).wait();
      const allowed = await savitriToken.allowedSenders(tokenICO.address);
      console.log("✅ SAV allowedSender[ICO] =", allowed);
    } else {
      console.log("ℹ️  SAV has no setAllowedSender (skipping)");
    }
  } catch (e) {
    console.log("⚠️  setAllowedSender not available or failed (continuing):", e?.message);
  }

  // --- Fund ICO with SAV inventory to sell
  const SALE_INVENTORY = process.env.SALE_INVENTORY || "500000";
  await (await savitriToken.transfer(
    tokenICO.address,
    hre.ethers.utils.parseUnits(SALE_INVENTORY, 18)
  )).wait();
  console.log(`✅ ICO funded with ${SALE_INVENTORY} SAV`);

  // --- Configure payment tokens (REAL addresses only; no mocks here)
  const cfg = {
    USDT: { addr: process.env.USDT_ADDRESS, ratio: u(process.env.USDT_RATIO, 1000), fn: "updateUSDT" },
    USDC: { addr: process.env.USDC_ADDRESS, ratio: u(process.env.USDC_RATIO, 1000), fn: "updateUSDC" },
    ETH:  { addr: process.env.ETH_ADDRESS,  ratio: u(process.env.ETH_RATIO,  1000), fn: "updateETH"  }, // Use WETH or ERC20 wrapper if needed
    SOL:  { addr: process.env.SOL_ADDRESS,  ratio: u(process.env.SOL_RATIO,  1000), fn: "updateSOL"  }, // ERC20 wrapper on EVM
    BTC:  { addr: process.env.BTC_ADDRESS,  ratio: u(process.env.BTC_RATIO,  1000), fn: "updateBTC"  }, // e.g., WBTC
  };

  for (const [sym, { addr, ratio, fn }] of Object.entries(cfg)) {
    if (!addr) continue;
    if (!hre.ethers.utils.isAddress(addr)) throw new Error(`${sym}_ADDRESS is invalid`);
    if (typeof tokenICO[fn] !== "function") {
      console.log(`ℹ️  ${fn} not found on ICO; skipping ${sym}`);
      continue;
    }
    await (await tokenICO[fn](addr, ratio)).wait();
    console.log(`✅ ${sym} payment enabled @ ${addr} (ratio=${ratio})`);
  }

  // --- Intervals (seconds)
  const WAITLIST_INTERVAL = u(process.env.NEXT_PUBLIC_WAITLIST_INTERVAL, 14 * 24 * 60 * 60); // default 14d
  const PUBLIC_INTERVAL   = u(process.env.NEXT_PUBLIC_PUBLIC_INTERVAL,   7 * 24 * 60 * 60);  // default 7d
  await (await tokenICO.setIntervals(WAITLIST_INTERVAL, PUBLIC_INTERVAL)).wait();

  const wlInt = (await tokenICO.waitlistInterval()).toString();
  const pbInt = (await tokenICO.publicInterval()).toString();
  console.log(`✅ intervals set: WL=${wlInt}s, PUBLIC=${pbInt}s`);

  // --- Sale start time
  // If SALE_START_AT (unix seconds) is provided, use it; otherwise start now.
  // For real prod, you usually want a FUTURE timestamp here.
  const latest = await hre.ethers.provider.getBlock("latest");
  const startAtEnv = u(process.env.SALE_START_AT, 0);
  const startTs = startAtEnv > 0 ? startAtEnv : latest.timestamp;
  await (await tokenICO.setSaleStartTime(startTs)).wait();
  const onchainStart = (await tokenICO.saleStartTime()).toString();
  console.log("✅ sale start time set:", onchainStart);

  // --- Output addresses for frontend/env
  console.log("-------- EXPORT --------");
  console.log("NEXT_PUBLIC_TOKEN_ICO_ADDRESS =", tokenICO.address);
  console.log("NEXT_PUBLIC_OWNER_ADDRESS     =", deployer.address);
  console.log("NEXT_PUBLIC_SAV_ADDRESS       =", savitriToken.address);
  if (cfg.USDT.addr) console.log("NEXT_PUBLIC_USDT_ADDRESS      =", cfg.USDT.addr);
  if (cfg.USDC.addr) console.log("NEXT_PUBLIC_USDC_ADDRESS      =", cfg.USDC.addr);
  if (cfg.ETH.addr)  console.log("NEXT_PUBLIC_ETH_ADDRESS       =", cfg.ETH.addr);
  if (cfg.SOL.addr)  console.log("NEXT_PUBLIC_SOL_ADDRESS       =", cfg.SOL.addr);
  if (cfg.BTC.addr)  console.log("NEXT_PUBLIC_BTC_ADDRESS       =", cfg.BTC.addr);
}

main().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});
