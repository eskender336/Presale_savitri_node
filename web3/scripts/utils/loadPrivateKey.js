// scripts/utils/loadPrivateKey.js
// Utility function to load private key from secure location
// 
// Priority:
// 1. Environment variable PRIVATE_KEY (for CI/CD or explicit override)
// 2. .secrets/private-key file (secure location)
// 3. process.env.PRIVATE_KEY_FROM_ENV (backward compatibility, deprecated)

const fs = require("fs");
const path = require("path");

/**
 * Load private key from secure location
 * @param {string} projectRoot - Root directory of the project (default: __dirname/../..)
 * @returns {string|null} Private key or null if not found
 */
function loadPrivateKey(projectRoot = null) {
  // First, try environment variable (for CI/CD or explicit override)
  if (process.env.PRIVATE_KEY) {
    return process.env.PRIVATE_KEY;
  }
  
  // Determine project root
  if (!projectRoot) {
    // Default: assume this is in web3/scripts/utils, so go up 2 levels
    projectRoot = path.join(__dirname, "..", "..");
  }
  
  // Try secure file location
  const secretsDir = path.join(projectRoot, ".secrets");
  const privateKeyFile = path.join(secretsDir, "private-key");
  
  if (fs.existsSync(privateKeyFile)) {
    try {
      const key = fs.readFileSync(privateKeyFile, "utf8").trim();
      if (key && key.length > 0) {
        return key;
      }
    } catch (error) {
      console.warn("⚠️  Could not read private key from .secrets/private-key:", error.message);
    }
  }
  
  // Fallback: try .env (for backward compatibility, but warn)
  if (process.env.PRIVATE_KEY_FROM_ENV) {
    console.warn("⚠️  Using PRIVATE_KEY_FROM_ENV - consider moving to .secrets/private-key");
    return process.env.PRIVATE_KEY_FROM_ENV;
  }
  
  return null;
}

/**
 * Load private key and throw error if not found
 * @param {string} projectRoot - Root directory of the project
 * @returns {string} Private key
 * @throws {Error} If private key not found
 */
function requirePrivateKey(projectRoot = null) {
  const key = loadPrivateKey(projectRoot);
  if (!key) {
    throw new Error(
      "PRIVATE_KEY not found. " +
      "Set PRIVATE_KEY environment variable or ensure .secrets/private-key exists. " +
      "Run: bash scripts/secure-key-setup.sh"
    );
  }
  return key;
}

module.exports = {
  loadPrivateKey,
  requirePrivateKey,
};

