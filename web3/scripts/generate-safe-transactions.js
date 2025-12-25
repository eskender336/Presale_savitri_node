// scripts/generate-safe-transactions.js
// Generate Safe transaction JSON for configuring TokenICO
// 
// This script generates a Safe transaction JSON that can be imported into
// the Safe wallet interface to configure TokenICO.
//
// Usage:
//   npx hardhat run scripts/generate-safe-transactions.js --network bsc
//
// Then import the generated JSON into your Safe wallet interface

const hre = require("hardhat");
require("dotenv").config();
const fs = require("fs");
const path = require("path");

const TOKEN_ICO_ADDRESS = process.env.NEXT_PUBLIC_TOKEN_ICO_ADDRESS || "0x0D3aC358121Ed8e23f80dA496a5CcBBD2b209262";
const SAVITRI_COIN_ADDRESS = process.env.SAVITRI_COIN_ADDRESS || "0xbfF00512c08477E9c03DE507fCD5C9b087fe6813";
const SAFE_ADDRESS = process.env.SAFE_ADDRESS || "0xbC08bF77697271F1617728c7Cd049b596d13b3ba";
const SIGNER_ADDRESS = process.env.SIGNER_ADDRESS || process.env.NEXT_PUBLIC_SIGNER_ADDRESS || "0xDca5AF91A9d0665e96a65712bF38382044edec54";

