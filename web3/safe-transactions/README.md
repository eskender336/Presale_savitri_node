# Safe Transaction Data for TokenICO Configuration

## Generated Files

1. **tokenico-config-tx-builder.json** - For Safe Transaction Builder (recommended)
2. **tokenico-config-simple.json** - Simple format with transaction details

## Transactions to Execute

### Transaction 1: setSigner
- **To:** 0x0D3aC358121Ed8e23f80dA496a5CcBBD2b209262
- **Function:** setSigner(address)
- **Parameter:** 0xDca5AF91A9d0665e96a65712bF38382044edec54
- **Data:** 0x6c19e783000000000000000000000000dca5af91a9d0665e96a65712bf38382044edec54

### Transaction 2: setSaleToken
- **To:** 0x0D3aC358121Ed8e23f80dA496a5CcBBD2b209262
- **Function:** setSaleToken(address)
- **Parameter:** 0xbfF00512c08477E9c03DE507fCD5C9b087fe6813
- **Data:** 0xa29f481c000000000000000000000000bff00512c08477e9c03de507fcd5c9b087fe6813

## How to Execute

### Option 1: Using Safe Transaction Builder (Recommended)

1. Go to https://app.safe.global/
2. Connect your Safe wallet
3. Go to "Apps" → "Transaction Builder"
4. Click "Load transaction" or "Import"
5. Upload the file: `tokenico-config-tx-builder.json`
6. Review the transactions
7. Click "Send batch" or "Create transaction"
8. Get required signatures
9. Execute

### Option 2: Manual Entry in Safe Interface

1. Go to your Safe wallet interface
2. Click "New transaction" → "Contract interaction"
3. Enter contract address: 0x0D3aC358121Ed8e23f80dA496a5CcBBD2b209262
4. For each transaction:
   - **Transaction 1:**
     - Function: setSigner
     - Parameter: 0xDca5AF91A9d0665e96a65712bF38382044edec54
   - **Transaction 2:**
     - Function: setSaleToken
     - Parameter: 0xbfF00512c08477E9c03DE507fCD5C9b087fe6813
5. Create batch transaction
6. Get required signatures
7. Execute

### Option 3: Using Safe CLI (Advanced)

```bash
# Install Safe CLI if needed
npm install -g @safe-global/safe-cli

# Execute transactions
safe-cli send-transaction \
  --safe 0xbC08bF77697271F1617728c7Cd049b596d13b3ba \
  --to 0x0D3aC358121Ed8e23f80dA496a5CcBBD2b209262 \
  --data 0x6c19e783000000000000000000000000dca5af91a9d0665e96a65712bf38382044edec54 \
  --network bsc

safe-cli send-transaction \
  --safe 0xbC08bF77697271F1617728c7Cd049b596d13b3ba \
  --to 0x0D3aC358121Ed8e23f80dA496a5CcBBD2b209262 \
  --data 0xa29f481c000000000000000000000000bff00512c08477e9c03de507fcd5c9b087fe6813 \
  --network bsc
```

## Verification

After execution, verify the configuration:

```bash
npx hardhat run scripts/configure-tokenico.js --network bsc
```

## Network

- **Chain:** BSC (Binance Smart Chain)
- **Chain ID:** 56
- **Safe Address:** 0xbC08bF77697271F1617728c7Cd049b596d13b3ba
- **TokenICO Address:** 0x0D3aC358121Ed8e23f80dA496a5CcBBD2b209262
