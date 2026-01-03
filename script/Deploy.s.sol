// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {PropertyCashFlowSystemCore} from "../contracts/PropertyCashFlowSystemCore.sol";
import {PropertyNFT} from "../contracts/PropertyNFT.sol";
import {PropertyShares} from "../contracts/PropertyShares.sol";
import {CashFlowEngine} from "../contracts/CashFlowEngine.sol";
import {RentVault} from "../contracts/RentVault.sol";
import {YieldDistributor} from "../contracts/YieldDistributor.sol";
import {SimpleDAO} from "../contracts/SimpleDAO.sol";
import {YieldStackingManager} from "../contracts/YieldStackingManager.sol";
import {IPropertyNFT} from "../contracts/interfaces/IPropertyNFT.sol";
// Removed USDC and ERC-4626 imports - using native MNT for MVP
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

/**
 * @title Deploy
 * @dev Deployment script for Mantle Sepolia testnet
 * 
 * Uses native MNT (Mantle native token) instead of USDC
 * Yield stacking is disabled for MVP (ERC-4626 requires ERC20 tokens, not native tokens)
 * 
 * Environment variables:
 * - PRIVATE_KEY: Deployer private key
 */
contract Deploy is Script {
    function run() external {
        // Try to get private key from env, otherwise use msg.sender (when using --private-key flag)
        uint256 deployerPrivateKey;
        try vm.envUint("PRIVATE_KEY") returns (uint256 key) {
            deployerPrivateKey = key;
        } catch {
            // If PRIVATE_KEY not in env, use the broadcast sender (set via --private-key flag)
            deployerPrivateKey = uint256(vm.envUint("PRIVATE_KEY"));
        }
        address deployer = vm.addr(deployerPrivateKey);
        
        vm.startBroadcast(deployerPrivateKey);

        // Note: For MVP, we're using native MNT instead of USDC
        // Yield stacking is disabled by default (ERC-4626 requires ERC20 tokens, not native tokens)
        address yieldVaultAddress = address(0); // Disabled for MVP
        console.log("Using native MNT - yield stacking disabled for MVP");

        // Step 3: Deploy the implementation contract
        console.log("Deploying PropertyCashFlowSystemCore implementation...");
        PropertyCashFlowSystemCore implementation = new PropertyCashFlowSystemCore();
        console.log("Implementation deployed at:", address(implementation));

        // Step 4: Deploy UUPS Proxy
        console.log("Deploying UUPS Proxy...");
        bytes memory initData = abi.encodeWithSelector(
            PropertyCashFlowSystemCore.initializeContract.selector,
            deployer
        );
        ERC1967Proxy proxy = new ERC1967Proxy(address(implementation), initData);
        PropertyCashFlowSystemCore system = PropertyCashFlowSystemCore(payable(address(proxy)));
        console.log("Proxy deployed at:", address(proxy));
        console.log("Use this address as the system address:", address(proxy));
        
        // Step 5: Deploy all sub-contracts and initialize system
        IPropertyNFT.PropertyData memory propertyData = IPropertyNFT.PropertyData({
            location: "123 Main St, San Francisco, CA 94102",
            valuation: 2000000 * 1e18, // $2M property
            monthlyRent: 10000 * 1e18, // $10k/month rent
            metadataURI: "ipfs://QmSamplePropertyMetadata"
        });

        address initialShareholder = deployer; // Deployer gets all initial shares
        uint256 totalShares = 1000000 * 1e18; // 1M shares

        console.log("Deploying sub-contracts...");
        // Deploy all sub-contracts (using native MNT, no USDC needed)
        PropertyNFT propertyNFT = new PropertyNFT(address(system));
        PropertyShares propertyShares = new PropertyShares(address(system));
        CashFlowEngine cashFlowEngine = new CashFlowEngine(address(system));
        RentVault rentVault = new RentVault(address(system));
        YieldDistributor yieldDistributor = new YieldDistributor(address(system));
        SimpleDAO dao = new SimpleDAO(address(system));
        YieldStackingManager yieldStackingManager = new YieldStackingManager(
            address(rentVault),
            address(system)
        );

        console.log("Initializing system...");
        // Mint property NFT (through system contract)
        uint256 propertyId = system.mintPropertyNFT(propertyNFT, propertyData);

        // Initialize property shares (through system contract)
        system.initializePropertyShares(propertyShares, address(propertyNFT), propertyId, totalShares, initialShareholder);

        // Link contracts (through system contract)
        system.linkContracts(
            cashFlowEngine,
            rentVault,
            dao,
            yieldDistributor,
            yieldStackingManager,
            address(propertyShares),
            address(cashFlowEngine),
            address(rentVault),
            address(yieldDistributor)
        );

        // Configure yield stacking (through system contract)
        // For MVP: Yield stacking disabled (native MNT not compatible with ERC-4626)
        system.configureYieldStacking(
            yieldStackingManager,
            address(0), // No vault (disabled for MVP)
            2000 * 1e18, // 2000 MNT reserve threshold
            1000 * 1e18, // 1000 MNT minimum deposit
            false // auto-deposit disabled for MVP
        );

        // Set all contract addresses
        system.setContracts(
            propertyNFT,
            propertyShares,
            rentVault,
            cashFlowEngine,
            yieldDistributor,
            dao,
            yieldStackingManager,
            propertyId,
            totalShares
        );

        console.log("System initialized with property ID:", system.propertyId());
        console.log("Total shares:", totalShares);
        console.log("Yield stacking configured");

        // Step 7: Get all contract addresses (via public state variables)

        console.log("\n=== Deployment Summary ===");
        console.log("Native Token: MNT (Mantle native token)");
        console.log("Yield Vault: Disabled (native MNT not compatible with ERC-4626)");
        console.log("PropertyCashFlowSystem (Proxy):", address(system));
        console.log("  -> This is the address to use for all interactions");
        console.log("Implementation:", address(implementation));
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

