const hre = require("hardhat");

async function main() {
  const contractAddress = "0x0D3aC358121Ed8e23f80dA496a5CcBBD2b209262";
  
  // Get network from command line or default to bsc
  const networkName = process.env.HARDHAT_NETWORK || process.argv[2] || "bsc";
  
  console.log("Verifying TokenICO at:", contractAddress);
  console.log("Network:", networkName);
  
  // Check if contract exists on this network
  const provider = hre.ethers.provider;
  const code = await provider.getCode(contractAddress);
  if (code === "0x") {
    console.error(`❌ No contract found at ${contractAddress} on network ${networkName}`);
    console.error("   Make sure you're connected to the correct network (BSC mainnet)");
    process.exit(1);
  }
  
  // Get the owner address from the contract
  const tokenICO = await hre.ethers.getContractAt("TokenICO", contractAddress);
  const owner = await tokenICO.owner();
  console.log("Contract owner:", owner);
  
  // Try with owner address as constructor argument
  // TokenICO constructor: constructor(address _owner)
  // If _owner is address(0), it uses msg.sender
  // Let's try both: the actual owner address and address(0)
  
  const constructorArgs = [owner];
  
  console.log("Constructor arguments:", constructorArgs);
  console.log("\nAttempting verification...");
  
  try {
    await hre.run("verify:verify", {
      address: contractAddress,
      constructorArguments: constructorArgs,
    });
    console.log("✅ Contract verified successfully!");
  } catch (error) {
    if (error.message.includes("Already Verified")) {
      console.log("✅ Contract is already verified!");
    } else {
      console.error("❌ Verification failed:", error.message);
      console.log("\nTrying with address(0) as constructor argument...");
      
      // Try with address(0) - means it used msg.sender
      try {
        await hre.run("verify:verify", {
          address: contractAddress,
          constructorArguments: [hre.ethers.constants.AddressZero],
        });
        console.log("✅ Contract verified successfully with address(0)!");
      } catch (error2) {
        console.error("❌ Verification failed with address(0):", error2.message);
        console.log("\n💡 Try using Standard JSON Input on BSCScan web interface");
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

