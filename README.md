# Ricardian Yield 

An onchain cash-flow engine that tokenizes rental real estate and transparently distributes real rental income using Mantle. 
## Overview

This project implements a complete system for tokenizing real estate rental properties and distributing cash flow to fractional owners. The system tracks rental income, operating expenses, capital expenditures (CapEx), and working capital reserves, then distributes net cash flow proportionally to token holders.

### Cash Flow Formula

The system implements the standard cash flow from assets formula:

```
Cash Flow from Assets = 
    Cash Flow from Operations 
    + Change in Fixed Assets (CapEx)
    + Change in Net Working Capital

Distributable Cash Flow = 
    Rent Collected 
    - Operating Expenses 
    - Working Capital Reserve
```

**Note:** CapEx affects property value but is excluded from immediate yield distribution, showing long-term value creation.

## Architecture

The system consists of 7 core smart contracts:

1. **PropertyNFT** - ERC-721 representing physical properties
2. **PropertyShares** - ERC-20 fractional ownership tokens
3. **RentVault** - Receives and holds rental income (USDC)
4. **CashFlowEngine** - Calculates distributable cash flow
5. **YieldDistributor** - Distributes yield to token holders
6. **SimpleDAO** - Governance for CapEx approvals
7. **YieldStackingManager** - Automatically deposits idle funds into ERC-4626 vaults for additional yield
8. **PropertyCashFlowSystem** - Integration contract that ties everything together

### Key Features

- **Transparent Cash Flow**: All rent and expenses tracked on-chain
- **Real Yield**: Only actual rental income is distributed (no fake APY)
- **Yield Stacking**: Idle funds automatically deposited into ERC-4626 vaults for additional DeFi yield
- **Asset Management**: CapEx tracking shows long-term value creation
- **Reserve Management**: Working capital buffer prevents payout failures
- **Fractional Ownership**: Multiple investors can own shares
- **Role-Based Access**: Manager (expenses), DAO (CapEx), Public (rent deposits)

## Project Structure

```
contracts/
├── PropertyNFT.sol              # ERC-721 property representation
├── PropertyShares.sol            # ERC-20 fractional ownership
├── RentVault.sol                 # Rent collection and holding
├── CashFlowEngine.sol            # Cash flow calculations
├── YieldDistributor.sol          # Yield distribution
├── SimpleDAO.sol                 # CapEx governance
├── YieldStackingManager.sol      # DeFi yield stacking manager
├── MockERC4626Vault.sol          # Mock vault for testing (test only)
├── PropertyCashFlowSystem.sol    # Integration contract
└── interfaces/
    └── IPropertyNFT.sol          # Property NFT interface

test/
├── PropertyNFT.t.sol
├── PropertyShares.t.sol
├── RentVault.t.sol
├── CashFlowEngine.t.sol
├── YieldDistributor.t.sol
├── SimpleDAO.t.sol
├── Integration.t.sol
└── MockUSDC.sol

script/
├── Deploy.s.sol                  # Deployment script
└── Setup.s.sol                   # Setup script
```

## Installation

```bash
# Install Foundry (if not already installed)
curl -L https://foundry.paradigm.xyz | bash
foundryup

# Clone and setup
git clone <repo-url>
cd ricardian-yield
forge install
```

## Testing

Run all tests:
```bash
forge test
```

Run specific test file:
```bash
forge test --match-contract PropertyNFTTest
```

Run with verbose output:
```bash
forge test -vvv
```

## Deployment

### Prerequisites

1. Set up environment variables in `.env`:
```bash
PRIVATE_KEY=your_private_key
USDC_ADDRESS=0x... # Mantle testnet USDC address
RPC_URL=https://rpc.testnet.mantle.xyz
```

### Deploy to Mantle Testnet

```bash
# Deploy the system
forge script script/Deploy.s.sol:Deploy --rpc-url $RPC_URL --broadcast --verify

# Setup roles (optional)
forge script script/Setup.s.sol:Setup --rpc-url $RPC_URL --broadcast
```

### Deployment Steps

1. Deploy `PropertyCashFlowSystem` with USDC address
2. Initialize with property data:
   - Location
   - Valuation
   - Monthly rent
   - Total shares
   - Initial shareholder
3. Set manager address (for recording expenses)
4. System is ready for rent deposits and yield distribution

