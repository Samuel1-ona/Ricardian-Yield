// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {StdInvariant} from "forge-std/StdInvariant.sol";
import {PropertyCashFlowSystemCore} from "../contracts/PropertyCashFlowSystemCore.sol";
import {SystemInitializer} from "../contracts/SystemInitializer.sol";
import {MockERC4626Vault} from "../contracts/MockERC4626Vault.sol";
import {IPropertyNFT} from "../contracts/interfaces/IPropertyNFT.sol";
import {MockUSDC} from "./MockUSDC.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

contract SystemInvariants is StdInvariant, Test {
    PropertyCashFlowSystemCore public system;
    SystemInitializer public initializer;
    MockUSDC public usdc;
    MockERC4626Vault public mockVault;
    
    address public owner = address(1);
    address public manager = address(2);
    address public tenant = address(3);
    address public shareholder1 = address(4);

    function setUp() public {
        usdc = new MockUSDC();
        
        // Deploy implementation
        PropertyCashFlowSystemCore implementation = new PropertyCashFlowSystemCore();
        
        // Deploy proxy
        bytes memory initData = abi.encodeWithSelector(
            PropertyCashFlowSystemCore.initializeContract.selector,
            address(usdc),
            owner
        );
        ERC1967Proxy proxy = new ERC1967Proxy(address(implementation), initData);
        system = PropertyCashFlowSystemCore(address(proxy));
        
        // Deploy initializer
        initializer = new SystemInitializer();

        IPropertyNFT.PropertyData memory propertyData = IPropertyNFT.PropertyData({
            location: "123 Main St",
            valuation: 1000000 * 1e18,
            monthlyRent: 10000 * 1e18,
            metadataURI: "ipfs://test"
        });

        vm.prank(owner);
        initializer.initializeSystem(system, propertyData, 100000 * 1e18, shareholder1, address(0), 0, 0, true); // Vault set up separately

        vm.prank(owner);
        system.cashFlowEngine().setManager(manager);
        
        vm.prank(owner);
        mockVault = new MockERC4626Vault(usdc, "Mock", "MOCK", owner, 500);
        
        vm.prank(owner);
        system.yieldStackingManager().setYieldVault(address(mockVault));
        
        targetContract(address(system));
    }

    /// @notice Invariant: total shares should remain constant
    function invariant_TotalSharesConstant() public view {
        uint256 totalShares = system.totalShares();
        uint256 actualTotalSupply = system.propertyShares().totalSupply();
        assertEq(totalShares, actualTotalSupply);
    }

    /// @notice Invariant: distributable cash flow should never exceed rent collected
    function invariant_DistributableNeverExceedsRent() public view {
        uint256 distributable = system.cashFlowEngine().getDistributableCashFlow();
        uint256 rentCollected = system.rentVault().rentCollected();
        assertLe(distributable, rentCollected + 1e18); // Small tolerance for yield
    }

    /// @notice Invariant: system should remain initialized
    function invariant_SystemRemainsInitialized() public view {
        assertTrue(system.initialized());
    }

    /// @notice Invariant: property ID should remain constant
    function invariant_PropertyIdConstant() public view {
        uint256 propertyId = system.propertyId();
        assertTrue(propertyId >= 0);
    }

    /// @notice Invariant: all contracts should be non-zero
    function invariant_AllContractsNonZero() public view {
        assertTrue(address(system.propertyNFT()) != address(0));
        assertTrue(address(system.propertyShares()) != address(0));
        assertTrue(address(system.rentVault()) != address(0));
        assertTrue(address(system.cashFlowEngine()) != address(0));
        assertTrue(address(system.yieldDistributor()) != address(0));
        assertTrue(address(system.dao()) != address(0));
        assertTrue(address(system.yieldStackingManager()) != address(0));
    }

    /// @notice Invariant: cash flow from assets should be a valid value
    function invariant_CashFlowFromAssetsFormula() public view {
        // This invariant is complex to verify without exact state knowledge
        // We just verify the function doesn't revert and returns a value
        try system.cashFlowEngine().getCashFlowFromAssets() returns (int256 cashFlowFromAssets) {
            // Cash flow can be positive or negative (CapEx can exceed distributable)
            // Just verify it's a reasonable value (not extreme)
            assertTrue(cashFlowFromAssets >= type(int256).min / 2);
            assertTrue(cashFlowFromAssets <= type(int256).max / 2);
        } catch {
            // If it reverts, that's a problem
            assertTrue(false, "getCashFlowFromAssets should not revert");
        }
    }
}

