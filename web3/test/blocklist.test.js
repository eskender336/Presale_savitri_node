const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SavitriCoin blocklist", function () {
  it("blocks transfers involving listed addresses", async function () {
    const [owner, alice, bob] = await ethers.getSigners();
    const Savitri = await ethers.getContractFactory("SavitriCoin");
    const token = await Savitri.deploy();
    await token.deployed();

    await token.transfer(alice.address, ethers.utils.parseEther("10"));
    await token.transfer(bob.address, ethers.utils.parseEther("10"));

    await token.setBlockStatus(alice.address, true);
    await expect(
      token.connect(alice).transfer(bob.address, 1)
    ).to.be.revertedWith("Address is blocked");

    await token.setBlockStatus(alice.address, false);
    await token.setBlockStatus(bob.address, true);
    await expect(
      token.connect(alice).transfer(bob.address, 1)
    ).to.be.revertedWith("Address is blocked");
  });
});
