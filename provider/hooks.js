// provider/hooks.js
import { providers } from "ethers";
import { useMemo } from "react";
import { useClient, useConnectorClient } from "wagmi";

export function clientToProvider(client) {
  const { chain, transport } = client;
  const network = {
    chainId: chain.id,
    name: chain.name,
    ensAddress: chain.contracts?.ensRegistry?.address,
  };
  console.log("BUILD ENV CHAIN ID:", process.env.NEXT_PUBLIC_CHAIN_ID);

  console.log("CHAIN ID FROM WAGMI:", chain.id);

  if (transport.type === "fallback") {
    return new providers.FallbackProvider(
      transport.transports.map(
        ({ value }) => new providers.JsonRpcProvider(value?.url, network)
      )
    );
  }
  return new providers.JsonRpcProvider(transport.url, network); 
}

export function useEthersProvider({ chainId } = {}) {
  const envChainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID);
  const client = useClient({ chainId: chainId ?? envChainId });

  return useMemo(
    () => (client ? clientToProvider(client) : undefined),
    [client]
  );
}

export function clientToSigner(client) {
  const { account, chain, transport } = client;
  const network = {
    chainId: chain.id,
    name: chain.name,
    ensAddress: chain.contracts?.ensRegistry?.address,
  };
  const provider = new providers.Web3Provider(transport, network);
  const signer = provider.getSigner(account.address);
  return signer;
}

export function useEthersSigner({ chainId } = {}) {
  const envChainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID);
  const { data: client } = useConnectorClient({ chainId: chainId ?? envChainId });
  return useMemo(() => (client ? clientToSigner(client) : undefined), [client]);
}
