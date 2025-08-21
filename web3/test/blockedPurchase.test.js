const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Blocked address purchase", function () {
  it("allows a blocked account to buy tokens but not send them", async function () {
    const [owner, buyer] = await ethers.getSigners();

    const Token = await ethers.getContractFactory("SavitriCoin");
    const token = await Token.deploy();
    await token.deployed();

    const ICO = await ethers.getContractFactory("TokenICO");
    const ico = await ICO.deploy();
    await ico.deployed();

    // Fund ICO and whitelist it for transfers
    await token.transfer(ico.address, ethers.utils.parseEther("1000"));
    await token.setAllowedSender(ico.address, true);
    await ico.setSaleToken(token.address);

    // Block the buyer from sending tokens
    await token.setBlockStatus(buyer.address, true);

    // Buyer purchases SAV with 1 BNB
    await ico
      .connect(buyer)
      .buyWithBNB({ value: ethers.utils.parseEther("1") });

    // Buyer receives tokens
    const balance = await token.balanceOf(buyer.address);
    expect(balance).to.be.gt(0);

    // Blocked buyer cannot transfer tokens out
    await expect(
      token.connect(buyer).transfer(owner.address, 1)
    ).to.be.revertedWith("Sender is blocked");
  });
});
