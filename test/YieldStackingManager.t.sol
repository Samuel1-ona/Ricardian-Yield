// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console} from "forge-std/Test.sol";
import {YieldStackingManager} from "../contracts/YieldStackingManager.sol";
import {RentVault} from "../contracts/RentVault.sol";
import {CashFlowEngine} from "../contracts/CashFlowEngine.sol";
import {MockERC4626Vault} from "../contracts/MockERC4626Vault.sol";
import {MockUSDC} from "./MockUSDC.sol";

contract YieldStackingManagerTest is Test {
    YieldStackingManager public yieldManager;
    RentVault public rentVault;
    CashFlowEngine public cashFlowEngine;
    MockERC4626Vault public mockVault;
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
        yieldManager = new YieldStackingManager(address(usdc), address(rentVault), owner);
        
        // Deploy mock vault
        vm.prank(owner);
        mockVault = new MockERC4626Vault(
            usdc,
            "Mock Vault",
            "MVAULT",
            owner,
            500 // 5% APY
        );
        
        // Link contracts
        vm.prank(owner);
        cashFlowEngine.setRentVault(address(rentVault));
        
        vm.prank(owner);
        yieldManager.setCashFlowEngine(address(cashFlowEngine));
        
        vm.prank(owner);
        rentVault.setYieldStackingManager(address(yieldManager));
        
        vm.prank(owner);
        yieldManager.setYieldVault(address(mockVault));
        
        // Set manager
        vm.prank(owner);
        cashFlowEngine.setManager(manager);
        
        // Mint USDC to tenant
        usdc.mint(tenant, 100000 * 1e18);
    }

    function testAutoDepositIdleFunds() public {
        uint256 rentAmount = 10000 * 1e18;
        uint256 reserveThreshold = 2000 * 1e18;
        uint256 minimumDeposit = 1000 * 1e18;
        
        // Configure yield manager
        vm.prank(owner);
        yieldManager.setReserveThreshold(reserveThreshold);
        vm.prank(owner);
        yieldManager.setMinimumDepositAmount(minimumDeposit);
        
        // Deposit rent
        vm.startPrank(tenant);
        usdc.approve(address(rentVault), rentAmount);
        rentVault.depositRent(rentAmount);
        vm.stopPrank();
        
        // Trigger auto-deposit manually (since we removed it from depositRent to avoid reentrancy)
        vm.prank(owner);
        yieldManager.autoDepositIdleFunds();
        
        // Check that funds were auto-deposited (idle = 10000 - 2000 = 8000, which is > 1000)
        uint256 assetsInVault = yieldManager.getTotalAssetsInVault();
        assertGt(assetsInVault, 0, "Funds should be deposited to vault");
        
        // Verify reserve is maintained
        uint256 rentVaultBalance = rentVault.getBalance();
        assertGe(rentVaultBalance, reserveThreshold, "Reserve threshold should be maintained");
    }

    function testReserveThresholdEnforcement() public {
        uint256 rentAmount = 5000 * 1e18;
        uint256 reserveThreshold = 4000 * 1e18;
        uint256 minimumDeposit = 1001 * 1e18; // Set to 1001 so idle (1000) is less than minimum
        
        // Configure yield manager
        vm.prank(owner);
        yieldManager.setReserveThreshold(reserveThreshold);
        vm.prank(owner);
        yieldManager.setMinimumDepositAmount(minimumDeposit);
        
        // Deposit rent
        vm.startPrank(tenant);
        usdc.approve(address(rentVault), rentAmount);
        rentVault.depositRent(rentAmount);
        vm.stopPrank();
        
        // Trigger auto-deposit manually
        vm.prank(owner);
        yieldManager.autoDepositIdleFunds();
        
        // Idle funds = 5000 - 4000 = 1000, which is less than minimum deposit (1001)
        // Should not deposit
        uint256 assetsInVault = yieldManager.getTotalAssetsInVault();
        assertEq(assetsInVault, 0, "Funds should not be deposited if below minimum");
        
        // Verify reserve is maintained
        uint256 rentVaultBalance = rentVault.getBalance();
        assertGe(rentVaultBalance, reserveThreshold, "Reserve threshold should be maintained");
    }

    function testYieldAccrual() public {
        uint256 rentAmount = 10000 * 1e18;
        uint256 reserveThreshold = 2000 * 1e18;
        
        vm.prank(owner);
        yieldManager.setReserveThreshold(reserveThreshold);
        
        // Deposit rent
        vm.startPrank(tenant);
        usdc.approve(address(rentVault), rentAmount);
        rentVault.depositRent(rentAmount);
        vm.stopPrank();
        
        // Trigger auto-deposit manually
        vm.prank(owner);
        yieldManager.autoDepositIdleFunds();
        
        // Fast forward time to accrue yield (1 year)
        vm.warp(block.timestamp + 365 days);
        
        // Check yield earned
        uint256 yieldEarned = yieldManager.getYieldEarned();
        assertGt(yieldEarned, 0, "Yield should be earned over time");
        
        // Total assets should be greater than deposited amount
        uint256 totalAssets = yieldManager.getTotalAssetsInVault();
        uint256 totalDeposited = yieldManager.totalDeposited();
        assertGt(totalAssets, totalDeposited, "Total assets should include yield");
    }

    function testWithdrawForDistribution() public {
        uint256 rentAmount = 10000 * 1e18;
        uint256 reserveThreshold = 2000 * 1e18;
        
        vm.prank(owner);
        yieldManager.setReserveThreshold(reserveThreshold);
        
        // Deposit rent
        vm.startPrank(tenant);
        usdc.approve(address(rentVault), rentAmount);
        rentVault.depositRent(rentAmount);
        vm.stopPrank();
        
        // Trigger auto-deposit manually
        vm.prank(owner);
        yieldManager.autoDepositIdleFunds();
        
        // Fast forward to accrue yield
        vm.warp(block.timestamp + 365 days);
        
        uint256 withdrawAmount = 5000 * 1e18;
        
        // Withdraw for distribution
        vm.prank(owner);
        yieldManager.withdrawForDistribution(withdrawAmount);
        
        // Check that funds were withdrawn to rent vault
        uint256 rentVaultBalance = rentVault.getBalance();
        assertGt(rentVaultBalance, withdrawAmount, "Funds should be withdrawn to rent vault");
    }

    function testCalculateIdleFunds() public {
        uint256 rentAmount = 10000 * 1e18;
        uint256 expenses = 2000 * 1e18;
        uint256 reserveThreshold = 2000 * 1e18;
        
        vm.prank(owner);
        yieldManager.setReserveThreshold(reserveThreshold);
        
        // Deposit rent
        vm.startPrank(tenant);
        usdc.approve(address(rentVault), rentAmount);
        rentVault.depositRent(rentAmount);
        vm.stopPrank();
        
        // Record expenses
        vm.prank(manager);
        cashFlowEngine.recordOperatingExpense(expenses);
        
        // Calculate idle funds
        uint256 idleFunds = yieldManager.calculateIdleFunds();
        // Idle = 10000 - 2000 (expenses) - 2000 (reserve) = 6000
        assertEq(idleFunds, 6000 * 1e18, "Idle funds calculation should be correct");
    }

    function testAutoDepositDisabled() public {
        uint256 rentAmount = 10000 * 1e18;
        uint256 reserveThreshold = 2000 * 1e18;
        
        vm.prank(owner);
        yieldManager.setReserveThreshold(reserveThreshold);
        
        // Disable auto-deposit
        vm.prank(owner);
        yieldManager.setAutoDepositEnabled(false);
        
        // Deposit rent
        vm.startPrank(tenant);
        usdc.approve(address(rentVault), rentAmount);
        rentVault.depositRent(rentAmount);
        vm.stopPrank();
        
        // Try to trigger auto-deposit (should revert because disabled)
        vm.prank(owner);
        vm.expectRevert("YieldStackingManager: auto-deposit disabled");
        yieldManager.autoDepositIdleFunds();
        
        // Check that no funds were deposited
        uint256 assetsInVault = yieldManager.getTotalAssetsInVault();
        assertEq(assetsInVault, 0, "No funds should be deposited when auto-deposit is disabled");
    }

    function testManualDeposit() public {
        uint256 depositAmount = 5000 * 1e18;
        
        // Deposit to rent vault first
        vm.startPrank(tenant);
        usdc.approve(address(rentVault), depositAmount);
        rentVault.depositRent(depositAmount);
        vm.stopPrank();
        
        // Manually deposit to vault
        vm.prank(owner);
        yieldManager.depositToVault(depositAmount);
        
        // Check that funds were deposited
        uint256 assetsInVault = yieldManager.getTotalAssetsInVault();
        assertGt(assetsInVault, 0, "Funds should be deposited manually");
    }

    function testEmergencyWithdraw() public {
        uint256 rentAmount = 10000 * 1e18;
        uint256 reserveThreshold = 2000 * 1e18;
        
        vm.prank(owner);
        yieldManager.setReserveThreshold(reserveThreshold);
        
        // Deposit rent
        vm.startPrank(tenant);
        usdc.approve(address(rentVault), rentAmount);
        rentVault.depositRent(rentAmount);
        vm.stopPrank();
        
        // Trigger auto-deposit manually
        vm.prank(owner);
        yieldManager.autoDepositIdleFunds();
        
        // Emergency withdraw
        vm.prank(owner);
        yieldManager.emergencyWithdraw();
        
        // Check that funds were withdrawn
        uint256 assetsInVault = yieldManager.getTotalAssetsInVault();
        assertEq(assetsInVault, 0, "All funds should be withdrawn");
        
        // Check that funds are back in rent vault
        uint256 rentVaultBalance = rentVault.getBalance();
        assertGt(rentVaultBalance, 0, "Funds should be back in rent vault");
    }
}

