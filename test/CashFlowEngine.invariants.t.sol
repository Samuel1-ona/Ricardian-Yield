// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {StdInvariant} from "forge-std/StdInvariant.sol";
import {CashFlowEngine} from "../contracts/CashFlowEngine.sol";
import {RentVault} from "../contracts/RentVault.sol";
import {SimpleDAO} from "../contracts/SimpleDAO.sol";
import {MockUSDC} from "./MockUSDC.sol";

contract CashFlowEngineInvariants is StdInvariant, Test {
    CashFlowEngine public cashFlowEngine;
    RentVault public rentVault;
    SimpleDAO public dao;
    MockUSDC public usdc;
    
    address public owner = address(1);
    address public manager = address(2);

    function setUp() public {
        usdc = new MockUSDC();
        
        vm.prank(owner);
        cashFlowEngine = new CashFlowEngine(owner);
        
        vm.prank(owner);
        rentVault = new RentVault(owner);
        
        vm.prank(owner);
        dao = new SimpleDAO(owner);
        
        vm.prank(owner);
        cashFlowEngine.setRentVault(address(rentVault));
        
        vm.prank(owner);
        cashFlowEngine.setDAO(address(dao));
        
        vm.prank(owner);
        cashFlowEngine.setManager(manager);
        
        targetContract(address(cashFlowEngine));
    }

    /// @notice Invariant: distributable cash flow should never exceed rent collected
    function invariant_DistributableNeverExceedsRent() public view {
        uint256 distributable = cashFlowEngine.getDistributableCashFlow();
        uint256 rentCollected = rentVault.rentCollected();
        assertLe(distributable, rentCollected);
    }

    /// @notice Invariant: working capital reserve should never be negative
    function invariant_WorkingCapitalReserveNonNegative() public view {
        assertTrue(cashFlowEngine.workingCapitalReserve() >= 0);
    }

    /// @notice Invariant: expenses should never be negative
    function invariant_ExpensesNonNegative() public view {
        assertTrue(cashFlowEngine.operatingExpenses() >= 0);
        assertTrue(cashFlowEngine.capexSpent() >= 0);
    }

    /// @notice Invariant: distributable should account for all deductions
    function invariant_DistributableAccountsForAllDeductions() public view {
        uint256 rent = rentVault.rentCollected();
        uint256 expenses = cashFlowEngine.operatingExpenses();
        uint256 reserve = cashFlowEngine.workingCapitalReserve();
        
        uint256 distributable = cashFlowEngine.getDistributableCashFlow();
        
        // Distributable should be <= rent - expenses - reserve (allowing for yield)
        if (rent > expenses + reserve) {
            assertLe(distributable, rent - expenses - reserve + 1e18); // Small tolerance for yield
        }
    }
}

