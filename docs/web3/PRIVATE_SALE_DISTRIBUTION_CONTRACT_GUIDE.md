# Airdrop Contract Guide

## Overview

Separate `Airdrop.sol` contract for decentralized airdrop using Merkle tree. **No multisig needed for users to claim!**

## How It Works

1. **Generate Merkle tree** from CSV (off-chain)
2. **Deploy Airdrop contract** (one-time)
3. **Set Merkle root** on contract (via Safe, one-time)
4. **Users claim themselves** using Merkle proof (no multisig needed!)

## Benefits

✅ **No multisig for claims** - users claim themselves  
✅ **Cheap** - only Merkle root stored on-chain  
✅ **Decentralized** - no admin intervention needed  
✅ **Scalable** - works for millions of recipients  
✅ **Transparent** - Merkle tree can be published  

## Setup Steps

### Step 1: Generate Merkle Tree

```bash
cd web3
node scripts/generate-merkle-tree.js [path-to-csv]
```

This creates:
- `merkle-root.json` - Root to set on contract
- `merkle-tree-data.json` - Full data with proofs for each user

### Step 2: Deploy Airdrop Contract

```bash
node scripts/deploy-airdrop.js --network localhost
```

Or for production:
```bash
node scripts/deploy-airdrop.js --network bsc
```

### Step 3: Fund Airdrop Contract

Transfer tokens to airdrop contract:

```javascript
// Via Safe or owner
await savitriToken.transfer(airdropAddress, totalAirdropAmount);
```

### Step 4: Set Merkle Root

```javascript
// Via Safe (one-time setup)
await airdrop.setMerkleRoot(merkleRoot);
```

### Step 5: Users Claim

Users claim themselves using proof from `merkle-tree-data.json`:

```javascript
// User's wallet
const proof = [...]; // from merkle-tree-data.json
const amount = ethers.utils.parseEther("1000");
await airdrop.claim(amount, proof);
```

## Contract Functions

### For Users

```solidity
// Claim airdrop tokens
function claim(uint256 amount, bytes32[] calldata merkleProof) external
```

### For Owner (via Safe)

```solidity
// Set Merkle root (one-time)
function setMerkleRoot(bytes32 _merkleRoot) external onlyOwner

// Set claim end time (optional)
function setClaimEndTime(uint256 _claimEndTime) external onlyOwner

// Batch claim for edge cases (if needed)
function batchClaim(address[] calldata recipients, uint256[] calldata amounts) external onlyOwner

// Withdraw unclaimed tokens after claim period
function withdrawUnclaimed(address to, uint256 amount) external onlyOwner
```

## Comparison: Old vs New

| Aspect | Old (Multisig) | New (Merkle Tree) |
|--------|---------------|-------------------|
| **User Experience** | ❌ Wait for admin | ✅ Claim instantly |
| **Admin Work** | ❌ Many transactions | ✅ One-time setup |
| **Gas Cost** | ❌ High (admin pays) | ✅ Low (users pay) |
| **Multisig Needed** | ❌ Every batch | ✅ Only for setup |
| **Scalability** | ⚠️ Limited | ✅ Millions of users |

## Security

- ✅ **Owner is Safe** - multisig for setup only
- ✅ **Users verify themselves** - Merkle proof validation
- ✅ **No single point of failure** - users control their claims
- ✅ **Transparent** - Merkle tree can be published

## Example Workflow

### Admin Setup (One-time, via Safe)

```javascript
// 1. Generate tree
node scripts/generate-merkle-tree.js

// 2. Deploy contract
node scripts/deploy-airdrop.js

// 3. Transfer tokens
await token.transfer(airdropAddress, totalAmount);

// 4. Set root (via Safe)
await airdrop.setMerkleRoot(root);

// 5. (Optional) Set end time
await airdrop.setClaimEndTime(endTimestamp);
```

### User Claiming (No multisig needed!)

```javascript
// User gets proof from your website/API
const userData = merkleTreeData.recipients.find(r => r.address === userAddress);
const proof = userData.proof;
const amount = userData.amount;

// User claims
await airdrop.claim(amount, proof);
// ✅ Done! Tokens received
```

## Integration with Frontend

Your website can:
1. Load `merkle-tree-data.json`
2. Find user's proof by address
3. Show claim button
4. User clicks → calls `airdrop.claim(amount, proof)`

Example:
```javascript
// Frontend
const userProof = airdropData.recipients.find(r => 
  r.address.toLowerCase() === userAddress.toLowerCase()
);

if (userProof && !claimed) {
  // Show claim button
  await airdropContract.claim(userProof.amount, userProof.proof);
}
```

## Unclaimed Tokens

After claim period ends, owner can withdraw unclaimed tokens:

```javascript
await airdrop.withdrawUnclaimed(safeAddress, unclaimedAmount);
```

## Summary

**Old approach (multisig):**
- Admin sends tokens via Safe
- Needs 3+ signatures per batch
- Slow and inconvenient

**New approach (Merkle tree):**
- Users claim themselves
- Only setup needs Safe (one-time)
- Fast, cheap, decentralized! 🚀

