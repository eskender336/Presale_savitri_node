/**
 * Deploy Private Sale Distribution contract
 * 
 * Usage:
 *   node scripts/deploy-airdrop.js [--network localhost]
 */

const hre = require("hardhat");
require("dotenv").config();

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const net = await hre.ethers.provider.getNetwork();
  
  console.log("========================================");
  console.log("PRIVATE SALE DISTRIBUTION DEPLOYMENT");
  console.log("========================================");
  console.log("Network:", net.chainId, net.name || "");
  console.log("Deployer:", deployer.address);
  console.log("Account balance:", hre.ethers.utils.formatEther(await deployer.getBalance()), net.chainId === 56 ? "BNB" : "ETH");
  console.log("========================================\n");

  // Get Safe address from env
  const SAFE_ADDRESS = process.env.SAFE_ADDRESS;
  if (!SAFE_ADDRESS || !hre.ethers.utils.isAddress(SAFE_ADDRESS)) {
    throw new Error("SAFE_ADDRESS not set or invalid in .env file. Set it to your Gnosis Safe address.");
  }
  console.log("Safe Address:", SAFE_ADDRESS);
  console.log("⚠️  IMPORTANT: PrivateSaleDistribution owner will be set to Safe address for multisig control!\n");

  // Get token address
  const TOKEN_ADDRESS = process.env.NEXT_PUBLIC_SAVITRI_COIN_ADDRESS || 
                        process.env.SAVITRI_COIN_ADDRESS;
  
  if (!TOKEN_ADDRESS) {
    throw new Error("Token address not set in .env (NEXT_PUBLIC_SAVITRI_COIN_ADDRESS or SAVITRI_COIN_ADDRESS)");
  }

  console.log("Token address:", TOKEN_ADDRESS);

  // Gas overrides
  const GAS_PRICE_GWEI = process.env.GAS_PRICE_GWEI || "10";
  const GAS_LIMIT = parseInt(process.env.GAS_LIMIT || "6000000", 10);
  const overrides = {
    gasPrice: hre.ethers.utils.parseUnits(GAS_PRICE_GWEI, "gwei"),
    gasLimit: GAS_LIMIT,
  };

  // Deploy Private Sale Distribution contract
  console.log("\n📦 Deploying Private Sale Distribution contract...");
  const PrivateSaleDistribution = await hre.ethers.getContractFactory("PrivateSaleDistribution");
  const privateSaleDistribution = await PrivateSaleDistribution.deploy(TOKEN_ADDRESS, SAFE_ADDRESS, overrides);
  await privateSaleDistribution.deployed();
  
  // Verify owner
  const owner = await privateSaleDistribution.owner();
  console.log("✅ Private Sale Distribution deployed @", privateSaleDistribution.address);
  console.log("   Owner:", owner);
  if (owner.toLowerCase() === SAFE_ADDRESS.toLowerCase()) {
    console.log("   ✓ Owner is Safe address - multisig control enabled!");
  } else {
    console.log("   ⚠️  Owner mismatch! Expected Safe, got:", owner);
  }
  console.log("");

  // Load merkle root if exists
  const fs = require('fs');
  let merkleRoot = null;
  
  if (fs.existsSync('merkle-root.json')) {
    const merkleData = JSON.parse(fs.readFileSync('merkle-root.json', 'utf8'));
    merkleRoot = merkleData.merkleRoot;
    console.log("📋 Found merkle root:", merkleRoot);
    console.log("⚠️  Note: setMerkleRoot() must be executed via Safe multisig after deployment");
    console.log("   (Owner is Safe address, so direct calls from deployer will fail)");
  } else {
    console.log("⚠️  merkle-root.json not found");
    console.log("   Run: node scripts/generate-merkle-tree.js");
    console.log("   Then set merkle root via Safe: privateSaleDistribution.setMerkleRoot(root)");
  }

  // Summary
  console.log("\n========================================");
  console.log("DEPLOYMENT SUMMARY");
  console.log("========================================");
  console.log("Private Sale Distribution Address:", privateSaleDistribution.address);
  console.log("Token Address:", TOKEN_ADDRESS);
  console.log("Owner:", await privateSaleDistribution.owner(), "(Safe address - multisig controlled)");
  if (merkleRoot) {
    console.log("Merkle Root:", merkleRoot);
  }
  console.log("========================================");

  console.log("\n📋 Next steps:");
  console.log("1. Verify contract on block explorer");
  console.log("2. Transfer tokens to private sale distribution contract:");
  console.log(`   (Execute via Safe) token.transfer("${privateSaleDistribution.address}", amount)`);
  if (!merkleRoot) {
    console.log("3. Generate merkle tree:");
    console.log("   node scripts/generate-merkle-tree.js");
    console.log("4. Set merkle root (execute via Safe):");
    console.log(`   privateSaleDistribution.setMerkleRoot(root)`);
  }
  console.log(`${merkleRoot ? "3" : "5"}. Send tokens to participants (execute via Safe):`);
  console.log("   privateSaleDistribution.batchSend(recipients, amounts, proofs)");
  console.log("   or");
  console.log("   privateSaleDistribution.batchSendDirect(recipients, amounts)");
  console.log("\n⚠️  All admin functions must be executed via Safe multisig!");

  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    privateSaleDistributionAddress: privateSaleDistribution.address,
    tokenAddress: TOKEN_ADDRESS,
    owner: await privateSaleDistribution.owner(),
    safeAddress: SAFE_ADDRESS,
    merkleRoot: merkleRoot || "NOT_SET",
    deployedAt: new Date().toISOString(),
  };

  fs.writeFileSync(
    'private-sale-distribution-deployment.json',
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log("\n✅ Deployment info saved to: private-sale-distribution-deployment.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

