# Disk Space Cleanup Guide

## Current Disk Status

**Disk is 100% full (48G/48G)**

## Top Space Consumers

1. **`node_modules` (root)**: 1.6GB
2. **`web3/node_modules`**: 540MB
3. **`web3/artifacts`**: 3.1MB
4. **`web3/aartifacts_copy`**: 2.8MB (duplicate folder!)

## Safe to Delete (Can be Regenerated)

### 1. Node Modules (Can reinstall)

```bash
# Root node_modules
rm -rf /home/ubuntu/Presale_savitri_node/Presale_savitri_node/node_modules

# Web3 node_modules
rm -rf /home/ubuntu/Presale_savitri_node/Presale_savitri_node/web3/node_modules
```

**Space freed:** ~2.1GB

**To restore:**
```bash
cd /home/ubuntu/Presale_savitri_node/Presale_savitri_node
npm install

cd web3
npm install
```

### 2. Hardhat Cache & Artifacts

```bash
cd /home/ubuntu/Presale_savitri_node/Presale_savitri_node/web3

# Clean Hardhat cache
npx hardhat clean

# Or manually:
rm -rf cache
rm -rf artifacts
rm -rf aartifacts_copy  # Duplicate folder!
```

**Space freed:** ~6MB

**To restore:** Just compile again: `npx hardhat compile`

### 3. Next.js Cache (if exists)

```bash
rm -rf /home/ubuntu/Presale_savitri_node/Presale_savitri_node/.next
```

**Space freed:** Varies (can be 100MB+)

**To restore:** Next.js will rebuild on next run

### 4. Package Lock Files (Keep, but can regenerate)

```bash
# These are small but can be regenerated if needed
# Keep them for consistency, but if desperate:
# rm package-lock.json
# rm web3/package-lock.json
```

## Quick Cleanup Script

```bash
#!/bin/bash
# cleanup.sh

cd /home/ubuntu/Presale_savitri_node/Presale_savitri_node

echo "Cleaning node_modules..."
rm -rf node_modules
rm -rf web3/node_modules

echo "Cleaning Hardhat cache..."
cd web3
npx hardhat clean
rm -rf aartifacts_copy  # Remove duplicate

echo "Cleaning Next.js cache..."
cd ..
rm -rf .next

echo "Done! Run 'npm install' to restore dependencies."
```

## What NOT to Delete

❌ **Don't delete:**
- `contracts/` - Your Solidity code
- `scripts/` - Deployment scripts
- `test/` - Test files
- `data/` - CSV files
- `.env` files - Configuration
- Source code files

## After Cleanup

**To restore everything:**

```bash
# Root project
cd /home/ubuntu/Presale_savitri_node/Presale_savitri_node
npm install

# Web3 project
cd web3
npm install
npx hardhat compile
```

## Estimated Space After Cleanup

- **Before:** 48GB (100% full)
- **After cleanup:** ~45.9GB free
- **After reinstall:** ~46.5GB used (node_modules back)

## Recommendations

1. **Delete duplicate `aartifacts_copy`** - Definitely safe to remove
2. **Clean Hardhat cache** - Safe, can regenerate
3. **Delete node_modules if needed** - Can reinstall, but takes time
4. **Consider using `.gitignore`** - Don't commit node_modules
5. **Use `npm ci` instead of `npm install`** - Faster, cleaner installs

## Check Space After Cleanup

```bash
df -h /
du -sh /home/ubuntu/Presale_savitri_node/Presale_savitri_node/*
```

