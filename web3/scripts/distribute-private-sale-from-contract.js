// scripts/distribute-private-sale-from-contract.js
// Distribute tokens from PrivateSaleDistribution contract to CSV addresses
// 
// This script reads the CSV and calls batchSendDirect on the contract
// to send tokens to all recipients.
//
// Usage:
//   npx hardhat run scripts/distribute-private-sale-from-contract.js --network bsc

const hre = require("hardhat");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const CSV_PATH = process.env.CSV_PATH || path.join(__dirname, "../../data/private-sale-distribution.csv");
const PRIVATE_SALE_ADDRESS = process.env.PRIVATE_SALE_DISTRIBUTION_ADDRESS || "0x20d62B0659C25CF27D168E9635234179B22e10A7";
const BATCH_SIZE = 100; // Max recipients per batch (contract limit)

function parseCSV(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`CSV file not found: ${filePath}`);
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n').filter(line => line.trim() && !line.startsWith('#'));
  
  // Skip header line
  const dataLines = lines.slice(1);
  const data = [];
  
  for (const line of dataLines) {
    const parts = line.split(',').map(s => s.trim());
    if (parts.length < 2) continue;
    
    const address = parts[0];
    const amount = parts[1]; // Already in wei format
    
    if (address && amount && hre.ethers.utils.isAddress(address)) {
      try {
        const normalizedAddress = hre.ethers.utils.getAddress(address);
        const amountBigInt = hre.ethers.BigNumber.from(amount);
        
        data.push({
          address: normalizedAddress,
          amount: amountBigInt,
        });
      } catch (e) {
        console.warn(`Skipping invalid line: ${line} - ${e.message}`);
      }
    }
  }
  
  return data;
}

