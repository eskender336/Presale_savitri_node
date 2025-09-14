// scripts/sendToken.js
// Usage (env vars):
// TO=0x... TOKEN=0x... AMOUNT=1000 npx hardhat run scripts/sendToken.js --network localhost

const hre = require("hardhat");

function env(name, fallback) {
  return process.env[name] ?? fallback;
}

async function main() {
  const ethers = hre.ethers;

  const to    = env("TO");
  const token = env("TOKEN", process.env.SAV_ADDRESS);
  const amt   = env("AMOUNT", "1000");

  const isAddress = ethers.utils?.isAddress ?? ethers.isAddress;
  const parse     = ethers.utils?.parseUnits ?? ethers.parseUnits;
  const format    = ethers.utils?.formatUnits ?? ethers.formatUnits;

  if (!to || !isAddress(to))    throw new Error(`Bad TO: ${to}`);
  if (!token || !isAddress(token)) throw new Error(`Bad TOKEN: ${token}`);

  // minimal ERC20 ABI
  const erc20 = [
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)",
    "function balanceOf(address) view returns (uint256)",
    "function transfer(address,uint256) returns (bool)"
  ];

  const [signer] = await ethers.getSigners();
  const c = await ethers.getContractAt(erc20, token);

  let name="ERC20", symbol="TKN", decimals=18;
  try { name = await c.name(); } catch {}
  try { symbol = await c.symbol(); } catch {}
  try { decimals = await c.decimals(); } catch {}

  const amount = parse(amt, decimals);

  const bal = await c.balanceOf(signer.address);
  console.log(`Token: ${name} (${symbol}) @ ${token}`);
  console.log(`Signer: ${signer.address}`);
  console.log(`Signer balance: ${format(bal, decimals)} ${symbol}`);
  console.log(`Sending: ${amt} ${symbol} to ${to}`);

  // basic balance guard (works for v5 and v6)
  const enough = (bal.gte?.(amount)) ?? (BigInt(bal) >= BigInt(amount));
  if (!enough) throw new Error(`Not enough ${symbol} to send ${amt}`);

  const tx = await c.connect(signer).transfer(to, amount);
  console.log("tx:", tx.hash);
  await tx.wait();

  const toBal = await c.balanceOf(to);
  console.log("✅ Recipient balance:", format(toBal, decimals), symbol);
}

main().catch(e => {
  console.error("❌", e.message || e);
  process.exit(1);
});
