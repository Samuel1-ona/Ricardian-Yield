// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console} from "forge-std/Test.sol";
import {CashFlowEngine} from "../contracts/CashFlowEngine.sol";
import {RentVault} from "../contracts/RentVault.sol";
import {SimpleDAO} from "../contracts/SimpleDAO.sol";
import {MockUSDC} from "./MockUSDC.sol";

contract CashFlowEngineTest is Test {
    CashFlowEngine public cashFlowEngine;
    RentVault public rentVault;
    SimpleDAO public dao;
    MockUSDC public usdc;
    address public owner = address(1);
    address public manager = address(2);
    address public tenant = address(3);

    function setUp() public {
        usdc = new MockUSDC();
        
        vm.prank(owner);
        cashFlowEngine = new CashFlowEngine(owner);
        
        // Create rentVault with cashFlowEngine as owner so it can call resetPeriod
        vm.prank(owner);
        rentVault = new RentVault(address(usdc), address(cashFlowEngine));
        
        vm.prank(owner);
        dao = new SimpleDAO(owner);
        
        vm.prank(owner);
        cashFlowEngine.setRentVault(address(rentVault));
        
        vm.prank(owner);
        cashFlowEngine.setDAO(address(dao));
        
        vm.prank(owner);
        cashFlowEngine.setManager(manager);
        
        vm.prank(owner);
        dao.setCashFlowEngine(address(cashFlowEngine));

        // Give tenant USDC and deposit rent
        usdc.mint(tenant, 100000 * 1e18);
        vm.startPrank(tenant);
        usdc.approve(address(rentVault), 10000 * 1e18);
        rentVault.depositRent(10000 * 1e18);
        vm.stopPrank();
    }

    function testRecordOperatingExpense() public {
        uint256 expense = 2000 * 1e18;
        
        vm.prank(manager);
        cashFlowEngine.recordOperatingExpense(expense);

        assertEq(cashFlowEngine.operatingExpenses(), expense);
    }

    function testRecordOperatingExpenseFailsIfNotManager() public {
        vm.prank(tenant);
        vm.expectRevert("CashFlowEngine: not manager");
        cashFlowEngine.recordOperatingExpense(1000 * 1e18);
    }

    function testGetDistributableCashFlow() public {
        uint256 rent = 10000 * 1e18;
        uint256 expense = 2000 * 1e18;
        uint256 reserve = 1000 * 1e18;
        
        vm.prank(manager);
        cashFlowEngine.recordOperatingExpense(expense);
        
        vm.prank(manager);
        cashFlowEngine.allocateWorkingCapital(reserve);

        uint256 distributable = cashFlowEngine.getDistributableCashFlow();
        assertEq(distributable, rent - expense - reserve);
    }

    function testGetDistributableCashFlowReturnsZeroIfExpensesExceedRent() public {
        uint256 expense = 15000 * 1e18;
        
        vm.prank(manager);
        cashFlowEngine.recordOperatingExpense(expense);

        assertEq(cashFlowEngine.getDistributableCashFlow(), 0);
    }

    function testRecordCapEx() public {
        uint256 capexAmount = 5000 * 1e18;
        
        vm.prank(owner);
        uint256 proposalId = dao.createProposal(capexAmount, "Renovation");
        
        vm.prank(owner);
        dao.approveProposal(proposalId);
        
        vm.prank(owner);
        cashFlowEngine.recordCapEx(capexAmount, proposalId);

        assertEq(cashFlowEngine.capexSpent(), capexAmount);
        assertEq(cashFlowEngine.lastCapexChange(), capexAmount);
    }

    function testRecordCapExFailsIfProposalNotApproved() public {
        uint256 capexAmount = 5000 * 1e18;
        
        vm.prank(owner);
        uint256 proposalId = dao.createProposal(capexAmount, "Renovation");
        
        vm.prank(owner);
        vm.expectRevert("CashFlowEngine: proposal not approved");
        cashFlowEngine.recordCapEx(capexAmount, proposalId);
    }

    function testAllocateWorkingCapital() public {
        uint256 reserve = 2000 * 1e18;
        
        vm.prank(manager);
        cashFlowEngine.allocateWorkingCapital(reserve);

        assertEq(cashFlowEngine.workingCapitalReserve(), reserve);
        assertEq(int256(cashFlowEngine.lastWorkingCapitalChange()), int256(reserve));
    }

    function testReleaseWorkingCapital() public {
        uint256 reserve = 2000 * 1e18;
        
        vm.prank(manager);
        cashFlowEngine.allocateWorkingCapital(reserve);
        
        uint256 release = 1000 * 1e18;
        vm.prank(manager);
        cashFlowEngine.releaseWorkingCapital(release);

        assertEq(cashFlowEngine.workingCapitalReserve(), reserve - release);
    }

    function testGetCashFlowFromAssets() public {
        uint256 rent = 10000 * 1e18;
        uint256 expense = 2000 * 1e18;
        uint256 reserve = 1000 * 1e18;
        uint256 capex = 5000 * 1e18;
        
        vm.prank(manager);
        cashFlowEngine.recordOperatingExpense(expense);
        
        vm.prank(manager);
        cashFlowEngine.allocateWorkingCapital(reserve);
        
        vm.prank(owner);
        uint256 proposalId = dao.createProposal(capex, "Renovation");
        
        vm.prank(owner);
        dao.approveProposal(proposalId);
        
        vm.prank(owner);
        cashFlowEngine.recordCapEx(capex, proposalId);

        int256 cashFlowFromAssets = cashFlowEngine.getCashFlowFromAssets();
        int256 expected = int256(rent - expense - reserve) - int256(capex) + int256(reserve);
        assertEq(cashFlowFromAssets, expected);
    }

    function testResetPeriod() public {
        vm.prank(manager);
        cashFlowEngine.recordOperatingExpense(1000 * 1e18);
        
        // resetPeriod calls rentVault.resetPeriod() 
        // The cashFlowEngine is the owner of rentVault (set in setUp)
        // So we need to call resetPeriod as the owner of cashFlowEngine
        // The cashFlowEngine will then call rentVault.resetPeriod() as the rentVault owner
        vm.prank(owner);
        cashFlowEngine.resetPeriod();

        assertEq(cashFlowEngine.operatingExpenses(), 0);
        assertEq(cashFlowEngine.lastCapexChange(), 0);
        assertEq(cashFlowEngine.lastWorkingCapitalChange(), 0);
    }
}

