// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IPropertyNFT {
    struct PropertyData {
        string location;
        uint256 valuation;
        uint256 monthlyRent;
        string metadataURI;
    }

    function getPropertyData(uint256 tokenId) external view returns (PropertyData memory);
    function mintProperty(address to, PropertyData calldata data) external returns (uint256);
}

