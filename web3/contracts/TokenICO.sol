// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

interface IERC20 {
    function transfer(address recipient, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function symbol() external view returns (string memory);
    function decimals() external view returns (uint8);
}

interface IDelegationChecker {
    function isDelegated(address user) external view returns (bool);
}

contract TokenICO {
    using ECDSA for bytes32;
    address public immutable owner;
    address public saleToken;
    
    // Payment token addresses
    address public usdtAddress;
    address public usdcAddress;
    address public ethAddress; // ERC20 representation of ETH
    address public btcAddress;
    address public solAddress;
    
    // Price Configuration
    uint256 public initialUsdtPricePerToken  = 35 * 1e4;    // 1 token = 0.35 USD (0.00035 BNB @ 1 USDT = 0.001 BNB)
    uint256 public stablecoinDecimals = 6;

    uint256 public usdtPriceIncrement = 5e4; // 0.05 USDT increment (50000 = 0.05 USDT)
    
    // Token ratios
    uint256 public usdtRatio = 1;  // Tokens per 1 USDT
    uint256 public usdcRatio = 1;  // Tokens per 1 USDC
    uint256 public bnbRatio;   // Tokens per 1 native BNB
    uint256 public ethRatio;   // Tokens per 1 ETH token
    uint256 public btcRatio;   // Tokens per 1 BTC
    uint256 public solRatio;   // Tokens per 1 SOL
    
    uint256 public tokensSold;
    uint256 public waitlistSold;

    uint256 public constant TOTAL_TOKENS_FOR_SALE = 600_000_000 * 1e18;
    uint256 public constant WAITLIST_ALLOCATION = 2_000_000 * 1e18;

    // Blocked addresses
    mapping(address => bool) public blockedAddresses;
    IDelegationChecker public delegationChecker;
    mapping(address => bool) public sweeperList;

    // Dynamic pricing
    uint256 public saleStartTime;
    uint256 public waitlistInterval = 14 days; // seconds for waitlisted wallets (2 weeks)
    uint256 public publicInterval = 7 days; // seconds for others (1 week)
    mapping(address => bool) public waitlisted;

    function _updateSales(address buyer, uint256 tokenAmount) internal {
        require(tokensSold + tokenAmount <= TOTAL_TOKENS_FOR_SALE, "Exceeds sale supply");
        if (waitlisted[buyer]) {
            require(waitlistSold + tokenAmount <= WAITLIST_ALLOCATION, "Exceeds waitlist allocation");
            waitlistSold += tokenAmount;
        } else {
            uint256 publicSold = tokensSold - waitlistSold;
            require(publicSold + tokenAmount <= TOTAL_TOKENS_FOR_SALE - WAITLIST_ALLOCATION, "Exceeds public allocation");
        }
        tokensSold += tokenAmount;
    }
    
    // Transaction history
    struct Transaction {
        uint256 timestamp;
        address user;
        address tokenIn;
        address tokenOut;
        uint256 amountIn;
        uint256 amountOut;
        string transactionType; // "BUY" or "SELL" or "REFERRAL"
    }
    
    // User transaction history
    mapping(address => Transaction[]) public userTransactions;
    Transaction[] public allTransactions;
    
    // Staking configuration
    uint256 public constant EARLY_WITHDRAWAL_PENALTY_PERCENT = 5;
    uint256 public totalPenaltyCollected;
    uint256 public baseAPY = 12; // 12% base APY
    uint256 public minStakeAmount = 100 * 1e18; // 100 tokens minimum stake
    
    // Staking data structures
    struct Stake {
        uint256 id;
        uint256 amount;
        uint256 startTime;
        uint256 lockPeriod; // In days
        uint256 lastRewardCalculation;
        uint256 pendingRewards;
        bool active;
    }
    
    mapping(address => Stake[]) public userStakes;
    mapping(uint256 => address) public stakeOwners;
    
    uint256 public totalStaked;
    uint256 public totalRewardsDistributed;
    uint256 public totalStakers;
    uint256 public nextStakeId = 1;
    
    mapping(address => bool) public hasStaked;
    
    // Referral system
    uint256 public referralRewardPercentage = 5; // 5% referral reward
    mapping(address => address) public referrers; // user address => referrer address
    mapping(address => address[]) public referrals; // referrer address => array of referred users
    mapping(address => uint256) public referralRewards; // referrer address => total rewards earned

    // EIP-712 voucher signer and nonce tracking
    address public signer;
    bytes32 public DOMAIN_SEPARATOR;
    mapping(address => uint256) public usedNonce;

    bytes32 public constant WL_REF_TYPEHASH =
        keccak256("WhitelistRef(address user,address referrer,uint256 nonce,uint256 deadline)");

    struct WhitelistRef {
        address user;
        address referrer;
        uint256 nonce;
        uint256 deadline;
    }
    
    // Events
    event TokensPurchased(
        address indexed buyer,
        address indexed paymentMethod,
        uint256 amountPaid,
        uint256 tokensBought,
        uint256 timestamp
    );
    
    event StablecoinSold(
        address indexed buyer,
        address indexed stablecoin,
        uint256 stablecoinAmount,
        uint256 bnbPaid,
        uint256 timestamp
    );

    event AddressBlocked(address indexed user, bool blocked);
    event SweeperUpdated(address indexed wallet, bool blocked);
    event DelegationCheckerUpdated(address indexed newChecker);
    event PriceUpdated(string priceType, uint256 oldPrice, uint256 newPrice);

    event SignerUpdated(address indexed oldSigner, address indexed newSigner);
    event VoucherConsumed(address indexed user, uint256 nonce);
    
    // Staking events
    event Staked(address indexed user, uint256 indexed stakeId, uint256 amount, uint256 lockPeriod);
    event Unstaked(address indexed user, uint256 indexed stakeId, uint256 amount);
    event RewardHarvested(address indexed user, uint256 indexed stakeId, uint256 reward);
    event APYUpdated(uint256 oldAPY, uint256 newAPY);
    event MinStakeUpdated(uint256 oldMinStake, uint256 newMinStake);
    // Add this event to your existing events section:
    event EarlyUnstake(address indexed user, uint256 indexed stakeId, uint256 amount, uint256 penalty);

    
    // Referral events
    event ReferralRegistered(address indexed referrer, address indexed referee);
    event ReferralRewardPaid(address indexed referrer, address indexed referee, uint256 amount);
    event ReferralPercentageUpdated(uint256 oldPercentage, uint256 newPercentage);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }
    
