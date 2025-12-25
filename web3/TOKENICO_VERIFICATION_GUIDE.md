# TokenICO Contract Verification Guide

## Contract Address
`0x0D3aC358121Ed8e23f80dA496a5CcBBD2b209262`

## Important Notes
- TokenICO uses **external libraries** (PriceCalculationLibrary, StakingLibrary)
- Constructor takes **one argument**: the owner address
- The flattened file includes all library code inline

## Library Addresses
- **PriceCalculationLibrary**: `0x5D56a3c8C762ebE3cb407D0Be5FA874c18d5a28f`
- **StakingLibrary**: `0x48F0E906c2f518d340398Eb825678ACB509bcC47`

## Constructor Argument
- **Owner address**: `0xbC08bF77697271F1617728c7Cd049b596d13b3ba` (Safe wallet)

## Verification Steps on BSCScan

### Method 1: Flattened Single File (Easiest)

1. Go to: https://bscscan.com/verifyContract
2. Enter contract address: `0x0D3aC358121Ed8e23f80dA496a5CcBBD2b209262`
3. Select: **"Solidity (Single file)"**
4. Compiler Version: `v0.8.19+commit.7dd6d404` (or try `v0.8.0+commit.c7dfd78e`)
5. EVM Version: `default` or `paris` (for 0.8.19) or `london` (for 0.8.0)
6. Optimization: `Yes`
7. Runs: `0`
8. License: `MIT`
9. Source Code: Paste entire content from `TokenICO_flattened.sol`
10. **Constructor Arguments (ABI-encoded)**: 
    ```
    000000000000000000000000bc08bf77697271f1617728c7cd049b596d13b3ba
    ```
    (This is the owner address `0xbC08bF77697271F1617728c7Cd049b596d13b3ba` padded to 32 bytes)

11. Click "Verify and Publish"

### Method 2: Standard JSON Input (If libraries are needed separately)

1. Select: **"Solidity (Standard JSON Input)"**
2. Upload: `tokenico-standard-json.json` (if generated)
3. Contract Name: `TokenICO`
4. Constructor Arguments: `0xbC08bF77697271F1617728c7Cd049b596d13b3ba`
5. Library addresses (if prompted):
   - `PriceCalculationLibrary`: `0x5D56a3c8C762ebE3cb407D0Be5FA874c18d5a28f`
   - `StakingLibrary`: `0x48F0E906c2f518d340398Eb825678ACB509bcC47`

## ABI-Encoding the Constructor Argument

The constructor takes one parameter: `address _owner`

To ABI-encode `0xbC08bF77697271F1617728c7Cd049b596d13b3ba`:
- Remove `0x` prefix
- Pad to 64 characters (32 bytes): `000000000000000000000000bc08bf77697271f1617728c7cd049b596d13b3ba`

Or use an online tool: https://abi.hashex.org/

## Files Available
- `TokenICO_flattened.sol` - Complete flattened contract (2215 lines)
- `tokenico-standard-json.json` - Standard JSON Input (if generated)

## Troubleshooting

### Bytecode Mismatch
- Try different compiler versions (0.8.0, 0.8.19)
- Try different EVM versions (london, paris, default)
- Try with/without viaIR
- Try different optimization runs (0, 200)

### Library Linking Issues
- Use the flattened file (includes all libraries inline)
- Or provide library addresses in Standard JSON Input

### Constructor Arguments
- Make sure to ABI-encode the owner address correctly
- The owner is: `0xbC08bF77697271F1617728c7Cd049b596d13b3ba`

