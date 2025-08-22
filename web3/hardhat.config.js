// hardhat.config.js
require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const {
  NEXT_PUBLIC_CHAIN_ID,
  NETWORK_RPC_URL,      // one RPC URL you reuse, or swap to SEPOLIA_RPC_URL, etc.
  PRIVATE_KEY,
  ETHERSCAN_API_KEY,
} = process.env;

const CHAIN_ID = parseInt(NEXT_PUBLIC_CHAIN_ID || "97", 10);

const networks = {
  hardhat: {
    chainId: CHAIN_ID,
    host: "0.0.0.0",
    port: 8545,
  },
};

// Only register these if an RPC URL exists
if (NETWORK_RPC_URL) {
  networks.holesky = {
    url: NETWORK_RPC_URL,
    accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
    chainId: 17000,
  };
  networks.sepolia = {
    url: NETWORK_RPC_URL,
    accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
    chainId: 11155111,
  };
  networks.baseSepolia = {
    url: NETWORK_RPC_URL,
    accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
    chainId: 84532,
  };
  networks.ethereum = {
    url: NETWORK_RPC_URL,
    accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
    chainId: 1,
  };
  networks.bscTestnet = {
    url: NETWORK_RPC_URL,
    accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
    chainId: 97,
    gasPrice: Number(process.env.GAS_PRICE_GWEI || 25) * 1e9, // 25 gwei default
    gasMultiplier: 1.2,                                       // bump auto-estimates a bit
    timeout: 120000,
  };
}

module.exports = {
  solidity: {
    version: "0.8.19",
    settings: { optimizer: { enabled: true, runs: 200 }, viaIR: true },
  },
  networks,
  paths: {
    artifacts: "./artifacts",
    sources: "./contracts",
    cache: "./cache",
    tests: "./test",
  },
  etherscan: {
    apiKey: { holesky: ETHERSCAN_API_KEY },
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
