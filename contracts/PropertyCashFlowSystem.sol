// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "./PropertyNFT.sol";
import "./PropertyShares.sol";
import "./RentVault.sol";
import "./CashFlowEngine.sol";
import "./YieldDistributor.sol";
import "./SimpleDAO.sol";
import "./YieldStackingManager.sol";
import "./interfaces/IPropertyNFT.sol";

/**
 * @title PropertyCashFlowSystem
 * @dev Integration contract that ties all components together
 * Manages initialization and provides convenient access to the entire system
 * Uses UUPS proxy pattern for upgradeability
 */
contract PropertyCashFlowSystem is UUPSUpgradeable, OwnableUpgradeable {
    PropertyNFT public propertyNFT;
    PropertyShares public propertyShares;
    RentVault public rentVault;
    CashFlowEngine public cashFlowEngine;
    YieldDistributor public yieldDistributor;
    SimpleDAO public dao;
    YieldStackingManager public yieldStackingManager;

    // Property configuration
    uint256 public propertyId;
    uint256 public totalShares;

    bool public initialized;

    event SystemInitialized(
        uint256 indexed propertyId,
        address propertyNFT,
        address propertyShares,
        address rentVault,
        address cashFlowEngine,
        address yieldDistributor,
        address dao
    );

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @dev Initialize the contract (replaces constructor for upgradeable contracts)
     * @param initialOwner Initial owner address
     */
    function initializeContract(address initialOwner) external initializer {
        __Ownable_init(initialOwner);
    }

    /**
     * @dev Initialize the entire system with a new property
     * @param propertyData Property metadata
     * @param _totalShares Total number of shares to mint
     * @param initialShareholder Address to receive all initial shares
     * @param yieldVaultAddress Optional ERC-4626 vault address (can be set later)
     * @param reserveThreshold Minimum reserve to keep in RentVault (0 = use default)
     * @param minimumDeposit Minimum amount to deposit (0 = use default)
     * @param autoDepositEnabled Whether auto-deposit is enabled
     */
    function initialize(
        IPropertyNFT.PropertyData calldata propertyData,
        uint256 _totalShares,
        address initialShareholder,
        address yieldVaultAddress,
        uint256 reserveThreshold,
        uint256 minimumDeposit,
        bool autoDepositEnabled
    ) external onlyOwner {
        require(!initialized, "PropertyCashFlowSystem: already initialized");
        require(_totalShares > 0, "PropertyCashFlowSystem: total shares must be greater than zero");
        require(initialShareholder != address(0), "PropertyCashFlowSystem: invalid shareholder");

        // Deploy all contracts
        propertyNFT = new PropertyNFT(address(this));
        propertyShares = new PropertyShares(address(this));
        cashFlowEngine = new CashFlowEngine(address(this));
        // Create rentVault with this contract as owner initially (we'll transfer ownership if needed)
        rentVault = new RentVault(address(this));
        yieldDistributor = new YieldDistributor(address(this));
        dao = new SimpleDAO(address(this));
        yieldStackingManager = new YieldStackingManager(address(rentVault), address(this));

        // Mint property NFT to owner (system contract doesn't need to hold it)
        propertyId = propertyNFT.mintProperty(owner(), propertyData);

        // Initialize property shares
        propertyShares.initialize(address(propertyNFT), propertyId, _totalShares, initialShareholder);
        totalShares = _totalShares;

        // Link contracts
        cashFlowEngine.setRentVault(address(rentVault));
        cashFlowEngine.setDAO(address(dao));
        cashFlowEngine.setYieldStackingManager(address(yieldStackingManager));
        dao.setCashFlowEngine(address(cashFlowEngine));
        yieldDistributor.initialize(
            address(propertyShares),
            address(cashFlowEngine),
            address(rentVault)
        );
        // Authorize yield distributor to withdraw from rent vault
        rentVault.setYieldDistributor(address(yieldDistributor));
        // Set yield stacking manager in rent vault for auto-deposit
        rentVault.setYieldStackingManager(address(yieldStackingManager));
        // Set cash flow engine in yield stacking manager
        yieldStackingManager.setCashFlowEngine(address(cashFlowEngine));
        
        // Configure yield vault and parameters if provided
        if (yieldVaultAddress != address(0)) {
            yieldStackingManager.setYieldVault(yieldVaultAddress);
        }
        if (reserveThreshold > 0) {
            yieldStackingManager.setReserveThreshold(reserveThreshold);
        }
        if (minimumDeposit > 0) {
            yieldStackingManager.setMinimumDepositAmount(minimumDeposit);
        }
        yieldStackingManager.setAutoDepositEnabled(autoDepositEnabled);

        initialized = true;

        emit SystemInitialized(
            propertyId,
            address(propertyNFT),
            address(propertyShares),
            address(rentVault),
            address(cashFlowEngine),
            address(yieldDistributor),
            address(dao)
        );
    }

    // Note: View and convenience functions removed to reduce contract size.
    // Access sub-contracts via public state variables (propertyNFT, propertyShares, etc.)
    // These functions can be added back in a future upgrade if needed.

    /**
     * @dev Required by UUPSUpgradeable - authorizes upgrades
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}

