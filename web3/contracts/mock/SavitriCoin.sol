// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract SavitriCoin is ERC20, Ownable {
    uint256 private constant INITIAL_SUPPLY = 100_000_000_000;

    mapping(address => bool) public blocked;
    mapping(address => bool) public whitelist;

    constructor() ERC20("Savitri Coin", "SAV") {
        _mint(msg.sender, INITIAL_SUPPLY * 10 ** decimals());
    }

    /// @notice Block or unblock an address from sending tokens
    /// @param account The address to update
    /// @param status True to block the address, false to unblock
    function setBlocked(address account, bool status) external onlyOwner {
        blocked[account] = status;
    }

    /// @notice Add or remove an address from the whitelist
    /// @dev Whitelisted addresses can transfer even if blocked
    /// @param account The address to update
    /// @param status True to whitelist the address, false to remove
    function setWhitelist(address account, bool status) external onlyOwner {
        whitelist[account] = status;
    }

    /// @dev Prevent blocked addresses from sending tokens while allowing receipts
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override {
        if (from != address(0) && !whitelist[from]) {
            require(!blocked[from], "Sender is blocked");
        }
        super._beforeTokenTransfer(from, to, amount);
    }
}
