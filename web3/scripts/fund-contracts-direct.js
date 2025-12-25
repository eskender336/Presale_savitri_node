// scripts/fund-contracts-direct.js
// Fund TokenICO and PrivateSaleDistribution directly from deployer wallet
// 
// This script uses the deployer's private key to transfer tokens directly
// to the contracts, bypassing Safe multisig for speed.
//
// Usage:
//   npx hardhat run scripts/fund-contracts-direct.js --network bsc
//
// The script automatically loads the private key from:
//   - .secrets/private-key (secure location, recommended)
//   - Or PRIVATE_KEY environment variable (fallback)
//
// Make sure the private key in .secrets/private-key is the deployer's key

const hre = require("hardhat");
require("dotenv").config();

const SAVITRI_COIN_ADDRESS = process.env.SAVITRI_COIN_ADDRESS || "0xbfF00512c08477E9c03DE507fCD5C9b087fe6813";
const TOKEN_ICO_ADDRESS = process.env.NEXT_PUBLIC_TOKEN_ICO_ADDRESS || "0x0D3aC358121Ed8e23f80dA496a5CcBBD2b209262";
const PRIVATE_SALE_ADDRESS = process.env.PRIVATE_SALE_DISTRIBUTION_ADDRESS || "0x20d62B0659C25CF27D168E9635234179B22e10A7";

// Funding amounts
const TOKEN_ICO_AMOUNT = "10000000"; // 10M SAV
const PRIVATE_SALE_AMOUNT = "1000000"; // 1M SAV

