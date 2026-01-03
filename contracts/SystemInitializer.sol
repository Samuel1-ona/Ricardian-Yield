// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./PropertyNFT.sol";
import "./PropertyShares.sol";
import "./RentVault.sol";
import "./CashFlowEngine.sol";
import "./YieldDistributor.sol";
import "./SimpleDAO.sol";
import "./YieldStackingManager.sol";
import "./interfaces/IPropertyNFT.sol";
import "./PropertyCashFlowSystemCore.sol";

/**
 * @title SystemInitializer
 * @dev Helper contract to initialize PropertyCashFlowSystem
 * This contract can be discarded after initialization to reduce main contract size
 */
contract SystemInitializer {
    /**
     * @dev Initialize the entire system with a new property
     * @param system The PropertyCashFlowSystemCore contract to initialize
     * @param propertyData Property metadata
     * @param _totalShares Total number of shares to mint
     * @param initialShareholder Address to receive all initial shares
     * @param yieldVaultAddress Optional ERC-4626 vault address (can be set later)
     * @param reserveThreshold Minimum reserve to keep in RentVault (0 = use default)
     * @param minimumDeposit Minimum amount to deposit (0 = use default)
     * @param autoDepositEnabled Whether auto-deposit is enabled
     */
    function initializeSystem(
        PropertyCashFlowSystemCore system,
        IPropertyNFT.PropertyData calldata propertyData,
        uint256 _totalShares,
        address initialShareholder,
        address yieldVaultAddress,
        uint256 reserveThreshold,
        uint256 minimumDeposit,
        bool autoDepositEnabled
    ) external {
        require(!system.initialized(), "SystemInitializer: already initialized");
        require(_totalShares > 0, "SystemInitializer: total shares must be greater than zero");
        require(initialShareholder != address(0), "SystemInitializer: invalid shareholder");

        // Deploy all contracts (using native MNT, no USDC needed)
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

        // Mint property NFT to owner (through system contract)
        uint256 propertyId = system.mintPropertyNFT(propertyNFT, propertyData);

        // Initialize property shares (through system contract)
        system.initializePropertyShares(propertyShares, address(propertyNFT), propertyId, _totalShares, initialShareholder);

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
        
        // Configure yield vault and parameters (through system contract)
        system.configureYieldStacking(
            yieldStackingManager,
            yieldVaultAddress,
            reserveThreshold,
            minimumDeposit,
            autoDepositEnabled
        );

        // Set all addresses in the system contract
        system.setContracts(
            propertyNFT,
            propertyShares,
            rentVault,
            cashFlowEngine,
            yieldDistributor,
            dao,
            yieldStackingManager,
            propertyId,
            _totalShares
        );
    }
}

