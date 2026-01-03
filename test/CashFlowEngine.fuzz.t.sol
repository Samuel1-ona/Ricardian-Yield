// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {CashFlowEngine} from "../contracts/CashFlowEngine.sol";
import {RentVault} from "../contracts/RentVault.sol";
import {SimpleDAO} from "../contracts/SimpleDAO.sol";
import {MockUSDC} from "./MockUSDC.sol";

contract CashFlowEngineFuzzTest is Test {
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
        
        vm.prank(owner);
        rentVault = new RentVault(address(usdc), owner);
        
        vm.prank(owner);
        dao = new SimpleDAO(owner);
        
        vm.prank(owner);
        cashFlowEngine.setRentVault(address(rentVault));
        
        vm.prank(owner);
        cashFlowEngine.setDAO(address(dao));
        
        vm.prank(owner);
        dao.setCashFlowEngine(address(cashFlowEngine));
        
        vm.prank(owner);
        cashFlowEngine.setManager(manager);
    }

    /// @notice Fuzz test: operating expenses should accumulate
    function testFuzz_RecordOperatingExpense_Accumulates(uint256 amount) public {
        vm.assume(amount > 0);
        vm.assume(amount <= type(uint256).max / 2);
        
        uint256 initialExpenses = cashFlowEngine.operatingExpenses();
        
        vm.prank(manager);
        cashFlowEngine.recordOperatingExpense(amount);
        
        assertEq(cashFlowEngine.operatingExpenses(), initialExpenses + amount);
    }

    /// @notice Fuzz test: distributable cash flow should account for expenses
    function testFuzz_DistributableCashFlow_AccountsForExpenses(
        uint256 rentAmount,
        uint256 expenseAmount
    ) public {
        vm.assume(rentAmount > 0);
        vm.assume(expenseAmount > 0);
        vm.assume(rentAmount <= type(uint256).max / 2);
        vm.assume(expenseAmount <= rentAmount);
        
        // Deposit rent
        usdc.mint(tenant, rentAmount);
        vm.startPrank(tenant);
        usdc.approve(address(rentVault), rentAmount);
        rentVault.depositRent(rentAmount);
        vm.stopPrank();
        
        // Record expense
        vm.prank(manager);
        cashFlowEngine.recordOperatingExpense(expenseAmount);
        
        uint256 distributable = cashFlowEngine.getDistributableCashFlow();
        assertLe(distributable, rentAmount - expenseAmount);
    }

    /// @notice Fuzz test: working capital allocation should increase reserve
    function testFuzz_AllocateWorkingCapital_IncreasesReserve(uint256 amount) public {
        vm.assume(amount > 0);
        vm.assume(amount <= type(uint256).max / 2);
        
        uint256 initialReserve = cashFlowEngine.workingCapitalReserve();
        
        vm.prank(manager);
        cashFlowEngine.allocateWorkingCapital(amount);
        
        assertEq(cashFlowEngine.workingCapitalReserve(), initialReserve + amount);
    }

    /// @notice Fuzz test: working capital release should decrease reserve
    function testFuzz_ReleaseWorkingCapital_DecreasesReserve(
        uint256 allocateAmount,
        uint256 releaseAmount
    ) public {
        vm.assume(allocateAmount > 0);
        vm.assume(releaseAmount > 0);
        vm.assume(releaseAmount <= allocateAmount);
        vm.assume(allocateAmount <= type(uint256).max / 2);
        
        vm.prank(manager);
        cashFlowEngine.allocateWorkingCapital(allocateAmount);
        
        vm.prank(manager);
        cashFlowEngine.releaseWorkingCapital(releaseAmount);
        
        assertEq(cashFlowEngine.workingCapitalReserve(), allocateAmount - releaseAmount);
    }

    /// @notice Fuzz test: CapEx should accumulate
    function testFuzz_RecordCapEx_Accumulates(uint256 amount) public {
        vm.assume(amount > 0);
        vm.assume(amount <= type(uint256).max / 2);
        
        vm.prank(owner);
        uint256 proposalId = dao.createProposal(amount, "Test proposal");
        
        vm.prank(owner);
        dao.approveProposal(proposalId);
        
        uint256 initialCapex = cashFlowEngine.capexSpent();
        
        vm.prank(owner);
        cashFlowEngine.recordCapEx(amount, proposalId);
        
        assertEq(cashFlowEngine.capexSpent(), initialCapex + amount);
    }

    /// @notice Fuzz test: reset period should clear expenses
    function testFuzz_ResetPeriod_ClearsExpenses(uint256 expenseAmount) public {
        vm.assume(expenseAmount > 0);
        vm.assume(expenseAmount <= type(uint256).max / 2);
        
        vm.prank(manager);
        cashFlowEngine.recordOperatingExpense(expenseAmount);
        
        vm.prank(owner);
        cashFlowEngine.resetPeriod();
        
        assertEq(cashFlowEngine.operatingExpenses(), 0);
    }
}

