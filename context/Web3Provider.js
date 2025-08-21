import React, { createContext, useContext, useState, useEffect } from "react";
import { ethers, utils } from "ethers";
import { useAccount, useChainId, useConnect, useBalance } from "wagmi";

// INTERNAL IMPORT
import { useToast } from "./ToastContext";
import TOKEN_ICO_ABI from "../web3/artifacts/contracts/TokenICO.sol/TokenICO.json";
import { useEthersProvider, useEthersSigner } from "../provider/hooks";
import { config } from "../provider/wagmiConfigs";
import { handleTransactionError, erc20Abi, generateId } from "./Utility";
import { readProvider } from "../provider/readProvider";

const USDT_ADDRESS = process.env.NEXT_PUBLIC_USDT_ADDRESS;
const USDC_ADDRESS = process.env.NEXT_PUBLIC_USDC_ADDRESS;
const SAV_ADDRESS = process.env.NEXT_PUBLIC_SAV_ADDRESS;
const CURRENCY = process.env.NEXT_PUBLIC_CURRENCY;
const TOKEN_SYMBOL = process.env.NEXT_PUBLIC_TOKEN_SYMBOL;
const TOKEN_DECIMAL = process.env.NEXT_PUBLIC_TOKEN_DECIMAL;
const TOKEN_LOGO = process.env.NEXT_PUBLIC_TOKEN_LOGO;
const DOMAIN_URL = process.env.NEXT_PUBLIC_NEXT_DOMAIN_URL;
const TokenICOAbi = TOKEN_ICO_ABI.abi;

// Create context
const Web3Context = createContext(null);

// Constants
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_TOKEN_ICO_ADDRESS;

// Pre-instantiate a read-only contract using a fallback provider so view calls
// do not depend on the user's wallet RPC.
const readContract = new ethers.Contract(
  CONTRACT_ADDRESS,
  TokenICOAbi,
  readProvider
);

