// Script to set private sale allocations from CSV
// Reads token-balances.csv and creates multisig proposals to set allocations
//
// Usage:
//   node web3/scripts/set-private-sale-allocations.js
//
// Env (web3/.env):
//   NEXT_PUBLIC_TOKEN_ICO_ADDRESS or TOKEN_ICO_ADDRESS - Contract address
//   CSV_PATH - Path to CSV (default: ../../data/token-balances.csv)
//   BATCH_SIZE - Number of addresses per batch (default: 100)

require('dotenv').config({ path: __dirname + '/../.env' });
const fs = require('fs');
const path = require('path');
const { ethers } = require('hardhat');

const CSV_PATH = process.env.CSV_PATH || path.join(__dirname, '../../data/token-balances.csv');
const BATCH_SIZE = parseInt(process.env.BATCH_SIZE || '100', 10);

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
                data.push({
                    address: ethers.utils.getAddress(address),
                    amount: ethers.utils.parseEther(balance.replace(/,/g, ''))
                });
            } catch (e) {
                console.warn(`Skipping invalid line: ${line} - ${e.message}`);
            }
        }
    }
    
    return data;
}

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deployer:", deployer.address);
    
    const icoAddress = process.env.NEXT_PUBLIC_TOKEN_ICO_ADDRESS || process.env.TOKEN_ICO_ADDRESS;
    if (!icoAddress) {
        throw new Error("TokenICO address not set. Set NEXT_PUBLIC_TOKEN_ICO_ADDRESS or TOKEN_ICO_ADDRESS in .env");
    }
    
    console.log("TokenICO address:", icoAddress);
    
    const TokenICO = await ethers.getContractFactory("TokenICO");
    const ico = TokenICO.attach(icoAddress);
    
    // Проверяем, что deployer является multisig owner
    const isOwner = await ico.isMultisigOwner(deployer.address);
    if (!isOwner) {
        throw new Error("Deployer is not a multisig owner");
    }
    
    console.log("✅ Deployer is a multisig owner");
    
    // Читаем CSV
    console.log("\nReading CSV from:", CSV_PATH);
    const participants = parseCSV(CSV_PATH);
    console.log(`Found ${participants.length} participants`);
    
    if (participants.length === 0) {
        throw new Error("No valid participants found in CSV");
    }
    
    // Вычисляем общий лимит
    let totalAllocated = ethers.BigNumber.from(0);
    for (const p of participants) {
        totalAllocated = totalAllocated.add(p.amount);
    }
    console.log(`Total allocation: ${ethers.utils.formatEther(totalAllocated)} tokens`);
    
    // Устанавливаем общий лимит
    console.log("\nSetting total allocated...");
    const totalTx = await ico.setPrivateSaleTotalAllocated(totalAllocated);
    console.log(`Transaction: ${totalTx.hash}`);
    await totalTx.wait();
    
    // Получаем proposal ID
    const totalReceipt = await totalTx.wait();
    const totalProposalEvent = totalReceipt.events?.find(e => e.event === 'ProposalCreated');
    if (totalProposalEvent) {
        const proposalId = totalProposalEvent.args.proposalId;
        console.log(`✅ Proposal created. ID: ${proposalId}`);
        console.log(`⚠️  Need 2 more approvals from other multisig owners`);
        console.log(`   Call: ico.approveProposal(${proposalId})`);
        console.log(`   Then: ico.executeProposal(${proposalId})`);
    }
    
    // Разбиваем на батчи
    const batches = [];
    for (let i = 0; i < participants.length; i += BATCH_SIZE) {
        batches.push(participants.slice(i, i + BATCH_SIZE));
    }
    
    console.log(`\nWill create ${batches.length} allocation batches (${BATCH_SIZE} addresses per batch)`);
    
    // Для каждого батча создаем предложение
    for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        const recipients = batch.map(p => p.address);
        const amounts = batch.map(p => p.amount);
        
        console.log(`\nBatch ${i + 1}/${batches.length}: ${batch.length} recipients`);
        console.log(`  First: ${recipients[0]}, Last: ${recipients[recipients.length - 1]}`);
        
        // Создаем предложение
        const tx = await ico.setPrivateSaleAllocations(recipients, amounts);
        console.log(`  Transaction: ${tx.hash}`);
        await tx.wait();
        
        // Получаем proposal ID
        const receipt = await tx.wait();
        const proposalCreatedEvent = receipt.events?.find(e => e.event === 'ProposalCreated');
        if (proposalCreatedEvent) {
            const proposalId = proposalCreatedEvent.args.proposalId;
            console.log(`  ✅ Proposal ID: ${proposalId}`);
            console.log(`  ⚠️  Need 2 more approvals from other multisig owners`);
        }
        
        // Небольшая задержка между батчами
        if (i < batches.length - 1) {
            console.log("  Waiting 2 seconds before next batch...");
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
    
    console.log("\n✅ All allocations set!");
    console.log(`\n⚠️  IMPORTANT: Each proposal needs 3 approvals total to execute`);
    console.log(`   After approvals, execute proposals to finalize allocations`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Error:", error);
        process.exit(1);
    });


