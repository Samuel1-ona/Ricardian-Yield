// Hooks for writing to Stacks Clarity contracts using wallet connection
import { useState } from 'react';
import {
  Cl,
  PostConditionMode,
} from '@stacks/transactions';
import { STACKS_TESTNET } from '@stacks/network';
import { openContractCall } from '@stacks/connect';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { getContractAddress, parseContractAddress, getUSDCxAddress } from '@/lib/stacks-contracts';
import { useStacks } from './useStacks';

const network = STACKS_TESTNET; // TODO: Make configurable

/**
 * Hook for making contract calls using wallet connection (production-ready)
 * Uses @stacks/connect's openContractCall for wallet signing
 */
function useStacksWriteWallet() {
  const { address } = useStacks();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const makeCall = async (
    contractName: keyof typeof import('@/lib/stacks-contracts').STACKS_CONTRACTS,
    functionName: string,
    functionArgs: any[],
    options: {
      postConditions?: any[];
      postConditionMode?: PostConditionMode;
    } = {}
  ) => {
    if (!address) {
      const err = new Error('Please connect your Stacks wallet');
      setError(err);
      toast.error(err.message);
      throw err;
    }

    setIsPending(true);
    setError(null);

    try {
      const contractAddress = getContractAddress(contractName);
      const { address: contractAddr, contractName: name } = parseContractAddress(contractAddress);

      // Use openContractCall for wallet signing
      await openContractCall({
        contractAddress: contractAddr,
        contractName: name,
        functionName,
        functionArgs,
        network,
        postConditions: options.postConditions || [],
        postConditionMode: options.postConditionMode || PostConditionMode.Deny,
        onFinish: () => {
          toast.success('Transaction submitted!');
          setIsPending(false);
        },
        onCancel: () => {
          toast.error('Transaction cancelled');
          setIsPending(false);
        },
      });
    } catch (err: any) {
      const error = err instanceof Error ? err : new Error(err?.message || 'Transaction failed');
      setError(error);
      toast.error(error.message);
      setIsPending(false);
      throw error;
    }
  };

  return {
    makeCall,
    isPending,
    error,
  };
}

/**
 * Hook for depositing rent (USDCx) using wallet connection
 */
export function useDepositRentWallet() {
  const { address } = useStacks();
  const { makeCall, isPending, error } = useStacksWriteWallet();
  const queryClient = useQueryClient();
  const [isTransferring, setIsTransferring] = useState(false);

  const depositRent = async (propertyId: bigint, amount: string) => {
    if (!address) {
      toast.error('Please connect your Stacks wallet');
      return;
    }

    try {
      // Step 1: Transfer USDCx to rent vault using wallet
      setIsTransferring(true);
      toast.loading('Transferring USDCx to rent vault...', { id: 'transfer' });

      const usdcxAddress = getUSDCxAddress('testnet');
      const { address: usdcxContractAddr, contractName: usdcxContractName } = parseContractAddress(usdcxAddress);

      const rentVaultAddress = getContractAddress('rent-vault');
      const { address: vaultAddr } = parseContractAddress(rentVaultAddress);

      // Convert amount to micro USDCx (6 decimals)
      const amountMicro = BigInt(Math.floor(parseFloat(amount) * 1e6));

      // Transfer USDCx using wallet
      await openContractCall({
        contractAddress: usdcxContractAddr,
        contractName: usdcxContractName,
        functionName: 'transfer',
        functionArgs: [
          Cl.uint(amountMicro),
          Cl.principal(address),
          Cl.principal(vaultAddr),
          Cl.none(),
        ],
        network,
        onFinish: async () => {
          toast.success('USDCx transferred', { id: 'transfer' });
          setIsTransferring(false);

          // Invalidate USDCx balance query to refetch updated balance
          queryClient.invalidateQueries({ queryKey: ['usdcx-balance', address] });

          // Step 2: Call deposit-rent to update records
          toast.loading('Recording rent deposit...', { id: 'deposit' });

          await makeCall(
            'rent-vault',
            'deposit-rent',
            [Cl.uint(Number(propertyId)), Cl.uint(amountMicro)],
          );

          // Invalidate balance again after deposit-rent completes
          queryClient.invalidateQueries({ queryKey: ['usdcx-balance', address] });

          toast.success('Rent deposited successfully!', { id: 'deposit' });
        },
        onCancel: () => {
          toast.error('Transfer cancelled', { id: 'transfer' });
          setIsTransferring(false);
        },
      });
    } catch (err: any) {
      toast.error(err?.message || 'Failed to deposit rent');
      setIsTransferring(false);
      throw err;
    }
  };

  return {
    depositRent,
    isPending: isPending || isTransferring,
    isTransferring,
    error,
  };
}

/**
 * Hook for claiming yield using wallet connection
 */
export function useClaimYieldWallet() {
  const { makeCall, isPending, error } = useStacksWriteWallet();

  const claimYield = async (propertyId: bigint, period: bigint) => {
    try {
      toast.loading('Claiming yield...', { id: 'claim' });

      await makeCall(
        'yield-distributor',
        'claim-yield',
        [Cl.uint(Number(propertyId)), Cl.uint(Number(period))],
      );

      toast.success('Yield claimed successfully!', { id: 'claim' });
    } catch (err: any) {
      toast.error(err?.message || 'Failed to claim yield');
      throw err;
    }
  };

  return {
    claimYield,
    isPending,
    error,
  };
}

