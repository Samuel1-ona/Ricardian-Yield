// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {PropertyCashFlowSystem} from "../contracts/PropertyCashFlowSystem.sol";
import {IPropertyNFT} from "../contracts/interfaces/IPropertyNFT.sol";

/**
 * @title Deploy
 * @dev Deployment script for Mantle testnet
 */
contract Deploy is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address usdcAddress = vm.envAddress("USDC_ADDRESS"); // Mantle testnet USDC
        
        vm.startBroadcast(deployerPrivateKey);

        // Deploy the main system contract
        PropertyCashFlowSystem system = new PropertyCashFlowSystem(
            usdcAddress,
            msg.sender // Initial owner
        );

        console.log("PropertyCashFlowSystem deployed at:", address(system));

        // Initialize with a sample property
        IPropertyNFT.PropertyData memory propertyData = IPropertyNFT.PropertyData({
            location: "123 Main St, San Francisco, CA 94102",
            valuation: 2000000 * 1e18, // $2M property
            monthlyRent: 10000 * 1e18, // $10k/month rent
            metadataURI: "ipfs://QmSamplePropertyMetadata"
        });

        address initialShareholder = msg.sender; // Deployer gets all initial shares
        uint256 totalShares = 1000000 * 1e18; // 1M shares

        system.initialize(propertyData, totalShares, initialShareholder);

        console.log("System initialized with property ID:", system.propertyId());
        console.log("Total shares:", totalShares);

        // Get all contract addresses
        (
            address propertyNFT,
            address propertyShares,
            address rentVault,
            address cashFlowEngine,
            address yieldDistributor,
            address dao,
            address yieldStackingManager
        ) = system.getContracts();

        console.log("PropertyNFT:", propertyNFT);
        console.log("PropertyShares:", propertyShares);
        console.log("RentVault:", rentVault);
        console.log("CashFlowEngine:", cashFlowEngine);
        console.log("YieldDistributor:", yieldDistributor);
        console.log("DAO:", dao);

        vm.stopBroadcast();
    }
}

