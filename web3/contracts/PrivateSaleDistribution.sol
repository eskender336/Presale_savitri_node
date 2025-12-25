// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

/**
 * @title Private Sale Distribution Contract
 * @notice Contract for owner-controlled private sale token distribution
 * @dev Participants have already filled forms and paid. This contract sends tokens to their addresses.
 *      Only owner can send tokens to recipients.
 *      Supports Merkle tree validation for transparency
 */
contract PrivateSaleDistribution {
    address public immutable owner;
    address public immutable token;
    bytes32 public merkleRoot;
    
    mapping(address => bool) public sent;
    
    event MerkleRootUpdated(bytes32 indexed oldRoot, bytes32 indexed newRoot);
    event TokensSent(address indexed recipient, uint256 amount);
    event TokensWithdrawn(address indexed to, uint256 amount);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }
    
    constructor(address _token, address _owner) {
        // If _owner is address(0), use msg.sender (for backward compatibility)
        // Otherwise, use provided address (for multisig deployment)
        owner = _owner == address(0) ? msg.sender : _owner;
        token = _token;
    }
    
    /**
     * @notice Set the Merkle root for private sale distribution (optional, for transparency)
     * @param _merkleRoot The Merkle root of the distribution tree
     */
    function setMerkleRoot(bytes32 _merkleRoot) external onlyOwner {
        bytes32 oldRoot = merkleRoot;
        merkleRoot = _merkleRoot;
        emit MerkleRootUpdated(oldRoot, _merkleRoot);
    }
    
    /**
     * @notice Batch send tokens to recipients with Merkle proof validation
     * @dev Validates against Merkle tree to ensure transparency
     * @param recipients Array of recipient addresses
     * @param amounts Array of amounts to send
     * @param merkleProofs Array of Merkle proofs for validation
     */
    function batchSend(
        address[] calldata recipients,
        uint256[] calldata amounts,
        bytes32[][] calldata merkleProofs
    ) external onlyOwner {
        require(merkleRoot != bytes32(0), "Merkle root not set");
        require(recipients.length == amounts.length, "Length mismatch");
        require(recipients.length == merkleProofs.length, "Proofs length mismatch");
        require(recipients.length <= 100, "Batch too large"); // DoS protection
        
        for (uint256 i = 0; i < recipients.length; i++) {
            require(recipients[i] != address(0), "Invalid address");
            require(amounts[i] > 0, "Invalid amount");
            require(!sent[recipients[i]], "Already sent");
            
            // Validate against Merkle tree for transparency
            bytes32 leaf = keccak256(abi.encodePacked(recipients[i], amounts[i]));
            require(
                MerkleProof.verify(merkleProofs[i], merkleRoot, leaf),
                "Invalid Merkle proof"
            );
            
            // Mark as sent
            sent[recipients[i]] = true;
            
            // Transfer tokens
            require(
                IERC20(token).transfer(recipients[i], amounts[i]),
                "Token transfer failed"
            );
            
            emit TokensSent(recipients[i], amounts[i]);
        }
    }
    
    /**
     * @notice Batch send tokens without Merkle validation (for trusted distribution)
     * @dev Use this if Merkle tree validation is not needed
     * @param recipients Array of recipient addresses
     * @param amounts Array of amounts to send
     */
    function batchSendDirect(
        address[] calldata recipients,
        uint256[] calldata amounts
    ) external onlyOwner {
        require(recipients.length == amounts.length, "Length mismatch");
        require(recipients.length <= 100, "Batch too large"); // DoS protection
        
        for (uint256 i = 0; i < recipients.length; i++) {
            require(recipients[i] != address(0), "Invalid address");
            require(amounts[i] > 0, "Invalid amount");
            require(!sent[recipients[i]], "Already sent");
            
            // Mark as sent
            sent[recipients[i]] = true;
            
            // Transfer tokens
            require(
                IERC20(token).transfer(recipients[i], amounts[i]),
                "Token transfer failed"
            );
            
            emit TokensSent(recipients[i], amounts[i]);
        }
    }
    
    /**
     * @notice Withdraw remaining tokens from contract
     * @param to Address to send tokens
     * @param amount Amount to withdraw
     */
    function withdrawTokens(address to, uint256 amount) external onlyOwner {
        require(to != address(0), "Invalid address");
        
        require(
            IERC20(token).transfer(to, amount),
            "Token transfer failed"
        );
        
        emit TokensWithdrawn(to, amount);
    }
    
    /**
     * @notice Check if tokens were sent to address
     * @param user Address to check
     * @return Whether tokens were sent
     */
    function hasReceived(address user) external view returns (bool) {
        return sent[user];
    }
    
    /**
     * @notice Get contract token balance
     * @return Balance of tokens in contract
     */
    function getBalance() external view returns (uint256) {
        return IERC20(token).balanceOf(address(this));
    }
}

