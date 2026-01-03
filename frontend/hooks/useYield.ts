import { useReadContract } from "wagmi";
import { CONTRACT_ADDRESSES } from "@/lib/contracts";

// Placeholder ABI - will be replaced with actual contract ABI
const YIELD_DISTRIBUTOR_ABI = [
  {
    name: "getClaimableYield",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "user", type: "address" },
      { name: "period", type: "uint256" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "getCurrentPeriod",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "totalDistributablePerPeriod",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "period", type: "uint256" }],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

export function useClaimableYield(userAddress: string | undefined, period: number) {
  const { data, isLoading, error } = useReadContract({
    address: CONTRACT_ADDRESSES.PROPERTY_CASH_FLOW_SYSTEM as `0x${string}`,
    abi: YIELD_DISTRIBUTOR_ABI,
    functionName: "getClaimableYield",
    args: userAddress ? [userAddress as `0x${string}`, BigInt(period)] : undefined,
    query: {
      enabled: !!userAddress,
    },
  });

  return {
    claimableYield: data,
    isLoading,
    error,
  };
}

export function useCurrentPeriod() {
  const { data, isLoading, error } = useReadContract({
    address: CONTRACT_ADDRESSES.PROPERTY_CASH_FLOW_SYSTEM as `0x${string}`,
    abi: YIELD_DISTRIBUTOR_ABI,
    functionName: "getCurrentPeriod",
  });

  return {
    currentPeriod: data,
    isLoading,
    error,
  };
}

