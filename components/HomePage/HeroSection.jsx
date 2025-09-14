import React, { useState, useEffect, useMemo, useRef } from "react";
import { FaEthereum, FaBitcoin } from "react-icons/fa";
import { SiTether, SiBinance, SiSolana } from "react-icons/si";
import { IoWalletOutline } from "react-icons/io5";
import { AiOutlineQuestionCircle } from "react-icons/ai";
import { BsFillInfoCircleFill, BsCurrencyDollar } from "react-icons/bs";
import { RiUsdCircleFill } from "react-icons/ri";
import { CustomConnectButton } from "../index";
import { useWeb3 } from "../../context/Web3Provider";
import { ethers } from "ethers";

const TOKEN_NAME = process.env.NEXT_PUBLIC_TOKEN_NAME;
const TOKEN_SYMBOL = process.env.NEXT_PUBLIC_TOKEN_SYMBOL;
const CURRENCY = process.env.NEXT_PUBLIC_CURRENCY;

const toPosSec = (bn, fallback) => {
  try {
    if (bn && typeof bn.toNumber === "function") {
      const v = bn.toNumber();
      return v > 0 ? v : fallback;
    }
  } catch (_) {}
  return fallback;
};

const computeRemaining = (start, interval) => {
  const now = Math.floor(Date.now() / 1000);
  if (!start || interval <= 0) return 0;
  if (now < start) return start - now; // before sale starts
  const steps = Math.floor((now - start) / interval);
  const nextAt = start + (steps + 1) * interval;
  return Math.max(0, nextAt - now);
};


const WAITLIST_INTERVAL_SEC =
  parseInt(process.env.NEXT_PUBLIC_WAITLIST_INTERVAL, 10) ||
  14 * 24 * 60 * 60;
const PUBLIC_INTERVAL_SEC =
  parseInt(process.env.NEXT_PUBLIC_PUBLIC_INTERVAL, 10) ||
  7 * 24 * 60 * 60;


