// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract SavitriCoin is ERC20, Ownable {
    uint256 private constant INITIAL_SUPPLY = 600_000_000;
    bool public transfersEnabled;
    address public saleContract;

    constructor() ERC20("Savitri Coin", "SAV") {
        _mint(msg.sender, INITIAL_SUPPLY * 10 ** decimals());
    }

    function setSaleContract(address _sale) external onlyOwner {
        saleContract = _sale;
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