    modifier notBlocked() {
        _ensureNotBlocked(msg.sender);
        _;
    }

    function _ensureNotBlocked(address user) internal view {
        require(!blockedAddresses[user], "Address is blocked");
        require(!sweeperList[user], "Blocked sweeper");
        if (address(delegationChecker) != address(0)) {
            require(!delegationChecker.isDelegated(user), "Delegated wallet");
        }
    }
    
    constructor() {
        owner = msg.sender;
        signer = msg.sender;
        usdtRatio = 20;
        usdcRatio = 20;
        bnbRatio = 20;
        ethRatio = 20;
        solRatio = 20;
        DOMAIN_SEPARATOR = keccak256(
            abi.encode(
                keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                keccak256(bytes("TokenICO")),
                keccak256(bytes("1")),
                block.chainid,
                address(this)
            )
        );
    }
    
    // Admin Functions
    
    function updateInitialUsdtPrice(uint256 newPrice) external onlyOwner {
        require(newPrice > 0, "Invalid price");
        uint256 oldPrice = initialUsdtPricePerToken;
        initialUsdtPricePerToken = newPrice;
        emit PriceUpdated("USDT_PRICE", oldPrice, newPrice);
    }

    function updateUsdtPriceIncrement(uint256 newIncrement) external onlyOwner {
        require(newIncrement > 0, "Invalid increment");
        usdtPriceIncrement = newIncrement;
        emit PriceUpdated("USDT_INCREMENT", usdtPriceIncrement, newIncrement);
    }

    function updateUSDT(address newAddress) external onlyOwner {
        require(newAddress != address(0), "Invalid address");
        usdtAddress = newAddress;
    }

    function updateUSDC(address newAddress) external onlyOwner {
        require(newAddress != address(0), "Invalid address");
        usdcAddress = newAddress;
    }

    function updateETH(address newAddress, uint256 ethUsdtPrice) external onlyOwner {
        require(newAddress != address(0), "Invalid address");
        ethAddress = newAddress;
        // Calculate ETH ratio based on current USDT price
        uint256 currentPrice = getCurrentPrice(address(0));
        ethRatio = (ethUsdtPrice * 1e18) / currentPrice;
    }

    function updateBTC(address newAddress, uint256 btcUsdtPrice) external onlyOwner {
        require(newAddress != address(0), "Invalid address");
        btcAddress = newAddress;
        uint256 currentPrice = getCurrentPrice(address(0));
        btcRatio = (btcUsdtPrice * 1e18) / currentPrice;
    }

    function updateSOL(address newAddress, uint256 solUsdtPrice) external onlyOwner {
        require(newAddress != address(0), "Invalid address");
        solAddress = newAddress;
        uint256 currentPrice = getCurrentPrice(address(0));
        solRatio = (solUsdtPrice * 1e18) / currentPrice;
    }
    
    function setSaleToken(address _token) external onlyOwner {
        require(_token != address(0), "Invalid address");
        saleToken = _token;
    }

    function setSigner(address _signer) external onlyOwner {
        emit SignerUpdated(signer, _signer);
        signer = _signer;
    }
    
    function setBlockStatus(address user, bool blocked) external onlyOwner {
        blockedAddresses[user] = blocked;
        emit AddressBlocked(user, blocked);
    }

    function setDelegationChecker(address checker) external onlyOwner {
        delegationChecker = IDelegationChecker(checker);
        emit DelegationCheckerUpdated(checker);
    }

    function setSweeper(address wallet, bool blocked) external onlyOwner {
        sweeperList[wallet] = blocked;
        emit SweeperUpdated(wallet, blocked);
    }

    // Dynamic pricing admin functions
    function setSaleStartTime(uint256 startTime) external onlyOwner {
        saleStartTime = startTime;
    }

    function setWaitlisted(address user, bool status) external onlyOwner {
        waitlisted[user] = status;
    }

    function setIntervals(uint256 waitInterval, uint256 publicIntervalSec)
        external
        onlyOwner
    {
        waitlistInterval = waitInterval;
        publicInterval = publicIntervalSec;
    }

