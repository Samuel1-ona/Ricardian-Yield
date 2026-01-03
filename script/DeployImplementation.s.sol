// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {PropertyCashFlowSystem} from "../contracts/PropertyCashFlowSystem.sol";

/**
 * @title DeployImplementation
 * @dev Deploy the implementation contract separately
 * This allows bypassing size limits since only the proxy needs to be small
 */
contract DeployImplementation is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        console.log("Deploying PropertyCashFlowSystem implementation...");
        PropertyCashFlowSystem implementation = new PropertyCashFlowSystem();
        console.log("Implementation deployed at:", address(implementation));
        console.log("\nSave this address for proxy deployment!");

        vm.stopBroadcast();
    }
}

