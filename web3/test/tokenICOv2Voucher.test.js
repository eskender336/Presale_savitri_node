const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TokenICOv2 vouchers", function () {
  it("allows purchase with valid voucher and binds referrer", async function () {
    const [owner, signer, user, referrer] = await ethers.getSigners();

    // deploy sale token (no multisig needed)
    const Savitri = await ethers.getContractFactory("SavitriCoin");
    const saleToken = await Savitri.deploy();
    await saleToken.deployed();

    // deploy ICO contract (no multisig needed)
    const ICO = await ethers.getContractFactory("TokenICO");
    const ico = await ICO.deploy();
    await ico.deployed();

    await ico.connect(owner).setSaleToken(saleToken.address);
    // transfer tokens to ICO contract for selling and referral rewards
    await saleToken.transfer(ico.address, ethers.utils.parseEther("1000000"));
    await saleToken.setAllowedSender(ico.address, true);

    // configure BNB price feed
    const Feed = await ethers.getContractFactory("MockPriceFeed");
    const feed = await Feed.deploy(8, ethers.utils.parseUnits("300", 8));
    await feed.deployed();
    await ico.setBNBPriceFeed(feed.address);

    await ico.connect(owner).setSigner(signer.address);

    const nonce = 1;
    const deadline = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 365;
    const voucher = {
      user: user.address,
      referrer: referrer.address,
      nonce,
      deadline,
    };

    const domain = {
      name: "TokenICO",
      version: "1",
      chainId: await user.getChainId(),
      verifyingContract: ico.address,
    };

    const types = {
      WhitelistRef: [
        { name: "user", type: "address" },
        { name: "referrer", type: "address" },
        { name: "nonce", type: "uint256" },
        { name: "deadline", type: "uint256" },
      ],
    };

    const signature = await signer._signTypedData(domain, types, voucher);

    await ico
      .connect(user)
      .buyWithBNB_Voucher(voucher, signature, { value: ethers.utils.parseEther("1") });

    expect(await ico.usedNonce(user.address)).to.equal(nonce);
    expect(await ico.referrers(user.address)).to.equal(referrer.address);
    // Both user and referrer should be marked waitlisted
    expect(await ico.waitlisted(user.address)).to.equal(true);
    expect(await ico.waitlisted(referrer.address)).to.equal(true);
  });
});
