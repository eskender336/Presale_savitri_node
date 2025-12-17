/**
 * Generate Merkle tree for airdrop
 * 
 * Reads CSV file and generates:
 * 1. Merkle tree
 * 2. Merkle root (to set on contract)
 * 3. Proofs for each recipient (for claiming)
 * 
 * Usage:
 *   node scripts/generate-merkle-tree.js [csv-path]
 */

const { MerkleTree } = require('merkletreejs');
const keccak256 = require('keccak256');
const fs = require('fs');
const path = require('path');
const { ethers } = require('hardhat');

const CSV_PATH = process.argv[2] || path.join(__dirname, '../../data/token-balances.csv');

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
        
        if (address && balance && ethers.utils.isAddress(address)) {
            try {
                const normalizedAddress = ethers.utils.getAddress(address);
                const amount = ethers.utils.parseEther(balance.replace(/,/g, ''));
                
                data.push({
                    address: normalizedAddress,
                    amount: amount.toString(),
                    amountFormatted: balance.replace(/,/g, ''),
                });
            } catch (e) {
                console.warn(`Skipping invalid line: ${line} - ${e.message}`);
            }
        }
    }
    
    return data;
}

function generateMerkleTree(recipients) {
    // Create leaves: keccak256(abi.encodePacked(address, amount))
    const leaves = recipients.map(r => {
        const packed = ethers.utils.solidityPack(
            ['address', 'uint256'],
            [r.address, r.amount]
        );
        return keccak256(packed);
    });
    
    // Build Merkle tree
    const tree = new MerkleTree(leaves, keccak256, { sortPairs: true });
    const root = tree.getHexRoot();
    
    // Generate proofs for each recipient
    const proofs = recipients.map((r, index) => {
        const leaf = leaves[index];
        const proof = tree.getHexProof(leaf);
        
        return {
            address: r.address,
            amount: r.amount,
            amountFormatted: r.amountFormatted,
            proof: proof,
            leaf: '0x' + leaf.toString('hex'),
        };
    });
    
    return {
        root,
        tree,
        proofs,
    };
}

async function main() {
    console.log('📖 Reading CSV file:', CSV_PATH);
    const recipients = parseCSV(CSV_PATH);
    console.log(`✅ Found ${recipients.length} recipients\n`);
    
    console.log('🌳 Generating Merkle tree...');
    const { root, proofs } = generateMerkleTree(recipients);
    console.log(`✅ Merkle root: ${root}\n`);
    
    // Save results
    const output = {
        merkleRoot: root,
        totalRecipients: recipients.length,
        totalAmount: recipients.reduce((sum, r) => 
            sum.add(ethers.BigNumber.from(r.amount)), 
            ethers.BigNumber.from(0)
        ).toString(),
        recipients: proofs.map(p => ({
            address: p.address,
            amount: p.amount,
            amountFormatted: p.amountFormatted,
            proof: p.proof,
        })),
    };
    
    // Save full data (for website/API)
    fs.writeFileSync(
        'merkle-tree-data.json',
        JSON.stringify(output, null, 2)
    );
    console.log('✅ Full data saved to: merkle-tree-data.json');
    
    // Save summary (for contract deployment)
    const summary = {
        merkleRoot: root,
        totalRecipients: recipients.length,
        totalAmount: output.totalAmount,
    };
    
    fs.writeFileSync(
        'merkle-root.json',
        JSON.stringify(summary, null, 2)
    );
    console.log('✅ Summary saved to: merkle-root.json\n');
    
    // Display summary
    console.log('📊 Summary:');
    console.log(`   Merkle Root: ${root}`);
    console.log(`   Total Recipients: ${recipients.length}`);
    console.log(`   Total Amount: ${ethers.utils.formatEther(output.totalAmount)} tokens\n`);
    
    console.log('📋 Next steps:');
    console.log('1. Deploy Airdrop contract');
    console.log('2. Transfer tokens to Airdrop contract');
    console.log('3. Set merkle root: airdrop.setMerkleRoot("' + root + '")');
    console.log('4. Users can claim using proofs from merkle-tree-data.json');
    console.log('5. (Optional) Set claim end time: airdrop.setClaimEndTime(timestamp)');
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

