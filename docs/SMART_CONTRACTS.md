# Smart Contracts Documentation

## 📋 Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [SavitriCoin (ERC20 Token)](#savitricoin-erc20-token)
4. [TokenICO (ICO Contract)](#tokenico-ico-contract)
5. [Private Sale Distribution Contract](#private-sale-distribution-contract)
6. [Contract Interactions](#contract-interactions)
7. [Security Features](#security-features)
8. [Deployment Guide](#deployment-guide)

---

## Overview

The Savitri Network token sale system consists of three main smart contracts:

1. **SavitriCoin** - ERC20 token contract (600M total supply)
2. **TokenICO** - ICO contract for public sale (200M tokens) with dynamic pricing
3. **Private Sale Distribution** - Contract for private sale token distribution (participants already paid)

All contracts use **Gnosis Safe multisig** for owner operations, ensuring enhanced security through multi-signature requirements.

### Tokenomics Overview

**Total Supply**: 600,000,000 SAV (600M tokens)

| Category                        | Tokens   | % of Total | Description                                    |
| ------------------------------- | -------- | ---------- | ---------------------------------------------- |
| Seed                            | 60M      | **10%**    | Early investors with vesting                  |
| Private & Strategic             | 120M     | **20%**    | Private sale participants (already paid)       |
| Presale                         | 120M     | **20%**    | Presale allocation                            |
| Public Sale                     | 200M     | **33.3%**  | Public sale via TokenICO contract             |
| Community / Marketing / Airdrop | 100M     | **16.7%**  | Community rewards, marketing, ambassadors      |
| **Total**                       | **600M** | **100%**   |                                                |

**Recommended Vesting Schedule**:
- **Seed (10%)**: 9-12 months cliff, 24-36 months vesting
- **Private & Strategic (20%)**: 3-6 months cliff, 12-24 months vesting
- **Presale (20%)**: 0-3 months cliff, 6-12 months vesting
- **Public Sale (33.3%)**: No vesting (immediate liquidity)
- **Community (16.7%)**: Gradual distribution over time

---

## Architecture

```
┌─────────────────┐
│  Gnosis Safe    │  (Multisig Owner)
│  (5 of 5)       │
└────────┬────────┘
         │
         ├─────────────────┬──────────────────┐
         │                 │                  │
         ▼                 ▼                  ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ SavitriCoin │  │  TokenICO    │  │ Private Sale │
│             │  │              │  │ Distribution │
│ - 600M SAV  │  │ - Sells SAV  │  │              │
│ - Blocklist │  │ - Staking    │  │ - Private    │
│ - Transfer  │  │ - Referrals  │  │   Sale Dist. │
│   Control   │  │ - Public     │  │ - Merkle     │
│             │  │   Sale       │  │   validation │
└──────────────┘  └──────────────┘  └──────────────┘
```

### Contract Relationships

- **SavitriCoin** → Owned by Gnosis Safe, minted to deployer
- **TokenICO** → Owned by Gnosis Safe, receives SAV tokens for sale
- **Private Sale Distribution** → Owned by Gnosis Safe, receives SAV tokens for Private Sale distribution (participants already paid)

---

## SavitriCoin (ERC20 Token)

### Overview

Standard ERC20 token with additional security features for controlled distribution during ICO phase.

**Contract**: `SavitriCoin.sol`  
**Standard**: ERC20 + Ownable  
**Initial Supply**: 600,000,000 SAV (600M tokens)  
**Decimals**: 18

### Key Features

#### 1. **Blocklist System**
- Blocked addresses **cannot send** tokens
- Blocked addresses **can still receive** tokens
- Owner can add/remove addresses from blocklist

#### 2. **Transfer Control**
- Global `transfersEnabled` flag
- When disabled, only `allowedSenders` can transfer
- Owner can enable/disable transfers globally
- Owner can add addresses to `allowedSenders` list

#### 3. **Owner Functions**

```solidity
// Block/unblock an address from sending tokens
function setBlockStatus(address user, bool blocked) external onlyOwner

// Allow an address to transfer even when transfers are disabled
function setAllowedSender(address user, bool allowed) external onlyOwner

// Enable/disable global transfers
function setTransfersEnabled(bool enabled) external onlyOwner
```

### Use Cases

1. **ICO Phase**: Transfers disabled, only ICO contract can send tokens
2. **Security**: Block malicious addresses from sending tokens
3. **Compliance**: Control token flow during regulatory requirements

### Example Workflow

```javascript
// 1. Deploy token (all tokens minted to deployer)
const savitriToken = await SavitriCoin.deploy();

// 2. Transfer ownership to Gnosis Safe
await savitriToken.transferOwnership(safeAddress);

// 3. Allow ICO contract to transfer tokens
await savitriToken.connect(safeSigner).setAllowedSender(icoAddress, true);

// 4. Transfer tokens to ICO contract
await savitriToken.transfer(icoAddress, ethers.utils.parseEther("500000000"));

// 5. Block a malicious address
await savitriToken.connect(safeSigner).setBlockStatus(maliciousAddress, true);
```

---

## TokenICO (ICO Contract)

### Overview

Comprehensive ICO contract supporting multiple payment methods, staking, referrals, and private sale distribution.

**Contract**: `TokenICO.sol`  
**Owner**: Immutable (set at deployment, typically Gnosis Safe)  
**Sale Supply**: 200,000,000 SAV tokens (Public Sale)

### Core Functionalities

#### 1. **Token Purchasing**

Supports multiple payment methods:

- **BNB** (native BNB)
- **USDT** (Tether)
- **USDC** (USD Coin)
- **ETH** (Wrapped Ethereum)
- **BTC** (Wrapped Bitcoin)
- **SOL** (Wrapped Solana)

**Functions**:
```solidity
function buyWithBNB() external payable
function buyWithUSDT(uint256 usdtAmount) external
function buyWithUSDC(uint256 usdcAmount) external
function buyWithETH(uint256 ethAmount) external
function buyWithBTC(uint256 btcAmount) external
function buyWithSOL(uint256 solAmount) external
```

**Voucher-based purchases** (with whitelist + referral):
```solidity
function buyWithBNB_Voucher(WhitelistRef calldata v, bytes calldata sig) external payable
function buyWithUSDT_Voucher(WhitelistRef calldata v, bytes calldata sig, uint256 usdtAmount) external
// ... similar for other tokens
```

#### 2. **Dynamic Pricing**

- **Initial Price**: $0.018 per token
- **Price Cap**: Price stays at $0.018 until **120M tokens** are sold
- **Price Increase**: After 120M tokens sold, price increases by **$0.0025** every **30 days**
- **Maximum Price**: $0.025 per token
- Price increases automatically based on time elapsed (after 120M threshold)

**Price Calculation**:
```
if (tokensSold < 120M) {
    price = $0.018
} else {
    increments = (currentTime - priceIncreaseStartTime) / 30 days
    price = $0.018 + (increments * $0.0025)
    if (price > $0.025) {
        price = $0.025  // Cap at maximum
    }
}
```

**Pricing Stages**:

1. **Stage 1 (0 - 120M tokens sold)**: 
   - Price: **$0.018** per token
   - Fixed price regardless of time

2. **Stage 2 (120M+ tokens sold)**:
   - Price starts at **$0.018**
   - Increases by **$0.0025** every **30 days**
   - Maximum price: **$0.025** per token
   - Formula: `price = $0.018 + (increments * $0.0025)`, capped at $0.025

**Example Timeline**:
- 0-120M tokens sold: $0.018 (fixed)
- 120M+ tokens sold, 0-30 days: $0.018 (still at initial)
- 120M+ tokens sold, 0-30 days: $0.018 + $0.0025 = **$0.0205**
- 120M+ tokens sold, 30-60 days: $0.018 + ($0.0025 * 2) = **$0.023**
- 120M+ tokens sold, 60-90 days: $0.018 + ($0.0025 * 3) = **$0.0255** → capped at **$0.025** (maximum price reached)
- 120M+ tokens sold, 90+ days: **$0.025** (maximum price reached)

**Note**: The contract may need to be updated to implement this token-sold-based pricing logic. Current implementation uses time-based intervals.

**Functions**:
```solidity
function getCurrentPrice(address buyer) public view returns (uint256)
function getPriceInfo(address buyer) external view returns (
    uint256 currentPrice,
    uint256 nextPrice,
    uint256 stage
)
```

#### 3. **Staking System**

Users can stake SAV tokens to earn rewards.

**Lock Periods**:
- 30 days: Base APY (12%)
- 90 days: 1.5x APY (18%)
- 180 days: 2x APY (24%)
- 365 days: 3x APY (36%)

**Minimum Stake**: 100 SAV tokens

**Functions**:
```solidity
// Stake tokens
function stakeTokens(uint256 amount, uint256 lockPeriodDays) external

// Harvest rewards (without unstaking)
function harvestRewards(uint256 stakeId) external

// Unstake after lock period ends
function unstakeTokens(uint256 stakeId) external

// Unstake early (with 5% penalty)
function unstakeEarly(uint256 stakeId) external

// View functions
function getUserStakes(address user) external view returns (Stake[] memory)
function calculateRewards(uint256 stakeId) public view returns (uint256)
function getStakingInfo() external view returns (...)
```

**Reward Calculation**:
```
rewards = (amount * APY * timeElapsed) / (365 days * 100)
```

#### 4. **Referral System**

- Users can register a referrer
- Referrer earns **5%** of purchase amount (configurable, max 20%)
- Both referrer and referee are automatically waitlisted
- Supports voucher-based referral registration

**Functions**:
```solidity
// Register a referrer
function registerReferrer(address referrer) external

// Admin: Update referral percentage
function updateReferralPercentage(uint256 newPercentage) external onlyOwner

// View referral info
function getReferralInfo(address user) external view returns (...)
function getUserReferrals(address referrer) external view returns (address[] memory)
```

#### 5. **Private Sale (TokenICO Functions)**

**Note**: TokenICO has private sale functions, but the **separate Private Sale Distribution contract** is typically used for Private Sale distribution.

**TokenICO Private Sale Functions** (with allocation tracking):
- Tracks allocations per participant
- Enforces allocation limits
- More structured approach

**Private Sale Distribution Contract** (simpler, used for Private Sale):
- Participants already paid (off-chain)
- Just send tokens to addresses
- Optional Merkle tree validation
- See [Private Sale Distribution section](#private-sale-distribution-contract) for details

**TokenICO Private Sale Functions**:
```solidity
// Set allocation for participants
function setPrivateSaleAllocations(
    address[] calldata recipients,
    uint256[] calldata amounts
) external onlyOwner

// Distribute tokens in batches (with allocation checks)
function distributePrivateSaleBatch(
    address[] calldata recipients,
    uint256[] calldata amounts,
    string[] calldata reasons
) external onlyOwner

// Activate/deactivate private sale
function setPrivateSaleActive(bool active) external onlyOwner

// View private sale info
function getPrivateSaleInfo(address participant) external view returns (...)
```

**Batch Limit**: 100 recipients per batch (DoS protection)

#### 6. **Waitlist System**

- Waitlisted users get priority pricing (14-day intervals)
- Public users use 7-day intervals
- Can be set manually or via referral/voucher registration

**Functions**:
```solidity
function setWaitlisted(address user, bool status) external onlyOwner
```

#### 7. **Security Features**

##### Blocklist
- Blocked addresses cannot purchase or stake
- Owner can block/unblock addresses

##### Sweeper List
- Additional security layer for known malicious addresses

##### Delegation Checker
- Optional contract to check if address is delegated (e.g., from exchange)

##### Pause Mechanism
- Owner can pause all purchases and staking
- Emergency stop functionality

**Functions**:
```solidity
function setBlockStatus(address user, bool blocked) external onlyOwner
function setSweeper(address wallet, bool blocked) external onlyOwner
function setDelegationChecker(address checker) external onlyOwner
function pause() external onlyOwner
function unpause() external onlyOwner
```

#### 8. **Price Feed Validation**

All price feeds are validated for:
- **Staleness**: Data must be updated within 1 hour (3600 seconds)
- **Negative/Zero Values**: Invalid price data rejected
- **Incomplete Rounds**: Ensures data integrity

**Constants**:
```solidity
uint256 public constant PRICE_FEED_STALENESS_THRESHOLD = 3600; // 1 hour
```

#### 9. **Admin Functions**

**Configuration**:
```solidity
// Set sale token
function setSaleToken(address _token) external onlyOwner

// Configure payment tokens
function updateUSDT(address newAddress) external onlyOwner
function updateUSDC(address newAddress) external onlyOwner
function updateETH(address newAddress) external onlyOwner
function updateBTC(address newAddress) external onlyOwner
function updateSOL(address newAddress) external onlyOwner

// Set price feeds
function setBNBPriceFeed(address feed) external onlyOwner
function setETHPriceFeed(address feed) external onlyOwner
function setBTCPriceFeed(address feed) external onlyOwner
function setSOLPriceFeed(address feed) external onlyOwner

// Price configuration
function updateInitialUsdtPrice(uint256 newPrice) external onlyOwner
function updateUsdtPriceIncrement(uint256 newIncrement) external onlyOwner

// Sale timing
function setSaleStartTime(uint256 startTime) external onlyOwner
function setIntervals(uint256 waitInterval, uint256 publicIntervalSec) external onlyOwner

// Staking configuration
function updateBaseAPY(uint256 newAPY) external onlyOwner
function updateMinStakeAmount(uint256 newMinAmount) external onlyOwner

// Voucher signer
function setSigner(address _signer) external onlyOwner
```

**Withdrawal**:
```solidity
// Withdraw tokens (to owner)
function withdrawTokens(address _token, uint256 _amount) external onlyOwner

// Withdraw tokens (to specific address)
function withdrawTokensTo(address _token, uint256 _amount, address _recipient) external onlyOwner
```

**Note**: Cannot withdraw staked tokens.

#### 10. **View Functions**

```solidity
// Contract info
function getContractInfo() external view returns (...)
function getTokenBalances() external view returns (...)
function getStakingInfo() external view returns (...)
function getUserStakingInfo(address user) external view returns (...)

// Transaction history
function getUserTransactions(address user) external view returns (Transaction[] memory)
function getAllTransactions() external view returns (Transaction[] memory)

// Price info
function bnbRatio() public view returns (uint256)
function ethRatio() public view returns (uint256)
function btcRatio() public view returns (uint256)
function solRatio() public view returns (uint256)
```

### Purchase Flow Example

```javascript
// 1. User approves USDT spending
await usdtToken.approve(tokenICO.address, ethers.utils.parseUnits("100", 6));

// 2. User purchases tokens
await tokenICO.buyWithUSDT(100); // 100 USDT

// 3. Contract calculates tokens based on current price
// If price = $0.018 per token:
// tokens = (100 * 1e6 * 1e18) / (18 * 1e3) = ~5,555,555 tokens

// 4. If user has referrer, referrer gets 5% reward
// referrerReward = 285,714 * 5 / 100 = 14,285 tokens

// 5. Tokens transferred to buyer and referrer
```

### Staking Flow Example

```javascript
// 1. User approves SAV spending
await savitriToken.approve(tokenICO.address, ethers.utils.parseEther("1000"));

// 2. User stakes for 90 days
await tokenICO.stakeTokens(
    ethers.utils.parseEther("1000"),
    90 // 90 days lock period
);

// 3. After 30 days, user harvests rewards
await tokenICO.harvestRewards(stakeId);

// 4. After 90 days, user unstakes
await tokenICO.unstakeTokens(stakeId);
```

---

## Private Sale Distribution Contract

### Overview

**This contract is used for Private Sale token distribution.** Participants have already filled forms with their wallet addresses and paid for their tokens. This contract is used to send tokens to those participants.

Owner-controlled token distribution contract with optional Merkle tree validation for transparency.

**Contract**: `PrivateSaleDistribution.sol`  
**Purpose**: Private Sale token distribution (participants already paid)  
**Owner**: Immutable (set at deployment, typically Gnosis Safe)  
**Token**: Immutable (set at deployment, SavitriCoin address)

### Use Case

- Participants filled forms with wallet addresses
- Participants already paid money (off-chain)
- Owner needs to send tokens to these addresses
- Optional Merkle tree for transparency/verification

### Key Features

#### 1. **Owner-Controlled Distribution**

Only owner can send tokens. Users cannot claim tokens themselves.

#### 2. **Merkle Tree Validation (Optional)**

For transparency, owner can set a Merkle root. When distributing, proofs are validated against the root.

#### 3. **Batch Distribution**

Supports batch sending up to 100 recipients per transaction (DoS protection).

### Functions

#### Owner Functions

```solidity
// Set Merkle root (optional, for transparency)
function setMerkleRoot(bytes32 _merkleRoot) external onlyOwner

// Batch send with Merkle validation
function batchSend(
    address[] calldata recipients,
    uint256[] calldata amounts,
    bytes32[][] calldata merkleProofs
) external onlyOwner

// Batch send without Merkle validation
function batchSendDirect(
    address[] calldata recipients,
    uint256[] calldata amounts
) external onlyOwner

// Withdraw remaining tokens
function withdrawTokens(address to, uint256 amount) external onlyOwner
```

#### View Functions

```solidity
// Check if address received tokens
function hasReceived(address user) external view returns (bool)

// Get contract token balance
function getBalance() external view returns (uint256)
```

### Workflow Example

**Scenario**: Private Sale participants filled forms, paid money, now need tokens sent.

#### With Merkle Tree (Transparent)

```javascript
// 1. Generate Merkle tree from CSV (address,amount from forms)
// CSV format: address,amount
const merkleTree = generateMerkleTree(csvData);
const merkleRoot = merkleTree.getRoot();

// 2. Set Merkle root in contract (for transparency)
await privateSaleDistribution.setMerkleRoot(merkleRoot);

// 3. Transfer tokens to private sale distribution contract
await savitriToken.transfer(privateSaleDistribution.address, totalAmount);

// 4. Batch send with proofs (validates against Merkle root)
const recipients = [...]; // From forms
const amounts = [...];    // Calculated from payments
const proofs = recipients.map(addr => merkleTree.getProof(addr, amounts[index]));

await privateSaleDistribution.batchSend(recipients, amounts, proofs);
```

#### Without Merkle Tree (Direct - Simpler)

```javascript
// 1. Transfer tokens to private sale distribution contract
await savitriToken.transfer(privateSaleDistribution.address, totalAmount);

// 2. Batch send directly (no Merkle validation)
// Use this if you don't need Merkle tree transparency
await privateSaleDistribution.batchSendDirect(recipients, amounts);
```

### Security Features

- **Batch Limit**: Maximum 100 recipients per transaction
- **Duplicate Prevention**: `sent` mapping prevents double-sending
- **Owner-Only**: Only owner can send tokens
- **Merkle Validation**: Optional proof validation for transparency

---

## Contract Interactions

### Deployment Sequence

```
1. Deploy SavitriCoin
   └─> 600M tokens minted to deployer
   └─> Transfer ownership to Gnosis Safe

2. Deploy TokenICO
   └─> Owner = Gnosis Safe address
   └─> Configure via Safe:
       - setSaleToken(savitriToken.address)
       - setBNBPriceFeed(...)
       - setSaleStartTime(...)
       - etc.

3. Fund TokenICO
   └─> savitriToken.transfer(tokenICO.address, 200M tokens) // Public sale allocation
   └─> savitriToken.setAllowedSender(tokenICO.address, true)

4. Deploy Private Sale Distribution
   └─> Owner = Gnosis Safe address
   └─> Token = savitriToken.address
   └─> Fund via Safe:
       - savitriToken.transfer(privateSaleDistribution.address, amount)
```

### Token Flow

```
SavitriCoin (Owner: Safe)
    │
    ├─> Transfer to TokenICO (for sale)
    │   └─> Users buy → receive SAV tokens
    │
    └─> Transfer to Private Sale Distribution (for distribution)
        └─> Owner sends → recipients receive SAV tokens
```

### Purchase Flow

```
User
  │
  ├─> Approve payment token (USDT/USDC/etc.)
  │
  ├─> Call buyWith*() function
  │   │
  │   ├─> Payment → Owner (Safe)
  │   │
  │   ├─> Calculate tokens (based on price)
  │   │
  │   ├─> Process referral (if exists)
  │   │   └─> Referrer gets 5% reward
  │   │
  │   └─> Transfer SAV tokens to buyer
  │
  └─> Receive SAV tokens
```

### Staking Flow

```
User
  │
  ├─> Approve SAV tokens
  │
  ├─> Call stakeTokens()
  │   └─> SAV tokens → TokenICO contract
  │
  ├─> Earn rewards over time
  │   └─> Call harvestRewards() to claim
  │
  └─> Call unstakeTokens() after lock period
      └─> Receive principal + rewards
```

---

## Security Features

### 1. **Multisig Ownership**

All contracts owned by Gnosis Safe (5 of 5 multisig):
- No single point of failure
- Requires 3+ signatures for any owner operation
- Enhanced security for critical functions

### 2. **Access Control**

- `onlyOwner` modifier on all admin functions
- Immutable owner (cannot be changed after deployment)
- Blocklist prevents malicious addresses

### 3. **Pause Mechanism**

- Emergency stop for all purchases and staking
- Owner can pause/unpause contract
- Protects against attacks or bugs

### 4. **Price Feed Validation**

- Staleness check (1 hour threshold)
- Negative/zero value rejection
- Incomplete round detection

### 5. **DoS Protection**

- Batch size limits (100 recipients max)
- Gas optimization in loops
- Efficient data structures

### 6. **Reentrancy Protection**

- Checks-Effects-Interactions pattern
- No external calls before state updates
- Safe token transfers

### 7. **Input Validation**

- Zero address checks
- Amount validation
- Array length matching
- Nonce validation for vouchers

### 8. **Token Safety**

- Cannot withdraw staked tokens
- Blocklist prevents malicious transfers
- Transfer control during ICO phase

---

## Deployment Guide

### Prerequisites

1. **Gnosis Safe** created and funded
2. **Price Feeds** deployed (or use Chainlink)
3. **Payment Tokens** addresses (USDT, USDC, etc.)
4. **Signer Address** for vouchers

### Step 1: Deploy SavitriCoin

```javascript
const SavitriCoin = await ethers.getContractFactory("SavitriCoin");
const savitriToken = await SavitriCoin.deploy();
await savitriToken.deployed();

// Transfer ownership to Safe
await savitriToken.transferOwnership(safeAddress);
```

### Step 2: Deploy TokenICO

```javascript
const TokenICO = await ethers.getContractFactory("TokenICO");
const tokenICO = await TokenICO.deploy();
await tokenICO.deployed();

// Note: Owner is set to deployer, transfer to Safe via Safe interface
```

### Step 3: Configure TokenICO via Safe

```javascript
// Set sale token
await tokenICO.connect(safeSigner).setSaleToken(savitriToken.address);

// Set price feeds
await tokenICO.connect(safeSigner).setBNBPriceFeed(bnbPriceFeedAddress);
await tokenICO.connect(safeSigner).setETHPriceFeed(ethPriceFeedAddress);
// ... etc

// Configure payment tokens
await tokenICO.connect(safeSigner).updateUSDT(usdtAddress);
await tokenICO.connect(safeSigner).updateUSDC(usdcAddress);
// ... etc

// Set sale start time
await tokenICO.connect(safeSigner).setSaleStartTime(startTimestamp);

// Set signer for vouchers
await tokenICO.connect(safeSigner).setSigner(signerAddress);
```

### Step 4: Fund TokenICO

```javascript
// Transfer tokens to ICO
await savitriToken.transfer(
    tokenICO.address,
    ethers.utils.parseEther("500000000")
);

// Allow ICO to transfer tokens
await savitriToken.connect(safeSigner).setAllowedSender(tokenICO.address, true);
```

### Step 5: Deploy Private Sale Distribution

```javascript
const PrivateSaleDistribution = await ethers.getContractFactory("PrivateSaleDistribution");
const privateSaleDistribution = await PrivateSaleDistribution.deploy(savitriToken.address);
await privateSaleDistribution.deployed();
```

### Step 6: Fund Private Sale Distribution (when needed)

```javascript
// Transfer tokens to private sale distribution
await savitriToken.transfer(
    privateSaleDistribution.address,
    ethers.utils.parseEther("10000000")
);
```

### Important Notes

1. **Always deploy via Gnosis Safe** for production
2. **Test thoroughly** on testnet before mainnet
3. **Verify contracts** on block explorer
4. **Keep private keys secure** (use hardware wallets)
5. **Monitor contracts** after deployment

---

## Constants & Limits

### TokenICO

- **Public Sale Supply**: 200,000,000 SAV (33.3% of total supply)
- **Price Threshold**: 120,000,000 SAV (price stays at $0.018 until this amount is sold)
- **Initial Price**: $0.018 per token
- **Price Increment**: $0.0025 every 30 days (after 120M threshold)
- **Maximum Price**: $0.025 per token
- **Waitlist Allocation**: 2,000,000 SAV
- **Max Batch Size**: 100 recipients
- **Price Feed Staleness**: 3600 seconds (1 hour)
- **Min Stake Amount**: 100 SAV
- **Base APY**: 12%
- **Early Withdrawal Penalty**: 5%
- **Max Referral Percentage**: 20%

### Private Sale Distribution

- **Allocation**: 120,000,000 SAV (20% of total supply) - for private sale participants who have already paid
- **Max Batch Size**: 100 recipients

### SavitriCoin

- **Total Supply**: 600,000,000 SAV
- **Decimals**: 18
- **Token Allocation Breakdown**:
  - Seed: 60M (10%)
  - Private & Strategic: 120M (20%)
  - Presale: 120M (20%)
  - Public Sale: 200M (33.3%)
  - Community/Marketing/Airdrop: 100M (16.7%)

---

## Events

### TokenICO Events

```solidity
event TokensPurchased(address indexed buyer, address indexed paymentMethod, ...)
event Staked(address indexed user, uint256 indexed stakeId, ...)
event Unstaked(address indexed user, uint256 indexed stakeId, ...)
event RewardHarvested(address indexed user, uint256 indexed stakeId, ...)
event ReferralRegistered(address indexed referrer, address indexed referee)
event ReferralRewardPaid(address indexed referrer, address indexed referee, ...)
event PrivateSaleDistributed(address indexed recipient, uint256 amount, ...)
event Paused(address account)
event Unpaused(address account)
```

### SavitriCoin Events

```solidity
event AddressBlocked(address indexed user, bool blocked)
```

### Private Sale Distribution Events

```solidity
event MerkleRootUpdated(bytes32 indexed oldRoot, bytes32 indexed newRoot)
event TokensSent(address indexed recipient, uint256 amount)
event TokensWithdrawn(address indexed to, uint256 amount)
```

---

## Testing

All contracts have comprehensive test coverage:

- **Purchase tests**: All payment methods
- **Staking tests**: All lock periods and edge cases
- **Referral tests**: Registration and rewards
- **Security tests**: Blocklist, pause, access control
- **Private sale tests**: Allocation and distribution
- **Private Sale Distribution tests**: Batch sending and Merkle validation

Run tests:
```bash
cd web3
npm test
```

---

## Support & Resources

- **Contract Addresses**: Check deployment scripts
- **ABI Files**: `web3/artifacts/contracts/`
- **Test Files**: `web3/test/`
- **Deployment Scripts**: `web3/scripts/`

---

## Version History

- **v1.0**: Initial deployment
  - SavitriCoin with blocklist
  - TokenICO with multi-payment support
  - Private Sale Distribution with Merkle validation

---

**Last Updated**: 2024  
**Solidity Version**: ^0.8.0  
**License**: MIT

