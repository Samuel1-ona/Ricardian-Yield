// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title RentVault
 * @dev Receives and holds rental income in native MNT
 * Tracks rent collected per period (monthly) for cash flow calculations
 */
contract RentVault is Ownable, ReentrancyGuard {
    uint256 public rentCollected;
    uint256 public currentPeriod;
    mapping(uint256 => uint256) public rentPerPeriod;
    address public yieldDistributor;
    address public yieldStackingManager;

    event RentDeposited(address indexed depositor, uint256 amount, uint256 period);
    event PeriodReset(uint256 newPeriod);

    constructor(address initialOwner) Ownable(initialOwner) {}

    /**
     * @dev Deposit rent payment using native MNT (anyone can call - tenant or property manager)
     * @param amount Amount of MNT to deposit (must match msg.value)
     */
    function depositRent(uint256 amount) external payable nonReentrant {
        require(amount > 0, "RentVault: amount must be greater than zero");
        require(msg.value == amount, "RentVault: amount must match msg.value");
        
        rentCollected += amount;
        rentPerPeriod[currentPeriod] += amount;

        emit RentDeposited(msg.sender, amount, currentPeriod);
        
        // Note: Auto-deposit is triggered separately to avoid reentrancy issues
        // The yield stacking manager should be called after rent deposit completes
    }

    /**
     * @dev Reset to a new period (typically called monthly)
     * Only owner can reset periods
     */
    function resetPeriod() external onlyOwner {
        currentPeriod++;
        emit PeriodReset(currentPeriod);
    }

    /**
     * @dev Get rent collected for a specific period
     */
    function getRentForPeriod(uint256 period) external view returns (uint256) {
        return rentPerPeriod[period];
    }

    /**
     * @dev Get total native MNT balance in the vault
     */
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @dev Set the yield distributor address (only owner)
     */
    function setYieldDistributor(address _yieldDistributor) external onlyOwner {
        require(_yieldDistributor != address(0), "RentVault: invalid yield distributor");
        yieldDistributor = _yieldDistributor;
    }

    /**
     * @dev Set the yield stacking manager address (only owner)
     */
    function setYieldStackingManager(address _yieldStackingManager) external onlyOwner {
        require(_yieldStackingManager != address(0), "RentVault: invalid yield stacking manager");
        yieldStackingManager = _yieldStackingManager;
    }

    /**
     * @dev Withdraw native MNT from vault (only owner, yield distributor, or yield stacking manager)
     * @param to Address to withdraw to
     * @param amount Amount to withdraw
     */
    function withdraw(address to, uint256 amount) external nonReentrant {
        require(
            msg.sender == owner() || 
            msg.sender == yieldDistributor || 
            msg.sender == yieldStackingManager,
            "RentVault: not authorized"
        );
        require(to != address(0), "RentVault: invalid recipient");
        require(amount > 0, "RentVault: amount must be greater than zero");
        require(address(this).balance >= amount, "RentVault: insufficient balance");
        
        (bool success, ) = payable(to).call{value: amount}("");
        require(success, "RentVault: transfer failed");
    }

    /**
     * @dev Receive function to accept native MNT
     */
    receive() external payable {
        // Allow direct MNT transfers
        rentCollected += msg.value;
        rentPerPeriod[currentPeriod] += msg.value;
        emit RentDeposited(msg.sender, msg.value, currentPeriod);
    }
}