export const Web3Provider = ({ children }) => {
  // Get toast functions
  const { notify } = useToast();
  // Wagmi hooks v2
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { balance } = useBalance({ config });
  const { connect, connectors } = useConnect();
  const [reCall, setReCall] = useState(0);
  const [globalLoad, setGlobalLoad] = useState(false);

  // Custom ethers hooks
  const provider = useEthersProvider();

  const signer = useEthersSigner();
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState(null);

  const [isConnecting, setIsConnecting] = useState(false);

  // Referral state
  const [boundReferrer, setBoundReferrer] = useState(null);
  const [eligibility, setEligibility] = useState(null);

  // Fetch eligibility for connected wallet
  useEffect(() => {
    const fetchEligibility = async () => {
      if (!address) {
        setEligibility(null);

        return;
      }
      try {
        console.log("[web3] fetching eligibility for", address);
        const res = await fetch(`/api/eligibility?user=${address}`);

        if (res.ok) {
          const data = await res.json();
          console.log("[web3] eligibility result", data);
          setEligibility(data);
        } else {
          console.log("[web3] eligibility request failed", res.status);
          setEligibility(null);
        }
      } catch (err) {
        console.error("Eligibility fetch error:", err);
      }
    };
    fetchEligibility();
  }, [address]);

  const [contractInfo, setContractInfo] = useState({
    fsxAddress: null,
    fsxBalance: "0",
    currentUsdtPrice: "0",        // Current token price in USDT
    initialUsdtPrice: "0",        // Initial USDT price
    totalSold: "0",
    usdtAddress: null,
    usdcAddress: null,
    usdtPriceIncrement: "0",
    stablecoinDecimals: "6",
    ethAddress: null,
    btcAddress: null,
    solAddress: null,
    bnbTokenRatio: "0",
    ethTokenRatio: "0",
    btcTokenRatio: "0",
    solTokenRatio: "0",
  });

  const [tokenBalances, setTokenBalances] = useState({
    fsxSupply: "0",
    userFsxBlanace: "0",
    contractBnbBalance: null,
    userBNBBalance: null,
    userEthBalance: "0",
    userBTCBalance: "0",
    userSOLBalance: "0",
    fsxBalance: "0",
    usdtBalance: "0",
    usdcBalance: "0",
    userUSDCBalance: "0",
    userUSDTBalance: "0",
    userBalance: "0",
    userStaked: "0",
    pendingRewards: "0",
    totalPenalty: "0",
  });
  const [error, setError] = useState(null);

  const getVoucher = async () => {
    if (!address) throw new Error("Wallet not connected");
    console.log("[web3] requesting voucher for", address);
    const response = await fetch("/api/voucher", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user: address }),
    });
    if (!response.ok) {
      const err = await response.json();
      console.log("[web3] voucher request failed", err);
      throw new Error(err.error || "Voucher request failed");
    }
    const data = await response.json();
    console.log("[web3] received voucher", data);
    if (data?.boundReferrer && !boundReferrer) {
      setBoundReferrer(data.boundReferrer);
    }
    return data;
  };

  // Initialize contract with signer when available, otherwise fall back to RPC
  useEffect(() => {
    const initContract = () => {
      try {
        // Prefer signer for write calls but allow a read-only provider when
        // the user has not connected a wallet yet
        const library = signer || provider || readProvider;
        if (!library) return;

        const contractInstance = new ethers.Contract(
          CONTRACT_ADDRESS,
          TokenICOAbi,
          library
        );

        setContract(contractInstance);
      } catch (error) {
        console.error("Error initializing contract:", error);
        setError("Failed to initialize contract");
      }
    };

    initContract();
  }, [provider, signer]);

  // Modified useEffect
  useEffect(() => {
    const fetchContractInfo = async () => {
      setGlobalLoad(true);
      
      try {
        const readOnlyContract = readContract;
    
        // Fetch updated contract info with new structure
        const info = await readOnlyContract.getContractInfo();
        
        // Get individual token addresses and ratios
        const [
          ethAddr, btcAddr, solAddr, 
          bnbRatio, ethRatio, btcRatio, solRatio
        ] = await Promise.all([
          readOnlyContract.ethAddress(),
          readOnlyContract.btcAddress(),
          readOnlyContract.solAddress(),
          readOnlyContract.bnbRatio(),
          readOnlyContract.ethRatio(),
          readOnlyContract.btcRatio(),
          readOnlyContract.solRatio(),
        ]);
    
        const formatAmount = (amount, decimals, fixedDigits = 2) =>
          parseFloat(
            ethers.utils.formatUnits(amount.toString(), decimals)
          ).toFixed(fixedDigits);

        // Set contract info with new USDT-based structure
        setContractInfo({
          fsxAddress: info.tokenAddress,
          fsxBalance: formatAmount(info.tokenBalance, TOKEN_DECIMALS),
          currentUsdtPrice: formatAmount(info.currentUsdtPrice, 6, 6), // USDT has 6 decimals
          initialUsdtPrice: formatAmount(info.initialUsdtPrice, 6, 6),
          totalSold: formatAmount(info.totalSold, TOKEN_DECIMALS),
          usdtAddress: info.usdtAddr,
          usdcAddress: info.usdcAddr,
          usdtPriceIncrement: formatAmount(info.usdtPriceIncrementValue, 6, 6),
          stablecoinDecimals: info.stablecoinDecimalsValue.toString(),
          ethAddress: ethAddr,
          btcAddress: btcAddr,
          solAddress: solAddr,
          bnbRatio: formatAmount(bnbRatio, 18, 2),
          ethRatio: formatAmount(ethRatio, 18, 2),
          btcRatio: formatAmount(btcRatio, 18, 2),
          solRatio: formatAmount(solRatio, 18, 2),
        });
    
        setGlobalLoad(false);
      } catch (error) {
        console.error("Error fetching contract info:", error);
        setGlobalLoad(false);
      }
    };

    fetchContractInfo();
  }, [contract, address, provider, signer, reCall]);

  /// Contract interaction functions
  const buyWithBNB = async (bnbAmount) => {
    if (!contract || !address) {
      console.warn("[buyWithBNB] Missing contract or address", { contract: !!contract, address });
      return null;
    }
  
    // Start toast
    const toastId = notify.start(`Initializing buy With ${CURRENCY} transaction...`);
  
    // Basic metadata
    console.log("[buyWithBNB:init]", {
      chainId: (await signer.provider.getNetwork()).chainId,
      contract: contract.address,
      buyer: address,
      bnbAmount,
      whitelisted: !!eligibility?.whitelisted,
      boundReferrer,
      needsVoucherEachBuy: !!eligibility?.needsVoucherEachBuy,
    });
  
    // Parse amount
    let bnbValue;
    try {
      bnbValue = ethers.utils.parseEther(String(bnbAmount));
      console.log("[buyWithBNB] parsed bnbValue:", bnbValue.toString());
    } catch (e) {
      console.error("[buyWithBNB] parseEther failed:", e);
      notify.fail(toastId, "Invalid amount");
      return null;
    }
  
    try {
      // Voucher?
      let useVoucher =
        eligibility?.whitelisted &&
        (!boundReferrer || eligibility?.needsVoucherEachBuy);
  
      let voucher, signature;
      if (useVoucher) {
        console.log("[buyWithBNB] voucher requested…");
        try {
          const resp = await getVoucher();
          voucher = resp?.voucher;
          signature = resp?.signature;
          console.log("[buyWithBNB] voucher received:", {
            hasVoucher: !!voucher,
            hasSignature: !!signature,
            referrer: voucher?.referrer,
          });
          if (!voucher) useVoucher = false;
        } catch (e) {
          console.warn("[buyWithBNB] getVoucher failed, proceeding without voucher:", e);
          useVoucher = false;
        }
      } else {
        console.log("[buyWithBNB] no voucher path");
      }
  
      // Gas price (bump by +10%, never below 1 gwei on BSC testnet)
      const networkGas = await signer.getGasPrice();
      const min = ethers.utils.parseUnits("1", "gwei");
      let gasPrice = networkGas.lt(min) ? min : networkGas;
      gasPrice = gasPrice.mul(110).div(100);
      console.log("[buyWithBNB] gas prices:", {
        networkGas: networkGas.toString(),
        chosenGasPrice: gasPrice.toString(),
      });
  
      let tx, estimatedGas, gasLimit;
  
      if (useVoucher) {
        console.log("[buyWithBNB] estimating gas for buyWithBNB_Voucher…");
        try {
          estimatedGas = await contract.estimateGas.buyWithBNB_Voucher(
            voucher,
            signature,
            { value: bnbValue }
          );
        } catch (e) {
          console.error("[buyWithBNB] estimateGas (voucher) reverted:", e);
          notify.fail(toastId, "Gas estimation failed (voucher). Check voucher/referrer/eligibility.");
          return null;
        }
        gasLimit = estimatedGas.mul(120).div(100);
        console.log("[buyWithBNB] estimatedGas(voucher):", {
          estimated: estimatedGas.toString(),
          gasLimit: gasLimit.toString(),
        });
  
        console.log("[buyWithBNB] sending tx (voucher)...");
        tx = await contract.buyWithBNB_Voucher(voucher, signature, {
          value: bnbValue,
          gasPrice,
          gasLimit,
        });
  
        if (!boundReferrer && voucher?.referrer) {
          setBoundReferrer(voucher.referrer);
          console.log("[buyWithBNB] bound referrer set:", voucher.referrer);
        }
      } else {
        console.log("[buyWithBNB] estimating gas for buyWithBNB…");
        try {
          estimatedGas = await contract.estimateGas.buyWithBNB({ value: bnbValue });
        } catch (e) {
          console.error("[buyWithBNB] estimateGas (no voucher) reverted:", e);
          notify.fail(toastId, "Gas estimation failed. Are you allowed to buy? Min amount?");
          return null;
        }
        gasLimit = estimatedGas.mul(120).div(100);
        console.log("[buyWithBNB] estimatedGas:", {
          estimated: estimatedGas.toString(),
          gasLimit: gasLimit.toString(),
        });
  
        console.log("[buyWithBNB] sending tx (no voucher)...");
        tx = await contract.buyWithBNB({
          value: bnbValue,
          gasPrice,
          gasLimit,
        });
      }
  
      console.log("[buyWithBNB] tx sent:", tx.hash);
  
      // Wait for receipt (log if this is where it hangs)
      console.log("[buyWithBNB] awaiting confirmation…");
      let receipt;
      try {
        // Optional: add a timeout so your toast won't hang forever
        receipt = await Promise.race([
          tx.wait(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("tx.wait timeout after 90s")), 90_000)
          ),
        ]);
      } catch (e) {
        console.error("[buyWithBNB] tx.wait failed/timeout:", e);
        notify.fail(toastId, e.message || "Transaction confirmation timeout");
        return null;
      }
  
      console.log("[buyWithBNB] mined:", {
        txHash: receipt.transactionHash,
        status: receipt.status,
        blockNumber: receipt.blockNumber,
      });
  
      setReCall(reCall + 1);
      
      // Get the actual token amount received from the transaction events
      // You might want to parse the transaction receipt to get the exact amount
      notify.complete(toastId, `Successfully purchased with ${bnbAmount} ${CURRENCY}!`);
      return receipt;
  
    } catch (error) {
      console.error("[buyWithBNB] caught error:", error);
      const { message: errorMessage, code: errorCode } = handleTransactionError(
        error,
        "buying with BNB"
      );
  
      if (errorCode === "ACTION_REJECTED") {
        notify.reject(toastId, "Transaction rejected by user");
        return null;
      }
      notify.fail(toastId, `Transaction failed: ${errorMessage?.message || errorMessage || "Unknown error"}`);
      return null;
    }
  };

  
  const buyWithUSDT = async (usdtAmount) => {
  if (!contract || !address) return null;
  // Start a transaction toast notification
  const toastId = notify.start(`Initializing buy With USDT transaction...`);
  try {
    // Parse USDT amount (6 decimals)
    const parsedAmount = ethers.utils.parseUnits(usdtAmount, 6);
    let useVoucher =
      eligibility?.whitelisted &&
      (!boundReferrer || eligibility?.needsVoucherEachBuy);
    let voucher, signature;
    if (useVoucher) {
      const resp = await getVoucher();
      voucher = resp.voucher;
      signature = resp.signature;
      if (!voucher) {
        useVoucher = false;
      }
    }

    // Get USDT contract instance
    const usdtContract = new ethers.Contract(
      contractInfo.usdtAddress,
      [
        "function approve(address spender, uint256 amount) public returns (bool)",
        "function allowance(address owner, address spender) view returns (uint256)",
      ],
      signer
    );

    // Check current allowance
    const currentAllowance = await usdtContract.allowance(
      address,
      CONTRACT_ADDRESS
    );

    // Only approve if needed (saves gas on subsequent transactions)
    if (currentAllowance.lt(parsedAmount)) {
      console.log("Approving USDT spend...");

      // Get optimized gas parameters for approval
      const gasPrice = await signer.getGasPrice();
      const optimizedGasPrice = gasPrice.mul(85).div(100);

      // Approve exactly the amount needed or use max uint256 for unlimited approval
      // const maxUint256 = ethers.constants.MaxUint256; // Uncomment for unlimited approval
      const approveTx = await usdtContract.approve(
        CONTRACT_ADDRESS,
        parsedAmount, // Or maxUint256 for unlimited approval
        {
          gasPrice: optimizedGasPrice,
        }
      );

      // Wait for approval transaction to complete
      const approveReceipt = await approveTx.wait();
      console.log("USDT approval confirmed:", approveReceipt.transactionHash);

      // Update notification for successful approval
      notify.approve(toastId, "USDT spending approved!");
    } else {
      console.log("USDT already approved");
      notify.update(
        toastId,
        "info",
        "USDT already approved, proceeding with purchase..."
      );
    }

    // Get optimized gas parameters for purchase
    const gasPrice = await signer.getGasPrice();
    const optimizedGasPrice = gasPrice.mul(85).div(100);

    let estimatedGas;
    if (useVoucher) {
      estimatedGas = await contract.estimateGas.buyWithUSDT_Voucher(
        voucher,
        signature,
        parsedAmount
      );
    } else {
      estimatedGas = await contract.estimateGas.buyWithUSDT(parsedAmount);
    }
    const gasLimit = estimatedGas.mul(120).div(100); // Add 20% buffer

    // Execute the purchase with optimized gas
    let tx;
    if (useVoucher) {
      tx = await contract.buyWithUSDT_Voucher(
        voucher,
        signature,
        parsedAmount,
        {
          gasPrice: optimizedGasPrice,
          gasLimit: gasLimit,
        }
      );
    } else {
      tx = await contract.buyWithUSDT(parsedAmount, {
        gasPrice: optimizedGasPrice,
        gasLimit: gasLimit,
      });
    }

    const returnTransaction = await tx.wait();

    // Update notification for completed transaction
    notify.complete(
      toastId,
      `Successfully purchased with ${usdtAmount} USDT!`
    );
    setReCall(reCall + 1);
    if (useVoucher && !boundReferrer && voucher?.referrer) {
      setBoundReferrer(voucher.referrer);
    }
    return returnTransaction;
  } catch (error) {
    const { message: errorMessage, code: errorCode } = handleTransactionError(
      error,
      "buying with USDT"
    );
    console.log(errorMessage);

    // For user rejections, return null instead of throwing
    if (errorCode === "ACTION_REJECTED") {
      notify.reject(toastId, "Transaction rejected by user");
      return null;
    }

    // For other errors, show failure notification
    notify.fail(toastId, `Transaction failed: ${errorMessage.message}`);
  }
};


  const buyWithUSDC = async (usdcAmount) => {
    if (!contract || !address) return null;
    // Start a transaction toast notification
    const toastId = notify.start(`Initializing buy With USDC transaction...`);
    try {
      // Parse USDC amount (6 decimals)
      const parsedAmount = ethers.utils.parseUnits(usdcAmount, 6);
      let useVoucher =
        eligibility?.whitelisted &&
        (!boundReferrer || eligibility?.needsVoucherEachBuy);
      let voucher, signature;
      if (useVoucher) {
        const resp = await getVoucher();
        voucher = resp.voucher;
        signature = resp.signature;
        if (!voucher) {
          useVoucher = false;
        }
      }

      // Get USDC contract instance
      const usdcContract = new ethers.Contract(
        contractInfo.usdcAddress,
        [
          "function approve(address spender, uint256 amount) public returns (bool)",
          "function allowance(address owner, address spender) view returns (uint256)",
        ],
        signer
      );

      // Check current allowance
      const currentAllowance = await usdcContract.allowance(
        address,
        CONTRACT_ADDRESS
      );

      // Only approve if needed (saves gas on subsequent transactions)
      if (currentAllowance.lt(parsedAmount)) {
        console.log("Approving USDC spend...");

        // Get optimized gas parameters for approval
        const gasPrice = await signer.getGasPrice();
        const optimizedGasPrice = gasPrice.mul(85).div(100);

        const approveTx = await usdcContract.approve(
          CONTRACT_ADDRESS,
          parsedAmount,
          {
            gasPrice: optimizedGasPrice,
          }
        );

        // Wait for approval transaction to complete
        const approveReceipt = await approveTx.wait();
        console.log("USDC approval confirmed:", approveReceipt.transactionHash);
        // Update notification for successful approval
        notify.approve(toastId, "USDC spending approved!");
      } else {
        console.log("USDC already approved");
        // Update notification when no approval is needed
        notify.update(
          toastId,
          "info",
          "USDC already approved, proceeding with purchase..."
        );
      }

      // Get optimized gas parameters for purchase
      const gasPrice = await signer.getGasPrice();
      const optimizedGasPrice = gasPrice.mul(85).div(100);

      let estimatedGas;
      if (useVoucher) {
        estimatedGas = await contract.estimateGas.buyWithUSDC_Voucher(
          voucher,
          signature,
          parsedAmount
        );
      } else {
        estimatedGas = await contract.estimateGas.buyWithUSDC(parsedAmount);
      }
      const gasLimit = estimatedGas.mul(120).div(100); // Add 20% buffer

      // Execute the purchase with optimized gas
      let tx;
      if (useVoucher) {
        tx = await contract.buyWithUSDC_Voucher(
          voucher,
          signature,
          parsedAmount,
          {
            gasPrice: optimizedGasPrice,
            gasLimit: gasLimit,
          }
        );
      } else {
        tx = await contract.buyWithUSDC(parsedAmount, {
          gasPrice: optimizedGasPrice,
          gasLimit: gasLimit,
        });
      }
      const returnTransaction = await tx.wait();
      setReCall(reCall + 1);
      if (useVoucher && !boundReferrer && voucher?.referrer) {
        setBoundReferrer(voucher.referrer);
      }
      // Update notification for completed transaction
      notify.complete(
        toastId,
        `Successfully purchased with ${usdcAmount} USDC!`
      );
      return returnTransaction;
    } catch (error) {
      const { message: errorMessage, code: errorCode } = handleTransactionError(
        error,
        "buying with USDC"
      );

      // For user rejections, return null instead of throwing
      if (errorCode === "ACTION_REJECTED") {
        notify.reject(toastId, "Transaction rejected by user");
        return null;
      }

      console.log(errorMessage);

      // For other errors, show failure notification
      notify.fail(toastId, `Transaction failed: ${errorMessage.message}`);
    }
  };

  const buyWithETH = async (ethAmount) => {
    if (!contract || !address) return null;
    const toastId = notify.start(`Initializing buy With ETH transaction...`);
    try {
      const parsedAmount = ethers.utils.parseUnits(ethAmount, 18);
      let useVoucher =
        eligibility?.whitelisted &&
        (!boundReferrer || eligibility?.needsVoucherEachBuy);
      let voucher, signature;
      if (useVoucher) {
        const resp = await getVoucher();
        voucher = resp.voucher;
        signature = resp.signature;
        if (!voucher) {
          useVoucher = false;
        }
      }

      const ethContract = new ethers.Contract(
        contractInfo.ethAddress,
        [
          "function approve(address spender, uint256 amount) public returns (bool)",
          "function allowance(address owner, address spender) view returns (uint256)",
        ],
        signer
      );

      const currentAllowance = await ethContract.allowance(address, CONTRACT_ADDRESS);

      if (currentAllowance.lt(parsedAmount)) {
        const gasPrice = await signer.getGasPrice();
        const optimizedGasPrice = gasPrice.mul(85).div(100);

        const approveTx = await ethContract.approve(CONTRACT_ADDRESS, parsedAmount, {
          gasPrice: optimizedGasPrice,
        });
        await approveTx.wait();
        notify.approve(toastId, "ETH spending approved!");
      } else {
        notify.update(toastId, "info", "ETH already approved, proceeding with purchase...");
      }

      const gasPrice = await signer.getGasPrice();
      const optimizedGasPrice = gasPrice.mul(85).div(100);

      let estimatedGas;
      if (useVoucher) {
        estimatedGas = await contract.estimateGas.buyWithETH_Voucher(
          voucher,
          signature,
          parsedAmount
        );
      } else {
        estimatedGas = await contract.estimateGas.buyWithETH(parsedAmount);
      }
      const gasLimit = estimatedGas.mul(120).div(100);

      let tx;
      if (useVoucher) {
        tx = await contract.buyWithETH_Voucher(
          voucher,
          signature,
          parsedAmount,
          {
            gasPrice: optimizedGasPrice,
            gasLimit,
          }
        );
      } else {
        tx = await contract.buyWithETH(parsedAmount, {
          gasPrice: optimizedGasPrice,
          gasLimit,
        });
      }
      const returnTransaction = await tx.wait();
      setReCall(reCall + 1);
      if (useVoucher && !boundReferrer && voucher?.referrer) {
        setBoundReferrer(voucher.referrer);
      }
      notify.complete(toastId, `Successfully purchased with ${ethAmount} ETH!`);
      return returnTransaction;
    } catch (error) {
      const { message: errorMessage, code: errorCode } = handleTransactionError(
        error,
        "buying with ETH"
      );
      if (errorCode === "ACTION_REJECTED") {
        notify.reject(toastId, "Transaction rejected by user");
        return null;
      }

      notify.fail(toastId, `Transaction failed: ${errorMessage.message}`);
    }
  };

  const buyWithBTC = async (btcAmount) => {
    if (!contract || !address) return null;
    const toastId = notify.start(`Initializing buy With BTC transaction...`);
    try {
      const parsedAmount = ethers.utils.parseUnits(btcAmount, 8);
      let useVoucher =
        eligibility?.whitelisted &&
        (!boundReferrer || eligibility?.needsVoucherEachBuy);
      let voucher, signature;
      if (useVoucher) {
        const resp = await getVoucher();
        voucher = resp.voucher;
        signature = resp.signature;
        if (!voucher) {
          useVoucher = false;
        }
      }

      const btcContract = new ethers.Contract(
        contractInfo.btcAddress,
        [
          "function approve(address spender, uint256 amount) public returns (bool)",
          "function allowance(address owner, address spender) view returns (uint256)",
        ],
        signer
      );

      const currentAllowance = await btcContract.allowance(address, CONTRACT_ADDRESS);

      if (currentAllowance.lt(parsedAmount)) {
        const gasPrice = await signer.getGasPrice();
        const optimizedGasPrice = gasPrice.mul(85).div(100);

        const approveTx = await btcContract.approve(CONTRACT_ADDRESS, parsedAmount, {
          gasPrice: optimizedGasPrice,
        });
        await approveTx.wait();
        notify.approve(toastId, "BTC spending approved!");
      } else {
        notify.update(toastId, "info", "BTC already approved, proceeding with purchase...");
      }

      const gasPrice = await signer.getGasPrice();
      const optimizedGasPrice = gasPrice.mul(85).div(100);

      let estimatedGas;
      if (useVoucher) {
        estimatedGas = await contract.estimateGas.buyWithBTC_Voucher(
          voucher,
          signature,
          parsedAmount
        );
      } else {
        estimatedGas = await contract.estimateGas.buyWithBTC(parsedAmount);
      }
      const gasLimit = estimatedGas.mul(120).div(100);

      let tx;
      if (useVoucher) {
        tx = await contract.buyWithBTC_Voucher(
          voucher,
          signature,
          parsedAmount,
          {
            gasPrice: optimizedGasPrice,
            gasLimit,
          }
        );
      } else {
        tx = await contract.buyWithBTC(parsedAmount, {
          gasPrice: optimizedGasPrice,
          gasLimit,
        });
      }
      const returnTransaction = await tx.wait();
      setReCall(reCall + 1);
      if (useVoucher && !boundReferrer && voucher?.referrer) {
        setBoundReferrer(voucher.referrer);
      }
      notify.complete(toastId, `Successfully purchased with ${btcAmount} BTC!`);
      return returnTransaction;
    } catch (error) {
      const { message: errorMessage, code: errorCode } = handleTransactionError(
        error,
        "buying with BTC"
      );

      if (errorCode === "ACTION_REJECTED") {
        notify.reject(toastId, "Transaction rejected by user");
        return null;
      }

      notify.fail(toastId, `Transaction failed: ${errorMessage}`);
      return null;
    }
  };

  const buyWithSOL = async (solAmount) => {
    if (!contract || !address) return null;
    const toastId = notify.start(`Initializing buy With SOL transaction...`);
    try {
      const parsedAmount = ethers.utils.parseUnits(solAmount, 9);
      let useVoucher =
        eligibility?.whitelisted &&
        (!boundReferrer || eligibility?.needsVoucherEachBuy);
      let voucher, signature;
      if (useVoucher) {
        const resp = await getVoucher();
        voucher = resp.voucher;
        signature = resp.signature;
        if (!voucher) {
          useVoucher = false;
        }
      }

      const solContract = new ethers.Contract(
        contractInfo.solAddress,
        [
          "function approve(address spender, uint256 amount) public returns (bool)",
          "function allowance(address owner, address spender) view returns (uint256)",
        ],
        signer
      );

      const currentAllowance = await solContract.allowance(address, CONTRACT_ADDRESS);

      if (currentAllowance.lt(parsedAmount)) {
        const gasPrice = await signer.getGasPrice();
        const optimizedGasPrice = gasPrice.mul(85).div(100);

        const approveTx = await solContract.approve(CONTRACT_ADDRESS, parsedAmount, {
          gasPrice: optimizedGasPrice,
        });
        await approveTx.wait();
        notify.approve(toastId, "SOL spending approved!");
      } else {
        notify.update(toastId, "info", "SOL already approved, proceeding with purchase...");
      }

      const gasPrice = await signer.getGasPrice();
      const optimizedGasPrice = gasPrice.mul(85).div(100);

      let estimatedGas;
      if (useVoucher) {
        estimatedGas = await contract.estimateGas.buyWithSOL_Voucher(
          voucher,
          signature,
          parsedAmount
        );
      } else {
        estimatedGas = await contract.estimateGas.buyWithSOL(parsedAmount);
      }
      const gasLimit = estimatedGas.mul(120).div(100);

      let tx;
      if (useVoucher) {
        tx = await contract.buyWithSOL_Voucher(
          voucher,
          signature,
          parsedAmount,
          {
            gasPrice: optimizedGasPrice,
            gasLimit,
          }
        );
      } else {
        tx = await contract.buyWithSOL(parsedAmount, {
          gasPrice: optimizedGasPrice,
          gasLimit,
        });
      }
      const returnTransaction = await tx.wait();
      setReCall(reCall + 1);
      if (useVoucher && !boundReferrer && voucher?.referrer) {
        setBoundReferrer(voucher.referrer);
      }
      notify.complete(toastId, `Successfully purchased with ${solAmount} SOL!`);
      return returnTransaction;
    } catch (error) {
      const { message: errorMessage, code: errorCode } = handleTransactionError(
        error,
        "buying with SOL"
      );
      if (errorCode === "ACTION_REJECTED") {
        notify.reject(toastId, "Transaction rejected by user");
        return null;
      }

      notify.fail(toastId, `Transaction failed: ${errorMessage.message}`);
    }
  };
  
  // Admin functions

