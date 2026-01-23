import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useMounted } from "@/hooks/useMounted";
import { useStacks } from "@/hooks/useStacks";
import { 
  usePropertyData, 
  useDistributableCashFlow, 
  useRentCollected, 
  useOperatingExpenses, 
  useWorkingCapitalReserve,
  useLastTokenId,
  usePropertyOwner,
  useCapExSpent
} from "@/hooks/useStacksRead";
import { MintProperty } from "@/components/MintProperty";

// Helper to extract numeric value (duplicate from useStacksRead for local use)
function extractNumericValue(data: any): string | number | null {
  if (!data) return null;
  if (typeof data === 'string' || typeof data === 'number') return data;
  if (typeof data === 'object') {
    if ('value' in data) {
      const value = data.value;
      if (typeof value === 'string' || typeof value === 'number') return value;
      if (typeof value === 'object' && 'value' in value) return extractNumericValue(value);
    }
    if ('repr' in data) {
      const repr = data.repr;
      if (typeof repr === 'string') {
        const match = repr.match(/u?(\d+)/);
        if (match) return match[1];
      }
    }
  }
  return null;
}

export default function PropertyPage() {
  const { isConnected, connect } = useStacks();
  const mounted = useMounted();
  const [selectedPropertyId, setSelectedPropertyId] = useState<bigint | null>(null);

  // Get total properties to list them
  const { lastTokenId } = useLastTokenId();

  // Generate list of property IDs
  const propertyIds = useMemo(() => {
    if (!lastTokenId || lastTokenId === BigInt(0)) return [];
    const ids: bigint[] = [];
    for (let i = BigInt(1); i <= lastTokenId; i++) {
      ids.push(i);
    }
    return ids;
  }, [lastTokenId]);

  // Auto-select first property if available and none selected
  useMemo(() => {
    if (propertyIds.length > 0 && selectedPropertyId === null) {
      setSelectedPropertyId(propertyIds[0]);
    }
  }, [propertyIds, selectedPropertyId]);

  // Get property data from contract
  const { propertyData } = usePropertyData(selectedPropertyId || undefined);
  const { owner } = usePropertyOwner(selectedPropertyId || undefined);
  const { rentCollected } = useRentCollected(selectedPropertyId || undefined);
  const { operatingExpenses } = useOperatingExpenses(selectedPropertyId || undefined);
  const { workingCapitalReserve } = useWorkingCapitalReserve(selectedPropertyId || undefined);
  const { distributableCashFlow } = useDistributableCashFlow(selectedPropertyId || undefined);
  const { capexSpent } = useCapExSpent(selectedPropertyId || undefined);

  // Format property data from contract
  const property = useMemo(() => {
    if (!propertyData || !selectedPropertyId) return null;
    
    // Extract values from ClarityValue JSON structure
    // The structure from cvToJSON might be different, so we need to handle various formats
    let location = '';
    let valuation: bigint | null = null;
    let monthlyRent: bigint | null = null;
    
    // Try to extract location
    if (propertyData.value?.location) {
      location = propertyData.value.location;
    } else if (propertyData.location) {
      location = propertyData.location;
    } else if (typeof propertyData === 'object' && 'location' in propertyData) {
      location = String(propertyData.location || '');
    }
    
    // Try to extract valuation
    const valuationVal = extractNumericValue(propertyData.value?.valuation || propertyData.valuation);
    if (valuationVal) {
      valuation = BigInt(valuationVal);
    }
    
    // Try to extract monthly rent
    const rentVal = extractNumericValue(propertyData.value?.monthlyRent || propertyData['monthly-rent'] || propertyData.monthlyRent);
    if (rentVal) {
      monthlyRent = BigInt(rentVal);
    }
    
    return {
      location: location || 'Unknown Location',
      valuation: valuation || BigInt(0),
      monthlyRent: monthlyRent || BigInt(0),
      propertyId: Number(selectedPropertyId),
      owner: owner || '',
    };
  }, [propertyData, selectedPropertyId, owner]);

  const stats = {
    totalRentCollected: rentCollected || BigInt(0),
    operatingExpenses: operatingExpenses || BigInt(0),
    workingCapitalReserve: workingCapitalReserve || BigInt(0),
    capexSpent: capexSpent || BigInt(0),
    distributableCashFlow: distributableCashFlow || BigInt(0),
  };

  if (!mounted) {
    return (
      <main className="flex-1 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </main>
    );
  }

  if (!isConnected) {
    return (
      <main className="flex-1 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Connect Your Wallet</CardTitle>
              <CardDescription>Please connect your wallet to view property details</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={connect} variant="primary" className="w-full">
                Connect Stacks Wallet
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  // If no properties exist, show mint form
  if (propertyIds.length === 0) {
    return (
      <main className="flex-1 bg-gray-50 relative pattern-dots">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
          <div className="mb-8">
            <h1 className="text-4xl font-light text-foreground mb-3 tracking-tight">Property Overview</h1>
            <p className="text-gray-600 font-light text-lg">Create and manage tokenized properties</p>
          </div>
          <MintProperty onMinted={() => window.location.reload()} />
        </div>
      </main>
    );
  }

  // If no property selected, show property list
  if (!selectedPropertyId || !property) {
    return (
      <main className="flex-1 bg-gray-50 relative pattern-dots">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
          <div className="mb-8">
            <h1 className="text-4xl font-light text-foreground mb-3 tracking-tight">Properties</h1>
            <p className="text-gray-600 font-light text-lg">Select a property to view details</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {propertyIds.map((id) => (
              <Card key={id.toString()} className="cursor-pointer hover:border-primary transition-colors" onClick={() => setSelectedPropertyId(id)}>
                <CardHeader>
                  <CardTitle>Property #{id.toString()}</CardTitle>
                  <CardDescription>Click to view details</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 bg-gray-50 relative pattern-dots">
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/10 to-[#06B6D4]/10 rounded-full blur-3xl"></div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-light text-foreground mb-3 tracking-tight">Property Overview</h1>
              <p className="text-gray-600 font-light text-lg">Detailed view of your tokenized property</p>
            </div>
            {propertyIds.length > 1 && (
              <div className="flex gap-2">
                <select
                  value={selectedPropertyId.toString()}
                  onChange={(e) => setSelectedPropertyId(BigInt(e.target.value))}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                >
                  {propertyIds.map((id) => (
                    <option key={id.toString()} value={id.toString()}>
                      Property #{id.toString()}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Property Header */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl">{property.location}</CardTitle>
            <CardDescription>
              Property ID: {property.propertyId}
              {property.owner && ` • Owner: ${property.owner.slice(0, 6)}...${property.owner.slice(-4)}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-gray-500 mb-1">Valuation</p>
                <p className="text-2xl font-bold text-foreground">
                  {property.valuation > BigInt(0) 
                    ? `${(Number(property.valuation) / 1e6).toFixed(2)} USDCx`
                    : "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Monthly Rent</p>
                <p className="text-2xl font-bold text-primary">
                  {property.monthlyRent > BigInt(0)
                    ? `${(Number(property.monthlyRent) / 1e6).toFixed(6)} USDCx`
                    : "0 USDCx"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Annual Yield</p>
                <p className="text-2xl font-bold text-primary">
                  {property.valuation > BigInt(0) && property.monthlyRent > BigInt(0)
                    ? ((Number(property.monthlyRent) * 12 / Number(property.valuation)) * 100).toFixed(2)
                    : "0"}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cash Flow Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Rent Collected</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-primary">
                {stats.totalRentCollected > BigInt(0)
                  ? `${(Number(stats.totalRentCollected) / 1e6).toFixed(6)} USDCx`
                  : "0 USDCx"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Operating Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-red-500">
                {stats.operatingExpenses > BigInt(0)
                  ? `${(Number(stats.operatingExpenses) / 1e6).toFixed(6)} USDCx`
                  : "0 USDCx"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Distributable Cash Flow</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-primary">
                {stats.distributableCashFlow > BigInt(0)
                  ? `${(Number(stats.distributableCashFlow) / 1e6).toFixed(6)} USDCx`
                  : "0 USDCx"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Financial Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Cash Flow Breakdown</CardTitle>
              <CardDescription>Income and expenses breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Rent Collected</span>
                  <span className="font-semibold text-foreground">
                    {stats.totalRentCollected > BigInt(0)
                      ? `${(Number(stats.totalRentCollected) / 1e6).toFixed(6)} USDCx`
                      : "0 USDCx"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Operating Expenses</span>
                  <span className="font-semibold text-red-500">
                    -{stats.operatingExpenses > BigInt(0)
                      ? `${(Number(stats.operatingExpenses) / 1e6).toFixed(6)} USDCx`
                      : "0 USDCx"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Working Capital Reserve</span>
                  <span className="font-semibold text-gray-500">
                    -{stats.workingCapitalReserve > BigInt(0)
                      ? `${(Number(stats.workingCapitalReserve) / 1e6).toFixed(6)} USDCx`
                      : "0 USDCx"}
                  </span>
                </div>
                <div className="border-t border-gray-200 pt-4 flex justify-between items-center">
                  <span className="font-semibold text-foreground">Distributable Cash Flow</span>
                  <span className="font-bold text-primary text-xl">
                    {stats.distributableCashFlow > BigInt(0)
                      ? `${(Number(stats.distributableCashFlow) / 1e6).toFixed(6)} USDCx`
                      : "0 USDCx"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Capital Expenditures</CardTitle>
              <CardDescription>Long-term value creation</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total CapEx Spent</span>
                  <span className="font-semibold text-foreground">
                    {stats.capexSpent > BigInt(0)
                      ? `${(Number(stats.capexSpent) / 1e6).toFixed(6)} USDCx`
                      : "0 USDCx"}
                  </span>
                </div>
                <div className="bg-primary-light rounded-lg p-4">
                  <p className="text-sm text-primary-dark">
                    CapEx affects property value but is excluded from immediate yield distribution,
                    showing long-term value creation.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
