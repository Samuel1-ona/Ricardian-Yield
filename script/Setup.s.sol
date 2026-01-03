// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {PropertyCashFlowSystem} from "../contracts/PropertyCashFlowSystem.sol";

/**
 * @title Setup
 * @dev Setup script to configure roles and initial state
 */
contract Setup is Script {
    function run() external {
        address systemAddress = vm.envAddress("SYSTEM_ADDRESS");
        address managerAddress = vm.envAddress("MANAGER_ADDRESS"); // Optional: set manager
        
        PropertyCashFlowSystem system = PropertyCashFlowSystem(systemAddress);

        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // Set manager if provided
        if (managerAddress != address(0)) {
            system.setManager(managerAddress);
            console.log("Manager set to:", managerAddress);
        }

        console.log("Setup complete!");
        console.log("System address:", systemAddress);
        console.log("Owner:", system.owner());

        vm.stopBroadcast();
    }
}