// KEEP SAME NAME - BUT NOW UPDATES USDT PRICE INSTEAD OF BNB
const updateTokenPrice = async (newPrice) => {
  if (!contract || !address) return null;
  const toastId = notify.start(`Updating token price...`);
  
  try {
    // Convert to 6 decimal USDT format (0.35 USDT = 350000)
    const parsedPrice = ethers.utils.parseUnits(newPrice, 6);
    
    const gasPrice = await signer.getGasPrice();
    const optimizedGasPrice = gasPrice.mul(85).div(100);
    
    const estimatedGas = await contract.estimateGas.updateInitialUsdtPrice(parsedPrice);
    const gasLimit = estimatedGas.mul(120).div(100);
    
    const tx = await contract.updateInitialUsdtPrice(parsedPrice, {
      gasPrice: optimizedGasPrice,
      gasLimit,
    });
    
    const returnTransaction = await tx.wait();
    setReCall(reCall + 1);
    
    notify.complete(toastId, `Successfully updated token price to ${newPrice} USDT!`);
    return returnTransaction;
  } catch (error) {
    const { message: errorMessage, code: errorCode } = handleTransactionError(
      error,
      "update token price"
    );
    
    if (errorCode === "ACTION_REJECTED") {
      notify.reject(toastId, "Transaction rejected by user");
      return null;
    }
    
    notify.fail(toastId, `Transaction failed: ${errorMessage.message}`);
    return null;
  }
};

