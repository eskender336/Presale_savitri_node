// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface AggregatorV3Interface {
    function decimals() external view returns (uint8);
    function latestRoundData() external view returns (
        uint80 roundId,
        int256 answer,
        uint256 startedAt,
        uint256 updatedAt,
        uint80 answeredInRound
    );
}

library PriceCalculationLibrary {
    uint256 public constant PRICE_FEED_STALENESS_THRESHOLD = 3600; // 1 hour
    
    function validatePriceFeed(AggregatorV3Interface feed) external view returns (uint256 priceInUSD, uint8 feedDecimals) {
        require(address(feed) != address(0), "Feed not set");
        
        (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        ) = feed.latestRoundData();
        
        require(answer > 0, "Invalid price: negative or zero");
        require(updatedAt > 0, "Price feed not updated");
        require(
            block.timestamp - updatedAt <= PRICE_FEED_STALENESS_THRESHOLD,
            "Price feed stale"
        );
        require(answeredInRound >= roundId, "Incomplete round");
        
        feedDecimals = feed.decimals();
        priceInUSD = uint256(answer);
    }
    
    function calculateTokensFromPayment(
        uint256 amount,
        uint256 priceInUSD,
        uint8 feedDecimals,
        uint8 paymentDecimals,
        uint256 tokenPrice,
        uint256 stablecoinDecimals
    ) external pure returns (uint256) {
        return
            (amount * priceInUSD * (10**(stablecoinDecimals + 18 - paymentDecimals))) /
            (tokenPrice * (10**feedDecimals));
    }
}

