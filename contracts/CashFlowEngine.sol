// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./RentVault.sol";
import "./SimpleDAO.sol";
import "./YieldStackingManager.sol";

/**
 * @title CashFlowEngine
 * @dev Core accounting logic for cash flow calculations
 * Implements: Cash Flow from Assets = Cash Flow from Operations + Change in Fixed Assets + Change in Working Capital
 * 
 * Distributable Cash Flow = Rent Collected - Operating Expenses - Working Capital Reserve
 * (CapEx affects property value but is excluded from immediate yield distribution)
 */
contract CashFlowEngine is Ownable, ReentrancyGuard {
    RentVault public rentVault;
    SimpleDAO public dao;
    YieldStackingManager public yieldStackingManager;

    uint256 public operatingExpenses;
    uint256 public capexSpent;
    uint256 public workingCapitalReserve;
    
    // Track changes for reporting
    uint256 public lastCapexChange;
    int256 public lastWorkingCapitalChange;

    // Role management
    address public manager;

    event OperatingExpenseRecorded(address indexed manager, uint256 amount);
    event CapExRecorded(address indexed dao, uint256 amount, uint256 proposalId);
    event WorkingCapitalAllocated(address indexed manager, uint256 amount);
    event ManagerSet(address indexed newManager);
    event RentVaultSet(address indexed rentVault);
    event DAOSet(address indexed dao);
    event YieldStackingManagerSet(address indexed yieldStackingManager);

    modifier onlyManager() {
        require(msg.sender == manager || msg.sender == owner(), "CashFlowEngine: not manager");
        _;
    }

    modifier onlyDAO() {
        require(msg.sender == address(dao) || msg.sender == owner(), "CashFlowEngine: not DAO");
        _;
    }

    constructor(address initialOwner) Ownable(initialOwner) {
        manager = initialOwner;
    }

    /**
     * @dev Set the RentVault address
     */
    function setRentVault(address _rentVault) external onlyOwner {
        require(_rentVault != address(0), "CashFlowEngine: invalid rent vault address");
        rentVault = RentVault(_rentVault);
        emit RentVaultSet(_rentVault);
    }

    /**
     * @dev Set the DAO address
     */
    function setDAO(address _dao) external onlyOwner {
        require(_dao != address(0), "CashFlowEngine: invalid DAO address");
        dao = SimpleDAO(_dao);
        emit DAOSet(_dao);
    }

    /**
     * @dev Set the yield stacking manager address
     */
    function setYieldStackingManager(address _yieldStackingManager) external onlyOwner {
        require(_yieldStackingManager != address(0), "CashFlowEngine: invalid yield stacking manager");
        yieldStackingManager = YieldStackingManager(_yieldStackingManager);
        emit YieldStackingManagerSet(_yieldStackingManager);
    }

    /**
     * @dev Set the manager address (can record operating expenses)
     */
    function setManager(address _manager) external onlyOwner {
        require(_manager != address(0), "CashFlowEngine: invalid manager address");
        manager = _manager;
        emit ManagerSet(_manager);
    }

    /**
     * @dev Record an operating expense (only manager)
     * @param amount Amount of the expense
     */
    function recordOperatingExpense(uint256 amount) external onlyManager {
        require(amount > 0, "CashFlowEngine: amount must be greater than zero");
        operatingExpenses += amount;
        emit OperatingExpenseRecorded(msg.sender, amount);
        
        // Trigger auto-deposit check after expense recording
        // Only if yield stacking manager is set and vault is configured
        if (address(yieldStackingManager) != address(0)) {
            // Use low-level call to avoid reverting if vault is not set
            (bool success, ) = address(yieldStackingManager).call(
                abi.encodeWithSignature("autoDepositIdleFunds()")
            );
            // Don't revert if call fails - just continue
            if (!success) {
                // Auto-deposit failed (vault not set or disabled), but expense recording succeeded
            }
        }
    }

    /**
     * @dev Record CapEx from an approved DAO proposal (only DAO)
     * @param amount Amount of CapEx
     * @param proposalId ID of the approved proposal
     */
    function recordCapEx(uint256 amount, uint256 proposalId) external onlyDAO {
        require(amount > 0, "CashFlowEngine: amount must be greater than zero");
        require(address(dao) != address(0), "CashFlowEngine: DAO not set");
        require(dao.isProposalApproved(proposalId), "CashFlowEngine: proposal not approved");

        uint256 previousCapex = capexSpent;
        capexSpent += amount;
        lastCapexChange = amount; // Track change for reporting

        emit CapExRecorded(msg.sender, amount, proposalId);
    }

    /**
     * @dev Allocate funds to working capital reserve (only manager)
     * @param amount Amount to allocate
     */
    function allocateWorkingCapital(uint256 amount) external onlyManager {
        require(amount > 0, "CashFlowEngine: amount must be greater than zero");
        workingCapitalReserve += amount;
        lastWorkingCapitalChange = int256(amount);
        emit WorkingCapitalAllocated(msg.sender, amount);
    }

    /**
     * @dev Release funds from working capital reserve (only manager)
     * @param amount Amount to release
     */
    function releaseWorkingCapital(uint256 amount) external onlyManager {
        require(amount > 0, "CashFlowEngine: amount must be greater than zero");
        require(amount <= workingCapitalReserve, "CashFlowEngine: insufficient reserve");
        workingCapitalReserve -= amount;
        lastWorkingCapitalChange = -int256(amount); // Negative change
        emit WorkingCapitalAllocated(msg.sender, amount);
    }

    /**
     * @dev Calculate distributable cash flow
     * Formula: Rent Collected - Operating Expenses - Working Capital Reserve + DeFi Yield
     * Note: CapEx is excluded from distributable yield
     */
    function getDistributableCashFlow() public view returns (uint256) {
        require(address(rentVault) != address(0), "CashFlowEngine: rent vault not set");
        uint256 rent = rentVault.rentCollected();
        
        uint256 baseCashFlow = 0;
        if (rent > operatingExpenses + workingCapitalReserve) {
            baseCashFlow = rent - operatingExpenses - workingCapitalReserve;
        }
        
        // Add DeFi yield if yield stacking manager is set
        uint256 defiYield = 0;
        if (address(yieldStackingManager) != address(0)) {
            defiYield = yieldStackingManager.getYieldEarned();
        }
        
        return baseCashFlow + defiYield;
    }

    /**
     * @dev Calculate total cash flow from assets
     * Formula: Distributable Cash Flow + Change in Fixed Assets + Change in Working Capital
     */
    function getCashFlowFromAssets() external view returns (int256) {
        int256 distributable = int256(getDistributableCashFlow());
        int256 capexChange = -int256(lastCapexChange); // CapEx is negative cash flow
        int256 workingCapitalChange = int256(lastWorkingCapitalChange);
        
        return distributable + capexChange + workingCapitalChange;
    }

    /**
     * @dev Reset accounting for a new period (typically monthly)
     * Resets rent collected, operating expenses, and working capital changes
     * Note: This requires the rentVault owner to call resetPeriod on the vault
     */
    function resetPeriod() external onlyOwner {
        require(address(rentVault) != address(0), "CashFlowEngine: rent vault not set");
        // Note: rentVault.resetPeriod() requires rentVault owner, which may be different
        // For now, we just reset our internal state. The rentVault period should be reset separately
        // or the rentVault owner should be set to this contract
        operatingExpenses = 0;
        lastCapexChange = 0;
        lastWorkingCapitalChange = 0;
    }

    /**
     * @dev Get current period from rent vault
     */
    function getCurrentPeriod() external view returns (uint256) {
        require(address(rentVault) != address(0), "CashFlowEngine: rent vault not set");
        return rentVault.currentPeriod();
    }
}

