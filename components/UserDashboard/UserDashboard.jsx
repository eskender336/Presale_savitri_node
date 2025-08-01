import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import {
  FaWallet,
  FaHistory,
  FaExchangeAlt,
  FaCoins,
  FaEthereum,
  FaChartLine,
  FaInfoCircle,
  FaCopy,
  FaCheck,
  FaGift,
  FaIdCard,
} from "react-icons/fa";
import { SiTether } from "react-icons/si";
import { useWeb3 } from "../../context/Web3Provider";
import { Header, KYCForm } from "../index";

const TOKEN_NAME = process.env.NEXT_PUBLIC_TOKEN_NAME;
const TOKEN_SYMBOL = process.env.NEXT_PUBLIC_TOKEN_SYMBOL;
const TOKEN_SUPPLY = process.env.NEXT_PUBLIC_TOKEN_SUPPLY;
const PER_TOKEN_USD_PRICE = process.env.NEXT_PUBLIC_PER_TOKEN_USD_PRICE;
const CURRENCY = process.env.NEXT_PUBLIC_CURRENCY;
const BLOCKCHAIN = process.env.NEXT_PUBLIC_BLOCKCHAIN;
const EXPLORER_ADDRESS_URL = process.env.NEXT_PUBLIC_EXPLORER_ADDRESS_URL;
const DOMAIN_URL = process.env.NEXT_PUBLIC_NEXT_DOMAIN_URL;

