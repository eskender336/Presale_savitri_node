// pages/_app.js
import "@rainbow-me/rainbowkit/styles.css";
import toast, { Toaster } from "react-hot-toast";

import { config } from "../provider/wagmiConfigs";

import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";

const queryClient = new QueryClient();
import "../styles/globals.css";
import { Web3Provider } from "../context/Web3Provider";
import { ToastProvider } from "../context/ToastContext";

function MyApp({ Component, pageProps }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: "#9761F4",
            accentColorForeground: "white",
            borderRadius: "small",
            fontStack: "system",
            overlayBlur: "small",
          })}
        >
          <ToastProvider>
            <Web3Provider>
              <Component {...pageProps} />
            </Web3Provider>
          </ToastProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default MyApp;
