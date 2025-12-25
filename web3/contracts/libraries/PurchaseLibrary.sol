// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

library PurchaseLibrary {
    struct PurchaseParams {
        address buyer;
        address paymentToken;
        address saleToken;
        uint256 paymentAmount;
        uint256 tokenAmount;
        string transactionType;
    }
    
    function calculateStablecoinTokens(
        uint256 stablecoinAmount,
        uint256 stablecoinDecimals,
        uint256 tokenPrice
    ) external pure returns (uint256) {
        return (stablecoinAmount * 10**stablecoinDecimals * 1e18) / tokenPrice;
    }
}

