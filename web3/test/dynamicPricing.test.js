const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TokenICO dynamic pricing", function () {
  it("increments price in stablecoin-denominated steps", async function () {
    const [owner, user] = await ethers.getSigners();

    const Savitri = await ethers.getContractFactory("SavitriCoin");
    const saleToken = await Savitri.deploy();
    await saleToken.deployed();

    const ICO = await ethers.getContractFactory("TokenICO");
    const ico = await ICO.deploy();
    await ico.deployed();

    await ico.connect(owner).setSaleToken(saleToken.address);
    await saleToken.transfer(ico.address, ethers.utils.parseEther("1000000"));
    await saleToken.setSaleContract(ico.address);

    const block = await ethers.provider.getBlock("latest");
    await ico.setSaleStartTime(block.timestamp);

    const basePrice = await ico.getCurrentPrice(user.address);

    await ethers.provider.send("evm_increaseTime", [30]);
    await ethers.provider.send("evm_mine");

    const nextPrice = await ico.getCurrentPrice(user.address);
    const expectedIncrement = ethers.utils.parseEther("0.00005");

    expect(nextPrice.sub(basePrice)).to.equal(expectedIncrement);
  });
});
