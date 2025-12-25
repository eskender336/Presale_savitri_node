# Simple Explanation: setSigner and setSaleToken

## Think of TokenICO like a vending machine

The vending machine needs to know 2 things:
1. **What product to give** (setSaleToken)
2. **Who can create VIP passes** (setSigner)

---

## 1. setSaleToken(address _token)

**Simple explanation:** Tells the contract which token to give to buyers.

**Example:**
- You set: `setSaleToken(0xbfF00512c08477E9c03DE507fCD5C9b087fe6813)`
- This is your SavitriCoin token address
- When someone buys, they receive SavitriCoin tokens

**Why needed:**
- Without this, the contract doesn't know which token to send
- Purchases would fail

---

## 2. setSigner(address _signer)

**Simple explanation:** Sets who can create special "VIP passes" (vouchers) for whitelist/referral purchases.

**Address:** `0xDca5AF91A9d0665e96a65712bF38382044edec54`

### What are vouchers?

Vouchers are like VIP passes that give special benefits:
- **Whitelist access** - User gets waitlisted automatically
- **Referral benefits** - User can have a referrer

### How it works (step by step):

1. **Backend creates a voucher:**
   ```
   Voucher contains:
   - User address: 0x1234...
   - Referrer address: 0x5678... (optional)
   - Nonce: 1 (prevents reuse)
   - Deadline: Dec 31, 2024
   ```

2. **Backend signs it:**
   - Uses the signer's private key (for address `0xDca5AF91A9d0665e96a65712bF38382044edec54`)
   - Creates a cryptographic signature

3. **User buys with voucher:**
   ```solidity
   buyWithBNB_Voucher(voucher, signature)
   ```

4. **Contract checks:**
   - Is signature valid? (Does it match the signer address?)
   - Is voucher expired? (Check deadline)
   - Was it used before? (Check nonce)

5. **If valid:**
   - User gets waitlisted automatically
   - Referrer gets referral rewards
   - Purchase goes through

### Real-world analogy:

Think of it like a concert:
- **Regular purchase:** Anyone can buy a ticket (no voucher needed)
- **VIP purchase:** Need a special pass signed by the promoter (voucher)
- **Signer:** The promoter who can create these VIP passes

### Why needed:

- Allows you to control who gets whitelisted (off-chain)
- Enables referral system without storing everything on-chain
- More flexible than hardcoding addresses in the contract

---

## Summary

| Function | What it does | Why needed |
|----------|--------------|------------|
| `setSaleToken()` | Tells contract which token to give buyers | Without this, purchases fail |
| `setSigner()` | Sets who can create VIP vouchers | Enables whitelist/referral system |

**Both must be set for the contract to work properly!**



