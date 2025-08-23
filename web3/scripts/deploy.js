const hre = require("hardhat");
require("dotenv").config();

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  const network = await hre.ethers.provider.getNetwork();
  if ([1337, 84532, 11155111, 17000].includes(network.chainId)) {
    console.log("\nDeploying Mock Tokens for Local Testing:");
    console.log("------------------------");

    // Mock Stablecoins Contract Factory
    const MockStableCoins = await hre.ethers.getContractFactory("StableCoins");

    // Deploy mock tokens (no minting)
    const mockUSDT = await MockStableCoins.deploy("USDT", "USDT", 6);
    await mockUSDT.deployed();
    console.log("✅ Mock USDT deployed to:", mockUSDT.address);

    const mockUSDC = await MockStableCoins.deploy("USDC", "USDC", 6);
    await mockUSDC.deployed();
    console.log("✅ Mock USDC deployed to:", mockUSDC.address);

    const mockETH = await MockStableCoins.deploy("ETH", "ETH", 18);
    await mockETH.deployed();
    console.log("✅ Mock ETH deployed to:", mockETH.address);

    const mockSOL = await MockStableCoins.deploy("SOL", "SOL", 9);
    await mockSOL.deployed();
    console.log("✅ Mock SOL deployed to:", mockSOL.address);

    const mockBTC = await MockStableCoins.deploy("BTC", "BTC", 8);
    await mockBTC.deployed();
    console.log("✅ Mock BTC deployed to:", mockBTC.address);

    // Deploy mock price feeds
    const MockFeed = await hre.ethers.getContractFactory("MockPriceFeed");
    const bnbFeed = await MockFeed.deploy(8, hre.ethers.utils.parseUnits("300", 8));
    await bnbFeed.deployed();
    const ethFeed = await MockFeed.deploy(8, hre.ethers.utils.parseUnits("2000", 8));
    await ethFeed.deployed();
    const btcFeed = await MockFeed.deploy(8, hre.ethers.utils.parseUnits("30000", 8));
    await btcFeed.deployed();
    const solFeed = await MockFeed.deploy(8, hre.ethers.utils.parseUnits("150", 8));
    await solFeed.deployed();
    console.log("✅ Mock price feeds deployed");

    // Deploy SAV token
    const SavitriCoin = await hre.ethers.getContractFactory("SavitriCoin");
    const savitriToken = await SavitriCoin.deploy();
    await savitriToken.deployed();
    console.log("✅ SAV token deployed to:", savitriToken.address);

    // Deploy TokenICO contract
    const TokenICO = await hre.ethers.getContractFactory("TokenICO");
    const tokenICO = await TokenICO.deploy();
    await tokenICO.deployed();
    console.log("✅ TokenICO contract deployed to:", tokenICO.address);

    // Set the signer for vouchers
    const SIGNER_ADDRESS = process.env.NEXT_PUBLIC_SIGNER_ADDRESS;
    await tokenICO.setSigner(SIGNER_ADDRESS);
    const onchainSigner = await tokenICO.callStatic.signer();
    console.log("✅ signer set:", onchainSigner);

    // Set sale token
    await tokenICO.setSaleToken(savitriToken.address);
    console.log("✅ saleToken set:", savitriToken.address);

    // Fund ICO with SAV (required so ICO can distribute SAV to buyers)
    await savitriToken.transfer(
      tokenICO.address,
      hre.ethers.utils.parseUnits("500000", 18)
    );
    console.log("✅ ICO funded with 500,000 SAV tokens");

    // Allow ICO to transfer SAV even if global transfers disabled
    await savitriToken.setAllowedSender(tokenICO.address, true);
    console.log(
      "✅ SAV allowedSender[ICO] =",
      await savitriToken.allowedSenders(tokenICO.address)
    );

    // Register payment tokens
    await tokenICO.updateUSDT(mockUSDT.address);
    await tokenICO.updateUSDC(mockUSDC.address);
    await tokenICO.updateETH(mockETH.address);
    await tokenICO.updateSOL(mockSOL.address);
    await tokenICO.updateBTC(mockBTC.address);
    console.log("✅ All token payment methods registered with ICO");

    // Set price feeds
    await tokenICO.setBNBPriceFeed(bnbFeed.address);
    await tokenICO.setETHPriceFeed(ethFeed.address);
    await tokenICO.setBTCPriceFeed(btcFeed.address);
    await tokenICO.setSOLPriceFeed(solFeed.address);
    console.log("✅ Price feeds registered with ICO");

    // Intervals
    const waitlistInterval = parseInt(
      process.env.NEXT_PUBLIC_WAITLIST_INTERVAL || "1209600",
      10
    );
    const publicInterval = parseInt(
      process.env.NEXT_PUBLIC_PUBLIC_INTERVAL || "604800",
      10
    );
    await tokenICO.setIntervals(waitlistInterval, publicInterval);
    console.log(
      `✅ intervals set: waitlist ${waitlistInterval}s, public ${publicInterval}s`
    );

    // Start time
    const latest = await hre.ethers.provider.getBlock("latest");
    await tokenICO.setSaleStartTime(latest.timestamp);
    console.log("✅ sale start time set:", latest.timestamp);

    // Output ENV-style addresses
    console.log("------------------------");
    console.log("NEXT_PUBLIC_TOKEN_ICO_ADDRESS =", tokenICO.address);
    console.log("NEXT_PUBLIC_OWNER_ADDRESS =", deployer.address);
    console.log("NEXT_PUBLIC_USDT_ADDRESS =", mockUSDT.address);
    console.log("NEXT_PUBLIC_USDC_ADDRESS =", mockUSDC.address);
    console.log("NEXT_PUBLIC_SAV_ADDRESS =", savitriToken.address);
    console.log("NEXT_PUBLIC_ETH_ADDRESS =", mockETH.address);
    console.log("NEXT_PUBLIC_SOL_ADDRESS =", mockSOL.address);
    console.log("NEXT_PUBLIC_BTC_ADDRESS =", mockBTC.address);
    console.log("NEXT_PUBLIC_BNB_FEED =", bnbFeed.address);
    console.log("NEXT_PUBLIC_ETH_FEED =", ethFeed.address);
    console.log("NEXT_PUBLIC_BTC_FEED =", btcFeed.address);
    console.log("NEXT_PUBLIC_SOL_FEED =", solFeed.address);
  }
}

main().then(() => process.exit(0)).catch((error) => {
  console.error(error);
  process.exit(1);
});
