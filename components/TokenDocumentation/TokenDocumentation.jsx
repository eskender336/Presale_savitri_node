import React, { useState } from "react";
import {
  FaTimes,
  FaShieldAlt,
  FaLock,
  FaUserCheck,
  FaWhale,
} from "react-icons/fa";
import { Header } from "../index";

const TokenDocumentation = ({ onClose, isDarkMode }) => {
  const [activeTab, setActiveTab] = useState("overview");

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "tokenomics", label: "Tokenomics" },
    { id: "roadmap", label: "Roadmap" },
    { id: "howToBuy", label: "How to Buy" },
    { id: "security", label: "Security" },
  ];

  // Theme configuration
  const theme = {
    bg: isDarkMode ? "bg-[#0D0B12]" : "bg-gray-100",
    cardBg: isDarkMode ? "bg-[#1A1825]" : "bg-white",
    text: isDarkMode ? "text-white" : "text-gray-900",
    textSecondary: isDarkMode ? "text-gray-400" : "text-gray-600",
    border: isDarkMode ? "border-gray-800" : "border-gray-200",
    activeTab: isDarkMode ? "text-[#9761F4]" : "text-[#9761F4]",
    activeTabBorder: isDarkMode ? "bg-[#9761F4]" : "bg-[#9761F4]",
    hoverText: isDarkMode ? "hover:text-gray-300" : "hover:text-gray-700",
  };

  const TabContent = {
    overview: (
      <div className="space-y-8">
        <div>
          <h2 className={`text-2xl font-bold ${theme.text} mb-4`}>
            About the Project
          </h2>
          <p className={theme.textSecondary + " leading-relaxed"}>
            Our token project aims to revolutionize the DeFi space by providing
            innovative solutions for decentralized finance. With a focus on
            security, scalability, and user experience, we're building the
            future of financial technology.
          </p>
        </div>

        <div>
          <h2 className={`text-2xl font-bold ${theme.text} mb-4`}>
            Key Features
          </h2>
          <ul className={`space-y-2 ${theme.textSecondary}`}>
            <li>• Automated yield generation</li>
            <li>• Deflationary tokenomics</li>
            <li>• Community governance</li>
            <li>• Cross-chain compatibility</li>
          </ul>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className={`${theme.cardBg} rounded-xl p-6`}>
            <h3 className={`${theme.textSecondary} mb-2`}>Token Name</h3>
            <p className={theme.text}>PROJECT TOKEN</p>
          </div>
          <div className={`${theme.cardBg} rounded-xl p-6`}>
            <h3 className={`${theme.textSecondary} mb-2`}>Token Symbol</h3>
            <p className={theme.text}>PRJ</p>
          </div>
          <div className={`${theme.cardBg} rounded-xl p-6`}>
            <h3 className={`${theme.textSecondary} mb-2`}>Total Supply</h3>
            <p className={theme.text}>1,000,000,000 PRJ</p>
          </div>
          <div className={`${theme.cardBg} rounded-xl p-6`}>
            <h3 className={`${theme.textSecondary} mb-2`}>Initial Price</h3>
            <p className={theme.text}>$0.001 USD</p>
          </div>
        </div>
      </div>
    ),

    tokenomics: (
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h2 className={`text-2xl font-bold ${theme.text} mb-6`}>
              Token Distribution
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className={theme.textSecondary}>Presale Allocation</span>
                <span className={theme.text}>40%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className={theme.textSecondary}>Liquidity Pool</span>
                <span className="text-green-400">30%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className={theme.textSecondary}>Team & Development</span>
                <span className="text-[#9761F4]">15%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className={theme.textSecondary}>Marketing</span>
                <span className="text-yellow-400">10%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className={theme.textSecondary}>Reserve</span>
                <span className="text-red-400">5%</span>
              </div>
            </div>
          </div>

          <div>
            <h2 className={`text-2xl font-bold ${theme.text} mb-6`}>
              Token Metrics
            </h2>
            <div className="space-y-4">
              <div className={`${theme.cardBg} rounded-xl p-4`}>
                <h3 className={`${theme.textSecondary} mb-1`}>Soft Cap</h3>
                <p className={theme.text}>500 ETH</p>
              </div>
              <div className={`${theme.cardBg} rounded-xl p-4`}>
                <h3 className={`${theme.textSecondary} mb-1`}>Hard Cap</h3>
                <p className={theme.text}>1000 ETH</p>
              </div>
              <div className={`${theme.cardBg} rounded-xl p-4`}>
                <h3 className={`${theme.textSecondary} mb-1`}>Minimum Buy</h3>
                <p className={theme.text}>0.1 ETH</p>
              </div>
              <div className={`${theme.cardBg} rounded-xl p-4`}>
                <h3 className={`${theme.textSecondary} mb-1`}>Maximum Buy</h3>
                <p className={theme.text}>5 ETH</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    ),

    roadmap: (
      <div className="space-y-12">
        <div>
          <h3 className="text-xl text-[#9761F4] mb-4">Phase 1 - Q1 2024</h3>
          <ul className={`space-y-2 ${theme.textSecondary}`}>
            <li>• Token development and smart contract audit</li>
            <li>• Website and whitepaper launch</li>
            <li>• Community building and social media presence</li>
          </ul>
        </div>

        <div>
          <h3 className="text-xl text-[#9761F4] mb-4">Phase 2 - Q2 2024</h3>
          <ul className={`space-y-2 ${theme.textSecondary}`}>
            <li>• Token presale launch</li>
            <li>• DEX listing and liquidity pool creation</li>
            <li>• Marketing campaign rollout</li>
          </ul>
        </div>

        <div>
          <h3 className="text-xl text-[#9761F4] mb-4">Phase 3 - Q3 2024</h3>
          <ul className={`space-y-2 ${theme.textSecondary}`}>
            <li>• Platform development</li>
            <li>• Partnership announcements</li>
            <li>• CEX listings</li>
          </ul>
        </div>
      </div>
    ),

    howToBuy: (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className={`${theme.cardBg} rounded-xl p-6`}>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-8 h-8 text-light-gradient hover:from-teal-500 hover:to-indigo-600 rounded-full flex items-center justify-center text-white">
              1
            </div>
            <h3 className={`${theme.text} text-lg`}>Create a Wallet</h3>
          </div>
          <p className={theme.textSecondary}>
            Download and install MetaMask or any other compatible Web3 wallet.
            Create a new wallet or import your existing one.
          </p>
        </div>

        <div className={`${theme.cardBg} rounded-xl p-6`}>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-8 h-8 text-light-gradient hover:from-teal-500 hover:to-indigo-600 rounded-full flex items-center justify-center text-white">
              2
            </div>
            <h3 className={`${theme.text} text-lg`}>Get ETH</h3>
          </div>
          <p className={theme.textSecondary}>
            Purchase ETH from an exchange and transfer it to your wallet
            address.
          </p>
        </div>

        <div className={`${theme.cardBg} rounded-xl p-6`}>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-8 h-8 text-light-gradient hover:from-teal-500 hover:to-indigo-600 rounded-full flex items-center justify-center text-white">
              3
            </div>
            <h3 className={`${theme.text} text-lg`}>Connect Wallet</h3>
          </div>
          <p className={theme.textSecondary}>
            Visit our presale website and connect your wallet by clicking the
            "Connect Wallet" button.
          </p>
        </div>

        <div className={`${theme.cardBg} rounded-xl p-6`}>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-8 h-8 text-light-gradient hover:from-teal-500 hover:to-indigo-600 rounded-full flex items-center justify-center text-white">
              4
            </div>
            <h3 className={`${theme.text} text-lg`}>Purchase Tokens</h3>
          </div>
          <p className={theme.textSecondary}>
            Enter the amount of ETH you want to invest and confirm the
            transaction in your wallet.
          </p>
        </div>
      </div>
    ),

    security: (
      <div className="space-y-8">
        <div>
          <h2 className={`text-2xl font-bold ${theme.text} mb-6`}>
            Security Measures
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className={`${theme.cardBg} rounded-xl p-6`}>
              <h3 className={`${theme.text} text-lg mb-2`}>
                Smart Contract Audit
              </h3>
              <p className={theme.textSecondary}>
                Our smart contracts have been thoroughly audited by leading
                blockchain security firms to ensure maximum safety.
              </p>
            </div>

            <div className={`${theme.cardBg} rounded-xl p-6`}>
              <h3 className={`${theme.text} text-lg mb-2`}>Locked Liquidity</h3>
              <p className={theme.textSecondary}>
                Liquidity will be locked for 2 years to ensure long-term
                stability and prevent rug pulls.
              </p>
            </div>

            <div className={`${theme.cardBg} rounded-xl p-6`}>
              <h3 className={`${theme.text} text-lg mb-2`}>KYC Verification</h3>
              <p className={theme.textSecondary}>
                Team has completed KYC verification with a reputable third-party
                provider.
              </p>
            </div>

            <div className={`${theme.cardBg} rounded-xl p-6`}>
              <h3 className={`${theme.text} text-lg mb-2`}>
                Anti-Whale Measures
              </h3>
              <p className={theme.textSecondary}>
                Maximum transaction and wallet holding limits to prevent market
                manipulation.
              </p>
            </div>
          </div>
        </div>

        <div>
          <h2 className={`text-2xl font-bold ${theme.text} mb-6`}>
            Additional Security Features
          </h2>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <FaShieldAlt className="text-[#9761F4] w-6 h-6" />
              <div>
                <h3 className={`${theme.text} text-lg`}>
                  Multi-Signature Wallet
                </h3>
                <p className={theme.textSecondary}>
                  All team wallets and major protocol functions require
                  multi-sig authorization.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <FaLock className="text-[#9761F4] w-6 h-6" />
              <div>
                <h3 className={`${theme.text} text-lg`}>Vesting Schedule</h3>
                <p className={theme.textSecondary}>
                  Team tokens are locked with a transparent vesting schedule.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <FaShieldAlt className="text-[#9761F4] w-6 h-6" />
              <div>
                <h3 className={`${theme.text} text-lg`}>Emergency Pause</h3>
                <p className={theme.textSecondary}>
                  Smart contract includes emergency pause functionality for
                  additional security.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
  };

  return (
    <>
      <Header theme={theme} title="Documentation" />
      <div className={`min-h-screen ${theme.bg} ${theme.text} `}>
        <div className="">
          {/* Header with exit instructions */}
          <div className="text-center mb-8">
            <p className={`${theme.textSecondary} text-sm mb-4`}>
              White paper
              <span
                className={`${
                  isDarkMode ? "bg-gray-800" : "bg-gray-200"
                } px-2 py-1 rounded`}
              >
                SAV
              </span>
            </p>
            <h1 className={`text-3xl font-bold mb-2 ${theme.text}`}>
              Token Project Documentation
            </h1>
          </div>

          {/* Navigation Tabs */}

          <div className={`flex border-b ${theme.border} mb-8 overflow-x-auto`}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-4 px-3 whitespace-nowrap relative ${
                  activeTab === tab.id
                    ? theme.activeTab
                    : theme.textSecondary + " " + theme.hoverText
                } text-sm md:text-base`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <div
                    className={`absolute bottom-0 left-0 right-0 h-0.5 ${theme.activeTabBorder}`}
                  ></div>
                )}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="py-6">{TabContent[activeTab]}</div>
        </div>
      </div>
    </>
  );
};

export default TokenDocumentation;
