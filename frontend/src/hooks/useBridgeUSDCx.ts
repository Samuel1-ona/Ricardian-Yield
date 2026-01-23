// Hook for bridging USDCx from Stacks back to USDC on Ethereum
import { useState } from 'react';
import { makeContractCall, broadcastTransaction, Cl, Pc, PostConditionMode } from '@stacks/transactions';
import { STACKS_TESTNET, STACKS_MAINNET } from '@stacks/network';
import toast from 'react-hot-toast';
import { getUSDCxAddress, parseContractAddress, DOMAIN_IDS } from '@/lib/stacks-contracts';
import { encodeEthereumAddressForBridge } from '@/lib/bridge-helpers';

interface UseBridgeUSDCxOptions {
  network?: 'testnet' | 'mainnet';
  stacksPrivateKey?: string;
}

/**
 * Hook for bridging USDCx from Stacks back to USDC on Ethereum
 * 
 * This hook calls the `burn` function on the USDCx contract to initiate
 * withdrawal. The USDC will be automatically settled on Ethereum.
 * 
 * Note: Requires Stacks private key. In production, use wallet connection.
 */
export function useBridgeUSDCx(options: UseBridgeUSDCxOptions = {}) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const {
    network = 'testnet',
    stacksPrivateKey,
  } = options;

  const bridgeUSDCx = async (
    amount: string, // Amount in USDCx (e.g., "4.80")
    ethereumRecipient: string, // Ethereum address to receive USDC
  ) => {
    if (!stacksPrivateKey) {
      const err = new Error('Stacks private key is required for bridging');
      setError(err);
      toast.error(err.message);
      throw err;
    }

    setIsPending(true);
    setError(null);

    try {
      const stacksNetwork = network === 'testnet' ? STACKS_TESTNET : STACKS_MAINNET;
      const usdcxAddress = getUSDCxAddress(network);
      const { address: contractAddress, contractName } = parseContractAddress(usdcxAddress);

      // Convert amount to micro USDCx (6 decimals)
      const amountMicro = BigInt(Math.floor(parseFloat(amount) * 1e6));

      // Encode Ethereum address (pad to 32 bytes)
      const nativeRecipient = encodeEthereumAddressForBridge(ethereumRecipient);

      // Prepare function arguments
      const functionArgs = [
        Cl.uint(amountMicro),
        Cl.uint(DOMAIN_IDS.ETHEREUM),
        Cl.bufferFromHex(nativeRecipient),
      ];

      // Post condition: sender will send exactly the amount
      const postCondition = Pc.principal(contractAddress)
        .willSendEq(amountMicro)
        .ft(usdcxAddress as `${string}.${string}`, 'usdcx-token');

      // Create contract call
      const transaction = await makeContractCall({
        contractAddress,
        contractName,
        functionName: 'burn',
        functionArgs,
        network: stacksNetwork,
        postConditions: [postCondition],
        postConditionMode: PostConditionMode.Deny,
        senderKey: stacksPrivateKey,
      });

      toast.loading('Broadcasting burn transaction...', { id: 'burn' });

      // Broadcast transaction
      const result = await broadcastTransaction({
        transaction,
        network: stacksNetwork,
      });

      if ('error' in result) {
        throw new Error(result.error);
      }

      toast.success(
        `Burn transaction submitted! USDC will be settled on Ethereum in ~${network === 'testnet' ? '25' : '60'} minutes.`,
        { id: 'burn' }
      );

      setIsPending(false);
      return result.txid;
    } catch (err: any) {
      const error = err instanceof Error ? err : new Error(err?.message || 'Bridge withdrawal failed');
      setError(error);
      toast.error(error.message);
      setIsPending(false);
      throw error;
    }
  };

  return {
    bridgeUSDCx,
    isPending,
    error,
  };
}

