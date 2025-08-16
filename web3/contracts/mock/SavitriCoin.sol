// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract SavitriCoin is ERC20, Ownable {
    uint256 private constant INITIAL_SUPPLY = 600_000_000;
    mapping(address => bool) public blockedAddresses;

    event AddressBlocked(address indexed user, bool blocked);

    constructor() ERC20("Savitri Coin", "SAV") {
        _mint(msg.sender, INITIAL_SUPPLY * 10 ** decimals());
    }

    function setBlockStatus(address user, bool blocked) external onlyOwner {
        blockedAddresses[user] = blocked;
        emit AddressBlocked(user, blocked);
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override {
        super._beforeTokenTransfer(from, to, amount);
        if (from != address(0)) {
            require(!blockedAddresses[from], "Address is blocked");
        }
        if (to != address(0)) {
            require(!blockedAddresses[to], "Address is blocked");
        }
    }
}
