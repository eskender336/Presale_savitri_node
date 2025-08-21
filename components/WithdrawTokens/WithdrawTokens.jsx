import React, { useState, useEffect, useRef } from "react";
import { ethers } from "ethers";
import {
  FaWallet,
  FaArrowRight,
  FaCoins,
  FaEthereum,
  FaExclamationTriangle,
} from "react-icons/fa";
import { SiTether } from "react-icons/si";
import { Header } from "../index";
import { useWeb3 } from "../../context/Web3Provider";

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
const FSX_ADDRESS = process.env.NEXT_PUBLIC_SAV_ADDRESS;
const ETH_ADDRESS = process.env.NEXT_PUBLIC_ETH_ADDRESS;
const EXPLORER_ADDRESS_URL = process.env.NEXT_PUBLIC_EXPLORER_ADDRESS_URL;

const WithdrawTokens = ({ isDarkMode }) => {
  const { tokenBalances, error, connectWallet, withdrawTokens } = useWeb3();

  // Theme configuration
  const theme = {
    mainBg: isDarkMode ? "bg-[#0D0B12]" : "bg-gray-100",
    cardBg: isDarkMode ? "bg-[#12101A]" : "bg-white",
    innerBg: isDarkMode ? "bg-[#1A1825]" : "bg-gray-100",
    tokenBg: isDarkMode ? "bg-[#292838]" : "bg-gray-200",
    text: isDarkMode ? "text-white" : "text-gray-900",
    textSecondary: isDarkMode ? "text-gray-400" : "text-gray-600",
    textMuted: isDarkMode ? "text-gray-500" : "text-gray-500",
    border: isDarkMode ? "border-gray-800" : "border-gray-200",
    divide: isDarkMode ? "divide-gray-800" : "divide-gray-200",
    buttonBg: isDarkMode ? "bg-[#1A1825]" : "bg-gray-100",
    buttonHover: isDarkMode ? "hover:bg-[#20202e]" : "hover:bg-gray-200",
    warningBg: isDarkMode ? "bg-red-900/20" : "bg-red-100",
    warningText: isDarkMode ? "text-red-400" : "text-red-600",
    warningIcon: isDarkMode ? "text-red-500" : "text-red-500",
    adminBadgeBg: isDarkMode ? "bg-yellow-900/30" : "bg-yellow-100",
    adminBadgeText: isDarkMode ? "text-yellow-400" : "text-yellow-600",
    completedBg: isDarkMode ? "bg-green-900/30" : "bg-green-100",
    completedText: isDarkMode ? "text-green-400" : "text-green-600",
    arrowColor: isDarkMode ? "text-gray-600" : "text-gray-400",
  };
  const [selectedToken, setSelectedToken] = useState(TOKEN_SYMBOL);
  const [amount, setAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [withdrawals, setWithdrawals] = useState([]);
  const [tokenBalancesNew, setTokenBalancesNew] = useState({
    SAV: tokenBalances?.fsxBalance,
    ETH: tokenBalances?.contractEthBalance,
    USDT: tokenBalances?.usdtBalance,
    USDC: tokenBalances?.usdcBalance,
  });
  const [tokenAddresses, setTokenAddresses] = useState({
    SAV: FSX_ADDRESS,
    ETH: ETH_ADDRESS,
    USDT: USDT_ADDRESS,
    USDC: USDC_ADDRESS,
  });

  // Format address for display
  const formatAddress = (address) => {
    return `${address?.substring(0, 6)}...${address?.substring(
      address.length - 4
    )}`;
  };

  // Get token icon based on token type
  const getTokenIcon = (token) => {
    switch (token) {
      case "ETH":
        return <FaEthereum className="text-[#627EEA]" />;
      case "USDT":
        return <SiTether className="text-green-500" />;
      case "USDC":
        return (
          <span className="text-blue-500">
            <img
              src="/usdc.svg"
              style={{
                width: "1rem",
              }}
            />
          </span>
        );
      default:
        return (
          <span className="text-blue-500">
            <img
              src={isDarkMode ? "/SavitriNetwork.png" : "/SavitriNetworkBlack.png"}
              style={{
                width: "1rem",
              }}
            />
          </span>
        );
    }
  };

  // Updated handleWithdraw function with localStorage integration for page reload support
  const handleWithdraw = async (e) => {
    e.preventDefault();

    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    // Make sure the amount doesn't exceed the balance
    if (parseFloat(amount) > parseFloat(tokenBalancesNew[selectedToken])) {
      alert(
        `Insufficient balance. Maximum available: ${tokenBalancesNew[selectedToken]} ${selectedToken}`
      );
      return;
    }

    setIsProcessing(true);

    try {
      // In a real implementation you would call the contract method:
      const tokenAddress = tokenAddresses[selectedToken];
      const tokenAmount = ethers.utils.parseUnits(
        amount,
        selectedToken === "ETH"
          ? 18
          : selectedToken === "USDT" || selectedToken === "USDC"
          ? 6
          : 18
      );

      const tx = await withdrawTokens(tokenAddress, tokenAmount);

      // Simulate transaction
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Update the token balance (simulate)
      setTokenBalancesNew((prev) => ({
        ...prev,
        [selectedToken]: (
          parseFloat(prev[selectedToken]) - parseFloat(amount)
        ).toString(),
      }));

      // Record the withdrawal
      const newWithdrawal = {
        id: Date.now(),
        token: selectedToken,
        amount: amount,
        timestamp: new Date(),
        address: tokenAddresses[selectedToken],
        status: "Completed",
      };

      // Update state
      const updatedWithdrawals = [newWithdrawal, ...withdrawals];
      setWithdrawals(updatedWithdrawals);

      // Save to localStorage
      saveWithdrawalsToLocalStorage(updatedWithdrawals);

      setAmount("");
    } catch (error) {
      console.error("Error withdrawing tokens:", error);
      alert(`Failed to withdraw tokens: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // First useEffect: Load data from localStorage on mount only
  useEffect(() => {
    const savedWithdrawals = getWithdrawalsFromLocalStorage();
    if (savedWithdrawals.length > 0) {
      setWithdrawals(savedWithdrawals);
    }
  }, []);

  // Create a ref to track current withdrawals state
  const withdrawalsRef = useRef(withdrawals);

  // Update ref whenever withdrawals change
  useEffect(() => {
    withdrawalsRef.current = withdrawals;
  }, [withdrawals]);

  // Second useEffect: Set up beforeunload event listener (runs once)
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Use the ref to access latest withdrawals state
      saveWithdrawalsToLocalStorage(withdrawalsRef.current);
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  // Format date for display
  const formatDate = (date) => {
    return date.toLocaleString();
  };

  // Function to save withdrawals to localStorage
  const saveWithdrawalsToLocalStorage = (withdrawals) => {
    try {
      localStorage.setItem("withdrawals", JSON.stringify(withdrawals));
      return true;
    } catch (error) {
      console.error("Error saving withdrawals to localStorage:", error);
      return false;
    }
  };

  // Function to fetch withdrawals from localStorage
  const getWithdrawalsFromLocalStorage = () => {
    try {
      const withdrawals = localStorage.getItem("withdrawals");
      return withdrawals ? JSON.parse(withdrawals) : [];
    } catch (error) {
      console.error("Error fetching withdrawals from localStorage:", error);
      return [];
    }
  };

  return (
    <>
      <Header theme={theme} title="Withdraw Tokens" />
      <div className={`${theme.mainBg} min-h-screen `}>
        <div className=" mx-auto">
          {/* Header */}
          <div className="mb-8">
            <p className={theme.textSecondary}>
              Admin interface to withdraw tokens from the contract to the owner
              wallet.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Withdraw Form - 3 Columns */}
            <div
              className={`lg:col-span-3 ${theme.cardBg} rounded-xl overflow-hidden shadow-lg`}
            >
              <div
                className={`p-6 border-b ${theme.border} flex justify-between items-center`}
              >
                <h2
                  className={`text-xl font-bold ${theme.text} flex items-center`}
                >
                  <FaWallet className="mr-2 text-[#9761F4]" />
                  Withdraw Tokens
                </h2>
                <div
                  className={`px-3 py-1 ${theme.adminBadgeBg} ${theme.adminBadgeText} rounded-full text-xs font-medium`}
                >
                  Admin Only
                </div>
              </div>

              <div className="p-6">
                <form onSubmit={handleWithdraw}>
                  {/* Token Selection */}
                  <div className="mb-6">
                    <label className={`block ${theme.textSecondary} mb-2`}>
                      Select Token
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {["ETH", "SAV", "USDT", "USDC"].map((token) => (
                        <button
                          key={token}
                          type="button"
                          onClick={() => setSelectedToken(token)}
                          className={`py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors ${
                            selectedToken === token
                              ? "text-light-gradient hover:from-teal-500 hover:to-indigo-600 text-white"
                              : `${theme.buttonBg} ${theme.textSecondary} ${theme.buttonHover}`
                          }`}
                        >
                          {getTokenIcon(token)}
                          <span>{token}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Token Balance Card */}
                  <div className={`${theme.innerBg} rounded-xl p-4 mb-6`}>
                    <div className="flex justify-between items-center mb-1">
                      <span className={theme.textSecondary}>
                        Available Balance
                      </span>
                      <div className="flex items-center">
                        {getTokenIcon(selectedToken)}
                        <span className={`${theme.text} ml-2`}>
                          {selectedToken}
                        </span>
                      </div>
                    </div>
                    <div className={`text-2xl font-bold ${theme.text}`}>
                      {tokenBalancesNew[selectedToken]} {selectedToken}
                    </div>
                    <div className={`text-sm ${theme.textMuted} mt-1`}>
                      Address: {formatAddress(tokenAddresses[selectedToken])}
                    </div>
                  </div>

                  {/* Amount Input */}
                  <div className="mb-6">
                    <label className={`block ${theme.textSecondary} mb-2`}>
                      Amount to Withdraw
                    </label>
                    <div
                      className={`${theme.innerBg} rounded-xl p-4 flex items-center`}
                    >
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.0"
                        step="any"
                        min="0"
                        max={tokenBalancesNew[selectedToken]}
                        className={`bg-transparent ${theme.text} text-2xl focus:outline-none w-full`}
                        required
                      />
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setAmount(tokenBalancesNew[selectedToken])
                          }
                          className="text-purple-400 text-sm hover:text-purple-300 mr-2"
                        >
                          MAX
                        </button>
                        <div
                          className={`flex items-center gap-1 ${theme.tokenBg} rounded-full px-3 py-1`}
                        >
                          {getTokenIcon(selectedToken)}
                          <span className={theme.text}>{selectedToken}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Destination */}
                  <div className={`${theme.innerBg} rounded-xl p-4 mb-6`}>
                    <div className="flex justify-between mb-1">
                      <span className={theme.textSecondary}>Destination</span>
                      <span className={theme.textSecondary}>Owner Wallet</span>
                    </div>
                    <div className="flex items-center">
                      <FaWallet className="text-[#9761F4] mr-2" />
                      <span className={theme.text}>Contract Owner</span>
                      <FaArrowRight className={`${theme.arrowColor} mx-4`} />
                      <span
                        className={`${
                          isDarkMode ? "text-gray-300" : "text-gray-600"
                        } text-sm`}
                      >
                        {formatAddress(OWNER_ADDRESS)}
                      </span>
                    </div>
                  </div>

                  {/* Warning */}
                  <div
                    className={`${theme.warningBg} rounded-xl p-4 mb-6 flex gap-3`}
                  >
                    <FaExclamationTriangle
                      className={`${theme.warningIcon} flex-shrink-0 mt-1`}
                    />
                    <div>
                      <p className={`${theme.warningText} font-medium`}>
                        Warning
                      </p>
                      <p className={`text-sm ${theme.textSecondary}`}>
                        This will permanently withdraw tokens from the contract
                        to the owner wallet. This action cannot be reversed.
                      </p>
                    </div>
                  </div>

                  {/* Withdraw Button */}
                  <button
                    type="submit"
                    disabled={
                      isProcessing || !amount || parseFloat(amount) <= 0
                    }
                    className="w-full text-light-gradient hover:from-teal-500 hover:to-indigo-600 text-white font-medium py-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessing
                      ? "Processing..."
                      : `Withdraw ${selectedToken}`}
                  </button>
                </form>
              </div>
            </div>

            {/* Info & History - 2 Columns */}
            <div className="lg:col-span-2 space-y-6">
              {/* Info Card */}
              <div className={`${theme.cardBg} rounded-xl p-6 shadow-lg`}>
                <h3 className={`text-lg font-semibold ${theme.text} mb-4`}>
                  Admin Information
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className={theme.textSecondary}>
                      Contract Address
                    </span>
                    <span className={theme.text}>
                      {formatAddress(TOKEN_ICO_ADDRESS)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className={theme.textSecondary}>Owner Address</span>
                    <span className={theme.text}>
                      {formatAddress(OWNER_ADDRESS)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className={theme.textSecondary}>Network</span>
                    <span className={theme.text}>{BLOCKCHAIN}</span>
                  </div>
                </div>
              </div>

              {/* Recent Withdrawals */}
              <div
                className={`${theme.cardBg} rounded-xl overflow-hidden shadow-lg`}
              >
                <div className={`p-4 border-b ${theme.border}`}>
                  <h3 className={`text-lg font-semibold ${theme.text}`}>
                    Recent Withdrawals
                  </h3>
                </div>
                <div className="max-h-[400px] overflow-y-auto">
                  {withdrawals && withdrawals.length > 0 ? (
                    <div className={`divide-y ${theme.divide}`}>
                      {withdrawals.map((withdrawal) => (
                        <div key={withdrawal.id} className="p-4">
                          <div className="flex justify-between mb-1">
                            <div className="flex items-center gap-2">
                              {getTokenIcon(withdrawal.token)}
                              <span className={`${theme.text} font-medium`}>
                                {withdrawal.amount} {withdrawal.token}
                              </span>
                            </div>
                            <span
                              className={`text-xs ${theme.completedBg} ${theme.completedText} px-2 py-1 rounded-full`}
                            >
                              {withdrawal.status}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className={theme.textSecondary}>
                              {formatDate(withdrawal.timestamp)}
                            </span>
                            <a
                              href={`${EXPLORER_ADDRESS_URL}${withdrawal.address}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#9761F4] "
                            >
                              {formatAddress(withdrawal.address)}
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className={`p-6 text-center ${theme.textMuted}`}>
                      No recent withdrawals
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

export default WithdrawTokens;
