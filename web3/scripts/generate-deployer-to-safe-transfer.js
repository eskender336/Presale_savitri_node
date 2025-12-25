// scripts/generate-deployer-to-safe-transfer.js
// Generate transaction for deployer to transfer tokens to Safe wallet
// 
// This is needed BEFORE executing fund-both-contracts-with-allowed.json
// because Safe needs tokens to transfer

const hre = require("hardhat");
require("dotenv").config();
const fs = require("fs");
const path = require("path");

const SAVITRI_COIN_ADDRESS = process.env.SAVITRI_COIN_ADDRESS || "0xbfF00512c08477E9c03DE507fCD5C9b087fe6813";
const SAFE_ADDRESS = process.env.SAFE_ADDRESS || "0xbC08bF77697271F1617728c7Cd049b596d13b3ba";
const DEPLOYER_ADDRESS = "0xb18006ab8d4c566f8d682d80b4f54ea5529c307d"; // From error trace

// Clean Safe address
let cleanSafeAddress = SAFE_ADDRESS;
const addressMatch = SAFE_ADDRESS.match(/0x[a-fA-F0-9]{40}/);
if (addressMatch) {
  cleanSafeAddress = addressMatch[0];
}

// Transfer amount - enough for funding + buffer
const TRANSFER_AMOUNT = "15000000"; // 15M SAV (11M needed + 4M buffer)

