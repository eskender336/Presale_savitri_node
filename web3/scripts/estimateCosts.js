// scripts/estimateCosts.js
const hre = require("hardhat");
require("dotenv").config();

const u = (v, d=0) => (Number.isFinite(+v) ? +v : d);

function now() { return new Date().toISOString(); }

async function waitAndTrack(txPromise, label, totals) {
  const tx = await txPromise;
  console.log(`[${now()}] → sent ${label}: ${tx.hash}`);
  const rcpt = await tx.wait(1);
  const gasUsed = rcpt.gasUsed;
  const eff = rcpt.effectiveGasPrice || tx.gasPrice || (await hre.ethers.provider.getGasPrice());
  const wei = gasUsed.mul(eff);

  totals.gas = totals.gas.add(gasUsed);
  totals.wei = totals.wei.add(wei);

  console.log(
    `[${now()}] ✓ ${label}: block=${rcpt.blockNumber} gasUsed=${gasUsed.toString()} ` +
    `fee=${hre.ethers.utils.formatEther(wei)} BNB`
  );
  return rcpt;
}

async function main() {
  const { ethers } = hre;
  const [deployer] = await ethers.getSigners();
  const net = await ethers.provider.getNetwork();

  const GAS_PRICE_GWEI = process.env.GAS_PRICE_GWEI || "3";   // pick your target mainnet gas price
  const overrides = { gasPrice: ethers.utils.parseUnits(GAS_PRICE_GWEI, "gwei") };

  const SALE_INVENTORY = process.env.SALE_INVENTORY || "500000";
  const SIGNER =
    process.env.SIGNER_ADDRESS ||
    process.env.NEXT_PUBLIC_SIGNER_ADDRESS ||
    deployer.address;

  const totals = { gas: ethers.BigNumber.from(0), wei: ethers.BigNumber.from(0) };
  const fmtBNB = (wei) => ethers.utils.formatEther(wei);

  console.log("== Estimating mainnet cost via local deploy ==");
  console.log("Network (dry run):", net.chainId, net.name);
  console.log("Deployer:", deployer.address);
  console.log("Assumed gasPrice:", GAS_PRICE_GWEI, "gwei");

  // 1) Deploy SAV
  const SavitriCoin = await ethers.getContractFactory("SavitriCoin");
  const sav = await SavitriCoin.deploy(overrides);
  await waitAndTrack(sav.deployTransaction, "SAV deploy", totals);
  console.log("SAV @", sav.address);

  // 2) Deploy ICO
  const TokenICO = await ethers.getContractFactory("TokenICO");
  const ico = await TokenICO.deploy(overrides);
  await waitAndTrack(ico.deployTransaction, "ICO deploy", totals);
  console.log("ICO @", ico.address);

  // 3) Configure signer
  await waitAndTrack(ico.setSigner(SIGNER, overrides), "setSigner", totals);

  // 4) Bind sale token
  await waitAndTrack(ico.setSaleToken(sav.address, overrides), "setSaleToken", totals);

  // 5) (optional) allow sender if your SAV supports it
  try {
    if (sav.interface.functions["setAllowedSender(address,bool)"]) {
      await waitAndTrack(
        sav["setAllowedSender(address,bool)"](ico.address, true, overrides),
        "SAV.setAllowedSender(ICO,true)",
        totals
      );
    }
  } catch {}

  // 6) Fund ICO with sale inventory
  await waitAndTrack(
    sav.transfer(ico.address, ethers.utils.parseUnits(SALE_INVENTORY, 18), overrides),
    `SAV.transfer(ICO, ${SALE_INVENTORY})`,
    totals
  );

  // 7) Set intervals (use your prod values)
  const WL = u(process.env.NEXT_PUBLIC_WAITLIST_INTERVAL, 14*24*60*60);
  const PUB = u(process.env.NEXT_PUBLIC_PUBLIC_INTERVAL, 7*24*60*60);
  await waitAndTrack(ico.setIntervals(WL, PUB, overrides), "setIntervals", totals);

  // 8) Sale start time = now
  const blk = await ethers.provider.getBlock("latest");
  await waitAndTrack(ico.setSaleStartTime(blk.timestamp, overrides), "setSaleStartTime", totals);

  // === Totals ===
  console.log("\n==== ESTIMATE TOTALS ====");
  console.log("Total gas used:", totals.gas.toString());
  console.log("Total fee:", fmtBNB(totals.wei), "BNB  @", GAS_PRICE_GWEI, "gwei");
  console.log("=========================\n");
}

main().catch((e) => {
  console.error("❌", e);
  process.exit(1);
});