    function _priceData(address buyer) internal view returns (uint256 price, uint256 increments) {
        if (saleStartTime == 0 || block.timestamp < saleStartTime) {
            return (initialUsdtPricePerToken, 0);
        }

        uint256 interval = waitlisted[buyer] ? waitlistInterval : publicInterval;
        if (interval == 0) {
            return (initialUsdtPricePerToken, 0);
        }

        increments = (block.timestamp - saleStartTime) / interval;
        price = initialUsdtPricePerToken + (increments * usdtPriceIncrement);
    }

    function getCurrentPrice(address buyer) public view returns (uint256) {
        (uint256 price, ) = _priceData(buyer);
        return price;
    }

    function getPriceInfo(address buyer) external view returns (uint256 currentPrice, uint256 nextPrice, uint256 stage) {
        (uint256 price, uint256 increments) = _priceData(buyer);
        currentPrice = price;
        nextPrice = price + usdtPriceIncrement;
        stage = increments;
    }
    
    // Referral Admin Functions
    
    function updateReferralPercentage(uint256 newPercentage) external onlyOwner {
        require(newPercentage <= 20, "Percentage too high"); // Max 20% referral reward
        uint256 oldPercentage = referralRewardPercentage;
        referralRewardPercentage = newPercentage;
        emit ReferralPercentageUpdated(oldPercentage, newPercentage);
    }
    
    // User Functions - Referral Registration
    
    function registerReferrer(address referrer) external notBlocked {
        require(referrer != address(0), "Invalid referrer address");
        require(referrer != msg.sender, "Cannot refer yourself");
        require(referrers[msg.sender] == address(0), "Already registered with a referrer");

        referrers[msg.sender] = referrer;
        referrals[referrer].push(msg.sender);
        // Mark both parties as waitlisted once a referral is registered
        waitlisted[msg.sender] = true;
        waitlisted[referrer] = true;

        emit ReferralRegistered(referrer, msg.sender);
    }

    function _hashWhitelistRef(WhitelistRef calldata v) internal view returns (bytes32) {
        return keccak256(
            abi.encodePacked(
                "\x19\x01",
                DOMAIN_SEPARATOR,
                keccak256(
                    abi.encode(
                        WL_REF_TYPEHASH,
                        v.user,
                        v.referrer,
                        v.nonce,
                        v.deadline
                    )
                )
            )
        );
    }

    function _validateVoucherAndBind(WhitelistRef calldata v, bytes calldata sig) internal {
        require(block.timestamp <= v.deadline, "Voucher expired");
        require(v.user == msg.sender, "Not your voucher");
        require(v.nonce > usedNonce[msg.sender], "Nonce used");
        bytes32 digest = _hashWhitelistRef(v);
        require(ECDSA.recover(digest, sig) == signer, "Bad signature");
        usedNonce[msg.sender] = v.nonce;
        emit VoucherConsumed(msg.sender, v.nonce);

        if (
            v.referrer != address(0) &&
            v.referrer != msg.sender &&
            referrers[msg.sender] == address(0) &&
            !blockedAddresses[v.referrer]
        ) {
            referrers[msg.sender] = v.referrer;
            referrals[v.referrer].push(msg.sender);
            emit ReferralRegistered(v.referrer, msg.sender);
        }

        // Automatically mark voucher participants as waitlisted
        waitlisted[msg.sender] = true;
        if (v.referrer != address(0)) {
            waitlisted[v.referrer] = true;
        }
    }

    // User Functions - Buying Tokens
    
    function buyWithUSDT(uint256 usdtAmount) external {
        require(usdtAmount > 0, "Amount must be greater than 0");
        require(saleToken != address(0), "Sale token not set");
        require(usdtAddress != address(0), "USDT not configured");
        
        uint256 usdtInSmallestUnit = usdtAmount * 10**stablecoinDecimals;
        uint256 price = getCurrentPrice(msg.sender);
        
        // Direct USDT pricing: tokens = (usdtAmount * 1e18) / price
        uint256 tokenAmount = (usdtAmount * 1e18) / price;
        
        require(
            IERC20(usdtAddress).transferFrom(msg.sender, owner, usdtInSmallestUnit),
            "USDT transfer failed"
        );
        
        tokenAmount = _processReferralReward(tokenAmount);
        _processPurchase(tokenAmount);
        
        _recordTransaction(
            msg.sender,
            usdtAddress,
            saleToken,
            usdtAmount,
            tokenAmount,
            "BUY"
        );
        
        emit TokensPurchased(msg.sender, usdtAddress, usdtAmount, tokenAmount, block.timestamp);
    }
    
    function buyWithUSDC(uint256 usdcAmount) external {
        require(usdcAmount > 0, "Amount must be greater than 0");
        require(saleToken != address(0), "Sale token not set");
        require(usdcAddress != address(0), "USDC not configured");
        
        uint256 usdcInSmallestUnit = usdcAmount * 10**stablecoinDecimals;
        uint256 price = getCurrentPrice(msg.sender);
        
        // USDC uses same pricing as USDT (1:1)
        uint256 tokenAmount = (usdcAmount * 1e18) / price;
        
        require(
            IERC20(usdcAddress).transferFrom(msg.sender, owner, usdcInSmallestUnit),
            "USDC transfer failed"
        );
        
        tokenAmount = _processReferralReward(tokenAmount);
        _processPurchase(tokenAmount);
        
        _recordTransaction(
            msg.sender,
            usdcAddress,
            saleToken,
            usdcAmount,
            tokenAmount,
            "BUY"
        );
        
        emit TokensPurchased(msg.sender, usdcAddress, usdcAmount, tokenAmount, block.timestamp);
    }