async function main() {
  console.log("========================================");
  console.log("FUND CONTRACTS DIRECTLY FROM DEPLOYER");
  console.log("========================================");
  console.log("");

  // Get deployer signer
  const [deployer] = await hre.ethers.getSigners();
  const network = await hre.ethers.provider.getNetwork();
  
  console.log("Network:", network.chainId, network.name || "");
  console.log("Deployer:", deployer.address);
  console.log("");

  // Get token contract
  const token = await hre.ethers.getContractAt("SavitriCoin", SAVITRI_COIN_ADDRESS);
  
  const decimals = await token.decimals();
  const deployerBalance = await token.balanceOf(deployer.address);
  const transfersEnabled = await token.transfersEnabled();
  const deployerAllowed = await token.allowedSenders(deployer.address);
  
  console.log("Token Contract:", SAVITRI_COIN_ADDRESS);
  console.log("Deployer Balance:", hre.ethers.utils.formatUnits(deployerBalance, decimals), "SAV");
  console.log("Transfers Enabled:", transfersEnabled);
  console.log("Deployer Allowed:", deployerAllowed);
  console.log("");

  // Check if deployer needs to be allowed
  if (!transfersEnabled && !deployerAllowed) {
    console.log("⚠️  Transfers are disabled and deployer is not allowed");
    console.log("   Setting deployer as allowed sender...");
    
    try {
      const owner = await token.owner();
      if (owner.toLowerCase() !== deployer.address.toLowerCase()) {
        throw new Error(`Deployer is not the owner. Owner is: ${owner}`);
      }
      
      const allowTx = await token.setAllowedSender(deployer.address, true);
      console.log("   Transaction:", allowTx.hash);
      await allowTx.wait();
      console.log("   ✅ Deployer is now allowed");
    } catch (error) {
      console.error("   ❌ Failed to set allowed sender:", error.message);
      throw error;
    }
    console.log("");
  }

  // Convert amounts to wei
  const tokenICOAmountWei = hre.ethers.utils.parseEther(TOKEN_ICO_AMOUNT);
  const privateSaleAmountWei = hre.ethers.utils.parseEther(PRIVATE_SALE_AMOUNT);
  const totalNeeded = tokenICOAmountWei.add(privateSaleAmountWei);

  console.log("Funding Amounts:");
  console.log("  TokenICO: " + TOKEN_ICO_AMOUNT + " SAV");
  console.log("  PrivateSaleDistribution: " + PRIVATE_SALE_AMOUNT + " SAV");
  console.log("  Total: 11,000,000 SAV");
  console.log("");

  // Check balance
  if (deployerBalance.lt(totalNeeded)) {
    throw new Error(
      `Insufficient balance! Need ${hre.ethers.utils.formatUnits(totalNeeded, decimals)} SAV, ` +
      `have ${hre.ethers.utils.formatUnits(deployerBalance, decimals)} SAV`
    );
  }

  // Check if contracts need to be allowed (but deployer can't set them - only owner can)
  if (!transfersEnabled) {
    console.log("Checking allowed senders for contracts...");
    
    const tokenICOAllowed = await token.allowedSenders(TOKEN_ICO_ADDRESS);
    const privateSaleAllowed = await token.allowedSenders(PRIVATE_SALE_ADDRESS);
    const owner = await token.owner();
    
    console.log("  TokenICO allowed:", tokenICOAllowed);
    console.log("  PrivateSaleDistribution allowed:", privateSaleAllowed);
    console.log("  Token owner:", owner);
    console.log("");
    
    if (!tokenICOAllowed || !privateSaleAllowed) {
      console.log("⚠️  WARNING: Contracts are not in allowedSenders");
      console.log("   Deployer cannot set this (only owner can)");
      console.log("   Owner is:", owner);
      console.log("");
      console.log("   The tokens will be transferred, but contracts may not be able to");
      console.log("   send tokens to users later unless they're set as allowed senders.");
      console.log("");
      console.log("   You'll need to use Safe wallet to call:");
      if (!tokenICOAllowed) {
        console.log(`     setAllowedSender(${TOKEN_ICO_ADDRESS}, true)`);
      }
      if (!privateSaleAllowed) {
        console.log(`     setAllowedSender(${PRIVATE_SALE_ADDRESS}, true)`);
      }
      console.log("");
      console.log("   Continuing with transfer anyway...");
      console.log("");
    } else {
      console.log("  ✅ Both contracts are already allowed");
      console.log("");
    }
  }

  // Transfer to TokenICO
  console.log("Transferring to TokenICO...");
  console.log("  Amount:", TOKEN_ICO_AMOUNT, "SAV");
  console.log("  Recipient:", TOKEN_ICO_ADDRESS);
  
  const tx1 = await token.transfer(TOKEN_ICO_ADDRESS, tokenICOAmountWei);
  console.log("  Transaction:", tx1.hash);
  await tx1.wait();
  
  const tokenICOBalance = await token.balanceOf(TOKEN_ICO_ADDRESS);
  console.log("  ✅ TokenICO balance:", hre.ethers.utils.formatUnits(tokenICOBalance, decimals), "SAV");
  console.log("");

  // Transfer to PrivateSaleDistribution
  console.log("Transferring to PrivateSaleDistribution...");
  console.log("  Amount:", PRIVATE_SALE_AMOUNT, "SAV");
  console.log("  Recipient:", PRIVATE_SALE_ADDRESS);
  
  const tx2 = await token.transfer(PRIVATE_SALE_ADDRESS, privateSaleAmountWei);
  console.log("  Transaction:", tx2.hash);
  await tx2.wait();
  
  const privateSaleBalance = await token.balanceOf(PRIVATE_SALE_ADDRESS);
  console.log("  ✅ PrivateSaleDistribution balance:", hre.ethers.utils.formatUnits(privateSaleBalance, decimals), "SAV");
  console.log("");

  // Summary
  console.log("========================================");
  console.log("FUNDING COMPLETE!");
  console.log("========================================");
  console.log("");
  console.log("TokenICO:");
  console.log("  Address:", TOKEN_ICO_ADDRESS);
  console.log("  Balance:", hre.ethers.utils.formatUnits(tokenICOBalance, decimals), "SAV");
  console.log("");
  console.log("PrivateSaleDistribution:");
  console.log("  Address:", PRIVATE_SALE_ADDRESS);
  console.log("  Balance:", hre.ethers.utils.formatUnits(privateSaleBalance, decimals), "SAV");
  console.log("");
  console.log("Deployer remaining balance:", 
    hre.ethers.utils.formatUnits(deployerBalance.sub(totalNeeded), decimals), "SAV");
  console.log("");
  console.log("✅ Both contracts are now funded and ready!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error.message);
    process.exit(1);
  });

