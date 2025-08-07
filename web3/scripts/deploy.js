// scripts/deploy.js
const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // Check if we're on localhost/hardhat network
  const network = await hre.ethers.provider.getNetwork();
  if (
    network.chainId === 1337 ||
    network.chainId === 84532 ||
    network.chainId === 11155111 ||
    network.chainId === 17000
  ) {
    // Local network
    console.log("\nDeploying Mock Tokens for Local Testing:");
    console.log("------------------------");

    // Deploy mock USDT
    const MockStableCoins = await hre.ethers.getContractFactory("StableCoins");
    const mockUSDT = await MockStableCoins.deploy("USDT", "USDT", 6);
    await mockUSDT.deployed();
    console.log("Mock USDT deployed to:", mockUSDT.address);

    // Deploy mock USDC
    console.log("Deploy mock USDC");
    const mockUSDC = await MockStableCoins.deploy("USDC", "USDC", 6);
    await mockUSDC.deployed();
    console.log("Mock USDC deployed to:", mockUSDC.address);

    // Deploy mock SAV
    const SavitriCoin = await hre.ethers.getContractFactory("SavitriCoin");
    const savitriToken = await SavitriCoin.deploy();
    await savitriToken.deployed();
    console.log("✅ Savitri Coin (SAV) deployed to:", savitriToken.address);
    

    // Deploy mock BNB and SOL tokens for testing
    const mockBNB = await MockStableCoins.deploy("BNB", "BNB", 18);
    await mockBNB.deployed();
    console.log("Mock BNB deployed to:", mockBNB.address);

    await tokenICO.updateBNB(mockBNB.address, 1000); // 1000 = token ratio per 1 BNB
    console.log("✅ BNB address and ratio set:", mockBNB.address);

    const mockSOL = await MockStableCoins.deploy("SOL", "SOL", 9);
    await mockSOL.deployed();
    console.log("Mock SOL deployed to:", mockSOL.address);

    const usdtAddress = mockUSDT.address;
    const usdcAddress = mockUSDC.address;
    const savAddress = savitriToken.address;

    // Mint some tokens to deployer
    const mintAmount = hre.ethers.utils.parseUnits("1000000000", 6); // 1B tokens
    await mockUSDT.mint(deployer.address, mintAmount);
    await mockUSDC.mint(deployer.address, mintAmount);
    await mockBNB.mint(deployer.address, hre.ethers.utils.parseUnits("1000000000", 18));
    await mockSOL.mint(deployer.address, hre.ethers.utils.parseUnits("1000000000", 9));

    // Deploy TokenICO Contract
    console.log("\nDeploying TokenICO contract...");
    const TokenICO = await hre.ethers.getContractFactory("TokenICO");
    const tokenICO = await TokenICO.deploy();
    await tokenICO.deployed();

    console.log("\nDeployment Successful!");
    
        // ✅ Set the sale token and fund the ICO
    await tokenICO.setSaleToken(savitriToken.address);
    console.log("✅ saleToken set:", savitriToken.address);

    await savitriToken.transfer(tokenICO.address, hre.ethers.utils.parseUnits("500000", 18));
    console.log("✅ ICO funded with 500,000 SAV tokens");
    
    // ✅ Set USDT and USDC addresses and ratios (e.g., 1000 tokens per 1 USDT/USDC)
    await tokenICO.updateUSDT(mockUSDT.address, 1000);
    console.log("✅ USDT address and ratio set:", mockUSDT.address);

    await tokenICO.updateUSDC(mockUSDC.address, 1000);
    console.log("✅ USDC address and ratio set:", mockUSDC.address);

    console.log("------------------------");
    console.log("NEXT_PUBLIC_TOKEN_ICO_ADDRESS:", tokenICO.address);
    console.log("NEXT_PUBLIC_OWNER_ADDRESS:", deployer.address);
    console.log("NEXT_PUBLIC_USDT_ADDRESS:", usdtAddress);
    console.log("NEXT_PUBLIC_USDC_ADDRESS:", usdcAddress);
    console.log("NEXT_PUBLIC_SAV_ADDRESS:", savAddress);
    console.log("NEXT_PUBLIC_BNB_ADDRESS:", mockBNB.address);
    console.log("NEXT_PUBLIC_SOL_ADDRESS:", mockSOL.address);

    if (network.chainId === 17000) {
      if (!tokenICO.address) {
        console.error(
          "Please set the NEXT_PUBLIC_TOKEN_ICO_ADDRESS environment variable"
        );
        process.exit(1);
      }

      console.log("Verifying TokenICO contract at address:", tokenICO.address);

      try {
        await hre.run("verify:verify", {
          address: tokenICO.address,
          constructorArguments: [],
          network: "holesky", // Explicitly specify Holesky network
        });

        console.log("Contract verification successful!");
      } catch (error) {
        if (error.message.includes("Already Verified")) {
          console.log("Contract is already verified!");
        } else if (error.message.includes("Compilation failed")) {
          console.error(
            "Compilation error. Ensure all contracts are compiled."
          );
        } else {
          console.error("Verification failed:", error);
          process.exit(1);
        }
      }
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
