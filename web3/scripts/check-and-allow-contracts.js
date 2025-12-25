// scripts/check-and-allow-contracts.js
// Check if TokenICO and PrivateSaleDistribution are in allowedSenders
// Generate Safe transaction to allow both if needed
//
// Usage:
//   npx hardhat run scripts/check-and-allow-contracts.js --network bsc

const hre = require("hardhat");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const SAVITRI_COIN_ADDRESS = "0xbfF00512c08477E9c03DE507fCD5C9b087fe6813";
const TOKEN_ICO_ADDRESS = "0x0D3aC358121Ed8e23f80dA496a5CcBBD2b209262";
const PRIVATE_SALE_ADDRESS = "0x20d62B0659C25CF27D168E9635234179B22e10A7";
const SAFE_ADDRESS = "0xbC08bF77697271F1617728c7Cd049b596d13b3ba";

async function main() {
  console.log("========================================");
  console.log("CHECK AND ALLOW CONTRACTS");
  console.log("========================================");
  console.log("");

  // Get provider and signer
  const [deployer] = await hre.ethers.getSigners();
  const provider = deployer.provider;

  // Get token contract
  const tokenABI = [
    "function transfersEnabled() view returns (bool)",
    "function allowedSenders(address) view returns (bool)",
    "function owner() view returns (address)"
  ];
  const token = new hre.ethers.Contract(SAVITRI_COIN_ADDRESS, tokenABI, provider);

  // Check current state
  const transfersEnabled = await token.transfersEnabled();
  const tokenICOAllowed = await token.allowedSenders(TOKEN_ICO_ADDRESS);
  const privateSaleAllowed = await token.allowedSenders(PRIVATE_SALE_ADDRESS);
  const tokenOwner = await token.owner();

  console.log("Token Address:", SAVITRI_COIN_ADDRESS);
  console.log("Token Owner:", tokenOwner);
  console.log("Transfers Enabled:", transfersEnabled);
  console.log("");
  console.log("TokenICO Address:", TOKEN_ICO_ADDRESS);
  console.log("  Allowed:", tokenICOAllowed);
  console.log("");
  console.log("PrivateSaleDistribution Address:", PRIVATE_SALE_ADDRESS);
  console.log("  Allowed:", privateSaleAllowed);
  console.log("");

  // If transfers are enabled, no need to allow
  if (transfersEnabled) {
    console.log("✅ Transfers are enabled globally - no need to set allowedSenders");
    return;
  }

  // Check which contracts need to be allowed
  const needsTokenICO = !tokenICOAllowed;
  const needsPrivateSale = !privateSaleAllowed;

  if (!needsTokenICO && !needsPrivateSale) {
    console.log("✅ Both contracts are already in allowedSenders");
    return;
  }

  // Generate Safe transaction
  const tokenABIForEncoding = [
    "function setAllowedSender(address user, bool allowed)"
  ];
  const tokenContract = new hre.ethers.Contract(SAVITRI_COIN_ADDRESS, tokenABIForEncoding);

  const transactions = [];

  if (needsTokenICO) {
    console.log("⚠️  TokenICO needs to be added to allowedSenders");
    const functionData = tokenContract.interface.encodeFunctionData(
      "setAllowedSender",
      [TOKEN_ICO_ADDRESS, true]
    );
    transactions.push({
      to: hre.ethers.utils.getAddress(SAVITRI_COIN_ADDRESS),
      value: "0",
      data: functionData,
      contractMethod: {
        inputs: [
          { name: "user", type: "address", internalType: "address" },
          { name: "allowed", type: "bool", internalType: "bool" }
        ],
        name: "setAllowedSender",
        payable: false
      },
      contractInputsValues: {
        user: hre.ethers.utils.getAddress(TOKEN_ICO_ADDRESS),
        allowed: "true"
      },
      operation: 0  // CALL
    });
  }

  if (needsPrivateSale) {
    console.log("⚠️  PrivateSaleDistribution needs to be added to allowedSenders");
    const functionData = tokenContract.interface.encodeFunctionData(
      "setAllowedSender",
      [PRIVATE_SALE_ADDRESS, true]
    );
    transactions.push({
      to: hre.ethers.utils.getAddress(SAVITRI_COIN_ADDRESS),
      value: "0",
      data: functionData,
      contractMethod: {
        inputs: [
          { name: "user", type: "address", internalType: "address" },
          { name: "allowed", type: "bool", internalType: "bool" }
        ],
        name: "setAllowedSender",
        payable: false
      },
      contractInputsValues: {
        user: hre.ethers.utils.getAddress(PRIVATE_SALE_ADDRESS),
        allowed: "true"
      },
      operation: 0  // CALL
    });
  }

  if (transactions.length === 0) {
    console.log("✅ No transactions needed");
    return;
  }

  // Create Safe transaction JSON
  const transaction = {
    version: "1.0",
    chainId: "56",
    createdAt: Date.now(),
    meta: {
      name: "Allow Contracts to Send Tokens",
      description: `Allow ${needsTokenICO ? "TokenICO" : ""}${needsTokenICO && needsPrivateSale ? " and " : ""}${needsPrivateSale ? "PrivateSaleDistribution" : ""} to send SAV tokens`,
      txBuilderVersion: "1.16.2",
      createdFromSafeAddress: hre.ethers.utils.getAddress(SAFE_ADDRESS),
      checksum: ""
    },
    transactions: transactions
  };

  // Save to file
  const outputPath = path.join(__dirname, "../safe-transactions/allow-both-contracts.json");
  fs.writeFileSync(outputPath, JSON.stringify(transaction, null, 2));

  console.log("");
  console.log("✅ Safe transaction generated!");
  console.log("");
  console.log("File:", outputPath);
  console.log("");
  console.log("This transaction will:");
  if (needsTokenICO) {
    console.log("  - Allow TokenICO to send tokens");
  }
  if (needsPrivateSale) {
    console.log("  - Allow PrivateSaleDistribution to send tokens");
  }
  console.log("");
  console.log("Next steps:");
  console.log("1. Go to https://app.safe.global/");
  console.log("2. Connect your Safe wallet");
  console.log("3. Import the transaction from:", outputPath);
  console.log("4. Review and sign the transaction");
  console.log("5. Execute after getting required signatures");
  console.log("");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error.message);
    process.exit(1);
  });

