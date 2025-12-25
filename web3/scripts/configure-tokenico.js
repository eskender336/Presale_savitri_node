// scripts/configure-tokenico.js
// Configure TokenICO contract (must be executed via Safe multisig)
// 
// This script prepares the transactions needed to configure TokenICO.
// Since TokenICO owner is the Safe address, these must be executed via Safe.
//
// Usage:
//   npx hardhat run scripts/configure-tokenico.js --network bsc

const hre = require("hardhat");
require("dotenv").config();

const TOKEN_ICO_ADDRESS = process.env.NEXT_PUBLIC_TOKEN_ICO_ADDRESS || "0x0D3aC358121Ed8e23f80dA496a5CcBBD2b209262";
const SAVITRI_COIN_ADDRESS = process.env.SAVITRI_COIN_ADDRESS || "0xbfF00512c08477E9c03DE507fCD5C9b087fe6813";
const SIGNER_ADDRESS = process.env.SIGNER_ADDRESS || process.env.NEXT_PUBLIC_SIGNER_ADDRESS || "0xDca5AF91A9d0665e96a65712bF38382044edec54";

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const net = await hre.ethers.provider.getNetwork();

  console.log("========================================");
  console.log("CONFIGURE TOKENICO");
  console.log("========================================");
  console.log("Network:", net.chainId, net.name);
  console.log("Deployer:", deployer.address);
  console.log("TokenICO:", TOKEN_ICO_ADDRESS);
  console.log("");

  // Use getContractAt to avoid library linking issues
  const tokenICO = await hre.ethers.getContractAt("TokenICO", TOKEN_ICO_ADDRESS);

  const owner = await tokenICO.owner();
  console.log("TokenICO Owner:", owner);
  console.log("");

  // Check if deployer is owner (should be Safe)
  if (owner.toLowerCase() !== deployer.address.toLowerCase()) {
    console.log("⚠️  TokenICO owner is Safe address, not deployer.");
    console.log("   These calls must be executed via Safe multisig.");
    console.log("");
    console.log("PREPARE SAFE TRANSACTIONS:");
    console.log("========================================");
    console.log("");
    
    // Prepare transaction data
    const iface = tokenICO.interface;
    
    // 1. setSigner
    const setSignerData = iface.encodeFunctionData("setSigner", [SIGNER_ADDRESS]);
    console.log("Transaction 1: setSigner");
    console.log("  To:", TOKEN_ICO_ADDRESS);
    console.log("  Function: setSigner(address)");
    console.log("  Parameter:", SIGNER_ADDRESS);
    console.log("  Data:", setSignerData);
    console.log("");
    
    // 2. setSaleToken
    const setSaleTokenData = iface.encodeFunctionData("setSaleToken", [SAVITRI_COIN_ADDRESS]);
    console.log("Transaction 2: setSaleToken");
    console.log("  To:", TOKEN_ICO_ADDRESS);
    console.log("  Function: setSaleToken(address)");
    console.log("  Parameter:", SAVITRI_COIN_ADDRESS);
    console.log("  Data:", setSaleTokenData);
    console.log("");
    
    console.log("INSTRUCTIONS:");
    console.log("1. Go to your Safe wallet interface");
    console.log("2. Create a new transaction");
    console.log("3. Add the transactions above");
    console.log("4. Get required signatures");
    console.log("5. Execute the transaction");
    console.log("");
    
    // Try to execute anyway (will fail but shows what would happen)
    console.log("Attempting direct execution (will fail if owner is Safe)...");
    console.log("");
    
    try {
      const overrides = { gasLimit: 500000 };
      const tx1 = await tokenICO.setSigner(SIGNER_ADDRESS, overrides);
      console.log("→ setSigner sent:", tx1.hash);
      const receipt1 = await tx1.wait(1);
      console.log("✓ setSigner mined:", receipt1.blockNumber);
    } catch (e) {
      console.log("❌ setSigner failed (expected):", e.message);
    }
    
    try {
      const overrides = { gasLimit: 500000 };
      const tx2 = await tokenICO.setSaleToken(SAVITRI_COIN_ADDRESS, overrides);
      console.log("→ setSaleToken sent:", tx2.hash);
      const receipt2 = await tx2.wait(1);
      console.log("✓ setSaleToken mined:", receipt2.blockNumber);
    } catch (e) {
      console.log("❌ setSaleToken failed (expected):", e.message);
    }
    
  } else {
    // Deployer is owner, can execute directly
    console.log("✅ Deployer is owner, executing directly...");
    console.log("");
    
    const overrides = { gasLimit: 500000 };
    
    try {
      console.log("Setting signer...");
      const tx1 = await tokenICO.setSigner(SIGNER_ADDRESS, overrides);
      console.log("→ Transaction sent:", tx1.hash);
      const receipt1 = await tx1.wait(1);
      console.log("✓ Signer set:", SIGNER_ADDRESS);
      console.log("");
    } catch (e) {
      console.log("❌ Failed to set signer:", e.message);
    }
    
    try {
      console.log("Setting sale token...");
      const tx2 = await tokenICO.setSaleToken(SAVITRI_COIN_ADDRESS, overrides);
      console.log("→ Transaction sent:", tx2.hash);
      const receipt2 = await tx2.wait(1);
      console.log("✓ Sale token set:", SAVITRI_COIN_ADDRESS);
      console.log("");
    } catch (e) {
      console.log("❌ Failed to set sale token:", e.message);
    }
    
    // Verify
    const currentSigner = await tokenICO.signer();
    const currentSaleToken = await tokenICO.saleToken();
    
    console.log("Current configuration:");
    console.log("  Signer:", currentSigner);
    console.log("  Sale Token:", currentSaleToken);
  }
  
  console.log("========================================");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

