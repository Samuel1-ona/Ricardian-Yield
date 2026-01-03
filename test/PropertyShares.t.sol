// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console} from "forge-std/Test.sol";
import {PropertyShares} from "../contracts/PropertyShares.sol";
import {PropertyNFT} from "../contracts/PropertyNFT.sol";
import {IPropertyNFT} from "../contracts/interfaces/IPropertyNFT.sol";

contract PropertySharesTest is Test {
    PropertyShares public propertyShares;
    PropertyNFT public propertyNFT;
    address public owner = address(1);
    address public initialOwner = address(2);

    function setUp() public {
        vm.prank(owner);
        propertyNFT = new PropertyNFT(owner);
        
        vm.prank(owner);
        propertyShares = new PropertyShares(owner);
    }

    function testInitialize() public {
        vm.prank(owner);
        uint256 tokenId = propertyNFT.mintProperty(owner, 
            IPropertyNFT.PropertyData({
                location: "123 Main St",
                valuation: 1000000 * 1e18,
                monthlyRent: 5000 * 1e18,
                metadataURI: "ipfs://QmTest"
            })
        );

        vm.prank(owner);
        propertyShares.initialize(address(propertyNFT), tokenId, 100000 * 1e18, initialOwner);

        assertTrue(propertyShares.isInitialized());
        assertEq(propertyShares.propertyNFT(), address(propertyNFT));
        assertEq(propertyShares.propertyId(), tokenId);
        assertEq(propertyShares.totalSupply(), 100000 * 1e18);
        assertEq(propertyShares.balanceOf(initialOwner), 100000 * 1e18);
    }

    function testInitializeFailsIfNotOwner() public {
        vm.prank(initialOwner);
        vm.expectRevert();
        propertyShares.initialize(address(propertyNFT), 0, 100000 * 1e18, initialOwner);
    }

    function testInitializeFailsIfAlreadyInitialized() public {
        vm.prank(owner);
        propertyShares.initialize(address(propertyNFT), 0, 100000 * 1e18, initialOwner);

        vm.prank(owner);
        vm.expectRevert("PropertyShares: already initialized");
        propertyShares.initialize(address(propertyNFT), 0, 100000 * 1e18, initialOwner);
    }

    function testInitializeFailsWithZeroSupply() public {
        vm.prank(owner);
        vm.expectRevert("PropertyShares: total supply must be greater than zero");
        propertyShares.initialize(address(propertyNFT), 0, 0, initialOwner);
    }
}

