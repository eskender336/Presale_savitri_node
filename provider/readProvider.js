import { providers } from "ethers";

const rawRpcUrls = process.env.NEXT_PUBLIC_READ_RPCS || "";
const chainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID);

if (!rawRpcUrls) {
  console.warn("[readProvider] NEXT_PUBLIC_READ_RPCS is not defined");
}
if (!chainId) {
  console.warn("[readProvider] NEXT_PUBLIC_CHAIN_ID is not defined or invalid");
}

const rpcUrls = rawRpcUrls.split(",").map((u) => u.trim()).filter(Boolean);

// Create individual providers supplying the target chain ID
export const rpcProviders = rpcUrls.map(
  (url) => new providers.JsonRpcProvider(url, chainId)
);

// Use a FallbackProvider when multiple RPCs are supplied, otherwise the single provider
const readProvider =
  rpcProviders.length > 1
    ? new providers.FallbackProvider(rpcProviders)
    : rpcProviders[0];

export default readProvider;
