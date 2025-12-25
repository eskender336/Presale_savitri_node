# Transfer Tokens from Deployer to Safe

## ⚠️ IMPORTANT: Execute This FIRST

Before executing `fund-both-contracts-with-allowed.json`, you need to transfer tokens from the deployer address to Safe wallet.

## Current Situation

- **Deployer** (0xb18006ab8d4c566f8d682d80b4f54ea5529c307d): Has 599.5M SAV tokens ✅
- **Safe Wallet**: Has 0 SAV tokens ❌
- **Needed**: 11M SAV (10M for TokenICO + 1M for PrivateSaleDistribution)

## Solution

Transfer tokens from deployer to Safe wallet first.

## IMPORTANT NOTE

⚠️ **These transactions must be executed FROM THE DEPLOYER ADDRESS**, not from Safe!

The deployer address (0xb18006ab8d4c566f8d682d80b4f54ea5529c307d) needs to:
1. Call `setAllowedSender(deployer, true)` (if transfers are disabled)
2. Call `transfer(Safe, 15000000)` to send tokens to Safe

## Options

### Option 1: Manual Transfer (Recommended if deployer is a regular wallet)

If deployer is a regular wallet (not Safe):

1. Connect deployer wallet to MetaMask or your wallet
2. Go to BSCScan: https://bscscan.com/address/0xbfF00512c08477E9c03DE507fCD5C9b087fe6813#writeContract
3. Connect deployer wallet
4. Call `setAllowedSender`:
   - user: 0xb18006ab8d4c566f8d682d80b4f54ea5529c307d
   - allowed: true
5. Call `transfer`:
   - to: 0xbC08bF77697271F1617728c7Cd049b596d13b3ba
   - amount: 15000000000000000000000000

### Option 2: If Deployer is Safe Owner

If deployer is one of the Safe owners, you can create a Safe transaction, but it will still need to be executed from deployer's wallet.

## After Transfer

Once Safe has tokens, then execute:
- `fund-both-contracts-with-allowed.json`

## Files Generated

1. **deployer-to-safe-with-allowed.json** - Sets allowed sender first, then transfers
2. **deployer-to-safe-simple.json** - Just transfer (if deployer already allowed)

## Contract Addresses

- **SavitriCoin**: 0xbfF00512c08477E9c03DE507fCD5C9b087fe6813
- **Deployer**: 0xb18006ab8d4c566f8d682d80b4f54ea5529c307d
- **Safe Wallet**: 0xbC08bF77697271F1617728c7Cd049b596d13b3ba
- **Transfer Amount**: 15000000 SAV (15000000000000000000000000 wei)
