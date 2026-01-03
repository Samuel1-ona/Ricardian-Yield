#!/bin/bash
# Deploy SystemInitializer using cast (bypasses size limit)

set -e

export USDC_ADDRESS="${USDC_ADDRESS:-0xAcab8129E2cE587fD203FD770ec9ECAFA2C88080}"
export PRIVATE_KEY="${PRIVATE_KEY:-0x090f12f650a40f4dab17f65ff008ee8c5f2bde50e4f9534311919fd21395c46a}"
export RPC_URL="${RPC_URL:-https://mantle-sepolia.drpc.org}"

echo "Deploying SystemInitializer with cast..."
SYSTEM_INIT_BYTECODE=$(forge inspect SystemInitializer bytecode)
SYSTEM_INIT_TX=$(cast send --private-key $PRIVATE_KEY --rpc-url $RPC_URL \
    --create $SYSTEM_INIT_BYTECODE \
    --json)
SYSTEM_INIT_ADDRESS=$(echo $SYSTEM_INIT_TX | jq -r '.contractAddress')
echo "SystemInitializer deployed at: $SYSTEM_INIT_ADDRESS"

