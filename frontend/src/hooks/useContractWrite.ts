import { useWriteContract, useWaitForTransactionReceipt, useReadContract } from "wagmi";
import { useAccount } from "wagmi";
import { CONTRACT_ADDRESSES, CONTRACT_ABIS } from "@/lib/contracts";
import { parseUnits } from "viem";
import toast from "react-hot-toast";

// Hook for depositing rent using native MNT
export function useDepositRent() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const depositRent = async (amount: string) => {
    try {
      const amountWei = parseUnits(amount, 18); // MNT has 18 decimals
      
      await writeContract({
        address: CONTRACT_ADDRESSES.RENT_VAULT,
        abi: CONTRACT_ABIS.RENT_VAULT,
        functionName: "depositRent",
        args: [amountWei],
        value: amountWei, // Send native MNT
      });
    } catch (err: any) {
      toast.error(err?.message || "Failed to deposit rent");
      throw err;
    }
  };

  return {
    depositRent,
    isPending,
    isConfirming,
    isConfirmed,
    error,
    hash,
  };
}

// Hook for approving USDC spending
export function useApproveUSDC() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const approveUSDC = async (amount: bigint) => {
    try {
      await writeContract({
        address: CONTRACT_ADDRESSES.USDC,
        abi: [
          {
            name: "approve",
            type: "function",
            stateMutability: "nonpayable",
            inputs: [
              { name: "spender", type: "address" },
              { name: "amount", type: "uint256" },
            ],
            outputs: [{ name: "", type: "bool" }],
          },
        ],
        functionName: "approve",
        args: [CONTRACT_ADDRESSES.RENT_VAULT, amount],
      });
    } catch (err: any) {
      toast.error(err?.message || "Failed to approve USDC");
      throw err;
    }
  };

  return {
    approveUSDC,
    isPending,
    isConfirming,
    isConfirmed,
    error,
    hash,
  };
}

// Hook for claiming yield
export function useClaimYield() {
  const { address } = useAccount();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  // Get current period first
  const { data: currentPeriod } = useReadContract({
    address: CONTRACT_ADDRESSES.YIELD_DISTRIBUTOR,
    abi: CONTRACT_ABIS.YIELD_DISTRIBUTOR,
    functionName: "currentDistributionPeriod",
  });

  const claimYield = async (period?: bigint) => {
    if (!address) {
      toast.error("Please connect your wallet");
      return;
    }

    const effectivePeriod = period ?? currentPeriod;
    if (effectivePeriod === undefined) {
      toast.error("Unable to determine distribution period");
      return;
    }

    try {
      await writeContract({
        address: CONTRACT_ADDRESSES.YIELD_DISTRIBUTOR,
        abi: CONTRACT_ABIS.YIELD_DISTRIBUTOR,
        functionName: "claimYield",
        args: [effectivePeriod],
      });
    } catch (err: any) {
      toast.error(err?.message || "Failed to claim yield");
      throw err;
    }
  };

  return {
    claimYield,
    isPending,
    isConfirming,
    isConfirmed,
    error,
    hash,
  };
}

// Hook for recording operating expenses
export function useRecordOperatingExpense() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const recordExpense = async (amount: string) => {
    try {
      const amountWei = parseUnits(amount, 6); // USDC has 6 decimals
      
      await writeContract({
        address: CONTRACT_ADDRESSES.CASH_FLOW_ENGINE,
        abi: CONTRACT_ABIS.CASH_FLOW_ENGINE,
        functionName: "recordOperatingExpense",
        args: [amountWei],
      });
    } catch (err: any) {
      toast.error(err?.message || "Failed to record expense");
      throw err;
    }
  };

  return {
    recordExpense,
    isPending,
    isConfirming,
    isConfirmed,
    error,
    hash,
  };
}

// Hook for creating CapEx proposals
export function useCreateCapExProposal() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const createProposal = async (amount: string, description: string) => {
    try {
      const amountWei = parseUnits(amount, 6); // USDC has 6 decimals
      
      await writeContract({
        address: CONTRACT_ADDRESSES.DAO,
        abi: CONTRACT_ABIS.DAO,
        functionName: "createProposal",
        args: [amountWei, description],
      });
    } catch (err: any) {
      toast.error(err?.message || "Failed to create proposal");
      throw err;
    }
  };

  return {
    createProposal,
    isPending,
    isConfirming,
    isConfirmed,
    error,
    hash,
  };
}

