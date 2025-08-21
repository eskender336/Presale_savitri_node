async function main() {
  const [signer] = await ethers.getSigners();
  const nonce = parseInt(process.env.NONCE, 10);
  const tx = await signer.sendTransaction({
    to: await signer.getAddress(),
    value: 0,
    nonce,
    gasPrice: ethers.utils.parseUnits("30", "gwei"),
    gasLimit: 21000,
  });
  console.log("replacement sent:", tx.hash);
  await tx.wait(1);
  console.log("✅ replaced");
}
module.exports = main;
