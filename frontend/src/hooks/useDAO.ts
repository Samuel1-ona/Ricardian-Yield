import { useReadContract } from "wagmi";
import { CONTRACT_ADDRESSES, CONTRACT_ABIS } from "@/lib/contracts";

// Get proposal count from DAO
export function useProposalCount() {
  const { data, isLoading, error } = useReadContract({
    address: CONTRACT_ADDRESSES.DAO,
    abi: CONTRACT_ABIS.DAO,
    functionName: "proposalCount",
  });

  return {
    proposalCount: data as bigint | undefined,
    isLoading,
    error,
  };
}

// Proposal type from SimpleDAO contract
export interface Proposal {
  amount: bigint;
  description: string;
  approved: boolean;
  proposer: `0x${string}`;
  timestamp: bigint;
}

// Get a specific proposal from DAO
export function useProposal(proposalId: bigint | undefined) {
  const { data, isLoading, error } = useReadContract({
    address: CONTRACT_ADDRESSES.DAO,
    abi: CONTRACT_ABIS.DAO,
    functionName: "getProposal",
    args: proposalId !== undefined ? [proposalId] : undefined,
    query: {
      enabled: proposalId !== undefined,
    },
  });

  return {
    proposal: data as Proposal | undefined,
    isLoading,
    error,
  };
}

// Check if a proposal is approved
export function useIsProposalApproved(proposalId: bigint | undefined) {
  const { data, isLoading, error } = useReadContract({
    address: CONTRACT_ADDRESSES.DAO,
    abi: CONTRACT_ABIS.DAO,
    functionName: "isProposalApproved",
    args: proposalId !== undefined ? [proposalId] : undefined,
    query: {
      enabled: proposalId !== undefined,
    },
  });

  return {
    isApproved: data as boolean | undefined,
    isLoading,
    error,
  };
}

