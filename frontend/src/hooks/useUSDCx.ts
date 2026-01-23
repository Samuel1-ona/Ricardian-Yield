// Hook for checking USDCx balance on Stacks
import { useQuery } from '@tanstack/react-query';
import { fetchCallReadOnlyFunction, cvToJSON, principalCV } from '@stacks/transactions';
import { STACKS_TESTNET } from '@stacks/network';
import { getUSDCxAddress, parseContractAddress } from '@/lib/stacks-contracts';
import { useStacks } from './useStacks';

const network = STACKS_TESTNET; // TODO: Make configurable

/**
 * Extract numeric value from ClarityValue JSON response
 * Handles different response formats from Clarity contracts
 * SIP-010 get-balance returns (ok uint), so we need to handle the ok variant
 */
function extractBalanceValue(data: any): bigint {
  if (!data) return BigInt(0);
  
  // Handle { type: "ok", value: { type: "uint", value: "..." } } format
  if (data.type === 'ok' && data.value) {
    const okValue = data.value;
    // The value inside ok might be another object with type and value
    if (okValue.type === 'uint' && okValue.value !== undefined) {
      return BigInt(okValue.value);
    }
    // Or it might be a direct value
    if (typeof okValue === 'string' || typeof okValue === 'number') {
      return BigInt(okValue);
    }
    // Or it might have a value property
    if (okValue.value !== undefined) {
      const val = okValue.value;
      if (typeof val === 'string' || typeof val === 'number') {
        return BigInt(val);
      }
    }
  }
  
  // Handle direct value
  if (typeof data === 'string' || typeof data === 'number') {
    return BigInt(data);
  }
  
  // Handle { value: ... } format
  if (data.value !== undefined) {
    const val = data.value;
    if (typeof val === 'string' || typeof val === 'number') {
      return BigInt(val);
    }
    // If value is an object, try to extract from it
    if (val && typeof val === 'object') {
      if (val.value !== undefined) {
        return BigInt(val.value);
      }
      // Check if it's a uint type
      if (val.type === 'uint' && val.value !== undefined) {
        return BigInt(val.value);
      }
    }
  }
  
  // Handle { repr: "u1000000" } format
  if (data.repr) {
    const repr = data.repr.toString();
    // Extract number from repr (e.g., "u1000000" -> "1000000")
    const match = repr.match(/u?(\d+)/);
    if (match) {
      return BigInt(match[1]);
    }
  }
  
  // Handle direct number in object
  if (typeof data === 'object' && !isNaN(Number(data))) {
    return BigInt(Number(data));
  }
  
  console.warn('Could not extract balance from response:', JSON.stringify(data, null, 2));
  return BigInt(0);
}

/**
 * Hook for getting USDCx balance
 */
export function useUSDCxBalance() {
  const { address, isConnected } = useStacks();

  const { data, isLoading, error } = useQuery({
    queryKey: ['usdcx-balance', address || ''],
    queryFn: async () => {
      if (!address) {
        return null;
      }

      try {
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
        const balance = extractBalanceValue(json);
        
        // Debug log (can be removed in production)
        if (process.env.NODE_ENV === 'development') {
          console.log('USDCx balance fetched:', {
            address,
            balance: balance.toString(),
            formatted: (Number(balance) / 1e6).toFixed(6),
          });
        }

        return balance;
      } catch (err: any) {
        console.error('Error fetching USDCx balance:', err);
        throw err;
      }
    },
    enabled: !!address && isConnected,
    staleTime: 10 * 1000, // 10 seconds
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
    retry: 2,
  });

  // Ensure balance is always a BigInt, defaulting to 0 if null/undefined
  const balance = data !== null && data !== undefined ? data : BigInt(0);

  return {
    balance,
    isLoading,
    error: error as Error | null,
    formatted: balance > BigInt(0) ? (Number(balance) / 1e6).toFixed(6) : '0.000000',
  };
}

