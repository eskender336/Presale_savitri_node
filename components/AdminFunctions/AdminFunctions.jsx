import React, { useState } from "react";
import { utils } from "ethers";
import { BsBank2 } from "react-icons/bs";
import {
  FaDollarSign,
  FaCoins,
  FaExchangeAlt,
  FaBan,
  FaSave,
  FaCheck,
} from "react-icons/fa";
import { useWeb3 } from "../../context/Web3Provider";
import { Success, Error } from "../index";
import { Header } from "../index";

const AdminFunctions = ({ isDarkMode }) => {
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
    formatAddress,
    formatTokenAmount,
    refreshContractData,
    isOwner,
    updateBaseAPY,
    updateMinStakeAmount,
    updateStablecoinPrice,
  } = useWeb3();

  // Theme configuration
  const theme = {
    cardBg: isDarkMode ? "bg-[#12101A]" : "bg-white",
    footerBg: isDarkMode ? "bg-[#0D0B12]" : "bg-gray-50",
    inputBg: isDarkMode ? "bg-[#1A1825]" : "bg-gray-100",
    warningBg: isDarkMode ? "bg-[#1A1825]" : "bg-yellow-50",
    warningText: isDarkMode ? "text-yellow-400" : "text-yellow-600",
    text: isDarkMode ? "text-white" : "text-gray-900",
    textSecondary: isDarkMode ? "text-gray-400" : "text-gray-600",
    border: isDarkMode ? "border-gray-800" : "border-gray-200",
    tabHover: isDarkMode
      ? "hover:bg-purple-900/10 hover:text-gray-300"
      : "hover:bg-purple-50 hover:text-gray-700",
    fieldTitle: isDarkMode
      ? "bg-clip-text text-transparent text-light-gradient"
      : "bg-clip-text text-transparent text-light-gradient",
    checkboxBg: isDarkMode ? "bg-[#1A1825]" : "bg-gray-100",
  };

  const [activeTab, setActiveTab] = useState("priceSettings");

  // Form state for each function
  const [priceIncrement, setPriceIncrement] = useState("");
  const [tokenPrice, setTokenPrice] = useState("");
  const [usdtAddress, setUsdtAddress] = useState("");
  const [usdcAddress, setUsdcAddress] = useState("");
  const [saleTokenAddress, setSaleTokenAddress] = useState("");
  const [blockAddress, setBlockAddress] = useState("");
  const [isBlocked, setIsBlocked] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [transactionHash, setTransactionHash] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [updateBaseAPYPercent, setUpdateBaseAPYPercent] = useState("");
  const [updateMinStake, setUpdateMinStake] = useState("");

  // Function to validate Ethereum address
  const isValidAddress = (address) => {
    return /^0x[0-9a-fA-F]{40}$/i.test(address);
  };

  // Placeholder for actual contract interactions
  const handleSubmit = async (e, functionName) => {
    e.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");
    setTransactionHash("");
    try {
      if (functionName === "updateStablecoinPrice") {
        console.log(priceIncrement);
        setIsProcessing(true);
        const response = await updateStablecoinPrice(priceIncrement);
        console.log(response);

        setTransactionHash(response?.transactionHash);
        setSuccessMessage(
          `Successfully set price increment to ${priceIncrement} USDT at ${formatAddress(
            response?.to
          )}`
        );
        setIsProcessing(false);
      } else if (functionName === "updateTokenPrice") {
        setIsProcessing(true);
        const response = await updateTokenPrice(tokenPrice);
        console.log(response);
        setTransactionHash(response?.transactionHash);
        setSuccessMessage(
          `Successfully transferred ${tokenPrice} Token ETH Price set to ${formatAddress(
            response?.to
          )}`
        );
        setIsProcessing(false);
      } else if (functionName === "setSaleToken") {
        setIsProcessing(true);
        const response = await setSaleToken(saleTokenAddress);
        console.log(response);
        setTransactionHash(response?.transactionHash);
        setSuccessMessage(
          `Successfully  ${formatAddress(
            saleTokenAddress
          )} Sale Token Set to ${formatAddress(response?.to)}`
        );
        setIsProcessing(false);
      } else if (functionName === "updateUSDT") {
        setIsProcessing(true);
        const response = await updateUSDT(usdtAddress);
        console.log(response);
        setTransactionHash(response?.transactionHash);
        setSuccessMessage(
          `Successfully USDT ${formatAddress(usdtAddress)} set to ${formatAddress(
            response?.to
          )}`
        );
        setIsProcessing(false);
      } else if (functionName === "updateUSDC") {
        setIsProcessing(true);
        const response = await updateUSDC(usdcAddress);
        console.log(response);
        setTransactionHash(response?.transactionHash);
        setSuccessMessage(
          `Successfully USDC ${formatAddress(usdcAddress)} set to ${formatAddress(
            response?.to
          )}`
        );
        setIsProcessing(false);
      } else if (functionName === "setBlockStatus") {
        setIsProcessing(true);
        // Clean the address (trim whitespace)
        const cleanedAddress = blockAddress.trim();

        // Validate the address
        if (!isValidAddress(cleanedAddress)) {
          setSuccessMessage("Please enter a valid Ethereum address");
          return;
        }
        const response = await setBlockStatus(cleanedAddress, isBlocked);
        console.log(response);
        setTransactionHash(response?.transactionHash);
        setSuccessMessage(
          `Successfully Blocked  ${formatAddress(
            usdcAddress
          )} Address to ${formatAddress(response?.to)}`
        );
        setIsProcessing(false);
      } else if (functionName === "updateBaseAPY") {
        setIsProcessing(true);
        const response = await updateBaseAPY(updateBaseAPYPercent);
        console.log(response);
        setTransactionHash(response?.transactionHash);
        setSuccessMessage(
          `Successfully updated ${updateBaseAPYPercent}  ${formatAddress(
            response?.to
          )}`
        );
        setIsProcessing(false);
      } else if (functionName === "updateMinStakeAmount") {
        setIsProcessing(true);
        const response = await updateMinStakeAmount(updateMinStake);
        console.log(response);
        setTransactionHash(response?.transactionHash);
        setSuccessMessage(
          `Successfully updated ${updateMinStake}  ${formatAddress(
            response?.to
          )}`
        );
        setIsProcessing(false);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const resetMessage = () => {
    setStablecoinPrice("");
    setTokenPrice("");
    setUsdtAddress("");
    setUsdtRatio("");
    setUsdcAddress("");
    setUsdcRatio("");
    setErrorMessage("");
    setSuccessMessage("");
    setTransactionHash("");
    setIsProcessing(false);
    setIsBlocked(false);
    setSaleTokenAddress("");
    setBlockAddress(" ");
  };

  // Tabs configuration
  const tabs = [
    { id: "priceSettings", label: "Price Settings", icon: <FaDollarSign /> },
    { id: "tokenConfig", label: "Token Config", icon: <FaCoins /> },
    { id: "stablecoins", label: "Stablecoins", icon: <FaExchangeAlt /> },
    { id: "accessControl", label: "Access Control", icon: <FaBan /> },
    { id: "stakingControl", label: "Staking Control", icon: <BsBank2 /> },
  ];

  return (
    <>
      <Header theme={theme} title="Admin Function" />
      <div
        className={`${theme.cardBg} ${theme.text} rounded-xl shadow-lg overflow-hidden`}
      >
        {/* Tab Navigation */}
        <div
          className={`flex flex-wrap sm:flex-nowrap border-b ${theme.border}`}
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => (setActiveTab(tab.id), resetMessage())}
              className={`flex items-center gap-2 px-4 py-3 flex-grow sm:flex-grow-0 transition-colors ${
                activeTab === tab.id
                  ? "text-light-gradient hover:from-teal-500 hover:to-indigo-600 text-white"
                  : `${theme.textSecondary} ${theme.tabHover}`
              }`}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Price Settings Tab */}
          {activeTab === "priceSettings" && (
            <div className="space-y-6">
              <h2 className={`text-xl font-bold border-b ${theme.border} pb-2`}>
                Price Settings
              </h2>

              {/* Error Message */}
              {errorMessage && (
                <Success errorMessage={errorMessage} isDarkMode={isDarkMode} />
              )}

              {/* Success Message */}
              {successMessage && (
                <Success
                  successMessage={successMessage}
                  transactionHash={transactionHash}
                  isDarkMode={isDarkMode}
                />
              )}

              <form
                onSubmit={(e) => handleSubmit(e, "updateStablecoinPrice")}
                className="space-y-4"
              >
                <h3 className={`text-lg font-semibold ${theme.fieldTitle}`}>
                  Update Price Increment
                </h3>
                <div className="space-y-2">
                  <label className={`block ${theme.textSecondary}`}>
                    New Increment (USDT)
                  </label>
                  <input
                    type="text"
                    value={priceIncrement}
                    onChange={(e) => setPriceIncrement(e.target.value)}
                    placeholder="0.0"
                    className={`w-full ${theme.inputBg} rounded-lg p-3 ${theme.text} focus:outline-none focus:ring-2 focus:ring-purple-600`}
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={isProcessing || !priceIncrement}
                  className="w-full text-light-gradient hover:from-teal-500 hover:to-indigo-600 text-white rounded-lg py-3 transition-colors font-medium py-4 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? "Processing..." : "Update Price Increment"}
                </button>
              </form>

              <form
                onSubmit={(e) => handleSubmit(e, "updateTokenPrice")}
                className="space-y-4"
              >
                <h3 className={`text-lg font-semibold ${theme.fieldTitle}`}>
                  Update Token Price
                </h3>
                <div className="space-y-2">
                  <label className={`block ${theme.textSecondary}`}>
                    New Price (in ETH)
                  </label>
                  <input
                    type="text"
                    value={tokenPrice}
                    onChange={(e) => setTokenPrice(e.target.value)}
                    placeholder="0.0"
                    className={`w-full ${theme.inputBg} rounded-lg p-3 ${theme.text} focus:outline-none focus:ring-2 focus:ring-purple-600`}
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={isProcessing || !tokenPrice}
                  className="w-full text-light-gradient hover:from-teal-500 hover:to-indigo-600 text-white rounded-lg py-3 transition-colors font-medium py-4 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? "Processing..." : "Update Token Price"}
                </button>
              </form>
            </div>
          )}

          {/* Token Config Tab */}
          {activeTab === "tokenConfig" && (
            <div className="space-y-6">
              <h2 className={`text-xl font-bold border-b ${theme.border} pb-2`}>
                Token Configuration
              </h2>

              {/* Error Message */}
              {errorMessage && (
                <Success errorMessage={errorMessage} isDarkMode={isDarkMode} />
              )}

              {/* Success Message */}
              {successMessage && (
                <Success
                  successMessage={successMessage}
                  transactionHash={transactionHash}
                  isDarkMode={isDarkMode}
                />
              )}

              <form
                onSubmit={(e) => handleSubmit(e, "setSaleToken")}
                className="space-y-4"
              >
                <h3 className={`text-lg font-semibold ${theme.fieldTitle}`}>
                  Set Sale Token
                </h3>
                <div className="space-y-2">
                  <label className={`block ${theme.textSecondary}`}>
                    Token Address
                  </label>
                  <input
                    type="text"
                    value={saleTokenAddress}
                    onChange={(e) => setSaleTokenAddress(e.target.value)}
                    placeholder="0x..."
                    className={`w-full ${theme.inputBg} rounded-lg p-3 ${theme.text} focus:outline-none focus:ring-2 focus:ring-purple-600`}
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={isProcessing || !saleTokenAddress}
                  className="w-full text-light-gradient hover:from-teal-500 hover:to-indigo-600 text-white rounded-lg py-3 transition-colors font-medium py-4 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? "Processing..." : "Set Sale Token"}
                </button>
              </form>
            </div>
          )}

          {/* Stablecoins Tab */}
          {activeTab === "stablecoins" && (
            <div className="space-y-6">
              <h2 className={`text-xl font-bold border-b ${theme.border} pb-2`}>
                Stablecoin Settings
              </h2>

              {/* Error Message */}
              {errorMessage && (
                <Success errorMessage={errorMessage} isDarkMode={isDarkMode} />
              )}

              {/* Success Message */}
              {successMessage && (
                <Success
                  successMessage={successMessage}
                  transactionHash={transactionHash}
                  isDarkMode={isDarkMode}
                />
              )}

              <form
                onSubmit={(e) => handleSubmit(e, "updateUSDT")}
                className="space-y-4"
              >
                <h3 className={`text-lg font-semibold ${theme.fieldTitle}`}>
                  Update USDT
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className={`block ${theme.textSecondary}`}>
                      USDT Address
                    </label>
                    <input
                      type="text"
                      value={usdtAddress}
                      onChange={(e) => setUsdtAddress(e.target.value)}
                      placeholder="0x..."
                      className={`w-full ${theme.inputBg} rounded-lg p-3 ${theme.text} focus:outline-none focus:ring-2 focus:ring-purple-600`}
                      required
                    />
                  </div>
                </div>
              </div>
              <button
                type="submit"
                disabled={isProcessing || !usdtAddress}
                className="w-full text-light-gradient hover:from-teal-500 hover:to-indigo-600 text-white rounded-lg py-3 transition-colors font-medium py-4 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? "Processing..." : "Update USDT"}
              </button>
            </form>

              <form
                onSubmit={(e) => handleSubmit(e, "updateUSDC")}
                className="space-y-4"
              >
                <h3 className={`text-lg font-semibold ${theme.fieldTitle}`}>
                  Update USDC
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className={`block ${theme.textSecondary}`}>
                      USDC Address
                    </label>
                    <input
                      type="text"
                      value={usdcAddress}
                      onChange={(e) => setUsdcAddress(e.target.value)}
                      placeholder="0x..."
                      className={`w-full ${theme.inputBg} rounded-lg p-3 ${theme.text} focus:outline-none focus:ring-2 focus:ring-purple-600`}
                      required
                    />
                  </div>
                </div>
              </div>
              <button
                type="submit"
                disabled={isProcessing || !usdcAddress}
                className="w-full text-light-gradient hover:from-teal-500 hover:to-indigo-600 text-white rounded-lg py-3 transition-colors font-medium py-4 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? "Processing..." : "Update USDC"}
              </button>
            </form>
          </div>
          )}

          {/* Access Control Tab */}
          {activeTab === "accessControl" && (
            <div className="space-y-6">
              <h2 className={`text-xl font-bold border-b ${theme.border} pb-2`}>
                Access Control
              </h2>

              {/* Error Message */}
              {errorMessage && (
                <Success errorMessage={errorMessage} isDarkMode={isDarkMode} />
              )}

              {/* Success Message */}
              {successMessage && (
                <Success
                  successMessage={successMessage}
                  transactionHash={transactionHash}
                  isDarkMode={isDarkMode}
                />
              )}

              <form
                onSubmit={(e) => handleSubmit(e, "setBlockStatus")}
                className="space-y-4"
              >
                <h3 className={`text-lg font-semibold ${theme.fieldTitle}`}>
                  Address Block Status
                </h3>
                <div className="space-y-2">
                  <label className={`block ${theme.textSecondary}`}>
                    User Address
                  </label>
                  <input
                    type="text"
                    value={blockAddress}
                    onChange={(e) => setBlockAddress(e.target.value)}
                    placeholder="0x..."
                    className={`w-full ${theme.inputBg} rounded-lg p-3 ${theme.text} focus:outline-none focus:ring-2 focus:ring-purple-600`}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className={`flex items-center ${theme.textSecondary}`}>
                    <input
                      type="checkbox"
                      checked={isBlocked}
                      onChange={(e) => setIsBlocked(e.target.checked)}
                      className={`mr-2 h-5 w-5 rounded ${
                        theme.checkboxBg
                      } text-purple-600 focus:ring-purple-600 ${
                        isDarkMode
                          ? "focus:ring-offset-gray-900"
                          : "focus:ring-offset-white"
                      }`}
                    />
                    Block this address
                  </label>
                </div>
                <button
                  type="submit"
                  disabled={isProcessing || !blockAddress}
                  className="w-full text-light-gradient hover:from-teal-500 hover:to-indigo-600 text-white rounded-lg py-3 transition-colors font-medium py-4 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? "Processing..." : "Set Block Status"}
                </button>
              </form>

              <div className={`mt-8 p-4 ${theme.warningBg} rounded-lg`}>
                <h3
                  className={`text-lg font-semibold ${theme.warningText} mb-2`}
                >
                  Warning
                </h3>
                <p className={theme.textSecondary}>
                  Blocking addresses will prevent users from participating in
                  token sales. This action should be used cautiously for
                  compliance or security reasons only.
                </p>
              </div>
            </div>
          )}

          {/* Staking Control Tab */}
          {activeTab === "stakingControl" && (
            <div className="space-y-6">
              <h2 className={`text-xl font-bold border-b ${theme.border} pb-2`}>
                Staking Control
              </h2>

              {/* Error Message */}
              {errorMessage && (
                <Success errorMessage={errorMessage} isDarkMode={isDarkMode} />
              )}

              {/* Success Message */}
              {successMessage && (
                <Success
                  successMessage={successMessage}
                  transactionHash={transactionHash}
                  isDarkMode={isDarkMode}
                />
              )}

              <form
                onSubmit={(e) => handleSubmit(e, "updateBaseAPY")}
                className="space-y-4"
              >
                <h3 className={`text-lg font-semibold ${theme.fieldTitle}`}>
                  Update BaseAPY
                </h3>
                <div className="space-y-2">
                  <label className={`block ${theme.textSecondary}`}>
                    New BaseAPY (in %)
                  </label>
                  <input
                    type="text"
                    value={updateBaseAPYPercent}
                    onChange={(e) => setUpdateBaseAPYPercent(e.target.value)}
                    placeholder="0.0"
                    className={`w-full ${theme.inputBg} rounded-lg p-3 ${theme.text} focus:outline-none focus:ring-2 focus:ring-purple-600`}
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={isProcessing || !updateBaseAPYPercent}
                  className="w-full text-light-gradient hover:from-teal-500 hover:to-indigo-600 text-white rounded-lg py-3 transition-colors font-medium py-4 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? "Processing..." : "Update Base APY"}
                </button>
              </form>

              <form
                onSubmit={(e) => handleSubmit(e, "updateMinStakeAmount")}
                className="space-y-4"
              >
                <h3 className={`text-lg font-semibold ${theme.fieldTitle}`}>
                  Update Min Stake Amount
                </h3>
                <div className="space-y-2">
                  <label className={`block ${theme.textSecondary}`}>
                    Quantity
                  </label>
                  <input
                    type="text"
                    value={updateMinStake}
                    onChange={(e) => setUpdateMinStake(e.target.value)}
                    placeholder="0.0"
                    className={`w-full ${theme.inputBg} rounded-lg p-3 ${theme.text} focus:outline-none focus:ring-2 focus:ring-purple-600`}
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={isProcessing || !updateMinStake}
                  className="w-full text-light-gradient hover:from-teal-500 hover:to-indigo-600 text-white rounded-lg py-3 transition-colors font-medium py-4 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? "Processing..." : "Update Min Stake"}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Footer with status */}
        <div
          className={`${theme.footerBg} px-6 py-4 flex items-center justify-between border-t ${theme.border}`}
        >
          <div className={`${theme.textSecondary} text-sm`}>
            <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-2"></span>
            Connected as Admin
          </div>
          <div className={`${theme.textSecondary} text-sm`}>
            Last update: {new Date().toLocaleString()}
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminFunctions;
