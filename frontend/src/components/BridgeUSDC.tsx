// Component for bridging USDC to USDCx
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useBridgeUSDC } from '@/hooks/useBridgeUSDC';
import { useStacks } from '@/hooks/useStacks';
import { useEthereum } from '@/hooks/useEthereum';
import { formatAddress } from '@/lib/utils';
import toast from 'react-hot-toast';

interface BridgeUSDCProps {
  onBridged?: () => void;
  inline?: boolean; // If true, renders without Card wrapper for inline use
}

export function BridgeUSDC({ onBridged, inline = false }: BridgeUSDCProps) {
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
  const [recipientAddress, setRecipientAddress] = useState(stacksAddress || '');
  const [showBridgeForm, setShowBridgeForm] = useState(false);

  const SEPOLIA_CHAIN_ID = 11155111;
  const isOnSepolia = chainId === SEPOLIA_CHAIN_ID;

  const { bridgeUSDC, isPending, isApproving, isDepositing } = useBridgeUSDC({
    network: 'testnet',
  });

  // Update recipient address when Stacks wallet connects
  useEffect(() => {
    if (stacksAddress && !recipientAddress) {
      setRecipientAddress(stacksAddress);
    }
  }, [stacksAddress, recipientAddress]);

  // Validate Stacks address format (starts with ST or SP)
  const isValidStacksAddress = (address: string): boolean => {
    if (!address) return false;
    const trimmed = address.trim();
    return (trimmed.startsWith('ST') || trimmed.startsWith('SP')) && trimmed.length >= 39;
  };

  const handleBridge = async () => {
    if (!recipientAddress || !recipientAddress.trim()) {
      toast.error('Please enter a Stacks recipient address');
      return;
    }

    if (!isValidStacksAddress(recipientAddress)) {
      toast.error('Please enter a valid Stacks address (starts with ST or SP)');
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
      await bridgeUSDC(amount, recipientAddress.trim());
      setAmount('');
      onBridged?.();
    } catch (error: any) {
      console.error('Bridge error:', error);
    }
  };

  if (!showBridgeForm) {
    if (inline) {
      return (
        <div className="border-2 border-dashed border-primary/30 rounded-lg p-4 bg-primary/5">
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
        </div>
      );
    }
    return (
      <Card className="border-2 border-dashed border-primary/30 w-full">
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

  const content = (
    <div className="space-y-4 overflow-hidden">
        {!isMetaMaskInstalled && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-xs text-yellow-800 break-words">
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
        <div className="min-w-0">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ethereum Wallet (MetaMask)
          </label>
          {isEthConnected && ethAddress ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg min-w-0">
                <div className="min-w-0 flex-1 mr-2">
                  <p className="text-sm font-medium text-green-800">Connected</p>
                  <p className="text-xs text-green-600 truncate">{formatAddress(ethAddress)}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Disconnect handled by useEthereum hook
                    window.location.reload(); // Simple way to disconnect
                  }}
                  className="flex-shrink-0"
                >
                  Disconnect
                </Button>
              </div>
              {/* Network Status */}
              {chainId && (
                <div className={`p-3 rounded-lg border min-w-0 ${
                  isOnSepolia 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-yellow-50 border-yellow-200'
                }`}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
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
                        className="flex-shrink-0"
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

        {/* Stacks Recipient Address Input */}
        <div className="min-w-0">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Stacks Recipient Address
          </label>
          <input
            type="text"
            value={recipientAddress}
            onChange={(e) => setRecipientAddress(e.target.value)}
            placeholder="ST1F1M4YP67NV360FBYR28V7C599AC46F8C4635SH"
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none ${
              recipientAddress && !isValidStacksAddress(recipientAddress)
                ? 'border-red-300 bg-red-50'
                : 'border-gray-300'
            }`}
          />
          {stacksAddress && (
            <button
              type="button"
              onClick={() => setRecipientAddress(stacksAddress)}
              className="mt-1 text-xs text-primary hover:underline"
            >
              Use connected wallet address
            </button>
          )}
          {recipientAddress && !isValidStacksAddress(recipientAddress) && (
            <p className="mt-1 text-xs text-red-600">
              Invalid Stacks address. Must start with ST or SP and be at least 39 characters.
            </p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            Enter the Stacks address that will receive the USDCx tokens
          </p>
        </div>

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
          <p className="text-xs text-blue-800 break-words">
            <strong>Process:</strong> This will approve xReserve to spend your USDC, then initiate the bridge.
            USDCx will be minted on Stacks in ~15 minutes.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            variant="primary"
            onClick={handleBridge}
            disabled={
              isPending || 
              !amount || 
              !isEthConnected || 
              !recipientAddress || 
              !isValidStacksAddress(recipientAddress) || 
              !isMetaMaskInstalled || 
              !isOnSepolia
            }
            isLoading={isPending}
            className="flex-1 min-w-0"
          >
            {isApproving ? 'Approving...' : isDepositing ? 'Bridging...' : 'Bridge USDC'}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setShowBridgeForm(false);
              setAmount('');
              setRecipientAddress(stacksAddress || '');
            }}
            disabled={isPending}
            className="flex-shrink-0"
          >
            Cancel
          </Button>
        </div>
        {!isOnSepolia && isEthConnected && (
          <p className="text-xs text-yellow-600 text-center">
            Please switch to Sepolia testnet to continue
          </p>
        )}
    </div>
  );

  if (inline) {
    return (
      <div>
        <div className="mb-3">
          <h3 className="text-lg font-semibold text-foreground">Bridge USDC to USDCx</h3>
          <p className="text-sm text-gray-600">
            Bridge USDC from Ethereum Sepolia to USDCx on Stacks testnet
          </p>
        </div>
        {content}
      </div>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Bridge USDC to USDCx</CardTitle>
        <CardDescription>
          Bridge USDC from Ethereum Sepolia to USDCx on Stacks testnet
        </CardDescription>
      </CardHeader>
      <CardContent>
        {content}
      </CardContent>
    </Card>
  );
}

