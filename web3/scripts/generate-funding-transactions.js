// scripts/generate-funding-transactions.js
// Generate Safe transaction JSON for funding TokenICO and PrivateSaleDistribution
// 
// This script generates Safe transaction JSON files that can be imported into
// the Safe wallet interface to fund the contracts with initial amounts.
//
// Usage:
//   npx hardhat run scripts/generate-funding-transactions.js --network bsc
//
// Then import the generated JSON files into your Safe wallet interface

const hre = require("hardhat");
require("dotenv").config();
const fs = require("fs");
const path = require("path");

const SAVITRI_COIN_ADDRESS = process.env.SAVITRI_COIN_ADDRESS || "0xbfF00512c08477E9c03DE507fCD5C9b087fe6813";
const TOKEN_ICO_ADDRESS = process.env.NEXT_PUBLIC_TOKEN_ICO_ADDRESS || "0x0D3aC358121Ed8e23f80dA496a5CcBBD2b209262";
const PRIVATE_SALE_ADDRESS = process.env.PRIVATE_SALE_DISTRIBUTION_ADDRESS || "0x20d62B0659C25CF27D168E9635234179B22e10A7";
// Get Safe address, handling potential formatting issues
let SAFE_ADDRESS = process.env.SAFE_ADDRESS || "0xbC08bF77697271F1617728c7Cd049b596d13b3ba";
// Clean up if there's extra text (from .env file formatting)
// Extract only the address part (42 characters starting with 0x)
const addressMatch = SAFE_ADDRESS.match(/0x[a-fA-F0-9]{40}/);
if (addressMatch) {
  SAFE_ADDRESS = addressMatch[0];
} else {
  SAFE_ADDRESS = SAFE_ADDRESS.trim().split(/[=\s]/)[0].trim();
}

// Recommended funding amounts (in tokens, will be converted to wei)
const TOKEN_ICO_AMOUNT = "10000000"; // 10M SAV
const PRIVATE_SALE_AMOUNT = "1000000"; // 1M SAV

