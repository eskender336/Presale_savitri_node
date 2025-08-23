// wagmiConfigs.js (or wherever your chainMap lives)
import {
  mainnet, polygon, polygonAmoy, optimism, arbitrum, base,
  holesky, sepolia, baseSepolia, bsc, bscTestnet,
} from "wagmi/chains";
import { getDefaultConfig } from "@rainbow-me/rainbowkit";

const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID;
const envChainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID);

// 1) Define Savitri from env
const savitri = {
  id: envChainId, // your custom chain id
  name: process.env.NEXT_PUBLIC_CHAIN_NAME || "Savitri",
  network: process.env.NEXT_PUBLIC_NETWORK_KEY || "savitri",
  nativeCurrency: {
    name: process.env.NEXT_PUBLIC_NATIVE_CURRENCY_NAME || "Savitri",
    symbol: process.env.NEXT_PUBLIC_NATIVE_CURRENCY_SYMBOL || "SAV",
    decimals: Number(process.env.NEXT_PUBLIC_NATIVE_CURRENCY_DECIMALS || 18),
  },
  rpcUrls: {
    default: { http: [process.env.NEXT_PUBLIC_RPC_URL].filter(Boolean) },
    public:  { http: [process.env.NEXT_PUBLIC_RPC_URL].filter(Boolean) },
  },
  blockExplorers: process.env.NEXT_PUBLIC_EXPLORER_URL
    ? { default: {
        name: process.env.NEXT_PUBLIC_EXPLORER_NAME || "Explorer",
        url: process.env.NEXT_PUBLIC_EXPLORER_URL,
      }}
    : undefined,
  testnet: (process.env.NEXT_PUBLIC_IS_TESTNET || "false") === "true",
};

// 2) Add Savitri to chainMap
const chainMap = {
  1: mainnet,
  137: polygon,
  80002: polygonAmoy,
  10: optimism,
  42161: arbitrum,
  8453: base,
  17000: holesky,
  11155111: sepolia,
  84532: baseSepolia,
  56: bsc,
  97: bscTestnet,

  [savitri.id]: savitri, // <<— your custom chain
};

const selectedChain = chainMap[envChainId] || savitri;

export const config = getDefaultConfig({
  appName: process.env.NEXT_PUBLIC_APP_NAME || "Savitri Network",
  projectId,
  chains: [selectedChain],
  ssr: true,
});
