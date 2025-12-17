const { expect } = require("chai");
const { ethers } = require("hardhat");
const { deployMockSafe, executeViaMultisig, testOwnerOnly } = require("./helpers/safeHelpers");

describe("TokenICO with Safe Multisig (Local Testing)", function () {
  let tokenICO;
  let savitriToken;
  let safeAddress;
  let owner1, owner2, owner3, owner4, owner5, nonOwner;
  let owners;

  beforeEach(async function () {
    // Get signers
    [owner1, owner2, owner3, owner4, owner5, nonOwner] = await ethers.getSigners();
    owners = [owner1.address, owner2.address, owner3.address, owner4.address, owner5.address];

    // Deploy mock Safe (for testing, we use owner1 as Safe address)
    const safe = await deployMockSafe(owners, 3, owner1);
    safeAddress = safe.safeAddress;

    // Deploy contracts
    // Note: In production, deploy TokenICO from Safe address
    // For testing, we deploy from owner1 and treat it as Safe
    const SavitriCoin = await ethers.getContractFactory("SavitriCoin");
    savitriToken = await SavitriCoin.deploy();
    await savitriToken.deployed();

    const TokenICO = await ethers.getContractFactory("TokenICO");
    // Deploy from owner1 (in production: deploy from Safe)
    tokenICO = await TokenICO.deploy();
    await tokenICO.deployed();

    // Setup: Transfer SavitriCoin ownership to Safe
    // Note: OpenZeppelin Ownable transfers ownership immediately
    // No need for acceptOwnership (that's only in Ownable2Step)
    await savitriToken.transferOwnership(safeAddress);
  });

  describe("Owner-only functions", function () {
    it("Should allow owner to update price", async function () {
      const newPrice = ethers.utils.parseUnits("40", 4);
      await tokenICO.connect(owner1).updateInitialUsdtPrice(newPrice);
      
      const price = await tokenICO.initialUsdtPricePerToken();
      expect(price).to.equal(newPrice);
    });

    it("Should reject non-owner from updating price", async function () {
      const newPrice = ethers.utils.parseUnits("40", 4);
      await expect(
        tokenICO.connect(nonOwner).updateInitialUsdtPrice(newPrice)
      ).to.be.revertedWith("Only owner");
    });

    it("Should allow owner to set sale token", async function () {
      await tokenICO.connect(owner1).setSaleToken(savitriToken.address);
      
      const saleToken = await tokenICO.saleToken();
      expect(saleToken).to.equal(savitriToken.address);
    });

    it("Should allow owner to set block status", async function () {
      await tokenICO.connect(owner1).setBlockStatus(nonOwner.address, true);
      
      const isBlocked = await tokenICO.blockedAddresses(nonOwner.address);
      expect(isBlocked).to.be.true;
    });
  });

  describe("SavitriCoin ownership", function () {
    it("Should allow Safe (owner1) to call owner functions", async function () {
      // Safe (owner1) should be able to set block status
      await savitriToken.connect(owner1).setBlockStatus(nonOwner.address, true);
      
      const isBlocked = await savitriToken.blockedAddresses(nonOwner.address);
      expect(isBlocked).to.be.true;
    });

    it("Should reject non-owner from calling owner functions", async function () {
      await expect(
        savitriToken.connect(nonOwner).setBlockStatus(owner2.address, true)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("Multisig simulation", function () {
    it("Should simulate multisig approval process", async function () {
      // Simulate: 3 owners need to approve, then execute
      const signers = [owner1, owner2, owner3];
      const threshold = 3;

      // Execute via multisig (simulated)
      await executeViaMultisig(
        tokenICO,
        "updateInitialUsdtPrice",
        [ethers.utils.parseUnits("50", 4)],
        signers,
        threshold
      );

      const price = await tokenICO.initialUsdtPricePerToken();
      expect(price).to.equal(ethers.utils.parseUnits("50", 4));
    });

    it("Should fail with insufficient signers", async function () {
      const signers = [owner1, owner2]; // Only 2, need 3
      const threshold = 3;

      // executeViaMultisig throws a JavaScript Error, not a contract revert
      await expect(
        executeViaMultisig(
          tokenICO,
          "updateInitialUsdtPrice",
          [ethers.utils.parseUnits("60", 4)],
          signers,
          threshold
        )
      ).to.be.rejectedWith("Need at least 3 signers, got 2");
    });
  });

  describe("Integration: Full workflow", function () {
    it("Should complete full ICO setup via owner", async function () {
      // Setup sale token
      await tokenICO.connect(owner1).setSaleToken(savitriToken.address);
      
      // Fund ICO
      const amount = ethers.utils.parseEther("1000000");
      await savitriToken.transfer(tokenICO.address, amount);
      
      // Allow ICO to transfer
      await savitriToken.connect(owner1).setAllowedSender(tokenICO.address, true);
      
      // Set sale start time
      const block = await ethers.provider.getBlock("latest");
      await tokenICO.connect(owner1).setSaleStartTime(block.timestamp);
      
      // Verify setup
      const saleToken = await tokenICO.saleToken();
      expect(saleToken).to.equal(savitriToken.address);
      
      const balance = await savitriToken.balanceOf(tokenICO.address);
      expect(balance).to.equal(amount);
    });
  });
});

