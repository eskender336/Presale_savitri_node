import { ethers } from "ethers";

const READ_RPCS = [
  "https://bsc-testnet.publicnode.com",
  "https://data-seed-prebsc-1-s1.binance.org:8545",
  "https://data-seed-prebsc-2-s1.binance.org:8545",
  "https://endpoints.omniatech.io/v1/bsc/testnet/public",
  "https://rpc.ankr.com/bsc_testnet_chapel",
];

export const readProvider = new ethers.providers.FallbackProvider(
  READ_RPCS.map((u) => new ethers.providers.JsonRpcProvider(u)),
  1
);
