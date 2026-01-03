// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
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
 */
contract PropertyCashFlowSystem is Ownable {
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
    address public usdc;

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

    constructor(address _usdc, address initialOwner) Ownable(initialOwner) {
        require(_usdc != address(0), "PropertyCashFlowSystem: invalid USDC address");
        usdc = _usdc;
    }

    /**
     * @dev Initialize the entire system with a new property
     * @param propertyData Property metadata
     * @param _totalShares Total number of shares to mint
     * @param initialShareholder Address to receive all initial shares
     */
    function initialize(
        IPropertyNFT.PropertyData calldata propertyData,
        uint256 _totalShares,
        address initialShareholder
    ) external onlyOwner {
        require(!initialized, "PropertyCashFlowSystem: already initialized");
        require(_totalShares > 0, "PropertyCashFlowSystem: total shares must be greater than zero");
        require(initialShareholder != address(0), "PropertyCashFlowSystem: invalid shareholder");

        // Deploy all contracts
        propertyNFT = new PropertyNFT(address(this));
        propertyShares = new PropertyShares(address(this));
        cashFlowEngine = new CashFlowEngine(address(this));
        // Create rentVault with this contract as owner initially (we'll transfer ownership if needed)
        rentVault = new RentVault(usdc, address(this));
        yieldDistributor = new YieldDistributor(address(this));
        dao = new SimpleDAO(address(this));
        yieldStackingManager = new YieldStackingManager(usdc, address(rentVault), address(this));

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
            address(rentVault),
            usdc
        );
        // Authorize yield distributor to withdraw from rent vault
        rentVault.setYieldDistributor(address(yieldDistributor));
        // Set yield stacking manager in rent vault for auto-deposit
        rentVault.setYieldStackingManager(address(yieldStackingManager));
        // Set cash flow engine in yield stacking manager
        yieldStackingManager.setCashFlowEngine(address(cashFlowEngine));

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
     * @dev Set the ERC-4626 vault address for yield stacking
     * @param vaultAddress Address of the ERC-4626 vault
     */
    function setYieldVault(address vaultAddress) external onlyOwner {
        yieldStackingManager.setYieldVault(vaultAddress);
    }

    /**
     * @dev Configure yield stacking parameters
     * @param reserveThreshold Minimum reserve to keep in RentVault
     * @param minimumDeposit Minimum amount to deposit (gas efficiency)
     */
    function configureYieldStacking(
        uint256 reserveThreshold,
        uint256 minimumDeposit
    ) external onlyOwner {
        yieldStackingManager.setReserveThreshold(reserveThreshold);
        yieldStackingManager.setMinimumDepositAmount(minimumDeposit);
    }

    /**
     * @dev Toggle auto-deposit on/off
     */
    function setAutoDepositEnabled(bool enabled) external onlyOwner {
        yieldStackingManager.setAutoDepositEnabled(enabled);
    }

    /**
     * @dev Get yield earned from DeFi vault
     */
    function getYieldEarned() external view returns (uint256) {
        return yieldStackingManager.getYieldEarned();
    }

    /**
     * @dev Get total assets in yield vault
     */
    function getTotalAssetsInVault() external view returns (uint256) {
        return yieldStackingManager.getTotalAssetsInVault();
    }

    /**
     * @dev Get all contract addresses
     */
    function getContracts() external view returns (
        address _propertyNFT,
        address _propertyShares,
        address _rentVault,
        address _cashFlowEngine,
        address _yieldDistributor,
        address _dao,
        address _yieldStackingManager
    ) {
        return (
            address(propertyNFT),
            address(propertyShares),
            address(rentVault),
            address(cashFlowEngine),
            address(yieldDistributor),
            address(dao),
            address(yieldStackingManager)
        );
    }

    /**
     * @dev Get property data
     */
    function getPropertyData() external view returns (IPropertyNFT.PropertyData memory) {
        return propertyNFT.getPropertyData(propertyId);
    }

    /**
     * @dev Get current distributable cash flow
     */
    function getDistributableCashFlow() external view returns (uint256) {
        return cashFlowEngine.getDistributableCashFlow();
    }

    /**
     * @dev Get cash flow from assets
     */
    function getCashFlowFromAssets() external view returns (int256) {
        return cashFlowEngine.getCashFlowFromAssets();
    }

    /**
     * @dev Convenience function to deposit rent
     * Note: Caller must approve USDC to the rent vault, not this contract
     */
    function depositRent(uint256 amount) external {
        // Forward the call - msg.sender will be the one transferring
        rentVault.depositRent(amount);
    }

    /**
     * @dev Convenience function to record operating expense
     */
    function recordOperatingExpense(uint256 amount) external {
        cashFlowEngine.recordOperatingExpense(amount);
    }

    /**
     * @dev Convenience function to create CapEx proposal
     */
    function createCapExProposal(uint256 amount, string calldata description) external returns (uint256) {
        return dao.createProposal(amount, description);
    }

    /**
     * @dev Convenience function to approve CapEx proposal
     */
    function approveCapExProposal(uint256 proposalId) external {
        dao.approveProposal(proposalId);
    }

    /**
     * @dev Convenience function to record CapEx
     */
    function recordCapEx(uint256 amount, uint256 proposalId) external {
        cashFlowEngine.recordCapEx(amount, proposalId);
    }

    /**
     * @dev Convenience function to distribute yield
     */
    function distributeYield() external {
        yieldDistributor.distributeYield();
    }

    /**
     * @dev Convenience function to claim yield
     */
    function claimYield(uint256 period) external {
        yieldDistributor.claimYield(period);
    }

    /**
     * @dev Reset period (calls both rent vault and cash flow engine)
     */
    function resetPeriod() external {
        cashFlowEngine.resetPeriod();
    }

    /**
     * @dev Set manager for cash flow engine
     */
    function setManager(address manager) external onlyOwner {
        cashFlowEngine.setManager(manager);
    }
}