async function main() {
  console.log("========================================");
  console.log("GENERATE DEPLOYER TO SAFE TRANSFER");
  console.log("========================================");
  console.log("Deployer:", DEPLOYER_ADDRESS);
  console.log("Safe Address:", cleanSafeAddress);
  console.log("Token Address:", SAVITRI_COIN_ADDRESS);
  console.log("");

  // Get ERC20 token interface
  const erc20ABI = [
    "function transfer(address to, uint256 amount) returns (bool)",
    "function setAllowedSender(address user, bool allowed)"
  ];
  const tokenInterface = new hre.ethers.utils.Interface(erc20ABI);

  // Convert amount to wei
  const transferAmountWei = hre.ethers.utils.parseEther(TRANSFER_AMOUNT);

  console.log("Transfer Amount:", TRANSFER_AMOUNT, "SAV");
  console.log("In Wei:", transferAmountWei.toString());
  console.log("");

  // Encode function calls
  const transferData = tokenInterface.encodeFunctionData("transfer", [
    cleanSafeAddress,
    transferAmountWei
  ]);

  const allowDeployerData = tokenInterface.encodeFunctionData("setAllowedSender", [
    DEPLOYER_ADDRESS,
    true
  ]);

  // Create output directory
  const outputDir = path.join(__dirname, "..", "safe-transactions");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Option 1: If deployer needs to be allowed first
  const withAllowedTx = {
    version: "1.0",
    chainId: "56",
    createdAt: Date.now(),
    meta: {
      name: "Transfer Tokens from Deployer to Safe",
      description: `Set allowed sender for deployer and transfer ${TRANSFER_AMOUNT} SAV from deployer to Safe wallet`,
      txBuilderVersion: "1.16.2",
      createdFromSafeAddress: cleanSafeAddress,
      checksum: ""
    },
    transactions: [
      {
        to: SAVITRI_COIN_ADDRESS,
        value: "0",
        data: allowDeployerData,
        contractMethod: {
          inputs: [
            { name: "user", type: "address", internalType: "address" },
            { name: "allowed", type: "bool", internalType: "bool" }
          ],
          name: "setAllowedSender",
          payable: false
        },
        contractInputsValues: {
          user: DEPLOYER_ADDRESS,
          allowed: "true"
        },
        operation: 0
      },
      {
        to: SAVITRI_COIN_ADDRESS,
        value: "0",
        data: transferData,
        contractMethod: {
          inputs: [
            { name: "to", type: "address", internalType: "address" },
            { name: "amount", type: "uint256", internalType: "uint256" }
          ],
          name: "transfer",
          payable: false
        },
        contractInputsValues: {
          to: cleanSafeAddress,
          amount: transferAmountWei.toString()
        },
        operation: 0
      }
    ]
  };

  // Option 2: Simple transfer (if deployer is already allowed)
  const simpleTx = {
    version: "1.0",
    chainId: "56",
    createdAt: Date.now(),
    meta: {
      name: "Transfer Tokens from Deployer to Safe (Simple)",
      description: `Transfer ${TRANSFER_AMOUNT} SAV from deployer to Safe wallet`,
      txBuilderVersion: "1.16.2",
      createdFromSafeAddress: cleanSafeAddress,
      checksum: ""
    },
    transactions: [
      {
        to: SAVITRI_COIN_ADDRESS,
        value: "0",
        data: transferData,
        contractMethod: {
          inputs: [
            { name: "to", type: "address", internalType: "address" },
            { name: "amount", type: "uint256", internalType: "uint256" }
          ],
          name: "transfer",
          payable: false
        },
        contractInputsValues: {
          to: cleanSafeAddress,
          amount: transferAmountWei.toString()
        },
        operation: 0
      }
    ]
  };

  // Save files
  const withAllowedFile = path.join(outputDir, "deployer-to-safe-with-allowed.json");
  const simpleFile = path.join(outputDir, "deployer-to-safe-simple.json");

  fs.writeFileSync(withAllowedFile, JSON.stringify(withAllowedTx, null, 2));
  fs.writeFileSync(simpleFile, JSON.stringify(simpleTx, null, 2));

  // Create README
  const readme = `# Transfer Tokens from Deployer to Safe

## ⚠️ IMPORTANT: Execute This FIRST

Before executing \`fund-both-contracts-with-allowed.json\`, you need to transfer tokens from the deployer address to Safe wallet.

## Current Situation

- **Deployer** (0xb18006ab8d4c566f8d682d80b4f54ea5529c307d): Has 599.5M SAV tokens ✅
- **Safe Wallet**: Has 0 SAV tokens ❌
- **Needed**: 11M SAV (10M for TokenICO + 1M for PrivateSaleDistribution)

## Solution

Transfer tokens from deployer to Safe wallet first.

## IMPORTANT NOTE

⚠️ **These transactions must be executed FROM THE DEPLOYER ADDRESS**, not from Safe!

The deployer address (0xb18006ab8d4c566f8d682d80b4f54ea5529c307d) needs to:
1. Call \`setAllowedSender(deployer, true)\` (if transfers are disabled)
2. Call \`transfer(Safe, 15000000)\` to send tokens to Safe

## Options

### Option 1: Manual Transfer (Recommended if deployer is a regular wallet)

If deployer is a regular wallet (not Safe):

1. Connect deployer wallet to MetaMask or your wallet
2. Go to BSCScan: https://bscscan.com/address/${SAVITRI_COIN_ADDRESS}#writeContract
3. Connect deployer wallet
4. Call \`setAllowedSender\`:
   - user: ${DEPLOYER_ADDRESS}
   - allowed: true
5. Call \`transfer\`:
   - to: ${cleanSafeAddress}
   - amount: ${transferAmountWei.toString()}

### Option 2: If Deployer is Safe Owner

If deployer is one of the Safe owners, you can create a Safe transaction, but it will still need to be executed from deployer's wallet.

## After Transfer

Once Safe has tokens, then execute:
- \`fund-both-contracts-with-allowed.json\`

## Files Generated

1. **deployer-to-safe-with-allowed.json** - Sets allowed sender first, then transfers
2. **deployer-to-safe-simple.json** - Just transfer (if deployer already allowed)

## Contract Addresses

- **SavitriCoin**: ${SAVITRI_COIN_ADDRESS}
- **Deployer**: ${DEPLOYER_ADDRESS}
- **Safe Wallet**: ${cleanSafeAddress}
- **Transfer Amount**: ${TRANSFER_AMOUNT} SAV (${transferAmountWei.toString()} wei)
`;

  const readmeFile = path.join(outputDir, "DEPLOYER_TO_SAFE_README.md");
  fs.writeFileSync(readmeFile, readme);

  console.log("✅ Transaction files generated!");
  console.log("");
  console.log("📄 Files created:");
  console.log("  1. deployer-to-safe-with-allowed.json - With setAllowedSender");
  console.log("  2. deployer-to-safe-simple.json - Simple transfer");
  console.log("  3. DEPLOYER_TO_SAFE_README.md - Instructions");
  console.log("");
  console.log("⚠️  IMPORTANT:");
  console.log("  These transactions must be executed FROM DEPLOYER ADDRESS");
  console.log("  Deployer: " + DEPLOYER_ADDRESS);
  console.log("  Not from Safe wallet!");
  console.log("");
  console.log("📋 Steps:");
  console.log("  1. Transfer tokens from deployer to Safe (using these files)");
  console.log("  2. Then execute fund-both-contracts-with-allowed.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

