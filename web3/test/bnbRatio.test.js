const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TokenICO BNB ratio update", function () {
  it("updates bnbRatio based on USDT price", async function () {
    const [owner] = await ethers.getSigners();

    const Savitri = await ethers.getContractFactory("SavitriCoin");
    const saleToken = await Savitri.deploy();
    await saleToken.deployed();

    const ICO = await ethers.getContractFactory("TokenICO");
    const ico = await ICO.deploy();
    await ico.deployed();

    await ico.connect(owner).setSaleToken(saleToken.address);
    await saleToken.transfer(ico.address, ethers.utils.parseEther("1000000"));

    const block = await ethers.provider.getBlock("latest");
    await ico.setSaleStartTime(block.timestamp);

    const bnbPrice = ethers.utils.parseUnits("300", 6); // $300
    await ico.updateBNBRatio(bnbPrice);

    const currentPrice = await ico.getCurrentPrice(owner.address);
    const expectedRatio = bnbPrice.mul(ethers.constants.WeiPerEther).div(currentPrice);
    expect(await ico.bnbRatio()).to.equal(expectedRatio);
  });
});
