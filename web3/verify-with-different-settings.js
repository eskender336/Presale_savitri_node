const hre = require("hardhat");

async function main() {
  const contractAddress = "0xbfF00512c08477E9c03DE507fCD5C9b087fe6813";
  
  console.log("Trying different compiler settings...\n");
  
  // Try different combinations
  const attempts = [
    { viaIR: false, runs: 0, description: "No viaIR, runs 0" },
    { viaIR: true, runs: 0, description: "With viaIR, runs 0" },
    { viaIR: false, runs: 200, description: "No viaIR, runs 200" },
  ];
  
  const originalSettings = hre.config.solidity.settings;
  
  for (const attempt of attempts) {
    console.log(`\n🔄 Trying: ${attempt.description}`);
    
    // Temporarily modify settings
    hre.config.solidity.settings.viaIR = attempt.viaIR;
    hre.config.solidity.settings.optimizer.runs = attempt.runs;
    
    try {
      // Force recompile
      await hre.run("compile", { force: true });
      
      await hre.run("verify:verify", {
        address: contractAddress,
        constructorArguments: [],
      });
      
      console.log(`✅ SUCCESS with ${attempt.description}!`);
      return;
    } catch (error) {
      if (error.message.includes("Already Verified")) {
        console.log(`✅ Contract is already verified!`);
        return;
      } else if (error.message.includes("bytecode doesn't match")) {
        console.log(`❌ Bytecode mismatch with ${attempt.description}`);
      } else {
        console.log(`❌ Error: ${error.message.substring(0, 100)}`);
      }
    }
  }
  
  // Restore original settings
  hre.config.solidity.settings = originalSettings;
  
  console.log("\n❌ All attempts failed. The contract may have been deployed with different settings.");
  console.log("   Try using the Standard JSON Input files on BSCScan web interface.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

