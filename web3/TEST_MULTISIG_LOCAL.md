# Testing Multisig Wallet Locally with Hardhat

This guide shows how to test multisig wallet functionality locally with Hardhat.

## Quick Start

### Option 1: Mock Safe (Recommended for Quick Testing)

This uses a simplified mock Safe for fast testing:

```bash
cd web3
npm run test:multisig
```

Or directly:
```bash
npx hardhat run scripts/test-multisig-local.js
```

### Option 2: Real Gnosis Safe (Advanced)

This uses the real Gnosis Safe SDK for more realistic testing:

**First, install Safe SDK:**
```bash
npm install @safe-global/safe-core-sdk @safe-global/safe-ethers-lib
```

**Then run:**
```bash
npm run test:multisig:real
```

Or directly:
```bash
npx hardhat run scripts/test-multisig-with-real-safe.js
```

---

## What the Scripts Do

### `test-multisig-local.js` (Mock Safe)

1. **Creates 5 wallets** - Generates 5 random wallets for multisig owners
2. **Funds wallets** - Sends 10 ETH to each wallet for gas
3. **Creates mock Safe** - Uses first wallet as Safe address (simplified)
4. **Deploys contracts** - Deploys SavitriCoin, TokenICO, and Airdrop
5. **Sets ownership** - Transfers ownership to Safe address
6. **Tests functions** - Tests owner-only functions and non-owner rejection
7. **Saves results** - Saves all addresses and info to `multisig-test-results.json`

### `test-multisig-with-real-safe.js` (Real Safe)

1. **Creates 5 wallets** - Generates 5 random wallets
2. **Deploys real Safe** - Uses Gnosis Safe SDK to deploy actual Safe contract
3. **Deploys contracts** - Deploys all contracts
4. **Tests multisig** - Creates and executes transactions via Safe (requires 3 signatures)
5. **Saves results** - Saves all info to `multisig-test-results-real-safe.json`

---

## Test Results

After running the script, you'll see:

```
✅ MULTISIG TEST SETUP COMPLETE!

📊 Summary:
  • Wallets created: 5
  • Safe address: 0x...
  • Threshold: 3 of 5
  • SavitriCoin: 0x...
  • TokenICO: 0x...
  • Airdrop: 0x...
  • All owner functions tested: ✅
  • Non-owner rejection tested: ✅
```

Results are saved to:
- `scripts/multisig-test-results.json` (mock Safe)
- `scripts/multisig-test-results-real-safe.json` (real Safe)

---

## What Gets Tested

### 1. Owner Functions

✅ **TokenICO:**
- `updateInitialUsdtPrice()` - Update token price
- `setSaleToken()` - Set sale token address

✅ **SavitriCoin:**
- `setBlockStatus()` - Block/unblock addresses

✅ **Airdrop:**
- `setMerkleRoot()` - Set Merkle root for airdrop

### 2. Security Tests

✅ **Non-owner rejection:**
- Verifies that non-owners cannot call owner functions
- Should revert with "Only owner" error

### 3. Ownership Verification

✅ **Checks:**
- SavitriCoin owner = Safe address
- TokenICO owner = Safe address (immutable)
- Airdrop owner = Safe address (immutable)

---

## Understanding the Results

### Mock Safe vs Real Safe

**Mock Safe (`test-multisig-local.js`):**
- ✅ Fast and simple
- ✅ No external dependencies
- ✅ Good for basic testing
- ⚠️ Doesn't test actual multisig signing process
- ⚠️ Uses first wallet as Safe (simplified)

**Real Safe (`test-multisig-with-real-safe.js`):**
- ✅ Tests actual Gnosis Safe contract
- ✅ Tests multisig signing process (3 of 5)
- ✅ More realistic to production
- ⚠️ Requires Safe SDK installation
- ⚠️ More complex setup

---

## Example Output

### Mock Safe Test

