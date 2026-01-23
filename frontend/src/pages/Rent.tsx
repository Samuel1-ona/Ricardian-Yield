import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import toast from "react-hot-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useStacks } from "@/hooks/useStacks";
import { useUSDCxBalance } from "@/hooks/useUSDCx";
import { useDepositRentWallet } from "@/hooks/useStacksWriteWallet";
import { useRentCollected, useCurrentPeriod, useLastTokenId, usePropertyData } from "@/hooks/useStacksRead";
import { BridgeUSDC } from "@/components/BridgeUSDC";
import { getCachedPropertyName } from "@/lib/property-cache";

// Helper component to display property option in dropdown
function PropertyOption({ propertyId }: { propertyId: bigint }) {
  const { propertyData } = usePropertyData(propertyId);
  
  // Extract name and location from property data
  const displayText = useMemo(() => {
    if (!propertyData) return `Property #${propertyId}`;
    
    try {
      let tupleData: any = null;
      if (propertyData.type === 'ok' && propertyData.value) {
        const okValue = propertyData.value;
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
        
        let location = '';
        
        const locationField = actualData.location || actualData['location'];
        if (locationField) {
          if (typeof locationField === 'string') {
            location = locationField;
          } else if (locationField.value !== undefined) {
            location = String(locationField.value);
          }
        }
        
        // Try to get name from cache
        const cachedName = getCachedPropertyName(propertyId);
        
        // Return cached name if available, otherwise location, otherwise fallback
        if (cachedName) return cachedName;
        if (location) return location;
      }
    } catch (e) {
      console.error('Error extracting property info:', e);
    }
    
    return `Property #${propertyId}`;
  }, [propertyData, propertyId]);
  
  return (
    <option value={propertyId.toString()}>
      {displayText}
    </option>
  );
}

// Helper component to display selected property info
function PropertyInfo({ propertyId }: { propertyId: bigint }) {
  const { propertyData } = usePropertyData(propertyId);
  
  const info = useMemo(() => {
    if (!propertyData) return null;
    
    try {
      let tupleData: any = null;
      if (propertyData.type === 'ok' && propertyData.value) {
        const okValue = propertyData.value;
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
        const monthlyRentField = actualData['monthly-rent'] || actualData.monthlyRent;
        
        let location = '';
        let monthlyRent: bigint | null = null;
        
        if (locationField) {
          if (typeof locationField === 'string') {
            location = locationField;
          } else if (locationField.value !== undefined) {
            location = String(locationField.value);
          }
        }
        
        if (monthlyRentField) {
          if (typeof monthlyRentField === 'string' || typeof monthlyRentField === 'number') {
            monthlyRent = BigInt(monthlyRentField);
          } else if (monthlyRentField.value !== undefined) {
            monthlyRent = BigInt(monthlyRentField.value);
          }
        }
        
        // Try to get name from cache
        const cachedName = getCachedPropertyName(propertyId);
        
        return { 
          name: cachedName,
          location: location || `Property #${propertyId}`, 
          monthlyRent 
        };
      }
    } catch (e) {
      console.error('Error extracting property info:', e);
    }
    
    return null;
  }, [propertyData, propertyId]);
  
  if (!info) return null;
  
  return (
    <div className="mt-2 bg-gray-50 border border-gray-200 rounded-lg p-3">
      <p className="text-sm font-medium text-gray-700">{info.name || info.location}</p>
      {info.name && info.location && (
        <p className="text-xs text-gray-500 mt-1">{info.location}</p>
      )}
      {info.monthlyRent && info.monthlyRent > BigInt(0) && (
        <p className="text-xs text-gray-500 mt-1">
          Expected Monthly Rent: {(Number(info.monthlyRent) / 1e6).toFixed(2)} USDCx
        </p>
      )}
    </div>
  );
}

