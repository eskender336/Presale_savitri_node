// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract SavitriCoin is ERC20, Ownable {
    uint256 private constant INITIAL_SUPPLY = 600_000_000;

    // Addresses explicitly blocked from sending; blocked users can still receive tokens
    mapping(address => bool) public blockedAddresses;

    // Addresses allowed to transfer while global transfers are disabled
    mapping(address => bool) public allowedSenders;

    // Global transfer flag. When false, only allowedSenders may transfer
    bool public transfersEnabled;

    event AddressBlocked(address indexed user, bool blocked);

    constructor() ERC20("Savitri Coin", "SAV") {
        _mint(msg.sender, INITIAL_SUPPLY * 10 ** decimals());
        allowedSenders[msg.sender] = true; // Owner can distribute tokens
    }

    function setBlockStatus(address user, bool blocked) external onlyOwner {
        blockedAddresses[user] = blocked;
        emit AddressBlocked(user, blocked);
    }

    function setAllowedSender(address user, bool allowed) external onlyOwner {
        allowedSenders[user] = allowed;
    }

    function setTransfersEnabled(bool enabled) external onlyOwner {
        transfersEnabled = enabled;
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override {
        super._beforeTokenTransfer(from, to, amount);

        if (from != address(0)) {
            require(!blockedAddresses[from], "Sender is blocked");
            if (!transfersEnabled) {
                require(allowedSenders[from], "Transfers disabled");
            }
        }
    }
}
