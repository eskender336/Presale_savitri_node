// pages/_app.js
import "@rainbow-me/rainbowkit/styles.css";
import toast, { Toaster } from "react-hot-toast";

import { config } from "../provider/wagmiConfigs";

import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

const queryClient = new QueryClient();
import "../styles/globals.css";
import { Web3Provider } from "../context/Web3Provider";
import { ToastProvider } from "../context/ToastContext";

function MyApp({ Component, pageProps }) {
  useEffect(() => {
    if (typeof window !== "undefined" && !navigator.clipboard) {
      navigator.clipboard = {
        writeText: async (text) => {
          const textarea = document.createElement("textarea");
          textarea.value = text;
          textarea.style.position = "fixed";
          document.body.appendChild(textarea);
          textarea.focus();
          textarea.select();
          document.execCommand("copy");
          document.body.removeChild(textarea);
        },
      };
    }
  }, []);

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
