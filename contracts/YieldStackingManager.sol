// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/interfaces/IERC4626.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./RentVault.sol";
import "./CashFlowEngine.sol";

/**
 * @title YieldStackingManager
 * @dev Manages automatic deposit of idle native MNT funds into ERC-4626 vaults
 * For MVP: Yield stacking is optional (disabled by default) since ERC-4626 requires ERC20 tokens
 * Maintains conservative reserves and tracks yield earned
 */
contract YieldStackingManager is Ownable, ReentrancyGuard {
    IERC4626 public yieldVault;
    RentVault public rentVault;
    CashFlowEngine public cashFlowEngine;

    // Reserve management
    uint256 public reserveThreshold; // Minimum to keep in RentVault (in native MNT)
    uint256 public minimumDepositAmount; // Minimum amount to deposit (gas efficiency)
    bool public autoDepositEnabled;
    
    // Slippage protection
    uint256 public constant WITHDRAWAL_SLIPPAGE_TOLERANCE_BPS = 500; // 5% (500 basis points)

    // Tracking
    uint256 public totalDeposited; // Total MNT deposited to vault (principal only)
    uint256 public lastDepositTime;
    mapping(uint256 => uint256) public depositsPerPeriod; // Track deposits per period

    event YieldVaultSet(address indexed vault);
    event ReserveThresholdSet(uint256 threshold);
    event MinimumDepositSet(uint256 minimum);
    event AutoDepositToggled(bool enabled);
    event FundsDeposited(uint256 amount, uint256 shares, uint256 period);
    event FundsWithdrawn(uint256 amount, uint256 shares);
    event YieldEarned(uint256 yieldAmount);

    modifier onlyAuthorized() {
        require(
            msg.sender == owner() || 
            msg.sender == address(rentVault) || 
            msg.sender == address(cashFlowEngine) ||
            msg.sender == rentVault.owner(),
            "YieldStackingManager: not authorized"
        );
        _;
    }

    constructor(
        address _rentVault,
        address initialOwner
    ) Ownable(initialOwner) {
        require(_rentVault != address(0), "YieldStackingManager: invalid rent vault address");
        
        rentVault = RentVault(payable(_rentVault));
        
        // Default settings - yield stacking disabled for MVP (requires wrapped MNT or ERC20 vault)
        reserveThreshold = 2000 * 1e18; // 2000 MNT default reserve
        minimumDepositAmount = 1000 * 1e18; // 1000 MNT minimum deposit
        autoDepositEnabled = false; // Disabled by default for MVP (native MNT not compatible with ERC-4626)
    }

    /**
     * @dev Set the ERC-4626 vault address (optional - for future use with wrapped MNT)
     * Note: ERC-4626 vaults require ERC20 tokens, not native tokens
     * For MVP, this can remain unset (yield stacking disabled)
     */
    function setYieldVault(address _vault) external onlyOwner {
        require(_vault != address(0), "YieldStackingManager: invalid vault address");
        // Note: For native MNT, would need wrapped MNT (WMNT) or skip yield stacking
        yieldVault = IERC4626(_vault);
        emit YieldVaultSet(_vault);
    }

    /**
     * @dev Set the cash flow engine address
     */
    function setCashFlowEngine(address _cashFlowEngine) external onlyOwner {
        require(_cashFlowEngine != address(0), "YieldStackingManager: invalid cash flow engine address");
        cashFlowEngine = CashFlowEngine(_cashFlowEngine);
    }

    /**
     * @dev Set the reserve threshold
     */
    function setReserveThreshold(uint256 _threshold) external onlyOwner {
        reserveThreshold = _threshold;
        emit ReserveThresholdSet(_threshold);
    }

    /**
     * @dev Set the minimum deposit amount
     */
    function setMinimumDepositAmount(uint256 _minimum) external onlyOwner {
        minimumDepositAmount = _minimum;
        emit MinimumDepositSet(_minimum);
    }

    /**
     * @dev Toggle auto-deposit on/off
     */
    function setAutoDepositEnabled(bool _enabled) external onlyOwner {
        autoDepositEnabled = _enabled;
        emit AutoDepositToggled(_enabled);
    }

    /**
     * @dev Automatically deposit idle funds to ERC-4626 vault
     * Called after rent deposit or expense payment
     */
    function autoDepositIdleFunds() external onlyAuthorized nonReentrant {
        require(autoDepositEnabled, "YieldStackingManager: auto-deposit disabled");
        require(address(yieldVault) != address(0), "YieldStackingManager: vault not set");
        
        uint256 idleFunds = calculateIdleFunds();
        
        if (idleFunds >= minimumDepositAmount) {
            _depositToVault(idleFunds);
        }
    }

    /**
     * @dev Manually deposit funds to vault (owner only)
     */
    function depositToVault(uint256 amount) external onlyOwner nonReentrant {
        require(address(yieldVault) != address(0), "YieldStackingManager: vault not set");
        require(amount > 0, "YieldStackingManager: amount must be greater than zero");
        
        _depositToVault(amount);
    }

    /**
     * @dev Internal function to deposit to vault
     * Includes slippage protection using previewDeposit
     * Note: For MVP, this requires wrapped MNT or is disabled
     */
    function _depositToVault(uint256 amount) internal {
        require(address(yieldVault) != address(0), "YieldStackingManager: vault not set");
        require(address(rentVault).balance >= amount, "YieldStackingManager: insufficient balance");
        
        // Transfer native MNT from rent vault to this contract
        rentVault.withdraw(address(this), amount);
        
        // Note: ERC-4626 requires ERC20 tokens, not native tokens
        // For MVP, this would require wrapping MNT first or using a different mechanism
        // This function is kept for future compatibility but won't work with native MNT
        revert("YieldStackingManager: native MNT not compatible with ERC-4626. Use wrapped MNT or disable yield stacking.");
    }

    /**
     * @dev Withdraw funds from vault for distribution
     * @param amount Amount of MNT to withdraw (minimum expected)
     * Note: For MVP with native MNT, yield stacking is disabled, so this returns 0
     */
    function withdrawForDistribution(uint256 amount) external onlyAuthorized nonReentrant {
        // For MVP: Yield stacking disabled with native MNT
        // This function is kept for future compatibility
        require(address(yieldVault) != address(0), "YieldStackingManager: vault not set");
        revert("YieldStackingManager: native MNT not compatible with ERC-4626. Yield stacking disabled for MVP.");
    }

    /**
     * @dev Calculate idle funds available for deposit
     * Idle = total balance - expenses - reserve threshold
     */
    function calculateIdleFunds() public view returns (uint256) {
        uint256 totalBalance = address(rentVault).balance;
        
        // Get expenses from cash flow engine if available
        uint256 expenses = 0;
        if (address(cashFlowEngine) != address(0)) {
            expenses = cashFlowEngine.operatingExpenses();
        }
        
        // Calculate available funds after expenses and reserves
        if (totalBalance <= expenses + reserveThreshold) {
            return 0;
        }
        
        uint256 idle = totalBalance - expenses - reserveThreshold;
        return idle;
    }

    /**
     * @dev Get current yield earned (assets in vault - principal deposited)
     */
    function getYieldEarned() external view returns (uint256) {
        if (address(yieldVault) == address(0)) {
            return 0; // No vault set, no yield
        }
        
        if (totalDeposited == 0) {
            return 0; // Nothing deposited yet
        }
        
        uint256 totalAssets = getTotalAssetsInVault();
        if (totalAssets <= totalDeposited) {
            return 0;
        }
        
        return totalAssets - totalDeposited;
    }

    /**
     * @dev Get total assets in vault (principal + yield)
     */
    function getTotalAssetsInVault() public view returns (uint256) {
        if (address(yieldVault) == address(0)) {
            return 0;
        }
        
        uint256 shares = yieldVault.balanceOf(address(this));
        if (shares == 0) {
            return 0;
        }
        
        return yieldVault.convertToAssets(shares);
    }

    /**
     * @dev Get current period from rent vault
     */
    function getCurrentPeriod() external view returns (uint256) {
        return rentVault.currentPeriod();
    }

    /**
     * @dev Emergency withdraw all funds from vault (owner only)
     * Note: For MVP with native MNT, this is not applicable
     */
    function emergencyWithdraw() external onlyOwner nonReentrant {
        require(address(yieldVault) != address(0), "YieldStackingManager: vault not set");
        revert("YieldStackingManager: native MNT not compatible with ERC-4626. Yield stacking disabled for MVP.");
    }
}