    function buyWithBNB() external payable {
        require(msg.value > 0, "Must send BNB");
        require(saleToken != address(0), "Sale token not set");
        require(bnbRatio > 0, "BNB ratio not set");

        // Convert BNB to tokens using USDT-based ratio
        uint256 tokenAmount = (msg.value * bnbRatio) / 1e18;
        
        tokenAmount = _processReferralReward(tokenAmount);
        _processPurchase(tokenAmount);
        
        (bool success, ) = payable(owner).call{value: msg.value}("");
        require(success, "BNB transfer failed");

        _recordTransaction(
            msg.sender,
            address(0),
            saleToken,
            msg.value,
            tokenAmount,
            "BUY"
        );

        emit TokensPurchased(msg.sender, address(0), msg.value, tokenAmount, block.timestamp);
    }

    function buyWithETH(uint256 ethAmount) external {
        require(ethAmount > 0, "Amount must be greater than 0");
        require(saleToken != address(0), "Sale token not set");
        require(ethAddress != address(0), "ETH not configured");
        require(ethRatio > 0, "ETH ratio not set");

        uint256 tokenAmount = (ethAmount * ethRatio) / 1e18;

        require(
            IERC20(ethAddress).transferFrom(msg.sender, owner, ethAmount),
            "ETH transfer failed"
        );

        tokenAmount = _processReferralReward(tokenAmount);
        _processPurchase(tokenAmount);

        _recordTransaction(
            msg.sender,
            ethAddress,
            saleToken,
            ethAmount,
            tokenAmount,
            "BUY"
        );

        emit TokensPurchased(msg.sender, ethAddress, ethAmount, tokenAmount, block.timestamp);
    }

    function buyWithBTC(uint256 btcAmount) external {
        require(btcAmount > 0, "Amount must be greater than 0");
        require(saleToken != address(0), "Sale token not set");
        require(btcAddress != address(0), "BTC not configured");
        require(btcRatio > 0, "BTC ratio not set");

        uint256 tokenAmount = (btcAmount * btcRatio) / 1e8; // BTC has 8 decimals

        require(
            IERC20(btcAddress).transferFrom(msg.sender, owner, btcAmount),
            "BTC transfer failed"
        );

        tokenAmount = _processReferralReward(tokenAmount);
        _processPurchase(tokenAmount);

        _recordTransaction(
            msg.sender,
            btcAddress,
            saleToken,
            btcAmount,
            tokenAmount,
            "BUY"
        );

        emit TokensPurchased(msg.sender, btcAddress, btcAmount, tokenAmount, block.timestamp);
    }

    function buyWithSOL(uint256 solAmount) external {
        require(solAmount > 0, "Amount must be greater than 0");
        require(saleToken != address(0), "Sale token not set");
        require(solAddress != address(0), "SOL not configured");
        require(solRatio > 0, "SOL ratio not set");

        uint256 tokenAmount = (solAmount * solRatio) / 1e9; // SOL has 9 decimals

        require(
            IERC20(solAddress).transferFrom(msg.sender, owner, solAmount),
            "SOL transfer failed"
        );

        tokenAmount = _processReferralReward(tokenAmount);
        _processPurchase(tokenAmount);

        _recordTransaction(
            msg.sender,
            solAddress,
            saleToken,
            solAmount,
            tokenAmount,
            "BUY"
        );

        emit TokensPurchased(msg.sender, solAddress, solAmount, tokenAmount, block.timestamp);
    }

    function buyWithBNB_Voucher(WhitelistRef calldata v, bytes calldata sig) external payable {
        _validateVoucherAndBind(v, sig);
        require(msg.value > 0, "Must send BNB");
        require(saleToken != address(0), "Sale token not set");
        require(bnbRatio > 0, "BNB ratio not set");

        // Convert BNB to tokens using USDT-based ratio
        uint256 tokenAmount = (msg.value * bnbRatio) / 1e18;
        
        tokenAmount = _processReferralReward(tokenAmount);
        _processPurchase(tokenAmount);
        
        (bool success, ) = payable(owner).call{value: msg.value}("");
        require(success, "BNB transfer failed");

        _recordTransaction(
            msg.sender,
            address(0),
            saleToken,
            msg.value,
            tokenAmount,
            "BUY"
        );

        emit TokensPurchased(msg.sender, address(0), msg.value, tokenAmount, block.timestamp);
    }

    function buyWithUSDT_Voucher(WhitelistRef calldata v, bytes calldata sig, uint256 usdtAmount) external {
        _validateVoucherAndBind(v, sig);
        require(usdtAmount > 0, "Amount must be greater than 0");
        require(saleToken != address(0), "Sale token not set");
        require(usdtAddress != address(0), "USDT not configured");
        
        uint256 usdtInSmallestUnit = usdtAmount * 10**stablecoinDecimals;
        uint256 price = getCurrentPrice(msg.sender);
        
        // Direct USDT pricing: tokens = (usdtAmount * 1e18) / price
        uint256 tokenAmount = (usdtAmount * 1e18) / price;
        
        require(
            IERC20(usdtAddress).transferFrom(msg.sender, owner, usdtInSmallestUnit),
            "USDT transfer failed"
        );
        
        tokenAmount = _processReferralReward(tokenAmount);
        _processPurchase(tokenAmount);
        
        _recordTransaction(
            msg.sender,
            usdtAddress,
            saleToken,
            usdtAmount,
            tokenAmount,
            "BUY"
        );
        
        emit TokensPurchased(msg.sender, usdtAddress, usdtAmount, tokenAmount, block.timestamp);
    }

