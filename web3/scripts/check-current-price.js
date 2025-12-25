const { ethers } = require("ethers");
require("dotenv").config();

async function main() {
  const TOKEN_ICO_ADDRESS = process.env.NEXT_PUBLIC_TOKEN_ICO_ADDRESS;
  const NETWORK_RPC_URL = process.env.NETWORK_RPC_URL;
  
  if (!TOKEN_ICO_ADDRESS) {
    throw new Error("NEXT_PUBLIC_TOKEN_ICO_ADDRESS not set in .env");
  }
  
  if (!NETWORK_RPC_URL) {
    throw new Error("NETWORK_RPC_URL not set in .env");
  }

  console.log("========================================");
  console.log("SAV TOKEN CURRENT PRICE");
  console.log("========================================");
  console.log("TokenICO Address:", TOKEN_ICO_ADDRESS);
  console.log("RPC URL:", NETWORK_RPC_URL);
  console.log("");

  try {
    // Create provider using the RPC URL
    const provider = new ethers.providers.JsonRpcProvider(NETWORK_RPC_URL);
    const network = await provider.getNetwork();
    console.log("Connected to network:", network.chainId, network.name || "");
    console.log("");
    
    // Get contract ABI - we'll use the minimal ABI needed
    const tokenICOABI = [
      "function getCurrentPrice(address) view returns (uint256)",
      "function getPriceInfo(address) view returns (uint256 currentPrice, uint256 nextPrice, uint256 stage)",
      "function tokensSold() view returns (uint256)",
      "function initialUsdtPricePerToken() view returns (uint256)",
      "function MAX_PRICE() view returns (uint256)",
      "function PRICE_THRESHOLD_TOKENS() view returns (uint256)"
    ];
    
    const tokenICO = new ethers.Contract(TOKEN_ICO_ADDRESS, tokenICOABI, provider);
    
    // Get current price (price is in 6 decimals, so 18000 = $0.018)
    const zeroAddress = "0x0000000000000000000000000000000000000000";
    const priceRaw = await tokenICO.getCurrentPrice(zeroAddress);
    const priceInUsd = parseFloat(ethers.utils.formatUnits(priceRaw, 6));
    
    // Get price info (current, next, stage)
    const priceInfo = await tokenICO.getPriceInfo(zeroAddress);
    const currentPrice = parseFloat(ethers.utils.formatUnits(priceInfo.currentPrice, 6));
    const nextPrice = parseFloat(ethers.utils.formatUnits(priceInfo.nextPrice, 6));
    const stage = priceInfo.stage.toString();
    
    // Get additional info
    const tokensSold = await tokenICO.tokensSold();
    const tokensSoldFormatted = ethers.utils.formatUnits(tokensSold, 18);
    const initialPrice = await tokenICO.initialUsdtPricePerToken();
    const initialPriceFormatted = parseFloat(ethers.utils.formatUnits(initialPrice, 6));
    const maxPrice = await tokenICO.MAX_PRICE();
    const maxPriceFormatted = parseFloat(ethers.utils.formatUnits(maxPrice, 6));
    const threshold = await tokenICO.PRICE_THRESHOLD_TOKENS();
    const thresholdFormatted = ethers.utils.formatUnits(threshold, 18);
    
    console.log("📊 Current Price Information:");
    console.log("  Current Price: $" + currentPrice.toFixed(6) + " USD");
    console.log("  Next Price: $" + nextPrice.toFixed(6) + " USD");
    console.log("  Price Stage: " + stage);
    console.log("");
    
    console.log("📈 Price Configuration:");
    console.log("  Initial Price: $" + initialPriceFormatted.toFixed(6) + " USD");
    console.log("  Maximum Price: $" + maxPriceFormatted.toFixed(6) + " USD");
    console.log("  Price Threshold: " + parseFloat(thresholdFormatted).toLocaleString() + " tokens");
    console.log("");
    
    console.log("💰 Sale Status:");
    console.log("  Tokens Sold: " + parseFloat(tokensSoldFormatted).toLocaleString());
    console.log("  Threshold Status: " + (parseFloat(tokensSoldFormatted) >= parseFloat(thresholdFormatted) ? "✅ REACHED" : "⏳ NOT REACHED"));
    console.log("");
    
    if (parseFloat(tokensSoldFormatted) < parseFloat(thresholdFormatted)) {
      const remaining = parseFloat(thresholdFormatted) - parseFloat(tokensSoldFormatted);
      console.log("  Remaining until price increase: " + remaining.toLocaleString() + " tokens");
    }

  } catch (error) {
    console.error("Error:", error.message);
    if (error.message.includes("NEXT_PUBLIC_TOKEN_ICO_ADDRESS")) {
      console.error("\nPlease set NEXT_PUBLIC_TOKEN_ICO_ADDRESS in your .env file");
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

