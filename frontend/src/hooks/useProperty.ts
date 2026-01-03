import { useReadContract } from "wagmi";
import { CONTRACT_ADDRESSES } from "@/lib/contracts";

// Placeholder ABI - will be replaced with actual contract ABI
const PROPERTY_CASH_FLOW_SYSTEM_ABI = [
  {
    name: "getPropertyData",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [
      {
        name: "location",
        type: "string",
      },
      {
        name: "valuation",
        type: "uint256",
      },
      {
        name: "monthlyRent",
        type: "uint256",
      },
      {
        name: "metadataURI",
        type: "string",
      },
    ],
  },
  {
    name: "getDistributableCashFlow",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "getCashFlowFromAssets",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "int256" }],
  },
] as const;

export function usePropertyData() {
  const { data, isLoading, error } = useReadContract({
    address: CONTRACT_ADDRESSES.PROPERTY_CASH_FLOW_SYSTEM as `0x${string}`,
    abi: PROPERTY_CASH_FLOW_SYSTEM_ABI,
    functionName: "getPropertyData",
  });

  return {
    propertyData: data,
    isLoading,
    error,
  };
}

export function useDistributableCashFlow() {
  const { data, isLoading, error } = useReadContract({
    address: CONTRACT_ADDRESSES.PROPERTY_CASH_FLOW_SYSTEM as `0x${string}`,
    abi: PROPERTY_CASH_FLOW_SYSTEM_ABI,
    functionName: "getDistributableCashFlow",
  });

  return {
    distributableCashFlow: data,
    isLoading,
    error,
  };
}

export function useCashFlowFromAssets() {
  const { data, isLoading, error } = useReadContract({
    address: CONTRACT_ADDRESSES.PROPERTY_CASH_FLOW_SYSTEM as `0x${string}`,
    abi: PROPERTY_CASH_FLOW_SYSTEM_ABI,
    functionName: "getCashFlowFromAssets",
  });

  return {
    cashFlowFromAssets: data,
    isLoading,
    error,
  };
}

