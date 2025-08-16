import React, { useState, useEffect } from "react";
import { FaTimes, FaEthereum, FaCalculator } from "react-icons/fa";
import { SiTether, SiUsdCoin, SiBinance, SiSolana, SiBitcoin } from "react-icons/si";
import { useWeb3 } from "../../context/Web3Provider";
import { ethers } from "ethers";


const TokenCalculator = ({ isOpen, onClose, isDarkMode }) => {
  const { contract, account, contractInfo } = useWeb3();
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("BNB");
  const [tokensToReceive, setTokensToReceive] = useState(0);
  const [bnbPrice, setBnbPrice] = useState(null);
  const [bnbPerStable, setBnbPerStable] = useState(null);

  // Quick calculate options
  const quickOptions = {
    BNB: [0.1, 0.5, 1, 2],
    ETH: [0.1, 0.5, 1, 2],
    SOL: [0.1, 0.5, 1, 2],
    BTC: [0.1, 0.5, 1, 2],
    USDT: [50, 100, 500, 1000],
    USDC: [50, 100, 500, 1000],
  };

  // Min and max buy limits
  const limits = {
    BNB: { min: 0.1, max: 2.0 },
    ETH: { min: 0.1, max: 2.0 },
    SOL: { min: 0.1, max: 2.0 },
    BTC: { min: 0.1, max: 2.0 },
    USDT: { min: 50, max: 4000 },
    USDC: { min: 50, max: 4000 },
  };

  useEffect(() => {
    if (!contract) return;
    let intervalId;
    const load = async () => {
      try {
        const [price, stable] = await Promise.all([
          contract.getCurrentPrice(account || ethers.constants.AddressZero),
          contract.bnbPriceForStablecoin(),
        ]);
        setBnbPrice(parseFloat(ethers.utils.formatEther(price)));
        setBnbPerStable(parseFloat(ethers.utils.formatEther(stable)));
      } catch (err) {
        console.error("price fetch failed", err);
      }
    };
    load();
    intervalId = setInterval(load, 5000);
    return () => clearInterval(intervalId);
  }, [contract, account]);

  useEffect(() => {
    calculateTokens();
  }, [amount, currency, bnbPrice, bnbPerStable, contractInfo]);

  const calculateTokens = () => {
    if (!amount || isNaN(amount) || amount <= 0 || bnbPrice === null) {
      setTokensToReceive(0);
      return;
    }

    let tokens = 0;
    switch (currency) {
      case "BNB":
        tokens = parseFloat(amount) / bnbPrice;
        break;
      case "USDT":
      case "USDC":
        if (bnbPerStable)
          tokens = parseFloat(amount) * (bnbPerStable / bnbPrice);
        break;
      case "ETH":
        tokens =
          parseFloat(amount) * parseFloat(contractInfo.ethTokenRatio || 0);
        break;
      case "BTC":
        tokens =
          parseFloat(amount) * parseFloat(contractInfo.btcTokenRatio || 0);
        break;
      case "SOL":
        tokens =
          parseFloat(amount) * parseFloat(contractInfo.solTokenRatio || 0);
        break;
      default:
        tokens = 0;
    }
    setTokensToReceive(tokens);
  };

  const handleInputChange = (e) => {
    const value = e.target.value;

    // Allow only numbers and decimals
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setAmount(value);
    }
  };

  const handleQuickCalculate = (value) => {
    setAmount(value.toString());
  };

  const getCurrencyIcon = () => {
    switch (currency) {
      case "BNB":
        return <SiBinance />;
      case "ETH":
        return <FaEthereum />;
      case "SOL":
        return <SiSolana />;
      case "BTC":
        return <SiBitcoin />;
      case "USDT":
        return <SiTether />;
      case "USDC":
        return <SiUsdCoin />;
      default:
        return <SiBinance />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div
        className={`${
          isDarkMode ? "bg-[#110022]" : "bg-white"
        } rounded-lg p-6 max-w-md w-full ${
          isDarkMode ? "text-white" : "text-gray-900"
        } shadow-xl`}
      >
        <div className="flex justify-between items-center mb-4">
          <h2
            className={`text-xl font-semibold ${
              isDarkMode
                ? "bg-clip-text text-transparent text-light-gradient"
                : "bg-clip-text text-transparent text-light-gradient"
            }`}
          >
            Token Calculator
          </h2>
          <button
            onClick={onClose}
            className={
              isDarkMode
                ? "text-gray-400 hover:text-white"
                : "text-gray-500 hover:text-gray-900"
            }
          >
            <FaTimes />
          </button>
        </div>

        <div className="mb-4">
          <label className="block mb-2">Enter {currency} Amount</label>
          <div className="flex">
            <input
              type="text"
              value={amount}
              onChange={handleInputChange}
              placeholder={`0.0`}
              className={`${isDarkMode ? "bg-[#1A1825]" : "bg-gray-100"} ${
                isDarkMode ? "text-white" : "text-gray-900"
              } p-3 rounded-l-md w-full outline-none`}
            />
            <div
              className={`${
                isDarkMode ? "bg-[#1A1825]" : "bg-gray-100"
              } flex items-center px-4 rounded-r-md`}
            >
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className={`${isDarkMode ? "bg-[#1A1825]" : "bg-gray-100"} ${
                  isDarkMode ? "text-white" : "text-gray-900"
                } outline-none`}
              >
                <option value="BNB">BNB</option>
                <option value="ETH">ETH</option>
                <option value="SOL">SOL</option>
                <option value="BTC">BTC</option>
                <option value="USDT">USDT</option>
                <option value="USDC">USDC</option>
              </select>
            </div>
          </div>
        </div>

        <div
          className={`${
            isDarkMode ? "bg-[#1A1825]" : "bg-gray-100"
          } p-4 rounded-md mb-4`}
        >
          <p
            className={`text-sm ${
              isDarkMode ? "text-gray-300" : "text-gray-600"
            } mb-2`}
          >
            Tokens You Will Receive
          </p>
          <div className="flex items-center justify-between">
            <h3
              className={`text-2xl font-bold ${
                isDarkMode ? "text-white" : "text-gray-900"
              }`}
            >
              {tokensToReceive.toLocaleString()} {TOKEN_SYMBOL}
            </h3>
          </div>
          <p
            className={`text-sm ${
              isDarkMode ? "text-gray-400" : "text-gray-500"
            } mt-1`}
          >
            Rate: {rates[currency].toLocaleString()} tokens per {currency}
          </p>
        </div>

        <div className="mb-4">
          <p className="mb-2">Quick Calculate</p>
          <div className="grid grid-cols-2 gap-2">
            {quickOptions[currency].map((option, index) => (
              <button
                key={index}
                onClick={() => handleQuickCalculate(option)}
                className={`${isDarkMode ? "bg-[#1A1825]" : "bg-gray-100"} ${
                  isDarkMode ? "hover:bg-gray-600" : "hover:bg-gray-200"
                } py-2 rounded-md text-center transition-colors`}
              >
                {option} {currency}
              </button>
            ))}
          </div>
        </div>

        <div
          className={`${
            isDarkMode ? "bg-[#1A1825]" : "bg-gray-100"
          } p-4 rounded-md mb-4`}
        >
          <div className="flex justify-between mb-2">
            <span>Price per Token:</span>
            <span>
              {tokenPrice[currency]} {currency}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Tokens per {currency}:</span>
            <span>{rates[currency].toLocaleString()}</span>
          </div>
        </div>

        <div
          className={`${
            isDarkMode ? "bg-[#1A1825]" : "bg-gray-100"
          } p-4 rounded-md`}
        >
          <div className="flex justify-between mb-2">
            <span>Minimum Buy:</span>
            <span>
              {limits[currency].min} {currency}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Maximum Buy:</span>
            <span>
              {limits[currency].max} {currency}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Example usage in a page component
const TokenSalePage = ({ isDarkMode }) => {
  const [calculatorOpen, setCalculatorOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setCalculatorOpen(true)}
        className={`
        text-light-gradient hover:from-teal-500 hover:to-indigo-600
        text-white py-2 px-4 
        ${isDarkMode ? "rounded" : "rounded-lg shadow"}
        flex items-center transition-all duration-200
      `}
      >
        <FaCalculator className="mr-2" />
        Calculate Tokens
      </button>

      <TokenCalculator
        isOpen={calculatorOpen}
        onClose={() => setCalculatorOpen(false)}
        isDarkMode={isDarkMode}
      />
    </>
  );
};

export default TokenSalePage;
