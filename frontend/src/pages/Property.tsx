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

type ViewMode = 'cards' | 'details' | 'mint';

export default function PropertyPage() {
  const { isConnected, connect } = useStacks();
  const mounted = useMounted();
  const [selectedPropertyId, setSelectedPropertyId] = useState<bigint | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('cards');

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

  // Handle property card click
  const handlePropertyClick = (propertyId: bigint) => {
    setSelectedPropertyId(propertyId);
    setViewMode('details');
  };

  // Handle back to cards view
  const handleBackToCards = () => {
    setViewMode('cards');
    setSelectedPropertyId(null);
  };

  // Handle mint button click
  const handleMintClick = () => {
    setViewMode('mint');
    setSelectedPropertyId(null);
  };

  // Handle successful mint
  const handleMinted = () => {
    setViewMode('cards');
    // Refresh will happen automatically via React Query
    window.location.reload(); // Simple refresh for now
  };

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
    // get-property-data returns: (ok (some (tuple (owner principal) (location string-ascii) (valuation uint) (monthly-rent uint) (metadata-uri string-ascii))))
    // So the structure is: { type: "ok", value: { type: "some", value: { type: "tuple", value: { owner: ..., location: ..., valuation: ..., "monthly-rent": ... } } } }
    
    // Debug log in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Property data raw:', JSON.stringify(propertyData, null, 2));
    }
    
    let location = '';
    let valuation: bigint | null = null;
    let monthlyRent: bigint | null = null;
    
    // Navigate through the nested structure: ok -> some -> tuple -> data
    // Based on the logs, the structure is: { type: "ok", value: { type: "some", value: { type: "optional", value: { type: "tuple", value: { location: {...}, ... } } } } }
    let tupleData: any = null;
    
    // Handle ok response
    if (propertyData.type === 'ok' && propertyData.value) {
      const okValue = propertyData.value;
      // Handle some optional
      if (okValue.type === 'some' && okValue.value) {
        const someValue = okValue.value;
        // Handle optional wrapper (might be nested)
        if (someValue.type && someValue.type.includes('optional') && someValue.value) {
          const optionalValue = someValue.value;
          // Handle tuple
          if (optionalValue.type && optionalValue.type.includes('tuple') && optionalValue.value) {
            tupleData = optionalValue.value;
          } else {
            tupleData = optionalValue.value || optionalValue;
          }
        } else if (someValue.type && someValue.type.includes('tuple') && someValue.value) {
          // Direct tuple in some
          tupleData = someValue.value;
        } else {
          // Go deeper if needed
          tupleData = someValue.value?.value || someValue.value || someValue;
        }
      } else {
        tupleData = okValue.value?.value || okValue.value || okValue;
      }
    } else if (propertyData.value) {
      // Try direct value access
      const dataValue = propertyData.value;
      if (dataValue.type === 'some' && dataValue.value) {
        const someVal = dataValue.value;
        if (someVal.type && someVal.type.includes('optional') && someVal.value) {
          tupleData = someVal.value.value || someVal.value;
        } else if (someVal.type && someVal.type.includes('tuple') && someVal.value) {
          tupleData = someVal.value;
        } else {
          tupleData = someVal.value?.value || someVal.value || someVal;
        }
      } else if (dataValue.type && dataValue.type.includes('tuple') && dataValue.value) {
        tupleData = dataValue.value;
      } else {
        tupleData = dataValue.value?.value || dataValue.value || dataValue;
      }
    } else {
      // Try direct access
      tupleData = propertyData.value?.value || propertyData.value || propertyData;
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.log('Extracted tuple data:', JSON.stringify(tupleData, null, 2));
    }
    
    // Extract location from tuple - the actual data is nested in value.value
    // Based on the log: tupleData.value.value contains { location: {...}, monthly-rent: {...}, valuation: {...} }
    if (tupleData) {
      // Check if we need to go one level deeper (tupleData.value.value)
      let actualData = tupleData;
      if (tupleData.value && tupleData.value.value && typeof tupleData.value.value === 'object') {
        // The actual tuple data is at tupleData.value.value
        actualData = tupleData.value.value;
      } else if (tupleData.value && typeof tupleData.value === 'object') {
        // Check if tupleData.value has the fields directly (not nested in another value)
        if ('location' in tupleData.value || 'monthly-rent' in tupleData.value || 'valuation' in tupleData.value) {
          actualData = tupleData.value;
        } else if (tupleData.value.value) {
          actualData = tupleData.value.value;
        }
      }
      
      if (process.env.NODE_ENV === 'development') {
        console.log('Actual data to extract from:', JSON.stringify(actualData, null, 2));
      }
      
      // Location can be in various formats
      const locationField = actualData.location || actualData['location'];
      if (locationField) {
        if (typeof locationField === 'string') {
          location = locationField;
        } else if (locationField.value !== undefined) {
          location = String(locationField.value);
        } else if (locationField.repr) {
          location = String(locationField.repr).replace(/^['"]|['"]$/g, '');
        } else if (locationField.type === 'string-ascii' && locationField.value !== undefined) {
          location = String(locationField.value);
        }
      }
      
      // Extract valuation
      const valuationField = actualData.valuation || actualData['valuation'];
      if (valuationField) {
        if (typeof valuationField === 'string' || typeof valuationField === 'number') {
          valuation = BigInt(valuationField);
        } else if (valuationField.value !== undefined) {
          valuation = BigInt(valuationField.value);
        } else {
          const valuationVal = extractNumericValue(valuationField);
          if (valuationVal) {
            valuation = BigInt(valuationVal);
          }
        }
      }
      
      // Extract monthly rent (note: Clarity uses kebab-case "monthly-rent")
      const rentField = actualData['monthly-rent'] || actualData.monthlyRent || actualData['monthly_rent'];
      if (rentField) {
        if (typeof rentField === 'string' || typeof rentField === 'number') {
          monthlyRent = BigInt(rentField);
        } else if (rentField.value !== undefined) {
          monthlyRent = BigInt(rentField.value);
        } else {
          const rentVal = extractNumericValue(rentField);
          if (rentVal) {
            monthlyRent = BigInt(rentVal);
          }
        }
      }
      
      if (process.env.NODE_ENV === 'development') {
        console.log('Extracted property values:', {
          location,
          valuation: valuation?.toString(),
          monthlyRent: monthlyRent?.toString(),
        });
      }
    }
    
    // Ensure owner is a string
    let ownerString = '';
    if (owner) {
      if (typeof owner === 'string') {
        ownerString = owner;
      } else if (typeof owner === 'object' && owner !== null) {
        // Handle object responses (e.g., { value: "ST..." })
        const ownerObj = owner as any;
        if (ownerObj.value && typeof ownerObj.value === 'string') {
          ownerString = ownerObj.value;
        } else if (ownerObj.repr && typeof ownerObj.repr === 'string') {
          ownerString = ownerObj.repr;
        } else {
          ownerString = String(owner);
        }
      } else {
        ownerString = String(owner);
      }
    }
    
    return {
      location: location || 'Unknown Location',
      valuation: valuation || BigInt(0),
      monthlyRent: monthlyRent || BigInt(0),
      propertyId: Number(selectedPropertyId),
      owner: ownerString,
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

  // Helper component to extract property data for a card
  function PropertyCard({ propertyId }: { propertyId: bigint }) {
    const { propertyData: cardData } = usePropertyData(propertyId);
    
    // Extract basic info for card display
    const cardInfo = useMemo(() => {
      if (!cardData) return null;
      
      let location = '';
      let valuation: bigint | null = null;
      
      // Navigate through nested structure
      let tupleData: any = null;
      if (cardData.type === 'ok' && cardData.value) {
        const okValue = cardData.value;
        if (okValue.type === 'some' && okValue.value) {
          const someValue = okValue.value;
          if (someValue.type && someValue.type.includes('optional') && someValue.value) {
            const optionalValue = someValue.value;
            if (optionalValue.type && optionalValue.type.includes('tuple') && optionalValue.value) {
              tupleData = optionalValue.value;
            } else {
              tupleData = optionalValue.value || optionalValue;
            }
          } else if (someValue.type && someValue.type.includes('tuple') && someValue.value) {
            tupleData = someValue.value;
          } else {
            tupleData = someValue.value?.value || someValue.value || someValue;
          }
        }
      }
      
      if (tupleData) {
        let actualData = tupleData;
        if (tupleData.value && tupleData.value.value && typeof tupleData.value.value === 'object') {
          actualData = tupleData.value.value;
        } else if (tupleData.value && typeof tupleData.value === 'object') {
          if ('location' in tupleData.value || 'monthly-rent' in tupleData.value || 'valuation' in tupleData.value) {
            actualData = tupleData.value;
          } else if (tupleData.value.value) {
            actualData = tupleData.value.value;
          }
        }
        
        const locationField = actualData.location || actualData['location'];
        if (locationField) {
          if (typeof locationField === 'string') {
            location = locationField;
          } else if (locationField.value !== undefined) {
            location = String(locationField.value);
          }
        }
        
        const valuationField = actualData.valuation || actualData['valuation'];
        if (valuationField) {
          if (typeof valuationField === 'string' || typeof valuationField === 'number') {
            valuation = BigInt(valuationField);
          } else if (valuationField.value !== undefined) {
            valuation = BigInt(valuationField.value);
          }
        }
      }
      
      return { location: location || `Property #${propertyId}`, valuation: valuation || BigInt(0) };
    }, [cardData, propertyId]);
    
    return (
      <Card 
        className="cursor-pointer hover:border-primary hover:shadow-lg transition-all h-full"
        onClick={() => handlePropertyClick(propertyId)}
      >
        <CardHeader>
          <CardTitle className="text-lg">{cardInfo?.location || `Property #${propertyId}`}</CardTitle>
          <CardDescription>ID: {propertyId.toString()}</CardDescription>
        </CardHeader>
        <CardContent>
          {cardInfo && cardInfo.valuation > BigInt(0) && (
            <div className="mt-2">
              <p className="text-sm text-gray-500">Valuation</p>
              <p className="text-xl font-semibold text-primary">
                {(Number(cardInfo.valuation) / 1e6).toFixed(2)} USDCx
              </p>
            </div>
          )}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500">Click to view details</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show mint form view
  if (viewMode === 'mint') {
    return (
      <main className="flex-1 bg-gray-50 relative pattern-dots">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
          <div className="mb-8">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-4xl font-light text-foreground mb-3 tracking-tight">Mint New Property</h1>
                <p className="text-gray-600 font-light text-lg">Create a new tokenized property on Stacks</p>
              </div>
              <Button variant="outline" onClick={handleBackToCards}>
                ← Back to Properties
              </Button>
            </div>
          </div>
          <MintProperty onMinted={handleMinted} />
        </div>
      </main>
    );
  }

  // Show details view
  if (viewMode === 'details' && selectedPropertyId && property) {
    return (
      <main className="flex-1 bg-gray-50 relative pattern-dots">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/10 to-[#06B6D4]/10 rounded-full blur-3xl"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
          <div className="mb-8">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-4xl font-light text-foreground mb-3 tracking-tight">Property Details</h1>
                <p className="text-gray-600 font-light text-lg">Detailed view of your tokenized property</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleBackToCards}>
                  ← Back to Properties
                </Button>
              </div>
            </div>
          </div>

          {/* Property Header */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-2xl">{property.location}</CardTitle>
              <CardDescription>
                Property ID: {property.propertyId}
                {property.owner && typeof property.owner === 'string' && property.owner.length > 0 && (
                  ` • Owner: ${property.owner.slice(0, 6)}...${property.owner.slice(-4)}`
                )}
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

  // Default: Show property cards view
  return (
    <main className="flex-1 bg-gray-50 relative pattern-dots">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-light text-foreground mb-3 tracking-tight">Properties</h1>
              <p className="text-gray-600 font-light text-lg">Manage your tokenized properties</p>
            </div>
            <Button variant="primary" onClick={handleMintClick}>
              + Mint Property
            </Button>
          </div>
        </div>

        {propertyIds.length === 0 ? (
          <Card className="border-2 border-dashed border-primary/30">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-4">
                  No properties found. Mint your first property to get started.
                </p>
                <Button variant="primary" onClick={handleMintClick}>
                  Mint New Property
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {propertyIds.map((id) => (
              <PropertyCard key={id.toString()} propertyId={id} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