// KEEP SAME NAME - BUT NOW UPDATES PRICE INCREMENT INSTEAD OF STABLECOIN PRICE
const updateStablecoinPrice = async (newIncrement) => {
  if (!contract || !address) return null;
  const toastId = notify.start(`Updating price increment...`);
  
  try {
    // Convert to 6 decimal USDT format (0.05 USDT = 50000)
    const parsedIncrement = ethers.utils.parseUnits(newIncrement, 6);
    
    const gasPrice = await signer.getGasPrice();
    const optimizedGasPrice = gasPrice.mul(85).div(100);
    
    const estimatedGas = await contract.estimateGas.updateUsdtPriceIncrement(parsedIncrement);
    const gasLimit = estimatedGas.mul(120).div(100);
    
    const tx = await contract.updateUsdtPriceIncrement(parsedIncrement, {
      gasPrice: optimizedGasPrice,
      gasLimit,
    });
    
    const returnTransaction = await tx.wait();
    setReCall(reCall + 1);
    
    notify.complete(toastId, `Successfully updated price increment to ${newIncrement} USDT!`);
    return returnTransaction;
  } catch (error) {
    const { message: errorMessage, code: errorCode } = handleTransactionError(
      error,
      "update price increment"
    );
    
    if (errorCode === "ACTION_REJECTED") {
      notify.reject(toastId, "Transaction rejected by user");
      return null;
    }
    
    notify.fail(toastId, `Transaction failed: ${errorMessage.message}`);
    return null;
  }
};

// KEEP SAME NAME - BUT NOW ONLY UPDATES ADDRESS (NO RATIO)
const updateUSDT = async (newAddress) => {
  if (!contract || !address) return null;
  const toastId = notify.start(`Updating USDT address...`);
  
  try {
    const gasPrice = await signer.getGasPrice();
    const optimizedGasPrice = gasPrice.mul(85).div(100);
    
    const estimatedGas = await contract.estimateGas.updateUSDT(newAddress);
    const gasLimit = estimatedGas.mul(120).div(100);
    
    const tx = await contract.updateUSDT(newAddress, {
      gasPrice: optimizedGasPrice,
      gasLimit,
    });
    
    const returnTransaction = await tx.wait();
    setReCall(reCall + 1);
    
    notify.complete(toastId, `Successfully updated USDT address!`);
    return returnTransaction;
  } catch (error) {
    const { message: errorMessage, code: errorCode } = handleTransactionError(
      error,
      "update USDT address"
    );
    
    if (errorCode === "ACTION_REJECTED") {
      notify.reject(toastId, "Transaction rejected by user");
      return null;
    }
    
    notify.fail(toastId, `Transaction failed: ${errorMessage.message}`);
    return null;
  }
};

// KEEP SAME NAME - BUT NOW ONLY UPDATES ADDRESS (NO RATIO)
const updateUSDC = async (newAddress) => {
  if (!contract || !address) return null;
  const toastId = notify.start(`Updating USDC address...`);
  
  try {
    const gasPrice = await signer.getGasPrice();
    const optimizedGasPrice = gasPrice.mul(85).div(100);
    
    const estimatedGas = await contract.estimateGas.updateUSDC(newAddress);
    const gasLimit = estimatedGas.mul(120).div(100);
    
    const tx = await contract.updateUSDC(newAddress, {
      gasPrice: optimizedGasPrice,
      gasLimit,
    });
    
    const returnTransaction = await tx.wait();
    setReCall(reCall + 1);
    
    notify.complete(toastId, `Successfully updated USDC address!`);
    return returnTransaction;
  } catch (error) {
    const { message: errorMessage, code: errorCode } = handleTransactionError(
      error,
      "update USDC address"
    );
    
    if (errorCode === "ACTION_REJECTED") {
      notify.reject(toastId, "Transaction rejected by user");
      return null;
    }
    
    notify.fail(toastId, `Transaction failed: ${errorMessage.message}`);
    return null;
  }
};

  // ADD NEW FUNCTIONS FOR RATIO UPDATES (KEEP SEPARATE)
const updateBNBRatio = async (bnbUsdtPrice) => {
  if (!contract || !address) return null;
  const toastId = notify.start(`Updating BNB ratio...`);
  
  try {
    const gasPrice = await signer.getGasPrice();
    const optimizedGasPrice = gasPrice.mul(85).div(100);
    
    const estimatedGas = await contract.estimateGas.updateBNBRatio(bnbUsdtPrice);
    const gasLimit = estimatedGas.mul(120).div(100);
    
    const tx = await contract.updateBNBRatio(bnbUsdtPrice, {
      gasPrice: optimizedGasPrice,
      gasLimit,
    });
    
    const returnTransaction = await tx.wait();
    setReCall(reCall + 1);
    
    notify.complete(toastId, `Successfully updated BNB ratio based on ${bnbUsdtPrice} USDT price!`);
    return returnTransaction;
  } catch (error) {
    const { message: errorMessage, code: errorCode } = handleTransactionError(
      error,
      "update BNB ratio"
    );
    
    if (errorCode === "ACTION_REJECTED") {
      notify.reject(toastId, "Transaction rejected by user");
      return null;
    }
    
    notify.fail(toastId, `Transaction failed: ${errorMessage.message}`);
    return null;
  }
};

// UPDATE ETH RATIO (BASED ON USDT PRICE)
const updateETHRatio = async (ethUsdtPrice) => {
  if (!contract || !address) return null;
  const toastId = notify.start(`Updating ETH ratio...`);
  
  try {
    // Convert string to number and validate
    const ethPrice = parseFloat(ethUsdtPrice);
    if (isNaN(ethPrice) || ethPrice <= 0) {
      notify.fail(toastId, "Invalid ETH price. Must be a positive number.");
      return null;
    }

    const gasPrice = await signer.getGasPrice();
    const optimizedGasPrice = gasPrice.mul(85).div(100);
    
    const estimatedGas = await contract.estimateGas.updateETH(
      contractInfo.ethAddress, 
      Math.round(ethPrice * 1e6) // Convert to 6 decimal USDT format
    );
    
    const gasLimit = estimatedGas.mul(120).div(100);
    
    const tx = await contract.updateETH(
      contractInfo.ethAddress, 
      Math.round(ethPrice * 1e6), // 2000 USDT = 2000000000
      {
        gasPrice: optimizedGasPrice,
        gasLimit,
      }
    );
    
    const returnTransaction = await tx.wait();
    setReCall(reCall + 1);
    
    notify.complete(toastId, `Successfully updated ETH ratio based on ${ethPrice} USDT price!`);
    return returnTransaction;
  } catch (error) {
    const { message: errorMessage, code: errorCode } = handleTransactionError(
      error,
      "update ETH ratio"
    );
    
    if (errorCode === "ACTION_REJECTED") {
      notify.reject(toastId, "Transaction rejected by user");
      return null;
    }
    
    notify.fail(toastId, `Transaction failed: ${errorMessage.message}`);
    return null;
  }
};

