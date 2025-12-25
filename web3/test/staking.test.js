const { expect } = require("chai");
const { ethers } = require("hardhat");
const { deployMocks, setupTokenICO, createBuyer, approveTokens, createSafeSetup, increaseTime } = require("./helpers/testHelpers");

describe("TokenICO - Staking System", function () {
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

    // Enable transfers in SavitriCoin
    await savitriToken.connect(safeSigner).setTransfersEnabled(true);

    // Deploy mocks
    mocks = await deployMocks(deployer);

    // Setup TokenICO
    await setupTokenICO(tokenICO, savitriToken, mocks, safeSigner);

    // Create buyer and purchase some tokens
    const buyerData = await createBuyer(deployer, mocks);
    buyer = buyerData.buyerSigner;
    await approveTokens(buyer, tokenICO, mocks);

    // Purchase tokens for staking (buy enough tokens)
    await tokenICO.connect(buyer).buyWithBNB({ value: ethers.utils.parseEther("5.0") });
    
    // Also transfer some tokens directly to ensure enough balance
    await savitriToken.transfer(buyer.address, ethers.utils.parseEther("10000"));
  });

  describe("stakeTokens", function () {
    it("Should allow staking with valid amount and period", async function () {
      const stakeAmount = ethers.utils.parseEther("1000");
      const lockPeriodDays = 30;

      await savitriToken.connect(buyer).approve(tokenICO.address, stakeAmount);
      await tokenICO.connect(buyer).stakeTokens(stakeAmount, lockPeriodDays);

      const stakes = await tokenICO.getUserStakes(buyer.address);
      expect(stakes.length).to.equal(1);
      expect(stakes[0].amount).to.equal(stakeAmount);
    });

    it("Should fail with amount below minimum", async function () {
      const minStake = await tokenICO.minStakeAmount();
      const stakeAmount = minStake.sub(1);
      const lockPeriodDays = 30;

      await savitriToken.connect(buyer).approve(tokenICO.address, stakeAmount);

      await expect(
        tokenICO.connect(buyer).stakeTokens(stakeAmount, lockPeriodDays)
      ).to.be.revertedWith("Amount below minimum stake");
    });

    it("Should fail with zero amount", async function () {
      await expect(
        tokenICO.connect(buyer).stakeTokens(0, 30)
      ).to.be.revertedWith("Amount below minimum stake");
    });

    it("Should fail when contract paused", async function () {
      await tokenICO.connect(safeSigner).pause();

      const stakeAmount = ethers.utils.parseEther("1000");
      await savitriToken.connect(buyer).approve(tokenICO.address, stakeAmount);

      await expect(
        tokenICO.connect(buyer).stakeTokens(stakeAmount, 30)
      ).to.be.revertedWith("Contract is paused");
    });

    it("Should fail when user is blocked", async function () {
      await tokenICO.connect(safeSigner).setBlockStatus(buyer.address, true);

      const stakeAmount = ethers.utils.parseEther("1000");
      await savitriToken.connect(buyer).approve(tokenICO.address, stakeAmount);

      await expect(
        tokenICO.connect(buyer).stakeTokens(stakeAmount, 30)
      ).to.be.revertedWith("Address is blocked");
    });

    it("Should fail with insufficient balance", async function () {
      const stakeAmount = ethers.utils.parseEther("10000000"); // More than buyer has
      await savitriToken.connect(buyer).approve(tokenICO.address, stakeAmount);

      await expect(
        tokenICO.connect(buyer).stakeTokens(stakeAmount, 30)
      ).to.be.reverted;
    });

    it("Should allow multiple stakes by same user", async function () {
      const stakeAmount = ethers.utils.parseEther("1000");
      await savitriToken.connect(buyer).approve(tokenICO.address, stakeAmount.mul(2));

      await tokenICO.connect(buyer).stakeTokens(stakeAmount, 30);
      await tokenICO.connect(buyer).stakeTokens(stakeAmount, 60);

      const stakes = await tokenICO.getUserStakes(buyer.address);
      expect(stakes.length).to.equal(2);
    });
  });

  describe("harvestRewards", function () {
    let stakeId;

    beforeEach(async function () {
      const stakeAmount = ethers.utils.parseEther("1000");
      const lockPeriodDays = 30;
      await savitriToken.connect(buyer).approve(tokenICO.address, stakeAmount);
      await tokenICO.connect(buyer).stakeTokens(stakeAmount, lockPeriodDays);

      const stakes = await tokenICO.getUserStakes(buyer.address);
      stakeId = stakes[0].stakeId;
    });

    it("Should allow harvesting rewards from valid stake", async function () {
      // Increase time to generate rewards
      await increaseTime(30 * 24 * 60 * 60); // 30 days

      const rewards = await tokenICO.calculateRewards(stakeId);
      expect(rewards).to.be.gt(0);

      const buyerBalanceBefore = await savitriToken.balanceOf(buyer.address);
      await tokenICO.connect(buyer).harvestRewards(stakeId);
      const buyerBalanceAfter = await savitriToken.balanceOf(buyer.address);

      expect(buyerBalanceAfter).to.be.gt(buyerBalanceBefore);
    });

    it("Should fail when harvesting from other user's stake", async function () {
      const [otherUser] = await ethers.getSigners();
      await expect(
        tokenICO.connect(otherUser).harvestRewards(stakeId)
      ).to.be.reverted;
    });

    it("Should fail when user is blocked", async function () {
      await tokenICO.connect(safeSigner).setBlockStatus(buyer.address, true);

      await expect(
        tokenICO.connect(buyer).harvestRewards(stakeId)
      ).to.be.revertedWith("Address is blocked");
    });
  });

  describe("unstakeTokens", function () {
    let stakeId;
    const lockPeriodDays = 30;

    beforeEach(async function () {
      const stakeAmount = ethers.utils.parseEther("1000");
      await savitriToken.connect(buyer).approve(tokenICO.address, stakeAmount);
      await tokenICO.connect(buyer).stakeTokens(stakeAmount, lockPeriodDays);

      const stakes = await tokenICO.getUserStakes(buyer.address);
      stakeId = stakes[0].stakeId;
    });

    it("Should allow unstaking after lock period expires", async function () {
      // Increase time beyond lock period
      await increaseTime((lockPeriodDays + 1) * 24 * 60 * 60);

      const buyerBalanceBefore = await savitriToken.balanceOf(buyer.address);
      await tokenICO.connect(buyer).unstakeTokens(stakeId);
      const buyerBalanceAfter = await savitriToken.balanceOf(buyer.address);

      expect(buyerBalanceAfter).to.be.gt(buyerBalanceBefore);
    });

    it("Should fail when unstaking before lock period expires", async function () {
      await expect(
        tokenICO.connect(buyer).unstakeTokens(stakeId)
      ).to.be.revertedWith("Lock period not expired");
    });

    it("Should fail when unstaking from other user's stake", async function () {
      const [otherUser] = await ethers.getSigners();
      await increaseTime((lockPeriodDays + 1) * 24 * 60 * 60);

      await expect(
        tokenICO.connect(otherUser).unstakeTokens(stakeId)
      ).to.be.reverted;
    });
  });

  describe("unstakeEarly", function () {
    let stakeId;
    const lockPeriodDays = 30;

    beforeEach(async function () {
      const stakeAmount = ethers.utils.parseEther("1000");
      await savitriToken.connect(buyer).approve(tokenICO.address, stakeAmount);
      await tokenICO.connect(buyer).stakeTokens(stakeAmount, lockPeriodDays);

      const stakes = await tokenICO.getUserStakes(buyer.address);
      stakeId = stakes[0].stakeId;
    });

    it("Should allow early unstake with penalty", async function () {
      const buyerBalanceBefore = await savitriToken.balanceOf(buyer.address);
      const stakeInfo = await tokenICO.getStakeInfo(stakeId);
      const stakeAmount = stakeInfo.amount;

      await tokenICO.connect(buyer).unstakeEarly(stakeId);

      const buyerBalanceAfter = await savitriToken.balanceOf(buyer.address);
      const penaltyCollected = await tokenICO.getTotalPenaltyCollected();

      // Buyer should receive less than staked amount (penalty applied)
      expect(buyerBalanceAfter.sub(buyerBalanceBefore)).to.be.lt(stakeAmount);
      expect(penaltyCollected).to.be.gt(0);
    });

    it("Should fail when unstaking from other user's stake", async function () {
      const [otherUser] = await ethers.getSigners();

      await expect(
        tokenICO.connect(otherUser).unstakeEarly(stakeId)
      ).to.be.reverted;
    });
  });

  describe("calculateRewards", function () {
    let stakeId;

    beforeEach(async function () {
      const stakeAmount = ethers.utils.parseEther("1000");
      const lockPeriodDays = 30;
      await savitriToken.connect(buyer).approve(tokenICO.address, stakeAmount);
      await tokenICO.connect(buyer).stakeTokens(stakeAmount, lockPeriodDays);

      const stakes = await tokenICO.getUserStakes(buyer.address);
      stakeId = stakes[0].stakeId;
    });

    it("Should calculate rewards correctly", async function () {
      const rewardsBefore = await tokenICO.calculateRewards(stakeId);
      expect(rewardsBefore).to.be.a('bigint');

      // Increase time
      await increaseTime(30 * 24 * 60 * 60);

      const rewardsAfter = await tokenICO.calculateRewards(stakeId);
      expect(rewardsAfter).to.be.a('bigint');
      expect(ethers.BigNumber.from(rewardsAfter)).to.be.gte(ethers.BigNumber.from(rewardsBefore));
    });

    it("Should return zero rewards immediately after staking", async function () {
      const rewards = await tokenICO.calculateRewards(stakeId);
      expect(ethers.BigNumber.from(rewards)).to.equal(0);
    });
  });
});

