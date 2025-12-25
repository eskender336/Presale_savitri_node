# Guide: Creating a Multisig Wallet (Gnosis Safe)

## What is a Multisig Wallet?

A multisig (multi-signature) wallet requires multiple signatures to execute transactions. For example, with a "3 of 5" setup, you need at least 3 signatures from 5 owners to confirm a transaction.

## Recommended Solution: Gnosis Safe

Gnosis Safe is the most popular and secure multisig wallet in the Ethereum ecosystem. It's used by most DeFi projects and DAOs.

## Understanding Safe vs Regular Wallets

### Regular Wallet (EOA - Externally Owned Account)
- **What it is**: A wallet controlled by a private key (MetaMask, Ledger, etc.)
- **Can deploy contracts**: ✅ Yes
- **Can sign transactions**: ✅ Yes (single signature)
- **Examples**: `0xOwner1...`, `0xOwner2...` (your Safe owners)

### Safe Wallet (Smart Contract)
- **What it is**: A smart contract that requires multiple signatures
- **Can deploy contracts**: ❌ No (smart contracts cannot deploy)
- **Can sign transactions**: ✅ Yes (but requires 3+ signatures)
- **Example**: `0xSafe...` (your Safe address)

**Key Point**: Only regular wallets can deploy contracts. Safe becomes the owner AFTER deployment.

## What is a Safe Address?

**Safe Address** (also called "Safe wallet address" or "multisig address") is the **unique Ethereum address** of your Gnosis Safe contract.

### Key Points:

1. **It's a Smart Contract Address**
   - When you create a Gnosis Safe, a smart contract is deployed on the blockchain
   - This contract has its own address (like `0x1234...5678`)
   - This address is your **Safe Address**

2. **It Acts Like a Wallet**
   - You can send tokens/ETH to this address
   - It holds funds just like a regular wallet
   - But transactions require multiple signatures to execute

3. **How It's Created**
   - Created when you set up your Gnosis Safe
   - Generated based on your owner addresses and threshold
   - Same owners + same threshold = same Safe address (deterministic)

4. **Where to Find It**
   - After creating Safe on https://app.safe.global/, it's displayed prominently
   - It's shown in the Safe interface header
   - You can copy it from the Safe dashboard

5. **What It's Used For**
   - Set as the `owner` of your smart contracts
   - Receives funds (tokens, ETH, BNB)
   - Executes transactions (requires multiple signatures)
   - Acts as the "multisig wallet" that controls your contracts

### Example:

```
Safe Address: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
├── Owners (5 addresses):
│   ├── 0xOwner1... (CEO)
│   ├── 0xOwner2... (CTO)
│   ├── 0xOwner3... (CFO)
│   ├── 0xOwner4... (Advisor)
│   └── 0xOwner5... (Community Rep)
└── Threshold: 3 of 5 signatures required
```

**In your `.env` file:**
```env
SAFE_ADDRESS=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
```

This address will be used as the owner of your contracts, ensuring all administrative actions require multisig approval.

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

#### Option A: Deploy with Safe Owner Wallet (Recommended)

**Use the dedicated multisig deployment script:**

```bash
# 1. Set Safe address in .env file
SAFE_ADDRESS=0xYourSafeAddress...

# 2. Configure Hardhat to use one of Safe owner wallets
#    Option A: Use private key in hardhat.config.js
#    Option B: Use hardware wallet (Ledger/Trezor)
#    Option C: Use environment variable PRIVATE_KEY

# 3. Run deployment script
npx hardhat run scripts/deploy.multisig.js --network bsc
```

**What this script does:**
1. Deploys `SavitriCoin` and transfers ownership to Safe address
2. Deploys `TokenICO` with deployer as owner (immutable - make sure deployer is a Safe owner!)
3. Configures all contract settings (price feeds, payment tokens, intervals, etc.)

**Important Notes:**
- **TokenICO owner is IMMUTABLE** - it will be set to the deployer address
- Make sure the deployer wallet is one of your Safe owners
- After deployment, execute `setAllowedSender(ICO, true)` via Safe for SavitriCoin

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

**Recommendation**: Use **Option A** — deploy contracts using one of Safe owner wallets.

### Step-by-Step Deployment with Multisig

#### Quick Summary

**Wallet**: Uses `PRIVATE_KEY` from `web3/.env` (one of your Safe owner wallets)  
**RPC**: Uses `NETWORK_RPC_URL` from `web3/.env` (blockchain RPC endpoint)  
**Network**: Determined by `--network` flag (e.g., `bsc`, `ethereum`, `sepolia`)

**Example:**
```bash
# In web3/.env:
NETWORK_RPC_URL=https://bsc-dataseed1.binance.org/
PRIVATE_KEY=0xYourSafeOwnerPrivateKey...
SAFE_ADDRESS=0xYourSafeAddress...

# Run:
npx hardhat run scripts/deploy.multisig.js --network bsc
```

#### Prerequisites

1. **Create Gnosis Safe** (if not done already)
   - Follow Step 2 above to create your Safe
   - Save the Safe address

2. **Fund Safe with native tokens**
   - Send BNB/ETH to Safe address for gas fees
   - Recommended: 0.5-1 BNB/ETH

3. **Prepare deployment wallet**
   - Use one of your Safe owner wallets (MetaMask, Ledger, Trezor, etc.)
   - Ensure it has enough BNB/ETH for deployment gas fees

#### Deployment Steps

1. **Set environment variables** in `web3/.env`:
```env
# Required: Safe address
SAFE_ADDRESS=0xYourSafeAddress...

# Required: RPC endpoint for blockchain network
NETWORK_RPC_URL=https://bsc-dataseed1.binance.org/
# OR for BSC testnet: https://data-seed-prebsc-1-s1.binance.org:8545/
# OR use a provider like Infura, Alchemy, QuickNode, etc.

# Required: Private key of one Safe owner wallet (for deployment)
PRIVATE_KEY=0xYourPrivateKeyOfSafeOwner...

# Optional: Other contract addresses
SIGNER_ADDRESS=0xYourSignerAddress...
USDT_ADDRESS=0x...
USDC_ADDRESS=0x...
BNB_FEED_ADDRESS=0x...
ETH_FEED_ADDRESS=0x...
# ... other addresses
```

2. **Wallet Configuration**:
   - The script uses `PRIVATE_KEY` from `.env` file
   - This should be the private key of **one of your Safe owner wallets**
   - **Important**: The deployer address will become the owner of `TokenICO` (immutable)
   - Make sure this wallet is one of your Safe owners!

3. **RPC Configuration**:
   - The script uses `NETWORK_RPC_URL` from `.env` file
   - The `--network` flag determines which network config to use:
     - `--network bsc` → Uses `NETWORK_RPC_URL` with chainId 56 (BSC mainnet)
     - `--network ethereum` → Uses `NETWORK_RPC_URL` with chainId 1 (Ethereum mainnet)
     - `--network sepolia` → Uses `NETWORK_RPC_URL` with chainId 11155111 (Sepolia testnet)
   - **Example RPC URLs**:
     - BSC Mainnet: `https://bsc-dataseed1.binance.org/`
     - BSC Testnet: `https://data-seed-prebsc-1-s1.binance.org:8545/`
     - Ethereum Mainnet: `https://mainnet.infura.io/v3/YOUR_API_KEY`
     - Or use Alchemy, QuickNode, etc.

4. **Run deployment script**:
```bash
cd web3
npx hardhat run scripts/deploy.multisig.js --network bsc
```

**⚠️ Important: What This Command Does**

This command **DEPLOYS contracts immediately** (does NOT propose to Safe):
- ✅ Deploys `SavitriCoin` contract on-chain
- ✅ Deploys `TokenICO` contract on-chain  
- ✅ Transfers `SavitriCoin` ownership to Safe address
- ✅ Configures contract settings (price feeds, tokens, etc.)

**It does NOT:**
- ❌ Propose contracts to Safe for approval
- ❌ Require multisig signatures to deploy
- ❌ Create pending transactions in Safe

### Why Deployment Doesn't Need Multisig

**Key Understanding:**

1. **Safe is a Smart Contract, Not a Deployer**
   - Gnosis Safe is a smart contract address (like `0xSafe...`)
   - Smart contracts **cannot deploy other contracts** directly
   - Only **regular wallets (EOAs)** can deploy contracts

2. **Deployment Uses a Regular Wallet**
   - The script uses `PRIVATE_KEY` from `.env` (a regular wallet)
   - This wallet is **one of your Safe owners**
   - It deploys contracts **directly** (no Safe involved)

3. **Safe Becomes Owner AFTER Deployment**
   - Contracts are deployed by the regular wallet
   - **After** deployment, Safe address is set as owner
   - **Future** transactions FROM Safe require multisig

**Visual Flow:**

```
Step 1: Regular Wallet (Owner #1) deploys contracts
        ↓
        [SavitriCoin] deployed by 0xOwner1...
        [TokenICO] deployed by 0xOwner1...
        ↓
Step 2: Ownership transferred to Safe
        ↓
        SavitriCoin.owner = 0xSafe... (multisig)
        TokenICO.owner = 0xOwner1... (immutable)
        ↓
Step 3: Future admin functions require Safe multisig
        ↓
        setPrice() → Requires 3+ signatures
        batchSend() → Requires 3+ signatures
```

**Why This Works:**
- Deployment: Uses regular wallet (no multisig needed)
- Future operations: Uses Safe address (multisig required)
- The deployer wallet must be a Safe owner for security

**What the script uses:**
- **Wallet**: `PRIVATE_KEY` from `.env` (via `hre.ethers.getSigners()`)
- **RPC**: `NETWORK_RPC_URL` from `.env` (configured in `hardhat.config.js`)
- **Network**: Determined by `--network` flag (bsc, ethereum, sepolia, etc.)

4. **After deployment**:
   - Verify contracts on block explorer
   - Accept SavitriCoin ownership transfer via Safe (if pending)
   - Execute `setAllowedSender(ICO, true)` via Safe for SavitriCoin
   - **All future admin functions must be executed via Safe** (requires multisig)

### When Do You Use Safe Multisig?

**During Deployment (This Script):**
- ❌ **NOT used** - Script deploys directly using one owner's wallet
- Contracts are deployed immediately without multisig approval

**After Deployment (Future Operations):**
- ✅ **YES - Used for all admin functions**
- Examples that require Safe multisig:
  - `setAllowedSender()` on SavitriCoin
  - `setPrice()` on TokenICO
  - `batchSend()` for private sale distribution
  - `pause()` / `unpause()` functions
  - Any `onlyOwner` function

**How to Execute via Safe:**
1. Go to https://app.safe.global/
2. Connect your Safe wallet
3. Create new transaction → Contract interaction
4. Enter contract address and function
5. Get 3+ signatures from Safe owners
6. Execute transaction

### Step 5: Executing Transactions via Safe

#### Where Transactions Are Sent

**Important**: When executing transactions via Safe:

- **FROM**: Transactions are sent **FROM your Safe wallet address** (the multisig address you created)
- **TO**: Transactions are sent **TO your contract addresses** (e.g., `TokenICO`, `PrivateSaleDistribution`, `SavitriCoin`)
- **Network**: Transactions are sent to the blockchain network where your Safe was created (BSC, Ethereum, Polygon, etc.)

**Example Transaction Flow:**
```
Safe Wallet Address (0xSafe...)
    ↓ (transaction with encoded function call)
    ↓ (requires 3+ signatures)
    ↓ (executed on blockchain)
Target Contract (e.g., 0xTokenICO...)
    ↓ (calls contract function)
    ↓ (e.g., batchSend(), setPrice(), etc.)
Contract State Updated
```

**Transaction Structure:**
- `to`: Your contract address (e.g., `PRIVATE_SALE_DISTRIBUTION_ADDRESS` or `TOKEN_ICO_ADDRESS`)
- `value`: Usually "0" (unless sending native tokens like BNB/ETH)
- `data`: Encoded function call data (generated by scripts)
- `operation`: 0 (call) or 1 (delegatecall)

#### How to Execute Transactions

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
   - Transaction will be executed **from Safe address to target contract**

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

## Transaction Examples

### Example 1: Sending Private Sale Tokens

When executing `batchSend()` on `PrivateSaleDistribution` contract:

```javascript
// Transaction sent FROM Safe wallet
FROM: 0xYourSafeAddress... (your multisig wallet)

// Transaction sent TO contract
TO: 0xPrivateSaleDistributionAddress... (your contract)

// Function called
FUNCTION: batchSend(recipients[], amounts[], proofs[])

// Result: Tokens are distributed to recipients
```

### Example 2: Updating ICO Price

When calling `setPrice()` on `TokenICO` contract:

```javascript
// Transaction sent FROM Safe wallet
FROM: 0xYourSafeAddress...

// Transaction sent TO contract
TO: 0xTokenICOAddress...

// Function called
FUNCTION: setPrice(newPrice)

// Result: ICO price is updated
```

### Example 3: Transferring Ownership

When calling `transferOwnership()` on `SavitriCoin`:

```javascript
// Transaction sent FROM Safe wallet
FROM: 0xYourSafeAddress...

// Transaction sent TO contract
TO: 0xSavitriCoinAddress...

// Function called
FUNCTION: transferOwnership(newOwner)

// Result: Ownership is transferred
```

**Key Point**: All transactions originate from your Safe wallet address and are sent to your smart contract addresses. The Safe wallet must have sufficient native tokens (BNB/ETH) to pay for gas fees.

## After Creating Safe

1. Save Safe address in `.env` file:
```env
SAFE_ADDRESS=0x...
```

2. Use this address when deploying contracts or transferring ownership

3. All administrative functions of contracts will now require multisig signatures via Safe

4. **Ensure Safe wallet has native tokens** (BNB/ETH) for gas fees when executing transactions
