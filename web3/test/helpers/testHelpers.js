const { ethers } = require("hardhat");

/**
 * Helper functions for testing
 */

/**
 * Deploy mock contracts for testing
 */
async function deployMocks(deployer) {
  // Deploy StableCoins (USDT, USDC, etc.)
  const StableCoins = await ethers.getContractFactory("StableCoins");
  const mockUSDT = await StableCoins.deploy("Tether USD", "USDT", 6);
  const mockUSDC = await StableCoins.deploy("USD Coin", "USDC", 6);
  const mockETH = await StableCoins.deploy("Ethereum", "ETH", 18);
  const mockBTC = await StableCoins.deploy("Bitcoin", "BTC", 8);
  const mockSOL = await StableCoins.deploy("Solana", "SOL", 9);

  // Deploy Mock Price Feeds
  const MockPriceFeed = await ethers.getContractFactory("MockPriceFeed");
  const bnbPriceFeed = await MockPriceFeed.deploy(8, ethers.BigNumber.from("30000000000")); // $300
  const ethPriceFeed = await MockPriceFeed.deploy(8, ethers.BigNumber.from("200000000000")); // $2000
  const btcPriceFeed = await MockPriceFeed.deploy(8, ethers.BigNumber.from("3000000000000")); // $30000
  const solPriceFeed = await MockPriceFeed.deploy(8, ethers.BigNumber.from("15000000000")); // $150

  return {
    mockUSDT,
    mockUSDC,
    mockETH,
    mockBTC,
    mockSOL,
    bnbPriceFeed,
    ethPriceFeed,
    btcPriceFeed,
    solPriceFeed,
  };
}

/**
 * Setup TokenICO contract for testing
 */
async function setupTokenICO(tokenICO, savitriToken, mocks, safeSigner) {
  // Transfer tokens to ICO
  const tokensToICO = ethers.utils.parseEther("1000000");
  await savitriToken.transfer(tokenICO.address, tokensToICO);

  // Allow TokenICO to transfer tokens
  await savitriToken.connect(safeSigner).setAllowedSender(tokenICO.address, true);

  // Set sale token
  await tokenICO.connect(safeSigner).setSaleToken(savitriToken.address);

  // Set payment tokens
  await tokenICO.connect(safeSigner).updateUSDT(mocks.mockUSDT.address);
  await tokenICO.connect(safeSigner).updateUSDC(mocks.mockUSDC.address);
  await tokenICO.connect(safeSigner).updateETH(mocks.mockETH.address);
  await tokenICO.connect(safeSigner).updateBTC(mocks.mockBTC.address);
  await tokenICO.connect(safeSigner).updateSOL(mocks.mockSOL.address);

  // Set price feeds
  await tokenICO.connect(safeSigner).setBNBPriceFeed(mocks.bnbPriceFeed.address);
  await tokenICO.connect(safeSigner).setETHPriceFeed(mocks.ethPriceFeed.address);
  await tokenICO.connect(safeSigner).setBTCPriceFeed(mocks.btcPriceFeed.address);
  await tokenICO.connect(safeSigner).setSOLPriceFeed(mocks.solPriceFeed.address);

  // Set sale start time
  const block = await ethers.provider.getBlock("latest");
  await tokenICO.connect(safeSigner).setSaleStartTime(block.timestamp);

  // Ensure not paused
  const isPaused = await tokenICO.paused();
  if (isPaused) {
    await tokenICO.connect(safeSigner).unpause();
  }
}

/**
 * Create a buyer wallet and fund it
 */
async function createBuyer(deployer, mocks) {
  const buyer = ethers.Wallet.createRandom();
  const buyerSigner = buyer.connect(deployer.provider);

  // Fund with BNB
  await deployer.sendTransaction({
    to: buyer.address,
    value: ethers.utils.parseEther("10.0"),
  });

  // Mint stablecoins
  const usdtAmount = ethers.utils.parseUnits("10000", 6);
  const usdcAmount = ethers.utils.parseUnits("10000", 6);
  const ethAmount = ethers.utils.parseEther("100");
  const btcAmount = ethers.utils.parseUnits("10", 8);
  const solAmount = ethers.utils.parseUnits("1000", 9);

  await mocks.mockUSDT.mint(buyer.address, usdtAmount);
  await mocks.mockUSDC.mint(buyer.address, usdcAmount);
  await mocks.mockETH.mint(buyer.address, ethAmount);
  await mocks.mockBTC.mint(buyer.address, btcAmount);
  await mocks.mockSOL.mint(buyer.address, solAmount);

  return { buyerSigner, buyerAddress: buyer.address };
}

/**
 * Approve token spending for buyer
 */
async function approveTokens(buyerSigner, tokenICO, mocks) {
  await mocks.mockUSDT.connect(buyerSigner).approve(tokenICO.address, ethers.constants.MaxUint256);
  await mocks.mockUSDC.connect(buyerSigner).approve(tokenICO.address, ethers.constants.MaxUint256);
  await mocks.mockETH.connect(buyerSigner).approve(tokenICO.address, ethers.constants.MaxUint256);
  await mocks.mockBTC.connect(buyerSigner).approve(tokenICO.address, ethers.constants.MaxUint256);
  await mocks.mockSOL.connect(buyerSigner).approve(tokenICO.address, ethers.constants.MaxUint256);

  return buyerSigner;
}

/**
 * Create Safe wallet setup
 */
async function createSafeSetup(deployer) {
  const safeWallets = [];
  for (let i = 0; i < 5; i++) {
    const wallet = ethers.Wallet.createRandom();
    safeWallets.push(wallet);
    await deployer.sendTransaction({
      to: wallet.address,
      value: ethers.utils.parseEther("10.0"),
    });
  }

  const safeAddress = safeWallets[0].address;
  const safeSigner = safeWallets[0].connect(deployer.provider);

  return { safeAddress, safeSigner, safeWallets };
}

/**
 * Wait for transaction and verify success
 */
async function waitForTx(txPromise, label = "Transaction") {
  const tx = await txPromise;
  const receipt = await tx.wait();
  if (receipt.status !== 1) {
    throw new Error(`${label} failed`);
  }
  return receipt;
}

/**
 * Increase time in Hardhat network
 */
async function increaseTime(seconds) {
  await ethers.provider.send("evm_increaseTime", [seconds]);
  await ethers.provider.send("evm_mine", []);
}

/**
 * Get current block timestamp
 */
async function getCurrentTime() {
  const block = await ethers.provider.getBlock("latest");
  return block.timestamp;
}

module.exports = {
  deployMocks,
  setupTokenICO,
  createBuyer,
  approveTokens,
  createSafeSetup,
  waitForTx,
  increaseTime,
  getCurrentTime,
};