/**
 * Hook for recording operating expenses using wallet connection
 */
export function useRecordOperatingExpenseWallet() {
  const { makeCall, isPending, error } = useStacksWriteWallet();

  const recordExpense = async (propertyId: bigint, amount: string) => {
    try {
      // Convert amount to micro USDCx (6 decimals)
      const amountMicro = BigInt(Math.floor(parseFloat(amount) * 1e6));

      toast.loading('Recording operating expense...', { id: 'expense' });

      await makeCall(
        'cash-flow-engine',
        'record-operating-expense',
        [Cl.uint(Number(propertyId)), Cl.uint(amountMicro)],
      );

      toast.success('Operating expense recorded!', { id: 'expense' });
    } catch (err: any) {
      toast.error(err?.message || 'Failed to record expense');
      throw err;
    }
  };

  return {
    recordExpense,
    isPending,
    error,
  };
}

/**
 * Hook for creating CapEx proposals using wallet connection
 */
export function useCreateCapExProposalWallet() {
  const { makeCall, isPending, error } = useStacksWriteWallet();

  const createProposal = async (propertyId: bigint, amount: string, description: string) => {
    try {
      // Convert amount to micro USDCx (6 decimals)
      const amountMicro = BigInt(Math.floor(parseFloat(amount) * 1e6));

      toast.loading('Creating CapEx proposal...', { id: 'proposal' });

      await makeCall(
        'simple-dao',
        'create-proposal',
        [
          Cl.uint(Number(propertyId)),
          Cl.uint(amountMicro),
          Cl.stringAscii(description),
        ],
      );

      toast.success('CapEx proposal created!', { id: 'proposal' });
    } catch (err: any) {
      toast.error(err?.message || 'Failed to create proposal');
      throw err;
    }
  };

  return {
    createProposal,
    isPending,
    error,
  };
}

/**
 * Hook for voting on proposals using wallet connection
 */
export function useVoteProposalWallet() {
  const { makeCall, isPending, error } = useStacksWriteWallet();

  const voteFor = async (propertyId: bigint, proposalId: bigint) => {
    try {
      toast.loading('Voting for proposal...', { id: 'vote' });

      await makeCall(
        'simple-dao',
        'vote-for-proposal',
        [Cl.uint(Number(propertyId)), Cl.uint(Number(proposalId))],
      );

      toast.success('Vote recorded!', { id: 'vote' });
    } catch (err: any) {
      toast.error(err?.message || 'Failed to vote');
      throw err;
    }
  };

  const voteAgainst = async (propertyId: bigint, proposalId: bigint) => {
    try {
      toast.loading('Voting against proposal...', { id: 'vote' });

      await makeCall(
        'simple-dao',
        'vote-against-proposal',
        [Cl.uint(Number(propertyId)), Cl.uint(Number(proposalId))],
      );

      toast.success('Vote recorded!', { id: 'vote' });
    } catch (err: any) {
      toast.error(err?.message || 'Failed to vote');
      throw err;
    }
  };

  return {
    voteFor,
    voteAgainst,
    isPending,
    error,
  };
}

/**
 * Hook for distributing yield using wallet connection
 */
export function useDistributeYieldWallet() {
  const { makeCall, isPending, error } = useStacksWriteWallet();

  const distribute = async (propertyId: bigint) => {
    try {
      toast.loading('Distributing yield...', { id: 'distribute' });

      await makeCall(
        'yield-distributor',
        'distribute-yield',
        [Cl.uint(Number(propertyId))],
      );

      toast.success('Yield distributed!', { id: 'distribute' });
    } catch (err: any) {
      toast.error(err?.message || 'Failed to distribute yield');
      throw err;
    }
  };

  return {
    distribute,
    isPending,
    error,
  };
}

/**
 * Hook for minting a new property NFT using wallet connection
 */
export function useMintProperty() {
  const { makeCall, isPending, error } = useStacksWriteWallet();
  const { address } = useStacks();

  const mintProperty = async (
    location: string,
    valuation: string, // In USDCx (e.g., "1000000.00")
    monthlyRent: string, // In USDCx (e.g., "10000.00")
    metadataUri: string = ""
  ) => {
    if (!address) {
      toast.error('Please connect your Stacks wallet');
      return;
    }

    try {
      // Convert amounts to micro USDCx (6 decimals)
      const valuationMicro = BigInt(Math.floor(parseFloat(valuation) * 1e6));
      const monthlyRentMicro = BigInt(Math.floor(parseFloat(monthlyRent) * 1e6));

      toast.loading('Minting property NFT...', { id: 'mint' });

      await makeCall(
        'property-nft',
        'mint-property',
        [
          Cl.principal(address),
          Cl.stringAscii(location),
          Cl.uint(valuationMicro),
          Cl.uint(monthlyRentMicro),
          Cl.stringAscii(metadataUri || location), // Use location as metadata URI if not provided
        ],
      );

      toast.success('Property NFT minted successfully!', { id: 'mint' });
    } catch (err: any) {
      toast.error(err?.message || 'Failed to mint property');
      throw err;
    }
  };

  return {
    mintProperty,
    isPending,
    error,
  };
}