async function main() {
  console.log("========================================");
  console.log("GENERATE SAFE TRANSACTIONS");
  console.log("========================================");
  console.log("TokenICO:", TOKEN_ICO_ADDRESS);
  console.log("Safe Address:", SAFE_ADDRESS);
  console.log("");

  // Get contract interface
  const tokenICO = await hre.ethers.getContractAt("TokenICO", TOKEN_ICO_ADDRESS);
  const iface = tokenICO.interface;

  // Prepare transactions
  const transactions = [];

  // Transaction 1: setSigner
  const setSignerData = iface.encodeFunctionData("setSigner", [SIGNER_ADDRESS]);
  transactions.push({
    to: TOKEN_ICO_ADDRESS,
    value: "0",
    data: setSignerData,
    operation: 0, // 0 = call, 1 = delegateCall
    safeTxGas: 0,
    baseGas: 0,
    gasPrice: 0,
    gasToken: "0x0000000000000000000000000000000000000000",
    refundReceiver: "0x0000000000000000000000000000000000000000",
    nonce: 0
  });

  // Transaction 2: setSaleToken
  const setSaleTokenData = iface.encodeFunctionData("setSaleToken", [SAVITRI_COIN_ADDRESS]);
  transactions.push({
    to: TOKEN_ICO_ADDRESS,
    value: "0",
    data: setSaleTokenData,
    operation: 0,
    safeTxGas: 0,
    baseGas: 0,
    gasPrice: 0,
    gasToken: "0x0000000000000000000000000000000000000000",
    refundReceiver: "0x0000000000000000000000000000000000000000",
    nonce: 0
  });

  // Generate Safe transaction JSON
  const safeTransaction = {
    version: "1.0",
    chainId: "56", // BSC mainnet
    createdAt: Date.now(),
    meta: {
      name: "Configure TokenICO",
      description: "Set signer and sale token for TokenICO contract",
      txBuilderVersion: "1.16.2",
      createdFromSafeAddress: SAFE_ADDRESS,
      checksum: ""
    },
    transactions: transactions.map((tx, index) => ({
      to: tx.to,
      value: tx.value,
      data: tx.data,
      contractMethod: index === 0 
        ? {
            inputs: [{ name: "_signer", type: "address", internalType: "address" }],
            name: "setSigner",
            payable: false
          }
        : {
            inputs: [{ name: "_token", type: "address", internalType: "address" }],
            name: "setSaleToken",
            payable: false
          },
      contractInputsValues: index === 0
        ? { _signer: SIGNER_ADDRESS }
        : { _token: SAVITRI_COIN_ADDRESS }
    }))
  };

  // Also create a simpler format for manual entry
  const simpleFormat = {
    safe: SAFE_ADDRESS,
    to: TOKEN_ICO_ADDRESS,
    value: "0",
    data: null, // Will be set per transaction
    operation: 0,
    safeTxGas: 500000,
    baseGas: 0,
    gasPrice: 0,
    gasToken: "0x0000000000000000000000000000000000000000",
    refundReceiver: "0x0000000000000000000000000000000000000000",
    nonce: null, // Will be set by Safe
    transactions: [
      {
        to: TOKEN_ICO_ADDRESS,
        value: "0",
        data: setSignerData,
        operation: 0,
        description: `setSigner(${SIGNER_ADDRESS})`
      },
      {
        to: TOKEN_ICO_ADDRESS,
        value: "0",
        data: setSaleTokenData,
        operation: 0,
        description: `setSaleToken(${SAVITRI_COIN_ADDRESS})`
      }
    ]
  };

  // Save to files
  const outputDir = path.join(__dirname, "..", "safe-transactions");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const txBuilderFile = path.join(outputDir, "tokenico-config-tx-builder.json");
  const simpleFile = path.join(outputDir, "tokenico-config-simple.json");
  const readmeFile = path.join(outputDir, "README.md");

  fs.writeFileSync(txBuilderFile, JSON.stringify(safeTransaction, null, 2));
  fs.writeFileSync(simpleFile, JSON.stringify(simpleFormat, null, 2));

  // Create README with instructions
  const readme = `# Safe Transaction Data for TokenICO Configuration

## Generated Files

1. **tokenico-config-tx-builder.json** - For Safe Transaction Builder (recommended)
2. **tokenico-config-simple.json** - Simple format with transaction details

## Transactions to Execute

### Transaction 1: setSigner
- **To:** ${TOKEN_ICO_ADDRESS}
- **Function:** setSigner(address)
- **Parameter:** ${SIGNER_ADDRESS}
- **Data:** ${setSignerData}

### Transaction 2: setSaleToken
- **To:** ${TOKEN_ICO_ADDRESS}
- **Function:** setSaleToken(address)
- **Parameter:** ${SAVITRI_COIN_ADDRESS}
- **Data:** ${setSaleTokenData}

## How to Execute

### Option 1: Using Safe Transaction Builder (Recommended)

1. Go to https://app.safe.global/
2. Connect your Safe wallet
3. Go to "Apps" → "Transaction Builder"
4. Click "Load transaction" or "Import"
5. Upload the file: \`tokenico-config-tx-builder.json\`
6. Review the transactions
7. Click "Send batch" or "Create transaction"
8. Get required signatures
9. Execute

### Option 2: Manual Entry in Safe Interface

1. Go to your Safe wallet interface
2. Click "New transaction" → "Contract interaction"
3. Enter contract address: ${TOKEN_ICO_ADDRESS}
4. For each transaction:
   - **Transaction 1:**
     - Function: setSigner
     - Parameter: ${SIGNER_ADDRESS}
   - **Transaction 2:**
     - Function: setSaleToken
     - Parameter: ${SAVITRI_COIN_ADDRESS}
5. Create batch transaction
6. Get required signatures
7. Execute

### Option 3: Using Safe CLI (Advanced)

\`\`\`bash
# Install Safe CLI if needed
npm install -g @safe-global/safe-cli

# Execute transactions
safe-cli send-transaction \\
  --safe ${SAFE_ADDRESS} \\
  --to ${TOKEN_ICO_ADDRESS} \\
  --data ${setSignerData} \\
  --network bsc

safe-cli send-transaction \\
  --safe ${SAFE_ADDRESS} \\
  --to ${TOKEN_ICO_ADDRESS} \\
  --data ${setSaleTokenData} \\
  --network bsc
\`\`\`

## Verification

After execution, verify the configuration:

\`\`\`bash
npx hardhat run scripts/configure-tokenico.js --network bsc
\`\`\`

## Network

- **Chain:** BSC (Binance Smart Chain)
- **Chain ID:** 56
- **Safe Address:** ${SAFE_ADDRESS}
- **TokenICO Address:** ${TOKEN_ICO_ADDRESS}
`;

  fs.writeFileSync(readmeFile, readme);

  console.log("✅ Safe transaction files generated!");
  console.log("");
  console.log("Files saved to:", outputDir);
  console.log("");
  console.log("📄 Files created:");
  console.log("  1. tokenico-config-tx-builder.json - For Safe Transaction Builder");
  console.log("  2. tokenico-config-simple.json - Simple format");
  console.log("  3. README.md - Instructions");
  console.log("");
  console.log("📋 Transaction Details:");
  console.log("");
  console.log("Transaction 1: setSigner");
  console.log("  To:", TOKEN_ICO_ADDRESS);
  console.log("  Function: setSigner(address)");
  console.log("  Parameter:", SIGNER_ADDRESS);
  console.log("  Data:", setSignerData);
  console.log("");
  console.log("Transaction 2: setSaleToken");
  console.log("  To:", TOKEN_ICO_ADDRESS);
  console.log("  Function: setSaleToken(address)");
  console.log("  Parameter:", SAVITRI_COIN_ADDRESS);
  console.log("  Data:", setSaleTokenData);
  console.log("");
  console.log("========================================");
  console.log("Next Steps:");
  console.log("1. Go to https://app.safe.global/");
  console.log("2. Connect your Safe wallet");
  console.log("3. Go to Apps → Transaction Builder");
  console.log("4. Import the file: safe-transactions/tokenico-config-tx-builder.json");
  console.log("5. Review and execute the batch transaction");
  console.log("========================================");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

