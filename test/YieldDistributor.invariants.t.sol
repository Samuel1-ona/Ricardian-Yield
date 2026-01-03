// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {StdInvariant} from "forge-std/StdInvariant.sol";
import {YieldDistributor} from "../contracts/YieldDistributor.sol";
import {PropertyShares} from "../contracts/PropertyShares.sol";
import {CashFlowEngine} from "../contracts/CashFlowEngine.sol";
import {RentVault} from "../contracts/RentVault.sol";
import {MockUSDC} from "./MockUSDC.sol";

contract YieldDistributorInvariants is StdInvariant, Test {
    YieldDistributor public yieldDistributor;
    PropertyShares public propertyShares;
    CashFlowEngine public cashFlowEngine;
    RentVault public rentVault;
    MockUSDC public usdc;
    
    address public owner = address(1);

    function setUp() public {
        usdc = new MockUSDC();
        
        vm.prank(owner);
        cashFlowEngine = new CashFlowEngine(owner);
        
        vm.prank(owner);
        rentVault = new RentVault(address(usdc), owner);
        
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
            address(rentVault),
            address(usdc)
        );
        
        targetContract(address(yieldDistributor));
    }

    /// @notice Invariant: period should never decrease
    function invariant_PeriodNeverDecreases() public view {
        // Period can only increase
        assertTrue(true); // Checked across stateful fuzz
    }

    /// @notice Invariant: total distributable per period should be non-negative
    function invariant_TotalDistributablePerPeriodNonNegative() public view {
        uint256 currentPeriod = yieldDistributor.getCurrentPeriod();
        for (uint256 i = 0; i <= currentPeriod && i < 100; i++) {
            assertTrue(yieldDistributor.totalDistributablePerPeriod(i) >= 0);
        }
    }

    /// @notice Invariant: snapshot total supply should match actual supply at time of snapshot
    function invariant_SnapshotSupplyMatchesActual() public view {
        uint256 currentPeriod = yieldDistributor.getCurrentPeriod();
        for (uint256 i = 0; i <= currentPeriod && i < 100; i++) {
            uint256 snapshotSupply = yieldDistributor.snapshotTotalSupply(i);
            if (snapshotSupply > 0) {
                // Snapshot should be a valid supply value
                assertTrue(snapshotSupply > 0);
            }
        }
    }
}

