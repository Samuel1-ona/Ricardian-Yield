// Hook for bridging USDC from Ethereum to USDCx on Stacks
import { useState } from 'react';
import { parseUnits, type Address } from 'viem';
import toast from 'react-hot-toast';
import { XRESERVE_CONTRACTS, ETH_USDC_CONTRACTS, DOMAIN_IDS } from '@/lib/stacks-contracts';
import { encodeStacksAddressForBridge } from '@/lib/bridge-helpers';
import { useEthereum } from './useEthereum';

// xReserve ABI
const X_RESERVE_ABI = [
  {
    name: "depositToRemote",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "value", type: "uint256" },
      { name: "remoteDomain", type: "uint32" },
      { name: "remoteRecipient", type: "bytes32" },
      { name: "localToken", type: "address" },
      { name: "maxFee", type: "uint256" },
      { name: "hookData", type: "bytes" },
    ],
    outputs: [],
  },
] as const;

// ERC20 ABI
const ERC20_ABI = [
  {
    name: "approve",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "success", type: "bool" }],
  },
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "balance", type: "uint256" }],
  },
] as const;

interface UseBridgeUSDCOptions {
  network?: 'testnet' | 'mainnet';
}

/**
 * Hook for bridging USDC from Ethereum to USDCx on Stacks
 * 
 * This hook handles:
 * 1. Checking USDC and ETH balances
 * 2. Approving xReserve to spend USDC
 * 3. Calling depositToRemote on xReserve contract
 * 
 * Requires MetaMask wallet connection via useEthereum hook
 */
export function useBridgeUSDC(options: UseBridgeUSDCOptions = {}) {
  const { network = 'testnet' } = options;
  const { walletClient, publicClient, address, isConnected, connect, chainId, switchToSepolia } = useEthereum(network);
  
  const [isPending, setIsPending] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isDepositing, setIsDepositing] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Sepolia chain ID
  const SEPOLIA_CHAIN_ID = 11155111;

  const bridgeUSDC = async (
    amount: string, // Amount in USDC (e.g., "1.00")
    stacksRecipient: string, // Stacks address to receive USDCx
  ) => {
    if (!isConnected || !walletClient || !publicClient || !address) {
      const err = new Error('Please connect your MetaMask wallet');
      setError(err);
      toast.error(err.message);
      // Try to connect automatically
      try {
        await connect();
      } catch {
        // Connection failed, user needs to connect manually
      }
      throw err;
    }

    // Check if on correct network (Sepolia for testnet)
    if (network === 'testnet' && chainId !== SEPOLIA_CHAIN_ID) {
      const err = new Error('Please switch to Sepolia testnet');
      setError(err);
      toast.error('You must be on Sepolia testnet. Switching now...', { duration: 3000 });
      try {
        await switchToSepolia();
        // Wait a moment for network switch
        await new Promise(resolve => setTimeout(resolve, 1000));
        // Retry after network switch
        return bridgeUSDC(amount, stacksRecipient);
      } catch (switchError) {
        toast.error('Failed to switch network. Please switch to Sepolia manually in MetaMask.');
        throw err;
      }
    }

    setIsPending(true);
    setError(null);

    try {
      // Check native ETH balance
      const nativeBalance = await publicClient.getBalance({
        address,
      });

      if (nativeBalance === 0n) {
        throw new Error('Insufficient native ETH balance for gas fees');
      }

      // Prepare deposit params (USDC has 6 decimals)
      const value = parseUnits(amount, 6);
      const maxFee = parseUnits('0', 6);
      const remoteRecipient = encodeStacksAddressForBridge(stacksRecipient);
      const hookData = '0x' as const;

      // Check USDC balance with better error handling
      let usdcBalance;
      try {
        usdcBalance = await publicClient.readContract({
          address: ETH_USDC_CONTRACTS[network] as Address,
          abi: ERC20_ABI,
          functionName: 'balanceOf',
          args: [address],
        });
      } catch (readError: any) {
        // If contract read fails, check if it's a network issue
        if (readError.message?.includes('returned no data') || readError.message?.includes('0x')) {
          throw new Error(
            `Failed to read USDC balance. Make sure you're on ${network === 'testnet' ? 'Sepolia testnet' : 'Ethereum mainnet'} and the contract exists at this address.`
          );
        }
        throw readError;
      }

      if (usdcBalance < value) {
        throw new Error(
          `Insufficient USDC balance. Required: ${amount} USDC, Have: ${Number(usdcBalance) / 1e6} USDC`
        );
      }

      // Step 1: Approve xReserve to spend USDC
      setIsApproving(true);
      toast.loading('Approving xReserve to spend USDC...', { id: 'approve' });

      const approveTxHash = await walletClient.writeContract({
        address: ETH_USDC_CONTRACTS[network] as Address,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [XRESERVE_CONTRACTS[network] as Address, value],
        chain: walletClient.chain || undefined,
      } as any);

      await publicClient.waitForTransactionReceipt({ hash: approveTxHash });
      toast.success('Approval confirmed', { id: 'approve' });
      setIsApproving(false);

      // Step 2: Deposit to remote (Stacks)
      setIsDepositing(true);
      toast.loading('Initiating bridge deposit to Stacks...', { id: 'deposit' });

      const depositTxHash = await walletClient.writeContract({
        address: XRESERVE_CONTRACTS[network] as Address,
        abi: X_RESERVE_ABI,
        functionName: 'depositToRemote',
        args: [
          value,
          DOMAIN_IDS.STACKS,
          remoteRecipient,
          ETH_USDC_CONTRACTS[network] as Address,
          maxFee,
          hookData,
        ],
        chain: walletClient.chain || undefined,
      } as any);

      await publicClient.waitForTransactionReceipt({ hash: depositTxHash });
      toast.success('Bridge deposit initiated! USDCx will be minted on Stacks in ~15 minutes.', { id: 'deposit' });
      setIsDepositing(false);
      setIsPending(false);

      return depositTxHash;
    } catch (err: any) {
      const error = err instanceof Error ? err : new Error(err?.message || 'Bridge failed');
      setError(error);
      toast.error(error.message);
      setIsPending(false);
      setIsApproving(false);
      setIsDepositing(false);
      throw error;
    }
  };

  return {
    bridgeUSDC,
    isPending,
    isApproving,
    isDepositing,
    error,
  };
}

