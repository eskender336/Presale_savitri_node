import React, { createContext, useContext, useState, useEffect } from "react";
import { ethers, utils } from "ethers";
import { useAccount, useChainId, useConnect, useBalance } from "wagmi";

// INTERNAL IMPORT
import { useToast } from "./ToastContext";
import TOKEN_ICO_ABI from "../web3/artifacts/contracts/TokenICO.sol/TokenICO.json";
import { useEthersProvider, useEthersSigner } from "../provider/hooks";
import { config } from "../provider/wagmiConfigs";
import { handleTransactionError, erc20Abi, generateId } from "./Utility";

const USDT_ADDRESS = process.env.NEXT_PUBLIC_USDT_ADDRESS;
const USDC_ADDRESS = process.env.NEXT_PUBLIC_USDC_ADDRESS;
const FSX_ADDRESS = process.env.NEXT_PUBLIC_FSX_ADDRESS;
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
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL;
console.log('NEXT_PUBLIC_RPC_URL =', process.env.NEXT_PUBLIC_RPC_URL);

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
  const fallbackProvider = new ethers.providers.JsonRpcProvider(RPC_URL);
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
    bnbPrice: "0",
    stablecoinPrice: "0",
    totalSold: "0",
    usdtAddress: null,
    usdcAddress: null,
    usdtTokenRatio: "0",
    usdcTokenRatio: "0",
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
    bnbPrice: "0",
    stablecoinPrice: "0",
    usdtBalance: "0",
    usdcBalance: "0",
    userUSDCBalance: "0",
    userUSDTBalance: "0",
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
        const library = signer || provider || fallbackProvider;
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
      
        // Constants
        const TOKEN_DECIMALS = 18;
        const STABLE_DECIMALS = 6; // Both USDT and USDC use 6 decimals

        // Use connected wallet or fallback provider
        const currentProvider = provider || fallbackProvider;

        console.log("CURRENT PROVIDER", currentProvider)
        const currentSigner = signer || fallbackProvider;

        // Ensure the provider is connected to a network
        try {
          await currentProvider.getNetwork();
          console.log("CURRENT PROVIDER", currentProvider)
        } catch (networkError) {
          console.error("could not detect network", networkError);
          setError("Could not detect network");
          setGlobalLoad(false);
          return;
        }
        
        // Verify the contract exists on the current network
        const code = await currentProvider.getCode(CONTRACT_ADDRESS);
        if (code === "0x") {
          console.error("No contract deployed at", CONTRACT_ADDRESS);
          setError("Contract not found on current network");
          setGlobalLoad(false);
          return;
        }

        // Create read-only contract instances
        const readOnlyContract = new ethers.Contract(
          CONTRACT_ADDRESS,
          TokenICOAbi, // Make sure you have your contract ABI defined
          currentProvider
        );


        const readOnlyUsdtContract = new ethers.Contract(
          USDT_ADDRESS,
          erc20Abi,
          currentProvider
        );

        const readOnlyUsdcContract = new ethers.Contract(
          USDC_ADDRESS,
          erc20Abi,
          currentProvider
        );

        // Fetch basic contract info
        const info = await readOnlyContract.getContractInfo();
        const ethAddr = await readOnlyContract.ethAddress();
        const btcAddr = await readOnlyContract.btcAddress();
        const solAddr = await readOnlyContract.solAddress();
        const bnbRatio = await readOnlyContract.bnbRatio();
        const ethRatio = await readOnlyContract.ethRatio();
        const btcRatio = await readOnlyContract.btcRatio();
        const solRatio = await readOnlyContract.solRatio();


        // Create token contract after we have the address from info
        const tokenContract = new ethers.Contract(
          info.tokenAddress,
          erc20Abi,
          currentProvider
        );
        const ethContract = new ethers.Contract(ethAddr, erc20Abi, currentProvider);
        const btcContract = new ethers.Contract(btcAddr, erc20Abi, currentProvider);
        const solContract = new ethers.Contract(solAddr, erc20Abi, currentProvider);

        // Fetch contract-wide data that doesn't require wallet connection
        const [rawSupply, balances, contractBalanceWei, totalPenaltyCollected] =
          await Promise.all([
            tokenContract.totalSupply(),
            readOnlyContract.getTokenBalances(),
            currentProvider.getBalance(CONTRACT_ADDRESS),
            readOnlyContract.getTotalPenaltyCollected(),
          ]);

        // Data that requires a wallet connection
        let userFsxBalance = ethers.BigNumber.from(0);
        let balanceWei = ethers.BigNumber.from(0);
        let usdtBalanceMy = ethers.BigNumber.from(0);
        let usdcBalanceMy = ethers.BigNumber.from(0);
        let ethBalanceMy = ethers.BigNumber.from(0);
        let btcBalanceMy = ethers.BigNumber.from(0);
        let solBalanceMy = ethers.BigNumber.from(0);

        // Only try to fetch user-specific data if wallet is connected
        if (address) {
          [
            userFsxBalance,
            balanceWei,
            usdtBalanceMy,
            usdcBalanceMy,
            ethBalanceMy,
            btcBalanceMy,
            solBalanceMy,
          ] = await Promise.all([
            tokenContract.balanceOf(address),
            currentProvider.getBalance(address),
            readOnlyUsdtContract.balanceOf(address),
            readOnlyUsdcContract.balanceOf(address),
            ethContract.balanceOf(address),
            btcContract.balanceOf(address),
            solContract.balanceOf(address),
          ]);
        }

        
        // Helper function to format units and fix decimals
        const formatAmount = (amount, decimals, fixedDigits = 2) =>
          parseFloat(
            ethers.utils.formatUnits(amount.toString(), decimals)
          ).toFixed(fixedDigits);

        // Set contract info
        setContractInfo({
          fsxAddress: info.tokenAddress,
          fsxBalance: formatAmount(info.tokenBalance, TOKEN_DECIMALS),
          bnbPrice: formatAmount(info.bnbPrice, TOKEN_DECIMALS, 6),
          stablecoinPrice: formatAmount(
            info.stablecoinPrice,
            TOKEN_DECIMALS,
            6
          ),
          totalSold: formatAmount(info.totalSold, TOKEN_DECIMALS),
          usdtAddress: info.usdtAddr,
          usdcAddress: info.usdcAddr,
          usdtTokenRatio: info.usdtTokenRatio.toString(),
          usdcTokenRatio: info.usdcTokenRatio.toString(),
          ethAddress: ethAddr,
          btcAddress: btcAddr,
          solAddress: solAddr,
          bnbTokenRatio: bnbRatio.toString(),
          ethTokenRatio: ethRatio.toString(),
          btcTokenRatio: btcRatio.toString(),
          solTokenRatio: solRatio.toString(),
        });

        // Set token balances
        setTokenBalances({
          fsxSupply: formatAmount(rawSupply, TOKEN_DECIMALS),
          userFsxBlanace: formatAmount(userFsxBalance, TOKEN_DECIMALS),
          contractBnbBalance: ethers.utils.formatEther(contractBalanceWei),
          userBNBBalance: ethers.utils.formatEther(balanceWei),
          userEthBalance: formatAmount(ethBalanceMy, 18),
          userBTCBalance: formatAmount(btcBalanceMy, 8),
          userSOLBalance: formatAmount(solBalanceMy, 9),
          fsxBalance: formatAmount(balances.tokenBalance, TOKEN_DECIMALS),
          bnbPrice: formatAmount(info.bnbPrice, TOKEN_DECIMALS, 6),
          stablecoinPrice: formatAmount(info.stablecoinPrice, TOKEN_DECIMALS),
          usdtBalance: formatAmount(balances.usdtBalance, STABLE_DECIMALS),
          usdcBalance: formatAmount(balances.usdcBalance, STABLE_DECIMALS),
          userUSDCBalance: formatAmount(usdcBalanceMy, STABLE_DECIMALS),
          userUSDTBalance: formatAmount(usdtBalanceMy, STABLE_DECIMALS),
          totalPenalty: formatAmount(totalPenaltyCollected, TOKEN_DECIMALS),
        });

        setGlobalLoad(false);
      
    };

    fetchContractInfo();
  }, [contract, address, provider, signer, reCall]);

  /// Contract interaction functions
  const buyWithBNB = async (bnbAmount) => {
    if (!contract || !address) return null;
    // Start a transaction toast notification
    const toastId = notify.start(
      `Initializing buy With ${CURRENCY} transaction...`
    );
    try {
      const bnbValue = ethers.utils.parseEther(bnbAmount);
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

      // Get current gas price and estimate gas
      const gasPrice = await signer.getGasPrice();
      const optimizedGasPrice = gasPrice.mul(85).div(100); // 85% of current gas price

      let tx;
      if (useVoucher) {
        const estimatedGas = await contract.estimateGas.buyWithBNB_Voucher(
          voucher,
          signature,
          { value: bnbValue.toString() }
        );
        const gasLimit = estimatedGas.mul(120).div(100); // Add 20% buffer
        tx = await contract.buyWithBNB_Voucher(voucher, signature, {
          value: bnbValue,
          gasPrice: optimizedGasPrice,
          gasLimit,
        });
        if (!boundReferrer && voucher?.referrer) {
          setBoundReferrer(voucher.referrer);
        }
      } else {
        const estimatedGas = await contract.estimateGas.buyWithBNB({
          value: bnbValue.toString(),
        });
        const gasLimit = estimatedGas.mul(120).div(100); // Add 20% buffer
        tx = await contract.buyWithBNB({
          value: bnbValue,
          gasPrice: optimizedGasPrice,
          gasLimit,
        });
      }
      const returnTransaction = await tx.wait();
      setReCall(reCall + 1);
      // Update notification for completed transaction
      notify.complete(
        toastId,
        `Successfully purchased  ${bnbAmount} ${TOKEN_SYMBOL}!`
      );
      return returnTransaction;
    } catch (error) {
      const { message: errorMessage, code: errorCode } = handleTransactionError(
        error,
        "buying with BNB"
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

  const buyUSDT = async (ethAmount) => {
    if (!contract || !address) return null;
    // Start a transaction toast notification
    const toastId = notify.start(`Initializing buy With USDT transaction...`);
    try {
      const ethValue = ethers.utils.parseEther(ethAmount);

      // Get optimized gas parameters
      const gasPrice = await signer.getGasPrice();
      const optimizedGasPrice = gasPrice.mul(85).div(100); // 85% of current gas price

      const estimatedGas = await contract.estimateGas.buyUSDT({
        value: ethValue.toString(),
      });

      const gasLimit = estimatedGas.mul(120).div(100); // Add 20% buffer

      // Execute transaction with optimized gas parameters
      const tx = await contract.buyUSDT({
        value: ethValue,
        gasPrice: optimizedGasPrice,
        gasLimit,
      });

      const returnTransaction = await tx.wait();
      setReCall(reCall + 1);
      // Update notification for completed transaction
      notify.complete(
        toastId,
        `Successfully purchased with ${ethAmount} USDT!`
      );
      return returnTransaction;
    } catch (error) {
      const { message: errorMessage, code: errorCode } = handleTransactionError(
        error,
        "buy USDT"
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

  const buyUSDC = async (ethAmount) => {
    if (!contract || !address) return null;
    // Start a transaction toast notification
    const toastId = notify.start(`Initializing buy With USDC transaction...`);
    try {
      const ethValue = ethers.utils.parseEther(ethAmount);

      // Get optimized gas parameters
      const gasPrice = await signer.getGasPrice();
      const optimizedGasPrice = gasPrice.mul(85).div(100); // 85% of current gas price

      const estimatedGas = await contract.estimateGas.buyUSDC({
        value: ethValue.toString(),
      });

      const gasLimit = estimatedGas.mul(120).div(100); // Add 20% buffer

      // Execute transaction with optimized gas parameters
      const tx = await contract.buyUSDC({
        value: ethValue,
        gasPrice: optimizedGasPrice,
        gasLimit,
      });

      const returnTransaction = await tx.wait();
      setReCall(reCall + 1); // Update notification for completed transaction
      notify.complete(
        toastId,
        `Successfully purchased with ${ethAmount} USDC!`
      );
      return returnTransaction;
    } catch (error) {
      const { message: errorMessage, code: errorCode } = handleTransactionError(
        error,
        "buy USDC"
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

  // Admin functions

  const updateStablecoinPrice = async (newPrice) => {
    if (!contract || !address) return null;
    // Start a transaction toast notification
    const toastId = notify.start(
      `Initializing updateStablecoinPrice transaction...`
    );
    try {
      const parsedPrice = ethers.utils.parseEther(newPrice);

      // Get optimized gas parameters
      const gasPrice = await signer.getGasPrice();
      const optimizedGasPrice = gasPrice.mul(85).div(100); // 85% of current gas price

      const estimatedGas = await contract.estimateGas.updateStablecoinPrice(
        parsedPrice
      );
      const gasLimit = estimatedGas.mul(120).div(100); // Add 20% buffer

      // Execute transaction with optimized gas parameters
      const tx = await contract.updateStablecoinPrice(parsedPrice, {
        gasPrice: optimizedGasPrice,
        gasLimit,
      });

      // Remove console.log of promise object, which doesn't provide useful info
      // Only log the result after awaiting

      const returnTransaction = await tx.wait();
      setReCall(reCall + 1); // Update notification for completed transaction
      notify.complete(toastId, `Successfully State updated`);
      return returnTransaction;
    } catch (error) {
      const { message: errorMessage, code: errorCode } = handleTransactionError(
        error,
        "update Stablecoin Price"
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

  const updateTokenPrice = async (newPrice) => {
    if (!contract || !address) return null;
    // Start a transaction toast notification
    const toastId = notify.start(
      `Initializing updateTokenPrice transaction...`
    );
    try {
      const parsedPrice = ethers.utils.parseEther(newPrice);

      // Get optimized gas parameters
      const gasPrice = await signer.getGasPrice();
      const optimizedGasPrice = gasPrice.mul(85).div(100); // 85% of current gas price

      const estimatedGas = await contract.estimateGas.updateTokenPrice(
        parsedPrice
      );
      const gasLimit = estimatedGas.mul(120).div(100); // Add 20% buffer

      // Execute transaction with optimized gas parameters
      const tx = await contract.updateTokenPrice(parsedPrice, {
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
        "update Token Price"
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

  const updateUSDT = async (addressToken, ratio) => {
    if (!contract || !address) return null;
    // Start a transaction toast notification
    const toastId = notify.start(`Initializing updateUSDT transaction...`);
    try {
      // Get optimized gas parameters
      const gasPrice = await signer.getGasPrice();
      const optimizedGasPrice = gasPrice.mul(85).div(100); // 85% of current gas price

      const estimatedGas = await contract.estimateGas.updateUSDT(
        addressToken,
        ratio
      );
      const gasLimit = estimatedGas.mul(120).div(100); // Add 20% buffer

      // Execute transaction with optimized gas parameters
      const tx = await contract.updateUSDT(addressToken, ratio, {
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
        "update USDT"
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

  const updateUSDC = async (addressToken, ratio) => {
    if (!contract || !address) return null;
    // Start a transaction toast notification
    const toastId = notify.start(`Initializing updateUSDC transaction...`);
    try {
      // Get optimized gas parameters
      const gasPrice = await signer.getGasPrice();
      const optimizedGasPrice = gasPrice.mul(85).div(100); // 85% of current gas price

      const estimatedGas = await contract.estimateGas.updateUSDC(
        addressToken,
        ratio
      );
      const gasLimit = estimatedGas.mul(120).div(100); // Add 20% buffer

      // Execute transaction with optimized gas parameters
      const tx = await contract.updateUSDC(addressToken, ratio, {
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
        "update USDC"
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
        if (tokenOutName === "FSX") {
          // Handle FSX token with appropriate decimals
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
        if (tokenOutName === "FSX") {
          // Handle FSX token with appropriate decimals
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
    console.log("[refreshContractData] invoked");
    if (contract && account) {
      try {
        console.log("[refreshContractData] fetching data for", address);
        // Constants
        const TOKEN_DECIMALS = 18;
        const STABLE_DECIMALS = 6; // Both USDT and USDC use 6 decimals

        // Create contracts
        const usdtContract = new ethers.Contract(
          USDT_ADDRESS,
          erc20Abi,
          signer
        );
        const usdcContract = new ethers.Contract(
          USDC_ADDRESS,
          erc20Abi,
          signer
        );

        // Fetch all data concurrently for better performance
        const [
          info,
          bnbAddr,
          btcAddr,
          solAddr,
          bnbRatio,
          ethRatio,
          btcRatio,
          solRatio,
          usdtBalanceMy,
          usdcBalanceMy,
          balanceWei,
        ] = await Promise.all([
          contract.getContractInfo(),
          contract.ethAddress(),
          contract.btcAddress(),
          contract.solAddress(),
          contract.bnbRatio(),
          contract.ethRatio(),
          contract.btcRatio(),
          contract.solRatio(),
          usdtContract.balanceOf(address),
          usdcContract.balanceOf(address),
          provider.getBalance(address),
        ]);

        console.log("[refreshContractData] base data", {
          info,
          bnbAddr,
          btcAddr,
          solAddr,
          bnbRatio: bnbRatio.toString(),
          ethRatio: ethRatio.toString(),
          btcRatio: btcRatio.toString(),
          solRatio: solRatio.toString(),
          usdtBalanceMy: usdtBalanceMy.toString(),
          usdcBalanceMy: usdcBalanceMy.toString(),
          balanceWei: balanceWei.toString(),
        });

        // Create token contract after we have the address from info
        const tokenContract = new ethers.Contract(
          info.tokenAddress,
          erc20Abi,
          provider
        );

        // Fetch additional data concurrently
        const ethContract = new ethers.Contract(ethAddr, erc20Abi, provider);
        const btcContract = new ethers.Contract(btcAddr, erc20Abi, provider);

        const [rawSupply, userFsxBalance, balances, totalPenaltyCollected, ethBalanceMy, btcBalanceMy] =
          await Promise.all([
            tokenContract.totalSupply(),
            tokenContract.balanceOf(address),
            contract.getTokenBalances(),
            readOnlyContract.getTotalPenaltyCollected(),
            ethContract.balanceOf(address),
            btcContract.balanceOf(address),
          ]);

        console.log("[refreshContractData] additional data", {
          rawSupply: rawSupply.toString(),
          userFsxBalance: userFsxBalance.toString(),
          balances,
          totalPenaltyCollected: totalPenaltyCollected.toString(),
          ethBalanceMy: ethBalanceMy.toString(),
          btcBalanceMy: btcBalanceMy.toString(),
        });

        // Helper function to format units and fix decimals
        const formatAmount = (amount, decimals, fixedDigits = 2) =>
          parseFloat(
            ethers.utils.formatUnits(amount.toString(), decimals)
          ).toFixed(fixedDigits);

        // Set contract info
        const newContractInfo = {
          fsxAddress: info.tokenAddress,
          fsxBalance: formatAmount(info.tokenBalance, TOKEN_DECIMALS),
          bnbPrice: formatAmount(info.bnbPrice, TOKEN_DECIMALS, 6),
          stablecoinPrice: formatAmount(
            info.stablecoinPrice,
            TOKEN_DECIMALS,
            6
          ),
          totalSold: formatAmount(info.totalSold, TOKEN_DECIMALS),
          usdtAddress: info.usdtAddr,
          usdcAddress: info.usdcAddr,
          usdtTokenRatio: info.usdtTokenRatio.toString(),
          usdcTokenRatio: info.usdcTokenRatio.toString(),
          ethAddress: ethAddr,
          btcAddress: btcAddr,
          solAddress: solAddr,
          bnbTokenRatio: bnbRatio.toString(),
          ethTokenRatio: ethRatio.toString(),
          btcTokenRatio: btcRatio.toString(),
          solTokenRatio: solRatio.toString(),
        };
        console.log("[refreshContractData] contractInfo", newContractInfo);
        setContractInfo(newContractInfo);

        // Set token balances
        const newTokenBalances = {
          fsxSupply: formatAmount(rawSupply, TOKEN_DECIMALS),
          userFsxBlanace: formatAmount(userFsxBalance, TOKEN_DECIMALS),
          contractBnbBalance: ethers.utils.formatEther(contractBalanceWei),
          userBNBBalance: ethers.utils.formatEther(balanceWei),
          userEthBalance: formatAmount(ethBalanceMy, TOKEN_DECIMALS),
          userBTCBalance: formatAmount(btcBalanceMy, TOKEN_DECIMALS),
          fsxBalance: formatAmount(balances.tokenBalance, TOKEN_DECIMALS),
          bnbPrice: formatAmount(info.bnbPrice, TOKEN_DECIMALS, 6),
          stablecoinPrice: formatAmount(info.stablecoinPrice, TOKEN_DECIMALS),
          usdtBalance: formatAmount(balances.usdtBalance, STABLE_DECIMALS),
          usdcBalance: formatAmount(balances.usdcBalance, STABLE_DECIMALS),
          userUSDCBalance: formatAmount(usdcBalanceMy, STABLE_DECIMALS),
          userUSDTBalance: formatAmount(usdtBalanceMy, STABLE_DECIMALS),
          totalPenalty: formatAmount(totalPenaltyCollected, TOKEN_DECIMALS),
        };
        console.log("[refreshContractData] tokenBalances", newTokenBalances);
        setTokenBalances(newTokenBalances);
      } catch (error) {
        const errorMessage = handleTransactionError(error, "withdraw Tokens");
        console.log(errorMessage);

        setError("Failed to fetch contract data");
      }
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
            address: FSX_ADDRESS,
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
        FSX_ADDRESS,
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

  // Update getContractInfo to include staking info
  const getContractInfo = async () => {
    if (!contract) return null;

    try {
      // Get basic contract info as you already do
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

      // Return combined data
      return {
        // Existing contract info
        saleToken: info.tokenAddress,
        fsxBalance: ethers.utils.formatUnits(info.tokenBalance, 18),
        bnbPrice: ethers.utils.formatUnits(info.bnbPrice, 18),
        stablecoinPrice: ethers.utils.formatUnits(info.stablecoinPrice, 18),
        totalSold: ethers.utils.formatUnits(info.totalSold, 18),
        usdtAddress: info.usdtAddr,
        usdcAddress: info.usdcAddr,
        usdtTokenRatio: info.usdtTokenRatio.toString(),
        usdcTokenRatio: info.usdcTokenRatio.toString(),
        ethAddress: ethAddr,
        btcAddress: btcAddr,
        solAddress: solAddr,
        bnbTokenRatio: bnbRatio.toString(),
        ethTokenRatio: ethRatio.toString(),
        btcTokenRatio: btcRatio.toString(),
        solTokenRatio: solRatio.toString(),

        // Staking info
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

        // User specific staking info
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
    console.log("[getTokenBalances] invoked");
    if (!contract || !FSX_ADDRESS) return null;

    try {
      console.log("[getTokenBalances] calling contract.getTokenBalances");
      // Get token balances as you already do
      const balances = await contract.getTokenBalances();
      console.log("[getTokenBalances] contract balances", balances);

      // Get user token balance
      const tokenContract = new ethers.Contract(
        FSX_ADDRESS,
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
        console.log("[getTokenBalances] user staking", {
          userBalance: userBalance.toString(),
          userStaked: userStaked.toString(),
          pendingRewards: pendingRewards.toString(),
        });
      }

      const result = {
        // Existing balances
        fsxBalance: ethers.utils.formatUnits(balances.tokenBalance, 18),
        usdtBalance: balances.usdtBalance.toString(), // Adjust if USDT has different decimals
        usdcBalance: balances.usdcBalance.toString(), // Adjust if USDC has different decimals

        // User balances
        userBalance: ethers.utils.formatUnits(userBalance, 18),
        userStaked: ethers.utils.formatUnits(userStaked, 18),
        pendingRewards: ethers.utils.formatUnits(pendingRewards, 18),
      };
      console.log("[getTokenBalances] result", result);
      return result;
    } catch (error) {
      console.error("Error getting token balances:", error);
      return null;
    }
  };

  //REFERAL

  // Function to register a referrer
  const registerReferrer = async (referrerAddress) => {
    if (!contract || !address) return null;

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
    if (!contract) return null;

    try {
      const referralInfo = await contract.getReferralInfo(
        userAddress || address
      );

      return {
        referrer: referralInfo.referrer,
        totalReferrals: referralInfo.totalReferrals.toString(),
        totalRewardsEarned: ethers.utils.formatUnits(
          referralInfo.totalRewardsEarned,
          18
        ),
        rewardPercentage: referralInfo.rewardPercentage.toString(),
      };
    } catch (error) {
      console.error("Error getting referral info:", error);
      return null;
    }
  };

  // Function to get user's referrals
  const getUserReferrals = async (userAddress) => {
    if (!contract) return [];

    try {
      const referrals = await contract.getUserReferrals(userAddress || address);
      return referrals;
    } catch (error) {
      console.error("Error getting user referrals:", error);
      return [];
    }
  };

  // Function to get referral transactions
  const getReferralTransactions = async (userAddress) => {
    if (!contract) return [];

    try {
      // Get all user transactions
      const allTransactions = await contract.getUserTransactions(
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
    addtokenToMetaMask,
    stakeTokens,
    // New staking functions
    stakeTokens,
    unstakeTokens,
    harvestRewards,
    getUserStakes,
    getContractInfo,
    getTokenBalances,
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