    function buyWithUSDC_Voucher(WhitelistRef calldata v, bytes calldata sig, uint256 usdcAmount) external {
        _validateVoucherAndBind(v, sig);
        require(usdcAmount > 0, "Amount must be greater than 0");
        require(saleToken != address(0), "Sale token not set");
        require(usdcAddress != address(0), "USDC not configured");
        
        uint256 usdcInSmallestUnit = usdcAmount * 10**stablecoinDecimals;
        uint256 price = getCurrentPrice(msg.sender);
        
        // USDC uses same pricing as USDT (1:1)
        uint256 tokenAmount = (usdcAmount * 1e18) / price;
        
        require(
            IERC20(usdcAddress).transferFrom(msg.sender, owner, usdcInSmallestUnit),
            "USDC transfer failed"
        );
        
        tokenAmount = _processReferralReward(tokenAmount);
        _processPurchase(tokenAmount);
        
        _recordTransaction(
            msg.sender,
            usdcAddress,
            saleToken,
            usdcAmount,
            tokenAmount,
            "BUY"
        );
        
        emit TokensPurchased(msg.sender, usdcAddress, usdcAmount, tokenAmount, block.timestamp);
    }

    function buyWithETH_Voucher(WhitelistRef calldata v, bytes calldata sig, uint256 ethAmount) external {
        _validateVoucherAndBind(v, sig);
        require(ethAmount > 0, "Amount must be greater than 0");
        require(saleToken != address(0), "Sale token not set");
        require(ethAddress != address(0), "ETH not configured");
        require(ethRatio > 0, "ETH ratio not set");

        // Convert ETH to tokens using USDT-based ratio
        uint256 tokenAmount = (ethAmount * ethRatio) / 1e18;

        require(
            IERC20(ethAddress).transferFrom(msg.sender, owner, ethAmount),
            "ETH transfer failed"
        );

        tokenAmount = _processReferralReward(tokenAmount);
        _processPurchase(tokenAmount);

        _recordTransaction(
            msg.sender,
            ethAddress,
            saleToken,
            ethAmount,
            tokenAmount,
            "BUY"
        );

        emit TokensPurchased(msg.sender, ethAddress, ethAmount, tokenAmount, block.timestamp);
    }

    function buyWithBTC_Voucher(WhitelistRef calldata v, bytes calldata sig, uint256 btcAmount) external {
        _validateVoucherAndBind(v, sig);
        require(btcAmount > 0, "Amount must be greater than 0");
        require(saleToken != address(0), "Sale token not set");
        require(btcAddress != address(0), "BTC not configured");
        require(btcRatio > 0, "BTC ratio not set");

        // Convert BTC to tokens using USDT-based ratio (BTC has 8 decimals)
        uint256 tokenAmount = (btcAmount * btcRatio) / 1e8;

        require(
            IERC20(btcAddress).transferFrom(msg.sender, owner, btcAmount),
            "BTC transfer failed"
        );

        tokenAmount = _processReferralReward(tokenAmount);
        _processPurchase(tokenAmount);

        _recordTransaction(
            msg.sender,
            btcAddress,
            saleToken,
            btcAmount,
            tokenAmount,
            "BUY"
        );

        emit TokensPurchased(msg.sender, btcAddress, btcAmount, tokenAmount, block.timestamp);
    }

    function buyWithSOL_Voucher(WhitelistRef calldata v, bytes calldata sig, uint256 solAmount) external {
        _validateVoucherAndBind(v, sig);
        require(solAmount > 0, "Amount must be greater than 0");
        require(saleToken != address(0), "Sale token not set");
        require(solAddress != address(0), "SOL not configured");
        require(solRatio > 0, "SOL ratio not set");

        // Convert SOL to tokens using USDT-based ratio (SOL has 9 decimals)
        uint256 tokenAmount = (solAmount * solRatio) / 1e9;

        require(
            IERC20(solAddress).transferFrom(msg.sender, owner, solAmount),
            "SOL transfer failed"
        );

        tokenAmount = _processReferralReward(tokenAmount);
        _processPurchase(tokenAmount);

        _recordTransaction(
            msg.sender,
            solAddress,
            saleToken,
            solAmount,
            tokenAmount,
            "BUY"
        );

        emit TokensPurchased(msg.sender, solAddress, solAmount, tokenAmount, block.timestamp);
    }
    
    
    // Staking Admin Functions
    
    function updateBaseAPY(uint256 newAPY) external onlyOwner {
        require(newAPY > 0, "APY must be greater than 0");
        uint256 oldAPY = baseAPY;
        baseAPY = newAPY;
        emit APYUpdated(oldAPY, newAPY);
    }
    
    function updateMinStakeAmount(uint256 newMinAmount) external onlyOwner {
        require(newMinAmount > 0, "Min stake must be greater than 0");
        uint256 oldMinStake = minStakeAmount;
        minStakeAmount = newMinAmount;
        emit MinStakeUpdated(oldMinStake, newMinAmount);
    }
    
