// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console} from "forge-std/Test.sol";
import {PropertyCashFlowSystem} from "../contracts/PropertyCashFlowSystem.sol";
import {PropertyShares} from "../contracts/PropertyShares.sol";
import {YieldDistributor} from "../contracts/YieldDistributor.sol";
import {MockERC4626Vault} from "../contracts/MockERC4626Vault.sol";
import {IPropertyNFT} from "../contracts/interfaces/IPropertyNFT.sol";
import {MockUSDC} from "./MockUSDC.sol";

contract IntegrationTest is Test {
    PropertyCashFlowSystem public system;
    MockUSDC public usdc;
    
    address public owner = address(1);
    address public manager = address(2);
    address public tenant = address(3);
    address public shareholder1 = address(4);
    address public shareholder2 = address(5);
    
    MockERC4626Vault public mockVault;

    function setUp() public {
        usdc = new MockUSDC();
        
        vm.prank(owner);
        system = new PropertyCashFlowSystem(address(usdc), owner);

        // Initialize system with property
        IPropertyNFT.PropertyData memory propertyData = IPropertyNFT.PropertyData({
            location: "123 Main St, San Francisco, CA",
            valuation: 1000000 * 1e18,
            monthlyRent: 10000 * 1e18,
            metadataURI: "ipfs://QmProperty123"
        });

        vm.prank(owner);
        system.initialize(propertyData, 100000 * 1e18, shareholder1);

        // Set manager
        vm.prank(owner);
        system.setManager(manager);

        // Give tenant USDC
        usdc.mint(tenant, 100000 * 1e18);
    }

    function testCompleteCashFlowCycle() public {
        // Step 1: Tenant deposits rent
        uint256 rentAmount = 10000 * 1e18;
        vm.startPrank(tenant);
        usdc.approve(address(system.rentVault()), rentAmount);
        system.rentVault().depositRent(rentAmount);
        vm.stopPrank();

        // Step 2: Manager records operating expenses
        uint256 expenses = 3000 * 1e18;
        vm.prank(manager);
        system.recordOperatingExpense(expenses);

        // Step 3: Manager allocates working capital reserve
        uint256 reserve = 1000 * 1e18;
        vm.prank(manager);
        system.recordOperatingExpense(reserve); // Simplified: treating reserve as expense for this test

        // Step 4: Check distributable cash flow
        uint256 distributable = system.getDistributableCashFlow();
        assertGt(distributable, 0, "Should have distributable cash flow");

        // Step 5: Distribute yield
        vm.prank(owner);
        system.distributeYield();

        // Step 6: Shareholder claims yield
        uint256 shareholder1Balance = system.propertyShares().balanceOf(shareholder1);
        uint256 expectedYield = (distributable * shareholder1Balance) / system.propertyShares().totalSupply();
        
        // Get yield distributor address and call directly (not through system contract)
        address yieldDistributorAddr = address(system.yieldDistributor());
        vm.prank(shareholder1);
        YieldDistributor(yieldDistributorAddr).claimYield(0);

        assertEq(usdc.balanceOf(shareholder1), expectedYield, "Shareholder should receive yield");
    }

    function testCapExWorkflow() public {
        // Deposit rent
        uint256 rentAmount = 10000 * 1e18;
        vm.startPrank(tenant);
        usdc.approve(address(system.rentVault()), rentAmount);
        system.rentVault().depositRent(rentAmount);
        vm.stopPrank();

        // Create CapEx proposal
        uint256 capexAmount = 5000 * 1e18;
        vm.prank(owner);
        uint256 proposalId = system.createCapExProposal(capexAmount, "Property renovation");

        // Approve proposal
        vm.prank(owner);
        system.approveCapExProposal(proposalId);

        // Record some expenses first to make the calculation clearer
        vm.prank(manager);
        system.recordOperatingExpense(2000 * 1e18);
        
        // Record CapEx
        vm.prank(owner);
        system.recordCapEx(capexAmount, proposalId);

        // Check cash flow from assets
        // Formula: distributable + capexChange + workingCapitalChange
        // distributable = rent (10000) - expenses (2000) = 8000
        // capexChange = -5000 (negative because CapEx is spent)
        // workingCapitalChange = 0
        // cashFlowFromAssets = 8000 + (-5000) + 0 = 3000 (positive)
        // To get negative, we need CapEx > distributable, or add more expenses
        // Let's add more expenses to make it negative
        vm.prank(manager);
        system.recordOperatingExpense(4000 * 1e18); // Total expenses now 6000
        
        // Now: distributable = 10000 - 6000 = 4000
        // cashFlowFromAssets = 4000 + (-5000) = -1000 (negative!)
        int256 cashFlowFromAssets = system.getCashFlowFromAssets();
        assertLt(cashFlowFromAssets, 0, "Cash flow should be negative with CapEx exceeding distributable");
    }

    function testMultipleShareholders() public {
        // Verify shareholder1 has shares from initialization
        uint256 shareholder1InitialBalance = system.propertyShares().balanceOf(shareholder1);
        require(shareholder1InitialBalance >= 30000 * 1e18, "Shareholder1 needs at least 30000 shares");
        
        // Transfer some shares to shareholder2
        // Get the propertyShares contract and call transfer directly
        PropertyShares shares = system.propertyShares();
        vm.prank(shareholder1);
        shares.transfer(shareholder2, 30000 * 1e18);
        
        // Verify transfer succeeded
        assertEq(system.propertyShares().balanceOf(shareholder2), 30000 * 1e18, "Shareholder2 should have 30000 shares");

        // Deposit rent
        uint256 rentAmount = 10000 * 1e18;
        vm.startPrank(tenant);
        usdc.approve(address(system.rentVault()), rentAmount);
        system.rentVault().depositRent(rentAmount);
        vm.stopPrank();

        // Distribute yield
        vm.prank(owner);
        system.distributeYield();

        // Both shareholders claim (call yield distributor directly, not through system)
        address yieldDistributorAddr = address(system.yieldDistributor());
        vm.prank(shareholder1);
        YieldDistributor(yieldDistributorAddr).claimYield(0);

        vm.prank(shareholder2);
        YieldDistributor(yieldDistributorAddr).claimYield(0);

        uint256 totalDistributed = usdc.balanceOf(shareholder1) + usdc.balanceOf(shareholder2);
        uint256 distributable = system.getDistributableCashFlow();
        
        // Allow for rounding differences
        assertApproxEqAbs(totalDistributed, distributable, 1, "Total distributed should equal distributable");
    }

    function testPeriodReset() public {
        // Deposit rent and record expenses
        uint256 rentAmount = 10000 * 1e18;
        vm.startPrank(tenant);
        usdc.approve(address(system.rentVault()), rentAmount);
        system.rentVault().depositRent(rentAmount);
        vm.stopPrank();

        vm.prank(manager);
        system.recordOperatingExpense(2000 * 1e18);

        // Reset period
        vm.prank(owner);
        system.resetPeriod();

        // Check that expenses are reset
        assertEq(system.cashFlowEngine().operatingExpenses(), 0, "Expenses should be reset");
    }

    function testGetPropertyData() public {
        IPropertyNFT.PropertyData memory data = system.getPropertyData();
        assertEq(data.location, "123 Main St, San Francisco, CA");
        assertEq(data.valuation, 1000000 * 1e18);
        assertEq(data.monthlyRent, 10000 * 1e18);
    }

    function testGetContracts() public {
        (
            address propertyNFT,
            address propertyShares,
            address rentVault,
            address cashFlowEngine,
            address yieldDistributor,
            address dao,
            address yieldStackingManager
        ) = system.getContracts();

        assertTrue(propertyNFT != address(0));
        assertTrue(propertyShares != address(0));
        assertTrue(rentVault != address(0));
        assertTrue(cashFlowEngine != address(0));
        assertTrue(yieldDistributor != address(0));
        assertTrue(dao != address(0));
    }
}

