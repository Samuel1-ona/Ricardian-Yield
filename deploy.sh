#!/bin/bash

# Deployment script for Ricardian Yield contracts on Mantle Sepolia
# Usage: ./deploy.sh

set -e

echo "🚀 Deploying Ricardian Yield Contracts to Mantle Sepolia"
echo ""

# Check if environment variables are set
if [ -z "$PRIVATE_KEY" ]; then
    echo "❌ Error: PRIVATE_KEY not set"
    echo "   Set it with: export PRIVATE_KEY=\"your_private_key\""
    exit 1
fi

if [ -z "$RPC_URL" ]; then
    echo "❌ Error: RPC_URL not set"
    echo "   Set it with: export RPC_URL=\"https://rpc.sepolia.mantle.xyz\""
    exit 1
fi

# Check if using real contracts
if [ -n "$USDC_ADDRESS" ]; then
    echo "✅ Using REAL USDC at: $USDC_ADDRESS"
else
    echo "ℹ️  USDC_ADDRESS not set - will deploy MockUSDC"
fi

if [ -n "$ERC4626_VAULT_ADDRESS" ]; then
    echo "✅ Using REAL ERC-4626 Vault at: $ERC4626_VAULT_ADDRESS"
else
    echo "ℹ️  ERC4626_VAULT_ADDRESS not set - will deploy MockERC4626Vault"
fi

echo ""
echo "📦 Building contracts..."
forge build

echo ""
echo "🚀 Deploying contracts..."
forge script script/Deploy.s.sol:Deploy \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast \
  -vvvv

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📝 Next steps:"
echo "1. Copy the contract addresses from the output above"
echo "2. Update frontend/src/lib/contracts.ts with the addresses"
echo "3. If using MockUSDC, mint tokens to test accounts"
echo ""

