async function main() {
  const hash = process.env.TX_HASH;
  if (!hash) throw new Error("Set TX_HASH=0x... in env");
  const tx = await ethers.provider.getTransaction(hash);
  if (!tx) return console.log("Tx not found by provider");
  console.log("nonce:", tx.nonce);
}
main().catch((e) => { console.error(e); process.exit(1); });