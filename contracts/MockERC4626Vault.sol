// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MockERC4626Vault
 * @dev Simple mock ERC-4626 vault for testing purposes only
 * Simulates yield accrual by increasing the exchange rate over time
 */
contract MockERC4626Vault is ERC4626, Ownable {
    uint256 public yieldRate; // Annual yield rate in basis points (e.g., 500 = 5%)
    uint256 public lastUpdateTime;
    uint256 public constant BASIS_POINTS = 10000;

    event YieldRateUpdated(uint256 newRate);

    constructor(
        IERC20 asset_,
        string memory name_,
        string memory symbol_,
        address owner_,
        uint256 initialYieldRate_
    ) ERC4626(asset_) ERC20(name_, symbol_) Ownable(owner_) {
        yieldRate = initialYieldRate_;
        lastUpdateTime = block.timestamp;
    }

    /**
     * @dev Set the annual yield rate (in basis points)
     * @param newRate New yield rate (e.g., 500 = 5% APY)
     */
    function setYieldRate(uint256 newRate) external onlyOwner {
        yieldRate = newRate;
        lastUpdateTime = block.timestamp;
        emit YieldRateUpdated(newRate);
    }

    /**
     * @dev Override totalAssets to simulate yield accrual
     * Yield accrues continuously based on time elapsed
     */
    function totalAssets() public view override returns (uint256) {
        uint256 baseAssets = IERC20(asset()).balanceOf(address(this));
        if (baseAssets == 0 || yieldRate == 0) {
            return baseAssets;
        }

        // Calculate yield accrued since last update
        uint256 timeElapsed = block.timestamp - lastUpdateTime;
        uint256 secondsPerYear = 365 days;
        
        // Simple interest calculation: assets * rate * time / (10000 * secondsPerYear)
        uint256 yieldAccrued = (baseAssets * yieldRate * timeElapsed) / (BASIS_POINTS * secondsPerYear);
        
        return baseAssets + yieldAccrued;
    }

    /**
     * @dev Update the last update time (called internally to track yield)
     */
    function _updateYield() internal {
        lastUpdateTime = block.timestamp;
    }

    /**
     * @dev Override deposit to update yield tracking
     */
    function deposit(uint256 assets, address receiver) public override returns (uint256) {
        _updateYield();
        return super.deposit(assets, receiver);
    }

    /**
     * @dev Override redeem to update yield tracking
     */
    function redeem(uint256 shares, address receiver, address owner) public override returns (uint256) {
        _updateYield();
        return super.redeem(shares, receiver, owner);
    }
}

