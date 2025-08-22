// scripts/deploy.prod.js
const hre = require("hardhat");
require("dotenv").config();

function u(v, d = 0) {
  const n = parseInt(v ?? "", 10);
  return Number.isFinite(n) ? n : d;
}

// ---------- helpers: rich logging ----------
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
  // Accept either a Promise<tx> or a tx object
  const tx = await txPromise;
  console.log(`[${now()}] → sent ${label}: ${tx.hash}`);
  console.time(`⏱ ${label}`);
  const rcpt = await tx.wait(1); // 1 conf is enough for testnets
  console.timeEnd(`⏱ ${label}`);
  console.log(
    `[${now()}] ✓ mined ${label}: block=${rcpt.blockNumber} gasUsed=${rcpt.gasUsed?.toString()} status=${rcpt.status}`
  );
  return rcpt;
}

async function main() {
  // faster status updates from provider
  const [deployer] = await hre.ethers.getSigners();
  const net = await hre.ethers.provider.getNetwork();

  const PROD_CHAINS = new Set([56]); // 56 = BSC mainnet. Add 1 if you also deploy to Ethereum mainnet.
  if (!PROD_CHAINS.has(Number(net.chainId))) {
    throw new Error(`deploy.prod.js is restricted to prod chains. Current chainId=${net.chainId}`);
  }
  const bal = await deployer.getBalance();

  // === Gas overrides (default 10 gwei, 6_000_000 gasLimit) ===
  const GAS_PRICE_GWEI = process.env.GAS_PRICE_GWEI || "10";
  const GAS_LIMIT = u(process.env.GAS_LIMIT, 6_000_000);
  const overrides = { gasPrice: hre.ethers.utils.parseUnits(GAS_PRICE_GWEI || "25", "gwei") };


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
    USDT: { addr: process.env.USDT_ADDRESS, ratio: u(process.env.USDT_RATIO, 1000), fn: "updateUSDT" },
    USDC: { addr: process.env.USDC_ADDRESS, ratio: u(process.env.USDC_RATIO, 1000), fn: "updateUSDC" },
    ETH:  { addr: process.env.ETH_ADDRESS,  ratio: u(process.env.ETH_RATIO,  1000), fn: "updateETH"  },
    SOL:  { addr: process.env.SOL_ADDRESS,  ratio: u(process.env.SOL_RATIO,  1000), fn: "updateSOL"  },
    BTC:  { addr: process.env.BTC_ADDRESS,  ratio: u(process.env.BTC_RATIO,  1000), fn: "updateBTC"  },
  };

  // helper (put above main loop)
  async function setPaymentToken(ico, sym, addr, ratio, fn, overrides) {
    if (!addr) return;
    if (!hre.ethers.utils.isAddress(addr)) {
      throw new Error(`${sym}_ADDRESS is invalid`);
    }

    const oneArg  = `${fn}(address)`;
    const twoArgs = `${fn}(address,uint256)`;

    const has1 = !!ico.interface.functions[oneArg];
    const has2 = !!ico.interface.functions[twoArgs];

    if (has2) {
      await waitFor(ico[twoArgs](addr, ratio, overrides), `${fn}(${sym})[2-arg]`);
      console.log(`✅ ${sym} enabled @ ${addr} (ratio=${ratio})`);
    } else if (has1) {
      await waitFor(ico[oneArg](addr, overrides), `${fn}(${sym})[1-arg]`);
      console.log(`✅ ${sym} enabled @ ${addr}`);
    } else {
      console.log(`ℹ️  ${fn} not found on ICO; skipping ${sym}`);
    }
  }


  await setPaymentToken(tokenICO, "USDT", cfg.USDT.addr, cfg.USDT.ratio, "updateUSDT", overrides);
  await setPaymentToken(tokenICO, "USDC", cfg.USDC.addr, cfg.USDC.ratio, "updateUSDC", overrides);
  await setPaymentToken(tokenICO, "ETH",  cfg.ETH.addr,  cfg.ETH.ratio,  "updateETH",  overrides);
  await setPaymentToken(tokenICO, "SOL",  cfg.SOL.addr,  cfg.SOL.ratio,  "updateSOL",  overrides);
  await setPaymentToken(tokenICO, "BTC",  cfg.BTC.addr,  cfg.BTC.ratio,  "updateBTC",  overrides);


  // --- Intervals
  console.log(`[${now()}] STEP 8: Set intervals`);
  const WAITLIST_INTERVAL = u(process.env.NEXT_PUBLIC_WAITLIST_INTERVAL, 14 * 24 * 60 * 60);
  const PUBLIC_INTERVAL   = u(process.env.NEXT_PUBLIC_PUBLIC_INTERVAL,   7 * 24 * 60 * 60);
  await waitFor(tokenICO.setIntervals(WAITLIST_INTERVAL, PUBLIC_INTERVAL, overrides), "setIntervals");
  console.log(
    "✅ intervals set:",
    "WL=" + (await tokenICO.waitlistInterval()).toString() + "s,",
    "PUBLIC=" + (await tokenICO.publicInterval()).toString() + "s"
  );

  // --- Sale start time
  console.log(`[${now()}] STEP 9: Set sale start time`);
  const latest = await hre.ethers.provider.getBlock("latest");
  const startAtEnv = u(process.env.SALE_START_AT, 0);
  const startTs = startAtEnv > 0 ? startAtEnv : latest.timestamp;
  await waitFor(tokenICO.setSaleStartTime(startTs, overrides), "setSaleStartTime");
  console.log("✅ sale start time set:", (await tokenICO.saleStartTime()).toString());

  // --- Export addresses
  console.log(`[${now()}] STEP 10: Export addresses`);
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
  console.error("❌ Deploy failed:", err);
  process.exit(1);
});
