/**
 * Automatic Airdrop Script
 * 
 * Sends tokens to recipients automatically (via Safe)
 * CSV is published for transparency
 * 
 * Usage:
 *   node scripts/airdrop-send-automatic.js [csv-path] [--network localhost]
 */

const hre = require("hardhat");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const CSV_PATH = process.argv[2] || path.join(__dirname, '../../data/token-balances.csv');
const BATCH_SIZE = 100; // Max recipients per batch

function parseCSV(filePath) {
    if (!fs.existsSync(filePath)) {
        throw new Error(`CSV file not found: ${filePath}`);
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n').filter(line => line.trim() && !line.startsWith('#'));
    const data = [];
    
    for (const line of lines) {
        const parts = line.split(',').map(s => s.trim());
        if (parts.length < 2) continue;
        
        const address = parts[0];
        const balance = parts[1];
        
        if (address && balance && hre.ethers.utils.isAddress(address)) {
            try {
                const normalizedAddress = hre.ethers.utils.getAddress(address);
                const amount = hre.ethers.utils.parseEther(balance.replace(/,/g, ''));
                
                data.push({
                    address: normalizedAddress,
                    amount: amount,
                    amountFormatted: balance.replace(/,/g, ''),
                });
            } catch (e) {
                console.warn(`Skipping invalid line: ${line} - ${e.message}`);
            }
        }
    }
    
    return data;
}

async function generateMerkleProofs(recipients) {
    const { MerkleTree } = require('merkletreejs');
    const keccak256 = require('keccak256');
    
    // Create leaves
    const leaves = recipients.map(r => {
        const packed = hre.ethers.utils.solidityPack(
            ['address', 'uint256'],
            [r.address, r.amount.toString()]
        );
        return keccak256(packed);
    });
    
    // Build tree
    const tree = new MerkleTree(leaves, keccak256, { sortPairs: true });
    const root = tree.getHexRoot();
    
    // Generate proofs
    const proofs = recipients.map((r, index) => {
        const leaf = leaves[index];
        return tree.getHexProof(leaf);
    });
    
    return { root, proofs };
}

async function main() {
    console.log("📖 Reading CSV file:", CSV_PATH);
    const recipients = parseCSV(CSV_PATH);
    console.log(`✅ Found ${recipients.length} recipients\n`);
    
    // Get contract addresses
    const AIRDROP_ADDRESS = process.env.AIRDROP_ADDRESS;
    if (!AIRDROP_ADDRESS) {
        throw new Error("AIRDROP_ADDRESS not set in .env");
    }
    
    console.log("Airdrop contract:", AIRDROP_ADDRESS);
    
    // Load Airdrop contract
    const Airdrop = await hre.ethers.getContractFactory("Airdrop");
    const airdrop = Airdrop.attach(AIRDROP_ADDRESS);
    
    // Generate Merkle tree for transparency
    console.log("🌳 Generating Merkle tree for transparency...");
    const { root, proofs } = await generateMerkleProofs(recipients);
    console.log(`✅ Merkle root: ${root}\n`);
    
    // Check if root is set
    const currentRoot = await airdrop.merkleRoot();
    if (currentRoot === "0x0000000000000000000000000000000000000000000000000000000000000000") {
        console.log("⚠️  Merkle root not set on contract!");
        console.log("   Set it first: airdrop.setMerkleRoot('" + root + "')");
        console.log("   Then run this script again.\n");
        return;
    }
    
    if (currentRoot.toLowerCase() !== root.toLowerCase()) {
        console.log("⚠️  Merkle root mismatch!");
        console.log("   Contract root:", currentRoot);
        console.log("   CSV root:", root);
        console.log("   Make sure CSV matches the root on contract!\n");
        return;
    }
    
    console.log("✅ Merkle root verified on contract\n");
    
    // Split into batches
    const batches = [];
    for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
        const batchRecipients = recipients.slice(i, i + BATCH_SIZE);
        const batchAmounts = batchRecipients.map(r => r.amount);
        const batchProofs = proofs.slice(i, i + BATCH_SIZE);
        
        batches.push({
            recipients: batchRecipients.map(r => r.address),
            amounts: batchAmounts,
            proofs: batchProofs,
            batchNumber: Math.floor(i / BATCH_SIZE) + 1,
        });
    }
    
    console.log(`📦 Split into ${batches.length} batches\n`);
    
    // Generate transaction data for Safe
    const transactions = [];
    
    for (const batch of batches) {
        // Option 1: With Merkle validation (more transparent)
        const functionData = airdrop.interface.encodeFunctionData(
            "batchSend",
            [batch.recipients, batch.amounts, batch.proofs]
        );
        
        // Option 2: Direct send (faster, but less validation)
        // const functionData = airdrop.interface.encodeFunctionData(
        //     "batchSendDirect",
        //     [batch.recipients, batch.amounts]
        // );
        
        const totalAmount = batch.amounts.reduce((sum, amt) => sum.add(amt), hre.ethers.BigNumber.from(0));
        
        transactions.push({
            to: AIRDROP_ADDRESS,
            value: "0",
            data: functionData,
            operation: 0,
            batchNumber: batch.batchNumber,
            recipientsCount: batch.recipients.length,
            totalAmount: hre.ethers.utils.formatEther(totalAmount),
        });
        
        console.log(`Batch ${batch.batchNumber}:`);
        console.log(`  Recipients: ${batch.recipients.length}`);
        console.log(`  Total amount: ${transactions[transactions.length - 1].totalAmount} tokens`);
    }
    
    // Save transactions
    const output = {
        csvPath: CSV_PATH,
        merkleRoot: root,
        totalRecipients: recipients.length,
        totalBatches: batches.length,
        airdropAddress: AIRDROP_ADDRESS,
        transactions: transactions,
    };
    
    fs.writeFileSync(
        "airdrop-transactions.json",
        JSON.stringify(output, null, 2)
    );
    
    console.log("\n✅ Transaction data saved to: airdrop-transactions.json");
    console.log("\n📋 Next steps:");
    console.log("1. Publish CSV file for transparency (GitHub/IPFS/website)");
    console.log("2. Go to https://app.safe.global/");
    console.log("3. Connect your Safe wallet");
    console.log("4. Create batch transaction with data from airdrop-transactions.json");
    console.log("5. Get 3+ signatures from Safe owners");
    console.log("6. Execute transactions");
    console.log("\n💡 Tip: Use Safe's batch feature to execute all batches at once!");
    console.log("\n📊 Transparency:");
    console.log("   - CSV file: " + CSV_PATH);
    console.log("   - Merkle root: " + root);
    console.log("   - All transactions are on-chain and verifiable");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

