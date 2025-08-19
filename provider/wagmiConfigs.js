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

const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID;
const envChainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID);

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
};

const selectedChain = chainMap[envChainId] || bscTestnet;

export const config = getDefaultConfig({
  appName: "Savitri Network",
  projectId: projectId,
  chains: [selectedChain],
  ssr: true,
});
