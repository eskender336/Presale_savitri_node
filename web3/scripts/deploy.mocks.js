// scripts/deploy.mocks.js
const hre = require("hardhat");
require("dotenv").config();

const { ethers } = hre;
const bn = ethers.BigNumber;

// ---- utils
const u = (v, d = 0) => {
  const n = parseInt(String(v ?? ""), 10);
  return Number.isFinite(n) ? n : d;
};
const fmtBNB = (wei) => ethers.utils.formatUnits(wei, "ether");
const now = () => new Date().toISOString();
const MOCK_CHAINS = new Set([97, 1337, 31337]); // BSC testnet + local

// pretty tx logging
async function waitFor(txPromise, label = "tx") {
  const tx = await txPromise;
  console.log(`[${now()}] → sent ${label}: ${tx.hash}`);
  console.time(`⏱ ${label}`);
  const rcpt = await tx.wait(1);
  console.timeEnd(`⏱ ${label}`);
  console.log(
    `[${now()}] ✓ mined ${label}: block=${rcpt.blockNumber} gasUsed=${rcpt.gasUsed?.toString()} status=${rcpt.status}`
  );
  return rcpt;
}

// add +20% buffer to a gas amount (and floor to at least minGas)
const withBuf = (g, minGas = 120_000) => {
  const x = bn.from(g).mul(120).div(100);
  return x.lt(minGas) ? bn.from(minGas) : x;
};