export default function RentPage() {
  const { isConnected, connect, address } = useStacks();
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState("");
  
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
  
  // State for selected property
  const [selectedPropertyId, setSelectedPropertyId] = useState<bigint | null>(
    propertyIds.length > 0 ? propertyIds[0] : null
  );
  
  // Update selected property when propertyIds change
  useEffect(() => {
    if (propertyIds.length > 0 && selectedPropertyId === null) {
      setSelectedPropertyId(propertyIds[0]);
    }
  }, [propertyIds, selectedPropertyId]);
  
  const propertyId = selectedPropertyId || BigInt(1);
  
  // Contract hooks
  const { depositRent, isPending: isDepositing } = useDepositRentWallet();
  const { balance: usdcxBalance, formatted: formattedBalance, isLoading: isLoadingBalance } = useUSDCxBalance();
  const { rentCollected } = useRentCollected(propertyId);
  const { currentPeriod } = useCurrentPeriod(propertyId);

  // Handle successful deposit - invalidate balance query
  useEffect(() => {
    // Invalidate balance query when deposit completes
    if (!isDepositing && address) {
      // Small delay to ensure transaction is confirmed on-chain
      const timer = setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['usdcx-balance', address] });
      }, 3000); // Wait 3 seconds for transaction confirmation
      return () => clearTimeout(timer);
    }
  }, [isDepositing, address, queryClient]);

  const handleDeposit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (!isConnected) {
      toast.error("Please connect your wallet");
      return;
    }

    // Check USDCx balance (6 decimals)
    const amountMicro = BigInt(Math.floor(parseFloat(amount) * 1e6));
    const balance = usdcxBalance || BigInt(0);
    
    if (balance < amountMicro) {
      toast.error(
        `Insufficient USDCx balance. You have ${formattedBalance} USDCx but need ${amount} USDCx`
      );
      return;
    }

    try {
      await depositRent(propertyId, amount);
      setAmount("");
    } catch (error: any) {
      console.error(error);
      // Error is already handled by the hook
    }
  };

  // Check if user has sufficient balance
  const amountMicro = amount && parseFloat(amount) > 0 
    ? BigInt(Math.floor(parseFloat(amount) * 1e6)) 
    : BigInt(0);
  const balance = usdcxBalance || BigInt(0);
  const hasInsufficientBalance = balance < amountMicro;
  const hasNoBalance = balance === BigInt(0);

  if (!isConnected) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Connect Your Wallet</CardTitle>
            <CardDescription>Please connect your Stacks wallet to deposit rent</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={connect} variant="primary" className="w-full">
              Connect Stacks Wallet
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex-1 bg-gray-50 relative pattern-dots">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        <div className="mb-8">
          <h1 className="text-4xl font-light text-foreground mb-3 tracking-tight">Deposit Rent</h1>
          <p className="text-gray-600 font-light text-lg">Record a new rent payment with USDCx</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Deposit Card - All in One */}
          <div className="lg:col-span-2">
            <Card className="w-full">
              <CardHeader>
                <CardTitle>Deposit Rent</CardTitle>
                <CardDescription>Record a new rent payment with USDCx</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Property Selector */}
                {propertyIds.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Property
                    </label>
                    <select
                      value={selectedPropertyId?.toString() || ""}
                      onChange={(e) => setSelectedPropertyId(BigInt(e.target.value))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none bg-white"
                    >
                      {propertyIds.map((id) => (
                        <PropertyOption key={id.toString()} propertyId={id} />
                      ))}
                    </select>
                    {selectedPropertyId && (
                      <PropertyInfo propertyId={selectedPropertyId} />
                    )}
                  </div>
                )}
                
                {propertyIds.length === 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-800">
                      <strong>No properties available.</strong> Please mint a property first on the Property page.
                    </p>
                  </div>
                )}

                {/* USDCx Balance Section */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your USDCx Balance
                  </label>
                <div className="bg-gradient-to-r from-primary/10 to-[#06B6D4]/10 rounded-lg p-4 border border-primary/20">
                  <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">Balance:</span>
                    <span className="text-lg font-semibold text-primary">
                        {isLoadingBalance ? "Loading..." : `${formattedBalance} USDCx`}
                    </span>
                  </div>
                    {hasNoBalance && !isLoadingBalance && (
                    <div className="mt-3 pt-3 border-t border-primary/20">
                        <p className="text-xs text-gray-600">
                          <strong>No USDCx in wallet.</strong> You need USDCx tokens to deposit rent.
                      </p>
                      </div>
                    )}
                    </div>
                </div>

                {/* Bridge Section - Inline */}
                {hasNoBalance && !isLoadingBalance && (
                  <div className="border-t border-gray-200 pt-6">
                    <BridgeUSDC inline={true} />
                  </div>
                )}

                {/* Deposit Form Section */}
                <div className="border-t border-gray-200 pt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount to Deposit (USDCx)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none ${
                      hasInsufficientBalance ? "border-red-300 bg-red-50" : "border-gray-300"
                    }`}
                  />
                  {hasInsufficientBalance && (
                    <p className="mt-1 text-sm text-red-600">
                      Insufficient balance. You need {amount} USDCx but only have {formattedBalance} USDCx.
                    </p>
                  )}
                  
                  <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-xs text-blue-800">
                      <strong>Note:</strong> This will transfer USDCx to the rent vault and record the deposit.
                      Make sure you have enough USDCx for the deposit.
                  </p>
                </div>

                  <div className="mt-4">
                  <Button
                    variant="primary"
                      className="w-full"
                    onClick={handleDeposit}
                    isLoading={isDepositing}
                      disabled={hasInsufficientBalance || hasNoBalance || !amount || parseFloat(amount) <= 0 || !selectedPropertyId || propertyIds.length === 0}
                  >
                    Deposit Rent
                  </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment History Sidebar */}
          <div>
            <Card className="w-full">
              <CardHeader>
                <CardTitle>Payment History</CardTitle>
                <CardDescription>
                  {currentPeriod !== undefined 
                    ? `Current Period: ${currentPeriod?.toString() || "0"}` 
                    : "Loading..."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {currentPeriod !== undefined && (
                    <div className="border-b border-gray-200 pb-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium text-foreground">Current Period</p>
                          <p className="text-sm text-gray-500">Period {currentPeriod?.toString() || "0"}</p>
                        </div>
                        <p className="font-semibold text-primary">
                          {rentCollected ? `${(Number(rentCollected) / 1e6).toFixed(6)} USDCx` : "0 USDCx"}
                        </p>
                      </div>
                    </div>
                  )}
                  {currentPeriod === undefined && (
                    <p className="text-gray-500 text-sm">No rent history available</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
