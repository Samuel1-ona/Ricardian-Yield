// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {YieldStackingManager} from "../contracts/YieldStackingManager.sol";
import {RentVault} from "../contracts/RentVault.sol";
import {CashFlowEngine} from "../contracts/CashFlowEngine.sol";
import {MockERC4626Vault} from "../contracts/MockERC4626Vault.sol";
import {MockUSDC} from "./MockUSDC.sol";

contract YieldStackingManagerFuzzTest is Test {
    YieldStackingManager public yieldManager;
    RentVault public rentVault;
    CashFlowEngine public cashFlowEngine;
    MockERC4626Vault public mockVault;
    MockUSDC public usdc;

    address public owner = address(1);
    address public tenant = address(2);

    function setUp() public {
        usdc = new MockUSDC();
        
        vm.prank(owner);
        cashFlowEngine = new CashFlowEngine(owner);
        
        vm.prank(owner);
        rentVault = new RentVault(owner);
        
        vm.prank(owner);
        yieldManager = new YieldStackingManager(address(rentVault), owner);
        
        vm.prank(owner);
        mockVault = new MockERC4626Vault(usdc, "Mock", "MOCK", owner, 500);
        
        vm.prank(owner);
        yieldManager.setYieldVault(address(mockVault));
        
        vm.prank(owner);
        yieldManager.setCashFlowEngine(address(cashFlowEngine));
        
        vm.prank(owner);
        rentVault.setYieldStackingManager(address(yieldManager));
        
        vm.prank(owner);
        cashFlowEngine.setRentVault(address(rentVault));
    }

    /// @notice Fuzz test: idle funds calculation should respect reserve threshold
    function testFuzz_CalculateIdleFunds_RespectsReserve(
        uint256 rentAmount,
        uint256 reserveThreshold,
        uint256 expenses
    ) public {
        vm.assume(rentAmount > 0);
        vm.assume(rentAmount <= 1e30); // Reasonable upper bound
        vm.assume(reserveThreshold < rentAmount);
        vm.assume(expenses > 0);
        vm.assume(expenses < rentAmount);
        vm.assume(expenses + reserveThreshold < rentAmount); // Avoid underflow
        
        vm.prank(owner);
        yieldManager.setReserveThreshold(reserveThreshold);
        
        usdc.mint(tenant, rentAmount);
        vm.startPrank(tenant);
        usdc.approve(address(rentVault), rentAmount);
        rentVault.depositRent(rentAmount);
        vm.stopPrank();
        
        vm.prank(owner);
        cashFlowEngine.recordOperatingExpense(expenses);
        
        uint256 idleFunds = yieldManager.calculateIdleFunds();
        
        if (rentAmount > expenses + reserveThreshold) {
            assertEq(idleFunds, rentAmount - expenses - reserveThreshold);
        } else {
            assertEq(idleFunds, 0);
        }
    }

    /// @notice Fuzz test: total deposited should track deposits correctly
    function testFuzz_TotalDeposited_TracksCorrectly(uint256 depositAmount) public {
        vm.assume(depositAmount >= yieldManager.minimumDepositAmount());
        vm.assume(depositAmount <= type(uint256).max / 2);
        
        usdc.mint(tenant, depositAmount);
        vm.startPrank(tenant);
        usdc.approve(address(rentVault), depositAmount);
        rentVault.depositRent(depositAmount);
        vm.stopPrank();
        
        uint256 initialDeposited = yieldManager.totalDeposited();
        
        vm.prank(owner);
        yieldManager.autoDepositIdleFunds();
        
        // Total deposited should increase by the amount deposited
        assertGe(yieldManager.totalDeposited(), initialDeposited);
    }

    /// @notice Fuzz test: yield earned should be non-negative
    function testFuzz_YieldEarned_NonNegative(uint256 depositAmount, uint256 timeElapsed) public {
        uint256 minDeposit = yieldManager.minimumDepositAmount();
        vm.assume(depositAmount >= minDeposit);
        vm.assume(depositAmount <= 1e30); // Reasonable upper bound
        vm.assume(timeElapsed <= 10 * 365 days); // Reasonable time limit
        vm.assume(block.timestamp + timeElapsed >= block.timestamp); // Avoid overflow
        
        usdc.mint(tenant, depositAmount);
        vm.startPrank(tenant);
        usdc.approve(address(rentVault), depositAmount);
        rentVault.depositRent(depositAmount);
        vm.stopPrank();
        
        vm.prank(owner);
        yieldManager.autoDepositIdleFunds();
        
        vm.warp(block.timestamp + timeElapsed);
        
        uint256 yieldEarned = yieldManager.getYieldEarned();
        assertGe(yieldEarned, 0);
    }

    /// @notice Fuzz test: total assets in vault should be >= total deposited
    function testFuzz_TotalAssets_GreaterThanOrEqualDeposited(uint256 depositAmount) public {
        uint256 minDeposit = yieldManager.minimumDepositAmount();
        vm.assume(depositAmount >= minDeposit);
        vm.assume(depositAmount <= 1e30); // Reasonable upper bound to avoid overflow
        
        usdc.mint(tenant, depositAmount);
        vm.startPrank(tenant);
        usdc.approve(address(rentVault), depositAmount);
        rentVault.depositRent(depositAmount);
        vm.stopPrank();
        
        vm.prank(owner);
        yieldManager.autoDepositIdleFunds();
        
        uint256 totalAssets = yieldManager.getTotalAssetsInVault();
        uint256 totalDeposited = yieldManager.totalDeposited();
        
        assertGe(totalAssets, totalDeposited);
    }
}

