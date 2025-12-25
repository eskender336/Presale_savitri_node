// scripts/deploy.multisig.js
// DEPLOY CONTRACTS WITH MULTISIG WALLET (GNOSIS SAFE)
// 
// This script deploys contracts using one of the Safe owner wallets as deployer.
// IMPORTANT: TokenICO owner is immutable, so it will be set to the deployer address.
//            Make sure the deployer is one of your Safe owners!
//
// Usage:
//   1. Set SAFE_ADDRESS in .env file
//   2. Configure Hardhat to use one of Safe owner wallets as deployer
//   3. Run: npx hardhat run scripts/deploy.multisig.js --network bsc
//
// For production:
//   - Use one of your Safe owner wallets (MetaMask, Ledger, etc.)
//   - Connect it to Hardhat via private key or hardware wallet
//   - Run this script
//   - After deployment, transfer SavitriCoin ownership to Safe address

const hre = require("hardhat");
require("dotenv").config();

function u(v, d = 0) {
  const n = parseInt(v ?? "", 10);
  return Number.isFinite(n) ? n : d;
}

const isAddr = (x) => {
  try { return hre.ethers.utils.isAddress(x); } catch { return false; }
};

async function waitFor(txPromise, label = "tx") {
  const tx = await txPromise;
  console.log(`→ sent ${label}: ${tx.hash}`);
  const rcpt = await tx.wait(1);
  console.log(`✓ mined ${label}: block=${rcpt.blockNumber} gasUsed=${rcpt.gasUsed?.toString()}`);
  return rcpt;
}

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const net = await hre.ethers.provider.getNetwork();

  // Get Safe address from env
  const SAFE_ADDRESS = process.env.SAFE_ADDRESS;
  if (!SAFE_ADDRESS || !isAddr(SAFE_ADDRESS)) {
    throw new Error("SAFE_ADDRESS not set or invalid in .env file. Set it to your Gnosis Safe address.");
  }

  console.log("========================================");
  console.log("MULTISIG DEPLOYMENT");
  console.log("========================================");
  console.log("Network:", net.chainId, net.name || "");
  console.log("Deployer:", deployer.address);
  console.log("Safe Address:", SAFE_ADDRESS);
  console.log("========================================\n");

  // Verify deployer is not the Safe address (Safe is a contract, can't deploy)
  if (deployer.address.toLowerCase() === SAFE_ADDRESS.toLowerCase()) {
    throw new Error("Deployer cannot be Safe address. Use one of Safe owner wallets instead.");
  }

  // Gas overrides
  const GAS_PRICE_GWEI = process.env.GAS_PRICE_GWEI || "10";
  const GAS_LIMIT = u(process.env.GAS_LIMIT, 8_000_000); // Increased for TokenICO with libraries
  const overrides = {
    gasPrice: hre.ethers.utils.parseUnits(GAS_PRICE_GWEI, "gwei"),
    gasLimit: GAS_LIMIT,
  };

  const bal = await deployer.getBalance();
  console.log(`Deployer balance: ${hre.ethers.utils.formatEther(bal)} ${net.chainId === 56 ? "BNB" : "ETH"}\n`);

  // ===== STEP 1: Use existing SavitriCoin or deploy new =====
  const EXISTING_SAVITRI_COIN = process.env.SAVITRI_COIN_ADDRESS || 
                                  process.env.NEXT_PUBLIC_SAVITRI_COIN_ADDRESS;
  
  let savitriToken;
  
  if (EXISTING_SAVITRI_COIN && isAddr(EXISTING_SAVITRI_COIN)) {
    console.log("STEP 1: Using existing SavitriCoin...");
    const SavitriCoin = await hre.ethers.getContractFactory("SavitriCoin");
    savitriToken = SavitriCoin.attach(EXISTING_SAVITRI_COIN);
    console.log("✅ Using existing SavitriCoin @", savitriToken.address);
    console.log("   Owner:", await savitriToken.owner());
    console.log("");
  } else {
    console.log("STEP 1: Deploying new SavitriCoin...");
    const SavitriCoin = await hre.ethers.getContractFactory("SavitriCoin");
    savitriToken = await SavitriCoin.deploy(overrides);
    await waitFor(savitriToken.deployTransaction, "SavitriCoin deploy");
    console.log("✅ SavitriCoin deployed @", savitriToken.address);
    console.log("   Owner:", await savitriToken.owner());
    console.log("");
  }

  // ===== STEP 2: Deploy Libraries =====
  console.log("STEP 2: Deploying libraries...");
  
  const PriceCalculationLibrary = await hre.ethers.getContractFactory("PriceCalculationLibrary");
  const priceCalcLib = await PriceCalculationLibrary.deploy(overrides);
  await waitFor(priceCalcLib.deployTransaction, "PriceCalculationLibrary deploy");
  console.log("✅ PriceCalculationLibrary deployed @", priceCalcLib.address);
  
  const StakingLibrary = await hre.ethers.getContractFactory("StakingLibrary");
  const stakingLib = await StakingLibrary.deploy(overrides);
  await waitFor(stakingLib.deployTransaction, "StakingLibrary deploy");
  console.log("✅ StakingLibrary deployed @", stakingLib.address);
  
  console.log("");

  // ===== STEP 3: Deploy TokenICO with linked libraries =====
  console.log("STEP 3: Deploying TokenICO with linked libraries...");
  console.log("⚠️  IMPORTANT: TokenICO owner is IMMUTABLE and will be set to Safe address!");
  console.log("   Deployer:", deployer.address);
  console.log("   Safe Address (will be owner):", SAFE_ADDRESS);
  console.log("   This ensures multisig control!\n");
  
  const TokenICO = await hre.ethers.getContractFactory("TokenICO", {
    libraries: {
      PriceCalculationLibrary: priceCalcLib.address,
      StakingLibrary: stakingLib.address,
    },
  });
  const tokenICO = await TokenICO.deploy(SAFE_ADDRESS, overrides);
  await waitFor(tokenICO.deployTransaction, "TokenICO deploy");
  console.log("✅ TokenICO deployed @", tokenICO.address);
  const tokenICOOwner = await tokenICO.owner();
  console.log("   Owner:", tokenICOOwner);
  if (tokenICOOwner.toLowerCase() === SAFE_ADDRESS.toLowerCase()) {
    console.log("   ✓ Owner is Safe address - multisig control enabled!");
  } else {
    console.log("   ⚠️  Owner mismatch! Expected Safe, got:", tokenICOOwner);
  }
  console.log("");

  // ===== STEP 4: Transfer SavitriCoin ownership to Safe =====
  console.log("STEP 4: Transferring SavitriCoin ownership to Safe...");
  const currentOwner = await savitriToken.owner();
  
  if (currentOwner.toLowerCase() === SAFE_ADDRESS.toLowerCase()) {
    console.log("✅ SavitriCoin already owned by Safe address");
    console.log("   Owner:", currentOwner);
    console.log("   ✓ No transfer needed!\n");
  } else {
    try {
      await waitFor(savitriToken.transferOwnership(SAFE_ADDRESS, overrides), "transferOwnership");
      const newOwner = await savitriToken.owner();
      console.log("✅ SavitriCoin ownership transferred");
      console.log("   New owner:", newOwner);
      if (newOwner.toLowerCase() === SAFE_ADDRESS.toLowerCase()) {
        console.log("   ✓ Ownership successfully transferred to Safe!");
      } else {
        console.log("   ⚠️  Ownership transfer pending - Safe needs to accept");
      }
    } catch (e) {
      console.log("⚠️  Failed to transfer ownership (may need to be done via Safe):", e.message);
      console.log("   Current owner:", currentOwner);
      console.log("   Target Safe:", SAFE_ADDRESS);
    }
    console.log("");
  }

  // ===== STEP 5: Deploy PrivateSaleDistribution (Optional) =====
  const DEPLOY_PRIVATE_SALE = process.env.DEPLOY_PRIVATE_SALE_DISTRIBUTION === "true";
  let privateSaleDistribution = null;
  
  if (DEPLOY_PRIVATE_SALE) {
    console.log("STEP 4: Deploying PrivateSaleDistribution...");
    console.log("⚠️  IMPORTANT: PrivateSaleDistribution owner is IMMUTABLE and will be set to Safe address!");
    console.log("   Safe Address (will be owner):", SAFE_ADDRESS);
    console.log("   This ensures multisig control!\n");
    
    const PrivateSaleDistribution = await hre.ethers.getContractFactory("PrivateSaleDistribution");
    privateSaleDistribution = await PrivateSaleDistribution.deploy(savitriToken.address, SAFE_ADDRESS, overrides);
    await waitFor(privateSaleDistribution.deployTransaction, "PrivateSaleDistribution deploy");
    console.log("✅ PrivateSaleDistribution deployed @", privateSaleDistribution.address);
    const psdOwner = await privateSaleDistribution.owner();
    console.log("   Owner:", psdOwner);
    if (psdOwner.toLowerCase() === SAFE_ADDRESS.toLowerCase()) {
      console.log("   ✓ Owner is Safe address - multisig control enabled!");
    } else {
      console.log("   ⚠️  Owner mismatch! Expected Safe, got:", psdOwner);
    }
    console.log("");
  } else {
    console.log("STEP 4: Skipping PrivateSaleDistribution deployment");
    console.log("   (Set DEPLOY_PRIVATE_SALE_DISTRIBUTION=true in .env to deploy)\n");
  }

  // ===== STEP 6: Configure TokenICO =====
  console.log("STEP 6: Configuring TokenICO...");
  console.log("⚠️  NOTE: TokenICO owner is Safe address, so configuration must be done via Safe multisig.");
  console.log("   The script will attempt to configure, but these calls may fail.");
  console.log("   If they fail, execute them via Safe after deployment.\n");

  // Set signer (this might work if signer is separate from owner)
  const SIGNER = process.env.SIGNER_ADDRESS || process.env.NEXT_PUBLIC_SIGNER_ADDRESS;
  if (SIGNER && isAddr(SIGNER)) {
    try {
      await waitFor(tokenICO.setSigner(SIGNER, overrides), "setSigner");
      console.log("✅ Signer set:", SIGNER);
    } catch (e) {
      console.log("⚠️  setSigner failed (owner is Safe) - execute via Safe:", SIGNER);
    }
  } else {
    console.log("⚠️  SIGNER_ADDRESS not set, skipping");
  }

  // Set sale token (requires owner, will fail if owner is Safe)
  try {
    await waitFor(tokenICO.setSaleToken(savitriToken.address, overrides), "setSaleToken");
    console.log("✅ Sale token set:", savitriToken.address);
  } catch (e) {
    console.log("⚠️  setSaleToken failed (owner is Safe) - execute via Safe:", savitriToken.address);
  }

  // Fund ICO with tokens (if deployer has tokens)
  const SALE_INVENTORY = process.env.SALE_INVENTORY || "500000";
  const inventoryAmount = hre.ethers.utils.parseUnits(SALE_INVENTORY, 18);
  const deployerBalance = await savitriToken.balanceOf(deployer.address);
  
  if (deployerBalance.gte(inventoryAmount)) {
    await waitFor(
      savitriToken.transfer(tokenICO.address, inventoryAmount, overrides),
      `transfer(${SALE_INVENTORY} SAV)`
    );
    console.log(`✅ ICO funded with ${SALE_INVENTORY} SAV tokens`);
  } else {
    console.log(`⚠️  Deployer doesn't have enough tokens to fund ICO`);
    console.log(`   Deployer balance: ${hre.ethers.utils.formatEther(deployerBalance)} SAV`);
    console.log(`   Required: ${SALE_INVENTORY} SAV`);
    console.log(`   Transfer tokens to ICO via Safe: savitriToken.transfer(${tokenICO.address}, ${inventoryAmount})`);
  }

  // Allow ICO to transfer tokens
  try {
    if (typeof savitriToken.setAllowedSender === "function") {
      // Note: This requires SavitriCoin ownership, which is now Safe
      // You'll need to execute this via Safe after deployment
      console.log("⚠️  setAllowedSender requires Safe ownership - execute via Safe after deployment");
    }
  } catch (e) {
    console.log("ℹ️  setAllowedSender not available or failed");
  }

  // Configure payment tokens (if provided)
  const paymentTokens = {
    USDT: process.env.USDT_ADDRESS,
    USDC: process.env.USDC_ADDRESS,
    ETH: process.env.ETH_ADDRESS,
    SOL: process.env.SOL_ADDRESS,
    BTC: process.env.BTC_ADDRESS,
  };

  for (const [sym, addr] of Object.entries(paymentTokens)) {
    if (addr && isAddr(addr)) {
      const fn = `update${sym}`;
      if (tokenICO.interface.functions[`${fn}(address)`]) {
        try {
          await waitFor(tokenICO[fn](addr, overrides), `${fn}(${sym})`);
          console.log(`✅ ${sym} enabled @ ${addr}`);
        } catch (e) {
          console.log(`⚠️  ${fn} failed (owner is Safe) - execute via Safe: ${addr}`);
        }
      }
    }
  }

  // Configure price feeds
  const feeds = {
    BNB: process.env.BNB_FEED_ADDRESS,
    ETH: process.env.ETH_FEED_ADDRESS,
    BTC: process.env.BTC_FEED_ADDRESS,
    SOL: process.env.SOL_FEED_ADDRESS,
  };

  for (const [sym, addr] of Object.entries(feeds)) {
    if (addr && isAddr(addr)) {
      const fn = `set${sym}PriceFeed`;
      if (tokenICO.interface.functions[`${fn}(address)`]) {
        try {
          await waitFor(tokenICO[fn](addr, overrides), `${fn}(${sym})`);
          console.log(`✅ ${sym} price feed set @ ${addr}`);
        } catch (e) {
          console.log(`⚠️  ${fn} failed (owner is Safe) - execute via Safe: ${addr}`);
        }
      }
    }
  }

  // Set intervals
  const WAITLIST_INTERVAL = u(process.env.NEXT_PUBLIC_WAITLIST_INTERVAL, 14 * 24 * 60 * 60);
  const PUBLIC_INTERVAL = u(process.env.NEXT_PUBLIC_PUBLIC_INTERVAL, 7 * 24 * 60 * 60);
  try {
    await waitFor(tokenICO.setIntervals(WAITLIST_INTERVAL, PUBLIC_INTERVAL, overrides), "setIntervals");
    console.log(`✅ Intervals set: WL=${WAITLIST_INTERVAL}s, PUBLIC=${PUBLIC_INTERVAL}s`);
  } catch (e) {
    console.log(`⚠️  setIntervals failed (owner is Safe) - execute via Safe: ${WAITLIST_INTERVAL}s, ${PUBLIC_INTERVAL}s`);
  }

  // Set sale start time
  const latest = await hre.ethers.provider.getBlock("latest");
  const startAtEnv = u(process.env.SALE_START_AT, 0);
  const startTs = startAtEnv > 0 ? startAtEnv : latest.timestamp;
  try {
    await waitFor(tokenICO.setSaleStartTime(startTs, overrides), "setSaleStartTime");
    console.log(`✅ Sale start time set: ${startTs}`);
  } catch (e) {
    console.log(`⚠️  setSaleStartTime failed (owner is Safe) - execute via Safe: ${startTs}`);
  }

  console.log("");

  // ===== SUMMARY =====
  console.log("========================================");
  console.log("DEPLOYMENT SUMMARY");
  console.log("========================================");
  console.log("SavitriCoin:", savitriToken.address);
  console.log("  Owner:", await savitriToken.owner(), "(should be Safe)");
  console.log("");
  console.log("TokenICO:", tokenICO.address);
  console.log("  Owner:", await tokenICO.owner(), "(immutable - Safe address)");
  if (privateSaleDistribution) {
    console.log("");
    console.log("PrivateSaleDistribution:", privateSaleDistribution.address);
    console.log("  Owner:", await privateSaleDistribution.owner(), "(immutable - Safe address)");
  }
  console.log("");
  console.log("NEXT STEPS:");
  console.log("1. Verify contracts on block explorer");
  console.log("2. If SavitriCoin ownership transfer is pending, accept it via Safe");
  console.log("3. Execute setAllowedSender(ICO, true) via Safe for SavitriCoin");
  console.log("4. All future admin functions must be executed via Safe");
  console.log("========================================");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });

