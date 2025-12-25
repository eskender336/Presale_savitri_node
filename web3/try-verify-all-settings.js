const hre = require("hardhat");

async function main() {
  const contractAddress = "0xbfF00512c08477E9c03DE507fCD5C9b087fe6813";
  
  console.log("Trying all possible compiler setting combinations...\n");
  
  const attempts = [
    { viaIR: false, runs: 0, evmVersion: "paris", desc: "No viaIR, runs 0, paris" },
    { viaIR: false, runs: 0, evmVersion: "london", desc: "No viaIR, runs 0, london" },
    { viaIR: false, runs: 200, evmVersion: "paris", desc: "No viaIR, runs 200, paris" },
    { viaIR: true, runs: 0, evmVersion: "paris", desc: "With viaIR, runs 0, paris" },
    { viaIR: true, runs: 0, evmVersion: "london", desc: "With viaIR, runs 0, london" },
  ];
  
  const originalConfig = JSON.parse(JSON.stringify(hre.config.solidity));
  
  for (const attempt of attempts) {
    console.log(`\n🔄 Trying: ${attempt.desc}`);
    
    // Modify config
    hre.config.solidity.settings = {
      optimizer: {
        enabled: true,
        runs: attempt.runs,
      },
      viaIR: attempt.viaIR,
      evmVersion: attempt.evmVersion,
      metadata: {
        bytecodeHash: "none",
      },
    };
    
    try {
      // Force recompile
      await hre.run("compile", { force: true });
      
      await hre.run("verify:verify", {
        address: contractAddress,
        constructorArguments: [],
      });
      
      console.log(`\n✅✅✅ SUCCESS! Verified with: ${attempt.desc} ✅✅✅`);
      console.log(`Settings used:`);
      console.log(`  - viaIR: ${attempt.viaIR}`);
      console.log(`  - Optimizer runs: ${attempt.runs}`);
      console.log(`  - EVM Version: ${attempt.evmVersion}`);
      return;
    } catch (error) {
      if (error.message.includes("Already Verified")) {
        console.log(`✅ Contract is already verified!`);
        return;
      } else if (error.message.includes("bytecode doesn't match")) {
        console.log(`❌ Bytecode mismatch`);
      } else {
        console.log(`❌ ${error.message.substring(0, 80)}...`);
      }
    }
  }
  
  // Restore original config
  hre.config.solidity = originalConfig;
  
  console.log("\n❌ All automatic attempts failed.");
  console.log("\n📝 Next steps:");
  console.log("   1. Use Standard JSON Input files on BSCScan web interface");
  console.log("   2. Try: savitri-standard-json-no-viair.json first");
  console.log("   3. See VERIFICATION_GUIDE.md for complete instructions");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

