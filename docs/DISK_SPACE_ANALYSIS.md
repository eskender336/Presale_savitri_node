# Disk Space Analysis - Root Cause Found!

## Problem: Disk 100% Full (48G/48G)

## Main Culprits:

### 1. `/home/ubuntu/.npm` - **13GB** 🔴
**This is the biggest problem!**

NPM cache storing all downloaded packages. Can be safely cleared.

### 2. `/home/ubuntu/Presale_savitri_node` - 2.2GB
- `node_modules` (root): 1.6GB
- `web3/node_modules`: 540MB
- `.next`: 421MB
- Other files: ~100MB

### 3. `/var/lib` - 2.8GB
- Docker: 1.3GB
- Snapd: 1.3GB
- Other: ~200MB

### 4. `/var/log` - 843MB
- Journal logs: 809MB
- Other logs: ~34MB

### 5. PM2 Logs - Unknown size
- Found large log files in `/home/ubuntu/.pm2/logs/`

## Quick Fix - Free ~15GB+ Space

### Step 1: Clear NPM Cache (Frees ~13GB!)

```bash
npm cache clean --force
# Or
rm -rf ~/.npm
```

**Space freed:** ~13GB  
**Safe:** ✅ Yes, NPM will re-download packages as needed

### Step 2: Clear PM2 Logs

```bash
# Clear old PM2 logs
pm2 flush

# Or manually:
rm -rf ~/.pm2/logs/*.log
```

**Space freed:** Varies (can be 100MB-1GB+)

### Step 3: Clean Project Files

```bash
cd /home/ubuntu/Presale_savitri_node/Presale_savitri_node

# Remove node_modules (can reinstall)
rm -rf node_modules web3/node_modules

# Clean Hardhat
cd web3
npx hardhat clean
rm -rf aartifacts_copy

# Clean Next.js
cd ..
rm -rf .next
```

**Space freed:** ~2.5GB

### Step 4: Clean System Logs

```bash
# Clear journal logs (keep last 3 days)
sudo journalctl --vacuum-time=3d

# Or clear all (more aggressive)
sudo journalctl --vacuum-time=1d
```

**Space freed:** ~500MB-800MB

### Step 5: Clean Docker (if not needed)

```bash
# Remove unused Docker data
docker system prune -a --volumes

# Or if Docker not used:
# sudo rm -rf /var/lib/docker
```

**Space freed:** ~1.3GB

## Complete Cleanup Script

```bash
#!/bin/bash
# cleanup-all.sh

echo "🧹 Cleaning NPM cache (~13GB)..."
npm cache clean --force

echo "🧹 Cleaning PM2 logs..."
pm2 flush 2>/dev/null || rm -rf ~/.pm2/logs/*.log

echo "🧹 Cleaning project node_modules..."
cd /home/ubuntu/Presale_savitri_node/Presale_savitri_node
rm -rf node_modules web3/node_modules

echo "🧹 Cleaning Hardhat..."
cd web3
npx hardhat clean
rm -rf aartifacts_copy

echo "🧹 Cleaning Next.js..."
cd ..
rm -rf .next

echo "🧹 Cleaning system logs..."
sudo journalctl --vacuum-time=3d

echo "✅ Done! Checking space..."
df -h /
```

## Estimated Space After Cleanup

- **Before:** 48GB used (100%)
- **After:** ~30-32GB used (~66-70%)
- **Freed:** ~16-18GB

## Priority Actions

1. **Clear NPM cache** - Biggest impact (13GB)
2. **Clean PM2 logs** - Quick win
3. **Remove node_modules** - Can reinstall
4. **Clean system logs** - Safe cleanup

## After Cleanup - Restore Dependencies

```bash
# Restore project dependencies
cd /home/ubuntu/Presale_savitri_node/Presale_savitri_node
npm install

cd web3
npm install
npx hardhat compile
```

## Prevention

1. **Regular cleanup:**
   ```bash
   npm cache clean --force  # Monthly
   pm2 flush                # Weekly
   journalctl --vacuum-time=7d  # Weekly
   ```

2. **Add to cron:**
   ```bash
   # Weekly cleanup
   0 0 * * 0 npm cache clean --force && pm2 flush
   ```

3. **Monitor disk:**
   ```bash
   df -h /  # Check regularly
   ```

