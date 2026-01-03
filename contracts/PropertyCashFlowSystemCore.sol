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
 * @title PropertyCashFlowSystemCore
 * @dev Minimal core contract that holds state and provides upgradeability
 * Initialization is handled by SystemInitializer contract
 * Uses UUPS proxy pattern for upgradeability
 */
contract PropertyCashFlowSystemCore is UUPSUpgradeable, OwnableUpgradeable {
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
     * @dev Mint property NFT (called by SystemInitializer before setContracts)
     * @param _propertyNFT PropertyNFT address
     * @param propertyData Property data
     * @return propertyId The minted property ID
     */
    function mintPropertyNFT(
        PropertyNFT _propertyNFT,
        IPropertyNFT.PropertyData calldata propertyData
    ) external returns (uint256) {
        require(!initialized, "PropertyCashFlowSystemCore: already initialized");
        // Allow any caller during initialization (SystemInitializer)
        return _propertyNFT.mintProperty(owner(), propertyData);
    }

    /**
     * @dev Initialize property shares (called by SystemInitializer)
     * @param _propertyShares PropertyShares address
     * @param _propertyNFT PropertyNFT address
     * @param _propertyId Property ID
     * @param _totalShares Total shares
     * @param initialShareholder Initial shareholder
     */
    function initializePropertyShares(
        PropertyShares _propertyShares,
        address _propertyNFT,
        uint256 _propertyId,
        uint256 _totalShares,
        address initialShareholder
    ) external {
        require(!initialized, "PropertyCashFlowSystemCore: already initialized");
        // Allow any caller during initialization (SystemInitializer)
        _propertyShares.initialize(_propertyNFT, _propertyId, _totalShares, initialShareholder);
    }

    /**
     * @dev Link contracts during initialization (called by SystemInitializer)
     */
    function linkContracts(
        CashFlowEngine _cashFlowEngine,
        RentVault _rentVault,
        SimpleDAO _dao,
        YieldDistributor _yieldDistributor,
        YieldStackingManager _yieldStackingManager,
        address _propertyShares,
        address _cashFlowEngineAddr,
        address _rentVaultAddr,
        address _yieldDistributorAddr
    ) external {
        require(!initialized, "PropertyCashFlowSystemCore: already initialized");
        // Allow any caller during initialization (SystemInitializer)
        _cashFlowEngine.setRentVault(_rentVaultAddr);
        _cashFlowEngine.setDAO(address(_dao));
        _cashFlowEngine.setYieldStackingManager(address(_yieldStackingManager));
        _dao.setCashFlowEngine(_cashFlowEngineAddr);
        _yieldDistributor.initialize(_propertyShares, _cashFlowEngineAddr, _rentVaultAddr);
        _rentVault.setYieldDistributor(_yieldDistributorAddr);
        _rentVault.setYieldStackingManager(address(_yieldStackingManager));
        _yieldStackingManager.setCashFlowEngine(_cashFlowEngineAddr);
    }

    /**
     * @dev Configure yield stacking (called by SystemInitializer)
     */
    function configureYieldStacking(
        YieldStackingManager _yieldStackingManager,
        address yieldVaultAddress,
        uint256 reserveThreshold,
        uint256 minimumDeposit,
        bool autoDepositEnabled
    ) external {
        require(!initialized, "PropertyCashFlowSystemCore: already initialized");
        // Allow any caller during initialization (SystemInitializer)
        if (yieldVaultAddress != address(0)) {
            _yieldStackingManager.setYieldVault(yieldVaultAddress);
        }
        if (reserveThreshold > 0) {
            _yieldStackingManager.setReserveThreshold(reserveThreshold);
        }
        if (minimumDeposit > 0) {
            _yieldStackingManager.setMinimumDepositAmount(minimumDeposit);
        }
        _yieldStackingManager.setAutoDepositEnabled(autoDepositEnabled);
    }

    /**
     * @dev Set all contract addresses (called by SystemInitializer)
     * Can be called by owner or by the SystemInitializer contract
     * @param _propertyNFT PropertyNFT address
     * @param _propertyShares PropertyShares address
     * @param _rentVault RentVault address
     * @param _cashFlowEngine CashFlowEngine address
     * @param _yieldDistributor YieldDistributor address
     * @param _dao SimpleDAO address
     * @param _yieldStackingManager YieldStackingManager address
     * @param _propertyId Property ID
     * @param _totalShares Total shares
     */
    function setContracts(
        PropertyNFT _propertyNFT,
        PropertyShares _propertyShares,
        RentVault _rentVault,
        CashFlowEngine _cashFlowEngine,
        YieldDistributor _yieldDistributor,
        SimpleDAO _dao,
        YieldStackingManager _yieldStackingManager,
        uint256 _propertyId,
        uint256 _totalShares
    ) external {
        require(!initialized, "PropertyCashFlowSystemCore: already initialized");
        // Allow owner or any caller during initialization (SystemInitializer)
        // This is safe because initialized flag prevents re-initialization
        
        propertyNFT = _propertyNFT;
        propertyShares = _propertyShares;
        rentVault = _rentVault;
        cashFlowEngine = _cashFlowEngine;
        yieldDistributor = _yieldDistributor;
        dao = _dao;
        yieldStackingManager = _yieldStackingManager;
        propertyId = _propertyId;
        totalShares = _totalShares;
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

    /**
     * @dev Required by UUPSUpgradeable - authorizes upgrades
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}

