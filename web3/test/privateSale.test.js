const { expect } = require("chai");
const { ethers } = require("hardhat");
const { deployMocks, setupTokenICO, createBuyer, approveTokens, createSafeSetup } = require("./helpers/testHelpers");

describe("TokenICO - Private Sale", function () {
  let tokenICO;
  let savitriToken;
  let safeAddress;
  let safeSigner;
  let deployer;
  let recipients;
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

    // Create recipients
    recipients = [];
    for (let i = 0; i < 5; i++) {
      const wallet = ethers.Wallet.createRandom();
      recipients.push(wallet.address);
      await deployer.sendTransaction({
        to: wallet.address,
        value: ethers.utils.parseEther("1.0"),
      });
    }
  });

  describe("setPrivateSaleAllocations", function () {
    it("Should allow owner to set allocations", async function () {
      const amounts = recipients.map(() => ethers.utils.parseEther("1000"));
      await tokenICO.connect(safeSigner).setPrivateSaleAllocations(recipients, amounts);

      for (let i = 0; i < recipients.length; i++) {
        const allocation = await tokenICO.privateSaleAllocation(recipients[i]);
        expect(allocation).to.equal(amounts[i]);
      }
    });

    it("Should fail with mismatched arrays", async function () {
      const amounts = [ethers.utils.parseEther("1000")];
      await expect(
        tokenICO.connect(safeSigner).setPrivateSaleAllocations(recipients, amounts)
      ).to.be.revertedWith("Length mismatch");
    });

    it("Should fail with batch size exceeding limit", async function () {
      const largeRecipients = Array(101).fill(ethers.Wallet.createRandom().address);
      const largeAmounts = largeRecipients.map(() => ethers.utils.parseEther("1000"));

      await expect(
        tokenICO.connect(safeSigner).setPrivateSaleAllocations(largeRecipients, largeAmounts)
      ).to.be.revertedWith("Batch too large");
    });

    it("Should fail when non-owner tries to set", async function () {
      const [nonOwner] = await ethers.getSigners();
      const amounts = recipients.map(() => ethers.utils.parseEther("1000"));

      await expect(
        tokenICO.connect(nonOwner).setPrivateSaleAllocations(recipients, amounts)
      ).to.be.revertedWith("Only owner");
    });
  });

  describe("distributePrivateSaleBatch", function () {
    beforeEach(async function () {
      // Set allocations
      const amounts = recipients.map(() => ethers.utils.parseEther("1000"));
      await tokenICO.connect(safeSigner).setPrivateSaleAllocations(recipients, amounts);

      // Set total allocated
      const totalAllocated = amounts.reduce((sum, amt) => sum.add(amt), ethers.BigNumber.from(0));
      await tokenICO.connect(safeSigner).setPrivateSaleTotalAllocated(totalAllocated);

      // Activate private sale
      await tokenICO.connect(safeSigner).setPrivateSaleActive(true);
    });

    it("Should allow owner to distribute batch", async function () {
      const distributeAmounts = recipients.map(() => ethers.utils.parseEther("500"));
      const reasons = recipients.map(() => "Test distribution");

      await tokenICO.connect(safeSigner).distributePrivateSaleBatch(
        recipients,
        distributeAmounts,
        reasons
      );

      for (let i = 0; i < recipients.length; i++) {
        const distributed = await tokenICO.privateSaleDistributed(recipients[i]);
        expect(distributed).to.equal(distributeAmounts[i]);
      }
    });

    it("Should allow distribution even when private sale inactive", async function () {
      // Note: distributePrivateSaleBatch doesn't check privateSaleActive
      // It only checks allocations and balances
      await tokenICO.connect(safeSigner).setPrivateSaleActive(false);

      const distributeAmounts = recipients.map(() => ethers.utils.parseEther("500"));
      const reasons = recipients.map(() => "Test");

      // This should still work as the function doesn't check privateSaleActive
      await tokenICO.connect(safeSigner).distributePrivateSaleBatch(
        recipients,
        distributeAmounts,
        reasons
      );
    });

    it("Should fail when exceeding allocation", async function () {
      const distributeAmounts = recipients.map(() => ethers.utils.parseEther("2000")); // More than allocated

      const reasons = recipients.map(() => "Test");

      await expect(
        tokenICO.connect(safeSigner).distributePrivateSaleBatch(
          recipients,
          distributeAmounts,
          reasons
        )
      ).to.be.revertedWith("Exceeds allocation");
    });

    it("Should fail with batch size exceeding limit", async function () {
      const largeRecipients = Array(101).fill(ethers.Wallet.createRandom().address);
      const largeAmounts = largeRecipients.map(() => ethers.utils.parseEther("100"));
      const largeReasons = largeRecipients.map(() => "Test");

      await expect(
        tokenICO.connect(safeSigner).distributePrivateSaleBatch(
          largeRecipients,
          largeAmounts,
          largeReasons
        )
      ).to.be.revertedWith("Batch too large");
    });
  });

  describe("setPrivateSaleActive", function () {
    it("Should allow owner to activate private sale", async function () {
      await tokenICO.connect(safeSigner).setPrivateSaleActive(true);
      const isActive = await tokenICO.privateSaleActive();
      expect(isActive).to.be.true;
    });

    it("Should allow owner to deactivate private sale", async function () {
      await tokenICO.connect(safeSigner).setPrivateSaleActive(true);
      await tokenICO.connect(safeSigner).setPrivateSaleActive(false);
      const isActive = await tokenICO.privateSaleActive();
      expect(isActive).to.be.false;
    });

    it("Should fail when non-owner tries to set", async function () {
      const [nonOwner] = await ethers.getSigners();
      await expect(
        tokenICO.connect(nonOwner).setPrivateSaleActive(true)
      ).to.be.revertedWith("Only owner");
    });
  });

  describe("getPrivateSaleInfo", function () {
    it("Should return private sale info for participant", async function () {
      const amount = ethers.utils.parseEther("1000");
      await tokenICO.connect(safeSigner).setPrivateSaleAllocations([recipients[0]], [amount]);

      const info = await tokenICO.getPrivateSaleInfo(recipients[0]);
      expect(info.allocation).to.equal(amount);
      expect(info.distributed).to.equal(0);
    });

    it("Should return zero for non-participant", async function () {
      const [nonParticipant] = await ethers.getSigners();
      const info = await tokenICO.getPrivateSaleInfo(nonParticipant.address);
      expect(info.allocation).to.equal(0);
      expect(info.distributed).to.equal(0);
    });
  });
});

