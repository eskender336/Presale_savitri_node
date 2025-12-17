const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TokenICO BNB ratio update", function () {
  it("updates bnbRatio based on USDT price", async function () {
    const [owner] = await ethers.getSigners();

    // For tests, use owner address 5 times as multisig owners
    const multisigOwners = [owner.address, owner.address, owner.address, owner.address, owner.address];
    const Savitri = await ethers.getContractFactory("SavitriCoin");
    const saleToken = await Savitri.deploy(multisigOwners);
    await saleToken.deployed();

    // For tests, use owner address 5 times as multisig owners
    const multisigOwners = [owner.address, owner.address, owner.address, owner.address, owner.address];
    const ICO = await ethers.getContractFactory("TokenICO");
    const ico = await ICO.deploy(multisigOwners);
    await ico.deployed();

    await ico.connect(owner).setSaleToken(saleToken.address);
    await saleToken.transfer(ico.address, ethers.utils.parseEther("1000000"));

    const block = await ethers.provider.getBlock("latest");
    await ico.setSaleStartTime(block.timestamp);

    // Set mock price feed with BNB = $300
    const Feed = await ethers.getContractFactory("MockPriceFeed");
    const feed = await Feed.deploy(8, ethers.utils.parseUnits("300", 8));
    await feed.deployed();
    await ico.setBNBPriceFeed(feed.address);

    const currentPrice = await ico.getCurrentPrice(owner.address);
    const bnbPrice = ethers.utils.parseUnits("300", 8);
    const expectedRatio = bnbPrice
      .mul(ethers.constants.WeiPerEther)
      .mul(ethers.BigNumber.from(10).pow(6))
      .div(currentPrice)
      .div(ethers.BigNumber.from(10).pow(8));
    expect(await ico.bnbRatio()).to.equal(expectedRatio);
  });
});
