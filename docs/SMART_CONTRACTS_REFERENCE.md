# Smart Contracts Reference Guide

Complete documentation for all three main smart contracts in the Savitri Network token sale system.

---

## 📋 Table of Contents

1. [SavitriCoin (ERC20 Token)](#1-savitricoin-erc20-token)
2. [TokenICO (ICO Contract)](#2-tokenico-ico-contract)
3. [PrivateSaleDistribution (Private Sale Distribution)](#3-privatesaledistribution-private-sale-distribution)

---

## 1. SavitriCoin (ERC20 Token)

### Overview

**Contract File**: `web3/contracts/mock/SavitriCoin.sol`  
**Standard**: ERC20 + Ownable (OpenZeppelin)  
**Total Supply**: 600,000,000 SAV (600M tokens)  
**Decimals**: 18  
**Owner**: Gnosis Safe Multisig (5 of 5)

### Purpose

The main ERC20 token contract for Savitri Coin (SAV). Provides standard token functionality with additional security features for controlled distribution during the ICO phase.

### Key Features

#### 1. Blocklist System
- Blocked addresses **cannot send** tokens
- Blocked addresses **can still receive** tokens
- Useful for blocking malicious addresses or complying with regulatory requirements

#### 2. Transfer Control
- Global `transfersEnabled` flag
- When disabled, only `allowedSenders` can transfer
- Allows controlled token distribution during ICO

#### 3. Allowed Senders
- Owner can whitelist specific addresses to transfer even when transfers are disabled
- Used to allow ICO contract and other authorized contracts to operate

### State Variables

- **blockedAddresses**: Mapping of addresses blocked from sending tokens
- **allowedSenders**: Mapping of addresses allowed to transfer when transfers are disabled
- **transfersEnabled**: Global flag to enable/disable all token transfers

### Functions

#### Owner Functions (onlyOwner)

**setBlockStatus(address user, bool blocked)**
- Block or unblock an address from sending tokens
- Parameters: `user` - Address to block/unblock, `blocked` - true to block, false to unblock

**setAllowedSender(address user, bool allowed)**
- Allow an address to transfer even when transfers are disabled
- Parameters: `user` - Address to allow/disallow, `allowed` - true to allow, false to disallow

**setTransfersEnabled(bool enabled)**
- Enable or disable global token transfers
- Parameters: `enabled` - true to enable transfers, false to disable

#### Standard ERC20 Functions

All standard ERC20 functions are available:
- **transfer(address to, uint256 amount)**: Transfer tokens to another address
- **transferFrom(address from, address to, uint256 amount)**: Transfer tokens on behalf of another address
- **approve(address spender, uint256 amount)**: Approve an address to spend tokens
- **balanceOf(address account)**: Get token balance of an address
- **totalSupply()**: Get total token supply
- **allowance(address owner, address spender)**: Get approved spending amount

### Events

- **AddressBlocked(address indexed user, bool blocked)**: Emitted when an address is blocked or unblocked

### Security Notes

- Owner is immutable after deployment (via `transferOwnership`)
- Transfers can be globally disabled for security
- Blocklist prevents malicious addresses from sending tokens
- All owner functions require Gnosis Safe multisig approval

---

## 2. TokenICO (ICO Contract)

### Overview

**Contract File**: `web3/contracts/TokenICO.sol`  
**Owner**: Immutable (set at deployment, typically Gnosis Safe)  
**Sale Supply**: 200,000,000 SAV tokens (Public Sale - 33.3% of total supply)  
**Waitlist Allocation**: 2,000,000 SAV tokens

### Purpose

Comprehensive ICO contract supporting multiple payment methods, dynamic pricing, staking, referrals, and private sale distribution.

### Key Features

1. **Multi-Payment Support**: BNB, USDT, USDC, ETH, BTC, SOL
2. **Dynamic Pricing**: Price increases based on tokens sold and time
3. **Staking System**: Lock tokens for rewards (12% APY base)
4. **Referral System**: Earn rewards for referring buyers
5. **Private Sale Distribution**: Admin-controlled distribution
6. **Pause Mechanism**: Emergency pause/unpause functionality
7. **Blocklist**: Block addresses from purchasing
8. **Voucher System**: Whitelist + referral vouchers

### State Variables

- **owner**: Contract owner (Gnosis Safe, immutable)
- **saleToken**: SAV token address
- **tokensSold**: Total tokens sold
- **waitlistSold**: Tokens sold to waitlist
- **paused**: Pause flag for emergency stops

### Pricing Configuration

- **Initial Price**: $0.018 per token
- **Price Cap**: Stays at $0.018 until **120M tokens** are sold
- **Price Increase**: After 120M, increases by **$0.0025** every **30 days**
- **Maximum Price**: $0.025 per token

### Functions

#### Purchase Functions

**buyWithBNB()**
- Buy tokens with native BNB
- Payable function - send BNB with the transaction

**buyWithUSDT(uint256 usdtAmount)**
- Buy tokens with USDT
- Parameters: `usdtAmount` - Amount of USDT to spend (in USDT decimals, typically 6)
- Requires approval before calling

**buyWithUSDC(uint256 usdcAmount)**
- Buy tokens with USDC
- Parameters: `usdcAmount` - Amount of USDC to spend (in USDC decimals, typically 6)
- Requires approval before calling

**buyWithETH(uint256 ethAmount)**
- Buy tokens with wrapped ETH
- Parameters: `ethAmount` - Amount of ETH to spend
- Requires approval before calling

**buyWithBTC(uint256 btcAmount)**
- Buy tokens with wrapped BTC
- Parameters: `btcAmount` - Amount of BTC to spend
- Requires approval before calling

**buyWithSOL(uint256 solAmount)**
- Buy tokens with wrapped SOL
- Parameters: `solAmount` - Amount of SOL to spend
- Requires approval before calling

#### Voucher-Based Purchases (Whitelist + Referral)

**buyWithBNB_Voucher(WhitelistRef v, bytes sig)**
- Buy with BNB using voucher (whitelist + referral)
- Parameters: `v` - Voucher containing whitelist and referral info, `sig` - Signature of the voucher
- Payable function - send BNB with the transaction

Similar functions available for other payment methods: `buyWithUSDT_Voucher`, `buyWithUSDC_Voucher`, `buyWithETH_Voucher`, `buyWithBTC_Voucher`, `buyWithSOL_Voucher`

#### Staking Functions

**stakeTokens(uint256 amount, uint256 lockPeriodDays)**
- Stake tokens for rewards
- Parameters: `amount` - Amount of tokens to stake, `lockPeriodDays` - Lock period in days (30, 60, 90, 180, 365)
- Requires approval before calling
- Returns stake ID

**harvestRewards(uint256 stakeId)**
- Harvest staking rewards
- Parameters: `stakeId` - ID of the stake
- Rewards are added to user's balance

**unstake(uint256 stakeId)**
- Unstake tokens (with penalty if before lock period)
- Parameters: `stakeId` - ID of the stake
- Early withdrawal penalty: 5%

**getStakeInfo(address user, uint256 stakeId)**
- Get stake information
- Parameters: `user` - User address, `stakeId` - Stake ID
- Returns: StakeInfo struct with stake details (amount, start time, lock period, pending rewards, etc.)

#### Referral Functions

**registerReferrer(address referrer)**
- Register a referrer
- Parameters: `referrer` - Address of the referrer
- Can only register once per user

**getReferralInfo(address user)**
- Get referral information
- Parameters: `user` - User address
- Returns: `totalReferrals` - Total number of referrals, `totalRewards` - Total rewards earned

#### Admin Functions (onlyOwner)

**setSaleToken(address _token)**
- Set the sale token address
- Parameters: `_token` - SAV token address

**updateUSDT(address _usdt)**, **updateUSDC(address _usdc)**, **updateETH(address _eth)**, **updateBTC(address _btc)**, **updateSOL(address _sol)**
- Update payment token addresses
- Parameters: Token address for each payment method

**setBNBPriceFeed(address _feed)**, **setETHPriceFeed(address _feed)**, **setBTCPriceFeed(address _feed)**, **setSOLPriceFeed(address _feed)**
- Set price feed oracles
- Parameters: Price feed address for each cryptocurrency

**updateInitialUsdtPrice(uint256 newPrice)**
- Update initial USDT price per token
- Parameters: `newPrice` - New price (in USDT decimals)

**setBlockStatus(address user, bool blocked)**
- Block/unblock an address from purchasing
- Parameters: `user` - Address to block/unblock, `blocked` - true to block, false to unblock

**pause()**
- Pause the contract (emergency)
- Stops all purchase and staking functions

**unpause()**
- Unpause the contract
- Resumes all contract functions

**setSaleStartTime(uint256 _startTime)**
- Set sale start time
- Parameters: `_startTime` - Unix timestamp

**setWaitlisted(address user, bool status)**
- Add/remove addresses from waitlist
- Parameters: `user` - Address to modify, `status` - true to add to waitlist, false to remove

**setPrivateSaleAllocations(address[] recipients, uint256[] amounts)**
- Set private sale allocations
- Parameters: `recipients` - Array of recipient addresses, `amounts` - Array of allocation amounts

**distributePrivateSaleBatch(address[] recipients, uint256[] amounts, string[] reasons)**
- Distribute private sale tokens
- Parameters: `recipients` - Array of recipient addresses, `amounts` - Array of amounts to distribute, `reasons` - Array of distribution reasons

**withdrawTokens(address _token, uint256 _amount)**
- Withdraw tokens from contract
- Parameters: `_token` - Token address (or address(0) for native), `_amount` - Amount to withdraw

**withdrawTokensTo(address _token, uint256 _amount, address _recipient)**
- Withdraw tokens from contract to specific address
- Parameters: `_token` - Token address, `_amount` - Amount to withdraw, `_recipient` - Recipient address

### Staking Details

- **Minimum Stake**: 100 SAV
- **Base APY**: 12%
- **Lock Periods**: 30, 60, 90, 180, 365 days
- **Early Withdrawal Penalty**: 5%
- **Reward Calculation**: Based on lock period and time staked

### Referral System

- **Max Referral Percentage**: 20%
- **Referral Reward**: Percentage of purchase amount (configurable)
- **Registration**: Users can register referrers
- **Tracking**: Total referrals and rewards tracked per user

### Events

- **TokensPurchased**: Emitted when tokens are purchased (buyer, payment method, amount paid, tokens received, timestamp)
- **Staked**: Emitted when tokens are staked (user, stake ID, amount, lock period)
- **Unstaked**: Emitted when tokens are unstaked (user, stake ID, amount)
- **RewardHarvested**: Emitted when rewards are harvested (user, stake ID, reward)
- **ReferralRegistered**: Emitted when a referrer is registered (referrer, referee)
- **ReferralRewardPaid**: Emitted when referral reward is paid (referrer, referee, amount)
- **PrivateSaleDistributed**: Emitted when private sale tokens are distributed (recipient, amount, reason)
- **Paused**: Emitted when contract is paused (account)
- **Unpaused**: Emitted when contract is unpaused (account)

### Security Notes

- Owner is immutable (set at deployment)
- Price feeds validated for staleness (1 hour threshold)
- DoS protection via batch size limits (100 recipients max)
- Pause mechanism for emergencies
- Blocklist prevents malicious addresses from purchasing

---

## 3. PrivateSaleDistribution (Private Sale Distribution)

### Overview

**Contract File**: `web3/contracts/PrivateSaleDistribution.sol`  
**Owner**: Immutable (set at deployment, typically Gnosis Safe)  
**Allocation**: 120,000,000 SAV tokens (20% of total supply)  
**Purpose**: Distribute tokens to private sale participants who have already paid

### Purpose

Owner-controlled contract for distributing tokens to private sale participants. Participants have already filled forms and paid. This contract sends tokens to their addresses. Supports Merkle tree validation for transparency.

### Key Features

1. **Owner-Controlled Distribution**: Only owner can send tokens
2. **Merkle Tree Validation**: Optional Merkle proof validation for transparency
3. **Batch Operations**: Send to multiple recipients in one transaction
4. **DoS Protection**: Maximum 100 recipients per batch
5. **Tracking**: Tracks which addresses have received tokens

### State Variables

- **owner**: Contract owner (Gnosis Safe, immutable)
- **token**: SAV token address (immutable)
- **merkleRoot**: Merkle root for validation (optional)
- **sent**: Mapping tracking which addresses have received tokens

### Functions

#### Owner Functions (onlyOwner)

**setMerkleRoot(bytes32 _merkleRoot)**
- Set the Merkle root for distribution (optional, for transparency)
- Parameters: `_merkleRoot` - The Merkle root of the distribution tree

**batchSend(address[] recipients, uint256[] amounts, bytes32[][] merkleProofs)**
- Batch send tokens with Merkle proof validation
- Parameters: `recipients` - Array of recipient addresses, `amounts` - Array of amounts to send, `merkleProofs` - Array of Merkle proofs for validation
- Requires Merkle root to be set
- Validates each recipient against Merkle tree

**batchSendDirect(address[] recipients, uint256[] amounts)**
- Batch send tokens without Merkle validation (for trusted distribution)
- Parameters: `recipients` - Array of recipient addresses, `amounts` - Array of amounts to send
- Faster than batchSend but without Merkle validation

**withdrawTokens(address to, uint256 amount)**
- Withdraw tokens from contract
- Parameters: `to` - Recipient address, `amount` - Amount to withdraw

**hasReceived(address recipient)**
- Check if address has received tokens
- Parameters: `recipient` - Address to check
- Returns: true if tokens were sent, false otherwise

### Events

- **MerkleRootUpdated**: Emitted when Merkle root is updated (old root, new root)
- **TokensSent**: Emitted when tokens are sent to a recipient (recipient, amount)
- **TokensWithdrawn**: Emitted when tokens are withdrawn from contract (to, amount)

### Merkle Tree Workflow

1. **Generate CSV**: Create CSV with recipient addresses and amounts
2. **Generate Merkle Tree**: Use script to generate Merkle tree and root
3. **Set Root**: Call `setMerkleRoot()` with the generated root
4. **Generate Proofs**: For each recipient, generate Merkle proof
5. **Batch Send**: Call `batchSend()` with recipients, amounts, and proofs

### Security Notes

- Owner is immutable (set at deployment)
- Maximum 100 recipients per batch (DoS protection)
- Merkle validation ensures transparency
- Each address can only receive tokens once (tracked via `sent` mapping)
- All owner functions require Gnosis Safe multisig approval

---

## Contract Interactions

### Deployment Flow

1. **Deploy SavitriCoin**
   - All 600M tokens minted to deployer
   - Transfer ownership to Gnosis Safe

2. **Deploy TokenICO**
   - Owner set to Gnosis Safe at deployment
   - Set sale token address
   - Configure payment tokens and price feeds

3. **Deploy PrivateSaleDistribution**
   - Owner set to Gnosis Safe at deployment
   - Set token address

4. **Fund Contracts**
   - Transfer 200M SAV to TokenICO (public sale)
   - Transfer 120M SAV to PrivateSaleDistribution (private sale)
   - Remaining 280M managed by Gnosis Safe

### Token Flow

SavitriCoin (600M total) distributes tokens as follows:
- TokenICO (200M) → Buyers (Public Sale)
- PrivateSaleDistribution (120M) → Private Sale Participants
- Gnosis Safe (280M) → Seed, Presale, Community, Marketing

---

## Constants & Limits

### SavitriCoin
- **Total Supply**: 600,000,000 SAV
- **Decimals**: 18

### TokenICO
- **Public Sale Supply**: 200,000,000 SAV
- **Waitlist Allocation**: 2,000,000 SAV
- **Price Threshold**: 120,000,000 SAV (price stays at $0.018 until this)
- **Initial Price**: $0.018 per token
- **Price Increment**: $0.0025 every 30 days (after 120M)
- **Maximum Price**: $0.025 per token
- **Max Batch Size**: 100 recipients
- **Price Feed Staleness**: 3600 seconds (1 hour)
- **Min Stake Amount**: 100 SAV
- **Base APY**: 12%
- **Early Withdrawal Penalty**: 5%
- **Max Referral Percentage**: 20%

### PrivateSaleDistribution
- **Allocation**: 120,000,000 SAV (20% of total supply)
- **Max Batch Size**: 100 recipients

---

## Security Features

### All Contracts
- **Gnosis Safe Multisig**: All owner functions require multisig approval
- **Immutable Owner**: Owner cannot be changed after deployment
- **Access Control**: `onlyOwner` modifier on all admin functions

### SavitriCoin
- Blocklist system
- Transfer control
- Allowed senders whitelist

### TokenICO
- Pause mechanism
- Blocklist for purchases
- Price feed validation
- DoS protection (batch limits)
- Reentrancy protection (via OpenZeppelin)

### PrivateSaleDistribution
- DoS protection (batch limits)
- One-time distribution tracking
- Merkle validation for transparency

---

## Testing

All contracts have comprehensive test coverage:

- **Purchase tests**: All payment methods
- **Staking tests**: All lock periods and edge cases
- **Referral tests**: Registration and rewards
- **Security tests**: Blocklist, pause, access control
- **Private sale tests**: Allocation and distribution
- **Private Sale Distribution tests**: Batch sending and Merkle validation

Run tests from the web3 directory using npm test.

---

**Last Updated**: 2025  
**Solidity Version**: ^0.8.0  
**License**: MIT
