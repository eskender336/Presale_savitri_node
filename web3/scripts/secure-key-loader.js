/**
 * Secure Key Loader
 * 
 * This module provides secure loading of encrypted private keys.
 * The private key is encrypted using AES-256-CBC and stored separately.
 * 
 * Usage:
 *   const { loadPrivateKey } = require('./secure-key-loader');
 *   const privateKey = await loadPrivateKey();
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Path to encrypted key file (outside repository)
const ENCRYPTED_KEY_PATH = process.env.ENCRYPTED_KEY_PATH || 
  path.join(process.env.HOME || '/home/ubuntu', '.secure_keys', 'private_key.enc');

// Environment variable for decryption passphrase (most secure)
const PASSPHRASE_ENV = process.env.PRIVATE_KEY_PASSPHRASE;

/**
 * Decrypt private key from encrypted file
 * @param {string} encryptedData - Base64 encoded encrypted data
 * @param {string} passphrase - Decryption passphrase
 * @returns {string} Decrypted private key
 */
function decryptKey(encryptedData, passphrase) {
  try {
    const parts = encryptedData.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted key format');
    }
    
    const algorithm = parts[0];
    const iv = Buffer.from(parts[1], 'hex');
    const encrypted = Buffer.from(parts[2], 'hex');
    
    if (algorithm !== 'aes-256-cbc') {
      throw new Error('Unsupported encryption algorithm');
    }
    
    // Derive key from passphrase using PBKDF2
    const key = crypto.pbkdf2Sync(passphrase, 'savitri-salt-v1', 100000, 32, 'sha256');
    
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    return decrypted.toString('utf8');
  } catch (error) {
    throw new Error(`Decryption failed: ${error.message}`);
  }
}

/**
 * Prompt for passphrase securely (no echo)
 * @returns {Promise<string>} Passphrase
 */
function promptPassphrase() {
  return new Promise((resolve, reject) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    rl.question('Enter passphrase for private key: ', (passphrase) => {
      rl.close();
      if (!passphrase) {
        reject(new Error('Passphrase cannot be empty'));
      } else {
        resolve(passphrase);
      }
    });
    
    // Hide input (doesn't work on all terminals, but helps)
    rl._writeToOutput = function _writeToOutput(stringToWrite) {
      if (rl.output.mode === 'normal') {
        rl.output.write('*');
      } else {
        rl.output.write(stringToWrite);
      }
    };
  });
}

/**
 * Load private key from encrypted storage
 * @param {object} options - Options
 * @param {boolean} options.allowFallback - Allow fallback to PRIVATE_KEY env var (default: false)
 * @returns {Promise<string>} Private key
 */
async function loadPrivateKey(options = {}) {
  const { allowFallback = false } = options;
  
  // Method 1: Use passphrase from environment variable (most secure for automated scripts)
  if (PASSPHRASE_ENV) {
    try {
      if (!fs.existsSync(ENCRYPTED_KEY_PATH)) {
        throw new Error(`Encrypted key file not found: ${ENCRYPTED_KEY_PATH}`);
      }
      
      const encryptedData = fs.readFileSync(ENCRYPTED_KEY_PATH, 'utf8').trim();
      const privateKey = decryptKey(encryptedData, PASSPHRASE_ENV);
      
      // Validate it's a valid private key format
      if (!/^0x[a-fA-F0-9]{64}$/.test(privateKey)) {
        throw new Error('Decrypted data does not appear to be a valid private key');
      }
      
      return privateKey;
    } catch (error) {
      console.error(`[secure-key-loader] Failed to load encrypted key: ${error.message}`);
      if (!allowFallback) {
        throw error;
      }
    }
  }
  
  // Method 2: Prompt for passphrase (interactive mode)
  if (process.stdin.isTTY) {
    try {
      if (!fs.existsSync(ENCRYPTED_KEY_PATH)) {
        throw new Error(`Encrypted key file not found: ${ENCRYPTED_KEY_PATH}`);
      }
      
      const passphrase = await promptPassphrase();
      const encryptedData = fs.readFileSync(ENCRYPTED_KEY_PATH, 'utf8').trim();
      const privateKey = decryptKey(encryptedData, passphrase);
      
      if (!/^0x[a-fA-F0-9]{64}$/.test(privateKey)) {
        throw new Error('Decrypted data does not appear to be a valid private key');
      }
      
      return privateKey;
    } catch (error) {
      console.error(`[secure-key-loader] Failed to load encrypted key: ${error.message}`);
      if (!allowFallback) {
        throw error;
      }
    }
  }
  
  // Method 3: Fallback to environment variable (less secure, but allows backward compatibility)
  if (allowFallback && process.env.PRIVATE_KEY) {
    console.warn('[secure-key-loader] WARNING: Using plaintext PRIVATE_KEY from environment (not secure!)');
    return process.env.PRIVATE_KEY;
  }
  
  throw new Error(
    'Unable to load private key. ' +
    'Set PRIVATE_KEY_PASSPHRASE environment variable or ensure encrypted key file exists. ' +
    `Expected location: ${ENCRYPTED_KEY_PATH}`
  );
}

/**
 * Encrypt and save private key
 * @param {string} privateKey - Private key to encrypt
 * @param {string} passphrase - Encryption passphrase
 * @param {string} outputPath - Output file path (optional)
 * @returns {string} Path to encrypted file
 */
function encryptAndSaveKey(privateKey, passphrase, outputPath = null) {
  // Validate private key format
  if (!/^0x[a-fA-F0-9]{64}$/.test(privateKey)) {
    throw new Error('Invalid private key format. Must be 0x followed by 64 hex characters.');
  }
  
  const targetPath = outputPath || ENCRYPTED_KEY_PATH;
  
  // Create directory if it doesn't exist
  const dir = path.dirname(targetPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { mode: 0o700, recursive: true });
  }
  
  // Generate random IV
  const iv = crypto.randomBytes(16);
  
  // Derive key from passphrase using PBKDF2
  const key = crypto.pbkdf2Sync(passphrase, 'savitri-salt-v1', 100000, 32, 'sha256');
  
  // Encrypt
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(privateKey, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  // Format: algorithm:iv:encrypted_data
  const encryptedData = `aes-256-cbc:${iv.toString('hex')}:${encrypted}`;
  
  // Save to file with restricted permissions
  fs.writeFileSync(targetPath, encryptedData, { mode: 0o600 });
  
  console.log(`✅ Private key encrypted and saved to: ${targetPath}`);
  console.log(`   File permissions: 600 (owner read/write only)`);
  console.log(`   ⚠️  IMPORTANT: Store the passphrase securely!`);
  console.log(`   ⚠️  Set PRIVATE_KEY_PASSPHRASE environment variable for automated access`);
  
  return targetPath;
}

module.exports = {
  loadPrivateKey,
  encryptAndSaveKey,
  ENCRYPTED_KEY_PATH
};

