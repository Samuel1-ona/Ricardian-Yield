// Hooks for reading from Stacks Clarity contracts
import { useQuery } from '@tanstack/react-query';
import { fetchCallReadOnlyFunction, ClarityValue, cvToJSON, uintCV, principalCV } from '@stacks/transactions';
import { STACKS_TESTNET } from '@stacks/network';
import { getContractAddress, parseContractAddress } from '@/lib/stacks-contracts';
import { useStacks } from './useStacks';

const network = STACKS_TESTNET; // TODO: Make configurable

/**
 * Helper to serialize function args for query key (handles BigInt and ClarityValue)
 */
function serializeArgs(args: ClarityValue[]): string {
  if (args.length === 0) return '[]';
  
  // Convert ClarityValue to a serializable format
  const serialized = args.map((arg, index) => {
    try {
      // Use cvToJSON to convert ClarityValue to JSON, then stringify with BigInt handling
      const json = cvToJSON(arg);
      return JSON.stringify(json, (_, value) => {
        if (typeof value === 'bigint') {
          return value.toString();
        }
        return value;
      });
    } catch {
      return `arg${index}`;
    }
  });
  
  return JSON.stringify(serialized);
}

/**
 * Helper to safely extract numeric value from ClarityValue JSON result
 */
function extractNumericValue(data: any): string | number | null {
  if (!data) return null;
  
  // Handle different ClarityValue JSON structures
  if (typeof data === 'string' || typeof data === 'number') {
    return data;
  }
  
  if (typeof data === 'object') {
    // For uint/int types, the value might be in data.value
    if ('value' in data) {
      const value = data.value;
      if (typeof value === 'string' || typeof value === 'number') {
        return value;
      }
      // If value is an object, try to extract from it
      if (typeof value === 'object' && 'value' in value) {
        return extractNumericValue(value);
      }
    }
    // Some types might have the value directly
    if ('repr' in data) {
      // Try to parse from repr (e.g., "u123")
      const repr = data.repr;
      if (typeof repr === 'string') {
        const match = repr.match(/u?(\d+)/);
        if (match) {
          return match[1];
        }
      }
    }
  }
  
  return null;
}

/**
 * Generic hook for calling read-only functions on Clarity contracts
 */
function useStacksRead<T = any>(
  contractName: keyof typeof import('@/lib/stacks-contracts').STACKS_CONTRACTS,
  functionName: string,
  functionArgs: ClarityValue[] = [],
  options: { enabled?: boolean } = {}
): {
  data: T | undefined;
  isLoading: boolean;
  error: Error | null;
} {
  const { data, isLoading, error } = useQuery({
    queryKey: ['stacks-read', contractName, functionName, serializeArgs(functionArgs)],
    queryFn: async () => {
      const contractAddress = getContractAddress(contractName);
      const { address, contractName: name } = parseContractAddress(contractAddress);

      const result = await fetchCallReadOnlyFunction({
        contractAddress: address,
        contractName: name,
        functionName,
        functionArgs,
        network,
        senderAddress: address, // Use contract address as sender for read-only
      });

      return cvToJSON(result) as T;
    },
    enabled: options.enabled !== false,
    staleTime: 30 * 1000, // 30 seconds
  });

  return {
    data,
    isLoading,
    error: error as Error | null,
  };
}

// Cash Flow Engine hooks
export function useOperatingExpenses(propertyId?: bigint) {
  const { data } = useStacksRead(
    'cash-flow-engine',
    'get-operating-expenses',
    propertyId !== undefined ? [uintCV(Number(propertyId))] : [],
    { enabled: propertyId !== undefined }
  );
  const value = extractNumericValue(data);
  return {
    operatingExpenses: value ? BigInt(value) : undefined,
    isLoading: false,
    error: null,
  };
}

export function useCapExSpent(propertyId?: bigint) {
  const { data } = useStacksRead(
    'cash-flow-engine',
    'get-capex-spent',
    propertyId !== undefined ? [uintCV(Number(propertyId))] : [],
    { enabled: propertyId !== undefined }
  );
  const value = extractNumericValue(data);
  return {
    capexSpent: value ? BigInt(value) : undefined,
    isLoading: false,
    error: null,
  };
}

export function useWorkingCapitalReserve(propertyId?: bigint) {
  const { data } = useStacksRead(
    'cash-flow-engine',
    'get-working-capital-reserve',
    propertyId !== undefined ? [uintCV(Number(propertyId))] : [],
    { enabled: propertyId !== undefined }
  );
  const value = extractNumericValue(data);
  return {
    workingCapitalReserve: value ? BigInt(value) : undefined,
    isLoading: false,
    error: null,
  };
}

export function useCurrentPeriod(propertyId?: bigint) {
  const { data } = useStacksRead(
    'cash-flow-engine',
    'get-current-period',
    propertyId !== undefined ? [uintCV(Number(propertyId))] : [],
    { enabled: propertyId !== undefined }
  );
  const value = extractNumericValue(data);
  return {
    currentPeriod: value ? BigInt(value) : undefined,
    isLoading: false,
    error: null,
  };
}

export function useDistributableCashFlow(propertyId?: bigint) {
  const { data } = useStacksRead(
    'cash-flow-engine',
    'get-distributable-cash-flow',
    propertyId !== undefined ? [uintCV(Number(propertyId))] : [],
    { enabled: propertyId !== undefined }
  );
  const value = extractNumericValue(data);
  return {
    distributableCashFlow: value ? BigInt(value) : undefined,
    isLoading: false,
    error: null,
  };
}

