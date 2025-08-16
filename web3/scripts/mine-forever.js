const { ethers } = require("ethers");
const RPC = process.env.RPC || "http://127.0.0.1:8545";
const provider = new ethers.providers.JsonRpcProvider(RPC);

setInterval(async () => {
  try {
    await provider.send("evm_mine", []);
  } catch (e) {
    console.error("mine error:", e.message);
  }
}, 3000); // каждые 3 секунды
