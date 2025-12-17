const { ethers } = require("hardhat");

/**
 * Deploy a Gnosis Safe instance for testing
 * Note: This is a simplified version. For full Safe functionality,
 * use @safe-global/safe-core-sdk
 * 
 * @param {Array} owners - Array of owner addresses
 * @param {number} threshold - Number of signatures required (default: 3)
 * @param {Signer} deployer - Deployer signer
 * @returns {Promise<Object>} - { safeAddress, owners, threshold }
 */
async function deployMockSafe(owners, threshold = 3, deployer) {
  // For local testing, we'll use a simple approach:
  // Return the first owner address as "Safe" address
  // In production, this would be the actual Safe contract address
  
  console.log("Mock Safe deployed with owners:", owners);
  console.log("Threshold:", threshold);
  
  // Return first owner as "Safe" address for testing
  // In real scenario, this would be the Safe contract address
  return {
    safeAddress: owners[0], // Use first owner as Safe for testing
    owners,
    threshold,
  };
}

/**
 * Create a transaction that would be executed by Safe
 * For testing, we'll just return the transaction data
 * 
 * @param {string} to - Target contract address
 * @param {string} data - Encoded function data
 * @param {string} value - ETH value (default: "0")
 * @returns {Object} - Transaction object
 */
function createSafeTransaction(to, data, value = "0") {
  return {
    to,
    value,
    data,
  };
}

/**
 * Simulate multisig approval and execution
 * For testing, we'll execute directly if threshold is met
 * 
 * @param {Contract} contract - Contract instance
 * @param {string} functionName - Function name
 * @param {Array} params - Function parameters
 * @param {Array} signers - Array of signers (need threshold number)
 * @param {number} threshold - Required signatures
 * @returns {Promise<Object>} - Transaction receipt
 */
async function executeViaMultisig(contract, functionName, params, signers, threshold) {
  if (signers.length < threshold) {
    throw new Error(`Need at least ${threshold} signers, got ${signers.length}`);
  }

  // For testing: use first signer to execute
  // In production, this would go through Safe
  const signer = signers[0];
  const tx = await contract.connect(signer)[functionName](...params);
  return await tx.wait();
}

/**
 * Helper to test that only owner can call a function
 * 
 * @param {Contract} contract - Contract instance
 * @param {string} functionName - Function name
 * @param {Array} params - Function parameters
 * @param {Signer} owner - Owner signer
 * @param {Signer} nonOwner - Non-owner signer
 */
async function testOwnerOnly(contract, functionName, params, owner, nonOwner) {
  // Should succeed with owner
  await expect(contract.connect(owner)[functionName](...params))
    .to.not.be.reverted;

  // Should fail with non-owner
  await expect(contract.connect(nonOwner)[functionName](...params))
    .to.be.revertedWith("Only owner");
}

module.exports = {
  deployMockSafe,
  createSafeTransaction,
  executeViaMultisig,
  testOwnerOnly,
};

