import { useState, useEffect } from "react";
import Link from "next/link";
import {
  FaMoon,
  FaSun,
  FaTwitter,
  FaDatabase,
  FaGift,
  FaDollarSign,
  FaLayerGroup,
  FaBroadcastTower,
  FaTint,
  FaMedal,
  FaUserCircle,
  FaBars,
  FaTimes,
  FaClock,
  FaWallet,
  FaCheckCircle,
  FaArrowUp,
} from "react-icons/fa";

import { MdDashboard } from "react-icons/md";
import { BiImport } from "react-icons/bi";
import { useWeb3 } from "../../context/Web3Provider";
import { Header } from "../index";
import { ethers } from "ethers";

const TOKEN_NAME = process.env.NEXT_PUBLIC_TOKEN_NAME;
const TOKEN_SYMBOL = process.env.NEXT_PUBLIC_TOKEN_SYMBOL;
const TOKEN_SUPPLY = process.env.NEXT_PUBLIC_TOKEN_SUPPLY;
const CURRENCY = process.env.NEXT_PUBLIC_CURRENCY;

const Dashboard = ({ isDarkMode, setIsComponen }) => {
  // Theme configuration
  const theme = {
    bg: isDarkMode ? "bg-[#0D0B12]" : "bg-gray-100",
    header: isDarkMode ? "bg-[#12101A]" : "bg-white",
    card: isDarkMode ? "bg-[#12101A]" : "bg-white",
    text: isDarkMode ? "text-white" : "text-gray-900",
    textSecondary: isDarkMode ? "text-gray-400" : "text-gray-500",
    border: isDarkMode ? "border-gray-800" : "border-gray-200",
    divide: isDarkMode ? "divide-gray-800" : "divide-gray-200",
    shadow: isDarkMode ? "" : "shadow-lg",
  };

  const {
    account,
    tokenBalances,
    getAllTransactions,
    reCall,
    contractInfo,
    contract,
  } = useWeb3();
  const [allTransaction, setAllTransaction] = useState([]);
  const [currentUsdPrice, setCurrentUsdPrice] = useState("0");

  useEffect(() => {
    const fetchContractInfo = async () => {
      if (account) {
        const transactionArray = await getAllTransactions();

        setAllTransaction(transactionArray.reverse());
        try {
        } catch (error) {
          console.log(account);
        }
      }
    };

    fetchContractInfo();
  }, [account, reCall]);

  useEffect(() => {
    if (!contract) return;
    let intervalId;
    const load = async () => {
      try {
        const [price, stable] = await Promise.all([
          contract.getCurrentPrice(account || ethers.constants.AddressZero),
          contract.bnbPriceForStablecoin(),
        ]);
        const usdPriceBN = price.mul(1_000_000).div(stable);
        setCurrentUsdPrice(
          parseFloat(ethers.utils.formatUnits(usdPriceBN, 6)).toFixed(3)
        );
      } catch (err) {
        console.error("price fetch failed", err);
      }
    };
    load();
    intervalId = setInterval(load, 5000);
    return () => clearInterval(intervalId);
  }, [contract, account]);

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);

    // Format: YYYY-MM-DD HH:mm:ss
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };

  const formatHash = (hash) => {
    if (!hash) return "";
    return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
  };

  const formatAmount = (amount) => {
    if (!amount) return "0";
    return parseFloat(amount).toFixed(2);
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

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <Header theme={theme} title="Dashboard" />

      {/* / Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 my-8">
        {/* Total Assets Card */}
        <div className={`rounded-xl p-6 ${theme.card} ${theme.shadow}`}>
          <div className="mb-4">
            <div className="w-12 h-12 flex items-center justify-center rounded-full text-light-gradient hover:from-teal-500 hover:to-indigo-600 transition-all duration-200">
              <FaMedal className={`w-6 h-6 ${isDarkMode ? "text-white" : "text-gray-700"}`} />
            </div>
          </div>
          <h2 className={`text-2xl font-bold mb-2 ${theme.text}`}>
            {formatLargeNumber(tokenBalances?.fsxBalance)} {TOKEN_SYMBOL}
          </h2>
          <p className={`text-sm mb-4 ${theme.textSecondary}`}>
            Estimated USD valuation: $
            {tokenBalances?.fsxBalance && currentUsdPrice
              ? (
                  Number(tokenBalances.fsxBalance) * Number(currentUsdPrice)
                ).toFixed(2)
              : "0.00"}
          </p>
          <p className={theme.textSecondary}>Token Available For Sale</p>
        </div>

        {/* Referral Rewards Card */}
        <div className={`rounded-xl p-6 ${theme.card} ${theme.shadow}`}>
          <div className="mb-4">
            <div className="w-12 h-12 flex items-center justify-center rounded-full text-light-gradient hover:from-teal-500 hover:to-indigo-600 transition-all duration-200">
              <FaGift className={`w-6 h-6 ${isDarkMode ? "text-white" : "text-gray-700"}`} />
            </div>
          </div>
          <h2 className={`text-2xl font-bold mb-2 ${theme.text}`}>
            {formatLargeNumber(tokenBalances?.fsxSupply)} {TOKEN_SYMBOL}
          </h2>
          <p className={`text-sm mb-4 ${theme.textSecondary}`}>
            Estimated USD valuation: $
            {tokenBalances?.fsxSupply && currentUsdPrice
              ? (
                  Number(tokenBalances?.fsxSupply) * Number(currentUsdPrice)
                ).toFixed(2)
              : "0.00"}
          </p>
          <p className={theme.textSecondary}>
            Total {TOKEN_SYMBOL} Token Supply
          </p>
        </div>

        {/* My Rewards Card */}
        <div className={`rounded-xl p-6 ${theme.card} ${theme.shadow}`}>
          <div className="flex justify-between">
            <div>
              <h2 className={`text-2xl font-bold mb-2 ${theme.text}`}>
                {TOKEN_NAME}
              </h2>
              <p className={`text-lg mb-4 ${theme.textSecondary}`}>
                Current Price: $ {currentUsdPrice} per
              </p>
              <div>
                <p className={`text-lg ${theme.text}`}>Total Raised</p>
                <p className={theme.textSecondary}>
                  $ &nbsp;
                  {parseFloat(contractInfo?.totalSold || 0) *
                    parseFloat(currentUsdPrice || 0) >
                  0
                    ? (
                        parseFloat(contractInfo?.totalSold || 0) *
                        parseFloat(currentUsdPrice || 0)
                      ).toFixed(2)
                    : "0"}
                </p>
              </div>
            </div>
            <div className={`text-3xl font-bold ${theme.text}`}>
              {TOKEN_SYMBOL}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* First Rank Card */}
        <div
          onClick={() => setIsComponen("Token Sale")}
          className={`rounded-xl p-4 md:p-6 ${theme.card} ${theme.shadow}`}
        >
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="w-14 h-14 md:w-16 md:h-16 text-light-gradient hover:from-teal-500 hover:to-indigo-600 rounded-xl flex items-center justify-center shrink-0">
              <FaMedal className="w-8 h-8 md:w-10 md:h-10 text-white" />
            </div>

            <div className="text-center sm:text-left">
              <h3 className={`text-xl md:text-2xl font-bold ${theme.text}`}>
                Buy {TOKEN_SYMBOL}
              </h3>
              <p className={theme.textSecondary}>
                Only 1 token for $ {currentUsdPrice} {CURRENCY}
              </p>
            </div>
          </div>
        </div>

        {/* Second Rank Card */}
        <div
          onClick={() => setIsComponen("Token Transfer")}
          className={`rounded-xl p-4 md:p-6 ${theme.card} ${theme.shadow}`}
        >
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="w-14 h-14 md:w-16 md:h-16 text-light-gradient hover:from-teal-500 hover:to-indigo-600 rounded-xl flex items-center justify-center shrink-0">
              <FaMedal className="w-8 h-8 md:w-10 md:h-10 text-white" />
            </div>
            <div className="text-center sm:text-left">
              <h3 className={`text-xl md:text-2xl font-bold ${theme.text}`}>
                Transfer Token
              </h3>
              <p className={theme.textSecondary}>
                {TOKEN_NAME} {TOKEN_SYMBOL}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction  */}
      <div className="space-y-8 mt-8">
        {/* Referral History */}
        <div
          className={`rounded-xl overflow-hidden ${theme.card} ${theme.shadow}`}
        >
          {/* Header - Made more responsive */}
          <div className="p-4 sm:p-6 pb-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div className="flex items-center gap-3">
                <div className="text-[#9761F4]">
                  <FaDollarSign className="w-6 h-6 sm:w-8 sm:h-8" />
                </div>
                <div>
                  <h3
                    className={`text-xl sm:text-2xl font-semibold ${theme.text}`}
                  >
                    Purchase History
                  </h3>
                  <p className={theme.textSecondary + " text-xs sm:text-sm"}>
                    (Showing {allTransaction.length} of {allTransaction.length}{" "}
                    records)
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile View for Referral History */}
          <div className="block sm:hidden">
            {allTransaction.length > 0 ? (
              allTransaction
                .map((transaction, index) => (
                  <div key={index} className={`p-4 border-b ${theme.border}`}>
                    <div className="flex justify-between items-start mb-2">
                      <div className="text-[#9761F4] break-all">
                        {formatHash(transaction.user)}
                      </div>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          isDarkMode
                            ? "bg-green-900 text-green-400"
                            : "bg-green-100 text-green-600"
                        }`}
                      >
                        Completed
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <div className={theme.text + " font-medium"}>
                        {formatAmount(transaction.amountOut)} {TOKEN_SYMBOL}
                      </div>
                      <div className={theme.textSecondary + " text-sm"}>
                        {formatTimestamp(transaction.timestamp)}
                      </div>
                    </div>
                  </div>
                ))
                .slice(0, 20)
            ) : (
              <div className={`text-center py-8 ${theme.textSecondary}`}>
                No transactions found
              </div>
            )}
          </div>

          {/* Desktop View for Referral History */}
          <div className="hidden sm:block overflow-x-auto w-full">
            <table className="w-full min-w-[768px]">
              <thead>
                <tr className={`border-b ${theme.border}`}>
                  <th
                    className={`text-left p-6 pl-6 ${theme.textSecondary} font-normal text-sm whitespace-nowrap`}
                  >
                    <div className="flex items-center gap-2">
                      <FaWallet className="w-4 h-4" />
                      WALLET
                    </div>
                  </th>
                  <th
                    className={`text-left p-6 ${theme.textSecondary} font-normal text-sm whitespace-nowrap`}
                  >
                    <div className="flex items-center gap-2">
                      <FaDollarSign className="w-4 h-4" />
                      PAYMENT
                    </div>
                  </th>
                  <th
                    className={`text-left p-6 ${theme.textSecondary} font-normal text-sm whitespace-nowrap`}
                  >
                    <div className="flex items-center gap-2">
                      <FaDollarSign className="w-4 h-4" />
                      BOUGHT AMOUNT
                    </div>
                  </th>

                  <th
                    className={`text-left p-6 ${theme.textSecondary} font-normal text-sm whitespace-nowrap`}
                  >
                    <div className="flex items-center gap-2">
                      <FaClock className="w-4 h-4" />
                      TIME & DATE
                    </div>
                  </th>
                  <th
                    className={`text-left p-6 ${theme.textSecondary} font-normal text-sm whitespace-nowrap`}
                  >
                    <div className="flex items-center gap-2">
                      <FaCheckCircle className="w-4 h-4" />
                      STATUS
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {allTransaction.length > 0 ? (
                  allTransaction
                    .map((transaction, index) => (
                      <tr key={index} className={`border-b ${theme.border}`}>
                        <td className="p-6 pl-6 text-[#9761F4]">
                          {formatHash(transaction.user)}
                        </td>
                        <td className={`p-6 ${theme.text}`}>
                          {transaction?.amountIn} {transaction.tokenIn}
                        </td>
                        <td className={`p-6 ${theme.text}`}>
                          {formatAmount(transaction.amountOut)} {TOKEN_SYMBOL}
                        </td>
                        <td className={`p-6 ${theme.textSecondary}`}>
                          {formatTimestamp(transaction.timestamp)}
                        </td>
                        <td className="p-6">
                          <span
                            className={`px-3 py-1 rounded-full text-sm ${
                              isDarkMode
                                ? "bg-green-900 text-green-400"
                                : "bg-green-100 text-green-600"
                            }`}
                          >
                            Completed
                          </span>
                        </td>
                      </tr>
                    ))
                    .slice(0, 20)
                ) : (
                  <tr>
                    <td
                      colSpan="4"
                      className={`text-center py-12 ${theme.textSecondary}`}
                    >
                      No transactions found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
