import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import toast from "react-hot-toast";
import { useMounted } from "@/hooks/useMounted";
import { useStacks } from "@/hooks/useStacks";
import { useClaimYieldWallet } from "@/hooks/useStacksWriteWallet";
import { 
  useClaimableYield, 
  useCurrentDistributionPeriod,
} from "@/hooks/useStacksRead";

export default function YieldPage() {
  const { isConnected, connect } = useStacks();
  const mounted = useMounted();
  const [propertyId] = useState(BigInt(1)); // TODO: Get from context or props
  const { claimYield, isPending: isClaiming } = useClaimYieldWallet();
  const { currentPeriod } = useCurrentDistributionPeriod(propertyId);

  // Fetch claimable yield for current period
  const { claimableYield: currentClaimable } = useClaimableYield(
    propertyId,
    currentPeriod !== undefined && currentPeriod !== null ? currentPeriod : undefined
  );

  // For simplicity, show current period data
  // In a production app, you'd want to fetch multiple periods separately
  const periodData = useMemo(() => {
    if (!currentPeriod || currentPeriod === null) return [];
    
    const claimable = (currentClaimable as bigint | undefined) || BigInt(0);
    
    return [{
      period: Number(currentPeriod),
      claimable,
      totalDistributable: BigInt(0), // TODO: Fetch from contract if needed
      claimed: claimable === BigInt(0),
    }];
  }, [currentPeriod, currentClaimable]);

  // Calculate total claimable across all periods
  const totalClaimable = useMemo(() => {
    return periodData.reduce((sum, p) => sum + p.claimable, BigInt(0));
  }, [periodData]);

  const handleClaim = async (period: number) => {
    if (!isConnected) {
      toast.error("Please connect your wallet");
      return;
    }

    try {
      await claimYield(propertyId, BigInt(period));
    } catch (error: any) {
      console.error(error);
      // Error is already handled by the hook
    }
  };

  if (!mounted) {
    return (
      <main className="flex-1 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Connect Your Wallet</CardTitle>
              <CardDescription>Please connect your wallet to view and claim yield</CardDescription>
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

  return (
    <main className="flex-1 bg-gray-50 relative pattern-grid">
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-[#06B6D4]/10 to-primary/10 rounded-full blur-3xl"></div>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        <div className="mb-8">
          <h1 className="text-4xl font-light text-foreground mb-3 tracking-tight">Yield Distribution</h1>
          <p className="text-gray-600 font-light text-lg">View and claim your proportional yield</p>
        </div>

        {/* Total Claimable */}
        <Card className="mb-8 bg-gradient-to-br from-primary/10 via-white to-[#06B6D4]/10 border-0 elevation-2 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/20 to-[#06B6D4]/20 rounded-full blur-2xl"></div>
          <CardHeader className="relative z-10">
            <CardTitle className="text-2xl">Total Claimable Yield</CardTitle>
            <CardDescription>Available across all periods</CardDescription>
          </CardHeader>
          <CardContent className="relative z-10">
            <p className="text-4xl font-light text-primary tracking-tight">
              {totalClaimable > BigInt(0) 
                ? `${(Number(totalClaimable) / 1e6).toFixed(6)} USDCx`
                : "0 USDCx"}
            </p>
          </CardContent>
        </Card>

        {/* Periods List */}
        <div className="space-y-4">
          {periodData.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-gray-500">No distribution periods available yet.</p>
                <p className="text-sm text-gray-400 mt-2">
                  Yield will appear here after distributions are made.
                </p>
              </CardContent>
            </Card>
          ) : (
            periodData.map((pd) => (
              <Card key={pd.period} hover>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>Period {pd.period}</CardTitle>
                      <CardDescription>
                        {pd.claimed ? "Claimed" : (pd.claimable as bigint) > BigInt(0) ? "Available to claim" : "No claimable yield"}
                      </CardDescription>
                    </div>
                    {!pd.claimed && (pd.claimable as bigint) > BigInt(0) && (
                      <Button
                        variant="primary"
                        onClick={() => handleClaim(pd.period)}
                        isLoading={isClaiming}
                      >
                        {isClaiming ? "Claiming..." : "Claim Yield"}
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Your Claimable</p>
                      <p className="text-lg font-semibold text-primary">
                        {(pd.claimable as bigint) > BigInt(0)
                          ? `${(Number(pd.claimable) / 1e6).toFixed(6)} USDCx`
                          : "0 USDCx"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Status</p>
                      <p className={`text-lg font-semibold ${pd.claimed ? "text-gray-500" : (pd.claimable as bigint) > BigInt(0) ? "text-primary" : "text-gray-400"}`}>
                        {pd.claimed ? "Claimed" : (pd.claimable as bigint) > BigInt(0) ? "Available" : "No yield"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </main>
  );
}

