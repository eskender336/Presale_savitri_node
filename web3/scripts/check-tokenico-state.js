const hre = require("hardhat");
require("dotenv").config();

async function main() {
  const TOKEN_ICO_ADDRESS = process.env.NEXT_PUBLIC_TOKEN_ICO_ADDRESS;
  if (!TOKEN_ICO_ADDRESS) {
    throw new Error("NEXT_PUBLIC_TOKEN_ICO_ADDRESS not set in .env");
  }

  console.log("========================================");
  console.log("CHECKING TOKENICO CONTRACT STATE");
  console.log("========================================");
  console.log("TokenICO Address:", TOKEN_ICO_ADDRESS);
  console.log("");

  try {
    const tokenICO = await hre.ethers.getContractAt("TokenICO", TOKEN_ICO_ADDRESS);
    
    const owner = await tokenICO.owner();
    // Access public variables - they have auto-generated getter functions
    // Note: 'signer' might conflict with ethers signer, so we use the contract's interface
    const contractSigner = await tokenICO.functions.signer();
    const saleToken = await tokenICO.functions.saleToken();
    
    const signer = contractSigner[0]; // Getter functions return array [value]
    const saleTokenValue = saleToken[0];

    console.log("Current State:");
    console.log("  Owner:", owner);
    console.log("  Signer:", signer);
    console.log("  Sale Token:", saleTokenValue);
    console.log("");

    const EXPECTED_SALE_TOKEN = process.env.SAVITRI_COIN_ADDRESS || "0xbfF00512c08477E9c03DE507fCD5C9b087fe6813";
    const EXPECTED_SIGNER = process.env.NEXT_PUBLIC_SIGNER_ADDRESS || "0xDca5AF91A9d0665e96a65712bF38382044edec54";

    console.log("Expected Values:");
    console.log("  Signer:", EXPECTED_SIGNER);
    console.log("  Sale Token:", EXPECTED_SALE_TOKEN);
    console.log("");

    console.log("Status:");
    console.log("  setSigner:", signer.toLowerCase() === EXPECTED_SIGNER.toLowerCase() ? "✅ SET" : "❌ NOT SET");
    console.log("  setSaleToken:", saleTokenValue.toLowerCase() === EXPECTED_SALE_TOKEN.toLowerCase() ? "✅ SET" : "❌ NOT SET");
    console.log("");

    if (saleTokenValue.toLowerCase() !== EXPECTED_SALE_TOKEN.toLowerCase()) {
      console.log("⚠️  setSaleToken needs to be executed!");
      console.log("");
      console.log("To execute setSaleToken via Safe:");
      console.log("  1. Go to https://app.safe.global/");
      console.log("  2. Connect your Safe wallet");
      console.log("  3. Create new transaction");
      console.log("  4. Contract: " + TOKEN_ICO_ADDRESS);
      console.log("  5. Function: setSaleToken");
      console.log("  6. Parameter: " + EXPECTED_SALE_TOKEN);
      console.log("  7. Operation: CALL (not delegateCall!)");
      console.log("  8. Get signatures and execute");
    }

  } catch (error) {
    console.error("Error:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

