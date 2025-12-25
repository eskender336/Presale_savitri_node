// scripts/generate-funding-transactions-fixed.js
// Generate Safe transaction JSON for funding contracts (FIXED VERSION)
// 
// This version ensures:
// 1. Operation is CALL (0), not delegateCall (1)
// 2. Includes setAllowedSender calls if needed

const hre = require("hardhat");
require("dotenv").config();
const fs = require("fs");
const path = require("path");

const SAVITRI_COIN_ADDRESS = process.env.SAVITRI_COIN_ADDRESS || "0xbfF00512c08477E9c03DE507fCD5C9b087fe6813";
const TOKEN_ICO_ADDRESS = process.env.NEXT_PUBLIC_TOKEN_ICO_ADDRESS || "0x0D3aC358121Ed8e23f80dA496a5CcBBD2b209262";
const PRIVATE_SALE_ADDRESS = process.env.PRIVATE_SALE_DISTRIBUTION_ADDRESS || "0x20d62B0659C25CF27D168E9635234179B22e10A7";
const SAFE_ADDRESS = process.env.SAFE_ADDRESS || "0xbC08bF77697271F1617728c7Cd049b596d13b3ba";

// Clean Safe address
let cleanSafeAddress = SAFE_ADDRESS;
const addressMatch = SAFE_ADDRESS.match(/0x[a-fA-F0-9]{40}/);
if (addressMatch) {
  cleanSafeAddress = addressMatch[0];
} else {
  cleanSafeAddress = SAFE_ADDRESS.trim().split(/[=\s]/)[0].trim();
}

// Recommended funding amounts
const TOKEN_ICO_AMOUNT = "10000000"; // 10M SAV
const PRIVATE_SALE_AMOUNT = "1000000"; // 1M SAV

