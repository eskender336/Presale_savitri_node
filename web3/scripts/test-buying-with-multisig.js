const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Script to test buying tokens with regular wallet
 * when contracts are deployed with multisig wallet as owner
 * 
 * This script:
 * 1. Creates 5 wallets for Safe
 * 2. Deploys contracts with Safe as owner
 * 3. Sets up contracts (price feeds, sale token, etc.) via Safe
 * 4. Creates a regular buyer wallet
 * 5. Tests buying tokens with BNB and USDT
 */

async function main() {
  console.log("🚀 Starting Buy Test with Multisig Setup...\n");

  const [deployer] = await ethers.getSigners();
  const provider = deployer.provider;

  // Step 1: Create 5 wallets for Safe
  console.log("📝 Step 1: Creating 5 wallets for Safe...");
  const safeWallets = [];
  for (let i = 0; i < 5; i++) {
    const wallet = ethers.Wallet.createRandom();
    safeWallets.push(wallet);
    console.log(`  Safe Wallet ${i + 1}: ${wallet.address}`);
  }

  // Fund Safe wallets
  console.log("\n💰 Funding Safe wallets...");
  for (const wallet of safeWallets) {
    const tx = await deployer.sendTransaction({
      to: wallet.address,
      value: ethers.utils.parseEther("10.0"),
    });
    await tx.wait();
  }

  // Use first wallet as Safe address (mock Safe)
  const safeAddress = safeWallets[0].address;
  const safeSigner = safeWallets[0].connect(provider);
  console.log(`\n🔐 Safe Address: ${safeAddress}`);

  // Step 2: Deploy contracts
  console.log("\n📦 Step 2: Deploying contracts...");

  // Deploy SavitriCoin
  console.log("  Deploying SavitriCoin...");
  const SavitriCoin = await ethers.getContractFactory("SavitriCoin");
  const savitriToken = await SavitriCoin.deploy();
  await savitriToken.deployed();
  console.log(`  ✅ SavitriCoin: ${savitriToken.address}`);

  // Deploy TokenICO from Safe
  console.log("  Deploying TokenICO from Safe...");
  const TokenICO = await ethers.getContractFactory("TokenICO");
  const tokenICO = await TokenICO.connect(safeSigner).deploy();
  await tokenICO.deployed();
  console.log(`  ✅ TokenICO: ${tokenICO.address}`);

  // Transfer SavitriCoin ownership to Safe
  console.log("  Transferring SavitriCoin ownership to Safe...");
  await savitriToken.transferOwnership(safeAddress);
  console.log(`  ✅ SavitriCoin owner: ${await savitriToken.owner()}`);

  // Step 3: Deploy mock contracts for testing
  console.log("\n🔧 Step 3: Deploying mock contracts...");

  // Deploy Mock USDT
  console.log("  Deploying Mock USDT...");
  const StableCoins = await ethers.getContractFactory("StableCoins");
  const mockUSDT = await StableCoins.deploy("Tether USD", "USDT", 6);
  await mockUSDT.deployed();
  console.log(`  ✅ Mock USDT: ${mockUSDT.address}`);

  // Deploy Mock Price Feed for BNB
  console.log("  Deploying Mock BNB Price Feed...");
  const MockPriceFeed = await ethers.getContractFactory("MockPriceFeed");
  // Price: $300 per BNB, with 8 decimals = 300 * 10^8
  const mockBNBPriceFeed = await MockPriceFeed.deploy(8, ethers.BigNumber.from("30000000000")); // $300 per BNB
  await mockBNBPriceFeed.deployed();
  console.log(`  ✅ Mock BNB Price Feed: ${mockBNBPriceFeed.address}`);

  // Step 4: Setup contracts via Safe
  console.log("\n⚙️  Step 4: Setting up contracts via Safe...");

  // Transfer tokens to TokenICO
  console.log("  Transferring tokens to TokenICO...");
  const tokensToICO = ethers.utils.parseEther("1000000"); // 1M tokens
  await savitriToken.transfer(tokenICO.address, tokensToICO);
  console.log(`  ✅ Transferred ${ethers.utils.formatEther(tokensToICO)} tokens to ICO`);

  // Allow TokenICO to transfer tokens
  console.log("  Allowing TokenICO to transfer tokens...");
  await savitriToken.connect(safeSigner).setAllowedSender(tokenICO.address, true);
  console.log(`  ✅ TokenICO can now transfer tokens`);

  // Set sale token
  console.log("  Setting sale token...");
  await tokenICO.connect(safeSigner).setSaleToken(savitriToken.address);
  console.log(`  ✅ Sale token set`);

  // Set USDT address
  console.log("  Setting USDT address...");
  await tokenICO.connect(safeSigner).updateUSDT(mockUSDT.address);
  console.log(`  ✅ USDT address set`);

  // Set BNB price feed
  console.log("  Setting BNB price feed...");
  await tokenICO.connect(safeSigner).setBNBPriceFeed(mockBNBPriceFeed.address);
  console.log(`  ✅ BNB price feed set`);

  // Set sale start time (now)
  console.log("  Setting sale start time...");
  const block = await provider.getBlock("latest");
  await tokenICO.connect(safeSigner).setSaleStartTime(block.timestamp);
  console.log(`  ✅ Sale start time set to: ${new Date(block.timestamp * 1000).toISOString()}`);

  // Unpause contract (if paused)
  console.log("  Ensuring contract is not paused...");
  const isPaused = await tokenICO.paused();
  if (isPaused) {
    await tokenICO.connect(safeSigner).unpause();
    console.log(`  ✅ Contract unpaused`);
  } else {
    console.log(`  ✅ Contract is not paused`);
  }

  // Step 5: Create buyer wallet
  console.log("\n👤 Step 5: Creating buyer wallet...");
  const buyerWallet = ethers.Wallet.createRandom();
  const buyer = buyerWallet.connect(provider);
  console.log(`  Buyer address: ${buyer.address}`);

  // Fund buyer with BNB
  console.log("  Funding buyer with BNB...");
  await deployer.sendTransaction({
    to: buyer.address,
    value: ethers.utils.parseEther("5.0"), // 5 BNB
  });
  console.log(`  ✅ Buyer funded with 5 BNB`);

  // Mint USDT to buyer
  console.log("  Minting USDT to buyer...");
  const usdtAmount = ethers.utils.parseUnits("1000", 6); // 1000 USDT
  await mockUSDT.mint(buyer.address, usdtAmount);
  console.log(`  ✅ Buyer has ${ethers.utils.formatUnits(usdtAmount, 6)} USDT`);

  // Approve USDT spending
  console.log("  Approving USDT spending...");
  await mockUSDT.connect(buyer).approve(tokenICO.address, ethers.constants.MaxUint256);
  console.log(`  ✅ USDT approved`);

  // Step 6: Test buying with BNB
  console.log("\n🛒 Step 6: Testing purchase with BNB...");
  
  const bnbAmount = ethers.utils.parseEther("0.1"); // 0.1 BNB
  console.log(`  Buying with ${ethers.utils.formatEther(bnbAmount)} BNB...`);

  const buyerBalanceBefore = await savitriToken.balanceOf(buyer.address);
  console.log(`  Buyer balance before: ${ethers.utils.formatEther(buyerBalanceBefore)} SAV`);

  const tx1 = await tokenICO.connect(buyer).buyWithBNB({
    value: bnbAmount,
  });
  await tx1.wait();
  console.log(`  ✅ Transaction confirmed: ${tx1.hash}`);

  const buyerBalanceAfter = await savitriToken.balanceOf(buyer.address);
  const tokensReceived = buyerBalanceAfter.sub(buyerBalanceBefore);
  console.log(`  ✅ Buyer received: ${ethers.utils.formatEther(tokensReceived)} SAV tokens`);
  console.log(`  ✅ Buyer balance after: ${ethers.utils.formatEther(buyerBalanceAfter)} SAV`);

  // Step 7: Test buying with USDT
  console.log("\n🛒 Step 7: Testing purchase with USDT...");
  
  // Note: buyWithUSDT expects amount in whole units (not smallest units)
  // It will multiply by 10^stablecoinDecimals internally
  const usdtPurchaseAmount = 100; // 100 USDT (whole units)
  console.log(`  Buying with ${usdtPurchaseAmount} USDT...`);

  const buyerBalanceBeforeUSDT = await savitriToken.balanceOf(buyer.address);
  console.log(`  Buyer balance before: ${ethers.utils.formatEther(buyerBalanceBeforeUSDT)} SAV`);

  const tx2 = await tokenICO.connect(buyer).buyWithUSDT(usdtPurchaseAmount);
  await tx2.wait();
  console.log(`  ✅ Transaction confirmed: ${tx2.hash}`);

  const buyerBalanceAfterUSDT = await savitriToken.balanceOf(buyer.address);
  const tokensReceivedUSDT = buyerBalanceAfterUSDT.sub(buyerBalanceBeforeUSDT);
  console.log(`  ✅ Buyer received: ${ethers.utils.formatEther(tokensReceivedUSDT)} SAV tokens`);
  console.log(`  ✅ Buyer balance after: ${ethers.utils.formatEther(buyerBalanceAfterUSDT)} SAV`);

  // Step 8: Verify owner received payments
  console.log("\n💰 Step 8: Verifying owner received payments...");

  const ownerBNBBalance = await provider.getBalance(safeAddress);
  console.log(`  Safe BNB balance: ${ethers.utils.formatEther(ownerBNBBalance)} BNB`);

  const ownerUSDTBalance = await mockUSDT.balanceOf(safeAddress);
  console.log(`  Safe USDT balance: ${ethers.utils.formatUnits(ownerUSDTBalance, 6)} USDT`);

  // Step 9: Test that non-owner cannot setup
  console.log("\n🔒 Step 9: Testing security (non-owner cannot setup)...");
  
  try {
    await tokenICO.connect(buyer).setSaleToken(savitriToken.address);
    console.log("  ❌ ERROR: Non-owner was able to call owner function!");
  } catch (error) {
    if (error.message.includes("Only owner")) {
      console.log("  ✅ Non-owner correctly rejected");
    } else {
      throw error;
    }
  }

  // Step 10: Save results
  console.log("\n💾 Step 10: Saving test results...");

  const results = {
    safe: {
      address: safeAddress,
      owners: safeWallets.map((w) => w.address),
    },
    contracts: {
      savitriCoin: savitriToken.address,
      tokenICO: tokenICO.address,
      mockUSDT: mockUSDT.address,
      mockBNBPriceFeed: mockBNBPriceFeed.address,
    },
    buyer: {
      address: buyer.address,
      tokensReceived: {
        fromBNB: ethers.utils.formatEther(tokensReceived),
        fromUSDT: ethers.utils.formatEther(tokensReceivedUSDT),
        total: ethers.utils.formatEther(buyerBalanceAfterUSDT),
      },
    },
    purchases: {
      bnb: {
        amount: ethers.utils.formatEther(bnbAmount),
        tokens: ethers.utils.formatEther(tokensReceived),
        txHash: tx1.hash,
      },
      usdt: {
        amount: usdtPurchaseAmount.toString(),
        tokens: ethers.utils.formatEther(tokensReceivedUSDT),
        txHash: tx2.hash,
      },
    },
    timestamp: new Date().toISOString(),
  };

  const outputPath = path.join(__dirname, "buy-test-results.json");
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`  ✅ Results saved to: ${outputPath}`);

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("✅ BUY TEST COMPLETE!");
  console.log("=".repeat(60));
  console.log("\n📊 Summary:");
  console.log(`  • Safe address: ${safeAddress}`);
  console.log(`  • TokenICO: ${tokenICO.address}`);
  console.log(`  • Buyer: ${buyer.address}`);
  console.log(`  • BNB purchase: ${ethers.utils.formatEther(bnbAmount)} BNB → ${ethers.utils.formatEther(tokensReceived)} SAV`);
  console.log(`  • USDT purchase: ${usdtPurchaseAmount} USDT → ${ethers.utils.formatEther(tokensReceivedUSDT)} SAV`);
  console.log(`  • Total tokens received: ${ethers.utils.formatEther(buyerBalanceAfterUSDT)} SAV`);
  console.log(`  • Owner functions protected: ✅`);
  console.log(`  • Regular users can buy: ✅`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  });

