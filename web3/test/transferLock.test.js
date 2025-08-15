const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SavitriCoin transfer lock", function () {
  it("prevents non-owners from transferring before enabling", async function () {
    const [owner, alice, bob] = await ethers.getSigners();
    const Savitri = await ethers.getContractFactory("SavitriCoin");
    const token = await Savitri.deploy();
    await token.deployed();

    await token.transfer(alice.address, ethers.utils.parseEther("10"));
    await expect(
      token.connect(alice).transfer(bob.address, 1)
    ).to.be.revertedWith("Transfers disabled");

    await token.enableTransfers();
    await token.connect(alice).transfer(bob.address, 1);
    expect(await token.balanceOf(bob.address)).to.equal(1);
  });
});