const HeroSection = ({ isDarkMode, setIsReferralPopupOpen }) => {
  const {
    account,
    isConnected,
    contract,
    contractInfo,
    tokenBalances,
    buyWithETH,
    buyWithUSDT,
    buyWithUSDC,
    buyWithBNB,
    buyWithBTC,
    buyWithSOL,
    addtokenToMetaMask,
    getReferralInfo,
    checkReferralCode,
    registerReferrer,
    boundReferrer,
    formatAddress,
    eligibility,
  } = useWeb3();

  const [selectedToken, setSelectedToken] = useState("BNB");
  const displayToken = selectedToken === "BNB" ? CURRENCY : selectedToken;
  const [inputAmount, setInputAmount] = useState("1");
  const [tokenAmount, setTokenAmount] = useState("0");
  const [hasSufficientBalance, setHasSufficientBalance] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasAttemptedRegistration, setHasAttemptedRegistration] =
    useState(false);
  const registrationRef = useRef(false);

  const [currentUsdPrice, setCurrentUsdPrice] = useState("0");
  const [nextUsdPrice, setNextUsdPrice] = useState("0");
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isWaitlisted, setIsWaitlisted] = useState(false);
  const [showWaitlistModal, setShowWaitlistModal] = useState(false);
  const [nowTs, setNowTs] = useState(Math.floor(Date.now() / 1000));

  // keep a local ticking clock for UI gating texts
  useEffect(() => {
    const id = setInterval(() => setNowTs(Math.floor(Date.now() / 1000)), 60_000);
    return () => clearInterval(id);
  }, []);

  // Calculate progress percentage based on sold tokens vs total supply
  const calculateProgressPercentage = () => {
    if (!contractInfo?.totalSold || !contractInfo?.fsxBalance) return 0;

    const availbleSupply =
      Number(contractInfo?.totalSold) + Number(contractInfo?.fsxBalance);
    const soldAmount = parseFloat(contractInfo.totalSold) || 0;
    const totalSupply = parseFloat(availbleSupply) || 1; // Prevent division by zero

    // Calculate percentage with a maximum of 100%
    const percentage = Math.min((soldAmount / totalSupply) * 100, 100);

    // Return percentage with maximum 2 decimal places
    return parseFloat(percentage.toFixed(2));
  };

  // Derived token ratios based on current price and contract info
  const prices = useMemo(() => {
    const price = parseFloat(currentUsdPrice || "0");

    const usdtRatio = price ? 1 / price : 0;
    const usdcRatio = usdtRatio;
    const ethRatio = contractInfo?.ethRatio
      ? parseFloat(contractInfo.ethRatio)
      : 0;
    const btcRatio = contractInfo?.btcRatio
      ? parseFloat(contractInfo.btcRatio)
      : 0;
    const solRatio = contractInfo?.solRatio
      ? parseFloat(contractInfo.solRatio)
      : 0;

    return { usdtRatio, usdcRatio, ethRatio, btcRatio, solRatio };
  }, [contractInfo, currentUsdPrice]);

  // Start loading effect when component mounts
  useEffect(() => {
    setIsLoading(true);

    // Set a timeout to hide the loader after 3 seconds
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3000);

    // Clean up the timer if component unmounts
    return () => clearTimeout(timer);
  }, []);

  // Check if user has enough balance and if token supply is sufficient
  useEffect(() => {
    if (!isConnected || !tokenBalances) {
      setHasSufficientBalance(false);
      return;
    }

    // Check if SAV balance is below threshold
    const lowTokenSupply = parseFloat(contractInfo?.fsxBalance || "0") < 20;

    if (lowTokenSupply) {
      setHasSufficientBalance(false);
      return;
    }

    const inputAmountFloat = parseFloat(inputAmount) || 0;
    let hasBalance = false;

    switch (selectedToken) {
      case "ETH": {
        const ethBalance = parseFloat(tokenBalances?.ETH || "0");
        hasBalance = ethBalance >= inputAmountFloat && inputAmountFloat > 0;
        break;
      }
      case "BNB": {
        const bnbBalance = parseFloat(tokenBalances?.BNB || "0");
        hasBalance = bnbBalance >= inputAmountFloat && inputAmountFloat > 0;
        break;
      }
      case "BTC": {
        const btcBalance = parseFloat(tokenBalances?.BTC || "0");
        hasBalance = btcBalance >= inputAmountFloat && inputAmountFloat > 0;
        break;
      }
      case "SOL": {
        const solBalance = parseFloat(tokenBalances?.SOL || "0");
        hasBalance = solBalance >= inputAmountFloat && inputAmountFloat > 0;
        break;
      }
      case "USDT": {
        const usdtBalance = parseFloat(tokenBalances?.USDT || "0");
        hasBalance = usdtBalance >= inputAmountFloat && inputAmountFloat > 0;
        break;
      }
      case "USDC": {
        const usdcBalance = parseFloat(tokenBalances?.USDC || "0");
        hasBalance = usdcBalance >= inputAmountFloat && inputAmountFloat > 0;
        break;
      }
      default:
        hasBalance = false;
    }

    setHasSufficientBalance(hasBalance);
  }, [isConnected, inputAmount, selectedToken, tokenBalances]);

  useEffect(() => {
    if (!isConnected) return;
    logAllBalances(tokenBalances);
  }, [tokenBalances, isConnected]);

  useEffect(() => {
    const initReferral = async () => {
      // Only proceed if we haven't already attempted registration in this component instance
      if (isConnected && account && !hasAttemptedRegistration) {
        // Immediately set the flag to prevent duplicate calls
        setHasAttemptedRegistration(true);

        console.log("Attempting referral registration...");

        try {
          // Get current referral info
          const referralInfo = await getReferralInfo(account);

          // Only process if user doesn't already have a referrer
          if (
            !referralInfo?.referrer ||
            referralInfo.referrer ===
              "0x0000000000000000000000000000000000000000"
          ) {
            // Check for referral code
            const referralCode = checkReferralCode();

            if (referralCode && ethers.utils.isAddress(referralCode)) {
              // Make sure it's not the user's own address
              if (referralCode.toLowerCase() !== account.toLowerCase()) {
                // Register the referrer
                await registerReferrer(referralCode);
                console.log("Referrer registration complete");
              }
            }
          }
        } catch (error) {
          console.error("Error in referral process:", error);
        }
      }
    };

    // Create a dedicated initialization function that uses a ref to track execution
    const safeInitReferral = () => {
      if (!registrationRef.current && isConnected && account) {
        registrationRef.current = true;
        initReferral();
      }
    };

    // Call the safe initialization function once
    safeInitReferral();

    // Cleanup function to reset the ref if needed (e.g., when account changes)
    return () => {
      // Optional: You can decide whether to reset based on your needs
      // registrationRef.current = false;
    };
  }, [isConnected, account, getReferralInfo, registerReferrer]);

  // Calculate token amount based on input amount and selected token
  const calculateTokenAmount = (amount, token) => {
    if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) return "0";

    let calculatedAmount;
    try {
      switch (token) {
        case "BNB": {
          const ratio = parseFloat(contractInfo.bnbRatio || 0);
          calculatedAmount = ratio > 0 ? parseFloat(amount) * ratio : 0;
          break;
        }
        case "ETH":
          calculatedAmount = parseFloat(amount) * prices.ethRatio;
          break;
        case "BTC":
          calculatedAmount = parseFloat(amount) * prices.btcRatio;
          break;
        case "SOL":
          calculatedAmount = parseFloat(amount) * prices.solRatio;
          break;
        case "USDT":
          calculatedAmount = parseFloat(amount) * prices.usdtRatio;
          break;
        case "USDC":
          calculatedAmount = parseFloat(amount) * prices.usdcRatio;
          break;
        default:
          calculatedAmount = 0;
      }
    } catch (error) {
      console.error(`Error calculating token amount:`, error);
      calculatedAmount = 0;
    }

    return calculatedAmount.toFixed(6);
  };

  const formatTime = (seconds) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60)
      .toString()
      .padStart(2, "0");
    const secs = Math.floor(seconds % 60)
      .toString()
      .padStart(2, "0");
    const parts = [];
    if (days) parts.push(`${days}d`);
    if (hours || days) parts.push(`${hours}h`);
    parts.push(`${minutes}:${secs}`);
    return parts.join(" ");
  };

  const [saleStartTs, setSaleStartTs] = useState(0);
  const [intervalSec, setIntervalSec] = useState(0);