async function main() {
  console.log("========================================");
  console.log("DISTRIBUTE PRIVATE SALE TOKENS");
  console.log("========================================");
  console.log("");

  // Get deployer signer
  const [deployer] = await hre.ethers.getSigners();
  const network = await hre.ethers.provider.getNetwork();
  
  console.log("Network:", network.chainId, network.name || "");
  console.log("Deployer:", deployer.address);
  console.log("");

  // Parse CSV
  console.log("Reading CSV file:", CSV_PATH);
  const recipients = parseCSV(CSV_PATH);
  console.log(`✅ Found ${recipients.length} recipients`);
  console.log("");

  if (recipients.length === 0) {
    throw new Error("No recipients found in CSV");
  }

  // Get contract
  const privateSaleDistribution = await hre.ethers.getContractAt(
    "PrivateSaleDistribution",
    PRIVATE_SALE_ADDRESS
  );

  // Check contract owner
  const owner = await privateSaleDistribution.owner();
  console.log("Contract Owner:", owner);
  console.log("Deployer Address:", deployer.address);
  
  if (owner.toLowerCase() !== deployer.address.toLowerCase()) {
    throw new Error(
      `Deployer is not the contract owner! ` +
      `Owner: ${owner}, Deployer: ${deployer.address}`
    );
  }
  console.log("✅ Deployer is the contract owner");
  console.log("");

  // Check contract balance and transfer settings
  const tokenAddress = await privateSaleDistribution.token();
  const tokenABI = [
    "function balanceOf(address) view returns (uint256)",
    "function decimals() view returns (uint8)",
    "function transfersEnabled() view returns (bool)",
    "function allowedSenders(address) view returns (bool)",
    "function owner() view returns (address)",
    "function setAllowedSender(address, bool)"
  ];
  const token = new hre.ethers.Contract(tokenAddress, tokenABI, deployer);
  const contractBalance = await token.balanceOf(PRIVATE_SALE_ADDRESS);
  const decimals = await token.decimals();
  const transfersEnabled = await token.transfersEnabled();
  const contractAllowed = await token.allowedSenders(PRIVATE_SALE_ADDRESS);
  const tokenOwner = await token.owner();
  
  console.log("Token Address:", tokenAddress);
  console.log("Contract Balance:", hre.ethers.utils.formatUnits(contractBalance, decimals), "SAV");
  console.log("Transfers Enabled:", transfersEnabled);
  console.log("Contract Allowed:", contractAllowed);
  console.log("Token Owner:", tokenOwner);
  console.log("");
  
  // Check if contract needs to be allowed
  if (!transfersEnabled && !contractAllowed) {
    console.log("⚠️  PrivateSaleDistribution contract is not in allowedSenders!");
    console.log("   The contract needs to be allowed to send tokens.");
    console.log("");
    
    if (tokenOwner.toLowerCase() === deployer.address.toLowerCase()) {
      console.log("✅ Deployer is token owner, adding contract to allowedSenders...");
      const allowTx = await token.setAllowedSender(PRIVATE_SALE_ADDRESS, true);
      console.log("   Transaction:", allowTx.hash);
      await allowTx.wait();
      console.log("   ✅ Contract added to allowedSenders");
      console.log("");
    } else {
      throw new Error(
        `PrivateSaleDistribution contract must be in allowedSenders! ` +
        `Token owner is ${tokenOwner}, but deployer is ${deployer.address}. ` +
        `Please call setAllowedSender(${PRIVATE_SALE_ADDRESS}, true) from the token owner.`
      );
    }
  } else if (!transfersEnabled && contractAllowed) {
    console.log("✅ Contract is already in allowedSenders");
    console.log("");
  } else {
    console.log("✅ Transfers are enabled globally");
    console.log("");
  }

  // Calculate total needed
  const totalNeeded = recipients.reduce((sum, r) => sum.add(r.amount), hre.ethers.BigNumber.from(0));
  console.log("Total Needed:", hre.ethers.utils.formatUnits(totalNeeded, decimals), "SAV");
  console.log("");

  if (contractBalance.lt(totalNeeded)) {
    throw new Error(
      `Insufficient contract balance! ` +
      `Need ${hre.ethers.utils.formatUnits(totalNeeded, decimals)} SAV, ` +
      `have ${hre.ethers.utils.formatUnits(contractBalance, decimals)} SAV`
    );
  }

  // Check which recipients have already received tokens
  console.log("Checking which recipients have already received tokens...");
  const pendingRecipients = [];
  let alreadySent = 0;
  
  for (const recipient of recipients) {
    const hasReceived = await privateSaleDistribution.hasReceived(recipient.address);
    if (hasReceived) {
      alreadySent++;
    } else {
      pendingRecipients.push(recipient);
    }
  }
  
  console.log(`  Already sent: ${alreadySent}`);
  console.log(`  Pending: ${pendingRecipients.length}`);
  console.log("");

  if (pendingRecipients.length === 0) {
    console.log("✅ All recipients have already received tokens!");
    return;
  }

  // Split into batches
  const batches = [];
  for (let i = 0; i < pendingRecipients.length; i += BATCH_SIZE) {
    const batch = pendingRecipients.slice(i, i + BATCH_SIZE);
    batches.push({
      recipients: batch.map(r => r.address),
      amounts: batch.map(r => r.amount),
      batchNumber: Math.floor(i / BATCH_SIZE) + 1,
      totalBatches: Math.ceil(pendingRecipients.length / BATCH_SIZE)
    });
  }

  console.log(`📦 Split into ${batches.length} batches (max ${BATCH_SIZE} recipients per batch)`);
  console.log("");

  // Ask for confirmation (in production, you might want to add a flag to skip)
  console.log("Ready to send tokens. Batches:");
  for (const batch of batches) {
    const batchTotal = batch.amounts.reduce((sum, amt) => sum.add(amt), hre.ethers.BigNumber.from(0));
    console.log(`  Batch ${batch.batchNumber}/${batches.length}: ${batch.recipients.length} recipients, ${hre.ethers.utils.formatUnits(batchTotal, decimals)} SAV`);
  }
  console.log("");

  // Send batches
  for (const batch of batches) {
    console.log(`========================================`);
    console.log(`Sending Batch ${batch.batchNumber}/${batches.length}`);
    console.log(`========================================`);
    console.log(`Recipients: ${batch.recipients.length}`);
    
    const batchTotal = batch.amounts.reduce((sum, amt) => sum.add(amt), hre.ethers.BigNumber.from(0));
    console.log(`Total Amount: ${hre.ethers.utils.formatUnits(batchTotal, decimals)} SAV`);
    console.log(`First recipient: ${batch.recipients[0]}`);
    console.log(`Last recipient: ${batch.recipients[batch.recipients.length - 1]}`);
    console.log("");

    try {
      const tx = await privateSaleDistribution.batchSendDirect(
        batch.recipients,
        batch.amounts
      );
      console.log("Transaction:", tx.hash);
      const receipt = await tx.wait();
      console.log(`✅ Batch ${batch.batchNumber} completed! Block: ${receipt.blockNumber}`);
      console.log(`   Gas used: ${receipt.gasUsed.toString()}`);
      console.log("");

      // Small delay between batches
      if (batch.batchNumber < batches.length) {
        console.log("Waiting 3 seconds before next batch...");
        await new Promise(resolve => setTimeout(resolve, 3000));
        console.log("");
      }
    } catch (error) {
      console.error(`❌ Batch ${batch.batchNumber} failed:`, error.message);
      throw error;
    }
  }

  // Summary
  console.log("========================================");
  console.log("DISTRIBUTION COMPLETE!");
  console.log("========================================");
  console.log("");
  console.log(`Total recipients: ${recipients.length}`);
  console.log(`Batches sent: ${batches.length}`);
  console.log("");
  
  // Verify final balances
  const finalBalance = await token.balanceOf(PRIVATE_SALE_ADDRESS);
  console.log("Contract remaining balance:", hre.ethers.utils.formatUnits(finalBalance, decimals), "SAV");
  console.log("");
  console.log("✅ All tokens have been distributed!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error.message);
    process.exit(1);
  });

