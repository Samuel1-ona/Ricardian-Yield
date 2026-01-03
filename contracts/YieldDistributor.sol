// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./PropertyShares.sol";
import "./CashFlowEngine.sol";
import "./RentVault.sol";
import "./YieldStackingManager.sol";

/**
 * @title YieldDistributor
 * @dev Distributes yield proportionally to token holders using native MNT
 * Uses snapshot mechanism for fair distribution and claimable pattern for gas efficiency
 */
contract YieldDistributor is Ownable, ReentrancyGuard {
    PropertyShares public propertyShares;
    CashFlowEngine public cashFlowEngine;
    RentVault public rentVault;

    // Snapshot-based distribution
    uint256 public currentDistributionPeriod;
    mapping(uint256 => uint256) public totalDistributablePerPeriod;
    mapping(uint256 => mapping(address => uint256)) public claimedPerPeriod;
    mapping(uint256 => uint256) public snapshotTotalSupply;

    event YieldDistributed(uint256 indexed period, uint256 totalAmount, uint256 totalSupply);
    event YieldClaimed(address indexed claimant, uint256 indexed period, uint256 amount);
    event DistributionPeriodReset(uint256 newPeriod);

    constructor(address initialOwner) Ownable(initialOwner) {}

    /**
     * @dev Initialize the distributor with required contracts
     */
    function initialize(
        address _propertyShares,
        address _cashFlowEngine,
        address _rentVault
    ) external onlyOwner {
        require(_propertyShares != address(0), "YieldDistributor: invalid property shares address");
        require(_cashFlowEngine != address(0), "YieldDistributor: invalid cash flow engine address");
        require(_rentVault != address(0), "YieldDistributor: invalid rent vault address");

        propertyShares = PropertyShares(_propertyShares);
        cashFlowEngine = CashFlowEngine(_cashFlowEngine);
        rentVault = RentVault(payable(_rentVault));
    }

    /**
     * @dev Distribute yield for the current period
     * Calculates distributable cash flow (rental + DeFi yield) and creates a snapshot
     * Only owner can trigger distribution
     */
    function distributeYield() external onlyOwner nonReentrant {
        uint256 distributable = cashFlowEngine.getDistributableCashFlow();
        require(distributable > 0, "YieldDistributor: no distributable cash flow");

        uint256 totalSupply = propertyShares.totalSupply();
        require(totalSupply > 0, "YieldDistributor: no shares exist");

        // Take snapshot
        snapshotTotalSupply[currentDistributionPeriod] = totalSupply;
        totalDistributablePerPeriod[currentDistributionPeriod] = distributable;

        // Withdraw from yield vault if needed (yield stacking manager handles this)
        // First, check rent vault balance
        uint256 rentVaultBalance = rentVault.getBalance();
        
        if (distributable > rentVaultBalance) {
            uint256 neededFromVault = distributable - rentVaultBalance;
            // Withdraw from yield vault if yield stacking manager is available
            YieldStackingManager ysm = cashFlowEngine.yieldStackingManager();
            if (address(ysm) != address(0)) {
                ysm.withdrawForDistribution(neededFromVault);
            }
        }

        // Transfer funds from rent vault to this contract
        rentVault.withdraw(address(this), distributable);

        emit YieldDistributed(currentDistributionPeriod, distributable, totalSupply);
    }

    /**
     * @dev Claim yield for a specific period
     * @param period Period to claim yield for
     */
    function claimYield(uint256 period) external nonReentrant {
        require(period <= currentDistributionPeriod, "YieldDistributor: period not distributed");
        require(totalDistributablePerPeriod[period] > 0, "YieldDistributor: no yield for this period");

        uint256 userBalance = propertyShares.balanceOf(msg.sender);
        require(userBalance > 0, "YieldDistributor: no shares to claim for");

        // Check if already claimed
        require(claimedPerPeriod[period][msg.sender] == 0, "YieldDistributor: already claimed");

        uint256 totalSupply = snapshotTotalSupply[period];
        require(totalSupply > 0, "YieldDistributor: invalid snapshot");

        // Calculate proportional yield
        uint256 yieldAmount = (totalDistributablePerPeriod[period] * userBalance) / totalSupply;
        require(yieldAmount > 0, "YieldDistributor: yield amount too small");
        require(address(this).balance >= yieldAmount, "YieldDistributor: insufficient funds");

        // Mark as claimed
        claimedPerPeriod[period][msg.sender] = yieldAmount;

        // Transfer native MNT yield
        (bool success, ) = payable(msg.sender).call{value: yieldAmount}("");
        require(success, "YieldDistributor: transfer failed");

        emit YieldClaimed(msg.sender, period, yieldAmount);
    }

    /**
     * @dev Get claimable yield for a user in a specific period
     * @param user Address to check
     * @param period Period to check
     * @return claimable Amount of yield claimable
     */
    function getClaimableYield(address user, uint256 period) external view returns (uint256) {
        if (period > currentDistributionPeriod || totalDistributablePerPeriod[period] == 0) {
            return 0;
        }

        if (claimedPerPeriod[period][user] > 0) {
            return 0; // Already claimed
        }

        uint256 userBalance = propertyShares.balanceOf(user);
        if (userBalance == 0) {
            return 0;
        }

        uint256 totalSupply = snapshotTotalSupply[period];
        if (totalSupply == 0) {
            return 0;
        }

        return (totalDistributablePerPeriod[period] * userBalance) / totalSupply;
    }

    /**
     * @dev Reset to a new distribution period (typically monthly)
     * Should be called after all claims are processed
     */
    function resetDistributionPeriod() external onlyOwner {
        currentDistributionPeriod++;
        emit DistributionPeriodReset(currentDistributionPeriod);
    }

    /**
     * @dev Get current distribution period
     */
    function getCurrentPeriod() external view returns (uint256) {
        return currentDistributionPeriod;
    }

    /**
     * @dev Emergency withdraw (only owner)
     */
    function emergencyWithdraw(address to, uint256 amount) external onlyOwner {
        require(to != address(0), "YieldDistributor: invalid recipient");
        require(address(this).balance >= amount, "YieldDistributor: insufficient balance");
        (bool success, ) = payable(to).call{value: amount}("");
        require(success, "YieldDistributor: transfer failed");
    }
}

