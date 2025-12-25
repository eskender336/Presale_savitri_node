// scripts/deploy-private-sale-auto.js
// DEPLOY PRIVATE SALE DISTRIBUTION WITH REGULAR OWNER (NOT MULTISIG)
// 
// This script deploys PrivateSaleDistribution with the deployer as owner.
// This allows automation scripts to send tokens without requiring multisig approval.
//
// Usage:
//   npx hardhat run scripts/deploy-private-sale-auto.js --network bsc

const hre = require("hardhat");
require("dotenv").config();

function u(v, d = 0) {
  const n = parseInt(v ?? "", 10);
  return Number.isFinite(n) ? n : d;
}

const isAddr = (x) => {
  try { return hre.ethers.utils.isAddress(x); } catch { return false; }
};

async function waitFor(txPromise, label = "tx") {
  const tx = await txPromise;
  console.log(`→ sent ${label}: ${tx.hash}`);
  const rcpt = await tx.wait(1);
  console.log(`✓ mined ${label}: block=${rcpt.blockNumber} gasUsed=${rcpt.gasUsed?.toString()}`);
  return rcpt;
}

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const net = await hre.ethers.provider.getNetwork();

  // Get SavitriCoin address from env
  const SAVITRI_COIN_ADDRESS = process.env.SAVITRI_COIN_ADDRESS;
  if (!SAVITRI_COIN_ADDRESS || !isAddr(SAVITRI_COIN_ADDRESS)) {
    throw new Error("SAVITRI_COIN_ADDRESS not set or invalid in .env file");
  }

  console.log("========================================");
  console.log("DEPLOY PRIVATE SALE DISTRIBUTION");
  console.log("========================================");
  console.log("Network:", net.chainId, net.name);
  console.log("Deployer:", deployer.address);
  console.log("SavitriCoin:", SAVITRI_COIN_ADDRESS);
  console.log("");
  console.log("⚠️  IMPORTANT: Owner will be deployer address (NOT Safe)");
  console.log("   This allows automation scripts to run without multisig approval.");
  console.log("");

  const deployerBalance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Deployer balance:", hre.ethers.utils.formatEther(deployerBalance), "BNB");
  console.log("");

  // Get SavitriCoin contract
  const savitriToken = await hre.ethers.getContractAt("SavitriCoin", SAVITRI_COIN_ADDRESS);
  console.log("✅ Using existing SavitriCoin @", SAVITRI_COIN_ADDRESS);
  console.log("   Owner:", await savitriToken.owner());
  console.log("");

  // Deploy PrivateSaleDistribution with deployer as owner
  console.log("Deploying PrivateSaleDistribution...");
  console.log("   Owner will be:", deployer.address);
  console.log("   Token:", SAVITRI_COIN_ADDRESS);
  console.log("");

  const PrivateSaleDistribution = await hre.ethers.getContractFactory("PrivateSaleDistribution");
  
  // Pass address(0) as owner to use msg.sender (deployer) as owner
  const privateSaleDistribution = await PrivateSaleDistribution.deploy(
    SAVITRI_COIN_ADDRESS,
    hre.ethers.constants.AddressZero, // address(0) = use msg.sender as owner
    { gasLimit: 2000000 }
  );
  
  await waitFor(privateSaleDistribution.deployTransaction, "PrivateSaleDistribution deploy");
  
  console.log("✅ PrivateSaleDistribution deployed @", privateSaleDistribution.address);
  console.log("   Owner:", await privateSaleDistribution.owner());
  console.log("   Token:", await privateSaleDistribution.token());
  console.log("");

  // Summary
  console.log("========================================");
  console.log("DEPLOYMENT SUMMARY");
  console.log("========================================");
  console.log("PrivateSaleDistribution:", privateSaleDistribution.address);
  console.log("  Owner:", await privateSaleDistribution.owner(), "(deployer - for automation)");
  console.log("  Token:", await privateSaleDistribution.token());
  console.log("");
  console.log("NEXT STEPS:");
  console.log("1. Fund PrivateSaleDistribution with tokens:");
  console.log(`   savitriToken.transfer(${privateSaleDistribution.address}, <amount>)`);
  console.log("2. Set Merkle root (optional, for transparency):");
  console.log(`   privateSaleDistribution.setMerkleRoot(<merkleRoot>)`);
  console.log("3. Use automation scripts to distribute tokens:");
  console.log("   - batchSend() - with Merkle validation");
  console.log("   - batchSendDirect() - without Merkle validation");
  console.log("");
  console.log("⚠️  SECURITY NOTE:");
  console.log("   Owner is deployer address, not Safe multisig.");
  console.log("   This allows automated distribution but requires secure key management.");
  console.log("   Consider using a dedicated automation wallet with limited funds.");
  console.log("========================================");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

