import React, { useState, useEffect } from "react";
import {
  FaEthereum,
  FaInfoCircle,
  FaChartBar,
  FaExchangeAlt,
  FaHistory,
} from "react-icons/fa";
import { SiTether } from "react-icons/si";
import { TokenCalculator, CustomConnectButton } from "../index";
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
//
const TokenSale = ({ isDarkMode }) => {
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
    buyWithBNB,
    buyWithUSDT,
    buyWithUSDC,
    reCall,
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

  const [transactions, setTransactions] = useState([]);
  const [activeTab, setActiveTab] = useState("buyWithBNB");
  const [bnbAmount, setBnbAmount] = useState("");
  const [usdtAmount, setUsdtAmount] = useState("");
  const [usdcAmount, setUsdcAmount] = useState("");
  const [calculatedTokens, setCalculatedTokens] = useState("0");
  const [isLoading, setIsLoading] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);
  const [percentage, setPercentage] = useState(0);

  // Theme configuration
  const theme = {
    bg: isDarkMode ? "bg-[#12101A]" : "bg-white",
    inputBg: isDarkMode ? "bg-[#1A1825]" : "bg-gray-100",
    text: isDarkMode ? "text-white" : "text-gray-900",
    textSecondary: isDarkMode ? "text-gray-400" : "text-gray-600",
    textMuted: isDarkMode ? "text-gray-500" : "text-gray-500",
    border: isDarkMode ? "border-gray-800" : "border-gray-200",
    hover: isDarkMode ? "hover:bg-gray-800" : "hover:bg-gray-100",
    progressBg: isDarkMode ? "bg-gray-800" : "bg-gray-300",
    cardBg: isDarkMode ? "bg-[#1A1825]" : "bg-gray-100",
  };

  useEffect(() => {
    if (
      contractInfo &&
      "totalSupply" in contractInfo &&
      "totalSold" in contractInfo
    ) {
      console.log("Using contract info for calculation");
      const supply = Number(contractInfo.totalSupply);
      const sold = Number(contractInfo.totalSold);

      if (supply > 0) {
        const calculatedPercentage = Math.min(100, (sold / supply) * 100);
        console.log("Percentage from contract:", calculatedPercentage);
        console.log(calculatedPercentage);
        setPercentage(calculatedPercentage);
      }
    }
  }, [contractInfo]);

  // Fetch data on component mount

  useEffect(() => {
    const fetchUserData = async () => {
      if (account) {
        console.log("getUserTransactions");
        // setLoading(true);
        try {
          const transactionArray = await getUserTransactions(account);
          console.log(transactionArray);

          setTransactions(transactionArray.reverse());
        } catch (error) {
          console.error("Error fetching user data:", error);
        } finally {
          // setLoading(false);
        }
      }
    };

    fetchUserData();
  }, [account, reCall]);

  // Calculate tokens based on input and payment method
  useEffect(() => {
    if (activeTab === "buyWithBNB" && bnbAmount) {
      const tokens = parseFloat(bnbAmount) / parseFloat(contractInfo.bnbPrice);
      setCalculatedTokens(tokens.toLocaleString());
    } else if (activeTab === "buyWithUSDT" && usdtAmount) {
      const tokens =
        parseFloat(usdtAmount) * parseFloat(contractInfo.usdtTokenRatio);
      setCalculatedTokens(tokens.toLocaleString());
    } else if (activeTab === "buyWithUSDC" && usdcAmount) {
      const tokens =
        parseFloat(usdcAmount) * parseFloat(contractInfo.usdcTokenRatio);
      setCalculatedTokens(tokens.toLocaleString());
    } else {
      setCalculatedTokens("0");
    }
  }, [activeTab, bnbAmount, usdtAmount, usdcAmount]);

  // Function to handle token purchase
  const handlePurchase = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    // In a real implementation, you would call contract methods:
    if (activeTab === "buyWithBNB") {
      const transaction = await buyWithBNB(bnbAmount);
      console.log(transaction);
    } else if (activeTab === "buyWithUSDT") {
      // Assuming USDT has 6 decimals
      const transaction = await buyWithUSDT(usdtAmount);
      console.log(transaction);
    } else if (activeTab === "buyWithUSDC") {
      // Assuming USDC has 6 decimals
      const transaction = await buyWithUSDC(usdcAmount);
      console.log(transaction);
    }

    if (activeTab === "buyWithBNB") setBnbAmount("");
    if (activeTab === "buyWithUSDT") setUsdtAmount("");
    if (activeTab === "buyWithUSDC") setUsdcAmount("");

    setIsLoading(false);
  };

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

  // Calculate progress percentage based on sold tokens vs total supply
  const calculateProgressPercentage = () => {
    if (!contractInfo?.totalSold || !contractInfo?.fsxBalance) return 0;

    const availbleSupply =
      Number(contractInfo?.totalSold) + Number(contractInfo?.fsxBalance);

    const soldAmount = parseFloat(contractInfo.totalSold) || 0;
    const totalSupply = parseFloat(availbleSupply) || 1; // Prevent division by zero

    // Calculate percentage with a maximum of 100%
    const percentage = Math.min((soldAmount / totalSupply) * 100, 100);

    console.log(percentage);

    // Return percentage with maximum 2 decimal places
    return parseFloat(percentage.toFixed(2));
  };

  return (
    <>
      <Header theme={theme} title="Token Sale" />
      <div className="">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Token Stats Card */}
          <div className="lg:col-span-1">
            <div className={`${theme.bg} rounded-xl overflow-hidden shadow-lg`}>
              <div className={`p-6 border-b ${theme.border}`}>
                <h2
                  className={`text-xl font-bold ${theme.text} flex items-center`}
                >
                  <FaChartBar className="mr-2 text-[#9761F4]" />
                  Token Stats
                </h2>
              </div>

              <div className="p-6 space-y-4">
                {/* Token Info */}
                <div>
                  <h3 className="text-lg font-medium text-[#9761F4] mb-3">
                    Token Information
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className={theme.textSecondary}>Name:</span>
                      <span className={theme.text}>{TOKEN_NAME}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={theme.textSecondary}>Symbol:</span>
                      <span className={theme.text}>{TOKEN_SYMBOL}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={theme.textSecondary}>Total Supply:</span>
                      <span className={theme.text}>
                        {formatLargeNumber(tokenBalances?.fsxSupply)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className={theme.textSecondary}>
                        ICO Sale Supply:
                      </span>
                      <span className={theme.text}>
                        {formatLargeNumber(
                          Number(contractInfo?.fsxBalance) +
                            Number(contractInfo?.totalSold)
                        )}
                        &nbsp; {TOKEN_SYMBOL}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Sale Progress */}
                <div>
                  <h3 className="text-lg font-medium text-[#9761F4] mb-3">
                    Sale Progress
                  </h3>
                  <div className="mb-2">
                    <div className="flex justify-between text-sm mb-1">
                      <span className={theme.textSecondary}>Stage 1</span>
                      <span className={theme.text}>
                        {calculateProgressPercentage()}%
                      </span>
                    </div>
                    <div
                      className={`w-full ${theme.progressBg} rounded-full h-4`}
                    >
                      <div
                        className="text-light-gradient hover:from-teal-500 hover:to-indigo-600 h-4 rounded-full"
                        style={{
                          width: `${calculateProgressPercentage()}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className={theme.textSecondary}>
                        Current Price:
                      </span>
                      <span className={theme.text}>${PER_TOKEN_USD_PRICE}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={theme.textSecondary}>Next Price:</span>
                      <span className={theme.text}>
                        ${NEXT_PER_TOKEN_USD_PRICE}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className={theme.textSecondary}>Total Raised:</span>
                      <span className={theme.text}>
                        ${Number(contractInfo?.totalSold) * PER_TOKEN_USD_PRICE}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className={theme.textSecondary}>Tokens Sold:</span>
                      <span className={theme.text}>
                        {formatLargeNumber(contractInfo?.totalSold)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className={theme.textSecondary}>
                        Remaining Tokens:
                      </span>
                      <span className={theme.text}>
                        {formatLargeNumber(
                          Number(contractInfo?.fsxBalance) +
                            Number(contractInfo?.totalSold) -
                            Number(contractInfo?.totalSold)
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Token Calculator */}
                <TokenCalculator
                  isDarkMode={isDarkMode}
                  contractInfo={contractInfo}
                />
              </div>
            </div>
          </div>

          {/* Purchase Card */}
          <div className="lg:col-span-2">
            <div className={`${theme.bg} rounded-xl overflow-hidden shadow-lg`}>
              <div className={`p-6 border-b ${theme.border}`}>
                <h2
                  className={`text-xl font-bold ${theme.text} flex items-center`}
                >
                  <FaExchangeAlt className="mr-2 text-[#9761F4]" />
                  Purchase Tokens
                </h2>
              </div>

              {/* Payment Method Tabs */}
              <div className={`flex border-b ${theme.border}`}>
                <button
                  onClick={() => setActiveTab("buyWithBNB")}
                  className={`flex-1 py-4 px-6 flex justify-center items-center gap-2 ${
                    activeTab === "buyWithBNB"
                      ? "text-light-gradient hover:from-teal-500 hover:to-indigo-600 text-white"
                      : `${theme.textSecondary} ${theme.hover}`
                  }`}
                >
                  <FaEthereum />
                  <span>{CURRENCY}</span>
                </button>
                <button
                  onClick={() => setActiveTab("buyWithUSDT")}
                  className={`flex-1 py-4 px-6 flex justify-center items-center gap-2 ${
                    activeTab === "buyWithUSDT"
                      ? "text-light-gradient hover:from-teal-500 hover:to-indigo-600 text-white"
                      : `${theme.textSecondary} ${theme.hover}`
                  }`}
                >
                  <SiTether />
                  <span>USDT</span>
                </button>
                <button
                  onClick={() => setActiveTab("buyWithUSDC")}
                  className={`flex-1 py-4 px-6 flex justify-center items-center gap-2 ${
                    activeTab === "buyWithUSDC"
                      ? "text-light-gradient hover:from-teal-500 hover:to-indigo-600 text-white"
                      : `${theme.textSecondary} ${theme.hover}`
                  }`}
                >
                  <span className="text-blue-500">
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

              {/* Purchase Form */}
              <div className="p-6">
                {!isConnected ? (
                  <div className="text-center py-8">
                    <p className={`${theme.textSecondary} mb-6`}>
                      Connect your wallet to purchase tokens
                    </p>

                    <button
                      onClick={connectWallet}
                      disabled={isLoading}
                      className="font-medium py-3 rounded-xl transition-colors"
                    >
                      <CustomConnectButton isDarkMode={isDarkMode} />
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handlePurchase} className="space-y-6">
                    {/* BNB Purchase Form */}
                    {activeTab === "buyWithBNB" && (
                      <div>
                        <label className={`block ${theme.textSecondary} mb-2`}>
                          {CURRENCY} Amount
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            value={bnbAmount}
                            onChange={(e) => setBnbAmount(e.target.value)}
                            placeholder="0.0"
                            step="0.01"
                            min="0"
                            className={`w-full ${theme.inputBg} rounded-lg p-4 ${theme.text} focus:outline-none focus:ring-2 focus:ring-purple-600 pr-16`}
                            required
                          />
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                            <FaEthereum className="text-[#627EEA]" />
                            <span className={theme.textSecondary}>
                              {CURRENCY}
                            </span>
                          </div>
                        </div>
                        <p className={`text-sm ${theme.textMuted} mt-2`}>
                          1 {CURRENCY} ={" "}
                          {(
                            1 / parseFloat(Number(contractInfo?.bnbPrice) || 1)
                          ).toLocaleString()}{" "}
                          {TOKEN_SYMBOL}
                        </p>
                      </div>
                    )}

                    {/* USDT Purchase Form */}
                    {activeTab === "buyWithUSDT" && (
                      <div>
                        <label className={`block ${theme.textSecondary} mb-2`}>
                          USDT Amount
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            value={usdtAmount}
                            onChange={(e) => setUsdtAmount(e.target.value)}
                            placeholder="0.0"
                            step="1"
                            min="0"
                            className={`w-full ${theme.inputBg} rounded-lg p-4 ${theme.text} focus:outline-none focus:ring-2 focus:ring-purple-600 pr-16`}
                            required
                          />
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                            <SiTether className="text-green-500" />
                            <span className={theme.textSecondary}>USDT</span>
                          </div>
                        </div>
                        <p className={`text-sm ${theme.textMuted} mt-2`}>
                          1 USDT ={" "}
                          {parseFloat(
                            contractInfo?.usdtTokenRatio || 1
                          ).toLocaleString()}{" "}
                          {TOKEN_SYMBOL}
                        </p>
                      </div>
                    )}

                    {/* USDC Purchase Form */}
                    {activeTab === "buyWithUSDC" && (
                      <div>
                        <label className={`block ${theme.textSecondary} mb-2`}>
                          USDC Amount
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            value={usdcAmount}
                            onChange={(e) => setUsdcAmount(e.target.value)}
                            placeholder="0.0"
                            step="1"
                            min="0"
                            className={`w-full ${theme.inputBg} rounded-lg p-4 ${theme.text} focus:outline-none focus:ring-2 focus:ring-purple-600 pr-16`}
                            required
                          />
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                            <span className="text-blue-500">
                              <img
                                src="/usdc.svg"
                                style={{
                                  width: "1rem",
                                }}
                              />
                            </span>
                            <span className={theme.textSecondary}>USDC</span>
                          </div>
                        </div>
                        <p className={`text-sm ${theme.textMuted} mt-2`}>
                          1 USDC ={" "}
                          {parseFloat(
                            contractInfo?.usdtTokenRatio || 1
                          ).toLocaleString()}{" "}
                          {TOKEN_SYMBOL}
                        </p>
                      </div>
                    )}

                    {/* Token Calculation */}
                    <div className={`${theme.cardBg} rounded-lg p-4`}>
                      <div className="flex justify-between">
                        <span className={theme.textSecondary}>
                          You will receive:
                        </span>
                        <span className={`${theme.text} font-medium`}>
                          {calculatedTokens} {TOKEN_SYMBOL}
                        </span>
                      </div>
                    </div>

                    {/* Purchase Button */}
                    <button
                      type="submit"
                      disabled={
                        isLoading ||
                        parseFloat(tokenBalances?.fsxBalance || 0) < 20
                      }
                      className={`w-full ${
                        parseFloat(tokenBalances?.fsxBalance || 0) < 20
                          ? isDarkMode
                            ? "bg-gray-700 cursor-not-allowed"
                            : "bg-gray-300 cursor-not-allowed text-gray-500"
                          : "text-light-gradient hover:from-teal-500 hover:to-indigo-600"
                      } text-white font-medium py-4 rounded-lg transition-colors`}
                    >
                      {isLoading
                        ? "Processing..."
                        : parseFloat(tokenBalances?.fsxBalance || 0) < 20
                        ? "Insufficient Token Supply"
                        : `Buy with ${
                            activeTab === "buyWithBNB"
                              ? "BNB"
                              : activeTab === "buyWithUSDT"
                              ? "USDT"
                              : "USDC"
                          }`}
                    </button>
                  </form>
                )}

                {/* Information Notice */}
                <div
                  className={`mt-8 p-4 ${theme.cardBg} rounded-lg flex gap-3`}
                >
                  <FaInfoCircle className="text-blue-400 flex-shrink-0 mt-1" />
                  <p className={`text-sm ${theme.textSecondary}`}>
                    Token purchases are final and cannot be refunded. Make sure
                    you have connected the correct wallet address. The tokens
                    will be sent to your wallet after the transaction is
                    confirmed.
                  </p>
                </div>
              </div>
            </div>

            {/* Transaction History (Additional) */}
            <div
              className={`mt-6 ${theme.bg} rounded-xl overflow-hidden shadow-lg`}
            >
              <div
                className={`p-6 border-b ${theme.border} flex justify-between items-center`}
              >
                <h2
                  className={`text-xl font-bold ${theme.text} flex items-center`}
                >
                  <FaHistory className="mr-2 text-[#9761F4]" />
                  Recent Transactions
                </h2>
                <button className="text-[#9761F4] text-sm hover:text-purple-300">
                  View All
                </button>
              </div>

              <div className="p-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr
                        className={`border-b ${theme.border} text-left ${theme.textSecondary}`}
                      >
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4">Type</th>
                        <th className="py-3 px-4">Amount</th>
                        <th className="py-3 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions &&
                        transactions.slice(0, 3).map((tx, index) => (
                          <tr
                            key={index}
                            className={`border-b ${theme.border} ${
                              isDarkMode ? "text-gray-300" : "text-gray-700"
                            }`}
                          >
                            <td className="py-3 px-4">2024-02-25 10:30</td>
                            <td className="py-3 px-4">
                              <span className="flex items-center">
                                {tx.tokenIn === "BNB" ? (
                                  <>
                                    <FaEthereum className="mr-2 text-[#627EEA]" />
                                    {tx.tokenIn} Purchase
                                  </>
                                ) : tx.tokenIn === "USDT" ? (
                                  <>
                                    <SiTether className="mr-2 text-green-500" />
                                    USDT Purchase
                                  </>
                                ) : (
                                  <>
                                    <span className="mr-2 text-blue-500 font-bold">
                                      <img
                                        src="/usdc.svg"
                                        style={{
                                          width: "1rem",
                                        }}
                                      />
                                    </span>
                                    USDC Purchase
                                  </>
                                )}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              {tx.amountOut} {TOKEN_SYMBOL}
                            </td>
                            <td className="py-3 px-4">
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
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TokenSale;
