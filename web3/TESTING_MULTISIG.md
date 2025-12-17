# Testing Multisig Wallet (Gnosis Safe) Locally with Hardhat

This guide shows how to test Gnosis Safe multisig wallet functionality locally with Hardhat.

## Quick Start

Since your contracts now use simple `onlyOwner` modifier, testing is straightforward:

```bash
# Run the Safe multisig test
npx hardhat test test/safeMultisig.test.js
```

## Current Approach (Simplified)

Your contracts have been simplified to use `onlyOwner` instead of built-in multisig. For local testing:

1. **Use regular signers as owners** - Works perfectly for testing
2. **In production** - Deploy contracts from Safe address

## Test Structure

The test file `test/safeMultisig.test.js` includes:

- ✅ Owner-only function tests
- ✅ Non-owner rejection tests  
- ✅ Multisig simulation helpers
- ✅ Full ICO setup workflow

## Running Tests

```bash
# Run all tests
npx hardhat test

# Run Safe multisig tests only
npx hardhat test test/safeMultisig.test.js

# Run with verbose output
npx hardhat test --verbose
```

## Helper Functions

The `test/helpers/safeHelpers.js` provides:

- `deployMockSafe()` - Creates a mock Safe for testing
- `executeViaMultisig()` - Simulates multisig execution
- `testOwnerOnly()` - Helper to test owner-only functions

## Production Deployment

For production, you have two options:

### Option 1: Deploy from Safe (Recommended for TokenICO)

Since `TokenICO` has `immutable owner`, deploy it directly from Safe address:

```javascript
// In deployment script
const SAFE_ADDRESS = process.env.SAFE_ADDRESS;

// Deploy TokenICO from Safe address
// This requires configuring Hardhat to use Safe as deployer
const tokenICO = await TokenICO.deploy();
// Owner will be Safe address
```

### Option 2: Transfer Ownership (For SavitriCoin)

`SavitriCoin` uses `Ownable`, so you can transfer ownership:

```javascript
// Deploy normally
const savitriToken = await SavitriCoin.deploy();

// Transfer ownership to Safe
await savitriToken.transferOwnership(SAFE_ADDRESS);
// Ownership is transferred immediately (no acceptOwnership needed)
```

## Advanced: Using Real Safe SDK

If you want to test with actual Safe SDK (more complex but closer to production):

### Step 1: Install Safe SDK

```bash
npm install @safe-global/safe-core-sdk @safe-global/safe-ethers-lib
```

### Step 2: Deploy Safe in Tests

```javascript
const Safe = require("@safe-global/safe-core-sdk").default;
const { SafeFactory } = require("@safe-global/safe-core-sdk");
const EthersAdapter = require("@safe-global/safe-ethers-lib").default;

async function deploySafe(owners, threshold = 3) {
  const [deployer] = await ethers.getSigners();
  
  const ethAdapter = new EthersAdapter({
    ethers,
    signerOrProvider: deployer,
  });

  const safeFactory = await SafeFactory.init({ ethAdapter });
  const safeSdk = await safeFactory.deploySafe({
    safeAccountConfig: { owners, threshold },
  });

  return safeSdk;
}
```

### Step 3: Create and Execute Transactions

```javascript
// Create transaction
const safeTransaction = await safeSdk.createTransaction({
  safeTransactionData: {
    to: tokenICO.address,
    value: "0",
    data: tokenICO.interface.encodeFunctionData("updateInitialUsdtPrice", [newPrice]),
  },
});

// Sign with multiple owners
await safeSdk.signTransaction(safeTransaction); // owner1
// ... more signatures

// Execute
await safeSdk.executeTransaction(safeTransaction);
```

## Notes

1. **Local testing is simplified** - Uses regular signers, which is fine for testing
2. **Production uses Safe** - Deploy from Safe address or transfer ownership
3. **TokenICO owner is immutable** - Must deploy from Safe address
4. **SavitriCoin uses Ownable** - Can transfer ownership after deployment

## Troubleshooting

### Issue: Tests fail with "Only owner"
- Make sure you're using the correct owner signer
- Check that ownership was transferred correctly

### Issue: Safe SDK not found
```bash
npm install @safe-global/safe-core-sdk @safe-global/safe-ethers-lib
```

### Issue: Need more signers in tests
Hardhat provides 20 signers by default. If you need more, configure in `hardhat.config.js`:

```javascript
networks: {
  hardhat: {
    accounts: {
      count: 50, // More accounts for testing
    },
  },
}
```
