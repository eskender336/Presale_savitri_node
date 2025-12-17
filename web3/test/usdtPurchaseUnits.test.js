const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TokenICO USDT purchase units", function () {
  it("mints correct token amount when paying with whole-number USDT", async function () {
    const [owner, buyer] = await ethers.getSigners();

    // Deploy sale token
    // For tests, use owner address 5 times as multisig owners
    const multisigOwners = [owner.address, owner.address, owner.address, owner.address, owner.address];
    const Savitri = await ethers.getContractFactory("SavitriCoin");
    const saleToken = await Savitri.deploy(multisigOwners);
    await saleToken.deployed();

    // Deploy TokenICO
    // For tests, use owner address 5 times as multisig owners
    const multisigOwners = [owner.address, owner.address, owner.address, owner.address, owner.address];
    const ICO = await ethers.getContractFactory("TokenICO");
    const ico = await ICO.deploy(multisigOwners);
    await ico.deployed();

    // Configure sale token and supply
    await ico.connect(owner).setSaleToken(saleToken.address);
    await saleToken.transfer(ico.address, ethers.utils.parseEther("1000000"));
    await saleToken.setAllowedSender(ico.address, true);

    // Deploy mock USDT with 6 decimals
    const Stable = await ethers.getContractFactory("StableCoins");
    const usdt = await Stable.deploy("Tether USD", "USDT", 6);
    await usdt.deployed();

    await ico.updateUSDT(usdt.address);

    const usdtWhole = 100; // 100 USDT
    const usdtAmount = ethers.utils.parseUnits(usdtWhole.toString(), 6);
    await usdt.mint(buyer.address, usdtAmount);
    await usdt.connect(buyer).approve(ico.address, usdtAmount);

    const block = await ethers.provider.getBlock("latest");
    await ico.setSaleStartTime(block.timestamp);

    const price = await ico.getCurrentPrice(buyer.address);
    const expectedTokens = usdtAmount
      .mul(ethers.constants.WeiPerEther)
      .div(price);

    await ico.connect(buyer).buyWithUSDT(usdtWhole);

    const balance = await saleToken.balanceOf(buyer.address);
    expect(balance).to.equal(expectedTokens);
  });
});
