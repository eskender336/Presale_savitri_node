// Script to check private sale status for participants
// Shows allocation, distributed, and remaining amounts
//
// Usage:
//   node web3/scripts/check-private-sale-status.js [address1] [address2] ...
//   node web3/scripts/check-private-sale-status.js --csv  # Check all from CSV

require('dotenv').config({ path: __dirname + '/../.env' });
const fs = require('fs');
const path = require('path');
const { ethers } = require('hardhat');

const CSV_PATH = process.env.CSV_PATH || path.join(__dirname, '../../data/token-balances.csv');

function parseCSV(filePath) {
    if (!fs.existsSync(filePath)) {
        return [];
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n').filter(line => line.trim() && !line.startsWith('#'));
    const addresses = [];
    
    for (const line of lines) {
        const parts = line.split(',').map(s => s.trim());
        if (parts.length < 1) continue;
        
        const address = parts[0];
        if (address && ethers.utils.isAddress(address)) {
            addresses.push(ethers.utils.getAddress(address));
        }
    }
    
    return addresses;
}

async function checkAddress(ico, address) {
    try {
        const info = await ico.getPrivateSaleInfo(address);
        return {
            address,
            allocation: info.allocation,
            distributed: info.distributed,
            remaining: info.remaining
        };
    } catch (error) {
        return {
            address,
            error: error.message
        };
    }
}

async function main() {
    const icoAddress = process.env.NEXT_PUBLIC_TOKEN_ICO_ADDRESS || process.env.TOKEN_ICO_ADDRESS;
    if (!icoAddress) {
        throw new Error("TokenICO address not set");
    }
    
    const TokenICO = await ethers.getContractFactory("TokenICO");
    const ico = TokenICO.attach(icoAddress);
    
    // Получаем общую информацию
    const totalAllocated = await ico.privateSaleTotalAllocated();
    const isActive = await ico.privateSaleActive();
    
    console.log("=== Private Sale Status ===\n");
    console.log(`Total Allocated: ${ethers.utils.formatEther(totalAllocated)} tokens`);
    console.log(`Active: ${isActive ? 'Yes' : 'No'}`);
    console.log();
    
    // Определяем адреса для проверки
    let addresses = [];
    
    if (process.argv.includes('--csv') || process.argv.includes('-c')) {
        addresses = parseCSV(CSV_PATH);
        console.log(`Checking ${addresses.length} addresses from CSV\n`);
    } else {
        // Берем адреса из аргументов
        addresses = process.argv.slice(2)
            .filter(arg => !arg.startsWith('--') && !arg.startsWith('-'))
            .map(addr => {
                try {
                    return ethers.utils.getAddress(addr);
                } catch {
                    return null;
                }
            })
            .filter(Boolean);
        
        if (addresses.length === 0) {
            console.log("Usage:");
            console.log("  node check-private-sale-status.js [address1] [address2] ...");
            console.log("  node check-private-sale-status.js --csv");
            process.exit(1);
        }
    }
    
    // Проверяем каждый адрес
    const results = [];
    for (const address of addresses) {
        const result = await checkAddress(ico, address);
        results.push(result);
    }
    
    // Выводим результаты
    console.log("Address".padEnd(42) + "Allocation".padEnd(20) + "Distributed".padEnd(20) + "Remaining");
    console.log("-".repeat(102));
    
    let totalAlloc = ethers.BigNumber.from(0);
    let totalDist = ethers.BigNumber.from(0);
    let totalRem = ethers.BigNumber.from(0);
    
    for (const result of results) {
        if (result.error) {
            console.log(`${result.address} - ERROR: ${result.error}`);
            continue;
        }
        
        const alloc = ethers.utils.formatEther(result.allocation);
        const dist = ethers.utils.formatEther(result.distributed);
        const rem = ethers.utils.formatEther(result.remaining);
        
        console.log(
            result.address.padEnd(42) +
            alloc.padEnd(20) +
            dist.padEnd(20) +
            rem
        );
        
        totalAlloc = totalAlloc.add(result.allocation);
        totalDist = totalDist.add(result.distributed);
        totalRem = totalRem.add(result.remaining);
    }
    
    console.log("-".repeat(102));
    console.log(
        "TOTAL".padEnd(42) +
        ethers.utils.formatEther(totalAlloc).padEnd(20) +
        ethers.utils.formatEther(totalDist).padEnd(20) +
        ethers.utils.formatEther(totalRem)
    );
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Error:", error);
        process.exit(1);
    });


