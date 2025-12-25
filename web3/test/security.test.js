const { expect } = require("chai");
const { ethers } = require("hardhat");
const { deployMocks, setupTokenICO, createBuyer, approveTokens, createSafeSetup } = require("./helpers/testHelpers");

describe("TokenICO - Security & Access Control", function () {
  let tokenICO;
  let savitriToken;
  let safeAddress;
  let safeSigner;
  let deployer;
  let buyer;
  let nonOwner;
  let mocks;

  beforeEach(async function () {
    [deployer, nonOwner] = await ethers.getSigners();

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

  describe("Blocking Functions", function () {
    it("Should allow owner to block address", async function () {
      await tokenICO.connect(safeSigner).setBlockStatus(buyer.address, true);
      const isBlocked = await tokenICO.blockedAddresses(buyer.address);
      expect(isBlocked).to.be.true;
    });

    it("Should allow owner to unblock address", async function () {
      await tokenICO.connect(safeSigner).setBlockStatus(buyer.address, true);
      await tokenICO.connect(safeSigner).setBlockStatus(buyer.address, false);
      const isBlocked = await tokenICO.blockedAddresses(buyer.address);
      expect(isBlocked).to.be.false;
    });

    it("Should fail when non-owner tries to block", async function () {
      await expect(
        tokenICO.connect(nonOwner).setBlockStatus(buyer.address, true)
      ).to.be.revertedWith("Only owner");
    });

    it("Should prevent blocked address from purchasing", async function () {
      await tokenICO.connect(safeSigner).setBlockStatus(buyer.address, true);

      await expect(
        tokenICO.connect(buyer).buyWithBNB({ value: ethers.utils.parseEther("0.1") })
      ).to.be.revertedWith("Address is blocked");
    });

    it("Should prevent blocked address from staking", async function () {
      await tokenICO.connect(safeSigner).setBlockStatus(buyer.address, true);

      const stakeAmount = ethers.utils.parseEther("1000");
      await savitriToken.connect(buyer).approve(tokenICO.address, stakeAmount);

      await expect(
        tokenICO.connect(buyer).stakeTokens(stakeAmount, 30)
      ).to.be.revertedWith("Address is blocked");
    });
  });

  describe("Sweeper List", function () {
    it("Should allow owner to add sweeper", async function () {
      await tokenICO.connect(safeSigner).setSweeper(buyer.address, true);
      const isSweeper = await tokenICO.sweeperList(buyer.address);
      expect(isSweeper).to.be.true;
    });

    it("Should prevent sweeper from purchasing", async function () {
      await tokenICO.connect(safeSigner).setSweeper(buyer.address, true);

      await expect(
        tokenICO.connect(buyer).buyWithBNB({ value: ethers.utils.parseEther("0.1") })
      ).to.be.revertedWith("Blocked sweeper");
    });
  });

  describe("Pause Mechanism", function () {
    it("Should allow owner to pause contract", async function () {
      await tokenICO.connect(safeSigner).pause();
      const isPaused = await tokenICO.paused();
      expect(isPaused).to.be.true;
    });

    it("Should fail when non-owner tries to pause", async function () {
      await expect(
        tokenICO.connect(nonOwner).pause()
      ).to.be.revertedWith("Only owner");
    });

    it("Should fail when pausing already paused contract", async function () {
      await tokenICO.connect(safeSigner).pause();
      await expect(
        tokenICO.connect(safeSigner).pause()
      ).to.be.revertedWith("Already paused");
    });

    it("Should prevent purchases when paused", async function () {
      await tokenICO.connect(safeSigner).pause();

      await expect(
        tokenICO.connect(buyer).buyWithBNB({ value: ethers.utils.parseEther("0.1") })
      ).to.be.revertedWith("Contract is paused");
    });

    it("Should prevent staking when paused", async function () {
      await tokenICO.connect(safeSigner).pause();

      const stakeAmount = ethers.utils.parseEther("1000");
      await savitriToken.connect(buyer).approve(tokenICO.address, stakeAmount);

      await expect(
        tokenICO.connect(buyer).stakeTokens(stakeAmount, 30)
      ).to.be.revertedWith("Contract is paused");
    });

    it("Should allow owner to unpause contract", async function () {
      await tokenICO.connect(safeSigner).pause();
      await tokenICO.connect(safeSigner).unpause();
      const isPaused = await tokenICO.paused();
      expect(isPaused).to.be.false;
    });

    it("Should fail when unpausing not paused contract", async function () {
      await expect(
        tokenICO.connect(safeSigner).unpause()
      ).to.be.revertedWith("Not paused");
    });
  });

  describe("Waitlist Management", function () {
    it("Should allow owner to add user to waitlist", async function () {
      await tokenICO.connect(safeSigner).setWaitlisted(buyer.address, true);
      const isWaitlisted = await tokenICO.waitlisted(buyer.address);
      expect(isWaitlisted).to.be.true;
    });

    it("Should allow owner to remove user from waitlist", async function () {
      await tokenICO.connect(safeSigner).setWaitlisted(buyer.address, true);
      await tokenICO.connect(safeSigner).setWaitlisted(buyer.address, false);
      const isWaitlisted = await tokenICO.waitlisted(buyer.address);
      expect(isWaitlisted).to.be.false;
    });

    it("Should fail when non-owner tries to set waitlist", async function () {
      await expect(
        tokenICO.connect(nonOwner).setWaitlisted(buyer.address, true)
      ).to.be.revertedWith("Only owner");
    });
  });

  describe("Owner-only Functions", function () {
    it("Should allow owner to update price", async function () {
      const newPrice = ethers.utils.parseUnits("40", 4);
      await tokenICO.connect(safeSigner).updateInitialUsdtPrice(newPrice);
      const price = await tokenICO.initialUsdtPricePerToken();
      expect(price).to.equal(newPrice);
    });

    it("Should fail when non-owner tries to update price", async function () {
      const newPrice = ethers.utils.parseUnits("40", 4);
      await expect(
        tokenICO.connect(nonOwner).updateInitialUsdtPrice(newPrice)
      ).to.be.revertedWith("Only owner");
    });

    it("Should allow owner to set sale token", async function () {
      await tokenICO.connect(safeSigner).setSaleToken(savitriToken.address);
      const saleToken = await tokenICO.saleToken();
      expect(saleToken).to.equal(savitriToken.address);
    });

    it("Should fail when non-owner tries to set sale token", async function () {
      await expect(
        tokenICO.connect(nonOwner).setSaleToken(savitriToken.address)
      ).to.be.revertedWith("Only owner");
    });
  });
});