useEffect(() => {
  if (!contract) return;

  let cancelled = false;
  const provider = contract.provider;

  const load = async () => {
    try {
      const [priceInfo, startBN, isWl, wlIntBN, pubIntBN, decimals] =
        await Promise.all([
          contract.getPriceInfo(account || ethers.constants.AddressZero),
          contract.saleStartTime(),
          account ? contract.waitlisted(account) : false,
          contract.waitlistInterval(),
          contract.publicInterval(),
          contract.stablecoinDecimals(),
        ]);

      const [current, next] = priceInfo;

      setIsWaitlisted(isWl);

      setCurrentUsdPrice(ethers.utils.formatUnits(current, decimals));
      setNextUsdPrice(ethers.utils.formatUnits(next, decimals));

      const net = await contract.provider.getNetwork();
      console.log("chainId =", net.chainId); // должен быть 56 для BSC mainnet
      
      const code = await provider.getCode("0x4247dD6442360e1214787c66244ce6d3053C277c");
      console.log("code len =", code.length); // "0x" => нет контракта на этой сети
      if (cancelled) return;
      // derive values from chain (with safe fallbacks)
      const envOverride = parseInt(process.env.NEXT_PUBLIC_SALE_START_TS || "0", 10) || 0;
      const saleStartFromChain = startBN?.toNumber?.() ?? 0;
      const saleStart = envOverride > 0 ? envOverride : saleStartFromChain;
      const wlInt     = toPosSec(wlIntBN, WAITLIST_INTERVAL_SEC);   // expect 1209600 (14d) if WL
      const pubInt    = toPosSec(pubIntBN, PUBLIC_INTERVAL_SEC);     // expect 604800  (7d)  if public
      const chosenInt = isWl ? wlInt : pubInt;
      // immediately sync UI state to match what you logged
      setSaleStartTs(saleStart);
      setIsWaitlisted(Boolean(isWl));
      setIntervalSec(chosenInt);
      setTimeRemaining(computeRemaining(saleStart, chosenInt));

    } catch (e) {
      console.error("price/timing load error", e);
    }
  };

  // initial + on each block (price can step only on new block)
  load();
  const onBlock = () => load();
  provider.on("block", onBlock);

  return () => {
    cancelled = true;
    provider.off("block", onBlock);
  };
}, [contract, account]);


