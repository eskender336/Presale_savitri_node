import React from "react";
import { FaWallet } from "react-icons/fa";
import { CustomConnectButton } from "../index";
const WalletConnect = ({ isDarkMode }) => {
  // Theme configuration
  const theme = {
    mainBg: isDarkMode
      ? "bg-gradient-to-b from-[#252525] to-[#252525]"
      : "bg-gradient-to-b from-gray-100 to-white",
    cardBg: isDarkMode ? "bg-gray-800 bg-opacity-50" : "bg-white",
    cardBorder: isDarkMode
      ? "border-purple-500 border-opacity-30 hover:border-opacity-70"
      : "border-purple-400 border-opacity-30 hover:border-opacity-70",
    outerCircleBg: isDarkMode ? "bg-purple-800 bg-opacity-30" : "bg-purple-100",
    innerCircleBg: isDarkMode ? "bg-[#DE3657]" : "bg-[#DE3657]",
    title: isDarkMode ? "text-white opacity-80" : "text-gray-900",
    cardTitle: isDarkMode ? "text-white" : "text-gray-900",
    cardText: isDarkMode ? "text-gray-400" : "text-gray-600",
    shadowEffect: isDarkMode ? "" : "shadow-lg",
  };

  const walletOptions = [
    {
      name: "MetaMask",
      description: "Connect using browser wallet",
    },
    {
      name: "WalletConnect",
      description: "Scan with mobile wallet",
    },
    {
      name: "Coinbase Wallet",
      description: "Connect with Coinbase",
    },
  ];

  return (
    <div
      className={`min-h-screen flex flex-col items-center justify-center ${theme.mainBg}`}
    >
      {/* Header */}
      <div className="w-full flex justify-center mb-20">
        <h1 className={`text-3xl font-bold ${theme.title}`}>
          Wallet Connection
        </h1>
      </div>

      {/* Wallet options grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12 w-full max-w-4xl px-4">
        {walletOptions.map((wallet, index) => (
          <div
            key={index}
            className={`${theme.cardBg} p-6 rounded-xl border ${theme.cardBorder} transition-all cursor-pointer ${theme.shadowEffect}`}
          >
            <div
              className={`h-16 w-16 rounded-full ${theme.outerCircleBg} flex items-center justify-center mb-4`}
            >
              <div
                className={`h-10 w-10 rounded-full ${theme.innerCircleBg} flex items-center justify-center`}
              >
                <FaWallet className="text-white text-lg" />
              </div>
            </div>
            <h3 className={`${theme.cardTitle} text-lg mb-1`}>{wallet.name}</h3>
            <p className={`${theme.cardText} text-sm`}>{wallet.description}</p>
          </div>
        ))}
      </div>

      {/* Connect Wallet Button */}
      <CustomConnectButton isDarkMode={isDarkMode} />

      {/* Footer area with recent activity */}
      <div className="mt-20 w-full max-w-4xl px-4">
        <div className="flex items-center mb-4">
          <div
            className={`h-10 w-10 rounded-full ${theme.outerCircleBg} flex items-center justify-center mr-4`}
          >
            <div
              className={`h-6 w-6 rounded-full ${theme.innerCircleBg} flex items-center justify-center`}
            >
              <FaWallet className="text-white text-xs" />
            </div>
          </div>
          <div>
            <h3 className={`${theme.cardTitle} text-md`}>Recent Activity</h3>
            <p className={`${theme.cardText} text-xs`}>
              Connect to view your recent transactions
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletConnect;
