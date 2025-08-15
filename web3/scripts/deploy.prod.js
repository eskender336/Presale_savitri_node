const hre = require("hardhat");
require("dotenv").config();

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // Deploy SAV token
  const SavitriCoin = await hre.ethers.getContractFactory("SavitriCoin");
  const savitriToken = await SavitriCoin.deploy();
  await savitriToken.deployed();
  console.log("✅ SAV token deployed to:", savitriToken.address);

  // Deploy TokenICO contract
  const TokenICO = await hre.ethers.getContractFactory("TokenICO");
  const tokenICO = await TokenICO.deploy();
  await tokenICO.deployed();
  console.log("✅ TokenICO contract deployed to:", tokenICO.address);

  // 🔹 Set the signer for vouchers
  await tokenICO.setSigner("0xDca5AF91A9d0665e96a65712bF38382044edec54");
  console.log("✅ signer set:", await tokenICO.signer());

  // Configure sale token
  await tokenICO.setSaleToken(savitriToken.address);
  console.log("✅ saleToken set:", savitriToken.address);

  // Fund ICO with sale tokens
  await savitriToken.transfer(tokenICO.address, hre.ethers.utils.parseUnits("500000", 18));
  console.log("✅ ICO funded with 500,000 SAV tokens");

  // Register real token payment options if provided
  const {
    USDT_ADDRESS,
    USDT_RATIO,
    USDC_ADDRESS,
    USDC_RATIO,
    ETH_ADDRESS,
    ETH_RATIO,
    SOL_ADDRESS,
    SOL_RATIO,
    BTC_ADDRESS,
    BTC_RATIO,
  } = process.env;

  if (USDT_ADDRESS) {
    await tokenICO.updateUSDT(USDT_ADDRESS, USDT_RATIO || 1000);
    console.log("✅ USDT payment enabled:", USDT_ADDRESS);
  }
  if (USDC_ADDRESS) {
    await tokenICO.updateUSDC(USDC_ADDRESS, USDC_RATIO || 1000);
    console.log("✅ USDC payment enabled:", USDC_ADDRESS);
  }
  if (ETH_ADDRESS) {
    await tokenICO.updateETH(ETH_ADDRESS, ETH_RATIO || 1000);
    console.log("✅ ETH payment enabled:", ETH_ADDRESS);
  }
  if (SOL_ADDRESS) {
    await tokenICO.updateSOL(SOL_ADDRESS, SOL_RATIO || 1000);
    console.log("✅ SOL payment enabled:", SOL_ADDRESS);
  }
  if (BTC_ADDRESS) {
    await tokenICO.updateBTC(BTC_ADDRESS, BTC_RATIO || 1000);
    console.log("✅ BTC payment enabled:", BTC_ADDRESS);
  }

  // Output ENV-style addresses
  console.log("------------------------");
  console.log("NEXT_PUBLIC_TOKEN_ICO_ADDRESS =", tokenICO.address);
  console.log("NEXT_PUBLIC_OWNER_ADDRESS =", deployer.address);
  console.log("NEXT_PUBLIC_SAV_ADDRESS =", savitriToken.address);
  if (USDT_ADDRESS) console.log("NEXT_PUBLIC_USDT_ADDRESS =", USDT_ADDRESS);
  if (USDC_ADDRESS) console.log("NEXT_PUBLIC_USDC_ADDRESS =", USDC_ADDRESS);
  if (ETH_ADDRESS) console.log("NEXT_PUBLIC_ETH_ADDRESS =", ETH_ADDRESS);
  if (SOL_ADDRESS) console.log("NEXT_PUBLIC_SOL_ADDRESS =", SOL_ADDRESS);
  if (BTC_ADDRESS) console.log("NEXT_PUBLIC_BTC_ADDRESS =", BTC_ADDRESS);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