useEffect(() => {
  if (!saleStartTs || intervalSec <= 0) {
    setTimeRemaining(0);
    return;
  }

  const tick = () => {
    setTimeRemaining(computeRemaining(saleStartTs, intervalSec));
  };

  tick(); // immediate paint
  const id = setInterval(tick, 1000);
  return () => clearInterval(id);
}, [saleStartTs, intervalSec]);


  // Handle input amount changes
  const handleAmountChange = (value) => {
    setInputAmount(value);
  };

  // Handle token selection change
  const handleTokenSelection = (token) => {
    setSelectedToken(token);
  };

  useEffect(() => {
    setTokenAmount(calculateTokenAmount(inputAmount, selectedToken));
  }, [inputAmount, selectedToken, prices]);

  // Execute purchase based on selected token
  const executePurchase = async () => {
    if (!isConnected) {
      alert("Please connect your wallet first");
      return;
    }

    if (parseFloat(inputAmount) <= 0) {
      alert("Amount must be greater than 0");
      return;
    }

    if (!hasSufficientBalance) {
      if (parseFloat(contractInfo?.fsxBalance || "0") < 20) {
        alert("Insufficient token supply. Please try again later.");
      } else {
        alert(`Insufficient ${displayToken} balance`);
      }
      return;
    }

    try {
      let tx;
      console.log(`Buying with ${inputAmount} ${displayToken}`);

      switch (selectedToken) {
        case "ETH":
          tx = await buyWithETH(inputAmount);
          break;
        case "BNB":
          tx = await buyWithBNB(inputAmount);
          break;
        case "BTC":
          tx = await buyWithBTC(inputAmount);
          break;
        case "SOL":
          tx = await buyWithSOL(inputAmount);
          break;
        case "USDT":
          tx = await buyWithUSDT(inputAmount);
          break;
        case "USDC":
          tx = await buyWithUSDC(inputAmount);
          break;
        default:
          alert("Please select a token to purchase with");
          return;
      }

      console.log(tx);
      alert(`Successfully purchased ${tokenAmount} ${TOKEN_SYMBOL} tokens!`);

      // Reset amounts
      setInputAmount("0");
      setTokenAmount("0");
    } catch (error) {
      console.error(`Error buying with ${displayToken}:`, error);
      alert("Transaction failed. Please try again.");
    }
  };

  const logAllBalances = (tb = tokenBalances) => {
    if (!tb) return console.log("No balances yet (tokenBalances is undefined)");
  
    const val = (v) => v ?? "0";
    const balances = {
      ETH:  val(tb?.ETH),
      BNB:  val(tb?.BNB),
      BTC:  val(tb?.BTC),
      SOL:  val(tb?.SOL),
      USDT: val(tb?.USDT),
      USDC: val(tb?.USDC),
      SAV:  val(tb?.SAV),
    };
  
    console.log("User balances:", balances);
    console.table(balances);
    return balances;
  };

  // Get current balance based on selected token
  const getCurrentBalance = () => {
    if (!tokenBalances) return "0";

    switch (selectedToken) {
      case "ETH":
        return tokenBalances?.ETH || "0";
      case "BNB":
        return tokenBalances?.BNB || "0";
      case "BTC":
        return tokenBalances?.BTC || "0";
      case "SOL":
        return tokenBalances?.SOL || "0";
      case "USDT":
        return tokenBalances?.USDT || "0";
      case "USDC":
        return tokenBalances?.USDC || "0";
      default:
        return "0";
    }
  };

  // Determine button state message
  const getButtonMessage = () => {
    // Frontend gating removed: do not block on saleStartTs
    if (parseFloat(contractInfo?.fsxBalance || "0") < 20) {
      return "INSUFFICIENT TOKEN SUPPLY";
    }
    return hasSufficientBalance
      ? `BUY WITH ${displayToken}`
      : `INSUFFICIENT ${displayToken} BALANCE`;
  };

  const handleWaitlistRegister = async () => {
    if (!eligibility?.referrer) {
      alert("No referrer found for this wallet");
      return;
    }
    try {
      await registerReferrer(eligibility.referrer);
      setIsWaitlisted(true);
      setShowWaitlistModal(false);
    } catch (err) {
      console.error("waitlist registration error", err);
      alert("Registration failed. Please try again.");
    }
  };

  // Get token icon/logo based on selected token
  const getTokenIcon = (token) => {
    switch (token) {
      case "ETH":
        return <FaEthereum className="text-blue-400" />;
      case "BNB":
        return <SiBinance className="text-yellow-400" />;
      case "BTC":
        return <FaBitcoin className="text-orange-400" />;
      case "SOL":
        return <SiSolana className="text-purple-400" />;
      case "USDT":
        return <SiTether className="text-green-400" />;
      case "USDC":
        return <img src="/usdc.svg" className="w-5 h-5" alt="USDC" />;
      default:
        return null;
    }
  };

  // Theme variables
  const bgColor = isDarkMode ? "bg-[#0E0B12]" : "bg-[#F5F7FA]";
  const textColor = isDarkMode ? "text-white" : "text-gray-800";
  const secondaryTextColor = isDarkMode ? "text-gray-400" : "text-gray-600";
  const cardBg = isDarkMode ? "bg-[#110022]" : "bg-white/95";
  const cardBorder = isDarkMode ? "border-gray-800/30" : "border-gray-100";
  const inputBg = isDarkMode
    ? "bg-gray-900/60 border-gray-800/50"
    : "bg-gray-100 border-gray-200/70";
  const primaryGradient = "from-teal-400 to-indigo-500";
  const primaryGradientHover = "from-teal-500 to-indigo-600";
  const accentColor = "text-teal-500";

  // Token button styling
  const getTokenButtonStyle = (token) => {
    const isSelected = selectedToken === token;
    const baseClasses =
      "flex-1 flex items-center justify-center rounded-lg py-2.5 transition-all duration-300";

    if (isSelected) {
      let selectedColorClass;
      switch (token) {
        case "ETH":
          selectedColorClass = "bg-gradient-to-r from-blue-500 to-indigo-600";
          break;
        case "BNB":
          selectedColorClass = "bg-gradient-to-r from-yellow-400 to-yellow-600";
          break;
        case "BTC":
          selectedColorClass = "bg-gradient-to-r from-orange-500 to-yellow-600";
          break;
        case "SOL":
          selectedColorClass = "bg-gradient-to-r from-purple-500 to-purple-700";
          break;
        case "USDT":
          selectedColorClass = "bg-gradient-to-r from-green-500 to-teal-600";
          break;
        case "USDC":
          selectedColorClass = "bg-gradient-to-r from-blue-400 to-blue-600";
          break;
        default:
          selectedColorClass = "";
      }
      return `${baseClasses} ${selectedColorClass} text-white shadow-lg`;
    }

    return `${baseClasses} ${
      isDarkMode
        ? "bg-gray-800/40 hover:bg-gray-800/60 text-gray-300"
        : "bg-gray-200 hover:bg-gray-300 text-gray-700"
    }`;
  };

  return (
    <div className={`relative mt-12 w-full overflow-hidden ${bgColor}`}>
      {/* Background with glowing animated pattern */}
      <div className="absolute inset-0 z-0">
        {/* Gradient overlay */}
        <div
          className={`absolute inset-0 ${
            isDarkMode
              ? "bg-gradient-to-b from-[#0E0B12]/80 via-transparent to-[#0E0B12]/80"
              : "bg-gradient-to-b from-[#f3f3f7]/80 via-transparent to-[#f3f3f7]/80"
          }`}
        ></div>

        {/* Animated glowing grid pattern */}
        <div className="absolute inset-0 grid-pattern"></div>

        {/* Moving light effects */}
        <div className="absolute inset-0 light-rays">
          <div className="light-ray ray1"></div>
          <div className="light-ray ray2"></div>
          <div className="light-ray ray3"></div>
        </div>
      </div>

      {/* Main content */}
      <div className="container mx-auto px-4 py-28 md:py-32 relative z-10">
        {boundReferrer && (
          <div className={`mb-4 ${textColor}`}>
            Referrer: {formatAddress(boundReferrer)}
          </div>
        )}
        <div className="flex flex-col md:flex-row items-center justify-between gap-12 md:gap-16">
          {/* Left side content - Text and graphics */}
          <div className="w-full md:w-1/2 flex flex-col items-center text-left">
            {/* Header content */}
            <div className="inline-block p-2 px-4 rounded-full text-light-gradient mb-6">
              <p className="text-sm font-medium bg-clip-text text-transparent text-light-gradient">
                Presale Now Live
              </p>
            </div>

            <h1
              className={`text-4xl md:text-5xl lg:text-6xl font-bold ${textColor} mb-4`}
            >
              {TOKEN_NAME}{" "}
              <span className="bg-clip-text text-transparent text-light-gradient">
              </span>
            </h1>

            <h2 className="text-2xl md:text-3xl font-bold mb-6">
              <span className={textColor}> Stage 1 </span>
              <span className="bg-clip-text text-transparent text-light-gradient">
                Token
              </span>
              <span className="bg-clip-text text-transparent text-light-gradient">
                {" "}
                Sale
              </span>
            </h2>

            <p
              className={`${secondaryTextColor} text-base md:text-lg max-w-md mb-8 leading-relaxed`}
            >
              Be part of the next generation of blockchain infrastructure.
              Savitri is a scalable, energy-efficient Layer 1 designed for real-world systems—IoT, AI, and beyond.
            </p>

            {/* Feature highlights */}
            <div className="flex flex-col gap-4 mb-8 items-center">
              <div
                className={`px-4 py-2 rounded-full ${
                  isDarkMode ? "bg-teal-500/10" : "bg-teal-100"
                } ${isDarkMode ? "text-teal-300" : "text-white"} text-sm font-medium flex items-center`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 mr-1"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Low fees. High throughput. Built to last.
              </div>

              <div
                className={`px-4 py-2 rounded-full ${
                  isDarkMode ? "bg-teal-500/10" : "bg-teal-100"
                } ${isDarkMode ? "text-teal-300" : "text-white"} text-sm font-medium flex items-center`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 mr-1"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Own SAVI early and help shape the decentralized future.
              </div>

              <p className="text-center mt-4 text-white">
                Join the network. Claim your stake. Build what’s next.
              </p>
            </div>


            {/* Referral button - Mobile only */}
            <button
              onClick={() => setIsReferralPopupOpen(true)}
              className={`md:hidden w-full bg-transparent ${
                isDarkMode
                  ? "border-gray-700 hover:border-gray-600 hover:bg-gray-800/20"
                  : "border-gray-300 hover:border-gray-400 hover:bg-gray-100"
              } border-2 rounded-lg py-3 mb-4 ${textColor} transition-all duration-200 font-medium`}
            >
              REFER A FRIEND
            </button>

            {/* Background decorative elements */}
            <div className="absolute bottom-0 left-0 w-64 h-64 text-light-gradient rounded-full blur-3xl -z-10"></div>
          </div>

          {/* Right side content - Token purchase card */}
          <div className="w-full max-w-[600px] mx-auto relative">            {/* Loading overlay */}
            {isLoading && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/50 backdrop-blur-sm rounded-xl">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                </div>
              </div>
            )}

            {/* Main card */}
            <div
  className={`w-[550px] ${cardBg} backdrop-blur-sm rounded-xl ${cardBorder} border shadow-xl overflow-hidden transform transition duration-500 hover:shadow-2xl`}
>
              <div className="p-6 md:p-8">
                {tokenBalances?.SAV > 0 && (
                    <div
                      className={`text-center text-xs ${secondaryTextColor} mb-4 bg-gradient-to-r from-teal-400/5 to-indigo-500/5 py-2 px-4 rounded-lg`}
                    >
                      Can&apos;t find tokens in your wallet?
                    <button
                      onClick={addtokenToMetaMask}
                      className="ml-2 text-teal-400 hover:text-teal-300 transition-colors"
                    >
                      Add to MetaMask
                    </button>
                  </div>
                )}

                {/* Card header */}
                <div className="text-center">
                  <div className="inline-block p-1.5 px-3 rounded-full text-light-gradient mb-2">
                    <p className="text-xs font-medium bg-clip-text text-transparent text-light-gradient">
                      Limited Time Offer
                    </p>
                  </div>
                  <h3 className="text-xl text-center font-bold mb-1 bg-clip-text text-transparent text-light-gradient">
                    Stage 1 - Buy {TOKEN_SYMBOL} Now
                  </h3>

                <div
                  className={`text-center text-sm ${secondaryTextColor} mb-4`}
                >
                  {nowTs < saleStartTs && saleStartTs > 0
                    ? `Countdown starts ${(() => { const d=new Date(saleStartTs*1000); const dd=String(d.getDate()).padStart(2,'0'); const mm=String(d.getMonth()+1).padStart(2,'0'); const yyyy=d.getFullYear(); return `${dd}.${mm}.${yyyy}`; })()}`
                    : timeRemaining > 0
                    ? `Next price in ${formatTime(timeRemaining)}`
                    : "Until price increase"}
                </div>
                </div>

                {/* Price information */}
                <div className="flex justify-between items-center text-sm mb-3 px-1">
                  <div className={`${secondaryTextColor} flex flex-col`}>
                    <span className="text-xs mb-1">Current Price</span>
                    <span className={`${textColor} font-medium`}>
                      $ {parseFloat(currentUsdPrice).toFixed(2)}
                    </span>
                  </div>
                  <div className="h-10 w-px bg-gradient-to-b from-transparent via-gray-500/20 to-transparent"></div>
                  <div
                    className={`${secondaryTextColor} flex flex-col text-right`}
                  >
                    <span className="text-xs mb-1">Next Stage Price</span>
                    <span className={`${textColor} font-medium`}>
                      $ {parseFloat(nextUsdPrice).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div
                  className={`w-full h-4 ${
                    isDarkMode ? "bg-gray-800/70" : "bg-gray-200/70"
                  } rounded-full mb-3 overflow-hidden`}
                >
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${primaryGradient} animated-progress relative`}
                    style={{
                      width: `${calculateProgressPercentage()}%`,
                    }}
                  >
                    <div className="absolute top-0 left-0 w-full h-full bg-white/10 shimmer-effect"></div>
                  </div>
                </div>

                {/* Progress stats */}
                <div className="flex justify-between text-xs mb-6 px-1">
                  <div className={secondaryTextColor}>
                    Total Raised:{" "}
                    <span className={`${textColor} font-medium`}>
                      ${" "}
                      {parseFloat(contractInfo?.totalSold || 0) *
                        parseFloat(currentUsdPrice || 0) >
                      0
                        ? (
                            parseFloat(contractInfo?.totalSold || 0) *
                            parseFloat(currentUsdPrice || 0)
                          ).toFixed(2)
                        : "0"}
                    </span>
                  </div>
                  <div className={`${secondaryTextColor} font-medium`}>
                    <span className="text-teal-400 font-semibold">
                      {calculateProgressPercentage()}%
                    </span>{" "}
                    Complete
                  </div>
                </div>

                {/* Divider */}
                <div
                  className={`border-t ${
                    isDarkMode ? "border-gray-800/50" : "border-gray-200/50"
                  } my-5`}
                ></div>

                {/* Token price */}
                <div className="flex items-center justify-center space-x-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-teal-400/20 to-indigo-500/20 flex items-center justify-center">
                    <span className="text-lg font-bold text-transparent bg-clip-text text-light-gradient">
                      1
                    </span>
                  </div>
                  <span className={`${textColor} text-lg font-medium`}>
                    {TOKEN_SYMBOL} ={" "}
                  </span>
                  <div className="px-3 py-1 rounded-lg text-light-gradient">
                    <span className="text-lg font-bold text-transparent bg-clip-text text-light-gradient">
                      ${parseFloat(currentUsdPrice).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Token selection */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <button
                    onClick={() => handleTokenSelection("BNB")}
                    className={getTokenButtonStyle("BNB")}
                  >
                    <SiBinance
                      className={`mr-2 ${
                        selectedToken === "BNB" ? "text-white" : ""
                      }`}
                      size={18}
                    />
                    {CURRENCY}
                  </button>
                  <button
                    onClick={() => handleTokenSelection("ETH")}
                    className={getTokenButtonStyle("ETH")}
                  >
                    <FaEthereum
                      className={`mr-2 ${
                        selectedToken === "ETH" ? "text-white" : ""
                      }`}
                      size={18}
                    />
                    ETH
                  </button>
                  <button
                    onClick={() => handleTokenSelection("BTC")}
                    className={getTokenButtonStyle("BTC")}
                  >
                    <FaBitcoin
                      className={`mr-2 ${
                        selectedToken === "BTC" ? "text-white" : ""
                      }`}
                      size={18}
                    />
                    BTC
                  </button>
                  <button
                    onClick={() => handleTokenSelection("SOL")}
                    className={getTokenButtonStyle("SOL")}
                  >
                    <SiSolana
                      className={`mr-2 ${
                        selectedToken === "SOL" ? "text-white" : ""
                      }`}
                      size={18}
                    />
                    SOL
                  </button>
                  <button
                    onClick={() => handleTokenSelection("USDT")}
                    className={getTokenButtonStyle("USDT")}
                  >
                    <SiTether
                      className={`mr-2 ${
                        selectedToken === "USDT" ? "text-white" : ""
                      }`}
                      size={18}
                    />
                    USDT
                  </button>
                  <button
                    onClick={() => handleTokenSelection("USDC")}
                    className={getTokenButtonStyle("USDC")}
                  >
                    <img
                      className={`mr-2 w-4 h-4 ${
                        selectedToken === "USDC" ? "filter brightness-200" : ""
                      }`}
                      src="/usdc.svg"
                      alt="USDC"
                    />
                    USDC
                  </button>
                </div>

                {/* Balance display */}
                <div
                  className={`text-sm ${secondaryTextColor} text-center mb-6 py-2 px-4 rounded-lg ${
                    isDarkMode ? "bg-gray-800/30" : "bg-gray-100/70"
                  }`}
                >
                  <span className="mr-2">{displayToken} Balance:</span>
                  <span className={`${textColor} font-medium`}>
                    {getCurrentBalance()}
                  </span>
                  <span className="ml-1">{displayToken}</span>
                </div>

                {/* Amount inputs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                  <div>
                    <label
                      className={`block ${secondaryTextColor} text-xs mb-1 font-medium`}
                    >
                      Pay with {displayToken}
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={inputAmount}
                        onChange={(e) => handleAmountChange(e.target.value)}
                        className={`w-full ${inputBg} rounded-lg border px-4 py-3 ${textColor} focus:ring-1 focus:ring-teal-400 focus:border-teal-400 transition-all duration-200`}
                      />
                      <div
                        className={`absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2`}
                      >
                        <span className={`text-xs ${secondaryTextColor}`}>
                          {displayToken}
                        </span>
                        <div className="w-6 h-6 rounded-full flex items-center justify-center">
                          {getTokenIcon(selectedToken)}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label
                      className={`block ${secondaryTextColor} text-xs mb-1 font-medium`}
                    >
                      Receive {TOKEN_SYMBOL}
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={tokenAmount}
                        readOnly
                        className={`w-full ${inputBg} rounded-lg border px-4 py-3 ${textColor}`}
                      />
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                        <span className={`text-xs ${secondaryTextColor}`}>
                          {TOKEN_SYMBOL}
                        </span>
                        <div className="w-6 h-6 flex items-center justify-center">
                          <img
                            src="/Savitri.png"
                            alt={TOKEN_SYMBOL}
                            className="w-5 h-5"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action button */}
                {isConnected ? (
                  <button
                    onClick={executePurchase}
                    disabled={!hasSufficientBalance}
                    className={`w-full ${
                      hasSufficientBalance
                        ? `bg-gradient-to-r ${primaryGradient} hover:${primaryGradientHover}`
                        : isDarkMode
                        ? "bg-gray-700/70 cursor-not-allowed"
                        : "bg-gray-300 cursor-not-allowed"
                    } text-white rounded-lg py-4 mb-4 flex items-center justify-center transition-all duration-300 font-medium shadow-lg ${
                      hasSufficientBalance
                        ? "hover:shadow-indigo-500/20 hover:scale-[1.01]"
                        : ""
                    }`}
                  >
                    {getButtonMessage()}
                  </button>
                ) : (
                  <CustomConnectButton childStyle="w-full mb-4 py-4 rounded-lg flex items-center justify-center gap-2 font-medium" />
                )}

                {isConnected && eligibility?.whitelisted && !isWaitlisted && (
                  <>
                    <button
                      onClick={() => setShowWaitlistModal(true)}
                      className={`w-full bg-transparent ${
                        isDarkMode
                          ? "border-teal-500/50 hover:bg-teal-500/10 text-teal-400"
                          : "border-teal-500/70 hover:bg-teal-500/5 text-teal-600"
                      } border-2 rounded-lg py-3.5 mb-4 font-medium transition-all duration-300`}
                    >
                      REGISTER AS WAITLIST USER
                    </button>
                    {showWaitlistModal && (
                      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                        <div className={`${cardBg} p-6 rounded-lg max-w-sm w-full`}>
                          <p className={`${textColor} mb-4 text-center`}>
                            Register this wallet for waitlist access?
                          </p>
                          <div className="flex justify-center gap-3">
                            <button
                              onClick={() => setShowWaitlistModal(false)}
                              className={`px-4 py-2 rounded-lg border ${
                                isDarkMode
                                  ? "border-gray-700 text-gray-300"
                                  : "border-gray-300 text-gray-700"
                              }`}
                            >
                              Cancel
                            </button>
                            <button
                              onClick={handleWaitlistRegister}
                              className={`px-4 py-2 rounded-lg bg-gradient-to-r ${primaryGradient} hover:${primaryGradientHover} text-white`}
                            >
                              Confirm
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Refer a friend button */}
                <button
                  onClick={() => setIsReferralPopupOpen(true)}
                  className={`w-full bg-transparent ${
                    isDarkMode
                      ? "border-gray-700/70 hover:border-teal-400/30 hover:bg-gray-800/20 text-gray-300"
                      : "border-gray-300 hover:border-teal-400/50 hover:bg-gray-100 text-gray-700"
                  } border-2 rounded-lg py-3.5 mb-4 font-medium transition-all duration-300 flex items-center justify-center space-x-2 hover:scale-[1.01]`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                  </svg>
                  <span>REFER A FRIEND</span>
                </button>

                {/* Help links */}
                <div className="flex flex-col space-y-2 text-xs">
                  <div
                    className={`p-3 rounded-lg ${
                      isDarkMode ? "bg-gray-800/30" : "bg-gray-100/70"
                    } mb-1`}
                  >
                    <div className="flex items-center space-x-3 mb-2">
                      <AiOutlineQuestionCircle
                        className={`text-lg ${accentColor}`}
                      />
                      <h4 className={`font-medium ${textColor}`}>Need Help?</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <a
                        href="#participate-pre-sale"
                        className={`${secondaryTextColor} hover:${textColor} flex items-center text-xs transition-colors duration-200 px-2 py-1 rounded hover:bg-gray-700/20`}
                      >
                        <span className="mr-1">•</span>
                        How to Buy
                      </a>
                      <a
                        href="https://support.metamask.io/start/getting-started-with-metamask/"
                        className={`${secondaryTextColor} hover:${textColor} flex items-center text-xs transition-colors duration-200 px-2 py-1 rounded hover:bg-gray-700/20`}
                      >
                        <span className="mr-1">•</span>
                        Wallet Connection
                      </a>
                      <a
                        href="#savi-coin-use"
                        className={`${secondaryTextColor} hover:${textColor} flex items-center text-xs transition-colors duration-200 px-2 py-1 rounded hover:bg-gray-700/20`}
                      >
                        <span className="mr-1">•</span>
                        Token Info
                      </a>
                      <a
                        href="#faq"
                        className={`${secondaryTextColor} hover:${textColor} flex items-center text-xs transition-colors duration-200 px-2 py-1 rounded hover:bg-gray-700/20`}
                      >
                        <span className="mr-1">•</span>
                        FAQ
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll to top button */}
      <div className="fixed bottom-6 right-6 z-50">
  <button
    onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
    className={`w-10 h-10 rounded-full ${
      isDarkMode ? "bg-indigo-600 text-white" : "bg-gray-200 text-indigo-600"
    } shadow-lg shadow-indigo-500/20 flex items-center justify-center transition-all duration-300 hover:scale-110`}
    aria-label="Scroll to top"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-5 w-5"
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      <path
        fillRule="evenodd"
        d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z"
        clipRule="evenodd"
      />
    </svg>
  </button>
</div>


      {/* CSS for animations */}
      <style jsx>{`
        @keyframes pulse-slow {
          0%,
          100% {
            opacity: 0.8;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.02);
          }
        }
        .animate-pulse-slow {
          animation: pulse-slow 3s infinite;
        }
        .animated-progress {
          animation: progress 1.5s ease-out;
        }
        @keyframes progress {
          0% {
            width: 0%;
          }
          100% {
            width: ${calculateProgressPercentage()}%;
          }
        }

        .grid-pattern {
          background-image: ${isDarkMode
            ? "linear-gradient(rgba(56, 189, 248, 0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(56, 189, 248, 0.06) 1px, transparent 1px)"
            : "linear-gradient(rgba(79, 70, 229, 0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(79, 70, 229, 0.08) 1px, transparent 1px)"};
          background-size: 35px 35px;
          animation: pulse-grid 8s ease-in-out infinite alternate;
        }

        @keyframes pulse-grid {
          0% {
            opacity: 0.7;
            background-size: 35px 35px;
          }
          100% {
            opacity: 1;
            background-size: 36px 36px;
          }
        }

        .light-rays {
          overflow: hidden;
          opacity: ${isDarkMode ? "0.4" : "0.3"};
        }

        .light-ray {
          position: absolute;
          width: 200%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent 0%,
            ${isDarkMode
              ? "rgba(56, 189, 248, 0.05) 45%, rgba(79, 70, 229, 0.1) 50%, rgba(56, 189, 248, 0.05) 55%"
              : "rgba(56, 189, 248, 0.03) 45%, rgba(79, 70, 229, 0.07) 50%, rgba(56, 189, 248, 0.03) 55%"},
            transparent 100%
          );
          transform: rotate(45deg);
          top: -50%;
          left: -50%;
        }

        .ray1 {
          animation: moveRay 15s linear infinite;
        }

        .ray2 {
          animation: moveRay 20s linear 5s infinite;
        }

        .ray3 {
          animation: moveRay 25s linear 10s infinite;
        }

        @keyframes moveRay {
          0% {
            transform: rotate(45deg) translateX(-100%);
          }
          100% {
            transform: rotate(45deg) translateX(100%);
          }
        }

        .shimmer-effect {
          animation: shimmer 2s infinite linear;
          background: linear-gradient(
            to right,
            rgba(255, 255, 255, 0) 0%,
            rgba(255, 255, 255, 0.2) 50%,
            rgba(255, 255, 255, 0) 100%
          );
          background-size: 200% 100%;
        }

        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
      `}</style>
    </div>
  );
};

export default HeroSection;
