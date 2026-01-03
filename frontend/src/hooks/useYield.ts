import { useReadContract, useAccount } from "wagmi";
import { CONTRACT_ADDRESSES, CONTRACT_ABIS } from "@/lib/contracts";

// Get claimable yield for a user from YieldDistributor
export function useClaimableYield(period?: bigint) {
  const { address } = useAccount();
  
  // Get current period if not provided
  const { data: currentPeriod } = useReadContract({
    address: CONTRACT_ADDRESSES.YIELD_DISTRIBUTOR,
    abi: CONTRACT_ABIS.YIELD_DISTRIBUTOR,
    functionName: "currentDistributionPeriod",
  });

  const effectivePeriod = period ?? currentPeriod;

  const { data, isLoading, error } = useReadContract({
    address: CONTRACT_ADDRESSES.YIELD_DISTRIBUTOR,
    abi: CONTRACT_ABIS.YIELD_DISTRIBUTOR,
    functionName: "getClaimableYield",
    args: address && effectivePeriod !== undefined 
      ? [address, effectivePeriod] 
      : undefined,
    query: {
      enabled: !!address && effectivePeriod !== undefined,
    },
  });

  return {
    claimableYield: data as bigint | undefined,
    isLoading,
    error,
  };
}

// Get current distribution period from YieldDistributor
export function useCurrentDistributionPeriod() {
  const { data, isLoading, error } = useReadContract({
    address: CONTRACT_ADDRESSES.YIELD_DISTRIBUTOR,
    abi: CONTRACT_ABIS.YIELD_DISTRIBUTOR,
    functionName: "currentDistributionPeriod",
  });

  return {
    currentPeriod: data as bigint | undefined,
    isLoading,
    error,
  };
}

// Get total distributable per period from YieldDistributor
export function useTotalDistributablePerPeriod(period: bigint) {
  const { data, isLoading, error } = useReadContract({
    address: CONTRACT_ADDRESSES.YIELD_DISTRIBUTOR,
    abi: CONTRACT_ABIS.YIELD_DISTRIBUTOR,
    functionName: "totalDistributablePerPeriod",
    args: [period],
  });

  return {
    totalDistributable: data as bigint | undefined,
    isLoading,
    error,
  };
}

// Get yield earned from YieldStackingManager
export function useYieldEarned() {
  const { data, isLoading, error } = useReadContract({
    address: CONTRACT_ADDRESSES.YIELD_STACKING_MANAGER,
    abi: CONTRACT_ABIS.YIELD_STACKING_MANAGER,
    functionName: "getYieldEarned",
  });

  return {
    yieldEarned: data as bigint | undefined,
    isLoading,
    error,
  };
}

// Get total assets in vault from YieldStackingManager
export function useTotalAssetsInVault() {
  const { data, isLoading, error } = useReadContract({
    address: CONTRACT_ADDRESSES.YIELD_STACKING_MANAGER,
    abi: CONTRACT_ABIS.YIELD_STACKING_MANAGER,
    functionName: "getTotalAssetsInVault",
  });

  return {
    totalAssets: data as bigint | undefined,
    isLoading,
    error,
  };
}

// Get yield vault address from YieldStackingManager
export function useYieldVaultAddress() {
  const { data, isLoading, error } = useReadContract({
    address: CONTRACT_ADDRESSES.YIELD_STACKING_MANAGER,
    abi: CONTRACT_ABIS.YIELD_STACKING_MANAGER,
    functionName: "yieldVault",
  });

  return {
    vaultAddress: data as `0x${string}` | undefined,
    isLoading,
    error,
  };
}

// Get reserve threshold from YieldStackingManager
export function useReserveThreshold() {
  const { data, isLoading, error } = useReadContract({
    address: CONTRACT_ADDRESSES.YIELD_STACKING_MANAGER,
    abi: CONTRACT_ABIS.YIELD_STACKING_MANAGER,
    functionName: "reserveThreshold",
  });

  return {
    reserveThreshold: data as bigint | undefined,
    isLoading,
    error,
  };
}

// Get minimum deposit amount from YieldStackingManager
export function useMinimumDepositAmount() {
  const { data, isLoading, error } = useReadContract({
    address: CONTRACT_ADDRESSES.YIELD_STACKING_MANAGER,
    abi: CONTRACT_ABIS.YIELD_STACKING_MANAGER,
    functionName: "minimumDepositAmount",
  });

  return {
    minimumDeposit: data as bigint | undefined,
    isLoading,
    error,
  };
}

// Get auto deposit enabled status from YieldStackingManager
export function useAutoDepositEnabled() {
  const { data, isLoading, error } = useReadContract({
    address: CONTRACT_ADDRESSES.YIELD_STACKING_MANAGER,
    abi: CONTRACT_ABIS.YIELD_STACKING_MANAGER,
    functionName: "autoDepositEnabled",
  });

  return {
    autoDepositEnabled: data as boolean | undefined,
    isLoading,
    error,
  };
}

// Get total deposited from YieldStackingManager
export function useTotalDeposited() {
  const { data, isLoading, error } = useReadContract({
    address: CONTRACT_ADDRESSES.YIELD_STACKING_MANAGER,
    abi: CONTRACT_ABIS.YIELD_STACKING_MANAGER,
    functionName: "totalDeposited",
  });

  return {
    totalDeposited: data as bigint | undefined,
    isLoading,
    error,
  };
}

