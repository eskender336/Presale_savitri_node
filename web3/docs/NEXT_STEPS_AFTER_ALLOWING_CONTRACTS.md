# Next Steps After Allowing Contracts

## Overview

After executing the Safe transaction to allow both TokenICO and PrivateSaleDistribution contracts, follow these steps to distribute tokens to private sale participants.

## Step 1: Execute Safe Transaction ✅

**File:** `web3/safe-transactions/allow-both-contracts.json`

1. Go to https://app.safe.global/
2. Connect your Safe wallet (0xbC08bF77697271F1617728c7Cd049b596d13b3ba)
3. Navigate to "Apps" → "Transaction Builder"
4. Click "Import" and upload `allow-both-contracts.json`
5. Review the two transactions:
   - `setAllowedSender(TokenICO, true)`
   - `setAllowedSender(PrivateSaleDistribution, true)`
6. Sign the transaction (requires multiple signatures based on your Safe threshold)
7. Execute the transaction
8. Wait for confirmation on BSC

## Step 2: Verify Contracts Are Allowed ✅

After the Safe transaction is confirmed, verify both contracts are now allowed:

```bash
cd web3
npx hardhat run scripts/check-and-allow-contracts.js --network bsc
```

You should see:
- ✅ TokenICO: Allowed: true
- ✅ PrivateSaleDistribution: Allowed: true

## Step 3: Distribute Tokens from PrivateSaleDistribution Contract 🚀

Once both contracts are allowed, run the distribution script:

```bash
cd web3
npx hardhat run scripts/distribute-private-sale-from-contract.js --network bsc
```

**What this script does:**
- Reads all 118 addresses from `data/private-sale-distribution.csv`
- Checks which recipients haven't received tokens yet
- Splits recipients into batches of 100 (contract limit)
- Sends tokens from PrivateSaleDistribution contract to each recipient
- Shows progress for each batch
- Verifies final balances

**Expected output:**
- Batch 1/2: 100 recipients, ~37,055 SAV
- Batch 2/2: 18 recipients, ~3,500 SAV
- Total: ~40,555 SAV distributed

## Step 4: Verify Distribution ✅

After distribution completes, verify:

1. **Check contract balance:**
   ```bash
   # The PrivateSaleDistribution contract should have remaining balance
   # (1M SAV - ~40,555 SAV = ~959,445 SAV remaining)
   ```

2. **Check individual recipients:**
   - Use BSCScan to verify tokens were sent to each address
   - Example: https://bscscan.com/address/0xC73961f3df615B1E1e79942c0298Dd63C3754dE1#tokentxns

3. **Verify on-chain:**
   - All transactions will be visible on BSCScan
   - Each recipient will have received their tokens
   - The contract's `sent` mapping will mark each address as having received tokens

## Step 5: TokenICO is Ready for Public Sale 🎉

After Step 1, TokenICO is also ready to:
- Accept purchases from users
- Send tokens to buyers during the public sale
- TokenICO already has 10M SAV tokens (from previous funding)

## Summary Checklist

- [ ] Execute Safe transaction `allow-both-contracts.json`
- [ ] Verify both contracts are in `allowedSenders`
- [ ] Run `distribute-private-sale-from-contract.js`
- [ ] Verify all 118 recipients received tokens
- [ ] TokenICO is ready for public sale

## Important Notes

⚠️ **Before Distribution:**
- Ensure PrivateSaleDistribution contract has sufficient balance (currently has 1M SAV)
- The script will check balance before starting
- Total needed: ~40,555 SAV for all 118 recipients

⚠️ **During Distribution:**
- The script sends in batches of 100 recipients per transaction
- Each batch is a separate on-chain transaction
- There's a 3-second delay between batches
- If a batch fails, you can re-run the script (it skips already-sent recipients)

⚠️ **After Distribution:**
- Recipients cannot receive tokens twice (contract prevents this)
- Remaining tokens stay in PrivateSaleDistribution contract
- You can withdraw remaining tokens using `withdrawTokens()` if needed

## Troubleshooting

**If distribution fails:**
1. Check that Safe transaction was executed and confirmed
2. Verify contracts are in `allowedSenders` using the check script
3. Check contract balance is sufficient
4. Check network connection and gas prices

**If some recipients already received tokens:**
- The script automatically skips them
- Check `hasReceived(address)` on the contract to verify

## Files Reference

- **Safe Transaction:** `web3/safe-transactions/allow-both-contracts.json`
- **Distribution Script:** `web3/scripts/distribute-private-sale-from-contract.js`
- **Check Script:** `web3/scripts/check-and-allow-contracts.js`
- **CSV Data:** `data/private-sale-distribution.csv`

## Contract Addresses

- **SavitriCoin:** 0xbfF00512c08477E9c03DE507fCD5C9b087fe6813
- **TokenICO:** 0x0D3aC358121Ed8e23f80dA496a5CcBBD2b209262
- **PrivateSaleDistribution:** 0x20d62B0659C25CF27D168E9635234179B22e10A7
- **Safe Wallet:** 0xbC08bF77697271F1617728c7Cd049b596d13b3ba

