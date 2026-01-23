// Hook for Stacks wallet connection
import { useState, useEffect, useCallback } from 'react';
import { authenticate, getUserData } from '@stacks/connect';
import { AppConfig, UserSession } from '@stacks/connect';

const appConfig = new AppConfig(['store_write'], document.location.href);
const userSession = new UserSession({ appConfig });

export interface StacksUser {
  address: string;
  profile: any;
}

interface UseStacksReturn {
  user: StacksUser | null;
  isConnected: boolean;
  isLoading: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  address: string | null;
}

/**
 * Hook for connecting to Stacks wallet
 * 
 * Note: In production, you should use @stacks/connect-react or @stacks/wallet-sdk
 * This is a simplified version for development
 */
export function useStacks(network: 'testnet' | 'mainnet' = 'testnet'): UseStacksReturn {
  const [user, setUser] = useState<StacksUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already authenticated
    const checkAuth = async () => {
      if (userSession.isUserSignedIn()) {
        const userData = await getUserData();
        if (userData) {
          const address = network === 'testnet' 
            ? userData.profile.stxAddress.testnet 
            : userData.profile.stxAddress.mainnet;
          
          if (address) {
            setUser({
              address,
              profile: userData.profile,
            });
          }
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, [network]);

  const connect = useCallback(async () => {
    try {
      await authenticate({
        appDetails: {
          name: 'Ricardian Yield',
          icon: window.location.origin + '/logo.png',
        },
        redirectTo: '/',
        onFinish: async () => {
          const userData = await getUserData();
          if (userData) {
            const address = network === 'testnet' 
              ? userData.profile.stxAddress.testnet 
              : userData.profile.stxAddress.mainnet;
            
            if (address) {
              setUser({
                address,
                profile: userData.profile,
              });
            }
          }
        },
        userSession,
      });
    } catch (error) {
      console.error('Failed to connect Stacks wallet:', error);
      throw error;
    }
  }, [network]);

  const disconnect = useCallback(async () => {
    try {
      userSession.signUserOut();
      setUser(null);
    } catch (error) {
      console.error('Failed to disconnect Stacks wallet:', error);
      throw error;
    }
  }, []);

  return {
    user,
    isConnected: !!user,
    isLoading,
    connect,
    disconnect,
    address: user?.address || null,
  };
}

