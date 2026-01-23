# Stacks Migration & USDCx Integration

This document describes the migration from Mantle (EVM) to Stacks (Clarity) with USDCx integration.

## What's Been Implemented

### 1. Dependencies Installed
- `@stacks/connect` - Wallet connection
- `@stacks/transactions` - Transaction building and broadcasting
- `@stacks/network` - Network configuration
- `micro-packed` & `@scure/base` - Encoding utilities for bridging

### 2. Core Infrastructure

#### `src/lib/stacks-contracts.ts`
- Contract address configuration
- USDCx contract addresses (testnet/mainnet)
- xReserve contract addresses for bridging
- Helper functions for parsing contract addresses

#### `src/lib/bridge-helpers.ts`
- Encoding functions for Stacks addresses (for xReserve)
- Encoding functions for Ethereum addresses (for USDCx burn)
- Uses `micro-packed` for proper encoding

### 3. Hooks Created

#### `src/hooks/useStacks.ts`
- Stacks wallet connection hook
- Replaces `useAccount` from wagmi
- Handles authentication state

#### `src/hooks/useStacksRead.ts`
- Read-only contract calls using `callReadOnlyFunction`
- Migrated all read hooks:
  - `useOperatingExpenses`
  - `useCapExSpent`
  - `useWorkingCapitalReserve`
  - `useCurrentPeriod`
  - `useDistributableCashFlow`
  - `useRentCollected`
  - `useRentForPeriod`
  - `useClaimableYield`
  - `useCurrentDistributionPeriod`
  - `usePropertyData`
  - `useProposalCount`
  - `useProposal`
  - `useIsProposalApproved`
  - `useShareBalance`
  - `useTotalShares`

#### `src/hooks/useStacksWrite.ts`
- Write contract calls using `makeContractCall`
- Migrated write hooks:
  - `useDepositRent` - Handles USDCx transfer + deposit-rent call
  - `useClaimYield`
  - `useRecordOperatingExpense`
  - `useCreateCapExProposal`
  - `useVoteProposal`
  - `useDistributeYield`
  - `useRecordCapEx`

**Note:** Currently requires `VITE_STACKS_PRIVATE_KEY` environment variable for signing. In production, use wallet connection.

#### `src/hooks/useBridgeUSDC.ts`
- Bridges USDC from Ethereum to USDCx on Stacks
- Handles:
  1. Checking ETH and USDC balances
  2. Approving xReserve contract
  3. Calling `depositToRemote` on xReserve
- Requires Ethereum private key (for testing)

#### `src/hooks/useBridgeUSDCx.ts`
- Bridges USDCx from Stacks back to USDC on Ethereum
- Calls `burn` function on USDCx contract
- Requires Stacks private key

#### `src/hooks/useUSDCx.ts`
- Checks USDCx balance on Stacks
- Uses SIP-010 `get-balance` function

### 4. UI Components

#### `src/components/BridgeUSDC.tsx`
- UI component for bridging USDC → USDCx
- Shows form for entering Ethereum private key and amount
- Handles the bridging flow with status updates

### 5. Updated Pages

#### `src/pages/Rent.tsx`
- Migrated to use Stacks hooks
- Shows USDCx balance instead of MNT
- Includes bridging UI when user has no USDCx
- Uses `useDepositRent` which handles USDCx transfer

### 6. Providers

#### `src/providers.tsx`
- Removed wagmi dependency
- Now only uses React Query
- Stacks wallet connection handled by `useStacks` hook

## How USDCx Bridging Works

### Deposit Flow (Ethereum → Stacks)

1. **User initiates on Ethereum:**
   - User approves xReserve contract to spend USDC
   - User calls `depositToRemote` on xReserve with:
     - `value`: USDC amount (6 decimals)
     - `remoteDomain`: 10003 (Stacks domain ID)
     - `remoteRecipient`: Stacks address encoded as bytes32
     - `localToken`: USDC contract address
     - `maxFee`: 0
     - `hookData`: empty bytes

2. **Automatic minting on Stacks:**
   - Circle's xReserve + Stacks attestation service automatically mints USDCx
   - User receives USDCx in their Stacks wallet (~15 minutes)