// UPDATE BTC RATIO (BASED ON USDT PRICE)
const updateBTCRatio = async (btcUsdtPrice) => {
  if (!contract || !address) return null;
  const toastId = notify.start(`Updating BTC ratio...`);
  
  try {
    // Convert string to number and validate
    const btcPrice = parseFloat(btcUsdtPrice);
    if (isNaN(btcPrice) || btcPrice <= 0) {
      notify.fail(toastId, "Invalid BTC price. Must be a positive number.");
      return null;
    }

    const gasPrice = await signer.getGasPrice();
    const optimizedGasPrice = gasPrice.mul(85).div(100);
    
    const estimatedGas = await contract.estimateGas.updateBTC(
      contractInfo.btcAddress, 
      Math.round(btcPrice * 1e6) // Convert to 6 decimal USDT format
    );
    
    const gasLimit = estimatedGas.mul(120).div(100);
    
    const tx = await contract.updateBTC(
      contractInfo.btcAddress, 
      Math.round(btcPrice * 1e6), // 50000 USDT = 50000000000
      {
        gasPrice: optimizedGasPrice,
        gasLimit,
      }
    );
    
    const returnTransaction = await tx.wait();
    setReCall(reCall + 1);
    
    notify.complete(toastId, `Successfully updated BTC ratio based on ${btcPrice} USDT price!`);
    return returnTransaction;
  } catch (error) {
    const { message: errorMessage, code: errorCode } = handleTransactionError(
      error,
      "update BTC ratio"
    );
    
    if (errorCode === "ACTION_REJECTED") {
      notify.reject(toastId, "Transaction rejected by user");
      return null;
    }
    
    notify.fail(toastId, `Transaction failed: ${errorMessage.message}`);
    return null;
  }
};

