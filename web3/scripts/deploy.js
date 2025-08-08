const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  const network = await hre.ethers.provider.getNetwork();
  if ([1337, 84532, 11155111, 17000].includes(network.chainId)) {
    console.log("\nDeploying Mock Tokens for Local Testing:");
    console.log("------------------------");

    // Mock Stablecoins Contract Factory
    const MockStableCoins = await hre.ethers.getContractFactory("StableCoins");

    // Deploy mock USDT (6 decimals)
    const mockUSDT = await MockStableCoins.deploy("USDT", "USDT", 6);
    await mockUSDT.deployed();
    console.log("✅ Mock USDT deployed to:", mockUSDT.address);

    // Deploy mock USDC (6 decimals)
    const mockUSDC = await MockStableCoins.deploy("USDC", "USDC", 6);
    await mockUSDC.deployed();
    console.log("✅ Mock USDC deployed to:", mockUSDC.address);

    // Deploy mock ETH token (18 decimals)
    const mockETH = await MockStableCoins.deploy("ETH", "ETH", 18);
    await mockETH.deployed();
    console.log("✅ Mock ETH deployed to:", mockETH.address);

    // Deploy mock SOL (9 decimals)
    const mockSOL = await MockStableCoins.deploy("SOL", "SOL", 9);
    await mockSOL.deployed();
    console.log("✅ Mock SOL deployed to:", mockSOL.address);

    // Deploy mock BTC (8 decimals)
    const mockBTC = await MockStableCoins.deploy("BTC", "BTC", 8);
    await mockBTC.deployed();
    console.log("✅ Mock BTC deployed to:", mockBTC.address);

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

    // Mint large supply to deployer
    const mintStable = hre.ethers.utils.parseUnits("1000000000", 6); // for USDT/USDC
    const mintETH = hre.ethers.utils.parseUnits("1000000000", 18);
    const mintSOL = hre.ethers.utils.parseUnits("1000000000", 9);
    const mintBTC = hre.ethers.utils.parseUnits("1000000000", 8);

    await mockUSDT.mint(deployer.address, mintStable);
    await mockUSDC.mint(deployer.address, mintStable);
    await mockETH.mint(deployer.address, mintETH);
    await mockSOL.mint(deployer.address, mintSOL);
    await mockBTC.mint(deployer.address, mintBTC);

    // Set sale token
    await tokenICO.setSaleToken(savitriToken.address);
    console.log("✅ saleToken set:", savitriToken.address);

    // Transfer SAV to ICO contract
    await savitriToken.transfer(tokenICO.address, hre.ethers.utils.parseUnits("500000", 18));
    console.log("✅ ICO funded with 500,000 SAV tokens");

    // Set token payment options with ratios
    await tokenICO.updateUSDT(mockUSDT.address, 1000);
    await tokenICO.updateUSDC(mockUSDC.address, 1000);
    await tokenICO.updateETH(mockETH.address, 1000);
    await tokenICO.updateSOL(mockSOL.address, 1000);
    await tokenICO.updateBTC(mockBTC.address, 1000); // requires function in your contract

    console.log("✅ All token payment methods registered with ICO");

    // Output ENV-style addresses
    console.log("------------------------");
    console.log("NEXT_PUBLIC_TOKEN_ICO_ADDRESS =", tokenICO.address);
    console.log("NEXT_PUBLIC_OWNER_ADDRESS =", deployer.address);
    console.log("NEXT_PUBLIC_USDT_ADDRESS =", mockUSDT.address);
    console.log("NEXT_PUBLIC_USDC_ADDRESS =", mockUSDC.address);
    console.log("NEXT_PUBLIC_SAV_ADDRESS =", savitriToken.address);
    console.log("NEXT_PUBLIC_ETH_ADDRESS =", mockETH.address);
    console.log("NEXT_PUBLIC_SOL_ADDRESS =", mockSOL.address);
    console.log("NEXT_PUBLIC_BTC_ADDRESS =", mockBTC.address);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
