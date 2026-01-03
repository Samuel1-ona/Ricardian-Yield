#!/bin/bash

# Deploy contracts using cast commands (bypasses Foundry size limit check)
# Usage: ./deploy_with_cast.sh

set -e

# Load environment variables
export USDC_ADDRESS="${USDC_ADDRESS:-0xAcab8129E2cE587fD203FD770ec9ECAFA2C88080}"
export PRIVATE_KEY="${PRIVATE_KEY:-0x090f12f650a40f4dab17f65ff008ee8c5f2bde50e4f9534311919fd21395c46a}"
export RPC_URL="${RPC_URL:-https://mantle-sepolia.drpc.org}"

# Get deployer address
DEPLOYER=$(cast wallet address $PRIVATE_KEY)
echo "Deployer: $DEPLOYER"

# Step 1: Deploy MockERC4626Vault (if needed)
if [ -z "$ERC4626_VAULT_ADDRESS" ]; then
    echo "Deploying MockERC4626Vault..."
    MOCK_VAULT_BYTECODE=$(forge inspect MockERC4626Vault bytecode)
    MOCK_VAULT_CONSTRUCTOR=$(cast abi-encode "constructor(address,string,string,address,uint256)" \
        "$USDC_ADDRESS" \
        "Ricardian Yield Vault" \
        "RYV" \
        "$DEPLOYER" \
        "500")
    MOCK_VAULT_BYTECODE_FULL="${MOCK_VAULT_BYTECODE}${MOCK_VAULT_CONSTRUCTOR:2}"
    
    VAULT_TX=$(cast send --private-key $PRIVATE_KEY --rpc-url $RPC_URL \
        --create $MOCK_VAULT_BYTECODE_FULL \
        --value 0)
    ERC4626_VAULT_ADDRESS=$(echo $VAULT_TX | grep -oP 'contractAddress: \K0x[a-fA-F0-9]+')
    echo "MockERC4626Vault deployed at: $ERC4626_VAULT_ADDRESS"
else
    echo "Using existing ERC-4626 Vault: $ERC4626_VAULT_ADDRESS"
fi

# Step 2: Deploy PropertyCashFlowSystem implementation
echo "Deploying PropertyCashFlowSystem implementation..."
IMPLEMENTATION_BYTECODE=$(forge inspect PropertyCashFlowSystem bytecode)
IMPLEMENTATION_TX=$(cast send --private-key $PRIVATE_KEY --rpc-url $RPC_URL \
    --create $IMPLEMENTATION_BYTECODE \
    --value 0)
IMPLEMENTATION_ADDRESS=$(echo $IMPLEMENTATION_TX | grep -oP 'contractAddress: \K0x[a-fA-F0-9]+')
echo "Implementation deployed at: $IMPLEMENTATION_ADDRESS"

# Step 3: Deploy ERC1967Proxy
echo "Deploying UUPS Proxy..."
PROXY_BYTECODE=$(forge inspect ERC1967Proxy bytecode)
INIT_DATA=$(cast calldata "initializeContract(address,address)" "$USDC_ADDRESS" "$DEPLOYER")
PROXY_CONSTRUCTOR=$(cast abi-encode "constructor(address,bytes)" "$IMPLEMENTATION_ADDRESS" "$INIT_DATA")
PROXY_BYTECODE_FULL="${PROXY_BYTECODE}${PROXY_CONSTRUCTOR:2}"

PROXY_TX=$(cast send --private-key $PRIVATE_KEY --rpc-url $RPC_URL \
    --create $PROXY_BYTECODE_FULL \
    --value 0)
PROXY_ADDRESS=$(echo $PROXY_TX | grep -oP 'contractAddress: \K0x[a-fA-F0-9]+')
echo "Proxy deployed at: $PROXY_ADDRESS"
echo "Use this address as the system address: $PROXY_ADDRESS"

# Step 4: Initialize system
echo "Initializing system..."
PROPERTY_DATA=$(cast abi-encode "initialize((string,uint256,uint256,string),uint256,address,address,uint256,uint256,bool)" \
    "123 Main St, San Francisco, CA 94102" \
    "2000000000000000000000000" \
    "10000000000000000000000" \
    "ipfs://QmSamplePropertyMetadata" \
    "1000000000000000000000000" \
    "$DEPLOYER" \
    "$ERC4626_VAULT_ADDRESS" \
    "2000000000000000000000" \
    "1000000000000000000000" \
    "true")

cast send --private-key $PRIVATE_KEY --rpc-url $RPC_URL \
    $PROXY_ADDRESS \
    "initialize((string,uint256,uint256,string),uint256,address,address,uint256,uint256,bool)" \
    "123 Main St, San Francisco, CA 94102" \
    "2000000000000000000000000" \
    "10000000000000000000000" \
    "ipfs://QmSamplePropertyMetadata" \
    "1000000000000000000000000" \
    "$DEPLOYER" \
    "$ERC4626_VAULT_ADDRESS" \
    "2000000000000000000000" \
    "1000000000000000000000" \
    "true"

echo ""
echo "=== Deployment Summary ==="
echo "USDC Token: $USDC_ADDRESS"
echo "Yield Vault: $ERC4626_VAULT_ADDRESS"
echo "PropertyCashFlowSystem (Proxy): $PROXY_ADDRESS"
echo "Implementation: $IMPLEMENTATION_ADDRESS"
echo "=========================="

