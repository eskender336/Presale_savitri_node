/**
 * Private Sale Distribution script for use with Gnosis Safe
 * 
 * This script creates Safe transactions that need to be signed and executed
 * through the Gnosis Safe interface (app.safe.global)
 * 
 * Usage:
 * 1. Run this script to generate transaction data
 * 2. Copy the transaction data
 * 3. Go to app.safe.global
 * 4. Create new transaction with the data
 * 5. Get 3+ signatures from Safe owners
 * 6. Execute the transaction
 */

const hre = require("hardhat");
const fs = require("fs");
const csv = require("csv-parser");
require("dotenv").config();

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Using account:", deployer.address);

  // Get contract addresses from env
  const TOKEN_ICO_ADDRESS = process.env.NEXT_PUBLIC_TOKEN_ICO_ADDRESS;
  const SAFE_ADDRESS = process.env.SAFE_ADDRESS;

  if (!TOKEN_ICO_ADDRESS) {
    throw new Error("NEXT_PUBLIC_TOKEN_ICO_ADDRESS not set in .env");
  }

  if (!SAFE_ADDRESS) {
    throw new Error("SAFE_ADDRESS not set in .env");
  }

  console.log("TokenICO address:", TOKEN_ICO_ADDRESS);
  console.log("Safe address:", SAFE_ADDRESS);

  // Load TokenICO contract
  const TokenICO = await hre.ethers.getContractFactory("TokenICO");
  const tokenICO = TokenICO.attach(TOKEN_ICO_ADDRESS);

  // Read CSV file
  const recipients = [];
  const amounts = [];
  const reasons = [];

  return new Promise((resolve, reject) => {
    fs.createReadStream("token-balances.csv")
      .pipe(csv())
      .on("data", (row) => {
        const address = row.address || row.Address || row.ADDRESS;
        const amount = row.amount || row.Amount || row.AMOUNT;
        const reason = row.reason || row.Reason || "Airdrop";

        if (address && amount) {
          recipients.push(address);
          // Convert amount to wei (assuming 18 decimals)
          amounts.push(hre.ethers.utils.parseEther(amount));
          reasons.push(reason);
        }
      })
      .on("end", async () => {
        console.log(`\nFound ${recipients.length} recipients`);

        // Split into batches of MAX_BATCH_SIZE (100)
        const MAX_BATCH_SIZE = 100;
        const batches = [];

        for (let i = 0; i < recipients.length; i += MAX_BATCH_SIZE) {
          const batchRecipients = recipients.slice(i, i + MAX_BATCH_SIZE);
          const batchAmounts = amounts.slice(i, i + MAX_BATCH_SIZE);
          const batchReasons = reasons.slice(i, i + MAX_BATCH_SIZE);

          batches.push({
            recipients: batchRecipients,
            amounts: batchAmounts,
            reasons: batchReasons,
            batchNumber: Math.floor(i / MAX_BATCH_SIZE) + 1,
          });
        }

        console.log(`Split into ${batches.length} batches\n`);

        // Generate transaction data for each batch
        const transactions = [];

        for (const batch of batches) {
          // Encode function call
          const functionData = tokenICO.interface.encodeFunctionData(
            "distributePrivateSaleBatch",
            [batch.recipients, batch.amounts, batch.reasons]
          );

          const transaction = {
            to: TOKEN_ICO_ADDRESS,
            value: "0",
            data: functionData,
            operation: 0, // 0 = call, 1 = delegatecall
            batchNumber: batch.batchNumber,
            recipientsCount: batch.recipients.length,
            totalAmount: batch.amounts.reduce((sum, amt) => sum.add(amt), hre.ethers.BigNumber.from(0)),
          };

          transactions.push(transaction);

          console.log(`Batch ${batch.batchNumber}:`);
          console.log(`  Recipients: ${batch.recipients.length}`);
          console.log(`  Total amount: ${hre.ethers.utils.formatEther(transaction.totalAmount)} tokens`);
          console.log(`  Transaction data length: ${functionData.length} bytes\n`);
        }

        // Save transactions to file
        const output = {
          safeAddress: SAFE_ADDRESS,
          tokenICOAddress: TOKEN_ICO_ADDRESS,
          totalBatches: batches.length,
          totalRecipients: recipients.length,
          transactions: transactions.map((tx, index) => ({
            batchNumber: tx.batchNumber,
            to: tx.to,
            value: tx.value,
            data: tx.data,
            operation: tx.operation,
            recipientsCount: tx.recipientsCount,
            totalAmount: hre.ethers.utils.formatEther(tx.totalAmount),
          })),
        };

        fs.writeFileSync(
          "safe-transactions.json",
          JSON.stringify(output, null, 2)
        );

        console.log("✅ Transaction data saved to safe-transactions.json");
        console.log("\n📋 Next steps:");
        console.log("1. Go to https://app.safe.global/");
        console.log("2. Connect your Safe wallet");
        console.log("3. Click 'New transaction' → 'Contract interaction'");
        console.log("4. Paste the 'to' address and 'data' from safe-transactions.json");
        console.log("5. Review and create transaction");
        console.log("6. Get 3+ signatures from Safe owners");
        console.log("7. Execute the transaction");
        console.log("\n💡 Tip: You can use Safe's batch transaction feature");
        console.log("   to execute multiple batches in one transaction!");

        resolve();
      })
      .on("error", reject);
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