// Hook for approving proposals (owner only)
export function useApproveProposal() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const approveProposal = async (proposalId: bigint) => {
    try {
      await writeContract({
        address: CONTRACT_ADDRESSES.DAO,
        abi: CONTRACT_ABIS.DAO,
        functionName: "approveProposal",
        args: [proposalId],
      });
    } catch (err: any) {
      toast.error(err?.message || "Failed to approve proposal");
      throw err;
    }
  };

  return {
    approveProposal,
    isPending,
    isConfirming,
    isConfirmed,
    error,
    hash,
  };
}

// Hook for distributing yield (owner only)
export function useDistributeYield() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const distribute = async () => {
    try {
      await writeContract({
        address: CONTRACT_ADDRESSES.YIELD_DISTRIBUTOR,
        abi: CONTRACT_ABIS.YIELD_DISTRIBUTOR,
        functionName: "distributeYield",
      });
    } catch (err: any) {
      toast.error(err?.message || "Failed to distribute yield");
      throw err;
    }
  };

  return {
    distribute,
    isPending,
    isConfirming,
    isConfirmed,
    error,
    hash,
  };
}

// Hook for setting yield vault (owner only)
export function useSetYieldVault() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const setYieldVault = async (vaultAddress: `0x${string}`) => {
    try {
      await writeContract({
        address: CONTRACT_ADDRESSES.YIELD_STACKING_MANAGER,
        abi: CONTRACT_ABIS.YIELD_STACKING_MANAGER,
        functionName: "setYieldVault",
        args: [vaultAddress],
      });
    } catch (err: any) {
      toast.error(err?.message || "Failed to set yield vault");
      throw err;
    }
  };

  return {
    setYieldVault,
    isPending,
    isConfirming,
    isConfirmed,
    error,
    hash,
  };
}

// Hook for setting reserve threshold (owner only)
export function useSetReserveThreshold() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const setReserveThreshold = async (threshold: string) => {
    try {
      const thresholdWei = parseUnits(threshold, 6); // USDC has 6 decimals
      await writeContract({
        address: CONTRACT_ADDRESSES.YIELD_STACKING_MANAGER,
        abi: CONTRACT_ABIS.YIELD_STACKING_MANAGER,
        functionName: "setReserveThreshold",
        args: [thresholdWei],
      });
    } catch (err: any) {
      toast.error(err?.message || "Failed to set reserve threshold");
      throw err;
    }
  };

  return {
    setReserveThreshold,
    isPending,
    isConfirming,
    isConfirmed,
    error,
    hash,
  };
}

// Hook for setting minimum deposit amount (owner only)
export function useSetMinimumDepositAmount() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const setMinimumDeposit = async (minimum: string) => {
    try {
      const minimumWei = parseUnits(minimum, 6); // USDC has 6 decimals
      await writeContract({
        address: CONTRACT_ADDRESSES.YIELD_STACKING_MANAGER,
        abi: CONTRACT_ABIS.YIELD_STACKING_MANAGER,
        functionName: "setMinimumDepositAmount",
        args: [minimumWei],
      });
    } catch (err: any) {
      toast.error(err?.message || "Failed to set minimum deposit amount");
      throw err;
    }
  };

  return {
    setMinimumDeposit,
    isPending,
    isConfirming,
    isConfirmed,
    error,
    hash,
  };
}

// Hook for setting auto deposit enabled (owner only)
export function useSetAutoDepositEnabled() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const setAutoDeposit = async (enabled: boolean) => {
    try {
      await writeContract({
        address: CONTRACT_ADDRESSES.YIELD_STACKING_MANAGER,
        abi: CONTRACT_ABIS.YIELD_STACKING_MANAGER,
        functionName: "setAutoDepositEnabled",
        args: [enabled],
      });
    } catch (err: any) {
      toast.error(err?.message || "Failed to set auto deposit");
      throw err;
    }
  };

  return {
    setAutoDeposit,
    isPending,
    isConfirming,
    isConfirmed,
    error,
    hash,
  };
}

