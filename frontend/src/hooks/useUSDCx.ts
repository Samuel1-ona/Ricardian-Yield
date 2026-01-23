// Hook for checking USDCx balance on Stacks
import { useQuery } from '@tanstack/react-query';
import { fetchCallReadOnlyFunction, cvToJSON, principalCV } from '@stacks/transactions';
import { STACKS_TESTNET } from '@stacks/network';
import { getUSDCxAddress, parseContractAddress } from '@/lib/stacks-contracts';
import { useStacks } from './useStacks';

const network = STACKS_TESTNET; // TODO: Make configurable

/**
 * Hook for getting USDCx balance
 */
export function useUSDCxBalance() {
  const { address } = useStacks();

  const { data, isLoading, error } = useQuery({
    queryKey: ['usdcx-balance', address || ''],
    queryFn: async () => {
      if (!address) return null;

      const usdcxAddress = getUSDCxAddress('testnet');
      const { address: contractAddress, contractName } = parseContractAddress(usdcxAddress);

      const result = await fetchCallReadOnlyFunction({
        contractAddress,
        contractName,
        functionName: 'get-balance',
        functionArgs: [principalCV(address)],
        network,
        senderAddress: address,
      });

      const json = cvToJSON(result);
      return json.value ? BigInt(json.value) : BigInt(0);
    },
    enabled: !!address,
    staleTime: 10 * 1000, // 10 seconds
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
  });

  return {
    balance: data,
    isLoading,
    error: error as Error | null,
    formatted: data ? (Number(data) / 1e6).toFixed(6) : '0.000000',
  };
}

