import { useReadContract } from "wagmi";
import { CONTRACT_ADDRESSES, CONTRACT_ABIS } from "@/lib/contracts";

// Get property data from PropertyNFT contract
// Note: propertyId is needed - get it from the main system contract first
export function usePropertyData(propertyId?: bigint) {
  // First, get propertyId from main system if not provided
  const { data: systemPropertyId } = useReadContract({
    address: CONTRACT_ADDRESSES.PROPERTY_CASH_FLOW_SYSTEM,
    abi: CONTRACT_ABIS.PROPERTY_CASH_FLOW_SYSTEM,
    functionName: "propertyId",
  });

  const effectivePropertyId = propertyId ?? systemPropertyId;

  const { data, isLoading, error } = useReadContract({
    address: CONTRACT_ADDRESSES.PROPERTY_NFT,
    abi: CONTRACT_ABIS.PROPERTY_NFT,
    functionName: "getPropertyData",
    args: effectivePropertyId !== undefined ? [effectivePropertyId] : undefined,
    query: {
      enabled: effectivePropertyId !== undefined,
    },
  });

  return {
    propertyData: data,
    isLoading,
    error,
  };
}

// Get distributable cash flow from CashFlowEngine
export function useDistributableCashFlow() {
  const { data, isLoading, error } = useReadContract({
    address: CONTRACT_ADDRESSES.CASH_FLOW_ENGINE,
    abi: CONTRACT_ABIS.CASH_FLOW_ENGINE,
    functionName: "getDistributableCashFlow",
  });

  return {
    distributableCashFlow: data,
    isLoading,
    error,
  };
}

// Get cash flow from assets from CashFlowEngine
export function useCashFlowFromAssets() {
  const { data, isLoading, error } = useReadContract({
    address: CONTRACT_ADDRESSES.CASH_FLOW_ENGINE,
    abi: CONTRACT_ABIS.CASH_FLOW_ENGINE,
    functionName: "getCashFlowFromAssets",
  });

  return {
    cashFlowFromAssets: data,
    isLoading,
    error,
  };
}

// Get property ID from main system
export function usePropertyId() {
  const { data, isLoading, error } = useReadContract({
    address: CONTRACT_ADDRESSES.PROPERTY_CASH_FLOW_SYSTEM,
    abi: CONTRACT_ABIS.PROPERTY_CASH_FLOW_SYSTEM,
    functionName: "propertyId",
  });

  return {
    propertyId: data,
    isLoading,
    error,
  };
}

