import React, { useState, useEffect, useRef } from "react";
import {
  FaEthereum,
  FaArrowRight,
  FaInfoCircle,
  FaExchangeAlt,
  FaHistory,
} from "react-icons/fa";
import { SiTether } from "react-icons/si";
import { CustomConnectButton } from "../index";
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
const OWNER_ADDRESS = process.env.NEXT_PUBLIC_OWNER_ADDRESS;
const TOKEN_ICO_ADDRESS = process.env.NEXT_PUBLIC_TOKEN_ICO_ADDRESS;
const USDT_ADDRESS = process.env.NEXT_PUBLIC_USDT_ADDRESS;
const USDC_ADDRESS = process.env.NEXT_PUBLIC_USDC_ADDRESS;
const FSX_ADDRESS = process.env.NEXT_PUBLIC_FSX_ADDRESS;
const ETH_ADDRESS = process.env.NEXT_PUBLIC_ETH_ADDRESS;

const StablecoinPurchase = ({ isDarkMode }) => {
  const {
    account,
    isConnected,
    isConnecting,
    contractInfo,
    tokenBalances,
    error,
    buyWithETH,
    buyWithUSDT,
    buyWithUSDC,
    buyUSDT,
    buyUSDC,
    updateStablecoinPrice,
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
    setReCall,
    reCall,
    boundReferrer,
  } = useWeb3();
  const [selectedStablecoin, setSelectedStablecoin] = useState("USDT");
  const [ethAmount, setEthAmount] = useState("");
  const [receivedAmount, setReceivedAmount] = useState("0");
  const [isProcessing, setIsProcessing] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Theme configuration
  const theme = {
    mainBg: isDarkMode ? "bg-[#0D0B12]" : "bg-gray-100",
    cardBg: isDarkMode ? "bg-[#12101A]" : "bg-white",
    inputBg: isDarkMode ? "bg-[#1A1825]" : "bg-gray-100",
    tokenBg: isDarkMode ? "bg-[#292838]" : "bg-gray-200",
    text: isDarkMode ? "text-white" : "text-gray-900",
    textSecondary: isDarkMode ? "text-gray-400" : "text-gray-600",
    textMuted: isDarkMode ? "text-gray-500" : "text-gray-500",
    border: isDarkMode ? "border-gray-800" : "border-gray-200",
    divide: isDarkMode ? "divide-gray-800" : "divide-gray-200",
    buttonBg: isDarkMode ? "bg-[#1A1825]" : "bg-gray-100",
    buttonHover: isDarkMode ? "hover:bg-[#20202e]" : "hover:bg-gray-200",
  };

  /// Exchange rate (ETH to stablecoin) - this would come from contract in real implementation
  const exchangeRate = {
    USDT: 1 / (contractInfo?.stablecoinPrice ?? 1),
    USDC: 1 / (contractInfo?.stablecoinPrice ?? 1),
  };

  // Calculate stablecoin amount based on ETH input
  useEffect(() => {
    if (ethAmount && !isNaN(ethAmount)) {
      const amount = parseFloat(ethAmount) * exchangeRate[selectedStablecoin];
      setReceivedAmount(amount.toFixed(2));
    } else {
      setReceivedAmount("0");
    }
  }, [ethAmount, selectedStablecoin]);

  // Purchase stablecoin function

  const purchaseStablecoin = async (e) => {
    e.preventDefault();

    if (!ethAmount || isNaN(ethAmount) || parseFloat(ethAmount) <= 0) {
      alert("Please enter a valid ETH amount");
      return;
    }

    setIsProcessing(true);

    try {
      // In a real implementation, you would call contract methods:
      if (selectedStablecoin === "USDT") {
        const tx = await buyUSDT(ethAmount);
        console.log(tx);
      } else {
        const tx = await buyUSDC(ethAmount);
        console.log(tx);
      }

      // Simulate transaction
      setTimeout(() => {
        // Create new transaction object
        const newTransaction = {
          id: Date.now(),
          type: "BUY",
          stablecoin: selectedStablecoin,
          ethAmount: ethAmount,
          stablecoinAmount: receivedAmount,
          timestamp: new Date(),
          hash: `0x${Math.random()
            .toString(16)
            .substring(2, 10)}...${Math.random()
            .toString(16)
            .substring(2, 10)}`,
        };

        // Update state with new transaction
        const updatedTransactions = [newTransaction, ...recentTransactions];
        setRecentTransactions(updatedTransactions);

        // Save to localStorage
        saveTransactionsToLocalStorage(updatedTransactions);

        // Reset form
        setEthAmount("");
        setReceivedAmount("0");
        setIsProcessing(false);
      }, 2000);
    } catch (error) {
      console.error("Error purchasing stablecoin:", error);
      setIsProcessing(false);
    }
  };
  // Helper functions for localStorage
  const saveTransactionsToLocalStorage = (transactions) => {
    try {
      localStorage.setItem("recentTransactions", JSON.stringify(transactions));
      return true;
    } catch (error) {
      console.error("Error saving transactions to localStorage:", error);
      return false;
    }
  };

  const getTransactionsFromLocalStorage = () => {
    try {
      const transactions = localStorage.getItem("recentTransactions");
      return transactions ? JSON.parse(transactions) : [];
    } catch (error) {
      console.error("Error fetching transactions from localStorage:", error);
      return [];
    }
  };

  // First useEffect: Load transactions from localStorage on mount
  useEffect(() => {
    const savedTransactions = getTransactionsFromLocalStorage();
    if (savedTransactions.length > 0) {
      setRecentTransactions(savedTransactions);
    }
  }, []); // Empty dependency array means this runs once on mount

  // Create a ref to track current transactions state
  const transactionsRef = useRef(recentTransactions);

  // Update ref whenever transactions change
  useEffect(() => {
    transactionsRef.current = recentTransactions;
  }, [recentTransactions]);

  // Second useEffect: Set up beforeunload event listener (runs once)
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Use the ref to access latest transactions state
      saveTransactionsToLocalStorage(transactionsRef.current);
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []); // Empty dependency array, so this only runs once on mount

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "";

    try {
      // Handle if it's already a Date object
      if (timestamp instanceof Date) {
        return timestamp.toLocaleTimeString();
      }

      // Handle if it's a string or number
      return new Date(timestamp).toLocaleTimeString();
    } catch (error) {
      console.error("Error formatting timestamp:", error);
      return String(timestamp); // Fallback to just displaying as string
    }
  };

  return (
    <>
      <Header theme={theme} title="Purchase Stablecoins" />
      {boundReferrer && (
        <div className={`mb-4 ${theme.text}`}>
          Referrer: {formatAddress(boundReferrer)}
        </div>
      )}
      <div className={`${theme.mainBg} min-h-screen `}>
        <div className=" mx-auto">
          {/* Header */}
          <div className="mb-8">
            <p className={theme.textSecondary}>
              Instantly buy USDT or USDC with ETH at competitive rates.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Purchase Card - 3 Columns */}
            <div
              className={`lg:col-span-3 ${theme.cardBg} rounded-xl overflow-hidden shadow-lg`}
            >
              <div className={`p-6 border-b ${theme.border}`}>
                <h2
                  className={`text-xl font-bold ${theme.text} flex items-center`}
                >
                  <FaExchangeAlt className="mr-2 text-[#9761F4]" />
                  Exchange ETH for Stablecoins
                </h2>
              </div>

              {!isConnected ? (
                <div className="p-6 flex flex-col items-center justify-center min-h-[300px]">
                  <p className={`${theme.textSecondary} mb-6 text-center`}>
                    Connect your wallet to purchase stablecoins
                  </p>
                  <button
                    disabled={isLoading}
                    className="font-medium py-3 rounded-xl transition-colors"
                  >
                    <CustomConnectButton isDarkMode={isDarkMode} />
                  </button>
                </div>
              ) : (
                <div className="p-6">
                  {/* Stablecoin Selection */}
                  <div className="flex space-x-4 mb-6">
                    <button
                      onClick={() => setSelectedStablecoin("USDT")}
                      className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 ${
                        selectedStablecoin === "USDT"
                          ? "text-light-gradient hover:from-teal-500 hover:to-indigo-600 text-white"
                          : `${theme.buttonBg} ${theme.textSecondary} ${theme.buttonHover}`
                      }`}
                    >
                      <SiTether className="text-green-500" />
                      <span>USDT</span>
                    </button>
                    <button
                      onClick={() => setSelectedStablecoin("USDC")}
                      className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 ${
                        selectedStablecoin === "USDC"
                          ? "text-light-gradient hover:from-teal-500 hover:to-indigo-600 text-white"
                          : `${theme.buttonBg} ${theme.textSecondary} ${theme.buttonHover}`
                      }`}
                    >
                      <span className="text-blue-500">
                        {" "}
                        <img
                          src="/usdc.svg"
                          style={{
                            width: "1rem",
                          }}
                        />
                      </span>
                      <span>USDC</span>
                    </button>
                  </div>

                  <form onSubmit={purchaseStablecoin}>
                    {/* From (ETH) Input */}
                    <div className="mb-4">
                      <label className={`block ${theme.textSecondary} mb-2`}>
                        From
                      </label>
                      <div className={`${theme.inputBg} rounded-xl p-4`}>
                        <div className="flex justify-between mb-2">
                          <span className={theme.textMuted}>Amount</span>
                          <span className={theme.textMuted}>
                            {tokenBalances?.userEthBalance} {CURRENCY}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="number"
                            value={ethAmount}
                            onChange={(e) => setEthAmount(e.target.value)}
                            placeholder="0.0"
                            step="0.01"
                            min="0"
                            className={`bg-transparent ${theme.text} text-2xl focus:outline-none w-full`}
                            required
                          />
                          <div
                            className={`flex items-center gap-2 ${theme.tokenBg} rounded-full px-4 py-2`}
                          >
                            <FaEthereum className="text-[#627EEA]" />
                            <span className={theme.text}>ETH</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Arrow */}
                    <div className="flex justify-center my-4">
                      <div className={`${theme.inputBg} p-2 rounded-full`}>
                        <FaArrowRight className="text-[#9761F4]" />
                      </div>
                    </div>

                    {/* To (Stablecoin) Output */}
                    <div className="mb-6">
                      <label className={`block ${theme.textSecondary} mb-2`}>
                        To
                      </label>
                      <div className={`${theme.inputBg} rounded-xl p-4`}>
                        <div className="flex justify-between mb-2">
                          <span className={theme.textMuted}>Amount</span>
                          <span className={theme.textMuted}>
                            Rate: 1 ETH = {exchangeRate[selectedStablecoin]}{" "}
                            {selectedStablecoin}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="text"
                            value={receivedAmount}
                            readOnly
                            className={`bg-transparent ${theme.text} text-2xl focus:outline-none w-full`}
                          />
                          <div
                            className={`flex items-center gap-2 ${theme.tokenBg} rounded-full px-4 py-2`}
                          >
                            {selectedStablecoin === "USDT" ? (
                              <SiTether className="text-green-500" />
                            ) : (
                              <span className="text-blue-500">
                                {" "}
                                <img
                                  src="/usdc.svg"
                                  style={{
                                    width: "2rem",
                                  }}
                                />
                              </span>
                            )}
                            <span className={theme.text}>
                              {selectedStablecoin}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Purchase Button */}
                    <button
                      type="submit"
                      disabled={
                        isProcessing || !ethAmount || parseFloat(ethAmount) <= 0
                      }
                      className="w-full text-light-gradient hover:from-teal-500 hover:to-indigo-600 text-white font-medium py-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isProcessing
                        ? "Processing..."
                        : `Buy ${selectedStablecoin}`}
                    </button>
                  </form>

                  {/* Info Box */}
                  <div
                    className={`mt-6 p-4 ${theme.inputBg} rounded-xl flex gap-3`}
                  >
                    <FaInfoCircle className="text-blue-400 flex-shrink-0 mt-1" />
                    <p className={`text-sm ${theme.textSecondary}`}>
                      You'll receive {selectedStablecoin} directly to your
                      connected wallet. The transaction requires ETH for gas
                      fees in addition to the amount you're exchanging.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Info & History - 2 Columns */}
            <div className="lg:col-span-2 space-y-6">
              {/* Rate Card */}
              <div className={`${theme.cardBg} rounded-xl p-6 shadow-lg`}>
                <h3 className={`text-lg font-semibold ${theme.text} mb-4`}>
                  Current Rates
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <FaEthereum className="text-[#627EEA]" />
                      <span className={theme.text}>1 ETH</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={theme.text}>{exchangeRate.USDT}</span>
                      <SiTether className="text-green-500" />
                      <span className={theme.text}>USDT</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <FaEthereum className="text-[#627EEA]" />
                      <span className={theme.text}>1 ETH</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={theme.text}>{exchangeRate.USDC}</span>
                      <span className="text-blue-500">
                        {" "}
                        <img
                          src="/usdc.svg"
                          style={{
                            width: "1rem",
                          }}
                        />
                      </span>
                      <span className={theme.text}>USDC</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Transactions */}
              <div
                className={`${theme.cardBg} rounded-xl overflow-hidden shadow-lg`}
              >
                <div
                  className={`p-4 border-b ${theme.border} flex justify-between items-center`}
                >
                  <h3 className={`text-lg font-semibold ${theme.text}`}>
                    Recent Transactions
                  </h3>
                  <FaHistory className={theme.textSecondary} />
                </div>
                <div
                  className={`divide-y ${theme.divide} max-h-[300px] overflow-y-auto`}
                >
                  {recentTransactions && recentTransactions.length > 0 ? (
                    recentTransactions.map((tx) => (
                      <div key={tx.id} className="p-4">
                        <div className="flex justify-between mb-1">
                          <span className={`${theme.textSecondary} text-sm`}>
                            {formatTimestamp(tx?.timestamp)}
                          </span>
                          <span className={`${theme.textSecondary} text-sm`}>
                            {tx.hash}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <FaEthereum className="text-[#627EEA]" />
                            <span className={theme.text}>
                              {tx.ethAmount} ETH
                            </span>
                          </div>
                          <FaArrowRight
                            className={`${
                              isDarkMode ? "text-gray-600" : "text-gray-400"
                            } mx-2`}
                          />
                          <div className="flex items-center gap-2">
                            {tx.stablecoin === "USDT" ? (
                              <SiTether className="text-green-500" />
                            ) : (
                              <span className="text-blue-500">
                                {" "}
                                <img
                                  src="/usdc.svg"
                                  style={{
                                    width: "1rem",
                                  }}
                                />
                              </span>
                            )}
                            <span className={theme.text}>
                              {tx.stablecoinAmount} {tx.stablecoin}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className={`p-6 text-center ${theme.textMuted}`}>
                      No recent transactions
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default StablecoinPurchase;
