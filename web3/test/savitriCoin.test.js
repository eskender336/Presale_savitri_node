const { expect } = require("chai");
const { ethers } = require("hardhat");
const { createSafeSetup } = require("./helpers/testHelpers");

describe("SavitriCoin Token", function () {
  let savitriToken;
  let safeAddress;
  let safeSigner;
  let deployer;
  let user1;
  let user2;

  beforeEach(async function () {
    [deployer, user1, user2] = await ethers.getSigners();

    // Create Safe setup
    const safe = await createSafeSetup(deployer);
    safeAddress = safe.safeAddress;
    safeSigner = safe.safeSigner;

    // Deploy SavitriCoin
    const SavitriCoin = await ethers.getContractFactory("SavitriCoin");
    savitriToken = await SavitriCoin.deploy();
    await savitriToken.deployed();

    // Transfer ownership
    await savitriToken.transferOwnership(safeAddress);
  });

  describe("setBlockStatus", function () {
    it("Should allow owner to block address", async function () {
      await savitriToken.connect(safeSigner).setBlockStatus(user1.address, true);
      const isBlocked = await savitriToken.blockedAddresses(user1.address);
      expect(isBlocked).to.be.true;
    });

    it("Should allow owner to unblock address", async function () {
      await savitriToken.connect(safeSigner).setBlockStatus(user1.address, true);
      await savitriToken.connect(safeSigner).setBlockStatus(user1.address, false);
      const isBlocked = await savitriToken.blockedAddresses(user1.address);
      expect(isBlocked).to.be.false;
    });

    it("Should fail when non-owner tries to block", async function () {
      await expect(
        savitriToken.connect(user1).setBlockStatus(user2.address, true)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should prevent blocked address from sending tokens", async function () {
      // Transfer some tokens to user1
      await savitriToken.transfer(user1.address, ethers.utils.parseEther("1000"));

      // Block user1
      await savitriToken.connect(safeSigner).setBlockStatus(user1.address, true);

      // Try to transfer from user1
      await expect(
        savitriToken.connect(user1).transfer(user2.address, ethers.utils.parseEther("100"))
      ).to.be.revertedWith("Sender is blocked");
    });

    it("Should allow blocked address to receive tokens", async function () {
      await savitriToken.connect(safeSigner).setBlockStatus(user1.address, true);

      // Owner can still send to blocked address
      await savitriToken.transfer(user1.address, ethers.utils.parseEther("1000"));
      const balance = await savitriToken.balanceOf(user1.address);
      expect(balance).to.equal(ethers.utils.parseEther("1000"));
    });
  });

  describe("setAllowedSender", function () {
    it("Should allow owner to set allowed sender", async function () {
      await savitriToken.connect(safeSigner).setAllowedSender(user1.address, true);
      const isAllowed = await savitriToken.allowedSenders(user1.address);
      expect(isAllowed).to.be.true;
    });

    it("Should allow allowed sender to transfer when transfers disabled", async function () {
      // Disable transfers
      await savitriToken.connect(safeSigner).setTransfersEnabled(false);

      // Set user1 as allowed sender
      await savitriToken.connect(safeSigner).setAllowedSender(user1.address, true);

      // Transfer tokens to user1
      await savitriToken.transfer(user1.address, ethers.utils.parseEther("1000"));

      // User1 should be able to transfer
      await savitriToken.connect(user1).transfer(user2.address, ethers.utils.parseEther("100"));
      const balance = await savitriToken.balanceOf(user2.address);
      expect(balance).to.equal(ethers.utils.parseEther("100"));
    });

    it("Should prevent non-allowed sender from transferring when transfers disabled", async function () {
      // Disable transfers
      await savitriToken.connect(safeSigner).setTransfersEnabled(false);

      // Transfer tokens to user1 (not allowed sender)
      await savitriToken.transfer(user1.address, ethers.utils.parseEther("1000"));

      // User1 should not be able to transfer
      await expect(
        savitriToken.connect(user1).transfer(user2.address, ethers.utils.parseEther("100"))
      ).to.be.revertedWith("Transfers disabled");
    });
  });

  describe("setTransfersEnabled", function () {
    it("Should allow owner to enable transfers", async function () {
      await savitriToken.connect(safeSigner).setTransfersEnabled(true);
      const isEnabled = await savitriToken.transfersEnabled();
      expect(isEnabled).to.be.true;
    });

    it("Should allow owner to disable transfers", async function () {
      await savitriToken.connect(safeSigner).setTransfersEnabled(false);
      const isEnabled = await savitriToken.transfersEnabled();
      expect(isEnabled).to.be.false;
    });

    it("Should allow transfers when enabled", async function () {
      await savitriToken.connect(safeSigner).setTransfersEnabled(true);
      await savitriToken.transfer(user1.address, ethers.utils.parseEther("1000"));
      await savitriToken.connect(user1).transfer(user2.address, ethers.utils.parseEther("100"));

      const balance = await savitriToken.balanceOf(user2.address);
      expect(balance).to.equal(ethers.utils.parseEther("100"));
    });
  });
});

