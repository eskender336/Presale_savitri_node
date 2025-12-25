# Safe Transaction Data for Contract Funding (FIXED)

## ⚠️ IMPORTANT FIXES

1. **Operation is explicitly set to CALL (0)**, not delegateCall (1)
2. **Includes setAllowedSender calls** if transfers are disabled

## Generated Files

1. **fund-both-contracts-simple.json** - Just transfers (use if Safe is already allowed)
2. **fund-both-contracts-with-allowed.json** - Sets allowed senders first, then transfers (RECOMMENDED if you get "Transfers disabled" error)

## The Problem

Your previous transaction failed because:
1. ❌ Operation was set to delegateCall (1) instead of CALL (0)
2. ❌ "Transfers disabled" - Safe wallet or contracts not in allowedSenders

## Solution

### Option 1: If Safe is already allowed (simple)
- Use: `fund-both-contracts-simple.json`
- Just transfers tokens

### Option 2: If transfers are disabled (recommended)
- Use: `fund-both-contracts-with-allowed.json`
- First sets allowedSenders for:
  - Safe wallet (so it can transfer)
  - TokenICO (so it can receive and distribute)
  - PrivateSaleDistribution (so it can receive and distribute)
- Then transfers tokens

## How to Execute

1. Go to https://app.safe.global/
2. Connect your Safe wallet
3. Go to "Apps" → "Transaction Builder"
4. Import: `fund-both-contracts-with-allowed.json` (recommended)
5. **VERIFY operation is CALL (0) for ALL transactions**
6. Review carefully
7. Get signatures and execute

## Contract Addresses

- **SavitriCoin**: 0xbfF00512c08477E9c03DE507fCD5C9b087fe6813
- **TokenICO**: 0x0D3aC358121Ed8e23f80dA496a5CcBBD2b209262
- **PrivateSaleDistribution**: 0x20d62B0659C25CF27D168E9635234179B22e10A7
- **Safe Wallet**: 0xbC08bF77697271F1617728c7Cd049b596d13b3ba

## Funding Amounts

- **TokenICO**: 10000000 SAV
- **PrivateSaleDistribution**: 1000000 SAV
