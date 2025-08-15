// scripts/sendNative.js
// Usage (env vars):
//   TO=0x... AMOUNT=1 npx hardhat run scripts/sendNative.js --network localhost
// Amount is in ETH (native), not wei.

const hre = require("hardhat");

function env(name, fallback) {
  return process.env[name] ?? fallback;
}

async function main() {
  const ethers = hre.ethers;
  const to = env("TO");
  const amountEth = env("AMOUNT", "1"); // default 1 ETH

  const isAddress = ethers.utils?.isAddress ?? ethers.isAddress;
  const parseEther = ethers.utils?.parseEther ?? ethers.parseEther;
  const formatEther = ethers.utils?.formatEther ?? ethers.formatEther;

  if (!to || !isAddress(to)) throw new Error(`Bad TO address: ${to}`);

  const [signer] = await ethers.getSigners();

  // Log balances before
  const balBefore = await ethers.provider.getBalance(to);
  console.log("Sender:", signer.address);
  console.log("Recipient:", to);
  console.log("Recipient balance before:", formatEther(balBefore), "ETH");

  // Send
  const tx = await signer.sendTransaction({
    to,
    value: parseEther(amountEth),
  });
  console.log("tx:", tx.hash);
  await tx.wait();

  // After
  const balAfter = await ethers.provider.getBalance(to);
  console.log("✅ Recipient balance after:", formatEther(balAfter), "ETH");
}

main().catch((e) => {
  console.error("❌", e.message || e);
  process.exit(1);
});
