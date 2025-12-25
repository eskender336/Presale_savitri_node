const { expect } = require("chai");
const { ethers } = require("hardhat");
const { createSafeSetup } = require("./helpers/testHelpers");
const { MerkleTree } = require("merkletreejs");
const keccak256 = require("keccak256");

describe("Private Sale Distribution Contract", function () {
  let privateSaleDistribution;
  let savitriToken;
  let safeAddress;
  let safeSigner;
  let deployer;
  let recipients;
  let merkleTree;
  let merkleRoot;

  beforeEach(async function () {
    [deployer] = await ethers.getSigners();

    // Create Safe setup
    const safe = await createSafeSetup(deployer);
    safeAddress = safe.safeAddress;
    safeSigner = safe.safeSigner;

    // Deploy SavitriCoin
    const SavitriCoin = await ethers.getContractFactory("SavitriCoin");
    savitriToken = await SavitriCoin.deploy();
    await savitriToken.deployed();

    // Deploy Private Sale Distribution
    const PrivateSaleDistribution = await ethers.getContractFactory("PrivateSaleDistribution");
    privateSaleDistribution = await PrivateSaleDistribution.connect(safeSigner).deploy(savitriToken.address);
    await privateSaleDistribution.deployed();

    // Transfer ownership
    await savitriToken.transferOwnership(safeAddress);

    // Create recipients
    recipients = [];
    const amounts = [];
    for (let i = 0; i < 5; i++) {
      const wallet = ethers.Wallet.createRandom();
      recipients.push(wallet.address);
      amounts.push(ethers.utils.parseEther("1000"));
    }

    // Create Merkle tree
    const leaves = recipients.map((addr, i) =>
      keccak256(ethers.utils.solidityPack(["address", "uint256"], [addr, amounts[i]]))
    );
    merkleTree = new MerkleTree(leaves, keccak256, { sortPairs: true });
    merkleRoot = merkleTree.getHexRoot();

    // Transfer tokens to private sale distribution
    const totalAmount = amounts.reduce((sum, amt) => sum.add(amt), ethers.BigNumber.from(0));
    await savitriToken.transfer(privateSaleDistribution.address, totalAmount);

    // Enable transfers in SavitriCoin
    await savitriToken.connect(safeSigner).setTransfersEnabled(true);
    await savitriToken.connect(safeSigner).setAllowedSender(privateSaleDistribution.address, true);
  });

  describe("setMerkleRoot", function () {
    it("Should allow owner to set Merkle root", async function () {
      await privateSaleDistribution.connect(safeSigner).setMerkleRoot(merkleRoot);
      const root = await privateSaleDistribution.merkleRoot();
      expect(root).to.equal(merkleRoot);
    });

    it("Should fail when non-owner tries to set", async function () {
      const [nonOwner] = await ethers.getSigners();
      await expect(
        privateSaleDistribution.connect(nonOwner).setMerkleRoot(merkleRoot)
      ).to.be.revertedWith("Only owner");
    });
  });

  describe("batchSend", function () {
    beforeEach(async function () {
      await privateSaleDistribution.connect(safeSigner).setMerkleRoot(merkleRoot);
    });

    it("Should allow owner to send with valid Merkle proofs", async function () {
      const amounts = recipients.map(() => ethers.utils.parseEther("1000"));
      const proofs = recipients.map((addr, i) =>
        merkleTree.getHexProof(
          keccak256(ethers.utils.solidityPack(["address", "uint256"], [addr, amounts[i]]))
        )
      );

      await privateSaleDistribution.connect(safeSigner).batchSend(recipients, amounts, proofs);

      for (let i = 0; i < recipients.length; i++) {
        const hasReceived = await privateSaleDistribution.hasReceived(recipients[i]);
        expect(hasReceived).to.be.true;
      }
    });

    it("Should fail without Merkle root set", async function () {
      const PrivateSaleDistribution2 = await ethers.getContractFactory("PrivateSaleDistribution");
      const privateSaleDistribution2 = await PrivateSaleDistribution2.connect(safeSigner).deploy(savitriToken.address);
      await privateSaleDistribution2.deployed();

      const amounts = recipients.map(() => ethers.utils.parseEther("1000"));
      const proofs = recipients.map(() => []);

      await expect(
        privateSaleDistribution2.connect(safeSigner).batchSend(recipients, amounts, proofs)
      ).to.be.revertedWith("Merkle root not set");
    });

    it("Should fail with invalid Merkle proof", async function () {
      const amounts = recipients.map(() => ethers.utils.parseEther("1000"));
      const invalidProofs = recipients.map(() => [ethers.utils.randomBytes(32)]);

      await expect(
        privateSaleDistribution.connect(safeSigner).batchSend(recipients, amounts, invalidProofs)
      ).to.be.revertedWith("Invalid Merkle proof");
    });

    it("Should fail with batch size exceeding limit", async function () {
      const largeRecipients = Array(101).fill(ethers.Wallet.createRandom().address);
      const largeAmounts = largeRecipients.map(() => ethers.utils.parseEther("100"));
      const largeProofs = largeRecipients.map(() => []);

      await expect(
        privateSaleDistribution.connect(safeSigner).batchSend(largeRecipients, largeAmounts, largeProofs)
      ).to.be.revertedWith("Batch too large");
    });

    it("Should fail when sending to same recipient twice", async function () {
      const amounts = recipients.map(() => ethers.utils.parseEther("1000"));
      const proofs = recipients.map((addr, i) =>
        merkleTree.getHexProof(
          keccak256(ethers.utils.solidityPack(["address", "uint256"], [addr, amounts[i]]))
        )
      );

      await privateSaleDistribution.connect(safeSigner).batchSend(recipients, amounts, proofs);

      // Try to send again
      await expect(
        privateSaleDistribution.connect(safeSigner).batchSend(recipients, amounts, proofs)
      ).to.be.revertedWith("Already sent");
    });
  });

  describe("batchSendDirect", function () {
    it("Should allow owner to send without Merkle validation", async function () {
      const amounts = recipients.map(() => ethers.utils.parseEther("1000"));

      await privateSaleDistribution.connect(safeSigner).batchSendDirect(recipients, amounts);

      for (let i = 0; i < recipients.length; i++) {
        const hasReceived = await privateSaleDistribution.hasReceived(recipients[i]);
        expect(hasReceived).to.be.true;
      }
    });

    it("Should fail with batch size exceeding limit", async function () {
      const largeRecipients = Array(101).fill(ethers.Wallet.createRandom().address);
      const largeAmounts = largeRecipients.map(() => ethers.utils.parseEther("100"));

      await expect(
        privateSaleDistribution.connect(safeSigner).batchSendDirect(largeRecipients, largeAmounts)
      ).to.be.revertedWith("Batch too large");
    });

    it("Should fail when non-owner tries to send", async function () {
      const [nonOwner] = await ethers.getSigners();
      const amounts = recipients.map(() => ethers.utils.parseEther("1000"));

      await expect(
        privateSaleDistribution.connect(nonOwner).batchSendDirect(recipients, amounts)
      ).to.be.revertedWith("Only owner");
    });
  });

  describe("withdrawTokens", function () {
    it("Should allow owner to withdraw tokens", async function () {
      const balance = await privateSaleDistribution.getBalance();
      await privateSaleDistribution.connect(safeSigner).withdrawTokens(safeAddress, balance);

      const newBalance = await privateSaleDistribution.getBalance();
      expect(newBalance).to.equal(0);
    });

    it("Should fail when non-owner tries to withdraw", async function () {
      const [nonOwner] = await ethers.getSigners();
      await expect(
        privateSaleDistribution.connect(nonOwner).withdrawTokens(nonOwner.address, ethers.utils.parseEther("1000"))
      ).to.be.revertedWith("Only owner");
    });
  });
});

