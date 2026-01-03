// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {YieldDistributor} from "../contracts/YieldDistributor.sol";
import {PropertyShares} from "../contracts/PropertyShares.sol";
import {CashFlowEngine} from "../contracts/CashFlowEngine.sol";
import {RentVault} from "../contracts/RentVault.sol";
import {MockUSDC} from "./MockUSDC.sol";

contract YieldDistributorFuzzTest is Test {
    YieldDistributor public yieldDistributor;
    PropertyShares public propertyShares;
    CashFlowEngine public cashFlowEngine;
    RentVault public rentVault;
    MockUSDC public usdc;
    
    address public owner = address(1);
    address public shareholder1 = address(2);
    address public shareholder2 = address(3);
    address public tenant = address(0x9999);

    function setUp() public {
        usdc = new MockUSDC();
        
        vm.prank(owner);
        cashFlowEngine = new CashFlowEngine(owner);
        
        vm.prank(owner);
        rentVault = new RentVault(owner);
        
        vm.prank(owner);
        propertyShares = new PropertyShares(owner);
        
        vm.prank(owner);
        yieldDistributor = new YieldDistributor(owner);
        
        vm.prank(owner);
        cashFlowEngine.setRentVault(address(rentVault));
        
        vm.prank(owner);
        yieldDistributor.initialize(
            address(propertyShares),
            address(cashFlowEngine),
            address(rentVault)
        );
        
        vm.prank(owner);
        rentVault.setYieldDistributor(address(yieldDistributor));
    }

    /// @notice Fuzz test: claimable yield should be proportional to shares
    function testFuzz_ClaimableYield_ProportionalToShares(
        uint256 totalShares,
        uint256 shareholder1Shares,
        uint256 distributableAmount
    ) public {
        vm.assume(totalShares > 0);
        vm.assume(shareholder1Shares > 0);
        vm.assume(shareholder1Shares <= totalShares);
        vm.assume(distributableAmount > 0);
        vm.assume(totalShares <= 1e30); // Reasonable limit
        vm.assume(distributableAmount <= 1e30);
        
        // Create a dummy property NFT address for initialization
        address dummyNFT = address(0x1234);
        
        // Initialize shares
        vm.prank(owner);
        propertyShares.initialize(dummyNFT, 0, totalShares, owner);
        
        // Transfer shares to shareholder1
        vm.prank(owner);
        propertyShares.transfer(shareholder1, shareholder1Shares);
        
        // Deposit rent to create distributable cash flow
        usdc.mint(tenant, distributableAmount);
        vm.startPrank(tenant);
        usdc.approve(address(rentVault), distributableAmount);
        rentVault.depositRent(distributableAmount);
        vm.stopPrank();
        
        // Now distribute
        vm.prank(owner);
        yieldDistributor.distributeYield();
        
        uint256 claimable = yieldDistributor.getClaimableYield(shareholder1, 0);
        uint256 expected = (distributableAmount * shareholder1Shares) / totalShares;
        
        // Allow small rounding difference
        assertApproxEqAbs(claimable, expected, 1);
    }

    /// @notice Fuzz test: total claimed should not exceed distributable
    function testFuzz_TotalClaimed_NotExceedDistributable(
        uint256 totalShares,
        uint256 distributableAmount
    ) public {
        vm.assume(totalShares > 0);
        vm.assume(distributableAmount > 0);
        vm.assume(totalShares <= 1e30);
        vm.assume(distributableAmount <= 1e30);
        
        address dummyNFT = address(0x1234);
        vm.prank(owner);
        propertyShares.initialize(dummyNFT, 0, totalShares, owner);
        
        // Deposit rent to create distributable cash flow
        usdc.mint(tenant, distributableAmount);
        vm.startPrank(tenant);
        usdc.approve(address(rentVault), distributableAmount);
        rentVault.depositRent(distributableAmount);
        vm.stopPrank();
        
        vm.prank(owner);
        yieldDistributor.distributeYield();
        
        vm.prank(owner);
        yieldDistributor.claimYield(0);
        
        // Owner should have received their proportional share
        uint256 ownerBalance = usdc.balanceOf(owner);
        assertLe(ownerBalance, distributableAmount);
    }

    /// @notice Fuzz test: period should increment on reset
    function testFuzz_ResetPeriod_IncrementsPeriod(uint256 times) public {
        vm.assume(times < 100);
        
        uint256 initialPeriod = yieldDistributor.getCurrentPeriod();
        
        for (uint256 i = 0; i < times; i++) {
            vm.prank(owner);
            yieldDistributor.resetDistributionPeriod();
        }
        
        assertEq(yieldDistributor.getCurrentPeriod(), initialPeriod + times);
    }
}

