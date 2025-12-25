// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

library StakingLibrary {
    uint256 public constant EARLY_WITHDRAWAL_PENALTY_PERCENT = 5;
    
    function calculateAPYMultiplier(uint256 lockPeriodDays) internal pure returns (uint256) {
        if (lockPeriodDays == 365) {
            return 3; // 3x for 365 days
        } else if (lockPeriodDays == 180) {
            return 2; // 2x for 180 days
        } else if (lockPeriodDays == 90) {
            return 3; // 1.5x for 90 days (3/2)
        }
        return 1; // 1x base
    }
    
    function calculateRewardAmount(
        uint256 amount,
        uint256 baseAPY,
        uint256 lockPeriodDays,
        uint256 timeElapsed
    ) external pure returns (uint256) {
        if (amount == 0 || timeElapsed == 0) {
            return 0;
        }
        
        uint256 multiplier = StakingLibrary.calculateAPYMultiplier(lockPeriodDays);
        uint256 apy = baseAPY;
        
        if (lockPeriodDays == 90) {
            apy = baseAPY * 3 / 2; // 1.5x for 90 days
        } else {
            apy = baseAPY * multiplier; // 2x or 3x for longer periods
        }
        
        // Calculate rewards: amount * apy * timeElapsed / (365 days * 100)
        return (amount * apy * timeElapsed) / (365 days * 100);
    }
    
    function calculateEarlyWithdrawalPenalty(
        uint256 amount
    ) external pure returns (uint256) {
        return (amount * EARLY_WITHDRAWAL_PENALTY_PERCENT) / 100;
    }
}

