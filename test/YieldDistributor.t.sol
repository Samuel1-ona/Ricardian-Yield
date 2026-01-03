// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console} from "forge-std/Test.sol";
import {YieldDistributor} from "../contracts/YieldDistributor.sol";
import {PropertyShares} from "../contracts/PropertyShares.sol";
import {CashFlowEngine} from "../contracts/CashFlowEngine.sol";
import {RentVault} from "../contracts/RentVault.sol";
import {SimpleDAO} from "../contracts/SimpleDAO.sol";
import {PropertyNFT} from "../contracts/PropertyNFT.sol";
import {MockUSDC} from "./MockUSDC.sol";
import {IPropertyNFT} from "../contracts/interfaces/IPropertyNFT.sol";

contract YieldDistributorTest is Test {
    YieldDistributor public yieldDistributor;
    PropertyShares public propertyShares;
    CashFlowEngine public cashFlowEngine;
    RentVault public rentVault;
    SimpleDAO public dao;
    PropertyNFT public propertyNFT;
    MockUSDC public usdc;
    
    address public owner = address(1);
    address public manager = address(2);
    address public tenant = address(3);
    address public shareholder1 = address(4);
    address public shareholder2 = address(5);

    function setUp() public {
        usdc = new MockUSDC();
        
        vm.startPrank(owner);
        propertyNFT = new PropertyNFT(owner);
        propertyShares = new PropertyShares(owner);
        rentVault = new RentVault(address(usdc), owner);
        dao = new SimpleDAO(owner);
        cashFlowEngine = new CashFlowEngine(owner);
        yieldDistributor = new YieldDistributor(owner);
        vm.stopPrank();

        // Setup property
        vm.prank(owner);
        uint256 propertyId = propertyNFT.mintProperty(owner, 
            IPropertyNFT.PropertyData({
                location: "123 Main St",
                valuation: 1000000 * 1e18,
                monthlyRent: 5000 * 1e18,
                metadataURI: "ipfs://QmTest"
            })
        );

        // Initialize shares
        vm.prank(owner);
        propertyShares.initialize(address(propertyNFT), propertyId, 100000 * 1e18, shareholder1);

        // Link contracts
        vm.startPrank(owner);
        cashFlowEngine.setRentVault(address(rentVault));
        cashFlowEngine.setDAO(address(dao));
        cashFlowEngine.setManager(manager);
        dao.setCashFlowEngine(address(cashFlowEngine));
        vm.stopPrank();
        
        vm.prank(owner);
        yieldDistributor.initialize(
            address(propertyShares),
            address(cashFlowEngine),
            address(rentVault),
            address(usdc)
        );
        
        // Authorize yield distributor to withdraw from rent vault
        vm.prank(owner);
        rentVault.setYieldDistributor(address(yieldDistributor));

        // Deposit rent
        usdc.mint(tenant, 100000 * 1e18);
        vm.startPrank(tenant);
        usdc.approve(address(rentVault), 10000 * 1e18);
        rentVault.depositRent(10000 * 1e18);
        vm.stopPrank();
    }

    function testDistributeYield() public {
        uint256 distributable = cashFlowEngine.getDistributableCashFlow();
        require(distributable > 0, "No distributable cash flow");

        vm.prank(owner);
        yieldDistributor.distributeYield();

        assertEq(yieldDistributor.totalDistributablePerPeriod(0), distributable);
        assertEq(yieldDistributor.snapshotTotalSupply(0), propertyShares.totalSupply());
    }

    function testClaimYield() public {
        uint256 distributable = cashFlowEngine.getDistributableCashFlow();
        
        vm.prank(owner);
        yieldDistributor.distributeYield();

        uint256 shareholder1Balance = propertyShares.balanceOf(shareholder1);
        uint256 expectedYield = (distributable * shareholder1Balance) / propertyShares.totalSupply();

        vm.prank(shareholder1);
        yieldDistributor.claimYield(0);

        assertEq(usdc.balanceOf(shareholder1), expectedYield);
        assertEq(yieldDistributor.claimedPerPeriod(0, shareholder1), expectedYield);
    }

    function testClaimYieldFailsIfAlreadyClaimed() public {
        uint256 distributable = cashFlowEngine.getDistributableCashFlow();
        
        vm.prank(owner);
        yieldDistributor.distributeYield();

        vm.startPrank(shareholder1);
        yieldDistributor.claimYield(0);
        vm.expectRevert("YieldDistributor: already claimed");
        yieldDistributor.claimYield(0);
        vm.stopPrank();
    }

    function testGetClaimableYield() public {
        uint256 distributable = cashFlowEngine.getDistributableCashFlow();
        
        vm.prank(owner);
        yieldDistributor.distributeYield();

        uint256 shareholder1Balance = propertyShares.balanceOf(shareholder1);
        uint256 expectedYield = (distributable * shareholder1Balance) / propertyShares.totalSupply();

        uint256 claimable = yieldDistributor.getClaimableYield(shareholder1, 0);
        assertEq(claimable, expectedYield);
    }

    function testGetClaimableYieldReturnsZeroAfterClaim() public {
        uint256 distributable = cashFlowEngine.getDistributableCashFlow();
        
        vm.prank(owner);
        yieldDistributor.distributeYield();

        vm.prank(shareholder1);
        yieldDistributor.claimYield(0);

        uint256 claimable = yieldDistributor.getClaimableYield(shareholder1, 0);
        assertEq(claimable, 0);
    }

    function testResetDistributionPeriod() public {
        vm.prank(owner);
        yieldDistributor.resetDistributionPeriod();

        assertEq(yieldDistributor.currentDistributionPeriod(), 1);
    }
}