```
🚀 Starting Multisig Local Test Setup...

📝 Step 1: Creating 5 wallets...
  Wallet 1: 0x3bE584b7DeC2a2BC05f8F3Ab5fbe773c44C1612F
  Wallet 2: 0x2eA489e8ef47F8085D54c1693a563C43959B34da
  Wallet 3: 0x5540cbfbA47eA64e774b53632A05ac40ce8ccE4b
  Wallet 4: 0x7f995F3bEfF0F39AA0fB4bb288cE1d5fCE0CeBFF
  Wallet 5: 0x663993eee55d62Bd7CDC9Bc1BD32292e618a34ae

💰 Funding wallets with ETH...
  Funded 0x3bE584b7DeC2a2BC05f8F3Ab5fbe773c44C1612F with 10 ETH
  ...

🔐 Step 2: Creating mock Safe wallet...
  Safe Address: 0x3bE584b7DeC2a2BC05f8F3Ab5fbe773c44C1612F
  Owners: 5
  Threshold: 3 of 5

📦 Step 3: Deploying contracts...
  ✅ SavitriCoin deployed at: 0x5FC8d32690cc91D4c39d9d3abcBD16989F875707
  ✅ TokenICO deployed at: 0x414316c60045230EcBD528AE1b83629b11Df4D74
  ✅ Airdrop deployed at: 0x8927D9b60D1b7807DaCA1efd991D61D8d2A54EAc

🧪 Step 5: Testing owner functions...
  ✅ Price updated to: 40.0 USDT
  ✅ Sale token set
  ✅ Block status set
  ✅ Merkle root set
  ✅ Non-owner correctly rejected
```

---

## Results File Structure

The results file contains:

```json
{
  "wallets": [
    {
      "index": 1,
      "address": "0x...",
      "privateKey": "0x..." // ⚠️ Keep this secret!
    },
    ...
  ],
  "safe": {
    "safeAddress": "0x...",
    "owners": ["0x...", ...],
    "threshold": 3,
    "description": "Mock Safe for local testing (3 of 5 multisig)"
  },
  "contracts": {
    "savitriCoin": {
      "address": "0x...",
      "owner": "0x..."
    },
    "tokenICO": {
      "address": "0x...",
      "owner": "0x..."
    },
    "airdrop": {
      "address": "0x...",
      "owner": "0x...",
      "token": "0x..."
    }
  },
  "network": {
    "chainId": 31337,
    "blockNumber": 123
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**⚠️ Security Note:** The results file contains private keys! Never commit this file to git or share it publicly.

---

## Troubleshooting

### Issue: "Safe SDK not installed"

**Error:**
```
❌ Error: Safe SDK not installed!
```

**Solution:**
```bash
npm install @safe-global/safe-core-sdk @safe-global/safe-ethers-lib
```

Or use the mock Safe script instead:
```bash
npm run test:multisig
```

### Issue: "Only owner" error during tests

**Error:**
```
Error: Only owner
```

**Solution:**
- Check that contracts were deployed from Safe address
- Verify ownership was transferred correctly
- Make sure you're using the Safe signer for transactions

### Issue: "Insufficient funds"

**Error:**
```
Error: insufficient funds
```

**Solution:**
- The script automatically funds wallets with 10 ETH
- If this fails, check Hardhat network configuration
- Ensure deployer has enough ETH

### Issue: Contract deployment fails

**Error:**
```
Error: Contract code size exceeds limit
```

**Solution:**
- This is a warning, not an error
- TokenICO is large but should deploy on testnets
- For mainnet, consider enabling optimizer with low runs value

---

## Next Steps

After successful testing:

1. **Review results** - Check `multisig-test-results.json`
2. **Test in production** - Use real Gnosis Safe (see `MULTISIG_SETUP.md`)
3. **Deploy contracts** - Deploy with Safe as owner
4. **Monitor** - Set up monitoring for Safe transactions

---

## Production Deployment

For production, you need to:

1. **Create real Gnosis Safe** - See `MULTISIG_SETUP.md`
2. **Deploy from Safe** - Deploy contracts from Safe address
3. **Verify ownership** - Confirm all contracts have Safe as owner
4. **Test multisig** - Test with real Safe interface

**Important:** 
- TokenICO owner is `immutable` - must deploy from Safe address
- SavitriCoin uses `Ownable` - can transfer ownership after deployment
- Airdrop owner is `immutable` - must deploy from Safe address

---

## Related Documentation

- `MULTISIG_SETUP.md` - How to create real Gnosis Safe
- `MULTISIG_COMPARISON.md` - Safe vs built-in multisig
- `TESTING_MULTISIG.md` - General testing guide
- `SECURITY_AUDIT_FINAL.md` - Security audit results

---

## Summary

✅ **Mock Safe Test:**
- Fast and simple
- Good for basic testing
- No external dependencies

✅ **Real Safe Test:**
- More realistic
- Tests actual multisig
- Requires Safe SDK

Both tests verify:
- ✅ Contract deployment
- ✅ Ownership setup
- ✅ Owner functions work
- ✅ Non-owner rejection
- ✅ Security measures

