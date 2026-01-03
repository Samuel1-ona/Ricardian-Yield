// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console} from "forge-std/Test.sol";
import {RentVault} from "../contracts/RentVault.sol";

contract RentVaultTest is Test {
    RentVault public rentVault;
    address public owner = address(1);
    address public tenant = address(2);

    function setUp() public {
        vm.deal(tenant, 100000 * 1e18); // Give tenant native MNT
        vm.prank(owner);
        rentVault = new RentVault(owner);
    }

    function testDepositRent() public {
        uint256 amount = 5000 * 1e18;
        
        vm.prank(tenant);
        rentVault.depositRent{value: amount}(amount);

        assertEq(rentVault.rentCollected(), amount);
        assertEq(rentVault.getRentForPeriod(0), amount);
        assertEq(address(rentVault).balance, amount);
    }

    function testDepositRentMultipleTimes() public {
        uint256 amount1 = 3000 * 1e18;
        uint256 amount2 = 2000 * 1e18;
        
        vm.startPrank(tenant);
        rentVault.depositRent{value: amount1}(amount1);
        rentVault.depositRent{value: amount2}(amount2);
        vm.stopPrank();

        assertEq(rentVault.rentCollected(), amount1 + amount2);
        assertEq(rentVault.getRentForPeriod(0), amount1 + amount2);
    }

    function testDepositRentFailsWithZeroAmount() public {
        vm.prank(tenant);
        vm.expectRevert("RentVault: amount must be greater than zero");
        rentVault.depositRent{value: 0}(0);
    }

    function testResetPeriod() public {
        uint256 amount = 5000 * 1e18;
        
        vm.startPrank(tenant);
        rentVault.depositRent{value: amount}(amount);
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
        rentVault.depositRent{value: amount}(amount);
        vm.stopPrank();

        address recipient = address(3);
        uint256 recipientBalanceBefore = recipient.balance;
        vm.prank(owner);
        rentVault.withdraw(recipient, amount);

        assertEq(recipient.balance, recipientBalanceBefore + amount);
        assertEq(address(rentVault).balance, 0);
    }

    function testWithdrawFailsIfNotOwner() public {
        vm.prank(tenant);
        vm.expectRevert();
        rentVault.withdraw(tenant, 1000 * 1e18);
    }
}

