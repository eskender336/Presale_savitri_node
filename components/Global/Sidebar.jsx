import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useDisconnect, useConnect } from "wagmi";
import {
  FaDatabase,
  FaUserCircle,
  FaMoon,
  FaSun,
  FaGift,
  FaTint,
  FaLayerGroup,
  FaBroadcastTower,
  FaDollarSign,
  FaUser,
} from "react-icons/fa";
import { BsBank2 } from "react-icons/bs";

import { MdAdminPanelSettings, MdOutlineContactSupport } from "react-icons/md";
import { TbMathFunction } from "react-icons/tb";
import { PiHandWithdrawFill } from "react-icons/pi";

import { MdDashboard } from "react-icons/md";
import { BiImport, BiTransfer } from "react-icons/bi";
import { useWeb3 } from "../../context/Web3Provider";
import { useToast } from "../../context/ToastContext";

const TOKEN_NAME = process.env.NEXT_PUBLIC_TOKEN_NAME;
const TOKEN_SYMBOL = process.env.NEXT_PUBLIC_TOKEN_SYMBOL;
const OWNER_ADDRESS = process.env.NEXT_PUBLIC_OWNER_ADDRESS;

const Sidebar = ({
  isSidebarOpen,
  isDarkMode,
  setIsDarkMode,
  setIsSidebarOpen,
  setIsComponent,
}) => {
  const {
    provider,
    signer,
    contract,
    account,
    chainId,
    isConnected,
    isConnecting,
    contractInfo,
    tokenBalances,
    error,
    connectWallet,
    disconnectWallet,
    switchNetwork,
    buyWithBNB,
    buyWithUSDT,
    buyWithUSDC,

    updateTokenPrice,
    updateUSDT,
    updateUSDC,
    setSaleToken,
    setBlockStatus,
    withdrawTokens,
    getUserTransactions,
    getAllTransactions,
    formatAddress,
    formatTokenAmount,
    refreshContractData,
    isOwner,
  } = useWeb3();

  const { disconnect } = useDisconnect();
  const { connect, connectors } = useConnect();
  const { showInfo } = useToast();

  // console.log(tokenBalances);
  const [activeItem, setActiveItem] = React.useState("Dashboard");
  const [isAdmin, setIsAdmin] = useState(false);

  const navigationItems = [
    {
      name: "Dashboard",
      icon: MdDashboard,
      onClick: () => setIsComponent("Dashboard"),
    },
    {
      name: "User Dashboard",
      icon: FaUser,
      onClick: () => setIsComponent("User Dashboard"),
    },
    {
      name: "Token Documentation",
      icon: BiImport,
      onClick: () => setIsComponent("Token Documentation"),
    },
    {
      name: "Token Sale",
      icon: FaDollarSign,
      onClick: () => setIsComponent("Token Sale"),
    },
    {
      name: "Staking",
      icon: BsBank2,
      onClick: () => setIsComponent("Staking"),
    },
    {
      name: "Stablecoin Purchase",
      icon: FaBroadcastTower,
      onClick: () => setIsComponent("Stablecoin Purchase"),
    },
    {
      name: "Transaction",
      icon: FaTint,
      onClick: () => setIsComponent("Transaction"),
    },
    {
      name: "Token Transfer",
      icon: BiTransfer,
      onClick: () => setIsComponent("Token Transfer"),
    },
    {
      name: "Contact Us",
      icon: MdOutlineContactSupport,
      onClick: () => setIsComponent("Contact Us"),
    },
  ];

  const adminNavigationItems = [
    {
      name: "Admin",
      icon: MdAdminPanelSettings,
      onClick: () => setIsComponent("Admin Overview"),
    },
    {
      name: "Admin Functions",
      icon: TbMathFunction,
      onClick: () => setIsComponent("Admin Functions"),
    },
    {
      name: "Withdraw Tokens",
      icon: PiHandWithdrawFill,
      onClick: () => setIsComponent("Withdraw Tokens"),
    },
  ];

  // Improved isOwner function
  const checkIsOwner = useCallback(async () => {
    if (!contract || !account) {
      console.log("Contract or address not available yet");
      return false;
    }

    try {
      const ownerAddress = await contract.owner();
      const result = ownerAddress.toLowerCase() === account.toLowerCase();

      return result;
    } catch (error) {
      console.error("Error checking owner:", error);
      return false;
    }
  }, [contract, account]);

  // Effect to check ownership when dependencies change
  useEffect(() => {
    const checkOwnerStatus = async () => {
      try {
        // Only run the check if we have the required values
        if (contract && account) {
          const isOwnerResult = await checkIsOwner();
          setIsAdmin(isOwnerResult);
        }
      } catch (error) {
        console.error("Error in owner check effect:", error);
      }
    };

    checkOwnerStatus();
  }, [contract, account, checkIsOwner]);

  const handleDisconnect = async () => {
    try {
      disconnect();
      showInfo("Wallet disconnected successfully");
    } catch (error) {
      console.error("Error disconnecting wallet:", error);
    }
  };

  return (
    <aside
      className={`
        fixed lg:static left-0 top-0 h-screen w-64 z-40
        transform transition-transform duration-300 ease-in-out
        ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }
        flex flex-col
        ${isDarkMode ? "bg-[#12101A]" : "bg-[#F3F4F6] shadow-lg"}
        overflow-hidden
      `}
    >
      {/* / Logo Section - Fixed */}
      <div
        className={`flex-shrink-0 p-4 border-b  ${
          isDarkMode ? "border-gray-800" : "bg-[#F3F4F6] shadow-sm"
        } `}
      >
        {" "}
        <Link href="/">
          <div className="flex items-center gap-2">
            <img
              style={{
                width: "3rem",
              }}
              src={isDarkMode ? "/SavitriNetwork.png" : "/SavitriNetworkBlack.png"}
              alt=""
              srcset=""
            />

            <span
              className={`text-xl font-bold ${
                isDarkMode ? "text-white" : "text-gray-900"
              }`}
            >
              {TOKEN_NAME}
            </span>
          </div>{" "}
        </Link>
      </div>

      {/* Navigation Section - Scrollable */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
        {/* Regular Navigation */}
        <nav className="space-y-1 mb-6">
          <h5 className="text-xs uppercase text-gray-500 font-medium mb-2 pl-4">
            Main Navigation
          </h5>
          {navigationItems.map((item) => (
            <Link
              key={item.name}
              href="#"
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg ${
                activeItem === item.name
                  ? "hover:from-teal-500 hover:to-indigo-600"
                  : `${isDarkMode ? "text-gray-400" : "text-gray-600"} hover:bg-[#23ADAC] hover:bg-opacity-20 hover:text-[#4D4BE1]`
              }`}
              onClick={(e) => {
                e.preventDefault();
                if (window.innerWidth < 1024) {
                  setIsSidebarOpen(false);
                }
                setActiveItem(item.name);
                if (item.onClick) {
                  item.onClick();
                }
              }}
            >
              <item.icon
                  className={`w-5 h-5 ${
                    activeItem === item.name
                      ? isDarkMode
                        ? "text-white"
                        : "text-purple-600"
                      : ""
                  }`}
                />

              <span className={activeItem === item.name ? "text-light-gradient" : ""}>{item.name}</span>
            </Link>
          ))}
        </nav>

        {/* Admin Navigation */}
        {isAdmin && (
          <nav className="space-y-1">
            <h5 className="text-xs uppercase text-gray-500 font-medium mb-2 pl-4">
              Admin
            </h5>
            {adminNavigationItems.map((item) => (
              <Link
                key={item.name}
                href="#"
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg ${
                  activeItem === item.name
                    ? "hover:from-teal-500 hover:to-indigo-600"
                    : `${isDarkMode ? "text-gray-400" : "text-gray-600"} hover:bg-[#23ADAC] hover:bg-opacity-20 hover:text-[#4D4BE1]`
                }`}
                onClick={(e) => {
                  e.preventDefault();
                  if (window.innerWidth < 1024) {
                    setIsSidebarOpen(false);
                  }
                  setActiveItem(item.name);
                  if (item.onClick) {
                    item.onClick();
                  }
                }}
              >
                <item.icon className={`w-5 h-5 ${activeItem === item.name ? "text-white" : ""}`} />
                <span className={activeItem === item.name ? "text-light-gradient" : ""}>{item.name}</span>
              </Link>
            ))}
          </nav>
        )}
      </div>

      {/* User Profile Section - Fixed */}
      <div
        className={`flex-shrink-0 p-4 border-t ${
          isDarkMode ? "border-gray-800" : "bg-[#F3F4F6] shadow-sm"
        } `}
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 bg-[#616FED] rounded-full flex items-center justify-center overflow-hidden">
            <img
              className="w-8 h-8 object-cover"
              src="/avatar.png"
              alt="User avatar"
            />
          </div>
          <div>
            <div className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
              {formatAddress(account)}
            </div>
            <div className={isDarkMode ? "text-gray-500" : "text-gray-500"}>
              {tokenBalances?.SAV} {TOKEN_SYMBOL}
            </div>
          </div>
        </div>

        {account && (
          <button className="w-full text-light-gradient hover:from-teal-500 hover:to-indigo-600 text-white py-3 rounded-lg mb-2 text-sm  uppercase font-medium">
            {formatAddress(account)}
          </button>
        )}

        {account && (
          <button
            onClick={handleDisconnect}
            className={`w-full border py-3 rounded-lg text-sm uppercase font-medium mb-4
              ${
                isDarkMode
                  ? "border-gray-700 text-gray-400 hover:border-gray-600"
                  : "border-gray-300 text-gray-600 hover:border-gray-400"
              }`}
          >
            DISCONNECT
          </button>
        )}

        {/* Theme Toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => setIsDarkMode(true)}
            className={`p-3 rounded transition-colors flex-1 ${
              isDarkMode
                ? "text-light-gradient hover:from-teal-500 hover:to-indigo-600 text-white"
                : "text-gray-400 hover:bg-gray-100"
            }`}
          >
            <FaMoon className="w-5 h-5 mx-auto" />
          </button>
          <button
            onClick={() => setIsDarkMode(false)}
            className={`p-3 rounded transition-colors flex-1 ${
              !isDarkMode
                ? "text-light-gradient hover:from-teal-500 hover:to-indigo-600 text-white"
                : "text-gray-400 hover:bg-gray-800"
            }`}
          >
            <FaSun className="w-5 h-5 mx-auto" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
