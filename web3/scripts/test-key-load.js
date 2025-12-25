// Quick test to verify private key is loaded correctly
const hre = require("hardhat");

async function main() {
  try {
    const [signer] = await hre.ethers.getSigners();
    console.log("✅ Private key loaded successfully!");
    console.log("Deployer address:", signer.address);
    console.log("Network:", (await hre.ethers.provider.getNetwork()).chainId);
  } catch (error) {
    console.error("❌ Error loading private key:", error.message);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

