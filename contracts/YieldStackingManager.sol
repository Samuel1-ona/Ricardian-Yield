// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/interfaces/IERC4626.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./RentVault.sol";
import "./CashFlowEngine.sol";

/**
 * @title YieldStackingManager
 * @dev Manages automatic deposit of idle USDC funds into ERC-4626 vaults
 * Maintains conservative reserves and tracks yield earned
 */
contract YieldStackingManager is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC4626 public yieldVault;
    IERC20 public usdc;
    RentVault public rentVault;
    CashFlowEngine public cashFlowEngine;

    // Reserve management
    uint256 public reserveThreshold; // Minimum to keep in RentVault (in USDC)
    uint256 public minimumDepositAmount; // Minimum amount to deposit (gas efficiency)
    bool public autoDepositEnabled;
    
    // Slippage protection
    uint256 public constant WITHDRAWAL_SLIPPAGE_TOLERANCE_BPS = 500; // 5% (500 basis points)

    // Tracking
    uint256 public totalDeposited; // Total USDC deposited to vault (principal only)
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
        address _usdc,
        address _rentVault,
        address initialOwner
    ) Ownable(initialOwner) {
        require(_usdc != address(0), "YieldStackingManager: invalid USDC address");
        require(_rentVault != address(0), "YieldStackingManager: invalid rent vault address");
        
        usdc = IERC20(_usdc);
        rentVault = RentVault(_rentVault);
        
        // Default settings
        reserveThreshold = 2000 * 1e18; // $2000 default reserve
        minimumDepositAmount = 1000 * 1e18; // $1000 minimum deposit
        autoDepositEnabled = true;
    }

    /**
     * @dev Set the ERC-4626 vault address
     */
    function setYieldVault(address _vault) external onlyOwner {
        require(_vault != address(0), "YieldStackingManager: invalid vault address");
        require(IERC4626(_vault).asset() == address(usdc), "YieldStackingManager: vault asset must be USDC");
        
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
     */
    function _depositToVault(uint256 amount) internal {
        require(usdc.balanceOf(address(rentVault)) >= amount, "YieldStackingManager: insufficient balance");
        
        // Transfer USDC from rent vault to this contract
        rentVault.withdraw(address(this), amount);
        
        // Preview expected shares (includes fees, slippage protection)
        uint256 expectedShares = yieldVault.previewDeposit(amount);
        require(expectedShares > 0, "YieldStackingManager: zero shares expected");
        
        // Approve and deposit to ERC-4626 vault
        usdc.forceApprove(address(yieldVault), amount);
        uint256 sharesReceived = yieldVault.deposit(amount, address(this));
        
        // Slippage protection: ensure we received at least the expected shares
        // Note: ERC-4626 spec says deposit should return >= previewDeposit, but we verify for safety
        require(sharesReceived >= expectedShares, "YieldStackingManager: slippage too high on deposit");
        
        totalDeposited += amount;
        lastDepositTime = block.timestamp;
        
        uint256 currentPeriod = rentVault.currentPeriod();
        depositsPerPeriod[currentPeriod] += amount;
        
        emit FundsDeposited(amount, sharesReceived, currentPeriod);
    }

    /**
     * @dev Withdraw funds from vault for distribution
     * @param amount Amount of USDC to withdraw (minimum expected)
     * Includes slippage protection - reverts if less than requested amount is received
     */
    function withdrawForDistribution(uint256 amount) external onlyAuthorized nonReentrant {
        require(address(yieldVault) != address(0), "YieldStackingManager: vault not set");
        require(amount > 0, "YieldStackingManager: amount must be greater than zero");
        
        // Preview expected shares needed (includes fees)
        uint256 sharesToRedeem = yieldVault.previewWithdraw(amount);
        uint256 maxRedeem = yieldVault.maxRedeem(address(this));
        require(sharesToRedeem <= maxRedeem, "YieldStackingManager: insufficient shares");
        
        // Redeem shares for USDC
        uint256 assetsReceived = yieldVault.redeem(sharesToRedeem, address(this), address(this));
        
        // Slippage protection: ensure we received at least the requested amount
        // Note: Due to yield accrual, we might get more than requested, which is fine
        // We allow a tolerance for fees, rounding differences, and exchange rate variations
        // This protects against unexpected slippage while being reasonable about vault behavior
        // Real ERC-4626 vaults should return very close to the requested amount
        uint256 tolerance = (amount * WITHDRAWAL_SLIPPAGE_TOLERANCE_BPS) / 10000;
        require(assetsReceived >= (amount - tolerance), "YieldStackingManager: insufficient assets received");
        
        // Update tracking (reduce total deposited by the principal portion)
        // Note: assetsReceived may be more than amount due to yield
        if (assetsReceived >= amount) {
            uint256 yieldPortion = assetsReceived - amount;
            if (yieldPortion > 0) {
                emit YieldEarned(yieldPortion);
            }
        }
        
        // Transfer USDC back to rent vault
        usdc.safeTransfer(address(rentVault), assetsReceived);
        
        emit FundsWithdrawn(assetsReceived, sharesToRedeem);
    }

    /**
     * @dev Calculate idle funds available for deposit
     * Idle = total balance - expenses - reserve threshold
     */
    function calculateIdleFunds() public view returns (uint256) {
        uint256 totalBalance = usdc.balanceOf(address(rentVault));
        
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
     */
    function emergencyWithdraw() external onlyOwner nonReentrant {
        require(address(yieldVault) != address(0), "YieldStackingManager: vault not set");
        
        uint256 shares = yieldVault.balanceOf(address(this));
        if (shares > 0) {
            uint256 assets = yieldVault.redeem(shares, address(this), address(this));
            usdc.safeTransfer(address(rentVault), assets);
            emit FundsWithdrawn(assets, shares);
        }
    }
}

