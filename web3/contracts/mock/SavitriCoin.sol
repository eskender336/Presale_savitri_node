// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract SavitriCoin is ERC20 {
    uint256 private constant INITIAL_SUPPLY = 100_000_000_000;

    constructor() ERC20("Savitri Coin", "SAV") {
        _mint(msg.sender, INITIAL_SUPPLY * 10 ** decimals());
    }
}
