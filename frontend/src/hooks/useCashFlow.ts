import { useReadContract } from "wagmi";
import { CONTRACT_ADDRESSES, CONTRACT_ABIS } from "@/lib/contracts";

// Get operating expenses from CashFlowEngine
export function useOperatingExpenses() {
  const { data, isLoading, error } = useReadContract({
    address: CONTRACT_ADDRESSES.CASH_FLOW_ENGINE,
    abi: CONTRACT_ABIS.CASH_FLOW_ENGINE,
    functionName: "operatingExpenses",
  });

  return {
    operatingExpenses: data as bigint | undefined,
    isLoading,
    error,
  };
}

// Get CapEx spent from CashFlowEngine
export function useCapExSpent() {
  const { data, isLoading, error } = useReadContract({
    address: CONTRACT_ADDRESSES.CASH_FLOW_ENGINE,
    abi: CONTRACT_ABIS.CASH_FLOW_ENGINE,
    functionName: "capexSpent",
  });

  return {
    capexSpent: data,
    isLoading,
    error,
  };
}

// Get working capital reserve from CashFlowEngine
export function useWorkingCapitalReserve() {
  const { data, isLoading, error } = useReadContract({
    address: CONTRACT_ADDRESSES.CASH_FLOW_ENGINE,
    abi: CONTRACT_ABIS.CASH_FLOW_ENGINE,
    functionName: "workingCapitalReserve",
  });

  return {
    workingCapitalReserve: data as bigint | undefined,
    isLoading,
    error,
  };
}

// Get rent collected from RentVault
export function useRentCollected() {
  const { data, isLoading, error } = useReadContract({
    address: CONTRACT_ADDRESSES.RENT_VAULT,
    abi: CONTRACT_ABIS.RENT_VAULT,
    functionName: "rentCollected",
  });

  return {
    rentCollected: data as bigint | undefined,
    isLoading,
    error,
  };
}

// Get current period from CashFlowEngine
export function useCurrentPeriod() {
  const { data, isLoading, error } = useReadContract({
    address: CONTRACT_ADDRESSES.CASH_FLOW_ENGINE,
    abi: CONTRACT_ABIS.CASH_FLOW_ENGINE,
    functionName: "getCurrentPeriod",
  });

  return {
    currentPeriod: data as bigint | undefined,
    isLoading,
    error,
  };
}

// Get rent for a specific period from RentVault
export function useRentForPeriod(period: bigint | undefined) {
  const { data, isLoading, error } = useReadContract({
    address: CONTRACT_ADDRESSES.RENT_VAULT,
    abi: CONTRACT_ABIS.RENT_VAULT,
    functionName: "getRentForPeriod",
    args: period !== undefined ? [period] : undefined,
    query: {
      enabled: period !== undefined,
    },
  });

  return {
    rentForPeriod: data,
    isLoading,
    error,
  };
}

// Get current period from RentVault
export function useRentVaultCurrentPeriod() {
  const { data, isLoading, error } = useReadContract({
    address: CONTRACT_ADDRESSES.RENT_VAULT,
    abi: CONTRACT_ABIS.RENT_VAULT,
    functionName: "currentPeriod",
  });

  return {
    currentPeriod: data,
    isLoading,
    error,
  };
}

