// Component for bridging USDC to USDCx
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useBridgeUSDC } from '@/hooks/useBridgeUSDC';
import { useStacks } from '@/hooks/useStacks';
import { useEthereum } from '@/hooks/useEthereum';
import { formatAddress } from '@/lib/utils';
import toast from 'react-hot-toast';

interface BridgeUSDCProps {
  onBridged?: () => void;
}

export function BridgeUSDC({ onBridged }: BridgeUSDCProps) {
  const { address: stacksAddress } = useStacks();
  const { 
    address: ethAddress, 
    isConnected: isEthConnected, 
    connect: connectEth, 
    isLoading: isEthLoading,
    chainId,
    switchToSepolia
  } = useEthereum('testnet');
  const [amount, setAmount] = useState('');
  const [showBridgeForm, setShowBridgeForm] = useState(false);

  const SEPOLIA_CHAIN_ID = 11155111;
  const isOnSepolia = chainId === SEPOLIA_CHAIN_ID;

  const { bridgeUSDC, isPending, isApproving, isDepositing } = useBridgeUSDC({
    network: 'testnet',
  });

  const handleBridge = async () => {
    if (!stacksAddress) {
      toast.error('Please connect your Stacks wallet first');
      return;
    }

    if (!isEthConnected || !ethAddress) {
      toast.error('Please connect your MetaMask wallet');
      try {
        await connectEth();
      } catch {
        // Connection failed, user needs to connect manually
      }
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (parseFloat(amount) < 1) {
      toast.error('Minimum amount is 1 USDC on testnet');
      return;
    }

    try {
      await bridgeUSDC(amount, stacksAddress);
      setAmount('');
      onBridged?.();
    } catch (error: any) {
      console.error('Bridge error:', error);
    }
  };

  if (!showBridgeForm) {
    return (
      <Card className="border-2 border-dashed border-primary/30">
        <CardContent className="pt-6">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-4">
              You need USDCx on Stacks to deposit rent. Bridge USDC from Ethereum to get started.
            </p>
            <Button
              variant="outline"
              onClick={() => setShowBridgeForm(true)}
            >
              Bridge USDC → USDCx
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Check if MetaMask is installed
  const isMetaMaskInstalled = typeof window !== 'undefined' && 
    window.ethereum && 
    (window.ethereum as any).isMetaMask;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bridge USDC to USDCx</CardTitle>
        <CardDescription>
          Bridge USDC from Ethereum Sepolia to USDCx on Stacks testnet
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isMetaMaskInstalled && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-xs text-yellow-800">
              <strong>MetaMask Required:</strong> Please install MetaMask browser extension to bridge USDC.
              <a
                href="https://metamask.io/download/"
                target="_blank"
                rel="noopener noreferrer"
                className="ml-1 text-yellow-900 underline"
              >
                Download MetaMask
              </a>
            </p>
          </div>
        )}

        {/* Ethereum Wallet Connection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ethereum Wallet (MetaMask)
          </label>
          {isEthConnected && ethAddress ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-green-800">Connected</p>
                  <p className="text-xs text-green-600">{formatAddress(ethAddress)}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Disconnect handled by useEthereum hook
                    window.location.reload(); // Simple way to disconnect
                  }}
                >
                  Disconnect
                </Button>
              </div>
              {/* Network Status */}
              {chainId && (
                <div className={`p-3 rounded-lg border ${
                  isOnSepolia 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-yellow-50 border-yellow-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-sm font-medium ${
                        isOnSepolia ? 'text-green-800' : 'text-yellow-800'
                      }`}>
                        Network: {isOnSepolia ? 'Sepolia Testnet' : `Chain ID ${chainId}`}
                      </p>
                      {!isOnSepolia && (
                        <p className="text-xs text-yellow-600 mt-1">
                          You must be on Sepolia testnet to bridge
                        </p>
                      )}
                    </div>
                    {!isOnSepolia && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={switchToSepolia}
                        className="ml-2"
                      >
                        Switch to Sepolia
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Button
              variant="outline"
              onClick={connectEth}
              disabled={isEthLoading || !isMetaMaskInstalled}
              className="w-full"
              isLoading={isEthLoading}
            >
              {isEthLoading ? 'Connecting...' : 'Connect MetaMask'}
            </Button>
          )}
        </div>

        {/* Stacks Address Display */}
        {stacksAddress && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Stacks Recipient Address
            </label>
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-xs text-gray-600">{formatAddress(stacksAddress)}</p>
            </div>
          </div>
        )}

        {/* Amount Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Amount (USDC)
          </label>
          <input
            type="number"
            step="0.01"
            min="1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="1.00"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
          />
          <p className="mt-1 text-xs text-gray-500">
            Minimum: 1 USDC (testnet)
          </p>
        </div>

        {/* Process Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-xs text-blue-800">
            <strong>Process:</strong> This will approve xReserve to spend your USDC, then initiate the bridge.
            USDCx will be minted on Stacks in ~15 minutes.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            variant="primary"
            onClick={handleBridge}
            disabled={isPending || !amount || !isEthConnected || !stacksAddress || !isMetaMaskInstalled || !isOnSepolia}
            isLoading={isPending}
            className="flex-1"
          >
            {isApproving ? 'Approving...' : isDepositing ? 'Bridging...' : 'Bridge USDC'}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setShowBridgeForm(false);
              setAmount('');
            }}
            disabled={isPending}
          >
            Cancel
          </Button>
        </div>
        {!isOnSepolia && isEthConnected && (
          <p className="text-xs text-yellow-600 text-center">
            Please switch to Sepolia testnet to continue
          </p>
        )}
      </CardContent>
    </Card>
  );
}

