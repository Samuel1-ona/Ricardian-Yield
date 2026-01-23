// Hook for Ethereum wallet connection (MetaMask)
import { useState, useEffect, useCallback } from 'react';
import { createWalletClient, createPublicClient, type Address, getAddress } from 'viem';
import { custom } from 'viem';
import { sepolia } from 'viem/chains';
import toast from 'react-hot-toast';

// Sepolia chain ID
const SEPOLIA_CHAIN_ID = 11155111;

// Type for Ethereum provider
interface EthereumProvider {
  request: (args: { method: string; params?: any[] }) => Promise<any>;
  on: (event: string, handler: (...args: any[]) => void) => void;
  removeListener: (event: string, handler: (...args: any[]) => void) => void;
  isMetaMask?: boolean;
}

export interface EthereumAccount {
  address: Address;
}

interface UseEthereumReturn {
  account: EthereumAccount | null;
  isConnected: boolean;
  isLoading: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  address: Address | null;
  walletClient: ReturnType<typeof createWalletClient> | null;
  publicClient: ReturnType<typeof createPublicClient> | null;
  chainId: number | null;
  switchToSepolia: () => Promise<void>;
}

/**
 * Hook for connecting to Ethereum wallet (MetaMask)
 */
export function useEthereum(network: 'testnet' | 'mainnet' = 'testnet'): UseEthereumReturn {
  const [account, setAccount] = useState<EthereumAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [walletClient, setWalletClient] = useState<ReturnType<typeof createWalletClient> | null>(null);
  const [publicClient, setPublicClient] = useState<ReturnType<typeof createPublicClient> | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);

  const chain = network === 'testnet' ? sepolia : undefined; // TODO: Add mainnet chain

  // Function to get current chain ID
  const getChainId = useCallback(async (ethereum: EthereumProvider): Promise<number | null> => {
    try {
      const chainIdHex = await ethereum.request({ method: 'eth_chainId' });
      return chainIdHex ? parseInt(chainIdHex, 16) : null;
    } catch (error) {
      console.error('Error getting chain ID:', error);
      return null;
    }
  }, []);

  // Function to switch to Sepolia
  const switchToSepolia = useCallback(async () => {
    const ethereum = typeof window !== 'undefined' && window.ethereum
      ? (window.ethereum as unknown as EthereumProvider)
      : undefined;

    if (!ethereum) {
      throw new Error('MetaMask is not installed');
    }

    try {
      await ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${SEPOLIA_CHAIN_ID.toString(16)}` }], // 0xaa36a7
      });
      toast.success('Switched to Sepolia testnet');
    } catch (switchError: any) {
      // This error code indicates that the chain has not been added to MetaMask
      if (switchError.code === 4902) {
        try {
          await ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: `0x${SEPOLIA_CHAIN_ID.toString(16)}`,
                chainName: 'Sepolia',
                nativeCurrency: {
                  name: 'ETH',
                  symbol: 'ETH',
                  decimals: 18,
                },
                rpcUrls: ['https://ethereum-sepolia.publicnode.com'],
                blockExplorerUrls: ['https://sepolia.etherscan.io'],
              },
            ],
          });
          toast.success('Sepolia testnet added and switched');
        } catch (addError) {
          toast.error('Failed to add Sepolia network');
          throw addError;
        }
      } else {
        toast.error('Failed to switch network');
        throw switchError;
      }
    }
  }, []);

  useEffect(() => {
    // Check if MetaMask is installed
    const ethereum = typeof window !== 'undefined' && window.ethereum 
      ? (window.ethereum as unknown as EthereumProvider) 
      : undefined;
    
    if (!ethereum) {
      setIsLoading(false);
      return;
    }

    // Check if already connected
    const checkConnection = async () => {
      try {
        const accounts = await ethereum.request({ method: 'eth_accounts' });
        const currentChainId = await getChainId(ethereum);
        setChainId(currentChainId);
        
        if (accounts.length > 0) {
          const address = getAddress(accounts[0]);
          setAccount({ address });
          
          // Setup clients
          const client = createWalletClient({
            account: address,
            chain,
            transport: custom(ethereum),
          });
          const pubClient = createPublicClient({
            chain,
            transport: custom(ethereum),
          });
          setWalletClient(client);
          setPublicClient(pubClient);
        }
      } catch (error) {
        console.error('Error checking Ethereum connection:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkConnection();

    // Listen for account changes
    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        setAccount(null);
        setWalletClient(null);
        setPublicClient(null);
      } else {
        const address = getAddress(accounts[0]);
        setAccount({ address });
        const client = createWalletClient({
          account: address,
          chain,
          transport: custom(ethereum),
        });
        const pubClient = createPublicClient({
          chain,
          transport: custom(ethereum),
        });
        setWalletClient(client);
        setPublicClient(pubClient);
      }
    };

    // Listen for chain changes
    const handleChainChanged = async (chainIdHex: string) => {
      const newChainId = parseInt(chainIdHex, 16);
      setChainId(newChainId);
      // Reload page on chain change to update clients
      window.location.reload();
    };

    ethereum.on('accountsChanged', handleAccountsChanged);
    ethereum.on('chainChanged', handleChainChanged);

    return () => {
      ethereum.removeListener('accountsChanged', handleAccountsChanged);
      ethereum.removeListener('chainChanged', handleChainChanged);
    };
  }, [chain, getChainId]);

  const connect = useCallback(async () => {
    const ethereum = typeof window !== 'undefined' && window.ethereum
      ? (window.ethereum as unknown as EthereumProvider)
      : undefined;
    
    if (!ethereum) {
      toast.error('MetaMask is not installed. Please install MetaMask to continue.');
      throw new Error('MetaMask not installed');
    }

    try {
      // Check current chain
      const currentChainId = await getChainId(ethereum);
      setChainId(currentChainId);

      // Request account access
      const accounts = await ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length === 0) {
        throw new Error('No accounts found');
      }

      const address = getAddress(accounts[0]);
      setAccount({ address });

      // Setup clients
      const client = createWalletClient({
        account: address,
        chain,
        transport: custom(ethereum),
      });
      const pubClient = createPublicClient({
        chain,
        transport: custom(ethereum),
      });
      setWalletClient(client);
      setPublicClient(pubClient);

      toast.success('MetaMask connected!');
    } catch (error: any) {
      if (error.code === 4001) {
        toast.error('Please connect to MetaMask');
      } else {
        toast.error(error?.message || 'Failed to connect MetaMask');
      }
      throw error;
    }
  }, [chain, getChainId]);

  const disconnect = useCallback(() => {
    setAccount(null);
    setWalletClient(null);
    setPublicClient(null);
  }, []);

  return {
    account,
    isConnected: !!account,
    isLoading,
    connect,
    disconnect,
    address: account?.address || null,
    walletClient,
    publicClient,
    chainId,
    switchToSepolia,
  };
}

// Note: window.ethereum is typed elsewhere, we use type assertions where needed

