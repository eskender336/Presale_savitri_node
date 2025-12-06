import React, { useState } from "react";
import Image from "next/image";

const SAV_ADDRESS = process.env.NEXT_PUBLIC_SAV_ADDRESS;
const EXPLORER_TOKEN_URL = process.env.NEXT_PUBLIC_EXPLORER_TOKEN_URL;

const TokenomicsComponent = ({ isDarkMode }) => {
  const [copiedAddress, setCopiedAddress] = useState(false);

  const formatAddress = (address) => {
    if (!address) return "";
    return `${address.substring(0, 12)}...${address.substring(
      address.length - 12
    )}`;
  };

  const copyToClipboard = () => {
    if (typeof navigator !== "undefined" && navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(SAV_ADDRESS);
    } else {
      const textarea = document.createElement("textarea");
      textarea.value = SAV_ADDRESS ?? "";
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  const bgGradient = isDarkMode
    ? "bg-gradient-to-b from-[#0F0B13] to-[#0A080D]"
    : "bg-gradient-to-b from-[#f3f3f7] to-[#eaeaf0]";

  const cardBg = isDarkMode ? "bg-[#14101A]/80" : "bg-white/60";
  const addressBg = isDarkMode ? "bg-[#181320]" : "bg-white";
  const addressTextColor = isDarkMode ? "text-teal-300" : "text-indigo-600";

  return (
    <div className={`w-full py-20 ${bgGradient}`}>
      <div className="container mx-auto px-4 md:px-6 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-block p-1.5 px-3 rounded-full text-light-gradient mb-4">
            <p className="text-sm font-medium bg-clip-text text-transparent text-light-gradient">
              Community Sale Token Allocation
            </p>
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold bg-clip-text text-transparent text-light-gradient mb-6">
            Tokenomics
          </h2>
          <p
            className={`text-lg max-w-2xl mx-auto ${
              isDarkMode ? "text-gray-400" : "text-gray-600"
            }`}
          >
            Savitri Network Tokenomics - Strategic distribution for sustainable growth
          </p>
          <div className="flex justify-center mt-8">
            <div className="w-16 h-1 text-light-gradient rounded-full"></div>
          </div>
        </div>

        {/* Main Card */}
        <div
          className={`${cardBg} backdrop-blur-sm rounded-2xl border ${
            isDarkMode ? "border-gray-800/20" : "border-gray-200"
          } shadow-xl shadow-indigo-500/5 p-8 md:p-10 max-w-5xl mx-auto`}
        >
          {/* Tokenomics Diagram (16:9, fills parent width) */}
          <div className="w-full mx-auto mb-12">
            <div className="relative w-full aspect-[16/9]">
              <Image
                src={"/tokenomics.jpg"}
                alt="Savitri Network Tokenomics Chart"
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1280px) 80vw, 800px"
                className="object-contain drop-shadow-lg transition-transform duration-500 hover:scale-105"
                priority
              />
              {/* If you're on Next <=12, replace `fill` with layout="fill" and className with objectFit="contain" */}
            </div>
          </div>

          {/* Contract Address */}
          <div className="flex flex-col items-center mb-10">
            <p className={`${isDarkMode ? "text-gray-400" : "text-gray-600"} mb-3`}>
              Smart Contract Address
            </p>
            <div className="flex items-center space-x-2 mb-2">
              <div className={`flex items-center space-x-2 ${addressBg} px-6 py-3 rounded-full shadow-md`}>
                <span className={`${addressTextColor} text-sm md:text-base font-mono`}>
                  {formatAddress(SAV_ADDRESS)}
                </span>
                <button
                  onClick={copyToClipboard}
                  className={`group relative ${
                    isDarkMode ? "text-teal-400 hover:text-teal-300" : "text-indigo-500 hover:text-indigo-400"
                  } transition-colors`}
                >
                  {copiedAddress ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                      <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                    </svg>
                  )}
                  <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    {copiedAddress ? "Copied!" : "Copy address"}
                  </span>
                </button>
              </div>
            </div>
            <p className="text-xs text-gray-500 mb-6">
              Always verify the contract address before interacting
            </p>

            {/* View Contract Button */}
            <a
              href={`${EXPLORER_TOKEN_URL}${SAV_ADDRESS}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-8 py-3 rounded-full text-light-gradient text-white font-medium shadow-lg shadow-indigo-500/20 transition-transform duration-300 hover:scale-105 hover:shadow-xl hover:shadow-indigo-500/30"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z"
                  clipRule="evenodd"
                />
              </svg>
              View Contract
            </a>
          </div>

          {/* Key Points */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className={`p-6 rounded-xl ${isDarkMode ? "bg-[#181320]/60" : "bg-white/60"} backdrop-blur-sm`}>
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-teal-400/20 to-indigo-500/20 flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className={`text-xl font-bold mb-2 ${isDarkMode ? "text-white" : "text-gray-800"}`}>Total Supply</h3>
              <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
                2,000,000,000 tokens with deflationary mechanisms to ensure long-term value
              </p>
            </div>

            <div className={`p-6 rounded-xl ${isDarkMode ? "bg-[#181320]/60" : "bg-white/60"} backdrop-blur-sm`}>
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-teal-400/20 to-indigo-500/20 flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className={`text-xl font-bold mb-2 ${isDarkMode ? "text-white" : "text-gray-800"}`}>Vesting Schedule</h3>
              <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
                Strategic vesting to ensure market stability and long-term project development
              </p>
            </div>

            <div className={`p-6 rounded-xl ${isDarkMode ? "bg-[#181320]/60" : "bg-white/60"} backdrop-blur-sm`}>
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-teal-400/20 to-indigo-500/20 flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className={`text-xl font-bold mb-2 ${isDarkMode ? "text-white" : "text-gray-800"}`}>Utility</h3>
              <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
                Governance, staking rewards, network fees, and access to premium Savitri Network features
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TokenomicsComponent;
