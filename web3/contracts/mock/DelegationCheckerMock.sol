// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract DelegationCheckerMock {
    mapping(address => bool) public delegated;

    function setDelegated(address user, bool status) external {
        delegated[user] = status;
    }

    function isDelegated(address user) external view returns (bool) {
        return delegated[user];
    }
}
