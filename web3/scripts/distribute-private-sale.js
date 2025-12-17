// Script to distribute private sale tokens from CSV
// Reads token-balances.csv and creates multisig proposals for distribution
//
// Usage:
//   node web3/scripts/distribute-private-sale.js [--dry-run]
//
// Env (web3/.env):
//   NEXT_PUBLIC_TOKEN_ICO_ADDRESS or TOKEN_ICO_ADDRESS - Contract address
//   CSV_PATH - Path to CSV (default: ../../data/token-balances.csv)
//   BATCH_SIZE - Number of addresses per batch (default: 50)

require('dotenv').config({ path: __dirname + '/../.env' });
const fs = require('fs');
const path = require('path');
const { ethers } = require('hardhat');

const CSV_PATH = process.env.CSV_PATH || path.join(__dirname, '../../data/token-balances.csv');
const BATCH_SIZE = parseInt(process.env.BATCH_SIZE || '50', 10);
const DRY_RUN = process.argv.includes('--dry-run') || process.argv.includes('-d');

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
    
    if (DRY_RUN) {
        console.log("⚠️  DRY RUN MODE - No transactions will be sent");
    }
    
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
    
    // Проверяем баланс контракта
    const saleTokenAddress = await ico.saleToken();
    if (saleTokenAddress === ethers.constants.AddressZero) {
        throw new Error("Sale token not set in contract");
    }
    
    const token = await ethers.getContractAt("IERC20", saleTokenAddress);
    const contractBalance = await token.balanceOf(icoAddress);
    const decimals = await token.decimals().catch(() => 18);
    const symbol = await token.symbol().catch(() => 'TOKEN');
    
    console.log(`Contract balance: ${ethers.utils.formatUnits(contractBalance, decimals)} ${symbol}`);
    
    // Читаем CSV
    console.log("\nReading CSV from:", CSV_PATH);
    const participants = parseCSV(CSV_PATH);
    console.log(`Found ${participants.length} participants`);
    
    if (participants.length === 0) {
        throw new Error("No valid participants found in CSV");
    }
    
    // Проверяем лимиты для каждого участника
    console.log("\nChecking allocations...");
    let totalToDistribute = ethers.BigNumber.from(0);
    const validParticipants = [];
    
    for (const p of participants) {
        const allocation = await ico.privateSaleAllocation(p.address);
        const distributed = await ico.privateSaleDistributed(p.address);
        const remaining = allocation.gt(distributed) ? allocation.sub(distributed) : ethers.BigNumber.from(0);
        
        if (allocation.isZero()) {
            console.warn(`⚠️  ${p.address} has no allocation set. Skipping.`);
            continue;
        }
        
        if (p.amount.gt(remaining)) {
            console.warn(`⚠️  ${p.address} requested ${ethers.utils.formatEther(p.amount)} but only ${ethers.utils.formatEther(remaining)} remaining. Using remaining.`);
            validParticipants.push({
                address: p.address,
                amount: remaining
            });
            totalToDistribute = totalToDistribute.add(remaining);
        } else {
            validParticipants.push(p);
            totalToDistribute = totalToDistribute.add(p.amount);
        }
    }
    
    console.log(`Total to distribute: ${ethers.utils.formatUnits(totalToDistribute, decimals)} ${symbol}`);
    console.log(`Valid participants: ${validParticipants.length}`);
    
    if (totalToDistribute.gt(contractBalance)) {
        throw new Error(`Insufficient balance. Need ${ethers.utils.formatUnits(totalToDistribute, decimals)}, have ${ethers.utils.formatUnits(contractBalance, decimals)}`);
    }
    
    if (validParticipants.length === 0) {
        throw new Error("No valid participants to distribute to");
    }
    
    // Разбиваем на батчи
    const batches = [];
    for (let i = 0; i < validParticipants.length; i += BATCH_SIZE) {
        batches.push(validParticipants.slice(i, i + BATCH_SIZE));
    }
    
    console.log(`\nWill create ${batches.length} distribution batches (${BATCH_SIZE} addresses per batch)`);
    
    if (DRY_RUN) {
        console.log("\n📋 DRY RUN - Would create the following batches:");
        for (let i = 0; i < batches.length; i++) {
            const batch = batches[i];
            const batchTotal = batch.reduce((sum, p) => sum.add(p.amount), ethers.BigNumber.from(0));
            console.log(`  Batch ${i + 1}: ${batch.length} recipients, ${ethers.utils.formatUnits(batchTotal, decimals)} ${symbol}`);
        }
        console.log("\n✅ Dry run complete. Remove --dry-run to execute.");
        return;
    }
    
    // Для каждого батча создаем предложение
    for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        const recipients = batch.map(p => p.address);
        const amounts = batch.map(p => p.amount);
        const reasons = batch.map(() => "PRIVATE_SALE");
        
        const batchTotal = batch.reduce((sum, p) => sum.add(p.amount), ethers.BigNumber.from(0));
        
        console.log(`\nBatch ${i + 1}/${batches.length}: ${batch.length} recipients`);
        console.log(`  Total amount: ${ethers.utils.formatUnits(batchTotal, decimals)} ${symbol}`);
        console.log(`  First: ${recipients[0]}, Last: ${recipients[recipients.length - 1]}`);
        
        // Создаем предложение
        const tx = await ico.distributePrivateSaleBatch(recipients, amounts, reasons);
        console.log(`  Transaction: ${tx.hash}`);
        await tx.wait();
        
        // Получаем proposal ID
        const receipt = await tx.wait();
        const proposalCreatedEvent = receipt.events?.find(e => e.event === 'ProposalCreated');
        if (proposalCreatedEvent) {
            const proposalId = proposalCreatedEvent.args.proposalId;
            console.log(`  ✅ Proposal ID: ${proposalId}`);
            console.log(`  ⚠️  Need 2 more approvals from other multisig owners`);
            console.log(`     Call: ico.approveProposal(${proposalId})`);
            console.log(`     Then: ico.executeProposal(${proposalId})`);
        }
        
        // Небольшая задержка между батчами
        if (i < batches.length - 1) {
            console.log("  Waiting 5 seconds before next batch...");
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }
    
    console.log("\n✅ All batches processed!");
    console.log(`\n⚠️  IMPORTANT: Each proposal needs 3 approvals total to execute`);
    console.log(`   After approvals, execute proposals to distribute tokens`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Error:", error);
        process.exit(1);
    });


