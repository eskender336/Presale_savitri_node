const hre = require("hardhat");

async function main() {
  // Temporarily disable viaIR for verification
  const solidityConfig = hre.config.solidity;
  const originalViaIR = solidityConfig.settings?.viaIR;
  if (solidityConfig.settings) {
    solidityConfig.settings.viaIR = false;
  }
  
  const contractAddress = "0xbfF00512c08477E9c03DE507fCD5C9b087fe6813";
  
  console.log("Verifying SavitriCoin at:", contractAddress);
  console.log("Network: BSC (trying without viaIR)");
  
  try {
    await hre.run("verify:verify", {
      address: contractAddress,
      constructorArguments: [],
    });
    console.log("✅ Contract verified successfully!");
  } catch (error) {
    // Restore original setting
    hre.config.solidity.settings.viaIR = originalViaIR;
    
    if (error.message.includes("Already Verified")) {
      console.log("✅ Contract is already verified!");
    } else {
      console.error("❌ Verification failed:", error.message);
      console.log("\nTry using Standard JSON Input on BSCScan web form instead.");
    }
  }
  
  // Restore original setting
  hre.config.solidity.settings.viaIR = originalViaIR;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

