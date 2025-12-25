const hre = require("hardhat");
require("dotenv").config();
const fs = require("fs");
const path = require("path");

async function main() {
  const TOKEN_ICO_ADDRESS = process.env.NEXT_PUBLIC_TOKEN_ICO_ADDRESS;
  const SAFE_ADDRESS = process.env.SAFE_ADDRESS;
  const SAVITRI_COIN_ADDRESS = process.env.SAVITRI_COIN_ADDRESS || "0xbfF00512c08477E9c03DE507fCD5C9b087fe6813";
  const CHAIN_ID = (await hre.ethers.provider.getNetwork()).chainId;

  if (!TOKEN_ICO_ADDRESS || !hre.ethers.utils.isAddress(TOKEN_ICO_ADDRESS)) {
    throw new Error("NEXT_PUBLIC_TOKEN_ICO_ADDRESS not set or invalid in .env");
  }
  if (!SAFE_ADDRESS || !hre.ethers.utils.isAddress(SAFE_ADDRESS)) {
    throw new Error("SAFE_ADDRESS not set or invalid in .env");
  }

  console.log("========================================");
  console.log("GENERATE setSaleToken TRANSACTION");
  console.log("========================================");
  console.log("TokenICO:", TOKEN_ICO_ADDRESS);
  console.log("Safe Address:", SAFE_ADDRESS);
  console.log("Sale Token:", SAVITRI_COIN_ADDRESS);
  console.log("");

  // Get TokenICO contract instance
  const TokenICO = await hre.ethers.getContractFactory("TokenICO", {
    libraries: {
      PriceCalculationLibrary: "0x5D56a3c8C762ebE3cb407D0Be5FA874c18d5a28f",
      StakingLibrary: "0x48F0E906c2f518d340398Eb825678ACB509bcC47",
    },
  });
  const tokenICO = await TokenICO.attach(TOKEN_ICO_ADDRESS);

  // Encode setSaleToken function call
  const setSaleTokenData = tokenICO.interface.encodeFunctionData("setSaleToken", [SAVITRI_COIN_ADDRESS]);

  const transaction = {
    to: TOKEN_ICO_ADDRESS,
    value: "0",
    data: setSaleTokenData,
    contractMethod: {
      inputs: [{ name: "_token", type: "address", internalType: "address" }],
      name: "setSaleToken",
      payable: false,
    },
    contractInputsValues: {
      _token: SAVITRI_COIN_ADDRESS,
    },
  };

  // Safe Transaction Builder format
  const txBuilderJson = {
    version: "1.0",
    chainId: String(CHAIN_ID),
    createdAt: Date.now(),
    meta: {
      name: "Set Sale Token",
      description: "Set sale token for TokenICO contract",
      txBuilderVersion: "1.16.2",
      createdFromSafeAddress: SAFE_ADDRESS,
      checksum: "",
    },
    transactions: [transaction],
  };

  // Save to file
  const outputDir = path.join(__dirname, "../safe-transactions");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputFile = path.join(outputDir, "set-sale-token-tx.json");
  fs.writeFileSync(outputFile, JSON.stringify(txBuilderJson, null, 2));

  console.log("✅ Transaction file generated!");
  console.log("\nFile saved to:", outputFile);
  console.log("\n📋 Transaction Details:");
  console.log("  To:", TOKEN_ICO_ADDRESS);
  console.log("  Function: setSaleToken(address)");
  console.log("  Parameter:", SAVITRI_COIN_ADDRESS);
  console.log("  Data:", setSaleTokenData);
  console.log("\n⚠️  IMPORTANT:");
  console.log("  Make sure operation is set to 0 (CALL) not 1 (delegateCall)!");
  console.log("\n========================================");
  console.log("Next Steps:");
  console.log("1. Go to https://app.safe.global/");
  console.log("2. Connect your Safe wallet");
  console.log("3. Go to Apps → Transaction Builder");
  console.log("4. Import the file:", outputFile);
  console.log("5. Verify operation is CALL (0), not delegateCall (1)");
  console.log("6. Get required signatures");
  console.log("7. Execute the transaction");
  console.log("========================================\n");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});



