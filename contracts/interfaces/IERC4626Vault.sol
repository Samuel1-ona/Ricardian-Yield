// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title IERC4626Vault
 * @dev Interface for ERC-4626 vault integration
 * This is a simplified interface for our use case
 * Full ERC-4626 interface is available from OpenZeppelin
 */
interface IERC4626Vault {
    function asset() external view returns (address);
    function totalAssets() external view returns (uint256);
    function convertToShares(uint256 assets) external view returns (uint256);
    function convertToAssets(uint256 shares) external view returns (uint256);
    function deposit(uint256 assets, address receiver) external returns (uint256);
    function redeem(uint256 shares, address receiver, address owner) external returns (uint256);
}

