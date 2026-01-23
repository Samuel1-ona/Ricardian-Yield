// Component for minting a new property NFT
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useMintProperty } from '@/hooks/useStacksWriteWallet';
import toast from 'react-hot-toast';

interface MintPropertyProps {
  onMinted?: () => void;
}

export function MintProperty({ onMinted }: MintPropertyProps) {
  const { mintProperty, isPending } = useMintProperty();
  const [location, setLocation] = useState('');
  const [valuation, setValuation] = useState('');
  const [monthlyRent, setMonthlyRent] = useState('');
  const [metadataUri, setMetadataUri] = useState('');
  const [showForm, setShowForm] = useState(false);

  const handleMint = async () => {
    if (!location.trim()) {
      toast.error('Please enter a location');
      return;
    }

    if (!valuation || parseFloat(valuation) <= 0) {
      toast.error('Please enter a valid valuation');
      return;
    }

    if (!monthlyRent || parseFloat(monthlyRent) <= 0) {
      toast.error('Please enter a valid monthly rent');
      return;
    }

    try {
      await mintProperty(location, valuation, monthlyRent, metadataUri);
      setLocation('');
      setValuation('');
      setMonthlyRent('');
      setMetadataUri('');
      setShowForm(false);
      onMinted?.();
    } catch (error: any) {
      console.error(error);
      // Error is already handled by the hook
    }
  };

  if (!showForm) {
    return (
      <Card className="border-2 border-dashed border-primary/30">
        <CardContent className="pt-6">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-4">
              No properties found. Mint a new property NFT to get started.
            </p>
            <Button
              variant="primary"
              onClick={() => setShowForm(true)}
            >
              Mint New Property
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mint New Property NFT</CardTitle>
        <CardDescription>Create a new tokenized property</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Location *
          </label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="123 Main St, San Francisco, CA"
            maxLength={200}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Valuation (USDCx) *
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={valuation}
            onChange={(e) => setValuation(e.target.value)}
            placeholder="1000000.00"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
            required
          />
          <p className="mt-1 text-xs text-gray-500">Total property value in USDCx</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Monthly Rent (USDCx) *
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={monthlyRent}
            onChange={(e) => setMonthlyRent(e.target.value)}
            placeholder="10000.00"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
            required
          />
          <p className="mt-1 text-xs text-gray-500">Expected monthly rental income in USDCx</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Metadata URI (optional)
          </label>
          <input
            type="text"
            value={metadataUri}
            onChange={(e) => setMetadataUri(e.target.value)}
            placeholder="https://example.com/metadata.json"
            maxLength={200}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
          />
          <p className="mt-1 text-xs text-gray-500">Link to property metadata (JSON, image, etc.)</p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-xs text-blue-800">
            <strong>Note:</strong> Only the contract owner can mint properties. Make sure you're connected with the owner wallet.
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="primary"
            onClick={handleMint}
            disabled={isPending || !location || !valuation || !monthlyRent}
            isLoading={isPending}
            className="flex-1"
          >
            {isPending ? 'Minting...' : 'Mint Property'}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setShowForm(false);
              setLocation('');
              setValuation('');
              setMonthlyRent('');
              setMetadataUri('');
            }}
            disabled={isPending}
          >
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

