const hre = require("hardhat");

async function main() {
  const contractAddress = "0x0D3aC358121Ed8e23f80dA496a5CcBBD2b209262";
  const SAFE_ADDRESS = "0xbC08bF77697271F1617728c7Cd049b596d13b3ba"; // From FUNDING_README.md
  
  // Library addresses from generate-sale-token-tx.js
  const libraryAddresses = {
    PriceCalculationLibrary: "0x5D56a3c8C762ebE3cb407D0Be5FA874c18d5a28f",
    StakingLibrary: "0x48F0E906c2f518d340398Eb825678ACB509bcC47",
  };
  
  console.log("Verifying TokenICO at:", contractAddress);
  console.log("Network: BSC");
  console.log("Constructor argument (owner):", SAFE_ADDRESS);
  console.log("Libraries:", libraryAddresses);
  console.log("");
  
  try {
    // Get contract factory with libraries
    const TokenICO = await hre.ethers.getContractFactory("TokenICO", {
      libraries: libraryAddresses,
    });
    
    // Verify with constructor argument
    await hre.run("verify:verify", {
      address: contractAddress,
      constructorArguments: [SAFE_ADDRESS],
      libraries: libraryAddresses,
    });
    
    console.log("✅ Contract verified successfully!");
  } catch (error) {
    if (error.message.includes("Already Verified")) {
      console.log("✅ Contract is already verified!");
    } else {
      console.error("❌ Verification failed:", error.message);
      console.log("\n💡 Try using TokenICO_flattened.sol on BSCScan web interface");
      console.log("   Constructor argument:", SAFE_ADDRESS);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

