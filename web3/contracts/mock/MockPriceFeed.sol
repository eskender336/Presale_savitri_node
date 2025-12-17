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

contract MockPriceFeed is AggregatorV3Interface {
    uint8 public override decimals;
    int256 private _answer;

    constructor(uint8 _decimals, int256 initialAnswer) {
        decimals = _decimals;
        _answer = initialAnswer;
    }

    function updateAnswer(int256 newAnswer) external {
        _answer = newAnswer;
    }

    function latestRoundData()
        external
        view
        override
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        )
    {
        // Return valid data with current timestamp to pass staleness check
        return (1, _answer, block.timestamp, block.timestamp, 1);
    }
}
