# SavitriCoin Contract Verification Guide

## Contract Address
`0xbfF00512c08477E9c03DE507fCD5C9b087fe6813`

## Verification Steps on BSCScan

### Method 1: Standard JSON Input (Recommended)

1. Go to: https://bscscan.com/verifyContract
2. Enter contract address: `0xbfF00512c08477E9c03DE507fCD5C9b087fe6813`
3. Select: **"Solidity (Standard JSON Input)"**
4. Upload one of these files (try in order):

#### Try these files in order:

**Option 1 (Most Likely):**
- File: `savitri-standard-json-no-viair.json`
- Compiler Version: `v0.8.19+commit.7dd6d404`
- EVM Version: `default` or `paris`
- Optimization: `Yes`
- Runs: `0`
- viaIR: `No` (unchecked)

**Option 2:**
- File: `savitri-standard-json-no-viair-london.json`
- Compiler Version: `v0.8.19+commit.7dd6d404`
- EVM Version: `london` or `default`
- Optimization: `Yes`
- Runs: `0`
- viaIR: `No`

**Option 3:**
- File: `savitri-standard-json-with-viair.json`
- Compiler Version: `v0.8.19+commit.7dd6d404`
- EVM Version: `default` or `paris`
- Optimization: `Yes`
- Runs: `0`
- viaIR: `Yes` (if option available)

**Option 4:**
- File: `savitri-standard-json-no-viair-080.json`
- Compiler Version: `v0.8.0+commit.c7dfd78e`
- EVM Version: `london` or `default`
- Optimization: `Yes`
- Runs: `0`
- viaIR: `No`

5. Contract Name: `SavitriCoin`
6. Constructor Arguments: Leave empty (no constructor args)
7. Click "Verify and Publish"

### Method 2: Flattened Single File

If Standard JSON Input doesn't work:

1. Use: `SavitriCoin_flattened.sol`
2. Select: **"Solidity (Single file)"**
3. Compiler Version: `v0.8.19+commit.7dd6d404` or `v0.8.0+commit.c7dfd78e`
4. EVM Version: `default` or `london`
5. Optimization: `Yes`, Runs: `0`
6. License: `MIT`

## Programmatic Verification (Requires API Key)

If you have BSCSCAN_API_KEY set in `.env`:

```bash
cd web3
npx hardhat run verify-savitri.js --network bsc
```

## Troubleshooting

### Bytecode Mismatch
- Try different compiler versions (0.8.0, 0.8.19)
- Try different EVM versions (london, paris, default)
- Try with/without viaIR
- Try different optimization runs (0, 200)

### Invalid EVM Version
- Solidity 0.8.0 uses `london` EVM version
- Solidity 0.8.19 uses `paris` or `default` EVM version
- Use `default` if unsure

### Missing Dependencies
- All Standard JSON Input files include all OpenZeppelin dependencies
- Make sure you're using Standard JSON Input, not Single file

## Current Compiler Settings (hardhat.config.js)

- Solidity: `0.8.19`
- Optimizer: `enabled: true, runs: 0`
- viaIR: `true`
- EVM Version: `paris` (default for 0.8.19)

**Note:** The deployed contract may have been compiled with different settings!

