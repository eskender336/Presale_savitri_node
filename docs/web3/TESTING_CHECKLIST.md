# Complete Testing Checklist

This document lists all functionalities and edge cases that should be tested for the Presale system.

## 📋 Table of Contents

1. [TokenICO - Purchase Functions](#1-tokenico---purchase-functions)
2. [TokenICO - Staking System](#2-tokenico---staking-system)
3. [TokenICO - Referral System](#3-tokenico---referral-system)
4. [TokenICO - Private Sale](#4-tokenico---private-sale)
5. [TokenICO - Admin Functions](#5-tokenico---admin-functions)
6. [TokenICO - Security & Access Control](#6-tokenico---security--access-control)
7. [TokenICO - Price & Configuration](#7-tokenico---price--configuration)
8. [TokenICO - View Functions](#8-tokenico---view-functions)
9. [SavitriCoin Token](#9-savitricoin-token)
10. [Airdrop Contract](#10-airdrop-contract)
11. [Integration Tests](#11-integration-tests)
12. [Edge Cases & Error Handling](#12-edge-cases--error-handling)
13. [Gas Optimization Tests](#13-gas-optimization-tests)

---

## 1. TokenICO - Purchase Functions

### 1.1 Basic Purchase Functions

- [ ] **buyWithUSDT**
  - [ ] Successful purchase with valid amount
  - [ ] Purchase with zero amount (should fail)
  - [ ] Purchase when sale token not set (should fail)
  - [ ] Purchase when USDT not configured (should fail)
  - [ ] Purchase when contract paused (should fail)
  - [ ] Purchase when buyer is blocked (should fail)
  - [ ] Purchase exceeds sale supply (should fail)
  - [ ] Purchase exceeds waitlist allocation (for waitlisted users)
  - [ ] Purchase exceeds public allocation (for non-waitlisted users)
  - [ ] Verify tokens received by buyer
  - [ ] Verify USDT transferred to owner
  - [ ] Verify referral rewards (if applicable)
  - [ ] Verify transaction recorded

- [ ] **buyWithUSDC**
  - [ ] Same tests as buyWithUSDT
  - [ ] Verify USDC transferred correctly

- [ ] **buyWithBNB**
  - [ ] Successful purchase with BNB
  - [ ] Purchase with zero value (should fail)
  - [ ] Purchase when BNB price feed not set (should fail)
  - [ ] Purchase with stale price feed (should fail)
  - [ ] Purchase with invalid price feed (negative/zero) (should fail)
  - [ ] Verify BNB transferred to owner
  - [ ] Verify correct token calculation based on BNB price

- [ ] **buyWithETH**
  - [ ] Successful purchase with ETH token
  - [ ] Purchase when ETH address not configured (should fail)
  - [ ] Purchase when ETH price feed not set (should fail)
  - [ ] Verify ETH transferred to owner

- [ ] **buyWithBTC**
  - [ ] Successful purchase with BTC token
  - [ ] Purchase when BTC address not configured (should fail)
  - [ ] Purchase when BTC price feed not set (should fail)
  - [ ] Verify BTC transferred to owner

- [ ] **buyWithSOL**
  - [ ] Successful purchase with SOL token
  - [ ] Purchase when SOL address not configured (should fail)
  - [ ] Purchase when SOL price feed not set (should fail)
  - [ ] Verify SOL transferred to owner

### 1.2 Voucher Purchase Functions

- [ ] **buyWithBNB_Voucher**
  - [ ] Successful purchase with valid voucher
  - [ ] Purchase with invalid signature (should fail)
  - [ ] Purchase with expired voucher (should fail)
  - [ ] Purchase with used nonce (should fail)
  - [ ] Purchase with invalid referrer in voucher
  - [ ] Verify waitlist status set correctly
  - [ ] Verify referrer registered

- [ ] **buyWithUSDT_Voucher**
  - [ ] Same tests as buyWithBNB_Voucher
  - [ ] Verify USDT transferred correctly

- [ ] **buyWithUSDC_Voucher**
  - [ ] Same tests as buyWithBNB_Voucher
  - [ ] Verify USDC transferred correctly

- [ ] **buyWithETH_Voucher**
  - [ ] Same tests as buyWithBNB_Voucher
  - [ ] Verify ETH transferred correctly

- [ ] **buyWithBTC_Voucher**
  - [ ] Same tests as buyWithBNB_Voucher
  - [ ] Verify BTC transferred correctly

- [ ] **buyWithSOL_Voucher**
  - [ ] Same tests as buyWithBNB_Voucher
  - [ ] Verify SOL transferred correctly

### 1.3 Purchase Edge Cases

- [ ] **Price Calculation**
  - [ ] Verify price increases with each purchase
  - [ ] Verify price calculation for waitlisted users
  - [ ] Verify price calculation for non-waitlisted users
  - [ ] Verify price calculation at different sale stages
  - [ ] Verify price calculation with different payment methods

- [ ] **Sale Limits**
  - [ ] Purchase up to waitlist allocation limit
  - [ ] Purchase exceeds waitlist allocation (should fail)
  - [ ] Purchase up to total sale supply limit
  - [ ] Purchase exceeds total sale supply (should fail)
  - [ ] Purchase after sale supply exhausted (should fail)

- [ ] **Timing**
  - [ ] Purchase before sale start time (should fail)
  - [ ] Purchase after sale start time (should succeed)
  - [ ] Purchase during waitlist interval
  - [ ] Purchase during public interval

---

## 2. TokenICO - Staking System

### 2.1 Staking Functions

- [ ] **stakeTokens**
  - [ ] Successful staking with valid amount and period
  - [ ] Staking with amount below minimum (should fail)
  - [ ] Staking with zero amount (should fail)
  - [ ] Staking when contract paused (should fail)
  - [ ] Staking when user is blocked (should fail)
  - [ ] Staking when user has insufficient balance (should fail)
  - [ ] Staking with different lock periods
  - [ ] Multiple stakes by same user
  - [ ] Verify tokens locked in contract
  - [ ] Verify stake ID generation
  - [ ] Verify stake creation timestamp
  - [ ] Verify staker status updated

- [ ] **harvestRewards**
  - [ ] Harvest rewards from valid stake
  - [ ] Harvest from non-existent stake (should fail)
  - [ ] Harvest from other user's stake (should fail)
  - [ ] Harvest when user is blocked (should fail)
  - [ ] Harvest with zero rewards (should fail)
  - [ ] Harvest rewards at different time intervals
  - [ ] Verify rewards calculated correctly
  - [ ] Verify rewards transferred to user
  - [ ] Verify last harvest time updated
  - [ ] Multiple harvests from same stake

- [ ] **unstakeTokens**
  - [ ] Unstake after lock period expires
  - [ ] Unstake before lock period expires (should fail)
  - [ ] Unstake from non-existent stake (should fail)
  - [ ] Unstake from other user's stake (should fail)
  - [ ] Unstake when user is blocked (should fail)
  - [ ] Unstake with pending rewards (should harvest first)
  - [ ] Verify tokens returned to user
  - [ ] Verify stake removed from array
  - [ ] Verify staker status updated

- [ ] **unstakeEarly**
  - [ ] Early unstake with penalty
  - [ ] Early unstake from non-existent stake (should fail)
  - [ ] Early unstake from other user's stake (should fail)
  - [ ] Early unstake when user is blocked (should fail)
  - [ ] Verify penalty calculated correctly
  - [ ] Verify penalty collected by contract
  - [ ] Verify remaining tokens returned to user
  - [ ] Verify stake removed from array

### 2.2 Staking Calculations

- [ ] **calculateRewards**
  - [ ] Calculate rewards for different stake amounts
  - [ ] Calculate rewards for different lock periods
  - [ ] Calculate rewards at different time points
  - [ ] Calculate rewards with different APY
  - [ ] Calculate rewards after partial harvest
  - [ ] Verify compound interest calculation
  - [ ] Verify rewards don't exceed stake amount

- [ ] **APY Updates**
  - [ ] Update APY by owner
  - [ ] Update APY affects existing stakes
  - [ ] Update APY affects new stakes
  - [ ] Update APY by non-owner (should fail)

- [ ] **Minimum Stake**
  - [ ] Update minimum stake amount by owner
  - [ ] Staking below new minimum (should fail)
  - [ ] Existing stakes below new minimum (should still work)

---

## 3. TokenICO - Referral System

### 3.1 Referral Registration

- [ ] **registerReferrer**
  - [ ] Successful referral registration
  - [ ] Register when user is blocked (should fail)
  - [ ] Register when contract paused (should fail)
  - [ ] Register same referrer twice (should fail)
  - [ ] Register with zero address (should fail)
  - [ ] Verify referrer registered
  - [ ] Verify referral count updated

- [ ] **Voucher-based Referral**
  - [ ] Purchase with valid referral voucher
  - [ ] Purchase with invalid referral voucher (should fail)
  - [ ] Purchase with expired referral voucher (should fail)
  - [ ] Verify referrer registered via voucher
  - [ ] Verify referral rewards calculated

### 3.2 Referral Rewards

- [ ] **Reward Calculation**
  - [ ] Calculate referral rewards correctly
  - [ ] Referral rewards with different percentages
  - [ ] Referral rewards for multiple purchases
  - [ ] Referral rewards for different payment methods
  - [ ] Verify rewards accumulated correctly
  - [ ] Verify rewards paid to referrer

- [ ] **Referral Percentage**
  - [ ] Update referral percentage by owner
  - [ ] Update affects future purchases
  - [ ] Update doesn't affect past purchases
  - [ ] Update by non-owner (should fail)

### 3.3 Referral Tracking

- [ ] **Referral Lists**
  - [ ] Get referrals for referrer
  - [ ] Get referrals for non-referrer (empty list)
  - [ ] Multiple referrals by same referrer
  - [ ] Verify referral count correct

---

## 4. TokenICO - Private Sale

### 4.1 Private Sale Allocation

- [ ] **setPrivateSaleAllocations**
  - [ ] Set allocations for multiple recipients
  - [ ] Set allocations with batch size limit
  - [ ] Set allocations exceeding batch limit (should fail)
  - [ ] Set allocations with mismatched arrays (should fail)
  - [ ] Set allocations by non-owner (should fail)
  - [ ] Update existing allocations
  - [ ] Verify allocations set correctly

- [ ] **setPrivateSaleTotalAllocated**
  - [ ] Set total allocated amount by owner
  - [ ] Set total below current allocations (should fail)
  - [ ] Set total by non-owner (should fail)
  - [ ] Verify total allocated updated

- [ ] **setPrivateSaleActive**
  - [ ] Activate private sale by owner
  - [ ] Deactivate private sale by owner
  - [ ] Set by non-owner (should fail)
  - [ ] Verify private sale status

### 4.2 Private Sale Distribution

- [ ] **distributePrivateSaleBatch**
  - [ ] Distribute to multiple recipients
  - [ ] Distribute with valid reasons
  - [ ] Distribute with batch size limit
  - [ ] Distribute exceeding batch limit (should fail)
  - [ ] Distribute exceeding allocation (should fail)
  - [ ] Distribute when private sale inactive (should fail)
  - [ ] Distribute by non-owner (should fail)
  - [ ] Distribute to same recipient twice (should fail)
  - [ ] Verify tokens distributed correctly
  - [ ] Verify distributed amount tracked
  - [ ] Verify reasons recorded

- [ ] **Private Sale Limits**
  - [ ] Distribute up to allocation limit
  - [ ] Distribute exceeding allocation (should fail)
  - [ ] Distribute exceeding total allocated (should fail)
  - [ ] Multiple distributions to same recipient

---

## 5. TokenICO - Admin Functions

### 5.1 Configuration Functions

- [ ] **setSaleToken**
  - [ ] Set sale token by owner
  - [ ] Set sale token by non-owner (should fail)
  - [ ] Set sale token to zero address (should fail)
  - [ ] Verify sale token updated

- [ ] **setSigner**
  - [ ] Set signer by owner
  - [ ] Set signer by non-owner (should fail)
  - [ ] Verify signer updated

- [ ] **setSaleStartTime**
  - [ ] Set sale start time by owner
  - [ ] Set sale start time by non-owner (should fail)
  - [ ] Set sale start time in past
  - [ ] Set sale start time in future
  - [ ] Verify sale start time updated

- [ ] **setIntervals**
  - [ ] Set waitlist and public intervals by owner
  - [ ] Set intervals by non-owner (should fail)
  - [ ] Set intervals with zero values
  - [ ] Verify intervals updated

### 5.2 Payment Token Configuration

- [ ] **updateUSDT / updateUSDC / updateETH / updateBTC / updateSOL**
  - [ ] Update payment token address by owner
  - [ ] Update by non-owner (should fail)
  - [ ] Update to zero address (should fail)
  - [ ] Verify payment token updated

### 5.3 Price Feed Configuration

- [ ] **setBNBPriceFeed / setETHPriceFeed / setBTCPriceFeed / setSOLPriceFeed**
  - [ ] Set price feed by owner
  - [ ] Set price feed by non-owner (should fail)
  - [ ] Set price feed to zero address (should fail)
  - [ ] Verify price feed updated

### 5.4 Price Configuration

- [ ] **updateInitialUsdtPrice**
  - [ ] Update initial price by owner
  - [ ] Update by non-owner (should fail)
  - [ ] Update with zero price (should fail)
  - [ ] Verify price updated

- [ ] **updateUsdtPriceIncrement**
  - [ ] Update price increment by owner
  - [ ] Update by non-owner (should fail)
  - [ ] Verify increment updated

### 5.5 Withdrawal Functions

- [ ] **withdrawTokens**
  - [ ] Withdraw tokens by owner
  - [ ] Withdraw tokens by non-owner (should fail)
  - [ ] Withdraw to zero address (should fail)
  - [ ] Withdraw more than balance (should fail)
  - [ ] Withdraw zero amount (should fail)
  - [ ] Verify tokens withdrawn to owner

- [ ] **withdrawTokensTo**
  - [ ] Withdraw tokens to specified recipient by owner
  - [ ] Withdraw by non-owner (should fail)
  - [ ] Withdraw to zero address (should fail)
  - [ ] Withdraw more than balance (should fail)
  - [ ] Verify tokens withdrawn to recipient

---

## 6. TokenICO - Security & Access Control

### 6.1 Blocking Functions

- [ ] **setBlockStatus**
  - [ ] Block address by owner
  - [ ] Unblock address by owner
  - [ ] Block by non-owner (should fail)
  - [ ] Block zero address (should fail)
  - [ ] Verify blocked address cannot purchase
  - [ ] Verify blocked address cannot stake
  - [ ] Verify blocked address cannot register referrer

- [ ] **setSweeper**
  - [ ] Add sweeper to list by owner
  - [ ] Remove sweeper from list by owner
  - [ ] Set by non-owner (should fail)
  - [ ] Verify sweeper cannot purchase
  - [ ] Verify sweeper cannot stake

- [ ] **setDelegationChecker**
  - [ ] Set delegation checker by owner
  - [ ] Set by non-owner (should fail)
  - [ ] Verify delegated wallets blocked
  - [ ] Verify non-delegated wallets allowed

### 6.2 Waitlist Management

- [ ] **setWaitlisted**
  - [ ] Add user to waitlist by owner
  - [ ] Remove user from waitlist by owner
  - [ ] Set by non-owner (should fail)
  - [ ] Verify waitlisted user can purchase
  - [ ] Verify waitlisted user gets priority pricing
  - [ ] Verify waitlist allocation limits

### 6.3 Pause Mechanism

- [ ] **pause**
  - [ ] Pause contract by owner
  - [ ] Pause when already paused (should fail)
  - [ ] Pause by non-owner (should fail)
  - [ ] Verify purchases blocked when paused
  - [ ] Verify staking blocked when paused
  - [ ] Verify referral registration blocked when paused

- [ ] **unpause**
  - [ ] Unpause contract by owner
  - [ ] Unpause when not paused (should fail)
  - [ ] Unpause by non-owner (should fail)
  - [ ] Verify purchases allowed after unpause
  - [ ] Verify staking allowed after unpause

---

## 7. TokenICO - Price & Configuration

### 7.1 Price Calculation

- [ ] **getCurrentPrice**
  - [ ] Get price for waitlisted user
  - [ ] Get price for non-waitlisted user
  - [ ] Get price at different sale stages
  - [ ] Get price after multiple purchases
  - [ ] Verify price increases correctly

- [ ] **getPriceInfo**
  - [ ] Get price info for user
  - [ ] Verify current price correct
  - [ ] Verify next price correct
  - [ ] Verify stage correct

### 7.2 Price Feed Validation

- [ ] **Price Feed Staleness**
  - [ ] Purchase with fresh price feed (should succeed)
  - [ ] Purchase with stale price feed (should fail)
  - [ ] Purchase with price feed older than threshold (should fail)
  - [ ] Verify staleness threshold enforced

- [ ] **Price Feed Validity**
  - [ ] Purchase with valid price feed (should succeed)
  - [ ] Purchase with negative price (should fail)
  - [ ] Purchase with zero price (should fail)
  - [ ] Purchase with incomplete round (should fail)
  - [ ] Verify price feed validation

---

## 8. TokenICO - View Functions

### 8.1 Transaction Views

- [ ] **getUserTransactions**
  - [ ] Get transactions for user with purchases
  - [ ] Get transactions for user without purchases (empty)
  - [ ] Verify transaction data correct
  - [ ] Verify transaction order

- [ ] **getAllTransactions**
  - [ ] Get all transactions
  - [ ] Verify all transactions included
  - [ ] Verify transaction data correct

### 8.2 Staking Views

- [ ] **getUserStakes**
  - [ ] Get stakes for user with stakes
  - [ ] Get stakes for user without stakes (empty)
  - [ ] Verify stake data correct

- [ ] **getStakeInfo**
  - [ ] Get info for valid stake
  - [ ] Get info for non-existent stake (should fail)
  - [ ] Verify stake info correct

- [ ] **getStakeDetails**
  - [ ] Get details for valid stake
  - [ ] Get details for non-existent stake (should fail)
  - [ ] Verify stake details correct

### 8.3 Contract Info Views

- [ ] **getContractInfo**
  - [ ] Get contract information
  - [ ] Verify all fields correct
  - [ ] Verify sale status correct

- [ ] **getStakingInfo**
  - [ ] Get staking information
  - [ ] Verify APY correct
  - [ ] Verify minimum stake correct

- [ ] **getUserStakingInfo**
  - [ ] Get staking info for user with stakes
  - [ ] Get staking info for user without stakes
  - [ ] Verify info correct

### 8.4 Referral Views

- [ ] **getReferralInfo**
  - [ ] Get referral info for referrer
  - [ ] Get referral info for non-referrer
  - [ ] Verify referral data correct

- [ ] **getUserReferrals**
  - [ ] Get referrals for referrer
  - [ ] Get referrals for non-referrer (empty)
  - [ ] Verify referral list correct

### 8.5 Balance Views

- [ ] **getTokenBalances**
  - [ ] Get token balances
  - [ ] Verify balances correct

- [ ] **getTotalPenaltyCollected**
  - [ ] Get total penalty collected
  - [ ] Verify penalty amount correct

- [ ] **getPrivateSaleInfo**
  - [ ] Get private sale info for participant
  - [ ] Get info for non-participant
  - [ ] Verify allocation correct
  - [ ] Verify distributed amount correct

---

## 9. SavitriCoin Token

### 9.1 Token Functions

- [ ] **setBlockStatus**
  - [ ] Block address by owner
  - [ ] Unblock address by owner
  - [ ] Block by non-owner (should fail)
  - [ ] Verify blocked address cannot send tokens
  - [ ] Verify blocked address can receive tokens

- [ ] **setAllowedSender**
  - [ ] Allow sender by owner
  - [ ] Disallow sender by owner
  - [ ] Set by non-owner (should fail)
  - [ ] Verify allowed sender can transfer when transfers disabled
  - [ ] Verify non-allowed sender cannot transfer when transfers disabled

- [ ] **setTransfersEnabled**
  - [ ] Enable transfers by owner
  - [ ] Disable transfers by owner
  - [ ] Set by non-owner (should fail)
  - [ ] Verify transfers work when enabled
  - [ ] Verify transfers blocked when disabled (except allowed senders)

### 9.2 Token Transfers

- [ ] **Standard Transfers**
  - [ ] Transfer when transfers enabled
  - [ ] Transfer when transfers disabled (should fail, unless allowed sender)
  - [ ] Transfer from blocked address (should fail)
  - [ ] Transfer to blocked address (should succeed)
  - [ ] Transfer with insufficient balance (should fail)
  - [ ] Transfer zero amount (should fail)

---

## 10. Airdrop Contract

### 10.1 Merkle Root

- [ ] **setMerkleRoot**
  - [ ] Set Merkle root by owner
  - [ ] Set Merkle root by non-owner (should fail)
  - [ ] Update Merkle root
  - [ ] Verify Merkle root updated

### 10.2 Batch Send with Merkle

- [ ] **batchSend**
  - [ ] Send with valid Merkle proofs
  - [ ] Send without Merkle root set (should fail)
  - [ ] Send with invalid Merkle proof (should fail)
  - [ ] Send with mismatched arrays (should fail)
  - [ ] Send with batch size exceeding limit (should fail)
  - [ ] Send to zero address (should fail)
  - [ ] Send zero amount (should fail)
  - [ ] Send to same recipient twice (should fail)
  - [ ] Send by non-owner (should fail)
  - [ ] Verify tokens sent correctly
  - [ ] Verify sent status updated

### 10.3 Batch Send Direct

- [ ] **batchSendDirect**
  - [ ] Send without Merkle validation
  - [ ] Send with mismatched arrays (should fail)
  - [ ] Send with batch size exceeding limit (should fail)
  - [ ] Send to zero address (should fail)
  - [ ] Send zero amount (should fail)
  - [ ] Send to same recipient twice (should fail)
  - [ ] Send by non-owner (should fail)
  - [ ] Verify tokens sent correctly
  - [ ] Verify sent status updated

### 10.4 Withdrawal

- [ ] **withdrawTokens**
  - [ ] Withdraw tokens by owner
  - [ ] Withdraw by non-owner (should fail)
  - [ ] Withdraw to zero address (should fail)
  - [ ] Withdraw more than balance (should fail)
  - [ ] Verify tokens withdrawn

### 10.5 View Functions

- [ ] **hasReceived**
  - [ ] Check for recipient who received tokens (true)
  - [ ] Check for recipient who didn't receive tokens (false)

- [ ] **getBalance**
  - [ ] Get contract token balance
  - [ ] Verify balance correct

---

## 11. Integration Tests

### 11.1 Full Purchase Flow

- [ ] **Complete Purchase Workflow**
  - [ ] Setup contracts with Safe as owner
  - [ ] Configure price feeds
  - [ ] Set sale token
  - [ ] Start sale
  - [ ] Purchase with BNB
  - [ ] Purchase with USDT
  - [ ] Purchase with USDC
  - [ ] Purchase with ETH
  - [ ] Purchase with BTC
  - [ ] Purchase with SOL
  - [ ] Verify all purchases successful
  - [ ] Verify owner received payments

### 11.2 Staking Integration

- [ ] **Staking After Purchase**
  - [ ] Purchase tokens
  - [ ] Stake purchased tokens
  - [ ] Harvest rewards
  - [ ] Unstake tokens
  - [ ] Verify complete flow

### 11.3 Referral Integration

- [ ] **Referral Flow**
  - [ ] Register referrer
  - [ ] Purchase with referral
  - [ ] Verify referral rewards
  - [ ] Multiple purchases with same referral
  - [ ] Verify referral tracking

### 11.4 Private Sale Integration

- [ ] **Private Sale Flow**
  - [ ] Set private sale allocations
  - [ ] Activate private sale
  - [ ] Distribute private sale batch
  - [ ] Verify distributions
  - [ ] Deactivate private sale

### 11.5 Airdrop Integration

- [ ] **Airdrop Flow**
  - [ ] Deploy Airdrop contract
  - [ ] Transfer tokens to Airdrop
  - [ ] Generate Merkle tree
  - [ ] Set Merkle root
  - [ ] Batch send with Merkle validation
  - [ ] Verify tokens sent

---

## 12. Edge Cases & Error Handling

### 12.1 Boundary Conditions

- [ ] **Zero Values**
  - [ ] Purchase with zero amount (should fail)
  - [ ] Stake with zero amount (should fail)
  - [ ] Set zero address (should fail)
  - [ ] Transfer zero amount (should fail)

- [ ] **Maximum Values**
  - [ ] Purchase up to sale limit
  - [ ] Purchase exceeding sale limit (should fail)
  - [ ] Stake maximum amount
  - [ ] Batch send maximum batch size
  - [ ] Batch send exceeding batch size (should fail)

- [ ] **Overflow/Underflow**
  - [ ] Large purchase amounts
  - [ ] Large stake amounts
  - [ ] Price calculation with large numbers
  - [ ] Reward calculation with large numbers

### 12.2 Reentrancy Protection

- [ ] **Reentrancy Tests**
  - [ ] Attempt reentrancy in purchase functions
  - [ ] Attempt reentrancy in staking functions
  - [ ] Attempt reentrancy in withdrawal functions
  - [ ] Verify all functions protected

### 12.3 DoS Protection

- [ ] **Batch Size Limits**
  - [ ] Batch operations within limit (should succeed)
  - [ ] Batch operations exceeding limit (should fail)
  - [ ] Verify MAX_BATCH_SIZE enforced

- [ ] **Gas Limits**
  - [ ] Large batch operations
  - [ ] Multiple operations in one transaction
  - [ ] Verify gas usage reasonable

### 12.4 Price Feed Edge Cases

- [ ] **Price Feed Issues**
  - [ ] Stale price feed (older than threshold)
  - [ ] Negative price feed value
  - [ ] Zero price feed value
  - [ ] Incomplete round data
  - [ ] Missing price feed
  - [ ] Verify all cases handled correctly

### 12.5 Access Control Edge Cases

- [ ] **Owner Edge Cases**
  - [ ] Functions called by owner (should succeed)
  - [ ] Functions called by non-owner (should fail)
  - [ ] Functions called by zero address (should fail)
  - [ ] Owner changed (immutable, should not be possible)

### 12.6 State Edge Cases

- [ ] **Contract State**
  - [ ] Operations when paused
  - [ ] Operations when not paused
  - [ ] Operations before sale start
  - [ ] Operations after sale end
  - [ ] Operations with insufficient contract balance

---

## 13. Gas Optimization Tests

### 13.1 Gas Usage

- [ ] **Purchase Functions**
  - [ ] Measure gas for buyWithBNB
  - [ ] Measure gas for buyWithUSDT
  - [ ] Measure gas for buyWithUSDC
  - [ ] Compare gas usage across methods

- [ ] **Staking Functions**
  - [ ] Measure gas for stakeTokens
  - [ ] Measure gas for harvestRewards
  - [ ] Measure gas for unstakeTokens
  - [ ] Measure gas for unstakeEarly

- [ ] **Batch Operations**
  - [ ] Measure gas for batch send (10 recipients)
  - [ ] Measure gas for batch send (50 recipients)
  - [ ] Measure gas for batch send (100 recipients)
  - [ ] Verify gas scales linearly

### 13.2 Storage Optimization

- [ ] **Storage Reads/Writes**
  - [ ] Minimize storage reads
  - [ ] Minimize storage writes
  - [ ] Use memory where possible
  - [ ] Pack structs efficiently

---

## 📝 Test Execution Priority

### High Priority (Critical Path)
1. Purchase functions (all payment methods)
2. Security & access control
3. Price feed validation
4. Pause mechanism
5. Basic staking (stake, harvest, unstake)

### Medium Priority (Important Features)
1. Referral system
2. Private sale
3. Voucher purchases
4. Advanced staking (early unstake)
5. Airdrop contract

### Low Priority (Edge Cases)
1. View functions
2. Gas optimization
3. Boundary conditions
4. Integration tests

---

## 🎯 Test Coverage Goals

- **Line Coverage**: > 90%
- **Branch Coverage**: > 85%
- **Function Coverage**: 100%
- **Critical Path Coverage**: 100%

---

## 📚 Test Files Structure

```
web3/test/
├── TokenICO/
│   ├── purchase.test.js
│   ├── staking.test.js
│   ├── referral.test.js
│   ├── privateSale.test.js
│   ├── admin.test.js
│   ├── security.test.js
│   └── view.test.js
├── SavitriCoin/
│   └── token.test.js
├── Airdrop/
│   └── airdrop.test.js
├── integration/
│   ├── fullFlow.test.js
│   └── multisig.test.js
└── helpers/
    ├── safeHelpers.js
    └── testHelpers.js
```

---

## ✅ Current Test Status

- [x] Basic multisig setup test
- [x] Basic purchase test (BNB, USDT)
- [ ] All other tests (see checklist above)

---

## 📖 Notes

- All tests should use mock Safe for local testing
- Production tests should use real Gnosis Safe
- Tests should cover both success and failure cases
- Tests should verify events emitted
- Tests should verify state changes
- Tests should verify access control

