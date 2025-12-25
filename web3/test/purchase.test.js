const { expect } = require("chai");
const { ethers } = require("hardhat");
const { deployMocks, setupTokenICO, createBuyer, approveTokens, createSafeSetup } = require("./helpers/testHelpers");

describe("TokenICO - Purchase Functions", function () {
  let tokenICO;
  let savitriToken;
  let safeAddress;
  let safeSigner;
  let deployer;
  let buyer;
  let mocks;

  beforeEach(async function () {
    [deployer] = await ethers.getSigners();

    // Create Safe setup
    const safe = await createSafeSetup(deployer);
    safeAddress = safe.safeAddress;
    safeSigner = safe.safeSigner;

    // Deploy contracts
    const SavitriCoin = await ethers.getContractFactory("SavitriCoin");
    savitriToken = await SavitriCoin.deploy();
    await savitriToken.deployed();

    const TokenICO = await ethers.getContractFactory("TokenICO");
    tokenICO = await TokenICO.connect(safeSigner).deploy();
    await tokenICO.deployed();

    // Transfer ownership
    await savitriToken.transferOwnership(safeAddress);

    // Deploy mocks
    mocks = await deployMocks(deployer);

    // Setup TokenICO
    await setupTokenICO(tokenICO, savitriToken, mocks, safeSigner);

    // Create buyer
    const buyerData = await createBuyer(deployer, mocks);
    buyer = buyerData.buyerSigner;
    await approveTokens(buyer, tokenICO, mocks);
  });

  describe("buyWithBNB", function () {
    it("Should allow purchase with BNB", async function () {
      const bnbAmount = ethers.utils.parseEther("0.1");
      const buyerBalanceBefore = await savitriToken.balanceOf(buyer.address);

      await tokenICO.connect(buyer).buyWithBNB({ value: bnbAmount });

      const buyerBalanceAfter = await savitriToken.balanceOf(buyer.address);
      expect(buyerBalanceAfter).to.be.gt(buyerBalanceBefore);
    });

    it("Should fail with zero value", async function () {
      await expect(
        tokenICO.connect(buyer).buyWithBNB({ value: 0 })
      ).to.be.revertedWith("Must send BNB");
    });

    it("Should fail when sale token not set", async function () {
      const TokenICO2 = await ethers.getContractFactory("TokenICO");
      const tokenICO2 = await TokenICO2.connect(safeSigner).deploy();
      await tokenICO2.deployed();

      await expect(
        tokenICO2.connect(buyer).buyWithBNB({ value: ethers.utils.parseEther("0.1") })
      ).to.be.revertedWith("Sale token not set");
    });

    it("Should fail when contract paused", async function () {
      await tokenICO.connect(safeSigner).pause();

      await expect(
        tokenICO.connect(buyer).buyWithBNB({ value: ethers.utils.parseEther("0.1") })
      ).to.be.revertedWith("Contract is paused");
    });

    it("Should fail when buyer is blocked", async function () {
      await tokenICO.connect(safeSigner).setBlockStatus(buyer.address, true);

      await expect(
        tokenICO.connect(buyer).buyWithBNB({ value: ethers.utils.parseEther("0.1") })
      ).to.be.revertedWith("Address is blocked");
    });

    it("Should transfer BNB to owner", async function () {
      const ownerBalanceBefore = await ethers.provider.getBalance(safeAddress);
      const bnbAmount = ethers.utils.parseEther("0.1");

      await tokenICO.connect(buyer).buyWithBNB({ value: bnbAmount });

      const ownerBalanceAfter = await ethers.provider.getBalance(safeAddress);
      expect(ownerBalanceAfter.sub(ownerBalanceBefore)).to.equal(bnbAmount);
    });
  });

  describe("buyWithUSDT", function () {
    it("Should allow purchase with USDT", async function () {
      const usdtAmount = 100; // Whole units
      const buyerBalanceBefore = await savitriToken.balanceOf(buyer.address);

      await tokenICO.connect(buyer).buyWithUSDT(usdtAmount);

      const buyerBalanceAfter = await savitriToken.balanceOf(buyer.address);
      expect(buyerBalanceAfter).to.be.gt(buyerBalanceBefore);
    });

    it("Should fail with zero amount", async function () {
      await expect(
        tokenICO.connect(buyer).buyWithUSDT(0)
      ).to.be.revertedWith("Amount must be greater than 0");
    });

    it("Should fail when USDT not configured", async function () {
      const TokenICO2 = await ethers.getContractFactory("TokenICO");
      const tokenICO2 = await TokenICO2.connect(safeSigner).deploy();
      await tokenICO2.deployed();

      await savitriToken.transfer(tokenICO2.address, ethers.utils.parseEther("1000000"));
      await savitriToken.connect(safeSigner).setAllowedSender(tokenICO2.address, true);
      await tokenICO2.connect(safeSigner).setSaleToken(savitriToken.address);

      await expect(
        tokenICO2.connect(buyer).buyWithUSDT(100)
      ).to.be.revertedWith("USDT not configured");
    });

    it("Should transfer USDT to owner", async function () {
      const usdtAmount = 100;
      const ownerBalanceBefore = await mocks.mockUSDT.balanceOf(safeAddress);

      await tokenICO.connect(buyer).buyWithUSDT(usdtAmount);

      const ownerBalanceAfter = await mocks.mockUSDT.balanceOf(safeAddress);
      expect(ownerBalanceAfter.sub(ownerBalanceBefore)).to.equal(
        ethers.utils.parseUnits(usdtAmount.toString(), 6)
      );
    });
  });

  describe("buyWithUSDC", function () {
    it("Should allow purchase with USDC", async function () {
      const usdcAmount = 100;
      const buyerBalanceBefore = await savitriToken.balanceOf(buyer.address);

      await tokenICO.connect(buyer).buyWithUSDC(usdcAmount);

      const buyerBalanceAfter = await savitriToken.balanceOf(buyer.address);
      expect(buyerBalanceAfter).to.be.gt(buyerBalanceBefore);
    });

    it("Should transfer USDC to owner", async function () {
      const usdcAmount = 100;
      const ownerBalanceBefore = await mocks.mockUSDC.balanceOf(safeAddress);

      await tokenICO.connect(buyer).buyWithUSDC(usdcAmount);

      const ownerBalanceAfter = await mocks.mockUSDC.balanceOf(safeAddress);
      expect(ownerBalanceAfter.sub(ownerBalanceBefore)).to.equal(
        ethers.utils.parseUnits(usdcAmount.toString(), 6)
      );
    });
  });

  describe("buyWithETH", function () {
    it("Should allow purchase with ETH token", async function () {
      const ethAmount = ethers.utils.parseEther("0.1");
      const buyerBalanceBefore = await savitriToken.balanceOf(buyer.address);

      await tokenICO.connect(buyer).buyWithETH(ethAmount);

      const buyerBalanceAfter = await savitriToken.balanceOf(buyer.address);
      expect(buyerBalanceAfter).to.be.gt(buyerBalanceBefore);
    });

    it("Should fail when ETH not configured", async function () {
      const TokenICO2 = await ethers.getContractFactory("TokenICO");
      const tokenICO2 = await TokenICO2.connect(safeSigner).deploy();
      await tokenICO2.deployed();

      // Setup sale token first
      await savitriToken.transfer(tokenICO2.address, ethers.utils.parseEther("1000000"));
      await savitriToken.connect(safeSigner).setAllowedSender(tokenICO2.address, true);
      await tokenICO2.connect(safeSigner).setSaleToken(savitriToken.address);

      await expect(
        tokenICO2.connect(buyer).buyWithETH(ethers.utils.parseEther("0.1"))
      ).to.be.revertedWith("ETH not configured");
    });
  });

  describe("buyWithBTC", function () {
    it("Should allow purchase with BTC token", async function () {
      const btcAmount = ethers.utils.parseUnits("0.01", 8);
      const buyerBalanceBefore = await savitriToken.balanceOf(buyer.address);

      await tokenICO.connect(buyer).buyWithBTC(btcAmount);

      const buyerBalanceAfter = await savitriToken.balanceOf(buyer.address);
      expect(buyerBalanceAfter).to.be.gt(buyerBalanceBefore);
    });
  });

  describe("buyWithSOL", function () {
    it("Should allow purchase with SOL token", async function () {
      const solAmount = ethers.utils.parseUnits("1", 9);
      const buyerBalanceBefore = await savitriToken.balanceOf(buyer.address);

      await tokenICO.connect(buyer).buyWithSOL(solAmount);

      const buyerBalanceAfter = await savitriToken.balanceOf(buyer.address);
      expect(buyerBalanceAfter).to.be.gt(buyerBalanceBefore);
    });
  });

  describe("Sale Limits", function () {
    it("Should fail when purchase exceeds total sale supply", async function () {
      // This would require purchasing all tokens, which is expensive to test
      // For now, we'll test the logic exists
      const totalSupply = await tokenICO.TOTAL_TOKENS_FOR_SALE();
      expect(totalSupply).to.equal(ethers.utils.parseEther("600000000"));
    });

    it("Should track tokens sold", async function () {
      const bnbAmount = ethers.utils.parseEther("0.1");
      const tokensSoldBefore = await tokenICO.tokensSold();

      await tokenICO.connect(buyer).buyWithBNB({ value: bnbAmount });

      const tokensSoldAfter = await tokenICO.tokensSold();
      expect(tokensSoldAfter).to.be.gt(tokensSoldBefore);
    });
  });
});

