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

  it("provides current and next stage prices", async function () {
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

    const [current, next, stage] = await ico.getPriceInfo(user.address);
    const increment = ethers.utils.parseEther("0.00005");
    expect(next.sub(current)).to.equal(increment);
    expect(stage).to.equal(0);

    await ethers.provider.send("evm_increaseTime", [30]);
    await ethers.provider.send("evm_mine");

    const [current2, next2, stage2] = await ico.getPriceInfo(user.address);
    expect(current2.sub(current)).to.equal(increment);
    expect(next2.sub(current2)).to.equal(increment);
    expect(stage2).to.equal(1);
  });

  it("delays price increase for waitlisted users", async function () {
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
    await ico.setWaitlisted(user.address, true);

    const basePrice = await ico.getCurrentPrice(user.address);

    // 30 seconds should not change the price for waitlisted user
    await ethers.provider.send("evm_increaseTime", [30]);
    await ethers.provider.send("evm_mine");
    const midPrice = await ico.getCurrentPrice(user.address);
    expect(midPrice).to.equal(basePrice);

    // After full minute, price should increase
    await ethers.provider.send("evm_increaseTime", [30]);
    await ethers.provider.send("evm_mine");
    const laterPrice = await ico.getCurrentPrice(user.address);
    const expectedIncrement = ethers.utils.parseEther("0.00005");
    expect(laterPrice.sub(basePrice)).to.equal(expectedIncrement);
  });

  it("lets the owner adjust pricing intervals", async function () {
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

    await ico.setIntervals(120, 45);
    expect(await ico.waitlistInterval()).to.equal(120);
    expect(await ico.publicInterval()).to.equal(45);
  });
});
