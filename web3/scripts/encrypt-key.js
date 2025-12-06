#!/usr/bin/env node
/**
 * Encrypt Private Key Script
 * 
 * This script encrypts your private key and stores it securely.
 * 
 * Usage:
 *   node scripts/encrypt-key.js
 */

const readline = require('readline');
const { encryptAndSaveKey, ENCRYPTED_KEY_PATH } = require('./secure-key-loader');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function main() {
  console.log('========================================');
  console.log('Private Key Encryption Tool');
  console.log('========================================\n');
  
  // Get private key
  let privateKey = process.argv.includes('--key') 
    ? process.argv[process.argv.indexOf('--key') + 1]
    : null;
  
  if (!privateKey) {
    // Try to read from .env file
    try {
      require('dotenv').config({ path: __dirname + '/../.env' });
      if (process.env.PRIVATE_KEY) {
        console.log('Found PRIVATE_KEY in .env file');
        const use = await question('Use this key? (y/n): ');
        if (use.toLowerCase() === 'y') {
          privateKey = process.env.PRIVATE_KEY;
        }
      }
    } catch (e) {
      // Ignore
    }
  }
  
  if (!privateKey) {
    privateKey = await question('Enter private key (0x...): ');
  }
  
  privateKey = privateKey.trim();
  
  // Validate format
  if (!/^0x[a-fA-F0-9]{64}$/.test(privateKey)) {
    console.error('❌ Invalid private key format. Must be 0x followed by 64 hex characters.');
    process.exit(1);
  }
  
  // Get passphrase
  let passphrase = process.argv.includes('--passphrase')
    ? process.argv[process.argv.indexOf('--passphrase') + 1]
    : null;
  
  if (!passphrase) {
    console.log('\n⚠️  Choose a strong passphrase (at least 16 characters recommended)');
    passphrase = await question('Enter passphrase: ');
    
    if (passphrase.length < 8) {
      console.error('\n❌ Passphrase too short. Please use at least 8 characters.');
      process.exit(1);
    }
    
    const confirm = await question('Confirm passphrase: ');
    if (passphrase !== confirm) {
      console.error('\n❌ Passphrases do not match!');
      process.exit(1);
    }
  }
  
  // Encrypt and save
  try {
    const outputPath = encryptAndSaveKey(privateKey, passphrase);
    
    console.log('\n========================================');
    console.log('✅ Encryption Complete!');
    console.log('========================================\n');
    console.log('Next steps:');
    console.log('1. Remove PRIVATE_KEY from .env file');
    console.log('2. Set PRIVATE_KEY_PASSPHRASE environment variable:');
    console.log(`   export PRIVATE_KEY_PASSPHRASE="${passphrase}"`);
    console.log('3. Or use in scripts with:');
    console.log('   PRIVATE_KEY_PASSPHRASE="your-passphrase" node your-script.js\n');
    console.log('⚠️  Store the passphrase securely!');
    console.log('⚠️  Never commit the encrypted key file to git!\n');
    
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
  
  rl.close();
}

main().catch((error) => {
  console.error(`Fatal error: ${error.message}`);
  process.exit(1);
});

