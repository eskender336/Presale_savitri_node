const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SavitriCoin blocklist", function () {
  it("restricts transfers and only checks blocked senders", async function () {
    const [owner, alice, bob] = await ethers.getSigners();
    const Savitri = await ethers.getContractFactory("SavitriCoin");
    const token = await Savitri.deploy();
    await token.deployed();

    await token.transfer(alice.address, ethers.utils.parseEther("10"));

    await expect(
      token.connect(alice).transfer(bob.address, 1)
    ).to.be.revertedWith("Transfers disabled");

    await token.setAllowedSender(alice.address, true);
    await token.connect(alice).transfer(bob.address, 1);

    await token.setBlockStatus(alice.address, true);
    await expect(
      token.connect(alice).transfer(bob.address, 1)
    ).to.be.revertedWith("Sender is blocked");

    await token.setBlockStatus(alice.address, false);
    await token.setBlockStatus(bob.address, true);
    await token.connect(alice).transfer(bob.address, 1);

    await expect(
      token.connect(bob).transfer(alice.address, 1)
    ).to.be.revertedWith("Sender is blocked");
  });
});
