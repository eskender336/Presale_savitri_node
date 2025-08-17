const { expect } = require("chai");
const { ethers } = require("hardhat");

async function setupICO() {
  const [owner, buyer, other] = await ethers.getSigners();

  const Sav = await ethers.getContractFactory("SavitriCoin");
  const sav = await Sav.deploy();
  await sav.deployed();

  const ICO = await ethers.getContractFactory("TokenICO");
  const ico = await ICO.deploy();
  await ico.deployed();

  await ico.connect(owner).setSaleToken(sav.address);
  const saleLiquidity = ethers.utils.parseEther("1000000");
  await sav.connect(owner).transfer(ico.address, saleLiquidity);
  await sav.connect(owner).setAllowedSender(ico.address, true);

  return { owner, buyer, other, sav, ico };
}

describe("TokenICO security checks", function () {
  it("reverts purchases from sweeper-listed addresses", async function () {
    const { owner, buyer, ico } = await setupICO();

    await ico.connect(owner).setSweeper(buyer.address, true);

    await expect(
      ico.connect(buyer).buyWithBNB({ value: ethers.utils.parseEther("1") })
    ).to.be.revertedWith("Blocked sweeper");
  });

  it("reverts purchases from delegated wallets", async function () {
    const { owner, buyer, ico } = await setupICO();

    const Checker = await ethers.getContractFactory("DelegationCheckerMock");
    const checker = await Checker.deploy();
    await checker.deployed();

    await ico.connect(owner).setDelegationChecker(checker.address);
    await checker.setDelegated(buyer.address, true);

    await expect(
      ico.connect(buyer).buyWithBNB({ value: ethers.utils.parseEther("1") })
    ).to.be.revertedWith("Delegated wallet");
  });
});
