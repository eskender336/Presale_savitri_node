# Contract Architecture

## Overview

The project consists of **3 main smart contracts**:

1. **SavitriCoin.sol** - Token contract (creates the coin)
2. **TokenICO.sol** - ICO contract (sells the coin)
3. **Airdrop.sol** - Airdrop contract (distributes coins via Merkle tree)

## Contract Details

### 1. SavitriCoin.sol - Token Contract

**Purpose:** Creates and manages the SAV token

**Location:** `web3/contracts/mock/SavitriCoin.sol`

**Key Features:**
- ERC-20 token standard
- Initial supply: 600,000,000 SAV
- Owner controls:
  - Block/unblock addresses
  - Enable/disable transfers
  - Allow specific senders

**Owner:** Gnosis Safe (multisig)

**Functions:**
```solidity
// Admin functions (onlyOwner)
setBlockStatus(address user, bool blocked)
setAllowedSender(address user, bool allowed)
setTransfersEnabled(bool enabled)
```

---

### 2. TokenICO.sol - ICO Contract

**Purpose:** Sells tokens during ICO/presale

**Location:** `web3/contracts/TokenICO.sol`

**Key Features:**
- Accepts multiple payment methods (USDT, USDC, BNB, ETH, BTC, SOL)
- Dynamic pricing
- Staking mechanism
- Referral system
- Private sale distribution
- Pause mechanism

**Owner:** Gnosis Safe (multisig, immutable)

**Functions:**
```solidity
// User functions
buyWithUSDT(uint256 amount)
buyWithBNB() payable
buyWithETH(uint256 amount)
stakeTokens(uint256 amount, uint256 lockPeriodDays)
harvestRewards(uint256 stakeId)
unstake(uint256 stakeId)

// Admin functions (onlyOwner)
updateInitialUsdtPrice(uint256 newPrice)
setSaleToken(address _token)
setBlockStatus(address user, bool blocked)
pause() / unpause()
distributePrivateSaleBatch(...)
```

---

### 3. Airdrop.sol - Airdrop Contract

**Purpose:** Decentralized airdrop using Merkle tree

**Location:** `web3/contracts/Airdrop.sol`

**Key Features:**
- Merkle tree for efficient airdrop
- Users claim themselves (no multisig needed)
- Owner can withdraw unclaimed tokens

**Owner:** Gnosis Safe (multisig, for setup only)

**Functions:**
```solidity
// User functions (no multisig needed!)
claim(uint256 amount, bytes32[] calldata merkleProof)

// Admin functions (onlyOwner, via Safe)
setMerkleRoot(bytes32 _merkleRoot)
setClaimEndTime(uint256 _claimEndTime)
batchClaim(...) // for edge cases
withdrawUnclaimed(address to, uint256 amount)
```

---

## Contract Relationships

```
SavitriCoin (Token)
    │
    ├───> TokenICO (uses token for sales)
    │     └─── Receives tokens for distribution
    │
    └───> Airdrop (uses token for airdrop)
          └─── Receives tokens for distribution
```

## Deployment Flow

### Step 1: Deploy SavitriCoin
```javascript
const savitriToken = await SavitriCoin.deploy();
// Owner: Deployer (will be Safe)
// Total supply: 600M SAV minted to deployer
```

### Step 2: Deploy TokenICO
```javascript
const tokenICO = await TokenICO.deploy();
// Owner: Deployer (immutable, will be Safe)
// No tokens yet - need to transfer from SavitriCoin
```

### Step 3: Setup TokenICO
```javascript
// Transfer tokens to ICO
await savitriToken.transfer(tokenICO.address, 500_000_000 * 1e18);

// Configure ICO
await tokenICO.setSaleToken(savitriToken.address);
await savitriToken.setAllowedSender(tokenICO.address, true);
```

### Step 4: Deploy Airdrop (Optional)
```javascript
const airdrop = await Airdrop.deploy(savitriToken.address);
// Owner: Deployer (will be Safe)

// Transfer tokens to airdrop
await savitriToken.transfer(airdrop.address, 50_000_000 * 1e18);

// Generate Merkle tree
node scripts/generate-merkle-tree.js

// Set Merkle root
await airdrop.setMerkleRoot(merkleRoot);
```

## Ownership Structure

All contracts use **Gnosis Safe** as owner:

```
SavitriCoin.owner = Safe Address
TokenICO.owner = Safe Address (immutable)
Airdrop.owner = Safe Address
```

**Benefits:**
- ✅ Multi-signature protection
- ✅ No single point of failure
- ✅ Transparent governance

## Token Flow

### During ICO:
```
Buyer → TokenICO (pays USDT/BNB/etc) → TokenICO sends SAV tokens
```

### During Airdrop:
```
User → Airdrop (claims with proof) → Airdrop sends SAV tokens
```

### Token Distribution:
```
SavitriCoin (600M total)
├── TokenICO: ~500M (for sale)
├── Airdrop: ~50M (for airdrop)
└── Reserved: ~50M (for team, etc.)
```

## Security Model

| Contract | Owner Type | Multisig Needed For |
|----------|-----------|---------------------|
| **SavitriCoin** | Safe | Admin functions |
| **TokenICO** | Safe (immutable) | Admin functions, withdrawals |
| **Airdrop** | Safe | Setup only (users claim themselves) |

## Summary

✅ **3 Contracts:**
1. **SavitriCoin** - Creates the token
2. **TokenICO** - Sells the token
3. **Airdrop** - Distributes token via Merkle tree

✅ **All owned by Safe** (multisig protection)

✅ **Airdrop doesn't need multisig for claims** (users claim themselves)

✅ **Clean separation of concerns**