async function main() {
  const [deployer] = await ethers.getSigners();
  const net = await ethers.provider.getNetwork();

  if (!MOCK_CHAINS.has(Number(net.chainId))) {
    throw new Error(
      `deploy.mocks.js allowed only on ${[...MOCK_CHAINS]} (got ${net.chainId})`
    );
  }

  // ---- gas settings (legacy, type:0)
  const GAS_PRICE_GWEI = process.env.GAS_PRICE_GWEI || "25"; // tweak as needed
  const GAS_PRICE = ethers.utils.parseUnits(GAS_PRICE_GWEI, "gwei");
  console.log(
    `Deployer: ${deployer.address} | chainId: ${net.chainId}\n` +
    `gasPrice gwei: ${GAS_PRICE_GWEI}`
  );

  // nonce snapshot (helpful if you had stuck txs)
  const latestNonce = await ethers.provider.getTransactionCount(deployer.address, "latest");
  const pendingNonce = await ethers.provider.getTransactionCount(deployer.address, "pending");
  console.log({ latestNonce, pendingNonce });

  // base overrides (legacy)
  const baseOv = { type: 0, gasPrice: GAS_PRICE };
  // if pending > latest, reuse latest nonce for the *first* tx to replace a stuck one
  const firstOv = (pendingNonce > latestNonce) ? { ...baseOv, nonce: latestNonce } : baseOv;

  // ---------- BUDGET PREFLIGHT ----------
  // Try to estimate big deployments; use fallback if RPC refuses to simulate.
  const plan = [];
  let gasSav = bn.from(0);
  let gasIco = bn.from(0);

  // SavitriCoin deploy estimate
  try {
    const SavitriCoin = await ethers.getContractFactory("SavitriCoin");
    const txReq = await SavitriCoin.getDeployTransaction();
    gasSav = await deployer.estimateGas(txReq);
  } catch {
    gasSav = bn.from(3_500_000); // fallback
  }
  plan.push({ label: "Deploy SavitriCoin", gas: withBuf(gasSav, 2_000_000) });

  // TokenICO deploy estimate
  try {
    const TokenICO = await ethers.getContractFactory("TokenICO");
    const txReq = await TokenICO.getDeployTransaction();
    gasIco = await deployer.estimateGas(txReq);
  } catch {
    gasIco = bn.from(5_000_000); // fallback
  }
  plan.push({ label: "Deploy TokenICO", gas: withBuf(gasIco, 3_000_000) });

  // Post-deploy calls (use rough fallbacks, then buffer)
  const post = [
    ["ICO.setSigner",        120_000],
    ["ICO.setSaleToken",     120_000],
    ["SAV.transfer to ICO",  140_000],
    ["SAV.setAllowedSender", 120_000],
    ["Deploy USDT mock",     700_000],
    ["Deploy USDC mock",     700_000],
    ["Deploy ETH mock",      700_000],
    ["Deploy SOL mock",      700_000],
    ["Deploy BTC mock",      700_000],
    ["ICO.updateUSDT",        80_000],
    ["ICO.updateUSDC",        80_000],
    ["ICO.updateETH",         80_000],
    ["ICO.updateSOL",         80_000],
    ["ICO.updateBTC",         80_000],
    ["ICO.setIntervals",      80_000],
    ["ICO.setSaleStartTime",  60_000],
  ];
  post.forEach(([label, g]) => plan.push({ label, gas: withBuf(g) }));

  // Sum and compare to balance
  const bal = await deployer.getBalance();
  console.log(`Balance:  ${fmtBNB(bal)} BNB\n[${now()}] Current block:`, await ethers.provider.getBlockNumber());

  let totalGas = bn.from(0);
  for (const step of plan) {
    const cost = step.gas.mul(GAS_PRICE);
    totalGas = totalGas.add(step.gas);
    console.log(`~ ${step.label.padEnd(24)} gas≈ ${step.gas.toString().padStart(8)}  cost≈ ${fmtBNB(cost)} BNB`);
  }
  const totalCost = totalGas.mul(GAS_PRICE);
  const totalCostBuf = totalCost; // already buffered per-step
  console.log("-------------------------------------------------");
  console.log(`Estimated total gas: ${totalGas.toString()}`);
  console.log(`Estimated total cost: ≈ ${fmtBNB(totalCostBuf)} BNB`);

  if (bal.lt(totalCostBuf)) {
    throw new Error(
      `❌ Insufficient funds: need ≈ ${fmtBNB(totalCostBuf)} BNB, have ${fmtBNB(bal)} BNB`
    );
  } else {
    console.log(`✅ You appear funded for this deploy.`);
  }

  // helper to build per-call overrides with gasLimit
  const ov = (g) => ({ ...baseOv, gasLimit: bn.from(g) });

  // Get multisig owners from env or use deployer as default
  const getMultisigOwners = () => {
    const owners = [];
    for (let i = 0; i < 5; i++) {
      const envKey = `MULTISIG_OWNER_${i + 1}`;
      const owner = process.env[envKey];
      if (owner && ethers.utils.isAddress(owner)) {
        owners.push(owner);
      } else {
        // Use deployer as default for testing
        owners.push(deployer.address);
      }
    }
    return owners;
  };
  
  // ---------- ACTUAL DEPLOYMENT ----------
  // 1) Deploy SavitriCoin
  console.log(`[${now()}] STEP 1: Deploy SavitriCoin`);
  const SavitriCoin = await ethers.getContractFactory("SavitriCoin");
  const sav = await SavitriCoin.deploy({ ...firstOv, gasLimit: plan[0].gas });
  await waitFor(sav.deployTransaction, "SAV deploy");
  console.log("✅ SAV deployed @", sav.address);

  // 2) Deploy TokenICO
  console.log(`[${now()}] STEP 2: Deploy TokenICO`);
  const TokenICO = await ethers.getContractFactory("TokenICO");
  const ico = await TokenICO.deploy(ov(plan[1].gas));
  await waitFor(ico.deployTransaction, "ICO deploy");
  console.log("✅ TokenICO deployed @", ico.address);

  // 3) Configure signer
  console.log(`[${now()}] STEP 3: Configure signer`);
  const SIGNER =
    process.env.NEXT_PUBLIC_SIGNER_ADDRESS ||
    process.env.SIGNER_ADDRESS ||
    ethers.constants.AddressZero;

  if (!ethers.utils.isAddress(SIGNER) || SIGNER === ethers.constants.AddressZero) {
    throw new Error("Missing/invalid SIGNER address in env (NEXT_PUBLIC_SIGNER_ADDRESS or SIGNER_ADDRESS).");
  }
  await waitFor(ico.setSigner(SIGNER, ov(plan[2].gas)), "ICO.setSigner");
  console.log("✅ signer set:", await ico.callStatic.signer());

  // 4) Bind sale token
  console.log(`[${now()}] STEP 4: Bind sale token`);
  await waitFor(ico.setSaleToken(sav.address, ov(plan[3].gas)), "ICO.setSaleToken");
  console.log("✅ saleToken set:", sav.address);

  // 5) Allow ICO sender (if supported by SAV)
  console.log(`[${now()}] STEP 5: Allow ICO sender (if supported)`);
  try {
    if (typeof sav.setAllowedSender === "function") {
      await waitFor(sav.setAllowedSender(ico.address, true, ov(plan[5].gas)), "SAV.setAllowedSender");
      console.log("✅ SAV allowedSender[ICO] =", await sav.allowedSenders(ico.address));
    } else {
      console.log("ℹ️ SAV has no setAllowedSender; skipping");
    }
  } catch (e) {
    console.log("⚠️ setAllowedSender failed (continuing):", e?.message);
  }

  // 6) Fund ICO with SAV inventory to sell
  console.log(`[${now()}] STEP 6: Fund ICO with SAV`);
  const SALE_INVENTORY = process.env.SALE_INVENTORY || "500000";
  await waitFor(
    sav.transfer(ico.address, ethers.utils.parseUnits(SALE_INVENTORY, 18), ov(plan[4].gas)),
    `SAV.transfer(ICO, ${SALE_INVENTORY})`
  );
  console.log(`✅ ICO funded with ${SALE_INVENTORY} SAV`);

  // 7) Deploy ERC20 mocks (StableCoins)
  console.log(`[${now()}] STEP 7: Deploy ERC20 mocks`);
  const Mock = await ethers.getContractFactory("StableCoins"); // constructor: (name, symbol, decimals)
  const usdt = await Mock.deploy("USDT", "USDT", 6, ov(post[0 + 4][1])); // plan idx 8 overall -> use label map
  await waitFor(usdt.deployTransaction, "USDT mock deploy");
  const usdc = await Mock.deploy("USDC", "USDC", 6, ov(post[1 + 4][1]));
  await waitFor(usdc.deployTransaction, "USDC mock deploy");
  const eth  = await Mock.deploy("ETH",  "ETH",  18, ov(post[2 + 4][1]));
  await waitFor(eth.deployTransaction,  "ETH  mock deploy");
  const sol  = await Mock.deploy("SOL",  "SOL",  9,  ov(post[3 + 4][1]));
  await waitFor(sol.deployTransaction,  "SOL  mock deploy");
  const btc  = await Mock.deploy("BTC",  "BTC",  8,  ov(post[4 + 4][1]));
  await waitFor(btc.deployTransaction,  "BTC  mock deploy");
  console.log("✅ Mocks:", {
    usdt: usdt.address, usdc: usdc.address, eth: eth.address, sol: sol.address, btc: btc.address,
  });

  // Optional: mint if your StableCoins contract has a mint function
  try {
    if (usdt.mint) {
      await waitFor(usdt.mint(deployer.address, ethers.utils.parseUnits("50000", 6), ov(120_000)), "USDT.mint");
      await waitFor(usdc.mint(deployer.address, ethers.utils.parseUnits("50000", 6), ov(120_000)), "USDC.mint");
      await waitFor(eth.mint (deployer.address, ethers.utils.parseUnits("100", 18),  ov(120_000)), "ETH.mint");
      await waitFor(sol.mint (deployer.address, ethers.utils.parseUnits("10000", 9), ov(120_000)), "SOL.mint");
      await waitFor(btc.mint (deployer.address, ethers.utils.parseUnits("10", 8),   ov(120_000)), "BTC.mint");
      console.log("✅ Mock balances minted to deployer");
    } else {
      console.log("ℹ️ StableCoins has no mint(); skipping mint");
    }
  } catch (e) {
    console.log("⚠️ Mint calls failed/absent (continuing):", e?.message);
  }

  // 8) Deploy price feed mocks
  console.log(`[${now()}] STEP 8: Deploy price feed mocks`);
  const Feed = await ethers.getContractFactory("MockPriceFeed");
  const bnbFeed = await Feed.deploy(8, ethers.utils.parseUnits("300", 8), ov(700000));
  await waitFor(bnbFeed.deployTransaction, "BNB feed deploy");
  const ethFeed = await Feed.deploy(8, ethers.utils.parseUnits("2000", 8), ov(700000));
  await waitFor(ethFeed.deployTransaction, "ETH feed deploy");
  const btcFeed = await Feed.deploy(8, ethers.utils.parseUnits("30000", 8), ov(700000));
  await waitFor(btcFeed.deployTransaction, "BTC feed deploy");
  const solFeed = await Feed.deploy(8, ethers.utils.parseUnits("150", 8), ov(700000));
  await waitFor(solFeed.deployTransaction, "SOL feed deploy");
  console.log("✅ Price feed mocks deployed");

  // 9) Register payment tokens on ICO (your ABI uses 1 arg)
  console.log(`[${now()}] STEP 9: Register payment tokens`);
  await waitFor(ico.updateUSDT(usdt.address, ov(post[9][1])), "ICO.updateUSDT");
  await waitFor(ico.updateUSDC(usdc.address, ov(post[10][1])), "ICO.updateUSDC");
  await waitFor(ico.updateETH(eth.address,   ov(post[11][1])), "ICO.updateETH");
  await waitFor(ico.updateSOL(sol.address,   ov(post[12][1])), "ICO.updateSOL");
  await waitFor(ico.updateBTC(btc.address,   ov(post[13][1])), "ICO.updateBTC");
  console.log("✅ Payment methods registered");

  // 10) Set price feeds
  console.log(`[${now()}] STEP 10: Set price feeds`);
  await waitFor(ico.setBNBPriceFeed(bnbFeed.address, ov(80_000)), "ICO.setBNBPriceFeed");
  await waitFor(ico.setETHPriceFeed(ethFeed.address, ov(80_000)), "ICO.setETHPriceFeed");
  await waitFor(ico.setBTCPriceFeed(btcFeed.address, ov(80_000)), "ICO.setBTCPriceFeed");
  await waitFor(ico.setSOLPriceFeed(solFeed.address, ov(80_000)), "ICO.setSOLPriceFeed");
  console.log("✅ Price feeds set");

  // 11) Intervals
  console.log(`[${now()}] STEP 11: Set intervals`);
  const waitlistInterval = u(process.env.NEXT_PUBLIC_WAITLIST_INTERVAL, 14 * 24 * 60 * 60);
  const publicInterval   = u(process.env.NEXT_PUBLIC_PUBLIC_INTERVAL,    7 * 24 * 60 * 60);
  await waitFor(ico.setIntervals(waitlistInterval, publicInterval, ov(post[14][1])), "ICO.setIntervals");
  console.log(
    "✅ intervals set:",
    "WL=" + (await ico.waitlistInterval()).toString() + "s,",
    "PUBLIC=" + (await ico.publicInterval()).toString() + "s"
  );

  // 12) Sale start time
  console.log(`[${now()}] STEP 12: Set sale start time`);
  const latest = await ethers.provider.getBlock("latest");
  await waitFor(ico.setSaleStartTime(latest.timestamp, ov(post[15][1])), "ICO.setSaleStartTime");
  console.log("✅ sale start time set:", (await ico.saleStartTime()).toString());

  // ---- Export addresses (copy-paste to your frontend .env)
  console.log("-------- EXPORT --------");
  console.log("NEXT_PUBLIC_TOKEN_ICO_ADDRESS =", ico.address);
  console.log("NEXT_PUBLIC_OWNER_ADDRESS     =", deployer.address);
  console.log("NEXT_PUBLIC_SAV_ADDRESS       =", sav.address);
  console.log("NEXT_PUBLIC_USDT_ADDRESS      =", usdt.address);
  console.log("NEXT_PUBLIC_USDC_ADDRESS      =", usdc.address);
  console.log("NEXT_PUBLIC_ETH_ADDRESS       =", eth.address);
  console.log("NEXT_PUBLIC_SOL_ADDRESS       =", sol.address);
  console.log("NEXT_PUBLIC_BTC_ADDRESS       =", btc.address);
  console.log("NEXT_PUBLIC_BNB_FEED          =", bnbFeed.address);
  console.log("NEXT_PUBLIC_ETH_FEED          =", ethFeed.address);
  console.log("NEXT_PUBLIC_BTC_FEED          =", btcFeed.address);
  console.log("NEXT_PUBLIC_SOL_FEED          =", solFeed.address);
}

main().then(() => process.exit(0)).catch((e) => {
  console.error("❌ Deploy failed:", e);
  process.exit(1);
});
