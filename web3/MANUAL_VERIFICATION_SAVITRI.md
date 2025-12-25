# Manual Verification Guide for SavitriCoin Contract

## 📋 Prerequisites

Before starting, make sure you have:
- Your deployed contract address
- The Standard JSON Input file: `web3/savitri-standard-json.json`
- Access to BSCScan (https://bscscan.com)

**Why Standard JSON Input?**
- ✅ Hardhat compiles contracts using Standard JSON Input internally during deployment
- ✅ This is the **exact same format** that was used when your contract was compiled
- ✅ Preserves exact file structure, import order, and library references
- ✅ BSCScan will reconstruct files the same way Hardhat did
- ⚠️ Flattened files are convenience tools and might have different ordering than BSCScan expects

---

## 🔍 Step 1: Find Your Contract Address

If you don't know your contract address, check your deployment transaction or deployment logs.

**Example contract address format:** `0x...` (42 characters starting with 0x)

---

## 🌐 Step 2: Go to BSCScan Verification Page

1. Open your browser and go to: **https://bscscan.com/verifyContract**
2. You may need to log in to your BSCScan account (create one if needed)

---

## 📝 Step 3: Enter Contract Details

1. **Contract Address:** Enter your SavitriCoin contract address
   - Example: `0xYourContractAddressHere`

2. **Compiler Type:** Select **"Solidity (Standard JSON Input)"**
   - ✅ This matches how Hardhat compiled your contract during deployment
   - ⚠️ **IMPORTANT:** Do NOT select "Solidity (Single file)" for first attempt

3. **Compiler Version:** Select **"v0.8.19+commit.7dd6d404"**
   - If this exact version is not available, try: `v0.8.19` or `0.8.19`
   - Alternative: `v0.8.0+commit.c7dfd78e` (if 0.8.19 doesn't work)

---

## 📤 Step 4: Upload Standard JSON Input File

1. Click **"Choose File"** or drag and drop
2. Navigate to: `web3/savitri-standard-json.json`
3. Select and upload the file

**File location:** `/home/ubuntu/Presale_savitri_node/Presale_savitri_node/web3/savitri-standard-json.json`

**What's in this file:** All your contract sources and OpenZeppelin dependencies in JSON format (exactly as Hardhat compiled them)

---

## ⚙️ Step 5: Configure Compiler Settings

Based on your `hardhat.config.js`, use these settings:

### Option A: Try First (Most Likely to Work)
- **EVM Version:** `paris` or `default`
- **Optimization:** ✅ **Enabled**
- **Runs:** `0`
- **viaIR:** ❌ **Disabled** (unchecked) - try this first
- **License Type:** `MIT License (MIT)` (select from dropdown)

### Option B: If Option A Fails
- **EVM Version:** `london` or `default`
- **Optimization:** ✅ **Enabled**
- **Runs:** `0`
- **viaIR:** ❌ **Disabled** (unchecked)
- **License Type:** `MIT License (MIT)`

### Option C: If Both Fail (Try with viaIR)
- **EVM Version:** `paris` or `default`
- **Optimization:** ✅ **Enabled**
- **Runs:** `0`
- **viaIR:** ✅ **Enabled** (checked) - your hardhat.config.js has viaIR: true
- **License Type:** `MIT License (MIT)`

---

## 📦 Step 6: Enter Contract Name

**Contract Name:** `SavitriCoin`

⚠️ **Case-sensitive!** Must match exactly: `SavitriCoin`

---

## 🔧 Step 7: Constructor Arguments

**Leave this field EMPTY** (no constructor arguments)

The SavitriCoin constructor takes no parameters:
```solidity
constructor() ERC20("Savitri Coin", "SAV") {
    // No parameters needed
}
```

**Constructor Arguments ABI-encoded:** (leave blank)

---

## ✅ Step 8: Verify and Publish

1. Review all settings
2. Check the **"I'm not a robot"** CAPTCHA (if shown)
3. Click **"Verify and Publish"** button

---

## ⏳ Step 9: Wait for Verification

- Verification usually takes 30 seconds to 2 minutes
- You'll see a success message or error details
- If successful, you'll be redirected to the contract page

---

## 🔍 Step 10: Verify Success

After successful verification:
1. Go to your contract page on BSCScan
2. You should see:
   - ✅ Green checkmark next to "Contract"
   - "Contract Source Code Verified" badge
   - Read/Write Contract tabs available
   - Contract ABI visible

---

## ❌ Troubleshooting

### Error: "Bytecode does not match"
**Solution:** Try different compiler settings:
1. Try Option B (london EVM version)
2. Try Option C (with viaIR enabled)
3. Try compiler version `v0.8.0+commit.c7dfd78e` instead

### Error: "Constructor arguments mismatch"
**Solution:** Make sure constructor arguments field is **completely empty**

### Error: "Contract name not found"
**Solution:** Make sure you entered exactly: `SavitriCoin` (case-sensitive)

### Error: "Invalid JSON"
**Solution:** 
1. Make sure you uploaded the correct file: `savitri-standard-json.json`
2. Check that the file is valid JSON (not corrupted)
3. Try downloading it again from your project

### Error: "Contract source code not found"
**Solution:** 
1. Make sure you entered the contract name exactly: `SavitriCoin` (case-sensitive)
2. Check that the JSON file contains the contract source
3. Try the flattened file method as alternative

### Still Not Working?
1. Check your deployment transaction to confirm the exact compiler settings used
2. Try the Standard JSON Input method (see alternative method above)
3. Try different compiler versions: `v0.8.0+commit.c7dfd78e`
4. Try different EVM versions: `london`, `default`

---

## 🔄 Alternative Method: Flattened Single File

⚠️ **Use this only if Standard JSON Input fails!**

**Why Standard JSON Input is better:**
- Hardhat compiles using Standard JSON Input internally during deployment
- Standard JSON preserves exact file structure and import order
- The flattened file was created separately and might have different ordering
- BSCScan reconstructs files from Standard JSON the same way Hardhat did

**If you must use flattened file:**
1. **Compiler Type:** Select **"Solidity (Single file)"**
2. **Compiler Version:** `v0.8.19+commit.7dd6d404` or `v0.8.0+commit.c7dfd78e`
3. **EVM Version:** `paris`, `london`, or `default`
4. **Optimization:** ✅ **Enabled**, **Runs:** `0`
5. **License:** `MIT License (MIT)`
6. **Contract Name:** `SavitriCoin`
7. **Contract Code:** Upload `web3/SavitriCoin_flattened.sol` file

**Note:** The flattened file was created by Hardhat's flatten command, but BSCScan might expect a different import/library ordering. If verification fails, try Standard JSON Input instead.

---

## 📊 Summary of Settings (Standard JSON Input Method)

| Setting | Value |
|---------|-------|
| Contract Address | Your deployed address |
| Compiler Type | **Solidity (Standard JSON Input)** |
| Compiler Version | v0.8.19+commit.7dd6d404 |
| EVM Version | paris (or london/default) |
| Optimization | Enabled |
| Optimizer Runs | 0 |
| viaIR | Disabled (try first) or Enabled |
| License | MIT License (MIT) |
| Contract Name | SavitriCoin |
| JSON File | savitri-standard-json.json |
| Constructor Args | **(empty)** |

---

## ✅ Quick Checklist

Before submitting:
- [ ] Contract address is correct
- [ ] Compiler type: **Solidity (Standard JSON Input)**
- [ ] Standard JSON file uploaded: `savitri-standard-json.json`
- [ ] Compiler version: v0.8.19
- [ ] EVM Version: paris or default
- [ ] Optimization: Enabled, Runs: 0
- [ ] viaIR: Disabled (try first)
- [ ] Contract name: `SavitriCoin` (exact case)
- [ ] Constructor arguments: **EMPTY**
- [ ] License: MIT

---

## 🎯 Expected Result

After successful verification, you should see:
- ✅ Contract verified badge
- Full source code visible
- Contract ABI available
- Read/Write contract functions accessible
- Contract creation code visible

Good luck! 🚀

