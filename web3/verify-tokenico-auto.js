const hre = require("hardhat");

async function main() {
  const contractAddress = "0x0D3aC358121Ed8e23f80dA496a5CcBBD2b209262";
  const SAFE_ADDRESS = "0xbC08bF77697271F1617728c7Cd049b596d13b3ba";
  
  // Library addresses
  const libraryAddresses = {
    PriceCalculationLibrary: "0x5D56a3c8C762ebE3cb407D0Be5FA874c18d5a28f",
    StakingLibrary: "0x48F0E906c2f518d340398Eb825678ACB509bcC47",
  };
  
  console.log("🔍 Verifying TokenICO contract automatically...");
  console.log("Address:", contractAddress);
  console.log("Network: BSC");
  console.log("");
  
  // Check network connection
  try {
    const network = await hre.ethers.provider.getNetwork();
    console.log("Connected to network:", network.chainId, network.name);
    
    const code = await hre.ethers.provider.getCode(contractAddress);
    if (code === "0x" || code.length < 10) {
      console.error("❌ Contract not found at this address on current network");
      console.error("   Make sure you're connected to BSC mainnet (chainId: 56)");
      process.exit(1);
    }
    console.log("✅ Contract found on-chain");
    console.log("");
  } catch (error) {
    console.error("❌ Network connection error:", error.message);
    process.exit(1);
  }
  
  // Try verification with libraries
  console.log("Attempting verification with libraries...");
  try {
    // First, get the contract factory with libraries linked
    const TokenICO = await hre.ethers.getContractFactory("TokenICO", {
      libraries: libraryAddresses,
    });
    
    // Verify with constructor argument and libraries
    await hre.run("verify:verify", {
      address: contractAddress,
      constructorArguments: [SAFE_ADDRESS],
      libraries: libraryAddresses,
    });
    
    console.log("\n✅✅✅ SUCCESS! TokenICO contract verified! ✅✅✅");
    console.log(`   View at: https://bscscan.com/address/${contractAddress}#code`);
    return;
  } catch (error) {
    if (error.message.includes("Already Verified")) {
      console.log("\n✅ Contract is already verified!");
      console.log(`   View at: https://bscscan.com/address/${contractAddress}#code`);
      return;
    }
    
    console.log("❌ Verification with libraries failed:", error.message.substring(0, 200));
    console.log("\n💡 Note: If libraries are already linked in bytecode, try flattened file on BSCScan");
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Automatic verification failed");
    console.error("Error:", error.message);
    console.log("\n💡 Use TokenICO_flattened.sol on BSCScan web interface instead");
    console.log("   See TOKENICO_VERIFICATION_GUIDE.md for instructions");
    process.exit(1);
  });

