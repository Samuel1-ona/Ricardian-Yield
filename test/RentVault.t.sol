// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console} from "forge-std/Test.sol";
import {RentVault} from "../contracts/RentVault.sol";
import {MockUSDC} from "./MockUSDC.sol";

contract RentVaultTest is Test {
    RentVault public rentVault;
    MockUSDC public usdc;
    address public owner = address(1);
    address public tenant = address(2);

    function setUp() public {
        usdc = new MockUSDC();
        vm.prank(owner);
        rentVault = new RentVault(address(usdc), owner);
        
        // Give tenant some USDC
        usdc.mint(tenant, 100000 * 1e18);
    }

    function testDepositRent() public {
        uint256 amount = 5000 * 1e18;
        
        vm.prank(tenant);
        usdc.approve(address(rentVault), amount);
        
        vm.prank(tenant);
        rentVault.depositRent(amount);

        assertEq(rentVault.rentCollected(), amount);
        assertEq(rentVault.getRentForPeriod(0), amount);
        assertEq(usdc.balanceOf(address(rentVault)), amount);
    }

    function testDepositRentMultipleTimes() public {
        uint256 amount1 = 3000 * 1e18;
        uint256 amount2 = 2000 * 1e18;
        
        vm.startPrank(tenant);
        usdc.approve(address(rentVault), amount1 + amount2);
        rentVault.depositRent(amount1);
        rentVault.depositRent(amount2);
        vm.stopPrank();

        assertEq(rentVault.rentCollected(), amount1 + amount2);
        assertEq(rentVault.getRentForPeriod(0), amount1 + amount2);
    }

    function testDepositRentFailsWithZeroAmount() public {
        vm.prank(tenant);
        vm.expectRevert("RentVault: amount must be greater than zero");
        rentVault.depositRent(0);
    }

    function testResetPeriod() public {
        uint256 amount = 5000 * 1e18;
        
        vm.startPrank(tenant);
        usdc.approve(address(rentVault), amount);
        rentVault.depositRent(amount);
        vm.stopPrank();

        vm.prank(owner);
        rentVault.resetPeriod();

        assertEq(rentVault.currentPeriod(), 1);
        assertEq(rentVault.getRentForPeriod(0), amount);
        assertEq(rentVault.getRentForPeriod(1), 0);
    }

    function testWithdraw() public {
        uint256 amount = 5000 * 1e18;
        
        vm.startPrank(tenant);
        usdc.approve(address(rentVault), amount);
        rentVault.depositRent(amount);
        vm.stopPrank();

        address recipient = address(3);
        vm.prank(owner);
        rentVault.withdraw(recipient, amount);

        assertEq(usdc.balanceOf(recipient), amount);
        assertEq(usdc.balanceOf(address(rentVault)), 0);
    }

    function testWithdrawFailsIfNotOwner() public {
        vm.prank(tenant);
        vm.expectRevert();
        rentVault.withdraw(tenant, 1000 * 1e18);
    }
}

