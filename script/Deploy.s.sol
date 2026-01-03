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
import {MockUSDC} from "../test/MockUSDC.sol";
import {MockERC4626Vault} from "../contracts/MockERC4626Vault.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC4626} from "@openzeppelin/contracts/interfaces/IERC4626.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

/**
 * @title Deploy
 * @dev Deployment script for Mantle Sepolia testnet
 * 
 * Supports both real and mock contracts:
 * - If USDC_ADDRESS is set, uses real USDC (otherwise deploys MockUSDC)
 * - If ERC4626_VAULT_ADDRESS is set, uses real ERC-4626 vault (otherwise deploys MockERC4626Vault)
 * 
 * Environment variables:
 * - PRIVATE_KEY: Deployer private key
 * - USDC_ADDRESS (optional): Real USDC token address on Mantle Sepolia
 * - ERC4626_VAULT_ADDRESS (optional): Real ERC-4626 vault address
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
            
            // Verify it's a valid ERC-4626 vault
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
                500 // 5% APY initial yield rate
            );
            yieldVaultAddress = address(mockVault);
            console.log("MockERC4626Vault deployed at:", yieldVaultAddress);
        }

        // Step 3: Deploy the implementation contract
        console.log("Deploying PropertyCashFlowSystemCore implementation...");
        PropertyCashFlowSystemCore implementation = new PropertyCashFlowSystemCore();
        console.log("Implementation deployed at:", address(implementation));

        // Step 4: Deploy UUPS Proxy
        console.log("Deploying UUPS Proxy...");
        bytes memory initData = abi.encodeWithSelector(
            PropertyCashFlowSystemCore.initializeContract.selector,
            usdcAddress,
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
        // Deploy all sub-contracts
        PropertyNFT propertyNFT = new PropertyNFT(address(system));
        PropertyShares propertyShares = new PropertyShares(address(system));
        CashFlowEngine cashFlowEngine = new CashFlowEngine(address(system));
        RentVault rentVault = new RentVault(usdcAddress, address(system));
        YieldDistributor yieldDistributor = new YieldDistributor(address(system));
        SimpleDAO dao = new SimpleDAO(address(system));
        YieldStackingManager yieldStackingManager = new YieldStackingManager(
            usdcAddress,
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
            address(yieldDistributor),
            usdcAddress
        );

        // Configure yield stacking (through system contract)
        system.configureYieldStacking(
            yieldStackingManager,
            yieldVaultAddress,
            2000 * 1e18, // $2k reserve threshold
            1000 * 1e18, // $1k minimum deposit
            true // auto-deposit enabled
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