const UserDashboard = ({ isDarkMode }) => {
  const {
    account,
    isConnected,
    isConnecting,
    contractInfo,
    tokenBalances,
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
    // New referral functions
    getReferralInfo,
    getUserReferrals,
    getReferralTransactions,
    generateReferralLink,
    registerReferrer,
    handleReferralRegistration,
  } = useWeb3();

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [copied, setCopied] = useState(false);

  // Transaction history state
  const [transactions, setTransactions] = useState([]);

  const [referralInfo, setReferralInfo] = useState(null);
  const [referrals, setReferrals] = useState([]);
  const [referralTransactions, setReferralTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [referrerInput, setReferrerInput] = useState("");
  const [copiedRef, setCopiedRef] = useState(false);

  // Fetch data on component mount

  useEffect(() => {
    const fetchUserData = async () => {
      if (account) {
        console.log("getUserTransactions");
        setLoading(true);
        try {
          const transactionArray = await getUserTransactions(account);
          console.log(transactionArray);

          setTransactions(transactionArray.reverse());
        } catch (error) {
          console.error("Error fetching user data:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchUserData();
  }, [account]);

  // Copy address to clipboard
  const copyAddressToClipboard = () => {
    navigator.clipboard
      .writeText(account)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch((err) => {
        console.error("Failed to copy address:", err);
      });
  };

  // Format timestamp
  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString();
  };

  const formatDateTime = (timestamp) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString();
  };
  // Format transaction hash
  const formatHash = (hash) => {
    return `${hash.substring(0, 6)}...${hash.substring(hash.length - 4)}`;
  };

  // Get payment method icon
  const getPaymentIcon = (method) => {
    switch (method) {
      case "ETH":
        return <FaEthereum className="text-[#627EEA]" />;
      case "USDT":
        return <SiTether className="text-green-500" />;
      case "USDC":
        return (
          <img
            src="/usdc.svg"
            style={{
              width: ".9rem",
            }}
          />
        );
      default:
        return <FaGift className="text-purple-500" />;
    }
  };

  const tabs = [
    { id: "overview", label: "Overview", icon: <FaChartLine /> },
    { id: "assets", label: "Assets", icon: <FaCoins /> },
    { id: "transactions", label: "Transactions", icon: <FaHistory /> },
    { id: "referrals", label: "Referrals", icon: <FaGift /> },
    { id: "kyc", label: "KYC", icon: <FaIdCard /> },
  ];

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

  const theme = {
    bg: isDarkMode ? "bg-[#0D0B12]" : "bg-gray-100",
    header: isDarkMode ? "bg-[#12101A]" : "bg-white",
    inputBg: isDarkMode ? "bg-[#1A1825]" : "bg-gray-100",
    card: isDarkMode ? "bg-[#12101A]" : "bg-white",
    text: isDarkMode ? "text-white" : "text-gray-900",
    textSecondary: isDarkMode ? "text-gray-400" : "text-gray-500",
    border: isDarkMode ? "border-gray-800" : "border-gray-200",
    divide: isDarkMode ? "divide-gray-800" : "divide-gray-200",
  };

  // Load referral data when account changes
  useEffect(() => {
    const loadReferralData = async () => {
      if (account && isConnected) {
        setIsLoading(true);
        try {
          // Get referral info
          const info = await getReferralInfo(account);
          setReferralInfo(info);

          // Get referrals
          const userReferrals = await getUserReferrals(account);
          setReferrals(userReferrals);

          // Get transactions
          const transactions = await getReferralTransactions(account);
          setReferralTransactions(transactions);
        } catch (error) {
          console.error("Error loading referral data:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadReferralData();
  }, [
    account,
    isConnected,
    getReferralInfo,
    getUserReferrals,
    getReferralTransactions,
  ]);

  // Handle referrer registration
  const handleRegisterReferrer = async (e) => {
    e.preventDefault();

    if (!referrerInput || !ethers.utils.isAddress(referrerInput)) {
      alert("Please enter a valid address");
      return;
    }

    if (referrerInput.toLowerCase() === account.toLowerCase()) {
      alert("You cannot refer yourself");
      return;
    }

    setIsLoading(true);
    try {
      await registerReferrer(referrerInput);

      // Refresh referral info
      const info = await getReferralInfo(account);
      setReferralInfo(info);
    } catch (error) {
      console.error("Error registering referrer:", error);
    } finally {
      setIsLoading(false);
      setReferrerInput("");
    }
  };

  // Format date for display

  // Generate referral link
  const referralLink = generateReferralLink(account);

  return (
    <div className={`${theme.bg} min-h-screen pb-8`}>
      <Header theme={theme} title="User Dashboard" />
      <div
        className={`${theme.header} py-4 px-4 sm:px-6 mb-6 border-b ${theme.border}`}
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h1 className={`text-xl sm:text-2xl font-bold ${theme.text}`}>
              User Dashboard
            </h1>

            {/* Wallet Info */}
            <div
              className={`flex items-center ${
                isDarkMode ? "bg-[#1A1825]" : "bg-gray-100"
              } rounded-lg px-3 py-2 gap-3`}
            >
              <FaWallet className="text-[#9761F4]" />
              <span className={theme.text}>{formatAddress(account)}</span>
              <button
                onClick={copyAddressToClipboard}
                className={`${theme.textSecondary} hover:${theme.text} transition-colors`}
                title="Copy to clipboard"
              >
                {copied ? <FaCheck className="text-green-500" /> : <FaCopy />}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto ">
        <div
          className={`flex overflow-x-auto scrollbar-hide border-b ${theme.border} mb-6`}
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 sm:px-6 py-3 whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? "text-light-gradient hover:from-teal-500 hover:to-indigo-600 text-white"
                  : isDarkMode
                  ? "text-gray-400 hover:text-gray-300"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="py-12 flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
          </div>
        ) : (
          <>
            {activeTab === "overview" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className={`${theme.card} rounded-xl p-6`}>
                    <div className="flex justify-between items-start mb-4">
                      <FaCoins className="text-[#9761F4] text-xl" />
                      <span className={theme.textSecondary}>Total Balance</span>
                    </div>
                    <h3 className={`text-2xl font-bold ${theme.text} mb-1`}>
                      {formatLargeNumber(tokenBalances.userFsxBlanace)}{" "}
                      {TOKEN_SYMBOL}
                    </h3>
                    <p className={theme.textSecondary}>
                      ≈ ${tokenBalances?.userFsxBlanace * PER_TOKEN_USD_PRICE}
                    </p>
                  </div>

                  <div className={`${theme.card} rounded-xl p-6`}>
                    <div className="flex justify-between items-start mb-4">
                      <FaEthereum className="text-[#9761F4] text-xl" />
                      <span className={theme.textSecondary}>
                        {CURRENCY} Balance
                      </span>
                    </div>
                    <h3 className={`text-2xl font-bold ${theme.text} mb-1`}>
                      {tokenBalances?.userEthBalance
                        ? parseFloat(tokenBalances.userEthBalance).toFixed(6)
                        : "0.00"}{" "}
                      {CURRENCY}
                    </h3>
                    <p className={theme.textSecondary}>≈ Your Balance</p>
                  </div>

                  <div className={`${theme.card} rounded-xl p-6`}>
                    <div className="flex justify-between items-start mb-4">
                      <FaGift className="text-[#9761F4] text-xl" />

                      <span className={theme.textSecondary}>
                        {TOKEN_SYMBOL} Purchased
                      </span>
                    </div>
                    <h3 className={`text-2xl font-bold ${theme.text} mb-1`}>
                      {transactions?.length}
                    </h3>
                    <p className={theme.textSecondary}>
                      Total Count: {transactions?.length + 6} {TOKEN_SYMBOL}
                    </p>
                  </div>

                  <div className={`${theme.card} rounded-xl p-6`}>
                    <div className="flex justify-between items-start mb-4">
                      <FaExchangeAlt className="text-[#9761F4] text-xl" />
                      <span className={theme.textSecondary}>Transactions</span>
                    </div>
                    <h3 className={`text-2xl font-bold ${theme.text} mb-1`}>
                      {transactions.length}
                    </h3>
                    <p className={theme.textSecondary}>
                      Last:{" "}
                      {transactions.length > 0
                        ? formatDate(transactions[0].timestamp)
                        : "N/A"}
                    </p>
                  </div>
                </div>

                <div className={`${theme.card} rounded-xl overflow-hidden`}>
                  <div
                    className={`px-6 py-4 border-b ${theme.border} flex justify-between items-center`}
                  >
                    <h3 className={`text-lg font-semibold ${theme.text}`}>
                      Recent Activity
                    </h3>
                    <button
                      onClick={() => setActiveTab("transactions")}
                      className="text-[#9761F4] text-sm hover:text-purple-300"
                    >
                      View All
                    </button>
                  </div>

                  <div className={`divide-y ${theme.divide}`}>
                    {transactions.slice(0, 3).map((tx, index) => (
                      <div
                        key={index}
                        className="px-6 py-4 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              tx.transactionType === "BUY"
                                ? "bg-blue-900/30"
                                : "bg-purple-900/30"
                            }`}
                          >
                            {tx.transactionType === "BUY" ? (
                              <FaExchangeAlt className="text-blue-400" />
                            ) : (
                              <FaGift className="text-[#9761F4]" />
                            )}
                          </div>
                          <div>
                            <p className={`${theme.text} font-medium`}>
                              {tx.transactionType === "BUY"
                                ? `${TOKEN_SYMBOL} Token Purchase`
                                : tx.transactionType === "REFERRAL"
                                ? "REFERRAL"
                                : "Stable Coin Purchase"}
                            </p>
                            <p className={`text-sm ${theme.textSecondary}`}>
                              {formatDate(tx.timestamp)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`${theme.text} font-medium`}>
                            {tx.amountOut}{" "}
                            {tx.transactionType === "BUY"
                              ? `${TOKEN_SYMBOL}`
                              : `${tx.tokenOut}`}
                          </p>
                          {tx.transactionType === "BUY" && (
                            <p className={`text-sm ${theme.textSecondary}`}>
                              {tx.paymentAmount} {tx.paymentMethod}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}

                    {transactions.length === 0 && (
                      <div
                        className={`px-6 py-8 text-center ${theme.textSecondary}`}
                      >
                        No recent activity
                      </div>
                    )}
                  </div>
                </div>

                {/* Referral Link */}
                <div className={`${theme.card} rounded-xl p-6`}>
                  <div className="flex items-center gap-3 mb-4">
                    <FaGift className="text-[#9761F4]" />
                    <h3 className={`text-lg font-semibold ${theme.text}`}>
                      Your Referral Link
                    </h3>
                  </div>

                  <div
                    className={`${theme.inputBg} rounded-lg p-3 flex items-center justify-between mb-4`}
                  >
                    <span className={`${theme.textSecondary} text-sm truncate`}>
                      {referralLink}
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(referralLink);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      className="text-[#9761F4] hover:text-purple-300 p-2"
                    >
                      {copied ? <FaCheck /> : <FaCopy />}
                    </button>
                  </div>

                  <div
                    className={`flex items-start gap-2 text-sm ${theme.textSecondary}`}
                  >
                    <FaInfoCircle className="mt-1 flex-shrink-0" />
                    <p>
                      Share your referral link to earn 5% of all purchases made
                      through your link. Rewards are paid in tokens directly to
                      your wallet.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Assets Tab */}
            {activeTab === "assets" && (
              <div className="space-y-6">
                <div className={`${theme.card} rounded-xl overflow-hidden`}>
                  <div className={`px-6 py-4 border-b ${theme.border}`}>
                    <h3 className={`text-lg font-semibold ${theme.text}`}>
                      Your Assets
                    </h3>
                  </div>

                  <div className={`divide-y ${theme.divide}`}>
                    {/* Token Asset */}
                    <div className="px-6 py-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-purple-900/30 flex items-center justify-center">
                          {/* <FaCoins className="text-[#9761F4]" /> */}
                          <img
                            style={{
                              width: "3rem",
                            }}
                            src={isDarkMode ? "/SavitriNetwork.png" : "/SavitriNetworkBlack.png"}
                            alt=""
                            srcset=""
                          />
                        </div>
                        <div>
                          <p className={`${theme.text} font-medium`}>
                            {TOKEN_SYMBOL}
                          </p>
                          <p className={`text-sm ${theme.textSecondary}`}>
                            {TOKEN_NAME} ({TOKEN_SYMBOL})
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`${theme.text} font-medium`}>
                          {tokenBalances?.userFsxBlanace} {TOKEN_SYMBOL}
                        </p>
                        <p className={`text-sm ${theme.textSecondary}`}>
                          ≈ $
                          {Number(tokenBalances?.userFsxBlanace) *
                            PER_TOKEN_USD_PRICE}
                        </p>
                      </div>
                    </div>

                    {/* ETH Asset */}
                    <div className="px-6 py-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-900/30 flex items-center justify-center">
                          <FaEthereum className="text-[#627EEA]" />
                        </div>
                        <div>
                          <p className={`${theme.text} font-medium`}>
                            {CURRENCY}
                          </p>
                          <p className={`text-sm ${theme.textSecondary}`}>
                            {BLOCKCHAIN}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`${theme.text} font-medium`}>
                          {tokenBalances?.userEthBalance} {CURRENCY}
                        </p>
                        <p className={`text-sm ${theme.textSecondary}`}>
                          ≈ Your balance
                        </p>
                      </div>
                    </div>

                    {/* USDT Asset */}
                    <div className="px-6 py-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-green-900/30 flex items-center justify-center">
                          <SiTether className="text-green-500" />
                        </div>
                        <div>
                          <p className={`${theme.text} font-medium`}>USDT</p>
                          <p className={`text-sm ${theme.textSecondary}`}>
                            Tether USD
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`${theme.text} font-medium`}>
                          {tokenBalances.userUSDTBalance} USDT
                        </p>
                        <p className={`text-sm ${theme.textSecondary}`}>
                          ≈ ${tokenBalances.userUSDTBalance}
                        </p>
                      </div>
                    </div>

                    {/* USDC Asset */}
                    <div className="px-6 py-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-900/30 flex items-center justify-center">
                          <span className="text-blue-500 font-bold">
                            {" "}
                            <img
                              src="/usdc.svg"
                              style={{
                                width: "1rem",
                              }}
                            />
                          </span>
                        </div>
                        <div>
                          <p className={`${theme.text} font-medium`}>USDC</p>
                          <p className={`text-sm ${theme.textSecondary}`}>
                            USD Coin
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`${theme.text} font-medium`}>
                          {tokenBalances.userUSDCBalance} USDC
                        </p>
                        <p className={`text-sm ${theme.textSecondary}`}>
                          ≈ ${tokenBalances.userUSDCBalance}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Transactions Tab */}
            {activeTab === "transactions" && (
              <div className="space-y-6">
                <div className={`${theme.card} rounded-xl overflow-hidden`}>
                  <div className={`px-6 py-4 border-b ${theme.border}`}>
                    <h3 className={`text-lg font-semibold ${theme.text}`}>
                      Transaction History
                    </h3>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr
                          className={`border-b ${theme.border} text-left ${theme.textSecondary} text-sm`}
                        >
                          <th className="px-6 py-3">Type</th>
                          <th className="px-6 py-3">Amount</th>
                          <th className="px-6 py-3">Payment</th>
                          <th className="px-6 py-3 hidden sm:table-cell">
                            Date
                          </th>
                          <th className="px-6 py-3 hidden md:table-cell">
                            Wallet
                          </th>
                          <th className="px-6 py-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${theme.divide}`}>
                        {transactions.map((tx, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  tx.transactionType === "BUY"
                                    ? "bg-blue-900/30 text-blue-400"
                                    : "bg-purple-900/30 text-[#9761F4]"
                                }`}
                              >
                                {tx.transactionType}
                              </span>
                            </td>
                            <td className={`px-6 py-4 ${theme.text}`}>
                              {tx.amountOut} {TOKEN_SYMBOL}
                            </td>
                            <td className="px-6 py-4">
                              {tx.tokenIn ? (
                                <div className="flex items-center gap-1">
                                  {getPaymentIcon(tx.tokenIn)}
                                  <span className={`${theme.text} ml-1`}>
                                    {tx.amountIn} {tx.tokenIn}
                                  </span>
                                </div>
                              ) : (
                                <span className={theme.textSecondary}>-</span>
                              )}
                            </td>
                            <td
                              className={`px-6 py-4 ${theme.textSecondary} hidden sm:table-cell`}
                            >
                              {formatDate(tx.timestamp)}
                            </td>
                            <td
                              className={`px-6 py-4 ${theme.textSecondary} hidden md:table-cell`}
                            >
                              <a
                                href={`${EXPLORER_ADDRESS_URL}${tx.user}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#9761F4] hover:text-purple-300"
                              >
                                {formatHash(tx.user)}
                              </a>
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`px-2 py-1 rounded-full text-xs ${
                                  isDarkMode
                                    ? "bg-green-900 text-green-400"
                                    : "bg-green-100 text-green-600"
                                }`}
                              >
                                Completed
                              </span>
                            </td>
                          </tr>
                        ))}

                        {transactions.length === 0 && (
                          <tr>
                            <td
                              colSpan="6"
                              className={`px-6 py-8 text-center ${theme.textSecondary}`}
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
            )}

            {/* Referrals Tab */}
            {activeTab === "referrals" && (
              <div className="space-y-6">
                {/* Referral Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className={`${theme.card} rounded-xl p-6`}>
                    <div className="flex justify-between items-start mb-4">
                      <FaGift className="text-[#9761F4] text-xl" />
                      <span className={`text-xs ${theme.textSecondary}`}>
                        Total Referrals
                      </span>
                    </div>
                    <h3 className={`text-2xl font-bold ${theme.text}`}>
                      {isLoading ? "..." : referralInfo?.totalReferrals || "0"}
                    </h3>
                  </div>

                  <div className={`${theme.card} rounded-xl p-6`}>
                    <div className="flex justify-between items-start mb-4">
                      <FaCoins className="text-[#9761F4] text-xl" />
                      <span className={`text-xs ${theme.textSecondary}`}>
                        Total Rewards
                      </span>
                    </div>
                    <h3 className={`text-2xl font-bold ${theme.text}`}>
                      {isLoading
                        ? "..."
                        : referralInfo?.totalRewardsEarned || "0"}{" "}
                      {TOKEN_SYMBOL}
                    </h3>
                  </div>

                  <div className={`${theme.card} rounded-xl p-6`}>
                    <div className="flex justify-between items-start mb-4">
                      <FaExchangeAlt className="text-[#9761F4] text-xl" />
                      <span className={`text-xs ${theme.textSecondary}`}>
                        Reward Rate
                      </span>
                    </div>
                    <h3 className={`text-2xl font-bold ${theme.text}`}>
                      {" "}
                      {isLoading
                        ? "..."
                        : `${referralInfo?.rewardPercentage || "5"}%`}
                    </h3>
                  </div>

                  <div className={`${theme.card} rounded-xl p-6`}>
                    <div className="flex justify-between items-start mb-4">
                      <FaGift className="text-[#9761F4]" />
                      <span className={`text-xs ${theme.textSecondary}`}>
                        {" "}
                        Your Referrer
                      </span>
                    </div>
                    <h3 className={`text-2xl font-bold ${theme.text}`}>
                      {" "}
                      {isLoading
                        ? "..."
                        : referralInfo?.referrer
                        ? formatAddress(referralInfo.referrer)
                        : "N/A"}
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(referralInfo.referrer);
                          setCopiedRef(true);
                          setTimeout(() => setCopiedRef(false), 2000);
                        }}
                        className="text-[#9761F4] hover:text-purple-300 p-2"
                      >
                        {copiedRef ? <FaCheck /> : <FaCopy />}
                      </button>
                    </h3>
                  </div>
                </div>

                {/* Register Referrer (shown if user doesn't have a referrer) */}
                {(!referralInfo ||
                  !referralInfo.referrer ||
                  referralInfo.referrer ===
                    "0x0000000000000000000000000000000000000000") && (
                  <div className={`${theme.card} rounded-xl p-6`}>
                    <div className="flex items-center gap-3 mb-4">
                      <FaGift className="text-[#9761F4]" />
                      <h3 className={`text-lg font-semibold ${theme.text}`}>
                        Register a Referrer
                      </h3>
                    </div>

                    <form
                      onSubmit={handleRegisterReferrer}
                      className="space-y-4"
                    >
                      <div>
                        <label className={`block ${theme.textSecondary} mb-2`}>
                          Referrer Address
                        </label>
                        <input
                          type="text"
                          value={referrerInput}
                          onChange={(e) => setReferrerInput(e.target.value)}
                          placeholder="0x..."
                          className={`w-full ${theme.inputBg} rounded-lg p-3 ${theme.text} focus:outline-none focus:ring-2 focus:ring-purple-600`}
                          required
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isLoading || !referrerInput}
                        className={`w-full ${
                          isLoading || !referrerInput
                            ? isDarkMode
                              ? "bg-gray-700 cursor-not-allowed"
                              : "bg-gray-300 cursor-not-allowed text-gray-500"
                            : "text-light-gradient hover:from-teal-500 hover:to-indigo-600"
                        } text-white font-medium py-3 rounded-lg transition-colors`}
                      >
                        {isLoading ? "Processing..." : "Register Referrer"}
                      </button>
                    </form>
                  </div>
                )}

                {/* Referral Link */}
                <div className={`${theme.card} rounded-xl p-6`}>
                  <div className="flex items-center gap-3 mb-4">
                    <FaGift className="text-[#9761F4]" />
                    <h3 className={`text-lg font-semibold ${theme.text}`}>
                      Your Referral Link
                    </h3>
                  </div>

                  <div
                    className={`${theme.inputBg} rounded-lg p-3 flex items-center justify-between mb-4`}
                  >
                    <span className={`${theme.textSecondary} text-sm truncate`}>
                      {referralLink}
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(referralLink);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      className="text-[#9761F4] hover:text-purple-300 p-2"
                    >
                      {copied ? <FaCheck /> : <FaCopy />}
                    </button>
                  </div>

                  <div
                    className={`flex items-start gap-2 text-sm ${theme.textSecondary}`}
                  >
                    <FaInfoCircle className="mt-1 flex-shrink-0" />
                    <p>
                      Share your referral link to earn 5% of all purchases made
                      through your link. Rewards are paid in tokens directly to
                      your wallet.
                    </p>
                  </div>
                </div>

                {/* Referral Transactions */}
                <div className={`${theme.card} rounded-xl overflow-hidden`}>
                  <div className={`px-6 py-4 border-b ${theme.border}`}>
                    <h3 className={`text-lg font-semibold ${theme.text}`}>
                      Referral Rewards
                    </h3>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr
                          className={`border-b ${theme.border} text-left ${theme.textSecondary} text-sm`}
                        >
                          <th className="px-6 py-3">Referred User</th>
                          <th className="px-6 py-3">Purchase Amount</th>
                          <th className="px-6 py-3">Reward</th>
                          <th className="px-6 py-3 hidden sm:table-cell">
                            Date
                          </th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${theme.divide}`}>
                        {referralTransactions.map((tx, index) => (
                          <tr key={index}>
                            <td className={`px-6 py-4 ${theme.text}`}>
                              {formatAddress(tx.referredUser)}
                            </td>
                            <td className={`px-6 py-4 ${theme.text}`}>
                              {tx.purchaseAmount} {TOKEN_SYMBOL}
                            </td>
                            <td className={`px-6 py-4 text-[#9761F4]`}>
                              {tx.rewardAmount} {TOKEN_SYMBOL}
                            </td>
                            <td
                              className={`px-6 py-4 ${theme.textSecondary} hidden sm:table-cell`}
                            >
                              {formatDateTime(tx.timestamp)}
                            </td>
                          </tr>
                        ))}

                        {referralTransactions.length === 0 && (
                          <tr>
                            <td
                              colSpan="4"
                              className={`px-6 py-8 text-center ${theme.textSecondary}`}
                            >
                              No referral rewards found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* KYC Tab */}
            {activeTab === "kyc" && <KYCForm isDarkMode={isDarkMode} />}
          </>
        )}
      </div>
    </div>
  );
};

export default UserDashboard;