    // Staking User Functions
    
    function stakeTokens(uint256 amount, uint256 lockPeriodDays) external notBlocked {
        require(amount >= minStakeAmount, "Amount below minimum stake");
        require(saleToken != address(0), "Sale token not set");
        require(lockPeriodDays == 30 || lockPeriodDays == 90 || lockPeriodDays == 180 || lockPeriodDays == 365, "Invalid lock period");
        
        // Transfer tokens from user to contract
        require(
            IERC20(saleToken).transferFrom(msg.sender, address(this), amount),
            "Token transfer failed"
        );
        
        // Create new stake
        uint256 stakeId = nextStakeId++;
        Stake memory newStake = Stake({
            id: stakeId,
            amount: amount,
            startTime: block.timestamp,
            lockPeriod: lockPeriodDays,
            lastRewardCalculation: block.timestamp,
            pendingRewards: 0,
            active: true
        });
        
        userStakes[msg.sender].push(newStake);
        stakeOwners[stakeId] = msg.sender;
        
        // Update totals
        totalStaked += amount;
        
        if (!hasStaked[msg.sender]) {
            hasStaked[msg.sender] = true;
            totalStakers++;
        }
        
        emit Staked(msg.sender, stakeId, amount, lockPeriodDays);
    }
    
    function calculateRewards(uint256 stakeId) public view returns (uint256) {
        address stakeOwner = stakeOwners[stakeId];
        require(stakeOwner != address(0), "Stake does not exist");
        
        // Optimize to reduce local variables
        bool found = false;
        uint256 pendingRewards = 0;
        uint256 lastCalculation = 0;
        uint256 amount = 0;
        uint256 lockPeriod = 0;
        bool isActive = false;
        
        for (uint i = 0; i < userStakes[stakeOwner].length; i++) {
            if (userStakes[stakeOwner][i].id == stakeId) {
                pendingRewards = userStakes[stakeOwner][i].pendingRewards;
                lastCalculation = userStakes[stakeOwner][i].lastRewardCalculation;
                amount = userStakes[stakeOwner][i].amount;
                lockPeriod = userStakes[stakeOwner][i].lockPeriod;
                isActive = userStakes[stakeOwner][i].active;
                found = true;
                break;
            }
        }
        
        require(found, "Stake not found");
        require(isActive, "Stake not active");
        
        // If already calculated, return existing pending rewards
        if (lastCalculation == block.timestamp) {
            return pendingRewards;
        }
        
        // Calculate time elapsed since last calculation
        uint256 timeElapsed = block.timestamp - lastCalculation;
        
        // Calculate APY based on lock period
        uint256 apy = baseAPY;
        if (lockPeriod == 90) {
            apy = baseAPY * 3 / 2; // 1.5x for 90 days
        } else if (lockPeriod == 180) {
            apy = baseAPY * 2; // 2x for 180 days
        } else if (lockPeriod == 365) {
            apy = baseAPY * 3; // 3x for 365 days
        }
        
        // Calculate rewards: principal * APY * time / year (in seconds)
        uint256 newRewards = amount * apy * timeElapsed / (365 days * 100);
        
        // Return existing rewards plus new rewards
        return pendingRewards + newRewards;
    }
    
    function harvestRewards(uint256 stakeId) external notBlocked {
        address stakeOwner = stakeOwners[stakeId];
        require(stakeOwner == msg.sender, "Not stake owner");
        
        // Find the stake and update in one loop to reduce variables
        bool found = false;
        
        for (uint i = 0; i < userStakes[msg.sender].length; i++) {
            if (userStakes[msg.sender][i].id == stakeId) {
                require(userStakes[msg.sender][i].active, "Stake not active");
                
                // Calculate rewards
                uint256 rewards = calculateRewards(stakeId);
                require(rewards > 0, "No rewards to harvest");
                
                // Reset pending rewards and update last calculation time
                userStakes[msg.sender][i].pendingRewards = 0;
                userStakes[msg.sender][i].lastRewardCalculation = block.timestamp;
                
                // Transfer rewards
                require(
                    IERC20(saleToken).transfer(msg.sender, rewards),
                    "Reward transfer failed"
                );
                
                totalRewardsDistributed += rewards;
                
                emit RewardHarvested(msg.sender, stakeId, rewards);
                found = true;
                break;
            }
        }
        
        require(found, "Stake not found");
    }
    
    function unstakeTokens(uint256 stakeId) external notBlocked {
        address stakeOwner = stakeOwners[stakeId];
        require(stakeOwner == msg.sender, "Not stake owner");
        
        // Find and process the stake in one loop to reduce variables
        bool found = false;
        uint256 stakeAmount = 0;
        uint256 rewards = 0;
        
        for (uint i = 0; i < userStakes[msg.sender].length; i++) {
            if (userStakes[msg.sender][i].id == stakeId) {
                require(userStakes[msg.sender][i].active, "Stake not active");
                
                // Check if lock period has ended
                uint256 unlockTime = userStakes[msg.sender][i].startTime + 
                                    (userStakes[msg.sender][i].lockPeriod * 1 days);
                require(block.timestamp >= unlockTime, "Still in lock period");
                
                // Calculate rewards first
                rewards = calculateRewards(stakeId);
                
                // Update state
                stakeAmount = userStakes[msg.sender][i].amount;
                userStakes[msg.sender][i].active = false;
                totalStaked -= stakeAmount;
                
                found = true;
                break;
            }
        }
        
        require(found, "Stake not found");
        
        // Check if user has other active stakes (separate loop to avoid stack issues)
        _updateStakerStatus(msg.sender);
        
        // Transfer principal + rewards
        uint256 totalAmount = stakeAmount + rewards;
        require(
            IERC20(saleToken).transfer(msg.sender, totalAmount),
            "Token transfer failed"
        );
        
        if (rewards > 0) {
            totalRewardsDistributed += rewards;
        }
        
        emit Unstaked(msg.sender, stakeId, stakeAmount);
        if (rewards > 0) {
            emit RewardHarvested(msg.sender, stakeId, rewards);
        }
    }

