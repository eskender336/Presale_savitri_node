// hardhat.config.js
require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const {
  NEXT_PUBLIC_CHAIN_ID,
  NETWORK_RPC_URL,
  PRIVATE_KEY,
  ETHERSCAN_API_KEY,
  BSCSCAN_API_KEY,
} = process.env;

const CHAIN_ID = parseInt(NEXT_PUBLIC_CHAIN_ID || "97", 10); // consider 31337 for local

const networks = {
  hardhat: {
    chainId: CHAIN_ID,
    allowUnlimitedContractSize: true,
  },
};

// Only register these if an RPC URL exists
if (NETWORK_RPC_URL) {
  networks.holesky = { url: NETWORK_RPC_URL, accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [], chainId: 17000 };
  networks.sepolia = { url: NETWORK_RPC_URL, accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [], chainId: 11155111 };
  networks.baseSepolia = { url: NETWORK_RPC_URL, accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [], chainId: 84532 };
  networks.ethereum = { url: NETWORK_RPC_URL, accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [], chainId: 1 };

  // ✅ FIX: correct name is "bsc" (not "bcs")
  networks.bsc = { url: NETWORK_RPC_URL, accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [], chainId: 56 };

  // (optional) testnet
  // networks.bscTestnet = { url: NETWORK_RPC_URL, accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [], chainId: 97 };
}

module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: { enabled: true, runs: 1 }, // favor small bytecode
      viaIR: true,                           // this was smaller for your code
      metadata: { bytecodeHash: "none" },    // tiny save
      debug: { revertStrings: "strip" },     // drop revert strings if any remain
    },
  },
  overrides: {
    "contracts/TokenICO.sol": {
      version: "0.8.19",
      settings: {
        optimizer: { enabled: true, runs: 1 },
        viaIR: true,
        metadata: { bytecodeHash: "none" },
        debug: { revertStrings: "strip" },
      },
    },
  },
  networks,
  paths: {
    artifacts: "./artifacts",
    sources: "./contracts",
    cache: "./cache",
    tests: "./test",
  },
  etherscan: {
    apiKey: {
      holesky: ETHERSCAN_API_KEY,
      // optional if you plan to verify on BSC:
      // bsc: BSCSCAN_API_KEY,
      // bscTestnet: BSCSCAN_API_KEY,
    },
    customChains: [
      {
        network: "holesky",
        chainId: 17000,
        urls: {
          apiURL: "https://api-holesky.etherscan.io/api",
          browserURL: "https://holesky.etherscan.io/",
        },
      },
    ],
  },
  sourcify: { enabled: true },
};
