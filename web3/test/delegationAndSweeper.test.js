const { expect } = require("chai");
const { ethers } = require("hardhat");

// Helper function to execute multisig proposals in tests
async function executeMultisigProposal(ico, proposalId, multisigSigners) {
  // Get proposal details
  const proposal = await ico.getProposal(proposalId);
  
  // Approve with additional signers if needed (need 3 total approvals)
  const currentApprovals = proposal.approvals.toNumber();
  const neededApprovals = 3 - currentApprovals;
  
  // Use different signers for approvals (skip the proposer who already approved)
  for (let i = 1; i <= neededApprovals && i < multisigSigners.length; i++) {
    const signer = multisigSigners[i];
    const hasApproved = await ico.hasApprovedProposal(proposalId, signer.address);
    if (!hasApproved) {
      await ico.connect(signer).approveProposal(proposalId);
    }
  }
  
  // Execute if we have enough approvals
  const updatedProposal = await ico.getProposal(proposalId);
  if (updatedProposal.approvals.toNumber() >= 3 && !updatedProposal.executed) {
    await ico.connect(multisigSigners[0]).executeProposal(proposalId);
  }
}

async function setupICO() {
  const signers = await ethers.getSigners();
  const [owner, buyer, other] = signers;
  
  // Use at least 5 different signers for multisig owners, or repeat if not enough
  const multisigSigners = signers.slice(0, 5).length >= 5 
    ? signers.slice(0, 5) 
    : [...signers, ...signers, ...signers].slice(0, 5);

  // For tests, use owner address 5 times as multisig owners
  const multisigOwners = [owner.address, owner.address, owner.address, owner.address, owner.address];
  const Sav = await ethers.getContractFactory("SavitriCoin");
  const sav = await Sav.deploy(multisigOwners);
  await sav.deployed();

  const multisigOwners = multisigSigners.map(s => s.address);
  
  const ICO = await ethers.getContractFactory("TokenICO");
  const ico = await ICO.deploy(multisigOwners);
  await ico.deployed();

  // Use helper to execute multisig proposals
  const proposalId1 = await ico.connect(owner).setSaleToken(sav.address);
  await executeMultisigProposal(ico, proposalId1, multisigSigners);
  
  const saleLiquidity = ethers.utils.parseEther("1000000");
  await sav.connect(owner).transfer(ico.address, saleLiquidity);
  await sav.connect(owner).setAllowedSender(ico.address, true);

  // configure price feed for BNB
  const Feed = await ethers.getContractFactory("MockPriceFeed");
  const feed = await Feed.deploy(8, ethers.utils.parseUnits("300", 8));
  await feed.deployed();
  const proposalId2 = await ico.connect(owner).setBNBPriceFeed(feed.address);
  await executeMultisigProposal(ico, proposalId2, multisigSigners);

  return { owner, buyer, other, sav, ico, executeMultisigProposal, multisigSigners };
}

describe("TokenICO security checks", function () {
  it("reverts purchases from sweeper-listed addresses", async function () {
    const { owner, buyer, ico, executeMultisigProposal, multisigSigners } = await setupICO();

    const proposalId = await ico.connect(owner).setSweeper(buyer.address, true);
    await executeMultisigProposal(ico, proposalId, multisigSigners);

    await expect(
      ico.connect(buyer).buyWithBNB({ value: ethers.utils.parseEther("1") })
    ).to.be.revertedWith("Blocked sweeper");
  });

  it("reverts purchases from delegated wallets", async function () {
    const { owner, buyer, ico, executeMultisigProposal, multisigSigners } = await setupICO();

    const Checker = await ethers.getContractFactory("DelegationCheckerMock");
    const checker = await Checker.deploy();
    await checker.deployed();

    const proposalId = await ico.connect(owner).setDelegationChecker(checker.address);
    await executeMultisigProposal(ico, proposalId, multisigSigners);
    await checker.setDelegated(buyer.address, true);

    await expect(
      ico.connect(buyer).buyWithBNB({ value: ethers.utils.parseEther("1") })
    ).to.be.revertedWith("Delegated wallet");
  });
});
