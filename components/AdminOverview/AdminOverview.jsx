import React, { useState, useEffect } from "react";
import {
  FaCoins,
  FaDollarSign,
  FaUsers,
  FaExchangeAlt,
  FaHistory,
  FaWallet,
  FaEthereum,
  FaSyncAlt,
} from "react-icons/fa";
import { SiTether } from "react-icons/si";
import { useWeb3 } from "../../context/Web3Provider";
import { Header } from "../index";

const TOKEN_NAME = process.env.NEXT_PUBLIC_TOKEN_NAME;
const TOKEN_SYMBOL = process.env.NEXT_PUBLIC_TOKEN_SYMBOL;
const TOKEN_SUPPLY = process.env.NEXT_PUBLIC_TOKEN_SUPPLY;
const PER_TOKEN_USD_PRICE = process.env.NEXT_PUBLIC_PER_TOKEN_USD_PRICE;
const NEXT_PER_TOKEN_USD_PRICE =
  process.env.NEXT_PUBLIC_NEXT_PER_TOKEN_USD_PRICE;
const CURRENCY = process.env.NEXT_PUBLIC_CURRENCY;
const BLOCKCHAIN = process.env.NEXT_PUBLIC_BLOCKCHAIN;

const AdminOverview = ({ isDarkMode }) => {
  const {
    account,
    isConnected,
    isConnecting,
    contractInfo,
    tokenBalances,
    error,
    connectWallet,
    disconnectWallet,
    switchNetwork,
    buyWithETH,
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

    refreshContractData,
    isOwner,
  } = useWeb3();
  // State for contract data
  const [loading, setLoading] = useState(true);
  console.log(contractInfo);
  const [transactions, setTransactions] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");

  // Theme configuration
  const theme = {
    cardBg: isDarkMode ? "bg-[#12101A]" : "bg-white",
    innerBg: isDarkMode ? "bg-[#1A1825]" : "bg-gray-100",
    footerBg: isDarkMode ? "bg-[#0D0B12]" : "bg-gray-50",
    text: isDarkMode ? "text-white" : "text-gray-900",
    textSecondary: isDarkMode ? "text-gray-400" : "text-gray-600",
    border: isDarkMode ? "border-gray-800" : "border-gray-200",
    hover: isDarkMode ? "hover:bg-gray-800/30" : "hover:bg-gray-100",
    tableBorder: isDarkMode ? "border-gray-800" : "border-gray-200",
    typeSuccess: isDarkMode
      ? "bg-green-900/30 text-green-400"
      : "bg-green-100 text-green-600",
    typeInfo: isDarkMode
      ? "bg-blue-900/30 text-blue-400"
      : "bg-blue-100 text-blue-600",
  };

  // Fetch data from contract (simulated here)
  useEffect(() => {
    const fetchContractInfo = async () => {
      if (account) {
        const transactionArray = await getAllTransactions();
        console.log(transactionArray);
        setTransactions(transactionArray.reverse());
        setLoading(false);
        try {
        } catch (error) {
          console.log(account);
          setLoading(false);
        }
      }
    };

    fetchContractInfo();
  }, [account]);

  // Helper function to format token amounts based on decimals
  const formatTokenAmount = (amount, decimals = 18) => {
    const divisor = Math.pow(10, decimals);
    return (parseFloat(amount) / divisor).toLocaleString();
  };

  // Helper function to format addresses
  const formatAddress = (address) => {
    if (!address || address === "0x0000000000000000000000000000000000000000")
      return "ETH";
    return `${address.substring(0, 6)}...${address.substring(
      address.length - 4
    )}`;
  };

  // Helper function to format timestamps
  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  // Helper function to determine token name
  const getTokenName = (address) => {
    if (!address || address === "0x0000000000000000000000000000000000000000")
      return "ETH";
    if (address === contractInfo.usdtAddress) return "USDT";
    if (address === contractInfo.usdcAddress) return "USDC";
    if (address === contractInfo.fsxAddress) return `${TOKEN_SYMBOL}`;
    return formatAddress(address);
  };

  /// Helper function to get token icon
  const getTokenIcon = (address) => {
    if (!address || address === "0x0000000000000000000000000000000000000000") {
      return <FaEthereum className="text-[#627EEA]" />;
    }
    if (address === contractInfo.usdtAddress) {
      return <SiTether className="text-green-500" />;
    }
    if (address === contractInfo.usdcAddress) {
      return (
        <span className="text-blue-500">
          {" "}
          <img
            src="/usdc.svg"
            style={{
              width: ".9rem",
            }}
          />
        </span>
      );
    }
    return (
      <span className="text-blue-500">
        {" "}
        <img
          src="/SavitriNetwork.png"
          style={{
            width: ".9rem",
          }}
        />
      </span>
    );
  };

  // Format large numbers with K, M, B suffixes
  const formatLargeNumber = (num) => {
    if (!num) return "0";

    // Convert to number if it's a string
    const value = Number(num);

    // Handle different magnitudes
    if (value >= 1e9) {
      // Billions
      return (value / 1e9).toFixed(2) + " B";
    } else if (value >= 1e6) {
      // Millions
      return (value / 1e6).toFixed(2) + " M";
    } else if (value >= 1e3) {
      // Thousands
      return (value / 1e3).toFixed(2) + " K";
    } else {
      // Regular number
      return value.toFixed(2);
    }
  };

  const tabs = [
    { id: "overview", icon: <FaCoins />, label: "Overview" },
    { id: "prices", icon: <FaDollarSign />, label: "Prices & Ratios" },
    { id: "balances", icon: <FaWallet />, label: "Token Balances" },
    { id: "transactions", icon: <FaHistory />, label: "Transactions" },
  ];

  return (
    <>
      {/* Header */}
      <Header theme={theme} title="Admin" />
      <div className={`${theme.cardBg} rounded-xl shadow-lg overflow-hidden`}>
        <div
          className={`p-4 sm:p-6 border-b ${theme.border} flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center`}
        >
          <h1 className={`text-xl sm:text-2xl font-bold ${theme.text}`}>
            {/* Admin Contract Overview */}
          </h1>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 bg-gradient-to-r from-teal-400 to-indigo-500 hover:from-teal-500 hover:to-indigo-600 text-white px-4 py-2 rounded-lg transition-colors text-sm sm:text-base"
          >
            <FaSyncAlt />
            <span>Refresh Data</span>
          </button>
        </div>

        {/* Tab Navigation */}
        <div
          className={`flex overflow-x-auto scrollbar-hide border-b ${theme.border}`}
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-gradient-to-r from-teal-400 to-indigo-500 hover:from-teal-500 hover:to-indigo-600 text-white"
                  : `${theme.textSecondary} ${theme.hover}`
              }`}
            >
              <span className="block">{tab.icon}</span>
              <span className="hidden sm:block">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="p-8 flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
          </div>
        ) : (
          <>
            {/* Tab Content */}
            <div className="p-4 sm:p-6">
              {/* Overview Tab */}
              {activeTab === "overview" && (
                <div className="space-y-4 sm:space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    {/* Token Address Card */}
                    <div className={`${theme.innerBg} rounded-xl p-3 sm:p-4`}>
                      <div
                        className={`flex items-center gap-2 ${theme.textSecondary} mb-2`}
                      >
                        <FaCoins className="text-[#9761F4]" />
                        <span>Sale Token</span>
                      </div>
                      <div
                        className={`${theme.text} text-xs sm:text-sm overflow-hidden overflow-ellipsis`}
                      >
                        {contractInfo.fsxAddress}
                      </div>
                    </div>

                    {/* Total Sold Card */}
                    <div className={`${theme.innerBg} rounded-xl p-3 sm:p-4`}>
                      <div
                        className={`flex items-center gap-2 ${theme.textSecondary} mb-2`}
                      >
                        <FaExchangeAlt className="text-[#9761F4]" />
                        <span>Total Tokens Sold</span>
                      </div>
                      <div
                        className={`${theme.text} font-bold text-lg sm:text-xl`}
                      >
                        {formatLargeNumber(contractInfo.totalSold)}{" "}
                        {TOKEN_SYMBOL}
                      </div>
                    </div>

                    {/* USDT Address Card */}
                    <div className={`${theme.innerBg} rounded-xl p-3 sm:p-4`}>
                      <div
                        className={`flex items-center gap-2 ${theme.textSecondary} mb-2`}
                      >
                        <SiTether className="text-green-500" />
                        <span>USDT Address</span>
                      </div>
                      <div
                        className={`${theme.text} text-xs sm:text-sm overflow-hidden overflow-ellipsis`}
                      >
                        {contractInfo.usdtAddress}
                      </div>
                    </div>

                    {/* USDC Address Card */}
                    <div className={`${theme.innerBg} rounded-xl p-3 sm:p-4`}>
                      <div
                        className={`flex items-center gap-2 ${theme.textSecondary} mb-2`}
                      >
                        <span className="text-blue-500">
                          <img
                            src="/usdc.svg"
                            style={{
                              width: "1rem",
                            }}
                          />
                        </span>
                        <span>USDC Address</span>
                      </div>
                      <div
                        className={`${theme.text} text-xs sm:text-sm overflow-hidden overflow-ellipsis`}
                      >
                        {contractInfo.usdcAddress}
                      </div>
                    </div>
                  </div>

                  {/* Contract Status */}
                  <div className={`${theme.innerBg} rounded-xl p-4 sm:p-6`}>
                    <h2
                      className={`text-lg sm:text-xl font-bold ${theme.text} mb-3 sm:mb-4`}
                    >
                      Contract Status
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                      <div>
                        <h3 className={`${theme.textSecondary} mb-2`}>
                          Token Balance
                        </h3>
                        <p
                          className={`${theme.text} font-bold text-lg sm:text-xl`}
                        >
                          {formatLargeNumber(tokenBalances?.fsxBalance)}{" "}
                          {TOKEN_SYMBOL}
                        </p>
                      </div>
                      <div>
                        <h3 className={`${theme.textSecondary} mb-2`}>
                          Total Penalty
                        </h3>
                        <p
                          className={`${theme.text} font-bold text-lg sm:text-xl`}
                        >
                          {formatLargeNumber(tokenBalances?.totalPenalty)}{" "}
                          {TOKEN_SYMBOL}
                        </p>
                      </div>
                      <div>
                        <h3 className={`${theme.textSecondary} mb-2`}>
                          Total Sales
                        </h3>
                        <p
                          className={`${theme.text} font-bold text-lg sm:text-xl`}
                        >
                          {
                            transactions.filter(
                              (tx) => tx.transactionType === "BUY"
                            ).length
                          }
                        </p>
                      </div>
                      <div>
                        <h3 className={`${theme.textSecondary} mb-2`}>
                          Recent Activity
                        </h3>
                        <p
                          className={`${theme.text} font-bold text-lg sm:text-xl`}
                        >
                          {transactions.length > 0
                            ? formatTimestamp(transactions[0].timestamp)
                            : "No recent activity"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Prices & Ratios Tab */}
              {activeTab === "prices" && (
                <div className="space-y-4 sm:space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    {/* Token Prices */}
                    <div className={`${theme.innerBg} rounded-xl p-4 sm:p-6`}>
                      <h2
                        className={`text-lg sm:text-xl font-bold ${theme.text} mb-3 sm:mb-4`}
                      >
                        Token Prices
                      </h2>
                      <div className="space-y-4">
                        <div>
                          <h3 className={`${theme.textSecondary} mb-2`}>
                            Token Price ({CURRENCY})
                          </h3>
                          <p
                            className={`${theme.text} font-bold text-lg sm:text-xl`}
                          >
                            {contractInfo.ethPrice} {CURRENCY}
                          </p>
                        </div>
                        <div>
                          <h3 className="text-gray-400 mb-2">
                            Stablecoin Price (ETH)
                          </h3>
                          <p className="text-white font-bold text-lg sm:text-xl">
                            {contractInfo.stablecoinPrice} ETH
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Token Ratios */}
                    <div className={`${theme.innerBg} rounded-xl p-4 sm:p-6`}>
                      <h2
                        className={`text-lg sm:text-xl font-bold ${theme.text} mb-3 sm:mb-4`}
                      >
                        Token Ratios
                      </h2>
                      <div className="space-y-4">
                        <div>
                          <h3 className={`${theme.textSecondary} mb-2`}>
                            USDT to Token Ratio
                          </h3>
                          <p
                            className={`${theme.text} font-bold text-lg sm:text-xl`}
                          >
                            1 USDT = {contractInfo.usdtTokenRatio} Tokens
                          </p>
                        </div>
                        <div>
                          <h3 className={`${theme.textSecondary} mb-2`}>
                            USDC to Token Ratio
                          </h3>
                          <p
                            className={`${theme.text} font-bold text-lg sm:text-xl`}
                          >
                            1 USDC = {contractInfo.usdcTokenRatio} Tokens
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Token Balances Tab */}
              {activeTab === "balances" && (
                <div className="space-y-4 sm:space-y-6">
                  <div className={`${theme.innerBg} rounded-xl p-4 sm:p-6`}>
                    <h2
                      className={`text-lg sm:text-xl font-bold ${theme.text} mb-3 sm:mb-4`}
                    >
                      Contract Token Balances
                    </h2>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className={`border-b ${theme.tableBorder}`}>
                            <th
                              className={`px-3 py-2 sm:px-4 sm:py-3 ${theme.textSecondary} text-sm`}
                            >
                              Token
                            </th>
                            <th
                              className={`px-3 py-2 sm:px-4 sm:py-3 ${theme.textSecondary} text-sm`}
                            >
                              Balance
                            </th>
                            <th
                              className={`px-3 py-2 sm:px-4 sm:py-3 ${theme.textSecondary} text-sm hidden sm:table-cell`}
                            >
                              Address
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className={`border-b ${theme.tableBorder}`}>
                            <td
                              className={`px-3 py-2 sm:px-4 sm:py-3 ${theme.text} text-sm`}
                            >
                              <div className="flex items-center gap-2">
                                <FaCoins className="text-[#9761F4]" />
                                <span>
                                  {TOKEN_NAME} ({TOKEN_SYMBOL})
                                </span>
                              </div>
                            </td>
                            <td
                              className={`px-3 py-2 sm:px-4 sm:py-3 ${theme.text} text-sm`}
                            >
                              {formatLargeNumber(tokenBalances.fsxBalance)}
                            </td>
                            <td
                              className={`px-3 py-2 sm:px-4 sm:py-3 ${theme.textSecondary} text-xs hidden sm:table-cell`}
                            >
                              {contractInfo.fsxAddress}
                            </td>
                          </tr>
                          <tr className={`border-b ${theme.tableBorder}`}>
                            <td
                              className={`px-3 py-2 sm:px-4 sm:py-3 ${theme.text} text-sm`}
                            >
                              <div className="flex items-center gap-2">
                                <SiTether className="text-green-500" />
                                <span>USDT</span>
                              </div>
                            </td>
                            <td
                              className={`px-3 py-2 sm:px-4 sm:py-3 ${theme.text} text-sm`}
                            >
                              {formatLargeNumber(tokenBalances.usdtBalance)}
                            </td>
                            <td
                              className={`px-3 py-2 sm:px-4 sm:py-3 ${theme.textSecondary} text-xs hidden sm:table-cell`}
                            >
                              {contractInfo.usdtAddress}
                            </td>
                          </tr>
                          <tr className={`border-b ${theme.tableBorder}`}>
                            <td
                              className={`px-3 py-2 sm:px-4 sm:py-3 ${theme.text} text-sm`}
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-blue-500">
                                  <img
                                    src="/usdc.svg"
                                    style={{
                                      width: "1rem",
                                    }}
                                  />
                                </span>
                                <span>USDC</span>
                              </div>
                            </td>
                            <td
                              className={`px-3 py-2 sm:px-4 sm:py-3 ${theme.text} text-sm`}
                            >
                              {formatLargeNumber(tokenBalances.usdcBalance)}
                            </td>
                            <td
                              className={`px-3 py-2 sm:px-4 sm:py-3 ${theme.textSecondary} text-xs hidden sm:table-cell`}
                            >
                              {contractInfo.usdcAddress}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Transactions Tab */}
              {activeTab === "transactions" && (
                <div className="space-y-4 sm:space-y-6">
                  <div className={`${theme.innerBg} rounded-xl p-4 sm:p-6`}>
                    <h2
                      className={`text-lg sm:text-xl font-bold ${theme.text} mb-3 sm:mb-4`}
                    >
                      All Transactions
                    </h2>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className={`border-b ${theme.tableBorder}`}>
                            <th
                              className={`px-2 py-2 sm:px-4 sm:py-3 ${theme.textSecondary} text-xs sm:text-sm`}
                            >
                              Time
                            </th>
                            <th
                              className={`px-2 py-2 sm:px-4 sm:py-3 ${theme.textSecondary} text-xs sm:text-sm hidden sm:table-cell`}
                            >
                              User
                            </th>
                            <th
                              className={`px-2 py-2 sm:px-4 sm:py-3 ${theme.textSecondary} text-xs sm:text-sm`}
                            >
                              Type
                            </th>
                            <th
                              className={`px-2 py-2 sm:px-4 sm:py-3 ${theme.textSecondary} text-xs sm:text-sm`}
                            >
                              From
                            </th>
                            <th
                              className={`px-2 py-2 sm:px-4 sm:py-3 ${theme.textSecondary} text-xs sm:text-sm`}
                            >
                              To
                            </th>
                            <th
                              className={`px-2 py-2 sm:px-4 sm:py-3 ${theme.textSecondary} text-xs sm:text-sm hidden md:table-cell`}
                            >
                              Amount In
                            </th>
                            <th
                              className={`px-2 py-2 sm:px-4 sm:py-3 ${theme.textSecondary} text-xs sm:text-sm`}
                            >
                              Amount Out
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {transactions.map((tx, index) => (
                            <tr
                              key={index}
                              className={`border-b ${theme.tableBorder}`}
                            >
                              <td
                                className={`px-2 py-2 sm:px-4 sm:py-3 ${theme.text} text-xs sm:text-sm whitespace-nowrap`}
                              >
                                {new Date(tx.timestamp).toLocaleTimeString()}
                              </td>
                              <td
                                className={`px-2 py-2 sm:px-4 sm:py-3 ${theme.text} text-xs sm:text-sm hidden sm:table-cell`}
                              >
                                {formatAddress(tx.user)}
                              </td>
                              <td className="px-2 py-2 sm:px-4 sm:py-3">
                                <span
                                  className={`px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full text-xs ${
                                    tx.transactionType === "BUY"
                                      ? theme.typeSuccess
                                      : theme.typeInfo
                                  }`}
                                >
                                  {tx.transactionType}
                                </span>
                              </td>
                              <td
                                className={`px-2 py-2 sm:px-4 sm:py-3 ${theme.text} text-xs sm:text-sm`}
                              >
                                <div className="flex items-center gap-1 sm:gap-2">
                                  {getTokenIcon(tx.tokenInAddress)}
                                  <span>{getTokenName(tx.tokenInAddress)}</span>
                                </div>
                              </td>
                              <td
                                className={`px-2 py-2 sm:px-4 sm:py-3 ${theme.text} text-xs sm:text-sm`}
                              >
                                <div className="flex items-center gap-1 sm:gap-2">
                                  {getTokenIcon(tx.tokenOutAddress)}
                                  <span>
                                    {getTokenName(tx.tokenOutAddress)}
                                  </span>
                                </div>
                              </td>
                              <td
                                className={`px-2 py-2 sm:px-4 sm:py-3 ${theme.text} text-xs sm:text-sm hidden md:table-cell whitespace-nowrap`}
                              >
                                {tx.tokenIn ===
                                "0x0000000000000000000000000000000000000000"
                                  ? tx.amountIn + " ETH"
                                  : tx.amountIn +
                                    " " +
                                    getTokenName(tx.tokenInAddress)}
                              </td>
                              <td
                                className={`px-2 py-2 sm:px-4 sm:py-3 ${theme.text} text-xs sm:text-sm whitespace-nowrap`}
                              >
                                {tx.tokenOutAddress === contractInfo.fsxAddress
                                  ? tx.amountOut + `${TOKEN_SYMBOL}`
                                  : tx.amountOut +
                                    " " +
                                    getTokenName(tx.tokenOutAddress)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Footer with status */}
        <div
          className={`${theme.footerBg} px-4 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0 border-t ${theme.border}`}
        >
          <div className={`${theme.textSecondary} text-xs sm:text-sm`}>
            <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-2"></span>
            Connected to contract
          </div>
          <div className={`${theme.textSecondary} text-xs sm:text-sm`}>
            Last updated: {new Date().toLocaleString()}
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminOverview;
