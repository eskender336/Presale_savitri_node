# Guide: Creating a Multisig Wallet (Gnosis Safe)

## What is a Multisig Wallet?

A multisig (multi-signature) wallet requires multiple signatures to execute transactions. For example, with a "3 of 5" setup, you need at least 3 signatures from 5 owners to confirm a transaction.

## Recommended Solution: Gnosis Safe

Gnosis Safe is the most popular and secure multisig wallet in the Ethereum ecosystem. It's used by most DeFi projects and DAOs.

## Step-by-Step Guide

### Step 1: Prepare Addresses

1. **Determine multisig wallet owners**
   - Recommended: 5 owners
   - Minimum signatures: 3 of 5 (configurable)

2. **Ensure each owner has:**
   - An Ethereum wallet (MetaMask, Ledger, Trezor, etc.)
   - Access to private keys or hardware wallet
   - A small amount of ETH for gas fees during creation

### Step 2: Create Gnosis Safe

#### Option A: Via Web Interface (Recommended)

1. **Open Gnosis Safe**
   - **Mainnet**: https://app.safe.global/
   - **BSC**: https://app.safe.global/?chain=bsc
   - **Polygon**: https://app.safe.global/?chain=matic
   - **Base**: https://app.safe.global/?chain=base

2. **Connect Wallet**
   - Click "Connect Wallet"
   - Select one of the owner wallets (e.g., MetaMask)
   - Confirm connection

3. **Create New Safe**
   - Click "Create new Safe"
   - Enter a name for your Safe (e.g., "Savitri ICO Multisig")
   - Select network (e.g., BSC for BNB Chain)

4. **Add Owners**
   - Click "Add owner"
   - Enter addresses of all 5 owners
   - Or use QR code to scan addresses

5. **Set Signature Threshold**
   - Set "Threshold" (e.g., 3)
   - This means: "3 of 5 signatures required"

6. **Review and Confirm**
   - Review all owner addresses
   - Review signature threshold
   - Click "Create"

7. **Confirm Transaction**
   - Confirm creation in your wallet
   - Wait for transaction confirmation

8. **Save Safe Address**
   - Copy the created Safe address
   - This will be your multisig wallet address
   - **This address will be used as `owner` in your contracts**

#### Option B: Via Command Line (Advanced)

```bash
# Install Safe CLI (if not already installed)
npm install -g @safe-global/safe-cli

# Create Safe via CLI
safe-cli create \
  --owners 0xOwner1,0xOwner2,0xOwner3,0xOwner4,0xOwner5 \
  --threshold 3 \
  --network bsc
```

### Step 3: Fund Safe

1. **Send ETH/BNB to Safe Address**
   - This is needed to pay gas fees when executing transactions
   - Recommended: 0.1-0.5 ETH/BNB (depending on network)

2. **Check Balance**
   - In Gnosis Safe interface, check balance
   - Ensure sufficient funds for operations

### Step 4: Using Safe as Owner

**IMPORTANT**: In current contract implementation:

1. **SavitriCoin** uses OpenZeppelin's `Ownable` — has `transferOwnership()`
2. **TokenICO** uses `immutable owner` — **CANNOT be changed after deployment**

#### Option A: Deploy with Safe as deployer (Recommended)

Deploy contracts directly from Gnosis Safe address:

```javascript
// In deployment scripts, use Safe as deployer
// Connect Safe via Safe SDK or use one of the owner wallets
// to perform deployment on behalf of Safe

const SAFE_ADDRESS = "0x..."; // Your Gnosis Safe address

// Deployment should be executed from Safe address
// This requires configuring deployer in Hardhat to work with Safe
```

**How to do it:**
1. Use one of the Safe owner wallets for deployment
2. After deployment, if needed, transfer ownership to Safe (for SavitriCoin)
3. For TokenICO: owner will already be set to deployer address (Safe)

#### Option B: Deploy from regular wallet + transfer ownership

```javascript
// After deploying contracts from regular wallet:

// 1. SavitriCoin - can transfer ownership
await savitriToken.transferOwnership(SAFE_ADDRESS);
await savitriToken.acceptOwnership(); // Execute from Safe

// 2. TokenICO - owner immutable, CANNOT be changed
// In this case, owner will remain on deployer address
// Recommended to use Option A
```

**Recommendation**: Use **Option A** — deploy contracts directly from Safe address or one of the owner wallets that will then be used as owner.

### Step 5: Executing Transactions via Safe

1. **Create Transaction**
   - In Gnosis Safe interface, click "New transaction"
   - Select contract and function
   - Enter parameters
   - Click "Create transaction"

2. **Sign Transaction**
   - First owner signs the transaction
   - Transaction appears in pending queue

3. **Additional Signatures**
   - Other owners connect their wallets
   - Sign the transaction
   - After reaching threshold (3 of 5), transaction is ready to execute

4. **Execute Transaction**
   - Any owner can execute the transaction
   - Confirm in wallet
   - Transaction will be executed

## Alternative Solutions

### 1. Safe{Wallet} (formerly Gnosis Safe)
- Same product, renamed
- URL: https://app.safe.global/

### 2. Argent Wallet
- Mobile app with multisig
- URL: https://www.argent.xyz/

### 3. Rainbow Wallet
- Multisig support via Safe
- URL: https://rainbow.me/

## Security Recommendations

1. **Owner Distribution**
   - Don't store all keys in one place
   - Use hardware wallets (Ledger, Trezor)
   - Distribute owners geographically

2. **Signature Threshold**
   - 3 of 5 — good balance of security and convenience
   - 4 of 5 — more secure, but less convenient
   - 2 of 5 — less secure, but more convenient

3. **Backup Keys**
   - Store seed phrases in a secure location
   - Use hardware wallets for critical keys

4. **Testing**
   - Create a test Safe in test network
   - Practice creating and executing transactions
   - Ensure all owners understand the process

## Useful Links

- **Gnosis Safe Docs**: https://docs.safe.global/
- **Gnosis Safe App**: https://app.safe.global/
- **Safe CLI**: https://github.com/safe-global/safe-cli
- **Safe SDK**: https://docs.safe.global/safe-core-aa-sdk

## Example Configuration for Savitri ICO

```
Owners (5):
- 0xOwner1 (CEO) - Ledger
- 0xOwner2 (CTO) - MetaMask
- 0xOwner3 (CFO) - Trezor
- 0xOwner4 (Advisor) - MetaMask
- 0xOwner5 (Community Rep) - MetaMask

Threshold: 3 of 5

Network: BSC (Binance Smart Chain)
```

## After Creating Safe

1. Save Safe address in `.env` file:
```env
SAFE_ADDRESS=0x...
```

2. Use this address when deploying contracts or transferring ownership

3. All administrative functions of contracts will now require multisig signatures via Safe
