/**
 * Deploy Airdrop contract
 * 
 * Usage:
 *   node scripts/deploy-airdrop.js [--network localhost]
 */

const hre = require("hardhat");
require("dotenv").config();

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying Airdrop contract with account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // Get token address
  const TOKEN_ADDRESS = process.env.NEXT_PUBLIC_SAVITRI_COIN_ADDRESS || 
                        process.env.SAVITRI_COIN_ADDRESS;
  
  if (!TOKEN_ADDRESS) {
    throw new Error("Token address not set in .env (NEXT_PUBLIC_SAVITRI_COIN_ADDRESS)");
  }

  console.log("\nToken address:", TOKEN_ADDRESS);

  // Deploy Airdrop contract
  console.log("\n📦 Deploying Airdrop contract...");
  const Airdrop = await hre.ethers.getContractFactory("Airdrop");
  const airdrop = await Airdrop.deploy(TOKEN_ADDRESS);
  await airdrop.deployed();

  console.log("✅ Airdrop deployed to:", airdrop.address);

  // Load merkle root if exists
  const fs = require('fs');
  let merkleRoot = null;
  
  if (fs.existsSync('merkle-root.json')) {
    const merkleData = JSON.parse(fs.readFileSync('merkle-root.json', 'utf8'));
    merkleRoot = merkleData.merkleRoot;
    console.log("\n📋 Found merkle root:", merkleRoot);
    
    // Set merkle root
    console.log("\n🔧 Setting merkle root...");
    const tx = await airdrop.setMerkleRoot(merkleRoot);
    await tx.wait();
    console.log("✅ Merkle root set");
  } else {
    console.log("\n⚠️  merkle-root.json not found");
    console.log("   Run: node scripts/generate-merkle-tree.js");
    console.log("   Then set merkle root: airdrop.setMerkleRoot(root)");
  }

  // Summary
  console.log("\n📊 Deployment Summary:");
  console.log("   Airdrop Address:", airdrop.address);
  console.log("   Token Address:", TOKEN_ADDRESS);
  console.log("   Owner:", deployer.address);
  if (merkleRoot) {
    console.log("   Merkle Root:", merkleRoot);
  }

  console.log("\n📋 Next steps:");
  console.log("1. Transfer tokens to airdrop contract:");
  console.log(`   token.transfer("${airdrop.address}", amount)`);
  if (!merkleRoot) {
    console.log("2. Generate merkle tree:");
    console.log("   node scripts/generate-merkle-tree.js");
    console.log("3. Set merkle root:");
    console.log(`   airdrop.setMerkleRoot(root)`);
  }
  console.log("4. (Optional) Set claim end time:");
  console.log("   airdrop.setClaimEndTime(timestamp)");
  console.log("5. Users can claim using proofs from merkle-tree-data.json");

  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    airdropAddress: airdrop.address,
    tokenAddress: TOKEN_ADDRESS,
    owner: deployer.address,
    merkleRoot: merkleRoot || "NOT_SET",
    deployedAt: new Date().toISOString(),
  };

  fs.writeFileSync(
    'airdrop-deployment.json',
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log("\n✅ Deployment info saved to: airdrop-deployment.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

