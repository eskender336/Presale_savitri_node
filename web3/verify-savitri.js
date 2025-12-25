const hre = require("hardhat");

async function main() {
  const contractAddress = "0xbfF00512c08477E9c03DE507fCD5C9b087fe6813";
  
  // Get network from command line or default to bsc
  const networkName = process.env.HARDHAT_NETWORK || process.argv[2] || "bsc";
  
  console.log("Verifying SavitriCoin at:", contractAddress);
  console.log("Network:", networkName);
  
  // Check if contract exists on this network
  const provider = hre.ethers.provider;
  const code = await provider.getCode(contractAddress);
  if (code === "0x") {
    console.error(`❌ No contract found at ${contractAddress} on network ${networkName}`);
    console.error("   Make sure you're connected to the correct network (BSC mainnet)");
    process.exit(1);
  }
  
  try {
    await hre.run("verify:verify", {
      address: contractAddress,
      constructorArguments: [],
    });
    console.log("✅ Contract verified successfully!");
  } catch (error) {
    if (error.message.includes("Already Verified")) {
      console.log("✅ Contract is already verified!");
    } else {
      console.error("❌ Verification failed:", error.message);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