// UPDATE SOL RATIO (BASED ON USDT PRICE)
const updateSOLRatio = async (solUsdtPrice) => {
  if (!contract || !address) return null;
  const toastId = notify.start(`Updating SOL ratio...`);
  
  try {
    // Convert string to number and validate
    const solPrice = parseFloat(solUsdtPrice);
    if (isNaN(solPrice) || solPrice <= 0) {
      notify.fail(toastId, "Invalid SOL price. Must be a positive number.");
      return null;
    }

    const gasPrice = await signer.getGasPrice();
    const optimizedGasPrice = gasPrice.mul(85).div(100);
    
    const estimatedGas = await contract.estimateGas.updateSOL(
      contractInfo.solAddress, 
      Math.round(solPrice * 1e6) // Convert to 6 decimal USDT format
    );
    
    const gasLimit = estimatedGas.mul(120).div(100);
    
    const tx = await contract.updateSOL(
      contractInfo.solAddress, 
      Math.round(solPrice * 1e6), // 100 USDT = 100000000
      {
        gasPrice: optimizedGasPrice,
        gasLimit,
      }
    );
    
    const returnTransaction = await tx.wait();
    setReCall(reCall + 1);
    
    notify.complete(toastId, `Successfully updated SOL ratio based on ${solPrice} USDT price!`);
    return returnTransaction;
  } catch (error) {
    const { message: errorMessage, code: errorCode } = handleTransactionError(
      error,
      "update SOL ratio"
    );
    
    if (errorCode === "ACTION_REJECTED") {
      notify.reject(toastId, "Transaction rejected by user");
      return null;
    }
    
    notify.fail(toastId, `Transaction failed: ${errorMessage.message}`);
    return null;
  }
};

  const setSaleToken = async (tokenAddress) => {
    if (!contract || !address) return null;
    // Start a transaction toast notification
    const toastId = notify.start(`Initializing setSaleToken transaction...`);
    try {
      // Get optimized gas parameters
      const gasPrice = await signer.getGasPrice();
      const optimizedGasPrice = gasPrice.mul(85).div(100); // 85% of current gas price

      const estimatedGas = await contract.estimateGas.setSaleToken(
        tokenAddress
      );
      const gasLimit = estimatedGas.mul(120).div(100); // Add 20% buffer

      // Execute transaction with optimized gas parameters
      const tx = await contract.setSaleToken(tokenAddress, {
        gasPrice: optimizedGasPrice,
        gasLimit,
      });

      const returnTransaction = await tx.wait();
      setReCall(reCall + 1);
      notify.complete(toastId, `Successfully State updated`);
      return returnTransaction;
    } catch (error) {
      const { message: errorMessage, code: errorCode } = handleTransactionError(
        error,
        "set Sale Token"
      );
      console.log(errorMessage);

      // For user rejections, return null instead of throwing
      if (errorCode === "ACTION_REJECTED") {
        notify.reject(toastId, "Transaction rejected by user");
        return null;
      }

      console.log(errorMessage);

      // For other errors, show failure notification
      notify.fail(toastId, `Transaction failed: ${errorMessage.message}`);
    }
  };

  const setBlockStatus = async (blockAddress, isBlocked) => {
    if (!contract || !address) return null;
    // Start a transaction toast notification
    const toastId = notify.start(`Initializing setBlockStatus transaction...`);
    try {
      // Get optimized gas parameters
      const gasPrice = await signer.getGasPrice();
      const optimizedGasPrice = gasPrice.mul(85).div(100); // 85% of current gas price

      const estimatedGas = await contract.estimateGas.setBlockStatus(
        blockAddress,
        isBlocked
      );
      const gasLimit = estimatedGas.mul(120).div(100); // Add 20% buffer

      // Execute transaction with optimized gas parameters
      const tx = await contract.setBlockStatus(blockAddress, isBlocked, {
        gasPrice: optimizedGasPrice,
        gasLimit,
      });

      const returnTransaction = await tx.wait();
      setReCall(reCall + 1);
      notify.complete(toastId, `Successfully State updated`);
      return returnTransaction;
    } catch (error) {
      const { message: errorMessage, code: errorCode } = handleTransactionError(
        error,
        "set Block Status"
      );
      console.log(errorMessage);

      // For user rejections, return null instead of throwing
      if (errorCode === "ACTION_REJECTED") {
        notify.reject(toastId, "Transaction rejected by user");
        return null;
      }

      console.log(errorMessage);

      // For other errors, show failure notification
      notify.fail(toastId, `Transaction failed: ${errorMessage.message}`);
    }
  };

  const withdrawTokens = async (tokenAddress, amount) => {
    if (!contract || !address) return null;
    // Start a transaction toast notification
    const toastId = notify.start(`Initializing withdrawTokens transaction...`);
    try {
      // Get optimized gas parameters
      const gasPrice = await signer.getGasPrice();
      const optimizedGasPrice = gasPrice.mul(85).div(100); // 85% of current gas price

      const estimatedGas = await contract.estimateGas.withdrawTokens(
        tokenAddress,
        amount
      );
      const gasLimit = estimatedGas.mul(120).div(100); // Add 20% buffer

      // Execute transaction with optimized gas parameters
      const tx = await contract.withdrawTokens(tokenAddress, amount, {
        gasPrice: optimizedGasPrice,
        gasLimit,
      });

      const returnTransaction = await tx.wait();
      notify.complete(toastId, `Successfully State updated`);
      setReCall(reCall + 1);

      return returnTransaction;
    } catch (error) {
      const { message: errorMessage, code: errorCode } = handleTransactionError(
        error,
        "withdraw Tokens"
      );
      // For user rejections, return null instead of throwing
      if (errorCode === "ACTION_REJECTED") {
        notify.reject(toastId, "Transaction rejected by user");
        return null;
      }

      console.log(errorMessage);

      // For other errors, show failure notification
      notify.fail(toastId, `Transaction failed: ${errorMessage.message}`);
    }
  };

  const getUserTransactions = async (account) => {
    if (!contract) return [];

    try {
      // Use the provided address or fall back to the connected account

      if (!account) return [];
      console.log(contract);
      const transactions = await contract.getUserTransactions(account);
      console.log(transactions);
      // Token name mapping
      const tokenNames = {
        [USDC_ADDRESS]: "USDC",
        [USDT_ADDRESS]: "USDT",
        default: "ETH",
      };

      // Process all transactions
      return transactions.map((tx) => {
        // Determine token types
        const tokenInName = tokenNames[tx.tokenIn] || tokenNames.default;
        const tokenOutName = tokenNames[tx.tokenOut] || tokenNames.default;

        // Determine decimals based on token address
        const decimalsIn =
          tx.tokenIn === USDC_ADDRESS || tx.tokenIn === USDT_ADDRESS ? 6 : 18;
        const decimalsOut =
          tx.tokenOut === USDC_ADDRESS || tx.tokenOut === USDT_ADDRESS ? 6 : 18;

        // Format the raw value first without rounding
        const rawAmountIn = ethers.utils.formatUnits(
          tx.amountIn.toString(),
          decimalsIn
        );
        const rawAmountOut = ethers.utils.formatUnits(
          tx.amountOut.toString(),
          decimalsOut
        );

        // Format input amount with appropriate precision
        let amountIn;
        if (
          (tokenInName === "USDC" || tokenInName === "USDT") &&
          parseFloat(rawAmountIn) < 0.01 &&
          parseFloat(rawAmountIn) > 0
        ) {
          // For very small stablecoin values, show the meaningful digits
          // Convert 0.000002 to 2.00 by multiplying by 1,000,000 (10^6)
          const value = parseFloat(rawAmountIn) * 1000000;
          amountIn = value.toFixed(2);
        } else {
          // For normal values, show 2 decimal places
          amountIn = parseFloat(rawAmountIn).toFixed(2);
        }

        // Format output amount
        let amountOut;
        if (tokenOutName === TOKEN_SYMBOL) {
          // Handle SAV token with appropriate decimals
          amountOut = parseFloat(
            ethers.utils.formatUnits(tx.amountOut.toString(), 18)
          ).toFixed(2);
        } else {
          amountOut = parseFloat(rawAmountOut).toFixed(2);
        }

        return {
          timestamp: new Date(tx.timestamp.toNumber() * 1000),
          user: tx.user,
          tokenIn: tokenInName,
          tokenOut: tokenOutName,
          amountIn: amountIn,
          amountOut: amountOut,
          transactionType: tx.transactionType,
        };
      });
    } catch (error) {
      const errorMessage = handleTransactionError(error, "withdraw Tokens");
      console.log(errorMessage);

      return []; // Return empty array instead of throwing error for better UX
    }
  };

  const getAllTransactions = async () => {
    if (!contract) return [];

    try {
      const transactions = await contract.getAllTransactions();

      // Token name mapping
      const tokenNames = {
        [USDC_ADDRESS]: "USDC",
        [USDT_ADDRESS]: "USDT",
        default: "ETH",
      };

      // Process all transactions
      return transactions.map((tx) => {
        // Determine token types
        const tokenInName = tokenNames[tx.tokenIn] || tokenNames.default;
        const tokenOutName = tokenNames[tx.tokenOut] || tokenNames.default;

        // Determine decimals based on token address
        const decimalsIn =
          tx.tokenIn === USDC_ADDRESS || tx.tokenIn === USDT_ADDRESS ? 6 : 18;
        const decimalsOut =
          tx.tokenOut === USDC_ADDRESS || tx.tokenOut === USDT_ADDRESS ? 6 : 18;

        // Format the raw value first without rounding
        const rawAmountIn = ethers.utils.formatUnits(
          tx.amountIn.toString(),
          decimalsIn
        );
        const rawAmountOut = ethers.utils.formatUnits(
          tx.amountOut.toString(),
          decimalsOut
        );

        // Format input amount with appropriate precision
        let amountIn;
        if (
          (tokenInName === "USDC" || tokenInName === "USDT") &&
          parseFloat(rawAmountIn) < 0.01 &&
          parseFloat(rawAmountIn) > 0
        ) {
          // For very small stablecoin values, show the meaningful digits
          // Convert 0.000002 to 2.00 by multiplying by 1,000,000 (10^6)
          const value = parseFloat(rawAmountIn) * 1000000;
          amountIn = value.toFixed(2);
        } else {
          // For normal values, show 2 decimal places
          amountIn = parseFloat(rawAmountIn).toFixed(2);
        }

        // Format output amount
        let amountOut;
        if (tokenOutName === TOKEN_SYMBOL) {
          // Handle SAV token with appropriate decimals
          amountOut = parseFloat(
            ethers.utils.formatUnits(tx.amountOut.toString(), 18)
          ).toFixed(2);
        } else {
          amountOut = parseFloat(rawAmountOut).toFixed(2);
        }

        return {
          timestamp: new Date(tx.timestamp.toNumber() * 1000),
          user: tx.user,
          tokenIn: tokenInName,
          tokenOut: tokenOutName,
          tokenInAddress: tx.tokenIn,
          tokenOutAddress: tx.tokenOut,
          amountIn: amountIn,
          amountOut: amountOut,
          transactionType: tx.transactionType,
        };
      });
    } catch (error) {
      const errorMessage = handleTransactionError(error, "withdraw Tokens");
      console.log(errorMessage);
      // console.log(error);
      return []; // Return empty array instead of throwing error for better UX
    }
  };

  const formatAddress = (address) => {
    if (!address) return "";
    return `${address.substring(0, 6)}...${address.substring(
      address.length - 4
    )}`;
  };

  const formatTokenAmount = (amount, decimals = 18) => {
    if (!amount) return "0";
    return ethers.utils.formatUnits(amount, decimals);
  };

  // Refresh contract data
  const refreshContractData = async () => {
    if (!contract) return;
    try {
      const info = await getContractInfo();
      if (info) setContractInfo(info);
      const balances = await getTokenBalances();
      if (balances) setTokenBalances(balances);
    } catch (error) {
      const errorMessage = handleTransactionError(error, "refresh contract data");
      console.log(errorMessage);
      setError("Failed to fetch contract data");
    }
  };

  // Check if connected account is the owner
  const isOwner = async () => {
    if (!contract || !address) return false;

    try {
      const ownerAddress = await contract.owner();
      return ownerAddress.toLowerCase() === address.toLowerCase();
    } catch (error) {
      const errorMessage = handleTransactionError(error, "withdraw Tokens");
      console.log(errorMessage);
      // console.log(error);
      return false;
    }
  };

  const addtokenToMetaMask = async () => {
    // Start a transaction toast notification
    const toastId = notify.start(`Adding ${TOKEN_SYMBOL} Token to MetaMask`);
    try {
      const wasAdded = await window.ethereum.request({
        method: "wallet_watchAsset",
        params: {
          type: "ERC20",
          options: {
            address: SAV_ADDRESS,
            symbol: TOKEN_SYMBOL,
            decimals: TOKEN_DECIMAL,
            image: TOKEN_LOGO,
          },
        },
      });
      if (wasAdded) {
        notify.complete(toastId, `Successfully Token added `);
      } else {
        notify.complete(toastId, `Failed to add the token`);
      }
    } catch (error) {
      const { message: errorMessage, code: errorCode } = handleTransactionError(
        error,
        "withdraw Tokens"
      );
      // For other errors, show failure notification
      notify.fail(
        toastId,
        `Transaction failed: ${
          errorMessage.message == "undefined"
            ? "Not Supported"
            : errorMessage.message
        }`
      );
    }
  };

  //STAKING

  // Staking Functions
  const stakeTokens = async (amount, lockPeriod) => {
    if (!contract || !address) return null;

    // Start a transaction toast notification
    const toastId = notify.start(
      `Initializing staking of ${amount} ${TOKEN_SYMBOL} tokens...`
    );

    try {
      // Convert amount to wei (token has 18 decimals)
      const tokenAmount = ethers.utils.parseUnits(amount, 18);

      // First need to approve the contract to spend tokens
      const tokenContract = new ethers.Contract(
        SAV_ADDRESS,
        [
          "function approve(address spender, uint256 amount) public returns (bool)",
        ],
        signer
      );

      // Get gas prices for approval
      const gasPriceApproval = await signer.getGasPrice();
      const optimizedGasPriceApproval = gasPriceApproval.mul(85).div(100); // 85% of current gas price

      // Execute approval
      const approveTx = await tokenContract.approve(
        contract.address,
        tokenAmount,
        {
          gasPrice: optimizedGasPriceApproval,
        }
      );

      await approveTx.wait();

      notify.update(toastId, "Approval complete. Staking tokens...");

      // Get current gas price and estimate gas for staking
      const gasPrice = await signer.getGasPrice();
      const optimizedGasPrice = gasPrice.mul(85).div(100); // 85% of current gas price

      const estimatedGas = await contract.estimateGas.stakeTokens(
        tokenAmount,
        lockPeriod
      );

      const gasLimit = estimatedGas.mul(120).div(100); // Add 20% buffer

      // Execute staking
      const tx = await contract.stakeTokens(tokenAmount, lockPeriod, {
        gasPrice: optimizedGasPrice,
        gasLimit,
      });

      const returnTransaction = await tx.wait();
      setReCall(reCall + 1);

      // Update notification for completed transaction
      notify.complete(
        toastId,
        `Successfully staked ${amount} ${TOKEN_SYMBOL} for ${lockPeriod} days!`
      );

      return returnTransaction;
    } catch (error) {
      const { message: errorMessage, code: errorCode } = handleTransactionError(
        error,
        "staking tokens"
      );
      console.log(errorMessage);

      // For user rejections, return null instead of throwing
      if (errorCode === "ACTION_REJECTED") {
        notify.reject(toastId, "Transaction rejected by user");
        return null;
      }

      // For other errors, show failure notification
      notify.fail(toastId, `Transaction failed: ${errorMessage.message}`);
    }
  };

  const harvestRewards = async (stakeId) => {
    if (!contract || !address) return null;

    // Start a transaction toast notification
    const toastId = notify.start(
      `Initializing reward harvest for stake #${stakeId}...`
    );

    try {
      // Get current gas price and estimate gas
      const gasPrice = await signer.getGasPrice();
      const optimizedGasPrice = gasPrice.mul(85).div(100); // 85% of current gas price

      const estimatedGas = await contract.estimateGas.harvestRewards(stakeId);
      const gasLimit = estimatedGas.mul(120).div(100); // Add 20% buffer

      // Execute harvest
      const tx = await contract.harvestRewards(stakeId, {
        gasPrice: optimizedGasPrice,
        gasLimit,
      });

      const returnTransaction = await tx.wait();
      setReCall(reCall + 1);

      // Update notification for completed transaction
      notify.complete(
        toastId,
        `Successfully harvested rewards from stake #${stakeId}!`
      );

      return returnTransaction;
    } catch (error) {
      const { message: errorMessage, code: errorCode } = handleTransactionError(
        error,
        "harvesting rewards"
      );
      console.log(errorMessage);

      // For user rejections, return null instead of throwing
      if (errorCode === "ACTION_REJECTED") {
        notify.reject(toastId, "Transaction rejected by user");
        return null;
      }

      // For other errors, show failure notification
      notify.fail(toastId, `Transaction failed: ${errorMessage.message}`);
    }
  };

  const unstakeTokens = async (stakeId) => {
    if (!contract || !address) return null;

    // Start a transaction toast notification
    const toastId = notify.start(
      `Initializing unstake for stake #${stakeId}...`
    );

    try {
      // Get current gas price and estimate gas
      const gasPrice = await signer.getGasPrice();
      const optimizedGasPrice = gasPrice.mul(85).div(100); // 85% of current gas price

      const estimatedGas = await contract.estimateGas.unstakeTokens(stakeId);
      const gasLimit = estimatedGas.mul(120).div(100); // Add 20% buffer

      // Execute unstake
      const tx = await contract.unstakeTokens(stakeId, {
        gasPrice: optimizedGasPrice,
        gasLimit,
      });

      const returnTransaction = await tx.wait();
      setReCall(reCall + 1);

      // Update notification for completed transaction
      notify.complete(
        toastId,
        `Successfully unstaked tokens from stake #${stakeId}!`
      );

      return returnTransaction;
    } catch (error) {
      const { message: errorMessage, code: errorCode } = handleTransactionError(
        error,
        "unstaking tokens"
      );
      console.log(errorMessage);

      // For user rejections, return null instead of throwing
      if (errorCode === "ACTION_REJECTED") {
        notify.reject(toastId, "Transaction rejected by user");
        return null;
      }

      // For other errors, show failure notification
      notify.fail(toastId, `Transaction failed: ${errorMessage.message}`);
    }
  };

  // Function to handle early unstaking with penalty
  const unstakeEarly = async (stakeId) => {
    if (!contract || !address) return null;

    // Start a transaction toast notification
    const toastId = notify.start(
      `Initializing early unstake with 5% penalty...`
    );

    try {
      // Get current gas price and estimate gas
      const gasPrice = await signer.getGasPrice();
      const optimizedGasPrice = gasPrice.mul(85).div(100); // 85% of current gas price

      const estimatedGas = await contract.estimateGas.unstakeEarly(stakeId);
      const gasLimit = estimatedGas.mul(120).div(100); // Add 20% buffer

      // Execute unstake
      const tx = await contract.unstakeEarly(stakeId, {
        gasPrice: optimizedGasPrice,
        gasLimit,
      });

      const returnTransaction = await tx.wait();
      setReCall(reCall + 1);

      // Update notification for completed transaction
      notify.complete(toastId, `Successfully unstaked tokens with 5% penalty!`);

      return returnTransaction;
    } catch (error) {
      const { message: errorMessage, code: errorCode } = handleTransactionError(
        error,
        "early unstaking"
      );
      console.log(errorMessage);

      // For user rejections, return null instead of throwing
      if (errorCode === "ACTION_REJECTED") {
        notify.reject(toastId, "Transaction rejected by user");
        return null;
      }

      // For other errors, show failure notification
      notify.fail(toastId, `Transaction failed: ${errorMessage.message}`);
    }
  };

  const getUserStakes = async (userAddress) => {
    if (!contract || !userAddress) return [];

    try {
      // Get raw stakes data from contract
      const rawStakes = await contract.getUserStakes(userAddress);

      if (!rawStakes || rawStakes.length === 0) {
        return [];
      }

      // Process each stake to include all necessary information
      const processedStakes = [];

      for (let i = 0; i < rawStakes.length; i++) {
        if (rawStakes[i].active) {
          // Get basic stake info
          const stakeInfo = await contract.getStakeInfo(rawStakes[i].id);
          const stakeDetails = await contract.getStakeDetails(rawStakes[i].id);

          // Create a processed stake object
          const stake = {
            id: rawStakes[i].id.toString(),
            amount: ethers.utils.formatUnits(rawStakes[i].amount, 18),
            startTime: rawStakes[i].startTime.toString(),
            lockPeriod: rawStakes[i].lockPeriod.toString(),
            pendingRewards: ethers.utils.formatUnits(
              stakeDetails.pendingRewards,
              18
            ),
            active: rawStakes[i].active,
          };

          processedStakes.push(stake);
        }
      }

      return processedStakes;
    } catch (error) {
      console.error("Error fetching user stakes:", error);
      return [];
    }
  };

  // Add these functions to your Web3Provider.js file

  // Function to update the base APY rate
  const updateBaseAPY = async (newAPYPercentage) => {
    if (!contract || !address) return null;

    // Start a transaction toast notification
    const toastId = notify.start(
      `Updating base APY to ${newAPYPercentage}%...`
    );

    try {
      // Convert percentage to contract value (no decimals)
      const newAPY = parseInt(newAPYPercentage);

      // Validate APY
      if (newAPY <= 0) {
        notify.fail(toastId, "APY must be greater than 0");
        return null;
      }

      // Get current gas price and estimate gas
      const gasPrice = await signer.getGasPrice();
      const optimizedGasPrice = gasPrice.mul(85).div(100); // 85% of current gas price

      const estimatedGas = await contract.estimateGas.updateBaseAPY(newAPY);
      const gasLimit = estimatedGas.mul(120).div(100); // Add 20% buffer

      // Execute transaction
      const tx = await contract.updateBaseAPY(newAPY, {
        gasPrice: optimizedGasPrice,
        gasLimit,
      });

      const returnTransaction = await tx.wait();
      setReCall(reCall + 1);

      // Update notification for completed transaction
      notify.complete(toastId, `Successfully updated base APY to ${newAPY}%!`);

      return returnTransaction;
    } catch (error) {
      const { message: errorMessage, code: errorCode } = handleTransactionError(
        error,
        "updating APY"
      );
      console.log(errorMessage);

      // For user rejections, return null instead of throwing
      if (errorCode === "ACTION_REJECTED") {
        notify.reject(toastId, "Transaction rejected by user");
        return null;
      }

      // For other errors, show failure notification
      notify.fail(toastId, `Transaction failed: ${errorMessage}`);
      return null;
    }
  };

  // Function to update the minimum staking amount
  const updateMinStakeAmount = async (newMinAmount) => {
    if (!contract || !address) return null;

    // Start a transaction toast notification
    const toastId = notify.start(`Updating minimum stake amount...`);

    try {
      // Convert to correct format with 18 decimals
      const minAmountInWei = ethers.utils.parseUnits(newMinAmount, 18);

      // Get current gas price and estimate gas
      const gasPrice = await signer.getGasPrice();
      const optimizedGasPrice = gasPrice.mul(85).div(100); // 85% of current gas price

      const estimatedGas = await contract.estimateGas.updateMinStakeAmount(
        minAmountInWei
      );
      const gasLimit = estimatedGas.mul(120).div(100); // Add 20% buffer

      // Execute transaction
      const tx = await contract.updateMinStakeAmount(minAmountInWei, {
        gasPrice: optimizedGasPrice,
        gasLimit,
      });

      const returnTransaction = await tx.wait();
      setReCall(reCall + 1);

      // Update notification for completed transaction
      notify.complete(
        toastId,
        `Successfully updated minimum stake amount to ${newMinAmount} tokens!`
      );

      return returnTransaction;
    } catch (error) {
      const { message: errorMessage, code: errorCode } = handleTransactionError(
        error,
        "updating minimum stake amount"
      );
      console.log(errorMessage);

      // For user rejections, return null instead of throwing
      if (errorCode === "ACTION_REJECTED") {
        notify.reject(toastId, "Transaction rejected by user");
        return null;
      }

      // For other errors, show failure notification
      notify.fail(toastId, `Transaction failed: ${errorMessage}`);
      return null;
    }
  };

  const getContractInfo = async () => {
    if (!contract) return null;
  
    try {
      // Get basic contract info with new USDT-based structure
      const info = await contract.getContractInfo();
      const [ethAddr, btcAddr, solAddr, bnbRatio, ethRatio, btcRatio, solRatio] = await Promise.all([
        contract.ethAddress(),
        contract.btcAddress(),
        contract.solAddress(),
        contract.bnbRatio(),
        contract.ethRatio(),
        contract.btcRatio(),
        contract.solRatio(),
      ]);
  
      // Get staking specific information
      const stakingInfo = await contract.getStakingInfo();
  
      // Get user specific staking info if connected
      let userStakingInfo = null;
      if (address) {
        userStakingInfo = await contract.getUserStakingInfo(address);
      }
  
      // Return combined data with NEW USDT-BASED STRUCTURE
      return {
        // Updated contract info - USDT BASED
        saleToken: info.tokenAddress,
        fsxBalance: ethers.utils.formatUnits(info.tokenBalance, 18),
        currentUsdtPrice: ethers.utils.formatUnits(info.currentUsdtPrice, 6), // USDT has 6 decimals
        initialUsdtPrice: ethers.utils.formatUnits(info.initialUsdtPrice, 6),
        totalSold: ethers.utils.formatUnits(info.totalSold, 18),
        usdtAddress: info.usdtAddr,
        usdcAddress: info.usdcAddr,
        usdtPriceIncrement: ethers.utils.formatUnits(info.usdtPriceIncrementValue, 6),
        stablecoinDecimals: info.stablecoinDecimalsValue.toString(),
        ethAddress: ethAddr,
        btcAddress: btcAddr,
        solAddress: solAddr,
        bnbTokenRatio: ethers.utils.formatUnits(bnbRatio, 18), // Now formatted properly
        ethTokenRatio: ethers.utils.formatUnits(ethRatio, 18),
        btcTokenRatio: ethers.utils.formatUnits(btcRatio, 18),
        solTokenRatio: ethers.utils.formatUnits(solRatio, 18),
  
        // Staking info (unchanged)
        baseAPY: stakingInfo ? stakingInfo.baseApyRate.toString() : "12",
        minStakeAmount: stakingInfo
          ? ethers.utils.formatUnits(stakingInfo.minStakingAmount, 18)
          : "100",
        totalStaked: stakingInfo
          ? ethers.utils.formatUnits(stakingInfo.totalTokensStaked, 18)
          : "0",
        totalRewardsDistributed: stakingInfo
          ? ethers.utils.formatUnits(stakingInfo.totalRewardsPaid, 18)
          : "0",
        totalStakers: stakingInfo
          ? stakingInfo.numberOfStakers.toString()
          : "0",
  
        // User specific staking info (unchanged)
        userStaked: userStakingInfo
          ? ethers.utils.formatUnits(userStakingInfo.totalUserStaked, 18)
          : "0",
        pendingRewards: userStakingInfo
          ? ethers.utils.formatUnits(userStakingInfo.totalPendingRewards, 18)
          : "0",
        activeStakesCount: userStakingInfo
          ? userStakingInfo.activeStakesCount.toString()
          : "0",
      };
    } catch (error) {
      console.error("Error getting contract info:", error);
      return null;
    }
  };

  // Update getTokenBalances to include staking balances
  const getTokenBalances = async () => {
    if (!contract || !SAV_ADDRESS) return null;
  
    try {
      // Get token balances as you already do
      const balances = await contract.getTokenBalances();
  
      // Get user token balance
      const tokenContract = new ethers.Contract(
        SAV_ADDRESS,
        ["function balanceOf(address) view returns (uint256)"],
        provider
      );
  
      let userBalance = "0";
      let userStaked = "0";
      let pendingRewards = "0";
  
      if (address) {
        userBalance = await tokenContract.balanceOf(address);
  
        // Get staking specific information if user is connected
        const userStakingInfo = await contract.getUserStakingInfo(address);
        userStaked = userStakingInfo.totalUserStaked;
        pendingRewards = userStakingInfo.totalPendingRewards;
      }
  
      return {
        // Existing balances
        fsxBalance: ethers.utils.formatUnits(balances.tokenBalance, 18),
        
        // ✅ FIXED: USDT/USDC now use 6 decimal formatting
        usdtBalance: ethers.utils.formatUnits(balances.usdtBalance, 6), // USDT has 6 decimals
        usdcBalance: ethers.utils.formatUnits(balances.usdcBalance, 6), // USDC has 6 decimals
  
        // User balances
        userBalance: ethers.utils.formatUnits(userBalance, 18),
        userStaked: ethers.utils.formatUnits(userStaked, 18),
        pendingRewards: ethers.utils.formatUnits(pendingRewards, 18),
      };
    } catch (error) {
      console.error("Error getting token balances:", error);
      return null;
    }
  };

  // Helper: get current USDT price per token
  const getCurrentPrice = async (buyerAddress) => {
    if (!contract) return null;
    try {
      const price = await contract.getCurrentPrice(
        buyerAddress || ethers.constants.AddressZero
      );
      return ethers.utils.formatUnits(price, 6);
    } catch (error) {
      console.error("Error getting current price:", error);
      return null;
    }
  };

  // Helper: get price info (current, next, stage)
  const getPriceInfo = async (buyerAddress) => {
    if (!contract) return null;
    try {
      const [current, next, stage] = await contract.getPriceInfo(
        buyerAddress || ethers.constants.AddressZero
      );
      return {
        current: ethers.utils.formatUnits(current, 6),
        next: ethers.utils.formatUnits(next, 6),
        stage: stage.toString(),
      };
    } catch (error) {
      console.error("Error getting price info:", error);
      return null;
    }
  };

  //REFERAL

  // Function to register a referrer
  const registerReferrer = async (referrerAddress) => {
    if (!contract || !address) return null;

    // Basic validation before touching the chain
    if (!ethers.utils.isAddress(referrerAddress)) {
      throw new Error("Invalid referrer address");
    }
    if (address.toLowerCase() === referrerAddress.toLowerCase()) {
      throw new Error("Cannot refer yourself");
    }

    // Check if already registered
    const current = await readContract.getReferralInfo(address);
    if (current.referrer !== ethers.constants.AddressZero) {
      return "Already registered";
    }

    const toastId = notify.start(`Registering referrer...`);

    try {
      // Get current gas price and estimate gas
      const gasPrice = await signer.getGasPrice();
      const optimizedGasPrice = gasPrice.mul(85).div(100); // 85% of current gas price

      const estimatedGas = await contract.estimateGas.registerReferrer(
        referrerAddress
      );
      const gasLimit = estimatedGas.mul(120).div(100); // Add 20% buffer

      // Execute registration
      const tx = await contract.registerReferrer(referrerAddress, {
        gasPrice: optimizedGasPrice,
        gasLimit,
      });

      const returnTransaction = await tx.wait();
      setReCall(reCall + 1);

      // Update notification for completed transaction
      notify.complete(toastId, `Successfully registered referrer!`);

      return returnTransaction;
    } catch (error) {
      const { message: errorMessage, code: errorCode } = handleTransactionError(
        error,
        "registering referrer"
      );
      console.log(errorMessage);

      // For user rejections, return null instead of throwing
      if (errorCode === "ACTION_REJECTED") {
        notify.reject(toastId, "Transaction rejected by user");
        return null;
      }

      // For other errors, show failure notification
      notify.fail(toastId, `Transaction failed: ${errorMessage.message}`);
    }
  };

  // Function to get referral information
  const getReferralInfo = async (userAddress) => {
    try {
      const referralInfo = await readContract.getReferralInfo(
        userAddress || address
      );

      return {
        referrer: referralInfo.referrer,
        totalReferrals: referralInfo.totalReferrals.toString(),
        totalRewardsEarned: ethers.utils.formatUnits(
          referralInfo.totalRewardsEarned,
          18
        ),
        rewardPercentage: referralInfo.rewardPercentage.toNumber(),
      };
    } catch (error) {
      console.error("Error getting referral info:", error);
      return null;
    }
  };

  // Function to get user's referrals
  const getUserReferrals = async (userAddress) => {
    try {
      const referrals = await readContract.getUserReferrals(
        userAddress || address
      );
      return referrals;
    } catch (error) {
      console.error("Error getting user referrals:", error);
      return [];
    }
  };

  // Function to get referral transactions
  const getReferralTransactions = async (userAddress) => {
    try {
      // Get all user transactions
      const allTransactions = await readContract.getUserTransactions(
        userAddress || address
      );

      // Filter for referral transactions only
      const referralTxs = allTransactions.filter(
        (tx) => tx.transactionType === "REFERRAL"
      );

      // Format the transactions
      const formattedTxs = referralTxs.map((tx) => ({
        timestamp: tx.timestamp.toString(),
        referredUser: tx.user,
        purchaseAmount: ethers.utils.formatUnits(tx.amountIn, 18),
        rewardAmount: ethers.utils.formatUnits(tx.amountOut, 18),
      }));

      return formattedTxs;
    } catch (error) {
      console.error("Error getting referral transactions:", error);
      return [];
    }
  };

  // Function to generate a referral link
  const generateReferralLink = (userAddress) => {
    if (!userAddress) return "";

    // Base URL from environment variable or default to example
    const baseUrl = DOMAIN_URL;
    return `${baseUrl}?ref=${userAddress}`;
  };

  // Function to check if a referral code exists in the URL
  const checkReferralCode = () => {
    if (typeof window === "undefined") return null;

    console.log("Full URL:", window.location.href);

    // Parse URL to get referral code
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get("ref");

    console.log("Found referral code:", refCode);

    return refCode;
  };

  // Function to handle registration from URL referral code
  const handleReferralRegistration = async () => {
    if (!contract || !address) return;

    try {
      // Check if user already has a referrer
      const referralInfo = await getReferralInfo(address);

      if (
        referralInfo &&
        referralInfo.referrer !== "0x0000000000000000000000000000000000000000"
      ) {
        console.log("User already has a referrer");
        return;
      }

      // Check for referral code in URL
      const referrerAddress = await checkReferralCode();

      if (referrerAddress && ethers.utils.isAddress(referrerAddress)) {
        // Make sure user doesn't try to refer themselves
        if (referrerAddress.toLowerCase() === address.toLowerCase()) {
          console.log("Cannot refer yourself");
          return;
        }

        // Register the referrer
        await registerReferrer(referrerAddress);

        // Create notification
        notify.complete(
          "referral-detection",
          `Referral link detected and registered!`
        );
      }
    } catch (error) {
      console.error("Error handling referral registration:", error);
    }
  };

  const value = {
    provider,
    signer,
    contract,
    account: address,
    chainId,
    isConnected: !!address && !!contract,
    isConnecting,
    contractInfo,
    tokenBalances,
    error,
    reCall,
    globalLoad,
    boundReferrer,
    eligibility,
    buyWithBNB,
    buyWithUSDT,
    buyWithUSDC,
    buyWithETH,
    buyWithBTC,
    buyWithSOL,
    updateStablecoinPrice,
    updateTokenPrice,
    updateUSDT,
    updateUSDC,
    updateBNBRatio,
    updateETHRatio,
    updateBTCRatio,
    updateSOLRatio,
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
    addtokenToMetaMask,
    stakeTokens,
    unstakeTokens,
    harvestRewards,
    getUserStakes,
    getContractInfo,
    getTokenBalances,
    getCurrentPrice,
    getPriceInfo,
    updateBaseAPY,
    updateMinStakeAmount,
    unstakeEarly,
    // New referral functions
    registerReferrer,
    getReferralInfo,
    getUserReferrals,
    getReferralTransactions,
    generateReferralLink,
    checkReferralCode,
    handleReferralRegistration,
  };

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
};

// Create hook for easy access to context
export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error("useWeb3 must be used within a Web3Provider");
  }
  return context;
};

export default Web3Context;
