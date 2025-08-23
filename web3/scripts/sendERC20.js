// scripts/sendERC20.js
// Usage:
//
// 1) Send native (BNB on your localhost):
//    TO=0x... AMOUNT=1.5 NATIVE=1 \
//    npx hardhat run scripts/sendERC20.js --network localhost
//
// 2) Send ERC-20:
//    TOKEN=0x... TO=0x... AMOUNT=100000 \
//    npx hardhat run scripts/sendERC20.js --network localhost
//
// 3) Mint ERC-20 instead of transfer (if token has mint(address,uint256)):
//    TOKEN=0x... TO=0x... AMOUNT=100000 MINT=1 \
//    npx hardhat run scripts/sendERC20.js --network localhost

const hre = require("hardhat");

function env(name, fallback) { return process.env[name] ?? fallback; }

async function main() {
  const { ethers } = hre;

  const tokenAddr   = env("TOKEN");
  const to          = env("TO");
  const amountHuman = env("AMOUNT");             // e.g. "100000" or "1.5"
  const doMint      = env("MINT","0") === "1";   // for ERC-20 only
  const isNative    = env("NATIVE","0") === "1"  // send native BNB/ETH
                   || (tokenAddr && /^(native|bnb|eth)$/i.test(tokenAddr));

  // helpers for ethers v5/v6
  const isAddress   = ethers.utils?.isAddress  ?? ethers.isAddress;
  const parseUnits  = ethers.utils?.parseUnits ?? ethers.parseUnits;
  const formatUnits = ethers.utils?.formatUnits ?? ethers.formatUnits;
  const parseEther  = ethers.utils?.parseEther ?? ethers.parseEther;
  const formatEther = ethers.utils?.formatEther ?? ethers.formatEther;

  if (!to || !isAddress(to)) throw new Error(`Bad TO: ${to}`);
  if (!amountHuman) throw new Error("AMOUNT is required");

  const [signer] = await ethers.getSigners();
  const net = await ethers.provider.getNetwork().catch(() => ({}));
  console.log(`Network: chainId=${net.chainId} name=${net.name || "unknown"}`);
  console.log(`Sender:  ${signer.address}`);
  console.log(`Recipient ${to}`);

  if (isNative) {
    // ===== Native path (BNB on your localhost) =====
    const before = await ethers.provider.getBalance(to);
    console.log(`Native balance before: ${formatEther(before)} BNB`);

    const tx = await signer.sendTransaction({
      to,
      value: parseEther(String(amountHuman)),
    });
    console.log("tx:", tx.hash);
    await tx.wait();

    const after = await ethers.provider.getBalance(to);
    console.log(`✅ Native balance after: ${formatEther(after)} BNB`);
    return;
  }

  // ===== ERC-20 path =====
  if (!tokenAddr || !isAddress(tokenAddr)) throw new Error(`Bad TOKEN: ${tokenAddr}`);

  const erc20Abi = [
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)",
    "function balanceOf(address) view returns (uint256)",
    "function transfer(address,uint256) returns (bool)",
    "function mint(address,uint256)" // may or may not exist
  ];

  const token = new ethers.Contract(tokenAddr, erc20Abi, signer);
  const [sym, dec] = await Promise.all([
    token.symbol().catch(() => ""),
    token.decimals()
  ]);
  const amountWei = parseUnits(String(amountHuman), dec);

  const before = await token.balanceOf(to);
  console.log(`Token:    ${sym || "ERC20"} (${tokenAddr}) dec=${dec}`);
  console.log(`Balance before: ${formatUnits(before, dec)} ${sym}`);

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
  console.log(`✅ Balance after:  ${formatUnits(after, dec)} ${sym}`);
}

main().catch((e) => { console.error("❌", e); process.exit(1); });
