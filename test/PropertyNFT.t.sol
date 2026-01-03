// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console} from "forge-std/Test.sol";
import {PropertyNFT} from "../contracts/PropertyNFT.sol";
import {IPropertyNFT} from "../contracts/interfaces/IPropertyNFT.sol";

contract PropertyNFTTest is Test {
    PropertyNFT public propertyNFT;
    address public owner = address(1);
    address public user = address(2);

    function setUp() public {
        vm.prank(owner);
        propertyNFT = new PropertyNFT(owner);
    }

    function testMintProperty() public {
        IPropertyNFT.PropertyData memory data = IPropertyNFT.PropertyData({
            location: "123 Main St, San Francisco, CA",
            valuation: 1000000 * 1e18,
            monthlyRent: 5000 * 1e18,
            metadataURI: "ipfs://QmTest"
        });

        vm.prank(owner);
        uint256 tokenId = propertyNFT.mintProperty(user, data);

        assertEq(propertyNFT.ownerOf(tokenId), user);
        IPropertyNFT.PropertyData memory retrieved = propertyNFT.getPropertyData(tokenId);
        assertEq(retrieved.location, data.location);
        assertEq(retrieved.valuation, data.valuation);
        assertEq(retrieved.monthlyRent, data.monthlyRent);
    }

    function testMintPropertyFailsIfNotOwner() public {
        IPropertyNFT.PropertyData memory data = IPropertyNFT.PropertyData({
            location: "123 Main St",
            valuation: 1000000 * 1e18,
            monthlyRent: 5000 * 1e18,
            metadataURI: "ipfs://QmTest"
        });

        vm.prank(user);
        vm.expectRevert();
        propertyNFT.mintProperty(user, data);
    }

    function testMintPropertyFailsWithZeroValuation() public {
        IPropertyNFT.PropertyData memory data = IPropertyNFT.PropertyData({
            location: "123 Main St",
            valuation: 0,
            monthlyRent: 5000 * 1e18,
            metadataURI: "ipfs://QmTest"
        });

        vm.prank(owner);
        vm.expectRevert("PropertyNFT: valuation must be greater than zero");
        propertyNFT.mintProperty(user, data);
    }

    function testMintPropertyFailsWithZeroRent() public {
        IPropertyNFT.PropertyData memory data = IPropertyNFT.PropertyData({
            location: "123 Main St",
            valuation: 1000000 * 1e18,
            monthlyRent: 0,
            metadataURI: "ipfs://QmTest"
        });

        vm.prank(owner);
        vm.expectRevert("PropertyNFT: monthly rent must be greater than zero");
        propertyNFT.mintProperty(user, data);
    }

    function testMintPropertyFailsWithEmptyLocation() public {
        IPropertyNFT.PropertyData memory data = IPropertyNFT.PropertyData({
            location: "",
            valuation: 1000000 * 1e18,
            monthlyRent: 5000 * 1e18,
            metadataURI: "ipfs://QmTest"
        });

        vm.prank(owner);
        vm.expectRevert("PropertyNFT: location cannot be empty");
        propertyNFT.mintProperty(user, data);
    }

    function testGetPropertyDataFailsForNonExistentToken() public {
        vm.expectRevert("PropertyNFT: token does not exist");
        propertyNFT.getPropertyData(999);
    }
}