## Usage

### For Tenants/Property Managers

```solidity
// Deposit rent (must approve USDC to RentVault first)
usdc.approve(rentVault, amount);
rentVault.depositRent(amount);
```

### For Managers

```solidity
// Record operating expenses
cashFlowEngine.recordOperatingExpense(amount);

// Allocate working capital reserve
cashFlowEngine.allocateWorkingCapital(amount);
```

### For DAO/Governance

```solidity
// Create CapEx proposal
uint256 proposalId = dao.createProposal(amount, "Renovation description");

// Approve proposal
dao.approveProposal(proposalId);

// Record CapEx
cashFlowEngine.recordCapEx(amount, proposalId);
```

### For Shareholders

```solidity
// Check claimable yield
uint256 claimable = yieldDistributor.getClaimableYield(shareholder, period);

// Claim yield
yieldDistributor.claimYield(period);
```

### Monthly Cycle

1. **Rent Collection**: Tenants deposit rent to `RentVault`
2. **Expense Recording**: Manager records operating expenses
3. **Yield Distribution**: Owner calls `distributeYield()` to create snapshot
4. **Yield Claiming**: Shareholders claim their proportional yield
5. **Period Reset**: Owner resets period for next month

## Yield Stacking Feature

### Overview

The yield stacking feature automatically deposits idle USDC funds from the RentVault into ERC-4626 compliant DeFi vaults to earn additional yield. This yield is tracked separately and included in distributions to shareholders alongside rental income.

### How It Works

1. **Automatic Deposits**: When rent is collected, idle funds above the reserve threshold are automatically deposited into the configured ERC-4626 vault
2. **Conservative Reserves**: A configurable reserve threshold ensures sufficient liquidity for expenses
3. **Yield Tracking**: DeFi yield is tracked separately from rental income
4. **Combined Distribution**: Both rental yield and DeFi yield are included in shareholder distributions

### Configuration

```solidity
// Set ERC-4626 vault address (e.g., Aave, Compound, or other Mantle vaults)
system.setYieldVault(vaultAddress);

// Configure reserve and minimum deposit amounts
system.configureYieldStacking(
    2000 * 1e18,  // Reserve threshold: $2000 (20% of monthly rent)
    1000 * 1e18   // Minimum deposit: $1000 (gas efficiency)
);

// Enable/disable auto-deposit
system.setAutoDepositEnabled(true);
```

### Benefits

- **Increased Returns**: Shareholders earn rental yield + DeFi yield
- **Automatic**: No manual intervention needed
- **Safe**: Conservative reserves prevent liquidity issues
- **Transparent**: All yield tracked on-chain
- **Flexible**: Works with any ERC-4626 compliant vault on Mantle

### ERC-4626 Vault Options on Mantle

The system works with any ERC-4626 compliant vault, including:
- Aave USDC vaults (if deployed on Mantle)
- Compound USDC vaults (if deployed on Mantle)
- Other Mantle-native DeFi protocols with ERC-4626 support

## Why Mantle?

- **Low Gas Costs**: Frequent rent distributions are cost-effective
- **Modular DA**: Off-chain property documents can be stored efficiently
- **L2 DeFi Integration**: Idle rent automatically deposited into Mantle native yield protocols via ERC-4626
- **Scalability**: Handle multiple properties and many shareholders

## Security Considerations

- Reentrancy guards on all payment functions
- Access control on all state-changing functions
- Input validation on all amounts
- Safe math operations (Solidity 0.8.24 built-in)
- Snapshot-based yield distribution prevents manipulation

## Hackathon Pitch

**"Ricardian Yield: Where classical economics meets yield stacking. Tokenize rental real estate and transparently distribute real rental income, automatically stacked with DeFi yield on Mantle."**

### Key Differentiators

1. **Real Asset Backing**: Actual rental properties, not synthetic yield
2. **Transparent Accounting**: All cash flow tracked on-chain
3. **Sustainable Yield**: Only real income is distributed
4. **Yield Stacking**: Automatic DeFi integration for additional returns
5. **Institutional Logic**: Proper accounting with CapEx and reserves
6. **Mantle Optimized**: Leverages L2 benefits for frequent distributions and DeFi integration

## License

MIT

## Contributing

This is a hackathon project. For production use, additional security audits and compliance considerations are required.
