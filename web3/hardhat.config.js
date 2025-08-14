// hardhat.config.js
require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

// Provide sensible defaults so the config works without environment variables
const {
  NEXT_PUBLIC_CHAIN_ID = "31337",
  NETWORK_RPC_URL = "http://localhost:8545",
  PRIVATE_KEY,
  ETHERSCAN_API_KEY,
} = process.env;

console.log("NEXT_PUBLIC_CHAIN_ID =", NEXT_PUBLIC_CHAIN_ID);

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true,
    },
  },
  networks: {
    hardhat: {
      chainId: parseInt(NEXT_PUBLIC_CHAIN_ID),
      host: "0.0.0.0", // 👈 This makes it listen on all interfaces
      port: 8545, // 👈 Optional: explicitly set port
    },
    holesky: {
      url: NETWORK_RPC_URL,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      chainId: 17000,
    },
    sepolia: {
      url: NETWORK_RPC_URL,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      chainId: 11155111,
    },
    baseSepolia: {
      url: NETWORK_RPC_URL,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      chainId: 84532,
    },
    ethereum: {
      url: NETWORK_RPC_URL,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      chainId: 1,
    },
  },
  paths: {
    artifacts: "./artifacts",
    sources: "./contracts",
    cache: "./cache",
    tests: "./test",
  },
  etherscan: {
    apiKey: {
      holesky: ETHERSCAN_API_KEY,
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
  sourcify: {
    enabled: true,
  },
};