### Withdrawal Flow (Stacks → Ethereum)

1. **User initiates on Stacks:**
   - User calls `burn` function on `.usdcx-v1` contract
   - Arguments:
     - `amount`: USDCx amount in micro USDCx (6 decimals)
     - `nativeDomain`: 0 (Ethereum domain ID)
     - `nativeRecipient`: Ethereum address encoded as bytes32

2. **Automatic settlement on Ethereum:**
   - USDCx is burned on Stacks
   - USDC automatically settles on Ethereum (~25-60 minutes)

## Environment Variables Needed

Create a `.env` file in the frontend directory:

```bash
# Stacks private key (for signing transactions)
VITE_STACKS_PRIVATE_KEY=your_stacks_private_key_here

# Optional: Ethereum RPC URL (defaults to public Sepolia)
VITE_ETH_RPC_URL=https://ethereum-sepolia.publicnode.com
```

## Contract Addresses

Contract addresses are automatically loaded from:
`contracts/ricardian/contract-address.json`

Current deployed contracts:
- `property-nft`: STVAH96MR73TP2FZG2W4X220MEB4NEMJHPMVYQNS.property-nft_clar
- `rent-vault`: STVAH96MR73TP2FZG2W4X220MEB4NEMJHPMVYQNS.rent-vault_clar
- `property-shares`: STVAH96MR73TP2FZG2W4X220MEB4NEMJHPMVYQNS.property-shares_clar
- `simple-dao`: STVAH96MR73TP2FZG2W4X220MEB4NEMJHPMVYQNS.simple-dao_clar
- `cash-flow-engine`: STVAH96MR73TP2FZG2W4X220MEB4NEMJHPMVYQNS.cash-flow-engine_clar
- `yield-distributor`: STVAH96MR73TP2FZG2W4X220MEB4NEMJHPMVYQNS.yield-distributor_clar

USDCx addresses:
- Testnet: `ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.usdcx`
- Mainnet: `SP120SBRBQJ00MCWS7TM5R8WJNTTKD5K0HFRC2CNE.usdcx`

## What Still Needs to Be Done

### 1. Update Remaining Pages
The following pages still need to be migrated from wagmi to Stacks:
- [ ] `src/pages/Dashboard.tsx`
- [ ] `src/pages/Yield.tsx`
- [ ] `src/pages/Expenses.tsx`
- [ ] `src/pages/CapEx.tsx`
- [ ] `src/pages/DAO.tsx`
- [ ] `src/pages/Property.tsx`
- [ ] `src/pages/Analytics.tsx`
- [ ] `src/pages/Stacking.tsx` (may be removed per plan)

### 2. Fix Wallet Connection
Currently, `useStacksWrite` requires a private key from environment variable. In production:
- Use `@stacks/connect-react` or `@stacks/wallet-sdk` for proper wallet integration
- Remove private key requirement
- Use wallet's signing capabilities

### 3. Update Header/Footer
- Update wallet connection UI in Header component
- Replace wagmi `useAccount` with `useStacks`

### 4. Testing
- Test all contract interactions
- Test USDCx bridging flow
- Test rent deposits
- Test yield distribution
- Test DAO proposals

### 5. Error Handling
- Improve error messages
- Handle network errors gracefully
- Add retry logic for failed transactions

### 6. Transaction Status
- Add transaction status tracking
- Show pending/confirmed states
- Link to Stacks explorer

## Key Differences from Solidity

1. **No loops**: Clarity doesn't support loops - use recursion or map operations
2. **Explicit error handling**: Use `unwrap!`, `try!`, or `match`
3. **No inheritance**: Use composition
4. **SIP-010 tokens**: USDCx is a SIP-010 fungible token (like ERC-20)
5. **Transaction model**: Stacks uses a different confirmation model than EVM

## Resources

- [Stacks Documentation](https://docs.stacks.co/)
- [Bridging USDCx Guide](https://docs.stacks.co/more-guides/bridging-usdcx)
- [stacks.js Documentation](https://docs.stacks.co/stacks.js)
- [Clarity Language Reference](https://docs.stacks.co/docs/clarity)

