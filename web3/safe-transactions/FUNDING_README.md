# Safe Transaction Data for Contract Funding

## Generated Files

1. **fund-tokenico.json** - Fund TokenICO contract only (10M SAV)
2. **fund-private-sale.json** - Fund PrivateSaleDistribution contract only (1M SAV)
3. **fund-both-contracts.json** - Fund both contracts in one batch transaction (recommended)

## Funding Amounts

- **TokenICO**: 10000000 SAV (10000000000000000000000000 wei)
- **PrivateSaleDistribution**: 1000000 SAV (1000000000000000000000000 wei)

## Contract Addresses

- **SavitriCoin Token**: 0xbfF00512c08477E9c03DE507fCD5C9b087fe6813
- **TokenICO**: 0x0D3aC358121Ed8e23f80dA496a5CcBBD2b209262
- **PrivateSaleDistribution**: 0x20d62B0659C25CF27D168E9635234179B22e10A7
- **Safe Wallet**: 0xbC08bF77697271F1617728c7Cd049b596d13b3ba

## Transaction Details

### Transaction 1: Fund TokenICO
- **To:** 0xbfF00512c08477E9c03DE507fCD5C9b087fe6813
- **Function:** transfer(address, uint256)
- **Parameters:**
  - to: 0x0D3aC358121Ed8e23f80dA496a5CcBBD2b209262
  - amount: 10000000000000000000000000
- **Data:** 0xa9059cbb0000000000000000000000000d3ac358121ed8e23f80da496a5ccbbd2b209262000000000000000000000000000000000000000000084595161401484a000000

### Transaction 2: Fund PrivateSaleDistribution
- **To:** 0xbfF00512c08477E9c03DE507fCD5C9b087fe6813
- **Function:** transfer(address, uint256)
- **Parameters:**
  - to: 0x20d62B0659C25CF27D168E9635234179B22e10A7
  - amount: 1000000000000000000000000
- **Data:** 0xa9059cbb00000000000000000000000020d62b0659c25cf27d168e9635234179b22e10a700000000000000000000000000000000000000000000d3c21bcecceda1000000

## How to Execute

### Option 1: Using Safe Transaction Builder (Recommended)

1. Go to https://app.safe.global/
2. Connect your Safe wallet
3. Go to "Apps" → "Transaction Builder"
4. Click "Load transaction" or "Import"
5. Upload one of the JSON files:
   - `fund-both-contracts.json` (recommended - both in one batch)
   - `fund-tokenico.json` (TokenICO only)
   - `fund-private-sale.json` (PrivateSaleDistribution only)
6. Review the transactions carefully:
   - Verify amounts are correct
   - Verify recipient addresses are correct
   - Verify operation is CALL (0), not delegateCall (1)
7. Click "Send batch" or "Create transaction"
8. Get required signatures (3+ from Safe owners)
9. Execute the transaction

### Option 2: Manual Entry in Safe Interface

1. Go to your Safe wallet interface
2. Click "New transaction" → "Contract interaction"
3. Enter contract address: 0xbfF00512c08477E9c03DE507fCD5C9b087fe6813
4. For each transaction:
   - **Transaction 1 (TokenICO):**
     - Function: transfer
     - Parameters:
       - to: 0x0D3aC358121Ed8e23f80dA496a5CcBBD2b209262
       - amount: 10000000000000000000000000
   - **Transaction 2 (PrivateSaleDistribution):**
     - Function: transfer
     - Parameters:
       - to: 0x20d62B0659C25CF27D168E9635234179B22e10A7
       - amount: 1000000000000000000000000
5. Create batch transaction
6. Get required signatures
7. Execute

## Security Notes

⚠️ **IMPORTANT SECURITY CHECKS:**
- ✅ Verify operation is CALL (0), NOT delegateCall (1)
- ✅ Double-check recipient addresses
- ✅ Double-check amounts before signing
- ✅ Ensure Safe has sufficient token balance
- ✅ These are initial funding amounts - more can be added later as needed

## Verification

After execution, verify the funding:

```bash
# Check TokenICO balance
npx hardhat run scripts/check-tokenico-state.js --network bsc

# Check PrivateSaleDistribution balance
# (You can check on BSCScan or use a custom script)
```

## Network

- **Chain:** BSC (Binance Smart Chain)
- **Chain ID:** 56
- **Safe Address:** 0xbC08bF77697271F1617728c7Cd049b596d13b3ba