async function main() {
  console.log("========================================");
  console.log("GENERATE FUNDING TRANSACTIONS (FIXED)");
  console.log("========================================");
  console.log("Safe Address:", cleanSafeAddress);
  console.log("Token Address:", SAVITRI_COIN_ADDRESS);
  console.log("");

  // Get ERC20 token interface
  const erc20ABI = [
    "function transfer(address to, uint256 amount) returns (bool)",
    "function setAllowedSender(address user, bool allowed)"
  ];
  const tokenInterface = new hre.ethers.utils.Interface(erc20ABI);

  // Convert amounts to wei
  const tokenICOAmountWei = hre.ethers.utils.parseEther(TOKEN_ICO_AMOUNT);
  const privateSaleAmountWei = hre.ethers.utils.parseEther(PRIVATE_SALE_AMOUNT);

  console.log("Funding Amounts:");
  console.log("  TokenICO: " + TOKEN_ICO_AMOUNT + " SAV");
  console.log("  PrivateSaleDistribution: " + PRIVATE_SALE_AMOUNT + " SAV");
  console.log("");

  // Encode function calls
  const tokenICOTransferData = tokenInterface.encodeFunctionData("transfer", [
    TOKEN_ICO_ADDRESS,
    tokenICOAmountWei
  ]);

  const privateSaleTransferData = tokenInterface.encodeFunctionData("transfer", [
    PRIVATE_SALE_ADDRESS,
    privateSaleAmountWei
  ]);

  // Encode setAllowedSender calls (in case transfers are disabled)
  const allowTokenICOData = tokenInterface.encodeFunctionData("setAllowedSender", [
    TOKEN_ICO_ADDRESS,
    true
  ]);

  const allowPrivateSaleData = tokenInterface.encodeFunctionData("setAllowedSender", [
    PRIVATE_SALE_ADDRESS,
    true
  ]);

  const allowSafeData = tokenInterface.encodeFunctionData("setAllowedSender", [
    cleanSafeAddress,
    true
  ]);

  // Create output directory
  const outputDir = path.join(__dirname, "..", "safe-transactions");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // OPTION 1: Just transfers (if Safe is already allowed)
  const simpleTx = {
    version: "1.0",
    chainId: "56",
    createdAt: Date.now(),
    meta: {
      name: "Fund Both Contracts (Simple)",
      description: `Transfer ${TOKEN_ICO_AMOUNT} SAV to TokenICO and ${PRIVATE_SALE_AMOUNT} SAV to PrivateSaleDistribution`,
      txBuilderVersion: "1.16.2",
      createdFromSafeAddress: cleanSafeAddress,
      checksum: ""
    },
    transactions: [
      {
        to: SAVITRI_COIN_ADDRESS,
        value: "0",
        data: tokenICOTransferData,
        contractMethod: {
          inputs: [
            { name: "to", type: "address", internalType: "address" },
            { name: "amount", type: "uint256", internalType: "uint256" }
          ],
          name: "transfer",
          payable: false
        },
        contractInputsValues: {
          to: TOKEN_ICO_ADDRESS,
          amount: tokenICOAmountWei.toString()
        },
        operation: 0  // EXPLICITLY SET TO CALL (0)
      },
      {
        to: SAVITRI_COIN_ADDRESS,
        value: "0",
        data: privateSaleTransferData,
        contractMethod: {
          inputs: [
            { name: "to", type: "address", internalType: "address" },
            { name: "amount", type: "uint256", internalType: "uint256" }
          ],
          name: "transfer",
          payable: false
        },
        contractInputsValues: {
          to: PRIVATE_SALE_ADDRESS,
          amount: privateSaleAmountWei.toString()
        },
        operation: 0  // EXPLICITLY SET TO CALL (0)
      }
    ]
  };

  // OPTION 2: With setAllowedSender calls first (if transfers are disabled)
  const withAllowedSendersTx = {
    version: "1.0",
    chainId: "56",
    createdAt: Date.now(),
    meta: {
      name: "Fund Both Contracts (With Allowed Senders)",
      description: `Set allowed senders and transfer ${TOKEN_ICO_AMOUNT} SAV to TokenICO and ${PRIVATE_SALE_AMOUNT} SAV to PrivateSaleDistribution`,
      txBuilderVersion: "1.16.2",
      createdFromSafeAddress: cleanSafeAddress,
      checksum: ""
    },
    transactions: [
      // First, allow Safe to transfer
      {
        to: SAVITRI_COIN_ADDRESS,
        value: "0",
        data: allowSafeData,
        contractMethod: {
          inputs: [
            { name: "user", type: "address", internalType: "address" },
            { name: "allowed", type: "bool", internalType: "bool" }
          ],
          name: "setAllowedSender",
          payable: false
        },
        contractInputsValues: {
          user: cleanSafeAddress,
          allowed: "true"
        },
        operation: 0  // CALL
      },
      // Allow TokenICO to receive/transfer
      {
        to: SAVITRI_COIN_ADDRESS,
        value: "0",
        data: allowTokenICOData,
        contractMethod: {
          inputs: [
            { name: "user", type: "address", internalType: "address" },
            { name: "allowed", type: "bool", internalType: "bool" }
          ],
          name: "setAllowedSender",
          payable: false
        },
        contractInputsValues: {
          user: TOKEN_ICO_ADDRESS,
          allowed: "true"
        },
        operation: 0  // CALL
      },
      // Allow PrivateSaleDistribution to receive/transfer
      {
        to: SAVITRI_COIN_ADDRESS,
        value: "0",
        data: allowPrivateSaleData,
        contractMethod: {
          inputs: [
            { name: "user", type: "address", internalType: "address" },
            { name: "allowed", type: "bool", internalType: "bool" }
          ],
          name: "setAllowedSender",
          payable: false
        },
        contractInputsValues: {
          user: PRIVATE_SALE_ADDRESS,
          allowed: "true"
        },
        operation: 0  // CALL
      },
      // Then transfer to TokenICO
      {
        to: SAVITRI_COIN_ADDRESS,
        value: "0",
        data: tokenICOTransferData,
        contractMethod: {
          inputs: [
            { name: "to", type: "address", internalType: "address" },
            { name: "amount", type: "uint256", internalType: "uint256" }
          ],
          name: "transfer",
          payable: false
        },
        contractInputsValues: {
          to: TOKEN_ICO_ADDRESS,
          amount: tokenICOAmountWei.toString()
        },
        operation: 0  // CALL
      },
      // Finally transfer to PrivateSaleDistribution
      {
        to: SAVITRI_COIN_ADDRESS,
        value: "0",
        data: privateSaleTransferData,
        contractMethod: {
          inputs: [
            { name: "to", type: "address", internalType: "address" },
            { name: "amount", type: "uint256", internalType: "uint256" }
          ],
          name: "transfer",
          payable: false
        },
        contractInputsValues: {
          to: PRIVATE_SALE_ADDRESS,
          amount: privateSaleAmountWei.toString()
        },
        operation: 0  // CALL
      }
    ]
  };

  // Save files
  const simpleFile = path.join(outputDir, "fund-both-contracts-simple.json");
  const withAllowedFile = path.join(outputDir, "fund-both-contracts-with-allowed.json");

  fs.writeFileSync(simpleFile, JSON.stringify(simpleTx, null, 2));
  fs.writeFileSync(withAllowedFile, JSON.stringify(withAllowedSendersTx, null, 2));

  // Create README
  const readme = `# Safe Transaction Data for Contract Funding (FIXED)

## ⚠️ IMPORTANT FIXES

1. **Operation is explicitly set to CALL (0)**, not delegateCall (1)
2. **Includes setAllowedSender calls** if transfers are disabled

## Generated Files

1. **fund-both-contracts-simple.json** - Just transfers (use if Safe is already allowed)
2. **fund-both-contracts-with-allowed.json** - Sets allowed senders first, then transfers (RECOMMENDED if you get "Transfers disabled" error)

## The Problem

Your previous transaction failed because:
1. ❌ Operation was set to delegateCall (1) instead of CALL (0)
2. ❌ "Transfers disabled" - Safe wallet or contracts not in allowedSenders

## Solution

### Option 1: If Safe is already allowed (simple)
- Use: \`fund-both-contracts-simple.json\`
- Just transfers tokens

### Option 2: If transfers are disabled (recommended)
- Use: \`fund-both-contracts-with-allowed.json\`
- First sets allowedSenders for:
  - Safe wallet (so it can transfer)
  - TokenICO (so it can receive and distribute)
  - PrivateSaleDistribution (so it can receive and distribute)
- Then transfers tokens

## How to Execute

1. Go to https://app.safe.global/
2. Connect your Safe wallet
3. Go to "Apps" → "Transaction Builder"
4. Import: \`fund-both-contracts-with-allowed.json\` (recommended)
5. **VERIFY operation is CALL (0) for ALL transactions**
6. Review carefully
7. Get signatures and execute

## Contract Addresses

- **SavitriCoin**: ${SAVITRI_COIN_ADDRESS}
- **TokenICO**: ${TOKEN_ICO_ADDRESS}
- **PrivateSaleDistribution**: ${PRIVATE_SALE_ADDRESS}
- **Safe Wallet**: ${cleanSafeAddress}

## Funding Amounts

- **TokenICO**: ${TOKEN_ICO_AMOUNT} SAV
- **PrivateSaleDistribution**: ${PRIVATE_SALE_AMOUNT} SAV
`;

  const readmeFile = path.join(outputDir, "FUNDING_FIXED_README.md");
  fs.writeFileSync(readmeFile, readme);

  console.log("✅ Fixed transaction files generated!");
  console.log("");
  console.log("📄 Files created:");
  console.log("  1. fund-both-contracts-simple.json - Simple transfers");
  console.log("  2. fund-both-contracts-with-allowed.json - With setAllowedSender (RECOMMENDED)");
  console.log("  3. FUNDING_FIXED_README.md - Instructions");
  console.log("");
  console.log("⚠️  KEY FIXES:");
  console.log("  ✅ Operation explicitly set to CALL (0)");
  console.log("  ✅ Includes setAllowedSender calls to fix 'Transfers disabled' error");
  console.log("");
  console.log("📋 Use: fund-both-contracts-with-allowed.json");
  console.log("   This will set allowed senders first, then transfer tokens");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

