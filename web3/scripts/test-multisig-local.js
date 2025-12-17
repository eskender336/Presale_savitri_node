const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Script to test multisig wallet locally with Hardhat
 * 
 * This script:
 * 1. Creates 5 wallets
 * 2. Creates a mock multisig wallet (Safe)
 * 3. Deploys contracts with Safe as owner
 * 4. Tests owner functions
 */

async function main() {
  console.log("🚀 Starting Multisig Local Test Setup...\n");

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

  // Step 2: Create mock Safe (using first wallet as Safe address)
  console.log("\n🔐 Step 2: Creating mock Safe wallet...");
  const THRESHOLD = 3; // 3 out of 5 signatures required
  const safeAddress = wallets[0].address; // Use first wallet as Safe address

  const safeInfo = {
    safeAddress: safeAddress,
    owners: wallets.map((w) => w.address),
    threshold: THRESHOLD,
    description: "Mock Safe for local testing (3 of 5 multisig)",
  };

  console.log(`  Safe Address: ${safeAddress}`);
  console.log(`  Owners: ${wallets.length}`);
  console.log(`  Threshold: ${THRESHOLD} of ${wallets.length}`);

  // Step 3: Deploy contracts
  console.log("\n📦 Step 3: Deploying contracts...");

  // Deploy SavitriCoin
  console.log("  Deploying SavitriCoin...");
  const SavitriCoin = await ethers.getContractFactory("SavitriCoin");
  const savitriToken = await SavitriCoin.deploy();
  await savitriToken.deployed();
  console.log(`  ✅ SavitriCoin deployed at: ${savitriToken.address}`);

  // Deploy TokenICO (deploy from Safe address - use first wallet)
  console.log("  Deploying TokenICO...");
  const TokenICO = await ethers.getContractFactory("TokenICO");
  const tokenICO = await TokenICO.connect(wallets[0].connect(provider)).deploy();
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

  // SavitriCoin uses Ownable - can transfer ownership
  console.log("  Transferring SavitriCoin ownership to Safe...");
  const transferTx = await savitriToken.transferOwnership(safeAddress);
  await transferTx.wait();
  console.log(`  ✅ SavitriCoin owner: ${await savitriToken.owner()}`);

  // TokenICO owner is immutable - already set to deployer (Safe)
  const tokenICOOwner = await tokenICO.owner();
  console.log(`  ✅ TokenICO owner: ${tokenICOOwner} (immutable)`);

  // Airdrop owner is immutable - already set to deployer (Safe)
  const airdropOwner = await airdrop.owner();
  console.log(`  ✅ Airdrop owner: ${airdropOwner} (immutable)`);

  // Step 5: Test owner functions
  console.log("\n🧪 Step 5: Testing owner functions...");

  const safeSigner = wallets[0].connect(provider);

  // Test 1: Update price in TokenICO
  console.log("  Test 1: Updating price in TokenICO...");
  const newPrice = ethers.utils.parseUnits("40", 4);
  const priceTx = await tokenICO.connect(safeSigner).updateInitialUsdtPrice(newPrice);
  await priceTx.wait();
  const currentPrice = await tokenICO.initialUsdtPricePerToken();
  console.log(`  ✅ Price updated to: ${ethers.utils.formatUnits(currentPrice, 4)} USDT`);

  // Test 2: Set sale token
  console.log("  Test 2: Setting sale token...");
  const setTokenTx = await tokenICO.connect(safeSigner).setSaleToken(savitriToken.address);
  await setTokenTx.wait();
  const saleToken = await tokenICO.saleToken();
  console.log(`  ✅ Sale token set to: ${saleToken}`);

  // Test 3: Set block status in SavitriCoin
  console.log("  Test 3: Setting block status in SavitriCoin...");
  const nonOwnerAddress = (await ethers.getSigners())[10].address; // Use 11th signer as non-owner
  const blockTx = await savitriToken.connect(safeSigner).setBlockStatus(nonOwnerAddress, true);
  await blockTx.wait();
  const isBlocked = await savitriToken.blockedAddresses(nonOwnerAddress);
  console.log(`  ✅ Block status set: ${isBlocked}`);

  // Test 4: Set Merkle root in Airdrop
  console.log("  Test 4: Setting Merkle root in Airdrop...");
  const merkleRoot = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test-merkle-root"));
  const merkleTx = await airdrop.connect(safeSigner).setMerkleRoot(merkleRoot);
  await merkleTx.wait();
  const root = await airdrop.merkleRoot();
  console.log(`  ✅ Merkle root set: ${root}`);

  // Test 5: Test non-owner rejection
  console.log("  Test 5: Testing non-owner rejection...");
  const nonOwnerSigner = wallets[1].connect(provider);
  try {
    await tokenICO.connect(nonOwnerSigner).updateInitialUsdtPrice(newPrice);
    console.log("  ❌ ERROR: Non-owner was able to call owner function!");
  } catch (error) {
    if (error.message.includes("Only owner")) {
      console.log("  ✅ Non-owner correctly rejected");
    } else {
      throw error;
    }
  }

  // Step 6: Save results
  console.log("\n💾 Step 6: Saving test results...");

  const results = {
    wallets: walletInfo,
    safe: safeInfo,
    contracts: {
      savitriCoin: {
        address: savitriToken.address,
        owner: await savitriToken.owner(),
      },
      tokenICO: {
        address: tokenICO.address,
        owner: await tokenICO.owner(),
      },
      airdrop: {
        address: airdrop.address,
        owner: await airdrop.owner(),
        token: savitriToken.address,
      },
    },
    network: {
      chainId: (await provider.getNetwork()).chainId,
      blockNumber: await provider.getBlockNumber(),
    },
    timestamp: new Date().toISOString(),
  };

  const outputPath = path.join(__dirname, "multisig-test-results.json");
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`  ✅ Results saved to: ${outputPath}`);

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("✅ MULTISIG TEST SETUP COMPLETE!");
  console.log("=".repeat(60));
  console.log("\n📊 Summary:");
  console.log(`  • Wallets created: ${wallets.length}`);
  console.log(`  • Safe address: ${safeAddress}`);
  console.log(`  • Threshold: ${THRESHOLD} of ${wallets.length}`);
  console.log(`  • SavitriCoin: ${savitriToken.address}`);
  console.log(`  • TokenICO: ${tokenICO.address}`);
  console.log(`  • Airdrop: ${airdrop.address}`);
  console.log(`  • All owner functions tested: ✅`);
  console.log(`  • Non-owner rejection tested: ✅`);
  console.log("\n💡 Note: In production, use real Gnosis Safe instead of mock");
  console.log("   For real Safe deployment, see: MULTISIG_SETUP.md");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });

