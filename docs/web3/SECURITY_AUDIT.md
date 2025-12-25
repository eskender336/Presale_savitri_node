# Security Audit Report: TokenICO & SavitriCoin Contracts

## Executive Summary

This document outlines potential security vulnerabilities and recommendations for the TokenICO and SavitriCoin smart contracts.

## Critical Issues

### 1. ⚠️ **Centralization Risk: Immutable Owner**

**Location**: `TokenICO.sol:32`

```solidity
address public immutable owner;
```

**Issue**: 
- Owner is immutable and cannot be changed after deployment
- If owner private key is compromised, attacker gains full control
- No way to recover from compromised owner

**Impact**: CRITICAL - Complete loss of funds if owner is compromised

**Recommendation**:
- ✅ **Already addressed**: Use Gnosis Safe multisig wallet as owner
- Deploy TokenICO from Safe address
- This mitigates single point of failure

**Status**: ✅ Mitigated (with Safe deployment)

---

### 2. ⚠️ **Reentrancy Risk in Purchase Functions**

**Location**: Multiple purchase functions (e.g., `buyWithUSDT`, `buyWithBNB`)

**Issue**: 
Functions follow this pattern:
```solidity
// 1. Transfer payment (external call)
IERC20(usdtAddress).transferFrom(msg.sender, owner, usdtInSmallestUnit);

// 2. Update state
_updateSales(msg.sender, tokenAmount);

// 3. Transfer tokens (external call)
token.transfer(msg.sender, tokenAmount);
```

**Analysis**:
- ✅ Uses `transfer` and `transferFrom` which don't allow reentrancy
- ✅ State updates happen before token transfer
- ⚠️ However, pattern is not following strict Checks-Effects-Interactions

**Impact**: MEDIUM - Low risk due to ERC20 transfer behavior, but not ideal pattern

**Recommendation**:
```solidity
// Better pattern:
// 1. Checks
require(amount > 0, "Invalid amount");
// 2. Effects (state updates)
_updateSales(msg.sender, tokenAmount);
// 3. Interactions (external calls)
IERC20(usdtAddress).transferFrom(msg.sender, owner, usdtInSmallestUnit);
token.transfer(msg.sender, tokenAmount);
```

**Status**: ⚠️ Low risk, but could be improved

---

### 3. ⚠️ **Price Feed Manipulation Risk**

**Location**: `_tokensFromPayment` function

**Issue**:
```solidity
(, int256 answer,,,) = feed.latestRoundData();
```

**Potential Problems**:
- No validation of price feed staleness
- No validation of price feed answer (could be 0 or negative)
- No circuit breakers for extreme price movements

**Impact**: MEDIUM - Could lead to incorrect token pricing

**Recommendation**:
```solidity
function _tokensFromPayment(...) internal view returns (uint256) {
    require(address(feed) != address(0), "Feed not set");
    (
        uint80 roundId,
        int256 answer,
        uint256 startedAt,
        uint256 updatedAt,
        uint80 answeredInRound
    ) = feed.latestRoundData();
    
    // Validate price feed data
    require(answer > 0, "Invalid price");
    require(updatedAt > 0, "Price feed not updated");
    require(block.timestamp - updatedAt < 3600, "Price feed stale"); // 1 hour
    
    // ... rest of function
}
```

**Status**: ⚠️ Should add validation

---

### 4. ⚠️ **Integer Overflow/Underflow**

**Location**: Throughout contracts

**Analysis**:
- ✅ Using Solidity 0.8.0+ which has built-in overflow protection
- ✅ SafeMath not needed (but also not harmful if used)

**Status**: ✅ Protected by compiler

---

### 5. ⚠️ **DoS via Gas Limit in Loops**

**Location**: Multiple functions with loops

**Examples**:
- `distributePrivateSaleBatch` - loops over recipients array
- `setPrivateSaleAllocations` - loops over recipients array
- `harvestRewards` - loops over user stakes
- `unstake` - loops over user stakes

**Issue**: 
- If arrays become too large, transactions may exceed gas limit
- No pagination or batching limits

**Impact**: MEDIUM - Could prevent legitimate operations

**Recommendation**:
```solidity
// Add batch size limits
uint256 public constant MAX_BATCH_SIZE = 100;

function distributePrivateSaleBatch(
    address[] calldata recipients,
    uint256[] calldata amounts,
    string[] calldata reasons
) external onlyOwner {
    require(recipients.length <= MAX_BATCH_SIZE, "Batch too large");
    // ... rest of function
}
```

**Status**: ⚠️ Should add batch limits

---

### 6. ⚠️ **Front-running in Purchase Functions**

**Location**: All purchase functions

**Issue**:
- Price increases over time based on `saleStartTime`
- Attacker could front-run transactions to get better prices
- No commit-reveal scheme or MEV protection

**Impact**: LOW - Expected behavior in public sales, but could be improved

**Recommendation**:
- Consider using commit-reveal scheme for large purchases
- Or accept as normal market behavior

**Status**: ℹ️ Informational - Expected behavior

---

### 7. ⚠️ **Missing Zero Address Checks**

**Location**: Various functions

**Examples**:
- `setSaleToken` - checks for zero, ✅ good
- `updateUSDT`, `updateUSDC`, etc. - checks for zero, ✅ good
- But some functions might miss checks

**Status**: ✅ Most functions have zero address checks

---

### 8. ⚠️ **Unchecked External Calls**

**Location**: `withdrawTokens`, `withdrawTokensTo`

**Issue**:
```solidity
require(
    IERC20(_token).transfer(owner, _amount),
    "Transfer failed"
);
```

**Analysis**:
- ✅ Uses `require` to check return value
- ✅ Safe pattern for ERC20 transfers
- ⚠️ Some tokens (like USDT) don't return bool - will revert

**Status**: ✅ Safe (reverts are fine)

---

### 9. ⚠️ **Staking: Potential DoS via Large Number of Stakes**

**Location**: `harvestRewards`, `unstake` functions

**Issue**:
```solidity
for (uint i = 0; i < userStakes[msg.sender].length; i++) {
    if (userStakes[msg.sender][i].id == stakeId) {
        // ... operations
    }
}
```

**Problem**:
- Linear search through stakes array
- If user has many stakes, gas cost increases
- No limit on number of stakes per user

**Impact**: MEDIUM - Could make functions unusable for users with many stakes

**Recommendation**:
- Consider using mapping for O(1) lookup: `mapping(uint256 => Stake) public stakes;`
- Or limit number of active stakes per user

**Status**: ⚠️ Should optimize

---

### 10. ⚠️ **Private Sale: Allocation Overflow Risk**

**Location**: `distributePrivateSaleBatch`

**Issue**:
```solidity
require(
    privateSaleDistributed[recipients[i]] + amounts[i] <= privateSaleAllocation[recipients[i]],
    "Exceeds allocation"
);
```

**Analysis**:
- ✅ Has overflow protection (Solidity 0.8.0+)
- ✅ Checks allocation limits
- ✅ Prevents double spending

**Status**: ✅ Safe

---

### 11. ⚠️ **Voucher System: Replay Attack Protection**

**Location**: `buyWithVoucher`

**Issue**:
```solidity
require(v.nonce > usedNonce[msg.sender], "Nonce used");
usedNonce[msg.sender] = v.nonce;
```

**Analysis**:
- ✅ Uses nonce to prevent replay attacks
- ✅ EIP-712 signature prevents tampering
- ✅ Nonce is per-user, preventing reuse

**Status**: ✅ Safe

---

### 12. ⚠️ **Access Control: Owner Functions**

**Location**: All `onlyOwner` functions

**Issue**:
- Many critical functions are owner-only
- If owner is compromised, attacker can:
  - Change prices
  - Block addresses
  - Withdraw all funds
  - Modify sale parameters

**Impact**: CRITICAL - But mitigated by using Safe

**Status**: ✅ Mitigated (with Safe multisig)

---

## Medium Priority Issues

### 13. ⚠️ **Missing Events for Critical Operations**

**Location**: Some state-changing functions

**Recommendation**: Ensure all critical operations emit events for off-chain monitoring

**Status**: ✅ Most functions have events

---

### 14. ⚠️ **No Pause Mechanism**

**Location**: Contract level

**Issue**: No emergency pause function if critical bug is discovered

**Recommendation**: Consider adding pause functionality (with Safe control)

**Status**: ℹ️ Consider adding

---

### 15. ⚠️ **Price Calculation Precision**

**Location**: `_tokensFromPayment`

**Issue**: Complex price calculations with multiple decimals could lead to rounding errors

**Recommendation**: Test edge cases with different decimal configurations

**Status**: ⚠️ Should test thoroughly

---

## Low Priority / Informational

### 16. ℹ️ **Gas Optimization Opportunities**

- Use `uint256` instead of `uint8` for loop counters (saves gas)
- Cache storage reads in loops
- Use `unchecked` blocks where safe

**Status**: ℹ️ Optimization, not security issue

---

### 17. ℹ️ **Code Complexity**

- Contract is large (~1500 lines)
- Many functions and state variables
- Consider splitting into multiple contracts

**Status**: ℹ️ Maintainability, not security issue

---

## Recommendations Summary

### Critical (Must Fix)
1. ✅ Use Gnosis Safe as owner (already planned)
2. ⚠️ Add price feed validation
3. ⚠️ Add batch size limits for loops

### High Priority
4. ⚠️ Optimize staking lookup (use mapping)
5. ⚠️ Improve reentrancy pattern (Checks-Effects-Interactions)

### Medium Priority
6. ℹ️ Consider pause mechanism
7. ℹ️ Add more comprehensive price feed validation
8. ℹ️ Test edge cases thoroughly

### Low Priority
9. ℹ️ Gas optimizations
10. ℹ️ Code refactoring for maintainability

---

## Testing Recommendations

1. **Fuzz Testing**: Test price calculations with random inputs
2. **Invariant Testing**: Ensure `tokensSold` never exceeds `TOTAL_TOKENS_FOR_SALE`
3. **Integration Testing**: Test with real price feeds
4. **Stress Testing**: Test with maximum batch sizes
5. **Edge Case Testing**: Zero amounts, maximum values, etc.

---

## External Audit

**Strongly Recommended**: Get a professional security audit before mainnet deployment, especially for:
- Price calculation logic
- Staking mechanism
- Private sale distribution
- Access control

---

## Conclusion

The contracts have several areas that need attention, but most critical issues are mitigated by using Gnosis Safe. The main concerns are:

1. ✅ **Centralization** - Mitigated with Safe
2. ⚠️ **Price feed validation** - Should add
3. ⚠️ **DoS in loops** - Should add limits
4. ⚠️ **Staking optimization** - Should improve

Overall security level: **MEDIUM** (with Safe) → **HIGH** (after recommended fixes)