async function main() {
  console.log("========================================");
  console.log("GENERATE FUNDING TRANSACTIONS");
  console.log("========================================");
  console.log("Safe Address:", SAFE_ADDRESS);
  console.log("Token Address:", SAVITRI_COIN_ADDRESS);
  console.log("");

  // Get ERC20 token interface
  const erc20ABI = [
    "function transfer(address to, uint256 amount) returns (bool)"
  ];
  const tokenInterface = new hre.ethers.utils.Interface(erc20ABI);

  // Convert amounts to wei (18 decimals)
  const tokenICOAmountWei = hre.ethers.utils.parseEther(TOKEN_ICO_AMOUNT);
  const privateSaleAmountWei = hre.ethers.utils.parseEther(PRIVATE_SALE_AMOUNT);

  console.log("Funding Amounts:");
  console.log("  TokenICO: " + TOKEN_ICO_AMOUNT + " SAV (" + tokenICOAmountWei.toString() + " wei)");
  console.log("  PrivateSaleDistribution: " + PRIVATE_SALE_AMOUNT + " SAV (" + privateSaleAmountWei.toString() + " wei)");
  console.log("");

  // Encode transfer function calls
  const tokenICOTransferData = tokenInterface.encodeFunctionData("transfer", [
    TOKEN_ICO_ADDRESS,
    tokenICOAmountWei
  ]);

  const privateSaleTransferData = tokenInterface.encodeFunctionData("transfer", [
    PRIVATE_SALE_ADDRESS,
    privateSaleAmountWei
  ]);

  // Create output directory
  const outputDir = path.join(__dirname, "..", "safe-transactions");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Generate TokenICO funding transaction
  const tokenICOTx = {
    version: "1.0",
    chainId: "56", // BSC mainnet
    createdAt: Date.now(),
    meta: {
      name: "Fund TokenICO Contract",
      description: `Transfer ${TOKEN_ICO_AMOUNT} SAV tokens to TokenICO contract for public sale`,
      txBuilderVersion: "1.16.2",
      createdFromSafeAddress: SAFE_ADDRESS,
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
        }
      }
    ]
  };

  // Generate PrivateSaleDistribution funding transaction
  const privateSaleTx = {
    version: "1.0",
    chainId: "56", // BSC mainnet
    createdAt: Date.now(),
    meta: {
      name: "Fund PrivateSaleDistribution Contract",
      description: `Transfer ${PRIVATE_SALE_AMOUNT} SAV tokens to PrivateSaleDistribution contract for private sale`,
      txBuilderVersion: "1.16.2",
      createdFromSafeAddress: SAFE_ADDRESS,
      checksum: ""
    },
    transactions: [
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
        }
      }
    ]
  };

  // Generate combined batch transaction (both in one)
  const batchTx = {
    version: "1.0",
    chainId: "56", // BSC mainnet
    createdAt: Date.now(),
    meta: {
      name: "Fund Both Contracts",
      description: `Transfer ${TOKEN_ICO_AMOUNT} SAV to TokenICO and ${PRIVATE_SALE_AMOUNT} SAV to PrivateSaleDistribution`,
      txBuilderVersion: "1.16.2",
      createdFromSafeAddress: SAFE_ADDRESS,
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
        }
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
        }
      }
    ]
  };

  // Save files
  const tokenICOFile = path.join(outputDir, "fund-tokenico.json");
  const privateSaleFile = path.join(outputDir, "fund-private-sale.json");
  const batchFile = path.join(outputDir, "fund-both-contracts.json");

  fs.writeFileSync(tokenICOFile, JSON.stringify(tokenICOTx, null, 2));
  fs.writeFileSync(privateSaleFile, JSON.stringify(privateSaleTx, null, 2));
  fs.writeFileSync(batchFile, JSON.stringify(batchTx, null, 2));

  // Create README
  const readme = `# Safe Transaction Data for Contract Funding

## Generated Files

1. **fund-tokenico.json** - Fund TokenICO contract only (10M SAV)
2. **fund-private-sale.json** - Fund PrivateSaleDistribution contract only (1M SAV)
3. **fund-both-contracts.json** - Fund both contracts in one batch transaction (recommended)

## Funding Amounts

- **TokenICO**: ${TOKEN_ICO_AMOUNT} SAV (${tokenICOAmountWei.toString()} wei)
- **PrivateSaleDistribution**: ${PRIVATE_SALE_AMOUNT} SAV (${privateSaleAmountWei.toString()} wei)

## Contract Addresses

- **SavitriCoin Token**: ${SAVITRI_COIN_ADDRESS}
- **TokenICO**: ${TOKEN_ICO_ADDRESS}
- **PrivateSaleDistribution**: ${PRIVATE_SALE_ADDRESS}
- **Safe Wallet**: ${SAFE_ADDRESS}

## Transaction Details

### Transaction 1: Fund TokenICO
- **To:** ${SAVITRI_COIN_ADDRESS}
- **Function:** transfer(address, uint256)
- **Parameters:**
  - to: ${TOKEN_ICO_ADDRESS}
  - amount: ${tokenICOAmountWei.toString()}
- **Data:** ${tokenICOTransferData}

### Transaction 2: Fund PrivateSaleDistribution
- **To:** ${SAVITRI_COIN_ADDRESS}
- **Function:** transfer(address, uint256)
- **Parameters:**
  - to: ${PRIVATE_SALE_ADDRESS}
  - amount: ${privateSaleAmountWei.toString()}
- **Data:** ${privateSaleTransferData}

## How to Execute

### Option 1: Using Safe Transaction Builder (Recommended)

1. Go to https://app.safe.global/
2. Connect your Safe wallet
3. Go to "Apps" → "Transaction Builder"
4. Click "Load transaction" or "Import"
5. Upload one of the JSON files:
   - \`fund-both-contracts.json\` (recommended - both in one batch)
   - \`fund-tokenico.json\` (TokenICO only)
   - \`fund-private-sale.json\` (PrivateSaleDistribution only)
6. Review the transactions carefully:
   - Verify amounts are correct
   - Verify recipient addresses are correct
   - Verify operation is CALL (0), not delegateCall (1)
7. Click "Send batch" or "Create transaction"
8. Get required signatures (3+ from Safe owners)
9. Execute the transaction

### Option 2: Manual Entry in Safe Interface

1. Go to your Safe wallet interface
2. Click "New transaction" → "Contract interaction"
3. Enter contract address: ${SAVITRI_COIN_ADDRESS}
4. For each transaction:
   - **Transaction 1 (TokenICO):**
     - Function: transfer
     - Parameters:
       - to: ${TOKEN_ICO_ADDRESS}
       - amount: ${tokenICOAmountWei.toString()}
   - **Transaction 2 (PrivateSaleDistribution):**
     - Function: transfer
     - Parameters:
       - to: ${PRIVATE_SALE_ADDRESS}
       - amount: ${privateSaleAmountWei.toString()}
5. Create batch transaction
6. Get required signatures
7. Execute

## Security Notes

⚠️ **IMPORTANT SECURITY CHECKS:**
- ✅ Verify operation is CALL (0), NOT delegateCall (1)
- ✅ Double-check recipient addresses
- ✅ Double-check amounts before signing
- ✅ Ensure Safe has sufficient token balance
- ✅ These are initial funding amounts - more can be added later as needed

## Verification

After execution, verify the funding:

\`\`\`bash
# Check TokenICO balance
npx hardhat run scripts/check-tokenico-state.js --network bsc

# Check PrivateSaleDistribution balance
# (You can check on BSCScan or use a custom script)
\`\`\`

## Network

- **Chain:** BSC (Binance Smart Chain)
- **Chain ID:** 56
- **Safe Address:** ${SAFE_ADDRESS}
`;

  const readmeFile = path.join(outputDir, "FUNDING_README.md");
  fs.writeFileSync(readmeFile, readme);

  console.log("✅ Safe transaction files generated!");
  console.log("");
  console.log("Files saved to:", outputDir);
  console.log("");
  console.log("📄 Files created:");
  console.log("  1. fund-tokenico.json - Fund TokenICO (10M SAV)");
  console.log("  2. fund-private-sale.json - Fund PrivateSaleDistribution (1M SAV)");
  console.log("  3. fund-both-contracts.json - Fund both in one batch (recommended)");
  console.log("  4. FUNDING_README.md - Instructions");
  console.log("");
  console.log("📋 Transaction Summary:");
  console.log("");
  console.log("TokenICO Funding:");
  console.log("  To:", SAVITRI_COIN_ADDRESS);
  console.log("  Function: transfer(address, uint256)");
  console.log("  Recipient:", TOKEN_ICO_ADDRESS);
  console.log("  Amount:", TOKEN_ICO_AMOUNT, "SAV (" + tokenICOAmountWei.toString() + " wei)");
  console.log("  Data:", tokenICOTransferData);
  console.log("");
  console.log("PrivateSaleDistribution Funding:");
  console.log("  To:", SAVITRI_COIN_ADDRESS);
  console.log("  Function: transfer(address, uint256)");
  console.log("  Recipient:", PRIVATE_SALE_ADDRESS);
  console.log("  Amount:", PRIVATE_SALE_AMOUNT, "SAV (" + privateSaleAmountWei.toString() + " wei)");
  console.log("  Data:", privateSaleTransferData);
  console.log("");
  console.log("========================================");
  console.log("Next Steps:");
  console.log("1. Go to https://app.safe.global/");
  console.log("2. Connect your Safe wallet");
  console.log("3. Go to Apps → Transaction Builder");
  console.log("4. Import: safe-transactions/fund-both-contracts.json");
  console.log("5. Review amounts and addresses carefully");
  console.log("6. Verify operation is CALL (0), not delegateCall (1)");
  console.log("7. Get required signatures and execute");
  console.log("========================================");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

