const { expect } = require("chai");
const { ethers } = require("hardhat");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");

describe("Blocked buyer can receive but cannot send SAV", function () {
  async function deployAll() {
    const [owner, buyer, other] = await ethers.getSigners();
  
    const Sav = await ethers.getContractFactory("SavitriCoin");
    const sav = await Sav.deploy();
    await sav.deployed();

    const ICO = await ethers.getContractFactory("TokenICO");
    const ico = await ICO.deploy();
    await ico.deployed();
  
    await ico.connect(owner).setSaleToken(sav.address);
  
    // FIX: no underscores in parseEther string
    const saleLiquidity = ethers.utils.parseEther("1000000"); // 1,000,000 SAV
    await sav.connect(owner).transfer(ico.address, saleLiquidity);
  
    await sav.connect(owner).setAllowedSender(ico.address, true);

    const block = await ethers.provider.getBlock("latest");
    await ico.connect(owner).setSaleStartTime(block.timestamp);

    // configure price feed for BNB
    const Feed = await ethers.getContractFactory("MockPriceFeed");
    const feed = await Feed.deploy(8, ethers.utils.parseUnits("300", 8));
    await feed.deployed();
    await ico.setBNBPriceFeed(feed.address);
  
    return { owner, buyer, other, sav, ico };
  }
  
  it("allows a blocked address to buy (receive) SAV but prevents it from sending afterwards", async function () {
    const { owner, buyer, other, sav, ico } = await deployAll();

    // Block the buyer as a sender in the SAV token
    await sav.connect(owner).setBlockStatus(buyer.address, true);

    // Sanity: transfers are globally disabled; ICO is whitelisted
    expect(await sav.transfersEnabled()).to.equal(false);
    expect(await sav.allowedSenders(ico.address)).to.equal(true);

    // Compute expected token amount for a 1 BNB buy
    const paid = ethers.utils.parseEther("1");
    const bnbRatio = await ico.bnbRatio();
    const expectedTokens = paid.mul(bnbRatio).div(ethers.utils.parseEther("1"));

    // Blocked buyer buys with BNB: should SUCCEED (buyer is receiver; hook checks sender=ICO)
    await expect(ico.connect(buyer).buyWithBNB({ value: paid }))
      .to.emit(ico, "TokensPurchased")
      .withArgs(buyer.address, ethers.constants.AddressZero, paid, expectedTokens, anyValue);

    // Buyer balance increased
    const bal = await sav.balanceOf(buyer.address);
    expect(bal).to.equal(expectedTokens);

    // Now buyer tries to send 1 wei of SAV to someone else → should REVERT ("Sender is blocked")
    await expect(
      sav.connect(buyer).transfer(other.address, 1)
    ).to.be.revertedWith("Sender is blocked");
  });
});
