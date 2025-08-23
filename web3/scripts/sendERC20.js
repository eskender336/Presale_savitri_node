// Usage:
// TOKEN=0x... TO=0x... AMOUNT=100000 npx hardhat run scripts/sendERC20.js --network localhost
// If your token has mint(address,uint256) and you want to mint instead of transfer: add MINT=1

const hre = require("hardhat");

function env(name, fallback) { return process.env[name] ?? fallback; }

async function main() {
  const { ethers } = hre;

  const tokenAddr   = env("TOKEN");
  const to          = env("TO");
  const amountHuman = env("AMOUNT");            // e.g. "100000" (100k)
  const doMint      = env("MINT","0") === "1";  // optional

  if (!tokenAddr || !ethers.utils.isAddress(tokenAddr)) throw new Error(`Bad TOKEN: ${tokenAddr}`);
  if (!to || !ethers.utils.isAddress(to)) throw new Error(`Bad TO: ${to}`);
  if (!amountHuman) throw new Error("AMOUNT is required");

  const [signer] = await ethers.getSigners();

  const erc20Abi = [
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)",
    "function balanceOf(address) view returns (uint256)",
    "function transfer(address,uint256) returns (bool)",
    "function mint(address,uint256)" // may not exist; we'll try if MINT=1
  ];

  const token = new ethers.Contract(tokenAddr, erc20Abi, signer);
  const [sym, dec] = await Promise.all([
    token.symbol().catch(() => ""),
    token.decimals()
  ]);
  const amountWei = ethers.utils.parseUnits(amountHuman, dec);

  const before = await token.balanceOf(to);
  console.log(`Sender:   ${signer.address}`);
  console.log(`Token:    ${sym} (${tokenAddr}) dec=${dec}`);
  console.log(`Recipient ${to}`);
  console.log(`Balance before: ${ethers.utils.formatUnits(before, dec)} ${sym}`);

  let tx;
  if (doMint && typeof token.mint === "function") {
    console.log(`Minting ${amountHuman} ${sym} to recipient...`);
    tx = await token.mint(to, amountWei);
  } else {
    console.log(`Transferring ${amountHuman} ${sym} to recipient...`);
    tx = await token.transfer(to, amountWei);
  }
  console.log("tx:", tx.hash);
  await tx.wait();

  const after = await token.balanceOf(to);
  console.log(`✅ Balance after:  ${ethers.utils.formatUnits(after, dec)} ${sym}`);
}

main().catch((e) => { console.error("❌", e); process.exit(1); });
