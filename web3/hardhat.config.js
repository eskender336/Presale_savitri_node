// hardhat.config.js
require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();
const fs = require("fs");
const path = require("path");

// Load private key from secure location or environment variable
function loadPrivateKey() {
  // First, try environment variable (for CI/CD or explicit override)
  if (process.env.PRIVATE_KEY) {
    return process.env.PRIVATE_KEY;
  }
  
  // Then, try secure file location
  const secretsDir = path.join(__dirname, ".secrets");
  const privateKeyFile = path.join(secretsDir, "private-key");
  
  if (fs.existsSync(privateKeyFile)) {
    try {
      const key = fs.readFileSync(privateKeyFile, "utf8").trim();
      if (key && key.length > 0) {
        return key;
      }
    } catch (error) {
      console.warn("⚠️  Could not read private key from .secrets/private-key:", error.message);
    }
  }
  
  // Fallback: try .env (for backward compatibility, but warn)
  if (process.env.PRIVATE_KEY_FROM_ENV) {
    console.warn("⚠️  Using PRIVATE_KEY from .env - consider moving to .secrets/private-key");
    return process.env.PRIVATE_KEY_FROM_ENV;
  }
  
  return null;
}

const {
  NEXT_PUBLIC_CHAIN_ID,
  NETWORK_RPC_URL,
  ETHERSCAN_API_KEY,
  BSCSCAN_API_KEY,
} = process.env;

const PRIVATE_KEY = loadPrivateKey();

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
      optimizer: { 
        enabled: true, 
        runs: 0  // Minimum size - prioritize bytecode size over gas efficiency
      }, 
      viaIR: true,
      metadata: {
        bytecodeHash: "none"  // Reduces bytecode size
      },
      outputSelection: {
        "*": {
          "*": ["abi", "evm.bytecode", "evm.deployedBytecode"]
        }
      }
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
      bsc: BSCSCAN_API_KEY,
      bscTestnet: BSCSCAN_API_KEY,
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
      {
        network: "bsc",
        chainId: 56,
        urls: {
          apiURL: "https://api.bscscan.com/api",
          browserURL: "https://bscscan.com",
        },
      },
    ],
  },
  sourcify: { enabled: true },
};
