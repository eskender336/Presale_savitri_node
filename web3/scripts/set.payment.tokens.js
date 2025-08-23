// scripts/set.payment.tokens.js
// Обновляет адреса платёжных токенов в уже задеплоенном TokenICO
// Требует: ICO_ADDRESS и нужные *_ADDRESS в .env
//
// Дополнительно:
//   EXPECTED_CHAIN_ID=56   // по умолчанию 56 (BSC mainnet)
//   GAS_PRICE_GWEI=10
//   GAS_LIMIT=300000

const hre = require("hardhat");
require("dotenv").config();

const { ethers } = hre;
const AddressZero = ethers.constants.AddressZero;

const ERC20_MIN_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address) view returns (uint256)",
];

function isAddr(x) {
  try { return ethers.utils.isAddress(x); } catch { return false; }
}

function now() { return new Date().toISOString(); }

async function waitFor(txPromise, label="tx") {
  const tx = await txPromise;
  console.log(`[${now()}] → sent ${label}: ${tx.hash}`);
  console.time(`⏱ ${label}`);
  const rcpt = await tx.wait(1);
  console.timeEnd(`⏱ ${label}`);
  console.log(`[${now()}] ✓ mined ${label}: block=${rcpt.blockNumber} gasUsed=${rcpt.gasUsed?.toString()}`);
  return rcpt;
}

async function isContract(addr) {
  if (!addr || !isAddr(addr) || addr === AddressZero) return false;
  const code = await ethers.provider.getCode(addr);
  return code && code !== "0x";
}

async function logTokenMeta(sym, addr) {
  try {
    const erc = new ethers.Contract(addr, ERC20_MIN_ABI, ethers.provider);
    const [name, symbol, decimals] = await Promise.all([
      erc.name().catch(() => ""),
      erc.symbol().catch(() => sym),
      erc.decimals().catch(() => 18),
    ]);
    console.log(`🔎 ${sym}: ${name || "(no name)"} [${symbol}] decimals=${decimals} @ ${addr}`);
  } catch (e) {
    console.log(`⚠️  Не удалось прочитать метаданные ${sym} @ ${addr}: ${e?.message}`);
  }
}

async function setPaymentToken(ico, sym, addr, fnName, overrides) {
  // Пустой — пропускаем (значит токен не включаем)
  if (!addr) {
    console.log(`ℹ️  ${sym}: адрес не задан — пропускаю`);
    return false;
  }

  if (!isAddr(addr)) {
    throw new Error(`${sym}_ADDRESS неверный адрес: ${addr}`);
  }

  // Разрешаем явное отключение токена через AddressZero, если контракт это поддерживает
  if (addr !== AddressZero) {
    // Проверяем, что в этой сети по адресу действительно есть контракт
    if (!(await isContract(addr))) {
      console.log(`⚠️  ${sym}: по адресу нет контракта на этой сети -> пропускаю (${addr})`);
      return false;
    }
    await logTokenMeta(sym, addr);
  } else {
    console.log(`ℹ️  ${sym}: будет отключён (AddressZero)`);
  }

  const selector = `${fnName}(address)`;        // напр., "updateUSDT(address)"
  if (!ico.interface.functions[selector]) {
    console.log(`ℹ️  ${selector} не найден в ABI TokenICO — пропускаю ${sym}`);
    return false;
  }

  await waitFor(ico[selector](addr, overrides), `${fnName}(${sym})`);
  console.log(`✅ ${sym} установлен @ ${addr}`);
  return true;
}

async function main() {
  const [signer] = await ethers.getSigners();

  // === сеть
  const expectedChainId = parseInt(process.env.EXPECTED_CHAIN_ID || "56", 10);
  const net = await ethers.provider.getNetwork();
  console.log("== Set payment tokens ==");
  console.log("Network:", net.chainId, "(expected:", expectedChainId + ")");
  if (net.chainId !== expectedChainId) {
    throw new Error(`Wrong network: connected ${net.chainId}, expected ${expectedChainId}`);
  }

  // === адрес ICO
  const ICO_ADDRESS = process.env.ICO_ADDRESS || process.env.NEXT_PUBLIC_TOKEN_ICO_ADDRESS;
  if (!isAddr(ICO_ADDRESS)) {
    throw new Error("ICO_ADDRESS (или NEXT_PUBLIC_TOKEN_ICO_ADDRESS) не задан/неверный");
  }

  // === gas overrides
  const GAS_PRICE_GWEI = process.env.GAS_PRICE_GWEI || "10";
  const GAS_LIMIT = parseInt(process.env.GAS_LIMIT || "300000", 10);
  const overrides = {
    gasPrice: ethers.utils.parseUnits(GAS_PRICE_GWEI, "gwei"),
    gasLimit: GAS_LIMIT,
  };

  console.log("Signer:", signer.address);
  console.log("ICO:", ICO_ADDRESS);
  console.log("Overrides:", { gasPriceGwei: GAS_PRICE_GWEI, gasLimit: GAS_LIMIT });

  const ico = await ethers.getContractAt("TokenICO", ICO_ADDRESS);

  // (Необязательная) проверка владельца
  try {
    if (ico.owner) {
      const owner = await ico.owner();
      if (owner.toLowerCase() !== signer.address.toLowerCase()) {
        console.log(`⚠️  Внимание: owner=${owner}, вы=${signer.address}. Возможно, нет прав на апдейт.`);
      } else {
        console.log("✅ Вы владелец контракта TokenICO.");
      }
    }
  } catch {
    console.log("ℹ️  owner() не реализован — пропускаю проверку владельца.");
  }

  // === конфиг из .env
  const cfg = {
    USDT: { addr: process.env.USDT_ADDRESS, fn: "updateUSDT" },
    USDC: { addr: process.env.USDC_ADDRESS, fn: "updateUSDC" },
    ETH:  { addr: process.env.ETH_ADDRESS,  fn: "updateETH"  },
    SOL:  { addr: process.env.SOL_ADDRESS,  fn: "updateSOL"  },
    BTC:  { addr: process.env.BTC_ADDRESS,  fn: "updateBTC"  },
  };

  let anySet = false;
  for (const [sym, { addr, fn }] of Object.entries(cfg)) {
    const changed = await setPaymentToken(ico, sym, addr, fn, overrides);
    anySet = anySet || changed;
  }

  if (!anySet) {
    console.log("ℹ️  Ничего не обновлено: ни один адрес не задан (или не прошёл проверки).");
  } else {
    console.log("🎉 Готово. Платёжные токены обновлены.");
  }

  // (Необязательная) проверка геттеров вида tokenUSDT()
  for (const sym of Object.keys(cfg)) {
    const getter = `token${sym}`; // напр., tokenUSDT()
    if (ico.interface.functions[`${getter}()`]) {
      try {
        const onchain = await ico[getter]();
        console.log(`• ${getter} -> ${onchain}`);
      } catch {}
    }
  }
}

main().then(() => process.exit(0)).catch((err) => {
  console.error("❌ Set payment tokens failed:", err);
  process.exit(1);
});