// Rent Vault hooks
export function useRentCollected(propertyId?: bigint) {
  const { data } = useStacksRead(
    'rent-vault',
    'get-rent-collected',
    propertyId !== undefined ? [uintCV(Number(propertyId))] : [],
    { enabled: propertyId !== undefined }
  );
  const value = extractNumericValue(data);
  return {
    rentCollected: value ? BigInt(value) : undefined,
    isLoading: false,
    error: null,
  };
}

export function useRentForPeriod(propertyId: bigint | undefined, period: bigint | undefined) {
  const { data } = useStacksRead(
    'rent-vault',
    'get-rent-for-period',
    propertyId !== undefined && period !== undefined
      ? [uintCV(Number(propertyId)), uintCV(Number(period))]
      : [],
    { enabled: propertyId !== undefined && period !== undefined }
  );
  const value = extractNumericValue(data);
  return {
    rentForPeriod: value ? BigInt(value) : undefined,
    isLoading: false,
    error: null,
  };
}

export function useRentVaultCurrentPeriod(propertyId?: bigint) {
  const { data } = useStacksRead(
    'rent-vault',
    'get-current-period',
    propertyId !== undefined ? [uintCV(Number(propertyId))] : [],
    { enabled: propertyId !== undefined }
  );
  const value = extractNumericValue(data);
  return {
    currentPeriod: value ? BigInt(value) : undefined,
    isLoading: false,
    error: null,
  };
}

// Yield Distributor hooks
export function useClaimableYield(propertyId: bigint | undefined, period: bigint | undefined) {
  const { address } = useStacks();
  const { data } = useStacksRead(
    'yield-distributor',
    'get-claimable-yield',
    propertyId !== undefined && period !== undefined && address
      ? [uintCV(Number(propertyId)), uintCV(Number(period)), principalCV(address)]
      : [],
    { enabled: propertyId !== undefined && period !== undefined && !!address }
  );
  const value = extractNumericValue(data);
  return {
    claimableYield: value ? BigInt(value) : undefined,
    isLoading: false,
    error: null,
  };
}

export function useCurrentDistributionPeriod(propertyId?: bigint) {
  const { data } = useStacksRead(
    'yield-distributor',
    'get-current-distribution-period',
    propertyId !== undefined ? [uintCV(Number(propertyId))] : [],
    { enabled: propertyId !== undefined }
  );
  const value = extractNumericValue(data);
  return {
    currentPeriod: value ? BigInt(value) : undefined,
    isLoading: false,
    error: null,
  };
}

// Property NFT hooks
export function usePropertyData(propertyId?: bigint) {
  const { data } = useStacksRead(
    'property-nft',
    'get-property-data',
    propertyId !== undefined ? [uintCV(Number(propertyId))] : [],
    { enabled: propertyId !== undefined }
  );
  return {
    propertyData: data,
    isLoading: false,
    error: null,
  };
}

export function useTotalProperties() {
  const { data } = useStacksRead('property-nft', 'get-total-supply');
  const value = extractNumericValue(data);
  return {
    totalSupply: value ? BigInt(value) : BigInt(0),
    isLoading: false,
    error: null,
  };
}

export function useLastTokenId() {
  const { data } = useStacksRead('property-nft', 'get-last-token-id');
  const value = extractNumericValue(data);
  return {
    lastTokenId: value ? BigInt(value) : BigInt(0),
    isLoading: false,
    error: null,
  };
}

export function usePropertyOwner(propertyId?: bigint) {
  const { data } = useStacksRead(
    'property-nft',
    'get-owner',
    propertyId !== undefined ? [uintCV(Number(propertyId))] : [],
    { enabled: propertyId !== undefined }
  );
  return {
    owner: data?.value as string | undefined,
    isLoading: false,
    error: null,
  };
}

// DAO hooks
export function useProposalCount() {
  const { data } = useStacksRead('simple-dao', 'get-proposal-count');
  const value = extractNumericValue(data);
  return {
    proposalCount: value ? BigInt(value) : undefined,
    isLoading: false,
    error: null,
  };
}

export function useProposal(propertyId: bigint | undefined, proposalId: bigint | undefined) {
  const { data } = useStacksRead(
    'simple-dao',
    'get-proposal',
    propertyId !== undefined && proposalId !== undefined
      ? [uintCV(Number(propertyId)), uintCV(Number(proposalId))]
      : [],
    { enabled: propertyId !== undefined && proposalId !== undefined }
  );
  return {
    proposal: data,
    isLoading: false,
    error: null,
  };
}

export function useIsProposalApproved(propertyId: bigint | undefined, proposalId: bigint | undefined) {
  const { data } = useStacksRead(
    'simple-dao',
    'is-proposal-approved',
    propertyId !== undefined && proposalId !== undefined
      ? [uintCV(Number(propertyId)), uintCV(Number(proposalId))]
      : [],
    { enabled: propertyId !== undefined && proposalId !== undefined }
  );
  return {
    isApproved: data?.value as boolean | undefined,
    isLoading: false,
    error: null,
  };
}

// Property Shares hooks
export function useShareBalance(propertyId: bigint | undefined) {
  const { address } = useStacks();
  const { data } = useStacksRead(
    'property-shares',
    'get-balance',
    propertyId !== undefined && address
      ? [uintCV(Number(propertyId)), principalCV(address)]
      : [],
    { enabled: propertyId !== undefined && !!address }
  );
  const value = extractNumericValue(data);
  return {
    balance: value ? BigInt(value) : undefined,
    isLoading: false,
    error: null,
  };
}

export function useTotalShares(propertyId?: bigint) {
  const { data } = useStacksRead(
    'property-shares',
    'get-total-supply',
    propertyId !== undefined ? [uintCV(Number(propertyId))] : [],
    { enabled: propertyId !== undefined }
  );
  const value = extractNumericValue(data);
  return {
    totalSupply: value ? BigInt(value) : undefined,
    isLoading: false,
    error: null,
  };
}

