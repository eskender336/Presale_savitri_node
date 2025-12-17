const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // Check if we're on Mainnet network
  const network = await hre.ethers.provider.getNetwork();
  if (network.chainId === 1) {
    // Get multisig owners from env or use deployer as default
    const getMultisigOwners = () => {
      const owners = [];
      for (let i = 0; i < 5; i++) {
        const envKey = `MULTISIG_OWNER_${i + 1}`;
        const owner = process.env[envKey];
        if (owner && hre.ethers.utils.isAddress(owner)) {
          owners.push(owner);
        } else {
          // Use deployer as default for testing
          owners.push(deployer.address);
        }
      }
      return owners;
    };
    
    // Deploy TokenICO Contract
    console.log("\nDeploying TokenICO contract...");
    const TokenICO = await hre.ethers.getContractFactory("TokenICO");
    const tokenICO = await TokenICO.deploy();

    await tokenICO.deployed();

    console.log("\nDeployment Successful!");
    console.log("------------------------");
    console.log("NEXT_PUBLIC_TOKEN_ICO_ADDRESS:", tokenICO.address);
    console.log("NEXT_PUBLIC_OWNER_ADDRESS:", deployer.address);

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
        network: "ethereum",
      });

      console.log("Contract verification successful!");
    } catch (error) {
      if (error.message.includes("Already Verified")) {
        console.log("Contract is already verified!");
      } else if (error.message.includes("Compilation failed")) {
        console.error("Compilation error. Ensure all contracts are compiled.");
      } else {
        console.error("Verification failed:", error);
        process.exit(1);
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
