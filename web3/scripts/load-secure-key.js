/**
 * Synchronous secure key loader wrapper
 * 
 * This provides a synchronous interface for loading encrypted keys
 * by checking environment variable first, then trying encrypted storage.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ENCRYPTED_KEY_PATH = process.env.ENCRYPTED_KEY_PATH || 
  path.join(process.env.HOME || '/home/ubuntu', '.secure_keys', 'private_key.enc');

function decryptKeySync(encryptedData, passphrase) {
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
 * Load private key synchronously
 * @param {object} options - Options
 * @param {boolean} options.allowFallback - Allow fallback to PRIVATE_KEY env var
 * @returns {string} Private key
 */
function loadPrivateKeySync(options = {}) {
  const { allowFallback = true } = options;
  
  // Method 1: Try encrypted key with passphrase from environment
  if (process.env.PRIVATE_KEY_PASSPHRASE) {
    try {
      if (fs.existsSync(ENCRYPTED_KEY_PATH)) {
        const encryptedData = fs.readFileSync(ENCRYPTED_KEY_PATH, 'utf8').trim();
        const privateKey = decryptKeySync(encryptedData, process.env.PRIVATE_KEY_PASSPHRASE);
        
        if (!/^0x[a-fA-F0-9]{64}$/.test(privateKey)) {
          throw new Error('Decrypted data does not appear to be a valid private key');
        }
        
        return privateKey;
      }
    } catch (error) {
      console.error(`[secure-key-loader] Failed to load encrypted key: ${error.message}`);
      if (!allowFallback) {
        throw error;
      }
    }
  }
  
  // Method 2: Fallback to environment variable
  if (allowFallback && process.env.PRIVATE_KEY) {
    if (process.env.PRIVATE_KEY_PASSPHRASE) {
      console.warn('[secure-key-loader] WARNING: Using plaintext PRIVATE_KEY from environment (encrypted key preferred!)');
    }
    return process.env.PRIVATE_KEY;
  }
  
  throw new Error(
    'Unable to load private key. ' +
    'Set PRIVATE_KEY_PASSPHRASE environment variable and ensure encrypted key file exists. ' +
    `Expected location: ${ENCRYPTED_KEY_PATH}`
  );
}

module.exports = {
  loadPrivateKeySync,
  ENCRYPTED_KEY_PATH
};

