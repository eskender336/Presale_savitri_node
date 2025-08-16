// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract SavitriCoin is ERC20, Ownable {
    uint256 private constant INITIAL_SUPPLY = 600_000_000;
    bool public transfersEnabled;
    address public saleContract;
    mapping(address => bool) public blockedAddresses;

    event AddressBlocked(address indexed user, bool blocked);

    constructor() ERC20("Savitri Coin", "SAV") {
        _mint(msg.sender, INITIAL_SUPPLY * 10 ** decimals());
    }

    function setSaleContract(address _sale) external onlyOwner {
        saleContract = _sale;
    }

    function setBlockStatus(address user, bool blocked) external onlyOwner {
        blockedAddresses[user] = blocked;
        emit AddressBlocked(user, blocked);
    }

    function enableTransfers() external onlyOwner {
        transfersEnabled = true;
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
        if (!transfersEnabled) {
            require(
                from == address(0) ||
                from == owner() ||
                from == saleContract,
                "Transfers disabled"
            );
        }
    }
}