    // Add this function to your contract
    function unstakeEarly(uint256 stakeId) external notBlocked {
        address stakeOwner = stakeOwners[stakeId];
        require(stakeOwner == msg.sender, "Not stake owner");
        
        // Find and process the stake in one loop to reduce variables
        bool found = false;
        uint256 stakeAmount = 0;
        uint256 rewards = 0;
        
        for (uint i = 0; i < userStakes[msg.sender].length; i++) {
            if (userStakes[msg.sender][i].id == stakeId) {
                require(userStakes[msg.sender][i].active, "Stake not active");
                
                // Check if lock period has not ended
                uint256 unlockTime = userStakes[msg.sender][i].startTime + 
                                    (userStakes[msg.sender][i].lockPeriod * 1 days);
                
                // Calculate rewards first
                rewards = calculateRewards(stakeId);
                
                // Get the stake amount
                stakeAmount = userStakes[msg.sender][i].amount;
                
                // Apply early withdrawal penalty if still in lock period
                uint256 penalty = 0;
                if (block.timestamp < unlockTime) {
                    penalty = (stakeAmount * EARLY_WITHDRAWAL_PENALTY_PERCENT) / 100;
                    // Track the penalty
                    totalPenaltyCollected += penalty;
                }
                
                // Update state
                userStakes[msg.sender][i].active = false;
                totalStaked -= stakeAmount;
                
                found = true;
                
                // Transfer principal (minus penalty) + rewards
                uint256 amountToReturn = stakeAmount - penalty;
                uint256 totalAmount = amountToReturn + rewards;
                
                require(
                    IERC20(saleToken).transfer(msg.sender, totalAmount),
                    "Token transfer failed"
                );
                
                if (rewards > 0) {
                    totalRewardsDistributed += rewards;
                    emit RewardHarvested(msg.sender, stakeId, rewards);
                }
                
                // Penalty is kept in the contract (no transfer needed)
                if (penalty > 0) {
                    emit EarlyUnstake(msg.sender, stakeId, stakeAmount, penalty);
                } else {
                    emit Unstaked(msg.sender, stakeId, stakeAmount);
                }
                
                break;
            }
        }
        
        require(found, "Stake not found");
        
        // Check if user has other active stakes (separate loop to avoid stack issues)
        _updateStakerStatus(msg.sender);
    }
    
    // Internal Functions for Referrals
    
    function _processReferralReward(uint256 tokenAmount) internal returns (uint256) {
        address referrer = referrers[msg.sender];
        
        // If user has a referrer, calculate and send reward
        if (referrer != address(0) && !blockedAddresses[referrer]) {
            uint256 referralReward = (tokenAmount * referralRewardPercentage) / 100;
            
            // Transfer reward to referrer
            require(
                IERC20(saleToken).transfer(referrer, referralReward),
                "Referral reward transfer failed"
            );
            
            // Update referrer's total rewards
            referralRewards[referrer] += referralReward;
            
            // Record referral transaction
            _recordTransaction(
                referrer,
                saleToken,
                saleToken,
                tokenAmount, // Original purchase amount
                referralReward,
                "REFERRAL"
            );
            
            emit ReferralRewardPaid(referrer, msg.sender, referralReward);
            
            // Return the original token amount (buyer doesn't get extra tokens)
            return tokenAmount;
        }
        
        // If no referrer, return the original token amount
        return tokenAmount;
    }
    
    // Helper function to update staker status
    function _updateStakerStatus(address user) internal {
        bool hasActiveStakes = false;
        for (uint i = 0; i < userStakes[user].length; i++) {
            if (userStakes[user][i].active) {
                hasActiveStakes = true;
                break;
            }
        }
        
        if (!hasActiveStakes && hasStaked[user]) {
            hasStaked[user] = false;
            totalStakers--;
        }
    }
    
    function _processPurchase(uint256 tokenAmount) internal {
        _ensureNotBlocked(msg.sender);
        IERC20 token = IERC20(saleToken);
        require(
            token.balanceOf(address(this)) >= tokenAmount,
            "Insufficient token balance"
        );

        _updateSales(msg.sender, tokenAmount);

        require(
            token.transfer(msg.sender, tokenAmount),
            "Token transfer failed"
        );
    }
    
    function _recordTransaction(
        address user,
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 amountOut,
        string memory transactionType
    ) internal {
        Transaction memory newTx = Transaction({
            timestamp: block.timestamp,
            user: user,
            tokenIn: tokenIn,
            tokenOut: tokenOut,
            amountIn: amountIn,
            amountOut: amountOut,
            transactionType: transactionType
        });
        
        userTransactions[user].push(newTx);
        allTransactions.push(newTx);
    }
    
