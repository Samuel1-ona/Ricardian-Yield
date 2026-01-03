// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {RentVault} from "../contracts/RentVault.sol";
import {MockUSDC} from "./MockUSDC.sol";

contract RentVaultFuzzTest is Test {
    RentVault public rentVault;
    MockUSDC public usdc;
    address public owner = address(1);
    address public user = address(2);

    function setUp() public {
        usdc = new MockUSDC();
        vm.prank(owner);
        rentVault = new RentVault(address(usdc), owner);
    }

    /// @notice Fuzz test: rent deposits should always increase rentCollected
    function testFuzz_DepositRent_IncreasesRentCollected(uint256 amount) public {
        vm.assume(amount > 0);
        vm.assume(amount <= type(uint256).max / 2); // Avoid overflow
        
        uint256 initialRent = rentVault.rentCollected();
        usdc.mint(user, amount);
        
        vm.startPrank(user);
        usdc.approve(address(rentVault), amount);
        rentVault.depositRent(amount);
        vm.stopPrank();
        
        assertEq(rentVault.rentCollected(), initialRent + amount);
    }

    /// @notice Fuzz test: rent deposits should increase period rent
    function testFuzz_DepositRent_IncreasesPeriodRent(uint256 amount) public {
        vm.assume(amount > 0);
        vm.assume(amount <= type(uint256).max / 2);
        
        uint256 currentPeriod = rentVault.currentPeriod();
        uint256 initialPeriodRent = rentVault.getRentForPeriod(currentPeriod);
        usdc.mint(user, amount);
        
        vm.startPrank(user);
        usdc.approve(address(rentVault), amount);
        rentVault.depositRent(amount);
        vm.stopPrank();
        
        assertEq(rentVault.getRentForPeriod(currentPeriod), initialPeriodRent + amount);
    }

    /// @notice Fuzz test: balance should equal rent collected (if no withdrawals)
    function testFuzz_BalanceEqualsRentCollected(uint256 amount) public {
        vm.assume(amount > 0);
        vm.assume(amount <= type(uint256).max / 2);
        
        usdc.mint(user, amount);
        
        vm.startPrank(user);
        usdc.approve(address(rentVault), amount);
        rentVault.depositRent(amount);
        vm.stopPrank();
        
        assertEq(rentVault.getBalance(), rentVault.rentCollected());
    }

    /// @notice Fuzz test: period reset should increment period
    function testFuzz_ResetPeriod_IncrementsPeriod(uint256 times) public {
        vm.assume(times < 100); // Reasonable limit
        
        uint256 initialPeriod = rentVault.currentPeriod();
        
        for (uint256 i = 0; i < times; i++) {
            vm.prank(owner);
            rentVault.resetPeriod();
        }
        
        assertEq(rentVault.currentPeriod(), initialPeriod + times);
    }

    /// @notice Fuzz test: withdrawals should decrease balance
    function testFuzz_Withdraw_DecreasesBalance(uint256 depositAmount, uint256 withdrawAmount) public {
        vm.assume(depositAmount > 0);
        vm.assume(withdrawAmount > 0);
        vm.assume(withdrawAmount <= depositAmount);
        vm.assume(depositAmount <= type(uint256).max / 2);
        
        usdc.mint(user, depositAmount);
        
        vm.startPrank(user);
        usdc.approve(address(rentVault), depositAmount);
        rentVault.depositRent(depositAmount);
        vm.stopPrank();
        
        uint256 initialBalance = rentVault.getBalance();
        
        vm.prank(owner);
        rentVault.withdraw(owner, withdrawAmount);
        
        assertEq(rentVault.getBalance(), initialBalance - withdrawAmount);
    }
}

