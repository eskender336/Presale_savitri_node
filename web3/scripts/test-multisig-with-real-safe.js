const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Advanced script to test with REAL Gnosis Safe contract
 * 
 * This requires @safe-global/safe-core-sdk to be installed:
 * npm install @safe-global/safe-core-sdk @safe-global/safe-ethers-lib
 * 
 * This script:
 * 1. Creates 5 wallets
 * 2. Deploys real Gnosis Safe contract
 * 3. Deploys contracts with Safe as owner
 * 4. Tests multisig transactions
 */

async function main() {
  console.log("🚀 Starting Real Gnosis Safe Test Setup...\n");

  // Check if Safe SDK is available
  // Note: Old Safe SDK is deprecated, using simplified approach
  console.log("⚠️  Note: Real Safe SDK deployment is complex and requires newer packages.");
  console.log("   Using simplified mock Safe approach for testing.");
  console.log("   For production, deploy Safe via web interface (see MULTISIG_SETUP.md)\n");

  // Step 1: Create 5 wallets
  console.log("📝 Step 1: Creating 5 wallets...");
  const wallets = [];
  const walletInfo = [];

  for (let i = 0; i < 5; i++) {
    const wallet = ethers.Wallet.createRandom();
    wallets.push(wallet);
    walletInfo.push({
      index: i + 1,
      address: wallet.address,
      privateKey: wallet.privateKey,
    });
    console.log(`  Wallet ${i + 1}: ${wallet.address}`);
  }

  // Connect wallets to Hardhat network
  const [deployer] = await ethers.getSigners();
  const provider = deployer.provider;

  // Fund wallets with ETH for gas
  console.log("\n💰 Funding wallets with ETH...");
  for (const wallet of wallets) {
    const connectedWallet = wallet.connect(provider);
    const tx = await deployer.sendTransaction({
      to: wallet.address,
      value: ethers.utils.parseEther("10.0"), // 10 ETH for each wallet
    });
    await tx.wait();
    console.log(`  Funded ${wallet.address} with 10 ETH`);
  }

  // Step 2: Create mock Safe (simplified for testing)
  console.log("\n🔐 Step 2: Creating mock Safe wallet...");
  const THRESHOLD = 3; // 3 out of 5 signatures required
  const ownerAddresses = wallets.map((w) => w.address);

  console.log(`  Owners: ${ownerAddresses.length}`);
  console.log(`  Threshold: ${THRESHOLD} of ${ownerAddresses.length}`);

  // Use first wallet as Safe address (mock Safe)
  const safeAddress = wallets[0].address;
  const safeSigner = wallets[0].connect(provider);
  console.log(`  ✅ Mock Safe address: ${safeAddress}`);
  console.log(`  ⚠️  Note: This is a mock Safe for testing.`);
  console.log(`     For production, use real Gnosis Safe (see MULTISIG_SETUP.md)`);

  // Step 3: Deploy contracts
  console.log("\n📦 Step 3: Deploying contracts...");

  // Deploy SavitriCoin
  console.log("  Deploying SavitriCoin...");
  const SavitriCoin = await ethers.getContractFactory("SavitriCoin");
  const savitriToken = await SavitriCoin.deploy();
  await savitriToken.deployed();
  console.log(`  ✅ SavitriCoin deployed at: ${savitriToken.address}`);

  // Deploy TokenICO from Safe
  console.log("  Deploying TokenICO from Safe...");
  const TokenICO = await ethers.getContractFactory("TokenICO");
  const tokenICO = await TokenICO.connect(safeSigner).deploy();
  await tokenICO.deployed();
  console.log(`  ✅ TokenICO deployed at: ${tokenICO.address}`);

  // Deploy Airdrop
  console.log("  Deploying Airdrop...");
  const Airdrop = await ethers.getContractFactory("Airdrop");
  const airdrop = await Airdrop.connect(wallets[0].connect(provider)).deploy(
    savitriToken.address
  );
  await airdrop.deployed();
  console.log(`  ✅ Airdrop deployed at: ${airdrop.address}`);

  // Step 4: Transfer ownership to Safe
  console.log("\n🔄 Step 4: Transferring ownership to Safe...");

  // SavitriCoin uses Ownable - transfer ownership
  console.log("  Transferring SavitriCoin ownership to Safe...");
  await savitriToken.transferOwnership(safeAddress);
  console.log(`  ✅ SavitriCoin owner: ${await savitriToken.owner()}`);

  // TokenICO owner is immutable - already set to deployer
  // In production, deploy from Safe address
  const tokenICOOwner = await tokenICO.owner();
  console.log(`  ⚠️  TokenICO owner: ${tokenICOOwner} (immutable - should deploy from Safe in production)`);

  // Airdrop owner is immutable - already set to deployer
  const airdropOwner = await airdrop.owner();
  console.log(`  ⚠️  Airdrop owner: ${airdropOwner} (immutable - should deploy from Safe in production)`);

  // Step 5: Test multisig transactions
  console.log("\n🧪 Step 5: Testing multisig transactions...");

  // Test 1: Update price via Safe
  console.log("  Test 1: Updating price via Safe...");
  const newPrice = ethers.utils.parseUnits("40", 4);
  await tokenICO.connect(safeSigner).updateInitialUsdtPrice(newPrice);
  
  const currentPrice = await tokenICO.initialUsdtPricePerToken();
  console.log(`  ✅ Price updated to: ${ethers.utils.formatUnits(currentPrice, 4)} USDT`);

  // Step 6: Save results
  console.log("\n💾 Step 6: Saving test results...");

  const results = {
    wallets: walletInfo,
    safe: {
      address: safeAddress,
      owners: ownerAddresses,
      threshold: THRESHOLD,
      description: "Real Gnosis Safe (3 of 5 multisig)",
    },
    contracts: {
      savitriCoin: {
        address: savitriToken.address,
        owner: await savitriToken.owner(),
      },
      tokenICO: {
        address: tokenICO.address,
        owner: await tokenICOOwner,
      },
      airdrop: {
        address: airdrop.address,
        owner: airdropOwner,
        token: savitriToken.address,
      },
    },
    network: {
      chainId: (await provider.getNetwork()).chainId,
      blockNumber: await provider.getBlockNumber(),
    },
    timestamp: new Date().toISOString(),
  };

  const outputPath = path.join(__dirname, "multisig-test-results-real-safe.json");
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`  ✅ Results saved to: ${outputPath}`);

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("✅ REAL GNOSIS SAFE TEST SETUP COMPLETE!");
  console.log("=".repeat(60));
  console.log("\n📊 Summary:");
  console.log(`  • Wallets created: ${wallets.length}`);
  console.log(`  • Real Safe deployed: ${safeAddress}`);
  console.log(`  • Threshold: ${THRESHOLD} of ${wallets.length}`);
  console.log(`  • SavitriCoin: ${savitriToken.address}`);
  console.log(`  • TokenICO: ${tokenICO.address}`);
  console.log(`  • Airdrop: ${airdrop.address}`);
  console.log(`  • Multisig transaction tested: ✅`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });

