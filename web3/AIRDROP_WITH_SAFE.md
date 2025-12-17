# Airdrop with Gnosis Safe - Guide

## The Problem

**Before (with single owner):**
```javascript
// Simple script - just call the function
await tokenICO.distributePrivateSaleBatch(recipients, amounts, reasons);
// ✅ Done! Tokens sent.
```

**Now (with Gnosis Safe):**
```javascript
// ❌ This won't work directly anymore
await tokenICO.distributePrivateSaleBatch(recipients, amounts, reasons);
// Error: Only owner can call this
// Owner is now Safe address, not your wallet!
```

## The Solution

You need to create transactions through Gnosis Safe interface, not directly.

## Method 1: Using Safe Web Interface (Recommended)

### Step 1: Generate Transaction Data

Run the script:
```bash
cd web3
node scripts/airdrop-via-safe.js
```

This creates `safe-transactions.json` with all transaction data.

### Step 2: Execute via Safe Web Interface

1. **Go to Safe**: https://app.safe.global/
2. **Connect your Safe wallet**
3. **Click "New transaction"**
4. **Select "Contract interaction"**
5. **Enter contract address**: From `safe-transactions.json` → `tokenICOAddress`
6. **Paste transaction data**: From `safe-transactions.json` → `transactions[0].data`
7. **Click "Create transaction"**
8. **Get signatures**: 3+ owners need to sign
9. **Execute**: Once enough signatures, execute the transaction

### Step 3: Batch Multiple Transactions

If you have multiple batches:

1. **Use Safe's batch feature**:
   - Click "New transaction" → "Batch"
   - Add all batch transactions
   - Create as one batch transaction
   - All batches execute together (if all succeed)

## Method 2: Using Safe SDK (Advanced)

If you want to automate the process:

```javascript
const Safe = require("@safe-global/safe-core-sdk").default;
const { SafeFactory } = require("@safe-global/safe-core-sdk");
const EthersAdapter = require("@safe-global/safe-ethers-lib").default;

async function airdropViaSafe() {
  // Connect to Safe
  const ethAdapter = new EthersAdapter({
    ethers,
    signerOrProvider: signer, // One of Safe owners
  });

  const safeSdk = await Safe.init({
    ethAdapter,
    safeAddress: SAFE_ADDRESS,
  });

  // Prepare transaction
  const transactionData = tokenICO.interface.encodeFunctionData(
    "distributePrivateSaleBatch",
    [recipients, amounts, reasons]
  );

  const safeTransaction = await safeSdk.createTransaction({
    safeTransactionData: {
      to: TOKEN_ICO_ADDRESS,
      value: "0",
      data: transactionData,
    },
  });

  // Sign transaction (need 3+ signatures)
  await safeSdk.signTransaction(safeTransaction);
  
  // Other owners sign...
  // Then execute
  await safeSdk.executeTransaction(safeTransaction);
}
```

## Method 3: Using Safe CLI

```bash
# Install Safe CLI
npm install -g @safe-global/safe-cli

# Create transaction
safe-cli propose-transaction \
  --safe SAFE_ADDRESS \
  --to TOKEN_ICO_ADDRESS \
  --data TRANSACTION_DATA \
  --value 0

# Approve (from different owners)
safe-cli approve-transaction \
  --safe SAFE_ADDRESS \
  --tx-hash TX_HASH

# Execute (after 3+ approvals)
safe-cli execute-transaction \
  --safe SAFE_ADDRESS \
  --tx-hash TX_HASH
```

## Comparison: Before vs Now

| Aspect | Before (Single Owner) | Now (Gnosis Safe) |
|--------|----------------------|-------------------|
| **Speed** | ⚡ Instant | 🐢 Slower (needs 3+ signatures) |
| **Security** | ⚠️ Single point of failure | ✅ Multi-sig protection |
| **Automation** | ✅ Easy to automate | ⚠️ Requires Safe interface |
| **Gas Cost** | 💰 Lower | 💰💰 Higher (Safe overhead) |
| **Safety** | ❌ One key = full control | ✅ 3 keys needed |

## Workflow Example

### Scenario: Airdrop 500 recipients

**Step 1: Prepare**
```bash
# Create CSV with 500 recipients
# Run script
node scripts/airdrop-via-safe.js
# Output: 5 batches (100 each)
```

**Step 2: Execute Batch 1**
1. Go to Safe interface
2. Create transaction with batch 1 data
3. Get 3 signatures
4. Execute
5. ✅ 100 recipients get tokens

**Step 3: Repeat for batches 2-5**
- Same process for each batch
- Or use Safe's batch feature to do all 5 at once

**Total time**: ~15-30 minutes (depending on how fast owners sign)

## Tips

1. **Use Safe's batch feature**: Execute multiple batches in one transaction
2. **Schedule transactions**: Safe allows scheduling for later execution
3. **Test first**: Do a small batch first to verify everything works
4. **Keep transaction data**: Save `safe-transactions.json` for records
5. **Monitor gas**: Safe transactions cost more gas, plan accordingly

## Alternative: Direct Transfer (If You Control Safe)

If you're one of the Safe owners and want to do it faster:

```javascript
// Connect as Safe owner
const signer = await ethers.getSigner(); // One of Safe owners

// Call function directly (will fail if not owner)
// But if you deploy TokenICO FROM Safe address, Safe IS the owner
// So you can call directly from Safe owner's wallet

// However, this defeats the purpose of multisig!
// Better to use Safe interface for transparency
```

## Summary

**Yes, you can still do airdrops, but:**
- ✅ More secure (multisig protection)
- ⚠️ Slower (needs 3+ signatures)
- ⚠️ More steps (use Safe interface)
- ✅ More transparent (all owners see transactions)

**The trade-off**: Security and transparency vs speed and convenience.

