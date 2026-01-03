// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {PropertyCashFlowSystem} from "../contracts/PropertyCashFlowSystem.sol";
import {IPropertyNFT} from "../contracts/interfaces/IPropertyNFT.sol";
import {MockUSDC} from "../test/MockUSDC.sol";
import {MockERC4626Vault} from "../contracts/MockERC4626Vault.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC4626} from "@openzeppelin/contracts/interfaces/IERC4626.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

/**
 * @title DeployProxy
 * @dev Deploy the proxy pointing to an existing implementation
 * Set IMPLEMENTATION_ADDRESS environment variable to the deployed implementation
 */
contract DeployProxy is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        vm.startBroadcast(deployerPrivateKey);

        // Get implementation address
        address implementationAddress = vm.envAddress("IMPLEMENTATION_ADDRESS");
        console.log("Using implementation at:", implementationAddress);

        // Step 1: Get or deploy USDC
        address usdcAddress;
        bool usingRealUSDC = false;
        try vm.envAddress("USDC_ADDRESS") returns (address existingUSDC) {
            usdcAddress = existingUSDC;
            usingRealUSDC = true;
            console.log("Using REAL USDC at:", usdcAddress);
        } catch {
            console.log("USDC_ADDRESS not set, deploying MockUSDC...");
            MockUSDC mockUSDC = new MockUSDC();
            usdcAddress = address(mockUSDC);
            console.log("MockUSDC deployed at:", usdcAddress);
        }

        // Step 2: Get or deploy ERC-4626 Vault
        address yieldVaultAddress;
        bool usingRealVault = false;
        try vm.envAddress("ERC4626_VAULT_ADDRESS") returns (address existingVault) {
            yieldVaultAddress = existingVault;
            usingRealVault = true;
            console.log("Using REAL ERC-4626 Vault at:", yieldVaultAddress);
            IERC4626 vault = IERC4626(yieldVaultAddress);
            require(vault.asset() == usdcAddress, "Vault asset must match USDC address");
            console.log("Vault verified - asset matches USDC");
        } catch {
            console.log("ERC4626_VAULT_ADDRESS not set, deploying MockERC4626Vault...");
            MockERC4626Vault mockVault = new MockERC4626Vault(
                IERC20(usdcAddress),
                "Ricardian Yield Vault",
                "RYV",
                deployer,
                500
            );
            yieldVaultAddress = address(mockVault);
            console.log("MockERC4626Vault deployed at:", yieldVaultAddress);
        }

        // Step 3: Deploy UUPS Proxy
        console.log("Deploying UUPS Proxy...");
        bytes memory initData = abi.encodeWithSelector(
            PropertyCashFlowSystem.initializeContract.selector,
            usdcAddress,
            deployer
        );
        ERC1967Proxy proxy = new ERC1967Proxy(implementationAddress, initData);
        PropertyCashFlowSystem system = PropertyCashFlowSystem(payable(address(proxy)));
        console.log("Proxy deployed at:", address(proxy));
        console.log("Use this address as the system address:", address(proxy));

        // Step 4: Initialize with a sample property
        IPropertyNFT.PropertyData memory propertyData = IPropertyNFT.PropertyData({
            location: "123 Main St, San Francisco, CA 94102",
            valuation: 2000000 * 1e18,
            monthlyRent: 10000 * 1e18,
            metadataURI: "ipfs://QmSamplePropertyMetadata"
        });

        address initialShareholder = deployer;
        uint256 totalShares = 1000000 * 1e18;

        console.log("Initializing system...");
        // Note: DeployProxy.s.sol needs to be updated to use SystemInitializer
        // For now, this script is deprecated - use Deploy.s.sol instead
        revert("DeployProxy.s.sol is deprecated - use Deploy.s.sol with SystemInitializer");

        console.log("System initialized with property ID:", system.propertyId());
        console.log("Total shares:", totalShares);

        // Step 5: Configure yield stacking
        console.log("Configuring yield stacking...");
        system.yieldStackingManager().setYieldVault(yieldVaultAddress);
        system.yieldStackingManager().setReserveThreshold(2000 * 1e18);
        system.yieldStackingManager().setMinimumDepositAmount(1000 * 1e18);
        system.yieldStackingManager().setAutoDepositEnabled(true);
        console.log("Yield stacking configured");

        // Step 6: Get all contract addresses (via public state variables)

        console.log("\n=== Deployment Summary ===");
        console.log("USDC Token:", usdcAddress);
        if (usingRealUSDC) {
            console.log("  -> Using REAL USDC");
        } else {
            console.log("  -> Using MockUSDC (for testing)");
        }
        console.log("Yield Vault:", yieldVaultAddress);
        if (usingRealVault) {
            console.log("  -> Using REAL ERC-4626 Vault");
        } else {
            console.log("  -> Using MockERC4626Vault (for testing)");
        }
        console.log("PropertyCashFlowSystem (Proxy):", address(system));
        console.log("  -> This is the address to use for all interactions");
        console.log("Implementation:", implementationAddress);
        console.log("PropertyNFT:", address(system.propertyNFT()));
        console.log("PropertyShares:", address(system.propertyShares()));
        console.log("RentVault:", address(system.rentVault()));
        console.log("CashFlowEngine:", address(system.cashFlowEngine()));
        console.log("YieldDistributor:", address(system.yieldDistributor()));
        console.log("DAO:", address(system.dao()));
        console.log("YieldStackingManager:", address(system.yieldStackingManager()));
        console.log("Property ID:", system.propertyId());
        console.log("========================\n");

        vm.stopBroadcast();
    }
}

