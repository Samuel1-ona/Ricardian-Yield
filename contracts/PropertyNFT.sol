// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IPropertyNFT.sol";

/**
 * @title PropertyNFT
 * @dev ERC-721 contract representing individual real estate properties
 * Each property is a unique NFT with metadata (location, valuation, rental rate)
 */
contract PropertyNFT is ERC721, Ownable, IPropertyNFT {
    uint256 private _nextTokenId;
    mapping(uint256 => PropertyData) private _properties;

    constructor(address initialOwner) ERC721("Real Estate Property", "REP") Ownable(initialOwner) {}

    /**
     * @dev Get property data for a given token ID
     */
    function getPropertyData(uint256 tokenId) external view override returns (PropertyData memory) {
        require(_ownerOf(tokenId) != address(0), "PropertyNFT: token does not exist");
        return _properties[tokenId];
    }

    /**
     * @dev Mint a new property NFT with associated data
     * @param to Address to mint the NFT to
     * @param data Property data (location, valuation, monthly rent, metadata URI)
     * @return tokenId The ID of the newly minted token
     */
    function mintProperty(address to, PropertyData calldata data) external onlyOwner returns (uint256) {
        require(to != address(0), "PropertyNFT: cannot mint to zero address");
        require(data.valuation > 0, "PropertyNFT: valuation must be greater than zero");
        require(data.monthlyRent > 0, "PropertyNFT: monthly rent must be greater than zero");
        require(bytes(data.location).length > 0, "PropertyNFT: location cannot be empty");

        uint256 tokenId = _nextTokenId++;
        _properties[tokenId] = data;
        _safeMint(to, tokenId);

        return tokenId;
    }

    /**
     * @dev Get the next token ID that will be minted
     */
    function nextTokenId() external view returns (uint256) {
        return _nextTokenId;
    }
}

