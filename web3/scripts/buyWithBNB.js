// scripts/buyWithBNB.js
// Quickly trigger a TokensPurchased event by calling buyWithBNB on the ICO.
// Usage:
//   ICO=0x... AMOUNT=0.01 npx hardhat run scripts/buyWithBNB.js --network localhost

const hre = require("hardhat");

function env(name, fallback) { return process.env[name] ?? fallback; }

async function main() {
  const { ethers } = hre;
  const icoAddr = env("ICO", process.env.NEXT_PUBLIC_TOKEN_ICO_ADDRESS || process.env.CONTRACT_ADDRESS);
  const amount = env("AMOUNT", "0.01");

  if (!icoAddr || !(ethers.utils?.isAddress ?? ethers.isAddress)(icoAddr)) {
    throw new Error(`Bad ICO address: ${icoAddr}`);
  }

  const [signer] = await ethers.getSigners();
  const abi = require('../artifacts/contracts/TokenICO.sol/TokenICO.json').abi;
  const ico = new ethers.Contract(icoAddr, abi, signer);

  console.log("Caller:", signer.address);
  console.log("ICO:", ico.address);
  console.log("Sending buyWithBNB with", amount, "BNB/ETH");
  const value = (ethers.utils?.parseEther ? ethers.utils.parseEther(amount) : ethers.parseEther(amount));
  const tx = await ico.buyWithBNB({ value });
  console.log("tx:", tx.hash);
  const rcpt = await tx.wait();
  console.log("✅ Mined in block", rcpt.blockNumber);
}

main().catch((e) => { console.error("❌", e); process.exit(1); });

