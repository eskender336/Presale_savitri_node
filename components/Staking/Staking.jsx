import React, { useState, useEffect } from "react";
import {
  FaLock,
  FaInfoCircle,
  FaChartBar,
  FaCoins,
  FaHistory,
  FaWallet,
  FaChartLine,
} from "react-icons/fa";
import { TokenCalculator, CustomConnectButton } from "../index";
import { useWeb3 } from "../../context/Web3Provider";
import { Header } from "../index";

const TOKEN_NAME = process.env.NEXT_PUBLIC_TOKEN_NAME;
const TOKEN_SYMBOL = process.env.NEXT_PUBLIC_TOKEN_SYMBOL;
const PER_TOKEN_USD_PRICE = process.env.NEXT_PUBLIC_PER_TOKEN_USD_PRICE;
const TOKEN_SUPPLY = process.env.NEXT_PUBLIC_TOKEN_SUPPLY;
const APY_RATE = process.env.NEXT_PUBLIC_APY_RATE || "12";
const MIN_STAKE_AMOUNT = process.env.NEXT_PUBLIC_MIN_STAKE_AMOUNT || "100";
const LOCK_PERIODS = process.env.NEXT_PUBLIC_LOCK_PERIODS || "30,90,180,365";

const Staking = ({ isDarkMode }) => {
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
    stakeTokens,
    unstakeTokens,
    harvestRewards,
    getUserStakes,
    getAllStakes,
    formatAddress,
    formatTokenAmount,
    refreshContractData,
    getContractInfo,
    getTokenBalances,
    isOwner,
    unstakeEarly,
    reCall,
  } = useWeb3();

  const [stakeAmount, setStakeAmount] = useState("");
  const [lockPeriod, setLockPeriod] = useState(LOCK_PERIODS.split(",")[0]);
  const [calculatedReward, setCalculatedReward] = useState("0");
  const [userStakes, setUserStakes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("stake");
  const [harvestLoading, setHarvestLoading] = useState(false);
  const [unstakeLoading, setUnstakeLoading] = useState(false);
  const [unstakeId, setUnstakeId] = useState(null);
  const [stakingInfo, setStakingInfo] = useState();
  const [stakingBalance, setStakingBalance] = useState();

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

  // Calculate APY based on lock period
  const calculateApy = (period) => {
    const baseApy = parseFloat(stakingInfo?.baseAPY);
    switch (period) {
      case "30":
        return baseApy;
      case "90":
        return baseApy * 1.5;
      case "180":
        return baseApy * 2;
      case "365":
        return baseApy * 3;
      default:
        return baseApy;
    }
  };

  // Fetch user stakes on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      if (account) {
        try {
          const stakeInfo = await getContractInfo();
          setStakingInfo(stakeInfo);
          const stakeBalance = await getTokenBalances();
          setStakingBalance(stakeInfo);
          const stakesArray = await getUserStakes(account);
          setUserStakes(stakesArray.reverse());
        } catch (error) {
          console.error("Error fetching user stakes:", error);
        }
      }
    };

    fetchUserData();
  }, [account, reCall]);

  // Calculate estimated reward based on input and lock period
  useEffect(() => {
    if (stakeAmount && lockPeriod) {
      const amount = parseFloat(stakeAmount);
      const period = parseInt(lockPeriod);
      const apy = calculateApy(lockPeriod);

      // Daily reward rate
      const dailyRate = apy / 365 / 100;

      // Total reward for the period
      const totalReward = amount * dailyRate * period;

      setCalculatedReward(totalReward.toFixed(4));
    } else {
      setCalculatedReward("0");
    }
  }, [stakeAmount, lockPeriod]);

  // Add a more comprehensive useEffect for loading contract data
  useEffect(() => {
    const loadContractData = async () => {
      if (account) {
        // Refresh the contract data first
        await refreshContractData();

        // Then load user stakes
        try {
          const stakesArray = await getUserStakes(account);
          setUserStakes(stakesArray.reverse());
        } catch (error) {
          console.error("Error fetching user stakes:", error);
        }
      }
    };

    loadContractData();
  }, [account, refreshContractData, reCall]);

  // Function to handle staking
  const handleStake = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Call the stakeTokens function with amount and lock period
      // The period needs to be passed as a number, not a string
      const result = await stakeTokens(stakeAmount, parseInt(lockPeriod));

      // Only reset the form if the transaction was successful
      if (result) {
        setStakeAmount("");

        // Refresh contract data to get updated balances
        await refreshContractData();

        // Refresh user stakes
        if (account) {
          const stakesArray = await getUserStakes(account);
          setUserStakes(stakesArray.reverse());
        }
      }
    } catch (error) {
      console.error("Error staking tokens:", error);
    } finally {
      setIsLoading(false);
    }
  };
  /// Update handleUnstake function
  const handleUnstake = async (stakeId) => {
    setUnstakeId(stakeId);
    setUnstakeLoading(true);

    try {
      // Call the unstakeTokens function with stakeId
      const result = await unstakeTokens(stakeId);

      // Only refresh data if the transaction was successful
      if (result) {
        // Refresh contract data to get updated balances
        await refreshContractData();

        // Refresh user stakes
        if (account) {
          const stakesArray = await getUserStakes(account);
          setUserStakes(stakesArray.reverse());
        }
      }
    } catch (error) {
      console.error("Error unstaking tokens:", error);
    } finally {
      setUnstakeLoading(false);
      setUnstakeId(null);
    }
  };

  const handleEarlyUnstake = async (stakeId) => {
    setUnstakeId(stakeId);
    setUnstakeLoading(true);

    // Show confirmation dialog first
    if (
      confirm(
        "Are you sure you want to unstake early? A 5% penalty will be applied to your principal amount."
      )
    ) {
      try {
        // Call the unstakeEarly function
        const result = await unstakeEarly(stakeId);

        // Only refresh data if the transaction was successful
        if (result) {
          // Refresh contract data to get updated balances
          await refreshContractData();

          // Refresh user stakes
          if (account) {
            const stakesArray = await getUserStakes(account);
            setUserStakes(stakesArray.reverse());
          }
        }
      } catch (error) {
        console.error("Error unstaking tokens early:", error);
      } finally {
        setUnstakeLoading(false);
        setUnstakeId(null);
      }
    } else {
      // User cancelled
      setUnstakeLoading(false);
      setUnstakeId(null);
    }
  };

  // Update handleHarvest function
  const handleHarvest = async (stakeId) => {
    setUnstakeId(stakeId);
    setHarvestLoading(true);

    try {
      // Call the harvestRewards function with stakeId
      const result = await harvestRewards(stakeId);

      // Only refresh data if the transaction was successful
      if (result) {
        // Refresh contract data to get updated balances
        await refreshContractData();

        // Refresh user stakes
        if (account) {
          const stakesArray = await getUserStakes(account);
          setUserStakes(stakesArray.reverse());
        }
      }
    } catch (error) {
      console.error("Error harvesting rewards:", error);
    } finally {
      setHarvestLoading(false);
      setUnstakeId(null);
    }
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

  // Calculate time remaining for a stake
  const calculateTimeRemaining = (startTime, lockPeriod) => {
    const startDate = new Date(parseInt(startTime) * 1000);
    const endDate = new Date(
      startDate.getTime() + parseInt(lockPeriod) * 24 * 60 * 60 * 1000
    );
    const now = new Date();

    if (now >= endDate) {
      return "Unlocked";
    }

    const remainingMs = endDate - now;
    const remainingDays = Math.floor(remainingMs / (1000 * 60 * 60 * 24));

    return `${remainingDays} days`;
  };

  return (
    <>
      <Header theme={theme} title="Token Staking" />
      <div className="">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Staking Stats Card */}
          <div className="lg:col-span-1">
            <div className={`${theme.bg} rounded-xl overflow-hidden shadow-lg`}>
              <div className={`p-6 border-b ${theme.border}`}>
                <h2
                  className={`text-xl font-bold ${theme.text} flex items-center`}
                >
                  <FaChartBar className="mr-2 text-[#DE3657]" />
                  Staking Stats
                </h2>
              </div>

              <div className="p-6 space-y-4">
                {/* Staking Info */}
                <div>
                  <h3 className="text-lg font-medium text-[#DE3657] mb-3">
                    Staking Information
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className={theme.textSecondary}>Token:</span>
                      <span className={theme.text}>{TOKEN_SYMBOL}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={theme.textSecondary}>Base APY:</span>
                      <span className={theme.text}>
                        {stakingInfo?.baseAPY}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className={theme.textSecondary}>Total Staked:</span>
                      <span className={theme.text}>
                        {formatLargeNumber(stakingInfo?.totalStaked || 0)}{" "}
                        {TOKEN_SYMBOL}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className={theme.textSecondary}>
                        Min Stake Amount:
                      </span>
                      <span className={theme.text}>
                        {stakingInfo?.minStakeAmount} {TOKEN_SYMBOL}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Your Staking Info */}
                <div>
                  <h3 className="text-lg font-medium text-[#DE3657] mb-3">
                    Your Staking Overview
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className={theme.textSecondary}>Your Balance:</span>
                      <span className={theme.text}>
                        {formatLargeNumber(tokenBalances?.userFsxBlanace || 0)}{" "}
                        {TOKEN_SYMBOL}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className={theme.textSecondary}>Total Staked:</span>
                      <span className={theme.text}>
                        {formatLargeNumber(stakingBalance?.userStaked || 0)}{" "}
                        {TOKEN_SYMBOL}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className={theme.textSecondary}>
                        Pending Rewards:
                      </span>
                      <span className={theme.text}>
                        {formatLargeNumber(stakingBalance?.pendingRewards || 0)}{" "}
                        {TOKEN_SYMBOL}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className={theme.textSecondary}>
                        Active Stakes:
                      </span>
                      <span className={theme.text}>
                        {userStakes?.length || 0}
                      </span>
                    </div>
                  </div>
                </div>

                {/* APY Boosters */}
                <div>
                  <h3 className="text-lg font-medium text-[#DE3657] mb-3">
                    APY Boosters
                  </h3>
                  <div className={`${theme.cardBg} rounded-lg p-4 space-y-3`}>
                    <div className="flex justify-between items-center">
                      <div>
                        <span className={`${theme.text} font-medium`}>
                          30 Days Lock
                        </span>
                        <p className={`text-sm ${theme.textMuted}`}>Base APY</p>
                      </div>
                      <span className="text-[#DE3657] font-bold">
                        {stakingInfo?.baseAPY}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div>
                        <span className={`${theme.text} font-medium`}>
                          90 Days Lock
                        </span>
                        <p className={`text-sm ${theme.textMuted}`}>
                          1.5x Bonus
                        </p>
                      </div>
                      <span className="text-[#DE3657] font-bold">
                        {parseFloat(stakingInfo?.baseAPY) * 1.5}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div>
                        <span className={`${theme.text} font-medium`}>
                          180 Days Lock
                        </span>
                        <p className={`text-sm ${theme.textMuted}`}>2x Bonus</p>
                      </div>
                      <span className="text-[#DE3657] font-bold">
                        {parseFloat(stakingInfo?.baseAPY) * 2}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div>
                        <span className={`${theme.text} font-medium`}>
                          365 Days Lock
                        </span>
                        <p className={`text-sm ${theme.textMuted}`}>3x Bonus</p>
                      </div>
                      <span className="text-[#DE3657] font-bold">
                        {parseFloat(stakingInfo?.baseAPY) * 3}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Staking Actions Card */}
          <div className="lg:col-span-2">
            <div className={`${theme.bg} rounded-xl overflow-hidden shadow-lg`}>
              <div className={`p-6 border-b ${theme.border}`}>
                <h2
                  className={`text-xl font-bold ${theme.text} flex items-center`}
                >
                  <FaLock className="mr-2 text-[#DE3657]" />
                  Stake Your Tokens
                </h2>
              </div>

              {/* Actions Tabs */}
              <div className={`flex border-b ${theme.border}`}>
                <button
                  onClick={() => setActiveTab("stake")}
                  className={`flex-1 py-4 px-6 flex justify-center items-center gap-2 ${
                    activeTab === "stake"
                      ? "bg-gradient-to-r from-teal-400 to-indigo-500 hover:from-teal-500 hover:to-indigo-600 text-white"
                      : `${theme.textSecondary} ${theme.hover}`
                  }`}
                >
                  <FaLock />
                  <span>Stake</span>
                </button>
                <button
                  onClick={() => setActiveTab("yourStakes")}
                  className={`flex-1 py-4 px-6 flex justify-center items-center gap-2 ${
                    activeTab === "yourStakes"
                      ? "bg-gradient-to-r from-teal-400 to-indigo-500 hover:from-teal-500 hover:to-indigo-600 text-white"
                      : `${theme.textSecondary} ${theme.hover}`
                  }`}
                >
                  <FaWallet />
                  <span>Your Stakes</span>
                </button>
              </div>

              {/* Staking Form or Stakes List */}
              <div className="p-6">
                {!isConnected ? (
                  <div className="text-center py-8">
                    <p className={`${theme.textSecondary} mb-6`}>
                      Connect your wallet to stake tokens
                    </p>
                    <button
                      onClick={connectWallet}
                      disabled={isConnecting}
                      className="font-medium py-3 rounded-xl transition-colors"
                    >
                      <CustomConnectButton isDarkMode={isDarkMode} />
                    </button>
                  </div>
                ) : activeTab === "stake" ? (
                  <form onSubmit={handleStake} className="space-y-6">
                    {/* Stake Amount Input */}
                    <div>
                      <label className={`block ${theme.textSecondary} mb-2`}>
                        Stake Amount
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={stakeAmount}
                          onChange={(e) => setStakeAmount(e.target.value)}
                          placeholder="0.0"
                          step="1"
                          min={stakingInfo?.minStakeAmount}
                          className={`w-full ${theme.inputBg} rounded-lg p-4 ${theme.text} focus:outline-none focus:ring-2 focus:ring-purple-600 pr-20`}
                          required
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                          <span className={theme.textSecondary}>
                            {TOKEN_SYMBOL}
                          </span>
                        </div>
                      </div>
                      <div className="flex justify-between mt-2">
                        <p className={`text-sm ${theme.textMuted}`}>
                          Min: {stakingInfo?.minStakeAmount} {TOKEN_SYMBOL}
                        </p>
                        <p className={`text-sm ${theme.textMuted}`}>
                          Balance:{" "}
                          {formatLargeNumber(
                            tokenBalances?.userFsxBlanace || 0
                          )}{" "}
                          {TOKEN_SYMBOL}
                        </p>
                      </div>
                    </div>

                    {/* Lock Period Selection */}
                    <div>
                      <label className={`block ${theme.textSecondary} mb-2`}>
                        Lock Period
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {LOCK_PERIODS.split(",").map((period) => (
                          <button
                            key={period}
                            type="button"
                            onClick={() => setLockPeriod(period)}
                            className={`py-3 px-4 rounded-lg transition-colors ${
                              lockPeriod === period
                                ? "bg-gradient-to-r from-teal-400 to-indigo-500 text-white"
                                : `${theme.cardBg} ${theme.text}`
                            }`}
                          >
                            {period} Days
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Reward Calculation */}
                    <div className={`${theme.cardBg} rounded-lg p-4 space-y-3`}>
                      <div className="flex justify-between">
                        <span className={theme.textSecondary}>
                          Selected APY:
                        </span>
                        <span className={`${theme.text} font-medium`}>
                          {calculateApy(lockPeriod)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className={theme.textSecondary}>
                          Lock Duration:
                        </span>
                        <span className={`${theme.text} font-medium`}>
                          {lockPeriod} Days
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className={theme.textSecondary}>
                          Est. Reward:
                        </span>
                        <span className={`${theme.text} font-medium`}>
                          {calculatedReward} {TOKEN_SYMBOL}
                        </span>
                      </div>
                    </div>

                    {/* Stake Button */}
                    <button
                      type="submit"
                      disabled={
                        isLoading ||
                        !stakeAmount ||
                        parseFloat(stakeAmount) <
                          parseFloat(stakingInfo?.minStakeAmount) ||
                        parseFloat(stakeAmount) >
                          parseFloat(tokenBalances?.userFsxBlanace || 0)
                      }
                      className={`w-full ${
                        isLoading ||
                        !stakeAmount ||
                        parseFloat(stakeAmount) <
                          parseFloat(stakingInfo?.minStakeAmount) ||
                        parseFloat(stakeAmount) >
                          parseFloat(tokenBalances?.userFsxBlanace || 0)
                          ? isDarkMode
                            ? "bg-gray-700 cursor-not-allowed"
                            : "bg-gray-300 cursor-not-allowed text-gray-500"
                          : "bg-gradient-to-r from-teal-400 to-indigo-500 hover:from-teal-500 hover:to-indigo-600"
                      } text-white font-medium py-4 rounded-lg transition-colors`}
                    >
                      {isLoading ? "Processing..." : `Stake ${TOKEN_SYMBOL}`}
                    </button>
                  </form>
                ) : (
                  <div>
                    {/* Your Stakes Table */}
                    {userStakes && userStakes.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr
                              className={`border-b ${theme.border} text-left ${theme.textSecondary}`}
                            >
                              <th className="py-3 px-4">Staked Amount</th>
                              <th className="py-3 px-4">APY</th>
                              <th className="py-3 px-4">Lock Period</th>
                              <th className="py-3 px-4">Rewards</th>
                              <th className="py-3 px-4">Status</th>
                              <th className="py-3 px-4">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {userStakes.map((stake, index) => (
                              <tr
                                key={index}
                                className={`border-b ${theme.border} ${
                                  isDarkMode ? "text-gray-300" : "text-gray-700"
                                }`}
                              >
                                <td className="py-3 px-4">
                                  {formatLargeNumber(stake.amount)}{" "}
                                  {TOKEN_SYMBOL}
                                </td>
                                <td className="py-3 px-4">
                                  {calculateApy(stake.lockPeriod)}%
                                </td>
                                <td className="py-3 px-4">
                                  {stake.lockPeriod} Days
                                </td>
                                <td className="py-3 px-4">
                                  {formatLargeNumber(stake.pendingRewards)}{" "}
                                  {TOKEN_SYMBOL}
                                </td>
                                <td className="py-3 px-4">
                                  <span
                                    className={`px-2 py-1 rounded-full text-xs ${
                                      calculateTimeRemaining(
                                        stake.startTime,
                                        stake.lockPeriod
                                      ) === "Unlocked"
                                        ? isDarkMode
                                          ? "bg-green-900 text-green-400"
                                          : "bg-green-100 text-green-600"
                                        : isDarkMode
                                        ? "bg-orange-900 text-orange-400"
                                        : "bg-orange-100 text-orange-600"
                                    }`}
                                  >
                                    {calculateTimeRemaining(
                                      stake.startTime,
                                      stake.lockPeriod
                                    )}
                                  </span>
                                </td>
                                <td className="py-3 px-4">
                                  <div className="flex space-x-2">
                                    <button
                                      onClick={() => handleHarvest(stake.id)}
                                      disabled={
                                        harvestLoading && unstakeId === stake.id
                                      }
                                      className={`px-2 py-1 rounded text-xs ${
                                        parseFloat(stake.pendingRewards) > 0
                                          ? "bg-gradient-to-r from-teal-400 to-indigo-500 text-white"
                                          : isDarkMode
                                          ? "bg-gray-700 text-gray-500"
                                          : "bg-gray-200 text-gray-500"
                                      }`}
                                    >
                                      {harvestLoading && unstakeId === stake.id
                                        ? "..."
                                        : "Harvest"}
                                    </button>
                                    {/* Early unstake button - shown only if locked */}
                                    {calculateTimeRemaining(
                                      stake.startTime,
                                      stake.lockPeriod
                                    ) !== "Unlocked" && (
                                      <button
                                        onClick={() =>
                                          handleEarlyUnstake(stake.id)
                                        }
                                        disabled={
                                          unstakeLoading &&
                                          unstakeId === stake.id
                                        }
                                        className="px-2 py-1 rounded text-xs bg-gradient-to-r from-red-400 to-pink-500 text-white"
                                        title="Unstake early with 5% penalty"
                                      >
                                        {unstakeLoading &&
                                        unstakeId === stake.id
                                          ? "..."
                                          : "Unstake Early (5% Penalty)"}
                                      </button>
                                    )}
                                    {/* Regular unstake button - shown only if unlocked */}
                                    {calculateTimeRemaining(
                                      stake.startTime,
                                      stake.lockPeriod
                                    ) === "Unlocked" && (
                                      <button
                                        onClick={() => handleUnstake(stake.id)}
                                        disabled={
                                          unstakeLoading &&
                                          unstakeId === stake.id
                                        }
                                        className="px-2 py-1 rounded text-xs bg-gradient-to-r from-teal-400 to-indigo-500 text-white"
                                      >
                                        {unstakeLoading &&
                                        unstakeId === stake.id
                                          ? "..."
                                          : "Unstake"}
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className={theme.textSecondary}>
                          You don't have any active stakes. Start staking to
                          earn rewards!
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Information Notice */}
                <div
                  className={`mt-8 p-4 ${theme.cardBg} rounded-lg flex gap-3`}
                >
                  <FaInfoCircle className="text-blue-400 flex-shrink-0 mt-1" />
                  <p className={`text-sm ${theme.textSecondary}`}>
                    Staked tokens are locked for the selected period and cannot
                    be withdrawn early. Rewards can be harvested at any time.
                    After the lock period ends, you can unstake your tokens or
                    keep them staked to continue earning rewards at the base APY
                    rate.
                  </p>
                </div>
              </div>
            </div>

            {/* Global Staking Stats */}
            <div
              className={`mt-6 ${theme.bg} rounded-xl overflow-hidden shadow-lg`}
            >
              <div className={`p-6 border-b ${theme.border}`}>
                <h2
                  className={`text-xl font-bold ${theme.text} flex items-center`}
                >
                  <FaChartLine className="mr-2 text-[#DE3657]" />
                  Global Staking Analytics
                </h2>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className={`${theme.cardBg} rounded-lg p-4 text-center`}>
                    <p className={theme.textSecondary}>Total Value Locked</p>
                    <h3 className={`text-2xl font-bold ${theme.text}`}>
                      {formatLargeNumber(stakingInfo?.totalStaked || 0)}{" "}
                      {TOKEN_SYMBOL}
                    </h3>
                    <p className="text-sm text-[#DE3657]">
                      $
                      {formatLargeNumber(
                        (stakingInfo?.totalStaked || 0) *
                          (PER_TOKEN_USD_PRICE || 0)
                      )}
                    </p>
                  </div>
                  <div className={`${theme.cardBg} rounded-lg p-4 text-center`}>
                    <p className={theme.textSecondary}>Total Stakers</p>
                    <h3 className={`text-2xl font-bold ${theme.text}`}>
                      {formatLargeNumber(stakingInfo?.totalStakers || 0)}
                    </h3>
                    <p className="text-sm text-[#DE3657]">
                      Active Participants
                    </p>
                  </div>
                  <div className={`${theme.cardBg} rounded-lg p-4 text-center`}>
                    <p className={theme.textSecondary}>Rewards Distributed</p>
                    <h3 className={`text-2xl font-bold ${theme.text}`}>
                      {formatLargeNumber(
                        stakingInfo?.totalRewardsDistributed || 0
                      )}{" "}
                      {TOKEN_SYMBOL}
                    </h3>
                    <p className="text-sm text-[#DE3657]">Since Launch</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Staking;
