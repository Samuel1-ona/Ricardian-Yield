// Hooks for writing to Stacks Clarity contracts
import { useState } from 'react';
import {
  makeContractCall,
  broadcastTransaction,
  Cl,
  AnchorMode,
  PostConditionMode,
} from '@stacks/transactions';
import { STACKS_TESTNET } from '@stacks/network';
import toast from 'react-hot-toast';
import { getContractAddress, parseContractAddress, getUSDCxAddress } from '@/lib/stacks-contracts';
import { useStacks } from './useStacks';

const network = STACKS_TESTNET; // TODO: Make configurable

/**
 * Generic hook for making contract calls on Stacks
 * 
 * Note: This hook requires a Stacks private key for signing transactions.
 * In production, use @stacks/connect-react or @stacks/wallet-sdk for wallet connection.
 */
function useStacksWrite() {
  const { address } = useStacks();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // TODO: In production, get private key from wallet connection
  // For now, this is a placeholder - you'll need to provide the private key
  const getPrivateKey = (): string | null => {
    // In production, get from wallet connection
    // For testing, you can store it in env or get from user input
    return import.meta.env.VITE_STACKS_PRIVATE_KEY || null;
  };

  const makeCall = async (
    contractName: keyof typeof import('@/lib/stacks-contracts').STACKS_CONTRACTS,
    functionName: string,
    functionArgs: any[],
    options: {
      postConditions?: any[];
      postConditionMode?: PostConditionMode;
      anchorMode?: AnchorMode;
      privateKey?: string; // Optional override for private key
    } = {}
  ) => {
    if (!address) {
      const err = new Error('Please connect your Stacks wallet');
      setError(err);
      toast.error(err.message);
      throw err;
    }

    const privateKey = options.privateKey || getPrivateKey();
    if (!privateKey) {
      const err = new Error('Stacks private key is required. Set VITE_STACKS_PRIVATE_KEY or provide it in options.');
      setError(err);
      toast.error(err.message);
      throw err;
    }

    setIsPending(true);
    setError(null);

    try {
      const contractAddress = getContractAddress(contractName);
      const { address: contractAddr, contractName: name } = parseContractAddress(contractAddress);

      const transaction = await makeContractCall({
        contractAddress: contractAddr,
        contractName: name,
        functionName,
        functionArgs,
        network,
        postConditions: options.postConditions || [],
        postConditionMode: options.postConditionMode || PostConditionMode.Deny,
        senderKey: privateKey,
      });

      const result = await broadcastTransaction({
        transaction,
        network,
      });

      if ('error' in result) {
        throw new Error(result.error);
      }

      setIsPending(false);
      return result.txid;
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
 * Hook for depositing rent (USDCx)
 * 
 * Note: This requires two steps:
 * 1. Transfer USDCx to rent vault using SIP-010 ft-transfer
 * 2. Call deposit-rent to update records
 */
export function useDepositRent() {
  const { address } = useStacks();
  const { makeCall, isPending, error } = useStacksWrite();
  const [isTransferring, setIsTransferring] = useState(false);

  const depositRent = async (propertyId: bigint, amount: string) => {
    if (!address) {
      toast.error('Please connect your Stacks wallet');
      return;
    }

    try {
      // Step 1: Transfer USDCx to rent vault
      setIsTransferring(true);
      toast.loading('Transferring USDCx to rent vault...', { id: 'transfer' });

      const usdcxAddress = getUSDCxAddress('testnet');
      const { address: usdcxContractAddr, contractName: usdcxContractName } = parseContractAddress(usdcxAddress);

      const rentVaultAddress = getContractAddress('rent-vault');
      const { address: vaultAddr } = parseContractAddress(rentVaultAddress);

      // Convert amount to micro USDCx (6 decimals)
      const amountMicro = BigInt(Math.floor(parseFloat(amount) * 1e6));

      // Get private key (same as in makeCall)
      const privateKey = import.meta.env.VITE_STACKS_PRIVATE_KEY;
      if (!privateKey) {
        throw new Error('Stacks private key is required. Set VITE_STACKS_PRIVATE_KEY environment variable.');
      }

      // Transfer USDCx to rent vault
      const transferTx = await makeContractCall({
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
        senderKey: privateKey,
      });

      const transferResult = await broadcastTransaction({
        transaction: transferTx,
        network,
      });

      if ('error' in transferResult) {
        throw new Error(transferResult.error);
      }

      toast.success('USDCx transferred', { id: 'transfer' });
      setIsTransferring(false);

      // Step 2: Call deposit-rent to update records
      toast.loading('Recording rent deposit...', { id: 'deposit' });

      await makeCall(
        'rent-vault',
        'deposit-rent',
        [Cl.uint(Number(propertyId)), Cl.uint(amountMicro)],
      );

      toast.success('Rent deposited successfully!', { id: 'deposit' });
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
 * Hook for claiming yield
 */
export function useClaimYield() {
  const { makeCall, isPending, error } = useStacksWrite();

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
 * Hook for recording operating expenses
 */
export function useRecordOperatingExpense() {
  const { makeCall, isPending, error } = useStacksWrite();

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
 * Hook for creating CapEx proposals
 */
export function useCreateCapExProposal() {
  const { makeCall, isPending, error } = useStacksWrite();

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
 * Hook for voting on proposals
 */
export function useVoteProposal() {
  const { makeCall, isPending, error } = useStacksWrite();

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
 * Hook for distributing yield (property owner only)
 */
export function useDistributeYield() {
  const { makeCall, isPending, error } = useStacksWrite();

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
 * Hook for recording CapEx (after proposal approval)
 */
export function useRecordCapEx() {
  const { makeCall, isPending, error } = useStacksWrite();

  const recordCapEx = async (propertyId: bigint, amount: string, proposalId: bigint) => {
    try {
      // Convert amount to micro USDCx (6 decimals)
      const amountMicro = BigInt(Math.floor(parseFloat(amount) * 1e6));

      toast.loading('Recording CapEx...', { id: 'capex' });

      await makeCall(
        'cash-flow-engine',
        'record-capex',
        [
          Cl.uint(Number(propertyId)),
          Cl.uint(amountMicro),
          Cl.uint(Number(proposalId)),
        ],
      );

      toast.success('CapEx recorded!', { id: 'capex' });
    } catch (err: any) {
      toast.error(err?.message || 'Failed to record CapEx');
      throw err;
    }
  };

  return {
    recordCapEx,
    isPending,
    error,
  };
}

