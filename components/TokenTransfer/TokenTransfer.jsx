import React, { useState, useEffect } from "react";
import {
  FaExchangeAlt,
  FaWallet,
  FaClipboard,
  FaCheck,
  FaInfoCircle,
  FaArrowRight,
  FaSearch,
  FaHistory,
} from "react-icons/fa";
import { SiTether } from "react-icons/si";
import { useWeb3 } from "../../context/Web3Provider";
import { ethers } from "ethers";
import { Header } from "../index";

const USDT_ADDRESS = process.env.NEXT_PUBLIC_USDT_ADDRESS;
const USDC_ADDRESS = process.env.NEXT_PUBLIC_USDC_ADDRESS;
const FSX_ADDRESS = process.env.NEXT_PUBLIC_FSX_ADDRESS;
const EXPLORER_TX = process.env.NEXT_PUBLIC_EXPLORER_TX;

/// Minimal ERC20 ABI
const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function name() view returns (string)",
  "function transfer(address to, uint amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
];

const TokenTransfer = ({ isDarkMode }) => {
  const {
    account,
    signer,
    isConnected,
    connectWallet,
    formatAddress,
    setReCall,
  } = useWeb3();

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
    hover: isDarkMode ? "hover:bg-gray-800/30" : "hover:bg-gray-100",
    buttonBg: isDarkMode ? "bg-[#1A1825]" : "bg-gray-100",
    buttonHover: isDarkMode ? "hover:bg-[#20202e]" : "hover:bg-gray-200",
    errorBg: isDarkMode ? "bg-red-900/20" : "bg-red-100",
    errorText: isDarkMode ? "text-red-400" : "text-red-600",
    successBg: isDarkMode ? "bg-green-900/20" : "bg-green-100",
    successText: isDarkMode ? "text-green-400" : "text-green-600",
  };

  // State variables
  const [activeTab, setActiveTab] = useState("stablecoin");
  const [selectedToken, setSelectedToken] = useState("USDT");
  const [customToken, setCustomToken] = useState("");
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [transactionHash, setTransactionHash] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [balances, setBalances] = useState({
    USDT: "0",
    USDC: "0",
    custom: "0",
  });
  const [clipboard, setClipboard] = useState({
    copied: false,
    field: null,
  });
  const [customTokenInfo, setCustomTokenInfo] = useState({
    symbol: "",
    name: "",
    decimals: 18,
    isValid: false,
  });
  const [transactions, setTransactions] = useState([]);

  // Token addresses
  const tokenAddresses = {
    USDT: USDT_ADDRESS, // Mainnet USDT address
    USDC: USDC_ADDRESS, // Mainnet USDC address
  };

  // Fetch balances when connected or token changes
  useEffect(() => {
    if (isConnected && signer) {
      fetchBalances();
    }
  }, [
    isConnected,
    signer,
    selectedToken,
    customToken,
    customTokenInfo.isValid,
  ]);

  // Reset state when tab changes
  useEffect(() => {
    setAmount("");
    setRecipient("");
    setErrorMessage("");
    setSuccessMessage("");
    setTransactionHash("");
  }, [activeTab]);

  // Fetch balances for USDT, USDC, and custom token
  const fetchBalances = async () => {
    if (!signer) return;

    try {
      // Get user address
      const userAddress = await signer.getAddress();

      initializeTransactions(signer);

      // Fetch USDT balance
      const usdtContract = new ethers.Contract(
        tokenAddresses.USDT,
        ERC20_ABI,
        signer
      );
      const usdtBalance = await usdtContract.balanceOf(userAddress);
      const usdtDecimals = await usdtContract.decimals();

      // Fetch USDC balance
      const usdcContract = new ethers.Contract(
        tokenAddresses.USDC,
        ERC20_ABI,
        signer
      );
      const usdcBalance = await usdcContract.balanceOf(userAddress);
      const usdcDecimals = await usdcContract.decimals();

      // Format balances
      const formattedUsdtBalance = ethers.utils.formatUnits(
        usdtBalance,
        usdtDecimals
      );
      const formattedUsdcBalance = ethers.utils.formatUnits(
        usdcBalance,
        usdcDecimals
      );

      // Update state
      setBalances((prev) => ({
        ...prev,
        USDT: formattedUsdtBalance,
        USDC: formattedUsdcBalance,
      }));

      // Fetch custom token balance if address provided
      if (
        customToken &&
        ethers.utils.isAddress(customToken) &&
        activeTab === "custom"
      ) {
        try {
          const customContract = new ethers.Contract(
            customToken,
            ERC20_ABI,
            signer
          );
          const customBalance = await customContract.balanceOf(userAddress);
          const symbol = await customContract.symbol();
          const name = await customContract.name();
          const decimals = await customContract.decimals();

          const formattedCustomBalance = ethers.utils.formatUnits(
            customBalance,
            decimals
          );

          setBalances((prev) => ({
            ...prev,
            custom: formattedCustomBalance,
          }));

          setCustomTokenInfo({
            symbol,
            name,
            decimals,
            isValid: true,
          });
        } catch (error) {
          console.error("Error fetching custom token info:", error);
          setCustomTokenInfo({
            symbol: "",
            name: "",
            decimals: 18,
            isValid: false,
          });
        }
      }
    } catch (error) {
      console.error("Error fetching balances:", error);
    }
  };

  const handleTransfer = async (e) => {
    e.preventDefault();

    // Validate inputs
    if (!recipient || !amount || parseFloat(amount) <= 0) {
      setErrorMessage("Please enter a valid recipient address and amount");
      return;
    }

    // Check if recipient is a valid address
    if (!ethers.utils.isAddress(recipient)) {
      setErrorMessage("Invalid recipient address");
      return;
    }

    // Reset messages
    setSuccessMessage("");
    setErrorMessage("");
    setTransactionHash("");
    setIsProcessing(true);

    try {
      let tokenContract;
      let tokenDecimals;
      let tokenSymbol;

      // Get contract and token details based on active tab and selected token
      if (activeTab === "stablecoin") {
        tokenContract = new ethers.Contract(
          tokenAddresses[selectedToken],
          ERC20_ABI,
          signer
        );
        tokenDecimals = await tokenContract.decimals();
        tokenSymbol = selectedToken;
      } else {
        // Custom token
        if (!customTokenInfo.isValid) {
          throw new Error("Invalid token address");
        }

        tokenContract = new ethers.Contract(customToken, ERC20_ABI, signer);
        tokenDecimals = customTokenInfo.decimals;
        tokenSymbol = customTokenInfo.symbol;
      }

      // Parse amount with correct decimals
      const parsedAmount = ethers.utils.parseUnits(amount, tokenDecimals);

      // Check balance
      const userAddress = await signer.getAddress();
      const balance = await tokenContract.balanceOf(userAddress);

      if (balance.lt(parsedAmount)) {
        throw new Error(`Insufficient ${tokenSymbol} balance`);
      }

      // Execute transfer
      const tx = await tokenContract.transfer(recipient, parsedAmount);

      // Create transaction object
      const newTx = {
        hash: tx.hash,
        token: tokenSymbol,
        amount,
        recipient,
        timestamp: new Date().toISOString(),
        confirmed: false,
        userAddress: userAddress,
      };

      // Update state with new transaction
      setTransactions((prev) => {
        const updatedTransactions = [newTx, ...prev];

        // Store in localStorage
        saveTransactionsToLocalStorage(updatedTransactions, userAddress);

        return updatedTransactions;
      });

      // Wait for transaction confirmation
      const receipt = await tx.wait();

      // Update transaction status and save to localStorage
      setTransactions((prev) => {
        const updatedTransactions = prev.map((t) =>
          t.hash === tx.hash ? { ...t, confirmed: true } : t
        );

        // Store updated transactions in localStorage
        saveTransactionsToLocalStorage(updatedTransactions, userAddress);

        return updatedTransactions;
      });

      // Set success message and transaction hash
      setTransactionHash(tx.hash);
      setSuccessMessage(
        `Successfully transferred ${amount} ${tokenSymbol} to ${formatAddress(
          recipient
        )}`
      );

      // Clear form
      setAmount("");

      // Refresh balances
      fetchBalances();
      setReCall(1);
    } catch (error) {
      console.error("Transfer error:", error);
      setErrorMessage(error.message || "Transaction failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle copying to clipboard
  const copyToClipboard = (text, field) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setClipboard({ copied: true, field });
        setTimeout(() => setClipboard({ copied: false, field: null }), 2000);
      })
      .catch((err) => console.error("Failed to copy:", err));
  };

  // Validate custom token address
  const validateCustomToken = async () => {
    if (!ethers.utils.isAddress(customToken)) {
      setErrorMessage("Invalid token address");
      setCustomTokenInfo({
        symbol: "",
        name: "",
        decimals: 18,
        isValid: false,
      });
      return;
    }

    setErrorMessage("");

    // Fetch token details
    try {
      const customContract = new ethers.Contract(
        customToken,
        ERC20_ABI,
        signer
      );
      const symbol = await customContract.symbol();
      const name = await customContract.name();
      const decimals = await customContract.decimals();

      setCustomTokenInfo({
        symbol,
        name,
        decimals,
        isValid: true,
      });

      // Fetch balance
      const userAddress = await signer.getAddress();
      const balance = await customContract.balanceOf(userAddress);
      const formattedBalance = ethers.utils.formatUnits(balance, decimals);

      setBalances((prev) => ({
        ...prev,
        custom: formattedBalance,
      }));
    } catch (error) {
      console.error("Error validating token:", error);
      setErrorMessage(
        "Could not validate token. Please check the address and try again."
      );
      setCustomTokenInfo({
        symbol: "",
        name: "",
        decimals: 18,
        isValid: false,
      });
    }
  };

  // Handle Max button click
  const handleMaxAmount = () => {
    if (activeTab === "stablecoin") {
      setAmount(balances[selectedToken]);
    } else if (activeTab === "custom" && customTokenInfo.isValid) {
      setAmount(balances.custom);
    }
  };

  // Helper function to save transactions to localStorage
  const saveTransactionsToLocalStorage = (transactions, userAddress) => {
    try {
      // Create a key specific to the user's address
      const storageKey = `transactions_${userAddress}`;
      localStorage.setItem(storageKey, JSON.stringify(transactions));
    } catch (error) {
      console.error("Error saving to localStorage:", error);
    }
  };

  const loadTransactionsFromLocalStorage = (userAddress) => {
    try {
      const storageKey = `transactions_${userAddress}`;
      const storedTransactions = localStorage.getItem(storageKey);

      if (storedTransactions) {
        return JSON.parse(storedTransactions);
      }

      return [];
    } catch (error) {
      console.error("Error loading from localStorage:", error);
      return [];
    }
  };

  const initializeTransactions = async (signer) => {
    if (signer) {
      try {
        const userAddress = await signer.getAddress();
        const storedTransactions =
          loadTransactionsFromLocalStorage(userAddress);
        setTransactions(storedTransactions);
      } catch (error) {
        console.error("Error initializing transactions:", error);
      }
    }
  };

  // Function to clear transaction history
  const clearTransactionHistory = async () => {
    try {
      const userAddress = await signer.getAddress();
      const storageKey = `transactions_${userAddress}`;
      localStorage.removeItem(storageKey);
      setTransactions([]);
    } catch (error) {
      console.error("Error clearing transaction history:", error);
    }
  };

  return (
    <>
      <Header theme={theme} title="Transfer" />
      <div className={`min-h-screen ${theme.mainBg} `}>
        <div className="">
          {/* Header */}
          <div className="mb-8">
            <p className={theme.textSecondary}>
              Send USDT, USDC, or any ERC20 token to another wallet address.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Transfer Card */}
            <div className="lg:col-span-2">
              <div
                className={`${theme.cardBg} rounded-xl overflow-hidden shadow-lg`}
              >
                {/* Tab Navigation */}
                <div className={`flex border-b ${theme.border}`}>
                  <button
                    onClick={() => setActiveTab("stablecoin")}
                    className={`flex-1 py-4 px-4 flex justify-center items-center gap-2 ${
                      activeTab === "stablecoin"
                        ? "bg-gradient-to-r from-teal-400 to-indigo-500 hover:from-teal-500 hover:to-indigo-600 text-white"
                        : `${theme.textSecondary} ${theme.hover}`
                    }`}
                  >
                    <SiTether className="text-green-500" />
                    <span>Stablecoins</span>
                  </button>
                  <button
                    onClick={() => setActiveTab("custom")}
                    className={`flex-1 py-4 px-4 flex justify-center items-center gap-2 ${
                      activeTab === "custom"
                        ? "bg-gradient-to-r from-teal-400 to-indigo-500 hover:from-teal-500 hover:to-indigo-600 text-white"
                        : `${theme.textSecondary} ${theme.hover}`
                    }`}
                  >
                    <FaExchangeAlt />
                    <span>Custom ERC20</span>
                  </button>
                </div>

                {!isConnected ? (
                  <div className="p-6 flex flex-col items-center justify-center py-12">
                    <p className={`${theme.textSecondary} mb-6 text-center`}>
                      Connect your wallet to transfer tokens
                    </p>
                    <button
                      onClick={connectWallet}
                      className="bg-gradient-to-r from-teal-400 to-indigo-500 hover:from-teal-500 hover:to-indigo-600 text-white font-medium py-3 px-8 rounded-xl transition-colors"
                    >
                      Connect Wallet
                    </button>
                  </div>
                ) : (
                  <div className="p-6">
                    {/* Connected as */}
                    <div
                      className={`${theme.innerBg} rounded-xl p-4 mb-6 flex items-center justify-between`}
                    >
                      <div className="flex items-center gap-3">
                        <FaWallet className="text-[#DE3657]" />
                        <div>
                          <span className={theme.textSecondary + " text-sm"}>
                            Connected as
                          </span>
                          <div className={theme.text}>
                            {formatAddress(account)}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => copyToClipboard(account, "account")}
                        className={`${theme.textSecondary} hover:${theme.text} p-2`}
                        title="Copy address"
                      >
                        {clipboard.copied && clipboard.field === "account" ? (
                          <FaCheck className="text-green-500" />
                        ) : (
                          <FaClipboard />
                        )}
                      </button>
                    </div>

                    <form onSubmit={handleTransfer}>
                      {/* Stablecoin Selection (only visible in stablecoin tab) */}
                      {activeTab === "stablecoin" && (
                        <div className="mb-6">
                          <label
                            className={`block ${theme.textSecondary} mb-2`}
                          >
                            Select Token
                          </label>
                          <div className="flex space-x-4">
                            <button
                              type="button"
                              onClick={() => setSelectedToken("USDT")}
                              className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 ${
                                selectedToken === "USDT"
                                  ? "bg-gradient-to-r from-teal-400 to-indigo-500 hover:from-teal-500 hover:to-indigo-600 text-white"
                                  : `${theme.buttonBg} ${theme.textSecondary} ${theme.buttonHover}`
                              }`}
                            >
                              <SiTether className="text-green-500" />
                              <span>USDT</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setSelectedToken("USDC")}
                              className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 ${
                                selectedToken === "USDC"
                                  ? "bg-gradient-to-r from-teal-400 to-indigo-500 hover:from-teal-500 hover:to-indigo-600 text-white"
                                  : `${theme.buttonBg} ${theme.textSecondary} ${theme.buttonHover}`
                              }`}
                            >
                              <span className="text-blue-500 font-semibold">
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
                        </div>
                      )}

                      {/* Custom Token Input (only visible in custom tab) */}
                      {activeTab === "custom" && (
                        <div className="mb-6">
                          <label
                            className={`block ${theme.textSecondary} mb-2`}
                          >
                            Token Address
                          </label>
                          <div className="flex">
                            <input
                              type="text"
                              value={customToken}
                              onChange={(e) => setCustomToken(e.target.value)}
                              placeholder="0x..."
                              className={`${theme.innerBg} ${theme.text} rounded-l-xl p-4 focus:outline-none w-full`}
                            />
                            <button
                              type="button"
                              onClick={validateCustomToken}
                              className="bg-gradient-to-r from-teal-400 to-indigo-500 hover:from-teal-500 hover:to-indigo-600 text-white px-4 rounded-r-xl"
                            >
                              <FaSearch />
                            </button>
                          </div>

                          {customTokenInfo.isValid && (
                            <div className="mt-2 text-sm">
                              <span className="text-[#DE3657]">
                                {customTokenInfo.name}
                              </span>
                              <span className={`${theme.textSecondary} mx-2`}>
                                |
                              </span>
                              <span className={theme.text}>
                                {customTokenInfo.symbol}
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Balance Display */}
                      <div className="mb-6">
                        <div className="flex justify-between mb-2">
                          <label className={theme.textSecondary}>
                            Your Balance
                          </label>
                          <span className={theme.textSecondary}>
                            {activeTab === "stablecoin"
                              ? `${parseFloat(balances[selectedToken]).toFixed(
                                  2
                                )} ${selectedToken}`
                              : customTokenInfo.isValid
                              ? `${parseFloat(balances.custom).toFixed(4)} ${
                                  customTokenInfo.symbol
                                }`
                              : "0"}
                          </span>
                        </div>
                      </div>

                      {/* Recipient Address */}
                      <div className="mb-6">
                        <label className={`block ${theme.textSecondary} mb-2`}>
                          Recipient Address
                        </label>
                        <div
                          className={`${theme.innerBg} rounded-xl p-4 flex items-center`}
                        >
                          <input
                            type="text"
                            value={recipient}
                            onChange={(e) => setRecipient(e.target.value)}
                            placeholder="0x..."
                            className={`bg-transparent ${theme.text} focus:outline-none w-full`}
                            required
                          />
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.readText().then((text) => {
                                if (text && ethers.utils.isAddress(text)) {
                                  setRecipient(text);
                                }
                              });
                            }}
                            className={`${theme.textSecondary} hover:${theme.text}`}
                            title="Paste from clipboard"
                          >
                            <FaClipboard />
                          </button>
                        </div>
                      </div>

                      {/* Amount */}
                      <div className="mb-6">
                        <label className={`block ${theme.textSecondary} mb-2`}>
                          Amount
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
                            className={`bg-transparent ${theme.text} text-xl focus:outline-none w-full`}
                            required
                          />
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={handleMaxAmount}
                              className="text-[#DE3657] text-sm hover:text-purple-300 mr-2"
                            >
                              MAX
                            </button>
                            <div
                              className={`${theme.tokenBg} rounded-full px-3 py-1 ${theme.text}`}
                            >
                              {activeTab === "stablecoin"
                                ? selectedToken
                                : customTokenInfo.isValid
                                ? customTokenInfo.symbol
                                : "TOKEN"}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Error Message */}
                      {errorMessage && (
                        <div
                          className={`mb-6 p-4 rounded-xl ${theme.errorBg} ${theme.errorText} flex items-start gap-3`}
                        >
                          <FaInfoCircle className="mt-1" />
                          <span>{errorMessage}</span>
                        </div>
                      )}

                      {/* Success Message */}
                      {successMessage && (
                        <div
                          className={`mb-6 p-4 rounded-xl ${theme.successBg} ${theme.successText} flex items-start gap-3`}
                        >
                          <FaCheck className="mt-1" />
                          <div>
                            <p>{successMessage}</p>
                            {transactionHash && (
                              <a
                                href={`${EXPLORER_TX}${transactionHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#DE3657] hover:text-purple-300 mt-2 inline-block"
                              >
                                View on Etherscan
                              </a>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Transfer Button */}
                      <button
                        type="submit"
                        disabled={
                          isProcessing ||
                          !recipient ||
                          !amount ||
                          (activeTab === "custom" && !customTokenInfo.isValid)
                        }
                        className="w-full bg-gradient-to-r from-teal-400 to-indigo-500 hover:from-teal-500 hover:to-indigo-600 text-white font-medium py-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isProcessing ? "Processing..." : "Transfer Token"}
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </div>

            {/* Transaction History */}
            <div className="lg:col-span-1">
              <div
                className={`${theme.cardBg} rounded-xl overflow-hidden h-full shadow-lg`}
              >
                <div
                  className={`p-4 border-b ${theme.border} flex justify-between items-center`}
                >
                  <h3 className={`text-lg font-semibold ${theme.text}`}>
                    Recent Transfers
                  </h3>
                  <FaHistory className={theme.textSecondary} />
                </div>

                <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto">
                  {transactions && transactions.length > 0 ? (
                    transactions.map((tx, index) => (
                      <div
                        key={index}
                        className={`${theme.innerBg} rounded-xl p-4`}
                      >
                        <div className="flex justify-between items-center mb-2">
                          <span className={`${theme.text} font-medium`}>
                            {tx.token}
                          </span>
                          <a
                            href={`${EXPLORER_TX}${tx.hash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#DE3657] hover:text-purple-300 text-xs"
                          >
                            {tx.hash.substring(0, 6)}...
                            {tx.hash.substring(tx.hash.length - 4)}
                          </a>
                        </div>
                        <div
                          className={`flex items-center gap-2 ${theme.textSecondary} text-sm`}
                        >
                          <span>{parseFloat(tx.amount).toFixed(2)}</span>
                          <FaArrowRight
                            className={
                              isDarkMode ? "text-gray-600" : "text-gray-400"
                            }
                          />
                          <span>{formatAddress(tx.recipient)}</span>
                        </div>
                        <div className={`mt-2 text-xs ${theme.textMuted}`}>
                          {tx.timestamp.toLocaleString()}
                          {tx.confirmed && (
                            <span className={`ml-2 ${theme.successText}`}>
                              <FaCheck className="inline-block" /> Confirmed
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className={`text-center py-8 ${theme.textMuted}`}>
                      No recent transfers
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

export default TokenTransfer;
