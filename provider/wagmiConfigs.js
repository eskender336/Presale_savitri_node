import {
  mainnet,
  polygon,
  polygonAmoy,
  optimism,
  arbitrum,
  base,
  holesky,
  sepolia,
  baseSepolia,
  bsc,
  bscTestnet,
} from "wagmi/chains";
import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { injected, metaMask, safe, walletConnect } from "wagmi/connectors";
import { defineChain } from "viem";

const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID;
const envChainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID);

// ✅ Custom chain definition for 1337 using env RPC
const RPC_URL_1337 = process.env.NEXT_PUBLIC_RPC_URL;
const savitriLocal = defineChain({
  id: 1337,
  name: "Savitri Local/EC2",
  nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: [RPC_URL_1337] },
    public: { http: [RPC_URL_1337] },
  },
});

const chainMap = {
  1: mainnet,
  137: polygon,
  80002: polygonAmoy,
  10: optimism,
  42161: arbitrum,
  8453: base,
  17000: holesky,
  1337: savitriLocal, // ✅ replaced localhost with your custom RPC
  11155111: sepolia,
  84532: baseSepolia,
  56: bsc,
  97: bscTestnet,
};

const selectedChain = chainMap[envChainId] || savitriLocal;

export const config = getDefaultConfig({
  appName: "Savitri Network",
  projectId: projectId,
  chains: [selectedChain],
  ssr: true,
});
