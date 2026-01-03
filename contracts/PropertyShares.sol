// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IPropertyNFT.sol";

/**
 * @title PropertyShares
 * @dev ERC-20 token representing fractional ownership of a property
 * Fixed supply tied to a PropertyNFT, used for yield distribution
 */
contract PropertyShares is ERC20, Ownable {
    address public propertyNFT;
    uint256 public propertyId;
    bool public initialized;

    constructor(address initialOwner) ERC20("Property Shares", "PSHARE") Ownable(initialOwner) {}

    /**
     * @dev Initialize the shares token for a specific property
     * @param _propertyNFT Address of the PropertyNFT contract
     * @param _propertyId Token ID of the property
     * @param totalSupply Total supply of shares to mint
     * @param initialOwner Address to receive all initial shares
     */
    function initialize(
        address _propertyNFT,
        uint256 _propertyId,
        uint256 totalSupply,
        address initialOwner
    ) external onlyOwner {
        require(!initialized, "PropertyShares: already initialized");
        require(_propertyNFT != address(0), "PropertyShares: invalid property NFT address");
        require(totalSupply > 0, "PropertyShares: total supply must be greater than zero");
        require(initialOwner != address(0), "PropertyShares: invalid initial owner");

        propertyNFT = _propertyNFT;
        propertyId = _propertyId;
        initialized = true;

        _mint(initialOwner, totalSupply);
    }

    /**
     * @dev Check if the contract is initialized
     */
    function isInitialized() external view returns (bool) {
        return initialized;
    }
}