    // View Functions
    
    function getUserTransactions(address user) external view returns (Transaction[] memory) {
        return userTransactions[user];
    }
    
    function getAllTransactions() external view returns (Transaction[] memory) {
        return allTransactions;
    }
    
    function getUserStakes(address user) external view returns (Stake[] memory) {
        return userStakes[user];
    }
    
    // Split the stake info function into two parts to avoid stack too deep error
    function getStakeInfo(uint256 stakeId) external view returns (
        uint256 id,
        address stakeOwnerAddr,
        uint256 amount,
        uint256 startTime
    ) {
        address stakeOwner = stakeOwners[stakeId];
        require(stakeOwner != address(0), "Stake does not exist");
        
        Stake memory userStake;
        bool found = false;
        
        for (uint i = 0; i < userStakes[stakeOwner].length; i++) {
            if (userStakes[stakeOwner][i].id == stakeId) {
                userStake = userStakes[stakeOwner][i];
                found = true;
                break;
            }
        }
        
        require(found, "Stake not found");
        
        return (
            userStake.id,
            stakeOwner,
            userStake.amount,
            userStake.startTime
        );
    }
    
    function getStakeDetails(uint256 stakeId) external view returns (
        uint256 lockPeriod,
        uint256 pendingRewards,
        bool active
    ) {
        address stakeOwner = stakeOwners[stakeId];
        require(stakeOwner != address(0), "Stake does not exist");
        
        Stake memory userStake;
        bool found = false;
        
        for (uint i = 0; i < userStakes[stakeOwner].length; i++) {
            if (userStakes[stakeOwner][i].id == stakeId) {
                userStake = userStakes[stakeOwner][i];
                found = true;
                break;
            }
        }
        
        require(found, "Stake not found");
        
        // Calculate current rewards
        uint256 rewards = calculateRewards(stakeId);
        
        return (
            userStake.lockPeriod,
            rewards,
            userStake.active
        );
    }
    
    function getContractInfo() external view returns (
        address tokenAddress,
        uint256 tokenBalance,
        uint256 currentUsdtPrice,        // Changed from bnbPrice
        uint256 initialUsdtPrice,        // Added initial USDT price
        uint256 totalSold,
        address usdtAddr,
        address usdcAddr,
        uint256 usdtPriceIncrementValue, // Changed from usdtTokenRatio
        uint256 stablecoinDecimalsValue  // Added stablecoin decimals
    ) {
        return (
            saleToken,
            IERC20(saleToken).balanceOf(address(this)),
            getCurrentPrice(address(0)),     // Current USDT price per token
            initialUsdtPricePerToken,        // Initial USDT price
            tokensSold,
            usdtAddress,
            usdcAddress,
            usdtPriceIncrement,              // USDT price increment amount
            stablecoinDecimals               // Stablecoin decimal precision
        );
    }
    
    function getStakingInfo() external view returns (
        uint256 baseApyRate,
        uint256 minStakingAmount,
        uint256 totalTokensStaked,
        uint256 totalRewardsPaid,
        uint256 numberOfStakers
    ) {
        return (
            baseAPY,
            minStakeAmount,
            totalStaked,
            totalRewardsDistributed,
            totalStakers
        );
    }
    
    function getUserStakingInfo(address user) external view returns (
        uint256 totalUserStaked,
        uint256 totalPendingRewards,
        uint256 activeStakesCount
    ) {
        uint256 staked = 0;
        uint256 rewards = 0;
        uint256 activeCount = 0;
        
        for (uint i = 0; i < userStakes[user].length; i++) {
            if (userStakes[user][i].active) {
                staked += userStakes[user][i].amount;
                rewards += calculateRewards(userStakes[user][i].id);
                activeCount++;
            }
        }
        
        return (staked, rewards, activeCount);
    }
    
    // Referral View Functions
    
    function getReferralInfo(address user) external view returns (
        address referrer,
        uint256 totalReferrals,
        uint256 totalRewardsEarned,
        uint256 rewardPercentage
    ) {
        return (
            referrers[user],
            referrals[user].length,
            referralRewards[user],
            referralRewardPercentage
        );
    }
    
    function getUserReferrals(address referrer) external view returns (address[] memory) {
        return referrals[referrer];
    }
    
    function getTokenBalances() external view returns (
        uint256 tokenBalance,
        uint256 usdtBalance,
        uint256 usdcBalance
    ) {
        return (
            IERC20(saleToken).balanceOf(address(this)),
            IERC20(usdtAddress).balanceOf(address(this)),
            IERC20(usdcAddress).balanceOf(address(this))
        );
    }

    function getTotalPenaltyCollected() external view returns (uint256) {
        return totalPenaltyCollected;
    }
    
    // Withdraw Function - Only for owner to extract tokens other than staked amounts
    
    function withdrawTokens(address _token, uint256 _amount) external onlyOwner {
        if (_token == saleToken) {
            uint256 availableBalance = IERC20(_token).balanceOf(address(this)) - totalStaked;
            require(_amount <= availableBalance, "Cannot withdraw staked tokens");
        }
        
        require(
            IERC20(_token).transfer(owner, _amount),
            "Transfer failed"
        );
    }
}