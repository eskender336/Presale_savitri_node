// scripts/allow-private-sale-contract.js
// Generate Safe transaction to allow PrivateSaleDistribution contract to send tokens
//
// Usage:
//   npx hardhat run scripts/allow-private-sale-contract.js --network bsc

const hre = require("hardhat");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

// Hardcode addresses to avoid env parsing issues
const SAVITRI_COIN_ADDRESS = "0xbfF00512c08477E9c03DE507fCD5C9b087fe6813";
const PRIVATE_SALE_ADDRESS = "0x20d62B0659C25CF27D168E9635234179B22e10A7";
const SAFE_ADDRESS = "0xbC08bF77697271F1617728c7Cd049b596d13b3ba";

async function main() {
  console.log("========================================");
  console.log("GENERATE SAFE TRANSACTION");
  console.log("Allow PrivateSaleDistribution Contract");
  console.log("========================================");
  console.log("");

  // Get contract interface
  const token = await hre.ethers.getContractAt(
    "@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20",
    SAVITRI_COIN_ADDRESS
  );

  // Actually, we need the SavitriCoin contract, not IERC20
  // Let's use the ABI directly
  const tokenABI = [
    "function setAllowedSender(address user, bool allowed)"
  ];
  const tokenContract = new hre.ethers.Contract(SAVITRI_COIN_ADDRESS, tokenABI);

  // Encode the function call
  const functionData = tokenContract.interface.encodeFunctionData(
    "setAllowedSender",
    [PRIVATE_SALE_ADDRESS, true]
  );

  // Create Safe transaction JSON
  const cleanSafeAddress = hre.ethers.utils.getAddress(SAFE_ADDRESS);
  const cleanPrivateSaleAddress = hre.ethers.utils.getAddress(PRIVATE_SALE_ADDRESS);
  const cleanTokenAddress = hre.ethers.utils.getAddress(SAVITRI_COIN_ADDRESS);

  const transaction = {
    version: "1.0",
    chainId: "56",
    createdAt: Date.now(),
    meta: {
      name: "Allow PrivateSaleDistribution Contract",
      description: `Allow PrivateSaleDistribution contract (${cleanPrivateSaleAddress}) to send SAV tokens`,
      txBuilderVersion: "1.16.2",
      createdFromSafeAddress: cleanSafeAddress,
      checksum: ""
    },
    transactions: [
      {
        to: cleanTokenAddress,
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
          user: cleanPrivateSaleAddress,
          allowed: "true"
        },
        operation: 0  // CALL
      }
    ]
  };

  // Save to file
  const outputPath = path.join(__dirname, "../safe-transactions/allow-private-sale-contract.json");
  fs.writeFileSync(outputPath, JSON.stringify(transaction, null, 2));

  console.log("✅ Safe transaction generated!");
  console.log("");
  console.log("File:", outputPath);
  console.log("");
  console.log("Next steps:");
  console.log("1. Go to https://app.safe.global/");
  console.log("2. Connect your Safe wallet");
  console.log("3. Import the transaction from:", outputPath);
  console.log("4. Review and sign the transaction");
  console.log("5. Execute after getting required signatures");
  console.log("");
  console.log("After this transaction is executed, you can run:");
  console.log("  npx hardhat run scripts/distribute-private-sale-from-contract.js --network bsc");
  console.log("");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error.message);
    process.exit(1);
  });

