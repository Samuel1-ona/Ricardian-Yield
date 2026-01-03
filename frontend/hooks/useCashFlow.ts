import { useReadContract } from "wagmi";
import { CONTRACT_ADDRESSES } from "@/lib/contracts";

// Placeholder ABI - will be replaced with actual contract ABI
const CASH_FLOW_ENGINE_ABI = [
  {
    name: "operatingExpenses",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "capexSpent",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "workingCapitalReserve",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

export function useOperatingExpenses() {
  const { data, isLoading, error } = useReadContract({
    address: CONTRACT_ADDRESSES.PROPERTY_CASH_FLOW_SYSTEM as `0x${string}`,
    abi: CASH_FLOW_ENGINE_ABI,
    functionName: "operatingExpenses",
  });

  return {
    operatingExpenses: data,
    isLoading,
    error,
  };
}

export function useCapExSpent() {
  const { data, isLoading, error } = useReadContract({
    address: CONTRACT_ADDRESSES.PROPERTY_CASH_FLOW_SYSTEM as `0x${string}`,
    abi: CASH_FLOW_ENGINE_ABI,
    functionName: "capexSpent",
  });

  return {
    capexSpent: data,
    isLoading,
    error,
  };
}

export function useWorkingCapitalReserve() {
  const { data, isLoading, error } = useReadContract({
    address: CONTRACT_ADDRESSES.PROPERTY_CASH_FLOW_SYSTEM as `0x${string}`,
    abi: CASH_FLOW_ENGINE_ABI,
    functionName: "workingCapitalReserve",
  });

  return {
    workingCapitalReserve: data,
    isLoading,
    error,
  };
}

